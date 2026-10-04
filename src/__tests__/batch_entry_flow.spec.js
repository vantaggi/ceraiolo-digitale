import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import process from 'node:process'
import { nextTick } from 'vue'
import BatchEntryView from '../views/BatchEntryView.vue'

// Mock vue-toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}))

// Mock services/db
const mockTesseramenti = [
  { id_socio: 1, anno: 2026, quota_pagata: 25.0, numero_ricevuta: 1, numero_blocchetto: 1 },
  { id_socio: 2, anno: 2026, quota_pagata: 10.0, numero_ricevuta: 1, numero_blocchetto: 1 },
  { id_socio: 3, anno: 2026, quota_pagata: 10.0, numero_ricevuta: 2, numero_blocchetto: 1 },
]

const mockSoci = [
  { id: 1, cognome: 'Santantoniaro', nome: 'Mario', data_nascita: '1985-05-15', gruppo_appartenenza: 'INTERNA', data_prima_iscrizione: 2026 },
  { id: 2, cognome: 'Gubbiotti', nome: 'Luigi', data_nascita: '1990-03-20', gruppo_appartenenza: 'PADULE', data_prima_iscrizione: 2020 },
  { id: 3, cognome: 'Ciri', nome: 'Francesco', data_nascita: '2010-06-10', gruppo_appartenenza: 'SAN MARTINO', data_prima_iscrizione: 2022 },
]

vi.mock('@/services/db', () => ({
  db: {
    open: vi.fn().mockResolvedValue(true),
    tesseramenti: {
      where: vi.fn((col) => ({
        equals: vi.fn((val) => ({
          toArray: vi.fn().mockResolvedValue(
            mockTesseramenti.filter((t) => t[col] === val),
          ),
          and: vi.fn((fn) => ({
            toArray: vi.fn().mockResolvedValue(
              mockTesseramenti.filter((t) => t[col] === val && fn(t)),
            ),
          })),
        })),
      })),
    },
    soci: {
      where: vi.fn(() => ({
        anyOf: vi.fn((ids) => ({
          toArray: vi.fn().mockResolvedValue(
            mockSoci.filter((s) => ids.includes(s.id)),
          ),
        })),
      })),
    },
  },
  searchSoci: vi.fn().mockResolvedValue([]),
  addSocio: vi.fn().mockResolvedValue(999),
  addTesseramento: vi.fn().mockResolvedValue(1234),
  getUniqueGroups: vi.fn().mockResolvedValue(['INTERNA', 'PADULE', 'SAN MARTINO']),
  addCustomGroup: vi.fn().mockResolvedValue(true),
  getArretrati: vi.fn().mockResolvedValue([]),
  findExistingPaymentYear: vi.fn().mockResolvedValue(null),
  calculateAgeInYear: vi.fn((dob, year) => {
    if (!dob) return 30
    return year - new Date(dob).getFullYear()
  }),
  deleteTesseramentiByReceipt: vi.fn().mockResolvedValue(true),
  getSetting: vi.fn((key, def) => Promise.resolve(def)),
}))

describe('BatchEntryView (Requirement R1, Milestone M2)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  // 1. Emoji Free & BaseIcon Usage
  describe('Zero-Emoji Compliance & BaseIcon Integration', () => {
    it('contains ZERO raw unicode emojis in template and script', () => {
      const filePath = resolve(process.cwd(), 'src/views/BatchEntryView.vue')
      const fileContent = readFileSync(filePath, 'utf-8')
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
      const matches = fileContent.match(emojiRegex)
      expect(matches).toBeNull()
    })

    it('renders BaseIcon instances for header, banner, slots and actions', () => {
      const wrapper = mount(BatchEntryView, {
        global: {
          stubs: {
            ConfirmDeleteModal: true,
            ErrorModal: true,
            AddPaymentModal: true,
          },
        },
      })
      const icons = wrapper.findAllComponents({ name: 'BaseIcon' })
      expect(icons.length).toBeGreaterThan(10)
    })
  })

  // 2. 10-Slot Visual Receipt Bar
  describe('10-Slot Visual Receipt Bar [1]..[10]', () => {
    it('renders exactly 10 receipt slot buttons for the active booklet', () => {
      const wrapper = mount(BatchEntryView, {
        global: {
          stubs: {
            ConfirmDeleteModal: true,
            ErrorModal: true,
            AddPaymentModal: true,
          },
        },
      })

      const slotButtons = wrapper.findAll('.slot-item')
      expect(slotButtons).toHaveLength(10)
      expect(slotButtons[0].text()).toContain('[1]')
      expect(slotButtons[0].text()).toContain('#1')
      expect(slotButtons[9].text()).toContain('[10]')
      expect(slotButtons[9].text()).toContain('#10')
    })

    it('marks slot 1 as active by default for booklet 1', () => {
      const wrapper = mount(BatchEntryView, {
        global: {
          stubs: {
            ConfirmDeleteModal: true,
            ErrorModal: true,
            AddPaymentModal: true,
          },
        },
      })

      const slotButtons = wrapper.findAll('.slot-item')
      expect(slotButtons[0].classes()).toContain('slot-item--active')
      expect(slotButtons[1].classes()).not.toContain('slot-item--active')
    })

    it('switches receipt when clicking another slot button', async () => {
      const wrapper = mount(BatchEntryView, {
        global: {
          stubs: {
            ConfirmDeleteModal: true,
            ErrorModal: true,
            AddPaymentModal: true,
          },
        },
      })

      const slotButtons = wrapper.findAll('.slot-item')
      await slotButtons[3].trigger('click')

      expect(wrapper.find('.receipt-header h2').text()).toContain('#4')
      expect(slotButtons[3].classes()).toContain('slot-item--active')
      expect(slotButtons[0].classes()).not.toContain('slot-item--active')
    })

    it('navigates slots with chevron buttons and keyboard arrows', async () => {
      const wrapper = mount(BatchEntryView, {
        global: {
          stubs: {
            ConfirmDeleteModal: true,
            ErrorModal: true,
            AddPaymentModal: true,
          },
        },
      })

      const nextBtn = wrapper.find('.receipt-number-controls button:last-child')
      await nextBtn.trigger('click')
      expect(wrapper.find('.receipt-header h2').text()).toContain('#2')

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      await nextTick()
      expect(wrapper.find('.receipt-header h2').text()).toContain('#3')

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
      await nextTick()
      expect(wrapper.find('.receipt-header h2').text()).toContain('#2')
    })
  })

  // 3. Live Booklet Cash Total & Banner
  describe('Live Booklet Cash Total & Summary Banner', () => {
    it('displays booklet number, range, completed slips count and cash total', async () => {
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

      const banner = wrapper.find('.booklet-summary-banner')
      expect(banner.exists()).toBe(true)
      expect(banner.text()).toContain('Blocchetto #1')
      expect(banner.text()).toContain('Ricevute 1 — 10')
      expect(banner.text()).toContain('Totale Cassa Libretto')

      const cashAmount = wrapper.find('.cash-amount')
      expect(cashAmount.classes()).toContain('tabular-nums')
    })
  })

  // 4. Multi-Socio Receipt Flow & Subtotal
  describe('Multi-Socio Receipt Flow', () => {
    it('calculates receipt subtotal from all soci on active sheet', async () => {
      const wrapper = mount(BatchEntryView, {
        global: {
          stubs: {
            ConfirmDeleteModal: true,
            ErrorModal: true,
            AddPaymentModal: true,
          },
        },
      })

      const subtotalEl = wrapper.find('.subtotal-amount')
      expect(subtotalEl.classes()).toContain('tabular-nums')

      wrapper.vm.currentReceipt.soci.push(
        { id: 101, cognome: 'Rossi', nome: 'Mario', quota_pagata: 10.0, totale_versato: 10.0, anniPagati: [2026] },
        { id: 102, cognome: 'Rossi', nome: 'Anna', quota_pagata: 25.0, totale_versato: 25.0, anniPagati: [2026], is_nuovo: true },
      )
      await nextTick()

      expect(wrapper.vm.receiptSubtotal).toBe(35.0)
      expect(subtotalEl.text()).toContain('35.00')

      const cards = wrapper.findAll('.receipt-socio-card')
      expect(cards).toHaveLength(2)
      expect(cards[1].find('.badge-gold').text()).toBe('Nuovo Socio')
    })

    it('opens confirm modal when removing a socio and splices on confirm', async () => {
      const wrapper = mount(BatchEntryView, {
        global: {
          stubs: {
            ConfirmDeleteModal: true,
            ErrorModal: true,
            AddPaymentModal: true,
          },
        },
      })

      wrapper.vm.currentReceipt.soci.push(
        { id: 201, cognome: 'Bianchi', nome: 'Paolo', quota_pagata: 10.0, totale_versato: 10.0, anniPagati: [2026] },
      )
      await nextTick()

      const removeBtn = wrapper.find('.remove-socio-btn')
      await removeBtn.trigger('click')

      expect(wrapper.vm.showDeleteConfirm).toBe(true)
      expect(wrapper.vm.socioToDelete.id).toBe(201)

      await wrapper.vm.confirmRemoveFromReceipt()
      expect(wrapper.vm.currentReceipt.soci).toHaveLength(0)
    })
  })

  // 5. Smart Inline New Socio Registration Drawer
  describe('Smart Inline New Socio Registration Drawer', () => {
    it('pre-populates surname and name from search query', async () => {
      const wrapper = mount(BatchEntryView, {
        global: {
          stubs: {
            ConfirmDeleteModal: true,
            ErrorModal: true,
            AddPaymentModal: true,
          },
        },
      })

      wrapper.vm.searchQuery = 'mancini stefano'
      wrapper.vm.openNewSocioForm()
      await nextTick()

      expect(wrapper.vm.showNewSocioForm).toBe(true)
      expect(wrapper.vm.newSocioData.cognome).toBe('Mancini')
      expect(wrapper.vm.newSocioData.nome).toBe('Stefano')

      const drawer = wrapper.find('.new-socio-drawer')
      expect(drawer.exists()).toBe(true)
      expect(drawer.find('.quota-notice-card').text()).toContain('25')
    })

    it('saves new socio with 25€ statutory quota and adds to active receipt', async () => {
      const wrapper = mount(BatchEntryView, {
        global: {
          stubs: {
            ConfirmDeleteModal: true,
            ErrorModal: true,
            AddPaymentModal: true,
          },
        },
      })

      wrapper.vm.openNewSocioForm()
      wrapper.vm.newSocioData.cognome = 'Fiorucci'
      wrapper.vm.newSocioData.nome = 'Matteo'
      wrapper.vm.newSocioData.data_nascita = '1995-04-12'
      wrapper.vm.newSocioData.gruppo_appartenenza = 'PADULE'
      await nextTick()

      expect(wrapper.vm.canSaveNewSocio).toBe(true)

      await wrapper.vm.saveNewSocio()

      const added = wrapper.vm.currentReceipt.soci.find((s) => s.cognome === 'Fiorucci')
      expect(added).toBeDefined()
      expect(added.is_nuovo).toBe(true)
      expect(added.quota_pagata).toBe(25.0)
      expect(added.totale_versato).toBe(25.0)
      expect(wrapper.vm.showNewSocioForm).toBe(false)
    })
  })
})

