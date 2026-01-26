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
        <div class="stat-card">
          <span class="stat-label">Totale Soci</span>
          <span class="stat-value">{{ stats.totalSoci }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Rinnovi {{ currentYear }}</span>
          <span class="stat-value">{{ stats.renewalsCurrent }}</span>
        </div>
        <div class="stat-card highlight">
          <span class="stat-label">Rinnovi {{ currentYear + 1 }}</span>
          <span class="stat-value">{{ stats.renewalsNext }}</span>
        </div>
      </div>

      <!-- Dashboard Charts -->
      <DashboardCharts />

      <!-- Passa i filtri come props E ascolta le modifiche -->
      <FilterPanel :initial-filters="filters" @filters-changed="onFiltersChanged" />

      <div class="search-bar">
        <input
          ref="searchInput"
          v-model="searchTerm"
          @input="onSearch"
          type="text"
          placeholder="Scrivi un nome o cognome... (Ctrl+K)"
        />
      </div>

      <!-- Recent Members Section (Only when not searching) -->
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

      <div class="results-container">
        <!-- PDF Export Button -->
        <div v-if="searchResults.length > 0" class="results-header">
          <span class="results-count">{{ searchResults.length }} soci trovati</span>
          <button @click="exportSociToPdf" :disabled="isExporting" class="pdf-export-button">
            <span v-if="isExporting" class="loading-spinner">⏳</span>
            {{ isExporting ? 'Generazione PDF...' : '📄 Esporta in PDF' }}
          </button>
        </div>

        <p v-if="isSearching">Ricerca in corso...</p>
        <div v-else-if="searchResults.length > 0" class="results-list">
          <SocioCard
            v-for="socio in searchResults"
            :key="socio.id"
            :socio="socio"
            @generate-card="generateSingleCard"
            @quick-renew="quickRenew"
          />
        </div>
        <p v-else-if="hasSearchCriteria && !isSearching">Nessun risultato trovato.</p>
        <p v-else class="help-text">Usa i filtri o la barra di ricerca per trovare i soci.</p>
      </div>

      <!-- DEBUG: Rimuovi in produzione -->
      <div class="debug-panel" v-if="showDebug">
        <h3>Debug Filtri</h3>
        <pre>{{ JSON.stringify(filters, null, 2) }}</pre>
        <p>Risultati trovati: {{ searchResults.length }}</p>
      </div>

      <!-- Pulsante utility per sviluppo -->
      <button @click="clearDatabase" class="dev-button">🗑️ Clear Database (DEV)</button>

      <!-- Pulsante per esportare il database -->
      <button @click="exportDatabase" class="export-button">📥 Export Database</button>
      <button @click="exportChangeLogData" class="export-button">📊 Export Changelog</button>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import {
  db,
  downloadDatabaseExport,
  exportChangeLog,
  getAllSociWithTesseramenti,
  addTesseramento,
  getSetting,
} from '@/services/db'
import { applyFiltersAndSearch } from '@/services/db'
import { generateAndDownloadSociPDF, generateSingleCardPDF } from '@/services/export'
import SocioCard from '@/components/SocioCard.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import DashboardCharts from '@/components/DashboardCharts.vue'

// Stato dell'applicazione
const searchTerm = ref('')
const searchInput = ref(null) // Ref per l'input di ricerca
const searchResults = ref([])
const isSearching = ref(false)
const showDebug = ref(false) // Cambia a true per vedere i dettagli
const isExporting = ref(false) // Stato per l'export PDF
const currentYear = new Date().getFullYear()

const stats = reactive({
  totalSoci: 0,
  renewalsCurrent: 0,
  renewalsNext: 0
})

const recentMembers = ref([]) // Lista soci recenti

// Toast notifications
const toast = useToast()

// Filtri reattivi centralizzati
const filters = reactive({
  ageCategory: 'tutti',
  group: 'Tutti',
  searchTerm: '',
})

// Timer per il debounce della ricerca
let searchTimeout = null

// Computed per verificare se ci sono criteri di ricerca attivi
const hasSearchCriteria = computed(() => {
  return (
    filters.searchTerm.trim() !== '' || filters.ageCategory !== 'tutti' || filters.group !== 'Tutti'
  )
})

const loadStats = async () => {
    try {
      stats.totalSoci = await db.soci.count()
      stats.renewalsCurrent = await db.tesseramenti.where('anno').equals(currentYear).count()
      stats.renewalsNext = await db.tesseramenti.where('anno').equals(currentYear + 1).count()
    } catch (e) {
      console.error("Error loading stats", e)
    }
}

/**
 * Carica i soci recenti dal localStorage
 */
const loadRecentMembers = async () => {
    try {
        const recentIds = JSON.parse(localStorage.getItem('recent_members') || '[]')
        if (recentIds.length > 0) {
            // Fetch soci data
            const soci = await db.soci.where('id').anyOf(recentIds).toArray()
            // Ordina in base all'ordine degli ID salvati (più recenti prima)
            recentMembers.value = recentIds
                .map(id => soci.find(s => s.id === id))
                .filter(s => s) // Rimuove eventuali null (soci cancellati)
        }
    } catch (e) {
        console.error("Error loading recent members", e)
    }
}

onMounted(() => {
  loadStats()
  loadRecentMembers()

  // Smart Focus: Focus search bar on load
  if (searchInput.value) {
      searchInput.value.focus()
  }

  // Keyboard Shortcut: Ctrl/Cmd + K to focus search
  window.addEventListener('keydown', handleKeydown)
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
})

const handleKeydown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (searchInput.value) searchInput.value.focus()
    }
}

/**
 * Handler per il cambio dei filtri dal pannello
 * Riceve i nuovi valori e aggiorna l'oggetto reattivo
 */
const onFiltersChanged = (newFilters) => {
  console.log('Filtri ricevuti da FilterPanel:', newFilters)

  // Aggiorna tutti i filtri mantenendo la reattività
  filters.ageCategory = newFilters.ageCategory
  filters.group = newFilters.group

  // NON aggiorniamo searchTerm qui, viene gestito separatamente
}

/**
 * Handler per la barra di ricerca
 * Aggiorna il filtro searchTerm che triggera il watch
 */
const onSearch = () => {
  filters.searchTerm = searchTerm.value
}

/**
 * Esegue la ricerca applicando tutti i filtri attivi
 * Usa debouncing per evitare troppe query durante la digitazione
 */
const performSearch = async () => {
  // Non cercare se non ci sono criteri
  if (!hasSearchCriteria.value) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  clearTimeout(searchTimeout)

  // Debounce: attendi 300ms dall'ultimo input
  searchTimeout = setTimeout(async () => {
    try {
      console.log('Esecuzione ricerca con filtri:', filters)
      searchResults.value = await applyFiltersAndSearch(filters)
      console.log(`Trovati ${searchResults.value.length} risultati`)
    } catch (error) {
      console.error('Errore durante la ricerca:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)
}

/**
 * Watch sui filtri per triggerare automaticamente la ricerca
 * Deep: true monitora anche le proprietà interne dell'oggetto
 */
watch(
  filters,
  () => {
    console.log('Filtri modificati, eseguo ricerca')
    performSearch()
  },
  { deep: true },
)

/**
 * Utility per sviluppo: cancella il database e ricarica
 */
const clearDatabase = async () => {
  if (!confirm('Sei sicuro di voler cancellare tutto il database?')) {
    return
  }

  try {
    await db.delete()
    await db.open()
    console.log('Database cancellato con successo')
    window.location.reload()
  } catch (error) {
    console.error('Errore durante la cancellazione:', error)
  }
}

/**
 * Export the entire database as SQLite file
 */
const exportDatabase = async () => {
  try {
    await downloadDatabaseExport()
    alert('Database export completato! Controlla i download del browser.')
  } catch (error) {
    console.error('Export failed:', error)
    alert("Errore durante l'esportazione: " + error.message)
  }
}

/**
 * Export the change log as JSON file
 */
const exportChangeLogData = async () => {
  try {
    const result = await exportChangeLog()
    if (result.success) {
      // Trigger download
      const url = URL.createObjectURL(result.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      alert(`Changelog esportato! ${result.changes_count} modifiche registrate.`)
    } else {
      alert("Errore durante l'esportazione del changelog: " + result.error)
    }
  } catch (error) {
    console.error('Changelog export failed:', error)
    alert("Errore durante l'esportazione del changelog: " + error.message)
  }
}

/**
 * Export search results to PDF
 */
const exportSociToPdf = async () => {
  if (searchResults.value.length === 0) {
    toast.warning('Nessun socio da esportare')
    return
  }

  try {
    isExporting.value = true
    toast.info("Preparazione dati per l'export...")

    // Carica tutti i soci con i tesseramenti per calcolare correttamente gli arretrati
    const allSociWithTesseramenti = await getAllSociWithTesseramenti()

    // Filtra per il gruppo selezionato (se presente)
    let sociToExport = allSociWithTesseramenti
    if (filters.group && filters.group !== 'Tutti') {
      sociToExport = allSociWithTesseramenti.filter(
        (socio) => socio.gruppo_appartenenza === filters.group,
      )
    } else {
      // Se non c'è filtro gruppo specifico, usa i risultati della ricerca corrente
      // ma dobbiamo matchare con i dati completi che hanno i tesseramenti
      const searchResultIds = searchResults.value.map((s) => s.id)
      sociToExport = allSociWithTesseramenti.filter((socio) => searchResultIds.includes(socio.id))
    }

    toast.info('Generazione PDF in corso...')
    await generateAndDownloadSociPDF(sociToExport)
    toast.success('PDF esportato con successo! Controlla i download del browser.')
  } catch (error) {
    console.error('PDF export failed:', error)
    toast.error("Errore durante l'esportazione PDF: " + error.message)
  } finally {
    isExporting.value = false
  }
}

/**
 * Generate a single card PDF for a specific member
 */
const generateSingleCard = async (socio) => {
  if (!socio) return

  try {
    const renewalYear = new Date().getFullYear()
    toast.info('Generazione tessera in corso...')
    await generateSingleCardPDF(socio, renewalYear)
    toast.success('Tessera generata con successo! Controlla i download del browser.')
  } catch (error) {
    console.error('Single card generation failed:', error)
    toast.error('Errore durante la generazione della tessera: ' + error.message)
  }
}

/**
 * Rinnovo veloce dalla dashboard
 */
const quickRenew = async (socio) => {
    if(!confirm(`Confermi il rinnovo standard per ${socio.nome} ${socio.cognome}?`)) return

    try {
        const defaultQuota = await getSetting('defaultQuota', 10.0)

        await addTesseramento({
             id_socio: socio.id,
             anno: currentYear,
             data_pagamento: new Date().toISOString().split('T')[0],
             quota_pagata: defaultQuota,
             numero_ricevuta: 0,
             numero_blocchetto: 0
        })

        toast.success(`Rinnovo completato per ${socio.nome} ${socio.cognome}`)

        // Aggiorna contatori
        loadStats()

        // Aggiorna liste parzialmente
        if (recentMembers.value.length > 0) {
           loadRecentMembers()
        }

        // Triggera la ricerca per aggiornare lo stato (poiché SocioCard reagisce ai dati)
        // Tuttavia, SocioCard fetch i dati autonomamente, quindi un semplice re-render o update della prop "socio" è sufficiente
        // Ma per sicurezza, ricarichiamo i risultati
        if (hasSearchCriteria.value) {
             // onSearch() triggera il watch, ma qui vogliamo forzare l'esecuzione
             // Invochiamo performSearch direttamente se esistesse, ma è dentro un watch.
             // Trucco: riassegnare searchTerm? No.
             // Invochiamo semplicemente applyFiltersAndSearch
             const results = await applyFiltersAndSearch(filters)
             searchResults.value = results
        }

    } catch(e) {
        console.error(e)
        // Check if error is due to existing payment
        toast.error("Errore rinnovo: " + e.message)
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
}

.stat-card.highlight {
  border-color: var(--color-accent);
  background: linear-gradient(to bottom right, var(--color-surface), rgba(183, 28, 28, 0.05));
}

.stat-label {
  font-size: 0.9rem;
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
  font-size: 1rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-socio-button:hover {
  background-color: #a22a2a;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(183, 28, 28, 0.3);
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
  background-color: var(--color-surface);
  transition: all 0.3s ease;
}

.search-bar input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(183, 28, 28, 0.1);
}

.results-container {
  margin-top: 2rem;
  min-height: 200px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--color-surface);
  border-radius: 8px;
  border: 2px solid var(--color-border);
}

.results-count {
  font-weight: 600;
  color: var(--color-primary);
  font-size: 1.1rem;
}

.pdf-export-button {
  padding: 0.6rem 1.2rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.pdf-export-button:hover {
  background-color: #333;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.help-text {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 3rem;
  font-size: 1.1rem;
}

/* Debug Panel - Solo per sviluppo */
.debug-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  color: lime;
  padding: 1rem;
  border-radius: 8px;
  max-width: 400px;
  font-family: monospace;
  font-size: 0.85rem;
  z-index: 9999;
}

.debug-panel h3 {
  color: yellow;
  margin-bottom: 0.5rem;
}

.debug-panel pre {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 300px;
}

.dev-button {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background-color: #ff4444;
  opacity: 0.7;
  font-size: 0.9rem;
  z-index: 1000;
}

.dev-button:hover {
  opacity: 1;
}

.export-button {
  position: fixed;
  bottom: 60px;
  left: 20px;
  background-color: #4caf50;
  opacity: 0.7;
  font-size: 0.9rem;
  z-index: 1000;
}

.export-button:hover {
  opacity: 1;
}

/* Loading spinner */
.loading-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .header-section {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .add-socio-button {
    width: 100%;
    text-align: center;
    justify-content: center;
  }

  .results-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .results-count {
    text-align: center;
  }

  .debug-panel {
    font-size: 0.7rem;
    max-width: 250px;
  }
}

.recent-section {
    margin-bottom: 2rem;
}
.recent-section h3 {
    margin-bottom: 1rem;
    color: var(--color-text-secondary);
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 1px;
}
</style>
