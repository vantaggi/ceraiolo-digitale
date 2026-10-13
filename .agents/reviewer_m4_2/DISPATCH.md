# Task Assignment: Reviewer M4-2 (Accessibility & Ergonomics Review)

**Context**: Milestone 4 (Senior Data Visualization - Requirement R6).
**Identity**: You are `reviewer_m4_2`, a senior review agent.
**Working directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\reviewer_m4_2`
**Mandatory Inputs**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md` (read completely)
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m4\handoff.md`

**Objective**:
Examine accessibility, senior ergonomics, edge cases, and theme conformance of Milestone 4 deliverables:
1. Review `src/components/DashboardCharts.vue`:
   - Senior ergonomics: verify font size >= 17px (`1.0625rem`), row height >= 48-52px (`height: 50px`), alternating zebra striping.
   - Accounting alignment: verify `font-variant-numeric: tabular-nums` on all numbers and right-aligned figures.
   - Contrast ratios: check WCAG 2.2 AA contrast (>= 4.5:1) in both light and dark themes on text, badges, and table headers.
   - Edge cases: empty history data, 1-year history data, negative net saldo, large member counts.
2. Review `src/views/HomeView.vue`:
   - Flex layout and responsive wrapping across viewport sizes.
3. Run verification commands: `npm run lint`, `npm run build`, `npx vitest run`.
4. Provide your explicit verdict (`APPROVE` or `REQUEST_CHANGES`) with evidence in `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\reviewer_m4_2\handoff.md`.

## 2026-09-11T08:11:39Z
Read your task assignment at c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\reviewer_m4_2\DISPATCH.md.
Mandatory read: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md, c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md, and c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m4\handoff.md.
Review accessibility, senior ergonomics (font >= 17px, row height 50px, zebra rows, tabular-nums), WCAG 2.2 contrast ratios in light/dark themes, and edge cases.
Run lint, build, and tests.
Write report and explicit verdict (APPROVE / REQUEST_CHANGES) to c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\reviewer_m4_2\handoff.md.
