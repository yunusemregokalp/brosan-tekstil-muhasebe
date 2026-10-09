/**
 * BROSAN TEKSTİL ERP — SOVEREIGN CITADEL HARDENING
 * Layer 2: Ephemeral Single-Use Sliding Token Rotation & Replay Trap (Phase 6 - Requirement R2)
 * 
 * Features:
 * - Single-Use Sliding Token Rotation on Mutating Requests (POST, PUT, PATCH, DELETE)
 * - Cryptographic Token Family Lineage (fam, seq, parentJti, jti)
 * - Automatic successor token issuance in X-Brosan-Next-Token header
 * - Active Tri-Fold Defense Replay Trap:
 *     1. Entire token family revocation (fam)
 *     2. Dynamic IP Quarantine via quarantineEngine (Fail2ban)
 *     3. SIEM audit logging (TOKEN_REPLAY_BREACH_DETECTED) & Critical Threat Alerting
 *     4. HTTP 403 TOKEN_REPLAY_BREACH_DETECTED response
 * - Seamless backward compatibility for legacy non-family test tokens
 * - Exposes X-Brosan-Next-Token in CORS Access-Control-Expose-Headers
 */

const crypto = require('crypto');
const auth = require('./auth');
const sessionGuard = require('./sessionGuard');
const { quarantineEngine } = require('./quarantine');

let auditLogger = null;
try {
  auditLogger = require('./auditLogger');
} catch (_) {}

let threatAlerter = null;
try {
  threatAlerter = require('./threatAlerter');
} catch (_) {}

const MAX_CONSUMED_TOKENS = 10000;
const MAX_FAMILIES = 5000;
const CONSUMED_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

class EphemeralTokenEngine {
  constructor(options = {}) {
    this.consumedTokens = new Map(); // tokenHash -> { familyId, jti, successorJti, consumedAt, ip, username }
    this.tokenFamilies = new Map();  // familyId -> { isRevoked, revokedAt, reason, currentJti, username }
    this.maxConsumed = options.maxConsumed || MAX_CONSUMED_TOKENS;
    this.maxFamilies = options.maxFamilies || MAX_FAMILIES;
    this.consumedTtlMs = options.consumedTtlMs || CONSUMED_TTL_MS;

    this.sweepTimer = setInterval(() => this.pruneExpired(), 5 * 60 * 1000);
    if (this.sweepTimer.unref) this.sweepTimer.unref();
  }

  hashToken(token) {
    if (!token || typeof token !== 'string') return '';
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }

  isTokenConsumed(token) {
    const hash = this.hashToken(token);
    const record = this.consumedTokens.get(hash);
    if (!record) return false;
    if (Date.now() - record.consumedAt > this.consumedTtlMs) {
      this.consumedTokens.delete(hash);
      return false;
    }
    return true;
  }

  isFamilyRevoked(familyId) {
    if (!familyId) return false;
    const fam = this.tokenFamilies.get(familyId);
    return Boolean(fam && fam.isRevoked);
  }

  revokeFamily(familyId, reason = 'TOKEN_REPLAY_BREACH_DETECTED') {
    if (!familyId) return;
    const fam = this.tokenFamilies.get(familyId) || {};
    this.tokenFamilies.set(familyId, {
      ...fam,
      isRevoked: true,
      revokedAt: Date.now(),
      reason
    });
  }

  markConsumed(token, metadata = {}) {
    const hash = this.hashToken(token);
    if (this.consumedTokens.size >= this.maxConsumed) {
      const oldest = this.consumedTokens.keys().next().value;
      if (oldest) this.consumedTokens.delete(oldest);
    }
    this.consumedTokens.set(hash, {
      consumedAt: Date.now(),
      ...metadata
    });
  }

  /**
   * Generates a single-use initial root ephemeral token with family lineage.
   */
  createInitialToken(user, req = null) {
    const familyId = crypto.randomUUID();
    const jti = crypto.randomUUID();

    const token = auth.generateToken(user, {
      fam: familyId,
      seq: 0,
      jti,
      is2FAVerified: user.is2FAVerified !== false,
      role: user.role || 'ADMIN',
      req
    });

    this.tokenFamilies.set(familyId, {
      familyId,
      isRevoked: false,
      currentJti: jti,
      username: user.username,
      updatedAt: Date.now()
    });

    return token;
  }

  /**
   * Rotates an incoming token: marks current token consumed and issues successor.
   */
  rotateToken(token, req, decodedUser) {
    const isEphemeral = Boolean(decodedUser.fam);
    const familyId = decodedUser.fam || crypto.randomUUID();
    const nextSeq = (decodedUser.seq || 0) + 1;
    const nextJti = crypto.randomUUID();

    const successorPayload = {
      id: decodedUser.id,
      username: decodedUser.username,
      fullName: decodedUser.fullName || decodedUser.username,
      role: decodedUser.role || 'ADMIN',
      twoFactorEnabled: Boolean(decodedUser.twoFactorEnabled),
      is2FAVerified: decodedUser.is2FAVerified !== false,
      type: 'ACCESS',
      fam: familyId,
      seq: nextSeq,
      parentJti: decodedUser.jti,
      jti: nextJti
    };

    if (req) {
      try {
        successorPayload.fgp = sessionGuard.generateFingerprint(req);
      } catch (_) {}
    }

    const successorToken = auth.generateToken(successorPayload, {
      is2FAVerified: successorPayload.is2FAVerified,
      role: successorPayload.role,
      fam: familyId,
      seq: nextSeq,
      parentJti: decodedUser.jti,
      jti: nextJti,
      req
    });

    // Only record consumption for ephemeral tokens with lineage
    if (isEphemeral) {
      this.markConsumed(token, {
        familyId,
        jti: decodedUser.jti,
        successorJti: nextJti,
        ip: auth.getClientIp(req),
        username: decodedUser.username
      });
    }

    this.tokenFamilies.set(familyId, {
      familyId,
      isRevoked: false,
      currentJti: nextJti,
      username: decodedUser.username,
      updatedAt: Date.now()
    });

    return successorToken;
  }

  pruneExpired() {
    const now = Date.now();
    for (const [hash, rec] of this.consumedTokens.entries()) {
      if (now - rec.consumedAt > this.consumedTtlMs) {
        this.consumedTokens.delete(hash);
      }
    }
  }

  reset() {
    this.consumedTokens.clear();
    this.tokenFamilies.clear();
  }
}

const defaultEphemeralTokenEngine = new EphemeralTokenEngine();

function ephemeralTokenGuard(req, res, next) {
  const method = (req.method || 'GET').toUpperCase();
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  // Safe HTTP methods do not consume tokens
  if (!isMutating) {
    return next();
  }

  // Exempt unauthenticated / public endpoints
  const pathUrl = (req.originalUrl || req.url || '').split('?')[0];
  const cleanPath = pathUrl.replace(/^\/muhasebe/, '');
  if (
    cleanPath === '/api/health' ||
    cleanPath === '/robots.txt' ||
    cleanPath.startsWith('/api/auth/')
  ) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Delegate to auth.requireAuth for 401 handling
  }

  const token = authHeader.substring(7).trim();
  const clientIp = auth.getClientIp(req);
  const tokenHash = defaultEphemeralTokenEngine.hashToken(token);

  // 1. REPLAY TRAP: Check if token has already been consumed
  if (defaultEphemeralTokenEngine.isTokenConsumed(token)) {
    const consumedInfo = defaultEphemeralTokenEngine.consumedTokens.get(tokenHash) || {};
    const familyId = consumedInfo.familyId;
    const username = consumedInfo.username || 'UNKNOWN';

    // Tri-Fold Breach Action:
    // a. Revoke entire token family
    if (familyId) {
      defaultEphemeralTokenEngine.revokeFamily(familyId, 'TOKEN_REPLAY_BREACH_DETECTED');
    }

    // b. Invalidate token globally in blacklist
    auth.revokeToken(token);

    // c. Quarantine IP
    quarantineEngine.quarantineIp(clientIp, 'TOKEN_REPLAY_BREACH_DETECTED', {
      familyId,
      username,
      triggerPath: pathUrl
    });

    // d. Threat Alert
    try {
      if (threatAlerter && typeof threatAlerter.dispatchAlert === 'function') {
        threatAlerter.dispatchAlert('TOKEN_REPLAY_BREACH_DETECTED', {
          clientIp,
          severity: 'CRITICAL',
          summary: `⚠️ Belirteç yeniden oynatma ihlali tespit edildi: ${username} (Family: ${familyId})`,
          details: {
            familyId,
            username,
            triggerPath: pathUrl,
            reason: 'REPLAY_OF_CONSUMED_EPHEMERAL_TOKEN'
          }
        });
      }
    } catch (_) {}

    // e. SIEM Logging
    try {
      if (auditLogger && typeof auditLogger.logSecurityEvent === 'function') {
        auditLogger.logSecurityEvent('TOKEN_REPLAY_BREACH_DETECTED', {
          req,
          severity: 'CRITICAL',
          status: 403,
          clientIp,
          details: {
            familyId,
            username,
            triggerPath: pathUrl,
            reason: 'REPLAY_OF_CONSUMED_EPHEMERAL_TOKEN'
          }
        });
      }
    } catch (_) {}

    return res.status(403).json({
      success: false,
      error: 'Belirteç yeniden oynatma ihlali tespit edildi (Token replay breach detected). Tüm kullanıcı oturumları güvenlik nedeniyle iptal edildi.',
      code: 'TOKEN_REPLAY_BREACH_DETECTED'
    });
  }

  // 2. Family Revocation Check
  const decoded = auth.verifyToken(token);
  if (decoded && decoded.fam && defaultEphemeralTokenEngine.isFamilyRevoked(decoded.fam)) {
    return res.status(403).json({
      success: false,
      error: 'Bu oturum ailesi güvenlik ihlali nedeniyle geçersiz kılınmıştır (Token family revoked).',
      code: 'TOKEN_FAMILY_REVOKED'
    });
  }

  // 3. Issue Successor Token on Valid Mutating Request
  if (decoded) {
    const successorToken = defaultEphemeralTokenEngine.rotateToken(token, req, decoded);
    res.setHeader('X-Brosan-Next-Token', successorToken);
    res.setHeader('Access-Control-Expose-Headers', 'X-Brosan-Next-Token');
    req.nextToken = successorToken;
  }

  next();
}

module.exports = {
  EphemeralTokenEngine,
  ephemeralTokenEngine: defaultEphemeralTokenEngine,
  ephemeralTokenGuard
};
