// @vitest-environment node
import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../backupService', () => ({ backupService: { notifyChange: () => {} } }))

const { db, getNewMembersByYear, getGroupCountsForYear } = await import('../db.js')

// Solo dati inventati. Nuovo e iscritto hanno le definizioni di docs/GLOSSARIO.md.
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
  await db.soci.bulkAdd([
    // Iscritto dal 2010 per sua dichiarazione, primo pagamento registrato nel 2026
    {
      id: 1,
      cognome: 'Alfa',
      nome: 'Storico',
      data_nascita: '1970-01-01',
      gruppo_appartenenza: 'A',
      data_prima_iscrizione: 2010,
    },
    // Primo pagamento nel 2026, nessun anno dichiarato
    { id: 2, cognome: 'Beta', nome: 'Nuovo', data_nascita: '1990-01-01', gruppo_appartenenza: 'A' },
    // Minorenne iscritto nel 2026, esente: nessun pagamento
    {
      id: 3,
      cognome: 'Gamma',
      nome: 'Bambino',
      data_nascita: '2016-01-01',
      gruppo_appartenenza: 'B',
      data_prima_iscrizione: 2026,
    },
    // Minorenne mai iscritto: nessun anno dichiarato, nessun pagamento
    { id: 4, cognome: 'Delta', nome: 'Mai', data_nascita: '2015-01-01', gruppo_appartenenza: 'B' },
  ])
  await db.tesseramenti.bulkAdd([
    { id_tesseramento: 'a', id_socio: 1, anno: 2026, quota_pagata: 25 },
    { id_tesseramento: 'b', id_socio: 2, anno: 2026, quota_pagata: 25 },
  ])
})

describe('Nuovi iscritti (getNewMembersByYear)', () => {
  it("nuovo e' il primo anno di iscrizione: il primo tra l'anno dichiarato e il primo pagamento", async () => {
    const nuovi = await getNewMembersByYear(2026)
    expect(nuovi.map((s) => s.cognome)).toEqual(['Beta', 'Gamma'])
  })

  it('il filtro per eta resta', async () => {
    const minorenni = await getNewMembersByYear(2026, 'minorenni')
    expect(minorenni.map((s) => s.cognome)).toEqual(['Gamma'])
  })
})

describe('Conteggio per manicchia (getGroupCountsForYear)', () => {
  it("conta gli iscritti dell'anno, non i minorenni mai iscritti", async () => {
    expect(await getGroupCountsForYear(2026)).toEqual([
      { group: 'A', count: 2 },
      { group: 'B', count: 1 },
    ])
  })
})
