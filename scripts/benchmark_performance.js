/**
 * scripts/benchmark_performance.js
 * 
 * Suite di Benchmark Prestazionali Quantitativi per Ceraiolo Digitale (Famiglia dei Santantoniari).
 * Esegue misurazioni reali e millimetriche su dataset sintetico:
 * 1. Parsing & Import SQLite (simulando ImportView.vue e db.js)
 * 2. Ricerca in Home su 3.500 soci (cognome, tessera, manicchia, filtri composti)
 * 3. Apertura scheda socio (getSocioById + tesseramenti vs getAllSociWithTesseramenti N+1)
 * 4. Caricamento e calcolo pagina Blocchetti (misurazione collo di bottiglia O(N*M) vs O(N+M))
 * 5. Generazione PDF reali (Tessere 6x per 100 soci, Elenco alfabetico 3.500 soci, Resoconto cassa)
 * 
 * Salva i risultati in: scripts/benchmark_results.json
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { performance } from 'perf_hooks'
import { fileURLToPath } from 'url'
import initSqlJs from 'sql.js'
import {
  generateAllCardsPDF,
  generateSociPDF,
  generateBookletSummaryPDF
} from '../src/services/export.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const DB_PATH = path.join(ROOT_DIR, 'tests', 'fixtures', 'synthetic_ceraiolo_audit.sqlite')
const RESULTS_JSON_PATH = path.join(__dirname, 'benchmark_results.json')

// Helper per statistiche matematiche (min, max, mean, p50, p95)
function calcStats(samples) {
  if (!samples || samples.length === 0) return { min: 0, max: 0, mean: 0, p50: 0, p95: 0 }
  const sorted = [...samples].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const sum = sorted.reduce((a, b) => a + b, 0)
  const mean = sum / sorted.length
  const p50 = sorted[Math.floor(sorted.length * 0.5)]
  const p95 = sorted[Math.floor(sorted.length * 0.95)]
  return {
    min: Number(min.toFixed(3)),
    max: Number(max.toFixed(3)),
    mean: Number(mean.toFixed(3)),
    p50: Number(p50.toFixed(3)),
    p95: Number(p95.toFixed(3))
  }
}


function getMemoryUsageMB() {
  const mem = process.memoryUsage()
  return {
    rss: Number((mem.rss / (1024 * 1024)).toFixed(2)),
    heapUsed: Number((mem.heapUsed / (1024 * 1024)).toFixed(2)),
    heapTotal: Number((mem.heapTotal / (1024 * 1024)).toFixed(2))
  }
}

export async function runBenchmarks() {
  console.log('======================================================================')
  console.log('   BENCHMARK PRESTAZIONALI QUANTITATIVI — CERAIOLO DIGITALE')
  console.log('======================================================================')
  console.log(`OS: ${os.type()} ${os.release()} (${os.arch()})`)
  console.log(`CPU: ${os.cpus()[0]?.model || 'N/A'} (${os.cpus().length} core)`)
  console.log(`Node.js: ${process.version}`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log('----------------------------------------------------------------------\n')

  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Database non trovato al path: ${DB_PATH}. Esegui prima scripts/generate_synthetic_db.js`)
  }

  const results = {
    metadata: {
      generatedAt: new Date().toISOString(),
      platform: `${os.type()} ${os.release()} (${os.arch()})`,
      cpu: os.cpus()[0]?.model || 'N/A',
      cores: os.cpus().length,
      nodeVersion: process.version,
      databasePath: DB_PATH,
      databaseSizeBytes: fs.statSync(DB_PATH).size
    },
    benchmarks: {}
  }

  // =========================================================================
  // BENCHMARK 1: PARSING E IMPORTAZIONE SQLITE (ImportView.vue / db.js)
  // =========================================================================
  console.log('[BENCHMARK 1] Parsing e Importazione SQLite...')
  const memBeforeImport = getMemoryUsageMB()
  const tImportStart = performance.now()

  // 1.1 Inizializzazione WASM
  const tWasmStart = performance.now()
  const SQL = await initSqlJs()
  const tWasmDuration = performance.now() - tWasmStart

  // 1.2 Lettura binaria del file
  const tReadStart = performance.now()
  const fileBuffer = fs.readFileSync(DB_PATH)
  const tReadDuration = performance.now() - tReadStart

  // 1.3 Parsing SQLite Database
  const tParseDbStart = performance.now()
  const sqliteDb = new SQL.Database(fileBuffer)
  const tParseDbDuration = performance.now() - tParseDbStart

  // 1.4 Estrazione Tabella Soci (3.500 record)
  const tSociStart = performance.now()
  const sociStmt = sqliteDb.prepare('SELECT * FROM Soci')
  const importedSoci = []
  while (sociStmt.step()) {
    importedSoci.push(sociStmt.getAsObject())
  }
  sociStmt.free()
  const tSociDuration = performance.now() - tSociStart

  // 1.5 Estrazione Tabella Tesseramenti (17.500 record)
  const tTessStart = performance.now()
  const tessStmt = sqliteDb.prepare('SELECT * FROM Tesseramenti')
  const importedTesseramenti = []
  while (tessStmt.step()) {
    importedTesseramenti.push(tessStmt.getAsObject())
  }
  tessStmt.free()
  const tTessDuration = performance.now() - tTessStart

  // 1.6 Estrazione Tabella Blocchetti
  const tBloccoStart = performance.now()
  const bloccoStmt = sqliteDb.prepare('SELECT * FROM Blocchetti')
  const importedBlocchetti = []
  while (bloccoStmt.step()) {
    importedBlocchetti.push(bloccoStmt.getAsObject())
  }
  bloccoStmt.free()
  const tBloccoDuration = performance.now() - tBloccoStart

  const totalImportDuration = performance.now() - tImportStart
  const memAfterImport = getMemoryUsageMB()

  results.benchmarks.importSQLite = {
    totalDurationMs: Number(totalImportDuration.toFixed(2)),
    wasmInitMs: Number(tWasmDuration.toFixed(2)),
    fileReadMs: Number(tReadDuration.toFixed(2)),
    dbParseMs: Number(tParseDbDuration.toFixed(2)),
    sociExtractionMs: Number(tSociDuration.toFixed(2)),
    sociCount: importedSoci.length,
    tesseramentiExtractionMs: Number(tTessDuration.toFixed(2)),
    tesseramentiCount: importedTesseramenti.length,
    blocchettiExtractionMs: Number(tBloccoDuration.toFixed(2)),
    blocchettiCount: importedBlocchetti.length,
    throughputRecordsPerSec: Number((((importedSoci.length + importedTesseramenti.length) / totalImportDuration) * 1000).toFixed(0)),
    memoryHeapUsedDeltaMB: Number((memAfterImport.heapUsed - memBeforeImport.heapUsed).toFixed(2))
  }

  console.log(`  -> Tempo Totale Importazione: ${results.benchmarks.importSQLite.totalDurationMs} ms`)
  console.log(`     - Inizializzazione WASM: ${results.benchmarks.importSQLite.wasmInitMs} ms`)
  console.log(`     - Parsing SQLite DB: ${results.benchmarks.importSQLite.dbParseMs} ms`)
  console.log(`     - Estrazione 3.500 Soci: ${results.benchmarks.importSQLite.sociExtractionMs} ms`)
  console.log(`     - Estrazione 17.500 Tesseramenti: ${results.benchmarks.importSQLite.tesseramentiExtractionMs} ms`)
  console.log(`     - Throughput: ${results.benchmarks.importSQLite.throughputRecordsPerSec.toLocaleString()} record/sec\n`)

  // =========================================================================
  // BENCHMARK 2: RICERCA IN HOME SU 3.500 SOCI (HomeView.vue)
  // =========================================================================
  console.log('[BENCHMARK 2] Ricerca in Home su 3.500 soci...')

  // Funzione di ricerca fedele a HomeView.vue / db.js applyFiltersAndSearch
  function executeSearch(sociList, criteria) {
    const { searchTerm, ageCategory, group } = criteria
    return sociList.filter(socio => {
      // 1. Age Filter
      if (ageCategory === 'maggiorenni' || ageCategory === 'minorenni') {
        if (!socio.data_nascita) return false
        const birthDate = new Date(socio.data_nascita)
        const today = new Date('2026-05-15') // Riferimento Festa dei Ceri 2026
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        if (ageCategory === 'maggiorenni' && age < 18) return false
        if (ageCategory === 'minorenni' && age >= 18) return false
      }

      // 2. Group Filter
      if (group && group !== 'Tutti') {
        if (socio.gruppo_appartenenza !== group) return false
      }

      // 3. Search Term (Multi-term AND logic)
      if (searchTerm && searchTerm.trim() !== '') {
        const terms = searchTerm.toLowerCase().trim().split(/\s+/)
        const inId = String(socio.id) === searchTerm.trim()
        const matchesName = terms.every(term => {
          const inNome = socio.nome && socio.nome.toLowerCase().includes(term)
          const inCognome = socio.cognome && socio.cognome.toLowerCase().includes(term)
          const inNote = socio.note && socio.note.toLowerCase().includes(term)
          return inNome || inCognome || inNote
        })
        return inId || matchesName
      }

      return true
    })
  }

  const searchScenarios = [
    { name: 'Cognome_Frequente_Fiorucci', criteria: { searchTerm: 'Fiorucci', ageCategory: 'tutti', group: 'Tutti' } },
    { name: 'Cognome_Raro_Traversini', criteria: { searchTerm: 'Traversini', ageCategory: 'tutti', group: 'Tutti' } },
    { name: 'Nome_Cognome_Ubaldo_Fiorucci', criteria: { searchTerm: 'Ubaldo Fiorucci', ageCategory: 'tutti', group: 'Tutti' } },
    { name: 'Tessera_ID_1042', criteria: { searchTerm: '1042', ageCategory: 'tutti', group: 'Tutti' } },
    { name: 'Filtro_Manicchia_San_Martino', criteria: { searchTerm: '', ageCategory: 'tutti', group: 'San Martino' } },
    { name: 'Composto_Minelli_Maggiorenni_SantAgostino', criteria: { searchTerm: 'Minelli', ageCategory: 'maggiorenni', group: 'Sant\'Agostino' } }
  ]

  const searchResultsData = {}
  const ITERATIONS_SEARCH = 50

  for (const scenario of searchScenarios) {
    const samples = []
    let matchCount = 0

    // Warm-up
    executeSearch(importedSoci, scenario.criteria)

    for (let i = 0; i < ITERATIONS_SEARCH; i++) {
      const t0 = performance.now()
      const res = executeSearch(importedSoci, scenario.criteria)
      const t1 = performance.now()
      samples.push(t1 - t0)
      matchCount = res.length
    }

    const stats = calcStats(samples)
    searchResultsData[scenario.name] = {
      ...stats,
      matchCount,
      iterations: ITERATIONS_SEARCH
    }

    console.log(`  -> Scenario [${scenario.name}]: media ${stats.mean} ms (P95: ${stats.p95} ms, risultati: ${matchCount})`)
  }

  results.benchmarks.searchHome = searchResultsData
  console.log('')

  // =========================================================================
  // BENCHMARK 3: APERTURA SCHEDA SOCIO (Single getSocioById vs Bulk N+1)
  // =========================================================================
  console.log('[BENCHMARK 3] Apertura Scheda Socio (Targeted vs Bulk N+1)...')

  // 3.1 Targeted lookup: getSocioById + getTesseramentiBySocioId su 100 soci casuali
  const socioByIdMap = new Map()
  importedSoci.forEach(s => socioByIdMap.set(s.id, s))

  // Raggruppamento tesseramenti per socio id
  const tessBySocioMap = new Map()
  importedTesseramenti.forEach(t => {
    if (!tessBySocioMap.has(t.id_socio)) tessBySocioMap.set(t.id_socio, [])
    tessBySocioMap.get(t.id_socio).push(t)
  })

  const sampleIds = Array.from({ length: 100 }, (_, i) => Math.floor((i + 1) * 34.5))
  const singleLookupTimes = []

  for (const id of sampleIds) {
    const t0 = performance.now()
    const socio = socioByIdMap.get(id)
    const tesseramenti = (tessBySocioMap.get(id) || []).sort((a, b) => b.anno - a.anno)
    const cardData = { ...socio, tesseramenti }
    const t1 = performance.now()
    singleLookupTimes.push(t1 - t0)
  }

  const singleLookupStats = calcStats(singleLookupTimes)

  // 3.2 Bulk N+1 query: simulazione di getAllSociWithTesseramenti()
  const memBeforeBulk = getMemoryUsageMB()
  const tBulkStart = performance.now()
  const bulkLoadedSoci = importedSoci.map(socio => {
    // Simulazione lookup e mapping individuale per tutti i 3.500 soci
    const tesseramenti = (tessBySocioMap.get(socio.id) || []).sort((a, b) => b.anno - a.anno)
    return {
      ...socio,
      tesseramenti
    }
  })
  const tBulkDuration = performance.now() - tBulkStart
  const memAfterBulk = getMemoryUsageMB()

  const rawAvgSingleMs = singleLookupTimes.reduce((a, b) => a + b, 0) / singleLookupTimes.length
  const avgSingleMs = rawAvgSingleMs > 0 ? rawAvgSingleMs : 0.0002
  const overheadRatio = Number((tBulkDuration / avgSingleMs).toFixed(0))

  results.benchmarks.socioCardQuery = {
    targetedSingleLookupMs: singleLookupStats,
    targetedSingleLookupUs: Number((rawAvgSingleMs * 1000).toFixed(1)),
    bulkAllSociWithTesseramentiMs: Number(tBulkDuration.toFixed(2)),
    bulkSociCount: bulkLoadedSoci.length,
    bulkMemoryDeltaMB: Number((memAfterBulk.heapUsed - memBeforeBulk.heapUsed).toFixed(2)),
    overheadRatioBulkVsSingle: overheadRatio
  }


  console.log(`  -> Targeted Single Lookup (1 socio): media ${singleLookupStats.mean} ms (P95: ${singleLookupStats.p95} ms)`)
  console.log(`  -> Bulk N+1 getAllSociWithTesseramenti (3.500 soci): ${results.benchmarks.socioCardQuery.bulkAllSociWithTesseramentiMs} ms`)
  console.log(`  -> Rapporto di carico Bulk vs Single: ${results.benchmarks.socioCardQuery.overheadRatioBulkVsSingle}x\n`)

  // =========================================================================
  // BENCHMARK 4: CARICAMENTO E AGGREGAZIONE PAGINA BLOCCHETTI (O(N*M) vs O(N+M))
  // =========================================================================
  console.log('[BENCHMARK 4] Pagina Blocchetti: Analisi Collo di Bottiglia O(N*M)...')

  // 4.1 Algoritmo Attuale (BlocchettiView.vue:42-83) - Scansione lineare O(N * M)
  console.log('  -> Esecuzione algoritmo attuale BlocchettiView.vue (O(N * M) = 17.500 * 3.500)...')
  const tLinearStart = performance.now()

  const mapLinear = new Map()
  importedTesseramenti.forEach(p => {
    const bNum = Number(p.numero_blocchetto) || 0
    const rNum = Number(p.numero_ricevuta) || 0
    if (bNum <= 0) return
    if (!mapLinear.has(bNum)) {
      mapLinear.set(bNum, {
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
    const blocco = mapLinear.get(bNum)
    blocco.countPagamenti++
    blocco.totaleIncassato += (Number(p.quota_pagata) || 0)
    if (rNum > 0) {
      if (!blocco.ricevuteMap.has(rNum)) blocco.ricevuteMap.set(rNum, [])
      // LINEAR FIND O(M) DENTRO O(N):
      const socio = importedSoci.find(s => s.id === p.id_socio)
      const nomeSocio = socio ? `${socio.cognome} ${socio.nome}` : 'Socio Eliminato'
      blocco.ricevuteMap.get(rNum).push({ ...p, socioNome: nomeSocio })
    }
  })
  const tLinearDuration = performance.now() - tLinearStart

  // 4.2 Algoritmo Ottimizzato con Hash Index (Map O(1)) -> Totale O(N + M)
  console.log('  -> Esecuzione algoritmo ottimizzato con Hash Index Map (O(N + M))...')
  const tOptimizedStart = performance.now()

  // Pre-indexing dei soci O(M)
  const socioFastMap = new Map()
  for (let i = 0; i < importedSoci.length; i++) {
    const s = importedSoci[i]
    socioFastMap.set(s.id, `${s.cognome} ${s.nome}`)
  }

  // Iterazione pagamenti O(N) con lookup O(1)
  const mapFast = new Map()
  for (let i = 0; i < importedTesseramenti.length; i++) {
    const p = importedTesseramenti[i]
    const bNum = Number(p.numero_blocchetto) || 0
    const rNum = Number(p.numero_ricevuta) || 0
    if (bNum <= 0) continue
    let blocco = mapFast.get(bNum)
    if (!blocco) {
      blocco = {
        numero_blocchetto: bNum,
        ricevuteMap: new Map(),
        countPagamenti: 0,
        totaleIncassato: 0,
        assegnato_a: 'Gestito dallo Storico',
        data_assegnazione: null,
        data_restituzione: null,
        isReal: false
      }
      mapFast.set(bNum, blocco)
    }
    blocco.countPagamenti++
    blocco.totaleIncassato += (Number(p.quota_pagata) || 0)
    if (rNum > 0) {
      let rList = blocco.ricevuteMap.get(rNum)
      if (!rList) {
        rList = []
        blocco.ricevuteMap.set(rNum, rList)
      }
      const nomeSocio = socioFastMap.get(p.id_socio) || 'Socio Eliminato'
      rList.push({ ...p, socioNome: nomeSocio })
    }
  }
  const tOptimizedDuration = performance.now() - tOptimizedStart

  const speedupFactor = Number((tLinearDuration / tOptimizedDuration).toFixed(1))

  results.benchmarks.blocchettiAggregation = {
    unoptimizedLinearMs: Number(tLinearDuration.toFixed(2)),
    optimizedMapMs: Number(tOptimizedDuration.toFixed(2)),
    speedupFactor,
    paymentsProcessed: importedTesseramenti.length,
    sociScanned: importedSoci.length,
    uniqueBlocchettiCount: mapLinear.size,
    complexityTheoretical: {
      unoptimized: 'O(N * M) ~ 61.250.000 iterazioni',
      optimized: 'O(N + M) ~ 21.000 operazioni'
    }
  }

  console.log(`  -> Algoritmo Lineare Attuale: ${results.benchmarks.blocchettiAggregation.unoptimizedLinearMs} ms`)
  console.log(`  -> Algoritmo Ottimizzato Hash Map: ${results.benchmarks.blocchettiAggregation.optimizedMapMs} ms`)
  console.log(`  -> Guadagno Prestazionale (Speedup): ${speedupFactor}x più veloce!\n`)

  // =========================================================================
  // BENCHMARK 5: GENERAZIONE PDF REALI
  // =========================================================================
  console.log('[BENCHMARK 5] Generazione PDF Reali...')

  // Preparazione soci con tesseramenti per i PDF
  const sociForPdf = importedSoci.map(s => ({
    ...s,
    tesseramenti: tessBySocioMap.get(s.id) || []
  }))

  // 5.1 Foglio 6x Tessere per 100 soci (pdf-lib)
  console.log('  -> Generazione Foglio 6x Tessere per 100 soci (generateAllCardsPDF)...')
  const sample100Soci = sociForPdf.slice(0, 100)
  const memBeforePdfCards = getMemoryUsageMB()
  const tPdfCardsStart = performance.now()
  const cardsResult = await generateAllCardsPDF(sample100Soci, 2026, { layout: '6x', sortBy: 'alfabetico' })
  const tPdfCardsDuration = performance.now() - tPdfCardsStart
  const memAfterPdfCards = getMemoryUsageMB()

  // 5.2 Elenco Alfabetico Completo per 3.500 soci (jsPDF)
  console.log('  -> Generazione Elenco Alfabetico Completo per 3.500 soci (generateSociPDF)...')
  const memBeforePdfList = getMemoryUsageMB()
  const tPdfListStart = performance.now()
  const listResult = await generateSociPDF(sociForPdf, 2026)
  const tPdfListDuration = performance.now() - tPdfListStart
  const memAfterPdfList = getMemoryUsageMB()

  // 5.3 Resoconto Cassa Blocchetti 2026 (jsPDF)
  console.log('  -> Generazione Resoconto Cassa Blocchetti 2026 (generateBookletSummaryPDF)...')
  const tPdfResocontoStart = performance.now()
  const resocontoResult = await generateBookletSummaryPDF(importedBlocchetti, importedTesseramenti, 2026)
  const tPdfResocontoDuration = performance.now() - tPdfResocontoStart

  results.benchmarks.pdfGeneration = {
    cards6xBatch100: {
      durationMs: Number(tPdfCardsDuration.toFixed(2)),
      sociCount: sample100Soci.length,
      pagesGenerated: Math.ceil((sample100Soci.length * 2) / 6),
      sizeBytes: cardsResult && cardsResult[0]?.blob ? cardsResult[0].blob.size : 0,
      memoryDeltaMB: Number((memAfterPdfCards.heapUsed - memBeforePdfCards.heapUsed).toFixed(2))
    },
    alphabeticalList3500: {
      durationMs: Number(tPdfListDuration.toFixed(2)),
      sociCount: sociForPdf.length,
      sizeBytes: listResult && listResult.blob ? listResult.blob.size : 0,
      memoryDeltaMB: Number((memAfterPdfList.heapUsed - memBeforePdfList.heapUsed).toFixed(2))
    },
    resocontoCassaBlocchetti: {
      durationMs: Number(tPdfResocontoDuration.toFixed(2)),
      blocchettiCount: importedBlocchetti.length,
      tesseramentiCount: importedTesseramenti.length,
      sizeBytes: resocontoResult && resocontoResult.blob ? resocontoResult.blob.size : 0
    }
  }

  console.log(`  -> Tessere 6x (100 soci): ${results.benchmarks.pdfGeneration.cards6xBatch100.durationMs} ms (${results.benchmarks.pdfGeneration.cards6xBatch100.sizeBytes.toLocaleString()} bytes)`)
  console.log(`  -> Elenco Alfabetico Completo (3.500 soci): ${results.benchmarks.pdfGeneration.alphabeticalList3500.durationMs} ms (${results.benchmarks.pdfGeneration.alphabeticalList3500.sizeBytes.toLocaleString()} bytes)`)
  console.log(`  -> Resoconto Cassa Blocchetti: ${results.benchmarks.pdfGeneration.resocontoCassaBlocchetti.durationMs} ms (${results.benchmarks.pdfGeneration.resocontoCassaBlocchetti.sizeBytes.toLocaleString()} bytes)\n`)

  // =========================================================================
  // SALVATAGGIO DEI RISULTATI
  // =========================================================================
  fs.writeFileSync(RESULTS_JSON_PATH, JSON.stringify(results, null, 2))
  console.log('======================================================================')
  console.log(`✅ BENCHMARK COMPLETATI CON SUCCESSO!`)
  console.log(`   Risultati esportati in: ${RESULTS_JSON_PATH}`)
  console.log('======================================================================\n')

  return results
}

// Esecuzione diretta
runBenchmarks()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Errore durante l\'esecuzione dei benchmark:', err)
    process.exit(1)
  })

