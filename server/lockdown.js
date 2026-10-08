/**
 * BROSAN TEKSTİL ERP — ADMINISTRATIVE EMERGENCY PANIC LOCKDOWN SWITCH
 * Architecture: Singleton Manager + Persistent JSON State + Express Guard + CLI Trigger
 * 
 * Features:
 * - O(1) instantaneous mass token invalidation via global revocation epoch.
 * - Persistent atomic state storage in `data/lockdown_state.json`.
 * - Timing-safe recovery phrase verification via crypto.timingSafeEqual.
 * - Read-only maintenance mode enforcement (HTTP 503 on mutating requests).
 * - Safe whitelist exceptions for recovery endpoints and health checks.
 * - SIEM audit logging for activation, restore failures, and restoration events.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const auditLogger = require('./auditLogger');

const LOCKDOWN_STATE_FILE = path.join(__dirname, '..', 'data', 'lockdown_state.json');

class EmergencyLockdownManager {
  constructor(options = {}) {
    this.stateFile = options.stateFile || LOCKDOWN_STATE_FILE;
    this.state = {
      isLocked: false,
      lockedAt: null,
      lockedBy: null,
      reason: null,
      tokenRevocationEpoch: 0,
      recoverySalt: null,
      recoveryHash: null
    };
    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const raw = fs.readFileSync(this.stateFile, 'utf8');
        if (raw && raw.trim()) {
          const parsed = JSON.parse(raw);
          this.state = { ...this.state, ...parsed };
        }
      }
    } catch (err) {
      console.warn('⚠️ [GÜVENLİK/LOCKDOWN] Kilit durumu diskten yüklenemedi:', err.message);
    }
  }

  saveToDisk() {
    try {
      const dir = path.dirname(this.stateFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o750 });
      }
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2), {
        encoding: 'utf8',
        mode: 0o640
      });
    } catch (err) {
      console.error('⚠️ [GÜVENLİK/LOCKDOWN] Kilit durumu diske kaydedilemedi:', err.message);
    }
  }

  isLocked() {
    return Boolean(this.state.isLocked);
  }

  getTokenRevocationEpoch() {
    return Number(this.state.tokenRevocationEpoch || 0);
  }

  getStatus() {
    return {
      isLocked: Boolean(this.state.isLocked),
      lockedAt: this.state.lockedAt,
      lockedBy: this.state.lockedBy,
      reason: this.state.reason,
      tokenRevocationEpoch: Number(this.state.tokenRevocationEpoch || 0)
    };
  }

  generateRecoveryPhrase() {
    const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const p2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const p3 = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `BROSAN-CITADEL-${p1}-${p2}-${p3}`;
  }

  hashRecoveryPhrase(phrase, salt) {
    return crypto.createHash('sha256').update(`${salt}:${phrase.trim()}`).digest('hex');
  }

  verifyRecoveryPhrase(providedPhrase) {
    if (!providedPhrase || typeof providedPhrase !== 'string') return false;
    const cleanPhrase = providedPhrase.trim();
    if (!cleanPhrase) return false;

    // Check environment master key fallback if defined
    if (process.env.MASTER_RECOVERY_KEY) {
      const envKey = process.env.MASTER_RECOVERY_KEY.trim();
      const bufProvided = Buffer.from(cleanPhrase, 'utf8');
      const bufEnv = Buffer.from(envKey, 'utf8');
      if (bufProvided.length === bufEnv.length && crypto.timingSafeEqual(bufProvided, bufEnv)) {
        return true;
      }
    }

    if (!this.state.recoverySalt || !this.state.recoveryHash) return false;
    const computedHash = this.hashRecoveryPhrase(cleanPhrase, this.state.recoverySalt);
    const bufComputed = Buffer.from(computedHash, 'utf8');
    const bufStored = Buffer.from(this.state.recoveryHash, 'utf8');

    if (bufComputed.length !== bufStored.length) return false;
    return crypto.timingSafeEqual(bufComputed, bufStored);
  }

  activateLockdown({ initiatedBy = 'admin', reason = 'PANIC_LOCKDOWN', customRecoveryPhrase = null } = {}) {
    const recoveryPhrase = customRecoveryPhrase || this.generateRecoveryPhrase();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = this.hashRecoveryPhrase(recoveryPhrase, salt);
    const now = Date.now();

    this.state.isLocked = true;
    this.state.lockedAt = new Date(now).toISOString();
    this.state.lockedBy = initiatedBy;
    this.state.reason = reason;
    this.state.tokenRevocationEpoch = now;
    this.state.recoverySalt = salt;
    this.state.recoveryHash = hash;

    this.saveToDisk();

    try {
      auditLogger.logSecurityEvent('EMERGENCY_LOCKDOWN_ACTIVATED', {
        severity: 'CRITICAL',
        status: 503,
        details: {
          lockedBy: initiatedBy,
          reason,
          tokenRevocationEpoch: now
        }
      });
    } catch (_) {}

    return {
      success: true,
      isLocked: true,
      lockedAt: this.state.lockedAt,
      recoveryPhrase
    };
  }

  restoreSystem(recoveryPhrase) {
    if (!this.state.isLocked) {
      return { success: true, message: 'Sistem zaten aktif durumda.', code: 'ALREADY_ACTIVE' };
    }

    const isValid = this.verifyRecoveryPhrase(recoveryPhrase);
    if (!isValid) {
      try {
        auditLogger.logSecurityEvent('EMERGENCY_LOCKDOWN_RESTORE_FAILED', {
          severity: 'CRITICAL',
          status: 403,
          details: { reason: 'INVALID_RECOVERY_PHRASE' }
        });
      } catch (_) {}
      return {
        success: false,
        error: 'Geçersiz kurtarma anahtarı (Invalid master recovery phrase).',
        code: 'INVALID_RECOVERY_PHRASE'
      };
    }

    this.state.isLocked = false;
    this.state.lockedAt = null;
    this.state.lockedBy = null;
    this.state.reason = null;
    this.state.recoverySalt = null;
    this.state.recoveryHash = null;
    // CRITICAL: tokenRevocationEpoch is intentionally PRESERVED to maintain revocation of pre-lockdown tokens!

    this.saveToDisk();

    try {
      auditLogger.logSecurityEvent('EMERGENCY_LOCKDOWN_RESTORED', {
        severity: 'INFO',
        status: 200,
        details: { restoredAt: new Date().toISOString() }
      });
    } catch (_) {}

    return {
      success: true,
      message: 'Sistem kilit modundan çıkarıldı ve normal çalışmaya döndürüldü.',
      code: 'LOCKDOWN_RESTORED'
    };
  }

  reset() {
    this.state = {
      isLocked: false,
      lockedAt: null,
      lockedBy: null,
      reason: null,
      tokenRevocationEpoch: 0,
      recoverySalt: null,
      recoveryHash: null
    };
    this.saveToDisk();
  }
}

const lockdownManager = new EmergencyLockdownManager();

/**
 * Express Middleware Hook: Intercepts mutating requests during lockdown
 */
function lockdownGuard(req, res, next) {
  if (!lockdownManager.isLocked()) {
    return next();
  }

  const method = (req.method || 'GET').toUpperCase();
  const rawUrl = req.originalUrl || req.url || '';
  const cleanPath = rawUrl.split('?')[0].split('#')[0];

  // Whitelisted exceptions: Recovery endpoints and Healthchecks
  const isWhitelisted =
    cleanPath === '/api/auth/emergency-lockdown/restore' ||
    cleanPath === '/api/auth/emergency-lockdown' ||
    cleanPath === '/muhasebe/api/auth/emergency-lockdown/restore' ||
    cleanPath === '/muhasebe/api/auth/emergency-lockdown' ||
    cleanPath.endsWith('/auth/emergency-lockdown/restore') ||
    cleanPath.endsWith('/auth/emergency-lockdown') ||
    cleanPath === '/api/health' ||
    cleanPath === '/health' ||
    cleanPath === '/muhasebe/api/health' ||
    cleanPath === '/muhasebe/health' ||
    cleanPath.endsWith('/health');

  if (isWhitelisted) {
    return next();
  }

  const isMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  if (isMutating) {
    try {
      auditLogger.logSecurityEvent('LOCKDOWN_MUTATION_BLOCKED', {
        req,
        severity: 'WARN',
        status: 503,
        details: {
          method,
          path: rawUrl,
          reason: 'SYSTEM_IN_LOCKDOWN'
        }
      });
    } catch (_) {}

    res.setHeader('Retry-After', '300');
    res.setHeader('X-System-Status', 'LOCKEDDOWN');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    return res.status(503).json({
      success: false,
      error: 'Sistem acil durum karantinasında / kilit modundadır (Read-only maintenance mode). Hiçbir veri değişikliğine izin verilmez.',
      code: 'SYSTEM_IN_LOCKDOWN',
      locked: true,
      lockedAt: lockdownManager.getStatus().lockedAt,
      reason: lockdownManager.getStatus().reason
    });
  }

  next();
}

// CLI Execution Handler
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = (args[0] || '').toLowerCase();

  if (command === 'activate') {
    const reasonIndex = args.indexOf('--reason');
    const reason = reasonIndex !== -1 && args[reasonIndex + 1] ? args[reasonIndex + 1] : 'CLI_TRIGGERED_LOCKDOWN';
    const result = lockdownManager.activateLockdown({ initiatedBy: 'CLI', reason });
    console.log('\n🚨 ====================================================');
    console.log('🚨 ACİL DURUM KİLİT MODU (PANIC LOCKDOWN) AKTİF EDİLDİ');
    console.log('🚨 ====================================================');
    console.log(`Zaman: ${result.lockedAt}`);
    console.log(`Neden: ${reason}`);
    console.log('Tüm aktif JWT tokenları iptal edildi.');
    console.log('Sistem salt-okunur (Read-only) moduna alındı.');
    console.log('\n🔑 MASTER KURTARMA ANAHTARI (RECOVERY PHRASE):');
    console.log('----------------------------------------------------');
    console.log(`${result.recoveryPhrase}`);
    console.log('----------------------------------------------------');
    console.log('⚠️ BU ANAHTARI GÜVENLİ BİR YERE KAYDEDİN! Sistem bu anahtar olmadan açılamaz.\n');
    process.exit(0);
  } else if (command === 'restore') {
    const phrase = args[1];
    if (!phrase) {
      console.error('❌ Hata: Kurtarma anahtarı belirtilmelidir: node server/lockdown.js restore <kurtarma-anahtari>');
      process.exit(1);
    }
    const result = lockdownManager.restoreSystem(phrase);
    if (result.success) {
      console.log('\n✅ ====================================================');
      console.log('✅ SİSTEM KİLİT MODUNDAN ÇIKARILDI (RESTORE SUCCESS)');
      console.log('✅ ====================================================\n');
      process.exit(0);
    } else {
      console.error(`\n❌ Başarısız: ${result.error}\n`);
      process.exit(1);
    }
  } else if (command === 'status') {
    const status = lockdownManager.getStatus();
    console.log('\n📊 KİLİT DURUMU:', status.isLocked ? '🚨 KİLİTLİ (LOCKED)' : '✅ AKTİF (NORMAL)');
    console.log('Detay:', JSON.stringify(status, null, 2), '\n');
    process.exit(0);
  } else {
    console.log('Kullanım: node server/lockdown.js [activate [--reason "..."]|restore <key>|status]');
    process.exit(0);
  }
}

module.exports = {
  lockdownManager,
  lockdownGuard,
  EmergencyLockdownManager
};
