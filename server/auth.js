/**
 * BROSAN TEKSTİL ERP — ENTERPRISE ZERO-TRUST AUTHENTICATION & SECURITY SHIELD
 * Features:
 * - Kriptografik Bcrypt Parola Hashleme (12 Salt Rounds)
 * - Güvenli JWT (JSON Web Token) Oturum Yönetimi (HMAC-SHA256, 12h tavan)
 * - DoS-Safe Bounded LRU Brute-Force Kalkanı: Bellek sızıntısı korumalı, IP & Kullanıcı bazlı 5 hatalı deneme -> 15 dk kilit
 * - Anti-IP-Spoofing İstemci IP Çözümleyicisi
 * - Fail-Closed API Guard Middleware
 * - Timing-Attack Korumalı Karşılaştırma
 * - Katı Parola Karmaşıklık Denetimi (Min 12 Karakter, Büyük/Küçük, Rakam, Sembol)
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { MemoryStore } = require('express-rate-limit');
const auditLogger = require('./auditLogger');
const { lockdownManager } = require('./lockdown');
const sessionGuard = require('./sessionGuard');

// Bounded LRU Cache Rate Limit Store (Max 5000 Entries to prevent OOM DoS)
class BoundedLruMemoryStore extends MemoryStore {
  constructor(options = {}) {
    super();
    this.maxEntries = options.maxEntries || 5000;
  }

  getClient(key) {
    if (this.current.has(key)) {
      const existing = this.current.get(key);
      this.current.delete(key);
      this.current.set(key, existing);
      return existing;
    }
    if (this.current.size >= this.maxEntries) {
      const oldestKey = this.current.keys().next().value;
      if (oldestKey !== undefined) {
        this.current.delete(oldestKey);
      }
    }
    return super.getClient(key);
  }
}

// Cryptographically secure secret
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    // Generate secure 256-bit runtime key if not explicitly set
    JWT_SECRET = crypto.randomBytes(32).toString('hex');
    console.warn('⚠️ [GÜVENLİK UYARISI] JWT_SECRET ortam değişkeni tanımlanmamış. Güvenli rastgele 256-bit anahtar üretildi.');
  } else {
    JWT_SECRET = 'BrosanTekstil2026EnterpriseSuperSecretSecurityKey!@#$987654321';
  }
}

const JWT_EXPIRES_IN = '12h'; // 12 saatlik güvenli tavan oturum

// ==============================================================================
// 1. MEMORY-BOUNDED BRUTE FORCE DEFENSE (IP & USERNAME LOCKOUT)
// ==============================================================================
const failedAttemptsMap = new Map(); // key: ip_or_username, value: { count, firstAttempt, lockedUntil }
const MAX_MAP_ENTRIES = 5000; // Bellek tükenmesi (OOM DoS) engelleme
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 dakika
const WINDOW_DURATION_MS = 15 * 60 * 1000; // 15 dakikalık pencere

// Süresi geçmiş kayıtları temizleme fonksiyonu
function pruneExpiredEntries() {
  const now = Date.now();
  for (const [key, record] of failedAttemptsMap.entries()) {
    if (record.lockedUntil && record.lockedUntil <= now) {
      failedAttemptsMap.delete(key);
    } else if (!record.lockedUntil && (now - record.firstAttempt > WINDOW_DURATION_MS)) {
      failedAttemptsMap.delete(key);
    }
  }
}

// 5 dakikada bir otomatik temizlik (bellek taşmasını önler)
const cleanupTimer = setInterval(pruneExpiredEntries, 5 * 60 * 1000);
if (cleanupTimer.unref) cleanupTimer.unref();

function checkBruteForce(key) {
  const now = Date.now();
  const record = failedAttemptsMap.get(key);
  if (!record) return { isLocked: false };

  // Eğer kilitli ise
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
    return { isLocked: true, remainingSec };
  }

  // Süresi geçmiş kilidi veya pencereyi temizle
  if (record.lockedUntil && record.lockedUntil <= now) {
    failedAttemptsMap.delete(key);
    return { isLocked: false };
  }

  if (now - record.firstAttempt > WINDOW_DURATION_MS) {
    failedAttemptsMap.delete(key);
    return { isLocked: false };
  }

  return { isLocked: false, attempts: record.count };
}

function recordFailedAttempt(key) {
  const now = Date.now();

  // Bellek sınır kontrolü
  if (failedAttemptsMap.size >= MAX_MAP_ENTRIES) {
    pruneExpiredEntries();
    // Eğer hala doluysa en eski anahtarı sil (LRU davranışı)
    if (failedAttemptsMap.size >= MAX_MAP_ENTRIES) {
      const firstKey = failedAttemptsMap.keys().next().value;
      if (firstKey) failedAttemptsMap.delete(firstKey);
    }
  }

  const record = failedAttemptsMap.get(key) || { count: 0, firstAttempt: now, lockedUntil: null };

  if (now - record.firstAttempt > WINDOW_DURATION_MS) {
    record.count = 1;
    record.firstAttempt = now;
    record.lockedUntil = null;
  } else {
    record.count += 1;
  }

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }

  failedAttemptsMap.set(key, record);
  return record;
}

function clearFailedAttempts(key) {
  failedAttemptsMap.delete(key);
}

// ==============================================================================
// 2. PAROLA POLİTİKASI, HASHLEME VE DOĞRULAMA
// ==============================================================================
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;

function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Şifre alanı boş bırakılamaz.' };
  }
  if (password.length < 12) {
    return { isValid: false, error: 'Şifre en az 12 karakter uzunluğunda olmalıdır.' };
  }
  if (!PASSWORD_COMPLEXITY_REGEX.test(password)) {
    return { isValid: false, error: 'Şifre en az 1 büyük harf, 1 küçük harf, 1 rakam ve 1 özel karakter içermelidir.' };
  }
  return { isValid: true };
}

function hashPassword(password) {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(password, salt);
}

function verifyPassword(password, hash) {
  if (!password || !hash) return false;
  return bcrypt.compareSync(password, hash);
}

// ==============================================================================
// 3. JWT TOKEN İŞLEMLERİ
// ==============================================================================
function generateToken(user, optionsOrReq = {}, maybeReq = null) {
  let options = {};
  let req = null;

  // Support signatures: generateToken(user, req), generateToken(user, options), generateToken(user, options, req)
  if (optionsOrReq && (optionsOrReq.headers || optionsOrReq.socket || optionsOrReq.ip || optionsOrReq.method)) {
    req = optionsOrReq;
    options = maybeReq || {};
  } else {
    options = optionsOrReq || {};
    req = maybeReq || options.req || null;
  }

  const is2FA = Boolean(user && user.twoFactorEnabled);
  const isVerified = options.is2FAVerified !== undefined
    ? options.is2FAVerified
    : (is2FA ? false : true);

  // Compute session fingerprint if req is provided, or inherit from options
  let fgp = options.fgp;
  if (!fgp && req) {
    try {
      fgp = sessionGuard.generateFingerprint(req);
    } catch (_) {}
  }

  const payload = {
    id: user ? user.id : undefined,
    username: user ? user.username : undefined,
    fullName: user ? (user.fullName || user.username) : undefined,
    role: (options.role !== undefined) ? options.role : (user ? (user.role || 'ADMIN') : 'ADMIN'),
    twoFactorEnabled: is2FA,
    is2FAVerified: isVerified,
    type: options.type || 'ACCESS',
    jti: options.jti || (user && user.jti) || crypto.randomUUID()
  };

  if (options.fam || (user && user.fam)) {
    payload.fam = options.fam || user.fam;
  }
  if (options.seq !== undefined || (user && user.seq !== undefined)) {
    payload.seq = options.seq !== undefined ? options.seq : user.seq;
  }
  if (options.parentJti || (user && user.parentJti)) {
    payload.parentJti = options.parentJti || user.parentJti;
  }

  if (fgp) {
    payload.fgp = fgp;
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: options.expiresIn || JWT_EXPIRES_IN,
    algorithm: 'HS256'
  });
}

function generatePreAuthToken(user, req = null) {
  let fgp = null;
  if (req) {
    try {
      fgp = sessionGuard.generateFingerprint(req);
    } catch (_) {}
  }

  const payload = {
    id: user ? user.id : undefined,
    username: user ? user.username : undefined,
    fullName: user ? (user.fullName || user.username) : undefined,
    role: 'PRE_AUTH_2FA',
    twoFactorEnabled: true,
    is2FAVerified: false,
    type: 'PRE_AUTH_2FA',
    jti: crypto.randomUUID()
  };

  if (fgp) {
    payload.fgp = fgp;
  }

  // 5 dakikalık kısıtlı ve kısa ömürlü pre-auth token
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '5m',
    algorithm: 'HS256'
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    return null;
  }
}

// ==============================================================================
// 4. GÜVENLİ İSTEMCİ IP ÇÖZÜMLEME (Anti-IP-Spoofing)
// ==============================================================================
function getClientIp(req) {
  if (req.ip) return req.ip;
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (forwarded) {
    const hops = forwarded.split(',').map(s => s.trim()).filter(Boolean);
    if (hops.length > 0) {
      // In single-hop trust proxy 1 architecture, the trusted hop is appended at the end
      const trustedHop = hops[hops.length - 1];
      if (/^[a-fA-F0-9:.]+$/.test(trustedHop)) {
        return trustedHop;
      }
    }
  }
  return '127.0.0.1';
}

// Pre-computed dummy hash to guarantee constant-time verification when user doesn't exist
// This completely thwarts username enumeration via side-channel timing analysis
const DUMMY_HASH = bcrypt.hashSync('BrosanConstantTimingMitigationSalt2026!@#', 12);

// ==============================================================================
// 4.1 DURABLE & BOUNDED TOKEN REVOCATION BLACKLIST (PERSISTS ACROSS RESTARTS)
// ==============================================================================
const REVOKED_TOKENS_FILE = path.join(__dirname, '..', 'data', 'revoked_tokens.json');
const revokedTokensMap = new Map(); // tokenHash -> expiresAtMs
const MAX_REVOKED_ENTRIES = 10000;

function loadRevokedTokens() {
  try {
    if (fs.existsSync(REVOKED_TOKENS_FILE)) {
      const raw = fs.readFileSync(REVOKED_TOKENS_FILE, 'utf8');
      const data = JSON.parse(raw);
      const now = Date.now();
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && item.hash && item.exp && item.exp > now) {
            revokedTokensMap.set(item.hash, item.exp);
          }
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ [GÜVENLİK] İptal edilen token listesi yüklenemedi:', err.message);
  }
}

function persistRevokedTokens() {
  try {
    const now = Date.now();
    const active = [];
    for (const [hash, exp] of revokedTokensMap.entries()) {
      if (exp > now) {
        active.push({ hash, exp });
      }
    }
    const trimmed = active.slice(-MAX_REVOKED_ENTRIES);
    const dir = path.dirname(REVOKED_TOKENS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(REVOKED_TOKENS_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
  } catch (err) {
    console.warn('⚠️ [GÜVENLİK] İptal edilen token listesi kaydedilemedi:', err.message);
  }
}

// Kalıcı kara listeyi başlangıçta yükle
loadRevokedTokens();

function hashTokenForBlacklist(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function revokeToken(token) {
  if (!token || typeof token !== 'string') return;
  const decoded = verifyToken(token);
  const expMs = (decoded && decoded.exp ? decoded.exp * 1000 : Date.now() + 12 * 3600 * 1000);
  const tokenHash = hashTokenForBlacklist(token);

  if (revokedTokensMap.size >= MAX_REVOKED_ENTRIES) {
    const now = Date.now();
    for (const [hash, expiry] of revokedTokensMap.entries()) {
      if (expiry <= now) revokedTokensMap.delete(hash);
    }
    if (revokedTokensMap.size >= MAX_REVOKED_ENTRIES) {
      const oldest = revokedTokensMap.keys().next().value;
      if (oldest) revokedTokensMap.delete(oldest);
    }
  }

  revokedTokensMap.set(tokenHash, expMs);
  persistRevokedTokens();
}

function isTokenRevoked(token) {
  if (!token) return true;

  // 1. Global Token Revocation Epoch (Panic Lockdown Mass Invalidation Check)
  try {
    const epoch = lockdownManager.getTokenRevocationEpoch();
    if (epoch > 0) {
      const decoded = verifyToken(token);
      if (decoded && decoded.iat && (decoded.iat * 1000 <= epoch)) {
        return true;
      }
    }
  } catch (_) {}

  // 2. Individual Token Hash Blacklist
  const tokenHash = hashTokenForBlacklist(token);
  const expiry = revokedTokensMap.get(tokenHash);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    revokedTokensMap.delete(tokenHash);
    persistRevokedTokens();
    return false;
  }
  return true;
}

// ==============================================================================
// 5. FAIL-CLOSED AUTHENTICATION MIDDLEWARE
// ==============================================================================
function requireAuth(req, res, next) {
  const path = req.path || req.url || '';
  // Public uç noktalar (istisna listesi)
  const isPublic = 
    path === '/health' ||
    path === '/api/health' ||
    path === '/auth/login' ||
    path === '/api/auth/login' ||
    path === '/auth/emergency-lockdown' ||
    path === '/api/auth/emergency-lockdown' ||
    path === '/auth/emergency-lockdown/restore' ||
    path === '/api/auth/emergency-lockdown/restore' ||
    path.endsWith('/auth/emergency-lockdown/restore') ||
    path === '/robots.txt' ||
    path.endsWith('/robots.txt') ||
    path === '/api/audit/attestation' ||
    path === '/audit/attestation' ||
    path.endsWith('/audit/attestation') ||
    path === '/api/audit/verify-hybrid-signature' ||
    path === '/audit/verify-hybrid-signature' ||
    path.endsWith('/audit/verify-hybrid-signature');

  if (isPublic) {
    return next();
  }

  // Authorization başlığını oku
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    auditLogger.logSecurityEvent('UNAUTHORIZED_ACCESS', {
      req,
      severity: 'WARN',
      status: 401,
      details: { path, reason: 'MISSING_OR_INVALID_AUTH_HEADER' }
    });
    return res.status(401).json({
      success: false,
      error: 'Yetkisiz erişim. Lütfen kullanıcı adı ve şifrenizle giriş yapın.',
      code: 'UNAUTHORIZED'
    });
  }

  const token = authHeader.substring(7).trim();

  // Oturum iptal / çıkış kontrolü (Blacklist)
  if (isTokenRevoked(token)) {
    auditLogger.logSecurityEvent('TOKEN_REVOKED', {
      req,
      severity: 'WARN',
      status: 401,
      details: { path, reason: 'REVOKED_TOKEN_PRESENTED' }
    });
    return res.status(401).json({
      success: false,
      error: 'Bu oturum sonlandırılmış veya geçersiz kılınmıştır. Lütfen tekrar giriş yapın.',
      code: 'TOKEN_REVOKED'
    });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    auditLogger.logSecurityEvent('UNAUTHORIZED_ACCESS', {
      req,
      severity: 'WARN',
      status: 401,
      details: { path, reason: 'TOKEN_EXPIRED_OR_INVALID' }
    });
    return res.status(401).json({
      success: false,
      error: 'Oturum süresi dolmuş veya geçersiz token. Lütfen tekrar giriş yapın.',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Layer 2: Cryptographic Session Fingerprint Verification (Anti-Session Hijacking)
  if (decoded.fgp) {
    const isValidFgp = sessionGuard.verifyFingerprint(decoded.fgp, req);
    if (!isValidFgp) {
      return sessionGuard.handleSessionHijack(req, res, token, decoded);
    }
  }

  // Dual-Tier 2FA Enforcement:
  // Pre-auth tokens or unverified tokens can ONLY access the 2FA verify endpoint.
  // All business endpoints (/api/accounts, /api/contacts, etc.) are blocked with 401 UNAUTHORIZED_2FA_REQUIRED.
  if (decoded.role === 'PRE_AUTH_2FA' || decoded.is2FAVerified === false) {
    const is2faVerifyEndpoint =
      path === '/auth/2fa/verify' ||
      path === '/api/auth/2fa/verify' ||
      path === '/muhasebe/api/auth/2fa/verify' ||
      path.endsWith('/auth/2fa/verify');

    if (is2faVerifyEndpoint) {
      req.user = decoded;
      req.token = token;
      return next();
    }

    auditLogger.logSecurityEvent('UNAUTHORIZED_ACCESS', {
      req,
      user: decoded,
      severity: 'WARN',
      status: 401,
      details: { path, reason: 'UNAUTHORIZED_2FA_REQUIRED', role: decoded.role }
    });
    return res.status(401).json({
      success: false,
      error: 'Bu işlem için iki aşamalı doğrulama (2FA) zorunludur.',
      code: 'UNAUTHORIZED_2FA_REQUIRED'
    });
  }

  req.user = decoded;
  req.token = token;
  next();
}

/**
 * Zero-Knowledge Credential Sanitizer (Phase 8 Ephemeral RAM Scrubbing)
 * Nullifies or zeroizes sensitive fields in user objects, request payloads, or credentials.
 * @param {object} target
 * @returns {object}
 */
function scrubCredentials(target) {
  if (!target || typeof target !== 'object') return target;
  const sensitiveKeys = [
    'password',
    'passwordHash',
    'twoFactorSecret',
    'twoFactorTempSecret',
    'twoFactorRecoveryCodes',
    'secret',
    'tempSecret',
    'recoveryCodes',
    'token',
    'jwt',
    'otp',
    'code',
    'totpCode',
    'apiKey',
    'privateKey'
  ];

  for (const key of sensitiveKeys) {
    if (key in target) {
      if (Buffer.isBuffer(target[key])) {
        target[key].fill(0);
      }
      target[key] = null;
    }
  }

  return target;
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  generatePreAuthToken,
  verifyToken,
  revokeToken,
  isTokenRevoked,
  DUMMY_HASH,
  requireAuth,
  checkBruteForce,
  recordFailedAttempt,
  clearFailedAttempts,
  getClientIp,
  validatePasswordStrength,
  PASSWORD_COMPLEXITY_REGEX,
  BoundedLruMemoryStore,
  sessionGuard,
  scrubCredentials,
  JWT_SECRET
};
