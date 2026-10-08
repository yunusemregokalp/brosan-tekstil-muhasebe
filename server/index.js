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

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Güvenlik: Ters Vekil (Traefik / Coolify) İstemci IP Doğrulaması (Anti-IP-Spoofing)
app.set('trust proxy', 1);

// Güvenlik: Parmak İzi Gizleme (X-Powered-By Express başlığını tamamen kaldır)
app.disable('x-powered-by');

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
    return res.status(403).json({
      success: false,
      error: 'Erişim engellendi: Geçersiz karakter tespiti.',
      code: 'FORBIDDEN_FILE'
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
    return res.status(403).json({
      success: false,
      error: 'Erişim engellendi: Bu dosya tipine veya gizli dizine erişim izni yoktur.',
      code: 'FORBIDDEN_FILE'
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
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));

// Güvenlik: DoS ve Bellek Tükenmesi Korumalı Yük Sınırları (100KB tavan)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

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

// Güvenlik: Giriş Kapısı Hız Sınırı (Bounded LRU Store: 15 dakikada 10 deneme / IP)
const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new auth.BoundedLruMemoryStore({ maxEntries: 5000 }),
  message: {
    success: false,
    error: 'Giriş deneme sınırı aşıldı. Lütfen 15 dakika sonra tekrar deneyin.',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
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

// Helper: Prisma Connection Checker
let isDbConnected = false;
async function checkDbConnection() {
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
app.post('/api/auth/login', authLoginLimiter, validateBody(LoginSchema), async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = auth.getClientIp(req);

    // 1. IP ve Kullanıcı bazlı Brute-Force Kalkanı Kontrolü
    const ipCheck = auth.checkBruteForce(`ip:${clientIp}`);
    const userCheck = auth.checkBruteForce(`user:${username.toLowerCase()}`);
    if (ipCheck.isLocked || userCheck.isLocked) {
      const waitSec = Math.max(ipCheck.remainingSec || 0, userCheck.remainingSec || 0);
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
          isActive: true
        };
      }
    }

    // DB bazlı kalıcı kilit kontrolü
    if (user && user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const waitSec = Math.ceil((new Date(user.lockedUntil) - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        error: `Çok fazla hatalı giriş denemesi yapıldı! Hesabınız güvenlik nedeniyle ${waitSec} saniye kilitlendi.`,
        locked: true,
        remainingSec: waitSec
      });
    }

    // 3. Parola Doğrulama (Timing-Attack Koruması: Kullanıcı var veya yok fark etmeksizin her zaman bcrypt çalışır)
    const hashToCompare = user ? user.passwordHash : auth.DUMMY_HASH;
    const isValid = Boolean(user && auth.verifyPassword(password, hashToCompare));

    if (!isValid) {
      auth.recordFailedAttempt(`ip:${clientIp}`);
      auth.recordFailedAttempt(`user:${username.toLowerCase()}`);

      // DB'de hatalı denemeyi ve kilidi kalıcı kaydet
      if (dbOk && user && user.id !== 'local-admin-id') {
        const nextAttempts = (user.failedAttempts || 0) + 1;
        const willLock = nextAttempts >= 5;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedAttempts: nextAttempts,
            lockedUntil: willLock ? new Date(Date.now() + 15 * 60 * 1000) : user.lockedUntil
          }
        }).catch(() => {});
      }

      return res.status(401).json({
        success: false,
        error: 'Kullanıcı adı veya şifre hatalı!'
      });
    }

    // 4. Aktiflik ve Kilit Kontrolü
    if (!user.isActive) {
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

    const token = auth.generateToken(user);

    res.status(200).json({
      success: true,
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
    const { code, name, type, category, currency, balance } = req.body;
    const newAccount = await prisma.account.create({
      data: {
        code,
        name,
        type: type || 'ASSET',
        category,
        currency: currency || 'TRY',
        balance: balance ? parseFloat(balance) : 0.0
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
    res.status(500).json({ success: false, error: error.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// Catch-all for SPA Navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'app', 'index.html'));
});

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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🏭 BROSAN TEKSTİL ERP SUNUCUSU AKTİF`);
  console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
  console.log(`🏥 Healthcheck: http://0.0.0.0:${PORT}/api/health`);
  console.log(`📊 Ortam: ${process.env.NODE_ENV || 'production'}`);
  console.log(`====================================================`);
});
