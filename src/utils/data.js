/**
 * Date mostrate in tutta l'app e nei PDF: giorno/mese/anno con due cifre, 01/09/1975
 * (scelta di Cioti, 1 novembre 2026). Un solo posto per il formato: le viste e i PDF
 * passano da qui.
 */

/**
 * @param {string|null|undefined} iso - data salvata, "AAAA-MM-GG" (anche seguita dall'ora)
 * @param {string} [vuota='-'] - testo se la data manca
 * @returns {string} "GG/MM/AAAA"; una data in un altro formato torna com'e'
 */
export function dataItaliana(iso, vuota = '-') {
  if (!iso) return vuota
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso))
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso)
}
