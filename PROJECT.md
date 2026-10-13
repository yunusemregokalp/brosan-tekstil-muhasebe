# Project: Brosan Tekstil Ön & Genel Muhasebe ERP — Atelier Treasury & Customs Redesign

## Architecture
- **Application Shell**: Single-Page Institutional Financial Application (`app/index.html`) serving 15 modules with pure HTML5, vanilla JavaScript, Tailwind/CSS variables, and local persistence.
- **Design System**: Google Stitch `Atelier Treasury & Customs ERP` (`projects/10698888641705759390`):
  - Primary: Midnight Maritime Navy `#0D1B2A`, Slate Cobalt `#1E3A8A`, Regulatory Emerald `#047857`, Industrial Slate `#475569`/`#64748B`, Off-White Canvas `#F8FAFC`, Work Surface `#FFFFFF`, Hairline Borders `1px solid #E2E8F0` / `#CBD5E1`.
  - Typography: `Hanken Grotesk` (Headlines), `Inter` (UI/Labels), `JetBrains Mono` (`tabular-nums` on all currencies, dates, and account codes).
  - Geometry: 4px card/input radii, 8px container/modal radii, planar 1px borders, zero novelty/rainbow badges.
- **Data & Business Logic Invariants**:
  - `window.BROSAN_ERP = const BROSAN_ERP = { ... }` preserved verbatim in `app/index.html` (disk-parsed by test suites).
  - `window.BrosanAuth` authentication lifecycle and lockscreen handlers.
  - `window.BrosanDocs` 556-file document vault and Faruk Aytin reconciliation data structures.
- **Runtime & Deployment**: Node.js/Alpine container served behind Coolify reverse proxy at `https://brosangroup.com/muhasebe` (VPS `173.249.23.10`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Stitch Design Tokens & CSS Variables | Import `Hanken Grotesk`, `Inter`, `JetBrains Mono`; define Atelier palette, 4 semantic badge classes, table utility classes, and reset in `app/index.html` `<style>`. | M1 | Survey R1 (DONE) |
| 2 | Clean Sidebar with Domain Groups | Reorganize 15 module buttons into 4 domain groups (*Finans & Muhasebe*, *İhracat & Evrak*, *Operasyon & Cari*, *Raporlama & Sistem*); remove 9 novelty badges; retain clean count badges. | M1 | Survey R2 (DONE) |
| 3 | Unified Top Header Context Bar | Replace 4 multicolored buttons with clean institutional context/breadcrumb bar, refined `Ctrl+K` command input, and single primary action trigger (`+ Yeni İşlem` segmented menu). | M1 | Survey R2 (DONE) |
| 4 | Institutional Lockscreen Overhaul | Redesign `#auth-lockscreen` into a calm banking portal matching `#0D1B2A`/`#F8FAFC` while preserving all PIN/login IDs and auth events. | M1 | Survey R2 (DONE) |
| 5 | Core Treasury & Accounting Views Redesign | Overhaul `#view-dashboard`, `#view-ledger` (Mizan), `#view-banking`, `#view-checks`, and `#view-expenses` with `#FFFFFF` cards, 1px `#E2E8F0` borders, `#F8FAFC` sticky table headers, and right-aligned monospace numbers. | M2 | Survey R3 (DONE) |
| 6 | Commercial, Operations & Customs Views Redesign | Overhaul `#view-sales`, `#view-exports` (İBKB cockpit), `#view-documents` (556 vault), `#view-contacts`, `#view-payroll`, `#view-edonusum`, `#view-mutabakat`, `#view-inventory`, `#view-reports`, `#view-settings`. | M2 | Survey R3 (DONE) |
| 7 | Modal Dialogs Systemic Standardization | Refine all 17 modal dialogs (`#modal-new-invoice` through `#modal-pdf-viewer`) with structured grid layouts, 1px borders, calm headers, and uniform action buttons. | M2 | Survey R3 (DONE) |
| 8 | Regression-Free Data & DOM Preservation | Maintain 100% of functional IDs (114+ cataloged IDs), `switchView()`, `openModal()`, `BROSAN_ERP`, and dynamic table tbody targets. | M1, M2 | Survey R4 (DONE) |
| 9 | 100% Test Citadel & E2E Suite Verification | Pass `test-auth-unit.js` (5/5), `e2e/run-all-tests.js` (14/14), and `run-all-tests.js` (19/19 master suites). | M3 | Survey R5 (DONE) |
| 10 | Adversarial Coverage & Visual Inspection | Challenger stress-tests DOM rendering, table alignments, responsive states, and verifies zero broken CSS or missing buttons. | M3 | Survey R5 (DONE) |
| 11 | Production Build & Coolify Live Deployment | Git commit/push, trigger Coolify rebuild on VPS `173.249.23.10`, probe `https://brosangroup.com/muhasebe` for HTTP 200, assets 200, and auth lockscreen integrity. | M4 | Survey R5 (IN_PROGRESS) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Atelier Design Foundation, Shell, Top Bar & Lockscreen | Import Stitch fonts (`Hanken Grotesk`, `Inter`, `JetBrains Mono`), implement Atelier Treasury CSS color tokens, 4-state semantic badges, table utilities; redesign `#auth-lockscreen`, sidebar 4 domain groups, remove novelty badges, top bar breadcrumbs + search + unified `+ Yeni İşlem` segmented trigger. | None | DONE |
| M2 | All 14 Module Views & 17 Modals Redesign | Redesign all module views (`#view-dashboard` through `#view-documents`) with crisp `#FFFFFF` cards, 1px `#E2E8F0` borders, `#F8FAFC` sticky table headers, monospace currency columns, and standardize all 17 modals. | M1 | DONE |
| M3 | Test Citadel, E2E Verification & Forensic Audit Gate | Phase 1: 100% pass across all unit, e2e, and 19 citadel suites. Phase 2: Adversarial visual/DOM verification. Forensic audit veto check. | M2 | DONE |
| M4 | Production Deployment & Live Probing | Git commit/push to `main`, deploy to Coolify `173.249.23.10` container `3rqmxkcjbkfp1mzp3raiyok8`, live probe `https://brosangroup.com/muhasebe`. | M3 | IN_PROGRESS |

## Interface Contracts
### Shell ↔ Modules
- Sidebar buttons MUST provide `data-module="[moduleId]"` and call `switchView('[moduleId]')`.
- Active sidebar item receives `.active` class with Navy-light background (`#1E3A8A` or `#1E293B`) and white text.
- View containers must retain `<div id="view-[moduleId]" class="module-view hidden">` (or active for dashboard).
- All 11 dynamic tbody targets must exist: `tbody-dashboard-mizan`, `tbody-ledger-full`, `tbody-sales`, `tbody-exports`, `tbody-expenses`, `tbody-contacts`, `tbody-bank-moves`, `tbody-checks`, `tbody-payroll`, `tbody-inventory`, `tfoot-dashboard-mizan`.
### Modals ↔ Triggers
- All 17 modals retain IDs `#modal-[name]` with `hidden` class toggleable by `openModal(modalId)` / `closeModal(modalId)`.
- All form inputs retain exact IDs for test suites (`#login-username`, `#login-password`, `#new-inv-type`, `#new-contact-name`, etc.).
### JavaScript ↔ Test Harnesses
- `const BROSAN_ERP = window.BROSAN_ERP = { ... }` MUST remain declared in `app/index.html` inline script for disk regex parsing by `tests/e2e/test-helpers.js`.
- `window.BrosanAuth` methods (`showLockscreen()`, `unlockApp()`, `quickUnlock()`) and `window.BrosanDocs` must remain intact.

## Code Layout
- `app/index.html`: Authoritative frontend single-page application.
- `.stitch/designs/`: Authentic Google Stitch extracted design references (`atelier_treasury_ibkb_cockpit.html`, etc.).
- `tests/`: 19-suite security citadel, E2E runner, auth unit tests.
- `Dockerfile`, `docker-compose.yml`: Coolify production container specifications.
