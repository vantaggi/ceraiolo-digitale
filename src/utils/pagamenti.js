// Elenco dei pagamenti registrati (Incassi › Pagamenti): filtri per anno della quota,
// blocchetto e nome, e i totali di quello che si vede.

const intero = (valore) => {
  const n = Number(valore)
  return Number.isInteger(n) && n > 0 ? n : null
}

const normalizza = (testo) =>
  String(testo ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Anni per cui c'e' almeno un pagamento, dal piu' recente.
 * @param {Array<object>} tesseramenti
 * @returns {number[]}
 */
export function anniConPagamenti(tesseramenti) {
  const anni = new Set()
  for (const t of tesseramenti) {
    const anno = intero(t.anno)
    if (anno !== null) anni.add(anno)
  }
  return [...anni].sort((a, b) => b - a)
}

/**
 * Pagamenti che passano i filtri, con il nome del socio, dal piu' recente.
 * A parita' di data, in ordine di blocchetto e ricevuta (come sulla carta).
 * @param {Array<object>} tesseramenti
 * @param {Map<number, { cognome: string, nome: string }>} soci per id
 * @param {{ anno?: number|null, blocchetto?: number|string|null, testo?: string }} filtri
 *   anno: anno della quota (anche se pagata dopo, come arretrato); testo: parte del
 *   nome del socio o numero esatto della ricevuta
 * @returns {Array<object>} i tesseramenti con `socio` ("Cognome Nome") aggiunto
 */
export function filtraPagamenti(
  tesseramenti,
  soci,
  { anno = null, blocchetto = null, testo = '' } = {},
) {
  const annoFiltro = intero(anno)
  const bloccoFiltro = intero(blocchetto)
  const parole = normalizza(testo).split(' ').filter(Boolean)
  const ricevutaCercata = parole.length === 1 ? intero(parole[0]) : null

  return tesseramenti
    .filter((t) => annoFiltro === null || intero(t.anno) === annoFiltro)
    .filter((t) => bloccoFiltro === null || intero(t.numero_blocchetto) === bloccoFiltro)
    .map((t) => {
      const s = soci.get(t.id_socio)
      return { ...t, socio: s ? `${s.cognome} ${s.nome}` : '' }
    })
    .filter((t) => {
      if (parole.length === 0) return true
      if (ricevutaCercata !== null) return intero(t.numero_ricevuta) === ricevutaCercata
      const nome = normalizza(t.socio)
      return parole.every((p) => nome.includes(p))
    })
    .sort(
      (a, b) =>
        String(b.data_pagamento ?? '').localeCompare(String(a.data_pagamento ?? '')) ||
        (intero(a.numero_blocchetto) ?? 0) - (intero(b.numero_blocchetto) ?? 0) ||
        (intero(a.numero_ricevuta) ?? 0) - (intero(b.numero_ricevuta) ?? 0),
    )
}

/**
 * Totali di un elenco di pagamenti.
 * @param {Array<object>} pagamenti
 * @returns {{ pagamenti: number, soci: number, incassato: number }}
 */
export function totaliPagamenti(pagamenti) {
  const soci = new Set(pagamenti.map((p) => p.id_socio))
  const incassato = pagamenti.reduce((somma, p) => somma + (Number(p.quota_pagata) || 0), 0)
  return {
    pagamenti: pagamenti.length,
    soci: soci.size,
    incassato: Math.round(incassato * 100) / 100,
  }
}
