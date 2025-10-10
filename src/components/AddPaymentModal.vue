<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>💳 Registra Pagamento</h3>
        <button @click="closeModal" class="close-button">✕</button>
      </div>

      <form @submit.prevent="submitPayment" class="payment-form">
        <div class="form-group">
          <label for="quota-pagata">
            <span class="field-icon">💰</span>
            Quota Pagata (€)
          </label>
          <input
            id="quota-pagata"
            v-model.number="formData.quota_pagata"
            type="number"
            step="0.01"
            min="0"
            required
            class="form-input"
            placeholder="Es: 25.00"
          />
        </div>

        <div class="form-group">
          <label for="data-pagamento">
            <span class="field-icon">📅</span>
            Data Pagamento
          </label>
          <input
            id="data-pagamento"
            v-model="formData.data_pagamento"
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
            v-model.number="formData.numero_blocchetto"
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
            v-model.number="formData.numero_ricevuta"
            type="number"
            min="1"
            required
            class="form-input"
            placeholder="Es: 456"
          />
        </div>

        <div class="form-group">
          <label class="info-label">
            <span class="field-icon">ℹ️</span>
            Anno Tesseramento: {{ year }}
          </label>
        </div>

        <div class="modal-actions">
          <button type="button" @click="closeModal" class="cancel-button">Annulla</button>
          <button type="submit" class="save-button" :disabled="isSubmitting">
            {{ isSubmitting ? 'Salvando...' : 'Salva Pagamento' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const emit = defineEmits(['payment-saved', 'close'])

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  socioId: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    default: new Date().getFullYear(),
  },
})

const isSubmitting = ref(false)

const formData = reactive({
  quota_pagata: '',
  data_pagamento: new Date().toISOString().split('T')[0], // Default today's date
  numero_blocchetto: '',
  numero_ricevuta: '',
})

// Reset form when modal opens
watch(
  () => props.show,
  (show) => {
    if (show) {
      resetForm()
    }
  },
)

const resetForm = () => {
  formData.quota_pagata = ''
  formData.data_pagamento = new Date().toISOString().split('T')[0]
  formData.numero_blocchetto = ''
  formData.numero_ricevuta = ''
  isSubmitting.value = false
}

const closeModal = () => {
  if (!isSubmitting.value) {
    emit('close')
  }
}

const submitPayment = async () => {
  if (isSubmitting.value) return

  // Validate form
  if (!formData.quota_pagata || formData.quota_pagata <= 0) {
    alert('Inserire una quota valida maggiore di 0')
    return
  }

  if (!formData.data_pagamento) {
    alert('Selezionare una data di pagamento')
    return
  }

  if (!formData.numero_blocchetto || formData.numero_blocchetto < 1) {
    alert('Inserire un numero bloccetto valido')
    return
  }

  if (!formData.numero_ricevuta || formData.numero_ricevuta < 1) {
    alert('Inserire un numero ricevuta valido')
    return
  }

  isSubmitting.value = true

  try {
    const paymentData = {
      id_socio: props.socioId,
      anno: props.year,
      quota_pagata: parseFloat(formData.quota_pagata),
      data_pagamento: formData.data_pagamento,
      numero_ricevuta: parseInt(formData.numero_ricevuta),
      numero_blocchetto: parseInt(formData.numero_blocchetto),
    }

    emit('payment-saved', paymentData)
  } catch (error) {
    console.error('Errore durante il salvataggio del pagamento:', error)
    alert('Errore durante il salvataggio del pagamento. Riprovare.')
  } finally {
    isSubmitting.value = false
  }
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
  max-width: 500px;
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
  background-color: #a22a2a;
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

/* Responsive */
@media (max-width: 480px) {
  .modal-content {
    min-width: 90vw;
    margin: 1rem;
  }

  .modal-header {
    padding: 1rem 1.5rem;
  }

  .payment-form {
    padding: 1.5rem;
  }

  .modal-actions {
    flex-direction: column;
  }

  .cancel-button,
  .save-button {
    width: 100%;
  }
}
</style>
