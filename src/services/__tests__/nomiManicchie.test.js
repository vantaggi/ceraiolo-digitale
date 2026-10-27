import { describe, it, expect } from 'vitest'
import db from '../db.js?raw'
import exportPdf from '../export.js?raw'

// Controllo statico: chi non ha manicchia ha lo stesso nome in tutti i PDF (SENZA_MANICCHIA)
describe('nome di chi non ha manicchia', () => {
  it('nessun PDF usa un nome diverso da "Senza manicchia"', () => {
    for (const sorgente of [db, exportPdf]) {
      expect(sorgente).not.toMatch(/['"]Non Assegnat[oi]['"]/i)
    }
  })
})
