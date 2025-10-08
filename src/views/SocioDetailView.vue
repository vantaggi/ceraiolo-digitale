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

      <!-- Sezione Storico Pagamenti -->
      <section class="payments-section">
        <div class="section-header">
          <h2>💰 Storico Pagamenti</h2>
          <button @click="showAddPayment = true" class="accent">+ Aggiungi Pagamento</button>
        </div>

        <!-- Tabella Pagamenti -->
        <div v-if="tesseramenti.length > 0" class="payments-table">
          <div class="table-header">
            <span>Anno</span>
            <span>Data Pagamento</span>
            <span>Quota</span>
            <span>Ricevuta</span>
            <span>Azioni</span>
          </div>

          <div v-for="tess in tesseramenti" :key="tess.id_tesseramento" class="table-row">
            <span class="year">{{ tess.anno }}</span>
            <span>{{ formatDate(tess.data_pagamento) }}</span>
            <span class="amount">€ {{ tess.quota_pagata.toFixed(2) }}</span>
            <span class="receipt"> {{ tess.numero_ricevuta }} / {{ tess.numero_blocchetto }} </span>
            <span>
              <button @click="deleteTesseramento(tess.id_tesseramento)" class="delete-btn">
                🗑️
              </button>
            </span>
          </div>
        </div>

        <p v-else class="no-payments">Nessun pagamento registrato per questo socio.</p>

        <!-- Calcolo Arretrati -->
        <div v-if="arretrati.length > 0" class="arretrati-section">
          <h3>⚠️ Anni Non Pagati</h3>
          <div class="arretrati-list">
            <div v-for="anno in arretrati" :key="anno" class="arretrato-item">
              <span class="arretrato-year">Anno {{ anno }}</span>
              <button @click="payYear(anno)" class="pay-button accent">💳 Paga Ora</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Modal Aggiungi Pagamento -->
      <div v-if="showAddPayment" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <h2>Aggiungi Nuovo Pagamento</h2>

          <form @submit.prevent="addPayment">
            <div class="form-group">
              <label>Anno</label>
              <input
                v-model.number="newPayment.anno"
                type="number"
                required
                min="2000"
                :max="currentYear"
              />
            </div>

            <div class="form-group">
              <label>Data Pagamento</label>
              <input v-model="newPayment.data_pagamento" type="date" required />
            </div>

            <div class="form-group">
              <label>Quota Pagata (€)</label>
              <input v-model.number="newPayment.quota_pagata" type="number" step="0.01" required />
            </div>

            <div class="form-group">
              <label>Numero Ricevuta</label>
              <input v-model.number="newPayment.numero_ricevuta" type="number" required />
            </div>

            <div class="form-group">
              <label>Numero Blocchetto</label>
              <input v-model.number="newPayment.numero_blocchetto" type="number" required />
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeModal">Annulla</button>
              <button type="submit" class="accent">Salva Pagamento</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { db, getSocioById, getTesseramentiBySocioId, downloadSocioExport, logLocalChange } from '@/services/db'

const route = useRoute()

// Stato del componente
const socio = ref(null)
const tesseramenti = ref([])
const loading = ref(true)
const error = ref(null)
const editMode = ref(false)
const isSaving = ref(false)
const showAddPayment = ref(false)

// Nuovo pagamento
const newPayment = ref({
  anno: new Date().getFullYear(),
  data_pagamento: new Date().toISOString().split('T')[0],
  quota_pagata: 10.0,
  numero_ricevuta: '',
  numero_blocchetto: '',
})

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
 * Calcola gli anni non pagati (arretrati)
 */
const arretrati = computed(() => {
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
  // Se non abbiamo nessuna informazione valida, non mostrare arretrati
  else {
    return []
  }

  const anniMancanti = []
  // Gli arretrati partono dall'anno di prima iscrizione fino all'anno precedente
  // (l'anno corrente potrebbe ancora essere pagato)
  for (let anno = annoPrimaIscrizione; anno < annoCorrente; anno++) {
    if (!anniPagati.includes(anno)) {
      anniMancanti.push(anno)
    }
  }

  return anniMancanti
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
      arretrati: arretrati.value,
      metadata: {
        totale_tesseramenti: tesseramenti.value.length,
        anni_considerati: socio.value.data_prima_iscrizione,
        anni_mancanti: arretrati.value.length
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
 * Aggiunge un nuovo pagamento
 */
const addPayment = async () => {
  try {
    // Genera un ID unico (in futuro sarà UUID)
    const newId = Date.now().toString()

    const tesseramento = {
      id_tesseramento: newId,
      id_socio: socio.value.id,
      ...newPayment.value,
    }

    await db.tesseramenti.add(tesseramento)

    // Logga la modifica
    await logLocalChange('tesseramenti', tesseramento.id_tesseramento, 'create', null, tesseramento)

    // Ricarica i tesseramenti
    await loadSocioData()

    // Reset form e chiudi modal
    showAddPayment.value = false
    resetPaymentForm()

    alert('Pagamento registrato con successo!')
  } catch (err) {
    console.error('Errore salvataggio pagamento:', err)
    alert('Errore nel salvataggio: ' + err.message)
  }
}

/**
 * Scorciatoia per pagare un anno specifico
 */
const payYear = (anno) => {
  newPayment.value.anno = anno
  showAddPayment.value = true
}

/**
 * Elimina un tesseramento
 */
const deleteTesseramento = async (id) => {
  if (!confirm('Sei sicuro di voler eliminare questo pagamento?')) {
    return
  }

  try {
    // Recupera i dati prima della cancellazione per il log
    const tesseramentoToDelete = await db.tesseramenti.where('id_tesseramento').equals(id).first()

    await db.tesseramenti.delete(id)

    // Logga la cancellazione
    if (tesseramentoToDelete) {
      await logLocalChange('tesseramenti', id, 'delete', tesseramentoToDelete, null)
    }

    await loadSocioData()
    alert('Pagamento eliminato')
  } catch (err) {
    alert('Errore: ' + err.message)
  }
}

/**
 * Chiude il modal
 */
const closeModal = () => {
  showAddPayment.value = false
  resetPaymentForm()
}

/**
 * Reset del form pagamento
 */
const resetPaymentForm = () => {
  newPayment.value = {
    anno: currentYear,
    data_pagamento: new Date().toISOString().split('T')[0],
    quota_pagata: 10.0,
    numero_ricevuta: '',
    numero_blocchetto: '',
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

.payments-table {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr 1.5fr 0.8fr;
  gap: 1rem;
  padding: 1rem;
  align-items: center;
}

.table-header {
  background-color: var(--color-primary);
  color: white;
  font-weight: 600;
}

.table-row {
  border-top: 1px solid var(--color-border);
  transition: background-color 0.2s;
}

.table-row:hover {
  background-color: var(--color-background);
}

.year {
  font-weight: 700;
  color: var(--color-accent);
}

.amount {
  font-weight: 600;
  color: #4caf50;
}

.receipt {
  font-family: monospace;
  color: var(--color-text-secondary);
}

.delete-btn {
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  transition: transform 0.2s;
}

.delete-btn:hover {
  transform: scale(1.2);
}

.no-payments {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

/* Arretrati */
.arretrati-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #fff3e0;
  border-radius: 8px;
  border-left: 4px solid #ffa726;
}

.arretrati-section h3 {
  margin-top: 0;
  color: #e65100;
}

.arretrati-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.arretrato-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
}

.arretrato-year {
  font-weight: 600;
  color: var(--color-primary);
}

.pay-button {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--color-surface);
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-content h2 {
  margin-top: 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.modal-actions button {
  padding: 0.75rem 1.5rem;
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
