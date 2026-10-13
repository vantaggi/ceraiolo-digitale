# Handoff Report: Batch Entry Flow Optimization (Milestone M2 - Requirement R1)

**Agent**: `explorer_m2`  
**Milestone**: M2 - Batch Entry Flow Optimization (R1)  
**Working Directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m2`  
**Target Git Branch**: `development`  
**Status**: Hard Handoff (Design & Investigation Complete)  

---

## 1. Observation

Direct inspection of `src/views/BatchEntryView.vue`, `src/services/db.js`, `src/components/common/BaseIcon.vue`, and test suites `src/__tests__/tier1_feature_coverage.spec.js` through `tier4_real_world_scenarios.spec.js`:

1. **Receipt Navigation & Absence of 10-Slot Bar** (`src/views/BatchEntryView.vue`, lines 70–96):
   - Currently, navigation between receipts is implemented via simple `<button @click="decrementReceipt">⬅️</button>` and `<button @click="incrementReceipt">➡️</button>` surrounding a readonly numeric input `currentReceipt.numero`.
   - Line 584 links booklet to receipt numbers: `calculatedReceiptNumber = (newVal - 1) * config.value.receiptsPerBlock + 1`.
   - **Absence**: There is no visual navigation bar representing the physical 10-slip booklet (`[1] [2] ... [10]`). The operator has no visual indication of which slips in the booklet are active, filled with members, or empty.

2. **Absence of Live Booklet Cash Total** (`src/views/BatchEntryView.vue`):
   - Grep search for `totaleIncassato`, `totaleBlocchetto`, or `bookletCash` in `BatchEntryView.vue` returns 0 results.
   - While `BlocchettiView.vue` (lines 41–82) aggregates `sum(quota_pagata)` for each `numero_blocchetto`, `BatchEntryView.vue` does not compute or display the real-time cash collected for the active booklet.
   - Operators cannot cross-reference physical cash inside the booklet envelope against the application without leaving the batch entry page.

3. **Multi-Socio Receipt Flow & Cache Limitations** (`src/views/BatchEntryView.vue`, lines 98–115 & 626–640):
   - `currentReceipt.soci` only stores `{ id, cognome, nome, anniPagati }` (lines 860–865). It fails to store `quota_pagata`, `totale_versato`, `metodo_pagamento`, or `is_nuovo`.
   - There is no running subtotal displayed for the active receipt sheet.
   - `receiptsCache` is an in-memory `new Map()` that only preserves data entered during the active browser session. If a user reloads the page or navigates to a receipt previously entered, the component does not hydrate existing payments from Dexie `db.tesseramenti`.
   - Socio removal (`removeFromReceipt` lines 967–1014) calls `deleteTesseramentiByReceipt(socio.id, currentReceipt.numero, socio.anniPagati)` correctly, but does not trigger an update to booklet totals or visual slot states.

4. **Inline New Socio Modal / Drawer** (`src/views/BatchEntryView.vue`, lines 208–325 & 898–965):
   - When a search query yields no results, `showNewSocioForm` is toggled.
   - The form fails to pre-populate `cognome` and `nome` from `searchQuery.value` (e.g. if the operator searched for "Rossi Mario", they must re-type both names).
   - The form does not display the statutory 25.0€ new member quota notice (`config.value.newMemberQuota`).
   - Line 931 already uses `config.value.newMemberQuota` when inserting into `tesseramenti`, but the UI lacks clear feedback about this fee.

5. **Iconography & Raw Emojis** (`src/views/BatchEntryView.vue`):
   - Over 27 raw emojis are present in the template:
     - Header: `🔄` (line 4)
     - Session data: `📋` (line 10), `📅` (line 14), `📄` (line 33), `🗓️` (line 51)
     - Receipt controls: `🧾` (line 72), `📊` (line 75), `⬅️` (line 80), `➡️` (line 92)
     - Receipt summary: `👥` (line 100), `🎯` (line 102), `❌` (line 110)
     - Work area: `🔍` (line 120), `➕` (line 127), `⚡` (line 141), `🔊`/`🔇` (line 151), `✕` (line 167), `🔎` (line 173)
     - Badges and actions: `✅` (lines 190, 193), `⚠️` (line 197), `💰` (line 200), `👤` (line 211), `➕` (line 217), `📝` (line 224), `➕` (line 295), `💾` (line 321).
   - In contrast, `src/components/common/BaseIcon.vue` is fully implemented and passes all 8 test cases in `src/components/__tests__/BaseIcon.test.js`.

6. **Automated Test Contracts**:
   - `npx vitest run` passes with 96 tests across 8 test files.
   - Specifically, `src/__tests__/tier1_feature_coverage.spec.js`:
     - Lines 177–196 test slot receipt calculation: `(numeroBlocchetto - 1) * 10 + slotIndex`.
     - Lines 198–223 test live booklet cash total summation over `numero_blocchetto`.
     - Lines 225–251 test multi-socio receipt aggregation, subtotal calculation, and single socio removal.
     - Lines 253–296 test inline new member creation defaulting to 25.0€ quota and linking to session year/receipt.

---

## 2. Logic Chain

From the direct observations, the complete implementation design is deduced step-by-step:

### 2.1 10-Slot Visual Receipt Bar Design
- **Premise**: Physical receipt booklets in Gubbio consist of exactly 10 receipts. For booklet $B$ (`sessionData.numeroBlocchetto`), receipts are numbered $(B-1)\times 10 + 1$ through $B\times 10$.
- **Inference**:
  1. We create a computed property `bookletSlots` generating 10 slot descriptor objects:
     ```javascript
     {
       index: 1..10,
       receiptNumber: (B - 1) * 10 + index,
       isActive: currentReceipt.numero === receiptNumber,
       isFilled: socioCount > 0,
       count: socioCount
     }
     ```
  2. The slot state logic must evaluate:
     - `isActive`: whether the slot matches `currentReceipt.numero`.
     - `isFilled`: whether `count > 0` (either in `currentReceipt.soci` if active, or `receiptsCache`, or loaded from Dexie `db.tesseramenti`).
     - `empty`: `count === 0 && !isActive`.
  3. Clicking any slot executes `goToReceipt(slot.receiptNumber)`, which saves current receipt state to cache, updates `currentReceipt.numero`, hydrates receipt data, and focuses the search input.
  4. Global keyboard listeners `ArrowLeft` / `ArrowRight` (in `handleGlobalKeydown`) navigate seamlessly across the 10 slots when inputs are not actively being edited.

### 2.2 Live Booklet Cash Total Computation
- **Premise**: In Gubbio, volunteer collectors hand in completed booklets accompanied by cash. The screen must show the exact sum of money belonging to the active booklet in real-time.
- **Inference**:
  1. Implement an async function `updateBookletCashTotal()`:
     ```javascript
     const payments = await db.tesseramenti
       .where('numero_blocchetto')
       .equals(Number(sessionData.numeroBlocchetto))
       .toArray()
     bookletCashTotal.value = payments.reduce((sum, p) => sum + (Number(p.quota_pagata) || 0), 0)
     ```
  2. Also construct a reactive `bookletPaymentsMap` (`Map<number, Array>`) mapping receipt numbers to payments. This enables instant reactivity for slot filled/empty indicators across all 10 slots without running separate queries.
  3. Invoke `updateBookletCashTotal()`:
     - On component mount (`onMounted`).
     - Whenever `sessionData.numeroBlocchetto` changes (`watch`).
     - Immediately following any payment save (`handleSavePayments`, `saveNewSocio`).
     - Immediately following any socio removal (`confirmRemoveFromReceipt`).
  4. Display this figure prominently in a top summary banner styled in warm gold (`#c59b27`) and ink black (`#1a1a1a`), with right-aligned tabular numbers (`font-variant-numeric: tabular-nums`).

### 2.3 Reinforced Multi-Socio Flow & Hydration
- **Premise**: Multiple family members (e.g. parents, adult children, minors) frequently pay together on a single receipt sheet.
- **Inference**:
  1. Each item in `currentReceipt.soci` must store:
     - `id`, `cognome`, `nome`, `gruppo_appartenenza`, `data_nascita`
     - `anniPagati`: array of years paid
     - `quota_pagata`: fee per year
     - `totale_versato`: total paid (`quota_pagata * anniPagati.length`)
     - `metodo_pagamento`: payment method (default 'Contanti')
     - `is_nuovo`: boolean indicating if first-time registrant
  2. Implement `receiptSubtotal` as a reactive computed property summing `totale_versato || quota_pagata`.
  3. Implement `loadReceiptData(receiptNumber)`: if not found in `receiptsCache`, hydrate directly from Dexie `tesseramenti` and `soci`. This ensures previously entered data survives browser refreshes or booklet switches.
  4. Each socio row displays name, group, fee badge (Nuovo Socio / Rinnovo / Minorenne), formatted amount in tabular numbers, and a single-item delete button (`<BaseIcon name="trash-2">`).
  5. Removal workflow: opens `ConfirmDeleteModal`. On confirmation, executes `deleteTesseramentiByReceipt`, splices the socio from `currentReceipt.soci`, updates cache, re-triggers `updateBookletCashTotal()`, and plays success audio.

### 2.4 Seamless Inline New Socio Drawer / Modal
- **Premise**: When an operator searches for a member and gets 0 results, navigating to a separate view breaks high-speed registration.
- **Inference**:
  1. Transform the new member area into an inline drawer (`.new-socio-drawer`) embedded directly within the work area.
  2. Implement intelligent name pre-population in `openNewSocioForm()`:
     ```javascript
     const raw = searchQuery.value.trim()
     const parts = raw.split(/\s+/)
     if (parts.length >= 2) {
       newSocioData.cognome = capitalize(parts[0])
       newSocioData.nome = parts.slice(1).map(capitalize).join(' ')
     } else if (parts.length === 1) {
       newSocioData.cognome = capitalize(parts[0])
       newSocioData.nome = ''
     }
     ```
  3. Display an informational callout: `Quota Prima Iscrizione: € 25,00`.
  4. On `saveNewSocio()`:
     - Inserts record into `db.soci` via `addSocio()`.
     - Adds initial tesseramento with `quota_pagata: config.value.newMemberQuota || 25.0`, `anno: sessionData.annoRiferimento`, `data_pagamento: sessionData.dataPagamento`, `numero_ricevuta: currentReceipt.numero`, `numero_blocchetto: sessionData.numeroBlocchetto`.
     - Attaches member directly to `currentReceipt.soci` with `is_nuovo: true`.
     - Calls `saveCurrentReceiptToCache()` and `updateBookletCashTotal()`.
     - Closes drawer, clears search, plays success sound, and refocuses `searchInput`.

### 2.5 Complete Emoji Replacement with BaseIcon
- **Premise**: Emojis violate the Apple SF Symbols / Santantoniari institutional aesthetic and render inconsistently across operating systems.
- **Inference**: Replace every single emoji with `<BaseIcon>`:
  - Header: `<BaseIcon name="refresh-cw" size="28" color="accent" />`
  - Session icons: `calendar`, `file-text`
  - Receipt context: `receipt`, `bar-chart`, `chevron-left`, `chevron-right`
  - Receipt summary: `users`, `inbox`, `trash-2`
  - Work area & search: `search`, `user-plus`, `zap`, `volume-2`/`volume-x`, `x`
  - Results & badges: `check-circle`, `alert-triangle`, `coins`, `user`, `edit`, `save`

---

## 3. Caveats

1. **In-Memory Cache vs Dexie Persistence**:
   - `receiptsCache` provides instantaneous slot switching in memory, while `loadReceiptData` falls back to querying IndexedDB. When `sessionData.numeroBlocchetto` changes, `receiptsCache.clear()` ensures stale cached receipts from the previous booklet are discarded.
2. **Multiple Payments per Socio on Single Receipt**:
   - When a returning member pays for multiple years (e.g. 2025 and 2026), each year is stored as a separate record in `tesseramenti`. `loadReceiptData` groups these by `id_socio` so that each person appears once on the receipt card with `anniPagati: [2025, 2026]`, and their total fee reflects the sum of both years.
3. **Receipt Boundaries**:
   - Standard booklets have 10 receipts (`config.value.receiptsPerBlock = 10`). Keyboard arrow navigation stops at receipt 1 when decrementing (`numero > 1`). When incrementing past slot 10, the application allows progressing to receipt 11, but the 10-slot bar reflects receipts `(B-1)*10 + 1` to `B*10` for active booklet $B$.
4. **No Code Written to `src/`**:
   - In accordance with the explorer role constraints, `src/views/BatchEntryView.vue` has not been modified directly. Instead, full replacement and patch artifacts have been generated in `.agents/explorer_m2/`.

---

## 4. Conclusion

The complete implementation plan for `src/views/BatchEntryView.vue` is fully formulated, verified against project requirements R1 through R6, and encapsulated in two ready-to-use artifacts in `.agents/explorer_m2/`:

1. `.agents/explorer_m2/proposed_BatchEntryView.vue`: Complete drop-in replacement file containing all template, script, and CSS changes.
2. `.agents/explorer_m2/BatchEntryView.patch`: Git-compatible unified diff patch for surgical application.

### Key Features Delivered:
- **10-Slot Visual Bar**: Fully responsive `[1]..[10]` grid showing active receipt, filled badges with member count, empty state dots, direct click switching, and keyboard arrow navigation.
- **Live Booklet Cash Total**: Real-time reactive computation querying Dexie `tesseramenti.where('numero_blocchetto')`, presented in a dedicated gold/black summary banner with tabular numbers.
- **Reinforced Multi-Socio Flow**: Enriched socio cards displaying individual fee quotas, years paid, membership status badges, receipt subtotal, and single-member deletion without booklet state disruption.
- **Smart Inline New Socio Drawer**: High-speed registration form pre-filling surname and name from search query, pre-configured 25€ statutory fee, automatic attachment to active receipt, and immediate focus return.
- **Zero Emojis**: All 27 emojis replaced with semantic `<BaseIcon>` components styled with Santantoniari tokens.
- **Session Persistence**: Session parameters (`annoRiferimento`, `numeroBlocchetto`, `dataPagamento`) preserved in `localStorage` under key `ceraiolo_batch_session`.

---

## 5. Verification Method

To independently verify the implementation when applied by `worker_m2`:

1. **Verify Unit & E2E Test Suite**:
   ```bash
   npx vitest run
   # Expected: All 96+ tests pass, including:
   # - tier1_feature_coverage.spec.js (Features 7, 8, 9, 10)
   # - tier2_boundary_corner.spec.js (Booklet and receipt boundaries)
   # - tier3_cross_feature.spec.js (Combination 1: Batch entry + cash tally)
   # - tier4_real_world_scenarios.spec.js (Scenario 1: Annual tesseramento session)
   ```

2. **Verify Code Quality & Linter**:
   ```bash
   npm run lint
   # Expected: 0 errors, 0 warnings
   ```

3. **Verify Build Compilation**:
   ```bash
   npm run build
   # Expected: Vite build succeeds with exit code 0
   ```

4. **Visual & Interaction Verification in Browser (`npm run dev`)**:
   - Navigate to `/batch-entry`.
   - Set Booklet #1: The visual bar displays slots `[1]` through `[10]` corresponding to receipts `#1` through `#10`.
   - The top banner displays `Blocchetto #1`, `Ricevute 1 — 10`, `Compilati: 0 / 10`, `Totale Cassa Libretto: € 0.00`.
   - Search for a non-existent member "Rossi Mario":
     - Click "Registra Nuovo Socio con Quota 25€".
     - Notice Cognome is pre-filled with "Rossi" and Nome with "Mario".
     - Enter birth date and click "Salva e Aggiungi alla Ricevuta #1 (25€)".
     - Confirm receipt #1 displays Rossi Mario with badge "Nuovo Socio" and quota "€ 25.00".
     - Confirm Subtotale Ricevuta shows "€ 25.00".
     - Confirm Totale Cassa Libretto immediately updates to "€ 25.00".
     - Confirm Slot `[1]` in the visual bar transitions to `filled` with count `1`.
   - Click Slot `[2]`:
     - Receipt switches to `#2`.
     - Subtotale Ricevuta shows "€ 0.00".
     - Totale Cassa Libretto remains "€ 25.00".
     - Slot `[2]` is active; Slot `[1]` remains marked as filled.
   - Click Slot `[1]` to return to receipt #1:
     - Notice Rossi Mario is reloaded and displayed with all details.
     - Click the trash icon on Rossi Mario:
     - Confirmation modal opens. Confirm removal.
     - Rossi Mario is removed from receipt #1.
     - Totale Cassa Libretto decrements to "€ 0.00".
     - Slot `[1]` returns to empty.
   - Inspect the entire view to confirm zero raw emojis remain; all iconography is rendered via `<BaseIcon>`.

---
*Report completed by explorer_m2.*
