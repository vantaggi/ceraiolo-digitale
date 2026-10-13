## 2026-10-04T14:18:10Z

Sei un subagent Worker (teamwork_preview_worker) incaricato di implementare la Milestone M2: "Riproduzioni Eseguibili & Test Casi Limite" per l'audit di "Ceraiolo Digitale".

La tua working directory esclusiva è:
c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_worker_m2_repro

Devi leggere attentamente il file originale dei requisiti:
c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\ORIGINAL_REQUEST.md

Leggi inoltre i rapporti di survey dei precedenti subagent:
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_explorer_survey_data\handoff.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_explorer_survey_ui\handoff.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_explorer_survey_calc_pdf\handoff.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_orchestrator_1\PROJECT.md

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## VINCOLO FONDAMENTALE DI PROGETTO
NON MODIFICARE ALCUN FILE PREESISTENTE IN `src/`. Questo è un audit di pura analisi. Puoi SOLO creare file nuovi al di fuori di `src/` (es. in `scripts/audit/` o `tests/audit/`) o file nella tua cartella metadata.
Assicurati che eventuali nuovi test non rompano `npm run test -- --run` (ad esempio creando script dedicati o configurando test specifici che possono essere eseguiti sia singolarmente che in batch).

## I TUOI OBIETTIVI CONCRETI:
1. **Riproduzioni Eseguibili per TUTTI i Bug Critici e Alti**:
   Crea script Node.js eseguibili o test indipendenti (es. in `scripts/audit_repro/` o `tests/audit/`):
   - **BUG-01 (Critico)**: Fix DB Invertito distruttivo (`HomeView.vue:160`, `db.js:2492-2558`) - dimostrare che per blocchetto > ricevuta (es. blocchetto 25, ricevuta 4) scambia i numeri e corrompe irreversibilmente i pagamenti.
   - **BUG-02 (Critico/Alto)**: Mancato caricamento `sql-wasm.wasm` con base path `/ceraiolo-digitale/` in `db.js:1042` e `db.js:2302` (`importDatabaseFromSqlite` e `exportSocioToSqlite` con `locateFile: file => '/${file}'`), producendo HTTP 404 in produzione.
   - **BUG-03 (Critico/Alto)**: Tripla frattura logica su Aventi Diritto al Voto (`db.js:1681` vs `ReportsView.vue:2358` vs etichetta UI r. 454) - dimostrare che le due query producono elenchi di votanti differenti per lo stesso anno elettorale.
   - **BUG-04 (Alto)**: Bug temporale nelle statistiche storiche (`new Date()` usato in `getNewMembersByYear` e `getMembersByGroup`).
   - **BUG-05 (Alto)**: Tabella Blocchetti: filtro "In Circolazione" include tutti i 990 blocchetti storici (`!b.data_restituzione`), falsando i totali operativi.
   - **BUG-06 (Alto)**: Collo di bottiglia $O(N \cdot M)$ in BlocchettiView (45M iterazioni sincrone senza lookup map).
   - **BUG-07 (Alto)**: Typo campo `member.data_iscrizione` vs `member.data_prima_iscrizione` in `ReportsView.vue:2095`.
   - **BUG-08 (Alto)**: Calcolo cassa blocchetto multi-anno (`BatchEntryView.vue:867`, `BlocchettiView.vue:49`) che somma incassi di anni diversi per lo stesso numero blocchetto.

2. **Campionamento e Riproduzione di almeno il 30% dei Bug Medi**:
   - **BUG-09 (Medio)**: Mancanza di transazioni atomiche in salvataggio multi-anno (`BatchEntryView.vue:1250`).
   - **BUG-10 (Medio)**: Mancata pulizia tabella `db.blocchetti` nel Factory Reset (`wipeDatabase`).
   - **BUG-11 (Medio)**: Discrepanza calcolo età (anno solare in `utils/payment.js` vs data esatta in `export.js`).

3. **Verifica Indipendente dei Calcoli con Casi Limite**:
   - Implementa test/script di calcolo indipendente con casi sintetici documentati:
     - Caso 1: Compleanno a cavallo dei 18 anni (es. nato a novembre, votazioni a maggio).
     - Caso 2: Anni non consecutivi (salto pagamenti e rientro con quota 25€ vs 10€).
     - Caso 3: Soci senza pagamenti registrati.
     - Caso 4: Ricevute multi-socio (stessa ricevuta, quote separate).

4. **Verifica Suite Esistente**:
   - Esegui e verifica che `npm run test -- --run` rimanga verde al 100% (284/284 test) e `npm run build` compili senza errori.

## OUTPUT RICHIESTO
Scrivi il tuo rapporto completo di handoff in:
`c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_worker_m2_repro\handoff.md`
con il catalogo dettagliato delle riproduzioni, i comandi per eseguirle, i risultati ottenuti e inviami un messaggio con il riassunto.
