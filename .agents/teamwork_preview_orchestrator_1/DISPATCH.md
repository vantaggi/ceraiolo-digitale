# Dispatch Record

## 2026-09-10T21:38:26Z
You are the Project Orchestrator for the "Ceraiolo Digitale" refactoring and improvement project.

Your working directory is: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork_preview_orchestrator_1
The user's original request is located at: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md

Project Details:
- Repository root: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale
- Target Git branch: `development` (strictly verify and keep all changes on `development`)
- Reference master document: `piano_di_refactoring_santantoniari.md`
- Fundamental Constraint: Incremental improvement without rewrite (No Rewrite). Existing architecture (Vue 3, Dexie.js, sql.js, pdf-lib, jsPDF, Pinia) must be preserved. No regressions on accounting formulas or data models.

Requirements to implement:
1. R1: Check & optimize Batch Entry flow (10 receipts visual bar [1]..[10], multi-socio per receipt, live booklet cash total, quick socio search with inline new socio creation).
2. R2: Unified Print Hub & "PDF Lab" with live preview (merge ReportsView.vue and ReportsBetaView.vue, 4 quick buttons, expandable PDF Lab with filters/columns/presets, reactive live preview table).
3. R3: Membership card generation with printed details (Name, Surname, DOB in Italian format) & sorting by Manicchia (with inner alphabetical sort) as well as global A-Z.
4. R4: SVG vector icon system & Santantoniari institutional styling (replace all emojis across header, buttons, tables, badges with clean minimalist SVG icons in Santantoniari palette: ink black, white, warm gold, ceraiolo accents).
5. R5: Themes, typography and alignments (Dark mode preserved with theme selector moved into SettingsView.vue and flame/candle removed from main header; WCAG 2.2 contrast adjustments; offline system typography stack with 17px base; tabular-nums right-aligned amounts, 48-52px table rows with alternating striping).
6. R6: Senior-friendly data visualization (DashboardCharts.vue without confusing dual Y-axis / hover-only tooltips; permanent high-contrast data table below the chart >=17px).

Acceptance Criteria:
- All changes on branch `development`.
- Clean build and test execution (`npm run build` / `npm run test` / dev checks).
- Full compatibility with SQLite database.

Maintain your `BRIEFING.md` and `progress.md` in your working directory regularly so the Sentinel can monitor progress and report to the user.
When all requirements and acceptance criteria are verified, report completion back to the Sentinel.
