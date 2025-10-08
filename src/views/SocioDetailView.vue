<template>
  <div class="socio-detail">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Caricamento dati socio...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <h2>❌ Errore</h2>
      <p>{{ error }}</p>
      <router-link to="/" class="back-button">← Torna alla ricerca</router-link>
    </div>

    <!-- Main Content -->
    <div v-else-if="socio" class="detail-content">
      <!-- Header con nome e azioni -->
      <div class="detail-header">
        <div>
          <router-link to="/" class="back-link">← Torna alla ricerca</router-link>
          <h1>{{ socio.cognome }} {{ socio.nome }}</h1>
        </div>
        <button @click="exportSocio" class="export-button">📥 Export Socio</button>
        <button @click="toggleEditMode" :disabled="isSaving" class="edit-button">
          {{ isSaving ? '💾 Salvando...' : (editMode ? '✓ Salva' : '✏️ Modifica') }}
        </button>
      </div>

      <!-- Sezione Dati Anagrafici -->
      <section class="info-section">
        <h2>📋 Dati Anagrafici</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Cognome</span>
            <input v-if="editMode" v-model="socio.cognome" type="text" class="edit-input" />
            <span v-else class="value">{{ socio.cognome }}</span>
          </div>

          <div class="info-item">
            <span class="label">Nome</span>
            <input v-if="editMode" v-model="socio.nome" type="text" class="edit-input" />
            <span v-else class="value">{{ socio.nome }}</span>
          </div>

          <div class="info-item">
            <span class="label">Data di Nascita</span>
            <input v-if="editMode" v-model="socio.data_nascita" type="date" class="edit-input" />
            <span v-else class="value">
              {{ formatDate(socio.data_nascita) }}
              <span class="age-badge" :class="{ minor: isMinor }"> {{ calculateAge }} anni </span>
            </span>
          </div>

          <div class="info-item">
            <span class="label">Luogo di Nascita</span>
            <input v-if="editMode" v-model="socio.luogo_nascita" type="text" class="edit-input" />
            <span v-else class="value">{{ socio.luogo_nascita }}</span>
          </div>

          <div class="info-item">
            <span class="label">Gruppo di Appartenenza</span>
            <input
              v-if="editMode"
              v-model="socio.gruppo_appartenenza"
              type="text"
              class="edit-input"
            />
            <span v-else class="value">{{ socio.gruppo_appartenenza }}</span>
          </div>

          <div class="info-item">
            <span class="label">Prima Iscrizione</span>
            <input
              v-if="editMode"
              v-model.number="socio.data_prima_iscrizione"
              type="number"
              class="edit-input"
            />
            <span v-else class="value">{{ socio.data_prima_iscrizione }}</span>
          </div>
        </div>

        <!-- Note -->
        <div class="notes-section">
          <span class="label">📝 Note</span>
          <textarea
            v-if="editMode"
            v-model="socio.note"
            class="edit-textarea"
            rows="3"
            placeholder="Aggiungi note..."
          ></textarea>
          <p v-else class="notes-text">
            {{ socio.note || 'Nessuna nota disponibile' }}
          </p>
        </div>
      </section>

      <!-- Sezione Cronologia Pagamenti -->
      <section class="payments-section">
        <div class="section-header">
          <h2>💰 Cronologia Pagamenti</h2>
        </div>

        <div class="chronology-container">
          <div v-for="item in paymentChronology" :key="item.anno" class="year-item" :class="item.stato">
            <div class="year-header">
              <div class="year-info">
                <span class="year-number">{{ item.anno }}</span>
                <span class="year-status" :class="item.stato">
                  {{ item.isPagato ? '✓ Pagato' : '✗ Non Pagato' }}
                </span>
              </div>
              <div class="year-actions">
                <button
                  v-if="!item.isPagato"
                  @click="payYear(item.anno)"
                  class="pay-button accent"
                >
                  💳 Paga Ora
                </button>
                <button
                  v-if="item.isPagato"
                  @click="deleteTesseramento(item.tesseramento.id_tesseramento)"
                  class="delete-btn"
                  title="Elimina pagamento"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div v-if="item.isPagato" class="payment-details">
              <div class="detail-row">
                <span class="detail-label">📅 Data Pagamento:</span>
                <span class="detail-value">{{ formatDate(item.tesseramento.data_pagamento) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">💰 Quota:</span>
                <span class="detail-value">€ {{ item.tesseramento.quota_pagata.toFixed(2) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📄 Ricevuta:</span>
                <span class="detail-value">{{ item.tesseramento.numero_ricevuta }} / {{ item.tesseramento.numero_blocchetto }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="paymentChronology.length === 0" class="no-chronology">
          <p>Nessuna cronologia disponibile per questo socio.</p>
        </div>
      </section>

      <!-- Modal Aggiungi Pagamento -->
      <AddPaymentModal
        :show="showAddPaymentModal"
        :socio-id="socio?.id"
        :year="paymentYearToAdd"
        @payment-saved="handlePaymentSaved"
        @close="closeAddPaymentModal"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { db, getSocioById, getTesseramentiBySocioId, downloadSocioExport, addTesseramento } from '@/services/db'
import AddPaymentModal from '@/components/AddPaymentModal.vue'

const route = useRoute()

// Stato del componente
const socio = ref(null)
const tesseramenti = ref([])
const loading = ref(true)
const error = ref(null)
const editMode = ref(false)
const isSaving = ref(false)
const showAddPaymentModal = ref(false)
const paymentYearToAdd = ref(null)

const currentYear = new Date().getFullYear()

/**
 * Calcola l'età del socio
 */
const calculateAge = computed(() => {
  if (!socio.value?.data_nascita) return '?'

  const birthDate = new Date(socio.value.data_nascita)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
})

/**
 * Verifica se è minorenne
 */
const isMinor = computed(() => calculateAge.value < 18)

/**
 * Calcola la cronologia completa dei pagamenti
 */
const paymentChronology = computed(() => {
  if (!socio.value) return []

  const anniPagati = tesseramenti.value.map((t) => t.anno).sort((a, b) => a - b)
  const primaIscrizioneEsplicita = socio.value.data_prima_iscrizione
  const annoCorrente = new Date().getFullYear()

  // Determina l'anno di prima iscrizione
  let annoPrimaIscrizione

  // Prima prova con la data esplicita se valida
  if (
    primaIscrizioneEsplicita &&
    primaIscrizioneEsplicita >= 1900 &&
    primaIscrizioneEsplicita <= annoCorrente
  ) {
    annoPrimaIscrizione = primaIscrizioneEsplicita
  }
  // Altrimenti usa il primo anno di pagamento registrato
  else if (anniPagati.length > 0) {
    annoPrimaIscrizione = anniPagati[0]
  }
  // Se non abbiamo nessuna informazione valida, partiamo dall'anno corrente
  else {
    annoPrimaIscrizione = annoCorrente
  }

  const chronology = []
  // Genera la cronologia completa dall'anno di prima iscrizione all'anno corrente
  for (let anno = annoPrimaIscrizione; anno <= annoCorrente; anno++) {
    const isPagato = anniPagati.includes(anno)
    const tesseramento = tesseramenti.value.find(t => t.anno === anno)

    chronology.push({
      anno,
      isPagato,
      tesseramento,
      stato: isPagato ? 'pagato' : 'non-pagato'
    })
  }

  return chronology.reverse() // Mostra gli anni più recenti prima
})

/**
 * Formatta una data
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/D'

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

/**
 * Carica i dati del socio e i suoi tesseramenti
 */
const loadSocioData = async () => {
  loading.value = true
  error.value = null

  try {
    const socioId = parseInt(route.params.id)

    // Carica dati socio
    socio.value = await getSocioById(socioId)

    if (!socio.value) {
      error.value = 'Socio non trovato'
      return
    }

    // Carica tesseramenti
    tesseramenti.value = await getTesseramentiBySocioId(socioId)

    console.log('Dati caricati:', { socio: socio.value, tesseramenti: tesseramenti.value })
  } catch (err) {
    console.error('Errore nel caricamento:', err)
    error.value = 'Errore nel caricamento dei dati: ' + err.message
  } finally {
    loading.value = false
  }
}

/**
 * Attiva/disattiva la modalità modifica o salva i dati
 */
const toggleEditMode = async () => {
  if (editMode.value) {
    // Salva modifiche
    await saveSocioChanges()
  } else {
    // Entra in modalità modifica
    editMode.value = true
  }
}

/**
 * Salva le modifiche ai dati anagrafici del socio
 */
const saveSocioChanges = async () => {
  const oldData = { ...socio.value }
  if (!socio.value) return

  try {
    isSaving.value = true
    const newData = {
      cognome: socio.value.cognome,
      nome: socio.value.nome,
      data_nascita: socio.value.data_nascita,
      luogo_nascita: socio.value.luogo_nascita,
      gruppo_appartenenza: socio.value.gruppo_appartenenza,
      data_prima_iscrizione: socio.value.data_prima_iscrizione,
      note: socio.value.note,
      timestamp_modifica: Date.now()
    }

    await db.soci.update(socio.value.id, newData)

    // Logga la modifica per il tracking
    await logLocalChange('soci', socio.value.id, 'update', oldData, newData)

    editMode.value = false
    alert('Modifiche salvate con successo!')
  } catch (err) {
    console.error('Errore nel salvataggio socio:', err)
    alert('Errore nel salvataggio: ' + err.message)
  } finally {
    isSaving.value = false
  }
}

/**
 * Esporta i dati del socio corrente in formato JSON
 */
const exportSocio = async () => {
  if (!socio.value) return

  try {
    const exportData = {
      export_type: 'single_socio',
      export_timestamp: new Date().toISOString(),
      socio: socio.value,
      tesseramenti: tesseramenti.value,
      metadata: {
        totale_tesseramenti: tesseramenti.value.length,
        anni_considerati: socio.value.data_prima_iscrizione,
        anni_totali_cronologia: paymentChronology.value.length
      }
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `socio_${socio.value.cognome}_${socio.value.nome}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Errore esportazione socio:', err)
    alert('Errore nell\esportazione: ' + err.message)
  }
}


/**
 * Gestisce il salvataggio di un nuovo pagamento dal modal
 */
const handlePaymentSaved = async (paymentData) => {
  try {
    await addTesseramento(paymentData)
    await loadSocioData() // Ricarica i dati del socio

    // Chiudi il modal
    closeAddPaymentModal()

    alert('Pagamento registrato con successo!')
  } catch (err) {
    console.error('Errore salvataggio pagamento:', err)
    alert('Errore nel salvataggio: ' + err.message)
  }
}

/**
 * Apre il modal per pagare un anno specifico
 */
const payYear = (anno) => {
  paymentYearToAdd.value = anno
  showAddPaymentModal.value = true
}

/**
 * Chiude il modal di aggiunta pagamento
 */
const closeAddPaymentModal = () => {
  showAddPaymentModal.value = false
  paymentYearToAdd.value = null
}

/**
 * Elimina un tesseramento
 */
const deleteTesseramento = async (id) => {
  if (!confirm('Sei sicuro di voler eliminare questo pagamento?')) {
    return
  }

  try {
    await db.tesseramenti.delete(id)
    await loadSocioData()
    alert('Pagamento eliminato')
  } catch (err) {
    alert('Errore: ' + err.message)
  }
}

// Carica i dati al mount
onMounted(() => {
  loadSocioData()
})
</script>

<style scoped>
.socio-detail {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

/* Loading & Error States */
.loading-container,
.error-container {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-container h2 {
  color: var(--color-accent);
}

.back-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  margin-top: 1rem;
}

/* Header */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 3px solid var(--color-accent);
}

.back-link {
  display: inline-block;
  color: var(--color-text-secondary);
  text-decoration: none;
  margin-bottom: 0.5rem;
  font-weight: 500;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--color-accent);
}

.detail-header h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--color-primary);
}

.edit-button {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.edit-button:hover {
  background-color: var(--color-accent);
}

/* Info Section */
.info-section {
  background-color: var(--color-surface);
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-md);
}

.info-section h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--color-primary);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-size: 1.1rem;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.age-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #4caf50;
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.age-badge.minor {
  background-color: #ffa726;
}

.edit-input,
.edit-textarea {
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  font-family: var(--font-family-body);
  transition: border-color 0.2s;
}

.edit-input:focus,
.edit-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
}

.notes-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.notes-text {
  margin: 0.5rem 0 0 0;
  color: var(--color-text-secondary);
  font-style: italic;
}

/* Payments Section */
.payments-section {
  background-color: var(--color-surface);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: var(--shadow-md);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
}

.chronology-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.chronology-container::-webkit-scrollbar {
  width: 8px;
}

.chronology-container::-webkit-scrollbar-track {
  background: var(--color-border);
  border-radius: 4px;
}

.chronology-container::-webkit-scrollbar-thumb {
  background: var(--color-primary);
  border-radius: 4px;
}

.chronology-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent);
}

.year-item {
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 1.5rem;
  background-color: var(--color-background);
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.year-item.pagato {
  border-color: #4caf50;
  background-color: rgba(76, 175, 80, 0.05);
}

.year-item.non-pagato {
  border-color: #f44336;
  background-color: rgba(244, 67, 54, 0.05);
}

.year-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.year-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.year-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.year-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.year-status {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.year-status.pagato {
  background-color: #4caf50;
  color: white;
}

.year-status.non-pagato {
  background-color: #f44336;
  color: white;
}

.year-actions {
  display: flex;
  gap: 0.75rem;
}

.pay-button {
  padding: 0.6rem 1.2rem;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.pay-button:hover {
  background-color: #a22a2a;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(183, 28, 28, 0.3);
}

.delete-btn {
  padding: 0.5rem 0.75rem;
  background: none;
  border: 2px solid #f44336;
  border-radius: 6px;
  color: #f44336;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.delete-btn:hover {
  background-color: #f44336;
  color: white;
  transform: scale(1.1);
}

.payment-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.no-chronology {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .socio-detail {
    padding: 1rem;
  }

  .detail-header {
    flex-direction: column;
    gap: 1rem;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .table-header {
    display: none;
  }

  .table-row {
    padding: 1rem;
  }

  .table-row > span::before {
    content: attr(data-label);
    font-weight: 600;
    display: block;
    margin-bottom: 0.25rem;
    color: var(--color-text-secondary);
  }
}
</style>
