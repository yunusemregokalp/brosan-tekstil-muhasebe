/**
 * BROSAN TEKSTİL ERP — PHASE 9 SOVEREIGN ZENITH CITADEL TEST SUITE
 *
 * Comprehensive End-to-End Verification of:
 * 1. Polymorphic Decoy Routes & Anti-Reconnaissance Tarpit Engine (server/polymorphicTraps.js)
 * 2. Cryptographic Merkle State Snapshot & Tamper-Proof Audit Vault (server/merkleVault.js)
 * 3. Autonomous Adversarial Chaos & Fuzzing Immune Sentinel (server/fuzzingSentinel.js)
 * 4. Live Express Server Integration & Tri-Fold Verification (server/index.js)
 */

process.env.CITADEL_FAST_TEST = '1';

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const {
  polymorphicTrapsGuard,
  isDecoyRoute,
  isDecoyTarget,
  matchDecoyRoute,
  calculateTarpitDelay,
  normalizePath,
  terminateSession,
  DECOY_TARGETS,
  resetForTesting: resetTrapsTesting
} = require('../server/polymorphicTraps');

const {
  MerkleAuditVault,
  merkleVault,
  computeMerkleRoot,
  generateLeafHash,
  verifyMerkleProof,
  generateMerkleProof,
  normalizeAmount,
  deriveMerkleSealKey,
  EMPTY_MERKLE_ROOT
} = require('../server/merkleVault');

const {
  FuzzingSentinel,
  fuzzingSentinel,
  generateFuzzVectors,
  simulatePayloadDefense,
  DynamicRuleRegistry,
  dynamicImmunityGuard,
  createDynamicImmunityGuard
} = require('../server/fuzzingSentinel');

const auth = require('../server/auth');
const { quarantineEngine } = require('../server/quarantine');
const { lockdownManager } = require('../server/lockdown');

const QUARANTINE_FILE = path.resolve(__dirname, '..', 'data', 'quarantined_ips.json');
const LOCKDOWN_STATE_FILE = path.resolve(__dirname, '..', 'data', 'lockdown_state.json');
const TEST_IP = '198.51.100.77';

function cleanupTestFixtures() {
  try {
    const testIps = [
      TEST_IP,
      '198.51.100.99',
      '198.51.100.88',
      '198.51.100.44',
      '198.51.100.101',
      '198.51.100.102',
      '198.51.100.103',
      '198.51.100.104',
      '198.51.100.111',
      '198.51.100.112',
      '198.51.100.113',
      '198.51.100.114',
      '198.51.100.115',
      '198.51.100.116',
      '198.51.100.120',
      '198.51.100.125',
      '127.0.0.1'
    ];
    for (const ip of testIps) {
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
    if (fs.existsSync(QUARANTINE_FILE)) {
      try {
        const raw = fs.readFileSync(QUARANTINE_FILE, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const filtered = list.filter((item) => {
            const ip = item.ip || item;
            return !testIps.includes(ip);
          });
          fs.writeFileSync(QUARANTINE_FILE, JSON.stringify(filtered, null, 2), 'utf8');
        }
      } catch (_) {}
    }
    if (lockdownManager && typeof lockdownManager.reset === 'function') {
      lockdownManager.reset();
    }
    if (fs.existsSync(LOCKDOWN_STATE_FILE)) {
      try {
        const raw = fs.readFileSync(LOCKDOWN_STATE_FILE, 'utf8');
        const state = JSON.parse(raw);
        if (state.isLocked) {
          state.isLocked = false;
          state.lockedAt = null;
          state.lockedBy = null;
          state.reason = null;
          state.tokenRevocationEpoch = 0;
          state.recoverySalt = null;
          state.recoveryHash = null;
          fs.writeFileSync(LOCKDOWN_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
        }
      } catch (_) {}
    }
    if (typeof resetTrapsTesting === 'function') {
      resetTrapsTesting();
    }
  } catch (_) {}
}

process.on('exit', () => {
  cleanupTestFixtures();
});

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

function pass(msg) {
  console.log(`  ${colors.green}✔ PASS${colors.reset} ${msg}`);
}

function fail(msg, err) {
  console.error(`  ${colors.red}✖ FAIL${colors.reset} ${msg}:`, err ? (err.message || err) : '');
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOpts = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOpts, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
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

function makeRawRequest(port, rawPath, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOpts = {
      hostname: '127.0.0.1',
      port,
      path: rawPath, // Raw verbatim path sent over the wire without WHATWG URL normalization
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOpts, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
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

async function runPhase9CitadelTests() {
  cleanupTestFixtures();
  try {
    console.log(`\n${colors.bold}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}🏰 BROSAN TEKSTİL ERP — PHASE 9 SOVEREIGN ZENITH CITADEL TEST SUITE${colors.reset}`);
    console.log(`Testing Polymorphic Traps, Merkle State Vault, Fuzzing Immunity & Express Integration...`);
    console.log(`${colors.bold}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

    let passedAssertions = 0;
    let totalAssertions = 0;

    function record(fn, description) {
      totalAssertions++;
      try {
        fn();
        pass(description);
        passedAssertions++;
      } catch (err) {
        fail(description, err);
        throw err;
      }
    }

    async function recordAsync(fn, description) {
      totalAssertions++;
      try {
        await fn();
        pass(description);
        passedAssertions++;
      } catch (err) {
        fail(description, err);
        throw err;
      }
    }

    // ==============================================================================
    // PART 1: POLYMORPHIC DECOY ROUTES & ANTI-RECONNAISSANCE TARPIT ENGINE
    // ==============================================================================
    console.log(`\n${colors.bold}[PART 1] Polymorphic Decoy Routes & Anti-Reconnaissance Tarpit Engine${colors.reset}`);

    // Assertion 1: All 7 target decoy routes identified
    record(() => {
      assert.strictEqual(DECOY_TARGETS.length, 7, 'DECOY_TARGETS must contain exactly 7 routes');
      const expectedTargets = [
        '/wp-login.php',
        '/.well-known/security.txt',
        '/actuator/health',
        '/api/v1/swagger.json',
        '/solr/admin',
        '/phpmyadmin',
        '/api/v2/debug'
      ];
      const targetRoutes = DECOY_TARGETS.map((t) => (typeof t === 'string' ? t : t.target));
      for (const route of expectedTargets) {
        assert.ok(targetRoutes.includes(route), `Missing expected decoy target: ${route}`);
        const check = isDecoyRoute(route);
        assert.strictEqual(check.isDecoy, true, `Route ${route} must be flagged as decoy`);
        assert.strictEqual(isDecoyTarget(route), true, `Route ${route} must be flagged by isDecoyTarget`);
      }
    }, '1.1 All 7 target reconnaissance decoy routes correctly recognized by decoy detector');

    // Assertion 2: Path normalization with /muhasebe subpath, queries, and percent encoding
    record(() => {
      const variants = [
        '/muhasebe/wp-login.php?action=login',
        '/muhasebe/phpmyadmin/index.php#main',
        '/%70%68%70%6d%79%61%64%6d%69%6e',
        '/muhasebe/api/v1/swagger.json?format=json',
        '///muhasebe//actuator/health'
      ];
      for (const variant of variants) {
        const match = matchDecoyRoute(normalizePath(variant));
        assert.ok(match, `Decoy variant must match: ${variant}`);
      }
    }, '1.2 Normalization pipeline handles /muhasebe prefix, query arguments, hashes, and percent encoding');

    // Assertion 1.2b: Dot-segment normalization neutralizes path evasion attempts
    record(() => {
      const dotSegmentEvasionVectors = [
        ['/./wp-login.php', '/wp-login.php'],
        ['/%2e/wp-login.php', '/wp-login.php'],
        ['/foo/../wp-login.php', '/wp-login.php'],
        ['/muhasebe/./wp-login.php', '/wp-login.php'],
        ['/muhasebe/foo/../wp-login.php', '/wp-login.php'],
        ['/muhasebe/../wp-login.php', '/wp-login.php'],
        ['/./actuator/health', '/actuator/health'],
        ['/muhasebe/./phpmyadmin', '/phpmyadmin'],
        ['/muhasebe/%2e/api/v1/swagger.json', '/api/v1/swagger.json'],
        ['/bar/baz/../../solr/admin', '/solr/admin'],
        ['/.well-known/./security.txt', '/.well-known/security.txt'],
        ['/api/v2/./debug', '/api/v2/debug']
      ];

      for (const [evasion, expectedCanonical] of dotSegmentEvasionVectors) {
        const normalized = normalizePath(evasion);
        assert.strictEqual(
          normalized,
          expectedCanonical,
          `normalizePath('${evasion}') must resolve to '${expectedCanonical}' (got '${normalized}')`
        );

        const match = matchDecoyRoute(normalized);
        assert.strictEqual(
          match,
          expectedCanonical,
          `matchDecoyRoute('${normalized}') must match '${expectedCanonical}' (got '${match}')`
        );

        const decoyCheck = isDecoyRoute(evasion);
        assert.strictEqual(
          decoyCheck.isDecoy,
          true,
          `isDecoyRoute('${evasion}') must evaluate to isDecoy: true`
        );
      }
    }, '1.2b Dot-segment normalization eliminates path traversal and dot-prefixed evasion across all 7 decoy routes');

    // Assertion 3: Zero false-positive guard for legitimate ERP routes (including dot-segment permutations)
    record(() => {
      const legitimateRoutes = [
        '/api/health',
        '/muhasebe/api/health',
        '/api/./health',
        '/muhasebe/./api/health',
        '/api/auth/login',
        '/muhasebe/api/auth/login',
        '/api/accounts',
        '/muhasebe/api/accounts',
        '/muhasebe/./api/accounts',
        '/api/./accounts',
        '/muhasebe/foo/../api/accounts',
        '/api/contacts',
        '/muhasebe/api/invoices',
        '/api/journal-entries',
        '/muhasebe/api/transactions',
        '/api/checks',
        '/muhasebe/api/employees'
      ];
      for (const route of legitimateRoutes) {
        const match = matchDecoyRoute(normalizePath(route));
        assert.strictEqual(match, null, `Legitimate route must not match decoy: ${route}`);
        const decoyCheck = isDecoyRoute(route);
        assert.strictEqual(decoyCheck.isDecoy, false, `Legitimate route must be isDecoy=false: ${route}`);
      }
    }, '1.3 Zero false-positive guard strictly passes through all legitimate ERP accounting endpoints');

    // Assertion 4: Dynamic tarpit delay calculation in fast-test and production ranges
    record(() => {
      const fastDelay = calculateTarpitDelay({ fastTest: true });
      assert.ok(fastDelay >= 10 && fastDelay <= 25, `Fast delay ${fastDelay}ms must be within 10-25ms`);

      delete process.env.CITADEL_FAST_TEST;
      const prodDelay = calculateTarpitDelay();
      process.env.CITADEL_FAST_TEST = '1';
      assert.ok(prodDelay >= 1500 && prodDelay <= 3500, `Production delay ${prodDelay}ms must be within 1500-3500ms`);
    }, '1.4 Dynamic tarpit calculation enforces 10-25ms fast-test mode and 1500-3500ms production jitter');

    // Assertion 5: polymorphicTrapsGuard middleware execution on decoy probe
    await recordAsync(async () => {
      const req = {
        url: '/wp-login.php',
        path: '/wp-login.php',
        method: 'GET',
        headers: { 'x-forwarded-for': TEST_IP },
        socket: { remoteAddress: TEST_IP },
        once: (event, cb) => {}
      };

      let statusCalled = null;
      let jsonPayload = null;
      const headersSet = {};

      const res = {
        setHeader: (k, v) => { headersSet[k.toLowerCase()] = v; },
        status: function(s) { statusCalled = s; return this; },
        json: function(data) { jsonPayload = data; return this; }
      };

      let nextCalled = false;
      const keepAlive = setTimeout(() => {}, 2000);
      await new Promise((resolve) => {
        res.json = function(data) {
          jsonPayload = data;
          clearTimeout(keepAlive);
          resolve();
          return this;
        };
        polymorphicTrapsGuard(req, res, () => {
          nextCalled = true;
          clearTimeout(keepAlive);
          resolve();
        });
      });

      assert.strictEqual(nextCalled, false, 'Middleware must not call next() on decoy probe');
      assert.strictEqual(statusCalled, 403, 'Middleware must respond with HTTP 403');
      assert.strictEqual(jsonPayload.code, 'DECOY_TRAP_TRIGGERED');
      assert.strictEqual(headersSet['x-citadel-trap'], 'ACTIVE');
    }, '1.5 polymorphicTrapsGuard middleware intercepts decoy probes returning HTTP 403 and X-Citadel-Trap');

    // Assertion 1.5b: Middleware intercepts dot-segment evasion variants with HTTP 403
    await recordAsync(async () => {
      const evasionPaths = [
        '/./wp-login.php',
        '/%2e/wp-login.php',
        '/foo/../wp-login.php',
        '/muhasebe/./wp-login.php'
      ];

      for (const evPath of evasionPaths) {
        const dummyIp = '198.51.100.44';
        const req = {
          url: evPath,
          path: evPath,
          method: 'GET',
          headers: { 'x-forwarded-for': dummyIp },
          socket: { remoteAddress: dummyIp },
          once: () => {},
          removeListener: () => {}
        };

        let statusCalled = null;
        let jsonPayload = null;
        const headersSet = {};

        const res = {
          setHeader: (k, v) => { headersSet[k.toLowerCase()] = v; },
          status: function(s) { statusCalled = s; return this; },
          json: function(data) { jsonPayload = data; return this; },
          end: function() { return this; }
        };

        let nextCalled = false;
        const keepAlive = setTimeout(() => {}, 2000);
        await new Promise((resolve) => {
          res.json = function(data) {
            jsonPayload = data;
            clearTimeout(keepAlive);
            resolve();
            return this;
          };
          polymorphicTrapsGuard(req, res, () => {
            nextCalled = true;
            clearTimeout(keepAlive);
            resolve();
          });
        });

        assert.strictEqual(nextCalled, false, `polymorphicTrapsGuard must not call next() for ${evPath}`);
        assert.strictEqual(statusCalled, 403, `polymorphicTrapsGuard must return HTTP 403 for ${evPath}`);
        assert.strictEqual(jsonPayload.code, 'DECOY_TRAP_TRIGGERED', `Response code must be DECOY_TRAP_TRIGGERED for ${evPath}`);
        assert.strictEqual(headersSet['x-citadel-trap'], 'ACTIVE', `X-Citadel-Trap header must be ACTIVE for ${evPath}`);
        assert.strictEqual(headersSet['x-decoy-trap'], 'TRIGGERED', `X-Decoy-Trap header must be TRIGGERED for ${evPath}`);

        // Cleanup quarantine for dummy IP
        if (quarantineEngine) quarantineEngine.liftQuarantine(dummyIp);
      }
    }, '1.5b polymorphicTrapsGuard middleware intercepts dot-segment evasion probes returning HTTP 403 DECOY_TRAP_TRIGGERED');

    // Assertion 6: 48-hour IP quarantine enforcement
    record(() => {
      const isQ = quarantineEngine.isQuarantined(TEST_IP);
      assert.ok(isQ && isQ.quarantined, `Offending IP ${TEST_IP} must be quarantined`);
      assert.strictEqual(isQ.reason, 'DECOY_TRAP_TRIGGERED');
      assert.ok(isQ.remainingSec > 170000, 'Quarantine TTL must reflect 48 hours (~172,800s)');
    }, '1.6 Offending reconnaissance IP is immediately enrolled in 48-hour quarantine in quarantineEngine');

    // Assertion 7: Bearer token and session revocation upon decoy hit
    record(() => {
      const dummyUser = { id: 'recon-attacker', username: 'probe-bot', role: 'ADMIN' };
      const token = auth.generateToken(dummyUser);
      assert.strictEqual(auth.isTokenRevoked(token), false, 'Token must initially be valid');

      const reqWithToken = {
        url: '/phpmyadmin',
        path: '/phpmyadmin',
        method: 'GET',
        headers: {
          'x-forwarded-for': '198.51.100.88',
          'authorization': `Bearer ${token}`
        },
        socket: { remoteAddress: '198.51.100.88' },
        once: (event, cb) => {}
      };

      terminateSession(reqWithToken);
      assert.strictEqual(auth.isTokenRevoked(token), true, 'Attacker bearer token must be revoked immediately');
    }, '1.7 Presenting credentials or bearer token on decoy route triggers instantaneous session revocation');

    // ==============================================================================
    // PART 2: CRYPTOGRAPHIC MERKLE STATE SNAPSHOT & AUDIT VAULT
    // ==============================================================================
    console.log(`\n${colors.bold}[PART 2] Cryptographic Merkle State Snapshot & Tamper-Proof Audit Vault${colors.reset}`);

    // Assertion 8: Deterministic canonical leaf calculation for all 5 entities
    record(() => {
      const entities = [
        { type: 'Account', data: { id: 'acc-1', code: '100', currency: 'TRY', balance: '1000.50' } },
        { type: 'Contact', data: { id: 'con-1', code: 'FARUK', currency: 'USD', balance: '-10335.35', balanceTrl: '0', balanceUsd: '-10335.35' } },
        { type: 'Invoice', data: { id: 'inv-1', invoiceNo: 'BR202601', type: 'SALES', grandTotal: 5000, taxTotal: 1000, status: 'APPROVED', date: '2026-10-10' } },
        { type: 'JournalEntry', data: { id: 'je-1', entryNo: 'JE-101', documentType: 'MAHSUP', totalDebit: 2500, totalCredit: 2500, date: '2026-10-10' } },
        { type: 'Transaction', data: { id: 'tx-1', accountId: 'acc-1', type: 'INCOME', amount: 500, date: '2026-10-10' } }
      ];

      for (const ent of entities) {
        const leafHash1 = generateLeafHash(ent.type, ent.data);
        const leafHash2 = generateLeafHash(ent.type, ent.data);
        assert.strictEqual(leafHash1.length, 64, 'Leaf hash must be 64 hex characters');
        assert.strictEqual(leafHash1, leafHash2, 'Leaf hash calculation must be deterministic');
      }

      assert.strictEqual(normalizeAmount(10.5), '10.50');
      assert.strictEqual(normalizeAmount('-0'), '0.00');
      assert.strictEqual(normalizeAmount(100), '100.00');
    }, '2.1 Canonical leaf hashing produces deterministic SHA-256 digests across all 5 accounting entities');

    // Assertion 9: Binary Merkle tree reduction and lexicographical ordering
    record(() => {
      const leaves = [
        crypto.createHash('sha256').update('leaf-c').digest('hex'),
        crypto.createHash('sha256').update('leaf-a').digest('hex'),
        crypto.createHash('sha256').update('leaf-b').digest('hex')
      ];

      const root1 = computeMerkleRoot(leaves);
      const root2 = computeMerkleRoot([leaves[2], leaves[0], leaves[1]]); // Permuted input
      assert.strictEqual(root1, root2, 'Merkle root must be invariant to initial input order (lexicographical sort)');
      assert.strictEqual(root1.length, 64, 'Merkle root must be a 64-character SHA-256 hex digest');
      assert.strictEqual(computeMerkleRoot([]), EMPTY_MERKLE_ROOT, 'Empty leaves must yield EMPTY_MERKLE_ROOT');
    }, '2.2 Binary Merkle tree reduction maintains lexicographical invariance and binary symmetry');

    // Assertion 10: Merkle proof generation and cryptographic verification
    record(() => {
      const leaves = [
        crypto.createHash('sha256').update('item-1').digest('hex'),
        crypto.createHash('sha256').update('item-2').digest('hex'),
        crypto.createHash('sha256').update('item-3').digest('hex'),
        crypto.createHash('sha256').update('item-4').digest('hex')
      ];
      const targetLeaf = leaves[1];
      const root = computeMerkleRoot(leaves);

      const proof = generateMerkleProof(targetLeaf, leaves);
      assert.ok(Array.isArray(proof) && proof.length > 0, 'Proof path must be generated');

      const isVerified = verifyMerkleProof(targetLeaf, proof, root);
      assert.strictEqual(isVerified, true, 'Merkle proof must verify successfully for target leaf');

      const fakeLeaf = crypto.createHash('sha256').update('rogue-item').digest('hex');
      const fakeVerified = verifyMerkleProof(fakeLeaf, proof, root);
      assert.strictEqual(fakeVerified, false, 'Merkle proof verification must reject forged leaf');
    }, '2.3 Cryptographic Merkle inclusion proofs accurately prove membership and reject tampering');

    // Assertion 11: HKDF HMAC Ledger Root Seal
    record(() => {
      const testRoot = crypto.createHash('sha256').update('brosan-root-test').digest('hex');
      const vault = new MerkleAuditVault({ vaultDir: path.resolve(__dirname, '..', 'data') });
      const sealKey = deriveMerkleSealKey();
      assert.strictEqual(sealKey.length, 32, 'HKDF derived key must be 32 bytes (256 bits)');

      const hmacSeal = vault.sealMerkleRoot(testRoot);
      assert.ok(hmacSeal && hmacSeal.length === 64, 'Sealed root must be 64-hex-char HMAC');

      const snapshot = {
        snapshotId: 'snap-test',
        timestamp: new Date().toISOString(),
        merkleRoot: testRoot,
        leafCount: 4,
        hmacSeal
      };

      const isValidSeal = vault.verifySnapshotSeal(snapshot);
      assert.strictEqual(isValidSeal, true, 'Valid HMAC seal must verify');

      const tampered = { ...snapshot, merkleRoot: crypto.createHash('sha256').update('tampered').digest('hex') };
      assert.strictEqual(vault.verifySnapshotSeal(tampered), false, 'Tampered snapshot must fail seal check');
    }, '2.4 HKDF-SHA256 derived keys generate tamper-evident HMAC seals over Merkle roots');

    // Assertion 12: Snapshot creation and persistence
    await recordAsync(async () => {
      const mockData = {
        accounts: [{ id: 'a1', code: '100', currency: 'TRY', balance: '500.00' }],
        contacts: [{ id: 'c1', code: 'TEST_CON', currency: 'TRY', balance: '0.00', balanceTrl: '0.00', balanceUsd: '0.00' }],
        invoices: [],
        journalEntries: [],
        transactions: []
      };

      const snap = await merkleVault.takeSnapshot(null, { data: mockData, trigger: 'CITADEL_SUITE_TEST' });
      assert.ok(snap && snap.snapshotId, 'takeSnapshot must return created snapshot');
      assert.ok(snap.merkleRoot && snap.merkleRoot.length === 64, 'Snapshot must have valid 64-char root');
      assert.ok(snap.hmacSeal, 'Snapshot must have HMAC seal');

      const verifyRes = await merkleVault.verifyCurrentState(null, { data: mockData });
      assert.strictEqual(verifyRes.isValid, true, 'Live verification must pass with identical state');
      assert.strictEqual(verifyRes.merkleRoot, snap.merkleRoot);
    }, '2.5 Snapshot generation persists tamper-proof ledger head and enables instant state verification');

    // Assertion 13: Single-byte ledger tampering detection & emergency lockdown trigger
    await recordAsync(async () => {
      const originalData = {
        accounts: [{ id: 'a1', code: '100', currency: 'TRY', balance: '500.00' }],
        contacts: [],
        invoices: [],
        journalEntries: [],
        transactions: []
      };
      await merkleVault.takeSnapshot(null, { data: originalData, trigger: 'PRE_TAMPER_TEST' });

      // Simulate 1-cent tampering: 500.00 -> 500.01
      const tamperedData = {
        accounts: [{ id: 'a1', code: '100', currency: 'TRY', balance: '500.01' }],
        contacts: [],
        invoices: [],
        journalEntries: [],
        transactions: []
      };

      let mismatchEventEmitted = false;
      const listener = () => { mismatchEventEmitted = true; };
      merkleVault.once('MERKLE_ROOT_MISMATCH', listener);

      const tamperResult = await merkleVault.verifyCurrentState(null, { data: tamperedData });

      assert.strictEqual(tamperResult.isValid, false, 'Tampered state must be marked invalid');
      assert.strictEqual(tamperResult.error, 'MERKLE_ROOT_MISMATCH');
      assert.strictEqual(mismatchEventEmitted, true, 'MERKLE_ROOT_MISMATCH event must be emitted');
      assert.strictEqual(lockdownManager.isLocked(), true, 'Emergency panic lockdown must be triggered');

      // Cleanup lockdown state immediately so subsequent tests are not affected
      lockdownManager.reset();
    }, '2.6 Single-byte modification in financial records triggers MERKLE_ROOT_MISMATCH and emergency lockdown');

    // ==============================================================================
    // PART 3: AUTONOMOUS ADVERSARIAL CHAOS & FUZZING IMMUNITY
    // ==============================================================================
    console.log(`\n${colors.bold}[PART 3] Autonomous Adversarial Chaos & Fuzzing Immunity Sentinel${colors.reset}`);

    // Assertion 14: Mutation vector generation across 5 classes
    record(() => {
      const vectors = generateFuzzVectors();
      assert.ok(Array.isArray(vectors) && vectors.length >= 40, `Must generate 40+ vectors (got ${vectors.length})`);

      const classes = new Set(vectors.map((v) => v.vectorClass || v.class));
      const requiredClasses = [
        'UNICODE_HOMOGRAPH',
        'POISON_NULL_BYTE',
        'PROTOTYPE_POLLUTION',
        'BUFFER_REDOS_BOMB',
        'POLYGLOT_SQL_XSS'
      ];
      for (const reqClass of requiredClasses) {
        assert.ok(classes.has(reqClass), `Missing mutation vector class: ${reqClass}`);
      }
    }, '3.1 generateFuzzVectors synthesizes all 5 attack classes with 40+ diverse adversarial mutations');

    // Assertion 15: Zero uncaught crashes SLA
    record(() => {
      const cycleResult = fuzzingSentinel.runAutonomousFuzzingCycle();
      assert.ok(cycleResult.sla, 'Autonomous fuzzing cycle must produce SLA metrics');
      assert.strictEqual(cycleResult.sla.uncaughtCrashes, 0, 'Must have zero uncaught crashes');
      assert.strictEqual(cycleResult.sla.slaPassed, true, 'Zero-crash SLA must be satisfied (100% crash-free)');
      assert.ok(cycleResult.totalVectorsTested >= 40, 'Must test all generated vectors');
    }, '3.2 Autonomous fuzzing cycle verifies 0 uncaught crashes SLA (100% immunity against zero-day crashes)');

    // Assertion 16: DynamicRuleRegistry synthesis & dynamicImmunityGuard
    record(() => {
      const registry = new DynamicRuleRegistry();
      const synthesized = registry.synthesizeRule(/brosan_citadel_exploit_\d+/i, {
        reason: 'Zero-day synthetic exploit test payload',
        targetLocation: 'body'
      });

      const ruleId = synthesized.id || synthesized.ruleId;
      assert.ok(synthesized && ruleId, 'Rule synthesis must return valid rule with ID');
      const activeRules = registry.getActiveDynamicRules();
      assert.ok(activeRules.some((r) => (r.id || r.ruleId) === ruleId), 'Synthesized rule must be active');

      // Test dynamicImmunityGuard with matching payload
      const guard = createDynamicImmunityGuard(registry);
      const req = {
        query: {},
        params: {},
        body: { payload: 'brosan_citadel_exploit_9921' }
      };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        setHeader: () => {},
        status: function(s) { statusCalled = s; return this; },
        json: function(d) { jsonCalled = d; return this; }
      };

      let nextCalled = false;
      guard(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false, 'Guard must block violating payload');
      assert.strictEqual(statusCalled, 403, 'Guard must respond with HTTP 403');
      assert.strictEqual(jsonCalled.code, 'DYNAMIC_IMMUNITY_VIOLATION');
      assert.strictEqual(jsonCalled.ruleId, ruleId);
    }, '3.3 DynamicRuleRegistry synthesizes zero-day rules and dynamicImmunityGuard enforces 403 shield');

    // ==============================================================================
    // PART 4: LIVE EXPRESS SERVER INTEGRATION & END-TO-END PROBES
    // ==============================================================================
    console.log(`\n${colors.bold}[PART 4] Live Express Server Integration & End-to-End Probes${colors.reset}`);

    // Assertion 17: Live Express server decoy route probe returns 403 DECOY_TRAP_TRIGGERED
    await recordAsync(async () => {
      const serverApp = require('../server/index');
      const server = http.createServer(serverApp);

      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      const port = server.address().port;

      try {
        const res = await makeRequest(`http://127.0.0.1:${port}/wp-login.php`, {
          headers: { 'x-forwarded-for': '198.51.100.99' }
        });
        assert.strictEqual(res.statusCode, 403, 'Decoy probe must return HTTP 403');
        const json = JSON.parse(res.body);
        assert.strictEqual(json.code, 'DECOY_TRAP_TRIGGERED', 'Error code must be DECOY_TRAP_TRIGGERED');
        assert.strictEqual(res.headers['x-citadel-trap'], 'ACTIVE', 'X-Citadel-Trap header must be ACTIVE');
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    }, '4.1 Live Express server intercepts decoy probe on ephemeral port with HTTP 403 and X-Citadel-Trap');

    // Assertion 4.1b: Live Express server intercepts raw dot-segment evasion vectors with HTTP 403
    await recordAsync(async () => {
      const serverApp = require('../server/index');
      const server = http.createServer(serverApp);

      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      const port = server.address().port;

      const evasionVectors = [
        { path: '/./wp-login.php', ip: '198.51.100.101', name: 'Raw single-dot prefix' },
        { path: '/%2e/wp-login.php', ip: '198.51.100.102', name: 'Percent-encoded dot prefix' },
        { path: '/foo/../wp-login.php', ip: '198.51.100.103', name: 'Segment backtrack traversal' },
        { path: '/muhasebe/./wp-login.php', ip: '198.51.100.104', name: 'Subpath prefixed dot-segment' }
      ];

      try {
        for (const vec of evasionVectors) {
          const res = await makeRawRequest(port, vec.path, {
            headers: { 'x-forwarded-for': vec.ip }
          });

          assert.strictEqual(
            res.statusCode,
            403,
            `Live server must respond with HTTP 403 for ${vec.name} (${vec.path})`
          );

          let json = {};
          try {
            json = JSON.parse(res.body);
          } catch (_) {
            assert.fail(`Response body for ${vec.path} must be valid JSON: ${res.body}`);
          }

          assert.strictEqual(
            json.code,
            'DECOY_TRAP_TRIGGERED',
            `Error code must be DECOY_TRAP_TRIGGERED for ${vec.path} (got '${json.code}')`
          );
          assert.strictEqual(
            res.headers['x-citadel-trap'],
            'ACTIVE',
            `X-Citadel-Trap header must be ACTIVE for ${vec.path}`
          );
          assert.strictEqual(
            res.headers['x-decoy-trap'],
            'TRIGGERED',
            `X-Decoy-Trap header must be TRIGGERED for ${vec.path}`
          );
          assert.strictEqual(
            json.quarantined,
            true,
            `Response must report quarantined: true for ${vec.path}`
          );

          // Verify IP quarantine in quarantineEngine
          if (quarantineEngine) {
            const qInfo = quarantineEngine.isQuarantined(vec.ip);
            assert.ok(
              qInfo && qInfo.quarantined,
              `Client IP ${vec.ip} must be registered in quarantineEngine for ${vec.path}`
            );
            assert.strictEqual(
              qInfo.reason,
              'DECOY_TRAP_TRIGGERED',
              `Quarantine reason must be DECOY_TRAP_TRIGGERED for ${vec.ip}`
            );
          }
        }
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    }, '4.1b Live Express server intercepts raw dot-segment evasion vectors (/./, /%2e/, /foo/../, /muhasebe/./) with HTTP 403 DECOY_TRAP_TRIGGERED and 48h quarantine');

    // Assertion 18: Live Express server legitimate /api/health and /muhasebe/api/health probes return 200 OK
    await recordAsync(async () => {
      const serverApp = require('../server/index');
      const server = http.createServer(serverApp);

      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      const port = server.address().port;

      try {
        const res1 = await makeRequest(`http://127.0.0.1:${port}/api/health`);
        assert.strictEqual(res1.statusCode, 200, '/api/health must return HTTP 200');
        const json1 = JSON.parse(res1.body);
        assert.ok(json1.status === 'healthy' || json1.status === 'degraded');
        assert.strictEqual(json1.service, 'brosan-tekstil-erp');

        const res2 = await makeRequest(`http://127.0.0.1:${port}/muhasebe/api/health`);
        assert.strictEqual(res2.statusCode, 200, '/muhasebe/api/health must return HTTP 200');
        const json2 = JSON.parse(res2.body);
        assert.ok(json2.status === 'healthy' || json2.status === 'degraded');

        // Legitimate paths with dot-segments (/api/./health and /muhasebe/./api/accounts)
        // Must pass through polymorphic traps cleanly without decoy interference
        const resDotHealth = await makeRawRequest(port, '/api/./health');
        assert.notStrictEqual(resDotHealth.statusCode, 403, '/api/./health must NOT trigger 403 DECOY_TRAP_TRIGGERED');
        assert.strictEqual(resDotHealth.headers['x-citadel-trap'], undefined, '/api/./health must NOT carry X-Citadel-Trap header');

        const resDotAccounts = await makeRawRequest(port, '/muhasebe/./api/accounts');
        assert.notStrictEqual(resDotAccounts.statusCode, 403, '/muhasebe/./api/accounts must NOT trigger 403 DECOY_TRAP_TRIGGERED');
        assert.strictEqual(resDotAccounts.headers['x-citadel-trap'], undefined, '/muhasebe/./api/accounts must NOT carry X-Citadel-Trap header');
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    }, '4.2 Live Express server health probes (/api/health & /muhasebe/api/health) and legitimate dot-segment paths return clean non-decoy responses');

    // ==============================================================================
    // FINAL SUMMARY REPORT
    // ==============================================================================
    console.log(`\n${colors.bold}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`            ${colors.bold}${colors.green}PHASE 9 SOVEREIGN ZENITH CITADEL TEST RESULTS${colors.reset}                  `);
    console.log(`${colors.bold}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(` Total Assertions Tested : ${totalAssertions}`);
    console.log(` Passed Assertions       : ${passedAssertions}`);
    console.log(` Failed Assertions       : ${totalAssertions - passedAssertions}`);
    console.log(` Success Rate            : ${((passedAssertions / totalAssertions) * 100).toFixed(1)}%`);
    console.log(`${colors.bold}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

    console.log(`${colors.green}${colors.bold}🎉 ALL ${totalAssertions} PHASE 9 SOVEREIGN ZENITH CITADEL DEFENSE VECTORS VERIFIED WITH 100% SUCCESS!${colors.reset}\n`);
  } finally {
    cleanupTestFixtures();
  }
}

if (require.main === module) {
  runPhase9CitadelTests().catch((err) => {
    console.error('Test runner fatal error:', err);
    cleanupTestFixtures();
    process.exit(1);
  });
}

module.exports = { runPhase9CitadelTests, cleanupTestFixtures };
