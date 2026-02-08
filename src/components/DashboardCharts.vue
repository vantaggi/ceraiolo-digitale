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
             {{ getTrendSymbol(statsTrend.total) }} {{ Math.abs(statsTrend.total) }} vs anno scorso
          </div>
        </div>

        <div class="stat-card new">
          <div class="stat-value">{{ currentYearStats.newMembers }}</div>
          <div class="stat-label">Nuovi Iscritti</div>
           <div class="stat-trend" :class="getTrendClass(statsTrend.new)">
             {{ getTrendSymbol(statsTrend.new) }} {{ Math.abs(statsTrend.new) }}
          </div>
        </div>

        <div class="stat-card lost">
          <div class="stat-value">{{ currentYearStats.lostMembers }}</div>
          <div class="stat-label">Non Rinnovati</div>
          <div class="stat-desc">dall'anno {{ currentYearStats.year - 1 }}</div>
        </div>
      </div>

      <!-- Main Chart -->
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
                >
                    {{ range.label }}
                </button>
            </div>
        </div>
        <Bar :data="chartData" :options="chartOptions" />
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
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { getYearlyStats } from '@/services/db'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

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
    // Load a wide range initially (e.g., last 20 years or dynamic)
    // For "Tutta la storia", we ideally need to know the first year.
    // Let's assume 2000 as a safe start or 20 years back.
    // Better: let's load from 2000 to currentYear + 1.
    // The previous implementation was strict 5 years.

    // NOTE: Generating stats for 20 years might be slightly heavy but likely fine for client-side DB.
    // Let's go back 30 years to be safe for "Tutta la storia".
    // Updated: We now let getYearlyStats auto-detect the start year if we pass null/undefined
    const stats = await getYearlyStats(null, currentYear)

    // Filter out only completely empty years from the start,
    // but keep gaps in the middle if they exist (though getYearlyStats fills them)
    // We want to remove leading zeros.
    let firstNonZeroIndex = stats.findIndex(y => y.total > 0)
    if (firstNonZeroIndex === -1) {
        fullHistoryData.value = []
    } else {
        // Trim trailing zeros
        let lastNonZeroIndex = stats.length - 1
        while (lastNonZeroIndex >= firstNonZeroIndex && stats[lastNonZeroIndex].total === 0) {
            lastNonZeroIndex--
        }
        fullHistoryData.value = stats.slice(firstNonZeroIndex, lastNonZeroIndex + 1)
    }

  } catch (e) {
    error.value = "Impossibile caricare i dati del grafico"
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

    let result = []
    if (selectedRange.value === 'all') {
        result = [...data]
    } else {
        const count = selectedRange.value === '5y' ? 5 : 10
        result = data.slice(-count)
    }

    // Fix: If the first year in the displayed result corresponds to the absolute start of data,
    // suppress the "New Members" bar if it's overwhelming (i.e. if newMembers ~= total).
    // This makes the scale more usable for subsequent years.
    if (result.length > 0) {
        // Create a deep copy to avoid mutating the source
        result = result.map(x => ({ ...x }))

        const firstItem = result[0]
        // Check if this is truly the start of recorded history or just the start of the view
        // Actually, if it's the start of history, newMembers == total.
        // Even if it's just the start of the view, showing a huge bar if it looks like the start might be distracting.
        // But user specifically said "il primo anno tutti gli iscritti siano nuovi".
        // Let's check if newMembers is disproportionately high (e.g. > 80% of total) and it's the first data point.

        // Use fullHistoryData[0] reference to be sure it's the absolute start
        if (fullHistoryData.value.length > 0 && firstItem.year === fullHistoryData.value[0].year) {
             firstItem.newMembers = 0 // Suppress for display
        }
    }

    return result
})

const getTrendClass = (val) => val >= 0 ? 'trend-up' : 'trend-down'
const getTrendSymbol = (val) => val > 0 ? '↑' : (val < 0 ? '↓' : '=')

// Chart Configuration
const chartData = computed(() => {
  return {
    labels: displayedData.value.map(d => d.year),
    datasets: [
      {
        type: 'line',
        label: 'Totale Iscritti',
        backgroundColor: '#b71c1c', // Brand Red
        borderColor: '#b71c1c',
        borderWidth: 2,
        tension: 0.3,
        data: displayedData.value.map(d => d.total),
        yAxisID: 'y'
      },
      {
        type: 'bar',
        label: 'Nuovi Iscritti',
        backgroundColor: '#FFB300', // Amber/Gold
        data: displayedData.value.map(d => d.newMembers),
        yAxisID: 'y1'
      },
      {
        type: 'bar',
        label: 'Non Rinnovati',
        backgroundColor: '#9E9E9E', // Grey
        data: displayedData.value.map(d => d.lostMembers),
        yAxisID: 'y1'
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
      padding: {
          bottom: 20,
          left: 10,
          right: 10
      }
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
        labels: {
            font: {
                family: "'Inter', sans-serif",
                size: 12
            }
        }
    }
  },
  scales: {
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      beginAtZero: true,
      title: {
        display: true,
        text: 'Totale Iscritti',
        color: '#b71c1c'
      }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      beginAtZero: true,
      grid: {
        drawOnChartArea: false,
      },
      title: {
        display: true,
        text: 'Variazioni',
        color: '#666'
      }
    },
    x: {
        grid: {
            display: false
        }
    }
  }
}
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

.loading-state, .error-state {
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

/* Minimalist styling matching app theme */
.stat-card.total { border-bottom: 3px solid #b71c1c; }
.stat-card.new { border-bottom: 3px solid #FFB300; }
.stat-card.lost { border-bottom: 3px solid #9E9E9E; }

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
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(0,0,0,0.05);
}

.stat-desc {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    margin-top: 0.5rem;
}

.trend-up { color: #2E7D32; }
.trend-down { color: #C62828; }

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
  background: white;
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
</style>
