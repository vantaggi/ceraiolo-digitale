# Task Assignment: Explorer M3-1 (Print Hub UI & PDF Lab Architecture)

**Context**: Milestone 3 (Unified Print Hub & Membership Cards - Requirements R2, R3).
**Identity**: You are `explorer_m3_1`, an exploration agent.
**Working directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m3_1`
**Mandatory Inputs**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md` (read completely)
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\src\views\ReportsView.vue`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\src\views\ReportsBetaView.vue`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\src\router\index.js`

**Objective**:
Analyze the merging of `ReportsBetaView.vue` into `ReportsView.vue` to produce a Unified Print Hub:
1. Identify all features currently in `ReportsView.vue` and `ReportsBetaView.vue`.
2. Plan the UI layout:
   - 4 quick 1-click buttons in the foreground: (1) Rinnovi con arretrati, (2) Ceraioli da sollecitare, (3) Fogli tessere 6x, (4) Resoconto cassa blocchetti.
   - Expandable "PDF Lab" section (collapsible panel) with advanced filters: Manicchie, elezioni aventi diritto, anni di pagamento con logica AND/OR, selezione e riordino colonne (◀ / ▶), colonna firma manuale, preset salvati.
   - Reactive Live Preview table updating instantly on every filter/column toggle before download.
3. Check router configuration in `src/router/index.js`: ensure `/reports` is the single hub and `/reports-beta` redirects to `/reports` without broken routes.
4. Check emoji usage in `ReportsView.vue` and `ReportsBetaView.vue`: catalog every emoji to be replaced with `<BaseIcon>`.
5. Write your findings and recommendations to `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m3_1\handoff.md`.

## 2026-09-11T07:26:22Z
Read your task assignment at c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m3_1\DISPATCH.md.
Mandatory read: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md and c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md.
Analyze the merging of ReportsBetaView.vue into ReportsView.vue (4 quick 1-click buttons, expandable PDF Lab, dynamic columns reordering, live preview table, router redirection, BaseIcon replacement).
Write your detailed findings and architectural recommendations to c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m3_1\handoff.md.
