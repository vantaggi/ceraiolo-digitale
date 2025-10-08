<template>
  <div class="socio-card">
    <div class="socio-info">
      <h3>{{ socio.cognome }} {{ socio.nome }}</h3>
      <p>Nato/a il: {{ socio.data_nascita }} a {{ socio.luogo_nascita }}</p>
      <p>Gruppo: {{ socio.gruppo_appartenenza }}</p>
    </div>
    <div class="socio-actions">
      <!-- We add the 'accent' class to make this button red -->
      <button class="accent">Vedi Dettagli</button>
    </div>
  </div>
</template>

<script setup>
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
/* No special button styles needed here anymore, they are global! */
</style>
