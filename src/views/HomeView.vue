<template>
  <div class="home">
    <div class="dashboard">
      <PageHeader title="Soci">
        <template #actions>
          <RouterLink to="/socio/nuovo" class="add-socio-button">
            <AppIcon name="nuovo-socio" /> Nuovo socio
          </RouterLink>
        </template>
      </PageHeader>

      <div class="search-bar">
        <label for="cerca-socio" class="sr-only">Cerca un socio per nome, cognome o note</label>
        <AppIcon name="ricerca" class="search-bar__icona" />
        <input
          id="cerca-socio"
          ref="searchInput"
          v-model="searchTerm"
          type="search"
          placeholder="Scrivi un nome o un cognome"
          aria-describedby="cerca-socio-aiuto"
          @input="onSearch"
          @keydown.enter="apriUnico"
        />
        <kbd class="search-bar__tasto" aria-hidden="true">Ctrl K</kbd>
        <p id="cerca-socio-aiuto" class="sr-only">
          Con un solo risultato, Invio apre il socio. Ctrl+K torna qui da ogni pagina.
        </p>
      </div>

      <!-- Filtri a etichette in una riga; i numeri dell'anno filtrano l'elenco -->
      <div class="filtri" role="group" aria-label="Filtri">
        <label class="filtro" :class="{ 'filtro--attivo': filters.ageCategory !== 'tutti' }">
          <span class="filtro__nome">Età</span>
          <select v-model="filters.ageCategory">
            <option value="tutti">tutte</option>
            <option value="maggiorenni">maggiorenni</option>
            <option value="minorenni">minorenni</option>
          </select>
        </label>
        <label class="filtro" :class="{ 'filtro--attivo': filters.group !== 'Tutti' }">
          <span class="filtro__nome">Manicchia</span>
          <select v-model="filters.group">
            <option value="Tutti">tutte</option>
            <option v-for="g in manicchie" :key="g" :value="g">{{ g }}</option>
          </select>
        </label>
        <button
          type="button"
          class="filtro"
          :class="{ 'filtro--attivo': filters.renewalYear === currentYear }"
          :aria-pressed="filters.renewalYear === currentYear"
          @click="setYearFilter(currentYear)"
        >
          <span class="filtro__nome">Pagamenti {{ currentYear }}</span>
          <strong>{{ stats.renewalsCurrent }}</strong>
        </button>
        <button
          type="button"
          class="filtro"
          :class="{ 'filtro--attivo': filters.renewalYear === currentYear + 1 }"
          :aria-pressed="filters.renewalYear === currentYear + 1"
          @click="setYearFilter(currentYear + 1)"
        >
          <span class="filtro__nome">Pagamenti {{ currentYear + 1 }}</span>
          <strong>{{ stats.renewalsNext }}</strong>
        </button>
        <span class="filtri__totale">{{ stats.totalSoci }} soci in archivio</span>
        <button v-if="hasSearchCriteria" type="button" class="link-btn" @click="azzera">
          <AppIcon name="chiudi" /> Azzera
        </button>
      </div>

      <!-- Con una ricerca: solo i risultati, a tutta larghezza -->
      <section v-if="hasSearchCriteria" class="risultati" aria-labelledby="titolo-risultati">
        <header class="risultati__header">
          <h2 id="titolo-risultati" aria-live="polite">
            <template v-if="isSearching">Ricerca in corso…</template>
            <template v-else>{{ searchResults.length }} {{ searchResults.length === 1 ? 'socio trovato' : 'soci trovati' }}</template>
          </h2>
          <BaseButton
            v-if="searchResults.length > 0"
            variant="secondary"
            :loading="isExporting"
            @click="exportSociToPdf"
          >
            <AppIcon name="esporta" /> Esporta PDF
          </BaseButton>
        </header>

        <ElencoSoci
          v-if="searchResults.length > 0"
          :soci="searchResults"
          :anni-pagati="anniPagati"
          :anno="currentYear"
          :generando="tesseraInCorso"
          titolo="Soci trovati"
          @paga="apriPagamento"
          @tessera="generateSingleCard"
        />
        <p v-else-if="!isSearching" class="vuoto">
          Nessun socio trovato. Controlla l'ortografia o
          <button type="button" class="link-btn" @click="azzera">azzera i filtri</button>.
        </p>
      </section>

      <!-- A ricerca vuota: ultimi soci aperti, andamento, ultime modifiche -->
      <div v-else class="dashboard-grid">
        <div class="colonna">
          <section v-if="recentMembers.length > 0" class="recenti" aria-labelledby="titolo-recenti">
            <h2 id="titolo-recenti"><AppIcon name="recenti" /> Ultimi soci aperti</h2>
            <ElencoSoci
              :soci="recentMembers"
              :anni-pagati="anniPagati"
              :anno="currentYear"
              :generando="tesseraInCorso"
              titolo="Ultimi soci aperti"
              @paga="apriPagamento"
              @tessera="generateSingleCard"
            />
          </section>

          <AndamentoTesseramento />
        </div>

        <aside class="activity-sidebar" aria-labelledby="titolo-modifiche">
          <h2 id="titolo-modifiche"><AppIcon name="attivita" /> Ultime modifiche</h2>
          <ul v-if="activityLogs.length > 0" class="activity-list">
            <li v-for="log in activityLogs" :key="log.id" class="activity-item">
              <span class="activity-icon" :class="`activity-icon--${log.type}`">
                <AppIcon
                  :name="log.type === 'create' ? 'aggiungi' : log.type === 'update' ? 'modifica' : 'elimina'"
                />
              </span>
              <span class="activity-content">
                <span class="activity-desc">{{ log.description }}</span>
                <span class="activity-time">{{ formatActivityTime(log.timestamp) }}</span>
              </span>
            </li>
          </ul>
          <p v-else class="vuoto">Nessuna modifica recente.</p>
        </aside>
      </div>

      <AddPaymentModal
        v-if="socioDaPagare"
        :show="socioDaPagare !== null"
        :socio-id="String(socioDaPagare.id)"
        :years-to-pay="[currentYear]"
        :anno-riferimento="currentYear"
        @payments-saved="salvaPagamento"
        @close="socioDaPagare = null"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  db,
  getAllSociWithTesseramenti,
  addTesseramento,
  getRecentActivity,
  applyFiltersAndSearch,
  getAnniPagatiDiSoci,
  getUniqueGroups,
} from '@/services/db'
import { generateAndDownloadSociPDF, generateSingleCardPDF } from '@/services/export'
import ElencoSoci from '@/components/ElencoSoci.vue'
import AddPaymentModal from '@/components/AddPaymentModal.vue'
import AndamentoTesseramento from '@/components/AndamentoTesseramento.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import { leggiRecenti, leggiRicerca, salvaRicerca } from '@/utils/ricercaSoci'

// Stato dell'applicazione
const searchTerm = ref('')
const searchInput = ref(null)
const searchResults = ref([])
const isSearching = ref(false)
const isExporting = ref(false)
const tesseraInCorso = ref(null)
const socioDaPagare = ref(null)
const manicchie = ref([])
const anniPagati = ref(new Map())
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
    setTimeout(() => searchInput.value?.focus(), 100)
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
    const recentIds = leggiRecenti(window.localStorage)
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

// Stato della quota di chi e' in elenco (risultati e ultimi aperti), letto in una volta
const caricaAnniPagati = async () => {
  const ids = [...new Set([...searchResults.value, ...recentMembers.value].map((s) => s.id))]
  try {
    anniPagati.value = await getAnniPagatiDiSoci(ids)
  } catch (e) {
    console.error('Errore lettura pagamenti', e)
  }
}

// Lifecycle
onMounted(async () => {
  checkSearchFocus()
  loadStats()
  loadActivityLogs()
  getUniqueGroups().then((g) => (manicchie.value = g))
  searchInput.value?.focus()
  window.addEventListener('keydown', handleKeydown)
  await loadRecentMembers()
  caricaAnniPagati()
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

const setYearFilter = (year) => {
  filters.renewalYear = filters.renewalYear === year ? null : year
}

const azzera = () => {
  filters.renewalYear = null
  filters.group = 'Tutti'
  filters.ageCategory = 'tutti'
  filters.searchTerm = ''
  searchTerm.value = ''
  searchInput.value?.focus()
}

const onSearch = () => {
  filters.searchTerm = searchTerm.value
}

const ordinaPerNome = (a, b) =>
  `${a.cognome} ${a.nome}`.localeCompare(`${b.cognome} ${b.nome}`, 'it', { sensitivity: 'base' })

const cerca = async () => {
  searchResults.value = (await applyFiltersAndSearch(filters)).sort(ordinaPerNome)
  await caricaAnniPagati()
}

const performSearch = async () => {
  clearTimeout(searchTimeout)
  if (!hasSearchCriteria.value) {
    searchResults.value = []
    isSearching.value = false
    return
  }

  isSearching.value = true
  searchTimeout = setTimeout(async () => {
    try {
      await cerca()
    } catch (error) {
      console.error('Search error:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)
}

// Invio nel campo di ricerca: con un solo socio trovato lo apre
const apriUnico = () => {
  if (!isSearching.value && searchResults.value.length === 1) {
    router.push({ name: 'socio-detail', params: { id: searchResults.value[0].id } })
  }
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

// Azioni

// Il PDF contiene esattamente i soci mostrati in elenco
const exportSociToPdf = async () => {
  if (searchResults.value.length === 0) return
  try {
    isExporting.value = true
    const ids = new Set(searchResults.value.map((s) => s.id))
    const sociToExport = (await getAllSociWithTesseramenti()).filter((s) => ids.has(s.id))
    await generateAndDownloadSociPDF(sociToExport)
    toast.success('PDF generato')
  } catch (error) {
    console.error('Export PDF fallito:', error)
    toast.error('PDF non generato: ' + error.message)
  } finally {
    isExporting.value = false
  }
}

const generateSingleCard = async (socio) => {
  tesseraInCorso.value = socio.id
  try {
    await generateSingleCardPDF(socio, currentYear)
    toast.success('Tessera generata')
  } catch (error) {
    console.error('Generazione tessera fallita:', error)
    toast.error('Tessera non generata: ' + error.message)
  } finally {
    tesseraInCorso.value = null
  }
}

const apriPagamento = (socio) => {
  socioDaPagare.value = socio
}

const salvaPagamento = async ({ details, years, socioId }) => {
  try {
    for (const anno of years) {
      await addTesseramento({
        id_socio: socioId,
        anno,
        quota_pagata: details.quota_pagata,
        data_pagamento: details.data_pagamento,
        numero_ricevuta: details.numero_ricevuta,
        numero_blocchetto: details.numero_blocchetto,
      })
    }
    toast.success(`Pagamento registrato per ${socioDaPagare.value.cognome} ${socioDaPagare.value.nome}`)
    socioDaPagare.value = null
    loadStats()
    loadActivityLogs()
    if (hasSearchCriteria.value) await cerca()
    else await caricaAnniPagati()
  } catch (e) {
    console.error('Errore salvataggio pagamento:', e)
    toast.error('Pagamento non registrato: ' + e.message)
  }
}
</script>

<style scoped>
.dashboard {
  max-width: var(--page-width);
  margin: 0 auto;
  padding: var(--space-32);
}

.add-socio-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  min-height: 2.5rem;
  padding: var(--space-8) var(--space-16);
  background-color: var(--color-accent);
  color: var(--color-text-inverse);
  text-decoration: none;
  border-radius: var(--radius-control);
  font-weight: 600;
}

.add-socio-button:hover {
  background-color: var(--color-accent-hover);
}

/* Ricerca */
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: var(--space-12);
}

.search-bar__icona {
  position: absolute;
  left: var(--space-16);
  color: var(--color-text-secondary);
  pointer-events: none;
}

.search-bar input {
  width: 100%;
  min-height: 3rem;
  padding: var(--space-12) 5.5rem var(--space-12) 3rem;
  font-size: var(--font-size-section-heading);
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-strong);
  background: var(--color-surface);
  color: var(--color-text-primary);
}

.search-bar input:focus {
  border-color: var(--color-accent);
}

/* La x del browser ha un colore suo; per svuotare c'e' "Azzera" (o Esc) */
.search-bar input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}

.search-bar__tasto {
  position: absolute;
  right: var(--space-12);
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: var(--font-size-caption);
  pointer-events: none;
}

/* Filtri a etichette */
.filtri {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-8);
  margin-bottom: var(--space-24);
}

.filtro {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  min-height: 2.25rem;
  padding: 0 var(--space-12);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
  font-weight: 400;
  box-shadow: none;
  cursor: pointer;
}

.filtro:hover {
  background-color: var(--color-surface-hover);
}

.filtro:focus-within {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.filtro__nome::after {
  content: ':';
}

button.filtro .filtro__nome::after {
  content: '';
}

.filtro select {
  width: auto;
  min-height: 0;
  padding: 0 var(--space-4);
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: inherit;
  font-weight: 600;
  cursor: pointer;
}

.filtro select:focus-visible {
  outline: none; /* il fuoco si vede sull'etichetta intera */
}

.filtro strong {
  color: var(--color-text-primary);
}

.filtro--attivo {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.filtro--attivo select,
.filtro--attivo strong {
  color: var(--color-accent);
}

.filtri__totale {
  margin-left: auto;
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
}

.link-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  min-height: 2rem;
  padding: var(--space-4) var(--space-8);
  border: none;
  border-radius: var(--radius-control);
  background: none;
  box-shadow: none;
  color: var(--color-accent);
  font-size: var(--font-size-label);
  font-weight: 600;
}

.link-btn:hover {
  background: var(--color-surface-hover);
}

/* Risultati */
.risultati,
.recenti,
.activity-sidebar {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-surface);
  padding: var(--space-16) var(--space-24);
}

.risultati__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
  margin-bottom: var(--space-12);
}

.risultati h2,
.recenti h2,
.activity-sidebar h2 {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin: 0;
  font-size: var(--font-size-section-heading);
  color: var(--color-text-primary);
}

.recenti h2,
.activity-sidebar h2 {
  margin-bottom: var(--space-12);
}

.vuoto {
  margin: 0;
  padding: var(--space-16) 0;
  color: var(--color-text-secondary);
}

/* A ricerca vuota */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--space-24);
  align-items: start;
}

.dashboard-grid > * {
  min-width: 0;
}

.colonna {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.activity-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.activity-item {
  display: flex;
  gap: var(--space-12);
  padding: var(--space-8) 0;
  border-bottom: 1px solid var(--color-border);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  flex: none;
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
  border-radius: var(--radius-control);
  background: var(--color-background);
  color: var(--color-text-secondary);
}

.activity-icon--create {
  color: var(--color-success);
}
.activity-icon--update {
  color: var(--color-info);
}
.activity-icon--delete {
  color: var(--color-danger);
}

.activity-content {
  display: flex;
  flex-direction: column;
}

.activity-desc {
  font-size: var(--font-size-label);
  color: var(--color-text-primary);
}

.activity-time {
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .dashboard {
    padding: var(--space-16);
  }

  .search-bar__tasto {
    display: none;
  }

  .search-bar input {
    padding-right: var(--space-12);
  }

  .filtri__totale {
    margin-left: 0;
    width: 100%;
  }

  .risultati,
  .recenti,
  .activity-sidebar {
    padding: var(--space-12);
  }
}
</style>
