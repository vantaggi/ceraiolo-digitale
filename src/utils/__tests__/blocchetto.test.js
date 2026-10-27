import { describe, it, expect } from 'vitest'
import {
  intervalloBlocchetto,
  pagamentiDelBlocchetto,
  ricevutaDaCuiRiprendere,
  riepilogoBlocchetto,
  sociDellaRicevuta,
} from '../blocchetto'

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
      intervallo: null,
      daInserire: null,
      fuori: [],
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
      intervallo: null,
      daInserire: null,
      fuori: [],
    })
  })

  it('i soci di una ricevuta, con piu\' anni sulla stessa ricevuta', () => {
    const blocco = pagamentiDelBlocchetto(pagamenti, 3)
    expect(sociDellaRicevuta(blocco, 2)).toEqual([{ id: 3, anniPagati: [2025, 2026], importo: 20 }])
    expect(sociDellaRicevuta(blocco, 1).map((s) => s.id)).toEqual([1, 2])
    expect(sociDellaRicevuta(blocco, 3)).toEqual([])
  })

  it("con 10 ricevute il blocchetto 2 va da 11 a 20", () => {
    expect(intervalloBlocchetto(1, 10)).toEqual({ da: 1, a: 10 })
    expect(intervalloBlocchetto(2, 10)).toEqual({ da: 11, a: 20 })
    expect(intervalloBlocchetto('3', 25)).toEqual({ da: 51, a: 75 })
    expect(intervalloBlocchetto(0, 10)).toBeNull()
    expect(intervalloBlocchetto(2, 0)).toBeNull()
  })

  it("con l'intervallo vede anche la prima ricevuta saltata, quelle da inserire e quelle fuori", () => {
    const blocco = [12, 13, 15, 25].map((r) => pagamento([r, 2026, r, 2, 10]))
    const riepilogo = riepilogoBlocchetto(blocco, { da: 11, a: 20 })
    expect(riepilogo.mancanti).toEqual([11, 14])
    expect(riepilogo.daInserire).toEqual({ da: 16, a: 20 })
    expect(riepilogo.fuori).toEqual([25])
    expect(ricevutaDaCuiRiprendere(riepilogo)).toBe(16)
  })

  it('blocchetto vuoto o completo: da dove riprendere', () => {
    const vuoto = riepilogoBlocchetto([], { da: 11, a: 20 })
    expect(vuoto.daInserire).toEqual({ da: 11, a: 20 })
    expect(ricevutaDaCuiRiprendere(vuoto)).toBe(11)
    const completo = riepilogoBlocchetto(
      [11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((r) => pagamento([r, 2026, r, 2, 10])),
      { da: 11, a: 20 },
    )
    expect(completo.mancanti).toEqual([])
    expect(completo.daInserire).toBeNull()
    expect(ricevutaDaCuiRiprendere(completo)).toBe(20)
    // senza intervallo resta il comportamento di prima: dopo l'ultima inserita
    expect(ricevutaDaCuiRiprendere(riepilogoBlocchetto(pagamentiDelBlocchetto(pagamenti, 3)))).toBe(6)
  })
})
