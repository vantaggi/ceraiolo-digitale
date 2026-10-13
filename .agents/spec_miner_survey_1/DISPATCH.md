# Dispatch for Spec Miner (Survey 1)

**Task**: Extract complete and precise specifications from `piano_di_refactoring_santantoniari.md` and `.agents/ORIGINAL_REQUEST.md`.
**Working Directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\spec_miner_survey_1`
**Files to Read**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\piano_di_refactoring_santantoniari.md`

**Objectives**:
1. Enumerate every single requirement and constraint for:
   - R1: Batch Entry flow (10 receipts visual bar [1]..[10], multi-socio per receipt, live booklet cash total, quick socio search with inline new socio creation).
   - R2: Unified Print Hub & "PDF Lab" with live preview (merge ReportsView.vue and ReportsBetaView.vue, 4 quick buttons, expandable PDF Lab with filters/columns/presets, reactive live preview table).
   - R3: Membership card generation with printed details (Name, Surname, DOB in Italian format) & sorting by Manicchia (with inner alphabetical sort) as well as global A-Z.
   - R4: SVG vector icon system & Santantoniari institutional styling (replace all emojis across header, buttons, tables, badges with clean minimalist SVG icons in Santantoniari palette: ink black, white, warm gold, ceraiolo accents).
   - R5: Themes, typography and alignments (Dark mode preserved with theme selector moved into SettingsView.vue and flame/candle removed from main header; WCAG 2.2 contrast adjustments; offline system typography stack with 17px base; tabular-nums right-aligned amounts, 48-52px table rows with alternating striping).
   - R6: Senior-friendly data visualization (DashboardCharts.vue without confusing dual Y-axis / hover-only tooltips; permanent high-contrast data table below the chart >=17px).
2. Detail all constraints: Git branch `development`, No Rewrite (Vue 3, Dexie.js, sql.js, pdf-lib, jsPDF, Pinia), no regressions on accounting formulas or data models.
3. Write a comprehensive specification report in `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\spec_miner_survey_1\handoff.md`.

## 2026-09-10T21:38:59Z
You are spec_miner_survey_1. Your working directory is c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\spec_miner_survey_1.
Read your instructions in c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\spec_miner_survey_1\DISPATCH.md.
Also read:
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\piano_di_refactoring_santantoniari.md

Mine and extract the complete specifications and acceptance criteria for R1 (Batch Entry), R2 (Print Hub & PDF Lab), R3 (Membership cards), R4 (SVG icons & Santantoniari styling), R5 (Themes, typography, alignments), and R6 (Senior data viz), plus architectural constraints (No Rewrite, Vue 3, Dexie.js, sql.js, pdf-lib, jsPDF, Pinia, branch development).
Write your complete findings and specifications report to c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\spec_miner_survey_1\handoff.md.
When finished, send a message to your parent with your summary and handoff path.
