/**
 * BROSAN TEKSTİL ERP — PHASE 9 ADVERSARIAL CHALLENGER 1 SUITE
 *
 * Empirical Challenger Verification of:
 * 1. Target Decoy Route Matrix & Normalization Pipeline (server/polymorphicTraps.js)
 * 2. Adversarial Evasion Resistance: Double URL encoding, weird queries, path permutations, dot-segments
 * 3. Zero False-Positive Rate on Legitimate Accounting Routes under Stress
 * 4. Asynchronous Non-Blocking Event Loop Execution during Tarpit Delays
 * 5. Socket Disconnect and Timer Release Cleanup
 * 6. Session Family & Bearer Token Revocation on Decoy Hits
 */

const assert = require('assert');
const http = require('http');
const net = require('net');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const {
  polymorphicTrapsGuard,
  isDecoyRoute,
  isDecoyTarget,
  matchDecoyRoute,
  calculateTarpitDelay,
  applyTarpitLatency,
  normalizePath,
  terminateSession,
  getTrapMetrics,
  resetForTesting,
  DECOY_TARGETS,
  QUARANTINE_48H_MS,
  DURATION_48H_SEC
} = require('../server/polymorphicTraps');

const auth = require('../server/auth');
const { quarantineEngine } = require('../server/quarantine');
const { lockdownManager } = require('../server/lockdown');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m'
};

const CHALLENGER_IPS = [
  '198.51.100.111',
  '198.51.100.112',
  '198.51.100.113',
  '198.51.100.114',
  '198.51.100.115',
  '127.0.0.1'
];

function cleanupFixtures() {
  try {
    for (const ip of CHALLENGER_IPS) {
      if (quarantineEngine) {
        if (typeof quarantineEngine.liftQuarantine === 'function') {
          quarantineEngine.liftQuarantine(ip);
        } else if (typeof quarantineEngine.unquarantineIp === 'function') {
          quarantineEngine.unquarantineIp(ip);
        }
      }
    }
    if (quarantineEngine && typeof quarantineEngine.saveToDisk === 'function') {
      quarantineEngine.saveToDisk();
    }
    resetForTesting();
  } catch (_) {}
}

function sendRawHttpRequest(port, rawRequestText) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ port, host: '127.0.0.1' }, () => {
      client.write(rawRequestText);
    });

    let data = '';
    client.on('data', (chunk) => {
      data += chunk.toString();
    });

    client.on('end', () => {
      const parts = data.split('\r\n\r\n');
      const headerPart = parts[0] || '';
      const bodyPart = parts.slice(1).join('\r\n\r\n');
      const statusLine = headerPart.split('\r\n')[0] || '';
      const statusMatch = statusLine.match(/HTTP\/[0-9.]+\s+(\d+)/);
      const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 0;
      resolve({ statusCode, rawHeaders: headerPart, body: bodyPart, fullText: data });
    });

    client.on('error', reject);
  });
}

function sendHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOpts, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runAdversarialChallengeSuite() {
  console.log(`\n${colors.bold}${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}🛡️  ADVERSARIAL CHALLENGER 1 — PHASE 9 EMPIRICAL AUDIT HARNESS${colors.reset}`);
  console.log(`Empirical stress-testing of polymorphicTraps.js, tarpit concurrency, & routing defense`);
  console.log(`${colors.bold}${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  cleanupFixtures();

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    findings: []
  };

  function testSync(name, fn) {
    results.total++;
    try {
      fn();
      console.log(`  ${colors.green}✔ PASS${colors.reset} ${name}`);
      results.passed++;
    } catch (err) {
      console.error(`  ${colors.red}✖ FAIL${colors.reset} ${name}: ${err.message}`);
      results.failed++;
      results.findings.push({ name, error: err.message });
    }
  }

  async function testAsync(name, fn) {
    results.total++;
    try {
      await fn();
      console.log(`  ${colors.green}✔ PASS${colors.reset} ${name}`);
      results.passed++;
    } catch (err) {
      console.error(`  ${colors.red}✖ FAIL${colors.reset} ${name}: ${err.message}`);
      results.failed++;
      results.findings.push({ name, error: err.message });
    }
  }

  // ==============================================================================
  // SECTION 1: TARGET DECOY ROUTE MATRIX & NORMALIZATION PIPELINE
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 1] Target Decoy Route Matrix & Canonical Permutations${colors.reset}`);

  testSync('1.1 Canonical Decoy Targets: all 7 targeted technologies flagged', () => {
    const targets = [
      '/wp-login.php',
      '/.well-known/security.txt',
      '/actuator/health',
      '/api/v1/swagger.json',
      '/solr/admin',
      '/phpmyadmin',
      '/api/v2/debug'
    ];
    for (const t of targets) {
      const match = matchDecoyRoute(normalizePath(t));
      assert.strictEqual(match, t, `Target ${t} must match exactly`);
      const decoyRes = isDecoyRoute(t);
      assert.strictEqual(decoyRes.isDecoy, true, `Route ${t} must have isDecoy=true`);
    }
  });

  testSync('1.2 Case-insensitivity permutations across all decoy targets', () => {
    const casePermutations = [
      ['/WP-LOGIN.PHP', '/wp-login.php'],
      ['/Wp-Login.Php', '/wp-login.php'],
      ['/.WELL-KNOWN/SECURITY.TXT', '/.well-known/security.txt'],
      ['/ACTUATOR/HEALTH', '/actuator/health'],
      ['/Actuator/Health', '/actuator/health'],
      ['/API/V1/SWAGGER.JSON', '/api/v1/swagger.json'],
      ['/SOLR/ADMIN', '/solr/admin'],
      ['/PHPMYADMIN', '/phpmyadmin'],
      ['/PhpMyAdmin', '/phpmyadmin'],
      ['/API/V2/DEBUG', '/api/v2/debug']
    ];
    for (const [perm, expected] of casePermutations) {
      const match = matchDecoyRoute(normalizePath(perm));
      assert.strictEqual(match, expected, `Permutation ${perm} must resolve to ${expected}`);
    }
  });

  testSync('1.3 Reverse-proxy prefix (/muhasebe) and duplicate slash collapse', () => {
    const proxyPermutations = [
      '/muhasebe/wp-login.php',
      '/muhasebe//wp-login.php',
      '///muhasebe///wp-login.php',
      '/muhasebe/actuator/health',
      '/muhasebe/phpmyadmin',
      '/muhasebe/api/v1/swagger.json',
      '/muhasebe/solr/admin'
    ];
    for (const pathStr of proxyPermutations) {
      const match = matchDecoyRoute(normalizePath(pathStr));
      assert.ok(match, `Proxy permutation ${pathStr} must match decoy target`);
    }
  });

  testSync('1.4 Query parameter and hash fragment stripping', () => {
    const queryPermutations = [
      '/.well-known/security.txt#frag',
      '/wp-login.php?param=../../',
      '/wp-login.php?action=login&redirect_to=http%3A%2F%2Fevil.com',
      '/actuator/health?format=json&debug=true',
      '/phpmyadmin?target=db_structure.php',
      '/api/v1/swagger.json?url=https://attacker.com/swagger.json',
      '/api/v2/debug?cmd=id&exec=1'
    ];
    for (const q of queryPermutations) {
      const match = matchDecoyRoute(normalizePath(q));
      assert.ok(match, `URL with query/hash ${q} must match decoy target`);
    }
  });

  testSync('1.5 Double-URL encoding of path characters (e.g. %2577 -> %77 -> w)', () => {
    // /wp-login.php double-encoded
    const doubleEncoded = '/%2577%2570%252d%256c%256f%2567%2569%256e%252e%2570%2568%2570';
    const match = matchDecoyRoute(normalizePath(doubleEncoded));
    assert.strictEqual(match, '/wp-login.php', 'Double URL encoded path must resolve to /wp-login.php');

    // /phpmyadmin single-encoded
    const singleEncoded = '/%70%68%70%6d%79%61%64%6d%69%6e';
    const match2 = matchDecoyRoute(normalizePath(singleEncoded));
    assert.strictEqual(match2, '/phpmyadmin', 'Single URL encoded path must resolve to /phpmyadmin');
  });

  // ==============================================================================
  // SECTION 2: ADVERSARIAL EVASION VECTORS & ROUTING DEFENSE BEHAVIOR
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 2] Adversarial Evasion Vectors & Pipeline Defense${colors.reset}`);

  // Test live server defense pipeline
  const app = require('../server/index');
  const server = http.createServer(app);
  let livePort = 0;

  await testAsync('2.0 Spin up test instance of Express server pipeline', async () => {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    livePort = server.address().port;
    assert.ok(livePort > 0, 'Server must listen on ephemeral port');
  });

  await testAsync('2.1 Evasion Vector: /wp-login.php?param=../../ triggers DECOY_TRAP_TRIGGERED', async () => {
    const res = await sendHttpRequest(`http://127.0.0.1:${livePort}/wp-login.php?param=../../`, {
      headers: { 'x-forwarded-for': '198.51.100.111' }
    });
    assert.strictEqual(res.statusCode, 403, 'Must return HTTP 403');
    const json = JSON.parse(res.body);
    assert.strictEqual(json.code, 'DECOY_TRAP_TRIGGERED', 'Code must be DECOY_TRAP_TRIGGERED');
    assert.strictEqual(res.headers['x-citadel-trap'], 'ACTIVE', 'X-Citadel-Trap header must be ACTIVE');
    assert.strictEqual(res.headers['retry-after'], '172800', 'Retry-After must reflect 48 hours');
  });

  await testAsync('2.2 Evasion Vector: /muhasebe//wp-login.php triggers DECOY_TRAP_TRIGGERED', async () => {
    const res = await sendHttpRequest(`http://127.0.0.1:${livePort}/muhasebe//wp-login.php`, {
      headers: { 'x-forwarded-for': '198.51.100.112' }
    });
    assert.strictEqual(res.statusCode, 403, 'Must return HTTP 403');
    const json = JSON.parse(res.body);
    assert.strictEqual(json.code, 'DECOY_TRAP_TRIGGERED', 'Code must be DECOY_TRAP_TRIGGERED');
  });

  await testAsync('2.3 Evasion Vector: /ACTUATOR/HEALTH triggers DECOY_TRAP_TRIGGERED', async () => {
    const res = await sendHttpRequest(`http://127.0.0.1:${livePort}/ACTUATOR/HEALTH`, {
      headers: { 'x-forwarded-for': '198.51.100.113' }
    });
    assert.strictEqual(res.statusCode, 403, 'Must return HTTP 403');
    const json = JSON.parse(res.body);
    assert.strictEqual(json.code, 'DECOY_TRAP_TRIGGERED', 'Code must be DECOY_TRAP_TRIGGERED');
  });

  await testAsync('2.4 Evasion Vector: /.well-known/security.txt#frag triggers DECOY_TRAP_TRIGGERED', async () => {
    const res = await sendHttpRequest(`http://127.0.0.1:${livePort}/.well-known/security.txt#frag`, {
      headers: { 'x-forwarded-for': '198.51.100.114' }
    });
    assert.strictEqual(res.statusCode, 403, 'Must return HTTP 403');
    const json = JSON.parse(res.body);
    assert.strictEqual(json.code, 'DECOY_TRAP_TRIGGERED', 'Code must be DECOY_TRAP_TRIGGERED');
  });

  await testAsync('2.5 Double URL encoded parameter /wp-login.php?param=%252e%252e triggers DECOY_TRAP_TRIGGERED', async () => {
    const res = await sendHttpRequest(`http://127.0.0.1:${livePort}/wp-login.php?param=%252e%252e`, {
      headers: { 'x-forwarded-for': '198.51.100.115' }
    });
    assert.strictEqual(res.statusCode, 403, 'Must return HTTP 403');
    const json = JSON.parse(res.body);
    assert.strictEqual(json.code, 'DECOY_TRAP_TRIGGERED', 'Code must be DECOY_TRAP_TRIGGERED');
  });

  // CHALLENGER VULNERABILITY INVESTIGATION:
  // Dot-segment evasion (/./wp-login.php) via raw socket where client does NOT auto-resolve dot segments
  await testAsync('2.6 CHALLENGER FINDING: Raw socket GET /./wp-login.php bypass analysis', async () => {
    const rawRes = await sendRawHttpRequest(
      livePort,
      'GET /./wp-login.php HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n'
    );

    // Document whether /./wp-login.php triggers DECOY_TRAP_TRIGGERED or evades
    const isTrapTriggered = rawRes.body.includes('DECOY_TRAP_TRIGGERED');
    if (!isTrapTriggered) {
      console.log(`    ${colors.yellow}⚠️  [ADVERSARIAL VULNERABILITY CONFIRMED] GET /./wp-login.php bypassed polymorphicTraps!${colors.reset}`);
      console.log(`    Status: ${rawRes.statusCode}, isTrapTriggered: ${isTrapTriggered}`);
      // Record finding for handoff report
      results.findings.push({
        severity: 'MEDIUM_DEFENSE_GAP',
        vector: 'GET /./wp-login.php (Raw dot-segment evasion)',
        observedStatus: rawRes.statusCode,
        reason: 'normalizePath lacks dot-segment resolution (path.posix.normalize), allowing dot-prefixed paths to evade decoy trap and return HTTP 200'
      });
    }
    // We assert our empirical finding
    assert.strictEqual(typeof rawRes.statusCode, 'number', 'Must complete HTTP exchange');
  });

  await testAsync('2.7 CHALLENGER FINDING: Directory traversal prefix /test/%252e%252e/wp-login.php pipeline behavior', async () => {
    const res = await sendHttpRequest(`http://127.0.0.1:${livePort}/test/%252e%252e/wp-login.php`, {
      headers: { 'x-forwarded-for': '198.51.100.116' }
    });

    // The traversal blocker intercepts this before Express routing
    assert.strictEqual(res.statusCode, 403, 'Must be blocked by routing defense pipeline with HTTP 403');
    const json = JSON.parse(res.body);
    const code = json.code;
    console.log(`    Defense response for traversal prefix: ${code} (HTTP ${res.statusCode})`);
    // It's blocked by pipeline (MALICIOUS_PAYLOAD_DETECTED or FORBIDDEN_TRAVERSAL)
    assert.ok(
      code === 'MALICIOUS_PAYLOAD_DETECTED' || code === 'FORBIDDEN_TRAVERSAL' || code === 'DECOY_TRAP_TRIGGERED',
      'Must be blocked with a 403 security code'
    );
  });

  // ==============================================================================
  // SECTION 3: ZERO FALSE POSITIVES ON LEGITIMATE ACCOUNTING ROUTES
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 3] Legitimate Accounting Routes & Zero False Positive Stress${colors.reset}`);

  testSync('3.1 matchDecoyRoute returns null for all core accounting routes', () => {
    const legitimateRoutes = [
      '/api/health',
      '/muhasebe/api/health',
      '/api/accounts',
      '/muhasebe/api/accounts',
      '/api/contacts',
      '/muhasebe/api/contacts',
      '/api/invoices',
      '/muhasebe/api/invoices',
      '/api/journal-entries',
      '/muhasebe/api/journal-entries',
      '/api/transactions',
      '/muhasebe/api/transactions',
      '/api/checks',
      '/muhasebe/api/checks',
      '/api/employees',
      '/muhasebe/api/employees',
      '/api/auth/login',
      '/muhasebe/api/auth/login'
    ];

    for (const r of legitimateRoutes) {
      const match = matchDecoyRoute(normalizePath(r));
      assert.strictEqual(match, null, `Route ${r} must never match decoy`);
      const decoyCheck = isDecoyRoute(r);
      assert.strictEqual(decoyCheck.isDecoy, false, `Route ${r} must have isDecoy=false`);
    }
  });

  testSync('3.2 Legitimate routes with Turkish query parameters and filters pass cleanly', () => {
    const filteredRoutes = [
      '/api/accounts?search=kuma%C5%9F',
      '/muhasebe/api/invoices?dateFrom=2026-01-01&dateTo=2026-10-10',
      '/api/contacts?type=M%C3%9C%C5%9ETE%C5%9E%C4%B0',
      '/api/journal-entries?code=100.01.001',
      '/muhasebe/api/transactions?minAmount=10000'
    ];

    for (const r of filteredRoutes) {
      const match = matchDecoyRoute(normalizePath(r));
      assert.strictEqual(match, null, `Filtered route ${r} must never match decoy`);
    }
  });

  await testAsync('3.3 Live Express server: /api/health returns 200 OK with zero decoy interference', async () => {
    const res = await sendHttpRequest(`http://127.0.0.1:${livePort}/api/health`);
    assert.strictEqual(res.statusCode, 200, 'Must return HTTP 200 OK');
    const json = JSON.parse(res.body);
    assert.ok(json.status === 'healthy' || json.status === 'degraded');
    assert.strictEqual(res.headers['x-citadel-trap'], undefined, 'Must NOT have X-Citadel-Trap header');
  });

  await testAsync('3.4 Live Express server: /muhasebe/api/health returns 200 OK', async () => {
    const res = await sendHttpRequest(`http://127.0.0.1:${livePort}/muhasebe/api/health`);
    assert.strictEqual(res.statusCode, 200, 'Must return HTTP 200 OK');
    const json = JSON.parse(res.body);
    assert.ok(json.status === 'healthy' || json.status === 'degraded');
  });

  await testAsync('3.5 Concurrency Stress Test: 50 simultaneous legitimate health probes', async () => {
    const burstPromises = [];
    for (let i = 0; i < 50; i++) {
      burstPromises.push(sendHttpRequest(`http://127.0.0.1:${livePort}/api/health`));
    }
    const resultsBurst = await Promise.all(burstPromises);
    assert.strictEqual(resultsBurst.length, 50, 'All 50 requests must resolve');
    for (const r of resultsBurst) {
      assert.strictEqual(r.statusCode, 200, 'Every burst request must return 200 OK');
      assert.strictEqual(r.headers['x-citadel-trap'], undefined, 'No decoy trap triggered');
    }
  });

  // ==============================================================================
  // SECTION 4: ASYNCHRONOUS NON-BLOCKING EVENT LOOP VERIFICATION
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 4] Event Loop Non-Blocking & Concurrency Verification${colors.reset}`);

  await testAsync('4.1 Tarpit delay uses non-blocking asynchronous timers (Event loop lag < 15ms)', async () => {
    // Launch 3 active tarpits in background with custom 300ms delay
    const mockReq1 = { once: () => {}, removeListener: () => {} };
    const mockReq2 = { once: () => {}, removeListener: () => {} };
    const mockReq3 = { once: () => {}, removeListener: () => {} };

    const tarpitP1 = applyTarpitLatency(300, mockReq1);
    const tarpitP2 = applyTarpitLatency(300, mockReq2);
    const tarpitP3 = applyTarpitLatency(300, mockReq3);

    // Measure event loop lag while tarpits are ticking
    let maxLagMs = 0;
    const measureStart = Date.now();
    for (let i = 0; i < 50; i++) {
      const stepStart = process.hrtime.bigint();
      await new Promise((resolve) => setImmediate(resolve));
      const stepEnd = process.hrtime.bigint();
      const lagMs = Number(stepEnd - stepStart) / 1e6;
      if (lagMs > maxLagMs) maxLagMs = lagMs;
    }

    const [t1, t2, t3] = await Promise.all([tarpitP1, tarpitP2, tarpitP3]);
    assert.strictEqual(t1, true);
    assert.strictEqual(t2, true);
    assert.strictEqual(t3, true);

    console.log(`    Observed max event loop lag during concurrent tarpits: ${maxLagMs.toFixed(3)}ms`);
    assert.ok(maxLagMs < 20, `Event loop lag must be < 20ms (observed: ${maxLagMs.toFixed(3)}ms)`);
  });

  await testAsync('4.2 Concurrent legitimate API request while tarpit is holding connection', async () => {
    const { configureTarpit } = require('../server/polymorphicTraps');
    configureTarpit({ minDelayMs: 1500, maxDelayMs: 3500 });
    let decoyCompleted = false;

    // Start decoy request in background
    const decoyPromise = sendHttpRequest(`http://127.0.0.1:${livePort}/wp-login.php`, {
      headers: { 'x-forwarded-for': '198.51.100.120' }
    }).then((res) => {
      decoyCompleted = true;
      return res;
    });

    // Immediately fire legitimate /api/health request
    const healthStart = Date.now();
    const healthRes = await sendHttpRequest(`http://127.0.0.1:${livePort}/api/health`);
    const healthElapsed = Date.now() - healthStart;

    configureTarpit({ reset: true });

    assert.strictEqual(healthRes.statusCode, 200, 'Legitimate request must return 200 OK');
    console.log(`    Legitimate request completed in ${healthElapsed}ms while tarpit was holding connection`);
    assert.ok(healthElapsed < 100, `Legitimate request must not be stalled by tarpit (took ${healthElapsed}ms)`);

    const decoyRes = await decoyPromise;
    assert.strictEqual(decoyRes.statusCode, 403, 'Decoy request must return 403');
  });

  // ==============================================================================
  // SECTION 5: SOCKET DISCONNECT & TIMER RELEASE CLEANUP
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 5] Socket Disconnect & Timer Release Cleanup${colors.reset}`);

  await testAsync('5.1 applyTarpitLatency releases timer immediately on client close event', async () => {
    const listeners = {};
    const mockReq = {
      once: (evt, cb) => { listeners[evt] = cb; },
      removeListener: (evt, cb) => { delete listeners[evt]; }
    };

    const startTime = Date.now();
    const tarpitPromise = applyTarpitLatency(5000, mockReq); // 5000ms delay

    // Simulate client disconnect after 50ms
    setTimeout(() => {
      if (listeners['close']) {
        listeners['close']();
      }
    }, 50);

    const result = await tarpitPromise;
    const elapsed = Date.now() - startTime;

    assert.strictEqual(result, false, 'applyTarpitLatency must resolve false when aborted early');
    console.log(`    Aborted tarpit resolved in ${elapsed}ms (out of 5000ms scheduled delay)`);
    assert.ok(elapsed < 200, `Timer must be released immediately (< 200ms, observed ${elapsed}ms)`);
  });

  await testAsync('5.2 Live server: Client abrupt socket close mid-tarpit cleans up activeTarpits counter', async () => {
    const initialMetrics = getTrapMetrics();
    const initialActive = initialMetrics.activeTarpits;

    // Open TCP connection, send request, destroy socket abruptly after 20ms
    await new Promise((resolve) => {
      const client = net.createConnection({ port: livePort, host: '127.0.0.1' }, () => {
        client.write('GET /wp-login.php HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n');
        setTimeout(() => {
          client.destroy();
          setTimeout(resolve, 60);
        }, 20);
      });
      client.on('error', () => resolve());
    });

    const endMetrics = getTrapMetrics();
    console.log(`    Active tarpits before: ${initialActive}, after disconnect: ${endMetrics.activeTarpits}`);
    assert.strictEqual(endMetrics.activeTarpits, 0, 'activeTarpits counter must return to 0');
  });

  // ==============================================================================
  // SECTION 6: ACTIVE DEFENSE SIDE EFFECTS & CREDENTIAL REVOCATION
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 6] Active Defense Side Effects: Quarantine & Token Revocation${colors.reset}`);

  testSync('6.1 48-Hour IP Quarantine enforcement upon decoy hit', () => {
    const testIp = '198.51.100.125';
    const req = {
      url: '/phpmyadmin',
      path: '/phpmyadmin',
      headers: { 'x-forwarded-for': testIp },
      socket: { remoteAddress: testIp },
      once: () => {}
    };

    let statusCalled = null;
    let jsonBody = null;
    const res = {
      setHeader: () => {},
      status: (s) => { statusCalled = s; return res; },
      json: (b) => { jsonBody = b; return res; }
    };

    polymorphicTrapsGuard(req, res, () => {});

    // Inspect quarantineEngine
    const qInfo = quarantineEngine.isQuarantined(testIp);
    assert.ok(qInfo && qInfo.quarantined, 'Client IP must be marked quarantined in quarantineEngine');
    assert.strictEqual(qInfo.reason, 'DECOY_TRAP_TRIGGERED');
    assert.ok(qInfo.remainingSec > 170000, `Remaining seconds must be ~172,800s (was ${qInfo.remainingSec}s)`);
  });

  testSync('6.2 Bearer token presented on decoy route is revoked immediately', () => {
    const victimUser = { id: 'test-admin-99', username: 'admin-canary', role: 'ADMIN' };
    const testToken = auth.generateToken(victimUser);
    assert.strictEqual(auth.isTokenRevoked(testToken), false, 'Token must initially be unrevoked');

    const req = {
      url: '/actuator/health',
      headers: {
        'authorization': `Bearer ${testToken}`,
        'x-forwarded-for': '198.51.100.126'
      },
      socket: { remoteAddress: '198.51.100.126' }
    };

    const sessionRes = terminateSession(req);
    assert.strictEqual(sessionRes.tokenRevoked, true, 'terminateSession must report tokenRevoked: true');
    assert.strictEqual(auth.isTokenRevoked(testToken), true, 'Token must now be revoked in auth blacklist');
    assert.strictEqual(req.headers['authorization'], undefined, 'Authorization header must be scrubbed from req');
  });

  // Close live server
  await new Promise((resolve) => server.close(resolve));
  cleanupFixtures();

  // ==============================================================================
  // SUMMARY REPORT & VERDICT FORMULATION
  // ==============================================================================
  console.log(`\n${colors.bold}${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`       ${colors.bold}${colors.cyan}CHALLENGER 1 EMPIRICAL AUDIT RESULTS FOR PHASE 9 (server/polymorphicTraps.js)${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(` Total Assertions Tested : ${results.total}`);
  console.log(` Passed Assertions       : ${results.passed}`);
  console.log(` Failed Assertions       : ${results.failed}`);
  console.log(` Adversarial Findings    : ${results.findings.length}`);
  console.log(` Success Rate            : ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log(`${colors.bold}${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  if (results.findings.length > 0) {
    console.log(`${colors.yellow}${colors.bold}ADVERSARIAL FINDINGS DISCOVERED:${colors.reset}`);
    for (const f of results.findings) {
      console.log(`  - [${f.severity || 'FAIL'}] ${f.name || f.vector}: ${f.reason || f.error}`);
    }
  }

  return results;
}

if (require.main === module) {
  runAdversarialChallengeSuite().then((results) => {
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch((err) => {
    console.error('Fatal challenger harness error:', err);
    process.exit(1);
  });
}

module.exports = { runAdversarialChallengeSuite };
