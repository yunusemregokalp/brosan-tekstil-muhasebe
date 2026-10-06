# Project: Brosan ERP & PostgreSQL Paraşüt Accounting Integration & Reconciliation

## Architecture
- **Backend & Database**: Node.js / Express, PostgreSQL 16, Prisma ORM (`prisma/schema.prisma`, `prisma/seed.js`).
- **Accounting Domain**: TDHP (Tekdüzen Hesap Planı), Double-entry bookkeeping, Turkish E-Invoice / Subcontracting (Fason) & Fabric Offset (Kumaş Mahsubu), TCMB FX conversions.
- **Frontend**: Single Page Application (`app/index.html`, `app/api-client.js`), Tailwind CSS, FontAwesome, Lucide, local cache state (`BROSAN_ERP`).
- **DevOps & Deployment**: Docker multi-stage Alpine build, `docker-entrypoint.sh`, Traefik reverse proxy, Coolify server (173.249.23.10), GitHub repository (`yunusemregokalp/brosan-tekstil-muhasebe`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 15 Paraşüt Contacts Integration | 15 real contacts (Ben Ellis £22,414.22 GBP, Faruk Aytin -$10,335.35 USD, Tinteks, etc.) with tax IDs, addresses, currencies | M1 | Survey (Exp 1, 2) |
| 2 | 14 Bank & Cash Accounts Integration | 14 accounts (Garanti BBVA TL, GBP, EUR, USD, Lojistik, etc.) with exact IBANs, account numbers, and live balances | M1 | Survey (Exp 1, 2) |
| 3 | 15 Sales Invoices & Checks Seeding | Seeding 15 sales invoices and portfolio checks into PostgreSQL via Prisma | M1 | Survey (Exp 1, 3) |
| 4 | Prisma Schema Enhancement | Adding IBAN, accountNo, branchName, currency, isAbroad, parasutId, and SubcontractReconciliation model | M1 | Survey (Exp 1) |
| 5 | Faruk Aytin Fason Invoices Tracking | NSA-70 ($3,036.00), NSA-84 ($6,366.80), NSA-87 ($14,630.00) fason invoices totaling $24,032.80 USD | M2 | Survey (Exp 2) |
| 6 | Fabric Sales Invoice Offset | BR02026000000024 invoice ($7,461.45 USD / 364,045.00 TL, 992.5 Kg fabric) offset against NSA-84 and NSA-87 | M2 | Survey (Exp 2) |
| 7 | Bank Advance Payments Reconciliation | 5 Garanti BBVA transfers totaling 298,471.00 TL ($6,236.00 USD) mapped to subcontract vouchers | M2 | Survey (Exp 2) |
| 8 | Net Debt & VAT Mathematical Verification | Exact verification of -$10,335.35 USD (508,894.07 TL) remaining debt and $1,230.49 USD (60,355.83 TL) net VAT | M2 | Survey (Exp 2) |
| 9 | Frontend BROSAN_ERP Cache Hydration | Hydrating app/index.html static cache with 15 contacts, 14 bank accounts, 15 sales invoices, 3 checks | M3 | Survey (Exp 3) |
| 10 | Reconciliation Desk UI Mount | Integrating the Faruk Aytin & Nisa Tekstil reconciliation desk (from build_ultimate_enterprise_erp.py) into app/index.html | M3 | Survey (Exp 3) |
| 11 | Bidirectional Cockpit Consistency | Ensuring frontend cockpit cards, tables, and KPIs match live Paraşüt and Excel sheets to the cent | M3 | Survey (Exp 2, 3) |
| 12 | Automated Build & Syntax Validation | Running Prisma generate, syntax verification, and seed execution without errors | M4 | Survey (Exp 1, 3) |
| 13 | Git Commit & GitHub Push | Versioning all schema, seed, frontend, and reconciliation files to GitHub main branch | M4 | Survey (Exp 3) |
| 14 | Coolify Production Container Deployment | Triggering and verifying Docker container build on Coolify (173.249.23.10) with healthy status | M4 | Survey (Exp 3) |
| 15 | 4-Tier E2E Test Suite | Requirement-driven test suite validating accounting calculations, balances, and UI views | E2E Track | ORIGINAL_REQUEST |
| 16 | Final Adversarial Coverage & Forensic Audit | White-box stress-testing and forensic audit verifying authentic implementation without cheating | Final Milestone | Methodology |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Design and implement 4-Tier E2E test suite (Tiers 1-4) published to TEST_READY.md | none | COMPLETED |
| M1 | Database & Seed Paraşüt Integration | Update prisma/schema.prisma and prisma/seed.js with 15 contacts, 14 banks, 15 invoices, 3 checks | none | COMPLETED |
| M2 | Faruk Aytin Subcontracting & Offset Reconciliation | Implement accounting ledger entries, vouchers, and mathematical model for Faruk Aytin in seed and services | M1 | COMPLETED |
| M3 | Frontend Cockpit & Bidirectional UI | Update BROSAN_ERP cache in app/index.html, mount Faruk Aytin reconciliation desk, align cockpit metrics | M1, M2 | COMPLETED |
| M4 | Automated Build, Git Push & Coolify Deployment | Verify build, commit & push to GitHub origin/main, verify Coolify container deployment | M1, M2, M3 | COMPLETED |
| Final | Final E2E Verification & Forensic Integrity Audit | Pass 100% E2E tests, Tier 5 adversarial hardening, and mandatory Forensic Auditor verification | M4, E2E | IN_PROGRESS |

## Interface Contracts
### M1 (Database/Seed) ↔ M2 (Faruk Aytin Reconciliation)
- Contact ID for Faruk Aytin: `CR-0004` (Paraşüt contact ID: `134268685`, Tax ID: `10967060592`, currency: `USD`).
- Bank Account for Garanti BBVA TL: `417-6289477` (IBAN: `TR070006200041700006289477`, currency: `TRL`).
- Fabric Invoice No: `BR02026000000024` ($7,461.45 USD / 364,045.00 TL).
- Fason Invoices: `NSA2026000000070` ($3,036.00 USD), `NSA2026000000084` ($6,366.80 USD), `NSA2026000000087` ($14,630.00 USD).
- Subcontract reconciliation record linking these transactions with remaining debt -$10,335.35 USD and net VAT $1,230.49 USD.

### M2 (Reconciliation Domain) ↔ M3 (Frontend UI)
- `BROSAN_ERP.contacts`: Array of 15 contacts matching Paraşüt live data.
- `BROSAN_ERP.banks`: Array of 14 bank accounts matching Paraşüt live balances and IBANs.
- `BROSAN_ERP.farukAytinReconciliation`: Structured object containing:
  - `totalFasonUsd`: 24032.80, `totalFasonTrl`: 1171410.07
  - `bankPaymentsUsd`: 6236.00, `bankPaymentsTrl`: 298471.00
  - `fabricSalesUsd`: 7461.45, `fabricSalesTrl`: 364045.00
  - `netDebtUsd`: -10335.35, `netDebtTrl`: -508894.07
  - `netVatUsd`: 1230.49, `netVatTrl`: 60355.83
  - Invoices list, Bank transfers list, Voucher settlement allocation.

## Code Layout
- `prisma/schema.prisma`: Database models for PostgreSQL.
- `prisma/seed.js`: Database seeder with live Paraşüt and accounting reconciliation data.
- `app/index.html`: Main frontend application and cockpit.
- `app/api-client.js`: Frontend API client for backend communication.
- `server/index.js`: Express backend REST API server.
- `tests/e2e/`: E2E test scripts and runner.
- `Dockerfile`, `docker-entrypoint.sh`, `docker-compose.coolify.yml`: Deployment configuration.
