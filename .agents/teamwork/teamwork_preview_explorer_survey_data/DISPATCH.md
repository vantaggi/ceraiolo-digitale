## 2026-10-04T14:03:56Z
Sei un subagent Explorer (teamwork_preview_explorer) incaricato della ricognizione iniziale (Survey) del layer Dati, Archiviazione e Integrità per l'audit di "Ceraiolo Digitale".

La tua working directory esclusiva è:
c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_explorer_survey_data

Devi leggere il file originale dei requisiti:
c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\ORIGINAL_REQUEST.md

## VINCOLO FONDAMENTALE
NON MODIFICARE ALCUN FILE PREESISTENTE IN `src/`. Questo è un audit di pura analisi. Puoi leggere qualsiasi file di codice, eseguire comandi read-only o script di test esterni.

## OBIETTIVO DEL TASK
Analizzare in profondità l'area (a) "Bug funzionali e integrità dei dati" e verificare specificamente 2 dei 6 interventi recenti:
1. Intervento 1: Tabella Blocchetti (in precedenza nascondeva i blocchetti derivati dai pagamenti importati: contatore 990, tabella vuota; ora mostra tutti i blocchetti con filtri rapidi e paginazione). Verifica lo stato reale del codice in `src/views/ReceiptsView.vue`, `src/views/BatchEntryView.vue`, nei database service e negli store. Funziona, funziona in parte o non funziona?
2. Intervento 5: Errore caricamento `sql-wasm.wasm` durante l'import del database (osservato con il server di sviluppo fermo; verificare come viene caricato in `src/services/import.js`, configurazione `vite.config.js`, se funziona sia in dev che con la build di produzione avente base path `/ceraiolo-digitale/`).

Inoltre:
- Mappare l'architettura dei dati: schema Dexie (`src/db/`), schema SQLite di origine, mapping e trasformazioni.
- Esaminare integrità dei pagamenti, transazioni, rollback, concorrenza e backup/ripristino (`src/services/backup.js`).
- Esaminare esportazioni Excel/JSON (`src/services/export.js`).
- Definire i requisiti e la struttura per generare un dataset sintetico realistico (>= 3.000 soci, 15.000 pagamenti, 1.000 blocchetti) compatibile con lo schema SQLite/Dexie per i benchmark di performance.

## OUTPUT RICHIESTO
Scrivi il tuo rapporto dettagliato in:
`c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_explorer_survey_data\handoff.md`

Il rapporto deve contenere:
- Sommario esecutivo
- Mappatura completa architettura dati e storage
- Analisi approfondita di tutti i bug funzionali e rischi di integrità trovati (con file, righe, impatto, passi di riproduzione)
- Esito esplicito per l'Intervento 1 e l'Intervento 5 con evidenze concrete
- Specifiche per la creazione del dataset sintetico SQLite di test (schema, relazioni, vincoli, volume)
- Inviami un messaggio con un riassunto dei risultati e indicazione del file handoff.md completato.
