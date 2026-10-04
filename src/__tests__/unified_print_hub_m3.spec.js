import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import process from 'node:process'
import { nextTick } from 'vue'
import router from '@/router'
import BaseIcon from '@/components/common/BaseIcon.vue'
import {
  formatItalianDOB,
  generateAllCardsPDF,
  generateBookletSummaryPDF,
} from '@/services/export'
import { generateBetaDynamicPDF } from '@/services/exportBeta'
import ReportsView from '@/views/ReportsView.vue'

// Mock toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}))



// Mock db calls for ReportsView
const { mockSoci, mockBlocchetti } = vi.hoisted(() => {
  return {
    mockSoci: [
      {
        id: 1,
        cognome: 'Bianchi',
        nome: 'Alessandro',
        data_nascita: '1985-05-15',
        gruppo_appartenenza: 'INTERNA',
        tesseramenti: [
          { id: 101, anno: 2026, quota_pagata: 25, numero_ricevuta: 1, numero_blocchetto: 1 },
          { id: 102, anno: 2025, quota_pagata: 20, numero_ricevuta: 1, numero_blocchetto: 1 },
        ],
      },
      {
        id: 2,
        cognome: 'Rossi',
        nome: 'Mario',
        data_nascita: '2010-08-20',
        gruppo_appartenenza: 'PADULE',
        tesseramenti: [
          { id: 103, anno: 2026, quota_pagata: 10, numero_ricevuta: 2, numero_blocchetto: 1 },
        ],
      },
      {
        id: 3,
        cognome: 'Verdi',
        nome: 'Giuseppe',
        data_nascita: '1970-01-01',
        gruppo_appartenenza: 'SAN MARTINO',
        tesseramenti: [
          { id: 104, anno: 2020, quota_pagata: 20, numero_ricevuta: 5, numero_blocchetto: 2 },
        ],
      },
    ],
    mockBlocchetti: [
      {
        id: 1,
        numero_blocchetto: 1,
        anno: 2026,
        assegnatario: 'Mario Rossi',
        ricevuta_da: 1,
        ricevuta_a: 50,
        attivo: true,
      },
      {
        id: 2,
        numero_blocchetto: 2,
        anno: 2026,
        assegnatario: 'Luigi Gubbiotti',
        ricevuta_da: 51,
        ricevuta_a: 100,
        attivo: true,
      },
    ],
  }
})

vi.mock('@/services/db', () => ({
  getAllSociWithTesseramenti: vi.fn().mockResolvedValue(mockSoci),
  getUniqueGroups: vi.fn().mockResolvedValue(['INTERNA', 'PADULE', 'SAN MARTINO']),
  getSetting: vi.fn().mockResolvedValue(null),
  getAllBlocchetti: vi.fn().mockResolvedValue(mockBlocchetti),
  exportAllTesseramenti: vi.fn().mockResolvedValue([
    { id: 101, anno: 2026, quota_pagata: 25, numero_ricevuta: 1, numero_blocchetto: 1 },
    { id: 102, anno: 2025, quota_pagata: 20, numero_ricevuta: 1, numero_blocchetto: 1 },
    { id: 103, anno: 2026, quota_pagata: 10, numero_ricevuta: 2, numero_blocchetto: 1 },
  ]),
  getNewMembersByYear: vi.fn().mockResolvedValue([]),
  getCompletePaymentList: vi.fn().mockResolvedValue([]),
  getMembersByGroup: vi.fn().mockResolvedValue([]),
  getGroupCountsForYear: vi.fn().mockResolvedValue([]),
  getChurnList: vi.fn().mockResolvedValue([]),
  getDemographicStats: vi.fn().mockResolvedValue({ total: 3 }),
  getEconomicStats: vi.fn().mockResolvedValue({ totalRevenue: 35 }),
  getDataAuditStats: vi.fn().mockResolvedValue({ summary: { total_issues: 0 } }),
  getVotingEligibleMembers: vi.fn().mockResolvedValue([]),
  getActiveMembersLast5Years: vi.fn().mockResolvedValue([]),
  getQuotaAuditList: vi.fn().mockResolvedValue([]),
  isDatabaseEmpty: vi.fn().mockResolvedValue(false),
}))

// Mock URL.createObjectURL and revokeObjectURL
if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
}
if (!globalThis.URL.revokeObjectURL) {
  globalThis.URL.revokeObjectURL = vi.fn()
}

describe('Milestone 3: Unified Print Hub & Membership Cards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

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

  // -------------------------------------------------------------
  // 1. ROUTER REDIRECT
  // -------------------------------------------------------------
  describe('1. Router Redirect Contract (R2)', () => {
    it('redirects /reports-beta to /reports', () => {
      const route = router.getRoutes().find((r) => r.path === '/reports-beta')
      expect(route).toBeDefined()
      expect(route.redirect).toBe('/reports')
    })
  })

  // -------------------------------------------------------------
  // 2. CANONICAL DATE FORMATTING (formatItalianDOB)
  // -------------------------------------------------------------
  describe('2. Canonical Date Formatting (formatItalianDOB - R3)', () => {
    it('formats ISO dates into Italian uppercase month strings', () => {
      expect(formatItalianDOB('1985-05-15')).toBe('15 Maggio 1985')
      expect(formatItalianDOB('2000-01-01')).toBe('1 Gennaio 2000')
      expect(formatItalianDOB('1990-12-31')).toBe('31 Dicembre 1990')
      expect(formatItalianDOB('2010-08-05')).toBe('5 Agosto 2010')
    })

    it('handles all 12 calendar months properly', () => {
      const expectedMonths = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
      ]
      expectedMonths.forEach((m, idx) => {
        const monthNum = String(idx + 1).padStart(2, '0')
        const formatted = formatItalianDOB(`2026-${monthNum}-10`)
        expect(formatted).toBe(`10 ${m} 2026`)
      })
    })

    it('gracefully handles missing, falsy, or invalid dates', () => {
      expect(formatItalianDOB(null)).toBe('')
      expect(formatItalianDOB(undefined)).toBe('')
      expect(formatItalianDOB('')).toBe('')
      expect(formatItalianDOB('not-a-date')).toBe('not-a-date')
    })
  })

  // -------------------------------------------------------------
  // 3. CARD GENERATION CONTRACTS (generateAllCardsPDF)
  // -------------------------------------------------------------
  describe('3. Card Generation Contracts (generateAllCardsPDF - R3)', () => {
    it('does not mutate the source array of members during sorting', async () => {
      const originalSoci = [
        { cognome: 'Verdi', nome: 'B', gruppo_appartenenza: 'SAN MARTINO' },
        { cognome: 'Bianchi', nome: 'A', gruppo_appartenenza: 'INTERNA' },
        { cognome: 'Rossi', nome: 'C', gruppo_appartenenza: 'PADULE' },
      ]
      const sociCopy = [...originalSoci]

      await generateAllCardsPDF(sociCopy, 2026, { sortBy: 'manicchia', layout: '6x' })

      // Check original array order wasn't mutated in-place
      expect(sociCopy[0].cognome).toBe('Verdi')
      expect(sociCopy[1].cognome).toBe('Bianchi')
      expect(sociCopy[2].cognome).toBe('Rossi')
    })

    it('supports sortBy: "manicchia" and layout: "6x"', async () => {
      const soci = [
        { id: 1, cognome: 'Zaccaria', nome: 'A', gruppo_appartenenza: 'PADULE' },
        { id: 2, cognome: 'Albertini', nome: 'B', gruppo_appartenenza: 'INTERNA' },
        { id: 3, cognome: 'Bernardi', nome: 'C', gruppo_appartenenza: 'INTERNA' },
      ]
      const progressTracker = []
      const results = await generateAllCardsPDF(
        soci,
        2026,
        { sortBy: 'manicchia', layout: '6x' },
        (progress) => progressTracker.push(progress),
      )

      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].filename).toContain('tessere')
      expect(results[0].filename).toContain('2026')
      expect(progressTracker.length).toBeGreaterThan(0)
      expect(progressTracker[progressTracker.length - 1]).toBe(100)
    })

    it('supports sortBy: "alfabetico"', async () => {
      const soci = [
        { id: 1, cognome: 'Rossi', nome: 'Mario', gruppo_appartenenza: 'PADULE' },
        { id: 2, cognome: 'Bianchi', nome: 'Alessandro', gruppo_appartenenza: 'INTERNA' },
      ]
      const results = await generateAllCardsPDF(soci, 2026, { sortBy: 'alfabetico', layout: '6x' })
      expect(results).toBeInstanceOf(Array)
      expect(results[0].count).toBe(2)
    })
  })

  // -------------------------------------------------------------
  // 4. RESOCONTO CASSA BLOCCHETTI (generateBookletSummaryPDF)
  // -------------------------------------------------------------
  describe('4. Resoconto Cassa Blocchetti (generateBookletSummaryPDF - R2)', () => {
    it('aggregates booklet payments, receipts count, and total cash', async () => {
      const tesseramenti = [
        { numero_blocchetto: 1, numero_ricevuta: 1, quota_pagata: 25, anno: 2026 },
        { numero_blocchetto: 1, numero_ricevuta: 2, quota_pagata: 10, anno: 2026 },
        { numero_blocchetto: 2, numero_ricevuta: 51, quota_pagata: 20, anno: 2026 },
        { numero_blocchetto: 1, numero_ricevuta: 3, quota_pagata: 25, anno: 2025 }, // Different year
      ]

      const result = await generateBookletSummaryPDF(mockBlocchetti, tesseramenti, 2026)

      expect(result.success).toBe(true)
      expect(result.year).toBe(2026)
      expect(result.filename).toContain('resoconto_cassa_blocchetti_2026')
      expect(result.totalCash).toBe(55) // 25 + 10 + 20
      expect(result.totalReceipts).toBe(3)
      expect(result.rows).toHaveLength(2)

      // Booklet 1: 35 EUR, 2 receipts
      const b1 = result.rows.find((r) => r.numero_blocchetto === 1)
      expect(b1.totale_cassa).toBe(35)
      expect(b1.ricevute_utilizzate).toBe(2)

      // Booklet 2: 20 EUR, 1 receipt
      const b2 = result.rows.find((r) => r.numero_blocchetto === 2)
      expect(b2.totale_cassa).toBe(20)
      expect(b2.ricevute_utilizzate).toBe(1)
    })

    it('handles empty blocchetti and tesseramenti gracefully', async () => {
      const result = await generateBookletSummaryPDF([], [], 2026)
      expect(result.success).toBe(true)
      expect(result.totalCash).toBe(0)
      expect(result.totalReceipts).toBe(0)
      expect(result.rows).toEqual([])
    })
  })

  // -------------------------------------------------------------
  // 5. PDF LAB DYNAMIC COLUMN ORDERING (generateBetaDynamicPDF)
  // -------------------------------------------------------------
  describe('5. PDF Lab Dynamic Column Ordering (generateBetaDynamicPDF - R2)', () => {
    it('dynamically adapts table headers and row cells to reportConfig.display.baseColumns order', async () => {
      const members = [
        {
          id: 1,
          cognome: 'Bianchi',
          nome: 'Alessandro',
          gruppo_appartenenza: 'INTERNA',
          data_nascita: '1985-05-15',
          aventeDiritto: 'si',
          dirittoLabel: 'Sì',
          motivoEsclusione: '',
          tesseramenti: [{ anno: 2026 }],
        },
      ]

      // Config with custom reversed order: firma, eta, cognomeNome
      const reportConfig = {
        title: 'Test Dynamic Ordering',
        filters: { groups: [] },
        display: {
          baseColumns: ['firma', 'eta', 'cognomeNome'],
          yearColumns: [2026],
        },
      }

      const result = await generateBetaDynamicPDF(members, reportConfig, 'Test Filters')
      expect(result.success).toBe(true)
      expect(result.filename).toBeDefined()
    })
  })

  // -------------------------------------------------------------
  // 6. REPORTS VIEW COMPONENT INTEGRATION
  // -------------------------------------------------------------
  describe('6. ReportsView Component Integration (R2, R3)', () => {
    it('renders the 4 quick foreground 1-click print buttons', async () => {
      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: {
            TesseraTemplate: true,
            AgeCategoryFilter: true,
            'router-link': true,
          },
        },
      })

      await nextTick()

      const text = wrapper.text()
      expect(text).toContain('Rinnovi con Arretrati')
      expect(text).toContain('Ceraioli da Sollecitare')
      expect(text).toContain('Fogli Tessere 6x')
      expect(text).toContain('Resoconto Cassa Blocchetti')
      expect(text).toContain('PDF Lab')
    })

    it('contains Manicchia vs A-Z sorting selector for cards 6x', async () => {
      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: {
            TesseraTemplate: true,
            AgeCategoryFilter: true,
            'router-link': true,
          },
        },
      })

      await nextTick()

      const select = wrapper.find('#cardSortOrder')
      expect(select.exists()).toBe(true)
      expect(select.element.value).toBe('manicchia')

      await select.setValue('alfabetico')
      expect(select.element.value).toBe('alfabetico')
    })

    it('toggles PDF Lab accordion expansion and collapses on toggle click', async () => {
      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: {
            TesseraTemplate: true,
            AgeCategoryFilter: true,
            'router-link': true,
          },
        },
      })

      await nextTick()

      const accordionHeader = wrapper.find('.pdf-lab-header')
      expect(accordionHeader.exists()).toBe(true)

      const toggleBtn = wrapper.find('.accordion-toggle-btn')
      expect(toggleBtn.attributes('aria-expanded')).toBe('false')

      // Click to open
      await accordionHeader.trigger('click')
      expect(toggleBtn.attributes('aria-expanded')).toBe('true')

      // Click to close
      await accordionHeader.trigger('click')
      expect(toggleBtn.attributes('aria-expanded')).toBe('false')
    })

    it('persists and loads presets to both pdf_lab_presets and reports_beta_presets in localStorage', async () => {
      const testPreset = [
        {
          name: 'Vista Assemblea',
          state: {
            filters: { onlyActiveMembers: true, groups: ['INTERNA'] },
            display: { baseColumns: ['cognomeNome', 'gruppo'] },
          },
        },
      ]
      localStorage.setItem('reports_beta_presets', JSON.stringify(testPreset))

      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: {
            TesseraTemplate: true,
            AgeCategoryFilter: true,
            'router-link': true,
          },
        },
      })

      await nextTick()

      // Open PDF Lab to inspect presets chip
      await wrapper.find('.pdf-lab-header').trigger('click')
      await nextTick()

      expect(wrapper.text()).toContain('Vista Assemblea')
    })
  })

  // -------------------------------------------------------------
  // 7. ZERO RAW EMOJI COMPLIANCE
  // -------------------------------------------------------------
  describe('7. Zero Raw Emoji Compliance Audit (R5 Integrity)', () => {
    it('guarantees 0 raw emojis in all M3 modified source files', () => {
      const filesToAudit = [
        'src/router/index.js',
        'src/services/export.js',
        'src/services/exportBeta.js',
        'src/components/TesseraTemplate.vue',
        'src/views/ReportsView.vue',
      ]

      const emojiPattern = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u

      filesToAudit.forEach((relPath) => {
        const fullPath = resolve(process.cwd(), relPath)
        const fileContent = readFileSync(fullPath, 'utf8')
        const lines = fileContent.split('\n')
        const offendingLines = []

        lines.forEach((line, idx) => {
          if (emojiPattern.test(line)) {
            offendingLines.push(`Line ${idx + 1}: ${line.trim()}`)
          }
        })

        expect(
          offendingLines,
          `File ${relPath} must not contain raw emojis! Found: ${offendingLines.join('; ')}`,
        ).toEqual([])
      })
    })
  })
})
