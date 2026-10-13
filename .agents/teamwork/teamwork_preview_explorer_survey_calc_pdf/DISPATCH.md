## 2026-10-04T14:03:57Z
Sei un subagent Explorer (teamwork_preview_explorer) incaricato della ricognizione iniziale (Survey) di Calcoli Contabili/Statutari, Motore Stampe/PDF, Qualità Codice e Interventi Recenti per "Ceraiolo Digitale".

La tua working directory esclusiva è:
c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_explorer_survey_calc_pdf

Devi leggere il file originale dei requisiti:
c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\ORIGINAL_REQUEST.md

## VINCOLO FONDAMENTALE
NON MODIFICARE ALCUN FILE PREESISTENTE IN `src/`. Questo è un audit di pura analisi. Puoi leggere qualsiasi file di codice ed eseguire verifiche non distruttive.

## OBIETTIVO DEL TASK
Analizzare in profondità le aree:
- (b) Correttezza dei calcoli: quote annuali, arretrati, minorenni/esenti, compimento dei 18 anni (data esatta vs anno solare), aventi diritto al voto statutario (regole della Famiglia dei Santantoniari), statistiche e totali di cassa. Esaminare formule in `src/utils/`, `src/services/`, store Pinia.
- (c) Stampe e PDF: generazione tessere soci, liste, PDF Lab, resoconti cassa blocchetti (`src/services/export.js`, `src/components/TesseraTemplate.vue`, ecc.).
- (f) Qualità del codice e dei test: identificare codice morto o duplicato (in particolare `src/views/ReportsBetaView.vue` vs `src/views/ReportsView.vue`), debito tecnico, e valutare la robustezza/fragilità della suite di test esistente (`tests/`).
- (g) Proposte di nuove funzionalità utili alla Famiglia dei Santantoniari (analisi dei bisogni non coperti).
- Verifica esplicita dell'Intervento 3: Anteprima tessera in Report con fallback grafico istituzionale quando non c'è un template caricato. Verificare motto «In Fide et Honore» e sottotitolo "GUBBIO" (da segnalare come contenuto da confermare con la Famiglia) e ordinamento per Manicchia vs A-Z.

## OUTPUT RICHIESTO
Scrivi il tuo rapporto dettagliato in:
`c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_explorer_survey_calc_pdf\handoff.md`

Il rapporto deve contenere:
- Sommario esecutivo
- Mappatura logiche di calcolo con identificazione di falle, casi limite (edge cases) e discrepanze
- Esito esplicito per l'Intervento 3 con evidenze di codice
- Analisi approfondita di stampe, PDF e template tessere
- Mappatura codice morto (`ReportsBetaView.vue`, ecc.) e qualità test attuali
- Proposte ragionate per nuove funzionalità (area g)
- Inviami un messaggio con un riassunto dei risultati e indicazione del file handoff.md completato.
