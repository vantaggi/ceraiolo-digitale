/**
 * Statistiche annuali dei soci (grafico della Home).
 *
 * "Iscritto" in un anno = socio in regola in quell'anno: ha pagato, oppure e'
 * minorenne ed esente (vedi payment.js), a partire dall'anno di iscrizione.
 */
import { isExemptFromPayment } from './payment'
import { annoIscrizione } from './voto'

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

  const schede = soci.map((socio) => {
    const anni = pagati.get(socio.id) || new Set()
    const nascita = socio.data_nascita ? new Date(socio.data_nascita).getFullYear() : null
    return { socio, anni, iscrizione: annoIscrizione(socio, [...anni]), nascita }
  })

  const iscritto = ({ socio, anni, iscrizione, nascita }, anno) => {
    if (iscrizione === null || anno < iscrizione) return false
    if (anni.has(anno)) return true
    if (nascita !== null && anno < nascita) return false
    return isExemptFromPayment(socio, anno)
  }

  const stats = []
  for (let anno = primoAnno; anno <= ultimoAnno; anno++) {
    let total = 0
    let newMembers = 0
    let returningMembers = 0
    let lostMembers = 0
    for (const scheda of schede) {
      const ora = iscritto(scheda, anno)
      const prima = iscritto(scheda, anno - 1)
      if (ora) {
        total++
        if (scheda.iscrizione === anno) newMembers++
        else if (!prima) returningMembers++
      } else if (prima) {
        lostMembers++
      }
    }
    stats.push({ year: anno, total, newMembers, returningMembers, lostMembers })
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
