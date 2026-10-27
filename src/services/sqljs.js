import initSqlJs from 'sql.js'

/**
 * Indirizzo di sql-wasm.wasm, che la build mette accanto all'app (vite.config.js).
 * Va calcolato dalla cartella dell'app (BASE_URL), non dalla radice del sito: su
 * GitHub Pages e con `npm run dev` l'app sta in /ceraiolo-digitale/.
 * @param {string} file - nome del file chiesto da sql.js
 * @param {string} [base] - cartella dell'app
 * @param {string} [pagina] - indirizzo della pagina aperta
 * @returns {string}
 */
export function indirizzoWasm(file, base = import.meta.env.BASE_URL, pagina = window.location.href) {
  return new URL(base + file, pagina).href
}

/**
 * Carica sql.js. Passare sempre da qui: sql.js tiene il primo caricamento per tutta
 * la sessione, quindi un percorso sbagliato in un punto qualsiasi (prima c'era
 * `/${file}` nel ripristino) blocca anche i backup fino al ricaricamento della pagina.
 */
export function caricaSqlJs() {
  return initSqlJs({ locateFile: (file) => indirizzoWasm(file) })
}
