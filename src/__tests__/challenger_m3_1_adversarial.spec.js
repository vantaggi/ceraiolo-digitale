import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import ReportsView from '@/views/ReportsView.vue'
import {
  generateBetaDynamicPDF,
} from '@/services/exportBeta'
import {
  generateAllCardsPDF,
  generateBookletSummaryPDF,
  generateRenewalListPDF,
  generateChurnPDF,
} from '@/services/export'

// -------------------------------------------------------------
// TOAST & SERVICES MOCKING (Hoisted State)
// -------------------------------------------------------------
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast,
}))

const dbState = vi.hoisted(() => ({
  dynamicSoci: [],
  dynamicBlocchetti: [],
  dynamicTesseramenti: [],
  dynamicChurnList: [],
}))

vi.mock('@/services/db', () => ({
  getAllSociWithTesseramenti: vi.fn(() => Promise.resolve(dbState.dynamicSoci)),
  getUniqueGroups: vi.fn(() => Promise.resolve(['INTERNA', 'PADULE', 'SAN MARTINO'])),
  getSetting: vi.fn(() => Promise.resolve(null)),
  getAllBlocchetti: vi.fn(() => Promise.resolve(dbState.dynamicBlocchetti)),
  exportAllTesseramenti: vi.fn(() => Promise.resolve(dbState.dynamicTesseramenti)),
  getChurnList: vi.fn(() => Promise.resolve(dbState.dynamicChurnList)),
  getNewMembersByYear: vi.fn(() => Promise.resolve([])),
  getCompletePaymentList: vi.fn(() => Promise.resolve([])),
  getMembersByGroup: vi.fn(() => Promise.resolve([])),
  getGroupCountsForYear: vi.fn(() => Promise.resolve([])),
  getDemographicStats: vi.fn(() => Promise.resolve({ total: 10 })),
  getEconomicStats: vi.fn(() => Promise.resolve({ totalRevenue: 100 })),
  getDataAuditStats: vi.fn(() => Promise.resolve({ summary: { total_issues: 0 } })),
  getVotingEligibleMembers: vi.fn(() => Promise.resolve([])),
  getActiveMembersLast5Years: vi.fn(() => Promise.resolve([])),
  getQuotaAuditList: vi.fn(() => Promise.resolve([])),
  isDatabaseEmpty: vi.fn(() => Promise.resolve(false)),
}))

// Mock export services with spy delegation to real implementations
vi.mock('@/services/export', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    generateRenewalListPDF: vi.fn((...args) => actual.generateRenewalListPDF(...args)),
    generateChurnPDF: vi.fn((...args) => actual.generateChurnPDF(...args)),
    generateAllCardsPDF: vi.fn((...args) => actual.generateAllCardsPDF(...args)),
    generateBookletSummaryPDF: vi.fn((...args) => actual.generateBookletSummaryPDF(...args)),
  }
})

vi.mock('@/services/exportBeta', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    generateBetaDynamicPDF: vi.fn((...args) => actual.generateBetaDynamicPDF(...args)),
  }
})

// Setup URL and Canvas mocks
if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
}
if (!globalThis.URL.revokeObjectURL) {
  globalThis.URL.revokeObjectURL = vi.fn()
}

describe('Challenger M3-1: Empirical & Adversarial Stress Test Suite', () => {
  let originalPrompt
  let originalConfirm

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    dbState.dynamicSoci = []
    dbState.dynamicBlocchetti = []
    dbState.dynamicTesseramenti = []
    dbState.dynamicChurnList = []

    originalPrompt = globalThis.prompt
    originalConfirm = globalThis.confirm

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

  afterEach(() => {
    globalThis.prompt = originalPrompt
    globalThis.confirm = originalConfirm
  })

  // =============================================================
  // 1. DYNAMIC QUERY BUILDER AND/OR LOGIC STRESS-TEST
  // =============================================================
  describe('1. Dynamic Query Builder AND/OR Logic Stress-Test', () => {
    it('1.1 rigorously distinguishes AND vs OR across non-consecutive multi-year payment patterns', async () => {
      // 5 Members with specific payment profiles
      dbState.dynamicSoci = [
        {
          id: 1,
          cognome: 'Saltamerenda',
          nome: 'Luigi',
          data_nascita: '1985-05-15',
          gruppo_appartenenza: 'INTERNA',
          tesseramenti: [
            { anno: 2023, quota_pagata: 20 },
            { anno: 2025, quota_pagata: 20 }, // Paid year 1 and 3, skipped 2024 and 2026
          ],
        },
        {
          id: 2,
          cognome: 'Ubaldi',
          nome: 'Giacomo',
          data_nascita: '1990-01-01',
          gruppo_appartenenza: 'INTERNA',
          tesseramenti: [
            { anno: 2023, quota_pagata: 20 },
            { anno: 2024, quota_pagata: 20 },
            { anno: 2025, quota_pagata: 20 }, // Paid all 3 years
          ],
        },
        {
          id: 3,
          cognome: 'Bettelli',
          nome: 'Francesco',
          data_nascita: '1992-03-10',
          gruppo_appartenenza: 'PADULE',
          tesseramenti: [
            { anno: 2024, quota_pagata: 20 },
            { anno: 2025, quota_pagata: 20 }, // Paid year 2 and 3, skipped 2023
          ],
        },
        {
          id: 4,
          cognome: 'Minelli',
          nome: 'Pietro',
          data_nascita: '2012-05-01', // Minor
          gruppo_appartenenza: 'SAN MARTINO',
          tesseramenti: [
            { anno: 2026, quota_pagata: 25 }, // Paid only 2026
          ],
        },
        {
          id: 5,
          cognome: 'Fiorucci',
          nome: 'Antonio',
          data_nascita: '1970-11-20',
          gruppo_appartenenza: 'INTERNA',
          tesseramenti: [], // Never paid
        },
      ]

      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()
      await wrapper.find('.pdf-lab-header').trigger('click')
      await nextTick()

      // Case A: Query [2023, 2025] with AND logic
      wrapper.vm.reportState.filters.paymentYears.list = [2023, 2025]
      wrapper.vm.reportState.filters.paymentYears.logic = 'AND'
      await nextTick()

      const andResults = wrapper.vm.processedData
      const andIds = andResults.map((m) => m.id)
      expect(andIds).toContain(1) // Saltamerenda: has 2023 & 2025
      expect(andIds).toContain(2) // Ubaldi: has 2023, 2024, 2025
      expect(andIds).not.toContain(3) // Bettelli: missing 2023 -> MUST NOT MATCH AND
      expect(andIds).not.toContain(4) // Minelli: missing both
      expect(andIds).not.toContain(5) // Fiorucci: missing both
      expect(andResults).toHaveLength(2)

      // Case B: Query [2023, 2025] with OR logic
      wrapper.vm.reportState.filters.paymentYears.logic = 'OR'
      await nextTick()

      const orResults = wrapper.vm.processedData
      const orIds = orResults.map((m) => m.id)
      expect(orIds).toContain(1) // Saltamerenda: has both -> matches OR
      expect(orIds).toContain(2) // Ubaldi: has both -> matches OR
      expect(orIds).toContain(3) // Bettelli: has 2025 -> matches OR
      expect(orIds).not.toContain(4) // Minelli: neither
      expect(orIds).not.toContain(5) // Fiorucci: neither
      expect(orResults).toHaveLength(3)

      // Case C: Query [2023, 2024, 2025] with AND logic
      wrapper.vm.reportState.filters.paymentYears.list = [2023, 2024, 2025]
      wrapper.vm.reportState.filters.paymentYears.logic = 'AND'
      await nextTick()

      const strictAndResults = wrapper.vm.processedData
      expect(strictAndResults).toHaveLength(1)
      expect(strictAndResults[0].id).toBe(2) // ONLY Ubaldi paid all three

      // Case D: Query [2024, 2026] with OR logic
      wrapper.vm.reportState.filters.paymentYears.list = [2024, 2026]
      wrapper.vm.reportState.filters.paymentYears.logic = 'OR'
      await nextTick()

      const or24_26 = wrapper.vm.processedData.map((m) => m.id)
      expect(or24_26).toContain(2) // has 2024
      expect(or24_26).toContain(3) // has 2024
      expect(or24_26).toContain(4) // has 2026
      expect(or24_26).not.toContain(1) // paid only 2023, 2025 -> neither
      expect(or24_26).not.toContain(5)
      expect(or24_26).toHaveLength(3)
    })

    it('1.2 stress-tests mathematical power set of 16 payment combinations across 4 calendar years', async () => {
      // Generate 16 members corresponding to binary masks 0b0000 to 0b1111 for years [2023, 2024, 2025, 2026]
      const years = [2023, 2024, 2025, 2026]
      dbState.dynamicSoci = Array.from({ length: 16 }, (_, mask) => {
        const tesseramenti = []
        years.forEach((yr, bit) => {
          if ((mask & (1 << bit)) !== 0) {
            tesseramenti.push({ anno: yr, quota_pagata: 20 })
          }
        })
        return {
          id: mask,
          cognome: `Cognome_${mask.toString(2).padStart(4, '0')}`,
          nome: `Nome_${mask}`,
          data_nascita: '1980-01-01',
          gruppo_appartenenza: 'INTERNA',
          tesseramenti,
        }
      })

      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()

      // Empty payment list should pass all 16 members
      wrapper.vm.reportState.filters.paymentYears.list = []
      await nextTick()
      expect(wrapper.vm.processedData).toHaveLength(16)

      // Query years [2023, 2025] (bits 0 and 2 must be set)
      // Masks with bit 0 and bit 2 set: 0b0101 (5), 0b0111 (7), 0b1101 (13), 0b1111 (15) -> Exactly 4
      wrapper.vm.reportState.filters.paymentYears.list = [2023, 2025]
      wrapper.vm.reportState.filters.paymentYears.logic = 'AND'
      await nextTick()

      const and4 = wrapper.vm.processedData.map((m) => m.id)
      expect(and4.sort((a, b) => a - b)).toEqual([5, 7, 13, 15])

      // Under OR: Masks with bit 0 OR bit 2 set -> Total 16 - (neither bit 0 nor bit 2)
      // Neither bit 0 nor bit 2: masks where (mask & 5) === 0 -> 0, 2, 8, 10 (4 masks)
      // Surviving masks = 16 - 4 = 12
      wrapper.vm.reportState.filters.paymentYears.logic = 'OR'
      await nextTick()

      const or12 = wrapper.vm.processedData.map((m) => m.id)
      expect(or12).toHaveLength(12)
      expect(or12).not.toContain(0)
      expect(or12).not.toContain(2)
      expect(or12).not.toContain(8)
      expect(or12).not.toContain(10)
    })

    it('1.3 handles disjoint and nonexistent payment query years gracefully', async () => {
      dbState.dynamicSoci = [
        {
          id: 10,
          cognome: 'Test',
          nome: 'A',
          data_nascita: '1990-01-01',
          tesseramenti: [{ anno: 2025 }],
        },
      ]

      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()

      // Query a year that nobody paid (e.g. 1999)
      wrapper.vm.reportState.filters.paymentYears.list = [1999]
      wrapper.vm.reportState.filters.paymentYears.logic = 'AND'
      await nextTick()
      expect(wrapper.vm.processedData).toHaveLength(0)

      wrapper.vm.reportState.filters.paymentYears.logic = 'OR'
      await nextTick()
      expect(wrapper.vm.processedData).toHaveLength(0)

      // Query 1999 OR 2025 -> Member paid 2025 survives
      wrapper.vm.reportState.filters.paymentYears.list = [1999, 2025]
      wrapper.vm.reportState.filters.paymentYears.logic = 'OR'
      await nextTick()
      expect(wrapper.vm.processedData).toHaveLength(1)
    })

    it('1.4 survives adversarial member payloads: undefined/null tesseramenti, duplicates, and missing dates', async () => {
      dbState.dynamicSoci = [
        {
          id: 21,
          cognome: 'Nullo',
          nome: 'SenzaTesseramenti',
          data_nascita: null,
          tesseramenti: null, // Adversarial null
        },
        {
          id: 22,
          cognome: 'Indefinito',
          nome: 'SenzaArray',
          data_nascita: 'not-a-valid-date', // Adversarial malformed date
          tesseramenti: undefined, // Adversarial undefined
        },
        {
          id: 23,
          cognome: 'Doppio',
          nome: 'PagamentoDuplicato',
          data_nascita: '1985-05-15',
          tesseramenti: [
            { anno: 2024, quota_pagata: 20 },
            { anno: 2024, quota_pagata: 20 }, // Duplicate payment entry
          ],
        },
      ]

      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()

      wrapper.vm.reportState.filters.paymentYears.list = [2024]
      wrapper.vm.reportState.filters.paymentYears.logic = 'AND'
      await nextTick()

      // Should not throw; only member 23 should be returned without duplicates
      const results = wrapper.vm.processedData
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe(23)
    })

    it('1.5 verifies compound multi-dimensional filtering across 5 orthogonal criteria', async () => {
      // Setup 4 distinct members to test intersection
      dbState.dynamicSoci = [
        // Member 1: Interna, Adult, Paid 2026 (in regola), Paid 2024
        {
          id: 31,
          cognome: 'A_Regolare',
          nome: 'Mario',
          data_nascita: '1985-01-01',
          gruppo_appartenenza: 'INTERNA',
          tesseramenti: [{ anno: 2024 }, { anno: 2026 }],
        },
        // Member 2: Interna, Minor (born 2015), Moroso 2026, Paid 2024 & 2025
        {
          id: 32,
          cognome: 'B_Minorenne',
          nome: 'Luigi',
          data_nascita: '2015-06-01',
          gruppo_appartenenza: 'INTERNA',
          tesseramenti: [{ anno: 2024 }, { anno: 2025 }],
        },
        // Member 3: Padule, Adult, Moroso 2026, Paid 2024 & 2025
        {
          id: 33,
          cognome: 'C_Padule',
          nome: 'Giuseppe',
          data_nascita: '1988-03-01',
          gruppo_appartenenza: 'PADULE',
          tesseramenti: [{ anno: 2024 }, { anno: 2025 }],
        },
        // Member 4: Interna, Adult, Moroso 2026, Paid 2024 & 2025 (THE EXACT MATCH)
        {
          id: 34,
          cognome: 'D_Bersaglio',
          nome: 'Antonio',
          data_nascita: '1982-12-12',
          gruppo_appartenenza: 'INTERNA',
          tesseramenti: [{ anno: 2024 }, { anno: 2025 }],
        },
      ]

      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()

      // Compound filter criteria:
      // 1. Group: INTERNA
      // 2. Age: maggiorenni
      // 3. PaymentStatus: morosi (for 2026)
      // 4. PaymentYears: [2024, 2025] AND
      // 5. OnlyActiveMembers: true
      wrapper.vm.renewalYear = 2026
      wrapper.vm.reportState.filters.groups = ['INTERNA']
      wrapper.vm.reportState.filters.ageGroup = 'maggiorenni'
      wrapper.vm.reportState.filters.paymentStatus = 'morosi'
      wrapper.vm.reportState.filters.paymentYears.list = [2024, 2025]
      wrapper.vm.reportState.filters.paymentYears.logic = 'AND'
      wrapper.vm.reportState.filters.onlyActiveMembers = true
      await nextTick()

      const surviving = wrapper.vm.processedData
      expect(surviving).toHaveLength(1)
      expect(surviving[0].id).toBe(34)
      expect(surviving[0].cognome).toBe('D_Bersaglio')
    })
  })

  // =============================================================
  // 2. COLUMN SELECTION, REORDERING & PROJECTION STRESS-TEST
  // =============================================================
  describe('2. Column Selection, Reordering & Live Projection Stress-Test', () => {
    it('2.1 validates boundary constraints and no-op guards on moveColumn', async () => {
      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()

      wrapper.vm.reportState.display.baseColumns = ['cognomeNome', 'gruppo', 'dataNascita']
      const originalCols = [...wrapper.vm.reportState.display.baseColumns]

      // Left boundary violation: index 0 with direction -1
      wrapper.vm.moveColumn(0, -1)
      expect(wrapper.vm.reportState.display.baseColumns).toEqual(originalCols)

      // Right boundary violation: index 2 with direction 1
      wrapper.vm.moveColumn(2, 1)
      expect(wrapper.vm.reportState.display.baseColumns).toEqual(originalCols)

      // Negative index violation
      wrapper.vm.moveColumn(-5, -1)
      expect(wrapper.vm.reportState.display.baseColumns).toEqual(originalCols)

      // Extreme index violation
      wrapper.vm.moveColumn(100, 1)
      expect(wrapper.vm.reportState.display.baseColumns).toEqual(originalCols)

      // Valid swaps
      wrapper.vm.moveColumn(1, 1) // Swap 'gruppo' and 'dataNascita'
      expect(wrapper.vm.reportState.display.baseColumns).toEqual(['cognomeNome', 'dataNascita', 'gruppo'])

      wrapper.vm.moveColumn(1, -1) // Swap back
      expect(wrapper.vm.reportState.display.baseColumns).toEqual(['dataNascita', 'cognomeNome', 'gruppo'])
    })

    it('2.2 rigorously verifies that reordered columns reorder both <th> and <td> cells in preview DOM', async () => {
      dbState.dynamicSoci = [
        {
          id: 40,
          cognome: 'Ceraiolo',
          nome: 'Federico',
          data_nascita: '1985-05-15',
          gruppo_appartenenza: 'SAN MARTINO',
          tesseramenti: [{ anno: 2026, quota_pagata: 25 }],
        },
      ]

      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()

      // Expand PDF Lab
      await wrapper.find('.pdf-lab-header').trigger('click')
      await nextTick()

      // Configure custom order: firma, eta, cognomeNome, gruppo
      wrapper.vm.reportState.display.baseColumns = ['firma', 'eta', 'cognomeNome', 'gruppo']
      wrapper.vm.reportState.display.yearColumns = [2026]
      await nextTick()

      // Verify Headers order
      const ths = wrapper.findAll('.preview-table thead th')
      expect(ths).toHaveLength(5) // 4 base + 1 year
      expect(ths[0].text()).toBe('Firma')
      expect(ths[1].text()).toBe('Età')
      expect(ths[2].text()).toBe('Socio')
      expect(ths[3].text()).toBe('Manicchia')
      expect(ths[4].text()).toBe('2026')

      // Verify Data Row Cells match the reordered columns exactly
      const tds = wrapper.findAll('.preview-table tbody tr td')
      expect(tds).toHaveLength(5)

      // Cell 0: Firma -> contains empty signature line span
      expect(tds[0].find('.signature-line-blank').exists()).toBe(true)

      // Cell 1: Età -> contains age badge
      expect(tds[1].text()).toBe('Maggiorenne')

      // Cell 2: Socio -> contains member name
      expect(tds[2].text()).toContain('Ceraiolo')
      expect(tds[2].text()).toContain('Federico')

      // Cell 3: Manicchia -> contains group
      expect(tds[3].text()).toBe('SAN MARTINO')

      // Cell 4: Year 2026 -> contains paid badge 'V'
      expect(tds[4].text()).toBe('V')
    })

    it('2.3 verifies dynamic PDF engine adapts to arbitrary column permutations and handles extreme batches', async () => {
      const members = [
        {
          id: 51,
          cognome: "D'Antoni",
          nome: 'Niccolò',
          gruppo_appartenenza: 'INTERNA',
          data_nascita: '1995-10-10',
          aventeDiritto: 'si',
          dirittoLabel: 'Sì',
          motivoEsclusione: '',
          tesseramenti: [{ anno: 2024 }, { anno: 2025 }, { anno: 2026 }],
        },
      ]

      // Permutation: all 7 base columns reversed + 3 year columns
      const reportConfig = {
        title: 'Adversarial Dynamic Report',
        filters: { groups: ['INTERNA'] },
        display: {
          baseColumns: [
            'firma',
            'motivoEsclusione',
            'dirittoVoto',
            'eta',
            'dataNascita',
            'gruppo',
            'cognomeNome',
          ],
          yearColumns: [2024, 2025, 2026],
        },
      }

      const result = await generateBetaDynamicPDF(members, reportConfig, 'Adversarial Filters')
      expect(result.success).toBe(true)
      expect(result.filename).toBeDefined()
      expect(result.doc).toBeDefined()

      // Extreme edge cases for engine:
      // 1. Empty members array
      const emptyResult = await generateBetaDynamicPDF([], reportConfig, 'Empty Data')
      expect(emptyResult.success).toBe(true)

      // 2. Empty baseColumns with only year columns
      const yearOnlyConfig = {
        ...reportConfig,
        display: { baseColumns: [], yearColumns: [2026] },
      }
      const yearOnlyResult = await generateBetaDynamicPDF(members, yearOnlyConfig, 'Year Only')
      expect(yearOnlyResult.success).toBe(true)

      // 3. Batch stress: 50 members generated dynamically
      const batchMembers = Array.from({ length: 50 }, (_, i) => ({
        id: 100 + i,
        cognome: `Cognome_${i}`,
        nome: `Nome_${i}`,
        gruppo_appartenenza: i % 2 === 0 ? 'INTERNA' : 'PADULE',
        data_nascita: '1980-01-01',
        aventeDiritto: i % 3 === 0 ? 'regolarizza' : 'si',
        dirittoLabel: i % 3 === 0 ? 'Regolarizza' : 'Sì',
        motivoEsclusione: i % 3 === 0 ? 'Mancano quote: 2025' : '',
        tesseramenti: [{ anno: 2026 }],
      }))
      const batchResult = await generateBetaDynamicPDF(batchMembers, reportConfig, '50 Members Batch')
      expect(batchResult.success).toBe(true)
    })
  })

  // =============================================================
  // 3. 4 QUICK FOREGROUND 1-CLICK PRINT BUTTONS STRESS-TEST
  // =============================================================
  describe('3. 4 Quick Foreground 1-Click Print Buttons Stress-Test', () => {
    it('3.1 Quick 1: Rinnovi con Arretrati passes parameters and handles DB/PDF exceptions', async () => {
      dbState.dynamicSoci = [
        { id: 1, cognome: 'Test', nome: 'A', tesseramenti: [{ anno: 2025 }] },
      ]

      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()

      wrapper.vm.renewalYear = 2026
      await nextTick()

      // Successful invocation
      await wrapper.vm.generateRenewalList()
      expect(generateRenewalListPDF).toHaveBeenCalledWith(dbState.dynamicSoci, 2026)
      expect(mockToast.success).toHaveBeenCalledWith('PDF Lista Rinnovi generato con successo!')
      expect(wrapper.vm.loading).toBe(false)

      // Guard: missing renewalYear
      vi.clearAllMocks()
      wrapper.vm.renewalYear = null
      await nextTick()
      await wrapper.vm.generateRenewalList()
      expect(generateRenewalListPDF).not.toHaveBeenCalled()

      // Failure recovery: service throws error
      wrapper.vm.renewalYear = 2026
      generateRenewalListPDF.mockRejectedValueOnce(new Error('PDF generation crashed'))
      await wrapper.vm.generateRenewalList()
      expect(mockToast.error).toHaveBeenCalledWith('Errore nella generazione del PDF: PDF generation crashed')
      expect(wrapper.vm.loading).toBe(false)
    })

    it('3.2 Quick 2: Ceraioli da Sollecitare handles empty lists, non-empty batches, and error returns', async () => {
      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()

      wrapper.vm.renewalYear = 2026
      await nextTick()

      // Case A: Churn list is empty -> toasts success, does NOT call generateChurnPDF
      dbState.dynamicChurnList = []
      await wrapper.vm.generateChurnReport()
      expect(mockToast.success).toHaveBeenCalledWith(
        'Nessun socio da recuperare per il 2026! (Tutti hanno pagato o sono nuovi)',
      )
      expect(generateChurnPDF).not.toHaveBeenCalled()
      expect(wrapper.vm.loading).toBe(false)

      // Case B: Churn list has members -> calls generateChurnPDF
      dbState.dynamicChurnList = [{ id: 60, cognome: 'Moroso', nome: 'B' }]
      generateChurnPDF.mockResolvedValueOnce({ success: true, count: 1 })
      await wrapper.vm.generateChurnReport()
      expect(generateChurnPDF).toHaveBeenCalledWith(dbState.dynamicChurnList, 2026)
      expect(mockToast.success).toHaveBeenCalledWith('Lista Recupero generata! (1 soci da contattare)')
      expect(wrapper.vm.loading).toBe(false)

      // Case C: generateChurnPDF returns failure { success: false, error: '...' }
      generateChurnPDF.mockResolvedValueOnce({ success: false, error: 'Database locked' })
      await wrapper.vm.generateChurnReport()
      expect(mockToast.error).toHaveBeenCalledWith('Errore: Database locked')
      expect(wrapper.vm.loading).toBe(false)
    })

    it('3.3 Quick 3: Fogli Tessere 6x propagates sortBy (manicchia/alfabetico), inactive filter, and layout', async () => {
      // 1 Active member, 1 Inactive member (>5 years since last payment)
      dbState.dynamicSoci = [
        {
          id: 71,
          cognome: 'Attivo',
          nome: 'A',
          gruppo_appartenenza: 'PADULE',
          tesseramenti: [{ anno: 2026, quota_pagata: 25 }],
        },
        {
          id: 72,
          cognome: 'Inattivo',
          nome: 'B',
          gruppo_appartenenza: 'INTERNA',
          tesseramenti: [{ anno: 2018, quota_pagata: 20 }], // Last payment 2018 (>5 years ago)
        },
      ]

      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()

      wrapper.vm.renewalYear = 2026
      wrapper.vm.cardSortBy = 'manicchia'
      wrapper.vm.excludeInactiveMembers = true
      await nextTick()

      // Invocation with excludeInactiveMembers = true
      await wrapper.vm.generateCards6x()
      expect(generateAllCardsPDF).toHaveBeenCalledWith(
        [dbState.dynamicSoci[0]], // Only the active member
        2026,
        { sortBy: 'manicchia', layout: '6x' },
        expect.any(Function),
      )
      expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('per manicchia'))
      expect(wrapper.vm.loading).toBe(false)

      // Invocation with excludeInactiveMembers = false and sortBy = 'alfabetico'
      vi.clearAllMocks()
      wrapper.vm.cardSortBy = 'alfabetico'
      wrapper.vm.excludeInactiveMembers = false
      await nextTick()

      await wrapper.vm.generateCards6x()
      expect(generateAllCardsPDF).toHaveBeenCalledWith(
        dbState.dynamicSoci, // Both members
        2026,
        { sortBy: 'alfabetico', layout: '6x' },
        expect.any(Function),
      )
      expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('in ordine alfabetico'))
      expect(wrapper.vm.loading).toBe(false)
    })

    it('3.4 Quick 4: Resoconto Cassa Blocchetti aggregates parallel DB calls and handles errors', async () => {
      dbState.dynamicBlocchetti = [
        { id: 1, numero_blocchetto: 1, assegnato_a: 'Mario', ricevute_da: 1, ricevute_a: 50 },
      ]
      dbState.dynamicTesseramenti = [
        { numero_blocchetto: 1, numero_ricevuta: 1, quota_pagata: 25, anno: 2026 },
      ]

      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()

      wrapper.vm.renewalYear = 2026
      await nextTick()

      // Successful booklet summary call
      await wrapper.vm.generateBookletSummary()
      expect(generateBookletSummaryPDF).toHaveBeenCalledWith(dbState.dynamicBlocchetti, dbState.dynamicTesseramenti, 2026)
      expect(mockToast.success).toHaveBeenCalledWith(
        "Resoconto Cassa generato con successo per l'anno 2026!",
      )
      expect(wrapper.vm.loading).toBe(false)

      // Failure return from service
      generateBookletSummaryPDF.mockResolvedValueOnce({ success: false, error: 'Aggregation timeout' })
      await wrapper.vm.generateBookletSummary()
      expect(mockToast.error).toHaveBeenCalledWith('Errore generazione resoconto cassa: Aggregation timeout')
      expect(wrapper.vm.loading).toBe(false)
    })
  })

  // =============================================================
  // 4. PRESET PERSISTENCE, FALLBACK & SERIALIZATION STRESS-TEST
  // =============================================================
  describe('4. Preset Persistence, Fallback & Serialization Stress-Test', () => {
    it('4.1 resolves presets with proper fallback hierarchy (pdf_lab_presets > reports_beta_presets > empty)', async () => {
      // Scenario A: pdf_lab_presets exists
      const primaryPresets = [{ name: 'Primary Preset', state: { filters: {}, display: {} } }]
      localStorage.setItem('pdf_lab_presets', JSON.stringify(primaryPresets))

      let wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()
      expect(wrapper.vm.savedPresets).toHaveLength(1)
      expect(wrapper.vm.savedPresets[0].name).toBe('Primary Preset')

      // Scenario B: pdf_lab_presets missing, fallback to legacy reports_beta_presets
      localStorage.clear()
      const legacyPresets = [{ name: 'Legacy Beta Preset', state: { filters: {}, display: {} } }]
      localStorage.setItem('reports_beta_presets', JSON.stringify(legacyPresets))

      wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()
      expect(wrapper.vm.savedPresets).toHaveLength(1)
      expect(wrapper.vm.savedPresets[0].name).toBe('Legacy Beta Preset')

      // Scenario C: Corrupted JSON in localStorage does not crash mounting
      localStorage.clear()
      localStorage.setItem('pdf_lab_presets', '{"corrupted_json:[')

      wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()
      expect(wrapper.vm.savedPresets).toEqual([])
    })

    it('4.2 ensures saving presets writes dual copies to both storage keys and blocks empty names', async () => {
      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()

      // User cancels prompt (returns null)
      globalThis.prompt = vi.fn(() => null)
      wrapper.vm.savePreset()
      expect(wrapper.vm.savedPresets).toHaveLength(0)
      expect(localStorage.getItem('pdf_lab_presets')).toBeNull()

      // User enters empty/whitespace string
      globalThis.prompt = vi.fn(() => '   ')
      wrapper.vm.savePreset()
      expect(wrapper.vm.savedPresets).toHaveLength(0)

      // User enters valid name
      globalThis.prompt = vi.fn(() => '  Vista Elettorale 2026  ')
      wrapper.vm.reportState.filters.ageGroup = 'maggiorenni'
      wrapper.vm.reportState.display.baseColumns = ['cognomeNome', 'dirittoVoto']
      wrapper.vm.savePreset()

      expect(wrapper.vm.savedPresets).toHaveLength(1)
      expect(wrapper.vm.savedPresets[0].name).toBe('Vista Elettorale 2026')
      expect(wrapper.vm.savedPresets[0].state.filters.ageGroup).toBe('maggiorenni')

      // Check BOTH localStorage keys are synchronized with identical JSON
      const pdfLabStored = localStorage.getItem('pdf_lab_presets')
      const reportsBetaStored = localStorage.getItem('reports_beta_presets')
      expect(pdfLabStored).toBeDefined()
      expect(pdfLabStored).toBe(reportsBetaStored)

      const parsed = JSON.parse(pdfLabStored)
      expect(parsed[0].name).toBe('Vista Elettorale 2026')
      expect(parsed[0].state.display.baseColumns).toEqual(['cognomeNome', 'dirittoVoto'])
    })

    it('4.3 loads preset, preserves full reactivity, and accurately updates live preview computations', async () => {
      dbState.dynamicSoci = [
        {
          id: 81,
          cognome: 'Ubaldi',
          nome: 'Giacomo',
          data_nascita: '1990-01-01',
          gruppo_appartenenza: 'PADULE',
          tesseramenti: [{ anno: 2026 }],
        },
        {
          id: 82,
          cognome: 'Bianchi',
          nome: 'Luigi',
          data_nascita: '2015-01-01', // Minor
          gruppo_appartenenza: 'INTERNA',
          tesseramenti: [{ anno: 2026 }],
        },
      ]

      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()

      const targetPreset = {
        name: 'Solo Maggiorenni Padule',
        state: {
          filters: {
            onlyActiveMembers: false,
            groups: ['PADULE'],
            ageGroup: 'maggiorenni',
            paymentStatus: 'all',
            electionDate: '2026-09-11',
            electionEligibility: 'all',
            paymentYears: { list: [], logic: 'AND' },
          },
          display: {
            baseColumns: ['cognomeNome', 'gruppo'],
            yearColumns: [2026],
          },
          sort: { by: 'cognome', descending: false },
        },
      }

      // Load preset
      wrapper.vm.loadPreset(targetPreset)
      await nextTick()

      expect(mockToast.success).toHaveBeenCalledWith('Preset "Solo Maggiorenni Padule" caricato con successo!')
      expect(wrapper.vm.reportState.filters.groups).toEqual(['PADULE'])
      expect(wrapper.vm.reportState.filters.ageGroup).toBe('maggiorenni')

      // Verify that processedData reactively reflects the preset
      const filtered = wrapper.vm.processedData
      expect(filtered).toHaveLength(1)
      expect(filtered[0].cognome).toBe('Ubaldi')
      expect(filtered[0].gruppo_appartenenza).toBe('PADULE')
    })

    it('4.4 guards preset deletion behind confirmation dialog and synchronizes storage on confirm', async () => {
      const initialPresets = [
        { name: 'Preset 1', state: {} },
        { name: 'Preset 2', state: {} },
      ]
      localStorage.setItem('pdf_lab_presets', JSON.stringify(initialPresets))
      localStorage.setItem('reports_beta_presets', JSON.stringify(initialPresets))

      const wrapper = mount(ReportsView, {
        global: {
          components: { BaseIcon },
          stubs: { TesseraTemplate: true, AgeCategoryFilter: true, 'router-link': true },
        },
      })
      await flushPromises()
      expect(wrapper.vm.savedPresets).toHaveLength(2)

      // User cancels deletion (confirm returns false)
      globalThis.confirm = vi.fn(() => false)
      wrapper.vm.deletePreset(0)
      expect(wrapper.vm.savedPresets).toHaveLength(2)
      expect(JSON.parse(localStorage.getItem('pdf_lab_presets'))).toHaveLength(2)

      // User confirms deletion (confirm returns true)
      globalThis.confirm = vi.fn(() => true)
      wrapper.vm.deletePreset(0) // Delete Preset 1
      expect(wrapper.vm.savedPresets).toHaveLength(1)
      expect(wrapper.vm.savedPresets[0].name).toBe('Preset 2')

      // Check both keys synchronized with 1 item remaining
      const updatedPdfLab = JSON.parse(localStorage.getItem('pdf_lab_presets'))
      const updatedBeta = JSON.parse(localStorage.getItem('reports_beta_presets'))
      expect(updatedPdfLab).toHaveLength(1)
      expect(updatedPdfLab[0].name).toBe('Preset 2')
      expect(updatedBeta).toEqual(updatedPdfLab)
      expect(mockToast.info).toHaveBeenCalledWith('Preset eliminato')
    })
  })
})
