/**
 * BROSAN TEKSTİL ERP — CITADEL SECURITY HARDENING
 * Layer 2: Cryptographic Merkle State Snapshot & Tamper-Proof Audit Vault
 * server/merkleVault.js
 * 
 * Requirements Addressed:
 * - Deterministic SHA-256 canonical leaf calculation across accounting entities:
 *   Account, Contact, Invoice, JournalEntry, Transaction.
 * - Normalized monetary amounts (normalizeAmount: "10.00" format).
 * - Lexicographical leaf sorting prior to binary Merkle tree reduction.
 * - Sibling pairing with odd-leaf duplication and SHA-256 tree reduction.
 * - HKDF HMAC-SHA256 ledger root seal using server master secret.
 * - Append-only disk forensic log (data/merkle_audit_vault.jsonl) & active head snapshot (data/merkle_state.json).
 * - Live and snapshot cryptographic verification.
 * - Automated tamper escalation: Emits MERKLE_ROOT_MISMATCH, logs SIEM event,
 *   dispatches threat alert, and calls lockdownManager.activateLockdown({ initiatedBy: 'MERKLE_VAULT_SENTINEL', reason: 'MERKLE_ROOT_MISMATCH' }).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

// Optional/lazy integration with security components
let lockdownManager = null;
try {
  ({ lockdownManager } = require('./lockdown'));
} catch (_) {}

let auditLogger = null;
try {
  auditLogger = require('./auditLogger');
} catch (_) {}

let threatAlerter = null;
try {
  threatAlerter = require('./threatAlerter');
} catch (_) {}

// Cryptographic constants & defaults
const HKDF_SALT = Buffer.from('BrosanMerkleVaultSalt2026', 'utf8');
const HKDF_INFO = Buffer.from('brosan-financial-merkle-vault-v1', 'utf8');
const DEFAULT_MASTER_SECRET = 'BrosanSovereignMerkleVaultMasterSecretKey2026';
const EMPTY_MERKLE_ROOT = crypto.createHash('sha256').update('BROSAN_EMPTY_MERKLE_ROOT_2026').digest('hex');

// Persistence paths
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const VAULT_JOURNAL_FILE = path.join(DATA_DIR, 'merkle_audit_vault.jsonl');
const VAULT_STATE_FILE = path.join(DATA_DIR, 'merkle_state.json');

/**
 * Normalizes monetary amounts into canonical financial format ("10.00", "-10.00").
 * Handles Number, String, and Prisma/Decimal.js objects.
 * 
 * @param {number|string|object} val
 * @returns {string} Exactly 2-decimal canonical representation
 */
function normalizeAmount(val) {
  if (val === null || val === undefined) {
    return '0.00';
  }

  let num;
  if (typeof val === 'number') {
    num = val;
  } else if (typeof val === 'string') {
    const cleaned = val.trim().replace(/,/g, '');
    if (cleaned === '') return '0.00';
    num = parseFloat(cleaned);
  } else if (typeof val === 'object' && typeof val.toNumber === 'function') {
    num = val.toNumber();
  } else if (typeof val === 'object' && typeof val.toString === 'function') {
    const s = val.toString().trim().replace(/,/g, '');
    num = parseFloat(s);
  } else {
    throw new TypeError(`Unsupported amount type: ${typeof val}`);
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
 * Normalizes timestamp or date to ISO-8601 UTC string.
 * 
 * @param {Date|string|number} val
 * @returns {string} ISO-8601 formatted date string
 */
function normalizeDate(val) {
  if (!val) return '1970-01-01T00:00:00.000Z';
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return String(val);
}

/**
 * Generates a deterministic SHA-256 leaf hash for accounting entities:
 * - Account: ACCOUNT|id|code|currency|normalizeAmount(balance)
 * - Contact: CONTACT|id|code|currency|normalizeAmount(balance)|normalizeAmount(balanceTrl)|normalizeAmount(balanceUsd)
 * - Invoice: INVOICE|id|invoiceNo|type|normalizeAmount(grandTotal)|normalizeAmount(taxTotal)|status|normalizeDate(date)
 * - JournalEntry: JOURNAL|id|entryNo|documentType|normalizeAmount(totalDebit)|normalizeAmount(totalCredit)|normalizeDate(date)
 * - Transaction: TX|id|accountId|type|normalizeAmount(amount)|normalizeDate(date)
 * 
 * @param {string|object} entityTypeOrRecord - Entity type name or record object
 * @param {object} [maybeRecord] - Record object if first arg is entity name
 * @returns {string} 64-character hex SHA-256 hash
 */
function generateLeafHash(entityTypeOrRecord, maybeRecord = null) {
  let entityType;
  let record;

  if (typeof entityTypeOrRecord === 'string') {
    entityType = entityTypeOrRecord.toUpperCase();
    record = maybeRecord || {};
  } else if (typeof entityTypeOrRecord === 'object' && entityTypeOrRecord !== null) {
    record = entityTypeOrRecord;
    entityType = (record.entityType || record._entityType || record.type || 'GENERIC').toUpperCase();
  } else {
    throw new TypeError('Invalid arguments for generateLeafHash');
  }

  let canonicalPayload = '';
  switch (entityType) {
    case 'ACCOUNT':
      canonicalPayload = `ACCOUNT|${record.id || ''}|${record.code || ''}|${record.currency || 'TRY'}|${normalizeAmount(record.balance)}`;
      break;

    case 'CONTACT':
      canonicalPayload = `CONTACT|${record.id || ''}|${record.code || ''}|${record.currency || 'TRY'}|${normalizeAmount(record.balance)}|${normalizeAmount(record.balanceTrl)}|${normalizeAmount(record.balanceUsd)}`;
      break;

    case 'INVOICE':
      canonicalPayload = `INVOICE|${record.id || ''}|${record.invoiceNo || ''}|${record.type || 'SALES'}|${normalizeAmount(record.grandTotal)}|${normalizeAmount(record.taxTotal)}|${record.status || 'ISSUED'}|${normalizeDate(record.date)}`;
      break;

    case 'JOURNAL':
    case 'JOURNALENTRY':
      canonicalPayload = `JOURNAL|${record.id || ''}|${record.entryNo != null ? record.entryNo : ''}|${record.documentType || 'MAHSUP'}|${normalizeAmount(record.totalDebit)}|${normalizeAmount(record.totalCredit)}|${normalizeDate(record.date)}`;
      break;

    case 'TX':
    case 'TRANSACTION':
      canonicalPayload = `TX|${record.id || ''}|${record.accountId || ''}|${record.type || ''}|${normalizeAmount(record.amount)}|${normalizeDate(record.date)}`;
      break;

    default: {
      // Deterministic sorted key-value fallback
      const sortedKeys = Object.keys(record).sort();
      const parts = [entityType];
      for (const k of sortedKeys) {
        if (k.startsWith('_')) continue;
        const v = record[k];
        if (typeof v === 'number' || (v && typeof v.toNumber === 'function')) {
          parts.push(`${k}=${normalizeAmount(v)}`);
        } else if (v instanceof Date) {
          parts.push(`${k}=${normalizeDate(v)}`);
        } else {
          parts.push(`${k}=${String(v != null ? v : '')}`);
        }
      }
      canonicalPayload = parts.join('|');
      break;
    }
  }

  return crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');
}

/**
 * Computes a Merkle Root using the binary Merkle tree reduction algorithm:
 * 1. Hashes or retrieves leaves.
 * 2. Lexicographically sorts all leaf hashes.
 * 3. Pairs adjacent siblings; if odd number of leaves, duplicates the last leaf.
 * 4. Hashes pairs using SHA-256 until a single Merkle Root is obtained.
 * 
 * @param {Array<string|object>} leaves - Array of leaf hashes or record objects
 * @returns {string} 64-character hex Merkle Root
 */
function computeMerkleRoot(leaves) {
  if (!leaves || leaves.length === 0) {
    return EMPTY_MERKLE_ROOT;
  }

  const leafHashes = leaves.map(l => (typeof l === 'string' ? l : generateLeafHash(l)));
  const sorted = [...leafHashes].sort();

  if (sorted.length === 1) {
    return sorted[0];
  }

  let currentLevel = sorted;
  while (currentLevel.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = (i + 1 < currentLevel.length) ? currentLevel[i + 1] : left;
      const combined = crypto.createHash('sha256').update(left + right).digest('hex');
      nextLevel.push(combined);
    }
    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

/**
 * Builds a complete Merkle Tree structure.
 * 
 * @param {Array<string|object>} leaves - Array of leaf hashes or record objects
 * @returns {object} { root, depth, leaves, levels }
 */
function buildMerkleTree(leaves) {
  if (!leaves || leaves.length === 0) {
    return {
      root: EMPTY_MERKLE_ROOT,
      depth: 0,
      leaves: [],
      levels: [[]]
    };
  }

  const leafHashes = leaves.map(l => (typeof l === 'string' ? l : generateLeafHash(l)));
  const sorted = [...leafHashes].sort();

  if (sorted.length === 1) {
    return {
      root: sorted[0],
      depth: 1,
      leaves: sorted,
      levels: [[sorted[0]]]
    };
  }

  const levels = [sorted];
  let currentLevel = sorted;

  while (currentLevel.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = (i + 1 < currentLevel.length) ? currentLevel[i + 1] : left;
      const combined = crypto.createHash('sha256').update(left + right).digest('hex');
      nextLevel.push(combined);
    }
    levels.push(nextLevel);
    currentLevel = nextLevel;
  }

  return {
    root: currentLevel[0],
    depth: levels.length,
    leaves: sorted,
    levels
  };
}

/**
 * Generates an inclusion proof for a target leaf hash.
 * 
 * @param {string} targetLeaf - Hash of the target leaf
 * @param {Array<string>} leaves - All leaf hashes in the tree
 * @returns {Array<object>|null} Proof steps [{ position: 'left'|'right', hash: '...' }]
 */
function generateMerkleProof(targetLeaf, leaves) {
  if (!leaves || leaves.length === 0) return null;
  const sorted = [...leaves].sort();
  let index = sorted.indexOf(targetLeaf);
  if (index === -1) return null;

  const proof = [];
  let currentLevel = sorted;

  while (currentLevel.length > 1) {
    const isRight = index % 2 === 1;
    const siblingIndex = isRight ? index - 1 : (index + 1 < currentLevel.length ? index + 1 : index);

    proof.push({
      position: isRight ? 'left' : 'right',
      hash: currentLevel[siblingIndex]
    });

    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = (i + 1 < currentLevel.length) ? currentLevel[i + 1] : left;
      const combined = crypto.createHash('sha256').update(left + right).digest('hex');
      nextLevel.push(combined);
    }

    index = Math.floor(index / 2);
    currentLevel = nextLevel;
  }

  return proof;
}

/**
 * Verifies a Merkle proof against a root hash.
 * 
 * @param {string} leafHash - Hash of the leaf being verified
 * @param {Array<object|string>} proof - Array of proof steps
 * @param {string} root - Expected Merkle root
 * @returns {boolean} True if leaf inclusion is cryptographically verified
 */
function verifyMerkleProof(leafHash, proof, root) {
  if (!leafHash || !root) return false;
  if (!proof || !Array.isArray(proof) || proof.length === 0) {
    const bufLeaf = Buffer.from(leafHash, 'utf8');
    const bufRoot = Buffer.from(root, 'utf8');
    return bufLeaf.length === bufRoot.length && crypto.timingSafeEqual(bufLeaf, bufRoot);
  }

  let current = leafHash;
  for (const step of proof) {
    if (typeof step === 'object' && step !== null) {
      const sibling = step.hash || step.sibling;
      if (step.position === 'left') {
        current = crypto.createHash('sha256').update(sibling + current).digest('hex');
      } else {
        current = crypto.createHash('sha256').update(current + sibling).digest('hex');
      }
    } else if (typeof step === 'string') {
      current = crypto.createHash('sha256').update(current + step).digest('hex');
    }
  }

  const bufCurrent = Buffer.from(current, 'utf8');
  const bufRoot = Buffer.from(root, 'utf8');
  if (bufCurrent.length !== bufRoot.length) return false;
  return crypto.timingSafeEqual(bufCurrent, bufRoot);
}

/**
 * Derives a 256-bit key buffer using HKDF-SHA256 (RFC 5869) for Merkle root HMAC seals.
 * 
 * @param {string|Buffer} [secret] - Optional secret override
 * @returns {Buffer} 32-byte key buffer
 */
function deriveMerkleSealKey(secret = null) {
  if (secret) {
    if (Buffer.isBuffer(secret) && secret.length === 32) return secret;
    if (typeof secret === 'string' && /^[0-9a-fA-F]{64}$/.test(secret)) return Buffer.from(secret, 'hex');
    const secretBuf = Buffer.isBuffer(secret) ? secret : Buffer.from(String(secret), 'utf8');
    return Buffer.from(crypto.hkdfSync('sha256', secretBuf, HKDF_SALT, HKDF_INFO, 32));
  }

  const envKey = process.env.MERKLE_VAULT_KEY ||
                 process.env.LEDGER_INTEGRITY_KEY ||
                 process.env.FIELD_ENCRYPTION_KEY ||
                 process.env.JWT_SECRET ||
                 DEFAULT_MASTER_SECRET;

  const secretBuf = Buffer.isBuffer(envKey) ? envKey : Buffer.from(String(envKey), 'utf8');
  return Buffer.from(crypto.hkdfSync('sha256', secretBuf, HKDF_SALT, HKDF_INFO, 32));
}

/**
 * Resolves prisma instance and options bag from flexible arguments.
 */
function resolvePrismaAndOptions(prismaOrOptions, maybeOptions) {
  let prisma = null;
  let options = {};

  if (prismaOrOptions && typeof prismaOrOptions === 'object') {
    if (prismaOrOptions.account || prismaOrOptions.transaction || prismaOrOptions.contact) {
      prisma = prismaOrOptions;
      options = maybeOptions || {};
    } else {
      options = prismaOrOptions;
      prisma = options.prisma || null;
    }
  } else if (maybeOptions && typeof maybeOptions === 'object') {
    options = maybeOptions;
    prisma = options.prisma || null;
  }

  return { prisma, options };
}

/**
 * Queries active Prisma accounting entities to construct state records.
 */
async function fetchAccountingStateFromPrisma(prisma) {
  const [accounts, contacts, invoices, journalEntries, transactions] = await Promise.all([
    prisma.account ? prisma.account.findMany({
      select: { id: true, code: true, currency: true, balance: true }
    }).catch(() => []) : [],
    prisma.contact ? prisma.contact.findMany({
      select: { id: true, code: true, currency: true, balance: true, balanceTrl: true, balanceUsd: true }
    }).catch(() => []) : [],
    prisma.invoice ? prisma.invoice.findMany({
      select: { id: true, invoiceNo: true, type: true, grandTotal: true, taxTotal: true, status: true, date: true }
    }).catch(() => []) : [],
    prisma.journalEntry ? prisma.journalEntry.findMany({
      select: { id: true, entryNo: true, documentType: true, totalDebit: true, totalCredit: true, date: true }
    }).catch(() => []) : [],
    prisma.transaction ? prisma.transaction.findMany({
      select: { id: true, accountId: true, type: true, amount: true, date: true }
    }).catch(() => []) : []
  ]);

  return { accounts, contacts, invoices, journalEntries, transactions };
}

/**
 * Enterprise Cryptographic Merkle State Snapshot & Tamper-Proof Audit Vault
 */
class MerkleAuditVault extends EventEmitter {
  constructor(options = {}) {
    super();
    this.journalFilePath = options.journalFilePath || VAULT_JOURNAL_FILE;
    this.stateFilePath = options.stateFilePath || VAULT_STATE_FILE;
    this.sealKey = options.sealKey ? deriveMerkleSealKey(options.sealKey) : deriveMerkleSealKey();
    this.currentHead = null;
    this.inMemorySnapshots = [];
    this.autoLockdownOnMismatch = options.autoLockdownOnMismatch !== false;

    this.ensureDataDirectory();
    this.loadStateFromDisk();
  }

  /**
   * Ensures persistence directory exists on initialization.
   */
  ensureDataDirectory() {
    try {
      const dir = path.dirname(this.stateFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o750 });
      }
    } catch (err) {
      console.error('⚠️ [MERKLE VAULT] Failed to create data directory:', err.message);
    }
  }

  /**
   * Loads the current head state snapshot from disk if present.
   */
  loadStateFromDisk() {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const raw = fs.readFileSync(this.stateFilePath, 'utf8').trim();
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.merkleRoot) {
            this.currentHead = parsed;
            return;
          }
        }
      }

      // Fallback: Recover last line from append-only journal file
      if (fs.existsSync(this.journalFilePath)) {
        const content = fs.readFileSync(this.journalFilePath, 'utf8').trim();
        if (content) {
          const lines = content.split('\n').filter(Boolean);
          if (lines.length > 0) {
            const lastLine = lines[lines.length - 1];
            const parsed = JSON.parse(lastLine);
            if (parsed && parsed.merkleRoot) {
              this.currentHead = parsed;
            }
          }
        }
      }
    } catch (err) {
      console.error('⚠️ [MERKLE VAULT] Error loading state snapshot from disk:', err.message);
    }
  }

  /**
   * Generates HKDF HMAC ledger root seal using server master secret:
   * crypto.createHmac('sha256', sealKey).update(merkleRoot).digest('hex')
   * 
   * @param {string} merkleRoot
   * @param {Buffer} [key]
   * @returns {string} 64-character hex HMAC seal
   */
  sealMerkleRoot(merkleRoot, key = this.sealKey) {
    if (!merkleRoot) throw new TypeError('merkleRoot is required to generate HMAC seal');
    return crypto.createHmac('sha256', key).update(merkleRoot).digest('hex');
  }

  /**
   * Verifies an HMAC seal against a snapshot's Merkle root in constant time.
   * 
   * @param {object} snapshot
   * @param {Buffer} [key]
   * @returns {boolean} True if HMAC seal matches
   */
  verifySnapshotSeal(snapshot, key = this.sealKey) {
    if (!snapshot || !snapshot.merkleRoot || !snapshot.hmacSeal) return false;
    const expectedSeal = this.sealMerkleRoot(snapshot.merkleRoot, key);
    const bufExpected = Buffer.from(expectedSeal, 'utf8');
    const bufActual = Buffer.from(snapshot.hmacSeal, 'utf8');
    if (bufExpected.length !== bufActual.length) return false;
    return crypto.timingSafeEqual(bufExpected, bufActual);
  }

  /**
   * Transforms raw accounting dataset into canonical leaf hashes.
   * 
   * @param {object} data - Object with accounts, contacts, invoices, journalEntries, transactions
   * @returns {Array<string>} Array of leaf hashes
   */
  computeStateLeaves(data = {}) {
    const leaves = [];
    const accounts = Array.isArray(data.accounts) ? data.accounts : [];
    const contacts = Array.isArray(data.contacts) ? data.contacts : [];
    const invoices = Array.isArray(data.invoices) ? data.invoices : [];
    const journalEntries = Array.isArray(data.journalEntries) ? data.journalEntries : [];
    const transactions = Array.isArray(data.transactions) ? data.transactions : [];

    for (const acc of accounts) leaves.push(generateLeafHash('Account', acc));
    for (const cont of contacts) leaves.push(generateLeafHash('Contact', cont));
    for (const inv of invoices) leaves.push(generateLeafHash('Invoice', inv));
    for (const jn of journalEntries) leaves.push(generateLeafHash('JournalEntry', jn));
    for (const tx of transactions) leaves.push(generateLeafHash('Transaction', tx));

    return leaves;
  }

  /**
   * Computes a Merkle Root from accounting data object directly.
   * 
   * @param {object} data
   * @returns {string} Merkle Root
   */
  computeStateMerkleRoot(data = {}) {
    const leaves = this.computeStateLeaves(data);
    return computeMerkleRoot(leaves);
  }

  /**
   * Takes a live or in-memory snapshot, seals it, and appends to disk.
   * 
   * @param {object} [prismaOrOptions]
   * @param {object} [maybeOptions]
   * @returns {Promise<object>} Recorded sealed snapshot
   */
  async takeSnapshot(prismaOrOptions, maybeOptions) {
    const { prisma, options } = resolvePrismaAndOptions(prismaOrOptions, maybeOptions);

    let data;
    if (options.data) {
      data = options.data;
    } else if (options.records) {
      data = options.records;
    } else if (prisma) {
      data = await fetchAccountingStateFromPrisma(prisma);
    } else {
      data = { accounts: [], contacts: [], invoices: [], journalEntries: [], transactions: [] };
    }

    const leaves = this.computeStateLeaves(data);
    const merkleRoot = computeMerkleRoot(leaves);
    const prevSnapshot = this.currentHead;
    const snapshotId = prevSnapshot ? (prevSnapshot.snapshotId + 1) : 1;
    const prevMerkleRoot = prevSnapshot ? prevSnapshot.merkleRoot : EMPTY_MERKLE_ROOT;
    const timestamp = options.timestamp || new Date().toISOString();
    const hmacSeal = this.sealMerkleRoot(merkleRoot);
    const trigger = options.trigger || 'MANUAL_SNAPSHOT';

    const domainCounts = {
      accounts: (data.accounts || []).length,
      contacts: (data.contacts || []).length,
      invoices: (data.invoices || []).length,
      journalEntries: (data.journalEntries || []).length,
      transactions: (data.transactions || []).length
    };

    const snapshot = {
      snapshotId,
      timestamp,
      merkleRoot,
      prevMerkleRoot,
      hmacSeal,
      leafCount: leaves.length,
      domainCounts,
      trigger,
      status: 'SEALED'
    };

    // Persistence 1: Append to immutable forensic log
    try {
      this.ensureDataDirectory();
      fs.appendFileSync(this.journalFilePath, JSON.stringify(snapshot) + '\n', 'utf8');
    } catch (err) {
      console.error('⚠️ [MERKLE VAULT] Failed to append to journal log:', err.message);
    }

    // Persistence 2: Atomic state file rewrite
    try {
      const tmpPath = `${this.stateFilePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`;
      fs.writeFileSync(tmpPath, JSON.stringify(snapshot, null, 2), 'utf8');
      fs.renameSync(tmpPath, this.stateFilePath);
    } catch (err) {
      console.error('⚠️ [MERKLE VAULT] Failed to persist head state:', err.message);
    }

    this.currentHead = snapshot;
    this.inMemorySnapshots.push(snapshot);
    return snapshot;
  }

  // Aliases for seamless integration
  async recordSnapshot(prismaOrOptions, maybeOptions) {
    return this.takeSnapshot(prismaOrOptions, maybeOptions);
  }

  async recordStateSnapshot(prismaOrOptions, maybeOptions) {
    return this.takeSnapshot(prismaOrOptions, maybeOptions);
  }

  /**
   * Verifies the integrity of a snapshot object.
   * 
   * @param {object} snapshot
   * @param {object} [options]
   * @returns {object} { isValid: boolean, ... }
   */
  verifyStateSnapshot(snapshot, options = {}) {
    if (!snapshot || typeof snapshot !== 'object') {
      return { isValid: false, error: 'INVALID_SNAPSHOT_OBJECT' };
    }

    const key = options.sealKey ? deriveMerkleSealKey(options.sealKey) : this.sealKey;
    const isSealValid = this.verifySnapshotSeal(snapshot, key);

    if (!isSealValid) {
      if (options.escalateOnFailure) {
        return this.handleTamperEscalation('HMAC_SEAL_COMPROMISED', {
          snapshotId: snapshot.snapshotId,
          merkleRoot: snapshot.merkleRoot,
          details: 'Snapshot HMAC seal does not match server master key'
        }, options);
      }
      return {
        isValid: false,
        error: 'HMAC_SEAL_COMPROMISED',
        snapshotId: snapshot.snapshotId
      };
    }

    return {
      isValid: true,
      snapshotId: snapshot.snapshotId,
      merkleRoot: snapshot.merkleRoot,
      leafCount: snapshot.leafCount
    };
  }

  /**
   * Verifies current live database / memory state against the recorded snapshot root.
   * If a divergence or seal corruption is detected, instantly escalates to lockdown.
   * 
   * @param {object} [prismaOrOptions]
   * @param {object} [maybeOptions]
   * @returns {Promise<object>} Verification result
   */
  async verifyCurrentState(prismaOrOptions, maybeOptions) {
    const { prisma, options } = resolvePrismaAndOptions(prismaOrOptions, maybeOptions);

    if (!this.currentHead) {
      this.loadStateFromDisk();
    }

    // If still no snapshot exists, auto-initialize if permitted
    if (!this.currentHead) {
      if (options.allowGenesis !== false) {
        await this.takeSnapshot(prisma, { ...options, trigger: 'GENESIS_INITIALIZATION' });
      } else {
        return { isValid: false, error: 'NO_ACTIVE_SNAPSHOT_FOUND' };
      }
    }

    // 1. Verify recorded snapshot HMAC seal
    const isSealValid = this.verifySnapshotSeal(this.currentHead);
    if (!isSealValid) {
      return this.handleTamperEscalation('HMAC_SEAL_COMPROMISED', {
        expectedRoot: this.currentHead.merkleRoot,
        snapshotId: this.currentHead.snapshotId,
        details: 'Recorded snapshot HMAC seal was tampered with on disk'
      }, options);
    }

    // 2. Compute live state Merkle root
    let liveRoot;
    let data = null;

    if (options.overrideRoot) {
      liveRoot = options.overrideRoot;
    } else {
      if (options.tamperedData) {
        data = options.tamperedData;
      } else if (options.data) {
        data = options.data;
      } else if (options.records) {
        data = options.records;
      } else if (prisma) {
        data = await fetchAccountingStateFromPrisma(prisma);
      } else {
        data = { accounts: [], contacts: [], invoices: [], journalEntries: [], transactions: [] };
      }
      liveRoot = this.computeStateMerkleRoot(data);
    }

    // 3. Constant-time comparison
    const bufLive = Buffer.from(liveRoot, 'utf8');
    const bufHead = Buffer.from(this.currentHead.merkleRoot, 'utf8');
    const isMatch = bufLive.length === bufHead.length && crypto.timingSafeEqual(bufLive, bufHead);

    if (!isMatch) {
      return this.handleTamperEscalation('MERKLE_ROOT_MISMATCH', {
        liveRoot,
        expectedRoot: this.currentHead.merkleRoot,
        snapshotId: this.currentHead.snapshotId,
        leafCount: this.currentHead.leafCount,
        details: 'Live cryptographic state root diverged from sealed snapshot'
      }, options);
    }

    return {
      isValid: true,
      merkleRoot: liveRoot,
      snapshotId: this.currentHead.snapshotId,
      leafCount: this.currentHead.leafCount
    };
  }

  // Alias for verifyCurrentState
  async verifyLiveStateIntegrity(prismaOrOptions, maybeOptions) {
    return this.verifyCurrentState(prismaOrOptions, maybeOptions);
  }

  /**
   * Central tamper escalation handler:
   * 1. Instantly emits 'MERKLE_ROOT_MISMATCH'
   * 2. Records critical SIEM security event
   * 3. Dispatches urgent threat alert
   * 4. Calls lockdownManager.activateLockdown
   * 
   * @param {string} reason
   * @param {object} details
   * @param {object} [options]
   * @returns {object} Escalation summary
   */
  handleTamperEscalation(reason, details = {}, options = {}) {
    const eventPayload = {
      eventType: reason,
      timestamp: new Date().toISOString(),
      details
    };

    // 1. Instantly emit MERKLE_ROOT_MISMATCH
    this.emit('MERKLE_ROOT_MISMATCH', eventPayload);

    // 2. Record critical SIEM security audit event
    try {
      if (auditLogger && typeof auditLogger.logSecurityEvent === 'function') {
        auditLogger.logSecurityEvent('MERKLE_ROOT_MISMATCH', {
          severity: 'CRITICAL',
          status: 503,
          details: {
            reason: `MERKLE_ROOT_MISMATCH: ${details.details || 'Cryptographic ledger state divergence detected'}`,
            liveRoot: details.liveRoot,
            expectedRoot: details.expectedRoot,
            snapshotId: details.snapshotId
          }
        });
      }
    } catch (err) {
      console.error('⚠️ [MERKLE VAULT] SIEM audit log failed:', err.message);
    }

    // 3. Dispatch urgent threat alert
    try {
      if (threatAlerter && typeof threatAlerter.dispatchAlert === 'function') {
        threatAlerter.dispatchAlert('MERKLE_ROOT_MISMATCH', {
          severity: 'CRITICAL',
          clientIp: options.clientIp || '127.0.0.1',
          details: {
            reason,
            liveRoot: details.liveRoot,
            expectedRoot: details.expectedRoot,
            snapshotId: details.snapshotId
          }
        });
      }
    } catch (err) {
      console.error('⚠️ [MERKLE VAULT] Threat alert dispatch failed:', err.message);
    }

    // 4. Trigger lockdownManager.activateLockdown
    let lockdownResult = null;
    if (this.autoLockdownOnMismatch && lockdownManager && typeof lockdownManager.activateLockdown === 'function') {
      try {
        lockdownResult = lockdownManager.activateLockdown({
          initiatedBy: 'MERKLE_VAULT_SENTINEL',
          reason: 'MERKLE_ROOT_MISMATCH'
        });
      } catch (err) {
        console.error('⚠️ [MERKLE VAULT] Lockdown activation failed:', err.message);
      }
    }

    return {
      isValid: false,
      error: reason,
      lockdownTriggered: Boolean(lockdownResult && lockdownResult.isLocked),
      liveRoot: details.liveRoot,
      expectedRoot: details.expectedRoot,
      details
    };
  }

  /**
   * Simulates a rogue record mutation to verify tamper detection and lockdown escalation.
   * 
   * @param {object} tamperedData
   * @param {object} [options]
   * @returns {Promise<object>} Escalation response
   */
  async simulateTamper(tamperedData, options = {}) {
    return this.verifyCurrentState({
      ...options,
      tamperedData
    });
  }

  /**
   * Reads the append-only forensic audit log.
   * 
   * @param {number} [limit=100]
   * @returns {Array<object>} Recent snapshot records
   */
  getAuditHistory(limit = 100) {
    try {
      if (!fs.existsSync(this.journalFilePath)) return [];
      const content = fs.readFileSync(this.journalFilePath, 'utf8').trim();
      if (!content) return [];
      const lines = content.split('\n').filter(Boolean);
      const selected = lines.slice(-limit);
      return selected.map(line => {
        try { return JSON.parse(line); } catch (_) { return null; }
      }).filter(Boolean);
    } catch (err) {
      console.error('⚠️ [MERKLE VAULT] Error reading audit history:', err.message);
      return [];
    }
  }

  getAuditJournal(limit = 100) {
    return this.getAuditHistory(limit);
  }

  /**
   * Resets test files and internal state for automated test isolation.
   * 
   * @param {object} [options]
   */
  resetForTesting(options = {}) {
    this.currentHead = null;
    this.inMemorySnapshots = [];

    if (options.deleteFiles !== false) {
      try {
        if (fs.existsSync(this.journalFilePath)) fs.unlinkSync(this.journalFilePath);
        if (fs.existsSync(this.stateFilePath)) fs.unlinkSync(this.stateFilePath);
      } catch (_) {}
    }

    if (options.restoreLockdown && lockdownManager && lockdownManager.state && lockdownManager.state.isLocked) {
      try {
        lockdownManager.state.isLocked = false;
        lockdownManager.state.lockedAt = null;
        lockdownManager.state.lockedBy = null;
        lockdownManager.state.reason = null;
        lockdownManager.state.tokenRevocationEpoch = 0;
        lockdownManager.saveToDisk();
      } catch (_) {}
    }
  }
}

// Singleton instance
const merkleVault = new MerkleAuditVault();

// Export clean class, helper functions, and singleton instance
module.exports = merkleVault;
module.exports.merkleVault = merkleVault;
module.exports.MerkleAuditVault = MerkleAuditVault;
module.exports.computeMerkleRoot = computeMerkleRoot;
module.exports.generateLeafHash = generateLeafHash;
module.exports.hashLeaf = generateLeafHash;
module.exports.verifyMerkleProof = verifyMerkleProof;
module.exports.buildMerkleTree = buildMerkleTree;
module.exports.generateMerkleProof = generateMerkleProof;
module.exports.normalizeAmount = normalizeAmount;
module.exports.normalizeDate = normalizeDate;
module.exports.deriveMerkleSealKey = deriveMerkleSealKey;
module.exports.EMPTY_MERKLE_ROOT = EMPTY_MERKLE_ROOT;
