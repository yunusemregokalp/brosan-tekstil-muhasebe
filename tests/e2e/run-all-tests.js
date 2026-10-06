/**
 * tests/e2e/run-all-tests.js
 * 
 * Master E2E Test Runner for Brosan Tekstil ERP
 * 
 * Orchestrates and executes all 4 tiers of end-to-end accounting tests:
 * - Tier 1: Feature Coverage (Contacts, Banks, Invoices, Checks, Faruk Aytin, Fabric offset)
 * - Tier 2: Boundary & Corner Cases (Cent precision, Net VAT, FX $2.19, Currency isolation)
 * - Tier 3: Cross-Feature Combinations (Subcontract settlement + Fabric linkage + Bank deduction)
 * - Tier 4: Real-World Scenarios (9-step lifecycle reconciliation + Bidirectional cockpit audit)
 * 
 * Usage:
 *   node tests/e2e/run-all-tests.js
 */

const { loadAllData, colors } = require('./test-helpers');
const { createTier1Suite } = require('./tier1-feature-coverage.test');
const { createTier2Suite } = require('./tier2-boundary-corner.test');
const { createTier3Suite } = require('./tier3-cross-feature.test');
const { createTier4Suite } = require('./tier4-realworld-scenarios.test');

async function runAllTests() {
  const globalStart = Date.now();

  console.log(`\n${colors.bright}${colors.bgBlue}${colors.white}                                                                                ${colors.reset}`);
  console.log(`${colors.bright}${colors.bgBlue}${colors.white}           BROSAN TEKSTİL ERP — 4-TIER E2E TEST HARNESS RUNNER                  ${colors.reset}`);
  console.log(`${colors.bright}${colors.bgBlue}${colors.white}   Paraşüt (794187) Integration & Faruk Aytin Reconciliation Verification       ${colors.reset}`);
  console.log(`${colors.bright}${colors.bgBlue}${colors.white}                                                                                ${colors.reset}\n`);

  console.log(`${colors.dim}Loading authoritative data sources and runtime context...${colors.reset}`);
  const context = await loadAllData();
  console.log(`${colors.green}✔ Data sources loaded successfully.${colors.reset}`);
  console.log(`${colors.dim}  - Authoritative Contacts: ${context.authoritative.parasutLive.contacts.length}`);
  console.log(`  - Authoritative Banks:    ${context.authoritative.parasutLive.bank_accounts.length}`);
  console.log(`  - Authoritative Invoices: ${context.authoritative.parasutLive.sales_invoices.length}`);
  console.log(`  - Authoritative Checks:   ${context.authoritative.parasutLive.checks.length}`);
  console.log(`  - Database Seed Contacts: ${context.seed.contactsData.length}`);
  console.log(`  - Frontend UI Cache:      ${context.frontend.erpCache ? 'Hydrated (15 Contacts)' : 'Not found'}`);
  console.log(`  - Live PostgreSQL:        ${context.db.isOnline ? 'Online (Prisma Connected)' : 'Offline (Inspecting Seed & Models)'}${colors.reset}\n`);

  // Initialize Suites
  const suites = [
    createTier1Suite(context),
    createTier2Suite(context),
    createTier3Suite(context),
    createTier4Suite(context)
  ];

  const suiteResults = [];
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of suites) {
    const res = await suite.run();
    suiteResults.push(res);
    totalTests += res.total;
    totalPassed += res.passed;
    totalFailed += res.failed;
  }

  const globalDuration = Date.now() - globalStart;

  // Print Executive Summary Table
  console.log(`\n${colors.bright}${colors.white}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.white}                       E2E TEST EXECUTION SUMMARY REPORT                        ${colors.reset}`);
  console.log(`${colors.white}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.dim} Tier  | Suite Name                                | Tests | Pass | Fail | Time  ${colors.reset}`);
  console.log(`${colors.dim}-------|-------------------------------------------|-------|------|------|-------${colors.reset}`);

  suiteResults.forEach((s, idx) => {
    const tierNum = `T${idx + 1}`.padEnd(5);
    const name = s.name.padEnd(41);
    const tests = String(s.total).padStart(5);
    const pass = `${colors.green}${String(s.passed).padStart(4)}${colors.reset}`;
    const fail = s.failed > 0
      ? `${colors.red}${String(s.failed).padStart(4)}${colors.reset}`
      : `${colors.dim}${String(s.failed).padStart(4)}${colors.reset}`;
    const time = `${s.durationMs}ms`.padStart(6);

    console.log(` ${tierNum} | ${name} | ${tests} | ${pass} | ${fail} | ${time}`);
  });

  console.log(`${colors.white}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  const passPercent = ((totalPassed / totalTests) * 100).toFixed(1);
  console.log(` TOTAL: ${totalTests} Tests across 4 Tiers | ${totalPassed} Passed (${passPercent}%) | ${totalFailed} Failed | ${globalDuration}ms total`);

  if (totalFailed === 0) {
    console.log(`\n${colors.bright}${colors.bgGreen}${colors.white}  ✔ 100% E2E TESTS PASSED — VERIFICATION COMPLETE & SYSTEM TEST-READY           ${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.bright}${colors.bgRed}${colors.white}  ✖ ${totalFailed} TEST(S) FAILED — REVIEW DEFECTS AND LOGS ABOVE               ${colors.reset}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllTests().catch((err) => {
    console.error(`\n${colors.red}Fatal error running E2E tests:${colors.reset}`, err);
    process.exit(1);
  });
}

module.exports = { runAllTests };
