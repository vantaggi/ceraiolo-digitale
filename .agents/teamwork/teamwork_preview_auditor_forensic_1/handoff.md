# Rapporto di Integrità Forense (Milestone M4) — Handoff

**Progetto:** Ceraiolo Digitale (Famiglia dei Santantoniari di Gubbio)  
**Ruolo:** Forensic Auditor (`teamwork_preview_auditor_forensic_1`)  
**Commit di Riferimento:** `f0ec064` (branch `development`)  
**Data Audit:** 4 Ottobre 2026  
**Verdetto Binario:** **CLEAN**

---

## 1. Observation (Evidenze Empiriche e Output Diretti dei Tool)

Tutti i controlli obbligatori di integrità forense sono stati eseguiti direttamente e indipendentemente in shell Windows/Node.js senza affidarsi a dichiarazioni pregresse.

### 1.1 Controllo 1: Inviolabilità del Codice Sorgente `src/` vs Commit `f0ec064`
- **Comando eseguito:** `git diff f0ec064 -- src`
- **Output verbatim:**
  ```
  (output vuoto, exit code 0)
  ```
- **Comando eseguito:** `git status --porcelain src`
- **Output verbatim:**
  ```
  (output vuoto, exit code 0)
  ```
- **Comando eseguito:** `git status`
- **Output verbatim:**
  ```
  On branch development
  Untracked files:
    (use "git add <file>..." to include in what will be committed)
          .agents/
          AUDIT_REPORT_CERAIOLO_DIGITALE.md
          ORIGINAL_REQUEST.md
          PIANO_DI_AZIONE_E_SVILUPPO.md
          README_AUDIT.md
          scripts/

  nothing added to commit but untracked files present (use "git add" to track)
  ```
- **Evidenza:** Nessun file preesistente in `src/` è stato modificato, cancellato o aggiunto. Il codice dell'applicazione è rimasto intonso al 100% come richiesto da `ORIGINAL_REQUEST.md`.

---

### 1.2 Controllo 2: Autenticità dei Benchmark e delle Riproduzioni
- **File Database SQLite:** `tests/fixtures/synthetic_ceraiolo_audit.sqlite`
  - Dimensione: `2.359.296` byte (~2,25 MB).
  - Magic Bytes: primi 16 byte verificati con `node -e "..."` -> `SQLite format 3\0` (`Magic bytes match: true`).
- **Verifica del Dataset Sintetico (`node scripts/verify_synthetic_db.js`):**
  - **Output verbatim:**
    ```
    === VERIFICA DETERMINISTICA DEL DATASET SINTETICO ===
    [1] VOLUMI:
        Soci: 3500 (Min richiesto: 3500) -> PASS
        Tesseramenti: 17500 (Min richiesto: 17500) -> PASS
        Blocchetti in tabella: 250
        Blocchetti unici utilizzati: 937 -> PASS

    [2] CORNER CASE 1 (Cavallo 18 anni):
        H1 2008 (Maggiorenni a maggio 2026): 25/25 -> PASS
        H2 2008 (Minorenni a maggio 2026, 2026-2008=18): 25/25 -> PASS

    [3] CORNER CASE 2 (Buchi di pagamento / Anni non consecutivi):
        Soci con buchi storici e sanatoria 2026: 150/150 -> PASS
        Soci con buchi storici e morosi 2026: 150/150 (morosi effettivi) -> PASS

    [4] CORNER CASE 3 (Soci storici dormienti con ZERO pagamenti):
        Soci senza tesseramenti: 50/50 -> PASS

    [5] CORNER CASE 4 (Ricevute multi-socio):
        Ricevute con più di 1 socio registrato: 5059 (Min richiesto: 400) -> PASS

    [6] CORNER CASE 5 (Quote 25€ vs 10€):
        Nuove iscrizioni 2026 a 25€: 100/100 -> PASS
        Rientri adulti a 25€: 50/50 -> PASS
        Rientri minorenni a 10€ (esenti): 50/50 -> PASS

    [7] DISTRIBUZIONE MANICCHIE:
        - San Martino: 618 (17.7%)
        - Sant'Agostino: 588 (16.8%)
        - San Pietro: 560 (16.0%)
        - Padule: 442 (12.6%)
        - Madonna del Ponte: 409 (11.7%)
        - Non specificata: 334 (9.5%)
        - Branca: 314 (9.0%)
        - Semonte: 235 (6.7%)

    [8] DISTRIBUZIONE PAGAMENTI PER ANNO:
        - Anno 2018: 2266 pagamenti, Totale cassa: €22.660
        - Anno 2019: 2634 pagamenti, Totale cassa: €26.340
        - Anno 2020: 2605 pagamenti, Totale cassa: €26.050
        - Anno 2021: 2263 pagamenti, Totale cassa: €22.630
        - Anno 2022: 2610 pagamenti, Totale cassa: €26.100
        - Anno 2023: 2488 pagamenti, Totale cassa: €24.880
        - Anno 2024: 1591 pagamenti, Totale cassa: €15.910
        - Anno 2025: 351 pagamenti, Totale cassa: €3510
        - Anno 2026: 692 pagamenti, Totale cassa: €9170

    >>> TUTTI I VINCOLI DEL DATASET SINTETICO RISPETTATI AL 100%! <<<
    ```
- **Esecuzione Master Runner Riproduzioni (`node scripts/audit_repro/run_all_repros.js`):**
  - **Output verbatim:**
    ```
    ==========================================================================================
    CERAIOLO DIGITALE - SUITE ESECUTIVA DI RIPRODUZIONE BUG & TEST CASI LIMITE (M2)
    ==========================================================================================
    Numero di verifiche in esecuzione: 12

    [RUNNING] BUG-01       - Fix DB Invertito distruttivo... CONFIRMED (33ms)
    [RUNNING] BUG-02       - Mancato caricamento sql-wasm.wasm con base path... CONFIRMED (33ms)
    [RUNNING] BUG-03       - Tripla frattura logica su Aventi Diritto al Voto... CONFIRMED (32ms)
    [RUNNING] BUG-04       - Bug temporale nelle statistiche storiche (new Date())... CONFIRMED (33ms)
    [RUNNING] BUG-05       - Tabella Blocchetti: filtro "In Circolazione" include 990 storici... CONFIRMED (32ms)
    [RUNNING] BUG-06       - Collo di bottiglia O(N * M) in BlocchettiView (45M iterazioni)... CONFIRMED (82ms)
    [RUNNING] BUG-07       - Typo campo member.data_iscrizione vs data_prima_iscrizione... CONFIRMED (34ms)
    [RUNNING] BUG-08       - Calcolo cassa blocchetto multi-anno privo di filtro anno... CONFIRMED (32ms)
    [RUNNING] BUG-09       - Mancanza di transazioni atomiche in salvataggio multi-anno... CONFIRMED (31ms)
    [RUNNING] BUG-10       - Mancata pulizia tabella db.blocchetti nel Factory Reset... CONFIRMED (33ms)
    [RUNNING] BUG-11       - Discrepanza calcolo età (anno solare vs data esatta)... CONFIRMED (34ms)
    [RUNNING] CALC-CASES   - Verifica indipendente calcoli con 4 casi limite documentati... CONFIRMED (33ms)

    Totale esecuzioni: 12 | Convalidate: 12 | Fallite: 0
    TUTTE LE RIPRODUZIONI SONO STATE CONFERMATE ED ESEGUITE CON SUCCESSO AL 100%.
    ```
- **Esecuzione Suite di Benchmark Prestazionali (`npx vite-node scripts/benchmark_performance.js`):**
  - **Output verbatim:**
    ```
    ======================================================================
       BENCHMARK PRESTAZIONALI QUANTITATIVI — CERAIOLO DIGITALE
    ======================================================================
    OS: Windows_NT 10.0.26200 (x64)
    CPU: 13th Gen Intel(R) Core(TM) i7-13700K (24 core)
    Node.js: v22.18.0

    [BENCHMARK 1] Parsing e Importazione SQLite...
      -> Tempo Totale Importazione: 93.87 ms (Throughput: 223.715 record/sec)
    [BENCHMARK 2] Ricerca in Home su 3.500 soci...
      -> Scenario [Cognome_Frequente_Fiorucci]: media 0.471 ms (P95: 0.836 ms, risultati: 319)
      -> Scenario [Composto_Minelli_Maggiorenni_SantAgostino]: media 1.594 ms (P95: 1.924 ms, risultati: 33)
    [BENCHMARK 3] Apertura Scheda Socio (Targeted vs Bulk N+1)...
      -> Targeted Single Lookup (1 socio): media 0.001 ms (P95: 0.002 ms)
      -> Bulk N+1 getAllSociWithTesseramenti (3.500 soci): 0.83 ms
    [BENCHMARK 4] Pagina Blocchetti: Analisi Collo di Bottiglia O(N*M)...
      -> Algoritmo Lineare Attuale: 25.43 ms
      -> Algoritmo Ottimizzato Hash Map: 3.32 ms
      -> Guadagno Prestazionale (Speedup): 7.7x più veloce!
    [BENCHMARK 5] Generazione PDF Reali...
      -> Tessere 6x (100 soci): 55.79 ms (21.221 bytes)
      -> Elenco Alfabetico Completo (3.500 soci): 210.83 ms (3.742.848 bytes)
      -> Resoconto Cassa Blocchetti: 48.08 ms (373.162 bytes)

    ✅ BENCHMARK COMPLETATI CON SUCCESSO!
       Risultati esportati in: scripts/benchmark_results.json
    ```
- **Evidenza:** Nessun output simulato o hardcodato. Gli script eseguono query reali su WebAssembly SQLite, parsing reale, calcoli statistici reali ed effettiva generazione binaria dei documenti PDF con pdf-lib e jsPDF.

---

### 1.3 Controllo 3: Integrità della Test Suite e della Build di Produzione
- **Esecuzione Test Suite (`npm run test -- --run`):**
  - **Output verbatim:**
    ```
     Test Files  20 passed (20)
          Tests  284 passed (284)
       Start at  16:43:24
       Duration  7.15s
    ```
- **Esecuzione Build di Produzione (`npm run build`):**
  - **Output verbatim:**
    ```
    vite v7.1.9 building for production...
    transforming...
    ✓ 574 modules transformed.
    rendering chunks...
    [vite-plugin-static-copy] Copied 1 items.
    dist/index.html                                  0.48 kB │ gzip:   0.30 kB
    dist/assets/logo_santantoniari-DilSWtXO.jpg     64.14 kB
    dist/assets/BlocchettiView-CvjxnVDe.css          7.82 kB │ gzip:   1.77 kB
    dist/assets/index-CiMSn6o_.css                 128.58 kB │ gzip:  18.53 kB
    dist/assets/BlocchettiView-B7UoWID_.js          11.38 kB │ gzip:   4.05 kB
    dist/assets/purify.es-aGzT-_H7.js               22.15 kB │ gzip:   8.67 kB
    dist/assets/index.es-DIgpV7xn.js               159.33 kB │ gzip:  53.38 kB
    dist/assets/html2canvas.esm-B0tyYwQk.js        202.36 kB │ gzip:  48.04 kB
    dist/assets/index-YAxa5tCs.js                1,909.87 kB │ gzip: 665.08 kB
    ✓ built in 5.20s
    ```
  - **Verifica directory `dist/`:** Contiene `index.html`, `favicon.ico`, cartella `assets/` e il file `sql-wasm.wasm` (659.806 byte) copiato regolarmente da static-copy.

---

### 1.4 Controllo 4: Preservazione Temi, Assenza Emoji e Deliverables
- **Scansione Emoji (`node scan_emojis.mjs` su `src/`):**
  - Regex utilizzata: `(\p{Extended_Pictographic}|\p{Emoji_Presentation})/gu`
  - Risultato: `Total emojis found in src (non-test files): 0`.
- **Scansione Caratteri Speciali Grezzi (`node scan_special_chars.mjs` su `src/`):**
  - Ricerca `✕`, `✓`, `✗`: `Total special characters found: 0`.
- **Preservazione Temi (Chiaro e Scuro):**
  - Selettore del tema posizionato in `src/views/SettingsView.vue:56-120` (radiogroup accessibile con preview card per Tema Chiaro e Tema Scuro).
  - Rimozione totale del toggle tema dalla barra di navigazione principale (`src/App.vue:63-84`).
- **Verifica Deliverable Richiesti:**
  - `README_AUDIT.md`: 123 righe, punto di ingresso unificato con guida comandi e matrice esecutiva.
  - `AUDIT_REPORT_CERAIOLO_DIGITALE.md`: 565 righe, interamente in italiano, copre analiticamente tutte le 7 aree richieste (a-g) e documenta l'esito esplicito per tutti i 6 interventi recenti.
  - `PIANO_DI_AZIONE_E_SVILUPPO.md`: 494 righe, interamente in italiano, organizzato in 5 fasi progressive (P0-P3), schede dettagliate con priorità/sforzo/rischio/aree codice/criteri verifica, con sezioni dedicate vincolanti "Cosa è meglio NON toccare" e "Domande aperte per la revisione con l'altro sviluppatore".

---

## 2. Logic Chain (Catena Logica di Valutazione)

1. **Premessa di Invarianza Sorgente:** Il vincolo fondamentale di `ORIGINAL_REQUEST.md` e delle direttive di dispatch vieta qualsiasi modifica o refactoring del codice dell'applicazione in `src/`.
   - *Dato osservato (1.1):* `git diff f0ec064 -- src` e `git status --porcelain src` restituiscono stringhe completamente vuote.
   - *Deduzione 1:* L'integrità del codice applicativo esistente è rigorosamente preservata (zero modifiche, zero violazioni).

2. **Premessa di Autenticità ed Evidenze Empiriche:** I pattern proibiti di integrità vietano risultati hardcodati, stub fittizi, database fake o verifiche autocertificate non eseguibili.
   - *Dati osservati (1.2):* `tests/fixtures/synthetic_ceraiolo_audit.sqlite` è un vero database SQLite binario di 2,36 MB con 3.500 soci, 17.500 pagamenti e tutti i 5 corner case statutari; gli script in `scripts/audit_repro/` eseguono asserzioni Node.js reali confermando 12/12 bug; i benchmark in `scripts/benchmark_performance.js` misurano millisecondi e generano file PDF reali (oltre 3,7 MB di output documentale effettivo).
   - *Deduzione 2:* Tutte le metriche e le riproduzioni sono genuine, deterministiche e verificabili in modo indipendente.

3. **Premessa di Stabilità di Build e Regressioni:** L'applicazione deve mantenere operatività e compilazione intatte.
   - *Dati osservati (1.3):* Tutti i 284 test storici passano senza alcun errore; il comando `npm run build` completa in 5,20s senza errori di compilazione producendo bundle integri in `dist/`.
   - *Deduzione 3:* Nessuna regressione tecnica o di packaging introdotta.

4. **Premessa sui Vincoli di Stile e Deliverable:** L'interfaccia deve rimanere priva di emoji, con entrambi i temi attivi, e i documenti finali devono rispettare la lingua italiana e la struttura stabilita.
   - *Dati osservati (1.4):* 0 emoji e caratteri speciali grezzi in `src/`; dark mode e light mode gestite in Impostazioni; deliverable `README_AUDIT.md`, `AUDIT_REPORT_CERAIOLO_DIGITALE.md` e `PIANO_DI_AZIONE_E_SVILUPPO.md` completi e rigorosamente in italiano.
   - *Deduzione 4:* Tutti i vincoli stilistici e documentali sono pienamente soddisfatti.

5. **Sintesi:** Tutti i controlli forensi hanno restituito esito positivo senza alcuna anomalia o violazione di integrità.

---

## 3. Caveats

- **No caveats.** Tutti i controlli prescritti sono stati eseguiti ed analizzati su evidenze empiriche riproducibili.

---

## 4. Conclusion (Verdetto Finale)

### **VERDETTO: CLEAN**

Il lavoro svolto rispetta integralmente tutti gli hard constraints, non ha apportato alcuna alterazione abusiva al codice sorgente dell'applicazione (`src/`), ha prodotto benchmark e riproduzioni deterministiche autentiche, ha mantenuto verdi al 100% i 284 test della suite e ha consegnato una documentazione esaustiva e fedele alle decisioni della Famiglia dei Santantoniari.

---

## 5. Verification Method (Metodo di Verifica Indipendente)

Per riprodurre in autonomia e convalidare l'esito di questo audit forense, eseguire la seguente sequenza di comandi:

```powershell
# 1. Verifica assenza modifiche in src/
git diff f0ec064 -- src
git status --porcelain src

# 2. Verifica del database sintetico SQLite
node scripts/verify_synthetic_db.js

# 3. Esecuzione del runner di riproduzione bug
node scripts/audit_repro/run_all_repros.js

# 4. Esecuzione dei benchmark quantitativi
npx vite-node scripts/benchmark_performance.js

# 5. Esecuzione test suite Vitest
npm run test -- --run

# 6. Compilazione build di produzione
npm run build
```

**Condizioni di invalidazione:**
- Qualsiasi riga modificata in `src/` rispetto a `f0ec064`.
- Fallimento di anche uno solo dei 284 test di Vitest o della build di produzione.
- Presenza di emoji in `src/` o rimozione del selettore del tema da `SettingsView.vue`.
