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

// Mock db service
vi.mock('@/services/db', () => ({
  getYearlyStats: vi.fn()
}))

describe('Challenger M4-2: Empirical & Adversarial Stress Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // 1. SPECULAR TABLE ARITHMETIC CONSISTENCY & ORACLE GENERATOR
  // =========================================================================
  describe('1. Specular Table Arithmetic Consistency & Mathematical Invariants', () => {
    // Deterministic pseudo-random generator for reproducible property-based testing
    function pseudoRandom(seed) {
      let s = seed
      return function () {
        s = (s * 9301 + 49297) % 233280
        return s / 233280
      }
    }

    it('1.1 Property-Based Oracle: 30 generated random historical datasets satisfy row saldo and footer math invariants', async () => {
      const rand = pseudoRandom(42)

      for (let run = 0; run < 30; run++) {
        // Generate random history with 2 to 15 years
        const length = Math.floor(rand() * 14) + 2
        const baseYear = 2010 + Math.floor(rand() * 5)
        let runningTotal = Math.floor(rand() * 300) + 100

        const testData = []
        for (let y = 0; y < length; y++) {
          const newM = Math.floor(rand() * 60)
          const lostM = Math.floor(rand() * 60)
          runningTotal = Math.max(1, runningTotal + newM - lostM)
          testData.push({
            year: baseYear + y,
            total: runningTotal,
            newMembers: newM,
            lostMembers: lostM
          })
        }

        vi.mocked(dbModule.getYearlyStats).mockResolvedValue(JSON.parse(JSON.stringify(testData)))
        const wrapper = mount(DashboardCharts)
        await flushPromises()

        // Switch to 'all' to inspect all generated rows
        const rangeBtns = wrapper.findAll('.range-btn')
        await rangeBtns[2].trigger('click')
        await flushPromises()

        const rows = wrapper.findAll('.specular-row')
        expect(rows).toHaveLength(length)

        let expectedSumNew = 0
        let expectedSumLost = 0
        let expectedSumTotal = 0
        let expectedSumRowSaldi = 0

        for (let i = 0; i < length; i++) {
          const expectedItem = testData[i]
          const expectedSaldo = expectedItem.newMembers - expectedItem.lostMembers

          expectedSumNew += expectedItem.newMembers
          expectedSumLost += expectedItem.lostMembers
          expectedSumTotal += expectedItem.total
          expectedSumRowSaldi += expectedSaldo

          const rowAnno = Number(rows[i].find('.cell-anno').text())
          const rowTotal = Number(rows[i].find('.cell-iscritti').text())
          const rowNuoviText = rows[i].find('.cell-nuovi').text()
          const rowCessatiText = rows[i].find('.cell-cessati').text()
          const rowSaldoText = rows[i].find('.cell-saldo').text()

          // Invariant 1: Year and total match source exactly
          expect(rowAnno).toBe(expectedItem.year)
          expect(rowTotal).toBe(expectedItem.total)

          // Invariant 2: Nuovi formatting (+X or 0)
          if (expectedItem.newMembers > 0) {
            expect(rowNuoviText).toBe(`+${expectedItem.newMembers}`)
          } else {
            expect(rowNuoviText).toBe('0')
          }

          // Invariant 3: Cessati formatting (-X or 0)
          if (expectedItem.lostMembers > 0) {
            expect(rowCessatiText).toBe(`-${expectedItem.lostMembers}`)
          } else {
            expect(rowCessatiText).toBe('0')
          }

          // Invariant 4: Saldo Netto = Nuovi - Non Rinnovati
          const parsedSaldo = Number(rowSaldoText.replace('+', ''))
          expect(parsedSaldo).toBe(expectedSaldo)

          // Invariant 5: Badge classes
          const saldoBadge = rows[i].find('.cell-saldo').find('.badge-pill')
          if (expectedSaldo > 0) {
            expect(saldoBadge.classes()).toContain('badge-success')
          } else if (expectedSaldo < 0) {
            expect(saldoBadge.classes()).toContain('badge-danger')
          } else {
            expect(saldoBadge.classes()).toContain('badge-neutral')
          }
        }

        // Invariant 6: Summary Footer Mathematical Exactness
        const tfoot = wrapper.find('tfoot.summary-footer-row, tfoot tr.summary-footer-row')
        expect(tfoot.exists()).toBe(true)

        const expectedAverage = Math.round(expectedSumTotal / length)
        const expectedNet = expectedSumNew - expectedSumLost

        // Critical Law: sum of all individual row saldi MUST EQUAL net variation
        expect(expectedSumRowSaldi).toBe(expectedNet)

        expect(tfoot.text()).toContain(`${expectedAverage}`)
        expect(tfoot.text()).toContain('(media)')

        if (expectedSumNew > 0) {
          expect(tfoot.text()).toContain(`+${expectedSumNew}`)
        } else {
          expect(tfoot.text()).toContain(`${expectedSumNew}`)
        }

        if (expectedSumLost > 0) {
          expect(tfoot.text()).toContain(`-${expectedSumLost}`)
        } else {
          expect(tfoot.text()).toContain(`${expectedSumLost}`)
        }

        if (expectedNet > 0) {
          expect(tfoot.text()).toContain(`+${expectedNet}`)
        } else {
          expect(tfoot.text()).toContain(`${expectedNet}`)
        }

        wrapper.unmount()
      }
    })

    it('1.2 Edge Case: All-zero variations (newMembers=0, lostMembers=0 across all years)', async () => {
      const zeroVarData = [
        { year: 2024, total: 200, newMembers: 0, lostMembers: 0 },
        { year: 2025, total: 200, newMembers: 0, lostMembers: 0 },
        { year: 2026, total: 200, newMembers: 0, lostMembers: 0 }
      ]
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(zeroVarData)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const rows = wrapper.findAll('.specular-row')
      expect(rows).toHaveLength(3)

      rows.forEach((row) => {
        expect(row.find('.cell-nuovi').text()).toBe('0')
        expect(row.find('.cell-cessati').text()).toBe('0')
        expect(row.find('.cell-saldo').text()).toBe('0')
        expect(row.find('.cell-saldo .badge-pill').classes()).toContain('badge-neutral')
      })

      // Footer
      const tfoot = wrapper.find('tfoot')
      expect(tfoot.exists()).toBe(true)
      expect(tfoot.text()).toContain('200')
      // Sums must be '0', not '+0' or '-0'
      const cells = tfoot.findAll('td')
      expect(cells[1].text()).toBe('0')
      expect(cells[2].text()).toBe('0')
      expect(cells[3].text()).toBe('0')
      expect(cells[3].classes()).toContain('text-success') // net 0 is >= 0
    })

    it('1.3 Edge Case: Massive numbers arithmetic (no integer overflow or formatting truncation)', async () => {
      const hugeData = [
        { year: 2025, total: 1000000, newMembers: 50000, lostMembers: 20000 }, // saldo +30000
        { year: 2026, total: 1030000, newMembers: 45000, lostMembers: 15000 }  // saldo +30000
      ]
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(hugeData)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const rows = wrapper.findAll('.specular-row')
      expect(rows).toHaveLength(2)

      expect(rows[0].find('.cell-iscritti').text()).toBe('1000000')
      expect(rows[0].find('.cell-nuovi').text()).toBe('+50000')
      expect(rows[0].find('.cell-cessati').text()).toBe('-20000')
      expect(rows[0].find('.cell-saldo').text()).toBe('+30000')

      expect(rows[1].find('.cell-iscritti').text()).toBe('1030000')
      expect(rows[1].find('.cell-nuovi').text()).toBe('+45000')
      expect(rows[1].find('.cell-cessati').text()).toBe('-15000')
      expect(rows[1].find('.cell-saldo').text()).toBe('+30000')

      const tfoot = wrapper.find('tfoot')
      expect(tfoot.text()).toContain('1015000') // average (1000000 + 1030000) / 2
      expect(tfoot.text()).toContain('+95000')   // 50000 + 45000
      expect(tfoot.text()).toContain('-35000')   // 20000 + 15000
      expect(tfoot.text()).toContain('+60000')   // net 95000 - 35000
    })

    it('1.4 Edge Case: Strictly negative net balance across all years', async () => {
      const collapseData = [
        { year: 2024, total: 500, newMembers: 10, lostMembers: 50 }, // saldo -40
        { year: 2025, total: 460, newMembers: 5, lostMembers: 45 },  // saldo -40
        { year: 2026, total: 420, newMembers: 2, lostMembers: 30 }   // saldo -28
      ]
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(collapseData)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const rows = wrapper.findAll('.specular-row')
      expect(rows[0].find('.cell-saldo').text()).toBe('-40')
      expect(rows[0].find('.cell-saldo .badge-pill').classes()).toContain('badge-danger')
      expect(rows[1].find('.cell-saldo').text()).toBe('-40')
      expect(rows[1].find('.cell-saldo .badge-pill').classes()).toContain('badge-danger')
      expect(rows[2].find('.cell-saldo').text()).toBe('-28')
      expect(rows[2].find('.cell-saldo .badge-pill').classes()).toContain('badge-danger')

      const tfoot = wrapper.find('tfoot')
      // Sum new = 17, Sum lost = 125, Net = -108
      expect(tfoot.text()).toContain('+17')
      expect(tfoot.text()).toContain('-125')
      expect(tfoot.text()).toContain('-108')

      const netCell = tfoot.findAll('td')[3]
      expect(netCell.classes()).toContain('text-danger')
      expect(netCell.classes()).not.toContain('text-success')
    })

    it('1.5 Edge Case: Perfectly balanced net variation (sum new == sum lost, net == 0)', async () => {
      const balancedData = [
        { year: 2025, total: 300, newMembers: 30, lostMembers: 10 }, // saldo +20
        { year: 2026, total: 300, newMembers: 10, lostMembers: 30 }  // saldo -20
      ]
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(balancedData)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const tfoot = wrapper.find('tfoot')
      const netCell = tfoot.findAll('td')[3]
      expect(netCell.text()).toBe('0')
      expect(netCell.classes()).toContain('text-success')
    })

    it('1.6 Edge Case: Fractional average rounding thresholds (.4999 vs .5000)', async () => {
      // Case A: (100 + 101 + 100) / 3 = 301 / 3 = 100.333... -> 100
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue([
        { year: 2024, total: 100, newMembers: 10, lostMembers: 5 },
        { year: 2025, total: 101, newMembers: 10, lostMembers: 5 },
        { year: 2026, total: 100, newMembers: 10, lostMembers: 5 }
      ])
      let wrapper = mount(DashboardCharts)
      await flushPromises()
      expect(wrapper.find('tfoot').text()).toContain('100')

      // Case B: (100 + 101) / 2 = 201 / 2 = 100.5 -> 101 (Math.round ties round half up)
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue([
        { year: 2025, total: 100, newMembers: 10, lostMembers: 5 },
        { year: 2026, total: 101, newMembers: 10, lostMembers: 5 }
      ])
      wrapper = mount(DashboardCharts)
      await flushPromises()
      expect(wrapper.find('tfoot').text()).toContain('101')

      // Case C: (100 + 102) / 2 = 101
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue([
        { year: 2025, total: 100, newMembers: 10, lostMembers: 5 },
        { year: 2026, total: 102, newMembers: 10, lostMembers: 5 }
      ])
      wrapper = mount(DashboardCharts)
      await flushPromises()
      expect(wrapper.find('tfoot').text()).toContain('101')
    })

    it('1.7 Threshold Boundary: exactly 1 row hides tfoot, exactly 2 rows shows tfoot', async () => {
      // 1 row
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue([
        { year: 2026, total: 350, newMembers: 20, lostMembers: 10 }
      ])
      let wrapper = mount(DashboardCharts)
      await flushPromises()
      expect(wrapper.findAll('.specular-row')).toHaveLength(1)
      expect(wrapper.find('tfoot').exists()).toBe(false)

      // 2 rows
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue([
        { year: 2025, total: 340, newMembers: 15, lostMembers: 5 },
        { year: 2026, total: 350, newMembers: 20, lostMembers: 10 }
      ])
      wrapper = mount(DashboardCharts)
      await flushPromises()
      expect(wrapper.findAll('.specular-row')).toHaveLength(2)
      expect(wrapper.find('tfoot').exists()).toBe(true)
    })

    it('1.8 Range Window Slicing: footer averages and sums strictly recalculate across active slice without leaking outside data', async () => {
      // 10 years of data with distinct figures per year
      const rangeData = [
        { year: 2017, total: 100, newMembers: 10, lostMembers: 5 }, // Older 5 years (2017-2021)
        { year: 2018, total: 110, newMembers: 15, lostMembers: 5 },
        { year: 2019, total: 120, newMembers: 15, lostMembers: 5 },
        { year: 2020, total: 130, newMembers: 15, lostMembers: 5 },
        { year: 2021, total: 140, newMembers: 15, lostMembers: 5 },
        { year: 2022, total: 200, newMembers: 70, lostMembers: 10 }, // Recent 5 years (2022-2026)
        { year: 2023, total: 250, newMembers: 60, lostMembers: 10 },
        { year: 2024, total: 300, newMembers: 60, lostMembers: 10 },
        { year: 2025, total: 350, newMembers: 60, lostMembers: 10 },
        { year: 2026, total: 400, newMembers: 60, lostMembers: 10 }
      ]
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(rangeData)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const rangeBtns = wrapper.findAll('.range-btn')

      // 1. Default '5y': years 2022 to 2026
      // Sum iscritti: 200 + 250 + 300 + 350 + 400 = 1500. Avg = 1500 / 5 = 300
      // Sum new: 70 + 60 + 60 + 60 + 60 = 310 -> "+310"
      // Sum lost: 10 * 5 = 50 -> "-50"
      // Net: 310 - 50 = +260 -> "+260"
      let tfoot = wrapper.find('tfoot')
      expect(tfoot.text()).toContain('300')
      expect(tfoot.text()).toContain('+310')
      expect(tfoot.text()).toContain('-50')
      expect(tfoot.text()).toContain('+260')

      // 2. Switch to '10y': all 10 years (2017 to 2026)
      // Older 5y sum: 100+110+120+130+140 = 600. Total sum = 600 + 1500 = 2100. Avg = 210
      // Older 5y new: 10+15+15+15+15 = 70. Total new = 70 + 310 = 380 -> "+380"
      // Older 5y lost: 25. Total lost = 25 + 50 = 75 -> "-75"
      // Net: 380 - 75 = 305 -> "+305"
      await rangeBtns[1].trigger('click')
      await flushPromises()
      tfoot = wrapper.find('tfoot')
      expect(tfoot.text()).toContain('210')
      expect(tfoot.text()).toContain('+380')
      expect(tfoot.text()).toContain('-75')
      expect(tfoot.text()).toContain('+305')

      // 3. Switch back to '5y': verifies instant reactive re-computation
      await rangeBtns[0].trigger('click')
      await flushPromises()
      tfoot = wrapper.find('tfoot')
      expect(tfoot.text()).toContain('300')
      expect(tfoot.text()).toContain('+310')
      expect(tfoot.text()).toContain('-50')
      expect(tfoot.text()).toContain('+260')
    })

    it('1.9 Stat Cards Trend Arithmetic: computes delta vs previous year and renders proper BaseIcon vector', async () => {
      // 2 years with positive trend
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue([
        { year: 2025, total: 300, newMembers: 20, lostMembers: 10 },
        { year: 2026, total: 325, newMembers: 35, lostMembers: 10 }
      ])
      let wrapper = mount(DashboardCharts)
      await flushPromises()

      // Trend total: 325 - 300 = +25 -> BaseIcon name="trending-up" color="success"
      const totalCard = wrapper.find('.stat-card.total')
      expect(totalCard.text()).toContain('25 vs anno scorso')
      expect(totalCard.findComponent({ name: 'BaseIcon' }).props('name')).toBe('trending-up')
      expect(totalCard.findComponent({ name: 'BaseIcon' }).props('color')).toBe('success')

      // Trend new: 35 - 20 = +15 -> BaseIcon name="trending-up"
      const newCard = wrapper.find('.stat-card.new')
      expect(newCard.text()).toContain('15')
      expect(newCard.findComponent({ name: 'BaseIcon' }).props('name')).toBe('trending-up')

      // 2 years with negative trend
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue([
        { year: 2025, total: 300, newMembers: 30, lostMembers: 10 },
        { year: 2026, total: 270, newMembers: 10, lostMembers: 40 }
      ])
      wrapper = mount(DashboardCharts)
      await flushPromises()

      // Trend total: 270 - 300 = -30 -> BaseIcon name="trending-down" color="accent"
      const totalCardNeg = wrapper.find('.stat-card.total')
      expect(totalCardNeg.text()).toContain('30 vs anno scorso')
      expect(totalCardNeg.findComponent({ name: 'BaseIcon' }).props('name')).toBe('trending-down')
      expect(totalCardNeg.findComponent({ name: 'BaseIcon' }).props('color')).toBe('accent')

      // 2 years with flat trend (0 delta) -> no trending-up or trending-down icon
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue([
        { year: 2025, total: 300, newMembers: 20, lostMembers: 10 },
        { year: 2026, total: 300, newMembers: 20, lostMembers: 20 }
      ])
      wrapper = mount(DashboardCharts)
      await flushPromises()

      const totalCardFlat = wrapper.find('.stat-card.total')
      expect(totalCardFlat.findComponent({ name: 'BaseIcon' }).exists()).toBe(false)
      expect(totalCardFlat.text()).toContain('0 vs anno scorso')
    })
  })

  // =========================================================================
  // 2. SIGN FORMATTING & TABULAR NUMS SPECIFICATION COMPLIANCE
  // =========================================================================
  describe('2. String Sign Formatting (+/-) & Tabular Nums Specification', () => {
    it('2.1 rigorously verifies signed indicator rules across all columns', async () => {
      const data = [
        { year: 2023, total: 100, newMembers: 50, lostMembers: 10 }, // new > 0, lost > 0, saldo > 0
        { year: 2024, total: 110, newMembers: 10, lostMembers: 40 }, // new > 0, lost > 0, saldo < 0
        { year: 2025, total: 120, newMembers: 20, lostMembers: 20 }, // new > 0, lost > 0, saldo == 0
        { year: 2026, total: 130, newMembers: 0, lostMembers: 0 }    // new == 0, lost == 0, saldo == 0
      ]
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(data)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const rows = wrapper.findAll('.specular-row')

      // Row 0 (2023): +50, -10, +40
      expect(rows[0].find('.cell-nuovi').text()).toBe('+50')
      expect(rows[0].find('.cell-cessati').text()).toBe('-10')
      expect(rows[0].find('.cell-saldo').text()).toBe('+40')
      expect(rows[0].find('.cell-saldo').find('.badge-pill').classes()).toContain('badge-success')

      // Row 1 (2024): +10, -40, -30
      expect(rows[1].find('.cell-nuovi').text()).toBe('+10')
      expect(rows[1].find('.cell-cessati').text()).toBe('-40')
      expect(rows[1].find('.cell-saldo').text()).toBe('-30')
      expect(rows[1].find('.cell-saldo').find('.badge-pill').classes()).toContain('badge-danger')

      // Row 2 (2025): +20, -20, 0
      expect(rows[2].find('.cell-nuovi').text()).toBe('+20')
      expect(rows[2].find('.cell-cessati').text()).toBe('-20')
      expect(rows[2].find('.cell-saldo').text()).toBe('0')
      expect(rows[2].find('.cell-saldo').find('.badge-pill').classes()).toContain('badge-neutral')

      // Row 3 (2026): 0, 0, 0 (no + or - on zero!)
      expect(rows[3].find('.cell-nuovi').text()).toBe('0')
      expect(rows[3].find('.cell-cessati').text()).toBe('0')
      expect(rows[3].find('.cell-saldo').text()).toBe('0')
      expect(rows[3].find('.cell-saldo').find('.badge-pill').classes()).toContain('badge-neutral')
    })

    it('2.2 verifies null / undefined fallback in raw database records', async () => {
      const irregularData = [
        { year: 2025, total: 100 }, // missing newMembers and lostMembers
        { year: 2026, total: 120, newMembers: null, lostMembers: undefined }
      ]
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(irregularData)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const rows = wrapper.findAll('.specular-row')
      expect(rows).toHaveLength(2)

      // Must fall back to 0 without throwing NaN or crashing
      expect(rows[0].find('.cell-nuovi').text()).toBe('0')
      expect(rows[0].find('.cell-cessati').text()).toBe('0')
      expect(rows[0].find('.cell-saldo').text()).toBe('0')

      expect(rows[1].find('.cell-nuovi').text()).toBe('0')
      expect(rows[1].find('.cell-cessati').text()).toBe('0')
      expect(rows[1].find('.cell-saldo').text()).toBe('0')
    })

    it('2.3 verifies tabular-nums applied on all numeric cells and columns', async () => {
      const data = [
        { year: 2025, total: 400, newMembers: 30, lostMembers: 10 },
        { year: 2026, total: 420, newMembers: 30, lostMembers: 10 }
      ]
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue(data)
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const table = wrapper.find('table.specular-data-table')
      expect(table.classes()).toContain('tabular-nums')

      // Header cells 1 to 4 must have tabular-nums and text-right
      const ths = table.findAll('thead th')
      expect(ths[1].classes()).toContain('tabular-nums')
      expect(ths[1].classes()).toContain('text-right')
      expect(ths[2].classes()).toContain('tabular-nums')
      expect(ths[2].classes()).toContain('text-right')
      expect(ths[3].classes()).toContain('tabular-nums')
      expect(ths[3].classes()).toContain('text-right')
      expect(ths[4].classes()).toContain('tabular-nums')
      expect(ths[4].classes()).toContain('text-right')

      // Body cells must have tabular-nums and text-right
      const rows = table.findAll('tbody tr')
      rows.forEach((r) => {
        const tds = r.findAll('td')
        // iscritti, nuovi, cessati, saldo
        expect(tds[1].classes()).toContain('tabular-nums')
        expect(tds[1].classes()).toContain('text-right')
        expect(tds[2].classes()).toContain('tabular-nums')
        expect(tds[2].classes()).toContain('text-right')
        expect(tds[3].classes()).toContain('tabular-nums')
        expect(tds[3].classes()).toContain('text-right')
        expect(tds[4].classes()).toContain('tabular-nums')
        expect(tds[4].classes()).toContain('text-right')
      })

      // Footer cells must have tabular-nums and text-right
      const footerTds = table.findAll('tfoot td')
      footerTds.forEach((td) => {
        expect(td.classes()).toContain('tabular-nums')
        expect(td.classes()).toContain('text-right')
      })
    })
  })

  // =========================================================================
  // 3. EXHAUSTIVE UNICODE ZERO-EMOJI SCANNER (AST & REGEX)
  // =========================================================================
  describe('3. Exhaustive Unicode Zero-Emoji Scanner', () => {
    // Master Regex covering every standard and extended Unicode emoji, dingbat, symbol block, and arrows
    const masterEmojiRegex = new RegExp(
      '[' +
        '\\u{1F300}-\\u{1F5FF}' + // Misc Symbols and Pictographs (e.g. 📄, 📥, 📊, 🔗, 🔄, 🔧)
        '\\u{1F600}-\\u{1F64F}' + // Emoticons
        '\\u{1F680}-\\u{1F6FF}' + // Transport & Map
        '\\u{1F700}-\\u{1F77F}' + // Alchemical
        '\\u{1F780}-\\u{1F7FF}' + // Geometric Shapes Extended
        '\\u{1F800}-\\u{1F8FF}' + // Supplemental Arrows-C
        '\\u{1F900}-\\u{1F9FF}' + // Supplemental Symbols & Pictographs (e.g. 🕒, 🗑️)
        '\\u{1FA00}-\\u{1FA6F}' + // Chess Symbols
        '\\u{1FA70}-\\u{1FAFF}' + // Symbols and Pictographs Extended-A
        '\\u{2600}-\\u{26FF}' +   // Misc Symbols (e.g. ⚡, ⚠️, ☕)
        '\\u{2700}-\\u{27BF}' +   // Dingbats (e.g. ✨, 📝, ✂️)
        '\\u{2300}-\\u{23FF}' +   // Misc Technical (e.g. ⏳, ⏰, ⌨️)
        '\\u{2B50}\\u{203C}\\u{2049}' + // Star, double exclamation, interrobang
        '↑↓←→⬆⬇⬅➡' +             // Unicode directional arrows
      ']',
      'u'
    )

    it('3.1 scans DashboardCharts.vue: 0 raw emojis or unicode arrows across all 779 lines', () => {
      const filePath = resolve(process.cwd(), 'src/components/DashboardCharts.vue')
      const source = readFileSync(filePath, 'utf-8')
      const lines = source.split(/\r?\n/)

      const violations = []
      lines.forEach((line, idx) => {
        if (masterEmojiRegex.test(line)) {
          violations.push({ line: idx + 1, content: line.trim() })
        }
      })

      expect(violations).toEqual([])
    })

    it('3.2 scans HomeView.vue: 0 raw emojis or unicode arrows across all lines', () => {
      const filePath = resolve(process.cwd(), 'src/views/HomeView.vue')
      const source = readFileSync(filePath, 'utf-8')
      const lines = source.split(/\r?\n/)

      const violations = []
      lines.forEach((line, idx) => {
        if (masterEmojiRegex.test(line)) {
          violations.push({ line: idx + 1, content: line.trim() })
        }
      })

      expect(violations).toEqual([])
    })

    it('3.3 confirms absence of historically offending emojis (⏳, 📄, 🕒, ⚡, ✨, 📝, 🗑️, 🔗, 🔄, 📊, 📥, 🔧, ↑, ↓)', () => {
      const files = [
        'src/components/DashboardCharts.vue',
        'src/views/HomeView.vue'
      ]

      const bannedCharacters = ['⏳', '📄', '🕒', '⚡', '✨', '📝', '🗑', '🔗', '🔄', '📊', '📥', '🔧', '↑', '↓']

      files.forEach((file) => {
        const source = readFileSync(resolve(process.cwd(), file), 'utf-8')
        bannedCharacters.forEach((emoji) => {
          expect(source).not.toContain(emoji)
        })
      })
    })
  })

  // =========================================================================
  // 4. SENIOR ACCESSIBILITY & TABLE STYLING COMPLIANCE (WCAG 2.2)
  // =========================================================================
  describe('4. Senior Accessibility & Table Styling Rules Verification', () => {
    it('4.1 verifies table CSS declarations in DashboardCharts.vue style block', () => {
      const filePath = resolve(process.cwd(), 'src/components/DashboardCharts.vue')
      const source = readFileSync(filePath, 'utf-8')

      // Must have .specular-data-table rules
      expect(source).toContain('.specular-data-table')

      // Font size minimum 17px (1.0625rem = 17px on 16px root)
      expect(source).toContain('font-size: 1.0625rem')

      // Row height in the 48-52px ergonomic senior range
      expect(source).toContain('min-height: 48px')
      expect(source).toContain('height: 50px')

      // Alternating zebra striping rule
      expect(source).toContain('.specular-data-table tbody tr:nth-child(even)')

      // Tabular numbers rule
      expect(source).toContain('font-variant-numeric: tabular-nums')
      expect(source).toContain("font-feature-settings: 'tnum' 1")

      // High contrast row hover
      expect(source).toContain('.specular-data-table tbody tr:hover')
      expect(source).toContain("[data-theme='dark'] .specular-data-table tbody tr:hover")
    })

    it('4.2 verifies accessible markup attributes on table element', async () => {
      vi.mocked(dbModule.getYearlyStats).mockResolvedValue([
        { year: 2025, total: 300, newMembers: 20, lostMembers: 10 },
        { year: 2026, total: 310, newMembers: 20, lostMembers: 10 }
      ])
      const wrapper = mount(DashboardCharts)
      await flushPromises()

      const table = wrapper.find('.specular-data-table')
      expect(table.exists()).toBe(true)
      expect(table.attributes('role')).toBe('table')
      expect(table.attributes('aria-label')).toBe('Tabella dati storici iscritti')

      const thList = table.findAll('th')
      thList.forEach((th) => {
        expect(th.attributes('scope')).toMatch(/col|row/)
      })
    })

    it('4.3 verifies responsive wrapper preserves horizontal overflow for mobile / senior zooming', () => {
      const filePath = resolve(process.cwd(), 'src/components/DashboardCharts.vue')
      const source = readFileSync(filePath, 'utf-8')

      expect(source).toContain('.table-responsive')
      expect(source).toContain('overflow-x: auto')
    })
  })

  // =========================================================================
  // 5. ERROR STATE & UNEXPECTED EXCEPTION RESILIENCE
  // =========================================================================
  describe('5. Database Exception & Error State Resilience', () => {
    it('5.1 renders error banner when getYearlyStats rejects, without leaking raw stack trace', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(dbModule.getYearlyStats).mockRejectedValue(new Error('IndexedDB transaction timeout'))

      const wrapper = mount(DashboardCharts)
      await flushPromises()

      expect(wrapper.find('.error-state').exists()).toBe(true)
      expect(wrapper.find('.error-state').text()).toContain('Impossibile caricare i dati del grafico')
      expect(wrapper.find('.charts-container').exists()).toBe(false)
      expect(wrapper.find('.specular-table-container').exists()).toBe(false)

      consoleErrorSpy.mockRestore()
    })
  })
})
