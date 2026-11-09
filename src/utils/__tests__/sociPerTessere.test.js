import { describe, it, expect } from 'vitest'
import { ANNI_SENZA_PAGARE_TESSERE, pagaDaNonPiuDi, primoAnnoValido } from '../sociPerTessere'

const socio = (...anni) => ({ tesseramenti: anni.map((anno) => ({ anno })) })

describe('tessere: chi non paga da piu di N anni', () => {
  it('nel 2026 con 3 anni resta chi ha pagato dal 2023', () => {
    expect(primoAnnoValido(3, 2026)).toBe(2023)
    expect(pagaDaNonPiuDi(socio(2023), 3, 2026)).toBe(true)
    expect(pagaDaNonPiuDi(socio(2010, 2022), 3, 2026)).toBe(false)
  })

  it('per le tessere 2027 con 3 anni contano i pagamenti 2024, 2025 e 2026', () => {
    expect(primoAnnoValido(3, 2027)).toBe(2024)
    expect(pagaDaNonPiuDi(socio(2024), 3, 2027)).toBe(true)
    expect(pagaDaNonPiuDi(socio(2023), 3, 2027)).toBe(false)
  })

  it('con 5 anni resta chi ha pagato dal 2021, come la spunta di prima', () => {
    expect(pagaDaNonPiuDi(socio(2021), 5, 2026)).toBe(true)
    expect(pagaDaNonPiuDi(socio(2020), 5, 2026)).toBe(false)
    expect(pagaDaNonPiuDi(socio(2022), 5, 2026)).toBe(true)
  })

  it("conta l'ultimo pagamento, anche fuori ordine o scritto come testo", () => {
    expect(pagaDaNonPiuDi(socio(2025, 2001), 3, 2026)).toBe(true)
    expect(pagaDaNonPiuDi(socio('2024'), 3, 2026)).toBe(true)
  })

  it('senza pagamenti il socio resta fuori', () => {
    expect(pagaDaNonPiuDi({}, 3, 2026)).toBe(false)
    expect(pagaDaNonPiuDi(socio(), 5, 2026)).toBe(false)
  })

  it("chi ha pagato quest'anno o un anno avanti resta", () => {
    expect(pagaDaNonPiuDi(socio(2026), 3, 2026)).toBe(true)
    expect(pagaDaNonPiuDi(socio(2027), 3, 2026)).toBe(true)
  })

  it('un anno mancante o non numerico non conta', () => {
    expect(pagaDaNonPiuDi({ tesseramenti: [{ anno: 'x' }] }, 3, 2026)).toBe(false)
    expect(pagaDaNonPiuDi({ tesseramenti: [{}, { anno: 2024 }] }, 3, 2026)).toBe(true)
  })

  it('il menu va da 1 a 8 anni; con 1 anno per le tessere 2027 conta solo il 2026', () => {
    expect(ANNI_SENZA_PAGARE_TESSERE).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(pagaDaNonPiuDi(socio(2026), 1, 2027)).toBe(true)
    expect(pagaDaNonPiuDi(socio(2025), 1, 2027)).toBe(false)
  })
})
