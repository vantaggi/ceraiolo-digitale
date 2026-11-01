<template>
  <div class="scheda">
    <p v-if="loading" class="scheda__stato" role="status">
      <AppIcon name="caricamento" spin /> Caricamento della scheda…
    </p>

    <div v-else-if="error" class="scheda__stato scheda__stato--errore" role="alert">
      <h1><AppIcon name="errore" /> Scheda non aperta</h1>
      <p>{{ error }}</p>
      <RouterLink to="/" class="scheda__torna">
        <AppIcon name="indietro" /> Torna ai soci
      </RouterLink>
    </div>

    <template v-else-if="socio">
      <PageHeader :title="`${socio.cognome} ${socio.nome}`" back-to="/" back-label="Soci">
        <template #nav>
          <div v-if="prevSocioId || nextSocioId" class="scheda__scorri">
            <RouterLink v-if="prevSocioId" :to="'/socio/' + prevSocioId" title="Socio precedente">
              <AppIcon name="precedente" /> Prec
            </RouterLink>
            <RouterLink v-if="nextSocioId" :to="'/socio/' + nextSocioId" title="Socio successivo">
              Succ <AppIcon name="successivo" />
            </RouterLink>
          </div>
        </template>
        <template #actions>
          <div class="scheda__azioni">
            <BaseButton :loading="stampaTessera" :disabled="editMode" @click="generaTessera">
              <AppIcon name="tessera" /> Tessera {{ annoCorrente }}
            </BaseButton>
            <template v-if="!editMode">
              <BaseButton ref="bottoneModifica" @click="apriModifica">
                <AppIcon name="modifica" /> Modifica
              </BaseButton>
              <BaseButton v-if="annoProposto" variant="primary" @click="payYear(annoProposto)">
                <AppIcon name="pagamento" /> Paga {{ annoProposto }}
              </BaseButton>
            </template>
          </div>
        </template>
      </PageHeader>

      <!-- Riepilogo in una riga: le tre domande che si fanno su un socio (bozza 1B) -->
      <dl class="riepilogo" aria-label="Riepilogo del socio">
        <div class="riepilogo__voce">
          <dt>Quota {{ riepilogo.anno }}</dt>
          <dd :class="`tono--${TONI_QUOTA[riepilogo.quota]}`">
            <AppIcon
              v-if="ICONE_TONO[TONI_QUOTA[riepilogo.quota]]"
              :name="ICONE_TONO[TONI_QUOTA[riepilogo.quota]]"
            />
            {{ TESTI_STATO_ANNO[riepilogo.quota] }}
          </dd>
        </div>
        <div class="riepilogo__voce">
          <dt>Arretrati</dt>
          <dd :class="`tono--${tonoArretrati}`">
            <template v-if="riepilogo.pagamento.daReiscrivere">
              <AppIcon name="errore" /> Da reiscrivere: fermo da più di
              {{ MAX_ANNI_ARRETRATI }} anni
            </template>
            <template v-else-if="riepilogo.pagamento.arretrati.length > 0">
              {{ riepilogo.pagamento.arretrati.join(', ') }}
            </template>
            <template v-else>Nessuno</template>
          </dd>
        </div>
        <div class="riepilogo__voce">
          <dt>Voto alle elezioni {{ riepilogo.anno }}</dt>
          <dd :class="`tono--${TONI_VOTO[riepilogo.voto.stato]}`">
            <AppIcon
              v-if="ICONE_TONO[TONI_VOTO[riepilogo.voto.stato]]"
              :name="ICONE_TONO[TONI_VOTO[riepilogo.voto.stato]]"
            />
            {{ TESTI_VOTO[riepilogo.voto.stato] }}
          </dd>
          <dd v-if="riepilogo.voto.motivo" class="riepilogo__motivo">
            {{ riepilogo.voto.motivo }}
          </dd>
        </div>
      </dl>

      <div class="scheda__corpo">
        <!-- Pagamenti: una riga per anno -->
        <section class="scheda__sezione" aria-labelledby="titolo-pagamenti">
          <h2 id="titolo-pagamenti" class="scheda__titolo">Pagamenti</h2>
          <div class="gruppo tabella-scorre">
            <table class="pagamenti">
              <thead>
                <tr>
                  <th scope="col">Anno</th>
                  <th scope="col">Stato</th>
                  <th scope="col">Data</th>
                  <th scope="col" class="pagamenti__numero">Quota</th>
                  <th scope="col">Ricevuta</th>
                  <th scope="col"><span class="sr-only">Azioni</span></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="riga in righeTabella" :key="riga.chiave">
                  <!-- Anni precedenti: prima dell'ultimo pagamento, non sono arretrati (bozza 2A) -->
                  <tr v-if="riga.gruppo" class="pagamenti__gruppo">
                    <th scope="row">{{ riga.da }}–{{ riga.a }}</th>
                    <td colspan="4">Anni precedenti: {{ testoAnniPrecedenti(riga) }}</td>
                    <td class="pagamenti__azioni">
                      <button
                        type="button"
                        class="link-btn"
                        :aria-expanded="mostraPrecedenti ? 'true' : 'false'"
                        @click="mostraPrecedenti = !mostraPrecedenti"
                      >
                        {{ mostraPrecedenti ? 'Nascondi' : 'Mostra' }}
                        <span class="sr-only">gli anni precedenti</span>
                        <AppIcon
                          name="espandi"
                          :class="{ 'pagamenti__freccia--aperta': mostraPrecedenti }"
                        />
                      </button>
                    </td>
                  </tr>
                  <tr
                    v-else
                    :class="{
                      'pagamenti__riga--futura': riga.anno > annoCorrente,
                      'pagamenti__riga--precedente': riga.precedente,
                    }"
                  >
                    <th scope="row">{{ riga.anno }}</th>
                    <td>
                      <span class="stato" :class="`tono--${tonoRiga(riga)}`">
                        <AppIcon
                          v-if="ICONE_TONO[tonoRiga(riga)]"
                          :name="ICONE_TONO[tonoRiga(riga)]"
                        />
                        {{ testoRiga(riga) }}
                      </span>
                    </td>
                    <template v-if="riga.pagamento">
                      <td class="pagamenti__cifre">
                        {{ dataItaliana(riga.pagamento.data_pagamento) }}
                      </td>
                      <td class="pagamenti__numero">
                        <span
                          v-if="editingQuotaId === riga.pagamento.id_tesseramento"
                          class="quota-modifica"
                        >
                          <label :for="`quota-${riga.chiave}`" class="sr-only">
                            Quota {{ riga.anno }}
                          </label>
                          €
                          <input
                            :id="`quota-${riga.chiave}`"
                            v-model="editQuotaValue"
                            type="number"
                            min="0"
                            step="0.01"
                            class="quota-modifica__input"
                            @keydown.enter="saveQuotaStatus(riga.pagamento.id_tesseramento)"
                            @keydown.esc="cancelEditQuota"
                          />
                          <button
                            type="button"
                            class="icona-btn"
                            aria-label="Salva quota"
                            :disabled="saveQuotaLoading"
                            @click="saveQuotaStatus(riga.pagamento.id_tesseramento)"
                          >
                            <AppIcon name="conferma" />
                          </button>
                          <button
                            type="button"
                            class="icona-btn"
                            aria-label="Annulla modifica quota"
                            @click="cancelEditQuota"
                          >
                            <AppIcon name="chiudi" />
                          </button>
                        </span>
                        <template v-else>€ {{ euro(riga.pagamento.quota_pagata) }}</template>
                      </td>
                      <td class="pagamenti__ricevuta">{{ testoRicevuta(riga.pagamento) }}</td>
                      <td class="pagamenti__azioni">
                        <button
                          v-if="editingQuotaId !== riga.pagamento.id_tesseramento"
                          type="button"
                          class="icona-btn"
                          :aria-label="`Modifica la quota del ${riga.anno}`"
                          :title="`Modifica la quota del ${riga.anno}`"
                          @click="startEditQuota(riga.pagamento)"
                        >
                          <AppIcon name="modifica" />
                        </button>
                        <button
                          type="button"
                          class="icona-btn icona-btn--pericolo"
                          :aria-label="`Elimina il pagamento del ${riga.anno}`"
                          :title="`Elimina il pagamento del ${riga.anno}`"
                          @click="eliminaPagamento(riga)"
                        >
                          <AppIcon name="elimina" />
                        </button>
                      </td>
                    </template>
                    <template v-else>
                      <td colspan="3"></td>
                      <td class="pagamenti__azioni">
                        <button
                          v-if="riga.stato !== '-'"
                          type="button"
                          class="link-btn"
                          @click="payYear(riga.anno)"
                        >
                          {{ riga.precedente ? 'Registra' : 'Paga' }} {{ riga.anno }}
                        </button>
                      </td>
                    </template>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Anagrafica: righe nome-valore; Modifica apre il modulo del Nuovo socio (bozza 3A) -->
        <ListRows v-if="!editMode" title="Anagrafica" :rows="righeAnagrafica" />

        <section v-else class="scheda__sezione" aria-labelledby="titolo-modifica">
          <h2 id="titolo-modifica" class="scheda__titolo">Modifica anagrafica</h2>
          <form
            class="gruppo modifica"
            novalidate
            @submit.prevent="salvaModifiche"
            @keydown.esc="annullaModifica"
          >
            <ModuloSocio
              ref="modulo"
              v-model:dati="bozza"
              id-prefisso="scheda"
              :manicchie="manicchie"
              :anno-predefinito="primaIscrizioneDisplay"
              :mostra-errori="tentato"
              :disabilitato="isSaving"
              compatto
              modifica
            />
            <div class="modifica__azioni">
              <BaseButton variant="ghost" :disabled="isSaving" @click="annullaModifica">
                Annulla
              </BaseButton>
              <BaseButton type="submit" variant="primary" :loading="isSaving">
                <AppIcon name="salva" /> Salva le modifiche
              </BaseButton>
            </div>
          </form>
        </section>
      </div>

      <!-- Azioni rare, in fondo; la pericolosa a destra e non piena -->
      <section class="altre-azioni" aria-labelledby="titolo-altre-azioni">
        <h2 id="titolo-altre-azioni" class="scheda__titolo">Altre azioni</h2>
        <BaseButton @click="exportSocio">
          <AppIcon name="esporta" /> Esporta i dati del socio (JSON)
        </BaseButton>
        <BaseButton
          class="altre-azioni__elimina"
          :disabled="isDeleting || editMode"
          @click="showDeleteModal"
        >
          <AppIcon name="elimina" /> Elimina socio…
        </BaseButton>
      </section>

      <AddPaymentModal
        :show="showAddPaymentModal"
        :socio-id="socio?.id?.toString()"
        :years-to-pay="paymentYearToAdd ? [paymentYearToAdd] : []"
        :anno-riferimento="paymentYearToAdd || annoCorrente"
        @payments-saved="handlePaymentSaved"
        @close="closeAddPaymentModal"
      />

      <ConfirmDeleteModal
        :is-visible="showDeleteConfirmModal"
        :socio-name="`${socio.cognome} ${socio.nome}`"
        @close="closeDeleteModal"
        @confirm="confirmDeleteSocio"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'
import { askConfirm } from '@/composables/useDialog'
import {
  getSocioById,
  getTesseramentiBySocioId,
  addTesseramento,
  deleteSocio,
  deleteTesseramento,
  updateSocio,
  updateTesseramentoQuota,
  getUniqueGroups,
  addCustomGroup,
} from '@/services/db'
import { generateSingleCardPDF } from '@/services/export'
import {
  annoDaPagare,
  cronologiaSocio,
  dividiCronologia,
  riepilogoSocio,
  testoAnniPrecedenti,
} from '@/utils/schedaSocio'
import { isMinorenne, MAX_ANNI_ARRETRATI, TESTI_STATO_ANNO } from '@/utils/payment'
import { annoIscrizione } from '@/utils/iscrizione'
import { euro } from '@/utils/registrazione'
import { datiDaSalvare } from '@/utils/socio'
import { SENZA_MANICCHIA } from '@/utils/aventiDiritto'
import BaseButton from '@/components/base/BaseButton.vue'
import ListRows from '@/components/base/ListRows.vue'
import AddPaymentModal from '@/components/AddPaymentModal.vue'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import ModuloSocio from '@/components/ModuloSocio.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import PageHeader from '@/components/base/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const socio = ref(null)
const tesseramenti = ref([])
const loading = ref(true)
const error = ref(null)
const showAddPaymentModal = ref(false)
const paymentYearToAdd = ref(null)
const showDeleteConfirmModal = ref(false)
const isDeleting = ref(false)

// Navigazione tra i soci dell'ultima ricerca
const prevSocioId = ref(null)
const nextSocioId = ref(null)

// Stato -> tono (colore e icona). Lo stato si legge sempre anche a parole.
const TONI_QUOTA = { V: 'ok', X: 'errore', O: 'neutro', '-': 'neutro' }
const TESTI_VOTO = { si: 'Sì', regolarizza: 'Dopo gli arretrati', no: 'No' }
const TONI_VOTO = { si: 'ok', regolarizza: 'attenzione', no: 'neutro' }
const ICONE_TONO = { ok: 'ok', errore: 'errore', attenzione: 'attenzione' }

const annoCorrente = new Date().getFullYear()
const annoProposto = computed(() => annoDaPagare(tesseramenti.value, annoCorrente))
const riepilogo = computed(() => riepilogoSocio(socio.value, tesseramenti.value, annoCorrente))
const cronologia = computed(() => cronologiaSocio(socio.value, tesseramenti.value, annoCorrente))

// Anni precedenti (bozza 2A): chiusi, una riga che si apre con "Mostra"
const mostraPrecedenti = ref(false)
const righeTabella = computed(() => {
  const { recenti, precedenti, riassunto } = dividiCronologia(cronologia.value, annoCorrente)
  if (!riassunto) return recenti
  const gruppo = { chiave: 'anni-precedenti', gruppo: true, ...riassunto }
  const aperti = mostraPrecedenti.value ? precedenti.map((r) => ({ ...r, precedente: true })) : []
  return [...recenti, gruppo, ...aperti]
})
// Tra gli anni precedenti un anno senza pagamento non e' un arretrato: niente rosso
const nonArretrato = (riga) => riga.precedente && riga.stato === 'X'
const tonoRiga = (riga) => (nonArretrato(riga) ? 'neutro' : TONI_QUOTA[riga.stato])
const testoRiga = (riga) => (nonArretrato(riga) ? 'Non pagata' : TESTI_STATO_ANNO[riga.stato])
const tonoArretrati = computed(() => {
  const p = riepilogo.value.pagamento
  if (p.daReiscrivere) return 'errore'
  return p.arretrati.length > 0 ? 'attenzione' : 'neutro'
})

/** Date all'italiana: 2024-01-18 -> 18/01/2024. */
const dataItaliana = (valore) => {
  if (!valore) return ''
  const data = new Date(valore)
  if (isNaN(data)) return String(valore)
  return data.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const testoRicevuta = (p) => {
  if (!p.numero_ricevuta && !p.numero_blocchetto) return ''
  if (!p.numero_blocchetto) return String(p.numero_ricevuta)
  return `${p.numero_ricevuta || '?'}, blocchetto ${p.numero_blocchetto}`
}

/** Eta' compiuta oggi, dal compleanno; minorenne invece dal solo anno di nascita. */
const eta = computed(() => {
  const nascita = new Date(socio.value?.data_nascita)
  if (isNaN(nascita)) return null
  const oggi = new Date()
  let anni = oggi.getFullYear() - nascita.getFullYear()
  const mese = oggi.getMonth() - nascita.getMonth()
  if (mese < 0 || (mese === 0 && oggi.getDate() < nascita.getDate())) anni--
  return anni
})

/** Anno di iscrizione: il primo tra l'anno dichiarato e il primo pagamento (glossario). */
const primaIscrizioneDisplay = computed(() => {
  const anni = tesseramenti.value.map((t) => Number(t.anno))
  return annoIscrizione(socio.value, anni) ?? annoCorrente
})

const righeAnagrafica = computed(() => {
  const s = socio.value
  const nascita = [dataItaliana(s.data_nascita), s.luogo_nascita].filter(Boolean).join(', ')
  const dettagli = []
  if (eta.value !== null) dettagli.push(`${eta.value} anni`)
  if (isMinorenne(s.data_nascita, annoCorrente)) dettagli.push(`minorenne nel ${annoCorrente}`)
  return [
    {
      id: 'nascita',
      label: 'Nascita',
      value: [nascita || 'Non indicata', ...dettagli].join(' · '),
      readonly: true,
    },
    {
      id: 'manicchia',
      label: 'Manicchia',
      value: s.gruppo_appartenenza || SENZA_MANICCHIA,
      readonly: true,
    },
    {
      id: 'iscrizione',
      label: 'Anno di iscrizione',
      value: String(primaIscrizioneDisplay.value),
      readonly: true,
    },
    { id: 'note', label: 'Note', value: s.note || 'Nessuna', readonly: true },
  ]
})

// ---- Tessera dell'anno in corso ----
const stampaTessera = ref(false)
const generaTessera = async () => {
  stampaTessera.value = true
  try {
    await generateSingleCardPDF(socio.value, annoCorrente)
  } catch (err) {
    console.error('Tessera non generata:', err)
    toast.error('Non sono riuscito a creare la tessera: ' + err.message)
  } finally {
    stampaTessera.value = false
  }
}

const calculateNavigation = () => {
  try {
    const stored = localStorage.getItem('search_context_ids')
    if (!stored) return
    const ids = JSON.parse(stored)
    const idx = ids.indexOf(parseInt(route.params.id))
    prevSocioId.value = idx > 0 ? ids[idx - 1] : null
    nextSocioId.value = idx !== -1 && idx < ids.length - 1 ? ids[idx + 1] : null
  } catch (e) {
    console.error('Navigazione tra i soci non calcolata', e)
  }
}

const loadSocioData = async () => {
  loading.value = true
  error.value = null
  try {
    const socioId = parseInt(route.params.id)
    socio.value = await getSocioById(socioId)
    if (!socio.value) {
      error.value = 'Il socio non è in archivio: forse è stato eliminato.'
      return
    }
    tesseramenti.value = await getTesseramentiBySocioId(socioId)
    calculateNavigation()
  } catch (err) {
    console.error('Errore nel caricamento:', err)
    error.value = 'Non sono riuscito a leggere il socio: ' + err.message
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id,
  (nuovo) => {
    if (!nuovo) return
    editMode.value = false
    loadSocioData()
  },
)

// ---- Quota di un pagamento ----
const editingQuotaId = ref(null)
const editQuotaValue = ref(0)
const saveQuotaLoading = ref(false)

const startEditQuota = (tesseramento) => {
  editingQuotaId.value = tesseramento.id_tesseramento
  editQuotaValue.value = Number(tesseramento.quota_pagata || 0)
}

const cancelEditQuota = () => {
  editingQuotaId.value = null
  editQuotaValue.value = 0
}

const saveQuotaStatus = async (id_tesseramento) => {
  try {
    saveQuotaLoading.value = true
    await updateTesseramentoQuota(id_tesseramento, Number(editQuotaValue.value))
    toast.success('Quota aggiornata')
    await loadSocioData()
  } catch (err) {
    console.error('Errore aggiornamento quota:', err)
    toast.error('Quota non aggiornata: ' + err.message)
  } finally {
    saveQuotaLoading.value = false
    cancelEditQuota()
  }
}

// ---- Modifica dell'anagrafica (bozza 3A): stesso modulo e stesse regole del Nuovo socio ----
const editMode = ref(false)
const isSaving = ref(false)
const tentato = ref(false)
const modulo = ref(null)
const manicchie = ref([])
const bozza = ref({})
let originale = ''

const CAMPI = [
  'cognome',
  'nome',
  'data_nascita',
  'luogo_nascita',
  'gruppo_appartenenza',
  'data_prima_iscrizione',
  'note',
]
const campiDi = (s) => Object.fromEntries(CAMPI.map((c) => [c, s?.[c] ?? '']))
const modificheNonSalvate = computed(
  () => editMode.value && JSON.stringify(bozza.value) !== originale,
)

const apriModifica = async () => {
  if (editMode.value || !socio.value) return
  try {
    manicchie.value = await getUniqueGroups()
  } catch (err) {
    console.warn('Manicchie non lette', err)
    manicchie.value = []
  }
  bozza.value = campiDi(socio.value)
  originale = JSON.stringify(bozza.value)
  tentato.value = false
  editMode.value = true
}

const bottoneModifica = ref(null)

/** Chiude il modulo e riporta il fuoco su Modifica, da dove si era partiti. */
const chiudiModifica = async () => {
  editMode.value = false
  await nextTick()
  bottoneModifica.value?.$el?.focus()
}

const annullaModifica = () => {
  if (isSaving.value) return
  chiudiModifica()
}

const salvaModifiche = async () => {
  if (isSaving.value || !socio.value) return
  tentato.value = true
  if (modulo.value?.vaiAlPrimoErrore()) return

  isSaving.value = true
  try {
    const dati = datiDaSalvare(bozza.value)
    // Un anno di prima iscrizione cancellato si cancella anche in archivio
    dati.data_prima_iscrizione = dati.data_prima_iscrizione ?? null

    const manicchia = dati.gruppo_appartenenza
    if (manicchia && !manicchie.value.includes(manicchia)) {
      try {
        await addCustomGroup(manicchia)
      } catch (err) {
        console.warn('Manicchia nuova non aggiunta alla lista', err)
      }
    }

    // updateSocio registra la modifica: compare in Home › Ultime modifiche
    await updateSocio(socio.value.id, { ...dati, timestamp_modifica: Date.now() })
    socio.value = { ...socio.value, ...dati }
    toast.success('Modifiche salvate')
    chiudiModifica()
  } catch (err) {
    console.error('Errore nel salvataggio socio:', err)
    toast.error('Modifiche non salvate: ' + err.message)
  } finally {
    isSaving.value = false
  }
}

const exportSocio = () => {
  if (!socio.value) return
  try {
    const exportData = {
      export_type: 'single_socio',
      export_timestamp: new Date().toISOString(),
      socio: socio.value,
      tesseramenti: tesseramenti.value,
      metadata: {
        totale_tesseramenti: tesseramenti.value.length,
        anni_considerati: socio.value.data_prima_iscrizione,
        anni_totali_cronologia: cronologia.value.length,
      },
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `socio_${socio.value.cognome}_${socio.value.nome}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Errore esportazione socio:', err)
    toast.error('Dati del socio non esportati: ' + err.message)
  }
}

// ---- Pagamenti ----
const handlePaymentSaved = async ({ details, years, socioId }) => {
  try {
    for (const year of years) {
      await addTesseramento({
        id_socio: socioId,
        anno: year,
        quota_pagata: details.quota_pagata,
        data_pagamento: details.data_pagamento,
        numero_ricevuta: details.numero_ricevuta,
        numero_blocchetto: details.numero_blocchetto,
      })
    }
    await loadSocioData()
    closeAddPaymentModal()
    toast.success('Pagamento registrato')
  } catch (err) {
    console.error('Errore salvataggio pagamento:', err)
    toast.error('Pagamento non registrato: ' + err.message)
  }
}

const payYear = (anno) => {
  paymentYearToAdd.value = anno
  showAddPaymentModal.value = true
}

const closeAddPaymentModal = () => {
  showAddPaymentModal.value = false
  paymentYearToAdd.value = null
}

const eliminaPagamento = async (riga) => {
  const conferma = await askConfirm({
    title: `Eliminare il pagamento del ${riga.anno}?`,
    message: `Il pagamento di € ${euro(riga.pagamento.quota_pagata)} viene tolto dalla scheda di ${socio.value.cognome} ${socio.value.nome}. L'operazione non si annulla.`,
    confirmLabel: 'Elimina pagamento',
    danger: true,
  })
  if (!conferma) return

  try {
    await deleteTesseramento(riga.pagamento.id_tesseramento)
    await loadSocioData()
    toast.success('Pagamento eliminato')
  } catch (err) {
    toast.error('Pagamento non eliminato: ' + err.message)
  }
}

// ---- Eliminazione del socio ----
const showDeleteModal = () => {
  showDeleteConfirmModal.value = true
}

const closeDeleteModal = () => {
  showDeleteConfirmModal.value = false
}

const confirmDeleteSocio = async () => {
  if (!socio.value) return
  try {
    isDeleting.value = true
    await deleteSocio(socio.value.id)
    toast.success('Socio eliminato')
    router.push('/')
  } catch (err) {
    console.error('Errore eliminazione socio:', err)
    toast.error('Socio non eliminato: ' + err.message)
    showDeleteConfirmModal.value = false
  } finally {
    isDeleting.value = false
  }
}

// ---- Tastiera e uscita con modifiche non salvate ----
const handleBeforeUnload = (event) => {
  if (!modificheNonSalvate.value) return
  event.preventDefault()
  event.returnValue = ''
}

const handleKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    if (editMode.value) salvaModifiche()
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault()
    apriModifica()
    return
  }

  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
  if (showAddPaymentModal.value || showDeleteConfirmModal.value || editMode.value) return

  if (e.key === 'j' || e.key === 'ArrowRight') {
    if (nextSocioId.value) router.push('/socio/' + nextSocioId.value)
  }
  if (e.key === 'k' || e.key === 'ArrowLeft') {
    if (prevSocioId.value) router.push('/socio/' + prevSocioId.value)
  }
}

onMounted(() => {
  loadSocioData()
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.scheda {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-32);
}

/* Caricamento ed errore */
.scheda__stato {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-32) 0;
  color: var(--text-secondary);
}

.scheda__stato--errore {
  flex-direction: column;
  align-items: flex-start;
  color: var(--text-primary);
}

.scheda__stato--errore h1 {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin: 0;
  font-size: var(--font-size-section-heading);
}

.scheda__stato--errore p {
  margin: 0;
}

.scheda__torna {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  color: var(--accent-default);
  font-weight: 600;
}

.scheda__scorri {
  display: flex;
  gap: var(--space-12);
}

.scheda__scorri a {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  color: var(--text-secondary);
  font-size: var(--font-size-label);
  text-decoration: none;
}

.scheda__scorri a:hover {
  color: var(--text-primary);
}

.scheda__azioni {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-8);
}

/* Riepilogo in una riga */
.riepilogo {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8) var(--space-48);
  margin: 0 0 var(--space-24);
  padding: var(--space-12) var(--space-16);
  background: var(--background-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-surface);
}

.riepilogo__voce dt {
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
}

.riepilogo__voce dd {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin: var(--space-4) 0 0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.riepilogo__voce dd.riepilogo__motivo {
  margin: 0;
  font-size: var(--font-size-caption);
  font-weight: 400;
  color: var(--text-secondary);
}

.tono--ok {
  color: var(--status-success);
}

.tono--attenzione {
  color: var(--status-warning);
}

.tono--errore {
  color: var(--status-error);
}

.tono--neutro {
  color: var(--text-primary);
}

/* Pagamenti a sinistra, anagrafica a destra */
.scheda__corpo {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  align-items: start;
  gap: var(--space-24);
}

.scheda__sezione {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  min-width: 0;
}

/* Stesso titolo di sezione di ListRows */
.scheda__titolo {
  margin: 0;
  font-family: var(--font-family-body);
  font-size: var(--font-size-label);
  font-weight: 600;
  color: var(--text-secondary);
}

.gruppo {
  background: var(--background-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-surface);
}

.tabella-scorre {
  position: relative; /* tiene dentro anche le etichette nascoste (.sr-only) */
  overflow-x: auto;
}

.pagamenti {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-label);
}

.pagamenti th,
.pagamenti td {
  padding: var(--space-4) var(--space-12);
  text-align: left;
  white-space: nowrap;
}

.pagamenti tbody tr {
  border-top: 1px solid var(--border-subtle);
}

.pagamenti thead th {
  padding-block: var(--space-8) var(--space-4);
  color: var(--text-secondary);
  font-size: var(--font-size-caption);
  font-weight: 600;
}

.pagamenti tbody th {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.pagamenti__riga--futura {
  color: var(--text-secondary);
}

.pagamenti__gruppo,
.pagamenti__riga--precedente {
  background: var(--background-canvas);
}

.pagamenti__gruppo th,
.pagamenti__gruppo td {
  color: var(--text-secondary);
}

/* Rosso solo per gli arretrati veri: "Mostra" e "Registra" degli anni precedenti restano neutri */
.pagamenti__gruppo .link-btn,
.pagamenti__riga--precedente .link-btn {
  color: var(--text-primary);
}

.pagamenti__freccia--aperta {
  transform: rotate(180deg);
}

.pagamenti__cifre {
  font-variant-numeric: tabular-nums;
}

.pagamenti__numero {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.pagamenti th.pagamenti__numero {
  text-align: right;
}

.pagamenti__ricevuta {
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.pagamenti__azioni {
  width: 1%;
  text-align: right;
}

.stato {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  font-weight: 600;
}

.quota-modifica {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
}

.quota-modifica__input {
  width: 5.5rem;
  padding: var(--space-4) var(--space-8);
  box-shadow: none;
  font-size: var(--font-size-label);
  text-align: right;
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
  color: var(--text-secondary);
}

.icona-btn:hover:not(:disabled),
.link-btn:hover {
  background: var(--state-hover);
  color: var(--text-primary);
}

.icona-btn--pericolo:hover:not(:disabled) {
  color: var(--status-error);
}

.link-btn {
  color: var(--accent-default);
  font-size: var(--font-size-label);
  font-weight: 600;
}

/* Modifica dell'anagrafica */
.modifica {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  padding: var(--space-16);
}

.modifica__azioni {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-8);
}

/* Azioni rare */
.altre-azioni {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-12) var(--space-16);
  margin-top: var(--space-32);
  padding-top: var(--space-16);
  border-top: 1px solid var(--border-subtle);
}

.altre-azioni__elimina {
  margin-left: auto;
  color: var(--status-error);
  border-color: var(--status-error);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 900px) {
  .scheda__corpo {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 600px) {
  .scheda {
    padding: var(--space-16);
  }
}
</style>
