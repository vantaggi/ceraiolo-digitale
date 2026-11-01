<template>
  <div class="tabella-scorre">
    <table class="elenco-soci">
      <caption class="sr-only">
        {{
          titolo
        }}
      </caption>
      <thead>
        <tr>
          <th scope="col">Socio</th>
          <th scope="col">Nato/a il</th>
          <th scope="col">Manicchia</th>
          <th scope="col">Quota {{ anno }}</th>
          <th scope="col"><span class="sr-only">Azioni</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="riga in righe" :key="riga.socio.id">
          <th scope="row">
            <RouterLink :to="{ name: 'socio-detail', params: { id: riga.socio.id } }">
              {{ riga.socio.cognome }} {{ riga.socio.nome }}
            </RouterLink>
          </th>
          <td>{{ formatDate(riga.socio.data_nascita) }}</td>
          <td>{{ riga.socio.gruppo_appartenenza || SENZA_MANICCHIA }}</td>
          <td>
            <span class="stato" :class="`stato--${TONI_QUOTA[riga.stato]}`">
              <AppIcon
                v-if="ICONE_TONO[TONI_QUOTA[riga.stato]]"
                :name="ICONE_TONO[TONI_QUOTA[riga.stato]]"
              />
              <!-- Su schermo stretto, dove c'e' l'icona, la parola resta solo per chi legge con lo screen reader -->
              <span :class="{ stato__testo: ICONE_TONO[TONI_QUOTA[riga.stato]] }">{{
                TESTI_STATO_ANNO[riga.stato]
              }}</span>
            </span>
          </td>
          <td class="elenco-soci__azioni">
            <button
              v-if="riga.stato === 'X'"
              type="button"
              class="link-btn"
              :aria-label="`Paga ${anno} per ${riga.socio.cognome} ${riga.socio.nome}`"
              @click="$emit('paga', riga.socio)"
            >
              Paga<span class="paga__anno">{{ anno }}</span>
            </button>
            <button
              type="button"
              class="icona-btn"
              :disabled="generando !== null"
              :aria-busy="generando === riga.socio.id || undefined"
              :aria-label="`Tessera ${anno} di ${riga.socio.cognome} ${riga.socio.nome}`"
              title="Scarica la tessera"
              @click="$emit('tessera', riga.socio)"
            >
              <AppIcon
                :name="generando === riga.socio.id ? 'caricamento' : 'tessera'"
                :spin="generando === riga.socio.id"
              />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
// Righe compatte della pagina Soci: chi e', la quota dell'anno e le due azioni
// rapide (Paga e Tessera). Lo stato della quota viene da payment.js.
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/base/AppIcon.vue'
import { formatDate } from '@/services/export'
import { statoAnno, TESTI_STATO_ANNO } from '@/utils/payment'
import { SENZA_MANICCHIA } from '@/utils/aventiDiritto'

const props = defineProps({
  soci: { type: Array, required: true },
  /** id del socio -> anni pagati */
  anniPagati: { type: Map, required: true },
  anno: { type: Number, required: true },
  /** titolo letto dagli screen reader */
  titolo: { type: String, required: true },
  /** id del socio di cui si sta generando la tessera */
  generando: { type: Number, default: null },
})

defineEmits(['paga', 'tessera'])

// Stato -> tono, come nella scheda del socio: icona e parola, mai il solo colore
const TONI_QUOTA = { V: 'ok', X: 'errore', O: 'neutro', '-': 'neutro' }
const ICONE_TONO = { ok: 'ok', errore: 'errore' }

const righe = computed(() =>
  props.soci.map((socio) => ({
    socio,
    stato: statoAnno(socio, props.anniPagati.get(Number(socio.id)) || [], props.anno),
  })),
)
</script>

<style scoped>
.tabella-scorre {
  position: relative; /* tiene dentro anche le etichette nascoste (.sr-only) */
  overflow-x: auto;
}

.elenco-soci {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-label);
}

.elenco-soci th,
.elenco-soci td {
  padding: var(--space-4) var(--space-12);
  border-bottom: 1px solid var(--border-subtle);
  text-align: left;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.elenco-soci thead th {
  padding-block: var(--space-8) var(--space-4);
  color: var(--text-secondary);
  font-size: var(--font-size-caption);
  font-weight: 600;
}

.elenco-soci tbody th {
  font-size: var(--font-size-body);
  font-weight: 600;
}

.elenco-soci tbody th a {
  color: var(--color-text-primary);
  text-decoration: none;
}

.elenco-soci tbody th a:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.elenco-soci tbody tr:hover {
  background: var(--color-surface-hover);
}

.elenco-soci__azioni {
  text-align: right;
}

.stato {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  font-weight: 600;
}

.stato--ok {
  color: var(--status-success);
}

.stato--errore {
  color: var(--status-error);
}

.icona-btn,
.link-btn {
  vertical-align: middle;
  min-height: 2rem;
  padding: var(--space-4) var(--space-8);
  border: none;
  border-radius: var(--radius-control);
  background: none;
  box-shadow: none;
}

.icona-btn {
  color: var(--color-text-secondary);
}

.link-btn {
  gap: var(--space-4);
  line-height: 1.2;
  color: var(--color-accent);
  font-size: var(--font-size-label);
  font-weight: 600;
}

.icona-btn:hover:not(:disabled),
.link-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

/* Su schermo stretto restano nome, quota e azioni */
@media (max-width: 600px) {
  .elenco-soci th,
  .elenco-soci td {
    padding: var(--space-8) var(--space-4);
  }

  .paga__anno {
    display: none;
  }

  .stato__testo {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  .elenco-soci tbody th {
    white-space: normal;
  }

  .elenco-soci th:nth-child(2),
  .elenco-soci td:nth-child(2),
  .elenco-soci th:nth-child(3),
  .elenco-soci td:nth-child(3) {
    display: none;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
