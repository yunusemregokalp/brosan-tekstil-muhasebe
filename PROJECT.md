# Project: Phase 8 Sovereign Quantum Vault & Zero-Knowledge Autonomous Immunity

## Architecture
Phase 8 implements autonomous defense mechanisms for Brosan Tekstil ERP Muhasebe system (`https://brosangroup.com/muhasebe`):
1. **Process Sandboxing (`server/processSandboxing.js`)**: Runtime interception of Node.js `child_process` methods (`exec`, `execSync`, `spawn`, `spawnSync`, `fork`, `execFile`, `execFileSync`) with `AsyncLocalStorage` request boundary tracking. Unauthorized execution attempts within request scope throw `SECURITY_PROCESS_BLOCKED`.
2. **Honeyfiles Deception Mesh (`server/honeyFiles.js`)**: Early-mounted Express middleware trapping hostile probe paths (`/.git/config`, `/.aws/credentials`, `id_rsa`, `dump.sql`, `backup.tar.gz`) returning HTTP 403 `CANARY_TRIGGERED`, dispatching alerts via `threatAlerter`, and locking offending IPs into 24-hour dynamic quarantine via `quarantineEngine`.
3. **Zero-Knowledge Memory Scrubbing (`server/cryptoVault.js`, `server/auth.js`)**: Hardware/runtime `Buffer.fill(0)` memory wiping on decrypted data buffers, IVs, auth tags, and tokens immediately after use to eliminate RAM dump/cold boot data leakage.
4. **Master Citadel Test Harness (`tests/test-phase8-citadel.js`, `tests/run-all-tests.js`)**: 20+ assertions validating all Phase 8 vectors, integrated as Suite 17 into the master test runner with 100% pass across all 17 suites and zero cross-suite quarantine pollution.
5. **Coolify Production Deployment**: Containerized deployment on VPS 173.249.23.10 under non-root UID 1000 (`node`), verified via live HTTP probes on `/api/health` and `/callcenter/landing`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Process Sandboxing Runtime Interception | Monkey-patch all 7 child_process methods with AsyncLocalStorage and privileged token bypass | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Sandboxing Alerting & Logging | Dispatch CRITICAL alert via threatAlerter and log to SIEM via auditLogger | M1 | Survey Explorer 1 |
| 3 | Honeyfiles Deception Mesh | Intercept sensitive lure endpoints with HTTP 403 CANARY_TRIGGERED | M2 | ORIGINAL_REQUEST §R2 |
| 4 | Dynamic 24-Hour Quarantine for Honeyfiles | Enforce 24-hour (86,400,000 ms) IP quarantine in quarantineEngine | M2 | ORIGINAL_REQUEST §R2 |
| 5 | CryptoVault Buffer Zeroization Hardening | Scrub IV, authTag, and ciphertext in finally block; add withDecryptedBuffer and zeroizeAll | M3 | ORIGINAL_REQUEST §R3 |
| 6 | Master Key & Credential Sanitization | Wipe master keys on rotation/reset; sever password and rawBody post-authentication | M3 | ORIGINAL_REQUEST §R3 |
| 7 | Supporting Module Memory Scrubbing | Zeroize secretBuffer in totp.js and signature buffers in requestSignature.js | M3 | Survey Explorer 2 |
| 8 | Phase 8 Master Penetration Test Suite | 20+ assertions validating sandboxing, honeypots, zeroization, Express integration | M4 | ORIGINAL_REQUEST §R4 |
| 9 | Suite 17 Integration & Pollution Elimination | Integrate into tests/run-all-tests.js and clean up test fixtures (no residual quarantined IPs) | M4 | ORIGINAL_REQUEST §R4 |
| 10 | Coolify Production Container Deployment | Deploy to VPS 173.249.23.10 under non-root UID 1000 (node) | M5 | ORIGINAL_REQUEST §R5 |
| 11 | Live Health & Zero-Regression Verification | Verify /muhasebe/api/health (HTTP 200) and /callcenter/landing (HTTP 200) | M5 | ORIGINAL_REQUEST §R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Process Sandboxing & Alerting | server/processSandboxing.js, server/threatAlerter.js | None | PLANNED |
| M2 | Honeyfiles Deception Mesh Hardening | server/honeyFiles.js | M1 | PLANNED |
| M3 | Ephemeral Zero-Knowledge Memory Scrubbing | server/cryptoVault.js, server/auth.js, server/index.js, server/totp.js, server/requestSignature.js | None | PLANNED |
| M4 | Test Suite Hardening & Suite 17 Validation | tests/test-phase8-citadel.js, tests/run-all-tests.js | M1, M2, M3 | PLANNED |
| M5 | Coolify Production Deployment & Live Probes | VPS 173.249.23.10 Coolify deployment, live probe script | M4 | PLANNED |
