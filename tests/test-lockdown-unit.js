/**
 * BROSAN TEKSTİL ERP — CITADEL SECURITY HARDENING
 * Unit & Integration Test Suite: Administrative Emergency Panic Lockdown Switch
 * 
 * Verifies:
 * 1. EmergencyLockdownManager core logic (state persistence, salt+hash, timing-safe equality)
 * 2. High-entropy phrase generation (format, randomness, no plaintext persistence)
 * 3. O(1) mass token invalidation via global revocation epoch before & after restore
 * 4. HTTP Express middleware lockdownGuard (503 on mutating methods, security headers, whitelists)
 * 5. Master recovery endpoints (/api/auth/emergency-lockdown/activate & restore)
 * 6. CLI execution handler (activate, status, restore)
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const auth = require('../server/auth');
const { lockdownManager, lockdownGuard, EmergencyLockdownManager } = require('../server/lockdown');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

const TEST_STATE_FILE = path.join(__dirname, '..', 'data', 'test_lockdown_state.json');

function sendRequest({ port, path = '/', method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqHeaders = {
      'Host': 'localhost',
      ...headers
    };
    if (payload && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function waitForNextSecond() {
  const currentSec = Math.floor(Date.now() / 1000);
  while (Math.floor(Date.now() / 1000) === currentSec) {
    await new Promise(r => setTimeout(r, 50));
  }
}

async function runLockdownTests() {
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bold}🔒 BROSAN CITADEL: EMERGENCY PANIC LOCKDOWN UNIT & INTEGRATION SUITE${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

  let totalPassed = 0;
  function pass(msg) {
    totalPassed++;
    console.log(`  ${colors.green}✔ PASS:${colors.reset} ${msg}`);
  }

  // Ensure clean starting state
  lockdownManager.reset();

  // ============================================================================
  // VECTOR 1: EmergencyLockdownManager Unit & High-Entropy Crypto
  // ============================================================================
  console.log(`\n${colors.bold}[VECTOR 1] EmergencyLockdownManager Unit & High-Entropy Crypto${colors.reset}`);
  {
    const mgr = new EmergencyLockdownManager({ stateFile: TEST_STATE_FILE });
    mgr.reset();

    assert.strictEqual(mgr.isLocked(), false, 'Manager must initialize unlocked');
    assert.strictEqual(mgr.getTokenRevocationEpoch(), 0, 'Initial revocation epoch must be 0');
    pass('Manager initializes in clean unlocked state');

    // High-entropy phrase format and randomness
    const phrases = new Set();
    for (let i = 0; i < 20; i++) {
      const phrase = mgr.generateRecoveryPhrase();
      assert.match(phrase, /^BROSAN-CITADEL-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/, 'Phrase must adhere to format');
      phrases.add(phrase);
    }
    assert.strictEqual(phrases.size, 20, 'Generated phrases must be mutually unique');
    pass('generateRecoveryPhrase produces formatted high-entropy unique keys');

    // Activation
    const actResult = mgr.activateLockdown({ initiatedBy: 'audit-tester', reason: 'UNIT_TEST_LOCKDOWN' });
    assert.strictEqual(actResult.success, true);
    assert.strictEqual(actResult.isLocked, true);
    assert.ok(typeof actResult.recoveryPhrase === 'string');
    assert.strictEqual(mgr.isLocked(), true);
    assert.ok(mgr.getTokenRevocationEpoch() > 0);
    pass('activateLockdown sets isLocked, returns phrase, updates revocation epoch');

    // Persistence on disk
    assert.ok(fs.existsSync(TEST_STATE_FILE), 'State file must be written to disk');
    const rawState = JSON.parse(fs.readFileSync(TEST_STATE_FILE, 'utf8'));
    assert.strictEqual(rawState.isLocked, true);
    assert.strictEqual(rawState.lockedBy, 'audit-tester');
    assert.strictEqual(rawState.reason, 'UNIT_TEST_LOCKDOWN');
    assert.ok(rawState.recoverySalt && rawState.recoveryHash);
    assert.strictEqual(rawState.recoveryPhrase, undefined, 'Plaintext recovery phrase must NEVER be written to disk');
    pass('Lockdown state safely persisted with salted SHA-256 hash (no plaintext secret on disk)');

    // Recovery phrase verification (timingSafeEqual)
    assert.strictEqual(mgr.verifyRecoveryPhrase(actResult.recoveryPhrase), true, 'Valid phrase verifies successfully');
    assert.strictEqual(mgr.verifyRecoveryPhrase('WRONG-PHRASE'), false, 'Wrong phrase rejected');
    assert.strictEqual(mgr.verifyRecoveryPhrase(''), false, 'Empty phrase rejected');
    assert.strictEqual(mgr.verifyRecoveryPhrase(null), false, 'Null phrase rejected');
    assert.strictEqual(mgr.verifyRecoveryPhrase(12345), false, 'Non-string phrase rejected');
    pass('verifyRecoveryPhrase constant-time verification accepts valid and rejects bogus phrases');

    // Environment master recovery key override test
    process.env.MASTER_RECOVERY_KEY = 'BROSAN-MASTER-OVERRIDE-EMERGENCY-2026';
    assert.strictEqual(mgr.verifyRecoveryPhrase('BROSAN-MASTER-OVERRIDE-EMERGENCY-2026'), true, 'Env master key override verified');
    delete process.env.MASTER_RECOVERY_KEY;
    pass('MASTER_RECOVERY_KEY fallback override verified');

    // Failed restore attempt
    const failRestore = mgr.restoreSystem('BROSAN-INVALID-KEY-XXXX');
    assert.strictEqual(failRestore.success, false);
    assert.strictEqual(failRestore.code, 'INVALID_RECOVERY_PHRASE');
    assert.strictEqual(mgr.isLocked(), true, 'System must stay locked on invalid recovery attempt');
    pass('Failed restore keeps system locked and returns INVALID_RECOVERY_PHRASE');

    // Successful restore
    const prevEpoch = mgr.getTokenRevocationEpoch();
    const succRestore = mgr.restoreSystem(actResult.recoveryPhrase);
    assert.strictEqual(succRestore.success, true);
    assert.strictEqual(succRestore.code, 'LOCKDOWN_RESTORED');
    assert.strictEqual(mgr.isLocked(), false);
    assert.strictEqual(mgr.getTokenRevocationEpoch(), prevEpoch, 'tokenRevocationEpoch must be preserved after restore');
    pass('Successful restore unlocks system and preserves tokenRevocationEpoch');

    mgr.reset();
  }

  // ============================================================================
  // VECTOR 2: O(1) Instantaneous Mass Token Invalidation
  // ============================================================================
  console.log(`\n${colors.bold}[VECTOR 2] O(1) Instantaneous Mass Token Invalidation via Revocation Epoch${colors.reset}`);
  {
    lockdownManager.reset();

    const mockAdmin = { id: 101, username: 'admin', role: 'ADMIN' };
    const mockUser = { id: 102, username: 'operator', role: 'USER' };

    // 1. Issue tokens before lockdown
    const preLockdownToken1 = auth.generateToken(mockAdmin);
    const preLockdownToken2 = auth.generateToken(mockUser);

    assert.strictEqual(auth.isTokenRevoked(preLockdownToken1), false, 'Token 1 must be active prior to lockdown');
    assert.strictEqual(auth.isTokenRevoked(preLockdownToken2), false, 'Token 2 must be active prior to lockdown');
    pass('Pre-lockdown tokens are valid and active prior to lockdown');

    // Wait 10ms to guarantee timestamp advancement
    await new Promise(r => setTimeout(r, 15));

    // 2. Activate lockdown
    const act = lockdownManager.activateLockdown({ initiatedBy: 'citadel-guard', reason: 'BREACH_SIMULATION' });
    pass('Panic lockdown activated with timestamp epoch');

    // 3. Both pre-lockdown tokens must be instantly revoked!
    assert.strictEqual(auth.isTokenRevoked(preLockdownToken1), true, 'Admin token 1 must be instantly revoked');
    assert.strictEqual(auth.isTokenRevoked(preLockdownToken2), true, 'User token 2 must be instantly revoked');
    pass('O(1) Mass Invalidation: 100% of issued JWTs instantly revoked upon lockdown');

    // 4. Restore system
    lockdownManager.restoreSystem(act.recoveryPhrase);
    assert.strictEqual(lockdownManager.isLocked(), false, 'System must be restored');
    pass('System restored via valid recovery phrase');

    // 5. Pre-lockdown tokens MUST REMAIN REVOKED after restore!
    assert.strictEqual(auth.isTokenRevoked(preLockdownToken1), true, 'Pre-lockdown token 1 must remain revoked after restore');
    assert.strictEqual(auth.isTokenRevoked(preLockdownToken2), true, 'Pre-lockdown token 2 must remain revoked after restore');
    pass('Pre-lockdown tokens remain permanently invalid even after system is restored');

    // 6. Tokens issued AFTER lockdown epoch must work!
    // Note: Since JWT iat has 1-second resolution per RFC 7519, wait for second rollover
    await waitForNextSecond();
    const postRestoreToken = auth.generateToken(mockAdmin);
    assert.strictEqual(auth.isTokenRevoked(postRestoreToken), false, 'Post-restore token issued after epoch must be valid');
    pass('New tokens issued post-restore are valid and functional');

    lockdownManager.reset();
  }

  // ============================================================================
  // VECTOR 3: Express Middleware lockdownGuard & HTTP Mutation Blocking
  // ============================================================================
  console.log(`\n${colors.bold}[VECTOR 3] Express lockdownGuard & HTTP Mutation Blocking${colors.reset}`);
  {
    const app = require('../server/index');
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    try {
      lockdownManager.reset();

      // Normal state: health probe returns 200
      const healthRes = await sendRequest({ port, path: '/api/health', method: 'GET' });
      assert.strictEqual(healthRes.statusCode, 200);
      pass('GET /api/health returns 200 OK when unlocked');

      // GET status endpoint returns isLocked: false
      const statusRes = await sendRequest({ port, path: '/api/auth/emergency-lockdown', method: 'GET' });
      assert.strictEqual(statusRes.statusCode, 200);
      assert.strictEqual(statusRes.json.isLocked, false);
      pass('GET /api/auth/emergency-lockdown returns isLocked: false');

      // Generate admin token and activate lockdown via HTTP endpoint
      const adminToken = auth.generateToken({ id: 1, username: 'admin', role: 'ADMIN' });
      const activateRes = await sendRequest({
        port,
        path: '/api/auth/emergency-lockdown/activate',
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` },
        body: { reason: 'AUTOMATED_SECURITY_DRILL' }
      });

      assert.strictEqual(activateRes.statusCode, 200);
      assert.strictEqual(activateRes.json.success, true);
      assert.strictEqual(activateRes.json.isLocked, true);
      const recoveryPhrase = activateRes.json.recoveryPhrase;
      assert.ok(recoveryPhrase, 'Recovery phrase must be returned to administrator');
      pass('POST /api/auth/emergency-lockdown/activate successfully engages lockdown');

      // Verify status endpoint reflects locked state
      const lockedStatusRes = await sendRequest({ port, path: '/api/auth/emergency-lockdown', method: 'GET' });
      assert.strictEqual(lockedStatusRes.statusCode, 200);
      assert.strictEqual(lockedStatusRes.json.isLocked, true);
      pass('GET /api/auth/emergency-lockdown confirms system is locked');

      // Mutating requests during lockdown MUST return 503 SYSTEM_IN_LOCKDOWN
      const mutatingMethods = [
        { method: 'POST', path: '/api/accounts', body: { code: '100' } },
        { method: 'PUT', path: '/api/accounts/1', body: { name: 'Kasa' } },
        { method: 'DELETE', path: '/api/contacts/1', body: {} },
        { method: 'PATCH', path: '/api/employees/1', body: { status: 'ACTIVE' } }
      ];

      for (const m of mutatingMethods) {
        const blockRes = await sendRequest({
          port,
          path: m.path,
          method: m.method,
          headers: { 'Authorization': `Bearer ${adminToken}` },
          body: m.body
        });

        assert.strictEqual(blockRes.statusCode, 503, `${m.method} ${m.path} must return HTTP 503`);
        assert.strictEqual(blockRes.json.code, 'SYSTEM_IN_LOCKDOWN');
        assert.strictEqual(blockRes.json.locked, true);
        assert.strictEqual(blockRes.headers['retry-after'], '300');
        assert.strictEqual(blockRes.headers['x-system-status'], 'LOCKEDDOWN');
        assert.strictEqual(blockRes.headers['x-robots-tag'], 'noindex, nofollow');
        assert.strictEqual(blockRes.headers['cache-control'], 'no-store, no-cache, must-revalidate');
        pass(`${m.method} request blocked with HTTP 503 SYSTEM_IN_LOCKDOWN and proper security headers`);
      }

      // Whitelist exemptions: Healthchecks remain HTTP 200 during lockdown
      const healthWhileLocked = await sendRequest({ port, path: '/api/health', method: 'GET' });
      assert.strictEqual(healthWhileLocked.statusCode, 200);
      pass('GET /api/health exempt from lockdown, returns 200 OK');

      // Invalid recovery phrase returns 403 INVALID_RECOVERY_PHRASE
      const badRestoreRes = await sendRequest({
        port,
        path: '/api/auth/emergency-lockdown/restore',
        method: 'POST',
        body: { recoveryPhrase: 'BROSAN-CITADEL-0000-0000-0000' }
      });
      assert.strictEqual(badRestoreRes.statusCode, 403);
      assert.strictEqual(badRestoreRes.json.code, 'INVALID_RECOVERY_PHRASE');
      assert.strictEqual(lockdownManager.isLocked(), true);
      pass('POST /api/auth/emergency-lockdown/restore rejects wrong phrase with HTTP 403');

      // Missing recovery phrase returns 400 MISSING_RECOVERY_PHRASE
      const missingRestoreRes = await sendRequest({
        port,
        path: '/api/auth/emergency-lockdown/restore',
        method: 'POST',
        body: {}
      });
      assert.strictEqual(missingRestoreRes.statusCode, 400);
      assert.strictEqual(missingRestoreRes.json.code, 'MISSING_RECOVERY_PHRASE');
      pass('POST /api/auth/emergency-lockdown/restore requires recoveryPhrase (400)');

      // Valid restore unlocks system via HTTP endpoint
      const goodRestoreRes = await sendRequest({
        port,
        path: '/api/auth/emergency-lockdown/restore',
        method: 'POST',
        body: { recoveryPhrase }
      });
      assert.strictEqual(goodRestoreRes.statusCode, 200);
      assert.strictEqual(goodRestoreRes.json.code, 'LOCKDOWN_RESTORED');
      assert.strictEqual(lockdownManager.isLocked(), false);
      pass('POST /api/auth/emergency-lockdown/restore unlocks system with HTTP 200');

      // Verify pre-lockdown admin token is STILL rejected by auth middleware
      const preTokenAttempt = await sendRequest({
        port,
        path: '/api/auth/me',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      assert.strictEqual(preTokenAttempt.statusCode, 401);
      assert.strictEqual(preTokenAttempt.json.code, 'TOKEN_REVOKED');
      pass('Pre-lockdown token is rejected with 401 TOKEN_REVOKED by requireAuth even after restore');

      // Fresh token issued after restore works normally
      await waitForNextSecond();
      const freshAdminToken = auth.generateToken({ id: 1, username: 'admin', role: 'ADMIN' });
      const freshTokenAttempt = await sendRequest({
        port,
        path: '/api/auth/me',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${freshAdminToken}` }
      });
      assert.strictEqual(freshTokenAttempt.statusCode, 200);
      assert.strictEqual(freshTokenAttempt.json.user.username, 'admin');
      pass('Fresh token issued post-restore succeeds on protected endpoints');

    } finally {
      await new Promise((resolve) => server.close(resolve));
      lockdownManager.reset();
    }
  }

  // ============================================================================
  // VECTOR 4: CLI Execution Handler (activate, status, restore)
  // ============================================================================
  console.log(`\n${colors.bold}[VECTOR 4] CLI Execution Handler (activate, status, restore)${colors.reset}`);
  {
    lockdownManager.reset();
    const cliScript = path.join(__dirname, '..', 'server', 'lockdown.js');

    // 1. Check CLI status
    const initialStatusOut = execSync(`node "${cliScript}" status`, { encoding: 'utf8' });
    assert.ok(initialStatusOut.includes('AKTİF (NORMAL)'));
    pass('CLI status reports AKTİF (NORMAL)');

    // 2. Activate via CLI
    const activateOut = execSync(`node "${cliScript}" activate --reason "CLI_TEST_RUN"`, { encoding: 'utf8' });
    assert.ok(activateOut.includes('PANIC LOCKDOWN) AKTİF EDİLDİ'));
    const match = activateOut.match(/BROSAN-CITADEL-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}/);
    assert.ok(match && match[0], 'CLI must output generated recovery phrase');
    const cliPhrase = match[0];
    pass(`CLI activate initiates lockdown and outputs recovery phrase: ${cliPhrase}`);

    // 3. Status confirms locked
    const lockedStatusOut = execSync(`node "${cliScript}" status`, { encoding: 'utf8' });
    assert.ok(lockedStatusOut.includes('KİLİTLİ (LOCKED)'));
    pass('CLI status confirms KİLİTLİ (LOCKED)');

    // 4. Restore with wrong phrase exits with error code 1
    let failedAsExpected = false;
    try {
      execSync(`node "${cliScript}" restore BROSAN-WRONG-PHRASE`, { encoding: 'utf8', stdio: 'pipe' });
    } catch (err) {
      failedAsExpected = true;
      assert.strictEqual(err.status, 1);
    }
    assert.strictEqual(failedAsExpected, true, 'CLI restore with wrong phrase must exit with code 1');
    pass('CLI restore rejects invalid recovery phrase');

    // 5. Restore with correct phrase
    const restoreOut = execSync(`node "${cliScript}" restore "${cliPhrase}"`, { encoding: 'utf8' });
    assert.ok(restoreOut.includes('RESTORE SUCCESS'));
    pass('CLI restore succeeds with valid recovery phrase');

    // 6. Final status confirms unlocked
    const finalStatusOut = execSync(`node "${cliScript}" status`, { encoding: 'utf8' });
    assert.ok(finalStatusOut.includes('AKTİF (NORMAL)'));
    pass('CLI status confirms system returned to AKTİF (NORMAL)');

    lockdownManager.reset();
  }

  // Teardown test files
  if (fs.existsSync(TEST_STATE_FILE)) {
    try { fs.unlinkSync(TEST_STATE_FILE); } catch (_) {}
  }

  console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.green}🎉 ALL ${totalPassed} LOCKDOWN UNIT & INTEGRATION TEST ASSERTIONS PASSED 100%!${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);
}

if (require.main === module) {
  runLockdownTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(`\n${colors.red}✖ TEST SUITE FAILED:${colors.reset}`, err);
      process.exit(1);
    });
}

module.exports = runLockdownTests;
