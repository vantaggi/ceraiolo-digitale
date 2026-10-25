<template>
  <BaseModal :open="isVisible" title="Scorciatoie da tastiera" size="lg" @close="$emit('close')">
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
  </BaseModal>
</template>

<script setup>
import BaseModal from '@/components/base/BaseModal.vue'

defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close'])
</script>

<style scoped>
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
</style>
