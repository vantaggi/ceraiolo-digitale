import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Solo dati inventati. Oggi e' il 31 ottobre 2026.
const soci = [
  { id: 1, cognome: 'Alfa', nome: 'Dicembre', data_nascita: '2008-12-15' },
  { id: 2, cognome: 'Beta', nome: 'Bambino', data_nascita: '2015-05-05' },
  { id: 3, cognome: 'Gamma', nome: 'Adulto', data_nascita: '1980-01-01' },
]
const tesseramenti = [
  { id_socio: 1, anno: 2025 },
  { id_socio: 2, anno: 2025 },
  { id_socio: 3, anno: 2025 },
]

vi.mock('../db', () => ({
  db: {},
  updateSetting: vi.fn(),
  exportAllSoci: vi.fn(async () => soci),
  exportAllTesseramenti: vi.fn(async () => tesseramenti),
}))
vi.mock('../tessere', () => ({ caricaModelloTessera: vi.fn(), creaPDFTessere: vi.fn() }))

const fogli = {}
vi.mock('xlsx', () => ({
  utils: {
    book_new: () => ({}),
    json_to_sheet: (righe) => righe,
    book_append_sheet: (_wb, righe, nome) => {
      fogli[nome] = righe.map((r) => r.Cognome)
    },
  },
  writeFile: vi.fn(),
}))

const { exportDataToExcel } = await import('../export.js')

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-31T10:00:00'))
  for (const k of Object.keys(fogli)) delete fogli[k]
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Excel di tutti i dati: maggiorenni e minorenni', () => {
  it("conta solo l'anno di nascita: chi e nato a dicembre 2008 e maggiorenne nel 2026", async () => {
    await exportDataToExcel()
    expect(fogli.Maggiorenni).toEqual(['Alfa', 'Gamma'])
    expect(fogli.Minorenni).toEqual(['Beta'])
  })
})
