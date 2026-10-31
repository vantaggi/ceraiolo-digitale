/**
 * Utility functions for payment calculations and status checks
 */

/**
 * Calculates the age of a member in a specific year
 * @param {string} birthDateString - Date of birth (YYYY-MM-DD)
 * @param {number} year - The year to calculate age for
 * @returns {number} Age in that year
 */
export function calculateAgeInYear(birthDateString, year) {
  if (!birthDateString) return 99 // Assume adult if no birthdate
  const birthDate = new Date(birthDateString)
  if (isNaN(birthDate.getTime())) return 99

  return year - birthDate.getFullYear()
}

/** Eta' dalla quale si e' maggiorenni (e si paga, e si vota). */
export const MAGGIORE_ETA = 18

/**
 * Minorenne in un anno: conta solo l'anno di nascita, non il compleanno
 * (regola del proprietario, 27 ottobre 2026). Senza data valida: maggiorenne.
 * @param {string} dataNascita - YYYY-MM-DD
 * @param {number} anno
 * @returns {boolean}
 */
export function isMinorenne(dataNascita, anno) {
  return calculateAgeInYear(dataNascita, anno) < MAGGIORE_ETA
}

/**
 * Checks if a member is exempt from payment for a specific year (e.g. minors)
 * @param {object} socio - The member object
 * @param {number} year - The year to check
 * @returns {boolean} True if exempt
 */
export function isExemptFromPayment(socio, year) {
  // Minors are exempt from payment/arrears after their first registration
  // "negli anni successivi risultano sempre iscritti fino al 18 anno"
  return isMinorenne(socio.data_nascita, year)
}

/** Quote predefinite, finche' l'impostazione non e' salvata (Impostazioni > Generale). */
export const QUOTA_ORDINARIA_PREDEFINITA = 10
export const QUOTA_NUOVI_PREDEFINITA = 25

/**
 * Che quota tocca a un socio per un anno.
 * - 'esente': minorenne nell'anno.
 * - 'nuovo': nessun pagamento registrato prima di quell'anno.
 * - 'rientro': non ha pagato l'anno prima, e l'anno prima era maggiorenne.
 * - 'ordinaria': tutti gli altri.
 * Nuovi e rientri pagano la quota dei nuovi (impostazione newMemberQuota).
 * @param {object} socio - con data_nascita
 * @param {Array<number>} anniPagati - anni con un tesseramento (anche dopo l'anno: si ignorano)
 * @param {number} anno
 * @returns {'esente'|'nuovo'|'rientro'|'ordinaria'}
 */
export function tipoQuota(socio, anniPagati, anno) {
  if (isExemptFromPayment(socio, anno)) return 'esente'
  const prima = anniPagati.map(Number).filter((a) => a < anno)
  if (prima.length === 0) return 'nuovo'
  if (!prima.includes(anno - 1) && !isExemptFromPayment(socio, anno - 1)) return 'rientro'
  return 'ordinaria'
}

/**
 * Quota da proporre quando si registra il pagamento di un anno.
 * @param {ReturnType<typeof tipoQuota>} tipo
 * @param {{ quotaOrdinaria: number, quotaNuovi: number }} quote - dalle impostazioni
 * @returns {number}
 */
export function quotaProposta(tipo, { quotaOrdinaria, quotaNuovi }) {
  return tipo === 'nuovo' || tipo === 'rientro' ? quotaNuovi : quotaOrdinaria
}

/**
 * Arretrati massimi: con piu' anni scoperti di fila il socio e' cancellato e deve
 * reiscriversi (regola del proprietario, 27 ottobre 2026; la stessa di voto.js).
 */
export const MAX_ANNI_ARRETRATI = 3

/**
 * Calcola lo stato delle quote e gli arretrati di un socio per un anno.
 * - Condono: se l'anno di riferimento e' pagato, il socio e' in regola.
 * - Pagare un anno condona quelli prima: gli arretrati sono solo gli anni
 *   dopo l'ultimo anno in regola (pagato o da minorenne esente).
 * - Piu' di MAX_ANNI_ARRETRATI anni scoperti: nessun arretrato, va reiscritto.
 *
 * @param {object} socio - The member object
 * @param {Array<number>} paidYears - Array of years the member has paid
 * @param {number} targetYear - The reference year (usually current year)
 * @returns {{ inRegola: boolean, arretrati: Array<number>, daReiscrivere: boolean }}
 */
export function calculatePaymentStatus(socio, paidYears, targetYear) {
  const paidSet = new Set(paidYears)
  const inRegola = { inRegola: true, arretrati: [], daReiscrivere: false }

  if (paidSet.has(targetYear)) return inRegola

  // Minorenne gia' iscritto: esente
  if (
    isExemptFromPayment(socio, targetYear) &&
    socio.data_prima_iscrizione &&
    socio.data_prima_iscrizione <= targetYear
  ) {
    return inRegola
  }

  const firstYear =
    socio.data_prima_iscrizione || (paidYears.length ? Math.min(...paidYears) : targetYear)

  // Ultimo anno in regola prima dell'anno di riferimento
  let ultimoInRegola = null
  for (let year = targetYear - 1; year >= firstYear; year--) {
    if (paidSet.has(year) || isExemptFromPayment(socio, year)) {
      ultimoInRegola = year
      break
    }
  }

  const arretrati = []
  for (let year = (ultimoInRegola ?? firstYear - 1) + 1; year <= targetYear; year++) {
    if (!isExemptFromPayment(socio, year)) arretrati.push(year)
  }

  if (arretrati.length > MAX_ANNI_ARRETRATI) {
    return { inRegola: false, arretrati: [], daReiscrivere: true }
  }
  return { inRegola: arretrati.length === 0, arretrati, daReiscrivere: false }
}

/**
 * Testo della colonna arretrati nei PDF
 * @param {{ arretrati: Array<number>, daReiscrivere: boolean }} stato
 * @returns {string}
 */
export function descriviArretrati(stato) {
  if (stato.daReiscrivere) return 'Da reiscrivere'
  return stato.arretrati.length > 0 ? stato.arretrati.join(', ') : '-'
}

/**
 * Anno di iscrizione: il primo tra l'anno dichiarato (data_prima_iscrizione)
 * e il primo pagamento registrato. Senza nessuno dei due, null.
 * @param {object} socio
 * @param {Array<number>} anniPagati
 * @returns {number|null}
 */
export function annoIscrizione(socio, anniPagati) {
  const candidati = [...anniPagati]
  const dichiarato = Number(socio.data_prima_iscrizione)
  if (Number.isInteger(dichiarato) && dichiarato > 1900) candidati.push(dichiarato)
  return candidati.length > 0 ? Math.min(...candidati) : null
}

/**
 * Stato di un anno nelle colonne dei report (V, X, O, -).
 * - "-": non ancora iscritto in quell'anno
 * - "V": pagato
 * - "O": minorenne, esente
 * - "X": non pagato
 * @param {object} socio
 * @param {Array<number>} anniPagati
 * @param {number} anno
 * @returns {'V'|'X'|'O'|'-'}
 */
export function statoAnno(socio, anniPagati, anno) {
  const iscrizione = annoIscrizione(socio, anniPagati)
  if (iscrizione === null || anno < iscrizione) return '-'
  if (anniPagati.includes(anno)) return 'V'
  if (isExemptFromPayment(socio, anno)) return 'O'
  return 'X'
}
