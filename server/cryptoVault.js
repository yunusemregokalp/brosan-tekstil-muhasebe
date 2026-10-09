/**
 * BROSAN TEKSTİL ERP — MILITARY-GRADE AES-256-GCM FIELD-LEVEL CRYPTO VAULT
 * 
 * Cryptographic Architecture:
 * - Cipher: AES-256-GCM (Authenticated Encryption with Associated Data - AEAD)
 * - Key Size: 256 bits (32 bytes)
 * - IV: 96 bits (12 bytes) cryptographically random per operation (NIST SP 800-38D)
 * - Auth Tag: 128 bits (16 bytes) authenticated integrity tag
 * - Format: enc:v1:<base64(iv)>:<base64(authTag)>:<base64(ciphertext)>
 * - Key Derivation: FIELD_ENCRYPTION_KEY or HKDF-SHA256 (RFC 5869) from JWT_SECRET
 * - Tamper Defense: Immediate CryptographicIntegrityError on any bit-flip or altered tag
 * - Backward Compatibility: Seamless passthrough for unencrypted legacy / seed data
 * - Idempotency: Encryption of already encrypted value is a safe no-op
 * - Prisma Extension: Transparent encryption on mutation and decryption on retrieval
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96-bit IV per NIST SP 800-38D
const AUTH_TAG_LENGTH_BYTES = 16; // 128-bit Auth Tag
const CIPHER_PREFIX = 'enc:v1';
const HKDF_SALT = Buffer.from('BrosanCitadelFieldCryptoSalt2026', 'utf8');
const HKDF_INFO = Buffer.from('brosan-erp-aes-256-gcm-field-vault', 'utf8');

class CryptographicIntegrityError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CryptographicIntegrityError';
    this.code = 'CRYPTO_INTEGRITY_FAILURE';
  }
}

/**
 * Zeroize memory buffer in place (Phase 8 Zero-Knowledge Memory Cleansing)
 * Overwrites buffer bytes with zeros to protect against heap dumps and cold-boot extraction.
 * @param {Buffer|Uint8Array} buf
 */
function zeroizeBuffer(buf) {
  if (Buffer.isBuffer(buf)) {
    buf.fill(0);
  } else if (buf && typeof buf.fill === 'function') {
    buf.fill(0);
  }
}

/**
 * Zeroizes multiple buffers safely.
 * @param {...(Buffer|Uint8Array|null|undefined)} buffers
 */
function zeroizeAll(...buffers) {
  for (const buf of buffers) {
    if (buf) {
      zeroizeBuffer(buf);
    }
  }
}

/**
 * Derives a 256-bit key buffer from a secret using HKDF-SHA256 (RFC 5869)
 * @param {string|Buffer} secret 
 * @param {Buffer} [salt=HKDF_SALT] 
 * @param {Buffer} [info=HKDF_INFO] 
 * @returns {Buffer} 32-byte key buffer
 */
function deriveKey(secret, salt = HKDF_SALT, info = HKDF_INFO) {
  const isTempBuf = !Buffer.isBuffer(secret);
  const secretBuf = isTempBuf ? Buffer.from(String(secret), 'utf8') : secret;
  try {
    return Buffer.from(crypto.hkdfSync('sha256', secretBuf, salt, info, 32));
  } finally {
    if (isTempBuf) {
      zeroizeBuffer(secretBuf);
    }
  }
}

/**
 * 256-Bit Master Runtime Key Resolver
 * Priority Ladder:
 * 1. process.env.FIELD_ENCRYPTION_KEY (hex 64, base64 32B, raw 32B, or HKDF derived)
 * 2. process.env.JWT_SECRET derived via HKDF-SHA256
 * 3. High-entropy enterprise fallback derived via HKDF-SHA256
 * @returns {Buffer} 32-byte key buffer
 */
function resolveMasterKey() {
  const envKey = process.env.FIELD_ENCRYPTION_KEY;
  if (envKey) {
    if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
      return Buffer.from(envKey, 'hex');
    }
    const b64Buf = Buffer.from(envKey, 'base64');
    if (b64Buf.length === 32) {
      return b64Buf;
    }
    const rawBuf = Buffer.from(envKey, 'utf8');
    if (rawBuf.length === 32) {
      return rawBuf;
    }
    return deriveKey(envKey);
  }

  const jwtSecret = process.env.JWT_SECRET || 'BrosanTekstil2026EnterpriseSuperSecretSecurityKey!@#$987654321';
  return deriveKey(jwtSecret);
}

let activeKeyBuffer = resolveMasterKey();

/**
 * Override active runtime key (primarily for unit tests and key rotation)
 * Zeroizes the previous activeKeyBuffer before updating reference.
 * @param {Buffer|string} key
 */
function setMasterKey(key) {
  let buf = key;
  if (typeof key === 'string') {
    if (/^[0-9a-fA-F]{64}$/.test(key)) {
      buf = Buffer.from(key, 'hex');
    } else {
      const b64 = Buffer.from(key, 'base64');
      buf = b64.length === 32 ? b64 : Buffer.from(key, 'utf8');
    }
  }
  if (!Buffer.isBuffer(buf) || buf.length !== 32) {
    throw new Error('Master encryption key must be or resolve to a 32-byte Buffer.');
  }
  if (activeKeyBuffer && activeKeyBuffer !== buf) {
    zeroizeBuffer(activeKeyBuffer);
  }
  activeKeyBuffer = buf;
  return activeKeyBuffer;
}

/**
 * Get the currently active master encryption key buffer
 * @returns {Buffer}
 */
function getMasterKey() {
  return activeKeyBuffer;
}

/**
 * Reset master encryption key back to environment resolution
 * Zeroizes previous activeKeyBuffer before re-resolving.
 */
function resetMasterKey() {
  const newKey = resolveMasterKey();
  if (activeKeyBuffer && activeKeyBuffer !== newKey) {
    zeroizeBuffer(activeKeyBuffer);
  }
  activeKeyBuffer = newKey;
  return activeKeyBuffer;
}

/**
 * Check if a string is already encrypted in enc:v1 format
 * @param {any} value 
 * @returns {boolean}
 */
function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(`${CIPHER_PREFIX}:`);
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Format: enc:v1:<base64(iv)>:<base64(authTag)>:<base64(ciphertext)>
 * 
 * @param {string|null|undefined} plaintext 
 * @param {string|Buffer|null} [aad=null] Optional Additional Authenticated Data
 * @returns {string|null|undefined}
 */
function encrypt(plaintext, aad = null) {
  if (plaintext === null || plaintext === undefined) {
    return plaintext;
  }
  const textStr = String(plaintext);
  if (isEncrypted(textStr)) {
    return textStr; // Idempotent: prevent double-encryption
  }

  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, activeKeyBuffer, iv);

  if (aad != null) {
    cipher.setAAD(Buffer.isBuffer(aad) ? aad : Buffer.from(String(aad), 'utf8'));
  }

  const encPart1 = cipher.update(textStr, 'utf8');
  const encPart2 = cipher.final();
  const encryptedBuf = encPart2.length > 0 ? Buffer.concat([encPart1, encPart2]) : encPart1;

  const authTag = cipher.getAuthTag();

  return [
    CIPHER_PREFIX,
    iv.toString('base64'),
    authTag.toString('base64'),
    encryptedBuf.toString('base64')
  ].join(':');
}

/**
 * Decrypt a ciphertext string using AES-256-GCM
 * Backward compatibility: unencrypted plaintext passes through untouched.
 * 
 * @param {string|null|undefined} ciphertext 
 * @param {string|Buffer|null} [aad=null] Optional Additional Authenticated Data
 * @returns {string|null|undefined}
 * @throws {CryptographicIntegrityError} If ciphertext or tag has been tampered with
 */
function decrypt(ciphertext, aad = null) {
  if (ciphertext === null || ciphertext === undefined) {
    return ciphertext;
  }
  if (typeof ciphertext !== 'string') {
    return ciphertext;
  }
  // Backward compatibility: unencrypted legacy / seed data passes through untouched
  if (!isEncrypted(ciphertext)) {
    return ciphertext;
  }

  let iv = null;
  let authTag = null;
  let encryptedBuf = null;
  let decPart1 = null;
  let decPart2 = null;
  let decryptedBuf = null;

  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 5 || parts[0] !== 'enc' || parts[1] !== 'v1') {
      throw new CryptographicIntegrityError('Malformed ciphertext format: expected enc:v1:<iv>:<tag>:<ciphertext>.');
    }

    iv = Buffer.from(parts[2], 'base64');
    authTag = Buffer.from(parts[3], 'base64');
    encryptedBuf = Buffer.from(parts[4], 'base64');

    if (iv.length !== IV_LENGTH_BYTES) {
      throw new CryptographicIntegrityError(`Invalid IV length: expected ${IV_LENGTH_BYTES} bytes, got ${iv.length}.`);
    }
    if (authTag.length !== AUTH_TAG_LENGTH_BYTES) {
      throw new CryptographicIntegrityError(`Invalid Authentication Tag length: expected ${AUTH_TAG_LENGTH_BYTES} bytes, got ${authTag.length}.`);
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, activeKeyBuffer, iv);
    decipher.setAuthTag(authTag);

    if (aad != null) {
      decipher.setAAD(Buffer.isBuffer(aad) ? aad : Buffer.from(String(aad), 'utf8'));
    }

    decPart1 = decipher.update(encryptedBuf);
    decPart2 = decipher.final();
    decryptedBuf = decPart2.length > 0 ? Buffer.concat([decPart1, decPart2]) : decPart1;
    const plaintext = decryptedBuf.toString('utf8');

    return plaintext;
  } catch (err) {
    if (err instanceof CryptographicIntegrityError) {
      throw err;
    }
    throw new CryptographicIntegrityError(
      `Cryptographic integrity verification failed: ciphertext tampered, invalid authentication tag, or incorrect key (${err.message}).`
    );
  } finally {
    zeroizeAll(iv, authTag, encryptedBuf, decPart1, decPart2, decryptedBuf);
  }
}

/**
 * Zero-Knowledge Buffer Consumer (Phase 8 Ephemeral RAM Scrubbing)
 * Decrypts ciphertext and invokes callback directly with decrypted Buffer.
 * Guarantees zeroization of all intermediate buffers upon callback completion or failure,
 * preventing plaintext strings from lingering in V8 garbage collection pages.
 *
 * @param {string|null|undefined} ciphertext
 * @param {Function} callback (decryptedBuffer) => any
 * @param {string|Buffer|null} [aad=null]
 * @returns {any} Result of callback
 */
function withDecryptedBuffer(ciphertext, callback, aad = null) {
  if (typeof callback !== 'function') {
    throw new TypeError('withDecryptedBuffer requires a callback function.');
  }
  if (ciphertext === null || ciphertext === undefined) {
    return callback(ciphertext);
  }
  if (typeof ciphertext !== 'string') {
    return callback(ciphertext);
  }
  if (!isEncrypted(ciphertext)) {
    const rawBuf = Buffer.from(ciphertext, 'utf8');
    try {
      return callback(rawBuf);
    } finally {
      zeroizeBuffer(rawBuf);
    }
  }

  let iv = null;
  let authTag = null;
  let encryptedBuf = null;
  let decPart1 = null;
  let decPart2 = null;
  let decryptedBuf = null;

  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 5 || parts[0] !== 'enc' || parts[1] !== 'v1') {
      throw new CryptographicIntegrityError('Malformed ciphertext format: expected enc:v1:<iv>:<tag>:<ciphertext>.');
    }

    iv = Buffer.from(parts[2], 'base64');
    authTag = Buffer.from(parts[3], 'base64');
    encryptedBuf = Buffer.from(parts[4], 'base64');

    if (iv.length !== IV_LENGTH_BYTES) {
      throw new CryptographicIntegrityError(`Invalid IV length: expected ${IV_LENGTH_BYTES} bytes, got ${iv.length}.`);
    }
    if (authTag.length !== AUTH_TAG_LENGTH_BYTES) {
      throw new CryptographicIntegrityError(`Invalid Authentication Tag length: expected ${AUTH_TAG_LENGTH_BYTES} bytes, got ${authTag.length}.`);
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, activeKeyBuffer, iv);
    decipher.setAuthTag(authTag);

    if (aad != null) {
      decipher.setAAD(Buffer.isBuffer(aad) ? aad : Buffer.from(String(aad), 'utf8'));
    }

    decPart1 = decipher.update(encryptedBuf);
    decPart2 = decipher.final();
    decryptedBuf = decPart2.length > 0 ? Buffer.concat([decPart1, decPart2]) : decPart1;

    return callback(decryptedBuf);
  } catch (err) {
    if (err instanceof CryptographicIntegrityError) {
      throw err;
    }
    throw new CryptographicIntegrityError(
      `Cryptographic integrity verification failed: ciphertext tampered, invalid authentication tag, or incorrect key (${err.message}).`
    );
  } finally {
    zeroizeAll(iv, authTag, encryptedBuf, decPart1, decPart2, decryptedBuf);
  }
}

/**
 * Data Masking Helpers for Display (Banking & Tax IDs)
 */
function maskIban(iban) {
  if (!iban || typeof iban !== 'string') return iban;
  const clean = iban.replace(/\s+/g, '');
  if (clean.length < 8) return '****';
  return `${clean.slice(0, 4)} **** **** **** **** ${clean.slice(-4)}`;
}

function maskTaxNumber(taxNumber) {
  if (!taxNumber || typeof taxNumber !== 'string') return taxNumber;
  if (taxNumber.length < 6) return '****';
  return `${taxNumber.slice(0, 3)}****${taxNumber.slice(-4)}`;
}

/**
 * Model-Level Record Mappers
 */
function encryptAccount(account) {
  if (!account || typeof account !== 'object') return account;
  const cloned = { ...account };
  if (cloned.iban !== undefined && cloned.iban !== null) {
    cloned.iban = encrypt(cloned.iban);
  }
  if (cloned.accountNo !== undefined && cloned.accountNo !== null) {
    cloned.accountNo = encrypt(cloned.accountNo);
  }
  return cloned;
}

function decryptAccount(account) {
  if (!account || typeof account !== 'object') return account;
  const cloned = { ...account };
  if (cloned.iban !== undefined && cloned.iban !== null) {
    cloned.iban = decrypt(cloned.iban);
  }
  if (cloned.accountNo !== undefined && cloned.accountNo !== null) {
    cloned.accountNo = decrypt(cloned.accountNo);
  }
  return cloned;
}

function encryptContact(contact) {
  if (!contact || typeof contact !== 'object') return contact;
  const cloned = { ...contact };
  if (cloned.taxNumber !== undefined && cloned.taxNumber !== null) {
    cloned.taxNumber = encrypt(cloned.taxNumber);
  }
  return cloned;
}

function decryptContact(contact) {
  if (!contact || typeof contact !== 'object') return contact;
  const cloned = { ...contact };
  if (cloned.taxNumber !== undefined && cloned.taxNumber !== null) {
    cloned.taxNumber = decrypt(cloned.taxNumber);
  }
  return cloned;
}

function encryptEmployee(emp) {
  if (!emp || typeof emp !== 'object') return emp;
  const cloned = { ...emp };
  if (cloned.iban !== undefined && cloned.iban !== null) {
    cloned.iban = encrypt(cloned.iban);
  }
  return cloned;
}

function decryptEmployee(emp) {
  if (!emp || typeof emp !== 'object') return emp;
  const cloned = { ...emp };
  if (cloned.iban !== undefined && cloned.iban !== null) {
    cloned.iban = decrypt(cloned.iban);
  }
  return cloned;
}

function encryptSubcontractReconciliation(sub) {
  if (!sub || typeof sub !== 'object') return sub;
  const cloned = { ...sub };
  if (cloned.tckn !== undefined && cloned.tckn !== null) {
    cloned.tckn = encrypt(cloned.tckn);
  }
  return cloned;
}

function decryptSubcontractReconciliation(sub) {
  if (!sub || typeof sub !== 'object') return sub;
  const cloned = { ...sub };
  if (cloned.tckn !== undefined && cloned.tckn !== null) {
    cloned.tckn = decrypt(cloned.tckn);
  }
  return cloned;
}

/**
 * Transparent Prisma Client Extension
 * Intercepts account, contact, employee, and subcontractReconciliation queries
 * to encrypt sensitive fields on write and decrypt on read.
 * 
 * @param {object} prismaClient 
 * @returns {object} Extended Prisma client
 */
function withCryptoVault(prismaClient) {
  if (!prismaClient || typeof prismaClient.$extends !== 'function') {
    return prismaClient;
  }

  return prismaClient.$extends({
    name: 'cryptoVaultExtension',
    query: {
      account: {
        async create({ args, query }) {
          if (args && args.data) args.data = encryptAccount(args.data);
          const result = await query(args);
          return result ? decryptAccount(result) : result;
        },
        async createMany({ args, query }) {
          if (args && args.data) {
            args.data = Array.isArray(args.data) ? args.data.map(encryptAccount) : encryptAccount(args.data);
          }
          return query(args);
        },
        async update({ args, query }) {
          if (args && args.data) args.data = encryptAccount(args.data);
          const result = await query(args);
          return result ? decryptAccount(result) : result;
        },
        async updateMany({ args, query }) {
          if (args && args.data) args.data = encryptAccount(args.data);
          return query(args);
        },
        async upsert({ args, query }) {
          if (args) {
            if (args.create) args.create = encryptAccount(args.create);
            if (args.update) args.update = encryptAccount(args.update);
          }
          const result = await query(args);
          return result ? decryptAccount(result) : result;
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          return result ? decryptAccount(result) : result;
        },
        async findUniqueOrThrow({ args, query }) {
          const result = await query(args);
          return result ? decryptAccount(result) : result;
        },
        async findFirst({ args, query }) {
          const result = await query(args);
          return result ? decryptAccount(result) : result;
        },
        async findFirstOrThrow({ args, query }) {
          const result = await query(args);
          return result ? decryptAccount(result) : result;
        },
        async findMany({ args, query }) {
          const results = await query(args);
          return Array.isArray(results) ? results.map(decryptAccount) : results;
        }
      },
      contact: {
        async create({ args, query }) {
          if (args && args.data) args.data = encryptContact(args.data);
          const result = await query(args);
          return result ? decryptContact(result) : result;
        },
        async createMany({ args, query }) {
          if (args && args.data) {
            args.data = Array.isArray(args.data) ? args.data.map(encryptContact) : encryptContact(args.data);
          }
          return query(args);
        },
        async update({ args, query }) {
          if (args && args.data) args.data = encryptContact(args.data);
          const result = await query(args);
          return result ? decryptContact(result) : result;
        },
        async updateMany({ args, query }) {
          if (args && args.data) args.data = encryptContact(args.data);
          return query(args);
        },
        async upsert({ args, query }) {
          if (args) {
            if (args.create) args.create = encryptContact(args.create);
            if (args.update) args.update = encryptContact(args.update);
          }
          const result = await query(args);
          return result ? decryptContact(result) : result;
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          return result ? decryptContact(result) : result;
        },
        async findUniqueOrThrow({ args, query }) {
          const result = await query(args);
          return result ? decryptContact(result) : result;
        },
        async findFirst({ args, query }) {
          const result = await query(args);
          return result ? decryptContact(result) : result;
        },
        async findFirstOrThrow({ args, query }) {
          const result = await query(args);
          return result ? decryptContact(result) : result;
        },
        async findMany({ args, query }) {
          const results = await query(args);
          return Array.isArray(results) ? results.map(decryptContact) : results;
        }
      },
      employee: {
        async create({ args, query }) {
          if (args && args.data) args.data = encryptEmployee(args.data);
          const result = await query(args);
          return result ? decryptEmployee(result) : result;
        },
        async createMany({ args, query }) {
          if (args && args.data) {
            args.data = Array.isArray(args.data) ? args.data.map(encryptEmployee) : encryptEmployee(args.data);
          }
          return query(args);
        },
        async update({ args, query }) {
          if (args && args.data) args.data = encryptEmployee(args.data);
          const result = await query(args);
          return result ? decryptEmployee(result) : result;
        },
        async updateMany({ args, query }) {
          if (args && args.data) args.data = encryptEmployee(args.data);
          return query(args);
        },
        async upsert({ args, query }) {
          if (args) {
            if (args.create) args.create = encryptEmployee(args.create);
            if (args.update) args.update = encryptEmployee(args.update);
          }
          const result = await query(args);
          return result ? decryptEmployee(result) : result;
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          return result ? decryptEmployee(result) : result;
        },
        async findUniqueOrThrow({ args, query }) {
          const result = await query(args);
          return result ? decryptEmployee(result) : result;
        },
        async findFirst({ args, query }) {
          const result = await query(args);
          return result ? decryptEmployee(result) : result;
        },
        async findFirstOrThrow({ args, query }) {
          const result = await query(args);
          return result ? decryptEmployee(result) : result;
        },
        async findMany({ args, query }) {
          const results = await query(args);
          return Array.isArray(results) ? results.map(decryptEmployee) : results;
        }
      },
      subcontractReconciliation: {
        async create({ args, query }) {
          if (args && args.data) args.data = encryptSubcontractReconciliation(args.data);
          const result = await query(args);
          return result ? decryptSubcontractReconciliation(result) : result;
        },
        async update({ args, query }) {
          if (args && args.data) args.data = encryptSubcontractReconciliation(args.data);
          const result = await query(args);
          return result ? decryptSubcontractReconciliation(result) : result;
        },
        async upsert({ args, query }) {
          if (args) {
            if (args.create) args.create = encryptSubcontractReconciliation(args.create);
            if (args.update) args.update = encryptSubcontractReconciliation(args.update);
          }
          const result = await query(args);
          return result ? decryptSubcontractReconciliation(result) : result;
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          return result ? decryptSubcontractReconciliation(result) : result;
        },
        async findFirst({ args, query }) {
          const result = await query(args);
          return result ? decryptSubcontractReconciliation(result) : result;
        },
        async findMany({ args, query }) {
          const results = await query(args);
          return Array.isArray(results) ? results.map(decryptSubcontractReconciliation) : results;
        }
      }
    }
  });
}

/**
 * Cryptographic Self-Test on Module Load
 */
function selfTest() {
  const sample = 'TR160006200041700006289477';
  const enc = encrypt(sample);
  if (!isEncrypted(enc)) {
    throw new Error('Crypto self-test failed: generated ciphertext does not match enc:v1 prefix.');
  }
  const dec = decrypt(enc);
  if (dec !== sample) {
    throw new Error('Crypto self-test failed: decrypted value mismatch.');
  }
  return true;
}

// Execute self-test on module initialization
selfTest();

module.exports = {
  ALGORITHM,
  IV_LENGTH_BYTES,
  AUTH_TAG_LENGTH_BYTES,
  CIPHER_PREFIX,
  CryptographicIntegrityError,
  deriveKey,
  resolveMasterKey,
  setMasterKey,
  getMasterKey,
  resetMasterKey,
  isEncrypted,
  encrypt,
  decrypt,
  zeroizeBuffer,
  zeroizeAll,
  withDecryptedBuffer,
  maskIban,
  maskTaxNumber,
  encryptAccount,
  decryptAccount,
  encryptContact,
  decryptContact,
  encryptEmployee,
  decryptEmployee,
  encryptSubcontractReconciliation,
  decryptSubcontractReconciliation,
  withCryptoVault,
  selfTest
};
