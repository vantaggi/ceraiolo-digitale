# Task Assignment: Challenger M3-2 (Cards, 6-Up Layout & Typography Challenge)

**Context**: Milestone 3 (Unified Print Hub & Membership Cards - Requirements R2, R3).
**Identity**: You are `challenger_m3_2`, an adversarial testing challenger.
**Working directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\challenger_m3_2`
**Mandatory Inputs**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md` (read completely)
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m3\handoff.md`

**Objective**:
Empirically challenge the membership card generation, Manicchia sorting, and 6-up sheet geometry:
1. Write adversarial test cases (e.g. in `src/__tests__/challenger_m3_2_empirical.spec.js`) to stress-test:
   - Manicchia sorting: members with same Manicchia sorted A-Z by cognome/nome; members with different Manicchia sorted alphabetically by group; missing group handled gracefully without crashing or corrupting sort order.
   - Non-mutating behavior: verify that calling `generateAllCardsPDF` does NOT alter the input array order.
   - 6-up pagination math and geometry: exact coordinate verification across multiple sheets (e.g. 1 card, 6 cards, 7 cards -> 2 pages, 18 cards -> 3 pages).
   - Booklet cash summary arithmetic: verify correct calculation of `totale_cassa` and `ricevute_usate` across single-socio receipts, multi-socio receipts, unused booklets, and booklets with 10 filled receipts.
   - Italian date formatting: stress-test boundary dates (leap years, Dec 31, Jan 1, year 1900, invalid strings).
2. Run your tests with `npx vitest run`.
3. Provide your explicit verdict (`APPROVE` or `REJECT`) with full test execution outputs in `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\challenger_m3_2\handoff.md`.

## 2026-09-11T07:52:09Z
Read your task assignment at c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\challenger_m3_2\DISPATCH.md.
Mandatory read: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md, c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md, and c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m3\handoff.md.
Empirically challenge card generation, Manicchia sorting, non-mutating arrays, 6-up A4 geometry, booklet cash arithmetic, and Italian DOB formatting. Write and execute adversarial tests.
Write your report and explicit verdict (APPROVE / REJECT) to c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\challenger_m3_2\handoff.md.

