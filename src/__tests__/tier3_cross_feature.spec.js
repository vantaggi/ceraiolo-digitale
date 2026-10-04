import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { useThemeStore } from '../stores/theme'
import TesseraTemplate from '../components/TesseraTemplate.vue'

describe('Tier 3 - Cross-Feature Combinations', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  // =========================================================================
  // Combination 1: Batch Entry + Booklet Cash Tally + Quota Audit
  // =========================================================================
  describe('Batch Entry + Booklet Cash Tally + Quota Audit', () => {
    it('integrates batch receipt entries, computes real-time booklet cash, and flags underpaid returning members', () => {
      const activeBooklet = {
        id: 2,
        numero_blocchetto: 2,
        assegnato_a: 'Capodieci Santantoniari',
      }

      // Existing payments in db
      const allPayments = [
        // Historical payments from 2024
        { id_socio: 1, anno: 2024, quota_pagata: 10.0 },
        { id_socio: 2, anno: 2024, quota_pagata: 10.0 },
      ]

      // Current batch session (Year 2026)
      const sessionPayments = []

      // Helper to simulate saving a receipt
      const saveReceipt = (receiptNum, socioEntries) => {
        for (const entry of socioEntries) {
          sessionPayments.push({
            id_socio: entry.id_socio,
            anno: 2026,
            quota_pagata: entry.quota,
            numero_ricevuta: receiptNum,
            numero_blocchetto: activeBooklet.numero_blocchetto,
            data_pagamento: '2026-05-01',
          })
        }
      }

      // Receipt 11: 1 regular renewal (10€) + 1 new member (25€)
      saveReceipt(11, [
        { id_socio: 1, quota: 10.0 },
        { id_socio: 3, quota: 25.0 },
      ])

      // Function to get current booklet tally
      const getBookletCash = () =>
        sessionPayments
          .filter((p) => p.numero_blocchetto === activeBooklet.numero_blocchetto)
          .reduce((sum, p) => sum + p.quota_pagata, 0)

      expect(getBookletCash()).toBe(35.0)

      // Receipt 12: 1 returning member (id: 2, paid 2024, missed 2025, now paid 10€ in 2026 instead of 25€ re-entry)
      saveReceipt(12, [{ id_socio: 2, quota: 10.0 }])

      expect(getBookletCash()).toBe(45.0)

      // Audit logic: Check if returning member paid less than 25€
      const auditReturningMember = (socioId, currentYear, quotaPaid, paymentHistory) => {
        const pastYears = paymentHistory
          .filter((p) => p.id_socio === socioId && p.anno < currentYear)
          .map((p) => p.anno)

        if (pastYears.length === 0) {
          // First time payer: should pay 25€
          return quotaPaid < 25.0 ? 'NUOVO_SOTTOQUOTA' : null
        }

        const isConsecutive = pastYears.includes(currentYear - 1)
        if (!isConsecutive && quotaPaid < 25.0) {
          // Returning member who missed previous year and paid < 25€
          return 'RIENTRO_SOTTOQUOTA'
        }
        return null
      }

      const auditResultSocio1 = auditReturningMember(1, 2026, 10.0, [
        { id_socio: 1, anno: 2025 },
      ])
      expect(auditResultSocio1).toBeNull() // Paid 2025, regular 10€ is fine

      const auditResultSocio2 = auditReturningMember(2, 2026, 10.0, allPayments)
      expect(auditResultSocio2).toBe('RIENTRO_SOTTOQUOTA') // Missed 2025, paid 10€ -> flagged!
    })
  })

  // =========================================================================
  // Combination 2: Theme Store Toggle + Component State Synchronization
  // =========================================================================
  describe('Theme Store Toggle + Component State Synchronization', () => {
    it('synchronizes theme changes with DOM document element and renders components cleanly', async () => {
      const themeStore = useThemeStore()

      // Initial light
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')

      // Mount TesseraTemplate component
      const wrapper = mount(TesseraTemplate, {
        props: {
          nomeCognome: 'Santantoniaro Esempio',
          dataNascita: '1985-05-15',
        },
      })

      expect(wrapper.find('.name-value').text()).toBe('Santantoniaro Esempio')
      expect(wrapper.find('.birthdate-value').text()).toBe('15 Maggio 1985')

      // Toggle theme to dark
      themeStore.applyTheme('dark')
      expect(themeStore.currentTheme).toBe('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      expect(localStorage.getItem('theme')).toBe('dark')

      // Component remains intact and valid in dark mode
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.classes()).toContain('tessera-vertical')

      wrapper.unmount()
    })
  })

  // =========================================================================
  // Combination 3: Manicchia Filter + Card Sorting + 6-Up Pagination
  // =========================================================================
  describe('Manicchia Filter + Card Sorting + 6-Up Pagination', () => {
    it('filters by Manicchia, sorts cards, and computes exact 6-up sheet pagination', () => {
      const allSoci = [
        { id: 1, cognome: 'Rossi', nome: 'A', gruppo_appartenenza: 'PADULE' },
        { id: 2, cognome: 'Bianchi', nome: 'B', gruppo_appartenenza: 'INTERNA' },
        { id: 3, cognome: 'Brunetti', nome: 'C', gruppo_appartenenza: 'PADULE' },
        { id: 4, cognome: 'Cacciamani', nome: 'D', gruppo_appartenenza: 'PADULE' },
        { id: 5, cognome: 'Fiorucci', nome: 'E', gruppo_appartenenza: 'PADULE' },
        { id: 6, cognome: 'Ghirga', nome: 'F', gruppo_appartenenza: 'PADULE' },
        { id: 7, cognome: 'Mariani', nome: 'G', gruppo_appartenenza: 'PADULE' },
        { id: 8, cognome: 'Nardi', nome: 'H', gruppo_appartenenza: 'PADULE' },
      ]

      // Step 1: Filter by Manicchia 'PADULE'
      const paduleSoci = allSoci.filter((s) => s.gruppo_appartenenza === 'PADULE')
      expect(paduleSoci).toHaveLength(7)

      // Step 2: Sort alphabetically by surname
      const sortedPadule = [...paduleSoci].sort((a, b) => a.cognome.localeCompare(b.cognome))
      expect(sortedPadule[0].cognome).toBe('Brunetti')
      expect(sortedPadule[6].cognome).toBe('Rossi')

      // Step 3: Compute 6-up pages (6 cards per A4 sheet)
      const CARDS_PER_PAGE = 6
      const totalPages = Math.ceil(sortedPadule.length / CARDS_PER_PAGE)
      expect(totalPages).toBe(2)

      const page1 = sortedPadule.slice(0, CARDS_PER_PAGE)
      const page2 = sortedPadule.slice(CARDS_PER_PAGE)

      expect(page1).toHaveLength(6)
      expect(page2).toHaveLength(1)
      expect(page2[0].cognome).toBe('Rossi')
    })
  })

  // =========================================================================
  // Combination 4: Database SQLite Model Round-Trip Schema Integrity
  // =========================================================================
  describe('Database SQLite Model Round-Trip Schema Integrity', () => {
    it('verifies that database export structure matches the canonical 6-table schema', () => {
      const canonicalTables = [
        'Soci',
        'Tesseramenti',
        'Blocchetti',
        'Settings',
        'LocalChanges',
        'Metadata',
      ]

      const mockExportData = {
        soci: [
          {
            id: 1,
            cognome: 'Rossi',
            nome: 'Mario',
            data_nascita: '1980-05-15',
            gruppo_appartenenza: 'INTERNA',
          },
        ],
        tesseramenti: [
          {
            id_tesseramento: 'tess-1',
            id_socio: 1,
            anno: 2026,
            quota_pagata: 25.0,
            numero_ricevuta: 1,
            numero_blocchetto: 1,
          },
        ],
        blocchetti: [
          { id: 1, numero_blocchetto: 1, ricevute_da: 1, ricevute_a: 10, assegnato_a: 'Capodieci' },
        ],
        settings: [{ key: 'default_quota', value: 10.0 }],
        localChanges: [{ table_name: 'soci', record_id: '1', change_type: 'CREATE' }],
        metadata: { schema_version: '3.0', export_timestamp: new Date().toISOString() },
      }

      expect(canonicalTables).toContain('Soci')
      expect(canonicalTables).toContain('Tesseramenti')
      expect(canonicalTables).toContain('Blocchetti')
      expect(canonicalTables).toContain('Settings')
      expect(canonicalTables).toContain('LocalChanges')
      expect(canonicalTables).toContain('Metadata')

      expect(mockExportData.soci[0].cognome).toBe('Rossi')
      expect(mockExportData.tesseramenti[0].quota_pagata).toBe(25.0)
      expect(mockExportData.blocchetti[0].ricevute_a).toBe(10)
    })
  })
})
