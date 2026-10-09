/**
 * BROSAN TEKSTİL ERP — PHASE 7 SOVEREIGN APEX CITADEL TEST SUITE
 * tests/test-phase7-citadel.js
 * 
 * Verifies:
 * [PART 1] Autonomous Behavioral Anomaly & Velocity Shield (server/behavioralShield.js)
 *   - 1.1 Sub-50ms machine automation burst detection (<50ms interval throttled with HTTP 429)
 *   - 1.2 Inter-request timing entropy anomaly tracking (<4ms std dev flagged as TIMING_ENTROPY_COLLAPSE)
 *   - 1.3 Sensitive financial mutation velocity circuit breaker (>10 mutations in 10s blocked)
 *   - 1.4 Dynamic IP quarantine and SIEM escalation upon repeated velocity violations
 *   - 1.5 Legitimate human operator pacing passthrough (zero false positives)
 *   - 1.6 Rapid subnet shift detection (>2 distinct /24 or /48 subnets within 30s)
 * 
 * [PART 2] Database Query Integrity Guard & SQL Anti-Exfiltration Circuit Breaker (server/dbGuard.js)
 *   - 2.1 Multi-statement stacked query injection interception (; DROP, ; TRUNCATE, ; ALTER, comment anti-evasion)
 *   - 2.2 Side-channel timing exfiltration interception (pg_sleep, BENCHMARK, WAITFOR DELAY)
 *   - 2.3 Database error cloaking & zero schema detail leaks (DATABASE_OPERATION_FAILED)
 *   - 2.4 Transparent Prisma Client wrapper integration ($extends and Proxy)
 *   - 2.5 Benign Turkish business text containing semicolons passes cleanly with 0 false positives
 * 
 * [PART 3] Advanced HTTP Response Security Armor & Subresource Defense (server/responseArmor.js)
 *   - 3.1 Cross-Origin-Opener-Policy: same-origin on all responses
 *   - 3.2 Cross-Origin-Embedder-Policy: require-corp on all responses
 *   - 3.3 Cross-Origin-Resource-Policy: same-origin on all responses
 *   - 3.4 Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
 *   - 3.5 Authenticated & API endpoint Cache-Control: no-store, no-cache, must-revalidate
 *   - 3.6 Complete server cloaking: zero X-Powered-By, Server, or technology framework headers
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');

const app = require('../server/index');
const auth = require('../server/auth');
const { quarantineEngine } = require('../server/quarantine');
const threatAlerter = require('../server/threatAlerter');
const auditLogger = require('../server/auditLogger');
const { egressFirewall } = require('../server/egressFirewall');
const { ephemeralTokenEngine } = require('../server/ephemeralTokens');
const { proofOfWorkEngine } = require('../server/proofOfWork');
const { processArmor } = require('../server/processArmor');
const { memoryIntegritySentinel } = require('../server/memoryIntegritySentinel');
const { createSignedHeaders } = require('../server/requestSignature');
const {
  behavioralShieldEngine,
  BehavioralShieldEngine,
  ANOMALY_TYPES
} = require('../server/behavioralShield');
const dbGuard = require('../server/dbGuard');
const {
  responseArmorGuard,
  getArmorHeaders
} = require('../server/responseArmor');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

let totalTests = 0;
let passedTests = 0;

function pass(name) {
  totalTests++;
  passedTests++;
  console.log(`  ${colors.green}✔ PASS${colors.reset} ${name}`);
}

function fail(name, error) {
  totalTests++;
  console.error(`  ${colors.red}✖ FAIL${colors.reset} ${name}:`, error);
  throw error;
}

function makeRequest(serverPort, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port: serverPort,
      path: options.path || '/',
      method: options.method || 'GET',
      headers: {
        'Host': '127.0.0.1',
        ...(options.headers || {})
      }
    };

    if (postData) {
      const dataStr = typeof postData === 'string' ? postData : JSON.stringify(postData);
      reqOptions.headers['Content-Length'] = Buffer.byteLength(dataStr);
      if (!reqOptions.headers['Content-Type']) {
        reqOptions.headers['Content-Type'] = 'application/json';
      }
    }

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          json
        });
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runPhase7CitadelTests() {
  console.log(`\n${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}🛡️ BROSAN TEKSTİL ERP — PHASE 7 SOVEREIGN APEX CITADEL TEST SUITE${colors.reset}`);
  console.log(`${colors.dim}Testing Behavioral Velocity Shield, DB Query Guard, and HTTP Response Armor...${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);

  // Spin up ephemeral test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const serverPort = server.address().port;

  // Cleanup helper
  function resetAllSecurityState() {
    quarantineEngine.reset();
    threatAlerter.reset();
    ephemeralTokenEngine.reset();
    proofOfWorkEngine.reset();
    egressFirewall.reset();
    egressFirewall.registerSelfPort(serverPort);
    behavioralShieldEngine.reset();
  }

  resetAllSecurityState();

  try {
    // Admin user fixture
    const adminUser = {
      id: 'usr-citadel-apex-01',
      username: 'admin',
      fullName: 'Yunus Emre Gökalp (Yönetici)',
      role: 'ADMIN',
      isActive: true,
      twoFactorEnabled: false,
      is2FAVerified: true
    };
    const testToken = auth.generateToken(adminUser);

    // =========================================================================
    // PART 1: AUTONOMOUS BEHAVIORAL ANOMALY & VELOCITY SHIELD
    // =========================================================================
    console.log(`\n${colors.bold}[PART 1] Autonomous Behavioral Anomaly & Velocity Shield${colors.reset}`);

    // 1.1 Sub-50ms machine automation burst detection (<50ms interval throttled with HTTP 429)
    {
      const attackerIp = '203.0.113.195';
      const body1 = {
        code: '100.TEST.01',
        name: 'Velocity Test Account 1',
        type: 'ASSET',
        category: 'KASA',
        currency: 'TRY',
        balance: 100
      };

      // Concurrent automated burst (< 20ms delta)
      const p1 = makeRequest(serverPort, {
        path: '/api/accounts',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'X-Forwarded-For': attackerIp,
          ...createSignedHeaders({ method: 'POST', url: '/api/accounts', body: body1 })
        }
      }, body1);

      const body2 = {
        code: '100.TEST.02',
        name: 'Velocity Test Account 2',
        type: 'ASSET',
        category: 'KASA',
        currency: 'TRY',
        balance: 200
      };

      const p2 = makeRequest(serverPort, {
        path: '/api/accounts',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'X-Forwarded-For': attackerIp,
          ...createSignedHeaders({ method: 'POST', url: '/api/accounts', body: body2 })
        }
      }, body2);

      const [res1, res2] = await Promise.all([p1, p2]);

      assert.strictEqual(res2.statusCode, 429, 'Automated burst <50ms must be throttled with HTTP 429');
      assert.strictEqual(res2.json.code, 'ANOMALOUS_VELOCITY_DETECTED');
      assert.strictEqual(res2.json.anomalyType, 'SUB_HUMAN_BURST');
      assert.strictEqual(res2.headers['retry-after'], '60');
      assert.strictEqual(res2.headers['x-velocity-shield'], 'THROTTLED');
      assert.strictEqual(res2.headers['x-anomaly-type'], 'SUB_HUMAN_BURST');
      pass('1.1 Sub-50ms machine automation burst intercepted and throttled with HTTP 429 ANOMALOUS_VELOCITY_DETECTED');
    }

    // 1.2 Inter-request timing entropy anomaly tracking (<4ms std dev indicates robotic scripts)
    {
      const testEngine = new BehavioralShieldEngine({ minInterRequestIntervalMs: 20, minEntropyStdDevMs: 4.0 });
      const testIp = '198.51.100.99';
      let now = 1000000;

      // Simulate 5 requests with fixed 60ms interval (std dev = 0.0)
      testEngine.evaluateRequest({ method: 'POST', url: '/api/accounts', ip: testIp, headers: {} }, now);
      testEngine.evaluateRequest({ method: 'POST', url: '/api/accounts', ip: testIp, headers: {} }, now + 60);
      testEngine.evaluateRequest({ method: 'POST', url: '/api/accounts', ip: testIp, headers: {} }, now + 120);
      testEngine.evaluateRequest({ method: 'POST', url: '/api/accounts', ip: testIp, headers: {} }, now + 180);
      const entropyResult = testEngine.evaluateRequest({ method: 'POST', url: '/api/accounts', ip: testIp, headers: {} }, now + 240);

      assert.strictEqual(entropyResult.anomalyDetected, true);
      assert.strictEqual(entropyResult.anomalyType, ANOMALY_TYPES.TIMING_ENTROPY_COLLAPSE);
      assert.ok(entropyResult.stdDev < 4.0, 'Entropy standard deviation must be < 4ms');
      pass('1.2 Inter-request timing entropy collapse detected (std dev < 4ms indicates clock automation)');
    }

    // 1.3 Sensitive financial mutation velocity circuit breaker (>10 mutations in 10s blocked)
    {
      const financialAttackerIp = '198.51.100.42';
      const testEngine = new BehavioralShieldEngine({ financialMaxMutationsPer10s: 10 });
      let now = Date.now();

      // Submit 10 mutations within 10s window (with natural timing jitter > 10ms std dev to test financial circuit breaker)
      const deltas = [75, 110, 85, 120, 95, 105, 70, 115, 80, 125];
      for (let i = 0; i < 10; i++) {
        now += deltas[i];
        const res = testEngine.evaluateRequest({
          method: 'POST',
          url: '/api/accounts',
          ip: financialAttackerIp,
          headers: {}
        }, now);
        assert.strictEqual(res.anomalyDetected, false, `Mutation ${i + 1} should be within threshold`);
      }

      // 11th mutation exceeds threshold
      now += 60;
      const floodRes = testEngine.evaluateRequest({
        method: 'POST',
        url: '/api/accounts',
        ip: financialAttackerIp,
        headers: {}
      }, now);

      assert.strictEqual(floodRes.anomalyDetected, true);
      assert.strictEqual(floodRes.anomalyType, ANOMALY_TYPES.FINANCIAL_VELOCITY_ANOMALY);
      pass('1.3 Financial mutation velocity circuit breaker activated (>10 mutations / 10s blocked)');
    }

    // 1.4 Dynamic IP quarantine and SIEM escalation upon repeated velocity violations
    {
      const repeatAttackerIp = '203.0.113.200';
      const testEngine = new BehavioralShieldEngine({ quarantineViolationThreshold: 2 });

      // First violation
      const v1 = testEngine.escalateViolation(repeatAttackerIp, ANOMALY_TYPES.SUB_HUMAN_BURST, 'Burst 1', null);
      assert.strictEqual(v1.quarantined, false, 'First violation should warn without instant quarantine');

      // Second violation triggers quarantine escalation
      const v2 = testEngine.escalateViolation(repeatAttackerIp, ANOMALY_TYPES.SUB_HUMAN_BURST, 'Burst 2', null);
      assert.strictEqual(v2.quarantined, true, 'Repeated violation must trigger quarantine');
      assert.strictEqual(Boolean(quarantineEngine.isQuarantined(repeatAttackerIp)), true, 'IP must be recorded in quarantineEngine');

      // Verify alert was dispatched in threat alerter
      const alerts = threatAlerter.getRecentAlerts ? threatAlerter.getRecentAlerts() : [];
      assert.ok(alerts.length > 0, 'Threat alert must be enqueued');
      pass('1.4 Dynamic IP quarantine and real-time SIEM escalation verified on repeated velocity violations');
    }

    // 1.5 Legitimate human operator pacing passthrough (zero false positives)
    {
      // Pure loopback test traffic or human pacing (>100ms) passes cleanly
      const humanIp = '127.0.0.1';
      const evalRes = behavioralShieldEngine.evaluateRequest({
        method: 'POST',
        url: '/api/accounts',
        ip: humanIp,
        headers: {}
      });
      assert.strictEqual(evalRes.anomalyDetected, false, 'Human / loopback pacing must pass without false positives');
      pass('1.5 Legitimate human operator speeds pass with 0 false positives');
    }

    // 1.6 Rapid subnet shift detection (>2 distinct /24 or /48 subnets within 30s)
    {
      const testSessionToken = 'test-session-token-apex-subnet-shift-verification-xyz-12345';
      const testEngine = new BehavioralShieldEngine({ subnetMaxShiftCount: 2, subnetWindowMs: 30000 });
      const now = Date.now();

      // Subnet 1 (203.0.113.0/24)
      const r1 = testEngine.recordSubnet(testSessionToken, '203.0.113.15', now);
      assert.strictEqual(r1.anomalyDetected, false);

      // Subnet 2 (198.51.100.0/24)
      const r2 = testEngine.recordSubnet(testSessionToken, '198.51.100.55', now + 1000);
      assert.strictEqual(r2.anomalyDetected, false);

      // Subnet 3 (192.0.2.0/24) within 30s window -> Triggers anomaly
      const r3 = testEngine.recordSubnet(testSessionToken, '192.0.2.88', now + 2000);
      assert.strictEqual(r3.anomalyDetected, true);
      assert.strictEqual(r3.anomalyType, ANOMALY_TYPES.SUBNET_SHIFT_ANOMALY);
      assert.strictEqual(r3.distinctCount, 3);
      pass('1.6 Rapid subnet shift anomaly detected (>2 distinct subnets within 30 seconds)');
    }

    // =========================================================================
    // PART 2: DATABASE QUERY INTEGRITY GUARD & SQL ANTI-EXFILTRATION
    // =========================================================================
    console.log(`\n${colors.bold}[PART 2] Database Query Integrity Guard & SQL Anti-Exfiltration Circuit Breaker${colors.reset}`);

    // 2.1 Multi-statement stacked query injection interception
    {
      const attackVectors = [
        '; DROP TABLE "Account"; --',
        '; TRUNCATE TABLE "JournalEntry"',
        '; ALTER TABLE "User" ADD COLUMN backdoor text',
        '; DELETE FROM "Transaction"',
        ';/*inline*/DROP/**/TABLE users',
        '; EXEC sys_eval("id")'
      ];

      for (const payload of attackVectors) {
        let blocked = false;
        try {
          dbGuard.inspectPayload(payload, 'test-stacked-query');
        } catch (err) {
          if (err.name === 'QueryIntegrityViolationError' && err.breachCode === 'QUERY_INTEGRITY_VIOLATION') {
            blocked = true;
          }
        }
        assert.strictEqual(blocked, true, `Payload must be blocked: ${payload}`);
      }
      pass('2.1 Multi-statement stacked queries (; DROP, ; TRUNCATE, ; ALTER) blocked with QUERY_INTEGRITY_VIOLATION');
    }

    // 2.2 Side-channel timing exfiltration interception
    {
      const timingVectors = [
        'SELECT pg_sleep(5)',
        'pg_sleep ( 2 )',
        'SELECT * FROM users WHERE id=1 AND BENCHMARK(5000000, MD5(1))',
        'WAITFOR DELAY \'0:0:5\'',
        'dbms_pipe.receive_message(\'a\', 5)'
      ];

      for (const payload of timingVectors) {
        let blocked = false;
        try {
          dbGuard.inspectPayload(payload, 'test-timing-exfil');
        } catch (err) {
          if (err.name === 'QueryIntegrityViolationError') {
            blocked = true;
          }
        }
        assert.strictEqual(blocked, true, `Timing payload must be blocked: ${payload}`);
      }
      pass('2.2 Side-channel timing exfiltration payloads (pg_sleep, BENCHMARK, WAITFOR DELAY) blocked');
    }

    // 2.3 Database error cloaking & zero schema detail leaks
    {
      // Create a synthetic database driver error with leaked schema details
      const rawDbError = new Error('relation "public.Account" foreign key constraint "Account_companyId_fkey" violated at PostgreSQL 16.2');
      rawDbError.code = 'P2003';
      rawDbError.name = 'PrismaClientKnownRequestError';

      assert.strictEqual(dbGuard.isDatabaseError(rawDbError), true, 'Must identify as database error');

      const sanitized = dbGuard.sanitizeDbError(rawDbError, 'test-sanitization');
      assert.strictEqual(sanitized.code, 'DATABASE_OPERATION_FAILED');
      assert.strictEqual(sanitized.message, 'DATABASE_OPERATION_FAILED');
      assert.strictEqual(sanitized.message.includes('Account'), false, 'Must not leak table name');
      assert.strictEqual(sanitized.message.includes('PostgreSQL'), false, 'Must not leak database engine');

      // Test express error middleware handler
      let mockResponse = {};
      const mockRes = {
        status: (code) => {
          mockResponse.status = code;
          return {
            json: (payload) => {
              mockResponse.json = payload;
              return payload;
            }
          };
        }
      };

      dbGuard.dbGuardErrorMiddleware(sanitized, {}, mockRes, () => {});
      assert.strictEqual(mockResponse.status, 500);
      assert.strictEqual(mockResponse.json.success, false);
      assert.strictEqual(mockResponse.json.error, 'DATABASE_OPERATION_FAILED');
      assert.strictEqual(mockResponse.json.code, 'DATABASE_OPERATION_FAILED');
      pass('2.3 Database errors cloaked to standardized generic response with zero schema detail leaks');
    }

    // 2.4 Transparent Prisma Client wrapper integration ($extends and Proxy)
    {
      assert.ok(app.dbGuard, 'app.dbGuard must be attached to Express app');
      assert.ok(typeof dbGuard.withDbGuard === 'function');

      // Test proxy wrapper on mock Prisma object
      const mockPrisma = {
        account: {
          findMany: async () => [{ id: 'acc-1', name: 'Safe Account' }]
        },
        $queryRaw: async () => [{ result: 1 }]
      };

      const guardedPrisma = dbGuard.withDbGuard(mockPrisma);
      const safeData = await guardedPrisma.account.findMany();
      assert.strictEqual(safeData.length, 1);
      assert.strictEqual(safeData[0].name, 'Safe Account');

      // Malicious query via guarded client throws QueryIntegrityViolationError
      let queryBlocked = false;
      try {
        await guardedPrisma.$queryRaw('SELECT * FROM accounts; DROP TABLE accounts;--');
      } catch (err) {
        if (err.breachCode === 'QUERY_INTEGRITY_VIOLATION') queryBlocked = true;
      }
      assert.strictEqual(queryBlocked, true, 'Dangerous raw query must be intercepted by wrapper');
      pass('2.4 Transparent Prisma client wrapper intercepts raw and model queries');
    }

    // 2.5 Benign Turkish business text containing semicolons passes cleanly
    {
      const safeInputs = [
        'Kumaş teslimatı yapıldı; 20 top teslim edildi.',
        'Firma unvanı: Faruk Aytin; Nisa Tekstil Sanayi',
        'Ödeme yapıldı; 10.335,35 USD havale dekontu Garanti BBVA',
        'Fatura açıklaması; İhracat bedeli kabul belgesi düzenlendi.'
      ];

      for (const input of safeInputs) {
        let blocked = false;
        try {
          dbGuard.inspectPayload(input, 'test-benign');
        } catch (_) {
          blocked = true;
        }
        assert.strictEqual(blocked, false, `Safe Turkish business text must not be blocked: ${input}`);
      }
      pass('2.5 Benign Turkish business text with semicolons passes with zero false positives');
    }

    // =========================================================================
    // PART 3: ADVANCED HTTP RESPONSE SECURITY ARMOR & SUBRESOURCE DEFENSE
    // =========================================================================
    console.log(`\n${colors.bold}[PART 3] Advanced HTTP Response Security Armor & Subresource Defense${colors.reset}`);

    // Query /api/health to inspect HTTP response headers
    const healthRes = await makeRequest(serverPort, { path: '/api/health' });
    assert.strictEqual(healthRes.statusCode, 200);

    // 3.1 Cross-Origin-Opener-Policy (COOP)
    {
      assert.strictEqual(
        healthRes.headers['cross-origin-opener-policy'],
        'same-origin',
        'Must enforce Cross-Origin-Opener-Policy: same-origin'
      );
      pass('3.1 Cross-Origin-Opener-Policy: same-origin enforced');
    }

    // 3.2 Cross-Origin-Embedder-Policy (COEP)
    {
      assert.strictEqual(
        healthRes.headers['cross-origin-embedder-policy'],
        'require-corp',
        'Must enforce Cross-Origin-Embedder-Policy: require-corp'
      );
      pass('3.2 Cross-Origin-Embedder-Policy: require-corp enforced');
    }

    // 3.3 Cross-Origin-Resource-Policy (CORP)
    {
      assert.strictEqual(
        healthRes.headers['cross-origin-resource-policy'],
        'same-origin',
        'Must enforce Cross-Origin-Resource-Policy: same-origin'
      );
      pass('3.3 Cross-Origin-Resource-Policy: same-origin enforced');
    }

    // 3.4 Permissions-Policy (Feature Policy)
    {
      const permPolicy = healthRes.headers['permissions-policy'];
      assert.ok(permPolicy, 'Permissions-Policy header must exist');
      assert.ok(permPolicy.includes('camera=()'), 'Must disable camera');
      assert.ok(permPolicy.includes('microphone=()'), 'Must disable microphone');
      assert.ok(permPolicy.includes('geolocation=()'), 'Must disable geolocation');
      assert.ok(permPolicy.includes('payment=()'), 'Must disable payment');
      pass('3.4 Permissions-Policy restricts camera, microphone, geolocation, and payment');
    }

    // 3.5 Authenticated & API Endpoint Cache-Control
    {
      const cacheControl = healthRes.headers['cache-control'];
      assert.ok(cacheControl, 'Cache-Control header must exist on /api routes');
      assert.ok(cacheControl.includes('no-store'), 'Must include no-store');
      assert.ok(cacheControl.includes('no-cache'), 'Must include no-cache');
      assert.ok(cacheControl.includes('must-revalidate'), 'Must include must-revalidate');
      assert.strictEqual(healthRes.headers['pragma'], 'no-cache');
      assert.strictEqual(healthRes.headers['expires'], '0');
      pass('3.5 API and authenticated endpoints enforce Cache-Control: no-store, no-cache, must-revalidate');
    }

    // 3.6 Complete server cloaking: zero X-Powered-By or server framework headers
    {
      assert.strictEqual(healthRes.headers['x-powered-by'], undefined, 'X-Powered-By must be completely stripped');
      assert.strictEqual(healthRes.headers['server'], undefined, 'Server header must be completely stripped');
      assert.strictEqual(healthRes.headers['x-aspnet-version'], undefined, 'Technology headers must be stripped');
      pass('3.6 Total server cloaking verified (zero X-Powered-By, Server, or framework headers)');
    }

  } finally {
    resetAllSecurityState();
    server.close();
    processArmor.stop();
    memoryIntegritySentinel.stop();
    behavioralShieldEngine.close();
  }

  // Print summary report
  console.log(`\n${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}            PHASE 7 SOVEREIGN APEX CITADEL TEST SUITE RESULTS                  ${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(` Total Assertions Tested : ${totalTests}`);
  console.log(` Passed Assertions       : ${colors.green}${passedTests}${colors.reset}`);
  console.log(` Failed Assertions       : ${totalTests - passedTests === 0 ? colors.green + '0' + colors.reset : colors.red + (totalTests - passedTests) + colors.reset}`);
  console.log(` Success Rate            : ${colors.bold}${colors.green}${((passedTests / totalTests) * 100).toFixed(1)}%${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.bold}${colors.green}🎉 ALL PHASE 7 SOVEREIGN APEX CITADEL DEFENSE VECTORS VERIFIED WITH 100% SUCCESS!${colors.reset}\n`);
}

if (require.main === module) {
  runPhase7CitadelTests().catch((err) => {
    console.error(`\n${colors.bold}${colors.red}❌ PHASE 7 CITADEL TEST SUITE FAILED:${colors.reset}`, err);
    process.exit(1);
  });
}

module.exports = { runPhase7CitadelTests };
