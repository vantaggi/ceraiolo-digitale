<template>
  <div class="home">
    <main class="dashboard">
      <PageHeader title="Soci">
        <template #actions>
          <router-link to="/socio/nuovo" class="add-socio-button accent">
            <AppIcon name="nuovo-socio" /> Nuovo socio
          </router-link>
        </template>
      </PageHeader>

      <div class="search-bar">
        <input
          aria-label="Cerca un socio per nome o cognome"
          ref="searchInput"
          v-model="searchTerm"
          @input="onSearch"
          type="search"
          placeholder="Scrivi un nome o cognome... (Ctrl+K)"
        />
      </div>

      <FilterPanel :initial-filters="filters" @filters-changed="onFiltersChanged" />

      <!-- Numeri dell'anno: ognuno filtra l'elenco; l'andamento sta sotto, a ricerca vuota -->
      <div class="numbers-row">
        <button
          type="button"
          class="number-chip"
          :aria-pressed="!hasSearchCriteria"
          @click="setYearFilter(null)"
        >
          Soci <strong>{{ stats.totalSoci }}</strong>
        </button>
        <button
          type="button"
          class="number-chip"
          :aria-pressed="filters.renewalYear === currentYear"
          @click="setYearFilter(currentYear)"
        >
          Pagamenti {{ currentYear }} <strong>{{ stats.renewalsCurrent }}</strong>
        </button>
        <button
          type="button"
          class="number-chip"
          :aria-pressed="filters.renewalYear === currentYear + 1"
          @click="setYearFilter(currentYear + 1)"
        >
          Pagamenti {{ currentYear + 1 }} <strong>{{ stats.renewalsNext }}</strong>
        </button>
      </div>

      <div class="dashboard-grid" :class="{ 'dashboard-grid--solo': hasSearchCriteria }">
        <!-- Left Column: Search & Results -->
        <div class="search-column">
          <div class="results-container">
            <!-- PDF Export Button -->
            <div v-if="searchResults.length > 0" class="results-header">
              <span class="results-count">{{ searchResults.length }} soci trovati</span>
              <button @click="exportSociToPdf" :disabled="isExporting" class="pdf-export-button">
                <AppIcon :name="isExporting ? 'caricamento' : 'esporta'" :spin="isExporting" />
                Esporta PDF
              </button>
            </div>

            <p v-if="isSearching" class="status-msg">Ricerca in corso...</p>
            <div v-else-if="searchResults.length > 0" class="results-list">
              <SocioCard
                v-for="socio in searchResults"
                :key="socio.id"
                :socio="socio"
                @generate-card="generateSingleCard"
                @quick-renew="quickRenew"
              />
            </div>
            <p v-else-if="hasSearchCriteria && !isSearching" class="status-msg">
              Nessun risultato trovato.
            </p>

            <!-- A ricerca vuota: andamento del tesseramento e ultimi soci visitati -->
            <AndamentoTesseramento v-if="!hasSearchCriteria" />

            <div v-if="!hasSearchCriteria && recentMembers.length > 0" class="recent-section">
              <h3><AppIcon name="recenti" /> Ultimi Soci Visitati</h3>
              <div class="results-list">
                <SocioCard
                  v-for="socio in recentMembers"
                  :key="socio.id"
                  :socio="socio"
                  @generate-card="generateSingleCard"
                  @quick-renew="quickRenew"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Sidebar (Activity) -->
        <aside v-if="!hasSearchCriteria" class="activity-sidebar">
          <h3><AppIcon name="attivita" /> Attività Recente</h3>
          <div v-if="activityLogs.length > 0" class="activity-list">
            <div v-for="log in activityLogs" :key="log.id" class="activity-item">
              <div class="activity-icon" :class="log.type">
                <AppIcon
                  :name="log.type === 'create' ? 'aggiungi' : log.type === 'update' ? 'modifica' : 'elimina'"
                />
              </div>
              <div class="activity-content">
                <div class="activity-desc">{{ log.description }}</div>
                <div class="activity-time">{{ formatActivityTime(log.timestamp) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-activity">Nessuna attività registrata di recente.</div>

        </aside>
      </div>

      <!-- Debug Panel -->
      <div class="debug-panel" v-if="showDebug">
        <h3>Debug Filtri</h3>
        <pre>{{ JSON.stringify(filters, null, 2) }}</pre>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { askConfirm } from '@/composables/useDialog'
import {
  db,
  getAllSociWithTesseramenti,
  addTesseramento,
  getSetting,
  getRecentActivity,
  applyFiltersAndSearch,
} from '@/services/db'
import { generateAndDownloadSociPDF, generateSingleCardPDF } from '@/services/export'
import SocioCard from '@/components/SocioCard.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import AndamentoTesseramento from '@/components/AndamentoTesseramento.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import { leggiRicerca, salvaRicerca } from '@/utils/ricercaSoci'

// Stato dell'applicazione
const searchTerm = ref('')
const searchInput = ref(null)
const searchResults = ref([])
const isSearching = ref(false)
const showDebug = ref(false)
const isExporting = ref(false)
const currentYear = new Date().getFullYear()

const stats = reactive({
  totalSoci: 0,
  renewalsCurrent: 0,
  renewalsNext: 0,
})

const recentMembers = ref([])
const activityLogs = ref([])

const toast = useToast()
const route = useRoute()
const router = useRouter()

// Handlers
const checkSearchFocus = () => {
  if (route.query.action === 'search') {
    setTimeout(() => {
      searchInput.value?.focus()
      const yOffset = -100
      const element = searchInput.value
      if (element) {
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
    }, 100)
    router.replace({ query: {} })
  }
}

const handleKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    if (searchInput.value) searchInput.value.focus()
  }
}

const loadStats = async () => {
  try {
    stats.totalSoci = await db.soci.count()
    stats.renewalsCurrent = await db.tesseramenti.where('anno').equals(currentYear).count()
    stats.renewalsNext = await db.tesseramenti
      .where('anno')
      .equals(currentYear + 1)
      .count()
  } catch (e) {
    console.error('Error loading stats', e)
  }
}

const loadRecentMembers = async () => {
  try {
    const recentIds = JSON.parse(localStorage.getItem('recent_members') || '[]')
    if (recentIds.length > 0) {
      const soci = await db.soci.where('id').anyOf(recentIds).toArray()
      recentMembers.value = recentIds.map((id) => soci.find((s) => s.id === id)).filter((s) => s)
    }
  } catch (e) {
    console.error('Error loading recent members', e)
  }
}

const loadActivityLogs = async () => {
  try {
    activityLogs.value = await getRecentActivity(6)
  } catch (e) {
    console.error('Error loading activity logs', e)
  }
}

const formatActivityTime = (ts) => {
  const date = new Date(ts)
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

// Lifecycle
onMounted(() => {
  checkSearchFocus()
  loadStats()
  loadRecentMembers()
  loadActivityLogs()

  if (searchInput.value) {
    searchInput.value.focus()
  }

  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// Filters & Search
const filters = reactive({
  ageCategory: 'tutti',
  group: 'Tutti',
  searchTerm: '',
  renewalYear: null,
})

// La ricerca resta quando si torna dal dettaglio di un socio
const ricercaSalvata = leggiRicerca(window.sessionStorage)
if (ricercaSalvata) {
  Object.assign(filters, ricercaSalvata)
  searchTerm.value = filters.searchTerm || ''
}

let searchTimeout = null

const hasSearchCriteria = computed(() => {
  return (
    filters.searchTerm.trim() !== '' ||
    filters.ageCategory !== 'tutti' ||
    filters.group !== 'Tutti' ||
    filters.renewalYear !== null
  )
})

const onFiltersChanged = (newFilters) => {
  filters.ageCategory = newFilters.ageCategory
  filters.group = newFilters.group
}

const setYearFilter = (year) => {
  if (year === null) {
    filters.renewalYear = null
    filters.group = 'Tutti'
    filters.ageCategory = 'tutti'
    filters.searchTerm = ''
    searchTerm.value = ''
    toast.info('Visualizzazione: Tutti i soci')
  } else {
    if (filters.renewalYear === year) {
      filters.renewalYear = null
      toast.info('Filtro anno rimosso')
    } else {
      filters.renewalYear = year
      toast.info(`Visualizzazione: pagamenti ${year}`)
    }
  }
}

const onSearch = () => {
  filters.searchTerm = searchTerm.value
}

const performSearch = async () => {
  if (!hasSearchCriteria.value) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  clearTimeout(searchTimeout)

  searchTimeout = setTimeout(async () => {
    try {
      searchResults.value = await applyFiltersAndSearch(filters)
    } catch (error) {
      console.error('Search error:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)
}

watch(
  filters,
  () => {
    salvaRicerca(window.sessionStorage, filters)
    performSearch()
  },
  { deep: true },
)
if (ricercaSalvata) performSearch()

watch(searchResults, (results) => {
  if (results && results.length > 0) {
    const ids = results.map((s) => s.id)
    localStorage.setItem('search_context_ids', JSON.stringify(ids))
  }
})

// Database Actions



const exportSociToPdf = async () => {
  if (searchResults.value.length === 0) return
  try {
    isExporting.value = true
    const allSoci = await getAllSociWithTesseramenti()
    let sociToExport = allSoci
    if (filters.group && filters.group !== 'Tutti') {
      sociToExport = allSoci.filter((s) => s.gruppo_appartenenza === filters.group)
    } else {
      const ids = searchResults.value.map((s) => s.id)
      sociToExport = allSoci.filter((s) => ids.includes(s.id))
    }
    await generateAndDownloadSociPDF(sociToExport)
    toast.success('PDF generato!')
  } catch (error) {
    console.error('Export PDF fallito:', error)
    toast.error('Errore PDF')
  } finally {
    isExporting.value = false
  }
}

const generateSingleCard = async (socio) => {
  try {
    await generateSingleCardPDF(socio, currentYear)
    toast.success('Tessera generata!')
  } catch (error) {
    console.error('Generazione tessera fallita:', error)
    toast.error('Errore tessera')
  }
}


const quickRenew = async (socio) => {
  const conferma = await askConfirm({
    title: `Rinnovare ${socio.nome} ${socio.cognome}?`,
    message: `Viene registrato il pagamento ${currentYear} con la quota predefinita.`,
    confirmLabel: 'Rinnova',
  })
  if (!conferma) return
  try {
    const quota = await getSetting('defaultQuota', 10.0)
    await addTesseramento({
      id_socio: socio.id,
      anno: currentYear,
      data_pagamento: new Date().toISOString().split('T')[0],
      quota_pagata: quota,
      numero_ricevuta: 0,
      numero_blocchetto: 0,
    })
    toast.success('Rinnovo completato!')
    loadStats()
    loadActivityLogs()
    if (hasSearchCriteria.value) {
      searchResults.value = await applyFiltersAndSearch(filters)
    }
  } catch (e) {
    toast.error('Errore: ' + e.message)
  }
}
</script>

<style scoped>
.dashboard {
  max-width: var(--page-width);
  margin: 0 auto;
  padding: 2rem;
}

.numbers-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-8);
  margin-bottom: var(--space-24);
}

.number-chip {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-8);
  padding: var(--space-4) var(--space-12);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
  cursor: pointer;
}

.number-chip strong {
  color: var(--color-text-primary);
}

.number-chip:hover {
  background-color: var(--color-surface-hover);
  border-color: var(--color-border-strong);
}

.number-chip[aria-pressed='true'] {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.add-socio-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  padding: 0.75rem 1.5rem;
  background-color: var(--color-accent);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
}

.add-socio-button:hover {
  background-color: var(--color-accent-hover);
  transform: translateY(-1px);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
}

.dashboard-grid > * {
  min-width: 0;
}

.dashboard-grid--solo {
  grid-template-columns: 1fr;
}

.search-bar {
  margin-bottom: var(--space-16);
}

.search-bar input {
  width: 100%;
  padding: 1rem;
  font-size: 1.2rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.search-bar input:focus {
  border-color: var(--color-accent);
}

.activity-sidebar {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
}

.activity-sidebar h3 {
  margin-top: 0;
  color: var(--color-primary);
  font-size: 1.1rem;
  margin-bottom: 1.2rem;
}

.activity-item {
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid var(--color-border);
}

.activity-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--color-background);
}

.activity-icon.create {
  background: rgba(56, 142, 60, 0.1);
}
.activity-icon.update {
  background: rgba(2, 136, 209, 0.1);
}
.activity-icon.delete {
  background: rgba(211, 47, 47, 0.1);
}

.activity-desc {
  font-size: 0.9rem;
  color: var(--color-text-primary);
}

.activity-time {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}




.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.pdf-export-button {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recent-section {
  margin-top: 2rem;
}

.recent-section h3 {
  font-size: 1rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.status-msg {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
}





@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
