import { describe, it, expect, vi, beforeEach } from 'vitest'

const finti = vi.hoisted(() => ({
  performBackup: vi.fn(),
  downloadDatabaseExport: vi.fn(),
  isDatabaseEmpty: vi.fn(),
}))
vi.mock('../backupService', () => ({ backupService: { performBackup: finti.performBackup } }))
vi.mock('../db', () => ({
  downloadDatabaseExport: finti.downloadDatabaseExport,
  isDatabaseEmpty: finti.isDatabaseEmpty,
}))

const { copiaPrimaDiCancellare, copiaPrimaDiRipristinare } = await import('../copiaDiSicurezza')

beforeEach(() => {
  finti.performBackup.mockReset()
  finti.downloadDatabaseExport.mockReset().mockResolvedValue(true)
  finti.isDatabaseEmpty.mockReset().mockResolvedValue(false)
})

describe('copia dei dati prima di "Cancella tutto"', () => {
  it('con il backup su cartella riuscito non scarica niente', async () => {
    finti.performBackup.mockResolvedValue(true)
    expect(await copiaPrimaDiCancellare()).toBe('cartella')
    expect(finti.downloadDatabaseExport).not.toHaveBeenCalled()
  })

  it('senza cartella (o scrittura fallita) scarica il file', async () => {
    finti.performBackup.mockResolvedValue(false)
    expect(await copiaPrimaDiCancellare()).toBe('scaricata')
    expect(finti.downloadDatabaseExport).toHaveBeenCalledTimes(1)
  })

  it('se non riesce nemmeno a scaricare lancia: chi chiama non cancella', async () => {
    finti.performBackup.mockResolvedValue(false)
    finti.downloadDatabaseExport.mockRejectedValue(new Error('Export failed'))
    await expect(copiaPrimaDiCancellare()).rejects.toThrow('Export failed')
  })

  it('con archivio vuoto non serve nessuna copia', async () => {
    finti.isDatabaseEmpty.mockResolvedValue(true)
    expect(await copiaPrimaDiCancellare()).toBe('vuoto')
    expect(finti.performBackup).not.toHaveBeenCalled()
  })
})

describe('copia dei dati prima di ripristinare un backup', () => {
  it('scarica sempre il file dei dati di adesso', async () => {
    expect(await copiaPrimaDiRipristinare()).toBe('scaricata')
    expect(finti.downloadDatabaseExport).toHaveBeenCalledWith(
      'ceraiolo_prima_del_ripristino.sqlite',
    )
  })

  it('con archivio vuoto non scarica niente', async () => {
    finti.isDatabaseEmpty.mockResolvedValue(true)
    expect(await copiaPrimaDiRipristinare()).toBe('vuoto')
    expect(finti.downloadDatabaseExport).not.toHaveBeenCalled()
  })
})
