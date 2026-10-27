// Ricerca soci ricordata per la sessione del browser: tornando dal dettaglio
// di un socio si ritrovano la stessa ricerca e gli stessi filtri.
const CHIAVE = 'ricerca_soci'
const CAMPI = ['searchTerm', 'ageCategory', 'group', 'renewalYear']

/**
 * @param {Storage} storage - di solito window.sessionStorage
 * @returns {object|null} i filtri salvati, o null se non ce ne sono o non si leggono
 */
export function leggiRicerca(storage) {
  try {
    const salvata = JSON.parse(storage.getItem(CHIAVE))
    if (!salvata || typeof salvata !== 'object') return null
    return Object.fromEntries(CAMPI.filter((c) => c in salvata).map((c) => [c, salvata[c]]))
  } catch {
    return null
  }
}

/**
 * @param {Storage} storage
 * @param {object} filtri - con searchTerm, ageCategory, group, renewalYear
 */
export function salvaRicerca(storage, filtri) {
  try {
    storage.setItem(CHIAVE, JSON.stringify(Object.fromEntries(CAMPI.map((c) => [c, filtri[c]]))))
  } catch {
    // Archivio del browser non disponibile (finestra privata): la ricerca non si ricorda
  }
}
