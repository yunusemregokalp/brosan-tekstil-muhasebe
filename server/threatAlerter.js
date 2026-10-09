/**
 * BROSAN TEKSTİL ERP — CITADEL SECURITY HARDENING
 * Layer 1: Real-Time Asynchronous Security Threat & Quarantine Alerter
 * 
 * Features:
 * - Asynchronous, non-blocking in-memory O(1) circular ring buffer queue (< 0.005ms dispatch time)
 * - Scheduled via setImmediate background worker loop
 * - Fail-silent network dispatchers (Webhook & Telegram) with 5000ms timeout
 * - Zero credential leakage: recursive deep redaction, compound key detection, PEM regex, URL query stripping
 * - Bounded 60-second burst deduplication with unref'd TTL reaper and memory capacity bounding
 * - In-memory bounded circular ring buffer for recent alerts
 */

const crypto = require('crypto');

let auditLogger = null;
try {
  auditLogger = require('./auditLogger');
} catch (_) {}

const THREAT_EVENT_TYPES = {
  IP_QUARANTINED: { severity: 'CRITICAL', label: '🛡️ IP Karantinaya Alındı (Fail2ban)' },
  BRUTE_FORCE_LOCKOUT: { severity: 'HIGH', label: '🔒 Brute-Force Hesap/IP Kilidi' },
  REPLAY_ATTACK: { severity: 'CRITICAL', label: '⚠️ TOTP/2FA Replay Saldırısı Tespit Edildi' },
  SENSITIVE_PROBE: { severity: 'CRITICAL', label: '🚨 Hassas Dosya / Dizin Atlama Taraması' },
  BURST_SUMMARY: { severity: 'HIGH', label: '📊 Coalesced Alert Burst Summary' },
  EGRESS_PROHIBITED: { severity: 'CRITICAL', label: '🛑 Yetkisiz Dış Bağlantı / SSRF Girişimi Engellendi' },
  TOKEN_REPLAY_BREACH_DETECTED: { severity: 'CRITICAL', label: '⚠️ Belirteç Yeniden Oynatma İhlali (Token Replay Breach)' },
  POW_CHALLENGE_FAILED: { severity: 'HIGH', label: '🤖 Proof-of-Work Botnet Doğrulama Başarısızlığı' },
  RCE_PROCESS_SPAWN_ATTEMPT_BLOCKED: { severity: 'CRITICAL', label: '🛑 RCE Süreç Başlatma Engellendi (Process Sandboxing)' },
  CANARY_HONEYPOT_TRIPPED: { severity: 'CRITICAL', label: '🪤 Kanarya Bal Küpü Tuzağı Tetiklendi (Honeyfiles Mesh)' }
};

const FORBIDDEN_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'jwt',
  'secret',
  'twofactorsecret',
  'totpsecret',
  'tempsecret',
  'recoverycodes',
  'twofactorrecoverycodes',
  'otp',
  'code',
  'totpcode',
  'authorization',
  'cookie',
  'setcookie',
  'apikey',
  'privatekey',
  'creditcard',
  'cvv',
  'credentials',
  'auth',
  'passphrase',
  'sessionid',
  'session'
]);

function isCredentialKey(normKey) {
  if (FORBIDDEN_KEYS.has(normKey)) return true;
  if (
    normKey.includes('password') ||
    normKey.includes('passphrase') ||
    normKey.includes('secret') ||
    normKey.includes('apikey') ||
    normKey.includes('jwt') ||
    normKey.includes('token') ||
    normKey.includes('cookie') ||
    normKey.includes('session') ||
    normKey.includes('credential') ||
    normKey.includes('creditcard') ||
    normKey.includes('privatekey') ||
    normKey.includes('privkey') ||
    normKey.includes('cvv') ||
    (normKey.includes('auth') && !normKey.includes('author')) ||
    (normKey.includes('code') && !normKey.includes('statuscode') && !normKey.includes('errorcode'))
  ) {
    return true;
  }
  return false;
}

function sanitizeStringValue(str) {
  if (typeof str !== 'string') return str;
  const trimmed = str.trim();
  // Check PEM private key (VULN-M1-02)
  if (/-----BEGIN [A-Z0-9 ]+PRIVATE KEY-----/i.test(trimmed)) {
    return '[REDACTED_PRIVATE_KEY]';
  }
  // Check if string looks like a JWT token
  if (/^[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}$/.test(trimmed)) {
    return '[REDACTED_TOKEN]';
  }
  // Check if string looks like a Bearer header
  if (/^bearer\s+[A-Za-z0-9_.-]+/i.test(trimmed)) {
    return 'Bearer [REDACTED_TOKEN]';
  }
  return trimmed.length > 256 ? trimmed.slice(0, 256) + '...' : trimmed;
}

function sanitizeSummary(summary) {
  if (typeof summary !== 'string') return '';
  let clean = summary.trim().slice(0, 512);
  // Redact PEM private keys
  clean = clean.replace(/-----BEGIN [A-Z0-9 ]+PRIVATE KEY-----[^-]*-----END [A-Z0-9 ]+PRIVATE KEY-----/gi, '[REDACTED_PRIVATE_KEY]');
  clean = clean.replace(/-----BEGIN [A-Z0-9 ]+PRIVATE KEY-----/gi, '[REDACTED_PRIVATE_KEY]');
  // Redact JWT tokens
  clean = clean.replace(/[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g, '[REDACTED_TOKEN]');
  // Redact Bearer headers
  clean = clean.replace(/bearer\s+[A-Za-z0-9_.-]+/gi, 'Bearer [REDACTED_TOKEN]');
  // Redact credentials in key=val or key: val or "password X"
  clean = clean.replace(/(password|passphrase|secret|token|key|cookie|session|credential)[:=\s]+([^\s,;]+)/gi, '$1 [REDACTED]');
  return clean;
}

function sanitizeUrlPath(raw) {
  if (typeof raw !== 'string') return '/';
  const qIdx = raw.indexOf('?');
  const pathOnly = qIdx === -1 ? raw : raw.slice(0, qIdx);
  return pathOnly.length > 256 ? pathOnly.slice(0, 256) + '...' : pathOnly;
}

function normalizeClientIp(ip) {
  if (!ip || typeof ip !== 'string') return '127.0.0.1';
  let clean = ip.trim();
  if (clean.startsWith('::ffff:')) {
    clean = clean.slice(7);
  }
  if (clean === '::1' || clean === 'localhost') {
    return '127.0.0.1';
  }
  return clean;
}

function generateSummary(eventType, clientIp, details = {}) {
  switch (eventType) {
    case 'IP_QUARANTINED':
      return `Client IP ${clientIp} quarantined for ${details.durationSec || 3600} seconds due to ${details.reason || 'SUSPICIOUS_BEHAVIOR'}.`;
    case 'BRUTE_FORCE_LOCKOUT':
      return `Brute-force lockout triggered for ${details.username || 'user'} from IP ${clientIp} (${details.remainingSec || 900}s remaining).`;
    case 'REPLAY_ATTACK':
      return `TOTP/2FA replay attack detected for ${details.username || 'user'} from IP ${clientIp}.`;
    case 'SENSITIVE_PROBE': {
      const probe = details.triggerPath || details.rawUrl || details.path || '/';
      return `Sensitive file / path traversal probe detected from IP ${clientIp} (path: ${sanitizeUrlPath(probe)}).`;
    }
    case 'BURST_SUMMARY':
      return `Alert burst coalesced: ${details.suppressedCount || 0} additional ${details.originalEventType || 'threat'} incidents from IP ${clientIp} suppressed during last 60s.`;
    default:
      return `Security incident ${eventType} detected from IP ${clientIp}.`;
  }
}

/**
 * Fast O(1) Circular Ring Buffer Queue for non-blocking enqueue/dequeue without array shifts.
 */
class FastQueue {
  constructor(capacity = 1000) {
    this.capacity = Math.max(1, capacity);
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  get length() {
    return this.size;
  }

  push(item) {
    if (this.size >= this.capacity) {
      this.buffer[this.head] = undefined;
      this.head = (this.head + 1) % this.capacity;
      this.size--;
    }
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.size++;
  }

  shift() {
    if (this.size === 0) return undefined;
    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this.size--;
    return item;
  }

  clear() {
    for (let i = 0; i < this.capacity; i++) {
      this.buffer[i] = undefined;
    }
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }
}

class ThreatAlerter {
  constructor(options = {}) {
    this.telegramBotToken = options.telegramBotToken || null;
    this.telegramChatId = options.telegramChatId || null;
    this.webhookUrl = options.webhookUrl || null;
    this.dedupWindowMs = options.dedupWindowMs || (process.env.ALERT_DEDUP_WINDOW_MS ? parseInt(process.env.ALERT_DEDUP_WINDOW_MS, 10) : 60000);
    this.maxQueueSize = options.maxQueueSize || (process.env.ALERT_MAX_QUEUE_SIZE ? parseInt(process.env.ALERT_MAX_QUEUE_SIZE, 10) : 1000);
    this.maxRecentAlerts = options.maxRecentAlerts || 100;
    this.maxDedupEntries = options.maxDedupEntries || 5000;
    this.timeoutMs = options.timeoutMs || (process.env.ALERT_DISPATCH_TIMEOUT_MS ? parseInt(process.env.ALERT_DISPATCH_TIMEOUT_MS, 10) : 5000);

    this.queue = new FastQueue(this.maxQueueSize);
    this.recentAlerts = [];
    this.dedupMap = new Map();
    this.reaperInterval = null;
    this.isProcessing = false;
    this.isClosed = false;
    this.totalDispatched = 0;
    this.totalDropped = 0;
  }

  /**
   * Deep recursive sanitization ensuring ZERO plaintext credential leakage.
   */
  sanitizeDetails(details, depth = 0, seen = new WeakSet()) {
    if (!details || typeof details !== 'object') return {};
    if (depth > 6) return '[MAX_DEPTH]';
    if (seen.has(details)) return '[CIRCULAR_REF]';
    seen.add(details);

    // 1. If auditLogger is available, apply its redactSensitiveData
    let raw = details;
    if (auditLogger && typeof auditLogger.redactSensitiveData === 'function') {
      try {
        raw = auditLogger.redactSensitiveData(details);
      } catch (_) {
        raw = details;
      }
    }

    const clean = {};
    for (const [key, val] of Object.entries(raw)) {
      const normKey = key.toLowerCase().replace(/[-_]/g, '');

      // Check forbidden credential keys (VULN-M1-01)
      if (isCredentialKey(normKey)) {
        clean[key] = '[REDACTED]';
        continue;
      }

      // Check URL and probe path fields to strip query strings (VULN-M1-03)
      if (typeof val === 'string' && (normKey === 'rawurl' || normKey === 'triggerpath' || normKey === 'path' || normKey === 'url' || normKey === 'probepath')) {
        clean[key] = sanitizeUrlPath(val);
        continue;
      }

      // Check string values (PEM key, JWT, Bearer)
      if (typeof val === 'string') {
        clean[key] = sanitizeStringValue(val);
      } else if (typeof val === 'number' || typeof val === 'boolean') {
        clean[key] = val;
      } else if (val === null || val === undefined) {
        clean[key] = null;
      } else if (Array.isArray(val)) {
        // VULN-M1-05: apply sanitizeStringValue to string items in arrays
        clean[key] = val.map(item => {
          if (typeof item === 'object' && item !== null) {
            return this.sanitizeDetails(item, depth + 1, seen);
          }
          if (typeof item === 'string') {
            return sanitizeStringValue(item);
          }
          return item;
        });
      } else if (typeof val === 'object') {
        clean[key] = this.sanitizeDetails(val, depth + 1, seen);
      }
    }

    return clean;
  }

  /**
   * Starts periodic TTL reaper for coalescing burst summaries without per-alert timers.
   */
  startReaper() {
    if (!this.reaperInterval && !this.isClosed) {
      const period = Math.min(25, Math.max(10, Math.floor(this.dedupWindowMs / 4)));
      this.reaperInterval = setInterval(() => {
        this.reapExpiredDedup();
      }, period);
      if (this.reaperInterval.unref) {
        this.reaperInterval.unref();
      }
    }
  }

  /**
   * Sweeps expired dedup entries and triggers burst summaries.
   */
  reapExpiredDedup() {
    if (this.dedupMap.size === 0) return;
    const now = Date.now();
    for (const [key, entry] of this.dedupMap.entries()) {
      if (now >= entry.expiresAt) {
        this.flushCoalescedBurst(key);
      }
    }
  }

  /**
   * Primary entry point: synchronous, non-blocking alert dispatcher (<0.005ms).
   */
  dispatchAlert(eventType, data = {}) {
    try {
      const clientIp = normalizeClientIp(data.clientIp || data.ip);
      const typeConfig = THREAT_EVENT_TYPES[eventType] || { severity: data.severity || 'HIGH', label: eventType };
      const severity = data.severity || typeConfig.severity;

      // Fast UUID generation
      const alertId = crypto.randomUUID();

      // 60-Second Burst Deduplication (bypass for BURST_SUMMARY)
      if (eventType !== 'BURST_SUMMARY') {
        const dedupKey = `${eventType}:${clientIp}`;
        const existing = this.dedupMap.get(dedupKey);
        const now = Date.now();

        if (existing) {
          if (now < existing.expiresAt) {
            existing.suppressedCount++;
            existing.lastSeen = now;
            return {
              enqueued: false,
              deduplicated: true,
              alertId: existing.alertId,
              suppressedCount: existing.suppressedCount
            };
          } else {
            // Expired burst window
            this.flushCoalescedBurst(dedupKey);
          }
        }

        // Capacity bound enforcement (max 5000 entries)
        if (this.dedupMap.size >= this.maxDedupEntries) {
          this.reapExpiredDedup();
          if (this.dedupMap.size >= this.maxDedupEntries) {
            const oldestKey = this.dedupMap.keys().next().value;
            if (oldestKey) {
              this.flushCoalescedBurst(oldestKey);
            }
          }
        }

        this.startReaper();

        this.dedupMap.set(dedupKey, {
          firstSeen: now,
          lastSeen: now,
          expiresAt: now + this.dedupWindowMs,
          suppressedCount: 0,
          eventType,
          clientIp,
          alertId
        });
      }

      const rawDetails = (data.details !== undefined && typeof data.details === 'object' && data.details !== null)
        ? data.details
        : data;

      const sanitizedDetails = this.sanitizeDetails(rawDetails);
      delete sanitizedDetails.clientIp;
      delete sanitizedDetails.ip;
      delete sanitizedDetails.eventType;
      delete sanitizedDetails.severity;

      // Strip query parameters from probe path fields if present in data
      if (typeof data.path === 'string') {
        sanitizedDetails.path = sanitizeUrlPath(data.path);
      }
      if (typeof data.rawUrl === 'string') {
        sanitizedDetails.rawUrl = sanitizeUrlPath(data.rawUrl);
      }
      if (typeof data.triggerPath === 'string') {
        sanitizedDetails.triggerPath = sanitizeUrlPath(data.triggerPath);
      }

      // Sanitize summary (VULN-M1-04)
      const summary = (typeof data.summary === 'string' && data.summary.trim().length > 0)
        ? sanitizeSummary(data.summary)
        : generateSummary(eventType, clientIp, sanitizedDetails);

      const alert = {
        schema: 'brosan.security.threat-alert/v1',
        alertId,
        timestamp: new Date().toISOString(),
        eventType,
        severity,
        clientIp,
        summary,
        details: sanitizedDetails
      };

      // Enqueue to O(1) FastQueue
      if (this.queue.length >= this.maxQueueSize) {
        this.queue.shift(); // Drop oldest item to respect memory boundary
        this.totalDropped++;
      }
      this.queue.push(alert);

      // Trigger background worker if idle
      if (!this.isProcessing && !this.isClosed) {
        this.isProcessing = true;
        setImmediate(() => this.processQueue());
      }

      return {
        enqueued: true,
        deduplicated: false,
        alertId
      };
    } catch (err) {
      // Must fail safe without throwing
      return {
        enqueued: false,
        error: err.message
      };
    }
  }

  /**
   * Flushes a coalesced burst after deduplication cooldown timer expires.
   */
  flushCoalescedBurst(dedupKey) {
    const entry = this.dedupMap.get(dedupKey);
    if (!entry) return;
    this.dedupMap.delete(dedupKey);

    if (entry.suppressedCount > 0) {
      this.dispatchAlert('BURST_SUMMARY', {
        clientIp: entry.clientIp,
        originalEventType: entry.eventType,
        suppressedCount: entry.suppressedCount,
        firstSeen: new Date(entry.firstSeen).toISOString(),
        lastSeen: new Date(entry.lastSeen).toISOString(),
        summary: `Alert burst coalesced: ${entry.suppressedCount} additional ${entry.eventType} incidents from IP ${entry.clientIp} suppressed during last 60s.`
      });
    }
  }

  /**
   * Asynchronous background queue processor.
   */
  async processQueue() {
    if (this.isClosed) {
      this.isProcessing = false;
      return;
    }

    try {
      while (this.queue.length > 0) {
        const alert = this.queue.shift();
        if (!alert) continue;

        // Record to bounded ring buffer
        this.recentAlerts.push(alert);
        if (this.recentAlerts.length > this.maxRecentAlerts) {
          this.recentAlerts.shift();
        }

        this.totalDispatched++;

        // Asynchronous, fail-silent network calls with AbortSignal.timeout
        try {
          await Promise.allSettled([
            this.sendTelegram(alert),
            this.sendWebhook(alert)
          ]);
        } catch (_) {
          // Network errors must fail silently
        }
      }
    } finally {
      if (this.queue.length > 0 && !this.isClosed) {
        setImmediate(() => this.processQueue());
      } else {
        this.isProcessing = false;
      }
    }
  }

  /**
   * HTML escape helper for safe Telegram formatting.
   */
  escapeHtml(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Formats structured alert into clean Telegram HTML message.
   * Enforces 4000-character ceiling to adhere to Telegram's 4096-char limit.
   */
  formatTelegramMessage(alert) {
    let msg = `<b>🛡️ BROSAN ERP SİBER GÜVENLİK TEHDİT ALARMI</b>\n` +
      `<b>Olay:</b> <code>${this.escapeHtml(alert.eventType)}</code>\n` +
      `<b>Seviye:</b> <b>${this.escapeHtml(alert.severity)}</b>\n` +
      `<b>İstemci IP:</b> <code>${this.escapeHtml(alert.clientIp)}</code>\n` +
      `<b>Zaman:</b> <code>${this.escapeHtml(alert.timestamp)}</code>\n` +
      `<b>Özet:</b> ${this.escapeHtml(alert.summary)}\n`;

    if (alert.details && typeof alert.details === 'object' && Object.keys(alert.details).length > 0) {
      try {
        const detailsJson = JSON.stringify(alert.details, null, 2);
        msg += `<b>Detaylar:</b>\n<pre>${this.escapeHtml(detailsJson)}</pre>\n`;
      } catch (_) {}
    }

    if (msg.length > 4000) {
      msg = msg.slice(0, 3980) + '\n... [TRUNCATED]';
    }

    return msg;
  }

  /**
   * Dispatches alert to Telegram Bot API.
   */
  async sendTelegram(alert) {
    const token = this.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = this.telegramChatId || process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      return { skipped: true };
    }

    try {
      const text = this.formatTelegramMessage(alert);
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML'
        }),
        signal: AbortSignal.timeout(this.timeoutMs)
      });
      return { ok: response.ok, status: response.status };
    } catch (err) {
      // Fail-silent
      return { ok: false, error: err.message };
    }
  }

  /**
   * Dispatches alert to custom Security Webhook endpoint.
   */
  async sendWebhook(alert) {
    const webhookUrl = this.webhookUrl || process.env.SECURITY_WEBHOOK_URL;
    if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('http')) {
      return { skipped: true };
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Brosan-Citadel-ThreatAlerter/1.0',
          'X-Brosan-Alert-Event': alert.eventType,
          'X-Brosan-Alert-Severity': alert.severity
        },
        body: JSON.stringify(alert),
        signal: AbortSignal.timeout(this.timeoutMs)
      });
      return { ok: response.ok, status: response.status };
    } catch (err) {
      // Fail-silent
      return { ok: false, error: err.message };
    }
  }

  /**
   * Helper: Dispatch IP_QUARANTINED alert.
   */
  alertIpQuarantined(clientIp, details = {}) {
    return this.dispatchAlert('IP_QUARANTINED', {
      clientIp,
      details
    });
  }

  /**
   * Helper: Dispatch BRUTE_FORCE_LOCKOUT alert.
   */
  alertBruteForceLockout(clientIp, username, details = {}) {
    return this.dispatchAlert('BRUTE_FORCE_LOCKOUT', {
      clientIp,
      details: {
        username,
        ...details
      }
    });
  }

  /**
   * Helper: Dispatch REPLAY_ATTACK alert.
   */
  alertReplayAttack(clientIp, username, details = {}) {
    return this.dispatchAlert('REPLAY_ATTACK', {
      clientIp,
      details: {
        username,
        ...details
      }
    });
  }

  /**
   * Helper: Dispatch SENSITIVE_PROBE alert.
   */
  alertSensitiveProbe(clientIp, path, details = {}) {
    return this.dispatchAlert('SENSITIVE_PROBE', {
      clientIp,
      path,
      details: {
        triggerPath: path,
        ...details
      }
    });
  }

  /**
   * Returns recent alerts from circular buffer.
   */
  getRecentAlerts(limit = 50) {
    const n = Math.max(1, parseInt(limit, 10) || 50);
    return this.recentAlerts.slice(-n);
  }

  /**
   * Returns current queue diagnostics.
   */
  getQueueStats() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      recentCount: this.recentAlerts.length,
      dedupActiveKeys: this.dedupMap.size,
      totalDispatched: this.totalDispatched,
      totalDropped: this.totalDropped
    };
  }

  /**
   * Optional subscription hook for audit logger.
   */
  attachToAuditLogger(logger) {
    if (logger && typeof logger.onSecurityEvent === 'function') {
      logger.onSecurityEvent((event) => {
        if (['IP_QUARANTINED', 'BRUTE_FORCE_LOCKOUT', 'REPLAY_ATTACK', 'SENSITIVE_PROBE'].includes(event.eventType)) {
          this.dispatchAlert(event.eventType, {
            clientIp: event.clientIp,
            details: event.details
          });
        }
      });
    }
  }

  /**
   * Resets queue, ring buffer, and deduplication map (for testing).
   */
  reset() {
    if (this.queue) this.queue.clear();
    this.recentAlerts = [];
    this.dedupMap.clear();
    if (this.reaperInterval) {
      clearInterval(this.reaperInterval);
      this.reaperInterval = null;
    }
    this.isProcessing = false;
    this.totalDispatched = 0;
    this.totalDropped = 0;
  }

  /**
   * Emergency alert dispatch helper with CRITICAL severity.
   */
  alertEmergency(eventType, clientIpOrData = {}, detailsStrOrObj = {}) {
    let clientIp = '127.0.0.1';
    let details = {};
    if (typeof clientIpOrData === 'string') {
      clientIp = clientIpOrData;
      if (typeof detailsStrOrObj === 'string') {
        details = { message: detailsStrOrObj };
      } else if (typeof detailsStrOrObj === 'object' && detailsStrOrObj !== null) {
        details = detailsStrOrObj;
      }
    } else if (typeof clientIpOrData === 'object' && clientIpOrData !== null) {
      clientIp = clientIpOrData.clientIp || clientIpOrData.ip || '127.0.0.1';
      details = clientIpOrData.details || clientIpOrData;
    }
    return this.dispatchAlert(eventType, {
      clientIp,
      severity: 'CRITICAL',
      details
    });
  }

  /**
   * Closes and stops all timers.
   */
  close() {
    this.isClosed = true;
    this.reset();
  }
}

const defaultInstance = new ThreatAlerter();

module.exports = defaultInstance;
module.exports.threatAlerter = defaultInstance;
module.exports.ThreatAlerter = ThreatAlerter;
module.exports.THREAT_EVENT_TYPES = THREAT_EVENT_TYPES;
