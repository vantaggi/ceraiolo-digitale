import { describe, it, expect } from 'vitest'
import { controllaDati, dataNascitaValida } from '../controlliDati'

// Solo dati inventati
const socio = (id, extra = {}) => ({
  id,
  cognome: `Prova${id}`,
  nome: 'Mario',
  data_nascita: '1980-05-15',
  luogo_nascita: 'Gubbio',
  gruppo_appartenenza: 'BRANCA',
  data_prima_iscrizione: 2010,
  ...extra,
})
const pag = (id_socio, anno, quota_pagata = 10) => ({ id_socio, anno, quota_pagata })
const problemi = (soci, tess = [], anno = 2026) => {
  const { details } = controllaDati(soci, tess, anno)
  return Object.fromEntries(details.map((d) => [d.id, d.issues]))
}

describe('controlli dati (Cioti, 10 novembre 2026)', () => {
  it('un socio completo non ha anomalie', () => {
    const r = controllaDati([socio(1)], [pag(1, 2025)], 2026)
    expect(r.details).toEqual([])
    expect(r.summary.total_issues).toBe(0)
  })

  it('data di nascita scritta male, diversa da quella mancante', () => {
    expect(dataNascitaValida('1980-05-15')).toBe(true)
    for (const d of ['15/03/1990', '1990-00-00', '1990-02-30', '1990', '0000-00-00']) {
      expect(dataNascitaValida(d)).toBe(false)
    }
    const r = controllaDati(
      [socio(1, { data_nascita: '15/03/1990' }), socio(2, { data_nascita: '' })],
      [],
      2026,
    )
    expect(r.summary.invalid_dob).toBe(1)
    expect(r.summary.missing_dob).toBe(1)
    expect(problemi([socio(1, { data_nascita: '15/03/1990' })])[1]).toContain(
      'Data di nascita scritta male (15/03/1990)',
    )
    expect(dataNascitaValida('1990-03-15 00:00:00')).toBe(true)
    expect(dataNascitaValida('1990-03-15T00:00:00')).toBe(true)
    expect(dataNascitaValida('1990-3-5')).toBe(false)
  })

  it('possibili doppioni: stessi cognome, nome e data, anche con maiuscole e spazi diversi', () => {
    const a = socio(1, { cognome: 'Rossi', nome: 'Mario' })
    const b = socio(2, { cognome: 'ROSSI ', nome: 'mario' })
    const c = socio(3, { cognome: 'Rossi', nome: 'Mario', data_nascita: '1981-01-01' })
    const p = problemi([a, b, c])
    expect(p[1]).toContain(
      "Possibile doppione: un'altra scheda ha stessi cognome, nome e data di nascita (BRANCA, iscritto dal 2010)",
    )
    expect(p[2]).toContain(
      "Possibile doppione: un'altra scheda ha stessi cognome, nome e data di nascita (BRANCA, iscritto dal 2010)",
    )
    expect(p[3]).toBeUndefined()
  })

  it('due pagamenti nello stesso anno, anche con un anno scritto come testo', () => {
    const p = problemi([socio(1)], [pag(1, 2024), pag(1, '2024'), pag(1, 2025)])
    expect(p[1]).toEqual(['Due pagamenti nello stesso anno (2024)'])
  })

  it('pagamento prima della nascita', () => {
    const p = problemi(
      [socio(1, { data_nascita: '2000-03-01', data_prima_iscrizione: 1995 })],
      [pag(1, 1995)],
    )
    expect(p[1]).toEqual(['Pagamento prima della nascita (1995, nato nel 2000)'])
  })

  it('pagamento da 0 euro o senza importo da maggiorenne; da minorenne va bene', () => {
    const giovane = socio(2, { data_nascita: '2012-01-01', data_prima_iscrizione: 2020 })
    const p = problemi([socio(1), giovane], [pag(1, 2024, 0), pag(1, 2025, null), pag(2, 2027, 0)])
    expect(p[1]).toEqual(['Pagamento da 0 € o senza importo da maggiorenne (2024, 2025)'])
    expect(p[2]).toBeUndefined()
  })

  it('manicchia scritta in modi diversi: si segnala chi non usa la scrittura piu usata', () => {
    const soci = [
      socio(1),
      socio(2),
      socio(3, { gruppo_appartenenza: 'Branca ' }),
      socio(4, { gruppo_appartenenza: 'INTERNA' }),
    ]
    const r = controllaDati(soci, [], 2026)
    expect(r.summary.group_spelling).toBe(1)
    expect(problemi(soci)[3]).toEqual(['Manicchia "Branca " scritta anche come "BRANCA"'])
  })

  it('manicchia a pari numero di scritture: si segnalano tutti', () => {
    const soci = [
      socio(1, { gruppo_appartenenza: 'INTERNA' }),
      socio(2, { gruppo_appartenenza: 'Interna' }),
    ]
    const p = problemi(soci)
    expect(p[1]).toEqual(['Manicchia "INTERNA" scritta anche come "Interna"'])
    expect(p[2]).toEqual(['Manicchia "Interna" scritta anche come "INTERNA"'])
  })

  it('i controlli di prima restano', () => {
    const p = problemi(
      [
        socio(1, { luogo_nascita: '', gruppo_appartenenza: '' }),
        socio(2, { data_prima_iscrizione: 2030 }),
        socio(3, { data_prima_iscrizione: 2024 }),
        socio(4, { data_prima_iscrizione: null }),
      ],
      [pag(3, 2020)],
    )
    expect(p[1]).toEqual(['Senza luogo di nascita', 'Senza manicchia'])
    expect(p[2]).toEqual(['Iscrizione nel futuro (2030)'])
    expect(p[3]).toEqual(['Iscritto dal 2024, ma ha pagato nel 2020'])
    expect(p[4]).toEqual(['Senza anno di iscrizione e senza pagamenti'])
  })

  it('solo i dati mancanti o incoerenti contano per la conferma del backup', () => {
    const r = controllaDati(
      [socio(1, { luogo_nascita: '' }), socio(2, { data_nascita: '15/03/1990' }), socio(3)],
      [pag(3, 2024, 0)],
      2026,
    )
    expect(r.summary.total_issues).toBe(3)
    expect(r.summary.incompleti).toBe(1)
    expect(r.details.every((d) => !('incompleto' in d))).toBe(true)
  })

  it('cognome, nome o manicchia mancanti non bloccano il controllo', () => {
    const r = controllaDati(
      [
        socio(1, { cognome: null, nome: null }),
        socio(2, { cognome: null, nome: null, gruppo_appartenenza: null }),
      ],
      [],
      2026,
    )
    expect(r.summary.duplicate).toBe(0)
    expect(r.summary.missing_group).toBe(1)
  })

  it('doppione su tre schede', () => {
    const stessi = [1, 2, 3].map((id) =>
      socio(id, { cognome: 'Rossi', data_prima_iscrizione: 2000 + id }),
    )
    expect(problemi(stessi)[1]).toEqual([
      'Possibile doppione: altre 2 schede hanno stessi cognome, nome e data di nascita (BRANCA, iscritto dal 2002; BRANCA, iscritto dal 2003)',
    ])
  })

  it('iscritto da maggiorenne e nessun pagamento: si segnala; il minorenne esente no', () => {
    const p = problemi(
      [
        socio(1, { data_prima_iscrizione: 2026 }), // adulto creato senza ricevuta
        socio(2, { data_prima_iscrizione: 2026 }), // adulto che ha pagato
        socio(3, { data_nascita: '2010-04-02', data_prima_iscrizione: 2020 }), // iscritto da minorenne
        socio(4, { data_prima_iscrizione: 2027 }), // nel futuro: ha gia' il suo avviso
        socio(5, { data_prima_iscrizione: null }), // senza anno: ha gia' il suo avviso
        socio(6, { data_prima_iscrizione: 2023 }), // ultimo anno ancora recuperabile
        socio(7, { data_prima_iscrizione: 2022 }), // fermo da piu' anni: da reiscrivere
      ],
      [pag(2, 2026)],
      2026,
    )
    expect(p[1]).toEqual(['Iscritto dal 2026 da maggiorenne, nessun pagamento registrato'])
    expect(p[2]).toBeUndefined()
    expect(p[3]).toBeUndefined()
    expect(p[4]).toEqual(['Iscrizione nel futuro (2027)'])
    expect(p[5]).toEqual(['Senza anno di iscrizione e senza pagamenti'])
    expect(p[6]).toEqual(['Iscritto dal 2023 da maggiorenne, nessun pagamento registrato'])
    expect(p[7]).toBeUndefined()
  })
})
