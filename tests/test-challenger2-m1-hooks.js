/**
 * BROSAN TEKSTİL ERP — PHASE 3 CITADEL SECURITY HARDENING
 * Empirical Challenger 2 Verification Harness for Milestone 1
 * 
 * Verifies live integration hooks:
 * 1. quarantineEngine.quarantineIp() -> threatAlerter.alertIpQuarantined()
 * 2. Express sensitive files probe -> alertSensitiveProbe()
 * 3. Login brute-force lockout -> alertBruteForceLockout()
 * 4. Submitting a replayed TOTP step -> alertReplayAttack()
 * 5. Adversarial stress & zero-credential-leakage validation
 */

const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const app = require('../server/index');
const auth = require('../server/auth');
const totp = require('../server/totp');
const { quarantineEngine } = require('../server/quarantine');
const threatAlerter = require('../server/threatAlerter');
const { ThreatAlerter } = require('../server/threatAlerter');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  yellow: '\x1b[33m'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runChallengerHarness() {
  console.log(`${colors.cyan}${colors.bold}================================================================${colors.reset}`);
  console.log(`${colors.bold}⚔️ CITADEL M1 CHALLENGER 2: LIVE HOOKS EMPIRICAL VERIFICATION${colors.reset}`);
  console.log(`${colors.cyan}================================================================${colors.reset}\n`);

  let passed = 0;
  let failed = 0;

  async function challenge(name, fn) {
    process.stdout.write(`• ${colors.bold}${name}${colors.reset}... `);
    try {
      await fn();
      console.log(`${colors.green}PASS${colors.reset}`);
      passed++;
    } catch (err) {
      console.log(`${colors.red}FAIL${colors.reset}`);
      console.error(err);
      failed++;
    }
  }

  // Start Express server on random available port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // ------------------------------------------------------------------------
    // HOOK 1: quarantineEngine.quarantineIp() -> threatAlerter.alertIpQuarantined()
    // ------------------------------------------------------------------------
    await challenge('HOOK 1: quarantineEngine.quarantineIp() triggers threatAlerter.alertIpQuarantined()', async () => {
      threatAlerter.reset();
      const testIp = '203.0.113.188';

      // Ensure IP is clean
      quarantineEngine.unquarantineIp(testIp);

      const quarantineRecord = quarantineEngine.quarantineIp(testIp, 'CHALLENGER_QUARANTINE_TEST', {
        triggerPath: '/api/v1/honeypot',
        ttlMs: 45000,
        extraEvidence: 'automated-scanner-pattern'
      });

      assert.ok(quarantineRecord, 'Quarantine record must be created');
      assert.strictEqual(quarantineRecord.ip, testIp);

      // Await setImmediate queue worker processing
      await sleep(60);

      const alerts = threatAlerter.getRecentAlerts(10);
      const matched = alerts.find(a => a.eventType === 'IP_QUARANTINED' && a.clientIp === testIp);

      assert.ok(matched, `threatAlerter must contain an IP_QUARANTINED alert for ${testIp}`);
      assert.strictEqual(matched.severity, 'CRITICAL');
      assert.strictEqual(matched.details.reason, 'CHALLENGER_QUARANTINE_TEST');
      assert.strictEqual(matched.details.triggerPath, '/api/v1/honeypot');
      assert.strictEqual(matched.details.extraEvidence, 'automated-scanner-pattern');
      assert.ok(matched.summary.includes(testIp), 'Alert summary must reference client IP');

      // Cleanup
      quarantineEngine.unquarantineIp(testIp);
      threatAlerter.reset();
    });

    // ------------------------------------------------------------------------
    // HOOK 2: Express sensitive files probe triggers alertSensitiveProbe()
    // ------------------------------------------------------------------------
    await challenge('HOOK 2: Probing sensitive files in Express triggers alertSensitiveProbe()', async () => {
      threatAlerter.reset();

      // Probe 1: Direct .env dotfile probe
      const resDotfile = await fetch(`${baseUrl}/.env`, { method: 'GET' });
      assert.strictEqual(resDotfile.status, 403, 'Must return 403 Forbidden for .env');
      const bodyDotfile = await resDotfile.json();
      assert.strictEqual(bodyDotfile.code, 'FORBIDDEN_FILE');

      await sleep(60);

      let alerts = threatAlerter.getRecentAlerts(10);
      let probeAlert = alerts.find(a => a.eventType === 'SENSITIVE_PROBE');
      assert.ok(probeAlert, 'threatAlerter must record SENSITIVE_PROBE alert on /.env probe');
      assert.strictEqual(probeAlert.severity, 'CRITICAL');
      assert.strictEqual(probeAlert.details.hasDotfile, true);

      // Probe 2: Path traversal attempt
      threatAlerter.reset();
      const resTraversal = await fetch(`${baseUrl}/static/..%2f..%2fetc/passwd`, { method: 'GET' });
      assert.strictEqual(resTraversal.status, 403, 'Must return 403 for path traversal');

      await sleep(60);
      alerts = threatAlerter.getRecentAlerts(10);
      probeAlert = alerts.find(a => a.eventType === 'SENSITIVE_PROBE');
      assert.ok(probeAlert, 'threatAlerter must record SENSITIVE_PROBE alert on traversal');
      assert.strictEqual(probeAlert.details.hasTraversal, true);

      // Probe 3: Null byte injection
      threatAlerter.reset();
      const resNull = await fetch(`${baseUrl}/api/test%00.php`, { method: 'GET' });
      assert.strictEqual(resNull.status, 403, 'Must return 403 for null byte probe');

      await sleep(60);
      alerts = threatAlerter.getRecentAlerts(10);
      probeAlert = alerts.find(a => a.eventType === 'SENSITIVE_PROBE');
      assert.ok(probeAlert, 'threatAlerter must record SENSITIVE_PROBE on null byte injection');
      assert.strictEqual(probeAlert.details.reason, 'NULL_BYTE_INJECTION');

      // Probe 4: Database extension probe
      threatAlerter.reset();
      const resDb = await fetch(`${baseUrl}/backup.sqlite3`, { method: 'GET' });
      assert.strictEqual(resDb.status, 403, 'Must return 403 for sensitive extension probe');

      await sleep(60);
      alerts = threatAlerter.getRecentAlerts(10);
      probeAlert = alerts.find(a => a.eventType === 'SENSITIVE_PROBE');
      assert.ok(probeAlert, 'threatAlerter must record SENSITIVE_PROBE on .sqlite3 extension');
      assert.strictEqual(probeAlert.details.hasSensitiveExt, true);

      threatAlerter.reset();
    });

    // ------------------------------------------------------------------------
    // HOOK 3: Login brute-force lockouts triggers alertBruteForceLockout()
    // ------------------------------------------------------------------------
    await challenge('HOOK 3: Triggering login brute-force lockouts triggers alertBruteForceLockout()', async () => {
      threatAlerter.reset();
      const targetUser = 'victim_bf_test';
      const testClientIp = '127.0.0.1';

      // Clear previous attempts for clean state
      auth.clearFailedAttempts(`ip:${testClientIp}`);
      auth.clearFailedAttempts(`user:${targetUser.toLowerCase()}`);

      // Perform 5 failed login attempts
      for (let i = 1; i <= 5; i++) {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: targetUser, password: `WrongPassword${i}!` })
        });
        assert.strictEqual(res.status, 401, `Attempt ${i} should fail with 401`);
      }

      // Check brute force state - 5 attempts recorded
      const check = auth.checkBruteForce(`user:${targetUser.toLowerCase()}`);
      assert.strictEqual(check.isLocked, true, 'User must be locked after 5 failed attempts');

      // Attempt 6: Locked out! Should return 429 and trigger threatAlerter.alertBruteForceLockout()
      const res6 = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUser, password: 'WrongPassword6!' })
      });

      assert.strictEqual(res6.status, 429, 'Attempt 6 while locked must return 429 Too Many Requests');
      const body6 = await res6.json();
      assert.strictEqual(body6.locked, true);
      assert.ok(body6.remainingSec > 0);

      await sleep(60);

      const alerts = threatAlerter.getRecentAlerts(10);
      const bfAlert = alerts.find(a => a.eventType === 'BRUTE_FORCE_LOCKOUT');

      assert.ok(bfAlert, 'threatAlerter must record BRUTE_FORCE_LOCKOUT alert');
      assert.strictEqual(bfAlert.severity, 'HIGH');
      assert.strictEqual(bfAlert.details.username, targetUser);
      assert.strictEqual(bfAlert.details.reason, 'BRUTE_FORCE_LOCKOUT');
      assert.ok(bfAlert.details.remainingSec > 0);

      // Clean up failed attempts
      auth.clearFailedAttempts(`ip:${testClientIp}`);
      auth.clearFailedAttempts(`user:${targetUser.toLowerCase()}`);
      threatAlerter.reset();
    });

    // ------------------------------------------------------------------------
    // HOOK 4: Submitting a replayed TOTP step triggers alertReplayAttack()
    // ------------------------------------------------------------------------
    await challenge('HOOK 4: Submitting a replayed TOTP step triggers alertReplayAttack()', async () => {
      threatAlerter.reset();

      // Step 4.1: Perform initial login to get admin credentials
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'Brosan2026!SecureErp' })
      });
      assert.strictEqual(loginRes.status, 200);
      const loginData = await loginRes.json();
      let activeToken = loginData.token;

      // Step 4.2: Setup 2FA if not already enabled
      const setupRes = await fetch(`${baseUrl}/api/auth/2fa/setup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      assert.strictEqual(setupRes.status, 200);
      const setupData = await setupRes.json();
      const secret = setupData.secret;

      // Step 4.3: Verify setup with valid code to activate 2FA
      const secretBuf = totp.base32Decode(secret);
      const initialStep = Math.floor(Date.now() / 1000 / 30);
      const setupCode = totp.generateOtpAtStep(secretBuf, initialStep, 6);

      const verifySetupRes = await fetch(`${baseUrl}/api/auth/2fa/verify-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({ code: setupCode })
      });
      assert.strictEqual(verifySetupRes.status, 200);

      // Step 4.4: Log in with 2FA active -> returns preAuthToken A
      const loginPreResA = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'Brosan2026!SecureErp' })
      });
      assert.strictEqual(loginPreResA.status, 200);
      const loginPreDataA = await loginPreResA.json();
      assert.strictEqual(loginPreDataA.requires2FA, true);
      const preAuthTokenA = loginPreDataA.preAuthToken;

      // Step 4.5: Legitimate verification at step (initialStep + 1)
      const targetStep = initialStep + 1;
      const validCode = totp.generateOtpAtStep(secretBuf, targetStep, 6);

      const verifyResA = await fetch(`${baseUrl}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${preAuthTokenA}`
        },
        body: JSON.stringify({ code: validCode })
      });
      assert.strictEqual(verifyResA.status, 200);
      const verifyDataA = await verifyResA.json();
      assert.strictEqual(verifyDataA.success, true);
      assert.ok(verifyDataA.token);

      // Now twoFactorLastStep is recorded as targetStep in the user session.
      // Step 4.6: Attacker attempts replay!
      // Sleep > 1s so JWT iat advances to ensure preAuthTokenB has a fresh signature and is not identical to revoked preAuthTokenA
      await sleep(1100);

      // Attacker gets a fresh preAuthToken B via legitimate login
      const loginPreResB = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'Brosan2026!SecureErp' })
      });
      assert.strictEqual(loginPreResB.status, 200);
      const loginPreDataB = await loginPreResB.json();
      assert.strictEqual(loginPreDataB.requires2FA, true);
      const preAuthTokenB = loginPreDataB.preAuthToken;
      assert.notStrictEqual(preAuthTokenB, preAuthTokenA, 'preAuthTokenB must have distinct timestamp from revoked preAuthTokenA');

      threatAlerter.reset();

      // Attacker replays validCode (which corresponds to targetStep <= lastStep)
      const replayRes = await fetch(`${baseUrl}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${preAuthTokenB}`
        },
        body: JSON.stringify({ code: validCode })
      });

      assert.strictEqual(replayRes.status, 401, 'Replayed TOTP code must be rejected with 401');
      const replayBody = await replayRes.json();
      assert.strictEqual(replayBody.code, 'REPLAY_ATTACK', 'Error code must be REPLAY_ATTACK');

      await sleep(60);

      const alerts = threatAlerter.getRecentAlerts(10);
      const replayAlert = alerts.find(a => a.eventType === 'REPLAY_ATTACK');

      assert.ok(replayAlert, 'threatAlerter must record REPLAY_ATTACK alert on replayed TOTP code');
      assert.strictEqual(replayAlert.severity, 'CRITICAL');
      assert.strictEqual(replayAlert.details.username, 'admin');
      assert.strictEqual(replayAlert.details.step, targetStep.toString());

      // Clean up 2FA state: disable 2FA
      const disableCode = totp.generateOtpAtStep(secretBuf, targetStep + 1, 6);
      await fetch(`${baseUrl}/api/auth/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${verifyDataA.token}`
        },
        body: JSON.stringify({ password: 'Brosan2026!SecureErp', code: disableCode })
      });

      threatAlerter.reset();
    });

    // ------------------------------------------------------------------------
    // SECTION 5: Adversarial Stress & Credential Redaction Verification
    // ------------------------------------------------------------------------
    await challenge('ADVERSARIAL STRESS: Zero credential leakage & fail-silent resilience', async () => {
      const customAlerter = new ThreatAlerter({
        webhookUrl: 'http://127.0.0.1:59999/unreachable-endpoint',
        telegramBotToken: '123456:FAKE_TOKEN_FOR_TEST',
        telegramChatId: '999999',
        timeoutMs: 500
      });

      // Hostile payload attempting to leak passwords and tokens through alert metadata
      const hostileData = {
        clientIp: '198.51.100.77',
        username: 'attacker',
        password: 'HostilePlaintextPassword999!',
        nested: {
          jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.superSecretSignature',
          totpSecret: 'JBSWY3DPEHPK3PXP',
          cookie: 'session=abc123xyz'
        },
        genericClaimValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.secretSignatureValue',
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.header.signature',
        customBearerHeader: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.header.signature2',
        deepArray: [
          { token: 'secret-auth-token-123' },
          'harmless-string'
        ]
      };

      const dispatchResult = customAlerter.dispatchAlert('BRUTE_FORCE_LOCKOUT', hostileData);
      assert.strictEqual(dispatchResult.enqueued, true);

      await sleep(100);

      const recent = customAlerter.getRecentAlerts(1);
      assert.strictEqual(recent.length, 1);
      const alert = recent[0];

      // Verifying recursive zero-credential leakage
      const alertStr = JSON.stringify(alert);
      assert.ok(!alertStr.includes('HostilePlaintextPassword999!'), 'Plaintext password must NOT appear anywhere');
      assert.ok(!alertStr.includes('superSecretSignature'), 'JWT signature must NOT appear anywhere');
      assert.ok(!alertStr.includes('secretSignatureValue'), 'JWT signature must NOT appear anywhere');
      assert.ok(!alertStr.includes('JBSWY3DPEHPK3PXP'), 'TOTP secret must NOT appear anywhere');
      assert.ok(!alertStr.includes('abc123xyz'), 'Cookie value must NOT appear anywhere');
      assert.ok(!alertStr.includes('secret-auth-token-123'), 'Array token must NOT appear anywhere');

      // Key-based redactions
      assert.strictEqual(alert.details.password, '[REDACTED]');
      assert.strictEqual(alert.details.nested.jwtToken, '[REDACTED]');
      assert.strictEqual(alert.details.nested.totpSecret, '[REDACTED]');
      assert.strictEqual(alert.details.nested.cookie, '[REDACTED]');
      assert.strictEqual(alert.details.authorization, '[REDACTED]');
      assert.strictEqual(alert.details.deepArray[0].token, '[REDACTED]');

      // Value-pattern regex redaction for non-credential keys
      assert.strictEqual(alert.details.genericClaimValue, '[REDACTED_TOKEN]');
      assert.strictEqual(alert.details.customBearerHeader, 'Bearer [REDACTED_TOKEN]');

      customAlerter.close();
    });

  } finally {
    // Graceful server shutdown
    await new Promise((resolve) => server.close(resolve));
  }

  // Final Summary
  console.log(`\n${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bold}CHALLENGER HARNESS RESULTS: ${passed} PASSED, ${failed} FAILED${colors.reset}`);
  console.log(`${colors.cyan}================================================================${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runChallengerHarness().catch((err) => {
  console.error('Fatal error in challenger harness:', err);
  process.exit(1);
});
