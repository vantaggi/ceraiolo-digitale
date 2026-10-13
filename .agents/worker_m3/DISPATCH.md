# Task Assignment: Worker M3 (Unified Print Hub & Membership Cards - Requirements R2, R3)

**Identity**: You are `worker_m3`, a senior implementation worker.
**Working Directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m3`
**Target Branch**: `development` (STRICT: keep all changes on branch development).

## Mandatory Inputs to Read First
1. `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md`
2. `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
3. Explorer Reports:
   - `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m3_1\handoff.md`
   - `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m3_2\handoff.md`
   - `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m3_3\handoff.md`

## File Boundaries & Write Ownership
You own and have exclusive write permission to:
- `src/router/index.js`
- `src/services/export.js`
- `src/services/exportBeta.js`
- `src/components/TesseraTemplate.vue`
- `src/views/ReportsView.vue`
- `src/views/ReportsBetaView.vue` (for deprecation/redirection/stub or cleanup)
- `src/__tests__/unified_print_hub_m3.spec.js` (new test suite)

Do NOT modify any files outside these boundaries (e.g. do not touch `BatchEntryView.vue`, `main.css`, etc.).

## Implementation Tasks

### 1. `src/router/index.js`
- Update the route for `/reports-beta` to redirect to `/reports`:
  ```javascript
  {
    path: '/reports-beta',
    name: 'reports-beta',
    redirect: '/reports',
  }
  ```
  Ensure `/reports` is the single canonical print hub route.

### 2. `src/services/export.js`
- **Canonical Date Formatter**: Export `formatItalianDOB(dateStr)` converting `'YYYY-MM-DD'` to Italian format (e.g. `'1980-05-15'` -> `'15 Maggio 1980'`). Use this canonical function across all date-formatting locations to eliminate duplicated logic.
- **Enhanced `generateAllCardsPDF`**:
  - Signature: `generateAllCardsPDF(soci, renewalYear, optionsOrProgress = {}, maybeProgress = () => {})`. Handle both options object `{ sortBy, layout }` and legacy callback function.
  - Sorting: Do NOT mutate `soci` in-place (use `[...soci]`). Support `options.sortBy === 'manicchia'`: sort primarily by `gruppo_appartenenza` (trimmed, lowercase localeCompare), secondarily by `cognome`, tertiarily by `nome`. Default to alphabetical (`cognome` -> `nome`).
  - Layout: Support `options.layout === '6x'`: render 6 cards per A4 page (`210mm x 297mm`, cards `85mm x 54mm`, 2 columns x 3 rows, `marginX = 13.333mm`, `marginY = 33.75mm`). Draw card content and subtle dashed cut lines. Fall back to standard card box with Santantoniari styling if no custom template PDF is loaded.
- **Implement `generateBookletSummaryPDF(blocchetti, tesseramenti, year)`**:
  - Aggregate booklet data: booklet number, assignee, receipt range (e.g. 1-10), receipts used count, total cash collected (`sum(quota_pagata)`), status.
  - Build PDF using `jsPDF` with summary header banner, table with right-aligned cash amounts, total row at bottom, and save/return blob.

### 3. `src/services/exportBeta.js`
- Fix the column ordering bug: dynamically iterate over `reportConfig.display.baseColumns` so that user reordering (◀ / ▶) is faithfully respected in the generated PDF table headers and cell values.

### 4. `src/components/TesseraTemplate.vue`
- Replace raw emoji `📄` (line 10) with `<BaseIcon name="receipt" :size="28" />`.
- Use the canonical `formatItalianDOB` logic.

### 5. `src/views/ReportsView.vue` (Unified Print Hub)
- Merge `ReportsBetaView.vue` into `ReportsView.vue`.
- Layout structure:
  - **Foreground 4 Quick 1-Click Print Cards**:
    1. *Rinnovi con arretrati*: calls `generateRenewalListPDF(soci, renewalYear)`.
    2. *Ceraioli da sollecitare*: calls `generateChurnPDF(churnList, renewalYear)`.
    3. *Fogli tessere 6x*: selector for Manicchia vs A-Z sorting, calls `generateAllCardsPDF(soci, renewalYear, { layout: '6x', sortBy })`.
    4. *Resoconto cassa blocchetti*: calls `generateBookletSummaryPDF(blocchetti, tesseramenti, renewalYear)`.
  - **Expandable "PDF Lab" Section**:
    - Collapsible accordion with toggle.
    - Saved Presets: load and save to `localStorage` (support both `'pdf_lab_presets'` and legacy `'reports_beta_presets'`).
    - Natural language summary of active filters.
    - Advanced filters: Active 5-year members, Age category, Payment status, Election voting rights (date & status), Manicchie multiselect, Payment years with AND/OR radio selection.
    - Column selection & interactive reordering (`◀` / `▶`) including manual signature column (`colonna firma manuale`).
  - **Reactive Live Preview Table**:
    - Updates instantly on any filter, sort, or column change.
    - Renders columns dynamically in the order specified by `reportState.display.baseColumns`.
    - Styled with Senior typography (WCAG 2.2 contrast, tabular-nums for numeric figures, minimum row height 48-52px, zebra striping).
  - **Zero Emojis**: Replace ALL emojis across `ReportsView.vue` with appropriate `<BaseIcon>` components.
  - Remove the external router link `<router-link to="/reports-beta">` from the sidebar; replace with internal navigation to PDF Lab.
  - Preserve all existing tabs (`liste`, `stats`, `export`, `audit-quote`) with zero regressions.

### 6. Verification Tests (`src/__tests__/unified_print_hub_m3.spec.js`)
- Write automated tests verifying:
  - Router redirect `/reports-beta` -> `/reports`.
  - 4 quick button handlers and options passing.
  - `generateAllCardsPDF` Manicchia sorting and 6-up pagination layout.
  - `generateBookletSummaryPDF` data aggregation and arithmetic.
  - `formatItalianDOB` canonical formatting.
  - PDF Lab filter logic (AND/OR, election eligibility, column reordering sequence).
  - Zero raw emojis in modified files.

## Quality & Integrity Requirements
- Run `npm run lint` — must pass with 0 errors and 0 warnings.
- Run `npm run build` — must build production bundle cleanly.
- Run `npx vitest run` — all existing (156+) tests AND new tests must pass.
- Maintain `progress.md` with heartbeat updates.
- When finished, write your handoff report to `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m3\handoff.md`.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-11T07:31:46Z
Read your task assignment at c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m3\DISPATCH.md.
Mandatory read: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md and c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md.
Read Explorer handoffs:
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m3_1\handoff.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m3_2\handoff.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m3_3\handoff.md

Implement Milestone 3 (Unified Print Hub & Membership Cards - R2, R3) across:
- src/router/index.js
- src/services/export.js
- src/services/exportBeta.js
- src/components/TesseraTemplate.vue
- src/views/ReportsView.vue
- src/__tests__/unified_print_hub_m3.spec.js

Verify with npm run lint, npm run build, and npx vitest run.
Write handoff report to c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m3\handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
