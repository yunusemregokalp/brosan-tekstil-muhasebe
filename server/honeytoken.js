/**
 * BROSAN TEKSTİL ERP — APEX CITADEL ACTIVE DEFENSE
 * Layer 1: Honeytoken Traps & Active Honeypot Decoys (Phase 5)
 * 
 * Features:
 * - Decoy routes: /api/v1/admin/export-database, /api/users/superadmin/reset-password, /admin_backup.sql, /config.json
 * - Decoy parameters: __debug_backdoor, root_access_key (inspected across query, body, and headers)
 * - Zero false positives: Interaction with honeytokens indicates 100% adversarial intent
 * - Immediate 24-hour IP quarantine (86,400,000 ms) via quarantineEngine
 * - Real-time critical threat alert dispatch via threatAlerter
 * - Immutable SIEM audit logging (HONEYPOT_TRIGGERED)
 * - Hardened HTTP 403 HONEYPOT_TRIGGERED response with active defense headers
 */

const crypto = require('crypto');
const auth = require('./auth');
const { quarantineEngine } = require('./quarantine');
const threatAlerter = require('./threatAlerter');
const auditLogger = require('./auditLogger');

const HONEYPOT_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours = 86,400,000 ms

// Canonical Decoy Routes (Normalized to lower-case without /muhasebe)
const DECOY_ROUTES = new Set([
  '/api/v1/admin/export-database',
  '/api/users/superadmin/reset-password',
  '/admin_backup.sql',
  '/config.json'
]);

// Canonical Decoy Parameters
const DECOY_PARAMS = new Set([
  '__debug_backdoor',
  'root_access_key'
]);

/**
 * Normalizes a URL path for route matching:
 * - Strips query strings (?...) and hash anchors (#...)
 * - Performs dual URI decoding
 * - Strips /muhasebe subpath prefix
 * - Normalizes slashes and lowercases
 */
function normalizePath(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '/';
  let pathOnly = rawUrl.split('?')[0].split('#')[0];
  try {
    pathOnly = decodeURIComponent(pathOnly);
  } catch (_) {}
  try {
    if (pathOnly.includes('%')) {
      pathOnly = decodeURIComponent(pathOnly);
    }
  } catch (_) {}

  let clean = pathOnly.trim().toLowerCase().replace(/\\/g, '/');
  // Collapse consecutive slashes
  clean = clean.replace(/\/+/g, '/');

  if (clean.startsWith('/muhasebe')) {
    clean = clean.substring('/muhasebe'.length) || '/';
  }
  // Strip trailing slashes unless it's root
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

/**
 * Recursively inspects an object for decoy parameter keys.
 */
function hasDecoyParam(obj, seen = new WeakSet(), depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 8) return null;
  if (seen.has(obj)) return null;
  seen.add(obj);

  const keys = Object.keys(obj);
  for (const key of keys) {
    const cleanKey = key.trim().toLowerCase();
    if (DECOY_PARAMS.has(cleanKey)) {
      return key;
    }
    const val = obj[key];
    if (val && typeof val === 'object') {
      const found = hasDecoyParam(val, seen, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Triggers honeypot active defense response:
 * 1. 24-hour IP quarantine in quarantineEngine
 * 2. Immutable SIEM audit logging (HONEYPOT_TRIGGERED)
 * 3. Real-time high-priority threat alert via threatAlerter
 * 4. Hardened HTTP 403 HONEYPOT_TRIGGERED response
 */
function triggerHoneypot(req, res, { trapType, trapTarget }) {
  const clientIp = auth.getClientIp(req);
  const incidentId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  // 1. Enroll IP into 24-Hour Quarantine (86,400,000 ms)
  const qRecord = quarantineEngine.quarantineIp(clientIp, 'HONEYPOT_TRIGGERED', {
    trapType,
    trapTarget,
    triggerPath: req.originalUrl || req.url,
    ttlMs: HONEYPOT_TTL_MS,
    durationSec: 86400,
    incidentId
  });
  const isQuarantined = !!qRecord;

  // 2. Immutable SIEM Security Audit Log
  try {
    auditLogger.logSecurityEvent('HONEYPOT_TRIGGERED', {
      req,
      severity: 'CRITICAL',
      status: 403,
      clientIp,
      details: {
        trapType,
        trapTarget,
        triggerPath: req.originalUrl || req.url,
        method: req.method,
        incidentId,
        quarantined: isQuarantined,
        quarantineDurationSec: 86400
      }
    });
  } catch (_) {}

  // 3. Real-Time High-Priority Threat Alert
  if (threatAlerter && typeof threatAlerter.dispatchAlert === 'function') {
    try {
      threatAlerter.dispatchAlert('HONEYPOT_TRIGGERED', {
        clientIp,
        severity: 'CRITICAL',
        summary: `🚨 YÜKSEK ÖNCELİK: Honeypot aktif savunma tuzağı tetiklendi (${trapType}: ${trapTarget}). İstemci IP: ${clientIp}. 24 saatlik karantina uygulandı.`,
        details: {
          trapType,
          trapTarget,
          triggerPath: req.originalUrl || req.url,
          method: req.method,
          incidentId,
          quarantined: isQuarantined,
          quarantineDurationSec: 86400
        }
      });
    } catch (_) {}
  }

  // 4. Return HTTP 403 HONEYPOT_TRIGGERED with Active Defense Headers
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Honeypot-Defense', 'TRIGGERED');
  res.setHeader('X-Active-Defense', 'HONEYPOT_TRIGGERED');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (isQuarantined) {
    res.setHeader('Retry-After', '86400');
    res.setHeader('X-Quarantine-Status', 'ACTIVE');
    res.setHeader('X-Quarantine-Remaining', '86400');
  }

  return res.status(403).json({
    success: false,
    error: 'Erişim engellendi: Güvenlik tuzağı tetiklendi (Active Defense Honeypot Triggered).',
    code: 'HONEYPOT_TRIGGERED',
    trapType,
    trapTarget,
    incidentId,
    quarantined: isQuarantined,
    quarantineDurationSec: 86400,
    timestamp
  });
}

/**
 * Route Traps Guard — Mount BEFORE sensitive file blocker
 */
function honeytokenRouteGuard(req, res, next) {
  const normPath = normalizePath(req.originalUrl || req.url);
  if (DECOY_ROUTES.has(normPath)) {
    return triggerHoneypot(req, res, { trapType: 'DECOY_ROUTE', trapTarget: normPath });
  }
  next();
}

/**
 * Parameter Traps Guard — Mount AFTER body parsers, BEFORE heuristicWaf
 */
function honeytokenParamGuard(req, res, next) {
  // 1. Query parameters
  if (req.query) {
    const matched = hasDecoyParam(req.query);
    if (matched) {
      return triggerHoneypot(req, res, { trapType: 'DECOY_PARAMETER', trapTarget: matched });
    }
  }

  // 2. Request body
  if (req.body) {
    const matched = hasDecoyParam(req.body);
    if (matched) {
      return triggerHoneypot(req, res, { trapType: 'DECOY_PARAMETER', trapTarget: matched });
    }
  }

  // 3. Raw URL query string inspection (defense in depth)
  const rawUrl = req.originalUrl || req.url || '';
  if (rawUrl.includes('__debug_backdoor') || rawUrl.includes('root_access_key')) {
    const target = rawUrl.includes('__debug_backdoor') ? '__debug_backdoor' : 'root_access_key';
    return triggerHoneypot(req, res, { trapType: 'DECOY_PARAMETER', trapTarget: target });
  }

  // 4. Headers inspection
  if (req.headers) {
    if (req.headers['__debug_backdoor'] !== undefined || req.headers['x-debug-backdoor'] !== undefined) {
      return triggerHoneypot(req, res, { trapType: 'DECOY_PARAMETER', trapTarget: '__debug_backdoor' });
    }
    if (req.headers['root_access_key'] !== undefined || req.headers['x-root-access-key'] !== undefined) {
      return triggerHoneypot(req, res, { trapType: 'DECOY_PARAMETER', trapTarget: 'root_access_key' });
    }
  }

  next();
}

module.exports = {
  honeytokenRouteGuard,
  honeytokenParamGuard,
  triggerHoneypot,
  normalizePath,
  hasDecoyParam,
  DECOY_ROUTES,
  DECOY_PARAMS,
  HONEYPOT_TTL_MS
};
