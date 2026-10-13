/**
 * tests/test-m3-challenger-full.js
 * 
 * EMPIRICAL ADVERSARIAL CHALLENGER VERIFICATION SUITE — MILESTONE 3
 * Full-Application Empirical Verifier for Brosan Tekstil ERP (app/index.html)
 * 
 * Comprehensive Automated Verification Requirements:
 * 1. Module Views Integrity: All 14/15 module views exist and contain Level 1 white cards
 *    with 1px #E2E8F0 / border-slate-200 borders (or .card-atelier). Zero rainbow badge classes.
 * 2. Dynamic Table Targets: All 11 dynamic tbody / tfoot targets exist for data hydration.
 * 3. Modal Dialog Containers: All 17 modal containers exist with proper input IDs and close handlers.
 * 4. Runtime & Architecture Integrity: switchView navigation, breadcrumb synchronization,
 *    quick action menu, auth lockscreen mechanics, and BROSAN_ERP data integrity.
 * 5. Adversarial Stress & Anti-Regression Invariants: Zero legacy rainbow action buttons,
 *    zero novelty sidebar badges, and resilience under adversarial invalid arguments.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'app', 'index.html');

// ANSI Terminal Colors for High-Fidelity Output
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
  failureDetails.push({ name, error: error.message || String(error) });
  console.log(`  ${colors.red}✖ FAIL${colors.reset} ${name} — ${error.message || String(error)}`);
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
console.log(`${colors.bold}${colors.cyan}   CHALLENGER M3-1: FULL-APPLICATION EMPIRICAL VERIFICATION HARNESS             ${colors.reset}`);
console.log(`${colors.dim}   Target File: ${INDEX_HTML_PATH}${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

// Load index.html
if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error(`${colors.red}CRITICAL ERROR: app/index.html not found at ${INDEX_HTML_PATH}${colors.reset}`);
  process.exit(1);
}

const htmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
const htmlLines = htmlContent.split(/\r?\n/);
console.log(`Loaded app/index.html: ${htmlLines.length.toLocaleString()} lines, ${(htmlContent.length / 1024).toFixed(1)} KB.\n`);

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: 14/15 Module Views & Level 1 White Cards & Zero Rainbow Badges
// ─────────────────────────────────────────────────────────────────────────────
console.log(`${colors.bold}--- SUITE 1: Module Views, Level 1 White Cards & Badge Class Architecture ---${colors.reset}`);

const all15Views = [
  'dashboard',
  'ledger',
  'sales',
  'exports',
  'documents',
  'expenses',
  'contacts',
  'banking',
  'checks',
  'payroll',
  'edonusum',
  'mutabakat',
  'inventory',
  'reports',
  'settings'
];

// Helper to isolate view HTML block
function getViewHtml(viewName) {
  const startPattern = new RegExp(`<div[^>]+id=["']view-${viewName}["'][^>]*>`, 'i');
  const match = htmlContent.match(startPattern);
  if (!match) return null;
  const startIdx = match.index;

  // Next view starts or main closes
  let nextIdx = htmlContent.length;
  all15Views.forEach(other => {
    if (other !== viewName) {
      const otherMatch = htmlContent.slice(startIdx + 10).match(new RegExp(`<div[^>]+id=["']view-${other}["'][^>]*>`, 'i'));
      if (otherMatch) {
        const absIdx = startIdx + 10 + otherMatch.index;
        if (absIdx < nextIdx) nextIdx = absIdx;
      }
    }
  });

  const mainEndMatch = htmlContent.slice(startIdx).match(/<\/main>/i);
  if (mainEndMatch) {
    const absMainEnd = startIdx + mainEndMatch.index;
    if (absMainEnd < nextIdx) nextIdx = absMainEnd;
  }

  return htmlContent.slice(startIdx, nextIdx);
}

// 1.1 Verify all 15 views exist in the DOM
runAssertion('S1.1: All 15 module views exist with <div id="view-[module]">', () => {
  all15Views.forEach(v => {
    const regex = new RegExp(`id=["']view-${v}["']`, 'i');
    assert.ok(regex.test(htmlContent), `Module container id="view-${v}" is missing from app/index.html`);
  });
});

// 1.2 Verify all module views contain Level 1 white cards with 1px #E2E8F0 borders or card-atelier
all15Views.forEach(v => {
  runAssertion(`S1.2.${v}: View "#view-${v}" contains Level 1 white cards with 1px #E2E8F0/slate-200 borders`, () => {
    const viewHtml = getViewHtml(v);
    assert.ok(viewHtml, `Could not extract HTML section for #view-${v}`);

    // Check for card-atelier or white cards (bg-white border border-[#E2E8F0] or border-slate-200)
    const hasCardAtelier = /class=["'][^"']*card-atelier[^"']*["']/i.test(viewHtml);
    const hasWhiteBorderCard = /class=["'][^"']*bg-white[^"']*border(?:-[#E2E8F0]|-slate-200)[^"']*["']/i.test(viewHtml);
    const hasBorderUtility = /(?:#E2E8F0|slate-200|border-color)/i.test(viewHtml);

    assert.ok(hasCardAtelier || (hasWhiteBorderCard && hasBorderUtility),
      `#view-${v} does not contain standard Level 1 white cards with 1px #E2E8F0/slate-200 borders`);
  });
});

// 1.3 Verify zero rainbow badge classes exist across the entire application markup
const bannedRainbowBadgeClasses = [
  'badge-purple',
  'badge-pink',
  'badge-orange',
  'badge-violet',
  'badge-indigo',
  'badge-fuchsia',
  'badge-cyan',
  'badge-teal',
  'badge-rose',
  'badge-yellow',
  'badge-gradient',
  'badge-blue-gradient',
  'badge-rainbow'
];

bannedRainbowBadgeClasses.forEach(bannedClass => {
  runAssertion(`S1.3.ZeroRainbow: Class "${bannedClass}" is 100% ABSENT from markup`, () => {
    const regex = new RegExp(`class=["'][^"']*\\b${bannedClass}\\b[^"']*["']`, 'i');
    assert.strictEqual(regex.test(htmlContent), false,
      `Banned rainbow badge class "${bannedClass}" found in app/index.html!`);
  });
});

// 1.4 Verify only approved semantic badges are utilized
runAssertion('S1.4: Only certified semantic badges (approved, pending, alert, neutral, atelier, status) are used', () => {
  const badgeRegex = /class=["']([^"']*badge-[a-z0-9-]+[^"']*)["']/gi;
  let match;
  const certifiedBadges = new Set(['badge-atelier', 'badge-approved', 'badge-pending', 'badge-alert', 'badge-neutral', 'badge-status']);
  const violations = [];

  while ((match = badgeRegex.exec(htmlContent)) !== null) {
    const classes = match[1].split(/\s+/);
    classes.forEach(c => {
      if (c.startsWith('badge-') && !certifiedBadges.has(c)) {
        violations.push(c);
      }
    });
  }

  assert.strictEqual(violations.length, 0, `Uncertified badge classes discovered: ${[...new Set(violations)].join(', ')}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: Dynamic Table Targets (All 11 Dynamic tbody/tfoot Elements)
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${colors.bold}--- SUITE 2: Dynamic Table Targets (All 11 tbody/tfoot Targets) ---${colors.reset}`);

const requiredTableTargets = [
  { id: 'tbody-dashboard-mizan', tag: 'TBODY', desc: 'Kokpit TDHP Mizan Dinamik Satırları' },
  { id: 'tfoot-dashboard-mizan', tag: 'TFOOT', desc: 'Kokpit Mizan Toplam / Denge Satırı' },
  { id: 'tbody-ledger-full', tag: 'TBODY', desc: 'Genel Muhasebe 70+ Hesap Mizan Tablosu' },
  { id: 'tbody-sales', tag: 'TBODY', desc: 'Satış Faturaları ve e-Arşiv/e-İhracat Listesi' },
  { id: 'tbody-exports', tag: 'TBODY', desc: 'İhracat Beyannameleri ve İBKB Takip Masası' },
  { id: 'tbody-expenses', tag: 'TBODY', desc: 'Giderler, Tedarikçi Alışları ve Fişler' },
  { id: 'tbody-contacts', tag: 'TBODY', desc: '15 Müşteri ve Tedarikçi Cari Kart Listesi' },
  { id: 'tbody-bank-moves', tag: 'TBODY', desc: 'Banka ve Kasa Hareketleri Akışı' },
  { id: 'tbody-checks', tag: 'TBODY', desc: 'Portföy Çek & Senet Takip Masası' },
  { id: 'tbody-payroll', tag: 'TBODY', desc: '18 Personel SGK ve Ücret Bordro Listesi' },
  { id: 'tbody-inventory', tag: 'TBODY', desc: 'Kumaş & İplik Hammadde Stok Tablosu' }
];

requiredTableTargets.forEach(target => {
  runAssertion(`S2.Target: #${target.id} (${target.desc}) exists with correct DOM semantics`, () => {
    const regex = new RegExp(`<(${target.tag})[^>]*id=["']${target.id}["'][^>]*>`, 'i');
    assert.ok(regex.test(htmlContent), `Container id="${target.id}" with tag <${target.tag}> not found in app/index.html`);
  });
});

// Auxiliary table targets verification
runAssertion('S2.Auxiliary: Auxiliary dynamic table targets exist (invoice-items-tbody, doc-results-container)', () => {
  assert.ok(/id=["']invoice-items-tbody["']/i.test(htmlContent), 'Missing #invoice-items-tbody in modal-new-invoice');
  assert.ok(/id=["']doc-results-container["']/i.test(htmlContent), 'Missing #doc-results-container in view-documents');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: Modal Dialog Containers (All 17 Modals with Inputs & Close Handlers)
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${colors.bold}--- SUITE 3: Modal Dialog Containers (17 Modals, Inputs & Handlers) ---${colors.reset}`);

const required17Modals = [
  {
    id: 'modal-new-invoice',
    desc: 'Yeni Satış Faturası Giriş Masası',
    expectedInputs: ['inv-customer', 'inv-type', 'inv-scenario', 'inv-currency', 'inv-date'],
    closePattern: /closeModal\(['"]modal-new-invoice['"]\)/
  },
  {
    id: 'modal-invoice-viewer',
    desc: 'e-Fatura & e-Arşiv Resmi GİB Görüntüleyici',
    expectedInputs: [],
    closePattern: /closeModal\(['"]modal-invoice-viewer['"]\)/
  },
  {
    id: 'modal-new-expense',
    desc: 'Yeni Gider / Alış Fişi Kayıt Masası',
    expectedInputs: ['exp-supplier', 'exp-account', 'exp-kdv-rate', 'exp-amount'],
    closePattern: /closeModal\(['"]modal-new-expense['"]\)/
  },
  {
    id: 'modal-new-payment',
    desc: 'Kasa & Banka Tahsilat Eşleme Masası',
    expectedInputs: ['pay-contact'],
    closePattern: /closeModal\(['"]modal-new-payment['"]\)/
  },
  {
    id: 'modal-new-check',
    desc: 'Yeni Çek & Senet Portföy Kaydı',
    expectedInputs: ['chk-no', 'chk-drawer', 'chk-amount', 'chk-due-date'],
    closePattern: /closeModal\(['"]modal-new-check['"]\)/
  },
  {
    id: 'modal-cari-ekstre',
    desc: 'Cari Hesap Ekstresi & WhatsApp Raporu',
    expectedInputs: [],
    closePattern: /closeModal\(['"]modal-cari-ekstre['"]\)/
  },
  {
    id: 'modal-muavin',
    desc: 'TDHP Muavin Defter Detay İnceleme',
    expectedInputs: [],
    closePattern: /closeModal\(['"]modal-muavin['"]\)/
  },
  {
    id: 'modal-new-contact',
    desc: 'Yeni Müşteri & Tedarikçi Cari Kartı',
    expectedInputs: ['new-contact-code', 'new-contact-name', 'new-contact-vkn', 'new-contact-type'],
    closePattern: /closeModal\(['"]modal-new-contact['"]\)/
  },
  {
    id: 'modal-new-journal',
    desc: 'Mahsup Fişi / Yevmiye Kaydı Masası',
    expectedInputs: ['jrn-no', 'jrn-date', 'jrn-desc', 'jrn-debit-acc', 'jrn-credit-acc', 'jrn-amount'],
    closePattern: /closeModal\(['"]modal-new-journal['"]\)/
  },
  {
    id: 'modal-bordro-pusula',
    desc: 'Personel Ücret Hesap Pusulası Görüntüleyici',
    expectedInputs: [],
    closePattern: /closeModal\(['"]modal-bordro-pusula['"]\)/
  },
  {
    id: 'modal-dab-calculator',
    desc: 'TCMB %40 İBKB & DAB Döviz Bozum Simülatörü',
    expectedInputs: [],
    closePattern: /closeModal\(['"]modal-dab-calculator['"]\)/
  },
  {
    id: 'modal-edefter-viewer',
    desc: 'GİB e-Defter ve Berat Arşivi İnceleme Masası',
    expectedInputs: [],
    closePattern: /closeModal\(['"]modal-edefter-viewer['"]\)/
  },
  {
    id: 'modal-change-password',
    desc: 'Yönetici Şifre Değiştirme Modalı',
    expectedInputs: ['pw-current', 'pw-new', 'pw-confirm'],
    closePattern: /window\.BrosanAuth\.closePasswordModal\(\)|closeModal\(['"]modal-change-password['"]\)/
  },
  {
    id: 'modal-upload-document',
    desc: 'Resmi Evrak & Yükleme Belgesi Yükleyici',
    expectedInputs: ['doc-file-input', 'upload-doc-title', 'upload-doc-category'],
    closePattern: /closeModal\(['"]modal-upload-document['"]\)/
  },
  {
    id: 'modal-document-preview',
    desc: 'Belge & Arşiv Önizleme Kartı',
    expectedInputs: ['preview-doc-path'],
    closePattern: /closeModal\(['"]modal-document-preview['"]\)/
  },
  {
    id: 'modal-new-stock',
    desc: 'Depo & Stok Hareketi (Giriş/Çıkış) Masası',
    expectedInputs: ['stock-move-type', 'stock-product-select', 'stock-qty', 'stock-cost'],
    closePattern: /closeModal\(['"]modal-new-stock['"]\)/
  },
  {
    id: 'modal-pdf-viewer',
    desc: 'Kesintisiz Resmi PDF & Belge Görüntüleyici',
    expectedInputs: [],
    closePattern: /closeInAppPdfViewer\(\)|closeModal\(['"]modal-pdf-viewer['"]\)/
  }
];

// Helper to isolate modal HTML block
function getModalHtml(modalId) {
  const startPattern = new RegExp(`<div[^>]+id=["']${modalId}["'][^>]*>`, 'i');
  const match = htmlContent.match(startPattern);
  if (!match) return null;
  const startIdx = match.index;

  // Next modal starts or toast container or script begins
  let nextIdx = htmlContent.length;
  required17Modals.forEach(other => {
    if (other.id !== modalId) {
      const otherMatch = htmlContent.slice(startIdx + 10).match(new RegExp(`<div[^>]+id=["']${other.id}["'][^>]*>`, 'i'));
      if (otherMatch) {
        const absIdx = startIdx + 10 + otherMatch.index;
        if (absIdx < nextIdx) nextIdx = absIdx;
      }
    }
  });

  const toastMatch = htmlContent.slice(startIdx).match(/id=["']toast-container["']/i);
  if (toastMatch) {
    const absToast = startIdx + toastMatch.index;
    if (absToast < nextIdx) nextIdx = absToast;
  }

  return htmlContent.slice(startIdx, nextIdx);
}

runAssertion('S3.0: Exactly 17 modal containers exist in app/index.html', () => {
  const modalMatches = [...htmlContent.matchAll(/<div[^>]+id=["'](modal-[a-z0-9-]+)["'][^>]*>/gi)].map(m => m[1]);
  assert.strictEqual(modalMatches.length, 17, `Expected exactly 17 modals, found ${modalMatches.length}: ${modalMatches.join(', ')}`);
});

required17Modals.forEach(m => {
  runAssertion(`S3.Modal: #${m.id} (${m.desc}) exists, has close handler and required inputs`, () => {
    const modalHtml = getModalHtml(m.id);
    assert.ok(modalHtml, `Could not extract modal content for #${m.id}`);

    // 1. Verify modal container classes: fixed inset-0, z-50, hidden
    assert.ok(/fixed\s+inset-0/i.test(modalHtml), `Modal #${m.id} missing "fixed inset-0" overlay class`);
    assert.ok(/z-50/i.test(modalHtml), `Modal #${m.id} missing "z-50" stacking class`);
    assert.ok(/hidden/i.test(modalHtml), `Modal #${m.id} missing initial "hidden" class`);

    // 2. Verify close handler exists
    assert.ok(m.closePattern.test(modalHtml), `Modal #${m.id} missing valid close handler matching ${m.closePattern}`);

    // 3. Verify all expected input IDs exist
    m.expectedInputs.forEach(inputId => {
      const inputRegex = new RegExp(`id=["']${inputId}["']`, 'i');
      assert.ok(inputRegex.test(modalHtml), `Modal #${m.id} missing required input id="${inputId}"`);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: Functional Invariants & Runtime Contracts
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${colors.bold}--- SUITE 4: Functional Invariants & JavaScript Contracts ---${colors.reset}`);

runAssertion('S4.1: BROSAN_ERP object declared verbatim on window and intact with all datasets', () => {
  const match = htmlContent.match(/const BROSAN_ERP\s*=\s*(?:window\.BROSAN_ERP\s*=\s*)?(\{[\s\S]*?\n\s*\};)/);
  assert.ok(match, 'const BROSAN_ERP declaration missing in app/index.html');

  const cleanJs = match[1].trim().replace(/;$/, '');
  let erp;
  try {
    erp = eval('(' + cleanJs + ')');
  } catch (err) {
    assert.fail(`BROSAN_ERP failed evaluation: ${err.message}`);
  }

  assert.ok(erp.company && erp.company.vkn === '1871741946', 'company.vkn must be 1871741946');
  assert.ok(Array.isArray(erp.contacts) && erp.contacts.length >= 15, `contacts array must have >= 15 items, got ${erp.contacts.length}`);
  assert.ok(Array.isArray(erp.accounts) && erp.accounts.length === 14, `accounts array must have 14 items, got ${erp.accounts.length}`);
  assert.strictEqual(erp.bankAccounts.garantiGbp, 23759.07, 'Garanti GBP balance mismatch');
  assert.strictEqual(erp.bankAccounts.garantiTry, 15732.92, 'Garanti TRY balance mismatch');
  assert.strictEqual(erp.farukAytin.summary.netKalanBorcUsd, 784.60, 'Faruk Aytin netKalanBorcUsd mismatch');
});

runAssertion('S4.2: window.BrosanAuth object contains complete lifecycle methods', () => {
  assert.ok(/window\.BrosanAuth\s*=\s*\{/i.test(htmlContent), 'window.BrosanAuth not defined');
  const requiredAuthMethods = [
    'init',
    'showLockscreen',
    'unlockApp',
    'quickUnlock',
    'handleLoginSubmit',
    'openPasswordModal',
    'closePasswordModal',
    'submitChangePassword',
    'logout'
  ];
  requiredAuthMethods.forEach(method => {
    const regex = new RegExp(`\\b${method}\\s*\\(`, 'i');
    assert.ok(regex.test(htmlContent), `window.BrosanAuth missing method "${method}"`);
  });
});

runAssertion('S4.3: #auth-lockscreen institutional structure with form inputs and quick unlock proxy', () => {
  assert.ok(/id=["']auth-lockscreen["']/i.test(htmlContent), 'Missing #auth-lockscreen');
  assert.ok(/id=["']login-form["']/i.test(htmlContent), 'Missing #login-form');
  assert.ok(/id=["']login-username["']/i.test(htmlContent), 'Missing #login-username');
  assert.ok(/id=["']login-password["']/i.test(htmlContent), 'Missing #login-password');
  assert.ok(/id=["']login-submit-btn["']/i.test(htmlContent), 'Missing #login-submit-btn');
  assert.ok(/id=["']btn-do-login["']/i.test(htmlContent), 'Missing #btn-do-login test proxy');
  assert.ok(/id=["']btn-quick-unlock["']/i.test(htmlContent), 'Missing #btn-quick-unlock');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5: Adversarial Stress, Fuzzing & Anti-Regression Verification
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${colors.bold}--- SUITE 5: Adversarial Stress & Anti-Regression Verification ---${colors.reset}`);

runAssertion('S5.1: Zero legacy colorful quick buttons (+ Yeni Fatura, + Gider) remain in header root', () => {
  const headerMatch = htmlContent.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
  assert.ok(headerMatch, 'Could not extract header');
  const topBarBeforeMenu = headerMatch[1].split('id="quick-action-menu"')[0];

  assert.strictEqual(/\+ Yeni Fatura/i.test(topBarBeforeMenu), false, 'Legacy "+ Yeni Fatura" found in header');
  assert.strictEqual(/\+ Gider \/ Fiş/i.test(topBarBeforeMenu), false, 'Legacy "+ Gider / Fiş" found in header');
  assert.strictEqual(/\+ Tahsilat/i.test(topBarBeforeMenu), false, 'Legacy "+ Tahsilat" found in header');
  assert.strictEqual(/\+ Çek Girişi/i.test(topBarBeforeMenu), false, 'Legacy "+ Çek Girişi" found in header');
});

runAssertion('S5.2: Top bar consolidated trigger properly wires to toggleQuickActionMenu()', () => {
  assert.ok(/id=["']quick-action-dropdown-container["']/i.test(htmlContent), 'Missing quick-action container');
  assert.ok(/onclick=["']toggleQuickActionMenu\(\)["']/i.test(htmlContent), 'Missing toggle trigger');
  assert.ok(/id=["']quick-action-menu["']/i.test(htmlContent), 'Missing quick-action-menu dropdown');
});

runAssertion('S5.3: switchView simulation in sandboxed VM switches all 15 views without corruption', () => {
  const switchStart = htmlContent.indexOf('function switchView(moduleId)');
  assert.ok(switchStart !== -1, 'function switchView not found');
  const switchEnd = htmlContent.indexOf('// Bind sidebar buttons', switchStart);
  assert.ok(switchEnd !== -1, 'switchView end anchor not found');
  const switchBody = htmlContent.slice(switchStart, switchEnd);

  const mockDom = {
    views: {},
    navButtons: all15Views.map(m => ({
      dataset: { module: m },
      className: '',
      getAttribute: (a) => a === 'data-module' ? m : null,
      querySelector: () => ({ className: '' })
    })),
    breadcrumb: { textContent: '' }
  };

  all15Views.forEach(v => {
    mockDom.views[v] = {
      classList: {
        _classes: new Set(),
        add: function(c) { this._classes.add(c); },
        remove: function(c) { this._classes.delete(c); },
        contains: function(c) { return this._classes.has(c); }
      }
    };
  });

  const sandbox = {
    document: {
      querySelectorAll: (sel) => {
        if (sel === '.module-view') return Object.values(mockDom.views);
        if (sel === '#sidebar-nav .nav-item') return mockDom.navButtons;
        return [];
      },
      getElementById: (id) => {
        if (id === 'header-breadcrumb-view') return mockDom.breadcrumb;
        if (id.startsWith('view-')) {
          const mod = id.replace('view-', '');
          return mockDom.views[mod] || null;
        }
        return null;
      }
    },
    window: { scrollTo: () => {} },
    console: { log: () => {}, warn: () => {}, error: () => {} }
  };

  const script = `
    ${switchBody}
    // Test sequentially switching to all 15 views
    ${JSON.stringify(all15Views)}.forEach(v => switchView(v));
    // Test adversarial invalid inputs
    switchView(null);
    switchView(undefined);
    switchView('attacker_injection_view');
    // Switch back to dashboard
    switchView('dashboard');
  `;

  vm.createContext(sandbox);
  assert.doesNotThrow(() => {
    vm.runInContext(script, sandbox);
  }, 'switchView threw exception under adversarial simulation');

  assert.strictEqual(sandbox.document.getElementById('header-breadcrumb-view').textContent, 'KOKPİT');
  assert.ok(mockDom.views['dashboard'].classList.contains('active'), '#view-dashboard must be active');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY & VERDICT
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}CHALLENGER M3-1 EXECUTION SUMMARY:${colors.reset}`);
console.log(`  Total Checks: ${totalPassed + totalFailed}`);
console.log(`  Passed:       ${colors.green}${totalPassed}${colors.reset}`);
console.log(`  Failed:       ${totalFailed > 0 ? colors.red + totalFailed + colors.reset : '0'}`);
console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

if (totalFailed > 0) {
  console.error(`${colors.red}${colors.bold}VERDICT: REQUEST_CHANGES (${totalFailed} failures detected)${colors.reset}`);
  failureDetails.forEach(f => console.error(`  - ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log(`${colors.green}${colors.bold}VERDICT: APPROVE (100% Milestone 3 Challenger Empirical Assertions Passed)${colors.reset}\n`);
  process.exit(0);
}
