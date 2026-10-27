/**
 * Conti di un blocchetto di ricevute, dai pagamenti registrati (tesseramenti).
 * Un blocchetto e' l'insieme dei pagamenti con lo stesso numero_blocchetto, come
 * nella pagina Blocchetti: le ricevute non hanno un intervallo fisso.
 */

const numero = (valore) => {
  const n = Number(valore)
  return Number.isInteger(n) && n > 0 ? n : null
}

/**
 * Pagamenti di un blocchetto (il numero puo' essere salvato come testo o come numero).
 * @param {Array<object>} tesseramenti
 * @param {number} numeroBlocchetto
 */
export function pagamentiDelBlocchetto(tesseramenti, numeroBlocchetto) {
  const n = numero(numeroBlocchetto)
  return n === null ? [] : tesseramenti.filter((t) => numero(t.numero_blocchetto) === n)
}

/**
 * Riepilogo di un blocchetto: ricevute inserite, buchi nella numerazione, soci, incassato.
 * @param {Array<object>} pagamenti i tesseramenti del blocchetto
 * @returns {{ ricevute: number, prima: number|null, ultima: number|null,
 *   mancanti: number[], soci: number, incassato: number, senzaRicevuta: number }}
 */
export function riepilogoBlocchetto(pagamenti) {
  const ricevute = new Set()
  const soci = new Set()
  let incassato = 0
  let senzaRicevuta = 0
  for (const t of pagamenti) {
    const r = numero(t.numero_ricevuta)
    if (r === null) senzaRicevuta++
    else ricevute.add(r)
    soci.add(t.id_socio)
    incassato += Number(t.quota_pagata) || 0
  }
  const ordinate = [...ricevute].sort((a, b) => a - b)
  const prima = ordinate[0] ?? null
  const ultima = ordinate.at(-1) ?? null
  const mancanti = []
  for (let r = prima; prima !== null && r <= ultima; r++) if (!ricevute.has(r)) mancanti.push(r)
  return {
    ricevute: ordinate.length,
    prima,
    ultima,
    mancanti,
    soci: soci.size,
    incassato: Math.round(incassato * 100) / 100,
    senzaRicevuta,
  }
}

/**
 * Soci di una ricevuta, con gli anni pagati e l'importo.
 * @param {Array<object>} pagamenti i tesseramenti del blocchetto
 * @param {number} numeroRicevuta
 * @returns {Array<{ id: number, anniPagati: number[], importo: number }>} nell'ordine di inserimento
 */
export function sociDellaRicevuta(pagamenti, numeroRicevuta) {
  const n = numero(numeroRicevuta)
  const perSocio = new Map()
  for (const t of pagamenti) {
    if (n === null || numero(t.numero_ricevuta) !== n) continue
    const voce = perSocio.get(t.id_socio) || { id: t.id_socio, anniPagati: [], importo: 0 }
    voce.anniPagati.push(Number(t.anno))
    voce.importo += Number(t.quota_pagata) || 0
    perSocio.set(t.id_socio, voce)
  }
  return [...perSocio.values()].map((v) => ({
    ...v,
    anniPagati: v.anniPagati.sort((a, b) => a - b),
    importo: Math.round(v.importo * 100) / 100,
  }))
}
