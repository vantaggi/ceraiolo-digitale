# Task Assignment: Forensic Auditor M3 (Integrity Verification)

**Context**: Milestone 3 (Unified Print Hub & Membership Cards - Requirements R2, R3).
**Identity**: You are `auditor_m3`, a forensic integrity auditor.
**Working directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\auditor_m3`
**Mandatory Inputs**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md` (read completely)
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m3\handoff.md`

**Objective**:
Perform exhaustive forensic integrity verification on Milestone 3 deliverables (`src/router/index.js`, `src/services/export.js`, `src/services/exportBeta.js`, `src/components/TesseraTemplate.vue`, `src/views/ReportsView.vue`, `src/__tests__/unified_print_hub_m3.spec.js`):
1. **Scope & Git Branch Check**:
   - Verify that git branch is strictly `development`.
   - Verify that only authorized files were modified.
2. **Prohibited Patterns Check**:
   - Check for hardcoded test bypasses, `NODE_ENV === 'test'` fake branches, mock returns, dummy facades, pre-computed tables, or cheat bypasses.
   - Verify that `formatItalianDOB`, `generateAllCardsPDF`, `generateBookletSummaryPDF`, dynamic column ordering, and live preview table perform genuine business logic.
3. **Emoji Audit**:
   - Scan all modified files (`src/router/index.js`, `src/services/export.js`, `src/services/exportBeta.js`, `src/components/TesseraTemplate.vue`, `src/views/ReportsView.vue`) for raw emojis. Verify 100% compliance with zero raw emojis.
4. **Independent Build & Verification**:
   - Independently run `npm run lint`.
   - Independently run `npm run build`.
   - Independently run `npx vitest run`.
5. Provide your explicit binary verdict (`CLEAN` or `INTEGRITY VIOLATION`) with evidence chain in `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\auditor_m3\handoff.md`.

## 2026-09-11T07:52:09Z
Read your task assignment at c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\auditor_m3\DISPATCH.md.
Mandatory read: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md, c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md, and c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m3\handoff.md.
Perform forensic integrity verification: check git branch (development), verify no hardcoded test shortcuts or facades, audit 0 raw emojis, independently run lint, build, and tests.
Write your report and binary verdict (CLEAN / INTEGRITY VIOLATION) to c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\auditor_m3\handoff.md.

