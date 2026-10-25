import { describe, it, expect } from 'vitest'
import { askConfirm, askText, closeDialog, dialogState } from '../useDialog'

describe('useDialog', () => {
  it('askConfirm risolve true se si conferma, false se si annulla', async () => {
    const si = askConfirm({ title: 'Eliminare?' })
    expect(dialogState.open).toBe(true)
    closeDialog(true)
    await expect(si).resolves.toBe(true)

    const no = askConfirm({ title: 'Eliminare?' })
    closeDialog(false)
    await expect(no).resolves.toBe(false)
    expect(dialogState.open).toBe(false)
  })

  it('askText risolve il testo senza spazi ai bordi, null se vuoto o annullato', async () => {
    const nome = askText({ title: 'Nuovo gruppo' })
    dialogState.value = '  Esterna  '
    closeDialog(true)
    await expect(nome).resolves.toBe('Esterna')

    const vuoto = askText({ title: 'Nuovo gruppo' })
    dialogState.value = '   '
    closeDialog(true)
    await expect(vuoto).resolves.toBe(null)

    const annullato = askText({ title: 'Nuovo gruppo' })
    dialogState.value = 'Esterna'
    closeDialog(false)
    await expect(annullato).resolves.toBe(null)
  })

  it('un nuovo dialogo annulla quello ancora aperto e riparte dai valori di default', async () => {
    const primo = askConfirm({ title: 'Primo', danger: true, confirmLabel: 'Elimina' })
    const secondo = askConfirm({ title: 'Secondo' })
    await expect(primo).resolves.toBe(false)
    expect(dialogState.danger).toBe(false)
    expect(dialogState.confirmLabel).toBe('Conferma')
    closeDialog(true)
    await expect(secondo).resolves.toBe(true)
  })
})
