import { describe, it, expect } from 'vitest'
import { pagamentiDelBlocchetto, riepilogoBlocchetto, sociDellaRicevuta } from '../blocchetto'

// Pagamenti inventati: [socio, anno, ricevuta, blocchetto, quota]
const pagamento = ([id_socio, anno, numero_ricevuta, numero_blocchetto, quota_pagata]) => ({
  id_socio,
  anno,
  numero_ricevuta,
  numero_blocchetto,
  quota_pagata,
})
const pagamenti = [
  [1, 2026, 1, 3, 10],
  [2, 2026, 1, 3, 10],
  [3, 2025, 2, 3, 10],
  [3, 2026, 2, 3, 10],
  [4, 2026, 5, '3', 25], // numeri salvati come testo, come arrivano da certi import
  [5, 2026, '', 3, 10], // ricevuta non scritta
  [6, 2026, 1, 4, 10], // altro blocchetto
].map(pagamento)

describe('blocchetto', () => {
  it('prende i pagamenti del blocchetto anche se il numero e\' testo', () => {
    expect(pagamentiDelBlocchetto(pagamenti, 3)).toHaveLength(6)
    expect(pagamentiDelBlocchetto(pagamenti, '4')).toHaveLength(1)
    expect(pagamentiDelBlocchetto(pagamenti, 0)).toEqual([])
  })

  it('conta ricevute, buchi, soci e incassato', () => {
    expect(riepilogoBlocchetto(pagamentiDelBlocchetto(pagamenti, 3))).toEqual({
      ricevute: 3,
      prima: 1,
      ultima: 5,
      mancanti: [3, 4],
      soci: 5,
      incassato: 75,
      senzaRicevuta: 1,
    })
  })

  it('un blocchetto vuoto', () => {
    expect(riepilogoBlocchetto([])).toEqual({
      ricevute: 0,
      prima: null,
      ultima: null,
      mancanti: [],
      soci: 0,
      incassato: 0,
      senzaRicevuta: 0,
    })
  })

  it('i soci di una ricevuta, con piu\' anni sulla stessa ricevuta', () => {
    const blocco = pagamentiDelBlocchetto(pagamenti, 3)
    expect(sociDellaRicevuta(blocco, 2)).toEqual([{ id: 3, anniPagati: [2025, 2026], importo: 20 }])
    expect(sociDellaRicevuta(blocco, 1).map((s) => s.id)).toEqual([1, 2])
    expect(sociDellaRicevuta(blocco, 3)).toEqual([])
  })
})
