<template>
  <div class="home">
    <main class="dashboard">
      <div class="header-section">
        <h1>Cerca Socio</h1>
        <router-link to="/socio/nuovo" class="add-socio-button accent">
          + Aggiungi Nuovo Socio
        </router-link>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div
          class="stat-card clickable"
          @click="setYearFilter(null)"
          :class="{
            active:
              !filters.renewalYear &&
              !filters.searchTerm &&
              filters.group === 'Tutti' &&
              filters.ageCategory === 'tutti',
          }"
        >
          <span class="stat-label">Totale Soci</span>
          <span class="stat-value">{{ stats.totalSoci }}</span>
        </div>
        <div
          class="stat-card clickable"
          @click="setYearFilter(currentYear)"
          :class="{ active: filters.renewalYear === currentYear }"
        >
          <span class="stat-label">Rinnovi {{ currentYear }}</span>
          <span class="stat-value">{{ stats.renewalsCurrent }}</span>
        </div>
        <div
          class="stat-card highlight clickable"
          @click="setYearFilter(currentYear + 1)"
          :class="{ active: filters.renewalYear === currentYear + 1 }"
        >
          <span class="stat-label">Rinnovi {{ currentYear + 1 }}</span>
          <span class="stat-value">{{ stats.renewalsNext }}</span>
        </div>
      </div>

      <!-- Dashboard Charts -->
      <DashboardCharts />

      <!-- Main Content Area: Search Controls and Results -->
      <FilterPanel :initial-filters="filters" @filters-changed="onFiltersChanged" />

      <div class="dashboard-grid">
        <!-- Left Column: Search & Results -->
        <div class="search-column">
          <div class="search-bar">
            <input
              ref="searchInput"
              v-model="searchTerm"
              @input="onSearch"
              type="text"
              placeholder="Scrivi un nome o cognome... (Ctrl+K)"
            />
          </div>

          <div class="results-container">
            <!-- PDF Export Button -->
            <div v-if="searchResults.length > 0" class="results-header">
              <span class="results-count">{{ searchResults.length }} soci trovati</span>
              <button @click="exportSociToPdf" :disabled="isExporting" class="pdf-export-button">
                <span v-if="isExporting" class="loading-spinner">⏳</span>
                {{ isExporting ? 'Esporta PDF' : '📄 Esporta PDF' }}
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

            <!-- Recent Members (Only when empty search) -->
            <div v-if="!hasSearchCriteria && recentMembers.length > 0" class="recent-section">
              <h3>🕒 Ultimi Soci Visitati</h3>
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

            <p v-else-if="!hasSearchCriteria" class="help-text">
              Usa i filtri o la barra di ricerca per trovare i soci.
            </p>
          </div>
        </div>

        <!-- Right Column: Sidebar (Activity) -->
        <aside class="activity-sidebar">
          <h3>⚡ Attività Recente</h3>
          <div v-if="activityLogs.length > 0" class="activity-list">
            <div v-for="log in activityLogs" :key="log.id" class="activity-item">
              <div class="activity-icon" :class="log.type">
                {{ log.type === 'create' ? '✨' : log.type === 'update' ? '📝' : '🗑️' }}
              </div>
              <div class="activity-content">
                <div class="activity-desc">{{ log.description }}</div>
                <div class="activity-time">{{ formatActivityTime(log.timestamp) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-activity">Nessuna attività registrata di recente.</div>

          <div class="quick-links">
            <h4>🔗 Link Rapidi</h4>
            <router-link to="/registrazione-seriale" class="q-link"
              >🔄 Inserimento Rapido</router-link
            >
            <router-link to="/reports" class="q-link">📊 Report Annuali</router-link>
          </div>
        </aside>
      </div>

      <!-- Debug Panel -->
      <div class="debug-panel" v-if="showDebug">
        <h3>Debug Filtri</h3>
        <pre>{{ JSON.stringify(filters, null, 2) }}</pre>
      </div>

      <!-- Utility Footer -->
      <footer class="dashboard-footer">
        <div class="footer-actions">
          <button @click="exportDatabase" class="utility-button secondary">📥 Backup DB</button>
          <button @click="exportChangeLogData" class="utility-button secondary">
            📊 Changelog
          </button>
          <button @click="clearDatabase" class="utility-button danger">🗑️ Reset DB</button>
        </div>
        <p class="footer-note">Sistema Gestionale Ceraiolo Digitale - v1.0</p>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  db,
  downloadDatabaseExport,
  exportChangeLog,
  getAllSociWithTesseramenti,
  addTesseramento,
  getSetting,
  getRecentActivity,
  applyFiltersAndSearch,
} from '@/services/db'
import { generateAndDownloadSociPDF, generateSingleCardPDF } from '@/services/export'
import SocioCard from '@/components/SocioCard.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import DashboardCharts from '@/components/DashboardCharts.vue'

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
      toast.info(`Visualizzazione: Rinnovi ${year}`)
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

watch(filters, performSearch, { deep: true })

watch(searchResults, (results) => {
  if (results && results.length > 0) {
    const ids = results.map((s) => s.id)
    localStorage.setItem('search_context_ids', JSON.stringify(ids))
  }
})

// Database Actions
const clearDatabase = async () => {
  if (!confirm('Sei sicuro di voler cancellare tutto il database?')) return
  try {
    await db.delete()
    await db.open()
    window.location.reload()
  } catch (error) {
    console.error('Clear DB failed:', error)
  }
}

const exportDatabase = async () => {
  try {
    await downloadDatabaseExport()
    toast.success('Backup completato!')
  } catch (error) {
    console.error('Export failed:', error)
    toast.error('Errore backup: ' + error.message)
  }
}

const exportChangeLogData = async () => {
  try {
    const result = await exportChangeLog()
    if (result.success) {
      const url = URL.createObjectURL(result.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Changelog esportato!')
    }
  } catch (error) {
    console.error('Export changelog failed:', error)
    toast.error('Errore export changelog')
  }
}

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
  if (!confirm(`Rinnovare ${socio.nome} ${socio.cognome}?`)) return
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 3px solid var(--color-accent);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--color-surface);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-card.highlight {
  border-color: var(--color-accent);
  background: linear-gradient(to bottom right, var(--color-surface), rgba(183, 28, 28, 0.05));
}

.stat-card.active {
  border: 2px solid var(--color-primary);
  background-color: var(--color-surface-hover);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.add-socio-button {
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
  margin-top: 2rem;
}

.search-bar {
  margin-bottom: 2rem;
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
  outline: none;
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

.quick-links {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.q-link {
  padding: 0.6rem;
  background: var(--color-background);
  border-radius: 6px;
  text-decoration: none;
  color: var(--color-text-primary);
  font-size: 0.9rem;
  border: 1px solid transparent;
}

.q-link:hover {
  border-color: var(--color-accent);
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

.status-msg,
.help-text {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
}

.dashboard-footer {
  margin-top: 4rem;
  padding: 2rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.footer-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.utility-button {
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
}

.utility-button.danger {
  color: var(--color-danger);
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
