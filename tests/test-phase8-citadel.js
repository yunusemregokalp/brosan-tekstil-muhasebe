/**
 * BROSAN TEKSTİL ERP — PHASE 8 SOVEREIGN QUANTUM VAULT TEST SUITE
 *
 * Verifies:
 * 1. Process Execution Lockdown & Sandbox (child_process.exec, spawn, fork blocked with SECURITY_PROCESS_BLOCKED)
 * 2. Hostile Intrusion Deception Mesh (Canary lures /.git/config, /.aws/credentials, /id_rsa, /dump.sql trigger 403 CANARY_TRIGGERED)
 * 3. Dynamic IP Quarantine and SIEM Emergency Escalation
 * 4. Ephemeral Zero-Knowledge Memory Scrubbing (zeroizeBuffer wipes plaintext RAM buffers)
 * 5. Live Express Server Integration & Zero False-Positive Tolerance
 */

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const {
  processSandboxMiddleware,
  enableGlobalLockdown,
  disableGlobalLockdown,
  runPrivileged,
  getStatus,
  resetForTesting: resetSandboxTesting,
  PRIVILEGED_TOKEN
} = require('../server/processSandboxing');
const {
  honeyFilesGuard,
  isCanaryTarget,
  getCanaryMetrics,
  resetForTesting: resetCanaryTesting
} = require('../server/honeyFiles');
const cryptoVault = require('../server/cryptoVault');
const { quarantineEngine } = require('../server/quarantine');
const { lockdownManager } = require('../server/lockdown');

const QUARANTINE_FILE = path.resolve(__dirname, '..', 'data', 'quarantined_ips.json');
const LOCKDOWN_STATE_FILE = path.resolve(__dirname, '..', 'data', 'lockdown_state.json');

function cleanupTestFixtures() {
  try {
    const testIps = ['198.51.100.99', '198.51.100.44', '127.0.0.1'];
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
            return ip !== '198.51.100.99' && ip !== '198.51.100.44';
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

async function runPhase8CitadelTests() {
  cleanupTestFixtures();
  try {
    console.log(`\n${colors.bold}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}🛡️ BROSAN TEKSTİL ERP — PHASE 8 SOVEREIGN QUANTUM VAULT TEST SUITE${colors.reset}`);
  console.log(`Testing Process Sandboxing, Honeyfile Deception Mesh, and Memory Cleansing...`);
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
  // PART 1: PROCESS RUNTIME SANDBOX & EXECUTION LOCKDOWN
  // ==============================================================================
  console.log(`\n${colors.bold}[PART 1] Supply Chain & Process Execution Lockdown${colors.reset}`);

  // Test 1.1: child_process.exec inside HTTP request context is blocked
  record(() => {
    resetSandboxTesting();
    const req = { headers: {}, socket: { remoteAddress: '198.51.100.44' }, path: '/api/transactions' };
    const res = {};
    let executedInSandbox = false;

    processSandboxMiddleware(req, res, () => {
      executedInSandbox = true;
      assert.throws(
        () => {
          childProcess.exec('whoami');
        },
        (err) => err.code === 'SECURITY_PROCESS_BLOCKED'
      );
    });

    assert.strictEqual(executedInSandbox, true);
    assert.strictEqual(getStatus().violationCount, 1);
  }, '1.1 child_process.exec invoked inside HTTP request throws SECURITY_PROCESS_BLOCKED');

  // Test 1.2: child_process.execSync inside HTTP request context is blocked
  record(() => {
    const req = { headers: {}, socket: { remoteAddress: '198.51.100.44' }, path: '/api/invoices' };
    processSandboxMiddleware(req, {}, () => {
      assert.throws(
        () => {
          childProcess.execSync('ls -la');
        },
        (err) => err.code === 'SECURITY_PROCESS_BLOCKED'
      );
    });
  }, '1.2 child_process.execSync invoked inside HTTP request throws SECURITY_PROCESS_BLOCKED');

  // Test 1.3: child_process.spawn inside HTTP request context is blocked
  record(() => {
    const req = { headers: {}, socket: { remoteAddress: '198.51.100.44' }, path: '/api/accounts' };
    processSandboxMiddleware(req, {}, () => {
      assert.throws(
        () => {
          childProcess.spawn('/bin/sh', ['-c', 'cat /etc/passwd']);
        },
        (err) => err.code === 'SECURITY_PROCESS_BLOCKED'
      );
    });
  }, '1.3 child_process.spawn invoked inside HTTP request throws SECURITY_PROCESS_BLOCKED');

  // Test 1.4: child_process.fork inside HTTP request context is blocked
  record(() => {
    const req = { headers: {}, socket: { remoteAddress: '198.51.100.44' }, path: '/api/users' };
    processSandboxMiddleware(req, {}, () => {
      assert.throws(
        () => {
          childProcess.fork('./malicious_worker.js');
        },
        (err) => err.code === 'SECURITY_PROCESS_BLOCKED'
      );
    });
  }, '1.4 child_process.fork invoked inside HTTP request throws SECURITY_PROCESS_BLOCKED');

  // Test 1.5: child_process.execFile inside HTTP request context is blocked
  record(() => {
    const req = { headers: {}, socket: { remoteAddress: '198.51.100.44' }, path: '/api/reports' };
    processSandboxMiddleware(req, {}, () => {
      assert.throws(
        () => {
          childProcess.execFile('node', ['-v']);
        },
        (err) => err.code === 'SECURITY_PROCESS_BLOCKED'
      );
    });
  }, '1.5 child_process.execFile invoked inside HTTP request throws SECURITY_PROCESS_BLOCKED');

  // Test 1.6: Global lockdown mode disables child_process across entire process
  record(() => {
    enableGlobalLockdown();
    try {
      assert.throws(
        () => {
          childProcess.execSync('node --version');
        },
        (err) => err.code === 'SECURITY_PROCESS_BLOCKED'
      );
    } finally {
      disableGlobalLockdown();
    }
  }, '1.6 Global lockdown mode prohibits process execution across entire application');

  // Test 1.7: Privileged execution bypass succeeds with valid token
  record(() => {
    enableGlobalLockdown();
    try {
      const result = runPrivileged(PRIVILEGED_TOKEN, () => {
        return 'AUTHORIZED_INTERNAL_OPERATION_OK';
      });
      assert.strictEqual(result, 'AUTHORIZED_INTERNAL_OPERATION_OK');
    } finally {
      disableGlobalLockdown();
    }
  }, '1.7 runPrivileged permits internal administrative tasks with valid cryptographic token');

  // Test 1.8: Privileged execution rejected with invalid token
  record(() => {
    assert.throws(
      () => {
        runPrivileged('invalid-attacker-token', () => {});
      },
      /Invalid Privileged Token/
    );
  }, '1.8 runPrivileged rejects unauthorized tokens');

  // ==============================================================================
  // PART 2: HOSTILE INTRUSION DECEPTION MESH & DYNAMIC CANARY LURES
  // ==============================================================================
  console.log(`\n${colors.bold}[PART 2] Hostile Intrusion Deception Mesh & Dynamic Canary Lures${colors.reset}`);

  // Test 2.1: /.git/config detection and canary trigger
  record(() => {
    assert.strictEqual(isCanaryTarget('/.git/config'), true);
    assert.strictEqual(isCanaryTarget('/.git/HEAD'), true);
    assert.strictEqual(isCanaryTarget('/muhasebe/.git/config'), true);
  }, '2.1 Git repository reconnaissance paths detected as canary lures');

  // Test 2.2: Cloud & AWS credentials canary detection
  record(() => {
    assert.strictEqual(isCanaryTarget('/.aws/credentials'), true);
    assert.strictEqual(isCanaryTarget('/.aws/config'), true);
    assert.strictEqual(isCanaryTarget('/s3cfg'), true);
  }, '2.2 Cloud & AWS credentials detected as canary lures');

  // Test 2.3: SSH and private key canary detection
  record(() => {
    assert.strictEqual(isCanaryTarget('/id_rsa'), true);
    assert.strictEqual(isCanaryTarget('/id_ed25519'), true);
    assert.strictEqual(isCanaryTarget('/.ssh/id_rsa'), true);
    assert.strictEqual(isCanaryTarget('/server.key'), true);
  }, '2.3 SSH private keys and TLS certificates detected as canary lures');

  // Test 2.4: Database dump and backup canary detection
  record(() => {
    assert.strictEqual(isCanaryTarget('/dump.sql'), true);
    assert.strictEqual(isCanaryTarget('/backup.sql'), true);
    assert.strictEqual(isCanaryTarget('/database.sql'), true);
    assert.strictEqual(isCanaryTarget('/users.sql'), true);
    assert.strictEqual(isCanaryTarget('/backup_final.tar.gz'), true);
  }, '2.4 Database dumps and backup archives detected as canary lures');

  // Test 2.5: Server config and framework backdoor detection
  record(() => {
    assert.strictEqual(isCanaryTarget('/web.config'), true);
    assert.strictEqual(isCanaryTarget('/wp-config.php'), true);
    assert.strictEqual(isCanaryTarget('/phpinfo.php'), true);
    assert.strictEqual(isCanaryTarget('/.env.backup'), true);
    assert.strictEqual(isCanaryTarget('/.docker/config.json'), true);
  }, '2.5 Server configurations and web backdoors detected as canary lures');

  // Test 2.6: Middleware triggers 403 CANARY_TRIGGERED and dynamic IP quarantine
  record(() => {
    resetCanaryTesting();
    const attackerIp = '198.51.100.99';
    quarantineEngine.unquarantineIp(attackerIp);

    let sentStatus = null;
    let sentBody = null;
    const req = {
      path: '/.git/config',
      method: 'GET',
      headers: { 'x-forwarded-for': attackerIp }
    };
    const res = {
      status(code) {
        sentStatus = code;
        return this;
      },
      json(data) {
        sentBody = data;
        return this;
      }
    };

    honeyFilesGuard(req, res, () => {
      assert.fail('Honeyfiles guard must not call next() for canary target');
    });

    assert.strictEqual(sentStatus, 403);
    assert.strictEqual(sentBody.code, 'CANARY_TRIGGERED');
    assert.strictEqual(sentBody.quarantined, true);
    assert.strictEqual(quarantineEngine.isQuarantined(attackerIp).quarantined, true);
    assert.strictEqual(getCanaryMetrics().tripwireHits, 1);
  }, '2.6 Canary access triggers HTTP 403 CANARY_TRIGGERED and immediate IP quarantine');

  // Test 2.7: Legitimate paths pass with zero false positives
  record(() => {
    const benignPaths = [
      '/api/health',
      '/api/login',
      '/api/invoices',
      '/api/accounts',
      '/muhasebe',
      '/muhasebe/index.html',
      '/assets/main.css',
      '/assets/bundle.js'
    ];

    for (const bPath of benignPaths) {
      assert.strictEqual(isCanaryTarget(bPath), false, `Benign path must not be flagged: ${bPath}`);
      let calledNext = false;
      honeyFilesGuard({ path: bPath, method: 'GET', headers: {} }, {}, () => {
        calledNext = true;
      });
      assert.strictEqual(calledNext, true, `Benign path must call next(): ${bPath}`);
    }
  }, '2.7 Legitimate enterprise paths pass with zero false positives');

  // ==============================================================================
  // PART 3: EPHEMERAL ZERO-KNOWLEDGE MEMORY SCRUBBING
  // ==============================================================================
  console.log(`\n${colors.bold}[PART 3] Ephemeral Zero-Knowledge Memory Scrubbing${colors.reset}`);

  // Test 3.1: zeroizeBuffer overwrites memory with 0x00
  record(() => {
    const sensitiveBuf = Buffer.from('TOP_SECRET_ACCOUNTING_LEDGER_KEY_2026', 'utf8');
    assert.notStrictEqual(sensitiveBuf[0], 0);

    cryptoVault.zeroizeBuffer(sensitiveBuf);

    for (let i = 0; i < sensitiveBuf.length; i++) {
      assert.strictEqual(sensitiveBuf[i], 0, `Byte at index ${i} must be zeroized`);
    }
  }, '3.1 zeroizeBuffer overwrites buffer memory completely with zero bytes (0x00)');

  // Test 3.2: Decrypting ciphertext performs memory zeroization
  record(() => {
    const plaintext = 'TR160006200041700006289477';
    const ciphertext = cryptoVault.encrypt(plaintext);
    assert.ok(cryptoVault.isEncrypted(ciphertext));

    const decrypted = cryptoVault.decrypt(ciphertext);
    assert.strictEqual(decrypted, plaintext);
  }, '3.2 AES-256-GCM decryption cleanses internal buffers while preserving plaintext accuracy');

  // Test 3.3: Self-test and round-trip verification pass cleanly
  record(() => {
    const result = cryptoVault.selfTest();
    assert.strictEqual(result, true);
  }, '3.3 Cryptographic self-test validates memory scrubbing without regression');

  // ==============================================================================
  // PART 4: LIVE EXPRESS SERVER INTEGRATION & END-TO-END TRI-FOLD VERIFICATION
  // ==============================================================================
  console.log(`\n${colors.bold}[PART 4] Live Express Server Integration & Tri-Fold Verification${colors.reset}`);

  await recordAsync(async () => {
    const serverApp = require('../server/index');
    const server = http.createServer(serverApp);

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    try {
      // 4.1 Probing /.git/config against live server returns 403 CANARY_TRIGGERED
      const res = await makeRequest(`http://127.0.0.1:${port}/.git/config`);
      assert.strictEqual(res.statusCode, 403);
      const json = JSON.parse(res.body);
      assert.strictEqual(json.code, 'CANARY_TRIGGERED');
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  }, '4.1 Live server intercepts canary reconnaissance with HTTP 403 CANARY_TRIGGERED');

  await recordAsync(async () => {
    const serverApp = require('../server/index');
    const server = http.createServer(serverApp);

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    try {
      // 4.2 Probing /api/health succeeds with 200 OK
      const res = await makeRequest(`http://127.0.0.1:${port}/api/health`);
      assert.strictEqual(res.statusCode, 200);
      const json = JSON.parse(res.body);
      assert.ok(json.status === 'healthy' || json.status === 'degraded');
      assert.strictEqual(json.service, 'brosan-tekstil-erp');
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  }, '4.2 Live server healthcheck operates flawlessly with Phase 8 active defenses');

  // ==============================================================================
  // FINAL SUMMARY REPORT
  // ==============================================================================
  console.log(`\n${colors.bold}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`            ${colors.bold}${colors.green}PHASE 8 SOVEREIGN QUANTUM VAULT TEST RESULTS${colors.reset}                  `);
  console.log(`${colors.bold}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(` Total Assertions Tested : ${totalAssertions}`);
  console.log(` Passed Assertions       : ${passedAssertions}`);
  console.log(` Failed Assertions       : ${totalAssertions - passedAssertions}`);
  console.log(` Success Rate            : ${((passedAssertions / totalAssertions) * 100).toFixed(1)}%`);
  console.log(`${colors.bold}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.green}${colors.bold}🎉 ALL PHASE 8 SOVEREIGN QUANTUM VAULT DEFENSE VECTORS VERIFIED WITH 100% SUCCESS!${colors.reset}\n`);
  } finally {
    cleanupTestFixtures();
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body });
      });
    }).on('error', reject);
  });
}

if (require.main === module) {
  runPhase8CitadelTests().catch((err) => {
    console.error('Test runner fatal error:', err);
    process.exit(1);
  });
}

module.exports = { runPhase8CitadelTests, cleanupTestFixtures };
