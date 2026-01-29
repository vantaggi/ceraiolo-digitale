<template>
  <div class="reports-view">
    <div class="container reports-layout">
      <!-- Sidebar -->
      <aside class="reports-sidebar">
        <h1 class="sidebar-title">📊 Report</h1>
        <nav class="reports-nav">
          <button
            @click="currentTab = 'rinnovi'"
            :class="{ active: currentTab === 'rinnovi' }"
            class="nav-item"
          >
            📅 Rinnovi & Tessere
          </button>
          <button
            @click="currentTab = 'liste'"
            :class="{ active: currentTab === 'liste' }"
            class="nav-item"
          >
            📋 Elenchi Dati
          </button>
          <button
            @click="currentTab = 'export'"
            :class="{ active: currentTab === 'export' }"
            class="nav-item"
          >
            📦 Export Batch
          </button>
          <button
            @click="currentTab = 'stats'"
            :class="{ active: currentTab === 'stats' }"
            class="nav-item"
          >
            📈 Statistiche
          </button>
        </nav>
      </aside>

      <!-- Content -->
      <main class="reports-content">
        <!-- GLOBAL HEADER & CONTROLS -->
        <section class="report-section header-section">
          <div class="header-row">
            <h2>📊 {{ getTabTitle(currentTab) }}</h2>
            <div class="year-selector-inline">
              <label for="renewalYear">Anno di Riferimento:</label>
              <input
                id="renewalYear"
                v-model.number="renewalYear"
                type="number"
                :min="2000"
                :max="currentYear + 5"
                class="year-input"
              />
            </div>
          </div>
        </section>

        <!-- TAB: RINNOVI & TESSERE -->
        <div v-if="currentTab === 'rinnovi'">
          <div class="reports-grid">
            <!-- Lista Rinnovi -->
            <section class="report-card">
              <h3>📋 Lista Rinnovi {{ renewalYear }}</h3>
              <p>Tabella PDF con soci e arretrati.</p>
              <button
                @click="generateRenewalList"
                :disabled="!renewalYear || loading"
                class="action-button"
              >
                {{ loading ? '⏳ ...' : '📄 Genera Lista' }}
              </button>
            </section>

            <!-- Recupero Crediti (Churn) -->
            <section class="report-card">
              <h3>📉 Recupero Crediti</h3>
              <p>Soci attivi nel {{ renewalYear - 1 }} ma NON nell'anno {{ renewalYear }}.</p>
              <button
                @click="generateChurnReport"
                :disabled="!renewalYear || loading"
                class="action-button"
              >
                📄 Genera Lista Recupero
              </button>
            </section>

            <!-- Tessere -->
            <section class="report-card">
              <h3>🎫 Tessere Annuali</h3>
              <p>Stampa tessere per tutti i soci.</p>

              <div class="filter-mini">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="excludeInactiveMembers" :disabled="loading" />
                  <span class="checkmark"></span>
                  Escludi inattivi (>5 anni)
                </label>
                <small
                  v-if="excludeInactiveMembers"
                  style="display: block; margin-top: 5px; color: var(--color-text-secondary)"
                >
                  Attivi: {{ sociStats.active }} / {{ sociStats.total }}
                </small>
              </div>

              <div v-if="cardProgress > 0" class="progress-bar-mini">
                <div class="fill" :style="{ width: cardProgress + '%' }"></div>
              </div>

              <button
                @click="generateCards"
                :disabled="!renewalYear || loading"
                class="action-button"
              >
                {{ loading ? '⏳ ...' : '🎫 Genera Tessere' }}
              </button>
            </section>
          </div>

          <!-- Preview -->
          <section class="report-section" style="margin-top: 2rem">
            <h3>👁️ Anteprima Tessera</h3>
            <div class="preview-wrapper">
              <div class="preview-container">
                <TesseraTemplate
                  :nome-cognome="previewData.nomeCognome"
                  :data-nascita="previewData.dataNascita"
                  :anno="renewalYear || currentYear + 1"
                  :background-image="cardBackground"
                />
              </div>
              <div class="preview-inputs">
                <label>Nome:</label>
                <input v-model="previewData.nomeCognome" class="small-input" />
                <label>Data:</label>
                <input v-model="previewData.dataNascita" type="date" class="small-input" />
              </div>
            </div>
          </section>
        </div>

        <!-- TAB: STATISTICHE -->
        <div v-if="currentTab === 'stats'">
          <!-- Demografia -->
          <section class="report-section">
            <h2>📈 Demografia Soci {{ renewalYear }}</h2>
            <div class="stats-summary" v-if="demographics">
              <div class="stat-card total">
                <h3>Totale Soci</h3>
                <div class="big-number">{{ demographics.total }}</div>
              </div>

              <div class="stat-card">
                <h3>Distribuzione Età</h3>
                <div class="chart-container">
                  <div
                    v-for="(count, label) in demographics.ageGroups"
                    :key="label"
                    class="chart-row"
                  >
                    <span class="chart-label">{{ label }}</span>
                    <div class="chart-bar-bg">
                      <div
                        class="chart-bar-fill"
                        :style="{ width: (count / demographics.total) * 100 + '%' }"
                      ></div>
                    </div>
                    <span class="chart-value">{{ count }}</span>
                  </div>
                </div>
              </div>

              <div class="stat-card">
                <h3>Luogo di Nascita (Top 10)</h3>
                <div class="chart-container">
                  <div v-for="(count, label) in demographics.places" :key="label" class="chart-row">
                    <span class="chart-label">{{ label }}</span>
                    <div class="chart-bar-bg">
                      <div
                        class="chart-bar-fill"
                        :style="{ width: (count / demographics.total) * 100 + '%' }"
                      ></div>
                    </div>
                    <span class="chart-value">{{ count }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="no-data">
              <p>Clicca "Analizza" per generare le statistiche.</p>
              <button @click="loadStats" class="action-button">
                📊 Analizza Dati {{ renewalYear }}
              </button>
            </div>
          </section>

          <!-- Andamento Economico -->
          <section class="report-section" v-if="economicStats">
            <h2>💰 Andamento Economico {{ renewalYear }}</h2>
            <div class="stats-summary">
              <div class="stat-card totalHighlight">
                <h3>Entrate Totali</h3>
                <div class="big-number">€ {{ economicStats.totalRevenue }}</div>
                <small>{{ economicStats.totalPayments }} pagamenti registrati</small>
              </div>

              <div class="stat-card">
                <h3>Quota Media</h3>
                <div class="big-number">€ {{ economicStats.averageQuota }}</div>
              </div>

              <div class="stat-card">
                <h3>Entrate per Gruppo</h3>
                <div class="chart-container">
                  <div
                    v-for="(revenue, group) in economicStats.groupBreakdown"
                    :key="group"
                    class="chart-row"
                  >
                    <span class="chart-label">{{ group }}</span>
                    <div class="chart-bar-bg">
                      <div
                        class="chart-bar-fill money"
                        :style="{
                          width: (revenue / economicStats.totalRevenue) * 100 + '%',
                        }"
                      ></div>
                    </div>
                    <span class="chart-value">€ {{ revenue }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- TAB: LISTE DATI -->
        <div v-if="currentTab === 'liste'">
          <h2>📋 Elenchi e Statistiche</h2>

          <!-- Nuovi Soci -->
          <section class="report-section">
            <h3>🆕 Nuovi Soci</h3>
            <div class="filters-inline">
              <label
                >Anno: <strong>{{ renewalYear }}</strong></label
              >
              <AgeCategoryFilter v-model="newMembersFilters.ageCategory" />
            </div>
            <button @click="generateNewMembersList" :disabled="loading" class="action-button wide">
              📄 Genera Report Nuovi Soci
            </button>
          </section>

          <!-- Soci per Gruppo -->
          <section class="report-section">
            <h3>👥 Soci per Gruppo</h3>
            <div class="filters-grid-compact">
              <div class="f-group">
                <label>Gruppo:</label>
                <select v-model="groupFilters.gruppo" class="small-input">
                  <option value="">Tutti</option>
                  <option v-for="group in availableGroups" :key="group" :value="group">
                    {{ group }}
                  </option>
                </select>
              </div>
              <div class="f-group">
                <label>Età:</label>
                <AgeCategoryFilter v-model="groupFilters.ageCategory" />
              </div>
              <div class="f-group">
                <label>Stato ({{ renewalYear }}):</label>
                <select v-model="groupFilters.paymentStatus" class="small-input">
                  <option value="tutti">Tutti</option>
                  <option value="in_regola">In Regola</option>
                  <option value="non_in_regola">Non in Regola</option>
                </select>
              </div>
            </div>
            <button @click="generateMembersByGroup" :disabled="loading" class="action-button wide">
              📄 Genera Report Gruppi
            </button>
          </section>

          <!-- Riepilogo Numerico Gruppi -->
          <section class="report-section">
            <h3>🔢 Riepilogo Numerico Gruppi</h3>
            <p>Genera un foglio unico con il conteggio degli iscritti per ogni gruppo.</p>
            <div class="filters-inline">
              <label
                >Anno Riferimento: <strong>{{ renewalYear }}</strong></label
              >
            </div>
            <button
              @click="generateGroupCountsReport"
              :disabled="loading"
              class="action-button wide"
            >
              📊 Genera Riepilogo Numerico
            </button>
          </section>

          <!-- Lista Recupero (Arretrati) -->
          <section class="report-section">
            <h3>📈 Lista Recupero (Churn)</h3>
            <p>
              Soci che hanno pagato l'anno scorso ({{ renewalYear - 1 }}) ma non ancora quest'anno
              ({{ renewalYear }}).
            </p>
            <button @click="generateChurnReport" :disabled="loading" class="action-button wide">
              📄 Genera Lista Recupero
            </button>
          </section>

          <!-- Lista Pagamenti -->
          <section class="report-section">
            <h3>💰 Cronologia Pagamenti</h3>
            <div class="filters-inline">
              <AgeCategoryFilter v-model="paymentsFilters.ageCategory" />
            </div>
            <button
              @click="generateCompletePaymentsList"
              :disabled="loading"
              class="action-button wide"
            >
              📄 Genera Report Completo Pagamenti
            </button>
          </section>

          <!-- Audit Dati -->
          <section class="report-section">
            <h3>�️ Audit Qualità Dati</h3>
            <p>Verifica la completezza e coerenza dei dati anagrafici.</p>

            <button @click="runDataAudit" class="action-button wide" :disabled="loading">
              🔍 Esegui Controllo
            </button>

            <div v-if="auditResults" class="audit-box">
              <div v-if="auditResults.summary.total_issues === 0" class="success-message">
                ✅ Nessuna anomalia rilevata! Il database è perfetto.
              </div>
              <div v-else>
                <div class="audit-stats">
                  <span v-if="auditResults.summary.missing_dob" class="stat-tag"
                    >⚠️ No Data Nascita: <b>{{ auditResults.summary.missing_dob }}</b></span
                  >
                  <span v-if="auditResults.summary.missing_pob" class="stat-tag"
                    >⚠️ No Luogo Nascita: <b>{{ auditResults.summary.missing_pob }}</b></span
                  >
                  <span v-if="auditResults.summary.missing_reg_date" class="stat-tag"
                    >⚠️ No Data Iscrizione: <b>{{ auditResults.summary.missing_reg_date }}</b></span
                  >
                  <span v-if="auditResults.summary.missing_group" class="stat-tag"
                    >⚠️ No Gruppo: <b>{{ auditResults.summary.missing_group }}</b></span
                  >
                  <span v-if="auditResults.summary.future_reg" class="stat-tag"
                    >⚠️ Date Future: <b>{{ auditResults.summary.future_reg }}</b></span
                  >
                </div>
                <p class="audit-info">
                  Trovate <b>{{ auditResults.summary.total_issues }}</b> anomalie totali.
                </p>

                <!-- Simple table preview -->
                <div class="audit-preview">
                  <table>
                    <thead>
                      <tr>
                        <th>Socio</th>
                        <th>Problemi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in auditResults.details.slice(0, 5)" :key="item.id">
                        <td>{{ item.cognome }} {{ item.nome }}</td>
                        <td>{{ item.issues.join(', ') }}</td>
                      </tr>
                      <tr v-if="auditResults.details.length > 5">
                        <td colspan="2">...e altri {{ auditResults.details.length - 5 }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <button
                  @click="generateAuditPDFReport"
                  class="action-button wide secondary"
                  style="margin-top: 1rem"
                >
                  📄 Scarica Report Anomalie PDF
                </button>
              </div>
            </div>
          </section>
        </div>

        <!-- TAB: EXPORT -->
        <div v-if="currentTab === 'export'">
          <section class="report-section">
            <h2>📦 Esportazione Complessiva</h2>
            <p>Genera e scarica tutti i report configurati in un'unica operazione.</p>

            <div class="batch-box">
              <ul>
                <li>Lista Rinnovi ({{ renewalYear }})</li>
                <li>Nuovi Soci ({{ renewalYear }})</li>
                <li>Lista Pagamenti</li>
                <li>Soci per Gruppo ({{ renewalYear }})</li>
                <li>Riepilogo Numerico Gruppi ({{ renewalYear }})</li>
              </ul>
              <button @click="generateAllReports" :disabled="loading" class="action-button wide">
                {{ loading ? '⏳ Generazione in corso...' : '📦 SCARICA TUTTI I REPORT' }}
              </button>
            </div>
          </section>
        </div>
      </main>

      <!-- Loading Overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import {
  generateRenewalListPDF,
  generateAllCardsPDF,
  generateNewMembersPDF,
  generateCompletePaymentListPDF,
  generateMembersByGroupPDF,
  generateGroupCountsPDF,
  generateChurnPDF,
  generateAuditPDF,
} from '@/services/export'
import {
  getAllSociWithTesseramenti,
  getNewMembersByYear,
  getCompletePaymentList,
  getMembersByGroup,
  getUniqueGroups,
  getGroupCountsForYear,
  getChurnList,
  getDemographicStats,
  getEconomicStats,
  getDataAuditStats,
  getSetting,
} from '@/services/db'
import TesseraTemplate from '@/components/TesseraTemplate.vue'
import AgeCategoryFilter from '@/components/AgeCategoryFilter.vue'

// Stato del componente
const currentTab = ref('rinnovi')
const renewalYear = ref(new Date().getFullYear())
const loading = ref(false)
const loadingMessage = ref('')
const cardProgress = ref(0)
const auditResults = ref(null)
const demographics = ref(null)
const economicStats = ref(null)
const cardBackground = ref(null)
const excludeInactiveMembers = ref(false)
const sociStats = reactive({
  total: 0,
  active: 0,
  inactive: 0,
})

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

// Year for group counts report
// REPLACED BY GLOBAL RENEWAL YEAR

onMounted(async () => {
  try {
    availableGroups.value = await getUniqueGroups()
    cardBackground.value = await getSetting('cardBackground')
    await updateSociStats()
  } catch (error) {
    console.error('Errore caricamento dati:', error)
    toast.error('Errore nel caricamento dei dati')
  }
})

/**
 * Determina se un socio è attivo (ha pagato negli ultimi 5 anni)
 * @param {Object} socio - Oggetto socio con tesseramenti
 * @returns {boolean} True se attivo, false se inattivo
 */
const isSocioActive = (socio) => {
  if (!socio.tesseramenti || socio.tesseramenti.length === 0) {
    return false // Nessun pagamento mai fatto
  }

  const currentYear = new Date().getFullYear()
  const fiveYearsAgo = currentYear - 5

  // Trova l'anno più recente di pagamento
  const latestPaymentYear = Math.max(...socio.tesseramenti.map((t) => t.anno))

  return latestPaymentYear >= fiveYearsAgo
}

/**
 * Aggiorna le statistiche dei soci (totale, attivi, inattivi)
 */
const updateSociStats = async () => {
  try {
    const allSoci = await getAllSociWithTesseramenti()
    sociStats.total = allSoci.length
    sociStats.active = allSoci.filter(isSocioActive).length
    sociStats.inactive = sociStats.total - sociStats.active
  } catch (error) {
    console.error('Errore calcolo statistiche soci:', error)
    sociStats.total = 0
    sociStats.active = 0
    sociStats.inactive = 0
  }
}

/**
 * Genera la lista nuovi soci
 */
const generateNewMembersList = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    loadingMessage.value = 'Caricamento dati nuovi soci...'
    toast.info('Caricamento dati nuovi soci...')

    const newMembers = await getNewMembersByYear(renewalYear.value, newMembersFilters.ageCategory)

    loadingMessage.value = 'Generazione PDF...'
    toast.info('Generazione PDF nuovi soci...')

    const result = await generateNewMembersPDF(
      newMembers,
      renewalYear.value,
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
 * Genera il report riepilogativo numerico per gruppi
 */
const generateGroupCountsReport = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    loadingMessage.value = 'Calcolo totali per gruppo...'
    toast.info('Calcolo dati in corso...')

    const counts = await getGroupCountsForYear(renewalYear.value)

    if (counts.length === 0) {
      toast.warning(`Nessun tesseramento trovato per l'anno ${renewalYear.value}`)
      return
    }

    loadingMessage.value = 'Generazione PDF...'
    const result = await generateGroupCountsPDF(counts, renewalYear.value)

    if (result.success) {
      toast.success(`Report generato con successo! (${result.totalGroups} gruppi censiti)`)
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Errore generazione riepilogo gruppi:', error)
    toast.error('Errore: ' + error.message)
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
    const newMembers = await getNewMembersByYear(renewalYear.value, newMembersFilters.ageCategory)
    const newMembersResult = await generateNewMembersPDF(
      newMembers,
      renewalYear.value,
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

    // 5. Riepilogo Gruppi
    loadingMessage.value = 'Generazione riepilogo gruppi...'
    const counts = await getGroupCountsForYear(renewalYear.value)
    if (counts.length > 0) {
      const countsResult = await generateGroupCountsPDF(counts, renewalYear.value)
      if (countsResult.success) reports.push('Riepilogo Gruppi')
    }

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
 * Genera il report Recupero Crediti (Churn)
 */
const generateChurnReport = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    loadingMessage.value = 'Analisi mancati rinnovi...'
    toast.info('Calcolo lista recupero...')

    const churnList = await getChurnList(renewalYear.value)

    if (churnList.length === 0) {
      toast.success(
        `Nessun socio da recuperare per il ${renewalYear.value}! (Tutti hanno pagato o sono nuovi)`,
      )
      return
    }

    loadingMessage.value = 'Generazione PDF...'
    const result = await generateChurnPDF(churnList, renewalYear.value)

    if (result.success) {
      toast.success(`Lista Recupero generata! (${result.count} soci da contattare)`)
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Errore generazione churn report:', error)
    toast.error('Errore: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

/**
 * Carica le statistiche demografiche ed economiche per l'anno selezionato
 */
const loadStats = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    loadingMessage.value = 'Analisi dati in corso...'

    // Esegui entrambi in parallelo
    const [demoData, econData] = await Promise.all([
      getDemographicStats(renewalYear.value),
      getEconomicStats(renewalYear.value),
    ])

    demographics.value = demoData
    economicStats.value = econData

    toast.success('Statistiche aggiornate!')
  } catch (error) {
    console.error('Errore caricamento statistiche:', error)
    toast.error('Errore nel calcolo delle statistiche')
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

// Watch per resettare stats se cambia anno
watch(renewalYear, () => {
  if (currentTab.value === 'stats') {
    demographics.value = null
    economicStats.value = null
  }
})

const runDataAudit = async () => {
  try {
    loading.value = true
    loadingMessage.value = 'Controllo qualità dati...'

    // Simulate delay
    await new Promise((r) => setTimeout(r, 500))

    const results = await getDataAuditStats()
    auditResults.value = results

    if (results.summary.total_issues === 0) {
      toast.success('Ottimo! Nessuna anomalia trovata.')
    } else {
      toast.warning(`Trovate ${results.summary.total_issues} anomalie nei dati.`)
    }
  } catch (error) {
    console.error(error)
    toast.error('Errore audit: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

const generateAuditPDFReport = async () => {
  if (!auditResults.value) return

  try {
    loading.value = true
    loadingMessage.value = 'Generazione PDF audit...'

    const result = await generateAuditPDF(auditResults.value)

    if (result.success) {
      // Download
      const url = URL.createObjectURL(result.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Report Audit scaricato!')
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Errore generazione audit PDF:', error)
    toast.error('Errore export audit: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

/**
 * Genera le tessere in formato PDF (divise per lettera alfabetica)
 */
const generateCards = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    cardProgress.value = 0
    loadingMessage.value = 'Caricamento dati soci...'
    toast.info('Caricamento dati soci...')

    let soci = await getAllSociWithTesseramenti()

    // Applica filtro soci inattivi se selezionato
    if (excludeInactiveMembers.value) {
      soci = soci.filter(isSocioActive)
      console.log(`Filtro applicato: ${soci.length} soci attivi su ${sociStats.total} totali`)
    }

    loadingMessage.value = 'Generazione tessere...'
    toast.info('Generazione tessere in corso...')

    const risultati = await generateAllCardsPDF(soci, renewalYear.value, (progress) => {
      cardProgress.value = progress
    })

    // Scarica tutti i PDF generati
    let totalCards = 0
    for (const risultato of risultati) {
      // Crea un link temporaneo per il download
      const url = URL.createObjectURL(risultato.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = risultato.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      totalCards += risultato.count
    }

    const filterText = excludeInactiveMembers.value ? ' attivi' : ''
    toast.success(`Generati ${risultati.length} PDF di tessere (${totalCards} soci${filterText})!`)
  } catch (error) {
    console.error('Errore generazione tessere:', error)
    toast.error('Errore nella generazione del PDF: ' + error.message)
  } finally {
    loading.value = false
    loadingMessage.value = ''
    cardProgress.value = 0
  }
}
const getTabTitle = (tab) => {
  switch (tab) {
    case 'rinnovi':
      return 'Gestione Rinnovi & Tessere'
    case 'liste':
      return 'Elenchi Dati & Statistiche'
    case 'export':
      return 'Export & Backup'
    default:
      return 'Report'
  }
}

// Watchers
watch(renewalYear, (newVal) => {
  // Update preview data when year changes
  previewData.value.anno = newVal
})
</script>

<style scoped>
.reports-view {
  min-height: 100vh;
  background-color: var(--color-background);
  padding: 2rem 0;
}

.reports-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  min-height: calc(100vh - 100px);
}

.reports-sidebar {
  padding-right: 1.5rem;
  border-right: 1px solid var(--color-border);
}

.reports-sidebar .sidebar-title {
  font-size: 1.1rem;
  color: var(--color-primary);
  margin-bottom: 2rem;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reports-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  text-align: left;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.nav-item:hover {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
}

.nav-item.active {
  background-color: var(--color-accent);
  color: white;
}

.reports-content {
  padding-bottom: 3rem;
}

/* Sections */
.report-section {
  background-color: var(--color-surface);
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-surface);
  padding: 1.5rem;
}

.header-section h2 {
  margin: 0;
  color: var(--color-primary);
}

/* Grid for Cards */
.reports-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.report-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.report-card h3 {
  margin-top: 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.report-card p {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  min-height: 40px;
}

/* Inputs & Buttons */
.year-selector-inline {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.year-input {
  padding: 0.5rem;
  width: 100px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-weight: bold;
}

.action-button {
  background-color: var(--color-accent);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
}

.action-button:hover:not(:disabled) {
  background-color: #a22a2a;
  transform: translateY(-1px);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-button.wide {
  width: auto;
  min-width: 200px;
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

.primary-button:hover {
  background-color: #a22a2a;
  transform: translateY(-1px);
}

.header-section {
  background: var(--color-surface);
  margin-bottom: 2rem;
  border-left: 5px solid var(--color-primary);
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-row h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-primary);
}

.year-selector-inline {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--color-background);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

/* Preview Area */
.preview-wrapper {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.preview-container {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  justify-content: center;
  border: 1px solid var(--color-border);
}

.preview-inputs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.small-input {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  width: 100%;
}

/* Filters */
.filters-inline {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filters-grid-compact {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.f-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.f-group label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 600;
}

/* Progress Bar Mini */
.progress-bar-mini {
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  margin: 1rem 0;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: var(--color-success);
  transition: width 0.3s;
}

/* Batch Box */
.batch-box {
  background: var(--color-background);
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
}

.batch-box ul {
  list-style: none;
  padding: 0;
  margin-bottom: 2rem;
}

.batch-box li {
  display: inline-block;
  background: var(--color-surface);
  padding: 0.3rem 0.8rem;
  margin: 0.3rem;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  font-size: 0.9rem;
}

.primary-button.large {
  font-size: 1.1rem;
  padding: 1rem 3rem;
}

/* Loading Overlay */
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
  color: white;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s infinite linear;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}
.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  background: var(--color-background);
  display: inline-block;
}
input:checked + .checkmark {
  background: var(--color-success);
  border-color: var(--color-success);
}

/* Responsive */
@media (max-width: 900px) {
  .reports-layout {
    grid-template-columns: 1fr;
  }

  .reports-sidebar {
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 1rem;
  }
  .reports-nav {
    flex-direction: row;
    overflow-x: auto;
  }
  .reports-grid,
  .filters-grid-compact {
    grid-template-columns: 1fr;
  }
  .preview-wrapper {
    flex-direction: column;
  }
  .preview-container {
    transform: scale(1);
    width: 100%;
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}
</style>
