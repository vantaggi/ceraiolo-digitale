<template>
  <!-- La regione resta sempre nel documento: i lettori di schermo annunciano con calma
       la scritta quando compare, senza spostare il fuoco. -->
  <span role="status" class="aggiornamento">
    <button
      v-if="pronta"
      type="button"
      class="aggiornamento__azione"
      title="Ricarica l'app con la versione nuova. I dati restano."
      @click="ricarica"
    >
      <AppIcon name="ricarica" /> Nuova versione pronta · Ricarica
    </button>
  </span>
</template>

<script setup>
// Riga di stato "Nuova versione pronta" (scelta 1A delle bozze della PR 7): accanto allo
// stato del backup, mai una finestra, mai un ricaricamento senza la scelta della persona.
import AppIcon from '@/components/base/AppIcon.vue'
import { useAggiornamento } from '@/composables/useAggiornamento'

const { pronta, ricarica } = useAggiornamento()
</script>

<style scoped>
.aggiornamento__azione {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--status-info);
  border-radius: var(--radius-control);
  background-color: transparent;
  color: var(--status-info);
  font-size: var(--font-size-caption);
  font-weight: 600;
  white-space: nowrap;
  box-shadow: none;
  transform: none;
  cursor: pointer;
}

.aggiornamento__azione:hover {
  background-color: var(--state-hover);
}
</style>
