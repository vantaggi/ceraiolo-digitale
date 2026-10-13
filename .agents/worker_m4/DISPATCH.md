# Task Assignment: Worker M4 (Senior Data Visualization - Requirement R6)

**Identity**: You are `worker_m4`, a senior implementation worker.
**Working Directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m4`
**Target Branch**: `development` (STRICT: keep all changes on branch development).

## Mandatory Inputs to Read First
1. `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md`
2. `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
3. Explorer Reports:
   - `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m4_1\handoff.md`
   - `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m4_2\handoff.md`

## File Boundaries & Write Ownership
You own and have exclusive write permission to:
- `src/components/DashboardCharts.vue`
- `src/views/HomeView.vue`
- `src/__tests__/dashboard_charts_m4.spec.js` (new test suite)

Do NOT modify files outside these boundaries.

## Implementation Tasks

### 1. `src/components/DashboardCharts.vue`
- **Eliminate Dual Y-Axis**:
  - Remove `y1` secondary Y-axis from Chart.js `scales`. The chart now uses a single, clear `y` scale for `Totale Iscritti` (position: 'left', beginAtZero: true, integer ticks, bold readable font).
  - Simplify datasets: focus primary chart on `Totale Iscritti` with clean Santantoniari crimson line/bar styling.
- **Eliminate Hover-Only Tooltips Dependency**:
  - Register or configure clear visual indicators (e.g. data labels or legend cues) directly on the chart so seniors do not have to hover with a mouse.
- **Permanent High-Contrast Specular Data Table**:
  - Place a permanent table (`table.specular-data-table`) directly beneath the chart canvas in a container `<div class="specular-table-container">`.
  - Columns:
    1. `Anno` (left-aligned, bold)
    2. `Iscritti Totali` (right-aligned, tabular-nums, bold)
    3. `Nuovi Iscritti` (right-aligned, tabular-nums, positive badge e.g. `+35`)
    4. `Non Rinnovati` (right-aligned, tabular-nums, churn badge e.g. `-10`)
    5. `Saldo Netto` (right-aligned, tabular-nums, net badge e.g. `+25` or `-5`)
  - Summary row in `<tfoot>` with Totals / Averages.
  - Reactivity: Automatically updates when user selects range `5y`, `10y`, or `all`.
  - Senior Ergonomics & WCAG 2.2:
    - Font size >= 17px (`1.0625rem` or `17px`).
    - Row height minimum 48-52px (`height: 50px`).
    - Alternating zebra striping (`tbody tr:nth-child(even)`).
    - `font-variant-numeric: tabular-nums` on all numbers.
    - Contrast ratio >= 4.5:1 in both light and dark themes.
- **Emoji Replacement**:
  - Replace any remaining unicode arrows or raw emojis in `DashboardCharts.vue` with `<BaseIcon>`.

### 2. `src/views/HomeView.vue`
- Replace all remaining raw emojis across `HomeView.vue` with `<BaseIcon>` (e.g. `⏳`, `📊`, `👥`, `💰`, `📥`, `📅`, etc.).
- Ensure all metric cards and layout conform to WCAG 2.2 and zero-emoji compliance.

### 3. Test Suite (`src/__tests__/dashboard_charts_m4.spec.js`)
- Write unit and component tests verifying:
  - Single Y-axis chart configuration (absence of `y1` in scales).
  - Specular data table presence, rows count corresponding to `5y` (5 rows), `10y` (10 rows), and `all`.
  - Specular data table columns (`Anno`, `Iscritti Totali`, `Nuovi Iscritti`, `Non Rinnovati`, `Saldo Netto`).
  - Formatting of positive/negative signs (`+` and `-`) and `tabular-nums` class.
  - Zero raw emojis in `DashboardCharts.vue` and `HomeView.vue`.

## Quality & Verification Requirements
- `npm run lint` — must pass with 0 errors, 0 warnings.
- `npm run build` — must build production bundle cleanly.
- `npx vitest run` — all existing (216+) tests and new tests must pass.
- Write handoff report to `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m4\handoff.md`.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-11T08:03:43Z
Implement Milestone 4 (Senior Data Visualization - Requirement R6):
1. In src/components/DashboardCharts.vue:
   - Eliminate confusing dual Y-axis (remove y1 from scales; single clean y scale).
   - Eliminate hover-only tooltips dependency (render data labels directly or rely on permanent table).
   - Add permanent high-contrast specular data table directly beneath chart with font >= 17px, height 50px zebra rows, tabular-nums, WCAG 2.2 contrast, reactive to 5y/10y/all range.
   - Replace any unicode arrows or emojis with BaseIcon.
2. In src/views/HomeView.vue:
   - Replace all remaining raw emojis with BaseIcon.
3. Write verification tests in src/__tests__/dashboard_charts_m4.spec.js.
4. Verify with npm run lint, npm run build, and npx vitest run.
5. Write handoff report to c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m4\handoff.md.

