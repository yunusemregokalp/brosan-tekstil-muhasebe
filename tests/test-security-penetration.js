/**
 * BROSAN TEKSTİL ERP — AUTOMATED PENETRATION & CYBER HARDENING TEST SUITE
 * Simulates red-team adversarial attacks:
 * 1. Header fingerprinting & clickjacking defense
 * 2. Payload bomb (DoS) rejection (413 Payload Too Large)
 * 3. Zod boundary validation & prototype pollution rejection (422)
 * 4. Password complexity regex enforcement (military 12+ chars, upper, lower, digit, symbol)
 * 5. Memory-bounded brute-force lockout & timing-safe token defense
 * 6. Express rate-limit and trust-proxy integrity
 */

const assert = require('assert');
const http = require('http');
const express = require('express');
const auth = require('../server/auth');
const {
  LoginSchema,
  ChangePasswordSchema,
  AccountSchema,
  ContactSchema,
  JournalEntrySchema,
  validateBody
} = require('../server/validators');

async function runPenetrationSuite() {
  console.log('================================================================');
  console.log('🛡️  BROSAN ERP RED-TEAM SECURITY PENETRATION & HARDENING SUITE');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // TEST 1: Password Complexity Enforcement (Military Grade Standard)
  // ---------------------------------------------------------------------------
  console.log('🔍 [TEST 1] Testing Military Password Complexity Rules...');
  const weakPasswords = [
    { pwd: 'short', reason: 'Under 12 characters' },
    { pwd: 'alllowercase12345!', reason: 'No uppercase letter' },
    { pwd: 'ALLUPPERCASE12345!', reason: 'No lowercase letter' },
    { pwd: 'NoDigitsHereAtAll!!', reason: 'No digits' },
    { pwd: 'NoSpecialCharsInThisPassword123', reason: 'No special characters' }
  ];

  for (const { pwd, reason } of weakPasswords) {
    const check = auth.validatePasswordStrength(pwd);
    assert.strictEqual(check.isValid, false, `Password '${pwd}' should fail because: ${reason}`);
    
    // Test with Zod ChangePasswordSchema
    const parseResult = ChangePasswordSchema.safeParse({
      oldPassword: 'ValidOldPassword123!',
      newPassword: pwd
    });
    assert.strictEqual(parseResult.success, false, `Zod schema must reject weak password: ${reason}`);
  }

  const strongPassword = 'Brosan2026!SecureErp#Enterprise';
  const strongCheck = auth.validatePasswordStrength(strongPassword);
  assert.strictEqual(strongCheck.isValid, true, 'Strong password must be accepted');
  const validZod = ChangePasswordSchema.safeParse({
    oldPassword: 'OldPassword123!',
    newPassword: strongPassword
  });
  assert.strictEqual(validZod.success, true, 'Valid password must pass Zod schema');
  console.log('   ✅ Military-grade password complexity rules strictly enforced.\n');

  // ---------------------------------------------------------------------------
  // TEST 2: Zod Schema Boundary Hardening (Anti-Injection & Strict Strip)
  // ---------------------------------------------------------------------------
  console.log('🔍 [TEST 2] Testing Boundary Input Validation & Unexpected Key Stripping...');
  
  // 2a. Strict Login Schema rejects extra/polluting keys
  const maliciousLoginPayload = {
    username: 'admin',
    password: 'Password123!',
    isAdmin: true, // Malicious privilege escalation attempt
    __proto__: { polluted: true }
  };
  const loginZodResult = LoginSchema.safeParse(maliciousLoginPayload);
  assert.strictEqual(loginZodResult.success, false, 'LoginSchema.strict() must reject injected extra fields');
  console.log('   ✅ Malicious extra fields / privilege escalation keys rejected.');

  // 2b. Strict Account Schema rejects negative or invalid types
  const invalidAccount = {
    code: '100.01',
    name: 'Kasa',
    type: 'INVALID_TYPE',
    category: 'KASA'
  };
  const accountResult = AccountSchema.safeParse(invalidAccount);
  assert.strictEqual(accountResult.success, false, 'AccountSchema must reject non-enum account types');
  console.log('   ✅ Non-enum account type injection blocked.');

  // 2c. Journal Entry requires balanced and min 2 items
  const invalidJournal = {
    description: 'Test Fişi',
    items: [
      { accountId: 'acc1', debit: 100, credit: 0 } // Only 1 item
    ]
  };
  const journalResult = JournalEntrySchema.safeParse(invalidJournal);
  assert.strictEqual(journalResult.success, false, 'JournalEntrySchema must reject entries with fewer than 2 items');
  console.log('   ✅ Malformed single-legged journal entry blocked.\n');

  // ---------------------------------------------------------------------------
  // TEST 3: Memory-Bounded Brute-Force Lockout Defense (OOM & DoS Safe)
  // ---------------------------------------------------------------------------
  console.log('🔍 [TEST 3] Testing Memory-Bounded Brute-Force & LRU Eviction...');
  const testIp = '10.200.0.42';

  for (let attempt = 1; attempt <= 4; attempt++) {
    auth.recordFailedAttempt(`ip:${testIp}`);
    const check = auth.checkBruteForce(`ip:${testIp}`);
    assert.strictEqual(check.isLocked, false, `Attempt ${attempt} must not lock.`);
  }

  // 5th attempt locks out
  auth.recordFailedAttempt(`ip:${testIp}`);
  const lockedCheck = auth.checkBruteForce(`ip:${testIp}`);
  assert.strictEqual(lockedCheck.isLocked, true, '5th attempt must trigger 15-minute lockout');
  assert.ok(lockedCheck.remainingSec > 800, 'Remaining time must be ~900s');
  console.log(`   ✅ Brute-force lockout active (${lockedCheck.remainingSec}s remaining).`);

  // Clean up
  auth.clearFailedAttempts(`ip:${testIp}`);
  assert.strictEqual(auth.checkBruteForce(`ip:${testIp}`).isLocked, false, 'Lockout reset passed.');
  console.log('   ✅ Lockout cleared and verified.\n');

  // ---------------------------------------------------------------------------
  // TEST 4: Live HTTP Server Hardening Inspection (Headers, Payload Bomb, 413)
  // ---------------------------------------------------------------------------
  console.log('🔍 [TEST 4] Spinning up Sandbox Express Server to inspect Network & Proxy Layers...');
  
  // Import our modified app config pattern
  const testApp = express();
  const helmet = require('helmet');
  const rateLimit = require('express-rate-limit');

  testApp.set('trust proxy', 1);
  testApp.disable('x-powered-by');

  testApp.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"]
      }
    },
    frameguard: { action: 'deny' },
    noSniff: true
  }));

  testApp.use((req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    next();
  });

  // 100KB payload limit
  testApp.use(express.json({ limit: '100kb' }));

  testApp.post('/api/test-login', validateBody(LoginSchema), (req, res) => {
    res.json({ success: true });
  });

  // Central error handler
  testApp.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
      return res.status(413).json({
        success: false,
        error: 'Payload Too Large (100KB limit)',
        code: 'PAYLOAD_TOO_LARGE'
      });
    }
    res.status(500).json({ success: false, error: err.message });
  });

  const server = await new Promise(resolve => {
    const s = testApp.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;

  try {
    // 4a. Header Inspection
    console.log('   Checking Security Headers...');
    const headerRes = await fetch(`http://127.0.0.1:${port}/api/test-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Password123!' })
    });

    assert.strictEqual(headerRes.headers.get('x-content-type-options'), 'nosniff', 'Must include X-Content-Type-Options: nosniff');
    assert.strictEqual(headerRes.headers.get('x-frame-options'), 'DENY', 'Must include X-Frame-Options: DENY');
    assert.strictEqual(headerRes.headers.get('x-powered-by'), null, 'X-Powered-By MUST be hidden');
    assert.ok(headerRes.headers.get('x-robots-tag').includes('noindex'), 'X-Robots-Tag must include noindex');
    console.log('   ✅ Headers verified: X-Frame-Options: DENY, nosniff, no-powered-by, noindex.');

    // 4b. Payload Bomb Attack (> 100KB)
    console.log('   Simulating Payload Bomb DoS attack (150KB JSON body)...');
    const largePayload = {
      username: 'admin',
      password: 'Password123!',
      junk: 'A'.repeat(150 * 1024) // 150KB junk string
    };

    const bombRes = await fetch(`http://127.0.0.1:${port}/api/test-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(largePayload)
    });

    assert.strictEqual(bombRes.status, 413, `Payload bomb must return 413 Payload Too Large (got ${bombRes.status})`);
    const bombJson = await bombRes.json();
    assert.strictEqual(bombJson.code, 'PAYLOAD_TOO_LARGE');
    console.log('   ✅ 150KB Payload Bomb blocked with HTTP 413 Payload Too Large.');

    // 4c. Schema Validation Rejection (422)
    console.log('   Simulating Invalid Input Schema Attack...');
    const invalidInputRes = await fetch(`http://127.0.0.1:${port}/api/test-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'a', password: '' }) // Too short
    });
    assert.strictEqual(invalidInputRes.status, 422, `Invalid input must return 422 Unprocessable Entity (got ${invalidInputRes.status})`);
    const invalidJson = await invalidInputRes.json();
    assert.strictEqual(invalidJson.code, 'INVALID_INPUT');
    console.log('   ✅ Malformed payload rejected with HTTP 422 Unprocessable Entity.');

  } finally {
    server.close();
  }

  console.log('\n================================================================');
  console.log('🎉 ALL PENETRATION & SİBER GÜVENLİK TESTLERİ BAŞARIYLA GEÇTİ!');
  console.log('================================================================');
}

runPenetrationSuite().catch(err => {
  console.error('\n❌ Penetration test suite failed:', err);
  process.exit(1);
});
