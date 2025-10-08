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
 * Searches for members by name or surname.
 * The search is case-insensitive and matches partial strings.
 * @param {string} searchTerm The term to search for.
 * @returns {Promise<Array>} A promise that resolves to an array of matching members.
 */
export async function searchSoci(searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') {
    return [] // Return empty array if search term is empty
  }

  const lowerCaseSearchTerm = searchTerm.toLowerCase()

  // Use Dexie's 'where...startsWithIgnoreCase' for efficient searching.
  // We perform two separate queries and combine the results.
  const resultsByCognome = await db.soci
    .where('cognome')
    .startsWithIgnoreCase(lowerCaseSearchTerm)
    .toArray()

  const resultsByNome = await db.soci
    .where('nome')
    .startsWithIgnoreCase(lowerCaseSearchTerm)
    .toArray()

  // Combine results and remove duplicates
  const allResults = [...resultsByCognome, ...resultsByNome]
  const uniqueResults = Array.from(new Map(allResults.map((item) => [item.id, item])).values())

  return uniqueResults
}
