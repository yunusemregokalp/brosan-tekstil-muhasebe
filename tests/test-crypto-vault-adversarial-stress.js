/**
 * ADVERSARIAL CHALLENGER SUITE FOR MILESTONE 2: AES-256-GCM CRYPTO VAULT
 * Author: Reviewer 1 & Adversarial Critic
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

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error(`  [FAIL] ${msg}`);
    throw new Error(`Adversarial failure: ${msg}`);
  }
  passed++;
  console.log(`  [PASS] ${msg}`);
}

async function runAdversarialAudit() {
  console.log('================================================================');
  console.log('⚔️  ADVERSARIAL STRESS TEST & INTEGRITY AUDIT: CRYPTO VAULT');
  console.log('================================================================\n');

  // Vector A: Empty string and whitespace
  console.log('► Vector A: Boundary input values (empty string, whitespace, newlines)...');
  {
    const empty = '';
    const encEmpty = encrypt(empty);
    assert(isEncrypted(encEmpty), 'Empty string encrypts to enc:v1 format');
    assert(decrypt(encEmpty) === '', 'Decrypted empty string returns exact empty string');

    const whitespace = '   \t\r\n   ';
    const encWs = encrypt(whitespace);
    assert(decrypt(encWs) === whitespace, 'Whitespace & newlines roundtrip perfectly');
  }

  // Vector B: UTF-8 Multibyte, Turkish chars, emojis, CJK
  console.log('\n► Vector B: UTF-8 multibyte, Turkish chars, emojis, CJK...');
  {
    const turkishSpecial = 'Şirket Vergi No: 1871741946 — Beylikdüzü V.D. | ₺125.450,75 | İşçilik / Ücret';
    assert(decrypt(encrypt(turkishSpecial)) === turkishSpecial, 'Turkish special characters preserve byte integrity');

    const emojis = '🔐🛡️ Turkish Lira ₺ Dollar $ Euro € Pound £ 🚀💎';
    assert(decrypt(encrypt(emojis)) === emojis, 'Emojis and international currency symbols preserve integrity');

    const cjk = '你好世界 / こんにちは世界 / 안녕하세요 세계';
    assert(decrypt(encrypt(cjk)) === cjk, 'CJK multibyte characters roundtrip without corruption');
  }

  // Vector C: Massive Payload Stress Test (1 MB)
  console.log('\n► Vector C: Massive payload stress test (1 MB string)...');
  {
    const largeChunk = 'TR160006200041700006289477-'.repeat(40000); // ~1.1 MB
    const t0 = performance.now();
    const encLarge = encrypt(largeChunk);
    const t1 = performance.now();
    const decLarge = decrypt(encLarge);
    const t2 = performance.now();
    assert(decLarge === largeChunk, '1.1 MB payload encrypted and decrypted with 100% bit identity');
    console.log(`    Encrypt 1.1MB: ${(t1 - t0).toFixed(2)}ms | Decrypt 1.1MB: ${(t2 - t1).toFixed(2)}ms`);
    assert(t1 - t0 < 100, 'Encrypt 1.1MB took < 100ms');
    assert(t2 - t1 < 100, 'Decrypt 1.1MB took < 100ms');
  }

  // Vector D: 100 Random Bit-Flip Attacks across Ciphertext, IV, and Auth Tag
  console.log('\n► Vector D: 100 Random Bit-Flip Attacks across Ciphertext, Tag, and IV...');
  {
    const sample = 'TR160006200041700006289477';
    let rejectedCount = 0;

    for (let i = 0; i < 100; i++) {
      const c = encrypt(sample);
      const parts = c.split(':');
      const targetSegment = (i % 3) + 2; // 2: IV, 3: Tag, 4: Ciphertext
      const buf = Buffer.from(parts[targetSegment], 'base64');
      const byteIdx = Math.floor(Math.random() * buf.length);
      const bitMask = 1 << Math.floor(Math.random() * 8);
      buf[byteIdx] ^= bitMask; // Single bit flip
      parts[targetSegment] = buf.toString('base64');
      const tampered = parts.join(':');

      try {
        decrypt(tampered);
      } catch (err) {
        if (err instanceof CryptographicIntegrityError) {
          rejectedCount++;
        }
      }
    }
    assert(rejectedCount === 100, `All 100 bit-flip attacks threw CryptographicIntegrityError (100/100)`);
  }

  // Vector E: AAD (Associated Data) Security Boundary
  console.log('\n► Vector E: AAD (Associated Data) security boundary...');
  {
    const sample = 'TR160006200041700006289477';
    const aadBuf = Buffer.from('tenant=brosan;org=101');
    const aadStr = 'tenant=brosan;org=101';

    const cBuf = encrypt(sample, aadBuf);
    assert(decrypt(cBuf, aadStr) === sample, 'AAD matches whether supplied as Buffer or String');

    let threwOnEmptyAad = false;
    try {
      decrypt(cBuf, '');
    } catch (err) {
      threwOnEmptyAad = err instanceof CryptographicIntegrityError;
    }
    assert(threwOnEmptyAad, 'Decrypting with empty string AAD when encrypted with non-empty AAD fails');

    let threwOnNullAad = false;
    try {
      decrypt(cBuf, null);
    } catch (err) {
      threwOnNullAad = err instanceof CryptographicIntegrityError;
    }
    assert(threwOnNullAad, 'Decrypting with null AAD when encrypted with non-empty AAD fails');
  }

  // Vector F: Malformed Ciphertext Payloads
  console.log('\n► Vector F: Malformed and synthetic attack payloads starting with enc:v1:...');
  {
    const testCases = [
      'enc:v1:',
      'enc:v1:too:few',
      'enc:v1:part1:part2:part3:part4:part5', // 6 parts
      'enc:v1:::', // 4 parts
      'enc:v1::::', // 5 parts, empty IV
      'enc:v1:$$$invalidbase64$$$:###:@@@',
      'enc:v1:' + Buffer.alloc(8).toString('base64') + ':' + Buffer.alloc(16).toString('base64') + ':AAA=', // Short IV (8 bytes)
      'enc:v1:' + Buffer.alloc(16).toString('base64') + ':' + Buffer.alloc(16).toString('base64') + ':AAA=', // Long IV (16 bytes)
      'enc:v1:' + Buffer.alloc(12).toString('base64') + ':' + Buffer.alloc(12).toString('base64') + ':AAA=', // Short Tag (12 bytes)
      'enc:v1:' + Buffer.alloc(12).toString('base64') + ':' + Buffer.alloc(20).toString('base64') + ':AAA='  // Long Tag (20 bytes)
    ];

    for (const malformed of testCases) {
      let threw = false;
      try {
        decrypt(malformed);
      } catch (err) {
        threw = err instanceof CryptographicIntegrityError;
      }
      assert(threw, `Malformed payload rejected with CryptographicIntegrityError: "${malformed.slice(0, 35)}..."`);
    }

    // Verify non-enc:v1 strings correctly passthrough as backward-compatible plaintext
    assert(decrypt('enc:v1') === 'enc:v1', 'String without trailing colon treated as plaintext');
    assert(decrypt('enc:v2:AAAA:BBBB:CCCC') === 'enc:v2:AAAA:BBBB:CCCC', 'Unknown version prefix treated as plaintext passthrough');
  }

  // Vector G: Master Key Management & Validation
  console.log('\n► Vector G: Master Key validation & error handling...');
  {
    const originalKey = getMasterKey();

    // Valid 64-char hex key
    const hexKey = crypto.randomBytes(32).toString('hex');
    setMasterKey(hexKey);
    assert(getMasterKey().equals(Buffer.from(hexKey, 'hex')), 'setMasterKey accepts valid 64-character hex string');

    // Invalid length rejection
    let rejectedShortKey = false;
    try {
      setMasterKey(crypto.randomBytes(16)); // 16 bytes (AES-128)
    } catch (_) {
      rejectedShortKey = true;
    }
    assert(rejectedShortKey, 'setMasterKey rejects 16-byte key buffer (AES-128 is not permitted)');

    let rejectedShortHex = false;
    try {
      setMasterKey('1234567890abcdef'); // 16-char hex
    } catch (_) {
      rejectedShortHex = true;
    }
    assert(rejectedShortHex, 'setMasterKey rejects invalid length hex string');

    // Reset master key
    resetMasterKey();
    assert(getMasterKey().equals(originalKey), 'resetMasterKey restores system master key');
  }

  // Vector H: Masking Utility Resilience
  console.log('\n► Vector H: Masking utility resilience under adversarial inputs...');
  {
    assert(maskIban(null) === null, 'maskIban handles null');
    assert(maskIban(undefined) === undefined, 'maskIban handles undefined');
    assert(maskIban('') === '', 'maskIban handles empty string');
    assert(maskIban('TR12') === '****', 'maskIban handles short strings (<8 chars)');
    assert(maskIban('TR16 0006 2000 4170 0006 2894 77') === 'TR16 **** **** **** **** 9477', 'maskIban handles spaced IBAN');

    assert(maskTaxNumber(null) === null, 'maskTaxNumber handles null');
    assert(maskTaxNumber(undefined) === undefined, 'maskTaxNumber handles undefined');
    assert(maskTaxNumber('123') === '****', 'maskTaxNumber handles short strings (<6 chars)');
    assert(maskTaxNumber('1871741946') === '187****1946', 'maskTaxNumber formats 10-digit VKN');
    assert(maskTaxNumber('46849262292') === '468****2292', 'maskTaxNumber formats 11-digit TCKN');
  }

  // Vector I: Concurrent High-Volume Asynchronous Stress Test
  console.log('\n► Vector I: Concurrent High-Volume Asynchronous Stress Test (2,000 parallel ops)...');
  {
    const PARALLEL_OPS = 2000;
    const items = Array.from({ length: PARALLEL_OPS }, (_, i) => `IBAN-RECORD-${i}-${Math.random()}`);
    const t0 = performance.now();
    const encList = await Promise.all(items.map(x => Promise.resolve(encrypt(x))));
    const t1 = performance.now();
    const decList = await Promise.all(encList.map(x => Promise.resolve(decrypt(x))));
    const t2 = performance.now();

    assert(decList.every((val, idx) => val === items[idx]), 'All 2,000 concurrent operations roundtrip perfectly');
    console.log(`    2,000 Concurrent Encrypts: ${(t1 - t0).toFixed(2)}ms | 2,000 Concurrent Decrypts: ${(t2 - t1).toFixed(2)}ms`);
    assert(t1 - t0 < 100, '2,000 concurrent encrypts completed in < 100ms');
    assert(t2 - t1 < 100, '2,000 concurrent decrypts completed in < 100ms');
  }

  console.log('\n================================================================');
  console.log(`⚔️  ADVERSARIAL SUITE RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdversarialAudit().catch(err => {
  console.error('Fatal adversarial failure:', err);
  process.exit(1);
});
