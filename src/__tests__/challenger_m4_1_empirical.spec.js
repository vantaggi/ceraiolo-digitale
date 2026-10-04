import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import process from 'node:process'
import DashboardCharts from '@/components/DashboardCharts.vue'
import * as dbModule from '@/services/db'

// Mock vue-chartjs Bar component with full prop exposure
vi.mock('vue-chartjs', () => ({
  Bar: {
    name: 'Bar',
    props: ['data', 'options', 'plugins'],
    template: `
      <div 
        class="mock-bar-chart" 
        :data-labels-count="data?.labels?.length || 0" 
        :data-datasets-count="data?.datasets?.length || 0"
      >
        <span class="mock-labels">{{ (data?.labels || []).join(',') }}</span>
        <span class="mock-values">{{ (data?.datasets?.[0]?.data || []).join(',') }}</span>
      </div>
    `
  }
}))

// Mock getYearlyStats
vi.mock('@/services/db', () => ({
  getYearlyStats: vi.fn()
}))

describe('Challenger M4-1: Empirical & Adversarial Test Suite for Senior Data Visualization (R6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // 1. Stress-Test: Complete Absence of scales.y1 across All States
  // =========================================================================
  describe('1. Scale Architecture & Dual Y-Axis Elimination Stress-Test', () => {
    const historical12y = [
      { year: 2015, total: 300, newMembers: 20, lostMembers: 10 },
      { year: 2016, total: 320, newMembers: 25, lostMembers: 5 },
      { year: 2017, total: 340, newMembers: 30, lostMembers: 10 },
      { year: 2018, total: 360, newMembers: 30, lostMembers: 10 },
      { year: 2019, total: 380, newMembers: 25, lostMembers: 5 },
      { year: 2020, total: 370, newMembers: 10, lostMembers: 20 },
      { year: 2021, total: 390, newMembers: 30, lostMembers: 10 },
      { year: 2022, total: 410, newMembers: 30, lostMembers: 10 },
      { year: 2023, total: 430, newMembers: 30, lostMembers: 10 },
      { year: 2024, total: 450, newMembers: 30, lostMembers: 10 },
      { year: 2025, total: 480, newMembers: 40, lostMembers: 10 },
      { year: 2026, total: 500, newMembers: 30, lostMembers: 10 }
    ]

    it('1.1 verifies scales.y1 is strictly undefined across all range switches (5y -> 10y -> all -> 5y)', async () => {
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(JSON.parse(JSON.stringify(historical12y)))
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const barComponent = wrapper.findComponent({ name: 'Bar' })
      expect(barComponent.exists()).toBe(true)

      const rangeBtns = wrapper.findAll('.range-btn')
      expect(rangeBtns).toHaveLength(3)

      // Range '5y' (default)
      let options = barComponent.props('options')
      expect(options.scales.y).toBeDefined()
      expect(options.scales.y1).toBeUndefined()
      expect(options.scales.y.position).toBe('left')
      expect(barComponent.props('data').datasets[0].yAxisID).toBe('y')

      // Switch to '10y'
      await rangeBtns[1].trigger('click')
      await flushPromises()
      options = barComponent.props('options')
      expect(options.scales.y1).toBeUndefined()
      expect(barComponent.props('data').datasets[0].yAxisID).toBe('y')

      // Switch to 'all'
      await rangeBtns[2].trigger('click')
      await flushPromises()
      options = barComponent.props('options')
      expect(options.scales.y1).toBeUndefined()
      expect(barComponent.props('data').datasets[0].yAxisID).toBe('y')

      // Switch back to '5y'
      await rangeBtns[0].trigger('click')
      await flushPromises()
      options = barComponent.props('options')
      expect(options.scales.y1).toBeUndefined()
      expect(barComponent.props('data').datasets[0].yAxisID).toBe('y')
    })

    it('1.2 asserts single dataset structure: exactly 1 dataset bound to yAxisID "y" with no secondary axis', async () => {
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(JSON.parse(JSON.stringify(historical12y)))
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const barComponent = wrapper.findComponent({ name: 'Bar' })
      const chartData = barComponent.props('data')

      expect(chartData.datasets).toHaveLength(1)
      expect(chartData.datasets[0].label).toBe('Totale Iscritti')
      expect(chartData.datasets[0].yAxisID).toBe('y')
      expect(chartData.datasets[0].borderColor).toBe('#b71c1c')

      // Ensure no dataset references y1
      const anyY1 = chartData.datasets.some((ds) => ds.yAxisID === 'y1' || ds.yAxisID === 'Y1')
      expect(anyY1).toBe(false)
    })

    it('1.3 code AST/string scan: verifies zero occurrence of scales.y1 and position right in DashboardCharts.vue', () => {
      const filePath = resolve(process.cwd(), 'src/components/DashboardCharts.vue')
      const source = readFileSync(filePath, 'utf-8')

      expect(source).not.toContain('scales.y1')
      expect(source).not.toContain("y1: {")
      expect(source).not.toContain("y1:{")
      expect(source).not.toContain("yAxisID: 'y1'")
      expect(source).not.toContain('position: "right"')
      expect(source).not.toContain("position: 'right'")
    })
  })

  // =========================================================================
  // 2. Synchronous Reactivity: Chart Datasets vs. Specular Table Rows
  // =========================================================================
  describe('2. Synchronous Reactivity: Chart & Specular Table Lockstep Verification', () => {
    const historical12y = [
      { year: 2015, total: 310, newMembers: 20, lostMembers: 10 },
      { year: 2016, total: 330, newMembers: 25, lostMembers: 5 },
      { year: 2017, total: 350, newMembers: 25, lostMembers: 5 },
      { year: 2018, total: 370, newMembers: 25, lostMembers: 5 },
      { year: 2019, total: 390, newMembers: 25, lostMembers: 5 },
      { year: 2020, total: 375, newMembers: 10, lostMembers: 25 },
      { year: 2021, total: 400, newMembers: 35, lostMembers: 10 },
      { year: 2022, total: 425, newMembers: 30, lostMembers: 5 },
      { year: 2023, total: 450, newMembers: 30, lostMembers: 5 },
      { year: 2024, total: 475, newMembers: 30, lostMembers: 5 },
      { year: 2025, total: 500, newMembers: 30, lostMembers: 5 },
      { year: 2026, total: 530, newMembers: 35, lostMembers: 5 }
    ]

    it('2.1 ensures identical counts, labels, and figures between chartData and specular rows under 5y, 10y, all', async () => {
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(JSON.parse(JSON.stringify(historical12y)))
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const barComponent = wrapper.findComponent({ name: 'Bar' })
      const rangeBtns = wrapper.findAll('.range-btn')

      const verifySynchrony = (expectedCount, expectedStartYear, expectedEndYear) => {
        const chartData = barComponent.props('data')
        const rows = wrapper.findAll('.specular-row')

        // 1. Exact count parity
        expect(chartData.labels).toHaveLength(expectedCount)
        expect(chartData.datasets[0].data).toHaveLength(expectedCount)
        expect(rows).toHaveLength(expectedCount)

        // 2. Start and end boundary parity
        expect(chartData.labels[0]).toBe(expectedStartYear)
        expect(chartData.labels[expectedCount - 1]).toBe(expectedEndYear)

        // 3. Specular row-by-row and point-by-point lockstep verification
        for (let i = 0; i < expectedCount; i++) {
          const chartYear = chartData.labels[i]
          const chartVal = chartData.datasets[0].data[i]

          const rowAnno = Number(rows[i].find('.cell-anno').text())
          const rowIscritti = Number(rows[i].find('.cell-iscritti').text())

          expect(rowAnno).toBe(chartYear)
          expect(rowIscritti).toBe(chartVal)
        }
      }

      // 1. Initial default '5y': 2022 to 2026 (5 years)
      verifySynchrony(5, 2022, 2026)
      expect(rangeBtns[0].classes()).toContain('active')
      expect(rangeBtns[0].attributes('aria-pressed')).toBe('true')
      expect(wrapper.find('.range-badge').text()).toContain('5 Anni (5 anni)')

      // 2. Switch to '10y': 2017 to 2026 (10 years)
      await rangeBtns[1].trigger('click')
      await flushPromises()
      verifySynchrony(10, 2017, 2026)
      expect(rangeBtns[1].classes()).toContain('active')
      expect(rangeBtns[1].attributes('aria-pressed')).toBe('true')
      expect(wrapper.find('.range-badge').text()).toContain('10 Anni (10 anni)')

      // 3. Switch to 'all': 2015 to 2026 (12 years)
      await rangeBtns[2].trigger('click')
      await flushPromises()
      verifySynchrony(12, 2015, 2026)
      expect(rangeBtns[2].classes()).toContain('active')
      expect(rangeBtns[2].attributes('aria-pressed')).toBe('true')
      expect(wrapper.find('.range-badge').text()).toContain('Tutto (12 anni)')
    })

    it('2.2 stress-tests rapid erratic range button toggling without state drift or race conditions', async () => {
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(JSON.parse(JSON.stringify(historical12y)))
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const barComponent = wrapper.findComponent({ name: 'Bar' })
      const rangeBtns = wrapper.findAll('.range-btn')

      // Rapid toggling: 5y -> all -> 10y -> 5y -> 10y -> all -> 5y
      const switchSequence = [
        { index: 2, count: 12, range: 'all' },
        { index: 1, count: 10, range: '10y' },
        { index: 0, count: 5, range: '5y' },
        { index: 1, count: 10, range: '10y' },
        { index: 2, count: 12, range: 'all' },
        { index: 0, count: 5, range: '5y' }
      ]

      for (const step of switchSequence) {
        await rangeBtns[step.index].trigger('click')
        await flushPromises()

        const chartData = barComponent.props('data')
        const rows = wrapper.findAll('.specular-row')

        expect(chartData.labels).toHaveLength(step.count)
        expect(rows).toHaveLength(step.count)
        expect(rangeBtns[step.index].classes()).toContain('active')
      }
    })
  })

  // =========================================================================
  // 3. Boundary Dataset Lengths Stress-Test
  // =========================================================================
  describe('3. Boundary Range Lengths & Extreme Dataset Sizes', () => {
    it('3.1 Boundary 0 Years: empty dataset returns gracefully with empty-state and no crash', async () => {
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue([])
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      // Canvas/Bar component receives empty data
      const barComponent = wrapper.findComponent({ name: 'Bar' })
      expect(barComponent.props('data').labels).toEqual([])
      expect(barComponent.props('data').datasets[0].data).toEqual([])

      // Table displays single empty-state row
      expect(wrapper.findAll('.specular-row')).toHaveLength(0)
      const emptyCell = wrapper.find('.empty-state-cell')
      expect(emptyCell.exists()).toBe(true)
      expect(emptyCell.text()).toContain("Nessun dato storico disponibile")

      // Summary footer (tfoot) must not be rendered
      expect(wrapper.find('tfoot').exists()).toBe(false)

      // Stat cards safely show zero
      const statValues = wrapper.findAll('.stat-value')
      expect(statValues[0].text()).toBe('0')
      expect(statValues[1].text()).toBe('0')
      expect(statValues[2].text()).toBe('0')
    })

    it('3.2 Boundary 0 Years (all zeros): trims zero-only records and treats as empty history', async () => {
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue([
        { year: 2023, total: 0, newMembers: 0, lostMembers: 0 },
        { year: 2024, total: 0, newMembers: 0, lostMembers: 0 }
      ])
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      expect(wrapper.findAll('.specular-row')).toHaveLength(0)
      expect(wrapper.find('.empty-state-cell').exists()).toBe(true)
    })

    it('3.3 Boundary 1 Year: singular badge, no tfoot crash, single row in chart and table', async () => {
      const data1y = [{ year: 2026, total: 250, newMembers: 15, lostMembers: 5 }]
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(data1y)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const barComponent = wrapper.findComponent({ name: 'Bar' })
      expect(barComponent.props('data').labels).toEqual([2026])
      expect(barComponent.props('data').datasets[0].data).toEqual([250])

      const rows = wrapper.findAll('.specular-row')
      expect(rows).toHaveLength(1)
      expect(rows[0].find('.cell-anno').text()).toBe('2026')
      expect(rows[0].find('.cell-iscritti').text()).toBe('250')
      expect(rows[0].find('.cell-nuovi').text()).toBe('+15')
      expect(rows[0].find('.cell-cessati').text()).toBe('-5')
      expect(rows[0].find('.cell-saldo').text()).toBe('+10')

      // Range badge must say '1 anno' singular
      expect(wrapper.find('.range-badge').text()).toContain('5 Anni (1 anno)')

      // tfoot must NOT render for length <= 1 (cannot compute meaningful variations or averages)
      expect(wrapper.find('tfoot').exists()).toBe(false)

      // Range switching stays at 1 row across all buttons
      const rangeBtns = wrapper.findAll('.range-btn')
      await rangeBtns[1].trigger('click') // 10y
      await flushPromises()
      expect(wrapper.findAll('.specular-row')).toHaveLength(1)
      expect(wrapper.find('.range-badge').text()).toContain('10 Anni (1 anno)')

      await rangeBtns[2].trigger('click') // all
      await flushPromises()
      expect(wrapper.findAll('.specular-row')).toHaveLength(1)
      expect(wrapper.find('.range-badge').text()).toContain('Tutto (1 anno)')
    })

    it('3.4 Boundary 3 Years (< 5 years): slices safely, tfoot renders with exact averages', async () => {
      const data3y = [
        { year: 2024, total: 300, newMembers: 30, lostMembers: 10 },
        { year: 2025, total: 330, newMembers: 40, lostMembers: 10 },
        { year: 2026, total: 360, newMembers: 40, lostMembers: 10 }
      ]
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(data3y)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      // Available data is 3 years: 5y, 10y, all must all render 3 rows
      expect(wrapper.findAll('.specular-row')).toHaveLength(3)
      expect(wrapper.findComponent({ name: 'Bar' }).props('data').labels).toHaveLength(3)

      // tfoot must render because length > 1
      const tfoot = wrapper.find('tfoot')
      expect(tfoot.exists()).toBe(true)
      // Average: (300 + 330 + 360) / 3 = 330
      expect(tfoot.text()).toContain('330')
      // Sum new: 30 + 40 + 40 = 110 -> "+110"
      expect(tfoot.text()).toContain('+110')
      // Sum lost: 10 + 10 + 10 = 30 -> "-30"
      expect(tfoot.text()).toContain('-30')
      // Net sum: 110 - 30 = +80 -> "+80"
      expect(tfoot.text()).toContain('+80')
    })

    it('3.5 Boundary Exactly 5 Years: exact threshold behavior', async () => {
      const data5y = [
        { year: 2022, total: 200, newMembers: 20, lostMembers: 5 },
        { year: 2023, total: 215, newMembers: 20, lostMembers: 5 },
        { year: 2024, total: 230, newMembers: 20, lostMembers: 5 },
        { year: 2025, total: 245, newMembers: 20, lostMembers: 5 },
        { year: 2026, total: 260, newMembers: 20, lostMembers: 5 }
      ]
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(data5y)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const rangeBtns = wrapper.findAll('.range-btn')

      // '5y' -> 5 rows
      expect(wrapper.findAll('.specular-row')).toHaveLength(5)
      // '10y' -> exactly 5 rows (capped by available data)
      await rangeBtns[1].trigger('click')
      await flushPromises()
      expect(wrapper.findAll('.specular-row')).toHaveLength(5)
      // 'all' -> exactly 5 rows
      await rangeBtns[2].trigger('click')
      await flushPromises()
      expect(wrapper.findAll('.specular-row')).toHaveLength(5)
    })

    it('3.6 Boundary 7 Years (between 5 and 10): differentiates 5y and 10y ranges', async () => {
      const data7y = [
        { year: 2020, total: 100, newMembers: 10, lostMembers: 5 },
        { year: 2021, total: 110, newMembers: 15, lostMembers: 5 },
        { year: 2022, total: 125, newMembers: 20, lostMembers: 5 },
        { year: 2023, total: 140, newMembers: 20, lostMembers: 5 },
        { year: 2024, total: 155, newMembers: 20, lostMembers: 5 },
        { year: 2025, total: 170, newMembers: 20, lostMembers: 5 },
        { year: 2026, total: 185, newMembers: 20, lostMembers: 5 }
      ]
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(data7y)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const rangeBtns = wrapper.findAll('.range-btn')

      // 5y -> exactly 5 rows (2022 to 2026)
      let rows = wrapper.findAll('.specular-row')
      expect(rows).toHaveLength(5)
      expect(rows[0].find('.cell-anno').text()).toBe('2022')
      expect(rows[4].find('.cell-anno').text()).toBe('2026')

      // 10y -> exactly 7 rows (all 7 available)
      await rangeBtns[1].trigger('click')
      await flushPromises()
      rows = wrapper.findAll('.specular-row')
      expect(rows).toHaveLength(7)
      expect(rows[0].find('.cell-anno').text()).toBe('2020')
      expect(rows[6].find('.cell-anno').text()).toBe('2026')

      // all -> exactly 7 rows
      await rangeBtns[2].trigger('click')
      await flushPromises()
      rows = wrapper.findAll('.specular-row')
      expect(rows).toHaveLength(7)
      expect(rows[0].find('.cell-anno').text()).toBe('2020')
    })

    it('3.7 Boundary 15 Years (> 10 years): slices 5y, 10y, and all into 5, 10, and 15 items', async () => {
      const data15y = Array.from({ length: 15 }, (_, i) => ({
        year: 2012 + i,
        total: 200 + i * 20,
        newMembers: 25,
        lostMembers: 5
      }))
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(data15y)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const rangeBtns = wrapper.findAll('.range-btn')

      // 5y -> 5 items
      expect(wrapper.findAll('.specular-row')).toHaveLength(5)
      expect(wrapper.find('.range-badge').text()).toContain('5 Anni (5 anni)')

      // 10y -> 10 items
      await rangeBtns[1].trigger('click')
      await flushPromises()
      expect(wrapper.findAll('.specular-row')).toHaveLength(10)
      expect(wrapper.find('.range-badge').text()).toContain('10 Anni (10 anni)')

      // all -> 15 items
      await rangeBtns[2].trigger('click')
      await flushPromises()
      expect(wrapper.findAll('.specular-row')).toHaveLength(15)
      expect(wrapper.find('.range-badge').text()).toContain('Tutto (15 anni)')
    })

    it('3.8 Preserves intermediate zero years between non-zero data boundaries', async () => {
      const dataWithIntermediateZero = [
        { year: 2022, total: 100, newMembers: 10, lostMembers: 5 },
        { year: 2023, total: 0, newMembers: 0, lostMembers: 100 }, // zero dip
        { year: 2024, total: 120, newMembers: 120, lostMembers: 0 }
      ]
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(dataWithIntermediateZero)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const rows = wrapper.findAll('.specular-row')
      expect(rows).toHaveLength(3)
      expect(rows[1].find('.cell-anno').text()).toBe('2023')
      expect(rows[1].find('.cell-iscritti').text()).toBe('0')
    })
  })

  // =========================================================================
  // 4. Senior Direct Data Labels Plugin Robustness & Adversarial Inputs
  // =========================================================================
  describe('4. Direct Data Labels Plugin Canvas Safety & Adversarial Inputs', () => {
    it('4.1 safely handles 0, NaN, negative numbers, null, and undefined without throwing', async () => {
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue([
        { year: 2026, total: 100, newMembers: 10, lostMembers: 0 }
      ])
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const barComponent = wrapper.findComponent({ name: 'Bar' })
      const plugins = barComponent.props('plugins')
      const plugin = plugins.find((p) => p.id === 'seniorDataLabels')
      expect(plugin).toBeDefined()

      // Mock canvas context
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillText: vi.fn(),
        font: '',
        fillStyle: '',
        textAlign: '',
        textBaseline: ''
      }

      // Adversarial dataset containing 0, NaN, negative numbers, null, undefined, float
      const mockChart = {
        ctx: mockCtx,
        data: {
          datasets: [
            {
              data: [0, NaN, -45, 120.5, null, undefined],
              borderColor: '#123456'
            }
          ]
        },
        getDatasetMeta: vi.fn(() => ({
          hidden: false,
          data: [
            { tooltipPosition: () => ({ x: 10, y: 50 }) },
            { tooltipPosition: () => ({ x: 20, y: 60 }) },
            { tooltipPosition: () => ({ x: 30, y: 70 }) },
            { x: 40, y: 80 }, // element without tooltipPosition fallback
            { x: 50, y: 90 },
            { x: 60, y: 100 }
          ]
        }))
      }

      // Invoke plugin directly
      expect(() => plugin.afterDatasetsDraw(mockChart)).not.toThrow()

      expect(mockCtx.save).toHaveBeenCalledTimes(1)
      expect(mockCtx.restore).toHaveBeenCalledTimes(1)

      // 0 must be drawn as "0" at y - 8 (50 - 8 = 42)
      expect(mockCtx.fillText).toHaveBeenCalledWith('0', 10, 42)

      // NaN must be drawn as "NaN" at y - 8 (60 - 8 = 52) without throwing
      expect(mockCtx.fillText).toHaveBeenCalledWith('NaN', 20, 52)

      // Negative number -45 must be drawn as "-45" at y - 8 (70 - 8 = 62)
      expect(mockCtx.fillText).toHaveBeenCalledWith('-45', 30, 62)

      // Float 120.5 with fallback pos { x: 40, y: 80 - 8 = 72 }
      expect(mockCtx.fillText).toHaveBeenCalledWith('120.5', 40, 72)

      // Total fillText calls should be exactly 4 (null and undefined are ignored)
      expect(mockCtx.fillText).toHaveBeenCalledTimes(4)
    })

    it('4.2 gracefully aborts without throw when ctx is missing, meta is null, or dataset is hidden', async () => {
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue([
        { year: 2026, total: 100, newMembers: 10, lostMembers: 0 }
      ])
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const plugin = wrapper.findComponent({ name: 'Bar' }).props('plugins').find((p) => p.id === 'seniorDataLabels')

      // 1. Missing ctx
      expect(() => plugin.afterDatasetsDraw({})).not.toThrow()

      // 2. Meta is null
      const mockCtx = { save: vi.fn(), restore: vi.fn(), fillText: vi.fn() }
      expect(() =>
        plugin.afterDatasetsDraw({
          ctx: mockCtx,
          data: { datasets: [{ data: [100] }] },
          getDatasetMeta: () => null
        })
      ).not.toThrow()
      expect(mockCtx.fillText).not.toHaveBeenCalled()

      // 3. Dataset is hidden
      expect(() =>
        plugin.afterDatasetsDraw({
          ctx: mockCtx,
          data: { datasets: [{ data: [100] }] },
          getDatasetMeta: () => ({ hidden: true, data: [{ x: 10, y: 20 }] })
        })
      ).not.toThrow()
      expect(mockCtx.fillText).not.toHaveBeenCalled()
    })

    it('4.3 uses fallback institutional crimson color when borderColor is omitted', async () => {
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue([
        { year: 2026, total: 100, newMembers: 10, lostMembers: 0 }
      ])
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const plugin = wrapper.findComponent({ name: 'Bar' }).props('plugins').find((p) => p.id === 'seniorDataLabels')

      const mockCtx = { save: vi.fn(), restore: vi.fn(), fillText: vi.fn(), fillStyle: '' }
      plugin.afterDatasetsDraw({
        ctx: mockCtx,
        data: { datasets: [{ data: [999] }] }, // No borderColor
        getDatasetMeta: () => ({ hidden: false, data: [{ x: 10, y: 20 }] })
      })

      expect(mockCtx.fillStyle).toBe('#b71c1c')
      expect(mockCtx.fillText).toHaveBeenCalledWith('999', 10, 12)
    })
  })

  // =========================================================================
  // 5. Specular Table Calculation Precision, Pill Badges & WCAG 2.2 Checks
  // =========================================================================
  describe('5. Specular Table Calculations & Senior Accessibility Compliance', () => {
    const complexData = [
      { year: 2024, total: 100, newMembers: 50, lostMembers: 20 }, // Saldo +30
      { year: 2025, total: 90, newMembers: 10, lostMembers: 20 },  // Saldo -10
      { year: 2026, total: 90, newMembers: 15, lostMembers: 15 }   // Saldo 0
    ]

    it('5.1 verifies accurate badge classes and +/- sign formatting for positive, negative, and zero saldi', async () => {
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(complexData)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const rows = wrapper.findAll('.specular-row')
      expect(rows).toHaveLength(3)

      // Row 1 (2024): Saldo +30 -> badge-success
      const saldo2024 = rows[0].find('.cell-saldo')
      expect(saldo2024.text()).toBe('+30')
      expect(saldo2024.find('.badge-pill').classes()).toContain('badge-success')

      // Row 2 (2025): Saldo -10 -> badge-danger
      const saldo2025 = rows[1].find('.cell-saldo')
      expect(saldo2025.text()).toBe('-10')
      expect(saldo2025.find('.badge-pill').classes()).toContain('badge-danger')

      // Row 3 (2026): Saldo 0 -> badge-neutral
      const saldo2026 = rows[2].find('.cell-saldo')
      expect(saldo2026.text()).toBe('0')
      expect(saldo2026.find('.badge-pill').classes()).toContain('badge-neutral')
    })

    it('5.2 verifies summary footer calculation precision', async () => {
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(complexData)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const tfoot = wrapper.find('tfoot.summary-footer-row, tfoot tr.summary-footer-row')
      expect(tfoot.exists()).toBe(true)

      // Total average: (100 + 90 + 90) / 3 = 280 / 3 = 93.33 -> Math.round = 93
      expect(tfoot.text()).toContain('93')

      // Total new: 50 + 10 + 15 = 75 -> "+75"
      expect(tfoot.text()).toContain('+75')

      // Total lost: 20 + 20 + 15 = 55 -> "-55"
      expect(tfoot.text()).toContain('-55')

      // Net balance: 75 - 55 = +20 -> "+20"
      expect(tfoot.text()).toContain('+20')
    })

    it('5.3 verifies table semantic accessibility tags (role, scope, aria-label, tabular-nums)', async () => {
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(complexData)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const table = wrapper.find('table.specular-data-table')
      expect(table.attributes('role')).toBe('table')
      expect(table.attributes('aria-label')).toBe('Tabella dati storici iscritti')

      // Check all headers have scope="col"
      const thCols = table.findAll('thead th')
      expect(thCols).toHaveLength(5)
      thCols.forEach((th) => {
        expect(th.attributes('scope')).toBe('col')
      })

      // Check footer row header has scope="row"
      const footerTh = table.find('tfoot th')
      expect(footerTh.attributes('scope')).toBe('row')
    })
  })
})
