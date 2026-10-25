import { reactive } from 'vue'

/**
 * Dialoghi dell'app al posto di confirm() e prompt() del browser.
 * Un solo dialogo alla volta, mostrato da AppDialog (montato in App.vue).
 *
 *   if (!(await askConfirm({ title: 'Eliminare il pagamento?', message: '...',
 *                             confirmLabel: 'Elimina pagamento', danger: true }))) return
 *   const nome = await askText({ title: 'Nuovo gruppo', label: 'Nome del gruppo' })
 *   if (!nome) return
 */

const DEFAULTS = {
  title: '',
  message: '',
  confirmLabel: 'Conferma',
  cancelLabel: 'Annulla',
  danger: false,
  label: '',
  value: '',
  placeholder: '',
}

export const dialogState = reactive({ open: false, kind: 'confirm', ...DEFAULTS, resolve: null })

const cancelValue = (kind) => (kind === 'text' ? null : false)

function openDialog(kind, options) {
  // Se un dialogo e' gia' aperto, il precedente si chiude come annullato.
  if (dialogState.resolve) dialogState.resolve(cancelValue(dialogState.kind))
  return new Promise((resolve) => {
    Object.assign(dialogState, DEFAULTS, options, { kind, open: true, resolve })
  })
}

/** Chiede una conferma. Risolve true se l'utente conferma, false altrimenti. */
export const askConfirm = (options) => openDialog('confirm', options)

/** Chiede un testo. Risolve il testo senza spazi ai bordi, o null se annullato o vuoto. */
export const askText = (options) => openDialog('text', options)

export function closeDialog(confirmed) {
  const { resolve, kind, value } = dialogState
  dialogState.open = false
  dialogState.resolve = null
  if (!resolve) return
  if (!confirmed) resolve(cancelValue(kind))
  else if (kind === 'text') resolve(value.trim() || null)
  else resolve(true)
}
