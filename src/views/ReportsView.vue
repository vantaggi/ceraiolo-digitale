<template>
  <div class="reports-view">
    <div class="container">
      <h1>📊 Centro Stampe e Report</h1>
      <p>Genera documenti per la giornata dei rinnovi annuali</p>

      <!-- Campo Anno Rinnovo -->
      <div class="year-selector">
        <label for="renewalYear">Anno del Rinnovo:</label>
        <input
          id="renewalYear"
          v-model.number="renewalYear"
          type="number"
          :min="currentYear"
          :max="currentYear + 5"
          placeholder="2026"
        />
      </div>

      <!-- Sezione Lista Rinnovi -->
      <section class="report-section">
        <h2>📋 Lista Rinnovi Annuali</h2>
        <p>Genera una tabella PDF con tutti i soci e i loro arretrati</p>

        <button
          @click="generateRenewalList"
          :disabled="!renewalYear || loading"
          class="primary-button"
        >
          {{ loading ? '⏳ Generazione...' : '📄 Genera PDF Lista Rinnovi' }}
        </button>
      </section>

      <!-- Sezione Preview Tessera -->
      <section class="report-section">
        <h2>👁️ Preview Tessera</h2>
        <p>Visualizza come apparirà la tessera prima di generare il PDF</p>

        <div class="preview-container">
          <TesseraTemplate
            :nome-cognome="previewData.nomeCognome"
            :data-nascita="previewData.dataNascita"
            :anno="renewalYear || currentYear + 1"
          />
        </div>

        <div class="preview-controls">
          <div class="control-group">
            <label>Nome e Cognome:</label>
            <input v-model="previewData.nomeCognome" type="text" placeholder="Mario Rossi" />
          </div>

          <div class="control-group">
            <label>Data di nascita:</label>
            <input v-model="previewData.dataNascita" type="date" placeholder="1980-05-15" />
          </div>
        </div>
      </section>

      <!-- Sezione Tessere -->
      <section class="report-section">
        <h2>🎫 Tessere Annuali</h2>
        <p>Genera tessere pre-stampate per tutti i soci</p>

        <div v-if="cardProgress > 0" class="progress-bar">
          <div class="progress-fill" :style="{ width: cardProgress + '%' }"></div>
          <span class="progress-text">{{ Math.round(cardProgress) }}% completato</span>
        </div>

        <button @click="generateCards" :disabled="!renewalYear || loading" class="primary-button">
          {{ loading ? '⏳ Generazione...' : '🎫 Genera PDF Tessere' }}
        </button>
      </section>

      <!-- Sezione Nuovi Soci -->
      <section class="report-section">
        <h2>🆕 Lista Nuovi Soci</h2>
        <p>Genera lista dei soci iscritti per la prima volta in un anno specifico</p>

        <div class="filters-grid">
          <div class="filter-group">
            <label for="newMembersYear">Anno:</label>
            <input
              id="newMembersYear"
              v-model.number="newMembersFilters.year"
              type="number"
              :min="currentYear - 10"
              :max="currentYear"
              class="form-input"
            />
          </div>

          <AgeCategoryFilter id="newMembersAge" v-model="newMembersFilters.ageCategory" />
        </div>

        <button
          @click="generateNewMembersList"
          :disabled="!newMembersFilters.year || loading"
          class="primary-button"
        >
          {{ loading ? '⏳ Generazione...' : '📄 Genera PDF Nuovi Soci' }}
        </button>
      </section>

      <!-- Sezione Lista Completa Pagamenti -->
      <section class="report-section">
        <h2>💰 Lista Completa Pagamenti</h2>
        <p>Genera lista di tutti i pagamenti registrati con dettagli completi</p>

        <div class="filters-grid">
          <AgeCategoryFilter id="paymentsAge" v-model="paymentsFilters.ageCategory" />
        </div>

        <button @click="generateCompletePaymentsList" :disabled="loading" class="primary-button">
          {{ loading ? '⏳ Generazione...' : '📄 Genera PDF Lista Pagamenti' }}
        </button>
      </section>

      <!-- Sezione Soci per Gruppo -->
      <section class="report-section">
        <h2>👥 Soci per Gruppo</h2>
        <p>Genera lista dei soci raggruppati per appartenenza con filtri avanzati</p>

        <div class="filters-grid">
          <div class="filter-group">
            <label for="groupFilter">Gruppo:</label>
            <select id="groupFilter" v-model="groupFilters.gruppo" class="form-input">
              <option value="">Tutti i gruppi</option>
              <option v-for="group in availableGroups" :key="group" :value="group">
                {{ group }}
              </option>
            </select>
          </div>

          <AgeCategoryFilter id="groupAge" v-model="groupFilters.ageCategory" />

          <div class="filter-group">
            <label for="paymentStatus">Stato Pagamento:</label>
            <select id="paymentStatus" v-model="groupFilters.paymentStatus" class="form-input">
              <option value="tutti">Tutti</option>
              <option value="in_regola">In Regola</option>
              <option value="non_in_regola">Non in Regola</option>
            </select>
          </div>
        </div>

        <button @click="generateMembersByGroup" :disabled="loading" class="primary-button">
          {{ loading ? '⏳ Generazione...' : '📄 Genera PDF Soci per Gruppo' }}
        </button>
      </section>

      <!-- Sezione Esportazione Multipla -->
      <section class="report-section">
        <h2>📦 Esportazione Multipla</h2>
        <p>Genera tutti i report in un'unica operazione</p>

        <div class="batch-export-options">
          <div class="export-option">
            <h3>🎯 Report Selezionati</h3>
            <p>Genera tutti i PDF configurati sopra in un'unica cartella</p>
            <button @click="generateAllReports" :disabled="loading" class="primary-button">
              {{ loading ? '⏳ Generazione...' : '📦 Genera Tutti i Report' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Stato Caricamento -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import {
  generateRenewalListPDF,
  generateAllCardsPDF,
  generateNewMembersPDF,
  generateCompletePaymentListPDF,
  generateMembersByGroupPDF,
} from '@/services/export'
import {
  getAllSociWithTesseramenti,
  getNewMembersByYear,
  getCompletePaymentList,
  getMembersByGroup,
  getUniqueGroups,
} from '@/services/db'
import TesseraTemplate from '@/components/TesseraTemplate.vue'
import AgeCategoryFilter from '@/components/AgeCategoryFilter.vue'

// Stato del componente
const renewalYear = ref(new Date().getFullYear() + 1)
const loading = ref(false)
const loadingMessage = ref('')
const cardProgress = ref(0)

// Toast notifications
const toast = useToast()

// Dati per la preview della tessera
const previewData = ref({
  nomeCognome: 'Mario Rossi',
  dataNascita: '1980-05-15',
})

const currentYear = new Date().getFullYear()

// Filters for new members
const newMembersFilters = reactive({
  year: currentYear,
  ageCategory: 'tutti',
})

// Filters for complete payments list
const paymentsFilters = reactive({
  ageCategory: 'tutti',
})

// Filters for members by group
const groupFilters = reactive({
  gruppo: '',
  ageCategory: 'tutti',
  paymentStatus: 'tutti',
})

onMounted(async () => {
  try {
    availableGroups.value = await getUniqueGroups()
  } catch (error) {
    console.error('Errore caricamento gruppi:', error)
    toast.error('Errore nel caricamento dei gruppi')
  }
})

/**
 * Genera la lista nuovi soci
 */
const generateNewMembersList = async () => {
  if (!newMembersFilters.year) return

  try {
    loading.value = true
    loadingMessage.value = 'Caricamento dati nuovi soci...'
    toast.info('Caricamento dati nuovi soci...')

    const newMembers = await getNewMembersByYear(
      newMembersFilters.year,
      newMembersFilters.ageCategory,
    )

    loadingMessage.value = 'Generazione PDF...'
    toast.info('Generazione PDF nuovi soci...')

    const result = await generateNewMembersPDF(
      newMembers,
      newMembersFilters.year,
      newMembersFilters.ageCategory,
    )

    if (result.success) {
      toast.success(`PDF Nuovi Soci generato con successo! (${result.totalMembers} soci)`)
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Errore generazione lista nuovi soci:', error)
    toast.error('Errore nella generazione del PDF: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

/**
 * Genera la lista completa pagamenti
 */
const generateCompletePaymentsList = async () => {
  try {
    loading.value = true
    loadingMessage.value = 'Caricamento dati pagamenti...'
    toast.info('Caricamento dati pagamenti...')

    const payments = await getCompletePaymentList(paymentsFilters.ageCategory)

    loadingMessage.value = 'Generazione PDF...'
    toast.info('Generazione PDF lista pagamenti...')

    const result = await generateCompletePaymentListPDF(payments, paymentsFilters.ageCategory)

    if (result.success) {
      toast.success(
        `PDF Lista Pagamenti generato con successo! (${result.totalPayments} pagamenti)`,
      )
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Errore generazione lista completa pagamenti:', error)
    toast.error('Errore nella generazione del PDF: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

/**
 * Genera la lista soci per gruppo
 */
const generateMembersByGroup = async () => {
  try {
    loading.value = true
    loadingMessage.value = 'Caricamento dati soci per gruppo...'
    toast.info('Caricamento dati soci per gruppo...')

    const members = await getMembersByGroup(
      groupFilters.gruppo || null,
      groupFilters.ageCategory,
      groupFilters.paymentStatus,
    )

    console.log('Members found for PDF generation:', members.length, members)

    loadingMessage.value = 'Generazione PDF...'
    toast.info('Generazione PDF soci per gruppo...')

    const result = await generateMembersByGroupPDF(
      members,
      groupFilters.gruppo,
      groupFilters.ageCategory,
      groupFilters.paymentStatus,
    )

    if (result.success) {
      toast.success(`PDF Soci per Gruppo generato con successo! (${result.totalMembers} soci)`)
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Errore generazione soci per gruppo:', error)
    toast.error('Errore nella generazione del PDF: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

/**
 * Genera tutti i report in un'unica operazione
 */
const generateAllReports = async () => {
  try {
    loading.value = true
    loadingMessage.value = 'Generazione report multipli...'
    toast.info('Inizio generazione report multipli...')

    // Genera tutti i report in sequenza
    const reports = []

    // 1. Lista Rinnovi (se anno configurato)
    if (renewalYear.value) {
      loadingMessage.value = 'Generazione lista rinnovi...'
      const soci = await getAllSociWithTesseramenti()
      await generateRenewalListPDF(soci, renewalYear.value)
      reports.push('Lista Rinnovi')
    }

    // 2. Nuovi Soci
    loadingMessage.value = 'Generazione nuovi soci...'
    const newMembers = await getNewMembersByYear(
      newMembersFilters.year,
      newMembersFilters.ageCategory,
    )
    const newMembersResult = await generateNewMembersPDF(
      newMembers,
      newMembersFilters.year,
      newMembersFilters.ageCategory,
    )
    if (newMembersResult.success) reports.push('Nuovi Soci')

    // 3. Lista Completa Pagamenti
    loadingMessage.value = 'Generazione lista pagamenti...'
    const payments = await getCompletePaymentList(paymentsFilters.ageCategory)
    const paymentsResult = await generateCompletePaymentListPDF(
      payments,
      paymentsFilters.ageCategory,
    )
    if (paymentsResult.success) reports.push('Lista Pagamenti')

    // 4. Soci per Gruppo
    loadingMessage.value = 'Generazione soci per gruppo...'
    const members = await getMembersByGroup(
      groupFilters.gruppo || null,
      groupFilters.ageCategory,
      groupFilters.paymentStatus,
    )
    const membersResult = await generateMembersByGroupPDF(
      members,
      groupFilters.gruppo,
      groupFilters.ageCategory,
      groupFilters.paymentStatus,
    )
    if (membersResult.success) reports.push('Soci per Gruppo')

    toast.success(`Generati ${reports.length} report: ${reports.join(', ')}`)
  } catch (error) {
    console.error('Errore generazione report multipli:', error)
    toast.error('Errore nella generazione del PDF: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

// Gruppi disponibili
const availableGroups = ref([])

/**
 * Genera la lista rinnovi in formato PDF
 */
const generateRenewalList = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    loadingMessage.value = 'Caricamento dati soci...'
    toast.info('Caricamento dati soci...')

    const soci = await getAllSociWithTesseramenti()

    loadingMessage.value = 'Generazione PDF...'
    toast.info('Generazione PDF in corso...')
    await generateRenewalListPDF(soci, renewalYear.value)

    toast.success('PDF Lista Rinnovi generato con successo!')
  } catch (error) {
    console.error('Errore generazione lista rinnovi:', error)
    toast.error('Errore nella generazione del PDF: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

/**
 * Genera le tessere in formato PDF
 */
const generateCards = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    cardProgress.value = 0
    loadingMessage.value = 'Caricamento dati soci...'
    toast.info('Caricamento dati soci...')

    const soci = await getAllSociWithTesseramenti()

    loadingMessage.value = 'Generazione tessere...'
    toast.info('Generazione tessere in corso...')
    await generateAllCardsPDF(soci, renewalYear.value, (progress) => {
      cardProgress.value = progress
    })

    toast.success('PDF Tessere generato con successo!')
  } catch (error) {
    console.error('Errore generazione tessere:', error)
    toast.error('Errore nella generazione del PDF: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
    cardProgress.value = 0
  }
}
</script>

<style scoped>
.reports-view {
  min-height: 100vh;
  background-color: var(--color-background);
  padding: 2rem 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
}

h1 {
  color: var(--color-primary);
  text-align: center;
  margin-bottom: 0.5rem;
}

.container > p {
  text-align: center;
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
}

.year-selector {
  background-color: var(--color-surface);
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-md);
  text-align: center;
}

.year-selector label {
  display: block;
  margin-bottom: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.year-selector input {
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1.1rem;
  text-align: center;
  width: 120px;
}

.report-section {
  background-color: var(--color-surface);
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-md);
}

.report-section h2 {
  color: var(--color-primary);
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.report-section p {
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

.primary-button {
  background-color: var(--color-accent);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: block;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}

.primary-button:hover:not(:disabled) {
  background-color: #c62828;
  transform: translateY(-1px);
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.progress-bar {
  width: 100%;
  height: 40px;
  background-color: var(--color-border);
  border-radius: 20px;
  margin-bottom: 1rem;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-accent);
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-overlay p {
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
}

/* Preview Tessera */
.preview-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background-color: #f8f8f8;
  border-radius: 8px;
  border: 2px dashed var(--color-border);
}

.preview-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.control-group input {
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.control-group input:focus {
  outline: none;
  border-color: var(--color-accent);
}

/* Filters */
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.form-input {
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  font-family: var(--font-family-body);
  transition: border-color 0.2s;
  background-color: var(--color-background);
  color: var(--color-text-primary);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Batch Export */
.batch-export-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.export-option {
  background: var(--color-background);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.export-option h3 {
  margin: 0 0 0.5rem 0;
  color: var(--color-primary);
  font-size: 1.1rem;
}

.export-option p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>
