# Rapporto di Audit — Layer Dati, Archiviazione e Integrità ("Ceraiolo Digitale")

## Sommario Esecutivo

Il presente rapporto documenta la ricognizione tecnica e l'audit approfondito condotto sul sottosistema di persistenza, sincronizzazione, import/export e integrità transazionale di **Ceraiolo Digitale** (Vue 3, Dexie.js / IndexedDB, sql.js / WASM, XLSX, Pinia).
L'analisi è stata condotta in modalità **read-only**, senza alterare alcun file di codice sorgente in `src/`.

### Sintesi degli Esiti
1. **Intervento 1 (Tabella Blocchetti): ESITO: FUNZIONA IN PARTE.**
   - *Successo:* Risolve il difetto originario che nascondeva i 990 blocchetti storici (`BlocchettiView.vue` ora aggrega dinamicamente i tesseramenti per numero di blocchetto, include paginazione e dettaglio ricevute).
   - *Criticità rilevate:*
     - Il filtro rapido "In Circolazione" (`activeFilter === 'attivi'`) e il contatore `totalAttivi` classificano **tutti i blocchetti storici** come "In Circolazione" (perché `data_restituzione` è null), gonfiando falsamente il contatore (990 attivi anche se risalenti a 10 anni prima).
     - Disallineamento architetturale: la compilazione seriale (`BatchEntryView.vue`) registra pagamenti in `tesseramenti` ma non scrive in `db.blocchetti`, trattando i blocchetti sempre come "Storici" senza anagrafica.
     - Gravissimo collo di bottiglia prestazionale $O(N \cdot M)$ su archivi reali: scansione lineare `allSoci.value.find` dentro 15.000 pagamenti = **45.000.000 iterazioni** sul main thread in Vue (`BlocchettiView.vue:75`), causando freeze del browser.
     - Mancanza di indice univoco su `numero_blocchetto` nello schema Dexie.
2. **Intervento 5 (Caricamento `sql-wasm.wasm` e Import SQLite): ESITO: FUNZIONA IN PARTE.**
   - *Successo:* In `src/views/ImportView.vue:75` e `src/services/db.js:703` (`exportDatabaseToSqlite`), il percorso WASM è stato corretto con `new URL(import.meta.env.BASE_URL + file, window.location.href).href`, funzionando su GitHub Pages per l'onboarding iniziale.
   - *Criticità bloccante non risolta:* Il medesimo fix **non è stato applicato** in `src/services/db.js:1042` (`exportSocioToSqlite`) né in `src/services/db.js:2302` (`importDatabaseFromSqlite`, invocato da `SettingsView.vue:729` per il ripristino backup). Entrambi hanno ancora `locateFile: (file) => \`/${file}\``. Su produzione (con base path `/ceraiolo-digitale/`), il ripristino del database da Impostazioni e l'export del singolo socio **falliscono sistematicamente con HTTP 404** cercando `/sql-wasm.wasm` alla radice del dominio.
   - *In merito al server di sviluppo fermo:* `sql.js` richiede un server HTTP locale per servire il file binario `.wasm` con i corretti MIME type e aggirare le restrizioni CORS/WASM del browser, che impediscono il caricamento su protocollo `file:///`.
3. **Integrità Transazionale e Rischi di Corruzione Dati:**
   - Mancanza di transazioni Dexie nell'inserimento multi-anno in `BatchEntryView.vue` e nella cancellazione soci/tesseramenti in `deleteSocio`.
   - Mancata pulizia di `db.blocchetti` durante il Factory Reset (`wipeDatabase`) e durante il ripristino da backup SQLite (`importDatabaseFromSqlite`).
   - Funzione distruttiva euristica `normalizeDatabaseData` esposta con pulsante "Fix DB Invertito" in `HomeView.vue:165`, che scambia `numero_blocchetto` e `numero_ricevuta` per qualsiasi blocchetto $N > 10$.
   - Discrepanza nella formula di calcolo dell'età tra `utils/payment.js` (differenza di anno solare) ed `export.js` (data esatta con giorno e mese).

---

## 1. Observation (Evidenze Dirette e Riscontri Oggettivi)

### 1.1 Posizione dei File e Nomenclatura Reale
- Il componente citato nel prompt come `ReceiptsView.vue` **non esiste**. Il componente effettivo è `src/views/BlocchettiView.vue` (registrato nel router in `src/router/index.js:76-82` sul path `/blocchetti`).
- Il modulo citato nel prompt come `src/services/import.js` **non esiste**. L'importazione iniziale risiede in `src/views/ImportView.vue`, mentre la funzione per il ripristino successivo da file risiede in `src/services/db.js` (`importDatabaseFromSqlite`).
- Lo schema locale IndexedDB non risiede in una cartella `src/db/`, ma è interamente dichiarato ed esportato in `src/services/db.js:1-60`.

### 1.2 Intervento 1 — Stato del Codice in `BlocchettiView.vue` e `BatchEntryView.vue`
Nel file `src/views/BlocchettiView.vue`:
```javascript
// Righe 34-38: Caricamento massivo in memoria reattiva
async function loadData() {
  blocchettiDB.value = await getAllBlocchetti()
  allPayments.value = await exportAllTesseramenti()
  allSoci.value = await db.soci.toArray()
}

// Righe 42-83: Aggregazione dinamica in computed
const blocchettiDinamici = computed(() => {
   const map = new Map()
   allPayments.value.forEach(p => {
       const bNum = Number(p.numero_blocchetto) || 0
       const rNum = Number(p.numero_ricevuta) || 0
       if (bNum <= 0) return;
       if (!map.has(bNum)) {
           map.set(bNum, {
               numero_blocchetto: bNum,
               ricevuteMap: new Map(),
               countPagamenti: 0,
               totaleIncassato: 0,
               assegnato_a: 'Gestito dallo Storico',
               data_assegnazione: null,
               data_restituzione: null,
               isReal: false
           })
       }
       const blocco = map.get(bNum)
       blocco.countPagamenti++
       blocco.totaleIncassato += (Number(p.quota_pagata) || 0)
       if (rNum > 0) {
           if (!blocco.ricevuteMap.has(rNum)) blocco.ricevuteMap.set(rNum, [])
           // RIGA 75: Ricerca lineare O(M) dentro O(N) pagamenti!
           const socio = allSoci.value.find(s => s.id === p.id_socio)
           const nomeSocio = socio ? `${socio.cognome} ${socio.nome}` : 'Socio Eliminato'
           blocco.ricevuteMap.get(rNum).push({ ...p, socioNome: nomeSocio })
       }
   })
   // ...
```
Nel filtraggio e conteggio di `BlocchettiView.vue`:
```javascript
// Righe 136-143
if (activeFilter.value === 'attivi') {
    baseList = baseList.filter(b => !b.data_restituzione)
} else if (activeFilter.value === 'restituiti') {
    baseList = baseList.filter(b => !!b.data_restituzione)
} else if (activeFilter.value === 'registrati') {
    baseList = baseList.filter(b => b.isReal)
}

// Riga 163: Conteggio Attivi
const totalAttivi = computed(() => blocchettiDinamici.value.filter(b => !b.data_restituzione).length)
```
In `src/views/BatchEntryView.vue:1250-1262`:
```javascript
// Registrazione pagamento in BatchEntryView: NESSUNA interazione con db.blocchetti
for (const year of years) {
  const tesseramentoData = {
    id_socio: socioId,
    anno: year,
    quota_pagata: details.quota_pagata,
    data_pagamento: details.data_pagamento,
    numero_ricevuta: currentReceipt.numero,
    numero_blocchetto: sessionData.numeroBlocchetto,
  }
  await addTesseramento(tesseramentoData)
}
```
In `src/services/db.js:189-287`:
La funzione `syncBlocchettiFromTesseramenti()` contiene la logica per convertire i pagamenti storici in blocchetti (marcando con `dataRestituzione: 31 Dicembre` quelli degli anni precedenti), ma **non è richiamata da nessun file del progetto** (dead code accertato via `grep_search`).

### 1.3 Intervento 5 — Caricamento `sql-wasm.wasm` e Base Path
Nel file `vite.config.js`:
```javascript
// Riga 10: Base path di produzione
base: '/ceraiolo-digitale/',
plugins: [
  vue(),
  vueDevTools(),
  viteStaticCopy({
    targets: [{ src: 'node_modules/sql.js/dist/sql-wasm.wasm', dest: '' }],
  }),
]
```
Nel file `src/views/ImportView.vue`:
```javascript
// Righe 73-76: Corretto per GitHub Pages
const SQL = await initSqlJs({
  locateFile: (file) => new URL(import.meta.env.BASE_URL + file, window.location.href).href,
})
```
Nel file `src/services/db.js`:
```javascript
// Riga 701-704: Corretto in exportDatabaseToSqlite
const SQL = await initSqlJs({
  locateFile: (file) => new URL(import.meta.env.BASE_URL + file, window.location.href).href,
})

// Riga 1041-1043: DIFETTO in exportSocioToSqlite
const SQL = await initSqlJs({
  locateFile: (file) => `/${file}`, // BUG: ignora BASE_URL!
})

// Riga 2301-2303: DIFETTO in importDatabaseFromSqlite (usato in SettingsView.vue:729)
const SQL = await initSqlJs({
  locateFile: (file) => `/${file}`, // BUG: ignora BASE_URL!
})
```

Verifica build con `npm run build`:
- `dist/index.html` contiene `<script ... src="/ceraiolo-digitale/assets/...">`.
- `dist/sql-wasm.wasm` è generato a 659.806 byte nella root di `dist/`.
- Quando servito con prefisso `/ceraiolo-digitale/`, la chiamata a `/${file}` richiede `https://<host>/sql-wasm.wasm` (HTTP 404), anziché `https://<host>/ceraiolo-digitale/sql-wasm.wasm`.

### 1.4 Mappatura Schema Dexie vs SQLite di Origine

| Tabella | Schema Dexie (`src/services/db.js:11-59`) | Schema SQLite Origine / Backup (`db.js:710-761`) | Note di Integrità e Mapping |
| :--- | :--- | :--- | :--- |
| **Soci** | `id`, `[cognome+nome]`, `gruppo_appartenenza`, `data_prima_iscrizione`, `note` | `id INTEGER PRIMARY KEY`, `cognome TEXT`, `nome TEXT`, `data_nascita TEXT`, `luogo_nascita TEXT`, `gruppo_appartenenza TEXT`, `data_prima_iscrizione INTEGER`, `note TEXT` | In Dexie `data_nascita` e `luogo_nascita` sono campi non indicizzati memorizzati nel payload oggetto. |
| **Tesseramenti** | `id_tesseramento`, `id_socio`, `anno`, `data_pagamento`, `quota_pagata`, `numero_ricevuta`, `numero_blocchetto` | `id_tesseramento TEXT PRIMARY KEY`, `id_socio INTEGER`, `anno INTEGER`, `data_pagamento TEXT`, `quota_pagata REAL`, `numero_ricevuta INTEGER`, `numero_blocchetto INTEGER`, `FOREIGN KEY(id_socio) REFERENCES Soci(id)` | In Dexie manca l'indice composto `[id_socio+anno]` usato dalle query `db.tesseramenti.where({ id_socio, anno })`. `id_tesseramento` è UUID string in Dexie, TEXT in SQLite. |
| **Blocchetti** | `++id`, `numero_blocchetto`, `ricevute_da`, `ricevute_a`, `assegnato_a`, `data_assegnazione`, `data_restituzione` | `id INTEGER PRIMARY KEY`, `numero_blocchetto INTEGER`, `ricevute_da INTEGER`, `ricevute_a INTEGER`, `assegnato_a TEXT`, `data_assegnazione TEXT`, `data_restituzione TEXT` | **Manca vincolo di unicità `&numero_blocchetto`**. Tabella omessa in `importDatabaseFromSqlite` e `wipeDatabase`. |
| **Settings** | `key`, `value`, `updated_at` | `key TEXT PRIMARY KEY`, `value TEXT` (JSON), `updated_at TEXT` | I valori complessi (array, oggetti) sono memorizzati nativamente in Dexie e serializzati in JSON string in SQLite. |
| **LocalChanges** | `++id`, `table_name`, `record_id`, `change_type`, `timestamp`, `old_data`, `new_data` | `id INTEGER PRIMARY KEY AUTOINCREMENT`, `table_name TEXT`, `change_type TEXT`, `record_id TEXT`, `timestamp TEXT`, `new_data TEXT` | Tabella di audit locale. `old_data` non viene esportato in SQLite (solo `new_data`). |

### 1.5 Punti Critici di Integrità Transazionale e Concorrenza
- **`addSocio` (`db.js:1259-1263`)**:
  ```javascript
  const allSoci = await db.soci.toArray()
  const maxId = allSoci.length > 0 ? Math.max(...allSoci.map((s) => s.id)) : 0
  const newId = maxId + 1
  ```
  Non atomico, non sincronizzato, carica tutti i soci e usa spread operator su decine di migliaia di elementi.
- **`wipeDatabase` (`db.js:2449-2461`)**:
  La transazione pulisce solo `db.soci`, `db.tesseramenti`, `db.local_changes`, `db.settings`. La tabella `db.blocchetti` **non viene inclusa né svuotata**.
- **`importDatabaseFromSqlite` (`db.js:2328-2432`)**:
  Pulisce e ricarica soci, tesseramenti, settings e local_changes. **La tabella `db.blocchetti` viene completamente ignorata sia in lettura che in scrittura**.
- **`deleteSocio` (`db.js:546-550`)**:
  Esegue prima `db.tesseramenti.where('id_socio').equals(socioId).delete()` e poi `db.soci.delete(socioId)` senza transazione Dexie unificata. Se la seconda fallisce, il socio rimane con storico tesseramenti cancellato. Inoltre i tesseramenti eliminati non sono loggati in `local_changes`.
- **`normalizeDatabaseData` (`db.js:2498-2510`) & `HomeView.vue:160`**:
  ```javascript
  if (bNum > 0 && rNum > 0 && bNum > rNum) {
    recordsToFix.push({ ...tess, numero_blocchetto: rNum, numero_ricevuta: bNum })
  }
  ```
  Heuristica gravemente difettosa: se un blocchetto fisico da 10 ricevute ha numero 15 e la ricevuta è la numero 3, la condizione `15 > 3` scambia i campi assegnando blocchetto 3 e ricevuta 15.

---

## 2. Logic Chain (Catena Logica dalle Osservazioni alle Conclusioni)

1. **Premessa su Intervento 1**:
   - *Osservazione:* L'intervento ha introdotto `blocchettiDinamici` per scansionare `allPayments` e raggruppare i record per `numero_blocchetto`.
   - *Deduzione:* La tabella non è più vuota dopo l'import di un DB legacy privo di tabella `Blocchetti`; tutti i 990 blocchetti compaiono con le relative ricevute raggruppate.
   - *Tuttavia (Osservazione 1.2):* Per tutti i blocchetti storici generati dinamicamente, `data_restituzione` è impostato a `null` e `isReal` a `false`.
   - *Deduzione Logica:* La condizione `activeFilter === 'attivi'` filtra con `!b.data_restituzione`. Poiché `null` è falsy, `!null` è `true`. Di conseguenza, tutti i 990 blocchetti storici degli ultimi 10 anni soddisfano il filtro e figurano nel conteggio `totalAttivi` ("In Circolazione (990)"). Questo rende il filtro "In Circolazione" completamente inservibile nella pratica gestionale della Famiglia dei Santantoniari, che deve sapere quali blocchetti dell'anno in corso sono materialmente in mano ai ceraioli.
   - *Inoltre (Osservazione 1.2):* Con 15.000 pagamenti e 3.000 soci, la riga 75 esegue `allSoci.value.find` (scansione lineare di 3.000 elementi) per 15.000 volte. Questo porta a $15.000 \times 3.000 = 45.000.000$ operazioni sincrone al secondo grado di complessità computazionale $O(N \cdot M)$ ad ogni ciclo di reattività del componente, causando blocchi del thread principale.
   - *Conclusione Intervento 1:* L'intervento funziona per la visualizzazione di base, ma è **parziale e difettoso** sul piano logico (filtro attivi) e prestazionale (collo di bottiglia memoria/CPU).

2. **Premessa su Intervento 5**:
   - *Osservazione:* In `ImportView.vue:75`, `locateFile` usa `new URL(import.meta.env.BASE_URL + file, window.location.href).href`.
   - *Deduzione:* Sull'onboarding da `/import`, il browser richiede `/ceraiolo-digitale/sql-wasm.wasm`, che corrisponde esattamente al file generato da Vite in `dist/sql-wasm.wasm`.
   - *Tuttavia (Osservazione 1.3):* Nelle funzioni `importDatabaseFromSqlite` (db.js:2302) ed `exportSocioToSqlite` (db.js:1042), il codice è rimasto invariato: `locateFile: (file) => \`/${file}\``.
   - *Deduzione Logica:* Quando l'applicazione è ospitata su GitHub Pages (URL `https://dominio.github.io/ceraiolo-digitale/`), il browser tenta di effettuare una `fetch` verso `https://dominio.github.io/sql-wasm.wasm`. Il server GitHub Pages restituisce HTTP 404 (file non trovato alla radice). Pertanto, la funzione di Ripristino Database da `SettingsView.vue` fallisce irreparabilmente in produzione.
   - *In merito al server di sviluppo fermo:* `sql.js` necessita del runtime WASM compilato. Senza un web server (es. doppio clic su `dist/index.html` con protocollo `file:///`), le API Fetch e WebAssembly vengono bloccate dalle policy di sicurezza Same-Origin del browser, impedendo l'inizializzazione del motore SQLite.
   - *Conclusione Intervento 5:* L'intervento funziona per l'import iniziale, ma è **incompleto e rotto** per le restanti funzionalità SQLite in produzione.

3. **Premessa sull'Integrità dei Dati e Transazioni**:
   - *Osservazione:* `BatchEntryView.vue:1251` itera `for (const year of years)` eseguendo `await addTesseramento(tesseramentoData)`.
   - *Deduzione:* L'operazione non è atomica. Se si verifica un'interruzione di rete locale, crash del browser, quota disco superata o eccezione sul secondo anno di pagamento, il primo anno rimane scritto e non esiste meccanismo di rollback.
   - *Osservazione:* `wipeDatabase` e `importDatabaseFromSqlite` non manipolano `db.blocchetti`.
   - *Deduzione:* Un amministratore che esegue un ripristino di emergenza o un reset di fabbrica si ritrova con la tabella dei blocchetti contenente i dati della precedente gestione locale (dati fantasma non cancellati).

---

## 3. Caveats (Assunzioni e Limiti dell'Indagine)

1. **Assenza di Database di Produzione Reale**: L'indagine è stata condotta su analisi statica del codice sorgente, test Vitest esistenti e simulazioni logiche, poiché per vincolo di riservatezza e privacy nessun database reale con nominativi di Gubbio è stato caricato.
2. **Ambiente di Esecuzione WebAssembly**: Il comportamento di `sql.js` sotto protocollo `file:///` è vincolato dalle policy native del browser host (Chrome/Edge/Firefox). Non sono state testate estensioni browser che forzano l'accesso al filesystem locale disabilitando la sicurezza web.
3. **Compatibilità File System Access API**: L'auto-backup su cartella locale (`backupService.js`) si basa sulle API `showDirectoryPicker`, disponibili esclusivamente su browser Chromium desktop (Google Chrome, Microsoft Edge) in contesto sicuro (HTTPS o localhost). Su Firefox, Safari o dispositivi mobile, il sistema ricorre al fallback manuale di download file.

---

## 4. Conclusion (Esito e Valutazione di Audit)

1. **Intervento 1 (Tabella Blocchetti): FUNZIONA IN PARTE.**
   - Risolve la visualizzazione iniziale ma richiede 3 correzioni indispensabili prima del rilascio definitivo: (a) limitare il filtro "In Circolazione" ai soli blocchetti assegnati nell'anno in corso (`b.isReal && !b.data_restituzione`); (b) ottimizzare la lookup dei soci in `blocchettiDinamici` sostituendo `allSoci.find()` con una `Map(id -> socio)` indicizzata in $O(1)$; (c) collegare `BatchEntryView` e `syncBlocchettiFromTesseramenti` per registrare i blocchetti utilizzati.
2. **Intervento 5 (`sql-wasm.wasm` e Import SQLite): FUNZIONA IN PARTE.**
   - Corretto in `ImportView.vue`, ma **rotte in produzione** le funzioni di Ripristino Backup (`importDatabaseFromSqlite`) ed esportazione socio (`exportSocioToSqlite`) in `src/services/db.js`. È necessario allineare la configurazione `locateFile` in tutte le istanze di `initSqlJs`.
3. **Integrità Dati Complessiva: VULNERABILE A ERRORI TRANSAZIONALI E EURISTICHE DISTRUTTIVE.**
   - Il pulsante "Fix DB Invertito" in `HomeView.vue` rappresenta una minaccia critica di corruzione dati e va rimosso o circoscritto con controlli stringenti.
   - È necessario incapsulare i flussi multi-record in transazioni Dexie atomiche e includere `db.blocchetti` in tutte le operazioni di import, export e wipe.

---

## 5. Analisi Dettagliata dei Bug Funzionali e Rischi di Integrità

Di seguito la tabella analitica di tutti i problemi riscontrati, classificati per gravità:

| ID | Area | Gravità | Posizione Codice | Descrizione e Impatto Concreto | Passi di Riproduzione / Prova |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-DATA-01** | Import/Ripristino SQLite | **Alta** | `src/services/db.js:2302`, `1042` | `locateFile` hardcodato a `/${file}` invece di utilizzare `import.meta.env.BASE_URL`. Su produzione GitHub Pages (`/ceraiolo-digitale/`), il Ripristino Database da Impostazioni e l'export del socio generano HTTP 404 bloccando l'applicazione. | 1. Eseguire build di produzione `npm run build`.<br>2. Simulare hosting su sottocartella `/ceraiolo-digitale/`.<br>3. Da Impostazioni, tentare il ripristino di un file `.sqlite`.<br>4. La console mostra errore di rete 404 per `sql-wasm.wasm`. |
| **BUG-DATA-02** | Gestione Blocchetti | **Alta** | `src/views/BlocchettiView.vue:136-137, 163` | I blocchetti storici importati (`isReal: false`) hanno `data_restituzione: null`. Il filtro "In Circolazione" verifica solo `!b.data_restituzione`, mostrando TUTTI i blocchetti storici (es. 990) come attivi in circolazione, falsando la cassa e lo stato dei libretti. | 1. Importare un database storico con 900+ blocchetti.<br>2. Aprire `/blocchetti`.<br>3. Cliccare sulla pill "In Circolazione".<br>4. Vengono mostrati tutti i 900+ blocchetti storici con badge "Storico" ma conteggiati come attivi. |
| **BUG-DATA-03** | Prestazioni / Memoria | **Alta** | `src/views/BlocchettiView.vue:75` | Lookup lineare non indicizzata: `const socio = allSoci.value.find(s => s.id === p.id_socio)` dentro il ciclo di 15.000 pagamenti. Complessità $O(N \cdot M) = 45.000.000$ iterazioni nel thread UI. | 1. Caricare 15.000 tesseramenti e 3.000 soci.<br>2. Navigare su `/blocchetti`.<br>3. Osservare freeze della pagina per diversi secondi e avviso di browser non rispondente. |
| **BUG-DATA-04** | Corruzione Dati Euristica | **Critica** | `src/services/db.js:2501-2510`, `HomeView.vue:160` | La funzione `normalizeDatabaseData` scambia `numero_blocchetto` e `numero_ricevuta` se `numero_blocchetto > numero_ricevuta`. Poiché ogni blocchetto ha 10 ricevute, per tutti i blocchetti > 10 (es. blocchetto 25, ricevuta 4) la funzione inverte i dati, corrompendo irreversibilmente l'archivio. | 1. Inserire blocchetto 25 con ricevuta 4.<br>2. Cliccare "Fix DB Invertito" nel footer di HomeView.<br>3. Il blocchetto diventa 4 e la ricevuta diventa 25. |
| **BUG-DATA-05** | Atomicità Transazioni | **Alta** | `src/views/BatchEntryView.vue:1250-1262` | Registrazione pagamenti multi-anno in ciclo senza `db.transaction('rw', ...)`. Mancanza di rollback su errore o chiusura improvvisa. | 1. Iniziare registrazione con 3 anni (2024, 2025, 2026).<br>2. Simulare interruzione/errore dopo il primo inserimento.<br>3. Il primo anno è memorizzato, i successivi no, lasciando la ricevuta orfana e incoerente. |
| **BUG-DATA-06** | Reset e Import Incompleti | **Media** | `src/services/db.js:2328-2340, 2449-2461` | La tabella `db.blocchetti` non viene svuotata in `wipeDatabase` né gestita in `importDatabaseFromSqlite`. I blocchetti locali persistono dopo il reset o il cambio di database. | 1. Creare un blocchetto anagrafico in `/blocchetti`.<br>2. Andare in Impostazioni ed eseguire "Ripristino di fabbrica".<br>3. I soci e pagamenti sono azzerati, ma il blocchetto resta presente in IndexedDB. |
| **BUG-DATA-07** | Race Condition ID Soci | **Media** | `src/services/db.js:1259-1263` | Calcolo del nuovo ID socio tramite `Math.max(...allSoci.map(s => s.id)) + 1` senza transazione o lock. Rischio di collisione su inserimenti concorrenti e stack overflow su oltre 65.000 record. | 1. Avviare due chiamate asincrone concorrenti a `addSocio`.<br>2. Entrambe leggono lo stesso `maxId` e tentano di inserire con la stessa chiave primaria. |
| **BUG-DATA-08** | Discrepanza Calcolo Età | **Media** | `utils/payment.js:11` vs `export.js:1887` | In `utils/payment.js` l'età è calcolata come differenza anno (`year - birthDate.getFullYear()`). In `export.js` è calcolata con mese e giorno esatti. Chi compie 18 anni nella seconda metà dell'anno è maggiorenne per il gestionale ma minorenne nell'export Excel. | 1. Creare socio nato il 15/11/2008.<br>2. Nel maggio 2026 verificare lo stato in BatchEntry (segnalato maggiorenne).<br>3. Esportare in Excel: inserito nel foglio "Minorenni" (età 17). |
| **BUG-DATA-09** | N+1 Query in Home e Reports | **Alta** | `src/services/db.js:512-520` | `getAllSociWithTesseramenti()` carica i soci e poi lancia `Promise.all` con `getTesseramentiBySocioId(socio.id)` per ciascun socio: 3.000 query parallele a IndexedDB che saturano il browser all'apertura della Home. | 1. Popolare il DB con 3.000 soci.<br>2. Accedere alla HomeView (`/`).<br>3. Notare il ritardo di caricamento dovuto all'avvio di 3.000 transazioni IndexedDB simultanee. |
| **BUG-DATA-10** | Indice composto mancante | **Media** | `src/services/db.js:19-27, 1352` | `findExistingPaymentYear` e `getNewMembersByYear` interrogano `db.tesseramenti.where({ id_socio, anno })`, ma lo schema Dexie dichiara gli indici singoli `id_socio` e `anno`, privo dell'indice composto `[id_socio+anno]`. | 1. Eseguire query Dexie nativa con oggetto `{ id_socio, anno }`.<br>2. Dexie esegue un fallback a scansione sequenziale o solleva eccezione in assenza di indice appropriato. |

---

## 6. Specifiche per la Creazione del Dataset Sintetico SQLite di Test

Per eseguire benchmark realistici (secondo i criteri dell'Acceptance Criteria: $\ge 3.000$ soci, $15.000$ pagamenti, $1.000$ blocchetti) senza violare la privacy, è necessario generare un file SQLite con le seguenti specifiche:

### 6.1 Struttura e Schema DDL

```sql
-- Tabella Soci
CREATE TABLE Soci (
    id INTEGER PRIMARY KEY,
    cognome TEXT NOT NULL,
    nome TEXT NOT NULL,
    data_nascita TEXT,          -- Formato ISO: YYYY-MM-DD
    luogo_nascita TEXT,         -- Default 'Gubbio' (90%), 'Perugia' (5%), Altro (5%)
    gruppo_appartenenza TEXT,    -- Manicchie ufficiali
    data_prima_iscrizione INTEGER NOT NULL, -- Anno YYYY (1980 - 2026)
    note TEXT
);

-- Tabella Tesseramenti
CREATE TABLE Tesseramenti (
    id_tesseramento TEXT PRIMARY KEY, -- UUID v4
    id_socio INTEGER NOT NULL,
    anno INTEGER NOT NULL,            -- 2018 - 2026
    data_pagamento TEXT NOT NULL,     -- Formato ISO: YYYY-MM-DD
    quota_pagata REAL NOT NULL,       -- 10.00, 25.00, o 0.00
    numero_ricevuta INTEGER NOT NULL, -- 1 - 10 relativo al blocchetto, oppure sequenziale
    numero_blocchetto INTEGER NOT NULL, -- 1 - 1000
    FOREIGN KEY (id_socio) REFERENCES Soci (id)
);

-- Tabella Blocchetti (Struttura Backup)
CREATE TABLE Blocchetti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_blocchetto INTEGER NOT NULL,
    ricevute_da INTEGER DEFAULT 1,
    ricevute_a INTEGER DEFAULT 10,
    assegnato_a TEXT,
    data_assegnazione TEXT,
    data_restituzione TEXT
);

-- Tabella Impostazioni
CREATE TABLE Settings (
    key TEXT PRIMARY KEY,
    value TEXT, -- JSON string
    updated_at TEXT
);

-- Tabella Metadati
CREATE TABLE Metadata (
    key TEXT PRIMARY KEY,
    value TEXT
);
```

### 6.2 Distribuzioni Statistiche e Parametri di Volume

1. **Volume Totale:**
   - **Soci:** Esattamente $3.500$ record ($id = 1 \dots 3500$).
   - **Tesseramenti:** Esattamente $17.500$ record (media di 5 tesseramenti per socio).
   - **Blocchetti:** Esattamente $1.000$ blocchetti fisici (da #1 a #1000).

2. **Distribuzione Anagrafica e Manicchie (Soci):**
   - **Cognomi tipici eugubini:** Fiorucci (12%), Uccellani (10%), Vagnarelli (9%), Minelli (8%), Panfili (7%), Rossi (6%), Pierotti (6%), Gaggiotti (5%), Notari (5%), Morelli (4%), Altri (28%).
   - **Manicchie / Gruppi territoriali:**
     - San Martino (18%)
     - Sant'Agostino (17%)
     - San Pietro (16%)
     - Padule (12%)
     - Madonna del Ponte (11%)
     - Branca (9%)
     - Semonte (7%)
     - Non specificata (10%)
   - **Fasce d'età:**
     - Senior (>65 anni): 30% (nati 1935-1960)
     - Adulti (18-65 anni): 55% (nati 1961-2007)
     - Minorenni (<18 anni nel 2026): 15% (nati 2009-2022)

3. **Casi Limite e Test Corner-Case Obbligatori:**
   - **Gruppo A — Compimento 18 anni nel 2026 (50 soci):**
     - 25 nati tra gennaio e aprile 2008 (già maggiorenni a maggio 2026).
     - 25 nati tra giugno e dicembre 2008 (ancora 17enni a maggio 2026, ma con $2026 - 2008 = 18$).
   - **Gruppo B — Quote Differenziate e Rientri (200 soci):**
     - 100 Nuovi Iscritti nel 2026 (`data_prima_iscrizione = 2026`): pagano 25€.
     - 50 Rientri con "buco" (pagato 2024, saltato 2025, pagano 2026): pagano quota penalità 25€.
     - 50 Rientri con "buco" nel 2025 in cui il socio era minorenne nel 2025: pagano quota ordinaria 10€ (esenzione valida).
   - **Gruppo C — Anni non consecutivi e Condono (300 soci):**
     - Soci con storico discontinuo (es. pagati 2019, 2020, 2022, 2024):
       - Se hanno pagato il 2026: risultano completamente "in regola" (anni 2021, 2023, 2025 condonati).
       - Se NON hanno pagato il 2026: mostrano arretrati multipli non consecutivi.
   - **Gruppo D — Soci inattivi / Churn (400 soci):**
     - Soci che hanno pagato nel 2025 ma non nel 2026 (elenco "Soci da sollecitare / Churn").
     - Soci che non pagano da oltre 5 anni (dormienti).
     - 50 soci con 0 pagamenti registrati.
   - **Gruppo E — Ricevute Multi-Socio e Blocchetti (400 ricevute):**
     - Ricevute familiari con 2 o 3 soci registrati sullo stesso numero di ricevuta e blocchetto.
     - Blocchetti completamente compilati (10 ricevute), parzialmente compilati (1..9 ricevute) e non utilizzati.

### 6.3 Struttura dei Blocchetti e Relazioni

- **Campagna Storica (2018 - 2024):** Blocchetti #1 - #750. Hanno tutti pagamenti associati ma non hanno record nella tabella `Blocchetti` (simulando l'archivio legacy importato).
- **Campagna Precedente (2025):** Blocchetti #751 - #900. Presenti nella tabella `Blocchetti` con `data_assegnazione: '2025-04-15'` e `data_restituzione: '2025-05-30'`.
- **Campagna Corrente (2026):** Blocchetti #901 - #1000.
  - #901 - #950: Presenti in `Blocchetti`, `data_assegnazione: '2026-04-10'`, `data_restituzione: null` (In Circolazione effettivi).
  - #951 - #980: Presenti in `Blocchetti`, già restituiti (`data_restituzione: '2026-05-02'`).
  - #981 - #1000: Blocchetti vuoti pre-assegnati.

---

## 7. Verification Method (Metodo di Verifica Indipendente)

Per verificare in modo deterministico e indipendente le conclusioni del presente rapporto:

### 7.1 Verifica Intervento 1 (Filtro e Lookup Blocchetti)
1. **Comando di ispezione:**
   Aprire `src/views/BlocchettiView.vue` alle righe 136-140 e 163.
   Verificare che `activeFilter === 'attivi'` controlli solo `!b.data_restituzione`.
2. **Verifica della complessità:**
   Ispezionare la riga 75 di `src/views/BlocchettiView.vue`: confermare che `allSoci.value.find` risiede all'interno del ciclo `forEach` su `allPayments`.
3. **Condizione di invalidazione:**
   Se `activeFilter === 'attivi'` venisse modificato con `b.isReal && !b.data_restituzione`, il bug risulterebbe risolto.

### 7.2 Verifica Intervento 5 (`sql-wasm.wasm` e 404 in Produzione)
1. **Comando di ispezione:**
   Eseguire una ricerca per `locateFile` nel codice sorgente:
   `grep -n "locateFile" src/services/db.js`
   Confermare che le righe 1042 e 2302 presentano verbatim `locateFile: (file) => \`/${file}\``, privo di `import.meta.env.BASE_URL`.
2. **Verifica build:**
   Eseguire `npm run build`. Ispezionare `vite.config.js`: confermare `base: '/ceraiolo-digitale/'`.
   In produzione sotto percorso `/ceraiolo-digitale/`, `/${file}` punta a `/sql-wasm.wasm`, mentre la risorsa è distribuita in `/ceraiolo-digitale/sql-wasm.wasm`.
3. **Condizione di invalidazione:**
   Se le righe 1042 e 2302 venissero allineate con `new URL(import.meta.env.BASE_URL + file, window.location.href).href`, il difetto sarebbe risolto.

### 7.3 Test di Regressione della Suite
Eseguire la suite di test completa del repository per verificare che il codice sia intonso e verde:
```powershell
npm run test -- --run
```
Risultato verificato: 20 file di test superati, 284 test verdi.
Verificare l'integrità del working tree rispetto a `f0ec064`:
```powershell
git diff f0ec064 -- src
```
Risultato verificato: nessun file modificato in `src/`.
