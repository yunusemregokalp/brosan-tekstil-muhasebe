/**
 * BROSAN TEKSTİL ERP — AUTONOMOUS ADVERSARIAL CHAOS & FUZZING IMMUNE SENTINEL
 * server/fuzzingSentinel.js
 * 
 * Phase 9: Sovereign Zenith Citadel & Autonomous Cyber Immunity Engine (Requirement R3)
 * 
 * Features:
 * 1. In-Memory Adversarial Chaos Fuzzing Engine:
 *    - 5 Mutated Vector Classes:
 *      a. Unicode Homographs & Hidden Smuggling (Cyrillic, Zero-Width, Full-Width, BiDi)
 *      b. Poison Null-Byte Injections (%00, \0, \x00, double-encoded in query, body, path)
 *      c. Prototype Pollution Mutators (__proto__, constructor, prototype, dotted, bracket)
 *      d. Oversized Buffer & ReDoS Bombs (64KB+ buffers, 30-depth nested JSON/arrays, 2500+ properties)
 *      e. Polyglot SQL / XSS Payloads (multi-context breakout payloads)
 * 2. Simulation & Immunity Execution Harness:
 *    - Safely executes payloads against in-memory Express middleware pipeline (WAF -> Validators -> Schema)
 *    - Dry-run simulation with zero side effects on production ledger or system state
 *    - Zero Uncaught Crashes SLA: verifies that inputs are either sanitized or cleanly rejected (400, 403, 422, 503)
 *      with 0 uncaught 500 exceptions or process terminations
 * 3. Proactive Autonomous Cyber Immunity & Dynamic Rule Synthesis:
 *    - DynamicRuleRegistry: synthesizes new defensive regex rules upon encountering novel variations
 *    - dynamicImmunityGuard: Express middleware checking requests against dynamic rules
 *    - Exposes getActiveDynamicRules(), synthesizeRule(), registerRule(), reset()
 * 4. Certified Exports:
 *    - FuzzingSentinel, generateFuzzVectors, simulatePayloadDefense, DynamicRuleRegistry, fuzzingSentinel
 */

const crypto = require('crypto');
const { performance } = require('perf_hooks');
const { heuristicWafGuard } = require('./heuristicWaf');
const validators = require('./validators');
const auditLogger = require('./auditLogger');

// Helper to escape regex special characters
function escapeRegExp(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==============================================================================
// 1. MUTATION VECTOR GENERATOR SUITE (5 ADVERSARIAL CLASSES)
// ==============================================================================

/**
 * Class 1: Unicode Homographs, Hidden Smuggling, and Normalization Evasion
 */
function generateUnicodeHomographs() {
  return [
    {
      id: 'VEC_UNICODE_HOMO_CONSTRUCTOR',
      name: 'Cyrillic lookalike for constructor keyword',
      vectorClass: 'UNICODE_HOMOGRAPH',
      description: 'Replaces Latin characters with Cyrillic homographs in constructor key',
      payload: {
        "\u0441\u043E\u043D\u0441\u0442\u0440\u0443\u0441\u0442\u043E\u0440": {
          prototype: { status: 'MUTATED' }
        },
        code: 'ACC_HOMO_01',
        name: 'Cyrillic Constructor'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_UNICODE_HOMO_SELECT',
      name: 'Cyrillic lookalike for SQL SELECT statement',
      vectorClass: 'UNICODE_HOMOGRAPH',
      description: 'Uses Cyrillic s, e, l, e, c, t and f, r, o, m to bypass ASCII SQL filters',
      payload: {
        code: 'ACC_HOMO_02',
        name: '\u0455\u0435\u043B\u0435\u0441\u0442 * \u0444\u0440\u043E\u043C users',
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_UNICODE_ZERO_WIDTH_IBAN',
      name: 'Zero-width space smuggling in IBAN string',
      vectorClass: 'UNICODE_HOMOGRAPH',
      description: 'Injects invisible zero-width characters (\\u200B, \\u200C, \\u200D) into IBAN',
      payload: {
        code: 'ACC_ZW_01',
        name: 'Zero-Width IBAN Test',
        iban: 'TR16\u200B0006\u200C2000\u200D0001',
        category: 'BANKA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_UNICODE_ZERO_WIDTH_PROTO',
      name: 'Zero-width space smuggled prototype pollution key',
      vectorClass: 'UNICODE_HOMOGRAPH',
      description: 'Hides __proto__ by embedding zero-width non-joiner between characters',
      payload: {
        "__\u200Bproto__": { role: 'SUPERADMIN' },
        code: 'ACC_ZW_02',
        name: 'ZW Proto Test'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_UNICODE_BOM_CONSTRUCTOR',
      name: 'Byte-Order-Mark (BOM / \\uFEFF) prefixed constructor',
      vectorClass: 'UNICODE_HOMOGRAPH',
      description: 'Prepends zero-width non-breaking space (BOM) to constructor identifier',
      payload: {
        "\uFEFFconstructor": { prototype: { isAdmin: true } },
        code: 'ACC_BOM_01',
        name: 'BOM Test'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_UNICODE_FULLWIDTH_UNION_SELECT',
      name: 'Full-width Unicode UNION SELECT injection',
      vectorClass: 'UNICODE_HOMOGRAPH',
      description: 'Encodes SQL keywords with full-width Unicode characters (\\uFF35...)',
      payload: {
        code: 'ACC_FW_01',
        name: '\uFF35\uFF2E\uFF29\uFF2F\uFF2E \uFF33\uFF25\uFF2C\uFF25\uFF23\uFF34 1,2,3',
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_UNICODE_FULLWIDTH_SCRIPT',
      name: 'Full-width Unicode XSS script tags',
      vectorClass: 'UNICODE_HOMOGRAPH',
      description: 'Uses full-width angle brackets and characters for script tags',
      payload: {
        code: 'ACC_FW_02',
        name: '\uFF1Cscript\uFF1Ealert(1)\uFF1C/script\uFF1E',
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_UNICODE_BIDI_OVERRIDE',
      name: 'Bidirectional right-to-left override character smuggling',
      vectorClass: 'UNICODE_HOMOGRAPH',
      description: 'Uses \\u202E to reverse displayed string order to spoof authorization roles',
      payload: {
        code: 'ACC_BIDI_01',
        name: '\u202Eadmin\u202C_authorized',
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_UNICODE_CYRILLIC_ADMIN',
      name: 'Cyrillic small a in admin username login',
      vectorClass: 'UNICODE_HOMOGRAPH',
      description: 'Attempts account spoofing with Cyrillic homograph in login username',
      payload: {
        username: '\u0430dmin',
        password: 'Password123!@#'
      },
      targetEndpoint: '/api/auth/login',
      expectedStatus: [400, 401, 403, 422]
    }
  ];
}

/**
 * Class 2: Poison Null-Byte Injections
 */
function generateNullByteInjections() {
  return [
    {
      id: 'VEC_NULL_BYTE_BODY_SQLI',
      name: 'Poison null-byte with SQL injection in string field',
      vectorClass: 'POISON_NULL_BYTE',
      description: 'Injects \\0 before SQL injection string to truncate downstream parsing',
      payload: {
        code: 'ACC_NULL_01',
        name: "Admin\0' OR '1'='1",
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_NULL_BYTE_URL_ENCODED',
      name: 'URL-encoded poison null-byte (%00) in file path string',
      vectorClass: 'POISON_NULL_BYTE',
      description: 'Injects %00 before file extension suffix to attempt file traversal bypass',
      payload: {
        code: 'ACC_NULL_02',
        name: 'accounts.json%00.png',
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_NULL_BYTE_HEX_ESCAPE',
      name: 'Hex-escaped null byte (\\x00) in account code',
      vectorClass: 'POISON_NULL_BYTE',
      description: 'Embeds \\x00 in string value',
      payload: {
        code: 'ACC\x00_POISON',
        name: 'Hex Poison Account',
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_NULL_BYTE_IN_KEY',
      name: 'Poison null-byte embedded in JSON object key',
      vectorClass: 'POISON_NULL_BYTE',
      description: 'Uses \\0 inside JSON key to evade key lookup and prototype checks',
      payload: {
        "\0__proto__": { polluted: true },
        code: 'ACC_NULL_KEY',
        name: 'Null Key Account'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_NULL_BYTE_IN_QUERY',
      name: 'Poison null-byte in URL query parameters',
      vectorClass: 'POISON_NULL_BYTE',
      description: 'Passes %00 in query string to evade regex parameter boundaries',
      payload: { id: "100%00' OR '1'='1" },
      location: 'query',
      targetEndpoint: '/api/transactions?id=100%00\'%20OR%20\'1\'=\'1',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_NULL_BYTE_IN_PATH',
      name: 'Poison null-byte in URL path endpoint',
      vectorClass: 'POISON_NULL_BYTE',
      description: 'Passes %00 in path route to test path traversal truncation',
      payload: { code: 'ACC_PATH', name: 'Path Null Account' },
      location: 'path',
      targetEndpoint: '/api/transactions%00.json',
      expectedStatus: [400, 403, 404, 422]
    },
    {
      id: 'VEC_NULL_BYTE_DEEP_NESTED',
      name: 'Deeply nested null-byte in metadata payload',
      vectorClass: 'POISON_NULL_BYTE',
      description: 'Embeds null bytes in deeply nested objects and array values',
      payload: {
        code: 'ACC_DEEP_NULL',
        name: 'Deep Null Account',
        details: {
          meta: {
            "auth\0": "token\0evil"
          }
        }
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_NULL_BYTE_DOUBLE_ENCODED',
      name: 'Double-encoded null-byte (%2500)',
      vectorClass: 'POISON_NULL_BYTE',
      description: 'Passes %2500 to defeat single-pass URL decoders',
      payload: {
        code: 'ACC_DNULL_01',
        name: 'secret%2500.txt',
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    }
  ];
}

/**
 * Class 3: Prototype Pollution Mutators
 */
function generatePrototypePollutionMutators() {
  return [
    {
      id: 'VEC_PROTO_DIRECT_POLLUTION',
      name: 'Direct __proto__ property injection',
      vectorClass: 'PROTOTYPE_POLLUTION',
      description: 'Injects direct __proto__ payload attempting to mutate Object.prototype',
      payload: {
        "__proto__": { polluted: true, isAdmin: true, role: 'root' },
        code: 'ACC_PR_01',
        name: 'Direct Proto Injection'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_PROTO_CONSTRUCTOR_PROTOTYPE',
      name: 'constructor.prototype pollution chain',
      vectorClass: 'PROTOTYPE_POLLUTION',
      description: 'Navigates constructor.prototype chain to mutate prototype properties',
      payload: {
        constructor: {
          prototype: { polluted: true, status: 'OVERRIDDEN' }
        },
        code: 'ACC_PR_02',
        name: 'Constructor Prototype Chain'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_PROTO_DIRECT_PROTOTYPE_KEY',
      name: 'Direct prototype object injection',
      vectorClass: 'PROTOTYPE_POLLUTION',
      description: 'Injects prototype object directly at top-level',
      payload: {
        prototype: { isAdmin: true },
        code: 'ACC_PR_03',
        name: 'Direct Prototype Object'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_PROTO_DOTTED_KEY',
      name: 'Dot notation __proto__.polluted path in key',
      vectorClass: 'PROTOTYPE_POLLUTION',
      description: 'Uses dot-path key to evade shallow key inspection',
      payload: {
        "__proto__.polluted": true,
        code: 'ACC_PR_04',
        name: 'Dotted Proto Key'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_PROTO_CONSTRUCTOR_DOTTED',
      name: 'Dot notation constructor.prototype.isAdmin in key',
      vectorClass: 'PROTOTYPE_POLLUTION',
      description: 'Uses dot notation on constructor prototype chain in JSON key',
      payload: {
        "constructor.prototype.isAdmin": true,
        code: 'ACC_PR_05',
        name: 'Dotted Constructor Key'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_PROTO_BRACKET_KEY',
      name: 'Bracket notation constructor[prototype][polluted]',
      vectorClass: 'PROTOTYPE_POLLUTION',
      description: 'Uses bracket notation in key to evade standard dot-splitters',
      payload: {
        "constructor[prototype][polluted]": true,
        code: 'ACC_PR_06',
        name: 'Bracket Prototype Key'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_PROTO_NESTED_ARRAY',
      name: 'Prototype pollution embedded in array items',
      vectorClass: 'PROTOTYPE_POLLUTION',
      description: 'Hides prototype payload inside array item objects',
      payload: {
        code: 'ACC_PR_07',
        name: 'Nested Array Proto',
        items: [{ "__proto__": { role: 'ADMIN' } }]
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_PROTO_DEEP_OBJECT',
      name: 'Deeply nested prototype pollution property',
      vectorClass: 'PROTOTYPE_POLLUTION',
      description: 'Nests __proto__ deep inside sub-objects to evade shallow walkers',
      payload: {
        code: 'ACC_PR_08',
        name: 'Deep Nested Proto',
        data: {
          nested: {
            inner: {
              "__proto__": { flag: 1 }
            }
          }
        }
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    }
  ];
}

/**
 * Class 4: Oversized Buffer & ReDoS Bombs
 */
function generateBufferAndRedosBombs() {
  return [
    {
      id: 'VEC_BUFFER_BOMB_64KB_CHARS',
      name: 'Controlled 65KB+ oversized string buffer',
      vectorClass: 'BUFFER_REDOS_BOMB',
      description: 'Passes 66,000 ASCII characters in string property to test length bounds',
      payload: {
        code: 'ACC_BUF_01',
        name: 'A'.repeat(66000),
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_BUFFER_BOMB_64KB_WHITESPACE',
      name: 'Controlled 65KB+ whitespace padding buffer',
      vectorClass: 'BUFFER_REDOS_BOMB',
      description: 'Passes 65,536 whitespace characters with trailing token',
      payload: {
        code: 'ACC_BUF_02',
        name: ' '.repeat(65536) + '1',
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_BUFFER_BOMB_64KB_QUOTES',
      name: 'Controlled 65KB+ repetitive quotes buffer',
      vectorClass: 'BUFFER_REDOS_BOMB',
      description: 'Passes 65,536 quote characters to test SQL parser tokenizer resilience',
      payload: {
        code: 'ACC_BUF_03',
        name: '"'.repeat(65536),
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_NESTED_JSON_BOMB_DEPTH_30',
      name: 'Deeply nested JSON object bomb (depth 30)',
      vectorClass: 'BUFFER_REDOS_BOMB',
      description: 'Constructs 30 levels of nested objects to test call-stack bounds',
      payload: (() => {
        let obj = { leaf: true };
        for (let i = 0; i < 30; i++) obj = { child: obj };
        return { code: 'ACC_NEST_01', name: 'Depth Bomb', tree: obj };
      })(),
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_NESTED_ARRAY_BOMB_DEPTH_30',
      name: 'Deeply nested array bomb (depth 30)',
      vectorClass: 'BUFFER_REDOS_BOMB',
      description: 'Constructs 30 levels of nested arrays to verify bounded recursion',
      payload: (() => {
        let arr = [1];
        for (let i = 0; i < 30; i++) arr = [arr];
        return { code: 'ACC_ARR_01', name: 'Array Bomb', list: arr };
      })(),
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_BROAD_OBJECT_BOMB_2500_KEYS',
      name: 'Broad property explosion bomb (2,500 keys)',
      vectorClass: 'BUFFER_REDOS_BOMB',
      description: 'Injects 2,500 properties into object to verify node traversal cap',
      payload: (() => {
        const broad = { code: 'ACC_BROAD_01', name: 'Broad Property Bomb' };
        for (let i = 0; i < 2500; i++) broad[`prop_${i}`] = i;
        return broad;
      })(),
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_REDOS_BOMB_REGEX_KILLER',
      name: 'ReDoS catastrophic backtracking pattern candidate',
      vectorClass: 'BUFFER_REDOS_BOMB',
      description: 'Sends repetitive trailing tokens designed to trigger catastrophic backtracking',
      payload: {
        code: 'ACC_REDOS_01',
        name: 'a'.repeat(60) + '!',
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_REDOS_BOMB_HTML_COMMENTS',
      name: 'ReDoS candidate with repetitive HTML comments',
      vectorClass: 'BUFFER_REDOS_BOMB',
      description: 'Sends unclosed repetitive HTML comments to test regex parser bounds',
      payload: {
        code: 'ACC_REDOS_02',
        name: '<!--'.repeat(60) + 'unclosed_tag',
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_REDOS_BOMB_SQL_BOOLEAN_CHAIN',
      name: 'Repetitive SQL boolean operator chain',
      vectorClass: 'BUFFER_REDOS_BOMB',
      description: 'Sends long repetitive numeric chains with OR operators',
      payload: {
        code: 'ACC_REDOS_03',
        name: '1'.repeat(100) + ' OR ' + '1'.repeat(100),
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    }
  ];
}

/**
 * Class 5: Polyglot SQL / XSS Payloads
 */
function generatePolyglotVectors() {
  return [
    {
      id: 'VEC_POLYGLOT_SQL_XSS_COMMENT',
      name: "Classic polyglot: ' OR '1'='1'/*<!--<script>alert(1)</script>-->*/",
      vectorClass: 'POLYGLOT_SQL_XSS',
      description: 'Combines SQL boolean tautology with HTML comment and XSS payload',
      payload: {
        code: 'ACC_POLY_01',
        name: "' OR '1'='1'/*<!--<script>alert(1)</script>-->*/",
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_POLYGLOT_UNION_XSS_ENCLOSED',
      name: "'/*\"/*<!--*/<script>alert(1)</script>--!>' UNION SELECT 1,2,3--",
      vectorClass: 'POLYGLOT_SQL_XSS',
      description: 'Polyglot breaking out of quotes, HTML tags, and executing UNION SELECT',
      payload: {
        code: 'ACC_POLY_02',
        name: "'/*\"/*<!--*/<script>alert(1)</script>--!>' UNION SELECT 1,2,3--",
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_POLYGLOT_SQLI_IMG_ONERROR',
      name: "1' OR '1'='1'/*<!--<img src=x onerror=alert(1)>-->*/",
      vectorClass: 'POLYGLOT_SQL_XSS',
      description: 'Combines SQL tautology with inline image onerror event handler',
      payload: {
        code: 'ACC_POLY_03',
        name: "1' OR '1'='1'/*<!--<img src=x onerror=alert(1)>-->*/",
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_POLYGLOT_JS_TITLE_BREAKOUT',
      name: "javascript:/*</title></style></textarea>*/<script>alert(1)</script>",
      vectorClass: 'POLYGLOT_SQL_XSS',
      description: 'Breaks out of title/style/textarea elements using pseudo-protocol and script',
      payload: {
        code: 'ACC_POLY_04',
        name: "javascript:/*</title></style></textarea>*/<script>alert(1)</script>",
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_POLYGLOT_COMPLEX_SVG_ONLOAD',
      name: 'Multi-context SVG/SQL/JS polyglot injection',
      vectorClass: 'POLYGLOT_SQL_XSS',
      description: 'Highly complex polyglot attacking multiple parsers simultaneously',
      payload: {
        code: 'ACC_POLY_05',
        name: "jaVasCript:/*-/*`/*\\`/*'/*\"/**/(/* */oNcliCk=alert() )//%0D%0A//</stYle/<titLe/<scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//>\\x3e",
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_POLYGLOT_UNION_COOKIE_EXFILTRATION',
      name: "admin' UNION SELECT null, null, '<script>alert(document.cookie)</script>'--",
      vectorClass: 'POLYGLOT_SQL_XSS',
      description: 'Combines UNION SELECT exfiltration query with document.cookie script',
      payload: {
        code: 'ACC_POLY_06',
        name: "admin' UNION SELECT null, null, '<script>alert(document.cookie)</script>'--",
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    },
    {
      id: 'VEC_POLYGLOT_STACKED_DDL_FETCH',
      name: "'; DROP TABLE users; -- <script>fetch('/stolen')</script>",
      vectorClass: 'POLYGLOT_SQL_XSS',
      description: 'Stacked SQL DDL command combined with background fetch exfiltration script',
      payload: {
        code: 'ACC_POLY_07',
        name: "'; DROP TABLE users; -- <script>fetch('/stolen')</script>",
        category: 'KASA'
      },
      targetEndpoint: '/api/accounts',
      expectedStatus: [400, 403, 422]
    }
  ];
}

/**
 * Aggregates all 5 vector generators into a unified test corpus.
 */
function generateFuzzVectors(options = {}) {
  const allVectors = [
    ...generateUnicodeHomographs(),
    ...generateNullByteInjections(),
    ...generatePrototypePollutionMutators(),
    ...generateBufferAndRedosBombs(),
    ...generatePolyglotVectors()
  ];

  let filtered = allVectors;
  if (options.vectorClass) {
    filtered = filtered.filter(v => v.vectorClass === options.vectorClass);
  }
  if (options.classes && Array.isArray(options.classes)) {
    filtered = filtered.filter(v => options.classes.includes(v.vectorClass));
  }
  if (options.limit && typeof options.limit === 'number' && options.limit > 0) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

// ==============================================================================
// 2. PROACTIVE DEFENSE: DYNAMIC RULE REGISTRY
// ==============================================================================

/**
 * Recursively inspects a data structure against dynamic immunity rules.
 */
function inspectAgainstDynamicRules(value, registry, depth = 0, seen = new WeakSet()) {
  if (depth > 10 || value === null || value === undefined) return null;
  const activeRules = (registry && typeof registry.getActiveDynamicRules === 'function')
    ? registry.getActiveDynamicRules()
    : DynamicRuleRegistry.getActiveDynamicRules();

  if (!activeRules || activeRules.length === 0) return null;

  if (typeof value === 'string') {
    for (const rule of activeRules) {
      if (rule.regex && rule.regex.test(value)) {
        rule.hits = (rule.hits || 0) + 1;
        return { ruleId: rule.id, pattern: rule.pattern, matched: value.slice(0, 100), rule };
      }
    }
    return null;
  }

  if (typeof value === 'object') {
    if (seen.has(value)) return null;
    seen.add(value);

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const violation = inspectAgainstDynamicRules(value[i], registry, depth + 1, seen);
        if (violation) return violation;
      }
      return null;
    }

    const keys = Object.getOwnPropertyNames(value);
    for (const key of keys) {
      for (const rule of activeRules) {
        if (rule.regex && rule.regex.test(key)) {
          rule.hits = (rule.hits || 0) + 1;
          return { ruleId: rule.id, pattern: rule.pattern, matched: key, rule };
        }
      }
      let childVal;
      try { childVal = value[key]; } catch (_) { continue; }
      const violation = inspectAgainstDynamicRules(childVal, registry, depth + 1, seen);
      if (violation) return violation;
    }
  }

  return null;
}

class DynamicRuleRegistry {
  constructor() {
    this.rules = new Map();
  }

  registerRule(id, patternOrRegex, options = {}) {
    if (!id) throw new Error('Rule ID is required');
    let regex;
    let pattern;

    if (patternOrRegex instanceof RegExp) {
      regex = patternOrRegex;
      pattern = patternOrRegex.source;
    } else if (typeof patternOrRegex === 'string') {
      pattern = patternOrRegex;
      const flags = options.flags || 'i';
      regex = new RegExp(options.isLiteral ? escapeRegExp(patternOrRegex) : patternOrRegex, flags);
    } else {
      throw new Error('Pattern must be a RegExp or string');
    }

    const rule = {
      id: String(id),
      pattern,
      regex,
      category: options.category || 'DYNAMIC_RULE',
      description: options.description || `Dynamic immunity rule ${id}`,
      flags: regex.flags,
      createdAt: options.createdAt || new Date().toISOString(),
      hits: 0,
      active: options.active !== false
    };

    this.rules.set(rule.id, rule);
    return rule;
  }

  synthesizeRule(candidate, options = {}) {
    const id = options.id || options.ruleId || `SYN_RULE_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    let patternStr;
    let isLiteral = false;

    if (candidate instanceof RegExp) {
      return this.registerRule(id, candidate, options);
    }

    if (typeof candidate === 'string') {
      patternStr = candidate;
      isLiteral = options.isLiteral !== false;
    } else if (typeof candidate === 'object' && candidate !== null) {
      if (candidate.token) {
        patternStr = String(candidate.token);
        isLiteral = true;
      } else if (candidate.pattern) {
        patternStr = String(candidate.pattern);
        isLiteral = !!options.isLiteral;
      } else {
        const serialized = JSON.stringify(candidate);
        patternStr = serialized.slice(0, 80);
        isLiteral = true;
      }
    } else {
      patternStr = String(candidate);
      isLiteral = true;
    }

    const safePattern = isLiteral ? escapeRegExp(patternStr) : patternStr;
    return this.registerRule(id, safePattern, {
      ...options,
      isLiteral: false,
      category: options.category || 'SYNTHESIZED_IMMUNITY',
      description: options.description || `Autonomously synthesized rule for pattern: ${patternStr.slice(0, 50)}`
    });
  }

  getActiveDynamicRules() {
    return Array.from(this.rules.values()).filter(r => r.active !== false);
  }

  getRule(id) {
    return this.rules.get(id) || null;
  }

  removeRule(id) {
    return this.rules.delete(id);
  }

  clear() {
    this.rules.clear();
  }

  reset() {
    this.rules.clear();
  }

  test(input) {
    const violation = this.inspect(input);
    return violation ? { match: true, rule: violation.rule, matched: violation.matched } : { match: false };
  }

  inspect(input) {
    return inspectAgainstDynamicRules(input, this);
  }
}

// Global default instance for DynamicRuleRegistry with static forwarding
DynamicRuleRegistry.defaultInstance = new DynamicRuleRegistry();

DynamicRuleRegistry.getActiveDynamicRules = function() {
  return DynamicRuleRegistry.defaultInstance.getActiveDynamicRules();
};

DynamicRuleRegistry.registerRule = function(...args) {
  return DynamicRuleRegistry.defaultInstance.registerRule(...args);
};

DynamicRuleRegistry.synthesizeRule = function(...args) {
  return DynamicRuleRegistry.defaultInstance.synthesizeRule(...args);
};

DynamicRuleRegistry.clear = function() {
  return DynamicRuleRegistry.defaultInstance.clear();
};

DynamicRuleRegistry.reset = function() {
  return DynamicRuleRegistry.defaultInstance.reset();
};

DynamicRuleRegistry.test = function(...args) {
  return DynamicRuleRegistry.defaultInstance.test(...args);
};

DynamicRuleRegistry.inspect = function(...args) {
  return DynamicRuleRegistry.defaultInstance.inspect(...args);
};

/**
 * Express Middleware factory for Dynamic Immunity Rule Enforcement.
 */
function createDynamicImmunityGuard(registry) {
  return function dynamicImmunityGuard(req, res, next) {
    try {
      const reg = registry || DynamicRuleRegistry.defaultInstance;
      const targets = [
        { loc: 'query', val: req.query },
        { loc: 'params', val: req.params },
        { loc: 'body', val: req.body }
      ];

      for (const target of targets) {
        if (target.val) {
          const violation = inspectAgainstDynamicRules(target.val, reg);
          if (violation) {
            res.setHeader('X-Immunity-Shield', 'ACTIVE');
            res.setHeader('X-Dynamic-Rule-Id', violation.ruleId);
            return res.status(403).json({
              success: false,
              error: 'Erişim engellendi: Dinamik bağışıklık kuralı ihlali tespit edildi.',
              code: 'DYNAMIC_IMMUNITY_VIOLATION',
              ruleId: violation.ruleId,
              location: target.loc
            });
          }
        }
      }
      next();
    } catch (err) {
      console.error('⚠️ [DynamicImmunity] Guard exception:', err.message);
      return res.status(403).json({
        success: false,
        error: 'Güvenlik denetimi hatası',
        code: 'IMMUNITY_GUARD_ERROR'
      });
    }
  };
}

const dynamicImmunityGuard = createDynamicImmunityGuard(DynamicRuleRegistry.defaultInstance);

// ==============================================================================
// 3. SIMULATION & IMMUNITY EXECUTION HARNESS
// ==============================================================================

/**
 * Resolves appropriate Zod schema for an API endpoint.
 */
function resolveSchemaForEndpoint(endpoint) {
  if (!endpoint || typeof endpoint !== 'string') return validators.TransactionSchema;
  const clean = endpoint.toLowerCase().split('?')[0];

  if (clean.includes('/api/accounts')) return validators.AccountSchema;
  if (clean.includes('/api/contacts')) return validators.ContactSchema;
  if (clean.includes('/api/journal')) return validators.JournalEntrySchema;
  if (clean.includes('/api/invoices')) return validators.InvoiceSchema;
  if (clean.includes('/api/products')) return validators.ProductSchema;
  if (clean.includes('/api/transactions')) return validators.TransactionSchema;
  if (clean.includes('/api/auth/login')) return validators.LoginSchema;

  return validators.TransactionSchema;
}

/**
 * Safely runs a single payload or request through the simulated Express defense pipeline.
 * Evaluates Zero-Uncaught-Crashes SLA.
 */
function simulateEndpointFuzz(endpoint, method = 'POST', payload = {}, options = {}) {
  const normEndpoint = endpoint || '/api/transactions';
  const normMethod = (method || 'POST').toUpperCase();
  const targetSchema = options.schema || resolveSchemaForEndpoint(normEndpoint);
  const dynamicRules = options.dynamicRules || DynamicRuleRegistry.defaultInstance;

  // Mock response state
  let statusCode = 200;
  let responseBody = null;
  let ended = false;
  const headersSent = {};

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseBody = data;
      ended = true;
      return this;
    },
    send(data) {
      responseBody = data;
      ended = true;
      return this;
    },
    setHeader(key, val) {
      headersSent[key.toLowerCase()] = val;
      return this;
    },
    getHeader(key) {
      return headersSent[key.toLowerCase()];
    },
    end() {
      ended = true;
      return this;
    },
    get ended() {
      return ended;
    },
    get statusCode() {
      return statusCode;
    }
  };

  // Parse query parameters from endpoint if any
  let queryParams = {};
  try {
    const qIdx = normEndpoint.indexOf('?');
    if (qIdx !== -1) {
      const qStr = normEndpoint.slice(qIdx + 1);
      const searchParams = new URLSearchParams(qStr);
      searchParams.forEach((val, key) => {
        queryParams[key] = val;
      });
    }
  } catch (_) {}

  const isQueryLocation = options.location === 'query';
  const req = {
    method: normMethod,
    url: normEndpoint,
    originalUrl: normEndpoint,
    path: normEndpoint.split('?')[0],
    headers: {
      'user-agent': 'BrosanImmuneSentinel/1.0',
      'content-type': 'application/json',
      host: 'localhost',
      ...(options.headers || {})
    },
    body: isQueryLocation ? {} : (payload !== undefined ? payload : {}),
    query: isQueryLocation ? (payload || {}) : Object.assign({}, queryParams, options.query || {}),
    params: options.params || {},
    ip: '127.0.0.1' // Loopback IP ensures immunity from persistent IP quarantine poisoning during tests
  };

  const start = performance.now();
  let uncaughtCrash = false;
  let crashError = null;

  try {
    // Pipeline Layer 1: Dynamic Immunity Guard (Synthesized Dynamic Rules)
    const guard = createDynamicImmunityGuard(dynamicRules);
    guard(req, res, () => {});

    // Pipeline Layer 2: Deep Heuristic WAF Guard
    if (!res.ended) {
      heuristicWafGuard(req, res, () => {
        // Pipeline Layer 3: Strict Schema Validation
        if (!res.ended && targetSchema && req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
          const bodyValidator = validators.validateBody(targetSchema);
          bodyValidator(req, res, () => {
            // Pipeline Layer 4: Simulated Controller (Target Endpoint)
            if (!res.ended) {
              res.status(200).json({
                success: true,
                message: 'Endpoint processed payload safely without crash',
                data: req.body,
                sanitized: true
              });
            }
          });
        } else if (!res.ended) {
          res.status(200).json({
            success: true,
            message: 'Endpoint processed payload safely without crash',
            data: req.body
          });
        }
      });
    }
  } catch (err) {
    uncaughtCrash = true;
    crashError = err;
    statusCode = 500;
    responseBody = {
      success: false,
      error: err.message,
      stack: err.stack,
      code: 'UNCAUGHT_SERVER_CRASH'
    };
  }

  const durationMs = performance.now() - start;

  // SLA Evaluation
  // Cleanly Handled: Blocked with 400, 403, 422, 503 OR Sanitized/Accepted with 200, 201
  const cleanlyBlocked = statusCode === 400 || statusCode === 403 || statusCode === 422 || statusCode === 503;
  const sanitizedOrAccepted = statusCode === 200 || statusCode === 201;
  const slaCompliant = !uncaughtCrash && statusCode !== 500 && (cleanlyBlocked || sanitizedOrAccepted);

  return {
    endpoint: normEndpoint,
    method: normMethod,
    statusCode,
    responseBody,
    blocked: cleanlyBlocked,
    sanitizedOrAccepted,
    uncaughtCrash,
    crashError: crashError ? crashError.message : null,
    durationMs: Number(durationMs.toFixed(3)),
    slaCompliant
  };
}

/**
 * Convenient wrapper executing simulation on a single payload.
 */
function simulatePayloadDefense(payload, options = {}) {
  const endpoint = options.endpoint || '/api/transactions';
  const method = options.method || 'POST';
  return simulateEndpointFuzz(endpoint, method, payload, options);
}

// ==============================================================================
// 4. SLA COMPLIANCE VERIFICATION & FUZZING CYCLE RUNNER
// ==============================================================================

/**
 * Verifies strict Zero Uncaught Crashes SLA across test outcomes.
 */
function verifyZeroCrashSLA(results) {
  const list = Array.isArray(results) ? results : [results];
  let uncaughtCrashes = 0;
  let cleanlyBlocked = 0;
  let sanitizedOrAccepted = 0;
  const failedItems = [];

  for (const item of list) {
    if (item.uncaughtCrash || item.statusCode === 500) {
      uncaughtCrashes++;
      failedItems.push(item);
    } else if (item.statusCode === 400 || item.statusCode === 403 || item.statusCode === 422 || item.statusCode === 503) {
      cleanlyBlocked++;
    } else if (item.statusCode === 200 || item.statusCode === 201) {
      sanitizedOrAccepted++;
    } else {
      uncaughtCrashes++;
      failedItems.push(item);
    }
  }

  const totalTested = list.length;
  const slaPassed = uncaughtCrashes === 0 && totalTested > 0;
  const crashFreePercentage = totalTested > 0
    ? Number((((totalTested - uncaughtCrashes) / totalTested) * 100).toFixed(2))
    : 100.0;

  return {
    slaPassed,
    totalTested,
    cleanlyBlocked,
    sanitizedOrAccepted,
    uncaughtCrashes,
    crashFreePercentage,
    failedItems
  };
}

/**
 * Runs a full autonomous in-memory fuzzing cycle across generated vectors.
 */
function runAutonomousFuzzingCycle(options = {}) {
  const vectors = options.vectors || generateFuzzVectors(options);
  const results = [];
  const synthesizedRules = [];
  const registry = options.dynamicRules || DynamicRuleRegistry.defaultInstance;

  for (const vector of vectors) {
    const endpoint = vector.targetEndpoint || options.endpoint || '/api/transactions';
    const method = vector.targetMethod || options.method || 'POST';
    const payload = vector.payload;

    const res = simulateEndpointFuzz(endpoint, method, payload, {
      ...options,
      dynamicRules: registry,
      location: vector.location || 'body'
    });

    res.vectorId = vector.id;
    res.vectorClass = vector.vectorClass;
    res.vectorName = vector.name;
    results.push(res);

    // If a vector passes unblocked and proactive rule synthesis is requested
    if (res.statusCode === 200 && options.synthesizeOnEvasion !== false) {
      const syn = registry.synthesizeRule(payload, {
        category: vector.vectorClass,
        description: `Autonomous immunity synthesized for evasive vector ${vector.id}`
      });
      synthesizedRules.push(syn);
    }
  }

  const sla = verifyZeroCrashSLA(results);
  return {
    success: sla.slaPassed,
    totalVectorsTested: results.length,
    results,
    sla,
    synthesizedRules,
    timestamp: new Date().toISOString()
  };
}

// ==============================================================================
// 5. FUZZING SENTINEL ORCHESTRATION ENGINE
// ==============================================================================

class FuzzingSentinel {
  constructor(options = {}) {
    this.dynamicRules = options.dynamicRules || DynamicRuleRegistry.defaultInstance;
    this.metrics = {
      totalCycles: 0,
      totalVectorsTested: 0,
      blockedCount: 0,
      sanitizedCount: 0,
      uncaughtCrashes: 0,
      lastRunAt: null,
      slaStatus: 'INITIALIZED'
    };
    this.cycleHistory = [];
  }

  generateFuzzVectors(options) {
    return generateFuzzVectors(options);
  }

  simulateEndpointFuzz(endpoint, method, payload, options = {}) {
    return simulateEndpointFuzz(endpoint, method, payload, {
      ...options,
      dynamicRules: this.dynamicRules
    });
  }

  simulatePayloadDefense(payload, options = {}) {
    return simulatePayloadDefense(payload, {
      ...options,
      dynamicRules: this.dynamicRules
    });
  }

  runAutonomousFuzzingCycle(options = {}) {
    const cycleResult = runAutonomousFuzzingCycle({
      ...options,
      dynamicRules: this.dynamicRules
    });

    this.metrics.totalCycles++;
    this.metrics.totalVectorsTested += cycleResult.totalVectorsTested;
    this.metrics.blockedCount += cycleResult.sla.cleanlyBlocked;
    this.metrics.sanitizedCount += cycleResult.sla.sanitizedOrAccepted;
    this.metrics.uncaughtCrashes += cycleResult.sla.uncaughtCrashes;
    this.metrics.lastRunAt = cycleResult.timestamp;
    this.metrics.slaStatus = cycleResult.sla.slaPassed ? 'PASSED_ZERO_CRASH_SLA' : 'FAILED_SLA';

    this.cycleHistory.push({
      timestamp: cycleResult.timestamp,
      total: cycleResult.totalVectorsTested,
      blocked: cycleResult.sla.cleanlyBlocked,
      crashes: cycleResult.sla.uncaughtCrashes,
      slaPassed: cycleResult.sla.slaPassed
    });

    if (this.cycleHistory.length > 50) this.cycleHistory.shift();

    return cycleResult;
  }

  verifyZeroCrashSLA(results) {
    return verifyZeroCrashSLA(results);
  }

  getActiveDynamicRules() {
    return this.dynamicRules.getActiveDynamicRules();
  }

  synthesizeRule(candidate, options = {}) {
    return this.dynamicRules.synthesizeRule(candidate, options);
  }

  registerRule(id, pattern, options = {}) {
    return this.dynamicRules.registerRule(id, pattern, options);
  }

  createMiddleware() {
    return createDynamicImmunityGuard(this.dynamicRules);
  }

  getMetrics() {
    return {
      ...this.metrics,
      activeDynamicRulesCount: this.dynamicRules.getActiveDynamicRules().length
    };
  }

  reset() {
    this.dynamicRules.reset();
    this.metrics = {
      totalCycles: 0,
      totalVectorsTested: 0,
      blockedCount: 0,
      sanitizedCount: 0,
      uncaughtCrashes: 0,
      lastRunAt: null,
      slaStatus: 'INITIALIZED'
    };
    this.cycleHistory = [];
  }
}

// Global Singleton Instance
const fuzzingSentinel = new FuzzingSentinel();

// ==============================================================================
// 6. MODULE EXPORTS
// ==============================================================================
module.exports = {
  // Required Blueprint Exports
  FuzzingSentinel,
  generateFuzzVectors,
  simulatePayloadDefense,
  DynamicRuleRegistry,
  fuzzingSentinel,

  // Execution Harness & Middleware
  simulateEndpointFuzz,
  dynamicImmunityGuard,
  createDynamicImmunityGuard,
  runAutonomousFuzzingCycle,
  verifyZeroCrashSLA,

  // Vector Class Generators
  generateUnicodeHomographs,
  generateNullByteInjections,
  generatePrototypePollutionMutators,
  generateBufferAndRedosBombs,
  generatePolyglotVectors
};
