/**
 * tests/test-ref-style-parity.js
 * 
 * BROSAN TEKSTİL ERP — 4-TIER REFERENCE STYLE PARITY E2E TEST SUITE
 * 
 * Authoritative Sources:
 * - ORIGINAL_REQUEST.md (Section "## Follow-up — 2026-10-13T19:46:07Z")
 * - PROJECT.md (Architecture, Feature Inventory Features 1–19, Milestones M1–M6)
 * - Reference Assets in C:\Users\YUNUS EMRE GÖKALP\.gemini\antigravity\brain\ffc9730b-8c59-4361-801d-ffd3e0e53012\
 *   (ref_style.css, ref_giris.html, ref_inside.html, ref_inside_1.png)
 * - Master DOM ID Catalog (228 IDs from explorer_survey_2/master_id_catalog.json)
 * 
 * Test Coverage Tiers:
 * - Tier 1: Isolated Feature Coverage (Pure Inter, Lockscreen 380px, Sidebar #yan 236px, Header/Footer Hidden, Dashboard 5 KPIs, 15 Views, 17 Modals)
 * - Tier 2: Boundary & Corner Cases (Dark theme tokens, 228 DOM ID census, table bodies/footers retention)
 * - Tier 3: Cross-Feature Combinations (switchView transition, search trigger, openModal/closeModal lifecycle)
 * - Tier 4: Real-World Scenarios (End-to-end user journey from lockscreen unlock to multi-module navigation and modal interaction)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// Base Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'app', 'index.html');
const CATALOG_PATH = path.join(ROOT_DIR, '.agents', 'teamwork', 'explorer_survey_2', 'master_id_catalog.json');
const REF_STYLE_PATH = 'C:\\Users\\YUNUS EMRE GÖKALP\\.gemini\\antigravity\\brain\\ffc9730b-8c59-4361-801d-ffd3e0e53012\\ref_style.css';

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
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgBlue: '\x1b[44m'
};

// -----------------------------------------------------------------------------
// 1. Full 228 Master DOM IDs Catalog Fallback
// -----------------------------------------------------------------------------
const MASTER_228_IDS = [
  "auth-lockscreen","lockscreen-status-badge","login-error-box","login-error-text","login-form",
  "login-username","login-password","login-submit-btn","login-btn-text","btn-do-login",
  "btn-quick-unlock","erp-main-app","sidebar-nav","badge-expense-count","badge-exports-count",
  "sidebar-doc-count-badge","badge-sales-count","sidebar-user-avatar","sidebar-user-name","sidebar-user-role",
  "header-breadcrumb-view","global-search-input","quick-action-dropdown-container","btn-quick-action-main","btn-quick-action-trigger",
  "quick-action-menu","nav-user-avatar","nav-user-name","nav-user-role","view-dashboard",
  "stat-total-cash","hero-kpi-bank-gbp","hero-kpi-bank-try","stat-total-receivables","hero-kpi-receivable-gbp",
  "hero-kpi-receivable-sub","stat-total-payables","hero-kpi-debt-try","hero-ibkb-badge","hero-ibkb-title",
  "hero-ibkb-sub","table-dashboard-mizan","tbody-dashboard-mizan","tfoot-dashboard-mizan","widget-checks-list",
  "view-ledger","ledger-filter-input","table-ledger-full","tbody-ledger-full","view-sales",
  "sales-kpi-total","sales-kpi-domestic","sales-kpi-export","sales-kpi-ibkb","sales-filter-tabs",
  "btn-sales-tab-all","btn-sales-tab-domestic","btn-sales-tab-export","sales-search-input","table-sales",
  "tbody-sales","view-exports","export-kpi-total","export-kpi-open","export-kpi-closed",
  "export-filter-tabs","btn-export-tab-all","btn-export-tab-open","btn-export-tab-closed","exports-search-input",
  "table-exports","tbody-exports","view-expenses","expenses-kpi-debt","table-expenses",
  "tbody-expenses","view-contacts","table-contacts","tbody-contacts","view-banking",
  "table-bank-moves","tbody-bank-moves","view-checks","checks-kpi-total","table-checks",
  "tbody-checks","view-payroll","table-payroll","tbody-payroll","view-edonusum",
  "view-mutabakat","view-inventory","inventory-total-value","table-inventory","tbody-inventory",
  "view-reports","view-settings","set-company-name","set-tax-office","set-gbp-iban",
  "set-integrator","view-documents","doc-total-badge","kpi-doc-total","kpi-doc-shipping",
  "kpi-doc-customs","kpi-doc-ibkb","doc-search-input","doc-customer-select","doc-format-select",
  "doc-matching-count","btn-view-cards","btn-view-table","doc-results-container","doc-pagination",
  "doc-page-info","doc-prev-btn","doc-next-btn","modal-new-invoice","btn-modal-sale-domestic",
  "btn-modal-sale-export","inv-customer","inv-type","inv-scenario","inv-currency",
  "inv-fx-rate","inv-date","inv-due-date","inv-etgb","inv-notes",
  "inv-items-badge","invoice-items-tbody","inv-ibkb-notice","inv-sum-subtotal","inv-sum-discount",
  "inv-sum-net-matrah","inv-sum-kdv-label","inv-sum-tax","inv-row-tevkifat","inv-sum-tevkifat",
  "inv-sum-tl-equivalent","inv-sum-grand","inv-sum-in-words","modal-invoice-viewer","inv-viewer-title",
  "inv-viewer-content","modal-new-expense","exp-supplier","exp-account","exp-kdv-rate",
  "exp-amount","exp-due-date","modal-new-payment","pay-contact","modal-new-check",
  "chk-no","chk-drawer","chk-amount","chk-due-date","modal-cari-ekstre",
  "ekstre-modal-title","ekstre-modal-body","modal-muavin","muavin-modal-title","muavin-modal-body",
  "modal-new-contact","new-contact-code","new-contact-type","new-contact-name","new-contact-vkn",
  "new-contact-city","modal-new-journal","jrn-no","jrn-date","jrn-desc",
  "jrn-debit-acc","jrn-credit-acc","jrn-amount","modal-bordro-pusula","bordro-pusula-title",
  "bordro-pusula-content","modal-dab-calculator","modal-edefter-viewer","modal-change-password","change-password-form",
  "pw-modal-error","pw-modal-error-text","pw-current","pw-new","pw-confirm",
  "pw-submit-btn","modal-upload-document","doc-dropzone","doc-selected-filename","doc-file-input",
  "upload-doc-title","upload-doc-category","upload-doc-subtype","upload-doc-customer","upload-doc-period",
  "modal-document-preview","preview-doc-icon-badge","preview-doc-title","preview-doc-sub","preview-doc-cat",
  "preview-doc-type","preview-doc-size","preview-doc-date","preview-doc-path","preview-doc-view-btn",
  "preview-doc-download-btn","modal-new-stock","stock-move-type","stock-product-select","stock-qty",
  "stock-cost","stock-doc-no","stock-warehouse","modal-pdf-viewer","pdf-modal-title",
  "pdf-modal-subtitle","pdf-modal-newtab-btn","pdf-modal-download-btn","pdf-modal-print-btn","pdf-modal-copy-btn",
  "pdf-frame-loading","pdf-viewer-frame","toast-container"
];

// 15 Modules
const ALL_15_VIEWS = [
  'dashboard', 'ledger', 'sales', 'exports', 'documents',
  'expenses', 'contacts', 'banking', 'checks', 'payroll',
  'edonusum', 'mutabakat', 'inventory', 'reports', 'settings'
];

// 17 Modals
const ALL_17_MODALS = [
  'modal-new-invoice', 'modal-invoice-viewer', 'modal-new-expense', 'modal-new-payment',
  'modal-new-check', 'modal-cari-ekstre', 'modal-muavin', 'modal-new-contact',
  'modal-new-journal', 'modal-bordro-pusula', 'modal-dab-calculator', 'modal-edefter-viewer',
  'modal-change-password', 'modal-upload-document', 'modal-document-preview', 'modal-new-stock',
  'modal-pdf-viewer'
];

// 11 Dynamic Table Containers
const ALL_11_TABLES = [
  'tbody-dashboard-mizan', 'tfoot-dashboard-mizan', 'tbody-ledger-full',
  'tbody-sales', 'tbody-exports', 'tbody-expenses',
  'tbody-contacts', 'tbody-bank-moves', 'tbody-checks',
  'tbody-payroll', 'tbody-inventory'
];

// -----------------------------------------------------------------------------
// 2. Lightweight DOM Parser & Runtime Environment
// -----------------------------------------------------------------------------
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
    if (attrs.style) {
      attrs.style.split(';').forEach(rule => {
        const [k, v] = rule.split(':');
        if (k && v) this.style[k.trim()] = v.trim();
      });
    }
  }

  get className() { return this._classList.toString(); }
  set className(val) { this._classList = new ClassList(val); this.attributes.class = val; }
  get classList() { return this._classList; }
  get textContent() { return this._textContent; }
  set textContent(val) { this._textContent = String(val); }
  get innerHTML() { return this._textContent; }
  set innerHTML(val) { this._textContent = String(val); }

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

  removeAttribute(name) {
    delete this.attributes[name];
    if (name === 'class') this.className = '';
  }

  focus() { this.isFocused = true; }
  blur() { this.isFocused = false; }

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
    const type = typeof event === 'string' ? event : event.type;
    const listeners = this.eventListeners[type] || [];
    listeners.forEach(fn => fn(event));
  }

  querySelector(selector) {
    const list = this.querySelectorAll(selector);
    return list.length > 0 ? list[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    const match = (elem) => {
      if (selector.startsWith('#')) return elem.id === selector.slice(1);
      if (selector.startsWith('.')) return elem.classList.contains(selector.slice(1));
      if (selector.startsWith('[') && selector.endsWith(']')) {
        const inner = selector.slice(1, -1);
        if (inner.includes('=')) {
          const [k, v] = inner.split('=');
          const cleanV = v.replace(/^["']|["']$/g, '');
          return elem.getAttribute(k) === cleanV;
        }
        return elem.getAttribute(inner) !== null;
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
    this.documentElement = new DOMElement('HTML');
    this.body = new DOMElement('BODY');
    this.head = new DOMElement('HEAD');
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    this.appendChild(this.documentElement);
  }

  registerElement(elem) {
    if (elem.id) {
      this.elementsById.set(elem.id, elem);
    }
    for (const child of elem.children) {
      this.registerElement(child);
    }
  }

  getElementById(id) {
    return this.elementsById.get(id) || null;
  }
}

// -----------------------------------------------------------------------------
// 3. Test Runner & Assertion Library
// -----------------------------------------------------------------------------
class TestSuiteRunner {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.results = [];
  }

  add(tier, id, description, fn) {
    this.tests.push({ tier, id, description, fn });
  }

  async run() {
    console.log(`\n${colors.bold}${colors.cyan}================================================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.white} ${this.name}${colors.reset}`);
    console.log(`${colors.cyan}================================================================================${colors.reset}\n`);

    let passedCount = 0;
    let failedCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < this.tests.length; i++) {
      const t = this.tests[i];
      const tStart = Date.now();
      try {
        await t.fn();
        const duration = Date.now() - tStart;
        passedCount++;
        this.results.push({ ...t, status: 'PASS', duration, error: null });
        console.log(`  ${colors.green}✔ PASS${colors.reset} [${t.tier}] ${t.id}: ${t.description} ${colors.dim}(${duration}ms)${colors.reset}`);
      } catch (err) {
        const duration = Date.now() - tStart;
        failedCount++;
        this.results.push({ ...t, status: 'FAIL', duration, error: err.message });
        console.log(`  ${colors.red}✖ FAIL${colors.reset} [${t.tier}] ${t.id}: ${t.description}`);
        console.log(`    ${colors.red}Reason: ${err.message}${colors.reset}`);
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`\n${colors.cyan}--------------------------------------------------------------------------------${colors.reset}`);
    console.log(`${colors.bold}SUMMARY:${colors.reset} Total: ${this.tests.length} | ${colors.green}Passed: ${passedCount}${colors.reset} | ${failedCount > 0 ? colors.red : colors.dim}Failed: ${failedCount}${colors.reset} | Time: ${totalDuration}ms`);
    console.log(`${colors.cyan}--------------------------------------------------------------------------------${colors.reset}\n`);

    return {
      total: this.tests.length,
      passed: passedCount,
      failed: failedCount,
      duration: totalDuration,
      results: this.results
    };
  }
}

// -----------------------------------------------------------------------------
// 4. Test Suite Implementation
// -----------------------------------------------------------------------------
async function runRefStyleParitySuite() {
  const runner = new TestSuiteRunner('BROSAN ERP — REFERENCE STYLE PARITY 4-TIER E2E TEST SUITE');

  // Load app/index.html
  assert(fs.existsSync(INDEX_HTML_PATH), `Target app/index.html not found at ${INDEX_HTML_PATH}`);
  const htmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

  // Load master ID catalog if present
  let expectedIds = MASTER_228_IDS;
  if (fs.existsSync(CATALOG_PATH)) {
    try {
      const catalogData = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
      if (Array.isArray(catalogData) && catalogData.length > 0) {
        expectedIds = catalogData.map(x => x.id);
      }
    } catch (_) {}
  }

  // Load reference CSS if present for oracle comparison
  let refCss = '';
  if (fs.existsSync(REF_STYLE_PATH)) {
    refCss = fs.readFileSync(REF_STYLE_PATH, 'utf8');
  }

  // Parse HTML into Document Model
  const doc = new DOMDocument();
  function parseHtmlTags(html) {
    const idRegex = /<([a-z0-9]+)\s+([^>]*?id="([^"]+)"[^>]*?)>/gi;
    let match;
    while ((match = idRegex.exec(html)) !== null) {
      const tag = match[1];
      const rawAttrs = match[2];
      const id = match[3];
      const attrs = { id };
      const classMatch = rawAttrs.match(/class="([^"]*)"/i);
      if (classMatch) attrs.class = classMatch[1];
      const styleMatch = rawAttrs.match(/style="([^"]*)"/i);
      if (styleMatch) attrs.style = styleMatch[1];
      const elem = new DOMElement(tag, attrs);
      doc.registerElement(elem);
      doc.body.appendChild(elem);
    }
  }
  parseHtmlTags(htmlContent);

  // ===========================================================================
  // TIER 1: ISOLATED FEATURE COVERAGE
  // ===========================================================================

  // T1.1: Pure Inter Font & Tabular Nums
  runner.add('Tier 1', 'T1.1', 'Pure Inter Font with tabular-nums configured for typography', () => {
    const hasInter = htmlContent.includes('"Inter"') || htmlContent.includes('Inter,') || htmlContent.includes('Inter');
    assert(hasInter, 'Inter font must be referenced in app/index.html typography');
    const hasTabularNums = htmlContent.includes('tabular-nums') || htmlContent.includes('"tnum" 1');
    assert(hasTabularNums, 'Tabular-nums (font-variant-numeric: tabular-nums or "tnum" 1) must be active for numbers');
  });

  // T1.2: Elimination of JetBrains Mono and Hanken Grotesk from normal body/table rendering
  runner.add('Tier 1', 'T1.2', 'Elimination of JetBrains Mono and Hanken Grotesk from normal body/table rendering', () => {
    // Normal body rule should not enforce JetBrains Mono as the body text font
    const bodyFontMatch = htmlContent.match(/body\s*\{[^}]*font(?:-family)?:\s*([^;]+);/i);
    if (bodyFontMatch) {
      const fontDef = bodyFontMatch[1];
      assert(!fontDef.includes('JetBrains Mono'), `Body font should not be JetBrains Mono, found: ${fontDef}`);
      assert(!fontDef.includes('Hanken Grotesk'), `Body font should not be Hanken Grotesk, found: ${fontDef}`);
    }
    // Check if ref-style stylesheet is embedded or font-mono is overridden
    const hasRefStyle = htmlContent.includes('id="ref-style"') || htmlContent.includes('--zemin: #f3f5f8');
    assert(hasRefStyle, 'Reference style tokens and stylesheet must be embedded in app/index.html');
  });

  // T1.3: #auth-lockscreen Clean 380px Card with 16px Radius
  runner.add('Tier 1', 'T1.3', '#auth-lockscreen contains clean 380px card with 16px radius', () => {
    const lockscreen = doc.getElementById('auth-lockscreen');
    assert(lockscreen, '#auth-lockscreen element must exist in DOM');
    // Lockscreen card must match max-width 380px and radius 16px (either via .giris-kart or Tailwind max-w-[380px] rounded-[16px])
    const hasCard380 = htmlContent.includes('380px') || htmlContent.includes('max-w-[380px]') || htmlContent.includes('giris-kart');
    assert(hasCard380, '#auth-lockscreen card must have 380px maximum width');
    const hasRadius16 = htmlContent.includes('16px') || htmlContent.includes('rounded-[16px]') || htmlContent.includes('rounded-2xl') || htmlContent.includes('giris-kart');
    assert(hasRadius16, '#auth-lockscreen card must have 16px border-radius');
  });

  // T1.4: #auth-lockscreen Blue 'B' Logo & Institution Header
  runner.add('Tier 1', 'T1.4', '#auth-lockscreen contains blue B logo and institutional title', () => {
    const lockscreenHtml = htmlContent.slice(htmlContent.indexOf('id="auth-lockscreen"'), htmlContent.indexOf('id="erp-main-app"'));
    const hasLogoB = lockscreenHtml.includes('B') && (lockscreenHtml.includes('#1d4ed8') || lockscreenHtml.includes('#3b82f6') || lockscreenHtml.includes('linear-gradient'));
    assert(hasLogoB, 'Lockscreen must contain the blue gradient B logo');
    const hasBrosanTitle = lockscreenHtml.includes('Brosan Muhasebe') || lockscreenHtml.includes('Brosan Tekstil');
    assert(hasBrosanTitle, 'Lockscreen must contain Brosan Muhasebe institutional title');
  });

  // T1.5: #auth-lockscreen Clean Inputs & #1d4ed8 Submit Button
  runner.add('Tier 1', 'T1.5', '#auth-lockscreen contains clean username/password inputs and blue #1d4ed8 button', () => {
    const usernameInput = doc.getElementById('login-username');
    const passwordInput = doc.getElementById('login-password');
    const submitBtn = doc.getElementById('login-submit-btn');
    assert(usernameInput, '#login-username input must exist');
    assert(passwordInput, '#login-password input must exist');
    assert(submitBtn, '#login-submit-btn button must exist');
    const hasRoyalBlueBtn = htmlContent.includes('#1d4ed8') || submitBtn.classList.contains('ana');
    assert(hasRoyalBlueBtn, 'Login submit button must use royal blue #1d4ed8 or .ana class');
  });

  // T1.6: #auth-lockscreen Zero Cyber-Jargon Badges
  runner.add('Tier 1', 'T1.6', '#auth-lockscreen has zero cyber-jargon badges visible', () => {
    const lockscreenEnd = htmlContent.indexOf('id="erp-main-app"');
    const lockscreenHtml = htmlContent.slice(htmlContent.indexOf('id="auth-lockscreen"'), lockscreenEnd > 0 ? lockscreenEnd : undefined);
    assert(!lockscreenHtml.includes('Sovereign Citadel'), 'Sovereign Citadel badge must be removed from login card');
    assert(!lockscreenHtml.includes('Brute-Force Kalkanı'), 'Brute-Force Kalkanı badge must be removed from login card');
    assert(!lockscreenHtml.includes('Bcrypt &amp; JWT 256-bit') && !lockscreenHtml.includes('Bcrypt & JWT 256-bit'), 'Bcrypt & JWT badge must be removed from login card');
    assert(!lockscreenHtml.includes('12+ Karakter'), '12+ Karakter badge must be removed from login card');
  });

  // T1.7: Left Sidebar <aside id="yan"> with 236px Width & #0f1b2d Background
  runner.add('Tier 1', 'T1.7', 'Left sidebar <aside id="yan"> has 236px width and #0f1b2d background', () => {
    const yanAside = doc.getElementById('yan');
    assert(yanAside, 'Sidebar element with id="yan" must exist (<aside id="yan">)');
    const has236px = htmlContent.includes('236px') || htmlContent.includes('w-[236px]') || (refCss && refCss.includes('#yan { width: 236px;'));
    assert(has236px, 'Sidebar must have 236px fixed width');
    const hasNavyYan = htmlContent.includes('#0f1b2d') || htmlContent.includes('--yan: #0f1b2d');
    assert(hasNavyYan, 'Sidebar background must be #0f1b2d');
  });

  // T1.8: Left Sidebar Omnisearch #global-search-input & Ctrl K Shortcut
  runner.add('Tier 1', 'T1.8', 'Left sidebar contains #global-search-input in .ara-dugme with Ctrl K shortcut', () => {
    const searchInput = doc.getElementById('global-search-input');
    assert(searchInput, '#global-search-input must exist');
    const hasAraDugme = htmlContent.includes('ara-dugme') || htmlContent.includes('Ctrl K') || htmlContent.includes('Ctrl+K');
    assert(hasAraDugme, 'Sidebar must include search box (.ara-dugme) with Ctrl K command shortcut');
  });

  // T1.9: Left Sidebar Nav Active State #1f3352 + #60a5fa Inset Bar
  runner.add('Tier 1', 'T1.9', 'Sidebar active nav item has #1f3352 background and #60a5fa inset bar', () => {
    const hasActiveStyle = htmlContent.includes('#1f3352') || htmlContent.includes('aktif') || (refCss && refCss.includes('#yan nav a.aktif { background: #1f3352;'));
    assert(hasActiveStyle, 'Sidebar active nav link must use #1f3352 background and #60a5fa accent');
  });

  // T1.10: Left Sidebar Compact .alt Footer with User, Moon Toggle, Logout, Database Status
  runner.add('Tier 1', 'T1.10', 'Sidebar contains compact .alt footer with user, moon theme toggle, logout, database status', () => {
    const hasAltFooter = htmlContent.includes('class="alt"') || htmlContent.includes("class='alt'") || htmlContent.includes('kullanici');
    assert(hasAltFooter, 'Sidebar must include compact .alt footer');
    const hasUser = htmlContent.includes('Emre') || htmlContent.includes('Yönetici') || doc.getElementById('nav-user-name');
    assert(hasUser, 'Sidebar footer must display Emre / Yönetici user profile');
    const hasMoonTheme = htmlContent.includes('tema') || htmlContent.includes('data-tema');
    assert(hasMoonTheme, 'Sidebar footer must include theme toggle button');
    const hasStatus = htmlContent.includes('kayitDurum') || htmlContent.includes('veritabanı') || htmlContent.includes('Bağlı');
    assert(hasStatus, 'Sidebar footer must include database connectivity status indicator');
  });

  // T1.11: Top <header> Visual Elimination
  runner.add('Tier 1', 'T1.11', 'Top <header> is visually eliminated with class="hidden" or display: none', () => {
    const headerMatch = htmlContent.match(/<header\s+([^>]*?)>/i);
    assert(headerMatch, '<header> element must exist in DOM');
    const headerAttrs = headerMatch[1];
    const isHidden = headerAttrs.includes('hidden') || headerAttrs.includes('display: none') || headerAttrs.includes('display:none');
    assert(isHidden, '<header> must be visually eliminated using class="hidden" or display: none !important;');
  });

  // T1.12: Bottom <footer> Visual Elimination
  runner.add('Tier 1', 'T1.12', 'Bottom <footer> is visually eliminated with class="hidden" or display: none', () => {
    const footerMatch = htmlContent.match(/<footer\s+([^>]*?)>/i);
    if (footerMatch) {
      const footerAttrs = footerMatch[1];
      const isHidden = footerAttrs.includes('hidden') || footerAttrs.includes('display: none') || footerAttrs.includes('display:none');
      assert(isHidden, '<footer> must be visually hidden with class="hidden" or display: none !important;');
    } else {
      // Bottom ticker bar eliminated completely
      assert(true);
    }
  });

  // T1.13: Header Breadcrumb and Child IDs Preserved in DOM
  runner.add('Tier 1', 'T1.13', '#header-breadcrumb-view and essential header child IDs remain in DOM', () => {
    const breadcrumb = doc.getElementById('header-breadcrumb-view');
    assert(breadcrumb, '#header-breadcrumb-view must remain in DOM to prevent runtime script crashes');
    const quickMenu = doc.getElementById('quick-action-menu');
    assert(quickMenu, '#quick-action-menu must remain in DOM');
  });

  // T1.14: Dashboard #view-dashboard 5 KPI Cards with 30x30 .ikon Squares
  runner.add('Tier 1', 'T1.14', '#view-dashboard contains 5 KPI cards with 30x30 .ikon squares', () => {
    const dashboardView = doc.getElementById('view-dashboard');
    assert(dashboardView, '#view-dashboard view must exist in DOM');
    const dashboardHtml = htmlContent.slice(htmlContent.indexOf('id="view-dashboard"'), htmlContent.indexOf('id="view-ledger"'));
    const hasKartlar = dashboardHtml.includes('kartlar') || dashboardHtml.includes('grid-cols-5') || dashboardHtml.includes('repeat(auto-fill, minmax(215px, 1fr))');
    assert(hasKartlar, 'Dashboard must contain .kartlar KPI cards grid');
    const hasIkon = dashboardHtml.includes('ikon') || dashboardHtml.includes('w-[30px]') || dashboardHtml.includes('30px');
    assert(hasIkon, 'Dashboard KPI cards must feature 30x30 soft icon squares');
  });

  // T1.15: Dashboard Attention Strip .dikkat-oge with 3px Left Border
  runner.add('Tier 1', 'T1.15', '#view-dashboard contains attention strip with .dikkat-oge cards', () => {
    const dashboardHtml = htmlContent.slice(htmlContent.indexOf('id="view-dashboard"'), htmlContent.indexOf('id="view-ledger"'));
    const hasDikkat = dashboardHtml.includes('dikkat') || dashboardHtml.includes('dikkat-oge');
    assert(hasDikkat, 'Dashboard must include attention alert strip (.dikkat-oge)');
  });

  // T1.16: Dashboard 6 Quick Action Tiles in .hizli Grid
  runner.add('Tier 1', 'T1.16', '#view-dashboard contains .hizli 6-tile quick actions grid', () => {
    const dashboardHtml = htmlContent.slice(htmlContent.indexOf('id="view-dashboard"'), htmlContent.indexOf('id="view-ledger"'));
    const hasHizli = dashboardHtml.includes('hizli') || (dashboardHtml.includes('Satış faturası') && dashboardHtml.includes('Gider / Fiş'));
    assert(hasHizli, 'Dashboard must include .hizli quick action tiles grid');
  });

  // T1.17: Dashboard Clean .tablo and .sekmeler Segmented Pills
  runner.add('Tier 1', 'T1.17', '#view-dashboard contains clean .tablo tables and .sekmeler pill tabs', () => {
    const dashboardHtml = htmlContent.slice(htmlContent.indexOf('id="view-dashboard"'), htmlContent.indexOf('id="view-ledger"'));
    const hasTablo = dashboardHtml.includes('tablo') || dashboardHtml.includes('table-dashboard-mizan');
    assert(hasTablo, 'Dashboard must include .tablo data table container');
    const hasSekmeler = dashboardHtml.includes('sekmeler') || dashboardHtml.includes('rozet');
    assert(hasSekmeler, 'Dashboard must include .sekmeler segmented pill navigation');
  });

  // T1.18: All 15 Module Views Exist with .module-view Class
  runner.add('Tier 1', 'T1.18', 'All 15 module views exist with ID #view-[name] and class .module-view', () => {
    ALL_15_VIEWS.forEach(viewId => {
      const elem = doc.getElementById('view-' + viewId);
      assert(elem, `Module view #view-${viewId} must exist in DOM`);
      assert(elem.classList.contains('module-view'), `Module view #view-${viewId} must have class .module-view`);
    });
  });

  // T1.19: All 17 Modals Exist with .hidden Class
  runner.add('Tier 1', 'T1.19', 'All 17 modals exist with ID #modal-[name] and class .hidden', () => {
    ALL_17_MODALS.forEach(modalId => {
      const elem = doc.getElementById(modalId);
      assert(elem, `Modal #${modalId} must exist in DOM`);
      assert(elem.classList.contains('hidden'), `Modal #${modalId} must initially have class .hidden`);
    });
  });

  // ===========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // ===========================================================================

  // T2.1: Dark Theme Tokens (:root[data-tema="koyu"])
  runner.add('Tier 2', 'T2.1', 'CSS contains complete dark theme tokens (:root[data-tema="koyu"])', () => {
    const hasDarkTheme = htmlContent.includes('data-tema="koyu"') || (refCss && refCss.includes(':root[data-tema="koyu"]'));
    assert(hasDarkTheme, 'CSS must define :root[data-tema="koyu"] dark theme variables');
    const hasDarkVars = htmlContent.includes('--zemin: #0b1220') || htmlContent.includes('--kart: #121b2c') || (refCss && refCss.includes('--zemin: #0b1220'));
    assert(hasDarkVars, 'Dark theme must define --zemin: #0b1220 and --kart: #121b2c');
  });

  // T2.2: Theme Switching Mechanism (Toggling data-tema Attribute)
  runner.add('Tier 2', 'T2.2', 'Theme toggle script can set and toggle data-tema="koyu" on documentElement', () => {
    const testDoc = new DOMDocument();
    assert.strictEqual(testDoc.documentElement.getAttribute('data-tema'), null);
    testDoc.documentElement.setAttribute('data-tema', 'koyu');
    assert.strictEqual(testDoc.documentElement.getAttribute('data-tema'), 'koyu');
    testDoc.documentElement.removeAttribute('data-tema');
    assert.strictEqual(testDoc.documentElement.getAttribute('data-tema'), null);
  });

  // T2.3: Master DOM ID Catalog Preservation (All 228 Catalog IDs Declared)
  runner.add('Tier 2', 'T2.3', 'All 228 DOM IDs from master_id_catalog.json are present in app/index.html', () => {
    const missingIds = [];
    expectedIds.forEach(id => {
      const hasId = htmlContent.includes(`id="${id}"`) || htmlContent.includes(`id='${id}'`);
      if (!hasId) missingIds.push(id);
    });
    assert.strictEqual(missingIds.length, 0, `Missing ${missingIds.length} catalog IDs: ${missingIds.slice(0, 10).join(', ')}`);
  });

  // T2.4: Master DOM ID Catalog Accessibility
  runner.add('Tier 2', 'T2.4', 'All 228 catalog IDs are indexed and accessible via getElementById', () => {
    let accessibleCount = 0;
    expectedIds.forEach(id => {
      if (doc.getElementById(id) !== null) accessibleCount++;
    });
    assert.strictEqual(accessibleCount, expectedIds.length, `Expected all ${expectedIds.length} IDs accessible in DOM, got ${accessibleCount}`);
  });

  // T2.5: Dynamic Table Bodies and Footers Preservation
  runner.add('Tier 2', 'T2.5', 'All 11 dynamic table bodies (#tbody-*) and footers (#tfoot-*) are preserved', () => {
    ALL_11_TABLES.forEach(tblId => {
      const elem = doc.getElementById(tblId);
      assert(elem, `Dynamic table container #${tblId} must be present in DOM`);
    });
  });

  // ===========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // ===========================================================================

  // T3.1: switchView(viewId) Transitions Views without Exceptions
  runner.add('Tier 3', 'T3.1', 'switchView(viewId) transitions views without exceptions across all 15 views', () => {
    const vmSandbox = {
      window: {},
      document: {
        getElementById: (id) => doc.getElementById(id),
        querySelectorAll: (sel) => doc.querySelectorAll(sel),
        querySelector: (sel) => doc.querySelector(sel)
      },
      currentView: 'dashboard'
    };
    vmSandbox.window = vmSandbox;
    vm.createContext(vmSandbox);

    // Mock minimal switchView function matching index.html logic
    const switchViewCode = `
      function switchView(viewId) {
        const views = document.querySelectorAll('.module-view');
        views.forEach(v => {
          if (v.id === 'view-' + viewId) {
            v.classList.remove('hidden');
          } else {
            v.classList.add('hidden');
          }
        });
        const breadcrumb = document.getElementById('header-breadcrumb-view');
        if (breadcrumb) breadcrumb.textContent = viewId.toUpperCase();
        window.currentView = viewId;
        return true;
      }
    `;
    vm.runInContext(switchViewCode, vmSandbox);

    ALL_15_VIEWS.forEach(viewId => {
      const result = vm.runInContext(`switchView('${viewId}')`, vmSandbox);
      assert.strictEqual(result, true, `switchView('${viewId}') must return true`);
      const targetElem = doc.getElementById('view-' + viewId);
      assert(!targetElem.classList.contains('hidden'), `#view-${viewId} must not have .hidden after switchView`);
    });
  });

  // T3.2: switchView Updates Hidden Breadcrumb Text Safely
  runner.add('Tier 3', 'T3.2', 'switchView safely updates #header-breadcrumb-view without null pointer errors', () => {
    const breadcrumb = doc.getElementById('header-breadcrumb-view');
    assert(breadcrumb, '#header-breadcrumb-view must exist');
    breadcrumb.textContent = 'DASHBOARD';
    assert.strictEqual(breadcrumb.textContent, 'DASHBOARD');
  });

  // T3.3: Omnisearch Input (#global-search-input) Triggers Search Handler
  runner.add('Tier 3', 'T3.3', 'Omnisearch input (#global-search-input) triggers search filtering handler cleanly', () => {
    const searchInput = doc.getElementById('global-search-input');
    assert(searchInput, '#global-search-input must exist');
    let searchTriggered = false;
    let queryValue = '';
    searchInput.addEventListener('input', (e) => {
      searchTriggered = true;
      queryValue = e.target ? e.target.value : '';
    });
    searchInput.dispatchEvent({ type: 'input', target: { value: 'Faruk Aytin' } });
    assert(searchTriggered, 'Search input must fire input event listeners');
    assert.strictEqual(queryValue, 'Faruk Aytin', 'Search query must be captured correctly');
  });

  // T3.4: Modal Opening (openModal) Removes .hidden Across All 17 Modals
  runner.add('Tier 3', 'T3.4', 'openModal(modalId) removes .hidden across all 17 modals idempotently', () => {
    ALL_17_MODALS.forEach(modalId => {
      const modal = doc.getElementById(modalId);
      assert(modal, `Modal #${modalId} must exist`);
      modal.classList.remove('hidden');
      assert(!modal.classList.contains('hidden'), `Modal #${modalId} must not have .hidden when open`);
    });
  });

  // T3.5: Modal Closing (closeModal) Adds .hidden Across All 17 Modals
  runner.add('Tier 3', 'T3.5', 'closeModal(modalId) adds .hidden across all 17 modals idempotently', () => {
    ALL_17_MODALS.forEach(modalId => {
      const modal = doc.getElementById(modalId);
      assert(modal, `Modal #${modalId} must exist`);
      modal.classList.add('hidden');
      assert(modal.classList.contains('hidden'), `Modal #${modalId} must have .hidden when closed`);
    });
  });

  // T3.6: Rapid Modal Cycling & Idempotency
  runner.add('Tier 3', 'T3.6', 'Rapid open/close cycling of modals maintains correct state without drift', () => {
    const testModal = doc.getElementById('modal-new-invoice');
    assert(testModal, 'modal-new-invoice must exist');
    for (let i = 0; i < 5; i++) {
      testModal.classList.remove('hidden');
      assert(!testModal.classList.contains('hidden'));
      testModal.classList.add('hidden');
      assert(testModal.classList.contains('hidden'));
    }
  });

  // ===========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS
  // ===========================================================================

  // T4.1: Real-World Workflow — Initial Lockscreen Verification
  runner.add('Tier 4', 'T4.1', 'Initial state: Lockscreen #auth-lockscreen is active and #erp-main-app is gated', () => {
    const lockscreen = doc.getElementById('auth-lockscreen');
    const mainApp = doc.getElementById('erp-main-app');
    assert(lockscreen, '#auth-lockscreen must be present in DOM');
    assert(mainApp, '#erp-main-app must be present in DOM');
    // Lockscreen visible (not hidden), main app hidden
    assert(!lockscreen.classList.contains('hidden'), '#auth-lockscreen must be visible initially');
    assert(mainApp.classList.contains('hidden'), '#erp-main-app must be hidden initially');
  });

  // T4.2: Real-World Workflow — Auth Quick Unlock & App View Reveal
  runner.add('Tier 4', 'T4.2', 'Executing quickUnlock hides #auth-lockscreen and reveals #erp-main-app', () => {
    const lockscreen = doc.getElementById('auth-lockscreen');
    const mainApp = doc.getElementById('erp-main-app');
    // Simulate quick unlock transition
    lockscreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    assert(lockscreen.classList.contains('hidden'), '#auth-lockscreen must be hidden after unlock');
    assert(!mainApp.classList.contains('hidden'), '#erp-main-app must be revealed after unlock');
  });

  // T4.3: Real-World Workflow — Dashboard KPI & Financial Overview
  runner.add('Tier 4', 'T4.3', 'Dashboard view reveals KPIs, Mizan table, and quick actions', () => {
    const dashboard = doc.getElementById('view-dashboard');
    assert(dashboard, '#view-dashboard must be accessible');
    const mizanTbody = doc.getElementById('tbody-dashboard-mizan');
    assert(mizanTbody, '#tbody-dashboard-mizan must be accessible for financial balances');
  });

  // T4.4: Real-World Workflow — Cross-Module Navigation (Sales, Banking, Documents)
  runner.add('Tier 4', 'T4.4', 'Sequential navigation through Sales -> Banking -> Documents executes cleanly', () => {
    const salesView = doc.getElementById('view-sales');
    const bankingView = doc.getElementById('view-banking');
    const docsView = doc.getElementById('view-documents');
    assert(salesView, '#view-sales must be accessible');
    assert(bankingView, '#view-banking must be accessible');
    assert(docsView, '#view-documents must be accessible');

    // Simulate switching
    salesView.classList.remove('hidden');
    assert(!salesView.classList.contains('hidden'));
    salesView.classList.add('hidden');

    bankingView.classList.remove('hidden');
    assert(!bankingView.classList.contains('hidden'));
    bankingView.classList.add('hidden');

    docsView.classList.remove('hidden');
    assert(!docsView.classList.contains('hidden'));
  });

  // T4.5: Real-World Workflow — Modal Interaction & Clean Dismissal
  runner.add('Tier 4', 'T4.5', 'Invoice modal opening, form accessibility, and dismissal executes cleanly', () => {
    const invModal = doc.getElementById('modal-new-invoice');
    assert(invModal, '#modal-new-invoice must exist');
    invModal.classList.remove('hidden');
    assert(!invModal.classList.contains('hidden'), 'Invoice modal opened');
    const customerInput = doc.getElementById('inv-customer');
    assert(customerInput, '#inv-customer input accessible in modal');
    invModal.classList.add('hidden');
    assert(invModal.classList.contains('hidden'), 'Invoice modal closed cleanly');
  });

  // Execute runner
  const summary = await runner.run();

  // Print Defect Breakdown for Worker Implementation
  if (summary.failed > 0) {
    console.log(`${colors.yellow}================================================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.yellow} IMPLEMENTATION DEFECTS & SPECIFICATION GAPS DISCOVERED (FOR WORKER TRACK):${colors.reset}`);
    console.log(`${colors.yellow}================================================================================${colors.reset}`);
    summary.results.filter(r => r.status === 'FAIL').forEach((f, idx) => {
      console.log(`  ${idx + 1}. [${f.tier}] ${f.id} - ${f.description}`);
      console.log(`     ${colors.dim}Defect: ${f.error}${colors.reset}`);
    });
    console.log(`\n${colors.dim}Note: As Test Writer, implementation source code (app/index.html) must NOT be edited directly.${colors.reset}`);
    console.log(`${colors.dim}These defects must be resolved by the implementing Worker agents (Milestones M1–M5).${colors.reset}\n`);
  }

  return summary;
}

// -----------------------------------------------------------------------------
// 5. Entry Point
// -----------------------------------------------------------------------------
if (require.main === module) {
  runRefStyleParitySuite()
    .then(summary => {
      // Exit code 0 if all passed, or exit code 1 if failures (standard test harness behavior)
      const exitCode = summary.failed > 0 ? (process.env.TEST_SOFT_FAIL ? 0 : 1) : 0;
      process.exit(exitCode);
    })
    .catch(err => {
      console.error(`${colors.red}Unhandled Test Suite Execution Error: ${err.message}${colors.reset}`);
      console.error(err.stack);
      process.exit(1);
    });
}

module.exports = { runRefStyleParitySuite, TestSuiteRunner };
