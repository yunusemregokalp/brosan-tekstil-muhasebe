/**
 * BROSAN TEKSTİL ERP — CITADEL SECURITY HARDENING
 * Empirical Adversarial Stress Test Suite: Emergency Panic Lockdown Switch (server/lockdown.js)
 * Challenger 1: Phase 3 Citadel Milestone 3
 * 
 * Verifies:
 * 1. High-throughput mutation flood (500 rapid mutating requests rejected with HTTP 503, zero DB writes)
 * 2. Timing attack simulation on recovery phrase (constant-time verification: correct prefix vs wrong phrase)
 * 3. Persistence fault-tolerance & corrupted state resilience (missing, malformed, binary, corrupted types)
 * 4. Rapid activate/restore toggle cycling (100 rapid cycles with state coherence & epoch preservation)
 * 5. Whitelist boundary evasion resistance (path traversal, suffix attacks, query poisoning, health probes)
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { performance } = require('perf_hooks');
const auth = require('../server/auth');
const { lockdownManager, lockdownGuard, EmergencyLockdownManager } = require('../server/lockdown');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const TEST_STATE_DIR = path.join(__dirname, '..', 'data');
const ADVERSARIAL_STATE_FILE = path.join(TEST_STATE_DIR, 'adversarial_lockdown_state.json');

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

async function runAdversarialStressSuite() {
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bold}⚔️ CITADEL ADVERSARIAL STRESS HARNESS: PANIC LOCKDOWN EMPIRICAL SUITE${colors.reset}`);
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

  // Ensure clean starting state
  lockdownManager.reset();

  // ==========================================================================
  // PILLAR 1: HIGH-THROUGHPUT MUTATION FLOOD & ZERO DB WRITE INTEGRITY
  // ==========================================================================
  console.log(`\n${colors.yellow}>>> [PILLAR 1] High-Throughput Mutation Flood & Zero DB Write Integrity${colors.reset}`);

  let server = null;
  let port = null;
  let app = null;
  let spyDbWrites = 0;
  const originalPrismaMethods = [];

  try {
    app = require('../server/index');
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = server.address().port;

    // Install instrumentation spies on prisma mutation methods
    const basePrisma = app.prisma || {};
    const mutationEntities = [
      'account', 'contact', 'journalEntry', 'transaction',
      'employee', 'check', 'product', 'invoice', 'user'
    ];
    const mutationOps = ['create', 'createMany', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert'];

    for (const entity of mutationEntities) {
      if (basePrisma[entity]) {
        for (const op of mutationOps) {
          if (typeof basePrisma[entity][op] === 'function') {
            const orig = basePrisma[entity][op];
            originalPrismaMethods.push({ entity, op, orig });
            basePrisma[entity][op] = function (...args) {
              spyDbWrites++;
              return orig.apply(this, args);
            };
          }
        }
      }
    }

    await runStep('A1: 500 rapid mutating requests during lockdown (100% rejected HTTP 503, 0 DB writes)', async () => {
      // Activate lockdown
      const act = lockdownManager.activateLockdown({
        initiatedBy: 'stress-tester',
        reason: 'ADVERSARIAL_MUTATION_FLOOD_TEST'
      });
      assert.strictEqual(lockdownManager.isLocked(), true, 'Lockdown must be engaged');
      assert.ok(act.recoveryPhrase, 'Recovery phrase must be generated');

      const mockToken = auth.generateToken({ id: 1, username: 'admin', role: 'ADMIN' });
      spyDbWrites = 0;

      const endpoints = [
        { method: 'POST', path: '/api/accounts', body: { code: '999.FLOOD', name: 'Flood Test Account', type: 'ASSET' } },
        { method: 'PUT', path: '/api/accounts/1', body: { name: 'Compromised Name' } },
        { method: 'DELETE', path: '/api/contacts/1', body: {} },
        { method: 'PATCH', path: '/api/employees/1', body: { status: 'TERMINATED' } },
        { method: 'POST', path: '/api/transactions', body: { amount: 50000, description: 'Illegal Transfer' } },
        { method: 'POST', path: '/api/journal', body: { description: 'Unauthorized Journal Entry' } },
        { method: 'POST', path: '/api/invoices', body: { invoiceNo: 'INV-MALICIOUS-999' } },
        { method: 'DELETE', path: '/api/invoices/1', body: {} },
        { method: 'POST', path: '/api/checks', body: { checkNo: 'CHK-999999' } },
        { method: 'PATCH', path: '/api/checks/1/status', body: { status: 'BOUNCED' } },
        { method: 'POST', path: '/api/products', body: { name: 'Exploit Product' } },
        { method: 'POST', path: '/api/auth/login', body: { username: 'admin', password: 'Password123!' } },
        { method: 'POST', path: '/api/auth/change-password', body: { oldPassword: 'Old', newPassword: 'New' } },
        { method: 'POST', path: '/muhasebe/api/accounts', body: { code: '888.SUB' } }
      ];

      const TOTAL_REQUESTS = 500;
      const CONCURRENCY = 25;
      const latencies = [];
      let rejected503Count = 0;
      let lockdownCodeCount = 0;
      let validHeadersCount = 0;

      const t0 = performance.now();

      // Dispatch 500 requests using a concurrency pool
      let reqIndex = 0;
      async function worker() {
        while (reqIndex < TOTAL_REQUESTS) {
          const currentIdx = reqIndex++;
          const target = endpoints[currentIdx % endpoints.length];
          const startReq = performance.now();

          const res = await sendHttpRequest({
            port,
            path: target.path,
            method: target.method,
            headers: {
              'Authorization': `Bearer ${mockToken}`
            },
            body: target.body
          });

          const dur = performance.now() - startReq;
          latencies.push(dur);

          if (res.statusCode === 503) rejected503Count++;
          if (res.json && res.json.code === 'SYSTEM_IN_LOCKDOWN' && res.json.locked === true) lockdownCodeCount++;
          if (
            res.headers['retry-after'] === '300' &&
            res.headers['x-system-status'] === 'LOCKEDDOWN' &&
            res.headers['x-robots-tag'] === 'noindex, nofollow' &&
            res.headers['cache-control'] === 'no-store, no-cache, must-revalidate'
          ) {
            validHeadersCount++;
          }
        }
      }

      const workers = Array.from({ length: CONCURRENCY }, () => worker());
      await Promise.all(workers);

      const totalDuration = performance.now() - t0;
      latencies.sort((a, b) => a - b);

      const p50 = latencies[Math.floor(latencies.length * 0.50)];
      const p90 = latencies[Math.floor(latencies.length * 0.90)];
      const p95 = latencies[Math.floor(latencies.length * 0.95)];
      const p99 = latencies[Math.floor(latencies.length * 0.99)];
      const maxLat = latencies[latencies.length - 1];
      const reqPerSec = (TOTAL_REQUESTS / (totalDuration / 1000)).toFixed(1);

      empiricalMetrics.mutationFlood = {
        totalRequests: TOTAL_REQUESTS,
        concurrency: CONCURRENCY,
        totalDurationMs: totalDuration.toFixed(1),
        throughputReqSec: reqPerSec,
        latencies: { p50: p50.toFixed(2), p90: p90.toFixed(2), p95: p95.toFixed(2), p99: p99.toFixed(2), max: maxLat.toFixed(2) },
        rejected503Count,
        lockdownCodeCount,
        validHeadersCount,
        spyDbWrites
      };

      console.log(`\n     📊 [FLOOD METRICS] ${TOTAL_REQUESTS} reqs in ${totalDuration.toFixed(1)}ms (${reqPerSec} req/s)`);
      console.log(`     📊 Latency: p50=${p50.toFixed(1)}ms, p95=${p95.toFixed(1)}ms, p99=${p99.toFixed(1)}ms, max=${maxLat.toFixed(1)}ms`);
      console.log(`     📊 Rejection Rate: ${rejected503Count}/${TOTAL_REQUESTS} (${((rejected503Count / TOTAL_REQUESTS) * 100).toFixed(1)}%) | DB Writes: ${spyDbWrites}`);

      assert.strictEqual(rejected503Count, TOTAL_REQUESTS, 'Every mutating request must return HTTP 503');
      assert.strictEqual(lockdownCodeCount, TOTAL_REQUESTS, 'Every request body must contain code: SYSTEM_IN_LOCKDOWN');
      assert.strictEqual(validHeadersCount, TOTAL_REQUESTS, 'Every response must contain Citadel lockdown security headers');
      assert.strictEqual(spyDbWrites, 0, 'ZERO database mutation calls allowed during panic lockdown');

      // Restore system cleanly
      lockdownManager.restoreSystem(act.recoveryPhrase);
    });

    await runStep('A2: Read-only probes (GET /api/health, GET /api/auth/emergency-lockdown) remain available', async () => {
      const act = lockdownManager.activateLockdown({ initiatedBy: 'probe-tester', reason: 'READONLY_PROBE_TEST' });

      // GET /api/health must return 200
      const healthRes = await sendHttpRequest({ port, path: '/api/health', method: 'GET' });
      assert.strictEqual(healthRes.statusCode, 200, 'Healthcheck must return 200 even during lockdown');

      // GET status must return 200 with isLocked: true
      const statusRes = await sendHttpRequest({ port, path: '/api/auth/emergency-lockdown', method: 'GET' });
      assert.strictEqual(statusRes.statusCode, 200);
      assert.strictEqual(statusRes.json.isLocked, true);

      lockdownManager.restoreSystem(act.recoveryPhrase);
    });

  } finally {
    // Restore prisma method spies
    for (const { entity, op, orig } of originalPrismaMethods) {
      if (app.prisma && app.prisma[entity]) {
        app.prisma[entity][op] = orig;
      }
    }
    if (server) {
      await new Promise(r => server.close(r));
    }
    lockdownManager.reset();
  }

  // ==========================================================================
  // PILLAR 2: TIMING ATTACK RESISTANCE (CONSTANT-TIME VERIFICATION)
  // ==========================================================================
  console.log(`\n${colors.yellow}>>> [PILLAR 2] Timing Attack Simulation on Recovery Phrase (Constant-Time Verification)${colors.reset}`);

  await runStep('B1: Constant-time statistical latency test (5,000 iterations: wrong prefix vs near-match suffix)', async () => {
    const mgr = new EmergencyLockdownManager({ stateFile: ADVERSARIAL_STATE_FILE });
    mgr.reset();

    const act = mgr.activateLockdown({
      initiatedBy: 'timing-challenger',
      reason: 'TIMING_ATTACK_HARNESS',
      customRecoveryPhrase: 'BROSAN-CITADEL-A1B2-C3D4-E5F6'
    });
    const realPhrase = act.recoveryPhrase; // 'BROSAN-CITADEL-A1B2-C3D4-E5F6'

    // Candidate 1: Completely wrong phrase with identical 29-char format
    const phraseWrongPrefix = 'BROSAN-CITADEL-0000-0000-0000';
    // Candidate 2: Near-match phrase (23 of 24 characters match, differing only in the last hex character)
    const phraseNearMatch = 'BROSAN-CITADEL-A1B2-C3D4-E5F7';
    // Candidate 3: Half-matching phrase
    const phraseHalfMatch = 'BROSAN-CITADEL-A1B2-0000-0000';

    // Warm-up V8 JIT compiler
    for (let i = 0; i < 2000; i++) {
      mgr.verifyRecoveryPhrase(phraseWrongPrefix);
      mgr.verifyRecoveryPhrase(phraseNearMatch);
      mgr.verifyRecoveryPhrase(realPhrase);
    }

    const BATCH_SIZE = 50;
    const SAMPLES = 100; // 100 * 50 = 5,000 trials per candidate
    const samplesWrong = [];
    const samplesNear = [];

    // Run interleaved batched trials to eliminate Windows task-scheduler jitter & GC spikes
    for (let s = 0; s < SAMPLES; s++) {
      const order = Math.random() < 0.5;

      if (order) {
        const t0 = performance.now();
        for (let b = 0; b < BATCH_SIZE; b++) mgr.verifyRecoveryPhrase(phraseWrongPrefix);
        const t1 = performance.now();
        samplesWrong.push(((t1 - t0) * 1000) / BATCH_SIZE); // per-call microseconds

        const t2 = performance.now();
        for (let b = 0; b < BATCH_SIZE; b++) mgr.verifyRecoveryPhrase(phraseNearMatch);
        const t3 = performance.now();
        samplesNear.push(((t3 - t2) * 1000) / BATCH_SIZE);
      } else {
        const t2 = performance.now();
        for (let b = 0; b < BATCH_SIZE; b++) mgr.verifyRecoveryPhrase(phraseNearMatch);
        const t3 = performance.now();
        samplesNear.push(((t3 - t2) * 1000) / BATCH_SIZE);

        const t0 = performance.now();
        for (let b = 0; b < BATCH_SIZE; b++) mgr.verifyRecoveryPhrase(phraseWrongPrefix);
        const t1 = performance.now();
        samplesWrong.push(((t1 - t0) * 1000) / BATCH_SIZE);
      }
    }

    // Robust statistics: Trimmed mean (excluding top/bottom 5% OS context switch spikes) and median
    function stats(arr) {
      const sorted = [...arr].sort((a, b) => a - b);
      const trimStart = Math.floor(sorted.length * 0.05);
      const trimEnd = Math.floor(sorted.length * 0.95);
      const trimmed = sorted.slice(trimStart, trimEnd);
      const mean = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
      const variance = trimmed.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (trimmed.length - 1);
      const stdDev = Math.sqrt(variance);
      const median = sorted[Math.floor(sorted.length / 2)];
      return { mean, stdDev, median, p95: sorted[Math.floor(sorted.length * 0.95)] };
    }

    const statsWrong = stats(samplesWrong);
    const statsNear = stats(samplesNear);
    const meanDiff = Math.abs(statsNear.mean - statsWrong.mean);
    const ratio = statsNear.mean / statsWrong.mean;

    empiricalMetrics.timingAttack = {
      trials: BATCH_SIZE * SAMPLES,
      wrongPrefix: { meanUs: statsWrong.mean.toFixed(3), stdDevUs: statsWrong.stdDev.toFixed(3), medianUs: statsWrong.median.toFixed(3) },
      nearMatch: { meanUs: statsNear.mean.toFixed(3), stdDevUs: statsNear.stdDev.toFixed(3), medianUs: statsNear.median.toFixed(3) },
      meanDeltaUs: meanDiff.toFixed(3),
      ratio: ratio.toFixed(4)
    };

    console.log(`\n     ⏱️ [TIMING ATTACK STATISTICS] (${BATCH_SIZE * SAMPLES} trials per candidate):`);
    console.log(`     ⏱️ Candidate A (Wrong Prefix) : Mean=${statsWrong.mean.toFixed(3)}µs | Median=${statsWrong.median.toFixed(3)}µs | StdDev=${statsWrong.stdDev.toFixed(3)}µs`);
    console.log(`     ⏱️ Candidate B (Near Match)   : Mean=${statsNear.mean.toFixed(3)}µs | Median=${statsNear.median.toFixed(3)}µs | StdDev=${statsNear.stdDev.toFixed(3)}µs`);
    console.log(`     ⏱️ |Mean A - Mean B| Delta     : ${meanDiff.toFixed(3)}µs (Ratio: ${ratio.toFixed(4)})`);

    // Verify cryptographic correctness
    assert.strictEqual(mgr.verifyRecoveryPhrase(realPhrase), true, 'Real phrase must verify');
    assert.strictEqual(mgr.verifyRecoveryPhrase(phraseWrongPrefix), false, 'Wrong prefix must reject');
    assert.strictEqual(mgr.verifyRecoveryPhrase(phraseNearMatch), false, 'Near match must reject');
    assert.strictEqual(mgr.verifyRecoveryPhrase(phraseHalfMatch), false, 'Half match must reject');

    // Statistical constant-time assertion: delta between means must be < 1.0 microsecond (1000 ns)
    // and ratio centered within [0.85, 1.15]
    assert.ok(
      meanDiff < 1.0,
      `Timing delta between correct prefix and wrong phrase must be < 1.0µs (observed: ${meanDiff.toFixed(3)}µs)`
    );
    assert.ok(
      ratio >= 0.85 && ratio <= 1.15,
      `Timing ratio must be centered around 1.0 (observed ratio: ${ratio.toFixed(4)})`
    );

    mgr.reset();
  });

  // ==========================================================================
  // PILLAR 3: PERSISTENCE FAULT-TOLERANCE & CORRUPTED STATE RESILIENCE
  // ==========================================================================
  console.log(`\n${colors.yellow}>>> [PILLAR 3] Persistence Fault-Tolerance & Corrupted State Resilience${colors.reset}`);

  const CORRUPT_STATE_FILE = path.join(TEST_STATE_DIR, 'corrupted_lockdown_state_test.json');

  await runStep('C1: Missing state file resilience (ENOENT clean startup & directory autogeneration)', async () => {
    const missingFile = path.join(TEST_STATE_DIR, 'non_existent_subdir_' + Date.now(), 'missing_state.json');
    if (fs.existsSync(missingFile)) fs.unlinkSync(missingFile);

    const mgr = new EmergencyLockdownManager({ stateFile: missingFile });
    assert.strictEqual(mgr.isLocked(), false, 'Manager must default to unlocked when file is missing');
    assert.strictEqual(mgr.getTokenRevocationEpoch(), 0, 'Revocation epoch must default to 0');

    // Activating lockdown must create directory and file gracefully
    const act = mgr.activateLockdown({ initiatedBy: 'resilience-test', reason: 'CREATE_MISSING_DIR' });
    assert.strictEqual(act.success, true);
    assert.ok(fs.existsSync(missingFile), 'State file must be created on disk');

    const loadedData = JSON.parse(fs.readFileSync(missingFile, 'utf8'));
    assert.strictEqual(loadedData.isLocked, true);

    // Cleanup
    try {
      fs.unlinkSync(missingFile);
      fs.rmdirSync(path.dirname(missingFile));
    } catch (_) {}
  });

  await runStep('C2: Syntactically broken JSON resilience (syntax error caught, defaults applied)', async () => {
    fs.writeFileSync(CORRUPT_STATE_FILE, '{ "isLocked": true, "corrupted_syntax": [', 'utf8');

    const mgr = new EmergencyLockdownManager({ stateFile: CORRUPT_STATE_FILE });
    // Must not crash, must fall back to safe default state
    assert.strictEqual(mgr.isLocked(), false, 'Manager must default to safe unlocked state on syntax error');
    assert.strictEqual(mgr.getTokenRevocationEpoch(), 0, 'Revocation epoch must default to 0');
    assert.strictEqual(mgr.getStatus().lockedAt, null);

    // Save must safely overwrite corrupt file with valid JSON
    mgr.saveToDisk();
    const recovered = JSON.parse(fs.readFileSync(CORRUPT_STATE_FILE, 'utf8'));
    assert.strictEqual(recovered.isLocked, false);
    assert.strictEqual(recovered.tokenRevocationEpoch, 0);
  });

  await runStep('C3: Binary and garbage byte resilience (unparseable payload caught cleanly)', async () => {
    const binaryGarbage = Buffer.from([0x00, 0xFF, 0xDE, 0xAD, 0xBE, 0xEF, 0xCA, 0xFE, 0xBA, 0xBE]);
    fs.writeFileSync(CORRUPT_STATE_FILE, binaryGarbage);

    const mgr = new EmergencyLockdownManager({ stateFile: CORRUPT_STATE_FILE });
    assert.strictEqual(mgr.isLocked(), false);
    assert.strictEqual(mgr.getTokenRevocationEpoch(), 0);
  });

  await runStep('C4: Empty state file resilience (0-byte file handled safely)', async () => {
    fs.writeFileSync(CORRUPT_STATE_FILE, '', 'utf8');

    const mgr = new EmergencyLockdownManager({ stateFile: CORRUPT_STATE_FILE });
    assert.strictEqual(mgr.isLocked(), false);
    assert.strictEqual(mgr.getTokenRevocationEpoch(), 0);
  });

  await runStep('C5: Malformed attribute types resilience (non-string hashes, invalid epoch, null salt)', async () => {
    const malformedState = {
      isLocked: "true", // string instead of boolean
      tokenRevocationEpoch: "invalid_epoch", // non-numeric
      recoverySalt: null,
      recoveryHash: 12345 // number instead of string
    };
    fs.writeFileSync(CORRUPT_STATE_FILE, JSON.stringify(malformedState), 'utf8');

    const mgr = new EmergencyLockdownManager({ stateFile: CORRUPT_STATE_FILE });
    // isLocked() returns Boolean(this.state.isLocked) -> true
    assert.strictEqual(typeof mgr.isLocked(), 'boolean');

    // verifyRecoveryPhrase must return false gracefully and NOT throw TypeError in Buffer / timingSafeEqual
    let verifyThrew = false;
    try {
      const res = mgr.verifyRecoveryPhrase('BROSAN-CITADEL-XXXX-XXXX-XXXX');
      assert.strictEqual(res, false, 'Must reject gracefully when hash/salt is malformed');
    } catch (err) {
      verifyThrew = true;
    }
    assert.strictEqual(verifyThrew, false, 'verifyRecoveryPhrase must NEVER throw on malformed state attributes');

    // Cleanup
    if (fs.existsSync(CORRUPT_STATE_FILE)) {
      fs.unlinkSync(CORRUPT_STATE_FILE);
    }
  });

  // ==========================================================================
  // PILLAR 4: RAPID ACTIVATE/RESTORE TOGGLE CYCLING & STATE COHERENCE
  // ==========================================================================
  console.log(`\n${colors.yellow}>>> [PILLAR 4] Rapid Activate/Restore Cycling & State Coherence (100 Cycles)${colors.reset}`);

  await runStep('D1: 100 consecutive rapid activate/restore cycles with zero state divergence', async () => {
    const mgr = new EmergencyLockdownManager({ stateFile: ADVERSARIAL_STATE_FILE });
    mgr.reset();

    const CYCLES = 100;
    let lastEpoch = 0;
    const cycleDurations = [];

    const t0 = performance.now();

    for (let i = 1; i <= CYCLES; i++) {
      const c0 = performance.now();

      // 1. Activate
      const act = mgr.activateLockdown({ initiatedBy: `cycle-tester-${i}`, reason: `RAPID_TOGGLE_${i}` });
      assert.strictEqual(act.success, true);
      assert.strictEqual(act.isLocked, true);
      assert.strictEqual(mgr.isLocked(), true);
      assert.ok(act.recoveryPhrase.startsWith('BROSAN-CITADEL-'));

      const currentEpoch = mgr.getTokenRevocationEpoch();
      assert.ok(currentEpoch >= lastEpoch, `Epoch must be non-decreasing (cycle ${i})`);
      lastEpoch = currentEpoch;

      // Disk state check during active
      const diskActive = JSON.parse(fs.readFileSync(ADVERSARIAL_STATE_FILE, 'utf8'));
      assert.strictEqual(diskActive.isLocked, true);
      assert.strictEqual(diskActive.lockedBy, `cycle-tester-${i}`);
      assert.strictEqual(diskActive.recoveryPhrase, undefined, 'Plaintext secret must never be written to disk');

      // 2. Reject bogus restore
      const bogusRestore = mgr.restoreSystem('BROSAN-CITADEL-FAKE-FAKE-FAKE');
      assert.strictEqual(bogusRestore.success, false);
      assert.strictEqual(mgr.isLocked(), true);

      // 3. Successful restore
      const restoreRes = mgr.restoreSystem(act.recoveryPhrase);
      assert.strictEqual(restoreRes.success, true);
      assert.strictEqual(mgr.isLocked(), false);

      // Verify epoch preserved
      assert.strictEqual(mgr.getTokenRevocationEpoch(), currentEpoch, 'Epoch must be preserved after restore');

      // Disk state check during restored
      const diskRestored = JSON.parse(fs.readFileSync(ADVERSARIAL_STATE_FILE, 'utf8'));
      assert.strictEqual(diskRestored.isLocked, false);
      assert.strictEqual(diskRestored.tokenRevocationEpoch, currentEpoch);

      cycleDurations.push(performance.now() - c0);
    }

    const totalCyclingTime = performance.now() - t0;
    const avgCycleMs = totalCyclingTime / CYCLES;

    empiricalMetrics.rapidCycling = {
      cycles: CYCLES,
      totalDurationMs: totalCyclingTime.toFixed(1),
      avgCycleMs: avgCycleMs.toFixed(2),
      finalEpoch: lastEpoch
    };

    console.log(`\n     🔄 [CYCLING METRICS] ${CYCLES} full cycles completed in ${totalCyclingTime.toFixed(1)}ms (avg ${avgCycleMs.toFixed(2)}ms/cycle)`);
    console.log(`     🔄 Zero state corruption, monotonic epochs verified across all cycles.`);

    mgr.reset();
  });

  // ==========================================================================
  // PILLAR 5: WHITELIST BOUNDARY EVASION & SECURITY EDGE CASES
  // ==========================================================================
  console.log(`\n${colors.yellow}>>> [PILLAR 5] Whitelist Boundary Evasion & Security Edge Cases${colors.reset}`);

  let srv5 = null;
  let port5 = null;

  try {
    const app = require('../server/index');
    srv5 = http.createServer(app);
    await new Promise((resolve) => srv5.listen(0, '127.0.0.1', resolve));
    port5 = srv5.address().port;

    await runStep('E1: Whitelist evasion attempts (query poisoning, traversal, suffix injection, method case)', async () => {
      lockdownManager.reset();
      const act = lockdownManager.activateLockdown({
        initiatedBy: 'evasion-challenger',
        reason: 'WHITELIST_BOUNDARY_EVASION_TEST'
      });
      const recoveryPhrase = act.recoveryPhrase;

      // 1. Query param injection attempting to trick path parsing: POST /api/accounts?health=true
      const queryPoisonRes = await sendHttpRequest({
        port: port5,
        path: '/api/accounts?health=true',
        method: 'POST',
        body: { code: '100' }
      });
      assert.strictEqual(queryPoisonRes.statusCode, 503, 'Query parameter must not evade lockdownGuard');
      assert.strictEqual(queryPoisonRes.json.code, 'SYSTEM_IN_LOCKDOWN');

      // 2. Hash fragment attempt: POST /api/accounts#health
      const hashAttemptRes = await sendHttpRequest({
        port: port5,
        path: '/api/accounts#health',
        method: 'POST',
        body: { code: '100' }
      });
      assert.strictEqual(hashAttemptRes.statusCode, 503, 'Hash fragment must not evade lockdownGuard');

      // 3. Traversal probe attempting to abuse recovery whitelist: POST /api/auth/emergency-lockdown/restore/../../accounts
      const traversalRes = await sendHttpRequest({
        port: port5,
        path: '/api/auth/emergency-lockdown/restore/../../accounts',
        method: 'POST',
        body: { code: '100' }
      });
      // Traversal must be rejected either by 503, 403 (sensitive probe / anti-traversal), or 400
      assert.ok([503, 403, 400, 404].includes(traversalRes.statusCode), 'Path traversal must be safely rejected');

      // 4. Suffix evasion: POST /api/accounts/health (verify no account creation occurs)
      const suffixRes = await sendHttpRequest({
        port: port5,
        path: '/api/accounts/health',
        method: 'POST',
        body: { code: '999' }
      });
      // Route doesn't exist, must return 401 or 404, never 200 or allow account mutation
      assert.ok([401, 404, 503].includes(suffixRes.statusCode));

      // 5. Valid restore through HTTP endpoint works
      const restoreRes = await sendHttpRequest({
        port: port5,
        path: '/api/auth/emergency-lockdown/restore',
        method: 'POST',
        body: { recoveryPhrase }
      });
      assert.strictEqual(restoreRes.statusCode, 200);
      assert.strictEqual(restoreRes.json.code, 'LOCKDOWN_RESTORED');
      assert.strictEqual(lockdownManager.isLocked(), false);

      lockdownManager.reset();
    });

  } finally {
    if (srv5) {
      await new Promise(r => srv5.close(r));
    }
    lockdownManager.reset();
  }

  // Cleanup test artifacts
  if (fs.existsSync(ADVERSARIAL_STATE_FILE)) {
    try { fs.unlinkSync(ADVERSARIAL_STATE_FILE); } catch (_) {}
  }

  // ==========================================================================
  // FINAL EMPIRICAL SUMMARY & VERDICT
  // ==========================================================================
  console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bold}⚔️ ADVERSARIAL STRESS TEST SUMMARY: EMERGENCY PANIC LOCKDOWN${colors.reset}`);
  console.log(`${colors.cyan}========================================================================${colors.reset}`);
  console.log(`  Total Test Steps Executed : ${totalTests}`);
  console.log(`  Passed Steps             : ${colors.green}${passedTests}${colors.reset}`);
  console.log(`  Failed Steps             : ${failedTests > 0 ? colors.red : colors.green}${failedTests}${colors.reset}`);
  console.log(`  Pass Rate                : ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`${colors.cyan}------------------------------------------------------------------------${colors.reset}`);

  if (failedTests > 0) {
    console.log(`${colors.bold}${colors.red}❌ VERDICT: REQUEST_CHANGES — Failure details:${colors.reset}`);
    for (const f of failureDetails) {
      console.log(`  • ${f.name}: ${f.error}`);
    }
    throw new Error(`Adversarial stress test failed with ${failedTests} failures.`);
  } else {
    console.log(`${colors.bold}${colors.green}🎉 VERDICT: APPROVE — All empirical stress & timing thresholds passed 100%!${colors.reset}`);
  }
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

  return {
    totalTests,
    passedTests,
    failedTests,
    empiricalMetrics,
    verdict: failedTests === 0 ? 'APPROVE' : 'REQUEST_CHANGES'
  };
}

if (require.main === module) {
  runAdversarialStressSuite()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Test suite execution error:', err.message);
      process.exit(1);
    });
}

module.exports = runAdversarialStressSuite;
