<template>
  <div class="filter-panel">
    <div class="filter-group">
      <label for="age-filter">Età</label>
      <select id="age-filter" v-model="localFilters.ageCategory" @change="emitFilters">
        <option value="tutti">Tutti</option>
        <option value="maggiorenni">Maggiorenni</option>
        <option value="minorenni">Minorenni</option>
      </select>
    </div>
    <div class="filter-group">
      <label for="group-filter">Gruppo</label>
      <select id="group-filter" v-model="localFilters.group" @change="emitFilters">
        <option value="Tutti">Tutti</option>
        <option v-for="groupName in availableGroups" :key="groupName" :value="groupName">
          {{ groupName }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getUniqueGroups } from '@/services/db'

const availableGroups = ref([])

// Use a reactive object for the filters
const localFilters = reactive({
  ageCategory: 'tutti',
  group: 'Tutti',
})

// Define the event that this component will emit
const emit = defineEmits(['filters-changed'])

// Function to emit the current filters to the parent component
const emitFilters = () => {
  emit('filters-changed', localFilters)
}

// Fetch the list of groups when the component is created
onMounted(async () => {
  availableGroups.value = await getUniqueGroups()
})
</script>

<style scoped>
.filter-panel {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background-color: var(--color-surface);
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid var(--color-border);
}
.filter-group {
  display: flex;
  flex-direction: column;
}
.filter-group label {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
}
.filter-group select {
  padding: 0.5rem;
  border-radius: 5px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  font-size: 1rem;
}
</style>
