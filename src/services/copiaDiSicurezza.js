import { backupService } from './backupService'
import { downloadDatabaseExport, isDatabaseEmpty } from './db'

/**
 * Copia dei dati prima di "Cancella tutto". Prima nella cartella dei backup; se la cartella
 * non c'e' o non si scrive, il file viene scaricato. Se non riesce nessuna delle due lancia
 * un errore: senza una copia i dati non si cancellano (prima il reset andava avanti lo stesso).
 * @returns {Promise<'vuoto'|'cartella'|'scaricata'>} dove e' finita la copia
 */
export async function copiaPrimaDiCancellare() {
  if (await isDatabaseEmpty()) return 'vuoto'
  if (await backupService.performBackup(true)) return 'cartella'
  await downloadDatabaseExport('ceraiolo_prima_della_cancellazione.sqlite')
  return 'scaricata'
}

/**
 * Copia dei dati prima di ripristinare un backup: il file viene scaricato, perche' la copia
 * del giorno nella cartella dei backup viene riscritta subito dopo con i dati ripristinati.
 * @returns {Promise<'vuoto'|'scaricata'>}
 */
export async function copiaPrimaDiRipristinare() {
  if (await isDatabaseEmpty()) return 'vuoto'
  await downloadDatabaseExport('ceraiolo_prima_del_ripristino.sqlite')
  return 'scaricata'
}
