# Task Assignment: Challenger M4-2 (Table Arithmetic & Zero-Emoji Challenge)

**Context**: Milestone 4 (Senior Data Visualization - Requirement R6).
**Identity**: You are `challenger_m4_2`, an adversarial testing challenger.
**Working directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\challenger_m4_2`
**Mandatory Inputs**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md` (read completely)
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m4\handoff.md`

**Objective**:
Empirically challenge specular table arithmetic, signed indicators, and zero-emoji compliance:
1. Write adversarial test cases in `src/__tests__/challenger_m4_2_adversarial.spec.js` to stress-test:
   - Arithmetic consistency: verify that `saldo = nuovi - non_rinnovati` for every row, and footer averages/totals match exact mathematical definitions across edge case datasets.
   - String sign formatting: verify `+` on positive values, `-` on negative values, and neutral formatting on 0.
   - Zero-emoji scanner: run exhaustive AST/regex scan over `DashboardCharts.vue` and `HomeView.vue` across all Unicode emoji blocks.
   - Senior table styling verification: verify CSS classes `.specular-data-table`, `.tabular-nums`, zebra row striping.
2. Run your tests with `npx vitest run`.
3. Provide your explicit verdict (`APPROVE` or `REJECT`) with test execution results in `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\challenger_m4_2\handoff.md`.

## 2026-09-11T08:11:39Z
Read your task assignment at c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\challenger_m4_2\DISPATCH.md.
Mandatory read: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md, c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md, and c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m4\handoff.md.
Empirically challenge specular table arithmetic, saldo calculation, sign formatting (+/-), tabular-nums, summary footer calculations, and zero raw emojis in DashboardCharts.vue and HomeView.vue. Write and run adversarial tests.
Write report and explicit verdict (APPROVE / REJECT) to c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\challenger_m4_2\handoff.md.
