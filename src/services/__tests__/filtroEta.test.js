// @vitest-environment node
import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../backupService', () => ({ backupService: { notifyChange: () => {} } }))

const { db, getNewMembersByYear, getCompletePaymentList, getMembersByGroup } = await import(
  '../db.js'
)

// Solo dati inventati. Oggi e' il 31 ottobre 2026: chi e' nato a dicembre 2008 non ha
// ancora compiuto 18 anni, ma per la regola (solo anno di nascita) e' maggiorenne nel 2026.
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-31T10:00:00'))
  await Promise.all(db.tables.map((t) => t.clear()))
  await db.soci.bulkAdd([
    {
      id: 1,
      cognome: 'Alfa',
      nome: 'Dicembre',
      data_nascita: '2008-12-15',
      gruppo_appartenenza: 'A',
    },
    {
      id: 2,
      cognome: 'Beta',
      nome: 'Adulto',
      data_nascita: '1980-01-01',
      gruppo_appartenenza: 'A',
    },
    {
      id: 3,
      cognome: 'Gamma',
      nome: 'Bambino',
      data_nascita: '2015-05-05',
      gruppo_appartenenza: 'A',
    },
    {
      id: 4,
      cognome: 'Delta',
      nome: 'Nel2020',
      data_nascita: '2005-01-01',
      gruppo_appartenenza: 'A',
    },
  ])
  const t = (id, id_socio, anno) => ({ id_tesseramento: id, id_socio, anno, quota_pagata: 10 })
  await db.tesseramenti.bulkAdd([
    t('a', 1, 2026),
    t('b', 2, 2026),
    t('c', 3, 2026),
    t('d', 4, 2020),
  ])
})

afterEach(() => {
  vi.useRealTimers()
})

const cognomi = (righe) => righe.map((r) => r.cognome ?? r.socio.cognome).sort()

describe("filtro maggiorenni / minorenni: conta solo l'anno di nascita", () => {
  it('nuovi soci del 2026', async () => {
    expect(cognomi(await getNewMembersByYear(2026, 'maggiorenni'))).toEqual(['Alfa', 'Beta'])
    expect(cognomi(await getNewMembersByYear(2026, 'minorenni'))).toEqual(['Gamma'])
  })

  it('soci per manicchia nel 2026', async () => {
    expect(cognomi(await getMembersByGroup(null, 'maggiorenni', 'tutti', 2026))).toEqual([
      'Alfa',
      'Beta',
      'Delta',
    ])
    expect(cognomi(await getMembersByGroup(null, 'minorenni', 'tutti', 2026))).toEqual(['Gamma'])
  })

  it('elenco completo dei pagamenti', async () => {
    expect(cognomi(await getCompletePaymentList('maggiorenni', 2026))).toEqual([
      'Alfa',
      'Beta',
      'Delta',
    ])
    expect(cognomi(await getCompletePaymentList('minorenni', 2026))).toEqual(['Gamma'])
  })
})

describe("l'eta' si conta nell'anno del report, non oggi", () => {
  it('nuovi soci del 2020: chi e nato nel 2005 era minorenne', async () => {
    expect(cognomi(await getNewMembersByYear(2020, 'minorenni'))).toEqual(['Delta'])
    expect(cognomi(await getNewMembersByYear(2020, 'maggiorenni'))).toEqual([])
  })

  it('soci per manicchia nel 2020', async () => {
    expect(cognomi(await getMembersByGroup(null, 'minorenni', 'tutti', 2020))).toEqual([
      'Alfa',
      'Delta',
      'Gamma',
    ])
  })

  it("elenco dei pagamenti con l'anno scelto nei report", async () => {
    expect(cognomi(await getCompletePaymentList('minorenni', 2020))).toEqual([
      'Alfa',
      'Delta',
      'Gamma',
    ])
  })
})
