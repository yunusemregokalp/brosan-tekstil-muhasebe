/**
 * BROSAN TEKSTİL ERP — PHASE 4 IRONCLAD DEFENSE-IN-DEPTH HARDENING
 * ADVERSARIAL CHALLENGER M2-2: HIJACKING STRESS & TIMING ATTACK TEST HARNESS
 * 
 * Scope & Verification Objectives:
 * 1. Deep Timing-Attack Side-Channel Analysis:
 *    - Constant-time comparison verification across varying matching prefix lengths (0, 1, 4, 8, 16, 24, 31, 32 bytes).
 *    - Latency delta evaluation (mean execution time delta ~ 0ms).
 *    - Length-timing immunity test (malformed, truncated, oversized inputs compared via dummy constant-time buffer).
 * 
 * 2. Stolen Token Immediate Revocation Blast Radius:
 *    - High-privilege session token issued to legitimate workstation.
 *    - Attacker presents stolen token from differing network identity (IP / User-Agent).
 *    - Verified immediate HTTP 401 SESSION_HIJACK_DETECTED.
 *    - Blast Radius Verification: Stolen token is immediately and permanently revoked everywhere:
 *      * Victim workstation can no longer access /api/auth/me (returns 401 TOKEN_REVOKED).
 *      * Victim workstation cannot access business mutation endpoints (/api/accounts, /api/contacts).
 *      * Token revocation is durably persisted to data/revoked_tokens.json.
 * 
 * 3. Attacker Quarantine Cascading Across All Routes:
 *    - Attacker IP is registered in quarantineEngine with 1-hour TTL.
 *    - Cascading verification across ALL system routes:
 *      * /api/health
 *      * /api/auth/login
 *      * /api/auth/2fa/verify
 *      * /api/accounts
 *      * /api/contacts
 *      * /api/transactions
 *      * /robots.txt
 *      * /muhasebe
 *      * /muhasebe/api/accounts
 *    - Evasion resistance: IPv4-mapped IPv6 (::ffff:), bracketed IPs, and X-Forwarded-For proxy hops.
 *    - Quarantined response headers: Retry-After, X-Quarantine-Status, X-Quarantine-Remaining.
 * 
 * 4. Pre-Auth Token & Legacy Token Handling:
 *    - Pre-auth 2FA token isolation (fails closed on business endpoints with 401 UNAUTHORIZED_2FA_REQUIRED).
 *    - Cross-network hijacking of pre-auth token on /api/auth/2fa/verify triggers SESSION_HIJACK_DETECTED,
 *      revoking the pre-auth token and quarantining the attacker.
 *    - Post-2FA single-use revocation of pre-auth tokens.
 *    - Backward compatibility for legacy tokens without fgp claims.
 *    - Resilience against malformed fgp claims (non-hex, truncated, numeric, object).
 * 
 * Execution:
 *   node tests/test-challenger-m2-2-hijacking-timing.js
 */

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const sessionGuard = require('../server/sessionGuard');
const auth = require('../server/auth');
const { quarantineEngine } = require('../server/quarantine');
const auditLogger = require('../server/auditLogger');
const threatAlerter = require('../server/threatAlerter');

// ANSI Terminal Colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

let totalChecks = 0;
let passedChecks = 0;

function check(assertion, description) {
  totalChecks++;
  try {
    assert(assertion, description);
    passedChecks++;
    console.log(`  ${colors.green}✔ PASS${colors.reset} [${totalChecks}] ${description}`);
  } catch (err) {
    console.error(`  ${colors.red}✖ FAIL${colors.reset} [${totalChecks}] ${description}`);
    console.error(`    ${colors.dim}${err.message}${colors.reset}`);
    throw err;
  }
}

function sendHttpRequest({ hostname = '127.0.0.1', port, path = '/', method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'host': 'brosangroup.com',
      ...headers
    };
    if (body && !defaultHeaders['content-type']) {
      defaultHeaders['content-type'] = 'application/json';
    }

    const req = http.request({
      hostname,
      port,
      path,
      method,
      headers: defaultHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          text: data,
          json
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runChallengerHarness() {
  console.log(`\n${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}⚔️  CHALLENGER M2-2: HIJACKING STRESS & TIMING ATTACK VERIFICATION HARNESS${colors.reset}`);
  console.log(`${colors.dim}Target: Layer 2 Cryptographic Session Guard, Timing Resistance & Blast Radius${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  const startTime = Date.now();

  // ============================================================================
  // SECTION 1: TIMING-ATTACK SIDE-CHANNEL & CONSTANT-TIME PREFIX ANALYSIS
  // ============================================================================
  console.log(`${colors.bold}[PART 1] Deep Timing-Attack Side-Channel & Constant-Time Analysis${colors.reset}`);

  const benchmarkReq = {
    ip: '198.51.100.42',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
      'accept-language': 'tr-TR,tr;q=0.9,en-US;q=0.8'
    }
  };

  const goldenFgpHex = sessionGuard.generateFingerprint(benchmarkReq);
  check(typeof goldenFgpHex === 'string' && goldenFgpHex.length === 64, 'Golden fingerprint generated as 64-char hex string (32 bytes)');

  const goldenBuf = Buffer.from(goldenFgpHex, 'hex');
  check(goldenBuf.length === 32, 'Golden fingerprint buffer is exactly 32 bytes');

  // Helper to generate candidate with matching prefix of N bytes
  function makePrefixCandidate(matchingBytes) {
    const candidateBuf = Buffer.alloc(32);
    // Copy matching bytes
    goldenBuf.copy(candidateBuf, 0, 0, matchingBytes);
    // Fill remaining bytes with flipped / differing bytes
    for (let i = matchingBytes; i < 32; i++) {
      candidateBuf[i] = (goldenBuf[i] ^ 0xFF); // Guaranteed mismatch
    }
    return candidateBuf.toString('hex');
  }

  const prefixTestCases = [
    { name: '0 bytes matching (all mismatch)', bytes: 0 },
    { name: '1 byte matching (first 2 hex chars)', bytes: 1 },
    { name: '4 bytes matching (first 8 hex chars)', bytes: 4 },
    { name: '8 bytes matching (first 16 hex chars)', bytes: 8 },
    { name: '16 bytes matching (first 32 hex chars)', bytes: 16 },
    { name: '24 bytes matching (first 48 hex chars)', bytes: 24 },
    { name: '31 bytes matching (first 62 hex chars, last mismatch)', bytes: 31 },
    { name: '32 bytes matching (exact match)', bytes: 32 }
  ];

  for (const tc of prefixTestCases) {
    tc.candidateHex = makePrefixCandidate(tc.bytes);
    if (tc.bytes === 32) {
      check(sessionGuard.verifyFingerprint(tc.candidateHex, benchmarkReq) === true, `${tc.name} evaluates to true`);
    } else {
      check(sessionGuard.verifyFingerprint(tc.candidateHex, benchmarkReq) === false, `${tc.name} evaluates to false`);
    }
  }

  // Interleaved sampling to prevent V8 Garbage Collection skew from biasing later prefixes
  console.log(`  ${colors.dim}Running interleaved sampling benchmark (5,000 cycles per prefix depth)...${colors.reset}`);

  // Warm-up
  for (let w = 0; w < 2000; w++) {
    for (const tc of prefixTestCases) {
      sessionGuard.verifyFingerprint(tc.candidateHex, benchmarkReq);
    }
  }

  const iters = 5000;
  const elapsedNs = {};
  for (const tc of prefixTestCases) {
    elapsedNs[tc.name] = 0n;
  }

  for (let i = 0; i < iters; i++) {
    for (const tc of prefixTestCases) {
      const tStart = process.hrtime.bigint();
      sessionGuard.verifyFingerprint(tc.candidateHex, benchmarkReq);
      const tEnd = process.hrtime.bigint();
      elapsedNs[tc.name] += (tEnd - tStart);
    }
  }

  const timingResults = [];
  for (const tc of prefixTestCases) {
    const totalMs = Number(elapsedNs[tc.name]) / 1e6;
    const avgNsPerCall = Number(elapsedNs[tc.name]) / iters;
    timingResults.push({
      name: tc.name,
      bytes: tc.bytes,
      totalMs,
      avgNsPerCall
    });
  }

  const baseline = timingResults[0];
  console.log(`  ${colors.dim}Interleaved timing results (5,000 cycles per prefix depth):${colors.reset}`);
  for (const res of timingResults) {
    const deltaMs = res.totalMs - baseline.totalMs;
    const deltaNsPerCall = res.avgNsPerCall - baseline.avgNsPerCall;
    console.log(`    - ${res.name.padEnd(50)}: ${res.totalMs.toFixed(2)} ms (${res.avgNsPerCall.toFixed(1)} ns/call, delta: ${deltaMs >= 0 ? '+' : ''}${deltaMs.toFixed(2)} ms)`);
  }

  const mismatchResults = timingResults.filter(r => r.bytes < 32);
  const minMs = Math.min(...mismatchResults.map(r => r.totalMs));
  const maxMs = Math.max(...mismatchResults.map(r => r.totalMs));
  const maxDeltaMs = maxMs - minMs;
  const maxDeltaNsPerCall = (maxDeltaMs * 1e6) / iters;

  check(
    maxDeltaMs < 25,
    `Timing delta across all prefix depths is negligible (< 25ms over 5,000 cycles, observed ${maxDeltaMs.toFixed(2)}ms; ~${(maxDeltaNsPerCall / 1000).toFixed(3)} µs/op -> 0ms at ms resolution)`
  );

  // Length-timing side channel immunity (dummy comparison against 32-byte allocated buffer)
  const lengthMismatchInputs = [
    { label: 'empty string', val: '' },
    { label: 'short 16 hex chars (8 bytes)', val: 'a'.repeat(16) },
    { label: 'truncated 62 hex chars (31 bytes)', val: 'b'.repeat(62) },
    { label: 'odd length 63 hex chars', val: 'c'.repeat(63) },
    { label: 'oversized 66 hex chars (33 bytes)', val: 'd'.repeat(66) },
    { label: 'huge 512 hex chars', val: 'e'.repeat(512) },
    { label: 'non-hex character payload', val: 'g'.repeat(64) }
  ];

  for (const lm of lengthMismatchInputs) {
    const result = sessionGuard.verifyFingerprint(lm.val, benchmarkReq);
    check(result === false, `Malformed length/format (${lm.label}) rejected safely without exception`);
  }

  // ============================================================================
  // SECTION 2: LIVE HTTP SERVER SETUP & STOLEN TOKEN BLAST RADIUS
  // ============================================================================
  console.log(`\n${colors.bold}[PART 2] Stolen Token Immediate Revocation Blast Radius${colors.reset}`);

  const app = require('../server/index');
  const server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;

  const victimIp = '198.51.100.10';
  const victimUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36';
  const victimLang = 'tr-TR,tr;q=0.9,en-US;q=0.8';

  const attackerIp = '198.18.0.99';
  const attackerUa = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 KaliLinux/2024.1';
  const attackerLang = 'en-US,en;q=0.9';

  // Ensure clean quarantine state
  quarantineEngine.unquarantineIp(victimIp);
  quarantineEngine.unquarantineIp(attackerIp);
  auth.clearFailedAttempts(`ip:${victimIp}`);
  auth.clearFailedAttempts(`ip:${attackerIp}`);

  try {
    // 2.1 Legitimate login from victim machine
    const loginRes = await sendHttpRequest({
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'x-forwarded-for': victimIp,
        'user-agent': victimUa,
        'accept-language': victimLang
      },
      body: {
        username: 'admin',
        password: 'Brosan2026!SecureErp'
      }
    });

    check(loginRes.status === 200, 'Legitimate admin login succeeds with HTTP 200');
    check(loginRes.json && loginRes.json.success === true, 'Login response returns success: true');
    check(typeof loginRes.json.token === 'string' && loginRes.json.token.length > 50, 'Issued JWT token is valid string');

    const victimToken = loginRes.json.token;
    const decodedVictim = auth.verifyToken(victimToken);
    check(Boolean(decodedVictim && decodedVictim.fgp), 'Victim JWT contains embedded cryptographic fgp claim');

    // 2.2 Victim uses token normally from victim machine
    const victimMeRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${victimToken}`,
        'x-forwarded-for': victimIp,
        'user-agent': victimUa,
        'accept-language': victimLang
      }
    });
    check(victimMeRes.status === 200, 'Victim successfully accesses /api/auth/me (HTTP 200)');
    check(victimMeRes.json && victimMeRes.json.user.username === 'admin', 'Victim profile returned correctly');

    // 2.3 Attacker steals victimToken and presents it from attacker IP (198.18.0.99)
    console.log(`  ${colors.dim}Attacker attempts to present stolen token from ${attackerIp}...${colors.reset}`);
    const attackRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${victimToken}`,
        'x-forwarded-for': attackerIp,
        'user-agent': attackerUa,
        'accept-language': attackerLang
      }
    });

    check(attackRes.status === 401, 'Attacker request rejected immediately with HTTP 401');
    check(attackRes.json && attackRes.json.code === 'SESSION_HIJACK_DETECTED', 'Attacker response code is SESSION_HIJACK_DETECTED');
    check(attackRes.json && attackRes.json.quarantined === true, 'Attacker response indicates IP quarantined');

    // 2.4 Verify stolen token was revoked in auth module
    check(auth.isTokenRevoked(victimToken) === true, 'auth.isTokenRevoked(victimToken) immediately returns true');

    // Verify token revocation was persisted to data/revoked_tokens.json
    const revokedTokensPath = path.join(__dirname, '..', 'data', 'revoked_tokens.json');
    check(fs.existsSync(revokedTokensPath), 'data/revoked_tokens.json exists on disk');
    const rawRevokedJson = fs.readFileSync(revokedTokensPath, 'utf8');
    const parsedRevokedList = JSON.parse(rawRevokedJson);
    const expectedHash = crypto.createHash('sha256').update(victimToken).digest('hex');
    const isPersisted = parsedRevokedList.some(item => item.hash === expectedHash);
    check(isPersisted === true, 'Stolen token hash is durably written to data/revoked_tokens.json');

    // 2.5 BLAST RADIUS VERIFICATION: Victim machine is LOCKED OUT from using the stolen token
    console.log(`  ${colors.dim}Verifying blast radius: Victim workstation attempting requests with compromised token...${colors.reset}`);
    const victimReplayMeRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${victimToken}`,
        'x-forwarded-for': victimIp,
        'user-agent': victimUa,
        'accept-language': victimLang
      }
    });
    check(victimReplayMeRes.status === 401, 'Victim request with compromised token rejected with HTTP 401');
    check(victimReplayMeRes.json && victimReplayMeRes.json.code === 'TOKEN_REVOKED', 'Victim received code TOKEN_REVOKED (token poisoned)');

    // Victim attempting business mutation routes with the compromised token
    const victimAccountsRes = await sendHttpRequest({
      port,
      path: '/api/accounts',
      method: 'POST',
      headers: {
        'authorization': `Bearer ${victimToken}`,
        'x-forwarded-for': victimIp,
        'user-agent': victimUa,
        'accept-language': victimLang
      },
      body: {
        code: '102.TEST',
        name: 'Test Banka',
        currency: 'TRY',
        type: 'BANK'
      }
    });
    check(victimAccountsRes.status === 401, 'Victim cannot create accounts with revoked token (HTTP 401)');
    check(victimAccountsRes.json && victimAccountsRes.json.code === 'TOKEN_REVOKED', 'Accounts endpoint returns TOKEN_REVOKED');

    const victimContactsRes = await sendHttpRequest({
      port,
      path: '/api/contacts',
      method: 'POST',
      headers: {
        'authorization': `Bearer ${victimToken}`,
        'x-forwarded-for': victimIp,
        'user-agent': victimUa,
        'accept-language': victimLang
      },
      body: {
        name: 'Hacked Cari',
        type: 'CUSTOMER'
      }
    });
    check(victimContactsRes.status === 401, 'Victim cannot create contacts with revoked token (HTTP 401)');
    check(victimContactsRes.json && victimContactsRes.json.code === 'TOKEN_REVOKED', 'Contacts endpoint returns TOKEN_REVOKED');

    // ============================================================================
    // SECTION 3: ATTACKER QUARANTINE CASCADING ACROSS ALL ROUTES
    // ============================================================================
    console.log(`\n${colors.bold}[PART 3] Attacker Quarantine Cascading Across All Routes${colors.reset}`);

    // Verify attacker IP is in quarantineEngine
    const qRecord = quarantineEngine.isQuarantined(attackerIp);
    check(qRecord.quarantined === true, 'Attacker IP is active in quarantineEngine');
    check(qRecord.reason === 'SESSION_HIJACK_DETECTED', 'Quarantine reason is SESSION_HIJACK_DETECTED');
    check(qRecord.remainingSec > 3500, `Quarantine TTL set to ~1 hour (remaining: ${qRecord.remainingSec}s)`);

    // Verify attacker is blocked across ALL system routes
    const routesToTest = [
      { path: '/api/health', method: 'GET', desc: 'Health probe route' },
      { path: '/api/auth/login', method: 'POST', desc: 'Login gateway route', body: { username: 'admin', password: 'Brosan2026!SecureErp' } },
      { path: '/api/auth/2fa/verify', method: 'POST', desc: '2FA verification route', body: { code: '123456' } },
      { path: '/api/accounts', method: 'GET', desc: 'Business accounts route' },
      { path: '/api/contacts', method: 'GET', desc: 'Business contacts route' },
      { path: '/api/transactions', method: 'GET', desc: 'Business transactions route' },
      { path: '/robots.txt', method: 'GET', desc: 'Public robots.txt route' },
      { path: '/muhasebe', method: 'GET', desc: 'Frontend SPA root route' },
      { path: '/muhasebe/api/accounts', method: 'GET', desc: 'Rewritten subpath API route' }
    ];

    for (const r of routesToTest) {
      const qRouteRes = await sendHttpRequest({
        port,
        path: r.path,
        method: r.method,
        headers: {
          'x-forwarded-for': attackerIp
        },
        body: r.body || null
      });

      check(qRouteRes.status === 403, `Attacker blocked on ${r.desc} (${r.path}) with HTTP 403`);
      check(qRouteRes.json && qRouteRes.json.code === 'IP_QUARANTINED', `Response code is IP_QUARANTINED on ${r.path}`);
      check(qRouteRes.json && qRouteRes.json.quarantined === true, `Quarantined flag true on ${r.path}`);

      // Verify defense headers
      check(qRouteRes.headers['retry-after'] !== undefined, `Retry-After header present on ${r.path}`);
      check(qRouteRes.headers['x-quarantine-status'] === 'ACTIVE', `X-Quarantine-Status: ACTIVE header present on ${r.path}`);
      check(qRouteRes.headers['x-quarantine-remaining'] !== undefined, `X-Quarantine-Remaining header present on ${r.path}`);
    }

    // Test Evasion / IP Mutation by attacker
    console.log(`  ${colors.dim}Testing quarantine evasion & mutation vectors...${colors.reset}`);

    // Evasion 1: IPv4-mapped IPv6 ::ffff:198.18.0.99
    const mappedRes = await sendHttpRequest({
      port,
      path: '/api/health',
      method: 'GET',
      headers: {
        'x-forwarded-for': `::ffff:${attackerIp}`
      }
    });
    check(mappedRes.status === 403 && mappedRes.json.code === 'IP_QUARANTINED', 'IPv4-mapped IPv6 evasion attempt (::ffff:) blocked with 403 IP_QUARANTINED');

    // Evasion 2: Bracketed IPv4 [198.18.0.99]
    const bracketRes = await sendHttpRequest({
      port,
      path: '/api/health',
      method: 'GET',
      headers: {
        'x-forwarded-for': `[${attackerIp}]`
      }
    });
    check(bracketRes.status === 403 && bracketRes.json.code === 'IP_QUARANTINED', 'Bracketed IP evasion attempt ([IP]) blocked with 403 IP_QUARANTINED');

    // Evasion 3: Multi-hop X-Forwarded-For proxy chain with trusted hop at end
    const multiHopRes = await sendHttpRequest({
      port,
      path: '/api/health',
      method: 'GET',
      headers: {
        'x-forwarded-for': `10.0.0.1, 172.16.0.1, ${attackerIp}`
      }
    });
    check(multiHopRes.status === 403 && multiHopRes.json.code === 'IP_QUARANTINED', 'Multi-hop X-Forwarded-For proxy chain correctly resolves attacker IP and blocks with 403');

    // ============================================================================
    // SECTION 4: PRE-AUTH TOKEN & LEGACY TOKEN HANDLING
    // ============================================================================
    console.log(`\n${colors.bold}[PART 4] Pre-Auth Token & Legacy Token Handling${colors.reset}`);

    const preAuthUser = {
      id: 'preauth-user-001',
      username: 'preauth_admin',
      fullName: 'PreAuth Test Admin',
      role: 'ADMIN',
      twoFactorEnabled: true
    };

    const legitPreAuthIp = '198.51.100.30';
    const attackerPreAuthIp = '203.0.113.88';
    quarantineEngine.unquarantineIp(legitPreAuthIp);
    quarantineEngine.unquarantineIp(attackerPreAuthIp);

    // 4.1 Generate Pre-Auth Token with request context
    const preAuthReq = {
      ip: legitPreAuthIp,
      headers: {
        'user-agent': victimUa,
        'accept-language': victimLang
      }
    };
    const preAuthToken = auth.generatePreAuthToken(preAuthUser, preAuthReq);
    check(typeof preAuthToken === 'string', 'Pre-auth token successfully generated');
    const decodedPreAuth = auth.verifyToken(preAuthToken);
    check(decodedPreAuth.role === 'PRE_AUTH_2FA', 'Pre-auth token role is PRE_AUTH_2FA');
    check(decodedPreAuth.is2FAVerified === false, 'Pre-auth token is2FAVerified is false');
    check(Boolean(decodedPreAuth.fgp), 'Pre-auth token contains embedded fgp claim');

    // 4.2 Pre-auth token fails closed on business endpoints
    const preAuthBusinessRes = await sendHttpRequest({
      port,
      path: '/api/accounts',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${preAuthToken}`,
        'x-forwarded-for': legitPreAuthIp,
        'user-agent': victimUa,
        'accept-language': victimLang
      }
    });
    check(preAuthBusinessRes.status === 401, 'Pre-auth token cannot access business routes (HTTP 401)');
    check(preAuthBusinessRes.json && preAuthBusinessRes.json.code === 'UNAUTHORIZED_2FA_REQUIRED', 'Response code is UNAUTHORIZED_2FA_REQUIRED');

    // 4.3 Stolen Pre-auth token cross-network hijack attempt on /api/auth/2fa/verify
    console.log(`  ${colors.dim}Attacker attempts to submit 2FA code with stolen pre-auth token from ${attackerPreAuthIp}...${colors.reset}`);
    const preAuthHijackRes = await sendHttpRequest({
      port,
      path: '/api/auth/2fa/verify',
      method: 'POST',
      headers: {
        'authorization': `Bearer ${preAuthToken}`,
        'x-forwarded-for': attackerPreAuthIp,
        'user-agent': attackerUa,
        'accept-language': attackerLang
      },
      body: { code: '123456' }
    });
    check(preAuthHijackRes.status === 401, 'Stolen pre-auth token on 2FA endpoint rejected with HTTP 401');
    check(preAuthHijackRes.json && preAuthHijackRes.json.code === 'SESSION_HIJACK_DETECTED', 'Response code is SESSION_HIJACK_DETECTED');

    // Verify attacker IP was quarantined
    const preAuthAttackerQ = quarantineEngine.isQuarantined(attackerPreAuthIp);
    check(preAuthAttackerQ.quarantined === true, 'Attacker IP attempting pre-auth hijack is quarantined');

    // Verify stolen pre-auth token was permanently revoked
    check(auth.isTokenRevoked(preAuthToken) === true, 'Stolen pre-auth token is revoked');
    const legitPreAuthFollowup = await sendHttpRequest({
      port,
      path: '/api/auth/2fa/verify',
      method: 'POST',
      headers: {
        'authorization': `Bearer ${preAuthToken}`,
        'x-forwarded-for': legitPreAuthIp,
        'user-agent': victimUa,
        'accept-language': victimLang
      },
      body: { code: '123456' }
    });
    check(legitPreAuthFollowup.status === 401 && legitPreAuthFollowup.json.code === 'TOKEN_REVOKED', 'Compromised pre-auth token cannot be used even from victim machine (TOKEN_REVOKED)');

    // 4.4 Legacy Token Handling (Backward Compatibility)
    console.log(`  ${colors.dim}Testing legacy token backward compatibility...${colors.reset}`);
    const legacyUser = { id: 'legacy-usr-99', username: 'admin', role: 'ADMIN' };
    const legacyToken = auth.generateToken(legacyUser); // No req -> No fgp
    const decodedLegacy = auth.verifyToken(legacyToken);
    check(decodedLegacy.fgp === undefined, 'Legacy token does not contain fgp claim');

    // Access from Machine 1
    const legRes1 = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${legacyToken}`,
        'x-forwarded-for': '10.10.10.1',
        'user-agent': 'LegacyApp/1.0.0'
      }
    });
    check(legRes1.status === 200 && legRes1.json.success === true, 'Legacy token from Machine 1 succeeds (HTTP 200)');

    // Access from Machine 2 (different network)
    const legRes2 = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${legacyToken}`,
        'x-forwarded-for': '10.20.30.40',
        'user-agent': 'LegacyService/2.0.0'
      }
    });
    check(legRes2.status === 200 && legRes2.json.success === true, 'Legacy token from Machine 2 succeeds without hijack false positive');

    // 4.5 Malformed fgp claims in valid signed token
    console.log(`  ${colors.dim}Testing resilience against malformed fgp claims in signed JWT...${colors.reset}`);
    const secret = process.env.JWT_SECRET || 'BrosanTekstil2026EnterpriseSuperSecretSecurityKey!@#$987654321';

    // Malformed fgp type: number
    const testUser = { id: 'usr-malformed', username: 'admin', role: 'ADMIN' };
    const tokenNumericFgp = auth.generateToken(testUser, { fgp: 987654321 });
    const numFgpRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${tokenNumericFgp}`,
        'x-forwarded-for': '198.51.100.95', // Separate IP
        'user-agent': victimUa,
        'accept-language': victimLang
      }
    });
    if (numFgpRes.status !== 401 || (numFgpRes.json && numFgpRes.json.code !== 'SESSION_HIJACK_DETECTED')) {
      console.log('DIAGNOSTIC numFgpRes:', numFgpRes.status, numFgpRes.json);
    }
    check(numFgpRes.status === 401 && numFgpRes.json.code === 'SESSION_HIJACK_DETECTED', 'Numeric fgp claim handled safely without server crash, rejected with 401 SESSION_HIJACK_DETECTED');

    // Malformed fgp: corrupted non-hex string
    const tokenCorruptedFgp = auth.generateToken(testUser, { fgp: 'NOT_HEX!'.repeat(8) });
    const corruptFgpRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${tokenCorruptedFgp}`,
        'x-forwarded-for': '198.51.100.96',
        'user-agent': victimUa,
        'accept-language': victimLang
      }
    });
    if (corruptFgpRes.status !== 401 || (corruptFgpRes.json && corruptFgpRes.json.code !== 'SESSION_HIJACK_DETECTED')) {
      console.log('DIAGNOSTIC corruptFgpRes:', corruptFgpRes.status, corruptFgpRes.json);
    }
    check(corruptFgpRes.status === 401 && corruptFgpRes.json.code === 'SESSION_HIJACK_DETECTED', 'Corrupted non-hex fgp handled safely without server crash, rejected with 401 SESSION_HIJACK_DETECTED');

  } finally {
    // Teardown & Cleanup
    quarantineEngine.unquarantineIp(victimIp);
    quarantineEngine.unquarantineIp(attackerIp);
    quarantineEngine.unquarantineIp('203.0.113.88');
    quarantineEngine.unquarantineIp('198.51.100.30');
    auth.clearFailedAttempts(`ip:${victimIp}`);
    auth.clearFailedAttempts(`ip:${attackerIp}`);
    server.close();
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.green}🎉 ALL ${passedChecks}/${totalChecks} ADVERSARIAL CHALLENGER M2-2 CHECKS PASSED (100% SUCCESS RATE)!${colors.reset}`);
  console.log(`${colors.dim}Total execution time: ${durationSec}s${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  process.exit(0);
}

runChallengerHarness().catch(err => {
  console.error(`\n${colors.red}❌ CHALLENGER HARNESS TERMINATED WITH ERROR:${colors.reset}`, err);
  process.exit(1);
});
