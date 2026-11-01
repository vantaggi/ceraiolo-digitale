/**
 * Registra ricevute: che cosa fa Invio su un socio trovato (scelta 2A delle bozze della
 * PR 8). Invio registra subito l'anno di riferimento con la quota proposta dalle regole
 * di payment.js, la stessa che propone la finestra del pagamento nella scheda socio.
 * Quando non c'e' niente da registrare (gia' sulla ricevuta, gia' pagato, esente) Invio
 * non registra e il motivo si dice a parole: un tasto non va mai perso in silenzio.
 */
import { calculatePaymentStatus, quotaProposta, statoAnno, tipoQuota } from './payment'

/** Importo all'italiana, sempre con due decimali: 10 -> "10,00", 12500 -> "12.500,00". */
export function euro(valore) {
  return (Number(valore) || 0).toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const TESTO_QUOTA = { nuovo: 'quota dei nuovi', rientro: 'quota dei nuovi' }

/**
 * @param {object} p
 * @param {object} p.socio - con cognome, nome, data_nascita, data_prima_iscrizione
 * @param {Array<number>} p.anniPagati - tutti gli anni con un pagamento
 * @param {number} p.anno - anno di riferimento della sessione
 * @param {{ quotaOrdinaria: number, quotaNuovi: number }} p.quote - dalle impostazioni
 * @param {boolean} [p.sullaRicevuta] - il socio e' gia' sulla ricevuta in corso
 * @returns {{
 *   registra: boolean,
 *   messaggio: string,
 *   stato: { testo: string, tono: 'ok'|'attenzione'|'neutro' },
 *   anno: number, quota: number, testoQuota: string, arretrati: Array<number>
 * }}
 */
export function propostaRegistrazione({ socio, anniPagati, anno, quote, sullaRicevuta = false }) {
  const anni = (anniPagati || []).map(Number)
  const nome = `${socio.cognome} ${socio.nome}`.trim()
  const tipo = tipoQuota(socio, anni, anno)
  const base = {
    anno,
    quota: quotaProposta(tipo, quote),
    testoQuota: TESTO_QUOTA[tipo] || '',
    arretrati: [],
  }
  const ferma = (stato, messaggio) => ({ ...base, registra: false, stato, messaggio })

  if (sullaRicevuta) {
    return ferma({ testo: 'Sulla ricevuta', tono: 'ok' }, `${nome} è già su questa ricevuta.`)
  }
  if (anni.includes(anno)) {
    return ferma(
      { testo: `Quota ${anno} pagata`, tono: 'ok' },
      `${nome} ha già pagato la quota ${anno}.`,
    )
  }
  if (statoAnno(socio, anni, anno) === 'O') {
    return ferma(
      { testo: `Esente nel ${anno}`, tono: 'neutro' },
      `${nome} è minorenne ed esente nel ${anno}: non deve pagare. Se versa comunque, registra il pagamento dalla sua scheda.`,
    )
  }

  // calculatePaymentStatus conta anche l'anno di riferimento: arretrati sono quelli prima
  const stato = calculatePaymentStatus(socio, anni, anno)
  const arretrati = stato.arretrati.filter((a) => a < anno)
  return {
    ...base,
    registra: true,
    stato: stato.daReiscrivere
      ? { testo: 'Da reiscrivere', tono: 'attenzione' }
      : arretrati.length > 0
        ? { testo: `Arretrati: ${arretrati.join(', ')}`, tono: 'attenzione' }
        : { testo: `Da pagare ${anno}`, tono: 'neutro' },
    messaggio: '',
    arretrati,
  }
}

/**
 * Registra ricevute, dopo "Aggiungi l'arretrato": le quote dello stesso socio sulla
 * ricevuta da correggere. Un rientro che salda gli arretrati paga la quota ordinaria
 * (scelta di Cioti, 1 novembre 2026): la quota del rientro registrata con Invio scende.
 * Si cambia solo una quota uguale a quella proposta prima dell'arretrato: un importo
 * scritto a mano (un'offerta) resta com'e'.
 * @param {object} p
 * @param {object} p.socio
 * @param {Array<{ id_tesseramento: number, anno: number, quota_pagata: number }>} p.pagamenti
 *   pagamenti del socio su questa ricevuta
 * @param {Array<number>} p.anniPrima - anni pagati prima dell'arretrato
 * @param {Array<number>} p.anniDopo - anni pagati con l'arretrato
 * @param {{ quotaOrdinaria: number, quotaNuovi: number }} p.quote
 * @returns {Array<{ id_tesseramento: number, anno: number, da: number, a: number }>}
 */
export function quoteDopoArretrato({ socio, pagamenti, anniPrima, anniDopo, quote }) {
  const proposta = (anni, anno) => quotaProposta(tipoQuota(socio, anni.map(Number), anno), quote)
  const correzioni = []
  for (const p of pagamenti) {
    const anno = Number(p.anno)
    const prima = proposta(anniPrima, anno)
    const dopo = proposta(anniDopo, anno)
    if (Number(p.quota_pagata) === prima && dopo !== prima) {
      correzioni.push({ id_tesseramento: p.id_tesseramento, anno, da: prima, a: dopo })
    }
  }
  return correzioni
}
