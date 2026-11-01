import { describe, it, expect } from 'vitest'
import {
  calculateAgeInYear,
  isExemptFromPayment,
  calculatePaymentStatus,
  descriviArretrati,
  statoAnno,
  isMinorenne,
  MAGGIORE_ETA,
  tipoQuota,
  quotaProposta,
  quotaPropostaPerAnni,
  QUOTA_ORDINARIA_PREDEFINITA,
  QUOTA_NUOVI_PREDEFINITA,
  TESTI_STATO_ANNO,
} from '../payment'

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
      daReiscrivere: false,
    })
  })

  it("condono: pagato l'anno di riferimento, gli anni saltati prima non contano", () => {
    expect(calculatePaymentStatus(adulto, [2020, 2026], 2026)).toEqual({
      inRegola: true,
      arretrati: [],
      daReiscrivere: false,
    })
  })

  it("non pagato l'anno di riferimento: arretrati dopo l'ultimo anno pagato, anno incluso", () => {
    // Il 2022 saltato e' condonato dal pagamento del 2023
    expect(calculatePaymentStatus(adulto, [2020, 2021, 2023], 2026)).toEqual({
      inRegola: false,
      arretrati: [2024, 2025, 2026],
      daReiscrivere: false,
    })
  })

  it('piu di tre anni scoperti: nessun arretrato, va reiscritto', () => {
    expect(calculatePaymentStatus(adulto, [2020, 2021, 2022], 2026)).toEqual({
      inRegola: false,
      arretrati: [],
      daReiscrivere: true,
    })
    // Iscrizione dichiarata ma nessun pagamento da allora
    expect(calculatePaymentStatus(adulto, [], 2026).daReiscrivere).toBe(true)
  })

  it('ex minorenne: gli anni da esente contano come in regola', () => {
    // nato nel 2007: 18 anni nel 2025, mai pagato da maggiorenne
    const socio = { data_nascita: '2007-02-01', data_prima_iscrizione: 2015 }
    expect(calculatePaymentStatus(socio, [2015], 2026).arretrati).toEqual([2025, 2026])
  })

  it('descriviArretrati scrive cosa mostrare nei PDF', () => {
    expect(descriviArretrati({ arretrati: [2025, 2026], daReiscrivere: false })).toBe('2025, 2026')
    expect(descriviArretrati({ arretrati: [], daReiscrivere: false })).toBe('-')
    expect(descriviArretrati({ arretrati: [], daReiscrivere: true })).toBe('Da reiscrivere')
  })

  it('senza prima iscrizione parte dal primo anno pagato', () => {
    const socio = { data_nascita: '1980-03-10', data_prima_iscrizione: null }
    expect(calculatePaymentStatus(socio, [2023, 2024], 2026).arretrati).toEqual([2025, 2026])
  })

  it("senza prima iscrizione e senza pagamenti l'arretrato e' solo l'anno di riferimento", () => {
    const socio = { data_nascita: '1980-03-10', data_prima_iscrizione: null }
    expect(calculatePaymentStatus(socio, [], 2026)).toEqual({
      inRegola: false,
      arretrati: [2026],
      daReiscrivere: false,
    })
  })

  it("minorenne gia' iscritto: in regola anche senza pagare", () => {
    const socio = { data_nascita: '2012-05-01', data_prima_iscrizione: 2022 }
    expect(calculatePaymentStatus(socio, [2022], 2026)).toEqual({
      inRegola: true,
      arretrati: [],
      daReiscrivere: false,
    })
  })

  it('appena maggiorenne: gli anni da minorenne non diventano arretrati', () => {
    // nato nel 2008: 17 anni nel 2025, 18 nel 2026
    const socio = { data_nascita: '2008-09-20', data_prima_iscrizione: 2020 }
    expect(calculatePaymentStatus(socio, [2020], 2026)).toEqual({
      inRegola: false,
      arretrati: [2026],
      daReiscrivere: false,
    })
  })

  it("prima iscrizione dopo l'anno di riferimento: nessun arretrato", () => {
    const socio = { data_nascita: '1980-03-10', data_prima_iscrizione: 2027 }
    expect(calculatePaymentStatus(socio, [], 2026)).toEqual({
      inRegola: true,
      arretrati: [],
      daReiscrivere: false,
    })
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

  it('senza anno dichiarato parte dal primo pagamento', () => {
    expect(statoAnno(adulto, [2015], 2014)).toBe('-')
    expect(statoAnno(adulto, [2015], 2016)).toBe('X')
  })

  it("da minorenne non pagato e' O, pagato e' V", () => {
    const socio = { data_nascita: '2012-06-01', data_prima_iscrizione: 2020 }
    expect(statoAnno(socio, [2020], 2020)).toBe('V')
    expect(statoAnno(socio, [2020], 2025)).toBe('O')
    expect(statoAnno(socio, [2020], 2030)).toBe('X') // 18 anni
  })

  it("prima dell'anno di nascita e' -, anche con un anno dichiarato sbagliato", () => {
    const socio = { data_nascita: '2010-06-01', data_prima_iscrizione: 2005 }
    expect(statoAnno(socio, [], 2008)).toBe('-')
    expect(statoAnno(socio, [], 2010)).toBe('O')
  })

  it('senza iscrizione ne pagamenti ogni anno e -', () => {
    expect(statoAnno(adulto, [], 2026)).toBe('-')
  })
})

describe('isMinorenne', () => {
  it("conta solo l'anno di nascita: chi nasce a dicembre e' maggiorenne da gennaio", () => {
    expect(isMinorenne('2008-12-31', 2025)).toBe(true) // 17
    expect(isMinorenne('2008-12-31', 2026)).toBe(false) // 18 nell'anno
  })

  it('senza data valida tratta il socio da maggiorenne', () => {
    expect(isMinorenne(null, 2026)).toBe(false)
    expect(isMinorenne('non una data', 2026)).toBe(false)
  })

  it("usa la stessa soglia dell'esenzione", () => {
    expect(MAGGIORE_ETA).toBe(18)
    const socio = { data_nascita: '2010-06-15' }
    for (const anno of [2026, 2027, 2028, 2029]) {
      expect(isMinorenne(socio.data_nascita, anno)).toBe(isExemptFromPayment(socio, anno))
    }
  })
})

describe('tipoQuota', () => {
  const adulto = { data_nascita: '1980-01-01' }

  it("nuovo: nessun pagamento prima di quell'anno (anche se ne ha dopo)", () => {
    expect(tipoQuota(adulto, [], 2026)).toBe('nuovo')
    expect(tipoQuota(adulto, [2026], 2026)).toBe('nuovo')
    expect(tipoQuota(adulto, [2026], 2025)).toBe('nuovo')
  })

  it("rientro: non ha pagato l'anno prima da maggiorenne", () => {
    expect(tipoQuota(adulto, [2023, 2024], 2026)).toBe('rientro')
  })

  it("ordinaria: ha pagato l'anno prima", () => {
    expect(tipoQuota(adulto, [2024, 2025], 2026)).toBe('ordinaria')
  })

  it("ordinaria: l'anno saltato era da minorenne, quindi esente", () => {
    const ragazzo = { data_nascita: '2008-03-01' } // 17 nel 2025, 18 nel 2026
    expect(tipoQuota(ragazzo, [2023], 2026)).toBe('ordinaria')
  })

  it("esente: minorenne nell'anno", () => {
    expect(tipoQuota({ data_nascita: '2012-01-01' }, [], 2026)).toBe('esente')
  })

  it('ordinaria: minorenne esente iscritto senza pagamenti, al primo anno da maggiorenne', () => {
    const ragazzo = { data_nascita: '2008-03-01', data_prima_iscrizione: 2020 }
    expect(tipoQuota(ragazzo, [], 2026)).toBe('ordinaria')
  })

  it("rientro, non nuovo: anno dichiarato vecchio, nessun pagamento e l'anno prima fuori", () => {
    expect(tipoQuota({ ...adulto, data_prima_iscrizione: 2010 }, [], 2026)).toBe('rientro')
  })

  it("nuovo: l'anno dichiarato e' proprio quello", () => {
    expect(tipoQuota({ ...adulto, data_prima_iscrizione: 2026 }, [], 2026)).toBe('nuovo')
  })
})

describe('quotaProposta', () => {
  const quote = { quotaOrdinaria: 10, quotaNuovi: 25 }
  it('nuovi e rientri pagano la quota dei nuovi, gli altri la ordinaria', () => {
    expect(quotaProposta('nuovo', quote)).toBe(25)
    expect(quotaProposta('rientro', quote)).toBe(25)
    expect(quotaProposta('ordinaria', quote)).toBe(10)
    expect(quotaProposta('esente', quote)).toBe(10)
  })
  it('i valori predefiniti sono quelli di oggi', () => {
    expect(QUOTA_ORDINARIA_PREDEFINITA).toBe(10)
    expect(QUOTA_NUOVI_PREDEFINITA).toBe(25)
  })
})

describe('TESTI_STATO_ANNO', () => {
  it('ha una parola del glossario per ogni stato di statoAnno', () => {
    expect(TESTI_STATO_ANNO).toEqual({
      V: 'Pagata',
      X: 'Da pagare',
      O: 'Esente',
      '-': 'Non iscritto',
    })
  })
})

describe("quotaPropostaPerAnni (piu' anni nello stesso pagamento)", () => {
  // Inventato: ha pagato fino al 2024, arretrato il 2025
  const socio = { data_nascita: '1980-05-15', data_prima_iscrizione: 2020 }
  const pagati = [2020, 2021, 2022, 2023, 2024]
  const quote = { quotaOrdinaria: 10, quotaNuovi: 25 }

  it('un rientro che salda gli arretrati paga la quota ordinaria', () => {
    expect(quotaPropostaPerAnni(socio, pagati, [2026], quote)).toBe(25)
    expect(quotaPropostaPerAnni(socio, pagati, [2025, 2026], quote)).toBe(10)
  })

  it('un nuovo socio paga sempre la quota dei nuovi', () => {
    expect(quotaPropostaPerAnni({ data_nascita: '1990-01-01' }, [], [2026], quote)).toBe(25)
  })

  it('senza anni scelti non propone niente', () => {
    expect(quotaPropostaPerAnni(socio, pagati, [], quote)).toBeNull()
  })
})
