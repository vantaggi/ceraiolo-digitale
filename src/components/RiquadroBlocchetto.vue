<template>
  <section class="blocchetto" aria-labelledby="blocchetto-titolo">
    <h2 id="blocchetto-titolo" class="blocchetto__titolo">
      <AppIcon name="blocchetto" /> Blocchetto {{ numero }}
      <span v-if="intervallo" class="blocchetto__intervallo">
        ricevute {{ intervallo.da }}–{{ intervallo.a }}
      </span>
    </h2>

    <p v-if="ricevutaFuori" class="blocchetto__nota blocchetto__nota--attenzione" role="status">
      <AppIcon name="attenzione" />
      La ricevuta {{ ricevutaCorrente }} non è del blocchetto {{ numero }}: controlla i due numeri.
    </p>

    <p v-if="errore" class="blocchetto__nota blocchetto__nota--errore" role="alert">
      <AppIcon name="errore" /> {{ errore }}
    </p>
    <p v-else-if="!riepilogo" class="blocchetto__nota">
      <AppIcon name="caricamento" :spin="true" /> Carico le ricevute del blocchetto...
    </p>
    <p v-else-if="riepilogo.ricevute === 0" class="blocchetto__nota">
      Nessuna ricevuta ancora inserita in questo blocchetto.
    </p>
    <template v-else>
      <dl class="blocchetto__numeri">
        <div>
          <dt>Ricevute</dt>
          <dd>
            {{ intervallo ? riepilogo.ricevute - riepilogo.fuori.length : riepilogo.ricevute }}
            <span v-if="intervallo" class="blocchetto__dettaglio">
              su {{ intervallo.a - intervallo.da + 1 }}
            </span>
            <span v-else class="blocchetto__dettaglio">
              (dalla {{ riepilogo.prima }} alla {{ riepilogo.ultima }})
            </span>
          </dd>
        </div>
        <div>
          <dt>Soci</dt>
          <dd>{{ riepilogo.soci }}</dd>
        </div>
        <div>
          <dt>Incassato</dt>
          <dd>€ {{ euro(riepilogo.incassato) }}</dd>
        </div>
      </dl>

      <div v-if="riepilogo.mancanti.length > 0" class="blocchetto__mancanti">
        <p class="blocchetto__nota">
          {{
            riepilogo.mancanti.length === 1
              ? 'Saltata 1 ricevuta'
              : `Saltate ${riepilogo.mancanti.length} ricevute`
          }}
          prima dell'ultima inserita:
        </p>
        <ul class="blocchetto__elenco">
          <li v-for="r in mancantiVisibili" :key="r">
            <button
              type="button"
              class="blocchetto__ricevuta"
              :aria-current="r === ricevutaCorrente ? 'true' : undefined"
              :aria-label="`Vai alla ricevuta ${r}`"
              :disabled="disabilitato"
              @click="emit('vai', r)"
            >
              {{ r }}
            </button>
          </li>
        </ul>
        <p v-if="altreMancanti > 0" class="blocchetto__nota">e altre {{ altreMancanti }}</p>
      </div>
      <p v-else class="blocchetto__nota blocchetto__nota--ok">
        <AppIcon name="ok" /> Nessun buco nella numerazione.
      </p>

      <p v-if="riepilogo.daInserire" class="blocchetto__nota">
        <template v-if="riepilogo.daInserire.da === riepilogo.daInserire.a">
          Da inserire: la {{ riepilogo.daInserire.da }}.
        </template>
        <template v-else>
          Da inserire: dalla {{ riepilogo.daInserire.da }} alla {{ riepilogo.daInserire.a }}.
        </template>
      </p>
      <p v-else-if="intervallo" class="blocchetto__nota blocchetto__nota--ok">
        <AppIcon name="ok" /> Blocchetto arrivato all'ultima ricevuta.
      </p>

      <p v-if="riepilogo.fuori.length > 0" class="blocchetto__nota blocchetto__nota--attenzione">
        <AppIcon name="attenzione" />
        {{ riepilogo.fuori.length === 1 ? 'Una ricevuta registrata' : `${riepilogo.fuori.length} ricevute registrate` }}
        con questo blocchetto {{ riepilogo.fuori.length === 1 ? 'ha' : 'hanno' }} un numero fuori dal
        blocchetto: {{ fuoriVisibili }}.
      </p>
      <p v-if="riepilogo.senzaRicevuta > 0" class="blocchetto__nota">
        {{ riepilogo.senzaRicevuta }}
        {{ riepilogo.senzaRicevuta === 1 ? 'pagamento' : 'pagamenti' }} senza numero di ricevuta.
      </p>
    </template>

    <div class="blocchetto__azioni">
      <BaseButton
        v-if="riprendiDa !== null && riprendiDa !== ricevutaCorrente"
        variant="ghost"
        :disabled="disabilitato"
        @click="emit('vai', riprendiDa)"
      >
        <AppIcon name="successivo" /> Riprendi dalla ricevuta {{ riprendiDa }}
      </BaseButton>
      <BaseButton :disabled="disabilitato" @click="emit('successivo')">
        <AppIcon name="blocchetto" /> Passa al blocchetto {{ numero + 1 }}
      </BaseButton>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { ricevutaDaCuiRiprendere } from '@/utils/blocchetto'

// Il blocchetto che si sta ricopiando: cosa e' gia' inserito, i buchi nella
// numerazione (con un clic si va alla ricevuta), cosa resta da inserire, i numeri
// fuori dal blocchetto e il passaggio al blocchetto dopo.
const MOSTRATE = 30

const props = defineProps({
  numero: { type: Number, required: true },
  riepilogo: { type: Object, default: null },
  errore: { type: String, default: '' },
  ricevutaCorrente: { type: Number, default: null },
  disabilitato: { type: Boolean, default: false },
})
const emit = defineEmits(['vai', 'successivo'])

const intervallo = computed(() => props.riepilogo?.intervallo ?? null)
const ricevutaFuori = computed(
  () =>
    intervallo.value !== null &&
    props.ricevutaCorrente !== null &&
    (props.ricevutaCorrente < intervallo.value.da || props.ricevutaCorrente > intervallo.value.a),
)
const riprendiDa = computed(() => (props.riepilogo ? ricevutaDaCuiRiprendere(props.riepilogo) : null))
const fuoriVisibili = computed(() => {
  const fuori = props.riepilogo.fuori
  return fuori.slice(0, 10).join(', ') + (fuori.length > 10 ? ` e altre ${fuori.length - 10}` : '')
})
const mancantiVisibili = computed(() => props.riepilogo.mancanti.slice(0, MOSTRATE))
const altreMancanti = computed(() => Math.max(0, props.riepilogo.mancanti.length - MOSTRATE))
const euro = (valore) => Number(valore || 0).toFixed(2)
</script>

<style scoped>
.blocchetto {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  padding: var(--space-16) var(--space-24);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-surface);
}

.blocchetto__titolo {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin: 0;
  font-size: var(--font-size-section-heading);
}

.blocchetto__numeri {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: var(--space-12);
  margin: 0;
}

.blocchetto__numeri dt {
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.blocchetto__numeri dd {
  margin: 0;
  font-size: var(--font-size-section-heading);
  font-weight: 600;
  color: var(--color-text-primary);
}

.blocchetto__dettaglio {
  display: block;
  font-size: var(--font-size-caption);
  font-weight: 400;
  color: var(--color-text-secondary);
}

.blocchetto__nota {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin: 0;
  font-size: var(--font-size-label);
  color: var(--color-text-secondary);
}

.blocchetto__nota--ok {
  color: var(--color-success);
}

.blocchetto__nota--errore {
  color: var(--color-danger);
}

.blocchetto__nota--attenzione {
  color: var(--color-text-primary);
  padding: var(--space-8) var(--space-12);
  border-left: 3px solid var(--color-warning);
  background: var(--color-surface-hover);
}

.blocchetto__intervallo {
  margin-left: auto;
  font-family: var(--font-family-body);
  font-size: var(--font-size-label);
  font-weight: 400;
  color: var(--color-text-secondary);
}

.blocchetto__mancanti {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.blocchetto__elenco {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.blocchetto__ricevuta {
  min-width: 2.5rem;
  min-height: 2rem;
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-control);
  background: none;
  box-shadow: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-label);
  font-weight: 600;
}

.blocchetto__ricevuta:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.blocchetto__ricevuta[aria-current='true'] {
  background: var(--color-warning);
  color: var(--color-text-inverse);
}

.blocchetto__azioni {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
}
</style>
