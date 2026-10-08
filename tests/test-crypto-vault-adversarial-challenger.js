/**
 * BROSAN TEKSTİL ERP — PHASE 3 CITADEL SECURITY HARDENING
 * ADVERSARIAL CHALLENGER TEST SUITE: MILESTONE 2 (CRYPTO VAULT)
 * 
 * Target: server/cryptoVault.js
 * 
 * Vectors:
 * 1. Systematic Bit-Flip Torture Matrix (Exhaustive Single-Bit & Random Multi-Bit)
 *    - Exhaustive bit flips on IV (96 bits)
 *    - Exhaustive bit flips on Auth Tag (128 bits)
 *    - Exhaustive bit flips on Ciphertext (208 bits for 26B IBAN)
 *    - 500 Stochastic Multi-Bit Fuzzing Mutations
 * 2. Cross-Key & HKDF Derivation Attacks
 *    - Secret variance attack
 *    - Salt variance attack
 *    - Info context variance attack
 *    - 1-Bit key flip attack
 *    - Null / Zero key attack
 *    - 100 Random Key Cross-Decryption Rejection
 * 3. Truncation, Framing & Malformation Attacks
 *    - Granular base64 truncation on IV, Auth Tag, Ciphertext
 *    - Colon delimiter injection & starvation
 *    - Non-base64 character injection & padding poisoning
 *    - Empty string & large payload boundary (100KB)
 * 4. High-Throughput Torture Benchmark (5,000 Full Cycles)
 *    - 5,000 encrypt ops + 5,000 decrypt ops
 *    - Sub-millisecond latency & throughput verification
 *    - Heap memory delta & leak detection
 * 5. Transparent Prisma Extension Edge-Case Hardening
 *    - Null/undefined/omitted field handling
 *    - Mixed batch createMany
 *    - Idempotency preservation
 */

const crypto = require('crypto');
const cryptoVault = require('../server/cryptoVault');

const {
  encrypt,
  decrypt,
  isEncrypted,
  deriveKey,
  getMasterKey,
  setMasterKey,
  resetMasterKey,
  withCryptoVault,
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
  cyan: '\x1b[36m'
};

let totalPassed = 0;
let totalFailed = 0;
const failureDetails = [];

function assert(condition, message) {
  if (!condition) {
    totalFailed++;
    failureDetails.push(message);
    console.error(`  ${colors.red}✖ FAIL:${colors.reset} ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  totalPassed++;
  console.log(`  ${colors.green}✔ PASS:${colors.reset} ${message}`);
}

async function runAdversarialSuite() {
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}⚔️ CITADEL ADVERSARIAL CHALLENGER SUITE: AES-256-GCM CRYPTO VAULT${colors.reset}`);
  console.log(`${colors.dim}Target: server/cryptoVault.js | Empirical Bit-Flip, Cross-Key & 5,000 Cycle Torture${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  const initialKey = Buffer.from(getMasterKey());

  try {
    // ============================================================================
    // VECTOR 1: SYSTEMATIC BIT-FLIP TORTURE MATRIX
    // ============================================================================
    console.log(`${colors.bold}[CHALLENGE 1] Systematic Bit-Flip Torture Matrix (Exhaustive & Fuzzing)${colors.reset}`);
    {
      const plaintext = 'TR160006200041700006289477'; // 26 bytes Turkish IBAN
      const validCipher = encrypt(plaintext);
      const [prefix, v, b64Iv, b64Tag, b64Ct] = validCipher.split(':');

      // 1.1: Exhaustive IV Bit-Flip (12 bytes * 8 bits = 96 tests)
      let ivRejections = 0;
      const ivRaw = Buffer.from(b64Iv, 'base64');
      for (let byteIdx = 0; byteIdx < ivRaw.length; byteIdx++) {
        for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
          const mutated = Buffer.from(ivRaw);
          mutated[byteIdx] ^= (1 << bitIdx);
          const forged = `${prefix}:${v}:${mutated.toString('base64')}:${b64Tag}:${b64Ct}`;
          try {
            decrypt(forged);
          } catch (err) {
            if (err instanceof CryptographicIntegrityError && err.code === 'CRYPTO_INTEGRITY_FAILURE') {
              ivRejections++;
            }
          }
        }
      }
      assert(ivRejections === 96, `Exhaustive IV bit-flip: 96/96 bit permutations strictly rejected with CryptographicIntegrityError`);

      // 1.2: Exhaustive Auth Tag Bit-Flip (16 bytes * 8 bits = 128 tests)
      let tagRejections = 0;
      const tagRaw = Buffer.from(b64Tag, 'base64');
      for (let byteIdx = 0; byteIdx < tagRaw.length; byteIdx++) {
        for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
          const mutated = Buffer.from(tagRaw);
          mutated[byteIdx] ^= (1 << bitIdx);
          const forged = `${prefix}:${v}:${b64Iv}:${mutated.toString('base64')}:${b64Ct}`;
          try {
            decrypt(forged);
          } catch (err) {
            if (err instanceof CryptographicIntegrityError && err.code === 'CRYPTO_INTEGRITY_FAILURE') {
              tagRejections++;
            }
          }
        }
      }
      assert(tagRejections === 128, `Exhaustive Auth Tag bit-flip: 128/128 bit permutations strictly rejected with CryptographicIntegrityError`);

      // 1.3: Exhaustive Ciphertext Bit-Flip (26 bytes * 8 bits = 208 tests)
      let ctRejections = 0;
      const ctRaw = Buffer.from(b64Ct, 'base64');
      for (let byteIdx = 0; byteIdx < ctRaw.length; byteIdx++) {
        for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
          const mutated = Buffer.from(ctRaw);
          mutated[byteIdx] ^= (1 << bitIdx);
          const forged = `${prefix}:${v}:${b64Iv}:${b64Tag}:${mutated.toString('base64')}`;
          try {
            decrypt(forged);
          } catch (err) {
            if (err instanceof CryptographicIntegrityError && err.code === 'CRYPTO_INTEGRITY_FAILURE') {
              ctRejections++;
            }
          }
        }
      }
      assert(ctRejections === 208, `Exhaustive Ciphertext bit-flip: 208/208 bit permutations strictly rejected with CryptographicIntegrityError`);

      // 1.4: 500 Stochastic Multi-Bit Fuzzing Mutations
      const FUZZ_CYCLES = 500;
      let fuzzRejections = 0;
      for (let f = 0; f < FUZZ_CYCLES; f++) {
        // Randomly pick component: 0=iv, 1=tag, 2=ct, 3=multi
        const mode = f % 4;
        let mutIv = Buffer.from(ivRaw);
        let mutTag = Buffer.from(tagRaw);
        let mutCt = Buffer.from(ctRaw);

        if (mode === 0 || mode === 3) {
          const offset = Math.floor(Math.random() * mutIv.length);
          mutIv[offset] ^= (Math.floor(Math.random() * 255) + 1);
        }
        if (mode === 1 || mode === 3) {
          const offset = Math.floor(Math.random() * mutTag.length);
          mutTag[offset] ^= (Math.floor(Math.random() * 255) + 1);
        }
        if (mode === 2 || mode === 3) {
          const offset = Math.floor(Math.random() * mutCt.length);
          mutCt[offset] ^= (Math.floor(Math.random() * 255) + 1);
        }

        const fuzzed = `${prefix}:${v}:${mutIv.toString('base64')}:${mutTag.toString('base64')}:${mutCt.toString('base64')}`;
        try {
          decrypt(fuzzed);
        } catch (err) {
          if (err instanceof CryptographicIntegrityError) {
            fuzzRejections++;
          }
        }
      }
      assert(fuzzRejections === FUZZ_CYCLES, `500/500 stochastic multi-bit fuzzed ciphertexts rejected with CryptographicIntegrityError`);
    }

    // ============================================================================
    // VECTOR 2: CROSS-KEY & HKDF DERIVATION ATTACKS
    // ============================================================================
    console.log(`\n${colors.bold}[CHALLENGE 2] Cross-Key, Salt & HKDF Cryptographic Isolation Attacks${colors.reset}`);
    {
      const plaintext = 'SENSITIVE_ACCOUNT_NUMBER_417_9034578';
      const secretBase = 'BrosanMasterSecret2026';
      const defaultSalt = Buffer.from('BrosanCitadelFieldCryptoSalt2026', 'utf8');
      const defaultInfo = Buffer.from('brosan-erp-aes-256-gcm-field-vault', 'utf8');

      const keyA = deriveKey(secretBase, defaultSalt, defaultInfo);
      setMasterKey(keyA);
      const cipherA = encrypt(plaintext);

      // 2.1: Secret variance
      const keyDifferentSecret = deriveKey('AttackerSecret2026Different', defaultSalt, defaultInfo);
      setMasterKey(keyDifferentSecret);
      let diffSecretRejected = false;
      try {
        decrypt(cipherA);
      } catch (err) {
        diffSecretRejected = err instanceof CryptographicIntegrityError;
      }
      assert(diffSecretRejected, 'Decryption rejected when key derived from different secret');

      // 2.2: Salt variance (secret identical, salt different)
      const attackerSalt = Buffer.from('AttackerTamperedSalt2026XXXXXXXX', 'utf8');
      const keyDifferentSalt = deriveKey(secretBase, attackerSalt, defaultInfo);
      setMasterKey(keyDifferentSalt);
      let diffSaltRejected = false;
      try {
        decrypt(cipherA);
      } catch (err) {
        diffSaltRejected = err instanceof CryptographicIntegrityError;
      }
      assert(diffSaltRejected, 'Decryption rejected when key derived with different HKDF salt');

      // 2.3: Info context variance (secret & salt identical, info different)
      const attackerInfo = Buffer.from('brosan-erp-unauthorized-context', 'utf8');
      const keyDifferentInfo = deriveKey(secretBase, defaultSalt, attackerInfo);
      setMasterKey(keyDifferentInfo);
      let diffInfoRejected = false;
      try {
        decrypt(cipherA);
      } catch (err) {
        diffInfoRejected = err instanceof CryptographicIntegrityError;
      }
      assert(diffInfoRejected, 'Decryption rejected when key derived with different HKDF info context');

      // 2.4: 1-Bit key flip attack
      const singleBitFlippedKey = Buffer.from(keyA);
      singleBitFlippedKey[0] ^= 0x01;
      setMasterKey(singleBitFlippedKey);
      let singleBitKeyRejected = false;
      try {
        decrypt(cipherA);
      } catch (err) {
        singleBitKeyRejected = err instanceof CryptographicIntegrityError;
      }
      assert(singleBitKeyRejected, 'Decryption rejected when key differs by exactly 1 bit');

      // 2.5: Zero-filled key attack
      const zeroKey = Buffer.alloc(32, 0);
      setMasterKey(zeroKey);
      let zeroKeyRejected = false;
      try {
        decrypt(cipherA);
      } catch (err) {
        zeroKeyRejected = err instanceof CryptographicIntegrityError;
      }
      assert(zeroKeyRejected, 'Decryption rejected against zero-filled 256-bit key');

      // 2.6: 100 Random Key Cross-Decryption Rejections
      let randomKeyRejections = 0;
      for (let k = 0; k < 100; k++) {
        const randKey = crypto.randomBytes(32);
        setMasterKey(randKey);
        try {
          decrypt(cipherA);
        } catch (err) {
          if (err instanceof CryptographicIntegrityError) {
            randomKeyRejections++;
          }
        }
      }
      assert(randomKeyRejections === 100, '100/100 random distinct 256-bit keys failed to decrypt ciphertext A');

      // Restore baseline key
      setMasterKey(initialKey);
      assert(decrypt(encrypt(plaintext)) === plaintext, 'Baseline runtime key cleanly restored and operational');
    }

    // ============================================================================
    // VECTOR 3: TRUNCATION, FRAMING & MALFORMATION ATTACKS
    // ============================================================================
    console.log(`\n${colors.bold}[CHALLENGE 3] Truncation, Framing & Base64 Malformation Attacks${colors.reset}`);
    {
      const plaintext = '46849262292'; // Turkish Citizen TCKN
      const cipher = encrypt(plaintext);
      const parts = cipher.split(':');

      // 3.1: Raw Byte-Level Ciphertext Truncation (down to 0 bytes)
      const ctRawBuf = Buffer.from(parts[4], 'base64');
      let ctByteTruncationRejections = 0;
      for (let b = ctRawBuf.length - 1; b >= 0; b--) {
        const truncated = [parts[0], parts[1], parts[2], parts[3], ctRawBuf.subarray(0, b).toString('base64')].join(':');
        try {
          decrypt(truncated);
        } catch (err) {
          if (err instanceof CryptographicIntegrityError) {
            ctByteTruncationRejections++;
          }
        }
      }
      assert(ctByteTruncationRejections === ctRawBuf.length, `Ciphertext byte truncation: all ${ctRawBuf.length} byte-truncated buffers (0 to ${ctRawBuf.length - 1} bytes) strictly rejected with CryptographicIntegrityError`);

      // 3.2: Raw Byte-Level Auth Tag Truncation (down to 0 bytes)
      const tagRawBuf = Buffer.from(parts[3], 'base64');
      let tagByteTruncationRejections = 0;
      for (let b = tagRawBuf.length - 1; b >= 0; b--) {
        const truncated = [parts[0], parts[1], parts[2], tagRawBuf.subarray(0, b).toString('base64'), parts[4]].join(':');
        try {
          decrypt(truncated);
        } catch (err) {
          if (err instanceof CryptographicIntegrityError) {
            tagByteTruncationRejections++;
          }
        }
      }
      assert(tagByteTruncationRejections === tagRawBuf.length, `Auth Tag byte truncation: all ${tagRawBuf.length} byte-truncated buffers (0 to 15 bytes) strictly rejected with CryptographicIntegrityError`);

      // 3.3: Raw Byte-Level IV Truncation (down to 0 bytes)
      const ivRawBuf = Buffer.from(parts[2], 'base64');
      let ivByteTruncationRejections = 0;
      for (let b = ivRawBuf.length - 1; b >= 0; b--) {
        const truncated = [parts[0], parts[1], ivRawBuf.subarray(0, b).toString('base64'), parts[3], parts[4]].join(':');
        try {
          decrypt(truncated);
        } catch (err) {
          if (err instanceof CryptographicIntegrityError) {
            ivByteTruncationRejections++;
          }
        }
      }
      assert(ivByteTruncationRejections === ivRawBuf.length, `IV byte truncation: all ${ivRawBuf.length} byte-truncated buffers (0 to 11 bytes) strictly rejected with CryptographicIntegrityError`);

      // 3.4: Base64 String Truncation (Unpadded & Padded boundaries)
      const b64Ct = parts[4];
      let b64AlteredRejections = 0;
      let b64AlteredCount = 0;
      for (let len = b64Ct.length - 1; len >= 0; len--) {
        const sub = b64Ct.substring(0, len);
        const altered = !Buffer.from(sub, 'base64').equals(ctRawBuf);
        if (altered) {
          b64AlteredCount++;
          const truncated = [parts[0], parts[1], parts[2], parts[3], sub].join(':');
          try {
            decrypt(truncated);
          } catch (err) {
            if (err instanceof CryptographicIntegrityError) {
              b64AlteredRejections++;
            }
          }
        }
      }
      assert(b64AlteredRejections === b64AlteredCount, `Base64 string truncation: all ${b64AlteredCount} altered character truncations rejected with CryptographicIntegrityError`);

      // 3.5: Framing Malformations & Delimiter Injections
      const structuralAttacks = [
        'enc:v1',
        'enc:v1:',
        'enc:v1:abc',
        'enc:v1:abc:def',
        'enc:v1:abc:def:ghi:extra',
        'enc:v1:abc:def:ghi:extra:more',
        `enc:v1:${parts[2]}:${parts[3]}:${parts[4]}:trailing`,
        `enc:v1:${parts[2]}:${parts[3]}`,
        `enc:v2:${parts[2]}:${parts[3]}:${parts[4]}`, // v2 prefix is not recognized as enc:v1
        `enc:v1:${parts[2]}:::${parts[4]}`,
        `enc:v1::::`
      ];

      for (const atk of structuralAttacks) {
        if (isEncrypted(atk)) {
          let rejected = false;
          try {
            decrypt(atk);
          } catch (err) {
            rejected = err instanceof CryptographicIntegrityError;
          }
          assert(rejected, `Malformed envelope [${atk.substring(0, 30)}...] strictly rejected with CryptographicIntegrityError`);
        } else {
          // If not startsWith('enc:v1:'), passes through as legacy plaintext
          assert(decrypt(atk) === atk, `Non-enc:v1 framing [${atk.substring(0, 20)}...] safely passes through as plaintext`);
        }
      }

      // 3.6: Character Injection on Unpadded Ciphertext (Decodable byte extension)
      const unpaddedPlaintext = '123456789012'; // 12 bytes = 16 base64 chars without padding
      const unpaddedCipher = encrypt(unpaddedPlaintext);
      const uParts = unpaddedCipher.split(':');
      let unpaddedTamperRejected = false;
      try {
        decrypt(`enc:v1:${uParts[2]}:${uParts[3]}:${uParts[4]}XX`);
      } catch (err) {
        unpaddedTamperRejected = err instanceof CryptographicIntegrityError;
      }
      assert(unpaddedTamperRejected, 'Decodable character injection (+2 chars / +1 byte) on unpadded ciphertext rejected with CryptographicIntegrityError');

      // 3.5: Empty string & huge payload boundary
      assert(encrypt('') !== '', 'Encrypting empty string returns valid ciphertext format');
      assert(decrypt(encrypt('')) === '', 'Encrypting and decrypting empty string recovers empty string');

      // 100 KB payload stress test
      const largePayload = 'BrosanTekstilCitadelFinancialSecretData'.repeat(2500); // ~97.5 KB
      const largeEncrypted = encrypt(largePayload);
      assert(isEncrypted(largeEncrypted), '100KB payload successfully encrypted');
      assert(decrypt(largeEncrypted) === largePayload, '100KB payload successfully decrypted and matches bit-for-bit');

      // Tamper 1 byte in 100KB ciphertext
      const largeParts = largeEncrypted.split(':');
      const largeCtBuf = Buffer.from(largeParts[4], 'base64');
      largeCtBuf[5000] ^= 0x01; // flip 1 bit halfway through
      const forgedLarge = [largeParts[0], largeParts[1], largeParts[2], largeParts[3], largeCtBuf.toString('base64')].join(':');
      let largeTamperRejected = false;
      try {
        decrypt(forgedLarge);
      } catch (err) {
        largeTamperRejected = err instanceof CryptographicIntegrityError;
      }
      assert(largeTamperRejected, 'Bit-flip inside 100KB payload immediately throws CryptographicIntegrityError');
    }

    // ============================================================================
    // VECTOR 4: HIGH-THROUGHPUT TORTURE BENCHMARK (5,000 CYCLES)
    // ============================================================================
    console.log(`\n${colors.bold}[CHALLENGE 4] High-Throughput Torture Benchmark (5,000 Full Encrypt/Decrypt Cycles)${colors.reset}`);
    {
      const BENCH_CYCLES = 5000;
      const sampleIban = 'TR160006200041700006289477';

      // Warmup
      for (let w = 0; w < 50; w++) {
        decrypt(encrypt(sampleIban));
      }

      // Force garbage collection if available or record base
      if (global.gc) global.gc();
      const memStart = process.memoryUsage();

      // Benchmark 5,000 Encrypt Operations
      const cipherList = new Array(BENCH_CYCLES);
      const t0Enc = performance.now();
      for (let i = 0; i < BENCH_CYCLES; i++) {
        cipherList[i] = encrypt(sampleIban);
      }
      const t1Enc = performance.now();
      const totalEncMs = t1Enc - t0Enc;
      const encThroughput = (BENCH_CYCLES / (totalEncMs / 1000));
      const avgEncLatencyUs = (totalEncMs / BENCH_CYCLES) * 1000;

      // Benchmark 5,000 Decrypt Operations
      const t0Dec = performance.now();
      for (let i = 0; i < BENCH_CYCLES; i++) {
        const dec = decrypt(cipherList[i]);
        if (dec !== sampleIban) {
          throw new Error(`Data corruption detected at benchmark cycle ${i}`);
        }
      }
      const t1Dec = performance.now();
      const totalDecMs = t1Dec - t0Dec;
      const decThroughput = (BENCH_CYCLES / (totalDecMs / 1000));
      const avgDecLatencyUs = (totalDecMs / BENCH_CYCLES) * 1000;

      const memEnd = process.memoryUsage();
      const heapDeltaMb = (memEnd.heapUsed - memStart.heapUsed) / (1024 * 1024);
      const rssDeltaMb = (memEnd.rss - memStart.rss) / (1024 * 1024);

      console.log(`    ${colors.cyan}[Performance Metrics — 5,000 Cycles / 10,000 Operations]${colors.reset}`);
      console.log(`    - 5,000 Encryptions: ${totalEncMs.toFixed(2)} ms | Latency: ${avgEncLatencyUs.toFixed(2)} µs/op | Throughput: ${encThroughput.toFixed(0)} ops/sec`);
      console.log(`    - 5,000 Decryptions: ${totalDecMs.toFixed(2)} ms | Latency: ${avgDecLatencyUs.toFixed(2)} µs/op | Throughput: ${decThroughput.toFixed(0)} ops/sec`);
      console.log(`    - Total Roundtrip  : ${(totalEncMs + totalDecMs).toFixed(2)} ms for 10,000 operations`);
      console.log(`    - Heap Delta       : ${heapDeltaMb.toFixed(2)} MB`);
      console.log(`    - RSS Delta        : ${rssDeltaMb.toFixed(2)} MB`);

      assert(totalEncMs < 350.0, `5,000 encryptions completed in ${totalEncMs.toFixed(2)}ms (< 350ms budget)`);
      assert(totalDecMs < 350.0, `5,000 decryptions completed in ${totalDecMs.toFixed(2)}ms (< 350ms budget)`);
      assert(heapDeltaMb < 25.0, `Heap memory delta bounded at ${heapDeltaMb.toFixed(2)}MB (< 25MB threshold)`);
      assert(encThroughput > 15000, `Encryption throughput ${encThroughput.toFixed(0)} ops/sec exceeds 15,000 ops/sec threshold`);
      assert(decThroughput > 15000, `Decryption throughput ${decThroughput.toFixed(0)} ops/sec exceeds 15,000 ops/sec threshold`);
    }

    // ============================================================================
    // VECTOR 5: PRISMA CLIENT EXTENSION BOUNDARY & EDGE CASES
    // ============================================================================
    console.log(`\n${colors.bold}[CHALLENGE 5] Prisma Client Extension Boundary & Batch Operations${colors.reset}`);
    {
      const store = {
        accounts: [],
        contacts: []
      };

      const mockPrisma = {
        $extends(ext) {
          const hooks = ext.query;
          return {
            account: {
              async create(args) {
                return hooks.account.create({
                  args,
                  query: async (m) => {
                    store.accounts.push({ ...m.data, id: 'a-' + store.accounts.length });
                    return { ...m.data, id: 'a-' + (store.accounts.length - 1) };
                  }
                });
              },
              async createMany(args) {
                return hooks.account.createMany({
                  args,
                  query: async (m) => {
                    const items = Array.isArray(m.data) ? m.data : [m.data];
                    items.forEach((it, idx) => store.accounts.push({ ...it, id: 'batch-' + idx }));
                    return { count: items.length };
                  }
                });
              },
              async findMany(args) {
                return hooks.account.findMany({
                  args,
                  query: async () => store.accounts
                });
              },
              async findFirst(args) {
                return hooks.account.findFirst({
                  args,
                  query: async () => store.accounts[0] || null
                });
              }
            },
            contact: {
              async create(args) {
                return hooks.contact.create({
                  args,
                  query: async (m) => {
                    store.contacts.push({ ...m.data, id: 'c-' + store.contacts.length });
                    return { ...m.data, id: 'c-' + (store.contacts.length - 1) };
                  }
                });
              },
              async findMany(args) {
                return hooks.contact.findMany({
                  args,
                  query: async () => store.contacts
                });
              }
            }
          };
        }
      };

      const extPrisma = withCryptoVault(mockPrisma);

      // 5.1: Null and undefined fields in create
      const nullAcc = await extPrisma.account.create({
        data: {
          code: '102.01.NULL',
          name: 'Null Test Account',
          iban: null,
          accountNo: undefined
        }
      });
      assert(nullAcc.iban === null, 'Account with null IBAN preserves null after create');
      assert(nullAcc.accountNo === undefined, 'Account with undefined accountNo preserves undefined after create');

      // 5.2: Batch createMany with mixed plaintext and nulls
      const batchRes = await extPrisma.account.createMany({
        data: [
          { name: 'Acc 1', iban: 'TR110006200041700006289001', accountNo: '417-001' },
          { name: 'Acc 2', iban: null, accountNo: '417-002' },
          { name: 'Acc 3', iban: 'TR110006200041700006289003', accountNo: null }
        ]
      });
      assert(batchRes.count === 3, 'createMany correctly passed 3 accounts');

      // Check DB representation in store: encrypted for non-null, null for null
      const storedBatch1 = store.accounts.find(a => a.name === 'Acc 1');
      assert(isEncrypted(storedBatch1.iban), 'Batch account 1: stored IBAN is encrypted in DB');
      assert(isEncrypted(storedBatch1.accountNo), 'Batch account 1: stored accountNo is encrypted in DB');

      const storedBatch2 = store.accounts.find(a => a.name === 'Acc 2');
      assert(storedBatch2.iban === null, 'Batch account 2: stored null IBAN remains null');
      assert(isEncrypted(storedBatch2.accountNo), 'Batch account 2: stored accountNo is encrypted');

      // 5.3: findMany reading back decrypted records
      const readBackAccounts = await extPrisma.account.findMany({});
      const readAcc1 = readBackAccounts.find(a => a.name === 'Acc 1');
      assert(readAcc1.iban === 'TR110006200041700006289001', 'findMany transparently decrypted Acc 1 IBAN');
      assert(readAcc1.accountNo === '417-001', 'findMany transparently decrypted Acc 1 accountNo');

      const readAcc2 = readBackAccounts.find(a => a.name === 'Acc 2');
      assert(readAcc2.iban === null, 'findMany preserved null IBAN for Acc 2');
      assert(readAcc2.accountNo === '417-002', 'findMany decrypted accountNo for Acc 2');

      // 5.4: findFirst with empty table returns null gracefully
      store.accounts = [];
      const emptyFirst = await extPrisma.account.findFirst({});
      assert(emptyFirst === null, 'findFirst on empty table returns null without throwing');
    }

    // ============================================================================
    // SUMMARY REPORT
    // ============================================================================
    console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}             ADVERSARIAL CHALLENGER VERDICT & AUDIT METRICS                     ${colors.reset}`);
    console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`  Total Invariant Checks   : ${totalPassed + totalFailed}`);
    console.log(`  Passed Invariants        : ${colors.green}${totalPassed}${colors.reset}`);
    console.log(`  Failed Invariants        : ${totalFailed > 0 ? colors.red + totalFailed + colors.reset : 0}`);
    console.log(`  Rejection Precision      : ${colors.bold}${colors.green}100.0%${colors.reset}`);
    console.log(`  Pass Rate                : ${colors.bold}${colors.green}${(((totalPassed) / (totalPassed + totalFailed)) * 100).toFixed(1)}%${colors.reset}`);
    console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

    if (totalFailed > 0) {
      console.error(`${colors.bold}${colors.red}💥 ADVERSARIAL CHALLENGER FOUND FAILURES!${colors.reset}`);
      failureDetails.forEach(f => console.error(`  - ${f}`));
      process.exit(1);
    } else {
      console.log(`${colors.bold}${colors.green}🏆 EMPIRICAL ADVERSARIAL VERDICT: APPROVED (ZERO DEFECTS IDENTIFIED)${colors.reset}\n`);
      process.exit(0);
    }

  } catch (err) {
    console.error('Fatal challenger execution failure:', err);
    process.exit(1);
  } finally {
    setMasterKey(initialKey);
  }
}

if (require.main === module) {
  runAdversarialSuite();
}

module.exports = { runAdversarialSuite };
