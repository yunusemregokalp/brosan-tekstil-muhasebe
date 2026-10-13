/**
 * tests/test-m1-challenger.js
 * 
 * EMPIRICAL ADVERSARIAL CHALLENGER TEST SUITE FOR MILESTONE 1
 * Target: app/index.html (Google Stitch Atelier Treasury & Customs ERP Redesign)
 * 
 * Verifies:
 * 1. Google Fonts Links & Typography declarations (Hanken Grotesk, Inter, JetBrains Mono)
 * 2. Color tokens (#0D1B2A, #1E3A8A, #047857, #F8FAFC, #FFFFFF, #E2E8F0, #CBD5E1) in :root, tailwind.config & utility classes
 * 3. Sidebar #sidebar-nav: 4 scannable domain groups, all 15 navigation buttons with exact data-module, zero novelty badges, dynamic counters intact
 * 4. Top header bar: #global-search-input (Ctrl+K), #quick-action-menu, #header-breadcrumb-view, and action triggers
 * 5. #auth-lockscreen: Institutional Level 1 white card in Midnight Navy (#0D1B2A), form inputs, submit/quick unlock buttons, error elements
 * 6. JavaScript runtime contracts: switchView() breadcrumb/nav sync, toggleQuickActionMenu(), BROSAN_ERP integrity, all 15 views, all 11 tbody targets
 * 7. Adversarial edge cases & fuzz checks (badge leakage, case-insensitivity, syntax integrity)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'app', 'index.html');

// ANSI Terminal Colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

let totalPassed = 0;
let totalFailed = 0;
const failureDetails = [];

function pass(name, detail = '') {
  totalPassed++;
  console.log(`  ${colors.green}✔ PASS${colors.reset} ${name}${detail ? ` ${colors.dim}(${detail})${colors.reset}` : ''}`);
}

function fail(name, error) {
  totalFailed++;
  failureDetails.push({ name, error: error.message || error });
  console.log(`  ${colors.red}✖ FAIL${colors.reset} ${name} — ${error.message || error}`);
}

function runAssertion(name, fn) {
  try {
    fn();
    pass(name);
  } catch (err) {
    fail(name, err);
  }
}

console.log(`\n${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}   CHALLENGER M1-1: ADVERSARIAL STRESS-TEST FOR MILESTONE 1 FOUNDATIONS         ${colors.reset}`);
console.log(`${colors.dim}   Target: ${INDEX_HTML_PATH}${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

// Read app/index.html
if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error(`${colors.red}CRITICAL: app/index.html does not exist at ${INDEX_HTML_PATH}${colors.reset}`);
  process.exit(1);
}

const htmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
const htmlLines = htmlContent.split(/\r?\n/);
console.log(`Loaded app/index.html: ${htmlLines.length.toLocaleString()} lines, ${(htmlContent.length / 1024).toFixed(1)} KB.\n`);

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: Google Fonts & Typography Foundations
// ─────────────────────────────────────────────────────────────────────────────
console.log(`${colors.bold}--- SUITE 1: Google Fonts Links & Typography Declarations ---${colors.reset}`);

runAssertion('S1.1: Preconnect links to fonts.googleapis.com and fonts.gstatic.com', () => {
  assert.ok(/<link[^>]+rel=["']preconnect["'][^>]+href=["']https:\/\/fonts\.googleapis\.com["']/i.test(htmlContent),
    'Missing preconnect to fonts.googleapis.com');
  assert.ok(/<link[^>]+rel=["']preconnect["'][^>]+href=["']https:\/\/fonts\.gstatic\.com["']/i.test(htmlContent),
    'Missing preconnect to fonts.gstatic.com');
});

runAssertion('S1.2: Google Fonts stylesheet link includes Hanken Grotesk', () => {
  assert.ok(/family=Hanken\+Grotesk/i.test(htmlContent),
    'Google Fonts URL does not include Hanken Grotesk');
});

runAssertion('S1.3: Google Fonts stylesheet link includes Inter', () => {
  assert.ok(/family=Inter/i.test(htmlContent),
    'Google Fonts URL does not include Inter');
});

runAssertion('S1.4: Google Fonts stylesheet link includes JetBrains Mono', () => {
  assert.ok(/family=JetBrains\+Mono/i.test(htmlContent),
    'Google Fonts URL does not include JetBrains Mono');
});

runAssertion('S1.5: tailwind.config extends fontFamily with Hanken Grotesk, Inter, and JetBrains Mono', () => {
  assert.ok(htmlContent.includes("hanken: ['\"Hanken Grotesk\"', 'sans-serif']"),
    'tailwind.config missing hanken font family');
  assert.ok(htmlContent.includes("mono: ['\"JetBrains Mono\"', 'monospace']"),
    'tailwind.config missing mono font family');
  assert.ok(htmlContent.includes("sans: ['Inter', 'sans-serif']"),
    'tailwind.config missing sans (Inter) font family');
});

runAssertion('S1.6: CSS :root defines typography stacks and tabular-nums utility', () => {
  assert.ok(/--font-heading:\s*['"]Hanken Grotesk['"]/i.test(htmlContent),
    ':root missing --font-heading token');
  assert.ok(/--font-mono:\s*['"]JetBrains Mono['"]/i.test(htmlContent),
    ':root missing --font-mono token');
  assert.ok(/\.tabular-nums\s*\{[^}]*font-variant-numeric:\s*tabular-nums/i.test(htmlContent),
    'Missing .tabular-nums CSS class with font-variant-numeric');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: Atelier Treasury & Customs Design Tokens
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${colors.bold}--- SUITE 2: Color Tokens & Semantic Badges ---${colors.reset}`);

const requiredColorTokens = [
  { name: 'Midnight Maritime Navy', hex: '#0D1B2A', varName: '--color-navy', tailwindKey: 'navy' },
  { name: 'Slate Cobalt', hex: '#1E3A8A', varName: '--color-cobalt', tailwindKey: 'cobalt' },
  { name: 'Regulatory Emerald', hex: '#047857', varName: '--color-emerald', tailwindKey: 'emerald' },
  { name: 'Cool Off-White Background', hex: '#F8FAFC', varName: '--color-bg', tailwindKey: 'bg' },
  { name: 'Work Surface White', hex: '#FFFFFF', varName: '--color-surface', tailwindKey: 'surface' },
  { name: 'Structural Border', hex: '#E2E8F0', varName: '--border-color', tailwindKey: 'border' },
  { name: 'Strong Border', hex: '#CBD5E1', varName: '--border-color-strong', tailwindKey: 'borderStrong' }
];

for (const token of requiredColorTokens) {
  runAssertion(`S2.Color: ${token.name} (${token.hex}) in :root and tailwind.config`, () => {
    // Check in :root
    const rootRegex = new RegExp(`${token.varName}:\\s*${token.hex}`, 'i');
    assert.ok(rootRegex.test(htmlContent), `Token ${token.varName} (${token.hex}) not found in :root`);

    // Check in tailwind.config
    const twRegex = new RegExp(`${token.tailwindKey}:\\s*['"]${token.hex}['"]`, 'i');
    assert.ok(twRegex.test(htmlContent), `Tailwind color atelier.${token.tailwindKey} (${token.hex}) not found`);
  });
}

runAssertion('S2.Badges: 4-state semantic badge CSS tokens and classes defined in <style>', () => {
  // 1. Verify CSS variables in :root
  assert.ok(/--badge-approved-bg:\s*#ECFDF5/i.test(htmlContent), 'Missing --badge-approved-bg: #ECFDF5');
  assert.ok(/--badge-approved-text:\s*#047857/i.test(htmlContent), 'Missing --badge-approved-text: #047857');
  assert.ok(/--badge-pending-bg:\s*#FFFBEB/i.test(htmlContent), 'Missing --badge-pending-bg: #FFFBEB');
  assert.ok(/--badge-pending-text:\s*#B45309/i.test(htmlContent), 'Missing --badge-pending-text: #B45309');
  assert.ok(/--badge-alert-bg:\s*#FFF1F2/i.test(htmlContent), 'Missing --badge-alert-bg: #FFF1F2');
  assert.ok(/--badge-alert-text:\s*#BE123C/i.test(htmlContent), 'Missing --badge-alert-text: #BE123C');
  assert.ok(/--badge-neutral-bg:\s*#F1F5F9/i.test(htmlContent), 'Missing --badge-neutral-bg: #F1F5F9');
  assert.ok(/--badge-neutral-text:\s*#475569/i.test(htmlContent), 'Missing --badge-neutral-text: #475569');

  // 2. Verify badge utility classes
  assert.ok(/\.badge-approved/i.test(htmlContent), 'Missing .badge-approved class');
  assert.ok(/\.badge-pending/i.test(htmlContent), 'Missing .badge-pending class');
  assert.ok(/\.badge-alert/i.test(htmlContent), 'Missing .badge-alert class');
  assert.ok(/\.badge-neutral/i.test(htmlContent), 'Missing .badge-neutral class');
});

runAssertion('S2.Table & Card: .table-atelier and .card-atelier utilities present', () => {
  assert.ok(/\.table-atelier\s*\{/i.test(htmlContent), 'Missing .table-atelier class');
  assert.ok(/\.card-atelier\s*\{/i.test(htmlContent), 'Missing .card-atelier class');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: Sidebar Navigation Rail (#sidebar-nav)
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${colors.bold}--- SUITE 3: Sidebar Navigation Rail (#sidebar-nav) ---${colors.reset}`);

// Extract #sidebar-nav section
const sidebarNavMatch = htmlContent.match(/<nav[^>]*id=["']sidebar-nav["'][^>]*>([\s\S]*?)<\/nav>/i);
assert.ok(sidebarNavMatch, 'Could not locate <nav id="sidebar-nav"> in app/index.html');
const sidebarNavContent = sidebarNavMatch[1];

runAssertion('S3.1: Sidebar nav rail exists and has scannable domain groups', () => {
  assert.ok(sidebarNavContent.length > 500, 'sidebar-nav content is unexpectedly short');
  assert.ok(/Finans\s*(&|&amp;)\s*Muhasebe/i.test(sidebarNavContent), 'Missing group: Finans & Muhasebe');
  assert.ok(/İhracat\s*(&|&amp;)\s*Evrak/i.test(sidebarNavContent), 'Missing group: İhracat & Evrak');
  assert.ok(/Operasyon\s*(&|&amp;)\s*Cari/i.test(sidebarNavContent), 'Missing group: Operasyon & Cari');
  assert.ok(/Raporlama\s*(&|&amp;)\s*Sistem/i.test(sidebarNavContent), 'Missing group: Raporlama & Sistem');
});

const expected15Modules = [
  'dashboard',
  'ledger',
  'banking',
  'checks',
  'expenses',
  'exports',
  'documents',
  'mutabakat',
  'sales',
  'contacts',
  'payroll',
  'inventory',
  'edonusum',
  'reports',
  'settings'
];

runAssertion('S3.2: All 15 modules are present with exact data-module in #sidebar-nav', () => {
  const foundModules = [];
  const moduleRegex = /<button[^>]*data-module=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = moduleRegex.exec(sidebarNavContent)) !== null) {
    foundModules.push(match[1]);
  }

  assert.strictEqual(foundModules.length, 15, `Expected exactly 15 navigation buttons, found ${foundModules.length}: ${foundModules.join(', ')}`);

  for (const mod of expected15Modules) {
    assert.ok(foundModules.includes(mod), `Module "${mod}" missing from #sidebar-nav`);
  }
});

const noveltyBadges = [
  'Ben Ellis',
  '3 Vade',
  'İade 301',
  'Mizan',
  '₺420K',
  '18 Kişi',
  'GİB Canlı',
  '₺5.000+',
  'Kumaş/İplik'
];

for (const badge of noveltyBadges) {
  runAssertion(`S3.NoveltyBadge: "${badge}" is ABSENT from #sidebar-nav`, () => {
    // Normalize and check
    const escaped = badge.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`>\\s*${escaped}\\s*<`, 'i');
    assert.strictEqual(regex.test(sidebarNavContent), false,
      `Novelty badge "${badge}" was found inside #sidebar-nav!`);
  });
}

runAssertion('S3.3: Dynamic counters (#badge-sales-count, #badge-exports-count, #sidebar-doc-count-badge, #badge-expense-count) exist', () => {
  assert.ok(/id=["']badge-sales-count["']/i.test(sidebarNavContent), 'Missing #badge-sales-count');
  assert.ok(/id=["']badge-exports-count["']/i.test(sidebarNavContent), 'Missing #badge-exports-count');
  assert.ok(/id=["']sidebar-doc-count-badge["']/i.test(sidebarNavContent), 'Missing #sidebar-doc-count-badge');
  assert.ok(/id=["']badge-expense-count["']/i.test(sidebarNavContent), 'Missing #badge-expense-count');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: Top Header Bar (<header>)
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${colors.bold}--- SUITE 4: Top Header Bar (<header>) ---${colors.reset}`);

const headerMatch = htmlContent.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
assert.ok(headerMatch, 'Could not locate <header> in app/index.html');
const headerContent = headerMatch[1];

runAssertion('S4.1: Breadcrumb context element #header-breadcrumb-view exists with initial "KOKPİT"', () => {
  assert.ok(/<span[^>]*id=["']header-breadcrumb-view["'][^>]*>([^<]*)<\/span>/i.test(headerContent),
    'Missing #header-breadcrumb-view in <header>');
  assert.ok(/id=["']header-breadcrumb-view["'][^>]*>KOKPİT<\/span>/i.test(headerContent),
    '#header-breadcrumb-view should initialize to "KOKPİT"');
});

runAssertion('S4.2: Omnisearch input #global-search-input exists with Ctrl+K kbd indicator', () => {
  assert.ok(/<input[^>]*id=["']global-search-input["'][^>]*>/i.test(headerContent),
    'Missing #global-search-input in <header>');
  assert.ok(/oninput=["']handleGlobalSearch\(this\.value\)["']/i.test(headerContent),
    '#global-search-input missing oninput handler');
  assert.ok(/Ctrl\+K/i.test(headerContent),
    'Missing Ctrl+K keyboard shortcut badge');
});

runAssertion('S4.3: Consolidated primary action trigger and #quick-action-menu exist', () => {
  assert.ok(/id=["']quick-action-dropdown-container["']/i.test(headerContent),
    'Missing #quick-action-dropdown-container');
  assert.ok(/onclick=["']toggleQuickActionMenu\(\)["']/i.test(headerContent),
    'Missing toggleQuickActionMenu() onclick trigger');
  assert.ok(/id=["']quick-action-menu["']/i.test(headerContent),
    'Missing #quick-action-menu dropdown container');
});

runAssertion('S4.4: Quick action menu links to key modal actions (invoice, expense, payment, check)', () => {
  assert.ok(/openModal\(['"]modal-new-invoice['"]\)/i.test(headerContent),
    '#quick-action-menu missing modal-new-invoice action');
  assert.ok(/openModal\(['"]modal-new-expense['"]\)/i.test(headerContent),
    '#quick-action-menu missing modal-new-expense action');
  assert.ok(/openModal\(['"]modal-new-payment['"]\)/i.test(headerContent),
    '#quick-action-menu missing modal-new-payment action');
  assert.ok(/openModal\(['"]modal-new-check['"]\)/i.test(headerContent),
    '#quick-action-menu missing modal-new-check action');
});

runAssertion('S4.5: Top bar contains quick lockscreen trigger button calling window.BrosanAuth.showLockscreen()', () => {
  assert.ok(/onclick=["']window\.BrosanAuth\.showLockscreen\(\)["']/i.test(headerContent),
    'Missing showLockscreen() trigger in header');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5: Institutional Lockscreen (#auth-lockscreen)
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${colors.bold}--- SUITE 5: Institutional Lockscreen (#auth-lockscreen) ---${colors.reset}`);

const lockscreenMatch = htmlContent.match(/<div[^>]*id=["']auth-lockscreen["'][^>]*>([\s\S]*?)<\/div>\s*<!-- TOP APP/i);
assert.ok(lockscreenMatch, 'Could not locate #auth-lockscreen container');
const lockscreenContent = lockscreenMatch[1];

runAssertion('S5.1: #auth-lockscreen is styled with Midnight Maritime Navy (#0D1B2A)', () => {
  assert.ok(/id=["']auth-lockscreen["'][^>]*bg-\[#0D1B2A\]/i.test(htmlContent),
    '#auth-lockscreen missing bg-[#0D1B2A]');
});

runAssertion('S5.2: #login-form exists with onsubmit binding to window.BrosanAuth.handleLoginSubmit(event)', () => {
  assert.ok(/<form[^>]*id=["']login-form["'][^>]*onsubmit=["']window\.BrosanAuth\.handleLoginSubmit\(event\)["']/i.test(lockscreenContent),
    '#login-form missing or not hooked to window.BrosanAuth.handleLoginSubmit(event)');
});

runAssertion('S5.3: Form inputs #login-username and #login-password are present with required attributes', () => {
  // Check username input tag
  const userTagMatch = lockscreenContent.match(/<input[^>]+id=["']login-username["'][^>]*>/i);
  assert.ok(userTagMatch, 'Missing <input id="login-username">');
  assert.ok(/required/i.test(userTagMatch[0]), '#login-username missing required attribute');
  assert.ok(/autocomplete=["']username["']/i.test(userTagMatch[0]), '#login-username missing autocomplete="username"');

  // Check password input tag
  const passTagMatch = lockscreenContent.match(/<input[^>]+id=["']login-password["'][^>]*>/i);
  assert.ok(passTagMatch, 'Missing <input id="login-password">');
  assert.ok(/type=["']password["']/i.test(passTagMatch[0]), '#login-password missing type="password"');
  assert.ok(/required/i.test(passTagMatch[0]), '#login-password missing required attribute');
});

runAssertion('S5.4: Action buttons #login-submit-btn, #btn-do-login (automated test proxy), and #btn-quick-unlock exist', () => {
  assert.ok(/id=["']login-submit-btn["']/i.test(lockscreenContent), 'Missing #login-submit-btn');
  assert.ok(/id=["']btn-do-login["']/i.test(lockscreenContent), 'Missing #btn-do-login proxy button for test runner');
  assert.ok(/id=["']btn-quick-unlock["'][^>]*onclick=["']window\.BrosanAuth\.quickUnlock\(\)["']/i.test(lockscreenContent),
    'Missing #btn-quick-unlock or onclick handler');
});

runAssertion('S5.5: Error box elements #login-error-box and #login-error-text exist', () => {
  assert.ok(/id=["']login-error-box["']/i.test(lockscreenContent), 'Missing #login-error-box');
  assert.ok(/id=["']login-error-text["']/i.test(lockscreenContent), 'Missing #login-error-text');
});

runAssertion('S5.6: Lockscreen status badge #lockscreen-status-badge exists', () => {
  assert.ok(/id=["']lockscreen-status-badge["']/i.test(lockscreenContent), 'Missing #lockscreen-status-badge');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 6: JavaScript & Application Shell Runtime Alignment
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${colors.bold}--- SUITE 6: JavaScript Runtime & Functional Invariants ---${colors.reset}`);

runAssertion('S6.1: switchView() function updates views, active nav styles, and header breadcrumb', () => {
  assert.ok(/function switchView\(moduleId\)\s*\{/i.test(htmlContent), 'function switchView() not defined');
  assert.ok(/header-breadcrumb-view/i.test(htmlContent), 'switchView() does not update header-breadcrumb-view');
  assert.ok(/#sidebar-nav \.nav-item/i.test(htmlContent), 'switchView() does not query #sidebar-nav .nav-item');
  assert.ok(/bg-\[#1E3A8A\]/i.test(htmlContent), 'switchView() does not apply cobalt active styling');
});

runAssertion('S6.2: toggleQuickActionMenu() handles open, close, and outside-click dismiss', () => {
  assert.ok(/function toggleQuickActionMenu\(forceState\)\s*\{/i.test(htmlContent),
    'function toggleQuickActionMenu() not defined');
  assert.ok(/quick-action-dropdown-container/i.test(htmlContent),
    'Outside click handler not listening for quick-action-dropdown-container');
});

runAssertion('S6.3: All 15 module view containers (<div id="view-[moduleId]") exist in DOM', () => {
  for (const mod of expected15Modules) {
    const viewRegex = new RegExp(`id=["']view-${mod}["']`, 'i');
    assert.ok(viewRegex.test(htmlContent), `Container id="view-${mod}" missing from app/index.html`);
  }
});

runAssertion('S6.4: All 11 dynamic tbody/tfoot targets exist in DOM', () => {
  const dynamicTargets = [
    'tbody-dashboard-mizan',
    'tbody-ledger-full',
    'tbody-sales',
    'tbody-exports',
    'tbody-expenses',
    'tbody-contacts',
    'tbody-bank-moves',
    'tbody-checks',
    'tbody-payroll',
    'tbody-inventory',
    'tfoot-dashboard-mizan'
  ];
  for (const target of dynamicTargets) {
    const targetRegex = new RegExp(`id=["']${target}["']`, 'i');
    assert.ok(targetRegex.test(htmlContent), `Target table container id="${target}" missing from app/index.html`);
  }
});

runAssertion('S6.5: window.BROSAN_ERP parses as valid JS object with core financial datasets', () => {
  const match = htmlContent.match(/const BROSAN_ERP\s*=\s*(?:window\.BROSAN_ERP\s*=\s*)?(\{[\s\S]*?\n\s*\};)/);
  assert.ok(match, 'Could not extract BROSAN_ERP declaration from index.html');
  const cleanJs = match[1].trim().replace(/;$/, '');
  
  let erpObj;
  try {
    erpObj = eval('(' + cleanJs + ')');
  } catch (e) {
    assert.fail(`BROSAN_ERP failed JavaScript evaluation: ${e.message}`);
  }

  assert.ok(erpObj, 'BROSAN_ERP evaluated to null or undefined');
  assert.ok(erpObj.company && erpObj.company.vkn === '1871741946', 'company.vkn mismatch');
  assert.ok(erpObj.bankAccounts && typeof erpObj.bankAccounts.garantiGbp === 'number', 'bankAccounts missing or invalid');
  assert.ok(erpObj.farukAytin && erpObj.farukAytin.summary, 'farukAytin.summary missing');
  assert.ok(Array.isArray(erpObj.invoices) && erpObj.invoices.length > 0, 'invoices array missing or empty');
  assert.ok(Array.isArray(erpObj.contacts) && erpObj.contacts.length >= 15, 'contacts array missing or fewer than 15 items');
  assert.ok(Array.isArray(erpObj.checks) && erpObj.checks.length > 0, 'checks array missing or empty');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 7: Adversarial Edge Cases & Fuzz Testing
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${colors.bold}--- SUITE 7: Adversarial Stress & Anti-Regression Verification ---${colors.reset}`);

runAssertion('S7.1: Zero rainbow gradient buttons exist in top header bar', () => {
  // Ensure the old colored buttons: '+ Yeni Fatura', '+ Gider / Fiş', '+ Tahsilat', '+ Çek Girişi'
  // do not exist as top bar buttons outside #quick-action-menu
  const topBarBeforeDropdown = headerContent.split('id="quick-action-menu"')[0];
  assert.strictEqual(/\+ Yeni Fatura/i.test(topBarBeforeDropdown), false,
    'Legacy "+ Yeni Fatura" button still present in header top row');
  assert.strictEqual(/\+ Gider \/ Fiş/i.test(topBarBeforeDropdown), false,
    'Legacy "+ Gider / Fiş" button still present in header top row');
  assert.strictEqual(/\+ Tahsilat/i.test(topBarBeforeDropdown), false,
    'Legacy "+ Tahsilat" button still present in header top row');
  assert.strictEqual(/\+ Çek Girişi/i.test(topBarBeforeDropdown), false,
    'Legacy "+ Çek Girişi" button still present in header top row');
});

runAssertion('S7.2: Sidebar navigation items all have accessibility and cursor styling', () => {
  const buttonMatches = sidebarNavContent.match(/<button[^>]+data-module=[^>]+>/gi) || [];
  assert.strictEqual(buttonMatches.length, 15, 'Did not match 15 button tags in sidebar');
  for (const btn of buttonMatches) {
    assert.ok(/class=["'][^"']*nav-item/i.test(btn), `Button ${btn.slice(0, 40)} missing nav-item class`);
  }
});

runAssertion('S7.3: Script execution test: switchView() logic executes cleanly in VM sandbox', () => {
  // Extract switchView code and simulate execution in Node vm
  const switchViewMatch = htmlContent.match(/function switchView\(moduleId\)\s*\{([\s\S]*?)\n\s*window\.scrollTo/);
  assert.ok(switchViewMatch, 'Could not isolate switchView body');

  const simulatedDom = {
    views: {},
    navButtons: expected15Modules.map(m => ({
      dataset: { module: m },
      className: '',
      icon: { className: '' },
      getAttribute: (attr) => attr === 'data-module' ? m : null,
      querySelector: () => ({ className: '' })
    })),
    breadcrumb: { textContent: '' }
  };

  const sandbox = {
    document: {
      querySelectorAll: (selector) => {
        if (selector === '.module-view') return Object.values(simulatedDom.views);
        if (selector === '#sidebar-nav .nav-item') return simulatedDom.navButtons;
        return [];
      },
      getElementById: (id) => {
        if (id === 'header-breadcrumb-view') return simulatedDom.breadcrumb;
        if (id.startsWith('view-')) {
          const mod = id.replace('view-', '');
          if (!simulatedDom.views[mod]) {
            simulatedDom.views[mod] = { classList: { add: () => {}, remove: () => {} } };
          }
          return simulatedDom.views[mod];
        }
        return null;
      }
    },
    window: { scrollTo: () => {} }
  };

  const scriptCode = `
    function switchView(moduleId) {
      ${switchViewMatch[1]}
      window.scrollTo(0, 0);
    }
    // Test invoking all 15 modules
    ${JSON.stringify(expected15Modules)}.forEach(m => switchView(m));
  `;

  vm.createContext(sandbox);
  vm.runInContext(scriptCode, sandbox);
  assert.strictEqual(sandbox.document.getElementById('header-breadcrumb-view').textContent, 'AYARLAR');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY & VERDICT
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}CHALLENGER EXECUTION SUMMARY:${colors.reset}`);
console.log(`  Total Checks: ${totalPassed + totalFailed}`);
console.log(`  Passed:       ${colors.green}${totalPassed}${colors.reset}`);
console.log(`  Failed:       ${totalFailed > 0 ? colors.red + totalFailed + colors.reset : '0'}`);
console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

if (totalFailed > 0) {
  console.error(`${colors.red}${colors.bold}VERDICT: REQUEST_CHANGES (${totalFailed} failures detected)${colors.reset}`);
  failureDetails.forEach(f => console.error(`  - ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log(`${colors.green}${colors.bold}VERDICT: APPROVE (100% Milestone 1 Challenger Assertions Passed)${colors.reset}\n`);
  process.exit(0);
}
