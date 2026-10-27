// @vitest-environment node
import 'fake-indexeddb/auto'
import { createRequire } from 'node:module'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// In Node sql.js legge il wasm dal disco, non dal sito
vi.mock('../sqljs.js', async () => {
  const { default: initSqlJs } = await import('sql.js')
  const require = createRequire(import.meta.url)
  return { caricaSqlJs: () => initSqlJs({ locateFile: (f) => require.resolve(`sql.js/dist/${f}`) }) }
})
// Il backup su cartella non c'entra con questi test
vi.mock('../backupService', () => ({ backupService: { notifyChange: () => {} } }))

const { db, exportDatabaseToSqlite, importDatabaseFromSqlite, wipeDatabase } = await import(
  '../db.js'
)

// Solo dati inventati
const blocchetto = {
  numero_blocchetto: 7,
  ricevute_da: 61,
  ricevute_a: 70,
  assegnato_a: 'Mario Prova',
  data_assegnazione: '2026-03-01',
  data_restituzione: null,
}

const comeFile = (blob) => ({ name: 'backup.sqlite', arrayBuffer: () => blob.arrayBuffer() })

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
  await db.soci.add({ id: 1, cognome: 'Prova', nome: 'Mario', gruppo_appartenenza: 'INTERNA' })
  await db.tesseramenti.add({ id_tesseramento: 'p1', id_socio: 1, anno: 2026, quota_pagata: 25 })
  await db.blocchetti.add(blocchetto)
})

describe('backup e ripristino', () => {
  it('il ripristino rimette i blocchetti del backup', async () => {
    const { success, blob } = await exportDatabaseToSqlite()
    expect(success).toBe(true)

    // Dopo il backup cambiano i blocchetti: il ripristino deve tornare a quelli del file
    await db.blocchetti.clear()
    await db.blocchetti.add({ numero_blocchetto: 99, assegnato_a: 'Non nel backup' })

    expect(await importDatabaseFromSqlite(comeFile(blob))).toEqual({ success: true })

    const dopo = await db.blocchetti.toArray()
    expect(dopo).toHaveLength(1)
    expect(dopo[0]).toMatchObject(blocchetto)
    expect(await db.soci.count()).toBe(1)
    expect(await db.tesseramenti.count()).toBe(1)
  })

  it('un backup vecchio senza blocchetti non cancella quelli che ci sono', async () => {
    const { caricaSqlJs } = await import('../sqljs.js')
    const SQL = await caricaSqlJs()
    const vecchio = new SQL.Database()
    vecchio.run(`
      CREATE TABLE Soci (id INTEGER PRIMARY KEY, cognome TEXT, nome TEXT);
      CREATE TABLE Tesseramenti (id_tesseramento TEXT PRIMARY KEY, id_socio INTEGER, anno INTEGER);
      INSERT INTO Soci VALUES (2, 'Esempio', 'Anna');
    `)
    const blob = new Blob([vecchio.export()])

    expect(await importDatabaseFromSqlite(comeFile(blob))).toEqual({ success: true })
    expect(await db.blocchetti.toArray()).toEqual([expect.objectContaining(blocchetto)])
    expect((await db.soci.toArray()).map((s) => s.nome)).toEqual(['Anna'])
  })

  it('"Cancella tutti i dati" cancella anche i blocchetti', async () => {
    await wipeDatabase()
    expect(await db.blocchetti.count()).toBe(0)
    expect(await db.soci.count()).toBe(0)
  })
})
