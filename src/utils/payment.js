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

/**
 * Checks if a member is exempt from payment for a specific year (e.g. minors)
 * @param {object} socio - The member object
 * @param {number} year - The year to check
 * @returns {boolean} True if exempt
 */
export function isExemptFromPayment(socio, year) {
  const age = calculateAgeInYear(socio.data_nascita, year)
  // Minors (< 18) are exempt from payment/arrears after their first registration
  // "negli anni successivi risultano sempre iscritti fino al 18 anno"
  return age < 18
}

/**
 * Calculates the payment status and arrears for a member
 * Implements the "condono" logic: if the target year is paid, previous years are condoned
 *
 * @param {object} socio - The member object
 * @param {Array<number>} paidYears - Array of years the member has paid
 * @param {number} targetYear - The reference year (usually current year)
 * @returns {object} { inRegola: boolean, arretrati: Array<number> }
 */
export function calculatePaymentStatus(socio, paidYears, targetYear) {
  const paidSet = new Set(paidYears)
  const isTargetPaid = paidSet.has(targetYear)

  // CONDONO LOGIC: If target year is paid, everything is good
  if (isTargetPaid) {
    return {
      inRegola: true,
      arretrati: []
    }
  }

  // If not paid in target year, check exemption
  if (isExemptFromPayment(socio, targetYear)) {
    // Check if valid registration
    if (socio.data_prima_iscrizione && socio.data_prima_iscrizione <= targetYear) {
      return {
        inRegola: true,
        arretrati: []
      }
    }
  }

  // Calculate arrears if not paid and not exempt (or not completely exempt)
  const arretrati = []
  const firstYear = socio.data_prima_iscrizione || Math.min(...paidYears.length ? paidYears : [targetYear]) || targetYear

  // Check from first year (or reasonable past) up to target year
  // If we only care about "previous" years relative to targetYear being condoned if targetYear is paid,
  // then if targetYear is NOT paid, we list all unpaid years.

  for (let year = firstYear; year <= targetYear; year++) {
    if (!paidSet.has(year)) {
      if (!isExemptFromPayment(socio, year)) {
        arretrati.push(year)
      }
    }
  }

  return {
    inRegola: arretrati.length === 0,
    arretrati
  }
}
