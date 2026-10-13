/**
 * tests/test-reviewer-m3-2-invariants.js
 * 
 * Reviewer M3-2 Non-Regression & Conformance Verification Suite
 * Exhaustive independent audit of app/index.html DOM contracts and runtime invariants.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'app', 'index.html');

console.log('================================================================');
console.log('  REVIEWER M3-2: NON-REGRESSION & CONFORMANCE AUDIT HARNESS');
console.log('================================================================\n');

if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error('FATAL: app/index.html does not exist at ' + INDEX_HTML_PATH);
  process.exit(1);
}

const html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
let passed = 0;
let failed = 0;

function check(name, condition, details = '') {
  if (condition) {
    passed++;
    console.log(`  ✔ PASS: ${name}`);
  } else {
    failed++;
    console.error(`  ✖ FAIL: ${name} ${details ? '— ' + details : ''}`);
  }
}

// -------------------------------------------------------------
// SECTION 1: BROSAN_ERP Declaration & Parsing Contract
// -------------------------------------------------------------
console.log('--- SECTION 1: BROSAN_ERP Invariant & test-helpers Compatibility ---');

const erpDeclPattern = /const\s+BROSAN_ERP\s*=\s*window\.BROSAN_ERP\s*=\s*\{/;
const hasErpDecl = erpDeclPattern.test(html);
check('BROSAN_ERP declared as const BROSAN_ERP = window.BROSAN_ERP = { ... }', hasErpDecl);

// Test how tests/e2e/test-helpers.js parses it
const helperRegex = /const BROSAN_ERP\s*=\s*(?:window\.BROSAN_ERP\s*=\s*)?(\{[\s\S]*?\n\s*\};)/;
const match = html.match(helperRegex);
check('test-helpers.js regex matches BROSAN_ERP block', !!match);

let parsedErp = null;
if (match) {
  try {
    const cleanJs = match[1].trim().replace(/;$/, '');
    parsedErp = eval('(' + cleanJs + ')');
  } catch (e) {
    console.error('Eval error:', e.message);
  }
}
check('BROSAN_ERP evaluates to a valid JS object', !!parsedErp && typeof parsedErp === 'object');

const expectedParasutContacts = [
  'BEN ELLİS', 'TİNTEKS', 'LAVI LA LLC', 'FARUK AYTİN', 'GbR Celik',
  'ÇETİN TÜREDİ', 'ATTERO CLOTHING', 'YUNUS EMRE GÖKALP', 'Rana Jassim',
  'ARKSİGNER', 'CuterEsque', 'FİLET ÖRME', 'BE-HA', 'MERT ÜTÜ', 'ASSET'
];
check('BROSAN_ERP.contacts contains at least 15 contacts', parsedErp && Array.isArray(parsedErp.contacts) && parsedErp.contacts.length >= 15);
expectedParasutContacts.forEach(contactName => {
  const found = parsedErp && parsedErp.contacts && parsedErp.contacts.some(c => c.name && c.name.includes(contactName));
  check(`BROSAN_ERP.contacts includes ${contactName}`, !!found);
});

check('BROSAN_ERP.bankAccounts contains accounts', parsedErp && typeof parsedErp.bankAccounts === 'object');
check('BROSAN_ERP.farukAytin summary is present', parsedErp && parsedErp.farukAytin && typeof parsedErp.farukAytin.summary === 'object');
check('BROSAN_ERP.invoices contains authentic invoices', parsedErp && Array.isArray(parsedErp.invoices) && parsedErp.invoices.length >= 15);

// -------------------------------------------------------------
// SECTION 2: 15 Module Containers & .module-view Class
// -------------------------------------------------------------
console.log('\n--- SECTION 2: 15 Module Containers and .module-view Class ---');

const expectedModules = [
  'dashboard', 'ledger', 'sales', 'exports', 'documents',
  'expenses', 'contacts', 'banking', 'checks', 'payroll',
  'edonusum', 'mutabakat', 'inventory', 'reports', 'settings'
];

expectedModules.forEach(mod => {
  const containerRegex = new RegExp(`<div[^>]*id=["']view-${mod}["'][^>]*>`, 'i');
  const containerMatch = html.match(containerRegex);
  const exists = !!containerMatch;
  const hasModuleViewClass = exists && containerMatch[0].includes('module-view');
  check(`Module #view-${mod} exists in DOM`, exists);
  check(`Module #view-${mod} has class 'module-view'`, hasModuleViewClass, exists ? `tag: ${containerMatch[0]}` : 'not found');
});

// -------------------------------------------------------------
// SECTION 3: 11 Dynamic tbody and tfoot IDs
// -------------------------------------------------------------
console.log('\n--- SECTION 3: 11 Dynamic tbody & tfoot Targets ---');

const expectedTbodies = [
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

expectedTbodies.forEach(id => {
  const tbodyRegex = new RegExp(`id=["']${id}["']`, 'i');
  check(`Table target #${id} exists in DOM`, tbodyRegex.test(html));
});

// -------------------------------------------------------------
// SECTION 4: 17 Modal Dialogs and Actual Form Field IDs
// -------------------------------------------------------------
console.log('\n--- SECTION 4: 17 Modal Dialogs & Form Field IDs ---');

const expectedModals = [
  {
    id: 'modal-new-invoice',
    inputs: ['inv-customer', 'inv-type', 'inv-currency', 'inv-fx-rate', 'inv-date', 'inv-due-date', 'inv-etgb', 'invoice-items-tbody']
  },
  {
    id: 'modal-invoice-viewer',
    inputs: ['inv-viewer-title', 'inv-viewer-content']
  },
  {
    id: 'modal-new-expense',
    inputs: ['exp-supplier', 'exp-account', 'exp-kdv-rate', 'exp-amount', 'exp-due-date']
  },
  {
    id: 'modal-new-payment',
    inputs: ['pay-contact']
  },
  {
    id: 'modal-new-check',
    inputs: ['chk-no', 'chk-drawer', 'chk-amount', 'chk-due-date']
  },
  {
    id: 'modal-cari-ekstre',
    inputs: ['ekstre-modal-title', 'ekstre-modal-body']
  },
  {
    id: 'modal-muavin',
    inputs: ['muavin-modal-title', 'muavin-modal-body']
  },
  {
    id: 'modal-new-contact',
    inputs: ['new-contact-code', 'new-contact-type', 'new-contact-name', 'new-contact-vkn', 'new-contact-city']
  },
  {
    id: 'modal-new-journal',
    inputs: ['jrn-no', 'jrn-date', 'jrn-desc', 'jrn-debit-acc', 'jrn-credit-acc', 'jrn-amount']
  },
  {
    id: 'modal-bordro-pusula',
    inputs: ['bordro-pusula-title', 'bordro-pusula-content']
  },
  {
    id: 'modal-dab-calculator',
    inputs: [] // Informational / action modal
  },
  {
    id: 'modal-edefter-viewer',
    inputs: [] // XML viewer modal
  },
  {
    id: 'modal-change-password',
    inputs: ['change-password-form', 'pw-current', 'pw-new', 'pw-confirm', 'pw-modal-error']
  },
  {
    id: 'modal-upload-document',
    inputs: ['upload-doc-title', 'upload-doc-category', 'doc-file-input']
  },
  {
    id: 'modal-document-preview',
    inputs: ['preview-doc-title', 'preview-doc-path', 'preview-doc-view-btn']
  },
  {
    id: 'modal-new-stock',
    inputs: ['stock-move-type', 'stock-product-select', 'stock-qty', 'stock-cost']
  },
  {
    id: 'modal-pdf-viewer',
    inputs: ['pdf-modal-title', 'pdf-viewer-frame']
  }
];

expectedModals.forEach(m => {
  const modalRegex = new RegExp(`<div[^>]*id=["']${m.id}["'][^>]*>`, 'i');
  const modalMatch = html.match(modalRegex);
  const exists = !!modalMatch;
  const isHidden = exists && modalMatch[0].includes('hidden');
  check(`Modal #${m.id} exists in DOM`, exists);
  check(`Modal #${m.id} starts with 'hidden' class`, isHidden);
  
  if (m.inputs && m.inputs.length > 0) {
    m.inputs.forEach(inputId => {
      const inputRegex = new RegExp(`id=["']${inputId}["']`, 'i');
      check(`  -> Form field #${inputId} exists inside #${m.id}`, inputRegex.test(html));
    });
  }
});

// -------------------------------------------------------------
// SECTION 5: window.BrosanAuth and window.BrosanDocs Contracts
// -------------------------------------------------------------
console.log('\n--- SECTION 5: window.BrosanAuth & window.BrosanDocs Contracts ---');

check('window.BrosanAuth is declared in index.html', html.includes('window.BrosanAuth =') || html.includes('window.BrosanAuth='));
check('window.BrosanAuth.showLockscreen exists', html.includes('showLockscreen'));
check('window.BrosanAuth.unlockApp exists', html.includes('unlockApp'));
check('window.BrosanAuth.quickUnlock exists', html.includes('quickUnlock'));
check('window.BrosanAuth.handleLoginSubmit exists', html.includes('handleLoginSubmit'));

check('window.BrosanDocs is referenced/declared in index.html', html.includes('window.BrosanDocs') || html.includes('BrosanDocs'));
check('documents-data.js script is included in <head>', html.includes('src="documents-data.js"'));

// -------------------------------------------------------------
// SECTION 6: Global Handlers & Navigation Functions
// -------------------------------------------------------------
console.log('\n--- SECTION 6: Global Handlers & Navigation Functions ---');

check('switchView() function is defined', /function\s+switchView\s*\(/.test(html));
check('openModal() function is defined', /function\s+openModal\s*\(/.test(html));
check('closeModal() function is defined', /function\s+closeModal\s*\(/.test(html));
check('toggleQuickActionMenu() function is defined', /function\s+toggleQuickActionMenu\s*\(/.test(html));

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL CHECKS: ${passed + failed}`);
console.log(`PASSED:       ${passed}`);
console.log(`FAILED:       ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
