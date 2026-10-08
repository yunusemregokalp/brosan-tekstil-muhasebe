# Project: Brosan Tekstil ERP Cybersecurity Hardening

## Architecture
- **Layer 1: Network & Reverse Proxy Shield**: Traefik edge routing, Express security middleware, strict Host header validation, dual-decoded path traversal and sensitive file blocker (403 Forbidden), cloaking and sanitized error handling.
- **Layer 2: Application DDoS & Cryptographic Identity**: Bounded LRU-cache rate limiting (120 req/min), anti-IP-spoofing client IP resolution, constant-time timing-safe dummy bcrypt parity, persistent DB-backed failed login lockout (5 attempts -> 15 min), token revocation blacklisting, 256-bit high-entropy JWT.
- **Layer 3: Boundary Input Validation & Injection Immunity**: Zod schema boundary validation with `.strict()` across all mutation routes, 100KB payload enforcement, prototype pollution rejection before Prisma ORM queries.
- **Layer 4: Container Runtime & Defense-in-Depth**: Non-privileged Alpine container (`node:node`), hardened `.dockerignore`, zero root execution.
- **Layer 5: Automated Red-Team Penetration Test Harness**: 12-vector OWASP Top 10 automated penetration testing suite integrated into master CI test runner.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Strict Transport & Security Headers | HSTS, CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, X-Robots-Tag | M1 | R1 |
| 2 | Reverse Proxy Host Origin Binding | Strict Host header allowlist in Express; URL rewrite ordering before rate limiting | M1 | R1 |
| 3 | Sensitive File & Path Traversal Blocker | Dual URL decode, query-string stripping, path normalization blocking .env, .git, .sqlite, .log returning 403 | M1 | R1, R5 |
| 4 | Server Cloaking & Error Sanitization | Suppress X-Powered-By, technology banners, and sanitize route catch blocks | M1 | R1 |
| 5 | Non-Root Container & Docker Hardening | Run as non-privileged node UID 1000, optimize Dockerfile layers, strict .dockerignore | M1 | R5 |
| 6 | Bounded LRU Rate Limiting | express-rate-limit with bounded LRU store (max 5000 keys) to prevent memory exhaustion DoS | M2 | R2 |
| 7 | Anti-Spoofing Client IP Resolution | Trusted reverse proxy single-hop IP resolution resisting X-Forwarded-For tampering | M2 | R2 |
| 8 | Constant-Time Bcrypt Timing Attack Defense | Dummy bcrypt hash comparison on non-existent users to eliminate username enumeration | M2 | R3 |
| 9 | Persistent DB-Backed Account Lockout | 5 failed attempts -> 15 min lockout persisted to PostgreSQL User model | M2 | R3 |
| 10| Token Revocation & JWT Hardening | High-entropy 256-bit JWT secret in .env, persistent token blacklist on logout | M2 | R3 |
| 11| Strict Password Complexity Policy | Enforce min 12 chars, uppercase, lowercase, numbers, symbols on auth | M2 | R3 |
| 12| Strict Schema Validation on All Mutations | Zod schemas with .strict() rejecting prototype pollution & unexpected keys (422) | M3 | R4 |
| 13| Strict Payload Caps (100KB) | 100kb payload limit on all JSON/urlencoded inputs returning 413 | M3 | R4 |
| 14| Comprehensive Mutation Route Schemas | Validate Accounts, Contacts, Journal, Invoices, Products, Transactions, Checks, Employees | M3 | R4 |
| 15| Data Sync Alignment for T1.2 Test | Align bank account data sources so authoritative count matches 14 | M4 | AC |
| 16| OWASP Top 10 Red-Team Penetration Suite | Automated 12-vector security test suite verifying all defenses with 100% pass threshold | M4 | R6 |
| 17| Master CI & Live Health Verification | npm test & test-live-auth pass with 100% success rate on Coolify production | M4 | R6 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Network, Reverse Proxy & Container Hardening | R1 & R5: Host binding, middleware ordering, dual-decode sensitive file blocker, cloaking, .dockerignore | none | PLANNED |
| M2 | Memory-Safe Rate Limiting & Identity Hardening | R2 & R3: Bounded LRU rate limit, anti-spoofing IP, DB lockout in Prisma, token revocation, JWT entropy | M1 | PLANNED |
| M3 | Boundary Input Validation & Injection Immunity | R4: Zod .strict() on all schemas (including Invoice), prototype pollution defense, 100kb payload limit | M2 | PLANNED |
| M4 | Red-Team Penetration Suite & Acceptance Verification | R6: 12-vector OWASP penetration suite, fix T1.2 data mismatch, 100% test pass rate | M1, M2, M3 | PLANNED |

## Interface Contracts
### Express ↔ Reverse Proxy (Traefik)
- Host verification: `req.headers.host` must match allowed domains (`brosangroup.com`, `muhasebe.brosangroup.com`, `localhost`, `127.0.0.1`).
- Base path: URL rewriting `/muhasebe/api/*` -> `/api/*` MUST execute before any route or rate-limiter middleware.
- Security headers: Traefik and Express both omit technology banners; Express sends HSTS, CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, X-Robots-Tag.

### Authentication & Lockout ↔ Database (Prisma)
- User model fields: `failedAttempts: Int`, `lockedUntil: DateTime?`.
- On failed login: `prisma.user.update` increments `failedAttempts`. If `failedAttempts >= 5`, set `lockedUntil = now() + 15 min`.
- On successful login: `prisma.user.update` resets `failedAttempts = 0`, `lockedUntil = null`.
- Token blacklist: Revoked tokens stored with expiry to prevent replay after logout.

### API Controllers ↔ Zod Validation Layer
- Middleware: `validate(schema)` validates `req.body`.
- Rejection: Unexpected fields or schema mismatches reject with HTTP 422 `{ success: false, error: 'VALIDATION_ERROR', details: [...] }`.
- Payload cap: Payloads exceeding 100kb reject with HTTP 413 `{ success: false, error: 'PAYLOAD_TOO_LARGE' }`.

## Code Layout
- `server/index.js` — Main Express application entry point, middleware chain, route handlers
- `server/auth.js` — Authentication logic, JWT generation, bcrypt verification, lockout logic, IP resolution
- `server/validators.js` — Zod schemas with `.strict()` for all business entities and mutations
- `prisma/schema.prisma` — Database schema, User model, account/transaction models
- `Dockerfile` — Alpine container definition with non-privileged `node` user
- `.dockerignore` — Build context exclusion list
- `tests/test-security-penetration.js` — 12-vector OWASP Top 10 red-team penetration test suite
- `tests/test-auth-unit.js` — Unit tests for authentication, timing safety, and password rules
- `tests/test-live-auth.js` — Live production security health and authentication verification
- `tests/e2e/` — End-to-end accounting domain tests
