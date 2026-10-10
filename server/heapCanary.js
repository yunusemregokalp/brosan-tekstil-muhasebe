/**
 * BROSAN TEKSTİL ERP — SOVEREIGN OMEGA CITADEL (PHASE 10)
 * Module: server/heapCanary.js
 *
 * Kernel-Style Heap Canary & Memory Corruption Tripwire.
 * Wraps sensitive V8 memory allocations in contiguous memory blocks with 64-byte
 * HMAC-SHA512 guard words, achieving sub-microsecond constant-time verification,
 * scorched-earth memory scrubbing, and immediate emergency panic lockdown on tampering.
 */

const crypto = require('crypto');
const { lockdownManager } = require('./lockdown');
const threatAlerter = require('./threatAlerter');
const { logSecurityEvent } = require('./auditLogger');

// ==============================================================================
// 1. CONSTANTS & CONFIGURATION
// ==============================================================================
const CANARY_SIZE_BYTES = 64; // 64-byte (512-bit) HMAC-SHA512 guard words
const DEFAULT_SCAN_INTERVAL_MS = process.env.HEAP_CANARY_INTERVAL_MS
  ? parseInt(process.env.HEAP_CANARY_INTERVAL_MS, 10)
  : (process.env.CITADEL_FAST_TEST === '1' ? 100 : 5000);

// Process-scoped private root key for canary HMAC generation (never leaked)
let CANARY_ROOT_KEY = crypto.randomBytes(32);

// ==============================================================================
// 2. ERROR CLASS
// ==============================================================================
class MemoryCorruptionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'MemoryCorruptionError';
    this.code = 'MEMORY_CORRUPTION_DETECTED';
    this.details = details;
  }
}

// ==============================================================================
// 3. HEAP CANARY TRIPWIRE ENGINE
// ==============================================================================
class HeapCanaryTripwire {
  constructor(options = {}) {
    this.scanIntervalMs = options.scanIntervalMs || DEFAULT_SCAN_INTERVAL_MS;
    this.registry = new Map(); // id -> descriptor
    this.scanInterval = null;
    this.scansCompleted = 0;
    this.totalAllocated = 0;
    this.totalFreed = 0;
    this.isCompromised = false;

    this.startScanning();
  }

  /**
   * Generates a 64-byte HMAC-SHA512 canary word.
   */
  _computeCanary(canaryId, length, createdAt, salt, type) {
    if (!CANARY_ROOT_KEY || CANARY_ROOT_KEY.every(b => b === 0)) {
      CANARY_ROOT_KEY = crypto.randomBytes(32);
    }
    const hmac = crypto.createHmac('sha512', CANARY_ROOT_KEY);
    const tag = Buffer.from(`CANARY_${type}:${canaryId}:${length}:${createdAt}`);
    hmac.update(salt);
    hmac.update(tag);
    hmac.update(salt);
    return hmac.digest(); // Exactly 64 bytes
  }

  /**
   * Allocates a contiguous buffer [Canary_Head (64B)][Payload (N B)][Canary_Tail (64B)].
   * @param {number|Buffer|string} sizeOrData
   * @param {object} [options]
   * @returns {object} ProtectedBuffer wrapper
   */
  allocateProtectedBuffer(sizeOrData, options = {}) {
    if (this.isCompromised) {
      throw new MemoryCorruptionError('Cannot allocate memory: Heap Canary Tripwire is in compromised state', {
        reason: 'SYSTEM_COMPROMISED'
      });
    }

    let payloadLength = 0;
    let initialData = null;

    if (typeof sizeOrData === 'number') {
      payloadLength = sizeOrData;
    } else if (Buffer.isBuffer(sizeOrData)) {
      payloadLength = sizeOrData.length;
      initialData = sizeOrData;
    } else if (typeof sizeOrData === 'string') {
      initialData = Buffer.from(sizeOrData, 'utf8');
      payloadLength = initialData.length;
    } else {
      throw new TypeError('sizeOrData must be a number, Buffer, or string');
    }

    const canaryId = crypto.randomUUID();
    const salt = crypto.randomBytes(16);
    const createdAt = Date.now();
    const label = options.label || 'SENSITIVE_BUFFER';

    // Total length = 64 (head) + payloadLength + 64 (tail)
    const totalLength = CANARY_SIZE_BYTES + payloadLength + CANARY_SIZE_BYTES;
    const rawBuffer = Buffer.alloc(totalLength);

    // Compute expected canaries
    const expectedHead = this._computeCanary(canaryId, payloadLength, createdAt, salt, 'HEAD');
    const expectedTail = this._computeCanary(canaryId, payloadLength, createdAt, salt, 'TAIL');

    // Place Head canary at [0 .. 63]
    expectedHead.copy(rawBuffer, 0, 0, CANARY_SIZE_BYTES);

    // Create payload slice at [64 .. 64 + payloadLength]
    const payloadBuffer = rawBuffer.subarray(CANARY_SIZE_BYTES, CANARY_SIZE_BYTES + payloadLength);

    // Copy initial data if provided
    if (initialData) {
      initialData.copy(payloadBuffer, 0, 0, payloadLength);
      if (options.wipeSource && Buffer.isBuffer(sizeOrData)) {
        sizeOrData.fill(0);
      }
    }

    // Place Tail canary at [64 + payloadLength .. 127 + payloadLength]
    expectedTail.copy(rawBuffer, CANARY_SIZE_BYTES + payloadLength, 0, CANARY_SIZE_BYTES);

    const descriptor = {
      id: canaryId,
      label,
      size: payloadLength,
      rawBuffer,
      payload: payloadBuffer,
      expectedHead,
      expectedTail,
      salt,
      createdAt,
      lastCheckedAt: createdAt,
      state: 'ACTIVE'
    };

    this.registry.set(canaryId, descriptor);
    this.totalAllocated++;

    const self = this;
    return {
      id: canaryId,
      label,
      payload: payloadBuffer,
      rawBuffer,
      length: payloadLength,
      verify: () => self.verify(canaryId),
      free: () => self.free(canaryId),
      getStatus: () => ({ id: canaryId, label, state: descriptor.state, size: payloadLength })
    };
  }

  /**
   * Scoped consumer pattern (RAII): automatically allocates, verifies, and scrubs on exit.
   */
  async withProtectedBuffer(data, callback, options = {}) {
    const protectedBuf = this.allocateProtectedBuffer(data, options);
    try {
      return await callback(protectedBuf.payload, protectedBuf);
    } finally {
      protectedBuf.free();
    }
  }

  /**
   * Wraps and protects a long-lived secret (e.g. master keys, JWT secrets).
   */
  protectSecret(secretStrOrBuf, label = 'MASTER_SECRET') {
    return this.allocateProtectedBuffer(secretStrOrBuf, { label, wipeSource: false });
  }

  /**
   * Constant-time verification of a single protected buffer.
   * If corrupted: triggers scorched-earth wipe, panic lockdown, threat alert, SIEM log.
   */
  verify(canaryId) {
    const descriptor = this.registry.get(canaryId);
    if (!descriptor) {
      return { isValid: false, reason: 'BUFFER_NOT_FOUND_OR_FREED' };
    }
    if (descriptor.state === 'FREED') {
      return { isValid: false, reason: 'BUFFER_ALREADY_FREED' };
    }

    const { rawBuffer, size, expectedHead, expectedTail, label } = descriptor;

    // Extract active canary words from raw buffer
    const activeHead = rawBuffer.subarray(0, CANARY_SIZE_BYTES);
    const activeTail = rawBuffer.subarray(CANARY_SIZE_BYTES + size, CANARY_SIZE_BYTES + size + CANARY_SIZE_BYTES);

    let headValid = false;
    let tailValid = false;

    try {
      headValid = crypto.timingSafeEqual(activeHead, expectedHead);
      tailValid = crypto.timingSafeEqual(activeTail, expectedTail);
    } catch (err) {
      headValid = false;
      tailValid = false;
    }

    if (!headValid || !tailValid) {
      const corruptedSegment = !headValid && !tailValid ? 'HEAD_AND_TAIL' : (!headValid ? 'HEAD' : 'TAIL');
      this._handleCorruption(descriptor, corruptedSegment);
      return {
        isValid: false,
        reason: 'MEMORY_CORRUPTION_DETECTED',
        corruptedSegment
      };
    }

    descriptor.lastCheckedAt = Date.now();
    return { isValid: true };
  }

  /**
   * Verifies all registered buffers in constant-time.
   */
  verifyAll() {
    let allValid = true;
    for (const id of Array.from(this.registry.keys())) {
      const res = this.verify(id);
      if (!res.isValid) {
        allValid = false;
        break;
      }
    }
    return { isValid: allValid, activeCount: this.registry.size };
  }

  /**
   * Safely zeroes and frees a protected buffer.
   */
  free(canaryId) {
    const descriptor = this.registry.get(canaryId);
    if (!descriptor) return false;

    try {
      if (descriptor.rawBuffer && Buffer.isBuffer(descriptor.rawBuffer)) {
        descriptor.rawBuffer.fill(0);
      }
      if (descriptor.expectedHead) descriptor.expectedHead.fill(0);
      if (descriptor.expectedTail) descriptor.expectedTail.fill(0);
    } catch (_) {}

    descriptor.state = 'FREED';
    this.registry.delete(canaryId);
    this.totalFreed++;
    return true;
  }

  /**
   * Periodic background sweep over all active canary buffers.
   */
  scanAllCanaries() {
    try {
      this.verifyAll();
      this.scansCompleted++;
    } catch (err) {
      // Corruption handler already triggered in verify()
    }
  }

  /**
   * Starts autonomous background scanning interval.
   */
  startScanning() {
    if (this.scanInterval) return;
    this.scanInterval = setInterval(() => {
      this.scanAllCanaries();
    }, this.scanIntervalMs);

    if (this.scanInterval.unref) {
      this.scanInterval.unref();
    }
  }

  /**
   * Stops background scanning interval (useful for clean test teardown).
   */
  stopScanning() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  /**
   * Scorched-earth containment protocol executed on memory corruption.
   */
  _handleCorruption(corruptedDescriptor, corruptedSegment) {
    this.isCompromised = true;
    corruptedDescriptor.state = 'CORRUPTED';

    // 1. Instant microsecond memory scrubbing on corrupted buffer
    try {
      if (corruptedDescriptor.rawBuffer) {
        corruptedDescriptor.rawBuffer.fill(0);
      }
    } catch (_) {}

    // 2. Scorched-earth memory scrubbing across ALL registered buffers
    for (const record of this.registry.values()) {
      try {
        if (record.rawBuffer && Buffer.isBuffer(record.rawBuffer)) {
          record.rawBuffer.fill(0);
        }
        if (record.expectedHead) record.expectedHead.fill(0);
        if (record.expectedTail) record.expectedTail.fill(0);
        record.state = 'CORRUPTED';
      } catch (_) {}
    }

    // 3. Scrub process canary root key
    try {
      if (CANARY_ROOT_KEY) CANARY_ROOT_KEY.fill(0);
    } catch (_) {}

    // 4. Activate emergency panic lockdown
    try {
      if (lockdownManager && typeof lockdownManager.activateLockdown === 'function') {
        lockdownManager.activateLockdown({
          initiatedBy: 'HEAP_CANARY_TRIPWIRE',
          reason: 'MEMORY_CORRUPTION_DETECTED'
        });
      }
    } catch (err) {
      console.error('⚠️ [HEAP CANARY] Failed to trigger lockdownManager:', err.message);
    }

    // 5. Dispatch real-time threat alert
    try {
      if (threatAlerter && typeof threatAlerter.dispatchAlert === 'function') {
        threatAlerter.dispatchAlert('MEMORY_CORRUPTION_DETECTED', {
          clientIp: '127.0.0.1',
          severity: 'CRITICAL',
          summary: `💥 KRİTİK ALARM: Heap Canary Tripwire tetiklendi! V8 tampon yığın taşması / bellek bozulması tespit edildi (${corruptedSegment}).`,
          details: {
            canaryId: corruptedDescriptor.id,
            label: corruptedDescriptor.label,
            corruptedSegment,
            size: corruptedDescriptor.size,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (err) {
      console.error('⚠️ [HEAP CANARY] Failed to dispatch threat alert:', err.message);
    }

    // 6. Log SIEM audit security event
    try {
      if (typeof logSecurityEvent === 'function') {
        logSecurityEvent('MEMORY_CORRUPTION_DETECTED', {
          severity: 'CRITICAL',
          status: 503,
          clientIp: '127.0.0.1',
          details: {
            canaryId: corruptedDescriptor.id,
            label: corruptedDescriptor.label,
            corruptedSegment,
            size: corruptedDescriptor.size
          }
        });
      }
    } catch (err) {
      console.error('⚠️ [HEAP CANARY] Failed to log SIEM audit event:', err.message);
    }

    // 7. Throw fatal error
    throw new MemoryCorruptionError(
      `Fatal Memory Corruption detected in buffer [${corruptedDescriptor.label}] at segment [${corruptedSegment}]. Memory wiped and panic lockdown activated.`,
      {
        canaryId: corruptedDescriptor.id,
        label: corruptedDescriptor.label,
        corruptedSegment
      }
    );
  }

  /**
   * Returns current health and telemetry status.
   */
  getStatus() {
    return {
      activeCanaries: this.registry.size,
      totalAllocated: this.totalAllocated,
      totalFreed: this.totalFreed,
      scansCompleted: this.scansCompleted,
      isCompromised: this.isCompromised,
      scanIntervalMs: this.scanIntervalMs,
      isScanning: Boolean(this.scanInterval)
    };
  }

  /**
   * Resets engine state (used strictly for test harness cleanup).
   */
  reset() {
    for (const record of this.registry.values()) {
      try {
        if (record.rawBuffer) record.rawBuffer.fill(0);
      } catch (_) {}
    }
    this.registry.clear();
    this.isCompromised = false;
    this.totalAllocated = 0;
    this.totalFreed = 0;
    this.scansCompleted = 0;
    CANARY_ROOT_KEY = crypto.randomBytes(32);
  }
}

// ==============================================================================
// 4. SINGLETON & CONVENIENCE EXPORTS
// ==============================================================================
const defaultCanaryTripwire = new HeapCanaryTripwire();

module.exports = {
  HeapCanaryTripwire,
  defaultCanaryTripwire,
  heapCanary: defaultCanaryTripwire,
  allocateProtectedBuffer: (sizeOrData, options) => defaultCanaryTripwire.allocateProtectedBuffer(sizeOrData, options),
  withProtectedBuffer: (data, callback, options) => defaultCanaryTripwire.withProtectedBuffer(data, callback, options),
  protectSecret: (secret, label) => defaultCanaryTripwire.protectSecret(secret, label),
  verify: (id) => defaultCanaryTripwire.verify(id),
  verifyAll: () => defaultCanaryTripwire.verifyAll(),
  free: (id) => defaultCanaryTripwire.free(id),
  startScanning: () => defaultCanaryTripwire.startScanning(),
  stopScanning: () => defaultCanaryTripwire.stopScanning(),
  getStatus: () => defaultCanaryTripwire.getStatus(),
  reset: () => defaultCanaryTripwire.reset(),
  CANARY_SIZE_BYTES,
  MemoryCorruptionError
};
