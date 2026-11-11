import { describe, it, expect } from 'vitest'
import { euro, leggiImporto, propostaRegistrazione, quoteDopoArretrato } from '../registrazione'

const quote = { quotaOrdinaria: 10, quotaNuovi: 25 }
const socio = (extra = {}) => ({
  cognome: 'Rossi',
  nome: 'Mario',
  data_nascita: '1980-05-15',
  data_prima_iscrizione: 2022,
  ...extra,
})
const proposta = (s, anniPagati, extra = {}) =>
  propostaRegistrazione({ socio: s, anniPagati, anno: 2026, quote, ...extra })

describe('euro', () => {
  it("scrive gli importi all'italiana con due decimali", () => {
    expect(euro(10)).toBe('10,00')
    expect(euro(27.5)).toBe('27,50')
    expect(euro(12500)).toBe('12.500,00')
    expect(euro(undefined)).toBe('0,00')
  })
})

describe('propostaRegistrazione (Invio su un socio trovato)', () => {
  it("chi ha pagato l'anno prima: registra l'anno di riferimento con la quota ordinaria", () => {
    const p = proposta(socio(), [2022, 2023, 2024, 2025])
    expect(p).toMatchObject({
      registra: true,
      anno: 2026,
      quota: 10,
      testoQuota: '',
      arretrati: [],
      stato: { testo: 'Da pagare 2026', tono: 'neutro' },
    })
  })

  it('un nuovo socio paga la quota dei nuovi (Turbo Mode gli metteva la ordinaria)', () => {
    const p = proposta(socio({ data_prima_iscrizione: null }), [])
    expect(p.registra).toBe(true)
    expect(p.quota).toBe(25)
    expect(p.testoQuota).toBe('quota dei nuovi')
  })

  it('con arretrati: registra la quota, segnala gli anni prima e li offre sulla ricevuta', () => {
    const p = proposta(socio(), [2022, 2023])
    expect(p.registra).toBe(true)
    expect(p.arretrati).toEqual([2024, 2025])
    expect(p.stato).toEqual({ testo: 'Arretrati: 2024, 2025', tono: 'attenzione' })
    // non era iscritto nel 2025: e' un rientro, quota dei nuovi
    expect(p.quota).toBe(25)
  })

  it('fermo da piu di tre anni: da reiscrivere, senza arretrati da offrire', () => {
    const p = proposta(socio({ data_prima_iscrizione: 2018 }), [2018, 2019])
    expect(p.registra).toBe(true)
    expect(p.arretrati).toEqual([])
    expect(p.stato).toEqual({ testo: 'Da reiscrivere', tono: 'attenzione' })
  })

  it("gia' pagato l'anno: non registra e dice perche", () => {
    const p = proposta(socio(), [2025, 2026])
    expect(p.registra).toBe(false)
    expect(p.messaggio).toBe('Rossi Mario ha già pagato la quota 2026.')
    expect(p.stato.tono).toBe('ok')
  })

  it("gia' sulla ricevuta: non registra due volte", () => {
    const p = proposta(socio(), [2025], { sullaRicevuta: true })
    expect(p.registra).toBe(false)
    expect(p.messaggio).toBe('Rossi Mario è già su questa ricevuta.')
  })

  it('minorenne iscritto: esente, non registra e rimanda alla scheda', () => {
    const p = proposta(
      socio({
        nome: 'Paolo',
        cognome: 'Neri',
        data_nascita: '2012-07-30',
        data_prima_iscrizione: 2023,
      }),
      [2023],
    )
    expect(p.registra).toBe(false)
    expect(p.stato).toEqual({ testo: 'Esente nel 2026', tono: 'neutro' })
    expect(p.messaggio).toContain('dalla sua scheda')
  })

  it('minorenne mai iscritto: registra con la quota che propone anche la scheda', () => {
    const p = proposta(socio({ data_nascita: '2012-07-30', data_prima_iscrizione: null }), [])
    expect(p.registra).toBe(true)
    expect(p.quota).toBe(10)
  })
})

describe("quoteDopoArretrato (Aggiungi l'arretrato sulla ricevuta)", () => {
  // Inventato: pagato fino al 2023, arretrati 2024 e 2025; Invio ha registrato il 2026 a 25
  const s = socio({ data_prima_iscrizione: 2020 })
  const prima = [2020, 2021, 2022, 2023, 2026]

  it("saldato l'ultimo arretrato, la quota del rientro scende alla ordinaria", () => {
    const pagamenti = [
      { id_tesseramento: 7, anno: 2026, quota_pagata: 25 },
      { id_tesseramento: 8, anno: 2025, quota_pagata: 25 },
    ]
    expect(
      quoteDopoArretrato({
        socio: s,
        pagamenti,
        anniPrima: prima,
        anniDopo: [...prima, 2025],
        quote,
      }),
    ).toEqual([{ id_tesseramento: 7, anno: 2026, da: 25, a: 10 }])
  })

  it('saldati tutti gli arretrati, anche il primo arretrato aggiunto scende', () => {
    const pagamenti = [
      { id_tesseramento: 7, anno: 2026, quota_pagata: 10 },
      { id_tesseramento: 8, anno: 2025, quota_pagata: 25 },
      { id_tesseramento: 9, anno: 2024, quota_pagata: 10 },
    ]
    const anniPrima = [...prima, 2025]
    expect(
      quoteDopoArretrato({ socio: s, pagamenti, anniPrima, anniDopo: [...anniPrima, 2024], quote }),
    ).toEqual([{ id_tesseramento: 8, anno: 2025, da: 25, a: 10 }])
  })

  it("un importo scritto a mano resta com'e'", () => {
    const pagamenti = [{ id_tesseramento: 7, anno: 2026, quota_pagata: 50 }]
    expect(
      quoteDopoArretrato({
        socio: s,
        pagamenti,
        anniPrima: prima,
        anniDopo: [...prima, 2025],
        quote,
      }),
    ).toEqual([])
  })
})

describe('Registra ricevute dal 2027', () => {
  const nel2027 = (s, anniPagati) =>
    propostaRegistrazione({ socio: s, anniPagati, anno: 2027, quote })

  it("minorenne mai iscritto: Invio non registra da solo, chiede l'importo dell'offerta", () => {
    const p = nel2027(socio({ data_nascita: '2012-04-01', data_prima_iscrizione: null }), [])
    expect(p.registra).toBe(false)
    expect(p.chiedeOfferta).toBe(true)
    expect(p.quota).toBeNull()
    expect(p.stato.testo).toBe('Offerta 2027')
    expect(p.messaggio).not.toContain('scheda')
  })

  it("chi ha gia' pagato l'offerta 2027 non la riapre", () => {
    const p = nel2027(socio({ data_nascita: '2012-04-01' }), [2027])
    expect(p.chiedeOfferta).toBeUndefined()
    expect(p.stato.testo).toBe('Quota 2027 pagata')
  })

  it('un maggiorenne non chiede offerte', () => {
    expect(nel2027(socio(), [2026]).chiedeOfferta).toBeUndefined()
  })

  it('maggiorenne: Invio registra 15 a chi rinnova, 30 al nuovo dai 24 anni', () => {
    expect(nel2027(socio(), [2026]).quota).toBe(15)
    expect(nel2027(socio({ data_prima_iscrizione: null }), []).quota).toBe(30)
  })

  it("dopo l'arretrato 2026 la quota 2027 resta 15 (rientro dopo 2 anni)", () => {
    const s = socio({ data_prima_iscrizione: 2020 })
    expect(
      quoteDopoArretrato({
        socio: s,
        pagamenti: [{ id_tesseramento: 1, anno: 2027, quota_pagata: 15 }],
        anniPrima: [2024],
        anniDopo: [2024, 2026],
        quote,
      }),
    ).toEqual([])
  })
})

describe("leggiImporto: l'offerta scritta a mano", () => {
  it('accetta la virgola, il punto, il simbolo e le migliaia', () => {
    expect(leggiImporto('5')).toBe(5)
    expect(leggiImporto('5,50')).toBe(5.5)
    expect(leggiImporto('5.50')).toBe(5.5)
    expect(leggiImporto(' € 7 ')).toBe(7)
    expect(leggiImporto('1.000,00')).toBe(1000)
  })

  it('vuoto, zero o testo non sono un importo', () => {
    const sbagliati = ['', '   ', '0', '0,00', 'cinque', '5,555', '-5', '5,', '12.34,5', '5,5.0']
    for (const t of [...sbagliati, null, undefined]) {
      expect(leggiImporto(t)).toBeNull()
    }
  })
})
