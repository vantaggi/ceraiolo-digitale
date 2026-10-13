# BRIEFING — 2026-09-11T08:10:00Z

## Mission
Implement Milestone 4: Senior Data Visualization (Requirement R6) in DashboardCharts.vue, clean emojis in HomeView.vue, write unit tests in dashboard_charts_m4.spec.js.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m4
- Original parent: 128271ae-7a33-4374-963b-480cf8ad31b1
- Milestone: Milestone 4 (Senior Data Visualization - Requirement R6)

## 🔒 Key Constraints
- Branch: strictly `development`
- Only modify: `src/components/DashboardCharts.vue`, `src/views/HomeView.vue`, `src/__tests__/dashboard_charts_m4.spec.js`
- No rewrite: preserve existing Dexie DB, formulas, and architecture
- Eliminate dual Y-axis: single clean y scale on left, remove y1
- Eliminate hover-only tooltips dependency: provide direct labels or permanent table
- Permanent specular data table: font >= 17px, row height 50px, zebra striping, tabular-nums, WCAG 2.2 contrast >= 4.5:1, reactive to 5y/10y/all
- Replace emojis with BaseIcon
- Verification: npm run lint, npm run build, npx vitest run must all pass with 0 errors

## Current Parent
- Conversation ID: 128271ae-7a33-4374-963b-480cf8ad31b1
- Updated: not yet

## Task Summary
- **What to build**: Single-scale chart and permanent specular high-contrast data table in DashboardCharts.vue; replace raw emojis with BaseIcon in HomeView.vue; test suite in dashboard_charts_m4.spec.js.
- **Success criteria**: 0 lint errors, clean build, all existing + new tests pass, zero emojis in touched components, WCAG 2.2 senior ergonomics fulfilled.
- **Interface contracts**: PROJECT.md § Interface Contracts
- **Code layout**: PROJECT.md § Code Layout

## Key Decisions Made
- Single scale on ChartJS: `scales.y` for Totale Iscritti, total removal of `scales.y1`.
- Registered `seniorDataLabelsPlugin` to render data values directly on top of points without hover requirement.
- Permanent specular high-contrast data table (`table.specular-data-table`) with 5 columns: Anno, Iscritti Totali, Nuovi Iscritti (+), Non Rinnovati (-), Saldo Netto (+/-), zebra rows (50px), font >= 17px, tabular-nums.
- Derived `specularTableRows` directly from unmutated historical data, reacting synchronously to range selection (5y, 10y, all).
- Replaced unicode trend arrows with `<BaseIcon name="trending-up" />` and `<BaseIcon name="trending-down" />`.
- Replaced all 12 raw emojis across `HomeView.vue` with `<BaseIcon>`.
- Authored comprehensive 10-test test suite in `dashboard_charts_m4.spec.js`.

## Artifact Index
- `src/components/DashboardCharts.vue` — Senior data visualization component (single scale + specular table)
- `src/views/HomeView.vue` — Home dashboard view with BaseIcon replacements
- `src/__tests__/dashboard_charts_m4.spec.js` — Test suite for M4 requirements (10 passing tests)
- `.agents/worker_m4/handoff.md` — Handoff report

## Change Tracker
- **Files modified**:
  - `src/components/DashboardCharts.vue`: eliminated dual Y-axis, added specular data table, replaced arrows with BaseIcon
  - `src/views/HomeView.vue`: replaced all 12 raw emojis with BaseIcon, enhanced flex alignments
  - `src/__tests__/dashboard_charts_m4.spec.js`: new test suite with 10 unit and component tests
- **Build status**: PASS (`npm run build` cleanly succeeded in 4.10s)
- **Pending issues**: None

## Quality Status
- **Build/test result**: PASS (226 tests passed across 15 test files)
- **Lint status**: PASS (0 errors, 0 warnings)
- **Tests added/modified**: 10 new tests in `dashboard_charts_m4.spec.js`

## Loaded Skills
- None specified in dispatch
