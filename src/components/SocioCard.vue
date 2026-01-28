<template>
  <div class="socio-card">
    <div class="socio-info">
      <h3>{{ socio.cognome }} {{ socio.nome }}</h3>
      <p>Nato/a il: {{ socio.data_nascita }} a {{ socio.luogo_nascita }}</p>
      <p>Gruppo: {{ socio.gruppo_appartenenza }}</p>
    </div>
    <div class="socio-actions">
      <button
        v-if="!isRenewed"
        @click="$emit('quick-renew', socio)"
        class="renew-button"
        title="Rinnova Velocemente"
      >
        ⚡
      </button>
      <RouterLink :to="{ name: 'socio-detail', params: { id: socio.id } }" class="details-button">
        Vedi Dettagli
      </RouterLink>
      <button @click="$emit('generate-card', socio)" class="card-button">🎫 Genera Tessera</button>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { ref, onMounted, watch } from 'vue'
import { getTesseramentiBySocioId } from '@/services/db'

const props = defineProps({
  socio: {
    type: Object,
    required: true,
  },
})

defineEmits(['generate-card', 'quick-renew'])

const isRenewed = ref(false)
const currentYear = new Date().getFullYear()

const checkRenewal = async () => {
    try {
        const tesseramenti = await getTesseramentiBySocioId(props.socio.id)
        isRenewed.value = tesseramenti.some(t => t.anno === currentYear)
    } catch (e) {
        console.error("Error checking renewal", e)
    }
}

onMounted(checkRenewal)
watch(() => props.socio, checkRenewal)
</script>

<style scoped>
.socio-card {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  background-color: var(--color-surface);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
}
.socio-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}
.socio-info p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.socio-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap; /* Handle mobile */
}

.details-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-family: var(--font-family-body);
  font-weight: 500;
  font-size: 1rem;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  transition:
    background-color 0.2s,
    transform 0.1s;
  box-shadow: var(--shadow-sm); /* Match buttons */
}

.details-button:hover {
  background-color: var(--color-accent-hover);
}

.card-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-family: var(--font-family-body);
  font-weight: 500;
  font-size: 1rem;
  background-color: var(--color-success);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  transition:
    background-color 0.2s,
    transform 0.1s;
}

.card-button:hover {
  background-color: #1b5e20; /* Keep or improve if needed, but let's align opacity/transform */
  filter: brightness(0.9);
}

.renew-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  font-size: 1.2rem;
  background-color: var(--color-warning); /* Use theme warning (orange) */
  color: white; /* Contrast for orange */
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
}

.renew-button:hover {
    transform: scale(1.1);
    background-color: #e65100; /* Darker shade of warning #ed6c02 */
}
</style>
