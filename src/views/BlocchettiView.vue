<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'
import { askConfirm } from '@/composables/useDialog'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import SectionTabs from '@/components/base/SectionTabs.vue'
import { SCHEDE_INCASSI } from '@/router/sezioni'
import {
  db,
  getAllBlocchetti,
  addBlocchetto,
  returnBlocchetto,
  deleteBlocchetto,
  exportAllTesseramenti,
  getSetting,
} from '@/services/db'
import { elencoBlocchetti, filtraBlocchetti, intervalloBlocchetto } from '@/utils/blocchetto'

const toast = useToast()

const registrati = ref([])
const pagamenti = ref([])
const nomiSoci = ref(new Map())
const ricevutePerBlocchetto = ref(10)
const caricamento = ref(true)
const erroreCaricamento = ref('')

const ricerca = ref('')
const aperto = ref(null)

onMounted(caricaDati)

async function caricaDati() {
  erroreCaricamento.value = ''
  try {
    const [blocchetti, tesseramenti, soci, per] = await Promise.all([
      getAllBlocchetti(),
      exportAllTesseramenti(),
      db.soci.toArray(),
      getSetting('receiptsPerBlock', 10),
    ])
    registrati.value = blocchetti
    pagamenti.value = tesseramenti
    nomiSoci.value = new Map(soci.map((s) => [s.id, `${s.cognome} ${s.nome}`]))
    ricevutePerBlocchetto.value = Number(per) || 10
  } catch (error) {
    console.error('Blocchetti non letti:', error)
    erroreCaricamento.value = 'Non sono riuscito a leggere i blocchetti.'
  } finally {
    caricamento.value = false
  }
}

// Contatori e tabella partono dallo stesso elenco: contano la stessa cosa
const elenco = computed(() =>
  elencoBlocchetti(pagamenti.value, registrati.value, ricevutePerBlocchetto.value),
)
const visibili = computed(() => filtraBlocchetti(elenco.value, ricerca.value))
const contatori = computed(() => ({
  totale: elenco.value.length,
  inGiro: elenco.value.filter((b) => b.stato === 'in-giro').length,
  conSaltate: elenco.value.filter((b) => b.riepilogo.mancanti.length > 0).length,
}))

const euro = (valore) => Number(valore || 0).toFixed(2)
const data = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('it-IT') : '')
const nome = (id) => nomiSoci.value.get(id) || 'Socio non trovato'
const elencoBreve = (numeri, max = 5) =>
  numeri.length > max
    ? `${numeri.slice(0, max).join(', ')} e altre ${numeri.length - max}`
    : numeri.join(', ')

/** Cosa guardare in un blocchetto; vuoto se e' tutto in ordine. */
const daControllare = (b) => {
  const r = b.riepilogo
  const voci = []
  if (r.mancanti.length) voci.push(`Saltate: ${elencoBreve(r.mancanti)}`)
  if (r.daInserire) voci.push(`Non registrate: ${r.daInserire.da}–${r.daInserire.a}`)
  if (r.fuori.length) voci.push(`${r.fuori.length} fuori dal blocchetto`)
  if (r.senzaRicevuta) voci.push(`${r.senzaRicevuta} senza numero di ricevuta`)
  return voci
}

/** Ricevute del blocchetto da mostrare aperto: quelle registrate e quelle saltate. */
const ricevuteAperte = (b) =>
  [
    ...b.ricevute.map((r) => ({
      ...r,
      saltata: false,
      fuori: b.riepilogo.fuori.includes(r.numero),
    })),
    ...b.riepilogo.mancanti.map((n) => ({ numero: n, pagamenti: [], saltata: true, fuori: false })),
  ].sort((x, y) => x.numero - y.numero)

const apriChiudi = (numero) => {
  aperto.value = aperto.value === numero ? null : numero
}

// ---- Assegna un blocchetto ----

const oggi = () => new Date().toISOString().split('T')[0]
const mostraAssegna = ref(false)
const tentato = ref(false)
const salvataggio = ref(false)
const campoNumero = ref(null)
const nuovo = ref({ numero: '', assegnato_a: '', data: oggi() })

const prossimoNumero = computed(() => (elenco.value.at(-1)?.numero ?? 0) + 1)
const intervalloNuovo = computed(() =>
  intervalloBlocchetto(nuovo.value.numero, ricevutePerBlocchetto.value),
)
const erroreNumero = computed(() => {
  const n = Number(nuovo.value.numero)
  if (nuovo.value.numero === '' || nuovo.value.numero === null)
    return 'Scrivi il numero del blocchetto'
  if (!Number.isInteger(n) || n < 1) return 'Il numero è un intero da 1 in su'
  const gia = registrati.value.find((b) => Number(b.numero_blocchetto) === n)
  if (gia)
    return `Il blocchetto ${n} è già assegnato${gia.assegnato_a ? ` a ${gia.assegnato_a}` : ''}`
  return ''
})

const apriAssegna = () => {
  nuovo.value = { numero: prossimoNumero.value, assegnato_a: '', data: oggi() }
  tentato.value = false
  mostraAssegna.value = true
  nextTick(() => campoNumero.value?.focus())
}

async function assegna() {
  tentato.value = true
  if (erroreNumero.value) {
    campoNumero.value?.focus()
    return
  }
  salvataggio.value = true
  try {
    const n = Number(nuovo.value.numero)
    await addBlocchetto({
      numero_blocchetto: n,
      ricevute_da: intervalloNuovo.value.da,
      ricevute_a: intervalloNuovo.value.a,
      assegnato_a: nuovo.value.assegnato_a.trim(),
      data_assegnazione: nuovo.value.data || null,
      data_restituzione: null,
    })
    await caricaDati()
    mostraAssegna.value = false
    toast.success(`Blocchetto ${n} assegnato`)
  } catch (error) {
    toast.error(error.message)
  } finally {
    salvataggio.value = false
  }
}

// ---- Rientro e scollegamento ----

async function segnaRientrato(b) {
  const conferma = await askConfirm({
    title: `Segnare il blocchetto ${b.numero} come rientrato?`,
    message: 'Come data di rientro viene usata la data di oggi.',
    confirmLabel: 'Segna rientrato',
  })
  if (!conferma) return
  await returnBlocchetto(b.registrato.id)
  await caricaDati()
}

async function scollega(b) {
  const conferma = await askConfirm({
    title: `Scollegare l'assegnatario dal blocchetto ${b.numero}?`,
    message:
      "L'assegnazione viene tolta e il blocchetto resta nello storico. I pagamenti non cambiano.",
    confirmLabel: 'Scollega',
    danger: true,
  })
  if (!conferma) return
  await deleteBlocchetto(b.registrato.id)
  await caricaDati()
}
</script>

<template>
  <div class="blocchetti">
    <PageHeader
      title="Incassi"
      subtitle="Assegna e fai rientrare i blocchetti, controlla le ricevute di ciascuno"
    >
      <template #actions>
        <BaseButton v-if="!mostraAssegna" @click="apriAssegna">
          <AppIcon name="aggiungi" /> Assegna un blocchetto
        </BaseButton>
      </template>
    </PageHeader>
    <SectionTabs :tabs="SCHEDE_INCASSI" label="Schede di Incassi" />

    <form v-if="mostraAssegna" class="pannello assegna" novalidate @submit.prevent="assegna">
      <h2>Assegna un blocchetto</h2>
      <div class="assegna__campi">
        <div class="campo">
          <label for="nuovo-blocchetto-numero">Numero del blocchetto</label>
          <input
            id="nuovo-blocchetto-numero"
            ref="campoNumero"
            v-model.number="nuovo.numero"
            type="number"
            min="1"
            :disabled="salvataggio"
            :aria-invalid="tentato && erroreNumero ? 'true' : undefined"
            :aria-describedby="
              tentato && erroreNumero ? 'nuovo-blocchetto-errore' : 'nuovo-blocchetto-aiuto'
            "
          />
          <p v-if="tentato && erroreNumero" id="nuovo-blocchetto-errore" class="campo__errore">
            {{ erroreNumero }}
          </p>
          <p v-else id="nuovo-blocchetto-aiuto" class="campo__aiuto">
            <template v-if="intervalloNuovo">
              Ricevute {{ intervalloNuovo.da }}–{{ intervalloNuovo.a }}
            </template>
          </p>
        </div>
        <div class="campo">
          <label for="nuovo-blocchetto-a">
            Consegnato a <span class="campo__facoltativo">(facoltativo)</span>
          </label>
          <input
            id="nuovo-blocchetto-a"
            v-model="nuovo.assegnato_a"
            type="text"
            :disabled="salvataggio"
          />
        </div>
        <div class="campo">
          <label for="nuovo-blocchetto-data">Data di consegna</label>
          <input
            id="nuovo-blocchetto-data"
            v-model="nuovo.data"
            type="date"
            :disabled="salvataggio"
          />
        </div>
      </div>
      <div class="assegna__azioni">
        <BaseButton variant="ghost" :disabled="salvataggio" @click="mostraAssegna = false">
          Annulla
        </BaseButton>
        <BaseButton type="submit" variant="primary" :loading="salvataggio">
          <AppIcon name="salva" /> Assegna
        </BaseButton>
      </div>
    </form>

    <section class="pannello" aria-labelledby="titolo-elenco">
      <div class="barra">
        <h2 id="titolo-elenco">Blocchetti</h2>
        <dl class="contatori">
          <div>
            <dt>In elenco</dt>
            <dd data-contatore="totale">{{ contatori.totale }}</dd>
          </div>
          <div>
            <dt>In giro</dt>
            <dd data-contatore="in-giro">{{ contatori.inGiro }}</dd>
          </div>
          <div>
            <dt>Con ricevute saltate</dt>
            <dd data-contatore="saltate">{{ contatori.conSaltate }}</dd>
          </div>
        </dl>
      </div>

      <div class="cerca">
        <label for="cerca-blocchetti">Cerca</label>
        <input
          id="cerca-blocchetti"
          v-model="ricerca"
          type="search"
          placeholder="Blocchetto, ricevuta o nome"
        />
        <p v-if="ricerca" class="cerca__esito" aria-live="polite">
          {{ visibili.length }} su {{ elenco.length }}
        </p>
      </div>

      <p v-if="caricamento" class="vuoto" role="status">
        <AppIcon name="caricamento" /> Carico i blocchetti…
      </p>
      <p v-else-if="erroreCaricamento" class="vuoto vuoto--errore" role="alert">
        <AppIcon name="errore" /> {{ erroreCaricamento }}
        <BaseButton @click="caricaDati">Riprova</BaseButton>
      </p>
      <p v-else-if="elenco.length === 0" class="vuoto">
        Nessun blocchetto: ne compare uno appena lo assegni o registri una ricevuta.
      </p>
      <p v-else-if="visibili.length === 0" class="vuoto">Nessun blocchetto per "{{ ricerca }}".</p>

      <div v-else class="tabella-scorre">
        <table class="tabella">
          <thead>
            <tr>
              <th scope="col">Blocchetto</th>
              <th scope="col" class="nascondi-stretto">Consegnato a</th>
              <th scope="col">Ricevute</th>
              <th scope="col">Da controllare</th>
              <th scope="col" class="nascondi-stretto numero">Incassato</th>
              <th scope="col">Stato</th>
              <th scope="col"><span class="sr-only">Azioni</span></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="b in visibili" :key="b.numero">
              <tr :class="{ 'riga--aperta': aperto === b.numero }">
                <th scope="row">
                  {{ b.numero }}
                  <span v-if="b.riepilogo.intervallo" class="sotto">
                    {{ b.riepilogo.intervallo.da }}–{{ b.riepilogo.intervallo.a }}
                  </span>
                </th>
                <td class="nascondi-stretto">
                  <template v-if="b.registrato">
                    {{ b.registrato.assegnato_a || 'Non indicato' }}
                    <span v-if="b.registrato.data_assegnazione" class="sotto">
                      dal {{ data(b.registrato.data_assegnazione) }}
                    </span>
                  </template>
                  <span v-else class="sotto">—</span>
                </td>
                <td>
                  {{ b.riepilogo.ricevute - b.riepilogo.fuori.length }} su
                  {{ ricevutePerBlocchetto }}
                </td>
                <td>
                  <ul v-if="daControllare(b).length" class="controlli">
                    <li v-for="voce in daControllare(b)" :key="voce">{{ voce }}</li>
                  </ul>
                  <span v-else class="completo"><AppIcon name="ok" /> Completo</span>
                </td>
                <td class="nascondi-stretto numero">€ {{ euro(b.riepilogo.incassato) }}</td>
                <td>
                  <span v-if="b.stato === 'in-giro'" class="stato stato--giro">In giro</span>
                  <span v-else-if="b.stato === 'rientrato'" class="stato">
                    Rientrato
                    <span class="sotto">il {{ data(b.registrato.data_restituzione) }}</span>
                  </span>
                  <span
                    v-else
                    class="stato stato--storico"
                    title="Trovato nei pagamenti, mai assegnato da questa pagina"
                  >
                    Dallo storico
                  </span>
                </td>
                <td class="azioni">
                  <RouterLink
                    :to="{ name: 'batch-entry', query: { blocchetto: b.numero } }"
                    class="link-btn"
                    :aria-label="`Registra ricevute del blocchetto ${b.numero}`"
                  >
                    <AppIcon name="registrazione-seriale" /><span class="link-btn__testo"
                      >Registra</span
                    >
                  </RouterLink>
                  <button
                    type="button"
                    class="icona-btn"
                    :aria-expanded="aperto === b.numero ? 'true' : 'false'"
                    :aria-controls="`ricevute-blocchetto-${b.numero}`"
                    :aria-label="`Ricevute del blocchetto ${b.numero}`"
                    :title="`Ricevute del blocchetto ${b.numero}`"
                    @click="apriChiudi(b.numero)"
                  >
                    <AppIcon name="dettagli" />
                  </button>
                  <button
                    v-if="b.stato === 'in-giro'"
                    type="button"
                    class="icona-btn"
                    :aria-label="`Segna rientrato il blocchetto ${b.numero}`"
                    title="Segna rientrato"
                    @click="segnaRientrato(b)"
                  >
                    <AppIcon name="restituisci" />
                  </button>
                  <button
                    v-if="b.registrato"
                    type="button"
                    class="icona-btn icona-btn--pericolo"
                    :aria-label="`Scollega l'assegnatario dal blocchetto ${b.numero}`"
                    title="Scollega l'assegnatario"
                    @click="scollega(b)"
                  >
                    <AppIcon name="elimina" />
                  </button>
                </td>
              </tr>
              <tr
                v-if="aperto === b.numero"
                :id="`ricevute-blocchetto-${b.numero}`"
                class="dettaglio"
              >
                <td colspan="7">
                  <p v-if="ricevuteAperte(b).length === 0" class="sotto">
                    Nessuna ricevuta registrata per questo blocchetto.
                  </p>
                  <ol v-else class="ricevute">
                    <li
                      v-for="r in ricevuteAperte(b)"
                      :key="r.numero"
                      class="ricevuta"
                      :class="{ 'ricevuta--saltata': r.saltata, 'ricevuta--fuori': r.fuori }"
                    >
                      <span class="ricevuta__numero">
                        Ricevuta {{ r.numero }}
                        <span v-if="r.fuori" class="sotto">fuori dal blocchetto</span>
                      </span>
                      <span v-if="r.saltata" class="ricevuta__saltata">
                        <AppIcon name="attenzione" /> Saltata
                      </span>
                      <ul v-else>
                        <li
                          v-for="p in r.pagamenti"
                          :key="p.id_tesseramento ?? `${p.id_socio}-${p.anno}`"
                        >
                          <RouterLink :to="{ name: 'socio-detail', params: { id: p.id_socio } }">
                            {{ nome(p.id_socio) }}
                          </RouterLink>
                          <span class="sotto">{{ p.anno }} · € {{ euro(p.quota_pagata) }}</span>
                        </li>
                      </ul>
                    </li>
                  </ol>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.blocchetti {
  max-width: var(--page-width);
  margin: 0 auto;
  padding: var(--space-32);
}

.pannello {
  margin-bottom: var(--space-24);
  padding: var(--space-24);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-surface);
}

.pannello h2 {
  margin: 0;
  font-size: var(--font-size-section-heading);
}

/* Assegna */
.assegna {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.assegna__campi {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-16) var(--space-24);
}

.assegna__azioni {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-12);
}

.campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.campo label,
.cerca label {
  font-size: var(--font-size-label);
  font-weight: 600;
}

.campo input,
.cerca input {
  margin: 0;
}

.campo [aria-invalid='true'] {
  border-color: var(--color-danger);
}

.campo__facoltativo {
  font-weight: 400;
  color: var(--color-text-secondary);
}

.campo__errore,
.campo__aiuto {
  margin: 0;
  min-height: 1.2em;
  font-size: var(--font-size-caption);
}

.campo__errore {
  color: var(--color-danger);
  font-weight: 600;
}

.campo__aiuto {
  color: var(--color-text-secondary);
}

/* Barra con contatori e ricerca */
.barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-16);
  margin-bottom: var(--space-16);
}

.contatori {
  display: flex;
  gap: var(--space-24);
  margin: 0;
}

.contatori div {
  display: flex;
  flex-direction: column-reverse;
}

.contatori dt {
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}

.contatori dd {
  margin: 0;
  font-size: var(--font-size-section-heading);
  font-weight: 700;
}

.cerca {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 28rem;
  margin-bottom: var(--space-16);
}

.cerca__esito {
  margin: 0;
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
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

/* Tabella */
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
  vertical-align: top;
}

.tabella thead th {
  color: var(--color-text-secondary);
  font-size: var(--font-size-caption);
  font-weight: 600;
  white-space: nowrap;
}

.tabella tbody th {
  font-size: var(--font-size-body);
  white-space: nowrap;
}

.tabella tbody tr:hover,
.riga--aperta {
  background: var(--color-surface-hover);
}

.tabella .numero {
  text-align: right;
  white-space: nowrap;
}

.sotto {
  display: block;
  font-size: var(--font-size-caption);
  font-weight: 400;
  color: var(--color-text-secondary);
}

.controlli {
  margin: 0;
  padding: 0;
  list-style: none;
}

.controlli li + li {
  margin-top: var(--space-4);
}

.completo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  color: var(--color-success);
  font-weight: 600;
}

.stato {
  font-weight: 600;
  white-space: nowrap;
}

.stato--giro {
  color: var(--color-warning);
}

.stato--storico {
  font-weight: 400;
  color: var(--color-text-secondary);
}

.azioni {
  text-align: right;
  white-space: nowrap;
}

.icona-btn,
.link-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  min-height: 2rem;
  padding: var(--space-4) var(--space-8);
  border: none;
  border-radius: var(--radius-control);
  background: none;
  box-shadow: none;
  vertical-align: middle;
}

.icona-btn {
  color: var(--color-text-secondary);
}

.link-btn {
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
}

.icona-btn:hover,
.link-btn:hover {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
}

.icona-btn--pericolo:hover {
  color: var(--color-danger);
}

.icona-btn[aria-expanded='true'] {
  color: var(--color-accent);
}

/* Ricevute aperte */
.dettaglio > td {
  background: var(--color-background);
}

.ricevute {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: var(--space-12);
  margin: 0;
  padding: 0;
  list-style: none;
}

.ricevuta {
  padding: var(--space-8) var(--space-12);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
}

.ricevuta--saltata,
.ricevuta--fuori {
  border-left: 3px solid var(--color-warning);
}

.ricevuta__numero {
  display: block;
  margin-bottom: var(--space-4);
  font-weight: 600;
}

.ricevuta__saltata {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  color: var(--color-text-secondary);
}

.ricevuta ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.ricevuta ul li + li {
  margin-top: var(--space-4);
}

.ricevuta a {
  color: var(--color-text-primary);
}

.ricevuta a:hover {
  color: var(--color-accent);
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

@media (max-width: 900px) {
  .assegna__campi {
    grid-template-columns: 1fr;
  }
}

/* Su schermo stretto restano blocchetto, ricevute, controlli, stato e azioni */
@media (max-width: 600px) {
  .blocchetti {
    padding: var(--space-16);
  }

  .pannello {
    padding: var(--space-16);
  }

  .nascondi-stretto {
    display: none;
  }

  .tabella th,
  .tabella td {
    padding: var(--space-8) var(--space-4);
  }

  .link-btn__testo {
    display: none;
  }
}
</style>
