# Handoff Report: Specification Mining & Acceptance Criteria (Survey 1)

**Agent**: spec_miner_survey_1  
**Milestone**: Survey 1 - Specification Mining  
**Target Repository Root**: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale  
**Target Git Branch**: development  
**Status**: Hard Handoff (Task Complete)

---

## 1. Observation

Direct code and repository observations conducted via read-only tools and terminal verification:

1. **Git Environment & Branch**:
   - `git branch -a` shows active branch is `* development`.
   - `git status` confirms working directory is on `development` with untracked `.agents/` metadata and `ORIGINAL_REQUEST.md`.
   - Test command `npx vitest run` executed with exit code 0 (`1 passed (1)`, `6 passed (6)` in `TesseraTemplate.test.js`).
   - Build command `npm run build` executed with exit code 0 (`vite v7.1.9`, 574 modules transformed, built in 5.32s).

2. **Absence of Separate `piano_di_refactoring_santantoniari.md` File**:
   - Search for `piano_di_refactoring_santantoniari.md` via `find_by_name` and `git log` revealed that this file is not present as a separate standalone `.md` file on the filesystem.
   - Observation in `ORIGINAL_REQUEST.md` (lines 4–60) and `.agents/teamwork_preview_orchestrator_1/DISPATCH.md` (lines 12–22): The full text of the refactoring plan, requirements R1–R6, constraints, and acceptance criteria are comprehensively encapsulated in `ORIGINAL_REQUEST.md` and referenced therein as the master specification.

3. **R1: Batch Entry Codebase Inspection (`src/views/BatchEntryView.vue`)**:
   - Lines 70–96: Currently has receipt controls with `decrementReceipt` and `incrementReceipt` buttons and a numeric input for `currentReceipt.numero`. There is NO 10-slot visual navigation bar (`[1] [2] ... [10]`).
   - Line 584: `calculatedReceiptNumber = (newVal - 1) * config.value.receiptsPerBlock + 1` links booklet number to receipt numbers in batches of 10 (`config.value.receiptsPerBlock = 10`).
   - Lines 98–115: `currentReceipt.soci` displays members on the active receipt with deletion buttons (`removeFromReceipt`), but there is NO calculation or display of the running cash total for the active booklet (`numero_blocchetto`).
   - Lines 222–325 & 898–965: Inline new socio form exists (`showNewSocioForm`), but is toggled via search failure or header button; needs smooth inline integration that keeps receipt context intact and enables continuous high-speed data entry.

4. **R2: Print Hub Codebase Inspection (`src/views/ReportsView.vue` & `src/views/ReportsBetaView.vue`)**:
   - Currently, two separate views exist: `ReportsView.vue` (at route `/reports`, lines 1–1704) and `ReportsBetaView.vue` (at route `/reports-beta`, lines 1–1350).
   - In `ReportsView.vue` lines 8–51, navigation has 5 tabs (`rinnovi`, `liste`, `export`, `stats`, `audit-quote`) plus a link to `/reports-beta`.
   - In `ReportsBetaView.vue` lines 39–250, there is a full dynamic query builder with presets (`savedPresets`), general filters (`onlyActiveMembers`, `ageGroup`, `paymentStatus`), election filters (`electionDate`, `electionEligibility`), group filters (`groups`), payment years filters (`paymentYears.list` with AND/OR logic toggle), column selection/reordering (`moveColumn`), and a reactive live preview table (lines 258–306).
   - The 4 essential quick 1-click print buttons specified in R2 are:
     a) Rinnovi con arretrati (generateRenewalListPDF in export.js:465)
     b) Ceraioli da sollecitare / Churn (generateChurnPDF in export.js:1640)
     c) Fogli tessere 6x (generateAllCardsPDF in export.js:958)
     d) Resoconto cassa blocchetti (BlocchettiView.vue:41-124 dynamic logic, but lacking a dedicated 1-click PDF generator in ReportsView.vue).

5. **R3: Membership Cards Codebase Inspection (src/services/export.js & src/components/TesseraTemplate.vue)**:
   - In src/services/export.js line 979: const sociOrdinati = soci.sort((a, b) => a.cognome.localeCompare(b.cognome)). Currently only supports global alphabetical sort by surname.
   - Lines 996–1015: Italian date formatting ormattaData outputs day, Italian month name (Gennaio to Dicembre), and year.
   - Lines 1020–1111: Word wrapping and typography rendered with Times-Italic font onto the background template.
   - In src/components/TesseraTemplate.vue lines 53–73: Component renders name, Italian formatted birthdate (15 Maggio 1980), and template background.
   - Missing: Sorting option by **MANICCHIA** (group) with inner alphabetical sort (gruppo_appartenenza ASC -> cognome ASC -> 
ome ASC).

6. **R4: Icons & Emojis Codebase Inspection**:
   - Across App.vue, BatchEntryView.vue, ReportsView.vue, ReportsBetaView.vue, HomeView.vue, SettingsView.vue, BlocchettiView.vue: Over 45 distinct emojis are used as UI iconography (🏠, 🔄, 🧾, 📊, ⚙️, 🕯️, 🔥, 📅, 📄, 🗓️, 👥, 🎯, ❌, 🔍, ➕, ⚡, 🔊, 🔇, ✕, 🔎, ✅, ⚠️, 💰, 👤, 📝, 💾, 📦, 📈, ⚖️, 🛠️, ⏳, 📉, 🎫, 👁️, 🆕, 🔢, 🗳️, 🗑️, ℹ️, ◀, ▶, 🔧, 🏘️, 📤, 📥).
   - No external icon library is in package.json. A clean, minimalist SVG icon system (Apple SF Symbols style) using the Santantoniari palette (#1a1a1a, #ffffff, #c59b27, #b71c1c) is required.

7. **R5: Themes, Typography, and Alignments (src/assets/main.css & src/App.vue & src/views/SettingsView.vue)**:
   - src/assets/main.css line 2: Remote font import @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Inter:wght@400;500;600;700&display=swap'); violates offline resilience.
   - Lines 20–21: --color-warning: #ed6c02; and --color-info: #0288d1; do not satisfy WCAG 2.2 AA contrast ratio (≥4.5:1) against white surfaces. Must be #c2410c and #0369a1.
   - src/App.vue lines 66–68: Toggle button with 🕯️/🔥 is present directly in the header navigation, prone to accidental clicks by senior operators.
   - src/views/SettingsView.vue lines 42–116: Generale configuration tab exists and currently lacks the theme selector.
   - Accounting figures in tables do not consistently enforce 	ext-align: right and ont-variant-numeric: tabular-nums, and table row heights are below 48px in several views.

8. **R6: Senior Data Visualization (src/components/DashboardCharts.vue)**:
   - Lines 195–283: Dual Y-axis is active (y on left for total members, y1 on right for new/lost members), causing overlapping scales and confusion. Tooltips are hover-only.
   - No data table exists below the chart; values are invisible unless hovered over.

---

## 2. Logic Chain

From these direct observations, the complete specifications and acceptance criteria are derived through the following deductive chain:

1. **Architecture & Scope Preservation (No Rewrite)**:
   - *Premise*: The existing codebase is fully functional, offline-capable, and tested with Dexie.js and sql.js.
   - *Inference*: No core libraries or database tables (soci, 	esseramenti, settings, locchetti, local_changes) should be replaced. Enhancements must be surgical, incremental Vue 3 Composition API improvements on the development branch.

2. **R1 Flusso Blocchetti**:
   - *Premise*: Physical booklets in Gubbio contain exactly 10 sheets (icevutePerBlocchetto = 10), each receipt numbered (blocchetto - 1) * 10 + 1 through locchetto * 10. Multiple family members often pay on one receipt.
   - *Inference*: Operator ergonomics require a visual strip of 10 boxes [1] [2] ... [10] indicating status (empty, filled with N soci, or currently active). Operators need live real-time cassa computation for the active booklet so they can cross-check physical cash against the screen before handing over the booklet.

3. **R2 Unified Print Hub & PDF Lab**:
   - *Premise*: Operators need 4 frequent standard reports at their fingertips, but also require customizable ad-hoc queries (e.g. for election roll verification or territorial delivery) without switching between two disjointed views (/reports vs /reports-beta).
   - *Inference*: Consolidating ReportsView.vue and ReportsBetaView.vue into a single screen with 4 one-click primary buttons at the top, followed by an expandable/collapsible PDF Lab with instant reactive table preview, eliminates navigation friction and unifies export services (export.js + exportBeta.js).

4. **R3 Membership Card Sorting by Manicchia**:
   - *Premise*: Capodieci and zone referents distribute printed cards locally in Gubbio by neighborhood/manicchia (e.g. San Martino, Sant'Agostino, Duomo).
   - *Inference*: Sorting solely by surname forces hours of manual card sorting. Providing an option for Ordinamento per Manicchia (primary key: gruppo_appartenenza, secondary key: cognome + 
ome) alongside global A-Z enables immediate territorial bundle generation.

5. **R4 SVG Vector Icon System**:
   - *Premise*: Emojis render inconsistently across Windows 10/11, iOS, Linux, and Android, and detract from the solemn, institutional identity of the Famiglia dei Santantoniari.
   - *Inference*: A unified SVG icon system conforming to Apple SF Symbols minimalist stroke aesthetics, styled in ink black, pure white, warm gold, and ceraiolo red, provides visual clarity and offline independence.

6. **R5 Themes, Typography & WCAG 2.2**:
   - *Premise*: Senior volunteer operators experience difficulty with small text, low contrast, accidental theme switches, and misaligned numbers.
   - *Inference*: Removing the toggle from the header into SettingsView ensures accidental clicks are eliminated. Setting base typography to 17px system font stack guarantees 100% offline functionality. Darkening warning (#c2410c) and info (#0369a1) satisfies WCAG 2.2 contrast ratio ≥4.5:1. 	abular-nums and 48–52px zebra rows ensure accounting accuracy.

7. **R6 Senior Data Visualization**:
   - *Premise*: Dual Y-axes and hover tooltips are notorious accessibility barriers for elderly users and touch interfaces.
   - *Inference*: Simplifying the chart to a single scale and adding a permanent high-contrast specular data table (font size ≥17px) immediately below the chart allows instant reading without mouse movement.

---

## 3. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | R1: Batch Entry | 10-Slot Visual Receipt Bar | Visual navigation bar displaying 10 numbered slots [1] to [10] corresponding to the active booklet's receipts (B-1)*10 + 1 .. B*10. Indicates empty vs. filled status and active selection. | Click on slot [1]..[10], arrow keys (ArrowLeft, ArrowRight). | Active receipt switches; UI displays soci attached to that slot; focus returns to search. | If unsaved changes in current slot, auto-commits or validates before switching. | ORIGINAL_REQUEST.md § R1; BatchEntryView.vue:70-96 |
| 2 | R1: Batch Entry | Live Booklet Cash Total | Real-time calculation and display of total cash collected for the active booklet across all 10 receipts. | Quota inputs (quota_pagata), member addition/removal, booklet change. | Formatted euro string (e.g. € 120,00), breakdown of standard vs new member fees. | If DB fetch fails, displays € 0,00 with toast error notification. | ORIGINAL_REQUEST.md § R1; BatchEntryView.vue:378-450 |
| 3 | R1: Batch Entry | Reinforced Multi-Socio Receipt | Capability to attach multiple soci to a single receipt sheet (currentReceipt.soci) with individual fees, receipt subtotal, and individual deletion. | Selected socio, fee amount (quota_pagata), payment date. | List of soci on current receipt with badge and remove button; updated receipt subtotal. | Prevents duplicate payment for same member/year with error modal. | ORIGINAL_REQUEST.md § R1; BatchEntryView.vue:98-115,831-896 |
| 4 | R1: Batch Entry | Seamless Inline New Socio | Fast inline modal/drawer to register a new member without navigating away or losing active receipt context. | Surname, Name, DOB, POB, Manicchia, Notes. | Saves socio to DB, immediately records current year payment at 
ewMemberQuota (€25), adds to current receipt. | Validates required fields (Cognome, Nome, DOB); highlights missing inputs in red. | ORIGINAL_REQUEST.md § R1; BatchEntryView.vue:222-325 |
| 5 | R2: Print Hub | 4 Quick Essential 1-Click Buttons | Top priority bar with 4 one-click buttons for: 1. Rinnovi con arretrati, 2. Ceraioli da sollecitare, 3. Fogli tessere 6x, 4. Resoconto cassa blocchetti. | Single click on respective button + reference year input. | Immediate PDF file download with timestamped filename; progress/toast indicator. | Shows disabled state while loading; displays toast on generation failure. | ORIGINAL_REQUEST.md § R2; ReportsView.vue:75-135 |
| 6 | R2: Print Hub | Expandable PDF Lab | Collapsible accordion section containing advanced custom query builder merged from ReportsBetaView.vue. | Toggle expand/collapse button. | Expanded panel with filters, column pickers, presets, and sorting. | Preserves state when collapsed/re-expanded. | ORIGINAL_REQUEST.md § R2; ReportsBetaView.vue:59-250 |
| 7 | R2: Print Hub | Multi-Year AND/OR Filtering | Filter members by payment across multiple selected years using boolean logic AND (paid all) vs OR (paid at least one). | Array of selected years, radio toggle AND / OR. | Filtered member list meeting the boolean condition. | If no years selected, ignores year filter (shows all). | ReportsBetaView.vue:130-152 |
| 8 | R2: Print Hub | Dynamic Column Selector & Reorderer | Select which columns appear in PDF table and reorder base columns horizontally (◀ / ▶). | Column checkboxes (cognomeNome, gruppo, dataNascita, eta, dirittoVoto, motivoEsclusione, irma, year columns). | Reordered table layout reflected immediately in preview and exported PDF. | At least one column must remain checked; disables move buttons at boundaries. | ReportsBetaView.vue:156-231 |
| 9 | R2: Print Hub | Reactive Live Table Preview | Real-time specular table rendered on screen showing filtered data with badges (V, X, O, -) and total row count. | Any filter, column, or sorting change. | Instantly updated preview table (showing first 30 rows + remaining count). | If 0 results, shows empty state with filter reset prompt. | ORIGINAL_REQUEST.md § R2; ReportsBetaView.vue:258-310 |
| 10 | R2: Print Hub | Preset Save & Load | Save current filter and column setup under a custom name, store in localStorage/settings, and reload in 1 click. | Preset name string; click on saved preset tag. | Saves to preset list; clicking loads entire filter/column state. | Prompts if name is empty; confirmation on preset deletion. | ReportsBetaView.vue:39-57 |
| 11 | R2: Print Hub | Resoconto Cassa Blocchetti PDF | Dedicated PDF report generating an audit sheet of all physical booklets: booklet number, assignee, issue/return date, receipts issued, total cassa. | Selected year or all-time toggle. | Formatted A4 PDF table with booklet summary and grand total. | Handled gracefully if no booklets exist in DB. | ORIGINAL_REQUEST.md § R2; BlocchettiView.vue:41-124 |
| 12 | R3: Membership Cards | Italian DOB Typography | Typographic rendering of member birthdate in full Italian text (e.g. 15 Maggio 1980) centered on card template. | ISO date YYYY-MM-DD. | Italian formatted string rendered via pdf-lib and TesseraTemplate.vue. | Returns empty string or - if date is missing or invalid. | export.js:996-1015; TesseraTemplate.vue:53-73 |
| 13 | R3: Membership Cards | Sorting by Manicchia (Zone) | Sort membership card PDF generation primarily by gruppo_appartenenza (Manicchia) and secondarily alphabetical by surname/name. | Radio choice: Alfabetico Generale (A-Z) vs Per Manicchia. | PDF with cards ordered in territorial bundles, ready for zone delivery. | Handles null/empty groups by grouping under Non specificato at end. | ORIGINAL_REQUEST.md § R3; export.js:979 |
| 14 | R3: Membership Cards | 6-Up Sheet Layout (6x A4) | Card printing option formatted 6 cards per A4 page for desktop printer batch runs. | Filtered soci list, year, template. | Multi-page PDF with 6 cards per sheet. | Handles trailing sheets with fewer than 6 cards cleanly. | ORIGINAL_REQUEST.md § R2, R3; MANUALE_OPERATIVO.md:122 |
| 15 | R4: Vector Icon System | Minimalist SVG Icon Suite | Complete replacement of all UI emojis with Apple SF Symbols / Jony Ive style monochrome & tinted vector SVGs. | Icon name, size (16, 20, 24px), color class. | Crisp scalable inline SVG elements across header, buttons, tables, badges. | Fallback generic icon if name not recognized. | ORIGINAL_REQUEST.md § R4 |
| 16 | R4: Vector Icon System | Santantoniari Palette Styling | Coordinated color tokens for icons: ink black (#1a1a1a), pure white (#ffffff), warm gold (#c59b27), and ceraiolo red (#b71c1c). | CSS theme class / variables. | Icons adapt seamlessly between light and dark themes. | Complies with high-contrast rules. | ORIGINAL_REQUEST.md § R4 |
| 17 | R5: Themes & Contrasts | Dark Mode in SettingsView | Removal of header toggle (🕯️/🔥); theme selection moved inside SettingsView.vue (Generale tab). | User selection: Chiaro vs Scuro radio/cards. | Document data-theme attribute updated, saved to localStorage. | Defaults to light if invalid value in storage. | ORIGINAL_REQUEST.md § R5; App.vue:66-68; 	heme.js |
| 18 | R5: Themes & Contrasts | WCAG 2.2 Contrast Tokens | Darkened warning token (#c2410c) and info token (#0369a1) guaranteeing contrast ratio ≥ 4.5:1. | CSS color tokens in :root and [data-theme='dark']. | All badges, alerts, and text pass WCAG 2.2 AA contrast tests. | N/A | ORIGINAL_REQUEST.md § R5; main.css:19-21 |
| 19 | R5: Themes & Contrasts | 100% Offline System Typography | Elimination of Google Fonts remote @import; adoption of native system font stack with 17px base size. | CSS ont-family: system-ui, Segoe UI, Roboto, sans-serif; font-size: 17px;. | Instant offline rendering with zero network latency and enhanced readability. | Fallbacks ensure compatibility across Windows, macOS, Linux. | ORIGINAL_REQUEST.md § R5; main.css:2, 23-24 |
| 20 | R5: Themes & Contrasts | Accounting Right-Alignment & Tabular Nums | Strict right-alignment of currency amounts, cassa values, and quotas with ont-variant-numeric: tabular-nums. | Numeric amounts. | Perfectly aligned decimal figures across table columns. | Handles zero or null amounts as € 0,00. | ORIGINAL_REQUEST.md § R5 |
| 21 | R5: Themes & Contrasts | 48–52px Zebra Striped Tables | Data tables styled with minimum row height of 48–52px and alternating background striping. | Table row DOM elements. | Touch-friendly, accessible rows for senior volunteers. | Responsive scrolling for narrow viewports. | ORIGINAL_REQUEST.md § R5 |
| 22 | R6: Senior Data Viz | Single-Scale Uncluttered Chart | Removal of confusing dual Y-axis and hover-only dependencies in DashboardCharts.vue. | Yearly member stats from DB (getYearlyStats). | Clear bar/line visualization on a single coherent scale. | Graceful rendering when data history is short. | ORIGINAL_REQUEST.md § R6; DashboardCharts.vue:251-283 |
| 23 | R6: Senior Data Viz | Permanent High-Contrast Specular Table | Permanent table below chart displaying Year, Total Members, Trend (↑/↓), New Members, and Non-Renewed with font size ≥17px. | displayedData computed array from range selector (5y, 10y, ll). | High-contrast specular table visible without mouse hover. | Shows empty state notice if DB contains no payment records. | ORIGINAL_REQUEST.md § R6; DashboardCharts.vue:156-189 |

---

## 4. Edge Cases & Observed Behaviors

| # | Feature | Input / Condition | Observed / Required Behavior |
|---|---------|-------------------|------------------------------|
| 1 | R1: 10-Slot Visual Bar | Switching to slot [7] when slot [1] has unsaved new socio form data | Form validation check: prompt operator or preserve unsaved draft in local component state; do not wipe entered data without confirmation. |
| 2 | R1: Live Booklet Total | Booklet number changed to a non-existent or fresh number (e.g. 99) | Live booklet total immediately computes to € 0,00; visual bar slots [1]..[10] all show empty state. |
| 3 | R1: Multi-Socio Receipt | Attempt to add a socio who has already paid for the current reference year | indExistingPaymentYear triggers; displays explicit error modal blocking double payment: ERRORE: L'anno X risulta già pagato per questo socio. |
| 4 | R1: Multi-Socio Receipt | Deleting one socio from a multi-socio receipt sheet containing 3 soci | Only the targeted socio's payments are removed from Dexie 	esseramenti via deleteTesseramentiByReceipt; other 2 soci remain on sheet; receipt total and booklet cassa total decrement by exactly the removed amount. |
| 5 | R1: Inline New Socio | New socio with identical name and surname as an existing member | Warning or disambiguation prompt based on date of birth; allows registration if birth dates differ (e.g. father and son). |
| 6 | R2: PDF Lab AND/OR Logic | Years selected: [2024, 2025] with logic AND | Only members who have valid payment records in BOTH 2024 AND 2025 are included in the preview and exported PDF. |
| 7 | R2: PDF Lab AND/OR Logic | Years selected: [2024, 2025] with logic OR | Members who paid in 2024, 2025, or BOTH are included in the preview and exported PDF. |
| 8 | R2: PDF Lab Column Reorder | Moving column from index 0 leftwards (◀) or last index rightwards (▶) | Button is strictly disabled (:disabled=index === 0 / :disabled=index === len - 1); no array out-of-bounds error. |
| 9 | R2: Quick Buttons | Generation triggered while database is loading or previous generation active | Action button is disabled with loading spinner (⏳ ...); prevents duplicate concurrent PDF builds in memory. |
| 10 | R3: Manicchia Card Sort | Member with empty or null gruppo_appartenenza | Grouped under Non specificata or placed at the end of the manicchie sequence; internal alphabetical ordering by surname/name is strictly maintained. |
| 11 | R3: Long Member Names | Surname and Name exceeding card width (e.g. Franceschini Baldassarre Massimiliano) | wrapText splits text into multiple centered lines using 
ameMinLineHeight (8mm) and adjusts starting currentY to remain optically centered within the 70% printable width. |
| 12 | R3: Italian Month Names | Birthdate in month 01 through 12 | Formatted strictly as Italian text (Gennaio, Febbraio, Marzo, Aprile, Maggio, Giugno, Luglio, Agosto, Settembre, Ottobre, Novembre, Dicembre); never English or raw numbers. |
| 13 | R4: SVG Icons | Dark mode enabled | SVGs inherit currentColor or appropriate dark theme tokens (white #ffffff / light grey #e0e0e0 / gold #c59b27), maintaining high visibility without black-on-black blending. |
| 14 | R5: Offline Font Stack | System booted with no internet access (completely air-gapped PC) | UI renders immediately using native system fonts (Segoe UI on Windows) with zero flash of unstyled text (FOUT) or external request timeout. |
| 15 | R5: WCAG Contrasts | Small text with warning or info background in high ambient light | Text achieves ≥ 4.5:1 contrast against both #ffffff and dark mode backgrounds, preventing legibility failures. |
| 16 | R6: Specular Data Table | History range selected as '5y', '10y', or 'all' | Specular table reactively updates to display exactly the same years as the chart; column totals and variations match chart bar heights 1:1. |

---

## 5. Caveats

1. **Standalone piano_di_refactoring_santantoniari.md File**:
   - The user dispatch referenced piano_di_refactoring_santantoniari.md. File system search confirmed this specific filename is not present as a separate file on disk, but its entire substance, wording, and breakdown are preserved verbatim in .agents/ORIGINAL_REQUEST.md (lines 4–60).
2. **SQLite Binary Export/Import Compatibility**:
   - The SQLite database schema (soci, 	esseramenti, settings, locchetti, local_changes) is the single source of truth for synchronization between PCs. Any modifications to views must NOT alter the columns or types stored in Dexie/SQLite.
3. **No Code Implementation in this Role**:
   - As a Specification Miner, no application source files have been modified. All findings are strictly analytical and evidentiary.

---

## 6. Conclusion

The functional, architectural, and accessibility specifications for the Ceraiolo Digitale project are completely identified, unambiguous, and directly mapped to existing source files:
- **R1 (Batch Entry)**: Ready for 10-slot visual bar [1]..[10], live booklet cash total calculation, multi-socio receipt breakdown, and seamless inline new socio modal in BatchEntryView.vue.
- **R2 (Print Hub & PDF Lab)**: Ready for consolidation of ReportsView.vue and ReportsBetaView.vue, 4 top-priority 1-click buttons (including new Resoconto Cassa Blocchetti PDF), expandable PDF Lab with live reactive preview table, and column reordering.
- **R3 (Membership Cards)**: Ready for dual sorting mode (Global A-Z vs. Manicchia with inner alphabetical sort) in export.js and ReportsView.vue, preserving Italian date typography and 6x sheet layout.
- **R4 (SVG Icon System)**: Ready for replacement of all 45+ emojis with custom minimalist SVG vector icons in Santantoniari colors (#1a1a1a, #ffffff, #c59b27, #b71c1c).
- **R5 (Themes, Typography, Alignments)**: Ready for removal of header toggle, placement of theme selector into SettingsView.vue, removal of Google Fonts import in main.css, WCAG 2.2 contrast compliance (#c2410c / #0369a1), 17px base font, 	abular-nums right alignment, and 48–52px zebra rows.
- **R6 (Senior Data Viz)**: Ready for single-scale visual clarity in DashboardCharts.vue paired with a permanent specular high-contrast data table (≥17px).

---

## 7. Verification Method

To independently verify these specifications and the integrity of the workspace:

1. **Verify Git Branch**:
   ```bash
   git branch --show-current
   # Expected output: development
   ```
2. **Verify Clean Build**:
   ```bash
   npm run build
   # Expected output: vite v7.1.9 building for production... ✓ built in ~5s
   ```
3. **Verify Existing Test Suite**:
   ```bash
   npx vitest run
   # Expected output: 1 passed (1), 6 passed (6) in TesseraTemplate.test.js
   ```
4. **Inspect Specification Sources**:
   - c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md
   - c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\DEVELOPMENT_GUIDELINES.md
   - c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\MANUALE_OPERATIVO.md
5. **Inspect Target Implementation Files**:
   - src/views/BatchEntryView.vue
   - src/views/ReportsView.vue & src/views/ReportsBetaView.vue
   - src/services/export.js & src/services/exportBeta.js
   - src/components/TesseraTemplate.vue
   - src/components/DashboardCharts.vue
   - src/views/SettingsView.vue
   - src/App.vue
   - src/assets/main.css
