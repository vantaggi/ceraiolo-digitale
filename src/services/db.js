import Dexie from 'dexie'
import initSqlJs from 'sql.js'

// Create a new Dexie database instance
export const db = new Dexie('CeraioloDigitaleDB')

// Define the database schema.
// This must match the structure defined in the developer manual.
// NOTE: We use manual ID assignment for soci to maintain compatibility.
db.version(1).stores({
  soci: `
    id,
    [cognome+nome],
    cognome,
    nome,
    data_nascita,
    luogo_nascita,
    gruppo_appartenenza,
    data_prima_iscrizione,
    note
  `,
  tesseramenti: `
    id_tesseramento,
    id_socio,
    anno,
    data_pagamento,
    quota_pagata,
    numero_ricevuta,
    numero_blocchetto
  `,
  local_changes: `
    ++id,
    table_name,
    record_id,
    change_type,
    timestamp,
    old_data,
    new_data
  `,
})

// Version 2: Add settings table for dynamic templates
db.version(2).stores({
  settings: `
    key,
    value,
    updated_at
  `,
})

// Hooks for Auto-Backup
// We use dynamic import to avoid circular dependencies with backupService
const triggerBackup = () => {
  import('./backupService')
    .then(({ backupService }) => {
      backupService.notifyChange()
    })
    .catch((err) => console.error('Failed to trigger backup:', err))
}

db.soci.hook('creating', triggerBackup)
db.soci.hook('updating', triggerBackup)
db.soci.hook('deleting', triggerBackup)

db.tesseramenti.hook('creating', triggerBackup)
db.tesseramenti.hook('updating', triggerBackup)
db.tesseramenti.hook('deleting', triggerBackup)

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

      // 3. Search Term Filter (Multi-term AND logic)
      let searchTermMatch = true
      if (searchTerm && searchTerm.trim() !== '') {
        const terms = searchTerm.toLowerCase().trim().split(/\s+/) // Split by whitespace

        // Check if ALL terms match at least one field
        searchTermMatch = terms.every((term) => {
          const inNome = socio.nome && socio.nome.toLowerCase().includes(term)
          const inCognome = socio.cognome && socio.cognome.toLowerCase().includes(term)
          const inNote = socio.note && socio.note.toLowerCase().includes(term)
          // We can also search in ID if useful, but usually names are enough
          return inNome || inCognome || inNote
        })
      }

      return ageMatch && groupMatch && searchTermMatch
    })
    .toArray()

  return finalResults
}

/**
 * Search soci by name or surname (simple search for batch entry)
 * @param {string} searchTerm The search term to match against nome or cognome
 * @returns {Promise<Array>} A promise that resolves to an array of matching soci
 */
export async function searchSoci(searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') {
    return []
  }

  const terms = searchTerm.toLowerCase().trim().split(/\s+/)

  try {
    const results = await db.soci
      .filter((socio) => {
        // Check if ALL terms match at least one field
        return terms.every((term) => {
          const inNome = socio.nome && socio.nome.toLowerCase().includes(term)
          const inCognome = socio.cognome && socio.cognome.toLowerCase().includes(term)
          return inNome || inCognome
          // Note: Here we don't search in notes for quick add/search, but we could if needed.
          // Keeping it consistent with "finding a person" usually relies on name/surname.
        })
      })
      .toArray()

    return results
  } catch (error) {
    console.error('Error searching soci:', error)
    throw new Error(`Failed to search soci: ${error.message}`)
  }
}

/**
 * Retrieves a single member by their ID.
 * @param {number|string} id The ID of the member to retrieve.
 * @returns {Promise<Object|undefined>} A promise that resolves to the member object or undefined if not found.
 */
export async function getSocioById(id) {
  // Convert to number if it's a string
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id
  if (isNaN(numericId)) return undefined
  return db.soci.get(numericId)
}

/**
 * Retrieves all payments for a specific member, sorted by year descending.
 * @param {number|string} socioId The ID of the member.
 * @returns {Promise<Array>} A promise that resolves to an array of payment records.
 */
export async function getTesseramentiBySocioId(socioId) {
  // Convert to number if it's a string
  const numericId = typeof socioId === 'string' ? parseInt(socioId, 10) : socioId
  if (isNaN(numericId)) return []

  return db.tesseramenti
    .where('id_socio')
    .equals(numericId)
    .reverse() // Sort by most recent year
    .sortBy('anno')
}

/**
 * Retrieves all members with their payment history
 * @returns {Promise<Array>} A promise that resolves to an array of member objects with tesseramenti
 */
export async function getAllSociWithTesseramenti() {
  const soci = await db.soci.toArray()

  // Per ogni socio, carica i suoi tesseramenti
  const sociWithTesseramenti = await Promise.all(
    soci.map(async (socio) => {
      const tesseramenti = await getTesseramentiBySocioId(socio.id)
      return {
        ...socio,
        tesseramenti,
      }
    }),
  )

  return sociWithTesseramenti
}

/**
 * Deletes a socio and all their associated tesseramenti
 * @param {number} socioId - The ID of the socio to delete
 * @returns {Promise<void>}
 */
export async function deleteSocio(socioId) {
  if (!socioId || typeof socioId !== 'number') {
    throw new Error('Invalid socioId: must be a number')
  }

  try {
    // Get the socio data before deletion for logging
    const socioToDelete = await db.soci.get(socioId)
    if (!socioToDelete) {
      throw new Error(`Socio with id ${socioId} not found`)
    }

    // First delete all tesseramenti associated with this socio
    await db.tesseramenti.where('id_socio').equals(socioId).delete()

    // Then delete the socio
    await db.soci.delete(socioId)

    // Log the deletion
    await logLocalChange('soci', socioId, 'DELETE', socioToDelete, null)
  } catch (error) {
    console.error('Error deleting socio:', error)
    throw new Error(`Errore durante l'eliminazione del socio: ${error.message}`)
  }
}

/**
 * Update an existing socio
 * @param {number} socioId - The ID of the socio to update
 * @param {Object} socioData - The updated socio data
 * @returns {Promise<void>}
 */
export async function updateSocio(socioId, socioData) {
  if (!socioId || typeof socioId !== 'number') {
    throw new Error('Invalid socioId: must be a number')
  }

  if (!socioData || typeof socioData !== 'object') {
    throw new Error('Invalid socioData: must be an object')
  }

  try {
    // Get old data for logging
    const oldSocio = await db.soci.get(socioId)
    if (!oldSocio) {
      throw new Error(`Socio with id ${socioId} not found`)
    }

    await db.soci.update(socioId, socioData)

    // Log the update
    await logLocalChange('soci', socioId, 'UPDATE', oldSocio, { ...oldSocio, ...socioData })
  } catch (error) {
    console.error('Error updating socio:', error)
    throw new Error(`Errore durante l'aggiornamento del socio: ${error.message}`)
  }
}

/**
 * Export all soci data
 * @returns {Promise<Array>} Array of all soci records
 */
export async function exportAllSoci() {
  try {
    return await db.soci.toArray()
  } catch (error) {
    console.error('Error exporting soci:', error)
    throw new Error(`Errore durante l'esportazione dei soci: ${error.message}`)
  }
}

/**
 * Export all tesseramenti data
 * @returns {Promise<Array>} Array of all tesseramenti records
 */
export async function exportAllTesseramenti() {
  try {
    return await db.tesseramenti.toArray()
  } catch (error) {
    console.error('Error exporting tesseramenti:', error)
    throw new Error(`Errore durante l'esportazione dei tesseramenti: ${error.message}`)
  }
}

/**
 * Get a setting value by key
 * @param {string} key - The setting key
 * @returns {Promise<any>} The setting value or null if not found
 */
export async function getSetting(key, defaultValue = null) {
  try {
    const setting = await db.settings.get(key)
    return setting ? setting.value : defaultValue
  } catch (error) {
    console.error('Error getting setting:', error)
    return defaultValue
  }
}

/**
 * Update or create a setting
 * @param {string} key - The setting key
 * @param {any} value - The setting value
 * @returns {Promise<void>}
 */
export async function updateSetting(key, value) {
  try {
    await db.settings.put({
      key,
      value,
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error updating setting:', error)
    throw new Error(`Errore durante il salvataggio dell'impostazione: ${error.message}`)
  }
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
 */
async function createExportLog(exportData) {
  const logContent = {
    export_timestamp: new Date().toISOString(),
    export_version: '1.0',
    export_type: 'single_device_backup',
    ...exportData,
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
      locateFile: (file) => `/${file}`,
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
      'INSERT INTO Soci (id, cognome, nome, data_nascita, luogo_nascita, gruppo_appartenenza, data_prima_iscrizione, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
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
        socio.note || null,
      ])
    }
    sociStmt.free()

    // Export Tesseramenti table
    const tesseramentiData = await db.tesseramenti.toArray()
    const tessStmt = sqliteDb.prepare(
      'INSERT INTO Tesseramenti (id_tesseramento, id_socio, anno, data_pagamento, quota_pagata, numero_ricevuta, numero_blocchetto) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )

    for (const tess of tesseramentiData) {
      tessStmt.run([
        tess.id_tesseramento,
        tess.id_socio,
        tess.anno,
        tess.data_pagamento || null,
        tess.quota_pagata || null,
        tess.numero_ricevuta || null,
        tess.numero_blocchetto || null,
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
      timestamp,
    }

    sqliteDb.close()

    return {
      success: true,
      blob,
      filename,
      metadata: exportMetadata,
    }
  } catch (error) {
    console.error('Database export failed:', error)
    return {
      success: false,
      error: error.message,
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
export async function logLocalChange(
  tableName,
  recordId,
  changeType,
  oldData = null,
  newData = null,
) {
  try {
    await db.local_changes.add({
      table_name: tableName,
      record_id: recordId,
      change_type: changeType,
      timestamp: Date.now(),
      old_data: oldData,
      new_data: newData,
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
      changes: changes,
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const filename = `changelog_${new Date().toISOString().split('T')[0]}.json`

    return {
      success: true,
      blob,
      filename,
      changes_count: changes.length,
    }
  } catch (error) {
    console.error('Errore esportazione changelog:', error)
    return {
      success: false,
      error: error.message,
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
    const filename = `socio_${socio.id}_${socio.cognome}_${socio.nome}_${timestamp}.sqlite`.replace(
      /\s+/g,
      '_',
    )

    // Initialize sql.js
    const SQL = await initSqlJs({
      locateFile: (file) => `/${file}`,
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
      'INSERT INTO Soci (id, cognome, nome, data_nascita, luogo_nascita, gruppo_appartenenza, data_prima_iscrizione, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    sociStmt.run([
      socio.id,
      socio.cognome || null,
      socio.nome || null,
      socio.data_nascita || null,
      socio.luogo_nascita || null,
      socio.gruppo_appartenenza || null,
      socio.data_prima_iscrizione || null,
      socio.note || null,
    ])
    sociStmt.free()

    // Insert tesseramenti data
    const tessStmt = sqliteDb.prepare(
      'INSERT INTO Tesseramenti (id_tesseramento, id_socio, anno, data_pagamento, quota_pagata, numero_ricevuta, numero_blocchetto) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )

    for (const tess of tesseramenti) {
      tessStmt.run([
        tess.id_tesseramento,
        tess.id_socio,
        tess.anno,
        tess.data_pagamento || null,
        tess.quota_pagata || null,
        tess.numero_ricevuta || null,
        tess.numero_blocchetto || null,
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
      tesseramenti_count: tesseramenti.length,
    }
  } catch (error) {
    console.error('Single socio export failed:', error)
    return {
      success: false,
      error: error.message,
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

/**
 * Adds a new payment record for a member
 * @param {object} paymentData - The payment data to insert
 * @param {number|string} paymentData.id_socio - ID of the member
 * @param {number} paymentData.anno - Year of the payment
 * @param {number} paymentData.quota_pagata - Amount paid
 * @param {string} paymentData.data_pagamento - Date of payment (YYYY-MM-DD)
 * @param {number} paymentData.numero_ricevuta - Receipt number
 * @param {number} paymentData.numero_blocchetto - Block number
 * @returns {Promise<string>} ID of the created payment record
 */
export async function addTesseramento(paymentData) {
  try {
    const id_tesseramento = crypto.randomUUID()

    // Convert id_socio to number if it's a string
    const numericIdSocio =
      typeof paymentData.id_socio === 'string'
        ? parseInt(paymentData.id_socio, 10)
        : paymentData.id_socio

    if (isNaN(numericIdSocio)) {
      throw new Error('Invalid id_socio: must be a valid number')
    }

    const paymentRecord = {
      id_tesseramento,
      id_socio: numericIdSocio,
      anno: paymentData.anno,
      quota_pagata: paymentData.quota_pagata,
      data_pagamento: paymentData.data_pagamento,
      numero_ricevuta: paymentData.numero_ricevuta,
      numero_blocchetto: paymentData.numero_blocchetto,
    }

    await db.tesseramenti.add(paymentRecord)

    // Log the change for tracking
    await logLocalChange('tesseramenti', id_tesseramento, 'create', null, paymentRecord)

    return id_tesseramento
  } catch (error) {
    console.error('Error adding tesseramento:', error)
    throw new Error(`Failed to add payment record: ${error.message}`)
  }
}

/**
 * Deletes payment records for a specific member, receipt, and years
 * @param {number|string} socioId - ID of the member
 * @param {number} numeroRicevuta - Receipt number
 * @param {Array<number>} anni - Array of years to delete
 * @returns {Promise<number>} Number of deleted records
 */
export async function deleteTesseramentiByReceipt(socioId, numeroRicevuta, anni) {
  try {
    const numericSocioId = typeof socioId === 'string' ? parseInt(socioId, 10) : socioId
    if (isNaN(numericSocioId)) throw new Error('Invalid socioId')

    const tesseramentiToDelete = await db.tesseramenti
      .where('id_socio')
      .equals(numericSocioId)
      .and((t) => t.numero_ricevuta === numeroRicevuta && anni.includes(t.anno))
      .toArray()

    if (tesseramentiToDelete.length === 0) return 0

    const idsToDelete = tesseramentiToDelete.map((t) => t.id_tesseramento)

    await db.tesseramenti.bulkDelete(idsToDelete)

    // Log deletion for each record
    for (const tess of tesseramentiToDelete) {
      await logLocalChange('tesseramenti', tess.id_tesseramento, 'delete', tess, null)
    }

    return idsToDelete.length
  } catch (error) {
    console.error('Error deleting tesseramenti by receipt:', error)
    throw new Error(`Failed to delete payments: ${error.message}`)
  }
}

/**
 * Adds a new member to the database
 * @param {object} socioData - The member data to insert
 * @param {string} socioData.cognome - Last name
 * @param {string} socioData.nome - First name
 * @param {string} socioData.data_nascita - Date of birth (YYYY-MM-DD)
 * @param {string} socioData.luogo_nascita - Place of birth
 * @param {string} socioData.gruppo_appartenenza - Membership group
 * @param {number} [socioData.data_prima_iscrizione] - First registration year
 * @param {string} [socioData.note] - Notes
 * @returns {Promise<number>} ID of the created member
 */
export async function addSocio(socioData) {
  if (!socioData || typeof socioData !== 'object') {
    throw new Error('Invalid socioData: must be an object')
  }

  if (!socioData.cognome || !socioData.nome) {
    throw new Error('Invalid socioData: cognome and nome are required')
  }

  try {
    // Generate the next ID by finding the maximum existing ID
    const allSoci = await db.soci.toArray()
    const maxId = allSoci.length > 0 ? Math.max(...allSoci.map((s) => s.id)) : 0
    const newId = maxId + 1

    const socioRecord = {
      id: newId,
      cognome: socioData.cognome,
      nome: socioData.nome,
      data_nascita: socioData.data_nascita,
      luogo_nascita: socioData.luogo_nascita,
      gruppo_appartenenza: socioData.gruppo_appartenenza,
      data_prima_iscrizione: socioData.data_prima_iscrizione || new Date().getFullYear(),
      note: socioData.note || '',
    }

    await db.soci.add(socioRecord)

    // Log the change for tracking
    await logLocalChange('soci', newId, 'create', null, socioRecord)

    return newId
  } catch (error) {
    console.error('Error adding socio:', error)
    throw new Error(`Failed to add member: ${error.message}`)
  }
}

/**
 * Calculates the age of a member in a specific year
 * @param {string} birthDateString - Date of birth (YYYY-MM-DD)
 * @param {number} year - The year to calculate age for
 * @returns {number} Age in that year
 */
export function calculateAgeInYear(birthDateString, year) {
  if (!birthDateString) return 99 // Assume adult if no birthdate
  const birthDate = new Date(birthDateString)
  if (isNaN(birthDate.getTime())) return 99

  return year - birthDate.getFullYear()
}

/**
 * Checks if a member is exempt from payment for a specific year (e.g. minors)
 * @param {object} socio - The member object
 * @param {number} year - The year to check
 * @returns {boolean} True if exempt
 */
export function isExemptFromPayment(socio, year) {
  const age = calculateAgeInYear(socio.data_nascita, year)
  // Minors (< 18) are exempt from payment/arrears after their first registration
  // "negli anni successivi risultano sempre iscritti fino al 18 anno"
  return age < 18
}

// Get arretrati (anni non pagati) for a socio
export async function getArretrati(socioId) {
  try {
    // Convert socioId to number if it's a string
    const numericId = typeof socioId === 'string' ? parseInt(socioId, 10) : socioId
    if (isNaN(numericId)) return []

    const currentYear = new Date().getFullYear()

    // Get all tesseramenti for this socio
    const tesseramenti = await db.tesseramenti.where('id_socio').equals(numericId).toArray()

    // Find paid years
    const paidYears = new Set(tesseramenti.map((t) => t.anno))

    // Get socio's first registration year
    const socio = await db.soci.get(socioId)
    if (!socio) {
      console.warn(`Socio with id ${socioId} not found, returning empty arretrati`)
      return []
    }

    const firstYear = socio.data_prima_iscrizione || currentYear
    const arretrati = []

    // Check each year from first registration to current year
    for (let year = firstYear; year < currentYear; year++) {
      if (!paidYears.has(year)) {
        // If not paid, check if exempt (minor)
        if (!isExemptFromPayment(socio, year)) {
          arretrati.push(year)
        }
      }
    }

    return arretrati
  } catch (error) {
    console.error('Error getting arretrati:', error)
    // Return empty array instead of throwing to prevent crashes
    return []
  }
}

/**
 * Checks if one or more payments already exist for a specific member in given years.
 * @param {number|string} socioId The ID of the member.
 * @param {Array<number>} years An array of years to check.
 * @returns {Promise<number|null>} Returns the first year found that already has a payment, or null if none exist.
 */
export async function findExistingPaymentYear(socioId, years) {
  // Convert socioId to number if it's a string
  const numericId = typeof socioId === 'string' ? parseInt(socioId, 10) : socioId
  if (isNaN(numericId)) return null

  for (const year of years) {
    const count = await db.tesseramenti.where({ id_socio: numericId, anno: year }).count()
    if (count > 0) {
      return year // Return the first year that already exists
    }
  }
  return null // All clear
}

/**
 * Generates a list of new members for a specific year with age category filters
 * @param {number} year - The year to check for new members
 * @param {string} ageCategory - Filter: 'tutti', 'maggiorenni', or 'minorenni'
 * @returns {Promise<Array>} Array of new members for the year
 */
export async function getNewMembersByYear(year, ageCategory = 'tutti') {
  try {
    // Get all members
    const allMembers = await db.soci.toArray()

    // Filter members who have their first registration in the given year
    const newMembers = []

    for (const member of allMembers) {
      // Check if this member has a payment in the given year
      const paymentsInYear = await db.tesseramenti
        .where({ id_socio: member.id, anno: year })
        .toArray()

      if (paymentsInYear.length > 0) {
        // Check if this is their first year (no payments before this year)
        const paymentsBeforeYear = await db.tesseramenti
          .where('id_socio')
          .equals(member.id)
          .and((payment) => payment.anno < year)
          .toArray()

        if (paymentsBeforeYear.length === 0) {
          // This is a new member for this year
          // Apply age filter
          let includeMember = true

          if (ageCategory === 'maggiorenni' || ageCategory === 'minorenni') {
            if (!member.data_nascita || isNaN(new Date(member.data_nascita))) {
              includeMember = false // Exclude records with invalid dates
            } else {
              const birthDate = new Date(member.data_nascita)
              const today = new Date()
              let age = today.getFullYear() - birthDate.getFullYear()
              const monthDiff = today.getMonth() - birthDate.getMonth()
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--
              }

              includeMember = ageCategory === 'maggiorenni' ? age >= 18 : age < 18
            }
          }

          if (includeMember) {
            newMembers.push({
              ...member,
              primo_anno: year,
              tesseramenti: paymentsInYear,
            })
          }
        }
      }
    }

    return newMembers
  } catch (error) {
    console.error('Error getting new members by year:', error)
    throw new Error(`Errore nel recupero dei nuovi soci per l'anno ${year}: ${error.message}`)
  }
}

/**
 * Generates a complete list of all payments with age category filters
 * @param {string} ageCategory - Filter: 'tutti', 'maggiorenni', or 'minorenni'
 * @returns {Promise<Array>} Array of all payments with member info
 */
export async function getCompletePaymentList(ageCategory = 'tutti') {
  try {
    // Get all payments with member info
    const allPayments = await db.tesseramenti.toArray()
    const sociMap = new Map()

    // Get all soci data for lookup
    const allSoci = await db.soci.toArray()
    allSoci.forEach((socio) => sociMap.set(socio.id, socio))

    const filteredPayments = []

    for (const payment of allPayments) {
      const socio = sociMap.get(payment.id_socio)

      if (socio) {
        // Apply age filter
        let includePayment = true

        if (ageCategory === 'maggiorenni' || ageCategory === 'minorenni') {
          if (!socio.data_nascita || isNaN(new Date(socio.data_nascita))) {
            includePayment = false // Exclude records with invalid dates
          } else {
            const birthDate = new Date(socio.data_nascita)
            const today = new Date()
            let age = today.getFullYear() - birthDate.getFullYear()
            const m = today.getMonth() - birthDate.getMonth()
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--
            }

            includePayment = ageCategory === 'maggiorenni' ? age >= 18 : age < 18
          }
        }

        if (includePayment) {
          filteredPayments.push({
            ...payment,
            socio: socio,
          })
        }
      }
    }

    // Sort by socio name and then by year
    return filteredPayments.sort((a, b) => {
      const nameCompare = (a.socio.cognome + a.socio.nome).localeCompare(
        b.socio.cognome + b.socio.nome,
      )
      if (nameCompare !== 0) return nameCompare
      return a.anno - b.anno
    })
  } catch (error) {
    console.error('Error getting complete payment list:', error)
    throw new Error(`Errore nel recupero della lista completa dei pagamenti: ${error.message}`)
  }
}

/**
 * Generates a list of members by membership group with age and payment status filters
 * @param {string} gruppo - The membership group to filter by (optional)
 * @param {string} ageCategory - Filter: 'tutti', 'maggiorenni', or 'minorenni'
 * @param {string} paymentStatus - Filter: 'tutti', 'in_regola', or 'non_in_regola'
 * @returns {Promise<Array>} Array of members by group
 */
export async function getMembersByGroup(
  gruppo = null,
  ageCategory = 'tutti',
  paymentStatus = 'tutti',
) {
  try {
    console.log('getMembersByGroup called with:', { gruppo, ageCategory, paymentStatus })

    let sociQuery = db.soci.toCollection()

    // Apply group filter
    if (gruppo && gruppo !== 'Tutti') {
      sociQuery = sociQuery.filter((socio) => socio.gruppo_appartenenza === gruppo)
    }

    const soci = await sociQuery.toArray()
    console.log('Soci found after group filter:', soci.length)

    const currentYear = new Date().getFullYear()
    const result = []

    for (const socio of soci) {
      // Apply age filter
      let includeMember = true

      if (ageCategory === 'maggiorenni' || ageCategory === 'minorenni') {
        if (!socio.data_nascita || isNaN(new Date(socio.data_nascita))) {
          includeMember = false // Exclude records with invalid dates
        } else {
          const birthDate = new Date(socio.data_nascita)
          const today = new Date()
          let age = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
          }

          includeMember = ageCategory === 'maggiorenni' ? age >= 18 : age < 18
        }
      }

      console.log(`Socio ${socio.cognome} ${socio.nome}: age filter = ${includeMember}`)

      if (!includeMember) continue

      // Get payment info
      const payments = await getTesseramentiBySocioId(socio.id)
      const paidYears = new Set(payments.map((p) => p.anno))

      // Determine payment status
      const firstYear = socio.data_prima_iscrizione || Math.min(...paidYears) || currentYear
      let isInRegola = true

      for (let year = firstYear; year <= currentYear; year++) {
        if (!paidYears.has(year)) {
          // Check exemption
          if (!isExemptFromPayment(socio, year)) {
            isInRegola = false
            break
          }
        }
      }

      // Apply payment status filter
      let includeByPaymentStatus = true
      if (paymentStatus === 'in_regola') {
        includeByPaymentStatus = isInRegola
      } else if (paymentStatus === 'non_in_regola') {
        includeByPaymentStatus = !isInRegola
      }

      console.log(
        `Socio ${socio.cognome} ${socio.nome}: payment status filter = ${includeByPaymentStatus} (isInRegola: ${isInRegola})`,
      )

      if (includeByPaymentStatus) {
        result.push({
          ...socio,
          tesseramenti: payments,
          anni_pagati: Array.from(paidYears).sort(),
          in_regola: isInRegola,
        })
      }
    }

    console.log('Final result after all filters:', result.length)

    // Sort by group and then by name
    return result.sort((a, b) => {
      const groupCompare = (a.gruppo_appartenenza || '').localeCompare(b.gruppo_appartenenza || '')
      if (groupCompare !== 0) return groupCompare
      return (a.cognome + a.nome).localeCompare(b.cognome + b.nome)
    })
  } catch (error) {
    console.error('Error getting members by group:', error)
    throw new Error(`Errore nel recupero dei soci per gruppo: ${error.message}`)
  }
}

/**
 * Calculates the number of enrolled members per group for a specific year
 * @param {number} year - The year to calculate counts for
 * @returns {Promise<Array>} Array of objects { group, count } sorted by count descending
 */
export async function getGroupCountsForYear(year) {
  try {
    // 1. Get all payments for the year
    const payments = await db.tesseramenti.where('anno').equals(year).toArray()

    // Use a Set to ensure unique members (though technically one payment per year should exist)
    const paidMemberIds = new Set(payments.map((p) => p.id_socio))

    // 2. Get all members to check their group
    const allSoci = await db.soci.toArray()

    const counts = {}

    // 4. Ciclo su tutti i soci
    allSoci.forEach((socio) => {
      let isEnrolled = false
      const numericYear = Number(year)

      // 1. Ha pagato/rinnovato fisicamente quest'anno?
      if (paidMemberIds.has(socio.id)) {
        isEnrolled = true
      } else {
        // 2. Controllo Esenzione Minorenni
        // Se minorenne E iscritto (data_prima_iscrizione <= anno corrente o non definita ma assunto attivo)
        // Assumiamo che se è nel DB ed è minore, vada contato se la sua iscrizione non è FUTURA

        // Verifica se è esente (minorenne)
        const isMinor = isExemptFromPayment(socio, numericYear)

        if (isMinor) {
          // Verifica data inizio validità
          // Se data_prima_iscrizione c'è, deve essere <= numericYear
          // Se NON c'è, per sicurezza lo contiamo (magari importato senza data)
          let isValidStart = true
          if (socio.data_prima_iscrizione) {
            isValidStart = socio.data_prima_iscrizione <= numericYear
          }

          if (isValidStart) {
            isEnrolled = true
          }
        }
      }

      if (isEnrolled) {
        let group = socio.gruppo_appartenenza || 'Non Assegnato'
        // Normalize: trim and uppercase
        group = group.trim().toUpperCase()
        counts[group] = (counts[group] || 0) + 1
      }
    })

    // Convert to array and sort by count descending
    const result = Object.entries(counts)
      .map(([group, count]) => ({ group, count }))
      .sort((a, b) => b.count - a.count)

    // Add total count logic if needed by the consumer, but returning the breakdown is enough
    return result
  } catch (error) {
    console.error('Error getting group counts:', error)
    throw new Error(`Errore nel calcolo dei totali per gruppo: ${error.message}`)
  }
}

/**
 * Calcola le statistiche annuali per i grafici
 * @param {number} startYear - Anno di inizio (opzionale, default: 5 anni fa)
 * @param {number} endYear - Anno di fine (opzionale, default: anno corrente)
 * @returns {Promise<Array>} Array di oggetti { year, total, newMembers, lostMembers }
 */
export async function getYearlyStats(startYear, endYear) {
  try {
    const currentYear = new Date().getFullYear()
    const start = startYear || currentYear - 4
    const end = endYear || currentYear

    const allSoci = await db.soci.toArray()

    // Cache di tutti i tesseramenti per evitare query multiple
    const allTesseramenti = await db.tesseramenti.toArray()
    // Mappa: socioId -> Set di anni pagati
    const paymentsMap = new Map()

    allTesseramenti.forEach((t) => {
      if (!paymentsMap.has(t.id_socio)) {
        paymentsMap.set(t.id_socio, new Set())
      }
      paymentsMap.get(t.id_socio).add(t.anno)
    })

    const stats = []

    // Helper per verificare l'iscrizione in un dato anno
    const isEnrolledInYear = (socio, year) => {
      // 1. Pagamento esplicito
      if (paymentsMap.has(socio.id) && paymentsMap.get(socio.id).has(year)) {
        return true
      }
      // 2. Esenzione Minori
      // Se minorenne esente
      const numericYear = Number(year)
      if (isExemptFromPayment(socio, numericYear)) {
        // Se ha una data di iscrizione, deve essere valida (non futura)
        // IMPORTANTE: Se NON ha data_prima_iscrizione e NON ha pagato,
        // tecnicamente non sappiamo quando si è iscritto, quindi NON dovremmo contarlo per evitare falsi positivi negli anni passati.
        // Tuttavia, se vogliamo essere permissivi per i dati importati male, potremmo controllare se hanno pagamenti in ANNI SUCCESSIVI
        // che confermerebbero l'iscrizione passata? Per ora rimaniamo fedeli alla richiesta: "da dopo la prima iscrizione".
        // Quindi la data DEVE esserci ed essere <= numericYear.

        if (socio.data_prima_iscrizione && socio.data_prima_iscrizione <= numericYear) {
          return true
        }
      }
      return false
    }

    // Calcolo per ogni anno
    for (let year = start; year <= end; year++) {
      let total = 0
      let newMembers = 0
      let lostMembers = 0 // Iscritti l'anno prima ma non questo

      // Set di ID iscritti quest'anno (per calcolo churn anno successivo o verifica)
      const enrolledThisYear = new Set()

      // 1. Calcola Totale e Nuovi
      for (const socio of allSoci) {
        if (isEnrolledInYear(socio, year)) {
          total++
          enrolledThisYear.add(socio.id)

          // Verifica se è NUOVO
          // È nuovo se:
          // a) Sua data_prima_iscrizione è esattamente questo anno
          // b) OPPURE non ha data_prima_iscrizione ma il suo PRIMO pagamento è questo anno
          //    (e non era iscritto l'anno prima come minore - caso limite, semplifichiamo)

          let isNew = false
          if (socio.data_prima_iscrizione === year) {
            isNew = true
          } else if (!socio.data_prima_iscrizione) {
            // Fallback: controlla se questo è il primo anno di pagamento assoluto
            const years = paymentsMap.get(socio.id)
            if (years) {
              const minYear = Math.min(...Array.from(years))
              if (minYear === year) isNew = true
            }
          }

          if (isNew) newMembers++
        }
      }

      // 2. Calcola Non Rinnovati (Churn)
      // Solo se non siamo al primo anno del loop (o serve query anno precedente)
      // Per semplicità, ricalcoliamo gli iscritti dell'anno precedente
      if (year > start) {
        // Recuperiamo chi era iscritto l'anno scorso
        const prevYear = year - 1

        for (const socio of allSoci) {
          if (isEnrolledInYear(socio, prevYear)) {
            // Se era iscritto l'anno scorso...
            // ...e NON è iscritto quest'anno
            if (!enrolledThisYear.has(socio.id)) {
              lostMembers++
            }
          }
        }
      }

      stats.push({
        year,
        total,
        newMembers,
        lostMembers,
      })
    }

    return stats
  } catch (error) {
    console.error('Error calculating yearly stats:', error)
    throw new Error('Errore nel calcolo delle statistiche annuali')
  }
}

/**
 * Gets the reference year for minors list (configurable)
 * @returns {Promise<number>} The reference year for minors
 */
export async function getMinorsReferenceYear() {
  try {
    const setting = await getSetting('minorsReferenceYear')
    return setting || new Date().getFullYear()
  } catch (error) {
    console.error('Error getting minors reference year:', error)
    return new Date().getFullYear()
  }
}

/**
 * Sets the reference year for minors list
 * @param {number} year - The reference year
 * @returns {Promise<void>}
 */
export async function setMinorsReferenceYear(year) {
  try {
    await updateSetting('minorsReferenceYear', year)
  } catch (error) {
    console.error('Error setting minors reference year:', error)
    throw new Error(
      `Errore nel salvataggio dell'anno di riferimento per i minorenni: ${error.message}`,
    )
  }
}

/**
 * Import database from SQLite file, replacing current data
 * @param {File} file - The SQLite file to import
 * @returns {Promise<Object>} Result of import
 */
export async function importDatabaseFromSqlite(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const SQL = await initSqlJs({
      locateFile: (file) => `/${file}`,
    })

    // Load DB from file
    const uInt8Array = new Uint8Array(arrayBuffer)
    const sqliteDb = new SQL.Database(uInt8Array)

    // Verify tables exist
    // Simple check
    try {
      sqliteDb.exec('SELECT count(*) FROM Soci')
    } catch {
      throw new Error('Il file non sembra essere un database valido o manca la tabella Soci.')
    }

    // Clear current Dexie DB
    await db.transaction('rw', db.soci, db.tesseramenti, db.local_changes, async () => {
      await db.soci.clear()
      await db.tesseramenti.clear()
      await db.local_changes.clear()

      // Import Soci
      const sociResult = sqliteDb.exec('SELECT * FROM Soci')
      if (sociResult.length > 0) {
        const columns = sociResult[0].columns
        const values = sociResult[0].values

        const sociObjects = values.map((row) => {
          const obj = {}
          columns.forEach((col, i) => {
            obj[col] = row[i]
          })
          return obj
        })

        await db.soci.bulkAdd(sociObjects)
      }

      // Import Tesseramenti
      const tessResult = sqliteDb.exec('SELECT * FROM Tesseramenti')
      if (tessResult.length > 0) {
        const columns = tessResult[0].columns
        const values = tessResult[0].values

        const tessObjects = values.map((row) => {
          const obj = {}
          columns.forEach((col, i) => {
            obj[col] = row[i]
          })
          return obj
        })

        await db.tesseramenti.bulkAdd(tessObjects)
      }
    })

    sqliteDb.close()

    return { success: true }
  } catch (error) {
    console.error('Import failed:', error)
    return { success: false, error: error.message }
  }
}
