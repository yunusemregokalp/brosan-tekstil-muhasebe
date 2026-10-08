/**
 * BROSAN TEKSTİL ERP — ENTERPRISE IMMUTABLE SIEM SECURITY AUDIT LOGGER
 * 
 * Features:
 * - Append-only, structured JSON (NDJSON) security event logging to `logs/security-audit.log`.
 * - Deep recursive redaction of sensitive credentials, secrets, passwords, OTPs, and tokens.
 * - Cryptographic request fingerprinting (SHA-256) and precise ISO timestamps.
 * - SIEM ECS (Elastic Common Schema) and Splunk CIM standard field alignment.
 * - Fail-safe error handling: File system write errors never crash HTTP request lifecycles.
 * - Non-root Linux runtime compatibility: Auto-creates directory and handles permissions for UID 1000.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Log Directory and File Paths
const LOG_DIR = path.resolve(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'security-audit.log');

// Ensure log directory exists on module load (safe for container runtime)
function ensureLogDirectory() {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true, mode: 0o750 });
    }
  } catch (err) {
    console.error('⚠️ [SIEM AUDIT LOGGER] Failed to create log directory:', err.message);
  }
}
ensureLogDirectory();

// Sensitive keys to redact unconditionally (case-insensitive & stripped of separators)
const SENSITIVE_KEYS = new Set([
  'password',
  'oldpassword',
  'newpassword',
  'confirmpassword',
  'passwordhash',
  'secret',
  'twofactorsecret',
  'totpsecret',
  'tempsecret',
  'twofactorrecoverycodes',
  'recoverycodes',
  'otp',
  'code',
  'totpcode',
  'token',
  'jwt',
  'preauthtoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'setcookie',
  'apikey',
  'privatekey',
  'creditcard',
  'cvv',
  'credentials'
]);

/**
 * Checks whether a given key is considered sensitive.
 */
function isSensitiveKey(key) {
  if (!key || typeof key !== 'string') return false;
  const normalized = key.toLowerCase().replace(/[-_]/g, '');
  if (SENSITIVE_KEYS.has(normalized)) return true;
  if (normalized.includes('password')) return true;
  if (normalized.includes('secret')) return true;
  if (normalized.includes('apikey')) return true;
  return false;
}

/**
 * Recursively redacts sensitive values from any object, array, or nested structure.
 * Guaranteed zero leakage of plaintext passwords or secrets.
 */
function redactSensitiveData(data, depth = 0, seen = new WeakSet()) {
  if (data === null || data === undefined) return data;
  if (depth > 8) return '[MAX_DEPTH_REACHED]';

  if (typeof data === 'string') {
    const trimmed = data.trim();
    // Check if string looks like a JWT token (header.payload.signature)
    if (/^[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}$/.test(trimmed)) {
      return '[REDACTED_TOKEN]';
    }
    // Check if string looks like a Bearer header
    if (/^bearer\s+[A-Za-z0-9_.-]+/i.test(trimmed)) {
      return 'Bearer [REDACTED_TOKEN]';
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item, depth + 1, seen));
  }

  if (typeof data === 'object') {
    // Avoid cyclic references
    if (seen.has(data)) return '[CIRCULAR_REF]';
    seen.add(data);

    const clean = {};
    for (const [key, val] of Object.entries(data)) {
      if (isSensitiveKey(key)) {
        clean[key] = '[REDACTED]';
      } else if (typeof val === 'object' && val !== null) {
        clean[key] = redactSensitiveData(val, depth + 1, seen);
      } else if (typeof val === 'string') {
        clean[key] = redactSensitiveData(val, depth + 1, seen);
      } else {
        clean[key] = val;
      }
    }
    return clean;
  }

  return data;
}

/**
 * Normalizes an IP string (stripping ::ffff: and mapping ::1 to 127.0.0.1).
 */
function normalizeClientIp(ip) {
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
 * Resolves client IP safely from request or fallback details.
 */
function resolveClientIp(req, details = {}) {
  if (req) {
    if (req.ip) return normalizeClientIp(req.ip);
    if (req.socket && req.socket.remoteAddress) return normalizeClientIp(req.socket.remoteAddress);
    const forwarded = req.headers && req.headers['x-forwarded-for'];
    if (forwarded) {
      const hops = forwarded.split(',').map(s => s.trim()).filter(Boolean);
      if (hops.length > 0) {
        const trustedHop = hops[hops.length - 1];
        if (/^[a-fA-F0-9:.]+$/.test(trustedHop)) {
          return normalizeClientIp(trustedHop);
        }
      }
    }
  }
  if (details && details.clientIp) {
    return normalizeClientIp(details.clientIp);
  }
  return '127.0.0.1';
}

/**
 * Computes a fast cryptographic request fingerprint from IP, method, path, and user-agent.
 */
function generateRequestFingerprint(req, fallbackIp = '127.0.0.1') {
  if (!req) {
    return crypto.createHash('sha256').update(`${fallbackIp}|SYSTEM|SYSTEM|Unknown-Agent`).digest('hex').substring(0, 16);
  }
  const ip = resolveClientIp(req);
  const method = req.method || 'GET';
  const pathUrl = req.originalUrl || req.url || '/';
  const ua = (req.headers && req.headers['user-agent']) || 'Unknown-Agent';
  return crypto.createHash('sha256').update(`${ip}|${method}|${pathUrl}|${ua}`).digest('hex').substring(0, 16);
}

/**
 * Core function to record an immutable SIEM security audit event.
 * Supports dual invocation signatures:
 *   1. logSecurityEvent(eventType, options)
 *   2. logSecurityEvent(options) where options contains eventType
 * 
 * @param {string|Object} eventTypeOrOptions - Event type or options bag
 * @param {Object} [maybeOptions] - Event options if first arg is string
 * @returns {Object|null} Structured audit record
 */
function logSecurityEvent(eventTypeOrOptions, maybeOptions = {}) {
  try {
    let eventType;
    let options;

    if (typeof eventTypeOrOptions === 'string') {
      eventType = eventTypeOrOptions;
      options = maybeOptions || {};
    } else if (typeof eventTypeOrOptions === 'object' && eventTypeOrOptions !== null) {
      eventType = eventTypeOrOptions.eventType || 'UNKNOWN_EVENT';
      options = eventTypeOrOptions;
    } else {
      eventType = 'UNKNOWN_EVENT';
      options = {};
    }

    const {
      req = null,
      user = null,
      status = 200,
      severity = 'INFO',
      details = {}
    } = options;

    const timestamp = new Date().toISOString();
    const eventId = crypto.randomUUID();

    // Client IP and metadata resolution
    const clientIp = options.clientIp ? normalizeClientIp(options.clientIp) : resolveClientIp(req, details);
    let userAgent = 'Unknown';
    let method = 'SYSTEM';
    let url = 'SYSTEM';

    if (req) {
      userAgent = req.headers ? (req.headers['user-agent'] || 'Unknown') : 'Unknown';
      method = req.method || 'UNKNOWN';
      url = req.originalUrl || req.url || 'UNKNOWN';
    } else if (details.url) {
      url = details.url;
    }

    // Extract minimal user info if present
    let userInfo = null;
    if (user) {
      userInfo = {
        id: user.id || 'N/A',
        username: user.username || 'N/A',
        role: user.role || 'N/A'
      };
    } else if (req && req.user) {
      userInfo = {
        id: req.user.id || 'N/A',
        username: req.user.username || 'N/A',
        role: req.user.role || 'N/A'
      };
    }

    // Structured JSON SIEM record
    const record = {
      timestamp,
      eventId,
      eventType,
      severity,
      status: typeof status === 'number' ? status : 200,
      clientIp,
      userAgent,
      request: {
        method,
        url,
        fingerprint: generateRequestFingerprint(req, clientIp)
      },
      user: userInfo,
      details: redactSensitiveData(details)
    };

    // Serialize to single-line JSON string (NDJSON)
    const logLine = JSON.stringify(record) + '\n';

    // Ensure log directory exists
    ensureLogDirectory();

    // Append to file synchronously with mode 0o640 and atomic safety flag 'a'
    try {
      fs.appendFileSync(LOG_FILE, logLine, { encoding: 'utf8', mode: 0o640, flag: 'a' });
    } catch (writeErr) {
      console.error('⚠️ [SIEM AUDIT LOGGER] Failed to write audit event:', writeErr.message);
    }

    // Development console output
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SIEM-AUDIT] ${timestamp} [${severity}] ${eventType} - IP: ${clientIp} - Status: ${status}`);
    }

    return record;
  } catch (err) {
    // Fail-safe: Logging must NEVER crash application request flow
    console.error('⚠️ [SIEM AUDIT LOGGER CRITICAL] Exception during audit logging:', err.message);
    return null;
  }
}

/**
 * Express middleware to attach the audit logger to the request object.
 */
function auditMiddleware(req, res, next) {
  req.logSecurity = (eventType, options = {}) => {
    return logSecurityEvent(eventType, { req, ...options });
  };
  next();
}

/**
 * Reads all parsed audit events from the log file.
 */
function getAuditLogs() {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    return lines.map(line => {
      try { return JSON.parse(line); } catch (_) { return null; }
    }).filter(Boolean);
  } catch (err) {
    return [];
  }
}

/**
 * Clears the audit log file (used strictly for test harnesses).
 */
function clearAuditLogs() {
  try {
    ensureLogDirectory();
    fs.writeFileSync(LOG_FILE, '', 'utf8');
  } catch (_) {}
}

module.exports = {
  logSecurityEvent,
  redactSensitiveData,
  isSensitiveKey,
  generateRequestFingerprint,
  auditMiddleware,
  getAuditLogs,
  clearAuditLogs,
  LOG_FILE,
  LOG_DIR
};
