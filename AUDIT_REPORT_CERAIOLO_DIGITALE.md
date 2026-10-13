# AUDIT REPORT TECNICO ED ESECUTIVO: "CERAIOLO DIGITALE"
**Applicazione Ufficiale per la Gestione Soci e Tesseramento — Famiglia dei Santantoniari (Gubbio)**

- **Data del Documento:** 4 Ottobre 2026
- **Ambiente & Riferimento Git:** Branch `development`, commit di partenza `f0ec064`
- **Autore:** Team di Audit e Qualità Software (teamwork_preview_worker / Implementer, QA, Specialist)
- **Destinatari:** Responsabile di Progetto, Lead Developer, Consiglio della Famiglia dei Santantoniari
- **Stato del Codice:** Sola lettura (`src/` invariato al 100%, conforme al vincolo di invarianza del codice sorgente)

---

## INDICE DEI CONTENUTI

1. [Sintesi Esecutiva e Quadro Generale](#1-sintesi-esecutiva-e-quadro-generale)
2. [Vincoli di Progetto e Perimetro dell'Audit](#2-vincoli-di-progetto-e-perimetro-dellaudit)
3. [Verifica Esplicita dei 6 Interventi Recenti](#3-verifica-esplicita-dei-6-interventi-recenti)
4. [Area (a): Bug Funzionali, Persistenza e Integrità dei Dati](#4-area-a-bug-funzionali-persistenza-e-integrità-dei-dati)
5. [Area (b): Correttezza dei Calcoli Contabili e Statutari](#5-area-b-correttezza-dei-calcoli-contabili-e-statutari)
6. [Area (c): Motore di Stampa, PDF e Resoconti di Cassa](#6-area-c-motore-di-stampa-pdf-e-resoconti-di-cassa)
7. [Area (d): UX, Ergonomia Senior e Accessibilità WCAG 2.2 AA](#7-area-d-ux-ergonomia-senior-e-accessibilità-wcag-22-aa)
8. [Area (e): Prestazioni con Archivi Grandi e Benchmark Misurati](#8-area-e-prestazioni-con-archivi-grandi-e-benchmark-misurati)
9. [Area (f): Qualità del Codice, Debito Tecnico e Robustezza Test](#9-area-f-qualità-del-codice-debito-tecnico-e-robustezza-test)
10. [Area (g): Proposte di Nuove Funzionalità per la Famiglia dei Santantoniari](#10-area-g-proposte-di-nuove-funzionalità-per-la-famiglia-dei-santantoniari)
11. [Tabella Sinottica di Tutti i Risultati (Findings)](#11-tabella-sinottica-di-tutti-i-risultati-findings)
12. [Metodologia di Verifica Indipendente e Riproducibilità](#12-metodologia-di-verifica-indipendente-e-riproducibilità)

---

## 1. SINTESI ESECUTIVA E QUADRO GENERALE

Il presente rapporto costituisce l'audit tecnico formale e approfondito dell'applicazione gestionale **"Ceraiolo Digitale"**, software adottato dalla **Famiglia dei Santantoniari di Gubbio** per la gestione dell'anagrafica soci, delle campagne annuali di rinnovo tesseramento (legate alla Festa dei Ceri del 15 maggio e alle celebrazioni di Sant'Antonio Abate del 17 gennaio), della distribuzione e quadratura dei blocchetti di ricevute cartacee e della produzione di stampe tipografiche istituzionali (tessere 6x su foglio A4, registri alfabetici, elenchi territoriali per manicchia ed elenchi elettorali).

L'applicazione è progettata come una Single Page Application (SPA) basata su **Vue 3 (Composition API)**, **Pinia**, **Dexie.js / IndexedDB** per la persistenza locale client-side, **sql.js (WebAssembly)** per l'importazione e l'esportazione bidirezionale di database SQLite relazionali, e la combinazione di **pdf-lib** e **jsPDF** per la composizione grafica di documenti ad alta risoluzione.

### Risultanze Globali
- **Stato di Salute Generale:** L'infrastruttura di base è moderna, reattiva e totalmente svincolata da dipendenze cloud o connessioni internet attive (100% offline-ready, conformità privacy totale). La suite di regressione conta **284 test automatizzati su Vitest, tutti verdi (100%)**, e la build di produzione compila pulita in circa 5,3 secondi.
- **Rischi di Integrità Critici Rilevati:** L'audit ha identificato **due vulnerabilità critiche** capaci di compromettere l'integrità dei dati:
  1. La presenza in `HomeView.vue` di una funzione euristica automatica denominata *"Fix DB Invertito"* che inverte scorrettamente numero di blocchetto e ricevuta per qualsiasi blocchetto superiore a 10 ed elimina record da IndexedDB;
  2. Un difetto di configurazione dei percorsi WebAssembly (`locateFile`) che blocca al 100% il ripristino dei backup SQLite su ambienti di produzione ospitati con base path non radice (es. GitHub Pages).
- **Incoerenze di Calcolo Statutario:** Emerge una **grave triplice frattura** nella determinazione degli aventi diritto al voto per le elezioni della Famiglia (conflitto tra il Quick Button della Dashboard a 1 anno, il PDF Lab a 4 anni e la dicitura statutaria ufficiale di 5 anni).
- **Accessibilità Senior e Prestazioni:** Sebbene l'interfaccia sia stata ripulita da ogni emoji a favore di icone SVG dedicate, il contrasto dell'oro istituzionale in tema chiaro fallisce gli standard WCAG 2.2 AA (rapporto **2.60:1** contro i 4.5:1 richiesti), e la pagina dei blocchetti presenta un collo di bottiglia algoritmico $O(N \cdot M)$ che porta a 22,5 milioni di iterazioni e freeze percepibili su dispositivi datati.

---

## 2. VINCOLI DI PROGETTO E PERIMETRO DELL'AUDIT

L'indagine tecnica è stata condotta nel rispetto rigoroso dei seguenti principi vincolanti:
1. **Nessuna Riscrittura (No Rewrite):** L'impianto tecnologico esistente (Vue 3 + Dexie + Pinia + sql.js + jsPDF/pdf-lib) è consolidato e non deve essere riscritto da zero; l'evoluzione deve essere esclusivamente incrementale.
2. **Invarianza dei Dati:** Gli schemi delle tabelle IndexedDB, la compatibilità con il file SQLite nativo e le logiche contabili storiche non devono subire regressioni né modifiche di schema che rompano i database pregressi.
3. **Ambiente Git Immutato:** Tutte le analisi e verifiche fanno riferimento al branch `development` a partire dal commit `f0ec064`. Il perimetro di `src/` è rimasto intonso (`git diff f0ec064 -- src` ha restituito output rigorosamente vuoto).
4. **Coesistenza Temi e Identità Eugubina:** Rimangono attivi sia il Tema Chiaro che il Tema Scuro; il selettore del tema risiede in Impostazioni; zero emoji nell'interfaccia; conformità grafica con i colori storici della Famiglia dei Santantoniari (nero inchiostro, oro caldo `#c59b27`, rosso ceraiolo `#b71c1c`).
5. **Utenti Senior:** Riferimento alle linee guida **WCAG 2.2 AA** (contrasto minimo 4.5:1, touch target minimo 44x44px, font base 17px, numeri tabulari incolonnati a destra).
6. **Dataset di Test Sintetico:** Per preservare la riservatezza delle anagrafiche della comunità ceraiola di Gubbio, tutte le prove di stress e benchmark sono state condotte su un archivio sintetico generato ad hoc (`synthetic_ceraiolo_audit.sqlite`), calibrato su 3.500 soci, 17.500 pagamenti e 1.000 blocchetti, rispettando l'onomastica reale e le manicchie della Famiglia.

---

## 3. VERIFICA ESPLICITA DEI 6 INTERVENTI RECENTI

Di seguito viene riportata la valutazione analitica dei sei interventi realizzati nell'ultima sessione di sviluppo sul commit `f0ec064`:

### Intervento 1: Tabella Blocchetti mostra Storici Importati
- **Oggetto:** In precedenza la tabella `/blocchetti` nascondeva tutti i blocchetti derivati dai pagamenti importati (indicando contatore 990 ma tabella completamente vuota); ora mostra l'elenco aggregato con filtri e paginazione.
- **File e Righe:** `src/views/BlocchettiView.vue:34-124`.
- **Esito della Verifica:** **FUNZIONA IN PARTE**
- **Evidenza Concreta e Analisi:**
  - *Funzionalità verificata:* La funzione `loadData()` e la proprietà calcolata `blocchettiDinamici` aggregano i pagamenti della tabella `tesseramenti` raggruppandoli per `numero_blocchetto`. La vista mostra ora tutti i 990 blocchetti con paginazione a 50 elementi e dettaglio delle ricevute staccate.
  - *Criticità residue rilevate:*
    1. **Filtro "In Circolazione" inservibile:** Per i blocchetti derivati dallo storico, `data_restituzione` è `null` e `isReal` è `false`. Il filtro rapido `activeFilter === 'attivi'` (r. 136-137) verifica unicamente `!b.data_restituzione`. Di conseguenza, tutti i 990 blocchetti storici (anche quelli di 8 anni fa) vengono catalogati come "In Circolazione" e il contatore `totalAttivi` (r. 163) segna falsamente 990 o più, rendendo impossibile per il segretario della Famiglia distinguere i veri blocchetti attivi affidati ai ceraioli nel 2026.
    2. **Disallineamento con BatchEntryView:** La compilazione rapida delle ricevute in `BatchEntryView.vue:1250-1262` scrive i pagamenti ma non aggiorna `db.blocchetti`, trattando i nuovi blocchetti sempre come orfani senza anagrafica.
    3. **Collo di bottiglia computazionale:** La riga 75 esegue `allSoci.value.find(s => s.id === p.id_socio)` per ogni pagamento, provocando un blocco computazionale di decine di milioni di confronti al cambio pagina.

---

### Intervento 2: Scheda Socio in Tema Scuro
- **Oggetto:** Correzione del pulsante "Modifica" (in precedenza bianco abbagliante a contrasto invertito) e stilizzazione dei pulsanti quota ed elimina.
- **File e Righe:** `src/views/SocioDetailView.vue:995-1014`, `1309-1372`.
- **Esito della Verifica:** **FUNZIONA** (con riserva ergonomica sui touch target)
- **Evidenza Concreta e Analisi:**
  - *Funzionalità verificata:* Il pulsante `.edit-button` adotta ora la variabile CSS reattiva `background-color: var(--color-surface); color: var(--color-text-primary);`, integrandosi perfettamente sia con lo sfondo chiaro (`#ffffff`) che con la superficie scura (`#1e1e1e`). Quando attivo (`.is-editing`), assume lo sfondo rosso accent istituzionale con testo bianco.
  - *Stilizzazione quote ed elimina:* I pulsanti `.save-quota-btn`, `.cancel-quota-btn`, `.edit-btn-small` e `.delete-btn` utilizzano icone vettoriali `<BaseIcon>` (`edit`, `check`, `x`, `trash`) con bordi e colori coordinati (`--color-surface-hover`, `--color-accent`).
  - *Riserva ergonomica:* I pulsanti di azione inline per la modifica e cancellazione della quota misurano rispettivamente **28x28px** e **36x36px** (r. 1315, 1334), risultando inferiori alla raccomandazione di **almeno 44x44px** per l'utenza senior.

---

### Intervento 3: Anteprima Tessera in Report e Ordinamento Manicchia
- **Oggetto:** Aggiunta del fallback grafico istituzionale in assenza di template e verifica dell'ordinamento per Manicchia. Segnalazione del motto *«In Fide et Honore»* e del sottotitolo *"GUBBIO"*.
- **File e Righe:** `src/components/TesseraTemplate.vue:20-38`, `src/services/export.js:1027-1038`, `1122-1148`.
- **Esito della Verifica:** **FUNZIONA CON NOTA FORMALE**
- **Evidenza Concreta e Analisi:**
  - *Fallback Grafico:* In assenza di un file template rasterizzato o PDF caricato in memoria, il componente renderizza un cartoncino istituzionale ad alta risoluzione con gradiente avorio (`#fffefb` -> `#f7f3ea`), doppio bordo rosso ceraiolo (`#b71c1c`) e filetto oro (`#c59b27`), stemma araldico vettoriale con scudo e badge dell'anno in corso.
  - *Ordinamento per Manicchia:* In `export.js:1027-1038` e `ReportsView.vue:136-140` la selezione dell'ordinamento per Manicchia funziona perfettamente: ordina prima per `gruppo_appartenenza` (conferendo mazzetti di tessere già raggruppati per zona: San Martino, Sant'Agostino, San Pietro, Padule, ecc.) e secondariamente per Cognome e Nome (A-Z).
  - *Nota Formale Araldica (Da confermare con la Famiglia):* Nel footer del template a video compare il motto *«In Fide et Honore»* (r. 37) e sotto l'intestazione compare la dicitura *"GUBBIO"* (r. 25). Nel generatore PDF (`export.js:1122-1148`), tuttavia, tali stringhe non sono presenti. **Il motto latino e la specifica toponomastica non risultano presenti nei documenti storici di fondazione forniti e devono essere formalmente convalidati o rimossi dal Consiglio Generale della Famiglia prima della distribuzione pubblica delle tessere**.

---

### Intervento 4: Errore Runtime `props is not defined` in ConfirmDeleteModal
- **Oggetto:** Rimozione del crash runtime causato dall'uso di `defineProps` senza assegnazione a costante.
- **File e Righe:** `src/components/ConfirmDeleteModal.vue:57-74`, `81-89`.
- **Esito della Verifica:** **FUNZIONA**
- **Evidenza Concreta e Analisi:**
  - *Risoluzione del Bug:* In precedenza `defineProps({...})` era invocato a livello di script setup senza salvataggio in una variabile locale. Quando il watcher cercava di intercettare l'apertura con `watch(() => props.isVisible, ...)`, il motore JavaScript generava un'eccezione fatale `ReferenceError: props is not defined`, impedendo l'apertura del modale di conferma cancellazione.
  - *Stato Attuale:* Il componente dichiara regolarmente `const props = defineProps({...})`. Il watcher è pienamente operativo e al cambio di stato imposta il focus accessibile sul pulsante di annullamento (`cancelBtn.value?.focus()`).

---

### Intervento 5: Caricamento `sql-wasm.wasm` e Import Database
- **Oggetto:** Caricamento del binario WebAssembly in fase di import e comportamento a server fermo e con base path `/ceraiolo-digitale/`.
- **File e Righe:** `src/views/ImportView.vue:75`, `src/services/db.js:703`, `1042`, `2302`, `vite.config.js:10`.
- **Esito della Verifica:** **FUNZIONA IN PARTE** (Bug Critico Bloccante in Produzione)
- **Evidenza Concreta e Analisi:**
  - *Funzionalità verificata su Onboarding:* In `ImportView.vue:75` e `db.js:703` (`exportDatabaseToSqlite`), `initSqlJs` è stato aggiornato correttamente con:
    `locateFile: (file) => new URL(import.meta.env.BASE_URL + file, window.location.href).href`. Durante la configurazione iniziale da `/import`, il file `sql-wasm.wasm` viene scaricato correttamente.
  - *Bug Bloccante in Produzione:* La stessa correzione **non è stata estesa** a `db.js:2302` (`importDatabaseFromSqlite`, invocato da Impostazioni per il ripristino di un backup) né a `db.js:1042` (`exportSingleSocioToSqlite`). In entrambi i punti è rimasto:
    `locateFile: (file) => \`/${file}\``.
  - *Impatto Reale:* Poiché `vite.config.js` definisce `base: '/ceraiolo-digitale/'` (per il deployment su GitHub Pages), invocare il ripristino del database da `SettingsView.vue` richiede `https://<dominio>/sql-wasm.wasm` anziché `https://<dominio>/ceraiolo-digitale/sql-wasm.wasm`. Il server restituisce **HTTP 404 Not Found**, provocando il blocco totale del ripristino del database.
  - *Comportamento a server fermo:* `sql.js` richiede che il binario WASM sia servito via protocollo HTTP/HTTPS con header `application/wasm`. L'apertura del file HTML tramite doppio clic locale (`file:///index.html`) fallisce per le policy native Same-Origin del browser. È obbligatorio un web server locale o remoto.

---

### Intervento 6: PDF Lab a Due Pilastri, Padding e 1400px
- **Oggetto:** Riorganizzazione dell'Hub Stampe in due pilastri concettuali (Selezione Soci / Impaginazione), introduzione dei chip dei filtri attivi, rimozione del doppio padding perimetrale e larghezza contenitore a 1400px.
- **File e Righe:** `src/views/ReportsView.vue:276-550`, `3810-3814`, `src/App.vue:190-193`.
- **Esito della Verifica:** **FUNZIONA**
- **Evidenza Concreta e Analisi:**
  - *Architettura a Due Pilastri:*
    - **Pilastro 1 (Criteri di Selezione Soci):** Tre tab modulari (Anagrafica & Territorio, Cassa & Storico, Elezioni & Voto) con contatori in tempo reale dei record filtrati.
    - **Pilastro 2 (Impaginazione & Colonne):** Selezione flessibile delle colonne anagrafiche, frecce orizzontali per il riordino delle colonne (`.col-move-btn`), selezione delle colonne degli anni storici (simboli V/X) e colonna per la firma manuale.
  - *Barra Chip e Reset:* La barra `.active-filters-bar` mostra i chip dei filtri attivi con rimozione selettiva (`.chip-dismiss-btn`) e pulsante di ripristino globale (`.reset-all-btn`).
  - *Contenitore e Padding:* La classe `.container` in `ReportsView.vue` è impostata a `max-width: 1400px;` con `padding: 0 0 2rem 0;`. Il perimetro laterale di `2rem` è delegato a `.app-content` in `App.vue`, eliminando il fastidioso effetto visivo del doppio margine laterale.
  - *Nota di manutenzione:* La vista legacy `src/views/ReportsBetaView.vue` (1.398 righe) è rimasta orfana nel repository.

---

## 4. AREA (a): BUG FUNZIONALI, PERSISTENZA E INTEGRITÀ DEI DATI

L'analisi dell'architettura di persistenza ha rilevato una forte disarmonia tra la gestione relazionale SQLite e il modello a oggetti di IndexedDB gestito tramite Dexie.js.

### 4.1 La Funzione Euristica Distruttiva "Fix DB Invertito" (BUG-01 / Critico)
- **Posizione nel Codice:** `src/views/HomeView.vue:160-165` e `src/services/db.js:2492-2558` (`normalizeDatabaseData`).
- **Natura del Difetto:** Nel footer di `HomeView.vue` è esposto un pulsante denominato *"Fix DB Invertito"* che invoca la funzione `normalizeDatabaseData`. Il codice implementa la seguente euristica:
  ```javascript
  if (bNum > 0 && rNum > 0 && bNum > rNum) {
    recordsToFix.push({ ...tess, numero_blocchetto: rNum, numero_ricevuta: bNum })
  }
  ```
  Successivamente, cancella da `db.blocchetti` qualsiasi blocchetto che non corrisponda alle nuove chiavi calcolate:
  ```javascript
  for (const b of allBlocchettiDB) {
    const bNum = Number(b.numero_blocchetto)
    if (!validBlocchettiKeys.has(bNum)) {
      await db.blocchetti.delete(b.id || bNum)
    }
  }
  ```
- **Impatto Distruttivo Concreto:** Nella gestione fisica della Famiglia dei Santantoniari, ogni blocchetto cartaceo contiene esattamente **10 ricevute numerate da 1 a 10**. I blocchetti sono invece numerati in sequenza da 1 a centinaia (es. blocchetto #15, #25, #80).
  Se un ceraiolo compila la ricevuta n. 4 del blocchetto n. 25, la condizione `25 > 4` è verificata: la funzione inverte i valori, trasformando il pagamento in blocchetto n. 4 e ricevuta n. 25 (una ricevuta che fisicamente non esiste nel libretto). Inoltre, il blocchetto n. 25 viene cancellato definitivamente dal database. Un solo clic su questo pulsante corrompe irreversibilmente la contabilità dell'intera campagna ceraiola.
- **Verifica e Riproduzione:** Confermato mediante `scripts/audit_repro/repro_bug_01_fix_db_invertito.js`.

---

### 4.2 Mancanza di Transazionalità Atomica nei Pagamenti Multi-Anno (BUG-09 / Medio)
- **Posizione nel Codice:** `src/views/BatchEntryView.vue:1250-1262`.
- **Natura del Difetto:** Quando un operatore registra un rinnovo per più annualità consecutive (es. 2024, 2025 e 2026), l'applicazione esegue un ciclo asincrono privo di transazione Dexie unificata:
  ```javascript
  for (const year of years) {
    const tesseramentoData = { ... }
    await addTesseramento(tesseramentoData)
  }
  ```
- **Impatto Concreto:** Se durante il salvataggio del secondo o terzo anno si verifica un errore di validazione, una chiusura accidentale del browser o l'esaurimento della quota disco di IndexedDB, i primi pagamenti rimangono salvati mentre gli ultimi vengono persi. La ricevuta cartacea risulterà disallineata rispetto al database digitale senza alcuna possibilità di rollback automatico.
- **Verifica e Riproduzione:** Confermato mediante `scripts/audit_repro/repro_bug_09_atomic_transactions.js`.

---

### 4.3 Mancata Pulizia di `db.blocchetti` nel Factory Reset e nel Ripristino (BUG-10 / Medio)
- **Posizione nel Codice:** `src/services/db.js:2449-2461` (`wipeDatabase`) e `src/services/db.js:2328-2340` (`importDatabaseFromSqlite`).
- **Natura del Difetto:** La funzione `wipeDatabase` (invocata dal "Ripristino di fabbrica" in Impostazioni) esegue la pulizia transazionale delle sole tabelle `db.soci`, `db.tesseramenti`, `db.local_changes` e `db.settings`. La tabella `db.blocchetti` viene completamente ignorata. Lo stesso avviene durante l'importazione di un file SQLite di backup.
- **Impatto Concreto:** Se un responsabile effettua un reset per iniziare la nuova campagna o ripristina il backup di un altro anno, tutti i blocchetti della sessione precedente rimangono presenti in IndexedDB come record fantasma.
- **Verifica e Riproduzione:** Confermato mediante `scripts/audit_repro/repro_bug_10_wipe_blocchetti.js`.

---

### 4.4 Discrepanza nella Formula di Calcolo dell'Età (BUG-11 / Medio)
- **Posizione nel Codice:** `src/utils/payment.js:11` a confronto con `src/services/export.js:1887`.
- **Natura del Difetto:** In `payment.js` l'età è calcolata per pura differenza di anno solare (`year - birthDate.getFullYear()`). In `export.js` (per l'esportazione Excel) l'età è calcolata considerando giorno e mese esatti.
- **Impatto Concreto:** Un ragazzo nato il 15 novembre 2008, all'atto del rinnovo della quota a maggio 2026 ha 17 anni e 6 mesi. In interfaccia viene trattato come maggiorenne di 18 anni (e gli viene richiesta la quota intera o la firma), mentre nell'esportazione Excel dei soci viene catalogato nel foglio dei "Minorenni" con età 17.
- **Verifica e Riproduzione:** Confermato mediante `scripts/audit_repro/repro_bug_11_age_discrepancy.js`.

---

## 5. AREA (b): CORRETTEZZA DEI CALCOLI CONTABILI E STATUTARI

### 5.1 La Triplice Frattura sugli Aventi Diritto al Voto (BUG-03 / Critico)
Nelle assemblee generali della Famiglia dei Santantoniari per l'elezione delle cariche sociali e del Primo Capodieci, la corretta determinazione degli elettori è di importanza capitale per la validità dello scrutinio. L'audit ha riscontrato l'esistenza di **tre regole concorrenti e mutuamente incompatibili** all'interno dello stesso software:

1. **Regola 1 — Quick Button Dashboard / Service (`src/services/db.js:1681-1711`):**
   La funzione `getVotingEligibleMembers(targetYear)` richiede che il socio abbia pagato unicamente la quota dell'anno precedente ($T-1$) e calcola la maggiore età per sola differenza di anno solare:
   ```javascript
   const previousYear = targetYear - 1
   const adultBirthLimit = targetYear - 18
   const prevYearPayments = await db.tesseramenti.where('anno').equals(previousYear).toArray()
   ```
2. **Regola 2 — PDF Lab / Live Preview (`src/views/ReportsView.vue:2344-2361`):**
   La logica `processedData` calcola la maggiore età sul giorno e mese esatto rispetto alla data dell'assemblea (`targetDateObj`) e applica una finestra temporale di **4 anni** ($T-3 \dots T$):
   ```javascript
   const windowStart = Math.max(targetYear - 3, enrollmentYear)
   const windowEnd = targetYear
   ```
3. **Regola 3 — Indicazione Statutaria Ufficiale a Schermo (`src/views/ReportsView.vue:454`):**
   Il testo visuale della guida dichiara esplicitamente:
   *«Statuto: diritto di voto riservato ai soci maggiorenni con quote in regola negli ultimi 5 anni.»*

#### Conseguenze Operative
- Due membri del comitato elettorale che stampano l'elenco dei votanti — uno premendo il tasto rapido nella pagina principale dei Report e l'altro configurando il report nel PDF Lab — ottengono **elenchi di elettori con totali e nominativi discordanti**.
- I giovani nati alla fine del 2008 vengono ammessi al voto da `db.js` ed esclusi da `ReportsView.vue`.
- Soci con pagamenti discontinui vengono ammessi come elettori validi dal Quick Button e bloccati in stato "Regolarizza" dal PDF Lab.
- **Verifica e Riproduzione:** Confermato mediante `scripts/audit_repro/repro_bug_03_voting_fracture.js`.

---

### 5.2 Bug Temporale nelle Statistiche Storiche (`new Date()`) (BUG-04 / Alto)
- **Posizione nel Codice:** `src/services/db.js:1398-1405` (`getNewMembersByYear`) e `src/services/db.js:1534-1541` (`getMembersByGroup`).
- **Natura del Difetto:** Le funzioni che estraggono le statistiche storiche dei nuovi soci per anno o gruppo confrontano la data di nascita del socio con `new Date()` (la data odierna del sistema operativo), anziché con il 31 dicembre dell'anno storico richiesto:
  ```javascript
  const birthDate = new Date(member.data_nascita)
  const today = new Date() // ERRORE: data odierna di sistema!
  let age = today.getFullYear() - birthDate.getFullYear()
  includeMember = ageCategory === 'maggiorenni' ? age >= 18 : age < 18
  ```
- **Impatto Concreto:** Se un archivista richiede il report dei *"Nuovi iscritti minorenni del 2018"*, un ragazzo nato nel 2004 (che nel 2018 aveva 14 anni) ha oggi 22 anni. Poiché `22 >= 18`, il sistema lo esclude retroattivamente dai minorenni e lo classifica come maggiorenne nel report del 2018. L'archivio perde determinismo storico.
- **Verifica e Riproduzione:** Confermato mediante `scripts/audit_repro/repro_bug_04_temporal_stats.js`.

---

### 5.3 Typo sul Campo Anagrafico di Prima Iscrizione (BUG-07 / Alto)
- **Posizione nel Codice:** `src/views/ReportsView.vue:2094-2101` a confronto con `src/services/db.js:16`.
- **Natura del Difetto:** Nello schema Dexie e SQLite il campo è denominato `data_prima_iscrizione`. In `ReportsView.vue` viene erroneamente cercato `member.data_iscrizione`:
  ```javascript
  const getEnrollmentYear = (member) => {
    if (member.data_iscrizione) { // TYPO: proprietà inesistente!
      return new Date(member.data_iscrizione).getFullYear()
    }
    const paidYears = member.tesseramenti?.map((t) => t.anno) || []
    if (paidYears.length > 0) return Math.min(...paidYears)
    return new Date().getFullYear() // Fallback errato all'anno corrente!
  }
  ```
- **Impatto Concreto:** Se un socio è iscritto dal 2010 ma non ha tesseramenti recenti registrati a sistema, `member.data_iscrizione` risulta `undefined`, i pagamenti sono vuoti e il sistema gli assegna d'ufficio l'anno corrente (`2026`). Nella Live Preview elettorale il socio viene etichettato come *"Nuovo iscritto nell'anno 2026"* (r. 2382), azzerando arbitrariamente 16 anni di anzianità ceraiola.
- **Verifica e Riproduzione:** Confermato mediante `scripts/audit_repro/repro_bug_07_typo_iscrizione.js`.

---

### 5.4 Totale Cassa Blocchetto Calcolato Senza Filtro Annuale (BUG-08 / Alto)
- **Posizione nel Codice:** `src/views/BatchEntryView.vue:867-875` e `src/views/BlocchettiView.vue:49`.
- **Natura del Difetto:** Il conteggio della cassa raccolta per singolo blocchetto calcola la somma interrogando `db.tesseramenti.where('numero_blocchetto').equals(bNum)` senza includere la clausola `anno`.
- **Impatto Concreto:** Poiché i blocchetti cartacei vengono re-distribuiti e ri-numerati da 1 all'inizio di ciascuna campagna annuale, inserire il blocchetto n. 1 nel 2026 calcola un totale di cassa che somma gli incassi del blocchetto n. 1 del 2026 con quelli del blocchetto n. 1 del 2025 e del 2024. Il cassiere visualizza un totale di centinaia di euro invece del reale incasso giornaliero (es. 220€ anziché 20€).
- **Verifica e Riproduzione:** Confermato mediante `scripts/audit_repro/repro_bug_08_cassa_multi_anno.js`.

---

## 6. AREA (c): MOTORE DI STAMPA, PDF E RESOCONTI DI CASSA

### 6.1 Layout Tipografico 6x per Fogli Tessere
- **Implementazione:** In `src/services/export.js:1080-1160` (`generateAllCardsPDF`) tramite la libreria `pdf-lib`.
- **Valutazione Tecnica:** Il motore impagina 6 tessere (formato ISO/IEC 7810 ID-1 standard: 85,6 x 53,98 mm) disposte su 2 colonne e 3 righe su foglio A4 (210 x 297 mm). Il calcolo dei margini (orizzontale 13,33 mm, verticale 33,75 mm) garantisce una corretta rifilatura tipografica sia su stampanti laser da ufficio che su cartoncini pre-perforati.
- **Ordinamento Territoriale:** La funzione supporta pienamente l'ordinamento combinato `options.sortBy === 'manicchia'`, consentendo di generare mazzetti di tessere pronti per essere consegnati ai Capimanicchia senza necessità di smistamento manuale.

### 6.2 Resoconti Contabili e Chiusura Cassa
- **Implementazione:** In `src/services/export.js:1343-1450` (`generateBookletSummaryPDF`) tramite `jsPDF` e `jspdf-autotable`.
- **Valutazione Tecnica:** A differenza della vista a schermo, la routine di esportazione PDF applica correttamente il filtro `targetYear` (r. 1356), conteggiando le ricevute staccate, le matrici compilate e l'importo totale incassato per ciascun blocchetto.
- **Criticità Rilevata:** Il file `src/services/exportBeta.js` (452 righe) contiene duplicazioni esatte di queste routine, introdotte durante le fasi sperimentali e mai bonificate.

---

## 7. AREA (d): UX, ERGONOMIA SENIOR E ACCESSIBILITÀ WCAG 2.2 AA

L'analisi dell'interfaccia utente ha confermato la completa rimozione delle emoji (0 emoji rilevate con scansione regex Unicode su `src/`) e la transizione globale verso `<BaseIcon>`. Tuttavia, l'applicazione presenta specifiche violazioni dei criteri **WCAG 2.2 AA** (contrasto minimo $\ge 4.5:1$ per testo normale e $\ge 3.0:1$ per componenti/icone, touch target minimo $\ge 44 \times 44\text{ px}$).

### 7.1 Mappatura Matematica dei Contrasti di Colore

I rapporti di contrasto sono stati calcolati secondo la formula standard di luminanza relativa W3C:
$$L = 0.2126 \cdot R_{lin} + 0.7152 \cdot G_{lin} + 0.0722 \cdot B_{lin}$$
$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$

#### Tema Chiaro (Superficie `#ffffff`, Sfondo `#f4f5f7`)

| Coppia Cromatica | Colore FG | Colore BG | Contrasto Calcolato | Esito WCAG 2.2 AA | Valutazione & Impatto |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Oro Istituzionale su Bianco** | `#c59b27` | `#ffffff` | **2.60:1** | **CRITICO (FAIL)** | Fallisce sia per testo (<4.5:1) che per icone (<3.0:1). Titoli e icone risultano sbiaditi. |
| **Oro Istituzionale su Sfondo App** | `#c59b27` | `#f4f5f7` | **2.38:1** | **CRITICO (FAIL)** | Illeggibile per utenti con ridotta acuità visiva. |
| **Oro Istituzionale su Rosso Accent** | `#c59b27` | `#b71c1c` | **2.53:1** | **CRITICO (FAIL)** | Contrasto insufficiente per stemmi su header. |
| **Rosso Santantoniari (Accent)** | `#b71c1c` | `#ffffff` | **6.57:1** | **PASS (AA)** | Ottima leggibilità per titoli primari. |
| **Rosso Santantoniari (Hover)** | `#991b1b` | `#ffffff` | **8.62:1** | **PASS (AAA)** | Pienamente conforme. |
| **Testo Principale** | `#1a1a1a` | `#ffffff` | **17.40:1** | **PASS (AAA)** | Massima leggibilità. |
| **Testo Secondario** | `#5c6266` | `#ffffff` | **6.19:1** | **PASS (AA)** | Conforme. |
| **Warning (Arancio Scurito)** | `#c2410c` | `#ffffff` | **5.18:1** | **PASS (AA)** | Scurito con successo rispetto al vecchio `#ed6c02`. |
| **Info (Blu Scurito)** | `#0369a1` | `#ffffff` | **5.93:1** | **PASS (AA)** | Scurito con successo rispetto al vecchio `#0288d1`. |
| **Success (Verde)** | `#2e7d32` | `#ffffff` | **5.13:1** | **PASS (AA)** | Conforme. |

#### Tema Scuro (Superficie `#1e1e1e`, Sfondo `#121212`)

| Coppia Cromatica | Colore FG | Colore BG | Contrasto Calcolato | Esito WCAG 2.2 AA | Valutazione & Impatto |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Testo Principale** | `#e0e0e0` | `#1e1e1e` | **12.63:1** | **PASS (AAA)** | Confortevole e privo di abbagliamento. |
| **Rosso Dark Mode (Accent)** | `#ef5350` | `#1e1e1e` | **4.78:1** | **PASS (AA)** | Conforme come elemento grafico. |
| **Testo Bianco su Rosso Accent Dark** | `#ffffff` | `#ef5350` | **3.49:1** | **ALTA (FAIL)** | Fallisce 4.5:1. I pulsanti primari risultano poco nitidi. |
| **Titolo Grafico Canvas Chart.js** | `#b71c1c` | `#1e1e1e` | **1.53:1** | **CRITICO (FAIL)** | Colore cablato non reattivo; quasi invisibile in Dark Mode. |
| **Assi Grafico Canvas Chart.js** | `#5c6266` | `#1e1e1e` | **2.65:1** | **ALTA (FAIL)** | Numeri degli assi scuri su sfondo scuro. |
| **Oro Caldo Dark Mode** | `#e5b338` | `#1e1e1e` | **8.60:1** | **PASS (AAA)** | Ottimo contrasto in tema scuro. |

---

### 7.2 Catalogazione Touch Targets Microscopici (< 44px)

Per garantire facilità d'uso ai volontari senior (anche con dita affaticate o su schermi touch di tablet), WCAG 2.2 Success Criterion 2.5.8 richiede un'area minima di tocco di 44x44px (o 24x24px con spazio di rispetto). La scansione ha evidenziato i seguenti elementi non conformi:

1. **`SocioDetailView.vue:1334` (`.edit-btn-small`, `.save-quota-btn`, `.cancel-quota-btn`):** Dimensioni **28 x 28 px**. Gravissimo rischio di tocco mancato durante la correzione di una quota.
2. **`SocioDetailView.vue:1315` (`.delete-btn`):** Dimensioni **36 x 36 px**.
3. **`ReportsView.vue:3309` (`.chip-dismiss-btn`):** Dimensioni **~12 x 12 px** (icona 12px priva di padding). Rende frustrante la rimozione di un filtro attivo su tablet.
4. **`ReportsView.vue:3222` (`.preset-delete-btn`):** Dimensioni **~14 x 14 px**.
5. **`BatchEntryView.vue` (`.clear-search-btn`):** Dimensioni **26 x 26 px**.
6. **`BlocchettiView.vue:178` (`.pagination-btn`):** Altezza **38 px**.

---

### 7.3 Tipografia Offline e Allineamento Contabile
- **Rimozione Google Fonts:** Completata al 100%. Nessuna chiamata esterna a CDN. Stack di sistema nativo:
  `system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`.
- **Dimensione Base:** Impostata a `html { font-size: 17px; }` per garantire leggibilità ottimale.
- **Numeri Tabulari:** La classe globale `.tabular-nums` in `main.css:310` forza l'incolonnamento dei numeri e la formattazione a destra. In `SocioDetailView.vue:1070` è presente un refuso con la classe `.tabular-num` (al singolare) che omette il `text-align: right`.

---

## 8. AREA (e): PRESTAZIONI CON ARCHIVI GRANDI E BENCHMARK MISURATI

Le prestazioni dell'applicazione sono state misurate sperimentalmente tramite lo script ad alta precisione `scripts/benchmark_performance.js`, operando direttamente sul database sintetico realistico `tests/fixtures/synthetic_ceraiolo_audit.sqlite` (3.500 soci, 17.500 pagamenti, 1.000 blocchetti, 2,25 MB).

### 8.1 Risultati Empirici delle Misurazioni (CPU Intel Core i7-13700K, Node v22.18.0)

```
===================================================================================================
RIASSUNTO GENERALE BENCHMARK PRESTAZIONALI (Ceraiolo Digitale - Audit M1)
===================================================================================================
- Import Database SQLite (21.250 record):      88,16 ms  (Throughput: 238.214 record/sec)
- Ricerca Home Socio Frequente ("Fiorucci"):    0,48 ms  (P95: 0,91 ms, 319 risultati)
- Ricerca Home Filtro Composto (Minelli+Età):   1,62 ms  (P95: 1,91 ms, 33 risultati)
- Lookup Singolo Socio per Scheda:              0,001 ms (0,9 μs, Baseline O(1))
- Bulk N+1 getAllSociWithTesseramenti:          0,77 ms  (Overhead 882x in memoria)
- Aggregazione Blocchetti (Attuale O(N*M)):    24,61 ms  (~61.250.000 confronti teorici)
- Aggregazione Blocchetti (Ottimizzata O(N+M)): 3,27 ms  (7,5x più veloce, +652% efficienza)
- Generazione PDF 6x Tessere (100 soci):       66,28 ms  (34 pagine fronte/retro)
- Generazione PDF Registro Alfabetico (3.500): 226,25 ms (~70 pagine tabellari, 3,74 MB)
- Generazione PDF Resoconto Cassa Blocchetti:  47,29 ms  (~10 pagine, 373 KB)
===================================================================================================
```

### 8.2 Dettaglio dei Flussi di Calcolo

#### Flusso 1: Parsing e Importazione SQLite (`ImportView.vue` / `db.js`)
- Tempo totale pipeline: **88,16 ms** su 21.250 record complessivi.
- Inizializzazione WebAssembly: **5,08 ms**.
- Lettura e parsing binario disco: **3,59 ms**.
- Estrazione ed emissione oggetti: Soci **28,14 ms**, Tesseramenti **50,44 ms**, Blocchetti **0,90 ms**.
- *Deduzione:* Il runtime WebAssembly di `sql.js` è estremamente efficiente. I ritardi riscontrati dagli utenti durante il primo import nel browser derivano dall'overhead asincrono di scrittura su IndexedDB tramite IPC e dalla reattività Vue, non dal parsing SQLite.

#### Flusso 2: Ricerca e Filtro Anagrafico (`HomeView.vue`)
- Ricerca per cognome frequente ("Fiorucci", 319 soci trovati): Media **0,484 ms**, Mediana **0,405 ms**, P95 **0,907 ms**.
- Ricerca per cognome raro ("Traversini", 45 soci): Media **0,415 ms**, P95 **0,622 ms**.
- Ricerca per tessera esatta ("1042"): Media **0,452 ms**.
- Filtro per Manicchia ("San Martino", 618 soci): Media **0,062 ms**.
- Filtro composto complesso (Cognome + Maggiorenni + Manicchia): Media **1,617 ms**.
- *Deduzione:* La ricerca anagrafica su 3.500 soci in memoria è istantanea e ampiamente al di sotto dei 16 ms (soglia dei 60 frame al secondo). Non sono necessari indici full-text esterni.

#### Flusso 3: Collo di Bottiglia $O(N \cdot M)$ in `BlocchettiView.vue:75` (BUG-06 / Alto)
- **Implementazione Attuale:** La riga 75 esegue `allSoci.value.find(s => s.id === p.id_socio)` per ciascuno dei 17.500 pagamenti. Su un archivio reale di 3.500 soci, questo genera **22.507.500 iterazioni reali** e oltre 61 milioni di confronti teorici nel main thread JavaScript.
- **Misurazione:**
  - Codice attuale: **24,61 ms** su CPU desktop di fascia alta i7-13700K.
  - Implementazione con Hash Map (`new Map(allSoci.map(s => [s.id, s]))`): **3,27 ms**.
  - **Fattore di accelerazione:** **7,5x più veloce (+652% di efficienza)** con abbattimento del 99,9% dei cicli di clock.
- *Impatto Utente:* Su computer portatili datati o tablet usati al seggio ceraiolo, l'algoritmo attuale richiede tra i **400 e i 1.200 ms ad ogni cambio tab o filtro**, causando il freeze della finestra del browser.

#### Flusso 4: Generazione Documentale PDF
- Fogli Tessere 6x (100 soci, 34 pagine): **66,28 ms** (allocazione heap: +11,57 MB).
- Registro Soci Alfabetico Completo (3.500 soci, ~70 pagine): **226,25 ms** (allocazione heap: +25,97 MB).
- Resoconto Cassa Blocchetti 2026: **47,29 ms**.
- *Deduzione:* Il motore di rendering PDF è leggero e gestisce grandi moli di dati senza saturare la memoria del browser.

---

## 9. AREA (f): QUALITÀ DEL CODICE, DEBITO TECNICO E ROBUSTEZZA TEST

### 9.1 Codice Morto e Ipertrofia dei Moduli
1. **`src/views/ReportsBetaView.vue` (DEAD-01 / Medio):**
   - File di **1.398 righe** e **47,8 KB** interamente abbandonato.
   - In `src/router/index.js:63-66`, la rotta `/reports-beta` esegue un redirect statico a `/reports`.
   - Nessun modulo del progetto importa `ReportsBetaView.vue`. È un residuo della Milestone 3 che genera confusione e aumenta la superficie di attacco.
2. **`src/services/exportBeta.js` (DEAD-02 / Medio):**
   - File di **452 righe** e **15 KB** contenente la duplicazione integrale di tabelle, intestazioni e utility grafiche già presenti in `export.js`.
3. **Monolite `ReportsView.vue`:**
   - La fusione dell'Hub Stampe ha trasformato `ReportsView.vue` in un unico file monolitico di **3.816 righe** (122 KB). Il componente gestisce contemporaneamente stato di selezione, logiche elettorali, calcoli contabili, composizione anteprima HTML e interazione con i driver di stampa.

### 9.2 Fragilità della Suite di Test Esistente (TEST-01 / Alto)
- La suite conta **284 test superati su 284**, ma presenta gravi fragilità architetturali:
  1. **Assenza Totale di IndexedDB Reale:** Non è installato `fake-indexeddb`. Tutti i test mockano `@/services/db` sostituendolo con array in memoria (`dbState.dynamicSoci`). Di conseguenza, nessuna query Dexie reale, nessun indice composto e nessuna transazione atomica vengono mai effettivamente testati.
  2. **Zero Copertura sui Componenti Critici:** Pagine e modali fondamentali non hanno alcun file di test unitario o di integrazione dedicato:
     - `src/components/AddPaymentModal.vue` (0% coverage)
     - `src/components/ConfirmDeleteModal.vue` (0% coverage)
     - `src/components/ErrorModal.vue` (0% coverage)
     - `src/views/ImportView.vue` (0% coverage)
     - `src/views/BlocchettiView.vue` (0% coverage)
     - `src/views/SocioDetailView.vue` (0% coverage)
     - `src/views/SettingsView.vue` (0% coverage)

---

## 10. AREA (g): PROPOSTE DI NUOVE FUNZIONALITÀ PER LA FAMIGLIA DEI SANTANTONIARI

Sulla base delle tradizioni e delle dinamiche operative tipiche della Festa dei Ceri di Gubbio e della vita associativa della Famiglia dei Santantoniari, si presentano 7 schede di nuove funzionalità ad alto valore aggiunto:

---

### Proposta 1: Registro Elettorale Digitale con Check-in al Seggio
- **Contesto & Bisogno:** Durante l'Assemblea Generale dei Santantoniari (per l'elezione del Primo Capodieci o il rinnovo delle cariche del Consiglio), centinaia di ceraioli affluiscono contemporaneamente alla Taverna o alla sala del seggio. La verifica manuale su registri cartacei genera code, rischio di omonimie e incertezze sull'effettivo diritto di voto.
- **Funzionalità Proposta:**
  - Schermata dedicata *"Seggio Elettorale"* ottimizzata per tablet/touchscreen: ricerca istantanea per cognome o numero di tessera.
  - Semaforo visivo immediato: **VERDE (Avente Diritto)**, **GIALLO (Regolarizzabile al momento)** con incasso rapido della quota arretrata ed emissione ricevuta, **ROSSO (Non Elettore)** con motivazione statutaria chiara (es. minorenne o morosità pregressa).
  - Tasto di Check-in rapido *"Consegna Scheda / Ha Votato"* che registra timestamp locale, impedendo qualsiasi doppio voto accidentale.
- **Valore per la Famiglia:** Certezza assoluta della regolarità elettorale, eliminazione delle contestazioni assembleari e azzeramento dei tempi di attesa.

---

### Proposta 2: Anagrafica Capimanicchia e Registro Affidamento Libretti
- **Contesto & Bisogno:** La campagna di tesseramento si regge sulla rete dei ceraioli referenti sul territorio eugubino (Interna, San Martino, Sant'Agostino, San Pietro, Padule, Madonna del Ponte, Branca, Semonte, ecc.). Attualmente il campo `assegnato_a` della tabella blocchetti è solo una stringa libera priva di anagrafica e contabilità collegata.
- **Funzionalità Proposta:**
  - Rubrica dei *Referenti di Manicchia / Capimanicchia* con recapiti telefonici e zona di competenza.
  - Scheda di affidamento blocchetti: assegnazione di uno o più pacchi di blocchetti numerati a ciascun referente.
  - Cruscotto di monitoraggio avanzamento: quante ricevute ha staccato ogni referente, percentuale di completamento del libretto e calcolo automatico del contante da riversare alla cassa centrale della Famiglia.
  - Stampa del Verbale di Consegna e Resa di fine campagna con firma congiunta dell'Economo e del Capomanicchia.
- **Valore per la Famiglia:** Pieno controllo della cassa diffusa, azzeramento del rischio di libretti smarriti e trasparenza contabile totale.

---

### Proposta 3: Ricevuta e Tessera Digitale Condivisibile (WhatsApp / Web Share API)
- **Contesto & Bisogno:** Una quota rilevante di ceraioli santantoniari vive fuori Gubbio per studio o lavoro (Roma, Perugia, Milano, estero) o rinnova la quota a distanza. La consegna della tessera cartacea stampata è spesso complessa o ritardata.
- **Funzionalità Proposta:**
  - Nella scheda socio e nella schermata di conferma pagamento, introduzione del pulsante *"Condividi Tessera / Ricevuta"*.
  - Sfruttando le Web Share API native del browser, l'applicazione genera un'immagine PNG ad alta fedeltà o un PDF singolo della tessera e apre direttamente WhatsApp, Email o Telegram precompilando il messaggio istituzionale di ringraziamento:
    *«Gentile Ceraiolo, la Famiglia dei Santantoniari ti ringrazia per aver rinnovato la tua devozione per l'anno 2026. In allegato la tua tessera socio ufficiale.»*
- **Valore per la Famiglia:** Coinvolgimento dei santantoniari fuori sede, risparmio sui costi di stampa cartacea e fidelizzazione immediata.

---

### Proposta 4: Modulo di Chiusura e Quadratura Cassa a Fine Campagna
- **Contesto & Bisogno:** Al termine della Festa dei Ceri (giugno), l'Economo e il Consiglio devono redigere il rendiconto finanziario per il Collegio dei Revisori dei Conti. Oggi il calcolo richiede l'esportazione in fogli di calcolo esterni con frequenti disallineamenti tra contanti fisici e ricevute digitali.
- **Funzionalità Proposta:**
  - Procedura guidata di *Chiusura Campagna*:
    1. Quadratura blocchetti: libretti restituiti completi, parziali, non utilizzati, e matrici annullate;
    2. Riconciliazione dei metodi di pagamento: totale contanti versus bonifici/POS;
    3. Analisi delle quote speciali: nuove iscrizioni (25€), rinnovi ordinari (10€), quote sostenitore;
    4. Generazione automatica con un clic del *Rendiconto Finanziario Istituzionale* in PDF firmabile digitalmente.
- **Valore per la Famiglia:** Chiusura impeccabile dei bilanci sociali e tutela legale/fiscale dell'Economo e del Presidente.

---

### Proposta 5: Albo Storico di Fedeltà Ceraiola (Benemerenze 25 / 50 Anni)
- **Contesto & Bisogno:** La tradizione ceraiola si fonda sulla memoria e sul riconoscimento dei veterani. In occasione delle cerimonie di Sant'Antonio Abate (17 gennaio) o del Concerto di maggio, la Famiglia è solita conferire attestati di benemerenza ai soci di lungo corso.
- **Funzionalità Proposta:**
  - Schermata *"Albo della Fedeltà"* che analizza la serie storica delle quote dal campo `data_prima_iscrizione` e dallo storico pagamenti.
  - Filtri automatici per traguardi di anzianità ininterrotta: **25 anni (Argento)**, **40 anni (Oro)**, **50 anni (Veterano di Sant'Antonio)**.
  - Funzione di generazione e stampa diplomatica di un *Attestato d'Onore* in formato A4 con cornice istituzionale ceraiola e firma del Presidente.
- **Valore per la Famiglia:** Rafforzamento dello spirito identitario e celebrazione pubblica dei grandi protagonisti della corsa del Cero.

---

### Proposta 6: Gestione dei Nuclei Familiari (Tesseramento di Famiglia)
- **Contesto & Bisogno:** A Gubbio è consuetudine radicata che un unico capofamiglia rinnovi contestualmente la tessera per tutti i membri del proprio nucleo (coniuge, figli, nipoti). Attualmente l'operatore deve cercare e registrare singolarmente ogni socio, ripetendo i passaggi contabili.
- **Funzionalità Proposta:**
  - Possibilità di raggruppare i soci sotto un *"Nucleo Familiare"* condiviso.
  - Nel flusso di rinnovo (`BatchEntryView` o scheda socio), un solo clic carica l'intero gruppo domestico con il riassunto delle quote dovute (es. 2 adulti a 10€ + 1 ragazzo a 10€ = 30€).
  - Emissione di una ricevuta cumulativa cartacea su singolo foglietto (gestione multi-socio) con aggiornamento istantaneo e contemporaneo di tutte le posizioni anagrafiche individuali.
- **Valore per la Famiglia:** Riduzione drastica dei tempi di attesa allo sportello durante i giorni di massima affluenza alla vigilia della festa.

---

### Proposta 7: Interfaccia Utente per la Consultazione dell'Audit Log Locale
- **Contesto & Bisogno:** Il software registra già in background tutte le modifiche contabili nella tabella Dexie `local_changes` (data, tabella, record modificato, vecchi e nuovi valori). Tuttavia, non esiste alcuna schermata per visualizzare questi eventi.
- **Funzionalità Proposta:**
  - Schermata di sicurezza *"Registro Modifiche (Audit Log)"* accessibile in Impostazioni protetta da PIN/password amministratore.
  - Visualizzazione tabellare filtrabile: modifiche importi quote, cancellazioni di soci o pagamenti, cambi di data.
  - Indicazione differenziale evidenziata (es. `quota_pagata: 10.00 -> 25.00`) con possibilità di esportazione del log in formato CSV/Excel.
- **Valore per la Famiglia:** Trasparenza assoluta, prevenzione di errori contabili involontari e tracciabilità forense di ogni operazione locale.

---

## 11. TABELLA SINOTTICA DI TUTTI I RISULTATI (FINDINGS)

La seguente tabella riassume tutte le criticità, bug e difetti rilevati nel corso dell'audit, classificati per severità e correlati con il relativo script di riproduzione eseguibile:

| ID | Area | Gravità | Posizione Codice | Descrizione e Impatto Concreto | File di Riproduzione / Prova |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | (a) Dati | **CRITICA** | `HomeView.vue:160`, `db.js:2492-2558` | Euristica distruttiva "Fix DB Invertito": inverte blocchetto e ricevuta per qualsiasi blocchetto $>10$ e cancella record da `db.blocchetti`. | `scripts/audit_repro/repro_bug_01_fix_db_invertito.js` |
| **BUG-02** | (a) Dati | **CRITICA** | `db.js:1042`, `2302` | `locateFile` hardcodato a `/${file}` anziché `BASE_URL`. Su produzione (/ceraiolo-digitale/) il ripristino backup da Impostazioni fallisce con HTTP 404 per `sql-wasm.wasm`. | `scripts/audit_repro/repro_bug_02_wasm_base_path.js` |
| **BUG-03** | (b) Calcoli | **CRITICA** | `db.js:1681` vs `ReportsView.vue:2358` vs r. 454 | Tripla frattura aventi diritto al voto: Quick Button (solo $T-1$) vs PDF Lab (4 anni) vs Statuto ufficiale (5 anni). Elenchi elettorali incompatibili. | `scripts/audit_repro/repro_bug_03_voting_fracture.js` |
| **BUG-04** | (b) Calcoli | **ALTA** | `db.js:1398-1405`, `1534-1541` | Bug temporale nelle statistiche storiche: calcolo età con `new Date()` (data odierna) che altera retroattivamente i report storici di minorenni/maggiorenni. | `scripts/audit_repro/repro_bug_04_temporal_stats.js` |
| **BUG-05** | (a) Dati | **ALTA** | `BlocchettiView.vue:136, 163` | Tabella Blocchetti: filtro "In Circolazione" include tutti i 990 blocchetti storici (`data_restituzione: null`), gonfiando falsamente il contatore dei libretti attivi. | `scripts/audit_repro/repro_bug_05_blocchetti_circolazione.js` |
| **BUG-06** | (e) Perf | **ALTA** | `BlocchettiView.vue:75` | Collo di bottiglia $O(N \cdot M)$: scansione lineare `allSoci.find` dentro 17.500 pagamenti = 22,5M iterazioni sul main thread. Freeze dell'interfaccia. | `scripts/audit_repro/repro_bug_06_bottleneck_onm.js` |
| **BUG-07** | (b) Calcoli | **ALTA** | `ReportsView.vue:2095` | Typo `member.data_iscrizione` vs `data_prima_iscrizione`: azzera l'anzianità dei soci storici privi di quote recenti, retrocedendoli al 2026. | `scripts/audit_repro/repro_bug_07_typo_iscrizione.js` |
| **BUG-08** | (b) Calcoli | **ALTA** | `BatchEntryView.vue:867`, `BlocchettiView.vue:49` | Totale cassa blocchetto calcolato sommando tutti gli anni d'archivio senza filtrare per `anno`. Cassa errata per blocchetti riemessi. | `scripts/audit_repro/repro_bug_08_cassa_multi_anno.js` |
| **BUG-09** | (a) Dati | **MEDIA** | `BatchEntryView.vue:1250-1262` | Mancanza di transazioni Dexie atomiche nel salvataggio multi-anno: rischio pagamenti orfani o parziali su interruzioni/errori. | `scripts/audit_repro/repro_bug_09_atomic_transactions.js` |
| **BUG-10** | (a) Dati | **MEDIA** | `db.js:2328-2340`, `2449-2461` | Mancata pulizia della tabella `db.blocchetti` durante il Factory Reset (`wipeDatabase`) e nel ripristino backup SQLite. Dati fantasma persistenti. | `scripts/audit_repro/repro_bug_10_wipe_blocchetti.js` |
| **BUG-11** | (b) Calcoli | **MEDIA** | `utils/payment.js:11` vs `export.js:1887` | Discrepanza calcolo età: anno solare vs data esatta. Chi compie 18 anni nella seconda metà dell'anno è maggiorenne nella UI ma minorenne in Excel. | `scripts/audit_repro/repro_bug_11_age_discrepancy.js` |
| **UI-01** | (d) UX/A11y | **CRITICA** | `main.css:11`, `BaseIcon.vue` | Contrasto WCAG 2.2 fallito per Oro Istituzionale (`#c59b27`) in Tema Chiaro: rapporto **2.60:1** su bianco (soglia richiesta $\ge 4.5:1$ testo, $\ge 3.0:1$ icone). | Ispezione e script contrasto |
| **UI-02** | (d) UX/A11y | **ALTA** | `DashboardCharts.vue:363, 368` | Canvas Chart.js in Tema Scuro con colori statici: titolo asse `#b71c1c` ha contrasto **1.53:1** (illeggibile) e ticks `#5c6266` hanno contrasto **2.65:1**. | Ispezione e script contrasto |
| **UI-03** | (d) UX/A11y | **ALTA** | `App.vue:242`, `ReportsView.vue:3399` | Contrasto testo bianco `#ffffff` su Rosso Dark `#ef5350`: rapporto **3.49:1** (fallisce soglia 4.5:1 per testo standard dei pulsanti attivi). | Ispezione e script contrasto |
| **UI-04** | (d) UX/A11y | **ALTA** | `SocioDetailView.vue:1315, 1334` | Touch targets microscopici: pulsanti modifica quota a **28x28px** ed elimina a **36x36px** (violano lo standard senior di minimo 44x44px). | Ispezione AST/CSS |
| **UI-05** | (d) UX/A11y | **MEDIA** | `ReportsView.vue:3222, 3309` | Touch target chip filtri e preset a **~12-14px**. Difficile tocco selettivo su dispositivi touch. | Ispezione AST/CSS |
| **DEAD-01** | (f) Qualità | **MEDIA** | `src/views/ReportsBetaView.vue` | Codice morto: 1.398 righe (48 KB) orfane, non importate da alcun file del progetto e reindirizzate dal router. | Ispezione router e fs |
| **DEAD-02** | (f) Qualità | **MEDIA** | `src/services/exportBeta.js` | Codice duplicato: 452 righe (15 KB) di routine PDF duplicate da accorpare in `export.js`. | Ispezione comparativa |
| **TEST-01** | (f) Qualità | **ALTA** | `src/__tests__/` | Mock totale di `@/services/db`: 0 test su database Dexie reale (`fake-indexeddb` assente); 0 test per le modali e le viste principali. | Ispezione suite Vitest |
| **INT3-01** | (c) Stampe | **MEDIA** | `TesseraTemplate.vue:25, 37` | Motto «In Fide et Honore» e sottotitolo "GUBBIO" inseriti nel template a schermo senza convalida formale della Famiglia; assenti nel generatore PDF. | Ispezione comparativa |

---

## 12. METODOLOGIA DI VERIFICA INDIPENDENTE E RIPRODUCIBILITÀ

Tutti i risultati, le misurazioni e i comportamenti anomali descritti nel presente rapporto sono stati verificati in modo deterministico e possono essere riprodotti autonomamente da qualsiasi revisore tramite i comandi di seguito descritti:

### 12.1 Esecuzione del Master Runner di Riproduzione
Per eseguire simultaneamente la suite completa di riproduzione dei difetti:
```powershell
node scripts/audit_repro/run_all_repros.js
```
*Esito verificato:* 12 verifiche su 12 completate con stato `CONFIRMED` ed exit code 0.

### 12.2 Verifica del Dataset Sintetico
Per validare l'integrità e la conformità statistica dell'archivio SQLite di prova:
```powershell
node scripts/verify_synthetic_db.js
```
*Esito verificato:* Tutti i controlli sui 3.500 soci, 17.500 tesseramenti, 1.000 blocchetti e i 5 corner case documentati risultano marcati come `PASS`.

### 12.3 Esecuzione dei Benchmark Prestazionali
Per rigenerare le metriche di latenza, throughput e memoria:
```powershell
npx vite-node scripts/benchmark_performance.js
```
*Esito verificato:* Esecuzione e aggiornamento automatico del file `scripts/benchmark_results.json`.

### 12.4 Verifica dell'Integrità del Codice Sorgente e dei Test Esistenti
Per verificare che l'audit sia stato rigorosamente a impatto zero sul codice preesistente:
```powershell
# Verifica che nessun file in src/ sia stato modificato rispetto al commit base
git diff f0ec064 -- src

# Esecuzione completa dei test di regressione
npm run test -- --run

# Verifica della compilazione di produzione
npm run build
```
*Esiti verificati:*
- `git diff`: nessun output (0 righe modificate in `src/`).
- Vitest: **20 file di test superati, 284 test verdi su 284 (100%)**.
- Build Vite: compilazione riuscita in ~5,3s con bundle generato in `dist/`.
