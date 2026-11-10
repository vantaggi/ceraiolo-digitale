// @vitest-environment node
import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../backupService', () => ({ backupService: { notifyChange: () => {} } }))

const { db, getDataAuditStats } = await import('../db.js')

// Solo dati inventati
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
  const base = {
    luogo_nascita: 'Gubbio',
    gruppo_appartenenza: 'BRANCA',
    data_prima_iscrizione: 2010,
  }
  await db.soci.bulkAdd([
    { id: 1, cognome: 'Rossi', nome: 'Mario', data_nascita: '1980-05-15', ...base },
    { id: 2, cognome: 'ROSSI', nome: 'Mario', data_nascita: '1980-05-15', ...base },
    { id: 3, cognome: 'Verdi', nome: 'Anna', data_nascita: '15/03/1990', ...base },
  ])
  await db.tesseramenti.bulkAdd([
    { id_tesseramento: 'a', id_socio: 1, anno: 2024, quota_pagata: 10 },
    { id_tesseramento: 'b', id_socio: 1, anno: 2024, quota_pagata: 0 },
  ])
})

describe('getDataAuditStats legge soci e pagamenti dal database', () => {
  it('segnala i casi ambigui senza cambiare i dati', async () => {
    const { summary } = await getDataAuditStats()
    expect(summary).toMatchObject({
      duplicate: 2,
      invalid_dob: 1,
      double_payment: 1,
      zero_payment: 1,
      total_issues: 3,
      incompleti: 0,
    })
    expect(await db.soci.count()).toBe(3)
    expect((await db.soci.get(3)).data_nascita).toBe('15/03/1990')
  })
})
