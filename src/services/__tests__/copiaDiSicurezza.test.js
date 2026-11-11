import { describe, it, expect, vi, beforeEach } from 'vitest'

const finti = vi.hoisted(() => ({
  performBackup: vi.fn(),
  exportDatabaseToSqlite: vi.fn(),
  righe: { soci: 1, tesseramenti: 0, blocchetti: 0, settings: 0 },
}))
vi.mock('../backupService', () => ({ backupService: { performBackup: finti.performBackup } }))
vi.mock('../db', () => ({
  exportDatabaseToSqlite: finti.exportDatabaseToSqlite,
  db: Object.fromEntries(
    ['soci', 'tesseramenti', 'blocchetti', 'settings'].map((t) => [
      t,
      { count: async () => finti.righe[t] },
    ]),
  ),
}))

const { copiaPrimaDiCancellare, copiaPrimaDiRipristinare } = await import('../copiaDiSicurezza')

let scaricati
beforeEach(() => {
  finti.performBackup.mockReset()
  finti.exportDatabaseToSqlite
    .mockReset()
    .mockImplementation(async (nome) => ({ success: true, blob: new Blob(['x']), filename: nome }))
  finti.righe = { soci: 1, tesseramenti: 0, blocchetti: 0, settings: 0 }
  scaricati = []
  URL.createObjectURL = () => 'blob:finto'
  URL.revokeObjectURL = () => {}
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    scaricati.push(this.download)
  })
})

describe('copia dei dati prima di "Cancella tutto"', () => {
  it('con il backup su cartella riuscito non scarica niente', async () => {
    finti.performBackup.mockResolvedValue(true)
    expect(await copiaPrimaDiCancellare()).toBe('cartella')
    expect(scaricati).toEqual([])
  })

  it('senza cartella (o scrittura fallita) scarica un solo file', async () => {
    finti.performBackup.mockResolvedValue(false)
    expect(await copiaPrimaDiCancellare()).toBe('scaricata')
    expect(scaricati).toEqual(['ceraiolo_prima_della_cancellazione.sqlite'])
  })

  it('se il backup su cartella lancia un errore passa al file scaricato', async () => {
    finti.performBackup.mockRejectedValue(new Error('permesso negato'))
    expect(await copiaPrimaDiCancellare()).toBe('scaricata')
    expect(scaricati).toHaveLength(1)
  })

  it('se non riesce nemmeno il file lancia: chi chiama non cancella', async () => {
    finti.performBackup.mockResolvedValue(false)
    finti.exportDatabaseToSqlite.mockResolvedValue({ success: false, error: 'disco pieno' })
    await expect(copiaPrimaDiCancellare()).rejects.toThrow('disco pieno')
    expect(scaricati).toEqual([])
  })

  it('con archivio del tutto vuoto non serve nessuna copia', async () => {
    finti.righe = { soci: 0, tesseramenti: 0, blocchetti: 0, settings: 0 }
    expect(await copiaPrimaDiCancellare()).toBe('vuoto')
    expect(finti.performBackup).not.toHaveBeenCalled()
  })

  it('senza soci ma con le impostazioni (quote, sfondo) la copia si fa', async () => {
    finti.righe = { soci: 0, tesseramenti: 0, blocchetti: 0, settings: 3 }
    finti.performBackup.mockResolvedValue(true)
    expect(await copiaPrimaDiCancellare()).toBe('cartella')
  })
})

describe('copia dei dati prima di ripristinare un backup', () => {
  it('scarica sempre il file dei dati di adesso, senza passare dalla cartella', async () => {
    expect(await copiaPrimaDiRipristinare()).toBe('scaricata')
    expect(scaricati).toEqual(['ceraiolo_prima_del_ripristino.sqlite'])
    expect(finti.performBackup).not.toHaveBeenCalled()
  })

  it('con archivio del tutto vuoto non scarica niente', async () => {
    finti.righe = { soci: 0, tesseramenti: 0, blocchetti: 0, settings: 0 }
    expect(await copiaPrimaDiRipristinare()).toBe('vuoto')
    expect(scaricati).toEqual([])
  })

  it('se il backup non si crea lancia', async () => {
    finti.exportDatabaseToSqlite.mockResolvedValue({ success: false, error: 'errore' })
    await expect(copiaPrimaDiRipristinare()).rejects.toThrow('errore')
  })
})
