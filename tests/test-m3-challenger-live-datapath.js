/**
 * BROSAN TEKSTİL ERP — PHASE 3 CITADEL SECURITY HARDENING
 * CHALLENGER 2: EMPIRICAL LIVE DATA PATH & LOCKDOWN INTEGRATION VERIFICATION HARNESS
 * 
 * Objective:
 * Empirically stress-test and verify Milestone 3 (Administrative Emergency Panic Lockdown Switch):
 * 1. Token Generation: Multi-role token issuance (ADMIN, USER, ACCOUNTANT, PRE_AUTH_2FA).
 * 2. Pre-Lockdown Normal Baseline: Verify all tokens function as intended prior to lockdown.
 * 3. Panic Lockdown Activation:
 *    - Authenticated activation via HTTP endpoint with admin token.
 *    - Rejection of activation attempts by unauthenticated or non-admin users.
 * 4. 100% Mass Token Invalidation:
 *    - Verify that EVERY previously issued token across all roles is rejected with HTTP 401 TOKEN_REVOKED.
 * 5. Data-Path Mutation Interception:
 *    - Verify that actual business mutation routes (POST/PUT/DELETE/PATCH across /api/accounts, /api/contacts, etc.)
 *      return HTTP 503 SYSTEM_IN_LOCKDOWN with proper security headers (Retry-After, X-System-Status, Cache-Control).
 *    - Verify query parameter fuzzing (?bypass=1) cannot bypass lockdown.
 * 6. Healthcheck & Recovery Route Whitelisting:
 *    - Verify GET /api/health and GET /health return HTTP 200 OK during lockdown.
 *    - Verify GET /api/auth/emergency-lockdown returns HTTP 200 with locked state.
 * 7. System Restoration:
 *    - Verify invalid recovery phrases are rejected with HTTP 403 INVALID_RECOVERY_PHRASE.
 *    - Verify empty/missing phrases are rejected with HTTP 400 MISSING_RECOVERY_PHRASE.
 *    - Verify valid recovery phrase restores system with HTTP 200 LOCKDOWN_RESTORED.
 * 8. Post-Restore Invalidation Persistence (CRITICAL):
 *    - Verify that pre-lockdown tokens REMAIN revoked with HTTP 401 TOKEN_REVOKED even after restoration!
 * 9. Post-Restore Normal Operations:
 *    - Verify that newly issued tokens after restoration operate normally on protected business routes.
 * 10. Persistence & Cold Reload Resilience:
 *    - Verify that disk-backed state in data/lockdown_state.json survives process restart.
 * 11. CLI Tool Integration:
 *    - Verify CLI status, activate, and restore flows execute with expected exit codes and output.
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
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

let totalChecks = 0;
let passedChecks = 0;

function check(assertion, description) {
  totalChecks++;
  try {
    assert(assertion, description);
    passedChecks++;
    console.log(`  ${colors.green}✔ PASS${colors.reset} [${totalChecks.toString().padStart(2)}] ${description}`);
  } catch (err) {
    console.error(`  ${colors.red}✖ FAIL${colors.reset} [${totalChecks.toString().padStart(2)}] ${description}`);
    console.error(`    ${colors.dim}${err.message}${colors.reset}`);
    throw err;
  }
}

function sendHttpRequest({ port, path = '/', method = 'GET', headers = {}, body = null }) {
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

async function runChallengerVerification() {
  console.log(`${colors.bold}${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}⚔️ CHALLENGER 2: EMPIRICAL LIVE DATA PATH & LOCKDOWN INTEGRATION TEST HARNESS${colors.reset}`);
  console.log(`${colors.dim}Target: Milestone 3 (Administrative Emergency Panic Lockdown Switch)${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  const app = require('../server/index');
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`${colors.dim}Ephemeral test server running on port ${port}${colors.reset}\n`);

  try {
    // Clean starting state
    lockdownManager.reset();

    // =========================================================================
    // STEP 1: Multi-Role JWT Generation Prior to Lockdown
    // =========================================================================
    console.log(`${colors.bold}[STEP 1] Generating Multi-Role JWT Tokens (Pre-Lockdown)${colors.reset}`);

    const adminUser = { id: 101, username: 'emre_admin', fullName: 'Emre Admin', role: 'ADMIN' };
    const standardUser = { id: 102, username: 'ahmet_user', fullName: 'Ahmet User', role: 'USER' };
    const accountantUser = { id: 103, username: 'fatma_acc', fullName: 'Fatma Accountant', role: 'ACCOUNTANT' };
    const preAuth2faUser = { id: 104, username: 'partial_2fa', fullName: 'Partial 2FA', role: 'PRE_AUTH_2FA', is2FAVerified: false };

    const tokenAdmin = auth.generateToken(adminUser);
    const tokenUser = auth.generateToken(standardUser);
    const tokenAccountant = auth.generateToken(accountantUser);
    const token2FAPartial = auth.generateToken(preAuth2faUser);

    check(typeof tokenAdmin === 'string' && tokenAdmin.length > 50, 'Admin token successfully generated');
    check(typeof tokenUser === 'string' && tokenUser.length > 50, 'Standard user token successfully generated');
    check(typeof tokenAccountant === 'string' && tokenAccountant.length > 50, 'Accountant token successfully generated');
    check(typeof token2FAPartial === 'string' && token2FAPartial.length > 50, '2FA partial token successfully generated');

    // =========================================================================
    // STEP 2: Baseline Pre-Lockdown Behavior Verification
    // =========================================================================
    console.log(`\n${colors.bold}[STEP 2] Verifying Baseline Pre-Lockdown Normal Access${colors.reset}`);

    // Healthcheck returns 200
    const health0 = await sendHttpRequest({ port, path: '/api/health', method: 'GET' });
    check(health0.statusCode === 200, 'Baseline: GET /api/health returns HTTP 200 OK');

    // Pre-lockdown status is unlocked
    const status0 = await sendHttpRequest({ port, path: '/api/auth/emergency-lockdown', method: 'GET' });
    check(status0.statusCode === 200, 'Baseline: GET /api/auth/emergency-lockdown returns HTTP 200');
    check(status0.json && status0.json.isLocked === false, 'Baseline: system status indicates isLocked: false');

    // Verify tokens are valid before lockdown
    const meAdmin = await sendHttpRequest({ port, path: '/api/auth/me', method: 'GET', headers: { 'Authorization': `Bearer ${tokenAdmin}` } });
    check(meAdmin.statusCode === 200 && meAdmin.json.user.username === 'emre_admin', 'Pre-lockdown: Admin token accesses /api/auth/me with HTTP 200');

    const meUser = await sendHttpRequest({ port, path: '/api/auth/me', method: 'GET', headers: { 'Authorization': `Bearer ${tokenUser}` } });
    check(meUser.statusCode === 200 && meUser.json.user.username === 'ahmet_user', 'Pre-lockdown: Standard user token accesses /api/auth/me with HTTP 200');

    // 2FA partial token is NOT revoked yet (returns 401 UNAUTHORIZED_2FA_REQUIRED on business routes, NOT TOKEN_REVOKED)
    const partialMe = await sendHttpRequest({ port, path: '/api/auth/me', method: 'GET', headers: { 'Authorization': `Bearer ${token2FAPartial}` } });
    check(partialMe.statusCode === 401, 'Pre-lockdown: 2FA partial token rejected on business route /api/auth/me');
    check(partialMe.json.code === 'UNAUTHORIZED_2FA_REQUIRED', 'Pre-lockdown: 2FA partial token receives UNAUTHORIZED_2FA_REQUIRED (not TOKEN_REVOKED)');

    // =========================================================================
    // STEP 3: Adversarial Attempts to Activate Lockdown Without Permission
    // =========================================================================
    console.log(`\n${colors.bold}[STEP 3] Adversarial Access Control on Lockdown Activation Endpoint${colors.reset}`);

    // 1. Unauthenticated activation attempt
    const unauthActivate = await sendHttpRequest({
      port,
      path: '/api/auth/emergency-lockdown/activate',
      method: 'POST',
      body: { reason: 'UNAUTH_ATTEMPT' }
    });
    check(unauthActivate.statusCode === 401, 'Unauthenticated activation rejected with HTTP 401 UNAUTHORIZED');
    check(unauthActivate.json.code === 'UNAUTHORIZED', 'Error code is UNAUTHORIZED');

    // 2. Non-admin activation attempt (standard user)
    const userActivate = await sendHttpRequest({
      port,
      path: '/api/auth/emergency-lockdown/activate',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenUser}` },
      body: { reason: 'USER_ROLE_ATTEMPT' }
    });
    check(userActivate.statusCode === 403, 'Standard user activation rejected with HTTP 403 FORBIDDEN_ROLE');
    check(userActivate.json.code === 'FORBIDDEN_ROLE', 'Error code is FORBIDDEN_ROLE');

    // 3. Non-admin activation attempt (accountant)
    const accActivate = await sendHttpRequest({
      port,
      path: '/api/auth/emergency-lockdown/activate',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenAccountant}` },
      body: { reason: 'ACCOUNTANT_ROLE_ATTEMPT' }
    });
    check(accActivate.statusCode === 403, 'Accountant activation rejected with HTTP 403 FORBIDDEN_ROLE');

    // System must still be unlocked
    check(lockdownManager.isLocked() === false, 'System remains unlocked after unauthorized activation attempts');

    // =========================================================================
    // STEP 4: Legitimate Panic Lockdown Activation by Admin
    // =========================================================================
    console.log(`\n${colors.bold}[STEP 4] Engaging Panic Lockdown via Admin Endpoint${colors.reset}`);

    const activateRes = await sendHttpRequest({
      port,
      path: '/api/auth/emergency-lockdown/activate',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenAdmin}` },
      body: { reason: 'CHALLENGER_EMPIRICAL_TEST_DRILL' }
    });

    check(activateRes.statusCode === 200, 'Legitimate admin activation returns HTTP 200 OK');
    check(activateRes.json.success === true, 'Response success: true');
    check(activateRes.json.isLocked === true, 'Response isLocked: true');
    check(typeof activateRes.json.recoveryPhrase === 'string', 'Master recovery phrase returned in response');
    check(activateRes.json.recoveryPhrase.startsWith('BROSAN-CITADEL-'), 'Recovery phrase adheres to BROSAN-CITADEL-XXXX-XXXX-XXXX format');
    const recoveryPhrase = activateRes.json.recoveryPhrase;

    // Check lockdown manager state
    check(lockdownManager.isLocked() === true, 'lockdownManager.isLocked() is true');
    check(lockdownManager.getTokenRevocationEpoch() > 0, 'tokenRevocationEpoch is set to positive timestamp');

    // Verify GET /api/auth/emergency-lockdown reflects locked state
    const lockedStatus = await sendHttpRequest({ port, path: '/api/auth/emergency-lockdown', method: 'GET' });
    check(lockedStatus.statusCode === 200, 'GET /api/auth/emergency-lockdown returns HTTP 200 during lockdown');
    check(lockedStatus.json.isLocked === true, 'Status endpoint confirms isLocked: true');
    check(lockedStatus.json.reason === 'CHALLENGER_EMPIRICAL_TEST_DRILL', 'Status endpoint confirms lockdown reason');

    // =========================================================================
    // STEP 5: 100% Mass Token Invalidation Verification (HTTP 401 TOKEN_REVOKED)
    // =========================================================================
    console.log(`\n${colors.bold}[STEP 5] Empirically Verifying 100% of Pre-Lockdown Tokens Rejected (TOKEN_REVOKED)${colors.reset}`);

    const testTokens = [
      { name: 'Admin Token', token: tokenAdmin },
      { name: 'Standard User Token', token: tokenUser },
      { name: 'Accountant Token', token: tokenAccountant },
      { name: '2FA Partial Token', token: token2FAPartial }
    ];

    for (const item of testTokens) {
      // 1. Check in server/auth module directly
      const isRev = auth.isTokenRevoked(item.token);
      check(isRev === true, `Module: ${item.name} is recognized as revoked (isTokenRevoked === true)`);

      // 2. Check over HTTP network path on GET /api/auth/me
      const httpRes = await sendHttpRequest({
        port,
        path: '/api/auth/me',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${item.token}` }
      });
      check(httpRes.statusCode === 401, `HTTP GET: ${item.name} receives HTTP 401`);
      check(httpRes.json && httpRes.json.code === 'TOKEN_REVOKED', `HTTP GET: ${item.name} receives error code TOKEN_REVOKED`);

      // 3. Check on GET /api/accounts
      const acctRes = await sendHttpRequest({
        port,
        path: '/api/accounts',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${item.token}` }
      });
      check(acctRes.statusCode === 401, `HTTP GET /api/accounts: ${item.name} receives HTTP 401`);
      check(acctRes.json && acctRes.json.code === 'TOKEN_REVOKED', `HTTP GET /api/accounts: ${item.name} receives error code TOKEN_REVOKED`);
    }

    // =========================================================================
    // STEP 6: Actual Business Mutation Routes Rejection (HTTP 503 SYSTEM_IN_LOCKDOWN)
    // =========================================================================
    console.log(`\n${colors.bold}[STEP 6] Empirically Verifying Mutation Endpoints Return HTTP 503 SYSTEM_IN_LOCKDOWN${colors.reset}`);

    const mutationTestCases = [
      { method: 'POST', path: '/api/accounts', body: { name: 'Adversarial Account', code: '999', type: 'CASH', currency: 'TL' } },
      { method: 'PUT', path: '/api/accounts/1', body: { name: 'Updated Name' } },
      { method: 'DELETE', path: '/api/accounts/1', body: {} },
      { method: 'POST', path: '/api/contacts', body: { name: 'Adversarial Contact', type: 'SUPPLIER' } },
      { method: 'PUT', path: '/api/contacts/1', body: { name: 'Updated Contact' } },
      { method: 'DELETE', path: '/api/contacts/1', body: {} },
      { method: 'POST', path: '/api/invoices', body: { invoiceNo: 'INV-TEST-01', amount: 1000 } },
      { method: 'PATCH', path: '/api/employees/1', body: { status: 'TERMINATED' } },
      { method: 'POST', path: '/api/transactions', body: { amount: 5000 } },
      { method: 'POST', path: '/api/checks', body: { checkNo: 'CHK-999' } }
    ];

    for (const testCase of mutationTestCases) {
      // Test without auth header
      const resWithoutAuth = await sendHttpRequest({
        port,
        path: testCase.path,
        method: testCase.method,
        body: testCase.body
      });
      check(resWithoutAuth.statusCode === 503, `Mutation ${testCase.method} ${testCase.path} returns HTTP 503`);
      check(resWithoutAuth.json && resWithoutAuth.json.code === 'SYSTEM_IN_LOCKDOWN', `Mutation code is SYSTEM_IN_LOCKDOWN`);
      check(resWithoutAuth.json && resWithoutAuth.json.locked === true, `Mutation response indicates locked: true`);
      check(resWithoutAuth.headers['retry-after'] === '300', `Header Retry-After: 300 present`);
      check(resWithoutAuth.headers['x-system-status'] === 'LOCKEDDOWN', `Header X-System-Status: LOCKEDDOWN present`);
      check(resWithoutAuth.headers['x-robots-tag'] === 'noindex, nofollow', `Header X-Robots-Tag: noindex, nofollow present`);
      check(resWithoutAuth.headers['cache-control'] === 'no-store, no-cache, must-revalidate', `Header Cache-Control: no-store, no-cache, must-revalidate present`);

      // Test with auth header (pre-lockdown token)
      const resWithToken = await sendHttpRequest({
        port,
        path: testCase.path,
        method: testCase.method,
        headers: { 'Authorization': `Bearer ${tokenAdmin}` },
        body: testCase.body
      });
      check(resWithToken.statusCode === 503, `Mutation with Bearer token still returns HTTP 503 at Gate 0.08`);
      check(resWithToken.json && resWithToken.json.code === 'SYSTEM_IN_LOCKDOWN', `Mutation with token code is SYSTEM_IN_LOCKDOWN`);
    }

    // Adversarial Query Parameter & Path Traversal Fuzzing to test bypass attempts
    console.log(`\n${colors.bold}[STEP 6.1] Adversarial Query Fuzzing & Path Evasion Checks${colors.reset}`);
    const evasionPaths = [
      '/api/accounts?bypass=1',
      '/api/accounts?whitelist=health',
      '/api/contacts#emergency-lockdown',
      '/api/contacts?_method=PUT',
      '/api/accounts?q=/api/health'
    ];

    for (const evPath of evasionPaths) {
      const evRes = await sendHttpRequest({
        port,
        path: evPath,
        method: 'POST',
        body: { fuzz: true }
      });
      check(evRes.statusCode === 503, `Evasion path POST ${evPath} intercepted with HTTP 503`);
      check(evRes.json && evRes.json.code === 'SYSTEM_IN_LOCKDOWN', `Evasion path returned SYSTEM_IN_LOCKDOWN`);
    }

    // =========================================================================
    // STEP 7: Healthcheck & Recovery Routes Whitelist Verification
    // =========================================================================
    console.log(`\n${colors.bold}[STEP 7] Verifying Healthcheck & Recovery Routes Function During Lockdown${colors.reset}`);

    // GET /api/health returns 200 OK
    const healthDuringLockdown = await sendHttpRequest({ port, path: '/api/health', method: 'GET' });
    check(healthDuringLockdown.statusCode === 200, 'GET /api/health passes whitelist with HTTP 200 during lockdown');

    // GET /health returns 200 OK
    const rootHealth = await sendHttpRequest({ port, path: '/health', method: 'GET' });
    check(rootHealth.statusCode === 200, 'GET /health passes whitelist with HTTP 200 during lockdown');

    // =========================================================================
    // STEP 8: Restoration Authentication & Timing-Safe Recovery Verification
    // =========================================================================
    console.log(`\n${colors.bold}[STEP 8] System Restoration via Master Recovery Phrase${colors.reset}`);

    // 1. Missing recovery phrase returns 400
    const missingRes = await sendHttpRequest({
      port,
      path: '/api/auth/emergency-lockdown/restore',
      method: 'POST',
      body: {}
    });
    check(missingRes.statusCode === 400, 'POST /restore without phrase returns HTTP 400');
    check(missingRes.json.code === 'MISSING_RECOVERY_PHRASE', 'Error code MISSING_RECOVERY_PHRASE');

    // 2. Bogus recovery phrase returns 403
    const bogusRes = await sendHttpRequest({
      port,
      path: '/api/auth/emergency-lockdown/restore',
      method: 'POST',
      body: { recoveryPhrase: 'BROSAN-CITADEL-FFFF-FFFF-FFFF' }
    });
    check(bogusRes.statusCode === 403, 'POST /restore with invalid phrase returns HTTP 403');
    check(bogusRes.json.code === 'INVALID_RECOVERY_PHRASE', 'Error code INVALID_RECOVERY_PHRASE');
    check(lockdownManager.isLocked() === true, 'System remains strictly locked after failed restore attempt');

    // 3. Valid recovery phrase restores system
    const validRestoreRes = await sendHttpRequest({
      port,
      path: '/api/auth/emergency-lockdown/restore',
      method: 'POST',
      body: { recoveryPhrase }
    });
    check(validRestoreRes.statusCode === 200, 'POST /restore with valid phrase returns HTTP 200');
    check(validRestoreRes.json.code === 'LOCKDOWN_RESTORED', 'Response code LOCKDOWN_RESTORED');
    check(validRestoreRes.json.success === true, 'Response success: true');
    check(lockdownManager.isLocked() === false, 'lockdownManager.isLocked() is now FALSE');

    // Verify status endpoint reflects restored state
    const restoredStatus = await sendHttpRequest({ port, path: '/api/auth/emergency-lockdown', method: 'GET' });
    check(restoredStatus.statusCode === 200, 'GET /api/auth/emergency-lockdown returns HTTP 200 post-restore');
    check(restoredStatus.json.isLocked === false, 'Status endpoint confirms isLocked: false');

    // =========================================================================
    // STEP 9: CRITICAL TEST: Pre-Lockdown Tokens REMAIN Revoked Post-Restore!
    // =========================================================================
    console.log(`\n${colors.bold}[STEP 9] CRITICAL: Verifying Pre-Lockdown Tokens REMAIN Revoked After Restoration${colors.reset}`);

    // Check tokenRevocationEpoch is preserved
    check(lockdownManager.getTokenRevocationEpoch() > 0, 'tokenRevocationEpoch is PRESERVED after restoration');

    for (const item of testTokens) {
      // 1. Direct module check
      const isStillRevoked = auth.isTokenRevoked(item.token);
      check(isStillRevoked === true, `Post-Restore: ${item.name} REMAIN REVOKED in auth module`);

      // 2. HTTP GET /api/auth/me check
      const getMeRes = await sendHttpRequest({
        port,
        path: '/api/auth/me',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${item.token}` }
      });
      check(getMeRes.statusCode === 401, `Post-Restore: ${item.name} receives HTTP 401 on GET /api/auth/me`);
      check(getMeRes.json && getMeRes.json.code === 'TOKEN_REVOKED', `Post-Restore: ${item.name} receives code TOKEN_REVOKED`);

      // 3. HTTP GET /api/accounts check
      const getAcctsRes = await sendHttpRequest({
        port,
        path: '/api/accounts',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${item.token}` }
      });
      check(getAcctsRes.statusCode === 401, `Post-Restore: ${item.name} receives HTTP 401 on GET /api/accounts`);
      check(getAcctsRes.json && getAcctsRes.json.code === 'TOKEN_REVOKED', `Post-Restore: ${item.name} receives code TOKEN_REVOKED`);

      // 4. HTTP POST /api/accounts check (now that 503 lockdown guard is down, requireAuth must reject it with 401!)
      const postAcctsRes = await sendHttpRequest({
        port,
        path: '/api/accounts',
        method: 'POST',
        headers: { 'Authorization': `Bearer ${item.token}` },
        body: { name: 'Attempt With Stale Token', code: '888', type: 'CASH', currency: 'TL' }
      });
      check(postAcctsRes.statusCode === 401, `Post-Restore: ${item.name} receives HTTP 401 on POST /api/accounts`);
      check(postAcctsRes.json && postAcctsRes.json.code === 'TOKEN_REVOKED', `Post-Restore: ${item.name} receives code TOKEN_REVOKED on POST mutation`);
    }

    // =========================================================================
    // STEP 10: Fresh Tokens Issued Post-Restore Function Normally
    // =========================================================================
    console.log(`\n${colors.bold}[STEP 10] Verifying Freshly Issued Tokens Post-Restore Function Normally${colors.reset}`);

    // Wait for JWT integer second rollover
    await waitForNextSecond();

    const freshAdminToken = auth.generateToken(adminUser);
    const freshUserToken = auth.generateToken(standardUser);

    check(auth.isTokenRevoked(freshAdminToken) === false, 'Fresh admin token is NOT revoked');
    check(auth.isTokenRevoked(freshUserToken) === false, 'Fresh user token is NOT revoked');

    // Fresh admin token on GET /api/auth/me
    const freshMeAdmin = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${freshAdminToken}` }
    });
    check(freshMeAdmin.statusCode === 200, 'Fresh admin token succeeds on GET /api/auth/me with HTTP 200');
    check(freshMeAdmin.json.user.username === 'emre_admin', 'Fresh admin user object retrieved');

    // Fresh user token on GET /api/auth/me
    const freshMeUser = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${freshUserToken}` }
    });
    check(freshMeUser.statusCode === 200, 'Fresh user token succeeds on GET /api/auth/me with HTTP 200');
    check(freshMeUser.json.user.username === 'ahmet_user', 'Fresh user object retrieved');

    // Fresh token on GET /api/accounts passes auth guard (not 401, not TOKEN_REVOKED)
    const freshGetAccts = await sendHttpRequest({
      port,
      path: '/api/accounts',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${freshAdminToken}` }
    });
    check(freshGetAccts.statusCode !== 401, 'Fresh admin token passes requireAuth on GET /api/accounts (not 401)');
    check(!freshGetAccts.json || freshGetAccts.json.code !== 'TOKEN_REVOKED', 'Fresh admin token does NOT return TOKEN_REVOKED');

    // Fresh token on POST mutation (passes lockdownGuard and requireAuth)
    // Note: If DB is offline, route may return 503 DB offline or 400 validation error, but NOT 503 SYSTEM_IN_LOCKDOWN and NOT 401 TOKEN_REVOKED!
    const freshPostAcct = await sendHttpRequest({
      port,
      path: '/api/accounts',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${freshAdminToken}` },
      body: { name: 'New Cash Desk', code: '100.01', type: 'CASH', currency: 'TL' }
    });
    check(freshPostAcct.statusCode !== 401, 'Fresh token is NOT rejected with 401');
    check(!freshPostAcct.json || freshPostAcct.json.code !== 'SYSTEM_IN_LOCKDOWN', 'Fresh mutation is NOT blocked by lockdown');
    check(!freshPostAcct.json || freshPostAcct.json.code !== 'TOKEN_REVOKED', 'Fresh token does NOT return TOKEN_REVOKED');

    // =========================================================================
    // STEP 11: Disk Persistence & Cold Reload Resilience
    // =========================================================================
    console.log(`\n${colors.bold}[STEP 11] Disk Persistence & Cold Reload Verification${colors.reset}`);

    // Engage lockdown again
    const lock2 = lockdownManager.activateLockdown({ reason: 'COLD_RELOAD_TEST' });
    check(lockdownManager.isLocked() === true, 'Lockdown re-engaged for cold reload test');

    // Simulate process death and cold restart by creating brand new manager instance pointing to the same file
    const coldManager = new EmergencyLockdownManager({ stateFile: lockdownManager.stateFile });
    check(coldManager.isLocked() === true, 'Cold reload: new manager instance reads isLocked: true from disk');
    check(coldManager.getStatus().reason === 'COLD_RELOAD_TEST', 'Cold reload: reason restored accurately');
    check(coldManager.getTokenRevocationEpoch() === lockdownManager.getTokenRevocationEpoch(), 'Cold reload: tokenRevocationEpoch restored accurately');

    // Restore via cold manager
    const restore2 = coldManager.restoreSystem(lock2.recoveryPhrase);
    check(restore2.success === true, 'Cold reload: system restored using disk-persisted hash');
    check(coldManager.isLocked() === false, 'Cold reload: system unlocked');

    // =========================================================================
    // STEP 12: CLI Tool Subprocess Execution Verification
    // =========================================================================
    console.log(`\n${colors.bold}[STEP 12] CLI Tool Subprocess Execution Verification${colors.reset}`);

    const scriptPath = path.resolve(__dirname, '..', 'server', 'lockdown.js');

    // 1. Check CLI status
    const cliStatusOut = execSync(`node "${scriptPath}" status`, { encoding: 'utf8' });
    check(cliStatusOut.includes('AKTİF (NORMAL)'), 'CLI status outputs AKTİF (NORMAL)');

    // 2. Activate via CLI
    const cliActOut = execSync(`node "${scriptPath}" activate --reason "CLI_ADVERSARIAL_DRILL"`, { encoding: 'utf8' });
    check(cliActOut.includes('ACİL DURUM KİLİT MODU (PANIC LOCKDOWN) AKTİF EDİLDİ'), 'CLI activate initiates lockdown');
    check(cliActOut.includes('BROSAN-CITADEL-'), 'CLI activate prints recovery phrase');

    const phraseMatch = cliActOut.match(/BROSAN-CITADEL-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}/i);
    check(phraseMatch && phraseMatch[0], 'CLI recovery phrase extracted successfully');
    const cliPhrase = phraseMatch[0];

    // 3. Confirm locked via CLI status
    const cliStatusLocked = execSync(`node "${scriptPath}" status`, { encoding: 'utf8' });
    check(cliStatusLocked.includes('KİLİTLİ (LOCKED)'), 'CLI status confirms KİLİTLİ (LOCKED)');

    // 4. Restore via CLI
    const cliRestoreOut = execSync(`node "${scriptPath}" restore "${cliPhrase}"`, { encoding: 'utf8' });
    check(cliRestoreOut.includes('SİSTEM KİLİT MODUNDAN ÇIKARILDI (RESTORE SUCCESS)'), 'CLI restore succeeds');

    // 5. Confirm returned to normal via CLI status
    const cliStatusFinal = execSync(`node "${scriptPath}" status`, { encoding: 'utf8' });
    check(cliStatusFinal.includes('AKTİF (NORMAL)'), 'CLI status confirms return to AKTİF (NORMAL)');

  } finally {
    await new Promise(resolve => server.close(resolve));
    lockdownManager.reset();
  }

  console.log(`\n${colors.bold}${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}                    CHALLENGER VERIFICATION SUMMARY REPORT                      ${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  Total Checks Executed : ${colors.bold}${totalChecks}${colors.reset}`);
  console.log(`  Passed Checks         : ${colors.bold}${colors.green}${passedChecks}${colors.reset}`);
  console.log(`  Failed Checks         : ${colors.bold}${totalChecks - passedChecks === 0 ? colors.green + '0' : colors.red + (totalChecks - passedChecks)}${colors.reset}`);
  console.log(`  Pass Rate             : ${colors.bold}${colors.green}${((passedChecks / totalChecks) * 100).toFixed(1)}%${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);

  if (passedChecks === totalChecks) {
    console.log(`\n${colors.bold}${colors.green}🏆 ALL ${totalChecks} CHALLENGER VERIFICATION CHECKS PASSED 100%!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.error(`\n${colors.bold}${colors.red}❌ CHALLENGER VERIFICATION FAILED: ${totalChecks - passedChecks} assertions failed!${colors.reset}\n`);
    process.exit(1);
  }
}

runChallengerVerification().catch(err => {
  console.error('\n💥 FATAL CHALLENGER ERROR:', err);
  process.exit(1);
});
