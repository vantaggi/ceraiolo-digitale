<template>
  <header class="page-header">
    <div class="page-header__text">
      <div v-if="backTo || $slots.nav" class="page-header__nav">
        <RouterLink v-if="backTo" :to="backTo" class="page-header__back">
          <AppIcon name="indietro" /> {{ backLabel }}
        </RouterLink>
        <slot name="nav" />
      </div>
      <h1 class="page-header__title">
        <slot name="title">{{ title }}</slot>
      </h1>
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
import AppIcon from '@/components/base/AppIcon.vue'

// Intestazione unica delle pagine: "indietro" sopra il titolo quando serve, titolo
// a sinistra, azione principale a destra. Le azioni restano della pagina (slot).
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  backTo: { type: [String, Object], default: null },
  backLabel: { type: String, default: 'Indietro' },
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-16);
  margin-bottom: var(--space-24);
  padding-bottom: var(--space-16);
  border-bottom: 1px solid var(--color-border);
}

.page-header__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.page-header__nav {
  display: flex;
  align-items: center;
  gap: var(--space-16);
  font-size: var(--font-size-label);
}

.page-header__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  color: var(--color-text-secondary);
  text-decoration: none;
}
.page-header__back:hover {
  color: var(--color-accent);
}

.page-header__title {
  margin: 0;
  font-size: var(--font-size-page-title);
  color: var(--color-text-primary);
}

.page-header__subtitle {
  margin: 0;
  color: var(--color-text-secondary);
}

.page-header__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-8);
}
</style>
