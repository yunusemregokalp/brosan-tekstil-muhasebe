/**
 * tests/e2e/test-helpers.js
 * 
 * Shared test framework, assertion library, and data loaders for Brosan ERP 4-Tier E2E Test Suite.
 * Authoritative Sources:
 * - data/parasut_live_data.json (Company ID: 794187)
 * - data/faruk_aytin_excel_data.json (FARUK AYTİN CARİ.xlsx)
 * - data/faruk_aytin_full_extracted.json
 * - ORIGINAL_REQUEST.md & PROJECT.md
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Base Paths
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const PRISMA_DIR = path.join(ROOT_DIR, 'prisma');
const APP_DIR = path.join(ROOT_DIR, 'app');

// ANSI Terminal Colors (PowerShell / Linux compatible)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgBlue: '\x1b[44m'
};

/**
 * Currency & Decimal Arithmetic Helpers (Avoiding IEEE 754 float drift)
 */
function roundCent(val) {
  if (val === null || val === undefined) return 0.00;
  const num = typeof val === 'number' ? val : parseFloat(val);
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function formatMoney(amount, currency = 'USD') {
  const rounded = roundCent(amount);
  const formatted = rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  switch (currency.toUpperCase()) {
    case 'USD': return `$${formatted}`;
    case 'GBP': return `£${formatted}`;
    case 'EUR': return `€${formatted}`;
    case 'TRL':
    case 'TRY': return `₺${formatted}`;
    default: return `${formatted} ${currency}`;
  }
}

/**
 * Custom Assertion Helpers
 */
function assertExact(actual, expected, message) {
  if (actual !== expected) {
    const msg = message || `Expected exact match: ${actual} === ${expected}`;
    throw new assert.AssertionError({
      message: msg,
      actual,
      expected,
      operator: '==='
    });
  }
}

function assertApprox(actual, expected, tolerance = 0.01, message) {
  const act = typeof actual === 'number' ? actual : parseFloat(actual);
  const exp = typeof expected === 'number' ? expected : parseFloat(expected);
  const diff = Math.abs(act - exp);
  if (diff > tolerance) {
    const msg = message || `Expected ${act} to be within ${tolerance} of ${exp} (diff: ${diff.toFixed(6)})`;
    throw new assert.AssertionError({
      message: msg,
      actual: act,
      expected: exp,
      operator: `within +/-${tolerance}`
    });
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new assert.AssertionError({
      message: message || 'Expected condition to be truthy',
      actual: condition,
      expected: true
    });
  }
}

function assertDefined(val, message) {
  if (val === undefined || val === null) {
    throw new assert.AssertionError({
      message: message || `Expected value to be defined, got ${val}`,
      actual: val,
      expected: 'defined'
    });
  }
}

/**
 * Data Loaders
 */
function loadAuthoritativeData() {
  const parasutLivePath = path.join(DATA_DIR, 'parasut_live_data.json');
  const excelSummaryPath = path.join(DATA_DIR, 'faruk_aytin_excel_data.json');
  const excelExtractedPath = path.join(DATA_DIR, 'faruk_aytin_full_extracted.json');

  if (!fs.existsSync(parasutLivePath)) {
    throw new Error(`Authoritative file not found: ${parasutLivePath}`);
  }
  if (!fs.existsSync(excelSummaryPath)) {
    throw new Error(`Authoritative file not found: ${excelSummaryPath}`);
  }

  const parasutLive = JSON.parse(fs.readFileSync(parasutLivePath, 'utf8'));
  const accountsChecksPath = path.join(DATA_DIR, 'parasut_accounts_and_checks.json');
  if (fs.existsSync(accountsChecksPath)) {
    const accountsChecksData = JSON.parse(fs.readFileSync(accountsChecksPath, 'utf8'));
    if (accountsChecksData && Array.isArray(accountsChecksData.accounts) && accountsChecksData.accounts.length === 14) {
      parasutLive.bank_accounts = accountsChecksData.accounts;
    }
  }

  const excelSummary = JSON.parse(fs.readFileSync(excelSummaryPath, 'utf8'));
  const excelExtracted = fs.existsSync(excelExtractedPath)
    ? JSON.parse(fs.readFileSync(excelExtractedPath, 'utf8'))
    : null;

  return {
    parasutLive,
    excelSummary,
    excelExtracted
  };
}

function loadSeedData() {
  const seedPath = path.join(PRISMA_DIR, 'seed.js');
  if (!fs.existsSync(seedPath)) {
    throw new Error(`Seed file not found: ${seedPath}`);
  }

  const seedSrc = fs.readFileSync(seedPath, 'utf8');

  // Extract accountsData
  let accountsData = [];
  const accMatch = seedSrc.match(/const accountsData\s*=\s*(\[[\s\S]*?\n\s*\];)/);
  if (accMatch) {
    try {
      accountsData = eval(accMatch[1].replace(/;$/, ''));
    } catch (e) {
      console.warn('Warning: Failed to eval accountsData from seed.js:', e.message);
    }
  }

  // Extract contactsData
  let contactsData = [];
  const conMatch = seedSrc.match(/const contactsData\s*=\s*(\[[\s\S]*?\n\s*\];)/);
  if (conMatch) {
    try {
      contactsData = eval(conMatch[1].replace(/;$/, ''));
    } catch (e) {
      console.warn('Warning: Failed to eval contactsData from seed.js:', e.message);
    }
  }

  // Extract bankPayments
  let bankPayments = [];
  const bpMatch = seedSrc.match(/const bankPayments\s*=\s*(\[[\s\S]*?\n\s*\];)/);
  if (bpMatch) {
    try {
      bankPayments = eval(bpMatch[1].replace(/;$/, ''));
    } catch (e) {
      console.warn('Warning: Failed to eval bankPayments from seed.js:', e.message);
    }
  }

  // Extract productsData
  let productsData = [];
  const prodMatch = seedSrc.match(/const productsData\s*=\s*(\[[\s\S]*?\n\s*\];)/);
  if (prodMatch) {
    try {
      productsData = eval(prodMatch[1].replace(/;$/, ''));
    } catch (e) {
      console.warn('Warning: Failed to eval productsData from seed.js:', e.message);
    }
  }

  // Extract checksData
  let checksData = [];
  const chkMatch = seedSrc.match(/const checksData\s*=\s*(\[[\s\S]*?\n\s*\];)/);
  if (chkMatch) {
    try {
      checksData = eval('(function(contactParasutMap){ return ' + chkMatch[1].replace(/;$/, '') + '; })({})');
    } catch (e) {
      console.warn('Warning: Failed to eval checksData from seed.js:', e.message);
    }
  }

  // Extract invoice numbers seeded
  const invoiceNumbers = [];
  const invNoRegex = /invoiceNo:\s*['"]([A-Z0-9]+)['"]/g;
  let match;
  while ((match = invNoRegex.exec(seedSrc)) !== null) {
    if (!invoiceNumbers.includes(match[1])) {
      invoiceNumbers.push(match[1]);
    }
  }

  return {
    rawSource: seedSrc,
    accountsData,
    contactsData,
    bankPayments,
    productsData,
    checksData,
    invoiceNumbers
  };
}

function loadFrontendData() {
  const indexPath = path.join(APP_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Frontend file not found: ${indexPath}`);
  }

  const html = fs.readFileSync(indexPath, 'utf8');
  let erpCache = null;

  const match = html.match(/const BROSAN_ERP\s*=\s*(\{[\s\S]*?\n\s*\};)/);
  if (match) {
    try {
      const cleanJs = match[1].trim().replace(/;$/, '');
      erpCache = eval('(' + cleanJs + ')');
    } catch (e) {
      console.warn('Warning: Failed to eval BROSAN_ERP from index.html:', e.message);
    }
  }

  return {
    htmlContent: html,
    erpCache
  };
}

async function loadPrismaData() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    // Test quick connection with timeout
    const accounts = await Promise.race([
      prisma.account.findMany(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 2000))
    ]);
    const contacts = await prisma.contact.findMany();
    const invoices = await prisma.invoice.findMany({ include: { items: true } });
    const checks = await prisma.checkPromissory.findMany();
    const transactions = await prisma.transaction.findMany();

    let subcontractReconciliations = [];
    if (prisma.subcontractReconciliation) {
      subcontractReconciliations = await prisma.subcontractReconciliation.findMany();
    }

    return {
      isOnline: true,
      prisma,
      accounts,
      contacts,
      invoices,
      checks,
      transactions,
      subcontractReconciliations
    };
  } catch (err) {
    return {
      isOnline: false,
      reason: err.message
    };
  }
}

async function loadAllData() {
  const authoritative = loadAuthoritativeData();
  const seed = loadSeedData();
  const frontend = loadFrontendData();
  const db = await loadPrismaData();

  return {
    authoritative,
    seed,
    frontend,
    db
  };
}

/**
 * Test Suite Execution Engine
 */
class TestSuite {
  constructor(name, description = '') {
    this.name = name;
    this.description = description;
    this.tests = [];
    this.results = [];
  }

  test(title, fn) {
    this.tests.push({ title, fn });
  }

  async run() {
    console.log(`\n${colors.bright}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.white} RUNNING SUITE: ${this.name}${colors.reset}`);
    if (this.description) {
      console.log(`${colors.dim} ${this.description}${colors.reset}`);
    }
    console.log(`${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

    const startTime = Date.now();
    let passed = 0;
    let failed = 0;

    for (let i = 0; i < this.tests.length; i++) {
      const { title, fn } = this.tests[i];
      const testStart = Date.now();
      try {
        await fn();
        const duration = Date.now() - testStart;
        passed++;
        this.results.push({ title, status: 'PASS', duration, error: null });
        console.log(`  ${colors.green}✔ PASS${colors.reset} [${duration}ms] ${title}`);
      } catch (err) {
        const duration = Date.now() - testStart;
        failed++;
        this.results.push({ title, status: 'FAIL', duration, error: err });
        console.log(`  ${colors.red}✖ FAIL${colors.reset} [${duration}ms] ${title}`);
        console.log(`    ${colors.red}Error: ${err.message}${colors.reset}`);
        if (err.actual !== undefined && err.expected !== undefined) {
          console.log(`    ${colors.dim}Actual:   ${JSON.stringify(err.actual)}${colors.reset}`);
          console.log(`    ${colors.dim}Expected: ${JSON.stringify(err.expected)}${colors.reset}`);
        }
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`\n${colors.dim}Suite ${this.name} finished in ${durationMs}ms: ${passed} passed, ${failed} failed (${this.tests.length} total)${colors.reset}\n`);

    return {
      name: this.name,
      total: this.tests.length,
      passed,
      failed,
      durationMs,
      results: this.results
    };
  }
}

module.exports = {
  colors,
  roundCent,
  formatMoney,
  assertExact,
  assertApprox,
  assertTrue,
  assertDefined,
  loadAuthoritativeData,
  loadSeedData,
  loadFrontendData,
  loadPrismaData,
  loadAllData,
  TestSuite
};
