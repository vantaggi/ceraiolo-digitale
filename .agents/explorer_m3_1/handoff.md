# Handoff Report: Unified Print Hub & PDF Lab Architecture (M3-1)

**Agent ID**: `explorer_m3_1`  
**Milestone**: M3 — Unified Print Hub & Membership Cards (Requirements R2, R3)  
**Target Path**: `src/views/ReportsView.vue`, `src/views/ReportsBetaView.vue`, `src/router/index.js`, `src/services/export.js`, `src/services/exportBeta.js`  
**Date**: 2026-09-11  

---

## 1. Observation

### 1.1 Codebase State & Existing Implementation
1. **`src/views/ReportsView.vue`** (1704 lines):
   - **Sidebar Navigation** (lines 8–52): Tab items for `rinnovi` (📅 Rinnovi & Tessere), `liste` (📋 Elenchi Dati), `export` (📦 Export Batch), `stats` (📈 Statistiche), `audit-quote` (⚖️ Audit Quote (Rientri)), and a separate router link `to="/reports-beta"` (🛠️ Report Builder Beta).
   - **Tab Rinnovi** (lines 75–156): Contains cards for "Lista Rinnovi" (`generateRenewalListPDF`), "Recupero Crediti" (`generateChurnPDF`), "Tessere Annuali" (`generateAllCardsPDF`), and an interactive preview using `TesseraTemplate.vue`.
   - **Tab Stats** (lines 159–267): Demographics breakdown (age distribution, birthplace top 10) and economic statistics (total revenue, standard 10€ vs 25€+ penalty quotas, average quota, group breakdown).
   - **Tab Liste** (lines 270–467): New members report, members by group (Manicchia), group counts summary, churn report, voting eligibility report, active members (5 years) report, complete payments list, and data quality audit.
   - **Tab Export** (lines 470–489): Batch download generating all reports in sequence.
   - **Tab Audit Quote** (lines 491–565): Detects returning/new members paying 10€ instead of 25€; exports to PDF and Excel.
   - **Emojis**: 50+ raw Unicode emoji characters in sidebar navigation, headers, button labels, and alert badges.

2. **`src/views/ReportsBetaView.vue`** (1350 lines):
   - **Standalone Beta View**: Contains a "⚠️ BETA VERSION" banner (lines 20–23) and back link `to="/reports"` (lines 9–11).
   - **Natural Language Filter Summary** (lines 32–37): Dynamic computed string `activeFiltersSummary` explaining active criteria.
   - **Saved Presets** (lines 40–57): Reads/writes presets array to `localStorage` under `'reports_beta_presets'`.
   - **Advanced Query Filters** (lines 60–154):
     - Only active members (≥ 1 payment in last 5 years).
     - Age category: `all`, `maggiorenni` (18+), `minorenni` (<18).
     - Current year payment status: `all`, `in_regola`, `morosi`.
     - Election eligibility: `electionDate` (`input[type="date"]`), `electionEligibility` (`all`, `aventi_diritto`, `solo_si`, `solo_regolarizza`, `esclusi`).
     - Manicchia multiselect checkboxes (`availableGroups`).
     - Payment years checkboxes (`availableYears`, 6 years) with radio selector for `AND` (paid in all selected years) vs `OR` (paid in at least one year).
   - **Column Selector & Order UI** (lines 156–232):
     - Base columns: `cognomeNome`, `gruppo`, `dataNascita`, `eta`, `dirittoVoto`, `motivoEsclusione`, `firma`.
     - Interactive reordering buttons: `◀` (`moveColumn(index, -1)`) and `▶` (`moveColumn(index, 1)`).
     - Year columns (V/X) with "[ Seleziona Tutti ]" and "[ Deseleziona ]".
   - **Live Preview Table** (lines 258–306):
     - Reactively computed `processedData` evaluating filter criteria, member election eligibility, and year payment status (`V`, `X`, `O`, `-`).
     - Renders top 30 matching members with badges.

3. **Critical Architectural Bug Identified in Existing Beta View & Export**:
   - In `ReportsBetaView.vue` (lines 273–279) and `src/services/exportBeta.js` (lines 321–327, 340–350), columns are declared with fixed, hardcoded `v-if="reportState.display.baseColumns.includes(...)"` and sequential `if (reportConfig.display.baseColumns.includes(...)) headers.push(...)`.
   - **Defect**: Even though the user reorders columns using `◀` / `▶` (which modifies array indices in `reportState.display.baseColumns`), the table preview and PDF output remained in the fixed static order (`cognomeNome` -> `gruppo` -> `dataNascita` -> `eta` -> `dirittoVoto` -> `motivoEsclusione`).
   - The merger must resolve this defect by rendering columns dynamically in `reportState.display.baseColumns` array sequence!

4. **`src/router/index.js`** (lines 63–69):
   - Currently defines:
     ```javascript
     {
       path: '/reports-beta',
       name: 'reports-beta',
       component: () => import('../views/ReportsBetaView.vue'),
       meta: { title: 'Report Builder Beta - Ceraiolo Digitale' },
     }
     ```
   - Test contract in `src/__tests__/tier1_feature_coverage.spec.js` (lines 322–332) explicitly asserts:
     ```javascript
     const reportsBetaRoute = routes.find((r) => r.path === '/reports-beta')
     expect(reportsBetaRoute.redirect).toBe('/reports')
     ```

5. **`src/services/export.js` and `exportBeta.js`**:
   - `export.js` line 958: `generateAllCardsPDF(soci, renewalYear, onProgress = () => {})` does not currently accept layout or sorting options. Requirement R3 & Feature 18/20 specify `layout: 'single' | '6x'` and `sortBy: 'manicchia' | 'alfabetico'`.
   - `export.js` currently lacks `generateBookletSummaryPDF(blocchetti, tesseramenti, year)` needed for Quick Button 4 (Feature 17).
   - `exportBeta.js` lines 321–387: Static column assembly must be refactored to dynamic iteration over `reportConfig.display.baseColumns`.

6. **`src/components/common/BaseIcon.vue`**:
   - Full vector SVG icon registry with SF Symbols minimalist styling and Santantoniari palette (`primary`, `accent`, `gold`, `success`, `warning`, `info`).
   - Contains all required icons: `bar-chart`, `calendar`, `clipboard`, `package`, `trending-up`, `scale`, `sliders`, `loader`, `file-text`, `trending-down`, `ticket`, `eye`, `coins`, `user-plus`, `users`, `hash`, `check-square`, `shield-check`, `search`, `check-circle`, `alert-triangle`, `download`, `file-spreadsheet`, `bookmark`, `trash-2`, `rotate-ccw`, `info`, `chevron-left`, `chevron-right`.

---

## 2. Logic Chain

### 2.1 UI Architecture: Unified Print Hub (`ReportsView.vue`)
To eliminate fragmentation while preserving existing operational routines, `ReportsView.vue` must become the single authoritative Print Hub.

```
+-----------------------------------------------------------------------------------+
| ReportsView.vue (Single Hub at /reports)                                          |
|                                                                                   |
| Sidebar Navigation:                                                               |
|   - [bar-chart] Hub Stampe & PDF Lab (Active by default)                          |
|   - [clipboard] Elenchi Dati                                                      |
|   - [trending-up] Statistiche                                                     |
|   - [scale] Audit Quote (25€)                                                     |
|   - [package] Export Batch                                                        |
+-----------------------------------------------------------------------------------+
| Top: Header & Anno di Riferimento [ 2026 ]                                        |
+-----------------------------------------------------------------------------------+
| FOREGROUND: 4 Quick 1-Click Print Cards (Milestone 3 / Requirement R2)            |
| +-------------------------+ +-------------------------+                           |
| | 1. Rinnovi & Arretrati  | | 2. Solleciti (Churn)    |                           |
| | [clipboard]             | | [trending-down]         |                           |
| | [ Scarica PDF Rinnovi ] | | [ Scarica PDF Solleciti]|                           |
| +-------------------------+ +-------------------------+                           |
| +-------------------------+ +-------------------------+                           |
| | 3. Fogli Tessere 6x     | | 4. Resoconto Cassa      |                           |
| | [ticket]                | | [coins]                 |                           |
| | Sort: [Manicchia | A-Z] | | Aggregato blocchetti    |                           |
| | [ Stampa Tessere 6x ]   | | [ Scarica Resoconto ]   |                           |
| +-------------------------+ +-------------------------+                           |
+-----------------------------------------------------------------------------------+
| EXPANDABLE "PDF LAB" PANEL (Collapsible Accordion)                                |
| [v] PDF Lab — Query Builder Avanzato & Generatore Dinamico                        |
|                                                                                   |
| - Preset Bar: [Salva Nuova Vista] [Ripristina] | Badges: [Elezioni 2026] (x)      |
| - Active Filters Natural Language Summary                                         |
| - Advanced Filters: Attivi 5-anni, Età, Stato Pagamento, Elezioni, Manicchie,     |
|   Anni Pagamento (con logica AND/OR)                                              |
| - Column Selector & Interactive Reordering (◀ / ▶) + Colonna Firma                |
| - Action: [ Genera PDF Dinamico ]                                                 |
+-----------------------------------------------------------------------------------+
| REACTIVE LIVE PREVIEW TABLE                                                       |
| - Reactive to every filter, sort, and column toggle instantly                     |
| - Dynamic Headers & Cells ordered by reportState.display.baseColumns              |
| - Senior typography (48-52px height, tabular-nums, WCAG 2.2 zebra striping)       |
+-----------------------------------------------------------------------------------+
```

### 2.2 Detailed Implementation Strategy for Developer

#### Step 1: Router Redirection in `src/router/index.js`
Modify lines 63–69:
```javascript
{
  path: '/reports-beta',
  name: 'reports-beta',
  redirect: '/reports',
},
```
- Completely remove the dynamic import `() => import('../views/ReportsBetaView.vue')`.
- Remove the router link in `ReportsView.vue` sidebar (`<router-link to="/reports-beta">`).
- Keep `/reports` as the single canonical route.

#### Step 2: 4 Quick 1-Click Buttons Contract
In `ReportsView.vue`, bind the 4 quick buttons to the following handlers:
1. **Rinnovi con arretrati**: Calls `generateRenewalListPDF(soci, renewalYear)`.
2. **Ceraioli da sollecitare**: Calls `getChurnList(renewalYear)` then `generateChurnPDF(churnList, renewalYear)`.
3. **Fogli tessere 6x**: Calls `generateAllCardsPDF(soci, renewalYear, { layout: '6x', sortBy: cardSortOrder })` where `cardSortOrder` is `'manicchia'` or `'alfabetico'`.
4. **Resoconto cassa blocchetti**: Calls `getAllBlocchetti()` and `getAllSociWithTesseramenti()` / `exportAllTesseramenti()`, then invokes `generateBookletSummaryPDF(blocchetti, tesseramenti, renewalYear)`.

#### Step 3: Expandable PDF Lab Panel Component
- State: `const isPdfLabExpanded = ref(true)` (or persisted in `localStorage`).
- Preset Storage: Support both `'pdf_lab_presets'` (standardized per test suite) and legacy `'reports_beta_presets'` for backward compatibility.
- Column Reordering:
  ```javascript
  const moveColumn = (index, direction) => {
    const newIndex = index + direction
    if (newIndex >= 0 && newIndex < reportState.value.display.baseColumns.length) {
      const arr = [...reportState.value.display.baseColumns]
      const temp = arr[index]
      arr[index] = arr[newIndex]
      arr[newIndex] = temp
      reportState.value.display.baseColumns = arr
    }
  }
  ```

#### Step 4: Reactive Live Preview Table Refactoring
Fix the static ordering defect by dynamically rendering the table headers and cells according to `reportState.display.baseColumns`:
```html
<table class="preview-table">
  <thead>
    <tr>
      <th v-for="col in reportState.display.baseColumns" :key="'th-'+col">
        {{ getColumnLabel(col) }}
      </th>
      <th v-for="year in sortedYearColumns" :key="'th-year-'+year" class="text-center">
        {{ year }}
      </th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="member in processedData.slice(0, 30)" :key="member.id">
      <td v-for="col in reportState.display.baseColumns" :key="'td-'+col+'-'+member.id">
        <template v-if="col === 'cognomeNome'">
          <strong>{{ member.cognome }}</strong> {{ member.nome }}
        </template>
        <template v-else-if="col === 'gruppo'">
          {{ member.gruppo_appartenenza || '-' }}
        </template>
        <template v-else-if="col === 'dataNascita'">
          {{ formatDate(member.data_nascita) }}
        </template>
        <template v-else-if="col === 'eta'">
          {{ getAgeBadge(member.data_nascita) }}
        </template>
        <template v-else-if="col === 'dirittoVoto'">
          <span class="status-badge" :class="getEligibilityClass(member.aventeDiritto)">
            {{ member.dirittoLabel }}
          </span>
        </template>
        <template v-else-if="col === 'motivoEsclusione'">
          <small class="text-secondary">{{ member.motivoEsclusione || '-' }}</small>
        </template>
        <template v-else-if="col === 'firma'">
          <span class="signature-line"></span>
        </template>
      </td>
      <td v-for="year in sortedYearColumns" :key="'td-year-'+year+'-'+member.id" class="text-center">
        <span class="status-badge" :class="getYearBadgeClass(member, year)">
          {{ getYearBadgeText(member, year) }}
        </span>
      </td>
    </tr>
  </tbody>
</table>
```

#### Step 5: Emoji Replacement with `<BaseIcon>`
Every emoji in both views mapped cleanly to `<BaseIcon>`:
| Context | Original Emoji | `<BaseIcon>` Replacement |
|---|---|---|
| Sidebar Report Title | `📊 Report` | `<BaseIcon name="bar-chart" size="20" /> Report` |
| Sidebar Rinnovi | `📅 Rinnovi & Tessere` | `<BaseIcon name="calendar" size="18" /> Rinnovi & Tessere` |
| Sidebar Liste | `📋 Elenchi Dati` | `<BaseIcon name="clipboard" size="18" /> Elenchi Dati` |
| Sidebar Export | `📦 Export Batch` | `<BaseIcon name="package" size="18" /> Export Batch` |
| Sidebar Stats | `📈 Statistiche` | `<BaseIcon name="trending-up" size="18" /> Statistiche` |
| Sidebar Audit Quote | `⚖️ Audit Quote` | `<BaseIcon name="scale" size="18" /> Audit Quote` |
| Quick Button Rinnovi | `📋` / `📄 Genera Lista` | `<BaseIcon name="clipboard" />` / `<BaseIcon name="file-text" />` |
| Quick Button Solleciti | `📉` / `📄` | `<BaseIcon name="trending-down" />` / `<BaseIcon name="file-text" />` |
| Quick Button Tessere 6x | `🎫` | `<BaseIcon name="ticket" />` |
| Quick Button Resoconto Cassa | `💰` / `Resoconto Cassa` | `<BaseIcon name="coins" />` |
| PDF Lab Header | `🛠️ Report Builder` | `<BaseIcon name="sliders" size="20" /> PDF Lab` |
| Presets Header & Delete | `💾 Preset` / `🗑️` | `<BaseIcon name="bookmark" />` / `<BaseIcon name="trash-2" color="accent" />` |
| Reset Filters | `🔄 Ripristina Filtri` | `<BaseIcon name="rotate-ccw" size="16" />` |
| Election Filter Header | `🗳️ Filtri Elezioni` | `<BaseIcon name="check-square" size="18" />` |
| Info tooltips | `ℹ️` | `<BaseIcon name="info" size="14" color="info" />` |
| Column Move Left/Right | `◀` / `▶` | `<BaseIcon name="chevron-left" size="14" />` / `<BaseIcon name="chevron-right" size="14" />` |
| Loading Spinners | `⏳ ...` | `<BaseIcon name="loader" spin size="16" />` |
| Audit Data Checks | `✅` / `⚠️` | `<BaseIcon name="check-circle" color="success" />` / `<BaseIcon name="alert-triangle" color="warning" />` |
| Data Quality Search | `🔍 Esegui Controllo` | `<BaseIcon name="search" size="16" />` |
| Excel Export | `📊 Esporta Excel` | `<BaseIcon name="file-spreadsheet" size="16" />` |

#### Step 6: Backend Service Enhancements (`export.js` & `exportBeta.js`)
1. In `src/services/export.js`:
   - Implement `generateBookletSummaryPDF(blocchetti, tesseramenti, year)` aggregating booklet payments, cash total, receipts count, and assignees.
   - Extend `generateAllCardsPDF(soci, renewalYear, options)`:
     - Support `options.sortBy === 'manicchia'` (sorts primary by `gruppo_appartenenza` and secondary by surname/name A-Z) and `options.sortBy === 'alfabetico'`.
     - Support `options.layout === '6x'` (generates A4 pages with 2 columns × 3 rows of cards).
2. In `src/services/exportBeta.js`:
   - Refactor lines 321–387 so headers and row cells iterate over `reportConfig.display.baseColumns` dynamically.

---

## 3. Caveats

1. **Role Boundary**: As an Explorer agent, this task is an investigation and synthesis; source code modifications must be implemented by the designated developer agent (`coder_m3_2` / `builder_m3_2`).
2. **Backward Compatibility of Presets**: Users who previously saved presets under `reports_beta_presets` must not lose them. The loader should read from `pdf_lab_presets` and fall back to `reports_beta_presets` if the former is absent.
3. **Template Asset Availability**: Membership card generation requires `cardTemplatePDF` in IndexedDB `settings`. When no template is uploaded, a clear institutional error message must guide the user to Settings.
4. **Performance of Live Preview**: The computed property `processedData` filters in-memory on the full `allMembers` array (~1,000–3,000 records). Since Vue 3 computed getters are cached and array operations on 3,000 objects execute in <5ms, performance remains instantaneous; slicing to top 30 in the DOM avoids template re-render overhead.

---

## 4. Conclusion

1. **Complete Feasibility**: Merging `ReportsBetaView.vue` into `ReportsView.vue` is architecturally clean, reduces bundle duplication, and unifies the reporting experience.
2. **Foreground Priority**: Placing the 4 quick 1-click buttons at the top of the primary tab solves the senior operator requirement for immediate daily prints (Rinnovi, Solleciti, Tessere 6x, Resoconto Cassa).
3. **Power-User Flexibility**: The collapsible PDF Lab below the quick buttons preserves 100% of the advanced query builder capabilities while fixing the previously unaddressed static column ordering defect.
4. **Route Stability**: Redirecting `/reports-beta` to `/reports` in `src/router/index.js` eliminates dead links and satisfies test requirements.
5. **Aesthetic Consistency**: Replacing all 50+ raw emojis with `<BaseIcon>` brings the reporting interface into full alignment with the institutional Santantoniari design system.

---

## 5. Verification Method

### 5.1 Independent Test Suite Verification
Run Vitest to verify that existing test suites continue to pass:
```powershell
npm test -- --run
```

### 5.2 Specific Assertions to Implement / Validate in M3 Tests
1. **Router Redirect Test**:
   ```javascript
   import router from '@/router/index.js'
   const route = router.getRoutes().find(r => r.path === '/reports-beta')
   expect(route.redirect).toBe('/reports')
   ```
2. **4 Quick Buttons Existence & Handlers**:
   Verify that `ReportsView.vue` exposes the 4 quick action buttons and binds to:
   - `generateRenewalListPDF`
   - `generateChurnPDF`
   - `generateAllCardsPDF` with `{ layout: '6x' }`
   - `generateBookletSummaryPDF`
3. **Dynamic Column Reordering Test**:
   Verify that moving a column (e.g. `['gruppo', 'cognomeNome']`) renders `<th>` for Manicchia before `<th>` for Socio in the DOM.
4. **Live Table Reactivity**:
   Verify that checking/unchecking a filter (e.g. `onlyActiveMembers` or `gruppo`) immediately modifies the preview row count and content without page reload.
5. **No Raw Emojis**:
   Verify that `ReportsView.vue` contains zero Unicode emoji characters, using `<BaseIcon>` for all visual indicators.
6. **Production Build Verification**:
   ```powershell
   npm run build
   ```
   Must complete with code 0 and zero compilation errors.
