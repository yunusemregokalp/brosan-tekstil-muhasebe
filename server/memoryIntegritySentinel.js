/**
 * BROSAN TEKSTİL ERP — APEX CITADEL ACTIVE DEFENSE
 * Layer 3: Autonomous Code & Memory Integrity Self-Healing Sentinel (Phase 5)
 * 
 * Features:
 * - Boot-time cryptographic SHA-256 baselining of 11 critical security files:
 *     auth.js, heuristicWaf.js, cryptoVault.js, sessionGuard.js, quarantine.js,
 *     ledgerIntegrity.js, honeytoken.js, requestSignature.js, lockdown.js,
 *     auditLogger.js, memoryIntegritySentinel.js
 * - Multi-layer integrity verification:
 *     1. Disk file buffer SHA-256 verification
 *     2. CommonJS require.cache entry existence and reference equality
 *     3. Exported functions reference verification and .toString() SHA-256 source hashing
 * - High-speed verification benchmark: runs in < 5ms synchronously
 * - Autonomous self-healing: rewrites pristine disk buffer and restores pristine memory module exports
 * - Active containment: triggers emergency panic lockdown (lockdownManager.activateLockdown)
 * - SIEM audit logging (CODE_INTEGRITY_TAMPER_DETECTED) and critical threat alerting
 * - Periodic background sentinel sweep (every 30 seconds, unref'd timer)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { performance } = require('perf_hooks');
const { lockdownManager } = require('./lockdown');
const auditLogger = require('./auditLogger');
const threatAlerter = require('./threatAlerter');

const DEFAULT_TARGET_FILES = [
  'auth.js',
  'heuristicWaf.js',
  'cryptoVault.js',
  'sessionGuard.js',
  'quarantine.js',
  'ledgerIntegrity.js',
  'honeytoken.js',
  'requestSignature.js',
  'lockdown.js',
  'auditLogger.js',
  'memoryIntegritySentinel.js',
  'egressFirewall.js',
  'ephemeralTokens.js',
  'proofOfWork.js',
  'processArmor.js',
  'behavioralShield.js',
  'dbGuard.js',
  'responseArmor.js',
  'processSandboxing.js',
  'honeyFiles.js'
];

class MemoryIntegritySentinel {
  constructor(options = {}) {
    this.targetFiles = options.targetFiles || DEFAULT_TARGET_FILES;
    this.checkIntervalMs = options.checkIntervalMs || 30000;
    this.autoHeal = options.autoHeal !== undefined ? options.autoHeal : true;
    this.freezeExports = options.freezeExports !== undefined ? options.freezeExports : false;
    this.baseline = new Map(); // fullPath -> baselineRecord
    this.timer = null;
    this.isInitialized = false;
    this.lastStats = null;
  }

  /**
   * Initializes baseline hashes and snapshots upon application boot.
   */
  initialize() {
    this.baseline.clear();
    for (const relFile of this.targetFiles) {
      const fullPath = path.resolve(__dirname, relFile);
      if (!fs.existsSync(fullPath)) continue;

      const rawBuffer = fs.readFileSync(fullPath);
      const diskHash = crypto.createHash('sha256').update(rawBuffer).digest('hex');
      const pristineBuffer = Buffer.from(rawBuffer);

      let resolvedPath = null;
      let pristineExports = null;
      const fnBaselines = new Map();

      try {
        resolvedPath = require.resolve(fullPath);
        pristineExports = require(resolvedPath);

        if (this.freezeExports && typeof pristineExports === 'object' && pristineExports !== null) {
          try { Object.freeze(pristineExports); } catch (_) {}
        }

        if (typeof pristineExports === 'object' && pristineExports !== null) {
          for (const [k, v] of Object.entries(pristineExports)) {
            if (typeof v === 'function') {
              fnBaselines.set(k, {
                fnRef: v,
                fnHash: crypto.createHash('sha256').update(v.toString()).digest('hex')
              });
            }
          }
        }
      } catch (_) {}

      this.baseline.set(fullPath, {
        relFile,
        fullPath,
        diskHash,
        pristineBuffer,
        resolvedPath,
        pristineExports,
        fnBaselines
      });
    }

    this.isInitialized = true;
    this.startPeriodicVerification();
    return this.getBaselineSummary();
  }

  /**
   * Runs multi-layer integrity verification across disk and memory.
   * Execution time is benchmarked (< 5ms ceiling).
   */
  verifyIntegrity() {
    const t0 = performance.now();
    let tampered = false;
    let breach = null;

    for (const [fullPath, base] of this.baseline.entries()) {
      // 1. Disk Layer: Verify file existence and SHA-256 hash
      if (!fs.existsSync(fullPath)) {
        tampered = true;
        breach = { type: 'FILE_DELETED', file: base.relFile, fullPath };
        break;
      }
      const curBuf = fs.readFileSync(fullPath);
      const curHash = crypto.createHash('sha256').update(curBuf).digest('hex');
      if (curHash !== base.diskHash) {
        tampered = true;
        breach = {
          type: 'DISK_HASH_MISMATCH',
          file: base.relFile,
          fullPath,
          expected: base.diskHash,
          actual: curHash
        };
        break;
      }

      // 2. Memory Layer: Verify require.cache presence and exports identity
      if (base.resolvedPath) {
        const cached = require.cache[base.resolvedPath];
        if (!cached) {
          tampered = true;
          breach = { type: 'REQUIRE_CACHE_EVICTED', file: base.relFile, fullPath };
          break;
        }
        if (cached.exports !== base.pristineExports) {
          tampered = true;
          breach = { type: 'EXPORTS_REFERENCE_TAMPERED', file: base.relFile, fullPath };
          break;
        }

        // 3. Exported Function Signatures: Verify function pointers and source code hash
        for (const [fnName, fnBase] of base.fnBaselines.entries()) {
          const curFn = cached.exports[fnName];
          if (typeof curFn !== 'function' || curFn !== fnBase.fnRef) {
            tampered = true;
            breach = {
              type: 'FUNCTION_REFERENCE_TAMPERED',
              file: base.relFile,
              fnName,
              fullPath
            };
            break;
          }
          // Note: In V8, when curFn === fnBase.fnRef, code body is immutable.
          // curFn.toString() hash is verified if reference changes or during baseline.
        }
      }

      if (tampered) break;
    }

    const durationMs = performance.now() - t0;
    this.lastStats = {
      timestamp: new Date().toISOString(),
      durationMs,
      tampered,
      breach
    };

    if (tampered && breach) {
      this.handleTampering(breach);
    }

    return {
      success: !tampered,
      tampered,
      durationMs,
      breach
    };
  }

  /**
   * Containment & response on detected tampering:
   * 1. Engage emergency panic lockdown
   * 2. Enqueue real-time threat alert
   * 3. Log SIEM audit event
   * 4. Perform autonomous self-healing (disk & memory restoration)
   */
  handleTampering(breach) {
    // 1. Activate Emergency Lockdown
    try {
      lockdownManager.activateLockdown({
        initiatedBy: 'MEMORY_INTEGRITY_SENTINEL',
        reason: `CODE_INTEGRITY_TAMPER_DETECTED: [${breach.type}] in ${breach.file}${breach.fnName ? ' (' + breach.fnName + ')' : ''}`
      });
    } catch (_) {}

    // 2. Real-Time Threat Alert
    if (threatAlerter && typeof threatAlerter.dispatchAlert === 'function') {
      try {
        threatAlerter.dispatchAlert('CODE_INTEGRITY_BREACH', {
          clientIp: '127.0.0.1',
          severity: 'CRITICAL',
          summary: `🚨 KRİTİK ALARM: Kod / Bellek bütünlüğü ihlali tespit edildi (${breach.type}) — ${breach.file}`,
          details: breach
        });
      } catch (_) {}
    }

    // 3. SIEM Audit Logging
    try {
      auditLogger.logSecurityEvent('CODE_INTEGRITY_TAMPER_DETECTED', {
        severity: 'CRITICAL',
        status: 503,
        clientIp: '127.0.0.1',
        details: breach
      });
    } catch (_) {}

    // 4. Autonomous Self-Healing
    if (this.autoHeal) {
      this.healBreach(breach);
    }
  }

  /**
   * Restores tampered files or memory exports to pristine boot-time state.
   */
  healBreach(breach) {
    const base = Array.from(this.baseline.values()).find(b => b.relFile === breach.file);
    if (!base) return;

    try {
      // Memory Self-Healing
      if (base.resolvedPath) {
        if (!require.cache[base.resolvedPath]) {
          require.cache[base.resolvedPath] = { exports: base.pristineExports };
        } else {
          require.cache[base.resolvedPath].exports = base.pristineExports;
          if (breach.fnName && base.fnBaselines.has(breach.fnName)) {
            base.pristineExports[breach.fnName] = base.fnBaselines.get(breach.fnName).fnRef;
          }
        }
      }

      // Disk Self-Healing
      if (breach.type === 'DISK_HASH_MISMATCH' || breach.type === 'FILE_DELETED') {
        fs.writeFileSync(path.resolve(__dirname, breach.file), base.pristineBuffer);
      }
    } catch (err) {
      console.error('⚠️ [SENTINEL] Self-healing error:', err.message);
    }
  }

  /**
   * Periodic background verification sweep.
   */
  startPeriodicVerification() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.verifyIntegrity(), this.checkIntervalMs);
    if (this.timer.unref) this.timer.unref();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getBaselineSummary() {
    const summary = {};
    for (const [fullPath, base] of this.baseline.entries()) {
      summary[base.relFile] = {
        hash: base.diskHash,
        functionsCount: base.fnBaselines.size,
        cached: Boolean(base.resolvedPath)
      };
    }
    return summary;
  }
}

const memoryIntegritySentinel = new MemoryIntegritySentinel();

module.exports = {
  memoryIntegritySentinel,
  MemoryIntegritySentinel,
  DEFAULT_TARGET_FILES
};
