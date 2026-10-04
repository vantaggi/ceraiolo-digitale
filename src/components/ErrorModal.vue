<template>
  <div class="modal-overlay" @click.self="$emit('close')" @keydown.esc="$emit('close')" tabindex="-1">
    <div class="modal-content error-modal" role="dialog" aria-modal="true" aria-labelledby="error-modal-title">
      <div class="modal-header">
        <h2 id="error-modal-title" class="modal-title">
          <BaseIcon name="alert-circle" size="24" color="accent" />
          <span>Operazione Bloccata</span>
        </h2>
        <button class="close-button" @click="$emit('close')" aria-label="Chiudi finestra" type="button">
          <BaseIcon name="x" size="20" />
        </button>
      </div>
      <p>{{ message }}</p>
      <div class="modal-actions">
        <button ref="confirmBtn" class="accent" @click="$emit('close')">
          <BaseIcon name="check" size="18" />
          <span>Ho Capito</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import BaseIcon from '@/components/common/BaseIcon.vue'

defineProps({
  message: { type: String, required: true },
})

defineEmits(['close'])

const confirmBtn = ref(null)

onMounted(() => {
  nextTick(() => {
    confirmBtn.value?.focus()
  })
})
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
}

.modal-content {
  background-color: var(--color-surface, #ffffff);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.error-modal {
  border-left: 5px solid var(--color-accent);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.modal-title {
  margin: 0;
  color: var(--color-primary);
  font-size: 1.35rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0.25rem;
  border-radius: 6px;
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-button:hover {
  background-color: var(--color-background);
  color: var(--color-primary);
}

.modal-content p {
  color: var(--color-text-primary);
  line-height: 1.6;
  margin: 1rem 0;
  font-size: 1.05rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.accent {
  min-height: 48px;
  min-width: 140px;
  padding: 0.75rem 1.5rem;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.accent:hover {
  background-color: var(--color-accent-hover);
  transform: scale(1.02);
}
</style>
