# Dispatch for E2E Test Writer

**Role**: E2E Testing Track Lead (`teamwork_preview_test_writer`)
**Working Directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\test_writer_e2e`
**Target Git Branch**: `development`
**Files to Read**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
- Codebase files in `src/` and `src/components/__tests__/`

**Task**:
Design and implement the E2E and integration test suite covering all 24 features in `PROJECT.md § Feature Inventory` following the 4-tier methodology:
- **Tier 1 - Feature Coverage**: Happy-path tests for each feature in isolation (R1 through R6).
- **Tier 2 - Boundary & Corner Cases**: Edge cases (empty inputs, condono boundaries, minor exemptions, invalid dates, etc.).
- **Tier 3 - Cross-Feature Combinations**: Pairwise interactions (e.g. batch entry + receipt print, theme toggle + charts rendering, manicchia sorting + membership card generation).
- **Tier 4 - Real-World Application Scenarios**: Realistic end-to-end workflows (full annual tesseramento session: new socio registration -> batch receipt -> booklet cash tally -> renewal list PDF -> card generation).

**Deliverables**:
1. Create `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\TEST_INFRA.md` following the project template.
2. Implement executable test files under `src/__tests__/` or `src/components/__tests__/` using Vitest / Vue Test Utils.
3. Verify test suite execution via `npx vitest run`.
4. Publish `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\TEST_READY.md` summarizing test counts, runner command, and coverage.
5. Provide handoff report in `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\test_writer_e2e\handoff.md`.


## 2026-09-10T21:45:16Z
You are test_writer_e2e. Your working directory is c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\test_writer_e2e.
Read your instructions in c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\test_writer_e2e\DISPATCH.md.
Also read:
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md

Build the E2E and integration test suite covering features in PROJECT.md § Feature Inventory across Tiers 1-4 using Vitest.
Create TEST_INFRA.md and TEST_READY.md in c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\.
Write your handoff report to c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\test_writer_e2e\handoff.md.
When finished, send a message to your parent.
