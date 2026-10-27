<template>
  <div class="su-misura">
    <PageHeader
      title="Report su misura"
      subtitle="Scegli a sinistra quali soci e quali colonne: l'anteprima a destra è il PDF che stampi."
      back-to="/report-pdf"
      back-label="Report PDF"
    >
      <template #actions>
        <BaseButton
          variant="primary"
          :loading="generando"
          :disabled="caricamento || righe.length === 0 || colonne.length === 0"
          @click="generaPdf"
        >
          <AppIcon name="documento" /> Genera PDF
        </BaseButton>
      </template>
    </PageHeader>

    <div class="su-misura__layout">
      <!-- Pannello: configurazioni salvate, filtri, impaginazione -->
      <aside class="pannello" aria-label="Filtri e impaginazione del report">
        <div class="pannello__salvati">
          <label for="config-salvata" class="campo__label">Configurazione salvata</label>
          <div class="pannello__riga">
            <select id="config-salvata" v-model="presetScelto" class="campo" @change="caricaPreset">
              <option value="">Nessuna</option>
              <option v-for="(p, i) in presets" :key="p.name + i" :value="String(i)">
                {{ p.name }}
              </option>
            </select>
            <button
              v-if="presetScelto !== ''"
              type="button"
              class="icona-btn"
              aria-label="Elimina la configurazione scelta"
              title="Elimina la configurazione scelta"
              @click="eliminaPreset"
            >
              <AppIcon name="elimina" />
            </button>
          </div>
          <BaseButton variant="ghost" class="pannello__salva" @click="salvaPreset">
            <AppIcon name="salva" /> Salva questa configurazione
          </BaseButton>
        </div>

        <FilterSection titolo="Anno di riferimento" icona="data" :aperta-all-inizio="true">
          <label for="anno-rif" class="sr-only">Anno di riferimento</label>
          <input
            id="anno-rif"
            v-model.number="stato.anno"
            type="number"
            min="1950"
            :max="annoCorrente + 5"
            class="campo campo--anno"
          />
          <p class="aiuto">
            Età, pagato o no, arretrati e diritto di voto si calcolano per questo anno.
          </p>
        </FilterSection>

        <FilterSection titolo="Soci" icona="gruppo" :attivi="contaSoci" :aperta-all-inizio="true">
          <fieldset class="gruppo">
            <legend class="campo__label">
              Manicchie <span class="aiuto">(nessuna spunta = tutte)</span>
            </legend>
            <label v-for="g in manicchie" :key="g" class="scelta">
              <input v-model="stato.filters.groups" type="checkbox" :value="g" /> {{ g }}
            </label>
          </fieldset>
          <fieldset class="gruppo">
            <legend class="campo__label">Età nel {{ stato.anno }}</legend>
            <label v-for="o in OPZIONI_ETA" :key="o.v" class="scelta">
              <input v-model="stato.filters.ageGroup" type="radio" name="eta" :value="o.v" />
              {{ o.t }}
            </label>
          </fieldset>
          <label class="scelta">
            <input v-model="stato.filters.onlyActiveMembers" type="checkbox" />
            Solo attivi (un pagamento dal {{ stato.anno - ANNI_ATTIVITA + 1 }} al {{ stato.anno }})
          </label>
        </FilterSection>

        <FilterSection titolo="Pagamenti" icona="pagamento" :attivi="contaPagamenti">
          <fieldset class="gruppo">
            <legend class="campo__label">Quota {{ stato.anno }}</legend>
            <label v-for="o in OPZIONI_PAGATO" :key="o.v" class="scelta">
              <input
                v-model="stato.filters.paymentStatus"
                type="radio"
                name="pagato"
                :value="o.v"
              />
              {{ o.t }}
            </label>
          </fieldset>
          <fieldset class="gruppo">
            <legend class="campo__label">Ha pagato negli anni</legend>
            <div class="griglia-anni">
              <label v-for="a in anniScelta" :key="'f' + a" class="scelta">
                <input v-model="stato.filters.paymentYears.list" type="checkbox" :value="a" />
                {{ a }}
              </label>
            </div>
            <div v-if="stato.filters.paymentYears.list.length > 1" class="gruppo gruppo--stretto">
              <label class="scelta">
                <input
                  v-model="stato.filters.paymentYears.logic"
                  type="radio"
                  name="logica"
                  value="AND"
                />
                in tutti gli anni spuntati
              </label>
              <label class="scelta">
                <input
                  v-model="stato.filters.paymentYears.logic"
                  type="radio"
                  name="logica"
                  value="OR"
                />
                in almeno uno
              </label>
            </div>
          </fieldset>
        </FilterSection>

        <FilterSection
          titolo="Elezioni"
          icona="votazioni"
          :attivi="stato.filters.electionEligibility !== 'all' ? 1 : 0"
        >
          <fieldset class="gruppo">
            <legend class="campo__label">Diritto di voto nel {{ stato.anno }}</legend>
            <label v-for="o in OPZIONI_VOTO" :key="o.v" class="scelta">
              <input
                v-model="stato.filters.electionEligibility"
                type="radio"
                name="voto"
                :value="o.v"
              />
              {{ o.t }}
            </label>
          </fieldset>
        </FilterSection>

        <p class="pannello__sezione">Impaginazione</p>

        <FilterSection titolo="Colonne" icona="elenco">
          <fieldset class="gruppo">
            <legend class="campo__label">Dati del socio</legend>
            <label v-for="(c, chiave) in COLONNE" :key="chiave" class="scelta">
              <input v-model="stato.display.baseColumns" type="checkbox" :value="chiave" />
              {{ c.label }}
            </label>
          </fieldset>
          <div v-if="stato.display.baseColumns.length > 1" class="gruppo">
            <p class="campo__label">Ordine (la firma resta in fondo)</p>
            <ol class="ordine">
              <li
                v-for="(chiave, i) in stato.display.baseColumns"
                :key="chiave"
                class="ordine__voce"
              >
                <span>{{ COLONNE[chiave].label }}</span>
                <button
                  type="button"
                  class="icona-btn"
                  :disabled="i === 0"
                  :aria-label="`Sposta ${COLONNE[chiave].label} prima`"
                  @click="sposta(i, -1)"
                >
                  <AppIcon name="precedente" class="ruota" />
                </button>
                <button
                  type="button"
                  class="icona-btn"
                  :disabled="i === stato.display.baseColumns.length - 1"
                  :aria-label="`Sposta ${COLONNE[chiave].label} dopo`"
                  @click="sposta(i, 1)"
                >
                  <AppIcon name="successivo" class="ruota" />
                </button>
              </li>
            </ol>
          </div>
          <fieldset class="gruppo">
            <legend class="campo__label">
              Anni (V pagato, X non pagato, O minorenne esente, - non iscritto)
            </legend>
            <div class="griglia-anni">
              <label v-for="a in anniScelta" :key="'c' + a" class="scelta">
                <input v-model="stato.display.yearColumns" type="checkbox" :value="a" /> {{ a }}
              </label>
            </div>
            <div class="pannello__riga">
              <button
                type="button"
                class="link-btn"
                @click="stato.display.yearColumns = [...anniScelta]"
              >
                Tutti
              </button>
              <button type="button" class="link-btn" @click="stato.display.yearColumns = []">
                Nessuno
              </button>
            </div>
          </fieldset>
        </FilterSection>

        <FilterSection titolo="Titolo e ordine" icona="personalizza">
          <div class="gruppo">
            <label for="titolo-doc" class="campo__label">Titolo del PDF</label>
            <input
              id="titolo-doc"
              v-model="stato.titolo"
              type="text"
              class="campo"
              :placeholder="titoloAutomatico"
            />
            <p class="aiuto">Vuoto: si usa "{{ titoloAutomatico }}".</p>
          </div>
          <div class="gruppo">
            <label for="ordina" class="campo__label">Ordina per</label>
            <select id="ordina" v-model="stato.sort.by" class="campo">
              <option value="cognome">Cognome</option>
              <option value="gruppo">Manicchia, poi cognome</option>
              <option value="anno_nascita">Anno di nascita, poi cognome</option>
            </select>
            <label class="scelta">
              <input v-model="stato.sort.descending" type="checkbox" /> Dal più grande al più
              piccolo
            </label>
          </div>
        </FilterSection>
      </aside>

      <!-- Anteprima: le stesse righe e colonne del PDF -->
      <section class="anteprima" aria-labelledby="anteprima-titolo">
        <div class="anteprima__barra">
          <h2 id="anteprima-titolo" class="anteprima__titolo">
            {{ titoloStampa }}
            <span class="anteprima__conta" aria-live="polite">
              {{ caricamento ? '' : `${righe.length} ${righe.length === 1 ? 'socio' : 'soci'}` }}
            </span>
          </h2>
          <ul v-if="etichette.length" class="chips" aria-label="Filtri attivi">
            <li v-for="e in etichette" :key="e.id">
              <button
                type="button"
                class="chip"
                :aria-label="`Togli il filtro ${e.testo}`"
                @click="togli(e.id)"
              >
                {{ e.testo }} <AppIcon name="chiudi" />
              </button>
            </li>
            <li>
              <button type="button" class="link-btn" @click="azzeraFiltri">Azzera filtri</button>
            </li>
          </ul>
          <p v-else class="aiuto">Nessun filtro: nell'elenco ci sono tutti i soci.</p>
        </div>

        <p v-if="caricamento" class="anteprima__stato">
          <AppIcon name="caricamento" spin /> Carico i soci...
        </p>
        <p v-else-if="errore" class="anteprima__stato anteprima__stato--errore">
          <AppIcon name="errore" /> {{ errore }}
        </p>
        <p v-else-if="colonne.length === 0" class="anteprima__stato">
          Nessuna colonna scelta: aprile da Impaginazione › Colonne.
        </p>
        <p v-else-if="righe.length === 0" class="anteprima__stato">
          Nessun socio con questi filtri. Togline qualcuno dalle etichette qui sopra.
        </p>
        <div v-else class="tabella-wrap" tabindex="0" aria-label="Anteprima del report, scorrevole">
          <table class="tabella">
            <thead>
              <tr>
                <th
                  v-for="c in colonne"
                  :key="c.chiave"
                  scope="col"
                  :class="{
                    'is-centro': c.align === 'center' || c.anno,
                    'is-firma': c.chiave === 'firma',
                  }"
                >
                  {{ c.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in righe" :key="r.socio.id">
                <td
                  v-for="(v, i) in celle(r)"
                  :key="colonne[i].chiave"
                  :class="{
                    'is-centro': colonne[i].align === 'center' || colonne[i].anno,
                    'is-firma': colonne[i].chiave === 'firma',
                  }"
                >
                  <span v-if="v.stato" class="stato" :class="`stato--${CLASSI_STATO[v.stato]}`">{{
                    v.testo
                  }}</span>
                  <template v-else>{{ v.testo }}</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { askConfirm, askText } from '@/composables/useDialog'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import FilterSection from '@/components/base/FilterSection.vue'
import { getAllSociWithTesseramenti, getUniqueGroups } from '@/services/db'
import { generateBetaDynamicPDF } from '@/services/exportBeta'
import {
  ANNI_ATTIVITA,
  COLONNE,
  TESTI_VOTO,
  statoIniziale,
  normalizzaStato,
  filtraSoci,
  colonneReport,
  valoreCella,
  filtriAttivi,
  togliFiltro,
  riassunto,
  titoloReport,
  manicchieDisponibili,
  statoDaModello,
} from '@/utils/reportSuMisura'

const CHIAVE_PRESET = 'reports_beta_presets'
const OPZIONI_ETA = [
  { v: 'all', t: 'Tutti' },
  { v: 'maggiorenni', t: 'Maggiorenni' },
  { v: 'minorenni', t: 'Minorenni' },
]
const OPZIONI_PAGATO = [
  { v: 'all', t: 'Tutti' },
  { v: 'in_regola', t: 'Ha pagato' },
  { v: 'morosi', t: 'Non ha pagato' },
]
const OPZIONI_VOTO = [
  { v: 'all', t: 'Tutti' },
  ...Object.entries(TESTI_VOTO).map(([v, t]) => ({ v, t: t[0].toUpperCase() + t.slice(1) })),
]
// Classi dei badge: stato del voto o dell'anno -> ruolo di colore
const CLASSI_STATO = {
  si: 'ok',
  V: 'ok',
  regolarizza: 'attenzione',
  O: 'attenzione',
  no: 'errore',
  X: 'errore',
  '-': 'neutro',
}

const toast = useToast()
const route = useRoute()
const annoCorrente = new Date().getFullYear()

// Aperta da "Personalizza" di un modello pronto: si parte da quel modello
const statoDaIndirizzo = () => {
  const { modello, anno, manicchia, eta, pagamento } = route.query
  const annoScelto = Number.parseInt(anno, 10)
  return statoDaModello(
    String(modello || ''),
    Number.isInteger(annoScelto) ? annoScelto : annoCorrente,
    { manicchia: manicchia ? String(manicchia) : '', eta, pagamento },
  )
}
const stato = ref(statoDaIndirizzo() || statoIniziale(annoCorrente))
const soci = ref([])
const gruppi = ref([])
const caricamento = ref(true)
const errore = ref('')
const generando = ref(false)
const presets = ref([])
const presetScelto = ref('')

const leggiPresets = () => {
  try {
    const salvati = JSON.parse(localStorage.getItem(CHIAVE_PRESET) || '[]')
    return Array.isArray(salvati) ? salvati.filter((p) => p && typeof p.name === 'string') : []
  } catch {
    return []
  }
}
const scriviPresets = () => {
  try {
    localStorage.setItem(CHIAVE_PRESET, JSON.stringify(presets.value))
    return true
  } catch {
    toast.error('Non sono riuscito a salvare la configurazione in questo browser.')
    return false
  }
}

onMounted(async () => {
  presets.value = leggiPresets()
  try {
    ;[soci.value, gruppi.value] = await Promise.all([
      getAllSociWithTesseramenti(),
      getUniqueGroups(),
    ])
  } catch (e) {
    console.error('Caricamento soci per il report fallito:', e)
    errore.value = 'Non sono riuscito a leggere i soci dal database.'
  } finally {
    caricamento.value = false
  }
})

const anno = computed(() => (Number.isInteger(stato.value.anno) ? stato.value.anno : annoCorrente))
// Lo stato con un anno sempre valido, anche mentre si sta scrivendo nel campo
const statoValido = computed(() => ({ ...stato.value, anno: anno.value }))

const manicchie = computed(() => manicchieDisponibili(gruppi.value, soci.value))
const anniScelta = computed(() => Array.from({ length: 10 }, (_, i) => anno.value - 9 + i))
const righe = computed(() => filtraSoci(soci.value, statoValido.value))
const colonne = computed(() => colonneReport(statoValido.value))
const etichette = computed(() => filtriAttivi(statoValido.value))
const titoloAutomatico = computed(() => titoloReport({ ...statoValido.value, titolo: '' }))
const titoloStampa = computed(() => titoloReport(statoValido.value))
const celle = (riga) => colonne.value.map((c) => valoreCella(riga, c))

const contaSoci = computed(() => {
  const f = stato.value.filters
  return (f.groups.length > 0) + (f.ageGroup !== 'all') + f.onlyActiveMembers
})
const contaPagamenti = computed(() => {
  const f = stato.value.filters
  return (f.paymentStatus !== 'all') + (f.paymentYears.list.length > 0)
})

const togli = (id) => {
  stato.value = togliFiltro(stato.value, id)
}
const azzeraFiltri = () => {
  stato.value = { ...stato.value, filters: statoIniziale(anno.value).filters }
}
const sposta = (i, verso) => {
  const elenco = [...stato.value.display.baseColumns]
  ;[elenco[i], elenco[i + verso]] = [elenco[i + verso], elenco[i]]
  stato.value.display.baseColumns = elenco
}

const caricaPreset = () => {
  const preset = presets.value[Number(presetScelto.value)]
  if (!preset) return
  stato.value = normalizzaStato(preset.state, annoCorrente)
  toast.info(`Configurazione "${preset.name}" caricata`)
}

const salvaPreset = async () => {
  const nome = await askText({
    title: 'Salva configurazione',
    label: 'Nome della configurazione',
    placeholder: `Aventi diritto ${anno.value}`,
    confirmLabel: 'Salva',
  })
  if (!nome) return
  presets.value.push({ name: nome, state: JSON.parse(JSON.stringify(statoValido.value)) })
  if (scriviPresets()) {
    presetScelto.value = String(presets.value.length - 1)
    toast.success(`Configurazione "${nome}" salvata in questo browser`)
  }
}

const eliminaPreset = async () => {
  const i = Number(presetScelto.value)
  const preset = presets.value[i]
  if (!preset) return
  const conferma = await askConfirm({
    title: `Eliminare la configurazione "${preset.name}"?`,
    message: 'Viene tolta da questo browser. I filtri sulla pagina restano come sono.',
    confirmLabel: 'Elimina configurazione',
    danger: true,
  })
  if (!conferma) return
  presets.value.splice(i, 1)
  presetScelto.value = ''
  scriviPresets()
}

const generaPdf = async () => {
  generando.value = true
  try {
    await generateBetaDynamicPDF({
      righe: righe.value,
      colonne: colonne.value,
      titolo: titoloStampa.value,
      riassunto: riassunto(statoValido.value),
    })
    toast.success('PDF generato')
  } catch (e) {
    console.error('Generazione PDF su misura fallita:', e)
    toast.error('Errore nella generazione del PDF: ' + e.message)
  } finally {
    generando.value = false
  }
}
</script>

<style scoped>
.su-misura {
  max-width: var(--page-width-wide);
  margin: 0 auto;
  padding: var(--space-32);
}

.su-misura__layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: var(--space-24);
  align-items: start;
}

/* Pannello */
.pannello {
  position: sticky;
  top: var(--space-16);
  max-height: calc(100vh - var(--space-32));
  overflow-y: auto;
  padding: var(--space-16);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-surface);
}

.pannello__salvati {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding-bottom: var(--space-16);
  border-bottom: 1px solid var(--color-border);
}

.pannello__riga {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.pannello__salva {
  align-self: flex-start;
}

.pannello__sezione {
  margin: var(--space-24) 0 0;
  padding-bottom: var(--space-4);
  font-size: var(--font-size-caption);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
}

.campo {
  width: 100%;
  min-height: 2.25rem;
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-input-bg);
  color: var(--color-text-primary);
  font-size: var(--font-size-label);
}

.campo--anno {
  width: 7rem;
}

.campo__label {
  margin: 0;
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.gruppo {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  border: none;
  min-width: 0;
}

.gruppo--stretto {
  margin-top: var(--space-8);
}

.gruppo legend {
  margin-bottom: var(--space-4);
}

.scelta {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-size: var(--font-size-label);
  color: var(--color-text-primary);
  cursor: pointer;
}

.scelta input {
  accent-color: var(--color-accent);
}

.griglia-anni {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.aiuto {
  margin: 0;
  font-size: var(--font-size-caption);
  font-weight: 400;
  color: var(--color-text-secondary);
}

.ordine {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.ordine__voce {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  font-size: var(--font-size-label);
}

.ordine__voce span {
  flex: 1;
}

.ruota {
  transform: rotate(90deg);
}

.icona-btn {
  min-height: 0;
  padding: var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  background: none;
  box-shadow: none;
  color: var(--color-text-secondary);
}

.icona-btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.link-btn {
  min-height: 0;
  padding: 0;
  border: none;
  background: none;
  box-shadow: none;
  color: var(--color-accent);
  font-size: var(--font-size-caption);
  font-weight: 600;
}

.link-btn:hover {
  text-decoration: underline;
}

/* Anteprima */
.anteprima {
  min-width: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-surface);
}

.anteprima__barra {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-16);
  border-bottom: 1px solid var(--color-border);
}

.anteprima__titolo {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--space-12);
  margin: 0;
  font-size: var(--font-size-section-heading);
}

.anteprima__conta {
  font-family: var(--font-family-body);
  font-size: var(--font-size-label);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-8);
  margin: 0;
  padding: 0;
  list-style: none;
}

.chip {
  min-height: 0;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-8) var(--space-4) var(--space-12);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  box-shadow: none;
  color: var(--color-accent);
  font-size: var(--font-size-caption);
  white-space: normal;
}

.chip:hover {
  background: var(--color-surface-hover);
}

.anteprima__stato {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin: 0;
  padding: var(--space-32) var(--space-16);
  color: var(--color-text-secondary);
}

.anteprima__stato--errore {
  color: var(--color-danger);
}

.tabella-wrap {
  max-height: calc(100vh - 220px);
  overflow: auto;
}

.tabella {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-label);
}

.tabella th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: var(--space-8);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  font-size: var(--font-size-caption);
  text-align: left;
  white-space: nowrap;
}

.tabella td {
  padding: var(--space-4) var(--space-8);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.tabella tbody tr:hover td {
  background: var(--color-surface-hover);
}

.tabella .is-centro {
  text-align: center;
}

.is-firma {
  min-width: 8rem;
}

.stato {
  font-weight: 700;
}

.stato--ok {
  color: var(--color-success);
}
.stato--attenzione {
  color: var(--color-warning);
}
.stato--errore {
  color: var(--color-danger);
}
.stato--neutro {
  color: var(--color-text-secondary);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 960px) {
  .su-misura {
    padding: var(--space-16);
  }
  .su-misura__layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .pannello {
    position: static;
    max-height: none;
  }
}
</style>
