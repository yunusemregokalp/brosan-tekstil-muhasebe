/**
 * BROSAN TEKSTİL ERP — ADVERSARIAL FINANCIAL LEDGER INTEGRITY TEST HARNESS
 * tests/test-ledger-integrity-adversarial.js
 * 
 * Comprehensive 10-Scenario Master Test Suite verifying Requirement R3 (Phase 4):
 * 1. Genesis block initialization and deterministic hash verification
 * 2. Clean chain sequential insertions and 100% valid verification
 * 3. Adversarial database tampering: modifying transaction amount (15732.92 -> 500.00)
 * 4. Adversarial timestamp tampering: altering createdAt/timestamp of a block
 * 5. Adversarial type tampering: changing transaction type ("MAHSUP" -> "INVOICE")
 * 6. Block deletion / truncation attack: removing an intermediate block breaks chain link
 * 7. Insertion / injection attack: injecting an unauthorized block between valid blocks
 * 8. Live HTTP verification endpoint testing via native HTTP requests with JWT auth
 * 9. Unauthenticated & unauthorized requests rejected with 401 & 403
 * 10. High-volume stress test: chaining 500+ records and verifying chain in <50ms
 * 
 * Execution:
 *   node tests/test-ledger-integrity-adversarial.js
 */

const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const { performance } = require('perf_hooks');
const jwt = require('jsonwebtoken');

// Import real cryptographic ledger integrity engine
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
  verifyChainContinuity,
  verifyChain,
  ZERO_PREV_HASH
} = ledgerIntegrity;

// ANSI Terminal Colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m'
};

let totalTests = 0;
let passedTests = 0;
const failedTests = [];

function reportPass(label) {
  totalTests++;
  passedTests++;
  console.log(`  ${colors.green}✔ PASS${colors.reset} ${label}`);
}

function reportFail(label, err) {
  totalTests++;
  failedTests.push({ label, error: err.message });
  console.error(`  ${colors.red}✖ FAIL${colors.reset} ${label}`);
  console.error(`    ${colors.yellow}${err.message}${colors.reset}`);
}

const TEST_SECRET = 'BrosanTekstil2026EnterpriseSuperSecretSecurityKey!@#$987654321';
const MASTER_KEY = deriveLedgerKey(TEST_SECRET);

// Helper: HTTP request wrapper
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
// MASTER TEST EXECUTION FUNCTION
// ==============================================================================
async function runAllAdversarialTests() {
  console.log(`\n${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}🛡️  BROSAN ERP — ADVERSARIAL FINANCIAL LEDGER INTEGRITY TEST HARNESS${colors.reset}`);
  console.log(`${colors.dim}10-Scenario Cryptographic, Boundary, Mutation, Anti-Tamper & HTTP Test Suite${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  // ----------------------------------------------------------------------------
  // TEST 1: Genesis block initialization and deterministic hash verification
  // ----------------------------------------------------------------------------
  try {
    const genesis1 = computeGenesisHash(MASTER_KEY);
    const genesis2 = computeGenesisHash(MASTER_KEY);
    assert.strictEqual(typeof genesis1, 'string');
    assert.strictEqual(genesis1.length, 64);
    assert.match(genesis1, /^[0-9a-f]{64}$/);
    assert.strictEqual(genesis1, genesis2, 'Genesis hash must be deterministic across calls');

    const differentKey = deriveLedgerKey('DifferentKeyForCollisionTest');
    const genesisOther = computeGenesisHash(differentKey);
    assert.notStrictEqual(genesis1, genesisOther, 'Genesis hash must change when master key changes');

    const genesisBlock = createGenesisBlock(MASTER_KEY);
    assert.strictEqual(genesisBlock.sequence, 0);
    assert.strictEqual(genesisBlock.recordId, 'GENESIS');
    assert.strictEqual(genesisBlock.prevHash, ZERO_PREV_HASH);
    assert.strictEqual(genesisBlock.entryHash, genesis1);
    reportPass('Test 1: Genesis block initialization and deterministic hash verification');
  } catch (err) {
    reportFail('Test 1: Genesis block initialization and deterministic hash verification', err);
  }

  // ----------------------------------------------------------------------------
  // TEST 2: Clean chain sequential insertions and 100% valid verification
  // ----------------------------------------------------------------------------
  let cleanChain = [];
  try {
    cleanChain = [createGenesisBlock(MASTER_KEY)];
    const sampleRecords = [
      { recordId: 'tx-417-6289477-tl', amount: 15732.92, type: 'BANK_TRANSFER_IN', timestamp: '2026-10-09T08:00:00.000Z' },
      { recordId: 'tx-417-9034578-gbp', amount: 23759.07, type: 'BANK_TRANSFER_IN', timestamp: '2026-10-09T08:15:00.000Z' },
      { recordId: 'tx-ben-ellis-rec', amount: 22414.22, type: 'INVOICE', timestamp: '2026-10-09T08:30:00.000Z' },
      { recordId: 'tx-faruk-aytin-mahsup', amount: -10335.35, type: 'MAHSUP', timestamp: '2026-10-09T09:00:00.000Z' },
      { recordId: 'tx-br02026000000024', amount: 7461.45, type: 'SALES_INVOICE', timestamp: '2026-10-09T09:15:00.000Z' },
      { recordId: 'tx-nsa-70-fason', amount: 2984.71, type: 'PURCHASE_INVOICE', timestamp: '2026-10-09T09:30:00.000Z' },
      { recordId: 'tx-kdv-odeme', amount: 1230.49, type: 'TAX_PAYMENT', timestamp: '2026-10-09T09:45:00.000Z' }
    ];

    for (const rec of sampleRecords) {
      appendBlock(cleanChain, rec, MASTER_KEY);
    }

    const verification = verifyChain(cleanChain, MASTER_KEY);
    assert.strictEqual(verification.success, true);
    assert.strictEqual(verification.isValid, true);
    assert.strictEqual(verification.totalEntries, 8);
    assert.strictEqual(verification.genesisHash, cleanChain[0].entryHash);
    assert.strictEqual(verification.headHash, cleanChain[cleanChain.length - 1].entryHash);
    reportPass('Test 2: Clean chain sequential insertions and 100% valid verification');
  } catch (err) {
    reportFail('Test 2: Clean chain sequential insertions and 100% valid verification', err);
  }

  // ----------------------------------------------------------------------------
  // TEST 3: Adversarial database tampering: modifying an intermediate transaction amount
  // ----------------------------------------------------------------------------
  try {
    const tampered = JSON.parse(JSON.stringify(cleanChain));
    // Rogue update: change transaction 1 amount from 15732.92 to 500.00
    const targetIdx = 1;
    tampered[targetIdx]._original = { amount: tampered[targetIdx].amount };
    tampered[targetIdx].amount = '500.00';

    const result = verifyChain(tampered, MASTER_KEY);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.corruptedIndex, 1);
    assert.strictEqual(result.corruptedRecordId, 'tx-417-6289477-tl');
    assert.strictEqual(result.error, 'LEDGER_TAMPER_DETECTED');
    assert.strictEqual(result.tamperPoint.field, 'amount');
    assert.strictEqual(result.tamperPoint.expected, '15732.92');
    assert.strictEqual(result.tamperPoint.actual, '500.00');
    reportPass('Test 3: Adversarial database tampering: modifying transaction amount (15732.92 -> 500.00)');
  } catch (err) {
    reportFail('Test 3: Adversarial database tampering: modifying transaction amount', err);
  }

  // ----------------------------------------------------------------------------
  // TEST 4: Adversarial timestamp tampering: altering createdAt/timestamp of a block
  // ----------------------------------------------------------------------------
  try {
    const tampered = JSON.parse(JSON.stringify(cleanChain));
    const targetIdx = 4; // tx-faruk-aytin-mahsup
    tampered[targetIdx]._original = { timestamp: tampered[targetIdx].timestamp };
    tampered[targetIdx].timestamp = '2026-10-09T09:00:01.000Z'; // altered by 1 second

    const result = verifyChain(tampered, MASTER_KEY);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.corruptedIndex, 4);
    assert.strictEqual(result.corruptedRecordId, 'tx-faruk-aytin-mahsup');
    assert.strictEqual(result.error, 'LEDGER_TAMPER_DETECTED');
    assert.strictEqual(result.tamperPoint.field, 'timestamp');
    reportPass('Test 4: Adversarial timestamp tampering: altering createdAt/timestamp of a block');
  } catch (err) {
    reportFail('Test 4: Adversarial timestamp tampering: altering createdAt/timestamp of a block', err);
  }

  // ----------------------------------------------------------------------------
  // TEST 5: Adversarial type tampering: changing transaction type ("MAHSUP" -> "INVOICE")
  // ----------------------------------------------------------------------------
  try {
    const tampered = JSON.parse(JSON.stringify(cleanChain));
    const targetIdx = 4; // 'MAHSUP'
    tampered[targetIdx]._original = { type: tampered[targetIdx].type };
    tampered[targetIdx].type = 'INVOICE';

    const result = verifyChain(tampered, MASTER_KEY);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.corruptedIndex, 4);
    assert.strictEqual(result.corruptedRecordId, 'tx-faruk-aytin-mahsup');
    assert.strictEqual(result.error, 'LEDGER_TAMPER_DETECTED');
    assert.strictEqual(result.tamperPoint.field, 'type');
    assert.strictEqual(result.tamperPoint.expected, 'MAHSUP');
    assert.strictEqual(result.tamperPoint.actual, 'INVOICE');
    reportPass('Test 5: Adversarial type tampering: changing transaction type ("MAHSUP" -> "INVOICE")');
  } catch (err) {
    reportFail('Test 5: Adversarial type tampering: changing transaction type', err);
  }

  // ----------------------------------------------------------------------------
  // TEST 6: Block deletion / truncation attack: removing an intermediate block
  // ----------------------------------------------------------------------------
  try {
    const tampered = JSON.parse(JSON.stringify(cleanChain));
    // Remove block at index 3 (tx-ben-ellis-rec)
    tampered.splice(3, 1);

    const result = verifyChain(tampered, MASTER_KEY);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.corruptedIndex, 3);
    assert.strictEqual(result.error, 'LEDGER_TAMPER_DETECTED');
    assert.strictEqual(result.tamperPoint.field, 'prevHash');
    reportPass('Test 6: Block deletion / truncation attack: removing an intermediate block breaks chain link');
  } catch (err) {
    reportFail('Test 6: Block deletion / truncation attack', err);
  }

  // ----------------------------------------------------------------------------
  // TEST 7: Insertion / injection attack: injecting an unauthorized block
  // ----------------------------------------------------------------------------
  try {
    const tampered = JSON.parse(JSON.stringify(cleanChain));
    // Inject rogue block between index 2 and 3
    const injected = {
      sequence: 3,
      index: 3,
      recordId: 'tx-rogue-injection',
      prevHash: tampered[2].entryHash,
      entryHash: computeEntryHash(tampered[2].entryHash, 'tx-rogue-injection', '99999.00', 'FRAUD', '2026-10-09T08:25:00.000Z', MASTER_KEY),
      amount: '99999.00',
      type: 'FRAUD',
      timestamp: '2026-10-09T08:25:00.000Z'
    };
    tampered.splice(3, 0, injected);

    const result = verifyChain(tampered, MASTER_KEY);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.isValid, false);
    // Downstream block at index 4 now points to block 2 instead of injected block 3
    assert.strictEqual(result.corruptedIndex, 4);
    assert.strictEqual(result.error, 'LEDGER_TAMPER_DETECTED');
    assert.strictEqual(result.tamperPoint.field, 'prevHash');
    reportPass('Test 7: Insertion / injection attack: injecting unauthorized block between valid blocks');
  } catch (err) {
    reportFail('Test 7: Insertion / injection attack', err);
  }

  // ----------------------------------------------------------------------------
  // TEST 8: Live HTTP verification endpoint testing via native HTTP requests with JWT auth
  // ----------------------------------------------------------------------------
  let server = null;
  try {
    const authSecret = TEST_SECRET;

    const testApp = express();
    testApp.use(express.json());

    // URL rewrite simulation
    testApp.use((req, res, next) => {
      if (req.url.startsWith('/muhasebe/api')) {
        req.url = req.url.replace(/^\/muhasebe\/api/, '/api');
      }
      next();
    });

    let currentServerChain = JSON.parse(JSON.stringify(cleanChain));

    // Simulated auth middleware
    function mockAuthMiddleware(req, res, next) {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Yetkisiz erişim.', code: 'UNAUTHORIZED' });
      }
      const token = header.substring(7).trim();
      try {
        const decoded = jwt.verify(token, authSecret);
        req.user = decoded;
        next();
      } catch (_) {
        return res.status(401).json({ success: false, error: 'Geçersiz token.', code: 'UNAUTHORIZED' });
      }
    }

    function mockRoleMiddleware(req, res, next) {
      if (!req.user || !['ADMIN', 'AUDITOR'].includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'Yetkisiz rol.', code: 'FORBIDDEN_AUDIT_ACCESS' });
      }
      next();
    }

    testApp.get(['/api/audit/verify-integrity', '/muhasebe/api/audit/verify-integrity'], mockAuthMiddleware, mockRoleMiddleware, (req, res) => {
      const result = verifyChain(currentServerChain, MASTER_KEY);
      if (result.isValid) {
        return res.status(200).json({
          success: true,
          isValid: true,
          totalEntries: result.totalEntries,
          genesisHash: result.genesisHash,
          headHash: result.headHash,
          verifiedAt: result.verifiedAt
        });
      }
      return res.status(409).json({
        success: false,
        isValid: false,
        corruptedIndex: result.corruptedIndex,
        corruptedRecordId: result.corruptedRecordId,
        expectedHash: result.expectedHash,
        actualHash: result.actualHash,
        tamperPoint: result.tamperPoint,
        error: 'LEDGER_TAMPER_DETECTED'
      });
    });

    server = http.createServer(testApp);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const port = server.address().port;

    const adminToken = jwt.sign({ id: 'admin-1', username: 'admin', role: 'ADMIN' }, authSecret);

    // Call primary route
    const resPrimary = await sendHttpRequest({
      port,
      path: '/api/audit/verify-integrity',
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resPrimary.status, 200);
    assert.strictEqual(resPrimary.json.success, true);
    assert.strictEqual(resPrimary.json.isValid, true);
    assert.strictEqual(resPrimary.json.totalEntries, 8);

    // Call alias route (/muhasebe/api/audit/verify-integrity)
    const resAlias = await sendHttpRequest({
      port,
      path: '/muhasebe/api/audit/verify-integrity',
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resAlias.status, 200);
    assert.strictEqual(resAlias.json.success, true);

    // Tamper the server's chain and verify 409 Conflict
    currentServerChain[1]._original = { amount: currentServerChain[1].amount };
    currentServerChain[1].amount = '999.00';

    const resTampered = await sendHttpRequest({
      port,
      path: '/api/audit/verify-integrity',
      headers: { authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resTampered.status, 409);
    assert.strictEqual(resTampered.json.success, false);
    assert.strictEqual(resTampered.json.isValid, false);
    assert.strictEqual(resTampered.json.error, 'LEDGER_TAMPER_DETECTED');
    assert.strictEqual(resTampered.json.corruptedIndex, 1);
    assert.strictEqual(resTampered.json.tamperPoint.field, 'amount');

    // Verify mounting in production server/index.js app
    const prodApp = require('../server/index');
    assert.ok(prodApp.ledgerIntegrity, 'prodApp.ledgerIntegrity must be attached to express app');
    assert.strictEqual(typeof prodApp.ledgerIntegrity.verifyChainContinuity, 'function');

    const prodServer = await new Promise(r => {
      const s = prodApp.listen(0, '127.0.0.1', () => r(s));
    });
    try {
      const prodPort = prodServer.address().port;
      const auth = require('../server/auth');
      const prodAdminToken = auth.generateToken(
        { id: 'local-admin-id', username: 'admin', role: 'ADMIN' },
        { is2FAVerified: true }
      );

      const resProd = await sendHttpRequest({
        port: prodPort,
        path: '/api/audit/verify-integrity',
        headers: { authorization: `Bearer ${prodAdminToken}` }
      });
      assert.strictEqual(resProd.status, 200, 'GET /api/audit/verify-integrity on production app must return 200 OK');
      assert.strictEqual(resProd.json.success, true);
      assert.strictEqual(resProd.json.isValid, true);

      const resProdAlias = await sendHttpRequest({
        port: prodPort,
        path: '/muhasebe/api/audit/verify-integrity',
        headers: { authorization: `Bearer ${prodAdminToken}` }
      });
      assert.strictEqual(resProdAlias.status, 200, 'GET /muhasebe/api/audit/verify-integrity on production app must return 200 OK');
      assert.strictEqual(resProdAlias.json.success, true);
      assert.strictEqual(resProdAlias.json.isValid, true);
    } finally {
      prodServer.close();
    }

    reportPass('Test 8: Live HTTP verification endpoint testing via native HTTP requests with JWT auth (including server/index.js)');
  } catch (err) {
    reportFail('Test 8: Live HTTP verification endpoint testing via native HTTP requests with JWT auth', err);
  } finally {
    if (server) server.close();
  }

  // ----------------------------------------------------------------------------
  // TEST 9: Unauthenticated & unauthorized requests rejected with 401 & 403
  // ----------------------------------------------------------------------------
  let server9 = null;
  try {
    const authSecret = TEST_SECRET;

    const testApp9 = express();
    testApp9.use((req, res, next) => {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Yetkisiz erişim.', code: 'UNAUTHORIZED' });
      }
      try {
        const token = header.substring(7).trim();
        req.user = jwt.verify(token, authSecret);
        if (!['ADMIN', 'AUDITOR'].includes(req.user.role)) {
          return res.status(403).json({ success: false, error: 'Yetkisiz rol.', code: 'FORBIDDEN_AUDIT_ACCESS' });
        }
        next();
      } catch (_) {
        return res.status(401).json({ success: false, error: 'Geçersiz token.', code: 'UNAUTHORIZED' });
      }
    });

    testApp9.get('/api/audit/verify-integrity', (req, res) => res.json({ success: true }));

    server9 = http.createServer(testApp9);
    await new Promise(r => server9.listen(0, '127.0.0.1', r));
    const port = server9.address().port;

    // 9a. No Auth header -> 401
    const resNoAuth = await sendHttpRequest({ port, path: '/api/audit/verify-integrity' });
    assert.strictEqual(resNoAuth.status, 401);
    assert.strictEqual(resNoAuth.json.code, 'UNAUTHORIZED');

    // 9b. Invalid token -> 401
    const resInvalid = await sendHttpRequest({
      port,
      path: '/api/audit/verify-integrity',
      headers: { authorization: 'Bearer forged.invalid.token' }
    });
    assert.strictEqual(resInvalid.status, 401);

    // 9c. Non-admin role (e.g. USER) -> 403
    const userToken = jwt.sign({ id: 'user-1', role: 'USER' }, authSecret);
    const resUser = await sendHttpRequest({
      port,
      path: '/api/audit/verify-integrity',
      headers: { authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(resUser.status, 403);
    assert.strictEqual(resUser.json.code, 'FORBIDDEN_AUDIT_ACCESS');

    reportPass('Test 9: Unauthenticated & unauthorized requests rejected with 401 & 403');
  } catch (err) {
    reportFail('Test 9: Unauthenticated request rejection', err);
  } finally {
    if (server9) server9.close();
  }

  // ----------------------------------------------------------------------------
  // TEST 10: High-volume stress test: chaining 500+ records and verifying chain in <50ms
  // ----------------------------------------------------------------------------
  try {
    const stressChain = [createGenesisBlock(MASTER_KEY)];
    const STRESS_COUNT = 500;

    for (let i = 1; i <= STRESS_COUNT; i++) {
      const rec = {
        recordId: `stress-tx-${i}`,
        amount: (i * 12.34).toFixed(2),
        type: i % 2 === 0 ? 'BANK_TRANSFER_IN' : 'MAHSUP',
        timestamp: new Date(1760000000000 + i * 1000).toISOString()
      };
      appendBlock(stressChain, rec, MASTER_KEY);
    }

    assert.strictEqual(stressChain.length, STRESS_COUNT + 1);

    // Benchmark verification
    const t0 = performance.now();
    const verification = verifyChain(stressChain, MASTER_KEY);
    const t1 = performance.now();
    const elapsedMs = t1 - t0;

    assert.strictEqual(verification.isValid, true);
    assert.strictEqual(verification.totalEntries, STRESS_COUNT + 1);
    assert.ok(elapsedMs < 50.0, `Verification of 501 blocks took ${elapsedMs.toFixed(2)}ms, exceeding 50ms threshold`);

    const opsPerSec = Math.round(((STRESS_COUNT + 1) / elapsedMs) * 1000);
    reportPass(`Test 10: High-volume stress test (501 records verified in ${elapsedMs.toFixed(2)}ms ~ ${opsPerSec} ops/sec < 50ms)`);
  } catch (err) {
    reportFail('Test 10: High-volume stress test', err);
  }

  // ----------------------------------------------------------------------------
  // SUMMARY REPORT
  // ----------------------------------------------------------------------------
  console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`📊 ADVERSARIAL TEST SUMMARY: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  if (failedTests.length === 0) {
    console.log(`${colors.green}${colors.bold}✔ ALL 10 ADVERSARIAL INTEGRITY SCENARIOS PASSED WITH 100% SUCCESS${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}✖ ${failedTests.length} TEST(S) FAILED:${colors.reset}`);
    for (const f of failedTests) {
      console.log(`  - ${f.label}: ${f.error}`);
    }
  }
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  if (failedTests.length > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAllAdversarialTests().catch(err => {
    console.error('Fatal Test Runner Error:', err);
    process.exit(1);
  });
}

module.exports = {
  runAllAdversarialTests,
  computeGenesisHash,
  computeEntryHash,
  verifyChain,
  appendBlock,
  createGenesisBlock,
  timingSafeHashEqual
};
