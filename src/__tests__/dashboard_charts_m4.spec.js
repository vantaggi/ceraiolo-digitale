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
    template: '<div class="mock-bar-chart" :data-datasets-count="data ? data.datasets.length : 0"></div>'
  }
}))

// Mock getYearlyStats from db service
vi.mock('@/services/db', () => ({
  getYearlyStats: vi.fn()
}))

describe('Milestone 4: Senior Data Visualization & Dashboard Charts (Requirement R6)', () => {
  const mockHistoricalData = [
    { year: 2015, total: 350, newMembers: 20, lostMembers: 10 },
    { year: 2016, total: 365, newMembers: 25, lostMembers: 10 },
    { year: 2017, total: 380, newMembers: 30, lostMembers: 15 },
    { year: 2018, total: 395, newMembers: 25, lostMembers: 10 },
    { year: 2019, total: 410, newMembers: 30, lostMembers: 15 },
    { year: 2020, total: 390, newMembers: 10, lostMembers: 30 }, // COVID dip (negative net saldo)
    { year: 2021, total: 405, newMembers: 25, lostMembers: 10 },
    { year: 2022, total: 420, newMembers: 30, lostMembers: 15 },
    { year: 2023, total: 450, newMembers: 45, lostMembers: 15 },
    { year: 2024, total: 480, newMembers: 50, lostMembers: 20 },
    { year: 2025, total: 510, newMembers: 40, lostMembers: 10 },
    { year: 2026, total: 535, newMembers: 35, lostMembers: 10 }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbModule.getYearlyStats).mockResolvedValue(JSON.parse(JSON.stringify(mockHistoricalData)))
  })

  it('1. eliminates dual Y-axis: scales has single y scale and no y1 scale', async () => {
    const wrapper = mount(DashboardCharts)
    await flushPromises()

    const barComponent = wrapper.findComponent({ name: 'Bar' })
    expect(barComponent.exists()).toBe(true)

    const options = barComponent.props('options')
    expect(options).toBeDefined()
    expect(options.scales).toBeDefined()

    // Primary single Y axis
    expect(options.scales.y).toBeDefined()
    expect(options.scales.y.display).toBe(true)
    expect(options.scales.y.position).toBe('left')
    expect(options.scales.y.beginAtZero).toBe(true)
    expect(options.scales.y.title.text).toBe('Totale Iscritti')

    // Confusing dual Y-axis y1 must be completely eliminated
    expect(options.scales.y1).toBeUndefined()

    // Datasets must be focused on Totale Iscritti on single scale
    const chartData = barComponent.props('data')
    expect(chartData.datasets).toHaveLength(1)
    expect(chartData.datasets[0].label).toBe('Totale Iscritti')
    expect(chartData.datasets[0].yAxisID).toBe('y')
    expect(chartData.datasets.some((d) => d.yAxisID === 'y1')).toBe(false)
  })

  it('2. provides direct data labels plugin for senior ergonomics without hover dependency', async () => {
    const wrapper = mount(DashboardCharts)
    await flushPromises()

    const barComponent = wrapper.findComponent({ name: 'Bar' })
    const plugins = barComponent.props('plugins')
    expect(Array.isArray(plugins)).toBe(true)
    expect(plugins.length).toBeGreaterThanOrEqual(1)

    const seniorPlugin = plugins.find((p) => p.id === 'seniorDataLabels')
    expect(seniorPlugin).toBeDefined()
    expect(typeof seniorPlugin.afterDatasetsDraw).toBe('function')
  })

  it('3. renders permanent high-contrast specular data table directly beneath the chart', async () => {
    const wrapper = mount(DashboardCharts)
    await flushPromises()

    const container = wrapper.find('.specular-table-container')
    expect(container.exists()).toBe(true)

    const table = container.find('table.specular-data-table')
    expect(table.exists()).toBe(true)
    expect(table.classes()).toContain('data-table')
    expect(table.classes()).toContain('tabular-nums')

    // Columns header verification
    expect(table.find('.col-anno').text()).toBe('Anno')
    expect(table.find('.col-iscritti').text()).toBe('Iscritti Totali')
    expect(table.find('.col-nuovi').text()).toBe('Nuovi Iscritti')
    expect(table.find('.col-cessati').text()).toBe('Non Rinnovati')
    expect(table.find('.col-saldo').text()).toBe('Saldo Netto')
  })

  it('4. specular table reactively updates rows matching selected range (5y, 10y, all)', async () => {
    const wrapper = mount(DashboardCharts)
    await flushPromises()

    const rangeButtons = wrapper.findAll('.range-btn')
    expect(rangeButtons).toHaveLength(3)

    // Default range is '5y' -> exactly 5 rows (2022 to 2026)
    let rows = wrapper.findAll('.specular-row')
    expect(rows).toHaveLength(5)
    expect(rows[0].find('.cell-anno').text()).toBe('2022')
    expect(rows[4].find('.cell-anno').text()).toBe('2026')
    expect(rows[4].find('.cell-iscritti').text()).toBe('535')

    // Switch to '10y'
    await rangeButtons[1].trigger('click')
    await flushPromises()
    rows = wrapper.findAll('.specular-row')
    expect(rows).toHaveLength(10)
    expect(rows[0].find('.cell-anno').text()).toBe('2017')
    expect(rows[9].find('.cell-anno').text()).toBe('2026')

    // Switch to 'all' -> all 12 rows
    await rangeButtons[2].trigger('click')
    await flushPromises()
    rows = wrapper.findAll('.specular-row')
    expect(rows).toHaveLength(12)
    expect(rows[0].find('.cell-anno').text()).toBe('2015')
    expect(rows[11].find('.cell-anno').text()).toBe('2026')
  })

  it('5. formats positive/negative signs (+ and -) and applies tabular-nums alignment', async () => {
    const wrapper = mount(DashboardCharts)
    await flushPromises()

    // Look at 2026 row (last row in 5y default)
    const rows = wrapper.findAll('.specular-row')
    const row2026 = rows[4]

    expect(row2026.find('.cell-anno').text()).toBe('2026')
    expect(row2026.find('.cell-iscritti').text()).toBe('535')
    expect(row2026.find('.cell-iscritti').classes()).toContain('tabular-nums')

    // Nuovi: +35 with badge-success
    const cellNuovi = row2026.find('.cell-nuovi')
    expect(cellNuovi.text()).toBe('+35')
    expect(cellNuovi.find('.badge-pill').classes()).toContain('badge-success')

    // Cessati: -10 with badge-danger
    const cellCessati = row2026.find('.cell-cessati')
    expect(cellCessati.text()).toBe('-10')
    expect(cellCessati.find('.badge-pill').classes()).toContain('badge-danger')

    // Saldo: +25 with badge-success
    const cellSaldo = row2026.find('.cell-saldo')
    expect(cellSaldo.text()).toBe('+25')
    expect(cellSaldo.find('.badge-pill').classes()).toContain('badge-success')

    // Switch to '10y' to inspect year 2020 (which had negative net saldo: 10 new, 30 lost -> -20 saldo)
    const rangeButtons = wrapper.findAll('.range-btn')
    await rangeButtons[1].trigger('click')
    await flushPromises()

    const rows10 = wrapper.findAll('.specular-row')
    const row2020 = rows10.find((r) => r.find('.cell-anno').text() === '2020')
    expect(row2020).toBeDefined()
    expect(row2020.find('.cell-nuovi').text()).toBe('+10')
    expect(row2020.find('.cell-cessati').text()).toBe('-30')
    expect(row2020.find('.cell-saldo').text()).toBe('-20')
    expect(row2020.find('.cell-saldo').find('.badge-pill').classes()).toContain('badge-danger')
  })

  it('6. calculates and displays correct summary totals in tfoot', async () => {
    const wrapper = mount(DashboardCharts)
    await flushPromises()

    // On 5y: years 2022 (420), 2023 (450), 2024 (480), 2025 (510), 2026 (535)
    // Sum total: 420 + 450 + 480 + 510 + 535 = 2395. Average = 2395 / 5 = 479
    // Nuovi sum: 30 + 45 + 50 + 40 + 35 = 200 -> "+200"
    // Lost sum: 15 + 15 + 20 + 10 + 10 = 70 -> "-70"
    // Net sum: 200 - 70 = +130 -> "+130"
    const tfoot = wrapper.find('tfoot.summary-footer-row, tfoot tr.summary-footer-row')
    expect(tfoot.exists()).toBe(true)

    expect(tfoot.text()).toContain('479')
    expect(tfoot.text()).toContain('(media)')
    expect(tfoot.text()).toContain('+200')
    expect(tfoot.text()).toContain('-70')
    expect(tfoot.text()).toContain('+130')
  })

  it('7. gracefully handles empty historical stats without errors', async () => {
    vi.mocked(dbModule.getYearlyStats).mockResolvedValue([])

    const wrapper = mount(DashboardCharts)
    await flushPromises()

    expect(wrapper.find('.empty-state-cell').exists()).toBe(true)
    expect(wrapper.find('.empty-state-cell').text()).toContain('Nessun dato storico disponibile')
    expect(wrapper.find('tfoot').exists()).toBe(false)
  })

  it('8. zero raw emojis and unicode arrows in DashboardCharts.vue', () => {
    const filePath = resolve(process.cwd(), 'src/components/DashboardCharts.vue')
    const fileContent = readFileSync(filePath, 'utf-8')

    const emojiAndArrowRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2300}-\u{23FF}]|[↑↓]/u

    const lines = fileContent.split('\n')
    const offendingLines = []
    lines.forEach((line, index) => {
      if (emojiAndArrowRegex.test(line)) {
        offendingLines.push(`Line ${index + 1}: ${line.trim()}`)
      }
    })

    expect(offendingLines).toEqual([])
  })

  it('9. zero raw emojis in HomeView.vue', () => {
    const filePath = resolve(process.cwd(), 'src/views/HomeView.vue')
    const fileContent = readFileSync(filePath, 'utf-8')

    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2300}-\u{23FF}]/u

    const lines = fileContent.split('\n')
    const offendingLines = []
    lines.forEach((line, index) => {
      if (emojiRegex.test(line)) {
        offendingLines.push(`Line ${index + 1}: ${line.trim()}`)
      }
    })

    expect(offendingLines).toEqual([])
  })

  it('10. verifies BaseIcon replacement in HomeView.vue template structure', () => {
    const filePath = resolve(process.cwd(), 'src/views/HomeView.vue')
    const fileContent = readFileSync(filePath, 'utf-8')

    // Must import BaseIcon
    expect(fileContent).toContain("import BaseIcon from '@/components/common/BaseIcon.vue'")

    // Must use BaseIcon for loaders, docs, clock, zap, sparkles, edit, trash, link, refresh-cw, bar-chart, download, settings
    expect(fileContent).toContain('name="loader"')
    expect(fileContent).toContain('name="file-text"')
    expect(fileContent).toContain('name="clock"')
    expect(fileContent).toContain('name="zap"')
    expect(fileContent).toContain('name="sparkles"')
    expect(fileContent).toContain('name="trash-2"')
    expect(fileContent).toContain('name="link"')
    expect(fileContent).toContain('name="refresh-cw"')
    expect(fileContent).toContain('name="bar-chart"')
    expect(fileContent).toContain('name="download"')
    expect(fileContent).toContain('name="settings"')
  })
})
