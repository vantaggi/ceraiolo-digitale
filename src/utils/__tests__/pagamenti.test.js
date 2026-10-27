import { describe, it, expect } from 'vitest'
import { anniConPagamenti, filtraPagamenti, totaliPagamenti } from '../pagamenti'

// Soci e pagamenti inventati
const soci = new Map([
  [1, { cognome: 'Rossi', nome: 'Mario' }],
  [2, { cognome: 'Nicolò', nome: 'Anna Maria' }],
  [3, { cognome: 'Bianchi', nome: 'Luca' }],
])
const p = (
  id,
  id_socio,
  anno,
  data_pagamento,
  numero_blocchetto,
  numero_ricevuta,
  quota_pagata,
) => ({
  id_tesseramento: id,
  id_socio,
  anno,
  data_pagamento,
  numero_blocchetto,
  numero_ricevuta,
  quota_pagata,
})
const tesseramenti = [
  p('a', 1, 2026, '2026-04-10', 2, 12, 10),
  p('b', 2, 2026, '2026-04-10', 2, 11, 25),
  p('c', 1, 2025, '2026-04-10', 2, 12, 10), // arretrato 2025 pagato nel 2026
  p('d', 3, 2026, '2026-05-02', '3', 21, 10), // blocchetto salvato come testo
  p('e', 3, 2025, '2025-04-11', 1, 3, 10),
  p('f', 9, '2024', '2024-04-12', 1, 1, 10), // socio non piu' in archivio
]
const ids = (righe) => righe.map((r) => r.id_tesseramento)

describe('elenco dei pagamenti', () => {
  it("gli anni con pagamenti, dal piu' recente", () => {
    expect(anniConPagamenti(tesseramenti)).toEqual([2026, 2025, 2024])
  })

  it("l'anno e' quello della quota: un arretrato sta nell'anno che salda", () => {
    expect(ids(filtraPagamenti(tesseramenti, soci, { anno: 2025 }))).toEqual(['c', 'e'])
  })

  it("dal piu' recente; a parita' di data per blocchetto e ricevuta", () => {
    expect(ids(filtraPagamenti(tesseramenti, soci, { anno: 2026 }))).toEqual(['d', 'b', 'a'])
  })

  it('filtra per blocchetto anche se salvato come testo', () => {
    expect(ids(filtraPagamenti(tesseramenti, soci, { blocchetto: 3 }))).toEqual(['d'])
    expect(ids(filtraPagamenti(tesseramenti, soci, { blocchetto: '' }))).toHaveLength(6)
  })

  it("cerca per nome (senza accenti, piu' parole) o per numero di ricevuta", () => {
    expect(ids(filtraPagamenti(tesseramenti, soci, { testo: 'nicolo anna' }))).toEqual(['b'])
    expect(ids(filtraPagamenti(tesseramenti, soci, { testo: ' 12 ' }))).toEqual(['a', 'c'])
    expect(filtraPagamenti(tesseramenti, soci, { testo: 'zzz' })).toEqual([])
    expect(filtraPagamenti(tesseramenti, soci, { anno: 2024 })[0].socio).toBe('')
  })

  it('totali: pagamenti, soci diversi, incassato', () => {
    expect(totaliPagamenti(filtraPagamenti(tesseramenti, soci, { anno: 2026 }))).toEqual({
      pagamenti: 3,
      soci: 3,
      incassato: 45,
    })
    expect(totaliPagamenti([])).toEqual({ pagamenti: 0, soci: 0, incassato: 0 })
  })
})
