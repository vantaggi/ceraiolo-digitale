import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { nextTick } from 'vue'

import BatchEntryView from '../views/BatchEntryView.vue'
import BaseIcon from '../components/common/BaseIcon.vue'

// Mock vue-toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}))

// In-memory mock database state for Dexie simulation
let dbTesseramenti = []
let dbSoci = []

vi.mock('@/services/db', () => ({
  db: {
    open: vi.fn().mockResolvedValue(true),
    tesseramenti: {
      where: vi.fn((col) => ({
        equals: vi.fn((val) => ({
          toArray: vi.fn().mockImplementation(() =>
            Promise.resolve(dbTesseramenti.filter((t) => t[col] === val))
          ),
          and: vi.fn((fn) => ({
            toArray: vi.fn().mockImplementation(() =>
              Promise.resolve(dbTesseramenti.filter((t) => t[col] === val && fn(t)))
            ),
          })),
        })),
      })),
    },
    soci: {
      where: vi.fn(() => ({
        anyOf: vi.fn((ids) => ({
          toArray: vi.fn().mockImplementation(() =>
            Promise.resolve(dbSoci.filter((s) => ids.includes(s.id)))
          ),
        })),
      })),
    },
  },
  searchSoci: vi.fn((query) => {
    const q = (query || '').toLowerCase()
    return Promise.resolve(
      dbSoci.filter(
        (s) =>
          s.cognome.toLowerCase().includes(q) || s.nome.toLowerCase().includes(q)
      )
    )
  }),
  addSocio: vi.fn((socioData) => {
    const newId = dbSoci.length ? Math.max(...dbSoci.map((s) => s.id)) + 1 : 1
    const record = { id: newId, ...socioData }
    dbSoci.push(record)
    return Promise.resolve(newId)
  }),
  addTesseramento: vi.fn((tData) => {
    const newId = dbTesseramenti.length
      ? Math.max(...dbTesseramenti.map((t) => t.id || 0)) + 1
      : 1
    const record = { id: newId, ...tData }
    dbTesseramenti.push(record)
    return Promise.resolve(newId)
  }),
  getUniqueGroups: vi.fn().mockResolvedValue(['INTERNA', 'PADULE', 'SAN MARTINO']),
  addCustomGroup: vi.fn().mockResolvedValue(true),
  getArretrati: vi.fn().mockResolvedValue([]),
  findExistingPaymentYear: vi.fn((socioId, years) => {
    const existing = dbTesseramenti.find(
      (t) => t.id_socio === socioId && years.includes(t.anno)
    )
    return Promise.resolve(existing ? existing.anno : null)
  }),
  calculateAgeInYear: vi.fn((dob, year) => {
    if (!dob) return 30
    return year - new Date(dob).getFullYear()
  }),
  deleteTesseramentiByReceipt: vi.fn((socioId, receiptNumber, years) => {
    dbTesseramenti = dbTesseramenti.filter(
      (t) =>
        !(
          t.id_socio === socioId &&
          t.numero_ricevuta === receiptNumber &&
          (!years || years.includes(t.anno))
        )
    )
    return Promise.resolve(true)
  }),
  getSetting: vi.fn((key, def) => {
    if (key === 'receiptsPerBlock') return Promise.resolve(10)
    if (key === 'defaultQuota') return Promise.resolve(10.0)
    if (key === 'newMemberQuota') return Promise.resolve(25.0)
    return Promise.resolve(def)
  }),
}))

describe('Challenger M2-2: Adversarial & Empirical Stress Testing', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()

    dbSoci = [
      { id: 1, cognome: 'Rossi', nome: 'Mario', data_nascita: '1980-05-10', gruppo_appartenenza: 'INTERNA', data_prima_iscrizione: 2020 },
      { id: 2, cognome: 'Bianchi', nome: 'Luigi', data_nascita: '2012-08-15', gruppo_appartenenza: 'PADULE', data_prima_iscrizione: 2024 },
      { id: 3, cognome: 'Santantoniaro', nome: 'Giacomo', data_nascita: '1975-03-22', gruppo_appartenenza: 'SAN MARTINO', data_prima_iscrizione: 2026 },
    ]

    dbTesseramenti = [
      { id: 1, id_socio: 1, anno: 2026, quota_pagata: 10.0, numero_ricevuta: 1, numero_blocchetto: 1, data_pagamento: '2026-09-11' },
      { id: 2, id_socio: 2, anno: 2026, quota_pagata: 10.0, numero_ricevuta: 1, numero_blocchetto: 1, data_pagamento: '2026-09-11' },
      { id: 3, id_socio: 3, anno: 2026, quota_pagata: 25.0, numero_ricevuta: 2, numero_blocchetto: 1, data_pagamento: '2026-09-11' },
    ]
  })

  afterEach(() => {
    localStorage.clear()
  })

  // =========================================================================
  // Challenge 1: Zero-Emoji Verification & Icon Inventory
  // =========================================================================
  describe('Challenge 1: Zero-Emoji Verification & Icon Inventory', () => {
    it('verifies 100% absence of raw emojis across BatchEntryView.vue', () => {
      const filePath = resolve(process.cwd(), 'src/views/BatchEntryView.vue')
      const fileContent = readFileSync(filePath, 'utf-8')

      // Standard unicode emoji ranges
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u
      const match = fileContent.match(emojiRegex)
      expect(match).toBeNull()

      // Emoji Presentation property
      const emojiPresentationRegex = /\p{Emoji_Presentation}/gu
      const presentationMatches = [...fileContent.matchAll(emojiPresentationRegex)]
      expect(presentationMatches).toHaveLength(0)
    })

    it('validates that all BaseIcon names used in BatchEntryView exist and render cleanly', () => {
      const wrapper = mount(BatchEntryView, {
        global: {
          stubs: {
            ConfirmDeleteModal: true,
            ErrorModal: true,
            AddPaymentModal: true,
          },
          components: { BaseIcon },
        },
      })

      const icons = wrapper.findAllComponents(BaseIcon)
      expect(icons.length).toBeGreaterThan(15)

      // Ensure every rendered BaseIcon emits a valid SVG element without empty paths
      icons.forEach((iconComponent) => {
        const svg = iconComponent.find('svg')
        expect(svg.exists()).toBe(true)
        expect(svg.attributes('viewBox')).toBe('0 0 24 24')
        expect(svg.find('g').html()).not.toBe('<g></g>')
      })
    })

    it('adversarially investigates emojis in child modal components used by BatchEntryView', () => {
      // While BatchEntryView itself has 0 emojis, check if imported modals contain legacy emojis
      const confirmDeletePath = resolve(process.cwd(), 'src/components/ConfirmDeleteModal.vue')
      const addPaymentPath = resolve(process.cwd(), 'src/components/AddPaymentModal.vue')
      const errorModalPath = resolve(process.cwd(), 'src/components/ErrorModal.vue')

      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u

      let confirmDeleteEmojis = false
      if (existsSync(confirmDeletePath)) {
        confirmDeleteEmojis = emojiRegex.test(readFileSync(confirmDeletePath, 'utf-8'))
      }

      let addPaymentEmojis = false
      if (existsSync(addPaymentPath)) {
        addPaymentEmojis = emojiRegex.test(readFileSync(addPaymentPath, 'utf-8'))
      }

      let errorModalEmojis = false
      if (existsSync(errorModalPath)) {
        errorModalEmojis = emojiRegex.test(readFileSync(errorModalPath, 'utf-8'))
      }

      // EMPIRICAL VERIFICATION: Child modals (AddPaymentModal, ConfirmDeleteModal, ErrorModal)
      // have now been completely sanitized of legacy emojis using BaseIcon.
      expect(confirmDeleteEmojis).toBe(false)
      expect(addPaymentEmojis).toBe(false)
      expect(errorModalEmojis).toBe(false)
    })
  })

  // =========================================================================
  // Challenge 2: Table Styling, Row Height, Tabular-Nums & Accounting Ergonomics
  // =========================================================================
  describe('Challenge 2: Table Styling, Row Height, Tabular-Nums & Ergonomics', () => {
    it('verifies min-height: 52px on receipt rows and search result items in BatchEntryView CSS', () => {
      const filePath = resolve(process.cwd(), 'src/views/BatchEntryView.vue')
      const fileContent = readFileSync(filePath, 'utf-8')

      // Check min-height for .receipt-socio-card
      expect(fileContent).toMatch(/\.receipt-socio-card\s*\{[^}]*min-height:\s*52px/s)

      // Check min-height for .result-item
      expect(fileContent).toMatch(/\.result-item\s*\{[^}]*min-height:\s*52px/s)
    })

    it('verifies right-alignment and tabular-nums on all monetary and accounting amounts', () => {
      const filePath = resolve(process.cwd(), 'src/views/BatchEntryView.vue')
      const fileContent = readFileSync(filePath, 'utf-8')

      // .cash-amount: tabular-nums
      expect(fileContent).toMatch(/\.cash-amount\s*\{[^}]*font-variant-numeric:\s*tabular-nums/s)

      // .subtotal-amount: tabular-nums
      expect(fileContent).toMatch(/\.subtotal-amount\s*\{[^}]*font-variant-numeric:\s*tabular-nums/s)

      // .socio-fee: tabular-nums, right-aligned
      expect(fileContent).toMatch(/\.socio-fee\s*\{[^}]*font-variant-numeric:\s*tabular-nums/s)
      expect(fileContent).toMatch(/\.socio-fee\s*\{[^}]*text-align:\s*right/s)

      // .stat-value: tabular-nums
      expect(fileContent).toMatch(/\.stat-value\s*\{[^}]*font-variant-numeric:\s*tabular-nums/s)

      // .slot-receipt-num: tabular-nums
      expect(fileContent).toMatch(/\.slot-receipt-num\s*\{[^}]*font-variant-numeric:\s*tabular-nums/s)
    })

    it('verifies accounting alignment class in main.css enforces text-align: right !important', () => {
      const mainCss = readFileSync(resolve(process.cwd(), 'src/assets/main.css'), 'utf-8')
      expect(mainCss).toMatch(/\.tabular-nums[^}]*text-align:\s*right\s*!important/s)
      expect(mainCss).toMatch(/\.tabular-nums[^}]*font-variant-numeric:\s*tabular-nums/s)
    })

    it('adversarially analyzes alternating striping: card layout vs continuous table', () => {
      const filePath = resolve(process.cwd(), 'src/views/BatchEntryView.vue')
      const fileContent = readFileSync(filePath, 'utf-8')

      // In BatchEntryView, socio items are rendered as cards (.receipt-socio-card), not an HTML <table>
      const hasHtmlTable = /<table\b/i.test(fileContent)
      expect(hasHtmlTable).toBe(false)

      // Alternating striping (nth-child) is defined globally in main.css for <table>,
      // but .receipt-socio-card uses individual bordered cards with gap: 0.65rem
      const hasNthChildInView = /\.receipt-socio-card:nth-child/i.test(fileContent)
      expect(hasNthChildInView).toBe(false)
    })

    it('stress-tests multi-socio list with 10 members: checks subtotal and fee display precision', async () => {
      const wrapper = mount(BatchEntryView, {
        global: {
          stubs: {
            ConfirmDeleteModal: true,
            ErrorModal: true,
            AddPaymentModal: true,
          },
        },
      })

      await nextTick()

      // Inject 10 soci with fractional or varying fees
      const testSoci = Array.from({ length: 10 }, (_, i) => ({
        id: 100 + i,
        cognome: 'Cognome' + i,
        nome: 'Nome' + i,
        quota_pagata: 12.5,
        totale_versato: 12.5,
        anniPagati: [2026],
      }))

      wrapper.vm.currentReceipt.soci = testSoci
      await nextTick()

      // 10 * 12.5 = 125.00
      expect(wrapper.vm.receiptSubtotal).toBe(125.0)
      const subtotalEl = wrapper.find('.subtotal-amount')
      expect(subtotalEl.text()).toContain('125.00')

      const renderedCards = wrapper.findAll('.receipt-socio-card')
      expect(renderedCards).toHaveLength(10)

      renderedCards.forEach((card) => {
        const feeEl = card.find('.socio-fee')
        expect(feeEl.exists()).toBe(true)
        expect(feeEl.classes()).toContain('tabular-nums')
        expect(feeEl.text()).toContain('12.50')
      })
    })
  })

  // =========================================================================
  // Challenge 3: Session State Persistence (localStorage) Stress Testing
  // =========================================================================
  describe('Challenge 3: Session State Persistence (localStorage)', () => {
    it('initializes from clean state defaulting to current year, booklet 1, and today', async () => {
      localStorage.clear()
      const wrapper = mount(BatchEntryView, {
        global: {
          stubs: {
            ConfirmDeleteModal: true,
            ErrorModal: true,
            AddPaymentModal: true,
          },
        },
      })
      await flushPromises()

      const currentYear = new Date().getFullYear()
      const todayStr = new Date().toISOString().split('T')[0]

      expect(wrapper.vm.sessionData.annoRiferimento).toBe(currentYear)
      expect(wrapper.vm.sessionData.numeroBlocchetto).toBe(1)
      expect(wrapper.vm.sessionData.dataPagamento).toBe(todayStr)
    })

    it('persists and reloads session data from localStorage across page refreshes', async () => {
      const testSession = {
        annoRiferimento: 2025,
        numeroBlocchetto: 8,
        dataPagamento: '2025-05-15',
      }
      localStorage.setItem('ceraiolo_batch_session', JSON.stringify(testSession))

      const wrapper = mount(BatchEntryView, {
        global: {
          stubs: {
            ConfirmDeleteModal: true,
            ErrorModal: true,
            AddPaymentModal: true,
          },
        },
      })
      await flushPromises()

      expect(wrapper.vm.sessionData.annoRiferimento).toBe(2025)
      expect(wrapper.vm.sessionData.numeroBlocchetto).toBe(8)
      expect(wrapper.vm.sessionData.dataPagamento).toBe('2025-05-15')

      // Receipt number synchronizes to booklet 8 base receipt: (8 - 1) * 10 + 1 = 71
      expect(wrapper.vm.currentReceipt.numero).toBe(71)
    })

    it('synchronizes localStorage reactively when sessionData fields change', async () => {
      const wrapper = mount(BatchEntryView, {
        global: {
          stubs: {
            ConfirmDeleteModal: true,
            ErrorModal: true,
            AddPaymentModal: true,
          },
        },
      })

      wrapper.vm.sessionData.annoRiferimento = 2027
      await nextTick()

      let saved = JSON.parse(localStorage.getItem('ceraiolo_batch_session'))
      expect(saved.annoRiferimento).toBe(2027)

      wrapper.vm.sessionData.numeroBlocchetto = 4
      await nextTick()

      saved = JSON.parse(localStorage.getItem('ceraiolo_batch_session'))
      expect(saved.numeroBlocchetto).toBe(4)

      wrapper.vm.sessionData.dataPagamento = '2026-06-01'
      await nextTick()

      saved = JSON.parse(localStorage.getItem('ceraiolo_batch_session'))
      expect(saved.dataPagamento).toBe('2026-06-01')
    })

    it('adversarially stress-tests corrupt and adversarial localStorage payloads', () => {
      const currentYear = new Date().getFullYear()

      // 1. Broken JSON
      localStorage.setItem('ceraiolo_batch_session', '{{{ broken json invalid')
      let wrapper = mount(BatchEntryView, {
        global: { stubs: { ConfirmDeleteModal: true, ErrorModal: true, AddPaymentModal: true } },
      })
      expect(wrapper.vm.sessionData.annoRiferimento).toBe(currentYear)
      expect(wrapper.vm.sessionData.numeroBlocchetto).toBe(1)

      // 2. Missing or null fields
      localStorage.setItem(
        'ceraiolo_batch_session',
        JSON.stringify({ annoRiferimento: null, numeroBlocchetto: undefined, dataPagamento: '' })
      )
      wrapper = mount(BatchEntryView, {
        global: { stubs: { ConfirmDeleteModal: true, ErrorModal: true, AddPaymentModal: true } },
      })
      expect(wrapper.vm.sessionData.annoRiferimento).toBe(currentYear)
      expect(wrapper.vm.sessionData.numeroBlocchetto).toBe(1)

      // 3. String numeric coercion
      localStorage.setItem(
        'ceraiolo_batch_session',
        JSON.stringify({ annoRiferimento: '2028', numeroBlocchetto: '12' })
      )
      wrapper = mount(BatchEntryView, {
        global: { stubs: { ConfirmDeleteModal: true, ErrorModal: true, AddPaymentModal: true } },
      })
      expect(wrapper.vm.sessionData.annoRiferimento).toBe(2028)
      expect(wrapper.vm.sessionData.numeroBlocchetto).toBe(12)
    })
  })

  // =========================================================================
  // Challenge 4: Booklet Switching, Cash Tally & Cache Invariants
  // =========================================================================
  describe('Challenge 4: Booklet Switching, Cash Tally & Cache Invariants', () => {
    it('switches booklet, clears in-memory cache and recomputes cash total reactively', async () => {
      const wrapper = mount(BatchEntryView, {
        global: {
          stubs: {
            ConfirmDeleteModal: true,
            ErrorModal: true,
            AddPaymentModal: true,
          },
        },
      })

      await flushPromises()

      // Booklet 1: Payments are 10 + 10 + 25 = 45.0
      expect(wrapper.vm.bookletCashTotal).toBe(45.0)
      expect(wrapper.vm.currentReceipt.numero).toBe(1)
      expect(wrapper.vm.currentReceipt.soci).toHaveLength(2) // Mario + Luigi

      // Switch to Booklet 2
      wrapper.vm.sessionData.numeroBlocchetto = 2
      await flushPromises()

      // In booklet 2, receipts are 11-20
      expect(wrapper.vm.currentReceipt.numero).toBe(11)
      expect(wrapper.vm.bookletSlots[0].receiptNumber).toBe(11)
      expect(wrapper.vm.bookletSlots[9].receiptNumber).toBe(20)

      // In dbTesseramenti, there are 0 payments for booklet 2
      expect(wrapper.vm.bookletCashTotal).toBe(0)
      expect(wrapper.vm.currentReceipt.soci).toHaveLength(0)

      // Switch back to Booklet 1
      wrapper.vm.sessionData.numeroBlocchetto = 1
      await flushPromises()

      // Restores Booklet 1 cash total and receipt 1
      expect(wrapper.vm.currentReceipt.numero).toBe(1)
      expect(wrapper.vm.bookletCashTotal).toBe(45.0)
      expect(wrapper.vm.currentReceipt.soci).toHaveLength(2)
    })

    it('navigates through all 10 slots without losing filled indicators or mixing slips', async () => {
      const wrapper = mount(BatchEntryView, {
        global: {
          stubs: {
            ConfirmDeleteModal: true,
            ErrorModal: true,
            AddPaymentModal: true,
          },
        },
      })

      await flushPromises()

      const slots = wrapper.vm.bookletSlots
      expect(slots).toHaveLength(10)

      // Slot 1: Has 2 members (filled)
      expect(slots[0].isFilled).toBe(true)
      expect(slots[0].count).toBe(2)

      // Slot 2: Has 1 member (Giacomo, receipt 2, filled)
      expect(slots[1].isFilled).toBe(true)
      expect(slots[1].count).toBe(1)

      // Slot 3..10: empty
      for (let i = 2; i < 10; i++) {
        expect(slots[i].isFilled).toBe(false)
        expect(slots[i].count).toBe(0)
      }

      // Navigate to slot 2
      await wrapper.vm.goToReceipt(2)
      await flushPromises()

      expect(wrapper.vm.currentReceipt.numero).toBe(2)
      expect(wrapper.vm.currentReceipt.soci).toHaveLength(1)
      expect(wrapper.vm.currentReceipt.soci[0].cognome).toBe('Santantoniaro')
      expect(wrapper.vm.receiptSubtotal).toBe(25.0)

      // Navigate to slot 5 (empty)
      await wrapper.vm.goToReceipt(5)
      await flushPromises()

      expect(wrapper.vm.currentReceipt.numero).toBe(5)
      expect(wrapper.vm.currentReceipt.soci).toHaveLength(0)
      expect(wrapper.vm.receiptSubtotal).toBe(0)
    })

    it('rapidly toggles between booklets and validates cash totals match ground truth', async () => {
      // Add tesseramenti to booklet 3
      dbTesseramenti.push(
        { id: 10, id_socio: 1, anno: 2026, quota_pagata: 10.0, numero_ricevuta: 21, numero_blocchetto: 3, data_pagamento: '2026-09-11' },
        { id: 11, id_socio: 2, anno: 2026, quota_pagata: 10.0, numero_ricevuta: 21, numero_blocchetto: 3, data_pagamento: '2026-09-11' }
      )

      const wrapper = mount(BatchEntryView, {
        global: { stubs: { ConfirmDeleteModal: true, ErrorModal: true, AddPaymentModal: true } },
      })
      await flushPromises()

      // Rapidly switch between 1, 2, 3, 1
      wrapper.vm.sessionData.numeroBlocchetto = 3
      await flushPromises()
      expect(wrapper.vm.bookletCashTotal).toBe(20.0)

      wrapper.vm.sessionData.numeroBlocchetto = 2
      await flushPromises()
      expect(wrapper.vm.bookletCashTotal).toBe(0.0)

      wrapper.vm.sessionData.numeroBlocchetto = 1
      await flushPromises()
      expect(wrapper.vm.bookletCashTotal).toBe(45.0)
    })
  })

  // =========================================================================
  // Challenge 5: Multi-Socio Single Removal & Cash Rollback Invariant
  // =========================================================================
  describe('Challenge 5: Multi-Socio Deletion & Cash Rollback', () => {
    it('removes a single member from a multi-socio receipt, updating cash without affecting peers', async () => {
      const wrapper = mount(BatchEntryView, {
        global: { stubs: { ConfirmDeleteModal: true, ErrorModal: true, AddPaymentModal: true } },
      })
      await flushPromises()

      // Initial receipt 1 has Mario (id 1, 10€) and Luigi (id 2, 10€). Booklet total = 45.0
      expect(wrapper.vm.currentReceipt.soci).toHaveLength(2)
      expect(wrapper.vm.bookletCashTotal).toBe(45.0)

      // Select Mario for deletion
      wrapper.vm.removeFromReceipt(wrapper.vm.currentReceipt.soci[0])
      expect(wrapper.vm.showDeleteConfirm).toBe(true)
      expect(wrapper.vm.socioToDelete.cognome).toBe('Rossi')

      // Confirm deletion
      await wrapper.vm.confirmRemoveFromReceipt()
      await flushPromises()

      // Luigi should remain
      expect(wrapper.vm.currentReceipt.soci).toHaveLength(1)
      expect(wrapper.vm.currentReceipt.soci[0].cognome).toBe('Bianchi')
      expect(wrapper.vm.receiptSubtotal).toBe(10.0)

      // Booklet cash total decrements from 45.0 to 35.0
      expect(wrapper.vm.bookletCashTotal).toBe(35.0)

      // Dexie state verification
      const remainingMario = dbTesseramenti.filter((t) => t.id_socio === 1 && t.numero_ricevuta === 1)
      expect(remainingMario).toHaveLength(0)

      const remainingLuigi = dbTesseramenti.filter((t) => t.id_socio === 2 && t.numero_ricevuta === 1)
      expect(remainingLuigi).toHaveLength(1)
    })
  })

  // =========================================================================
  // Challenge 6: Smart Inline New Socio Drawer Parser & Invariants
  // =========================================================================
  describe('Challenge 6: Smart Inline New Socio Drawer Parser & Validation', () => {
    it('empirically tests name parser variations (single, multiple words, strange casing)', async () => {
      const wrapper = mount(BatchEntryView, {
        global: { stubs: { ConfirmDeleteModal: true, ErrorModal: true, AddPaymentModal: true } },
      })

      // Test 1: standard two words
      wrapper.vm.searchQuery = 'rossi mario'
      wrapper.vm.openNewSocioForm()
      await nextTick()
      expect(wrapper.vm.newSocioData.cognome).toBe('Rossi')
      expect(wrapper.vm.newSocioData.nome).toBe('Mario')

      // Test 2: multiple names
      wrapper.vm.searchQuery = 'de luca giovanni paolo'
      wrapper.vm.openNewSocioForm()
      await nextTick()
      expect(wrapper.vm.newSocioData.cognome).toBe('De')
      expect(wrapper.vm.newSocioData.nome).toBe('Luca Giovanni Paolo')

      // Test 3: single word
      wrapper.vm.searchQuery = 'mancini'
      wrapper.vm.openNewSocioForm()
      await nextTick()
      expect(wrapper.vm.newSocioData.cognome).toBe('Mancini')
      expect(wrapper.vm.newSocioData.nome).toBe('')

      // Test 4: extra whitespace
      wrapper.vm.searchQuery = '   fiorucci   matteo   '
      wrapper.vm.openNewSocioForm()
      await nextTick()
      expect(wrapper.vm.newSocioData.cognome).toBe('Fiorucci')
      expect(wrapper.vm.newSocioData.nome).toBe('Matteo')
    })

    it('prevents saving new socio when required fields are missing', async () => {
      const wrapper = mount(BatchEntryView, {
        global: { stubs: { ConfirmDeleteModal: true, ErrorModal: true, AddPaymentModal: true } },
      })

      wrapper.vm.openNewSocioForm()
      wrapper.vm.newSocioData.cognome = 'Test'
      wrapper.vm.newSocioData.nome = ''
      wrapper.vm.newSocioData.data_nascita = ''
      await nextTick()

      expect(wrapper.vm.canSaveNewSocio).toBeFalsy()

      await wrapper.vm.saveNewSocio()
      // Should not create
      expect(wrapper.vm.showNewSocioForm).toBe(true)
    })
  })

  // =========================================================================
  // Challenge 7: AudioContext Headless Resilience
  // =========================================================================
  describe('Challenge 7: AudioContext Resilience under Headless Environments', () => {
    it('executes playSuccessSound and playErrorSound safely when AudioContext is missing', () => {
      const originalAudioContext = window.AudioContext
      const originalWebkit = window.webkitAudioContext

      try {
        delete window.AudioContext
        delete window.webkitAudioContext

        const wrapper = mount(BatchEntryView, {
          global: { stubs: { ConfirmDeleteModal: true, ErrorModal: true, AddPaymentModal: true } },
        })

        // Calling sound triggers should not throw TypeError
        expect(() => wrapper.vm.playSuccessSound()).not.toThrow()
        expect(() => wrapper.vm.playErrorSound()).not.toThrow()
      } finally {
        window.AudioContext = originalAudioContext
        window.webkitAudioContext = originalWebkit
      }
    })
  })
})
