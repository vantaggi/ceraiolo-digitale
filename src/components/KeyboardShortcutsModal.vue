<template>
  <Teleport to="body">
    <div v-if="isVisible" class="modal-overlay" @click="closeOnOverlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">⌨️ Scorciatoie da Tastiera</h3>
          <button class="close-button" @click="$emit('close')" aria-label="Chiudi">✕</button>
        </div>

        <div class="modal-body">
          <div class="shortcuts-grid">
            <!-- Global -->
            <div class="shortcut-group">
              <h4>Globali</h4>
              <ul class="shortcut-list">
                <li>
                  <span class="key">Ctrl</span> + <span class="key">K</span>
                  <span class="desc">Ricerca Globale</span>
                </li>
                <li>
                  <span class="key">?</span>
                  <span class="desc">Mostra questa guida</span>
                </li>
              </ul>
            </div>

            <!-- Home / Lists (Implied general nav) -->
            <div class="shortcut-group">
              <h4>Liste / Ricerca</h4>
              <ul class="shortcut-list">
                <li>
                  <span class="key">↑</span> / <span class="key">↓</span>
                  <span class="desc">Seleziona socio</span>
                </li>
                <li>
                  <span class="key">Invio</span>
                  <span class="desc">Apri dettaglio / Paga (Turbo)</span>
                </li>
              </ul>
            </div>

            <!-- Detail View -->
            <div class="shortcut-group">
              <h4>Dettaglio Socio</h4>
              <ul class="shortcut-list">
                <li>
                  <span class="key">J</span> / <span class="key">→</span>
                  <span class="desc">Socio successivo</span>
                </li>
                <li>
                  <span class="key">K</span> / <span class="key">←</span>
                  <span class="desc">Socio precedente</span>
                </li>
                <li>
                  <span class="key">Ctrl</span> + <span class="key">E</span>
                  <span class="desc">Modifica</span>
                </li>
                <li>
                  <span class="key">Ctrl</span> + <span class="key">S</span>
                  <span class="desc">Salva</span>
                </li>
              </ul>
            </div>

            <!-- Batch Entry -->
            <div class="shortcut-group">
              <h4>Registrazione Seriale</h4>
              <ul class="shortcut-list">
                <li>
                  <span class="key">Turbo Mode</span>
                  <span class="desc">Pagamento istantaneo</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const closeOnOverlay = (event) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
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
  max-width: 600px;
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
  color: var(--color-primary);
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
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.shortcut-group h4 {
  color: var(--color-accent);
  margin-bottom: 1rem;
  font-size: 1rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}

.shortcut-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.shortcut-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.key {
  display: inline-block;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-primary);
  box-shadow: 0 1px 0 var(--color-border);
}

.desc {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
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
</style>
