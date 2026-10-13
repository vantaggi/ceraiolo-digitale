# Hard Handoff Report — Challenger M3-1: Empirical & Adversarial Challenge (R2, R3)

## 1. Observation
- **Test File Created**: `src/__tests__/challenger_m3_1_adversarial.spec.js` (984 lines, 16 adversarial tests across 4 challenge domains).
- **Target Files Audited**:
  - `src/views/ReportsView.vue` (Unified Hub, 4 quick buttons, PDF Lab accordion, live preview table, column reordering, preset storage, dynamic query builder).
  - `src/services/exportBeta.js` (Dynamic PDF generator engine, column projection, smart width calculation, legend insertion, multi-line wrap).
  - `src/services/export.js` (`generateRenewalListPDF`, `generateChurnPDF`, `generateAllCardsPDF` with 6x layout & Manicchia/A-Z sorting, `generateBookletSummaryPDF`).
  - `src/router/index.js` (Redirect `/reports-beta` -> `/reports`).
- **Tool Commands and Results**:
  1. `npx vitest run src/__tests__/challenger_m3_1_adversarial.spec.js`:
     ```text
     ✓ src/__tests__/challenger_m3_1_adversarial.spec.js (16 tests) 698ms
     Test Files  1 passed (1)
          Tests  16 passed (16)
       Duration  2.25s
     ```
  2. `npx vitest run` (Full Test Suite):
     ```text
     Test Files  14 passed (14)
          Tests  216 passed (216)
       Duration  2.93s
     ```
  3. `npm run lint`:
     ```text
     > ceraiolo-digitale@0.0.0 lint
     > eslint . --fix
     (Exited with code 0, 0 errors, 0 warnings)
     ```
  4. `npm run build`:
     ```text
     vite v7.1.9 building for production...
     ✓ 574 modules transformed.
     ✓ built in 4.80s
     (Exited with code 0)
     ```

- **Detailed Test Assertions Observed**:
  - *Dynamic Query AND/OR*:
    - Evaluated non-consecutive years (e.g. member paid 2023 & 2025, skipped 2024). Under AND `[2023, 2025]`, exactly members with both years matched; Bettelli (paid 2024 & 2025) was excluded. Under OR `[2023, 2025]`, Bettelli was included.
    - Evaluated full $2^4$ binary power set (16 synthetic members across years 2023–2026). For query `[2023, 2025]`, under AND exactly 4 members (masks 5, 7, 13, 15) survived; under OR exactly 12 members survived ($16 - 4$).
    - Disjoint years (e.g. 1999) yielded empty results under AND, and isolated survival under OR.
    - Adversarial member data: `tesseramenti: null`, `tesseramenti: undefined`, duplicate tesseramenti `[{anno: 2024}, {anno: 2024}]`, and malformed date strings were safely handled without throwing runtime exceptions.
    - Compound 5-criterion filter (`groups: ['INTERNA']`, `ageGroup: 'maggiorenni'`, `paymentStatus: 'morosi'`, `paymentYears: [2024, 2025] AND`, `onlyActiveMembers: true`) correctly filtered down to a single exact target socio (`D_Bersaglio`).
  - *Column Reordering & Projection*:
    - Boundary guards: `moveColumn(0, -1)` and `moveColumn(lastIndex, 1)` as well as negative or extreme indices were blocked with no array mutation.
    - Preview DOM projection: Reordering `baseColumns` to `['firma', 'eta', 'cognomeNome', 'gruppo']` immediately updated preview table headers `<th>` in that exact order, and table row cells `<td>` rendered: Cell 0 = `.signature-line-blank`, Cell 1 = 'Maggiorenne', Cell 2 = 'Ceraiolo Federico', Cell 3 = 'SAN MARTINO', Cell 4 = 'V'.
    - Dynamic PDF engine (`generateBetaDynamicPDF`): Handled arbitrary column permutations (including 7 reversed base columns + 3 year columns), empty data arrays, year-only columns, and large batches (50+ members) without errors.
  - *4 Quick Foreground Buttons*:
    - Button 1 (`generateRenewalList`): Passed `renewalYear` to `generateRenewalListPDF`, guarded against null renewalYear, caught service exceptions and emitted toast errors without getting stuck in `loading = true`.
    - Button 2 (`generateChurnReport`): When churn list was empty, short-circuited with informative toast and did NOT call `generateChurnPDF`. When non-empty, invoked `generateChurnPDF(churnList, year)`. Handled service failures `{ success: false, error: 'Database locked' }` cleanly.
    - Button 3 (`generateCards6x`): Accurately passed `sortBy: 'manicchia'` vs `'alfabetico'`, `layout: '6x'`, filtered inactive members (>5 years since last payment) when `excludeInactiveMembers` was checked, tracked progress from 0 to 100, and triggered download anchors.
    - Button 4 (`generateBookletSummary`): Performed parallel fetch of `getAllBlocchetti` and `exportAllTesseramenti`, invoked `generateBookletSummaryPDF`, triggered blob download, and safely recovered from service rejection.
  - *Preset Storage & Fallback*:
    - Fallback hierarchy verified: loaded from `pdf_lab_presets` when present; fell back to `reports_beta_presets` when `pdf_lab_presets` was missing; defaulted to `[]` when both missing; caught corrupted JSON syntax errors without crashing.
    - Saving synchronized identical serialized JSON to BOTH `pdf_lab_presets` and `reports_beta_presets`. Cancelled prompt or whitespace input was rejected.
    - Loading preset updated reactive `reportState` and immediately updated reactive computed `processedData`.
    - Deleting preset respected `confirm()` dialog cancellation and synchronized storage on confirmation.

## 2. Logic Chain
1. **Mathematical Soundness of AND/OR Query Engine (R2)**:
   - In `ReportsView.vue` (lines 2215-2225):
     ```javascript
     if (logic === 'AND') {
       return list.every((reqYear) => paidYears.includes(reqYear))
     } else {
       return list.some((reqYear) => paidYears.includes(reqYear))
     }
     ```
   - Observations 1.1 and 1.2 demonstrate that `list.every` and `list.some` strictly adhere to boolean set semantics ($P \supseteq Q$ for AND, $P \cap Q \neq \emptyset$ for OR) across non-consecutive years and the full 16-member combinatorial power set matrix.
   - Observation 1.4 confirms defensive chaining `member.tesseramenti?.map(...) || []` prevents null-dereference crashes on adversarial data.
2. **End-to-End Coherence of Column Reordering (R2)**:
   - In both `ReportsView.vue` (lines 489-546) and `exportBeta.js` (lines 339-402), columns and row cells are rendered via dynamic iteration over `reportState.display.baseColumns`:
     ```javascript
     reportConfig.display.baseColumns.forEach((colKey) => { ... })
     ```
   - Observation 2.2 confirms that DOM header labels (`colName`) and body cells match the reordered indices 1:1, verifying that visual preview and PDF export remain synchronized.
3. **Ergonomic Safety of 4 Quick Foreground Print Cards (R2, R3)**:
   - In `ReportsView.vue`, the 4 primary print functions (`generateRenewalList`, `generateChurnReport`, `generateCards6x`, `generateBookletSummary`) are exposed as prominent 1-click cards.
   - Observations 3.1 to 3.4 demonstrate that each function handles:
     - Null/invalid year validation.
     - Option propagation (`cardSortBy`, `excludeInactiveMembers`, `layout: '6x'`).
     - Exception catching with `finally { loading.value = false }`, preventing UI lockout if downstream PDF engines or DB queries fail.
4. **Backward Compatibility & Dual Persistence of Presets (R2)**:
   - In `ReportsView.vue` (lines 1856, 1874-1875, 1891-1892):
     ```javascript
     const stored = localStorage.getItem('pdf_lab_presets') || localStorage.getItem('reports_beta_presets')
     ...
     localStorage.setItem('pdf_lab_presets', serialized)
     localStorage.setItem('reports_beta_presets', serialized)
     ```
   - Observations 4.1 to 4.4 demonstrate that legacy presets created under `/reports-beta` are seamlessly migrated, new presets are dual-written, and deletion maintains cross-key parity.

## 3. Caveats
- No physical printer hardware was tested; verification relies on PDF coordinate calculations and programmatic inspection of generated jsPDF/pdf-lib objects.
- In headless test execution, file downloads (`URL.createObjectURL`, `a.click()`) and image rasterization (`HTMLCanvasElement`) are simulated via standard Web API test doubles.

## 4. Conclusion
The implementation of Milestone 3 (Unified Print Hub & Membership Cards - Requirements R2, R3) satisfies all functional, architectural, and adversarial resilience requirements. All 16 newly constructed adversarial stress tests pass without failure, bringing the total suite to 216 passing tests with 0 regressions, 0 ESLint errors/warnings, and a clean 4.80s production build.

**Explicit Verdict: APPROVE**

## 5. Verification Method
To independently execute and verify the adversarial challenge suite and overall system health:
1. Run the targeted adversarial suite:
   ```bash
   npx vitest run src/__tests__/challenger_m3_1_adversarial.spec.js
   ```
   *Expected result*: 16 passed (16).
2. Run the entire project test suite:
   ```bash
   npx vitest run
   ```
   *Expected result*: 14 test files passed, 216 tests passed, 0 failures.
3. Run code quality linting:
   ```bash
   npm run lint
   ```
   *Expected result*: 0 errors, 0 warnings.
4. Run production build:
   ```bash
   npm run build
   ```
   *Expected result*: Vite builds cleanly without syntax or bundling errors.
