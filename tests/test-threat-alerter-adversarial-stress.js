/**
 * BROSAN TEKSTİL ERP — CITADEL SECURITY HARDENING
 * Empirical Adversarial Stress Test Suite: Threat Alerter (server/threatAlerter.js)
 * Challenger 1: Phase 3 Citadel Milestone 1
 * 
 * Verifies:
 * 1. High-concurrency flood test (1,000 alerts under 50ms, <0.1ms per call, zero event loop blockage)
 * 2. Queue memory boundary test (5,000 alerts dropped gracefully without memory leak)
 * 3. Burst deduplication & coalescing (50 bursts -> 1 immediate + 1 summary, cross-IP isolation)
 * 4. Adversarial credential leak resistance (nested objects, circular refs, prototype pollution, raw JWTs, compound keys, PEM keys, URL query params)
 * 5. Network failure resilience (HTTP 500, HTTP 429, ECONNRESET, DNS failure, blackhole timeout)
 */

const assert = require('assert');
const http = require('http');
const net = require('net');
const { performance } = require('perf_hooks');
const { ThreatAlerter } = require('../server/threatAlerter');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Global unhandled rejection detector
let unhandledRejectionsCount = 0;
process.on('unhandledRejection', (reason) => {
  unhandledRejectionsCount++;
  console.error(`${colors.red}CRITICAL: Unhandled Promise Rejection detected:${colors.reset}`, reason);
});

async function runAdversarialStressSuite() {
  console.log(`${colors.cyan}${colors.bold}========================================================================${colors.reset}`);
  console.log(`${colors.bold}⚔️ CITADEL ADVERSARIAL STRESS HARNESS: THREAT ALERTER EMPIRICAL SUITE${colors.reset}`);
  console.log(`${colors.cyan}========================================================================${colors.reset}\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failureDetails = [];
  const empiricalMetrics = {};

  async function runStep(name, fn) {
    totalTests++;
    process.stdout.write(`• ${colors.bold}${name}${colors.reset}... `);
    const start = performance.now();
    try {
      await fn();
      const elapsed = performance.now() - start;
      console.log(`${colors.green}PASS${colors.reset} (${elapsed.toFixed(1)}ms)`);
      passedTests++;
    } catch (err) {
      const elapsed = performance.now() - start;
      console.log(`${colors.red}FAIL${colors.reset} (${elapsed.toFixed(1)}ms)`);
      console.error(`  ↳ ${colors.red}${err.message}${colors.reset}`);
      failedTests++;
      failureDetails.push({ name, error: err.message });
    }
  }

  // ==========================================================================
  // PILLAR 1: HIGH-CONCURRENCY FLOOD TEST & EVENT LOOP LATENCY
  // ==========================================================================
  console.log(`${colors.yellow}>>> [PILLAR 1] High-Concurrency Flood & Event Loop Health${colors.reset}`);

  await runStep('A1: 1,000 distinct alerts flood test (<50ms total, <0.1ms/call avg, zero loop block)', async () => {
    const alerter = new ThreatAlerter({ maxQueueSize: 2000, dedupWindowMs: 60000 });

    let maxLagMs = 0;
    let lastTick = performance.now();
    const intervalTimer = setInterval(() => {
      const now = performance.now();
      const lag = now - lastTick - 2;
      if (lag > maxLagMs) maxLagMs = lag;
      lastTick = now;
    }, 2);

    const callDurations = [];
    const t0 = performance.now();

    for (let i = 0; i < 1000; i++) {
      const c0 = performance.now();
      const res = alerter.dispatchAlert('SENSITIVE_PROBE', {
        clientIp: `10.199.${Math.floor(i / 250)}.${(i % 250) + 1}`,
        path: `/.env.fuzz.${i}`,
        severity: 'CRITICAL'
      });
      const c1 = performance.now();
      callDurations.push(c1 - c0);

      assert.strictEqual(res.enqueued, true, `Alert ${i} must be enqueued`);
      assert.ok(res.alertId, 'Alert must have valid UUID');
    }

    const totalElapsed = performance.now() - t0;
    clearInterval(intervalTimer);

    callDurations.sort((a, b) => a - b);
    const avgDuration = callDurations.reduce((sum, d) => sum + d, 0) / callDurations.length;
    const p50 = callDurations[Math.floor(callDurations.length * 0.50)];
    const p95 = callDurations[Math.floor(callDurations.length * 0.95)];
    const p99 = callDurations[Math.floor(callDurations.length * 0.99)];
    const maxCall = callDurations[callDurations.length - 1];

    empiricalMetrics.flood1000 = {
      totalElapsedMs: totalElapsed,
      avgCallMs: avgDuration,
      p50Ms: p50,
      p95Ms: p95,
      p99Ms: p99,
      maxCallMs: maxCall,
      maxEventLoopLagMs: maxLagMs
    };

    console.log(`\n    [Empirical Metrics - 1,000 Flood]`);
    console.log(`    - Total Time: ${totalElapsed.toFixed(3)} ms (threshold: < 50 ms)`);
    console.log(`    - Average Call: ${avgDuration.toFixed(5)} ms (threshold: < 0.1 ms)`);
    console.log(`    - P50: ${p50.toFixed(5)} ms | P95: ${p95.toFixed(5)} ms | P99: ${p99.toFixed(5)} ms | Max: ${maxCall.toFixed(5)} ms`);
    console.log(`    - Max Event Loop Lag: ${maxLagMs.toFixed(3)} ms`);

    assert.ok(totalElapsed < 50, `1,000 alerts must complete under 50ms (actual: ${totalElapsed.toFixed(2)}ms)`);
    assert.ok(avgDuration < 0.1, `Average synchronous call duration must be < 0.1ms (actual: ${avgDuration.toFixed(4)}ms)`);
    assert.ok(maxLagMs < 15, `Event loop lag must remain below 15ms during burst (actual: ${maxLagMs.toFixed(2)}ms)`);

    await new Promise(r => setTimeout(r, 60));
    const stats = alerter.getQueueStats();
    assert.strictEqual(stats.queueLength, 0, 'Worker must drain the queue completely');
    assert.strictEqual(stats.totalDispatched, 1000, 'All 1,000 alerts must be marked dispatched');

    alerter.close();
  });

  await runStep('A2: Extreme 5,000 alert flood with queue boundary enforcement (bounded memory)', async () => {
    const maxQueue = 1000;
    const alerter = new ThreatAlerter({ maxQueueSize: maxQueue, dedupWindowMs: 60000 });

    const memBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < 5000; i++) {
      alerter.dispatchAlert('BRUTE_FORCE_LOCKOUT', {
        clientIp: `172.16.${Math.floor(i / 250)}.${(i % 250) + 1}`,
        username: `attacker_${i}`,
        severity: 'HIGH'
      });
    }

    const memAfter = process.memoryUsage().heapUsed;
    const memDeltaMB = (memAfter - memBefore) / (1024 * 1024);
    const stats = alerter.getQueueStats();

    empiricalMetrics.boundedQueue = {
      queueLength: stats.queueLength,
      totalDropped: stats.totalDropped,
      memDeltaMB
    };

    console.log(`\n    [Empirical Metrics - 5,000 Memory Boundary]`);
    console.log(`    - Queue Length: ${stats.queueLength} (capped at ${maxQueue})`);
    console.log(`    - Total Dropped: ${stats.totalDropped} (expected 4000)`);
    console.log(`    - Heap Delta: ${memDeltaMB.toFixed(2)} MB`);

    assert.ok(stats.queueLength <= maxQueue, `Queue length (${stats.queueLength}) must not exceed maxQueueSize (${maxQueue})`);
    assert.strictEqual(stats.totalDropped, 4000, `Exactly 4,000 overflow alerts must be cleanly dropped`);
    assert.ok(memDeltaMB < 30, `Memory delta must remain under 30MB (actual: ${memDeltaMB.toFixed(2)}MB)`);

    alerter.close();
  });

  // ==========================================================================
  // PILLAR 2: BURST COALESCING & DEDUPLICATION DYNAMICS
  // ==========================================================================
  console.log(`\n${colors.yellow}>>> [PILLAR 2] Burst Coalescing & Rate Limit Shield${colors.reset}`);

  await runStep('B1: 50 rapid bursts from same IP verify 1 immediate alert & 49 suppressed', async () => {
    const dedupWindow = 80;
    const alerter = new ThreatAlerter({ dedupWindowMs: dedupWindow });
    const clientIp = '198.51.100.99';

    const res1 = alerter.dispatchAlert('IP_QUARANTINED', { clientIp, reason: 'RAPID_BURST_ATTACK' });
    assert.strictEqual(res1.enqueued, true, 'First alert in burst must be enqueued');
    assert.strictEqual(res1.deduplicated, false);
    const firstAlertId = res1.alertId;

    for (let i = 1; i < 50; i++) {
      const burstRes = alerter.dispatchAlert('IP_QUARANTINED', { clientIp, reason: 'RAPID_BURST_ATTACK' });
      assert.strictEqual(burstRes.enqueued, false, `Alert ${i + 1} must NOT be enqueued`);
      assert.strictEqual(burstRes.deduplicated, true, `Alert ${i + 1} must be flagged deduplicated`);
      assert.strictEqual(burstRes.alertId, firstAlertId, 'Must reference the primary burst alertId');
      assert.strictEqual(burstRes.suppressedCount, i, `Suppressed count must increment to ${i}`);
    }

    empiricalMetrics.burstCoalescing = {
      initialEnqueued: 1,
      totalSuppressed: 49
    };

    await new Promise(r => setTimeout(r, 120));

    const recent = alerter.getRecentAlerts(10);
    assert.strictEqual(recent.length, 2, 'Recent buffer must contain exactly 2 entries (initial + summary)');

    const initialAlert = recent[0];
    const burstSummary = recent[1];

    assert.strictEqual(initialAlert.eventType, 'IP_QUARANTINED');
    assert.strictEqual(initialAlert.clientIp, clientIp);

    assert.strictEqual(burstSummary.eventType, 'BURST_SUMMARY');
    assert.strictEqual(burstSummary.clientIp, clientIp);
    assert.strictEqual(burstSummary.severity, 'HIGH');
    assert.strictEqual(burstSummary.details.suppressedCount, 49, 'Burst summary must report 49 suppressed incidents');
    assert.strictEqual(burstSummary.details.originalEventType, 'IP_QUARANTINED');
    assert.ok(burstSummary.summary.includes('49 additional IP_QUARANTINED incidents from IP 198.51.100.99 suppressed'));

    alerter.close();
  });

  await runStep('B2: Multi-IP concurrent burst isolation (IP A vs IP B independently coalesced)', async () => {
    const dedupWindow = 80;
    const alerter = new ThreatAlerter({ dedupWindowMs: dedupWindow });
    const ipA = '192.0.2.10';
    const ipB = '192.0.2.20';

    for (let i = 0; i < 25; i++) {
      const resA = alerter.dispatchAlert('REPLAY_ATTACK', { clientIp: ipA, username: 'victimA' });
      const resB = alerter.dispatchAlert('REPLAY_ATTACK', { clientIp: ipB, username: 'victimB' });

      if (i === 0) {
        assert.strictEqual(resA.enqueued, true);
        assert.strictEqual(resB.enqueued, true);
      } else {
        assert.strictEqual(resA.enqueued, false);
        assert.strictEqual(resB.enqueued, false);
        assert.strictEqual(resA.suppressedCount, i);
        assert.strictEqual(resB.suppressedCount, i);
      }
    }

    await new Promise(r => setTimeout(r, 120));

    const recent = alerter.getRecentAlerts(10);
    assert.strictEqual(recent.length, 4, 'Must have 2 initial alerts and 2 burst summaries');

    const summaries = recent.filter(a => a.eventType === 'BURST_SUMMARY');
    assert.strictEqual(summaries.length, 2, 'Must have exactly 2 burst summaries');

    const summaryA = summaries.find(s => s.clientIp === ipA);
    const summaryB = summaries.find(s => s.clientIp === ipB);

    assert.ok(summaryA, 'Summary for IP A must exist');
    assert.ok(summaryB, 'Summary for IP B must exist');
    assert.strictEqual(summaryA.details.suppressedCount, 24);
    assert.strictEqual(summaryB.details.suppressedCount, 24);

    alerter.close();
  });

  await runStep('B3: Sequential burst cycles (fresh deduplication cycle after cooldown)', async () => {
    const dedupWindow = 60;
    const alerter = new ThreatAlerter({ dedupWindowMs: dedupWindow });
    const ip = '198.51.100.55';

    const r1 = alerter.dispatchAlert('SENSITIVE_PROBE', { clientIp: ip });
    assert.strictEqual(r1.enqueued, true);
    for (let i = 1; i < 5; i++) alerter.dispatchAlert('SENSITIVE_PROBE', { clientIp: ip });

    await new Promise(r => setTimeout(r, 90));

    const r2 = alerter.dispatchAlert('SENSITIVE_PROBE', { clientIp: ip });
    assert.strictEqual(r2.enqueued, true, 'After cooldown, next alert must be enqueued anew');
    assert.strictEqual(r2.deduplicated, false);

    for (let i = 1; i < 5; i++) alerter.dispatchAlert('SENSITIVE_PROBE', { clientIp: ip });

    await new Promise(r => setTimeout(r, 90));

    const recent = alerter.getRecentAlerts(10);
    assert.strictEqual(recent.length, 4, 'Should cleanly produce 2 cycles of alert + summary');

    alerter.close();
  });

  // ==========================================================================
  // PILLAR 3: ADVERSARIAL CREDENTIAL LEAK RESISTANCE
  // ==========================================================================
  console.log(`\n${colors.yellow}>>> [PILLAR 3] Adversarial Credential Leak Resistance${colors.reset}`);

  await runStep('C1: Baseline redaction of standard credentials (passwords, JWTs, Bearer, tokens)', async () => {
    const alerter = new ThreatAlerter();

    const canaryPassword = 'CANARY_PLAINTEXT_PASSWORD_998877';
    const canaryJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.CANARY_JWT_SIGNATURE_SECRET';
    const canaryBearer = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.CANARY_BEARER_SIGNATURE';
    const canaryApiKey = 'sk_live_citadel_canary_key_1122334455';
    const canaryCookie = 'auth_token=CANARY_COOKIE_SECRET_9988';

    const baselinePayload = {
      pAsSwOrD: canaryPassword,
      PASSWORD_HASH: '$2b$12$canaryHashVal',
      Jwt: canaryJwt,
      aPi_kEy: canaryApiKey,
      sEt_cOoKiE: canaryCookie,
      two_factor_secret: 'JBSWY3DPEHPK3PXP_CANARY',
      cvv_code: '999',
      headersArray: [
        { Authorization: canaryBearer },
        canaryJwt
      ],
      incidentReason: 'BASELINE_LEAK_TEST'
    };

    const res = alerter.dispatchAlert('BRUTE_FORCE_LOCKOUT', {
      clientIp: '203.0.113.123',
      details: baselinePayload
    });

    assert.strictEqual(res.enqueued, true);
    await new Promise(r => setTimeout(r, 40));

    const recent = alerter.getRecentAlerts(1);
    const alert = recent[0];
    const serialized = JSON.stringify(alert);

    assert.strictEqual(serialized.includes(canaryPassword), false, 'Canary password MUST NOT appear in serialized alert');
    assert.strictEqual(serialized.includes(canaryApiKey), false, 'Canary API key MUST NOT appear in serialized alert');
    assert.strictEqual(serialized.includes(canaryCookie), false, 'Canary cookie MUST NOT appear in serialized alert');
    assert.strictEqual(serialized.includes('CANARY_JWT_SIGNATURE_SECRET'), false, 'Canary JWT signature MUST NOT appear in serialized alert');
    assert.strictEqual(serialized.includes('CANARY_BEARER_SIGNATURE'), false, 'Canary Bearer token MUST NOT appear in serialized alert');

    alerter.close();
  });

  await runStep('C2: [ADVERSARIAL CHALLENGE] Compound credential keys redaction (myPrivateKey, credit_card_number, user_credentials, sessionId, passphrase, auth)', async () => {
    const alerter = new ThreatAlerter();

    const compoundKeysPayload = {
      sessionId: 'sess_secret_token_1234567890',
      credit_card_number: '4532 1234 5678 9010',
      user_credentials: 'user:SuperSecretPassword123!',
      ssl_private_key: 'citadel_private_key_hex_value',
      myPrivateKey: 'citadel_custom_private_key_data',
      auth: 'Basic YWRtaW46cGFzczEyMw==',
      passphrase: 'correct-horse-battery-staple'
    };

    alerter.dispatchAlert('BRUTE_FORCE_LOCKOUT', {
      clientIp: '203.0.113.124',
      details: compoundKeysPayload
    });

    await new Promise(r => setTimeout(r, 40));

    const recent = alerter.getRecentAlerts(1);
    const alert = recent[0];
    const serialized = JSON.stringify(alert);

    // Adversarial verification: none of these sensitive credentials should be present
    assert.strictEqual(serialized.includes('sess_secret_token_1234567890'), false, 'Session ID MUST be redacted');
    assert.strictEqual(serialized.includes('4532 1234 5678 9010'), false, 'Credit card number MUST be redacted');
    assert.strictEqual(serialized.includes('SuperSecretPassword123!'), false, 'User credentials password MUST be redacted');
    assert.strictEqual(serialized.includes('citadel_private_key_hex_value'), false, 'SSL private key MUST be redacted');
    assert.strictEqual(serialized.includes('citadel_custom_private_key_data'), false, 'myPrivateKey MUST be redacted');
    assert.strictEqual(serialized.includes('Basic YWRtaW46cGFzczEyMw=='), false, 'Auth basic credentials MUST be redacted');
    assert.strictEqual(serialized.includes('correct-horse-battery-staple'), false, 'Passphrase MUST be redacted');

    alerter.close();
  });

  await runStep('C3: [ADVERSARIAL CHALLENGE] PEM Private Key detection in string values (BEGIN RSA PRIVATE KEY)', async () => {
    const alerter = new ThreatAlerter();

    const canaryPrivateKey = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0CANARY\n-----END RSA PRIVATE KEY-----';

    const payload = {
      lvl7_deep_key: canaryPrivateKey,
      certBundle: {
        serverCert: 'public-cert-data',
        tlsKey: canaryPrivateKey
      }
    };

    alerter.dispatchAlert('SENSITIVE_PROBE', {
      clientIp: '203.0.113.125',
      details: payload
    });

    await new Promise(r => setTimeout(r, 40));

    const recent = alerter.getRecentAlerts(1);
    const alert = recent[0];
    const serialized = JSON.stringify(alert);

    assert.strictEqual(serialized.includes('BEGIN RSA PRIVATE KEY'), false, 'PEM private key string MUST be redacted');

    alerter.close();
  });

  await runStep('C4: [ADVERSARIAL CHALLENGE] URL query parameters with secrets in SENSITIVE_PROBE', async () => {
    const alerter = new ThreatAlerter();

    const sensitivePath = '/api/v1/auth/callback?code=SECRET_AUTH_CODE_999&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoxfQ.SECRET_TOKEN_SIG&password=LeakedPassword123!';

    alerter.dispatchAlert('SENSITIVE_PROBE', {
      clientIp: '198.51.100.77',
      path: sensitivePath,
      details: {
        rawUrl: sensitivePath
      }
    });

    await new Promise(r => setTimeout(r, 40));

    const recent = alerter.getRecentAlerts(1);
    const alert = recent[0];
    const serialized = JSON.stringify(alert);

    assert.strictEqual(serialized.includes('LeakedPassword123!'), false, 'Password in probe path URL MUST NOT leak into alert or summary');
    assert.strictEqual(serialized.includes('SECRET_TOKEN_SIG'), false, 'Token signature in probe path URL MUST NOT leak into alert or summary');
    assert.strictEqual(serialized.includes('SECRET_AUTH_CODE_999'), false, 'Auth code in probe path URL MUST NOT leak into alert or summary');

    alerter.close();
  });

  await runStep('C5: [ADVERSARIAL CHALLENGE] Caller-supplied summary containing credentials', async () => {
    const alerter = new ThreatAlerter();

    const secretSummary = 'Login failed with password SuperSecretCanary999 and token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1IjoxfQ.SECRET_SIG';

    alerter.dispatchAlert('BRUTE_FORCE_LOCKOUT', {
      clientIp: '198.51.100.88',
      summary: secretSummary,
      details: { username: 'admin' }
    });

    await new Promise(r => setTimeout(r, 40));

    const recent = alerter.getRecentAlerts(1);
    const alert = recent[0];
    const serialized = JSON.stringify(alert);

    assert.strictEqual(serialized.includes('SuperSecretCanary999'), false, 'Password in caller summary MUST be sanitized');
    assert.strictEqual(serialized.includes('SECRET_SIG'), false, 'JWT in caller summary MUST be sanitized');

    alerter.close();
  });

  await runStep('C6: Circular reference torture test (prevent recursion stack overflow)', async () => {
    const alerter = new ThreatAlerter();

    const circularObj = {
      username: 'circular_attacker',
      safeProperty: 'brosan_citadel'
    };
    circularObj.self = circularObj;
    circularObj.nestedCycle = {
      parent: circularObj,
      secretKey: 'MUST_BE_REDACTED_SECRET',
      deepCycle: circularObj
    };

    let caughtError = null;
    let res = null;
    try {
      res = alerter.dispatchAlert('SENSITIVE_PROBE', {
        clientIp: '198.51.100.8',
        details: circularObj
      });
    } catch (err) {
      caughtError = err;
    }

    assert.strictEqual(caughtError, null, 'dispatchAlert must not throw on circular references');
    assert.strictEqual(res.enqueued, true);

    await new Promise(r => setTimeout(r, 40));

    const recent = alerter.getRecentAlerts(1);
    assert.strictEqual(recent.length, 1);
    const alert = recent[0];

    let jsonSerialized = null;
    let jsonError = null;
    try {
      jsonSerialized = JSON.stringify(alert);
    } catch (err) {
      jsonError = err;
    }

    assert.strictEqual(jsonError, null, 'Alert containing circular object must serialize to JSON without throwing');
    assert.ok(jsonSerialized.length > 0, 'Serialized string must be non-empty');
    assert.strictEqual(jsonSerialized.includes('MUST_BE_REDACTED_SECRET'), false, 'Secret inside circular object must be redacted');

    alerter.close();
  });

  await runStep('C7: Prototype pollution payload resistance', async () => {
    const alerter = new ThreatAlerter();

    const protoPayload = JSON.parse('{"__proto__":{"pollutedKey":"hacked"},"constructor":{"prototype":{"pollutedKey2":"hacked2"}},"safeKey":"safeValue"}');

    const res = alerter.dispatchAlert('SENSITIVE_PROBE', {
      clientIp: '198.51.100.9',
      details: protoPayload
    });

    assert.strictEqual(res.enqueued, true);

    assert.strictEqual({}.pollutedKey, undefined, 'Object.prototype must not be polluted with pollutedKey');
    assert.strictEqual({}.pollutedKey2, undefined, 'Object.prototype must not be polluted with pollutedKey2');

    await new Promise(r => setTimeout(r, 30));
    alerter.close();
  });

  await runStep('C8: Exotic degenerate types (null, undefined, Symbols, Functions, Buffers)', async () => {
    const alerter = new ThreatAlerter();

    const weirdPayload = {
      nullVal: null,
      undefinedVal: undefined,
      emptyString: '',
      zeroNum: 0,
      nanNum: NaN,
      boolFalse: false,
      dateVal: new Date(),
      bufferVal: Buffer.from('citadel-buffer-test'),
      fnVal: () => 'execute_code',
      arrayWithHoles: [1, null, undefined, 4],
      symbolProp: Symbol('secretSymbol')
    };

    let dispatchError = null;
    try {
      alerter.dispatchAlert('IP_QUARANTINED', {
        clientIp: '10.0.0.1',
        details: weirdPayload
      });
    } catch (err) {
      dispatchError = err;
    }

    assert.strictEqual(dispatchError, null, 'Degenerate types must not crash dispatchAlert');

    await new Promise(r => setTimeout(r, 30));
    const recent = alerter.getRecentAlerts(1);
    assert.strictEqual(recent.length, 1);
    assert.strictEqual(recent[0].details.nullVal, null);
    assert.strictEqual(recent[0].details.zeroNum, 0);

    alerter.close();
  });

  // ==========================================================================
  // PILLAR 4: NETWORK FAILURE RESILIENCE
  // ==========================================================================
  console.log(`\n${colors.yellow}>>> [PILLAR 4] Hostile Network Failure Resilience${colors.reset}`);

  await runStep('D1: Webhook HTTP 500 (Internal Server Error) handling', async () => {
    let requestsReceived = 0;
    const server = http.createServer((req, res) => {
      requestsReceived++;
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'DATABASE_FAILURE_ON_WEBHOOK_RECEIVER' }));
    });

    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const port = server.address().port;
    const webhookUrl = `http://127.0.0.1:${port}/fail-500`;

    const alerter = new ThreatAlerter({ webhookUrl, timeoutMs: 1000 });
    const res = alerter.dispatchAlert('IP_QUARANTINED', { clientIp: '192.168.1.1' });
    assert.strictEqual(res.enqueued, true);

    await new Promise(r => setTimeout(r, 80));

    assert.strictEqual(requestsReceived, 1, 'Server should have received exactly 1 webhook call');
    const stats = alerter.getQueueStats();
    assert.strictEqual(stats.queueLength, 0, 'Worker must complete and clear queue');
    assert.strictEqual(stats.totalDispatched, 1);

    server.close();
    alerter.close();
  });

  await runStep('D2: Webhook HTTP 429 (Too Many Requests / Rate Limited) handling', async () => {
    let requestsReceived = 0;
    const server = http.createServer((req, res) => {
      requestsReceived++;
      res.writeHead(429, {
        'Content-Type': 'application/json',
        'Retry-After': '60'
      });
      res.end(JSON.stringify({ error: 'RATE_LIMIT_EXCEEDED' }));
    });

    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const port = server.address().port;
    const webhookUrl = `http://127.0.0.1:${port}/rate-limited-429`;

    const alerter = new ThreatAlerter({ webhookUrl, timeoutMs: 1000 });
    const res = alerter.dispatchAlert('BRUTE_FORCE_LOCKOUT', { clientIp: '192.168.1.2' });
    assert.strictEqual(res.enqueued, true);

    await new Promise(r => setTimeout(r, 80));

    assert.strictEqual(requestsReceived, 1);
    const stats = alerter.getQueueStats();
    assert.strictEqual(stats.queueLength, 0);

    server.close();
    alerter.close();
  });

  await runStep('D3: Immediate TCP connection reset (ECONNRESET simulation)', async () => {
    const tcpServer = net.createServer((socket) => {
      socket.destroy();
    });

    await new Promise(r => tcpServer.listen(0, '127.0.0.1', r));
    const port = tcpServer.address().port;
    const webhookUrl = `http://127.0.0.1:${port}/reset-socket`;

    const alerter = new ThreatAlerter({ webhookUrl, timeoutMs: 1000 });
    const res = alerter.dispatchAlert('REPLAY_ATTACK', { clientIp: '192.168.1.3' });
    assert.strictEqual(res.enqueued, true);

    await new Promise(r => setTimeout(r, 100));

    const stats = alerter.getQueueStats();
    assert.strictEqual(stats.queueLength, 0, 'Queue must finish despite ECONNRESET');

    tcpServer.close();
    alerter.close();
  });

  await runStep('D4: Unresolvable DNS hostname (ENOTFOUND simulation)', async () => {
    const unresolvableUrl = 'http://citadel-nonexistent-domain-404-threat-alerter.invalid:9999/webhook';

    const alerter = new ThreatAlerter({ webhookUrl: unresolvableUrl, timeoutMs: 1000 });
    const res = alerter.dispatchAlert('SENSITIVE_PROBE', { clientIp: '192.168.1.4' });
    assert.strictEqual(res.enqueued, true);

    await new Promise(r => setTimeout(r, 200));

    const stats = alerter.getQueueStats();
    assert.strictEqual(stats.queueLength, 0, 'Queue must drain without unhandled rejection');

    alerter.close();
  });

  await runStep('D5: Blackhole connection timeout simulation (AbortSignal.timeout)', async () => {
    const blackholeServer = http.createServer((req, res) => {});

    await new Promise(r => blackholeServer.listen(0, '127.0.0.1', r));
    const port = blackholeServer.address().port;
    const webhookUrl = `http://127.0.0.1:${port}/blackhole`;

    const timeoutMs = 150;
    const alerter = new ThreatAlerter({ webhookUrl, timeoutMs });

    const res = alerter.dispatchAlert('IP_QUARANTINED', { clientIp: '192.168.1.5' });
    assert.strictEqual(res.enqueued, true);

    await new Promise(r => setTimeout(r, 250));

    const stats = alerter.getQueueStats();
    assert.strictEqual(stats.queueLength, 0, 'Worker must abort timed out request and finish queue');

    blackholeServer.close();
    alerter.close();
  });

  await runStep('D6: Simultaneous Telegram + Webhook dual failure without unhandled rejections', async () => {
    const alerter = new ThreatAlerter({
      webhookUrl: 'http://127.0.0.1:58999/down',
      telegramBotToken: '000000000:AAE_citadel_invalid_token',
      telegramChatId: '12345678',
      timeoutMs: 300
    });

    for (let i = 0; i < 5; i++) {
      alerter.dispatchAlert('SENSITIVE_PROBE', { clientIp: `10.50.0.${i + 1}` });
    }

    // Active drain polling with 2000ms deadline
    const deadline = Date.now() + 2000;
    while (alerter.getQueueStats().queueLength > 0 && Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 50));
    }

    const stats = alerter.getQueueStats();
    assert.strictEqual(stats.queueLength, 0, 'All 5 dual-failing alerts must be processed cleanly');
    assert.strictEqual(stats.totalDispatched, 5);

    alerter.close();
  });

  assert.strictEqual(unhandledRejectionsCount, 0, `Unhandled rejections count must be ZERO (actual: ${unhandledRejectionsCount})`);

  // ==========================================================================
  // FINAL SUMMARY & EMPIRICAL SCORECARD
  // ==========================================================================
  console.log(`\n${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bold}⚔️ ADVERSARIAL STRESS TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)${colors.reset}`);
  console.log(`${colors.cyan}========================================================================${colors.reset}`);

  if (failureDetails.length > 0) {
    console.log(`\n${colors.red}${colors.bold}Identified Empirical Vulnerabilities:${colors.reset}`);
    failureDetails.forEach((f, idx) => {
      console.log(`  ${idx + 1}. [${f.name}] -> ${f.error}`);
    });
  }

  if (failedTests > 0) {
    console.error(`\n${colors.red}${colors.bold}VERDICT: REQUEST_CHANGES — Failure detected in stress harness.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bold}VERDICT: APPROVE — All stress thresholds and adversarial vectors verified.${colors.reset}\n`);
  }
}

runAdversarialStressSuite().catch((err) => {
  console.error('Fatal crash in stress harness:', err);
  process.exit(1);
});
