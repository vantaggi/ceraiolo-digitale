<template>
  <nav class="section-tabs" :aria-label="label">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="section-tabs__tab"
      exact-active-class="section-tabs__tab--active"
    >
      <AppIcon v-if="tab.icona" :name="tab.icona" />
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>

<script setup>
import AppIcon from '@/components/base/AppIcon.vue'

defineProps({
  // [{ to, label, icona? }]
  tabs: { type: Array, required: true },
  label: { type: String, required: true },
})
</script>

<style scoped>
.section-tabs {
  display: flex;
  gap: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-24);
  /* Se le schede non stanno in larghezza scorrono di lato, senza tagliarne una. In
     verticale niente scorrimento: con overflow-x auto il browser mette auto anche in
     verticale, e su Windows compariva una barra di scorrimento accanto alle schede. */
  overflow-x: auto;
  overflow-y: hidden;
}

.section-tabs__tab {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-8) var(--space-16);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  flex: none;
  white-space: nowrap;
}

.section-tabs__tab:hover {
  color: var(--color-text-primary);
  background-color: var(--color-surface-hover);
}

.section-tabs__tab--active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

/* Sul telefono via le icone, cosi' tre schede stanno in una riga */
@media (max-width: 600px) {
  .section-tabs__tab {
    padding: var(--space-8);
    font-size: var(--font-size-label);
  }

  .section-tabs__tab :deep(.app-icon) {
    display: none;
  }
}
</style>
