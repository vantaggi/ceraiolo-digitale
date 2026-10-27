// Le sezioni del menu, una per ogni lavoro della segreteria. L'andamento del
// tesseramento sta nella Home (Soci), non ha una voce sua.
// `percorsi` sono gli inizi di indirizzo che appartengono alla sezione.
export const SEZIONI = [
  { nome: 'Soci', to: '/', icona: 'socio', percorsi: ['/socio'] },
  { nome: 'Incassi', to: '/incassi/ricevute', icona: 'quota', percorsi: ['/incassi'] },
  { nome: 'Report PDF', to: '/report-pdf', icona: 'documento', percorsi: ['/report-pdf'] },
  { nome: 'Impostazioni', to: '/settings', icona: 'impostazioni', percorsi: ['/settings'] },
]

// Schede della sezione Incassi.
export const SCHEDE_INCASSI = [
  { to: '/incassi/ricevute', label: 'Registra ricevute', icona: 'registrazione-seriale' },
  { to: '/incassi/blocchetti', label: 'Blocchetti', icona: 'blocchetto' },
]

/**
 * Sezione del menu a cui appartiene un indirizzo.
 * @param {string} path
 * @returns {string|null} nome della sezione
 */
export function sezioneDi(path) {
  if (path === '/') return 'Soci'
  const sezione = SEZIONI.find((s) =>
    s.percorsi.some((p) => path === p || path.startsWith(p + '/')),
  )
  return sezione ? sezione.nome : null
}
