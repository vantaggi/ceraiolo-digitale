# Project: Ceraiolo Digitale Refactoring & Modernization

## Architecture
- **Framework**: Vue 3 (Composition API) + Vite v7 + Pinia.
- **Data Persistence**:
  - Primary Client-side DB: Dexie.js (`CeraioloDigitaleDB` IndexedDB) with stores `soci`, `tesseramenti`, `blocchetti`, `settings`, `local_changes`.
  - SQLite Backup / Interchange: `sql.js` (WebAssembly) importing and exporting `.sqlite` files, automated via File System Access API.
- **Reporting & Export**: `pdf-lib` (embedded fonts and PDF manipulation), `jsPDF`, `xlsx`.
- **Visualization**: `chart.js` + `vue-chartjs`.
- **Branch**: strictly `development`.
- **Design Philosophy**: No Rewrite, incremental surgical enhancements, strict preservation of accounting formulas and database models.

## Code Layout
- `src/assets/main.css`: Core styling tokens, CSS custom properties, system font stack, WCAG 2.2 color tokens, tabular-nums table styling.
- `src/components/common/BaseIcon.vue`: Reusable SVG vector icon component (Apple SF Symbols style, Santantoniari palette).
- `src/App.vue`: Top-level application shell, clean navigation bar with SVG icons, theme toggle removed.
- `src/views/SettingsView.vue`: Application settings, theme selector (Light/Dark mode cards) inside the Generale tab.
- `src/views/BatchEntryView.vue`: 10-slot visual receipt bar, live booklet cash total, reinforced multi-socio receipts, inline new socio creation.
- `src/views/ReportsView.vue`: Unified Print Hub combining quick 1-click buttons and expandable PDF Lab with reactive table preview.
- `src/views/ReportsBetaView.vue`: Merged into `ReportsView.vue`; route `/reports-beta` redirected to `/reports`.
- `src/services/export.js`: PDF generation services (renewals, churn, booklet audit, membership cards with Manicchia sorting).
- `src/services/exportBeta.js`: Dynamic query builder PDF generation engine.
- `src/components/TesseraTemplate.vue`: Membership card layout component.
- `src/components/DashboardCharts.vue`: Single-scale senior-friendly chart and permanent high-contrast specular data table.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | R5: Offline Font Stack | Remove remote Google Fonts import; implement offline system font stack with 17px base | M1 | Survey 1, Survey 3 |
| 2 | R5: WCAG 2.2 Contrasts | Darken warning (#c2410c) and info (#0369a1) tokens to satisfy contrast ratio >= 4.5:1 | M1 | Survey 1, Survey 3 |
| 3 | R5: Theme Selector in Settings | Remove flame/candle toggle from App.vue header; place theme selector in SettingsView.vue | M1 | Survey 1, Survey 3 |
| 4 | R4: SVG Icon Component | Build BaseIcon.vue with minimalist SVG suite (SF Symbols style) in Santantoniari palette | M1 | Survey 1, Survey 3 |
| 5 | R4: Emoji Replacement across UI | Replace 45+ emojis across App.vue, buttons, badges, tables, and views with BaseIcon | M1 | Survey 1, Survey 3 |
| 6 | R5: Table Typography & Alignment | Enforce 48-52px zebra striped rows and right-aligned tabular-nums for accounting figures | M1 | Survey 1, Survey 3 |
| 7 | R1: 10-Slot Visual Receipt Bar | Visual bar [1]..[10] indicating receipt state (empty, filled, active) with keyboard nav | M2 | Survey 1, Survey 2 |
| 8 | R1: Live Booklet Cash Total | Real-time computation of cash collected across all 10 receipts of active booklet | M2 | Survey 1, Survey 2 |
| 9 | R1: Multi-Socio Receipt Flow | Manage multiple members per receipt sheet, receipt subtotal, single socio removal | M2 | Survey 1, Survey 2 |
| 10 | R1: Inline New Socio Registration | Fast drawer/modal to register new member directly into active receipt with 25€ quota | M2 | Survey 1, Survey 2 |
| 11 | R2: 4 Quick 1-Click Print Buttons | Quick buttons for: 1. Rinnovi, 2. Solleciti, 3. Fogli tessere 6x, 4. Resoconto cassa blocchetti | M3 | Survey 1, Survey 2 |
| 12 | R2: Merged Print Hub & Route Unification | Merge ReportsBetaView into ReportsView at /reports, redirect /reports-beta | M3 | Survey 1, Survey 2 |
| 13 | R2: Expandable PDF Lab | Collapsible panel for dynamic query builder with AND/OR payment years logic & filters | M3 | Survey 1, Survey 2 |
| 14 | R2: Column Selection & Reordering | Dynamic column selection and horizontal reordering (◀ / ▶) in PDF Lab | M3 | Survey 1, Survey 2 |
| 15 | R2: Reactive Live Table Preview | Specular table preview updating reactively on any filter or column change | M3 | Survey 1, Survey 2 |
| 16 | R2: Preset Save & Load | Save, load, and delete custom filter/column configurations | M3 | Survey 1, Survey 2 |
| 17 | R2: Resoconto Cassa Blocchetti PDF | Dedicated PDF report summarizing booklet cash totals, receipts, and assignees | M3 | Survey 1, Survey 2 |
| 18 | R3: Membership Card Manicchia Sort | Sort card PDF generation primarily by Manicchia and secondarily A-Z by surname/name | M3 | Survey 1, Survey 2 |
| 19 | R3: Card Italian DOB Typography | Italian text date format (e.g. 15 Maggio 1980) and centered typographic wrapping | M3 | Survey 1, Survey 2 |
| 20 | R3: 6-Up Membership Card Layout | Option to generate and print 6 membership cards per A4 sheet | M3 | Survey 1, Survey 2 |
| 21 | R6: Single-Scale Dashboard Chart | Remove dual Y-axis and hover-only dependencies; clear single-scale visualization | M4 | Survey 1, Survey 3 |
| 22 | R6: Permanent Specular Data Table | High-contrast data table below chart (>=17px, tabular-nums) reactive to time range | M4 | Survey 1, Survey 3 |
| 23 | E2E Testing Suite (Tiers 1-4) | Comprehensive automated opaque-box test suite for all features R1-R6 | E2E | Survey 1 |
| 24 | Adversarial Hardening (Tier 5) | Adversarial test cases and stress testing covering corner cases and data integrity | M5 | Survey 1 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Automated test suite (Tiers 1-4) verifying R1-R6, produces TEST_READY.md | none | DONE (49 tests) |
| M1 | Design System, Icons & Themes (R4, R5) | `main.css`, `BaseIcon.vue`, `App.vue`, `SettingsView.vue`, WCAG 2.2, typography | none | DONE (96 tests pass) |
| M2 | Batch Entry Flow Optimization (R1) | `BatchEntryView.vue`: 10-slot bar, live cash total, multi-socio, inline new socio | M1 | DONE (156 tests pass) |
| M3 | Unified Print Hub & Cards (R2, R3) | `ReportsView.vue`, `export.js`, `exportBeta.js`, `TesseraTemplate.vue`, Manicchia sort | M1, M2 | DONE (216 tests pass) |
| M4 | Senior Data Visualization (R6) | `DashboardCharts.vue`, `HomeView.vue`: single-scale chart + specular data table | M1 | IN_PROGRESS |
| M5 | Final Verification & Coverage Hardening | 100% pass of E2E test suite + Tier 5 adversarial hardening on branch development | M2, M3, M4, E2E | PLANNED |

## Interface Contracts

### BaseIcon ↔ All Views
- Component: `src/components/common/BaseIcon.vue`
- Props:
  - `name: String` (required, e.g. `'home'`, `'refresh'`, `'receipt'`, `'chart'`, `'settings'`, `'search'`, `'plus'`, `'check'`, `'warning'`, `'delete'`, `'arrow-left'`, `'arrow-right'`, `'user'`, `'cash'`)
  - `size: { type: [Number, String], default: 20 }`
  - `color: { type: String, default: 'currentColor' }`
- Behavior: Emits inline `<svg viewBox="0 0 24 24" ...>` styled with Santantoniari palette and stroke-based iconography.

### BatchEntryView ↔ Dexie DB (`CeraioloDigitaleDB`)
- Receipt Slot Range: `(sessionData.numeroBlocchetto - 1) * 10 + 1` to `sessionData.numeroBlocchetto * 10`.
- Live Booklet Cash Total: computed reactively from `tesseramenti` where `numero_blocchetto === sessionData.numeroBlocchetto`.
- Inline Socio Creation: registers new record in `soci` table, adds record in `tesseramenti` for `sessionData.annoRiferimento` with quota 25€ and current `numero_ricevuta`.

### ReportsView ↔ export.js & exportBeta.js
- 4 Quick Buttons:
  1. `generateRenewalListPDF(soci, renewalYear)`
  2. `generateChurnPDF(soci, year)`
  3. `generateAllCardsPDF(soci, renewalYear, options)` where options include `sortBy: 'manicchia' | 'alfabetico'` and `layout: 'single' | '6x'`
  4. `generateBookletSummaryPDF(blocchetti, tesseramenti, year)`
- Expandable PDF Lab:
  - Uses `generateBetaDynamicPDF(filteredSoci, config)` from `exportBeta.js`.
