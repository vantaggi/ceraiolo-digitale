# BRIEFING — 2026-10-04T14:32:00Z

## Mission
Implementazione della Milestone M2: "Riproduzioni Eseguibili & Test Casi Limite" per l'audit di "Ceraiolo Digitale".

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_worker_m2_repro
- Original parent: ccc3216f-38a5-48d0-b0e6-f65365773f54
- Milestone: M2 - Riproduzioni Eseguibili & Test Casi Limite

## 🔒 Key Constraints
- NON MODIFICARE ALCUN FILE PREESISTENTE IN `src/`. Questo è un audit di pura analisi. Solo nuovi file al di fuori di `src/` (es. `scripts/audit_repro/`, `tests/audit/`) o nella propria cartella metadata.
- Non rompere la suite preesistente: `npm run test -- --run` deve rimanere verde al 100% (284/284) e `npm run build` deve compilare senza errori.
- Nessuna falsificazione o hardcoding: riproduzioni genuine con logica ed esecuzione reale.
- Forensic Auditor verificherà indipendentemente il lavoro.

## Current Parent
- Conversation ID: ccc3216f-38a5-48d0-b0e6-f65365773f54
- Updated: 2026-10-04T14:32:00Z

## Task Summary
- **What to build**: Suite di riproduzione eseguibile per tutti i Bug Critici e Alti (BUG-01 a BUG-08), campionamento Bug Medi (BUG-09 a BUG-11) e i 4 Casi Limite di Calcolo.
- **Success criteria**: Tutti gli script eseguibili singolarmente e aggregati tramite master runner; suite Vitest 284/284 verde; build pulita; `git diff f0ec064 -- src` vuoto; handoff.md completo.
- **Interface contracts**: Nessuna alterazione a file in `src/`.
- **Code layout**: Suite inserita in `scripts/audit_repro/`.

## Key Decisions Made
- [Iniziale] Strutturare gli script di riproduzione in `scripts/audit_repro/` per isolarli da `src/`, consentire l'esecuzione indipendente tramite `node` e un master runner `run_all_repros.js`.
- [Conferma] Tutte le riproduzioni sono implementate come test empirici con asserzioni rigorose che confermano l'insorgenza del bug e documentano il delta rispetto al comportamento atteso.

## Artifact Index
- `DISPATCH.md` — Assegnazione dal coordinatore
- `BRIEFING.md` — Stato operativo corrente
- `progress.md` — Log liveness e passi svolti
- `scripts/audit_repro/repro_bug_01_fix_db_invertito.js` — Repro BUG-01
- `scripts/audit_repro/repro_bug_02_wasm_base_path.js` — Repro BUG-02
- `scripts/audit_repro/repro_bug_03_voting_fracture.js` — Repro BUG-03
- `scripts/audit_repro/repro_bug_04_temporal_stats.js` — Repro BUG-04
- `scripts/audit_repro/repro_bug_05_blocchetti_circolazione.js` — Repro BUG-05
- `scripts/audit_repro/repro_bug_06_bottleneck_onm.js` — Repro BUG-06
- `scripts/audit_repro/repro_bug_07_typo_iscrizione.js` — Repro BUG-07
- `scripts/audit_repro/repro_bug_08_cassa_multi_anno.js` — Repro BUG-08
- `scripts/audit_repro/repro_bug_09_atomic_transactions.js` — Repro BUG-09
- `scripts/audit_repro/repro_bug_10_wipe_blocchetti.js` — Repro BUG-10
- `scripts/audit_repro/repro_bug_11_age_discrepancy.js` — Repro BUG-11
- `scripts/audit_repro/repro_calc_edge_cases.js` — Casi Limite 1-4
- `scripts/audit_repro/run_all_repros.js` — Master Runner
- `handoff.md` — Rapporto finale con 5 sezioni di protocollo

## Change Tracker
- **Files modified**: Nessun file modificato in `src/`. File creati in `scripts/audit_repro/`.
- **Build status**: `npm run build` PASS (built in 5.32s).
- **Pending issues**: Nessuno.

## Quality Status
- **Build/test result**: `npm run test -- --run` PASS (20 test files, 284/284 test verdi).
- **Lint status**: File sorgente invariati.
- **Tests added/modified**: 12 script eseguibili autonomi in `scripts/audit_repro/`.

## Loaded Skills
- Nessuna skill esterna caricata.
