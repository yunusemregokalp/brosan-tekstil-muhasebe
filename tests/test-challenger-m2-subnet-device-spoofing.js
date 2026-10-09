/**
 * BROSAN TEKSTİL ERP — PHASE 4 CITADEL ZERO-TRUST SECURITY HARDENING
 * CHALLENGER M2-1: SUBNET & DEVICE SPOOFING ADVERSARIAL TEST HARNESS
 * 
 * Target: Requirement R2 (server/sessionGuard.js, server/auth.js)
 * 
 * Adversarial Attack Vectors Verified:
 * 1. Intra-Subnet vs Inter-Subnet /24 IPv4 Boundary Hops:
 *    - Intra-subnet hosts (e.g. 198.51.100.1 vs 198.51.100.254, .0 network, .255 broadcast) -> 200 OK
 *    - Inter-subnet hops (198.51.100.1 vs 198.51.101.1, 198.51.99.254, 10.0.0.1 vs 10.0.1.1) -> 401 SESSION_HIJACK_DETECTED
 *    - IPv4 leading zero normalization, malformed octets, and fallback safety
 * 2. IPv6 Prefix /48 Boundary Tests:
 *    - Intra-prefix hops (2001:0db8:85a3:: vs 2001:db8:85a3::1, bracketed [2001:db8:85a3::1], tail variations) -> Match
 *    - Inter-prefix hops (3rd group boundary +1 /48: 2001:db8:85a3:: vs 2001:db8:85a4::1, 2nd group, 1st group) -> Mismatch
 *    - Short IPv6 zero-expansion, IPv4-mapped IPv6 (::ffff:), and unified loopback (::1 -> 127.0.0.0/24)
 * 3. Mobile Roaming & Carrier Simulation:
 *    - Mobile CGNAT intra-subnet roaming (176.240.10.15 -> 176.240.10.88 within /24) -> Frictionless 200 OK
 *    - Inter-subnet APN roaming & Wi-Fi to Cellular handoff -> Fail-closed Zero-Trust boundary (401 SESSION_HIJACK_DETECTED)
 *    - Multi-carrier token theft simulation (Vodafone vs Turkcell) -> Blocked, token revoked, attacker quarantined
 * 4. Spoofed X-Forwarded-For Headers & Proxy Bypass:
 *    - Attacker prepending victim IP (X-Forwarded-For: 198.51.100.10, 203.0.113.88) -> Extracts trusted hop 203.0.113.88
 *    - Multi-hop proxy chain with spaces & commas -> Clean extraction of trusted hop
 *    - Malicious non-IP payload injection in XFF -> Regex rejected, safe fallback
 * 5. Device Fingerprint Manipulation:
 *    - User-Agent mutations (minor patch bump, browser family, OS platform, case mutation, whitespace trimming)
 *    - Accept-Language shifts (quality factor q=0.9 vs q=0.8, locale en-US vs tr-TR, subtag tr vs tr-TR, omitted)
 *    - Multi-vector compound matrix (Only exact Subnet + UA + Lang triplet passes)
 * 6. Live Express Server Tri-Fold Incident Response & Lifecycle:
 *    - Automatic token revocation, 1-hour IP quarantine, SIEM audit logging, threat alerting
 *    - Subsequent victim request returns 401 TOKEN_REVOKED
 *    - Subsequent attacker request returns 403 IP_QUARANTINED
 * 7. Master Suites Regression Verification
 */

const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');
const path = require('path');

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
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m'
};

let totalChecks = 0;
let passedChecks = 0;
const failureList = [];

function check(testId, description, passed, error = null) {
  totalChecks++;
  if (passed) {
    passedChecks++;
    console.log(`  ${colors.green}✔ PASS${colors.reset} [${testId}] ${description}`);
  } else {
    failureList.push({ testId, description, error: error ? error.message : 'Assertion failed' });
    console.error(`  ${colors.red}✖ FAIL${colors.reset} [${testId}] ${description}`);
    if (error) console.error(`    ${colors.dim}${error.stack || error.message}${colors.reset}`);
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
          rawData: data,
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
  console.log(`${colors.bold}⚔️  CHALLENGER M2-1: SUBNET & DEVICE SPOOFING ADVERSARIAL TEST HARNESS${colors.reset}`);
  console.log(`${colors.dim}Target: server/sessionGuard.js & server/auth.js (Requirement R2 Session Hijacking Guard)${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  const startTime = Date.now();

  // ==============================================================================
  // SECTION 1: INTRA-SUBNET VS INTER-SUBNET /24 IPV4 BOUNDARY HOPS
  // ==============================================================================
  console.log(`${colors.bold}[SECTION 1] Intra-Subnet vs Inter-Subnet /24 IPv4 Boundary Hops${colors.reset}`);

  const baseUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';
  const baseLang = 'tr-TR,tr;q=0.9,en-US;q=0.8';

  // 1.1 Baseline request from 198.51.100.1
  const req1_1 = { ip: '198.51.100.1', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  const fgp1_1 = sessionGuard.generateFingerprint(req1_1);
  check('SUB-01', 'IPv4 198.51.100.1 generates valid 64-char hex HMAC-SHA256 fingerprint', 
    typeof fgp1_1 === 'string' && fgp1_1.length === 64 && /^[0-9a-f]{64}$/.test(fgp1_1));

  // 1.2 Intra-subnet high host: 198.51.100.254 (same /24 subnet: 198.51.100.0/24)
  const req1_2 = { ip: '198.51.100.254', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  const fgp1_2 = sessionGuard.generateFingerprint(req1_2);
  check('SUB-02', 'Intra-subnet high host 198.51.100.254 matches 198.51.100.1 fingerprint (DHCP/LAN tolerant)', 
    fgp1_1 === fgp1_2 && sessionGuard.verifyFingerprint(fgp1_1, req1_2));

  // 1.3 Intra-subnet network address 198.51.100.0
  const req1_3 = { ip: '198.51.100.0', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  const fgp1_3 = sessionGuard.generateFingerprint(req1_3);
  check('SUB-03', 'Intra-subnet network address 198.51.100.0 matches same /24 fingerprint', 
    fgp1_1 === fgp1_3 && sessionGuard.verifyFingerprint(fgp1_1, req1_3));

  // 1.4 Intra-subnet broadcast address 198.51.100.255
  const req1_4 = { ip: '198.51.100.255', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  const fgp1_4 = sessionGuard.generateFingerprint(req1_4);
  check('SUB-04', 'Intra-subnet broadcast address 198.51.100.255 matches same /24 fingerprint', 
    fgp1_1 === fgp1_4 && sessionGuard.verifyFingerprint(fgp1_1, req1_4));

  // 1.5 Inter-subnet boundary hop +1: 198.51.101.1 (/24 boundary jump)
  const req1_5 = { ip: '198.51.101.1', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  const fgp1_5 = sessionGuard.generateFingerprint(req1_5);
  check('SUB-05', 'Inter-subnet +1 hop 198.51.101.1 produces distinct fingerprint and fails verification', 
    fgp1_1 !== fgp1_5 && !sessionGuard.verifyFingerprint(fgp1_1, req1_5));

  // 1.6 Inter-subnet boundary hop -1: 198.51.99.254 (/24 boundary jump)
  const req1_6 = { ip: '198.51.99.254', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  const fgp1_6 = sessionGuard.generateFingerprint(req1_6);
  check('SUB-06', 'Inter-subnet -1 hop 198.51.99.254 produces distinct fingerprint and fails verification', 
    fgp1_1 !== fgp1_6 && !sessionGuard.verifyFingerprint(fgp1_1, req1_6));

  // 1.7 Class A boundary jump: 10.0.0.1 vs 10.0.1.1
  const req1_7a = { ip: '10.0.0.1', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  const req1_7b = { ip: '10.0.1.1', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  check('SUB-07', 'Class A subnet jump 10.0.0.1 vs 10.0.1.1 fails verification', 
    sessionGuard.generateFingerprint(req1_7a) !== sessionGuard.generateFingerprint(req1_7b));

  // 1.8 Class B boundary jump: 172.16.50.10 vs 172.16.51.10
  const req1_8a = { ip: '172.16.50.10', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  const req1_8b = { ip: '172.16.51.10', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  check('SUB-08', 'Class B subnet jump 172.16.50.10 vs 172.16.51.10 fails verification', 
    sessionGuard.generateFingerprint(req1_8a) !== sessionGuard.generateFingerprint(req1_8b));

  // 1.9 Leading zeroes in octets: 198.51.100.05 normalized to decimal without octal distortion
  const subNormalized05 = sessionGuard.normalizeIpSubnet('198.51.100.05');
  check('SUB-09', 'Leading zero in octet 198.51.100.05 parses safely to 198.51.100.0/24', 
    subNormalized05 === '198.51.100.0/24');

  // 1.10 Out-of-range octets fallback: 198.51.100.300 and 256.1.1.1
  const subOutOfRange = sessionGuard.normalizeIpSubnet('198.51.100.300');
  const subOutOfRange2 = sessionGuard.normalizeIpSubnet('256.1.1.1');
  check('SUB-10', 'Out-of-range octets safely fall back to loopback 127.0.0.0/24', 
    subOutOfRange === '127.0.0.0/24' && subOutOfRange2 === '127.0.0.0/24');

  // ==============================================================================
  // SECTION 2: IPV6 PREFIX /48 BOUNDARY TESTS & NORMALIZATION
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 2] IPv6 Prefix /48 Boundary Tests & Normalization${colors.reset}`);

  // 2.1 Full standard IPv6 vs compressed format (same /48 prefix 2001:db8:85a3::/48)
  const fullIpv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
  const compIpv6 = '2001:db8:85a3::1';
  const subFull = sessionGuard.normalizeIpSubnet(fullIpv6);
  const subComp = sessionGuard.normalizeIpSubnet(compIpv6);
  check('IPV6-01', 'Full and compressed IPv6 forms normalize to identical 2001:db8:85a3::/48', 
    subFull === '2001:db8:85a3::/48' && subComp === '2001:db8:85a3::/48');

  const req2_1a = { ip: fullIpv6, headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  const req2_1b = { ip: compIpv6, headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  check('IPV6-02', 'Full and compressed IPv6 share identical HMAC fingerprint', 
    sessionGuard.generateFingerprint(req2_1a) === sessionGuard.generateFingerprint(req2_1b));

  // 2.2 Intra-prefix high boundary in /48: 2001:db8:85a3:ffff:ffff:ffff:ffff:ffff
  const highIpv6 = '2001:db8:85a3:ffff:ffff:ffff:ffff:ffff';
  const subHigh = sessionGuard.normalizeIpSubnet(highIpv6);
  check('IPV6-03', 'Intra-prefix max host 2001:db8:85a3:ffff:... normalizes to 2001:db8:85a3::/48', 
    subHigh === '2001:db8:85a3::/48');

  // 2.3 Bracketed notation: [2001:db8:85a3::1]
  const bracketedIpv6 = '[2001:db8:85a3::1]';
  const subBracketed = sessionGuard.normalizeIpSubnet(bracketedIpv6);
  check('IPV6-04', 'Bracketed IPv6 notation [2001:db8:85a3::1] strips brackets to 2001:db8:85a3::/48', 
    subBracketed === '2001:db8:85a3::/48');

  // 2.4 Inter-prefix /48 boundary hop +1 in 3rd group: 2001:db8:85a4::1
  const req2_4 = { ip: '2001:db8:85a4::1', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  const sub2_4 = sessionGuard.normalizeIpSubnet('2001:db8:85a4::1');
  check('IPV6-05', 'Inter-prefix 3rd group boundary +1 yields 2001:db8:85a4::/48 and fails verification', 
    sub2_4 === '2001:db8:85a4::/48' && !sessionGuard.verifyFingerprint(sessionGuard.generateFingerprint(req2_1b), req2_4));

  // 2.5 Inter-prefix /48 boundary hop -1 in 3rd group: 2001:db8:85a2:ffff::1
  const req2_5 = { ip: '2001:db8:85a2:ffff::1', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  const sub2_5 = sessionGuard.normalizeIpSubnet('2001:db8:85a2:ffff::1');
  check('IPV6-06', 'Inter-prefix 3rd group boundary -1 yields 2001:db8:85a2::/48 and fails verification', 
    sub2_5 === '2001:db8:85a2::/48' && !sessionGuard.verifyFingerprint(sessionGuard.generateFingerprint(req2_1b), req2_5));

  // 2.6 Inter-prefix 1st/2nd group mutations: 2001:db9:85a3::1 and 2002:db8:85a3::1
  const req2_6a = { ip: '2001:db9:85a3::1', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  const req2_6b = { ip: '2002:db8:85a3::1', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  check('IPV6-07', 'Major group boundary shifts fail verification against baseline /48', 
    !sessionGuard.verifyFingerprint(sessionGuard.generateFingerprint(req2_1b), req2_6a) &&
    !sessionGuard.verifyFingerprint(sessionGuard.generateFingerprint(req2_1b), req2_6b));

  // 2.7 Short IPv6 zero-expansion: 2001:db8::1 (2001:db8:0::/48) vs 2001:db8:1::1 (2001:db8:1::/48)
  const req2_7a = { ip: '2001:db8::1', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  const req2_7b = { ip: '2001:db8:1::1', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  check('IPV6-08', 'Short IPv6 addresses expand zeros correctly to differentiate 2001:db8:0::/48 and 2001:db8:1::/48', 
    sessionGuard.normalizeIpSubnet('2001:db8::1') === '2001:db8:0::/48' &&
    sessionGuard.normalizeIpSubnet('2001:db8:1::1') === '2001:db8:1::/48' &&
    sessionGuard.generateFingerprint(req2_7a) !== sessionGuard.generateFingerprint(req2_7b));

  // 2.8 IPv4-mapped IPv6: ::ffff:198.51.100.1 unstrips to 198.51.100.0/24
  const req2_8 = { ip: '::ffff:198.51.100.1', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  check('IPV6-09', 'IPv4-mapped IPv6 ::ffff:198.51.100.1 unmaps to 198.51.100.0/24 and matches IPv4 198.51.100.254', 
    sessionGuard.normalizeIpSubnet('::ffff:198.51.100.1') === '198.51.100.0/24' &&
    sessionGuard.verifyFingerprint(sessionGuard.generateFingerprint(req1_2), req2_8));

  // 2.9 Unified loopback mapping: ::1 matches 127.0.0.1 and localhost
  const subLoopV6 = sessionGuard.normalizeIpSubnet('::1');
  const subLoopV4 = sessionGuard.normalizeIpSubnet('127.0.0.1');
  check('IPV6-10', 'IPv6 loopback ::1 unifies cleanly to 127.0.0.0/24 matching 127.0.0.1', 
    subLoopV6 === '127.0.0.0/24' && subLoopV4 === '127.0.0.0/24');

  // ==============================================================================
  // SECTION 3: MOBILE ROAMING & CARRIER SIMULATION
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 3] Mobile Roaming & Carrier Simulation${colors.reset}`);

  const mobileUa = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36';
  const mobileLang = 'tr-TR,tr;q=0.9';

  // 3.1 Mobile CGNAT Intra-Subnet Roaming: User roams between cell towers in same /24 CGNAT block (176.240.10.15 -> 176.240.10.88)
  const mobileLegitTowerA = { ip: '176.240.10.15', headers: { 'user-agent': mobileUa, 'accept-language': mobileLang } };
  const mobileLegitTowerB = { ip: '176.240.10.88', headers: { 'user-agent': mobileUa, 'accept-language': mobileLang } };
  const mobileFgp = sessionGuard.generateFingerprint(mobileLegitTowerA);
  check('MOB-01', 'Mobile CGNAT intra-subnet roaming within 176.240.10.0/24 maintains session fingerprint', 
    sessionGuard.verifyFingerprint(mobileFgp, mobileLegitTowerB));

  // 3.2 Mobile CGNAT Inter-Subnet APN Transition: Carrier rotates IP to different /24 pool (176.240.10.15 -> 176.240.20.15)
  const mobileTowerC = { ip: '176.240.20.15', headers: { 'user-agent': mobileUa, 'accept-language': mobileLang } };
  check('MOB-02', 'Inter-subnet carrier APN transition (176.240.20.15) fails verification (Fail-Closed Zero-Trust)', 
    !sessionGuard.verifyFingerprint(mobileFgp, mobileTowerC));

  // 3.3 Corporate Wi-Fi to 5G Cellular Handover: Office Wi-Fi (212.156.40.10) to Cellular (176.240.10.15)
  const officeWifiReq = { ip: '212.156.40.10', headers: { 'user-agent': mobileUa, 'accept-language': mobileLang } };
  const officeFgp = sessionGuard.generateFingerprint(officeWifiReq);
  check('MOB-03', 'Wi-Fi to Cellular network jump prevents cross-network token hijacking without re-auth', 
    !sessionGuard.verifyFingerprint(officeFgp, mobileLegitTowerA));

  // 3.4 Cross-Carrier Rogue Token Replay: Attacker on Vodafone (176.240.50.99) presents token stolen from Turkcell (176.240.10.15)
  const rogueVodafoneReq = { ip: '176.240.50.99', headers: { 'user-agent': mobileUa, 'accept-language': mobileLang } };
  check('MOB-04', 'Rogue mobile carrier token replay rejected by session guard', 
    !sessionGuard.verifyFingerprint(mobileFgp, rogueVodafoneReq));

  // ==============================================================================
  // SECTION 4: SPOOFED X-FORWARDED-FOR HEADERS & REVERSE PROXY BYPASS VECTORS
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 4] Spoofed X-Forwarded-For Headers & Proxy Bypass Vectors${colors.reset}`);

  // 4.1 Attacker prepends victim IP: X-Forwarded-For: 198.51.100.10, 203.0.113.88
  // Under single-hop trust proxy architecture, getClientIp must extract the trusted rightmost client hop (203.0.113.88)
  const spoofReq1 = {
    headers: {
      'x-forwarded-for': '198.51.100.10, 203.0.113.88',
      'user-agent': baseUa,
      'accept-language': baseLang
    }
  };
  const extractedIp1 = sessionGuard.getClientIp(spoofReq1);
  check('XFF-01', 'getClientIp extracts trusted rightmost hop 203.0.113.88 thwarting prepended spoofed IP', 
    extractedIp1 === '203.0.113.88');

  // Verify that an attacker sending this header cannot validate against victim's fingerprint (198.51.100.0/24)
  const victimReq = { ip: '198.51.100.10', headers: { 'user-agent': baseUa, 'accept-language': baseLang } };
  const victimFgp = sessionGuard.generateFingerprint(victimReq);
  check('XFF-02', 'Attacker sending spoofed X-Forwarded-For fails fingerprint verification against victim', 
    !sessionGuard.verifyFingerprint(victimFgp, spoofReq1));

  // 4.2 Multi-hop proxy chain with spaces & internal proxies: " 198.51.100.10 , 10.0.0.1 , 172.16.0.1 , 203.0.113.88 "
  const spoofReq2 = {
    headers: {
      'x-forwarded-for': ' 198.51.100.10 , 10.0.0.1 , 172.16.0.1 , 203.0.113.88 ',
      'user-agent': baseUa,
      'accept-language': baseLang
    }
  };
  const extractedIp2 = sessionGuard.getClientIp(spoofReq2);
  check('XFF-03', 'Multi-hop chain with whitespaces cleanly resolves rightmost hop 203.0.113.88', 
    extractedIp2 === '203.0.113.88');

  // 4.3 Trailing commas and empty hops: "198.51.100.10, , 203.0.113.88, "
  const spoofReq3 = {
    headers: {
      'x-forwarded-for': '198.51.100.10, , 203.0.113.88, ',
      'user-agent': baseUa,
      'accept-language': baseLang
    }
  };
  const extractedIp3 = sessionGuard.getClientIp(spoofReq3);
  check('XFF-04', 'Trailing commas and empty hops filtered safely to extract 203.0.113.88', 
    extractedIp3 === '203.0.113.88');

  // 4.4 Non-IP malicious injection in XFF: "198.51.100.10, <script>alert(1)</script>"
  const spoofReq4 = {
    headers: {
      'x-forwarded-for': '198.51.100.10, <script>alert(1)</script>',
      'user-agent': baseUa,
      'accept-language': baseLang
    }
  };
  const extractedIp4 = sessionGuard.getClientIp(spoofReq4);
  check('XFF-05', 'Malicious non-IP payload in XFF rejected by regex validator; falls back safely to 127.0.0.1', 
    extractedIp4 === '127.0.0.1');

  // 4.5 Null or empty XFF handling
  check('XFF-06', 'Empty or missing XFF falls back safely to 127.0.0.1 without throwing', 
    sessionGuard.getClientIp({ headers: { 'x-forwarded-for': '' } }) === '127.0.0.1' &&
    sessionGuard.getClientIp({ headers: {} }) === '127.0.0.1' &&
    sessionGuard.getClientIp(null) === '127.0.0.1');

  // ==============================================================================
  // SECTION 5: DEVICE FINGERPRINT MANIPULATION (USER-AGENT & ACCEPT-LANGUAGE)
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 5] Device Fingerprint Manipulation (User-Agent & Accept-Language)${colors.reset}`);

  const testIp = '198.51.100.50';
  const baselineReq = {
    ip: testIp,
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.6099.109 Safari/537.36',
      'accept-language': 'tr-TR,tr;q=0.9,en-US;q=0.8'
    }
  };
  const baselineFgp = sessionGuard.generateFingerprint(baselineReq);

  // 5.1 Minor patch version bump: Chrome/120.0.6099.109 -> Chrome/120.0.6099.110
  const req5_1 = {
    ip: testIp,
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.6099.110 Safari/537.36',
      'accept-language': 'tr-TR,tr;q=0.9,en-US;q=0.8'
    }
  };
  check('DEV-01', 'Minor browser patch bump produces distinct fingerprint and fails verification', 
    !sessionGuard.verifyFingerprint(baselineFgp, req5_1));

  // 5.2 Browser family mutation: Chrome -> Firefox
  const req5_2 = {
    ip: testIp,
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'accept-language': 'tr-TR,tr;q=0.9,en-US;q=0.8'
    }
  };
  check('DEV-02', 'Browser family shift (Chrome to Firefox) fails verification', 
    !sessionGuard.verifyFingerprint(baselineFgp, req5_2));

  // 5.3 OS Platform mutation: Windows NT 10.0 -> iPhone iOS 17.1
  const req5_3 = {
    ip: testIp,
    headers: {
      'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      'accept-language': 'tr-TR,tr;q=0.9,en-US;q=0.8'
    }
  };
  check('DEV-03', 'Operating system mutation (Windows to iOS) fails verification', 
    !sessionGuard.verifyFingerprint(baselineFgp, req5_3));

  // 5.4 Case sensitivity mutation: "mozilla/5.0..." vs "Mozilla/5.0..."
  const req5_4 = {
    ip: testIp,
    headers: {
      'user-agent': 'mozilla/5.0 (windows nt 10.0; win64; x64) chrome/120.0.6099.109 safari/537.36',
      'accept-language': 'tr-TR,tr;q=0.9,en-US;q=0.8'
    }
  };
  check('DEV-04', 'Case alteration in User-Agent header fails verification (strictly canonical)', 
    !sessionGuard.verifyFingerprint(baselineFgp, req5_4));

  // 5.5 Whitespace trimming resilience: User-Agent with surrounding spaces normalizes to identical canonical
  const req5_5 = {
    ip: testIp,
    headers: {
      'user-agent': '  Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.6099.109 Safari/537.36  ',
      'accept-language': '  tr-TR,tr;q=0.9,en-US;q=0.8  '
    }
  };
  check('DEV-05', 'Leading/trailing whitespace in headers is trimmed and matches baseline', 
    sessionGuard.verifyFingerprint(baselineFgp, req5_5));

  // 5.6 Missing User-Agent header (falls back to UNKNOWN_UA)
  const req5_6 = {
    ip: testIp,
    headers: {
      'accept-language': 'tr-TR,tr;q=0.9,en-US;q=0.8'
    }
  };
  check('DEV-06', 'Omitted User-Agent header fails verification against baseline', 
    !sessionGuard.verifyFingerprint(baselineFgp, req5_6));

  // 5.7 Accept-Language quality weight shift: q=0.9 vs q=0.8
  const req5_7 = {
    ip: testIp,
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.6099.109 Safari/537.36',
      'accept-language': 'tr-TR,tr;q=0.8,en-US;q=0.8'
    }
  };
  check('DEV-07', 'Quality weight shift (q=0.9 -> q=0.8) produces distinct fingerprint and fails verification', 
    !sessionGuard.verifyFingerprint(baselineFgp, req5_7));

  // 5.8 Accept-Language locale shift: tr-TR vs en-US
  const req5_8 = {
    ip: testIp,
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.6099.109 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9'
    }
  };
  check('DEV-08', 'Locale shift (tr-TR to en-US) fails verification', 
    !sessionGuard.verifyFingerprint(baselineFgp, req5_8));

  // 5.9 Accept-Language subtag truncation: tr-TR vs tr
  const req5_9 = {
    ip: testIp,
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.6099.109 Safari/537.36',
      'accept-language': 'tr,en-US;q=0.8'
    }
  };
  check('DEV-09', 'Language subtag shift (tr-TR to tr) fails verification', 
    !sessionGuard.verifyFingerprint(baselineFgp, req5_9));

  // 5.10 Missing Accept-Language header (falls back to DEFAULT_LANG)
  const req5_10 = {
    ip: testIp,
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.6099.109 Safari/537.36'
    }
  };
  check('DEV-10', 'Omitted Accept-Language header fails verification against baseline', 
    !sessionGuard.verifyFingerprint(baselineFgp, req5_10));

  // 5.11 Multi-Vector Compound Matrix
  // Permutation A: Matching Subnet + Mutated UA + Matching Lang -> MUST FAIL
  const req5_11a = { ip: '198.51.100.200', headers: { 'user-agent': 'curl/8.4.0', 'accept-language': 'tr-TR,tr;q=0.9,en-US;q=0.8' } };
  // Permutation B: Matching Subnet + Matching UA + Mutated Lang -> MUST FAIL
  const req5_11b = { ip: '198.51.100.200', headers: { 'user-agent': baselineReq.headers['user-agent'], 'accept-language': 'fr-FR,fr;q=0.9' } };
  // Permutation C: Differing Subnet + Matching UA + Matching Lang -> MUST FAIL
  const req5_11c = { ip: '198.51.102.50', headers: baselineReq.headers };
  // Permutation D: Matching Subnet + Matching UA + Matching Lang -> MUST PASS
  const req5_11d = { ip: '198.51.100.200', headers: baselineReq.headers };

  check('DEV-11', 'Combinatorial matrix: Only exact (Subnet + UA + Lang) triplet succeeds; any single variance is rejected', 
    !sessionGuard.verifyFingerprint(baselineFgp, req5_11a) &&
    !sessionGuard.verifyFingerprint(baselineFgp, req5_11b) &&
    !sessionGuard.verifyFingerprint(baselineFgp, req5_11c) &&
    sessionGuard.verifyFingerprint(baselineFgp, req5_11d));

  // ==============================================================================
  // SECTION 6: LIVE EXPRESS SERVER ADVERSARIAL REPLAY & TRI-FOLD INCIDENT RESPONSE
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 6] Live Express Server Adversarial Replay & Tri-Fold Incident Response${colors.reset}`);

  const app = require('../server/index');
  const server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;

  const testVictimIp = '198.51.100.77';
  const testSameSubnetIp = '198.51.100.188';
  const testAttackerIp = '203.0.113.199';
  const testUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36';
  const testLang = 'tr-TR,tr;q=0.9';

  // Clean initial state for test entities
  quarantineEngine.unquarantineIp(testVictimIp);
  quarantineEngine.unquarantineIp(testSameSubnetIp);
  quarantineEngine.unquarantineIp(testAttackerIp);
  auth.clearFailedAttempts(`ip:${testVictimIp}`);
  auth.clearFailedAttempts(`ip:${testAttackerIp}`);

  try {
    // 6.1 Legitimate login creates token with embedded HMAC fingerprint
    const loginRes = await sendHttpRequest({
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'x-forwarded-for': testVictimIp,
        'user-agent': testUa,
        'accept-language': testLang
      },
      body: { username: 'admin', password: 'Brosan2026!SecureErp' }
    });

    check('LIVE-01', 'Live login produces HTTP 200 with JWT containing cryptographic fgp claim', 
      loginRes.status === 200 && loginRes.json?.token && auth.verifyToken(loginRes.json.token)?.fgp);

    const token = loginRes.json.token;

    // 6.2 Legitimate subsequent API request succeeds
    const meRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${token}`,
        'x-forwarded-for': testVictimIp,
        'user-agent': testUa,
        'accept-language': testLang
      }
    });
    check('LIVE-02', 'Subsequent API request with identical network identity succeeds with HTTP 200 OK', 
      meRes.status === 200 && meRes.json?.success === true);

    // 6.3 Intra-subnet roaming request (198.51.100.188) succeeds cleanly
    const roamingRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${token}`,
        'x-forwarded-for': testSameSubnetIp,
        'user-agent': testUa,
        'accept-language': testLang
      }
    });
    check('LIVE-03', 'Intra-subnet roaming request (same /24 subnet) succeeds with HTTP 200 OK', 
      roamingRes.status === 200 && roamingRes.json?.success === true);

    // 6.4 Inter-subnet attack: Attacker at 203.0.113.199 uses stolen token
    const hijackRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${token}`,
        'x-forwarded-for': testAttackerIp,
        'user-agent': testUa,
        'accept-language': testLang
      }
    });
    check('LIVE-04', 'Stolen token presented from differing subnet is rejected with HTTP 401 SESSION_HIJACK_DETECTED', 
      hijackRes.status === 401 && hijackRes.json?.code === 'SESSION_HIJACK_DETECTED');

    // 6.5 Incident Response 1: Attacker IP is quarantined for 1 hour
    const qRecord = quarantineEngine.isQuarantined(testAttackerIp);
    check('LIVE-05', 'Incident Response: Attacker IP 203.0.113.199 is immediately quarantined in quarantineEngine', 
      qRecord.quarantined === true && qRecord.reason === 'SESSION_HIJACK_DETECTED');

    // 6.6 Incident Response 2: Subsequent request from quarantined attacker IP is dropped with 403 IP_QUARANTINED
    const attackerNextRes = await sendHttpRequest({
      port,
      path: '/api/health',
      method: 'GET',
      headers: { 'x-forwarded-for': testAttackerIp }
    });
    check('LIVE-06', 'Incident Response: Subsequent request from attacker IP receives HTTP 403 IP_QUARANTINED', 
      attackerNextRes.status === 403 && attackerNextRes.json?.code === 'IP_QUARANTINED');

    // 6.7 Incident Response 3: Stolen token is immediately revoked in blacklist
    check('LIVE-07', 'Incident Response: Stolen token is immediately registered in auth.isTokenRevoked blacklist', 
      auth.isTokenRevoked(token) === true);

    // 6.8 Incident Response 4: Victim presenting revoked token receives HTTP 401 TOKEN_REVOKED
    const victimFollowupRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${token}`,
        'x-forwarded-for': testVictimIp,
        'user-agent': testUa,
        'accept-language': testLang
      }
    });
    check('LIVE-08', 'Incident Response: Compromised token is unusable even by original victim (HTTP 401 TOKEN_REVOKED)', 
      victimFollowupRes.status === 401 && victimFollowupRes.json?.code === 'TOKEN_REVOKED');

    // 6.9 Live User-Agent mutation attack on separate session
    const loginRes2 = await sendHttpRequest({
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'x-forwarded-for': '198.51.100.90',
        'user-agent': testUa,
        'accept-language': testLang
      },
      body: { username: 'admin', password: 'Brosan2026!SecureErp' }
    });
    const token2 = loginRes2.json?.token;

    const uaAttackRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${token2}`,
        'x-forwarded-for': '198.51.100.90',
        'user-agent': 'python-requests/2.31.0',
        'accept-language': testLang
      }
    });
    check('LIVE-09', 'Live request with mutated User-Agent rejected with HTTP 401 SESSION_HIJACK_DETECTED', 
      uaAttackRes.status === 401 && uaAttackRes.json?.code === 'SESSION_HIJACK_DETECTED');

    // 6.10 Live Accept-Language shift attack
    const loginRes3 = await sendHttpRequest({
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'x-forwarded-for': '198.51.100.91',
        'user-agent': testUa,
        'accept-language': testLang
      },
      body: { username: 'admin', password: 'Brosan2026!SecureErp' }
    });
    const token3 = loginRes3.json?.token;

    const langAttackRes = await sendHttpRequest({
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'authorization': `Bearer ${token3}`,
        'x-forwarded-for': '198.51.100.91',
        'user-agent': testUa,
        'accept-language': 'en-GB,en;q=0.5'
      }
    });
    check('LIVE-10', 'Live request with shifted Accept-Language rejected with HTTP 401 SESSION_HIJACK_DETECTED', 
      langAttackRes.status === 401 && langAttackRes.json?.code === 'SESSION_HIJACK_DETECTED');

    // 6.11 Live Pre-Auth 2FA token cross-network attack
    const preAuthToken = auth.generatePreAuthToken({ id: 'u1', username: 'admin' }, {
      ip: testVictimIp,
      headers: { 'user-agent': testUa, 'accept-language': testLang }
    });
    const preAuthAttackRes = await sendHttpRequest({
      port,
      path: '/api/auth/2fa/verify',
      method: 'POST',
      headers: {
        'authorization': `Bearer ${preAuthToken}`,
        'x-forwarded-for': '203.0.113.222',
        'user-agent': testUa,
        'accept-language': testLang
      },
      body: { code: '123456' }
    });
    check('LIVE-11', 'Cross-network hijacking of pre-auth 2FA token rejected with HTTP 401 SESSION_HIJACK_DETECTED', 
      preAuthAttackRes.status === 401 && preAuthAttackRes.json?.code === 'SESSION_HIJACK_DETECTED');

  } finally {
    // Teardown & clean state
    quarantineEngine.unquarantineIp(testVictimIp);
    quarantineEngine.unquarantineIp(testSameSubnetIp);
    quarantineEngine.unquarantineIp(testAttackerIp);
    quarantineEngine.unquarantineIp('198.51.100.90');
    quarantineEngine.unquarantineIp('198.51.100.91');
    quarantineEngine.unquarantineIp('203.0.113.222');
    auth.clearFailedAttempts(`ip:${testVictimIp}`);
    auth.clearFailedAttempts(`ip:${testAttackerIp}`);
    server.close();
  }

  // ==============================================================================
  // SECTION 7: MASTER SUITES REGRESSION CONFIRMATION
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 7] Master Test Suites Regression Confirmation${colors.reset}`);

  // 7.1 Existing adversarial session guard suite
  let sessionAdversarialPassed = false;
  try {
    execSync('node tests/test-session-guard-adversarial.js', { stdio: 'pipe', cwd: path.resolve(__dirname, '..') });
    sessionAdversarialPassed = true;
  } catch (_) {
    sessionAdversarialPassed = false;
  }
  check('REG-01', 'Existing tests/test-session-guard-adversarial.js passes 100% with exit code 0', sessionAdversarialPassed);

  // 7.2 Milestone verification
  let verifyM1M2Passed = false;
  try {
    execSync('node tests/verify_m1_m2.js', { stdio: 'pipe', cwd: path.resolve(__dirname, '..') });
    verifyM1M2Passed = true;
  } catch (_) {
    verifyM1M2Passed = false;
  }
  check('REG-02', 'tests/verify_m1_m2.js passes with exit code 0', verifyM1M2Passed);

  // 7.3 Master unified runner
  let runAllPassed = false;
  try {
    const out = execSync('node tests/run-all-tests.js', { stdio: 'pipe', cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
    runAllPassed = out.includes('ALL UNIT, RED-TEAM PENETRATION, AND E2E TEST SUITES PASSED 100%');
  } catch (_) {
    runAllPassed = false;
  }
  check('REG-03', 'tests/run-all-tests.js executes with exit code 0 and 100% pass threshold', runAllPassed);

  // ==============================================================================
  // SUMMARY REPORT
  // ==============================================================================
  const duration = Date.now() - startTime;
  console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}CHALLENGER M2-1 EMPIRICAL VERIFICATION REPORT SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  Total Adversarial Checks : ${totalChecks}`);
  console.log(`  Passed Checks            : ${colors.green}${passedChecks}${colors.reset}`);
  console.log(`  Failed Checks            : ${failureList.length > 0 ? colors.red + failureList.length + colors.reset : '0'}`);
  console.log(`  Execution Duration       : ${duration}ms`);
  const verdict = failureList.length === 0 ? 'APPROVE' : 'REQUEST_CHANGES';
  const verdictColor = verdict === 'APPROVE' ? colors.green : colors.red;
  console.log(`  Final Verdict            : ${colors.bold}${verdictColor}${verdict}${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  if (failureList.length > 0) {
    console.error('Failure Details:');
    failureList.forEach(f => console.error(`  - [${f.testId}] ${f.description}: ${f.error}`));
    throw new Error(`${failureList.length} adversarial tests failed`);
  }

  return { totalChecks, passedChecks, verdict, duration };
}

if (require.main === module) {
  runChallengerHarness()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal challenge harness error:', err.message);
      process.exit(1);
    });
}

module.exports = { runChallengerHarness };
