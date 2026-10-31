// @vitest-environment node
import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../backupService', () => ({ backupService: { notifyChange: () => {} } }))

const { db, getQuotaAuditList, updateSetting } = await import('../db.js')
const payment = await import('@/utils/payment')
const dbModule = await import('../db.js')

// Solo dati inventati. Anno controllato: 2026.
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
  await db.soci.bulkAdd([
    { id: 1, cognome: 'Alfa', nome: 'Nuovo', data_nascita: '1980-01-01' },
    { id: 2, cognome: 'Beta', nome: 'Rientro', data_nascita: '1980-01-01' },
    { id: 3, cognome: 'Gamma', nome: 'Ordinario', data_nascita: '1980-01-01' },
    { id: 4, cognome: 'Delta', nome: 'ExMinore', data_nascita: '2008-03-01' },
    { id: 5, cognome: 'Epsilon', nome: 'Minore', data_nascita: '2012-01-01' },
    { id: 6, cognome: 'Zeta', nome: 'PagatoGiusto', data_nascita: '1980-01-01' },
  ])
  const t = (id, id_socio, anno, quota_pagata) => ({
    id_tesseramento: id,
    id_socio,
    anno,
    quota_pagata,
  })
  await db.tesseramenti.bulkAdd([
    t('a', 1, 2026, 10),
    t('b', 2, 2023, 10),
    t('c', 2, 2026, 10),
    t('d', 3, 2025, 10),
    t('e', 3, 2026, 10),
    t('f', 4, 2023, 0),
    t('g', 4, 2026, 10),
    t('h', 5, 2026, 0),
    t('i', 6, 2026, 25),
  ])
})

describe('getQuotaAuditList', () => {
  it('segnala chi ha pagato meno della quota dei nuovi da nuovo o da rientro', async () => {
    const anomalie = await getQuotaAuditList(2026)
    expect(anomalie.map((a) => [a.socio.cognome, a.expectedQuota, a.reason])).toEqual([
      ['Alfa', 25, 'Nuovo Iscritto (primo pagamento registrato)'],
      ['Beta', 25, 'Rientro (nessun pagamento registrato e maggiorenne nel 2025)'],
    ])
  })

  it('usa la quota dei nuovi delle impostazioni, non 25 scritto a mano', async () => {
    await updateSetting('newMemberQuota', 30)
    const anomalie = await getQuotaAuditList(2026)
    expect(anomalie.map((a) => [a.socio.cognome, a.expectedQuota])).toEqual([
      ['Alfa', 30],
      ['Beta', 30],
      ['Zeta', 30],
    ])
  })
})

describe("db.js non ha piu' una copia delle regole di eta'", () => {
  it('calculateAgeInYear e isExemptFromPayment sono quelle di utils/payment.js', () => {
    expect(dbModule.calculateAgeInYear).toBe(payment.calculateAgeInYear)
    expect(dbModule.isExemptFromPayment).toBe(payment.isExemptFromPayment)
  })
})
