import { describe, it, expect } from 'vitest'
import { descriviUltimoBackup, eBackupCompleto } from '../backup'

const adesso = new Date('2026-10-27T12:00:00Z')
const prima = (ms) => new Date(adesso.getTime() - ms).toISOString()
const MIN = 60000

describe('descriviUltimoBackup', () => {
  it('nessun backup', () => {
    expect(descriviUltimoBackup(null, adesso)).toBe('mai')
  })

  it('minuti, ore e giorni', () => {
    expect(descriviUltimoBackup(prima(20 * 1000), adesso)).toBe('adesso')
    expect(descriviUltimoBackup(prima(3 * MIN), adesso)).toBe('3 min fa')
    expect(descriviUltimoBackup(prima(60 * MIN), adesso)).toBe('1 ora fa')
    expect(descriviUltimoBackup(prima(5 * 60 * MIN), adesso)).toBe('5 ore fa')
    expect(descriviUltimoBackup(prima(30 * 60 * MIN), adesso)).toBe('ieri')
    expect(descriviUltimoBackup(prima(4 * 24 * 60 * MIN), adesso)).toBe('4 giorni fa')
  })

  it("un valore delle versioni precedenti si mostra com'e'", () => {
    expect(descriviUltimoBackup('27/10/2026, 11:00:00', adesso)).toBe('27/10/2026, 11:00:00')
  })
})

describe('eBackupCompleto', () => {
  it("riconosce il backup dell'app dalle tabelle che scrive solo lui", () => {
    expect(eBackupCompleto(['Soci', 'Tesseramenti', 'Blocchetti', 'Settings', 'Metadata'])).toBe(
      true,
    )
    expect(eBackupCompleto(['Soci', 'Tesseramenti', 'Settings'])).toBe(true)
  })

  it('il database iniziale dei soci non e un backup', () => {
    expect(eBackupCompleto(['Soci', 'Tesseramenti'])).toBe(false)
    expect(eBackupCompleto(['Soci', 'Tesseramenti', 'sqlite_sequence'])).toBe(false)
  })
})
