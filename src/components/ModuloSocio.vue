<template>
  <div class="modulo-socio" :class="{ 'modulo-socio--compatto': compatto }">
    <div class="modulo-socio__campo">
      <label :for="id('cognome')">Cognome</label>
      <input
        :id="id('cognome')"
        :ref="(el) => (campi.cognome = el)"
        v-model="dati.cognome"
        type="text"
        autocomplete="off"
        :disabled="disabilitato"
        v-bind="statoCampo('cognome')"
        @blur="tocca('cognome')"
      />
      <p v-if="errore('cognome')" :id="id('cognome-errore')" class="modulo-socio__errore">
        {{ errore('cognome') }}
      </p>
    </div>

    <div class="modulo-socio__campo">
      <label :for="id('nome')">Nome</label>
      <input
        :id="id('nome')"
        :ref="(el) => (campi.nome = el)"
        v-model="dati.nome"
        type="text"
        autocomplete="off"
        :disabled="disabilitato"
        v-bind="statoCampo('nome')"
        @blur="tocca('nome')"
      />
      <p v-if="errore('nome')" :id="id('nome-errore')" class="modulo-socio__errore">
        {{ errore('nome') }}
      </p>
    </div>

    <div class="modulo-socio__campo">
      <label :for="id('data_nascita')">Data di nascita</label>
      <input
        :id="id('data_nascita')"
        :ref="(el) => (campi.data_nascita = el)"
        v-model="dati.data_nascita"
        type="date"
        :max="oggi"
        :disabled="disabilitato"
        v-bind="statoCampo('data_nascita')"
        @blur="tocca('data_nascita')"
      />
      <p v-if="errore('data_nascita')" :id="id('data_nascita-errore')" class="modulo-socio__errore">
        {{ errore('data_nascita') }}
      </p>
    </div>

    <div class="modulo-socio__campo">
      <label :for="id('luogo_nascita')">Luogo di nascita</label>
      <input
        :id="id('luogo_nascita')"
        :ref="(el) => (campi.luogo_nascita = el)"
        v-model="dati.luogo_nascita"
        type="text"
        :disabled="disabilitato"
        v-bind="statoCampo('luogo_nascita')"
        @blur="tocca('luogo_nascita')"
      />
      <p
        v-if="errore('luogo_nascita')"
        :id="id('luogo_nascita-errore')"
        class="modulo-socio__errore"
      >
        {{ errore('luogo_nascita') }}
      </p>
    </div>

    <div class="modulo-socio__campo">
      <label :for="id('manicchia')"
        >Manicchia <span class="modulo-socio__facoltativo">(facoltativa)</span></label
      >
      <select :id="id('manicchia')" v-model="sceltaManicchia" :disabled="disabilitato">
        <option value="">{{ SENZA_MANICCHIA }}</option>
        <option v-for="m in manicchie" :key="m" :value="m">{{ m }}</option>
        <option :value="NUOVA">Nuova manicchia…</option>
      </select>
    </div>

    <div v-if="sceltaManicchia === NUOVA" class="modulo-socio__campo">
      <label :for="id('nuova-manicchia')">Nome della nuova manicchia</label>
      <input
        :id="id('nuova-manicchia')"
        v-model="nuovaManicchia"
        type="text"
        :disabled="disabilitato"
      />
    </div>

    <div class="modulo-socio__campo">
      <label :for="id('data_prima_iscrizione')">
        Anno di prima iscrizione <span class="modulo-socio__facoltativo">(facoltativo)</span>
      </label>
      <input
        :id="id('data_prima_iscrizione')"
        :ref="(el) => (campi.data_prima_iscrizione = el)"
        v-model="dati.data_prima_iscrizione"
        type="number"
        min="1900"
        :max="annoCorrente + 1"
        :placeholder="String(annoPredefinito)"
        :disabled="disabilitato"
        v-bind="statoCampo('data_prima_iscrizione')"
        @blur="tocca('data_prima_iscrizione')"
      />
      <p
        v-if="errore('data_prima_iscrizione')"
        :id="id('data_prima_iscrizione-errore')"
        class="modulo-socio__errore"
      >
        {{ errore('data_prima_iscrizione') }}
      </p>
      <p v-else class="modulo-socio__aiuto">Se lo lasci vuoto vale {{ annoPredefinito }}.</p>
    </div>

    <div class="modulo-socio__campo modulo-socio__campo--largo">
      <label :for="id('note')"
        >Note <span class="modulo-socio__facoltativo">(facoltative)</span></label
      >
      <textarea :id="id('note')" v-model="dati.note" rows="2" :disabled="disabilitato"></textarea>
    </div>

    <div
      v-if="omonimi.length > 0"
      class="modulo-socio__omonimi modulo-socio__campo--largo"
      role="status"
    >
      <AppIcon name="attenzione" />
      <div>
        <p>
          {{
            omonimi[0].stessaData
              ? 'Esiste già un socio con lo stesso nome e la stessa data di nascita:'
              : "In archivio c'è già un socio con lo stesso nome:"
          }}
        </p>
        <ul>
          <li v-for="o in omonimi" :key="o.socio.id">
            <RouterLink :to="{ name: 'socio-detail', params: { id: o.socio.id } }" target="_blank">
              {{ o.socio.cognome }} {{ o.socio.nome }}, nato/a il
              {{ formatDate(o.socio.data_nascita) }}
            </RouterLink>
          </li>
        </ul>
        <p>Controlla che non sia la stessa persona prima di salvare.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Campi di un nuovo socio, con gli errori scritti accanto al campo. Lo usano la
// pagina Nuovo socio e Incassi › Registra ricevute; le regole sono in utils/socio.js.
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/base/AppIcon.vue'
import { formatDate } from '@/services/export'
import { SENZA_MANICCHIA } from '@/utils/aventiDiritto'
import { trovaOmonimi, validaSocio } from '@/utils/socio'

const dati = defineModel('dati', { type: Object, required: true })

const props = defineProps({
  /** prefisso degli id dei campi, per avere piu' moduli nella stessa app */
  idPrefisso: { type: String, default: 'socio' },
  manicchie: { type: Array, default: () => [] },
  /** soci gia' in archivio, per avvisare degli omonimi */
  soci: { type: Array, default: () => [] },
  /** anno usato se la prima iscrizione resta vuota */
  annoPredefinito: { type: Number, default: () => new Date().getFullYear() },
  /** dopo un tentativo di salvataggio mostra tutti gli errori, non solo dei campi toccati */
  mostraErrori: { type: Boolean, default: false },
  compatto: { type: Boolean, default: false },
  disabilitato: { type: Boolean, default: false },
})

const NUOVA = '__nuova__'
const oggi = new Date().toISOString().split('T')[0]
const annoCorrente = new Date().getFullYear()
const campi = {}
const toccati = reactive(new Set())

const id = (campo) => `${props.idPrefisso}-${campo}`
const errori = computed(() => validaSocio(dati.value))
const errore = (campo) => (props.mostraErrori || toccati.has(campo) ? errori.value[campo] : '')
const statoCampo = (campo) => ({
  'aria-invalid': errore(campo) ? 'true' : undefined,
  'aria-describedby': errore(campo) ? id(`${campo}-errore`) : undefined,
})
// Uscire da un campo vuoto non lo segnala: l'errore comparirebbe mentre il mouse e'
// premuto su Salva o Annulla, il bottone si sposterebbe e il clic andrebbe perso.
// I campi obbligatori vuoti si segnalano al tentativo di salvataggio (mostraErrori).
const tocca = (campo) => {
  if (String(dati.value[campo] ?? '').trim()) toccati.add(campo)
}

const omonimi = computed(() => trovaOmonimi(dati.value, props.soci))

// Manicchia: una di quelle esistenti, nessuna, o una nuova scritta a mano
const sceltaManicchia = ref(dati.value.gruppo_appartenenza || '')
const nuovaManicchia = ref('')
watch([sceltaManicchia, nuovaManicchia], ([scelta, nuova]) => {
  dati.value.gruppo_appartenenza = scelta === NUOVA ? nuova.trim() : scelta
})
watch(
  () => dati.value.gruppo_appartenenza,
  (valore) => {
    // Il genitore ha svuotato il modulo
    if (!valore && sceltaManicchia.value !== NUOVA) sceltaManicchia.value = ''
  },
)

/** Porta il cursore sul primo campo sbagliato; true se ce n'e' uno. */
const vaiAlPrimoErrore = () => {
  const primo = Object.keys(campi).find((c) => errori.value[c])
  if (primo) campi[primo]?.focus()
  return Boolean(primo)
}

/** Svuota anche lo stato interno (campi toccati, nuova manicchia). */
const azzera = () => {
  toccati.clear()
  sceltaManicchia.value = ''
  nuovaManicchia.value = ''
}

const primoCampo = () => campi.cognome?.focus()

defineExpose({
  vaiAlPrimoErrore,
  azzera,
  primoCampo,
  valido: computed(() => Object.keys(errori.value).length === 0),
})
</script>

<style scoped>
.modulo-socio {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-16) var(--space-24);
}

.modulo-socio--compatto {
  gap: var(--space-12) var(--space-16);
}

.modulo-socio__campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.modulo-socio__campo--largo {
  grid-column: 1 / -1;
}

.modulo-socio label {
  font-size: var(--font-size-label);
  font-weight: 600;
  color: var(--color-text-primary);
}

.modulo-socio__facoltativo {
  font-weight: 400;
  color: var(--color-text-secondary);
}

.modulo-socio input,
.modulo-socio select,
.modulo-socio textarea {
  margin: 0;
}

.modulo-socio [aria-invalid='true'] {
  border-color: var(--color-danger);
}

.modulo-socio__errore,
.modulo-socio__aiuto {
  margin: 0;
  font-size: var(--font-size-caption);
}

.modulo-socio__errore {
  color: var(--color-danger);
  font-weight: 600;
}

.modulo-socio__aiuto {
  color: var(--color-text-secondary);
}

.modulo-socio__omonimi {
  display: flex;
  gap: var(--space-12);
  padding: var(--space-12) var(--space-16);
  border-left: 3px solid var(--color-warning);
  border-radius: var(--radius-control);
  background: var(--color-surface-hover);
  font-size: var(--font-size-label);
}

.modulo-socio__omonimi p,
.modulo-socio__omonimi ul {
  margin: 0;
}

.modulo-socio__omonimi ul {
  padding-left: var(--space-16);
  margin: var(--space-4) 0;
}

@media (max-width: 600px) {
  .modulo-socio {
    grid-template-columns: 1fr;
  }
}
</style>
