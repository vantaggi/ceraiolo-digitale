import Dexie from 'dexie'
import initSqlJs from 'sql.js'
import { calculatePaymentStatus } from '@/utils/payment'

// Create a new Dexie database instance
export const db = new Dexie('CeraioloDigitaleDB')

// Define the database schema.
// This must match the structure defined in the developer manual.
// NOTE: We use manual ID assignment for soci to maintain compatibility.
db.version(1).stores({
  soci: `
    id,
    [cognome+nome],
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
  try {
    const soci = await db.soci.toArray()
    const sociGroups = new Set(soci.map((s) => s.gruppo_appartenenza).filter((g) => g))

    // Add custom defined groups from settings
    const definedGroups = await getSetting('defined_groups', [])
    if (Array.isArray(definedGroups)) {
      definedGroups.forEach((g) => sociGroups.add(g))
    }

    return Array.from(sociGroups).sort()
  } catch (error) {
    console.error('Error getting unique groups:', error)
    return []
  }
}

/**
 * Adds a new custom group to the system definitions
 * @param {string} groupName - The name of the new group
 */
export async function addCustomGroup(groupName) {
  if (!groupName || !groupName.trim()) return
  const name = groupName.trim()
  try {
    const currentGroups = await getSetting('defined_groups', [])
    // Ensure we're working with an array
    const groups = Array.isArray(currentGroups) ? currentGroups : []

    if (!groups.includes(name)) {
      groups.push(name)
      await updateSetting('defined_groups', groups.sort())
    }
  } catch (error) {
    console.error('Error adding custom group:', error)
    throw new Error('Impossibile aggiungere il nuovo gruppo')
  }
}

/**
 * Removes a custom group from system definitions (does not affect existing members)
 * @param {string} groupName - The name of the group to remove from definitions
 */
export async function removeCustomGroup(groupName) {
  if (!groupName) return
  try {
    const currentGroups = await getSetting('defined_groups', [])
    if (Array.isArray(currentGroups)) {
      const newGroups = currentGroups.filter((g) => g !== groupName)
      await updateSetting('defined_groups', newGroups)
    }
  } catch (error) {
    console.error('Error removing custom group:', error)
    throw new Error('Impossibile rimuovere il gruppo')
  }
}

/**
 * Renames a group across all members
 * @param {string} oldName - Current group name
 * @param {string} newName - New group name
 * @returns {Promise<number>} Number of updated records
 */
export async function renameGroup(oldName, newName) {
  if (!oldName || !newName || oldName === newName) return 0

  return await db.transaction('rw', [db.soci, db.settings], async () => {
    // 1. Update all members
    const membersToUpdate = await db.soci.where('gruppo_appartenenza').equals(oldName).toArray()
    let updatedCount = 0

    if (membersToUpdate.length > 0) {
      updatedCount = membersToUpdate.length
      await Promise.all(
        membersToUpdate.map((member) =>
          db.soci.update(member.id, { gruppo_appartenenza: newName.trim() }),
        ),
      )
    }

    // 2. Update custom definitions if present
    const definedGroups = await getSetting('defined_groups', [])
    if (Array.isArray(definedGroups) && definedGroups.includes(oldName)) {
      const updatedGroups = definedGroups.map((g) => (g === oldName ? newName.trim() : g))
      // Ensure specific uniqueness if newName already existed
      const uniqueGroups = [...new Set(updatedGroups)].sort()
      await updateSetting('defined_groups', uniqueGroups)
    }

    return updatedCount
  })
}

/**
 * Applies multiple filters and a text search to find members.
 * @param {object} filters - An object containing the filter criteria.
 * @param {string} filters.searchTerm - The text to search for in name/surname.
 * @param {string} filters.ageCategory - Can be 'tutti', 'maggiorenni', or 'minorenni'.
 * @param {string} filters.group - The membership group to filter by.
 * @returns {Promise<Array>} A promise that resolves to an array of matching members.
 */
/**
 * Applies multiple filters and a text search to find members.
 * @param {object} filters - An object containing the filter criteria.
 * @param {string} filters.searchTerm - The text to search for in name/surname.
 * @param {string} filters.ageCategory - Can be 'tutti', 'maggiorenni', or 'minorenni'.
 * @param {string} filters.group - The membership group to filter by.
 * @param {number} [filters.renewalYear] - Optional year to filter by renewal status.
 * @returns {Promise<Array>} A promise that resolves to an array of matching members.
 */
export async function applyFiltersAndSearch(filters) {
  const { searchTerm, ageCategory, group, renewalYear } = filters
  let collection

  // Pre-filter by renewal year if specified
  if (renewalYear) {
    const payments = await db.tesseramenti.where('anno').equals(renewalYear).toArray()
    const socioIds = payments.map((p) => p.id_socio)
    // Create collection from specific IDs
    collection = db.soci.where('id').anyOf(socioIds)
  } else {
    // Start with complete collection
    collection = db.soci.toCollection()
  }

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

    // 1. Create Core Tables (Soci, Tesseramenti)
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
      );
      CREATE TABLE Tesseramenti (
        id_tesseramento TEXT PRIMARY KEY,
        id_socio INTEGER,
        anno INTEGER,
        data_pagamento TEXT,
        quota_pagata REAL,
        numero_ricevuta INTEGER,
        numero_blocchetto INTEGER,
        FOREIGN KEY (id_socio) REFERENCES Soci (id)
      );
    `)

    // 2. Create Advanced Tables (Settings, LocalChanges, Metadata)
    sqliteDb.run(`
      CREATE TABLE Settings (
        key TEXT PRIMARY KEY,
        value TEXT, -- JSON string
        updated_at TEXT
      );
      CREATE TABLE LocalChanges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT,
        change_type TEXT,
        record_id TEXT,
        timestamp TEXT,
        new_data TEXT -- JSON string
      );
      CREATE TABLE Metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `)

    // --- EXPORT SOCI ---
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

    // --- EXPORT TESSERAMENTI ---
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

    // --- EXPORT SETTINGS ---
    const settingsData = await db.settings.toArray()
    const settingsStmt = sqliteDb.prepare(
      'INSERT INTO Settings (key, value, updated_at) VALUES (?, ?, ?)',
    )
    for (const setting of settingsData) {
      // Ensure value is JSON stringified if it's an object/array, though usually it might be stored directly
      // In Dexie we store any type. In SQLite we use TEXT.
      // Strategy: JSON.stringify everything to be safe
      settingsStmt.run([
        setting.key,
        JSON.stringify(setting.value),
        setting.updated_at || new Date().toISOString(),
      ])
    }
    settingsStmt.free()

    // --- EXPORT LOCAL CHANGES (HISTORY) ---
    const historyData = await db.local_changes.toArray()
    const historyStmt = sqliteDb.prepare(
      'INSERT INTO LocalChanges (id, table_name, change_type, record_id, timestamp, new_data) VALUES (?, ?, ?, ?, ?, ?)',
    )
    for (const change of historyData) {
      historyStmt.run([
        change.id,
        change.table_name || null,
        change.change_type || null,
        change.record_id ? String(change.record_id) : null,
        change.timestamp || null,
        JSON.stringify(change.new_data || {}),
      ])
    }
    historyStmt.free()

    // --- EXPORT METADATA ---
    const metadataStmt = sqliteDb.prepare('INSERT INTO Metadata (key, value) VALUES (?, ?)')
    metadataStmt.run(['schema_version', '2.0'])
    metadataStmt.run(['export_timestamp', timestamp])
    metadataStmt.free()

    // Get binary data and create blob
    const binaryArray = sqliteDb.export()
    const blob = new Blob([binaryArray], { type: 'application/octet-stream' })

    // Create export metadata
    const exportMetadata = {
      filename,
      soci_count: sociData.length,
      tesseramenti_count: tesseramentiData.length,
      settings_count: settingsData.length,
      history_count: historyData.length,
      file_size: binaryArray.length,
      timestamp,
      schema_version: '2.0',
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
    const paidYears = tesseramenti.map((t) => t.anno)
    const socio = await db.soci.get(numericId)

    if (!socio) return []

    // Use shared utility for calculation
    const status = calculatePaymentStatus(socio, paidYears, currentYear)
    return status.arretrati
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
 * @param {number} [referenceYear] - The year to use for payment status calculation (defaults to current year)
 * @returns {Promise<Array>} Array of members by group
 */
export async function getMembersByGroup(
  gruppo = null,
  ageCategory = 'tutti',
  paymentStatus = 'tutti',
  referenceYear = null,
) {
  try {
    const targetYear = referenceYear || new Date().getFullYear()
    console.log('getMembersByGroup called with:', {
      gruppo,
      ageCategory,
      paymentStatus,
      targetYear,
    })

    let sociQuery = db.soci.toCollection()

    // Apply group filter
    if (gruppo && gruppo !== 'Tutti') {
      sociQuery = sociQuery.filter((socio) => socio.gruppo_appartenenza === gruppo)
    }

    const soci = await sociQuery.toArray()
    console.log('Soci found after group filter:', soci.length)

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
      const paidYears = payments.map((p) => p.anno)

      // Calculate status using shared utility - uses the selected reference year
      const status = calculatePaymentStatus(socio, paidYears, targetYear)
      const isInRegola = status.inRegola

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
          anni_pagati: paidYears.sort((a, b) => a - b),
          in_regola: isInRegola,
          arretrati: status.arretrati,
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
 * Retrieves members eligible to vote in a specific year.
 * Eligibility:
 * 1. Paid in YEAR - 1
 * 2. Adult in YEAR (BirthYear <= YEAR - 18)
 * @param {number} targetYear - The year of the vote
 * @returns {Promise<Array>} List of eligible members
 */
/**
 * Retrieves members eligible to vote in a specific year.
 * Eligibility:
 * 1. Paid in YEAR - 1
 * 2. Adult in YEAR (BirthYear <= YEAR - 18)
 * Includes payment history for YEAR and previous 5 years.
 * @param {number} targetYear - The year of the vote
 * @returns {Promise<Array>} List of eligible members within expanded objects
 */
export async function getVotingEligibleMembers(targetYear) {
  try {
    const previousYear = targetYear - 1
    const adultBirthLimit = targetYear - 18

    // 1. Get all payments for PREVIOUS year (for filtering)
    const prevYearPayments = await db.tesseramenti.where('anno').equals(previousYear).toArray()
    const paidMemberIds = new Set(prevYearPayments.map((p) => p.id_socio))

    // 2. Get all payments (for history) - optimization: query all and group by socio in memory
    // or query per socio? Querying all is better for < 10k records.
    const allTesseramenti = await db.tesseramenti.toArray()
    const paymentsMap = new Map() // socioId -> Set(years)
    allTesseramenti.forEach((t) => {
      if (!paymentsMap.has(t.id_socio)) paymentsMap.set(t.id_socio, new Set())
      paymentsMap.get(t.id_socio).add(t.anno)
    })

    // 3. Get all soci
    const allSoci = await db.soci.toArray()

    const eligibleMembers = allSoci
      .filter((socio) => {
        // Must have paid previous year check
        if (!paidMemberIds.has(socio.id)) return false

        // Must be adult check
        if (!socio.data_nascita) return false
        const birthYear = new Date(socio.data_nascita).getFullYear()
        return birthYear <= adultBirthLimit
      })
      .map((socio) => {
        // Build History: Voting Year + 5 years back = 6 years total?
        // User asked: "payments of last 5 years AND if they paid the voting year"
        // Voting Year = T. Last 5 = T-1, T-2, T-3, T-4, T-5
        const history = {}
        const yearsToCheck = []
        // Add Voting Year
        yearsToCheck.push(targetYear)
        // Add Last 5 Years
        for (let i = 1; i <= 5; i++) {
          yearsToCheck.push(targetYear - i)
        }

        const paidYears = paymentsMap.get(socio.id) || new Set()

        yearsToCheck.forEach((year) => {
          history[year] = paidYears.has(year)
        })

        return {
          ...socio,
          paymentHistory: history,
        }
      })

    // Sort by Group, then Surname
    return eligibleMembers.sort((a, b) => {
      const groupCompare = (a.gruppo_appartenenza || '').localeCompare(b.gruppo_appartenenza || '')
      if (groupCompare !== 0) return groupCompare
      return (a.cognome + a.nome).localeCompare(b.cognome + b.nome)
    })
  } catch (error) {
    console.error('Error getting voting eligible members:', error)
    throw new Error(`Errore nel recupero aventi diritto al voto: ${error.message}`)
  }
}

/**
 * Retrieves members active in the last 5 years (at least 1 payment).
 * @param {number} targetYear - The reference year (end of the 5-year window)
 * @returns {Promise<Array>} List of active members with payment history
 */
export async function getActiveMembersLast5Years(targetYear) {
  try {
    const startWindow = targetYear - 4

    // 1. Get all payments (for history and filtering)
    const allTesseramenti = await db.tesseramenti.toArray()
    const paymentsMap = new Map() // socioId -> Set(years)
    allTesseramenti.forEach((t) => {
      if (!paymentsMap.has(t.id_socio)) paymentsMap.set(t.id_socio, new Set())
      paymentsMap.get(t.id_socio).add(t.anno)
    })

    // 2. Get all soci
    const allSoci = await db.soci.toArray()

    const activeMembers = allSoci
      .filter((socio) => {
        const paidYears = paymentsMap.get(socio.id)
        if (!paidYears) return false

        // Check if ANY paid year is within [startWindow, targetYear]
        for (let y = startWindow; y <= targetYear; y++) {
          if (paidYears.has(y)) return true
        }
        return false
      })
      .map((socio) => {
        // Build History similar to voting report
        const history = {}
        const yearsToCheck = []
        for (let i = 0; i < 5; i++) {
          yearsToCheck.push(targetYear - i) // T, T-1, T-2, T-3, T-4
        }
        // User might want to see T-5 as well if strict "last 5" means excluding current?
        // Usually "last 5 years" includes current.
        // Let's match the columns: T-4 to T.
        // Actually, let's match the columns of the Voting Report for consistency (T-5 to T)?
        // Voting Report has 6 columns: T-5, T-4, T-3, T-2, T-1, T.
        // Let's exclude T-5 if the window is strict. But more info is better.
        // Let's show T-5 to T (6 years) for context.

        const paidYears = paymentsMap.get(socio.id) || new Set()

        // Loop T-5 to T
        for (let y = targetYear - 5; y <= targetYear; y++) {
          history[y] = paidYears.has(y)
        }

        return {
          ...socio,
          paymentHistory: history,
        }
      })

    // Sort by Group, then Surname
    return activeMembers.sort((a, b) => {
      const groupCompare = (a.gruppo_appartenenza || '').localeCompare(b.gruppo_appartenenza || '')
      if (groupCompare !== 0) return groupCompare
      return (a.cognome + a.nome).localeCompare(b.cognome + b.nome)
    })
  } catch (error) {
    console.error('Error getting active members last 5 years:', error)
    throw new Error(`Errore nel recupero soci attivi: ${error.message}`)
  }
}

/**
 * Calcola le statistiche annuali per i grafici
 * @param {number} startYear - Anno di inizio (opzionale, default: 5 anni fa)
 * @param {number} endYear - Anno di fine (opzionale, default: anno corrente)
 * @returns {Promise<Array>} Array di oggetti { year, total, newMembers, lostMembers }
 */
/**
 * Computes the earliest year of activity (registration or payment) in the database.
 * @returns {Promise<number>} The earliest year found, or current year - 10 if no data.
 */
export async function getEarliestActivityYear() {
  try {
    const currentYear = new Date().getFullYear()
    let minYear = currentYear

    // Check Soci data_prima_iscrizione
    const soci = await db.soci.toArray()
    soci.forEach((s) => {
      if (s.data_prima_iscrizione && s.data_prima_iscrizione > 1900) {
        if (s.data_prima_iscrizione < minYear) minYear = s.data_prima_iscrizione
      }
    })

    // Check Tesseramenti anno
    const tesseramenti = await db.tesseramenti.toArray()
    tesseramenti.forEach((t) => {
      if (t.anno && t.anno > 1900) {
        if (t.anno < minYear) minYear = t.anno
      }
    })

    // Safety implementation limit: Don't go back before 1950 to avoid glitches
    return Math.max(minYear, 1950)
  } catch (error) {
    console.error('Error finding earliest activity year:', error)
    return new Date().getFullYear() - 10
  }
}

/**
 * Calcola le statistiche annuali per i grafici
 * @param {number} [startYear] - Anno di inizio (opzionale)
 * @param {number} [endYear] - Anno di fine (opzionale)
 * @returns {Promise<Array>} Array di oggetti { year, total, newMembers, lostMembers }
 */
export async function getYearlyStats(startYear, endYear) {
  try {
    const currentYear = new Date().getFullYear()
    const start = startYear || (await getEarliestActivityYear())
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

    // 2. Pre-calculate "effective start year" for each socio
    const socioStartYears = new Map()
    allSoci.forEach((socio) => {
      let start = null
      if (socio.data_prima_iscrizione) start = socio.data_prima_iscrizione
      if (!start) {
        const paidYears = paymentsMap.get(socio.id)
        if (paidYears && paidYears.size > 0) start = Math.min(...Array.from(paidYears))
      }
      if (start) socioStartYears.set(socio.id, start)
    })

    const stats = []

    // Helper: Is socio active/enrolled in specific year?
    const isEnrolledInYear = (socio, year) => {
      // Must have a start year to be enrolled
      const start = socioStartYears.get(socio.id)
      if (!start || year < start) return false

      // 1. Explicit Payment
      if (paymentsMap.has(socio.id) && paymentsMap.get(socio.id).has(year)) {
        return true
      }

      // 2. Minor Exemption logic
      const numericYear = Number(year)
      if (isExemptFromPayment(socio, numericYear)) {
        // Additional safety: ensure they are born
        if (socio.data_nascita) {
          const birthYear = new Date(socio.data_nascita).getFullYear()
          if (numericYear < birthYear) return false
        }
        return true
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

          // Check if New
          const start = socioStartYears.get(socio.id)
          if (start === year) {
            newMembers++
          }
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
 * Retrieves demographic statistics for a specific year
 * @param {number} year - The reference year
 * @returns {Promise<Object>} Stats object (ageGroups, places, total)
 */
export async function getDemographicStats(year) {
  try {
    const allSoci = await db.soci.toArray()
    const allTesseramenti = await db.tesseramenti.toArray()

    // Create quick lookup for payments
    const paymentsMap = new Map()
    allTesseramenti.forEach((t) => {
      if (!paymentsMap.has(t.id_socio)) paymentsMap.set(t.id_socio, new Set())
      paymentsMap.get(t.id_socio).add(t.anno)
    })

    const enrolledSoci = []

    // Filter enrolled members
    for (const socio of allSoci) {
      let isEnrolled = false
      if (paymentsMap.has(socio.id) && paymentsMap.get(socio.id).has(year)) {
        isEnrolled = true
      } else if (isExemptFromPayment(socio, year)) {
        // Check valid registration
        if (socio.data_prima_iscrizione && socio.data_prima_iscrizione <= year) {
          isEnrolled = true
        }
      }

      if (isEnrolled) enrolledSoci.push(socio)
    }

    // Calculate Stats
    const stats = {
      total: enrolledSoci.length,
      ageGroups: {
        'Under 18': 0,
        '18-35': 0,
        '36-50': 0,
        '51-65': 0,
        'Over 65': 0,
        'N/D': 0,
      },
      places: {},
    }

    enrolledSoci.forEach((socio) => {
      // Age Stats
      const age = calculateAgeInYear(socio.data_nascita, year)
      if (age >= 150) stats.ageGroups['N/D']++
      else if (age < 18) stats.ageGroups['Under 18']++
      else if (age <= 35) stats.ageGroups['18-35']++
      else if (age <= 50) stats.ageGroups['36-50']++
      else if (age <= 65) stats.ageGroups['51-65']++
      else stats.ageGroups['Over 65']++

      // Place Stats
      let place = socio.luogo_nascita ? socio.luogo_nascita.trim().toUpperCase() : 'NON SPECIFICATO'
      if (place === '') place = 'NON SPECIFICATO'
      stats.places[place] = (stats.places[place] || 0) + 1
    })

    // Sort Places (Top 10)
    const sortedPlaces = Object.entries(stats.places)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [key, val]) => {
        obj[key] = val
        return obj
      }, {})

    // Calculate "Altri"
    const topPlacesCount = Object.values(sortedPlaces).reduce((a, b) => a + b, 0)
    const otherCount = stats.total - topPlacesCount
    if (otherCount > 0) sortedPlaces['ALTRI'] = otherCount

    stats.places = sortedPlaces

    return stats
  } catch (error) {
    console.error('Error calculating demographic stats:', error)
    throw new Error('Errore calcolo statistiche demografiche')
  }
}

/**
 * Retrieves economic statistics for a specific year
 * @param {number} year - The reference year
 * @returns {Promise<Object>} Economic stats (totalRevenue, averageQuota, groupBreakdown)
 */
export async function getEconomicStats(year) {
  try {
    const tesseramenti = await db.tesseramenti.where({ anno: year }).toArray()
    const allSoci = await db.soci.toArray()
    const sociMap = new Map(allSoci.map((s) => [s.id, s]))

    const stats = {
      totalRevenue: 0,
      totalPayments: tesseramenti.length,
      averageQuota: 0,
      groupBreakdown: {},
    }

    tesseramenti.forEach((t) => {
      stats.totalRevenue += t.quota_pagata
      const socio = sociMap.get(t.id_socio)
      if (socio) {
        const group = socio.gruppo_appartenenza || 'Non specificato'
        stats.groupBreakdown[group] = (stats.groupBreakdown[group] || 0) + t.quota_pagata
      }
    })

    stats.averageQuota =
      stats.totalPayments > 0 ? (stats.totalRevenue / stats.totalPayments).toFixed(2) : 0

    return stats
  } catch (error) {
    console.error('Error calculating economic stats:', error)
    throw new Error('Errore calcolo statistiche economiche')
  }
}

/**
 * Returns a list of the most recent database activities
 * @param {number} limit - Max number of items
 * @returns {Promise<Array>} List of events {type, description, timestamp, socioName}
 */
export async function getRecentActivity(limit = 10) {
  try {
    // We'll look at the last N tesseramenti records as they represent "Success"
    // Alternatively, query local_changes for more variety (create soci, etc)
    const changes = await db.local_changes.orderBy('timestamp').reverse().limit(limit).toArray()

    return changes.map((c) => {
      let description = ''
      switch (c.table_name) {
        case 'soci':
          description =
            c.change_type === 'create'
              ? `Registrato nuovo socio: ${c.new_data?.cognome} ${c.new_data?.nome}`
              : `Modificata anagrafica: ${c.new_data?.cognome}`
          break
        case 'tesseramenti':
          description =
            c.change_type === 'create'
              ? `Registrato pagamento ${c.new_data?.anno} per ${c.new_data?.id_socio}` // ID only if we don't have lookup
              : `Cancellato pagamento`
          break
        default:
          description = `${c.change_type} in ${c.table_name}`
      }

      return {
        id: c.id,
        type: c.change_type,
        timestamp: c.timestamp,
        description: description,
        data: c.new_data,
      }
    })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return []
  }
}

/**
 * Performs a data quality audit on the database
 * @returns {Promise<Object>} Audit results { summary, details }
 */
export async function getDataAuditStats() {
  try {
    const allSoci = await db.soci.toArray()

    // Load payments to check for implicit registration
    const allTesseramenti = await db.tesseramenti.toArray()
    const activeMembers = new Set(allTesseramenti.map((t) => t.id_socio))

    const problems = []
    const summary = {
      missing_dob: 0,
      missing_pob: 0,
      missing_reg_date: 0,
      missing_group: 0,
      future_reg: 0,
      total_issues: 0,
    }

    const currentYear = new Date().getFullYear()

    for (const socio of allSoci) {
      const socioIssues = []

      // Check DOB
      if (!socio.data_nascita) {
        socioIssues.push('Data Nascita mancante')
        summary.missing_dob++
      }

      // Check POB
      if (!socio.luogo_nascita || socio.luogo_nascita.trim() === '') {
        socioIssues.push('Luogo Nascita mancante')
        summary.missing_pob++
      }

      // Check Reg Date
      // Improved Logic: If data_prima_iscrizione is missing, check if they have any payment history.
      // If they have payments, we can infer the first payment year as registration, so it's not "missing basic data".
      // Only flag if BOTH are missing.
      if (!socio.data_prima_iscrizione) {
        if (!activeMembers.has(socio.id)) {
          socioIssues.push('Data Iscrizione mancante (e nessun pagamento)')
          summary.missing_reg_date++
        }
      } else if (socio.data_prima_iscrizione > currentYear) {
        socioIssues.push(`Iscrizione nel futuro (${socio.data_prima_iscrizione})`)
        summary.future_reg++
      }

      // Check Group
      if (!socio.gruppo_appartenenza || socio.gruppo_appartenenza.trim() === '') {
        socioIssues.push('Gruppo non assegnato')
        summary.missing_group++
      }

      if (socioIssues.length > 0) {
        problems.push({
          id: socio.id,
          nome: socio.nome,
          cognome: socio.cognome,
          issues: socioIssues,
        })
      }
    }

    summary.total_issues = problems.length

    return {
      summary,
      details: problems.sort((a, b) => a.cognome.localeCompare(b.cognome)),
    }
  } catch (error) {
    console.error('Audit failed:', error)
    throw new Error('Errore durante il controllo qualità dati')
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

    // Check version if Metadata exists
    try {
      const res = sqliteDb.exec("SELECT value FROM Metadata WHERE key = 'schema_version'")
      if (res.length > 0 && res[0].values.length > 0) {
        console.log('Importing database schema version:', res[0].values[0][0])
      }
    } catch {
      console.log('No metadata table found, assuming legacy backup')
    }

    // Clear current Dexie DB
    await db.transaction(
      'rw',
      db.soci,
      db.tesseramenti,
      db.local_changes,
      db.settings,
      async () => {
        await db.soci.clear()
        await db.tesseramenti.clear()
        await db.local_changes.clear()
        await db.settings.clear()

        // --- IMPORT SOCI ---
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

        // --- IMPORT TESSERAMENTI ---
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

        // --- IMPORT SETTINGS ---
        try {
          const settingsResult = sqliteDb.exec('SELECT * FROM Settings')
          if (settingsResult.length > 0) {
            const columns = settingsResult[0].columns
            const values = settingsResult[0].values

            const settingsObjects = values.map((row) => {
              const obj = {}
              columns.forEach((col, i) => {
                obj[col] = row[i]
              })
              // Parse JSON value
              if (obj.value) {
                try {
                  obj.value = JSON.parse(obj.value)
                } catch {
                  // Keep as string if parse fails
                }
              }
              return obj
            })

            await db.settings.bulkAdd(settingsObjects)
          }
        } catch {
          console.warn('Settings table not found in backup (Legacy backup?)')
        }

        // --- IMPORT LOCAL CHANGES ---
        try {
          const historyResult = sqliteDb.exec('SELECT * FROM LocalChanges')
          if (historyResult.length > 0) {
            const columns = historyResult[0].columns
            const values = historyResult[0].values

            const historyObjects = values.map((row) => {
              const obj = {}
              columns.forEach((col, i) => {
                obj[col] = row[i]
              })
              // Parse JSON new_data
              if (obj.new_data) {
                try {
                  obj.new_data = JSON.parse(obj.new_data)
                } catch {
                  // Keep as string
                }
              }
              return obj
            })

            await db.local_changes.bulkAdd(historyObjects)
          }
        } catch {
          console.warn('LocalChanges table not found in backup (Legacy backup?)')
        }
      },
    )

    sqliteDb.close()

    return { success: true }
  } catch (error) {
    console.error('Import failed:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Wipes the entire database (Factory Reset)
 * @returns {Promise<void>}
 */
export async function wipeDatabase() {
  try {
    await db.transaction(
      'rw',
      db.soci,
      db.tesseramenti,
      db.local_changes,
      db.settings,
      async () => {
        await db.soci.clear()
        await db.tesseramenti.clear()
        await db.local_changes.clear()
        await db.settings.clear()
      },
    )
    console.log('Database wiped successfully')
  } catch (error) {
    console.error('Error wiping database:', error)
    throw new Error('Errore durante il reset del database')
  }
}

/**
 * Reports: Get Churn List (Paid last year, not this year)
 */
export async function getChurnList(year) {
  const currentYear = parseInt(year)
  const prevYear = currentYear - 1

  const lastYearPayments = await db.tesseramenti.where('anno').equals(prevYear).toArray()
  const lastYearIds = new Set(lastYearPayments.map((p) => p.id_socio))

  const thisYearPayments = await db.tesseramenti.where('anno').equals(currentYear).toArray()
  const thisYearIds = new Set(thisYearPayments.map((p) => p.id_socio))

  const churnIds = [...lastYearIds].filter((id) => !thisYearIds.has(id))

  return await db.soci.where('id').anyOf(churnIds).toArray()
}
