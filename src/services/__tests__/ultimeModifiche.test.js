// @vitest-environment node
import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../backupService', () => ({ backupService: { notifyChange: () => {} } }))

const { db, updateSocio, deleteSocio, deleteTesseramento, getRecentActivity } = await import(
  '../db.js'
)

// Solo dati inventati
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
  await db.soci.add({ id: 1, cognome: 'Prova', nome: 'Mario', data_nascita: '1980-01-01' })
  await db.tesseramenti.add({ id_tesseramento: 'p1', id_socio: 1, anno: 2024, quota_pagata: 10 })
})

describe('Ultime modifiche della Home: le modifiche dalla scheda del socio', () => {
  it("la modifica dell'anagrafica compare come modifica, non come eliminazione", async () => {
    await updateSocio(1, { cognome: 'Provini' })
    const [ultima] = await getRecentActivity(1)
    expect(ultima.type).toBe('update')
    expect(ultima.description).toBe('Modificata anagrafica: Provini Mario')
    expect((await db.soci.get(1)).cognome).toBe('Provini')
  })

  it("l'eliminazione di un pagamento lo toglie e si registra con l'anno", async () => {
    await deleteTesseramento('p1')
    expect(await db.tesseramenti.get('p1')).toBeUndefined()
    const [ultima] = await getRecentActivity(1)
    expect(ultima.type).toBe('delete')
    expect(ultima.description).toBe('Cancellato pagamento 2024')
  })

  it("un pagamento gia' eliminato non si elimina due volte in silenzio", async () => {
    await deleteTesseramento('p1')
    await expect(deleteTesseramento('p1')).rejects.toThrow('Pagamento non trovato')
  })

  it("l'eliminazione di un socio si legge come eliminazione", async () => {
    await deleteSocio(1)
    const [ultima] = await getRecentActivity(1)
    expect(ultima.type).toBe('delete')
    expect(ultima.description).toBe('Eliminato socio: Prova Mario')
  })
})
