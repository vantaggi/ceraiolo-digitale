<template>
  <section class="andamento" aria-labelledby="andamento-titolo">
    <header class="andamento__header">
      <h2 id="andamento-titolo" class="andamento__titolo">
        <button
          type="button"
          class="andamento__toggle"
          :aria-expanded="aperto"
          aria-controls="andamento-corpo"
          @click="cambiaAperto"
        >
          <AppIcon name="espandi" class="andamento__chevron" :class="{ 'is-aperto': aperto }" />
          <AppIcon name="statistiche" /> Andamento del tesseramento
        </button>
      </h2>
      <div v-if="aperto && dati.serie.length" class="andamento__periodi" role="group" aria-label="Anni da mostrare">
        <button
          v-for="p in PERIODI"
          :key="p.label"
          type="button"
          class="andamento__periodo"
          :aria-pressed="quantiAnni === p.anni"
          @click="scegliPeriodo(p.anni)"
        >
          {{ p.label }}
        </button>
      </div>
    </header>

    <div v-show="aperto" id="andamento-corpo" class="andamento__corpo">
      <p v-if="loading" class="andamento__stato">
        <AppIcon name="caricamento" spin /> Calcolo dell'andamento...
      </p>
      <p v-else-if="error" class="andamento__stato andamento__stato--errore">
        <AppIcon name="errore" /> {{ error }}
      </p>
      <p v-else-if="!dati.ultimo" class="andamento__stato">
        Ancora nessun iscritto: il grafico compare dopo i primi pagamenti.
      </p>
      <template v-else>
        <dl class="andamento__numeri">
          <div class="andamento__numero">
            <dt>Iscritti {{ dati.ultimo.year }}</dt>
            <dd>
              <strong>{{ dati.ultimo.total }}</strong>
              <span v-if="dati.variazione !== null" class="andamento__variazione" :class="classeVariazione">
                <AppIcon
                  :name="dati.variazione > 0 ? 'in-aumento' : dati.variazione < 0 ? 'in-calo' : 'stabile'"
                />
                {{ testoVariazione }}
              </span>
            </dd>
          </div>
          <div class="andamento__numero">
            <dt><span class="andamento__legenda andamento__legenda--nuovi"></span>Nuovi</dt>
            <dd><strong>{{ dati.ultimo.newMembers }}</strong></dd>
          </div>
          <div class="andamento__numero">
            <dt><span class="andamento__legenda andamento__legenda--rientri"></span>Rientri</dt>
            <dd><strong>{{ dati.ultimo.returningMembers }}</strong></dd>
          </div>
          <div class="andamento__numero">
            <dt><span class="andamento__legenda andamento__legenda--persi"></span>Non rinnovati</dt>
            <dd><strong>{{ dati.ultimo.lostMembers }}</strong></dd>
          </div>
        </dl>
        <p class="andamento__nota">
          Iscritti: soci in regola nell'anno, minorenni esenti compresi. Rientri: tornano dopo almeno
          un anno fuori. Non rinnovati: iscritti l'anno prima ma non in questo.
          <template v-if="dati.ultimo.year === annoCorrente">
            Il {{ annoCorrente }} e' in corso: i non rinnovati scendono man mano che si registrano i
            pagamenti.
          </template>
        </p>
        <div class="andamento__grafico">
          <Bar :data="chartData" :options="chartOptions" aria-label="Grafico dell'andamento degli iscritti negli anni" role="img" />
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { getYearlyStats } from '@/services/db'
import { andamentoTesseramento } from '@/utils/statistiche'
import { useThemeStore } from '@/stores/theme'
import AppIcon from '@/components/base/AppIcon.vue'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  Tooltip,
  Legend,
)

// Riquadro della Home (prima era la pagina Statistiche). Si puo' chiudere: chi apre
// la Home per cercare un socio non deve scorrere il grafico ogni volta.
const CHIAVE_APERTO = 'home_andamento_aperto'
const CHIAVE_PERIODO = 'home_andamento_anni'
const PERIODI = [
  { label: '5 anni', anni: 5 },
  { label: '10 anni', anni: 10 },
  { label: 'Tutto', anni: null },
]

const leggi = (chiave, predefinito) => {
  try {
    const valore = localStorage.getItem(chiave)
    return valore === null ? predefinito : JSON.parse(valore)
  } catch {
    return predefinito
  }
}
const scrivi = (chiave, valore) => {
  try {
    localStorage.setItem(chiave, JSON.stringify(valore))
  } catch {
    // solo una comodita': senza memoria il riquadro torna aperto su 5 anni
  }
}

const themeStore = useThemeStore()
const annoCorrente = new Date().getFullYear()
const loading = ref(true)
const error = ref(null)
const stats = ref([])
const aperto = ref(leggi(CHIAVE_APERTO, true) !== false)
const periodoSalvato = leggi(CHIAVE_PERIODO, 5)
const quantiAnni = ref(PERIODI.some((p) => p.anni === periodoSalvato) ? periodoSalvato : 5)

const cambiaAperto = () => {
  aperto.value = !aperto.value
  scrivi(CHIAVE_APERTO, aperto.value)
}
const scegliPeriodo = (anni) => {
  quantiAnni.value = anni
  scrivi(CHIAVE_PERIODO, anni)
}

onMounted(async () => {
  try {
    stats.value = await getYearlyStats(null, annoCorrente)
  } catch (e) {
    error.value = "Non sono riuscito a calcolare l'andamento."
    console.error(e)
  } finally {
    loading.value = false
  }
})

const dati = computed(() => andamentoTesseramento(stats.value, quantiAnni.value))

const classeVariazione = computed(() =>
  dati.value.variazione > 0 ? 'is-su' : dati.value.variazione < 0 ? 'is-giu' : '',
)
const testoVariazione = computed(() => {
  const v = dati.value.variazione
  const segno = v > 0 ? '+' : v < 0 ? '−' : ''
  return `${segno}${Math.abs(v)} sul ${dati.value.ultimo.year - 1}`
})

// I colori vengono dai token di main.css, letti dal tema attivo.
const colori = computed(() => {
  void themeStore.currentTheme
  const stile = getComputedStyle(document.documentElement)
  const token = (nome) => stile.getPropertyValue(nome).trim()
  return {
    totale: token('--color-accent'),
    nuovi: token('--color-success'),
    rientri: token('--color-info'),
    persi: token('--color-text-secondary'),
    testo: token('--color-text-secondary'),
    griglia: token('--color-border'),
  }
})

const chartData = computed(() => {
  const serie = dati.value.serie
  return {
    labels: serie.map((s) => s.year),
    datasets: [
      {
        type: 'line',
        label: 'Iscritti',
        backgroundColor: colori.value.totale,
        borderColor: colori.value.totale,
        borderWidth: 2,
        tension: 0.3,
        data: serie.map((s) => s.total),
        yAxisID: 'y',
      },
      {
        type: 'bar',
        label: 'Nuovi',
        backgroundColor: colori.value.nuovi,
        data: serie.map((s) => s.newMembers),
        yAxisID: 'y1',
      },
      {
        type: 'bar',
        label: 'Rientri',
        backgroundColor: colori.value.rientri,
        data: serie.map((s) => s.returningMembers),
        yAxisID: 'y1',
      },
      {
        type: 'bar',
        label: 'Non rinnovati',
        backgroundColor: colori.value.persi,
        data: serie.map((s) => s.lostMembers),
        yAxisID: 'y1',
      },
    ],
  }
})

const chartOptions = computed(() => {
  const { testo, griglia, totale } = colori.value
  const font = { family: "'Inter', sans-serif", size: 12 }
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: testo, font } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: testo, font } },
      y: {
        position: 'left',
        beginAtZero: true,
        grid: { color: griglia },
        ticks: { color: testo, font, precision: 0 },
        title: { display: true, text: 'Iscritti (linea)', color: totale, font },
      },
      y1: {
        position: 'right',
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { color: testo, font, precision: 0 },
        title: { display: true, text: 'Entrate e uscite (barre)', color: testo, font },
      },
    },
  }
})
</script>

<style scoped>
.andamento {
  min-width: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-surface);
  padding: var(--space-16) var(--space-24);
}

.andamento__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-12);
}

.andamento__toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-4);
  margin: calc(-1 * var(--space-4));
  border: none;
  border-radius: var(--radius-control);
  background: none;
  box-shadow: none;
  color: inherit;
  font: inherit;
  text-align: left;
  white-space: normal;
  cursor: pointer;
}

.andamento__toggle:hover {
  color: var(--color-accent);
}

.andamento__chevron {
  color: var(--color-text-secondary);
  transform: rotate(-90deg);
  transition: transform 0.15s ease;
}

.andamento__chevron.is-aperto {
  transform: none;
}

.andamento__titolo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  margin: 0;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}

.andamento__periodi {
  display: flex;
  gap: var(--space-4);
}

.andamento__periodo {
  padding: var(--space-4) var(--space-12);
  box-shadow: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-caption);
  cursor: pointer;
}

.andamento__periodo:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-strong);
}

.andamento__periodo[aria-pressed='true'] {
  border-color: var(--color-accent);
  color: var(--color-accent);
  font-weight: 600;
}

.andamento__corpo {
  margin-top: var(--space-16);
}

.andamento__stato {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin: 0;
  color: var(--color-text-secondary);
}

.andamento__stato--errore {
  color: var(--color-danger);
}

.andamento__numeri {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-12);
  margin: 0;
}

.andamento__numero {
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-control);
  background: var(--color-background);
}

.andamento__numero dt {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}

.andamento__numero dd {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--space-8);
  margin: 0;
}

.andamento__numero strong {
  font-size: var(--font-size-section-heading);
  color: var(--color-text-primary);
}

.andamento__legenda {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.andamento__legenda--nuovi {
  background: var(--color-success);
}
.andamento__legenda--rientri {
  background: var(--color-info);
}
.andamento__legenda--persi {
  background: var(--color-text-secondary);
}

.andamento__variazione {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}

.andamento__variazione.is-su {
  color: var(--color-success);
}
.andamento__variazione.is-giu {
  color: var(--color-danger);
}

.andamento__nota {
  margin: var(--space-12) 0 0;
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}

.andamento__grafico {
  position: relative;
  height: 260px;
  margin-top: var(--space-16);
}

@media (prefers-reduced-motion: reduce) {
  .andamento__chevron {
    transition: none;
  }
}
</style>
