import { describe, it, expect } from 'vitest'
import { elencoRecupero } from '../recupero'

// Soci inventati
const soci = [
  { id: 1, cognome: 'Rossi', nome: 'Mario' },
  { id: 2, cognome: 'Bianchi', nome: 'Anna' },
  { id: 3, cognome: 'Verdi', nome: 'Luca' },
  { id: 4, cognome: 'Bianchi', nome: 'Aldo' },
]
const t = (id_socio, anno) => ({ id_socio, anno })
const tesseramenti = [t(1, 2024), t(1, 2025), t(2, 2025), t(2, 2026), t(3, 2023), t(4, 2025)]

describe('elencoRecupero', () => {
  it("prende chi ha pagato l'anno prima e non ancora quest'anno", () => {
    const elenco = elencoRecupero(soci, tesseramenti, 2026)
    expect(elenco.map((s) => s.id)).toEqual([4, 1])
  })

  it('ordina per cognome e nome', () => {
    const elenco = elencoRecupero(soci, [t(1, 2025), t(2, 2025), t(4, 2025)], 2026)
    expect(elenco.map((s) => `${s.cognome} ${s.nome}`)).toEqual([
      'Bianchi Aldo',
      'Bianchi Anna',
      'Rossi Mario',
    ])
  })

  it("porta con se' i pagamenti, cosi' il PDF mostra l'ultimo anno pagato", () => {
    const [aldo, mario] = elencoRecupero(soci, tesseramenti, 2026)
    expect(Math.max(...mario.tesseramenti.map((x) => x.anno))).toBe(2025)
    expect(aldo.tesseramenti).toEqual([t(4, 2025)])
  })
})
