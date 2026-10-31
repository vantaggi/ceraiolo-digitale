import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { BLOCCANTI, CONTROLLI, misura } from '../controlli-ui.mjs'

// I controlli arrivati a zero non possono risalire: se questo test e' rosso, il file
// indicato ha reintrodotto una modale con stile proprio o la soglia dei 18 anni.
// Correzione: usare BaseModal, o le funzioni di src/utils/payment.js (isMinorenne...).
const risultati = misura(path.resolve(__dirname, '../..'))

describe('controlli bloccanti della UI Constitution', () => {
  it('ogni controllo bloccante esiste tra i controlli', () => {
    const id = CONTROLLI.map((c) => c.id)
    for (const b of BLOCCANTI) expect(id).toContain(b)
  })

  it.each(BLOCCANTI)('%s resta a zero', (id) => {
    const r = risultati.find((x) => x.id === id)
    expect(r.perFile, `${r.nome}: ${JSON.stringify(r.perFile)}`).toEqual([])
  })
})
