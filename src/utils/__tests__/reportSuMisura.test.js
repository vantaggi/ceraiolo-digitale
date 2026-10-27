import { describe, it, expect } from 'vitest'
import {
  statoIniziale,
  normalizzaStato,
  filtraSoci,
  colonneReport,
  valoreCella,
  filtriAttivi,
  togliFiltro,
  riassunto,
  titoloReport,
  manicchieDisponibili,
  SENZA_MANICCHIA,
} from '../reportSuMisura'

// Soci inventati: tesseramenti come in getAllSociWithTesseramenti
const socio = (id, cognome, extra = {}, anni = []) => ({
  id,
  cognome,
  nome: 'Prova',
  data_nascita: '1980-03-01',
  gruppo_appartenenza: 'INTERNA',
  tesseramenti: anni.map((anno) => ({ anno })),
  ...extra,
})

const conFiltri = (anno, filters = {}, altro = {}) => {
  const s = statoIniziale(anno)
  return { ...s, ...altro, filters: { ...s.filters, ...filters } }
}
const cognomi = (righe) => righe.map((r) => r.socio.cognome)

describe('filtraSoci', () => {
  const soci = [
    socio(1, 'Bianchi', {}, [2024, 2025, 2026]),
    socio(2, 'Azzurri', { gruppo_appartenenza: 'BRANCA' }, [2020]),
    // Compie 18 anni nel 2026: maggiorenne per tutto il 2026, minorenne nel 2025
    socio(3, 'Celesti', { data_nascita: '2008-12-31', data_prima_iscrizione: 2020 }, []),
    socio(4, 'Dorati', { gruppo_appartenenza: '' }, [2025]),
  ]

  it('senza filtri ci sono tutti, in ordine di cognome', () => {
    expect(cognomi(filtraSoci(soci, statoIniziale(2026)))).toEqual([
      'Azzurri',
      'Bianchi',
      'Celesti',
      'Dorati',
    ])
  })

  it("l'eta' conta dall'anno di nascita nell'anno di riferimento", () => {
    const minori = (anno) => cognomi(filtraSoci(soci, conFiltri(anno, { ageGroup: 'minorenni' })))
    expect(minori(2025)).toEqual(['Celesti'])
    expect(minori(2026)).toEqual([])
  })

  it("pagato e non pagato guardano l'anno di riferimento, non il calendario", () => {
    expect(cognomi(filtraSoci(soci, conFiltri(2025, { paymentStatus: 'in_regola' })))).toEqual([
      'Bianchi',
      'Dorati',
    ])
    expect(cognomi(filtraSoci(soci, conFiltri(2026, { paymentStatus: 'morosi' })))).toEqual([
      'Azzurri',
      'Celesti',
      'Dorati',
    ])
  })

  it('attivi: almeno un pagamento negli ultimi 5 anni compreso il riferimento', () => {
    const attivi = (anno) => cognomi(filtraSoci(soci, conFiltri(anno, { onlyActiveMembers: true })))
    expect(attivi(2024)).toEqual(['Azzurri', 'Bianchi'])
    expect(attivi(2025)).not.toContain('Azzurri')
    // un pagamento dopo il riferimento non conta
    expect(attivi(2023)).toEqual(['Azzurri'])
  })

  it('le manicchie scelte, compreso chi non ne ha', () => {
    const stato = conFiltri(2026, { groups: ['BRANCA', SENZA_MANICCHIA] })
    expect(cognomi(filtraSoci(soci, stato))).toEqual(['Azzurri', 'Dorati'])
  })

  it('anni pagati: tutti o almeno uno', () => {
    const tutti = conFiltri(2026, { paymentYears: { list: [2024, 2025], logic: 'AND' } })
    const almenoUno = conFiltri(2026, { paymentYears: { list: [2020, 2025], logic: 'OR' } })
    expect(cognomi(filtraSoci(soci, tutti))).toEqual(['Bianchi'])
    expect(cognomi(filtraSoci(soci, almenoUno))).toEqual(['Azzurri', 'Bianchi', 'Dorati'])
  })

  it('diritto di voto per l anno di riferimento (regola di voto.js)', () => {
    const si = cognomi(filtraSoci(soci, conFiltri(2026, { electionEligibility: 'solo_si' })))
    const no = cognomi(filtraSoci(soci, conFiltri(2026, { electionEligibility: 'esclusi' })))
    expect(si).toEqual(['Bianchi'])
    expect(no).toContain('Azzurri')
  })

  it('ordina per manicchia e poi per cognome, anche al contrario', () => {
    const stato = conFiltri(2026, {}, { sort: { by: 'gruppo', descending: false } })
    expect(cognomi(filtraSoci(soci, stato))).toEqual(['Azzurri', 'Bianchi', 'Celesti', 'Dorati'])
    const giu = conFiltri(2026, {}, { sort: { by: 'anno_nascita', descending: true } })
    expect(cognomi(filtraSoci(soci, giu))[0]).toBe('Celesti')
  })
})

describe('colonneReport e valoreCella', () => {
  it("le colonne seguono l'ordine scelto, poi gli anni, e la firma resta in fondo", () => {
    const stato = statoIniziale(2026)
    stato.display.baseColumns = ['firma', 'dirittoVoto', 'cognomeNome']
    stato.display.yearColumns = [2026, 2024]
    expect(colonneReport(stato).map((c) => c.label)).toEqual([
      'Diritto di voto',
      'Socio',
      '2024',
      '2026',
      'Firma',
    ])
  })

  it('le celle di un socio da regolarizzare', () => {
    const s = socio(1, 'Rossi', { data_prima_iscrizione: 2020 }, [2020, 2021, 2022, 2023])
    const [riga] = filtraSoci([s], statoIniziale(2026))
    const stato = statoIniziale(2026)
    stato.display.baseColumns = ['cognomeNome', 'dataNascita', 'eta', 'dirittoVoto', 'arretrati']
    stato.display.yearColumns = [2023, 2024]
    const celle = colonneReport(stato).map((c) => valoreCella(riga, c))
    expect(celle).toEqual([
      { testo: 'Rossi Prova' },
      { testo: '01-03-1980' },
      { testo: 'Maggiorenne' },
      { testo: 'Regolarizza', stato: 'regolarizza' },
      { testo: '2024, 2025, 2026' },
      { testo: 'V', stato: 'V' },
      { testo: 'X', stato: 'X' },
    ])
  })
})

describe('filtri attivi, riassunto e titolo', () => {
  const stato = conFiltri(2026, {
    groups: ['INTERNA'],
    ageGroup: 'maggiorenni',
    electionEligibility: 'aventi_diritto',
  })

  it('ogni filtro attivo ha la sua etichetta e si toglie da solo', () => {
    expect(filtriAttivi(statoIniziale(2026))).toEqual([])
    const etichette = filtriAttivi(stato)
    expect(etichette.map((e) => e.id)).toEqual(['groups', 'ageGroup', 'electionEligibility'])
    const senzaEta = togliFiltro(stato, 'ageGroup')
    expect(senzaEta.filters.ageGroup).toBe('all')
    expect(senzaEta.filters.groups).toEqual(['INTERNA'])
    expect(stato.filters.ageGroup).toBe('maggiorenni')
  })

  it('il riassunto dice anno, filtri e ordine', () => {
    expect(riassunto(statoIniziale(2026))).toBe(
      'Riferimento 2026 · Tutti i soci · ordinati per cognome',
    )
    expect(riassunto(stato)).toContain('Manicchia: INTERNA · Maggiorenni')
  })

  it('il titolo scritto vince su quello ricavato', () => {
    expect(titoloReport(stato)).toBe('Soci della manicchia INTERNA - 2026')
    expect(titoloReport({ ...stato, titolo: '  Votazioni Interna ' })).toBe('Votazioni Interna')
    expect(titoloReport(statoIniziale(2025))).toBe('Elenco soci - 2025')
  })

  it('propone "Senza manicchia" solo se qualcuno non ce l\'ha', () => {
    expect(manicchieDisponibili(['A'], [{ gruppo_appartenenza: 'A' }])).toEqual(['A'])
    expect(manicchieDisponibili(['A'], [{ gruppo_appartenenza: null }])).toEqual([
      'A',
      SENZA_MANICCHIA,
    ])
  })
})

describe('normalizzaStato', () => {
  it('converte un preset della prima versione (data delle elezioni, nomi vecchi)', () => {
    const vecchio = {
      filters: {
        onlyActiveMembers: true,
        groups: ['Nessuna Manicchia', 'INTERNA'],
        ageGroup: 'maggiorenni',
        paymentStatus: 'all',
        electionDate: '2024-05-01',
        electionEligibility: 'aventi_diritto',
        paymentYears: { list: [2023], logic: 'OR' },
      },
      display: {
        baseColumns: ['cognomeNome', 'colonnaSparita', 'firma'],
        yearColumns: [2023, 2024],
      },
      sort: { by: 'gruppo', descending: true },
    }
    const nuovo = normalizzaStato(vecchio, 2026)
    expect(nuovo.anno).toBe(2024)
    expect(nuovo.filters.groups).toEqual([SENZA_MANICCHIA, 'INTERNA'])
    expect(nuovo.filters.paymentYears).toEqual({ list: [2023], logic: 'OR' })
    expect(nuovo.display.baseColumns).toEqual(['cognomeNome', 'firma'])
    expect(nuovo.sort).toEqual({ by: 'gruppo', descending: true })
    expect(nuovo.filters).not.toHaveProperty('electionDate')
  })

  it('valori sconosciuti o mancanti tornano a quelli iniziali', () => {
    expect(normalizzaStato(null, 2026)).toEqual(statoIniziale(2026))
    const strano = normalizzaStato(
      { filters: { ageGroup: 'anziani' }, sort: { by: 'colore' } },
      2026,
    )
    expect(strano.filters.ageGroup).toBe('all')
    expect(strano.sort.by).toBe('cognome')
    expect(strano.anno).toBe(2026)
  })
})
