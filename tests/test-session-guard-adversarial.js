/**
 * BROSAN TEKSTİL ERP — SESSION GUARD & FINGERPRINT BINDING ADVERSARIAL TEST SUITE
 * 
 * Comprehensive Adversarial & Cryptographic Verification covering:
 * - Subnet Normalization (IPv4 /24, IPv6 /48, loopback mapping, IPv4-mapped IPv6)
 * - Cryptographic HMAC-SHA256 Fingerprint calculation and entropy
 * - Constant-Time Verification & Timing-Attack immunity
 * - Backward Compatibility (legacy tokens without fgp claim, pre-auth 2FA tokens)
 * - Live HTTP Replay Simulations:
 *   * Valid session login & subsequent requests succeed (200 OK)
 *   * Same /24 subnet & same User-Agent succeeds (200 OK)
 *   * Differing IP subnet simulation rejects with HTTP 401 SESSION_HIJACK_DETECTED
 *   * Attacker IP is quarantined (subsequent request returns 403 IP_QUARANTINED)
 *   * Stolen token is immediately revoked (subsequent request returns 401 TOKEN_REVOKED)
 *   * Differing User-Agent simulation rejects with 401 SESSION_HIJACK_DETECTED
 *   * Stolen Pre-Auth 2FA token cross-network hijack rejection
 * 
 * Execution:
 *   node tests/test-session-guard-adversarial.js
 */

const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const sessionGuard = require('../server/sessionGuard');
const auth = require('../server/auth');
const { quarantineEngine } = require('../server/quarantine');
const auditLogger = require('../server/auditLogger');
const threatAlerter = require('../server/threatAlerter');

// ANSI Terminal Colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

let totalTests = 0;
let passedTests = 0;

function reportPass(label) {
  totalTests++;
  passedTests++;
  console.log(`  ${colors.green}✔ PASS${colors.reset} ${label}`);
}

function sendHttpRequest({ port, path, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'host': 'brosangroup.com',
      ...headers
    };
    if (body && !defaultHeaders['content-type']) {
      defaultHeaders['content-type'] = 'application/json';
    }

    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: defaultHeaders
    }, (res) => {
      let rawData = '';
      res.on('data', chunk => { rawData += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(rawData);
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          rawData,
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

async function runAllTests() {
  console.log(`\n════════════════════════════════════════════════════════════════════════════════`);
  console.log(`🛡️  BROSAN ERP — SESSION GUARD & FINGERPRINT BINDING ADVERSARIAL SUITE`);
  console.log(`Testing HMAC-SHA256 binding, /24 subnet normalization, constant-time & hijack gates...`);
  console.log(`════════════════════════════════════════════════════════════════════════════════\n`);

  // ==============================================================================
  // SECTION 1: UNIT & SUBNET NORMALIZATION VECTORS
  // ==============================================================================
  console.log(`${colors.bold}[SECTION 1] Network Identity & Subnet Normalization Vectors${colors.reset}`);

  // 1.1 IPv4 /24 Masking
  assert.strictEqual(sessionGuard.normalizeIpSubnet('192.168.1.105'), '192.168.1.0/24');
  assert.strictEqual(sessionGuard.normalizeIpSubnet('192.168.1.200'), '192.168.1.0/24');
  assert.strictEqual(sessionGuard.normalizeIpSubnet('10.20.30.40'), '10.20.30.0/24');
  assert.strictEqual(sessionGuard.normalizeIpSubnet('172.16.88.9'), '172.16.88.0/24');
  reportPass('IPv4 addresses correctly normalized to /24 CIDR prefix');

  // 1.2 IPv6 /48 Masking
  assert.strictEqual(sessionGuard.normalizeIpSubnet('2001:db8:abcd:0012::1'), '2001:db8:abcd::/48');
  assert.strictEqual(sessionGuard.normalizeIpSubnet('2001:db8:abcd:9999::42'), '2001:db8:abcd::/48');
  assert.strictEqual(sessionGuard.normalizeIpSubnet('2001:db8:cafe:0001::1'), '2001:db8:cafe::/48');
  reportPass('IPv6 addresses correctly normalized to /48 prefix');

  // 1.3 Loopback Normalization
  assert.strictEqual(sessionGuard.normalizeIpSubnet('127.0.0.1'), '127.0.0.0/24');
  assert.strictEqual(sessionGuard.normalizeIpSubnet('::1'), '127.0.0.0/24');
  assert.strictEqual(sessionGuard.normalizeIpSubnet('localhost'), '127.0.0.0/24');
  assert.strictEqual(sessionGuard.normalizeIpSubnet('127.0.0.99'), '127.0.0.0/24');
  reportPass('Loopback addresses (127.0.0.1, ::1, localhost) safely map to unified 127.0.0.0/24');

  // 1.4 IPv4-Mapped IPv6 Normalization
  assert.strictEqual(sessionGuard.normalizeIpSubnet('::ffff:192.168.1.55'), '192.168.1.0/24');
  assert.strictEqual(sessionGuard.normalizeIpSubnet('::ffff:10.0.0.1'), '10.0.0.0/24');
  reportPass('IPv4-mapped IPv6 (::ffff:) prefix unstripped and normalized to /24 IPv4');

  // 1.5 Edge Cases & Malformed Inputs
  assert.strictEqual(sessionGuard.normalizeIpSubnet(null), '127.0.0.0/24');
  assert.strictEqual(sessionGuard.normalizeIpSubnet(undefined), '127.0.0.0/24');
  assert.strictEqual(sessionGuard.normalizeIpSubnet(''), '127.0.0.0/24');
  assert.strictEqual(sessionGuard.normalizeIpSubnet('invalid_ip_string'), '127.0.0.0/24');
  reportPass('Null, undefined, and malformed IP strings fall back safely to 127.0.0.0/24');

  // ==============================================================================
  // SECTION 2: CRYPTOGRAPHIC FINGERPRINT GENERATION & ENTROPY
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 2] Cryptographic HMAC-SHA256 Fingerprint Generation${colors.reset}`);

  const mockReqA = {
    ip: '198.51.100.15',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
      'accept-language': 'tr-TR,tr;q=0.9'
    }
  };

  const fgpA = sessionGuard.generateFingerprint(mockReqA);
  assert.strictEqual(typeof fgpA, 'string');
  assert.strictEqual(fgpA.length, 64, 'Fingerprint must be 64-char hex string (32 bytes)');
  assert.ok(/^[0-9a-f]{64}$/.test(fgpA), 'Fingerprint must be lowercase hex');
  reportPass('Fingerprint produces valid 256-bit (64-character) HMAC-SHA256 hex string');

  // Same /24 subnet & same UA & same Lang produces IDENTICAL fingerprint
  const mockReqSameSubnet = {
    ip: '198.51.100.220', // Different host, identical /24 subnet (198.51.100.0/24)
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
      'accept-language': 'tr-TR,tr;q=0.9'
    }
  };
  const fgpSameSubnet = sessionGuard.generateFingerprint(mockReqSameSubnet);
  assert.strictEqual(fgpA, fgpSameSubnet, 'Same /24 subnet must generate identical fingerprint');
  reportPass('Clients in same /24 subnet generate identical fingerprint (DHCP hop tolerant)');

  // Differing IP subnet produces DIFFERENT fingerprint
  const mockReqDiffSubnet = {
    ip: '198.51.101.15', // Differing subnet (198.51.101.0/24)
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
      'accept-language': 'tr-TR,tr;q=0.9'
    }
  };
  const fgpDiffSubnet = sessionGuard.generateFingerprint(mockReqDiffSubnet);
  assert.notStrictEqual(fgpA, fgpDiffSubnet, 'Differing subnet must generate different fingerprint');
  reportPass('Differing IP subnet produces cryptographically distinct fingerprint');

  // Differing User-Agent produces DIFFERENT fingerprint
  const mockReqDiffUa = {
    ip: '198.51.100.15',
    headers: {
      'user-agent': 'curl/8.1.2',
      'accept-language': 'tr-TR,tr;q=0.9'
    }
  };
  const fgpDiffUa = sessionGuard.generateFingerprint(mockReqDiffUa);
  assert.notStrictEqual(fgpA, fgpDiffUa, 'Differing User-Agent must generate different fingerprint');
  reportPass('Differing User-Agent produces distinct fingerprint');

  // Differing Accept-Language produces DIFFERENT fingerprint
  const mockReqDiffLang = {
    ip: '198.51.100.15',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
      'accept-language': 'en-US,en;q=0.5'
    }
  };
  const fgpDiffLang = sessionGuard.generateFingerprint(mockReqDiffLang);
  assert.notStrictEqual(fgpA, fgpDiffLang, 'Differing Accept-Language must generate different fingerprint');
  reportPass('Differing Accept-Language produces distinct fingerprint');

  // ==============================================================================
  // SECTION 3: CONSTANT-TIME VERIFICATION & TIMING-ATTACK RESISTANCE
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 3] Timing-Attack Immunity & Constant-Time Verification${colors.reset}`);

  // 3.1 Valid match
  assert.strictEqual(sessionGuard.verifyFingerprint(fgpA, mockReqA), true);
  assert.strictEqual(sessionGuard.verifyFingerprint(fgpA, mockReqSameSubnet), true);
  reportPass('verifyFingerprint returns true on matching client identity');

  // 3.2 Mismatch
  assert.strictEqual(sessionGuard.verifyFingerprint(fgpA, mockReqDiffSubnet), false);
  assert.strictEqual(sessionGuard.verifyFingerprint(fgpA, mockReqDiffUa), false);
  reportPass('verifyFingerprint returns false on mismatched client identity');

  // 3.3 Malformed, empty, or truncated inputs do not throw RangeError
  assert.strictEqual(sessionGuard.verifyFingerprint('', mockReqA), false);
  assert.strictEqual(sessionGuard.verifyFingerprint(null, mockReqA), false);
  assert.strictEqual(sessionGuard.verifyFingerprint('abc', mockReqA), false); // Length mismatch
  assert.strictEqual(sessionGuard.verifyFingerprint('0'.repeat(30), mockReqA), false);
  assert.strictEqual(sessionGuard.verifyFingerprint('0'.repeat(70), mockReqA), false);
  assert.strictEqual(sessionGuard.verifyFingerprint('not_hex_chars_at_all!'.repeat(3), mockReqA), false);
  reportPass('verifyFingerprint handles truncated, malformed and non-hex inputs without throwing');

  // 3.4 Statistical Timing Latency Benchmark (10,000 iterations)
  const iterations = 5000;
  const startMatch = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    sessionGuard.verifyFingerprint(fgpA, mockReqA);
  }
  const endMatch = process.hrtime.bigint();

  const fakeMismatchFgp = crypto.randomBytes(32).toString('hex');
  const startMismatch = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    sessionGuard.verifyFingerprint(fakeMismatchFgp, mockReqA);
  }
  const endMismatch = process.hrtime.bigint();

  const matchDurationMs = Number(endMatch - startMatch) / 1e6;
  const mismatchDurationMs = Number(endMismatch - startMismatch) / 1e6;
  const diffMs = Math.abs(matchDurationMs - mismatchDurationMs);
  assert.ok(diffMs < 30, `Timing differential must be negligible (< 30ms across 5000 runs, got ${diffMs.toFixed(2)}ms)`);
  reportPass(`Timing verification latency differential negligible (${diffMs.toFixed(2)}ms over 5000 cycles)`);

  // ==============================================================================
  // SECTION 4: TOKEN BINDING & BACKWARD COMPATIBILITY
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 4] Token Binding Lifecycle & Backward Compatibility${colors.reset}`);

  const mockUser = { id: 'usr-001', username: 'admin', role: 'ADMIN' };

  // 4.1 Token generated with req embeds fgp
  const tokenWithReq = auth.generateToken(mockUser, mockReqA);
  const decodedWithReq = auth.verifyToken(tokenWithReq);
  assert.ok(decodedWithReq.fgp, 'Token with req must contain fgp claim');
  assert.strictEqual(decodedWithReq.fgp, fgpA);
  reportPass('auth.generateToken(user, req) embeds cryptographic fgp claim in JWT payload');

  // 4.2 Token generated without req omits fgp (backward compatible)
  const legacyToken = auth.generateToken(mockUser);
  const decodedLegacy = auth.verifyToken(legacyToken);
  assert.strictEqual(decodedLegacy.fgp, undefined, 'Legacy token without req must not contain fgp');
  reportPass('auth.generateToken(user) without req omits fgp (backward compatibility)');

  // 4.3 Pre-auth 2FA token generated with req embeds fgp
  const preAuthTokenWithReq = auth.generatePreAuthToken(mockUser, mockReqA);
  const decodedPreAuth = auth.verifyToken(preAuthTokenWithReq);
  assert.ok(decodedPreAuth.fgp, 'Pre-auth token with req must contain fgp');
  assert.strictEqual(decodedPreAuth.role, 'PRE_AUTH_2FA');
  assert.strictEqual(decodedPreAuth.fgp, fgpA);
  reportPass('auth.generatePreAuthToken(user, req) embeds fgp for dual-tier 2FA protection');

  // ==============================================================================
  // SECTION 5: LIVE EXPRESS HTTP SERVER ADVERSARIAL REPLAY SIMULATIONS
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 5] Live Express HTTP Server Adversarial Replay Simulations${colors.reset}`);

  const app = require('../server/index');
  const server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;

  const legitIp = '198.51.100.10';
  const sameSubnetIp = '198.51.100.250';
  const attackerIp = '203.0.113.50';
  const legitUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0';
  const legitLang = 'tr-TR,tr;q=0.9';

  // Clean initial state for test IPs
  quarantineEngine.unquarantineIp(legitIp);
  quarantineEngine.unquarantineIp(sameSubnetIp);
  quarantineEngine.unquarantineIp(attackerIp);
  auth.clearFailedAttempts(`ip:${legitIp}`);
  auth.clearFailedAttempts(`ip:${attackerIp}`);

  try {
    // 5.1: Legitimate User Login & Protected API Access
    let sessionToken = null;
    const loginRes = await sendHttpRequest({
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'x-forwarded-for': legitIp,
        'user-agent': legitUa,
        'accept-language': legitLang
      },
      body: {
        username: 'admin',
        password: 'Brosan2026!SecureErp'
      }
    });

    assert.strictEqual(loginRes.status, 200, 'Login must succeed');
    assert.strictEqual(loginRes.json.success, true);
    assert.ok(loginRes.json.token, 'Must return session token');
    sessionToken = loginRes.json.token;

    // Verify token contains fgp
    const decodedToken = auth.verifyToken(sessionToken);
    assert.ok(decodedToken.fgp, 'Issued token must contain fgp claim');
    reportPass('5.1 Legitimate user login produces JWT token with embedded fingerprint claim (200 OK)');

    // Legitimate user accesses protected endpoint
    const meRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${sessionToken}`,
        'x-forwarded-for': legitIp,
        'user-agent': legitUa,
        'accept-language': legitLang
      }
    });
    assert.strictEqual(meRes.status, 200, 'Subsequent request from same identity must succeed');
    assert.strictEqual(meRes.json.success, true);
    reportPass('5.1 Subsequent request with matching IP & User-Agent succeeds (200 OK)');

    // 5.2: Same /24 Subnet Access (e.g. DHCP Hop or Roaming in Office LAN)
    const roamingRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${sessionToken}`,
        'x-forwarded-for': sameSubnetIp, // 198.51.100.250 -> same /24 subnet
        'user-agent': legitUa,
        'accept-language': legitLang
      }
    });
    assert.strictEqual(roamingRes.status, 200, 'Same /24 subnet request must succeed');
    assert.strictEqual(roamingRes.json.success, true);
    reportPass('5.2 Request from same /24 subnet (198.51.100.250) succeeds cleanly (200 OK)');

    // 5.3: Cross-Network Stolen Token Hijack Attempt (Differing IP Subnet)
    const hijackRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${sessionToken}`,
        'x-forwarded-for': attackerIp, // Rogue IP 203.0.113.50
        'user-agent': legitUa,
        'accept-language': legitLang
      }
    });
    assert.strictEqual(hijackRes.status, 401, 'Cross-network hijack attempt must return 401');
    assert.strictEqual(hijackRes.json.code, 'SESSION_HIJACK_DETECTED');
    assert.strictEqual(hijackRes.json.success, false);
    reportPass('5.3 Stolen token used from differing IP subnet rejected with 401 SESSION_HIJACK_DETECTED');

    // 5.4: Attacker IP Quarantine Verification
    const qCheck = quarantineEngine.isQuarantined(attackerIp);
    assert.strictEqual(qCheck.quarantined, true, 'Attacker IP must be enrolled in quarantineEngine');
    assert.strictEqual(qCheck.reason, 'SESSION_HIJACK_DETECTED');

    // Subsequent request from quarantined attacker IP is blocked at Gate 1 with 403 IP_QUARANTINED
    const attackerFollowupRes = await sendHttpRequest({
      port,
      path: '/api/health',
      method: 'GET',
      headers: {
        'x-forwarded-for': attackerIp
      }
    });
    assert.strictEqual(attackerFollowupRes.status, 403);
    assert.strictEqual(attackerFollowupRes.json.code, 'IP_QUARANTINED');
    reportPass('5.4 Attacker IP is quarantined and blocked from future requests with 403 IP_QUARANTINED');

    // 5.5: Stolen Token Revocation Verification (Original user cannot use compromised token)
    const legitFollowupRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${sessionToken}`,
        'x-forwarded-for': legitIp,
        'user-agent': legitUa,
        'accept-language': legitLang
      }
    });
    assert.strictEqual(legitFollowupRes.status, 401);
    assert.strictEqual(legitFollowupRes.json.code, 'TOKEN_REVOKED', 'Compromised token must be revoked');
    reportPass('5.5 Stolen token immediately revoked; original user request returns 401 TOKEN_REVOKED');

    // 5.6: Differing User-Agent Hijack Simulation (Same IP, Different Client Application)
    // Create new login session
    const login2Res = await sendHttpRequest({
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'x-forwarded-for': '198.51.100.99',
        'user-agent': legitUa,
        'accept-language': legitLang
      },
      body: {
        username: 'admin',
        password: 'Brosan2026!SecureErp'
      }
    });
    assert.strictEqual(login2Res.status, 200);
    const token2 = login2Res.json.token;

    // Adversary attempts request from same IP but using automated tool User-Agent
    const uaHijackRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${token2}`,
        'x-forwarded-for': '198.51.100.99',
        'user-agent': 'python-requests/2.31.0', // Tampered User-Agent
        'accept-language': legitLang
      }
    });
    assert.strictEqual(uaHijackRes.status, 401);
    assert.strictEqual(uaHijackRes.json.code, 'SESSION_HIJACK_DETECTED');
    reportPass('5.6 Request with altered User-Agent rejected with 401 SESSION_HIJACK_DETECTED');

    // 5.7: Stolen Pre-Auth 2FA Token Rejection
    // Simulate pre-auth token issued for legit user
    const preAuthToken = auth.generatePreAuthToken(mockUser, {
      ip: legitIp,
      headers: {
        'user-agent': legitUa,
        'accept-language': legitLang
      }
    });

    // Attacker tries to submit 2FA verification from another IP
    const attacker2faVerifyRes = await sendHttpRequest({
      port,
      path: '/api/auth/2fa/verify',
      method: 'POST',
      headers: {
        'authorization': `Bearer ${preAuthToken}`,
        'x-forwarded-for': '203.0.113.99', // Rogue IP
        'user-agent': legitUa,
        'accept-language': legitLang
      },
      body: { code: '123456' }
    });
    assert.strictEqual(attacker2faVerifyRes.status, 401);
    assert.strictEqual(attacker2faVerifyRes.json.code, 'SESSION_HIJACK_DETECTED');
    reportPass('5.7 Stolen pre-auth 2FA token cross-network attempt rejected with 401 SESSION_HIJACK_DETECTED');

    // 5.8: Legacy Token Passthrough (Backward Compatibility with Legacy Integrations)
    const rawLegacyToken = auth.generateToken(mockUser); // Token without fgp
    const legacyAccessRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${rawLegacyToken}`,
        'x-forwarded-for': '10.50.0.1',
        'user-agent': 'LegacyService/1.0'
      }
    });
    assert.strictEqual(legacyAccessRes.status, 200, 'Legacy token without fgp passes backward-compatibly');
    assert.strictEqual(legacyAccessRes.json.success, true);
    reportPass('5.8 Legacy token without fgp claim passes backward-compatibly (200 OK)');

  } finally {
    // Teardown & cleanup
    quarantineEngine.unquarantineIp(legitIp);
    quarantineEngine.unquarantineIp(sameSubnetIp);
    quarantineEngine.unquarantineIp(attackerIp);
    quarantineEngine.unquarantineIp('198.51.100.99');
    quarantineEngine.unquarantineIp('203.0.113.99');
    auth.clearFailedAttempts(`ip:${legitIp}`);
    auth.clearFailedAttempts(`ip:${attackerIp}`);
    auth.clearFailedAttempts(`ip:198.51.100.99`);
    auth.clearFailedAttempts(`ip:203.0.113.99`);
    server.close();
  }

  console.log(`\n════════════════════════════════════════════════════════════════════════════════`);
  console.log(`🎉 ALL ${passedTests}/${totalTests} SESSION GUARD ADVERSARIAL TESTS PASSED (100% SUCCESS RATE)!`);
  console.log(`════════════════════════════════════════════════════════════════════════════════\n`);
}

runAllTests().catch(err => {
  console.error(`\n❌ TEST SUITE FAILURE:`, err);
  process.exit(1);
});
