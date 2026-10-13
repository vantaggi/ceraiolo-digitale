# RAPPORTO DI AUDIT E SURVEY TECNICA: CALCOLI CONTABILI/STATUTARI, MOTORE STAMPE/PDF, QUALITÀ CODICE E TEST
**Progetto:** Ceraiolo Digitale (Famiglia dei Santantoniari - Gubbio)  
**Ruolo:** Explorer (teamwork_preview_explorer_survey_calc_pdf)  
**Data:** 2026-10-04  
**Vincolo:** Audit di pura analisi in sola lettura (Nessuna modifica a `src/` o `tests/`)

---

## 1. SOMMARIO ESECUTIVO

La presente ricognizione ha analizzato in profondità l'architettura applicativa, le formule contabili e statutarie, il motore di generazione PDF e tessere, la conformità dell'Intervento 3, la qualità del codice (identificazione di codice morto e duplicato) e la robustezza della suite di test automatizzati (284 test su Vitest).

### Sintesi dei Risultati Chiave:
1. **Frattura architetturale sul Diritto di Voto Statutario:** Esiste una divergenza critica tra tre definizioni concorrenti dello status di elettore. In `src/services/db.js` (`getVotingEligibleMembers`), l'elettore deve aver pagato unicamente l'anno precedente ($T-1$) ed essere maggiorenne per differenza d'anni solari ($T - 18$). Nella Live Preview e nel PDF Lab di `src/views/ReportsView.vue`, il sistema valuta il giorno esatto di nascita rispetto alla data assembleare, applica una finestra a 4 anni ($T-3 \dots T$) e assegna stati differenziati (`Sì`, `Regolarizza`, `No`). Nel contempo, l'etichetta visuale dichiara la regola statutaria ufficiale: *«quote in regola negli ultimi 5 anni»*. Due utenti che stampano la lista elettorale dal pulsante rapido rispetto al PDF Lab ottengono elenchi incompatibili.
2. **Bug Temporali nelle Statistiche Storiche:** Le funzioni `getNewMembersByYear` (r. 1398) e `getMembersByGroup` (r. 1534) in `src/services/db.js` valutano la maggiore età confrontando la data di nascita con `new Date()` (la data odierna) anziché con l'anno di riferimento storico richiesto nel parametro del report. Un socio quindicenne nel 2020 che oggi ha 21 anni viene retroattivamente classificato come maggiorenne nel report del 2020.
3. **Discrepanza Nomenclatura Iscrizione:** `src/views/ReportsView.vue` (r. 2095) cerca la proprietà inesistente `member.data_iscrizione` anziché il campo dello schema Dexie/SQLite `member.data_prima_iscrizione`. Ciò causa il fallimento del calcolo dell'anzianità per i soci storici privi di pagamenti registrati, retrocedendoli erroneamente all'anno corrente.
4. **Esito Intervento 3 (Tessere Santantoniari):** 
   - **Funzionante in Anteprima Web:** Il componente `src/components/TesseraTemplate.vue` implementa correttamente il fallback grafico istituzionale (bordo bicolore oro/rosso ceraiolo, stemma araldico vettoriale, titolo e badge annuale) quando non è presente un'immagine di sfondo o un template PDF.
   - **Discrepanza Contenutistica e Araldica da Verificare:** Il motto latino *«In Fide et Honore»* (r. 37) e il sottotitolo *"GUBBIO"* (r. 25) compaiono unicamente nell'anteprima visuale e non nel PDF esportato (`src/services/export.js`). Tali diciture sono state introdotte senza riscontro documentale ufficiale e **devono essere formalmente validate o modificate dal Consiglio della Famiglia dei Santantoniari**.
   - **Ordinamento per Manicchia vs A-Z:** Pienamente funzionante sia nel selettore UI che nel motore di composizione PDF di `export.js` (r. 1027-1038).
5. **Codice Morto e Duplicazione Massiva:**
   - `src/views/ReportsBetaView.vue` (1.398 righe, 48 KB) è **codice morto al 100%**: il router (`src/router/index.js` r. 65) esegue un redirect a `/reports`, e il componente non è importato da nessun file.
   - `src/services/exportBeta.js` (452 righe, 15 KB) contiene la duplicazione letterale (copia-incolla) delle routine di impaginazione e tabelle di `src/services/export.js`.
   - `ReportsView.vue` è diventato un monolite ipertrofico di **3.816 righe** (122 KB).
6. **Fragilità della Suite di Test:** Nonostante 284 test verdi, l'intera suite si basa sul mock intensivo di `@/services/db`. Non esiste alcun test unitario che collaudi Dexie su un database simulato. Modali critiche (`AddPaymentModal.vue`, `ConfirmDeleteModal.vue`, `ErrorModal.vue`) e viste fondamentali (`ImportView.vue`, `BlocchettiView.vue`, `SocioDetailView.vue`) hanno **zero test unitari dedicati**.
7. **Rilevazione Critica su Intervento 5 (WASM Base Path):** `importDatabaseFromSqlite` (r. 2302) e `exportSingleSocioToSqlite` (r. 1042) in `src/services/db.js` hardcodano `locateFile: (file) => '/${file}'`, ignorando `import.meta.env.BASE_URL` (`/ceraiolo-digitale/`). Su ambiente di produzione (GitHub Pages), l'importazione del database fallisce con errore 404 sul file `sql-wasm.wasm`.

---

## 2. OBSERVATION (Evidenze Dirette e Riscontri nel Codice)

### 2.1 Area (b): Calcoli Contabili e Statutari

#### Osservazione B.1: Compimento dei 18 anni — Anno Solare vs Data Esatta
In `src/utils/payment.js` (e duplicato identico in `src/services/db.js` r. 1293-1311):
```javascript
// src/utils/payment.js:11-17
export function calculateAgeInYear(birthDateString, year) {
  if (!birthDateString) return 99 // Assume adult if no birthdate
  const birthDate = new Date(birthDateString)
  if (isNaN(birthDate.getTime())) return 99

  return year - birthDate.getFullYear()
}

// src/utils/payment.js:25-30
export function isExemptFromPayment(socio, year) {
  const age = calculateAgeInYear(socio.data_nascita, year)
  return age < 18
}
```
*Riscontro:* Il calcolo calcola unicamente `year - birthDate.getFullYear()`. Un ceraiolo nato il 31 dicembre 2008, nell'anno 2026 ha `2026 - 2008 = 18`. Il 15 maggio 2026 (giorno della Festa dei Ceri) ha 17 anni e 4 mesi, ma il sistema lo considera adulto non esente dal 1° gennaio 2026.

Viceversa, in `src/views/ReportsView.vue` (r. 2342-2347) per il calcolo elettorale:
```javascript
// src/views/ReportsView.vue:2342-2347
const birthDateObj = new Date(member.data_nascita)
let ageAtTarget = targetYear - birthDateObj.getFullYear()
const m = targetDateObj.getMonth() - birthDateObj.getMonth()
if (m < 0 || (m === 0 && targetDateObj.getDate() < birthDateObj.getDate())) {
  ageAtTarget--
}
if (ageAtTarget < 18) {
  aventeDiritto = false
  motivoEsclusione = 'Minorenne alla data elettorale'
}
```
*Riscontro:* Qui il calcolo tiene conto di mese e giorno esatti rispetto alla data dell'elezione (`targetDateObj`). Esistono quindi due definizioni incompatibili di "maggiorenne" nello stesso software.

#### Osservazione B.2: Frattura tripla sulla Regola degli Aventi Diritto al Voto
1. **Regola in `src/services/db.js` (r. 1681-1711) - `getVotingEligibleMembers`:**
   ```javascript
   const previousYear = targetYear - 1
   const adultBirthLimit = targetYear - 18
   const prevYearPayments = await db.tesseramenti.where('anno').equals(previousYear).toArray()
   const paidMemberIds = new Set(prevYearPayments.map((p) => p.id_socio))
   // Filtro:
   if (!paidMemberIds.has(socio.id)) return false
   if (!socio.data_nascita) return false
   const birthYear = new Date(socio.data_nascita).getFullYear()
   return birthYear <= adultBirthLimit
   ```
   *Criterio:* Pagato solo l'anno precedente ($T-1$) ed età per anno solare. Ignora i 5 anni precedenti e l'anno in corso.
2. **Regola in `src/views/ReportsView.vue` (r. 2358-2370) - `processedData` (Live Preview):**
   ```javascript
   const windowStart = Math.max(targetYear - 3, enrollmentYear)
   const windowEnd = targetYear
   // Calcola la finestra di 4 anni (T-3, T-2, T-1, T)
   // e verifica la catena dei pagamenti mancanti...
   ```
   *Criterio:* Finestra di 4 anni ($T-3 \dots T$). Non 5 anni.
3. **Indicazione visuale statutaria in `src/views/ReportsView.vue` (r. 454):**
   ```html
   <span class="toggle-hint">Statuto: diritto di voto riservato ai soci maggiorenni con quote in regola negli ultimi 5 anni.</span>
   ```
   *Criterio dichiarato:* 5 anni.  
   *Invocazione Quick Button (r. 1661):* Chiama `getVotingEligibleMembers(renewalYear.value)` (regola 1: 1 anno).  
   *Invocazione PDF Lab (r. 2325):* Esegue `processedData` (regola 2: 4 anni).

#### Osservazione B.3: Bug temporale in `getNewMembersByYear` e `getMembersByGroup`
In `src/services/db.js` (r. 1398-1405):
```javascript
// src/services/db.js:1398-1405
const birthDate = new Date(member.data_nascita)
const today = new Date() // <--- ERRORE: usa la data di sistema attuale!
let age = today.getFullYear() - birthDate.getFullYear()
const monthDiff = today.getMonth() - birthDate.getMonth()
if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
  age--
}
includeMember = ageCategory === 'maggiorenni' ? age >= 18 : age < 18
```
Identica logica difettosa a riga 1534-1541 (`getMembersByGroup`).  
*Riscontro:* Se l'utente estrae i nuovi iscritti minorenni del 2018, il filtro `minorenni` valuta se sono minorenni *oggi* (nel 2026), escludendo chi nel 2018 aveva 12 anni e oggi ne ha 20.

#### Osservazione B.4: Typo su campo iscrizione in `ReportsView.vue`
In `src/views/ReportsView.vue` (r. 2094-2101):
```javascript
const getEnrollmentYear = (member) => {
  if (member.data_iscrizione) { // <--- Il campo non esiste, è data_prima_iscrizione!
    return new Date(member.data_iscrizione).getFullYear()
  }
  const paidYears = member.tesseramenti?.map((t) => t.anno) || []
  if (paidYears.length > 0) return Math.min(...paidYears)
  return new Date().getFullYear() // Fallback errato all'anno corrente
}
```
*Riscontro:* Nello schema Dexie (`src/services/db.js` r. 16), il campo è `data_prima_iscrizione`. Un socio iscritto nel 2010 che non ha quote storiche caricate viene considerato iscritto nel 2026, alterando lo stato elettorale (etichettato come "Nuovo iscritto nell'anno" anziché socio moroso).

#### Osservazione B.5: Calcolo Cassa Blocchetto Privo di Filtro Annuale
In `src/views/BatchEntryView.vue` (r. 867-875):
```javascript
const payments = await db.tesseramenti
  .where('numero_blocchetto')
  .equals(bNum)
  .toArray()

bookletCashTotal.value = payments.reduce(
  (sum, p) => sum + (Number(p.quota_pagata) || 0),
  0,
)
```
Identica aggregazione senza filtro anno in `src/views/BlocchettiView.vue` (r. 45-70).  
*Riscontro:* La tabella `tesseramenti` ha sia `numero_blocchetto` che `anno`. Se i blocchetti fisici ricominciano da 1 ogni anno (prassi abituale nei comitati e famiglie ceriole), digitare il blocchetto 1 nel 2026 aggrega anche gli incassi del blocchetto 1 del 2025 e 2024.

---

### 2.2 Intervento 3: Anteprima Tessera, Fallback e Ordinamento Manicchia

#### Osservazione 3.1: Fallback Istituzionale in `TesseraTemplate.vue`
In `src/components/TesseraTemplate.vue` (r. 20-38):
```html
<!-- Institutional Fallback Header -->
<div v-if="!hasPdfTemplate && !backgroundImage" class="institutional-card-header">
  <div class="card-crest">
    <BaseIcon name="shield-check" :size="26" color="gold" />
  </div>
  <div class="card-org-title">FAMIGLIA DEI SANTANTONIARI</div>
  <div class="card-subtitle">GUBBIO</div>
  <div class="card-year-badge">TESSERA SOCIO {{ anno || new Date().getFullYear() }}</div>
</div>

<!-- Sezione dati socio -->
<div class="member-info">
  <div class="info-value name-value">{{ nomeCognome }}</div>
  <div class="info-value birthdate-value">{{ dataNascitaFormattata }}</div>
</div>

<!-- Institutional Fallback Footer -->
<div v-if="!hasPdfTemplate && !backgroundImage" class="institutional-card-footer">
  <div class="card-motto">«In Fide et Honore»</div>
</div>
```
*Stile applicato (r. 175-177):*
```css
.institutional-fallback {
  background: linear-gradient(145deg, #fffefb 0%, #f7f3ea 100%) !important;
  border: 3.5px double #b71c1c;
  box-shadow: inset 0 0 0 2px #c59b27, 0 4px 12px rgba(0, 0, 0, 0.12);
}
```

#### Osservazione 3.2: Discrepanza Fallback Web vs Generatore PDF
Nel file `src/services/export.js` (r. 1122-1148 per layout 6x e r. 1220-1245 per layout 1x):
- Viene disegnato un rettangolo avorio (`rgb(0.99, 0.985, 0.97)`) con bordo rosso ceraiolo (`rgb(0.718, 0.11, 0.11)`).
- Vengono stampati i testi: `FAMIGLIA DEI SANTANTONIARI` e `Tessera Socio ${renewalYear}`.
- **Assenze:** Il motto *«In Fide et Honore»* e la dicitura *"GUBBIO"* **non sono presenti** nel generatore PDF; esistono esclusivamente nel componente Vue a schermo.

#### Osservazione 3.3: Verifica Ordinamento Manicchia vs Alfabetico
Nel file `src/services/export.js` (r. 1027-1038):
```javascript
const sortBy = options.sortBy || 'alfabetico'
const sociOrdinati = [...soci].sort((a, b) => {
  if (sortBy === 'manicchia') {
    const groupA = (a.gruppo_appartenenza || '').trim().toLowerCase()
    const groupB = (b.gruppo_appartenenza || '').trim().toLowerCase()
    const gCmp = groupA.localeCompare(groupB)
    if (gCmp !== 0) return gCmp
  }
  const cCmp = (a.cognome || '').localeCompare(b.cognome || '')
  if (cCmp !== 0) return cCmp
  return (a.nome || '').localeCompare(b.nome || '')
})
```
In `src/views/ReportsView.vue` (r. 136-140): Selettore `<select id="cardSortOrder" v-model="cardSortBy">` con opzioni `manicchia` e `alfabetico`, impostato di default su `manicchia`.  
*Riscontro:* Pienamente conforme ed operativo.

---

### 2.3 Area (c): Stampe, PDF e Resoconti Cassa

1. **Layout Fogli Tessere 6x (`generateAllCardsPDF` in `export.js`):**
   - Foglio A4 (210x297 mm), 6 tessere da 85x54 mm su 2 colonne e 3 righe.
   - Calcolo esatto dei margini orizzontali (13.33 mm) e verticali (33.75 mm).
   - Supporta sia template grafico pre-caricato in PDF (`embeddedTemplate`) sia rettangoli di taglio con anagrafica tipografica (`wrapText` su Times-Italic).
2. **Resoconto Cassa Blocchetti (`generateBookletSummaryPDF` in `export.js` r. 1343):**
   - Calcola numero ricevute utilizzate (`usedReceiptsSet.size`), totale incassato per blocchetto e totale generale con tabella jsPDF.
   - A differenza delle viste web, a riga 1356 applica correttamente il filtro anno:
     `const matchYear = !targetYear || !t.anno || Number(t.anno) === targetYear`.
3. **Duplicazione Utility PDF in `src/services/exportBeta.js`:**
   - Righe 42-100 contengono duplicazioni autonome di `createPDFDocument`, `addPDFHeader`, `createPDFTable`, `loadImage` create esplicitamente per non toccare `export.js`.

---

### 2.4 Area (f): Qualità del Codice e Robustezza Test

#### Osservazione F.1: Codice Morto Certificato (`ReportsBetaView.vue`)
- File: `src/views/ReportsBetaView.vue` (dimensione: 47.864 byte, 1.398 righe).
- Router: `src/router/index.js` (r. 63-66):
  ```javascript
  {
    path: '/reports-beta',
    name: 'reports-beta',
    redirect: '/reports',
  }
  ```
- Scansione grezza globale: Nessun file in `src/` o nei test importa `ReportsBetaView.vue`. È un residuo congelato dopo la fusione in `ReportsView.vue`.

#### Osservazione F.2: Robustezza e Fragilità della Suite di Test
- Comando eseguito: `npm run test -- --run`.
- Esito: **20 file di test superati, 284 test verdi su 284**.
- Analisi approfondita dei file di test (`src/__tests__/`):
  - 12 file sono test "adversarial/challenger" sintetici mirati a convalidare i requisiti storici M1, M2, M3, M4.
  - **Mocking Totale del Database:** Tutti i test di `ReportsView` e `BatchEntryView` iniettano `vi.mock('@/services/db', ...)` con array JavaScript in memoria (`dbState.dynamicSoci`).
  - **Zero Test su Dexie Reale:** Nel progetto non è installato `fake-indexeddb`. Nessun test esegue query reali, indici composti o transazioni Dexie.
  - **Componenti e Pagine Scoperte (0% coverage):**
    - `AddPaymentModal.vue`
    - `ConfirmDeleteModal.vue`
    - `ErrorModal.vue`
    - `FilterPanel.vue`
    - `SocioCard.vue`
    - `ImportView.vue`
    - `BlocchettiView.vue`
    - `SettingsView.vue`
    - `SocioDetailView.vue`

---

### 2.5 Riscontro sugli Altri Interventi Recenti (1, 2, 4, 5, 6)

| Intervento | Oggetto | Stato Rilevato | Evidenza nel Codice |
|---|---|---|---|
| **1** | Tabella Blocchetti mostra storici importati | **Funziona** | `BlocchettiView.vue` (r. 42-124): `blocchettiDinamici` unisce `allPayments` con i blocchetti manuali ed espone paginazione a 50 elementi. |
| **2** | Scheda socio in tema scuro | **Funziona in parte** | `SocioDetailView.vue` (r. 998-1025): pulsante Modifica corretto con variabili CSS (`var(--color-surface)`). Tuttavia, pulsanti secondari (`.edit-btn-small`, `.delete-btn`) hanno touch target di soli 28-36px, violando WCAG 2.2 AA (min 44px). |
| **4** | Runtime error `props is not defined` in ConfirmDeleteModal | **Funziona (Risolto)** | `ConfirmDeleteModal.vue` (r. 57, 82): `const props = defineProps(...)` regolarmente dichiarato e collegato a `watch(() => props.isVisible)`. |
| **5** | Caricamento `sql-wasm.wasm` con base path | **NON FUNZIONA (Bug Critico)** | In `db.js` (r. 2302 per import e r. 1042 per export singolo socio) è presente `locateFile: (file) => '/${file}'`. Ignora `import.meta.env.BASE_URL` (`/ceraiolo-digitale/`), causando 404 in produzione. |
| **6** | PDF Lab 2 pilastri e Hub a 1400px | **Funziona** | `ReportsView.vue` (r. 272-560 e r. 3811): Pilastro 1 (Criteri) e Pilastro 2 (Impaginazione), chips filtri con dismiss e max-width 1400px. |

---

## 3. LOGIC CHAIN (Deduzioni e Ragionamento Concatenato)

1. **Dalla divergenza delle regole di voto (B.2) al rischio assembleare:**  
   - *Premessa:* La Famiglia dei Santantoniari celebra assemblee generali per l'elezione delle cariche e del Primo Capodieci. L'ammissione al voto è regolata dallo Statuto della Famiglia.
   - *Fatto:* Se un addetto stampa la lista dal tasto rapido della dashboard ottiene l'elenco calcolato da `getVotingEligibleMembers` ($T-1$). Se un altro addetto genera il PDF dal PDF Lab ottiene l'elenco calcolato su $T-3 \dots T$ con esclusione per giorno esatto.
   - *Deduzione:* I due elenchi conterranno nomi diversi. In sede di assemblea, ciò genererebbe contestazioni sulla legittimità delle votazioni. È imperativo unificare il calcolo su un'unica funzione condivisa che rifletta letteralmente lo Statuto della Famiglia dei Santantoniari.

2. **Dall'uso di `new Date()` nei report storici (B.3) all'inattendibilità dei dati:**  
   - *Premessa:* Un gestionale archivistico deve garantire riproducibilità temporale: estrarre un report per l'anno 2021 deve produrre lo stesso risultato sia oggi che tra 5 anni.
   - *Fatto:* `getNewMembersByYear` e `getMembersByGroup` calcolano l'età confrontando `data_nascita` con la data odierna del browser (`today`).
   - *Deduzione:* Ogni report storico filtrato per minorenni/maggiorenni perde coerenza man mano che il tempo avanza. È necessario sostituire `today` con `new Date(targetYear, 11, 31)`.

3. **Dall'hardcoding `/${file}` in sql.js (2.5 - Intervento 5) al blocco in produzione:**  
   - *Premessa:* L'app è configurata in `vite.config.js` con `base: '/ceraiolo-digitale/'` per il deploy su GitHub Pages o sottocartella web.
   - *Fatto:* `exportDatabaseToSqlite` usa correttamente `new URL(import.meta.env.BASE_URL + file, window.location.href).href` (r. 703). Tuttavia `importDatabaseFromSqlite` (r. 2302) usa `locateFile: (file) => '/${file}'`.
   - *Deduzione:* Quando l'utente su GitHub Pages tenta di importare il database SQLite iniziale, il browser richiede `/sql-wasm.wasm` anziché `/ceraiolo-digitale/sql-wasm.wasm`, ricevendo una pagina 404 HTML che fa fallire il parser WebAssembly. L'applicazione non può essere inizializzata.

4. **Dalla mancata validazione del motto e sottotitolo (Intervento 3) al rispetto identitario:**  
   - *Premessa:* I Ceri di Gubbio poggiano su una tradizione secolare e un'identità rigorosa custodita dalla Famiglia dei Santantoniari.
   - *Fatto:* La stringa «In Fide et Honore» e la dicitura "GUBBIO" sono state aggiunte arbitrariamente nel template HTML.
   - *Deduzione:* Non è compito dello sviluppatore inventare motti o titoli per un'istituzione centenaria. Tali diciture vanno rimosse o confermate esplicitamente dai rappresentanti della Famiglia.

5. **Dalla duplicazione `ReportsBetaView` / `exportBeta` al debito tecnico:**  
   - *Premessa:* Il requisito R2 prevedeva di fondere la beta nel report principale.
   - *Fatto:* La fusione è avvenuta per incorporazione (portando `ReportsView.vue` a 3.816 righe), ma i vecchi file (`ReportsBetaView.vue` e `exportBeta.js`) sono rimasti nell'albero dei sorgenti.
   - *Deduzione:* Aumentano il peso del repository, generano confusione su quale file mantenere ed espongono a importazioni errate.

---

## 4. CAVEATS (Limiti dell'Indagine e Aree non Esplorate)

1. **Mancanza del Testo Ufficiale dello Statuto della Famiglia dei Santantoniari:** L'analisi rileva le discrepanze tra codice e label dell'interfaccia, ma non avendo a disposizione il testo cartaceo integrale dello Statuto ufficiale approvato dall'Assemblea dei Santantoniari, la definizione esatta della finestra temporale (es. 5 anni consecutivi vs almeno 1 pagamento in 5 anni) deve essere confermata dal committente.
2. **Ambiente Hardware Offline:** L'audit è stato eseguito sull'ambiente Windows di sviluppo. Non sono state simulate stampanti termiche o stampanti tessere plastiche dedicate (es. Zebra/Fargo), concentrandosi sui formati standard A4 (6x) e singolo PDF A7/A8.
3. **Dataset Reale Riservato:** In conformità ai vincoli di privacy, l'analisi non ha fatto uso di anagrafiche reali di cittadini di Gubbio, ma di dati sintetici e ispezione statica del codice sorgente.

---

## 5. CONCLUSIONE E RACCOMANDAZIONI RAGIONATE

### 5.1 Tabella Sinottica delle Criticità Rilevate

| ID | Area | Gravità | Posizione Codice | Impatto |
|---|---|---|---|---|
| **CALC-01** | (b) Calcoli | **CRITICA** | `db.js:1681-1711` vs `ReportsView.vue:2358` | Elenchi elettorali discordanti tra Quick Button e PDF Lab. |
| **CALC-02** | (b) Calcoli | **ALTA** | `db.js:1398-1405`, `1534-1541` | Report storici nuovi iscritti/gruppi alterati dall'uso di `new Date()`. |
| **CALC-03** | (b) Calcoli | **ALTA** | `ReportsView.vue:2095` | Typo `member.data_iscrizione` vs `data_prima_iscrizione` altera anzianità. |
| **CALC-04** | (b) Calcoli | **MEDIA** | `BatchEntryView.vue:867`, `BlocchettiView.vue:49` | Totale cassa blocchetto calcolato sommando tutti gli anni d'archivio. |
| **WASM-01** | (a) Dati | **CRITICA** | `db.js:2302`, `1042` | Import database fallisce in produzione per mancato rispetto del base path. |
| **INT3-01** | (c) Stampe | **MEDIA** | `TesseraTemplate.vue:25, 37` | Motto «In Fide et Honore» e "GUBBIO" non verificati con la Famiglia. |
| **INT3-02** | (c) Stampe | **BASSA** | `export.js:1122` | Motto e sottotitolo presenti nell'anteprima web ma assenti nel PDF tessere. |
| **DEAD-01** | (f) Qualità | **MEDIA** | `src/views/ReportsBetaView.vue` | 1.398 righe di codice morto non referenziato da rimuovere. |
| **DEAD-02** | (f) Qualità | **MEDIA** | `src/services/exportBeta.js` | 452 righe duplicate da accorpare in `export.js`. |
| **TEST-01** | (f) Test | **ALTA** | `src/__tests__/` | 0 test su database Dexie reale; 0 test per le modali e viste principali. |
| **A11Y-01** | (d) UX | **MEDIA** | `SocioDetailView.vue:1315, 1338` | Touch target pulsanti secondari (28-36px) non conformi a WCAG 2.2 AA. |

---

### 5.2 Proposte di Nuove Funzionalità per la Famiglia dei Santantoniari (Area g)

In base alle peculiarità operative della festa e della gestione sociale della Famiglia a Gubbio, si propongono 7 interventi ad alto valore aggiunto:

1. **Registro Elettorale Digitale con Check-in al Seggio:**
   - *Bisogno:* Durante le assemblee elettorali per l'elezione del Primo Capodieci o del Consiglio, centinaia di ceraioli affluiscono ai seggi.
   - *Soluzione:* Modalità "Seggio Elettorale" con ricerca rapida per cognome/tessera, verifica istantanea del diritto di voto, spunta di avvenuto voto con timestamp (prevenzione voto multiplo) e possibilità di incasso quota arretrata "al volo" per regolarizzazione immediata.
2. **Anagrafica Referenti di Zona (Capimanicchia) e Scheda Consegna Blocchetti:**
   - *Bisogno:* I blocchetti vengono affidati a ceraioli fidati nelle varie zone (Interna, San Martino, Padule, Branca, Semonte, ecc.). Attualmente il campo `assegnato_a` è solo una stringa testuale libera.
   - *Soluzione:* Registro dei Referenti territoriali, con riepilogo: quanti blocchetti ha in carico ciascun referente, quante ricevute staccate, totale denaro contante da versare e verbale di resa di fine campagna.
3. **Tessera e Ricevuta Digitale Condivisibile (WhatsApp / PDF Singolo):**
   - *Bisogno:* Molti ceraioli santantoniari vivono fuori Gubbio (studenti o lavoratori a Roma, Milano, estero).
   - *Soluzione:* Pulsante "Invia Ricevuta/Tessera" che genera un'immagine PNG o mini-PDF ottimizzato per smartphone e apre la condivisione nativa WhatsApp/Email tramite Web Share API.
4. **Modulo di Chiusura e Quadratura Cassa Campagna Tesseramento:**
   - *Bisogno:* A giugno, terminata la Festa dei Ceri, il Consiglio deve approvare il rendiconto finanziario della campagna.
   - *Soluzione:* Report guidato di riconciliazione contabile: blocchetti totali stampati, distribuiti, resi intatti, resi parziali; totale incassato per contanti vs bonifici; generazione automatica del verbale di chiusura per il Collegio dei Probiviri/Revisori.
5. **Registro Storico di Fedeltà Ceraiola (Albo Anzianità):**
   - *Bisogno:* Valorizzare i santantoniari veterani in occasione della festa del 17 gennaio (Sant'Antonio Abate) o del 15 maggio.
   - *Soluzione:* Vista che calcola automaticamente gli anni continuativi di iscrizione ed evidenzia i soci con 25, 40 o 50 anni di appartenenza ininterrotta alla Famiglia, con generazione del relativo attestato di benemerenza ceraiola.
6. **Gestione Nuclei Familiari (Tesseramento di Famiglia):**
   - *Bisogno:* A Gubbio è frequente che un capo-famiglia rinnovi contestualmente la quota per sé, per il coniuge e per i figli.
   - *Soluzione:* Possibilità di collegare le anagrafiche dei familiari per saldare con un solo passaggio l'intero gruppo domestico mantenendo le distinte schede socio.
7. **Interfaccia Utente per l'Audit Log (`local_changes`):**
   - *Bisogno:* La tabella Dexie `local_changes` registra già tutte le mutazioni, ma non esiste una schermata per consultarla.
   - *Soluzione:* Pagina riservata agli amministratori per verificare chi ha modificato un pagamento, cambiato una data o cancellato un record, garantendo trasparenza contabile.

---

## 6. VERIFICATION METHOD (Metodo di Verifica Indipendente)

Per riprodurre ed eseguire una verifica autonoma delle evidenze riportate:

### 1. Verifica Bug sql-wasm con Base Path (Intervento 5)
- Ispezionare `src/services/db.js` alla riga 2302 e 1042:
  ```javascript
  locateFile: (file) => `/${file}`
  ```
- Eseguire la build: `npm run build`.
- Servire la cartella `dist/` sotto il prefisso `/ceraiolo-digitale/` (ad es. con un server statico locale) e tentare l'import di un database `.sqlite`. Verificare nei devtools la chiamata a `http://localhost:<porta>/sql-wasm.wasm` con errore 404 anziché `http://localhost:<porta>/ceraiolo-digitale/sql-wasm.wasm`.

### 2. Verifica Conflitto Logiche Diritto di Voto (Area b)
- Ispezionare `src/services/db.js:1681` (`getVotingEligibleMembers`): verificare che verifica solo `previousYear` ($T-1$).
- Ispezionare `src/views/ReportsView.vue:2358`: verificare che la finestra parte da `targetYear - 3`.
- Ispezionare `src/views/ReportsView.vue:454`: verificare la stringa "ultimi 5 anni".

### 3. Verifica Codice Morto `ReportsBetaView.vue` (Area f)
- Eseguire ricerca globale nel progetto:
  ```powershell
  Get-ChildItem -Recurse -Include *.js,*.vue,*.ts | Select-String "ReportsBetaView"
  ```
- Constatare che l'unica menzione nei sorgenti è in `src/router/index.js` come stringa di reindirizzamento senza alcun `import`.

### 4. Verifica Intervento 3 (Tessere e Motto)
- Ispezionare `src/components/TesseraTemplate.vue` alle righe 25 e 37.
- Ispezionare `src/services/export.js` alle righe 1122-1148 e 1220-1245: constatare che nel generatore PDF `pdf-lib` il motto «In Fide et Honore» e "GUBBIO" non sono implementati.
- Ispezionare `src/services/export.js` alle righe 1027-1038 per verificare il corretto funzionamento del sorting per Manicchia.

### 5. Verifica Suite di Test Vitest
- Eseguire da terminale:
  ```powershell
  npm run test -- --run
  ```
- Constatare che i 284 test risultano verdi, ma verificare che in `src/__tests__/challenger_m3_1_adversarial.spec.js` (r. 37-55) l'intero modulo `@/services/db` è sostituito da mock statici in memoria.
