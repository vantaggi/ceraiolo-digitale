/**
 * Quali soci ricevono la tessera: il menu di Report PDF › Tessere.
 * Conta solo l'ultimo pagamento registrato, come la vecchia spunta dei 5 anni.
 */

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
 * Il socio ha pagato almeno una volta dal primoAnnoValido in poi.
 * @param {{ tesseramenti?: Array<{ anno: number|string }> }} socio
 * @param {number} anni - anni ammessi senza pagare
 * @param {number} annoOggi
 * @returns {boolean}
 */
export function pagaDaNonPiuDi(socio, anni, annoOggi) {
  const pagati = (socio.tesseramenti || []).map((t) => Number(t.anno)).filter(Number.isFinite)
  if (pagati.length === 0) return false
  return Math.max(...pagati) >= primoAnnoValido(anni, annoOggi)
}
