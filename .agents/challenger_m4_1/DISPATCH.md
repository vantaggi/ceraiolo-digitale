# Task Assignment: Challenger M4-1 (Chart & Range Slicing Challenge)

**Context**: Milestone 4 (Senior Data Visualization - Requirement R6).
**Identity**: You are `challenger_m4_1`, an adversarial testing challenger.
**Working directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\challenger_m4_1`
**Mandatory Inputs**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md` (read completely)
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m4\handoff.md`

**Objective**:
Empirically challenge chart scales and reactive range slicing:
1. Write adversarial test cases in `src/__tests__/challenger_m4_1_empirical.spec.js` to stress-test:
   - Complete absence of `scales.y1` under all configurations and range switches.
   - Synchronous reactivity: verify that switching between `5y`, `10y`, and `all` updates both chart datasets and specular table rows identically.
   - Boundary range lengths: test with 0 years of data, 1 year, 3 years (< 5), exactly 5 years, 7 years (between 5 and 10), and 15 years (> 10).
   - Verify that data labels plugin properly handles 0, NaN, and negative numbers without canvas throw.
2. Run your tests with `npx vitest run`.
3. Provide your explicit verdict (`APPROVE` or `REJECT`) with test execution results in `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\challenger_m4_1\handoff.md`.

## 2026-09-11T08:11:39Z
Read your task assignment at c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\challenger_m4_1\DISPATCH.md.
Mandatory read: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md, c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md, and c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m4\handoff.md.
Empirically challenge single-scale chart configuration, removal of y1 scale, range switching (5y, 10y, all), direct data labels plugin, and edge case dataset sizes. Write and run adversarial tests.
Write report and explicit verdict (APPROVE / REJECT) to c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\challenger_m4_1\handoff.md.
