<template>
  <BaseModal
    :open="isVisible"
    :title="title || 'Eliminare il socio?'"
    size="sm"
    :busy="isDeleting"
    @close="closeModal"
  >
    <p v-if="message" class="confirm-delete__message">{{ message }}</p>
    <template v-else>
      <p class="confirm-delete__message">
        Il socio <strong>{{ socioName }}</strong> viene eliminato insieme a tutti i suoi pagamenti.
      </p>
      <p class="confirm-delete__consequence">L'operazione non si annulla.</p>
    </template>

    <template #footer>
      <BaseButton variant="secondary" :disabled="isDeleting" @click="closeModal"
        >Annulla</BaseButton
      >
      <BaseButton variant="danger" :loading="isDeleting" @click="confirmDelete">
        {{ confirmLabel || (message ? 'Elimina' : 'Elimina socio') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  socioName: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  confirmLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'confirm'])

const isDeleting = ref(false)

// Alla riapertura la modale riparte pronta, anche se l'eliminazione precedente era fallita.
watch(
  () => props.isVisible,
  (visible) => {
    if (!visible) isDeleting.value = false
  },
)

const closeModal = () => {
  if (!isDeleting.value) emit('close')
}

const confirmDelete = () => {
  isDeleting.value = true
  emit('confirm')
}
</script>

<style scoped>
.confirm-delete__message {
  margin: 0;
  white-space: pre-line;
  line-height: 1.5;
}

.confirm-delete__consequence {
  margin: var(--space-12) 0 0;
  color: var(--color-text-secondary);
}
</style>
