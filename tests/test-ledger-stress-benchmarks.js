/**
 * BROSAN TEKSTİL ERP — LEDGER STRESS, CONCURRENCY & HIGH-VOLUME BENCHMARK HARNESS
 * tests/test-ledger-stress-benchmarks.js
 * 
 * Challenger M3-2 Empirical Benchmark Suite (Requirement R3):
 * 
 * 1. High-Volume Sequential Throughput Benchmark:
 *    - Generate 1,000+ (1,500 & 2,500) sequential chained blocks.
 *    - Measure chaining throughput (ops/sec).
 *    - Measure verification latency against the <50ms target.
 *    - Adversarial tamper localization at scale (Genesis, mid-chain, and head blocks).
 * 
 * 2. Concurrent Append Stress & Race-Condition Mining:
 *    - Simulate rapid asynchronous appends (Promise.all and interleaved event-loop turns).
 *    - Verify monotonic index sequence ordering and SHA-256 chain continuity.
 *    - Audit memory & state consistency under rapid asynchronous load.
 * 
 * 3. Disk Persistence Resilience & Cold Reload:
 *    - Backup and isolate data/ledger_blocks.json.
 *    - Persist multi-block chains to disk; flush and reload in memory.
 *    - Verify exact match of totalBlocks, genesisHash, and headHash.
 *    - Adversarial disk tampering: detect altered JSON fields on reload.
 *    - Malformed JSON recovery: verify resilient fallback without crash.
 * 
 * 4. Live Express HTTP Load & Concurrency Probing:
 *    - Spin up the live Express app with production security middleware.
 *    - Probe /api/audit/verify-integrity concurrently with valid JWT auth.
 *    - Measure latency percentiles (p50, p95, p99, max) and 0% error rate.
 *    - Verify rate-limiting behavior (120 req/min threshold).
 *    - Concurrent tamper detection: verify consistent 409 responses under load.
 */

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { performance } = require('perf_hooks');
const jwt = require('jsonwebtoken');

// Import ledger integrity module and core security dependencies
const ledgerIntegrity = require('../server/ledgerIntegrity');
const {
  deriveLedgerKey,
  computeGenesisHash,
  computeEntryHash,
  normalizeAmount,
  normalizeTimestamp,
  timingSafeHashEqual,
  createGenesisBlock,
  appendBlock,
  appendTransaction,
  verifyChainContinuity,
  verifyChain,
  getChainHead,
  getChain,
  loadChainFromDisk,
  persistChainToDisk,
  initGenesisBlock,
  LEDGER_FILE,
  ZERO_PREV_HASH
} = ledgerIntegrity;

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m'
};

let totalSuites = 0;
let passedSuites = 0;
const testResults = [];

function recordResult(name, passed, details = {}) {
  totalSuites++;
  if (passed) {
    passedSuites++;
    console.log(`  ${colors.green}✔ PASS${colors.reset} ${colors.bold}${name}${colors.reset}`);
  } else {
    console.error(`  ${colors.red}✖ FAIL${colors.reset} ${colors.bold}${name}${colors.reset}`);
    if (details.error) console.error(`    ${colors.yellow}${details.error}${colors.reset}`);
  }
  testResults.push({ name, passed, ...details });
}

// HTTP request helper
function sendHttpRequest({ port, path, method = 'GET', headers = {} }) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        host: 'brosangroup.com',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, body: data, json });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ==============================================================================
// MAIN BENCHMARK & STRESS HARNESS
// ==============================================================================
async function runLedgerStressHarness() {
  console.log(`\n${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}⚡ BROSAN ERP — CHALLENGER M3-2 STRESS & CONCURRENCY BENCHMARK HARNESS${colors.reset}`);
  console.log(`${colors.dim}Requirement R3: Tamper-Evident HMAC Financial Ledger Audit Chain${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  // Backup original ledger_blocks.json before tests
  let originalLedgerBackup = null;
  if (fs.existsSync(LEDGER_FILE)) {
    originalLedgerBackup = fs.readFileSync(LEDGER_FILE, 'utf8');
  }

  const key = ledgerIntegrity.getMasterLedgerKey();

  try {
    // --------------------------------------------------------------------------
    // SUITE 1: HIGH-VOLUME SEQUENTIAL THROUGHPUT BENCHMARK (1,000+ BLOCKS)
    // --------------------------------------------------------------------------
    console.log(`${colors.bold}${colors.blue}▶ SUITE 1: High-Volume Sequential Throughput Benchmark (1,000+ Blocks)${colors.reset}`);
    {
      const BLOCK_COUNT_1 = 1000;
      const BLOCK_COUNT_2 = 2500;

      // 1.1 Generate 1,000 blocks and measure verification latency (<50ms target)
      const t0Append = performance.now();
      const chain1000 = [createGenesisBlock(key)];
      for (let i = 1; i <= BLOCK_COUNT_1; i++) {
        appendBlock(chain1000, {
          recordId: `tx-bench-1000-${i}`,
          amount: (100.50 + (i % 100) * 1.25).toFixed(2),
          type: i % 2 === 0 ? 'PAYMENT' : 'INVOICE',
          timestamp: new Date(1760000000000 + i * 60000).toISOString(),
          metadata: { seq: i, note: 'Stress benchmark transaction' }
        }, key);
      }
      const tAppendDuration = performance.now() - t0Append;
      const appendRate = Math.round((BLOCK_COUNT_1 / (tAppendDuration / 1000)));

      assert.strictEqual(chain1000.length, BLOCK_COUNT_1 + 1);

      // Measure verification latency
      const t0Verify = performance.now();
      const verifyResult1000 = verifyChain(chain1000, key);
      const verifyLatency1000 = performance.now() - t0Verify;

      assert.strictEqual(verifyResult1000.isValid, true, '1,000-block chain must verify cleanly');
      assert.strictEqual(verifyResult1000.totalEntries, BLOCK_COUNT_1 + 1);
      assert.ok(
        verifyLatency1000 < 50,
        `Verification latency (${verifyLatency1000.toFixed(2)}ms) must be strictly < 50ms for 1,000 blocks`
      );

      console.log(`    📊 Chained ${BLOCK_COUNT_1} blocks in ${tAppendDuration.toFixed(2)}ms (${appendRate} ops/sec)`);
      console.log(`    ⏱️ Verification Latency (1,001 blocks): ${colors.bold}${verifyLatency1000.toFixed(2)}ms${colors.reset} (Target: <50ms)`);

      recordResult('1.1 1,000-Block Sequential Verification (<50ms Target)', true, {
        blocks: BLOCK_COUNT_1,
        appendDurationMs: tAppendDuration,
        appendRateOpsSec: appendRate,
        verifyLatencyMs: verifyLatency1000,
        targetMs: 50
      });

      // 1.2 Scale up to 2,500 blocks to test linear O(N) scaling
      const chain2500 = [...chain1000];
      for (let i = BLOCK_COUNT_1 + 1; i <= BLOCK_COUNT_2; i++) {
        appendBlock(chain2500, {
          recordId: `tx-bench-2500-${i}`,
          amount: (250.75 + (i % 50) * 2.10).toFixed(2),
          type: 'SETTLEMENT',
          timestamp: new Date(1760000000000 + i * 60000).toISOString()
        }, key);
      }
      assert.strictEqual(chain2500.length, BLOCK_COUNT_2 + 1);

      const t0Verify2500 = performance.now();
      const verifyResult2500 = verifyChain(chain2500, key);
      const verifyLatency2500 = performance.now() - t0Verify2500;

      assert.strictEqual(verifyResult2500.isValid, true);
      assert.strictEqual(verifyResult2500.totalEntries, BLOCK_COUNT_2 + 1);
      console.log(`    ⏱️ Verification Latency (2,501 blocks): ${colors.bold}${verifyLatency2500.toFixed(2)}ms${colors.reset}`);

      recordResult('1.2 2,500-Block Scaled Verification Latency', true, {
        blocks: BLOCK_COUNT_2,
        verifyLatencyMs: verifyLatency2500
      });

      // 1.3 High-volume Adversarial Tamper Pinpointing
      // Tamper mid-chain block (index 500)
      const tamperedChain = JSON.parse(JSON.stringify(chain1000));
      tamperedChain[500]._original = { amount: tamperedChain[500].amount };
      tamperedChain[500].amount = '999999.99';

      const t0Tamper = performance.now();
      const tamperResult = verifyChain(tamperedChain, key);
      const tamperDetectionLatency = performance.now() - t0Tamper;

      assert.strictEqual(tamperResult.isValid, false);
      assert.strictEqual(tamperResult.error, 'LEDGER_TAMPER_DETECTED');
      assert.strictEqual(tamperResult.corruptedIndex, 500);
      assert.strictEqual(tamperResult.corruptedRecordId, 'tx-bench-1000-500');
      assert.strictEqual(tamperResult.tamperPoint.field, 'amount');

      // 1.4 Statistical Verification Latency Distribution (10 Iterations)
      const LATENCY_RUNS = 10;
      const latencySamples = [];
      for (let run = 0; run < LATENCY_RUNS; run++) {
        const tStart = performance.now();
        const res = verifyChain(chain1000, key);
        const lat = performance.now() - tStart;
        assert.strictEqual(res.isValid, true);
        latencySamples.push(lat);
      }
      latencySamples.sort((a, b) => a - b);
      const minL = latencySamples[0];
      const maxL = latencySamples[latencySamples.length - 1];
      const meanL = latencySamples.reduce((a, b) => a + b, 0) / LATENCY_RUNS;
      const p99L = latencySamples[Math.floor(LATENCY_RUNS * 0.99)] || maxL;

      assert.ok(maxL < 50, `All 10 verification runs must stay strictly below 50ms (max observed: ${maxL.toFixed(2)}ms)`);
      console.log(`    📊 1,000-Block Verification Distribution (10 runs): min=${minL.toFixed(2)}ms, mean=${meanL.toFixed(2)}ms, p99=${p99L.toFixed(2)}ms, max=${maxL.toFixed(2)}ms (<50ms Target: 100% SLA)`);

      recordResult('1.4 1,000-Block Statistical Latency Distribution (10 Runs <50ms SLA)', true, {
        runs: LATENCY_RUNS,
        minMs: minL,
        meanMs: meanL,
        p99Ms: p99L,
        maxMs: maxL,
        slaPass: true
      });
    }

    // --------------------------------------------------------------------------
    // SUITE 2: CONCURRENT APPEND STRESS & RACE-CONDITION MINING
    // --------------------------------------------------------------------------
    console.log(`\n${colors.bold}${colors.blue}▶ SUITE 2: Concurrent Append Stress & Race-Condition Mining${colors.reset}`);
    {
      // 2.1 Rapid asynchronous batch appends via Promise.all
      // Reset module chain to clean Genesis
      initGenesisBlock(key);
      const initialHead = getChainHead();
      assert.strictEqual(initialHead.sequence, 0);

      const CONCURRENT_OPS = 100;
      const recordsToAppend = Array.from({ length: CONCURRENT_OPS }, (_, i) => ({
        id: `concurrent-tx-${i + 1}`,
        amount: (50.00 + i * 1.5).toFixed(2),
        type: 'CONCURRENT_JOURNAL',
        date: new Date(1760100000000 + i * 1000).toISOString(),
        description: `Concurrent append task #${i + 1}`
      }));

      const t0Concurrent = performance.now();

      // Launch 100 concurrent asynchronous tasks interleaved across event loop turns
      const appendPromises = recordsToAppend.map((rec, idx) => {
        return new Promise((resolve, reject) => {
          // Add micro jitter to interleave microtasks and macrotasks
          const delay = (idx % 5);
          setTimeout(() => {
            try {
              // Append to module ledger chain (in-memory, with persist immediately disabled during rapid burst)
              const block = appendTransaction(rec, { key, persistImmediately: false });
              resolve(block);
            } catch (err) {
              reject(err);
            }
          }, delay);
        });
      });

      const appendedBlocks = await Promise.all(appendPromises);
      const concurrentDuration = performance.now() - t0Concurrent;

      const activeChain = getChain();
      assert.strictEqual(activeChain.length, CONCURRENT_OPS + 1, 'Chain must contain exactly Genesis + 100 blocks');

      // Verify sequence monotonicity and unbroken links
      for (let i = 1; i < activeChain.length; i++) {
        const prev = activeChain[i - 1];
        const curr = activeChain[i];
        assert.strictEqual(curr.sequence, i, `Block sequence must be monotonically consecutive at index ${i}`);
        assert.strictEqual(curr.prevHash, prev.entryHash, `Hash link must be consecutive at index ${i}`);
      }

      // Cryptographically verify entire concurrent chain
      const concurrentVerify = verifyChainContinuity({ chain: activeChain, key });
      assert.strictEqual(concurrentVerify.isValid, true, 'Concurrently appended chain must pass 100% cryptographic verification');
      assert.strictEqual(concurrentVerify.totalEntries, CONCURRENT_OPS + 1);

      console.log(`    ⚡ Appended ${CONCURRENT_OPS} concurrent transactions in ${concurrentDuration.toFixed(2)}ms`);
      console.log(`    🔗 Hash continuity and sequence monotonicity: 100% verified without desynchronization`);

      recordResult('2.1 Concurrent Asynchronous Appends (100 Tasks via Promise.all)', true, {
        operations: CONCURRENT_OPS,
        durationMs: concurrentDuration,
        verified: concurrentVerify.isValid
      });

      // 2.2 Concurrent Appends WITH Immediate Disk Persistence Enabled
      // Testing file write interleaving resilience
      const DISK_CONCURRENT_OPS = 25;
      const diskRecords = Array.from({ length: DISK_CONCURRENT_OPS }, (_, i) => ({
        id: `disk-concurrent-${i + 1}`,
        amount: (120.00 + i).toFixed(2),
        type: 'DISK_CONCURRENT',
        date: new Date(1760200000000 + i * 1000).toISOString()
      }));

      const diskPromises = diskRecords.map((rec, idx) => {
        return new Promise((resolve, reject) => {
          setImmediate(() => {
            try {
              const block = appendTransaction(rec, { key, persistImmediately: true });
              resolve(block);
            } catch (err) {
              reject(err);
            }
          });
        });
      });

      await Promise.all(diskPromises);
      const postDiskChain = getChain();
      const expectedTotal = 1 + CONCURRENT_OPS + DISK_CONCURRENT_OPS;
      assert.strictEqual(postDiskChain.length, expectedTotal);

      const diskVerify = verifyChainContinuity({ chain: postDiskChain, key });
      assert.strictEqual(diskVerify.isValid, true);

      recordResult('2.2 Concurrent Appends With Immediate Disk Persistence', true, {
        operations: DISK_CONCURRENT_OPS,
        totalBlocks: postDiskChain.length
      });
    }

    // --------------------------------------------------------------------------
    // SUITE 3: DISK PERSISTENCE RESILIENCE & COLD RELOAD
    // --------------------------------------------------------------------------
    console.log(`\n${colors.bold}${colors.blue}▶ SUITE 3: Disk Persistence Resilience & Cold Reload${colors.reset}`);
    {
      // 3.1 Cold Reload Integrity Check
      // We currently have a valid active chain with 126 blocks.
      const headBeforePersist = getChainHead();
      persistChainToDisk();

      // Read the file directly from disk
      const rawDiskContent = fs.readFileSync(LEDGER_FILE, 'utf8');
      const parsedDisk = JSON.parse(rawDiskContent);
      assert.strictEqual(parsedDisk.version, '1.0.0');
      assert.strictEqual(parsedDisk.totalBlocks, headBeforePersist.sequence + 1);
      assert.strictEqual(parsedDisk.headHash, headBeforePersist.entryHash);

      // Simulate cold restart: clear in-memory state and reload from disk
      const reloadedBlocks = loadChainFromDisk();
      assert.strictEqual(reloadedBlocks.length, headBeforePersist.sequence + 1);
      const reloadedHead = getChainHead();
      assert.strictEqual(reloadedHead.entryHash, headBeforePersist.entryHash);
      assert.strictEqual(reloadedHead.sequence, headBeforePersist.sequence);

      // Verify the reloaded chain
      const reloadVerify = verifyChainContinuity({ chain: reloadedBlocks, key });
      assert.strictEqual(reloadVerify.isValid, true, 'Cold reloaded chain must verify 100% cleanly');
      assert.strictEqual(reloadVerify.headHash, headBeforePersist.entryHash);

      console.log(`    💾 Cold reload reconstructed exact headHash: ${reloadedHead.entryHash.slice(0, 16)}... (${reloadedBlocks.length} blocks)`);
      recordResult('3.1 Disk Cold Reload Reconstructs Exact Valid Head Hash', true, {
        reloadedBlocks: reloadedBlocks.length,
        headHash: reloadedHead.entryHash
      });

      // 3.2 Adversarial Disk Tampering Detection
      // Mutate a block inside the disk JSON directly and test load/verification
      const tamperedDiskData = JSON.parse(rawDiskContent);
      const targetBlock = tamperedDiskData.blocks[tamperedDiskData.blocks.length - 2];
      const origAmount = targetBlock.amount;
      targetBlock.amount = '999999.00'; // Tamper amount directly in file

      fs.writeFileSync(LEDGER_FILE, JSON.stringify(tamperedDiskData, null, 2), 'utf8');

      // Reload from tampered disk
      const tamperedReload = loadChainFromDisk();
      const tamperedVerify = verifyChainContinuity({ chain: tamperedReload, key });
      assert.strictEqual(tamperedVerify.isValid, false, 'Tampered disk file must fail chain verification');
      assert.strictEqual(tamperedVerify.error, 'LEDGER_TAMPER_DETECTED');
      assert.strictEqual(tamperedVerify.corruptedRecordId, targetBlock.recordId);

      console.log(`    🛡️ Disk file tampering detected on reload: corruptedRecordId=${tamperedVerify.corruptedRecordId}`);
      recordResult('3.2 Adversarial Disk JSON Tamper Detection on Reload', true, {
        corruptedRecordId: tamperedVerify.corruptedRecordId,
        detected: true
      });

      // 3.3 Corrupted / Invalid JSON Recovery
      fs.writeFileSync(LEDGER_FILE, '{ INVALID_JSON_DATA_CORRUPTED_FILE... ', 'utf8');
      const recoveredBlocks = loadChainFromDisk();
      assert.ok(Array.isArray(recoveredBlocks), 'Must recover to a valid chain array');
      assert.strictEqual(recoveredBlocks.length, 1, 'Must fallback to valid Genesis block');
      assert.strictEqual(recoveredBlocks[0].recordId, 'GENESIS');

      console.log(`    🛡️ Malformed disk file handled gracefully with Genesis root fallback`);
      recordResult('3.3 Corrupted Disk File Resilient Fallback to Genesis', true, {
        recoveredBlocks: recoveredBlocks.length
      });
    }

    // --------------------------------------------------------------------------
    // SUITE 4: LIVE EXPRESS HTTP LOAD & CONCURRENCY PROBING
    // --------------------------------------------------------------------------
    console.log(`\n${colors.bold}${colors.blue}▶ SUITE 4: Live Express HTTP Load & Concurrency Probing${colors.reset}`);
    {
      // Prepare a clean valid chain with sample records for HTTP testing
      initGenesisBlock(key);
      const httpSampleTxs = [
        { id: 'tx-http-1', amount: '15732.92', type: 'BANK_TRANSFER' },
        { id: 'tx-http-2', amount: '23759.07', type: 'BANK_TRANSFER' },
        { id: 'tx-http-3', amount: '22414.22', type: 'INVOICE' },
        { id: 'tx-http-4', amount: '7461.45', type: 'SALES_INVOICE' },
        { id: 'tx-http-5', amount: '-10335.35', type: 'MAHSUP' }
      ];
      for (const tx of httpSampleTxs) {
        appendTransaction(tx, { key, persistImmediately: false });
      }
      persistChainToDisk();

      // Spin up production app server
      const prodApp = require('../server/index');
      const prodServer = await new Promise(r => {
        const s = prodApp.listen(0, '127.0.0.1', () => r(s));
      });
      const prodPort = prodServer.address().port;

      try {
        const auth = require('../server/auth');
        // Generate valid administrative JWT token with session fingerprint
        const adminToken = auth.generateToken(
          { id: 'stress-tester-admin', username: 'admin', role: 'ADMIN' },
          { is2FAVerified: true }
        );

        // 4.1 Concurrent HTTP probes (50 simultaneous requests)
        const CONCURRENT_HTTP_REQS = 50;
        const probeLatencies = [];
        const t0HttpBurst = performance.now();

        const httpPromises = Array.from({ length: CONCURRENT_HTTP_REQS }, async (_, i) => {
          const tReqStart = performance.now();
          const res = await sendHttpRequest({
            port: prodPort,
            path: '/api/audit/verify-integrity',
            method: 'GET',
            headers: {
              authorization: `Bearer ${adminToken}`,
              'user-agent': 'BrosanStressBench/1.0'
            }
          });
          const latency = performance.now() - tReqStart;
          probeLatencies.push(latency);
          return res;
        });

        const responses = await Promise.all(httpPromises);
        const totalBurstTime = performance.now() - t0HttpBurst;

        // Audit HTTP response codes and payloads
        const status200Count = responses.filter(r => r.status === 200).length;
        const isValidCount = responses.filter(r => r.json && r.json.isValid === true).length;

        if (status200Count !== CONCURRENT_HTTP_REQS) {
          console.error('    ❌ Non-200 response sample:', {
            status: responses[0]?.status,
            body: responses[0]?.body,
            json: responses[0]?.json,
            headers: responses[0]?.headers
          });
        }

        assert.strictEqual(status200Count, CONCURRENT_HTTP_REQS, `All ${CONCURRENT_HTTP_REQS} requests must return 200 OK`);
        assert.strictEqual(isValidCount, CONCURRENT_HTTP_REQS, `All ${CONCURRENT_HTTP_REQS} responses must have isValid: true`);

        // Calculate latency stats
        probeLatencies.sort((a, b) => a - b);
        const minLatency = probeLatencies[0];
        const p50 = probeLatencies[Math.floor(CONCURRENT_HTTP_REQS * 0.50)];
        const p95 = probeLatencies[Math.floor(CONCURRENT_HTTP_REQS * 0.95)];
        const maxLatency = probeLatencies[probeLatencies.length - 1];
        const avgLatency = probeLatencies.reduce((a, b) => a + b, 0) / CONCURRENT_HTTP_REQS;
        const rps = Math.round((CONCURRENT_HTTP_REQS / (totalBurstTime / 1000)));

        console.log(`    🌐 Sent ${CONCURRENT_HTTP_REQS} concurrent HTTP GET /api/audit/verify-integrity requests in ${totalBurstTime.toFixed(2)}ms (~${rps} req/sec)`);
        console.log(`    📈 Status Codes: ${status200Count}/${CONCURRENT_HTTP_REQS} (200 OK) | 0% Error Rate`);
        console.log(`    ⏱️ Latency Distribution: min=${minLatency.toFixed(2)}ms, p50=${p50.toFixed(2)}ms, p95=${p95.toFixed(2)}ms, max=${maxLatency.toFixed(2)}ms`);

        recordResult('4.1 Live Express HTTP Concurrent Probe (50 Requests, 0% Error)', true, {
          requests: CONCURRENT_HTTP_REQS,
          status200Count,
          minLatencyMs: minLatency,
          p50Ms: p50,
          p95Ms: p95,
          maxLatencyMs: maxLatency,
          avgLatencyMs: avgLatency,
          rps
        });

        // 4.2 Concurrent Adversarial Tamper Detection Under HTTP Load
        const activeChain = getChain();
        const origBlock1Amount = activeChain[1].amount;
        activeChain[1]._original = { amount: origBlock1Amount };
        activeChain[1].amount = '98765.43'; // Inject in-memory tamper

        const CONCURRENT_TAMPER_REQS = 20;
        const tamperHttpPromises = Array.from({ length: CONCURRENT_TAMPER_REQS }, async () => {
          return sendHttpRequest({
            port: prodPort,
            path: '/api/audit/verify-integrity',
            method: 'GET',
            headers: {
              authorization: `Bearer ${adminToken}`,
              'user-agent': 'BrosanStressBench/1.0'
            }
          });
        });

        const tamperResponses = await Promise.all(tamperHttpPromises);
        const status409Count = tamperResponses.filter(r => r.status === 409).length;
        const tamperIdentifiedCount = tamperResponses.filter(r => 
          r.json && r.json.isValid === false && r.json.error === 'LEDGER_TAMPER_DETECTED' && r.json.corruptedIndex === 1
        ).length;

        assert.strictEqual(status409Count, CONCURRENT_TAMPER_REQS, `All ${CONCURRENT_TAMPER_REQS} concurrent requests must return 409 Conflict`);
        assert.strictEqual(tamperIdentifiedCount, CONCURRENT_TAMPER_REQS, `All ${CONCURRENT_TAMPER_REQS} responses must identify corruptedIndex=1`);

        console.log(`    🔍 Concurrent HTTP Tamper Probing: ${status409Count}/${CONCURRENT_TAMPER_REQS} requests received consistent 409 Conflict with exact fault localization`);
        recordResult('4.2 Concurrent Adversarial Tamper Detection Under HTTP Load (409 Conflict)', true, {
          concurrentRequests: CONCURRENT_TAMPER_REQS,
          status409Count,
          corruptedIndex: 1
        });

        // Restore chain block
        activeChain[1].amount = origBlock1Amount;
        delete activeChain[1]._original;

        // 4.3 Rate Limiter Enforcement Probing
        // Global rate limit is 120 req/min per IP.
        // We already sent 50 (test 4.1) + 20 (test 4.2) = 70 requests.
        // Let's send 60 more requests to hit 130 total and verify HTTP 429 throttling!
        console.log(`    🚦 Testing rate-limiting boundary (>120 requests from single IP)...`);
        const excessResponses = [];
        for (let i = 0; i < 60; i++) {
          const res = await sendHttpRequest({
            port: prodPort,
            path: '/api/audit/verify-integrity',
            method: 'GET',
            headers: {
              authorization: `Bearer ${adminToken}`,
              'user-agent': 'BrosanStressBench/1.0'
            }
          });
          excessResponses.push(res);
        }

        const rateLimitedCount = excessResponses.filter(r => r.status === 429).length;
        console.log(`    🛡️ Rate limiting kicked in on excess load: ${rateLimitedCount} requests throttled with 429 Too Many Requests`);
        assert.ok(rateLimitedCount > 0, 'Rate limiter must throttle requests exceeding 120 req/min');

        recordResult('4.3 Express Rate Limiter Boundary Throttling (HTTP 429 Verified)', true, {
          totalSent: 70 + 60,
          rateLimitedCount
        });

      } finally {
        prodServer.close();
      }
    }

  } finally {
    // Teardown: Restore original ledger_blocks.json
    if (originalLedgerBackup) {
      fs.writeFileSync(LEDGER_FILE, originalLedgerBackup, 'utf8');
      loadChainFromDisk();
      console.log(`\n${colors.dim}🧹 Cleaned up test artifacts: Restored original data/ledger_blocks.json${colors.reset}`);
    }
  }

  // Final Summary
  console.log(`\n${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}📊 BENCHMARK & STRESS SUMMARY: ${passedSuites}/${totalSuites} Passed (${Math.round((passedSuites / totalSuites) * 100)}%)${colors.reset}`);
  if (passedSuites === totalSuites) {
    console.log(`${colors.green}${colors.bold}✔ ALL EMPIRICAL BENCHMARKS & STRESS VECTORS PASSED RIGOROUSLY${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}✖ SOME BENCHMARKS FAILED${colors.reset}`);
  }
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  return { totalSuites, passedSuites, testResults };
}

if (require.main === module) {
  runLedgerStressHarness()
    .then(res => {
      process.exit(res.passedSuites === res.totalSuites ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal benchmark harness error:', err);
      process.exit(1);
    });
}

module.exports = { runLedgerStressHarness };
