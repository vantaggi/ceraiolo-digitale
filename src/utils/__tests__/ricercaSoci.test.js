import { describe, it, expect } from 'vitest'
import { leggiRicerca, salvaRicerca } from '../ricercaSoci'

const archivio = () => {
  const dati = new Map()
  return { getItem: (k) => dati.get(k) ?? null, setItem: (k, v) => dati.set(k, String(v)) }
}

describe('ricerca soci ricordata', () => {
  it('ritrova testo e filtri salvati', () => {
    const s = archivio()
    salvaRicerca(s, { searchTerm: 'rossi', ageCategory: 'minorenni', group: 'Interna', renewalYear: 2026, altro: 1 })
    expect(leggiRicerca(s)).toEqual({ searchTerm: 'rossi', ageCategory: 'minorenni', group: 'Interna', renewalYear: 2026 })
  })

  it('senza niente salvato, o con dati rotti, non ritrova nulla', () => {
    expect(leggiRicerca(archivio())).toBeNull()
    const s = archivio()
    s.setItem('ricerca_soci', '{non json')
    expect(leggiRicerca(s)).toBeNull()
  })

  it("se l'archivio del browser non funziona non si rompe", () => {
    const rotto = { getItem: () => { throw new Error('bloccato') }, setItem: () => { throw new Error('bloccato') } }
    expect(leggiRicerca(rotto)).toBeNull()
    expect(() => salvaRicerca(rotto, { searchTerm: 'x' })).not.toThrow()
  })
})
