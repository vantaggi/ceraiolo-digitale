## 2026-10-04T14:18:10Z

Sei un subagent Worker (teamwork_preview_worker) incaricato di implementare la Milestone M1: "Dataset Sintetico & Benchmark Prestazionali" per l'audit di "Ceraiolo Digitale".

La tua working directory esclusiva è:
c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_worker_m1_benchmarks

Devi leggere attentamente il file originale dei requisiti:
c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\ORIGINAL_REQUEST.md

Leggi inoltre i rapporti di survey dei precedenti subagent:
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_explorer_survey_data\handoff.md
- c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_orchestrator_1\PROJECT.md

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## VINCOLO FONDAMENTALE DI PROGETTO
NON MODIFICARE ALCUN FILE PREESISTENTE IN `src/`. Questo è un audit di pura analisi. Puoi SOLO creare file nuovi al di fuori di `src/` (ad esempio in `scripts/`, `tests/fixtures/`) o file nella tua cartella metadata.
Verifica con `git status` e assicurati che nessun file preesistente in `src/` sia modificato.

## I TUOI OBIETTIVI CONCRETI:
1. **Generare il Dataset Sintetico Realistico SQLite**:
   - Crea uno script eseguibile (es. `scripts/generate_synthetic_db.js`) che generi un archivio SQLite nativo compatibile con lo schema di import di Ceraiolo Digitale (`soci`, `tesseramenti`, `blocchetti` o schema atteso da `db.js:importDatabaseFromSqlite` / `ImportView.vue`).
   - Dimensioni minime vincolanti: >= 3.500 soci, 17.500 pagamenti (distribuiti su 5-10 anni), 1.000 blocchetti (10 ricevute per blocchetto).
   - Dati realistici eugubini: cognomi tipici (Cacciamani, Minelli, Panfili, Fioriti, Vispi, ecc.), manicchie corrette, distribuzioni per età.
   - Includi i 5 corner case obbligatori: (1) soci a cavallo dei 18 anni, (2) quote con buchi di pagamento (anni non consecutivi), (3) soci storici senza pagamenti, (4) ricevute multi-socio, (5) quote rientro 25€ vs 10€.
   - Salva il file generato in `tests/fixtures/synthetic_ceraiolo_audit.sqlite` (o path dedicato).

2. **Implementare ed Eseguire i Benchmark Prestazionali Numerici**:
   - Crea ed esegui uno script di benchmark (es. `scripts/benchmark_performance.js`) che misuri con precisione millimetrica i tempi reali:
     - Tempo di parsing e importazione del file SQLite generato (simulando il flusso di `db.js`).
     - Tempo di ricerca in Home su 3.500 soci (ricerca per cognome, tessera, manicchia).
     - Tempo di apertura / query della scheda socio (`getSocioById` + tesseramenti vs `getAllSociWithTesseramenti`).
     - Tempo di caricamento e calcolo della pagina Blocchetti (calcolando le aggregazioni su 17.500 pagamenti e misurando l'impatto del collo di bottiglia $O(N \cdot M)$).
     - Tempo di generazione di almeno due PDF (es. foglio 6x tessere per 100 soci e elenco alfabetico completo).
   - Raccogli i numeri reali (millisecondi/secondi, memoria) e salvali in `scripts/benchmark_results.json` e nel tuo rapporto.

3. **Verifica Suite Esistente**:
   - Assicurati che `npm run test -- --run` continui a passare al 100% (284/284 test verdi) e che `npm run build` compili pulito.

## OUTPUT RICHIESTO
Scrivi il tuo rapporto completo di handoff in:
`c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_worker_m1_benchmarks\handoff.md`
con tutte le tabelle numeriche di misurazione, i comandi eseguiti, l'ubicazione dei file generati e inviami un messaggio con il riepilogo.
