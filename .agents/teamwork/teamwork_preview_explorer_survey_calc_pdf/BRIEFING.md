# BRIEFING — 2026-10-04T16:13:30Z

## Mission
Survey e audit approfondito su Calcoli Contabili/Statutari, Motore Stampe/PDF, Qualità Codice/Test, e Intervento 3 per Ceraiolo Digitale (Famiglia dei Santantoniari).

## 🔒 My Identity
- Archetype: explorer
- Roles: survey, audit, synthesis
- Working directory: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_explorer_survey_calc_pdf
- Original parent: ccc3216f-38a5-48d0-b0e6-f65365773f54
- Milestone: initial survey completed

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- NON MODIFICARE ALCUN FILE PREESISTENTE IN `src/` o `tests/`
- Output finale in `handoff.md` conforme al protocollo a 5 sezioni
- Notifica al parent tramite `send_message`

## Current Parent
- Conversation ID: ccc3216f-38a5-48d0-b0e6-f65365773f54
- Updated: 2026-10-04T16:13:30Z

## Investigation State
- **Explored paths**:
  - `src/utils/payment.js`
  - `src/services/db.js`
  - `src/services/export.js`
  - `src/services/exportBeta.js`
  - `src/views/ReportsView.vue`
  - `src/views/ReportsBetaView.vue`
  - `src/views/BatchEntryView.vue`
  - `src/views/BlocchettiView.vue`
  - `src/views/SocioDetailView.vue`
  - `src/components/TesseraTemplate.vue`
  - `src/components/ConfirmDeleteModal.vue`
  - `src/__tests__/*`
  - `vite.config.js`
- **Key findings**:
  1. *Calcoli contabili/statutari*: Grave frattura logica sul diritto di voto (in `db.js` basta 1 anno precedente e anno solare 18; in `ReportsView.vue` serve finestra 4 anni, data esatta giorno/mese; l'hint UI dice 5 anni). Bug in `getNewMembersByYear` e `getMembersByGroup` che usano `today = new Date()` invece di `targetYear`. Bug in `ReportsView` con typo `data_iscrizione` invece di `data_prima_iscrizione`.
  2. *Intervento 3*: Fallback presente in `TesseraTemplate.vue` con motto «In Fide et Honore» e "GUBBIO", ma assente nel rendering PDF di `export.js`. Contenuti araldici da confermare con la Famiglia. Ordinamento per Manicchia vs A-Z verificato e funzionante.
  3. *Stampe e PDF*: 6x e 1x cards implementati. Duplicazione tra `export.js` e `exportBeta.js`. Mancanza di filtri per anno nei totali cassa blocchetti di BatchEntry e BlocchettiView.
  4. *Qualità codice e test*: `ReportsBetaView.vue` (1.398 righe) è codice morto al 100%. `exportBeta.js` è codice duplicato. 284 test passano ma mockano l'intero DB: zero test per Dexie reale, zero test unitari per modali critiche.
  5. *Intervento 5*: Mancato rispetto di `BASE_URL` in `importDatabaseFromSqlite` (riga 2302) e `exportSingleSocioToSqlite` (riga 1042) con `/${file}` invece del path corretto `/ceraiolo-digitale/`.
- **Unexplored areas**: None for this survey scope.

## Key Decisions Made
- Stesura di `handoff.md` strutturato in 5 sezioni obbligatorie con evidenze di codice millimetriche e tabella dei risultati con classificazione di gravità.

## Artifact Index
- handoff.md — Report conclusivo a 5 sezioni
