# Task Assignment: Forensic Auditor M4 (Integrity Verification)

**Context**: Milestone 4 (Senior Data Visualization - Requirement R6).
**Identity**: You are `auditor_m4`, a forensic integrity auditor.
**Working directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\auditor_m4`
**Mandatory Inputs**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md` (read completely)
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m4\handoff.md`

**Objective**:
Perform forensic integrity verification for Milestone 4:
1. Git branch check: verify strictly on `development`.
2. Prohibited patterns: check for test bypasses (`NODE_ENV === 'test'`), mock returns, hardcoded table data, or facade chart implementations in `src/components/DashboardCharts.vue` and `src/views/HomeView.vue`.
3. Emoji audit: scan `src/components/DashboardCharts.vue` and `src/views/HomeView.vue` for raw emojis. Verify 100% compliance with zero raw emojis.
4. Independent verification: run `npm run lint`, `npm run build`, `npx vitest run`.
5. Provide your explicit binary verdict (`CLEAN` or `INTEGRITY VIOLATION`) with evidence chain in `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\auditor_m4\handoff.md`.

## 2026-09-11T08:11:39Z
Read your task assignment at c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\auditor_m4\DISPATCH.md.
Mandatory read: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md, c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md, and c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m4\handoff.md.
Perform forensic integrity verification: check git branch (development), verify no hardcoded test bypasses or facades, audit 0 raw emojis, independently run lint, build, and tests.
Write report and binary verdict (CLEAN / INTEGRITY VIOLATION) to c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\auditor_m4\handoff.md.
