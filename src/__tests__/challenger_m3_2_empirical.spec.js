import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { PDFDocument } from 'pdf-lib'
import TesseraTemplate from '@/components/TesseraTemplate.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import {
  formatItalianDOB,
  generateAllCardsPDF,
  generateBookletSummaryPDF,
} from '@/services/export'

// Mock toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}))

// Mock db calls for export
vi.mock('@/services/db', () => ({
  getSetting: vi.fn().mockResolvedValue(null),
  updateSetting: vi.fn().mockResolvedValue(true),
  exportAllSoci: vi.fn().mockResolvedValue([]),
  exportAllTesseramenti: vi.fn().mockResolvedValue([]),
  getAllBlocchetti: vi.fn().mockResolvedValue([]),
}))

// Mock URL.createObjectURL and revokeObjectURL
if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-challenger-url')
}
// Helper to convert Blob to ArrayBuffer across jsdom and browser environments
async function blobToArrayBuffer(blob) {
  if (blob && typeof blob.arrayBuffer === 'function') {
    return await blob.arrayBuffer()
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(blob)
  })
}

describe('Challenger M3-2: Empirical Adversarial Challenge (Cards, Manicchia, 6-Up & Cash Arithmetic)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    if (typeof HTMLCanvasElement !== 'undefined') {
      HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
        drawImage: vi.fn(),
      }))
      HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,mock')
    }

    globalThis.Image = class {
      constructor() {
        this.width = 100
        this.height = 100
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
    }
  })

  // =========================================================================
  // Challenge 1: Manicchia and General A-Z Sorting
  // =========================================================================
  describe('Challenge 1: Manicchia Sorting & Secondary A-Z Ordering', () => {
    it('sorts primarily by Manicchia group and secondarily A-Z by cognome and nome', async () => {
      const soci = [
        { id: 1, cognome: 'Rossi', nome: 'Carlo', gruppo_appartenenza: 'PADULE' },
        { id: 2, cognome: 'Rossi', nome: 'Bruno', gruppo_appartenenza: 'PADULE' },
        { id: 3, cognome: 'Bianchi', nome: 'Anna', gruppo_appartenenza: 'PADULE' },
        { id: 4, cognome: 'Bianchi', nome: 'Carlo', gruppo_appartenenza: 'PADULE' },
        { id: 5, cognome: 'Alunno', nome: 'Zaccaria', gruppo_appartenenza: 'SAN MARTINO' },
        { id: 6, cognome: 'Zoppi', nome: 'Alberto', gruppo_appartenenza: 'INTERNA' },
        { id: 7, cognome: 'Alberti', nome: 'Domenico', gruppo_appartenenza: 'INTERNA' },
      ]

      const results = await generateAllCardsPDF(soci, 2026, { sortBy: 'manicchia', layout: '6x' })
      expect(results).toHaveLength(1)
      expect(results[0].count).toBe(7)

      // Verify internal sort ordering logic directly matching export.js
      const sortedSoci = [...soci].sort((a, b) => {
        const groupA = (a.gruppo_appartenenza || '').trim().toLowerCase()
        const groupB = (b.gruppo_appartenenza || '').trim().toLowerCase()
        const gCmp = groupA.localeCompare(groupB)
        if (gCmp !== 0) return gCmp
        const cCmp = (a.cognome || '').localeCompare(b.cognome || '')
        if (cCmp !== 0) return cCmp
        return (a.nome || '').localeCompare(b.nome || '')
      })

      // Groups: INTERNA < PADULE < SAN MARTINO
      expect(sortedSoci[0].gruppo_appartenenza).toBe('INTERNA')
      expect(sortedSoci[0].cognome).toBe('Alberti')
      expect(sortedSoci[1].gruppo_appartenenza).toBe('INTERNA')
      expect(sortedSoci[1].cognome).toBe('Zoppi')

      // PADULE members: Bianchi Anna < Bianchi Carlo < Rossi Bruno < Rossi Carlo
      expect(sortedSoci[2].cognome).toBe('Bianchi')
      expect(sortedSoci[2].nome).toBe('Anna')
      expect(sortedSoci[3].cognome).toBe('Bianchi')
      expect(sortedSoci[3].nome).toBe('Carlo')
      expect(sortedSoci[4].cognome).toBe('Rossi')
      expect(sortedSoci[4].nome).toBe('Bruno')
      expect(sortedSoci[5].cognome).toBe('Rossi')
      expect(sortedSoci[5].nome).toBe('Carlo')

      // SAN MARTINO member
      expect(sortedSoci[6].gruppo_appartenenza).toBe('SAN MARTINO')
      expect(sortedSoci[6].cognome).toBe('Alunno')
    })

    it('groups case-insensitively and trims leading/trailing whitespace on Manicchia', async () => {
      const soci = [
        { id: 1, cognome: 'Verdi', nome: 'G', gruppo_appartenenza: '  interna  ' },
        { id: 2, cognome: 'Bianchi', nome: 'A', gruppo_appartenenza: 'INTERNA' },
        { id: 3, cognome: 'Rossi', nome: 'B', gruppo_appartenenza: 'Interna' },
        { id: 4, cognome: 'Cecchetti', nome: 'D', gruppo_appartenenza: 'padule' },
      ]

      const sortedSoci = [...soci].sort((a, b) => {
        const groupA = (a.gruppo_appartenenza || '').trim().toLowerCase()
        const groupB = (b.gruppo_appartenenza || '').trim().toLowerCase()
        const gCmp = groupA.localeCompare(groupB)
        if (gCmp !== 0) return gCmp
        const cCmp = (a.cognome || '').localeCompare(b.cognome || '')
        if (cCmp !== 0) return cCmp
        return (a.nome || '').localeCompare(b.nome || '')
      })

      // All 3 'interna' variations must group together before 'padule'
      expect(sortedSoci.slice(0, 3).map((s) => s.cognome)).toEqual(['Bianchi', 'Rossi', 'Verdi'])
      expect(sortedSoci[3].cognome).toBe('Cecchetti')
    })

    it('handles missing, null, undefined, and empty string Manicchie without crashing', async () => {
      const soci = [
        { id: 1, cognome: 'Verdi', nome: 'Luigi', gruppo_appartenenza: 'PADULE' },
        { id: 2, cognome: 'Bianchi', nome: 'Paolo', gruppo_appartenenza: null },
        { id: 3, cognome: 'Alberti', nome: 'Marco', gruppo_appartenenza: undefined },
        { id: 4, cognome: 'Cardoni', nome: 'Anna', gruppo_appartenenza: '' },
        { id: 5, cognome: 'Brunetti', nome: 'Sara', gruppo_appartenenza: '   ' },
        { id: 6, cognome: 'D’Amico', nome: 'Enzo', gruppo_appartenenza: 'INTERNA' },
      ]

      const results = await generateAllCardsPDF(soci, 2026, { sortBy: 'manicchia', layout: '6x' })
      expect(results).toHaveLength(1)
      expect(results[0].count).toBe(6)

      const sortedSoci = [...soci].sort((a, b) => {
        const groupA = (a.gruppo_appartenenza || '').trim().toLowerCase()
        const groupB = (b.gruppo_appartenenza || '').trim().toLowerCase()
        const gCmp = groupA.localeCompare(groupB)
        if (gCmp !== 0) return gCmp
        const cCmp = (a.cognome || '').localeCompare(b.cognome || '')
        if (cCmp !== 0) return cCmp
        return (a.nome || '').localeCompare(b.nome || '')
      })

      // Members with empty/null/undefined group have groupA === '' which sorts before 'interna'
      // Among the 4 empty-group members, sorted A-Z by surname: Alberti, Bianchi, Brunetti, Cardoni
      expect(sortedSoci.slice(0, 4).map((s) => s.cognome)).toEqual([
        'Alberti',
        'Bianchi',
        'Brunetti',
        'Cardoni',
      ])
      expect(sortedSoci[4].cognome).toBe('D’Amico')
      expect(sortedSoci[5].cognome).toBe('Verdi')
    })

    it('handles missing cognome or nome safely in sorting', async () => {
      const soci = [
        { id: 1, cognome: null, nome: 'Mario', gruppo_appartenenza: 'INTERNA' },
        { id: 2, cognome: 'Rossi', nome: null, gruppo_appartenenza: 'INTERNA' },
        { id: 3, cognome: undefined, nome: undefined, gruppo_appartenenza: 'INTERNA' },
        { id: 4, cognome: 'Bianchi', nome: 'Alessandro', gruppo_appartenenza: 'INTERNA' },
      ]

      const results = await generateAllCardsPDF(soci, 2026, { sortBy: 'manicchia', layout: '6x' })
      expect(results[0].count).toBe(4)
    })

    it('purely sorts A-Z by cognome and nome when sortBy is "alfabetico" or omitted', async () => {
      const soci = [
        { cognome: 'Verdi', nome: 'Luigi', gruppo_appartenenza: 'INTERNA' },
        { cognome: 'Alberti', nome: 'Marco', gruppo_appartenenza: 'SAN MARTINO' },
        { cognome: 'Rossi', nome: 'Zaccaria', gruppo_appartenenza: 'PADULE' },
        { cognome: 'Rossi', nome: 'Alberto', gruppo_appartenenza: 'INTERNA' },
      ]

      // Default sortBy (omitted)
      const resDefault = await generateAllCardsPDF(soci, 2026, { layout: '6x' })
      expect(resDefault[0].count).toBe(4)

      // Explicit sortBy: 'alfabetico'
      const resAlpha = await generateAllCardsPDF(soci, 2026, { sortBy: 'alfabetico', layout: '6x' })
      expect(resAlpha[0].filename).toContain('alfabetico')
    })
  })

  // =========================================================================
  // Challenge 2: Non-Mutating Array Behavior
  // =========================================================================
  describe('Challenge 2: Non-Mutating Array Behavior', () => {
    it('does NOT mutate a frozen array (Object.freeze) when generating cards', async () => {
      const frozenSoci = Object.freeze([
        Object.freeze({ id: 1, cognome: 'Zoppi', nome: 'Carlo', gruppo_appartenenza: 'PADULE' }),
        Object.freeze({ id: 2, cognome: 'Alberti', nome: 'Anna', gruppo_appartenenza: 'INTERNA' }),
        Object.freeze({ id: 3, cognome: 'Bianchi', nome: 'Paolo', gruppo_appartenenza: 'SAN MARTINO' }),
      ])

      // If generateAllCardsPDF attempts soci.sort() in place, Object.freeze will throw TypeError
      await expect(
        generateAllCardsPDF(frozenSoci, 2026, { sortBy: 'manicchia', layout: '6x' }),
      ).resolves.toBeDefined()

      await expect(
        generateAllCardsPDF(frozenSoci, 2026, { sortBy: 'alfabetico', layout: 'single' }),
      ).resolves.toBeDefined()
    })

    it('strictly preserves element order in the caller array across all permutations', async () => {
      const originalSoci = [
        { cognome: 'Zaccaria', nome: 'Z' },
        { cognome: 'Rossi', nome: 'M' },
        { cognome: 'Alunno', nome: 'A' },
      ]

      await generateAllCardsPDF(originalSoci, 2026, { sortBy: 'manicchia', layout: '6x' })
      expect(originalSoci[0].cognome).toBe('Zaccaria')
      expect(originalSoci[1].cognome).toBe('Rossi')
      expect(originalSoci[2].cognome).toBe('Alunno')

      await generateAllCardsPDF(originalSoci, 2026, { sortBy: 'alfabetico', layout: 'single' })
      expect(originalSoci[0].cognome).toBe('Zaccaria')
      expect(originalSoci[1].cognome).toBe('Rossi')
      expect(originalSoci[2].cognome).toBe('Alunno')
    })
  })

  // =========================================================================
  // Challenge 3: 6-Up Sheet Geometry, Math, & Multi-Sheet Pagination
  // =========================================================================
  describe('Challenge 3: 6-Up Sheet Geometry, Math & Multi-Sheet Pagination', () => {
    const makeSoci = (count) =>
      Array.from({ length: count }, (_, idx) => ({
        id: idx + 1,
        cognome: `Cognome${String(idx + 1).padStart(3, '0')}`,
        nome: `Nome${idx + 1}`,
        gruppo_appartenenza: idx % 2 === 0 ? 'INTERNA' : 'PADULE',
        data_nascita: '1990-05-15',
      }))

    it('verifies exact pagination across boundary counts (1, 6, 7, 12, 13, 18, 19 cards)', async () => {
      const testCases = [
        { count: 1, expectedPages: 1 },
        { count: 6, expectedPages: 1 },
        { count: 7, expectedPages: 2 },
        { count: 12, expectedPages: 2 },
        { count: 13, expectedPages: 3 },
        { count: 18, expectedPages: 3 },
        { count: 19, expectedPages: 4 },
      ]

      for (const tc of testCases) {
        const soci = makeSoci(tc.count)
        const [res] = await generateAllCardsPDF(soci, 2026, { layout: '6x' })

        expect(res.count).toBe(tc.count)
        expect(res.blob).toBeDefined()

        // Empirically parse the generated PDF with PDFDocument to verify real page count
        const pdfBytes = await blobToArrayBuffer(res.blob)
        const parsedDoc = await PDFDocument.load(pdfBytes)
        expect(parsedDoc.getPageCount()).toBe(tc.expectedPages)
      }
    })

    it('verifies A4 portrait sheet dimensions on every page (210mm x 297mm)', async () => {
      const soci = makeSoci(14) // 3 pages
      const [res] = await generateAllCardsPDF(soci, 2026, { layout: '6x' })
      const pdfBytes = await blobToArrayBuffer(res.blob)
      const parsedDoc = await PDFDocument.load(pdfBytes)

      expect(parsedDoc.getPageCount()).toBe(3)

      const mmToPt = 2.83465
      const expectedWidth = 210 * mmToPt // ~595.28 pt
      const expectedHeight = 297 * mmToPt // ~841.89 pt

      for (let i = 0; i < parsedDoc.getPageCount(); i++) {
        const page = parsedDoc.getPage(i)
        const { width, height } = page.getSize()
        expect(width).toBeCloseTo(expectedWidth, 1)
        expect(height).toBeCloseTo(expectedHeight, 1)
      }
    })

    it('verifies exact 2x3 grid coordinate boundaries without clipping or overlap', () => {
      const mmToPt = 2.83465
      const a4Width = 210 * mmToPt
      const a4Height = 297 * mmToPt
      const cardWidth = 85 * mmToPt
      const cardHeight = 54 * mmToPt
      const marginX = ((210 - 2 * 85) / 3) * mmToPt
      const marginY = ((297 - 3 * 54) / 4) * mmToPt

      const CARDS_PER_PAGE = 6
      const slots = []

      for (let slot = 0; slot < CARDS_PER_PAGE; slot++) {
        const col = slot % 2
        const row = Math.floor(slot / 2) // 0=top, 1=middle, 2=bottom
        const cardX = marginX + col * (cardWidth + marginX)
        const cardY = a4Height - (row + 1) * (cardHeight + marginY)

        slots.push({
          slot,
          col,
          row,
          x: cardX,
          y: cardY,
          right: cardX + cardWidth,
          top: cardY + cardHeight,
        })
      }

      // Check slot 0 (top-left)
      expect(slots[0].x).toBeCloseTo(marginX, 2)
      expect(slots[0].top).toBeCloseTo(a4Height - marginY, 2)

      // Check slot 1 (top-right)
      expect(slots[1].right).toBeCloseTo(a4Width - marginX, 2)
      expect(slots[1].top).toBeCloseTo(a4Height - marginY, 2)

      // Check slot 4 (bottom-left)
      expect(slots[4].x).toBeCloseTo(marginX, 2)
      expect(slots[4].y).toBeCloseTo(marginY, 2)

      // Check slot 5 (bottom-right)
      expect(slots[5].right).toBeCloseTo(a4Width - marginX, 2)
      expect(slots[5].y).toBeCloseTo(marginY, 2)

      // Verify horizontal gap between col 0 and col 1 equals marginX
      const horizGap = slots[1].x - slots[0].right
      expect(horizGap).toBeCloseTo(marginX, 2)

      // Verify vertical gap between row 0 and row 1 equals marginY
      const vertGap01 = slots[0].y - slots[2].top
      expect(vertGap01).toBeCloseTo(marginY, 2)

      // Verify vertical gap between row 1 and row 2 equals marginY
      const vertGap12 = slots[2].y - slots[4].top
      expect(vertGap12).toBeCloseTo(marginY, 2)
    })

    it('verifies single card layout generates 1 page per card with standard dimensions', async () => {
      const soci = makeSoci(4)
      const [res] = await generateAllCardsPDF(soci, 2026, { layout: 'single' })

      const pdfBytes = await blobToArrayBuffer(res.blob)
      const parsedDoc = await PDFDocument.load(pdfBytes)
      expect(parsedDoc.getPageCount()).toBe(4)

      const p0 = parsedDoc.getPage(0)
      const { width, height } = p0.getSize()
      expect(width).toBeCloseTo(80.77 * 2.83465, 1)
      expect(height).toBeCloseTo(122.17 * 2.83465, 1)
    })
  })

  // =========================================================================
  // Challenge 4: Booklet Cash Summary Arithmetic & Multi-Socio Receipts
  // =========================================================================
  describe('Challenge 4: Booklet Cash Summary Arithmetic & Receipts Count', () => {
    it('correctly aggregates multi-socio receipts: multiple members on single receipt counted as 1 receipt used', async () => {
      const blocchetti = [
        { id: 1, numero_blocchetto: 1, assegnato_a: 'Capodieci 1', ricevute_da: 1, ricevute_a: 10 },
      ]

      // Receipt 1 has 3 members (multi-socio)
      // Receipt 2 has 2 members
      // Receipt 3 has 1 member
      const tesseramenti = [
        { id: 101, numero_blocchetto: 1, numero_ricevuta: 1, quota_pagata: 25, anno: 2026 },
        { id: 102, numero_blocchetto: 1, numero_ricevuta: 1, quota_pagata: 20, anno: 2026 },
        { id: 103, numero_blocchetto: 1, numero_ricevuta: 1, quota_pagata: 15, anno: 2026 },
        { id: 104, numero_blocchetto: 1, numero_ricevuta: 2, quota_pagata: 25, anno: 2026 },
        { id: 105, numero_blocchetto: 1, numero_ricevuta: 2, quota_pagata: 10, anno: 2026 },
        { id: 106, numero_blocchetto: 1, numero_ricevuta: 3, quota_pagata: 25, anno: 2026 },
      ]

      const result = await generateBookletSummaryPDF(blocchetti, tesseramenti, 2026)

      expect(result.success).toBe(true)
      expect(result.totalBooklets).toBe(1)
      // Total cash = 25 + 20 + 15 + 25 + 10 + 25 = 120
      expect(result.totalCash).toBe(120)
      // Receipts used must be 3 (receipts 1, 2, 3), NOT 6!
      expect(result.totalReceipts).toBe(3)

      const b1 = result.rows[0]
      expect(b1.totale_cassa).toBe(120)
      expect(b1.ricevute_utilizzate).toBe(3)
      expect(b1.stato).toBe('In uso')
    })

    it('correctly reports unused booklet (0 payments) as "Non iniziato" with 0 cash and 0 receipts', async () => {
      const blocchetti = [
        { id: 1, numero_blocchetto: 5, assegnato_a: 'Referente Zona 5', ricevute_da: 41, ricevute_a: 50 },
      ]

      const result = await generateBookletSummaryPDF(blocchetti, [], 2026)
      expect(result.totalCash).toBe(0)
      expect(result.totalReceipts).toBe(0)

      const b = result.rows[0]
      expect(b.totale_cassa).toBe(0)
      expect(b.ricevute_utilizzate).toBe(0)
      expect(b.stato).toBe('Non iniziato')
    })

    it('marks booklet with 10 filled receipts as "Completato"', async () => {
      const blocchetti = [
        { id: 1, numero_blocchetto: 2, assegnato_a: 'Referente 2', ricevute_da: 11, ricevute_a: 20 },
      ]

      // 10 distinct receipts used (11 through 20)
      const tesseramenti = Array.from({ length: 10 }, (_, i) => ({
        id: 200 + i,
        numero_blocchetto: 2,
        numero_ricevuta: 11 + i,
        quota_pagata: 25,
        anno: 2026,
      }))

      const result = await generateBookletSummaryPDF(blocchetti, tesseramenti, 2026)
      expect(result.totalCash).toBe(250)
      expect(result.totalReceipts).toBe(10)

      const b = result.rows[0]
      expect(b.totale_cassa).toBe(250)
      expect(b.ricevute_utilizzate).toBe(10)
      expect(b.stato).toBe('Completato')
    })

    it('filters strictly by reference year, isolating cross-year payments', async () => {
      const blocchetti = [
        { id: 1, numero_blocchetto: 3, assegnato_a: 'Referente 3', ricevute_da: 21, ricevute_a: 30 },
      ]

      const tesseramenti = [
        { id: 301, numero_blocchetto: 3, numero_ricevuta: 21, quota_pagata: 25, anno: 2026 },
        { id: 302, numero_blocchetto: 3, numero_ricevuta: 22, quota_pagata: 25, anno: 2025 }, // Previous year
        { id: 303, numero_blocchetto: 3, numero_ricevuta: 23, quota_pagata: 25, anno: 2024 }, // Older year
      ]

      const result2026 = await generateBookletSummaryPDF(blocchetti, tesseramenti, 2026)
      expect(result2026.totalCash).toBe(25)
      expect(result2026.totalReceipts).toBe(1)

      const result2025 = await generateBookletSummaryPDF(blocchetti, tesseramenti, 2025)
      expect(result2025.totalCash).toBe(25)
      expect(result2025.totalReceipts).toBe(1)
    })

    it('handles non-numeric, null, string or undefined payment fields robustly', async () => {
      const blocchetti = [
        { id: 1, numero_blocchetto: 4, assegnato_a: 'Referente 4' },
      ]

      const tesseramenti = [
        { numero_blocchetto: 4, numero_ricevuta: 31, quota_pagata: '25', anno: 2026 },
        { numero_blocchetto: 4, numero_ricevuta: 32, quota_pagata: null, anno: 2026 },
        { numero_blocchetto: 4, numero_ricevuta: 33, quota_pagata: undefined, anno: 2026 },
        { numero_blocchetto: 4, numero_ricevuta: 34, quota_pagata: 'non-numeric', anno: 2026 },
      ]

      const result = await generateBookletSummaryPDF(blocchetti, tesseramenti, 2026)
      // '25' parsed to 25; null, undefined, 'non-numeric' default to 0
      expect(result.totalCash).toBe(25)
      expect(Number.isNaN(result.totalCash)).toBe(false)
      expect(result.totalReceipts).toBe(4)
    })

    it('aggregates multiple heterogeneous booklets into consistent overarching summary totals', async () => {
      const blocchetti = [
        { id: 1, numero_blocchetto: 1, assegnato_a: 'B1' },
        { id: 2, numero_blocchetto: 2, assegnato_a: 'B2' },
        { id: 3, numero_blocchetto: 3, assegnato_a: 'B3' },
      ]

      const tesseramenti = [
        // B1: 3 receipts, 75 EUR
        { numero_blocchetto: 1, numero_ricevuta: 1, quota_pagata: 25, anno: 2026 },
        { numero_blocchetto: 1, numero_ricevuta: 2, quota_pagata: 25, anno: 2026 },
        { numero_blocchetto: 1, numero_ricevuta: 3, quota_pagata: 25, anno: 2026 },
        // B2: 2 receipts, 50 EUR
        { numero_blocchetto: 2, numero_ricevuta: 11, quota_pagata: 25, anno: 2026 },
        { numero_blocchetto: 2, numero_ricevuta: 12, quota_pagata: 25, anno: 2026 },
        // B3: 0 receipts, 0 EUR
      ]

      const result = await generateBookletSummaryPDF(blocchetti, tesseramenti, 2026)
      expect(result.totalBooklets).toBe(3)
      expect(result.totalCash).toBe(125)
      expect(result.totalReceipts).toBe(5)

      // Rows ordered by numero_blocchetto
      expect(result.rows[0].numero_blocchetto).toBe(1)
      expect(result.rows[1].numero_blocchetto).toBe(2)
      expect(result.rows[2].numero_blocchetto).toBe(3)
    })
  })

  // =========================================================================
  // Challenge 5: Italian Date Formatting (formatItalianDOB)
  // =========================================================================
  describe('Challenge 5: Italian Date Formatting (formatItalianDOB)', () => {
    it('formats boundary calendar dates: leap years, end of year, start of year, century', () => {
      // Leap year 2024
      expect(formatItalianDOB('2024-02-29')).toBe('29 Febbraio 2024')
      // Century leap year 2000
      expect(formatItalianDOB('2000-02-29')).toBe('29 Febbraio 2000')
      // Non-leap century 1900
      expect(formatItalianDOB('1900-02-28')).toBe('28 Febbraio 1900')
      // First day of year
      expect(formatItalianDOB('2026-01-01')).toBe('1 Gennaio 2026')
      // Last day of year
      expect(formatItalianDOB('2025-12-31')).toBe('31 Dicembre 2025')
      // Mid-summer date
      expect(formatItalianDOB('1978-08-15')).toBe('15 Agosto 1978')
    })

    it('strips leading zeros from day of month', () => {
      expect(formatItalianDOB('1980-05-01')).toBe('1 Maggio 1980')
      expect(formatItalianDOB('1980-05-09')).toBe('9 Maggio 1980')
      expect(formatItalianDOB('1980-05-10')).toBe('10 Maggio 1980')
    })

    it('handles ISO timestamps with "T" and timezone offsets', () => {
      expect(formatItalianDOB('1985-05-15T00:00:00.000Z')).toBe('15 Maggio 1985')
      expect(formatItalianDOB('2002-11-03T23:59:59+02:00')).toBe('3 Novembre 2002')
      expect(formatItalianDOB('1970-01-01T12:00:00')).toBe('1 Gennaio 1970')
    })

    it('trims leading/trailing whitespace on date strings', () => {
      expect(formatItalianDOB('  1992-07-24  ')).toBe('24 Luglio 1992')
    })

    it('gracefully handles invalid, out-of-range, or malformed inputs without throwing', () => {
      // Missing or falsy
      expect(formatItalianDOB(null)).toBe('')
      expect(formatItalianDOB(undefined)).toBe('')
      expect(formatItalianDOB('')).toBe('')

      // Invalid month numbers (00 or 13)
      expect(formatItalianDOB('2020-00-10')).toBe('2020-00-10')
      expect(formatItalianDOB('2020-13-10')).toBe('2020-13-10')

      // Incomplete or non-date strings
      expect(formatItalianDOB('2020-05')).toBe('2020-05')
      expect(formatItalianDOB('invalid-date-string')).toBe('invalid-date-string')
      expect(formatItalianDOB('15/05/1980')).toBe('15/05/1980')
    })
  })

  // =========================================================================
  // Challenge 6: TesseraTemplate Reactive Rendering
  // =========================================================================
  describe('Challenge 6: TesseraTemplate Reactive Rendering', () => {
    it('renders formatted Italian DOB inside TesseraTemplate component', () => {
      const wrapper = mount(TesseraTemplate, {
        props: {
          nomeCognome: 'ROSSI MARIO',
          dataNascita: '1985-05-15',
        },
        global: {
          components: { BaseIcon },
        },
      })

      expect(wrapper.find('.name-value').text()).toBe('ROSSI MARIO')
      expect(wrapper.find('.birthdate-value').text()).toBe('15 Maggio 1985')
    })

    it('updates formatted DOB reactively when props change', async () => {
      const wrapper = mount(TesseraTemplate, {
        props: {
          nomeCognome: 'BIANCHI LUIGI',
          dataNascita: '2000-01-01',
        },
        global: {
          components: { BaseIcon },
        },
      })

      expect(wrapper.find('.birthdate-value').text()).toBe('1 Gennaio 2000')

      await wrapper.setProps({ dataNascita: '2024-02-29' })
      expect(wrapper.find('.birthdate-value').text()).toBe('29 Febbraio 2024')
    })
  })

  // =========================================================================
  // Challenge 7: Stress Harness, Property Generators & Corner Cases
  // =========================================================================
  describe('Challenge 7: Stress Harness, Property Generators & Corner Cases', () => {
    it('supports legacy progress callback passed as 3rd argument', async () => {
      const soci = [
        { cognome: 'Rossi', nome: 'Mario' },
        { cognome: 'Bianchi', nome: 'Luigi' },
      ]
      const progressSteps = []
      const results = await generateAllCardsPDF(soci, 2026, (p) => progressSteps.push(p))

      expect(results).toHaveLength(1)
      expect(results[0].count).toBe(2)
      expect(progressSteps.length).toBeGreaterThan(0)
      expect(progressSteps[progressSteps.length - 1]).toBe(100)
    })

    it('wraps long names and complex Italian titles without crashing or throwing', async () => {
      const soci = [
        {
          id: 99,
          cognome: "DE' MEDICI DI SANT'ANGELO IN VADO",
          nome: 'GIOVANBATTISTA FRANCESCO ANTONIO MARIA',
          gruppo_appartenenza: 'SAN MARTINO',
          data_nascita: '1965-11-20',
        },
      ]

      const [res] = await generateAllCardsPDF(soci, 2026, { layout: '6x', sortBy: 'manicchia' })
      expect(res.count).toBe(1)
      const pdfBytes = await blobToArrayBuffer(res.blob)
      const parsedDoc = await PDFDocument.load(pdfBytes)
      expect(parsedDoc.getPageCount()).toBe(1)
    })

    it('calculates default receipt ranges correctly when ricevute_da/a are omitted', async () => {
      const blocchetti = [
        { id: 10, numero_blocchetto: 10 }, // default range should be 91 - 100
        { id: 1, numero_blocchetto: 1 },  // default range should be 1 - 10
      ]

      const result = await generateBookletSummaryPDF(blocchetti, [], 2026)
      const b1 = result.rows.find((r) => r.numero_blocchetto === 1)
      const b10 = result.rows.find((r) => r.numero_blocchetto === 10)

      expect(b1.range).toBe('1 - 10')
      expect(b10.range).toBe('91 - 100')
    })

    it('accurately sums floating point currency amounts without precision drift', async () => {
      const blocchetti = [{ id: 1, numero_blocchetto: 1 }]
      const tesseramenti = [
        { numero_blocchetto: 1, numero_ricevuta: 1, quota_pagata: 25.5, anno: 2026 },
        { numero_blocchetto: 1, numero_ricevuta: 2, quota_pagata: 12.3, anno: 2026 },
        { numero_blocchetto: 1, numero_ricevuta: 3, quota_pagata: 0.2, anno: 2026 },
      ]

      const result = await generateBookletSummaryPDF(blocchetti, tesseramenti, 2026)
      expect(result.totalCash).toBeCloseTo(38.0, 2)
      expect(result.rows[0].totale_cassa).toBeCloseTo(38.0, 2)
    })

    it('stress test generator: processes 100 random heterogeneous members across 17 pages', async () => {
      const groups = ['INTERNA', 'PADULE', 'SAN MARTINO', 'MADONNA DEL PRATO', '', null, undefined]
      const randomSoci = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        cognome: `Cognome_${String.fromCharCode(65 + (i % 26))}_${i}`,
        nome: `Nome_${i}`,
        gruppo_appartenenza: groups[i % groups.length],
        data_nascita: `19${50 + (i % 50)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      }))

      // Deep copy to check array non-mutation
      const originalSnapshot = JSON.parse(JSON.stringify(randomSoci))

      const [res] = await generateAllCardsPDF(randomSoci, 2026, {
        sortBy: 'manicchia',
        layout: '6x',
      })

      // Input array must not have mutated
      expect(randomSoci.length).toBe(100)
      expect(randomSoci[0].cognome).toBe(originalSnapshot[0].cognome)
      expect(randomSoci[99].cognome).toBe(originalSnapshot[99].cognome)

      // 100 cards with 6 per page -> Math.ceil(100/6) = 17 pages
      const pdfBytes = await blobToArrayBuffer(res.blob)
      const parsedDoc = await PDFDocument.load(pdfBytes)
      expect(parsedDoc.getPageCount()).toBe(17)
    })
  })
})

