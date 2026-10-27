/**
 * Conti della pagina di un socio: la riga di riepilogo (quota, arretrati, voto) e la
 * cronologia dei pagamenti, con le stesse regole dei report (payment.js e voto.js).
 */
import { annoIscrizione, calculatePaymentStatus, statoAnno } from './payment'
import { valutaDirittoVoto } from './voto'

const anniDi = (tesseramenti) => tesseramenti.map((t) => Number(t.anno))

/**
 * Anno da proporre sul pulsante "Paga": l'anno in corso se manca, altrimenti il
 * prossimo se manca anche quello, altrimenti nessuno.
 * @param {Array<object>} tesseramenti
 * @param {number} annoCorrente
 * @returns {number|null}
 */
export function annoDaPagare(tesseramenti, annoCorrente) {
  const pagati = new Set(anniDi(tesseramenti))
  if (!pagati.has(annoCorrente)) return annoCorrente
  if (!pagati.has(annoCorrente + 1)) return annoCorrente + 1
  return null
}

/**
 * Riepilogo del socio per un anno.
 * @param {object} socio
 * @param {Array<object>} tesseramenti
 * @param {number} anno
 * @returns {{ anno: number, quota: 'V'|'X'|'O'|'-',
 *   pagamento: { inRegola: boolean, arretrati: number[], daReiscrivere: boolean },
 *   voto: { stato: string, motivo: string, quoteMancanti: number[] } }}
 */
export function riepilogoSocio(socio, tesseramenti, anno) {
  const anniPagati = anniDi(tesseramenti)
  return {
    anno,
    quota: statoAnno(socio, anniPagati, anno),
    pagamento: calculatePaymentStatus(socio, anniPagati, anno),
    voto: valutaDirittoVoto(socio, anniPagati, anno),
  }
}

/**
 * Cronologia dei pagamenti, dal piu' recente: un anno per riga dall'iscrizione
 * (il primo tra l'anno dichiarato e il primo pagamento) all'anno in corso o
 * all'ultimo pagato. Un anno pagato due volte ha due righe.
 * @param {object} socio
 * @param {Array<object>} tesseramenti
 * @param {number} annoCorrente
 * @returns {Array<{ chiave: string, anno: number, stato: 'V'|'X'|'O'|'-', pagamento: object|null }>}
 */
export function cronologiaSocio(socio, tesseramenti, annoCorrente) {
  const anniPagati = anniDi(tesseramenti)
  const inizio = annoIscrizione(socio, anniPagati) ?? annoCorrente
  const fine = Math.max(annoCorrente, ...anniPagati)
  const righe = []
  for (let anno = fine; anno >= inizio; anno--) {
    const stato = statoAnno(socio, anniPagati, anno)
    const pagamenti = tesseramenti.filter((t) => Number(t.anno) === anno)
    if (pagamenti.length === 0) righe.push({ chiave: `${anno}`, anno, stato, pagamento: null })
    pagamenti.forEach((p, i) => righe.push({ chiave: `${anno}-${i}`, anno, stato, pagamento: p }))
  }
  return righe
}
