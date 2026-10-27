// Ricerca soci ricordata per la sessione del browser: tornando dal dettaglio
// di un socio si ritrovano la stessa ricerca e gli stessi filtri.
import { calculateAgeInYear } from './payment'

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

/**
 * Dice se un socio passa i filtri della pagina Soci. L'eta' segue la regola di
 * payment.js (conta solo l'anno di nascita), cosi' il filtro "Minorenni" e la
 * colonna "Quota" dicono la stessa cosa.
 * @param {object} socio
 * @param {{ searchTerm?: string, ageCategory?: string, group?: string }} filtri
 * @param {number} anno - anno in cui si guarda l'eta'
 * @returns {boolean}
 */
export function passaFiltri(socio, filtri, anno) {
  const { searchTerm, ageCategory, group } = filtri

  if (ageCategory === 'maggiorenni' || ageCategory === 'minorenni') {
    // Senza una data di nascita valida non si sa: il socio resta fuori da entrambi
    if (!socio.data_nascita || isNaN(new Date(socio.data_nascita))) return false
    const eta = calculateAgeInYear(socio.data_nascita, anno)
    if ((ageCategory === 'maggiorenni') !== eta >= 18) return false
  }

  if (group && group !== 'Tutti' && socio.gruppo_appartenenza !== group) return false

  if (searchTerm && searchTerm.trim() !== '') {
    // Ogni parola scritta deve trovarsi nel nome, nel cognome o nelle note
    const parole = searchTerm.toLowerCase().trim().split(/\s+/)
    const campi = [socio.nome, socio.cognome, socio.note].map((c) => (c || '').toLowerCase())
    if (!parole.every((p) => campi.some((c) => c.includes(p)))) return false
  }

  return true
}

/**
 * Raggruppa i pagamenti per socio.
 * @param {Array<{ id_socio: number|string, anno: number|string }>} tesseramenti
 * @returns {Map<number, number[]>} id del socio -> anni pagati
 */
export function anniPagatiPerSocio(tesseramenti) {
  const perSocio = new Map()
  for (const t of tesseramenti) {
    const id = Number(t.id_socio)
    if (!perSocio.has(id)) perSocio.set(id, [])
    perSocio.get(id).push(Number(t.anno))
  }
  return perSocio
}

const CHIAVE_RECENTI = 'recent_members'
const MAX_RECENTI = 5

/**
 * Ultimi soci aperti, dal piu' recente.
 * @param {Storage} storage - di solito window.localStorage
 * @returns {number[]} id dei soci
 */
export function leggiRecenti(storage) {
  try {
    const ids = JSON.parse(storage.getItem(CHIAVE_RECENTI))
    return Array.isArray(ids) ? ids.map(Number).filter(Number.isInteger) : []
  } catch {
    return []
  }
}

/**
 * Segna un socio come appena aperto: va in cima e la lista resta corta.
 * @param {Storage} storage
 * @param {number|string} id
 */
export function ricordaSocioAperto(storage, id) {
  const numero = Number(id)
  if (!Number.isInteger(numero)) return
  const ids = [numero, ...leggiRecenti(storage).filter((x) => x !== numero)].slice(0, MAX_RECENTI)
  try {
    storage.setItem(CHIAVE_RECENTI, JSON.stringify(ids))
  } catch {
    // Archivio non disponibile: la lista non si aggiorna
  }
}
