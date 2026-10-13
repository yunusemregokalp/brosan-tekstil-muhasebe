---
name: Atelier Treasury & Customs ERP
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#44474c'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777d'
  outline-variant: '#c4c6cc'
  surface-tint: '#525f71'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#0f1c2c'
  on-primary-container: '#778598'
  inverse-primary: '#bac8dc'
  secondary: '#4059aa'
  on-secondary: '#ffffff'
  secondary-container: '#8fa7fe'
  on-secondary-container: '#1d3989'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002115'
  on-tertiary-container: '#339471'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e4f9'
  primary-fixed-dim: '#bac8dc'
  on-primary-fixed: '#0f1c2c'
  on-primary-fixed-variant: '#3a4859'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b6c4ff'
  on-secondary-fixed: '#00164e'
  on-secondary-fixed-variant: '#264191'
  tertiary-fixed: '#97f5cc'
  tertiary-fixed-dim: '#7bd8b1'
  on-tertiary-fixed: '#002115'
  on-tertiary-fixed-variant: '#00513a'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-data-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
  label-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.125rem
  space-sm: 0.25rem
  space-md: 0.5rem
  space-lg: 0.75rem
  space-xl: 1rem
---

## Brand & Style

The design system is engineered for international textile manufacturers, trade compliance officers, and treasury operations managing high-volume export declarations, multi-currency receivables, and Turkish İBKB (İhracat Bedeli Kabul Belgesi) customs verification workflows.

The visual ethos reconciles the ruthless density and data clarity of high-frequency trading terminals with the spatial restraint and micro-typographic refinement of modern European fintech. It rejects ornamental padding in favor of dense tabular grids, high legibility under prolonged viewing conditions, and unambiguous visual cues for cross-border monetary reconciliation.

- **Design Movement:** Modern Technical Utility & High-Density Workstation.
- **Tone:** Authoritative, uncompromisingly precise, regulatory, industrial-modern.
- **Visual Tenets:** Compact bounding boxes, 1px structural dividing lines, tabular alignment, and zero-latency operational feedback.

## Colors

The palette is tuned for high-contrast contrast ratios and continuous hours of financial scrutiny.

- **Primary (`#0D1B2A` - Midnight Maritime Navy):** Dictates master navigational framing, primary structural headers, and highest-authority UI boundaries. Evokes stability, maritime logistics, and banking finality.
- **Secondary (`#1E3A8A` - Slate Cobalt):** Applied to active states, focused row highlights, primary action triggers, and active customs declaration stages.
- **Tertiary (`#047857` - Regulatory Emerald):** Allocated to successful customs clearing, audited İBKB certificates, fully balanced ledger entries, and positive currency variance.
- **Neutral (`#475569` - Industrial Slate):** Forms secondary text, data grid dividing borders, column header strokes, and disabled or resting controls.

### Functional Alerts & Status Colors
- **Amber Warning (`#B45309`):** Pending customs submission, expiring 180-day İBKB term limits, and balance discrepancies.
- **Crimson Alert (`#BE123C`):** Blocked customs declarations, sanction screening flags, failed ledger settlement, and overdue foreign exchange closures.
- **Canvas Base:** `#F8FAFC` (Cool Off-White/Industrial Bleach) paired with `#FFFFFF` card interiors, providing an absolute crisp backing for fine 1px strokes.

## Typography

Typography prioritizes rapid scannability, vertical compact alignment, and zero character ambiguity:

- **Hanken Grotesk** powers dashboard page titles, account statements, and analytical section heads with modern industrial sharpness.
- **Inter** handles high-volume body content, context menus, workflow descriptions, and tabular text cells. Font feature settings must enforce `cv05` (lower-case l), `cv08` (upper-case I with serifs), and `zero` (slashed zero).
- **JetBrains Mono** is enforced across all financial digits, customs declaration numbers (GÇB), İBKB serial codes, currency values (EUR, USD, TRY), exchange rate differentials, and GTİP/HS product code tags. Tabular lining numbers (`tnum`) ensure absolute vertical decimal alignment across multi-thousand row exports.

## Layout & Spacing

The layout model is built on an enterprise 16-column fluid data grid optimized for ultra-wide desktop workstations (1440px to 2560px), scaling down to strict vertical single-column panes on compact field-audit tablets.

- **Workstation Layout:** A persistent 64px collapsed icon utility rail connects to an expandable 240px workflow navigational drawer. The central operational canvas supports split viewports (e.g., electronic customs declaration documents on the left, İBKB automated reconciliation ledger on the right).
- **Density Rhythm:** Uses an aggressive 4px baseline sub-grid (`0.25rem` intervals). Dense enterprise data grids utilize 28px row heights to maximize the number of visible transactions per viewport without causing vertical scroll fatigue.
- **Margins & Gutters:** Main canvas boundaries preserve a `1rem` outer margin to prevent edge clutter. Internal panels and nested accounting tables use rigid `0.75rem` gutters with crisp 1px borders rather than wide empty spaces to distinguish context.

## Elevation & Depth

To prevent visual noise and preserve data density, elevation is communicated through **structural borders and planar surface tiers** rather than heavy diffused shadows.

- **Level 0 (Base Canvas):** `#F1F5F9` background for shell frame, master toolbars, and inactive canvas space.
- **Level 1 (Data Cards & Work Surfaces):** Flat `#FFFFFF` fill framed by a crisp 1px continuous border (`#CBD5E1`).
- **Level 2 (Active Focus & Sticky Table Headers):** `#FFFFFF` paired with an ultra-subtle edge definition: `0 1px 2px 0 rgba(15, 23, 42, 0.05)`, bottom border anchored by a 1px solid `#94A3B8`.
- **Level 3 (Flyout Drawers & Overlay Modals):** Crisp `#FFFFFF` surface elevated via `0 4px 12px 0 rgba(13, 27, 42, 0.12)` accompanied by an explicit 1px stroke (`#0D1B2A` at 15% opacity).
- **Level 4 (Context Popovers & Dropdowns):** `0 2px 8px -1px rgba(0, 0, 0, 0.1)`, 1px solid `#CBD5E1`.

## Shapes

The design system adheres to a sharp, precision-tooled architecture (`roundedness: 1`):

- **Inputs, Buttons, and Table Controls:** 4px radius (`0.25rem`). This provides structural rigor that fits strictly inside tight 28px and 32px cell constraints without encroaching on tabular figure readability.
- **Containers, Modals, and Cards:** 8px radius (`0.5rem`). Keeps panels grounded without appearing overly casual or circular.
- **Status Badges & Pill Tokens:** Standardized at 2px to 4px; rounded pills are strictly forbidden to conserve horizontal grid real estate and preserve the terminal feel.

## Components

### Buttons
- **Primary:** Background `#0D1B2A`, foreground `#FFFFFF`, border 1px solid `#0D1B2A`, height 30px (compact) or 36px (standard), typography `Inter 13px SemiBold`. On hover: `#1E3A8A`.
- **Secondary / Data Grid Action:** Background `#FFFFFF`, border 1px solid `#CBD5E1`, text `#334155`. On hover: `#F8FAFC` and border `#94A3B8`.
- **Destructive:** Background `#FFF1F2`, border 1px solid `#F43F5E`, text `#BE123C`. On hover: `#BE123C`, text `#FFFFFF`.

### Inputs & Financial Selectors
- **Text & Currency Inputs:** Monospaced formatting inside white boxes with 1px border `#CBD5E1`. On focus: 1px `#1E3A8A` accompanied by an inner hairline border, never a diffuse focus ring.
- **Currency Lock Prefix:** Inset badge displaying ISO currency codes (TRY, EUR, USD, GBP) styled with `#F1F5F9` background, `#475569` font, right-bordered with 1px solid `#CBD5E1`.

### Data Grids & Tabular Views
- **Header Cells:** Background `#F8FAFC`, uppercase label `11px`, letter-spacing `0.06em`, border-bottom 2px solid `#CBD5E1`, vertical height 32px.
- **Body Rows:** Alternating rows optional; standard is clean `#FFFFFF` with 1px border-bottom `#E2E8F0`. Hover effect applies an instant `#F1F5F9` tint across all columns.
- **Numerical Alignment:** All currency values, tare weights, yardage, and tariff rates are strictly right-aligned with `JetBrains Mono`.

### Chips & Compliance Badges
- **İBKB Status Tags:** Compact rectangular indicators (padding: 2px 6px, radius: 2px, font: `JetBrains Mono 11px Medium`).
  - *Certified:* `#ECFDF5` background, `#047857` border and text.
  - *In Review (180-Day Clock Active):* `#FFFBEB` background, `#B45309` border and text.
  - *Non-Compliant / Past Due:* `#FFF1F2` background, `#BE123C` border and text.

### Split Document Viewer & Audit Trail Panel
- Dedicated side-by-side verification pane allowing real-time comparison between raw XML/PDF Customs Declarations (Gümrük Çıkış Beyannamesi) and enterprise ledger items with synchronized hover highlighting across mismatched line items.
