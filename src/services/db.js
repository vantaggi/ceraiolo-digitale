import Dexie from 'dexie'
import initSqlJs from 'sql.js'

// Create a new Dexie database instance
export const db = new Dexie('CeraioloDigitaleDB')

// Define the database schema.
// This must match the structure defined in the developer manual.
// NOTE: We use compound indexes '++id' to make lookups faster.
db.version(1).stores({
  soci: `
    id,
    [cognome+nome],
    cognome,
    nome
  `,
  tesseramenti: `
    id_tesseramento,
    id_socio,
    anno
  `,
  local_changes: `
    ++id,
    table_name,
    record_id,
    change_type,
    timestamp
  `,
})

// A utility function to check if the database is empty.
// We'll use this to decide whether to show the import screen.
export async function isDatabaseEmpty() {
  const sociCount = await db.soci.count()
  return sociCount === 0
}

/**
 * Retrieves a sorted list of unique membership groups from the database.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of group names.
 */
export async function getUniqueGroups() {
  // Dexie's uniqueKeys is highly efficient for this operation.
  const groups = await db.soci.orderBy('gruppo_appartenenza').uniqueKeys()
  // Filter out any null or empty strings and return a sorted list.
  return groups.filter((g) => typeof g === 'string' && g.trim() !== '')
}

/**
 * Applies multiple filters and a text search to find members.
 * @param {object} filters - An object containing the filter criteria.
 * @param {string} filters.searchTerm - The text to search for in name/surname.
 * @param {string} filters.ageCategory - Can be 'tutti', 'maggiorenni', or 'minorenni'.
 * @param {string} filters.group - The membership group to filter by.
 * @returns {Promise<Array>} A promise that resolves to an array of matching members.
 */
export async function applyFiltersAndSearch(filters) {
  const { searchTerm, ageCategory, group } = filters
  let collection = db.soci.toCollection()

  // Apply filters sequentially. Dexie will optimize this.
  const finalResults = await collection
    .filter((socio) => {
      // 1. Age Filter
      let ageMatch = true
      if (ageCategory === 'maggiorenni' || ageCategory === 'minorenni') {
        if (!socio.data_nascita || isNaN(new Date(socio.data_nascita))) {
          ageMatch = false // Exclude records with invalid dates
        } else {
          const birthDate = new Date(socio.data_nascita)
          const today = new Date()
          let age = today.getFullYear() - birthDate.getFullYear()
          const m = today.getMonth() - birthDate.getMonth()
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
          }

          ageMatch = ageCategory === 'maggiorenni' ? age >= 18 : age < 18
        }
      }

      // 2. Group Filter
      let groupMatch = true
      if (group && group !== 'Tutti') {
        groupMatch = socio.gruppo_appartenenza === group
      }

      // 3. Search Term Filter
      let searchTermMatch = true
      if (searchTerm && searchTerm.trim() !== '') {
        const lowerCaseSearchTerm = searchTerm.toLowerCase()
        searchTermMatch =
          (socio.cognome && socio.cognome.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (socio.nome && socio.nome.toLowerCase().includes(lowerCaseSearchTerm))
      }

      return ageMatch && groupMatch && searchTermMatch
    })
    .toArray()

  return finalResults
}

/**
 * Retrieves a single member by their ID.
 * @param {number} id The ID of the member to retrieve.
 * @returns {Promise<Object|undefined>} A promise that resolves to the member object or undefined if not found.
 */
export async function getSocioById(id) {
  if (isNaN(id)) return undefined
  return db.soci.get(id)
}

/**
 * Retrieves all payments for a specific member, sorted by year descending.
 * @param {number} socioId The ID of the member.
 * @returns {Promise<Array>} A promise that resolves to an array of payment records.
 */
export async function getTesseramentiBySocioId(socioId) {
  return db.tesseramenti
    .where('id_socio')
    .equals(socioId)
    .reverse() // Sort by most recent year
    .sortBy('anno')
}

/**
 * Creates an export directory structure for database backups and exports
 * @returns {string} Path to the export directory
 */
function getExportDirectory() {
  return 'exports'
}

/**
 * Generates a timestamp string for file naming
 * @returns {string} Formatted timestamp (YYYY-MM-DD_HH-MM-SS)
 */
function generateTimestamp() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`
}

/**
 * Creates a log file with export metadata
 * @param {Object} exportData - Information about the export operation
 * @param {string} exportDir - Directory where files are exported
 */
async function createExportLog(exportData, exportDir) {
  const logContent = {
    export_timestamp: new Date().toISOString(),
    export_version: '1.0',
    export_type: 'single_device_backup',
    ...exportData
  }

  // In browser environment, we can't directly write files, but we can offer downloads
  // This function returns the log data for download purposes
  return logContent
}

/**
 * Exports the entire database to SQLite format
 * @param {string} [customFilename] - Optional custom filename for the export
 * @returns {Promise<Object>} Export result with file data and metadata
 */
export async function exportDatabaseToSqlite(customFilename = null) {
  try {
    const timestamp = generateTimestamp()
    const filename = customFilename || `ceraiolo_backup_${timestamp}.sqlite`

    // Initialize sql.js
    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    })

    // Create new SQLite database
    const sqliteDb = new SQL.Database()

    // Create tables
    sqliteDb.run(`
      CREATE TABLE Soci (
        id INTEGER PRIMARY KEY,
        cognome TEXT,
        nome TEXT,
        data_nascita TEXT,
        luogo_nascita TEXT,
        gruppo_appartenenza TEXT,
        data_prima_iscrizione INTEGER,
        note TEXT
      )
    `)

    sqliteDb.run(`
      CREATE TABLE Tesseramenti (
        id_tesseramento TEXT PRIMARY KEY,
        id_socio INTEGER,
        anno INTEGER,
        data_pagamento TEXT,
        quota_pagata REAL,
        numero_ricevuta INTEGER,
        numero_blocchetto INTEGER,
        FOREIGN KEY (id_socio) REFERENCES Soci (id)
      )
    `)

    // Export Soci table
    const sociData = await db.soci.toArray()
    const sociStmt = sqliteDb.prepare(
      'INSERT INTO Soci (id, cognome, nome, data_nascita, luogo_nascita, gruppo_appartenenza, data_prima_iscrizione, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )

    for (const socio of sociData) {
      sociStmt.run([
        socio.id,
        socio.cognome || null,
        socio.nome || null,
        socio.data_nascita || null,
        socio.luogo_nascita || null,
        socio.gruppo_appartenenza || null,
        socio.data_prima_iscrizione || null,
        socio.note || null
      ])
    }
    sociStmt.free()

    // Export Tesseramenti table
    const tesseramentiData = await db.tesseramenti.toArray()
    const tessStmt = sqliteDb.prepare(
      'INSERT INTO Tesseramenti (id_tesseramento, id_socio, anno, data_pagamento, quota_pagata, numero_ricevuta, numero_blocchetto) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )

    for (const tess of tesseramentiData) {
      tessStmt.run([
        tess.id_tesseramento,
        tess.id_socio,
        tess.anno,
        tess.data_pagamento || null,
        tess.quota_pagata || null,
        tess.numero_ricevuta || null,
        tess.numero_blocchetto || null
      ])
    }
    tessStmt.free()

    // Get binary data and create blob
    const binaryArray = sqliteDb.export()
    const blob = new Blob([binaryArray], { type: 'application/octet-stream' })

    // Create export metadata
    const exportMetadata = {
      filename,
      soci_count: sociData.length,
      tesseramenti_count: tesseramentiData.length,
      file_size: binaryArray.length,
      timestamp
    }

    sqliteDb.close()

    return {
      success: true,
      blob,
      filename,
      metadata: exportMetadata
    }
  } catch (error) {
    console.error('Database export failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Logga una modifica al database locale per tracking delle modifiche
 * @param {string} tableName - Nome della tabella modificata
 * @param {any} recordId - ID del record modificato
 * @param {string} changeType - Tipo di modifica ('create', 'update', 'delete')
 * @param {Object} [oldData] - Dati precedenti (per update)
 * @param {Object} [newData] - Dati nuovi
 */
export async function logLocalChange(tableName, recordId, changeType, oldData = null, newData = null) {
  try {
    await db.local_changes.add({
      table_name: tableName,
      record_id: recordId,
      change_type: changeType,
      timestamp: Date.now(),
      old_data: oldData,
      new_data: newData
    })
    console.log('Modifica loggata:', { tableName, recordId, changeType })
  } catch (error) {
    console.error('Errore nel logging della modifica:', error)
  }
}

/**
 * Sovrascrive il log delle modifiche, mantenendo solo le modifiche più recenti per record
 */
export async function cleanupChangeLog() {
  try {
    // Per ogni record, mantieni solo la modifica più recente
    const allChanges = await db.local_changes.orderBy('timestamp').reverse().toArray()
    const changeMap = new Map()

    // Crea mappa con solo l'ultima modifica per ogni record
    for (const change of allChanges) {
      const key = `${change.table_name}:${change.record_id}`
      if (!changeMap.has(key)) {
        changeMap.set(key, change)
      }
    }

    // Elimina tutti i log e inserisci solo quelli filtrati
    await db.local_changes.clear()
    await db.local_changes.bulkAdd(Array.from(changeMap.values()))

    console.log(`Changelog pulito: ridotto da ${allChanges.length} a ${changeMap.size} voci`)
  } catch (error) {
    console.error('Errore nel cleanup del changelog:', error)
  }
}

/**
 * Esporta il log delle modifiche come file separato
 */
export async function exportChangeLog() {
  try {
    const changes = await db.local_changes.orderBy('timestamp').toArray()

    const exportData = {
      export_type: 'changelog',
      export_timestamp: new Date().toISOString(),
      changes: changes
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const filename = `changelog_${new Date().toISOString().split('T')[0]}.json`

    return {
      success: true,
      blob,
      filename,
      changes_count: changes.length
    }
  } catch (error) {
    console.error('Errore esportazione changelog:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Exports database to SQLite format and triggers download via browser
 * @param {string} [customFilename] - Optional custom filename
 * @returns {Promise<boolean>} Success status
 */
export async function downloadDatabaseExport(customFilename = null) {
  const result = await exportDatabaseToSqlite(customFilename)

  if (result.success) {
    // Trigger download
    const url = URL.createObjectURL(result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Create and download log file
    const logData = await createExportLog(result.metadata, null)
    const logBlob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' })
    const logUrl = URL.createObjectURL(logBlob)
    const logA = document.createElement('a')
    logA.href = logUrl
    logA.download = `export_log_${result.metadata.timestamp}.json`
    document.body.appendChild(logA)
    logA.click()
    document.body.removeChild(logA)
    URL.revokeObjectURL(logUrl)

    return true
  }

  throw new Error(result.error || 'Export failed')
}

/**
 * Exports data for a single member and their payment history
 * @param {number} socioId - ID of the member to export
 * @returns {Promise<Object>} Export result for single member
 */
export async function exportSocioToSqlite(socioId) {
  try {
    // Get socio data
    const socio = await getSocioById(socioId)
    if (!socio) {
      throw new Error('Socio not found')
    }

    // Get tesseramenti data
    const tesseramenti = await getTesseramentiBySocioId(socioId)

    const timestamp = generateTimestamp()
    const filename = `socio_${socio.id}_${socio.cognome}_${socio.nome}_${timestamp}.sqlite`.replace(/\s+/g, '_')

    // Initialize sql.js
    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    })

    // Create new SQLite database
    const sqliteDb = new SQL.Database()

    // Create tables
    sqliteDb.run(`
      CREATE TABLE Soci (
        id INTEGER PRIMARY KEY,
        cognome TEXT,
        nome TEXT,
        data_nascita TEXT,
        luogo_nascita TEXT,
        gruppo_appartenenza TEXT,
        data_prima_iscrizione INTEGER,
        note TEXT
      )
    `)

    sqliteDb.run(`
      CREATE TABLE Tesseramenti (
        id_tesseramento TEXT PRIMARY KEY,
        id_socio INTEGER,
        anno INTEGER,
        data_pagamento TEXT,
        quota_pagata REAL,
        numero_ricevuta INTEGER,
        numero_blocchetto INTEGER,
        FOREIGN KEY (id_socio) REFERENCES Soci (id)
      )
    `)

    // Insert socio data
    const sociStmt = sqliteDb.prepare(
      'INSERT INTO Soci (id, cognome, nome, data_nascita, luogo_nascita, gruppo_appartenenza, data_prima_iscrizione, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    sociStmt.run([
      socio.id,
      socio.cognome || null,
      socio.nome || null,
      socio.data_nascita || null,
      socio.luogo_nascita || null,
      socio.gruppo_appartenenza || null,
      socio.data_prima_iscrizione || null,
      socio.note || null
    ])
    sociStmt.free()

    // Insert tesseramenti data
    const tessStmt = sqliteDb.prepare(
      'INSERT INTO Tesseramenti (id_tesseramento, id_socio, anno, data_pagamento, quota_pagata, numero_ricevuta, numero_blocchetto) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )

    for (const tess of tesseramenti) {
      tessStmt.run([
        tess.id_tesseramento,
        tess.id_socio,
        tess.anno,
        tess.data_pagamento || null,
        tess.quota_pagata || null,
        tess.numero_ricevuta || null,
        tess.numero_blocchetto || null
      ])
    }
    tessStmt.free()

    // Get binary data and create blob
    const binaryArray = sqliteDb.export()
    const blob = new Blob([binaryArray], { type: 'application/octet-stream' })

    sqliteDb.close()

    return {
      success: true,
      blob,
      filename,
      socio,
      tesseramenti_count: tesseramenti.length
    }
  } catch (error) {
    console.error('Single socio export failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Downloads export for a single member
 * @param {number} socioId - ID of the member to export
 * @returns {Promise<boolean>} Success status
 */
export async function downloadSocioExport(socioId) {
  const result = await exportSocioToSqlite(socioId)

  if (result.success) {
    const url = URL.createObjectURL(result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  }

  throw new Error(result.error || 'Export failed')
}
