/**
 * tests/test-challenger-m3-2-dom-vm.js
 * 
 * Adversarial Empirical Challenger Suite for Milestone M3-2:
 * Headless DOM Runtime Simulator & VM Validator for Brosan ERP.
 * 
 * Test Coverage:
 * 1. DOM Element extraction & cataloging across all 15 views and 17 modals
 * 2. Sandboxed Node.js VM execution of actual scripts from app/index.html
 * 3. Empirical verification of switchView(moduleId) for all 15 modules + adversarial fuzzing
 * 4. Empirical verification of openModal(modalId) and closeModal(modalId) for all 17 modals + idempotency
 * 5. Full data integrity audit of window.BROSAN_ERP (Faruk Aytin, Ben Ellis, Garanti bank balances, accounts, contacts)
 * 6. Adversarial edge cases: null/undefined params, rapid cycling, prototype pollution resilience
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'app', 'index.html');

console.log('================================================================');
console.log('  BROSAN ERP — CHALLENGER M3-2 DOM RUNTIME SIMULATOR & VM SUITE ');
console.log('================================================================\n');

// -----------------------------------------------------------------
// Step 1: Lightweight DOM ClassList & Elements
// -----------------------------------------------------------------
class ClassList {
  constructor(initial = '') {
    this._classes = new Set(initial.split(/\s+/).filter(Boolean));
  }
  add(...tokens) {
    tokens.forEach(t => { if (t) this._classes.add(t); });
  }
  remove(...tokens) {
    tokens.forEach(t => this._classes.delete(t));
  }
  toggle(token, force) {
    if (typeof force === 'boolean') {
      if (force) this.add(token);
      else this.remove(token);
      return force;
    }
    if (this._classes.has(token)) {
      this._classes.delete(token);
      return false;
    } else {
      this._classes.add(token);
      return true;
    }
  }
  contains(token) {
    return this._classes.has(token);
  }
  toString() {
    return Array.from(this._classes).join(' ');
  }
}

class DOMElement {
  constructor(tagName, attrs = {}, textContent = '') {
    this.tagName = tagName.toUpperCase();
    this.attributes = { ...attrs };
    this.id = attrs.id || '';
    this._classList = new ClassList(attrs.class || attrs.className || '');
    this.children = [];
    this.parentElement = null;
    this._textContent = textContent;
    this.value = attrs.value || '';
    this.placeholder = attrs.placeholder || '';
    this.isFocused = false;
    this.eventListeners = {};
    this.style = {};
  }

  get className() {
    return this._classList.toString();
  }

  set className(val) {
    this._classList = new ClassList(val);
    this.attributes.class = val;
  }

  get classList() {
    return this._classList;
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(val) {
    this._textContent = String(val);
  }

  get innerText() {
    return this._textContent;
  }

  set innerText(val) {
    this._textContent = String(val);
  }

  getAttribute(name) {
    if (name === 'class' || name === 'className') return this.className;
    if (name === 'id') return this.id;
    return this.attributes[name] !== undefined ? this.attributes[name] : null;
  }

  setAttribute(name, val) {
    this.attributes[name] = String(val);
    if (name === 'id') this.id = String(val);
    if (name === 'class' || name === 'className') this.className = String(val);
  }

  focus() {
    this.isFocused = true;
  }

  blur() {
    this.isFocused = false;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  addEventListener(event, fn) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(fn);
  }

  dispatchEvent(event) {
    const listeners = this.eventListeners[event.type || event] || [];
    listeners.forEach(fn => fn(event));
  }

  contains(target) {
    if (target === this) return true;
    for (const child of this.children) {
      if (child.contains(target)) return true;
    }
    return false;
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    const match = (elem) => {
      if (selector.startsWith('#')) {
        return elem.id === selector.slice(1);
      }
      if (selector.startsWith('.')) {
        return elem.classList.contains(selector.slice(1));
      }
      if (selector.startsWith('[') && selector.endsWith(']')) {
        const inner = selector.slice(1, -1);
        if (inner.includes('=')) {
          const [k, v] = inner.split('=');
          const cleanV = v.replace(/^["']|["']$/g, '');
          return elem.getAttribute(k) === cleanV;
        } else {
          return elem.getAttribute(inner) !== null;
        }
      }
      return elem.tagName.toLowerCase() === selector.toLowerCase();
    };

    const traverse = (elem) => {
      for (const child of elem.children) {
        if (match(child)) results.push(child);
        traverse(child);
      }
    };
    traverse(this);
    return results;
  }
}

class DOMDocument extends DOMElement {
  constructor() {
    super('DOCUMENT');
    this.elementsById = new Map();
  }

  registerElement(elem) {
    if (elem.id) {
      this.elementsById.set(elem.id, elem);
    }
  }

  getElementById(id) {
    return this.elementsById.get(id) || null;
  }

  querySelectorAll(selector) {
    if (selector.includes(' ')) {
      const parts = selector.split(/\s+/).filter(Boolean);
      let currentSet = [this];
      for (const part of parts) {
        const nextSet = [];
        for (const parent of currentSet) {
          nextSet.push(...parent.querySelectorAll(part));
        }
        currentSet = nextSet;
      }
      return currentSet;
    }
    return super.querySelectorAll(selector);
  }

  querySelector(selector) {
    const list = this.querySelectorAll(selector);
    return list.length > 0 ? list[0] : null;
  }
}

// -----------------------------------------------------------------
// Step 2: HTML Parsing & DOM Invariants Catalog
// -----------------------------------------------------------------
console.log('Loading and parsing app/index.html...');
const htmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
const doc = new DOMDocument();

function parseAttrs(attrStr) {
  const attrs = {};
  const attrRegex = /([a-z0-9:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/gi;
  let match;
  while ((match = attrRegex.exec(attrStr)) !== null) {
    const name = match[1];
    const val = match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : (match[4] !== undefined ? match[4] : ''));
    attrs[name] = val;
  }
  return attrs;
}

// Register sidebar
const sidebarNavElem = new DOMElement('div', { id: 'sidebar-nav' });
doc.registerElement(sidebarNavElem);
doc.appendChild(sidebarNavElem);

// Register all data-module sidebar buttons
const dataModuleRegex = /<button\s+[^>]*?data-module="([^"]+)"[^>]*?>([\s\S]*?)<\/button>/gi;
let dmMatch;
while ((dmMatch = dataModuleRegex.exec(htmlContent)) !== null) {
  const modId = dmMatch[1];
  const innerHtml = dmMatch[2];
  const btnTag = dmMatch[0].match(/<button\s+([^>]*?)>/i);
  const btnAttrs = btnTag ? parseAttrs(btnTag[1]) : { 'data-module': modId };
  const btnElem = new DOMElement('button', btnAttrs);
  if (!btnElem.classList.contains('nav-item')) {
    btnElem.classList.add('nav-item');
  }
  if (innerHtml.includes('material-symbols-outlined')) {
    const iconElem = new DOMElement('span', { class: 'material-symbols-outlined' });
    btnElem.appendChild(iconElem);
  }
  sidebarNavElem.appendChild(btnElem);
  doc.registerElement(btnElem);
}

// 15 Modules
const all15Views = [
  'dashboard', 'ledger', 'sales', 'exports', 'documents',
  'expenses', 'contacts', 'banking', 'checks', 'payroll',
  'edonusum', 'mutabakat', 'inventory', 'reports', 'settings'
];

all15Views.forEach(v => {
  const vMatch = htmlContent.match(new RegExp(`<div\\s+[^>]*?id="view-${v}"[^>]*>`, 'i'));
  const attrs = vMatch ? parseAttrs(vMatch[0].slice(4, -1)) : { id: 'view-' + v, class: 'module-view' };
  const viewElem = new DOMElement('div', attrs);
  if (!viewElem.classList.contains('module-view')) {
    viewElem.classList.add('module-view');
  }
  doc.registerElement(viewElem);
  doc.appendChild(viewElem);
});

// 17 Modals
const all17Modals = [
  'modal-new-invoice',
  'modal-invoice-viewer',
  'modal-new-expense',
  'modal-new-payment',
  'modal-new-check',
  'modal-cari-ekstre',
  'modal-muavin',
  'modal-new-contact',
  'modal-new-journal',
  'modal-bordro-pusula',
  'modal-dab-calculator',
  'modal-edefter-viewer',
  'modal-change-password',
  'modal-upload-document',
  'modal-document-preview',
  'modal-new-stock',
  'modal-pdf-viewer'
];

all17Modals.forEach(m => {
  const mMatch = htmlContent.match(new RegExp(`<div\\s+[^>]*?id="${m}"[^>]*>`, 'i'));
  const attrs = mMatch ? parseAttrs(mMatch[0].slice(4, -1)) : { id: m, class: 'modal-backdrop hidden' };
  const modalElem = new DOMElement('div', attrs);
  // Ensure hidden class initially present
  if (!modalElem.classList.contains('hidden')) {
    modalElem.classList.add('hidden');
  }
  doc.registerElement(modalElem);
  doc.appendChild(modalElem);
});

// Register other vital UI controls and form inputs
const vitalIds = [
  'header-breadcrumb-view', 'quick-action-menu', 'btn-quick-action-trigger',
  'quick-action-dropdown-container', 'auth-lockscreen', 'erp-main-app',
  'login-password', 'login-username', 'login-form',
  'inv-date', 'inv-due-date', 'inv-type', 'inv-scenario', 'inv-currency', 'inv-fx-rate',
  'inv-etgb', 'inv-ibkb-notice', 'inv-customer', 'btn-modal-sale-domestic', 'btn-modal-sale-export',
  'inv-items-tbody', 'inv-sum-subtotal', 'inv-sum-tax', 'inv-sum-grand',
  'tbody-dashboard-mizan', 'tfoot-dashboard-mizan', 'tbody-ledger-full',
  'tbody-expenses', 'tbody-bank-moves', 'tbody-checks', 'tbody-sales',
  'tbody-exports', 'tbody-contacts', 'tbody-payroll', 'tbody-inventory'
];

vitalIds.forEach(id => {
  if (!doc.getElementById(id)) {
    const match = htmlContent.match(new RegExp(`<([a-z0-9]+)\\s+[^>]*?id="${id}"[^>]*>`, 'i'));
    const attrs = match ? parseAttrs(match[0].slice(match[1].length + 1, -1)) : { id };
    const el = new DOMElement(match ? match[1] : 'div', attrs);
    doc.registerElement(el);
    doc.appendChild(el);
  }
});

console.log(`DOM Simulator initialized with ${doc.elementsById.size} cataloged element IDs.`);

// -----------------------------------------------------------------
// Step 3: Sandboxed Node.js VM Environment
// -----------------------------------------------------------------
const windowMock = {
  document: doc,
  location: { protocol: 'file:', pathname: '/app/index.html', origin: 'file://', search: '', hash: '' },
  sessionStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  },
  scrollTo(x, y) {
    this.scrollX = x;
    this.scrollY = y;
  },
  setTimeout(fn, delay) { return setTimeout(fn, delay); },
  clearTimeout(id) { clearTimeout(id); },
  console: console
};
windowMock.window = windowMock;

// Deterministic code slice extraction from app/index.html:
// 1. switchView definition
const startSwitch = htmlContent.indexOf('function switchView(moduleId)');
assert(startSwitch !== -1, 'function switchView(moduleId) must exist in app/index.html');
const endSwitch = htmlContent.indexOf('// Bind sidebar buttons', startSwitch);
assert(endSwitch !== -1, 'End of switchView must exist in app/index.html');
const switchViewCode = htmlContent.slice(startSwitch, endSwitch);

// 2. openModal & closeModal definitions
const startOpenModal = htmlContent.indexOf('function openModal(modalId)');
assert(startOpenModal !== -1, 'function openModal(modalId) must exist in app/index.html');
const endCloseModal = htmlContent.indexOf('// CONFIRM DAB EXCHANGE', startOpenModal);
assert(endCloseModal !== -1, 'End of closeModal must exist in app/index.html');
const modalCode = htmlContent.slice(startOpenModal, endCloseModal);

// 3. Invoice modal helpers (initNewInvoiceModal, setNewInvoiceSaleType, etc.)
const startInvoiceHelpers = htmlContent.indexOf('function initNewInvoiceModal()');
assert(startInvoiceHelpers !== -1, 'function initNewInvoiceModal must exist');
const endInvoiceHelpers = htmlContent.indexOf('function openModal(modalId)', startInvoiceHelpers);
assert(endInvoiceHelpers !== -1, 'End of invoice helpers before openModal');
const invoiceHelpersCode = htmlContent.slice(startInvoiceHelpers, endInvoiceHelpers);

// 4. toggleQuickActionMenu
const startToggle = htmlContent.indexOf('function toggleQuickActionMenu(');
assert(startToggle !== -1, 'function toggleQuickActionMenu must exist in app/index.html');
const endToggle = htmlContent.indexOf('// Click outside to dismiss quick action dropdown', startToggle);
assert(endToggle !== -1, 'End of toggleQuickActionMenu must exist in app/index.html');
const toggleCode = htmlContent.slice(startToggle, endToggle);

// 5. window.BrosanAuth
const startAuth = htmlContent.indexOf('window.BrosanAuth = {');
assert(startAuth !== -1, 'window.BrosanAuth must exist in app/index.html');
const endAuth = htmlContent.indexOf('window.BrosanDocs =', startAuth);
assert(endAuth !== -1, 'End of window.BrosanAuth must exist in app/index.html');
const brosanAuthCode = htmlContent.slice(startAuth, endAuth).replace(/;\s*\/\/\s*=.*$/, ';');

// 6. const BROSAN_ERP = window.BROSAN_ERP = { ... }
const erpMatch = htmlContent.match(/const BROSAN_ERP\s*=\s*(?:window\.BROSAN_ERP\s*=\s*)?(\{[\s\S]*?\n\s*\};)/);
assert(erpMatch, 'const BROSAN_ERP must be present in app/index.html');
const erpCode = erpMatch[0];

const sandbox = vm.createContext({
  window: windowMock,
  document: doc,
  sessionStorage: windowMock.sessionStorage,
  localStorage: windowMock.localStorage,
  setTimeout: windowMock.setTimeout,
  clearTimeout: windowMock.clearTimeout,
  console: console,
  renderAll: () => {},
  onInvoiceCurrencyChanged: () => {},
  renderInvoiceItemsRows: () => {},
  recalculateInvoiceTotals: () => {},
  showToast: () => {}
});

// Evaluate scripts into the VM context
vm.runInContext(erpCode, sandbox);
vm.runInContext(switchViewCode, sandbox);
vm.runInContext(modalCode, sandbox);
vm.runInContext(toggleCode, sandbox);
vm.runInContext(brosanAuthCode, sandbox);
vm.runInContext(`
  var currentNewInvoiceSaleType = 'domestic';
  function setNewInvoiceSaleType(type) {
    currentNewInvoiceSaleType = type;
  }
  ${invoiceHelpersCode}
`, sandbox);

console.log('Scripts evaluated successfully into sandboxed VM.\n');

// -----------------------------------------------------------------
// Step 4: Empirical Test Execution
// -----------------------------------------------------------------
let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✔ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✘ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

// =================================================================
// SUITE 1: switchView(moduleId) for all 15 modules
// =================================================================
console.log('--- SUITE 1: switchView(moduleId) for all 15 modules ---');

const expectedTitles = {
  dashboard: 'KOKPİT',
  ledger: 'GENEL MUHASEBE (TDHP)',
  sales: 'SATIŞLAR & FATURALAR',
  exports: 'E-İHRACAT & GÜMRÜK',
  documents: 'EVRAK KASASI',
  expenses: 'GİDERLER & ALIŞLAR',
  contacts: 'MÜŞTERİLER & CARİLER',
  banking: 'KASA, BANKA & DAB',
  checks: 'ÇEK & SENET MASASI',
  payroll: 'PERSONEL & BORDRO',
  edonusum: 'E-DÖNÜŞÜM & GİB',
  mutabakat: 'CARİ MUTABAKAT',
  inventory: 'STOK & GTİP',
  reports: 'MALİ RAPORLAR',
  settings: 'AYARLAR'
};

all15Views.forEach(viewId => {
  runTest(`switchView('${viewId}') activates target view, hides other 14 views, updates breadcrumb and sidebar`, () => {
    vm.runInContext(`switchView('${viewId}')`, sandbox);

    // 1. Target view active
    const target = doc.getElementById('view-' + viewId);
    assert(target, `Target view #view-${viewId} must exist`);
    assert(target.classList.contains('active'), `Target view #view-${viewId} must have 'active' class`);

    // 2. Other views inactive
    all15Views.filter(v => v !== viewId).forEach(otherId => {
      const otherView = doc.getElementById('view-' + otherId);
      assert(otherView, `Other view #view-${otherId} must exist`);
      assert(!otherView.classList.contains('active'), `Other view #view-${otherId} must NOT have 'active' class`);
    });

    // 3. Breadcrumb title updated
    const breadcrumb = doc.getElementById('header-breadcrumb-view');
    assert.strictEqual(breadcrumb.textContent, expectedTitles[viewId], `Breadcrumb must match '${expectedTitles[viewId]}'`);

    // 4. Active sidebar button styled with bg-[#1E3A8A]
    const navItems = doc.querySelectorAll('#sidebar-nav .nav-item');
    const activeBtn = navItems.find(b => b.getAttribute('data-module') === viewId);
    assert(activeBtn, `Active nav button for module '${viewId}' must exist`);
    assert(activeBtn.className.includes('bg-[#1E3A8A]'), `Active button must have 'bg-[#1E3A8A]' styling`);

    // 5. Inactive sidebar buttons do not have bg-[#1E3A8A]
    navItems.filter(b => b.getAttribute('data-module') !== viewId).forEach(inactiveBtn => {
      assert(!inactiveBtn.className.includes('bg-[#1E3A8A]'), `Inactive button ${inactiveBtn.getAttribute('data-module')} must NOT have 'bg-[#1E3A8A]'`);
    });
  });
});

// Adversarial stress test for switchView
runTest('Adversarial switchView: rapid cycling (150 switches) maintains consistent state', () => {
  for (let i = 0; i < 150; i++) {
    const target = all15Views[i % 15];
    vm.runInContext(`switchView('${target}')`, sandbox);
  }
  // End on dashboard
  vm.runInContext(`switchView('dashboard')`, sandbox);
  assert(doc.getElementById('view-dashboard').classList.contains('active'));
  assert.strictEqual(doc.getElementById('header-breadcrumb-view').textContent, 'KOKPİT');
});

runTest('Adversarial switchView: malicious / invalid inputs fail gracefully without crashing', () => {
  assert.doesNotThrow(() => {
    vm.runInContext(`switchView('__proto__')`, sandbox);
    vm.runInContext(`switchView('constructor')`, sandbox);
    vm.runInContext(`switchView('<script>alert(1)</script>')`, sandbox);
    vm.runInContext(`switchView('')`, sandbox);
    vm.runInContext(`switchView(null)`, sandbox);
    vm.runInContext(`switchView(undefined)`, sandbox);
  });
  // Clean recovery to sales view
  vm.runInContext(`switchView('sales')`, sandbox);
  assert(doc.getElementById('view-sales').classList.contains('active'));
});

// =================================================================
// SUITE 2: openModal and closeModal for all 17 modals
// =================================================================
console.log('\n--- SUITE 2: openModal and closeModal for all 17 modals ---');

all17Modals.forEach((modalId, idx) => {
  runTest(`Modal ${idx + 1}/17: openModal('${modalId}') reveals and closeModal('${modalId}') hides`, () => {
    const el = doc.getElementById(modalId);
    assert(el, `Modal #${modalId} must exist in DOM`);

    // Initial state: hidden
    el.classList.add('hidden');
    assert(el.classList.contains('hidden'), `Modal #${modalId} should initially be hidden`);

    // 1. openModal removes 'hidden'
    vm.runInContext(`openModal('${modalId}')`, sandbox);
    assert(!el.classList.contains('hidden'), `Modal #${modalId} must NOT have 'hidden' class after openModal`);

    // 2. closeModal adds 'hidden'
    vm.runInContext(`closeModal('${modalId}')`, sandbox);
    assert(el.classList.contains('hidden'), `Modal #${modalId} must have 'hidden' class after closeModal`);
  });
});

runTest('Idempotency: multiple openModal and closeModal calls maintain state', () => {
  const modalId = 'modal-new-payment';
  const el = doc.getElementById(modalId);

  // Repeated open calls
  vm.runInContext(`openModal('${modalId}')`, sandbox);
  vm.runInContext(`openModal('${modalId}')`, sandbox);
  vm.runInContext(`openModal('${modalId}')`, sandbox);
  assert(!el.classList.contains('hidden'), 'Repeated openModal calls must keep modal visible');

  // Repeated close calls
  vm.runInContext(`closeModal('${modalId}')`, sandbox);
  vm.runInContext(`closeModal('${modalId}')`, sandbox);
  vm.runInContext(`closeModal('${modalId}')`, sandbox);
  assert(el.classList.contains('hidden'), 'Repeated closeModal calls must keep modal hidden');
});

runTest('Special init: openModal("modal-new-invoice") triggers initNewInvoiceModal smoothly', () => {
  const invModal = doc.getElementById('modal-new-invoice');
  assert(invModal, '#modal-new-invoice must exist');

  vm.runInContext(`openModal('modal-new-invoice')`, sandbox);
  assert(!invModal.classList.contains('hidden'), 'Invoice modal must be revealed');

  // Verify that starter items or dates were initialized
  const dateEl = doc.getElementById('inv-date');
  if (dateEl) {
    assert(dateEl.value, 'inv-date must have been set by initNewInvoiceModal');
  }
  const dueEl = doc.getElementById('inv-due-date');
  if (dueEl) {
    assert(dueEl.value, 'inv-due-date must have been set by initNewInvoiceModal');
  }

  // Close modal cleanly
  vm.runInContext(`closeModal('modal-new-invoice')`, sandbox);
  assert(invModal.classList.contains('hidden'));
});

runTest('Adversarial modal resilience: unknown or malicious modal IDs do not throw', () => {
  assert.doesNotThrow(() => {
    vm.runInContext(`openModal('non_existent_modal_xyz')`, sandbox);
    vm.runInContext(`closeModal('non_existent_modal_xyz')`, sandbox);
    vm.runInContext(`openModal(null)`, sandbox);
    vm.runInContext(`closeModal(null)`, sandbox);
    vm.runInContext(`openModal('')`, sandbox);
    vm.runInContext(`closeModal('')`, sandbox);
    vm.runInContext(`openModal('__proto__')`, sandbox);
    vm.runInContext(`closeModal('__proto__')`, sandbox);
  });
});

// =================================================================
// SUITE 3: window.BROSAN_ERP Data Accuracy & Accounting Invariants
// =================================================================
console.log('\n--- SUITE 3: window.BROSAN_ERP Data Accuracy & Invariants ---');

runTest('BROSAN_ERP company credentials and IBANs are 100% authentic', () => {
  const erp = sandbox.window.BROSAN_ERP;
  assert(erp, 'window.BROSAN_ERP must be defined');
  assert.strictEqual(erp.company.name, 'BROSAN TEKSTİL SAN. VE DIŞ TİC. LTD. ŞTİ.');
  assert.strictEqual(erp.company.vkn, '1871741946');
  assert.strictEqual(erp.company.taxOffice, 'İkitelli Vergi Dairesi');
  assert.strictEqual(erp.company.garantiGbpIban, 'TR86 0006 2000 4170 0009 0345 78');
  assert.strictEqual(erp.company.garantiTryIban, 'TR16 0006 2000 4170 0006 2894 77');
  assert.strictEqual(erp.company.garantiEurIban, 'TR59 0006 2000 4170 0009 0345 79');
  assert.strictEqual(erp.company.garantiUsdIban, 'TR32 0006 2000 4170 0009 0345 80');
  assert.strictEqual(erp.company.garantiLojistikTryIban, 'TR84 0006 2000 4170 0006 2878 65');
});

runTest('BROSAN_ERP Garanti bank account balances exact to the cent', () => {
  const erp = sandbox.window.BROSAN_ERP;
  assert.strictEqual(erp.bankAccounts.garantiGbp, 23759.07, 'GBP balance must be £23,759.07');
  assert.strictEqual(erp.bankAccounts.garantiTry, 15732.92, 'TRY balance must be ₺15,732.92');
  assert.strictEqual(erp.bankAccounts.garantiLojistikTry, 17210.75, 'Lojistik TRY balance must be ₺17,210.75');
  assert.strictEqual(erp.bankAccounts.garantiEur, 11792.36, 'EUR balance must be €11,792.36');
  assert.strictEqual(erp.bankAccounts.garantiUsd, 1521.16, 'USD balance must be $1,521.16');
});

runTest('BROSAN_ERP Ben Ellis contact balance matches Paraşüt authoritative ledger (£22,414.22 GBP)', () => {
  const erp = sandbox.window.BROSAN_ERP;
  const benEllis = erp.contacts.find(c => (c.name || c.title || '').includes('BEN ELLİS'));
  assert(benEllis, 'Ben Ellis contact must exist');
  assert.strictEqual(benEllis.currency, 'GBP');
  assert(
    benEllis.balance === 22414.22 || String(benEllis.balance).includes('22.414,22'),
    `Ben Ellis balance must match 22,414.22 GBP, got: ${benEllis.balance}`
  );
});

runTest('BROSAN_ERP Faruk Aytin reconciliation summary matches master Excel to the cent', () => {
  const erp = sandbox.window.BROSAN_ERP;
  assert(erp.farukAytin, 'farukAytin structure must exist');
  assert(erp.farukAytin.summary, 'farukAytin.summary must exist');
  const sum = erp.farukAytin.summary;

  assert.strictEqual(sum.totalFasonAlisUsd, 24032.80, 'Fason purchases: $24,032.80 USD');
  assert.strictEqual(sum.kumasSatisUsd, 7461.45, 'Fabric offset: $7,461.45 USD');
  assert.strictEqual(sum.totalBankaOdemesiUsd, 11236.00, 'Bank wire transfers USD: $11,236.00 USD');
  assert.strictEqual(sum.totalBankaOdemesiTl, 543571.00, 'Bank wire transfers TL: 543,571.00 TL');
  assert.strictEqual(sum.netKalanBorcUsd, 784.60, 'Net remaining advance: +$784.60 USD');
  assert.strictEqual(sum.netKalanBorcTl, 38461.09, 'Net remaining advance: +38,461.09 TL');
});

runTest('BROSAN_ERP contacts array contains all 15 authentic enterprise counterparties', () => {
  const erp = sandbox.window.BROSAN_ERP;
  assert(Array.isArray(erp.contacts), 'contacts must be array');
  assert(erp.contacts.length >= 15, `Must have >= 15 contacts, got ${erp.contacts.length}`);

  const required15 = [
    'BEN ELLİS', 'TİNTEKS', 'LAVI LA LLC', 'FARUK AYTİN',
    'GbR Celik', 'ÇETİN TÜREDİ', 'ATTERO CLOTHING', 'YUNUS EMRE GÖKALP',
    'Rana Jassim', 'ARKSİGNER', 'CuterEsque Inc.', 'FİLET ÖRME',
    'BE-HA KONFEKSİYON', 'MERT ÜTÜ', 'ASSET LOJİSTİK'
  ];

  required15.forEach(name => {
    const found = erp.contacts.find(c => (c.name || c.title || '').includes(name));
    assert(found, `Contact '${name}' must exist in BROSAN_ERP.contacts`);
  });
});

runTest('BROSAN_ERP TDHP Chart of Accounts contains all 14 official ledger accounts', () => {
  const erp = sandbox.window.BROSAN_ERP;
  assert(Array.isArray(erp.accounts), 'accounts must be array');
  assert.strictEqual(erp.accounts.length, 14, `Must have exactly 14 accounts, got ${erp.accounts.length}`);
});

// =================================================================
// SUITE 4: DOM Structural Invariants in app/index.html
// =================================================================
console.log('\n--- SUITE 4: DOM Structural Invariants in app/index.html ---');

runTest('All 15 module views physically exist in app/index.html', () => {
  all15Views.forEach(v => {
    const hasView = htmlContent.includes(`id="view-${v}"`);
    assert(hasView, `app/index.html must contain id="view-${v}"`);
  });
});

runTest('All 17 modals physically exist in app/index.html', () => {
  all17Modals.forEach(m => {
    const hasModal = htmlContent.includes(`id="${m}"`);
    assert(hasModal, `app/index.html must contain id="${m}"`);
  });
});

runTest('All 11 dynamic tbody targets physically exist in app/index.html', () => {
  const tbodies = [
    'tbody-dashboard-mizan', 'tfoot-dashboard-mizan', 'tbody-ledger-full',
    'tbody-expenses', 'tbody-bank-moves', 'tbody-checks', 'tbody-sales',
    'tbody-exports', 'tbody-contacts', 'tbody-payroll', 'tbody-inventory',
    'invoice-items-tbody'
  ];
  tbodies.forEach(tb => {
    const hasTbody = htmlContent.includes(`id="${tb}"`);
    assert(hasTbody, `app/index.html must contain dynamic target id="${tb}"`);
  });
});

runTest('Zero legacy novelty badges exist in #sidebar-nav', () => {
  const sidebarNavStart = htmlContent.indexOf('id="sidebar-nav"');
  assert(sidebarNavStart !== -1, '#sidebar-nav must exist');
  const sidebarNavEnd = htmlContent.indexOf('</aside>', sidebarNavStart);
  assert(sidebarNavEnd !== -1, '</aside> must exist');
  const sidebarHtml = htmlContent.slice(sidebarNavStart, sidebarNavEnd);

  const bannedBadges = ['Ben Ellis', '3 Vade', 'İade 301', '₺420K', '18 Kişi', 'GİB Canlı', '₺5.000+', 'Kumaş/İplik', 'Mizan'];
  bannedBadges.forEach(banned => {
    const badgeRegex = new RegExp(`class="[^"]*badge[^"]*"[^>]*>\\s*${banned}`, 'i');
    assert(!badgeRegex.test(sidebarHtml), `Legacy novelty badge '${banned}' must NOT exist in sidebar`);
  });
});
// =================================================================
// SUITE 5: Static Call-Site Target Invariants in app/index.html
// =================================================================
console.log('\n--- SUITE 5: Call-Site Target Invariants (openModal, closeModal, switchView) ---');

runTest('Every openModal(id) call in app/index.html targets a declared modal element', () => {
  const openModalRegex = /openModal\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;
  const targets = new Set();
  while ((match = openModalRegex.exec(htmlContent)) !== null) {
    targets.add(match[1]);
  }
  assert(targets.size > 0, 'There must be at least one openModal call site in app/index.html');
  targets.forEach(targetId => {
    const el = doc.getElementById(targetId) || htmlContent.includes(`id="${targetId}"`);
    assert(el, `Target modal #${targetId} called by openModal() must exist in DOM`);
  });
  console.log(`    (Verified ${targets.size} unique openModal target IDs)`);
});

runTest('Every closeModal(id) call in app/index.html targets a declared modal element', () => {
  const closeModalRegex = /closeModal\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;
  const targets = new Set();
  while ((match = closeModalRegex.exec(htmlContent)) !== null) {
    targets.add(match[1]);
  }
  assert(targets.size > 0, 'There must be at least one closeModal call site in app/index.html');
  targets.forEach(targetId => {
    const el = doc.getElementById(targetId) || htmlContent.includes(`id="${targetId}"`);
    assert(el, `Target modal #${targetId} called by closeModal() must exist in DOM`);
  });
  console.log(`    (Verified ${targets.size} unique closeModal target IDs)`);
});

runTest('Every switchView(id) call site targets one of the 15 valid module views', () => {
  const switchViewRegex = /switchView\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;
  const targets = new Set();
  while ((match = switchViewRegex.exec(htmlContent)) !== null) {
    targets.add(match[1]);
  }
  assert(targets.size > 0, 'There must be at least one switchView call site in app/index.html');
  targets.forEach(targetId => {
    assert(all15Views.includes(targetId), `Target module '${targetId}' called by switchView() must be in all15Views`);
  });
  console.log(`    (Verified ${targets.size} unique switchView target modules)`);
});

console.log('\n================================================================');
console.log(`  ALL CHALLENGER M3-2 TESTS PASSED: ${passedTests}/${totalTests} (100%)`);
console.log('================================================================\n');

