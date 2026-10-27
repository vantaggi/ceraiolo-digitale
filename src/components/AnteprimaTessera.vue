<template>
  <div class="anteprima-tessera">
    <div v-if="!modello" class="anteprima-vuota" :style="dimensioni">
      <AppIcon name="tessera" size="24" />
      <p>Nessuno sfondo caricato.</p>
      <p>Caricalo in Impostazioni &gt; Template Tessera.</p>
    </div>
    <div
      v-else-if="errore"
      class="anteprima-vuota anteprima-errore"
      :style="dimensioni"
      role="alert"
    >
      <AppIcon name="attenzione" size="24" />
      <p>{{ errore }}</p>
    </div>
    <canvas
      v-show="modello && !errore"
      ref="canvas"
      class="anteprima-canvas"
      :class="{ 'in-corso': inCorso }"
      :style="dimensioni"
      role="img"
      :aria-label="`Anteprima della tessera di ${nomeTessera(socio)}`"
    ></canvas>
    <p v-if="modello && !errore" class="anteprima-nota">
      {{
        inCorso ? 'Aggiornamento anteprima...' : "Questa e' la pagina del PDF che verra' generato."
      }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import {
  creaPDFTessere,
  nomeTessera,
  LARGHEZZA_TESSERA_MM,
  ALTEZZA_TESSERA_MM,
} from '@/services/tessere'
import { disegnaPrimaPagina } from '@/services/disegnaPDF'

/**
 * Anteprima della tessera: genera il PDF con la stessa funzione usata per la
 * stampa e ne disegna la pagina. Quello che si vede e' il file vero.
 */
const props = defineProps({
  /** { cognome, nome, data_nascita } */
  socio: { type: Object, required: true },
  /** Sfondo da caricaModelloTessera() o scelto e non ancora salvato; null = nessuno */
  modello: { type: Object, default: null },
})

const canvas = ref(null)
const inCorso = ref(false)
const errore = ref('')
const misure = ref({ larghezzaMm: LARGHEZZA_TESSERA_MM, altezzaMm: ALTEZZA_TESSERA_MM })

const dimensioni = computed(() => ({
  width: `${misure.value.larghezzaMm}mm`,
  height: `${misure.value.altezzaMm}mm`,
}))

let giro = 0
let attesa = null

async function aggiorna() {
  if (!props.modello || !canvas.value) return
  const questo = ++giro
  inCorso.value = true
  try {
    const bytes = await creaPDFTessere([props.socio], props.modello)
    if (questo !== giro) return
    // Disegna su un canvas fuori schermo e copia alla fine: niente sfarfallio
    const appoggio = document.createElement('canvas')
    const m = await disegnaPrimaPagina(bytes, appoggio)
    if (questo !== giro) return
    canvas.value.width = appoggio.width
    canvas.value.height = appoggio.height
    canvas.value.getContext('2d').drawImage(appoggio, 0, 0)
    misure.value = m
    errore.value = ''
  } catch (e) {
    if (questo !== giro) return
    console.error('Anteprima tessera non riuscita:', e)
    errore.value = `Anteprima non riuscita: ${e.message}`
  } finally {
    if (questo === giro) inCorso.value = false
  }
}

// Mentre si scrive il nome l'anteprima si aggiorna con un attimo di ritardo
function aggiornaPresto() {
  clearTimeout(attesa)
  attesa = setTimeout(aggiorna, 250)
}

watch(
  () => props.modello,
  () => {
    errore.value = ''
    aggiorna()
  },
)
watch(() => [props.socio.cognome, props.socio.nome, props.socio.data_nascita], aggiornaPresto)
onMounted(aggiorna)
</script>

<style scoped>
.anteprima-tessera {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
}

.anteprima-canvas {
  display: block;
  box-shadow: var(--shadow-md);
  transition: opacity 0.15s;
}

.anteprima-canvas.in-corso {
  opacity: 0.6;
}

.anteprima-vuota {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-16);
  box-sizing: border-box;
  text-align: center;
  color: var(--color-text-secondary);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-surface);
}

.anteprima-vuota p {
  margin: 0;
}

.anteprima-errore {
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.anteprima-nota {
  margin: 0;
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}
</style>
