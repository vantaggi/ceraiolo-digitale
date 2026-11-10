// @vitest-environment node
import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../backupService', () => ({ backupService: { notifyChange: () => {} } }))

const { db, getActiveMembersLast5Years } = await import('../db.js')

// Solo dati inventati
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
  await db.soci.bulkAdd([
    { id: 1, cognome: 'Pagante', nome: 'Anna', data_nascita: '1980-01-01' },
    {
      id: 2,
      cognome: 'Ragazzo',
      nome: 'Luca',
      data_nascita: '2012-03-01',
      data_prima_iscrizione: 2022,
    },
    { id: 3, cognome: 'Fermo', nome: 'Paolo', data_nascita: '1980-01-01' },
  ])
  await db.tesseramenti.bulkAdd([
    { id_tesseramento: 'a', id_socio: 1, anno: 2025, quota_pagata: 10 },
    { id_tesseramento: 'b', id_socio: 3, anno: 2019, quota_pagata: 10 },
  ])
})

describe('PDF Soci attivi: gli anni da minorenne contano come pagati (Cioti, 10 novembre 2026)', () => {
  it('il minorenne iscritto senza pagamenti e attivo, chi non paga dal 2019 no', async () => {
    const attivi = (await getActiveMembersLast5Years(2026)).map((s) => s.cognome).sort()
    expect(attivi).toEqual(['Pagante', 'Ragazzo'])
  })
})
