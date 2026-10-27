import { describe, it, expect } from 'vitest'
import { elencoAventiDiritto, SENZA_MANICCHIA } from '../aventiDiritto'

// Soci inventati, elezioni 2026.
const socio = (id, cognome, gruppo, anni, extra = {}) => ({
  id,
  cognome,
  nome: 'Test',
  data_nascita: '1980-01-01',
  gruppo_appartenenza: gruppo,
  tesseramenti: anni.map((anno) => ({ anno })),
  ...extra,
})

const SOCI = [
  socio(1, 'Rossi', 'INTERNA', [2022, 2023, 2024, 2025, 2026]), // si
  socio(2, 'Bianchi', 'INTERNA', [2022, 2023, 2024]), // regolarizza 2025, 2026
  socio(3, 'Verdi', 'BRANCA', [2025, 2026]), // si
  socio(4, 'Neri', 'BRANCA', [2026]), // no: nuovo iscritto
  socio(5, 'Gialli', 'BRANCA', [2010, 2011]), // no: cancellato da anni
  socio(6, 'Blu', null, [2024, 2025]), // regolarizza 2026
]

describe('elencoAventiDiritto', () => {
  it('divide per manicchia in ordine alfabetico, soci per cognome', () => {
    const { gruppi } = elencoAventiDiritto(SOCI, 2026)
    expect(gruppi.map((g) => g.manicchia)).toEqual(['BRANCA', 'INTERNA', SENZA_MANICCHIA])
    expect(gruppi[1].righe.map((r) => r.socio.cognome)).toEqual(['Bianchi', 'Rossi'])
  })

  it('di base mette solo Si e Regolarizza, con le quote da pagare', () => {
    const { gruppi, totali } = elencoAventiDiritto(SOCI, 2026)
    const tutte = gruppi.flatMap((g) => g.righe)
    expect(tutte.map((r) => r.stato).sort()).toEqual(['regolarizza', 'regolarizza', 'si', 'si'])
    expect(tutte.find((r) => r.socio.id === 2).quoteMancanti).toEqual([2025, 2026])
    expect(totali).toEqual({ si: 2, regolarizza: 2, no: 0, quoteMancanti: 3 })
  })

  it("con i non aventi diritto aggiunge i recenti, non i cancellati da anni", () => {
    const { gruppi } = elencoAventiDiritto(SOCI, 2026, { includiNonAventi: true })
    const branca = gruppi.find((g) => g.manicchia === 'BRANCA')
    expect(branca.righe.map((r) => [r.socio.cognome, r.stato])).toEqual([
      ['Neri', 'no'],
      ['Verdi', 'si'],
    ])
    expect(branca.righe[0].motivo).toMatch(/Nuovo iscritto/)
    expect(branca.totali).toMatchObject({ si: 1, no: 1 })
  })

  it('con una manicchia scelta restituisce solo quella', () => {
    const { gruppi, totali } = elencoAventiDiritto(SOCI, 2026, { manicchia: 'INTERNA' })
    expect(gruppi.map((g) => g.manicchia)).toEqual(['INTERNA'])
    expect(totali).toMatchObject({ si: 1, regolarizza: 1 })
  })

  it('senza soci restituisce un elenco vuoto', () => {
    expect(elencoAventiDiritto([], 2026)).toEqual({
      gruppi: [],
      totali: { si: 0, regolarizza: 0, no: 0, quoteMancanti: 0 },
    })
  })
})
