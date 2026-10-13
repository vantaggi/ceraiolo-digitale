# Test Infrastructure Specification — Ceraiolo Digitale

## 1. Overview & Architecture

The testing infrastructure for **Ceraiolo Digitale** is designed to provide comprehensive, automated, opaque-box and integration verification for the entire application stack across requirements **R1 through R6** without modifying application source code.

- **Test Runner**: [Vitest v3.2.4](https://vitest.dev/)
- **Component Testing Framework**: [@vue/test-utils v2.4.6](https://test-utils.vuejs.org/)
- **DOM Simulation**: [jsdom v27.0.0](https://github.com/jsdom/jsdom)
- **State Management Integration**: [Pinia v3.0.3](https://pinia.vuejs.org/)
- **Target Git Branch**: `development`

The testing suite adheres strictly to the **4-Tier Testing Methodology**, ensuring hierarchical verification from isolated unit features up to full real-world operational workflows.

---

## 2. 4-Tier Testing Methodology

```
+-------------------------------------------------------------------------+
| Tier 4: Real-World Application Scenarios (E2E workflows, full sessions) |
+-------------------------------------------------------------------------+
| Tier 3: Cross-Feature Combinations (Pairwise integration & sync)        |
+-------------------------------------------------------------------------+
| Tier 2: Boundary & Corner Cases (Condono, minors, extreme inputs)       |
+-------------------------------------------------------------------------+
| Tier 1: Feature Coverage (Isolated happy paths for R1-R6, Features 1-22)|
+-------------------------------------------------------------------------+
```

### Tier 1 — Feature Coverage (Isolated Functional Verification)
Tests individual features in isolation according to `PROJECT.md § Feature Inventory`:
- **R1: Batch Entry Flow**: 10-slot visual receipt numbering calculation, live booklet cash computation, multi-socio receipt aggregation, inline new socio registration defaults (25€ quota).
- **R2: Unified Print Hub & PDF Lab**: 4 quick print contracts (Rinnovi, Churn/Solleciti, Fogli tessere 6x, Resoconto cassa blocchetti), dynamic column picker, preset persistence, live preview specular table.
- **R3: Membership Cards**: Italian date of birth formatting (`15 Maggio 1980`), Manicchia primary ordering with surname secondary ordering, 6-up card sheet layout calculations.
- **R4: SVG Vector Icons**: Standard SF Symbols / Santantoniari palette specifications, SVG stroke/fill contracts, emoji replacement mappings.
- **R5: Design System, Themes & Typography**: Offline font stack rules, WCAG 2.2 contrast validation for `--color-warning` (`#c2410c`) and `--color-info` (`#0369a1`) yielding >= 4.5:1 ratio, Pinia theme store light/dark state and DOM attribute synchronization, accounting tabular-nums alignment.
- **R6: Senior Data Visualization**: Single-scale bar chart series generation, permanent specular high-contrast data table below charts reactive to time ranges (5y, 10y, all).

### Tier 2 — Boundary & Corner Cases
Stresses edge conditions, boundary values, and domain-specific rules:
- **Condono Logic Boundaries**:
  - Paying current target year automatically condones all previous unpaid years (`inRegola: true`, `arretrati: []`).
  - Target year unpaid: calculates exact list of non-exempt unpaid years from `data_prima_iscrizione` to `targetYear`.
  - Fragmented past payments (e.g. paid 2020, unpaid 2021, paid 2022, unpaid 2023).
- **Minor Exemption Boundaries**:
  - Member turning 18 in reference year: not exempt in reference year, but exempt in all preceding minor years.
  - Member aged 17 or younger: exempt from payments and arrears after first registration (`data_prima_iscrizione`).
  - Missing, invalid, or malformed birthdate (fallback to adult).
- **Batch Entry Boundaries**:
  - Receipt boundaries for booklet 1 (receipts 1-10), booklet 12 (receipts 111-120), booklet 100 (receipts 991-1000).
  - Empty receipt sheet (0 members).
  - Removing all members resets receipt total to 0.
  - Mixed quota receipts (0€ minors, 10€ renewals, 25€ new members, custom donations).
- **PDF & Reports Boundaries**:
  - Empty datasets (0 members, 0 payments, 0 booklets).
  - Member names with special characters, apostrophes, accents, and extreme lengths (`Dell'Arte`, `Müller`, `Èlia`).
  - Filter combinations returning zero matches.

### Tier 3 — Cross-Feature Combinations
Tests pairwise interactions across separate application subsystems:
- **Batch Entry + Booklet Cash Tally + Receipt Audit**: Adding multi-socio payments into a receipt updates booklet cash total and feeds the returning member audit list (`getQuotaAuditList`).
- **Theme Store + UI Components**: Theme state change dynamically propagates `data-theme` attribute to the document while UI components are mounted and reactive.
- **Manicchia Filtering + Card Sorting + Live Table Preview**: Applying manicchia filters coordinates the preview table ordering and ensures card generation packages are grouped strictly by territory.
- **SQLite Database Backup / Restore Integrity**: Round-trip validation of schema structure across `Soci`, `Tesseramenti`, `Blocchetti`, `Settings`, `LocalChanges`, and `Metadata` preserving accounting data without regression.

### Tier 4 — Real-World Application Scenarios
Simulates realistic, multi-step operational campaigns conducted by the Famiglia dei Santantoniari:
- **Scenario A: Full Annual Tesseramento Campaign**:
  1. Initialize campaign for year 2026.
  2. Open booklet #4 (receipts 31-40).
  3. Register new member (Mario Santantoniaro, 25€ quota) inline on receipt 31.
  4. Register existing adult member renewal (10€ quota) on receipt 31.
  5. Register minor child (0€ quota, exempt) on receipt 31.
  6. Verify receipt 31 subtotal is 35€.
  7. Progress through receipts 32-40.
  8. Verify booklet cash total matches physical cash collected.
  9. Generate booklet cash summary PDF report.
  10. Generate annual renewal list PDF with arrears status.
  11. Generate batch membership cards sorted by Manicchia for territorial distribution.
- **Scenario B: Churn Recovery & Electoral Audit Campaign**:
  1. Detect non-renewed members from previous year.
  2. Compute arrears and determine voting rights eligibility (`aventeDiritto`).
  3. Generate electoral voting list and churn recovery PDF.
  4. Process retroactive recovery payment applying condono.

---

## 3. Test File Layout

All test suites reside in `src/__tests__/` and `src/components/__tests__/`:

```
src/
├── __tests__/
│   ├── tier1_feature_coverage.spec.js   # Features 1-22 (R1-R6 Happy Path)
│   ├── tier2_boundary_corner.spec.js    # Boundary cases, condono, minors, invalid data
│   ├── tier3_cross_feature.spec.js      # Cross-feature combinations & pairwise integration
│   └── tier4_real_world_scenarios.spec.js# End-to-end annual campaign workflows
└── components/
    └── __tests__/
        └── TesseraTemplate.test.js      # Membership card visual component unit tests
```

---

## 4. Execution Commands

### Run Full Test Suite
```bash
npx vitest run
```

### Run Specific Tier
```bash
npx vitest run src/__tests__/tier1_feature_coverage.spec.js
npx vitest run src/__tests__/tier2_boundary_corner.spec.js
npx vitest run src/__tests__/tier3_cross_feature.spec.js
npx vitest run src/__tests__/tier4_real_world_scenarios.spec.js
```

### Watch Mode (Development)
```bash
npx vitest
```

---

## 5. Mocking & Isolation Strategy

To ensure deterministic, isolated, and high-performance test execution without requiring persistent IndexedDB browser storage or native file downloads:
- **DOM Environment**: JSDOM provides the standard DOM tree.
- **URL Object APIs**: `window.URL.createObjectURL` and `window.URL.revokeObjectURL` are stubbed with deterministic mock tokens.
- **Pinia State**: Fresh Pinia instances are instantiated per test using `createPinia()` and `setActivePinia()`.
- **Canvas / PDF Output**: PDF services (`jsPDF`, `pdf-lib`) are verified through method calls and blob generation without disk side-effects.

---

## 6. Feature Traceability Matrix

| Feature # | PROJECT.md Feature | Testing Tier | Test File | Test Case Name(s) |
|---|---|---|---|---|
| 1 | R5: Offline Font Stack | Tier 1 | `tier1_feature_coverage.spec.js` | `verifies system font stack and removal of external font dependencies` |
| 2 | R5: WCAG 2.2 Contrasts | Tier 1 | `tier1_feature_coverage.spec.js` | `verifies WCAG 2.2 compliant contrast ratios for warning and info tokens` |
| 3 | R5: Theme Selector in Settings | Tier 1 | `tier1_feature_coverage.spec.js` | `theme store updates data-theme attribute and localStorage` |
| 4 | R4: SVG Icon Component | Tier 1 | `tier1_feature_coverage.spec.js` | `validates BaseIcon SVG geometry and props contract` |
| 5 | R4: Emoji Replacement across UI | Tier 1 | `tier1_feature_coverage.spec.js` | `validates emoji-to-SVG semantic icon mapping across core navigation` |
| 6 | R5: Table Typography & Alignment | Tier 1 | `tier1_feature_coverage.spec.js` | `verifies accounting table styling rules for tabular-nums and row height` |
| 7 | R1: 10-Slot Visual Receipt Bar | Tier 1 | `tier1_feature_coverage.spec.js` | `computes exact 10-slot receipt number range for given booklet` |
| 8 | R1: Live Booklet Cash Total | Tier 1 | `tier1_feature_coverage.spec.js` | `calculates live booklet cash total from payment quotas` |
| 9 | R1: Multi-Socio Receipt Flow | Tier 1 | `tier1_feature_coverage.spec.js` | `manages multi-socio receipt aggregation, subtotal and removal` |
| 10 | R1: Inline New Socio Registration | Tier 1 | `tier1_feature_coverage.spec.js` | `creates new socio with default 25€ quota and connects to active receipt` |
| 11 | R2: 4 Quick 1-Click Print Buttons | Tier 1 | `tier1_feature_coverage.spec.js` | `verifies contracts for 4 essential quick print actions` |
| 12 | R2: Merged Print Hub Route | Tier 1 | `tier1_feature_coverage.spec.js` | `verifies Print Hub unification route mapping` |
| 13 | R2: Expandable PDF Lab | Tier 1 | `tier1_feature_coverage.spec.js` | `validates PDF Lab dynamic query builder logic (AND/OR years)` |
| 14 | R2: Column Selection & Reordering | Tier 1 | `tier1_feature_coverage.spec.js` | `verifies dynamic column selection and reordering logic` |
| 15 | R2: Reactive Live Table Preview | Tier 1 | `tier1_feature_coverage.spec.js` | `generates specular table preview rows reacting to filters and columns` |
| 16 | R2: Preset Save & Load | Tier 1 | `tier1_feature_coverage.spec.js` | `serializes, saves, loads and deletes PDF Lab presets` |
| 17 | R2: Resoconto Cassa Blocchetti PDF | Tier 1 | `tier1_feature_coverage.spec.js` | `aggregates booklet data into cash audit summary structure` |
| 18 | R3: Membership Card Manicchia Sort | Tier 1 | `tier1_feature_coverage.spec.js` | `sorts membership cards primarily by Manicchia then alphabetically A-Z` |
| 19 | R3: Card Italian DOB Typography | Tier 1 | `tier1_feature_coverage.spec.js` & `TesseraTemplate.test.js` | `formats birth date in Italian typography (DD Mese YYYY)` |
| 20 | R3: 6-Up Membership Card Layout | Tier 1 | `tier1_feature_coverage.spec.js` | `calculates 6-up card grid coordinates on A4 sheet` |
| 21 | R6: Single-Scale Dashboard Chart | Tier 1 | `tier1_feature_coverage.spec.js` | `generates single-scale member trend dataset without dual Y-axis` |
| 22 | R6: Permanent Specular Data Table | Tier 1 | `tier1_feature_coverage.spec.js` | `generates specular data table corresponding to chart data range` |
| 23 | E2E Testing Suite (Tiers 1-4) | Tiers 1-4 | All test suites | Full automated verification of all 22 functional features |
| 24 | Adversarial Hardening (Tier 5) | Tier 2 | `tier2_boundary_corner.spec.js` | Boundary condition, condono stress testing, diacritics & extreme years |
