/**
 * BROSAN TEKSTİL ERP — PHASE 4 CITADEL SECURITY HARDENING
 * CHALLENGER M1-1: ADVERSARIAL EVASION & STRESS TEST HARNESS
 * 
 * Target: server/heuristicWaf.js
 * 
 * Deeply attacks and verifies:
 * 1. Double-encoded and multi-layered encodings (URL, Hex, Unicode, Multi-pass, Dotfiles, Null bytes)
 * 2. Inline comment splitting and mixed-case SQLi (keyword fragmentation, comments with CRLF, unclosed comments)
 * 3. Deeply nested Prototype Pollution in objects and query strings (depth boundaries, quoted query keys, value gadgets)
 * 4. Path Traversal lookbehind and boundary edge cases (ellipsis negative lookbehind FP tests, 4-dot traversal, Windows/UNC)
 * 5. High-volume payload stress, ReDoS resistance, and memory stability (10k iterations, heap profiling, <1ms latency)
 * 6. Live Express integration with Tri-Fold Incident Response (403, quarantineEngine, auditLogger, threatAlerter)
 */

const assert = require('assert');
const http = require('http');
const express = require('express');
const { performance } = require('perf_hooks');

const {
  heuristicWafGuard,
  inspectPayload,
  isPathTraversal,
  isXSS,
  isPrototypePollutionKey,
  isPrototypePollutionValue,
  normalizeInspectStrings,
  sqliPatterns,
  nosqlKeyPatterns,
  nosqlStringPatterns
} = require('../server/heuristicWaf');

const { quarantineEngine } = require('../server/quarantine');
const threatAlerter = require('../server/threatAlerter');
const auditLogger = require('../server/auditLogger');

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m'
};

function sendHttpRequest({ hostname = '127.0.0.1', port, path = '/', method = 'POST', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname, port, path, method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, text: data, json });
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runChallengerEvasionSuite() {
  console.log(`${colors.bold}${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}⚔️  CHALLENGER M1-1: ADVERSARIAL EVASION & STRESS TEST HARNESS${colors.reset}`);
  console.log(`${colors.dim}Target: server/heuristicWaf.js — Empirical Verification of Evasion & Resiliency${colors.reset}`);
  console.log(`${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  let totalTests = 0;
  let passedTests = 0;
  const failedList = [];

  function recordResult(testId, description, passed, error = null) {
    totalTests++;
    if (passed) {
      passedTests++;
      console.log(`  ${colors.green}✔ PASS${colors.reset} [${testId}] ${description}`);
    } else {
      failedList.push({ testId, description, error: error ? error.message : 'Failed assertion' });
      console.error(`  ${colors.red}✖ FAIL${colors.reset} [${testId}] ${description} — ${error ? error.message : 'Assertion failed'}`);
    }
  }

  // ==============================================================================
  // SECTION 1: DOUBLE-ENCODED AND MULTI-LAYERED ENCODINGS
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 1] Double-Encoded & Multi-Layered Encodings${colors.reset}`);

  // DEC-01: Double URL-encoded SQLi in JSON string
  try {
    const v = inspectPayload("%2527%2520OR%25201%253D1");
    assert.ok(v, "Must detect double-encoded SQLi (' OR 1=1)");
    assert.strictEqual(v.attackType, 'SQL_INJECTION');
    recordResult('DEC-01', "Double URL-encoded SQLi (%2527%2520OR%25201%253D1)", true);
  } catch (err) { recordResult('DEC-01', "Double URL-encoded SQLi", false, err); }

  // DEC-02: Double URL-encoded Path Traversal (%252e%252e%252f)
  try {
    const v = inspectPayload("%252e%252e%252f%252e%252e%252fetc%252fpasswd");
    assert.ok(v, "Must detect double-encoded traversal (%252e%252e%252f)");
    assert.strictEqual(v.attackType, 'PATH_TRAVERSAL');
    recordResult('DEC-02', "Double URL-encoded Path Traversal (%252e%252e%252fetc/passwd)", true);
  } catch (err) { recordResult('DEC-02', "Double URL-encoded Path Traversal", false, err); }

  // DEC-03: Mixed URL-encoded Hex escape in JSON string (\x27 OR 1=1)
  try {
    const v = inspectPayload("%5cx27%20OR%201=1");
    assert.ok(v, "Must detect mixed URL-encoded Hex escape (%5cx27)");
    assert.strictEqual(v.attackType, 'SQL_INJECTION');
    recordResult('DEC-03', "Mixed URL-encoded Hex escape (%5cx27%20OR%201=1)", true);
  } catch (err) { recordResult('DEC-03', "Mixed URL-encoded Hex escape", false, err); }

  // DEC-04: Mixed URL-encoded Unicode escape (\u0027 OR 1=1)
  try {
    const v = inspectPayload("%255cu0027%2520OR%25201%253D1");
    assert.ok(v, "Must detect mixed URL-encoded Unicode escape (%255cu0027)");
    assert.strictEqual(v.attackType, 'SQL_INJECTION');
    recordResult('DEC-04', "Mixed URL-encoded Unicode escape (%255cu0027%2520OR%25201%253D1)", true);
  } catch (err) { recordResult('DEC-04', "Mixed URL-encoded Unicode escape", false, err); }

  // DEC-05: Double URL-encoded XSS (<script>alert(1)</script>)
  try {
    const v = inspectPayload("%253cscript%253ealert(1)%253c%252fscript%253e");
    assert.ok(v, "Must detect double-encoded XSS");
    assert.strictEqual(v.attackType, 'XSS');
    recordResult('DEC-05', "Double URL-encoded XSS (%253cscript%253e)", true);
  } catch (err) { recordResult('DEC-05', "Double URL-encoded XSS", false, err); }

  // DEC-06: Double URL-encoded dotfile (.env -> %252e%2565%256e%2576)
  try {
    const v = inspectPayload("%252e%2565%256e%2576");
    assert.ok(v, "Must detect double-encoded .env dotfile");
    assert.strictEqual(v.attackType, 'PATH_TRAVERSAL');
    recordResult('DEC-06', "Double URL-encoded dotfile (%252e%2565%256e%2576)", true);
  } catch (err) { recordResult('DEC-06', "Double URL-encoded dotfile", false, err); }

  // DEC-07: Double-encoded null byte evasion with traversal
  try {
    const v = inspectPayload("../../etc/passwd%2500.png");
    assert.ok(v, "Must detect double-encoded null byte in traversal");
    assert.strictEqual(v.attackType, 'PATH_TRAVERSAL');
    recordResult('DEC-07', "Double-encoded null byte in traversal (%2500)", true);
  } catch (err) { recordResult('DEC-07', "Double-encoded null byte in traversal", false, err); }

  // DEC-08: Mixed raw dot + double-encoded dot (\\.%252e/)
  try {
    const v = inspectPayload(".%252e/etc/passwd");
    assert.ok(v, "Must detect mixed raw dot + double-encoded dot");
    assert.strictEqual(v.attackType, 'PATH_TRAVERSAL');
    recordResult('DEC-08', "Mixed raw dot + double-encoded dot (.%252e/)", true);
  } catch (err) { recordResult('DEC-08', "Mixed raw dot + double-encoded dot", false, err); }

  // ==============================================================================
  // SECTION 2: INLINE COMMENT SPLITTING AND MIXED CASE SQLi
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 2] Inline Comment Splitting & Mixed Case SQLi${colors.reset}`);

  // CMT-01: Keyword internal inline comment split UN/**/ION SELECT
  try {
    const v = inspectPayload("UN/**/ION SELECT 1, 2, 3");
    assert.ok(v, "Must detect UN/**/ION SELECT keyword splitting");
    assert.strictEqual(v.attackType, 'SQL_INJECTION');
    recordResult('CMT-01', "Keyword internal inline comment split (UN/**/ION SELECT)", true);
  } catch (err) { recordResult('CMT-01', "Keyword internal inline comment split", false, err); }

  // CMT-02: Keyword internal inline comment split 1' UNION SE/**/LECT
  try {
    const v = inspectPayload("1' UNION SE/**/LECT 1, 2, 3");
    assert.ok(v, "Must detect 1' UNION SE/**/LECT");
    assert.strictEqual(v.attackType, 'SQL_INJECTION');
    recordResult('CMT-02', "Keyword internal inline comment split (1' UNION SE/**/LECT)", true);
  } catch (err) { recordResult('CMT-02', "Keyword internal inline comment split", false, err); }

  // CMT-03: Comment between keywords without space UNION/**/SELECT
  try {
    const v = inspectPayload("UNION/**/SELECT 1, 2, 3");
    assert.ok(v, "Must detect UNION/**/SELECT");
    assert.strictEqual(v.attackType, 'SQL_INJECTION');
    recordResult('CMT-03', "Comment between keywords without space UNION/**/SELECT", true);
  } catch (err) { recordResult('CMT-03', "Comment between keywords without space", false, err); }

  // CMT-04: Comment between UNION ALL SELECT
  try {
    const v = inspectPayload("UNION/**/ALL/**/SELECT 1, 2, 3");
    assert.ok(v, "Must detect UNION/**/ALL/**/SELECT");
    assert.strictEqual(v.attackType, 'SQL_INJECTION');
    recordResult('CMT-04', "Comment in UNION/**/ALL/**/SELECT", true);
  } catch (err) { recordResult('CMT-04', "Comment in UNION/**/ALL/**/SELECT", false, err); }

  // CMT-05: Boolean tautology with inline comment 1'/**/OR/**/1=1/**/--
  try {
    const v = inspectPayload("1'/**/OR/**/1=1/**/--");
    assert.ok(v, "Must detect 1'/**/OR/**/1=1/**/--");
    assert.strictEqual(v.attackType, 'SQL_INJECTION');
    recordResult('CMT-05', "Boolean tautology with inline comment 1'/**/OR/**/1=1", true);
  } catch (err) { recordResult('CMT-05', "Boolean tautology with inline comment", false, err); }

  // CMT-06: Boolean quoted tautology with comments '/*x*/OR/*x*/'1'='1'
  try {
    const v = inspectPayload("'/*x*/OR/*x*/'1'='1'");
    assert.ok(v, "Must detect '/*x*/OR/*x*/'1'='1'");
    assert.strictEqual(v.attackType, 'SQL_INJECTION');
    recordResult('CMT-06', "Boolean quoted tautology '/*x*/OR/*x*/'1'='1'", true);
  } catch (err) { recordResult('CMT-06', "Boolean quoted tautology with comments", false, err); }

  // CMT-07: Multiline comment with CRLF UNION/*\r\nmultiline\r\n*/SELECT
  try {
    const v = inspectPayload("UNION/*\r\nmultiline\r\n*/SELECT 1, 2, 3");
    assert.ok(v, "Must detect multiline comment with CRLF");
    assert.strictEqual(v.attackType, 'SQL_INJECTION');
    recordResult('CMT-07', "Multiline comment with CRLF in UNION/SELECT", true);
  } catch (err) { recordResult('CMT-07', "Multiline comment with CRLF", false, err); }

  // CMT-08: Unclosed inline comment truncation 1'/*unclosed
  try {
    const v = inspectPayload("1'/*unclosed comment SQLi");
    assert.ok(v, "Must detect 1'/* unclosed comment truncation");
    assert.strictEqual(v.attackType, 'SQL_INJECTION');
    recordResult('CMT-08', "Unclosed inline comment truncation (1'/*)", true);
  } catch (err) { recordResult('CMT-08', "Unclosed inline comment truncation", false, err); }

  // CMT-09: Mixed case stacked DDL (1; dRoP tAbLe users; --)
  try {
    const v = inspectPayload("1; dRoP tAbLe users; --");
    assert.ok(v, "Must detect mixed case stacked DDL");
    assert.strictEqual(v.attackType, 'SQL_INJECTION');
    recordResult('CMT-09', "Mixed case stacked DDL (dRoP tAbLe)", true);
  } catch (err) { recordResult('CMT-09', "Mixed case stacked DDL", false, err); }

  // CMT-10: Mixed case system catalog probe
  try {
    const v = inspectPayload("1' UNION SELECT 1 FROM iNfOrMaTiOn_sChEmA.tAbLeS--");
    assert.ok(v, "Must detect mixed case system catalog probe");
    assert.strictEqual(v.attackType, 'SQL_INJECTION');
    recordResult('CMT-10', "Mixed case system catalog probe (iNfOrMaTiOn_sChEmA)", true);
  } catch (err) { recordResult('CMT-10', "Mixed case system catalog probe", false, err); }

  // CMT-11: Mixed case time-based blind (sLeEp(5))
  try {
    const v = inspectPayload("1' AND sLeEp(5)--");
    assert.ok(v, "Must detect mixed case sLeEp(5)");
    assert.strictEqual(v.attackType, 'SQL_INJECTION');
    recordResult('CMT-11', "Mixed case time-based blind (sLeEp(5))", true);
  } catch (err) { recordResult('CMT-11', "Mixed case time-based blind", false, err); }

  // CMT-12: Mixed case pg_sleep (pG_sLeEp(5))
  try {
    const v = inspectPayload("1'; pG_sLeEp(5); --");
    assert.ok(v, "Must detect mixed case pG_sLeEp(5)");
    assert.strictEqual(v.attackType, 'SQL_INJECTION');
    recordResult('CMT-12', "Mixed case PostgreSQL blind (pG_sLeEp(5))", true);
  } catch (err) { recordResult('CMT-12', "Mixed case pg_sleep", false, err); }

  // CMT-13: Mixed case WAITFOR DELAY (wAiTfOr dElAy)
  try {
    const v = inspectPayload("1'; wAiTfOr dElAy '0:0:5'--");
    assert.ok(v, "Must detect mixed case wAiTfOr dElAy");
    assert.strictEqual(v.attackType, 'SQL_INJECTION');
    recordResult('CMT-13', "Mixed case MSSQL blind (wAiTfOr dElAy)", true);
  } catch (err) { recordResult('CMT-13', "Mixed case WAITFOR DELAY", false, err); }

  // ==============================================================================
  // SECTION 3: DEEPLY NESTED PROTOTYPE POLLUTION IN OBJECTS & QUERY STRINGS
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 3] Deeply Nested Prototype Pollution in Objects & Query Strings${colors.reset}`);

  // PRO-01: Depth 8 nested object with __proto__ key (JSON wire payload)
  try {
    let jsonStr = '{"__proto__": {"isAdmin": true}}';
    for (let i = 0; i < 7; i++) jsonStr = `{"wrap": ${jsonStr}}`;
    const obj8 = JSON.parse(jsonStr);
    const v = inspectPayload(obj8);
    assert.ok(v, "Must detect depth 8 __proto__ pollution in JSON payload");
    assert.strictEqual(v.attackType, 'PROTOTYPE_POLLUTION');
    recordResult('PRO-01', "Depth 8 nested object with __proto__ key (JSON wire payload)", true);
  } catch (err) { recordResult('PRO-01', "Depth 8 nested object with __proto__", false, err); }

  // PRO-02: Depth 9 nested object with constructor.prototype key
  try {
    let obj9 = { "constructor.prototype": { evil: 1 } };
    for (let i = 0; i < 8; i++) obj9 = { wrap: obj9 };
    const v = inspectPayload(obj9);
    assert.ok(v, "Must detect depth 9 constructor.prototype key");
    assert.strictEqual(v.attackType, 'PROTOTYPE_POLLUTION');
    recordResult('PRO-02', "Depth 9 nested object with constructor.prototype key", true);
  } catch (err) { recordResult('PRO-02', "Depth 9 nested object with constructor.prototype", false, err); }

  // PRO-03: Depth 10 nested object with prototype key
  try {
    let obj10 = { "prototype": { evil: 1 } };
    for (let i = 0; i < 9; i++) obj10 = { wrap: obj10 };
    const v = inspectPayload(obj10);
    assert.ok(v, "Must detect depth 10 prototype key");
    assert.strictEqual(v.attackType, 'PROTOTYPE_POLLUTION');
    recordResult('PRO-03', "Depth 10 nested object with prototype key", true);
  } catch (err) { recordResult('PRO-03', "Depth 10 nested object with prototype key", false, err); }

  // PRO-04: Depth 11 nesting boundary check (evaluating recursion ceiling behavior)
  try {
    // Beyond MAX_TRAVERSAL_DEPTH (10)
    let deep = { "__proto__": { evil: 1 } };
    for (let i = 0; i < 11; i++) deep = { wrap: deep };
    const v = inspectPayload(deep);
    // At depth 11, maxDepth reaches 0. Bounded depth stops traversal cleanly without throwing.
    assert.strictEqual(v, null, "Depth 11 safely bounded without crash / stack overflow");
    recordResult('PRO-04', "Depth 11 boundary check: safe bounded termination", true);
  } catch (err) { recordResult('PRO-04', "Depth 11 boundary check", false, err); }

  // PRO-05: Query string bracket prototype pollution (obj[__proto__])
  try {
    assert.strictEqual(isPrototypePollutionKey("obj[__proto__]"), true);
    recordResult('PRO-05', "Query string bracket key (obj[__proto__])", true);
  } catch (err) { recordResult('PRO-05', "Query string key obj[__proto__]", false, err); }

  // PRO-05B: Query string bracket prototype key (obj[prototype])
  try {
    assert.strictEqual(isPrototypePollutionKey("obj[prototype]"), true);
    recordResult('PRO-05B', "Query string bracket key (obj[prototype])", true);
  } catch (err) { recordResult('PRO-05B', "Query string key obj[prototype]", false, err); }

  // PRO-06: Query string raw dot prototype pollution
  try {
    assert.strictEqual(isPrototypePollutionKey("__proto__.polluted"), true);
    recordResult('PRO-06', "Query string key __proto__.polluted", true);
  } catch (err) { recordResult('PRO-06', "Query string key __proto__.polluted", false, err); }

  // PRO-07: Query string constructor bracket prototype pollution
  try {
    assert.strictEqual(isPrototypePollutionKey("constructor[prototype][polluted]"), true);
    recordResult('PRO-07', "Query string key constructor[prototype][polluted]", true);
  } catch (err) { recordResult('PRO-07', "Query string key constructor[prototype][polluted]", false, err); }

  // PRO-08: Query string constructor dot prototype pollution
  try {
    assert.strictEqual(isPrototypePollutionKey("constructor.prototype.polluted"), true);
    recordResult('PRO-08', "Query string key constructor.prototype.polluted", true);
  } catch (err) { recordResult('PRO-08', "Query string key constructor.prototype.polluted", false, err); }

  // PRO-09: Nested query string user['__proto__'] key
  try {
    // In inspectPayload string value or key check
    const v = inspectPayload("user['__proto__']");
    assert.ok(v, "Must detect quoted __proto__ string value/key");
    assert.strictEqual(v.attackType, 'PROTOTYPE_POLLUTION');
    recordResult('PRO-09', "Quoted query key user['__proto__']", true);
  } catch (err) { recordResult('PRO-09', "Quoted query key user['__proto__']", false, err); }

  // PRO-10: URL-encoded proto key %5f%5fproto%5f%5f
  try {
    const v = inspectPayload("%5f%5fproto%5f%5f");
    assert.ok(v, "Must detect URL-encoded __proto__ key");
    assert.strictEqual(v.attackType, 'PROTOTYPE_POLLUTION');
    recordResult('PRO-10', "URL-encoded proto key %5f%5fproto%5f%5f", true);
  } catch (err) { recordResult('PRO-10', "URL-encoded proto key %5f%5fproto%5f%5f", false, err); }

  // PRO-11: Value prototype pollution gadget (Object.prototype)
  try {
    const v = inspectPayload({ gadget: "Object.prototype.isAdmin = true" });
    assert.ok(v, "Must detect Object.prototype in value string");
    assert.strictEqual(v.attackType, 'PROTOTYPE_POLLUTION');
    recordResult('PRO-11', "Value gadget string Object.prototype.isAdmin", true);
  } catch (err) { recordResult('PRO-11', "Value gadget string Object.prototype", false, err); }

  // PRO-12: Deep array prototype pollution (JSON wire payload)
  try {
    const arr = JSON.parse('[[[{"__proto__": {"isAdmin": true}}]]]');
    const v = inspectPayload(arr);
    assert.ok(v, "Must detect prototype pollution in nested array");
    assert.strictEqual(v.attackType, 'PROTOTYPE_POLLUTION');
    recordResult('PRO-12', "Deep array nested __proto__ element (JSON wire payload)", true);
  } catch (err) { recordResult('PRO-12', "Deep array nested __proto__ element", false, err); }

  // PRO-13: Object created with Object.create(null)
  try {
    const nullProto = Object.create(null);
    nullProto["__proto__"] = { hacked: true };
    const v = inspectPayload(nullProto);
    assert.ok(v, "Must detect __proto__ even in Object.create(null)");
    assert.strictEqual(v.attackType, 'PROTOTYPE_POLLUTION');
    recordResult('PRO-13', "Object.create(null) with __proto__ key", true);
  } catch (err) { recordResult('PRO-13', "Object.create(null) with __proto__ key", false, err); }

  // PRO-14: Legitimate prototype business text (Whitelisted / Zero False-Positive)
  try {
    const v1 = inspectPayload("prototype textile fabric sample for summer 2026");
    assert.strictEqual(v1, null, "Authentic prototype sample text must NOT be blocked");
    const v2 = inspectPayload("constructor machine calibration guide");
    assert.strictEqual(v2, null, "Authentic constructor machine text must NOT be blocked");
    recordResult('PRO-14', "Business text containing 'prototype' or 'constructor' -> Clean null", true);
  } catch (err) { recordResult('PRO-14', "Business text whitelist check", false, err); }

  // ==============================================================================
  // SECTION 4: PATH TRAVERSAL LOOKBEHIND AND BOUNDARY EDGE CASES
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 4] Path Traversal Lookbehind & Boundary Edge Cases${colors.reset}`);

  // TRA-01: Legitimate text ellipsis followed by slash (Lookbehind FP check)
  try {
    const v = inspectPayload("Waiting for customs clearance.../processing in warehouse");
    assert.strictEqual(v, null, "Ellipsis followed by slash '.../' must NOT trigger path traversal");
    recordResult('TRA-01', "Legitimate ellipsis followed by slash '.../' -> Clean (No FP)", true);
  } catch (err) { recordResult('TRA-01', "Legitimate ellipsis followed by slash", false, err); }

  // TRA-02: Legitimate text ellipsis followed by backslash (Lookbehind FP check)
  try {
    const v = inspectPayload("Draft invoice...\\approved by finance");
    assert.strictEqual(v, null, "Ellipsis followed by backslash '...\\' must NOT trigger path traversal");
    recordResult('TRA-02', "Legitimate ellipsis followed by backslash '...\\' -> Clean (No FP)", true);
  } catch (err) { recordResult('TRA-02', "Legitimate ellipsis followed by backslash", false, err); }

  // TRA-03: Real traversal with leading dots ..../ (four dots then slash)
  try {
    const v = inspectPayload("..../etc/passwd");
    assert.ok(v, "Must detect ..../ traversal");
    assert.strictEqual(v.attackType, 'PATH_TRAVERSAL');
    recordResult('TRA-03', "Multi-dot path traversal (..../etc/passwd)", true);
  } catch (err) { recordResult('TRA-03', "Multi-dot path traversal (..../)", false, err); }

  // TRA-04: Real traversal with ....// (four dots double slash)
  try {
    const v = inspectPayload("....//etc/shadow");
    assert.ok(v, "Must detect ....// traversal");
    assert.strictEqual(v.attackType, 'PATH_TRAVERSAL');
    recordResult('TRA-04', "Multi-dot double-slash traversal (....//)", true);
  } catch (err) { recordResult('TRA-04', "Multi-dot double-slash traversal", false, err); }

  // TRA-05: Relative step-down step-up ./../
  try {
    const v = inspectPayload("./../etc/hosts");
    assert.ok(v, "Must detect ./../ step-down step-up");
    assert.strictEqual(v.attackType, 'PATH_TRAVERSAL');
    recordResult('TRA-05', "Relative step-down step-up (./../etc/hosts)", true);
  } catch (err) { recordResult('TRA-05', "Relative step-down step-up", false, err); }

  // TRA-06: Windows step-down step-up .\\..\\
  try {
    const v = inspectPayload(".\\..\\windows\\system32");
    assert.ok(v, "Must detect .\\..\\ Windows traversal");
    assert.strictEqual(v.attackType, 'PATH_TRAVERSAL');
    recordResult('TRA-06', "Windows step-down step-up (.\\..\\)", true);
  } catch (err) { recordResult('TRA-06', "Windows step-down step-up", false, err); }

  // TRA-07: Exact two dots alone '..'
  try {
    const v = inspectPayload("..");
    assert.ok(v, "Must detect bare '..' traversal token");
    assert.strictEqual(v.attackType, 'PATH_TRAVERSAL');
    recordResult('TRA-07', "Bare two-dot token ('..')", true);
  } catch (err) { recordResult('TRA-07', "Bare two-dot token", false, err); }

  // TRA-08: Exact two dots with leading slash '/..'
  try {
    const v = inspectPayload("/..");
    assert.ok(v, "Must detect '/..' traversal token at end of path");
    assert.strictEqual(v.attackType, 'PATH_TRAVERSAL');
    recordResult('TRA-08', "Trailing two-dot with slash ('/..')", true);
  } catch (err) { recordResult('TRA-08', "Trailing two-dot with slash", false, err); }

  // TRA-09: Mixed slash and backslash ..\\../..\\
  try {
    const v = inspectPayload("..\\../..\\etc/passwd");
    assert.ok(v, "Must detect mixed slash/backslash traversal");
    assert.strictEqual(v.attackType, 'PATH_TRAVERSAL');
    recordResult('TRA-09', "Mixed slash/backslash traversal (..\\../)", true);
  } catch (err) { recordResult('TRA-09', "Mixed slash/backslash traversal", false, err); }

  // TRA-10: Sensitive Windows system file path (c:\\windows\\system32\\cmd.exe)
  try {
    const v = inspectPayload("c:\\windows\\system32\\cmd.exe");
    assert.ok(v, "Must detect Windows system32 access");
    assert.strictEqual(v.attackType, 'PATH_TRAVERSAL');
    recordResult('TRA-10', "Sensitive Windows system path (system32\\cmd.exe)", true);
  } catch (err) { recordResult('TRA-10', "Sensitive Windows system path", false, err); }

  // TRA-11: Sensitive VCS and credential dotfiles (.git, .ssh, .aws)
  try {
    const v1 = inspectPayload("/var/www/.git/config");
    assert.ok(v1, "Must detect .git dotfile access");
    const v2 = inspectPayload("/home/node/.ssh/id_rsa");
    assert.ok(v2, "Must detect .ssh dotfile access");
    const v3 = inspectPayload("/root/.aws/credentials");
    assert.ok(v3, "Must detect .aws credentials access");
    recordResult('TRA-11', "Sensitive dotfiles (.git, .ssh, .aws)", true);
  } catch (err) { recordResult('TRA-11', "Sensitive dotfiles", false, err); }

  // ==============================================================================
  // SECTION 5: HIGH-VOLUME PAYLOAD STRESS, REDOS & MEMORY STABILITY
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 5] High-Volume Payload Stress, ReDoS & Memory Stability${colors.reset}`);

  // STR-01: 1,000 rapid sequential payload inspections
  try {
    const tStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      inspectPayload({ id: i, name: `Kumaş Kalite Raporu #${i}`, amount: 1500.50 + i });
    }
    const tElapsed = performance.now() - tStart;
    const avgLatency = tElapsed / 1000;
    assert.ok(avgLatency < 0.5, `Average latency must be <0.5ms (was ${avgLatency.toFixed(3)}ms)`);
    recordResult('STR-01', `1,000 rapid inspections (avg: ${avgLatency.toFixed(3)}ms/req, total: ${tElapsed.toFixed(1)}ms)`, true);
  } catch (err) { recordResult('STR-01', "1,000 rapid inspections", false, err); }

  // STR-02: Large string payload (100,000 characters benign)
  try {
    const largeStr = "Brosan Tekstil Fason Dikiş Raporu: Kumaş Lot No TR-2026-X. ".repeat(1700); // ~100KB
    const tStart = performance.now();
    const v = inspectPayload(largeStr);
    const tElapsed = performance.now() - tStart;
    assert.strictEqual(v, null, "100KB benign text must return null");
    assert.ok(tElapsed < 50, `100KB scan must complete in <50ms (took ${tElapsed.toFixed(2)}ms)`);
    recordResult('STR-02', `100KB large string scan (${tElapsed.toFixed(2)}ms < 50ms) -> Clean`, true);
  } catch (err) { recordResult('STR-02', "100KB large string scan", false, err); }

  // STR-03: ReDoS attack simulation against SQLI_SUBQUERY: '(select ' + 500 * ' from a ' without ')'
  try {
    const redosSqli = "(select " + " from table ".repeat(500);
    const tStart = performance.now();
    const v = inspectPayload(redosSqli);
    const tElapsed = performance.now() - tStart;
    assert.strictEqual(v, null, "Unclosed subquery without ')' returns null");
    assert.ok(tElapsed < 30, `ReDoS subquery attack must complete in <30ms (took ${tElapsed.toFixed(2)}ms)`);
    recordResult('STR-03', `SQLI_SUBQUERY ReDoS stress (${tElapsed.toFixed(2)}ms < 30ms) -> Resilient`, true);
  } catch (err) { recordResult('STR-03', "SQLI_SUBQUERY ReDoS stress", false, err); }

  // STR-04: ReDoS attack simulation against XSS regexes:
  try {
    const redosXss = "java" + "\t".repeat(5000) + "script:alert(1)";
    const tStart = performance.now();
    const v = inspectPayload(redosXss);
    const tElapsed = performance.now() - tStart;
    assert.ok(v, "Must detect tab-obfuscated javascript protocol");
    assert.ok(tElapsed < 30, `XSS pseudo-protocol ReDoS scan must be <30ms (took ${tElapsed.toFixed(2)}ms)`);
    recordResult('STR-04', `XSS pseudo-protocol ReDoS stress (${tElapsed.toFixed(2)}ms < 30ms) -> Detected`, true);
  } catch (err) { recordResult('STR-04', "XSS pseudo-protocol ReDoS stress", false, err); }

  // STR-05: Deep object hierarchy (15 nested levels with 10 keys per level)
  try {
    let deepHierarchy = { leaf: "clean_data" };
    for (let d = 0; d < 15; d++) {
      const levelObj = {};
      for (let k = 0; k < 10; k++) levelObj[`key_${d}_${k}`] = `value_${k}`;
      levelObj.child = deepHierarchy;
      deepHierarchy = levelObj;
    }
    const tStart = performance.now();
    const v = inspectPayload(deepHierarchy);
    const tElapsed = performance.now() - tStart;
    assert.strictEqual(v, null, "Safe deep hierarchy terminates cleanly");
    assert.ok(tElapsed < 30, `Deep hierarchy must complete in <30ms (took ${tElapsed.toFixed(2)}ms)`);
    recordResult('STR-05', `Deep hierarchy stress 15 levels / 150 nodes (${tElapsed.toFixed(2)}ms) -> Safe`, true);
  } catch (err) { recordResult('STR-05', "Deep hierarchy stress", false, err); }

  // STR-06: Wide object stress (1,000 distinct properties)
  try {
    const wideObj = {};
    for (let i = 0; i < 1000; i++) wideObj[`field_${i}`] = `accounting_item_${i}`;
    const tStart = performance.now();
    const v = inspectPayload(wideObj);
    const tElapsed = performance.now() - tStart;
    assert.strictEqual(v, null, "Wide object terminates cleanly");
    assert.ok(tElapsed < 25, `Wide object scan must be <25ms (took ${tElapsed.toFixed(2)}ms)`);
    recordResult('STR-06', `Wide object stress with 1,000 keys (${tElapsed.toFixed(2)}ms) -> Safe`, true);
  } catch (err) { recordResult('STR-06', "Wide object stress", false, err); }

  // STR-07: Large array stress (2,000 items)
  try {
    const largeArr = Array.from({ length: 2000 }, (_, i) => ({ id: i, note: `Kumaş Sevkiyat Fişi #${i}` }));
    const tStart = performance.now();
    const v = inspectPayload(largeArr);
    const tElapsed = performance.now() - tStart;
    assert.strictEqual(v, null, "Large array terminates cleanly");
    assert.ok(tElapsed < 30, `Large array scan must be <30ms (took ${tElapsed.toFixed(2)}ms)`);
    recordResult('STR-07', `Large array stress with 2,000 items (${tElapsed.toFixed(2)}ms) -> Safe`, true);
  } catch (err) { recordResult('STR-07', "Large array stress", false, err); }

  // STR-08: Complex circular reference stress (A -> B -> C -> A)
  try {
    const nodeA = { name: 'NodeA' };
    const nodeB = { name: 'NodeB' };
    const nodeC = { name: 'NodeC' };
    nodeA.b = nodeB;
    nodeB.c = nodeC;
    nodeC.a = nodeA;
    const v = inspectPayload(nodeA);
    assert.strictEqual(v, null, "Triangular circular cycle resolves safely without stack overflow");
    recordResult('STR-08', "Circular reference cycle (A -> B -> C -> A) -> Safe WeakSet cycle break", true);
  } catch (err) { recordResult('STR-08', "Circular reference cycle", false, err); }

  // STR-09: Memory stability profile across 10,000 iterations
  try {
    if (global.gc) global.gc();
    const initialHeap = process.memoryUsage().heapUsed;

    for (let i = 0; i < 10000; i++) {
      inspectPayload({
        orderId: `ORD-${i}`,
        items: [{ product: "Et Kefeni", qty: 50 }, { product: "Ribana", qty: 25 }],
        meta: { approved: true, internalId: i }
      });
    }

    if (global.gc) global.gc();
    const finalHeap = process.memoryUsage().heapUsed;
    const heapDiffMB = (finalHeap - initialHeap) / (1024 * 1024);
    assert.ok(heapDiffMB < 30, `Heap growth must be <30MB (grew by ${heapDiffMB.toFixed(2)}MB)`);
    recordResult('STR-09', `Memory stability across 10,000 scans (heap delta: ${heapDiffMB.toFixed(2)}MB < 30MB)`, true);
  } catch (err) { recordResult('STR-09', "Memory stability profile", false, err); }

  // ==============================================================================
  // SECTION 6: LIVE EXPRESS INTEGRATION & TRI-FOLD INCIDENT RESPONSE
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 6] Live Express Integration & Tri-Fold Incident Response${colors.reset}`);

  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(heuristicWafGuard);

  app.post('/api/adversarial-target', (req, res) => res.json({ ok: true, data: req.body }));
  app.get('/api/adversarial-query', (req, res) => res.json({ ok: true, query: req.query }));

  const server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;

  try {
    // E2E-01: Double-encoded SQLi over HTTP POST with Tri-Fold assertions
    const attackerIp = '198.51.100.222';
    quarantineEngine.unquarantineIp(attackerIp);

    const httpRes = await sendHttpRequest({
      port,
      path: '/api/adversarial-target',
      method: 'POST',
      headers: {
        'host': 'brosangroup.com',
        'content-type': 'application/json',
        'x-forwarded-for': attackerIp,
        'user-agent': 'AdversarialChallenger/2.0'
      },
      body: JSON.stringify({
        comment: "test",
        filter: "%2527%2520UNION%2520SELECT%25201%252C2%252C3--"
      })
    });

    // 1. Assert HTTP Status 403 & Code
    assert.strictEqual(httpRes.status, 403, `Must return 403 (got ${httpRes.status})`);
    assert.strictEqual(httpRes.json.code, 'MALICIOUS_PAYLOAD_DETECTED');
    assert.strictEqual(httpRes.json.attackType, 'SQL_INJECTION');
    assert.strictEqual(httpRes.json.quarantined, true);
    assert.ok(httpRes.json.incidentId, 'Response must contain incidentId');

    // 2. Assert Headers
    assert.strictEqual(httpRes.headers['x-waf-protection'], 'BLOCKED');
    assert.strictEqual(httpRes.headers['x-waf-attack-type'], 'SQL_INJECTION');
    assert.strictEqual(httpRes.headers['x-quarantine-status'], 'ACTIVE');
    assert.strictEqual(httpRes.headers['retry-after'], '3600');

    // 3. Assert Quarantine Engine
    const qCheck = quarantineEngine.isQuarantined(attackerIp);
    assert.strictEqual(qCheck.quarantined, true);
    assert.strictEqual(qCheck.reason, 'WAF_SQL_INJECTION');

    // 4. Assert SIEM Audit Log
    const logs = auditLogger.getAuditLogs();
    const incidentLog = logs.reverse().find(l => l.eventType === 'MALICIOUS_PAYLOAD_DETECTED' && l.clientIp === attackerIp);
    assert.ok(incidentLog, "Audit log must contain incident entry");
    assert.strictEqual(incidentLog.severity, 'CRITICAL');
    assert.strictEqual(incidentLog.details.attackType, 'SQL_INJECTION');

    // 5. Assert Threat Alerter
    await new Promise(r => setTimeout(r, 20));
    const alerts = threatAlerter.getRecentAlerts(20);
    const incidentAlert = alerts.find(a => a.clientIp === attackerIp) ||
      (threatAlerter.queue && threatAlerter.queue.buffer && threatAlerter.queue.buffer.find(a => a && a.clientIp === attackerIp));
    assert.ok(incidentAlert, "Threat alerter must receive incident dispatch");

    // Cleanup
    quarantineEngine.unquarantineIp(attackerIp);
    recordResult('E2E-01', "Live Express HTTP 403 + Tri-Fold (Quarantine, SIEM, Alert) on Double-Encoded SQLi", true);

    // E2E-02: Prototype pollution via Raw Query String HTTP GET
    const protoIp = '198.51.100.223';
    quarantineEngine.unquarantineIp(protoIp);

    const protoRes = await sendHttpRequest({
      port,
      path: '/api/adversarial-query?__proto__[polluted]=true',
      method: 'GET',
      headers: {
        'host': 'brosangroup.com',
        'x-forwarded-for': protoIp
      }
    });

    assert.strictEqual(protoRes.status, 403, "Query string proto pollution must return 403");
    assert.strictEqual(protoRes.json.code, 'MALICIOUS_PAYLOAD_DETECTED');
    assert.strictEqual(protoRes.json.attackType, 'PROTOTYPE_POLLUTION');
    quarantineEngine.unquarantineIp(protoIp);
    recordResult('E2E-02', "Live Express HTTP GET __proto__[polluted] query blocked (403)", true);

    // E2E-03: Legitimate Turkish commercial transaction must pass with 200 OK
    const legitIp = '203.0.113.99';
    quarantineEngine.unquarantineIp(legitIp);

    const legitRes = await sendHttpRequest({
      port,
      path: '/api/adversarial-target',
      method: 'POST',
      headers: {
        'host': 'brosangroup.com',
        'content-type': 'application/json',
        'x-forwarded-for': legitIp
      },
      body: JSON.stringify({
        invoiceDescription: "1044145905 nolu fason dikiş faturası mahsubu: $10.335,35 USD (508.894,07 TL)",
        kdvRate: "%20 tevkifat 5/10",
        orderNotes: "Waiting for export documents.../customs clearance pending"
      })
    });

    assert.strictEqual(legitRes.status, 200, `Legitimate commercial request must return 200 (got ${legitRes.status})`);
    assert.strictEqual(legitRes.json.ok, true);
    const legitQ = quarantineEngine.isQuarantined(legitIp);
    assert.strictEqual(legitQ.quarantined, false, "Legitimate IP must never be quarantined");
    recordResult('E2E-03', "Legitimate Turkish Commercial + Ellipsis Request -> Clean 200 OK", true);

  } finally {
    server.close();
  }

  // ==============================================================================
  // SECTION 7: EMPIRICALLY CONFIRMED EVASION VECTORS & VULNERABILITY PROOFS
  // ==============================================================================
  console.log(`\n${colors.bold}[SECTION 7] Empirical Evasion Findings & Vulnerability Proofs${colors.reset}`);
  const evasionFindings = [];

  // EV-01: Dual comment splitting inside keywords (UN/**/ION/**/SELECT) evades WAF
  {
    const payload = "UN/**/ION/**/SELECT 1, 2, 3";
    const v = inspectPayload(payload);
    const evaded = (v === null);
    if (evaded) {
      evasionFindings.push({
        id: 'EV-01',
        severity: 'HIGH',
        category: 'SQL_INJECTION',
        title: 'Dual comment splitting evasion (intra-keyword + inter-keyword)',
        payload,
        evidence: 'inspectPayload returned null due to all-or-nothing comment collapsing in normalizeInspectStrings'
      });
      console.log(`  ${colors.yellow}⚠️ CONFIRMED EVASION${colors.reset} [EV-01] Dual comment splitting (UN/**/ION/**/SELECT) bypasses inspectPayload -> returns null`);
    }
  }

  // EV-02: PROTO_KEY_PATH_REGEX missing '[' in suffix group
  {
    const key = "prototype[polluted]";
    const detected = isPrototypePollutionKey(key);
    if (!detected) {
      evasionFindings.push({
        id: 'EV-02',
        severity: 'CRITICAL',
        category: 'PROTOTYPE_POLLUTION',
        title: 'Missing [ character in PROTO_KEY_PATH_REGEX suffix group',
        payload: key,
        evidence: 'isPrototypePollutionKey("prototype[polluted]") returns false because regex suffix (?:$|[.\\]]) rejects ['
      });
      console.log(`  ${colors.yellow}⚠️ CONFIRMED EVASION${colors.reset} [EV-02] isPrototypePollutionKey("prototype[polluted]") returns false`);
    }
  }

  // EV-03: Live HTTP evasion of prototype[polluted]=true under standard/simple query parsing
  {
    const simpleApp = express();
    simpleApp.set('query parser', 'simple');
    simpleApp.use(heuristicWafGuard);
    simpleApp.get('/api/test-simple', (req, res) => res.json({ ok: true, query: req.query }));
    const simpleServer = await new Promise(r => {
      const s = simpleApp.listen(0, '127.0.0.1', () => r(s));
    });
    const sPort = simpleServer.address().port;
    try {
      const liveRes = await sendHttpRequest({
        port: sPort,
        path: '/api/test-simple?prototype[polluted]=true',
        method: 'GET'
      });
      if (liveRes.status === 200) {
        evasionFindings.push({
          id: 'EV-03',
          severity: 'CRITICAL',
          category: 'PROTOTYPE_POLLUTION',
          title: 'Live HTTP prototype pollution evasion under standard/simple query parsing',
          payload: '/api/test-simple?prototype[polluted]=true',
          evidence: `HTTP returned status ${liveRes.status} OK instead of expected 403 MALICIOUS_PAYLOAD_DETECTED`
        });
        console.log(`  ${colors.yellow}⚠️ CONFIRMED EVASION${colors.reset} [EV-03] Live HTTP GET ?prototype[polluted]=true returned HTTP 200 OK (bypass confirmed)`);
      }
    } finally {
      simpleServer.close();
    }
  }

  // ==============================================================================
  // HARNESS SUMMARY
  // ==============================================================================
  console.log(`\n${colors.bold}${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}CHALLENGER HARNESS RESULT: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests / totalTests) * 100).toFixed(1)}%)${colors.reset}`);
  if (failedList.length > 0) {
    console.log(`${colors.red}${colors.bold}FAILURES (${failedList.length}):${colors.reset}`);
    failedList.forEach(f => console.log(`  - [${f.testId}] ${f.description}: ${f.error}`));
  }
  if (evasionFindings.length > 0) {
    console.log(`\n${colors.yellow}${colors.bold}CRITICAL ADVERSARIAL EVASIONS CONFIRMED (${evasionFindings.length}):${colors.reset}`);
    evasionFindings.forEach(e => {
      console.log(`  ${colors.yellow}[${e.id}] [${e.severity}] ${e.title}${colors.reset}`);
      console.log(`    Payload : ${e.payload}`);
      console.log(`    Evidence: ${e.evidence}`);
    });
  }
  console.log(`${colors.bold}${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  return { totalTests, passedTests, failedList, evasionFindings };
}

module.exports = { runChallengerEvasionSuite };

if (require.main === module) {
  runChallengerEvasionSuite()
    .then(result => {
      if (result.failedList.length > 0) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('Fatal error in challenger harness:', err);
      process.exit(1);
    });
}
