import { describe, it, expect } from 'vitest'
import { pagaDaNonPiuDi, primoAnnoValido } from '../tessere'

const socio = (...anni) => ({ tesseramenti: anni.map((anno) => ({ anno })) })

describe('tessere: chi non paga da piu di N anni', () => {
  it('nel 2026 con 3 anni resta chi ha pagato dal 2023', () => {
    expect(primoAnnoValido(3, 2026)).toBe(2023)
    expect(pagaDaNonPiuDi(socio(2023), 3, 2026)).toBe(true)
    expect(pagaDaNonPiuDi(socio(2010, 2022), 3, 2026)).toBe(false)
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
})
