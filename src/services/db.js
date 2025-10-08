import Dexie from 'dexie'

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
