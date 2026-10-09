/**
 * BROSAN TEKSTİL ERP — RFC 6238 TOTP UNIT & CRYPTOGRAPHY TEST SUITE
 * 
 * Verifies:
 * 1. RFC 6238 Appendix B Official Test Vectors (59s, 1111111109s, 1111111111s, 1234567890s, 2000000000s)
 * 2. Base32 Cryptographic Encoding & Decoding (RFC 4648, padding, whitespace, invalid char rejection)
 * 3. 160-bit Secret Generation & Entropy
 * 4. Time Window Drift Tolerance (offset -1, 0, +1)
 * 5. Monotonic Step Tracking Anti-Replay Defense (replay rejection with code 'REPLAY_ATTACK')
 * 6. Timing Attack Resistance (constant-time SHA-256 pre-digest comparison without RangeError)
 * 7. Single-Use Hashed Recovery Code Lifecycle (generation, timing-safe match, single-use burn)
 * 8. RFC 6238 OTPAuth URI & Pure JS QR Code (SVG & Data URL) Matrix Generator
 * 9. Dual-Tier JWT Session Model & Fail-Closed Route Enforcement (preAuthToken vs verified token)
 */

const assert = require('assert');
const crypto = require('crypto');
const totp = require('../server/totp');
const auth = require('../server/auth');

// ANSI Terminal Colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

async function runTotpUnitTests() {
  console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}🔐 BROSAN TEKSTİL ERP — RFC 6238 TOTP CRYPTOGRAPHIC ENGINE UNIT SUITE${colors.reset}`);
  console.log(`${colors.dim}Testing RFC 6238 test vectors, anti-replay, timing-safety & dual-tier tokens...${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  let passedTests = 0;
  let totalTests = 0;

  function runSubtest(name, fn) {
    totalTests++;
    try {
      fn();
      passedTests++;
      console.log(`  ${colors.green}✔ PASS${colors.reset} ${name}`);
    } catch (err) {
      console.error(`  ${colors.red}✖ FAIL${colors.reset} ${name}: ${err.message}`);
      throw err;
    }
  }

  // ==============================================================================
  // SECTION 1: RFC 6238 APPENDIX B OFFICIAL TEST VECTORS
  // ==============================================================================
  console.log(`${colors.bold}[SECTION 1] RFC 6238 Appendix B Official Test Vectors${colors.reset}`);
  const rfcAsciiSecret = '12345678901234567890';
  const rfcSecretBuf = Buffer.from(rfcAsciiSecret, 'ascii');
  const rfcBase32Secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

  const rfcVectors = [
    { time: 59, step: 1, exp6: '287082', exp8: '94287082' },
    { time: 1111111109, step: 37037036, exp6: '081804', exp8: '07081804' },
    { time: 1111111111, step: 37037037, exp6: '050471', exp8: '14050471' },
    { time: 1234567890, step: 41152263, exp6: '005924', exp8: '89005924' },
    { time: 2000000000, step: 66666666, exp6: '279037', exp8: '69279037' }
  ];

  runSubtest('RFC 6238 Secret Base32 decoding matches 20-byte ASCII secret', () => {
    const decoded = totp.base32Decode(rfcBase32Secret);
    assert.strictEqual(decoded.toString('ascii'), rfcAsciiSecret);
    assert.strictEqual(decoded.length, 20);
  });

  rfcVectors.forEach(v => {
    runSubtest(`RFC 6238 Appendix B Vector: Time ${v.time}s (Step ${v.step}) -> 6-digit [${v.exp6}], 8-digit [${v.exp8}]`, () => {
      const code6 = totp.generateOtpAtStep(rfcSecretBuf, v.step, 6);
      const code8 = totp.generateOtpAtStep(rfcSecretBuf, v.step, 8);
      assert.strictEqual(code6, v.exp6, `6-digit mismatch at step ${v.step}`);
      assert.strictEqual(code8, v.exp8, `8-digit mismatch at step ${v.step}`);
    });
  });

  // ==============================================================================
  // SECTION 2: BASE32 ENCODING & DECODING ROBUSTNESS
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 2] Base32 Encoding & Decoding Robustness (RFC 4648)${colors.reset}`);

  runSubtest('Base32 round-trip arbitrary buffer encoding/decoding', () => {
    for (let len = 1; len <= 32; len++) {
      const original = crypto.randomBytes(len);
      const encoded = totp.base32Encode(original);
      const decoded = totp.base32Decode(encoded);
      assert.ok(original.equals(decoded), `Round-trip failed for length ${len}`);
    }
  });

  runSubtest('Base32 decoding normalizes whitespace, dashes and lowercase characters', () => {
    const formatted = '  gez-dgn-bvgy-3tqo-jqge-zdgn-bvgy-3tqo-jq==  ';
    const decoded = totp.base32Decode(formatted);
    assert.strictEqual(decoded.toString('ascii'), rfcAsciiSecret);
  });

  runSubtest('Base32 decoding rejects invalid characters cleanly', () => {
    assert.throws(() => totp.base32Decode('GEZDGNBVGY3TQOJ8'), /Invalid Base32 character/);
    assert.throws(() => totp.base32Decode('INVALID!@#'), /Invalid Base32 character/);
  });

  // ==============================================================================
  // SECTION 3: 160-BIT SECRET GENERATION & HIGH-ENTROPY SPECIFICATION
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 3] 160-bit Secret Generation & Entropy${colors.reset}`);

  runSubtest('generateSecret produces 32-character Base32 string (160 bits)', () => {
    const secret = totp.generateSecret(20);
    assert.strictEqual(typeof secret, 'string');
    assert.strictEqual(secret.length, 32);
    const decoded = totp.base32Decode(secret);
    assert.strictEqual(decoded.length, 20);
  });

  runSubtest('generateSecret generates unique, non-colliding cryptographically random keys', () => {
    const seen = new Set();
    for (let i = 0; i < 50; i++) {
      const s = totp.generateSecret();
      assert.strictEqual(seen.has(s), false, 'Collision detected in secret generation');
      seen.add(s);
    }
  });

  // ==============================================================================
  // SECTION 4: TIME WINDOW DRIFT TOLERANCE
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 4] Time Window Drift Tolerance (±1 Step)${colors.reset}`);

  runSubtest('verifyTotp accepts current time step (offset 0)', () => {
    const secret = totp.generateSecret();
    const secretBuf = totp.base32Decode(secret);
    const currentStep = Math.floor(Date.now() / 1000 / 30);
    const code = totp.generateOtpAtStep(secretBuf, currentStep, 6);

    const result = totp.verifyTotp(secret, code, null, 1);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.step, BigInt(currentStep));
    assert.strictEqual(result.delta, 0);
  });

  runSubtest('verifyTotp accepts previous time step (offset -1, 30s drift)', () => {
    const secret = totp.generateSecret();
    const secretBuf = totp.base32Decode(secret);
    const currentStep = Math.floor(Date.now() / 1000 / 30);
    const code = totp.generateOtpAtStep(secretBuf, currentStep - 1, 6);

    const result = totp.verifyTotp(secret, code, null, 1);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.step, BigInt(currentStep - 1));
    assert.strictEqual(result.delta, -1);
  });

  runSubtest('verifyTotp accepts future time step (offset +1, 30s forward drift)', () => {
    const secret = totp.generateSecret();
    const secretBuf = totp.base32Decode(secret);
    const currentStep = Math.floor(Date.now() / 1000 / 30);
    const code = totp.generateOtpAtStep(secretBuf, currentStep + 1, 6);

    const result = totp.verifyTotp(secret, code, null, 1);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.step, BigInt(currentStep + 1));
    assert.strictEqual(result.delta, 1);
  });

  runSubtest('verifyTotp rejects steps outside tolerance window (offset -2 or +2 when window=1)', () => {
    const secret = totp.generateSecret();
    const secretBuf = totp.base32Decode(secret);
    const currentStep = Math.floor(Date.now() / 1000 / 30);
    const expiredCode = totp.generateOtpAtStep(secretBuf, currentStep - 2, 6);

    const result = totp.verifyTotp(secret, expiredCode, null, 1);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.code, 'INVALID_CODE');
  });

  // ==============================================================================
  // SECTION 5: MONOTONIC STEP TRACKING & ANTI-REPLAY ATTACK DEFENSE
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 5] Monotonic Step Tracking & Anti-Replay Defense${colors.reset}`);

  runSubtest('First code verification succeeds and records monotonic step', () => {
    const secret = totp.generateSecret();
    const secretBuf = totp.base32Decode(secret);
    const currentStep = Math.floor(Date.now() / 1000 / 30);
    const code = totp.generateOtpAtStep(secretBuf, currentStep, 6);

    const result = totp.verifyTotp(secret, code, null, 1);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.step, BigInt(currentStep));
  });

  runSubtest('Immediate replay of identical code within same window is REJECTED with REPLAY_ATTACK', () => {
    const secret = totp.generateSecret();
    const secretBuf = totp.base32Decode(secret);
    const currentStep = Math.floor(Date.now() / 1000 / 30);
    const code = totp.generateOtpAtStep(secretBuf, currentStep, 6);

    // Initial valid verification
    const firstCheck = totp.verifyTotp(secret, code, null, 1);
    assert.strictEqual(firstCheck.valid, true);
    const lastStepRecorded = firstCheck.step;

    // Adversarial replay attempt
    const replayCheck = totp.verifyTotp(secret, code, lastStepRecorded, 1);
    assert.strictEqual(replayCheck.valid, false, 'Replayed code must be rejected');
    assert.strictEqual(replayCheck.code, 'REPLAY_ATTACK', 'Error code must be REPLAY_ATTACK');
  });

  runSubtest('Replay of an earlier time step is REJECTED with REPLAY_ATTACK', () => {
    const secret = totp.generateSecret();
    const secretBuf = totp.base32Decode(secret);
    const currentStep = Math.floor(Date.now() / 1000 / 30);
    const earlierCode = totp.generateOtpAtStep(secretBuf, currentStep - 1, 6);

    // Simulating user already validated at currentStep
    const replayCheck = totp.verifyTotp(secret, earlierCode, BigInt(currentStep), 1);
    assert.strictEqual(replayCheck.valid, false);
    assert.strictEqual(replayCheck.code, 'REPLAY_ATTACK');
  });

  runSubtest('Future step verification succeeds after lastStep recorded', () => {
    const secret = totp.generateSecret();
    const secretBuf = totp.base32Decode(secret);
    const currentStep = Math.floor(Date.now() / 1000 / 30);
    const futureCode = totp.generateOtpAtStep(secretBuf, currentStep + 1, 6);

    const check = totp.verifyTotp(secret, futureCode, BigInt(currentStep), 1);
    assert.strictEqual(check.valid, true);
    assert.strictEqual(check.step, BigInt(currentStep + 1));
  });

  // ==============================================================================
  // SECTION 6: TIMING-ATTACK RESISTANCE & CONSTANT-TIME EQUALITY
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 6] Timing Attack Resistance & Constant-Time Equality${colors.reset}`);

  runSubtest('timingSafeCodeCheck returns true on identical strings', () => {
    assert.strictEqual(totp.timingSafeCodeCheck('654321', '654321'), true);
  });

  runSubtest('timingSafeCodeCheck returns false on mismatched strings', () => {
    assert.strictEqual(totp.timingSafeCodeCheck('654321', '654322'), false);
  });

  runSubtest('timingSafeCodeCheck does NOT throw RangeError on unequal string lengths', () => {
    assert.doesNotThrow(() => {
      const res1 = totp.timingSafeCodeCheck('1', '123456');
      assert.strictEqual(res1, false);
      const res2 = totp.timingSafeCodeCheck('12345678901234567890', '123456');
      assert.strictEqual(res2, false);
      const res3 = totp.timingSafeCodeCheck('', '123456');
      assert.strictEqual(res3, false);
    });
  });

  runSubtest('timingSafeCodeCheck execution latency differential < 15ms across 10,000 iterations', () => {
    const target = '583921';
    const match = '583921';
    const mismatchFirstChar = '083921';
    const mismatchLastChar = '583920';

    const iterations = 10000;

    // V8 JIT warmup to eliminate compilation skew
    for (let i = 0; i < 2000; i++) {
      totp.timingSafeCodeCheck(target, match);
      totp.timingSafeCodeCheck(target, mismatchFirstChar);
    }

    const t0 = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
      totp.timingSafeCodeCheck(target, match);
    }
    const t1 = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
      totp.timingSafeCodeCheck(target, mismatchFirstChar);
    }
    const t2 = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
      totp.timingSafeCodeCheck(target, mismatchLastChar);
    }
    const t3 = process.hrtime.bigint();

    const dMatchMs = Number(t1 - t0) / 1e6;
    const dDiffFirstMs = Number(t2 - t1) / 1e6;
    const dDiffLastMs = Number(t3 - t2) / 1e6;

    const maxDelta = Math.max(
      Math.abs(dMatchMs - dDiffFirstMs),
      Math.abs(dDiffFirstMs - dDiffLastMs),
      Math.abs(dMatchMs - dDiffLastMs)
    );

    assert.ok(maxDelta < 15.0, `Timing differential too high: ${maxDelta.toFixed(3)}ms (must be < 15ms)`);
  });

  // ==============================================================================
  // SECTION 7: SINGLE-USE HASHED RECOVERY CODES LIFECYCLE
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 7] Single-Use Hashed Recovery Code Lifecycle${colors.reset}`);

  runSubtest('generateRecoveryCodes generates 8 formatted codes and SHA-256 hashes', () => {
    const rec = totp.generateRecoveryCodes(8);
    assert.strictEqual(rec.plainCodes.length, 8);
    assert.strictEqual(rec.hashedCodes.length, 8);
    rec.plainCodes.forEach((c, idx) => {
      assert.ok(/^[A-F0-9]{5}-[A-F0-9]{5}$/.test(c), `Code format invalid: ${c}`);
      const clean = c.replace(/[^A-Z0-9]/g, '');
      const expectedHash = crypto.createHash('sha256').update(clean).digest('hex');
      assert.strictEqual(rec.hashedCodes[idx], expectedHash);
    });
  });

  runSubtest('verifyRecoveryCode successfully verifies valid code and removes it from list', () => {
    const rec = totp.generateRecoveryCodes(8);
    const codeToUse = rec.plainCodes[2];
    const check = totp.verifyRecoveryCode(codeToUse, rec.hashedCodes);
    assert.strictEqual(check.valid, true);
    assert.strictEqual(check.matchedIndex, 2);
    assert.strictEqual(check.remainingCodes.length, 7);

    // Replay of used code must fail
    const replayCheck = totp.verifyRecoveryCode(codeToUse, check.remainingCodes);
    assert.strictEqual(replayCheck.valid, false, 'Used recovery code must not be reusable');
  });

  // ==============================================================================
  // SECTION 8: OTPAUTH URI SPECIFICATION & PURE JS QR CODE GENERATOR
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 8] OTPAuth URI & Pure JS QR Matrix Generator${colors.reset}`);

  runSubtest('getOtpauthUri generates standard RFC 6238 URI compliant with Google Authenticator', () => {
    const uri = totp.getOtpauthUri('emre@brosantextile.com', 'JBSWY3DPEHPK3PXP', 'Brosan Tekstil');
    assert.ok(uri.startsWith('otpauth://totp/'));
    assert.ok(uri.includes('secret=JBSWY3DPEHPK3PXP'));
    assert.ok(uri.includes('issuer=Brosan%20Tekstil'));
    assert.ok(uri.includes('algorithm=SHA1'));
    assert.ok(uri.includes('digits=6'));
    assert.ok(uri.includes('period=30'));
  });

  runSubtest('generateQrSvg produces valid SVG and Data URL', () => {
    const uri = totp.getOtpauthUri('admin', 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 'Brosan Tekstil');
    const qr = totp.generateQrSvg(uri);
    assert.ok(typeof qr.svg === 'string');
    assert.ok(qr.svg.includes('<svg'));
    assert.ok(qr.svg.includes('</svg>'));
    assert.ok(qr.dataUrl.startsWith('data:image/svg+xml'));
    assert.ok(qr.size >= 21);
  });

  // ==============================================================================
  // SECTION 9: DUAL-TIER JWT SESSION MODEL & FAIL-CLOSED ROUTE ENFORCEMENT
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 9] Dual-Tier JWT Session Model & Fail-Closed Route Enforcement${colors.reset}`);

  runSubtest('generatePreAuthToken generates restricted token with role PRE_AUTH_2FA', () => {
    const mockUser = {
      id: 'usr-123',
      username: 'admin',
      fullName: 'Yunus Emre Gökalp',
      role: 'ADMIN',
      twoFactorEnabled: true
    };
    const preAuthToken = auth.generatePreAuthToken(mockUser);
    const decoded = auth.verifyToken(preAuthToken);
    assert.strictEqual(decoded.role, 'PRE_AUTH_2FA');
    assert.strictEqual(decoded.is2FAVerified, false);
    assert.strictEqual(decoded.type, 'PRE_AUTH_2FA');
    assert.strictEqual(decoded.username, 'admin');
  });

  runSubtest('requireAuth BLOCKS preAuthToken from accessing business routes (/api/accounts) with 401 UNAUTHORIZED_2FA_REQUIRED', () => {
    const mockUser = { id: 'usr-123', username: 'admin', role: 'ADMIN', twoFactorEnabled: true };
    const preAuthToken = auth.generatePreAuthToken(mockUser);

    let statusCode = 200;
    let responseData = null;
    let nextCalled = false;

    const mockReq = {
      path: '/api/accounts',
      headers: { authorization: `Bearer ${preAuthToken}` }
    };
    const mockRes = {
      status: (code) => {
        statusCode = code;
        return { json: (data) => { responseData = data; } };
      }
    };

    auth.requireAuth(mockReq, mockRes, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false, 'Next must NOT be called for unverified token on business route');
    assert.strictEqual(statusCode, 401, 'Status must be 401 Unauthorized');
    assert.strictEqual(responseData.code, 'UNAUTHORIZED_2FA_REQUIRED', 'Code must be UNAUTHORIZED_2FA_REQUIRED');
  });

  runSubtest('requireAuth BLOCKS preAuthToken from accessing /api/contacts with 401 UNAUTHORIZED_2FA_REQUIRED', () => {
    const mockUser = { id: 'usr-123', username: 'admin', role: 'ADMIN', twoFactorEnabled: true };
    const preAuthToken = auth.generatePreAuthToken(mockUser);

    let statusCode = 200;
    let responseData = null;
    let nextCalled = false;

    const mockReq = {
      path: '/api/contacts',
      headers: { authorization: `Bearer ${preAuthToken}` }
    };
    const mockRes = {
      status: (code) => {
        statusCode = code;
        return { json: (data) => { responseData = data; } };
      }
    };

    auth.requireAuth(mockReq, mockRes, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(responseData.code, 'UNAUTHORIZED_2FA_REQUIRED');
  });

  runSubtest('requireAuth ALLOWS preAuthToken to access /api/auth/2fa/verify endpoint', () => {
    const mockUser = { id: 'usr-123', username: 'admin', role: 'ADMIN', twoFactorEnabled: true };
    const preAuthToken = auth.generatePreAuthToken(mockUser);

    let nextCalled = false;
    const mockReq = {
      path: '/api/auth/2fa/verify',
      headers: { authorization: `Bearer ${preAuthToken}` }
    };
    const mockRes = {};

    auth.requireAuth(mockReq, mockRes, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true, 'Next must be called when accessing 2FA verify endpoint with preAuthToken');
    assert.strictEqual(mockReq.user.role, 'PRE_AUTH_2FA');
  });

  runSubtest('requireAuth ALLOWS verified high-privilege token to access business routes (/api/accounts)', () => {
    const mockUser = { id: 'usr-123', username: 'admin', role: 'ADMIN', twoFactorEnabled: true };
    const verifiedToken = auth.generateToken(mockUser, { is2FAVerified: true });

    let nextCalled = false;
    const mockReq = {
      path: '/api/accounts',
      headers: { authorization: `Bearer ${verifiedToken}` }
    };
    const mockRes = {};

    auth.requireAuth(mockReq, mockRes, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true, 'Next must be called when token is 2FA verified');
    assert.strictEqual(mockReq.user.is2FAVerified, true);
  });

  // ==============================================================================
  // SECTION 10: REAL EXPRESS SERVER LIVE HTTP INTEGRATION (END-TO-END)
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 10] Real Express Server Live HTTP Integration (End-to-End)${colors.reset}`);

  const app = require('../server/index');
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 10.1: Initial login without 2FA
    let initialLoginToken = null;
    await (async () => {
      totalTests++;
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'Brosan2026!SecureErp' })
      });
      assert.strictEqual(res.status, 200, 'Initial login should succeed');
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.requires2FA, false);
      assert.ok(data.token, 'Must return token');
      initialLoginToken = data.token;
      passedTests++;
      console.log(`  ${colors.green}✔ PASS${colors.reset} Initial login returns requires2FA: false and valid session token`);
    })();

    // 10.2: Check 2FA status initially (disabled)
    await (async () => {
      totalTests++;
      const res = await fetch(`${baseUrl}/api/auth/2fa/status`, {
        headers: { Authorization: `Bearer ${initialLoginToken}` }
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.enabled, false);
      passedTests++;
      console.log(`  ${colors.green}✔ PASS${colors.reset} Initial 2FA status returns enabled: false`);
    })();

    // 10.3: Initiate 2FA setup
    let setupSecret = null;
    let setupRecoveryCodes = null;
    await (async () => {
      totalTests++;
      const res = await fetch(`${baseUrl}/api/auth/2fa/setup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${initialLoginToken}` }
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.secret && data.secret.length === 32, 'Must return 32-char Base32 secret');
      assert.ok(data.otpauthUri.startsWith('otpauth://totp/'), 'Must return valid otpauth URI');
      assert.ok(data.qrCodeDataUrl.startsWith('data:image/svg+xml'), 'Must return valid QR Code Data URL');
      assert.ok(Array.isArray(data.recoveryCodes) && data.recoveryCodes.length === 8, 'Must return 8 recovery codes');
      setupSecret = data.secret;
      setupRecoveryCodes = data.recoveryCodes;
      passedTests++;
      console.log(`  ${colors.green}✔ PASS${colors.reset} POST /api/auth/2fa/setup issues Base32 secret, QR Code Data URL, and recovery codes`);
    })();

    // 10.4: Verify setup with invalid code (should fail)
    await (async () => {
      totalTests++;
      const res = await fetch(`${baseUrl}/api/auth/2fa/verify-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${initialLoginToken}`
        },
        body: JSON.stringify({ code: '000000' })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.code, 'INVALID_2FA_CODE');
      passedTests++;
      console.log(`  ${colors.green}✔ PASS${colors.reset} POST /api/auth/2fa/verify-setup rejects invalid code`);
    })();

    // 10.5: Verify setup with valid code (should activate 2FA)
    let postSetupToken = null;
    await (async () => {
      totalTests++;
      const secretBuf = totp.base32Decode(setupSecret);
      const currentStep = Math.floor(Date.now() / 1000 / 30);
      const validCode = totp.generateOtpAtStep(secretBuf, currentStep, 6);

      const res = await fetch(`${baseUrl}/api/auth/2fa/verify-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${initialLoginToken}`
        },
        body: JSON.stringify({ code: validCode })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.token, 'Must return new verified token');
      postSetupToken = data.token;
      passedTests++;
      console.log(`  ${colors.green}✔ PASS${colors.reset} POST /api/auth/2fa/verify-setup activates 2FA and returns updated token`);
    })();

    // 10.6: Confirm 2FA status is now enabled
    await (async () => {
      totalTests++;
      const res = await fetch(`${baseUrl}/api/auth/2fa/status`, {
        headers: { Authorization: `Bearer ${postSetupToken}` }
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.enabled, true);
      assert.strictEqual(data.verified, true);
      passedTests++;
      console.log(`  ${colors.green}✔ PASS${colors.reset} GET /api/auth/2fa/status confirms enabled: true, verified: true`);
    })();

    // 10.7: Login with 2FA active -> MUST return requires2FA: true and preAuthToken
    let activePreAuthToken = null;
    await (async () => {
      totalTests++;
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'Brosan2026!SecureErp' })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.requires2FA, true);
      assert.ok(data.preAuthToken, 'Must return preAuthToken');
      assert.strictEqual(data.token, undefined, 'Must NOT return high-privilege token yet');
      activePreAuthToken = data.preAuthToken;
      passedTests++;
      console.log(`  ${colors.green}✔ PASS${colors.reset} Login with active 2FA returns requires2FA: true and preAuthToken`);
    })();

    // 10.8: Attempt accessing business route (/api/accounts) with preAuthToken -> BLOCKED 401 UNAUTHORIZED_2FA_REQUIRED
    await (async () => {
      totalTests++;
      const res = await fetch(`${baseUrl}/api/accounts`, {
        headers: { Authorization: `Bearer ${activePreAuthToken}` }
      });
      assert.strictEqual(res.status, 401, 'Must be 401 Unauthorized');
      const data = await res.json();
      assert.strictEqual(data.code, 'UNAUTHORIZED_2FA_REQUIRED');
      passedTests++;
      console.log(`  ${colors.green}✔ PASS${colors.reset} Accessing /api/accounts with preAuthToken BLOCKED with 401 UNAUTHORIZED_2FA_REQUIRED`);
    })();

    // 10.9: Complete 2FA challenge via POST /api/auth/2fa/verify with valid code -> issues high-privilege token
    let fullSessionToken = null;
    let usedStep = null;
    await (async () => {
      totalTests++;
      const secretBuf = totp.base32Decode(setupSecret);
      const currentStep = Math.floor(Date.now() / 1000 / 30);
      // Use currentStep + 1 (future step in window) so it advances past the setup step
      usedStep = currentStep + 1;
      const validCode = totp.generateOtpAtStep(secretBuf, usedStep, 6);

      const res = await fetch(`${baseUrl}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activePreAuthToken}`
        },
        body: JSON.stringify({ code: validCode })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.token, 'Must issue high-privilege access token');
      fullSessionToken = data.token;
      passedTests++;
      console.log(`  ${colors.green}✔ PASS${colors.reset} POST /api/auth/2fa/verify validates code and issues high-privilege token`);
    })();

    // 10.10: Replay same code or reuse preAuthToken -> BLOCKED
    await (async () => {
      totalTests++;
      const secretBuf = totp.base32Decode(setupSecret);
      const replayedCode = totp.generateOtpAtStep(secretBuf, usedStep, 6);

      const res = await fetch(`${baseUrl}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activePreAuthToken}`
        },
        body: JSON.stringify({ code: replayedCode })
      });
      // preAuthToken is revoked or replay detected -> 401
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.ok(data.code === 'TOKEN_REVOKED' || data.code === 'REPLAY_ATTACK');
      passedTests++;
      console.log(`  ${colors.green}✔ PASS${colors.reset} Replaying preAuthToken or used code is rejected with HTTP 401`);
    })();

    // 10.11: Access protected routes with high-privilege verified token -> SUCCESS (HTTP 200)
    await (async () => {
      totalTests++;
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${fullSessionToken}` }
      });
      assert.strictEqual(res.status, 200, 'Protected route must return 200 with verified token');
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.username, 'admin');
      assert.strictEqual(data.user.is2FAVerified, true);
      passedTests++;
      console.log(`  ${colors.green}✔ PASS${colors.reset} Verified token successfully accesses protected routes with is2FAVerified: true (HTTP 200)`);
    })();

    // 10.12: Disable 2FA via POST /api/auth/2fa/disable using single-use recovery code
    await (async () => {
      totalTests++;
      const recoveryCode = setupRecoveryCodes[0];

      const res = await fetch(`${baseUrl}/api/auth/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${fullSessionToken}`
        },
        body: JSON.stringify({
          password: 'Brosan2026!SecureErp',
          code: recoveryCode
        })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      passedTests++;
      console.log(`  ${colors.green}✔ PASS${colors.reset} POST /api/auth/2fa/disable successfully disables 2FA`);
    })();

    // 10.13: Login after 2FA disable returns requires2FA: false
    await (async () => {
      totalTests++;
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'Brosan2026!SecureErp' })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.requires2FA, false);
      assert.ok(data.token);
      passedTests++;
      console.log(`  ${colors.green}✔ PASS${colors.reset} Post-disable login returns requires2FA: false and standard token`);
    })();

  } finally {
    await new Promise(resolve => server.close(resolve));
  }

  console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.green}🎉 ALL ${totalTests} TOTP & 2FA CRYPTOGRAPHIC UNIT TESTS PASSED (100% SUCCESS RATE)!${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);
}

runTotpUnitTests().catch(err => {
  console.error('\n💥 TOTP UNIT SUITE FAILED WITH ERROR:', err);
  process.exit(1);
});
