<template>
  <section class="list-rows" :aria-labelledby="title ? headingId : undefined">
    <h2 v-if="title" :id="headingId" class="list-rows__title">{{ title }}</h2>
    <ul class="list-rows__group">
      <li v-for="row in rows" :key="row.id" class="list-rows__item">
        <RouterLink v-if="row.to" :to="row.to" class="list-rows__row">
          <span class="list-rows__text">
            <span class="list-rows__label">{{ row.label }}</span>
            <span v-if="row.help" class="list-rows__help">{{ row.help }}</span>
          </span>
          <span v-if="row.value !== undefined" class="list-rows__value">{{ row.value }}</span>
          <AppIcon name="successivo" class="list-rows__chevron" />
        </RouterLink>
        <button
          v-else
          type="button"
          class="list-rows__row"
          :disabled="row.disabled"
          @click="emit('select', row)"
        >
          <span class="list-rows__text">
            <span class="list-rows__label">{{ row.label }}</span>
            <span v-if="row.disabled && row.reason" class="list-rows__help">{{ row.reason }}</span>
            <span v-else-if="row.help" class="list-rows__help">{{ row.help }}</span>
          </span>
          <span class="list-rows__value">{{ row.value }}</span>
        </button>
      </li>
    </ul>
    <p v-if="note" class="list-rows__note">{{ note }}</p>
  </section>
</template>

<script setup>
// Righe raggruppate della UI Constitution (componente ListRows).
// - Riga nome-valore: il nome a sinistra, il valore attuale a destra; premendola la pagina
//   apre la scelta (evento `select`) e il valore nuovo torna nella riga.
// - Riga con `to`: porta a un'altra pagina, con la freccia; non e' mai un bottone.
// Le azioni sulla pagina restano bottoni, fuori dalle righe.
import { useId } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'

defineProps({
  title: { type: String, default: '' },
  /** @type {Array<{ id: string, label: string, value?: string, help?: string, to?: string|object, disabled?: boolean, reason?: string }>} */
  rows: { type: Array, required: true },
  note: { type: String, default: '' },
})

const emit = defineEmits(['select'])
const headingId = `list-rows-${useId()}`
</script>

<style scoped>
.list-rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  max-width: var(--page-width-form);
}

.list-rows__title {
  margin: 0;
  font-family: var(--font-family-body);
  font-size: var(--font-size-label);
  font-weight: 600;
  color: var(--text-secondary);
}

.list-rows__group {
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--background-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-surface);
  overflow: hidden; /* le righe seguono gli angoli; il fuoco sta dentro la riga */
}

.list-rows__item + .list-rows__item {
  border-top: 1px solid var(--border-subtle);
}

.list-rows__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4) var(--space-16);
  width: 100%;
  padding: var(--space-8) var(--space-16);
  border: none;
  border-radius: 0; /* gli angoli li da' il gruppo */
  background: none;
  box-shadow: none;
  color: var(--text-primary);
  font: inherit;
  font-weight: 400;
  text-align: left;
  text-decoration: none;
  white-space: normal;
  cursor: pointer;
  transform: none;
}

.list-rows__row:hover:not(:disabled) {
  background: var(--state-hover);
}

.list-rows__row:focus-visible {
  outline-offset: -2px;
}

.list-rows__row:disabled {
  color: var(--text-secondary);
  opacity: 1;
  cursor: not-allowed;
}

.list-rows__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.list-rows__help,
.list-rows__note {
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
}

.list-rows__value {
  margin-left: auto;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.list-rows__chevron {
  color: var(--text-secondary);
}

.list-rows__note {
  margin: 0;
}
</style>
