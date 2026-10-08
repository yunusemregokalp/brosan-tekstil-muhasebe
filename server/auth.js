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
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    fullName: user.fullName || user.username,
    role: user.role || 'ADMIN'
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' });
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
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    // IPv4 / IPv6 temel doğrulama
    if (/^[a-fA-F0-9:.]+$/.test(firstIp)) {
      return firstIp;
    }
  }
  return req.socket.remoteAddress || '127.0.0.1';
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
    path === '/robots.txt' ||
    path.endsWith('/robots.txt');

  if (isPublic) {
    return next();
  }

  // Authorization başlığını oku
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Yetkisiz erişim. Lütfen kullanıcı adı ve şifrenizle giriş yapın.',
      code: 'UNAUTHORIZED'
    });
  }

  const token = authHeader.substring(7).trim();
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Oturum süresi dolmuş veya geçersiz token. Lütfen tekrar giriş yapın.',
      code: 'TOKEN_EXPIRED'
    });
  }

  req.user = decoded;
  next();
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  requireAuth,
  checkBruteForce,
  recordFailedAttempt,
  clearFailedAttempts,
  getClientIp,
  validatePasswordStrength,
  PASSWORD_COMPLEXITY_REGEX
};
