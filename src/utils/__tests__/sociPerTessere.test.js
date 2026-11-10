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

  // Solo dati inventati. Eta' dal solo anno di nascita (Cioti, 10 novembre 2026).
  const nato = (anno, ...pagati) => ({
    data_nascita: `${anno}-06-15`,
    data_prima_iscrizione: anno + 2,
    ...socio(...pagati),
  })

  it("un minorenne iscritto nell'anno delle tessere resta sempre, anche senza pagamenti", () => {
    for (const n of ANNI_SENZA_PAGARE_TESSERE) {
      expect(pagaDaNonPiuDi(nato(2012), n, 2027)).toBe(true) // 15 anni
      expect(pagaDaNonPiuDi(nato(2010), n, 2027)).toBe(true) // 17 anni
    }
  })

  it('gli anni da minorenne contano come pagati anche dopo i 18 anni', () => {
    // nato nel 2008: minorenne fino al 2025, 19 anni nel 2027, mai pagato
    expect(pagaDaNonPiuDi(nato(2008), 2, 2027)).toBe(true) // conta il 2025
    expect(pagaDaNonPiuDi(nato(2008), 1, 2027)).toBe(false) // conta solo il 2026
    // nato nel 2000: minorenne fino al 2017, mai pagato da maggiorenne
    expect(pagaDaNonPiuDi(nato(2000), 8, 2027)).toBe(false)
    expect(pagaDaNonPiuDi(nato(2000, 2025), 3, 2027)).toBe(true)
  })

  it("gli anni da minorenne prima dell'iscrizione non contano", () => {
    // nato nel 2008, iscritto nel 2026 senza pagare: il 2025 da minorenne non era socio
    const tardi = { ...nato(2008), data_prima_iscrizione: 2026 }
    expect(pagaDaNonPiuDi(tardi, 2, 2027)).toBe(false)
    expect(pagaDaNonPiuDi({ ...nato(2008), data_prima_iscrizione: 2020 }, 2, 2027)).toBe(true)
  })

  it('senza data di nascita conta come maggiorenne (la segnala Controlli dati)', () => {
    expect(pagaDaNonPiuDi({ data_prima_iscrizione: 2020 }, 3, 2027)).toBe(false)
  })
})
