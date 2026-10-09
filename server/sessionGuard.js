/**
 * BROSAN TEKSTİL ERP — PRODUCTION ZERO-TRUST CYBER SECURITY SHIELD
 * Layer 2: Cryptographic Session Fingerprint Guard (Anti-Session Hijacking)
 * (Phase 4 Ironclad Defense-in-Depth Hardening — Milestone 2)
 * 
 * Features:
 * - Cryptographic HMAC-SHA256 session fingerprinting bound to network identity
 * - Formula: FGP = HMAC-SHA256(K_session, IP_Subnet/24 || User-Agent || Accept-Language)
 * - Network identity normalization:
 *   * IPv4: Mask to /24 subnet (e.g. 192.168.1.105 -> 192.168.1.0/24)
 *   * IPv6: Mask to /48 prefix (e.g. 2001:db8:abcd:0012::1 -> 2001:db8:abcd::/48)
 *   * Loopback: Unifies 127.0.0.1, ::1, localhost to 127.0.0.0/24
 * - Constant-time comparison using crypto.timingSafeEqual with length-timing immunity
 * - Automated Tri-Fold + Revocation Incident Response on hijack detection:
 *   1. auth.revokeToken(token) to globally invalidate compromised token
 *   2. quarantineEngine.quarantineIp(attackerIp) (1-hour TTL)
 *   3. threatAlerter.dispatchAlert('SESSION_HIJACK_DETECTED', ...)
 *   4. auditLogger.logSecurityEvent('SESSION_HIJACK_DETECTED', ...)
 *   5. Reject with HTTP 401 SESSION_HIJACK_DETECTED
 * - Backward compatibility for legacy tokens and requests without network context
 */

const crypto = require('crypto');
const { quarantineEngine } = require('./quarantine');
const auditLogger = require('./auditLogger');
const threatAlerter = require('./threatAlerter');

let cachedAuth = null;
function getAuth() {
  if (!cachedAuth) {
    try {
      cachedAuth = require('./auth');
    } catch (_) {}
  }
  return cachedAuth;
}

// HKDF Salt & Info for Session Key derivation (RFC 5869)
const HKDF_SALT = Buffer.from('BrosanSessionGuardSalt2026', 'utf8');
const HKDF_INFO = Buffer.from('brosan-erp-session-guard-fingerprint-v1', 'utf8');
let cachedSessionKey = null;

/**
 * Derives a 256-bit session key from master secret using HKDF-SHA256
 */
function deriveSessionKey(secret = null) {
  let effectiveSecret = secret;
  if (!effectiveSecret) {
    effectiveSecret = process.env.SESSION_GUARD_SECRET || process.env.JWT_SECRET || 'BrosanTekstil2026EnterpriseSuperSecretSecurityKey!@#$987654321';
  }
  const secretBuf = Buffer.isBuffer(effectiveSecret) ? effectiveSecret : Buffer.from(String(effectiveSecret), 'utf8');
  return Buffer.from(crypto.hkdfSync('sha256', secretBuf, HKDF_SALT, HKDF_INFO, 32));
}

/**
 * Gets cached runtime session key
 */
function getSessionKey() {
  if (!cachedSessionKey) {
    cachedSessionKey = deriveSessionKey();
  }
  return cachedSessionKey;
}

/**
 * Resets cached session key (for testing and rotation)
 */
function resetSessionKey() {
  cachedSessionKey = null;
}

/**
 * Safely extracts client IP from request, taking into account trusted proxy headers
 */
function getClientIp(req) {
  if (!req) return '127.0.0.1';
  if (req.ip) return req.ip;
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (forwarded) {
    const hops = forwarded.split(',').map(s => s.trim()).filter(Boolean);
    if (hops.length > 0) {
      const trustedHop = hops[hops.length - 1];
      if (/^[a-fA-F0-9:.]+$/.test(trustedHop)) {
        return trustedHop;
      }
    }
  }
  return '127.0.0.1';
}

/**
 * Normalizes IP subnet:
 * - IPv4: Masked to /24 (e.g. 192.168.1.105 -> 192.168.1.0/24)
 * - IPv6: Masked to /48 prefix (e.g. 2001:db8:abcd:0012::1 -> 2001:db8:abcd::/48)
 * - Loopback: 127.0.0.1, ::1, localhost -> 127.0.0.0/24
 */
function normalizeIpSubnet(rawIp) {
  if (!rawIp || typeof rawIp !== 'string') return '127.0.0.0/24';
  let ip = rawIp.trim().toLowerCase();

  // Strip enclosing brackets [2001:db8::1]
  if (ip.startsWith('[') && ip.endsWith(']')) {
    ip = ip.substring(1, ip.length - 1);
  }

  // Handle loopback
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.startsWith('127.')) {
    return '127.0.0.0/24';
  }

  // Handle IPv4-mapped IPv6 ::ffff:192.168.1.1
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  // Check IPv4
  const ipv4Match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const o1 = parseInt(ipv4Match[1], 10);
    const o2 = parseInt(ipv4Match[2], 10);
    const o3 = parseInt(ipv4Match[3], 10);
    const o4 = parseInt(ipv4Match[4], 10);
    if (o1 <= 255 && o2 <= 255 && o3 <= 255 && o4 <= 255) {
      if (o1 === 127) return '127.0.0.0/24';
      return `${o1}.${o2}.${o3}.0/24`;
    }
  }

  // Check IPv6
  if (ip.includes(':')) {
    try {
      const parts = ip.split('::');
      let left = [];
      let right = [];
      if (parts.length === 1) {
        left = parts[0].split(':').filter(Boolean);
      } else if (parts.length === 2) {
        left = parts[0] ? parts[0].split(':').filter(Boolean) : [];
        right = parts[1] ? parts[1].split(':').filter(Boolean) : [];
      } else {
        return '::/48';
      }
      const missing = 8 - (left.length + right.length);
      const middle = Array(Math.max(0, missing)).fill('0');
      const full = [...left, ...middle, ...right];
      if (full.length >= 3) {
        const g0 = (parseInt(full[0], 16) || 0).toString(16);
        const g1 = (parseInt(full[1], 16) || 0).toString(16);
        const g2 = (parseInt(full[2], 16) || 0).toString(16);
        return `${g0}:${g1}:${g2}::/48`;
      }
    } catch (_) {}
    return '::/48';
  }

  return '127.0.0.0/24';
}

/**
 * Extracts normalized network & client identifiers from request
 */
function extractRequestIdentity(req) {
  if (!req) {
    return {
      subnet: '127.0.0.0/24',
      userAgent: 'UNKNOWN_UA',
      acceptLanguage: 'DEFAULT_LANG',
      rawIp: '127.0.0.1'
    };
  }

  const rawIp = getClientIp(req);
  const subnet = normalizeIpSubnet(rawIp);
  
  let userAgent = 'UNKNOWN_UA';
  let acceptLanguage = 'DEFAULT_LANG';

  if (req.headers && typeof req.headers === 'object') {
    if (req.headers['user-agent']) {
      userAgent = String(req.headers['user-agent']).trim();
    }
    if (req.headers['accept-language']) {
      acceptLanguage = String(req.headers['accept-language']).trim();
    }
  }

  return { subnet, userAgent, acceptLanguage, rawIp };
}

/**
 * Calculates cryptographic HMAC-SHA256 fingerprint:
 * HMAC(K_session, IP_Subnet || User-Agent || Accept-Language)
 */
function generateFingerprint(req) {
  if (!req) return null;
  const { subnet, userAgent, acceptLanguage } = extractRequestIdentity(req);
  const canonical = `${subnet}|${userAgent}|${acceptLanguage}`;
  const key = getSessionKey();
  return crypto.createHmac('sha256', key).update(canonical, 'utf8').digest('hex');
}

/**
 * Constant-time verification of token fingerprint against current request
 */
function verifyFingerprint(tokenFgp, req) {
  if (!tokenFgp || typeof tokenFgp !== 'string' || !req) {
    return false;
  }

  const expectedFgp = generateFingerprint(req);
  if (!expectedFgp) return false;

  const bufA = Buffer.from(tokenFgp, 'hex');
  const bufB = Buffer.from(expectedFgp, 'hex');

  // SHA-256 hex digest is exactly 32 bytes (64 hex characters)
  if (bufA.length !== 32 || bufB.length !== 32) {
    // Constant-time dummy comparison to prevent length timing side-channel
    const dummyA = Buffer.alloc(32);
    const dummyB = Buffer.alloc(32);
    crypto.timingSafeEqual(dummyA, dummyB);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Coordinates incident handling upon session hijack detection:
 * 1. auth.revokeToken(token) to revoke stolen token
 * 2. quarantineEngine.quarantineIp (1-hour TTL)
 * 3. threatAlerter.dispatchAlert('SESSION_HIJACK_DETECTED', ...)
 * 4. auditLogger.logSecurityEvent('SESSION_HIJACK_DETECTED', ...)
 * 5. Reject with HTTP 401 SESSION_HIJACK_DETECTED
 */
function handleSessionHijack(req, res, token, decoded) {
  const clientIp = getClientIp(req);
  const username = (decoded && decoded.username) ? decoded.username : 'UNKNOWN';
  const userId = (decoded && decoded.id) ? decoded.id : 'UNKNOWN';
  const triggerPath = req.originalUrl || req.url || 'UNKNOWN_PATH';
  const incidentId = crypto.randomUUID();

  // 1. Immediately revoke stolen token via auth.revokeToken(token)
  try {
    const authModule = getAuth();
    if (authModule && typeof authModule.revokeToken === 'function' && token) {
      authModule.revokeToken(token);
    }
  } catch (err) {
    console.error('⚠️ [SESSION_GUARD] Failed to revoke stolen token:', err.message);
  }

  // 2. Quarantine attacker IP via quarantineEngine.quarantineIp (1-hr TTL)
  let isQuarantined = false;
  try {
    if (quarantineEngine && typeof quarantineEngine.quarantineIp === 'function') {
      const qRecord = quarantineEngine.quarantineIp(clientIp, 'SESSION_HIJACK_DETECTED', {
        username,
        userId,
        triggerPath,
        incidentId,
        ttlMs: 60 * 60 * 1000 // 1 hour
      });
      isQuarantined = !!qRecord;
    }
  } catch (err) {
    console.error('⚠️ [SESSION_GUARD] Failed to quarantine attacker IP:', err.message);
  }

  // 3. Alert administrators via threatAlerter.dispatchAlert('SESSION_HIJACK_DETECTED', ...)
  try {
    if (threatAlerter && typeof threatAlerter.dispatchAlert === 'function') {
      threatAlerter.dispatchAlert('SESSION_HIJACK_DETECTED', {
        clientIp,
        severity: 'CRITICAL',
        summary: `Session hijacking detected: Token belonging to user "${username}" presented from rogue identity at IP ${clientIp}. Token revoked and IP quarantined.`,
        details: {
          username,
          userId,
          triggerPath,
          incidentId,
          clientIp,
          quarantined: isQuarantined
        }
      });
    }
  } catch (err) {
    console.error('⚠️ [SESSION_GUARD] Failed to dispatch threat alert:', err.message);
  }

  // 4. Log structured SIEM event via auditLogger.logSecurityEvent('SESSION_HIJACK_DETECTED', ...)
  try {
    if (auditLogger && typeof auditLogger.logSecurityEvent === 'function') {
      auditLogger.logSecurityEvent('SESSION_HIJACK_DETECTED', {
        req,
        severity: 'CRITICAL',
        status: 401,
        clientIp,
        user: decoded || { username, id: userId },
        details: {
          triggerPath,
          incidentId,
          quarantined: isQuarantined,
          reason: 'SESSION_HIJACK_DETECTED',
          tokenRevoked: true
        }
      });
    }
  } catch (err) {
    console.error('⚠️ [SESSION_GUARD] Failed to log SIEM audit event:', err.message);
  }

  // 5. Reject request with HTTP 401 SESSION_HIJACK_DETECTED
  return res.status(401).json({
    success: false,
    error: 'Oturum hırsızlığı veya geçersiz parmak izi tespit edildi (Session hijacking detected). Oturum güvenlik nedeniyle sonlandırıldı.',
    code: 'SESSION_HIJACK_DETECTED',
    quarantined: isQuarantined
  });
}

/**
 * Express middleware for session guard (standalone or composable)
 */
function sessionGuardMiddleware(req, res, next) {
  if (req.user && req.user.fgp) {
    const isValid = verifyFingerprint(req.user.fgp, req);
    if (!isValid) {
      return handleSessionHijack(req, res, req.token, req.user);
    }
  }
  next();
}

module.exports = {
  generateFingerprint,
  verifyFingerprint,
  normalizeIpSubnet,
  extractRequestIdentity,
  deriveSessionKey,
  getSessionKey,
  resetSessionKey,
  handleSessionHijack,
  sessionGuardMiddleware,
  getClientIp
};
