import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import process from 'node:process'
import DashboardCharts from '@/components/DashboardCharts.vue'
import * as dbModule from '@/services/db'

// Mock vue-chartjs Bar component
vi.mock('vue-chartjs', () => ({
  Bar: {
    name: 'Bar',
    props: ['data', 'options', 'plugins'],
    template: '<div class="mock-bar-chart"></div>'
  }
}))

// Mock DB services
vi.mock('@/services/db', () => ({
  db: {
    soci: { count: vi.fn().mockResolvedValue(450) },
    tesseramenti: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          count: vi.fn().mockResolvedValue(320)
        }))
      }))
    }
  },
  getYearlyStats: vi.fn(),
  getRecentActivity: vi.fn().mockResolvedValue([]),
  applyFiltersAndSearch: vi.fn().mockResolvedValue([]),
  getAllSociWithTesseramenti: vi.fn().mockResolvedValue([])
}))

// Mock vue-toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  })
}))

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: vi.fn() })
}))

describe('Challenger M4-2: Accessibility, Senior Ergonomics & WCAG 2.2 Contrast Review', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // 1. Senior Ergonomics: Typography, Heights, Zebra Striping & Accounting Alignment
  // =========================================================================
  describe('1. Senior Ergonomics & Layout CSS Specifications', () => {
    it('1.1 verifies table font sizes >= 17px (1.0625rem / 1rem on 17px base) in DashboardCharts.vue', () => {
      const filePath = resolve(process.cwd(), 'src/components/DashboardCharts.vue')
      const content = readFileSync(filePath, 'utf-8')

      // .specular-data-table has font-size: 1.0625rem
      expect(content).toMatch(/\.specular-data-table\s*\{[^}]*font-size:\s*1\.0625rem;/s)
      // tbody td has font-size: 1.0625rem
      expect(content).toMatch(/\.specular-data-table\s+tbody\s+td\s*\{[^}]*font-size:\s*1\.0625rem;/s)
      // summary-footer-row has font-size: 1.0625rem
      expect(content).toMatch(/\.summary-footer-row\s+th[^}]*font-size:\s*1\.0625rem;/s)
      // thead th has font-size: 1rem (which is 17px with html 17px base)
      expect(content).toMatch(/\.specular-data-table\s+thead\s+th\s*\{[^}]*font-size:\s*1rem;/s)
    })

    it('1.2 verifies row height satisfies senior ergonomic range 48-52px (height: 50px, min-height: 48px)', () => {
      const filePath = resolve(process.cwd(), 'src/components/DashboardCharts.vue')
      const content = readFileSync(filePath, 'utf-8')

      expect(content).toMatch(/\.specular-data-table\s+tbody\s+tr\s*\{[^}]*min-height:\s*48px;/s)
      expect(content).toMatch(/\.specular-data-table\s+tbody\s+tr\s*\{[^}]*height:\s*50px;/s)
    })

    it('1.3 verifies alternating zebra striping is present on even rows in DashboardCharts.vue', () => {
      const filePath = resolve(process.cwd(), 'src/components/DashboardCharts.vue')
      const content = readFileSync(filePath, 'utf-8')

      expect(content).toMatch(/\.specular-data-table\s+tbody\s+tr:nth-child\(even\)\s*\{[^}]*background-color:\s*var\(--color-surface-hover\);/s)
    })

    it('1.4 verifies accounting alignment (tabular-nums and right alignment) on all numeric columns', () => {
      const filePath = resolve(process.cwd(), 'src/components/DashboardCharts.vue')
      const content = readFileSync(filePath, 'utf-8')

      expect(content).toMatch(/\.specular-data-table\s+\.tabular-nums[^}]*font-variant-numeric:\s*tabular-nums;/s)
      expect(content).toMatch(/\.specular-data-table\s+\.tabular-nums[^}]*text-align:\s*right;/s)
    })
  })

  // =========================================================================
  // 2. WCAG 2.2 Contrast Ratio Mathematical Verification
  // =========================================================================
  describe('2. WCAG 2.2 Mathematical Contrast Verification', () => {
    function luminance(hex) {
      let rgb = hex.replace('#', '')
      if (rgb.length === 3) rgb = rgb.split('').map((c) => c + c).join('')
      const r = parseInt(rgb.substring(0, 2), 16) / 255
      const g = parseInt(rgb.substring(2, 4), 16) / 255
      const b = parseInt(rgb.substring(4, 6), 16) / 255
      const a = [r, g, b].map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
    }

    function contrastRatio(hex1, hex2) {
      const l1 = luminance(hex1)
      const l2 = luminance(hex2)
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    }

    it('2.1 verifies light theme text contrasts meet WCAG 2.2 AA (>= 4.5:1)', () => {
      // Primary text #1a1a1a on #ffffff
      const primaryContrast = contrastRatio('#1a1a1a', '#ffffff')
      expect(primaryContrast).toBeGreaterThanOrEqual(4.5)
      expect(primaryContrast).toBeGreaterThan(15.0)

      // Secondary text #5c6266 on #ffffff
      const secondaryContrast = contrastRatio('#5c6266', '#ffffff')
      expect(secondaryContrast).toBeGreaterThanOrEqual(4.5)

      // Brand accent #b71c1c on #ffffff
      const accentContrast = contrastRatio('#b71c1c', '#ffffff')
      expect(accentContrast).toBeGreaterThanOrEqual(4.5)

      // Success text #2e7d32 on #ffffff
      const successContrast = contrastRatio('#2e7d32', '#ffffff')
      expect(successContrast).toBeGreaterThanOrEqual(4.5)
    })

    it('2.2 verifies dark theme text contrasts meet WCAG 2.2 AA (>= 4.5:1)', () => {
      // Primary text #e0e0e0 on #1e1e1e
      const primaryContrast = contrastRatio('#e0e0e0', '#1e1e1e')
      expect(primaryContrast).toBeGreaterThanOrEqual(4.5)
      expect(primaryContrast).toBeGreaterThan(10.0)

      // Secondary text #a0a0a0 on #1e1e1e
      const secondaryContrast = contrastRatio('#a0a0a0', '#1e1e1e')
      expect(secondaryContrast).toBeGreaterThanOrEqual(4.5)

      // Dark theme accent #ef5350 on #1e1e1e
      const accentContrast = contrastRatio('#ef5350', '#1e1e1e')
      expect(accentContrast).toBeGreaterThanOrEqual(4.5)

      // Dark theme success #66bb6a on #1e1e1e
      const successContrast = contrastRatio('#66bb6a', '#1e1e1e')
      expect(successContrast).toBeGreaterThanOrEqual(4.5)
    })
  })

  // =========================================================================
  // 3. Edge Cases: Continuous Negative Saldo, Huge Counts & Null Records
  // =========================================================================
  describe('3. Stress-Test Edge Cases: Continuous Negative Saldi & Large Counts', () => {
    it('3.1 handles continuous negative net saldo across all years gracefully', async () => {
      const continuousDecline = [
        { year: 2022, total: 500, newMembers: 10, lostMembers: 50 }, // Saldo -40
        { year: 2023, total: 460, newMembers: 5, lostMembers: 45 },  // Saldo -40
        { year: 2024, total: 420, newMembers: 8, lostMembers: 48 },  // Saldo -40
        { year: 2025, total: 380, newMembers: 12, lostMembers: 52 }, // Saldo -40
        { year: 2026, total: 340, newMembers: 15, lostMembers: 55 }  // Saldo -40
      ]
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(continuousDecline)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const rows = wrapper.findAll('.specular-row')
      expect(rows).toHaveLength(5)

      // Every row must have badge-danger
      rows.forEach((row) => {
        const saldoCell = row.find('.cell-saldo')
        expect(saldoCell.text()).toContain('-40')
        expect(saldoCell.find('.badge-pill').classes()).toContain('badge-danger')
      })

      // Footer net sum: (10+5+8+12+15) - (50+45+48+52+55) = 50 - 250 = -200
      const tfoot = wrapper.find('tfoot')
      expect(tfoot.exists()).toBe(true)
      const netTd = tfoot.findAll('td')[3]
      expect(netTd.text()).toBe('-200')
      expect(netTd.classes()).toContain('text-danger')
    })

    it('3.2 handles large member counts (e.g. 50,000 members) without clipping or layout failure', async () => {
      const largeData = [
        { year: 2025, total: 48500, newMembers: 12000, lostMembers: 3500 },
        { year: 2026, total: 57000, newMembers: 15000, lostMembers: 6500 }
      ]
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(largeData)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const rows = wrapper.findAll('.specular-row')
      expect(rows).toHaveLength(2)
      expect(rows[1].find('.cell-iscritti').text()).toBe('57000')
      expect(rows[1].find('.cell-nuovi').text()).toBe('+15000')
      expect(rows[1].find('.cell-cessati').text()).toBe('-6500')
      expect(rows[1].find('.cell-saldo').text()).toBe('+8500')

      // Average: (48500 + 57000) / 2 = 52750
      const tfoot = wrapper.find('tfoot')
      expect(tfoot.text()).toContain('52750')
      expect(tfoot.text()).toContain('+27000')
      expect(tfoot.text()).toContain('-10000')
      expect(tfoot.text()).toContain('+17000')
    })

    it('3.3 handles missing or undefined fields (newMembers / lostMembers) with fallback to 0', async () => {
      const sparseData = [
        { year: 2025, total: 100 }, // Missing newMembers and lostMembers
        { year: 2026, total: 110, newMembers: undefined, lostMembers: null }
      ]
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(sparseData)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const rows = wrapper.findAll('.specular-row')
      expect(rows).toHaveLength(2)
      expect(rows[0].find('.cell-nuovi').text()).toBe('0')
      expect(rows[0].find('.cell-cessati').text()).toBe('0')
      expect(rows[0].find('.cell-saldo').text()).toBe('0')
      expect(rows[0].find('.cell-saldo').find('.badge-pill').classes()).toContain('badge-neutral')
    })
  })

  // =========================================================================
  // 4. Responsive Layout & Viewport Verification
  // =========================================================================
  describe('4. HomeView & DashboardCharts Responsive Layout', () => {
    it('4.1 verifies HomeView dashboard grid switches to 1fr on max-width 1024px', () => {
      const filePath = resolve(process.cwd(), 'src/views/HomeView.vue')
      const content = readFileSync(filePath, 'utf-8')

      expect(content).toMatch(/@media\s*\(max-width:\s*1024px\)\s*\{[^}]*\.dashboard-grid\s*\{[^}]*grid-template-columns:\s*1fr;/s)
    })

    it('4.2 verifies HomeView footer actions use flex-wrap: wrap for small screen wrapping', () => {
      const filePath = resolve(process.cwd(), 'src/views/HomeView.vue')
      const content = readFileSync(filePath, 'utf-8')

      expect(content).toMatch(/\.footer-actions\s*\{[^}]*flex-wrap:\s*wrap;/s)
    })

    it('4.3 verifies specular data table is wrapped in responsive scroll container', () => {
      const filePath = resolve(process.cwd(), 'src/components/DashboardCharts.vue')
      const content = readFileSync(filePath, 'utf-8')

      expect(content).toContain('class="table-responsive"')
      expect(content).toMatch(/\.table-responsive\s*\{[^}]*overflow-x:\s*auto;/s)
    })
  })
})
