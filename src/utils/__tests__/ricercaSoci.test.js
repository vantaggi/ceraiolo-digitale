import { describe, it, expect } from 'vitest'
import {
  anniPagatiPerSocio,
  leggiRecenti,
  leggiRicerca,
  passaFiltri,
  ricordaSocioAperto,
  salvaRicerca,
} from '../ricercaSoci'

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

describe('filtri della pagina Soci', () => {
  const socio = (campi) => ({ nome: 'Mario', cognome: 'Rossi', note: '', data_nascita: '1980-05-01', gruppo_appartenenza: 'Interna', ...campi })

  it("l'eta' conta solo l'anno di nascita, come per la quota", () => {
    // Nato a dicembre 2008: nel 2026 e' maggiorenne per tutto l'anno
    const dicembre = socio({ data_nascita: '2008-12-20' })
    expect(passaFiltri(dicembre, { ageCategory: 'maggiorenni' }, 2026)).toBe(true)
    expect(passaFiltri(dicembre, { ageCategory: 'minorenni' }, 2026)).toBe(false)
    expect(passaFiltri(socio({ data_nascita: '2009-01-02' }), { ageCategory: 'minorenni' }, 2026)).toBe(true)
  })

  it('senza data di nascita il socio non entra nei filtri di eta', () => {
    expect(passaFiltri(socio({ data_nascita: '' }), { ageCategory: 'maggiorenni' }, 2026)).toBe(false)
    expect(passaFiltri(socio({ data_nascita: '' }), { ageCategory: 'tutti' }, 2026)).toBe(true)
  })

  it('manicchia e parole cercate, tutte insieme', () => {
    const s = socio({ note: 'portatore' })
    expect(passaFiltri(s, { group: 'Interna' }, 2026)).toBe(true)
    expect(passaFiltri(s, { group: 'Esterna' }, 2026)).toBe(false)
    expect(passaFiltri(s, { searchTerm: '  ross  MAR ' }, 2026)).toBe(true)
    expect(passaFiltri(s, { searchTerm: 'rossi portatore' }, 2026)).toBe(true)
    expect(passaFiltri(s, { searchTerm: 'rossi bianchi' }, 2026)).toBe(false)
  })

  it('raggruppa gli anni pagati per socio', () => {
    const mappa = anniPagatiPerSocio([
      { id_socio: 1, anno: 2025 },
      { id_socio: '1', anno: '2026' },
      { id_socio: 2, anno: 2024 },
    ])
    expect(mappa.get(1)).toEqual([2025, 2026])
    expect(mappa.get(2)).toEqual([2024])
    expect(mappa.get(3)).toBeUndefined()
  })
})

describe('ultimi soci aperti', () => {
  it("l'ultimo aperto va in cima, senza doppioni, al massimo cinque", () => {
    const s = archivio()
    for (const id of [1, 2, 3, 2, '4', 5, 6]) ricordaSocioAperto(s, id)
    expect(leggiRecenti(s)).toEqual([6, 5, 4, 2, 3])
  })

  it('ignora id non validi e dati rotti', () => {
    const s = archivio()
    ricordaSocioAperto(s, 'nuovo')
    expect(leggiRecenti(s)).toEqual([])
    s.setItem('recent_members', '{rotto')
    expect(leggiRecenti(s)).toEqual([])
    ricordaSocioAperto(s, 7)
    expect(leggiRecenti(s)).toEqual([7])
  })
})
