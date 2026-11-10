import { describe, it, expect } from 'vitest'
import {
  annoCoperto,
  calculateAgeInYear,
  isExemptFromPayment,
  calculatePaymentStatus,
  descriviArretrati,
  statoAnno,
  isMinorenne,
  MAGGIORE_ETA,
  tipoQuota,
  quotaPropostaPerAnni,
  quotaPerAnno,
  quotePredefinite,
  periodoPerAnno,
  erroreTabellaQuote,
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

describe('quote fino al 2026 (importi delle impostazioni)', () => {
  const quote = { quotaOrdinaria: 10, quotaNuovi: 25 }
  it('nuovi e rientri pagano la quota dei nuovi, gli altri la ordinaria', () => {
    const adulto = { data_nascita: '1980-01-01' }
    expect(quotaPerAnno(adulto, [], 2026, quote)).toBe(25)
    expect(quotaPerAnno(adulto, [2023, 2024], 2026, quote)).toBe(25)
    expect(quotaPerAnno(adulto, [2024, 2025], 2026, quote)).toBe(10)
    expect(quotaPerAnno({ data_nascita: '2012-01-01' }, [], 2026, quote)).toBe(10)
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

describe('quotaPerAnno: quote dal 2027 (Cioti, 9 novembre 2026)', () => {
  const quote = { quotaOrdinaria: 10, quotaNuovi: 25 }
  // Inventati: eta' nel 2027 dal solo anno di nascita
  const minorenne = { data_nascita: '2012-12-31' } // 15
  const giovane = { data_nascita: '2004-12-31' } // 23
  const adulto = { data_nascita: '2003-01-01' } // 24

  it('fino al 2026 restano gli importi delle impostazioni', () => {
    expect(quotaPerAnno(adulto, [], 2026, quote)).toBe(25)
    expect(quotaPerAnno(adulto, [2025], 2026, quote)).toBe(10)
    expect(quotaPerAnno({ data_nascita: '2012-01-01' }, [], 2026, quote)).toBe(10)
  })

  it('minorenne: offerta, nessun importo proposto', () => {
    expect(quotaPerAnno(minorenne, [], 2027, quote)).toBeNull()
    expect(quotaPerAnno(minorenne, [2026], 2027, quote)).toBeNull()
  })

  it('dai 18 ai 23 anni: 15, anche al primo anno (iscrizione gratis)', () => {
    expect(quotaPerAnno(giovane, [], 2027, quote)).toBe(15)
    expect(quotaPerAnno(giovane, [2026], 2027, quote)).toBe(15)
    expect(quotaPerAnno({ data_nascita: '2009-06-01' }, [], 2027, quote)).toBe(15) // 18
  })

  it('dai 24 anni: 15 di rinnovo, 30 al primo anno (quota e iscrizione)', () => {
    expect(quotaPerAnno(adulto, [2026], 2027, quote)).toBe(15)
    expect(quotaPerAnno(adulto, [], 2027, quote)).toBe(30)
  })

  it("dai 24 anni l'iscrizione torna solo per chi e' da reiscrivere", () => {
    // ultimo pagamento 2024: 2025 e 2026 scoperti, torna senza reiscriversi
    expect(quotaPerAnno(adulto, [2020, 2024], 2027, quote)).toBe(15)
    // ultimo pagamento 2023: 2024, 2025, 2026 e 2027 scoperti, da reiscrivere
    expect(quotaPerAnno(adulto, [2020, 2023], 2027, quote)).toBe(30)
  })

  it('confini: 17 anni offerta, rientro giovane da reiscrivere 15, senza data come adulto', () => {
    expect(quotaPerAnno({ data_nascita: '2010-12-31' }, [], 2027, quote)).toBeNull()
    expect(quotaPerAnno({ data_nascita: '2005-01-01' }, [2022], 2027, quote)).toBe(15)
    expect(quotaPerAnno({}, [], 2027, quote)).toBe(30)
  })

  it('piu anni insieme: vale la regola dell ultimo anno scelto', () => {
    expect(quotaPropostaPerAnni(adulto, [2023], [2026, 2027], quote)).toBe(15)
    expect(quotaPropostaPerAnni(minorenne, [], [2027], quote)).toBeNull()
  })
})

describe('tabella delle quote per anno (Cioti, 10 novembre 2026)', () => {
  const base = quotePredefinite({ quotaOrdinaria: 10, quotaNuovi: 25 })
  const adulto = { data_nascita: '1980-01-01' }
  const dal2030 = [
    ...base,
    {
      daAnno: 2030,
      iscrizioneChiSaltaUnAnno: false,
      fasce: [
        { daEta: 0, quota: 5, iscrizione: 0 },
        { daEta: 18, quota: 20, iscrizione: 10 },
      ],
    },
  ]

  it('la tabella di partenza ha il periodo di prima e il 2027', () => {
    expect(base.map((p) => p.daAnno)).toEqual([null, 2027])
    expect(base[0].fasce[1]).toEqual({ daEta: 18, quota: 10, iscrizione: 15 })
  })

  it("ogni anno usa il periodo con la partenza piu' vicina prima di lui", () => {
    expect(periodoPerAnno(dal2030, 2026).daAnno).toBeNull()
    expect(periodoPerAnno(dal2030, 2029).daAnno).toBe(2027)
    expect(periodoPerAnno(dal2030, 2031).daAnno).toBe(2030)
  })

  it('un periodo aggiunto cambia solo i suoi anni', () => {
    expect(quotaPerAnno(adulto, [2029], 2030, dal2030)).toBe(20)
    expect(quotaPerAnno(adulto, [], 2030, dal2030)).toBe(30)
    expect(quotaPerAnno({ data_nascita: '2020-01-01' }, [], 2030, dal2030)).toBe(5)
    expect(quotaPerAnno(adulto, [2028], 2029, dal2030)).toBe(15)
  })

  it("iscrizione a chi salta un anno: si' fino al 2026, no dal 2027 (scelta 2A)", () => {
    expect(quotaPerAnno(adulto, [2020, 2024], 2026, base)).toBe(25)
    expect(quotaPerAnno(adulto, [2020, 2025], 2027, base)).toBe(15)
  })

  it('la tabella salvata vale al posto degli importi di prima', () => {
    const tabella = structuredClone(base)
    tabella[0].fasce[1].quota = 12
    expect(quotaPerAnno(adulto, [2025], 2026, tabella)).toBe(12)
    expect(quotaPerAnno(adulto, [], 2026, tabella)).toBe(27)
  })

  it('controlla la tabella prima di salvarla', () => {
    expect(erroreTabellaQuote(base)).toBe('')
    expect(erroreTabellaQuote([])).toBe('Serve almeno un periodo.')
    expect(erroreTabellaQuote([base[1]])).toContain('senza anno di partenza')
    expect(erroreTabellaQuote([...base, { ...base[1] }])).toBe(
      'Due periodi partono dallo stesso anno.',
    )
    const senzaZero = structuredClone(base)
    senzaZero[1].fasce = senzaZero[1].fasce.filter((f) => f.daEta !== 0)
    expect(erroreTabellaQuote(senzaZero)).toBe(
      'Il periodo dal 2027 deve avere una fascia che parte da 0 anni.',
    )
    const negativo = structuredClone(base)
    negativo[1].fasce[1].quota = -1
    expect(erroreTabellaQuote(negativo)).toBe('Il periodo dal 2027: gli importi vanno da 0 in su.')
  })

  it('una tabella rovinata da un vecchio salvataggio da un errore, non un crash', () => {
    expect(erroreTabellaQuote([null])).toBe('Un periodo non è leggibile.')
    const fasciaNulla = structuredClone(base)
    fasciaNulla[1].fasce.push(null)
    expect(erroreTabellaQuote(fasciaNulla)).toBe(
      "Il periodo dal 2027: le fasce d'età non sono leggibili.",
    )
  })

  it("non accetta una fascia tra 1 e 17 anni: l'esenzione dei minorenni e' fissa a 18", () => {
    const fascia10 = structuredClone(base)
    fascia10[1].fasce.push({ daEta: 10, quota: 5, iscrizione: 0 })
    expect(erroreTabellaQuote(fascia10)).toContain('partono da 0')
  })
})

describe('annoCoperto: gli anni da minorenne contano come pagati (Cioti, 10 novembre 2026)', () => {
  // Solo dati inventati
  const ragazzo = { data_nascita: '2010-05-01', data_prima_iscrizione: 2020 }
  it("pagato, o minorenne dopo l'iscrizione", () => {
    expect(annoCoperto(ragazzo, [], 2027)).toBe(true) // 17 anni
    expect(annoCoperto(ragazzo, [], 2028)).toBe(false) // 18 anni, non pagato
    expect(annoCoperto(ragazzo, [2028], 2028)).toBe(true)
    expect(annoCoperto(ragazzo, [], 2019)).toBe(false) // prima dell'iscrizione
    expect(annoCoperto({ data_nascita: '2010-05-01' }, [], 2015)).toBe(true) // iscrizione ignota
  })
})
