/**
 * BROSAN TEKSTİL ERP — CITADEL SECURITY HARDENING
 * Unit Test Suite: Real-Time Asynchronous Security Threat & Quarantine Alerter
 * 
 * Verifies:
 * 1. Non-blocking throughput (< 10ms for 100 alerts)
 * 2. Zero credential leakage verification
 * 3. 60s burst deduplication & coalescing
 * 4. Webhook & Telegram formatting (headers, schema, escaping)
 * 5. Fail-silent resilience on unreachable endpoints
 * 6. Graceful fallback when environment variables are unset
 * 7. Bounded queue & circular ring buffer memory limits
 * 8. End-to-end integration hook with quarantineEngine
 */

const assert = require('assert');
const http = require('http');
const { performance } = require('perf_hooks');
const threatAlerter = require('../server/threatAlerter');
const { ThreatAlerter, THREAT_EVENT_TYPES } = require('../server/threatAlerter');
const { quarantineEngine } = require('../server/quarantine');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

async function runTestSuite() {
  console.log(`${colors.cyan}${colors.bold}================================================================${colors.reset}`);
  console.log(`${colors.bold}🛡️ CITADEL SECURITY: THREAT ALERTER UNIT TEST SUITE${colors.reset}`);
  console.log(`${colors.cyan}================================================================${colors.reset}\n`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`• ${name}... `);
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

  // --------------------------------------------------------------------------
  // TEST 1: Non-blocking throughput (< 10ms for 100 alerts)
  // --------------------------------------------------------------------------
  await test('TEST 1: Non-blocking throughput (< 10ms for 100 alerts)', async () => {
    const alerter = new ThreatAlerter({ maxQueueSize: 2000, dedupWindowMs: 60000 });
    
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      const res = alerter.dispatchAlert('SENSITIVE_PROBE', {
        clientIp: `192.168.100.${i + 1}`,
        path: `/.env.${i}`
      });
      assert.strictEqual(res.enqueued, true, `Alert ${i} should be immediately enqueued`);
      assert.ok(res.alertId, 'Alert must have a unique alertId');
    }
    const elapsed = performance.now() - start;

    console.log(`\n  [Throughput] 100 dispatches completed in ${elapsed.toFixed(3)}ms (avg ${(elapsed / 100).toFixed(4)}ms/call)`);
    assert.ok(elapsed < 10, `Throughput must be < 10ms for 100 alerts (actual: ${elapsed.toFixed(2)}ms)`);

    // Allow worker loop to drain in background
    await new Promise(r => setTimeout(r, 50));
    const stats = alerter.getQueueStats();
    assert.strictEqual(stats.queueLength, 0, 'Queue must be drained by worker');
    assert.strictEqual(stats.totalDispatched, 100, 'Total dispatched must match 100');
    alerter.close();
  });

  // --------------------------------------------------------------------------
  // TEST 2: Zero credential leakage verification
  // --------------------------------------------------------------------------
  await test('TEST 2: Zero credential leakage (redaction & stripping)', async () => {
    const alerter = new ThreatAlerter();
    
    const rawDetails = {
      username: 'admin_test',
      password: 'SuperSecretPlaintextPassword123!',
      passwordHash: '$2b$12$eX4mpL3H45hV4Lu3',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSignature',
      jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc',
      totpSecret: 'JBSWY3DPEHPK3PXP',
      apiKey: 'sk-citadel-secret-key-9999999',
      cookie: 'session_id=s%3Aabcdef123456',
      code: '654321',
      authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token.sig',
      userProfileClaim: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.patternLeakTestSignatureAtLeast20Chars',
      customBearerHeader: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.header.sig',
      nested: {
        adminKey: 'private-key-data-12345',
        safeNestedProp: 'brosan-erp-ok'
      },
      triggerPath: '/.env',
      remainingSec: 900
    };

    const res = alerter.dispatchAlert('BRUTE_FORCE_LOCKOUT', {
      clientIp: '198.51.100.22',
      details: rawDetails
    });

    assert.strictEqual(res.enqueued, true);

    // Let worker process
    await new Promise(r => setTimeout(r, 30));

    const recent = alerter.getRecentAlerts(1);
    assert.strictEqual(recent.length, 1);
    const alert = recent[0];

    // Inspect sanitized details
    assert.strictEqual(alert.details.password, '[REDACTED]', 'Password must be redacted');
    assert.strictEqual(alert.details.passwordHash, '[REDACTED]', 'Password hash must be redacted');
    assert.strictEqual(alert.details.totpSecret, '[REDACTED]', 'totpSecret must be redacted');
    assert.strictEqual(alert.details.apiKey, '[REDACTED]', 'apiKey must be redacted');
    assert.strictEqual(alert.details.cookie, '[REDACTED]', 'cookie must be redacted');
    assert.strictEqual(alert.details.code, '[REDACTED]', 'code must be redacted');
    assert.strictEqual(alert.details.token, '[REDACTED]', 'token key must be redacted');
    assert.strictEqual(alert.details.jwt, '[REDACTED]', 'jwt key must be redacted');
    assert.strictEqual(alert.details.authorization, '[REDACTED]', 'authorization header must be redacted');
    assert.strictEqual(alert.details.userProfileClaim, '[REDACTED_TOKEN]', 'JWT pattern must be redacted as [REDACTED_TOKEN]');
    assert.strictEqual(alert.details.customBearerHeader, 'Bearer [REDACTED_TOKEN]', 'Bearer pattern must be redacted as Bearer [REDACTED_TOKEN]');

    // Safe incident fields preserved
    assert.strictEqual(alert.details.triggerPath, '/.env');
    assert.strictEqual(alert.details.remainingSec, 900);
    assert.strictEqual(alert.details.username, 'admin_test');
    assert.strictEqual(alert.details.nested.safeNestedProp, 'brosan-erp-ok');

    // Stringify and assert absolute zero leakage of raw secrets
    const serialized = JSON.stringify(alert);
    assert.ok(!serialized.includes('SuperSecretPlaintextPassword123!'), 'No plaintext password in payload');
    assert.ok(!serialized.includes('sk-citadel-secret-key-9999999'), 'No plaintext apiKey in payload');
    assert.ok(!serialized.includes('JBSWY3DPEHPK3PXP'), 'No plaintext totpSecret in payload');
    assert.ok(!serialized.includes('doNotLeakThisSignature'), 'No JWT signature in payload');
    assert.ok(!serialized.includes('session_id=s%3Aabcdef123456'), 'No cookie in payload');

    alerter.close();
  });

  // --------------------------------------------------------------------------
  // TEST 3: Burst deduplication & coalescing
  // --------------------------------------------------------------------------
  await test('TEST 3: Burst deduplication & coalescing (60s burst window)', async () => {
    // Test with a short 100ms dedup window to verify coalescing timer
    const alerter = new ThreatAlerter({ dedupWindowMs: 100 });
    const clientIp = '203.0.113.88';

    // Fire 20 alerts rapidly for the same event and IP
    const firstRes = alerter.dispatchAlert('SENSITIVE_PROBE', { clientIp, path: '/.env' });
    assert.strictEqual(firstRes.enqueued, true, 'First alert in window must be enqueued');
    assert.strictEqual(firstRes.deduplicated, false);

    for (let i = 1; i < 20; i++) {
      const burstRes = alerter.dispatchAlert('SENSITIVE_PROBE', { clientIp, path: '/.env' });
      assert.strictEqual(burstRes.enqueued, false, `Alert ${i + 1} must be suppressed`);
      assert.strictEqual(burstRes.deduplicated, true, 'Must indicate deduplication');
      assert.strictEqual(burstRes.suppressedCount, i);
    }

    // Wait 150ms for dedup timer to fire and dispatch coalesced burst summary
    await new Promise(r => setTimeout(r, 150));

    const recent = alerter.getRecentAlerts(10);
    // There should be exactly 2 alerts: the initial SENSITIVE_PROBE and the coalesced BURST_SUMMARY
    assert.strictEqual(recent.length, 2, 'Should have initial alert + 1 coalesced burst summary');
    
    const burstSummary = recent[1];
    assert.strictEqual(burstSummary.eventType, 'BURST_SUMMARY');
    assert.strictEqual(burstSummary.clientIp, clientIp);
    assert.strictEqual(burstSummary.details.suppressedCount, 19, 'Must report exactly 19 suppressed incidents');
    assert.strictEqual(burstSummary.details.originalEventType, 'SENSITIVE_PROBE');

    alerter.close();
  });

  // --------------------------------------------------------------------------
  // TEST 4: Webhook & Telegram formatting
  // --------------------------------------------------------------------------
  await test('TEST 4: Webhook HTTP dispatch & Telegram HTML formatting', async () => {
    let receivedWebhook = null;
    let receivedHeaders = null;

    // Spin up ephemeral local HTTP server to act as mock webhook
    const server = http.createServer((req, res) => {
      receivedHeaders = req.headers;
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          receivedWebhook = JSON.parse(body);
        } catch (_) {}
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      });
    });

    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const webhookUrl = `http://127.0.0.1:${port}/security-webhook`;

    const alerter = new ThreatAlerter({ webhookUrl, timeoutMs: 2000 });
    alerter.dispatchAlert('IP_QUARANTINED', {
      clientIp: '198.51.100.77',
      details: {
        reason: 'PROBING_SENSITIVE_FILES',
        triggerPath: '/admin/.env',
        durationSec: 3600
      }
    });

    // Wait for async dispatch
    await new Promise(r => setTimeout(r, 80));

    // Verify webhook payload and headers
    assert.ok(receivedWebhook, 'Webhook endpoint must have received the payload');
    assert.strictEqual(receivedHeaders['content-type'], 'application/json');
    assert.strictEqual(receivedHeaders['user-agent'], 'Brosan-Citadel-ThreatAlerter/1.0');
    assert.strictEqual(receivedHeaders['x-brosan-alert-event'], 'IP_QUARANTINED');
    assert.strictEqual(receivedHeaders['x-brosan-alert-severity'], 'CRITICAL');

    assert.strictEqual(receivedWebhook.schema, 'brosan.security.threat-alert/v1');
    assert.strictEqual(receivedWebhook.eventType, 'IP_QUARANTINED');
    assert.strictEqual(receivedWebhook.clientIp, '198.51.100.77');
    assert.strictEqual(receivedWebhook.details.reason, 'PROBING_SENSITIVE_FILES');
    assert.strictEqual(receivedWebhook.details.triggerPath, '/admin/.env');

    // Test Telegram Formatter
    const tgMsg = alerter.formatTelegramMessage(receivedWebhook);
    assert.ok(tgMsg.includes('<b>🛡️ BROSAN ERP SİBER GÜVENLİK TEHDİT ALARMI</b>'));
    assert.ok(tgMsg.includes('<code>IP_QUARANTINED</code>'));
    assert.ok(tgMsg.includes('<b>CRITICAL</b>'));
    assert.ok(tgMsg.includes('<code>198.51.100.77</code>'));
    assert.ok(tgMsg.includes('<pre>'));

    // Test HTML injection escaping
    const unsafeAlert = {
      eventType: 'PROBE<script>',
      severity: 'HIGH<b>',
      clientIp: '1.2.3.4',
      timestamp: '2026-10-08T00:00:00Z',
      summary: 'Test & Attack <script>alert(1)</script>',
      details: { test: '<img src=x onerror=alert(1)>' }
    };
    const safeTgMsg = alerter.formatTelegramMessage(unsafeAlert);
    assert.ok(!safeTgMsg.includes('<script>'), 'Telegram HTML must escape <script>');
    assert.ok(safeTgMsg.includes('&lt;script&gt;'));

    server.close();
    alerter.close();
  });

  // --------------------------------------------------------------------------
  // TEST 5: Fail-silent resilience on unreachable endpoints
  // --------------------------------------------------------------------------
  await test('TEST 5: Fail-silent resilience on unreachable endpoints', async () => {
    // Target an unreachable local port (no listener) and invalid Telegram bot
    const alerter = new ThreatAlerter({
      webhookUrl: 'http://127.0.0.1:59998/no-one-listening',
      telegramBotToken: 'invalid_bot_token_12345',
      telegramChatId: '999999999',
      timeoutMs: 500 // Quick timeout
    });

    let threw = false;
    try {
      const res = alerter.dispatchAlert('SENSITIVE_PROBE', {
        clientIp: '192.0.2.1',
        details: { path: '/.git/config' }
      });
      assert.strictEqual(res.enqueued, true);

      // Wait for network timeout
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      threw = true;
    }

    assert.strictEqual(threw, false, 'Dispatching to failing network endpoints must never throw');
    const stats = alerter.getQueueStats();
    assert.strictEqual(stats.queueLength, 0, 'Queue must finish processing without crashing');
    alerter.close();
  });

  // --------------------------------------------------------------------------
  // TEST 6: Graceful fallback when environment variables are unset
  // --------------------------------------------------------------------------
  await test('TEST 6: Graceful fallback when env vars are unset', async () => {
    const oldTgToken = process.env.TELEGRAM_BOT_TOKEN;
    const oldTgChat = process.env.TELEGRAM_CHAT_ID;
    const oldWebhook = process.env.SECURITY_WEBHOOK_URL;

    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    delete process.env.SECURITY_WEBHOOK_URL;

    try {
      const alerter = new ThreatAlerter();

      // Test convenience helper methods
      const r1 = alerter.alertIpQuarantined('10.10.1.1', { reason: 'FAIL2BAN' });
      const r2 = alerter.alertBruteForceLockout('10.10.1.2', 'bad_user', { remainingSec: 600 });
      const r3 = alerter.alertReplayAttack('10.10.1.3', 'victim_user', { step: '123' });
      const r4 = alerter.alertSensitiveProbe('10.10.1.4', '/database.sqlite', {});

      assert.strictEqual(r1.enqueued, true);
      assert.strictEqual(r2.enqueued, true);
      assert.strictEqual(r3.enqueued, true);
      assert.strictEqual(r4.enqueued, true);

      await new Promise(r => setTimeout(r, 30));

      const recent = alerter.getRecentAlerts(10);
      assert.strictEqual(recent.length, 4);
      assert.strictEqual(recent[0].eventType, 'IP_QUARANTINED');
      assert.strictEqual(recent[1].eventType, 'BRUTE_FORCE_LOCKOUT');
      assert.strictEqual(recent[2].eventType, 'REPLAY_ATTACK');
      assert.strictEqual(recent[3].eventType, 'SENSITIVE_PROBE');

      alerter.close();
    } finally {
      if (oldTgToken) process.env.TELEGRAM_BOT_TOKEN = oldTgToken;
      if (oldTgChat) process.env.TELEGRAM_CHAT_ID = oldTgChat;
      if (oldWebhook) process.env.SECURITY_WEBHOOK_URL = oldWebhook;
    }
  });

  // --------------------------------------------------------------------------
  // TEST 7: Bounded queue & circular ring buffer memory limits
  // --------------------------------------------------------------------------
  await test('TEST 7: Bounded queue & circular ring buffer memory limits', async () => {
    const alerter = new ThreatAlerter({
      maxQueueSize: 25,
      maxRecentAlerts: 15,
      dedupWindowMs: 60000
    });

    // Enqueue 50 distinct items
    for (let i = 0; i < 50; i++) {
      alerter.dispatchAlert('SENSITIVE_PROBE', { clientIp: `10.20.1.${i + 1}` });
    }

    const statsBefore = alerter.getQueueStats();
    assert.ok(statsBefore.queueLength <= 25, 'Queue length must never exceed maxQueueSize (25)');
    assert.ok(statsBefore.totalDropped >= 25, 'Dropped items must be tracked');

    await new Promise(r => setTimeout(r, 60));

    const recent = alerter.getRecentAlerts(100);
    assert.strictEqual(recent.length, 15, 'Circular buffer must be strictly capped at maxRecentAlerts (15)');

    alerter.close();
  });

  // --------------------------------------------------------------------------
  // TEST 8: End-to-end integration hook with quarantineEngine
  // --------------------------------------------------------------------------
  await test('TEST 8: quarantineEngine.quarantineIp triggers threatAlerter', async () => {
    threatAlerter.reset();
    const testIp = '198.51.100.244';

    quarantineEngine.quarantineIp(testIp, 'UNIT_TEST_TRIGGER', {
      triggerPath: '/test-env-probe',
      ttl: 30000
    });

    await new Promise(r => setTimeout(r, 30));

    const recent = threatAlerter.getRecentAlerts(5);
    const found = recent.find(a => a.eventType === 'IP_QUARANTINED' && a.clientIp === testIp);

    assert.ok(found, 'threatAlerter must have received IP_QUARANTINED event from quarantineEngine');
    assert.strictEqual(found.details.reason, 'UNIT_TEST_TRIGGER');
    assert.strictEqual(found.details.triggerPath, '/test-env-probe');

    // Cleanup test IP
    quarantineEngine.unquarantineIp(testIp);
    threatAlerter.reset();
  });

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log(`\n${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bold}TEST RESULTS: ${passed} PASSED, ${failed} FAILED${colors.reset}`);
  console.log(`${colors.cyan}================================================================${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite crashed with unhandled error:', err);
  process.exit(1);
});
