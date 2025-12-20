<template>
  <div class="age-category-filter">
    <select
      :id="id"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      class="form-input"
    >
      <option value="tutti">Tutti</option>
      <option value="maggiorenni">Maggiorenni (18+)</option>
      <option value="minorenni">Minorenni (&lt;18)</option>
    </select>
  </div>
</template>

<script setup>
defineProps({
  id: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: 'Categoria Età:',
  },
  modelValue: {
    type: String,
    default: 'tutti',
  },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.age-category-filter {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.form-input {
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  font-family: var(--font-family-body);
  transition: border-color 0.2s;
  background-color: var(--color-background);
  color: var(--color-text-primary);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
}
</style>
