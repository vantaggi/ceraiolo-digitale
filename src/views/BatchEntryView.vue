<template>
  <div class="batch-entry">
    <div class="batch-header">
      <router-link to="/" class="back-link">← Torna alla ricerca</router-link>
      <h1>🔄 Registrazione Seriale Pagamenti</h1>
      <p class="batch-subtitle">Flusso ottimizzato per blocchetti cartacei</p>
    </div>

    <!-- Area 1: Dati di Sessione (Fissi) -->
    <div class="session-data">
      <h2>📋 Dati di Sessione</h2>
      <div class="session-grid">
        <div class="form-group">
          <label for="anno-riferimento">
            <span class="field-icon">📅</span>
            Anno di Riferimento *
          </label>
          <input
            id="anno-riferimento"
            v-model.number="sessionData.annoRiferimento"
            type="number"
            class="form-input"
            :class="{ error: sessionErrors.annoRiferimento }"
            :min="currentYear"
            :max="currentYear + 5"
          />
          <span v-if="sessionErrors.annoRiferimento" class="error-message">{{
            sessionErrors.annoRiferimento
          }}</span>
        </div>

        <div class="form-group">
          <label for="numero-blocchetto">
            <span class="field-icon">📄</span>
            Numero Blocchetto *
          </label>
          <input
            id="numero-blocchetto"
            v-model.number="sessionData.numeroBlocchetto"
            type="number"
            class="form-input"
            :class="{ error: sessionErrors.numeroBlocchetto }"
            min="1"
          />
          <span v-if="sessionErrors.numeroBlocchetto" class="error-message">{{
            sessionErrors.numeroBlocchetto
          }}</span>
        </div>

        <div class="form-group">
          <label for="data-pagamento">
            <span class="field-icon">🗓️</span>
            Data Pagamento *
          </label>
          <input
            id="data-pagamento"
            v-model="sessionData.dataPagamento"
            type="date"
            class="form-input"
            :class="{ error: sessionErrors.dataPagamento }"
            :max="today"
          />
          <span v-if="sessionErrors.dataPagamento" class="error-message">{{
            sessionErrors.dataPagamento
          }}</span>
        </div>
      </div>
    </div>

    <!-- Area 2: Contesto Ricevuta Attuale -->
    <div class="receipt-context">
      <div class="receipt-header">
        <h2>🧾 Ricevuta Attuale</h2>
        <div class="receipt-controls">
          <label for="numero-ricevuta">
            <span class="field-icon">📊</span>
            Numero Ricevuta:
          </label>
          <div class="receipt-number-controls">
            <button @click="decrementReceipt" class="receipt-btn" :disabled="isProcessing">
              ⬅️
            </button>
            <input
              id="numero-ricevuta"
              v-model.number="currentReceipt.numero"
              type="number"
              class="receipt-number-input"
              min="1"
              readonly
              :disabled="isProcessing"
            />
            <button @click="incrementReceipt" class="receipt-btn" :disabled="isProcessing">
              ➡️
            </button>
          </div>
        </div>
      </div>

      <!-- Riepilogo Soci sulla Ricevuta -->
      <div class="receipt-summary">
        <h3>👥 Soci su questa ricevuta ({{ currentReceipt.soci.length }})</h3>
        <div v-if="currentReceipt.soci.length === 0" class="empty-receipt">
          <p>🎯 Nessun socio aggiunto ancora</p>
          <small>Inizia cercando un socio esistente o registrane uno nuovo</small>
        </div>
        <div v-else class="receipt-soci-list">
          <div v-for="socio in currentReceipt.soci" :key="socio.id" class="receipt-socio-item">
            <span class="socio-name">{{ socio.cognome }} {{ socio.nome }}</span>
            <span class="socio-payment">{{ socio.anniPagati.join(', ') }}</span>
            <button @click="removeFromReceipt(socio)" class="remove-btn" :disabled="isProcessing">
              ❌
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Area 3: L'Area di Lavoro -->
    <div class="work-area">
      <h2>🔍 Area di Lavoro</h2>

      <!-- Barra di Ricerca -->
      <div class="search-section">
        <div class="search-input-group">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Cerca socio per cognome o nome..."
            @input="debouncedSearch"
            :disabled="isProcessing"
            ref="searchInput"
          />
          <button @click="clearSearch" class="clear-search-btn" v-if="searchQuery">✕</button>
        </div>
      </div>

      <!-- Risultati Ricerca -->
      <div v-if="searchResults.length > 0" class="search-results">
        <h3>🔎 Risultati ({{ searchResults.length }})</h3>
        <div class="results-list">
          <div
            v-for="socio in searchResults"
            :key="socio.id"
            class="result-item"
            @click="selectSocio(socio)"
          >
            <div class="socio-info">
              <strong>{{ socio.cognome }} {{ socio.nome }}</strong>
              <small>Nato il {{ formatDate(socio.data_nascita) }}</small>
              <small>Gruppo: {{ socio.gruppo_appartenenza }}</small>
            </div>
            <div class="socio-status">
              <div v-if="socio.arretrati.length > 0" class="arretrati-badge">
                ⚠️ Arretrati: {{ socio.arretrati.join(', ') }}
              </div>
              <button class="pay-btn" :disabled="isProcessing">💰 Paga</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Nessun Risultato - Nuovo Socio -->
      <div v-else-if="searchQuery && searchResults.length === 0 && !isSearching" class="no-results">
        <div class="no-results-content">
          <h3>👤 Socio non trovato</h3>
          <p>
            "<strong>{{ searchQuery }}</strong
            >" non corrisponde a nessun socio esistente.
          </p>
          <button @click="showNewSocioForm = true" class="new-socio-btn" :disabled="isProcessing">
            ➕ Registra Nuovo Socio
          </button>
        </div>
      </div>

      <!-- Form Nuovo Socio -->
      <div v-if="showNewSocioForm" class="new-socio-form">
        <h3>📝 Registra Nuovo Socio</h3>
        <div class="mini-form-grid">
          <div class="form-group">
            <label for="new-cognome">Cognome *</label>
            <input
              id="new-cognome"
              v-model="newSocioData.cognome"
              type="text"
              class="form-input"
              :class="{ error: newSocioErrors.cognome }"
              :disabled="isProcessing"
            />
            <span v-if="newSocioErrors.cognome" class="error-message">{{
              newSocioErrors.cognome
            }}</span>
          </div>

          <div class="form-group">
            <label for="new-nome">Nome *</label>
            <input
              id="new-nome"
              v-model="newSocioData.nome"
              type="text"
              class="form-input"
              :class="{ error: newSocioErrors.nome }"
              :disabled="isProcessing"
            />
            <span v-if="newSocioErrors.nome" class="error-message">{{ newSocioErrors.nome }}</span>
          </div>

          <div class="form-group">
            <label for="new-data-nascita">Data di Nascita *</label>
            <input
              id="new-data-nascita"
              v-model="newSocioData.data_nascita"
              type="date"
              class="form-input"
              :class="{ error: newSocioErrors.data_nascita }"
              :max="today"
              :disabled="isProcessing"
            />
            <span v-if="newSocioErrors.data_nascita" class="error-message">{{
              newSocioErrors.data_nascita
            }}</span>
          </div>

          <div class="form-group">
            <label for="new-luogo-nascita">Luogo di Nascita</label>
            <input
              id="new-luogo-nascita"
              v-model="newSocioData.luogo_nascita"
              type="text"
              class="form-input"
              placeholder="Gubbio"
              :disabled="isProcessing"
            />
          </div>

          <div class="form-group">
            <label for="new-gruppo">Gruppo</label>
            <select
              id="new-gruppo"
              v-model="newSocioData.gruppo_appartenenza"
              class="form-input"
              :disabled="isProcessing"
            >
              <option value="">Seleziona gruppo</option>
              <option v-for="group in availableGroups" :key="group" :value="group">
                {{ group }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="new-note">Note</label>
            <textarea
              id="new-note"
              v-model="newSocioData.note"
              class="form-input"
              rows="2"
              placeholder="Eventuali note aggiuntive..."
              :disabled="isProcessing"
            ></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button @click="cancelNewSocio" class="cancel-btn" :disabled="isProcessing">
            Annulla
          </button>
          <button
            @click="saveNewSocio"
            class="save-btn"
            :disabled="isProcessing || !canSaveNewSocio"
          >
            💾 Salva e Registra Pagamento {{ sessionData.annoRiferimento }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Errore -->
    <ErrorModal v-if="errorMessage" :message="errorMessage" @close="errorMessage = ''" />

    <!-- Modal Pagamento -->
    <AddPaymentModal
      :show="showPaymentModal"
      :socio-id="selectedSocio?.id?.toString() || ''"
      :years-to-pay="paymentData.selectedYears"
      :numero-blocchetto="sessionData.numeroBlocchetto"
      :numero-ricevuta="currentReceipt.numero"
      :anno-riferimento="sessionData.annoRiferimento"
      @close="closePaymentModal"
      @payments-saved="handleSavePayments"
    />

    <!-- Vecchio Modal Pagamento (rimosso - ora usa AddPaymentModal) -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useToast } from 'vue-toastification'
import {
  searchSoci,
  addSocio,
  addTesseramento,
  getUniqueGroups,
  getArretrati,
  findExistingPaymentYear,
  getSetting,
  db,
} from '@/services/db'
import ErrorModal from '@/components/ErrorModal.vue'
import AddPaymentModal from '@/components/AddPaymentModal.vue'

const toast = useToast()
const searchInput = ref(null)

// Dati di sessione
const sessionData = reactive({
  annoRiferimento: new Date().getFullYear() + 1,
  numeroBlocchetto: 1,
  dataPagamento: new Date().toISOString().split('T')[0],
})

const sessionErrors = reactive({
  annoRiferimento: '',
  numeroBlocchetto: '',
  dataPagamento: '',
})

// Contesto ricevuta attuale
const currentReceipt = reactive({
  numero: 1,
  soci: [],
})

// Cache delle ricevute per mantenere i dati quando si naviga
const receiptsCache = new Map()

// Area di lavoro
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const showNewSocioForm = ref(false)
const isProcessing = ref(false)

// Nuovo socio
const newSocioData = reactive({
  cognome: '',
  nome: '',
  data_nascita: '',
  luogo_nascita: 'Gubbio', // Default value
  gruppo_appartenenza: '',
  note: '',
})

const newSocioErrors = reactive({
  cognome: '',
  nome: '',
  data_nascita: '',
})

// Modal pagamento
const showPaymentModal = ref(false)
const selectedSocio = ref(null)
const paymentData = reactive({
  quota: 25.0,
  selectedYears: [],
})

// Error handling
const errorMessage = ref('')

// Configuration
const config = ref({
  receiptsPerBlock: 10,
  defaultQuota: 10.0,
  newMemberQuota: 25.0
})

// Utility
const today = new Date().toISOString().split('T')[0]
const currentYear = new Date().getFullYear()
const availableGroups = ref([])

// Computed
const canSaveNewSocio = computed(() => {
  return (
    newSocioData.cognome.trim() &&
    newSocioData.nome.trim() &&
    newSocioData.data_nascita &&
    !isProcessing.value
  )
})

// Methods
const validateSessionData = () => {
  sessionErrors.annoRiferimento = !sessionData.annoRiferimento ? 'Anno obbligatorio' : ''
  sessionErrors.numeroBlocchetto =
    !sessionData.numeroBlocchetto || sessionData.numeroBlocchetto < 1
      ? 'Numero blocchetto valido obbligatorio'
      : ''
  sessionErrors.dataPagamento = !sessionData.dataPagamento ? 'Data pagamento obbligatoria' : ''
}

const loadGroups = async () => {
  try {
    const groups = await getUniqueGroups()
    availableGroups.value = groups || []
  } catch (error) {
    console.error('Errore caricamento gruppi:', error)
    availableGroups.value = []
    // Non mostrare toast per evitare spam all'avvio
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // Assicurati che il database sia aperto
    await db.open()

    // Carica configurazioni
    config.value.receiptsPerBlock = await getSetting('receiptsPerBlock', 10)
    config.value.defaultQuota = await getSetting('defaultQuota', 10.0)
    config.value.newMemberQuota = await getSetting('newMemberQuota', 25.0)

    await loadGroups()
    validateSessionData()
  } catch (error) {
    console.error('Errore inizializzazione database:', error)
    toast.error("Errore nell'inizializzazione dell'applicazione")
  }
})

// Watchers
watch(() => sessionData.annoRiferimento, validateSessionData)
watch(() => sessionData.numeroBlocchetto, validateSessionData)
watch(
  () => sessionData.numeroBlocchetto,
  (newVal) => {
    if (newVal > 0) {
      const calculatedReceiptNumber = (newVal - 1) * config.value.receiptsPerBlock + 1
      currentReceipt.numero = calculatedReceiptNumber
    }
  },
)
watch(() => sessionData.dataPagamento, validateSessionData)

// Funzioni per gestire la cache delle ricevute
const saveCurrentReceiptToCache = () => {
  if (currentReceipt.soci.length > 0) {
    receiptsCache.set(currentReceipt.numero, [...currentReceipt.soci])
  }
}

const loadReceiptFromCache = (receiptNumber) => {
  const cachedData = receiptsCache.get(receiptNumber)
  if (cachedData) {
    currentReceipt.soci = [...cachedData]
  } else {
    currentReceipt.soci = []
  }
}

const incrementReceipt = () => {
  // Salva la ricevuta corrente prima di cambiarla
  saveCurrentReceiptToCache()

  currentReceipt.numero++
  loadReceiptFromCache(currentReceipt.numero)
  clearSearch()
  nextTick(() => searchInput.value?.focus())
}

const decrementReceipt = () => {
  if (currentReceipt.numero > 1) {
    // Salva la ricevuta corrente prima di cambiarla
    saveCurrentReceiptToCache()

    currentReceipt.numero--
    loadReceiptFromCache(currentReceipt.numero)
    clearSearch()
    nextTick(() => searchInput.value?.focus())
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  showNewSocioForm.value = false
  resetNewSocioForm()
}

const resetNewSocioForm = () => {
  newSocioData.cognome = ''
  newSocioData.nome = ''
  newSocioData.data_nascita = ''
  newSocioData.gruppo_appartenenza = ''
  Object.keys(newSocioErrors).forEach((key) => {
    newSocioErrors[key] = ''
  })
}

let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  if (searchQuery.value.trim().length < 2) {
    searchResults.value = []
    showNewSocioForm.value = false
    return
  }

  searchTimeout = setTimeout(async () => {
    await performSearch()
  }, 300)
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) return

  isSearching.value = true
  try {
    const results = await searchSoci(searchQuery.value.trim())
    // Aggiungi informazioni sugli arretrati per ogni socio (con gestione errori migliorata)
    const resultsWithArretrati = await Promise.all(
      results.map(async (socio) => {
        try {
          const arretrati = await getArretrati(socio.id)
          return { ...socio, arretrati: arretrati || [] }
        } catch (error) {
          console.error('Errore caricamento arretrati per socio:', socio.id, error)
          return { ...socio, arretrati: [] }
        }
      }),
    )
    searchResults.value = resultsWithArretrati
    showNewSocioForm.value = false
  } catch (error) {
    console.error('Errore ricerca:', error)
    toast.error('Errore durante la ricerca')
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

const selectSocio = (socio) => {
  selectedSocio.value = socio
  paymentData.selectedYears = [sessionData.annoRiferimento] // Default: anno di riferimento
  paymentData.quota = config.value.defaultQuota // Default quota da config
  showPaymentModal.value = true
}

const closePaymentModal = () => {
  if (!isProcessing.value) {
    showPaymentModal.value = false
    selectedSocio.value = null
    paymentData.selectedYears = []
  }
}

// This function is called by the payment component when user clicks "Save"
const handleSavePayments = async ({ details, years, socioId }) => {
  console.log('Saving payments:', { details, years, socioId })

  // --- Security Check ---
  const existingYear = await findExistingPaymentYear(socioId, years)
  if (existingYear) {
    errorMessage.value = `ERRORE: L'anno ${existingYear} risulta già pagato per questo socio. Operazione annullata.`
    return // Block the operation
  }

  // If check passes, save all payments
  try {
    console.log('Saving tesseramenti for years:', years)
    for (const year of years) {
      const tesseramentoData = {
        id_socio: socioId,
        anno: year,
        quota_pagata: details.quota_pagata,
        data_pagamento: details.data_pagamento,
        numero_ricevuta: currentReceipt.numero,
        numero_blocchetto: sessionData.numeroBlocchetto,
      }
      console.log('Saving tesseramento:', tesseramentoData)

      const result = await addTesseramento(tesseramentoData)
      console.log('Tesseramento saved with ID:', result)
    }

    // Aggiungi alla ricevuta corrente
    currentReceipt.soci.push({
      id: socioId,
      cognome: selectedSocio.value.cognome,
      nome: selectedSocio.value.nome,
      anniPagati: [...years],
    })

    // Aggiorna la cache globale del socio per riflettere i nuovi pagamenti
    // Questo assicura che quando si visita SocioDetailView, i dati siano aggiornati
    if (selectedSocio.value) {
      // Rimuovi il socio dalla cache per forzare un ricaricamento
      // Nota: Questo è un workaround, idealmente servirebbe un sistema di cache più sofisticato
      const socioKey = `socio_${selectedSocio.value.id}`
      if (localStorage.getItem(socioKey)) {
        localStorage.removeItem(socioKey)
      }
    }

    toast.success(
      `Pagamenti registrati per ${selectedSocio.value.cognome} ${selectedSocio.value.nome} (${years.join(', ')})`,
    )

    closePaymentModal()
    clearSearch()
    nextTick(() => searchInput.value?.focus())
  } catch (err) {
    console.error('Error saving payments:', err)
    errorMessage.value = `Si è verificato un errore durante il salvataggio: ${err.message}`
  }
}

const cancelNewSocio = () => {
  showNewSocioForm.value = false
  resetNewSocioForm()
}

const saveNewSocio = async () => {
  if (!canSaveNewSocio.value || isProcessing.value) return

  // Validazione
  newSocioErrors.cognome = !newSocioData.cognome.trim() ? 'Cognome obbligatorio' : ''
  newSocioErrors.nome = !newSocioData.nome.trim() ? 'Nome obbligatorio' : ''
  newSocioErrors.data_nascita = !newSocioData.data_nascita ? 'Data di nascita obbligatoria' : ''

  if (Object.values(newSocioErrors).some((error) => error)) return

  isProcessing.value = true
  try {
    // Crea il nuovo socio
    const socioData = {
      nome: newSocioData.nome.trim(),
      cognome: newSocioData.cognome.trim(),
      data_nascita: newSocioData.data_nascita,
      luogo_nascita: newSocioData.luogo_nascita || 'Gubbio',
      gruppo_appartenenza: newSocioData.gruppo_appartenenza || 'Non specificato',
      note: newSocioData.note || '',
    }

    const socioId = await addSocio(socioData)

    // Registra il pagamento per l'anno corrente
    await addTesseramento({
      id_socio: socioId,
      anno: sessionData.annoRiferimento,
      quota_pagata: config.value.newMemberQuota, // Quota maggiorata per nuovi soci
      data_pagamento: sessionData.dataPagamento,
      numero_ricevuta: currentReceipt.numero,
      numero_blocchetto: sessionData.numeroBlocchetto,
    })

    // Aggiungi alla ricevuta corrente
    currentReceipt.soci.push({
      id: socioId,
      cognome: newSocioData.cognome.trim(),
      nome: newSocioData.nome.trim(),
      anniPagati: [sessionData.annoRiferimento],
    })

    toast.success(
      `Nuovo socio ${newSocioData.cognome} ${newSocioData.nome} creato e pagamento ${sessionData.annoRiferimento} registrato`,
    )

    showNewSocioForm.value = false
    resetNewSocioForm()
    clearSearch()
    nextTick(() => searchInput.value?.focus())
  } catch (error) {
    console.error('Errore creazione socio:', error)
    toast.error('Errore durante la creazione del socio')
  } finally {
    isProcessing.value = false
  }
}

const removeFromReceipt = (socio) => {
  const index = currentReceipt.soci.findIndex((s) => s.id === socio.id)
  if (index > -1) {
    currentReceipt.soci.splice(index, 1)
    // Salva i dati aggiornati nella cache
    saveCurrentReceiptToCache()
    toast.info(`${socio.cognome} ${socio.nome} rimosso dalla ricevuta`)
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('it-IT')
}
</script>

<style scoped>
.batch-entry {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.batch-header {
  text-align: center;
  margin-bottom: 1rem;
}

.batch-header h1 {
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.batch-subtitle {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
  margin: 0;
}

.back-link {
  position: absolute;
  top: 2rem;
  left: 2rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.back-link:hover {
  background-color: var(--color-surface);
  color: var(--color-accent);
}

/* Session Data */
.session-data {
  background-color: var(--color-surface);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: var(--shadow-md);
}

.session-data h2 {
  margin-top: 0;
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-accent);
  padding-bottom: 0.5rem;
}

.session-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

/* Receipt Context */
.receipt-context {
  background-color: var(--color-surface);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: var(--shadow-md);
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.receipt-header h2 {
  margin: 0;
  color: var(--color-primary);
}

.receipt-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.receipt-number-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.receipt-number-input {
  width: 80px;
  text-align: center;
  padding: 0.5rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
}

.receipt-btn {
  padding: 0.5rem 1rem;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s;
}

.receipt-btn:hover:not(:disabled) {
  background-color: #a22a2a;
  transform: scale(1.05);
}

.receipt-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.receipt-summary h3 {
  margin-top: 0;
  color: var(--color-text-primary);
}

.empty-receipt {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
}

.empty-receipt p {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.receipt-soci-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.receipt-socio-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.socio-name {
  font-weight: 600;
  flex: 1;
}

.socio-payment {
  color: var(--color-accent);
  font-weight: 500;
  margin-right: 1rem;
}

.remove-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.remove-btn:hover {
  background-color: #dc3545;
  color: white;
}

/* Work Area */
.work-area {
  background-color: var(--color-surface);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: var(--shadow-md);
}

.work-area h2 {
  margin-top: 0;
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-accent);
  padding-bottom: 0.5rem;
}

/* Search */
.search-section {
  margin-bottom: 2rem;
}

.search-input-group {
  position: relative;
  max-width: 500px;
}

.search-input {
  width: 100%;
  padding: 1rem 3rem 1rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1.1rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(183, 28, 28, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
  border-radius: 50%;
  transition: all 0.2s;
}

.clear-search-btn:hover {
  background-color: var(--color-border);
  color: var(--color-text-primary);
}

/* Search Results */
.search-results h3 {
  margin-top: 0;
  color: var(--color-text-primary);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s;
}

.result-item:hover {
  border-color: var(--color-accent);
  box-shadow: 0 2px 8px rgba(183, 28, 28, 0.1);
}

.socio-info {
  flex: 1;
}

.socio-info strong {
  display: block;
  font-size: 1.1rem;
  color: var(--color-text-primary);
}

.socio-info small {
  display: block;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
}

.socio-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.arretrati-badge {
  background-color: #fff3cd;
  color: #856404;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
}

.pay-btn {
  padding: 0.5rem 1rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.pay-btn:hover:not(:disabled) {
  background-color: #218838;
  transform: scale(1.05);
}

.pay-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* No Results */
.no-results {
  text-align: center;
  padding: 3rem 2rem;
  background-color: var(--color-background);
  border-radius: 8px;
  border: 2px dashed var(--color-border);
}

.no-results-content h3 {
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.no-results-content p {
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
}

.new-socio-btn {
  padding: 1rem 2rem;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.new-socio-btn:hover:not(:disabled) {
  background-color: #a22a2a;
  transform: scale(1.05);
}

.new-socio-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* New Socio Form */
.new-socio-form {
  margin-top: 2rem;
  padding: 2rem;
  background-color: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.new-socio-form h3 {
  margin-top: 0;
  color: var(--color-primary);
}

.mini-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-text-secondary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background-color: #666;
  transform: scale(1.02);
}

.save-btn {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover:not(:disabled) {
  background-color: #a22a2a;
  transform: scale(1.02);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  color: var(--color-primary);
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0.25rem;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: var(--color-border);
  color: var(--color-text-primary);
}

.payment-socio-info {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-background);
}

.payment-socio-info h4 {
  margin: 0 0 0.5rem 0;
  color: var(--color-text-primary);
}

.payment-socio-info p {
  margin: 0;
  color: var(--color-text-secondary);
}

.payment-form {
  padding: 2rem;
}

.years-selection {
  margin: 1.5rem 0;
}

.years-selection h4 {
  margin-bottom: 1rem;
  color: var(--color-text-primary);
}

.year-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background-color: var(--color-background);
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.year-option input[type='checkbox'] {
  width: 18px;
  height: 18px;
}

.year-option label {
  cursor: pointer;
  font-weight: 500;
  color: var(--color-text-primary);
}

.arretrati-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.arretrati-section h5 {
  margin-bottom: 1rem;
  color: var(--color-text-secondary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.cancel-button {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-text-secondary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button:hover:not(:disabled) {
  background-color: #666;
  transform: scale(1.02);
}

.save-button {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.save-button:hover:not(:disabled) {
  background-color: #a22a2a;
  transform: scale(1.02);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Form Styles */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.field-icon {
  font-size: 1.2rem;
}

.form-input {
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  font-family: var(--font-family-body);
  transition: all 0.2s;
  background-color: var(--color-background);
  color: var(--color-text-primary);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(183, 28, 28, 0.1);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: -0.25rem;
}

.form-input.error {
  border-color: #dc3545;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .batch-entry {
    padding: 1rem;
  }

  .session-grid {
    grid-template-columns: 1fr;
  }

  .receipt-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .mini-form-grid {
    grid-template-columns: 1fr;
  }

  .result-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .socio-status {
    align-items: flex-start;
  }

  .receipt-socio-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .socio-payment {
    margin-right: 0;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-btn,
  .save-btn,
  .cancel-button,
  .save-button {
    width: 100%;
    text-align: center;
  }
}
</style>
