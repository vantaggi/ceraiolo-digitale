<template>
  <component
    :is="icons[name]"
    class="app-icon"
    :class="{ 'app-icon--spin': spin }"
    :size="size"
    :stroke-width="2"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label || undefined"
    :role="label ? 'img' : undefined"
  />
</template>

<script setup>
// Icona Lucide per concetto (vedi icons.js). Decorativa per default: il testo accanto
// dice gia' cosa fa il controllo. Senza testo accanto passare `label`.
import { icons } from './icons'

defineProps({
  name: {
    type: String,
    required: true,
    validator: (v) => v in icons,
  },
  size: { type: [Number, String], default: '1.125em' },
  label: { type: String, default: '' },
  spin: { type: Boolean, default: false },
})
</script>

<style scoped>
.app-icon {
  flex-shrink: 0;
  vertical-align: -0.2em;
}

.app-icon--spin {
  animation: app-icon-spin 1s linear infinite;
}

@keyframes app-icon-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-icon--spin {
    animation-duration: 3s;
  }
}
</style>
