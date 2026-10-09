/**
 * BROSAN TEKSTİL ERP — UNIFIED MASTER TEST HARNESS RUNNER
 * Coordinates and executes:
 * 1. tests/test-auth-unit.js            (Unit Authentication & Cryptography Suite)
 * 2. tests/test-security-penetration.js (12-Vector OWASP Top 10 Red-Team Penetration Suite)
 * 3. tests/e2e/run-all-tests.js         (4-Tier Accounting Domain & Reconciliation E2E Suite)
 */

const { execSync } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const suites = [
  {
    name: 'Auth & Cryptography Unit Suite',
    file: 'test-auth-unit.js',
    type: 'Unit'
  },
  {
    name: 'RFC 6238 TOTP Cryptographic Engine Suite',
    file: 'test-totp-unit.js',
    type: 'Unit'
  },
  {
    name: 'Dynamic IP Quarantine Engine (Fail2ban) Suite',
    file: 'test-quarantine-unit.js',
    type: 'Security'
  },
  {
    name: '12-Vector OWASP Top 10 Red-Team Penetration Suite',
    file: 'test-security-penetration.js',
    type: 'Security'
  },
  {
    name: '4-Tier End-to-End Security & 2FA Harness Suite',
    file: path.join('e2e', 'test-security-e2e.js'),
    type: 'E2E'
  },
  {
    name: 'Real-Time Threat Alerter & Notification Queue Suite',
    file: 'test-threat-alerter-unit.js',
    type: 'Security'
  },
  {
    name: 'AES-256-GCM Field Cryptography Vault Suite',
    file: 'test-crypto-vault-unit.js',
    type: 'Security'
  },
  {
    name: 'Emergency Panic Lockdown & Token Epoch Revocation Suite',
    file: 'test-lockdown-unit.js',
    type: 'Security'
  },
  {
    name: '4-Tier Accounting Domain & Reconciliation E2E Suite',
    file: path.join('e2e', 'run-all-tests.js'),
    type: 'E2E'
  },
  {
    name: 'Heuristic WAF & Payload Sanitizer Adversarial Suite',
    file: 'test-heuristic-waf-adversarial.js',
    type: 'Security'
  },
  {
    name: 'Session Guard & Fingerprint Binding Adversarial Suite',
    file: 'test-session-guard-adversarial.js',
    type: 'Security'
  },
  {
    name: 'Financial Ledger HMAC Blockchain Adversarial Suite',
    file: 'test-ledger-integrity-adversarial.js',
    type: 'Security'
  },
  {
    name: 'Phase 4 Master Red-Team Adversarial Penetration Suite',
    file: 'test-phase4-redteam-adversarial.js',
    type: 'Security'
  },
  {
    name: 'Phase 5 Apex Citadel Active Defense Suite',
    file: 'test-phase5-active-defense.js',
    type: 'Security'
  }
];

console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}🚀 BROSAN TEKSTİL ERP — UNIFIED MASTER TEST SUITE RUNNER${colors.reset}`);
console.log(`${colors.dim}Executing Unit, Red-Team Security, and Accounting Domain E2E Suites...${colors.reset}`);
console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

const masterStartTime = Date.now();
const results = [];
let anyFailed = false;

for (let i = 0; i < suites.length; i++) {
  const suite = suites[i];
  const suiteStartTime = Date.now();
  console.log(`\n${colors.bold}[SUITE ${i + 1}/${suites.length}] Starting ${suite.name} (${suite.file})...${colors.reset}`);
  console.log(`${colors.dim}────────────────────────────────────────────────────────────────────────────────${colors.reset}`);

  try {
    const fullPath = path.join(__dirname, suite.file);
    execSync(`node "${fullPath}"`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
      env: process.env
    });
    const duration = Date.now() - suiteStartTime;
    results.push({ name: suite.name, file: suite.file, type: suite.type, status: 'PASS', duration });
    console.log(`${colors.green}✔ [SUITE ${i + 1} PASSED]${colors.reset} ${suite.name} in ${duration}ms\n`);
  } catch (err) {
    const duration = Date.now() - suiteStartTime;
    results.push({ name: suite.name, file: suite.file, type: suite.type, status: 'FAIL', duration, error: err.message });
    console.error(`\n${colors.red}✖ [SUITE ${i + 1} FAILED]${colors.reset} ${suite.name} in ${duration}ms\n`);
    anyFailed = true;
    break;
  }
}

const totalDuration = Date.now() - masterStartTime;

console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}                    MASTER TEST SUITE SUMMARY REPORT                            ${colors.reset}`);
console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`  #  | Type     | Status | Duration | Suite Name`);
console.log(`─────|──────────|────────|──────────|──────────────────────────────────────────`);

results.forEach((r, idx) => {
  const statusColor = r.status === 'PASS' ? colors.green : colors.red;
  const num = (idx + 1).toString().padEnd(2);
  const typeStr = r.type.padEnd(8);
  const statusStr = (r.status === 'PASS' ? 'PASS  ' : 'FAIL  ');
  const durStr = `${r.duration}ms`.padStart(8);
  console.log(`  ${num} | ${typeStr} | ${statusColor}${statusStr}${colors.reset} | ${durStr} | ${r.name}`);
});

console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
const passedCount = results.filter(r => r.status === 'PASS').length;
console.log(`  Total Suites   : ${suites.length}`);
console.log(`  Passed Suites  : ${colors.green}${passedCount}${colors.reset}`);
console.log(`  Failed Suites  : ${anyFailed ? colors.red + (suites.length - passedCount) + colors.reset : 0}`);
console.log(`  Total Time     : ${totalDuration}ms`);
console.log(`  Pass Rate      : ${colors.bold}${colors.green}${((passedCount / suites.length) * 100).toFixed(1)}%${colors.reset}`);
console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

if (anyFailed) {
  console.error(`${colors.bold}${colors.red}💥 ONE OR MORE TEST SUITES FAILED! REVIEW LOGS ABOVE.${colors.reset}\n`);
  process.exit(1);
} else {
  console.log(`${colors.bold}${colors.green}🎉 ALL UNIT, RED-TEAM PENETRATION, AND E2E TEST SUITES PASSED 100%!${colors.reset}\n`);
  process.exit(0);
}
