<template>
  <Teleport to="body">
    <div v-if="open" class="base-modal__scrim" @mousedown.self="onScrim">
      <div
        ref="dialogEl"
        class="base-modal"
        :class="`base-modal--${size}`"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <header class="base-modal__header">
          <h2 :id="titleId" class="base-modal__title">{{ title }}</h2>
          <button
            type="button"
            class="base-modal__close"
            aria-label="Chiudi"
            :disabled="busy"
            @click="requestClose"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div class="base-modal__body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="base-modal__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
// Finestra modale base (UI Constitution, Overlays): il fuoco entra all'apertura e torna
// a chi l'ha aperta alla chiusura, Esc e il clic sullo sfondo chiudono, Tab resta dentro.
// Con `busy` (operazione in corso) non si chiude.
import { nextTick, ref, watch, onBeforeUnmount, useId } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  busy: { type: Boolean, default: false },
  closeOnScrim: { type: Boolean, default: true },
})

const emit = defineEmits(['close'])

const titleId = `base-modal-title-${useId()}`
const dialogEl = ref(null)
let returnFocusTo = null

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const focusables = () => Array.from(dialogEl.value?.querySelectorAll(FOCUSABLE) || [])

const requestClose = () => {
  if (!props.busy) emit('close')
}

const onScrim = () => {
  if (props.closeOnScrim) requestClose()
}

const onKeydown = (event) => {
  if (event.key === 'Escape') {
    event.stopPropagation()
    requestClose()
    return
  }
  if (event.key !== 'Tab') return
  const items = focusables()
  if (items.length === 0) {
    event.preventDefault()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

const restoreFocus = () => {
  if (returnFocusTo && typeof returnFocusTo.focus === 'function' && returnFocusTo.isConnected) {
    returnFocusTo.focus()
  }
  returnFocusTo = null
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      returnFocusTo = document.activeElement
      await nextTick()
      const preferred = dialogEl.value?.querySelector('[autofocus], [data-autofocus]')
      // Il primo elemento utile e' il contenuto, non la X di chiusura.
      const target =
        preferred || focusables().find((el) => !el.classList.contains('base-modal__close'))
      ;(target || dialogEl.value)?.focus()
    } else {
      restoreFocus()
    }
  },
  { immediate: true },
)

onBeforeUnmount(restoreFocus)
</script>

<style scoped>
.base-modal__scrim {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-16);
  background-color: var(--color-scrim);
}

.base-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100vh - var(--space-32));
  background-color: var(--color-surface-elevated);
  color: var(--color-text-primary);
  border-radius: var(--radius-overlay);
  box-shadow: var(--shadow-lg);
  outline: none;
}

.base-modal--sm {
  max-width: 28rem;
}
.base-modal--md {
  max-width: 36rem;
}
.base-modal--lg {
  max-width: 52rem;
}

.base-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-16);
  padding: var(--space-16) var(--space-24);
  border-bottom: 1px solid var(--color-border);
}

.base-modal__title {
  margin: 0;
  font-size: var(--font-size-section-heading);
  line-height: 1.3;
}

.base-modal__close {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border-radius: var(--radius-control);
  background-color: transparent;
  color: var(--color-text-secondary);
  box-shadow: none;
}
.base-modal__close:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.base-modal__body {
  padding: var(--space-24);
  overflow-y: auto;
}

.base-modal__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-12);
  padding: var(--space-16) var(--space-24);
  border-top: 1px solid var(--color-border);
}

@media (max-width: 768px) {
  .base-modal__footer {
    flex-direction: column-reverse;
  }
  .base-modal__footer > * {
    width: 100%;
  }
}
</style>
