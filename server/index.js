/**
 * BROSAN TEKSTİL ERP — PRODUCTION BACKEND SERVER
 * Architecture: Node.js + Express + Prisma ORM + PostgreSQL
 * Ready for Docker & Coolify Deployment
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const auth = require('./auth');
const totp = require('./totp');
const { quarantineEngine, quarantineGuard } = require('./quarantine');
const threatAlerter = require('./threatAlerter');
const cryptoVault = require('./cryptoVault');
const { lockdownManager, lockdownGuard } = require('./lockdown');
const { heuristicWafGuard } = require('./heuristicWaf');
const ledgerIntegrity = require('./ledgerIntegrity');
const { honeytokenRouteGuard, honeytokenParamGuard } = require('./honeytoken');
const { requestSignatureGuard } = require('./requestSignature');
const { memoryIntegritySentinel } = require('./memoryIntegritySentinel');
const { egressFirewall } = require('./egressFirewall');
const { ephemeralTokenGuard, ephemeralTokenEngine } = require('./ephemeralTokens');
const { proofOfWorkGuard, proofOfWorkEngine } = require('./proofOfWork');
const { processArmor } = require('./processArmor');
const { behavioralShieldGuard, behavioralShieldEngine } = require('./behavioralShield');
const dbGuard = require('./dbGuard');
const { responseArmorGuard, responseArmor } = require('./responseArmor');
const { processSandboxMiddleware, ...processSandboxing } = require('./processSandboxing');
const { honeyFilesGuard, ...honeyFiles } = require('./honeyFiles');
const {
  LoginSchema,
  ChangePasswordSchema,
  AccountSchema,
  ContactSchema,
  JournalEntrySchema,
  InvoiceSchema,
  ProductSchema,
  TransactionSchema,
  CheckSchema,
  CheckStatusSchema,
  EmployeeSchema,
  validateBody
} = require('./validators');
const { auditMiddleware, logSecurityEvent } = require('./auditLogger');

const app = express();
app.egressFirewall = egressFirewall;
app.ephemeralTokenEngine = ephemeralTokenEngine;
app.proofOfWorkEngine = proofOfWorkEngine;
app.processArmor = processArmor;
app.behavioralShield = behavioralShieldEngine;
app.dbGuard = dbGuard;
app.responseArmor = responseArmor;
app.processSandboxing = processSandboxing;
app.honeyFiles = honeyFiles;

const PORT = process.env.PORT || 3000;
const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
const prisma = dbGuard.withDbGuard(cryptoVault.withCryptoVault(basePrisma));

// ==============================================================================
// SOVEREIGN CITADEL DEFENSE INITIALIZATION (PHASE 6)
// ==============================================================================
processArmor.activate();
egressFirewall.install();

// Güvenlik: Ters Vekil (Traefik / Coolify) İstemci IP Doğrulaması (Anti-IP-Spoofing)
app.set('trust proxy', 1);

// Güvenlik: Parmak İzi Gizleme (X-Powered-By Express başlığını tamamen kaldır)
app.disable('x-powered-by');

// Güvenlik: SIEM Güvenlik Denetim Günlüğü Middleware'i
app.use(auditMiddleware);

// Güvenlik: Süreç Kum Havuzu ve Yürütme Kilidi (Phase 8 Process Sandboxing)
app.use(processSandboxMiddleware);

// Güvenlik: Düşmanca Sızma Aldatma Ağı ve Dinamik Yem Dosyaları (Phase 8 Honeyfiles Deception Mesh)
app.use(honeyFilesGuard);

// ==============================================================================
// 0. HOST HEADER GÜVENLİK KALKANI (REVERSE PROXY ORIGIN BINDING - 403 FORBIDDEN)
// ==============================================================================
const ALLOWED_HOSTS = new Set([
  'brosangroup.com',
  'muhasebe.brosangroup.com',
  'www.brosangroup.com',
  'localhost',
  '127.0.0.1',
  '::1'
]);

app.use((req, res, next) => {
  const hostHeader = req.headers.host || '';
  // Desteklenen formatlar: domain.com, domain.com:port, [::1]:port
  const host = hostHeader.replace(/^\[([a-fA-F0-9:]+)\](?::\d+)?$/, '$1').split(':')[0].toLowerCase();
  if (!host || !ALLOWED_HOSTS.has(host)) {
    return res.status(403).json({
      success: false,
      error: 'Erişim engellendi: İzin verilmeyen Host başlığı (Forbidden Host).',
      code: 'FORBIDDEN_HOST'
    });
  }
  next();
});

// ==============================================================================
// 0.045 APEX CITADEL AKTİF BAL KÜPÜ ROTA TUZAKLARI (HONEYTOKEN ROUTE TRAPS)
// ==============================================================================
// Mount BEFORE quarantineGuard: decoy routes must always trigger 24h honeypot
// escalation, critical threat alerting, and SIEM audit logging even if the IP
// was previously quarantined for a lesser violation.
app.use(honeytokenRouteGuard);

// ==============================================================================
// 0.05 DİNAMİK IP KARANTİNA KALKANI (FAIL2BAN SHIELD - 403 IP_QUARANTINED)
// ==============================================================================
app.use(quarantineGuard);

// ==============================================================================
// 0.08 ACİL DURUM KİLİT KALKANI (EMERGENCY PANIC LOCKDOWN - 503 SYSTEM_IN_LOCKDOWN)
// ==============================================================================
app.use(lockdownGuard);

// ==============================================================================
// 0.1 HASSAS SİSTEM VE GİZLİ DOSYA ENGELLEME (ANTI-TRAVERSAL, ANTI-QUERY, DUAL-DECODE)
// ==============================================================================
app.use((req, res, next) => {
  let rawUrl = req.url || '';
  // Sorgu parametreleri (?v=1) ve çapa (#) ayıklama
  const rawPath = rawUrl.split('?')[0].split('#')[0];

  // Çift katmanlı URL decode (Dual-Decode: %252e -> %2e -> .)
  let decodedPath = rawPath;
  try {
    decodedPath = decodeURIComponent(decodedPath);
  } catch (e) {
    return res.status(400).json({ success: false, error: 'Geçersiz URI biçimi', code: 'INVALID_URI' });
  }
  try {
    if (decodedPath.includes('%')) {
      decodedPath = decodeURIComponent(decodedPath);
    }
  } catch (_) {}

  // Null byte injection denetimi
  if (rawUrl.includes('\0') || rawUrl.toLowerCase().includes('%00') || decodedPath.includes('\0')) {
    const clientIp = auth.getClientIp(req);
    quarantineEngine.quarantineIp(clientIp, 'PROBING_SENSITIVE_FILES', { path: rawUrl });
    logSecurityEvent('SENSITIVE_FILE_PROBE', {
      req,
      severity: 'CRITICAL',
      status: 403,
      clientIp,
      details: { rawUrl, reason: 'NULL_BYTE_INJECTION' }
    });
    try {
      threatAlerter.alertSensitiveProbe(clientIp, rawUrl, {
        rawUrl,
        reason: 'NULL_BYTE_INJECTION'
      });
    } catch (_) {}
    return res.status(403).json({
      success: false,
      error: 'Erişim engellendi: Geçersiz karakter tespiti.',
      code: 'FORBIDDEN_FILE',
      quarantined: !quarantineEngine.isWhitelisted(clientIp)
    });
  }

  // Yol ayraçlarını standartlaştır ve dizin gezinme (..) çözümle
  const normalized = path.posix.normalize(decodedPath.replace(/\\/g, '/')).toLowerCase();

  // Dizin atlama / Path Traversal denetimi
  const hasTraversal = normalized.includes('..') || rawUrl.includes('..') || rawUrl.toLowerCase().includes('%2e%2e');

  // Gizli dosya / Dotfile denetimi (.env, .git, .sqlite vb.)
  const hasDotfile = /(?:^|\/)\.(?:[a-z0-9_-]+)/i.test(normalized) ||
                     /(?:^|\/)\.(?:env|git|svn|htaccess|htpasswd|aws|ssh|dockerignore|gitignore)/i.test(normalized);

  // Hassas uzantı denetimi
  const hasSensitiveExt = /\.(db|sqlite|sqlite3|log|key|pem|cert|crt|bak|backup|sql|tar|gz|zip|env)$/i.test(normalized);

  if (hasTraversal || hasDotfile || hasSensitiveExt) {
    const clientIp = auth.getClientIp(req);
    quarantineEngine.quarantineIp(clientIp, 'PROBING_SENSITIVE_FILES', { path: rawUrl });
    logSecurityEvent('SENSITIVE_FILE_PROBE', {
      req,
      severity: 'CRITICAL',
      status: 403,
      clientIp,
      details: {
        rawUrl,
        normalized,
        hasTraversal,
        hasDotfile,
        hasSensitiveExt
      }
    });
    try {
      threatAlerter.alertSensitiveProbe(clientIp, rawUrl, {
        rawUrl,
        normalized,
        hasTraversal,
        hasDotfile,
        hasSensitiveExt
      });
    } catch (_) {}
    return res.status(403).json({
      success: false,
      error: 'Erişim engellendi: Bu dosya tipine veya gizli dizine erişim izni yoktur.',
      code: 'FORBIDDEN_FILE',
      quarantined: !quarantineEngine.isWhitelisted(clientIp)
    });
  }
  next();
});

// ==============================================================================
// 0.2 URL YENİDEN YÖNLENDİRME (URL REWRITE: /muhasebe/api/* -> /api/*)
// Hız sınırı ve rota eşleşmelerinden ÖNCE çalıştırılır
// ==============================================================================
app.use((req, res, next) => {
  if (req.url.startsWith('/muhasebe/api')) {
    req.url = req.url.replace(/^\/muhasebe\/api/, '/api');
  }
  next();
});

// Güvenlik: Helmet Çok Katmanlı Güvenlik Kalkanı & CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://brosangroup.com", "https://www.brosangroup.com"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true
}));

// Güvenlik: Gelişmiş HTTP Yanıt Zırhı (COOP, COEP, CORP, Permissions-Policy, Cache-Control - Phase 7)
app.use(responseArmorGuard);

// Güvenlik: Sıkılaştırılmış CORS Politikası (Yalnızca Yetkili Kökler)
const ALLOWED_ORIGINS = [
  'https://brosangroup.com',
  'https://www.brosangroup.com'
];
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173');
}

app.use(cors({
  origin: (origin, callback) => {
    // Mobil uygulamalar, sunucular arası çağrılar veya aynı köken
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1 || process.env.CORS_ALLOW_ALL === 'true') {
      return callback(null, true);
    }
    return callback(new Error('CORS Güvenlik Engeli: Bu kökene erişim izni verilmemiştir.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Brosan-Signature',
    'X-Brosan-Timestamp',
    'X-Brosan-Nonce',
    'X-Brosan-PoW-Challenge',
    'X-Brosan-PoW-Seed',
    'X-Brosan-PoW-Difficulty',
    'X-Brosan-PoW-Expires',
    'X-Brosan-PoW-Signature',
    'X-Brosan-PoW-Nonce'
  ],
  exposedHeaders: [
    'X-Brosan-Next-Token',
    'X-Brosan-PoW-Challenge',
    'X-Brosan-PoW-Difficulty',
    'X-Brosan-PoW-Expires'
  ],
  credentials: true,
  maxAge: 86400
}));

// Güvenlik: DoS ve Bellek Tükenmesi Korumalı Yük Sınırları (100KB tavan) ve Ham Gövde Doğrulaması
app.use(express.json({
  limit: '100kb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ==============================================================================
// 0.24 APEX CITADEL AKTİF BAL KÜPÜ PARAMETRE TUZAKLARI (HONEYTOKEN PARAM TRAPS)
// ==============================================================================
app.use(honeytokenParamGuard);

// Güvenlik: Derin Uçuş-İçi Sezgisel WAF ve Yük Denetçisi (Heuristic WAF Payload Guard)
// SQLi, NoSQLi, XSS, Prototype Pollution ve Dizin Atlama (Path Traversal) engelleme
app.use(heuristicWafGuard);

// ==============================================================================
// 0.25 SOVEREIGN APEX CITADEL DAVRANIŞSAL ANOMALİ VE HIZ KALKANI (PHASE 7)
// ==============================================================================
app.use(['/api', '/muhasebe/api'], behavioralShieldGuard);

// Güvenlik: Global API Hız Sınırı (Bounded LRU Store: Max 5000 Anahtar, Dakikada 120 İstek / IP)
const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  store: new auth.BoundedLruMemoryStore({ maxEntries: 5000 }),
  message: {
    success: false,
    error: 'Çok fazla istek gönderildi. Lütfen bir dakika sonra tekrar deneyin (Hız Sınırı Aşıldı).',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use(['/api', '/muhasebe/api'], globalApiLimiter);

// ==============================================================================
// 0.35 SOVEREIGN CITADEL EPHEMERAL SLIDING TOKEN ROTATION & REPLAY TRAP (PHASE 6)
// ==============================================================================
app.use(['/api', '/muhasebe/api'], ephemeralTokenGuard);

// ==============================================================================
// 0.36 APEX CITADEL KRİPTOGRAFİK İSTEK İMZA VE REPLAY GUARD (REQUEST SIGNATURE)
// ==============================================================================
app.use(requestSignatureGuard);

// Güvenlik: Giriş Kapısı Hız Sınırı (Bounded LRU Store: 15 dakikada 10 deneme / IP)
const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new auth.BoundedLruMemoryStore({ maxEntries: 5000 }),
  handler: (req, res, next) => {
    const clientIp = auth.getClientIp(req);
    quarantineEngine.quarantineIp(clientIp, 'BRUTE_FORCE_LOGIN_EXCEEDED');
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      req,
      severity: 'WARN',
      status: 429,
      clientIp,
      details: { endpoint: '/api/auth/login', reason: 'LOGIN_RATE_LIMIT_EXCEEDED' }
    });
    return res.status(429).json({
      success: false,
      error: 'Giriş deneme sınırı aşıldı. Lütfen 15 dakika sonra tekrar deneyin.',
      code: 'LOGIN_RATE_LIMIT_EXCEEDED',
      quarantined: !quarantineEngine.isWhitelisted(clientIp)
    });
  }
});

// ==============================================================================
// GHOST MODE & ANTI-INDEXING SECURITY HEADERS (KİMSE GÖREMEZ / ASLA İNDEKSLENMEZ)
// ==============================================================================
app.use((req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
});

// Explicit robots.txt endpoint blocking all search engine spiders & bots
const ROBOTS_TXT_CONTENT = 'User-agent: *\nDisallow: /\n';
app.get(['/robots.txt', '/muhasebe/robots.txt'], (req, res) => {
  res.type('text/plain');
  res.send(ROBOTS_TXT_CONTENT);
});

// Serve Frontend Static Files on both '/' and '/muhasebe' with strict dotfiles denial
const appStaticDir = path.join(__dirname, '..', 'app');
const staticOptions = {
  dotfiles: 'deny',
  index: ['index.html'],
  maxAge: '1h'
};
app.use(express.static(appStaticDir, staticOptions));
app.use('/muhasebe', express.static(appStaticDir, staticOptions));

// Route handlers for /muhasebe subpath SPA navigation
app.get(['/muhasebe', '/muhasebe/*'], (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/muhasebe/api')) {
    return next();
  }
  res.sendFile(path.join(appStaticDir, 'index.html'));
});

// Helper: Prisma Connection Checker (with 5s cooldown to avoid connection timeouts when offline)
let isDbConnected = false;
let lastDbCheckTime = 0;
async function checkDbConnection() {
  const now = Date.now();
  if (!isDbConnected && (now - lastDbCheckTime < 5000)) {
    return false;
  }
  lastDbCheckTime = now;
  try {
    await prisma.$queryRaw`SELECT 1`;
    isDbConnected = true;
    return true;
  } catch (err) {
    isDbConnected = false;
    return false;
  }
}
checkDbConnection();

// Güvenli Hata Yanıtlayıcı (Teknoloji sızıntısını ve ham veritabanı hatalarını önler)
function sendSafeError(res, status = 500, clientMessage = 'İşlem sırasında bir sunucu hatası oluştu.', internalError = null) {
  if (internalError) {
    console.error('⚠️ [GÜVENLİK/SUNUCU HATASI]:', internalError.message || internalError);
  }
  if (dbGuard.isDatabaseError(internalError)) {
    return res.status(status).json({
      success: false,
      error: 'DATABASE_OPERATION_FAILED',
      code: 'DATABASE_OPERATION_FAILED'
    });
  }
  return res.status(status).json({
    success: false,
    error: clientMessage
  });
}

// ==============================================================================
// 1. HEALTHCHECK & SYSTEM STATUS (Coolify / Docker Probe)
// ==============================================================================
app.get('/api/health', async (req, res) => {
  const dbOk = await checkDbConnection();
  res.status(200).json({
    status: dbOk ? 'healthy' : 'degraded',
    service: 'brosan-tekstil-erp',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// ==============================================================================
// 1.1 SİBER GÜVENLİK & KİMLİK DOĞRULAMA (LOGIN, LOGOUT, ME, CHANGE-PASSWORD)
// ==============================================================================
// Çevrimdışı / Yerel Fallback 2FA Hafıza Durumu
const localAdmin2FA = {
  enabled: false,
  secret: null,
  tempSecret: null,
  lastStep: null,
  recoveryCodes: null
};

app.post('/api/auth/login', authLoginLimiter, proofOfWorkGuard, validateBody(LoginSchema), async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = auth.getClientIp(req);

    // 1. IP ve Kullanıcı bazlı Brute-Force Kalkanı Kontrolü
    const ipCheck = auth.checkBruteForce(`ip:${clientIp}`);
    const userCheck = auth.checkBruteForce(`user:${username.toLowerCase()}`);
    if (ipCheck.isLocked || userCheck.isLocked) {
      const waitSec = Math.max(ipCheck.remainingSec || 0, userCheck.remainingSec || 0);
      const ipRecord = auth.recordFailedAttempt(`ip:${clientIp}`);
      if (ipRecord && ipRecord.count >= 10) {
        quarantineEngine.quarantineIp(clientIp, 'BRUTE_FORCE_LOGIN_EXCEEDED');
      }
      logSecurityEvent('LOGIN_LOCKED', {
        req,
        severity: 'WARN',
        status: 429,
        clientIp,
        details: { username, remainingSec: waitSec, reason: 'BRUTE_FORCE_LOCKOUT' }
      });
      try {
        threatAlerter.alertBruteForceLockout(clientIp, username, {
          remainingSec: waitSec,
          reason: 'BRUTE_FORCE_LOCKOUT'
        });
      } catch (_) {}
      return res.status(429).json({
        success: false,
        error: `Çok fazla hatalı giriş denemesi yapıldı! Güvenlik nedeniyle erişiminiz ${waitSec} saniye kilitlendi.`,
        locked: true,
        remainingSec: waitSec
      });
    }

    // 2. Kullanıcıyı Veritabanında veya Fallback Modunda Ara
    let user = null;
    const dbOk = await checkDbConnection();
    if (dbOk) {
      user = await prisma.user.findUnique({
        where: { username: username.trim() }
      });
    } else {
      // Çevrimdışı / Yerel Fallback
      if (username.trim() === 'admin') {
        const adminPass = process.env.ADMIN_INITIAL_PASSWORD || 'Brosan2026!SecureErp';
        user = {
          id: 'local-admin-id',
          username: 'admin',
          passwordHash: auth.hashPassword(adminPass),
          fullName: 'Yunus Emre Gökalp (Yönetici)',
          role: 'ADMIN',
          isActive: true,
          twoFactorEnabled: localAdmin2FA.enabled,
          twoFactorSecret: localAdmin2FA.secret,
          twoFactorTempSecret: localAdmin2FA.tempSecret,
          twoFactorLastStep: localAdmin2FA.lastStep,
          twoFactorRecoveryCodes: localAdmin2FA.recoveryCodes
        };
      }
    }

    // DB bazlı kalıcı kilit kontrolü
    if (user && user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const waitSec = Math.ceil((new Date(user.lockedUntil) - Date.now()) / 1000);
      logSecurityEvent('LOGIN_LOCKED', {
        req,
        severity: 'WARN',
        status: 429,
        clientIp,
        details: { username, remainingSec: waitSec, reason: 'ACCOUNT_LOCKED_UNTIL' }
      });
      try {
        threatAlerter.alertBruteForceLockout(clientIp, username, {
          remainingSec: waitSec,
          reason: 'ACCOUNT_LOCKED_UNTIL'
        });
      } catch (_) {}
      return res.status(429).json({
        success: false,
        error: `Çok fazla hatalı giriş denemesi yapıldı! Hesabınız güvenlik nedeniyle ${waitSec} saniye kilitlendi.`,
        locked: true,
        remainingSec: waitSec
      });
    }

    const hashToCompare = user ? user.passwordHash : auth.DUMMY_HASH;
    const isValid = Boolean(user && auth.verifyPassword(password, hashToCompare));

    // Phase 8 Zero-Knowledge Memory Scrubbing: Sever password and rawBody from memory
    if (req.body) {
      req.body.password = null;
      if (typeof auth.scrubCredentials === 'function') {
        auth.scrubCredentials(req.body);
      }
    }
    req.rawBody = null;

    if (!isValid) {
      const ipRecord = auth.recordFailedAttempt(`ip:${clientIp}`);
      auth.recordFailedAttempt(`user:${username.toLowerCase()}`);

      // Tekrarlanan brute-force saldırganını dinamik karantinaya al (Fail2ban)
      if (ipRecord && ipRecord.count >= 10) {
        quarantineEngine.quarantineIp(clientIp, 'BRUTE_FORCE_LOGIN_EXCEEDED');
      }

      // DB'de hatalı denemeyi ve kilidi kalıcı kaydet
      if (dbOk && user && user.id !== 'local-admin-id') {
        const nextAttempts = (user.failedAttempts || 0) + 1;
        const willLock = nextAttempts >= 5;
        if (nextAttempts >= 10) {
          quarantineEngine.quarantineIp(clientIp, 'BRUTE_FORCE_LOGIN_EXCEEDED');
        }
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedAttempts: nextAttempts,
            lockedUntil: willLock ? new Date(Date.now() + 15 * 60 * 1000) : user.lockedUntil
          }
        }).catch(() => {});
      }

      logSecurityEvent('LOGIN_FAILURE', {
        req,
        severity: 'WARN',
        status: 401,
        clientIp,
        details: { username, reason: 'INVALID_CREDENTIALS' }
      });

      return res.status(401).json({
        success: false,
        error: 'Kullanıcı adı veya şifre hatalı!'
      });
    }

    // 4. Aktiflik ve Kilit Kontrolü
    if (!user.isActive) {
      logSecurityEvent('LOGIN_FAILURE', {
        req,
        severity: 'WARN',
        status: 403,
        clientIp,
        details: { username, reason: 'ACCOUNT_INACTIVE' }
      });
      return res.status(403).json({ success: false, error: 'Bu kullanıcı hesabı devre dışı bırakılmıştır.' });
    }

    // 5. Başarılı Giriş: Sayaçları sıfırla ve token üret
    auth.clearFailedAttempts(`ip:${clientIp}`);
    auth.clearFailedAttempts(`user:${username.toLowerCase()}`);

    if (dbOk && user.id !== 'local-admin-id') {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date(), failedAttempts: 0, lockedUntil: null }
      }).catch(() => {});
    }

    // 2FA Kontrolü: 2FA etkinse kısıtlı preAuthToken yayınla
    const is2faActive = user.id === 'local-admin-id'
      ? Boolean(localAdmin2FA.enabled)
      : Boolean(user.twoFactorEnabled);

    if (is2faActive) {
      const preAuthToken = auth.generatePreAuthToken(user, req);
      logSecurityEvent('LOGIN_SUCCESS', {
        req,
        severity: 'INFO',
        status: 200,
        clientIp,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        details: {
          username: user.username,
          requires2FA: true,
          type: 'PRE_AUTH_2FA'
        }
      });
      return res.status(200).json({
        success: true,
        requires2FA: true,
        preAuthToken,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role
        }
      });
    }

    const wantsEphemeral = (req.headers && req.headers['x-brosan-ephemeral'] === 'true') || (req.body && req.body.ephemeral === true);
    const token = wantsEphemeral
      ? ephemeralTokenEngine.createInitialToken(user, req)
      : auth.generateToken(user, req);

    logSecurityEvent('LOGIN_SUCCESS', {
      req,
      severity: 'INFO',
      status: 200,
      clientIp,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      details: {
        username: user.username,
        requires2FA: false,
        type: 'FULL_ACCESS'
      }
    });

    res.status(200).json({
      success: true,
      requires2FA: false,
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    return sendSafeError(res, 500, 'Giriş işlemi sırasında sunucu hatası oluştu.', error);
  }
});

// Oturum Bilgisi Doğrulama
app.get('/api/auth/me', auth.requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

// Oturumu Kapatma (Token Anında İptal Edilir / Blacklist)
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    auth.revokeToken(token);
  }
  logSecurityEvent('TOKEN_REVOKED', {
    req,
    severity: 'INFO',
    status: 200,
    details: { reason: 'USER_LOGOUT' }
  });
  res.status(200).json({ success: true, message: 'Oturum başarıyla kapatıldı ve token iptal edildi.' });
});

// Şifre Değiştirme (Askeri Düzey Parola Güvenliği Denetimi & Token Revocation)
app.post('/api/auth/change-password', auth.requireAuth, validateBody(ChangePasswordSchema), async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const dbOk = await checkDbConnection();
    if (!dbOk) {
      return res.status(503).json({ success: false, error: 'Veritabanı bağlantısı yok, şifre güncellenemez.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !auth.verifyPassword(oldPassword, user.passwordHash)) {
      return res.status(400).json({ success: false, error: 'Mevcut şifreniz hatalı.' });
    }

    const newHash = auth.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });

    // Mevcut oturum token'ını iptal et (Force Re-Authentication)
    if (req.token) {
      auth.revokeToken(req.token);
    }

    res.status(200).json({ success: true, message: 'Şifreniz başarıyla güncellendi! Güvenlik nedeniyle lütfen yeni şifrenizle tekrar giriş yapın.' });
  } catch (err) {
    return sendSafeError(res, 500, 'Şifre güncellenirken sunucu hatası oluştu.', err);
  }
});

// ==============================================================================
// 1.1.1 İKİ AŞAMALI DOĞRULAMA (RFC 6238 TOTP 2FA SHIELD)
// ==============================================================================
const auth2FaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: new auth.BoundedLruMemoryStore({ maxEntries: 5000 }),
  message: {
    success: false,
    error: 'Çok fazla 2FA denemesi yapıldı. Lütfen 15 dakika sonra tekrar deneyin.',
    code: '2FA_RATE_LIMIT_EXCEEDED'
  }
});

// 2FA Doğrulama & High-Privilege Token Takası
app.post('/api/auth/2fa/verify', auth2FaLimiter, auth.requireAuth, async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Doğrulama kodu zorunludur.',
        code: 'INVALID_CODE_FORMAT'
      });
    }

    const cleanCode = code.trim();
    const clientIp = auth.getClientIp(req);
    const dbOk = await checkDbConnection();
    let user = null;

    if (dbOk && req.user.id !== 'local-admin-id') {
      user = await prisma.user.findUnique({ where: { id: req.user.id } });
    } else if (req.user.username === 'admin' || req.user.id === 'local-admin-id') {
      user = {
        id: 'local-admin-id',
        username: 'admin',
        fullName: 'Yunus Emre Gökalp (Yönetici)',
        role: 'ADMIN',
        isActive: true,
        twoFactorEnabled: localAdmin2FA.enabled,
        twoFactorSecret: localAdmin2FA.secret,
        twoFactorLastStep: localAdmin2FA.lastStep,
        twoFactorRecoveryCodes: localAdmin2FA.recoveryCodes
      };
    }

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        error: 'İki aşamalı doğrulama bu kullanıcı için aktif değildir.',
        code: '2FA_NOT_ENABLED'
      });
    }

    // 1. Tek kullanımlık kurtarma kodu kontrolü (Hashed single-use recovery code)
    let recoveryMatched = false;
    let remainingRecovery = [];
    if (user.twoFactorRecoveryCodes) {
      try {
        const parsed = JSON.parse(user.twoFactorRecoveryCodes);
        if (Array.isArray(parsed)) {
          const recCheck = totp.verifyRecoveryCode(cleanCode, parsed);
          if (recCheck.valid) {
            recoveryMatched = true;
            remainingRecovery = recCheck.remainingCodes;
          }
        }
      } catch (_) {}
    }

    // 2. RFC 6238 TOTP Doğrulaması (Eğer kurtarma kodu kullanılmadıysa)
    let totpResult = { valid: false };
    if (!recoveryMatched) {
      totpResult = totp.verifyTotp(user.twoFactorSecret, cleanCode, user.twoFactorLastStep);
    }

    if (!recoveryMatched && !totpResult.valid) {
      auth.recordFailedAttempt(`ip:${clientIp}`);
      auth.recordFailedAttempt(`user:${user.username.toLowerCase()}`);

      logSecurityEvent('2FA_VERIFY_FAILURE', {
        req,
        severity: 'WARN',
        status: 401,
        clientIp,
        user: { id: user.id, username: user.username, role: user.role },
        details: {
          username: user.username,
          reason: totpResult.code || 'INVALID_2FA_CODE'
        }
      });

      if (totpResult.code === 'REPLAY_ATTACK') {
        try {
          threatAlerter.alertReplayAttack(clientIp, user.username, {
            step: totpResult.step ? totpResult.step.toString() : null
          });
        } catch (_) {}
        return res.status(401).json({
          success: false,
          error: 'Tek kullanımlık kod daha önce kullanılmıştır (Anti-Replay koruması).',
          code: 'REPLAY_ATTACK'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'İki aşamalı doğrulama kodu geçersiz.',
        code: 'INVALID_2FA_CODE'
      });
    }

    // Başarılı doğrulama: Hatalı deneme sayaçlarını sıfırla
    auth.clearFailedAttempts(`ip:${clientIp}`);
    auth.clearFailedAttempts(`user:${user.username.toLowerCase()}`);

    // DB veya Yerel Hafıza Güncellemesi (Anti-Replay monotonic step veya kullanılan kurtarma kodu)
    if (dbOk && user.id !== 'local-admin-id') {
      const updateData = {};
      if (recoveryMatched) {
        updateData.twoFactorRecoveryCodes = JSON.stringify(remainingRecovery);
      } else if (totpResult.step !== undefined) {
        updateData.twoFactorLastStep = totpResult.step;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: updateData
      }).catch(() => {});
    } else {
      if (recoveryMatched) {
        localAdmin2FA.recoveryCodes = JSON.stringify(remainingRecovery);
      } else if (totpResult.step !== undefined) {
        localAdmin2FA.lastStep = totpResult.step;
      }
    }

    // Geçici preAuthToken'ı iptal et (Tekrar kullanılamaz)
    if (req.token) {
      auth.revokeToken(req.token);
    }

    // Yüksek yetkili ve 2FA onaylı kalıcı oturum token'ı üret
    const fullToken = auth.generateToken(user, { is2FAVerified: true }, req);

    logSecurityEvent('2FA_VERIFY_SUCCESS', {
      req,
      severity: 'INFO',
      status: 200,
      clientIp,
      user: { id: user.id, username: user.username, role: user.role },
      details: {
        username: user.username,
        recoveryUsed: recoveryMatched
      }
    });

    res.status(200).json({
      success: true,
      token: fullToken,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      },
      recoveryUsed: recoveryMatched
    });
  } catch (err) {
    return sendSafeError(res, 500, '2FA doğrulama sırasında sunucu hatası oluştu.', err);
  }
});

// 2FA Durum Sorgulama
app.get('/api/auth/2fa/status', auth.requireAuth, async (req, res) => {
  try {
    const dbOk = await checkDbConnection();
    let user = null;
    if (dbOk && req.user.id !== 'local-admin-id') {
      user = await prisma.user.findUnique({ where: { id: req.user.id } });
    } else if (req.user.username === 'admin' || req.user.id === 'local-admin-id') {
      user = {
        twoFactorEnabled: localAdmin2FA.enabled
      };
    }

    res.status(200).json({
      success: true,
      enabled: Boolean(user && user.twoFactorEnabled),
      verified: Boolean(req.user && req.user.is2FAVerified)
    });
  } catch (err) {
    return sendSafeError(res, 500, '2FA durum sorgulanırken sunucu hatası oluştu.', err);
  }
});

// 2FA Kurulum Başlatma (Secret, QR Code SVG & Data URL, Kurtarma Kodları)
app.post('/api/auth/2fa/setup', auth.requireAuth, async (req, res) => {
  try {
    const secret = totp.generateSecret(20);
    const username = req.user.username || 'admin';
    const otpauthUri = totp.getOtpauthUri(username, secret);
    const qr = totp.generateQrSvg(otpauthUri);
    const recovery = totp.generateRecoveryCodes(8);

    const dbOk = await checkDbConnection();
    if (dbOk && req.user.id !== 'local-admin-id') {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          twoFactorTempSecret: secret,
          twoFactorRecoveryCodes: JSON.stringify(recovery.hashedCodes)
        }
      }).catch(() => {});
    } else {
      localAdmin2FA.tempSecret = secret;
      localAdmin2FA.recoveryCodes = JSON.stringify(recovery.hashedCodes);
    }

    res.status(200).json({
      success: true,
      secret,
      otpauthUri,
      qrCodeDataUrl: qr.dataUrl,
      qrCodeSvg: qr.svg,
      recoveryCodes: recovery.plainCodes
    });
  } catch (err) {
    return sendSafeError(res, 500, '2FA kurulum başlatılırken sunucu hatası oluştu.', err);
  }
});

// 2FA Kurulumunu Doğrulayıp Aktif Etme
app.post('/api/auth/2fa/verify-setup', auth.requireAuth, async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Kurulum doğrulama kodu zorunludur.',
        code: 'INVALID_CODE_FORMAT'
      });
    }

    const cleanCode = code.trim();
    const dbOk = await checkDbConnection();
    let user = null;
    let tempSecret = null;

    if (dbOk && req.user.id !== 'local-admin-id') {
      user = await prisma.user.findUnique({ where: { id: req.user.id } });
      tempSecret = user ? user.twoFactorTempSecret : null;
    } else {
      user = {
        id: 'local-admin-id',
        username: 'admin',
        role: 'ADMIN',
        fullName: 'Yunus Emre Gökalp (Yönetici)'
      };
      tempSecret = localAdmin2FA.tempSecret;
    }

    if (!tempSecret) {
      return res.status(400).json({
        success: false,
        error: 'Aktif bir 2FA kurulum isteği bulunamadı. Lütfen önce kurulumu başlatın.',
        code: 'SETUP_NOT_INITIATED'
      });
    }

    const verifyResult = totp.verifyTotp(tempSecret, cleanCode);
    if (!verifyResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'Doğrulama kodu hatalı. Lütfen Google Authenticator / 1Password üzerindeki 6 haneli kodu kontrol edin.',
        code: 'INVALID_2FA_CODE'
      });
    }

    if (dbOk && user.id !== 'local-admin-id') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: tempSecret,
          twoFactorTempSecret: null,
          twoFactorLastStep: verifyResult.step
        }
      });
    } else {
      localAdmin2FA.enabled = true;
      localAdmin2FA.secret = tempSecret;
      localAdmin2FA.tempSecret = null;
      localAdmin2FA.lastStep = verifyResult.step;
    }

    if (req.token) {
      auth.revokeToken(req.token);
    }
    const updatedUser = {
      ...user,
      twoFactorEnabled: true
    };
    const newToken = auth.generateToken(updatedUser, { is2FAVerified: true }, req);

    res.status(200).json({
      success: true,
      message: 'İki aşamalı doğrulama (2FA) başarıyla etkinleştirildi.',
      token: newToken
    });
  } catch (err) {
    return sendSafeError(res, 500, '2FA kurulum doğrulanırken sunucu hatası oluştu.', err);
  }
});

// 2FA Devre Dışı Bırakma (Şifre + TOTP veya Kurtarma Kodu Doğrulaması Şart)
app.post('/api/auth/2fa/disable', auth.requireAuth, async (req, res) => {
  try {
    const { password, code } = req.body || {};
    if (!password || !code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Mevcut şifre ve 2FA kodu gereklidir.',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const cleanCode = code.trim();
    const dbOk = await checkDbConnection();
    let user = null;

    if (dbOk && req.user.id !== 'local-admin-id') {
      user = await prisma.user.findUnique({ where: { id: req.user.id } });
    } else {
      const adminPass = process.env.ADMIN_INITIAL_PASSWORD || 'Brosan2026!SecureErp';
      user = {
        id: 'local-admin-id',
        username: 'admin',
        passwordHash: auth.hashPassword(adminPass),
        twoFactorEnabled: localAdmin2FA.enabled,
        twoFactorSecret: localAdmin2FA.secret,
        twoFactorLastStep: localAdmin2FA.lastStep,
        twoFactorRecoveryCodes: localAdmin2FA.recoveryCodes
      };
    }

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        error: '2FA zaten aktif değil.',
        code: '2FA_NOT_ENABLED'
      });
    }

    // Şifre doğrulama
    if (!auth.verifyPassword(password, user.passwordHash)) {
      return res.status(400).json({
        success: false,
        error: 'Mevcut şifreniz hatalı.',
        code: 'INVALID_PASSWORD'
      });
    }

    // 2FA Kodu veya Kurtarma Kodu doğrulama
    let codeValid = false;
    if (user.twoFactorRecoveryCodes) {
      try {
        const parsed = JSON.parse(user.twoFactorRecoveryCodes);
        if (Array.isArray(parsed)) {
          const recCheck = totp.verifyRecoveryCode(cleanCode, parsed);
          if (recCheck.valid) {
            codeValid = true;
          }
        }
      } catch (_) {}
    }

    if (!codeValid) {
      const totpResult = totp.verifyTotp(user.twoFactorSecret, cleanCode, user.twoFactorLastStep);
      if (totpResult.valid) {
        codeValid = true;
      }
    }

    if (!codeValid) {
      return res.status(401).json({
        success: false,
        error: 'Doğrulama kodu geçersiz.',
        code: 'INVALID_2FA_CODE'
      });
    }

    // Veritabanında ve yerel hafızada 2FA'yı sıfırla
    if (dbOk && user.id !== 'local-admin-id') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorTempSecret: null,
          twoFactorLastStep: null,
          twoFactorRecoveryCodes: null
        }
      });
    } else {
      localAdmin2FA.enabled = false;
      localAdmin2FA.secret = null;
      localAdmin2FA.tempSecret = null;
      localAdmin2FA.lastStep = null;
      localAdmin2FA.recoveryCodes = null;
    }

    // Eski token'ı iptal et ve yeni standart token üret
    if (req.token) {
      auth.revokeToken(req.token);
    }
    const updatedUser = {
      ...user,
      twoFactorEnabled: false
    };
    const newToken = auth.generateToken(updatedUser, { is2FAVerified: true }, req);

    res.status(200).json({
      success: true,
      message: 'İki aşamalı doğrulama (2FA) başarıyla devre dışı bırakıldı.',
      token: newToken
    });
  } catch (err) {
    return sendSafeError(res, 500, '2FA devre dışı bırakılırken sunucu hatası oluştu.', err);
  }
});

// ==============================================================================
// 1.15 ACİL DURUM KİLİT MODU VE KURTARMA KAPISI (PANIC LOCKDOWN ENDPOINTS)
// ==============================================================================
// GET /api/auth/emergency-lockdown (Durum Sorgulama - Public)
app.get('/api/auth/emergency-lockdown', (req, res) => {
  const status = lockdownManager.getStatus();
  res.status(200).json({
    success: true,
    ...status,
    lockdown: status
  });
});

// POST /api/auth/emergency-lockdown/activate (Kilit Modunu Devreye Alma - Admin Yetkisi Gerekir)
app.post(['/api/auth/emergency-lockdown/activate', '/api/auth/emergency-lockdown'], auth.requireAuth, async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Yetkisiz erişim. Yalnızca ADMIN rolü acil durum kilidini devreye alabilir.',
      code: 'FORBIDDEN_ROLE'
    });
  }
  const { reason, customRecoveryPhrase } = req.body || {};
  const result = lockdownManager.activateLockdown({
    initiatedBy: req.user.username || 'admin',
    reason,
    customRecoveryPhrase
  });
  res.status(200).json(result);
});

// POST /api/auth/emergency-lockdown/restore (Kurtarma Anahtarıyla Kilidi Açma - Public)
app.post('/api/auth/emergency-lockdown/restore', async (req, res) => {
  const { recoveryPhrase } = req.body || {};
  if (!recoveryPhrase || typeof recoveryPhrase !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Kurtarma anahtarı zorunludur.',
      code: 'MISSING_RECOVERY_PHRASE'
    });
  }
  const result = lockdownManager.restoreSystem(recoveryPhrase);
  if (!result.success) {
    return res.status(403).json(result);
  }
  res.status(200).json(result);
});

// ==============================================================================
// 1.16 FİNANSAL BLOKZİNCİR DENETİM KAPISI (CRYPTOGRAPHIC LEDGER INTEGRITY AUDIT)
// ==============================================================================
function requireAuditRole(req, res, next) {
  const allowedRoles = ['ADMIN', 'AUDITOR'];
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    logSecurityEvent('UNAUTHORIZED_ACCESS', {
      req,
      severity: 'WARN',
      status: 403,
      details: {
        path: req.path,
        reason: 'FORBIDDEN_AUDIT_ACCESS',
        userRole: req.user ? req.user.role : 'ANONYMOUS'
      }
    });
    return res.status(403).json({
      success: false,
      error: 'Bu denetim uç noktasına yalnızca ADMIN veya AUDITOR rolü erişebilir.',
      code: 'FORBIDDEN_AUDIT_ACCESS'
    });
  }
  next();
}

async function verifyLedgerIntegrityHandler(req, res) {
  try {
    const crossCheckDb = req.query.crossCheckDb === 'true';
    const allowStatus200 = req.query.allowStatus200 === 'true';

    // Execute cryptographic verification over chain blocks
    const result = await ledgerIntegrity.verifyChainContinuity({
      crossCheckDb,
      prisma: crossCheckDb ? prisma : null
    });

    if (result.isValid) {
      logSecurityEvent('LEDGER_INTEGRITY_VERIFIED', {
        req,
        severity: 'INFO',
        status: 200,
        details: {
          totalEntries: result.totalEntries,
          genesisHash: result.genesisHash,
          headHash: result.headHash
        }
      });

      return res.status(200).json({
        success: true,
        isValid: true,
        totalEntries: result.totalEntries,
        genesisHash: result.genesisHash,
        headHash: result.headHash,
        verifiedAt: result.verifiedAt || new Date().toISOString()
      });
    }

    // Tamper Detected!
    const clientIp = auth.getClientIp(req);
    logSecurityEvent('LEDGER_TAMPER_DETECTED', {
      req,
      severity: 'CRITICAL',
      status: 409,
      clientIp,
      details: {
        corruptedIndex: result.corruptedIndex,
        corruptedRecordId: result.corruptedRecordId,
        tamperPoint: result.tamperPoint
      }
    });

    try {
      threatAlerter.dispatchAlert('CRITICAL_SECURITY_ALERT', {
        eventType: 'LEDGER_TAMPER_DETECTED',
        clientIp,
        corruptedIndex: result.corruptedIndex,
        corruptedRecordId: result.corruptedRecordId,
        tamperPoint: result.tamperPoint,
        detectedAt: new Date().toISOString()
      });
    } catch (_) {}

    const statusCode = allowStatus200 ? 200 : 409;
    return res.status(statusCode).json({
      success: false,
      isValid: false,
      corruptedIndex: result.corruptedIndex,
      corruptedRecordId: result.corruptedRecordId,
      expectedHash: result.expectedHash,
      actualHash: result.actualHash,
      tamperPoint: result.tamperPoint || {
        field: result.breachCode || 'unknown',
        expected: result.expectedHash,
        actual: result.actualHash
      },
      error: 'LEDGER_TAMPER_DETECTED'
    });

  } catch (error) {
    console.error('⚠️ [LEDGER VERIFICATION ERROR]:', error);
    return res.status(500).json({
      success: false,
      error: 'Finansal defter doğrulama işlemi sırasında sunucu hatası oluştu.',
      code: 'LEDGER_VERIFICATION_ERROR'
    });
  }
}

app.get(
  ['/api/audit/verify-integrity', '/muhasebe/api/audit/verify-integrity'],
  auth.requireAuth,
  requireAuditRole,
  verifyLedgerIntegrityHandler
);

// ==============================================================================
// 1.2 FAIL-CLOSED REST API GÜVENLİK KALKANI
// /api/health ve /api/auth/login hariç tüm muhasebe rotalarını korur
// ==============================================================================
app.use('/api', auth.requireAuth);

// ==============================================================================
// 2. DASHBOARD KPI SUMMARY
// ==============================================================================
app.get('/api/summary', async (req, res) => {
  try {
    const [
      accountCount,
      contactCount,
      invoiceCount,
      productCount,
      checkCount,
      employeeCount,
      accounts,
      invoices
    ] = await Promise.all([
      prisma.account.count(),
      prisma.contact.count(),
      prisma.invoice.count(),
      prisma.product.count(),
      prisma.checkPromissory.count(),
      prisma.employee.count(),
      prisma.account.findMany(),
      prisma.invoice.findMany()
    ]);

    // Financial calculations
    let totalCashBank = 0;
    let totalReceivables = 0;
    let totalPayables = 0;

    accounts.forEach(acc => {
      const bal = parseFloat(acc.balance);
      if (acc.category === 'KASA' || acc.category === 'BANKA') {
        totalCashBank += bal;
      }
    });

    const contacts = await prisma.contact.findMany();
    contacts.forEach(c => {
      const bal = parseFloat(c.balance);
      if (bal > 0) totalReceivables += bal;
      else if (bal < 0) totalPayables += Math.abs(bal);
    });

    let totalRevenue = 0;
    invoices.forEach(inv => {
      if (inv.type === 'SALES' || inv.type === 'EXPORT') {
        totalRevenue += parseFloat(inv.grandTotal);
      }
    });

    res.json({
      success: true,
      kpis: {
        totalRevenue,
        totalCashBank,
        totalReceivables,
        totalPayables,
        counts: {
          accounts: accountCount,
          contacts: contactCount,
          invoices: invoiceCount,
          products: productCount,
          checks: checkCount,
          employees: employeeCount
        }
      }
    });
  } catch (error) {
    return sendSafeError(res, 500, 'Gösterge paneli verileri alınırken sunucu hatası oluştu.', error);
  }
});

// ==============================================================================
// 3. TEKDÜZEN HESAP PLANI (ACCOUNTS)
// ==============================================================================
app.get('/api/accounts', async (req, res) => {
  try {
    const { category, type } = req.query;
    const where = {};
    if (category) where.category = category;
    if (type) where.type = type;

    const accounts = await prisma.account.findMany({
      where,
      orderBy: { code: 'asc' }
    });
    res.json({ success: true, data: accounts });
  } catch (error) {
    return sendSafeError(res, 500, 'Hesap planı verileri alınırken sunucu hatası oluştu.', error);
  }
});

app.post('/api/accounts', validateBody(AccountSchema), async (req, res) => {
  try {
    const { code, name, type, category, currency, balance, iban, accountNo, bankName, branchName } = req.body;
    const newAccount = await prisma.account.create({
      data: {
        code,
        name,
        type: type || 'ASSET',
        category,
        currency: currency || 'TRY',
        balance: balance ? parseFloat(balance) : 0.0,
        iban,
        accountNo,
        bankName,
        branchName
      }
    });
    res.status(201).json({ success: true, data: newAccount });
  } catch (error) {
    return sendSafeError(res, 400, 'Hesap oluşturulamadı. Girdi verilerini kontrol ediniz.', error);
  }
});

// ==============================================================================
// 4. YEVMİYE DEFTERİ (JOURNAL ENTRIES)
// ==============================================================================
app.get('/api/journal', async (req, res) => {
  try {
    const entries = await prisma.journalEntry.findMany({
      include: {
        items: {
          include: { account: true }
        }
      },
      orderBy: { entryNo: 'desc' }
    });
    res.json({ success: true, data: entries });
  } catch (error) {
    return sendSafeError(res, 500, 'Yevmiye kayıtları listelenirken sunucu hatası oluştu.', error);
  }
});

app.post('/api/journal', validateBody(JournalEntrySchema), async (req, res) => {
  try {
    const { description, documentType, documentNo, items } = req.body;

    if (!items || !Array.isArray(items) || items.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Bir yevmiye fişinde en az 2 hesap kalemi (Borç ve Alacak) bulunmalıdır.'
      });
    }

    // Borç = Alacak çift taraflı kayıt ilkesi doğrulaması
    let totalDebit = 0;
    let totalCredit = 0;

    items.forEach(item => {
      totalDebit += parseFloat(item.debit || 0);
      totalCredit += parseFloat(item.credit || 0);
    });

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({
        success: false,
        error: `Yevmiye kaydında Borç (${totalDebit.toFixed(2)}) ve Alacak (${totalCredit.toFixed(2)}) eşit olmalıdır!`
      });
    }

    const lastEntry = await prisma.journalEntry.findFirst({
      orderBy: { entryNo: 'desc' }
    });
    const nextEntryNo = lastEntry ? lastEntry.entryNo + 1 : 1;

    const entry = await prisma.journalEntry.create({
      data: {
        entryNo: nextEntryNo,
        description,
        documentType: documentType || 'MAHSUP',
        documentNo,
        totalDebit,
        totalCredit,
        items: {
          create: items.map(item => ({
            accountId: item.accountId,
            description: item.description || description,
            debit: parseFloat(item.debit || 0),
            credit: parseFloat(item.credit || 0)
          }))
        }
      },
      include: { items: true }
    });

    // M3 Hook: Append journal entry to cryptographic HMAC ledger
    try {
      ledgerIntegrity.appendTransaction({
        id: entry.id,
        amount: entry.totalDebit,
        type: entry.documentType || 'MAHSUP',
        date: entry.date,
        createdAt: entry.createdAt,
        description: entry.description,
        referenceNo: entry.documentNo
      });
    } catch (ledgerErr) {
      logSecurityEvent('LEDGER_APPEND_FAILED', {
        req,
        severity: 'CRITICAL',
        status: 500,
        details: {
          journalId: entry.id,
          error: ledgerErr.message
        }
      });
    }

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    return sendSafeError(res, 400, 'Yevmiye kaydı oluşturulamadı. Girdi verilerini kontrol ediniz.', error);
  }
});

// ==============================================================================
// 5. CARİ HESAPLAR (CONTACTS / CUSTOMER & SUPPLIERS)
// ==============================================================================
app.get('/api/contacts', async (req, res) => {
  try {
    const { type } = req.query;
    const where = type ? { type } : {};
    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { title: 'asc' }
    });
    res.json({ success: true, data: contacts });
  } catch (error) {
    return sendSafeError(res, 500, 'Cari kartlar listelenirken sunucu hatası oluştu.', error);
  }
});

app.post('/api/contacts', validateBody(ContactSchema), async (req, res) => {
  try {
    const { code, title, type, taxOffice, taxNumber, phone, email, address, city, country, balance } = req.body;
    const contact = await prisma.contact.create({
      data: {
        code,
        title,
        type: type || 'CUSTOMER',
        taxOffice,
        taxNumber,
        phone,
        email,
        address,
        city,
        country: country || 'Türkiye',
        balance: balance ? parseFloat(balance) : 0.0
      }
    });
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    return sendSafeError(res, 400, 'Cari kart oluşturulamadı. Girdi verilerini kontrol ediniz.', error);
  }
});

// ==============================================================================
// 6. FATURALAR (INVOICES)
// ==============================================================================
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        contact: true,
        items: true
      },
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: invoices });
  } catch (error) {
    return sendSafeError(res, 500, 'Faturalar listelenirken sunucu hatası oluştu.', error);
  }
});

app.get('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [
          { id: id },
          { invoiceNo: id }
        ]
      },
      include: {
        contact: true,
        items: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Fatura bulunamadı.' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    return sendSafeError(res, 500, 'Fatura detayları getirilirken sunucu hatası oluştu.', error);
  }
});

app.post('/api/invoices', validateBody(InvoiceSchema), async (req, res) => {
  try {
    const { invoiceNo, type, scenario, date, dueDate, contactId, currency, exchangeRate, items, notes } = req.body;

    let subtotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;

    const formattedItems = (items || []).map(item => {
      const qty = parseFloat(item.quantity || 1);
      const price = parseFloat(item.unitPrice || 0);
      const discountRate = parseFloat(item.discountRate || 0);
      const taxRate = parseFloat(item.taxRate !== undefined ? item.taxRate : 20);

      const baseAmount = qty * price;
      const discountAmount = baseAmount * (discountRate / 100);
      const lineMatrah = baseAmount - discountAmount;
      const itemTax = lineMatrah * (taxRate / 100);
      const itemTotal = lineMatrah + itemTax;

      subtotal += lineMatrah;
      taxTotal += itemTax;
      grandTotal += itemTotal;

      return {
        name: item.name || item.description || 'Mal/Hizmet Kalemi',
        description: item.description || item.name || '',
        gtip: item.gtip || null,
        quantity: qty,
        unit: item.unit || 'ADET',
        unitPrice: price,
        discountRate,
        taxRate,
        taxAmount: Math.round(itemTax * 100) / 100,
        total: Math.round(itemTotal * 100) / 100
      };
    });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        type: type || 'SALES',
        scenario: scenario || 'TICARIFATURA',
        date: date ? new Date(date) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        contactId,
        currency: currency || 'TRY',
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : 1.0,
        subtotal: Math.round(subtotal * 100) / 100,
        taxTotal: Math.round(taxTotal * 100) / 100,
        grandTotal: Math.round(grandTotal * 100) / 100,
        notes,
        items: {
          create: formattedItems
        }
      },
      include: { contact: true, items: true }
    });

    // Cari Bakiye Güncellemesi
    if (contactId) {
      const contact = await prisma.contact.findUnique({ where: { id: contactId } });
      if (contact) {
        const balanceChange = (type === 'SALES' || type === 'EXPORT') ? grandTotal : -grandTotal;
        await prisma.contact.update({
          where: { id: contactId },
          data: { balance: { increment: balanceChange } }
        });
      }
    }

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    return sendSafeError(res, 400, 'Fatura kaydedilemedi. Girdi verilerini kontrol ediniz.', error);
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const inv = await prisma.invoice.findUnique({ where: { id } });
    if (!inv) {
      return res.status(404).json({ success: false, error: 'Silinecek fatura bulunamadı.' });
    }

    // Cari bakiyesini geri al
    if (inv.contactId) {
      const rollbackChange = (inv.type === 'SALES' || inv.type === 'EXPORT') ? -parseFloat(inv.grandTotal) : parseFloat(inv.grandTotal);
      await prisma.contact.update({
        where: { id: inv.contactId },
        data: { balance: { increment: rollbackChange } }
      });
    }

    await prisma.invoice.delete({ where: { id } });
    res.json({ success: true, message: 'Fatura ve kalemleri başarıyla silindi.' });
  } catch (error) {
    return sendSafeError(res, 500, 'Fatura silinirken sunucu hatası oluştu.', error);
  }
});

// ==============================================================================
// 7. KASA & BANKA FİNANSAL İŞLEMLER (TRANSACTIONS)
// ==============================================================================
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: { account: true, contact: true },
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: transactions });
  } catch (error) {
    return sendSafeError(res, 500, 'Finansal işlemler listelenirken sunucu hatası oluştu.', error);
  }
});

app.post('/api/transactions', validateBody(TransactionSchema), async (req, res) => {
  try {
    const { type, accountId, contactId, amount, currency, description, referenceNo } = req.body;
    const numAmount = parseFloat(amount);

    const transaction = await prisma.transaction.create({
      data: {
        type,
        accountId,
        contactId,
        amount: numAmount,
        currency: currency || 'TRY',
        description,
        referenceNo
      },
      include: { account: true, contact: true }
    });

    // Hesap Bakiyesi Güncelle
    const isIncrease = type.includes('IN');
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: { increment: isIncrease ? numAmount : -numAmount } }
    });

    // Cari Bakiyesi Varsa Güncelle
    if (contactId) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { balance: { increment: isIncrease ? -numAmount : numAmount } }
      });
    }

    // M3 Hook: Append transaction to cryptographic HMAC ledger
    try {
      ledgerIntegrity.appendTransaction(transaction);
    } catch (ledgerErr) {
      logSecurityEvent('LEDGER_APPEND_FAILED', {
        req,
        severity: 'CRITICAL',
        status: 500,
        details: {
          transactionId: transaction.id,
          error: ledgerErr.message
        }
      });
    }

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    return sendSafeError(res, 400, 'Finansal işlem kaydedilemedi. Girdi verilerini kontrol ediniz.', error);
  }
});

// ==============================================================================
// 8. ÇEK VE SENETLER (CHECKS & PROMISSORIES)
// ==============================================================================
app.get('/api/checks', async (req, res) => {
  try {
    const checks = await prisma.checkPromissory.findMany({
      include: { contact: true },
      orderBy: { dueDate: 'asc' }
    });
    res.json({ success: true, data: checks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/checks', validateBody(CheckSchema), async (req, res) => {
  try {
    const { docType, direction, serialNo, bankName, branchName, drawer, dueDate, amount, currency, contactId, notes } = req.body;
    const check = await prisma.checkPromissory.create({
      data: {
        docType: docType || 'CHECK',
        direction: direction || 'RECEIVED',
        serialNo,
        bankName,
        branchName,
        drawer,
        dueDate: new Date(dueDate),
        amount: parseFloat(amount),
        currency: currency || 'TRY',
        contactId,
        notes
      }
    });
    res.status(201).json({ success: true, data: check });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.patch('/api/checks/:id/status', validateBody(CheckStatusSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await prisma.checkPromissory.update({
      where: { id },
      data: { status }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 9. PERSONEL & BORDRO (EMPLOYEES & PAYROLL)
// ==============================================================================
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: { payrolls: true },
      orderBy: { fullName: 'asc' }
    });
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/employees', validateBody(EmployeeSchema), async (req, res) => {
  try {
    const { tcNo, fullName, department, position, startDate, grossSalary, netSalary, iban } = req.body;
    const employee = await prisma.employee.create({
      data: {
        tcNo,
        fullName,
        department,
        position,
        startDate: startDate ? new Date(startDate) : new Date(),
        grossSalary: parseFloat(grossSalary),
        netSalary: parseFloat(netSalary),
        iban
      }
    });
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 10. STOK & ÜRÜN YÖNETİMİ (PRODUCTS & INVENTORY)
// ==============================================================================
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { movements: true },
      orderBy: { code: 'asc' }
    });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/products', validateBody(ProductSchema), async (req, res) => {
  try {
    const { code, name, category, gtipCode, unit, currentStock, minStock, unitCost, salePrice } = req.body;
    const product = await prisma.product.create({
      data: {
        code,
        name,
        category,
        gtipCode,
        unit: unit || 'MT',
        currentStock: currentStock ? parseFloat(currentStock) : 0.0,
        minStock: minStock ? parseFloat(minStock) : 0.0,
        unitCost: unitCost ? parseFloat(unitCost) : 0.0,
        salePrice: salePrice ? parseFloat(salePrice) : 0.0
      }
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 11. MUHASEBE RAPORLARI (MİZAN, BİLANÇO, GELİR TABLOSU)
// ==============================================================================
app.get('/api/reports/mizan', async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      include: { journalItems: true },
      orderBy: { code: 'asc' }
    });

    const mizanData = accounts.map(acc => {
      let debitTotal = 0;
      let creditTotal = 0;

      acc.journalItems.forEach(item => {
        debitTotal += parseFloat(item.debit);
        creditTotal += parseFloat(item.credit);
      });

      const balanceDebit = debitTotal > creditTotal ? debitTotal - creditTotal : 0;
      const balanceCredit = creditTotal > debitTotal ? creditTotal - debitTotal : 0;

      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debitTotal,
        creditTotal,
        balanceDebit,
        balanceCredit
      };
    });

    res.json({ success: true, data: mizanData });
  } catch (error) {
    return sendSafeError(res, 500, 'Mizan verisi işlenirken hata oluştu.', error);
  }
});

// ==============================================================================
// 12. FARUK AYTİN & NİSA TEKSTİL FASON ÜRETİM & KUMAŞ MAHSUBU MUTABAKATI
// ==============================================================================
app.get('/api/mutabakat/faruk-aytin', (req, res) => {
  try {
    const fs = require('fs');
    const dataPath = path.join(__dirname, '..', 'data', 'faruk_aytin_excel_data.json');
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf-8');
      return res.json({ success: true, data: JSON.parse(raw) });
    }
    res.status(404).json({ success: false, error: 'Mutabakat verisi bulunamadı' });
  } catch (err) {
    return sendSafeError(res, 500, 'Mutabakat verisi işlenirken hata oluştu.', err);
  }
});

// Catch-all for SPA Navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'app', 'index.html'));
});

// Güvenlik: Veritabanı Hata Maskeleme Middleware'i (Database Error Cloaking - Phase 7)
app.use(dbGuard.dbGuardErrorMiddleware);

// Centralized Fail-Closed Error Handler (Prevents stack-trace leaks & handles 413, CORS errors)
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Gönderilen veri paketi çok büyük! Maksimum yük boyutu: 100KB.',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: err.message,
      code: 'CORS_FORBIDDEN'
    });
  }
  console.error('⚠️ [HATA GÜVENLİK YAKALAYICI]:', err.message || err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Sunucu içi güvenlik hatası oluştu.' : err.message,
    code: 'INTERNAL_SERVER_ERROR'
  });
});

// Start Server
if (require.main === module) {
  memoryIntegritySentinel.initialize();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🏭 BROSAN TEKSTİL ERP SUNUCUSU AKTİF`);
    console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
    console.log(`🏥 Healthcheck: http://0.0.0.0:${PORT}/api/health`);
    console.log(`📊 Ortam: ${process.env.NODE_ENV || 'production'}`);
    console.log(`====================================================`);
  });
} else {
  // Initialize integrity sentinel on startup
  memoryIntegritySentinel.initialize();
}

app.quarantineEngine = quarantineEngine;
app.quarantineGuard = quarantineGuard;
app.cryptoVault = cryptoVault;
app.prisma = prisma;
app.lockdownManager = lockdownManager;
app.lockdownGuard = lockdownGuard;
app.heuristicWafGuard = heuristicWafGuard;
app.heuristicWaf = heuristicWafGuard;
app.ledgerIntegrity = ledgerIntegrity;
app.honeytokenRouteGuard = honeytokenRouteGuard;
app.honeytokenParamGuard = honeytokenParamGuard;
app.requestSignatureGuard = requestSignatureGuard;
app.memoryIntegritySentinel = memoryIntegritySentinel;
app.dbGuard = dbGuard;
app.behavioralShield = behavioralShieldEngine;
app.responseArmor = responseArmor;

module.exports = app;
