/**
 * BROSAN TEKSTİL ERP — SOVEREIGN CITADEL HARDENING
 * Layer 1: Deep Egress Firewall & SSRF / Data Exfiltration Armor (Phase 6 - Requirement R1)
 * 
 * Features:
 * - 3-Layer Outbound Interception Architecture:
 *     Layer 1: High-level API wrappers (globalThis.fetch, http.request, http.get, https.request, https.get)
 *     Layer 2: DNS resolution hook (dns.lookup) preventing DNS rebinding attacks
 *     Layer 3: Low-level transport socket hook (net.Socket.prototype.connect)
 * - Prohibited IP Ranges:
 *     - Cloud Metadata: 169.254.169.254, 169.254.0.0/16
 *     - RFC 1918 Private Ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
 *     - Loopbacks: 127.0.0.0/8, ::1, localhost (except auto-registered in-process selfPorts)
 *     - IPv6 Link-Local (fe80::/10), Unique Local (fc00::/7), CGNAT (100.64.0.0/10)
 *     - Broadcast / Unspecified: 0.0.0.0/8, 255.255.255.255, ::
 *     - Normalized IPv4-mapped IPv6 (::ffff:169.254.169.254, ::ffff:127.0.0.1)
 *     - Normalized decimal/hex integer IP representations
 * - Tiered Whitelisting:
 *     1. Static: Telegram API (api.telegram.org:443), TCMB endpoints (tcmb.gov.tr, etc.)
 *     2. Dynamic: process.env.SECURITY_WEBHOOK_URL, process.env.DATABASE_URL, process.env.EGRESS_WHITELIST
 *     3. In-process server self-ports (selfPorts) automatically registered via http.Server.prototype.listen
 *     4. Programmatic whitelist management via addWhitelist(host, port)
 * - Anti-Exfiltration & SIEM Alerting:
 *     - Aborts prohibited calls immediately with err.code = 'EGRESS_PROHIBITED'
 *     - Appends CRITICAL security events to logs/security-audit.log
 *     - Dispatches alerts via threatAlerter with recursion mutex lock (isAlerting)
 * - Idempotent lifecycle management (install, uninstall, reset)
 */

const http = require('http');
const https = require('https');
const net = require('net');
const dns = require('dns');
const url = require('url');
const EventEmitter = require('events');

let auditLogger = null;
try {
  auditLogger = require('./auditLogger');
} catch (_) {}

let threatAlerter = null;
try {
  threatAlerter = require('./threatAlerter');
} catch (_) {}

// Static Whitelisted Destinations
const STATIC_WHITELIST = new Map([
  ['api.telegram.org', [443]],
  ['tcmb.gov.tr', [80, 443]],
  ['www.tcmb.gov.tr', [80, 443]],
  ['evds2.tcmb.gov.tr', [80, 443]]
]);

/**
 * Parses IPv4 dotted-quad into 32-bit unsigned integer.
 */
function ipv4ToLong(ip) {
  if (!ip || typeof ip !== 'string') return null;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;
  let res = 0;
  for (let i = 0; i < 4; i++) {
    const n = Number(parts[i]);
    if (isNaN(n) || n < 0 || n > 255 || parts[i].trim() === '') return null;
    res = ((res << 8) + n) >>> 0;
  }
  return res;
}

/**
 * Normalizes host representation to standard hostname or dotted-quad IP.
 * Handles IPv4-mapped IPv6, bracketed IPv6, and integer/hex IPs.
 */
function normalizeHost(rawHost) {
  if (!rawHost || typeof rawHost !== 'string') return '';
  let host = rawHost.trim().toLowerCase();

  // Strip brackets from IPv6: [::1] -> ::1
  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1);
  }

  // Strip IPv4-mapped IPv6 prefix: ::ffff:127.0.0.1 -> 127.0.0.1
  if (host.startsWith('::ffff:')) {
    host = host.slice(7);
  }

  // Check for 32-bit decimal integer IP (e.g. 2130706433 -> 127.0.0.1)
  if (/^\d{1,10}$/.test(host)) {
    const num = parseInt(host, 10);
    if (num >= 0 && num <= 4294967295) {
      return [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255
      ].join('.');
    }
  }

  // Check for hexadecimal IP (e.g. 0x7f000001 -> 127.0.0.1)
  if (/^0x[0-9a-f]{1,8}$/i.test(host)) {
    const num = parseInt(host, 16);
    if (!isNaN(num) && num >= 0 && num <= 4294967295) {
      return [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255
      ].join('.');
    }
  }

  return host;
}

class EgressFirewall {
  constructor(options = {}) {
    this.whitelist = new Map(STATIC_WHITELIST); // host -> [ports] (empty array means all ports)
    this.selfPorts = new Set();                 // In-process server listening ports
    this.isInstalled = false;
    this.isAlerting = false;                    // Recursion mutex lock
    this._blockAllLoopbacks = false;            // Test override flag

    // Original bindings
    this._origFetch = null;
    this._origHttpRequest = null;
    this._origHttpGet = null;
    this._origHttpsRequest = null;
    this._origHttpsGet = null;
    this._origSocketConnect = null;
    this._origDnsLookup = null;
    this._origServerListen = null;

    this._initDynamicWhitelist();
  }

  _initDynamicWhitelist() {
    // 1. SECURITY_WEBHOOK_URL
    if (process.env.SECURITY_WEBHOOK_URL) {
      try {
        const u = new url.URL(process.env.SECURITY_WEBHOOK_URL);
        const port = u.port ? parseInt(u.port, 10) : (u.protocol === 'https:' ? 443 : 80);
        this.addWhitelist(u.hostname, port);
      } catch (_) {}
    }

    // 2. DATABASE_URL
    if (process.env.DATABASE_URL) {
      try {
        const u = new url.URL(process.env.DATABASE_URL);
        if (u.hostname) {
          const port = u.port ? parseInt(u.port, 10) : 5432;
          this.addWhitelist(u.hostname, port);
        }
      } catch (_) {}
    }

    // 3. EGRESS_WHITELIST (comma-separated entries like "api.example.com:443,rates.bank.org")
    if (process.env.EGRESS_WHITELIST) {
      const items = process.env.EGRESS_WHITELIST.split(',');
      for (const item of items) {
        const trimmed = item.trim();
        if (!trimmed) continue;
        const [h, p] = trimmed.split(':');
        this.addWhitelist(h, p ? parseInt(p, 10) : null);
      }
    }
  }

  addWhitelist(hostPattern, port = null) {
    if (!hostPattern) return;
    const norm = normalizeHost(hostPattern);
    const existing = this.whitelist.get(norm) || [];
    if (port !== null && port !== undefined) {
      const pNum = Number(port);
      if (!existing.includes(pNum)) existing.push(pNum);
    }
    this.whitelist.set(norm, existing);
  }

  removeWhitelist(hostPattern) {
    if (!hostPattern) return;
    const norm = normalizeHost(hostPattern);
    this.whitelist.delete(norm);
  }

  registerSelfPort(port) {
    if (port && Number.isInteger(Number(port))) {
      this.selfPorts.add(Number(port));
    }
  }

  unregisterSelfPort(port) {
    if (port) {
      this.selfPorts.delete(Number(port));
    }
  }

  blockAllLoopbacks(enable = true) {
    this._blockAllLoopbacks = Boolean(enable);
  }

  /**
   * Inspects a normalized host/IP and destination port against egress rules.
   * Returns { allowed: boolean, reason?: string, target: string }
   */
  checkEgress(rawHost, rawPort = 80) {
    const host = normalizeHost(rawHost);
    const port = rawPort ? Number(rawPort) : 80;
    const target = `${host}:${port}`;

    if (!host) {
      return { allowed: false, reason: 'INVALID_EMPTY_DESTINATION', target };
    }

    // 1. Loopback Address Checks
    const isLoopback = (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.startsWith('127.')
    );

    if (isLoopback) {
      if (this._blockAllLoopbacks) {
        return { allowed: false, reason: 'LOOPBACK_PROHIBITED', target };
      }
      // Check if destination port is an auto-registered in-process test server port
      if (this.selfPorts.has(port)) {
        return { allowed: true, reason: 'IN_PROCESS_SELF_PORT', target };
      }
      return { allowed: false, reason: 'LOOPBACK_PROHIBITED', target };
    }

    // 2. Prohibited IPv4 Subnet Check
    const ipLong = ipv4ToLong(host);
    if (ipLong !== null) {
      // Cloud Metadata: 169.254.0.0/16 (covers 169.254.169.254)
      if ((ipLong & 0xFFFF0000) === 0xA9FE0000) {
        return { allowed: false, reason: 'CLOUD_METADATA_PROHIBITED', target };
      }

      // Loopback: 127.0.0.0/8
      if ((ipLong & 0xFF000000) === 0x7F000000) {
        if (this._blockAllLoopbacks || !this.selfPorts.has(port)) {
          return { allowed: false, reason: 'LOOPBACK_PROHIBITED', target };
        }
        return { allowed: true, reason: 'IN_PROCESS_SELF_PORT', target };
      }

      // RFC 1918 Private Subnets:
      // 10.0.0.0/8
      if ((ipLong & 0xFF000000) === 0x0A000000) {
        return { allowed: false, reason: 'PRIVATE_IP_PROHIBITED', target };
      }
      // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
      if ((ipLong & 0xFFF00000) === 0xAC100000) {
        return { allowed: false, reason: 'PRIVATE_IP_PROHIBITED', target };
      }
      // 192.168.0.0/16
      if ((ipLong & 0xFFFF0000) === 0xC0A80000) {
        return { allowed: false, reason: 'PRIVATE_IP_PROHIBITED', target };
      }

      // Carrier Grade NAT: 100.64.0.0/10
      if ((ipLong & 0xFFC00000) === 0x64400000) {
        return { allowed: false, reason: 'PRIVATE_IP_PROHIBITED', target };
      }

      // Broadcast / Unspecified: 0.0.0.0/8 or 255.255.255.255
      if ((ipLong & 0xFF000000) === 0 || ipLong === 0xFFFFFFFF) {
        return { allowed: false, reason: 'PROHIBITED_IP', target };
      }
    }

    // 3. Prohibited IPv6 Checks
    if (host.includes(':')) {
      // IPv6 Link-Local: fe80::/10
      if (/^fe[89ab][0-9a-f]:/i.test(host)) {
        return { allowed: false, reason: 'PRIVATE_IP_PROHIBITED', target };
      }
      // IPv6 Unique Local: fc00::/7 (fc00:: - fdff::)
      if (/^f[cd][0-9a-f]{2}:/i.test(host)) {
        return { allowed: false, reason: 'PRIVATE_IP_PROHIBITED', target };
      }
    }

    // 4. Whitelist Verification (Exact match, Wildcard subdomain match)
    if (this.isWhitelisted(host, port)) {
      return { allowed: true, reason: 'WHITELISTED', target };
    }

    return { allowed: false, reason: 'NON_WHITELISTED_DESTINATION', target };
  }

  isWhitelisted(host, port) {
    const norm = normalizeHost(host);
    const pNum = Number(port);

    // Exact hostname match
    if (this.whitelist.has(norm)) {
      const ports = this.whitelist.get(norm);
      if (!ports || ports.length === 0 || ports.includes(pNum)) {
        return true;
      }
    }

    // Wildcard subdomain check (*.tcmb.gov.tr or tcmb.gov.tr matches sub.tcmb.gov.tr)
    for (const [wHost, ports] of this.whitelist.entries()) {
      if (wHost.startsWith('*.')) {
        const rootDomain = wHost.slice(2);
        if (norm.endsWith('.' + rootDomain) || norm === rootDomain) {
          if (!ports || ports.length === 0 || ports.includes(pNum)) return true;
        }
      } else if (norm.endsWith('.' + wHost)) {
        if (!ports || ports.length === 0 || ports.includes(pNum)) return true;
      }
    }

    return false;
  }

  isAllowed(targetHost, targetPort) {
    return this.checkEgress(targetHost, targetPort).allowed;
  }

  createEgressError(check, protocol = 'TCP') {
    const err = new Error(`EGRESS_PROHIBITED: Outbound connection to ${check.target} is blocked by Egress Firewall (${check.reason})`);
    err.code = 'EGRESS_PROHIBITED';
    err.reason = check.reason;
    err.target = check.target;
    err.protocol = protocol;
    return err;
  }

  recordViolation(check, protocol = 'TCP') {
    // 1. SIEM Security Audit Logging
    try {
      if (auditLogger && typeof auditLogger.logSecurityEvent === 'function') {
        auditLogger.logSecurityEvent('EGRESS_PROHIBITED', {
          severity: 'CRITICAL',
          status: 403,
          clientIp: 'SYSTEM',
          details: {
            target: check.target,
            protocol,
            reason: check.reason
          }
        });
      }
    } catch (_) {}

    // 2. Threat Alerter Dispatch with recursion mutex lock
    if (!this.isAlerting && threatAlerter && typeof threatAlerter.dispatchAlert === 'function') {
      this.isAlerting = true;
      try {
        threatAlerter.dispatchAlert('EGRESS_PROHIBITED', {
          clientIp: 'SYSTEM',
          severity: 'CRITICAL',
          summary: `🛑 Yetkisiz dış bağlantı engellendi: ${check.target} (${check.reason})`,
          details: {
            target: check.target,
            protocol,
            reason: check.reason
          }
        });
      } catch (_) {
      } finally {
        this.isAlerting = false;
      }
    }
  }

  /**
   * Installs 3-layer outbound interception hooks.
   */
  install() {
    if (this.isInstalled) return this;
    this.isInstalled = true;
    const self = this;

    // =========================================================================
    // LAYER 0: In-Process HTTP Server Listening Port Auto-Tracker
    // =========================================================================
    this._origServerListen = http.Server.prototype.listen;
    http.Server.prototype.listen = function (...args) {
      this.once('listening', () => {
        try {
          const addr = this.address();
          if (addr && typeof addr === 'object' && addr.port) {
            const portNum = Number(addr.port);
            self.registerSelfPort(portNum);
            this.once('close', () => {
              self.unregisterSelfPort(portNum);
            });
          }
        } catch (_) {}
      });
      return self._origServerListen.apply(this, args);
    };

    // =========================================================================
    // LAYER 1A: globalThis.fetch Wrapper
    // =========================================================================
    if (typeof globalThis.fetch === 'function') {
      this._origFetch = globalThis.fetch;
      globalThis.fetch = function egressInterceptedFetch(input, init) {
        try {
          let urlStr = '';
          if (typeof input === 'string') {
            urlStr = input;
          } else if (input && typeof input.href === 'string') {
            urlStr = input.href;
          } else if (input && typeof input.url === 'string') {
            urlStr = input.url;
          } else {
            urlStr = String(input);
          }

          const parsed = new url.URL(urlStr);
          const port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
          const check = self.checkEgress(parsed.hostname, port);

          if (!check.allowed) {
            self.recordViolation(check, parsed.protocol.replace(':', '').toUpperCase());
            const err = self.createEgressError(check, parsed.protocol.replace(':', '').toUpperCase());
            return Promise.reject(err);
          }
        } catch (e) {
          if (e.code === 'EGRESS_PROHIBITED') return Promise.reject(e);
          // If URL parsing fails, let native fetch handle invalid URL
        }

        return self._origFetch.call(globalThis, input, init);
      };
    }

    // =========================================================================
    // LAYER 1B: http.request & http.get Wrappers
    // =========================================================================
    this._origHttpRequest = http.request;
    this._origHttpGet = http.get;

    function wrapHttpMethod(origFn, isHttps = false) {
      return function (urlOrOptions, optionsOrCallback, maybeCallback) {
        let opts = {};
        let cb = null;

        if (typeof urlOrOptions === 'string' || (urlOrOptions && urlOrOptions.href)) {
          try {
            const parsed = new url.URL(typeof urlOrOptions === 'string' ? urlOrOptions : urlOrOptions.href);
            opts = {
              hostname: parsed.hostname,
              port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
              path: parsed.pathname + parsed.search
            };
          } catch (_) {}
          if (typeof optionsOrCallback === 'object') {
            opts = { ...opts, ...optionsOrCallback };
            cb = maybeCallback;
          } else if (typeof optionsOrCallback === 'function') {
            cb = optionsOrCallback;
          }
        } else if (typeof urlOrOptions === 'object') {
          opts = { ...urlOrOptions };
          if (typeof optionsOrCallback === 'function') cb = optionsOrCallback;
        }

        const host = opts.hostname || opts.host || 'localhost';
        const port = opts.port || (isHttps ? 443 : 80);
        const protocol = isHttps ? 'HTTPS' : 'HTTP';
        const check = self.checkEgress(host, port);

        if (!check.allowed) {
          self.recordViolation(check, protocol);
          const err = self.createEgressError(check, protocol);

          const reqEmitter = new EventEmitter();
          reqEmitter.write = function () { return reqEmitter; };
          reqEmitter.end = function () { return reqEmitter; };
          reqEmitter.abort = function () { return reqEmitter; };
          reqEmitter.destroy = function () { return reqEmitter; };
          reqEmitter.setTimeout = function () { return reqEmitter; };
          reqEmitter.setHeader = function () { return reqEmitter; };
          reqEmitter.getHeader = function () { return undefined; };

          if (cb) reqEmitter.on('response', cb);

          process.nextTick(() => {
            reqEmitter.emit('error', err);
          });
          return reqEmitter;
        }

        return origFn.call(isHttps ? https : http, urlOrOptions, optionsOrCallback, maybeCallback);
      };
    }

    http.request = wrapHttpMethod(this._origHttpRequest, false);
    http.get = wrapHttpMethod(this._origHttpGet, false);

    // =========================================================================
    // LAYER 1C: https.request & https.get Wrappers
    // =========================================================================
    this._origHttpsRequest = https.request;
    this._origHttpsGet = https.get;

    https.request = wrapHttpMethod(this._origHttpsRequest, true);
    https.get = wrapHttpMethod(this._origHttpsGet, true);

    // =========================================================================
    // LAYER 2: dns.lookup Hook (Anti-DNS Rebinding)
    // =========================================================================
    this._origDnsLookup = dns.lookup;
    dns.lookup = function egressDnsLookup(hostname, options, callback) {
      let cb = callback;
      let opts = options;
      if (typeof options === 'function') {
        cb = options;
        opts = {};
      }

      return self._origDnsLookup(hostname, opts, (err, addressOrAddresses, family) => {
        if (err) return cb(err, addressOrAddresses, family);

        // If lookup was for localhost / 127.0.0.1 / ::1, permit local resolution
        const normHostname = normalizeHost(hostname);
        const isLocalHost = (
          normHostname === 'localhost' ||
          normHostname === '127.0.0.1' ||
          normHostname === '::1' ||
          normHostname === '0.0.0.0'
        );

        if (isLocalHost) {
          return cb(null, addressOrAddresses, family);
        }

        function checkResolvedIp(addr) {
          const ipLong = ipv4ToLong(addr);
          if (ipLong !== null) {
            // Cloud metadata: 169.254.0.0/16
            if ((ipLong & 0xFFFF0000) === 0xA9FE0000) return 'CLOUD_METADATA_PROHIBITED';
            // Loopback rebinding
            if ((ipLong & 0xFF000000) === 0x7F000000) return 'LOOPBACK_REBINDING_PROHIBITED';
            // Private subnets
            if ((ipLong & 0xFF000000) === 0x0A000000) return 'PRIVATE_IP_PROHIBITED';
            if ((ipLong & 0xFFF00000) === 0xAC100000) return 'PRIVATE_IP_PROHIBITED';
            if ((ipLong & 0xFFFF0000) === 0xC0A80000) return 'PRIVATE_IP_PROHIBITED';
            if ((ipLong & 0xFFC00000) === 0x64400000) return 'PRIVATE_IP_PROHIBITED';
            if ((ipLong & 0xFF000000) === 0 || ipLong === 0xFFFFFFFF) return 'PROHIBITED_IP';
          }
          if (typeof addr === 'string' && addr.includes(':')) {
            if (addr === '::1') return 'LOOPBACK_REBINDING_PROHIBITED';
            if (/^fe[89ab][0-9a-f]:/i.test(addr)) return 'PRIVATE_IP_PROHIBITED';
            if (/^f[cd][0-9a-f]{2}:/i.test(addr)) return 'PRIVATE_IP_PROHIBITED';
          }
          return null;
        }

        // Handle array of addresses (options.all === true)
        if (Array.isArray(addressOrAddresses)) {
          for (const item of addressOrAddresses) {
            const reason = checkResolvedIp(item.address);
            if (reason) {
              const check = { target: `${hostname} -> ${item.address}`, reason };
              self.recordViolation(check, 'DNS');
              return cb(self.createEgressError(check, 'DNS'));
            }
          }
          return cb(null, addressOrAddresses, family);
        }

        // Handle single address
        if (typeof addressOrAddresses === 'string') {
          const reason = checkResolvedIp(addressOrAddresses);
          if (reason) {
            const check = { target: `${hostname} -> ${addressOrAddresses}`, reason };
            self.recordViolation(check, 'DNS');
            return cb(self.createEgressError(check, 'DNS'));
          }
        }

        return cb(null, addressOrAddresses, family);
      });
    };

    // =========================================================================
    // LAYER 3: net.Socket.prototype.connect Transport Hook
    // =========================================================================
    this._origSocketConnect = net.Socket.prototype.connect;
    net.Socket.prototype.connect = function (...args) {
      let normalizedHost = null;
      let normalizedPort = null;

      if (typeof args[0] === 'object' && args[0] !== null) {
        // connect(options, [cb])
        const opts = args[0];
        if (opts.path) {
          // IPC socket (local named pipe / unix socket) -> allow
          return self._origSocketConnect.apply(this, args);
        }
        normalizedHost = opts.host || 'localhost';
        normalizedPort = opts.port;
      } else if (typeof args[0] === 'number' || !isNaN(Number(args[0]))) {
        // connect(port, [host], [cb])
        normalizedPort = Number(args[0]);
        if (typeof args[1] === 'string') {
          normalizedHost = args[1];
        } else {
          normalizedHost = 'localhost';
        }
      }

      if (normalizedHost && normalizedPort) {
        const check = self.checkEgress(normalizedHost, normalizedPort);
        if (!check.allowed) {
          self.recordViolation(check, 'TCP');
          const err = self.createEgressError(check, 'TCP');
          this.destroy(err);
          process.nextTick(() => {
            this.emit('error', err);
          });
          return this;
        }
      }

      return self._origSocketConnect.apply(this, args);
    };

    return this;
  }

  /**
   * Uninstalls all hooks and restores native prototypes.
   */
  uninstall() {
    if (!this.isInstalled) return this;

    if (this._origServerListen) {
      http.Server.prototype.listen = this._origServerListen;
      this._origServerListen = null;
    }
    if (this._origFetch && typeof globalThis.fetch === 'function') {
      globalThis.fetch = this._origFetch;
      this._origFetch = null;
    }
    if (this._origHttpRequest) {
      http.request = this._origHttpRequest;
      this._origHttpRequest = null;
    }
    if (this._origHttpGet) {
      http.get = this._origHttpGet;
      this._origHttpGet = null;
    }
    if (this._origHttpsRequest) {
      https.request = this._origHttpsRequest;
      this._origHttpsRequest = null;
    }
    if (this._origHttpsGet) {
      https.get = this._origHttpsGet;
      this._origHttpsGet = null;
    }
    if (this._origDnsLookup) {
      dns.lookup = this._origDnsLookup;
      this._origDnsLookup = null;
    }
    if (this._origSocketConnect) {
      net.Socket.prototype.connect = this._origSocketConnect;
      this._origSocketConnect = null;
    }

    this.isInstalled = false;
    return this;
  }

  reset() {
    this.whitelist = new Map(STATIC_WHITELIST);
    this.selfPorts.clear();
    this._blockAllLoopbacks = false;
    this.isAlerting = false;
    this._initDynamicWhitelist();
  }
}

const defaultEgressFirewall = new EgressFirewall();

module.exports = {
  EgressFirewall,
  egressFirewall: defaultEgressFirewall
};
