/**
 * BROSAN TEKSTİL ERP — ENTERPRISE AUTHENTICATION & SECURITY MODULE
 * Features:
 * - Kriptografik Bcrypt Parola Hashleme (12 Salt Rounds)
 * - Güvenli JWT (JSON Web Token) Oturum Yönetimi
 * - Brute-Force Kalkanı: IP ve Kullanıcı bazlı 5 hatalı deneme sonrası 15 dakika kilitleme
 * - Fail-Closed API Guard Middleware
 * - Timing-attack korumalı kimlik doğrulama
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'BrosanTekstil2026EnterpriseSuperSecretSecurityKey!@#$987654321';
const JWT_EXPIRES_IN = '12h'; // 12 saatlik güvenli tavan oturum

// ==============================================================================
// 1. IN-MEMORY BRUTE FORCE DEFENSE (IP & USERNAME LOCKOUT)
// ==============================================================================
const failedAttemptsMap = new Map(); // key: ip_or_username, value: { count, firstAttempt, lockedUntil }
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 dakika
const WINDOW_DURATION_MS = 15 * 60 * 1000; // 15 dakikalık pencere

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
// 2. PAROLA HASHLEME VE DOĞRULAMA
// ==============================================================================
function hashPassword(password) {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(password, salt);
}

function verifyPassword(password, hash) {
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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// ==============================================================================
// 4. FAIL-CLOSED AUTHENTICATION MIDDLEWARE
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
  clearFailedAttempts
};
