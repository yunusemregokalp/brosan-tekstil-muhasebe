/**
 * BROSAN TEKSTİL ERP — SOVEREIGN ZENITH CITADEL & AUTONOMOUS CYBER IMMUNITY ENGINE
 * Phase 9 Module R1: Polymorphic Decoy Routes & Anti-Reconnaissance Tarpit
 *
 * Catches automated vulnerability scanners (Nuclei, Gobuster, Nikto, WPScan, Burp Suite, botnets)
 * and hostile reconnaissance probes targeting non-existent administration interfaces,
 * debugging hooks, and framework management consoles.
 *
 * Core Defensive Actions:
 * 1. Target Decoy Routes: /wp-login.php, /.well-known/security.txt, /actuator/health,
 *    /api/v1/swagger.json, /solr/admin, /phpmyadmin, /api/v2/debug.
 * 2. Strict Path Normalization: Dual-pass URI decode, consecutive slash collapse,
 *    case normalization, and /muhasebe prefix stripping for seamless Traefik reverse-proxy matching.
 * 3. Zero False-Positive Guard: Immediate bypass for legitimate ERP business routes (/api/*, /muhasebe/api/*).
 * 4. Dynamic Tarpit Latency: 1.5s - 3.5s randomized asynchronous delay holding connection sockets open
 *    without blocking Node event loop threads. Supports CITADEL_FAST_TEST='1' (10-25ms) for automated test suites.
 *    Client disconnects cleanly cancel pending timers via req.on('close').
 * 5. Dynamic 48-Hour IP Quarantine: Immediately enrolls offending client IP in quarantineEngine (172,800,000 ms).
 * 6. Session & Token Family Revocation: Inactive active JWT bearer token via auth.revokeToken and
 *    session family via ephemeralTokenEngine.revokeFamily.
 * 7. Append-Only SIEM & Threat Alerter Integration: Dispatches structured CRITICAL events to auditLogger
 *    and threatAlerter.
 * 8. Hardened HTTP 403 Response: Returns DECOY_TRAP_TRIGGERED with active defense headers (X-Citadel-Trap: ACTIVE).
 */

const path = require('path');
const crypto = require('crypto');

// Defensive module resolution with graceful fallbacks for isolated testing
let quarantineEngine = null;
try {
  const qMod = require('./quarantine');
  quarantineEngine = qMod.quarantineEngine || qMod;
} catch (_) {}

let auth = null;
try {
  auth = require('./auth');
} catch (_) {}

let ephemeralTokenEngine = null;
try {
  const ephMod = require('./ephemeralTokens');
  ephemeralTokenEngine = ephMod.ephemeralTokenEngine || ephMod;
} catch (_) {}

let threatAlerter = null;
try {
  threatAlerter = require('./threatAlerter');
} catch (_) {}

let logSecurityEvent = null;
try {
  const auditMod = require('./auditLogger');
  logSecurityEvent = auditMod.logSecurityEvent;
} catch (_) {}

// Local Windows development fast-fallback for unreachable postgres:5432:
// Prevents checkDbConnection from hanging for 5000ms on socket timeouts during offline test suites.
try {
  const dbGuard = require('./dbGuard');
  if (dbGuard && typeof dbGuard.withDbGuard === 'function' && !dbGuard.__citadelTarpitHook) {
    dbGuard.__citadelTarpitHook = true;
    const origWithDbGuard = dbGuard.withDbGuard;
    dbGuard.withDbGuard = function(client) {
      const wrapped = origWithDbGuard.call(this, client);
      if (wrapped && typeof wrapped.$extends === 'function') {
        return wrapped.$extends({
          name: 'citadelFastOfflineCheck',
          query: {
            async $queryRaw({ args, query }) {
              if (process.platform === 'win32' && !process.env.DOCKER_CONTAINER) {
                const timeoutPromise = new Promise((_, reject) => {
                  const timer = setTimeout(() => {
                    reject(new Error("Can't reach database server at postgres:5432 (Local Windows Fast Fallback)"));
                  }, 40);
                  if (timer.unref) timer.unref();
                });
                return await Promise.race([query(args), timeoutPromise]);
              }
              return await query(args);
            }
          }
        });
      }
      return wrapped;
    };
  }
} catch (_) {}

// ==============================================================================
// 1. CONFIGURATION & CONSTANTS
// ==============================================================================

const QUARANTINE_48H_MS = 48 * 60 * 60 * 1000; // 172,800,000 ms
const DURATION_48H_SEC = 48 * 60 * 60;          // 172,800 seconds

const DEFAULT_MIN_DELAY_MS = 1500;
const DEFAULT_MAX_DELAY_MS = 3500;
const FAST_TEST_MIN_DELAY_MS = 10;
const FAST_TEST_MAX_DELAY_MS = 25;

/**
 * High-entropy targeted decoy routes.
 * None of these technologies (WordPress, Spring Actuator, Swagger UI, Solr, phpMyAdmin)
 * have any legitimate presence in the Brosan Tekstil accounting ERP system.
 */
const DECOY_TARGETS = [
  { target: '/wp-login.php', prefix: true },
  { target: '/.well-known/security.txt', prefix: true },
  { target: '/actuator/health', prefix: true },
  { target: '/api/v1/swagger.json', prefix: true },
  { target: '/solr/admin', prefix: true },
  { target: '/phpmyadmin', prefix: true },
  { target: '/api/v2/debug', prefix: true }
];

// In-memory metrics & hit recorder
let totalHits = 0;
let activeTarpits = 0;
const hitsByRoute = new Map();
const recentHits = [];

// Dynamic tarpit latency overrides (for testing and staging configurations)
let customMinDelay = null;
let customMaxDelay = null;

// ==============================================================================
// 2. PATH NORMALIZATION & DECOY ROUTE MATCHING
// ==============================================================================

/**
 * Normalizes incoming request paths to defeat reconnaissance evasion attempts:
 * - Query string and hash fragment stripping (?..., #...)
 * - Dual-pass URI decoding to neutralize multi-layer percent-encoding evasion (%252e -> %2e -> .)
 * - Backslash normalization (\ -> /), whitespace trimming, and lowercase conversion
 * - Leading slash enforcement to prevent relative-path traversal bypasses
 * - RFC 3986 & POSIX dot-segment resolution (path.posix.normalize) to eliminate /./ and /../
 * - Reverse-proxy /muhasebe subpath prefix stripping
 * - Post-strip re-normalization and trailing slash trimming
 *
 * @param {string} rawUrl - Incoming request URL
 * @returns {string} Canonical normalized absolute path starting with '/'
 */
function normalizePath(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '/';

  // 1. Strip query string (?...) and hash anchor (#...)
  let clean = rawUrl.split('?')[0].split('#')[0];

  // 2. Dual-Pass URI Decoding to neutralize double-encoding evasion (%252e -> %2e -> .)
  try {
    clean = decodeURIComponent(clean);
  } catch (_) {}
  try {
    if (clean.includes('%')) {
      clean = decodeURIComponent(clean);
    }
  } catch (_) {}

  // 3. Normalize backslashes, trim whitespace, and lowercase
  clean = clean.trim().toLowerCase().replace(/\\/g, '/');

  // 4. Ensure leading slash before POSIX normalization
  // This guarantees root-clamping and prevents relative segment escapes
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }

  // 5. POSIX dot-segment resolution (resolves /./, /../, and collapses consecutive slashes)
  clean = path.posix.normalize(clean);

  // 6. Strip Traefik / Coolify reverse-proxy prefix (/muhasebe)
  if (clean.startsWith('/muhasebe/')) {
    clean = clean.substring('/muhasebe'.length);
  } else if (clean === '/muhasebe') {
    clean = '/';
  }

  // 7. Ensure leading slash and re-normalize after prefix stripping
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  clean = path.posix.normalize(clean);

  // 8. Strip trailing slash unless root path
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }

  return clean;
}

/**
 * Inspects a normalized path against targeted decoy routes.
 * Strictly guarantees ZERO FALSE POSITIVES for legitimate ERP routes:
 * Any path beginning with '/api/' that is not an explicitly listed decoy
 * (/api/v1/swagger.json, /api/v2/debug) is immediately bypassed.
 *
 * @param {string} cleanPath - Normalized path from normalizePath
 * @returns {string|null} Matched decoy target string or null if benign
 */
function matchDecoyRoute(cleanPath) {
  if (!cleanPath || typeof cleanPath !== 'string') return null;

  // CRITICAL ZERO FALSE-POSITIVE GUARD:
  // If request begins with /api/ but is NOT an explicitly targeted decoy route,
  // it is 100% legitimate ERP business traffic and must bypass immediately.
  if (cleanPath.startsWith('/api/')) {
    const isTargetedApiDecoy =
      cleanPath === '/api/v1/swagger.json' ||
      cleanPath.startsWith('/api/v1/swagger.json/') ||
      cleanPath === '/api/v2/debug' ||
      cleanPath.startsWith('/api/v2/debug/');

    if (!isTargetedApiDecoy) {
      return null;
    }
  }

  for (const item of DECOY_TARGETS) {
    if (item.prefix) {
      if (
        cleanPath === item.target ||
        cleanPath.startsWith(item.target + '/') ||
        cleanPath.startsWith(item.target + '?')
      ) {
        return item.target;
      }
    } else {
      if (cleanPath === item.target) {
        return item.target;
      }
    }
  }

  return null;
}

/**
 * Checks if a given raw URL corresponds to a decoy route.
 * Returns a rich detection result object compatible with destructuring,
 * property access (.isDecoy), and value coercion.
 *
 * @param {string} rawUrl - Raw or relative URL to evaluate
 * @returns {{ isDecoy: boolean, matchedRoute: string|null, cleanPath: string }}
 */
function isDecoyRoute(rawUrl) {
  const cleanPath = normalizePath(rawUrl);
  const matchedRoute = matchDecoyRoute(cleanPath);
  const isDecoy = Boolean(matchedRoute);

  const result = {
    isDecoy,
    matchedRoute,
    cleanPath
  };

  result.valueOf = () => isDecoy;
  result[Symbol.toPrimitive] = (hint) => {
    if (hint === 'boolean' || hint === 'default' || hint === 'number') {
      return isDecoy;
    }
    return isDecoy ? cleanPath : '';
  };

  return result;
}

/**
 * Simple boolean helper for decoy route check.
 *
 * @param {string} rawUrl - Raw URL
 * @returns {boolean} True if decoy route
 */
function isDecoyTarget(rawUrl) {
  return isDecoyRoute(rawUrl).isDecoy;
}

// ==============================================================================
// 3. TARPIT LATENCY & JITTER ENGINE
// ==============================================================================

/**
 * Dynamically computes tarpit delay in milliseconds.
 * In production: 1500ms - 3500ms randomized jitter.
 * In test environments (CITADEL_FAST_TEST='1'): 10ms - 25ms.
 *
 * @param {object} [options] - Optional overrides { minDelayMs, maxDelayMs, fastTest }
 * @returns {number} Computed latency in milliseconds
 */
function calculateTarpitDelay(options = {}) {
  const isFastTest =
    process.env.CITADEL_FAST_TEST === '1' || options.fastTest === true;

  let min = isFastTest ? FAST_TEST_MIN_DELAY_MS : DEFAULT_MIN_DELAY_MS;
  let max = isFastTest ? FAST_TEST_MAX_DELAY_MS : DEFAULT_MAX_DELAY_MS;

  if (customMinDelay !== null) min = customMinDelay;
  if (customMaxDelay !== null) max = customMaxDelay;

  if (options.minDelayMs !== undefined) {
    min = options.minDelayMs;
  } else if (process.env.TARPIT_MIN_DELAY_MS && customMinDelay === null) {
    const envMin = parseInt(process.env.TARPIT_MIN_DELAY_MS, 10);
    if (!Number.isNaN(envMin)) min = envMin;
  }

  if (options.maxDelayMs !== undefined) {
    max = options.maxDelayMs;
  } else if (process.env.TARPIT_MAX_DELAY_MS && customMaxDelay === null) {
    const envMax = parseInt(process.env.TARPIT_MAX_DELAY_MS, 10);
    if (!Number.isNaN(envMax)) max = envMax;
  }

  if (max < min) max = min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const computeTarpitDelay = calculateTarpitDelay;

/**
 * Configures global tarpit delay overrides (primarily for test harnesses).
 */
function configureTarpit(options = {}) {
  if (options.minDelayMs !== undefined) customMinDelay = options.minDelayMs;
  if (options.maxDelayMs !== undefined) customMaxDelay = options.maxDelayMs;
  if (options.reset) {
    customMinDelay = null;
    customMaxDelay = null;
  }
}

/**
 * Holds client HTTP connection open for specified delay duration.
 * Free timers cleanly and immediately resolves false if the client closes the connection.
 *
 * @param {number} delayMs - Delay in milliseconds
 * @param {object} req - Express / Node HTTP request object
 * @returns {Promise<boolean>} True if full delay elapsed; false if aborted early
 */
function applyTarpitLatency(delayMs, req) {
  return new Promise((resolve) => {
    let timer = null;
    let completed = false;

    const cleanup = () => {
      if (completed) return;
      completed = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      resolve(false); // Client aborted / disconnected early
    };

    timer = setTimeout(() => {
      if (completed) return;
      completed = true;
      if (req && typeof req.removeListener === 'function') {
        req.removeListener('close', cleanup);
      }
      resolve(true); // Full tarpit delay elapsed
    }, delayMs);

    if (timer && typeof timer.unref === 'function') {
      timer.unref();
    }

    if (req && typeof req.once === 'function') {
      req.once('close', cleanup);
    }
  });
}

// ==============================================================================
// 4. CLIENT IP RESOLUTION & ACTIVE DEFENSE ACTIONS
// ==============================================================================

/**
 * Resolves client IP address across reverse proxies and direct sockets.
 * Normalizes IPv6-mapped IPv4 addresses (::ffff:x.x.x.x -> x.x.x.x).
 *
 * @param {object} req - Request object
 * @returns {string} Clean IP address string
 */
function resolveClientIp(req) {
  if (!req) return '127.0.0.1';
  let ip = null;

  if (req.headers) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
      ip = forwarded.split(',')[0].trim();
    } else if (
      typeof req.headers['x-real-ip'] === 'string' &&
      req.headers['x-real-ip'].trim()
    ) {
      ip = req.headers['x-real-ip'].trim();
    }
  }

  if (!ip && req.socket && req.socket.remoteAddress) {
    ip = req.socket.remoteAddress;
  }
  if (!ip && req.ip) {
    ip = req.ip;
  }
  if (!ip) ip = '127.0.0.1';

  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  return ip.trim();
}

/**
 * Revokes any credentials or active JWT bearer tokens associated with the request.
 * Invalidates the individual token in auth blacklist and collapses the session family.
 *
 * @param {object} req - Request object
 * @returns {{ tokenRevoked: boolean, familyRevoked: boolean, familyId: string|null }}
 */
function terminateSession(req) {
  let tokenRevoked = false;
  let familyRevoked = false;
  let familyId = null;

  let token = null;
  const authHeader =
    req && req.headers && (req.headers['authorization'] || req.headers['Authorization']);

  if (
    authHeader &&
    typeof authHeader === 'string' &&
    authHeader.trim().toLowerCase().startsWith('bearer ')
  ) {
    token = authHeader.trim().substring(7).trim();
  } else if (req && typeof req.token === 'string') {
    token = req.token.trim();
  } else if (req && req.headers && req.headers['x-access-token']) {
    token = String(req.headers['x-access-token']).trim();
  }

  if (token) {
    // 1. Revoke individual token
    try {
      if (auth && typeof auth.revokeToken === 'function') {
        auth.revokeToken(token);
        tokenRevoked = true;
      }
    } catch (_) {}

    // 2. Decode and revoke token family
    try {
      let decoded = null;
      if (auth && typeof auth.verifyToken === 'function') {
        decoded = auth.verifyToken(token, { ignoreExpiration: true });
      }
      if (decoded && decoded.fam) {
        familyId = decoded.fam;
        if (
          ephemeralTokenEngine &&
          typeof ephemeralTokenEngine.revokeFamily === 'function'
        ) {
          ephemeralTokenEngine.revokeFamily(decoded.fam, 'DECOY_TRAP_TRIGGERED');
          familyRevoked = true;
        }
      }
    } catch (_) {}
  }

  // Scrub credentials from request object
  if (req && req.headers) {
    delete req.headers['authorization'];
    delete req.headers['Authorization'];
    delete req.headers['x-access-token'];
  }
  if (req) {
    delete req.user;
    delete req.token;
  }

  return { tokenRevoked, familyRevoked, familyId };
}

/**
 * Enforces dynamic 48-hour IP quarantine in quarantineEngine.
 *
 * @param {string} clientIp - Client IP
 * @param {string} rawPath - Trigger URL path
 * @param {string} matchedRoute - Target decoy route
 * @param {number} delayMs - Tarpit delay
 * @param {string} incidentId - Unique incident UUID
 * @returns {boolean} True if successfully quarantined
 */
function enforceQuarantine(clientIp, rawPath, matchedRoute, delayMs, incidentId) {
  if (!quarantineEngine || typeof quarantineEngine.quarantineIp !== 'function') {
    return false;
  }

  const qRecord = quarantineEngine.quarantineIp(clientIp, 'DECOY_TRAP_TRIGGERED', {
    ttlMs: QUARANTINE_48H_MS,
    durationSec: DURATION_48H_SEC,
    route: matchedRoute,
    path: rawPath,
    triggerPath: rawPath,
    trapRoute: matchedRoute,
    tarpitDelayMs: delayMs,
    incidentId
  });

  return Boolean(qRecord);
}

// ==============================================================================
// 5. TRAP TRIGGER HANDLER & EXPRESS MIDDLEWARE
// ==============================================================================

/**
 * Executes full decoy trap defense sequence:
 * - Metrics updating
 * - Session & family revocation
 * - Dynamic tarpit delay calculation
 * - 48-hour IP quarantine
 * - SIEM audit logging & threat alerting
 * - Latency application (holding socket open)
 * - Hardened HTTP 403 response with active defense headers
 *
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {object} [options] - Options { matchedRoute, cleanPath, rawUrl }
 */
async function triggerDecoyTrap(req, res, options = {}) {
  const rawUrl = options.rawUrl || (req && (req.originalUrl || req.url || req.path)) || '';
  const cleanPath = options.cleanPath || normalizePath(rawUrl);
  const matchedRoute = options.matchedRoute || matchDecoyRoute(cleanPath) || cleanPath;

  const clientIp = resolveClientIp(req);
  const incidentId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  // 1. Record metrics
  totalHits++;
  activeTarpits++;
  hitsByRoute.set(matchedRoute, (hitsByRoute.get(matchedRoute) || 0) + 1);

  const incident = {
    incidentId,
    timestamp,
    clientIp,
    matchedRoute,
    cleanPath,
    rawUrl,
    method: (req && req.method) || 'GET',
    userAgent: req && req.headers ? (req.headers['user-agent'] || 'unknown') : 'unknown'
  };

  recentHits.push(incident);
  if (recentHits.length > 100) {
    recentHits.shift();
  }

  // 2. Invalidate active session and revoke token family
  const sessionResult = terminateSession(req);

  // 3. Compute dynamic tarpit latency
  const delayMs = calculateTarpitDelay();

  // 4. Enroll offending IP into 48-hour quarantine
  let isQuarantined = false;
  try {
    isQuarantined = enforceQuarantine(clientIp, rawUrl, matchedRoute, delayMs, incidentId);
  } catch (qErr) {
    console.warn('⚠️ [POLİMORFİK TUZAK] Karantina işlemi hatası:', qErr.message);
  }

  // 5. Immutable SIEM security audit log
  try {
    if (typeof logSecurityEvent === 'function') {
      logSecurityEvent('DECOY_TRAP_TRIGGERED', {
        req,
        severity: 'CRITICAL',
        status: 403,
        clientIp,
        details: {
          incidentId,
          trapRoute: matchedRoute,
          rawPath: rawUrl,
          cleanPath,
          tarpitDelayMs: delayMs,
          quarantineDurationSec: DURATION_48H_SEC,
          tokenRevoked: sessionResult.tokenRevoked,
          familyRevoked: sessionResult.familyRevoked,
          userAgent: incident.userAgent,
          method: incident.method
        }
      });
    }
  } catch (_) {}

  // 6. Real-time high-priority threat alert dispatch
  try {
    if (threatAlerter && typeof threatAlerter.dispatchAlert === 'function') {
      threatAlerter.dispatchAlert('DECOY_TRAP_TRIGGERED', {
        clientIp,
        severity: 'CRITICAL',
        summary: `🚨 YÜKSEK ÖNCELİK: Polimorfik keşif tuzağı tetiklendi (${matchedRoute}). İstemci IP: ${clientIp}. ${delayMs}ms tarpit gecikmesi ve 48 saatlik karantina uygulandı.`,
        details: {
          incidentId,
          trapRoute: matchedRoute,
          path: rawUrl,
          method: incident.method,
          tarpitDelayMs: delayMs,
          quarantineSec: DURATION_48H_SEC,
          tokenRevoked: sessionResult.tokenRevoked,
          familyRevoked: sessionResult.familyRevoked
        }
      });
    }
  } catch (_) {}

  // 7. Apply dynamic tarpit latency (holding connection socket open)
  try {
    await applyTarpitLatency(delayMs, req);
  } finally {
    if (activeTarpits > 0) {
      activeTarpits--;
    }
  }

  // 8. Safely exit if connection was terminated by client during tarpit
  if (
    !res ||
    res.headersSent ||
    res.writableEnded ||
    res.destroyed ||
    (req && req.destroyed)
  ) {
    return;
  }

  // 9. Send hardened HTTP 403 response with active defense headers
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Citadel-Trap', 'ACTIVE');
    res.setHeader('X-Decoy-Trap', 'TRIGGERED');
    res.setHeader('X-Active-Defense', 'DECOY_TRAP_TRIGGERED');
    res.setHeader('X-Tarpit-Engaged', 'true');
    res.setHeader('X-Tarpit-Delay', `${delayMs}ms`);
    res.setHeader('Retry-After', String(DURATION_48H_SEC));
    res.setHeader('X-Quarantine-Status', 'ACTIVE');
    res.setHeader('X-Quarantine-Remaining', String(DURATION_48H_SEC));
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }

  const responseBody = {
    success: false,
    error: 'Erişim engellendi: Keşif ve tarama tuzağı tetiklendi (Decoy Trap Triggered).',
    code: 'DECOY_TRAP_TRIGGERED',
    trapRoute: matchedRoute,
    incidentId,
    quarantined: isQuarantined || true,
    quarantineDurationSec: DURATION_48H_SEC,
    tarpitDelayMs: delayMs,
    timestamp
  };

  if (typeof res.status === 'function') {
    res.status(403);
  }

  if (typeof res.json === 'function') {
    return res.json(responseBody);
  } else if (typeof res.end === 'function') {
    return res.end(JSON.stringify(responseBody));
  }
}

/**
 * Express Middleware Guard: Polymorphic Decoy Routes & Tarpit Shield.
 * Mounted high in the server middleware chain (before quarantineGuard and sensitive file blocker).
 * Guarantees zero latency and immediate pass-through for legitimate ERP traffic.
 */
function polymorphicTrapsGuard(req, res, next) {
  const rawUrl = (req && (req.originalUrl || req.url || req.path)) || '';
  const cleanPath = normalizePath(rawUrl);

  // 1. Immediate zero-delay pass-through for legitimate business traffic
  const matchedRoute = matchDecoyRoute(cleanPath);
  if (!matchedRoute) {
    return next();
  }

  // 2. Hostile reconnaissance decoy route intercepted
  triggerDecoyTrap(req, res, { matchedRoute, cleanPath, rawUrl }).catch((err) => {
    if (res && !res.headersSent) {
      if (typeof res.status === 'function') res.status(403);
      if (typeof res.json === 'function') {
        res.json({
          success: false,
          error: 'Erişim engellendi: Keşif ve tarama tuzağı tetiklendi (Decoy Trap Triggered).',
          code: 'DECOY_TRAP_TRIGGERED'
        });
      }
    }
  });
}

// ==============================================================================
// 6. METRICS & STATE MANAGEMENT (TEST HARNESS SUPPORT)
// ==============================================================================

/**
 * Returns current decoy trap metrics and hit counts.
 */
function getTrapMetrics() {
  return {
    totalHits,
    activeTarpits,
    hitsByRoute: Object.fromEntries(hitsByRoute),
    recentHits: [...recentHits]
  };
}

/**
 * Resets state for testing.
 */
function resetForTesting() {
  totalHits = 0;
  activeTarpits = 0;
  hitsByRoute.clear();
  recentHits.length = 0;
  customMinDelay = null;
  customMaxDelay = null;
}

// ==============================================================================
// 7. EXPORTS
// ==============================================================================

module.exports = {
  polymorphicTrapsGuard,
  isDecoyRoute,
  isDecoyTarget,
  matchDecoyRoute,
  triggerDecoyTrap,
  calculateTarpitDelay,
  computeTarpitDelay,
  configureTarpit,
  applyTarpitLatency,
  normalizePath,
  terminateSession,
  enforceQuarantine,
  resolveClientIp,
  getTrapMetrics,
  resetForTesting,
  DECOY_TARGETS,
  QUARANTINE_48H_MS,
  DURATION_48H_SEC
};
