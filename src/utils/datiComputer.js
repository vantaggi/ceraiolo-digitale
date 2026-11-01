/**
 * Righe "I dati di questo computer" in Impostazioni › Dati (stati dell'app, scelta 2A
 * delle bozze della PR 7): dove sono i dati, quanti sono, se il browser li protegge,
 * com'e' il backup e quale versione dell'app li usa. Funzione pura: i valori li
 * raccoglie il componente DatiComputer.
 */
import { descriviUltimoBackup } from './backup'

const numero = (n) => n.toLocaleString('it-IT')

/**
 * @param {object} stato
 * @param {string} stato.indirizzo - host e percorso della pagina, senza la barra finale, es. "vantaggi.github.io/ceraiolo-digitale"
 * @param {{ soci: number, pagamenti: number }|null} stato.conteggi - null finche' non sono letti
 * @param {boolean|null} stato.protetti - risposta di navigator.storage.persisted(); null se il browser non la da'
 * @param {{ supportato: boolean, cartella: boolean, attivo: boolean, autorizzato: boolean, percorso: string, ultimo: string|null }} stato.backup
 * @param {string} stato.versione - data ISO della build
 * @param {Date} [stato.adesso]
 * @returns {Array<{ id: string, label: string, value: string, help?: string, tone?: 'ok'|'attenzione', readonly: true }>}
 */
export function righeDatiComputer({
  indirizzo,
  conteggi,
  protetti,
  backup,
  versione,
  adesso = new Date(),
}) {
  const riga = (id, label, value, help, tone) => ({ id, label, value, help, tone, readonly: true })

  const conservazione =
    protetti === true
      ? riga(
          'conservazione',
          'Conservazione',
          'Protetti',
          'Il browser non li cancella da solo quando manca spazio.',
          'ok',
        )
      : protetti === false
        ? riga(
            'conservazione',
            'Conservazione',
            'Non protetti',
            'Il browser può cancellarli se manca spazio. Tieni attivo il backup.',
            'attenzione',
          )
        : riga(
            'conservazione',
            'Conservazione',
            'Non si sa',
            'Questo browser non dice se li protegge. Tieni attivo il backup.',
            'attenzione',
          )

  let rigaBackup
  if (!backup.supportato) {
    rigaBackup = riga(
      'backup',
      'Backup automatico',
      'Non disponibile',
      'Questo browser non salva in una cartella: usa Scarica una copia qui sotto.',
      'attenzione',
    )
  } else if (!backup.cartella || !backup.attivo) {
    rigaBackup = riga(
      'backup',
      'Backup automatico',
      'Spento',
      'Scegli una cartella qui sotto e attiva il backup automatico.',
      'attenzione',
    )
  } else if (!backup.autorizzato) {
    rigaBackup = riga(
      'backup',
      'Backup automatico',
      'In pausa',
      'Il browser chiede di nuovo il permesso sulla cartella: premi Riattiva backup in alto.',
      'attenzione',
    )
  } else {
    rigaBackup = riga(
      'backup',
      'Backup automatico',
      `Attivo · ultimo ${descriviUltimoBackup(backup.ultimo, adesso)}`,
      `Cartella: ${backup.percorso}`,
    )
  }

  const data = new Date(versione)
  return [
    riga('dove', 'Dove sono', indirizzo, 'Solo in questo browser e a questo indirizzo.'),
    riga(
      'contenuto',
      'Contenuto',
      conteggi ? `${numero(conteggi.soci)} soci, ${numero(conteggi.pagamenti)} pagamenti` : '…',
    ),
    conservazione,
    rigaBackup,
    riga(
      'versione',
      "Versione dell'app",
      isNaN(data.getTime())
        ? '-'
        : data.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
    ),
  ]
}
