/**
 * Iscritto, nuovo, rientro e non rinnovato: le parole di docs/GLOSSARIO.md, una funzione
 * ciascuna. Andamento del tesseramento, report e scheda socio usano queste e non una
 * copia della regola. Eta', esenzione e arretrati stanno in payment.js, il voto in voto.js.
 */
import { annoIscrizione, statoAnno } from './payment'

export { annoIscrizione }

/**
 * Iscritto in un anno: socio in regola, cioe' ha pagato oppure e' minorenne ed esente,
 * dall'anno di iscrizione in poi (stato V oppure O di statoAnno).
 * @param {object} socio - con data_nascita e data_prima_iscrizione
 * @param {Array<number>} anniPagati
 * @param {number} anno
 * @returns {boolean}
 */
export function isIscritto(socio, anniPagati, anno) {
  const stato = statoAnno(socio, anniPagati, anno)
  return stato === 'V' || stato === 'O'
}

/**
 * Nuovo in un anno: iscritto, ed e' il suo anno di iscrizione (il primo tra l'anno
 * dichiarato e il primo pagamento).
 * @param {object} socio
 * @param {Array<number>} anniPagati
 * @param {number} anno
 * @returns {boolean}
 */
export function isNuovo(socio, anniPagati, anno) {
  return annoIscrizione(socio, anniPagati) === anno && isIscritto(socio, anniPagati, anno)
}

/**
 * Che cosa e' successo a un socio in un anno, rispetto all'anno prima.
 * - 'nuovo': primo anno di iscrizione.
 * - 'rientro': iscritto dopo almeno un anno fuori (anche chi era da reiscrivere).
 * - 'confermato': iscritto anche l'anno prima.
 * - 'non-rinnovato': iscritto l'anno prima ma non in questo.
 * - null: non iscritto ne' quest'anno ne' l'anno prima.
 * @param {object} socio
 * @param {Array<number>} anniPagati
 * @param {number} anno
 * @returns {'nuovo'|'rientro'|'confermato'|'non-rinnovato'|null}
 */
export function movimentoAnno(socio, anniPagati, anno) {
  const prima = isIscritto(socio, anniPagati, anno - 1)
  if (!isIscritto(socio, anniPagati, anno)) return prima ? 'non-rinnovato' : null
  if (annoIscrizione(socio, anniPagati) === anno) return 'nuovo'
  return prima ? 'confermato' : 'rientro'
}
