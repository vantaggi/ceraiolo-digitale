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

      <!-- Stato Caricamento -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { generateRenewalListPDF, generateAllCardsPDF } from '@/services/export'
import { getAllSociWithTesseramenti } from '@/services/db'

// Stato del componente
const renewalYear = ref(new Date().getFullYear() + 1)
const loading = ref(false)
const loadingMessage = ref('')
const cardProgress = ref(0)

const currentYear = new Date().getFullYear()

/**
 * Genera la lista rinnovi in formato PDF
 */
const generateRenewalList = async () => {
  if (!renewalYear.value) return

  try {
    loading.value = true
    loadingMessage.value = 'Caricamento dati soci...'

    const soci = await getAllSociWithTesseramenti()

    loadingMessage.value = 'Generazione PDF...'
    await generateRenewalListPDF(soci, renewalYear.value)

    alert('PDF Lista Rinnovi generato con successo!')
  } catch (error) {
    console.error('Errore generazione lista rinnovi:', error)
    alert('Errore nella generazione del PDF: ' + error.message)
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

    const soci = await getAllSociWithTesseramenti()

    loadingMessage.value = 'Generazione tessere...'
    await generateAllCardsPDF(soci, renewalYear.value, (progress) => {
      cardProgress.value = progress
    })

    alert('PDF Tessere generato con successo!')
  } catch (error) {
    console.error('Errore generazione tessere:', error)
    alert('Errore nella generazione del PDF: ' + error.message)
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
</style>
