import { describe, it, expect } from 'vitest'
import { annoDaPagare, riepilogoSocio, cronologiaSocio } from '../schedaSocio'

// Soci e pagamenti inventati
const tess = (...anni) => anni.map((anno, i) => ({ id_tesseramento: i + 1, anno, quota_pagata: 10 }))
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

  it('senza pagamenti ne\' iscrizione: solo l\'anno in corso', () => {
    expect(cronologiaSocio({ id: 3, data_nascita: '1990-01-01' }, [], 2026)).toEqual([
      { chiave: '2026', anno: 2026, stato: '-', pagamento: null },
    ])
  })
})
