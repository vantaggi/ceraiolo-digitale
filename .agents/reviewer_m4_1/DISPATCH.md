# Task Assignment: Reviewer M4-1 (Correctness & Completeness Review)

**Context**: Milestone 4 (Senior Data Visualization - Requirement R6).
**Identity**: You are `reviewer_m4_1`, a senior review agent.
**Working directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\reviewer_m4_1`
**Mandatory Inputs**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md` (read completely)
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m4\handoff.md`

**Objective**:
Examine correctness, completeness, and interface conformance of Milestone 4 deliverables:
1. Review `src/components/DashboardCharts.vue`:
   - Elimination of dual Y-axis: confirm removal of `scales.y1` and single-scale `scales.y`.
   - Elimination of hover-only tooltips dependency: confirm data visibility via direct data labels and the permanent specular table.
   - Permanent high-contrast specular data table (`table.specular-data-table`): verify 5 columns (`Anno`, `Iscritti Totali`, `Nuovi Iscritti`, `Non Rinnovati`, `Saldo Netto`), summary footer, sign formatting, and range reactivity.
   - Zero unicode arrows or raw emojis: verify replacement with `<BaseIcon>`.
2. Review `src/views/HomeView.vue`:
   - Verify replacement of all 12 raw emojis with `<BaseIcon>`.
3. Run verification commands: `npm run lint`, `npm run build`, `npx vitest run`.
4. Provide your explicit verdict (`APPROVE` or `REQUEST_CHANGES`) with evidence in `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\reviewer_m4_1\handoff.md`.

## 2026-09-11T08:11:39Z
Read your task assignment at c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\reviewer_m4_1\DISPATCH.md.
Mandatory read: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md, c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md, and c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m4\handoff.md.
Review correctness, completeness, single Y-axis, permanent specular data table, BaseIcon emoji replacement, and interface conformance.
Run lint, build, and tests.
Write report and explicit verdict (APPROVE / REQUEST_CHANGES) to c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\reviewer_m4_1\handoff.md.
