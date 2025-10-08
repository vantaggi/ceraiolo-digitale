<template>
  <div class="socio-card">
    <div class="socio-info">
      <h3>{{ socio.cognome }} {{ socio.nome }}</h3>
      <p>Nato/a il: {{ socio.data_nascita }} a {{ socio.luogo_nascita }}</p>
      <p>Gruppo: {{ socio.gruppo_appartenenza }}</p>
    </div>
    <div class="socio-actions">
      <!-- Use RouterLink to navigate to the detail page with the correct ID -->
      <RouterLink :to="{ name: 'socio-detail', params: { id: socio.id } }" class="details-button">
        Vedi Dettagli
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  socio: {
    type: Object,
    required: true,
  },
})
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

.details-button {
  display: inline-block;
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
}

.details-button:hover {
  background-color: #c62828;
}
</style>
