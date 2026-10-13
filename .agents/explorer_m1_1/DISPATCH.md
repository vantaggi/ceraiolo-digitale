# Dispatch for Explorer M1-1 (CSS, Typography, Themes & WCAG 2.2)

**Milestone**: M1 - Design System, Icons & Themes
**Working Directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_1`
**Target Git Branch**: `development`
**Files to Read**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_survey_3\handoff.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\src\assets\main.css`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\src\views\SettingsView.vue`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\src\stores\theme.js`

**Objective**:
Formulate the exact implementation plan and code specifications for:
1. `src/assets/main.css`:
   - Remove remote Google Fonts `@import`.
   - Implement native offline system font stack (`system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`) with `font-size: 17px` base on root/body.
   - Adjust WCAG 2.2 AA contrast tokens: `--color-warning: #c2410c` and `--color-info: #0369a1` in light theme, and compliant dark theme tokens.
   - Global table styling rules: min-height 48-52px per row, alternating zebra striping (`tbody tr:nth-child(even)`), and class for right-aligned numeric/currency cells (`text-align: right; font-variant-numeric: tabular-nums;`).
2. `src/views/SettingsView.vue`:
   - Design the theme selection block inside the 'generale' tab (Option 2: Dark mode preserved with visual selector cards/radios for Chiaro / Scuro using `themeStore`).
3. Write your strategy and code snippets in `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_1\handoff.md`. Do NOT modify source code files.

## 2026-09-10T21:45:16Z
You are explorer_m1_1. Your working directory is c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_1.
Read your instructions in c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_1\DISPATCH.md.
Also read:
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_survey_3\handoff.md

Design the exact CSS tokens, offline font stack, 17px base typography, WCAG 2.2 contrast values, table striping, tabular-nums alignment, and SettingsView theme selector for Milestone 1.
Write your detailed strategy to c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_1\handoff.md.
When finished, send a message to your parent.
