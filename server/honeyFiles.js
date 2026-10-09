/**
 * BROSAN TEKSTİL ERP — HOSTILE INTRUSION DECEPTION MESH & DYNAMIC CANARY LURES
 * Phase 8 Sovereign Quantum Vault Module
 *
 * Implements high-fidelity deceptive honeypots at the file path and endpoint level.
 * Any request attempting to enumerate or exfiltrate common developer files,
 * cloud credentials, SSH keys, or database backups triggers immediate quarantine,
 * SIEM event registration, and threat escalation.
 */

const { quarantineEngine } = require('./quarantine');
const threatAlerter = require('./threatAlerter');
const { logSecurityEvent } = require('./auditLogger');

// High-fidelity deceptive honeypot patterns
const CANARY_PATTERNS = [
  // Git repositories & configurations
  /^\/(\.git|muhasebe\/\.git)(\/.*)?$/i,
  /^\/\.git\/config$/i,
  /^\/\.git\/HEAD$/i,
  /^\/\.git\/index$/i,

  // Cloud & AWS credentials
  /^\/(\.aws|muhasebe\/\.aws)(\/.*)?$/i,
  /^\/\.aws\/(credentials|config)$/i,
  /^\/(s3cfg|\.s3cfg)$/i,

  // Private SSH & TLS keys
  /^\/(id_rsa|id_dsa|id_ecdsa|id_ed25519)(\.pub)?$/i,
  /^\/\.ssh\/(id_rsa|id_ed25519|authorized_keys|known_hosts)$/i,
  /^\/(server\.key|privkey\.pem|cert\.key)$/i,

  // Database dumps & backups
  /^\/(dump|backup|database|db|backup_final[a-z0-9_-]*)(\.(sql|dump|tar|gz|zip|rdb|bak|tgz|tar\.gz))$/i,
  /^\/muhasebe\/(dump|backup|database|db[a-z0-9_-]*)(\.(sql|tar|gz|zip|tgz|tar\.gz))$/i,
  /^\/(users|customers|accounts|ledger[a-z0-9_-]*)(\.(sql|csv|xlsx|json))$/i,

  // Framework & server configuration secrets
  /^\/(web\.config|wp-config\.php|phpinfo\.php)$/i,
  /^\/\.env\.(backup|save|old|local|production|development|bak)$/i,
  /^\/\.docker\/config\.json$/i,
  /^\/Dockerfile(\.bak|\.old)?$/i
];

let tripwireHits = 0;
const canaryLog = [];

/**
 * Checks if a given URL matches any canary tripwire pattern.
 */
function isCanaryTarget(urlPath) {
  if (!urlPath || typeof urlPath !== 'string') return false;
  const cleanPath = urlPath.split('?')[0].trim();
  for (const pattern of CANARY_PATTERNS) {
    if (pattern.test(cleanPath)) {
      return true;
    }
  }
  return false;
}

/**
 * Express Middleware: Intercepts hostile reconnaissance and probing attempts on canary files.
 */
function honeyFilesGuard(req, res, next) {
  const rawPath = req.path || req.url || '';
  const clientIp = (req.headers && req.headers['x-forwarded-for']) || (req.socket && req.socket.remoteAddress) || '127.0.0.1';

  if (isCanaryTarget(rawPath)) {
    tripwireHits++;
    const incident = {
      timestamp: new Date().toISOString(),
      clientIp,
      path: rawPath,
      userAgent: req.headers['user-agent'] || 'unknown',
      method: req.method
    };

    canaryLog.push(incident);
    if (canaryLog.length > 100) canaryLog.shift();

    // 1. Instantly quarantine the offending IP (Mandatory 24-hour quarantine)
    if (!quarantineEngine.isWhitelisted(clientIp)) {
      quarantineEngine.quarantineIp(clientIp, 'CANARY_HONEYPOT_TRIPPED', {
        ttlMs: 86400000,
        durationSec: 86400,
        triggerPath: rawPath
      });
    }

    // 2. Dispatch high-priority emergency SIEM alert
    try {
      if (threatAlerter && typeof threatAlerter.dispatchAlert === 'function') {
        threatAlerter.dispatchAlert('CANARY_HONEYPOT_TRIPPED', {
          clientIp,
          severity: 'CRITICAL',
          details: {
            path: rawPath,
            method: req.method,
            userAgent: req.headers ? (req.headers['user-agent'] || 'unknown') : 'unknown',
            reason: 'Hostile path reconnaissance on canary lure'
          }
        });
      }
    } catch (_) {}

    // 3. Log security event
    try {
      if (typeof logSecurityEvent === 'function') {
        logSecurityEvent('CANARY_TRIPWIRE_TRIGGERED', {
          req,
          severity: 'CRITICAL',
          status: 403,
          clientIp,
          details: incident
        });
      }
    } catch (_) {}

    // 4. Return standard honeyfile rejection without leaking real file presence
    return res.status(403).json({
      success: false,
      error: 'Access Denied: Canary honeypot security tripwire activated.',
      code: 'CANARY_TRIGGERED',
      quarantined: true
    });
  }

  next();
}

/**
 * Returns canary tripwire metrics.
 */
function getCanaryMetrics() {
  return {
    tripwireHits,
    patternCount: CANARY_PATTERNS.length,
    recentHits: [...canaryLog]
  };
}

/**
 * Resets state for testing.
 */
function resetForTesting() {
  tripwireHits = 0;
  canaryLog.length = 0;
}

module.exports = {
  honeyFilesGuard,
  isCanaryTarget,
  getCanaryMetrics,
  resetForTesting,
  CANARY_PATTERNS
};
