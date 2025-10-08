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
