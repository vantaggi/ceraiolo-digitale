/**
 * scripts/generate_synthetic_db.js
 * 
 * Generatore deterministico del Dataset Sintetico Realistico SQLite per l'audit
 * di Ceraiolo Digitale (Famiglia dei Santantoniari, Gubbio).
 * 
 * Requisiti vincolanti:
 * - >= 3.500 Soci con anagrafiche e distribuzioni realistiche eugubini
 * - 17.500 Pagamenti / Tesseramenti (anni 2018 - 2026)
 * - 1.000 Blocchetti fisici (10 ricevute per blocchetto)
 * - 5 Corner Case obbligatori:
 *    1. Soci a cavallo dei 18 anni nel 2026 (50 soci)
 *    2. Quote con buchi di pagamento / anni non consecutivi (300 soci)
 *    3. Soci storici senza pagamenti / dormienti (50 soci)
 *    4. Ricevute multi-socio (400 ricevute con 2-3 pagamenti)
 *    5. Quote rientro 25€ vs 10€ (200 soci)
 * - Output compatibile con schema SQLite atteso da ImportView.vue e db.js
 * 
 * Salva il file in: tests/fixtures/synthetic_ceraiolo_audit.sqlite
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import initSqlJs from 'sql.js'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const FIXTURES_DIR = path.join(ROOT_DIR, 'tests', 'fixtures')
const OUTPUT_DB_PATH = path.join(FIXTURES_DIR, 'synthetic_ceraiolo_audit.sqlite')

// PRNG con seed deterministico (Mulberry32) per riproducibilità al 100%
function createPRNG(seed = 19460515) {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6D2B79F5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = createPRNG(20261004)

function randomInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min
}

function pickWeighted(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rand() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

function pickRandom(arr) {
  return arr[Math.floor(rand() * arr.length)]
}

// Onomastica tipica di Gubbio
const COGNOMI_EUGUBINI = [
  'Fiorucci', 'Uccellani', 'Vagnarelli', 'Minelli', 'Panfili',
  'Rossi', 'Pierotti', 'Gaggiotti', 'Notari', 'Morelli',
  'Cacciamani', 'Fioriti', 'Vispi', 'Casagrande', 'Martinelli',
  'Bellucci', 'Berettoni', 'Ceccarelli', 'Coldagelli', 'Monacelli',
  'Salciarini', 'Tognoloni', 'Bedini', 'Radicchi', 'Farneti',
  'Sannipoli', 'Rogari', 'Bei', 'Fondacci', 'Menichetti',
  'Monarchi', 'Rughi', 'Sebastiani', 'Stocchi', 'Traversini', 'Urbani'
]

const COGNOMI_WEIGHTS = [
  12, 10, 9, 8, 7, 6, 6, 5, 5, 4,
  3, 3, 3, 3, 3, 3, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2
]

const NOMI_MASCHILI = [
  'Ubaldo', 'Antonio', 'Giorgio', 'Francesco', 'Mario', 'Marco', 'Luca', 'Andrea',
  'Matteo', 'Giovanni', 'Roberto', 'Pietro', 'Paolo', 'Alessandro', 'Lorenzo',
  'Stefano', 'Leonardo', 'Filippo', 'Simone', 'Davide', 'Federico', 'Michele',
  'Gabriele', 'Giacomo', 'Riccardo', 'Tommaso', 'Samuele', 'Edoardo', 'Fabio',
  'Daniele', 'Mattia', 'Angelo', 'Giuseppe', 'Enrico', 'Massimo', 'Alberto',
  'Valerio', 'Claudio', 'Diego', 'Manuel', 'Cristian', 'Nicola', 'Vincenzo',
  'Gianluca', 'Gianmarco', 'Guido', 'Marcello', 'Damiano', 'Carlo'
]

const NOMI_FEMMINILI = [
  'Maria', 'Chiara', 'Giulia', 'Francesca', 'Sara', 'Elena', 'Elisa', 'Martina',
  'Silvia', 'Alice', 'Valentina', 'Giorgia', 'Laura', 'Federica', 'Claudia',
  'Anna', 'Beatrice', 'Sofia', 'Camilla', 'Irene', 'Lucia', 'Marta', 'Veronica',
  'Eleonora', 'Caterina', 'Monica', 'Simona', 'Michela', 'Paola', 'Roberta',
  'Cristina', 'Angela', 'Teresa', 'Barbara', 'Sabrina', 'Daniela', 'Stefania',
  'Nadia', 'Rita', 'Cinzia', 'Antonella', 'Patrizia', 'Manuela', 'Alessandra',
  'Sonia', 'Gloria', 'Ilaria', 'Serena', 'Vanessa', 'Pamela'
]

const MANICCHIE = [
  'San Martino', 'Sant\'Agostino', 'San Pietro', 'Padule',
  'Madonna del Ponte', 'Branca', 'Semonte', 'Non specificata'
]
const MANICCHIE_WEIGHTS = [18, 17, 16, 12, 11, 9, 7, 10]

const LUOGHI_NASCITA = ['Gubbio', 'Perugia', 'Umbertide', 'Gualdo Tadino', 'Roma']
const LUOGHI_WEIGHTS = [90, 5, 2, 2, 1]

// Generazione date ISO
function formatDate(year, month, day) {
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

function randomDateInYear(year, startMonth = 1, endMonth = 12) {
  const m = randomInt(startMonth, endMonth)
  const d = randomInt(1, 28)
  return formatDate(year, m, d)
}

function randomPaymentDate(year) {
  // Pagamenti tesseramento tipicamente da gennaio a maggio
  const m = randomInt(1, 5)
  const d = randomInt(1, 28)
  return formatDate(year, m, d)
}

export async function generateSyntheticDatabase() {
  console.log('=== Generazione Dataset Sintetico Realistico Ceraiolo Digitale ===')
  
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true })
  }

  const SQL = await initSqlJs()
  const db = new SQL.Database()

  // 1. Creazione Tabelle Schema Ceraiolo Digitale
  db.run(`
    CREATE TABLE Soci (
      id INTEGER PRIMARY KEY,
      cognome TEXT NOT NULL,
      nome TEXT NOT NULL,
      data_nascita TEXT,
      luogo_nascita TEXT,
      gruppo_appartenenza TEXT,
      data_prima_iscrizione INTEGER NOT NULL,
      note TEXT
    );

    CREATE TABLE Tesseramenti (
      id_tesseramento TEXT PRIMARY KEY,
      id_socio INTEGER NOT NULL,
      anno INTEGER NOT NULL,
      data_pagamento TEXT NOT NULL,
      quota_pagata REAL NOT NULL,
      numero_ricevuta INTEGER NOT NULL,
      numero_blocchetto INTEGER NOT NULL,
      FOREIGN KEY (id_socio) REFERENCES Soci (id)
    );

    CREATE TABLE Blocchetti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_blocchetto INTEGER NOT NULL,
      ricevute_da INTEGER DEFAULT 1,
      ricevute_a INTEGER DEFAULT 10,
      assegnato_a TEXT,
      data_assegnazione TEXT,
      data_restituzione TEXT
    );

    CREATE TABLE Settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT
    );

    CREATE TABLE LocalChanges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT,
      change_type TEXT,
      record_id TEXT,
      timestamp TEXT,
      new_data TEXT
    );

    CREATE TABLE Metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)

  const soci = []
  const tesseramenti = []
  const blocchetti = []

  let currentSocioId = 1

  // ==========================================
  // CORNER CASE 1: Soci a cavallo dei 18 anni nel 2026 (50 soci, ID 1-50)
  // 25 nati tra gen-apr 2008 (maggiorenni a maggio 2026)
  // 25 nati tra giu-dic 2008 (17enni a maggio 2026 ma anno solare 2026-2008=18)
  // ==========================================
  for (let i = 1; i <= 50; i++) {
    const isFirstHalf = i <= 25
    const isMale = rand() > 0.45
    const nome = isMale ? pickRandom(NOMI_MASCHILI) : pickRandom(NOMI_FEMMINILI)
    const cognome = pickWeighted(COGNOMI_EUGUBINI, COGNOMI_WEIGHTS)
    const luogo = pickWeighted(LUOGHI_NASCITA, LUOGHI_WEIGHTS)
    const manicchia = pickWeighted(MANICCHIE, MANICCHIE_WEIGHTS)
    const dob = isFirstHalf 
      ? randomDateInYear(2008, 1, 4)  // Gen-Apr: gia maggiorenne
      : randomDateInYear(2008, 6, 12) // Giu-Dic: 17enne al voto/festa dei Ceri
    
    soci.push({
      id: currentSocioId,
      cognome,
      nome,
      data_nascita: dob,
      luogo_nascita: luogo,
      gruppo_appartenenza: manicchia,
      data_prima_iscrizione: 2022,
      note: isFirstHalf 
        ? 'Corner Case 1: Compimento 18 anni (H1 2008 - già maggiorenne)' 
        : 'Corner Case 1: Compimento 18 anni (H2 2008 - minorenne a maggio, discrepanza calcolo età)'
    })
    currentSocioId++
  }

  // ==========================================
  // CORNER CASE 2: Quote con buchi di pagamento / non consecutivi (300 soci, ID 51-350)
  // 150 pagano il 2026 (condono/sanatoria - in regola)
  // 150 non pagano il 2026 (arretrati multipli con buchi)
  // ==========================================
  for (let i = 1; i <= 300; i++) {
    const pays2026 = i <= 150
    const isMale = rand() > 0.4
    const nome = isMale ? pickRandom(NOMI_MASCHILI) : pickRandom(NOMI_FEMMINILI)
    const cognome = pickWeighted(COGNOMI_EUGUBINI, COGNOMI_WEIGHTS)
    const luogo = pickWeighted(LUOGHI_NASCITA, LUOGHI_WEIGHTS)
    const manicchia = pickWeighted(MANICCHIE, MANICCHIE_WEIGHTS)
    const birthYear = randomInt(1965, 2000)
    const dob = randomDateInYear(birthYear)

    soci.push({
      id: currentSocioId,
      cognome,
      nome,
      data_nascita: dob,
      luogo_nascita: luogo,
      gruppo_appartenenza: manicchia,
      data_prima_iscrizione: 2018,
      note: pays2026 
        ? 'Corner Case 2: Buchi pagamento storici (Ha pagato 2026 -> Condonato in regola)' 
        : 'Corner Case 2: Buchi pagamento storici (Non ha pagato 2026 -> Arretrati con buchi)'
    })
    currentSocioId++
  }

  // ==========================================
  // CORNER CASE 3: Soci storici senza pagamenti (50 soci, ID 351-400)
  // Esattamente 0 tesseramenti
  // ==========================================
  for (let i = 1; i <= 50; i++) {
    const isMale = rand() > 0.45
    const nome = isMale ? pickRandom(NOMI_MASCHILI) : pickRandom(NOMI_FEMMINILI)
    const cognome = pickWeighted(COGNOMI_EUGUBINI, COGNOMI_WEIGHTS)
    const luogo = pickWeighted(LUOGHI_NASCITA, LUOGHI_WEIGHTS)
    const manicchia = pickWeighted(MANICCHIE, MANICCHIE_WEIGHTS)
    const birthYear = randomInt(1945, 1985)
    const iscrizione = randomInt(1990, 2010)

    soci.push({
      id: currentSocioId,
      cognome,
      nome,
      data_nascita: randomDateInYear(birthYear),
      luogo_nascita: luogo,
      gruppo_appartenenza: manicchia,
      data_prima_iscrizione: iscrizione,
      note: 'Corner Case 3: Socio storico dormiente senza pagamenti'
    })
    currentSocioId++
  }

  // ==========================================
  // CORNER CASE 5: Quote rientro 25€ vs 10€ (200 soci, ID 401-600)
  // 100 Nuovi Iscritti 2026 (25€ prima iscrizione)
  // 50 Rientri maggiorenni (25€ penalità rientro dopo buco 2025)
  // 50 Rientri minorenni (10€ ordinaria, esenzione minori)
  // ==========================================
  for (let i = 1; i <= 200; i++) {
    const isMale = rand() > 0.45
    const nome = isMale ? pickRandom(NOMI_MASCHILI) : pickRandom(NOMI_FEMMINILI)
    const cognome = pickWeighted(COGNOMI_EUGUBINI, COGNOMI_WEIGHTS)
    const luogo = pickWeighted(LUOGHI_NASCITA, LUOGHI_WEIGHTS)
    const manicchia = pickWeighted(MANICCHIE, MANICCHIE_WEIGHTS)
    
    let birthYear, iscrizioneYear, note
    if (i <= 100) {
      // 100 Nuovi iscritti 2026
      birthYear = randomInt(1970, 2005)
      iscrizioneYear = 2026
      note = 'Corner Case 5: Nuova Iscrizione 2026 (Quota 25€)'
    } else if (i <= 150) {
      // 50 Rientri adulti con penalita
      birthYear = randomInt(1970, 2000)
      iscrizioneYear = 2020
      note = 'Corner Case 5: Rientro Adulto con buco 2025 (Quota penalità 25€)'
    } else {
      // 50 Rientri minorenni con esenzione penalita
      birthYear = randomInt(2010, 2014) // 12-16 anni
      iscrizioneYear = 2021
      note = 'Corner Case 5: Rientro Minorenne con buco 2025 (Quota ordinaria 10€, esente)'
    }

    soci.push({
      id: currentSocioId,
      cognome,
      nome,
      data_nascita: randomDateInYear(birthYear),
      luogo_nascita: luogo,
      gruppo_appartenenza: manicchia,
      data_prima_iscrizione: iscrizioneYear,
      note
    })
    currentSocioId++
  }

  // ==========================================
  // SOCI INATTIVI / CHURN (350 soci, ID 601-950)
  // Pagamenti vecchi (2018-2023), fermi dal 2024 o 2025
  // ==========================================
  for (let i = 1; i <= 350; i++) {
    const isMale = rand() > 0.4
    const nome = isMale ? pickRandom(NOMI_MASCHILI) : pickRandom(NOMI_FEMMINILI)
    const cognome = pickWeighted(COGNOMI_EUGUBINI, COGNOMI_WEIGHTS)
    const luogo = pickWeighted(LUOGHI_NASCITA, LUOGHI_WEIGHTS)
    const manicchia = pickWeighted(MANICCHIE, MANICCHIE_WEIGHTS)
    const birthYear = randomInt(1940, 1995)
    const iscrizione = randomInt(1995, 2018)

    soci.push({
      id: currentSocioId,
      cognome,
      nome,
      data_nascita: randomDateInYear(birthYear),
      luogo_nascita: luogo,
      gruppo_appartenenza: manicchia,
      data_prima_iscrizione: iscrizione,
      note: 'Socio storico inattivo / Churn da sollecitare'
    })
    currentSocioId++
  }

  // ==========================================
  // SOCI ORDINARI / REGOLARI (2.550 soci, ID 951-3500)
  // Totale soci = 3.500
  // Rispettano le quote statistiche (Senior 30%, Adulti 55%, Minori 15%)
  // ==========================================
  const remainingCount = 3500 - currentSocioId + 1
  for (let i = 0; i < remainingCount; i++) {
    const isMale = rand() > 0.45
    const nome = isMale ? pickRandom(NOMI_MASCHILI) : pickRandom(NOMI_FEMMINILI)
    const cognome = pickWeighted(COGNOMI_EUGUBINI, COGNOMI_WEIGHTS)
    const luogo = pickWeighted(LUOGHI_NASCITA, LUOGHI_WEIGHTS)
    const manicchia = pickWeighted(MANICCHIE, MANICCHIE_WEIGHTS)

    // Categoria eta: Senior 30%, Adulti 55%, Minorenni 15%
    const ageCategory = pickWeighted(['senior', 'adulto', 'minorenne'], [30, 55, 15])
    let birthYear
    if (ageCategory === 'senior') {
      birthYear = randomInt(1935, 1960)
    } else if (ageCategory === 'adulto') {
      birthYear = randomInt(1961, 2007)
    } else {
      birthYear = randomInt(2009, 2022)
    }

    const minIscrizione = Math.max(1980, birthYear)
    const iscrizione = randomInt(minIscrizione, 2025)

    soci.push({
      id: currentSocioId,
      cognome,
      nome,
      data_nascita: randomDateInYear(birthYear),
      luogo_nascita: luogo,
      gruppo_appartenenza: manicchia,
      data_prima_iscrizione: iscrizione,
      note: ''
    })
    currentSocioId++
  }

  console.log(`- Soci generati: ${soci.length}`)

  // ==========================================
  // CREAZIONE BLOCCHETTI (1.000 blocchetti)
  // #1 - #750: Storici (2018-2024), NON presenti in tabella Blocchetti (simulano DB legacy)
  // #751 - #900: Campagna 2025 (presenti, data_restituzione = '2025-05-30')
  // #901 - #950: Campagna 2026 in circolazione (data_restituzione = null)
  // #951 - #980: Campagna 2026 restituiti (data_restituzione = '2026-05-02')
  // #981 - #1000: Campagna 2026 vuoti pre-assegnati (senza ricevute)
  // ==========================================
  for (let b = 1; b <= 1000; b++) {
    if (b <= 750) {
      // Campagna storica: NON inserire in tabella Blocchetti!
      continue
    } else if (b <= 900) {
      // Campagna 2025
      const ceraiolo = `${pickRandom(NOMI_MASCHILI)} ${pickWeighted(COGNOMI_EUGUBINI, COGNOMI_WEIGHTS)}`
      blocchetti.push({
        numero_blocchetto: b,
        ricevute_da: 1,
        ricevute_a: 10,
        assegnato_a: ceraiolo,
        data_assegnazione: '2025-04-15',
        data_restituzione: '2025-05-30'
      })
    } else if (b <= 950) {
      // Campagna 2026 in corso (In Circolazione)
      const ceraiolo = `${pickRandom(NOMI_MASCHILI)} ${pickWeighted(COGNOMI_EUGUBINI, COGNOMI_WEIGHTS)}`
      blocchetti.push({
        numero_blocchetto: b,
        ricevute_da: 1,
        ricevute_a: 10,
        assegnato_a: ceraiolo,
        data_assegnazione: '2026-04-10',
        data_restituzione: null
      })
    } else if (b <= 980) {
      // Campagna 2026 restituiti
      const ceraiolo = `${pickRandom(NOMI_MASCHILI)} ${pickWeighted(COGNOMI_EUGUBINI, COGNOMI_WEIGHTS)}`
      blocchetti.push({
        numero_blocchetto: b,
        ricevute_da: 1,
        ricevute_a: 10,
        assegnato_a: ceraiolo,
        data_assegnazione: '2026-04-10',
        data_restituzione: '2026-05-02'
      })
    } else {
      // Campagna 2026 vuoti pre-assegnati
      const ceraiolo = `${pickRandom(NOMI_MASCHILI)} ${pickWeighted(COGNOMI_EUGUBINI, COGNOMI_WEIGHTS)}`
      blocchetti.push({
        numero_blocchetto: b,
        ricevute_da: 1,
        ricevute_a: 10,
        assegnato_a: ceraiolo,
        data_assegnazione: '2026-05-01',
        data_restituzione: null
      })
    }
  }

  console.log(`- Blocchetti registrati nella tabella: ${blocchetti.length} (su 1.000 totali)`)

  // ==========================================
  // GENERAZIONE PAGAMENTI / TESSERAMENTI
  // Obiettivo vincolante: esattamente 17.500 pagamenti
  // Assegnazione coerente a blocchetti (#1 - #750 storici, #751-#900 2025, #901-#980 2026)
  // Ricevute: 1 - 10 per ciascun blocchetto
  // ==========================================

  // Mappa di assegnazione blocchetti per anno
  // 2018: blocchetti 1-100
  // 2019: blocchetti 101-210
  // 2020: blocchetti 211-320
  // 2021: blocchetti 321-430
  // 2022: blocchetti 431-540
  // 2023: blocchetti 541-650
  // 2024: blocchetti 651-750
  // 2025: blocchetti 751-900
  // 2026: blocchetti 901-980
  function getBlocchettoForYear(year) {
    if (year === 2018) return randomInt(1, 100)
    if (year === 2019) return randomInt(101, 210)
    if (year === 2020) return randomInt(211, 320)
    if (year === 2021) return randomInt(321, 430)
    if (year === 2022) return randomInt(431, 540)
    if (year === 2023) return randomInt(541, 650)
    if (year === 2024) return randomInt(651, 750)
    if (year === 2025) return randomInt(751, 900)
    return randomInt(901, 980) // 2026
  }

  function addPayment(socioId, year, quota = 10.0, customBlocchetto = null, customRicevuta = null, customDate = null) {
    const bNum = customBlocchetto || getBlocchettoForYear(year)
    const rNum = customRicevuta || randomInt(1, 10)
    const pDate = customDate || randomPaymentDate(year)

    tesseramenti.push({
      id_tesseramento: uuidv4(),
      id_socio: socioId,
      anno: year,
      data_pagamento: pDate,
      quota_pagata: quota,
      numero_ricevuta: rNum,
      numero_blocchetto: bNum
    })
  }

  // 1. Pagamenti Corner Case 1 (Soci a cavallo dei 18 anni, ID 1-50)
  // Iscritti nel 2022, pagamenti 2022, 2023, 2024, 2025, 2026 (5 ciascuno = 250 pagamenti)
  for (let sId = 1; sId <= 50; sId++) {
    for (const y of [2022, 2023, 2024, 2025, 2026]) {
      addPayment(sId, y, 10.0)
    }
  }

  // 2. Pagamenti Corner Case 2 (Buchi di pagamento, ID 51-350)
  // 150 pagano [2019, 2020, 2022, 2024, 2026] (5 pagamenti = 750)
  // 150 pagano [2019, 2020, 2022, 2024] (4 pagamenti = 600)
  for (let i = 1; i <= 300; i++) {
    const sId = 50 + i
    const pays2026 = i <= 150
    const years = pays2026 ? [2019, 2020, 2022, 2024, 2026] : [2019, 2020, 2022, 2024]
    for (const y of years) {
      addPayment(sId, y, 10.0)
    }
  }

  // 3. Corner Case 3 (ID 351-400): ZERO PAGAMENTI (50 soci dormienti)

  // 4. Pagamenti Corner Case 5 (Quote rientro 25€ vs 10€, ID 401-600)
  // - 100 Nuovi Iscritti (401-500): pagano solo 2026 con quota 25€ (100 pagamenti)
  for (let sId = 401; sId <= 500; sId++) {
    addPayment(sId, 2026, 25.0)
  }
  // - 50 Rientri adulti (501-550): pagato 2023, 2024, salto 2025, pagano 2026 con quota 25€ (3*50 = 150 pagamenti)
  for (let sId = 501; sId <= 550; sId++) {
    addPayment(sId, 2023, 10.0)
    addPayment(sId, 2024, 10.0)
    addPayment(sId, 2026, 25.0) // Penalita 25€
  }
  // - 50 Rientri minori (551-600): pagato 2023, salto 2024-2025, pagano 2026 con quota 10€ (2*50 = 100 pagamenti)
  for (let sId = 551; sId <= 600; sId++) {
    addPayment(sId, 2023, 10.0)
    addPayment(sId, 2026, 10.0) // Ordinaria 10€ (esente da 25€)
  }

  // 5. Soci inattivi / Churn (ID 601-950, 350 soci)
  // Pagavano regolarmente tra 2018 e 2023 (media 3 pagamenti ciascuno = 1.050 pagamenti)
  for (let sId = 601; sId <= 950; sId++) {
    const count = randomInt(2, 4)
    const startYear = 2018
    for (let k = 0; k < count; k++) {
      addPayment(sId, startYear + k, 10.0)
    }
  }

  // 6. CORNER CASE 4: RICEVUTE MULTI-SOCIO (400 ricevute con 2 o 3 soci per ricevuta)
  // Generiamo 400 ricevute multi-socio accoppiando soci regolari (ID 951 - 2500)
  // Circa 300 con 2 soci e 100 con 3 soci = 900 pagamenti multi-socio raggruppati
  let multiSocioPaymentsCount = 0
  const multiSocioYears = [2024, 2025, 2026]
  for (let r = 1; r <= 400; r++) {
    const year = pickRandom(multiSocioYears)
    const bNum = getBlocchettoForYear(year)
    const rNum = randomInt(1, 10)
    const pDate = randomPaymentDate(year)
    const numMembers = r <= 300 ? 2 : 3 // 300 coppie, 100 terzetti

    for (let m = 0; m < numMembers; m++) {
      // Scegliamo un socio da ID 951..2000
      const targetSocioId = 951 + ((r * 3 + m) % 1000)
      addPayment(targetSocioId, year, 10.0, bNum, rNum, pDate)
      multiSocioPaymentsCount++
    }
  }

  console.log(`- Pagamenti finora accumulati (inclusi corner cases e multi-socio): ${tesseramenti.length}`)

  // 7. Completamento Pagamenti fino al target ESATTO di 17.500
  // Distribuiamo i rimanenti pagamenti sui soci ordinari (ID 951 - 3500)
  const targetTotalPayments = 17500
  const neededPayments = targetTotalPayments - tesseramenti.length

  if (neededPayments <= 0) {
    throw new Error(`Troppi pagamenti generati in anticipo: ${tesseramenti.length}`)
  }

  console.log(`- Generazione dei rimanenti ${neededPayments} pagamenti ordinari...`)

  // Creiamo una mappa di anni gia pagati per ciascun socio per evitare duplicati (id_socio + anno)
  const paidYearsMap = new Map()
  for (const t of tesseramenti) {
    const key = `${t.id_socio}_${t.anno}`
    paidYearsMap.set(key, true)
  }

  let added = 0
  let roundYear = 2018

  while (added < neededPayments) {
    for (let sId = 951; sId <= 3500 && added < neededPayments; sId++) {
      const socio = soci[sId - 1]
      // Il socio non puo pagare prima della sua iscrizione
      if (roundYear < socio.data_prima_iscrizione) continue

      const key = `${sId}_${roundYear}`
      if (!paidYearsMap.has(key)) {
        paidYearsMap.set(key, true)
        addPayment(sId, roundYear, 10.0)
        added++
      }
    }
    roundYear++
    if (roundYear > 2026) roundYear = 2018
  }

  console.log(`- Totale Pagamenti / Tesseramenti generati: ${tesseramenti.length}`)

  // ==========================================
  // INSERIMENTO DATI NEL DATABASE SQLITE
  // ==========================================
  console.log('- Inserimento record in SQLite con Prepared Statements...')

  // Insert Soci
  const sociStmt = db.prepare(`
    INSERT INTO Soci (id, cognome, nome, data_nascita, luogo_nascita, gruppo_appartenenza, data_prima_iscrizione, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  db.run('BEGIN TRANSACTION;')
  for (const s of soci) {
    sociStmt.run([
      s.id,
      s.cognome,
      s.nome,
      s.data_nascita,
      s.luogo_nascita,
      s.gruppo_appartenenza,
      s.data_prima_iscrizione,
      s.note || null
    ])
  }
  sociStmt.free()

  // Insert Tesseramenti
  const tessStmt = db.prepare(`
    INSERT INTO Tesseramenti (id_tesseramento, id_socio, anno, data_pagamento, quota_pagata, numero_ricevuta, numero_blocchetto)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  for (const t of tesseramenti) {
    tessStmt.run([
      t.id_tesseramento,
      t.id_socio,
      t.anno,
      t.data_pagamento,
      t.quota_pagata,
      t.numero_ricevuta,
      t.numero_blocchetto
    ])
  }
  tessStmt.free()

  // Insert Blocchetti
  const bloccoStmt = db.prepare(`
    INSERT INTO Blocchetti (numero_blocchetto, ricevute_da, ricevute_a, assegnato_a, data_assegnazione, data_restituzione)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  for (const b of blocchetti) {
    bloccoStmt.run([
      b.numero_blocchetto,
      b.ricevute_da,
      b.ricevute_a,
      b.assegnato_a,
      b.data_assegnazione,
      b.data_restituzione
    ])
  }
  bloccoStmt.free()

  // Insert Settings di default
  const settingsStmt = db.prepare(`
    INSERT INTO Settings (key, value, updated_at) VALUES (?, ?, ?)
  `)
  const defaultSettings = [
    { key: 'renewalYear', value: JSON.stringify(2026) },
    { key: 'defaultQuote', value: JSON.stringify(10) },
    { key: 'newMemberFee', value: JSON.stringify(25) },
    { key: 'reentryFee', value: JSON.stringify(25) },
    { key: 'darkTheme', value: JSON.stringify(false) },
    { key: 'societyName', value: JSON.stringify('Famiglia dei Santantoniari - Gubbio') }
  ]
  for (const s of defaultSettings) {
    settingsStmt.run([s.key, s.value, '2026-10-04T12:00:00Z'])
  }
  settingsStmt.free()

  // Insert Metadata
  const metaStmt = db.prepare(`
    INSERT INTO Metadata (key, value) VALUES (?, ?)
  `)
  metaStmt.run(['schema_version', '1'])
  metaStmt.run(['dataset_type', 'synthetic_audit_benchmark'])
  metaStmt.run(['generated_at', new Date().toISOString()])
  metaStmt.run(['total_soci', String(soci.length)])
  metaStmt.run(['total_tesseramenti', String(tesseramenti.length)])
  metaStmt.run(['total_blocchetti', '1000'])
  metaStmt.free()

  db.run('COMMIT;')

  // Esportazione del binario SQLite su file
  const dbBinary = db.export()
  const buffer = Buffer.from(dbBinary)
  fs.writeFileSync(OUTPUT_DB_PATH, buffer)

  const stats = fs.statSync(OUTPUT_DB_PATH)
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)

  console.log(`\n✅ Database SQLite generato con successo!`)
  console.log(`   Percorso: ${OUTPUT_DB_PATH}`)
  console.log(`   Dimensione: ${sizeMB} MB (${stats.size.toLocaleString()} bytes)`)
  console.log(`   Soci: ${soci.length}`)
  console.log(`   Tesseramenti: ${tesseramenti.length}`)
  console.log(`   Blocchetti registrati: ${blocchetti.length} (su 1.000 coperti)`)
  console.log(`   Multi-Socio Payments: ${multiSocioPaymentsCount}`)

  return {
    path: OUTPUT_DB_PATH,
    sizeBytes: stats.size,
    totalSoci: soci.length,
    totalTesseramenti: tesseramenti.length,
    totalBlocchetti: 1000
  }
}

// Esecuzione diretta via node
if (process.argv[1] && process.argv[1].endsWith('generate_synthetic_db.js')) {
  generateSyntheticDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Errore durante la generazione del database:', err)
      process.exit(1)
    })
}
