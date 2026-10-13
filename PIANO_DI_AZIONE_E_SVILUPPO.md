# PIANO DI AZIONE E SVILUPPO: "CERAIOLO DIGITALE"
**Roadmap Esecutiva e Guida Implementativa per la Famiglia dei Santantoniari (Gubbio)**

- **Data del Documento:** 4 Ottobre 2026
- **Ambiente & Riferimento Git:** Branch `development`, commit base `f0ec064`
- **Autori:** Team di Audit e Qualità Software (teamwork_preview_worker)
- **Destinatari:** Responsabile di Progetto, Lead Developer, Revisori Tecnici
- **Stato:** Documento Esecutivo di Pianificazione

---

## INDICE DEI CONTENUTI

1. [Obiettivi Strategici e Principi Guida](#1-obiettivi-strategici-e-principi-guida)
2. [Fase 1: Bloccanti, Integrità Dati e Sicurezza (Priorità P0)](#2-fase-1-bloccanti-integrità-dati-e-sicurezza-priorità-p0)
3. [Fase 2: Allineamento Statutario, Elettorale e Contabile (Priorità P1)](#3-fase-2-allineamento-statutario-elettorale-e-contabile-priorità-p1)
4. [Fase 3: Performance ed Ergonomia Senior WCAG 2.2 (Priorità P2)](#4-fase-3-performance-ed-ergonomia-senior-wcag-22-priorità-p2)
5. [Fase 4: Manutenzione Codice, Pulizia e Suite di Test (Priorità P2)](#5-fase-4-manutenzione-codice-pulizia-e-suite-di-test-priorità-p2)
6. [Fase 5: Nuove Funzionalità ad Alto Valore per la Famiglia (Priorità P3)](#6-fase-5-nuove-funzionalità-ad-alto-valore-per-la-famiglia-priorità-p3)
7. [Cosa è Meglio NON Toccare (Vincoli Architetturali Intoccabili)](#7-cosa-è-meglio-non-toccare-vincoli-architetturali-intoccabili)
8. [Domande Aperte per la Revisione con l'Altro Sviluppatore](#8-domande-aperte-per-la-revisione-con-laltro-sviluppatore)
9. [Matrice di Priorità, Sforzo e Rischio Globale](#9-matrice-di-priorità-sforzo-e-rischio-globale)

---

## 1. OBIETTIVI STRATEGICI E PRINCIPI GUIDA

Il presente piano d'azione definisce la sequenza ordinata, metodica e sicura con cui affrontare tutti i risultati emersi dall'audit tecnico (`AUDIT_REPORT_CERAIOLO_DIGITALE.md`).
La roadmap è strutturata su **5 Fasi Progressive**, concepite per garantire che ogni rilascio mantenga la stabilità del sistema, non corrompa i dati pregressi dei soci di Gubbio e rispetti i vincoli fondanti del progetto:
- **Nessuna Riscrittura (No Rewrite):** Evoluzione incrementale dell'architettura esistente Vue 3, Pinia, Dexie e sql.js.
- **Invarianza dei Dati:** Conservazione degli schemi e della retrocompatibilità con i file SQLite storici.
- **Approccio Risk-First:** Eliminazione immediata dei rischi di corruzione e dei blocchi in produzione (Fase 1), prima di procedere con l'armonizzazione logica (Fase 2), l'ottimizzazione (Fase 3), il refactoring (Fase 4) e le nuove funzionalità (Fase 5).

---

## 2. FASE 1: BLOCCANTI, INTEGRITÀ DATI E SICUREZZA (Priorità P0)

*Obiettivo della Fase:* Neutralizzare qualsiasi rischio di perdita o corruzione irreversibile dei dati associativi e ripristinare il corretto funzionamento dell'applicazione in ambiente di produzione reale.

---

### Scheda Intervento 1.1: Rimozione Immediata del Pulsante ed Euristica "Fix DB Invertito"
- **ID Finding Collegato:** `BUG-01`
- **Priorità:** **P0 (Bloccante / Critico)**
- **Stima Sforzo:** **S (Piccolo, ~1-2 ore)**
- **Livello di Rischio:** **Basso** (rimozione di codice tossico non referenziato da altre parti)
- **File e Aree Coinvolte:**
  - `src/views/HomeView.vue`: righe 160–165 (rimozione del pulsante nel footer e del relativo metodo handler).
  - `src/services/db.js`: righe 2492–2558 (rimozione o deprecazione della funzione distruttiva `normalizeDatabaseData`).
- **Piano di Intervento:**
  1. Rimuovere dal template di `HomeView.vue` il pulsante di normalizzazione forzata.
  2. Eliminare la logica che scambia `numero_blocchetto` e `numero_ricevuta` basata sul controllo `bNum > rNum` e che cancella fisicamente i record da `db.blocchetti`.
  3. Mantenere eventualmente una funzione di sola diagnostica (read-only) che segnali all'amministratore pagamenti con valori anomali senza effettuare scritture o cancellazioni automatiche.
- **Criterio di Accettazione e Verifica:**
  - `HomeView.vue` non espone più alcun pulsante "Fix DB Invertito".
  - L'esecuzione di `scripts/audit_repro/repro_bug_01_fix_db_invertito.js` rileva che la funzione distruttiva non è più attiva nel percorso applicativo.
  - Inserendo un pagamento con blocchetto 25 e ricevuta 4, i valori rimangono invariati e il blocchetto non viene rimosso da `db.blocchetti`.

---

### Scheda Intervento 1.2: Correzione del Percorso WebAssembly (`locateFile`) per Deploy su Subpath
- **ID Finding Collegato:** `BUG-02` / `WASM-01`
- **Priorità:** **P0 (Bloccante / Critico)**
- **Stima Sforzo:** **S (Piccolo, ~1 ora)**
- **Livello di Rischio:** **Basso** (allineamento a standard già funzionante in altre parti dell'app)
- **File e Aree Coinvolte:**
  - `src/services/db.js`: riga 2302 (`importDatabaseFromSqlite`) e riga 1042 (`exportSingleSocioToSqlite`).
- **Piano di Intervento:**
  1. Individuare tutte le istanze di `initSqlJs({ locateFile: ... })` nel file `src/services/db.js`.
  2. Sostituire la stringa hardcodata `locateFile: (file) => \`/${file}\`` con la sintassi corretta già adottata in `ImportView.vue:75` e `db.js:703`:
     ```javascript
     locateFile: (file) => new URL(import.meta.env.BASE_URL + file, window.location.href).href
     ```
  3. Verificare che Vite continui a copiare `sql-wasm.wasm` nella directory `dist/` tramite `vite-plugin-static-copy`.
- **Criterio di Accettazione e Verifica:**
  - Eseguire `npm run build`. Servire la cartella `dist/` sotto prefisso `/ceraiolo-digitale/`.
  - Da Impostazioni, eseguire con successo il ripristino del database da file `.sqlite`. Nessuna richiesta HTTP 404 registrata nei DevTools per `sql-wasm.wasm`.
  - L'esecuzione di `scripts/audit_repro/repro_bug_02_wasm_base_path.js` passa con successo.

---

### Scheda Intervento 1.3: Transazionalità Atomica nei Pagamenti Multi-Anno e Cancellazioni
- **ID Finding Collegato:** `BUG-09`, `BUG-DATA-07`
- **Priorità:** **P0 / P1 (Alto)**
- **Stima Sforzo:** **M (Medio, ~3-4 ore)**
- **Livello di Rischio:** **Medio** (coinvolge il flusso principale di scrittura)
- **File e Aree Coinvolte:**
  - `src/views/BatchEntryView.vue`: righe 1250–1262 (`handleBatchSubmit`).
  - `src/services/db.js`: `addTesseramentiBatch` (nuova funzione helper) e `deleteSocio` (righe 546–550).
- **Piano di Intervento:**
  1. Introdurre in `src/services/db.js` un metodo di scrittura in blocco atomico:
     ```javascript
     export async function addTesseramentiBatch(tesseramentiList) {
       return await db.transaction('rw', db.tesseramenti, db.local_changes, async () => {
         for (const item of tesseramentiList) {
           await addTesseramento(item)
         }
       })
     }
     ```
  2. Aggiornare `BatchEntryView.vue` per preparare l'array di tutti i pagamenti dell'operazione e invocarli all'interno dell'unica transazione. Se un anno fallisce, l'intero blocco viene annullato senza rilasciare record orfani.
  3. Incapsulare la cancellazione del socio e dei relativi tesseramenti in `deleteSocio` all'interno di una transazione Dexie atomica `db.transaction('rw', db.soci, db.tesseramenti, db.local_changes, ...)`.
- **Criterio di Accettazione e Verifica:**
  - Registrando 3 anni di quota, un'eccezione simulata sul terzo anno effettua il rollback automatico dei primi due anni.
  - L'esecuzione di `scripts/audit_repro/repro_bug_09_atomic_transactions.js` dimostra la consistenza transazionale.

---

### Scheda Intervento 1.4: Inclusione di `db.blocchetti` nel Factory Reset e nel Ripristino Backup
- **ID Finding Collegato:** `BUG-10`
- **Priorità:** **P1 (Alto)**
- **Stima Sforzo:** **S (Piccolo, ~1-2 ore)**
- **Livello di Rischio:** **Basso**
- **File e Aree Coinvolte:**
  - `src/services/db.js`: righe 2449–2461 (`wipeDatabase`) e righe 2328–2432 (`importDatabaseFromSqlite`).
- **Piano di Intervento:**
  1. Aggiungere `db.blocchetti` alle tabelle svuotate da `wipeDatabase`:
     ```javascript
     await db.transaction('rw', [db.soci, db.tesseramenti, db.local_changes, db.settings, db.blocchetti], async () => {
       await db.soci.clear()
       await db.tesseramenti.clear()
       await db.blocchetti.clear()
       // ...
     })
     ```
  2. In `importDatabaseFromSqlite`, aggiungere la decodifica della tabella `Blocchetti` dal file SQLite (qualora presente) e la corretta popolazione di `db.blocchetti`.
- **Criterio di Accettazione e Verifica:**
  - Creare un blocchetto anagrafico in `/blocchetti`, eseguire "Ripristino di fabbrica" da Impostazioni.
  - Verificare che la tabella dei blocchetti in IndexedDB risulti completamente azzerata (0 record).
  - L'esecuzione di `scripts/audit_repro/repro_bug_10_wipe_blocchetti.js` passa con successo.

---

## 3. FASE 2: ALLINEAMENTO STATUTARIO, ELETTORALE E CONTABILE (Priorità P1)

*Obiettivo della Fase:* Garantire che tutte le regole di calcolo delle quote, gli elenchi dei votanti alle assemblee generali e i totali di cassa riflettano in modo deterministico e univoco lo Statuto della Famiglia dei Santantoniari.

---

### Scheda Intervento 2.1: Unificazione del Calcolo degli Aventi Diritto al Voto Statutario
- **ID Finding Collegato:** `BUG-03`, `CALC-01`
- **Priorità:** **P1 (Alto / Istituzionale)**
- **Stima Sforzo:** **M (Medio, ~4-5 ore)**
- **Livello di Rischio:** **Medio** (impatto sulle liste elettorali della Famiglia)
- **File e Aree Coinvolte:**
  - `src/services/db.js`: righe 1681–1711 (`getVotingEligibleMembers`).
  - `src/views/ReportsView.vue`: righe 2330–2385 (`processedData`), riga 454 e riga 1661.
- **Piano di Intervento:**
  1. Concordare la regola statutaria ufficiale definitiva (vedi Sezione 8: Domanda Aperta 1).
  2. Spostare l'intera logica di qualificazione dell'elettore da `ReportsView.vue` a un'unica funzione di business logic condivisa in `src/services/db.js` (o in `src/utils/voting.js`).
  3. La funzione deve accettare `(targetYear, electionDate = null)`:
     - Calcolo maggiore età: confronto preciso della data di nascita rispetto alla data assembleare (se fornita) o al giorno della Festa dei Ceri (15 maggio dell'anno $T$).
     - Finestra contributiva: verifica rigorosa degli ultimi 5 anni ($T-4 \dots T$) secondo la deliberazione statutaria.
     - Restituzione di un oggetto unificato con stati chiari: `{ eligible: boolean, status: 'ok' | 'regolarizza' | 'escluso', reason: string }`.
  4. Far convergere sia il Quick Button 1-clic (`generateVotingList`) sia la Live Preview del PDF Lab sulla medesima funzione condivisa.
- **Criterio di Accettazione e Verifica:**
  - La stampa da pulsante rapido e la generazione da PDF Lab producono esattamente lo stesso numero di elettori e gli stessi nominativi.
  - Nessun ceraiolo minorenne alla data dell'elezione viene incluso come avente diritto.
  - L'esecuzione di `scripts/audit_repro/repro_bug_03_voting_fracture.js` conferma l'assenza di fratture.

---

### Scheda Intervento 2.2: Correzione del Bug Temporale nelle Statistiche Storiche (`new Date()`)
- **ID Finding Collegato:** `BUG-04`, `CALC-02`
- **Priorità:** **P1 (Alto)**
- **Stima Sforzo:** **S (Piccolo, ~2 ore)**
- **Livello di Rischio:** **Basso**
- **File e Aree Coinvolte:**
  - `src/services/db.js`: righe 1398–1405 (`getNewMembersByYear`) e righe 1534–1541 (`getMembersByGroup`).
- **Piano di Intervento:**
  1. Nelle funzioni di estrazione statistica per anno storico `targetYear`, rimuovere l'istruzione `const today = new Date()`.
  2. Sostituirla con la data di riferimento di chiusura dell'anno storico esaminato:
     ```javascript
     const referenceDate = new Date(targetYear, 11, 31) // 31 Dicembre dell'anno target
     ```
  3. Calcolare la maggiore o minore età rispetto a `referenceDate`, garantendo che l'età del socio sia congelata al momento storico di riferimento.
- **Criterio di Accettazione e Verifica:**
  - Richiedendo i nuovi iscritti minorenni del 2018, un socio nato nel 2004 (14enne nel 2018) viene correttamente conteggiato tra i minorenni, indipendentemente dalla data odierna del sistema.
  - L'esecuzione di `scripts/audit_repro/repro_bug_04_temporal_stats.js` passa con successo.

---

### Scheda Intervento 2.3: Risoluzione del Typo `data_iscrizione` in `ReportsView.vue`
- **ID Finding Collegato:** `BUG-07`, `CALC-03`
- **Priorità:** **P1 (Alto)**
- **Stima Sforzo:** **S (Piccolo, ~30 minuti)**
- **Livello di Rischio:** **Basso**
- **File e Aree Coinvolte:**
  - `src/views/ReportsView.vue`: riga 2095.
- **Piano di Intervento:**
  1. Correggere la funzione `getEnrollmentYear`:
     ```javascript
     const getEnrollmentYear = (member) => {
       const enrollmentRaw = member.data_prima_iscrizione || member.data_iscrizione
       if (enrollmentRaw) {
         return typeof enrollmentRaw === 'number' ? enrollmentRaw : new Date(enrollmentRaw).getFullYear()
       }
       const paidYears = member.tesseramenti?.map((t) => t.anno) || []
       if (paidYears.length > 0) return Math.min(...paidYears)
       return new Date().getFullYear()
     }
     ```
- **Criterio di Accettazione e Verifica:**
  - Un socio storico iscritto nel 2010 privo di pagamenti recenti mantiene l'anzianità 2010 e non viene retrocesso all'anno corrente 2026.
  - L'esecuzione di `scripts/audit_repro/repro_bug_07_typo_iscrizione.js` passa con successo.

---

### Scheda Intervento 2.4: Filtro Annuale per la Cassa del Blocchetto e Bonifica Filtro Circolazione
- **ID Finding Collegato:** `BUG-05`, `BUG-08`, `CALC-04`
- **Priorità:** **P1 (Alto)**
- **Stima Sforzo:** **M (Medio, ~3 ore)**
- **Livello di Rischio:** **Basso**
- **File e Aree Coinvolte:**
  - `src/views/BatchEntryView.vue`: righe 867–875 (`loadBookletCashTotal`).
  - `src/views/BlocchettiView.vue`: righe 45–70, righe 136–143 e riga 163.
- **Piano di Intervento:**
  1. In `BatchEntryView.vue`, limitare il calcolo della cassa del blocchetto all'anno corrente di compilazione:
     ```javascript
     const currentYear = sessionData.anno || new Date().getFullYear()
     const payments = await db.tesseramenti
       .where('numero_blocchetto').equals(bNum)
       .filter(p => Number(p.anno) === Number(currentYear))
       .toArray()
     ```
  2. In `BlocchettiView.vue`, correggere il filtro "In Circolazione" (`activeFilter === 'attivi'`) e il contatore `totalAttivi`:
     - Considerare in circolazione i soli blocchetti registrati fisicamente per l'anno in corso privi di restituzione:
       ```javascript
       const isAttivo = (b) => b.isReal && !b.data_restituzione
       ```
     - Per i blocchetti derivati dallo storico (`isReal === false`), impostare lo stato predefinito su "Archiviato / Storico", evitando che gonfino il totale dei libretti attivi.
- **Criterio di Accettazione e Verifica:**
  - Il totale di cassa del blocchetto 1 in `BatchEntryView` somma solo i pagamenti dell'anno in corso (20€ anziché 220€).
  - Il filtro "In Circolazione" in `BlocchettiView` mostra solo i blocchetti materialmente attivi nell'anno corrente.
  - L'esecuzione di `repro_bug_05_blocchetti_circolazione.js` e `repro_bug_08_cassa_multi_anno.js` passa con successo.

---

## 4. FASE 3: PERFORMANCE ED ERGONOMIA SENIOR WCAG 2.2 (Priorità P2)

*Obiettivo della Fase:* Eliminare i colli di bottiglia computazionali sul thread UI e portare l'interfaccia a una perfetta conformità di contrasto e tocco per gli utenti anziani della Famiglia.

---

### Scheda Intervento 3.1: Ottimizzazione $O(1)$ con Hash Map in `BlocchettiView.vue`
- **ID Finding Collegato:** `BUG-06`, `UI-08`
- **Priorità:** **P2 (Medio/Alto)**
- **Stima Sforzo:** **S (Piccolo, ~1-2 ore)**
- **Livello di Rischio:** **Basso**
- **File e Aree Coinvolte:**
  - `src/views/BlocchettiView.vue`: righe 42–85 (`blocchettiDinamici`).
- **Piano di Intervento:**
  1. Nella computed `blocchettiDinamici`, prima di scorrere `allPayments`, indicizzare preventivamente l'elenco dei soci in una `Map` con lookup immediato $O(1)$:
     ```javascript
     const sociMap = new Map(allSoci.value.map(s => [s.id, s]))
     ```
  2. All'interno del ciclo sui pagamenti, sostituire la scansione lineare `allSoci.value.find(s => s.id === p.id_socio)` con:
     ```javascript
     const socio = sociMap.get(p.id_socio)
     ```
- **Criterio di Accettazione e Verifica:**
  - Riduzione delle iterazioni da oltre 22,5 milioni a 21.000 (riduzione del 99,9%).
  - Tempo di calcolo su archivio reale abbattuto da 24,6 ms a 3,2 ms su desktop e da >1 secondo a <50 ms su tablet.
  - L'esecuzione di `scripts/audit_repro/repro_bug_06_bottleneck_onm.js` passa con successo.

---

### Scheda Intervento 3.2: Bonifica Cromatica Contrasti WCAG 2.2 (Oro, Rosso Dark e Grafici)
- **ID Finding Collegato:** `UI-01`, `UI-02`, `UI-03`
- **Priorità:** **P2 (Medio)**
- **Stima Sforzo:** **S (Piccolo, ~2 ore)**
- **Livello di Rischio:** **Basso** (ritocco CSS palette)
- **File e Aree Coinvolte:**
  - `src/assets/main.css`: riga 11 (`--color-accent-gold`), variabili tema.
  - `src/App.vue`: riga 242 (link attivi navbar).
  - `src/components/DashboardCharts.vue`: righe 363, 368 (opzioni Chart.js).
- **Piano di Intervento:**
  1. **Oro in Tema Chiaro (`UI-01`):** Adottare un tono di oro più profondo per testi e icone su sfondo bianco: `#947112` (contrasto **4.61:1**, conforme WCAG 2.2 AA), riservando `#c59b27` unicamente a campiture decorative con bordo di stacco.
  2. **Rosso Accent Dark Mode (`UI-03`):** Per i pulsanti attivi della navbar e call-to-action con sfondo `--color-accent` (`#ef5350`), impostare il colore del testo a inchiostro scuro `#121212` (contrasto **5.37:1**, conforme AA) anziché bianco `#ffffff` (3.49:1).
  3. **Canvas Grafico in Dark Mode (`UI-02`):** Rendere le opzioni di `Chart.js` in `DashboardCharts.vue` computate reattivamente rispetto al tema Pinia:
     - Titolo asse Y: `#b71c1c` in chiaro, `#ef5350` in scuro (contrasto $\ge 4.78:1$).
     - Ticks assi X e Y: `#5c6266` in chiaro, `#a0a0a0` in scuro (contrasto $\ge 6.38:1$).
     - Linee griglia: `rgba(255, 255, 255, 0.08)` in tema scuro.
- **Criterio di Accettazione e Verifica:**
  - Ricalcolo dei contrasti con esito PASS ($\ge 4.5:1$) su tutte le combinazioni testo/sfondo.
  - Il grafico della dashboard in tema scuro presenta assi e titoli nitidi e perfettamente leggibili.

---

### Scheda Intervento 3.3: Ingrandimento dei Touch Targets Senior ($\ge 44 \times 44\text{ px}$)
- **ID Finding Collegato:** `UI-04`, `UI-05`, `A11Y-01`
- **Priorità:** **P2 (Medio)**
- **Stima Sforzo:** **S (Piccolo, ~2 ore)**
- **Livello di Rischio:** **Basso**
- **File e Aree Coinvolte:**
  - `src/views/SocioDetailView.vue`: righe 1315, 1334.
  - `src/views/ReportsView.vue`: righe 3222, 3309.
  - `src/views/BatchEntryView.vue`: `.clear-search-btn`.
- **Piano di Intervento:**
  1. In `SocioDetailView.vue`, portare `.edit-btn-small`, `.save-quota-btn`, `.cancel-quota-btn` e `.delete-btn` a una dimensione minima di `min-width: 44px; min-height: 44px;` con padding interno centrato e icone scalate a 20px.
  2. In `ReportsView.vue`, estendere l'area di tocco per `.chip-dismiss-btn` e `.preset-delete-btn` tramite pseudo-elementi `::before` o padding invisibile per garantire un'area cliccabile di 44px, mantenendo l'icona grafica elegante e proporzionata.
  3. In `SocioDetailView.vue:1070`, correggere la classe `.tabular-num` in `.tabular-nums` per allineare correttamente a destra gli importi.
- **Criterio di Accettazione e Verifica:**
  - Nessun elemento interattivo presenta bounding box inferiore a 44x44px.
  - Test ergonomico su touchscreen senza selezioni errate.

---

## 5. FASE 4: MANUTENZIONE CODICE, PULIZIA E SUITE DI TEST (Priorità P2)

*Obiettivo della Fase:* Eliminare il debito tecnico accumulato nelle precedenti milestone, ripulire i file orfani e irrobustire la suite di test automatizzati con un motore IndexedDB reale.

---

### Scheda Intervento 4.1: Rimozione Definitiva di `ReportsBetaView.vue` ed `exportBeta.js`
- **ID Finding Collegato:** `DEAD-01`, `DEAD-02`, `UI-06`
- **Priorità:** **P2 (Medio)**
- **Stima Sforzo:** **S (Piccolo, ~1 ora)**
- **Livello di Rischio:** **Basso**
- **File e Aree Coinvolte:**
  - `src/views/ReportsBetaView.vue` (cancellazione del file da 47,8 KB e 1.398 righe).
  - `src/services/exportBeta.js` (cancellazione del file da 15 KB e 452 righe).
  - `src/router/index.js`: righe 63–66 (rimozione della rotta reindirizzata `/reports-beta`).
- **Piano di Intervento:**
  1. Verificare che nessun test dipenda da `ReportsBetaView.vue`.
  2. Rimuovere fisicamente i due file orfani dal repository.
  3. Rimuovere la route alias nel router.
- **Criterio di Accettazione e Verifica:**
  - Riduzione del bundle di produzione di oltre 60 KB.
  - `npm run build` ed `npm run test` passano con successo.

---

### Scheda Intervento 4.2: Integrazione di `fake-indexeddb` e Test per Viste e Modali Scoperte
- **ID Finding Collegato:** `TEST-01`
- **Priorità:** **P2 (Medio)**
- **Stima Sforzo:** **M (Medio, ~5-6 ore)**
- **Livello di Rischio:** **Basso**
- **File e Aree Coinvolte:**
  - `package.json` (aggiunta devDependency `fake-indexeddb`).
  - `vitest.config.js` / setup test.
  - Nuovi file in `src/__tests__/`: `dexie_real_integration.spec.js`, `modals_coverage.spec.js`.
- **Piano di Intervento:**
  1. Installare ed esportare `fake-indexeddb` nel setup globale di Vitest per consentire a Dexie di operare su uno storage in-memory conforme allo standard W3C.
  2. Creare un set di test di integrazione reali che verifichi:
     - Scrittura e lettura di `addSocio` e `addTesseramento`.
     - Rollback delle transazioni atomiche in caso di eccezione.
     - Operazioni di wipe e restore con tabella `db.blocchetti`.
  3. Introdurre test per i componenti precedentemente non coperti: `ConfirmDeleteModal.vue`, `AddPaymentModal.vue`, `ErrorModal.vue` e `BlocchettiView.vue`.
- **Criterio di Accettazione e Verifica:**
  - Tutti i test IndexedDB eseguono query reali senza mockare `@/services/db`.
  - Copertura dei test aumentata senza regressioni sui 284 test storici.

---

## 6. FASE 5: NUOVE FUNZIONALITÀ AD ALTO VALORE PER LA FAMIGLIA (Priorità P3)

*Obiettivo della Fase:* Introdurre nuove capacità operative per supportare l'organizzazione ceraiola della Famiglia dei Santantoniari sul campo, secondo un ordine di priorità concordato con il responsabile.

---

### Scheda Intervento 5.1: Registro Elettorale Digitale con Check-in al Seggio
- **Priorità:** **P3.1 (Alta priorità funzionale)**
- **Sforzo:** **M (Medio, ~1-2 giorni)**
- **Rischio:** **Medio**
- **Criterio di Verifica:** Ricerca istantanea socio al seggio, blocco doppio voto con timestamp, incasso quota arretrata al volo e registrazione della scheda consegnata.

### Scheda Intervento 5.2: Anagrafica Capimanicchia e Affidamento Libretti
- **Priorità:** **P3.2**
- **Sforzo:** **M (Medio, ~1-2 giorni)**
- **Rischio:** **Basso**
- **Criterio di Verifica:** Assegnazione pacchi blocchetti a ciascun referente di manicchia, monitoraggio matrici staccate e calcolo automatico del contante da versare.

### Scheda Intervento 5.3: Ricevuta e Tessera Digitale Condivisibile (WhatsApp / Web Share)
- **Priorità:** **P3.3**
- **Sforzo:** **S (Piccolo, ~4 ore)**
- **Rischio:** **Basso**
- **Criterio di Verifica:** Generazione immagine/PDF tessera da smartphone e apertura diretta del menu di condivisione nativa WhatsApp/Email con testo personalizzato.

### Scheda Intervento 5.4: Modulo di Chiusura e Quadratura Cassa di Fine Campagna
- **Priorità:** **P3.4**
- **Sforzo:** **M (Medio, ~1 giorno)**
- **Rischio:** **Basso**
- **Criterio di Verifica:** Quadratura automatica libretti resi/intatti, riconciliazione contanti e generazione verbale PDF per i Revisori dei Conti.

### Scheda Intervento 5.5: Albo Storico di Fedeltà Ceraiola (25 / 50 Anni)
- **Priorità:** **P3.5**
- **Sforzo:** **S (Piccolo, ~4-5 ore)**
- **Rischio:** **Basso**
- **Criterio di Verifica:** Calcolo fedeltà continuativa, filtro automatico soci veterani e generazione attestato d'onore stampabile.

### Scheda Intervento 5.6: Gestione dei Nuclei Familiari (Tesseramento di Famiglia)
- **Priorità:** **P3.6**
- **Sforzo:** **M (Medio, ~1 giorno)**
- **Rischio:** **Medio**
- **Criterio di Verifica:** Selezione cumulativa dei familiari e registrazione su singola ricevuta multi-socio con un solo passaggio contabile.

### Scheda Intervento 5.7: Interfaccia Utente per la Consultazione dell'Audit Log Locale
- **Priorità:** **P3.7**
- **Sforzo:** **S (Piccolo, ~4 ore)**
- **Rischio:** **Basso**
- **Criterio di Verifica:** Schermata protetta in Impostazioni per consultare la tabella `local_changes` con dettaglio delle variazioni contabili.

---

## 7. COSA È MEGLIO NON TOCCARE (Vincoli Architetturali Intoccabili)

Nelle discussioni con lo sviluppatore e nei futuri refactoring, è fondamentale dichiarare espressamente quali parti del software sono stabili, collaudate e **non devono essere modificate**:

1. **Architettura Offline-First (Dexie + IndexedDB + sql.js):**
   - *Motivazione:* L'architettura client-side che unisce Dexie.js (per la rapidità reattiva nel browser) e sql.js (per la compatibilità con il file SQLite standard) è il cuore del funzionamento offline dell'app. Non va introdotto alcun backend remoto, server Node.js o servizio cloud per la gestione quotidiana, preservando la totale indipendenza e privacy della Famiglia.
2. **Schema Strutturale delle Tabelle `Soci` e `Tesseramenti`:**
   - *Motivazione:* I campi chiave (`id`, `cognome`, `nome`, `gruppo_appartenenza`, `data_prima_iscrizione` per Soci; `id_tesseramento`, `id_socio`, `anno`, `quota_pagata`, `numero_ricevuta`, `numero_blocchetto` per Tesseramenti) rispecchiano fedelmente il database storico legacy. Modificare i nomi o i tipi di queste colonne comprometterebbe l'importazione dei file SQLite delle passate edizioni.
3. **Coesistenza dei Temi Chiaro e Scuro:**
   - *Motivazione:* La coesistenza dei due temi con selettore dedicato in `SettingsView.vue` (escluso dall'header principale per evitare clic accidentali) è una decisione architetturale consolidata. Non va unificato il tema né reintrodotto il toggle nella navbar.
4. **Sistema di Icone Vettoriali Senza Emoji:**
   - *Motivazione:* La sostituzione totale di tutte le emoji con `<BaseIcon>` è pienamente riuscita e allineata allo stile sobrio e istituzionale della Famiglia. È vietato reintrodurre caratteri emoji nei template.
5. **Motore di Impaginazione Tessere con `pdf-lib` (6x su A4):**
   - *Motivazione:* I calcoli millimetrici delle coordinate di taglio (13,33 mm x 33,75 mm) per il formato standard 6 tessere per foglio A4 sono stati verificati e calibrati per le fustelle tipografiche. La logica geometrica di `generateAllCardsPDF` non va alterata.
6. **Tabella Dati Speculare in `DashboardCharts.vue`:**
   - *Motivazione:* La tabella numerica speculare ad alto contrasto con font 17px posta sotto il grafico risolve brillantemente i problemi di accessibilità senior e lettura dei dati aggregati. Deve restare permanente e non condizionata al mouse hover.

---

## 8. DOMANDE APERTE PER LA REVISIONE CON L'ALTRO SVILUPPATORE

Prima di avviare l'implementazione del codice delle Fasi 1 e 2, il responsabile di progetto e i due sviluppatori devono prendere una decisione congiunta sui seguenti 4 punti aperti:

---

### Domanda Aperta 1: Definizione Formale e Univoca della Regola degli Aventi Diritto al Voto
- **Il Problema:** Come documentato in `BUG-03`, oggi coesistono 3 regole diverse (1 anno in `db.js`, 4 anni nel PDF Lab, 5 anni nel testo dello Statuto).
- **Opzioni per la Discussione:**
  - *Opzione A (Statutaria Rigorosa):* Avente diritto = maggiorenne alla data dell'elezione (giorno esatto) con **tutti e 5 gli ultimi anni pagati** ($T-4, T-3, T-2, T-1, T$).
  - *Opzione B (Statutaria Flessibile):* Avente diritto = maggiorenne con quota dell'anno precedente ($T-1$) pagata, ammettendo al voto chi regolarizza l'anno in corso ($T$) al seggio.
  - *Opzione C (Regola Parametrica):* Rendere la finestra temporale (1, 3 o 5 anni) e la modalità di calcolo dell'età (anno solare o giorno esatto) un parametro di configurazione salvato in `db.settings`, con valore predefinito a 5 anni statutari.
- **Raccomandazione del Team di Audit:** Adottare l'**Opzione C** (o l'Opzione A concordata con il Presidente della Famiglia), applicandola a entrambe le schermate.

---

### Domanda Aperta 2: Gestione del Ciclo di Vita dei Blocchetti Cartacei vs Digitali
- **Il Problema:** I blocchetti fisici vengono numerati annualmente da 1 a $N$, mentre il gestionale tende a considerare i blocchetti come entità storiche globali, causando sovrapposizioni di cassa (`BUG-08`) e contatori errati (`BUG-05`).
- **Opzioni per la Discussione:**
  - *Opzione A (Chiave Composta):* Modificare la logica applicativa considerando il blocchetto identificato univocamente dalla coppia `(numero_blocchetto, anno)`.
  - *Opzione B (Numerazione Sequenziale Assoluta):* Chiedere all'Economo di non riutilizzare i numeri di blocchetto ogni anno (es. anno 2025: blocchetti 1-150; anno 2026: blocchetti 151-300).
- **Raccomandazione del Team di Audit:** Adottare l'**Opzione A** a livello di software: il sistema deve sempre associare il blocchetto alla campagna d'interesse, azzerando la cassa per gli anni differenti senza costringere l'Economo a cambiare la prassi cartacea.

---

### Domanda Aperta 3: Convalida Ufficiale del Motto Latino e del Toponimo sulle Tessere
- **Il Problema:** Nel template video della tessera sono presenti il motto *«In Fide et Honore»* e il sottotitolo *"GUBBIO"*, assenti nel PDF e privi di riferimento nello statuto originale (`INT3-01`).
- **Punto di Decisione:**
  - Il Consiglio della Famiglia dei Santantoniari desidera adottare formalmente il motto *«In Fide et Honore»* su tutte le tessere ufficiali (includendolo anche nel generatore PDF)?
  - Oppure si preferisce mantenere unicamente la denominazione ufficiale *«FAMIGLIA DEI SANTANTONIARI - GUBBIO»* con l'anno di tesseramento?
- **Raccomandazione del Team di Audit:** Sottoporre una bozza cartacea al Presidente o al Segretario della Famiglia per approvazione formale prima del rilascio in stampa.

---

### Domanda Aperta 4: Tempistica e Modalità di Eliminazione del Codice Morto
- **Il Problema:** `ReportsBetaView.vue` (1.398 righe) ed `exportBeta.js` (452 righe) sono orfani.
- **Punto di Decisione:**
  - Rimuoverli immediatamente all'inizio della Fase 4 tramite `git rm`.
  - Oppure conservarli in un branch di archivio (`archive/reports-beta`) prima della cancellazione dal branch `development`.
- **Raccomandazione del Team di Audit:** Procedere con la rimozione pulita sul branch `development`; la cronologia Git conserva in modo permanente qualsiasi implementazione passata qualora fosse necessario consultarla.

---

## 9. MATRICE DI PRIORITÀ, SFORZO E RISCHIO GLOBALE

La seguente matrice riepiloga tutti gli interventi programmati nella roadmap:

| Fase | ID Intervento | Descrizione Sintetica | Priorità | Sforzo | Rischio | Dipendenze |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **F1** | INT-1.1 | Rimozione Fix DB Invertito ed euristica distruttiva | **P0** | **S** | Basso | Nessuna |
| **F1** | INT-1.2 | Correzione `locateFile` WASM con base path per restore | **P0** | **S** | Basso | Nessuna |
| **F1** | INT-1.3 | Transazionalità atomica Dexie per pagamenti multi-anno | **P0** | **M** | Medio | INT-1.1 |
| **F1** | INT-1.4 | Inclusione tabella `db.blocchetti` nel Factory Reset | **P1** | **S** | Basso | Nessuna |
| **F2** | INT-2.1 | Unificazione logica aventi diritto al voto statutario | **P1** | **M** | Medio | Domanda Aperta 1 |
| **F2** | INT-2.2 | Correzione bug temporale statistiche storiche (`new Date()`) | **P1** | **S** | Basso | Nessuna |
| **F2** | INT-2.3 | Correzione typo `member.data_iscrizione` in `ReportsView` | **P1** | **S** | Basso | Nessuna |
| **F2** | INT-2.4 | Filtro annuale cassa blocchetto e filtro in circolazione | **P1** | **M** | Basso | Domanda Aperta 2 |
| **F3** | INT-3.1 | Ottimizzazione $O(1)$ con Map in `BlocchettiView.vue` | **P2** | **S** | Basso | Nessuna |
| **F3** | INT-3.2 | Contrasti WCAG 2.2 Oro (#947112), Rosso Dark e Chart.js | **P2** | **S** | Basso | Nessuna |
| **F3** | INT-3.3 | Ingrandimento touch targets senior $\ge 44\text{ px}$ | **P2** | **S** | Basso | Nessuna |
| **F4** | INT-4.1 | Rimozione codice morto `ReportsBetaView` ed `exportBeta` | **P2** | **S** | Basso | Domanda Aperta 4 |
| **F4** | INT-4.2 | Integrazione `fake-indexeddb` e test unitari modali/viste | **P2** | **M** | Basso | F1, F2 |
| **F5** | INT-5.1 | Registro Elettorale Digitale con Check-in al Seggio | **P3** | **M** | Medio | INT-2.1 |
| **F5** | INT-5.2 | Anagrafica Capimanicchia e Affidamento Libretti | **P3** | **M** | Basso | INT-2.4 |
| **F5** | INT-5.3 | Ricevuta e Tessera Condivisibile (WhatsApp / Web Share) | **P3** | **S** | Basso | Domanda Aperta 3 |
| **F5** | INT-5.4 | Modulo Chiusura e Quadratura Cassa di Fine Campagna | **P3** | **M** | Basso | INT-2.4 |
| **F5** | INT-5.5 | Albo Storico di Fedeltà Ceraiola (25/50 Anni) | **P3** | **S** | Basso | INT-2.3 |
| **F5** | INT-5.6 | Gestione Nuclei Familiari (Tesseramento di Famiglia) | **P3** | **M** | Medio | INT-1.3 |
| **F5** | INT-5.7 | Interfaccia Utente per Audit Log Locale (`local_changes`) | **P3** | **S** | Basso | F1 |
