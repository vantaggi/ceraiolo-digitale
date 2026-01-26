<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content error-modal">
      <h2>❌ Operazione Bloccata</h2>
      <p>{{ message }}</p>
      <div class="modal-actions">
        <button class="accent" @click="$emit('close')">Ho Capito</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, required: true },
})

defineEmits(['close'])
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
  background-color: white;
  border-radius: 12px;
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

.modal-content h2 {
  margin-top: 0;
  color: var(--color-primary);
  font-size: 1.5rem;
}

.modal-content p {
  color: var(--color-text-primary);
  line-height: 1.6;
  margin: 1rem 0;
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
  padding: 0.75rem 1.5rem;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.accent:hover {
  background-color: var(--color-accent-hover);
  transform: scale(1.02);
}
</style>
