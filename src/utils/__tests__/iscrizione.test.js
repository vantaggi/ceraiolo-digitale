import { describe, it, expect } from 'vitest'
import { isIscritto, isNuovo, iscrittoTraAnni, movimentoAnno } from '../iscrizione'

// Soci inventati. Le definizioni sono quelle di docs/GLOSSARIO.md.
const adulto = (extra = {}) => ({ data_nascita: '1980-01-01', ...extra })
const ragazzo = (extra = {}) => ({ data_nascita: '2010-06-01', ...extra }) // 18 anni nel 2028

describe('isIscritto', () => {
  it("chi ha pagato l'anno e' iscritto, chi non ha pagato da maggiorenne no", () => {
    expect(isIscritto(adulto(), [2025], 2025)).toBe(true)
    expect(isIscritto(adulto(), [2025], 2026)).toBe(false)
  })

  it("il minorenne esente e' iscritto dall'anno di iscrizione, non prima", () => {
    const socio = ragazzo({ data_prima_iscrizione: 2020 })
    expect(isIscritto(socio, [], 2019)).toBe(false)
    expect(isIscritto(socio, [], 2020)).toBe(true)
    expect(isIscritto(socio, [], 2027)).toBe(true)
    expect(isIscritto(socio, [], 2028)).toBe(false) // maggiorenne, non ha pagato
  })

  it('il minorenne senza anno di iscrizione e senza pagamenti non e iscritto', () => {
    expect(isIscritto(ragazzo(), [], 2026)).toBe(false)
  })

  it("prima di nascere non si e' iscritti, anche con un anno dichiarato sbagliato", () => {
    expect(isIscritto(ragazzo({ data_prima_iscrizione: 2005 }), [], 2008)).toBe(false)
  })
})

describe('isNuovo', () => {
  it("e' il primo tra l'anno dichiarato e il primo pagamento", () => {
    const socio = adulto({ data_prima_iscrizione: 2010 })
    expect(isNuovo(socio, [2026], 2026)).toBe(false)
    expect(isNuovo(adulto(), [2026], 2026)).toBe(true)
    expect(isNuovo(adulto({ data_prima_iscrizione: 2026 }), [2024, 2026], 2026)).toBe(false)
  })

  it("il minorenne esente e' nuovo nel suo anno di iscrizione anche senza pagamento", () => {
    expect(isNuovo(ragazzo({ data_prima_iscrizione: 2026 }), [], 2026)).toBe(true)
  })

  it("non e' nuovo chi ha solo dichiarato l'anno ma da maggiorenne non ha pagato", () => {
    expect(isNuovo(adulto({ data_prima_iscrizione: 2026 }), [], 2026)).toBe(false)
  })
})

describe('movimentoAnno', () => {
  const anni = [2020, 2021, 2024]
  it('nuovo, confermato, non rinnovato, fuori, rientro', () => {
    expect(movimentoAnno(adulto(), anni, 2020)).toBe('nuovo')
    expect(movimentoAnno(adulto(), anni, 2021)).toBe('confermato')
    expect(movimentoAnno(adulto(), anni, 2022)).toBe('non-rinnovato')
    expect(movimentoAnno(adulto(), anni, 2023)).toBeNull()
    expect(movimentoAnno(adulto(), anni, 2024)).toBe('rientro')
  })

  it('chi era da reiscrivere e torna conta come rientro, non come nuovo', () => {
    expect(movimentoAnno(adulto(), [2015, 2026], 2026)).toBe('rientro')
  })

  it("il minorenne esente diventato maggiorenne che non paga e' non rinnovato", () => {
    const socio = ragazzo({ data_prima_iscrizione: 2020 })
    expect(movimentoAnno(socio, [], 2027)).toBe('confermato')
    expect(movimentoAnno(socio, [], 2028)).toBe('non-rinnovato')
  })
})

describe('iscrittoTraAnni: gli anni da minorenne contano come pagati (Cioti, 10 novembre 2026)', () => {
  it("pagato, o minorenne esente dopo l'iscrizione, in un anno della finestra", () => {
    const r = ragazzo({ data_prima_iscrizione: 2020 })
    expect(iscrittoTraAnni(r, [], 2025, 2027)).toBe(true) // 17 anni nel 2027
    expect(iscrittoTraAnni(r, [], 2028, 2030)).toBe(false) // maggiorenne, mai pagato
    expect(iscrittoTraAnni(r, ['2029'], 2028, 2030)).toBe(true) // anno scritto come testo
    expect(iscrittoTraAnni(r, [], 2015, 2019)).toBe(false) // prima dell'iscrizione
  })

  it('senza anno di iscrizione ne pagamenti non e iscritto, come in statoAnno', () => {
    expect(iscrittoTraAnni(ragazzo(), [], 2020, 2027)).toBe(false)
  })
})
