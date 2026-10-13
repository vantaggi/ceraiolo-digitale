# Dispatch for Explorer (Survey 2 - Architecture, Core & Data)

**Task**: Investigate existing codebase architecture, Git branch, core stores, data models, accounting logic, and build/test setup.
**Working Directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_survey_2`
**Files to Read**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\piano_di_refactoring_santantoniari.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\package.json`
- Codebase files in `src/` (stores, db, services, models, router, components)

**Objectives**:
1. Check current git branch (must be `development` or verify branch status) and package.json scripts (build, test, dev, linter).
2. Map data layer: Dexie.js schema, SQLite / sql.js integration, persistence, migration mechanism.
3. Map accounting formulas and business logic: receipt calculations, booklet/block totals, multi-socio receipt handling, quotes, membership status.
4. Investigate current batch entry implementation and reports/PDF generation:
   - Identify existing batch entry views/components.
   - Identify `ReportsView.vue`, `ReportsBetaView.vue`, pdf generation services (pdf-lib, jsPDF).
   - Investigate membership card generation logic and template printing.
5. Identify any existing unit/E2E test setup (Vitest, Jest, Playwright, Cypress) and how to run tests.
6. Write a comprehensive investigation report in `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_survey_2\handoff.md`.
7. Send a message to the orchestrator upon completion.
