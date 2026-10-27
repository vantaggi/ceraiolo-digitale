/**
 * Elenco "Aventi diritto al voto e arretrati" per le elezioni di un anno,
 * diviso per manicchia. La regola del voto sta in voto.js.
 */
import { statoAnno } from './payment'
import { valutaDirittoVoto } from './voto'

export const SENZA_MANICCHIA = 'Senza manicchia'

const confrontaSoci = (a, b) =>
  `${a.cognome} ${a.nome}`.localeCompare(`${b.cognome} ${b.nome}`, 'it', { sensitivity: 'base' })

const contaStati = (righe) => ({
  si: righe.filter((r) => r.stato === 'si').length,
  regolarizza: righe.filter((r) => r.stato === 'regolarizza').length,
  no: righe.filter((r) => r.stato === 'no').length,
  quoteMancanti: righe.reduce((n, r) => n + r.quoteMancanti.length, 0),
})

/**
 * @param {Array<object>} soci - con tesseramenti [{ anno }]
 * @param {number} annoElezione
 * @param {object} [opzioni]
 * @param {boolean} [opzioni.includiNonAventi] - aggiunge chi non ha diritto ma e' stato
 *   in regola almeno un anno tra i tre prima delle elezioni e l'anno stesso (nuovi
 *   iscritti, rientri, chi ha appena smesso): chi e' cancellato da anni resta fuori
 * @param {string} [opzioni.manicchia] - solo questa manicchia
 * @returns {{ gruppi: Array<{ manicchia: string, righe: Array, totali: object }>, totali: object }}
 *   riga = { socio, anniPagati, stato: 'si'|'regolarizza'|'no', motivo, quoteMancanti }
 */
export function elencoAventiDiritto(soci, annoElezione, opzioni = {}) {
  const { includiNonAventi = false, manicchia = null } = opzioni
  const perManicchia = new Map()

  for (const socio of soci) {
    const nome = socio.gruppo_appartenenza || SENZA_MANICCHIA
    if (manicchia && nome !== manicchia) continue

    const anniPagati = (socio.tesseramenti || []).map((t) => Number(t.anno))
    const { stato, motivo, quoteMancanti } = valutaDirittoVoto(socio, anniPagati, annoElezione)
    if (stato === 'no') {
      if (!includiNonAventi) continue
      const recente = [0, 1, 2, 3].some((d) =>
        ['V', 'O'].includes(statoAnno(socio, anniPagati, annoElezione - d)),
      )
      if (!recente) continue
    }

    if (!perManicchia.has(nome)) perManicchia.set(nome, [])
    perManicchia.get(nome).push({ socio, anniPagati, stato, motivo, quoteMancanti })
  }

  const gruppi = [...perManicchia.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'it', { sensitivity: 'base' }))
    .map(([nome, righe]) => {
      righe.sort((a, b) => confrontaSoci(a.socio, b.socio))
      return { manicchia: nome, righe, totali: contaStati(righe) }
    })

  return { gruppi, totali: contaStati(gruppi.flatMap((g) => g.righe)) }
}
