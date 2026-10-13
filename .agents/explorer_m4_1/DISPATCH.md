# Task Assignment: Explorer M4-1 (Chart Architecture & Dual Y-Axis Elimination)

**Context**: Milestone 4 (Senior Data Visualization - Requirement R6).
**Identity**: You are `explorer_m4_1`, an exploration agent.
**Working directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m4_1`
**Mandatory Inputs**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md` (read completely)
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\src\components\DashboardCharts.vue`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\src\views\HomeView.vue`

**Objective**:
Analyze `DashboardCharts.vue` and chart visualization architecture:
1. Inspect how `chart.js` / `vue-chartjs` is currently configured in `DashboardCharts.vue`.
2. Locate the confusing dual Y-axis (e.g. `y` and `y1` axes for members count vs revenue/tesseramenti) and how data points are plotted.
3. Plan how to eliminate the overlapping/confusing dual Y-axis:
   - Provide a clear, readable single-scale visualization (e.g. clear primary scale or dedicated decoupled visual representations for members and payments).
   - Ensure charts do not rely solely on mouse hover tooltips for seniors to read numbers (render data labels, legends, or direct visual cues).
4. Check emoji usage in `DashboardCharts.vue` and `HomeView.vue`: catalog any remaining emojis to be replaced with `<BaseIcon>`.
5. Document your architectural findings and concrete code recommendations in `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m4_1\handoff.md`.
