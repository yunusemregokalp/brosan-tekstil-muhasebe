/**
 * BROSAN TEKSTİL ERP — SOVEREIGN CITADEL HARDENING
 * Layer 3: Cryptographic Proof-of-Work (PoW) Anti-Botnet Shield (Phase 6 - Requirement R3)
 * 
 * Features:
 * - Dynamic SHA-256 Collision Puzzle for /api/auth/login on Burst / Brute-Force Activity
 * - Sliding 60s TTL Window with Cryptographic HMAC-SHA256 Challenge Binding
 * - Dynamic Difficulty Scaling (leading zeros) based on IP burst frequency
 * - Strict Nonce Collision & Single-Use Consumption (Anti-Replay)
 * - Automatic Stripping of PoW parameters from req.body to preserve LoginSchema.strict() integrity
 * - Client solver utility (solveChallenge) for testing and legitimate client libraries
 * - SIEM Audit Logging (POW_CHALLENGE_ISSUED, POW_CHALLENGE_FAILED, POW_CHALLENGE_VERIFIED)
 */

const crypto = require('crypto');
const auth = require('./auth');

let auditLogger = null;
try {
  auditLogger = require('./auditLogger');
} catch (_) {}

const { quarantineEngine } = require('./quarantine');

let threatAlerter = null;
try {
  threatAlerter = require('./threatAlerter');
} catch (_) {}

const HKDF_SALT = Buffer.from('BrosanPoWSalt2026', 'utf8');
const HKDF_INFO = Buffer.from('brosan-erp-pow-botnet-shield-v1', 'utf8');
const DEFAULT_TTL_MS = 60 * 1000; // 60s sliding TTL

class ProofOfWorkEngine {
  constructor(options = {}) {
    this.ttlMs = options.ttlMs || DEFAULT_TTL_MS;
    this.burstThreshold = options.burstThreshold || parseInt(process.env.POW_BURST_THRESHOLD, 10) || 6;
    this.consumedChallenges = new Map(); // challengeId -> consumedAt
    this.ipBurstTracker = new Map();     // clientIp -> { count, firstAt, lastAt }
    this.maxConsumed = options.maxConsumed || 10000;
    this.forceChallenge = false;         // Test toggle

    const secret = process.env.POW_SECRET || auth.JWT_SECRET || process.env.JWT_SECRET || 'BrosanTekstil2026EnterpriseSuperSecretSecurityKey!@#$987654321';
    this.key = crypto.hkdfSync('sha256', Buffer.from(secret, 'utf8'), HKDF_SALT, HKDF_INFO, 32);

    this.sweepTimer = setInterval(() => this.pruneExpired(), 30 * 1000);
    if (this.sweepTimer.unref) this.sweepTimer.unref();
  }

  signChallenge(challengeId, seed, leadingZeros, expiresAt, clientIp) {
    const payload = `${challengeId}|${seed}|${leadingZeros}|${expiresAt}|${clientIp}`;
    return crypto.createHmac('sha256', this.key).update(payload, 'utf8').digest('hex');
  }

  verifySignature(challengeId, seed, leadingZeros, expiresAt, clientIp, signature) {
    if (!signature || typeof signature !== 'string') return false;
    const expected = this.signChallenge(challengeId, seed, leadingZeros, expiresAt, clientIp);
    const bufA = Buffer.from(expected, 'hex');
    let bufB;
    try {
      bufB = Buffer.from(signature.trim(), 'hex');
    } catch (_) {
      bufB = Buffer.alloc(32);
    }
    if (bufA.length !== 32 || bufB.length !== 32) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  recordLoginAttempt(clientIp) {
    const now = Date.now();
    const record = this.ipBurstTracker.get(clientIp) || { count: 0, firstAt: now, lastAt: now };
    if (now - record.firstAt > 60000) {
      record.count = 1;
      record.firstAt = now;
      record.lastAt = now;
    } else {
      record.count += 1;
      record.lastAt = now;
    }
    this.ipBurstTracker.set(clientIp, record);
    return record.count;
  }

  isChallengeRequired(clientIp) {
    if (this.forceChallenge) return true;

    const record = this.ipBurstTracker.get(clientIp);
    if (record && record.count >= this.burstThreshold && (Date.now() - record.firstAt <= 60000)) {
      return true;
    }

    if (auth && typeof auth.checkBruteForce === 'function') {
      const ipCheck = auth.checkBruteForce(`ip:${clientIp}`);
      if (ipCheck.attempts && ipCheck.attempts >= 2) {
        return true;
      }
    }

    return false;
  }

  getDynamicDifficulty(clientIp) {
    const record = this.ipBurstTracker.get(clientIp);
    const count = record ? record.count : 0;
    if (count >= 8) return 4;
    if (count >= 5) return 3;
    return 2;
  }

  generateChallenge(clientIp) {
    const challengeId = crypto.randomUUID();
    const seed = crypto.randomBytes(16).toString('hex');
    const leadingZeros = this.getDynamicDifficulty(clientIp);
    const expiresAt = Date.now() + this.ttlMs;
    const signature = this.signChallenge(challengeId, seed, leadingZeros, expiresAt, clientIp);

    return {
      challengeId,
      seed,
      leadingZeros,
      expiresAt,
      signature
    };
  }

  verifySolution({ challengeId, seed, leadingZeros, expiresAt, signature, nonce, clientIp }) {
    if (!challengeId || !seed || leadingZeros === undefined || !expiresAt || !signature || nonce === undefined) {
      return { valid: false, code: 'POW_CHALLENGE_FAILED', reason: 'MISSING_FIELDS' };
    }

    if (Date.now() > Number(expiresAt)) {
      return { valid: false, code: 'POW_CHALLENGE_FAILED', reason: 'EXPIRED' };
    }

    if (!this.verifySignature(challengeId, seed, leadingZeros, expiresAt, clientIp, signature)) {
      return { valid: false, code: 'POW_CHALLENGE_FAILED', reason: 'INVALID_SIGNATURE' };
    }

    if (this.consumedChallenges.has(challengeId)) {
      return { valid: false, code: 'POW_CHALLENGE_FAILED', reason: 'REPLAYED' };
    }

    // Verify SHA-256 Collision
    const hash = crypto.createHash('sha256').update(`${seed}:${nonce}`).digest('hex');
    const target = '0'.repeat(parseInt(leadingZeros, 10));
    if (!hash.startsWith(target)) {
      return { valid: false, code: 'POW_CHALLENGE_FAILED', reason: 'INSUFFICIENT_WORK' };
    }

    // Mark challenge as consumed
    if (this.consumedChallenges.size >= this.maxConsumed) {
      const oldest = this.consumedChallenges.keys().next().value;
      if (oldest) this.consumedChallenges.delete(oldest);
    }
    this.consumedChallenges.set(challengeId, Date.now());

    return { valid: true };
  }

  solveChallenge({ seed, leadingZeros }) {
    const target = '0'.repeat(leadingZeros);
    let nonce = 0;
    while (true) {
      const hash = crypto.createHash('sha256').update(`${seed}:${nonce}`).digest('hex');
      if (hash.startsWith(target)) {
        return { nonce: String(nonce), hash };
      }
      nonce++;
    }
  }

  setForceChallenge(enable = true) {
    this.forceChallenge = Boolean(enable);
  }

  pruneExpired() {
    const now = Date.now();
    for (const [id, consumedAt] of this.consumedChallenges.entries()) {
      if (now - consumedAt > this.ttlMs * 2) {
        this.consumedChallenges.delete(id);
      }
    }
    for (const [ip, rec] of this.ipBurstTracker.entries()) {
      if (now - rec.firstAt > 120000) {
        this.ipBurstTracker.delete(ip);
      }
    }
  }

  reset() {
    this.consumedChallenges.clear();
    this.ipBurstTracker.clear();
    this.forceChallenge = false;
  }
}

const defaultProofOfWorkEngine = new ProofOfWorkEngine();

function proofOfWorkGuard(req, res, next) {
  const pathUrl = (req.originalUrl || req.url || '').split('?')[0];
  const cleanPath = pathUrl.replace(/^\/muhasebe/, '');

  if (cleanPath !== '/api/auth/login') {
    return next();
  }

  const clientIp = auth.getClientIp(req);
  defaultProofOfWorkEngine.recordLoginAttempt(clientIp);

  // Extract solution from body or headers
  let powSolution = req.body && req.body.powSolution;
  let nonce = req.body && req.body.powNonce;
  let challengeId = req.body && req.body.powChallengeId;

  if (!powSolution && (req.headers['x-brosan-pow-nonce'] || req.headers['x-brosan-pow-challenge'])) {
    powSolution = {
      challengeId: req.headers['x-brosan-pow-challenge'],
      seed: req.headers['x-brosan-pow-seed'],
      leadingZeros: parseInt(req.headers['x-brosan-pow-difficulty'], 10),
      expiresAt: parseInt(req.headers['x-brosan-pow-expires'], 10),
      signature: req.headers['x-brosan-pow-signature'],
      nonce: req.headers['x-brosan-pow-nonce']
    };
  }

  const requiresChallenge = defaultProofOfWorkEngine.isChallengeRequired(clientIp);

  if (requiresChallenge) {
    if (!powSolution && nonce === undefined) {
      const challenge = defaultProofOfWorkEngine.generateChallenge(clientIp);

      try {
        if (auditLogger && typeof auditLogger.logSecurityEvent === 'function') {
          auditLogger.logSecurityEvent('POW_CHALLENGE_ISSUED', {
            req,
            severity: 'WARN',
            status: 403,
            clientIp,
            details: {
              reason: 'BURST_TRAFFIC_DETECTED',
              challengeId: challenge.challengeId,
              leadingZeros: challenge.leadingZeros
            }
          });
        }
      } catch (_) {}

      if (auth && typeof auth.recordFailedAttempt === 'function') {
        const ipRecord = auth.recordFailedAttempt(`ip:${clientIp}`);
        if (ipRecord && ipRecord.count >= 10) {
          quarantineEngine.quarantineIp(clientIp, 'BRUTE_FORCE_LOGIN_EXCEEDED');
        }
      }

      return res.status(403).json({
        success: false,
        error: 'Şüpheli aktivite veya burst trafik tespit edildi. Lütfen Proof-of-Work doğrulamasını tamamlayın.',
        code: 'POW_CHALLENGE_FAILED',
        powChallenge: challenge
      });
    }

    const solPayload = powSolution || {
      challengeId,
      seed: req.body && req.body.powSeed,
      leadingZeros: req.body && req.body.powLeadingZeros,
      expiresAt: req.body && req.body.powExpiresAt,
      signature: req.body && req.body.powSignature,
      nonce
    };

    const verifyResult = defaultProofOfWorkEngine.verifySolution({
      ...solPayload,
      clientIp
    });

    if (!verifyResult.valid) {
      try {
        if (auditLogger && typeof auditLogger.logSecurityEvent === 'function') {
          auditLogger.logSecurityEvent('POW_CHALLENGE_FAILED', {
            req,
            severity: 'WARN',
            status: 403,
            clientIp,
            details: { reason: verifyResult.reason }
          });
        }
      } catch (_) {}

      if (auth && typeof auth.recordFailedAttempt === 'function') {
        const ipRecord = auth.recordFailedAttempt(`ip:${clientIp}`);
        if (ipRecord && ipRecord.count >= 10) {
          quarantineEngine.quarantineIp(clientIp, 'BRUTE_FORCE_LOGIN_EXCEEDED');
        }
      }

      const freshChallenge = defaultProofOfWorkEngine.generateChallenge(clientIp);
      return res.status(403).json({
        success: false,
        error: 'Proof-of-Work doğrulaması başarısız oldu.',
        code: 'POW_CHALLENGE_FAILED',
        powChallenge: freshChallenge
      });
    }

    try {
      if (auditLogger && typeof auditLogger.logSecurityEvent === 'function') {
        auditLogger.logSecurityEvent('POW_CHALLENGE_VERIFIED', {
          req,
          severity: 'INFO',
          status: 200,
          clientIp,
          details: { challengeId: solPayload.challengeId }
        });
      }
    } catch (_) {}
  }

  // Strip PoW fields from req.body to preserve LoginSchema.strict() integrity
  if (req.body && typeof req.body === 'object') {
    delete req.body.powSolution;
    delete req.body.powNonce;
    delete req.body.powChallengeId;
    delete req.body.powSeed;
    delete req.body.powLeadingZeros;
    delete req.body.powExpiresAt;
    delete req.body.powSignature;
  }

  next();
}

module.exports = {
  ProofOfWorkEngine,
  proofOfWorkEngine: defaultProofOfWorkEngine,
  proofOfWorkGuard
};
