<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>💳 Registra Pagamento</h3>
        <button @click="closeModal" class="close-button">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="payment-form">
        <div class="form-group">
          <label for="quota-pagata">
            <span class="field-icon">💰</span>
            Quota Pagata (€)
          </label>
          <input
            id="quota-pagata"
            v-model.number="paymentDetails.quota_pagata"
            type="number"
            step="0.01"
            min="0"
            required
            class="form-input"
            placeholder="Es: 10.00"
          />
        </div>

        <div class="form-group">
          <label for="data-pagamento">
            <span class="field-icon">📅</span>
            Data Pagamento
          </label>
          <input
            id="data-pagamento"
            v-model="paymentDetails.data_pagamento"
            type="date"
            required
            class="form-input"
            :max="new Date().toISOString().split('T')[0]"
          />
        </div>

        <div class="form-group">
          <label for="numero-blocchetto">
            <span class="field-icon">📄</span>
            N. Blocchetto
          </label>
          <input
            id="numero-blocchetto"
            v-model.number="paymentDetails.numero_blocchetto"
            type="number"
            min="1"
            required
            class="form-input"
            placeholder="Es: 123"
          />
        </div>

        <div class="form-group">
          <label for="numero-ricevuta">
            <span class="field-icon">🧾</span>
            N. Ricevuta
          </label>
          <input
            id="numero-ricevuta"
            v-model.number="paymentDetails.numero_ricevuta"
            type="number"
            min="1"
            required
            class="form-input"
            placeholder="Es: 456"
          />
        </div>

        <!-- Years Selection -->
        <div class="form-group">
          <label>
            <span class="field-icon">📅</span>
            Anni di Tesseramento
          </label>
          <div class="years-selection">
            <div v-for="year in availableYears" :key="year" class="year-option">
              <input
                :id="'year-' + year"
                type="checkbox"
                :value="year"
                v-model="selectedYears"
                :disabled="isSubmitting"
              />
              <label :for="'year-' + year" class="year-label">
                {{ year }}
                <span v-if="year === props.annoRiferimento" class="reference-badge"
                  >(anno riferimento)</span
                >
              </label>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" @click="closeModal" class="cancel-button" :disabled="isSubmitting">
            Annulla
          </button>
          <button type="submit" class="save-button" :disabled="isSubmitting">
            {{ isSubmitting ? 'Salvando...' : `Salva Pagamenti (${selectedYears.length} anni)` }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { getTesseramentiBySocioId, getSetting } from '@/services/db'

const emit = defineEmits(['close', 'payments-saved'])

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  socioId: {
    type: String,
    required: true,
  },
  yearsToPay: {
    type: Array,
    required: true,
  },
  numeroBlocchetto: {
    type: Number,
    default: null,
  },
  numeroRicevuta: {
    type: Number,
    default: null,
  },
  annoRiferimento: {
    type: Number,
    default: () => new Date().getFullYear(),
  },
})

const isSubmitting = ref(false)

const paymentDetails = reactive({
  quota_pagata: 10.0, // Will be updated from settings
  data_pagamento: new Date().toISOString().split('T')[0],
  numero_ricevuta: null,
  numero_blocchetto: null,
})

// Years selection
const selectedYears = ref([...props.yearsToPay])
const availableYears = ref([])
const paidYears = ref(new Set())

// Load available years when modal opens
const loadAvailableYears = async () => {
  try {
    console.log('Loading available years for socioId:', props.socioId)

    // Get socio info and paid years
    const [socio, tesseramenti] = await Promise.all([
      import('@/services/db').then((m) => m.getSocioById(props.socioId)),
      getTesseramentiBySocioId(props.socioId),
    ])

    console.log('Socio info:', socio)
    console.log('Tesseramenti:', tesseramenti)

    paidYears.value = new Set(tesseramenti.map((t) => t.anno))
    console.log('Paid years set:', Array.from(paidYears.value))

    // Get socio's first registration year
    // If data_prima_iscrizione is null but socio has payments, use the earliest payment year
    let firstRegistrationYear = socio?.data_prima_iscrizione
    if (!firstRegistrationYear && tesseramenti.length > 0) {
      // Find the earliest payment year
      const paymentYears = tesseramenti.map((t) => t.anno).sort((a, b) => a - b)
      firstRegistrationYear = paymentYears[0]
    }
    firstRegistrationYear = firstRegistrationYear || new Date().getFullYear()
    console.log('First registration year:', firstRegistrationYear)

    // Get last 5 years, but not earlier than first registration
    const currentYear = new Date().getFullYear()
    const startYear = Math.max(currentYear - 4, firstRegistrationYear)
    console.log('Start year calculation:', { currentYear, firstRegistrationYear, startYear })

    const availableYearsRange = []
    for (let year = startYear; year <= currentYear; year++) {
      availableYearsRange.push(year)
    }
    console.log('Available years range:', availableYearsRange)

    // Available years: years from first registration to current, excluding paid years
    const years = []
    for (const year of availableYearsRange) {
      if (!paidYears.value.has(year)) {
        years.push(year)
      }
    }
    console.log('Years after filtering paid:', years)

    // Always include reference year if not paid and not already included
    if (!paidYears.value.has(props.annoRiferimento) && !years.includes(props.annoRiferimento)) {
      years.push(props.annoRiferimento)
      console.log('Added reference year:', props.annoRiferimento)
    }

    // Sort years ascending
    years.sort((a, b) => a - b)
    console.log('Final available years:', years)

    availableYears.value = years
  } catch (error) {
    console.error('Error loading available years:', error)
    // Fallback: show reference year only
    availableYears.value = [props.annoRiferimento]
  }
}

// Reset form when modal opens
watch(
  () => props.show,
  (show) => {
    if (show) {
      resetForm()
    }
  },
)

const resetForm = async () => {
  // Load default quota from settings
  const defaultQuota = await getSetting('defaultQuota', 10.0)
  paymentDetails.quota_pagata = defaultQuota

  paymentDetails.data_pagamento = new Date().toISOString().split('T')[0]
  paymentDetails.numero_blocchetto = props.numeroBlocchetto
  paymentDetails.numero_ricevuta = props.numeroRicevuta

  // Load available years and set default selection
  await loadAvailableYears()

  // Pre-select reference year if available, otherwise select first available year
  if (availableYears.value.includes(props.annoRiferimento)) {
    selectedYears.value = [props.annoRiferimento]
  } else if (availableYears.value.length > 0) {
    selectedYears.value = [availableYears.value[0]]
  } else {
    selectedYears.value = []
  }

  isSubmitting.value = false
}

const closeModal = () => {
  if (!isSubmitting.value) {
    emit('close')
  }
}

const handleSubmit = () => {
  // Pass all details to the parent to handle the save logic
  emit('payments-saved', {
    details: { ...paymentDetails },
    years: selectedYears.value,
    socioId: props.socioId,
  })
  // The parent component will be responsible for closing the modal on success
}
</script>

<style scoped>
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
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background-color: var(--color-surface);
  border-radius: 12px;
  border: 2px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  min-width: 400px;
  max-width: 450px;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid var(--color-border);
  background-color: var(--color-background);
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: var(--color-accent);
  color: white;
}

.payment-form {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

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

.info-label {
  background-color: var(--color-background);
  padding: 0.75rem;
  border-radius: 8px;
  border: 2px solid var(--color-border);
  font-weight: normal !important;
}

.field-icon {
  font-size: 1.2rem;
}

.form-input {
  padding: 0.75rem;
  border-radius: 8px;
  border: 2px solid var(--color-border);
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-size: 1rem;
  font-family: var(--font-family-body);
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(183, 28, 28, 0.1);
}

.form-input:invalid {
  border-color: var(--color-accent);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-button,
.save-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button {
  background-color: var(--color-text-secondary);
  color: white;
}

.cancel-button:hover {
  background-color: #666;
  transform: scale(1.02);
}

.save-button {
  background-color: var(--color-accent);
  color: white;
}

.save-button:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
  transform: scale(1.02);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Years Selection */
.years-selection {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.year-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background-color: var(--color-background);
  border-radius: 6px;
  border: 1px solid var(--color-border);
  transition: all 0.2s;
}

.year-option:hover {
  border-color: var(--color-accent);
  background-color: var(--color-surface-hover);
}

.year-option input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-accent);
}

.year-label {
  cursor: pointer;
  font-weight: 500;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.reference-badge {
  background-color: var(--color-accent);
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    min-width: 90vw;
    max-width: 95vw;
    margin: 1rem;
    max-height: 90vh;
  }

  .modal-header {
    padding: 1rem 1.5rem;
  }

  .payment-form {
    padding: 1.5rem;
    gap: 1rem;
  }

  .modal-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .cancel-button,
  .save-button {
    width: 100%;
    padding: 1rem 1.5rem;
  }

  .years-selection {
    max-height: 200px;
    overflow-y: auto;
  }
}

@media (max-width: 480px) {
  .modal-content {
    min-width: 95vw;
    margin: 0.5rem;
  }

  .modal-header {
    padding: 1rem;
  }

  .payment-form {
    padding: 1rem;
  }
}
</style>
