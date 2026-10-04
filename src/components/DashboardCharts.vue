<template>
  <div class="dashboard-charts">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Caricamento statistiche...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>

    <div v-else class="charts-container">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="stat-card total">
          <div class="stat-value">{{ currentYearStats.total }}</div>
          <div class="stat-label">Iscritti {{ currentYearStats.year }}</div>
          <div class="stat-trend" :class="getTrendClass(statsTrend.total)">
            <BaseIcon
              v-if="statsTrend.total > 0"
              name="trending-up"
              :size="14"
              color="success"
            />
            <BaseIcon
              v-else-if="statsTrend.total < 0"
              name="trending-down"
              :size="14"
              color="accent"
            />
            <span>{{ Math.abs(statsTrend.total) }} vs anno scorso</span>
          </div>
        </div>

        <div class="stat-card new">
          <div class="stat-value">{{ currentYearStats.newMembers }}</div>
          <div class="stat-label">Nuovi Iscritti</div>
          <div class="stat-trend" :class="getTrendClass(statsTrend.new)">
            <BaseIcon
              v-if="statsTrend.new > 0"
              name="trending-up"
              :size="14"
              color="success"
            />
            <BaseIcon
              v-else-if="statsTrend.new < 0"
              name="trending-down"
              :size="14"
              color="accent"
            />
            <span>{{ Math.abs(statsTrend.new) }}</span>
          </div>
        </div>

        <div class="stat-card lost">
          <div class="stat-value">{{ currentYearStats.lostMembers }}</div>
          <div class="stat-label">Non Rinnovati</div>
          <div class="stat-desc">dall'anno {{ currentYearStats.year - 1 }}</div>
        </div>
      </div>

      <!-- Main Chart (Single-Scale Senior Friendly, No Dual Y-Axis) -->
      <div class="chart-wrapper">
        <div class="chart-header">
          <h3>Andamento Iscritti</h3>
          <div class="range-controls">
            <button
              v-for="range in ranges"
              :key="range.value"
              @click="selectedRange = range.value"
              :class="{ active: selectedRange === range.value }"
              class="range-btn"
              :aria-pressed="selectedRange === range.value"
            >
              {{ range.label }}
            </button>
          </div>
        </div>
        <Bar :data="chartData" :options="chartOptions" :plugins="chartPlugins" />
      </div>

      <!-- Permanent High-Contrast Specular Data Table (Requirement R6 & WCAG 2.2) -->
      <div class="specular-table-container">
        <div class="specular-table-header">
          <div class="specular-title-group">
            <BaseIcon name="table" :size="22" color="accent" />
            <h4 class="specular-title">Dati Storici Speculari</h4>
          </div>
          <span class="range-badge">
            <BaseIcon name="calendar" :size="16" />
            {{ ranges.find((r) => r.value === selectedRange)?.label || selectedRange }} ({{ specularTableRows.length }} {{ specularTableRows.length === 1 ? 'anno' : 'anni' }})
          </span>
        </div>

        <div class="table-responsive">
          <table
            class="specular-data-table data-table tabular-nums"
            role="table"
            aria-label="Tabella dati storici iscritti"
          >
            <thead>
              <tr>
                <th scope="col" class="col-anno">Anno</th>
                <th scope="col" class="col-iscritti text-right tabular-nums">Iscritti Totali</th>
                <th scope="col" class="col-nuovi text-right tabular-nums">Nuovi Iscritti</th>
                <th scope="col" class="col-cessati text-right tabular-nums">Non Rinnovati</th>
                <th scope="col" class="col-saldo text-right tabular-nums">Saldo Netto</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in specularTableRows"
                :key="row.anno"
                class="specular-row"
              >
                <td class="cell-anno font-bold">{{ row.anno }}</td>
                <td class="cell-iscritti text-right tabular-nums font-bold">{{ row.iscritti }}</td>
                <td class="cell-nuovi text-right tabular-nums">
                  <span class="badge-pill badge-success">{{ row.nuovi }}</span>
                </td>
                <td class="cell-cessati text-right tabular-nums">
                  <span class="badge-pill badge-danger">{{ row.cessati }}</span>
                </td>
                <td class="cell-saldo text-right tabular-nums">
                  <span class="badge-pill" :class="row.saldoBadgeClass">{{ row.saldo }}</span>
                </td>
              </tr>
              <tr v-if="specularTableRows.length === 0">
                <td colspan="5" class="empty-state-cell">
                  Nessun dato storico disponibile per l'intervallo selezionato.
                </td>
              </tr>
            </tbody>
            <tfoot v-if="specularTableRows.length > 1">
              <tr class="summary-footer-row">
                <th scope="row" class="font-bold">Media / Totale Variazioni</th>
                <td class="text-right tabular-nums font-bold">
                  {{ statsAverageTotal }} <span class="sub-label">(media)</span>
                </td>
                <td class="text-right tabular-nums font-bold text-success">
                  {{ statsSumNew > 0 ? `+${statsSumNew}` : `${statsSumNew}` }}
                </td>
                <td class="text-right tabular-nums font-bold text-danger">
                  {{ statsSumLost > 0 ? `-${statsSumLost}` : `${statsSumLost}` }}
                </td>
                <td
                  class="text-right tabular-nums font-bold"
                  :class="statsSumNet >= 0 ? 'text-success' : 'text-danger'"
                >
                  {{ statsSumNetFormatted }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { getYearlyStats } from '@/services/db'
import BaseIcon from '@/components/common/BaseIcon.vue'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// Direct canvas data labels plugin for senior ergonomics (WCAG 2.2, hover-free)
const seniorDataLabelsPlugin = {
  id: 'seniorDataLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart
    if (!ctx) return
    ctx.save()
    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i)
      if (!meta || meta.hidden) return
      meta.data.forEach((element, index) => {
        const val = dataset.data[index]
        if (val !== undefined && val !== null) {
          const pos = element.tooltipPosition ? element.tooltipPosition() : { x: element.x, y: element.y }
          ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
          ctx.fillStyle = dataset.borderColor || '#b71c1c'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          ctx.fillText(String(val), pos.x, pos.y - 8)
        }
      })
    })
    ctx.restore()
  }
}
const chartPlugins = [seniorDataLabelsPlugin]

const loading = ref(true)
const error = ref(null)
const fullHistoryData = ref([]) // Stores all loaded data
const selectedRange = ref('5y')

const ranges = [
  { label: '5 Anni', value: '5y' },
  { label: '10 Anni', value: '10y' },
  { label: 'Tutto', value: 'all' }
]

onMounted(async () => {
  try {
    const currentYear = new Date().getFullYear()
    const stats = await getYearlyStats(null, currentYear)

    // Filter out only completely empty years from the start
    let firstNonZeroIndex = stats.findIndex((y) => y.total > 0)
    if (firstNonZeroIndex === -1) {
      fullHistoryData.value = []
    } else {
      let lastNonZeroIndex = stats.length - 1
      while (lastNonZeroIndex >= firstNonZeroIndex && stats[lastNonZeroIndex].total === 0) {
        lastNonZeroIndex--
      }
      fullHistoryData.value = stats.slice(firstNonZeroIndex, lastNonZeroIndex + 1)
    }
  } catch (e) {
    error.value = 'Impossibile caricare i dati del grafico'
    console.error(e)
  } finally {
    loading.value = false
  }
})

// Stats for current year (always based on the very last available year data, regardless of zoom)
const currentYearStats = computed(() => {
  if (fullHistoryData.value.length === 0) return { year: 0, total: 0, newMembers: 0, lostMembers: 0 }
  return fullHistoryData.value[fullHistoryData.value.length - 1]
})

// Comparison with previous year for trend icons
const statsTrend = computed(() => {
  if (fullHistoryData.value.length < 2) return { total: 0, new: 0 }
  const current = fullHistoryData.value[fullHistoryData.value.length - 1]
  const prev = fullHistoryData.value[fullHistoryData.value.length - 2]
  return {
    total: current.total - prev.total,
    new: current.newMembers - prev.newMembers
  }
})

// Filter data based on selected range
const displayedData = computed(() => {
  const data = fullHistoryData.value
  if (data.length === 0) return []

  if (selectedRange.value === 'all') {
    return [...data]
  }
  const count = selectedRange.value === '5y' ? 5 : 10
  return data.slice(-count)
})

const getTrendClass = (val) => (val >= 0 ? 'trend-up' : 'trend-down')

// Chart Configuration (Single-Scale: Only scales.y, absence of y1)
const chartData = computed(() => {
  return {
    labels: displayedData.value.map((d) => d.year),
    datasets: [
      {
        type: 'line',
        label: 'Totale Iscritti',
        backgroundColor: '#b71c1c',
        borderColor: '#b71c1c',
        borderWidth: 3,
        pointBackgroundColor: '#b71c1c',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.25,
        fill: false,
        data: displayedData.value.map((d) => d.total),
        yAxisID: 'y'
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 25,
      bottom: 20,
      left: 10,
      right: 15
    }
  },
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: {
      display: true,
      labels: {
        font: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 13,
          weight: '600'
        },
        color: '#1a1a1a',
        boxWidth: 14,
        boxHeight: 14,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(26, 26, 26, 0.92)',
      titleFont: { family: 'system-ui, sans-serif', size: 14, weight: 'bold' },
      bodyFont: { family: 'system-ui, sans-serif', size: 13 },
      padding: 10,
      cornerRadius: 8
    }
  },
  scales: {
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      beginAtZero: true,
      ticks: {
        precision: 0,
        font: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 13,
          weight: '600'
        },
        color: '#5c6266'
      },
      title: {
        display: true,
        text: 'Totale Iscritti',
        color: '#b71c1c',
        font: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 14,
          weight: 'bold'
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.06)'
      }
    },
    x: {
      ticks: {
        font: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 13,
          weight: '600'
        },
        color: '#5c6266'
      },
      grid: {
        display: false
      }
    }
  }
}

// Permanent Specular Data Table Computed Properties
const specularTableRows = computed(() => {
  return displayedData.value.map((r) => {
    const rawNew = r.newMembers || 0
    const rawLost = r.lostMembers || 0
    const saldoVal = rawNew - rawLost

    return {
      anno: r.year,
      iscritti: r.total,
      nuovi: rawNew > 0 ? `+${rawNew}` : `${rawNew}`,
      cessati: rawLost > 0 ? `-${rawLost}` : `${rawLost}`,
      saldo: saldoVal > 0 ? `+${saldoVal}` : `${saldoVal}`,
      rawNew,
      rawLost,
      rawSaldo: saldoVal,
      saldoBadgeClass:
        saldoVal > 0 ? 'badge-success' : saldoVal < 0 ? 'badge-danger' : 'badge-neutral'
    }
  })
})

const statsAverageTotal = computed(() => {
  if (specularTableRows.value.length === 0) return 0
  const sum = specularTableRows.value.reduce((acc, r) => acc + r.iscritti, 0)
  return Math.round(sum / specularTableRows.value.length)
})

const statsSumNew = computed(() => {
  return specularTableRows.value.reduce((acc, r) => acc + r.rawNew, 0)
})

const statsSumLost = computed(() => {
  return specularTableRows.value.reduce((acc, r) => acc + r.rawLost, 0)
})

const statsSumNet = computed(() => statsSumNew.value - statsSumLost.value)

const statsSumNetFormatted = computed(() => {
  const net = statsSumNet.value
  return net > 0 ? `+${net}` : `${net}`
})
</script>

<style scoped>
.dashboard-charts {
  padding: 1.5rem;
  background: var(--color-surface);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  margin-top: 2rem;
  margin-bottom: 3rem;
}

.loading-state,
.error-state {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  padding: 1.25rem;
  border-radius: 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  text-align: center;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.stat-card.total {
  border-bottom: 3px solid #b71c1c;
}
.stat-card.new {
  border-bottom: 3px solid #ffb300;
}
.stat-card.lost {
  border-bottom: 3px solid #9e9e9e;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-weight: 600;
  margin-top: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-trend {
  font-size: 0.8rem;
  margin-top: 0.5rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.05);
}

[data-theme='dark'] .stat-trend {
  background: rgba(255, 255, 255, 0.08);
}

.stat-desc {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.5rem;
}

.trend-up {
  color: var(--color-success, #2e7d32);
}
.trend-down {
  color: var(--color-accent, #c62828);
}

.chart-wrapper {
  height: 350px;
  position: relative;
  padding: 1rem 0;
}

h3 {
  margin: 0;
  color: var(--color-primary);
  font-size: 1.1rem;
  font-weight: 700;
  border-left: 4px solid var(--color-accent);
  padding-left: 10px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.range-controls {
  display: flex;
  gap: 0.5rem;
}

.range-btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.range-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.range-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* ==========================================================================
   Permanent Specular Data Table (Senior Accessible, WCAG 2.2 AA)
   ========================================================================== */
.specular-table-container {
  margin-top: 2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  padding: 1.25rem;
}

.specular-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.specular-title-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.specular-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.range-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  background: var(--color-background);
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid var(--color-border);
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.specular-data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1.0625rem; /* Exactly 17px minimum */
  color: var(--color-text-primary);
  text-align: left;
}

.specular-data-table thead th {
  padding: 0.9rem 1.2rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border-bottom: 2px solid var(--color-border);
  white-space: nowrap;
}

.specular-data-table tbody tr {
  min-height: 48px;
  height: 50px; /* Ergonomic 48-52px range */
  transition: background-color 0.15s ease;
}

.specular-data-table tbody td {
  padding: 0.85rem 1.2rem;
  min-height: 48px;
  vertical-align: middle;
  border-bottom: 1px solid var(--color-border);
  line-height: 1.4;
  font-size: 1.0625rem;
}

/* Alternating zebra striping */
.specular-data-table tbody tr:nth-child(even) {
  background-color: var(--color-surface-hover);
}

/* High contrast row hover */
.specular-data-table tbody tr:hover {
  background-color: rgba(183, 28, 28, 0.05);
}

[data-theme='dark'] .specular-data-table tbody tr:hover {
  background-color: rgba(239, 83, 80, 0.1);
}

/* Tabular Numbers & Right Alignment */
.specular-data-table .tabular-nums,
.specular-data-table .text-right {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}

.cell-anno {
  font-weight: 700;
  color: var(--color-text-primary);
}

.cell-iscritti {
  font-weight: 700;
  color: var(--color-text-primary);
}

/* Accessible pill badges with WCAG 2.2 compliant contrast */
.badge-pill {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.badge-success {
  background-color: rgba(46, 125, 50, 0.12);
  color: var(--color-success);
}

.badge-danger {
  background-color: rgba(183, 28, 28, 0.12);
  color: var(--color-accent);
}

.badge-neutral {
  background-color: rgba(92, 98, 102, 0.12);
  color: var(--color-text-secondary);
}

.summary-footer-row {
  border-top: 2px solid var(--color-border);
  background-color: var(--color-background);
  font-weight: 700;
}

.summary-footer-row th,
.summary-footer-row td {
  padding: 0.9rem 1.2rem;
  font-size: 1.0625rem;
}

.text-success {
  color: var(--color-success, #2e7d32);
}

.text-danger {
  color: var(--color-accent, #b71c1c);
}

.sub-label {
  font-size: 0.8rem;
  font-weight: normal;
  color: var(--color-text-secondary);
}

.empty-state-cell {
  text-align: center;
  padding: 2.5rem;
  color: var(--color-text-secondary);
  font-size: 1.0625rem;
}
</style>
