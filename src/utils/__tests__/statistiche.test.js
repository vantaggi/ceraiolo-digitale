import { describe, it, expect } from 'vitest'
import { calcolaStatisticheAnnuali, andamentoTesseramento } from '../statistiche'

// Soci inventati. Un adulto e' nato nel 1980; i tesseramenti sono { id_socio, anno }.
const adulto = (id, extra = {}) => ({ id, data_nascita: '1980-01-01', ...extra })
const paga = (id, ...anni) => anni.map((anno) => ({ id_socio: id, anno }))
const anno = (stats, a) => stats.find((s) => s.year === a)

describe('calcolaStatisticheAnnuali', () => {
  it('conta iscritti, nuovi e non rinnovati anno per anno', () => {
    const soci = [adulto(1), adulto(2), adulto(3)]
    const t = [...paga(1, 2020, 2021, 2022), ...paga(2, 2021, 2022), ...paga(3, 2020, 2021)]
    const stats = calcolaStatisticheAnnuali(soci, t, 2020, 2022)
    expect(stats).toEqual([
      { year: 2020, total: 2, newMembers: 2, returningMembers: 0, lostMembers: 0 },
      { year: 2021, total: 3, newMembers: 1, returningMembers: 0, lostMembers: 0 },
      { year: 2022, total: 2, newMembers: 0, returningMembers: 0, lostMembers: 1 },
    ])
  })

  it('chi torna dopo uno o piu anni fuori e un rientro, non un nuovo', () => {
    const stats = calcolaStatisticheAnnuali([adulto(1)], paga(1, 2018, 2022), 2018, 2022)
    expect(anno(stats, 2019).lostMembers).toBe(1)
    expect(anno(stats, 2022)).toMatchObject({ total: 1, newMembers: 0, returningMembers: 1 })
  })

  it("con l'anno di prima iscrizione dopo il primo pagamento non perde gli anni pagati", () => {
    // Dato incoerente nel database: dichiarato 2021, ma ha pagato dal 2019.
    const soci = [adulto(1, { data_prima_iscrizione: 2021 })]
    const stats = calcolaStatisticheAnnuali(soci, paga(1, 2019, 2020, 2021), 2019, 2021)
    expect(stats.map((s) => s.total)).toEqual([1, 1, 1])
    expect(anno(stats, 2019).newMembers).toBe(1)
    expect(anno(stats, 2021).newMembers).toBe(0)
  })

  it("con l'anno di prima iscrizione prima del primo pagamento, e nuovo in quell'anno", () => {
    const soci = [adulto(1, { data_prima_iscrizione: 2018 })]
    const stats = calcolaStatisticheAnnuali(soci, paga(1, 2018, 2019), 2018, 2019)
    expect(anno(stats, 2018).newMembers).toBe(1)
  })

  it('un minorenne iscritto resta iscritto senza pagare fino ai 17 anni', () => {
    // Nato nel 2010, iscritto nel 2020 a 10 anni; compie 18 anni nel 2028.
    const soci = [{ id: 1, data_nascita: '2010-06-01', data_prima_iscrizione: 2020 }]
    const stats = calcolaStatisticheAnnuali(soci, [], 2019, 2028)
    expect(anno(stats, 2019).total).toBe(0)
    expect(anno(stats, 2020)).toMatchObject({ total: 1, newMembers: 1 })
    expect(anno(stats, 2027).total).toBe(1)
    expect(anno(stats, 2028)).toMatchObject({ total: 0, lostMembers: 1 })
  })

  it('chi non ha ne iscrizione ne pagamenti non viene contato', () => {
    const stats = calcolaStatisticheAnnuali([adulto(1)], [], 2020, 2021)
    expect(stats.every((s) => s.total === 0 && s.lostMembers === 0)).toBe(true)
  })

  it('conta i non rinnovati anche nel primo anno mostrato', () => {
    const stats = calcolaStatisticheAnnuali([adulto(1)], paga(1, 2019), 2020, 2020)
    expect(stats).toEqual([{ year: 2020, total: 0, newMembers: 0, returningMembers: 0, lostMembers: 1 }])
  })
})

describe('andamentoTesseramento', () => {
  const riga = (year, total, newMembers = 0, returningMembers = 0, lostMembers = 0) => ({
    year,
    total,
    newMembers,
    returningMembers,
    lostMembers,
  })

  it('toglie gli anni vuoti prima e dopo e confronta con l\'anno prima', () => {
    const stats = [riga(2018, 0), riga(2019, 10, 10), riga(2020, 12, 3, 0, 1), riga(2021, 9, 1, 1, 5), riga(2022, 0)]
    const { serie, ultimo, variazione } = andamentoTesseramento(stats)
    expect(serie.map((s) => s.year)).toEqual([2019, 2020, 2021])
    expect(ultimo.year).toBe(2021)
    expect(variazione).toBe(-3)
  })

  it('nel primo anno della storia i nuovi non hanno barra, negli altri si', () => {
    const stats = [riga(2019, 10, 10), riga(2020, 12, 3)]
    const { serie } = andamentoTesseramento(stats)
    expect(serie[0].newMembers).toBeNull()
    expect(serie[1].newMembers).toBe(3)
    expect(stats[0].newMembers).toBe(10)
  })

  it('mostra solo gli ultimi anni scelti, senza cambiare ultimo e variazione', () => {
    const stats = [2015, 2016, 2017, 2018, 2019, 2020, 2021].map((a, i) => riga(a, 10 + i, 1))
    const { serie, ultimo, variazione } = andamentoTesseramento(stats, 5)
    expect(serie.map((s) => s.year)).toEqual([2017, 2018, 2019, 2020, 2021])
    expect(serie[0].newMembers).toBe(1)
    expect(ultimo.total).toBe(16)
    expect(variazione).toBe(1)
  })

  it('senza iscritti non c\'e\' niente da mostrare', () => {
    expect(andamentoTesseramento([riga(2020, 0), riga(2021, 0)])).toEqual({
      serie: [],
      ultimo: null,
      variazione: null,
    })
  })

  it('con un anno solo non c\'e\' variazione', () => {
    expect(andamentoTesseramento([riga(2021, 4, 4)]).variazione).toBeNull()
  })
})
