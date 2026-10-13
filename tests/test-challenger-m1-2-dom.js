/**
 * tests/test-challenger-m1-2-dom.js
 * 
 * Adversarial Empirical Challenger Suite for Milestone 1:
 * Validates DOM script execution and runtime behavior of Brosan ERP frontend:
 * 1. Does switchView(id) work for all 15 views without throwing exceptions?
 * 2. Does toggleQuickActionMenu() toggle #quick-action-menu visibility?
 * 3. Does window.BrosanAuth.showLockscreen() reveal #auth-lockscreen?
 * 4. Is window.BROSAN_ERP completely intact with all 15 contacts and accounts?
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'app', 'index.html');

console.log('================================================================');
console.log('  BROSAN ERP — CHALLENGER M1-2 DOM & RUNTIME EMPIRICAL SUITE    ');
console.log('================================================================\n');

// -----------------------------------------------------------------
// Step 1: Lightweight DOM Parser & Simulator
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
    this.textContent = textContent;
    this.value = attrs.value || '';
    this.isFocused = false;
    this.eventListeners = {};
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
      // #id
      if (selector.startsWith('#')) {
        return elem.id === selector.slice(1);
      }
      // .class
      if (selector.startsWith('.')) {
        return elem.classList.contains(selector.slice(1));
      }
      // [attr="val"] or [attr]
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
      // tag
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
    // Handle composite selectors like '#sidebar-nav .nav-item'
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
// Step 2: Extract DOM Elements from app/index.html
// -----------------------------------------------------------------
console.log('Parsing app/index.html...');
const htmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
const doc = new DOMDocument();

// Helper to parse attributes string
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

// Build hierarchy for sidebar, views, lockscreen, header
const sidebarNavElem = new DOMElement('div', { id: 'sidebar-nav' });
doc.registerElement(sidebarNavElem);
doc.appendChild(sidebarNavElem);

// Locate all data-module elements in html
const dataModuleRegex = /<button\s+[^>]*?data-module="([^"]+)"[^>]*?>([\s\S]*?)<\/button>/gi;
let dmMatch;
while ((dmMatch = dataModuleRegex.exec(htmlContent)) !== null) {
  const modId = dmMatch[1];
  const innerHtml = dmMatch[2];
  const btnAttrs = parseAttrs(dmMatch[0].match(/<button\s+([^>]*?)>/i)[1]);
  const btnElem = new DOMElement('button', btnAttrs);
  
  if (innerHtml.includes('material-symbols-outlined')) {
    const iconElem = new DOMElement('span', { class: 'material-symbols-outlined' });
    btnElem.appendChild(iconElem);
  }
  sidebarNavElem.appendChild(btnElem);
  doc.registerElement(btnElem);
}

// Ensure all 15 views are registered in document
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

// Ensure header-breadcrumb-view, quick-action-menu, auth-lockscreen, erp-main-app exist
['header-breadcrumb-view', 'quick-action-menu', 'btn-quick-action-trigger', 'quick-action-dropdown-container', 'auth-lockscreen', 'erp-main-app', 'login-password', 'login-username', 'login-form'].forEach(id => {
  let el = doc.getElementById(id);
  if (!el) {
    const match = htmlContent.match(new RegExp(`<([a-z0-9]+)\\s+[^>]*?id="${id}"[^>]*>`, 'i'));
    const attrs = match ? parseAttrs(match[0]) : { id };
    el = new DOMElement(match ? match[1] : 'div', attrs);
    doc.registerElement(el);
    doc.appendChild(el);
  }
});

console.log(`DOM Simulator initialized with ${doc.elementsById.size} cataloged element IDs.\n`);

// -----------------------------------------------------------------
// Step 3: Extract & Execute Frontend Scripts in Sandbox VM
// -----------------------------------------------------------------
// Create window & browser environment
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

// Deterministic code slice extraction:
// 1. switchView definition
const startSwitch = htmlContent.indexOf('function switchView(moduleId)');
assert(startSwitch !== -1, 'function switchView(moduleId) must exist in app/index.html');
const endSwitch = htmlContent.indexOf('// Bind sidebar buttons', startSwitch);
assert(endSwitch !== -1, 'End of switchView must exist in app/index.html');
const switchViewCode = htmlContent.slice(startSwitch, endSwitch);

// 2. toggleQuickActionMenu definition
const startToggle = htmlContent.indexOf('function toggleQuickActionMenu(');
assert(startToggle !== -1, 'function toggleQuickActionMenu must exist in app/index.html');
const endToggle = htmlContent.indexOf('// Click outside to dismiss quick action dropdown', startToggle);
assert(endToggle !== -1, 'End of toggleQuickActionMenu must exist in app/index.html');
const toggleQuickActionMenuCode = htmlContent.slice(startToggle, endToggle);

// 3. window.BrosanAuth definition
const startAuth = htmlContent.indexOf('window.BrosanAuth = {');
assert(startAuth !== -1, 'window.BrosanAuth must exist in app/index.html');
const endAuth = htmlContent.indexOf('window.BrosanDocs =', startAuth);
assert(endAuth !== -1, 'End of window.BrosanAuth must exist in app/index.html');
const brosanAuthCode = htmlContent.slice(startAuth, endAuth).replace(/;\s*\/\/\s*=.*$/, ';');

// 4. const BROSAN_ERP = window.BROSAN_ERP = { ... }
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
  openModal: (m) => {},
  closeModal: (m) => {}
});

// Execute scripts into the VM context
vm.runInContext(erpCode, sandbox);
vm.runInContext(switchViewCode, sandbox);
vm.runInContext(toggleQuickActionMenuCode, sandbox);
vm.runInContext(brosanAuthCode, sandbox);

console.log('Scripts evaluated successfully into sandboxed VM.\n');

// -----------------------------------------------------------------
// Step 4: Empirical Tests
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

// TEST 1: switchView for all 15 views
console.log('--- TEST SUITE 1: switchView(id) for All 15 Views ---');
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
  runTest(`switchView('${viewId}') activates #view-${viewId} and updates breadcrumbs`, () => {
    // Call switchView
    vm.runInContext(`switchView('${viewId}')`, sandbox);

    // 1. Target view must have 'active' class
    const target = doc.getElementById('view-' + viewId);
    assert(target, `Target view #view-${viewId} must exist`);
    assert(target.classList.contains('active'), `Target view #view-${viewId} must have 'active' class`);

    // 2. All other 14 views must NOT have 'active' class
    all15Views.filter(v => v !== viewId).forEach(otherId => {
      const otherView = doc.getElementById('view-' + otherId);
      assert(otherView, `Other view #view-${otherId} must exist`);
      assert(!otherView.classList.contains('active'), `Other view #view-${otherId} must NOT have 'active' class`);
    });

    // 3. Corresponding sidebar button must have active styling (bg-[#1E3A8A])
    const navItems = doc.querySelectorAll('#sidebar-nav .nav-item');
    assert(navItems.length >= 15, `Sidebar must contain at least 15 nav items, found ${navItems.length}`);
    const activeBtn = navItems.find(b => b.getAttribute('data-module') === viewId);
    assert(activeBtn, `Active nav button for module '${viewId}' must exist`);
    assert(activeBtn.className.includes('bg-[#1E3A8A]'), `Active button must have 'bg-[#1E3A8A]' styling`);

    // 4. Inactive sidebar buttons must NOT have bg-[#1E3A8A]
    navItems.filter(b => b.getAttribute('data-module') !== viewId).forEach(inactiveBtn => {
      assert(!inactiveBtn.className.includes('bg-[#1E3A8A]'), `Inactive button ${inactiveBtn.getAttribute('data-module')} must NOT have 'bg-[#1E3A8A]'`);
    });

    // 5. Breadcrumb title updated
    const breadcrumb = doc.getElementById('header-breadcrumb-view');
    assert.strictEqual(breadcrumb.textContent, expectedTitles[viewId], `Breadcrumb text must match '${expectedTitles[viewId]}'`);
  });
});

// Adversarial test: switchView with unknown or null arguments
runTest('Adversarial switchView resilience: non-existent id does not throw or corrupt state', () => {
  assert.doesNotThrow(() => {
    vm.runInContext(`switchView('unknown_attacker_vector')`, sandbox);
    vm.runInContext(`switchView('')`, sandbox);
    vm.runInContext(`switchView(null)`, sandbox);
    vm.runInContext(`switchView(undefined)`, sandbox);
  });
  // Switch back cleanly to dashboard
  vm.runInContext(`switchView('dashboard')`, sandbox);
  const dash = doc.getElementById('view-dashboard');
  assert(dash.classList.contains('active'));
});

// TEST 2: toggleQuickActionMenu
console.log('\n--- TEST SUITE 2: toggleQuickActionMenu() Toggle & States ---');
runTest('toggleQuickActionMenu toggles #quick-action-menu visibility accurately', () => {
  const menu = doc.getElementById('quick-action-menu');
  assert(menu, '#quick-action-menu must exist in DOM');

  // Initial state should be hidden
  menu.classList.add('hidden');
  assert(menu.classList.contains('hidden'), 'Menu should initially be hidden');

  // 1. First toggle: remove hidden -> visible
  vm.runInContext('toggleQuickActionMenu()', sandbox);
  assert(!menu.classList.contains('hidden'), 'Menu must become visible (hidden removed)');

  // 2. Second toggle: add hidden -> hidden
  vm.runInContext('toggleQuickActionMenu()', sandbox);
  assert(menu.classList.contains('hidden'), 'Menu must become hidden (hidden added)');

  // 3. Force state true: remove hidden -> visible
  vm.runInContext('toggleQuickActionMenu(true)', sandbox);
  assert(!menu.classList.contains('hidden'), 'Menu must become visible with forceState=true');

  // 4. Force state true again (idempotency): still visible
  vm.runInContext('toggleQuickActionMenu(true)', sandbox);
  assert(!menu.classList.contains('hidden'), 'Menu must remain visible with forceState=true (idempotent)');

  // 5. Force state false: add hidden -> hidden
  vm.runInContext('toggleQuickActionMenu(false)', sandbox);
  assert(menu.classList.contains('hidden'), 'Menu must become hidden with forceState=false');

  // 6. Force state false again (idempotency): still hidden
  vm.runInContext('toggleQuickActionMenu(false)', sandbox);
  assert(menu.classList.contains('hidden'), 'Menu must remain hidden with forceState=false (idempotent)');
});

// TEST 3: window.BrosanAuth.showLockscreen & unlockApp
console.log('\n--- TEST SUITE 3: window.BrosanAuth.showLockscreen() & Auth Mechanics ---');
runTest('window.BrosanAuth.showLockscreen reveals #auth-lockscreen and hides #erp-main-app', () => {
  const lockscreen = doc.getElementById('auth-lockscreen');
  const mainApp = doc.getElementById('erp-main-app');
  const passInput = doc.getElementById('login-password');
  const userInput = doc.getElementById('login-username');

  assert(lockscreen, '#auth-lockscreen must exist');
  assert(mainApp, '#erp-main-app must exist');

  // Step 1: Simulate unlocking app
  vm.runInContext('window.BrosanAuth.unlockApp()', sandbox);
  assert(lockscreen.classList.contains('hidden'), '#auth-lockscreen must have hidden class when unlocked');
  assert(!mainApp.classList.contains('hidden'), '#erp-main-app must NOT have hidden class when unlocked');

  // Set password value
  if (passInput) passInput.value = 'dummy_secret';

  // Step 2: Call showLockscreen
  vm.runInContext('window.BrosanAuth.showLockscreen()', sandbox);
  assert(!lockscreen.classList.contains('hidden'), '#auth-lockscreen must NOT have hidden class (lockscreen revealed)');
  assert(mainApp.classList.contains('hidden'), '#erp-main-app must have hidden class (main app concealed)');

  // Step 3: Password input must be cleared
  if (passInput) {
    assert.strictEqual(passInput.value, '', 'Password field must be cleared upon showLockscreen()');
  }

  // Step 4: Verify quickUnlock populates credentials
  if (userInput && passInput) {
    vm.runInContext('window.BrosanAuth.quickUnlock()', sandbox);
    assert.strictEqual(userInput.value, 'admin', 'quickUnlock must set username to admin');
    assert.strictEqual(passInput.value, 'Brosan2026!SecureErp', 'quickUnlock must set password to standard admin secret');
  }
});

// TEST 4: window.BROSAN_ERP Data Integrity
console.log('\n--- TEST SUITE 4: window.BROSAN_ERP Data Integrity & Accounting Accuracy ---');
runTest('window.BROSAN_ERP is defined and intact with 15 contacts and accounts', () => {
  const erp = sandbox.window.BROSAN_ERP;
  assert(erp, 'window.BROSAN_ERP must be defined');

  // 1. Contacts array
  assert(Array.isArray(erp.contacts), 'BROSAN_ERP.contacts must be an array');
  assert(erp.contacts.length >= 15, `BROSAN_ERP.contacts must have at least 15 contacts, got ${erp.contacts.length}`);

  const required15Contacts = [
    'BEN ELLİS',
    'TİNTEKS',
    'LAVI LA LLC',
    'FARUK AYTİN',
    'GbR Celik',
    'ÇETİN TÜREDİ',
    'ATTERO CLOTHING',
    'YUNUS EMRE GÖKALP',
    'Rana Jassim',
    'ARKSİGNER',
    'CuterEsque Inc.',
    'FİLET ÖRME',
    'BE-HA KONFEKSİYON',
    'MERT ÜTÜ',
    'ASSET LOJİSTİK'
  ];

  required15Contacts.forEach(nameSnippet => {
    const found = erp.contacts.find(c => (c.name || c.title || '').includes(nameSnippet));
    assert(found, `Contact matching snippet '${nameSnippet}' must be present in BROSAN_ERP.contacts`);
  });

  // 2. Bank accounts & ledger accounts
  assert(erp.bankAccounts, 'BROSAN_ERP.bankAccounts must be defined');
  assert.strictEqual(erp.bankAccounts.garantiGbp, 23759.07, 'Garanti GBP balance must be 23759.07');
  assert.strictEqual(erp.bankAccounts.garantiTry, 15732.92, 'Garanti TRY balance must be 15732.92');
  assert.strictEqual(erp.bankAccounts.garantiEur, 11792.36, 'Garanti EUR balance must be 11792.36');
  assert.strictEqual(erp.bankAccounts.garantiUsd, 1521.16, 'Garanti USD balance must be 1521.16');
  assert.strictEqual(erp.bankAccounts.garantiLojistikTry, 17210.75, 'Garanti Lojistik TRY balance must be 17210.75');

  assert(Array.isArray(erp.accounts), 'BROSAN_ERP.accounts must be an array');
  assert.strictEqual(erp.accounts.length, 14, `BROSAN_ERP.accounts must contain exactly 14 ledger accounts, got ${erp.accounts.length}`);

  // 3. Faruk Aytin reconciliation summary
  assert(erp.farukAytin, 'BROSAN_ERP.farukAytin must be defined');
  assert(erp.farukAytin.summary, 'BROSAN_ERP.farukAytin.summary must be defined');
  assert.strictEqual(erp.farukAytin.summary.totalFasonAlisUsd, 24032.80, 'totalFasonAlisUsd must be 24032.80');
  assert.strictEqual(erp.farukAytin.summary.kumasSatisUsd, 7461.45, 'kumasSatisUsd must be 7461.45');
  assert.strictEqual(erp.farukAytin.summary.totalBankaOdemesiUsd, 11236.00, 'totalBankaOdemesiUsd must be 11236.00');
  assert.strictEqual(erp.farukAytin.summary.totalBankaOdemesiTl, 543571.00, 'totalBankaOdemesiTl must be 543571.00');
  assert.strictEqual(erp.farukAytin.summary.netKalanBorcUsd, 784.60, 'netKalanBorcUsd must be +784.60 USD');
  assert.strictEqual(erp.farukAytin.summary.netKalanBorcTl, 38461.09, 'netKalanBorcTl must be +38461.09 TL');
});

// TEST 5: Sidebar Novelty Badge Removal Verification
console.log('\n--- TEST SUITE 5: Sidebar Novelty Badge Cleanliness ---');
runTest('Sidebar navigation contains 0 legacy novelty badges', () => {
  const sidebarNav = doc.getElementById('sidebar-nav');
  assert(sidebarNav, '#sidebar-nav must exist');

  // Verify none of the removed novelty badges appear as badges in sidebar
  const bannedBadges = ['Ben Ellis', '3 Vade', 'İade 301', '₺420K', '18 Kişi', 'GİB Canlı', '₺5.000+', 'Kumaş/İplik', 'Mizan'];
  const sidebarHtml = htmlContent.slice(htmlContent.indexOf('id="sidebar-nav"'), htmlContent.indexOf('</aside>'));

  bannedBadges.forEach(banned => {
    // Check that there is no span or badge displaying these strings inside sidebar
    const badgePattern = new RegExp(`class="[^"]*badge[^"]*"[^>]*>\\s*${banned}`, 'i');
    assert(!badgePattern.test(sidebarHtml), `Banned novelty badge '${banned}' must not exist in sidebar`);
  });
});

console.log('\n================================================================');
console.log(`  ALL CHALLENGER M1-2 TESTS PASSED: ${passedTests}/${totalTests} (100%)`);
console.log('================================================================\n');
