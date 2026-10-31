import { describe, it, expect } from 'vitest'
import { annoIscrizione, valutaDirittoVoto } from '../voto'

// Regola in src/utils/voto.js. Elezioni nel 2026, soci inventati.
const ELEZIONI = 2026
const adulto = (extra = {}) => ({ data_nascita: '1980-05-10', ...extra })

describe('annoIscrizione', () => {
  it("prende il primo tra l'anno dichiarato e il primo pagamento", () => {
    expect(annoIscrizione({ data_prima_iscrizione: 2015 }, [2018, 2019])).toBe(2015)
    expect(annoIscrizione({ data_prima_iscrizione: 2020 }, [2018, 2019])).toBe(2018)
    expect(annoIscrizione({}, [2019, 2018])).toBe(2018)
  })

  it('senza anno dichiarato e senza pagamenti non lo sa', () => {
    expect(annoIscrizione({ data_prima_iscrizione: null }, [])).toBeNull()
    expect(annoIscrizione({ data_prima_iscrizione: '' }, [])).toBeNull()
  })
})

describe('valutaDirittoVoto', () => {
  it('vota chi e iscritto da prima ed e in regola fino all anno delle elezioni', () => {
    const r = valutaDirittoVoto(adulto(), [2020, 2021, 2022, 2023, 2024, 2025, 2026], ELEZIONI)
    expect(r.stato).toBe('si')
    expect(r.quoteMancanti).toEqual([])
  })

  it('il primo anno di iscrizione non si vota, dal secondo si', () => {
    expect(valutaDirittoVoto(adulto(), [2026], ELEZIONI).stato).toBe('no')
    expect(valutaDirittoVoto(adulto(), [2025, 2026], ELEZIONI).stato).toBe('si')
  })

  it("un nuovo iscritto appena maggiorenne non vota nel primo anno", () => {
    // Nato nel 2008: 17 anni nel 2025, ma iscritto solo nel 2026.
    const socio = { data_nascita: '2008-03-01', data_prima_iscrizione: 2026 }
    expect(valutaDirittoVoto(socio, [2026], ELEZIONI).stato).toBe('no')
  })

  it("la maggiore eta' si conta sull'anno di nascita, non sul compleanno", () => {
    // Iscritto da minorenne nel 2020; compie 18 anni a dicembre 2026.
    const socio = { data_nascita: '2008-12-31', data_prima_iscrizione: 2020 }
    expect(valutaDirittoVoto(socio, [2020, 2026], ELEZIONI).stato).toBe('si')
    expect(valutaDirittoVoto(socio, [2020, 2027], 2025).stato).toBe('no')
  })

  it('gli anni da minorenne contano come in regola', () => {
    const socio = { data_nascita: '2007-01-01', data_prima_iscrizione: 2015 }
    // Pagato solo il primo anno, poi esente fino al 2024 (17 anni).
    const r = valutaDirittoVoto(socio, [2015, 2025, 2026], ELEZIONI)
    expect(r.stato).toBe('si')
  })

  it("se manca l'anno delle elezioni puo' regolarizzare", () => {
    const r = valutaDirittoVoto(adulto(), [2023, 2024, 2025], ELEZIONI)
    expect(r.stato).toBe('regolarizza')
    expect(r.quoteMancanti).toEqual([2026])
  })

  it("se mancano gli ultimi tre anni ma il quarto e' pagato puo' regolarizzare", () => {
    const r = valutaDirittoVoto(adulto(), [2020, 2021, 2022, 2023], ELEZIONI)
    expect(r.stato).toBe('regolarizza')
    expect(r.quoteMancanti).toEqual([2024, 2025, 2026])
  })

  it('con quattro anni di fila senza pagare e cancellato', () => {
    const r = valutaDirittoVoto(adulto(), [2020, 2021, 2022], ELEZIONI)
    expect(r.stato).toBe('no')
    expect(r.motivo).toMatch(/Nessun pagamento dal 2023 al 2026/)
  })

  it("chi si reiscrive dopo la cancellazione non vota nell'anno della reiscrizione", () => {
    const r = valutaDirittoVoto(adulto(), [2020, 2021, 2022, 2026], ELEZIONI)
    expect(r.stato).toBe('no')
    expect(r.motivo).toBe("Socio reiscritto nell'anno 2026")
  })

  it("chi si e' reiscritto l'anno prima vota", () => {
    expect(valutaDirittoVoto(adulto(), [2018, 2019, 2025, 2026], ELEZIONI).stato).toBe('si')
  })

  it('i minorenni nell anno delle elezioni non votano', () => {
    const socio = { data_nascita: '2009-01-01', data_prima_iscrizione: 2015 }
    expect(valutaDirittoVoto(socio, [2015, 2026], ELEZIONI).stato).toBe('no')
  })

  it('senza data di nascita non vota', () => {
    const r = valutaDirittoVoto({ data_nascita: null }, [2020, 2026], ELEZIONI)
    expect(r.stato).toBe('no')
    expect(r.motivo).toBe('Data di nascita mancante')
  })

  it("chi si e' iscritto dopo le elezioni non vota", () => {
    expect(valutaDirittoVoto(adulto(), [2027], ELEZIONI).stato).toBe('no')
  })
})
