## 2026-10-04T14:40:58Z
Sei un subagent Reviewer (teamwork_preview_reviewer) incaricato della Verifica Indipendente (Milestone M4) per l'audit di "Ceraiolo Digitale" (Famiglia dei Santantoniari di Gubbio).

La tua working directory esclusiva è:
c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_reviewer_independent_1

Devi leggere il file originale dei requisiti:
c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\ORIGINAL_REQUEST.md

E tutti i documenti e deliverable prodotti:
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\AUDIT_REPORT_CERAIOLO_DIGITALE.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\PIANO_DI_AZIONE_E_SVILUPPO.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\README_AUDIT.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\scripts\benchmark_results.json

## VINCOLO FONDAMENTALE
NON MODIFICARE ALCUN FILE IN `src/`. Pura analisi e riesecuzione indipendente.

## I TUOI OBIETTIVI CONCRETI:
1. **Rieseguire e Confermare in Modo Indipendente 100% dei Bug Critici e Alti**:
   Esegui ed esamina gli script in `scripts/audit_repro/`:
   - `node scripts/audit_repro/run_all_repros.js`
   - Verifica singolarmente BUG-01 .. BUG-08. Sono tutti confermati al 100%?
2. **Campionare e Ricontrollare almeno il 30% dei Bug Medi**:
   - Ricontrolla BUG-09 (transazioni atomiche), BUG-10 (wipe blocchetti), BUG-11 (età solare vs esatta).
   - Verifica che almeno il 90% dei risultati ricontrollati sia confermato.
3. **Verificare Indipendentemente i Calcoli sui Casi Limite**:
   - Esegui `node scripts/audit_repro/repro_calc_edge_cases.js` e confronta le asserzioni con i risultati attesi documentati (cavallo 18 anni, anni non consecutivi, soci senza pagamenti, ricevute multi-socio).
4. **Verificare i Benchmark e il Dataset**:
   - Esegui `node scripts/verify_synthetic_db.js`.
   - Verifica la correttezza metodologica di `scripts/benchmark_performance.js`.
5. **Verificare Build e Suite Vitest**:
   - Esegui `npm run test -- --run` (deve passare 284/284).
   - Esegui `npm run build` (deve compilare pulito).
6. **Valutare la Qualità dei Deliverable**:
   - Controlla che tutte le 7 aree abbiano la propria sezione in `AUDIT_REPORT_CERAIOLO_DIGITALE.md`.
   - Controlla che tutti i 6 interventi abbiano esito esplicito motivato.
   - Controlla che `PIANO_DI_AZIONE_E_SVILUPPO.md` contenga le sezioni obbligatorie "Cosa è meglio non toccare" e "Domande aperte".
   - Controlla `README_AUDIT.md`.

## OUTPUT RICHIESTO
Scrivi il tuo rapporto di handoff in:
`c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_reviewer_independent_1\handoff.md`
Il rapporto deve includere l'esito esplicito del gate: **APPROVE** o **REQUEST_CHANGES** con tutte le evidenze a supporto. Inviami poi un messaggio con la sintesi e il verdetto.
