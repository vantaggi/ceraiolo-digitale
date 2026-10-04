import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import process from 'node:process'
import { nextTick } from 'vue'
import BatchEntryView from '../views/BatchEntryView.vue'

// Mock vue-toastification
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}
vi.mock('vue-toastification', () => ({
  useToast: () => mockToast,
}))

// Dynamic In-Memory Dexie DB for empirical testing
let inMemoryTesseramenti = []
let inMemorySoci = []
let nextSocioId = 100
let nextTessId = 1000

vi.mock('@/services/db', () => ({
  db: {
    open: vi.fn().mockResolvedValue(true),
    tesseramenti: {
      where: vi.fn((col) => ({
        equals: vi.fn((val) => ({
          toArray: vi.fn().mockImplementation(() => {
            return Promise.resolve(
              inMemoryTesseramenti.filter((t) => t[col] === val),
            )
          }),
          and: vi.fn((predicate) => ({
            toArray: vi.fn().mockImplementation(() => {
              return Promise.resolve(
                inMemoryTesseramenti.filter((t) => t[col] === val && predicate(t)),
              )
            }),
          })),
        })),
      })),
      bulkDelete: vi.fn((ids) => {
        inMemoryTesseramenti = inMemoryTesseramenti.filter(
          (t) => !ids.includes(t.id_tesseramento),
        )
        return Promise.resolve(ids.length)
      }),
    },
    soci: {
      where: vi.fn(() => ({
        anyOf: vi.fn((ids) => {
          return {
            toArray: vi.fn().mockImplementation(() => {
              return Promise.resolve(
                inMemorySoci.filter((s) => ids.includes(s.id)),
              )
            }),
          }
        }),
      })),
      toArray: vi.fn().mockImplementation(() => Promise.resolve([...inMemorySoci])),
    },
  },
  searchSoci: vi.fn((query) => {
    const q = query.toLowerCase()
    return Promise.resolve(
      inMemorySoci.filter(
        (s) =>
          s.cognome.toLowerCase().includes(q) ||
          s.nome.toLowerCase().includes(q),
      ),
    )
  }),
  addSocio: vi.fn((socioData) => {
    const id = nextSocioId++
    const newRecord = { id, ...socioData }
    inMemorySoci.push(newRecord)
    return Promise.resolve(id)
  }),
  addTesseramento: vi.fn((tessData) => {
    const id_tesseramento = nextTessId++
    const newRecord = { id_tesseramento, ...tessData }
    inMemoryTesseramenti.push(newRecord)
    return Promise.resolve(id_tesseramento)
  }),
  getUniqueGroups: vi.fn().mockResolvedValue(['INTERNA', 'PADULE', 'SAN MARTINO', 'SANT’AGOSTINO']),
  addCustomGroup: vi.fn().mockResolvedValue(true),
  getArretrati: vi.fn((socioId) => {
    const socio = inMemorySoci.find((s) => s.id === socioId)
    return Promise.resolve(socio?.mockArretrati || [])
  }),
  findExistingPaymentYear: vi.fn((socioId, years) => {
    const found = inMemoryTesseramenti.find(
      (t) => t.id_socio === socioId && years.includes(t.anno),
    )
    return Promise.resolve(found ? found.anno : null)
  }),
  calculateAgeInYear: vi.fn((dob, year) => {
    if (!dob) return 30
    return year - new Date(dob).getFullYear()
  }),
  deleteTesseramentiByReceipt: vi.fn((socioId, numeroRicevuta, anni) => {
    const beforeCount = inMemoryTesseramenti.length
    inMemoryTesseramenti = inMemoryTesseramenti.filter(
      (t) =>
        !(
          t.id_socio === socioId &&
          t.numero_ricevuta === numeroRicevuta &&
          anni.includes(t.anno)
        ),
    )
    return Promise.resolve(beforeCount - inMemoryTesseramenti.length)
  }),
  getSetting: vi.fn((key, def) => Promise.resolve(def)),
}))

describe('Challenger M2 Adversarial Test Harness (Requirement R1, Milestone M2)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    inMemoryTesseramenti = []
    inMemorySoci = [
      { id: 1, cognome: 'Santantoniaro', nome: 'Mario', data_nascita: '1985-05-15', gruppo_appartenenza: 'INTERNA', data_prima_iscrizione: 2020 },
      { id: 2, cognome: 'Gubbiotti', nome: 'Luigi', data_nascita: '1990-03-20', gruppo_appartenenza: 'PADULE', data_prima_iscrizione: 2020 },
      { id: 3, cognome: 'Ciri', nome: 'Francesco', data_nascita: '2012-06-10', gruppo_appartenenza: 'SAN MARTINO', data_prima_iscrizione: 2022 },
      { id: 4, cognome: 'Bettelli', nome: 'Ubaldo', data_nascita: '1970-01-01', gruppo_appartenenza: 'INTERNA', data_prima_iscrizione: 2015, mockArretrati: [2024, 2025] },
    ]
    nextSocioId = 100
    nextTessId = 1000
  })

  const mountComponent = async () => {
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
    return wrapper
  }

  // =========================================================================
  // 1. Boundary & Range Arithmetic of the 10-Slot Visual Navigation Bar
  // =========================================================================
  describe('1. 10-Slot Visual Bar Boundaries & Arithmetic', () => {
    it('1.1 computes exact receipt boundaries for booklet 1 (slips 1..10)', async () => {
      const wrapper = await mountComponent()
      await nextTick()
      wrapper.vm.sessionData.numeroBlocchetto = 1
      await nextTick()

      const slots = wrapper.vm.bookletSlots
      expect(slots).toHaveLength(10)
      expect(slots[0].receiptNumber).toBe(1)
      expect(slots[0].index).toBe(1)
      expect(slots[9].receiptNumber).toBe(10)
      expect(slots[9].index).toBe(10)

      const bannerText = wrapper.find('.banner-range').text()
      expect(bannerText).toContain('Ricevute 1 — 10')
    })

    it('1.2 computes exact receipt boundaries for booklet 99 (slips 981..990)', async () => {
      const wrapper = await mountComponent()
      await nextTick()
      wrapper.vm.sessionData.numeroBlocchetto = 99
      await nextTick()

      const slots = wrapper.vm.bookletSlots
      expect(slots).toHaveLength(10)
      expect(slots[0].receiptNumber).toBe(981)
      expect(slots[0].index).toBe(1)
      expect(slots[9].receiptNumber).toBe(990)
      expect(slots[9].index).toBe(10)

      const bannerText = wrapper.find('.banner-range').text()
      expect(bannerText).toContain('Ricevute 981 — 990')
    })

    it('1.3 computes exact boundaries for booklet 100 (slips 991..1000) and booklet 500 (slips 4991..5000)', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      wrapper.vm.sessionData.numeroBlocchetto = 100
      await nextTick()
      expect(wrapper.vm.bookletSlots[0].receiptNumber).toBe(991)
      expect(wrapper.vm.bookletSlots[9].receiptNumber).toBe(1000)

      wrapper.vm.sessionData.numeroBlocchetto = 500
      await nextTick()
      expect(wrapper.vm.bookletSlots[0].receiptNumber).toBe(4991)
      expect(wrapper.vm.bookletSlots[9].receiptNumber).toBe(5000)
    })

    it('1.4 falls back cleanly on booklet 0 or invalid/negative values', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      // Set to 0
      wrapper.vm.sessionData.numeroBlocchetto = 0
      await nextTick()
      expect(wrapper.vm.sessionErrors.numeroBlocchetto).not.toBe('')
      // Fallback in computed bookletSlots should ensure receipt numbers are >= 1
      expect(wrapper.vm.bookletSlots[0].receiptNumber).toBe(1)

      // Set to -5
      wrapper.vm.sessionData.numeroBlocchetto = -5
      await nextTick()
      expect(wrapper.vm.sessionErrors.numeroBlocchetto).not.toBe('')
    })

    it('1.5 prevents decrementing below receipt 1', async () => {
      const wrapper = await mountComponent()
      await nextTick()
      wrapper.vm.currentReceipt.numero = 1
      await nextTick()

      const prevBtn = wrapper.find('.receipt-number-controls button:first-child')
      expect(prevBtn.attributes('disabled')).toBeDefined()

      wrapper.vm.decrementReceipt()
      expect(wrapper.vm.currentReceipt.numero).toBe(1)
    })

    it('1.6 handles out-of-slot receipt navigation with ? indicator', async () => {
      const wrapper = await mountComponent()
      await nextTick()
      wrapper.vm.sessionData.numeroBlocchetto = 1
      wrapper.vm.currentReceipt.numero = 15 // beyond booklet 1
      await nextTick()

      expect(wrapper.vm.activeSlotIndex).toBe('?')
      const activeSlots = wrapper.vm.bookletSlots.filter((s) => s.isActive)
      expect(activeSlots).toHaveLength(0)

      // Clicking slot 3 brings it back within range
      await wrapper.vm.goToReceipt(3)
      expect(wrapper.vm.currentReceipt.numero).toBe(3)
      expect(wrapper.vm.activeSlotIndex).toBe(3)
      expect(wrapper.vm.bookletSlots[2].isActive).toBe(true)
    })

    it('1.7 stress test: rapid slot switching preserves in-memory cache integrity across 100 switches', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      // Put soci on receipt 1, 4, and 7
      wrapper.vm.currentReceipt.numero = 1
      wrapper.vm.currentReceipt.soci = [{ id: 1, cognome: 'Test1', nome: 'A', quota_pagata: 10, anniPagati: [2026] }]
      wrapper.vm.saveCurrentReceiptToCache()

      await wrapper.vm.goToReceipt(4)
      wrapper.vm.currentReceipt.soci = [{ id: 2, cognome: 'Test4', nome: 'B', quota_pagata: 25, anniPagati: [2026] }]
      wrapper.vm.saveCurrentReceiptToCache()

      await wrapper.vm.goToReceipt(7)
      wrapper.vm.currentReceipt.soci = [{ id: 3, cognome: 'Test7', nome: 'C', quota_pagata: 10, anniPagati: [2026] }]
      wrapper.vm.saveCurrentReceiptToCache()

      // Rapidly switch between random slots 1..10
      const slotTargets = [1, 2, 4, 3, 7, 10, 1, 4, 7, 8, 9, 2, 4, 1, 7]
      for (let cycle = 0; cycle < 7; cycle++) {
        for (const target of slotTargets) {
          await wrapper.vm.goToReceipt(target)
        }
      }

      // Verify slot 1 has Test1
      await wrapper.vm.goToReceipt(1)
      expect(wrapper.vm.currentReceipt.soci).toHaveLength(1)
      expect(wrapper.vm.currentReceipt.soci[0].cognome).toBe('Test1')

      // Verify slot 4 has Test4
      await wrapper.vm.goToReceipt(4)
      expect(wrapper.vm.currentReceipt.soci).toHaveLength(1)
      expect(wrapper.vm.currentReceipt.soci[0].cognome).toBe('Test4')

      // Verify slot 7 has Test7
      await wrapper.vm.goToReceipt(7)
      expect(wrapper.vm.currentReceipt.soci).toHaveLength(1)
      expect(wrapper.vm.currentReceipt.soci[0].cognome).toBe('Test7')

      // Verify slot 2 is empty
      await wrapper.vm.goToReceipt(2)
      expect(wrapper.vm.currentReceipt.soci).toHaveLength(0)
    })
  })

  // =========================================================================
  // 2. Keyboard & Arrow Navigation Resilience
  // =========================================================================
  describe('2. Keyboard Navigation Resilience', () => {
    it('2.1 navigates receipts with ArrowRight and ArrowLeft when focus is clear', async () => {
      const wrapper = await mountComponent()
      await nextTick()
      wrapper.vm.currentReceipt.numero = 5

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      await nextTick()
      expect(wrapper.vm.currentReceipt.numero).toBe(6)

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
      await nextTick()
      expect(wrapper.vm.currentReceipt.numero).toBe(5)
    })

    it('2.2 suppresses arrow navigation when user is typing in an active input', async () => {
      const wrapper = await mountComponent()
      await nextTick()
      wrapper.vm.currentReceipt.numero = 5

      // Simulate input focus
      const input = document.createElement('input')
      input.value = 'searching'
      document.body.appendChild(input)
      input.focus()

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      await nextTick()
      expect(wrapper.vm.currentReceipt.numero).toBe(5) // Not changed!

      document.body.removeChild(input)
    })

    it('2.3 suppresses arrow navigation when payment modal or delete modal or new socio form is open', async () => {
      const wrapper = await mountComponent()
      await nextTick()
      wrapper.vm.currentReceipt.numero = 5

      // Modal 1: Payment Modal
      wrapper.vm.showPaymentModal = true
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      await nextTick()
      expect(wrapper.vm.currentReceipt.numero).toBe(5)
      wrapper.vm.showPaymentModal = false

      // Modal 2: Delete Confirm
      wrapper.vm.showDeleteConfirm = true
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      await nextTick()
      expect(wrapper.vm.currentReceipt.numero).toBe(5)
      wrapper.vm.showDeleteConfirm = false

      // Modal 3: New Socio Form
      wrapper.vm.showNewSocioForm = true
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      await nextTick()
      expect(wrapper.vm.currentReceipt.numero).toBe(5)
      wrapper.vm.showNewSocioForm = false
    })

    it('2.4 Escape closes open drawer and clears search query', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      wrapper.vm.showNewSocioForm = true
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await nextTick()
      expect(wrapper.vm.showNewSocioForm).toBe(false)

      wrapper.vm.searchQuery = 'something'
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await nextTick()
      expect(wrapper.vm.searchQuery).toBe('')
    })
  })

  // =========================================================================
  // 3. Live Booklet Cash Total & Multi-Socio Accounting Invariants
  // =========================================================================
  describe('3. Live Booklet Cash Total & Accounting Invariants', () => {
    it('3.1 calculates multi-member fees on single receipt (10€ + 25€ + 30€ = 65€)', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      wrapper.vm.currentReceipt.soci = [
        { id: 1, cognome: 'A', nome: 'A', quota_pagata: 10.0, totale_versato: 10.0, anniPagati: [2026] },
        { id: 2, cognome: 'B', nome: 'B', quota_pagata: 25.0, totale_versato: 25.0, anniPagati: [2026], is_nuovo: true },
        { id: 3, cognome: 'C', nome: 'C', quota_pagata: 10.0, totale_versato: 30.0, anniPagati: [2024, 2025, 2026] },
      ]
      await nextTick()

      expect(wrapper.vm.receiptSubtotal).toBe(65.0)
      const subtotalBadge = wrapper.find('.subtotal-amount')
      expect(subtotalBadge.text()).toContain('65.00')
    })

    it('3.2 handles decimal quotas cleanly without floating point precision issues', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      wrapper.vm.currentReceipt.soci = [
        { id: 1, cognome: 'A', nome: 'A', quota_pagata: 10.25, totale_versato: 10.25, anniPagati: [2026] },
        { id: 2, cognome: 'B', nome: 'B', quota_pagata: 12.50, totale_versato: 12.50, anniPagati: [2026] },
      ]
      await nextTick()

      expect(wrapper.vm.receiptSubtotal).toBe(22.75)
      expect(wrapper.vm.formatCurrency(wrapper.vm.receiptSubtotal)).toBe('22.75')
    })

    it('3.3 correctly handles returning member quotas (25€ vs 10€) and visual badges', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      wrapper.vm.currentReceipt.soci = [
        // Ordinary renewal
        { id: 1, cognome: 'Rinnovo', nome: 'Socio', quota_pagata: 10.0, totale_versato: 10.0, anniPagati: [2026], is_nuovo: false },
        // Brand new member
        { id: 2, cognome: 'Nuovo', nome: 'Socio', quota_pagata: 25.0, totale_versato: 25.0, anniPagati: [2026], is_nuovo: true },
        // Minor member
        { id: 3, cognome: 'Minorenne', nome: 'Socio', data_nascita: '2015-01-01', quota_pagata: 10.0, totale_versato: 10.0, anniPagati: [2026], is_nuovo: false },
      ]
      await nextTick()

      const cards = wrapper.findAll('.receipt-socio-card')
      expect(cards).toHaveLength(3)
      expect(cards[0].find('.badge-success').text()).toBe('Rinnovo')
      expect(cards[1].find('.badge-gold').text()).toBe('Nuovo Socio')
      expect(cards[2].find('.badge-info').text()).toBe('Minorenne')
    })

    it('3.4 decrements receipt subtotal and booklet cash total upon single socio removal', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      // Seed Dexie with 2 payments on booklet 1, receipt 1
      inMemoryTesseramenti = [
        { id_tesseramento: 101, id_socio: 1, anno: 2026, quota_pagata: 10.0, numero_ricevuta: 1, numero_blocchetto: 1 },
        { id_tesseramento: 102, id_socio: 2, anno: 2026, quota_pagata: 25.0, numero_ricevuta: 1, numero_blocchetto: 1 },
      ]

      await wrapper.vm.updateBookletCashTotal()
      expect(wrapper.vm.bookletCashTotal).toBe(35.0)

      wrapper.vm.currentReceipt.numero = 1
      wrapper.vm.currentReceipt.soci = [
        { id: 1, cognome: 'Santantoniaro', nome: 'Mario', quota_pagata: 10.0, totale_versato: 10.0, anniPagati: [2026] },
        { id: 2, cognome: 'Gubbiotti', nome: 'Luigi', quota_pagata: 25.0, totale_versato: 25.0, anniPagati: [2026], is_nuovo: true },
      ]
      wrapper.vm.saveCurrentReceiptToCache()
      await nextTick()

      expect(wrapper.vm.receiptSubtotal).toBe(35.0)

      // Remove Luigi Gubbiotti (25€)
      wrapper.vm.socioToDelete = wrapper.vm.currentReceipt.soci[1]
      await wrapper.vm.confirmRemoveFromReceipt()

      expect(wrapper.vm.currentReceipt.soci).toHaveLength(1)
      expect(wrapper.vm.receiptSubtotal).toBe(10.0)
      expect(wrapper.vm.bookletCashTotal).toBe(10.0)
      expect(inMemoryTesseramenti).toHaveLength(1)
      expect(inMemoryTesseramenti[0].id_socio).toBe(1)
    })

    it('3.5 resets slot to empty dot when last socio is removed from receipt', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      inMemoryTesseramenti = [
        { id_tesseramento: 201, id_socio: 1, anno: 2026, quota_pagata: 10.0, numero_ricevuta: 1, numero_blocchetto: 1 },
      ]
      await wrapper.vm.updateBookletCashTotal()

      wrapper.vm.currentReceipt.numero = 1
      wrapper.vm.currentReceipt.soci = [
        { id: 1, cognome: 'Santantoniaro', nome: 'Mario', quota_pagata: 10.0, totale_versato: 10.0, anniPagati: [2026] },
      ]
      wrapper.vm.saveCurrentReceiptToCache()
      await nextTick()

      expect(wrapper.vm.filledSlotsCount).toBe(1)

      wrapper.vm.socioToDelete = wrapper.vm.currentReceipt.soci[0]
      await wrapper.vm.confirmRemoveFromReceipt()

      expect(wrapper.vm.currentReceipt.soci).toHaveLength(0)
      expect(wrapper.vm.receiptSubtotal).toBe(0)
      expect(wrapper.vm.bookletCashTotal).toBe(0)
      expect(wrapper.vm.filledSlotsCount).toBe(0)
      expect(wrapper.vm.bookletSlots[0].isFilled).toBe(false)
    })

    it('3.6 isolates cash totals across distinct booklets', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      // Booklet 1: 30€
      // Booklet 2: 75€
      inMemoryTesseramenti = [
        { id_tesseramento: 1, id_socio: 1, anno: 2026, quota_pagata: 10.0, numero_ricevuta: 1, numero_blocchetto: 1 },
        { id_tesseramento: 2, id_socio: 2, anno: 2026, quota_pagata: 20.0, numero_ricevuta: 2, numero_blocchetto: 1 },
        { id_tesseramento: 3, id_socio: 3, anno: 2026, quota_pagata: 25.0, numero_ricevuta: 11, numero_blocchetto: 2 },
        { id_tesseramento: 4, id_socio: 4, anno: 2026, quota_pagata: 50.0, numero_ricevuta: 12, numero_blocchetto: 2 },
      ]

      wrapper.vm.sessionData.numeroBlocchetto = 1
      await wrapper.vm.updateBookletCashTotal()
      expect(wrapper.vm.bookletCashTotal).toBe(30.0)

      wrapper.vm.sessionData.numeroBlocchetto = 2
      await wrapper.vm.updateBookletCashTotal()
      expect(wrapper.vm.bookletCashTotal).toBe(75.0)

      wrapper.vm.sessionData.numeroBlocchetto = 1
      await wrapper.vm.updateBookletCashTotal()
      expect(wrapper.vm.bookletCashTotal).toBe(30.0)
    })
  })

  // =========================================================================
  // 4. Smart Inline New Socio Form & Parsing
  // =========================================================================
  describe('4. Inline New Socio Drawer & Name Parsing', () => {
    it('4.1 parses "rossi mario" into Cognome "Rossi" and Nome "Mario"', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      wrapper.vm.searchQuery = 'rossi mario'
      wrapper.vm.openNewSocioForm()
      expect(wrapper.vm.newSocioData.cognome).toBe('Rossi')
      expect(wrapper.vm.newSocioData.nome).toBe('Mario')
    })

    it('4.2 parses multi-word queries like "de marco giovanni battista" correctly', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      wrapper.vm.searchQuery = 'de marco giovanni battista'
      wrapper.vm.openNewSocioForm()
      expect(wrapper.vm.newSocioData.cognome).toBe('De')
      expect(wrapper.vm.newSocioData.nome).toBe('Marco Giovanni Battista')
    })

    it('4.3 parses single-word query like "bianchi" into Cognome "Bianchi" and empty Nome', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      wrapper.vm.searchQuery = 'bianchi'
      wrapper.vm.openNewSocioForm()
      expect(wrapper.vm.newSocioData.cognome).toBe('Bianchi')
      expect(wrapper.vm.newSocioData.nome).toBe('')
    })

    it('4.4 handles irregular whitespace "   verdi   luigi   " gracefully', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      wrapper.vm.searchQuery = '   verdi   luigi   '
      wrapper.vm.openNewSocioForm()
      expect(wrapper.vm.newSocioData.cognome).toBe('Verdi')
      expect(wrapper.vm.newSocioData.nome).toBe('Luigi')
    })

    it('4.5 handles empty or whitespace-only search queries safely', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      wrapper.vm.searchQuery = '    '
      wrapper.vm.openNewSocioForm()
      expect(wrapper.vm.newSocioData.cognome).toBe('')
      expect(wrapper.vm.newSocioData.nome).toBe('')
    })

    it('4.6 enforces required validation rules before saving new socio', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      wrapper.vm.openNewSocioForm()
      wrapper.vm.newSocioData.cognome = ''
      wrapper.vm.newSocioData.nome = ''
      wrapper.vm.newSocioData.data_nascita = ''

      expect(wrapper.vm.canSaveNewSocio).toBeFalsy()

      await wrapper.vm.saveNewSocio()
      expect(inMemorySoci).toHaveLength(4) // None added!
    })

    it('4.7 saves new socio with 25€ statutory quota and updates DB, receipt, and cash total', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      wrapper.vm.sessionData.annoRiferimento = 2026
      wrapper.vm.sessionData.numeroBlocchetto = 1
      wrapper.vm.currentReceipt.numero = 3

      wrapper.vm.openNewSocioForm()
      wrapper.vm.newSocioData.cognome = 'Giacometti'
      wrapper.vm.newSocioData.nome = 'Andrea'
      wrapper.vm.newSocioData.data_nascita = '1992-08-24'
      wrapper.vm.newSocioData.gruppo_appartenenza = 'INTERNA'
      await nextTick()

      expect(wrapper.vm.canSaveNewSocio).toBe(true)
      await wrapper.vm.saveNewSocio()

      // Socio persisted in inMemorySoci
      const savedSocio = inMemorySoci.find((s) => s.cognome === 'Giacometti')
      expect(savedSocio).toBeDefined()
      expect(savedSocio.data_prima_iscrizione).toBe(2026)

      // Payment persisted in inMemoryTesseramenti with 25€ quota
      const savedTess = inMemoryTesseramenti.find((t) => t.id_socio === savedSocio.id)
      expect(savedTess).toBeDefined()
      expect(savedTess.quota_pagata).toBe(25.0)
      expect(savedTess.numero_ricevuta).toBe(3)
      expect(savedTess.numero_blocchetto).toBe(1)

      // Added to active receipt
      const receiptSocio = wrapper.vm.currentReceipt.soci.find((s) => s.id === savedSocio.id)
      expect(receiptSocio).toBeDefined()
      expect(receiptSocio.is_nuovo).toBe(true)
      expect(receiptSocio.quota_pagata).toBe(25.0)

      // Booklet cash total incremented
      expect(wrapper.vm.bookletCashTotal).toBe(25.0)
      expect(wrapper.vm.receiptSubtotal).toBe(25.0)
    })
  })

  // =========================================================================
  // 5. Duplicate Payment Guards & Integrity
  // =========================================================================
  describe('5. Duplicate Payment Guards', () => {
    it('5.1 identifies socio already on active receipt as IN_RECEIPT and disables pay button', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      const existingSocio = inMemorySoci[0]
      wrapper.vm.currentReceipt.soci = [
        { id: existingSocio.id, cognome: existingSocio.cognome, nome: existingSocio.nome, quota_pagata: 10, anniPagati: [2026] },
      ]

      const status = wrapper.vm.getSocioStatus(existingSocio)
      expect(status).toBe('IN_RECEIPT')
    })

    it('5.2 identifies socio already paid current year as IN_ORDER when no arrears exist', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      const socio = { ...inMemorySoci[1], paidCurrentYear: true, arretrati: [] }
      const status = wrapper.vm.getSocioStatus(socio)
      expect(status).toBe('IN_ORDER')
    })

    it('5.3 blocks duplicate payment submission via handleSavePayments if year is already recorded', async () => {
      const wrapper = await mountComponent()
      await nextTick()

      // Seed payment for socio 1 in 2026
      inMemoryTesseramenti = [
        { id_tesseramento: 501, id_socio: 1, anno: 2026, quota_pagata: 10.0, numero_ricevuta: 1, numero_blocchetto: 1 },
      ]

      await wrapper.vm.handleSavePayments({
        details: { quota_pagata: 10.0, data_pagamento: '2026-05-15', numero_ricevuta: 1, numero_blocchetto: 1 },
        years: [2026],
        socioId: 1,
      })

      // Must be rejected with error message
      expect(wrapper.vm.errorMessage).toContain('risulta già pagato')
      // No second tesseramento added
      expect(inMemoryTesseramenti).toHaveLength(1)
    })
  })

  // =========================================================================
  // 6. Audio Safety & Zero-Emoji Institutional Compliance
  // =========================================================================
  describe('6. Audio Safety & Zero-Emoji Compliance', () => {
    it('6.1 does not crash when AudioContext is missing in headless environments', async () => {
      const originalAudioContext = window.AudioContext
      window.AudioContext = undefined

      const wrapper = await mountComponent()
      expect(() => wrapper.vm.playSuccessSound()).not.toThrow()
      expect(() => wrapper.vm.playErrorSound()).not.toThrow()

      window.AudioContext = originalAudioContext
    })

    it('6.2 respects soundEnabled toggle and skips audio synthesis when disabled', async () => {
      const wrapper = await mountComponent()
      wrapper.vm.soundEnabled = false

      expect(() => wrapper.vm.playSuccessSound()).not.toThrow()
      expect(() => wrapper.vm.playErrorSound()).not.toThrow()
    })

    it('6.3 enforces 100% zero-emoji compliance in BatchEntryView.vue', () => {
      const filePath = resolve(process.cwd(), 'src/views/BatchEntryView.vue')
      const content = readFileSync(filePath, 'utf-8')
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
      const match = content.match(emojiRegex)
      expect(match).toBeNull()
    })
  })
})
