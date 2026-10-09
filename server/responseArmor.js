/**
 * BROSAN TEKSTİL ERP — SOVEREIGN APEX CITADEL HARDENING (PHASE 7)
 * Layer 3: Advanced HTTP Response Security Armor & Subresource Defense
 * (server/responseArmor.js)
 * 
 * Features:
 * - Cross-Origin-Opener-Policy (COOP): same-origin
 * - Cross-Origin-Embedder-Policy (COEP): require-corp
 * - Cross-Origin-Resource-Policy (CORP): same-origin
 * - Permissions-Policy (Feature Policy): camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=(), screen-wake-lock=()
 * - Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0 on all /api/* routes
 * - Total Server Cloaking: suppression of X-Powered-By, Server, X-AspNet-Version, X-Runtime headers
 */

const ARMOR_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=(), screen-wake-lock=()'
};

const STRIPPED_HEADERS = [
  'x-powered-by',
  'server',
  'x-aspnet-version',
  'x-runtime',
  'x-server'
];

let armorOptions = {
  coop: 'same-origin',
  coep: 'require-corp',
  corp: 'same-origin',
  permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=(), screen-wake-lock=()',
  apiCacheControl: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
};

function getArmorHeaders() {
  return { ...ARMOR_HEADERS };
}

function setArmorOptions(opts = {}) {
  armorOptions = { ...armorOptions, ...opts };
}

function isApiOrAuthenticatedRoute(req) {
  if (!req) return false;
  const path = (req.originalUrl || req.url || '').toLowerCase();
  if (path.startsWith('/api') || path.startsWith('/muhasebe/api')) {
    return true;
  }
  if (req.headers && req.headers.authorization) {
    return true;
  }
  if (req.user) {
    return true;
  }
  return false;
}

/**
 * Response Armor Express Middleware
 */
function responseArmorGuard(req, res, next) {
  // Apply mandatory Cross-Origin and Permissions headers
  res.setHeader('Cross-Origin-Opener-Policy', armorOptions.coop);
  res.setHeader('Cross-Origin-Embedder-Policy', armorOptions.coep);
  res.setHeader('Cross-Origin-Resource-Policy', armorOptions.corp);
  res.setHeader('Permissions-Policy', armorOptions.permissionsPolicy);

  // Apply strict Cache-Control on API & authenticated routes
  if (isApiOrAuthenticatedRoute(req)) {
    res.setHeader('Cache-Control', armorOptions.apiCacheControl);
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  // Strip server & technology identification headers
  for (const header of STRIPPED_HEADERS) {
    res.removeHeader(header);
  }

  // Intercept writeHead and end to guarantee headers cannot be re-injected
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    for (const header of STRIPPED_HEADERS) {
      res.removeHeader(header);
    }
    res.setHeader('Cross-Origin-Opener-Policy', armorOptions.coop);
    res.setHeader('Cross-Origin-Embedder-Policy', armorOptions.coep);
    res.setHeader('Cross-Origin-Resource-Policy', armorOptions.corp);
    res.setHeader('Permissions-Policy', armorOptions.permissionsPolicy);

    if (isApiOrAuthenticatedRoute(req)) {
      res.setHeader('Cache-Control', armorOptions.apiCacheControl);
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    return originalWriteHead.apply(this, args);
  };

  next();
}

module.exports = {
  responseArmorGuard,
  responseArmor: responseArmorGuard,
  getArmorHeaders,
  setArmorOptions,
  ARMOR_HEADERS
};
