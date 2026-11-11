import { backupService } from './backupService'
import { db, exportDatabaseToSqlite } from './db'

/** Niente da copiare: nessun socio, pagamento, blocchetto o impostazione */
async function archivioVuoto() {
  const quanti = await Promise.all(
    [db.soci, db.tesseramenti, db.blocchetti, db.settings].map((t) => t.count()),
  )
  return quanti.every((n) => n === 0)
}

/** Scarica il backup dei dati di adesso, un solo file. Lancia se il backup non si crea. */
async function scaricaCopia(nomeFile) {
  const esito = await exportDatabaseToSqlite(nomeFile)
  if (!esito.success) throw new Error(esito.error || 'backup non riuscito')
  const url = URL.createObjectURL(esito.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = esito.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Copia dei dati prima di "Cancella tutto". Prima nella cartella dei backup; se la cartella
 * non c'e' o non si scrive, il file viene scaricato. Se non riesce nessuna delle due lancia
 * un errore: senza una copia i dati non si cancellano (prima il reset andava avanti lo stesso).
 * Con 'scaricata' il browser non dice se il file e' stato salvato davvero: chi chiama lo
 * chiede a chi usa l'app prima di cancellare.
 * @returns {Promise<'vuoto'|'cartella'|'scaricata'>} dove e' finita la copia
 */
export async function copiaPrimaDiCancellare() {
  if (await archivioVuoto()) return 'vuoto'
  let inCartella = false
  try {
    inCartella = (await backupService.performBackup(true)) === true
  } catch {
    // permesso negato o cartella sparita: si passa al file scaricato
  }
  if (inCartella) return 'cartella'
  await scaricaCopia('ceraiolo_prima_della_cancellazione.sqlite')
  return 'scaricata'
}

/**
 * Copia dei dati prima di ripristinare un backup: il file viene scaricato, perche' la copia
 * del giorno nella cartella dei backup viene riscritta subito dopo con i dati ripristinati.
 * @returns {Promise<'vuoto'|'scaricata'>}
 */
export async function copiaPrimaDiRipristinare() {
  if (await archivioVuoto()) return 'vuoto'
  await scaricaCopia('ceraiolo_prima_del_ripristino.sqlite')
  return 'scaricata'
}
