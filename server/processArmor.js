/**
 * BROSAN TEKSTİL ERP — SOVEREIGN CITADEL HARDENING
 * Layer 4: Process Runtime Armor & Memory Sentinel (Phase 6 - Requirement R4)
 * 
 * Features:
 * - VM-Level Prototype Freezing: Object.prototype, Array.prototype, Function.prototype
 * - Dynamic Code Evaluation Neutralization: Blocks eval() and Function constructor
 * - Immutable process.env Proxy: Prevents in-memory environment tampering
 * - Process Heap Memory Monitoring: Real-time tracking of memory metrics with usage ratio alerts
 * - Self-contained, idempotent activation (activate, isArmorActive, getHeapStats)
 */

const v8 = require('v8');

let auditLogger = null;
try {
  auditLogger = require('./auditLogger');
} catch (_) {}

let threatAlerter = null;
try {
  threatAlerter = require('./threatAlerter');
} catch (_) {}

class ProcessArmor {
  constructor(options = {}) {
    this.isActive = false;
    this.heapMonitorTimer = null;
    this.monitorIntervalMs = options.monitorIntervalMs || 30000;
    this.heapThresholdRatio = options.heapThresholdRatio || 0.85;
    this.heapThresholdMb = options.heapThresholdMb || 512;
  }

  isArmorActive() {
    return this.isActive;
  }

  getHeapStats() {
    const mem = process.memoryUsage();
    const heapUsedMb = Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100;
    const heapTotalMb = Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100;
    const rssMb = Math.round((mem.rss / 1024 / 1024) * 100) / 100;
    const externalMb = Math.round((mem.external / 1024 / 1024) * 100) / 100;

    let heapLimitMb = 1400;
    try {
      const stats = v8.getHeapStatistics();
      heapLimitMb = Math.round((stats.heap_size_limit / 1024 / 1024) * 100) / 100;
    } catch (_) {}

    const usageRatio = Math.round((heapUsedMb / heapLimitMb) * 1000) / 1000;

    return {
      heapUsedMb,
      heapTotalMb,
      rssMb,
      externalMb,
      heapLimitMb,
      usageRatio
    };
  }

  _checkHeapHealth() {
    const stats = this.getHeapStats();
    if (stats.usageRatio > this.heapThresholdRatio || stats.heapUsedMb > this.heapThresholdMb) {
      try {
        if (auditLogger && typeof auditLogger.logSecurityEvent === 'function') {
          auditLogger.logSecurityEvent('HIGH_MEMORY_PRESSURE', {
            severity: 'WARN',
            status: 500,
            clientIp: 'SYSTEM',
            details: stats
          });
        }
      } catch (_) {}

      try {
        if (threatAlerter && typeof threatAlerter.dispatchAlert === 'function') {
          threatAlerter.dispatchAlert('HIGH_MEMORY_PRESSURE', {
            clientIp: 'SYSTEM',
            severity: 'HIGH',
            summary: `⚠️ Yüksek bellek baskısı tespit edildi: ${stats.heapUsedMb}MB / ${stats.heapLimitMb}MB (${(stats.usageRatio * 100).toFixed(1)}%)`,
            details: stats
          });
        }
      } catch (_) {}
    }
  }

  activate() {
    if (this.isActive) return this;

    // 1. Immutable process.env Protection via Proxy
    try {
      const envSnapshot = { ...process.env };
      Object.freeze(envSnapshot);

      const envProxy = new Proxy(envSnapshot, {
        get(target, prop, receiver) {
          if (typeof prop === 'string') {
            if (prop in target) return target[prop];
            const match = Object.keys(target).find(k => k.toLowerCase() === prop.toLowerCase());
            if (match) return target[match];
          }
          return target[prop];
        },
        set(target, prop, value) {
          throw new Error(`PROCESS_ENV_IMMUTABLE: Tampering with process.env.${String(prop)} is prohibited by Process Armor`);
        },
        defineProperty(target, prop) {
          throw new Error(`PROCESS_ENV_IMMUTABLE: Defining properties on process.env is prohibited by Process Armor`);
        },
        deleteProperty(target, prop) {
          throw new Error(`PROCESS_ENV_IMMUTABLE: Deleting properties from process.env is prohibited by Process Armor`);
        }
      });

      Object.defineProperty(process, 'env', {
        value: envProxy,
        writable: false,
        configurable: false
      });
    } catch (_) {}

    // 2. Dynamic Code Evaluation Neutralization (eval & Function)
    try {
      global.eval = function blockedEval() {
        throw new Error('DYNAMIC_CODE_EVALUATION_PROHIBITED: eval() is disabled by Process Runtime Armor');
      };

      const OriginalFunction = Function;
      const blockedFunction = function (...args) {
        const stack = new Error().stack || '';
        // Permit internal runtime calls from trusted node_modules (e.g. Zod JIT schema compiler)
        if (stack.includes('node_modules')) {
          if (new.target) {
            return Reflect.construct(OriginalFunction, args, new.target);
          }
          return OriginalFunction.apply(this, args);
        }
        throw new Error('DYNAMIC_CODE_EVALUATION_PROHIBITED: Function constructor is disabled by Process Runtime Armor');
      };
      blockedFunction.prototype = OriginalFunction.prototype;
      try {
        Object.defineProperty(OriginalFunction.prototype, 'constructor', {
          value: blockedFunction,
          writable: false,
          configurable: false
        });
      } catch (_) {}
      global.Function = blockedFunction;
    } catch (_) {}

    // 3. Core Prototypes Freezing (Object, Array, Function)
    try {
      Object.freeze(Object.prototype);
      Object.freeze(Array.prototype);
      Object.freeze(Function.prototype);
    } catch (_) {}

    // 4. Process Heap Memory Monitor
    this.heapMonitorTimer = setInterval(() => this._checkHeapHealth(), this.monitorIntervalMs);
    if (this.heapMonitorTimer.unref) this.heapMonitorTimer.unref();

    this.isActive = true;
    return this;
  }

  stop() {
    if (this.heapMonitorTimer) {
      clearInterval(this.heapMonitorTimer);
      this.heapMonitorTimer = null;
    }
  }
}

const defaultProcessArmor = new ProcessArmor();

module.exports = {
  ProcessArmor,
  processArmor: defaultProcessArmor
};
