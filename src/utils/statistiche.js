/**
 * Statistiche annuali dei soci (grafico della Home).
 *
 * Iscritti, nuovi, rientri e non rinnovati hanno le definizioni del glossario, scritte
 * una volta sola in iscrizione.js.
 */
import { movimentoAnno } from './iscrizione'

/**
 * @param {Array<object>} soci
 * @param {Array<{id_socio: string|number, anno: number}>} tesseramenti
 * @param {number} primoAnno
 * @param {number} ultimoAnno
 * @returns {Array<{year: number, total: number, newMembers: number, returningMembers: number, lostMembers: number}>}
 *   total = iscritti; newMembers = primo anno di iscrizione; returningMembers = di nuovo
 *   in regola dopo almeno un anno fuori; lostMembers = in regola l'anno prima ma non in questo.
 */
export function calcolaStatisticheAnnuali(soci, tesseramenti, primoAnno, ultimoAnno) {
  const pagati = new Map()
  for (const t of tesseramenti) {
    if (!pagati.has(t.id_socio)) pagati.set(t.id_socio, new Set())
    pagati.get(t.id_socio).add(Number(t.anno))
  }
  const schede = soci.map((socio) => ({ socio, anni: [...(pagati.get(socio.id) || [])] }))

  const stats = []
  for (let anno = primoAnno; anno <= ultimoAnno; anno++) {
    const conta = { nuovo: 0, rientro: 0, confermato: 0, 'non-rinnovato': 0 }
    for (const { socio, anni } of schede) {
      const movimento = movimentoAnno(socio, anni, anno)
      if (movimento) conta[movimento]++
    }
    stats.push({
      year: anno,
      total: conta.nuovo + conta.rientro + conta.confermato,
      newMembers: conta.nuovo,
      returningMembers: conta.rientro,
      lostMembers: conta['non-rinnovato'],
    })
  }
  return stats
}

/**
 * Dati del riquadro "Andamento del tesseramento" della Home.
 *
 * Toglie gli anni vuoti prima del primo iscritto e dopo l'ultimo. Nel primo anno della
 * storia tutti risultano nuovi: quel valore non dice nulla e diventa null (nessuna barra).
 * @param {Array<{year: number, total: number, newMembers: number, returningMembers: number, lostMembers: number}>} stats
 *   uscita di calcolaStatisticheAnnuali
 * @param {number|null} quantiAnni anni da mostrare, dal piu' recente; null = tutti
 * @returns {{ serie: Array<object>, ultimo: object|null, variazione: number|null }}
 *   serie = anni del grafico; ultimo = anno piu' recente con iscritti;
 *   variazione = iscritti dell'ultimo anno meno quelli dell'anno prima
 */
export function andamentoTesseramento(stats, quantiAnni = null) {
  const primo = stats.findIndex((s) => s.total > 0)
  if (primo === -1) return { serie: [], ultimo: null, variazione: null }
  let fine = stats.length - 1
  while (stats[fine].total === 0) fine--
  const storia = stats.slice(primo, fine + 1)

  const ultimo = storia[storia.length - 1]
  const variazione = storia.length > 1 ? ultimo.total - storia[storia.length - 2].total : null

  const scelti = quantiAnni ? storia.slice(-quantiAnni) : storia
  const serie = scelti.map((s) => (s === storia[0] ? { ...s, newMembers: null } : { ...s }))
  return { serie, ultimo, variazione }
}
