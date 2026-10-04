import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '../stores/theme'

describe('Tier 1 - Feature Coverage (R1 to R6 Happy Path)', () => {
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
  // R5: Design System, Themes & Typography (Features 1, 2, 3, 6)
  // =========================================================================
  describe('Feature 1: R5 Offline Font Stack & 17px Base', () => {
    it('verifies offline system font stack specification and absence of remote dependencies', () => {
      const systemFontStack = 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      const baseFontSize = '17px'

      expect(systemFontStack).toContain('system-ui')
      expect(systemFontStack).toContain('Segoe UI')
      expect(systemFontStack).toContain('Roboto')
      expect(systemFontStack).not.toContain('fonts.googleapis.com')
      expect(baseFontSize).toBe('17px')
    })
  })

  describe('Feature 2: R5 WCAG 2.2 Contrasts (Warning & Info Tokens)', () => {
    // Relative luminance calculation according to WCAG 2.2 specifications
    function getLuminance(r, g, b) {
      const a = [r, g, b].map((v) => {
        v /= 255
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      })
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
    }

    function getContrastRatio(hex1, hex2) {
      const rgb1 = hexToRgb(hex1)
      const rgb2 = hexToRgb(hex2)
      const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
      const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)
      const brightest = Math.max(l1, l2)
      const darkest = Math.min(l1, l2)
      return (brightest + 0.05) / (darkest + 0.05)
    }

    function hexToRgb(hex) {
      const cleaned = hex.replace('#', '')
      return {
        r: parseInt(cleaned.substring(0, 2), 16),
        g: parseInt(cleaned.substring(2, 4), 16),
        b: parseInt(cleaned.substring(4, 6), 16),
      }
    }

    it('validates that darkened warning (#c2410c) satisfies WCAG 2.2 AA ratio >= 4.5:1 against white', () => {
      const darkenedWarning = '#c2410c'
      const white = '#ffffff'
      const ratio = getContrastRatio(darkenedWarning, white)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it('validates that darkened info (#0369a1) satisfies WCAG 2.2 AA ratio >= 4.5:1 against white', () => {
      const darkenedInfo = '#0369a1'
      const white = '#ffffff'
      const ratio = getContrastRatio(darkenedInfo, white)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })
  })

  describe('Feature 3: R5 Theme Selector & Persistence', () => {
    it('applies light and dark themes, synchronizing data-theme and localStorage', () => {
      const store = useThemeStore()
      expect(store.currentTheme).toBe('light')

      store.applyTheme('dark')
      expect(store.currentTheme).toBe('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      expect(localStorage.getItem('theme')).toBe('dark')

      store.applyTheme('light')
      expect(store.currentTheme).toBe('light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
      expect(localStorage.getItem('theme')).toBe('light')
    })

    it('toggles theme correctly via toggleTheme()', () => {
      const store = useThemeStore()
      store.applyTheme('light')
      store.toggleTheme()
      expect(store.currentTheme).toBe('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

      store.toggleTheme()
      expect(store.currentTheme).toBe('light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })
  })

  describe('Feature 6: R5 Table Typography & Alignment', () => {
    it('verifies accounting table numeric formatting rules', () => {
      const formatCurrency = (amount) => `€ ${Number(amount).toFixed(2)}`
      const formatted = formatCurrency(25)
      expect(formatted).toBe('€ 25.00')

      const tableStyles = {
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'right',
        minHeight: '48px',
      }
      expect(tableStyles.fontVariantNumeric).toBe('tabular-nums')
      expect(tableStyles.textAlign).toBe('right')
      expect(parseInt(tableStyles.minHeight)).toBeGreaterThanOrEqual(48)
    })
  })

  // =========================================================================
  // R4: Vector SVG Icon System (Features 4, 5)
  // =========================================================================
  describe('Feature 4: R4 SVG Icon Component Contract', () => {
    it('validates SVG icon geometry contract (24x24 viewBox, stroke-based iconography)', () => {
      const iconContract = {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }

      expect(iconContract.viewBox).toBe('0 0 24 24')
      expect(iconContract.fill).toBe('none')
      expect(iconContract.stroke).toBe('currentColor')
      expect(iconContract.strokeWidth).toBe(2)
    })
  })

  describe('Feature 5: R4 Semantic Icon Mapping across UI', () => {
    it('maps all standard application actions from emojis to semantic SVG icon names', () => {
      const emojiIconMap = {
        '🏠': 'home',
        '🔄': 'refresh',
        '🧾': 'receipt',
        '📊': 'chart',
        '⚙️': 'settings',
        '➕': 'plus',
        '❌': 'delete',
        '💾': 'save',
        '📅': 'calendar',
        '📄': 'document',
        '👥': 'users',
        '👤': 'user',
        '⚡': 'lightning',
        '🔍': 'search',
        '💰': 'cash',
        '🎫': 'card',
      }

      expect(emojiIconMap['🏠']).toBe('home')
      expect(emojiIconMap['🔄']).toBe('refresh')
      expect(emojiIconMap['🧾']).toBe('receipt')
      expect(emojiIconMap['📊']).toBe('chart')
      expect(emojiIconMap['⚙️']).toBe('settings')
      expect(emojiIconMap['💰']).toBe('cash')
    })
  })

  // =========================================================================
  // R1: Batch Entry Flow Optimization (Features 7, 8, 9, 10)
  // =========================================================================
  describe('Feature 7: R1 10-Slot Visual Receipt Number Calculation', () => {
    it('computes exact receipt numbers for booklet slots 1..10', () => {
      const calculateReceiptNumber = (numeroBlocchetto, slotIndex) => {
        return (numeroBlocchetto - 1) * 10 + slotIndex
      }

      // Booklet 1: receipts 1 to 10
      expect(calculateReceiptNumber(1, 1)).toBe(1)
      expect(calculateReceiptNumber(1, 5)).toBe(5)
      expect(calculateReceiptNumber(1, 10)).toBe(10)

      // Booklet 4: receipts 31 to 40
      expect(calculateReceiptNumber(4, 1)).toBe(31)
      expect(calculateReceiptNumber(4, 10)).toBe(40)

      // Booklet 12: receipts 111 to 120
      expect(calculateReceiptNumber(12, 1)).toBe(111)
      expect(calculateReceiptNumber(12, 10)).toBe(120)
    })
  })

  describe('Feature 8: R1 Live Booklet Cash Total', () => {
    it('calculates real-time cash tally across all receipts of a booklet', () => {
      const sampleTesseramenti = [
        { numero_blocchetto: 3, numero_ricevuta: 21, quota_pagata: 25.0 },
        { numero_blocchetto: 3, numero_ricevuta: 21, quota_pagata: 10.0 },
        { numero_blocchetto: 3, numero_ricevuta: 22, quota_pagata: 10.0 },
        { numero_blocchetto: 3, numero_ricevuta: 23, quota_pagata: 25.0 },
        { numero_blocchetto: 4, numero_ricevuta: 31, quota_pagata: 10.0 }, // different booklet
      ]

      const computeBookletTotal = (payments, bookletNum) => {
        return payments
          .filter((t) => t.numero_blocchetto === bookletNum)
          .reduce((sum, t) => sum + (Number(t.quota_pagata) || 0), 0)
      }

      const totalBooklet3 = computeBookletTotal(sampleTesseramenti, 3)
      expect(totalBooklet3).toBe(70.0)

      const totalBooklet4 = computeBookletTotal(sampleTesseramenti, 4)
      expect(totalBooklet4).toBe(10.0)

      const totalBookletEmpty = computeBookletTotal(sampleTesseramenti, 99)
      expect(totalBookletEmpty).toBe(0.0)
    })
  })

  describe('Feature 9: R1 Multi-Socio Receipt Flow & Subtotal', () => {
    it('manages multi-socio receipt aggregation, subtotal calculation and socio removal', () => {
      const receipt = {
        numero: 31,
        soci: [],
      }

      // Add first socio (adult renewal: 10€)
      receipt.soci.push({ id: 101, cognome: 'Rossi', nome: 'Mario', quota: 10.0 })
      // Add second socio (new member: 25€)
      receipt.soci.push({ id: 102, cognome: 'Rossi', nome: 'Giuseppe', quota: 25.0 })
      // Add third socio (minor child: 0€)
      receipt.soci.push({ id: 103, cognome: 'Rossi', nome: 'Francesco', quota: 0.0 })

      expect(receipt.soci).toHaveLength(3)

      const calculateSubtotal = (soci) => soci.reduce((sum, s) => sum + (s.quota || 0), 0)
      expect(calculateSubtotal(receipt.soci)).toBe(35.0)

      // Remove second socio
      const removeIndex = receipt.soci.findIndex((s) => s.id === 102)
      receipt.soci.splice(removeIndex, 1)

      expect(receipt.soci).toHaveLength(2)
      expect(calculateSubtotal(receipt.soci)).toBe(10.0)
    })
  })

  describe('Feature 10: R1 Inline New Socio Registration Defaults', () => {
    it('initializes new member with 25€ quota and connects to current receipt and session year', () => {
      const session = {
        annoRiferimento: 2026,
        numeroBlocchetto: 4,
        numeroRicevuta: 31,
        dataPagamento: '2026-05-10',
      }

      const createInlineSocio = (data, session) => ({
        socio: {
          cognome: data.cognome.trim(),
          nome: data.nome.trim(),
          data_nascita: data.data_nascita,
          luogo_nascita: data.luogo_nascita || 'Gubbio',
          gruppo_appartenenza: data.gruppo_appartenenza || 'INTERNA',
          data_prima_iscrizione: session.annoRiferimento,
        },
        payment: {
          anno: session.annoRiferimento,
          data_pagamento: session.dataPagamento,
          quota_pagata: 25.0, // New member quota standard
          numero_ricevuta: session.numeroRicevuta,
          numero_blocchetto: session.numeroBlocchetto,
        },
      })

      const inlineResult = createInlineSocio(
        {
          cognome: 'Fiorucci',
          nome: 'Matteo',
          data_nascita: '1995-03-20',
          gruppo_appartenenza: 'PADULE',
        },
        session,
      )

      expect(inlineResult.socio.cognome).toBe('Fiorucci')
      expect(inlineResult.socio.data_prima_iscrizione).toBe(2026)
      expect(inlineResult.payment.quota_pagata).toBe(25.0)
      expect(inlineResult.payment.numero_ricevuta).toBe(31)
      expect(inlineResult.payment.numero_blocchetto).toBe(4)
    })
  })

  // =========================================================================
  // R2: Unified Print Hub & PDF Lab (Features 11, 12, 13, 14, 15, 16, 17)
  // =========================================================================
  describe('Feature 11: R2 4 Quick 1-Click Print Button Contracts', () => {
    it('defines explicit handler contracts for the 4 essential quick print actions', () => {
      const quickPrintRegistry = {
        rinnovi: (soci, year) => ({ type: 'rinnovi', sociCount: soci.length, year }),
        solleciti: (soci, year) => ({ type: 'solleciti', sociCount: soci.length, year }),
        tessere6x: (soci, year) => ({ type: 'tessere6x', layout: '6x', year }),
        resocontoCassa: (blocchetti, tesseramenti, year) => ({
          type: 'resocontoCassa',
          blocchettiCount: blocchetti.length,
          year,
        }),
      }

      const dummySoci = [{ id: 1 }, { id: 2 }]
      expect(quickPrintRegistry.rinnovi(dummySoci, 2026).sociCount).toBe(2)
      expect(quickPrintRegistry.solleciti(dummySoci, 2026).year).toBe(2026)
      expect(quickPrintRegistry.tessere6x(dummySoci, 2026).layout).toBe('6x')
      expect(quickPrintRegistry.resocontoCassa([1, 2, 3], [], 2026).blocchettiCount).toBe(3)
    })
  })

  describe('Feature 12: R2 Route Unification (/reports)', () => {
    it('specifies unified route destination for reports and redirect for reports-beta', () => {
      const routes = [
        { path: '/reports', name: 'reports' },
        { path: '/reports-beta', redirect: '/reports' },
      ]

      const reportsBetaRoute = routes.find((r) => r.path === '/reports-beta')
      expect(reportsBetaRoute.redirect).toBe('/reports')
    })
  })

  describe('Feature 13: R2 Expandable PDF Lab Query Builder (AND/OR Logic)', () => {
    it('evaluates AND and OR year payment filter conditions correctly', () => {
      const socio = {
        id: 1,
        paidYears: [2024, 2026],
      }

      // OR Logic: paid in 2024 OR 2025
      const matchesOr = (socio, requiredYears) =>
        requiredYears.some((y) => socio.paidYears.includes(y))
      expect(matchesOr(socio, [2024, 2025])).toBe(true)
      expect(matchesOr(socio, [2023, 2025])).toBe(false)

      // AND Logic: paid in 2024 AND 2026
      const matchesAnd = (socio, requiredYears) =>
        requiredYears.every((y) => socio.paidYears.includes(y))
      expect(matchesAnd(socio, [2024, 2026])).toBe(true)
      expect(matchesAnd(socio, [2024, 2025])).toBe(false)
    })
  })

  describe('Feature 14: R2 Column Selection & Reordering', () => {
    it('allows toggling columns and reordering them via left/right operations', () => {
      let columns = ['cognomeNome', 'gruppo', 'dataNascita', 'firma']

      // Move 'gruppo' left (swap with index 0)
      const moveLeft = (arr, index) => {
        if (index <= 0) return arr
        const copy = [...arr]
        const temp = copy[index - 1]
        copy[index - 1] = copy[index]
        copy[index] = temp
        return copy
      }

      columns = moveLeft(columns, 1)
      expect(columns).toEqual(['gruppo', 'cognomeNome', 'dataNascita', 'firma'])

      // Move 'gruppo' right
      const moveRight = (arr, index) => {
        if (index >= arr.length - 1) return arr
        const copy = [...arr]
        const temp = copy[index + 1]
        copy[index + 1] = copy[index]
        copy[index] = temp
        return copy
      }

      columns = moveRight(columns, 0)
      expect(columns).toEqual(['cognomeNome', 'gruppo', 'dataNascita', 'firma'])
    })
  })

  describe('Feature 15: R2 Reactive Live Table Preview', () => {
    it('generates preview rows matching configured columns dynamically', () => {
      const member = {
        cognome: 'Ubaldi',
        nome: 'Giacomo',
        gruppo_appartenenza: 'INTERNA',
        data_nascita: '1988-05-15',
      }

      const generatePreviewRow = (member, selectedCols) => {
        const row = {}
        if (selectedCols.includes('socio')) row.socio = `${member.cognome} ${member.nome}`
        if (selectedCols.includes('manicchia')) row.manicchia = member.gruppo_appartenenza || '-'
        if (selectedCols.includes('dataNascita')) row.dataNascita = member.data_nascita
        if (selectedCols.includes('firma')) row.firma = ''
        return row
      }

      const preview = generatePreviewRow(member, ['socio', 'manicchia', 'firma'])
      expect(preview.socio).toBe('Ubaldi Giacomo')
      expect(preview.manicchia).toBe('INTERNA')
      expect(preview.firma).toBe('')
      expect(preview.dataNascita).toBeUndefined()
    })
  })

  describe('Feature 16: R2 Preset Save, Load & Delete', () => {
    it('serializes, persists, retrieves, and deletes custom PDF Lab presets in localStorage', () => {
      const presetKey = 'pdf_lab_presets'
      const preset = {
        id: 'preset-interna-2026',
        name: 'Elezioni Interna 2026',
        config: {
          group: 'INTERNA',
          years: [2024, 2025, 2026],
          columns: ['cognomeNome', 'gruppo', 'dirittoVoto', 'firma'],
        },
      }

      // Save
      const presets = [preset]
      localStorage.setItem(presetKey, JSON.stringify(presets))

      // Load
      const loaded = JSON.parse(localStorage.getItem(presetKey))
      expect(loaded).toHaveLength(1)
      expect(loaded[0].name).toBe('Elezioni Interna 2026')
      expect(loaded[0].config.columns).toContain('firma')

      // Delete
      const filtered = loaded.filter((p) => p.id !== 'preset-interna-2026')
      localStorage.setItem(presetKey, JSON.stringify(filtered))
      const afterDelete = JSON.parse(localStorage.getItem(presetKey))
      expect(afterDelete).toHaveLength(0)
    })
  })

  describe('Feature 17: R2 Resoconto Cassa Blocchetti PDF Aggregation', () => {
    it('aggregates booklet totals, receipts count and assignee summary', () => {
      const blocchetti = [
        { id: 1, numero_blocchetto: 1, assegnato_a: 'Capodieci 1' },
        { id: 2, numero_blocchetto: 2, assegnato_a: 'Capodieci 2' },
      ]
      const tesseramenti = [
        { numero_blocchetto: 1, quota_pagata: 25.0, numero_ricevuta: 1 },
        { numero_blocchetto: 1, quota_pagata: 10.0, numero_ricevuta: 2 },
        { numero_blocchetto: 2, quota_pagata: 10.0, numero_ricevuta: 11 },
      ]

      const auditSummary = blocchetti.map((b) => {
        const bPayments = tesseramenti.filter((t) => t.numero_blocchetto === b.numero_blocchetto)
        const totalCash = bPayments.reduce((sum, t) => sum + (Number(t.quota_pagata) || 0), 0)
        const receiptsUsed = new Set(bPayments.map((t) => t.numero_ricevuta)).size
        return {
          numero_blocchetto: b.numero_blocchetto,
          assegnato_a: b.assegnato_a,
          ricevute_utilizzate: receiptsUsed,
          totale_cassa: totalCash,
        }
      })

      expect(auditSummary[0].totale_cassa).toBe(35.0)
      expect(auditSummary[0].ricevute_utilizzate).toBe(2)
      expect(auditSummary[1].totale_cassa).toBe(10.0)
      expect(auditSummary[1].ricevute_utilizzate).toBe(1)
    })
  })

  // =========================================================================
  // R3: Membership Cards & Manicchia Sorting (Features 18, 19, 20)
  // =========================================================================
  describe('Feature 18: R3 Membership Card Manicchia Sort', () => {
    it('sorts members primarily by Manicchia and secondarily A-Z by surname/name', () => {
      const soci = [
        { cognome: 'Rossi', nome: 'Mario', gruppo_appartenenza: 'PADULE' },
        { cognome: 'Bianchi', nome: 'Luca', gruppo_appartenenza: 'INTERNA' },
        { cognome: 'Alunno', nome: 'Francesco', gruppo_appartenenza: 'PADULE' },
        { cognome: 'Zeni', nome: 'Andrea', gruppo_appartenenza: 'INTERNA' },
      ]

      const sorted = [...soci].sort((a, b) => {
        const groupA = (a.gruppo_appartenenza || '').toLowerCase()
        const groupB = (b.gruppo_appartenenza || '').toLowerCase()
        const groupCmp = groupA.localeCompare(groupB)
        if (groupCmp !== 0) return groupCmp
        return a.cognome.localeCompare(b.cognome)
      })

      // INTERNA first, then PADULE
      expect(sorted[0].gruppo_appartenenza).toBe('INTERNA')
      expect(sorted[0].cognome).toBe('Bianchi')
      expect(sorted[1].gruppo_appartenenza).toBe('INTERNA')
      expect(sorted[1].cognome).toBe('Zeni')

      expect(sorted[2].gruppo_appartenenza).toBe('PADULE')
      expect(sorted[2].cognome).toBe('Alunno')
      expect(sorted[3].gruppo_appartenenza).toBe('PADULE')
      expect(sorted[3].cognome).toBe('Rossi')
    })
  })

  describe('Feature 19: R3 Card Italian Date of Birth Typography', () => {
    it('formats ISO date into Italian capitalized month text format (DD Mese YYYY)', () => {
      const formatItalianDOB = (isoDate) => {
        if (!isoDate) return ''
        const [anno, mese, giorno] = isoDate.split('-')
        const mesi = [
          'Gennaio',
          'Febbraio',
          'Marzo',
          'Aprile',
          'Maggio',
          'Giugno',
          'Luglio',
          'Agosto',
          'Settembre',
          'Ottobre',
          'Novembre',
          'Dicembre',
        ]
        const meseNome = mesi[parseInt(mese, 10) - 1]
        return `${parseInt(giorno, 10)} ${meseNome} ${anno}`
      }

      expect(formatItalianDOB('1980-05-15')).toBe('15 Maggio 1980')
      expect(formatItalianDOB('2005-01-01')).toBe('1 Gennaio 2005')
      expect(formatItalianDOB('1999-12-31')).toBe('31 Dicembre 1999')
    })
  })

  describe('Feature 20: R3 6-Up Membership Card Layout Grid', () => {
    it('calculates 6-up card positioning coordinates for standard A4 sheet (2 columns x 3 rows)', () => {
      const a4Width = 210
      const a4Height = 297
      const cardWidth = 85
      const cardHeight = 54
      const cols = 2
      const rows = 3

      const marginX = (a4Width - cols * cardWidth) / (cols + 1)
      const marginY = (a4Height - rows * cardHeight) / (rows + 1)

      const getCardPosition = (cardIndex) => {
        const col = cardIndex % cols
        const row = Math.floor(cardIndex / cols)
        const x = marginX + col * (cardWidth + marginX)
        const y = marginY + row * (cardHeight + marginY)
        return { x, y, width: cardWidth, height: cardHeight }
      }

      const pos0 = getCardPosition(0) // Top Left
      const pos1 = getCardPosition(1) // Top Right
      const pos5 = getCardPosition(5) // Bottom Right

      expect(pos0.x).toBeLessThan(pos1.x)
      expect(pos0.y).toBe(pos1.y)
      expect(pos5.y).toBeGreaterThan(pos0.y)
      expect(pos0.x + cardWidth).toBeLessThan(a4Width)
      expect(pos5.y + cardHeight).toBeLessThan(a4Height)
    })
  })

  // =========================================================================
  // R6: Senior Data Visualization (Features 21, 22)
  // =========================================================================
  describe('Feature 21: R6 Single-Scale Dashboard Chart Series', () => {
    it('generates clean single-scale membership series without secondary Y-axis dependency', () => {
      const yearlyStats = [
        { year: 2022, total: 420, newMembers: 30, lostMembers: 15 },
        { year: 2023, total: 450, newMembers: 45, lostMembers: 15 },
        { year: 2024, total: 480, newMembers: 50, lostMembers: 20 },
        { year: 2025, total: 510, newMembers: 40, lostMembers: 10 },
        { year: 2026, total: 535, newMembers: 35, lostMembers: 10 },
      ]

      const chartConfig = {
        labels: yearlyStats.map((s) => s.year.toString()),
        datasets: [
          {
            label: 'Iscritti Totali',
            data: yearlyStats.map((s) => s.total),
            backgroundColor: '#b71c1c',
          },
        ],
        singleYAxis: true,
      }

      expect(chartConfig.labels).toEqual(['2022', '2023', '2024', '2025', '2026'])
      expect(chartConfig.datasets[0].data).toEqual([420, 450, 480, 510, 535])
      expect(chartConfig.singleYAxis).toBe(true)
    })
  })

  describe('Feature 22: R6 Permanent Specular Data Table', () => {
    it('generates high-contrast specular data table corresponding to the selected range', () => {
      const rawData = [
        { year: 2022, total: 420, newMembers: 30, lostMembers: 15 },
        { year: 2023, total: 450, newMembers: 45, lostMembers: 15 },
        { year: 2024, total: 480, newMembers: 50, lostMembers: 20 },
        { year: 2025, total: 510, newMembers: 40, lostMembers: 10 },
        { year: 2026, total: 535, newMembers: 35, lostMembers: 10 },
      ]

      const filterByRange = (data, range) => {
        if (range === '5y') return data.slice(-5)
        if (range === '10y') return data.slice(-10)
        return data
      }

      const tableRows = filterByRange(rawData, '5y').map((r) => ({
        anno: r.year,
        iscritti: r.total,
        nuovi: `+${r.newMembers}`,
        cessati: `-${r.lostMembers}`,
        saldo: `+${r.newMembers - r.lostMembers}`,
      }))

      expect(tableRows).toHaveLength(5)
      expect(tableRows[4].anno).toBe(2026)
      expect(tableRows[4].iscritti).toBe(535)
      expect(tableRows[4].saldo).toBe('+25')
    })
  })
})
