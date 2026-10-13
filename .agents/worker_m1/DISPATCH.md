# Dispatch for Worker M1 (Implementation of Design System, SVG Icons & Themes)

**Milestone**: M1 - Design System, Icons & Themes (Requirements R4, R5)
**Role**: `teamwork_preview_worker`
**Working Directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m1`
**Target Git Branch**: `development` (strictly verify and keep all changes on `development`)

**Mandatory Integrity Warning**:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**Files Owned Exclusively by Worker M1**:
- `src/assets/main.css`
- `src/components/common/BaseIcon.vue` (create)
- `src/components/__tests__/BaseIcon.test.js` (create)
- `src/main.js`
- `src/App.vue`
- `src/views/SettingsView.vue`

**Files to Read Before Implementation**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_1\handoff.md` (CSS, typography, WCAG 2.2, table rules, SettingsView theme selector)
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_2\handoff.md` (BaseIcon.vue complete SVG icon component code & tests)
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_3\handoff.md` (App.vue header refactoring, theme toggle removal, main.js registration)

**Implementation Tasks**:
1. **BaseIcon.vue & Unit Tests**:
   - Create `src/components/common/BaseIcon.vue` implementing the complete SVG icon system (viewBox 0 0 24 24, stroke 1.8, stroke-linecap round, stroke-linejoin round, Santantoniari palette, 64+ icons with aliases, WCAG 2.2 accessibility).
   - Create `src/components/__tests__/BaseIcon.test.js` and verify it passes with `npx vitest run src/components/__tests__/BaseIcon.test.js`.
2. **Global Registration**:
   - In `src/main.js`, import and globally register `BaseIcon` with `app.component('BaseIcon', BaseIcon)`.
3. **CSS, Offline Typography, WCAG 2.2 & Tables (`src/assets/main.css`)**:
   - Remove Google Fonts `@import`.
   - Set native system font stack: `system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`.
   - Set `html { font-size: 17px; }` base and `body { font-size: 1rem; line-height: 1.55; }`.
   - Update WCAG 2.2 contrast tokens: `--color-warning: #c2410c` and `--color-info: #0369a1` (light mode); darken/brighten appropriate tokens in dark mode.
   - Add table styling: min-height 48-52px per row, zebra striping on `tbody tr:nth-child(even)`, and numeric/currency alignment classes (`.tabular-nums`, `.text-right`, `.col-currency`, `.col-number`).
4. **App.vue Navigation & Header**:
   - Remove the theme toggle button (`🕯️`/`🔥`) completely from header navigation.
   - Replace navigation emojis (`🏠`, `🔄`, `🧾`, `📊`, `⚙️`) with `<BaseIcon name="..." />` in Apple SF Symbols style.
   - Preserve reactive logo inversion (`invert(1)`) in dark mode.
5. **SettingsView.vue Theme Selector**:
   - In `SettingsView.vue` (Generale tab), add the theme selector using `useThemeStore` with visual selector cards/radios for "Tema Chiaro" and "Tema Scuro", reactive live switching, and toast confirmation.
6. **Verification**:
   - Run `npx vitest run` to ensure all unit tests pass (including existing `TesseraTemplate.test.js` and new `BaseIcon.test.js`).
   - Run `npm run build` to verify clean build without warnings.
   - Run `npm run lint` to verify clean code formatting.
   - Verify `git status` to ensure branch is `development` and only owned files were modified.
7. **Handoff**
## 2026-09-10T21:49:39Z
You are worker_m1. Your working directory is c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m1.
Read your instructions in c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m1\DISPATCH.md.
Also read:
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_1\handoff.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_2\handoff.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m1_3\handoff.md

Implement Milestone 1 (Design System, SVG Icons & Themes - R4, R5) on branch development:
- Create src/components/common/BaseIcon.vue and tests in src/components/__tests__/BaseIcon.test.js
- Register BaseIcon globally in src/main.js
- Update src/assets/main.css with offline system font stack (17px base), WCAG 2.2 contrast tokens, table striping, tabular-nums right-alignment
- Refactor src/App.vue: remove theme toggle button from header nav, replace nav emojis with BaseIcon
- Refactor src/views/SettingsView.vue: add theme selector (Chiaro/Scuro) in the Generale tab
Verify with npx vitest run, npm run build, and npm run lint.
Write your handoff report to c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\worker_m1\handoff.md.
When finished, send a message to your parent.
