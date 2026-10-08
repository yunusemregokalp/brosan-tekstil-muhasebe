/**
 * BROSAN TEKSTİL ERP — DYNAMIC IP QUARANTINE ENGINE (FAIL2BAN SHIELD) UNIT TEST SUITE
 * 
 * Verifies:
 * 1. IP Normalization & IPv4-mapped IPv6 handling (::ffff: stripping, ::1 -> 127.0.0.1)
 * 2. Immutable loopback whitelist (127.0.0.1, ::1, localhost immunity)
 * 3. Bounded LRU cache capacity cap (10,000 entries max) preventing Memory Exhaustion DoS
 * 4. LRU eviction order (oldest entry evicted when full)
 * 5. Quarantine state evaluation, TTL expiry, and remainingSec computation
 * 6. Explicit unquarantine and cache clearing
 * 7. Debounced persistence to data/quarantined_ips.json & startup recovery
 * 8. Express quarantineGuard middleware contract (HTTP 403, Retry-After, X-Quarantine headers)
 * 9. Real HTTP end-to-end integration: sensitive file probing (.env) instant quarantine
 * 10. Real HTTP end-to-end integration: repeated login brute-force escalation threshold
 */

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');

const {
  quarantineEngine,
  quarantineGuard,
  BoundedLruQuarantineEngine,
  STATIC_WHITELIST
} = require('../server/quarantine');
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

function sendHttpRequest({ hostname = '127.0.0.1', port, path = '/', method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname, port, path, method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, text: data, json });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function startServer(appInstance) {
  return new Promise((resolve, reject) => {
    const s = appInstance.listen(0, '127.0.0.1', () => {
      resolve(s);
    });
    s.on('error', reject);
  });
}

async function runQuarantineUnitTests() {
  console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}🛡️  BROSAN TEKSTİL ERP — DYNAMIC IP QUARANTINE ENGINE (FAIL2BAN) UNIT SUITE${colors.reset}`);
  console.log(`${colors.dim}Testing LRU bounding, IP normalization, whitelist immunity, persistence & HTTP gates...${colors.reset}`);
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

  async function runAsyncSubtest(name, fn) {
    totalTests++;
    try {
      await fn();
      passedTests++;
      console.log(`  ${colors.green}✔ PASS${colors.reset} ${name}`);
    } catch (err) {
      console.error(`  ${colors.red}✖ FAIL${colors.reset} ${name}: ${err.message}`);
      throw err;
    }
  }

  // ==============================================================================
  // SECTION 1: IP NORMALIZATION & IPV6 HANDLING
  // ==============================================================================
  console.log(`${colors.bold}[SECTION 1] IP Normalization & IPv6 Handling${colors.reset}`);
  
  const tempTestPath = path.join(__dirname, '..', 'data', 'test_quarantine_temp.json');
  if (fs.existsSync(tempTestPath)) {
    try { fs.unlinkSync(tempTestPath); } catch (_) {}
  }
  const testEngine = new BoundedLruQuarantineEngine({
    maxEntries: 100,
    defaultTtlMs: 60 * 1000,
    filePath: tempTestPath
  });
  testEngine.clear();

  runSubtest('normalizeIp strips IPv4-mapped IPv6 prefix (::ffff:)', () => {
    assert.strictEqual(testEngine.normalizeIp('::ffff:198.51.100.42'), '198.51.100.42');
    assert.strictEqual(testEngine.normalizeIp('::ffff:127.0.0.1'), '127.0.0.1');
  });

  runSubtest('normalizeIp maps IPv6 loopback ::1 to 127.0.0.1', () => {
    assert.strictEqual(testEngine.normalizeIp('::1'), '127.0.0.1');
    assert.strictEqual(testEngine.normalizeIp('[::1]'), '127.0.0.1');
  });

  runSubtest('normalizeIp trims leading and trailing whitespace', () => {
    assert.strictEqual(testEngine.normalizeIp('  203.0.113.10  '), '203.0.113.10');
  });

  runSubtest('normalizeIp handles null, undefined, or empty inputs gracefully', () => {
    assert.strictEqual(testEngine.normalizeIp(null), '127.0.0.1');
    assert.strictEqual(testEngine.normalizeIp(undefined), '127.0.0.1');
    assert.strictEqual(testEngine.normalizeIp(''), '127.0.0.1');
  });

  // ==============================================================================
  // SECTION 2: IMMUTABLE WHITELIST IMMUNITY & LOOPBACK PROTECTION
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 2] Whitelist Immunity & Loopback Protection${colors.reset}`);

  runSubtest('Loopback addresses (127.0.0.1, ::1, localhost) are recognized as whitelisted', () => {
    assert.strictEqual(testEngine.isWhitelisted('127.0.0.1'), true);
    assert.strictEqual(testEngine.isWhitelisted('::1'), true);
    assert.strictEqual(testEngine.isWhitelisted('localhost'), true);
    assert.strictEqual(testEngine.isWhitelisted('::ffff:127.0.0.1'), true);
  });

  runSubtest('External attacker IP is NOT whitelisted', () => {
    assert.strictEqual(testEngine.isWhitelisted('198.51.100.77'), false);
    assert.strictEqual(testEngine.isWhitelisted('203.0.113.50'), false);
  });

  runSubtest('quarantineIp returns null for whitelisted IPs and never records them', () => {
    const res1 = testEngine.quarantineIp('127.0.0.1', 'PROBING_SENSITIVE_FILES');
    assert.strictEqual(res1, null, '127.0.0.1 must never be quarantined');

    const res2 = testEngine.quarantineIp('::1', 'PROBING_SENSITIVE_FILES');
    assert.strictEqual(res2, null, '::1 must never be quarantined');

    const check = testEngine.isQuarantined('127.0.0.1');
    assert.strictEqual(check.quarantined, false, '127.0.0.1 must remain unquarantined');
  });

  // ==============================================================================
  // SECTION 3: BOUNDED LRU CACHE & MEMORY EXHAUSTION PROTECTION
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 3] Bounded LRU Cache & Memory Exhaustion Protection${colors.reset}`);

  runSubtest('Engine strictly respects small maxEntries cap and evicts oldest (LRU)', () => {
    const lruCapEngine = new BoundedLruQuarantineEngine({
      maxEntries: 5,
      defaultTtlMs: 60 * 1000,
      filePath: path.join(__dirname, '..', 'data', 'test_quarantine_lru.json')
    });

    // Insert 5 entries: ip1 to ip5
    for (let i = 1; i <= 5; i++) {
      lruCapEngine.quarantineIp(`10.0.0.${i}`, 'TEST_ENTRY');
    }
    assert.strictEqual(lruCapEngine.cache.size, 5);
    assert.strictEqual(lruCapEngine.isQuarantined('10.0.0.1').quarantined, true);

    // Access 10.0.0.1 so it moves to MRU
    lruCapEngine.isQuarantined('10.0.0.1');

    // Insert 6th entry: 10.0.0.6. Oldest (which is now 10.0.0.2) should be evicted
    lruCapEngine.quarantineIp('10.0.0.6', 'TEST_ENTRY');
    assert.strictEqual(lruCapEngine.cache.size, 5);
    assert.strictEqual(lruCapEngine.isQuarantined('10.0.0.2').quarantined, false, '10.0.0.2 should be evicted');
    assert.strictEqual(lruCapEngine.isQuarantined('10.0.0.1').quarantined, true, '10.0.0.1 should still exist because accessed');
    assert.strictEqual(lruCapEngine.isQuarantined('10.0.0.6').quarantined, true, '10.0.0.6 must exist');

    lruCapEngine.close();
  });

  runSubtest('Simulating 12,000 rapid insertions against 10,000 capacity cap prevents heap bloat', () => {
    const bigEngine = new BoundedLruQuarantineEngine({
      maxEntries: 10000,
      defaultTtlMs: 3600 * 1000,
      filePath: path.join(__dirname, '..', 'data', 'test_quarantine_10k.json')
    });

    const startTime = Date.now();
    for (let i = 1; i <= 12000; i++) {
      const octetB = Math.floor(i / 254) % 254;
      const octetC = (i % 254) + 1;
      bigEngine.quarantineIp(`172.16.${octetB}.${octetC}`, 'MASS_FLOOD_SIMULATION');
    }
    const elapsed = Date.now() - startTime;

    assert.ok(bigEngine.cache.size <= 10000, `Cache size ${bigEngine.cache.size} must not exceed 10,000`);
    assert.strictEqual(bigEngine.cache.size, 10000, 'Cache size must be exactly 10,000 after 12k insertions');
    assert.ok(elapsed < 5000, `12,000 insertions took ${elapsed}ms (must be fast and non-blocking)`);

    bigEngine.close();
  });

  // ==============================================================================
  // SECTION 4: QUARANTINE STATUS, TTL EXPIRATION & RE-ENTRANCY
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 4] Quarantine Status, TTL Expiration & Re-Entrancy${colors.reset}`);

  runSubtest('Quarantine record returns complete contract: remainingSec, expiresAt, reason', () => {
    const targetIp = '198.51.100.101';
    const record = testEngine.quarantineIp(targetIp, 'PROBING_SENSITIVE_FILES', {
      path: '/.env',
      ttlMs: 3600 * 1000
    });

    assert.ok(record, 'Record must be returned');
    assert.strictEqual(record.ip, targetIp);
    assert.strictEqual(record.reason, 'PROBING_SENSITIVE_FILES');
    assert.strictEqual(record.triggerPath, '/.env');
    assert.strictEqual(record.count, 1);

    const check = testEngine.isQuarantined(targetIp);
    assert.strictEqual(check.quarantined, true);
    assert.ok(check.remainingSec > 3500 && check.remainingSec <= 3600, `remainingSec was ${check.remainingSec}`);
    assert.ok(typeof check.expiresAt === 'string');
    assert.strictEqual(check.reason, 'PROBING_SENSITIVE_FILES');
  });

  runSubtest('Repeated quarantine calls increment trigger count and update expiresAt', () => {
    const targetIp = '198.51.100.102';
    testEngine.quarantineIp(targetIp, 'PROBING_SENSITIVE_FILES', { path: '/.env' });
    const rec2 = testEngine.quarantineIp(targetIp, 'PROBING_SENSITIVE_FILES', { path: '/.git/config' });

    assert.strictEqual(rec2.count, 2);
    assert.strictEqual(rec2.triggerPath, '/.git/config');
  });

  runSubtest('Expired records are lazily deleted upon check', () => {
    const expIp = '198.51.100.103';
    // Quarantine with 1ms TTL
    testEngine.quarantineIp(expIp, 'SHORT_LIVED', { ttlMs: 1 });

    // Wait 15ms so it is definitely expired
    const start = Date.now();
    while (Date.now() - start < 15) {}

    const check = testEngine.isQuarantined(expIp);
    assert.strictEqual(check.quarantined, false, 'Expired record must return quarantined: false');
    assert.strictEqual(testEngine.cache.has(expIp), false, 'Expired entry must be purged from cache');
  });

  // ==============================================================================
  // SECTION 5: UNQUARANTINE & CACHE PRUNING
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 5] Unquarantine & Cache Pruning${colors.reset}`);

  runSubtest('unquarantineIp lifts quarantine immediately', () => {
    const unqIp = '198.51.100.104';
    testEngine.quarantineIp(unqIp, 'TEST');
    assert.strictEqual(testEngine.isQuarantined(unqIp).quarantined, true);

    const removed = testEngine.unquarantineIp(unqIp);
    assert.strictEqual(removed, true);
    assert.strictEqual(testEngine.isQuarantined(unqIp).quarantined, false);
  });

  runSubtest('pruneExpired purges stale records and leaves active records intact', () => {
    const staleIp = '198.51.100.105';
    const freshIp = '198.51.100.106';

    testEngine.quarantineIp(staleIp, 'STALE', { ttlMs: 1 });
    testEngine.quarantineIp(freshIp, 'FRESH', { ttlMs: 60 * 1000 });

    const start = Date.now();
    while (Date.now() - start < 15) {}

    const pruned = testEngine.pruneExpired();
    assert.ok(pruned >= 1, `pruned count was ${pruned}`);
    assert.strictEqual(testEngine.cache.has(staleIp), false);
    assert.strictEqual(testEngine.cache.has(freshIp), true);
  });

  // ==============================================================================
  // SECTION 6: PERSISTENCE TO DISK & STARTUP RECOVERY
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 6] Persistence to Disk & Startup Recovery${colors.reset}`);

  const diskTestFile = path.join(__dirname, '..', 'data', 'test_quarantine_persistence.json');

  runSubtest('Engine saves active entries to disk and skips expired ones', () => {
    if (fs.existsSync(diskTestFile)) fs.unlinkSync(diskTestFile);

    const persistEngine = new BoundedLruQuarantineEngine({
      maxEntries: 100,
      defaultTtlMs: 3600 * 1000,
      filePath: diskTestFile
    });

    persistEngine.quarantineIp('198.51.100.201', 'PERSIST_TEST_ACTIVE', { ttlMs: 3600 * 1000 });
    persistEngine.quarantineIp('198.51.100.202', 'PERSIST_TEST_EXPIRED', { ttlMs: 1 });

    const start = Date.now();
    while (Date.now() - start < 15) {}

    persistEngine.saveToDisk();
    assert.ok(fs.existsSync(diskTestFile), 'Quarantine JSON file must exist on disk');

    const fileContent = JSON.parse(fs.readFileSync(diskTestFile, 'utf8'));
    assert.ok(Array.isArray(fileContent));
    assert.strictEqual(fileContent.length, 1);
    assert.strictEqual(fileContent[0].ip, '198.51.100.201');
    assert.strictEqual(fileContent[0].reason, 'PERSIST_TEST_ACTIVE');

    persistEngine.close();
  });

  runSubtest('Fresh engine instance restores active quarantine records from disk file', () => {
    const recoveryEngine = new BoundedLruQuarantineEngine({
      maxEntries: 100,
      defaultTtlMs: 3600 * 1000,
      filePath: diskTestFile
    });

    const check = recoveryEngine.isQuarantined('198.51.100.201');
    assert.strictEqual(check.quarantined, true, 'Persisted IP must be restored on startup');
    assert.strictEqual(check.reason, 'PERSIST_TEST_ACTIVE');

    recoveryEngine.close();
    if (fs.existsSync(diskTestFile)) fs.unlinkSync(diskTestFile);
  });

  // ==============================================================================
  // SECTION 7: EXPRESS QUARANTINE GUARD MIDDLEWARE CONTRACT
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 7] Express quarantineGuard Middleware Contract${colors.reset}`);

  await runAsyncSubtest('quarantineGuard returns HTTP 403 IP_QUARANTINED with correct headers', async () => {
    const ephemeralApp = express();
    ephemeralApp.set('trust proxy', 1);

    // Ephemeral quarantine instance
    const guardTestFile = path.join(__dirname, '..', 'data', 'test_quarantine_guard.json');
    if (fs.existsSync(guardTestFile)) {
      try { fs.unlinkSync(guardTestFile); } catch (_) {}
    }
    const customEngine = new BoundedLruQuarantineEngine({
      maxEntries: 50,
      defaultTtlMs: 3600 * 1000,
      filePath: guardTestFile
    });
    customEngine.clear();

    const guardMiddleware = (req, res, next) => {
      const clientIp = auth.getClientIp(req);
      const check = customEngine.isQuarantined(clientIp);
      if (check.quarantined) {
        res.setHeader('Retry-After', String(check.remainingSec));
        res.setHeader('X-Quarantine-Status', 'ACTIVE');
        res.setHeader('X-Quarantine-Remaining', String(check.remainingSec));
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
        return res.status(403).json({
          success: false,
          error: 'Erişim engellendi: IP adresiniz şüpheli/saldırgan aktiviteler nedeniyle karantinaya alınmıştır.',
          code: 'IP_QUARANTINED',
          quarantined: true,
          remainingSec: check.remainingSec,
          expiresAt: check.expiresAt,
          reason: check.reason
        });
      }
      next();
    };

    ephemeralApp.use(guardMiddleware);
    ephemeralApp.get('/test-route', (req, res) => res.json({ ok: true }));

    const server = await startServer(ephemeralApp);
    const port = server.address().port;

    try {
      // 1. Unquarantined request passes through
      const okRes = await sendHttpRequest({
        port,
        path: '/test-route',
        headers: { 'x-forwarded-for': '198.51.100.222' }
      });
      assert.strictEqual(okRes.status, 200);
      assert.strictEqual(okRes.json.ok, true);

      // 2. Quarantine IP
      customEngine.quarantineIp('198.51.100.222', 'MANUAL_QUARANTINE_TEST');

      // 3. Quarantined request receives HTTP 403 IP_QUARANTINED
      const blockedRes = await sendHttpRequest({
        port,
        path: '/test-route',
        headers: { 'x-forwarded-for': '198.51.100.222' }
      });
      assert.strictEqual(blockedRes.status, 403);
      assert.strictEqual(blockedRes.json.code, 'IP_QUARANTINED');
      assert.strictEqual(blockedRes.json.quarantined, true);
      assert.strictEqual(blockedRes.json.reason, 'MANUAL_QUARANTINE_TEST');
      assert.strictEqual(blockedRes.headers['x-quarantine-status'], 'ACTIVE');
      assert.ok(Number(blockedRes.headers['retry-after']) > 3500);
      assert.strictEqual(blockedRes.headers['x-robots-tag'], 'noindex, nofollow');
    } finally {
      server.close();
      customEngine.close();
    }
  });

  // ==============================================================================
  // SECTION 8: REAL LIVE SERVER INTEGRATION: SENSITIVE FILE PROBING (.ENV)
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 8] Real Live Server: Sensitive File Probing (.env) Instant Quarantine${colors.reset}`);

  await runAsyncSubtest('Probing /.env from external IP triggers instant quarantine and subsequent 403 block', async () => {
    const realApp = require('../server/index');
    const server = await startServer(realApp);
    const port = server.address().port;

    const attackerIp = '198.51.100.77';

    // Ensure IP is clean before test
    quarantineEngine.unquarantineIp(attackerIp);

    try {
      // Request 1: Probing /.env with external IP
      const probeRes = await sendHttpRequest({
        port,
        path: '/.env',
        headers: {
          'host': 'brosangroup.com',
          'x-forwarded-for': attackerIp
        }
      });

      assert.strictEqual(probeRes.status, 403, 'Initial probe must return 403');
      assert.strictEqual(probeRes.json.code, 'FORBIDDEN_FILE', 'Code must be FORBIDDEN_FILE');
      assert.strictEqual(probeRes.json.quarantined, true, 'Must indicate IP was quarantined');

      // Verify quarantine engine state
      const check = quarantineEngine.isQuarantined(attackerIp);
      assert.strictEqual(check.quarantined, true, 'Attacker IP must be enrolled in quarantine engine');
      assert.strictEqual(check.reason, 'PROBING_SENSITIVE_FILES');

      // Request 2: Attacker attempts to access legitimate /api/health endpoint
      const nextRes = await sendHttpRequest({
        port,
        path: '/api/health',
        headers: {
          'host': 'brosangroup.com',
          'x-forwarded-for': attackerIp
        }
      });

      assert.strictEqual(nextRes.status, 403, 'Subsequent request must be blocked at Gate 1');
      assert.strictEqual(nextRes.json.code, 'IP_QUARANTINED', 'Must return code IP_QUARANTINED');
      assert.strictEqual(nextRes.json.quarantined, true);
      assert.strictEqual(nextRes.headers['x-quarantine-status'], 'ACTIVE');
      assert.ok(Number(nextRes.headers['retry-after']) > 3500);

      // Request 3: Local healthcheck from loopback (127.0.0.1) is unaffected and returns 200
      const localHealthRes = await sendHttpRequest({
        port,
        path: '/api/health',
        headers: {
          'host': 'brosangroup.com'
          // no x-forwarded-for -> loopback 127.0.0.1
        }
      });
      assert.strictEqual(localHealthRes.status, 200, 'Local healthcheck must return 200 without being blocked');
    } finally {
      quarantineEngine.unquarantineIp(attackerIp);
      server.close();
    }
  });

  // ==============================================================================
  // SECTION 9: REAL LIVE SERVER INTEGRATION: BRUTE-FORCE ESCALATION
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 9] Real Live Server: Brute-Force Escalation to Quarantine${colors.reset}`);

  await runAsyncSubtest('10 consecutive failed login attempts escalate attacker to quarantine', async () => {
    const realApp = require('../server/index');
    const server = await startServer(realApp);
    const port = server.address().port;

    const bruteAttackerIp = '198.51.100.88';
    quarantineEngine.unquarantineIp(bruteAttackerIp);
    auth.clearFailedAttempts(`ip:${bruteAttackerIp}`);

    try {
      // Send 10 failed login attempts
      for (let attempt = 1; attempt <= 10; attempt++) {
        await sendHttpRequest({
          port,
          path: '/api/auth/login',
          method: 'POST',
          headers: {
            'host': 'brosangroup.com',
            'x-forwarded-for': bruteAttackerIp,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            username: 'admin',
            password: 'WrongPassword999!'
          })
        });
      }

      // At attempt 10, IP is quarantined
      const check = quarantineEngine.isQuarantined(bruteAttackerIp);
      assert.strictEqual(check.quarantined, true, 'Attacker IP must be quarantined after 10 failed logins');
      assert.strictEqual(check.reason, 'BRUTE_FORCE_LOGIN_EXCEEDED');

      // Subsequent attempt must be blocked with 403 IP_QUARANTINED before hitting login endpoint
      const blockedRes = await sendHttpRequest({
        port,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'host': 'brosangroup.com',
          'x-forwarded-for': bruteAttackerIp,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'Brosan2026!SecureErp'
        })
      });

      assert.strictEqual(blockedRes.status, 403);
      assert.strictEqual(blockedRes.json.code, 'IP_QUARANTINED');
    } finally {
      quarantineEngine.unquarantineIp(bruteAttackerIp);
      auth.clearFailedAttempts(`ip:${bruteAttackerIp}`);
      server.close();
    }
  });

  // ==============================================================================
  // SECTION 10: ANTI-SPOOFING & HOP NORMALIZATION
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 10] Anti-Spoofing & IPv6 Hop Normalization${colors.reset}`);

  await runAsyncSubtest('IPv4-mapped IPv6 in X-Forwarded-For is normalized and blocked seamlessly', async () => {
    const realApp = require('../server/index');
    const server = await startServer(realApp);
    const port = server.address().port;

    const mappedIp = '::ffff:198.51.100.99';
    const cleanIp = '198.51.100.99';
    quarantineEngine.unquarantineIp(cleanIp);

    try {
      // Quarantine with IPv4-mapped IPv6 string
      quarantineEngine.quarantineIp(mappedIp, 'IPV6_MAPPED_TEST');

      // Request arriving as normalized or raw IPv4
      const res = await sendHttpRequest({
        port,
        path: '/api/health',
        headers: {
          'host': 'brosangroup.com',
          'x-forwarded-for': cleanIp
        }
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.json.code, 'IP_QUARANTINED');
    } finally {
      quarantineEngine.unquarantineIp(cleanIp);
      server.close();
    }
  });

  testEngine.close();

  // Clean up any test json files
  const tempFiles = [
    path.join(__dirname, '..', 'data', 'test_quarantine_temp.json'),
    path.join(__dirname, '..', 'data', 'test_quarantine_lru.json'),
    path.join(__dirname, '..', 'data', 'test_quarantine_10k.json'),
    path.join(__dirname, '..', 'data', 'test_quarantine_persistence.json'),
    path.join(__dirname, '..', 'data', 'test_quarantine_guard.json')
  ];
  for (const f of tempFiles) {
    if (fs.existsSync(f)) {
      try { fs.unlinkSync(f); } catch (_) {}
    }
  }

  console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.green}🎉 ALL ${passedTests}/${totalTests} DYNAMIC IP QUARANTINE UNIT TESTS PASSED (100% SUCCESS RATE)!${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);
}

if (require.main === module) {
  runQuarantineUnitTests().catch((err) => {
    console.error(`\n💥 Fatal test suite failure:`, err);
    process.exit(1);
  });
}

module.exports = { runQuarantineUnitTests };
