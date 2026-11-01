import { describe, it, expect } from 'vitest'
import {
  annoDaPagare,
  riepilogoSocio,
  cronologiaSocio,
  dividiCronologia,
  testoAnniPrecedenti,
} from '../schedaSocio'

// Soci e pagamenti inventati
const tess = (...anni) =>
  anni.map((anno, i) => ({ id_tesseramento: i + 1, anno, quota_pagata: 10 }))
const adulto = { id: 1, data_nascita: '1980-05-01', data_prima_iscrizione: 2019 }

describe('annoDaPagare', () => {
  it("propone l'anno in corso, poi il prossimo, poi niente", () => {
    expect(annoDaPagare(tess(2025), 2026)).toBe(2026)
    expect(annoDaPagare(tess(2026), 2026)).toBe(2027)
    expect(annoDaPagare(tess(2026, 2027), 2026)).toBeNull()
  })
})

describe('riepilogoSocio', () => {
  it('in regola: quota pagata, niente arretrati, vota', () => {
    const r = riepilogoSocio(adulto, tess(2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026), 2026)
    expect(r.quota).toBe('V')
    expect(r.pagamento.arretrati).toEqual([])
    expect(r.voto.stato).toBe('si')
  })

  it('con due anni scoperti: arretrati e voto da regolarizzare', () => {
    const r = riepilogoSocio(adulto, tess(2019, 2020, 2021, 2022, 2023, 2024), 2026)
    expect(r.quota).toBe('X')
    expect(r.pagamento.arretrati).toEqual([2025, 2026])
    expect(r.voto.stato).toBe('regolarizza')
  })

  it('minorenne esente', () => {
    const ragazzo = { id: 2, data_nascita: '2012-01-01', data_prima_iscrizione: 2024 }
    const r = riepilogoSocio(ragazzo, [], 2026)
    expect(r.quota).toBe('O')
    expect(r.pagamento.inRegola).toBe(true)
    expect(r.voto.stato).toBe('no')
  })
})

describe('cronologiaSocio', () => {
  it("dal piu' recente all'iscrizione, con lo stato di ogni anno", () => {
    const righe = cronologiaSocio(adulto, tess(2019, 2021), 2022)
    expect(righe.map((r) => [r.anno, r.stato])).toEqual([
      [2022, 'X'],
      [2021, 'V'],
      [2020, 'X'],
      [2019, 'V'],
    ])
  })

  it("parte dal primo pagamento anche se l'iscrizione dichiarata e' dopo", () => {
    const tardi = { ...adulto, data_prima_iscrizione: 2021 }
    expect(cronologiaSocio(tardi, tess(2019), 2021).map((r) => r.anno)).toEqual([2021, 2020, 2019])
  })

  it("arriva all'ultimo anno pagato, anche nel futuro, e ripete l'anno pagato due volte", () => {
    const righe = cronologiaSocio(adulto, tess(2019, 2027, 2027), 2026)
    expect(righe[0].anno).toBe(2027)
    expect(righe.filter((r) => r.anno === 2027)).toHaveLength(2)
    expect(new Set(righe.map((r) => r.chiave)).size).toBe(righe.length)
  })

  it("senza pagamenti ne' iscrizione: solo l'anno in corso", () => {
    expect(cronologiaSocio({ id: 3, data_nascita: '1990-01-01' }, [], 2026)).toEqual([
      { chiave: '2026', anno: 2026, stato: '-', pagamento: null },
    ])
  })
})

describe('dividiCronologia: Anni precedenti', () => {
  it("raggruppa gli anni prima dell'ultimo pagamento, che non sono arretrati", () => {
    const socio = { id: 4, data_nascita: '1970-01-01', data_prima_iscrizione: 2010 }
    const t = tess(2015, 2024)
    const { recenti, precedenti, riassunto } = dividiCronologia(
      cronologiaSocio(socio, t, 2026),
      2026,
    )
    expect(recenti.map((r) => r.anno)).toEqual([2026, 2025, 2024])
    expect(precedenti.map((r) => r.anno)).toEqual([
      2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010,
    ])
    expect(riassunto).toEqual({ da: 2010, a: 2023, pagati: 1, esenti: 0, nonPagati: 13 })
    expect(testoAnniPrecedenti(riassunto)).toBe(
      '13 anni senza pagamento, 1 pagato: non sono arretrati',
    )
    // Gli anni rossi rimasti visibili sono proprio gli arretrati del riepilogo
    const arretrati = riepilogoSocio(socio, t, 2026).pagamento.arretrati
    expect(
      recenti
        .filter((r) => r.stato === 'X')
        .map((r) => r.anno)
        .sort(),
    ).toEqual(arretrati)
  })

  it("un pagamento nel futuro non sposta il confine: conta l'ultimo fino all'anno in corso", () => {
    const { recenti, riassunto } = dividiCronologia(
      cronologiaSocio(adulto, tess(2019, 2022, 2027), 2026),
      2026,
    )
    expect(recenti.map((r) => r.anno)).toEqual([2027, 2026, 2025, 2024, 2023, 2022])
    expect(riassunto).toEqual({ da: 2019, a: 2021, pagati: 1, esenti: 0, nonPagati: 2 })
  })

  it("se prima dell ultimo pagamento e' tutto pagato, o senza pagamenti, non raggruppa niente", () => {
    const tutti = cronologiaSocio(adulto, tess(2019, 2020, 2021), 2022)
    expect(dividiCronologia(tutti, 2022)).toEqual({
      recenti: tutti,
      precedenti: [],
      riassunto: null,
    })
    const nessuno = cronologiaSocio(adulto, [], 2022)
    expect(dividiCronologia(nessuno, 2022).riassunto).toBeNull()
  })

  it('scrive solo le voci che ci sono', () => {
    expect(testoAnniPrecedenti({ pagati: 3, esenti: 2, nonPagati: 0 })).toBe('3 pagati, 2 esenti')
    expect(testoAnniPrecedenti({ pagati: 0, esenti: 1, nonPagati: 1 })).toBe(
      '1 anno senza pagamento, 1 esente: non sono arretrati',
    )
  })
})
