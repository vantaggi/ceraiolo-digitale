<template>
  <div class="socio-card">
    <div class="socio-info">
      <h3>{{ socio.cognome }} {{ socio.nome }}</h3>
      <p>Nato/a il: {{ socio.data_nascita }} a {{ socio.luogo_nascita }}</p>
      <p>Gruppo: {{ socio.gruppo_appartenenza }}</p>
    </div>
    <div class="socio-actions">
      <button>Vedi Dettagli</button>
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
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #333;
  border-radius: 8px;
  margin-bottom: 1rem;
  background-color: #2a2a2a;
}
.socio-info h3 {
  margin: 0 0 0.5rem 0;
  color: #e0e0e0;
}
.socio-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #aaa;
}
.socio-actions button {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>
