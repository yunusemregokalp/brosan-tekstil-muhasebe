/**
 * BROSAN TEKSTİL ERP — CITADEL PHASE 3: AES-256-GCM FIELD CRYPTO VAULT UNIT SUITE
 * 
 * Comprehensive 10-Vector Cryptographic Test Harness:
 * Vector 1: Authentic Turkish Banking & Tax PII Encryption / Decryption Roundtrip
 * Vector 2: Strict NIST SP 800-38D Format & Payload Structure Validation
 * Vector 3: Semantic Security & IV Randomness Uniqueness (50 Iterations Distinct)
 * Vector 4: Tampered Ciphertext Bit-Flip Rejection (CryptographicIntegrityError)
 * Vector 5: Tampered Authentication Tag Rejection (CryptographicIntegrityError)
 * Vector 6: Tampered Initialization Vector (IV) Rejection (CryptographicIntegrityError)
 * Vector 7: Backward Compatibility & Plaintext Passthrough (Legacy Data)
 * Vector 8: Key Derivation & HKDF-SHA256 Cryptographic Separation
 * Vector 9: Idempotent Encryption & Re-Encryption Resistance
 * Vector 10: High-Throughput Performance Benchmark (>1,000 cycles in <50ms)
 * Vector 11: Model Record Mappers & Display Masking Helpers
 * Vector 12: Transparent Prisma Extension Integration (withCryptoVault)
 */

const crypto = require('crypto');
const cryptoVault = require('../server/cryptoVault');
const {
  encrypt,
  decrypt,
  isEncrypted,
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
  setMasterKey,
  getMasterKey,
  resetMasterKey,
  deriveKey,
  CryptographicIntegrityError
} = cryptoVault;

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (!condition) {
    totalFailed++;
    console.error(`  ${colors.red}✖ FAIL:${colors.reset} ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  totalPassed++;
  console.log(`  ${colors.green}✔ PASS:${colors.reset} ${message}`);
}

async function runTestSuite() {
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}🔐 CITADEL SECURITY: AES-256-GCM FIELD-LEVEL CRYPTO VAULT UNIT SUITE${colors.reset}`);
  console.log(`${colors.dim}Testing AEAD cryptography, tamper rejection, backward compatibility & throughput...${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  // ==============================================================================
  // VECTOR 1: PII ENCRYPTION / DECRYPTION ROUNDTRIP
  // ==============================================================================
  console.log(`${colors.bold}[VECTOR 1] Authentic Banking & Tax PII Roundtrip Verification${colors.reset}`);
  {
    const sampleIban = 'TR160006200041700006289477';
    const sampleAccountNo = '417-6289477';
    const sampleVkn = '8441212524';
    const sampleTckn = '46849262292';
    const sampleForeignTax = 'DE301948271';

    const encIban = encrypt(sampleIban);
    assert(isEncrypted(encIban), 'IBAN ciphertext is recognized as encrypted (enc:v1:*)');
    assert(encIban !== sampleIban, 'IBAN ciphertext is strictly not equal to plaintext');
    assert(decrypt(encIban) === sampleIban, 'Decrypted IBAN perfectly matches original plaintext');

    const encAccNo = encrypt(sampleAccountNo);
    assert(decrypt(encAccNo) === sampleAccountNo, 'Decrypted Account No matches original plaintext');

    const encVkn = encrypt(sampleVkn);
    assert(decrypt(encVkn) === sampleVkn, 'Decrypted corporate VKN matches original plaintext');

    const encTckn = encrypt(sampleTckn);
    assert(decrypt(encTckn) === sampleTckn, 'Decrypted citizen TCKN matches original plaintext');

    const encForeign = encrypt(sampleForeignTax);
    assert(decrypt(encForeign) === sampleForeignTax, 'Decrypted foreign tax ID matches original plaintext');

    // Test with AAD (Additional Authenticated Data)
    const aadContext = 'tenant:brosan:account:1';
    const encWithAad = encrypt(sampleIban, aadContext);
    assert(decrypt(encWithAad, aadContext) === sampleIban, 'Decryption succeeds with matching AAD');

    let aadFailed = false;
    try {
      decrypt(encWithAad, 'tenant:attacker:account:99');
    } catch (err) {
      aadFailed = err instanceof CryptographicIntegrityError;
    }
    assert(aadFailed, 'Decryption strictly fails and throws CryptographicIntegrityError on AAD mismatch');
  }

  // ==============================================================================
  // VECTOR 2: STRICT NIST SP 800-38D FORMAT & STRUCTURE VALIDATION
  // ==============================================================================
  console.log(`\n${colors.bold}[VECTOR 2] NIST SP 800-38D Format & Structure Compliance${colors.reset}`);
  {
    const sample = 'TR840006200041700006287865';
    const cipher = encrypt(sample);
    const parts = cipher.split(':');

    assert(parts.length === 5, 'Ciphertext has exactly 5 colon-delimited segments');
    assert(parts[0] === 'enc' && parts[1] === 'v1', 'Format starts with "enc:v1" version header');

    const ivBuf = Buffer.from(parts[2], 'base64');
    assert(ivBuf.length === 12, `IV length is exactly 12 bytes (96 bits), got ${ivBuf.length}`);

    const tagBuf = Buffer.from(parts[3], 'base64');
    assert(tagBuf.length === 16, `Auth Tag length is exactly 16 bytes (128 bits), got ${tagBuf.length}`);

    const ctBuf = Buffer.from(parts[4], 'base64');
    assert(ctBuf.length === Buffer.from(sample, 'utf8').length, 'Ciphertext length equals plaintext byte length (GCM stream property)');
  }

  // ==============================================================================
  // VECTOR 3: SEMANTIC SECURITY & IV RANDOMNESS UNIQUENESS (IND-CPA)
  // ==============================================================================
  console.log(`\n${colors.bold}[VECTOR 3] Semantic Security & IV Uniqueness (50 Iterations Distinct)${colors.reset}`);
  {
    const plaintext = '46849262292';
    const ciphertexts = new Set();
    const ivs = new Set();
    const ITERATIONS = 50;

    for (let i = 0; i < ITERATIONS; i++) {
      const c = encrypt(plaintext);
      ciphertexts.add(c);
      const parts = c.split(':');
      ivs.add(parts[2]);
      assert(decrypt(c) === plaintext, `Decryption succeeds for iteration ${i + 1}`);
    }

    assert(ciphertexts.size === ITERATIONS, `50 encryptions produced 50 mutually distinct ciphertexts (size: ${ciphertexts.size})`);
    assert(ivs.size === ITERATIONS, `50 encryptions generated 50 mutually distinct 96-bit random IVs (size: ${ivs.size})`);
  }

  // ==============================================================================
  // VECTOR 4: TAMPERED CIPHERTEXT REJECTION
  // ==============================================================================
  console.log(`\n${colors.bold}[VECTOR 4] Tampered Ciphertext Bit-Flip Rejection${colors.reset}`);
  {
    const sample = 'TR160006200041700006289477';
    const cipher = encrypt(sample);
    const parts = cipher.split(':');

    // Corrupt ciphertext buffer
    const ctBuf = Buffer.from(parts[4], 'base64');
    ctBuf[0] ^= 0x01; // Flip 1 bit
    const corruptedCipher = [parts[0], parts[1], parts[2], parts[3], ctBuf.toString('base64')].join(':');

    let threwExpected = false;
    let thrownError = null;
    try {
      decrypt(corruptedCipher);
    } catch (err) {
      threwExpected = err instanceof CryptographicIntegrityError;
      thrownError = err;
    }

    assert(threwExpected, 'Bit-flipped ciphertext immediately throws CryptographicIntegrityError');
    assert(thrownError && thrownError.code === 'CRYPTO_INTEGRITY_FAILURE', 'Error code is strictly CRYPTO_INTEGRITY_FAILURE');

    // Truncated ciphertext
    const truncatedCipher = [parts[0], parts[1], parts[2], parts[3], ctBuf.subarray(0, 5).toString('base64')].join(':');
    let truncatedThrew = false;
    try {
      decrypt(truncatedCipher);
    } catch (err) {
      truncatedThrew = err instanceof CryptographicIntegrityError;
    }
    assert(truncatedThrew, 'Truncated ciphertext immediately throws CryptographicIntegrityError');
  }

  // ==============================================================================
  // VECTOR 5: TAMPERED AUTHENTICATION TAG REJECTION
  // ==============================================================================
  console.log(`\n${colors.bold}[VECTOR 5] Tampered Authentication Tag Rejection${colors.reset}`);
  {
    const sample = 'TR160006200041700006289477';
    const cipher = encrypt(sample);
    const parts = cipher.split(':');

    // Corrupt auth tag buffer
    const tagBuf = Buffer.from(parts[3], 'base64');
    tagBuf[tagBuf.length - 1] ^= 0x80; // Flip highest bit of last byte
    const corruptedTagCipher = [parts[0], parts[1], parts[2], tagBuf.toString('base64'), parts[4]].join(':');

    let threwExpected = false;
    try {
      decrypt(corruptedTagCipher);
    } catch (err) {
      threwExpected = err instanceof CryptographicIntegrityError;
    }
    assert(threwExpected, 'Bit-flipped auth tag immediately throws CryptographicIntegrityError');

    // Invalid tag length (e.g. 15 bytes instead of 16)
    const invalidLenTag = [parts[0], parts[1], parts[2], Buffer.alloc(15).toString('base64'), parts[4]].join(':');
    let lenThrew = false;
    try {
      decrypt(invalidLenTag);
    } catch (err) {
      lenThrew = err instanceof CryptographicIntegrityError;
    }
    assert(lenThrew, 'Auth tag with invalid byte length throws CryptographicIntegrityError');
  }

  // ==============================================================================
  // VECTOR 6: TAMPERED INITIALIZATION VECTOR (IV) REJECTION
  // ==============================================================================
  console.log(`\n${colors.bold}[VECTOR 6] Tampered Initialization Vector (IV) Rejection${colors.reset}`);
  {
    const sample = 'TR160006200041700006289477';
    const cipher = encrypt(sample);
    const parts = cipher.split(':');

    // Corrupt IV buffer
    const ivBuf = Buffer.from(parts[2], 'base64');
    ivBuf[4] ^= 0x40; // Flip 1 bit in IV
    const corruptedIvCipher = [parts[0], parts[1], ivBuf.toString('base64'), parts[3], parts[4]].join(':');

    let threwExpected = false;
    try {
      decrypt(corruptedIvCipher);
    } catch (err) {
      threwExpected = err instanceof CryptographicIntegrityError;
    }
    assert(threwExpected, 'Bit-flipped IV immediately throws CryptographicIntegrityError');

    // Invalid IV length (e.g. 8 bytes instead of 12)
    const invalidIvLenCipher = [parts[0], parts[1], Buffer.alloc(8).toString('base64'), parts[3], parts[4]].join(':');
    let ivLenThrew = false;
    try {
      decrypt(invalidIvLenCipher);
    } catch (err) {
      ivLenThrew = err instanceof CryptographicIntegrityError;
    }
    assert(ivLenThrew, 'IV with invalid length (<12B) throws CryptographicIntegrityError');
  }

  // ==============================================================================
  // VECTOR 7: BACKWARD COMPATIBILITY & PLAINTEXT PASSTHROUGH
  // ==============================================================================
  console.log(`\n${colors.bold}[VECTOR 7] Backward Compatibility & Plaintext Passthrough${colors.reset}`);
  {
    const legacyIban = 'TR160006200041700006289477';
    const legacyTaxNo = '8441212524';
    const legacyText = 'Garanti BBVA Bahçeşehir Şubesi';

    assert(decrypt(legacyIban) === legacyIban, 'Plaintext legacy IBAN passes through decrypt() unchanged');
    assert(decrypt(legacyTaxNo) === legacyTaxNo, 'Plaintext legacy tax number passes through decrypt() unchanged');
    assert(decrypt(legacyText) === legacyText, 'Arbitrary plaintext string passes through decrypt() unchanged');
    assert(decrypt('') === '', 'Empty string passes through decrypt() unchanged');
    assert(decrypt(null) === null, 'null input passes through decrypt() as null');
    assert(decrypt(undefined) === undefined, 'undefined input passes through decrypt() as undefined');
    assert(decrypt(12345) === 12345, 'Numeric non-string value passes through decrypt() unchanged');
  }

  // ==============================================================================
  // VECTOR 8: KEY DERIVATION & HKDF-SHA256 SEPARATION
  // ==============================================================================
  console.log(`\n${colors.bold}[VECTOR 8] Key Derivation & HKDF-SHA256 Separation${colors.reset}`);
  {
    const originalMasterKey = getMasterKey();
    assert(Buffer.isBuffer(originalMasterKey) && originalMasterKey.length === 32, 'Master key is a valid 32-byte Buffer');

    // Test HKDF-SHA256 derivation independence
    const keySecret1 = 'SecretAlpha1234567890';
    const keySecret2 = 'SecretBeta9876543210';
    const derived1 = deriveKey(keySecret1);
    const derived2 = deriveKey(keySecret2);

    assert(derived1.length === 32, 'Derived key 1 is 32 bytes');
    assert(derived2.length === 32, 'Derived key 2 is 32 bytes');
    assert(!derived1.equals(derived2), 'Derived keys from different secrets are cryptographically distinct');

    // Test key separation: encrypt with Key A, attempt decrypt with Key B
    setMasterKey(derived1);
    const testPlaintext = 'TOP_SECRET_FINANCIAL_RECORD';
    const encryptedWithA = encrypt(testPlaintext);

    setMasterKey(derived2);
    let crossKeyFailed = false;
    try {
      decrypt(encryptedWithA);
    } catch (err) {
      crossKeyFailed = err instanceof CryptographicIntegrityError;
    }
    assert(crossKeyFailed, 'Decryption with mismatched key is rejected with CryptographicIntegrityError');

    // Restore original key
    setMasterKey(originalMasterKey);
    assert(getMasterKey().equals(originalMasterKey), 'Original master key successfully restored');
  }

  // ==============================================================================
  // VECTOR 9: IDEMPOTENT ENCRYPTION & RE-ENCRYPTION RESISTANCE
  // ==============================================================================
  console.log(`\n${colors.bold}[VECTOR 9] Idempotent Encryption & Re-Encryption Resistance${colors.reset}`);
  {
    const sample = 'TR160006200041700006289477';
    const encryptedOnce = encrypt(sample);
    const encryptedTwice = encrypt(encryptedOnce);
    const encryptedThrice = encrypt(encryptedTwice);

    assert(encryptedOnce === encryptedTwice, 'Encrypting an already-encrypted string returns identical ciphertext');
    assert(encryptedOnce === encryptedThrice, 'Triple encrypt call does not double/triple wrap');
    assert(decrypt(encryptedThrice) === sample, 'Decrypting returns original plaintext in a single call');
  }

  // ==============================================================================
  // VECTOR 10: HIGH-THROUGHPUT PERFORMANCE & BENCHMARK
  // ==============================================================================
  console.log(`\n${colors.bold}[VECTOR 10] High-Throughput Performance Benchmark (>1,000 Cycles in <50ms)${colors.reset}`);
  {
    const CYCLES = 1000;
    const sample = 'TR160006200041700006289477';

    // JIT Warmup (30 cycles)
    for (let w = 0; w < 30; w++) {
      decrypt(encrypt(sample));
    }

    const memBefore = process.memoryUsage().heapUsed;

    // 10.1: 1,000 Encrypt Operations Benchmark
    const cipherPool = [];
    const t0Enc = performance.now();
    for (let i = 0; i < CYCLES; i++) {
      cipherPool.push(encrypt(sample));
    }
    const t1Enc = performance.now();
    const encTotalMs = t1Enc - t0Enc;

    // 10.2: 1,000 Decrypt Operations Benchmark
    const t0Dec = performance.now();
    for (let i = 0; i < CYCLES; i++) {
      const dec = decrypt(cipherPool[i]);
      if (dec !== sample) {
        throw new Error(`Data corruption detected at cycle ${i}`);
      }
    }
    const t1Dec = performance.now();
    const decTotalMs = t1Dec - t0Dec;

    const memAfter = process.memoryUsage().heapUsed;
    const heapDeltaMb = (memAfter - memBefore) / (1024 * 1024);

    console.log(`    [Metrics - 1,000 Operations Benchmark]`);
    console.log(`    - 1,000 Encrypt Cycles : ${encTotalMs.toFixed(3)} ms (threshold: < 50 ms) | ${(CYCLES / (encTotalMs / 1000)).toFixed(0)} ops/sec`);
    console.log(`    - 1,000 Decrypt Cycles : ${decTotalMs.toFixed(3)} ms (threshold: < 50 ms) | ${(CYCLES / (decTotalMs / 1000)).toFixed(0)} ops/sec`);
    console.log(`    - Combined 2,000 Cycles: ${(encTotalMs + decTotalMs).toFixed(3)} ms`);
    console.log(`    - Heap Memory Delta    : ${heapDeltaMb.toFixed(2)} MB`);

    assert(encTotalMs < 50.0, `1,000 encrypt cycles completed in ${encTotalMs.toFixed(2)}ms (strictly < 50ms threshold)`);
    assert(decTotalMs < 50.0, `1,000 decrypt cycles completed in ${decTotalMs.toFixed(2)}ms (strictly < 50ms threshold)`);
    assert(heapDeltaMb < 15.0, `Memory delta bounded at ${heapDeltaMb.toFixed(2)}MB (< 15MB limit)`);
  }

  // ==============================================================================
  // VECTOR 11: MODEL RECORD MAPPERS & DISPLAY MASKING
  // ==============================================================================
  console.log(`\n${colors.bold}[VECTOR 11] Model Record Mappers & Display Masking${colors.reset}`);
  {
    // Account Record Mapper
    const rawAccount = {
      id: 'acc-1',
      code: '102.01.001',
      name: 'Garanti BBVA TL',
      iban: 'TR160006200041700006289477',
      accountNo: '417-6289477',
      balance: 15732.92
    };

    const encryptedAcc = encryptAccount(rawAccount);
    assert(isEncrypted(encryptedAcc.iban), 'encryptAccount encrypts account.iban');
    assert(isEncrypted(encryptedAcc.accountNo), 'encryptAccount encrypts account.accountNo');
    assert(encryptedAcc.balance === 15732.92, 'encryptAccount preserves non-encrypted fields');

    const decryptedAcc = decryptAccount(encryptedAcc);
    assert(decryptedAcc.iban === rawAccount.iban, 'decryptAccount restores original iban');
    assert(decryptedAcc.accountNo === rawAccount.accountNo, 'decryptAccount restores original accountNo');

    // Contact Record Mapper
    const rawContact = {
      id: 'con-1',
      code: '120.01.001',
      title: 'Faruk Aytin',
      taxNumber: '46849262292',
      balance: -10335.35
    };

    const encryptedCon = encryptContact(rawContact);
    assert(isEncrypted(encryptedCon.taxNumber), 'encryptContact encrypts contact.taxNumber');
    const decryptedCon = decryptContact(encryptedCon);
    assert(decryptedCon.taxNumber === rawContact.taxNumber, 'decryptContact restores contact.taxNumber');

    // Employee Record Mapper
    const rawEmployee = {
      id: 'emp-1',
      tcNo: '18717419460',
      fullName: 'Yunus Emre Gökalp',
      iban: 'TR160006200041700006289477'
    };
    const encryptedEmp = encryptEmployee(rawEmployee);
    assert(isEncrypted(encryptedEmp.iban), 'encryptEmployee encrypts employee.iban');
    const decryptedEmp = decryptEmployee(encryptedEmp);
    assert(decryptedEmp.iban === rawEmployee.iban, 'decryptEmployee restores employee.iban');

    // SubcontractReconciliation Record Mapper
    const rawSub = {
      id: 'sub-1',
      supplierName: 'Faruk Aytin',
      tckn: '46849262292'
    };
    const encryptedSub = encryptSubcontractReconciliation(rawSub);
    assert(isEncrypted(encryptedSub.tckn), 'encryptSubcontractReconciliation encrypts tckn');
    const decryptedSub = decryptSubcontractReconciliation(encryptedSub);
    assert(decryptedSub.tckn === rawSub.tckn, 'decryptSubcontractReconciliation restores tckn');

    // Masking Helpers
    assert(maskIban('TR160006200041700006289477') === 'TR16 **** **** **** **** 9477', 'maskIban formats 26-char IBAN with masked center');
    assert(maskTaxNumber('46849262292') === '468****2292', 'maskTaxNumber masks citizen TCKN center');
    assert(maskTaxNumber('8441212524') === '844****2524', 'maskTaxNumber masks corporate VKN center');
  }

  // ==============================================================================
  // VECTOR 12: TRANSPARENT PRISMA EXTENSION INTEGRATION (withCryptoVault)
  // ==============================================================================
  console.log(`\n${colors.bold}[VECTOR 12] Transparent Prisma Client Extension Simulation${colors.reset}`);
  {
    // Simulate Prisma Client query hook execution
    let simulatedDbStorage = {};

    const mockPrismaClient = {
      $extends(extensionConfig) {
        const queryHooks = extensionConfig.query;
        return {
          account: {
            async create(args) {
              return queryHooks.account.create({
                args,
                query: async (modifiedArgs) => {
                  simulatedDbStorage.account = { ...modifiedArgs.data };
                  return { id: 'mock-id-1', ...modifiedArgs.data };
                }
              });
            },
            async findUnique(args) {
              return queryHooks.account.findUnique({
                args,
                query: async () => simulatedDbStorage.account
              });
            },
            async findMany(args) {
              return queryHooks.account.findMany({
                args,
                query: async () => [simulatedDbStorage.account]
              });
            }
          },
          contact: {
            async create(args) {
              return queryHooks.contact.create({
                args,
                query: async (modifiedArgs) => {
                  simulatedDbStorage.contact = { ...modifiedArgs.data };
                  return { id: 'mock-contact-1', ...modifiedArgs.data };
                }
              });
            },
            async findMany(args) {
              return queryHooks.contact.findMany({
                args,
                query: async () => [simulatedDbStorage.contact]
              });
            }
          }
        };
      }
    };

    const extendedPrisma = withCryptoVault(mockPrismaClient);

    // 1. Create Account via extension
    const createdAccount = await extendedPrisma.account.create({
      data: {
        code: '102.01.001',
        name: 'Garanti BBVA TL',
        iban: 'TR160006200041700006289477',
        accountNo: '417-6289477'
      }
    });

    assert(isEncrypted(simulatedDbStorage.account.iban), 'Prisma extension intercepts create: database receives encrypted IBAN');
    assert(isEncrypted(simulatedDbStorage.account.accountNo), 'Prisma extension intercepts create: database receives encrypted accountNo');
    assert(createdAccount.iban === 'TR160006200041700006289477', 'Prisma extension returns transparently decrypted IBAN to caller');
    assert(createdAccount.accountNo === '417-6289477', 'Prisma extension returns transparently decrypted accountNo to caller');

    // 2. Read Account via extension
    const fetchedAccounts = await extendedPrisma.account.findMany({});
    assert(Array.isArray(fetchedAccounts) && fetchedAccounts.length === 1, 'findMany returns array');
    assert(fetchedAccounts[0].iban === 'TR160006200041700006289477', 'findMany transparently decrypts stored ciphertext');

    // 3. Create Contact via extension
    const createdContact = await extendedPrisma.contact.create({
      data: {
        code: '120.01.001',
        title: 'Brosan Contact LLC',
        taxNumber: '8441212524'
      }
    });

    assert(isEncrypted(simulatedDbStorage.contact.taxNumber), 'Database storage holds encrypted taxNumber');
    assert(createdContact.taxNumber === '8441212524', 'Caller receives decrypted taxNumber');

    const fetchedContacts = await extendedPrisma.contact.findMany({});
    assert(fetchedContacts[0].taxNumber === '8441212524', 'findMany transparently decrypts contact taxNumber');
  }

  // ==============================================================================
  // FINAL REPORT
  // ==============================================================================
  console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}              CRYPTO VAULT TEST RESULTS SUMMARY REPORT                          ${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  Total Assertions Checked : ${totalPassed + totalFailed}`);
  console.log(`  Passed Assertions        : ${colors.green}${totalPassed}${colors.reset}`);
  console.log(`  Failed Assertions        : ${totalFailed > 0 ? colors.red + totalFailed + colors.reset : 0}`);
  console.log(`  Pass Rate                : ${colors.bold}${colors.green}${(((totalPassed) / (totalPassed + totalFailed)) * 100).toFixed(1)}%${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  if (totalFailed > 0) {
    console.error(`${colors.bold}${colors.red}💥 CRYPTO VAULT TEST SUITE FAILED!${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.bold}${colors.green}🎉 ALL 12 CRYPTOGRAPHIC TEST VECTORS PASSED WITH 100% SUCCESS RATE!${colors.reset}\n`);
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
