import { describe, it, expect } from 'vitest'
import { dataItaliana } from '../data'
import { formatDate } from '@/services/export'

describe('dataItaliana: 01/09/1975 ovunque', () => {
  it('scrive giorno/mese/anno con due cifre', () => {
    expect(dataItaliana('1975-09-01')).toBe('01/09/1975')
    expect(dataItaliana('2024-01-18T10:30:00')).toBe('18/01/2024')
  })

  it('una data mancante diventa il trattino, o il testo scelto', () => {
    expect(dataItaliana(null)).toBe('-')
    expect(dataItaliana('', '—')).toBe('—')
  })

  it('una data in un altro formato resta com e scritta', () => {
    expect(dataItaliana('18/01/2024')).toBe('18/01/2024')
  })

  it('formatDate dei PDF e delle viste usa lo stesso formato', () => {
    expect(formatDate('1975-09-01')).toBe('01/09/1975')
  })
})
