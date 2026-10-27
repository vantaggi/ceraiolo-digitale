/**
 * Conti di un blocchetto di ricevute, dai pagamenti registrati (tesseramenti).
 * Un blocchetto e' l'insieme dei pagamenti con lo stesso numero_blocchetto, come
 * nella pagina Blocchetti. I numeri sono progressivi e non ricominciano ogni anno:
 * con 10 ricevute per blocchetto il blocchetto 1 va da 1 a 10, il 2 da 11 a 20
 * (impostazione "Ricevute per blocchetto", la stessa che usa Registra ricevute).
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
 * Ricevute di un blocchetto: con 10 per blocchetto, il 2 va da 11 a 20.
 * @param {number} numeroBlocchetto
 * @param {number} ricevutePerBlocchetto
 * @returns {{ da: number, a: number }|null} null se uno dei due numeri non e' valido
 */
export function intervalloBlocchetto(numeroBlocchetto, ricevutePerBlocchetto) {
  const n = numero(numeroBlocchetto)
  const per = numero(ricevutePerBlocchetto)
  if (n === null || per === null) return null
  return { da: (n - 1) * per + 1, a: n * per }
}

/**
 * Riepilogo di un blocchetto: ricevute inserite, buchi nella numerazione, soci, incassato.
 * Con l'intervallo del blocchetto i buchi partono dalla prima ricevuta del blocchetto,
 * si sa quali ricevute restano da inserire e quali numeri sono fuori dal blocchetto.
 * @param {Array<object>} pagamenti i tesseramenti del blocchetto
 * @param {{ da: number, a: number }|null} [intervallo]
 * @returns {{ ricevute: number, prima: number|null, ultima: number|null,
 *   mancanti: number[], soci: number, incassato: number, senzaRicevuta: number,
 *   intervallo: { da: number, a: number }|null, daInserire: { da: number, a: number }|null,
 *   fuori: number[] }}
 */
export function riepilogoBlocchetto(pagamenti, intervallo = null) {
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
  const dentro = intervallo ? ordinate.filter((r) => r >= intervallo.da && r <= intervallo.a) : ordinate
  const fuori = intervallo ? ordinate.filter((r) => r < intervallo.da || r > intervallo.a) : []
  // Buchi: dalla prima ricevuta (del blocchetto, se si conosce) all'ultima inserita
  const inizio = intervallo ? intervallo.da : prima
  const ultimaDentro = dentro.at(-1) ?? null
  const mancanti = []
  for (let r = inizio; ultimaDentro !== null && r <= ultimaDentro; r++) {
    if (!ricevute.has(r)) mancanti.push(r)
  }
  let daInserire = null
  if (intervallo) {
    const da = ultimaDentro === null ? intervallo.da : ultimaDentro + 1
    if (da <= intervallo.a) daInserire = { da, a: intervallo.a }
  }
  return {
    ricevute: ordinate.length,
    prima,
    ultima,
    mancanti,
    soci: soci.size,
    incassato: Math.round(incassato * 100) / 100,
    senzaRicevuta,
    intervallo,
    daInserire,
    fuori,
  }
}

/**
 * Da quale ricevuta riprendere: la prima ancora da inserire, oppure l'ultima
 * inserita se il blocchetto e' completo.
 * @param {ReturnType<typeof riepilogoBlocchetto>} riepilogo
 * @returns {number|null}
 */
export function ricevutaDaCuiRiprendere(riepilogo) {
  if (riepilogo.intervallo) return riepilogo.daInserire?.da ?? riepilogo.intervallo.a
  return riepilogo.ultima === null ? null : riepilogo.ultima + 1
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
