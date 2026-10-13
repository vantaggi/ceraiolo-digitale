# Dispatch for Worker M2 (Batch Entry Flow Implementation - R1)

**Milestone**: M2 - Batch Entry Flow Optimization (Requirement R1)
**Role**: `teamwork_preview_worker`
**Working Directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m2`
**Target Git Branch**: `development`

**Mandatory Integrity Warning**:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**File Owned Exclusively by Worker M2**:
- `src/views/BatchEntryView.vue`
- Any related batch entry unit tests under `src/__tests__/` or `src/views/__tests__/`

**Files to Read**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m2\handoff.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m2\proposed_BatchEntryView.vue`

**Task**:
Implement the optimized Batch Entry flow in `src/views/BatchEntryView.vue`:
1. Integrate the 10-slot visual navigation bar `[1]` to `[10]` with active, filled, empty states, click navigation, and keyboard arrow navigation.
2. Implement live booklet cash total computation reactively querying `tesseramenti` for `numero_blocchetto`, displayed with tabular-nums right-alignment and Santantoniari gold accent.
3. Enhance multi-socio receipt flow: individual fee tracking, receipt subtotal, single socio removal without clearing receipt or booklet context.
4. Integrate smart inline new socio modal/drawer: auto-populate surname/name from search queries, collect required fields, default to 25€ quota, save to Dexie `soci` and `tesseramenti`, and link to current receipt slot.
5. Replace all emojis in `BatchEntryView.vue` with `<BaseIcon>`.
6. Verification:
   - Run `npx vitest run` to ensure all tests pass (existing 96+ tests).
   - Run `npm run lint` to ensure 0 errors / 0 warnings.
   - Run `npm run build` to ensure clean build.
   - Confirm `git status` on branch `development`.
7. Write handoff report to `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m2\handoff.md`.
8. Send completion message to parent.

## 2026-09-10T22:06:15Z
You are worker_m2. Your working directory is c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m2.
Read your instructions in c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m2\DISPATCH.md.
Also read:
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m2\handoff.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m2\proposed_BatchEntryView.vue

Implement the Batch Entry flow optimizations in src/views/BatchEntryView.vue:
- 10-slot visual receipt bar [1]..[10] with keyboard navigation
- Live booklet cash total computed reactively from Dexie tesseramenti
- Reinforced multi-socio per receipt flow
- Smart inline new socio registration drawer with 25€ quota
- All emojis replaced with <BaseIcon>
Verify with npx vitest run, npm run lint, npm run build.
Write your handoff report to c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m2\handoff.md.
When finished, send a message to your parent.

