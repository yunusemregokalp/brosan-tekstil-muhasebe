/**
 * BROSAN TEKSTİL ERP — DYNAMIC IP QUARANTINE ENGINE (FAIL2BAN SHIELD)
 * 
 * Features:
 * - Bounded LRU in-memory table (max 10,000 entries) preventing Memory Exhaustion DoS
 * - Configurable Quarantine TTL (default 1 hour = 3,600,000 ms)
 * - Anti-IP-Spoofing & IPv4-mapped IPv6 normalization (strip ::ffff:, map ::1 -> 127.0.0.1)
 * - Immutable loopback whitelist protecting Docker container healthchecks (127.0.0.1, ::1, localhost)
 * - Durable persistence to data/quarantined_ips.json with debounced disk I/O (1-second coalescing)
 * - Express Gatekeeper Middleware returning HTTP 403 IP_QUARANTINED with standard headers
 */

const fs = require('fs');
const path = require('path');
const auditLogger = require('./auditLogger');

let cachedThreatAlerter = null;
function getThreatAlerter() {
  if (cachedThreatAlerter === null) {
    try {
      cachedThreatAlerter = require('./threatAlerter');
    } catch (_) {
      cachedThreatAlerter = false;
    }
  }
  return cachedThreatAlerter || null;
}

const QUARANTINE_FILE = path.join(__dirname, '..', 'data', 'quarantined_ips.json');
const DEFAULT_TTL_MS = parseInt(process.env.IP_QUARANTINE_TTL_MS, 10) || 60 * 60 * 1000; // 1 hour (3,600,000 ms)
const MAX_ENTRIES = parseInt(process.env.IP_QUARANTINE_MAX_ENTRIES, 10) || 10000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Immutable loopback whitelist to protect Docker HEALTHCHECK and test harnesses
const STATIC_WHITELIST = new Set(['127.0.0.1', '::1', 'localhost', '0.0.0.0']);

class BoundedLruQuarantineEngine {
  constructor(options = {}) {
    this.maxEntries = options.maxEntries || MAX_ENTRIES;
    this.defaultTtlMs = options.defaultTtlMs || DEFAULT_TTL_MS;
    this.filePath = options.filePath || QUARANTINE_FILE;
    this.persistDelayMs = options.persistDelayMs !== undefined ? options.persistDelayMs : 1000;
    this.cache = new Map(); // ip -> { ip, quarantinedAt, lastQuarantinedAt, expiresAt, reason, triggerPath, count }
    this.persistTimeout = null;

    this.loadFromDisk();

    // Background garbage collection timer (unref'd to avoid holding event loop open)
    const sweepMs = options.sweepIntervalMs || SWEEP_INTERVAL_MS;
    this.sweepTimer = setInterval(() => this.pruneExpired(), sweepMs);
    if (this.sweepTimer.unref) this.sweepTimer.unref();
  }

  /**
   * Normalizes an IP string:
   * - Strips IPv4-mapped IPv6 prefix '::ffff:'
   * - Maps '::1' to '127.0.0.1'
   * - Strips IPv6 enclosing brackets if present
   */
  normalizeIp(ip) {
    if (!ip || typeof ip !== 'string') return '127.0.0.1';
    let clean = ip.trim();
    if (clean.startsWith('[') && clean.endsWith(']')) {
      clean = clean.substring(1, clean.length - 1);
    }
    if (clean.startsWith('::ffff:')) {
      clean = clean.substring(7);
    }
    if (clean === '::1') {
      return '127.0.0.1';
    }
    return clean;
  }

  /**
   * Checks whether the given IP is immune to quarantine.
   */
  isWhitelisted(ip) {
    const norm = this.normalizeIp(ip);
    if (STATIC_WHITELIST.has(norm)) return true;
    if (process.env.IP_QUARANTINE_WHITELIST) {
      const customList = process.env.IP_QUARANTINE_WHITELIST.split(',').map(s => this.normalizeIp(s.trim()));
      if (customList.includes(norm)) return true;
    }
    return false;
  }

  /**
   * Checks quarantine status for an IP.
   * If expired, lazily deletes the record.
   * If active, moves to the MRU position (LRU cache behavior).
   */
  isQuarantined(rawIp) {
    const ip = this.normalizeIp(rawIp);
    if (this.isWhitelisted(ip)) {
      return { quarantined: false };
    }

    const record = this.cache.get(ip);
    if (!record) {
      return { quarantined: false };
    }

    const now = Date.now();
    if (record.expiresAt <= now) {
      this.cache.delete(ip);
      this.schedulePersist();
      return { quarantined: false };
    }

    // LRU refresh: delete and re-insert to position at MRU (most recently used)
    this.cache.delete(ip);
    this.cache.set(ip, record);

    const remainingSec = Math.max(1, Math.ceil((record.expiresAt - now) / 1000));
    return {
      quarantined: true,
      remainingSec,
      expiresAt: new Date(record.expiresAt).toISOString(),
      reason: record.reason,
      triggerPath: record.triggerPath,
      count: record.count
    };
  }

  /**
   * Adds or extends an IP in the quarantine table.
   * Returns the record or null if the IP is whitelisted.
   */
  quarantineIp(rawIp, reason = 'ADVERSARIAL_ACTIVITY', details = {}) {
    const ip = this.normalizeIp(rawIp);
    if (this.isWhitelisted(ip)) {
      return null; // Whitelisted loopback addresses are NEVER quarantined
    }

    const now = Date.now();
    const ttl = details.ttlMs || this.defaultTtlMs;
    const expiresAt = now + ttl;

    // Evict oldest entry (O(1) LRU eviction) if reaching capacity
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const existing = this.cache.get(ip);
    const count = existing ? (existing.count || 1) + 1 : 1;

    const record = {
      ip,
      quarantinedAt: existing ? existing.quarantinedAt : now,
      lastQuarantinedAt: now,
      expiresAt,
      reason: reason || (existing ? existing.reason : 'ADVERSARIAL_ACTIVITY'),
      triggerPath: details.path || (existing ? existing.triggerPath : null),
      count
    };

    // Setting updates or places the key at the MRU end
    if (existing) {
      this.cache.delete(ip);
    }
    this.cache.set(ip, record);

    const isoExpiresAt = new Date(expiresAt).toISOString();

    setImmediate(() => {
      try {
        auditLogger.logSecurityEvent('IP_QUARANTINED', {
          severity: 'CRITICAL',
          status: 403,
          clientIp: ip,
          details: {
            ip,
            reason: record.reason,
            count: record.count,
            triggerPath: record.triggerPath,
            expiresAt: isoExpiresAt,
            ...details
          }
        });
      } catch (_) {}
    });

    const alerter = getThreatAlerter();
    if (alerter && typeof alerter.alertIpQuarantined === 'function') {
      try {
        alerter.alertIpQuarantined(ip, {
          reason: record.reason,
          count: record.count,
          triggerPath: record.triggerPath,
          durationSec: Math.round(ttl / 1000),
          expiresAt: isoExpiresAt,
          ...details
        });
      } catch (_) {}
    }

    this.schedulePersist();
    return record;
  }

  /**
   * Explicitly removes an IP from quarantine.
   */
  unquarantineIp(rawIp) {
    const ip = this.normalizeIp(rawIp);
    const deleted = this.cache.delete(ip);
    if (deleted) {
      this.schedulePersist();
    }
    return deleted;
  }

  /**
   * Purges all expired entries from cache.
   */
  pruneExpired() {
    const now = Date.now();
    let pruned = 0;
    for (const [ip, record] of this.cache.entries()) {
      if (record.expiresAt <= now) {
        this.cache.delete(ip);
        pruned++;
      }
    }
    if (pruned > 0) {
      this.schedulePersist();
    }
    return pruned;
  }

  /**
   * Debounced persistence scheduler coalescing rapid updates into a single write.
   */
  schedulePersist() {
    if (this.persistTimeout) return;
    this.persistTimeout = setTimeout(() => {
      this.persistTimeout = null;
      this.saveToDisk();
    }, this.persistDelayMs);
    if (this.persistTimeout.unref) {
      this.persistTimeout.unref();
    }
  }

  /**
   * Synchronously writes active, non-expired records to disk.
   */
  saveToDisk() {
    try {
      const now = Date.now();
      const active = [];
      for (const record of this.cache.values()) {
        if (record.expiresAt > now) {
          active.push(record);
        }
      }
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(active, null, 2), 'utf8');
    } catch (err) {
      console.warn('⚠️ [GÜVENLİK/QUARANTINE] Kara liste diske yazılamadı:', err.message);
    }
  }

  /**
   * Loads persisted active quarantine records on startup.
   */
  loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        if (!raw.trim()) return;
        const data = JSON.parse(raw);
        const now = Date.now();
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item && item.ip && item.expiresAt && item.expiresAt > now) {
              const norm = this.normalizeIp(item.ip);
              if (!this.isWhitelisted(norm)) {
                this.cache.set(norm, {
                  ip: norm,
                  quarantinedAt: item.quarantinedAt || now,
                  lastQuarantinedAt: item.lastQuarantinedAt || now,
                  expiresAt: item.expiresAt,
                  reason: item.reason || 'PERSISTED_QUARANTINE',
                  triggerPath: item.triggerPath || null,
                  count: item.count || 1
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ [GÜVENLİK/QUARANTINE] Kara liste diskten yüklenemedi:', err.message);
    }
  }

  /**
   * Returns all active quarantine records.
   */
  getAll() {
    const now = Date.now();
    const active = [];
    for (const record of this.cache.values()) {
      if (record.expiresAt > now) {
        active.push(record);
      }
    }
    return active;
  }

  /**
   * Clears all in-memory entries and flushes the disk file.
   */
  clear() {
    this.cache.clear();
    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout);
      this.persistTimeout = null;
    }
    this.saveToDisk();
  }

  /**
   * Stops background sweep interval and flushes disk persistence.
   */
  close() {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout);
      this.persistTimeout = null;
      this.saveToDisk();
    }
  }
}

// Global engine singleton
const quarantineEngine = new BoundedLruQuarantineEngine();

/**
 * Express Gatekeeper Middleware
 * Intercepts requests immediately after Host header validation.
 * Quarantined IPs are rejected with HTTP 403 IP_QUARANTINED.
 */
function quarantineGuard(req, res, next) {
  // Extract client IP safely (express trust proxy aware)
  let rawIp = req.ip;
  if (!rawIp && req.socket && req.socket.remoteAddress) {
    rawIp = req.socket.remoteAddress;
  }
  if (!rawIp) {
    const forwarded = req.headers && req.headers['x-forwarded-for'];
    if (forwarded) {
      const hops = forwarded.split(',').map(s => s.trim()).filter(Boolean);
      if (hops.length > 0) {
        rawIp = hops[hops.length - 1];
      }
    }
  }
  if (!rawIp) {
    rawIp = '127.0.0.1';
  }

  const check = quarantineEngine.isQuarantined(rawIp);

  if (check.quarantined) {
    auditLogger.logSecurityEvent('IP_BLOCKED', {
      req,
      severity: 'WARN',
      status: 403,
      clientIp: rawIp,
      details: {
        ip: rawIp,
        reason: check.reason,
        remainingSec: check.remainingSec,
        expiresAt: check.expiresAt
      }
    });

    res.setHeader('Retry-After', String(check.remainingSec));
    res.setHeader('X-Quarantine-Status', 'ACTIVE');
    res.setHeader('X-Quarantine-Remaining', String(check.remainingSec));
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    return res.status(403).json({
      success: false,
      error: 'Erişim engellendi: IP adresiniz şüpheli/saldırgan aktiviteler nedeniyle karantinaya alınmıştır.',
      code: 'IP_QUARANTINED',
      quarantined: true,
      remainingSec: check.remainingSec,
      expiresAt: check.expiresAt,
      reason: check.reason
    });
  }

  next();
}

module.exports = {
  quarantineEngine,
  quarantineGuard,
  BoundedLruQuarantineEngine,
  STATIC_WHITELIST
};
