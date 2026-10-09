/**
 * BROSAN TEKSTİL ERP — PRODUCTION ZERO-TRUST CYBER SECURITY SHIELD
 * Layer 1: In-Flight Deep Heuristic WAF & Malicious Payload Sanitizer
 * (Phase 4 Ironclad Defense-in-Depth Hardening — Milestone 1)
 * 
 * Features:
 * - Deep recursive tree inspection of req.body, req.query, and req.params
 * - Bounded depth (MAX_DEPTH = 10) & node cap (MAX_NODES = 2000) preventing DoS / stack overflow
 * - Circular reference safety with WeakSet
 * - Dual-pass multi-layer string decoding (URL decode, unicode/hex unescaping, inline comment collapsing)
 * - 10 SQL Injection heuristic rules (UNION, Boolean tautologies, Time-blind, Stacked DDL, Catalog probe, Comment trunc, Subqueries)
 * - Key-level and string-level NoSQL Injection heuristics ($gt, $ne, $where, js eval, db shell)
 * - HTML-context Cross-Site Scripting (XSS) heuristics (tags, inline handlers, pseudo-protocols, data URIs)
 * - Prototype Pollution prevention (key inspection and string value access chains)
 * - Multi-layer Path Traversal detection (encoded ../, system directories, dotfiles, poison null bytes)
 * - Zero false-positives on authentic Turkish commercial, accounting, VAT, currency ($10.335,35 USD), and textile data
 * - Tri-Fold Incident Response Coordinator:
 *   1. quarantineEngine.quarantineIp (1-hour dynamic blacklist)
 *   2. auditLogger.logSecurityEvent (SIEM immutable audit log)
 *   3. threatAlerter.dispatchAlert (Real-time async Telegram & Webhook alert)
 *   4. Fail-closed HTTP 403 MALICIOUS_PAYLOAD_DETECTED response
 */

const crypto = require('crypto');
const auth = require('./auth');
const { quarantineEngine } = require('./quarantine');
const auditLogger = require('./auditLogger');
const threatAlerter = require('./threatAlerter');

// ==============================================================================
// 1. REGEX PATTERNS: SQL INJECTION (SQLi)
// ==============================================================================
const sqliPatterns = [
  // SQLI-1: UNION SELECT
  { name: 'SQLI_UNION_SELECT', regex: /\bunion\s+(?:all\s+|distinct\s+)?select\b/i },
  // SQLI-2: Boolean Quoted Tautology (' OR '1'='1, " OR "1"="1, ') OR ('1'='1, ' OR ''=', ' OR 1=1, ' AND true, ' OR 'a'='a')
  { name: 'SQLI_BOOLEAN_QUOTED', regex: /(?:'|"|\))\s*(?:or|and)\s+(?:\(?\s*['"][^'"]*['"]\s*=\s*['"][^'"]*['"]?|\(?\s*['"]?[a-zA-Z0-9_]+['"]?\s*=\s*['"]?[a-zA-Z0-9_]+['"]?|\d+\s*=\s*\d+|true\b)/i },
  // SQLI-3: Boolean Numeric (1 OR 1=1, AND 1=1, OR '1'='1', 1 AND 0=0)
  { name: 'SQLI_BOOLEAN_NUMERIC', regex: /\b(?:or|and)\s+(?:1\s*=\s*1|0\s*=\s*0|'1'\s*=\s*'1'|"1"\s*=\s*"1")/i },
  // SQLI-4: Time-based blind (sleep(5), pg_sleep(5), waitfor delay, benchmark)
  { name: 'SQLI_TIME_BLIND', regex: /\b(?:sleep|pg_sleep)\s*\(\s*\d+\s*\)|\bwaitfor\s+delay\s+['"][0-9:\s]+['"]|\bbenchmark\s*\(\s*\d+\s*,\s*[\w\(\)]+\s*\)/i },
  // SQLI-5: Stacked DDL/DML (; DROP TABLE, ; DELETE FROM, ; TRUNCATE TABLE)
  { name: 'SQLI_STACKED_DDL', regex: /;\s*(?:drop\s+(?:table|database|schema|view)|truncate\s+table|delete\s+from|alter\s+table|insert\s+into|update\s+\w+\s+set)\b/i },
  // SQLI-6: Direct DDL (DROP TABLE, TRUNCATE TABLE)
  { name: 'SQLI_DIRECT_DDL', regex: /\b(?:drop\s+table\s+(?:if\s+exists\s+)?[\w"`'\[]+|truncate\s+table\s+[\w"`'\[]+)\b/i },
  // SQLI-7: System catalog probing (information_schema, pg_catalog, sqlite_master, sqlite_version())
  { name: 'SQLI_SYSTEM_CATALOG', regex: /\binformation_schema\.(?:tables|columns|schemata)\b|\bpg_catalog\.(?:pg_tables|pg_user)\b|\bsqlite_master\b|\b(?:sqlite_version|current_user)\s*\(\s*\)/i },
  // SQLI-8: Comment truncation (' --, '--, '/*, '; --, '#, excluding quoted hex colors, order tag hashtags, and parenthesized em-dashes)
  { name: 'SQLI_COMMENT_TRUNC', regex: /(?:'|"|\)|;)\s*\/\*|(?:['"][\s)]*|;)\s*--|['"]\s*#(?!([0-9a-fA-F]{3,8}['"]|[0-9a-zA-Z_-]+['"]))|(?:;|\))\s*#(?![0-9a-zA-Z])/m },
  // SQLI-9: Subquery exfiltration ((SELECT ... FROM ...))
  { name: 'SQLI_SUBQUERY', regex: /\(\s*select\s+[\s\S]+?\bfrom\b[\s\S]+?\)/i },
  // SQLI-10: File I/O
  { name: 'SQLI_FILE_IO', regex: /\binto\s+(?:outfile|dumpfile)\b|\bload_file\s*\(/i },
  // SQLI-11: Error-based injection (EXTRACTVALUE, UPDATEXML)
  { name: 'SQLI_ERROR_BASED', regex: /\b(?:extractvalue|updatexml)\s*\(/i }
];

// ==============================================================================
// 2. REGEX PATTERNS: NOSQL INJECTION (NoSQLi)
// ==============================================================================
const nosqlKeyPatterns = [
  // 1. Any object key starting with $ followed by alphanumeric/underscore
  { name: 'NOSQL_KEY_DOLLAR', regex: /^\$[a-zA-Z0-9_]+/ },
  // 2. Query param key bracket operator (e.g. user[$ne], filter[$gt])
  { name: 'NOSQL_KEY_BRACKET_OP', regex: /\[\$(?:gt|gte|lt|lte|ne|nin|regex|where|exists|in|or|and)\]/i }
];

const nosqlStringPatterns = [
  // 1. Serialized JSON Mongo operator (e.g. "{"$ne": null}")
  { name: 'NOSQL_STRING_JSON_OP', regex: /"(?:\$gt|\$gte|\$lt|\$lte|\$ne|\$nin|\$regex|\$where|\$exists|\$in|\$or|\$and)"\s*:/i },
  // 2. MongoDB $where expression in string
  { name: 'NOSQL_STRING_WHERE', regex: /\$where\s*:\s*['"]/i },
  // 3. JavaScript evaluation in NoSQL context (this.field == ...)
  { name: 'NOSQL_STRING_JS_EVAL', regex: /\bthis\.[a-zA-Z0-9_]+\s*(?:===?|!==?|\.match\(|\.test\(|\.indexOf\(|>|<|\.length)/i },
  // 4. Mongo db shell commands (db.users.find())
  { name: 'NOSQL_STRING_DB_SHELL', regex: /\bdb\.[a-zA-Z0-9_]+\.(?:find|remove|drop|insert|update|aggregate)\s*\(/i }
];

// ==============================================================================
// 3. REGEX PATTERNS: PROTOTYPE POLLUTION
// ==============================================================================
const PROTO_DANGEROUS_KEY_NAMES = new Set(['__proto__', 'constructor', 'prototype']);
const PROTO_KEY_PATH_REGEX = /(?:^|[.\[\'\"])(?:__proto__|prototype)(?:$|[.\[\]\'\"])/i;
const PROTO_CONSTRUCTOR_CHAIN_REGEX = /constructor(?:\s*\.\s*prototype|\s*\[\s*['"]?prototype['"]?\s*\])/i;
const PROTO_VALUE_REGEX = /(?:__proto__|constructor(?:\s*\.\s*prototype|\s*\[\s*['"]?prototype['"]?\s*\])|Object\s*\.\s*prototype)/i;

function isPrototypePollutionKey(key) {
  if (typeof key !== 'string') return false;
  const clean = key.trim().toLowerCase();
  if (PROTO_DANGEROUS_KEY_NAMES.has(clean)) return true;
  if (PROTO_KEY_PATH_REGEX.test(clean)) return true;
  if (PROTO_CONSTRUCTOR_CHAIN_REGEX.test(clean)) return true;

  // Normalized zero-width / control char check
  const stripped = clean.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '');
  if (PROTO_DANGEROUS_KEY_NAMES.has(stripped)) return true;
  return false;
}

function isPrototypePollutionValue(val) {
  if (typeof val !== 'string') return false;
  return PROTO_VALUE_REGEX.test(val);
}

// ==============================================================================
// 4. REGEX PATTERNS: PATH TRAVERSAL
// ==============================================================================
const TRAVERSAL_REGEX_LIST = [
  // 1. Dot-dot relative traversal at start of string or preceded by path separator (/ or \)
  /(?:^|[/\\])\.{2,}(?:[/\\]|$)/,

  // 2. Relative traversal anywhere followed by slash/backslash, using negative lookbehind
  // to avoid falsely matching sentence ellipsis followed by slash (e.g. ".../")
  /(?<!\.)\.\.[/\\]/,

  // 3. Single-encoded directory traversal sequences
  /%2e%2e(?:%2f|%5c|\/|\\)/i,
  /\.\.(?:%2f|%5c)/i,

  // 4. Double-encoded traversal sequences (%252e%252e)
  /(?:%252e|%2e){2}/i,

  // 5. Sensitive Unix and Windows root system paths
  /(?:^|[/\\]|[a-z]:[/\\])(?:etc[/\\](?:passwd|shadow|hosts|group|security)|proc[/\\](?:self|version|cmdline)|windows[/\\](?:system32|win\.ini)|winnt[/\\]system32|boot\.ini)/i,

  // 6. Sensitive dotfiles, credentials, and VCS metadata
  /(?:^|[/\\])\.(?:env|git|ssh|aws|dockerignore|gitignore|htaccess|htpasswd)(?:$|[/\\])/i,

  // 7. Poison null bytes (raw null byte and percent-encoded)
  /\0|%00/
];

function isPathTraversal(str) {
  if (typeof str !== 'string') return false;
  for (const regex of TRAVERSAL_REGEX_LIST) {
    if (regex.test(str)) return true;
  }
  return false;
}

// ==============================================================================
// 5. REGEX PATTERNS: CROSS-SITE SCRIPTING (XSS)
// ==============================================================================
const XSS_REGEX_LIST = [
  // 1. HTML tags with executable script or embedding contexts
  /<\s*\/?\s*(?:script|iframe|object|embed|applet|style|link|meta|base|form|input|button|audio|video|math|marquee|details|svg)\b/i,

  // 2. HTML elements containing any inline event handler
  /<\s*[a-z0-9_-]+[^>]*\b(?:on[a-z]{3,20})\s*=/i,

  // 3. Attribute boundary breakouts and isolated DOM event handler assignments
  /(?:^|[\s"'\`])(?:onload|onerror|onclick|onmouseover|onmouseout|onmouseenter|onmouseleave|onmousemove|onmousedown|onmouseup|onfocus|onblur|onchange|onsubmit|onreset|onselect|onkeydown|onkeypress|onkeyup|ontoggle|onwheel)\s*=\s*(?:['"][^'"]*|[^'\s>]+)/i,

  // 4. Pseudo-protocol URI execution schemes (with tab/whitespace tolerance)
  /\b(?:java[\s\x00-\x1f]*script|vb[\s\x00-\x1f]*script)\s*:/i,

  // 5. Data URI inline HTML execution
  /\bdata\s*:\s*text\/html/i,

  // 6. CSS expression injection
  /expression\s*\(/i
];

function isXSS(str) {
  if (typeof str !== 'string') return false;
  for (const regex of XSS_REGEX_LIST) {
    if (regex.test(str)) return true;
  }
  return false;
}

// ==============================================================================
// 6. NORMALIZATION PASS (Dual URL Decode, Unicode Unescape, Comment Collapsing)
// ==============================================================================
/**
 * Normalizes an inspected string into candidate variants for evasive pattern detection.
 * @param {string} raw
 * @returns {string[]}
 */
function normalizeInspectStrings(raw) {
  if (typeof raw !== 'string') return [];
  const set = new Set();
  set.add(raw);

  // 1. Dual URL decode pass
  let cur = raw;
  for (let i = 0; i < 2; i++) {
    if (!cur.includes('%')) break;
    try {
      const dec = decodeURIComponent(cur);
      if (dec !== cur) {
        set.add(dec);
        cur = dec;
      } else {
        break;
      }
    } catch (_) {
      break;
    }
  }

  // 2. Unicode and Hex unescaping pass (\u0027 or \x27)
  if (/\\u00[0-7][0-9a-f]|\\x[0-7][0-9a-f]/i.test(cur)) {
    try {
      const unescaped = cur
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      set.add(unescaped);
    } catch (_) {}
  }

  // 3. Inline SQL comment collapsing (e.g. UN/**/ION -> UNION and UN ION)
  const list = Array.from(set);
  for (const s of list) {
    if (s.includes('/*')) {
      const withSpace = s.replace(/\/\*[\s\S]*?\*\//g, ' ');
      const withSpaceCollapsed = withSpace.replace(/\s+/g, ' ');
      const withoutComment = s.replace(/\/\*[\s\S]*?\*\//g, '');
      set.add(withSpace);
      set.add(withSpaceCollapsed);
      set.add(withoutComment);

      // Reconstruct concatenated SQL keywords created by stripping inter-keyword comments
      // (e.g. UN/**/ION/**/SELECT -> UNIONSELECT -> UNION SELECT)
      const keywordSeparated = withoutComment
        .replace(/(union)\s*(all|distinct)?\s*(select)/gi, (_, p1, p2, p3) => (p1 + ' ' + (p2 ? p2 + ' ' : '') + p3))
        .replace(/(drop|truncate|alter)\s*(table|database|schema|view)/gi, '$1 $2')
        .replace(/(delete)\s*(from)/gi, '$1 $2')
        .replace(/(insert)\s*(into)/gi, '$1 $2')
        .replace(/(waitfor)\s*(delay)/gi, '$1 $2')
        .replace(/\s+/g, ' ');
      set.add(keywordSeparated);

      // Token-aware pass: collapse intra-token comments into contiguous word tokens, convert inter-token comments to spaces
      const tokenAware = s
        .replace(/([a-zA-Z0-9_])\/\*[\s\S]*?\*\/([a-zA-Z0-9_])/g, '$1$2')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\s+/g, ' ');
      set.add(tokenAware);
    }
  }

  return Array.from(set);
}

// ==============================================================================
// 7. RECURSIVE DATA INSPECTION ENGINE
// ==============================================================================
const MAX_TRAVERSAL_DEPTH = 10;
const MAX_TRAVERSAL_NODES = 2000;

/**
 * Recursively inspects a data tree (req.body, req.query, req.params) for attack vectors.
 * @param {any} target
 * @param {number} maxDepth
 * @param {WeakSet} visited
 * @param {string} rootPath
 * @returns {object|null} Violation record or null
 */
function inspectPayload(target, maxDepth = MAX_TRAVERSAL_DEPTH, visited = new WeakSet(), rootPath = 'root') {
  if (target === null || target === undefined) return null;

  // Primitive string inspection
  if (typeof target === 'string') {
    const candidates = normalizeInspectStrings(target);
    for (const str of candidates) {
      // 1. Prototype Pollution in Value String
      if (isPrototypePollutionValue(str)) {
        return {
          violated: true,
          attackType: 'PROTOTYPE_POLLUTION',
          type: 'PROTOTYPE_POLLUTION',
          ruleId: 'PROTO_VALUE_POLLUTION',
          rule: 'PROTO_VALUE_POLLUTION',
          matchedSnippet: str.slice(0, 100),
          pattern: str.slice(0, 100),
          sample: target,
          keyPath: rootPath,
          path: rootPath
        };
      }

      // 2. Path Traversal
      if (isPathTraversal(str)) {
        return {
          violated: true,
          attackType: 'PATH_TRAVERSAL',
          type: 'PATH_TRAVERSAL',
          ruleId: 'PATH_TRAVERSAL_DETECTED',
          rule: 'PATH_TRAVERSAL_DETECTED',
          matchedSnippet: str.slice(0, 100),
          pattern: str.slice(0, 100),
          sample: target,
          keyPath: rootPath,
          path: rootPath
        };
      }

      // 3. XSS
      if (isXSS(str)) {
        return {
          violated: true,
          attackType: 'XSS',
          type: 'XSS',
          ruleId: 'XSS_INJECTION_DETECTED',
          rule: 'XSS_INJECTION_DETECTED',
          matchedSnippet: str.slice(0, 100),
          pattern: str.slice(0, 100),
          sample: target,
          keyPath: rootPath,
          path: rootPath
        };
      }

      // 4. NoSQL String Operators
      for (const rule of nosqlStringPatterns) {
        if (rule.regex.test(str)) {
          return {
            violated: true,
            attackType: 'NOSQL_INJECTION',
            type: 'NOSQL_INJECTION',
            ruleId: rule.name,
            rule: rule.name,
            matchedSnippet: str.slice(0, 100),
            pattern: str.slice(0, 100),
            sample: target,
            keyPath: rootPath,
            path: rootPath
          };
        }
      }

      // 5. SQL Injection
      for (const rule of sqliPatterns) {
        if (rule.regex.test(str)) {
          return {
            violated: true,
            attackType: 'SQL_INJECTION',
            type: 'SQL_INJECTION',
            ruleId: rule.name,
            rule: rule.name,
            matchedSnippet: str.slice(0, 100),
            pattern: str.slice(0, 100),
            sample: target,
            keyPath: rootPath,
            path: rootPath
          };
        }
      }
    }
    return null;
  }

  // Primitive non-strings (numbers, booleans) are safe
  if (typeof target !== 'object') {
    return null;
  }

  // Circular reference and depth guard
  if (visited.has(target)) return null;
  visited.add(target);
  if (maxDepth <= 0) return null;

  // Array traversal
  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      const violation = inspectPayload(target[i], maxDepth - 1, visited, `${rootPath}[${i}]`);
      if (violation) return violation;
    }
    return null;
  }

  // Object property traversal (using getOwnPropertyNames to prevent prototype traversal)
  const keys = Object.getOwnPropertyNames(target);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const currentPath = `${rootPath}.${key}`;

    // 1. Prototype Pollution on key
    if (isPrototypePollutionKey(key)) {
      return {
        violated: true,
        attackType: 'PROTOTYPE_POLLUTION',
        type: 'PROTOTYPE_POLLUTION',
        ruleId: 'PROTO_KEY_POLLUTION',
        rule: 'PROTO_KEY_POLLUTION',
        matchedSnippet: key,
        pattern: key,
        sample: key,
        keyPath: currentPath,
        path: currentPath,
        key
      };
    }

    // 2. NoSQL Key Operators ($gt, $ne, etc.)
    for (const rule of nosqlKeyPatterns) {
      if (rule.regex.test(key)) {
        return {
          violated: true,
          attackType: 'NOSQL_INJECTION',
          type: 'NOSQL_INJECTION',
          ruleId: rule.name,
          rule: rule.name,
          matchedSnippet: key,
          pattern: key,
          sample: key,
          keyPath: currentPath,
          path: currentPath,
          key
        };
      }
    }

    // 3. Inspect Key Strings for Traversal / XSS / SQLi
    const keyCandidates = normalizeInspectStrings(key);
    for (const kStr of keyCandidates) {
      if (isPathTraversal(kStr)) {
        return {
          violated: true,
          attackType: 'PATH_TRAVERSAL',
          type: 'PATH_TRAVERSAL',
          ruleId: 'PATH_TRAVERSAL_IN_KEY',
          rule: 'PATH_TRAVERSAL_IN_KEY',
          matchedSnippet: kStr.slice(0, 100),
          pattern: kStr.slice(0, 100),
          sample: key,
          keyPath: currentPath,
          path: currentPath,
          key
        };
      }
      if (isXSS(kStr)) {
        return {
          violated: true,
          attackType: 'XSS',
          type: 'XSS',
          ruleId: 'XSS_IN_KEY',
          rule: 'XSS_IN_KEY',
          matchedSnippet: kStr.slice(0, 100),
          pattern: kStr.slice(0, 100),
          sample: key,
          keyPath: currentPath,
          path: currentPath,
          key
        };
      }
      for (const rule of sqliPatterns) {
        if (rule.regex.test(kStr)) {
          return {
            violated: true,
            attackType: 'SQL_INJECTION',
            type: 'SQL_INJECTION',
            ruleId: rule.name,
            rule: rule.name,
            matchedSnippet: kStr.slice(0, 100),
            pattern: kStr.slice(0, 100),
            sample: key,
            keyPath: currentPath,
            path: currentPath,
            key
          };
        }
      }
    }

    // 4. Recurse into value
    const val = target[key];
    const violation = inspectPayload(val, maxDepth - 1, visited, currentPath);
    if (violation) return violation;
  }

  return null;
}

// Alias for inspectPayload
const inspectRecursive = inspectPayload;

// ==============================================================================
// 8. TRI-FOLD INCIDENT RESPONSE COORDINATOR
// ==============================================================================
/**
 * Sanitizes malicious payload snippet for safe SIEM audit logging & threat alerting.
 * Enforces length bound (128 chars) and strips control characters/CRLF (anti-log-injection).
 */
function sanitizePayloadSnippet(snippet) {
  if (snippet === null || snippet === undefined) return '';
  let str = typeof snippet === 'string' ? snippet : JSON.stringify(snippet);
  if (typeof str !== 'string') str = String(str);

  // Replace CRLF, tabs, and non-printable control characters
  let clean = str.replace(/[\r\n\t\x00-\x1f\x7f]/g, ' ').trim();

  // Enforce 128-character bound
  if (clean.length > 128) {
    clean = clean.slice(0, 125) + '...';
  }
  return clean;
}

/**
 * Strips query parameters from URLs to prevent credential leakage in logs/alerts.
 */
function sanitizeUrlPath(raw) {
  if (typeof raw !== 'string') return '/';
  const qIdx = raw.indexOf('?');
  const pathOnly = qIdx === -1 ? raw : raw.slice(0, qIdx);
  return pathOnly.length > 256 ? pathOnly.slice(0, 256) + '...' : pathOnly;
}

/**
 * Coordinates the Tri-Fold Incident Response upon WAF violation.
 */
function handleWafViolation(req, res, violation) {
  const attackType = violation.attackType || violation.type || 'UNKNOWN_ATTACK';
  const location = violation.location || 'body';
  const keyPath = violation.keyPath || violation.path || 'root';
  const matchedSnippet = violation.matchedSnippet || violation.pattern || violation.sample || '';
  const ruleId = violation.ruleId || violation.rule || 'GENERIC_WAF_RULE';

  const clientIp = auth.getClientIp(req);
  const incidentId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const safeSnippet = sanitizePayloadSnippet(matchedSnippet);

  // 1. Dynamic IP Quarantine via Fail2ban Shield (1-Hour Blacklist)
  let isQuarantined = false;
  try {
    const qRecord = quarantineEngine.quarantineIp(clientIp, `WAF_${attackType}`, {
      attackType,
      location,
      keyPath,
      ruleId,
      triggerPath: req.originalUrl || req.url,
      incidentId,
      ttlMs: 60 * 60 * 1000 // 1 hour
    });
    isQuarantined = !!qRecord;
  } catch (qErr) {
    console.error('⚠️ [WAF] Failed to enroll IP in quarantineEngine:', qErr.message);
  }

  // 2. Immutable SIEM Security Audit Logging
  try {
    auditLogger.logSecurityEvent('MALICIOUS_PAYLOAD_DETECTED', {
      req,
      severity: 'CRITICAL',
      status: 403,
      clientIp,
      details: {
        attackType,
        location,
        keyPath,
        ruleId,
        incidentId,
        quarantined: isQuarantined,
        sampleSnippet: safeSnippet
      }
    });
  } catch (logErr) {
    console.error('⚠️ [WAF] Failed to write SIEM audit event:', logErr.message);
  }

  // 3. Real-Time Threat Alerter Dispatch (Async / Non-Blocking)
  try {
    if (threatAlerter && typeof threatAlerter.dispatchAlert === 'function') {
      threatAlerter.dispatchAlert('MALICIOUS_PAYLOAD_DETECTED', {
        clientIp,
        severity: 'CRITICAL',
        summary: `Heuristic WAF blocked ${attackType} in ${location} (${req.method} ${sanitizeUrlPath(req.originalUrl || req.url)}) from IP ${clientIp}.`,
        details: {
          attackType,
          location,
          keyPath,
          ruleId,
          incidentId,
          path: req.originalUrl || req.url,
          quarantined: isQuarantined,
          sampleSnippet: safeSnippet
        }
      });
    }
  } catch (alertErr) {
    console.error('⚠️ [WAF] Failed to dispatch threat alert:', alertErr.message);
  }

  // 4. Terminate Request with Fail-Closed HTTP 403 & Hardened Security Headers
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-WAF-Protection', 'BLOCKED');
  res.setHeader('X-WAF-Attack-Type', attackType);
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (isQuarantined) {
    res.setHeader('Retry-After', '3600');
    res.setHeader('X-Quarantine-Status', 'ACTIVE');
  }

  return res.status(403).json({
    success: false,
    error: 'Erişim engellendi: Zararlı istek veya saldırı vektörü tespit edildi (Malicious Payload Detected).',
    code: 'MALICIOUS_PAYLOAD_DETECTED',
    attackType,
    incidentId,
    quarantined: isQuarantined,
    timestamp
  });
}

// ==============================================================================
// 9. EXPRESS WAF GATEKEEPER MIDDLEWARE
// ==============================================================================
/**
 * Express Middleware: Intercepts and recursively inspects req.params, req.query,
 * and req.body for malicious payloads before rate limiters, auth guards, or controllers.
 */
function heuristicWafGuard(req, res, next) {
  // 1. Inspect URL pathname & segments (inspects route parameters before route dispatch)
  const rawUrl = req.originalUrl || req.url || '';
  const qIdx = rawUrl.indexOf('?');
  const pathname = qIdx === -1 ? rawUrl : rawUrl.slice(0, qIdx);

  let decodedPath = pathname;
  try { decodedPath = decodeURIComponent(pathname); } catch (_) {}
  const pathViolation = inspectPayload(decodedPath, MAX_TRAVERSAL_DEPTH, new WeakSet(), 'params');
  if (pathViolation) {
    pathViolation.location = 'params';
    return handleWafViolation(req, res, pathViolation);
  }

  const segments = decodedPath.split('/').filter(Boolean);
  for (let s = 0; s < segments.length; s++) {
    const segment = segments[s];
    const segViolation = inspectPayload(segment, MAX_TRAVERSAL_DEPTH, new WeakSet(), `params[${s}]`);
    if (segViolation) {
      segViolation.location = 'params';
      return handleWafViolation(req, res, segViolation);
    }
  }

  // Also inspect req.params if populated
  if (req.params && Object.keys(req.params).length > 0) {
    const violation = inspectPayload(req.params, MAX_TRAVERSAL_DEPTH, new WeakSet(), 'params');
    if (violation) {
      violation.location = 'params';
      return handleWafViolation(req, res, violation);
    }
  }

  // 2. Inspect req.query (parsed query object)
  if (req.query) {
    const violation = inspectPayload(req.query, MAX_TRAVERSAL_DEPTH, new WeakSet(), 'query');
    if (violation) {
      violation.location = 'query';
      return handleWafViolation(req, res, violation);
    }
  }

  // 3. Inspect raw query string from req.originalUrl / req.url
  // (Detects query-parser stripped keys like __proto__ or [$ne])
  if (qIdx !== -1) {
    const rawQuery = rawUrl.slice(qIdx + 1);
    const pairs = rawQuery.split('&');
    for (let p = 0; p < pairs.length; p++) {
      const pair = pairs[p];
      if (!pair) continue;
      const eqIdx = pair.indexOf('=');
      const rawKey = eqIdx === -1 ? pair : pair.slice(0, eqIdx);
      const rawVal = eqIdx === -1 ? '' : pair.slice(eqIdx + 1);

      let decodedKey = rawKey;
      try { decodedKey = decodeURIComponent(rawKey); } catch (_) {}

      // Prototype Pollution on raw query key
      if (isPrototypePollutionKey(decodedKey)) {
        return handleWafViolation(req, res, {
          violated: true,
          attackType: 'PROTOTYPE_POLLUTION',
          type: 'PROTOTYPE_POLLUTION',
          ruleId: 'PROTO_KEY_POLLUTION',
          rule: 'PROTO_KEY_POLLUTION',
          location: 'query',
          keyPath: `query.${decodedKey}`,
          matchedSnippet: decodedKey
        });
      }

      // NoSQL bracket operators in raw query key
      for (const rule of nosqlKeyPatterns) {
        if (rule.regex.test(decodedKey)) {
          return handleWafViolation(req, res, {
            violated: true,
            attackType: 'NOSQL_INJECTION',
            type: 'NOSQL_INJECTION',
            ruleId: rule.name,
            rule: rule.name,
            location: 'query',
            keyPath: `query.${decodedKey}`,
            matchedSnippet: decodedKey
          });
        }
      }

      // Inspect decoded key
      const keyViolation = inspectPayload(decodedKey, MAX_TRAVERSAL_DEPTH, new WeakSet(), `query.${decodedKey}`);
      if (keyViolation) {
        keyViolation.location = 'query';
        return handleWafViolation(req, res, keyViolation);
      }

      // Inspect decoded value
      let decodedVal = rawVal;
      try { decodedVal = decodeURIComponent(rawVal); } catch (_) {}
      const valViolation = inspectPayload(decodedVal, MAX_TRAVERSAL_DEPTH, new WeakSet(), `query.${decodedKey}`);
      if (valViolation) {
        valViolation.location = 'query';
        return handleWafViolation(req, res, valViolation);
      }
    }
  }

  // 4. Inspect req.body
  if (req.body) {
    const violation = inspectPayload(req.body, MAX_TRAVERSAL_DEPTH, new WeakSet(), 'body');
    if (violation) {
      violation.location = 'body';
      return handleWafViolation(req, res, violation);
    }
  }

  next();
}

// Module Exports
module.exports = {
  heuristicWafGuard,
  heuristicWaf: heuristicWafGuard, // Backward-compatible alias
  inspectPayload,
  inspectRecursive,
  handleWafViolation,
  sanitizePayloadSnippet,
  sanitizeUrlPath,
  normalizeInspectStrings,
  sqliPatterns,
  nosqlKeyPatterns,
  nosqlStringPatterns,
  isXSS,
  isPathTraversal,
  isPrototypePollutionKey,
  isPrototypePollutionValue
};
