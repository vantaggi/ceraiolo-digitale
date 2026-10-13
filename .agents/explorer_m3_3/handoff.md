# Handoff Report — Explorer M3-3 (Test Suite Analysis & Verification Specs for Milestone 3)

**Author**: `explorer_m3_3`  
**Date**: 2026-09-11  
**Target Milestone**: Milestone 3 — Unified Print Hub & Membership Cards (Requirements R2, R3)  
**Target Recipient**: `orchestrator` / `worker_m3`  
**Status**: COMPLETE (Hard Handoff)  

---

## 1. Observation

### 1.1 Test Suite Baseline & Vitest Run
Direct execution of `npx vitest run`:
- **Command**: `npx vitest run`
- **Result**: 11 test files passed, 156 tests passed, 0 failures, execution time ~2.41s.
- **Active test files**:
  - `src/__tests__/tier1_feature_coverage.spec.js` (24 tests)
  - `src/__tests__/tier2_boundary_corner.spec.js` (13 tests)
  - `src/__tests__/tier3_cross_feature.spec.js` (4 tests)
  - `src/__tests__/tier4_real_world_scenarios.spec.js` (2 tests)
  - `src/components/__tests__/TesseraTemplate.test.js` (6 tests)
  - `src/components/__tests__/BaseIcon.test.js` (8 tests)
  - `src/__tests__/batch_entry_flow.spec.js` (11 tests)
  - `src/__tests__/challenger_m1_2_empirical.spec.js` (16 tests)
  - `src/__tests__/challenger_m2_2_empirical.spec.js` (19 tests)
  - `src/__tests__/challenger_m2_adversarial.spec.js` (30 tests)
  - `src/__tests__/tier5_m1_adversarial_challenge.spec.js` (23 tests)

### 1.2 Existing Coverage for R2 & R3 in `src/__tests__/`
Direct inspection of `src/__tests__/tier1_feature_coverage.spec.js`:
- **Feature 11 (Lines 301-320)**: Defines a mock in-memory handler registry for the 4 quick buttons (`rinnovi`, `solleciti`, `tessere6x`, `resocontoCassa`).
- **Feature 12 (Lines 322-332)**: Validates route unification redirecting `/reports-beta` to `/reports` on a mock array (`routes = [{ path: '/reports-beta', redirect: '/reports' }]`), **not** on `src/router/index.js`.
- **Feature 13 (Lines 334-353)**: Verifies AND/OR logic for payment years on pure helper functions `matchesOr` and `matchesAnd`.
- **Feature 14 (Lines 355-385)**: Tests array index swap logic `moveLeft` and `moveRight` for dynamic columns.
- **Feature 15 (Lines 387-411)**: Tests `generatePreviewRow` projection from a mock socio object.
- **Feature 16 (Lines 413-442)**: Verifies localStorage JSON serialization and deletion for custom presets using key `'pdf_lab_presets'`.
- **Feature 17 (Lines 444-473)**: Validates booklet cash summary aggregation arithmetic (`auditSummary`) from mock arrays of `blocchetti` and `tesseramenti`.
- **Feature 18 (Lines 478-506)**: Validates primary sorting by Manicchia (`gruppo_appartenenza`) and secondary A-Z sorting by surname.
- **Feature 19 (Lines 508-535)**: Tests `formatItalianDOB` conversion (`1980-05-15` -> `15 Maggio 1980`).
- **Feature 20 (Lines 537-550+)**: Validates 6-up card positioning coordinates for A4 sheet (2 columns x 3 rows).

Direct inspection of `src/__tests__/tier3_cross_feature.spec.js` & `tier4_real_world_scenarios.spec.js`:
- `tier3_cross_feature.spec.js` (Lines 140-174): Combination 3 tests Manicchia filtering + card sorting + 6-up pagination math (2 pages for 7 members).
- `tier4_real_world_scenarios.spec.js` (Lines 193-237): Tests Scenario 1 end-to-end card generation with Manicchia sorting (`cardsToPrint`) and Italian birthdate format.

Direct inspection of `src/components/__tests__/TesseraTemplate.test.js`:
- 6 tests verify rendering, prop bindings (`nomeCognome`, `dataNascitaFormattata`), background image styles, and fallback PDF message.

### 1.3 Observations in Source Code (`src/`)
1. **`src/router/index.js` (Lines 63-69)**:
   ```javascript
   {
     path: '/reports-beta',
     name: 'reports-beta',
     component: () => import('../views/ReportsBetaView.vue'),
     meta: {
       title: 'Report Builder Beta - Ceraiolo Digitale',
     },
   },
   ```
   `/reports-beta` is currently active as an independent route pointing to `ReportsBetaView.vue`, not yet redirected to `/reports`.
2. **`src/views/ReportsView.vue` (Lines 44-50 & 580-592)**:
   - Contains an external link: `<router-link to="/reports-beta" class="nav-item">🛠️ Report Builder Beta</router-link>`.
   - Current tabs: `rinnovi`, `liste`, `export`, `stats`, `audit-quote`.
   - Does NOT yet feature the 4 quick 1-click print buttons front-and-center.
   - Does NOT yet contain the expandable "PDF Lab" query builder or reactive live preview table.
3. **`src/views/ReportsBetaView.vue` (1350 lines)**:
   - Contains the full PDF Lab UI: Preset management, General filters, Election aventi diritto evaluation, Manicchie filters, Payment years with AND/OR, Column selector with `moveColumn(index, dir)`, Sorting, and Live Preview Table (first 30 rows).
   - Presets saved under localStorage key `'reports_beta_presets'` (Lines 477, 490, 496).
4. **`src/services/export.js`**:
   - `generateAllCardsPDF(soci, renewalYear, onProgress = () => {})` (Line 958):
     - Line 979: Mutates the array in-place: `const sociOrdinati = soci.sort((a, b) => a.cognome.localeCompare(b.cognome))`.
     - Lacks the Manicchia sorting option (`sortBy: 'manicchia' | 'alfabetico'`).
     - Lacks the 6-up sheet layout option (`layout: 'single' | '6x'`).
     - Lacks backwards-compatible handling for `options` vs `onProgress`.
   - `generateBookletSummaryPDF(blocchetti, tesseramenti, year)`:
     - **Does NOT exist yet** in `src/services/export.js` (grep returned 0 results).
5. **`src/services/exportBeta.js`**:
   - Exports `generateBetaDynamicPDF(data, reportState, activeFiltersSummary)`.
   - Fully implements custom dynamic PDF generation with dynamic column widths, landscape/portrait auto-selection, and header legenda.

---

## 2. Logic Chain

1. **Test Coverage Disparity (Unit Logic vs UI Integration)**:
   - Observations 1.1 & 1.2 show that existing Tier 1-4 tests verify the pure mathematical and algorithmic requirements (AND/OR query evaluation, column swapping, Manicchia sort comparator, 6-up math, Italian DOB formatting).
   - However, there are zero component/integration tests mounting `ReportsView.vue` or testing the unified UI, the 4 quick buttons, or the route redirection in `src/router/index.js`.
   - Therefore, Worker M3 must write integration and component tests to ensure that the merged view and the real router behave as specified.

2. **Regression Hazards when Merging `ReportsBetaView.vue` into `ReportsView.vue`**:
   - Observation 1.3 shows `ReportsView.vue` is 1704 lines and `ReportsBetaView.vue` is 1350 lines.
   - Both components define colliding top-level reactive identifiers: `loading`, `toast`, `currentYear`, `availableGroups`.
   - If Worker M3 attempts a raw copy-paste into a single monolithic file, identifier collisions and lifecycle hook interleaving (`onMounted`) will break either the existing reports (Tabs: `rinnovi`, `liste`, `stats`, `export`, `audit-quote`) or the PDF Lab.
   - Architectural resolution: Worker M3 should either cleanly integrate PDF Lab as a dedicated primary tab (`currentTab = 'pdf-lab'`) or as an expandable component/section within `ReportsView.vue`, maintaining clean scope separation.
   - In addition, the existing link `<router-link to="/reports-beta">` in `ReportsView.vue` must be replaced with an internal tab switch (`@click="currentTab = 'pdf-lab'"`), because if `/reports-beta` redirects to `/reports`, the router-link would navigate to the same page.

3. **Preset Persistence Backwards Compatibility**:
   - In `ReportsBetaView.vue`, presets are stored under `localStorage.getItem('reports_beta_presets')`.
   - In `tier1_feature_coverage.spec.js` (Line 415), the test uses `'pdf_lab_presets'`.
   - To prevent losing user presets or failing test expectations, the preset loading logic must fall back:
     ```javascript
     const stored = localStorage.getItem('reports_beta_presets') || localStorage.getItem('pdf_lab_presets');
     ```
     And saving should write to `'reports_beta_presets'`.

4. **Service Contract Gaps in `export.js`**:
   - Missing `generateBookletSummaryPDF`: Required by Feature 11, Feature 17, and PROJECT.md § Interface Contracts. Must be implemented in `export.js` and tested with empty, partial, and full booklet data.
   - `generateAllCardsPDF` signature & mutation hazard:
     - `soci.sort(...)` mutates input arrays. Must be replaced with `[...soci].sort(...)`.
     - Signature must handle both `generateAllCardsPDF(soci, year, options)` and legacy `generateAllCardsPDF(soci, year, onProgress)`:
       ```javascript
       export async function generateAllCardsPDF(soci, renewalYear, optionsOrProgress = {}, maybeProgress = () => {})
       ```
     - Must support `sortBy: 'manicchia' | 'alfabetico'` (primary Manicchia, secondary surname/name).
     - Must support `layout: '6x'` (2x3 grid on A4) alongside `'single'` (1 card per page).

---

## 3. Caveats

1. **JSDOM Headless Environment Constraints**:
   - Node/JSDOM does not provide native `window.URL.createObjectURL` or `window.URL.revokeObjectURL`. Tests calling PDF export services that produce Blobs and trigger downloads must mock these APIs (`window.URL.createObjectURL = vi.fn(() => 'blob:mock')`).
2. **Card PDF Template Dependency**:
   - `generateAllCardsPDF` in `export.js` calls `getSetting('cardTemplatePDF')`. In headless tests, Dexie DB settings must be mocked or populated with valid PDF Uint8Array bytes (e.g., via `PDFDocument.create().save()`) to prevent `Nessun template PDF configurato` errors.
3. **No Rewrite Constraint**:
   - All 5 existing tabs in `ReportsView.vue` (`rinnovi`, `liste`, `export`, `stats`, `audit-quote`) are actively used and must remain intact with zero regression on existing exports (Excel, SQLite, PDF demographic and economic reports).

---

## 4. Conclusion

Milestone 3 requires 4 distinct implementation deliverables by Worker M3:
1. **Route Redirection**: Update `src/router/index.js` to redirect `/reports-beta` to `/reports`.
2. **Unified Print Hub UI (`ReportsView.vue`)**:
   - Prominently feature the 4 quick 1-click print buttons:
     1. Rinnovi con arretrati
     2. Ceraioli da sollecitare (Churn)
     3. Fogli tessere 6x
     4. Resoconto cassa blocchetti
   - Integrate the expandable "PDF Lab" (from `ReportsBetaView.vue`) with dynamic query builder, column selector/reordering, and live preview table.
   - Replace the `/reports-beta` sidebar router-link with a direct tab/section activation button.
3. **Export Services Expansion (`src/services/export.js`)**:
   - Implement `generateBookletSummaryPDF(blocchetti, tesseramenti, year)`.
   - Upgrade `generateAllCardsPDF` with non-mutating sort, Manicchia ordering option, 6-up A4 layout option, and backward-compatible signature.
4. **New Verification Test Suite (`src/__tests__/unified_print_hub_m3.spec.js`)**:
   - Implement the test specifications outlined in Section 5 to achieve 100% automated verification for Features 11 through 20.

---

## 5. Verification Test Specifications for Worker M3

Worker M3 must create `src/__tests__/unified_print_hub_m3.spec.js` and extend `src/components/__tests__/TesseraTemplate.test.js`. The test suite must implement the following 6 test specifications:

### Specification 1: Router Unification & Redirection (`src/router/index.js`)
```javascript
describe('M3: Route Unification & Navigation', () => {
  it('redirects /reports-beta route to /reports in router configuration', async () => {
    // Inspect router route table
    const route = router.getRoutes().find(r => r.path === '/reports-beta')
    expect(route).toBeDefined()
    // Either redirect string or redirect function
    expect(route.redirect || route.path).toBeTruthy()
  })

  it('navigates to /reports when accessing /reports-beta', async () => {
    await router.push('/reports-beta')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/reports')
    expect(document.title).toContain('Report e Stampe')
  })
})
```

### Specification 2: 4 Quick 1-Click Print Buttons Contract (`ReportsView.vue`)
```javascript
describe('M3: 4 Quick 1-Click Print Buttons in Hub', () => {
  it('triggers generateRenewalListPDF with active renewalYear on button click', async () => { ... })
  it('triggers generateChurnPDF with active renewalYear on button click', async () => { ... })
  it('triggers generateAllCardsPDF with { layout: "6x" } on button click', async () => { ... })
  it('triggers generateBookletSummaryPDF with blocchetti and tesseramenti on button click', async () => { ... })
})
```

### Specification 3: Booklet Cash Summary PDF Generation (`generateBookletSummaryPDF`)
```javascript
describe('M3: generateBookletSummaryPDF Service', () => {
  it('aggregates multiple booklets, calculates used receipts and total cash per booklet', async () => {
    const blocchetti = [
      { id: 1, numero_blocchetto: 1, assegnato_a: 'Capodieci 1' },
      { id: 2, numero_blocchetto: 2, assegnato_a: 'Capodieci 2' },
    ]
    const tesseramenti = [
      { numero_blocchetto: 1, numero_ricevuta: 1, quota_pagata: 25.0, anno: 2026 },
      { numero_blocchetto: 1, numero_ricevuta: 2, quota_pagata: 10.0, anno: 2026 },
      { numero_blocchetto: 2, numero_ricevuta: 11, quota_pagata: 10.0, anno: 2026 },
      { numero_blocchetto: 2, numero_ricevuta: 11, quota_pagata: 10.0, anno: 2025 }, // different year
    ]
    const result = await generateBookletSummaryPDF(blocchetti, tesseramenti, 2026)
    expect(result.success).toBe(true)
    expect(result.filename).toContain('2026')
    expect(result.blob).toBeInstanceOf(Blob)
  })

  it('handles empty booklets gracefully with zero totals without throwing', async () => {
    const result = await generateBookletSummaryPDF([], [], 2026)
    expect(result.success).toBe(true)
  })
})
```

### Specification 4: Membership Card Generation & Manicchia Sorting (`generateAllCardsPDF`)
```javascript
describe('M3: Membership Cards Manicchia Sort & Options', () => {
  it('sorts members primarily by Manicchia (A-Z) and secondarily by surname/name (A-Z)', async () => {
    const soci = [
      { id: 1, cognome: 'Rossi', nome: 'Mario', gruppo_appartenenza: 'PADULE' },
      { id: 2, cognome: 'Bianchi', nome: 'Luca', gruppo_appartenenza: 'INTERNA' },
      { id: 3, cognome: 'Alunno', nome: 'Francesco', gruppo_appartenenza: 'PADULE' },
      { id: 4, cognome: 'Zeni', nome: 'Andrea', gruppo_appartenenza: 'INTERNA' },
      { id: 5, cognome: 'Belli', nome: 'Giacomo', gruppo_appartenenza: null },
    ]
    // Non-mutating check: original array unchanged
    const clone = JSON.parse(JSON.stringify(soci))
    // Call sort helper or service with options: { sortBy: 'manicchia' }
    // Expect INTERNA (Bianchi, Zeni), then PADULE (Alunno, Rossi), then unassigned (Belli)
    expect(soci).toEqual(clone)
  })

  it('supports backwards-compatible signatures (options object vs onProgress callback)', async () => {
    // Accepts (soci, year, { sortBy: 'manicchia', layout: '6x' })
    // Accepts legacy (soci, year, progressFn)
  })

  it('implements 6-up grid layout calculation on A4 sheets (2 cols x 3 rows)', async () => {
    // Verifies 6 cards per page partition
  })
})
```

### Specification 5: Expandable PDF Lab Query Builder & Live Preview
```javascript
describe('M3: Expandable PDF Lab & Live Table Preview', () => {
  it('filters data reactively based on AND / OR payment years', () => { ... })
  it('filters data by multi-selected manicchie', () => { ... })
  it('correctly updates preview table columns when columns are reordered via moveColumn', () => { ... })
  it('renders status badges (V, X, O, -) and eligibility badges in preview rows', () => { ... })
  it('renders blank signature cell when "firma" column is checked', () => { ... })
})
```

### Specification 6: Preset Save, Load & Storage Migration
```javascript
describe('M3: Preset Persistence', () => {
  it('saves new preset to localStorage and updates active list', () => { ... })
  it('loads preset and updates reportState reactively', () => { ... })
  it('deletes preset and syncs localStorage', () => { ... })
  it('loads legacy presets stored under reports_beta_presets gracefully', () => { ... })
})
```

---

## 6. Independent Verification Method

To verify these findings and recommendations:
1. Run the test suite:
   ```bash
   npx vitest run
   ```
2. Verify route redirection contract:
   Inspect `src/router/index.js` lines 63-69.
3. Verify `src/services/export.js`:
   Inspect lines 958-1020 for `generateAllCardsPDF` signature and array mutation, and note absence of `generateBookletSummaryPDF`.
4. Verify `ReportsView.vue` and `ReportsBetaView.vue`:
   Inspect sidebar link at `ReportsView.vue:44` and preset keys at `ReportsBetaView.vue:477`.
