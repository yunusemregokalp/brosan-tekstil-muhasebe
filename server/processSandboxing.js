/**
 * BROSAN TEKSTİL ERP — PROCESS RUNTIME SANDBOX & EXECUTION LOCKDOWN
 * Phase 8 Sovereign Quantum Vault Module
 *
 * Enforces zero-tolerance child process execution restrictions.
 * Intercepts child_process.exec, spawn, fork, execFile and terminates unauthorized
 * process spawning attempts triggered by RCE exploits, deserialization attacks,
 * or compromised npm dependencies during HTTP request processing.
 */

const childProcess = require('child_process');
const { AsyncLocalStorage } = require('async_hooks');
const crypto = require('crypto');

// Async Context Storage for tracking HTTP request execution trees
const asyncLocalStorage = new AsyncLocalStorage();

// Internal Privileged Token for authorized internal administrative operations
const PRIVILEGED_TOKEN = crypto.randomBytes(32).toString('hex');

// Store original pristine child_process functions
const originalMethods = {
  exec: childProcess.exec,
  execSync: childProcess.execSync,
  spawn: childProcess.spawn,
  spawnSync: childProcess.spawnSync,
  fork: childProcess.fork,
  execFile: childProcess.execFile,
  execFileSync: childProcess.execFileSync
};

let isGlobalLockdownEnabled = false;
let violationCount = 0;
const violationLog = [];

/**
 * Validates whether execution is permitted.
 * Throws an Error if invoked within a sandboxed HTTP request or under global lockdown.
 */
function checkExecutionPermission(methodName, commandOrFile, args) {
  const store = asyncLocalStorage.getStore();
  const inRequestContext = Boolean(store && store.isHttpRequest);

  if (isGlobalLockdownEnabled || inRequestContext) {
    violationCount++;
    const violation = {
      timestamp: new Date().toISOString(),
      method: methodName,
      target: typeof commandOrFile === 'string' ? commandOrFile.slice(0, 100) : 'unknown',
      inHttpRequest: inRequestContext,
      clientIp: store ? store.clientIp : null,
      requestId: store ? store.requestId : null
    };

    violationLog.push(violation);
    if (violationLog.length > 100) violationLog.shift();

    // Trigger threat alerter & SIEM log if available
    try {
      const { threatAlerter } = require('./threatAlerter');
      if (threatAlerter && typeof threatAlerter.alertEmergency === 'function') {
        threatAlerter.alertEmergency(
          'RCE_PROCESS_SPAWN_ATTEMPT_BLOCKED',
          store ? store.clientIp : '127.0.0.1',
          `Method: ${methodName}, Target: ${violation.target}`
        );
      }
    } catch (_) {}

    try {
      const { quarantineEngine } = require('./quarantine');
      if (store && store.clientIp && quarantineEngine && typeof quarantineEngine.quarantineIp === 'function') {
        quarantineEngine.quarantineIp(store.clientIp, 'RCE_PROCESS_SPAWN_VIOLATION');
      }
    } catch (_) {}

    const err = new Error(`Security Violation: Execution of external process via ${methodName} is strictly prohibited.`);
    err.code = 'SECURITY_PROCESS_BLOCKED';
    err.method = methodName;
    err.target = violation.target;
    throw err;
  }
}

/**
 * Initializes runtime monkey-patching of child_process primitives.
 */
function installSandboxing() {
  childProcess.exec = function (command, ...rest) {
    checkExecutionPermission('exec', command);
    return originalMethods.exec.call(this, command, ...rest);
  };

  childProcess.execSync = function (command, ...rest) {
    checkExecutionPermission('execSync', command);
    return originalMethods.execSync.call(this, command, ...rest);
  };

  childProcess.spawn = function (command, args, ...rest) {
    checkExecutionPermission('spawn', command, args);
    return originalMethods.spawn.call(this, command, args, ...rest);
  };

  childProcess.spawnSync = function (command, args, ...rest) {
    checkExecutionPermission('spawnSync', command, args);
    return originalMethods.spawnSync.call(this, command, args, ...rest);
  };

  childProcess.fork = function (modulePath, args, ...rest) {
    checkExecutionPermission('fork', modulePath, args);
    return originalMethods.fork.call(this, modulePath, args, ...rest);
  };

  childProcess.execFile = function (file, args, ...rest) {
    checkExecutionPermission('execFile', file, args);
    return originalMethods.execFile.call(this, file, args, ...rest);
  };

  childProcess.execFileSync = function (file, args, ...rest) {
    checkExecutionPermission('execFileSync', file, args);
    return originalMethods.execFileSync.call(this, file, args, ...rest);
  };
}

// Automatically install hooks on module load
installSandboxing();

/**
 * Express Middleware: Wraps request execution in an AsyncLocalStorage sandbox.
 * Guarantees that any asynchronous code executed as part of this request cannot spawn child processes.
 */
function processSandboxMiddleware(req, res, next) {
  const clientIp = (req && req.headers && req.headers['x-forwarded-for']) || (req && req.socket && req.socket.remoteAddress) || '127.0.0.1';
  const requestId = crypto.randomBytes(8).toString('hex');

  asyncLocalStorage.run({ isHttpRequest: true, clientIp, requestId, path: req.path }, () => {
    next();
  });
}

/**
 * Enables strict global process lockdown (disallows child_process entirely across the application).
 */
function enableGlobalLockdown() {
  isGlobalLockdownEnabled = true;
}

/**
 * Disables strict global process lockdown (leaves HTTP request-level sandboxing intact).
 */
function disableGlobalLockdown() {
  isGlobalLockdownEnabled = false;
}

/**
 * Executes a privileged system block bypassing sandbox restrictions (requires private token).
 */
function runPrivileged(token, fn) {
  if (token !== PRIVILEGED_TOKEN) {
    throw new Error('Invalid Privileged Token');
  }
  const wasGlobal = isGlobalLockdownEnabled;
  isGlobalLockdownEnabled = false;
  try {
    return asyncLocalStorage.run({ isHttpRequest: false }, fn);
  } finally {
    isGlobalLockdownEnabled = wasGlobal;
  }
}

/**
 * Returns current sandboxing status and statistics.
 */
function getStatus() {
  return {
    isGlobalLockdownEnabled,
    violationCount,
    recentViolations: [...violationLog],
    hookedMethods: Object.keys(originalMethods)
  };
}

/**
 * Resets state for testing purposes.
 */
function resetForTesting() {
  isGlobalLockdownEnabled = false;
  violationCount = 0;
  violationLog.length = 0;
}

module.exports = {
  processSandboxMiddleware,
  enableGlobalLockdown,
  disableGlobalLockdown,
  runPrivileged,
  getStatus,
  resetForTesting,
  PRIVILEGED_TOKEN
};
