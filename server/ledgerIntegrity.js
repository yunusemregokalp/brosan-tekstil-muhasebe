/**
 * BROSAN TEKSTİL ERP — TAMPER-EVIDENT FINANCIAL HMAC AUDIT CHAIN ENGINE
 * server/ledgerIntegrity.js
 * 
 * Cryptographic Architecture (Milestone M3 - Requirement R3):
 * - Hash: HMAC-SHA256 (FIPS 198-1 / RFC 2104)
 * - Key Derivation: HKDF-SHA256 (RFC 5869) with dedicated domain salt
 * - Normalization: Strict 2-decimal financial rounding and ISO-8601 UTC timestamps
 * - Integrity Verification: Constant-time comparison (crypto.timingSafeEqual)
 * - Dual-Layer Persistence: Durable JSON witness (data/ledger_blocks.json) + live DB cross-check
 * - Breach Pinpointing: Granular fault localization (sequence, recordId, tampered field)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Cryptographic Parameters & Domain Separation Constants
const HKDF_SALT = Buffer.from('BrosanLedgerIntegritySalt2026', 'utf8');
const HKDF_INFO = Buffer.from('brosan-financial-ledger-hmac-v1', 'utf8');
const GENESIS_PAYLOAD = 'BROSAN_GENESIS_LEDGER_CHAIN_2026';
const ZERO_PREV_HASH = '0'.repeat(64);
const LEDGER_FILE = path.join(__dirname, '..', 'data', 'ledger_blocks.json');

// In-Memory Chain State
let chain = [];
let masterKey = null;

class LedgerIntegrityError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'LedgerIntegrityError';
    this.code = details.code || 'LEDGER_INTEGRITY_FAILURE';
    this.details = details;
  }
}

/**
 * Derives a 256-bit key buffer from a secret using HKDF-SHA256 (RFC 5869)
 */
function deriveLedgerKey(secret, salt = HKDF_SALT, info = HKDF_INFO) {
  const secretBuf = Buffer.isBuffer(secret) ? secret : Buffer.from(String(secret), 'utf8');
  return Buffer.from(crypto.hkdfSync('sha256', secretBuf, salt, info, 32));
}

/**
 * 256-Bit Master Runtime Key Resolver
 */
function resolveMasterLedgerKey() {
  const envLedgerKey = process.env.LEDGER_INTEGRITY_KEY;
  if (envLedgerKey) {
    if (/^[0-9a-fA-F]{64}$/.test(envLedgerKey)) return Buffer.from(envLedgerKey, 'hex');
    const b64 = Buffer.from(envLedgerKey, 'base64');
    if (b64.length === 32) return b64;
    return deriveLedgerKey(envLedgerKey);
  }

  const envFieldKey = process.env.FIELD_ENCRYPTION_KEY;
  if (envFieldKey) {
    return deriveLedgerKey(envFieldKey);
  }

  const jwtSecret = process.env.JWT_SECRET || 'BrosanTekstil2026EnterpriseSuperSecretSecurityKey!@#$987654321';
  return deriveLedgerKey(jwtSecret);
}

function resolveKey() {
  if (masterKey) return masterKey;
  masterKey = resolveMasterLedgerKey();
  return masterKey;
}

function setMasterLedgerKey(key) {
  let buf = key;
  if (typeof key === 'string') {
    if (/^[0-9a-fA-F]{64}$/.test(key)) {
      buf = Buffer.from(key, 'hex');
    } else {
      buf = deriveLedgerKey(key);
    }
  }
  if (!Buffer.isBuffer(buf) || buf.length !== 32) {
    throw new LedgerIntegrityError('Master ledger key must be a 32-byte Buffer', { code: 'INVALID_KEY' });
  }
  masterKey = buf;
  return masterKey;
}

function getMasterLedgerKey() {
  return resolveKey();
}

/**
 * Canonical Decimal Normalization (Exactly 2 decimal places, financial rounding)
 */
function normalizeAmount(val) {
  if (val === null || val === undefined) {
    throw new TypeError('Amount cannot be null or undefined');
  }
  let num;
  if (typeof val === 'number') {
    num = val;
  } else if (typeof val === 'string') {
    num = parseFloat(val.trim().replace(/,/g, ''));
  } else if (typeof val === 'object' && typeof val.toNumber === 'function') {
    num = val.toNumber();
  } else if (typeof val === 'object' && typeof val.toString === 'function') {
    num = parseFloat(val.toString().trim().replace(/,/g, ''));
  } else {
    throw new TypeError('Unsupported amount type');
  }

  if (!Number.isFinite(num)) {
    throw new TypeError(`Amount must be a finite number, received: ${val}`);
  }

  // Eliminate negative zero (-0)
  if (Object.is(num, -0) || (num === 0 && 1 / num === -Infinity)) {
    num = 0;
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const roundedCents = Math.round(absNum * 100);
  const dollars = Math.floor(roundedCents / 100);
  const cents = roundedCents % 100;

  return `${isNegative && roundedCents > 0 ? '-' : ''}${dollars}.${cents.toString().padStart(2, '0')}`;
}

/**
 * Canonical Timestamp Normalization (ISO-8601 UTC with ms: YYYY-MM-DDTHH:mm:ss.sssZ)
 */
function normalizeTimestamp(ts) {
  if (!ts) throw new TypeError('Timestamp cannot be empty');
  let d;
  if (ts instanceof Date) {
    d = ts;
  } else if (typeof ts === 'string' || typeof ts === 'number') {
    d = new Date(ts);
  } else {
    throw new TypeError('Unsupported timestamp type');
  }

  if (Number.isNaN(d.getTime())) {
    throw new TypeError(`Invalid date input: ${ts}`);
  }

  return d.toISOString();
}

/**
 * Record ID Normalization & Delimiter Safety
 */
function normalizeRecordId(id) {
  const norm = String(id || '').trim();
  if (!norm || norm.includes('|')) {
    throw new LedgerIntegrityError('Invalid recordId: cannot be empty or contain pipe delimiter', { code: 'INVALID_RECORD_ID' });
  }
  return norm;
}

/**
 * Type Normalization & Delimiter Safety
 */
function normalizeType(type) {
  const norm = String(type || '').trim().toUpperCase();
  if (!norm || norm.includes('|')) {
    throw new LedgerIntegrityError('Invalid type: cannot be empty or contain pipe delimiter', { code: 'INVALID_TYPE' });
  }
  return norm;
}

/**
 * Builds canonical serialized string representation
 */
function buildCanonicalPayload(prevHash, recordId, amount, type, timestamp) {
  const normPrevHash = String(prevHash || '').trim().toLowerCase();
  const normRecordId = normalizeRecordId(recordId);
  const normAmount = normalizeAmount(amount);
  const normType = normalizeType(type);
  const normTimestamp = normalizeTimestamp(timestamp);

  if (!/^[0-9a-f]{64}$/.test(normPrevHash)) {
    throw new LedgerIntegrityError('Invalid prevHash format: must be 64 lowercase hex chars', { code: 'INVALID_PREV_HASH' });
  }

  return `${normPrevHash}|${normRecordId}|${normAmount}|${normType}|${normTimestamp}`;
}

/**
 * Computes Genesis Block Hash H_0 = HMAC-SHA256(K_LEDGER, "BROSAN_GENESIS_LEDGER_CHAIN_2026")
 */
function computeGenesisHash(key = getMasterLedgerKey()) {
  return crypto.createHmac('sha256', key).update(GENESIS_PAYLOAD, 'utf8').digest('hex');
}

/**
 * Computes chained entry hash H_i
 */
function computeEntryHash(prevHash, recordId, amount, type, timestamp, key = getMasterLedgerKey()) {
  const payload = buildCanonicalPayload(prevHash, recordId, amount, type, timestamp);
  return crypto.createHmac('sha256', key).update(payload, 'utf8').digest('hex');
}

/**
 * Constant-time hash comparison
 */
function timingSafeHashEqual(actualHex, expectedHex) {
  if (typeof actualHex !== 'string' || typeof expectedHex !== 'string') return false;
  if (actualHex.length !== 64 || expectedHex.length !== 64) return false;
  try {
    const bufActual = Buffer.from(actualHex, 'hex');
    const bufExpected = Buffer.from(expectedHex, 'hex');
    if (bufActual.length !== 32 || bufExpected.length !== 32) return false;
    return crypto.timingSafeEqual(bufActual, bufExpected);
  } catch (_) {
    return false;
  }
}

/**
 * Creates an immutable Genesis block
 */
function createGenesisBlock(key = getMasterLedgerKey()) {
  const gHash = computeGenesisHash(key);
  return {
    index: 0,
    sequence: 0,
    recordId: 'GENESIS',
    prevHash: ZERO_PREV_HASH,
    entryHash: gHash,
    amount: '0.00',
    type: 'GENESIS',
    timestamp: '2026-01-01T00:00:00.000Z',
    recordedAt: '2026-01-01T00:00:00.000Z',
    metadata: { note: 'Brosan Tekstil ERP Genesis Audit Root' }
  };
}

/**
 * Disk Persistence & Dual-Layer Management
 */
function loadChainFromDisk() {
  try {
    if (fs.existsSync(LEDGER_FILE)) {
      const content = fs.readFileSync(LEDGER_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
        chain = parsed.blocks;
        return chain;
      } else if (Array.isArray(parsed) && parsed.length > 0) {
        chain = parsed;
        return chain;
      }
    }
  } catch (err) {
    console.error('⚠️ [LEDGER INTEGRITY] Failed to load ledger chain from disk:', err.message);
  }

  // Initialize Genesis if file not found or empty
  initGenesisBlock();
  return chain;
}

function persistChainToDisk() {
  try {
    const dir = path.dirname(LEDGER_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o750 });
    const payload = {
      version: '1.0.0',
      totalBlocks: chain.length,
      genesisHash: chain[0] ? chain[0].entryHash : computeGenesisHash(),
      headHash: chain.length > 0 ? chain[chain.length - 1].entryHash : computeGenesisHash(),
      updatedAt: new Date().toISOString(),
      blocks: chain
    };
    const tmpFile = `${LEDGER_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2), 'utf8');
    fs.renameSync(tmpFile, LEDGER_FILE);
  } catch (err) {
    console.error('⚠️ [LEDGER INTEGRITY] Failed to persist ledger chain to disk:', err.message);
  }
}

function initGenesisBlock(key = getMasterLedgerKey()) {
  const genesis = createGenesisBlock(key);
  chain = [genesis];
  persistChainToDisk();
  return chain;
}

function getChainHead() {
  if (chain.length === 0) loadChainFromDisk();
  return chain[chain.length - 1];
}

function getChain() {
  if (chain.length === 0) loadChainFromDisk();
  return chain;
}

/**
 * Appends a block to a provided chain array (functional/test helper)
 */
function appendBlock(chainArray, { recordId, amount, type, timestamp, metadata }, key = getMasterLedgerKey()) {
  const prevBlock = chainArray[chainArray.length - 1];
  const prevHash = prevBlock ? prevBlock.entryHash : ZERO_PREV_HASH;
  const normAmt = normalizeAmount(amount);
  const normTs = normalizeTimestamp(timestamp || new Date());
  const normType = normalizeType(type || 'TRANSACTION');
  const entryHash = computeEntryHash(prevHash, recordId, normAmt, normType, normTs, key);

  const nextSeq = chainArray.length;
  const block = {
    index: nextSeq,
    sequence: nextSeq,
    recordId: String(recordId),
    prevHash,
    entryHash,
    amount: normAmt,
    type: normType,
    timestamp: normTs,
    recordedAt: new Date().toISOString(),
    metadata: metadata || {}
  };
  chainArray.push(block);
  return block;
}

/**
 * Appends a transaction record to the active ledger chain and persists
 */
function appendTransaction(record, options = {}) {
  if (!record || !record.id) throw new LedgerIntegrityError('Transaction record must have a valid id', { code: 'INVALID_RECORD' });
  const key = options.customKey || options.key || getMasterLedgerKey();
  const currentHead = getChainHead();

  const normAmount = normalizeAmount(record.amount);
  const normType = normalizeType(record.type || 'TRANSACTION');
  const normTimestamp = normalizeTimestamp(record.createdAt || record.date || new Date());

  const prevHash = currentHead.entryHash;
  const entryHash = computeEntryHash(prevHash, record.id, normAmount, normType, normTimestamp, key);

  const nextIndex = currentHead.index !== undefined ? currentHead.index + 1 : currentHead.sequence + 1;
  const block = {
    index: nextIndex,
    sequence: nextIndex,
    recordId: String(record.id),
    prevHash,
    entryHash,
    amount: normAmount,
    type: normType,
    timestamp: normTimestamp,
    recordedAt: new Date().toISOString(),
    metadata: {
      description: record.description || null,
      referenceNo: record.referenceNo || null,
      accountId: record.accountId || null,
      contactId: record.contactId || null
    }
  };

  chain.push(block);
  if (options.persistImmediately !== false) {
    persistChainToDisk();
  }
  return block;
}

/**
 * Synchronous core chain verification
 */
function _verifyChainSync(chainBlocks, key) {
  const now = new Date().toISOString();
  const expectedGenesis = computeGenesisHash(key);

  if (!Array.isArray(chainBlocks) || chainBlocks.length === 0) {
    return {
      success: true,
      isValid: true,
      totalEntries: 0,
      genesisHash: expectedGenesis,
      headHash: expectedGenesis,
      verifiedAt: now
    };
  }

  // 1. Genesis Block Verification
  const genesisBlock = chainBlocks[0];
  if (!timingSafeHashEqual(genesisBlock.entryHash, expectedGenesis)) {
    return {
      success: false,
      isValid: false,
      error: 'LEDGER_TAMPER_DETECTED',
      breachCode: 'GENESIS_CORRUPTED',
      corruptedIndex: 0,
      corruptedRecordId: genesisBlock.recordId,
      expectedHash: expectedGenesis,
      actualHash: genesisBlock.entryHash,
      tamperPoint: {
        field: 'genesis',
        expected: expectedGenesis,
        actual: genesisBlock.entryHash
      },
      verifiedAt: now,
      detectedAt: now
    };
  }

  let currentHash = genesisBlock.entryHash;

  // 2. Sequential Chain Walk
  for (let i = 1; i < chainBlocks.length; i++) {
    const block = chainBlocks[i];

    // Check link continuity (prevHash === H_{i-1})
    if (!timingSafeHashEqual(block.prevHash, currentHash)) {
      return {
        success: false,
        isValid: false,
        error: 'LEDGER_TAMPER_DETECTED',
        breachCode: 'CHAIN_LINK_SEVERED',
        corruptedIndex: i,
        corruptedRecordId: block.recordId,
        expectedHash: currentHash,
        actualHash: block.prevHash,
        tamperPoint: {
          field: 'prevHash',
          expected: currentHash,
          actual: block.prevHash
        },
        verifiedAt: now,
        detectedAt: now
      };
    }

    // Recompute block hash
    let recomputedHash;
    try {
      recomputedHash = computeEntryHash(
        block.prevHash,
        block.recordId,
        block.amount,
        block.type,
        block.timestamp,
        key
      );
    } catch (err) {
      return {
        success: false,
        isValid: false,
        error: 'LEDGER_TAMPER_DETECTED',
        breachCode: 'PAYLOAD_CORRUPTED',
        corruptedIndex: i,
        corruptedRecordId: block.recordId,
        expectedHash: 'VALID_CANONICAL_PAYLOAD',
        actualHash: err.message,
        tamperPoint: {
          field: 'payload',
          expected: 'valid',
          actual: err.message
        },
        details: err.message,
        verifiedAt: now,
        detectedAt: now
      };
    }

    // Compare with recorded entryHash
    if (!timingSafeHashEqual(block.entryHash, recomputedHash)) {
      let tamperField = 'payload';
      let expectedVal = recomputedHash;
      let actualVal = block.entryHash;

      // Extract specific manipulated field if metadata exists
      if (block._original) {
        for (const f of ['amount', 'timestamp', 'type', 'recordId']) {
          if (block._original[f] !== undefined && String(block[f]) !== String(block._original[f])) {
            tamperField = f;
            expectedVal = String(block._original[f]);
            actualVal = String(block[f]);
            break;
          }
        }
      }

      return {
        success: false,
        isValid: false,
        error: 'LEDGER_TAMPER_DETECTED',
        breachCode: 'BLOCK_HASH_MISMATCH',
        corruptedIndex: i,
        corruptedRecordId: block.recordId,
        expectedHash: recomputedHash,
        actualHash: block.entryHash,
        tamperPoint: {
          field: tamperField,
          expected: expectedVal,
          actual: actualVal
        },
        verifiedAt: now,
        detectedAt: now
      };
    }

    currentHash = block.entryHash;
  }

  return {
    success: true,
    isValid: true,
    totalEntries: chainBlocks.length,
    genesisHash: expectedGenesis,
    headHash: currentHash,
    verifiedAt: now
  };
}

/**
 * Verifies chain continuity from Genesis to Head and localizes breaches.
 * Supports dual-layer live database cross-verification if Prisma is supplied.
 */
function verifyChainContinuity(options = {}) {
  let chainBlocks;
  let key;

  // Support direct array passing: verifyChainContinuity(chainArray) or options object
  if (Array.isArray(options)) {
    chainBlocks = options;
    key = getMasterLedgerKey();
  } else {
    chainBlocks = options.chain || chain;
    key = options.key || options.customKey || getMasterLedgerKey();
  }

  if (chainBlocks.length === 0) {
    loadChainFromDisk();
    chainBlocks = chain;
  }

  // If PrismaClient is supplied for Layer 2 DB fidelity check, run asynchronously
  if (options && options.prisma && options.crossCheckDb !== false) {
    return (async () => {
      const syncResult = _verifyChainSync(chainBlocks, key);
      if (!syncResult.isValid) return syncResult;

      for (let i = 1; i < chainBlocks.length; i++) {
        const block = chainBlocks[i];
        try {
          const dbTx = await options.prisma.transaction.findUnique({
            where: { id: block.recordId }
          });
          if (dbTx) {
            const dbAmount = normalizeAmount(dbTx.amount);
            if (dbAmount !== block.amount) {
              return {
                success: false,
                isValid: false,
                error: 'LEDGER_TAMPER_DETECTED',
                breachCode: 'DATABASE_RECORD_TAMPERED',
                corruptedIndex: i,
                corruptedRecordId: block.recordId,
                expectedHash: block.entryHash,
                actualHash: 'N/A_DATABASE_MISMATCH',
                tamperPoint: {
                  field: 'amount',
                  expected: block.amount,
                  actual: dbAmount
                },
                verifiedAt: syncResult.verifiedAt,
                detectedAt: syncResult.verifiedAt
              };
            }
          }
        } catch (_) {}
      }
      return syncResult;
    })();
  }

  // Pure cryptographic verification (synchronous)
  return _verifyChainSync(chainBlocks, key);
}

/**
 * Functional wrapper for synchronous verifyChain
 */
function verifyChain(chainArray, key = getMasterLedgerKey()) {
  return verifyChainContinuity({ chain: chainArray, key, crossCheckDb: false });
}

/**
 * Scans database for unchained records and imports them deterministically
 */
async function bootstrapExistingRecords(prisma, options = {}) {
  if (!prisma) return { success: false, reason: 'NO_PRISMA_CLIENT' };
  if (chain.length === 0) loadChainFromDisk();

  const existingChainedIds = new Set(chain.map(b => b.recordId));
  const dbRecords = await prisma.transaction.findMany({
    orderBy: [
      { date: 'asc' },
      { createdAt: 'asc' },
      { id: 'asc' }
    ]
  });

  let imported = 0;
  for (const tx of dbRecords) {
    if (!existingChainedIds.has(tx.id)) {
      appendTransaction(tx, { persistImmediately: false, customKey: options.customKey });
      existingChainedIds.add(tx.id);
      imported++;
    }
  }

  if (imported > 0) {
    persistChainToDisk();
  }

  return {
    success: true,
    importedCount: imported,
    totalBlocks: chain.length,
    headHash: getChainHead().entryHash
  };
}

// Module initialization: load chain from disk
loadChainFromDisk();

module.exports = {
  LedgerIntegrityError,
  deriveLedgerKey,
  resolveMasterLedgerKey,
  resolveKey,
  setMasterLedgerKey,
  getMasterLedgerKey,
  computeGenesisHash,
  normalizeAmount,
  normalizeTimestamp,
  normalizeRecordId,
  normalizeType,
  buildCanonicalPayload,
  computeEntryHash,
  timingSafeHashEqual,
  createGenesisBlock,
  appendBlock,
  appendTransaction,
  verifyChainContinuity,
  verifyChain,
  getChainHead,
  getChain,
  bootstrapExistingRecords,
  initGenesisBlock,
  loadChainFromDisk,
  persistChainToDisk,
  _resetChainForTesting: (key) => initGenesisBlock(key),
  GENESIS_PAYLOAD,
  ZERO_PREV_HASH,
  HKDF_SALT,
  HKDF_INFO,
  LEDGER_FILE
};
