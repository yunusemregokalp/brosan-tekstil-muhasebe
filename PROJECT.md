# Project: Brosan ERP Visual Design & Layout Architecture Overhaul

## Architecture
- **Single Page Application (SPA)**: `app/index.html` serves as the complete ERP interface with pure client-side vanilla JavaScript and offline-capable mock/real data services.
- **Visual Design System**: Strict adherence to `ref_style.css` (332 lines) design tokens and component standards:
  - Font: Pure `"Inter"` with `font-feature-settings: "tnum" 1, "cv11" 1` and `tabular-nums`. Elimination of `JetBrains Mono` and `Hanken Grotesk` from normal rendering.
  - Color Tokens: `:root` (`--zemin: #f3f5f8`, `--kart: #ffffff`, `--yazi: #172231`, `--yazi-2: #4a5768`, `--ana: #1d4ed8`, `--yan: #0f1b2d`, `--yan-2: #16263d`, etc.) and `:root[data-tema="koyu"]`.
  - Component Classes: `.kartlar`, `.kart`, `.dikkat`, `.dikkat-oge`, `.hizli`, `.tablo`, `.sekmeler`, `.rozet`, `.dugme`.
- **Layout Shell**:
  - No top `<header>` in viewport: existing `<header>` retained in DOM with `class="hidden" style="display: none !important;"` to preserve `#header-breadcrumb-view` and child IDs.
  - Left navigation `<aside id="yan">`: 236px width, `#0f1b2d` background, 34x34px blue gradient 'B' logo, embedded `.ara-dugme` with `#global-search-input` and `Ctrl K` shortcut, active state `#1f3352` with `#60a5fa` left bar, hidden dynamic counter badges (`#badge-sales-count`, etc.), footer `.alt` with `Emre / Yönetici`, moon toggle, `Çıkış`, and `Bağlı · veritabanı`.
  - No bottom ticker bar: `<footer>` hidden with `class="hidden"`.
  - Main area `<main id="govde">`: contains `#ic` wrapper with page `h1`, actions `.sag`, and module views.
- **Interactive Modals**: 17 modals styled with `.modal` overlay, white card, clean inputs, and `.kapat` button, preserving all 17 IDs and form controls.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | CSS Token Architecture | Embed 332-line `ref_style.css` token system, light/dark themes, clean component classes | M1 | ref_style.css / Request Obj 1 |
| 2 | Pure Inter Typography | Enforce Inter font with tabular-nums; eliminate JetBrains Mono and Hanken Grotesk | M1 | ref_style.css / Request Obj 1 |
| 3 | Base Component Library | Define `.kartlar`, `.kart`, `.dikkat`, `.hizli`, `.tablo`, `.sekmeler`, `.rozet`, `.dugme` classes | M1 | ref_style.css / Request Obj 1 |
| 4 | Auth Lockscreen Card | Redesign `#auth-lockscreen` to 380px white card, 16px radius, left-aligned 42x42 'B' logo | M2 | ref_giris.html / Request Obj 2 |
| 5 | Clean Auth Controls | Modern inputs, `#1d4ed8` button, remove cyber-jargon badges, preserve all auth IDs | M2 | ref_giris.html / Request Obj 2 |
| 6 | Left Sidebar Architecture | Redesign `<aside id="yan">`: 236px `#0f1b2d`, 34x34 'B' logo, active nav `#1f3352` + `#60a5fa` | M3 | ref_inside.html / Request Obj 3 |
| 7 | Embedded Omnisearch | Relocate `#global-search-input` inside sidebar `.ara-dugme` with `Ctrl K` shortcut | M3 | ref_inside.html / Request Obj 3 |
| 8 | Compact Sidebar Footer | Implement `.alt` footer with `Emre / Yönetici`, moon theme toggle, `Çıkış`, connection status | M3 | ref_inside.html / Request Obj 3 |
| 9 | Chrome Elimination | Eliminate top `<header>` and bottom `<footer>` via `hidden` while preserving DOM IDs | M3 | ref_inside.html / Request Obj 4 |
| 10 | Dashboard KPI Cards | Overhaul `#view-dashboard` with 5 KPI `.kart`s and 30x30 `.ikon` squares | M4 | ref_inside_1.png / Request Obj 5 |
| 11 | Dashboard Attention Strip | Implement `.dikkat` / `.dikkat-oge` strip with 3px left border | M4 | ref_inside_1.png / Request Obj 5 |
| 12 | Dashboard Quick Actions | Implement `.hizli` 6 tiles grid for rapid navigation | M4 | ref_inside_1.png / Request Obj 5 |
| 13 | Dashboard Mizan & Activity | Style mizan table and recent activity to `.tablo` and `.sekmeler` pills | M4 | ref_inside_1.png / Request Obj 5 |
| 14 | 13 Module Views Overhaul | Redesign ledger, sales, exports, expenses, contacts, banking, checks, payroll, edonusum, mutabakat, inventory, reports, settings, documents to reference style | M5 | ref_inside / Request Obj 6 |
| 15 | 17 Modals Overhaul | Restyle all 17 interactive modals with reference design card, clean inputs, and close buttons | M5 | ref_inside / Request Obj 6 |
| 16 | DOM ID Preservation | Preserve 100% of all 228 DOM IDs and JS bindings (`BROSAN_ERP`, `window.BrosanAuth`, etc.) | M1-M6 | Explorer 2 Survey / Request Obj 7 |
| 17 | Test Suite 100% Pass | Verify `test-auth-unit.js`, `e2e/run-all-tests.js`, `run-all-tests.js` pass with 0 errors | M6 | Explorer 3 Survey / Request Obj 7 |
| 18 | Forensic Integrity Audit | Mandatory independent audit verifying genuine implementation and zero cheating | M6 | Forensic Auditor Protocol |
| 19 | Coolify VPS Deployment | Deploy to VPS `173.249.23.10` (`https://brosangroup.com/muhasebe/`) with HTTP 200 | M6 | Explorer 3 Survey / Request Obj 8 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | CSS Token System & Typography | Embed `ref_style.css` architecture, root variables, Inter tabular-nums, base classes | none | IN_PROGRESS |
| M2 | Auth Lockscreen Overhaul | Redesign `#auth-lockscreen` to match `ref_giris.html` (380px white card, all IDs preserved) | M1 | PLANNED |
| M3 | App Shell & Chrome Elimination | Sidebar `#yan` (236px `#0f1b2d`), embedded search, `.alt` footer, hide header/ticker | M1 | PLANNED |
| M4 | Dashboard View Overhaul | Redesign `#view-dashboard` matching `ref_inside_1.png` (5 KPIs, attention, quick tiles, tables) | M1, M3 | PLANNED |
| M5 | 13 Module Views & 17 Modals | Restyle remaining 13 views and 17 modals in reference design | M1, M3, M4 | PLANNED |
| M6 | Test Hardening, Audit & Deploy | Pass all 19 test suites, clean forensic audit, Coolify VPS deploy & live HTTP 200 check | M1-M5 | PLANNED |

## Interface Contracts
### `app/index.html` ↔ `tests/`
- `const BROSAN_ERP = window.BROSAN_ERP = { ... };` must remain declared inline at top of script.
- All 15 module views must have class `.module-view` and respective IDs (`#view-dashboard`, `#view-ledger`, etc.).
- All 17 modals must have class `.hidden` and respective IDs (`#modal-new-invoice`, etc.).
- Dynamic table bodies (`#tbody-sales`, `#tbody-dashboard-mizan`, `#tbody-bank-moves`, etc.) and footers (`#tfoot-dashboard-mizan`, etc.) must exist with exact IDs.
- Hidden chrome elements (`<header class="hidden" style="display: none !important;">`) retain `#header-breadcrumb-view`, `#quick-action-menu`, `#nav-user-name`.
- Active sidebar button must include `bg-[#1E3A8A]` (or active CSS class matching both tokens) to satisfy VM DOM assertions.

### `app/index.html` ↔ JavaScript Handlers
- `switchView(viewId)`: Toggles active view and active nav button.
- `openModal(modalId)` / `closeModal(modalId)`: Removes / adds `.hidden` on modal container.
- `window.BrosanAuth`: Manages auth state, quick unlock, pin unlock, and logout.
- `handleGlobalSearch(query)`: Triggered on input of `#global-search-input`.

## Code Layout
- `app/index.html`: Main SPA application file containing HTML markup, embedded CSS `<style id="ref-style">`, and inline ERP JavaScript logic.
- `app/data/documents-data.js`: Mock document management datasets.
- `tests/`: Automated unit and E2E test suites:
  - `tests/test-auth-unit.js`
  - `tests/e2e/run-all-tests.js`
  - `tests/run-all-tests.js`
  - `tests/test-m1-challenger.js`
  - `tests/test-challenger-m1-2-dom.js`
  - `tests/test-challenger-m3-2-dom-vm.js`
  - `tests/test-reviewer-m3-2-invariants.js`
- Deployment: Git push to origin/main or Coolify webhook/API on VPS `173.249.23.10`.

## Test Infra
- Command: `node tests/test-auth-unit.js` (Unit test)
- Command: `node tests/e2e/run-all-tests.js` (E2E Tier 1-4 tests)
- Command: `node tests/run-all-tests.js` (19 master suites)
- Acceptance: 100% tests pass with exit code 0, clean forensic audit, HTTP 200 on live VPS.
