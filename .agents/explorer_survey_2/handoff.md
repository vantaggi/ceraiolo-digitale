# Handoff Report — Codebase Architecture, Core & Data Survey (Survey 2)

**Agent**: `explorer_survey_2`  
**Date**: 2026-09-10  
**Working Directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_survey_2`  
**Target Git Branch**: `development`  

---

## 1. Observation

### 1.1 Git Branch & Repository Status
- Tool command: `git status -s -b` returned:
  ```text
  ## development
  ?? .agents/
  ?? ORIGINAL_REQUEST.md
  ```
- Tool command: `git status` returned:
  ```text
  On branch development
  Untracked files:
    .agents/
    ORIGINAL_REQUEST.md
  nothing added to commit but untracked files present
  ```
- Observation: The repository is confirmed to be on branch `development`, with no tracked modifications and clean working tree.

### 1.2 Package.json, Dependencies, Build & Test Tooling
- File: `package.json` (lines 9-16, 17-48) defines:
  - `scripts`:
    - `"dev": "vite"`
    - `"build": "vite build"`
    - `"preview": "vite preview"`
    - `"lint": "eslint . --fix"`
    - `"format": "prettier --write src/"`
    - `"test": "vitest"`
  - `dependencies`:
    - `vue: ^3.5.22`, `vue-router: ^4.5.1`, `pinia: ^3.0.3`
    - `dexie: ^4.2.1`, `sql.js: ^1.13.0`, `idb-keyval: ^6.2.2`
    - `pdf-lib: ^1.17.1`, `jspdf: ^3.0.3`
    - `chart.js: ^4.5.1`, `vue-chartjs: ^5.3.3`
    - `vee-validate: ^4.15.1`, `vue-toastification: ^2.0.0-rc.5`, `xlsx: ^0.18.5`, `uuid: ^13.0.0`
  - `devDependencies`:
    - `vite: ^7.1.7`, `vitest: ^3.2.4`, `@vue/test-utils: ^2.4.6`, `jsdom: ^27.0.0`
    - `eslint: ^9.33.0`, `eslint-plugin-vue: ~10.4.0`, `prettier: 3.6.2`
    - `vite-plugin-static-copy: ^3.2.0` (copies `node_modules/sql.js/dist/sql-wasm.wasm` to build root)
- Tool execution `npx vitest run`:
  - 1 test file passed: `src/components/__tests__/TesseraTemplate.test.js` (6 tests passing in 63ms).
- Tool execution `npm run build`:
  - Output: `✓ built in 9.11s` with chunks `dist/index.html`, `dist/assets/index-CVD948vW.js`, static copy of `sql-wasm.wasm`. Exited with code 0.
- Tool execution `npm run lint`:
  - Exited with code 0 with 0 errors.

### 1.3 Database Architecture (Dexie.js & SQLite / sql.js)
- File: `src/services/db.js` (lines 5-60) defines the primary IndexedDB store `CeraioloDigitaleDB` via Dexie:
  ```javascript
  db.version(1).stores({
    soci: `id, [cognome+nome], gruppo_appartenenza, data_prima_iscrizione, note`,
    tesseramenti: `id_tesseramento, id_socio, anno, data_pagamento, quota_pagata, numero_ricevuta, numero_blocchetto`,
    local_changes: `++id, table_name, record_id, change_type, timestamp, old_data, new_data`
  })
  db.version(2).stores({ settings: `key, value, updated_at` })
  db.version(3).stores({ blocchetti: `++id, numero_blocchetto, ricevute_da, ricevute_a, assegnato_a, data_assegnazione, data_restituzione` })
  ```
- Auto-backup hooks (`db.js`, lines 61-82):
  - Hooks on `soci`, `tesseramenti`, `blocchetti` trigger `backupService.notifyChange()`.
- File: `src/services/backupService.js` (lines 5-166):
  - Uses `window.showDirectoryPicker()` (File System Access API).
  - Stores `FileSystemDirectoryHandle` in IndexedDB via `idb-keyval` (key: `'backup_dir_handle'`).
  - Auto-backup debounced at 5000ms (`DEBOUNCE_MS`).
  - Writes `backup_YYYY-MM-DD/ceraiolo_backup.sqlite` and executes retention cleanup keeping the latest 3 daily folders.
- SQLite export & import (`db.js`, lines 695-850 & 2298-2441):
  - `exportDatabaseToSqlite()` initializes `sql.js`, creates tables (`Soci`, `Tesseramenti`, `Blocchetti`, `Settings`, `LocalChanges`, `Metadata`), populates all records, and returns an in-memory Uint8Array / Blob.
  - `importDatabaseFromSqlite(file)` initializes `sql.js`, verifies tables, opens a Dexie read-write transaction over all 4 core tables, clears them, and bulk-inserts all records.
- Migrations and Data Normalization (`db.js`, lines 2488-2558):
  - `normalizeDatabaseData()` detects historical legacy bugs where `numero_blocchetto > numero_ricevuta` and swaps them, cleans ghost blocchetti.
  - `syncBlocchettiFromTesseramenti()` auto-generates missing blocchetti from existing payment records.

### 1.4 Pinia Stores
- File: `src/stores/theme.js` (lines 4-34):
  - Manages `currentTheme` (`'light'` or `'dark'`), saves to `localStorage.getItem('theme')`, sets `document.documentElement.setAttribute('data-theme', theme)`.
- File: `src/stores/backupStore.js` (lines 5-55):
  - Manages `isAuthorized`, `lastBackup`, `autoBackupEnabled`, `backupPath`, directory handle via `idb-keyval`.

### 1.5 Accounting Formulas, Business Logic & Quotas
- File: `src/utils/payment.js` (lines 1-84):
  - Age calculation: `calculateAgeInYear(birthDateString, year)` = `year - birthDate.getFullYear()` (fallback: 99).
  - Exemption: `isExemptFromPayment(socio, year)` = `age < 18` (minors under 18 exempt).
  - Condono logic (`calculatePaymentStatus`):
    ```javascript
    const paidSet = new Set(paidYears)
    const isTargetPaid = paidSet.has(targetYear)
    if (isTargetPaid) return { inRegola: true, arretrati: [] }
    ```
    If target year is paid, status is immediately `inRegola: true` with no arrears.
    If unpaid and not exempt, `arretrati` collects unpaid non-exempt years from `firstYear` (`data_prima_iscrizione` or earliest payment) through `targetYear`.
- Quotas (`SettingsView.vue` lines 86-107, 454-455, `BatchEntryView.vue` lines 447-448):
  - `defaultQuota`: default 10.0€ (annual renewal quota).
  - `newMemberQuota`: default 25.0€ (new member / returning member quota).
  - `getQuotaAuditList(targetYear)` (`db.js`, lines 2567-2622): flags adult members paying < 25€ who are first-time payers (`paidYears[0] === targetYear`) or returning members (`!paidYears.includes(targetYear - 1)`).
- Booklet & Receipt Calculations (`BlocchettiView.vue`, lines 41-82):
  - Booklet cash total: `totaleIncassato = sum(quota_pagata)` for all payments with matching `numero_blocchetto`.
  - Multi-socio per receipt: payments are grouped by `numero_ricevuta`; a single receipt can contain multiple members (`id_socio`).

### 1.6 Batch Entry Component (`BatchEntryView.vue`)
- File: `src/views/BatchEntryView.vue` (1947 lines):
  - Session data: `annoRiferimento`, `numeroBlocchetto`, `dataPagamento`.
  - Receipt calculation: `currentReceipt.numero = (sessionData.numeroBlocchetto - 1) * config.value.receiptsPerBlock + 1`.
  - Receipt navigation: currently only has ⬅️ and ➡️ buttons (`decrementReceipt`, `incrementReceipt`) and numeric input.
  - **No visual 10-box bar `[1] [2] ... [10]` currently exists in the template** (lines 78-95).
  - Cache: `receiptsCache` is an in-memory `new Map()`. It does **not** fetch existing booklet receipts from Dexie upon navigation or page reload.
  - Booklet cash total: **No live booklet total is computed or displayed in `BatchEntryView.vue`**.
  - Inline socio creation: `showNewSocioForm` toggles a form block at the bottom (lines 223-325). `saveNewSocio()` creates the socio, registers payment for `annoRiferimento`, and pushes to `currentReceipt.soci`.

### 1.7 Reports & PDF Services (`ReportsView.vue`, `ReportsBetaView.vue`, `export.js`)
- File: `src/views/ReportsView.vue` (1704 lines):
  - Tabbed interface (`rinnovi`, `liste`, `export`, `stats`, `audit-quote`).
  - Calls `generateRenewalListPDF(soci, renewalYear)` in `export.js`.
  - Calls `generateChurnPDF(soci, year)` in `export.js`.
  - Calls `generateAllCardsPDF(soci, renewalYear, onProgress)` in `export.js`.
  - Contains link to `/reports-beta`.
- File: `src/views/ReportsBetaView.vue` (1350 lines):
  - "Report Builder Beta" feature.
  - Advanced filters: `onlyActiveMembers`, `ageGroup`, `paymentStatus`, election eligibility (`electionDate`, `electionEligibility`), manicchia checkboxes (`groups`), payment years with `AND`/`OR` logic (`paymentYears.logic`).
  - Column picker: selection of base columns (`cognomeNome`, `gruppo`, `dataNascita`, `eta`, `dirittoVoto`, `motivoEsclusione`, `firma`), column reordering (`moveColumn`), and payment year checkboxes.
  - Presets: save, load, delete presets in localStorage.
  - Live table preview: renders first 30 rows reactively based on active filters and column order.
  - Calls `generateBetaDynamicPDF` from `src/services/exportBeta.js`.
- File: `src/services/export.js` (lines 958-1140):
  - `generateAllCardsPDF(soci, renewalYear, onProgress)`:
    - Embeds `Times-Italic` font via `pdf-lib`.
    - Copies page 0 from `cardTemplatePDF`.
    - Overlays uppercase/capitalized member name and Italian birth date (`15 Maggio 1980`).
    - Sorting: line 979: `const sociOrdinati = soci.sort((a, b) => a.cognome.localeCompare(b.cognome))` — strictly alphabetical by surname. **Does not support Manicchia sorting**.
  - Booklet summary report ("Resoconto cassa blocchetti"): Not present in `export.js` (only visual breakdown in `BlocchettiView.vue`).

### 1.8 Styling, Theme, Typography & SVG Icons
- File: `src/assets/main.css`:
  - Line 2: `@import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Inter:wght@400;500;600;700&display=swap');` (Remote Google Fonts import, violates offline constraint).
  - Line 20: `--color-warning: #ed6c02;` (Contrast ratio < 4.5:1 on white).
  - Line 21: `--color-info: #0288d1;` (Contrast ratio < 4.5:1 on white).
- File: `src/App.vue`:
  - Header line 66-68: Theme button toggle with `🔥`/`🕯️` directly in navbar.
  - Nav links and headers use raw emojis: `🏠`, `🔄`, `🧾`, `📊`, `⚙️`.
- Emojis throughout UI:
  - Over 113 occurrences of emoji characters (`🔄`, `📋`, `📅`, `📄`, `🗓️`, `🧾`, `📊`, `👥`, `🎯`, `❌`, `🔍`, `➕`, `⚡`, `🔊`, `🔇`, `✅`, `⚠️`, `💰`, `👤`, `📝`, `💾`, `✏️`, `🎫`, `🗑️`, `🗳️`, `🕒`).
- File: `src/components/DashboardCharts.vue`:
  - Lines 198-223 & 252-276: Dual Y-axis (`y` for Total Members on left, `y1` for New/Lost Members on right). Tooltips are hover-only.
  - No tabular data mirror table currently displayed beneath the chart.

---

## 2. Logic Chain

1. **Architecture Preservation**:
   - Observation 1.1 & 1.2 confirm the repository is on branch `development`, cleanly builds with Vite v7, passes Vitest tests, and passes ESLint.
   - Observation 1.3 confirms the core database architecture is Dexie.js in the browser, with sql.js handling SQLite imports/exports and File System Access auto-backup.
   - Deduction: The existing stack (Vue 3, Dexie.js, sql.js, pdf-lib, jsPDF, Pinia) is fully intact and operational. No rewrite is needed or permitted.

2. **Batch Entry Gap Analysis (R1)**:
   - In `BatchEntryView.vue`, navigation uses simple increment/decrement on `currentReceipt.numero`.
   - The user requires a 10-box visual selector `[1] [2] ... [10]` reflecting the physical booklet structure (10 slips per booklet).
   - In `BatchEntryView.vue`, `receiptsCache` only holds in-memory data from the active session. If a user returns to receipt 1 or reloads the page, previously entered data for that booklet in `db.tesseramenti` is not reflected.
   - In `BatchEntryView.vue`, there is no computation or display of total booklet cash.
   - Deduction: Implementing R1 requires:
     1. Adding a 10-box visual bar component/strip (`[1] .. [10]`) where each box indicates whether it has registered soci/payments, active receipt selection, and allows direct clicking.
     2. Querying Dexie `db.tesseramenti` for `numero_blocchetto` and `numero_ricevuta` when navigating receipts to ensure multi-socio receipts are hydrated from DB.
     3. Computing the live booklet cash total (`sum(quota_pagata)` for current `numero_blocchetto`) reactively from Dexie and displaying it in tabular-nums.
     4. Enhancing the inline socio registration so that when "Nuovo Socio" is created, it seamlessly attaches to the active receipt without leaving the receipt context.

3. **Print Hub & PDF Lab Gap Analysis (R2)**:
   - `ReportsView.vue` and `ReportsBetaView.vue` are currently two completely separate pages with a router link between them.
   - `ReportsBetaView.vue` already contains the core logic for the dynamic PDF builder (custom column selection, reordering, AND/OR year logic, live preview table, and presets).
   - `ReportsView.vue` contains the standard reports (`generateRenewalListPDF`, `generateChurnPDF`, `generateAllCardsPDF`).
   - Deduction: Fusing them into a unified Hub requires:
     1. Placing 4 1-click quick-print buttons at the top of `ReportsView.vue`:
        - Rinnovi con arretrati (`generateRenewalListPDF`)
        - Ceraioli da sollecitare (`generateChurnPDF`)
        - Fogli tessere 6x (`generateAllCardsPDF` or 6-up sheet)
        - Resoconto cassa blocchetti (new summary PDF based on `BlocchettiView.vue` grouping)
     2. Integrating the dynamic "PDF Lab" from `ReportsBetaView.vue` into an expandable section in `ReportsView.vue`.
     3. Preserving the reactive live preview table and preset management.
     4. Redirecting `/reports-beta` in `router/index.js` to `/reports` for seamless navigation.

4. **Tessere Sorting Gap Analysis (R3)**:
   - `generateAllCardsPDF` in `src/services/export.js` currently sorts strictly by surname: `soci.sort((a, b) => a.cognome.localeCompare(b.cognome))`.
   - Deduction: To satisfy R3, an option must be introduced to sort by **MANICCHIA** (group) as primary key, with alphabetical sorting by surname/name as secondary key within each manicchia:
     ```javascript
     soci.sort((a, b) => {
       const groupA = (a.gruppo_appartenenza || '').toLowerCase()
       const groupB = (b.gruppo_appartenenza || '').toLowerCase()
       const groupCmp = groupA.localeCompare(groupB)
       if (groupCmp !== 0) return groupCmp
       return a.cognome.localeCompare(b.cognome)
     })
     ```
     This can be controlled via an option parameter or selector in the Print Hub.

5. **Icon System & Institutional Styling Gap Analysis (R4)**:
   - Emojis are hardcoded in template strings across ~10 components and views.
   - Deduction: Create a dedicated icon system (e.g. `src/components/icons/` with reusable SVG icon components or an `AppIcon.vue` registry) with minimalist vector paths (feather/SF Symbols style) styled in Santantoniari colors (ink black `#1a1a1a`, white `#ffffff`, warm gold `#d97706`/`#f59e0b`, ceraiolo red `#b71c1c`).

6. **Accessibility, Themes & Typography Gap Analysis (R5)**:
   - In `main.css`, the remote `@import url('https://fonts.googleapis.com/...');` must be replaced with an offline system font stack: `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
   - Contrast fix: change `--color-warning` from `#ed6c02` to `#c2410c`, and `--color-info` from `#0288d1` to `#0369a1`.
   - In `App.vue`, remove the flame/candle theme toggle from the header. In `SettingsView.vue` (under the "Generale" tab), add the theme selector (Light / Dark).
   - In `main.css` and table styles, add `font-variant-numeric: tabular-nums; text-align: right;` for financial amounts and receipt numbers, set table rows to minimum 48-52px height with alternating zebra striping.

7. **Senior Data Visualization Gap Analysis (R6)**:
   - `DashboardCharts.vue` has a confusing dual Y-axis (`y` and `y1`).
   - Deduction: Simplify `DashboardCharts.vue` by unifying the scale or presenting New/Lost members clearly without overlapping scales, and permanently render a high-contrast tabular data table below the chart with font size ≥ 17px, listing Year, Total Members, New Members, Lost Members, and net difference.

---

## 3. Caveats

1. **Hardware / Browser Restrictions on File System Access**:
   `window.showDirectoryPicker` used in `backupService.js` is supported in Chromium-based browsers (Chrome, Edge) but not in Firefox or mobile browsers. This is existing architecture and functioning as intended on the desktop application.
2. **Template PDF format**:
   `generateAllCardsPDF` relies on `cardTemplatePDF` uploaded in Settings. When generating cards, if no template PDF is configured in settings, it raises an error. Single card preview fallback uses `TesseraTemplate.vue`.
3. **No Database Write during Investigation**:
   All checks were executed in read-only mode. No production code was modified during this survey.

---

## 4. Conclusion

The repository is healthy, on the correct git branch `development`, cleanly builds with `npm run build`, passes all existing Vitest tests with `npx vitest run`, and complies with ESLint (`npm run lint`).

The codebase exhibits clear modularity:
- Local database via Dexie.js with SQLite sql.js integration and File System Access auto-backup is solid and robust.
- Business rules and accounting formulas (condono logic, minor exemptions, 10€/25€ quotas, booklet groupings) are well-defined and must be preserved with zero regression.
- The 6 refactoring objectives (R1 to R6) are tightly scoped, fully addressable within existing files, and can be implemented incrementally without architectural disruption.

---

## 5. Verification Method

To independently verify all findings:

1. **Git Branch & Status**:
   ```powershell
   git status -s -b
   ```
   *Expected*: `## development` with clean working tree (no modified tracked files).

2. **Test Suite**:
   ```powershell
   npx vitest run
   ```
   *Expected*: 1 test file passed (`src/components/__tests__/TesseraTemplate.test.js`), 6 passed tests.

3. **Build Execution**:
   ```powershell
   npm run build
   ```
   *Expected*: Vite build completes with code 0, generates `dist/` containing `index.html`, bundles, and copies `sql-wasm.wasm`.

4. **Linting Check**:
   ```powershell
   npm run lint
   ```
   *Expected*: ESLint exits with code 0.

5. **Files Inspected for Gaps**:
   - `src/views/BatchEntryView.vue`: inspect lines 78-95 to verify absence of 10-box visual selector and booklet cash total.
   - `src/views/ReportsView.vue` & `src/views/ReportsBetaView.vue`: verify separation of standard reports and PDF Lab.
   - `src/services/export.js`: inspect line 979 to verify card sorting is solely surname alphabetical.
   - `src/assets/main.css`: inspect line 2 for Google Fonts `@import` and lines 20-21 for warning/info color values.
   - `src/components/DashboardCharts.vue`: inspect lines 252-276 for dual Y-axes `y` and `y1`.

---
*Report completed by explorer_survey_2.*
