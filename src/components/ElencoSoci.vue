<template>
  <div class="tabella-scorre">
    <table class="elenco-soci">
      <caption class="sr-only">{{ titolo }}</caption>
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
            <span class="stato" :class="`stato--${CLASSI_QUOTA[riga.stato]}`">
              <span aria-hidden="true">{{ riga.stato }}</span>
              <span class="stato__testo">{{ TESTI_QUOTA[riga.stato] }}</span>
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
              Paga<span class="paga__anno"> {{ anno }}</span>
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
import { statoAnno } from '@/utils/payment'
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

const TESTI_QUOTA = { V: 'Pagata', X: 'Da pagare', O: 'Esente', '-': 'Non iscritto' }
const CLASSI_QUOTA = { V: 'ok', X: 'errore', O: 'attenzione', '-': 'neutro' }

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
  padding: var(--space-8) var(--space-12);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  white-space: nowrap;
}

.elenco-soci thead th {
  color: var(--color-text-secondary);
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
  gap: var(--space-8);
  font-weight: 600;
}

.stato > span[aria-hidden] {
  display: inline-grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--radius-control);
  color: var(--color-text-inverse);
  background: var(--color-text-secondary);
  font-size: var(--font-size-caption);
}

.stato--ok > span[aria-hidden] {
  background: var(--color-success);
}

.stato--attenzione > span[aria-hidden] {
  background: var(--color-warning);
}

.stato--errore > span[aria-hidden] {
  background: var(--color-danger);
}

.stato--errore {
  color: var(--color-danger);
}

.icona-btn,
.link-btn {
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
  color: var(--color-accent);
  font-size: var(--font-size-label);
  font-weight: 600;
}

.icona-btn:hover:not(:disabled),
.link-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

/* Su schermo stretto restano nome, quota (solo la lettera) e azioni */
@media (max-width: 600px) {
  .elenco-soci th,
  .elenco-soci td {
    padding: var(--space-8) var(--space-4);
  }

  .paga__anno {
    display: none;
  }

  .elenco-soci tbody th {
    white-space: normal;
  }

  .stato__testo {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
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
