<template>
  <Teleport to="body">
    <div v-if="isVisible" class="modal-overlay" @click="closeOnOverlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">🗑️ Elimina Socio</h3>
          <button class="close-button" @click="closeModal" aria-label="Chiudi">✕</button>
        </div>

        <div class="modal-body">
          <div class="warning-icon">⚠️</div>
          <p class="warning-message">
            Sei sicuro di voler eliminare il socio
            <strong>{{ socioName }}</strong
            >?
          </p>
          <p class="danger-message">
            Questa operazione è <strong>irreversibile</strong> e eliminerà anche tutti i
            tesseramenti associati a questo socio.
          </p>
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
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-title {
  margin: 0;
  color: #d32f2f;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: #f5f5f5;
  color: #333;
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
  color: #333;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.danger-message {
  font-size: 0.95rem;
  color: #d32f2f;
  background-color: #ffebee;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #d32f2f;
  line-height: 1.4;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
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
  background-color: #f5f5f5;
  color: #666;
}

.cancel-button:hover:not(:disabled) {
  background-color: #e0e0e0;
  color: #333;
}

.delete-button {
  background-color: #d32f2f;
  color: white;
}

.delete-button:hover:not(:disabled) {
  background-color: #b71c1c;
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
