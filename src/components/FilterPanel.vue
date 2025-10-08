<template>
  <div class="filter-panel">
    <div class="filter-header">
      <h3>🔍 Filtri</h3>
      <button v-if="hasActiveFilters" @click="resetFilters" class="reset-button">✕ Reset</button>
    </div>

    <div class="filter-controls">
      <!-- Filtro Età -->
      <div class="filter-group">
        <label for="age-filter">
          <span class="filter-icon">🎂</span>
          Età
        </label>
        <select
          id="age-filter"
          v-model="localFilters.ageCategory"
          @change="emitFilters"
          class="filter-select"
        >
          <option value="tutti">Tutti</option>
          <option value="maggiorenni">Maggiorenni (18+)</option>
          <option value="minorenni">Minorenni (&lt;18)</option>
        </select>
      </div>

      <!-- Filtro Gruppo -->
      <div class="filter-group">
        <label for="group-filter">
          <span class="filter-icon">👥</span>
          Gruppo
        </label>
        <select
          id="group-filter"
          v-model="localFilters.group"
          @change="emitFilters"
          class="filter-select"
        >
          <option value="Tutti">Tutti i gruppi</option>
          <option v-for="groupName in availableGroups" :key="groupName" :value="groupName">
            {{ groupName }}
          </option>
        </select>
      </div>

      <!-- Indicatore filtri attivi -->
      <div v-if="hasActiveFilters" class="active-filters-badge">
        {{ activeFiltersCount }} filtri attivi
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { getUniqueGroups } from '@/services/db'

// Props per ricevere i valori iniziali dal parent
const props = defineProps({
  initialFilters: {
    type: Object,
    default: () => ({
      ageCategory: 'tutti',
      group: 'Tutti',
    }),
  },
})

// Eventi emessi al parent
const emit = defineEmits(['filters-changed'])

// Stato locale
const availableGroups = ref([])
const localFilters = reactive({
  ageCategory: props.initialFilters.ageCategory,
  group: props.initialFilters.group,
})

// Computed per sapere se ci sono filtri attivi
const hasActiveFilters = computed(() => {
  return localFilters.ageCategory !== 'tutti' || localFilters.group !== 'Tutti'
})

// Conta quanti filtri sono attivi
const activeFiltersCount = computed(() => {
  let count = 0
  if (localFilters.ageCategory !== 'tutti') count++
  if (localFilters.group !== 'Tutti') count++
  return count
})

/**
 * Emette i filtri correnti al componente parent
 */
const emitFilters = () => {
  console.log('FilterPanel: Emetto filtri', localFilters)
  emit('filters-changed', { ...localFilters })
}

/**
 * Resetta tutti i filtri ai valori di default
 */
const resetFilters = () => {
  localFilters.ageCategory = 'tutti'
  localFilters.group = 'Tutti'
  emitFilters()
}

/**
 * Watch sulle props per sincronizzare i valori esterni
 */
watch(
  () => props.initialFilters,
  (newFilters) => {
    if (newFilters) {
      localFilters.ageCategory = newFilters.ageCategory
      localFilters.group = newFilters.group
    }
  },
  { deep: true },
)

/**
 * Carica la lista dei gruppi al mount del componente
 */
onMounted(async () => {
  try {
    availableGroups.value = await getUniqueGroups()
    console.log('Gruppi caricati:', availableGroups.value)
  } catch (error) {
    console.error('Errore nel caricamento dei gruppi:', error)
    availableGroups.value = []
  }
})
</script>

<style scoped>
.filter-panel {
  background-color: var(--color-surface);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 2px solid var(--color-border);
  box-shadow: var(--shadow-md);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filter-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-primary);
}

.reset-button {
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
  background-color: var(--color-text-secondary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-button:hover {
  background-color: var(--color-accent);
  transform: scale(1.05);
}

.filter-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: flex-end;
}

.filter-group {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.filter-icon {
  font-size: 1.2rem;
}

.filter-select {
  padding: 0.75rem;
  border-radius: 8px;
  border: 2px solid var(--color-border);
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-size: 1rem;
  font-family: var(--font-family-body);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: var(--color-primary);
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(183, 28, 28, 0.1);
}

.active-filters-badge {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: var(--color-accent);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 768px) {
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    min-width: 100%;
  }

  .active-filters-badge {
    justify-content: center;
  }
}

/* Animazioni */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-panel {
  animation: slideIn 0.3s ease-out;
}
</style>
