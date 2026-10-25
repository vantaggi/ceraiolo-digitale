<template>
  <BaseModal :open="true" title="Operazione non possibile" size="sm" @close="$emit('close')">
    <p class="error-modal__message">{{ message }}</p>
    <template #footer>
      <BaseButton variant="primary" data-autofocus @click="$emit('close')">Ho capito</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import BaseModal from '@/components/base/BaseModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'

defineProps({
  message: { type: String, required: true },
})

defineEmits(['close'])
</script>

<style scoped>
.error-modal__message {
  margin: 0;
  white-space: pre-line;
  line-height: 1.5;
}
</style>
