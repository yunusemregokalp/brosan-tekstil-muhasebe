const auth = require('../server/auth');
const assert = require('assert');

async function runTests() {
  console.log('--- TEST 1: Password Hashing & Verification ---');
  const password = 'Brosan2026!SecureErp';
  const hash = auth.hashPassword(password);
  console.log('Generated hash:', hash.slice(0, 20) + '...');
  assert.ok(hash.startsWith('$2'), 'Hash must be valid bcrypt hash');
  
  const isValid = auth.verifyPassword(password, hash);
  assert.strictEqual(isValid, true, 'Correct password must verify');

  const isInvalid = auth.verifyPassword('WrongPassword123', hash);
  assert.strictEqual(isInvalid, false, 'Wrong password must be rejected');
  console.log('✓ Password hashing and verification passed');

  console.log('\n--- TEST 2: JWT Token Issuance & Verification ---');
  const mockUser = {
    id: 1,
    username: 'admin',
    fullName: 'Yunus Emre Gökalp',
    role: 'ADMIN'
  };
  const token = auth.generateToken(mockUser);
  assert.ok(typeof token === 'string' && token.length > 50, 'Token must be non-empty JWT string');
  console.log('Issued JWT:', token.slice(0, 30) + '...');

  const verifiedClaims = auth.verifyToken(token);
  assert.strictEqual(verifiedClaims.username, 'admin');
  assert.strictEqual(verifiedClaims.id, 1);
  assert.strictEqual(verifiedClaims.role, 'ADMIN');
  assert.strictEqual(verifiedClaims.fullName, 'Yunus Emre Gökalp');
  console.log('✓ JWT issuance and claim verification passed');

  console.log('\n--- TEST 3: Invalid / Tampered Token Rejection ---');
  const tamperedToken = token.slice(0, -5) + 'abcde';
  const tamperedResult = auth.verifyToken(tamperedToken);
  assert.strictEqual(tamperedResult, null, 'Tampered token must return null');
  console.log('✓ Tampered token rejected safely');

  console.log('\n--- TEST 4: Brute-Force Rate Limiter ---');
  const testKey = '192.168.1.99_brute_target';
  
  // First 4 attempts should not lock out
  for (let i = 1; i <= 4; i++) {
    const record = auth.recordFailedAttempt(testKey);
    const status = auth.checkBruteForce(testKey);
    assert.strictEqual(status.isLocked, false, `Attempt ${i} should not lock`);
    assert.strictEqual(record.count, i, `Count should be ${i}`);
  }

  // 5th attempt triggers lockout
  const lockedRecord = auth.recordFailedAttempt(testKey);
  assert.strictEqual(lockedRecord.count, 5, 'Count should be 5');
  assert.ok(lockedRecord.lockedUntil > Date.now(), 'lockedUntil must be in future');

  // Next check must confirm lockout
  const activeCheck = auth.checkBruteForce(testKey);
  assert.strictEqual(activeCheck.isLocked, true, 'Brute force check must return locked');
  assert.ok(activeCheck.remainingSec > 0, 'Remaining seconds must be positive');
  console.log(`✓ Brute-force lockout triggered correctly (${activeCheck.remainingSec}s remaining)`);

  // Clear lockout
  auth.clearFailedAttempts(testKey);
  const clearedCheck = auth.checkBruteForce(testKey);
  assert.strictEqual(clearedCheck.isLocked, false, 'Cleared attempt must not be locked');
  console.log('✓ Lockout reset verified');

  console.log('\n--- TEST 5: RequireAuth Middleware Simulation ---');
  // 5a. Missing token -> 401
  let statusCode = 200;
  let responseData = null;
  const mockReqNoAuth = { headers: {} };
  const mockResNoAuth = {
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => { responseData = data; }
      };
    }
  };
  let nextCalled = false;
  auth.requireAuth(mockReqNoAuth, mockResNoAuth, () => { nextCalled = true; });
  assert.strictEqual(statusCode, 401, 'Missing token must respond with 401');
  assert.strictEqual(nextCalled, false, 'Next must not be called when unauthenticated');
  assert.strictEqual(responseData.code, 'UNAUTHORIZED', 'Must return UNAUTHORIZED code');

  // 5b. Valid token -> next() called and req.user populated
  nextCalled = false;
  statusCode = 200;
  responseData = null;
  const mockReqValid = {
    headers: { authorization: `Bearer ${token}` }
  };
  const mockResValid = {};
  auth.requireAuth(mockReqValid, mockResValid, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true, 'Next must be called when token is valid');
  assert.strictEqual(mockReqValid.user.username, 'admin', 'req.user must be populated');
  console.log('✓ requireAuth middleware pass & fail-closed protection verified');

  console.log('\n========================================');
  console.log('ALL AUTH CYBER SECURITY UNIT TESTS PASSED!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
