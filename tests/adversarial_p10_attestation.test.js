/**
 * BROSAN TEKSTİL ERP — PHASE 10 EMPIRICAL ADVERSARIAL CHALLENGER SUITE
 * tests/adversarial_p10_attestation.test.js
 *
 * Dedicated Challenger 2 Harness for:
 * Milestone M3: Autonomous Out-of-Band Attestation & Immutable Telemetry (server/peerAttestation.js)
 * and HTTP Telemetry / Express Middleware Integration.
 *
 * Empirical Challenges & Stress Tests:
 * 1. Attestation Tamper Resistance:
 *    - In-memory code hash single-byte and multi-byte corruptions across all 6 critical files
 *    - Truncated and missing critical file entries
 *    - Adversary re-hashing stateDigest without valid Post-Quantum private key
 *    - Disk file modification simulation in an isolated sandbox with mtime cache invalidation
 *    - State digest bit-flipping and mutations
 *    - Post-Quantum hybrid signature tampering (Ed25519, ML-DSA, envelopeChecksum, publicKeys)
 *    - Merkle state root, memory sentinel, and active policy tampering
 *    - Type pollution, null, and malformed object resilience
 * 2. HTTP Telemetry & Header Injection:
 *    - Express live lifecycle test with ephemeral HTTP server
 *    - Strict base64url URL-safe validation (RFC 4648 §5)
 *    - Compact payload JSON schema & digest consistency
 *    - Header injection presence across multiple endpoints
 *    - CORS exposed headers verification
 * 3. Public Unauthenticated Audit Endpoints:
 *    - GET /api/audit/attestation unauthenticated (no token) -> HTTP 200 + verified: true
 *    - GET /muhasebe/api/audit/attestation alias unauthenticated -> HTTP 200 + verified: true
 *    - Hostile / malformed authorization header probe immunity
 *    - POST /api/audit/verify-hybrid-signature public verification
 * 4. High-Load Performance & Latency Benchmarks:
 *    - 10,000 iterations getCompactAttestationProof() benchmark (<1.0ms SLA)
 *    - 5,000 iterations attestationMiddleware() benchmark (<1.0ms SLA)
 *    - 50 iterations cold cache / forceFresh synthesis benchmark
 *    - 1,000 iterations cryptographic proof verification benchmark
 */

process.env.CITADEL_FAST_TEST = '1';
process.env.NODE_ENV = 'test';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const crypto = require('crypto');
const { performance } = require('perf_hooks');

const {
  PeerAttestationEngine,
  peerAttestation,
  defaultAttestationEngine,
  CRITICAL_FILES,
  getAttestationProof,
  getCompactAttestationProof,
  verifyAttestationProof,
  attestationMiddleware,
  handleAttestationRequest
} = require('../server/peerAttestation');

const {
  postQuantumSigner,
  canonicalizePayload,
  verifyHybridSignature,
  signHybrid
} = require('../server/postQuantumSigner');

const { heapCanary } = require('../server/heapCanary');
const { lockdownManager } = require('../server/lockdown');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failureDetails = [];

function pass(name, detail = '') {
  totalAssertions++;
  passedAssertions++;
  console.log(`  ${colors.green}✔ PASS${colors.reset} [${totalAssertions}] ${name} ${detail ? colors.gray + detail + colors.reset : ''}`);
}

function fail(name, err) {
  totalAssertions++;
  failedAssertions++;
  failureDetails.push({ name, error: err });
  console.error(`  ${colors.red}✖ FAIL${colors.reset} [${totalAssertions}] ${name}`);
  console.error(`    ${colors.red}Error: ${err.message || err}${colors.reset}`);
}

function recordSync(fn, name) {
  try {
    fn();
    pass(name);
  } catch (err) {
    fail(name, err);
  }
}

async function recordAsync(fn, name) {
  try {
    await fn();
    pass(name);
  } catch (err) {
    fail(name, err);
  }
}

/**
 * Statistical benchmark runner
 */
function benchmarkIterations(fn, iterations, name) {
  const times = new Float64Array(iterations);
  // Warmup 50 iterations
  for (let i = 0; i < Math.min(50, iterations); i++) {
    fn();
  }

  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    fn();
    const t1 = performance.now();
    times[i] = t1 - t0;
  }

  times.sort();
  let sum = 0;
  for (let i = 0; i < iterations; i++) sum += times[i];
  const mean = sum / iterations;
  const min = times[0];
  const max = times[iterations - 1];
  const p50 = times[Math.floor(iterations * 0.50)];
  const p95 = times[Math.floor(iterations * 0.95)];
  const p99 = times[Math.floor(iterations * 0.99)];
  const p999 = times[Math.floor(iterations * 0.999)];

  return { iterations, mean, min, max, p50, p95, p99, p999 };
}

async function runAdversarialSuite() {
  console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}  PHASE 10 CHALLENGER 2: EMPIRICAL ADVERSARIAL ATTESTATION & TELEMETRY SUITE  ${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  // ============================================================================
  // GROUP 1: ATTESTATION TAMPER RESISTANCE & FAULT INJECTION
  // ============================================================================
  console.log(`${colors.magenta}${colors.bold}--- [GROUP 1] Attestation Tamper Resistance & Fault Injection ---${colors.reset}`);

  // Base pristine proof
  const baselineProof = getAttestationProof({ forceFresh: true });
  assert.strictEqual(verifyAttestationProof(baselineProof), true, 'Baseline pristine proof must verify');

  // 1.1 In-memory code hash single-byte corruptions across each of the 6 critical files
  for (const file of CRITICAL_FILES) {
    recordSync(() => {
      const tampered = JSON.parse(JSON.stringify(baselineProof));
      const origHash = tampered.codeHashes[file];
      assert(origHash && origHash.length === 64, `Hash for ${file} must exist`);

      // Flip the last byte of the hash
      const lastChar = origHash[origHash.length - 1];
      const replacement = lastChar === '0' ? '1' : '0';
      tampered.codeHashes[file] = origHash.substring(0, origHash.length - 1) + replacement;

      const result = verifyAttestationProof(tampered);
      assert.strictEqual(result, false, `Verification must fail when hash of ${file} is modified`);
    }, `1.1 Corrupt single byte in hash for file: ${file}`);
  }

  // 1.2 Multi-file corruption and all-zero replacement
  recordSync(() => {
    const tampered = JSON.parse(JSON.stringify(baselineProof));
    for (const file of CRITICAL_FILES) {
      tampered.codeHashes[file] = '0'.repeat(64);
    }
    const result = verifyAttestationProof(tampered);
    assert.strictEqual(result, false, 'Verification must fail when all hashes are zero-filled');
  }, '1.2 Multi-hash zero-filling attack is rejected');

  // 1.3 Missing / Truncated critical file entries
  for (const file of CRITICAL_FILES) {
    recordSync(() => {
      const tampered = JSON.parse(JSON.stringify(baselineProof));
      delete tampered.codeHashes[file];
      const result = verifyAttestationProof(tampered);
      assert.strictEqual(result, false, `Verification must fail when file ${file} is omitted from codeHashes`);
    }, `1.3 Omission of critical file key: ${file}`);
  }

  // 1.4 Non-object or invalid codeHashes types
  const badHashTypes = [
    { label: 'empty object', val: {} },
    { label: 'null', val: null },
    { label: 'array', val: ['server/index.js'] },
    { label: 'string', val: 'hash_string' },
    { label: 'number', val: 12345 },
    { label: 'boolean', val: true },
    { label: 'function', val: () => {} }
  ];
  for (const item of badHashTypes) {
    recordSync(() => {
      const tampered = JSON.parse(JSON.stringify(baselineProof));
      tampered.codeHashes = item.val;
      const result = verifyAttestationProof(tampered);
      assert.strictEqual(result, false, `Verification must fail when codeHashes is ${item.label}`);
    }, `1.4 Malformed codeHashes type: ${item.label}`);
  }

  // 1.5 Adversary recomputes stateDigest without valid Post-Quantum private key
  recordSync(() => {
    const tampered = JSON.parse(JSON.stringify(baselineProof));
    // Corrupt one file hash
    tampered.codeHashes['server/index.js'] = 'deadbeef'.repeat(8);

    // Adversary re-synthesizes stateDigest to bypass digest check
    const canonicalState = {
      version: tampered.version,
      timestamp: tampered.timestamp,
      epoch: tampered.epoch,
      codeHashes: tampered.codeHashes,
      memorySentinel: tampered.memorySentinel,
      heapCanary: tampered.heapCanary,
      merkleState: tampered.merkleState,
      activeSecurityPolicies: tampered.activeSecurityPolicies
    };
    const stateBuf = canonicalizePayload(canonicalState);
    tampered.stateDigest = crypto.createHash('sha256').update(stateBuf).digest('hex');

    // Verification must still fail because signature is bound to original stateDigest
    const result = verifyAttestationProof(tampered);
    assert.strictEqual(result, false, 'Adversary recomputing stateDigest without PQC key must fail verification');
  }, '1.5 Adversary stateDigest recomputation attack rejected by PQC hybrid signature');

  // 1.6 Disk File Modification Simulation in Isolated Sandbox
  recordSync(() => {
    const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brosan_attest_sandbox_'));
    try {
      const targetFiles = ['core_a.js', 'core_b.js'];
      const fileA = path.join(sandboxDir, 'core_a.js');
      const fileB = path.join(sandboxDir, 'core_b.js');

      fs.writeFileSync(fileA, 'console.log("Original Core A");\n');
      fs.writeFileSync(fileB, 'console.log("Original Core B");\n');

      const sandboxEngine = new PeerAttestationEngine({
        workspaceRoot: sandboxDir,
        targetFiles,
        cacheTtlMs: 10000
      });

      // Baseline proof
      const proof0 = sandboxEngine.getAttestationProof({ forceFresh: true });
      assert.strictEqual(sandboxEngine.verifyAttestationProof(proof0), true);
      const origHashA = proof0.codeHashes['core_a.js'];

      // Adversary modifies file on disk
      // Ensure mtime changes even on filesystems with 1-second resolution
      const pastTime = Date.now() + 2000;
      fs.appendFileSync(fileA, '// MALICIOUS ADVERSARY INJECTION\n');
      fs.utimesSync(fileA, pastTime / 1000, pastTime / 1000);

      // Verify engine detects disk change immediately via mtime invalidation
      const newHashA = sandboxEngine.getFileHash('core_a.js');
      assert.notStrictEqual(newHashA, origHashA, 'Engine must compute new SHA-256 after disk modification');

      // Now if an adversary attempts to present old proof0 as representing current disk state:
      const currentDiskHashes = sandboxEngine.getCodeHashes();
      assert.notStrictEqual(currentDiskHashes['core_a.js'], proof0.codeHashes['core_a.js']);

      // If adversary modifies proof0.codeHashes to currentDiskHashes:
      const forgedProof = JSON.parse(JSON.stringify(proof0));
      forgedProof.codeHashes['core_a.js'] = currentDiskHashes['core_a.js'];
      assert.strictEqual(sandboxEngine.verifyAttestationProof(forgedProof), false, 'Forged proof with disk hash fails verification');

      // If adversary also modifies stateDigest without valid private key:
      const canonical = {
        version: forgedProof.version,
        timestamp: forgedProof.timestamp,
        epoch: forgedProof.epoch,
        codeHashes: forgedProof.codeHashes,
        memorySentinel: forgedProof.memorySentinel,
        heapCanary: forgedProof.heapCanary,
        merkleState: forgedProof.merkleState,
        activeSecurityPolicies: forgedProof.activeSecurityPolicies
      };
      forgedProof.stateDigest = crypto.createHash('sha256').update(canonicalizePayload(canonical)).digest('hex');
      assert.strictEqual(sandboxEngine.verifyAttestationProof(forgedProof), false, 'Forged proof with updated digest fails signature check');
    } finally {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
  }, '1.6 Disk file modification simulation in isolated sandbox with mtime detection');

  // 1.7 State Digest Bit-Flipping and Mutations
  const digestMutations = [
    { label: 'flip first char', mutate: (d) => (d[0] === '0' ? '1' : '0') + d.substring(1) },
    { label: 'flip last char', mutate: (d) => d.substring(0, 63) + (d[63] === '0' ? '1' : '0') },
    { label: 'truncate to 32 chars', mutate: (d) => d.substring(0, 32) },
    { label: 'empty string', mutate: () => '' },
    { label: 'null value', mutate: () => null },
    { label: 'all Fs', mutate: () => 'f'.repeat(64) },
    { label: 'all 0s', mutate: () => '0'.repeat(64) },
    { label: 'random hex', mutate: () => crypto.randomBytes(32).toString('hex') }
  ];
  for (const item of digestMutations) {
    recordSync(() => {
      const tampered = JSON.parse(JSON.stringify(baselineProof));
      tampered.stateDigest = item.mutate(tampered.stateDigest);
      const result = verifyAttestationProof(tampered);
      assert.strictEqual(result, false, `State digest mutation (${item.label}) must fail verification`);
    }, `1.7 State digest mutation: ${item.label}`);
  }

  // 1.8 Post-Quantum Hybrid Signature Tampering
  recordSync(() => {
    // 1.8a Corrupt Ed25519 classical signature
    const tampered = JSON.parse(JSON.stringify(baselineProof));
    const sig = tampered.signature.classical.signature;
    tampered.signature.classical.signature = (sig[0] === 'a' ? 'b' : 'a') + sig.substring(1);
    assert.strictEqual(verifyAttestationProof(tampered), false);
  }, '1.8a Classical Ed25519 signature corruption rejected');

  recordSync(() => {
    // 1.8b Corrupt Post-Quantum ML-DSA signature
    const tampered = JSON.parse(JSON.stringify(baselineProof));
    const pqSig = tampered.signature.postQuantum.signature;
    assert(pqSig && typeof pqSig === 'object', 'postQuantum.signature must be an object');
    assert(pqSig.cSeed && typeof pqSig.cSeed === 'string', 'cSeed must be a string');
    // Corrupt cSeed challenge seed
    tampered.signature.postQuantum.signature.cSeed = (pqSig.cSeed[0] === '0' ? '1' : '0') + pqSig.cSeed.substring(1);
    assert.strictEqual(verifyAttestationProof(tampered), false, 'Corrupted cSeed in ML-DSA signature must fail verification');

    // Also test corrupting z vector
    const tamperedZ = JSON.parse(JSON.stringify(baselineProof));
    tamperedZ.signature.postQuantum.signature.z = '0'.repeat(100);
    assert.strictEqual(verifyAttestationProof(tamperedZ), false, 'Corrupted z vector in ML-DSA signature must fail verification');
  }, '1.8b Post-Quantum ML-DSA signature corruption rejected');

  recordSync(() => {
    // 1.8c Corrupt envelope checksum
    const tampered = JSON.parse(JSON.stringify(baselineProof));
    tampered.signature.envelopeChecksum = 'deadbeef'.repeat(8);
    assert.strictEqual(verifyAttestationProof(tampered), false);
  }, '1.8c Envelope checksum tampering rejected');

  recordSync(() => {
    // 1.8d Corrupt classical public key
    const tampered = JSON.parse(JSON.stringify(baselineProof));
    const pk = tampered.signature.classical.publicKey;
    tampered.signature.classical.publicKey = (pk[0] === '0' ? '1' : '0') + pk.substring(1);
    assert.strictEqual(verifyAttestationProof(tampered), false);
  }, '1.8d Classical public key substitution rejected');

  recordSync(() => {
    // 1.8e Strip signature completely
    const tampered = JSON.parse(JSON.stringify(baselineProof));
    tampered.signature = null;
    assert.strictEqual(verifyAttestationProof(tampered), false);

    const tampered2 = JSON.parse(JSON.stringify(baselineProof));
    tampered2.signature = {};
    assert.strictEqual(verifyAttestationProof(tampered2), false);
  }, '1.8e Null / empty signature block rejected');

  // 1.9 Merkle state root, memory sentinel, and active policies tampering
  const stateFieldMutations = [
    { label: 'tamper merkleRoot', fn: (p) => { p.merkleState.merkleRoot = '0'.repeat(64); } },
    { label: 'tamper snapshotId', fn: (p) => { p.merkleState.snapshotId = 999999; } },
    { label: 'tamper postQuantum policy', fn: (p) => { p.activeSecurityPolicies.postQuantumSigner = 'DISABLED'; } },
    { label: 'tamper lockdownState policy', fn: (p) => { p.activeSecurityPolicies.lockdownState = true; } },
    { label: 'tamper memorySentinel healthy', fn: (p) => { p.memorySentinel.healthy = false; } },
    { label: 'tamper heapCanary status', fn: (p) => { p.heapCanary.isCompromised = true; } },
    { label: 'tamper timestamp', fn: (p) => { p.timestamp = new Date(0).toISOString(); } },
    { label: 'tamper epoch', fn: (p) => { p.epoch = 123456; } },
    { label: 'tamper version', fn: (p) => { p.version = '2.0.0-compromised'; } }
  ];
  for (const item of stateFieldMutations) {
    recordSync(() => {
      const tampered = JSON.parse(JSON.stringify(baselineProof));
      item.fn(tampered);
      const result = verifyAttestationProof(tampered);
      assert.strictEqual(result, false, `Tampering with ${item.label} must fail verification`);
    }, `1.9 State field tampering: ${item.label}`);
  }

  // 1.10 Edge cases, malformed payloads, and prototype pollution resistance
  const malformedPayloads = [
    null,
    undefined,
    12345,
    'raw_string',
    true,
    [],
    {},
    { stateDigest: 'abc' },
    { stateDigest: 'abc', signature: {} },
    { stateDigest: 'abc', signature: null },
    { __proto__: { admin: true } },
    { constructor: { prototype: { poll: 1 } } }
  ];
  for (let i = 0; i < malformedPayloads.length; i++) {
    recordSync(() => {
      const result = verifyAttestationProof(malformedPayloads[i]);
      assert.strictEqual(result, false, 'Malformed proof payload must safely return false');
    }, `1.10 Malformed proof payload #${i + 1}`);
  }

  // ============================================================================
  // GROUP 2: HTTP TELEMETRY & HEADER INJECTION
  // ============================================================================
  console.log(`\n${colors.magenta}${colors.bold}--- [GROUP 2] HTTP Telemetry & Header Injection Format & Verification ---${colors.reset}`);

  const app = require('../server/index');
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const port = server.address().port;

  function doHttpRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
      const req = http.request({ ...options, port, host: '127.0.0.1' }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      });
      req.on('error', reject);
      if (postData) {
        req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
      }
      req.end();
    });
  }

  let capturedHeader = null;

  // 2.1 Request /api/health and capture header
  await recordAsync(async () => {
    const res = await doHttpRequest({ path: '/api/health', method: 'GET' });
    assert.strictEqual(res.status, 200);
    capturedHeader = res.headers['x-brosan-attestation-proof'];
    assert(capturedHeader, 'X-Brosan-Attestation-Proof header must be present in response');
    assert(capturedHeader.length > 50, 'Header must contain substantial base64url payload');
  }, '2.1 Live HTTP GET /api/health returns X-Brosan-Attestation-Proof header');

  // 2.2 Strict base64url URL-safe format validation (RFC 4648 §5)
  recordSync(() => {
    assert(capturedHeader, 'Header must have been captured');
    // base64url must NOT contain +, /, or = (padding)
    const base64urlRegex = /^[A-Za-z0-9_-]+$/;
    assert(base64urlRegex.test(capturedHeader), 'Header must strictly conform to URL-safe base64url format (no +, /, or =)');
    assert(!capturedHeader.includes('+'), 'Must not contain +');
    assert(!capturedHeader.includes('/'), 'Must not contain /');
    assert(!capturedHeader.includes('='), 'Must not contain padding =');
  }, '2.2 Strict URL-safe base64url character set validation (RFC 4648 §5)');

  // 2.3 Compact Payload JSON Schema & Digest Consistency
  recordSync(() => {
    const decodedStr = Buffer.from(capturedHeader, 'base64url').toString('utf8');
    const compact = JSON.parse(decodedStr);

    assert.strictEqual(compact.v, '1', 'Version property v must equal "1"');
    assert(compact.ts && !isNaN(Date.parse(compact.ts)), 'ts must be valid ISO timestamp');
    assert(compact.d && /^[a-f0-9]{64}$/.test(compact.d), 'd must be 64-char hex SHA-256 stateDigest');
    assert(compact.r && typeof compact.r === 'string', 'r must be non-empty Merkle root');
    assert(compact.cs && /^[a-f0-9]{64}$/.test(compact.cs), 'cs must be 64-char hex envelopeChecksum');

    // Digest consistency with active proof
    const activeProof = getAttestationProof();
    assert.strictEqual(compact.d, activeProof.stateDigest, 'Compact header stateDigest must match active proof digest');
    assert.strictEqual(compact.cs, activeProof.signature.envelopeChecksum, 'Compact checksum must match active signature checksum');
  }, '2.3 Decoded compact payload schema validation & cryptographic consistency');

  // 2.4 Header presence across various endpoints
  const testEndpoints = [
    { path: '/api/health', method: 'GET' },
    { path: '/api/audit/attestation', method: 'GET' },
    { path: '/muhasebe/api/audit/attestation', method: 'GET' },
    { path: '/api/auth/login', method: 'POST', body: { username: 'test', password: 'wrong' } }
  ];
  for (const ep of testEndpoints) {
    await recordAsync(async () => {
      const res = await doHttpRequest({
        path: ep.path,
        method: ep.method,
        headers: ep.body ? { 'Content-Type': 'application/json' } : {}
      }, ep.body);
      const h = res.headers['x-brosan-attestation-proof'];
      assert(h, `Endpoint ${ep.method} ${ep.path} must return X-Brosan-Attestation-Proof header`);
      assert(/^[A-Za-z0-9_-]+$/.test(h), 'Header must be valid base64url');
    }, `2.4 Header injection presence on ${ep.method} ${ep.path}`);
  }

  // 2.5 CORS exposed headers check
  await recordAsync(async () => {
    const res = await doHttpRequest({
      path: '/api/health',
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://brosangroup.com',
        'Access-Control-Request-Method': 'GET'
      }
    });
    const exposed = res.headers['access-control-expose-headers'] || '';
    assert(
      exposed.toLowerCase().includes('x-brosan-attestation-proof'),
      'Access-Control-Expose-Headers must expose X-Brosan-Attestation-Proof to frontend/browsers'
    );
  }, '2.5 CORS Access-Control-Expose-Headers exposes X-Brosan-Attestation-Proof');

  // ============================================================================
  // GROUP 3: PUBLIC UNAUTHENTICATED AUDIT ENDPOINTS ACCESS & INTEGRITY
  // ============================================================================
  console.log(`\n${colors.magenta}${colors.bold}--- [GROUP 3] Public Unauthenticated Audit Endpoints Access & Integrity ---${colors.reset}`);

  // 3.1 Public access on GET /api/audit/attestation without auth
  await recordAsync(async () => {
    const res = await doHttpRequest({
      path: '/api/audit/attestation',
      method: 'GET',
      headers: {} // strictly empty headers (no auth)
    });
    assert.strictEqual(res.status, 200, 'Must return HTTP 200 OK without any auth token');

    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.verified, true);
    assert(data.attestationProof && typeof data.attestationProof === 'object');
    assert.strictEqual(data.attestationProof.version, '1.0.0-omega');

    // Verify all 6 critical files
    const hashes = data.attestationProof.codeHashes;
    assert(hashes, 'codeHashes must exist');
    assert.strictEqual(Object.keys(hashes).length, 6, 'Must contain exactly 6 critical files');
    for (const f of CRITICAL_FILES) {
      assert(hashes[f] && /^[a-f0-9]{64}$/.test(hashes[f]), `Valid SHA-256 for ${f}`);
    }

    // Verify independent verification of the served proof
    const verified = verifyAttestationProof(data.attestationProof);
    assert.strictEqual(verified, true, 'Served attestationProof must be independently verifiable');
  }, '3.1 Public access on GET /api/audit/attestation returns HTTP 200 and verified proof');

  // 3.2 Public access on alias GET /muhasebe/api/audit/attestation without auth
  await recordAsync(async () => {
    const res = await doHttpRequest({
      path: '/muhasebe/api/audit/attestation',
      method: 'GET',
      headers: {}
    });
    assert.strictEqual(res.status, 200, 'Alias route must return HTTP 200 OK without auth');

    const data = JSON.parse(res.body);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.verified, true);
    assert.strictEqual(Object.keys(data.attestationProof.codeHashes).length, 6);
  }, '3.2 Public access on alias GET /muhasebe/api/audit/attestation returns HTTP 200');

  // 3.3 Hostile / Malformed token probing immunity
  const hostileAuthHeaders = [
    'Bearer invalid_token_123',
    'Bearer eyJhbGciOiJIUzI1NiJ9.e30.corrupt_signature',
    'Bearer <script>alert(1)</script>',
    'Bearer " OR "1"="1',
    'Basic YWRtaW46cGFzc3dvcmQ=',
    'Token random_token_value'
  ];
  for (const hostileAuth of hostileAuthHeaders) {
    await recordAsync(async () => {
      const res = await doHttpRequest({
        path: '/api/audit/attestation',
        method: 'GET',
        headers: { 'Authorization': hostileAuth }
      });
      // Public audit endpoints should remain accessible even if someone sends garbage auth headers
      assert.strictEqual(res.status, 200, `Public audit endpoint must return 200 even with '${hostileAuth.substring(0, 20)}...'`);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.success, true);
    }, `3.3 Adversarial auth probe immunity with: ${hostileAuth.substring(0, 25)}`);
  }

  // 3.4 Public Post-Quantum Signature Verification Endpoint
  const sampleDeclaration = {
    declarationType: 'ETGB_GUMRUK_BEYANNAME',
    tceNo: 'ETGB-2026-004491',
    gtip: '6109.10.00.00.00',
    amountEur: 12500.00,
    consignee: 'GmbH Mode Logistik',
    timestamp: new Date().toISOString()
  };
  const validSignature = postQuantumSigner.signHybrid(sampleDeclaration);

  await recordAsync(async () => {
    // Valid signature verification
    const res = await doHttpRequest({
      path: '/api/audit/verify-hybrid-signature',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      payload: sampleDeclaration,
      signature: validSignature
    });
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(data.isValid, true);
    assert.strictEqual(data.success, true);
  }, '3.4a Public POST /api/audit/verify-hybrid-signature verifies genuine signature');

  await recordAsync(async () => {
    // Tampered payload verification
    const tamperedPayload = { ...sampleDeclaration, amountEur: 999999.00 };
    const res = await doHttpRequest({
      path: '/api/audit/verify-hybrid-signature',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      payload: tamperedPayload,
      signature: validSignature
    });
    // Server rejects invalid/tampered hybrid signature with HTTP 400
    assert.strictEqual(res.status, 400, 'Tampered signature verification must return HTTP 400');
    const data = JSON.parse(res.body);
    assert.strictEqual(data.isValid, false, 'Tampered declaration must return isValid: false');
    assert.strictEqual(data.code, 'INVALID_HYBRID_SIGNATURE');
  }, '3.4b Public POST /api/audit/verify-hybrid-signature rejects tampered payload with HTTP 400');

  // Close live server
  await new Promise((resolve) => server.close(resolve));

  // ============================================================================
  // GROUP 4: HIGH-LOAD PERFORMANCE & LATENCY BENCHMARKS (<1ms SLA)
  // ============================================================================
  console.log(`\n${colors.magenta}${colors.bold}--- [GROUP 4] High-Load Performance & Latency Benchmarks (<1ms SLA) ---${colors.reset}`);

  // 4.1 Benchmark 10,000 iterations of getCompactAttestationProof()
  recordSync(() => {
    const iterations = 10000;
    const stats = benchmarkIterations(() => {
      getCompactAttestationProof();
    }, iterations, 'getCompactAttestationProof');

    console.log(`    ${colors.cyan}Benchmark [getCompactAttestationProof] (${iterations.toLocaleString()} calls):${colors.reset}`);
    console.log(`      Mean Latency : ${colors.bold}${(stats.mean * 1000).toFixed(2)} µs${colors.reset} (${stats.mean.toFixed(4)} ms)`);
    console.log(`      Min Latency  : ${(stats.min * 1000).toFixed(2)} µs`);
    console.log(`      p50 (Median) : ${(stats.p50 * 1000).toFixed(2)} µs`);
    console.log(`      p95 Latency  : ${(stats.p95 * 1000).toFixed(2)} µs`);
    console.log(`      p99 Latency  : ${(stats.p99 * 1000).toFixed(2)} µs`);
    console.log(`      p99.9 Latency: ${(stats.p999 * 1000).toFixed(2)} µs`);
    console.log(`      Max Latency  : ${(stats.max * 1000).toFixed(2)} µs (${stats.max.toFixed(4)} ms)`);

    assert(stats.mean < 1.0, `Mean latency (${stats.mean.toFixed(4)}ms) must be strictly < 1.0ms SLA`);
    assert(stats.p99 < 1.0, `p99 latency (${stats.p99.toFixed(4)}ms) must be strictly < 1.0ms`);
  }, '4.1 Benchmark 10,000 iterations getCompactAttestationProof() (<1ms SLA)');

  // 4.2 Benchmark 5,000 iterations of attestationMiddleware overhead
  recordSync(() => {
    const iterations = 5000;
    const mockReq = { method: 'GET', url: '/api/data' };
    const mockRes = {
      headers: {},
      setHeader(k, v) { this.headers[k] = v; }
    };
    const next = () => {};

    const stats = benchmarkIterations(() => {
      attestationMiddleware(mockReq, mockRes, next);
    }, iterations, 'attestationMiddleware');

    console.log(`    ${colors.cyan}Benchmark [attestationMiddleware] (${iterations.toLocaleString()} calls):${colors.reset}`);
    console.log(`      Mean Overhead: ${colors.bold}${(stats.mean * 1000).toFixed(2)} µs${colors.reset} (${stats.mean.toFixed(4)} ms)`);
    console.log(`      p50 (Median) : ${(stats.p50 * 1000).toFixed(2)} µs`);
    console.log(`      p95 Overhead : ${(stats.p95 * 1000).toFixed(2)} µs`);
    console.log(`      p99 Overhead : ${(stats.p99 * 1000).toFixed(2)} µs`);

    assert(stats.mean < 1.0, `Middleware mean overhead (${stats.mean.toFixed(4)}ms) must be < 1.0ms SLA`);
    assert(stats.p99 < 1.0, `Middleware p99 overhead (${stats.p99.toFixed(4)}ms) must be < 1.0ms`);
  }, '4.2 Benchmark 5,000 iterations attestationMiddleware overhead (<1ms SLA)');

  // 4.3 Cold Cache / ForceFresh Proof Synthesis Benchmark (50 iterations)
  recordSync(() => {
    const iterations = 50;
    const stats = benchmarkIterations(() => {
      getAttestationProof({ forceFresh: true });
    }, iterations, 'forceFresh getAttestationProof');

    console.log(`    ${colors.cyan}Benchmark [forceFresh getAttestationProof] (${iterations} disk re-reads + PQC signs):${colors.reset}`);
    console.log(`      Mean Duration: ${colors.bold}${stats.mean.toFixed(2)} ms${colors.reset}`);
    console.log(`      Min Duration : ${stats.min.toFixed(2)} ms`);
    console.log(`      p95 Duration : ${stats.p95.toFixed(2)} ms`);
    console.log(`      Max Duration : ${stats.max.toFixed(2)} ms`);

    // Fresh generation involves reading 6 files from disk + NIST FIPS 204 lattice polynomial arithmetic
    // Assert reasonable bounds (<50ms per cold generation)
    assert(stats.mean < 50.0, `Cold synthesis mean (${stats.mean.toFixed(2)}ms) must be < 50ms`);
  }, '4.3 Benchmark 50 cold/forceFresh attestation proof syntheses (<50ms)');

  // 4.4 Cryptographic Verification Benchmark (1,000 iterations)
  recordSync(() => {
    const iterations = 1000;
    const proofToVerify = getAttestationProof();
    const stats = benchmarkIterations(() => {
      const v = verifyAttestationProof(proofToVerify);
      if (!v) throw new Error('Verification failed in benchmark');
    }, iterations, 'verifyAttestationProof');

    console.log(`    ${colors.cyan}Benchmark [verifyAttestationProof] (${iterations.toLocaleString()} verifications):${colors.reset}`);
    console.log(`      Mean Latency : ${colors.bold}${stats.mean.toFixed(3)} ms${colors.reset} (${(stats.mean * 1000).toFixed(1)} µs)`);
    console.log(`      p50 (Median) : ${(stats.p50 * 1000).toFixed(1)} µs`);
    console.log(`      p95 Latency  : ${(stats.p95 * 1000).toFixed(1)} µs`);
    console.log(`      p99 Latency  : ${(stats.p99 * 1000).toFixed(1)} µs`);

    assert(stats.mean < 25.0, `Verification mean latency (${stats.mean.toFixed(3)}ms) must be < 25.0ms`);
  }, '4.4 Benchmark 1,000 cryptographic proof verifications (<25ms)');

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}        CHALLENGER 2: EMPIRICAL ADVERSARIAL ATTESTATION TEST SUMMARY            ${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(` Total Assertions Tested : ${totalAssertions}`);
  console.log(` Passed Assertions       : ${colors.green}${passedAssertions}${colors.reset}`);
  console.log(` Failed Assertions       : ${failedAssertions > 0 ? colors.red : colors.green}${failedAssertions}${colors.reset}`);
  console.log(` Pass Rate               : ${colors.bold}${colors.green}${((passedAssertions / totalAssertions) * 100).toFixed(1)}%${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  if (failedAssertions > 0) {
    console.error(`${colors.bold}${colors.red}❌ CHALLENGE VERDICT: REJECT (${failedAssertions} assertions failed)${colors.reset}\n`);
    for (const f of failureDetails) {
      console.error(` - ${f.name}: ${f.error.message || f.error}`);
    }
    process.exit(1);
  } else {
    console.log(`${colors.bold}${colors.green}🏆 CHALLENGE VERDICT: APPROVE (100% of empirical adversarial assertions passed!)${colors.reset}\n`);
    process.exit(0);
  }
}

runAdversarialSuite().catch(err => {
  console.error('Fatal crash in challenger suite:', err);
  process.exit(1);
});
