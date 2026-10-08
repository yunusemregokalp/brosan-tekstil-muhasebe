/**
 * BROSAN TEKSTİL ERP — TEST SUITE RUNNER
 * Runs all unit, integration, and security penetration test suites.
 */

const { execSync } = require('child_process');
const path = require('path');

const tests = [
  { name: 'Auth Unit Tests', file: 'test-auth-unit.js' },
  { name: 'Security & Penetration Tests', file: 'test-security-penetration.js' }
];

console.log('🚀 Running all test suites for Brosan Tekstil ERP...\n');

let failed = false;

for (const test of tests) {
  console.log(`▶️ Running: ${test.name} (${test.file})`);
  try {
    const fullPath = path.join(__dirname, test.file);
    execSync(`node "${fullPath}"`, { stdio: 'inherit' });
    console.log(`✅ ${test.name} passed!\n`);
  } catch (err) {
    console.error(`❌ ${test.name} FAILED!\n`);
    failed = true;
    break;
  }
}

if (failed) {
  console.error('💥 Test suite execution failed!');
  process.exit(1);
} else {
  console.log('🎉 ALL SECURITY & UNIT TEST SUITES PASSED CLEANLY (100%)!');
}
