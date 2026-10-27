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
  margin-bottom: -1px;
}

.section-tabs__tab:hover {
  color: var(--color-text-primary);
  background-color: var(--color-surface-hover);
}

.section-tabs__tab--active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}
</style>
