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

/**
 * Divide la cronologia in due: gli anni dall'ultimo pagamento (fino all'anno in
 * corso) in poi, che contano per quota e arretrati, e gli "Anni precedenti".
 * Pagare un anno condona quelli prima (calculatePaymentStatus), quindi gli anni
 * precedenti senza pagamento non sono arretrati: la scheda li raggruppa in una
 * riga che si apre (bozza 2A, parola scelta da Cioti il 1 novembre 2026). Se
 * prima dell'ultimo pagamento sono tutti pagati o esenti, non si raggruppa niente.
 * @param {Array<{ anno: number, stato: string }>} righe - da cronologiaSocio
 * @param {number} annoCorrente
 * @returns {{ recenti: Array<object>, precedenti: Array<object>,
 *   riassunto: { da: number, a: number, pagati: number, esenti: number, nonPagati: number }|null }}
 */
export function dividiCronologia(righe, annoCorrente) {
  const pagati = righe.filter((r) => r.pagamento && r.anno <= annoCorrente).map((r) => r.anno)
  if (pagati.length === 0) return { recenti: righe, precedenti: [], riassunto: null }
  const soglia = Math.max(...pagati)
  const recenti = righe.filter((r) => r.anno >= soglia)
  const precedenti = righe.filter((r) => r.anno < soglia)
  // Si raggruppa solo se c'e' almeno un anno senza pagamento: chi ha sempre pagato vede tutto
  if (!precedenti.some((r) => r.stato === 'X')) {
    return { recenti: righe, precedenti: [], riassunto: null }
  }
  const anni = (stato) =>
    new Set(precedenti.filter((r) => r.stato === stato).map((r) => r.anno)).size
  return {
    recenti,
    precedenti,
    riassunto: {
      da: Math.min(...precedenti.map((r) => r.anno)),
      a: Math.max(...precedenti.map((r) => r.anno)),
      pagati: anni('V'),
      esenti: anni('O'),
      nonPagati: anni('X'),
    },
  }
}

/**
 * Testo della riga "Anni precedenti": quanti pagati, esenti e senza pagamento.
 * @param {{ pagati: number, esenti: number, nonPagati: number }} riassunto
 * @returns {string}
 */
export function testoAnniPrecedenti({ pagati, esenti, nonPagati }) {
  const conta = (n, uno, piu) => `${n} ${n === 1 ? uno : piu}`
  const parti = []
  if (nonPagati > 0) parti.push(conta(nonPagati, 'anno senza pagamento', 'anni senza pagamento'))
  if (pagati > 0) parti.push(conta(pagati, 'pagato', 'pagati'))
  if (esenti > 0) parti.push(conta(esenti, 'esente', 'esenti'))
  const testo = parti.join(', ')
  return nonPagati > 0 ? `${testo}: non sono arretrati` : testo
}
