/**
 * BROSAN TEKSTİL ERP — SOVEREIGN APEX CITADEL HARDENING (PHASE 7)
 * Layer 2: In-Flight Database Query Integrity Guard & SQL Anti-Exfiltration Circuit Breaker
 * (server/dbGuard.js)
 * 
 * Features:
 * - Pre-inspection normalizer stripping block/line comments and percent decoding.
 * - Regex detection:
 *     - STACKED_QUERY (; DROP, ; TRUNCATE, ; ALTER, ; DELETE FROM, ; UPDATE, ; INSERT, ; EXECUTE)
 *     - TIMING_EXFILTRATION (pg_sleep, sleep, benchmark, waitfor delay, dbms_pipe.receive_message)
 *     - UNION_EXFILTRATION (UNION SELECT, UNION ALL SELECT)
 *     - SYSTEM_CATALOG (information_schema, pg_catalog, sqlite_master)
 * - Transparent Prisma Client Extension wrapper via $extends ($allModels.$allOperations, $queryRaw, $queryRawUnsafe, $executeRaw, $executeRawUnsafe) with Proxy fallback for mock objects in test suites.
 * - Error sanitization: catch all DB/Prisma errors and cloak to standardized generic response
 *   { success: false, error: 'DATABASE_OPERATION_FAILED', code: 'DATABASE_OPERATION_FAILED' }
 *   with zero table, column, schema, or database engine version leaks.
 * - Express error handler middleware: dbGuardErrorMiddleware.
 */

const auditLogger = require('./auditLogger');
const threatAlerter = require('./threatAlerter');

let PrismaPackage = null;
try {
  PrismaPackage = require('@prisma/client').Prisma;
} catch (_) {}

// ==============================================================================
// 1. SECURITY DETECTION REGEX RULES
// ==============================================================================
const SQL_PATTERNS = {
  // Stacked DDL/DML queries (e.g. ; DROP TABLE, ; TRUNCATE, ; ALTER TABLE)
  STACKED_QUERY: /;\s*(?:DROP\s+(?:TABLE|DATABASE|SCHEMA|VIEW)|TRUNCATE\s+(?:TABLE)?|ALTER\s+(?:TABLE|DATABASE)|DELETE\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|EXEC(?:UTE)?)\b/i,

  // Timing side-channel exfiltration (pg_sleep, benchmark, sleep, waitfor delay)
  TIMING_EXFILTRATION: /\b(?:pg_sleep|sleep|benchmark)\s*\(|\bwaitfor\s+delay\b|\bdbms_pipe\.receive_message\b/i,

  // UNION-based exfiltration
  UNION_EXFILTRATION: /\bunion\s+(?:all\s+|distinct\s+)?select\b/i,

  // System catalog reconnaissance
  SYSTEM_CATALOG: /\binformation_schema\.(?:tables|columns|schemata)\b|\bpg_catalog\.(?:pg_tables|pg_user)\b|\bsqlite_master\b/i,

  // Out-of-band and file I/O primitives
  OUT_OF_BAND: /\b(?:dblink|pg_read_file|copy\s+.*?\s+from\s+program)\b/i
};

// ==============================================================================
// 2. ERROR CLASSES
// ==============================================================================
class DatabaseOperationError extends Error {
  constructor(message = 'DATABASE_OPERATION_FAILED', code = 'DATABASE_OPERATION_FAILED') {
    super(message);
    this.name = 'DatabaseOperationError';
    this.code = code;
    this.isDatabaseError = true;
    this.status = 500;
  }
}

class QueryIntegrityViolationError extends Error {
  constructor(message = 'DATABASE_OPERATION_FAILED', details = {}) {
    super(message);
    this.name = 'QueryIntegrityViolationError';
    this.code = 'DATABASE_OPERATION_FAILED';
    this.breachCode = 'QUERY_INTEGRITY_VIOLATION';
    this.details = details;
    this.isDatabaseError = true;
    this.status = 403;
  }
}

// ==============================================================================
// 3. CANDIDATE EXTRACTION & NORMALIZATION
// ==============================================================================
function normalizeString(input) {
  if (typeof input !== 'string') return '';
  let str = input;
  try {
    str = decodeURIComponent(str);
  } catch (_) {}
  // Remove block comments /* ... */
  str = str.replace(/\/\*[\s\S]*?\*\//g, ' ');
  // Remove line comments -- ...
  str = str.replace(/--.*$/gm, ' ');
  // Collapse whitespace
  str = str.replace(/\s+/g, ' ');
  return str.trim();
}

function extractStringsFromObject(obj, maxDepth = 10, visited = new WeakSet()) {
  const strings = [];
  if (!obj || typeof obj !== 'object' || maxDepth <= 0) return strings;
  if (visited.has(obj)) return strings;
  visited.add(obj);

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      strings.push(val);
    } else if (val && typeof val === 'object') {
      strings.push(...extractStringsFromObject(val, maxDepth - 1, visited));
    }
  }
  return strings;
}

function extractRawQueryCandidates(args) {
  const candidates = [];
  if (typeof args === 'string') {
    candidates.push(args);
  } else if (Array.isArray(args)) {
    for (const item of args) {
      if (typeof item === 'string') {
        candidates.push(item);
      } else if (item && typeof item === 'object') {
        candidates.push(...extractStringsFromObject(item));
      }
    }
  } else if (args && typeof args === 'object') {
    if (Array.isArray(args.strings)) {
      candidates.push(args.strings.join(' '));
    }
    if (Array.isArray(args.values)) {
      for (const val of args.values) {
        if (typeof val === 'string') candidates.push(val);
        else if (val && typeof val === 'object') {
          candidates.push(...extractStringsFromObject(val));
        }
      }
    }
  }
  return candidates;
}

// ==============================================================================
// 4. INSPECTION & CIRCUIT BREAKER
// ==============================================================================
function inspectPayload(rawString, context = '') {
  if (typeof rawString !== 'string' || !rawString) return;
  const normalized = normalizeString(rawString);

  for (const [patternName, regex] of Object.entries(SQL_PATTERNS)) {
    if (regex.test(normalized)) {
      try {
        auditLogger.logSecurityEvent('DANGEROUS_SQL_QUERY_BLOCKED', {
          severity: 'CRITICAL',
          details: {
            context,
            pattern: patternName,
            querySnippet: normalized.substring(0, 100)
          }
        });
        threatAlerter.dispatchAlert('DANGEROUS_SQL_QUERY_BLOCKED', {
          title: `SQL Injection / Circuit Breaker Triggered (${patternName})`,
          details: `Query blocked in context ${context}`,
          severity: 'CRITICAL',
          category: 'DATABASE_SECURITY'
        });
      } catch (_) {}

      throw new QueryIntegrityViolationError('DATABASE_OPERATION_FAILED', {
        pattern: patternName,
        context
      });
    }
  }
}

function assertSafeQueryArgs(args, context = '') {
  if (!args) return;
  const strings = extractStringsFromObject(args);
  for (const str of strings) {
    inspectPayload(str, context);
  }
}

function assertSafeRawQuery(args, context = '') {
  const candidates = extractRawQueryCandidates(args);
  for (const c of candidates) {
    inspectPayload(c, context);
  }
}

// ==============================================================================
// 5. ERROR SANITIZATION & SCHEMAS CLOAKING
// ==============================================================================
function isDatabaseError(err) {
  if (!err) return false;
  if (err instanceof DatabaseOperationError || err instanceof QueryIntegrityViolationError) return true;
  if (err.isDatabaseError === true) return true;

  if (PrismaPackage) {
    if (
      err instanceof PrismaPackage.PrismaClientKnownRequestError ||
      err instanceof PrismaPackage.PrismaClientUnknownRequestError ||
      err instanceof PrismaPackage.PrismaClientRustPanicError ||
      err instanceof PrismaPackage.PrismaClientInitializationError ||
      err instanceof PrismaPackage.PrismaClientValidationError
    ) {
      return true;
    }
  }

  if (err.name && (err.name.startsWith('Prisma') || err.name.includes('Prisma'))) return true;
  if (typeof err.code === 'string' && /^P\d{4}$/.test(err.code)) return true;

  if (typeof err.message === 'string') {
    const msg = err.message.toLowerCase();
    if (
      msg.includes('relation "') ||
      msg.includes('table ') ||
      msg.includes('column ') ||
      msg.includes('foreign key constraint') ||
      msg.includes('unique constraint') ||
      msg.includes('duplicate key') ||
      msg.includes('prismaclient') ||
      msg.includes('syntax error at or near') ||
      msg.includes('pg_') ||
      msg.includes('postgresql') ||
      msg.includes('database_operation_failed')
    ) {
      return true;
    }
  }

  return false;
}

function sanitizeDbError(err, context = '') {
  if (!err) return new DatabaseOperationError();
  if (err instanceof QueryIntegrityViolationError || err.breachCode === 'QUERY_INTEGRITY_VIOLATION') {
    return err;
  }
  if (err instanceof DatabaseOperationError) {
    return err;
  }

  try {
    auditLogger.logSecurityEvent('DATABASE_ERROR_SANITIZED', {
      severity: 'WARNING',
      details: {
        context,
        originalName: err.name,
        originalCode: err.code || 'UNKNOWN',
        sanitizedCode: 'DATABASE_OPERATION_FAILED'
      }
    });
  } catch (_) {}

  const sanitized = new DatabaseOperationError('DATABASE_OPERATION_FAILED', 'DATABASE_OPERATION_FAILED');
  sanitized.originalCode = err.code;
  sanitized.originalName = err.name;
  return sanitized;
}

// ==============================================================================
// 6. PRISMA CLIENT EXTENSION & PROXY WRAPPER
// ==============================================================================
function withDbGuard(prismaClient) {
  if (!prismaClient) return prismaClient;

  // Use native Prisma Client Extensions if available
  if (typeof prismaClient.$extends === 'function') {
    return prismaClient.$extends({
      name: 'dbGuardExtension',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            assertSafeQueryArgs(args, `${model}.${operation}`);
            try {
              return await query(args);
            } catch (err) {
              throw sanitizeDbError(err, `${model}.${operation}`);
            }
          }
        },
        async $queryRaw({ args, query }) {
          assertSafeRawQuery(args, '$queryRaw');
          try {
            return await query(args);
          } catch (err) {
            throw sanitizeDbError(err, '$queryRaw');
          }
        },
        async $queryRawUnsafe({ args, query }) {
          assertSafeRawQuery(args, '$queryRawUnsafe');
          try {
            return await query(args);
          } catch (err) {
            throw sanitizeDbError(err, '$queryRawUnsafe');
          }
        },
        async $executeRaw({ args, query }) {
          assertSafeRawQuery(args, '$executeRaw');
          try {
            return await query(args);
          } catch (err) {
            throw sanitizeDbError(err, '$executeRaw');
          }
        },
        async $executeRawUnsafe({ args, query }) {
          assertSafeRawQuery(args, '$executeRawUnsafe');
          try {
            return await query(args);
          } catch (err) {
            throw sanitizeDbError(err, '$executeRawUnsafe');
          }
        }
      }
    });
  }

  // Fallback: Proxy wrapper for mocked objects in isolated test environments
  return createProxyGuard(prismaClient);
}

function createProxyGuard(target) {
  return new Proxy(target, {
    get(obj, prop) {
      const orig = obj[prop];
      if (['$queryRaw', '$queryRawUnsafe', '$executeRaw', '$executeRawUnsafe'].includes(prop)) {
        return async function (...args) {
          assertSafeRawQuery(args, prop);
          try {
            return await orig.apply(obj, args);
          } catch (err) {
            throw sanitizeDbError(err, prop);
          }
        };
      }
      if (typeof orig === 'object' && orig !== null) {
        return new Proxy(orig, {
          get(modelObj, method) {
            const modelMethod = modelObj[method];
            if (typeof modelMethod === 'function') {
              return async function (...args) {
                assertSafeQueryArgs(args[0], `${String(prop)}.${String(method)}`);
                try {
                  return await modelMethod.apply(modelObj, args);
                } catch (err) {
                  throw sanitizeDbError(err, `${String(prop)}.${String(method)}`);
                }
              };
            }
            return modelMethod;
          },
          set(modelObj, method, value) {
            modelObj[method] = value;
            return true;
          }
        });
      }
      return orig;
    },
    set(obj, prop, value) {
      obj[prop] = value;
      return true;
    }
  });
}

// ==============================================================================
// 7. EXPRESS ERROR HANDLER MIDDLEWARE
// ==============================================================================
function dbGuardErrorMiddleware(err, req, res, next) {
  if (isDatabaseError(err) || (err && (err.code === 'DATABASE_OPERATION_FAILED' || err.breachCode === 'QUERY_INTEGRITY_VIOLATION'))) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: 'DATABASE_OPERATION_FAILED',
      code: 'DATABASE_OPERATION_FAILED'
    });
  }
  next(err);
}

module.exports = {
  withDbGuard,
  isDatabaseError,
  sanitizeDbError,
  assertSafeQueryArgs,
  assertSafeRawQuery,
  inspectPayload,
  normalizeString,
  dbGuardErrorMiddleware,
  DatabaseOperationError,
  QueryIntegrityViolationError,
  SQL_PATTERNS
};
