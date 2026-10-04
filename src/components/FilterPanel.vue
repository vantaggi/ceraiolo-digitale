<template>
  <div class="filter-panel">
    <div class="filter-header">
      <h3>
        <BaseIcon name="search" size="20" color="accent" />
        <span>Filtri</span>
      </h3>
      <button v-if="hasActiveFilters" @click="resetFilters" class="reset-button" aria-label="Reimposta tutti i filtri">
        <BaseIcon name="refresh-cw" size="16" />
        <span>Reset</span>
      </button>
    </div>

    <div class="filter-controls">
      <!-- Filtro Età -->
      <div class="filter-group">
        <label for="age-filter">
          <span class="filter-icon"><BaseIcon name="calendar" size="18" color="accent" /></span>
          <span>Età</span>
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
          <span class="filter-icon"><BaseIcon name="users" size="18" color="accent" /></span>
          <span>Gruppo</span>
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
        <BaseIcon name="sliders" size="14" />
        <span>{{ activeFiltersCount === 1 ? '1 filtro attivo' : `${activeFiltersCount} filtri attivi` }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reset-button {
  min-height: 44px;
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  background-color: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.reset-button:hover {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
  transform: scale(1.02);
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
  gap: 0.6rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.filter-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.filter-select {
  padding: 0.75rem 1rem;
  min-height: 44px;
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

.filter-select option {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
}

.active-filters-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.75rem 1rem;
  background-color: var(--color-accent);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
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
