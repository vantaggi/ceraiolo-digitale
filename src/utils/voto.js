/**
 * Regola del diritto di voto (decisa dal proprietario il 27 ottobre 2026).
 *
 * - Si vota solo da maggiorenni: conta l'anno di nascita, non il compleanno.
 * - Il primo anno di iscrizione non si vota, dal secondo si'.
 * - Tre anni di fila senza pagare = socio "cancellato": deve reiscriversi e
 *   l'anno della reiscrizione conta come un primo anno.
 * - Se mancano gli ultimi anni ma il quarto anno indietro e' pagato, il socio
 *   puo' regolarizzare (pagare gli arretrati) e poi votare.
 *
 * Gli anni da minorenne contano come anni in regola (esenzione, vedi payment.js).
 */
import { isExemptFromPayment, MAX_ANNI_ARRETRATI } from './payment'
import { annoIscrizione, isIscritto } from './iscrizione'

export { annoIscrizione }

/**
 * Valuta il diritto di voto di un socio per le elezioni di un anno.
 * @param {object} socio - con data_nascita e data_prima_iscrizione
 * @param {Array<number>} anniPagati - anni con un tesseramento registrato
 * @param {number} annoElezione
 * @returns {{ stato: 'si'|'regolarizza'|'no', motivo: string, quoteMancanti: Array<number> }}
 */
export function valutaDirittoVoto(socio, anniPagati, annoElezione) {
  const no = (motivo) => ({ stato: 'no', motivo, quoteMancanti: [] })

  if (!socio.data_nascita || isNaN(new Date(socio.data_nascita).getTime())) {
    return no('Data di nascita mancante')
  }
  if (isExemptFromPayment(socio, annoElezione)) {
    return no("Minorenne nell'anno delle elezioni")
  }

  const iscrizione = annoIscrizione(socio, anniPagati)
  if (iscrizione === null) return no('Nessun pagamento registrato')
  if (iscrizione > annoElezione) return no(`Iscritto dopo le elezioni (${iscrizione})`)
  if (iscrizione === annoElezione) return no(`Nuovo iscritto nell'anno ${annoElezione}`)

  const inRegola = (anno) => isIscritto(socio, anniPagati, anno)

  // Si guarda dall'anno delle elezioni agli anni di arretrati possibili prima (o
  // dall'iscrizione, se piu' recente): il primo anno in regola di questa finestra e' da
  // dove il socio puo' regolarizzare.
  const inizio = Math.max(annoElezione - MAX_ANNI_ARRETRATI, iscrizione)
  let primoInRegola = null
  for (let anno = inizio; anno <= annoElezione; anno++) {
    if (inRegola(anno)) {
      primoInRegola = anno
      break
    }
  }

  if (primoInRegola === null) {
    return no(`Nessun pagamento dal ${inizio} al ${annoElezione}`)
  }
  // Reiscritto dopo la cancellazione: l'anno della reiscrizione conta come primo anno
  if (primoInRegola === annoElezione) {
    return no(`Socio reiscritto nell'anno ${annoElezione}`)
  }

  const quoteMancanti = []
  for (let anno = primoInRegola; anno <= annoElezione; anno++) {
    if (!inRegola(anno)) quoteMancanti.push(anno)
  }
  if (quoteMancanti.length === 0) return { stato: 'si', motivo: '', quoteMancanti }
  return {
    stato: 'regolarizza',
    motivo: `Mancano quote: ${quoteMancanti.join(', ')}`,
    quoteMancanti,
  }
}
