<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import SectionTabs from '@/components/base/SectionTabs.vue'
import { SCHEDE_INCASSI } from '@/router/sezioni'
import { db, exportAllTesseramenti } from '@/services/db'
import { dataItaliana } from '@/utils/data'
import { anniConPagamenti, filtraPagamenti, totaliPagamenti } from '@/utils/pagamenti'

// Righe mostrate per volta: con molti soci un anno ha migliaia di pagamenti
const PER_PAGINA = 200

const tesseramenti = ref([])
const soci = ref(new Map())
const caricamento = ref(true)
const errore = ref('')

const anno = ref('')
const blocchetto = ref('')
const testo = ref('')
const mostrate = ref(PER_PAGINA)

onMounted(caricaDati)

async function caricaDati() {
  caricamento.value = true
  errore.value = ''
  try {
    const [pagamenti, elencoSoci] = await Promise.all([exportAllTesseramenti(), db.soci.toArray()])
    tesseramenti.value = pagamenti
    soci.value = new Map(elencoSoci.map((s) => [s.id, s]))
    // Si parte dall'anno in corso, o dall'ultimo con pagamenti
    const anni = anniConPagamenti(pagamenti)
    const corrente = new Date().getFullYear()
    anno.value = anni.includes(corrente) ? corrente : (anni[0] ?? '')
  } catch (e) {
    console.error('Pagamenti non letti:', e)
    errore.value = 'Non sono riuscito a leggere i pagamenti.'
  } finally {
    caricamento.value = false
  }
}

const anni = computed(() => anniConPagamenti(tesseramenti.value))
const righe = computed(() =>
  filtraPagamenti(tesseramenti.value, soci.value, {
    anno: anno.value,
    blocchetto: blocchetto.value,
    testo: testo.value,
  }),
)
const totali = computed(() => totaliPagamenti(righe.value))
const visibili = computed(() => righe.value.slice(0, mostrate.value))
const filtriAttivi = computed(() => Boolean(blocchetto.value || testo.value.trim()))

watch([anno, blocchetto, testo], () => {
  mostrate.value = PER_PAGINA
})

const azzera = () => {
  blocchetto.value = ''
  testo.value = ''
}

const euro = (valore) => Number(valore || 0).toFixed(2)
const data = (iso) => dataItaliana(iso, '—')
</script>

<template>
  <div class="pagamenti">
    <PageHeader title="Incassi" subtitle="I pagamenti registrati, anno per anno" />
    <SectionTabs :tabs="SCHEDE_INCASSI" label="Schede di Incassi" />

    <section class="pannello" aria-labelledby="titolo-pagamenti">
      <h2 id="titolo-pagamenti" class="sr-only">Pagamenti</h2>

      <div class="filtri">
        <div class="campo">
          <label for="pagamenti-anno">Anno della quota</label>
          <select id="pagamenti-anno" v-model="anno" :disabled="caricamento">
            <option value="">Tutti gli anni</option>
            <option v-for="a in anni" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
        <div class="campo campo--stretto">
          <label for="pagamenti-blocchetto">Blocchetto</label>
          <input
            id="pagamenti-blocchetto"
            v-model="blocchetto"
            type="number"
            min="1"
            placeholder="Tutti"
            :disabled="caricamento"
          />
        </div>
        <div class="campo campo--largo">
          <label for="pagamenti-cerca">Cerca</label>
          <input
            id="pagamenti-cerca"
            v-model="testo"
            type="search"
            placeholder="Nome del socio o numero di ricevuta"
            :disabled="caricamento"
          />
        </div>
        <BaseButton v-if="filtriAttivi" variant="ghost" @click="azzera">Azzera</BaseButton>
      </div>

      <p v-if="caricamento" class="vuoto" role="status">
        <AppIcon name="caricamento" /> Carico i pagamenti…
      </p>
      <p v-else-if="errore" class="vuoto vuoto--errore" role="alert">
        <AppIcon name="errore" /> {{ errore }}
        <BaseButton @click="caricaDati">Riprova</BaseButton>
      </p>
      <template v-else>
        <dl class="totali" aria-live="polite">
          <div>
            <dt>Pagamenti</dt>
            <dd data-totale="pagamenti">{{ totali.pagamenti }}</dd>
          </div>
          <div>
            <dt>Soci</dt>
            <dd data-totale="soci">{{ totali.soci }}</dd>
          </div>
          <div>
            <dt>Incassato</dt>
            <dd data-totale="incassato">€ {{ euro(totali.incassato) }}</dd>
          </div>
        </dl>

        <p v-if="tesseramenti.length === 0" class="vuoto">
          Nessun pagamento registrato. I pagamenti arrivano da Registra ricevute o dalla scheda del
          socio.
        </p>
        <p v-else-if="righe.length === 0" class="vuoto">Nessun pagamento con questi filtri.</p>

        <div v-else class="tabella-scorre">
          <table class="tabella">
            <thead>
              <tr>
                <th scope="col">Pagato il</th>
                <th scope="col">Socio</th>
                <th scope="col">Quota</th>
                <th scope="col" class="numero">Importo</th>
                <th scope="col" class="numero nascondi-stretto">Blocchetto</th>
                <th scope="col" class="numero nascondi-stretto">Ricevuta</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in visibili" :key="r.id_tesseramento ?? `${r.id_socio}-${r.anno}`">
                <td>{{ data(r.data_pagamento) }}</td>
                <th scope="row">
                  <RouterLink
                    v-if="r.socio"
                    :to="{ name: 'socio-detail', params: { id: r.id_socio } }"
                  >
                    {{ r.socio }}
                  </RouterLink>
                  <span v-else class="sotto">Socio non più in archivio</span>
                </th>
                <td>{{ r.anno }}</td>
                <td class="numero">€ {{ euro(r.quota_pagata) }}</td>
                <td class="numero nascondi-stretto">{{ r.numero_blocchetto || '—' }}</td>
                <td class="numero nascondi-stretto">{{ r.numero_ricevuta || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="righe.length > visibili.length" class="altri">
          <p>Mostrati {{ visibili.length }} di {{ righe.length }}.</p>
          <BaseButton @click="mostrate += PER_PAGINA">Mostra altri {{ PER_PAGINA }}</BaseButton>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.pagamenti {
  max-width: var(--page-width);
  margin: 0 auto;
  padding: var(--space-32);
}

.pannello {
  padding: var(--space-24);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-surface);
}

.filtri {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: var(--space-16);
  margin-bottom: var(--space-24);
}

.campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 10rem;
}

.campo--stretto {
  min-width: 0;
  width: 8rem;
}

.campo--largo {
  flex: 1;
  min-width: 14rem;
  max-width: 28rem;
}

.campo label {
  font-size: var(--font-size-label);
  font-weight: 600;
}

.campo input,
.campo select {
  margin: 0;
}

.totali {
  display: flex;
  gap: var(--space-32);
  margin: 0 0 var(--space-16);
}

.totali div {
  display: flex;
  flex-direction: column-reverse;
}

.totali dt {
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}

.totali dd {
  margin: 0;
  font-size: var(--font-size-section-heading);
  font-weight: 700;
}

.vuoto {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin: 0;
  padding: var(--space-24) 0;
  color: var(--color-text-secondary);
}

.vuoto--errore {
  color: var(--color-danger);
}

.tabella-scorre {
  position: relative; /* tiene dentro anche le etichette nascoste (.sr-only) */
  overflow-x: auto;
}

.tabella {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-label);
}

.tabella th,
.tabella td {
  padding: var(--space-8) var(--space-12);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  white-space: nowrap;
}

.tabella thead th {
  color: var(--color-text-secondary);
  font-size: var(--font-size-caption);
  font-weight: 600;
}

.tabella tbody th {
  font-weight: 600;
  white-space: normal;
}

.tabella tbody th a {
  color: var(--color-text-primary);
  text-decoration: none;
}

.tabella tbody th a:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.tabella tbody tr:hover {
  background: var(--color-surface-hover);
}

.tabella .numero {
  text-align: right;
}

.sotto {
  font-weight: 400;
  color: var(--color-text-secondary);
}

.altri {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-16);
  margin-top: var(--space-16);
}

.altri p {
  margin: 0;
  font-size: var(--font-size-label);
  color: var(--color-text-secondary);
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

@media (max-width: 600px) {
  .pagamenti {
    padding: var(--space-16);
  }

  .pannello {
    padding: var(--space-16);
  }

  .nascondi-stretto {
    display: none;
  }

  .totali {
    gap: var(--space-16);
  }

  .tabella th,
  .tabella td {
    padding: var(--space-8) var(--space-4);
  }
}
</style>
