<template>
  <li class="modello">
    <div class="modello__testo">
      <h3 class="modello__titolo">
        {{ titolo }}
        <span v-if="etichetta" class="modello__etichetta">{{ etichetta }}</span>
      </h3>
      <p class="modello__descrizione">
        <slot name="descrizione">{{ descrizione }}</slot>
      </p>
    </div>
    <div v-if="$slots.opzioni" class="modello__opzioni">
      <slot name="opzioni" />
    </div>
    <div class="modello__azioni">
      <slot name="azioni" />
    </div>
    <div v-if="$slots.default" class="modello__sotto">
      <slot />
    </div>
  </li>
</template>

<script setup>
// Una riga di Report PDF: cosa stampa il modello, le sue scelte e i pulsanti.
// Sotto (slot) quello che il modello mostra dopo l'azione: avanzamento, risultati.
defineProps({
  titolo: { type: String, required: true },
  descrizione: { type: String, default: '' },
  etichetta: { type: String, default: '' },
})
</script>

<style scoped>
.modello {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  grid-template-areas:
    'testo opzioni azioni'
    'sotto sotto sotto';
  align-items: center;
  column-gap: var(--space-24);
  padding: var(--space-16) 0;
  border-bottom: 1px solid var(--color-border);
}

.modello:last-child {
  border-bottom: none;
}

.modello__testo {
  grid-area: testo;
  min-width: 0;
}

.modello__titolo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-8);
  margin: 0;
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text-primary);
}

.modello__etichetta {
  padding: 0 var(--space-8);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-full);
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--color-warning);
}

.modello__descrizione {
  margin: var(--space-4) 0 0;
  font-size: var(--font-size-label);
  color: var(--color-text-secondary);
}

.modello__opzioni {
  grid-area: opzioni;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-8) var(--space-12);
}

.modello__azioni {
  grid-area: azioni;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-8);
}

.modello__sotto {
  grid-area: sotto;
  min-width: 0;
}

.modello__sotto:not(:empty) {
  margin-top: var(--space-12);
}

@media (max-width: 900px) {
  .modello {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'testo'
      'opzioni'
      'azioni'
      'sotto';
    row-gap: var(--space-12);
  }

  .modello__azioni {
    justify-content: flex-start;
  }
}
</style>
