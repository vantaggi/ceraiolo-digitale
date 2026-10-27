import { describe, it, expect } from 'vitest'
import { CAMPI_OBBLIGATORI, datiDaSalvare, trovaOmonimi, validaSocio } from '../socio'

const oggi = new Date('2026-10-27T12:00:00')
const completo = {
  cognome: 'Rossi',
  nome: 'Mario',
  data_nascita: '1980-05-15',
  luogo_nascita: 'Gubbio',
  gruppo_appartenenza: '',
  data_prima_iscrizione: '',
  note: '',
}

describe('modulo nuovo socio', () => {
  it('con i campi obbligatori pieni non ci sono errori, anche senza manicchia', () => {
    expect(validaSocio(completo, oggi)).toEqual({})
    expect(CAMPI_OBBLIGATORI).not.toContain('gruppo_appartenenza')
  })

  it('segnala ogni campo obbligatorio vuoto o fatto solo di spazi', () => {
    const errori = validaSocio(
      { ...completo, cognome: '  ', nome: '', data_nascita: '', luogo_nascita: '' },
      oggi,
    )
    expect(Object.keys(errori).sort()).toEqual(['cognome', 'data_nascita', 'luogo_nascita', 'nome'])
  })

  it('data di nascita nel futuro, prima del 1900 o scritta male', () => {
    expect(validaSocio({ ...completo, data_nascita: '2026-12-01' }, oggi).data_nascita).toMatch(
      /futuro/,
    )
    expect(validaSocio({ ...completo, data_nascita: '1890-01-01' }, oggi).data_nascita).toMatch(
      /1900/,
    )
    expect(validaSocio({ ...completo, data_nascita: '15/05/1980' }, oggi).data_nascita).toBe(
      'Data non valida',
    )
    expect(validaSocio({ ...completo, data_nascita: '2026-10-27' }, oggi)).toEqual({})
  })

  it('anno di prima iscrizione: facoltativo, non nel futuro e non prima della nascita', () => {
    expect(validaSocio({ ...completo, data_prima_iscrizione: 2027 }, oggi)).toEqual({})
    expect(
      validaSocio({ ...completo, data_prima_iscrizione: 2028 }, oggi).data_prima_iscrizione,
    ).toMatch(/futuro/)
    expect(
      validaSocio({ ...completo, data_prima_iscrizione: 1975 }, oggi).data_prima_iscrizione,
    ).toMatch(/nascita/)
    expect(
      validaSocio({ ...completo, data_prima_iscrizione: '20x0' }, oggi).data_prima_iscrizione,
    ).toMatch(/anno/)
  })

  it('salva testi puliti e la manicchia vuota se non scelta', () => {
    expect(
      datiDaSalvare({
        ...completo,
        cognome: ' Rossi ',
        note: ' x ',
        data_prima_iscrizione: '2020',
      }),
    ).toEqual({
      cognome: 'Rossi',
      nome: 'Mario',
      data_nascita: '1980-05-15',
      luogo_nascita: 'Gubbio',
      gruppo_appartenenza: '',
      note: 'x',
      data_prima_iscrizione: 2020,
    })
    expect(datiDaSalvare(completo)).not.toHaveProperty('data_prima_iscrizione')
  })

  it('trova gli omonimi ignorando maiuscole, accenti e spazi; prima quelli con la stessa data', () => {
    const soci = [
      { id: 1, cognome: 'ROSSI', nome: 'Mario', data_nascita: '1950-01-01' },
      { id: 2, cognome: 'Rossi ', nome: 'mario', data_nascita: '1980-05-15' },
      { id: 3, cognome: 'Rossi', nome: 'Maria', data_nascita: '1980-05-15' },
      { id: 4, cognome: 'Nicolò', nome: 'Luca', data_nascita: '1990-01-01' },
    ]
    expect(trovaOmonimi(completo, soci).map((o) => [o.socio.id, o.stessaData])).toEqual([
      [2, true],
      [1, false],
    ])
    expect(trovaOmonimi({ cognome: 'nicolo', nome: 'LUCA' }, soci).map((o) => o.socio.id)).toEqual([
      4,
    ])
    expect(trovaOmonimi({ cognome: '', nome: 'Mario' }, soci)).toEqual([])
  })
})
