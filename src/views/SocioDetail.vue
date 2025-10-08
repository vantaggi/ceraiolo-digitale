<template>
  <div class="detail-page">
    <h2>Dettaglio Socio</h2>
    <div v-if="socio" class="detail-card">
      <h3>{{ socio.cognome }} {{ socio.nome }}</h3>
      <p><strong>Data di nascita:</strong> {{ formatDate(socio.data_nascita) }}</p>
      <p><strong>Luogo di nascita:</strong> {{ socio.luogo_nascita }}</p>
      <p><strong>Gruppo:</strong> {{ socio.gruppo_appartenenza }}</p>
      <p><strong>Data prima iscrizione:</strong> {{ socio.data_prima_iscrizione }}</p>
      <p><strong>Numero tesseramenti:</strong> {{ socio.tesseramenti?.length ?? 0 }}</p>
    </div>
    <div v-else class="loading">Caricamento...</div>
    <router-link to="/" class="back-link">← Torna alla lista</router-link>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/services/db'

const route = useRoute()
const socio = ref(null)

const formatDate = (dateString) => {
  if (!dateString) return 'Non disponibile'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

onMounted(async () => {
  const id = Number(route.params.id)
  if (!isNaN(id)) {
    socio.value = await db.soci.get(id)
  }
})
</script>

<style scoped>
.detail-page {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
}
.detail-card {
  background: var(--color-surface);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  border: 2px solid var(--color-border);
}
.back-link {
  display: inline-block;
  margin-top: 1rem;
  color: var(--color-accent);
  text-decoration: none;
}
.back-link:hover {
  text-decoration: underline;
}
</style>
