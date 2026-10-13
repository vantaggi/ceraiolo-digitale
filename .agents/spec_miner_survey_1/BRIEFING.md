# BRIEFING — 2026-09-10T21:42:00Z

## Mission
Discover, probe, and document complete specifications and acceptance criteria for R1-R6 and architectural constraints for the Ceraiolo Digitale project.

## 🔒 My Identity
- Archetype: Specification Miner
- Roles: Teamwork specialist, external domain expert
- Working directory: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\spec_miner_survey_1
- Original parent: a2d655d2-a47c-46dc-90ce-f697c867c4e0
- Milestone: Specification Mining (Survey 1)

## 🔒 Key Constraints
- Miglioramento incrementale senza riscrittura (No Rewrite)
- Git branch: development
- Architecture preserved: Vue 3 (Composition API), Dexie.js, sql.js, pdf-lib, jsPDF, Pinia, vue-router
- No regressions on accounting formulas or data models
- Read-only miner: do NOT implement changes to application code

## Current Parent
- Conversation ID: a2d655d2-a47c-46dc-90ce-f697c867c4e0
- Updated: 2026-09-10T21:42:00Z

## Task Summary
- **What to build**: Comprehensive specifications and acceptance criteria for R1 (Batch Entry), R2 (Print Hub & PDF Lab), R3 (Membership cards), R4 (SVG icons & Santantoniari styling), R5 (Themes, typography, alignments), R6 (Senior data viz), and architectural constraints.
- **Success criteria**: Detailed, unambiguous specification matrix, tables, edge cases, error conditions, inputs/outputs, and acceptance criteria written to handoff.md.
- **Interface contracts**: ORIGINAL_REQUEST.md, DEVELOPMENT_GUIDELINES.md, MANUALE_OPERATIVO.md.
- **Code layout**: Root src/ layout: components, views, services, stores, assets, router.

## Key Decisions Made
- Confirmed development branch is active.
- Confirmed npm run build and npm run test pass on current codebase.
- Verified absence of separate piano_di_refactoring_santantoniari.md file; canonical requirement source is ORIGINAL_REQUEST.md (which explicitly encapsulates the refactoring plan), supplemented by the operational manual and existing code implementations.
- Deeply analyzed source code across all target components: BatchEntryView.vue, ReportsView.vue, ReportsBetaView.vue, export.js, exportBeta.js, TesseraTemplate.vue, DashboardCharts.vue, SettingsView.vue, App.vue, main.css, db.js.

## Artifact Index
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\spec_miner_survey_1\handoff.md — Comprehensive Specification Report
