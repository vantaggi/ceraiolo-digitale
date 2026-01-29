<template>
  <Teleport to="body">
    <div v-if="isVisible" class="modal-overlay" @click="closeOnOverlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ title || '🗑️ Elimina Socio' }}</h3>
          <button class="close-button" @click="closeModal" aria-label="Chiudi">✕</button>
        </div>

        <div class="modal-body">
          <div class="warning-icon">⚠️</div>

          <div v-if="message" class="custom-message">
            <p class="warning-message" style="white-space: pre-line">{{ message }}</p>
          </div>

          <template v-else>
            <p class="warning-message">
              Sei sicuro di voler eliminare il socio
              <strong>{{ socioName }}</strong
              >?
            </p>
            <p class="danger-message">
              Questa operazione è <strong>irreversibile</strong> e eliminerà anche tutti i
              tesseramenti associati a questo socio.
            </p>
          </template>
        </div>

        <div class="modal-footer">
          <button class="cancel-button" @click="closeModal" :disabled="isDeleting">Annulla</button>
          <button class="delete-button" @click="confirmDelete" :disabled="isDeleting">
            <span v-if="isDeleting" class="loading-spinner">⏳</span>
            {{ isDeleting ? 'Eliminazione...' : 'Elimina Socio' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  socioName: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'confirm'])

const isDeleting = ref(false)

// Close modal when clicking on overlay
const closeOnOverlay = (event) => {
  if (event.target === event.currentTarget) {
    closeModal()
  }
}

// Close modal
const closeModal = () => {
  if (!isDeleting.value) {
    emit('close')
  }
}

// Confirm deletion
const confirmDelete = () => {
  isDeleting.value = true
  emit('confirm')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  background: var(--color-surface);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease-out;
  border: 1px solid var(--color-border);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  margin: 0;
  color: var(--color-accent);
  font-size: 1.25rem;
  font-weight: 600;
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
  background-color: var(--color-background);
  color: var(--color-primary);
}

.modal-body {
  padding: 1.5rem;
  text-align: center;
}

.warning-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.warning-message {
  font-size: 1.1rem;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
  line-height: 1.5;
}

.danger-message {
  font-size: 0.95rem;
  color: var(--color-accent);
  background-color: var(--color-surface-hover); /* Fallback or use surface-active */
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid var(--color-accent);
  line-height: 1.4;
  border: 1px solid var(--color-border);
}

/* Optional: Specific override if you have a defined danger background variable */
/* background-color: rgba(var(--color-accent-rgb), 0.1); */

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.cancel-button,
.delete-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-button {
  background-color: var(--color-background);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.cancel-button:hover:not(:disabled) {
  background-color: var(--color-border);
  color: var(--color-text-primary);
}

.delete-button {
  background-color: var(--color-accent);
  color: white;
}

.delete-button:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
}

.cancel-button:disabled,
.delete-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

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
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }

  .modal-footer {
    flex-direction: column;
  }

  .cancel-button,
  .delete-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
