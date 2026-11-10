/**
 * Quali soci ricevono la tessera: il menu di Report PDF › Tessere.
 * Conta l'ultimo anno coperto: l'ultimo pagamento registrato, oppure l'ultimo anno da
 * minorenne, che vale come pagato (Cioti, 10 novembre 2026). Un minorenne nell'anno
 * delle tessere resta sempre.
 */
import { annoCoperto, isExemptFromPayment } from './payment'

/** Menu "Escludi chi non paga da piu' di N anni": da 1 a 8 anni (Cioti, 9 novembre 2026). */
export const ANNI_SENZA_PAGARE_TESSERE = [1, 2, 3, 4, 5, 6, 7, 8]

/**
 * Primo anno di pagamento che tiene un socio tra le tessere. Per le tessere 2027 con
 * 3 anni contano i pagamenti 2024, 2025 e 2026 (Cioti, 9 novembre 2026). Per il 2026
 * resta chi ha pagato dal 2023 in poi (chi ha pagato l'ultima volta nel 2022 non paga
 * 2023, 2024, 2025 e 2026: piu' di 3 anni).
 * @param {number} anni - 5 oppure 3
 * @param {number} annoOggi - anno delle tessere (Report PDF, anno di riferimento)
 * @returns {number}
 */
export function primoAnnoValido(anni, annoOggi) {
  return annoOggi - anni
}

/**
 * Il socio ha pagato almeno una volta dal primoAnnoValido in poi, oppure in uno di quegli
 * anni era minorenne.
 * @param {{ data_nascita?: string, tesseramenti?: Array<{ anno: number|string }> }} socio
 * @param {number} anni - anni ammessi senza pagare
 * @param {number} annoOggi
 * @returns {boolean}
 */
export function pagaDaNonPiuDi(socio, anni, annoOggi) {
  const pagati = (socio.tesseramenti || []).map((t) => Number(t.anno)).filter(Number.isFinite)
  const primo = primoAnnoValido(anni, annoOggi)
  if (pagati.some((a) => a >= primo)) return true
  // Minorenne nell'anno delle tessere: sempre dentro (Cioti, 10 novembre 2026)
  if (isExemptFromPayment(socio, annoOggi)) return true
  for (let anno = primo; anno <= annoOggi; anno++) {
    if (annoCoperto(socio, pagati, anno)) return true
  }
  return false
}
