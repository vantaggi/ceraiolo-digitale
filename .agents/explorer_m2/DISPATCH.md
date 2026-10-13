# Dispatch for Explorer M2 (Batch Entry Optimization - R1)

**Milestone**: M2 - Batch Entry Flow Optimization (Requirement R1)
**Role**: `teamwork_preview_explorer`
**Working Directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m2`
**Target Git Branch**: `development`
**Files to Read**:
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\ORIGINAL_REQUEST.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\PROJECT.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\spec_miner_survey_1\handoff.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_survey_2\handoff.md`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\src\views\BatchEntryView.vue`
- `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\src\services\db.js`

**Objective**:
Formulate the exact implementation plan, Vue 3 template, script, and CSS changes for `src/views/BatchEntryView.vue`:
1. **10-Slot Visual Receipt Bar `[1] [2] ... [10]`**:
   - Represent receipts `(B-1)*10 + 1` through `B*10` for active booklet `B`.
   - Visual states for each slot: active (currently selected), filled (has 1 or more registered members), empty (0 members).
   - Clicking a slot navigates directly to that receipt. Keyboard navigation: `ArrowLeft` / `ArrowRight` (when not inside a text input).
2. **Live Booklet Cash Total**:
   - Compute real-time cash total (`totaleIncassatoBlocchetto`) for all payments in `tesseramenti` matching `numero_blocchetto === sessionData.numeroBlocchetto`.
   - Update reactively whenever members are added, updated, or removed from any receipt in the booklet.
   - Display formatted in Santantoniari styling (gold/ink black, tabular-nums, right-aligned) at the top of the batch entry card.
3. **Multi-Socio Receipt Flow**:
   - Strengthen `currentReceipt.soci`: each row displays socio name, fee amount (`quota_pagata`), payment method, badge.
   - Support removing a single socio from the receipt without clearing the entire receipt or losing booklet state.
   - Display running receipt subtotal.
4. **Seamless Inline New Socio Drawer/Modal**:
   - Smooth inline registration drawer/modal that pre-populates name from failed search, collects required fields (Cognome, Nome, Data di Nascita, Manicchia).
   - On save: inserts member into `soci`, records initial tesseramento at €25 (`newMemberQuota`), attaches directly to active receipt, updates live booklet total, returns focus to entry.
5. **No Regressions**:
   - Preserve Dexie `tesseramenti` schema, `sessionData` persistence in `localStorage`, sound/audio feedback, and keyboard shortcuts (`Enter`, `Escape`).
   - Replace any remaining emojis in `BatchEntryView.vue` with `<BaseIcon>`.
6. Write your comprehensive report and code implementation guide to `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m2\handoff.md`.
7. Send message to parent.

## 2026-09-10T22:01:00Z
User Request:
Design the exact Vue 3 template, script, and CSS implementation plan for BatchEntryView.vue:
1. 10-slot visual receipt bar [1]..[10] (active, filled, empty states, keyboard arrow nav)
2. Live booklet cash total computed reactively from Dexie tesseramenti
3. Reinforced multi-socio per receipt flow with individual socio deletion and subtotal
4. Seamless inline new socio modal/drawer with 25€ quota
5. Replacement of all emojis with BaseIcon
Write your detailed strategy and code changes in c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m2\handoff.md.
When finished, send a message to your parent.
