# Dispatch for Explorer M1-3 (Header, Navigation & UI Emoji Replacement)

**Milestone**: M1 - Design System, Icons & Themes
**Working Directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_3`
**Target Git Branch**: `development`
**Files to Read**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_survey_3\handoff.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\src\App.vue`

**Objective**:
Map out the exact modifications to:
1. `src/App.vue`:
   - Remove the theme toggle button (`🕯️`/`🔥`) completely from header navigation (preventing accidental clicks by seniors).
   - Replace navigation emojis (`🏠`, `🔄`, `🧾`, `📊`, `⚙️`) with `<BaseIcon name="..." />` matching Apple SF Symbols aesthetics.
   - Refine header layout and responsiveness in institutional Santantoniari styling.
2. Global component integration:
   - Identify how `BaseIcon.vue` can be globally registered in `src/main.js` or cleanly imported so that all views (HomeView, BatchEntryView, ReportsView, BlocchettiView, SettingsView) can use it immediately without syntax friction.
3. Write your strategy and code specifications in `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_3\handoff.md`. Do NOT modify source code files.

## 2026-09-10T21:45:16Z
You are explorer_m1_3. Your working directory is c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_3.
Read your instructions in c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_3\DISPATCH.md.
Also read:
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_survey_3\handoff.md

Formulate the exact changes to App.vue (removing header flame/candle toggle, replacing nav emojis with BaseIcon) and global registration in main.js.
Write your detailed strategy to c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_3\handoff.md.
When finished, send a message to your parent.

