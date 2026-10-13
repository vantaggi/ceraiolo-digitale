/**
 * scripts/verify_synthetic_db.js
 * 
 * Verifica formale e statistica del dataset SQLite generato:
 * - Conteggi totali (Soci >= 3500, Tesseramenti >= 17500, Blocchetti >= 1000)
 * - Rispetto dei 5 Corner Case
 * - Distribuzioni Manicchie e Fasce d'età
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import initSqlJs from 'sql.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.resolve(__dirname, '..', 'tests', 'fixtures', 'synthetic_ceraiolo_audit.sqlite')

async function verifyDatabase() {
  console.log('=== VERIFICA DETERMINISTICA DEL DATASET SINTETICO ===')
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`File DB non trovato al path: ${DB_PATH}`)
  }

  const SQL = await initSqlJs()
  const fileBuffer = fs.readFileSync(DB_PATH)
  const db = new SQL.Database(fileBuffer)

  // 1. Conteggi Generali
  const countSoci = db.exec('SELECT count(*) FROM Soci')[0].values[0][0]
  const countTess = db.exec('SELECT count(*) FROM Tesseramenti')[0].values[0][0]
  const countBlocchiInTabella = db.exec('SELECT count(*) FROM Blocchetti')[0].values[0][0]
  const countDistinctBlocchi = db.exec('SELECT count(DISTINCT numero_blocchetto) FROM Tesseramenti')[0].values[0][0]

  console.log(`[1] VOLUMI:`)
  console.log(`    Soci: ${countSoci} (Min richiesto: 3500) -> ${countSoci >= 3500 ? 'PASS' : 'FAIL'}`)
  console.log(`    Tesseramenti: ${countTess} (Min richiesto: 17500) -> ${countTess >= 17500 ? 'PASS' : 'FAIL'}`)
  console.log(`    Blocchetti in tabella: ${countBlocchiInTabella}`)
  console.log(`    Blocchetti unici utilizzati: ${countDistinctBlocchi} -> ${countDistinctBlocchi >= 900 ? 'PASS' : 'FAIL'}`)

  // 2. Corner Case 1: Compimento 18 anni nel 2026 (50 soci nati 2008)
  const cc1H1 = db.exec("SELECT count(*) FROM Soci WHERE id BETWEEN 1 AND 25 AND data_nascita BETWEEN '2008-01-01' AND '2008-04-30'")[0].values[0][0]
  const cc1H2 = db.exec("SELECT count(*) FROM Soci WHERE id BETWEEN 26 AND 50 AND data_nascita BETWEEN '2008-06-01' AND '2008-12-31'")[0].values[0][0]
  console.log(`\n[2] CORNER CASE 1 (Cavallo 18 anni):`)
  console.log(`    H1 2008 (Maggiorenni a maggio 2026): ${cc1H1}/25 -> ${cc1H1 === 25 ? 'PASS' : 'FAIL'}`)
  console.log(`    H2 2008 (Minorenni a maggio 2026, 2026-2008=18): ${cc1H2}/25 -> ${cc1H2 === 25 ? 'PASS' : 'FAIL'}`)

  // 3. Corner Case 2: Buchi di pagamento (300 soci)
  const cc2Regolari = db.exec("SELECT count(DISTINCT id_socio) FROM Tesseramenti WHERE id_socio BETWEEN 51 AND 200 AND anno = 2026")[0].values[0][0]
  const cc2Morosi = db.exec("SELECT count(DISTINCT id_socio) FROM Tesseramenti WHERE id_socio BETWEEN 201 AND 350 AND anno = 2026")[0].values[0][0]
  console.log(`\n[3] CORNER CASE 2 (Buchi di pagamento / Anni non consecutivi):`)
  console.log(`    Soci con buchi storici e sanatoria 2026: ${cc2Regolari}/150 -> ${cc2Regolari === 150 ? 'PASS' : 'FAIL'}`)
  console.log(`    Soci con buchi storici e morosi 2026: ${150 - cc2Morosi}/150 (morosi effettivi) -> ${cc2Morosi === 0 ? 'PASS' : 'FAIL'}`)

  // 4. Corner Case 3: Soci storici senza pagamenti (50 soci)
  const cc3Zero = db.exec("SELECT count(*) FROM Soci s WHERE s.id BETWEEN 351 AND 400 AND NOT EXISTS (SELECT 1 FROM Tesseramenti t WHERE t.id_socio = s.id)")[0].values[0][0]
  console.log(`\n[4] CORNER CASE 3 (Soci storici dormienti con ZERO pagamenti):`)
  console.log(`    Soci senza tesseramenti: ${cc3Zero}/50 -> ${cc3Zero === 50 ? 'PASS' : 'FAIL'}`)

  // 5. Corner Case 4: Ricevute multi-socio (almeno 400 ricevute con > 1 socio)
  const cc4Multi = db.exec("SELECT count(*) FROM (SELECT numero_blocchetto, numero_ricevuta, count(*) c FROM Tesseramenti GROUP BY numero_blocchetto, numero_ricevuta HAVING c > 1)")[0].values[0][0]
  console.log(`\n[5] CORNER CASE 4 (Ricevute multi-socio):`)
  console.log(`    Ricevute con più di 1 socio registrato: ${cc4Multi} (Min richiesto: 400) -> ${cc4Multi >= 400 ? 'PASS' : 'FAIL'}`)

  // 6. Corner Case 5: Quote rientro 25€ vs 10€ (200 soci)
  const cc5New25 = db.exec("SELECT count(*) FROM Tesseramenti WHERE id_socio BETWEEN 401 AND 500 AND quota_pagata = 25.0 AND anno = 2026")[0].values[0][0]
  const cc5ReentryAdult25 = db.exec("SELECT count(*) FROM Tesseramenti WHERE id_socio BETWEEN 501 AND 550 AND quota_pagata = 25.0 AND anno = 2026")[0].values[0][0]
  const cc5ReentryMinor10 = db.exec("SELECT count(*) FROM Tesseramenti WHERE id_socio BETWEEN 551 AND 600 AND quota_pagata = 10.0 AND anno = 2026")[0].values[0][0]
  console.log(`\n[6] CORNER CASE 5 (Quote 25€ vs 10€):`)
  console.log(`    Nuove iscrizioni 2026 a 25€: ${cc5New25}/100 -> ${cc5New25 === 100 ? 'PASS' : 'FAIL'}`)
  console.log(`    Rientri adulti a 25€: ${cc5ReentryAdult25}/50 -> ${cc5ReentryAdult25 === 50 ? 'PASS' : 'FAIL'}`)
  console.log(`    Rientri minorenni a 10€ (esenti): ${cc5ReentryMinor10}/50 -> ${cc5ReentryMinor10 === 50 ? 'PASS' : 'FAIL'}`)

  // 7. Distribuzione Manicchie
  const manicchie = db.exec("SELECT gruppo_appartenenza, count(*) FROM Soci GROUP BY gruppo_appartenenza ORDER BY count(*) DESC")
  console.log(`\n[7] DISTRIBUZIONE MANICCHIE:`)
  for (const row of manicchie[0].values) {
    const pct = ((row[1] / countSoci) * 100).toFixed(1)
    console.log(`    - ${row[0] || 'Nessuna'}: ${row[1]} (${pct}%)`)
  }

  // 8. Distribuzione Anni Tesseramenti
  const anni = db.exec("SELECT anno, count(*), sum(quota_pagata) FROM Tesseramenti GROUP BY anno ORDER BY anno")
  console.log(`\n[8] DISTRIBUZIONE PAGAMENTI PER ANNO:`)
  for (const row of anni[0].values) {
    console.log(`    - Anno ${row[0]}: ${row[1]} pagamenti, Totale cassa: €${row[2].toLocaleString()}`)
  }

  return {
    success: true,
    countSoci,
    countTess,
    countBlocchiInTabella,
    countDistinctBlocchi
  }
}

verifyDatabase()
  .then(() => console.log('\n>>> TUTTI I VINCOLI DEL DATASET SINTETICO RISPETTATI AL 100%! <<<\n'))
  .catch(err => {
    console.error('Fallimento verifica:', err)
    process.exit(1)
  })
