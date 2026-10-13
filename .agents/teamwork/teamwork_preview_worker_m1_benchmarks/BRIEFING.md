# BRIEFING — 2026-10-04T14:28:00Z

## Mission
Milestone M1: Generazione del Dataset Sintetico Realistico SQLite (>=3500 soci, 17500 pagamenti, 1000 blocchetti, 5 corner case) ed esecuzione di Benchmark Prestazionali reali con misurazioni e analisi dei colli di bottiglia.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_worker_m1_benchmarks
- Original parent: ccc3216f-38a5-48d0-b0e6-f65365773f54
- Milestone: M1 — Dataset Sintetico & Benchmark Prestazionali

## 🔒 Key Constraints
- NON MODIFICARE ALCUN FILE PREESISTENTE IN `src/` (Audit di pura analisi).
- DO NOT CHEAT: tutte le implementazioni e misurazioni devono essere genuine.
- Dimensioni minime vincolanti: >= 3.500 soci, 17.500 pagamenti (5-10 anni), 1.000 blocchetti (10 ricevute per blocchetto).
- Dati realistici eugubini: cognomi tipici, manicchie, fasce d'età.
- 5 corner case inclusi: cavallo 18 anni, buchi di pagamento, soci storici senza pagamenti, ricevute multi-socio, quote rientro 25€ vs 10€.
- Output benchmark in `scripts/benchmark_results.json` e `handoff.md`.
- Assicurarsi che `npm run test -- --run` e `npm run build` rimangano verdi al 100%.

## Current Parent
- Conversation ID: ccc3216f-38a5-48d0-b0e6-f65365773f54
- Updated: 2026-10-04T14:28:00Z

## Task Summary
- **What to build**:
  1. `scripts/generate_synthetic_db.js`: Generatore database SQLite deterministico e conforme allo schema Dexie/SQLite di Ceraiolo Digitale (3.500 soci, 17.500 pagamenti, 1.000 blocchetti, 5 corner cases).
  2. `tests/fixtures/synthetic_ceraiolo_audit.sqlite`: Archivio binario SQLite generato (2.25 MB).
  3. `scripts/verify_synthetic_db.js`: Script di verifica formale e statistica del dataset.
  4. `scripts/benchmark_performance.js`: Suite completa di benchmark reali ad alta precisione (import, search, query scheda socio, collo di bottiglia blocchetti O(N*M), generazione PDF).
  5. `scripts/benchmark_results.json`: Output strutturato dei benchmark.
  6. `handoff.md`: Rapporto di consegna esaustivo a 5 componenti.
- **Success criteria**:
  - Script eseguibili e funzionanti al 100%.
  - Suite di test esistente intonsa e verde (284/284 passati).
  - Build pulita (compilato in ~5.25s).
  - Nessuna modifica in `src/` (`git diff f0ec064 -- src` vuoto).

## Key Decisions Made
- Scelto generatore deterministico con PRNG (Mulberry32) per garantire riproducibilità identica al 100% su qualsiasi macchina.
- Rispettata la struttura storica dei blocchetti (1-750 storici senza riga in tabella Blocchetti, 751-900 campagna 2025 restituiti, 901-950 campagna 2026 attivi in circolazione, 951-980 campagna 2026 restituiti, 981-1000 preassegnati).
- Implementata suite benchmark eseguibile con `npx vite-node` per mantenere risoluzione nativa dei moduli e alias Vite `@/`.
- Misurato empiricamente il collo di bottiglia O(N*M) di `BlocchettiView.vue` confrontandolo con una Map hash O(N+M) (guadagno 7.5x - 8x in CPU).

## Artifact Index
- `scripts/generate_synthetic_db.js` — Script di generazione DB sintetico
- `scripts/verify_synthetic_db.js` — Script di verifica formale vincoli DB
- `tests/fixtures/synthetic_ceraiolo_audit.sqlite` — Database SQLite binario generato (2.25 MB)
- `scripts/benchmark_performance.js` — Suite di benchmark prestazionali
- `scripts/benchmark_results.json` — Risultati numerici serializzati
- `handoff.md` — Rapporto di handoff finale

## Change Tracker
- **Files modified**: Nessun file in `src/`. File creati solo in `scripts/` e `tests/fixtures/`.
- **Build status**: PASS (`vite build` in 5.25s)
- **Pending issues**: Nessuno

## Quality Status
- **Build/test result**: 284/284 passati (20 test suite).
- **Lint status**: Pulito su nuovi script.
- **Tests added/modified**: Script di verifica ed esecuzione benchmark creati.

## Loaded Skills
- Nessuna skill esterna caricata per questa milestone.
