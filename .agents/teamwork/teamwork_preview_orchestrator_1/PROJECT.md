# Project: Ceraiolo Digitale - Audit Approfondito, Benchmark e Piano di Sviluppo

## Architecture
- Framework: Vue 3, Vite, Pinia, Vue Router
- Data & Storage Layer: Dexie.js (IndexedDB wrapper), sql.js (SQLite WebAssembly engine)
- Reporting & Export Engine: jsPDF, pdf-lib, xlsx
- Target Audience: Famiglia dei Santantoniari di Gubbio (anziani, capimanicchia, archivisti, ceraioli)
- Standard di Accessibilità: WCAG 2.2 AA (contrasti >= 4.5:1, touch target >= 44px, tipografia offline sans-serif)

## Feature Inventory & Audit Areas
| # | Feature / Audit Dimension | Description | Milestone | Source |
|---|---------------------------|-------------|-----------|--------|
| 1 | Area (a) Bug Funzionali & Integrità Dati | SQLite import, transazionalità Dexie, fix DB invertito distruttivo, ripristino backup, export | M1, M2, M3 | Survey data |
| 2 | Area (b) Correttezza Calcoli | Frattura aventi diritto voto, bug temporale statistiche, typo data iscrizione, cassa blocchetti | M1, M2, M3 | Survey calc |
| 3 | Area (c) Stampe e PDF | Tessere 6x, liste soci, PDF Lab, resoconti cassa, duplicazione exportBeta | M1, M3 | Survey calc |
| 4 | Area (d) UX, Accessibilità & Temi | Contrasti WCAG 2.2 (oro 2.60:1, rosso dark 3.49:1, grafici 1.53:1), touch targets <44px, zero emoji | M1, M2, M3 | Survey ui |
| 5 | Area (e) Prestazioni con Archivi Grandi | Dataset sintetico >=3.500 soci, 17.500 pagamenti, 1.000 blocchetti; misure tempi reali | M1, M2 | Survey data |
| 6 | Area (f) Qualità Codice e Suite Test | Codice morto (ReportsBetaView 1.398 righe), mock fragili senza IndexedDB, copertura modali | M1, M3 | Survey calc |
| 7 | Area (g) Nuove Funzionalità Santantoniari | 7 proposte ad alto impatto (Registro elettorale, capimanicchia, tessere WhatsApp, cassa, ecc.) | M3 | Survey calc |
| 8 | Intervento Recente 1 (Tabella Blocchetti) | Filtro "In Circolazione" errato (990 storici inclusi), freeze O(N*M), disallineamento BatchEntry | M1, M2, M3 | Survey data |
| 9 | Intervento Recente 2 (Scheda Socio Dark) | Stile dark applicato con successo; touch targets bottoni < 44px da rifinire | M1, M3 | Survey ui |
| 10 | Intervento Recente 3 (Fallback Tessera) | Fallback funzionante; «In Fide et Honore» e "GUBBIO" da confermare con la Famiglia; Manicchia OK | M1, M3 | Survey calc |
| 11 | Intervento Recente 4 (ConfirmDeleteModal) | Errore `props is not defined` risolto con successo al 100% | M1, M3 | Survey ui |
| 12 | Intervento Recente 5 (WASM Base Path) | Risolto in onboarding iniziale, ma fallisce 404 in produzione su ripristino backup e single export | M1, M2, M3 | Survey data |
| 13 | Intervento Recente 6 (PDF Lab 2 Pilastri) | Struttura a 2 pilastri e larghezza 1400px attiva; ReportsBetaView orfano da dismettere | M1, M3 | Survey ui |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Dataset Sintetico & Benchmark Prestazionali | Generazione DB SQLite realistico (>=3500 soci, 17500 pagamenti, 1000 blocchetti) e benchmark quantitativi (import, search, dettaglio, blocchetti, PDF) | Survey completata | IN_PROGRESS |
| M2 | Riproduzioni Eseguibili & Test Casi Limite | Suite di script e test eseguibili per tutti i bug Critici/Alti, campionamento Medi, calcoli limite | M1 | PLANNED |
| M3 | Documentazione Esecutiva & Piano di Azione | Rapporto completo di audit in italiano (7 aree + 6 interventi), Piano di Sviluppo prioritizzato e Master Index | M2 | PLANNED |
| M4 | Verifica Indipendente & Forensic Audit | Revisione indipendente (100% Critici/Alti, >=30% Medi), Challenger su calcoli e carichi, Audit integrità git diff | M1, M2, M3 | PLANNED |

## Code Layout & File Boundaries
- `src/`: STRICTLY READ-ONLY. No pre-existing files modified (`git diff f0ec064 -- src` must be empty).
- `scripts/`: Added benchmarking and reproduction scripts (e.g. `scripts/generate_synthetic_db.js`, `scripts/benchmark_performance.js`, `scripts/reproduce_bugs.js`).
- `tests/fixtures/`: Synthetic database files (e.g. `tests/fixtures/synthetic_ceraiolo_audit.sqlite`).
- `tests/audit/`: Standalone Vitest verification tests for calculation edge cases and bug reproductions.
- Documenti di consegna (root repository):
  - `AUDIT_REPORT_CERAIOLO_DIGITALE.md` (Rapporto completo di audit, 7 aree, 6 interventi, evidenze numeriche)
  - `PIANO_DI_AZIONE_E_SVILUPPO.md` (Piano prioritizzato con fasi, sforzo S/M/L, rischio, aree, cose da non toccare, domande aperte)
  - `README_AUDIT.md` (Documento d'ingresso unico in italiano che orienta il responsabile e lo sviluppatore)
