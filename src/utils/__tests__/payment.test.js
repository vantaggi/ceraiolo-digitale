import { describe, it, expect } from 'vitest'
import { calculateAgeInYear, isExemptFromPayment, calculatePaymentStatus, statoAnno } from '../payment'

// Le regole sono descritte nei commenti di src/utils/payment.js: eta' contata sul solo anno,
// minorenni (< 18) esenti, condono degli arretrati se l'anno di riferimento e' pagato.

describe('calculateAgeInYear', () => {
  it("conta solo l'anno, non il compleanno", () => {
    expect(calculateAgeInYear('2008-12-31', 2026)).toBe(18)
    expect(calculateAgeInYear('2008-01-01', 2026)).toBe(18)
  })

  it('senza data di nascita, o con una data non valida, tratta il socio da maggiorenne', () => {
    expect(calculateAgeInYear(null, 2026)).toBe(99)
    expect(calculateAgeInYear('', 2026)).toBe(99)
    expect(calculateAgeInYear('non una data', 2026)).toBe(99)
  })
})

describe('isExemptFromPayment', () => {
  it("e' esente fino all'anno in cui compie 17 anni", () => {
    const socio = { data_nascita: '2010-06-15' }
    expect(isExemptFromPayment(socio, 2027)).toBe(true) // 17
    expect(isExemptFromPayment(socio, 2028)).toBe(false) // 18
  })

  it("senza data di nascita non e' esente", () => {
    expect(isExemptFromPayment({ data_nascita: null }, 2026)).toBe(false)
  })
})

describe('calculatePaymentStatus', () => {
  const adulto = { data_nascita: '1980-03-10', data_prima_iscrizione: 2020 }

  it("in regola se ha pagato l'anno di riferimento", () => {
    expect(
      calculatePaymentStatus(adulto, [2020, 2021, 2022, 2023, 2024, 2025, 2026], 2026),
    ).toEqual({
      inRegola: true,
      arretrati: [],
    })
  })

  it("condono: pagato l'anno di riferimento, gli anni saltati prima non contano", () => {
    expect(calculatePaymentStatus(adulto, [2020, 2026], 2026)).toEqual({
      inRegola: true,
      arretrati: [],
    })
  })

  it("non pagato l'anno di riferimento: arretrati dalla prima iscrizione in poi, anno incluso", () => {
    expect(calculatePaymentStatus(adulto, [2020, 2021, 2023], 2026)).toEqual({
      inRegola: false,
      arretrati: [2022, 2024, 2025, 2026],
    })
  })

  it('senza prima iscrizione parte dal primo anno pagato', () => {
    const socio = { data_nascita: '1980-03-10', data_prima_iscrizione: null }
    expect(calculatePaymentStatus(socio, [2023, 2024], 2026).arretrati).toEqual([2025, 2026])
  })

  it("senza prima iscrizione e senza pagamenti l'arretrato e' solo l'anno di riferimento", () => {
    const socio = { data_nascita: '1980-03-10', data_prima_iscrizione: null }
    expect(calculatePaymentStatus(socio, [], 2026)).toEqual({ inRegola: false, arretrati: [2026] })
  })

  it("minorenne gia' iscritto: in regola anche senza pagare", () => {
    const socio = { data_nascita: '2012-05-01', data_prima_iscrizione: 2022 }
    expect(calculatePaymentStatus(socio, [2022], 2026)).toEqual({ inRegola: true, arretrati: [] })
  })

  it('appena maggiorenne: gli anni da minorenne non diventano arretrati', () => {
    // nato nel 2008: 17 anni nel 2025, 18 nel 2026
    const socio = { data_nascita: '2008-09-20', data_prima_iscrizione: 2020 }
    expect(calculatePaymentStatus(socio, [2020], 2026)).toEqual({
      inRegola: false,
      arretrati: [2026],
    })
  })

  it("prima iscrizione dopo l'anno di riferimento: nessun arretrato", () => {
    const socio = { data_nascita: '1980-03-10', data_prima_iscrizione: 2027 }
    expect(calculatePaymentStatus(socio, [], 2026)).toEqual({ inRegola: true, arretrati: [] })
  })
})

describe('statoAnno (colonne V, X, O, - dei report)', () => {
  const adulto = { data_nascita: '1980-01-01' }

  it("conta dall'anno di prima iscrizione anche se il primo pagamento e' dopo", () => {
    // Iscritto nel 2010, primo pagamento registrato nel 2015
    const socio = { ...adulto, data_prima_iscrizione: 2010 }
    expect(statoAnno(socio, [2015], 2009)).toBe('-')
    expect(statoAnno(socio, [2015], 2010)).toBe('X')
    expect(statoAnno(socio, [2015], 2014)).toBe('X')
    expect(statoAnno(socio, [2015], 2015)).toBe('V')
  })

  it("senza anno dichiarato parte dal primo pagamento", () => {
    expect(statoAnno(adulto, [2015], 2014)).toBe('-')
    expect(statoAnno(adulto, [2015], 2016)).toBe('X')
  })

  it("da minorenne non pagato e' O, pagato e' V", () => {
    const socio = { data_nascita: '2012-06-01', data_prima_iscrizione: 2020 }
    expect(statoAnno(socio, [2020], 2020)).toBe('V')
    expect(statoAnno(socio, [2020], 2025)).toBe('O')
    expect(statoAnno(socio, [2020], 2030)).toBe('X') // 18 anni
  })

  it('senza iscrizione ne pagamenti ogni anno e -', () => {
    expect(statoAnno(adulto, [], 2026)).toBe('-')
  })
})
