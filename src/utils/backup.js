/**
 * Testo breve per l'ultimo backup, da mostrare nell'intestazione ("3 min fa").
 *
 * @param {string|null} quando - data ISO dell'ultimo backup (prima era una stringa locale)
 * @param {Date} adesso
 * @returns {string}
 */
export function descriviUltimoBackup(quando, adesso = new Date()) {
  if (!quando) return 'mai'
  const data = new Date(quando)
  // Valore salvato da una versione precedente (toLocaleString): lo si mostra com'e'
  if (isNaN(data.getTime())) return quando

  const minuti = Math.floor((adesso.getTime() - data.getTime()) / 60000)
  if (minuti < 1) return 'adesso'
  if (minuti < 60) return `${minuti} min fa`
  const ore = Math.floor(minuti / 60)
  if (ore < 24) return ore === 1 ? '1 ora fa' : `${ore} ore fa`
  const giorni = Math.floor(ore / 24)
  return giorni === 1 ? 'ieri' : `${giorni} giorni fa`
}
