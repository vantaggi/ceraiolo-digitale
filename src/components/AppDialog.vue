<template>
  <BaseModal
    :open="dialogState.open"
    :title="dialogState.title"
    size="sm"
    @close="closeDialog(false)"
  >
    <form :id="formId" @submit.prevent="closeDialog(true)">
      <p v-if="dialogState.message" class="app-dialog__message">{{ dialogState.message }}</p>
      <label v-if="dialogState.kind === 'text'" class="app-dialog__field">
        <span class="app-dialog__label">{{ dialogState.label }}</span>
        <input
          v-model="dialogState.value"
          type="text"
          :placeholder="dialogState.placeholder"
          data-autofocus
        />
      </label>
    </form>
    <template #footer>
      <BaseButton variant="secondary" @click="closeDialog(false)">
        {{ dialogState.cancelLabel }}
      </BaseButton>
      <BaseButton
        type="submit"
        :form="formId"
        :variant="dialogState.danger ? 'danger' : 'primary'"
        :data-autofocus="dialogState.kind === 'confirm' && !dialogState.danger ? '' : undefined"
      >
        {{ dialogState.confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
// Il dialogo unico che sostituisce confirm() e prompt() del browser (vedi useDialog.js).
// Per le conferme distruttive il fuoco parte da "Annulla": Invio per sbaglio non cancella.
import { useId } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { dialogState, closeDialog } from '@/composables/useDialog'

const formId = `app-dialog-${useId()}`
</script>

<style scoped>
.app-dialog__message {
  margin: 0;
  white-space: pre-line;
  color: var(--color-text-primary);
  line-height: 1.5;
}

.app-dialog__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin-top: var(--space-16);
}

.app-dialog__message + .app-dialog__field {
  margin-top: var(--space-16);
}

.app-dialog__field:first-child {
  margin-top: 0;
}

.app-dialog__label {
  font-size: var(--font-size-label);
  font-weight: 600;
}
</style>
