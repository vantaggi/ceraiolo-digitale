# BRIEFING — 2026-09-10T23:45:00Z

## Mission
Investigate repository structure, git branch status, package.json build/test scripts, database layer (Dexie.js & SQLite/sql.js), Pinia stores, accounting formulas, batch entry components, reports/PDF services, and testing frameworks.

## 🔒 My Identity
- Archetype: explorer
- Roles: codebase architecture, core & data survey
- Working directory: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_survey_2
- Original parent: a2d655d2-a47c-46dc-90ce-f697c867c4e0
- Milestone: initial survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Target Git branch must be verified: `development`
- Incremental improvement without rewrite (No Rewrite): preserve existing architecture (Vue 3, Dexie.js, sql.js, pdf-lib, jsPDF, Pinia)
- No regressions on accounting formulas or data models

## Current Parent
- Conversation ID: a2d655d2-a47c-46dc-90ce-f697c867c4e0
- Updated: not yet

## Investigation State
- **Explored paths**: git status, package.json, vite.config.js, vitest.config.js, src/stores (theme.js, backupStore.js), src/services (db.js, export.js, exportBeta.js, backupService.js, excelExport.js), src/utils (payment.js), src/views (BatchEntryView.vue, BlocchettiView.vue, ReportsView.vue, ReportsBetaView.vue, SettingsView.vue, HomeView.vue, SocioDetailView.vue), src/components (TesseraTemplate.vue, DashboardCharts.vue, AddPaymentModal.vue, SocioCard.vue, __tests__/TesseraTemplate.test.js), src/assets/main.css, src/router/index.js
- **Key findings**:
  1. Git branch verified on `development`. Clean working tree.
  2. Scripts verified: `npm run build` (builds in ~9s), `npx vitest run` (6/6 tests pass), `npm run lint` (passes clean).
  3. Dexie.js (`CeraioloDigitaleDB` tables: `soci`, `tesseramenti`, `local_changes`, `settings`, `blocchetti`) is the primary client storage; SQLite/sql.js handles .sqlite export, import, and auto-backup via File System Access API with 3-folder retention.
  4. Accounting formulas: `calculatePaymentStatus` in `payment.js` implements condono logic; minors (<18) exempt; standard quota = 10€, new/returning member quota = 25€; booklet cassa total is sum of `quota_pagata` for `numero_blocchetto`.
  5. Batch entry (`BatchEntryView.vue`) currently lacks the 10-box visual bar `[1]..[10]`, lacks live booklet cash total calculation, and relies on an in-memory Map cache rather than loading from the database.
  6. Reports & PDF: `ReportsView.vue` and `ReportsBetaView.vue` need fusion into a unified hub. `export.js` currently lacks Manicchia sorting for tessere cards (only A-Z by cognome).
  7. Emojis are widely present across header, views, and cards, ready to be replaced by SVG icons. Typography currently loads Google Fonts in `main.css`. `DashboardCharts.vue` has dual Y-axes without the required high-contrast data table.
- **Unexplored areas**: None within the survey scope.

## Key Decisions Made
- All technical facts verified directly via tools, ready to compile comprehensive handoff report.

## Artifact Index
- handoff.md — Comprehensive investigation report
- progress.md — Liveness heartbeat
