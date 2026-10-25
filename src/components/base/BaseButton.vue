<template>
  <button
    :type="type"
    class="base-button"
    :class="[`base-button--${variant}`, { 'base-button--loading': loading }]"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span class="base-button__label"><slot /></span>
    <span v-if="loading" class="base-button__spinner" aria-hidden="true"></span>
  </button>
</template>

<script setup>
// Bottone base della UI Constitution: un solo primario per regione, il distruttivo
// distinto ma non dominante, e in corso mantiene la larghezza (l'etichetta resta,
// invisibile, sotto lo spinner).
defineProps({
  variant: {
    type: String,
    default: 'secondary',
    validator: (v) => ['primary', 'secondary', 'danger', 'ghost'].includes(v),
  },
  type: { type: String, default: 'button' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
</script>

<style scoped>
.base-button {
  position: relative;
  min-height: 2.5rem;
  padding: var(--space-8) var(--space-16);
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  font-size: var(--font-size-body);
  font-weight: 600;
  box-shadow: none;
}

.base-button--primary {
  background-color: var(--color-accent);
  color: var(--color-text-inverse);
}
.base-button--primary:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
}

.base-button--secondary {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  border-color: var(--color-border-strong);
}
.base-button--secondary:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
}

.base-button--danger {
  background-color: var(--color-danger);
  color: var(--color-text-inverse);
}
.base-button--danger:hover:not(:disabled) {
  background-color: var(--color-danger-hover);
}

.base-button--ghost {
  background-color: transparent;
  color: var(--color-text-secondary);
}
.base-button--ghost:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.base-button--loading .base-button__label {
  visibility: hidden;
}

.base-button__spinner {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--radius-full);
  animation: base-button-spin 0.8s linear infinite;
}

@keyframes base-button-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .base-button__spinner {
    animation-duration: 2.4s;
  }
}
</style>
