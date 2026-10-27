// @vitest-environment node
import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../backupService', () => ({ backupService: { notifyChange: () => {} } }))

const { db, getAllSociWithTesseramenti, getTesseramentiBySocioId } = await import('../db.js')

// Solo dati inventati
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
  await db.soci.bulkAdd([
    { id: 1, cognome: 'Prova', nome: 'Mario' },
    { id: 2, cognome: 'Esempio', nome: 'Anna' },
    { id: 3, cognome: 'Nuovo', nome: 'Luca' },
  ])
  await db.tesseramenti.bulkAdd([
    { id_tesseramento: 'a', id_socio: 1, anno: 2024 },
    { id_tesseramento: 'b', id_socio: 2, anno: 2026 },
    { id_tesseramento: 'c', id_socio: 1, anno: 2026 },
    { id_tesseramento: 'd', id_socio: 1, anno: 2025 },
    { id_tesseramento: 'e', id_socio: 99, anno: 2026 }, // socio cancellato
  ])
})

describe('getAllSociWithTesseramenti', () => {
  it('da\' a ogni socio i suoi pagamenti, come la lettura del singolo socio', async () => {
    const soci = await getAllSociWithTesseramenti()
    expect(soci.map((s) => s.id)).toEqual([1, 2, 3])
    for (const socio of soci) {
      const singolo = await getTesseramentiBySocioId(socio.id)
      expect(socio.tesseramenti.map((t) => t.anno)).toEqual(singolo.map((t) => t.anno))
    }
    expect(soci[0].tesseramenti.map((t) => t.anno)).toEqual([2026, 2025, 2024])
    expect(soci[2].tesseramenti).toEqual([])
  })

  it('legge i pagamenti con una sola lettura, non una per socio', async () => {
    const where = vi.spyOn(db.tesseramenti, 'where')
    await getAllSociWithTesseramenti()
    expect(where).not.toHaveBeenCalled()
  })
})
