# Dispatch for Explorer M1-2 (BaseIcon SVG Component Architecture)

**Milestone**: M1 - Design System, Icons & Themes
**Working Directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_2`
**Target Git Branch**: `development`
**Files to Read**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_survey_3\handoff.md`

**Objective**:
Design the complete architecture, props, and SVG icon vector library for `src/components/common/BaseIcon.vue`:
1. Design Apple SF Symbols / Jony Ive style minimalist stroke-based vector icons (viewBox 0 0 24 24, stroke-width 1.75 - 2, stroke-linecap round, stroke-linejoin round, fill none / currentColor).
2. Institutional Santantoniari palette support:
   - Primary: Ink black (`#1a1a1a`) / Dark theme light grey (`#e0e0e0`)
   - Accent: Ceraiolo red (`#b71c1c` / `#e53935`)
   - Gold: Warm gold (`#c59b27`)
   - White: (`#ffffff`)
3. Complete icon dictionary needed to replace all 45+ emojis:
   - Navigation: `home` (ricerca), `refresh-cw` (registrazione seriale), `receipt` (blocchetti), `bar-chart` (report), `settings` (impostazioni).
   - Actions: `search`, `plus`, `check`, `alert-triangle`, `trash-2`, `download`, `upload`, `edit`, `x`, `chevron-left`, `chevron-right`, `chevron-up`, `chevron-down`, `printer`, `file-text`, `credit-card`, `users`, `user-plus`, `sun`, `moon`, `database`, `save`.
4. Provide the exact implementation code for `BaseIcon.vue` and test specs in `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_2\handoff.md`. Do NOT modify source code files.
