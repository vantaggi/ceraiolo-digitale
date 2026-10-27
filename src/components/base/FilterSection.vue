<template>
  <section class="filter-section" :class="{ 'filter-section--aperta': aperta }">
    <h3 class="filter-section__titolo">
      <button
        type="button"
        class="filter-section__toggle"
        :aria-expanded="aperta"
        :aria-controls="idCorpo"
        @click="aperta = !aperta"
      >
        <AppIcon name="espandi" class="filter-section__chevron" />
        <AppIcon v-if="icona" :name="icona" />
        <span class="filter-section__label">{{ titolo }}</span>
        <span v-if="attivi > 0" class="filter-section__conta">
          {{ attivi
          }}<span class="sr-only"> {{ attivi === 1 ? 'filtro attivo' : 'filtri attivi' }}</span>
        </span>
      </button>
    </h3>
    <div v-show="aperta" :id="idCorpo" class="filter-section__corpo">
      <slot />
    </div>
  </section>
</template>

<script setup>
import { ref, useId } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'

// Sezione richiudibile di un pannello filtri: titolo con il numero di filtri attivi,
// contenuto nello slot. Usata dal Report su misura, pensata per ogni pannello a sezioni.
const props = defineProps({
  titolo: { type: String, required: true },
  icona: { type: String, default: '' },
  attivi: { type: Number, default: 0 },
  apertaAllInizio: { type: Boolean, default: false },
})

const aperta = ref(props.apertaAllInizio)
const idCorpo = `filter-section-${useId()}`
</script>

<style scoped>
.filter-section {
  border-bottom: 1px solid var(--color-border);
}

.filter-section__titolo {
  margin: 0;
  font-size: var(--font-size-label);
}

.filter-section__toggle {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  width: 100%;
  padding: var(--space-12) var(--space-4);
  border: none;
  border-radius: var(--radius-control);
  background: none;
  box-shadow: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-label);
  font-weight: 600;
  text-align: left;
  white-space: normal;
  justify-content: flex-start;
}

.filter-section__toggle:hover {
  background: var(--color-surface-hover);
}

.filter-section__chevron {
  color: var(--color-text-secondary);
  transform: rotate(-90deg);
  transition: transform 0.15s ease;
}

.filter-section--aperta .filter-section__chevron {
  transform: none;
}

.filter-section__label {
  flex: 1;
}

.filter-section__conta {
  min-width: 1.5rem;
  padding: 0 var(--space-8);
  border-radius: var(--radius-full);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  font-size: var(--font-size-caption);
  text-align: center;
}

.filter-section__corpo {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  padding: var(--space-4) var(--space-4) var(--space-16) var(--space-32);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .filter-section__chevron {
    transition: none;
  }
}
</style>
