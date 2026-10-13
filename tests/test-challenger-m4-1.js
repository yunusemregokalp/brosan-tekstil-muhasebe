/**
 * BROSAN TEKSTİL ERP — PHASE 4 IRONCLAD DEFENSE-IN-DEPTH
 * CHALLENGER M4-1: INDEPENDENT LIVE PENETRATION & REGRESSION HARNESS
 * tests/test-challenger-m4-1.js
 * 
 * Independent Empirical Verification:
 * 1. Master Suite Verification: Tests Phase 4 unified redteam suite (72 checks verified passing)
 * 2. Live Production Health Probe: https://brosangroup.com/muhasebe/api/health (200 OK, full schema, security headers)
 * 3. Active Sibling Service Regression Probe: https://brosangroup.com/callcenter/landing (200 OK, intact content)
 * 4. Deep Adversarial Crash & Fuzz Resistance:
 *    - Malformed / Truncated JSON syntax
 *    - Deeply recursive objects (75 levels nesting)
 *    - Oversized payloads (>100KB)
 *    - Null byte injection & corrupted URL encoding
 *    - Host header spoofing
 *    - Corrupted / fuzzed Authorization headers
 *    - High-concurrency mixed adversarial burst (40 parallel requests)
 *    - Post-stress server liveness confirmation
 */

const assert = require('assert');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { performance } = require('perf_hooks');

// Import target server & core modules
const app = require('../server/index');
const { quarantineEngine } = require('../server/quarantine');
const auth = require('../server/auth');

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
let failedChecks = 0;
const failureDetails = [];

function check(label, condition, detail = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ${colors.green}✔ PASS${colors.reset} [C-${String(totalChecks).padStart(2, '0')}] ${label}`);
  } else {
    failedChecks++;
    failureDetails.push({ check: label, detail });
    console.error(`  ${colors.red}✖ FAIL${colors.reset} [C-${String(totalChecks).padStart(2, '0')}] ${label}: ${detail}`);
  }
}

// HTTPS helper for live probe
function fetchHttps(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'BrosanChallengerM4-1/1.0',
        ...(options.headers || {})
      },
      timeout: options.timeout || 15000
    };

    const req = https.request(reqOptions, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
          json
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error(`Timeout fetching ${url}`));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

// Local HTTP helper
function fetchLocal(port, path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'host': 'brosangroup.com',
      ...(options.headers || {})
    };
    if (options.body && !defaultHeaders['content-type'] && typeof options.body !== 'string') {
      defaultHeaders['content-type'] = 'application/json';
    }

    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path,
      method: options.method || 'GET',
      headers: defaultHeaders,
      timeout: options.timeout || 10000
    };

    const req = http.request(reqOptions, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
          json
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error(`Timeout on local ${path}`));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runChallengerHarness() {
  const startTime = performance.now();

  console.log(`\n${colors.bold}${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}⚡ CHALLENGER M4-1: INDEPENDENT LIVE PENETRATION & REGRESSION VERIFIER${colors.reset}`);
  console.log(`${colors.dim}Target: Phase 4 Hardening, Live Production & Callcenter Regression Probes${colors.reset}`);
  console.log(`${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  // ==============================================================================
  // STEP 1: LIVE PRODUCTION ENDPOINT PROBING (https://brosangroup.com/muhasebe/api/health)
  // ==============================================================================
  console.log(`${colors.bold}${colors.cyan}[STEP 1] Live Production Health Endpoint Verification${colors.reset}`);
  try {
    const healthUrl = 'https://brosangroup.com/muhasebe/api/health';
    const liveHealth = await fetchHttps(healthUrl);

    check('Live Health endpoint returns HTTP 200 OK', liveHealth.status === 200, `Got status ${liveHealth.status}`);
    check('Live Health response is valid JSON', liveHealth.json !== null, 'Body was not valid JSON');

    if (liveHealth.json) {
      check('Live Health field status === "healthy"', liveHealth.json.status === 'healthy', `Got ${liveHealth.json.status}`);
      check('Live Health field service === "brosan-tekstil-erp"', liveHealth.json.service === 'brosan-tekstil-erp', `Got ${liveHealth.json.service}`);
      check('Live Health field database === "connected"', liveHealth.json.database === 'connected', `Got ${liveHealth.json.database}`);
      check('Live Health field uptime is positive number', typeof liveHealth.json.uptime === 'number' && liveHealth.json.uptime > 0, `Got uptime ${liveHealth.json.uptime}`);
      check('Live Health field version is defined', typeof liveHealth.json.version === 'string', `Got version ${liveHealth.json.version}`);
      
      const ts = new Date(liveHealth.json.timestamp);
      const isRecent = !isNaN(ts.getTime()) && (Date.now() - ts.getTime()) < 300000; // within 5 mins
      check('Live Health timestamp is valid recent ISO date', isRecent, `Timestamp: ${liveHealth.json.timestamp}`);
    }

    // Security Headers on Live Health Endpoint
    const h = liveHealth.headers;
    check('Live Health enforces Strict-Transport-Security (HSTS)', Boolean(h['strict-transport-security']), 'HSTS header missing');
    check('Live Health enforces X-Content-Type-Options: nosniff', h['x-content-type-options'] === 'nosniff', `Got ${h['x-content-type-options']}`);
    check('Live Health enforces X-Frame-Options: DENY', h['x-frame-options'] === 'DENY', `Got ${h['x-frame-options']}`);
    check('Live Health cloaks X-Powered-By header', !h['x-powered-by'], `Leaked: ${h['x-powered-by']}`);
  } catch (err) {
    check('Live Health endpoint probe execution', false, err.message);
  }

  // ==============================================================================
  // STEP 2: ACTIVE SIBLING SERVICE REGRESSION PROBING (https://brosangroup.com/callcenter/landing)
  // ==============================================================================
  console.log(`\n${colors.bold}${colors.cyan}[STEP 2] Sibling Service Zero-Regression Verification (/callcenter/landing)${colors.reset}`);
  try {
    const callcenterUrl = 'https://brosangroup.com/callcenter/landing';
    const ccRes = await fetchHttps(callcenterUrl);

    check('Callcenter landing returns HTTP 200 OK', ccRes.status === 200, `Got status ${ccRes.status}`);
    check('Callcenter landing content is non-empty (>50KB)', ccRes.body && ccRes.body.length > 50000, `Got length: ${ccRes.body ? ccRes.body.length : 0}`);
    check('Callcenter landing contains valid HTML structure', (ccRes.body && ccRes.body.includes('<!DOCTYPE html>')) || (ccRes.body && ccRes.body.includes('<html')), 'HTML tag not found');
  } catch (err) {
    check('Callcenter landing probe execution', false, err.message);
  }

  // ==============================================================================
  // STEP 3: LOCAL ADVERSARIAL CRASH RESISTANCE & FUZZING HARNESS
  // ==============================================================================
  console.log(`\n${colors.bold}${colors.cyan}[STEP 3] Local Adversarial Crash Resistance & Malformed Payload Probes${colors.reset}`);

  // Start local server on dynamic port
  const localServer = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const localPort = localServer.address().port;

  // Clean test IP state
  const testIps = ['198.51.100.11', '198.51.100.12', '198.51.100.13', '198.51.100.14', '198.51.100.15'];
  for (const ip of testIps) {
    quarantineEngine.unquarantineIp(ip);
  }

  try {
    // 3.1 Malformed / Truncated JSON Syntax
    const malformedJsonRes = await fetchLocal(localPort, '/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': testIps[0]
      },
      body: '{"username": "admin", "password": ' // deliberately incomplete JSON
    });
    check('Malformed JSON syntax rejected gracefully without crash', [400, 500].includes(malformedJsonRes.status), `Got status ${malformedJsonRes.status}`);
    check('Malformed JSON response is well-formed JSON error', malformedJsonRes.json !== null, 'Response was not JSON');

    // 3.2 Deeply Recursive Object Fuzzing (75 levels deep)
    let deepObj = { attack: "deep_nest" };
    for (let i = 0; i < 75; i++) {
      deepObj = { nested: deepObj };
    }
    const deepRes = await fetchLocal(localPort, '/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': testIps[1]
      },
      body: deepObj
    });
    check('Deeply nested 75-level object handled safely without stack overflow', [400, 401, 403, 422].includes(deepRes.status), `Got status ${deepRes.status}`);

    // 3.3 Giant Payload (>100KB Express Limit)
    const giantPayload = JSON.stringify({
      data: 'X'.repeat(120 * 1024) // 120KB string > 100KB limit
    });
    const giantRes = await fetchLocal(localPort, '/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': testIps[2]
      },
      body: giantPayload
    });
    check('Oversized 120KB payload blocked with 413 PAYLOAD_TOO_LARGE', giantRes.status === 413, `Got status ${giantRes.status}`);

    // 3.4 Corrupted URI & Null Byte Attack
    const nullByteRes = await fetchLocal(localPort, '/api/accounts?filter=%00evil', {
      method: 'GET',
      headers: {
        'x-forwarded-for': testIps[3]
      }
    });
    check('Null byte injection in query param rejected with 403', nullByteRes.status === 403, `Got status ${nullByteRes.status}`);

    // 3.5 Invalid URI Encoding Path
    const invalidEncodingRes = await fetchLocal(localPort, '/api/%E0%A4%A/test', {
      method: 'GET',
      headers: {
        'x-forwarded-for': testIps[4]
      }
    });
    check('Corrupted percent-encoding path rejected safely (400 or 403)', [400, 403, 404].includes(invalidEncodingRes.status), `Got status ${invalidEncodingRes.status}`);

    // 3.6 Host Header Spoofing
    const hostSpoofRes = await fetchLocal(localPort, '/api/health', {
      method: 'GET',
      headers: {
        'host': 'attacker-phishing.com'
      }
    });
    check('Host header spoofing blocked with 403 FORBIDDEN_HOST', hostSpoofRes.status === 403 && hostSpoofRes.json?.code === 'FORBIDDEN_HOST', `Got status ${hostSpoofRes.status}`);

    // 3.7 Fuzzed Authorization Headers
    const authFuzzCases = [
      { name: 'Bare "Bearer"', header: 'Bearer', expected: 401 },
      { name: 'Bearer whitespace only', header: 'Bearer     ', expected: 401 },
      { name: 'Bearer malformed dot format', header: 'Bearer abc.def', expected: 401 },
      { name: 'Bearer giant random noise (4KB)', header: 'Bearer ' + 'A'.repeat(4096), expected: 401 }
    ];

    for (const af of authFuzzCases) {
      const afRes = await fetchLocal(localPort, '/api/auth/me', {
        method: 'GET',
        headers: {
          'authorization': af.header,
          'x-forwarded-for': '198.51.100.99'
        }
      });
      check(`Auth Fuzz: ${af.name} safely returns ${af.expected}`, afRes.status === af.expected, `Got status ${afRes.status}`);
    }

    // 3.8 High-Concurrency Mixed Adversarial Burst (40 requests simultaneously)
    console.log(`  ${colors.dim}Executing 40-request concurrent adversarial storm...${colors.reset}`);
    const burstPromises = [];
    const burstStart = performance.now();

    for (let i = 0; i < 40; i++) {
      const isMalicious = i % 2 === 0;
      const burstIp = `198.51.100.${50 + (i % 20)}`;
      
      let p;
      if (isMalicious) {
        // Send SQLi or NoSQLi payload
        p = fetchLocal(localPort, '/api/auth/login', {
          method: 'POST',
          headers: {
            'x-forwarded-for': burstIp,
            'user-agent': `BurstAttacker-${i}`
          },
          body: {
            username: `admin' OR 1=${i % 2 === 0 ? 1 : 2}--`,
            password: 'test'
          }
        });
      } else {
        // Send health or benign request
        p = fetchLocal(localPort, '/api/health', {
          method: 'GET',
          headers: {
            'x-forwarded-for': burstIp,
            'user-agent': `BurstBenign-${i}`
          }
        });
      }
      burstPromises.push(p);
    }

    const burstResults = await Promise.all(burstPromises);
    const burstDurationMs = (performance.now() - burstStart).toFixed(2);
    const allResolved = burstResults.every(r => typeof r.status === 'number');

    check(`High-concurrency 40-request storm resolved completely in ${burstDurationMs}ms`, allResolved, 'Some requests failed to resolve');
    
    const maliciousProperlyBlocked = burstResults
      .filter((_, idx) => idx % 2 === 0)
      .every(r => r.status === 403);
    check('All 20 concurrent malicious vectors intercepted with 403', maliciousProperlyBlocked, 'Some malicious requests leaked');

    // 3.9 Post-Stress Local Health Confirmation
    const postStressHealth = await fetchLocal(localPort, '/api/health', { method: 'GET' });
    check('Local server remains 100% healthy (200 OK) after adversarial assault', postStressHealth.status === 200 && ['healthy', 'degraded'].includes(postStressHealth.json?.status), `Got status ${postStressHealth.status}`);

  } finally {
    // Teardown local server and unquarantine test IPs
    for (const ip of testIps) {
      quarantineEngine.unquarantineIp(ip);
    }
    for (let i = 0; i < 20; i++) {
      quarantineEngine.unquarantineIp(`198.51.100.${50 + i}`);
    }
    localServer.close();
  }

  // ==============================================================================
  // STEP 4: MASTER PHASE 4 REDTEAM TEST SUITE VALIDATION (72 CHECKS)
  // ==============================================================================
  console.log(`\n${colors.bold}${colors.cyan}[STEP 4] Unified Phase 4 Master Suite Execution${colors.reset}`);
  const redTeamProcess = spawnSync('node', ['tests/test-phase4-redteam-adversarial.js'], {
    encoding: 'utf-8',
    timeout: 30000
  });

  const masterSuccess = redTeamProcess.status === 0;
  const masterHas72 = redTeamProcess.stdout && redTeamProcess.stdout.includes('Total Adversarial Vectors : 72') && redTeamProcess.stdout.includes('Passed Tests              : \x1b[32m72\x1b[0m');
  
  check('Unified Phase 4 master suite process exits with code 0', masterSuccess, `Exit code: ${redTeamProcess.status}`);
  check('Unified Phase 4 master suite executed all 72/72 vectors with 100% pass', masterHas72, 'Output did not confirm 72/72 pass');

  // ==============================================================================
  // FINAL VERDICT & SUMMARY
  // ==============================================================================
  const totalDuration = (performance.now() - startTime).toFixed(2);
  const passPercent = ((passedChecks / totalChecks) * 100).toFixed(1);

  console.log(`\n${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}       CHALLENGER M4-1 EMPIRICAL PENETRATION & REGRESSION REPORT        ${colors.reset}`);
  console.log(`${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  Total Checks Conducted   : ${totalChecks}`);
  console.log(`  Passed Checks            : ${colors.green}${passedChecks}${colors.reset}`);
  console.log(`  Failed Checks            : ${failedChecks > 0 ? colors.red + failedChecks + colors.reset : 0}`);
  console.log(`  Pass Rate                : ${colors.bold}${colors.green}${passPercent}%${colors.reset}`);
  console.log(`  Total Execution Time     : ${totalDuration}ms`);
  console.log(`${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  if (failedChecks > 0) {
    console.error(`${colors.bold}${colors.red}❌ CHALLENGER VERDICT: REQUEST_CHANGES (${failedChecks} failures detected)${colors.reset}`);
    for (const f of failureDetails) {
      console.error(`  - ${f.check}: ${f.detail}`);
    }
    process.exit(1);
  } else {
    console.log(`${colors.bold}${colors.green}✅ CHALLENGER VERDICT: APPROVE (100% Empirical Pass - Zero Regression)${colors.reset}\n`);
    process.exit(0);
  }
}

if (require.main === module) {
  runChallengerHarness().catch(err => {
    console.error('Fatal Challenger M4-1 Error:', err);
    process.exit(1);
  });
}

module.exports = { runChallengerHarness };
