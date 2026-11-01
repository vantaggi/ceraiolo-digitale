<template>
  <div class="registra">
    <PageHeader title="Incassi" subtitle="Registra in fila le ricevute dei blocchetti di carta" />
    <SectionTabs :tabs="SCHEDE_INCASSI" label="Schede di Incassi" />

    <!-- Dati della sessione: una riga sola, si impostano una volta e si ricordano -->
    <section class="sessione" aria-label="Dati della sessione">
      <div class="sessione__campo">
        <label for="anno-riferimento">Anno</label>
        <input
          id="anno-riferimento"
          v-model.number="sessionData.annoRiferimento"
          type="number"
          class="sessione__input sessione__input--anno"
          :aria-invalid="!!sessionErrors.annoRiferimento"
          :min="currentYear"
          :max="currentYear + 5"
        />
      </div>
      <div class="sessione__campo">
        <label for="numero-blocchetto">Blocchetto</label>
        <input
          id="numero-blocchetto"
          v-model.number="sessionData.numeroBlocchetto"
          type="number"
          class="sessione__input sessione__input--blocchetto"
          :aria-invalid="!!sessionErrors.numeroBlocchetto"
          aria-describedby="intervallo-blocchetto"
          min="1"
        />
        <span v-if="intervallo" id="intervallo-blocchetto" class="sessione__nota">
          ricevute {{ intervallo.da }}–{{ intervallo.a }}
        </span>
      </div>
      <div class="sessione__campo">
        <label for="data-pagamento">Data delle ricevute</label>
        <input
          id="data-pagamento"
          v-model="sessionData.dataPagamento"
          type="date"
          class="sessione__input sessione__input--data"
          :aria-invalid="!!sessionErrors.dataPagamento"
          :max="today"
        />
      </div>
      <label class="sessione__suoni">
        <input v-model="soundEnabled" type="checkbox" />
        Suoni
      </label>
      <p v-if="erroriSessione" class="sessione__errore" role="alert">
        <AppIcon name="errore" /> {{ erroriSessione }}
      </p>
    </section>

    <div class="lavoro">
      <!-- Ricerca del socio: Invio registra subito l'anno con la quota proposta -->
      <section class="gruppo cerca" aria-label="Cerca il socio">
        <div class="cerca__campo">
          <label for="cerca-socio" class="cerca__etichetta">Cerca il socio</label>
          <div class="cerca__input">
            <input
              id="cerca-socio"
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              role="combobox"
              autocomplete="off"
              aria-autocomplete="list"
              aria-controls="risultati-ricerca"
              :aria-expanded="risultati.length > 0 ? 'true' : 'false'"
              :aria-activedescendant="
                selezionato >= 0 && risultati.length > 0 ? `risultato-${selezionato}` : undefined
              "
              aria-describedby="scorciatoie"
              placeholder="Cognome e nome"
              @input="debouncedSearch"
              @keydown="handleSearchKeydown"
              @focus="$event.target.select()"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="cerca__svuota"
              aria-label="Svuota la ricerca"
              @click="svuotaEFocus"
            >
              <AppIcon name="chiudi" />
            </button>
          </div>
        </div>

        <ul
          v-show="risultati.length > 0"
          id="risultati-ricerca"
          ref="resultsListRef"
          class="risultati"
          role="listbox"
          aria-label="Soci trovati"
        >
          <li
            v-for="(r, index) in risultati"
            :id="`risultato-${index}`"
            :key="r.socio.id"
            class="risultato"
            :class="{ 'risultato--selezionato': index === selezionato }"
            role="option"
            :aria-selected="index === selezionato ? 'true' : 'false'"
            @mousedown.prevent
            @mousemove="selezionato = index"
            @click="registraRisultato(index)"
          >
            <span class="risultato__chi">
              <span class="risultato__nome">{{ r.socio.cognome }} {{ r.socio.nome }}</span>
              <span class="risultato__dettaglio">{{ dettaglioSocio(r.socio) }}</span>
            </span>
            <span class="risultato__stato" :class="`tono--${proposte[index].stato.tono}`">
              <AppIcon
                v-if="ICONA_TONO[proposte[index].stato.tono]"
                :name="ICONA_TONO[proposte[index].stato.tono]"
              />
              {{ proposte[index].stato.testo }}
            </span>
            <span
              v-if="index === selezionato && proposte[index].registra"
              class="risultato__suggerimento"
              aria-hidden="true"
            >
              <kbd>Invio</kbd> registra € {{ euro(proposte[index].quota) }}
            </span>
          </li>
        </ul>

        <!-- Nessun risultato: si registra un socio nuovo con quello che si e' cercato -->
        <div
          v-if="
            searchQuery.trim().length >= 2 && cercato && risultati.length === 0 && !showNewSocioForm
          "
          class="cerca__vuoto"
        >
          <p>Nessun socio trovato per «{{ searchQuery.trim() }}».</p>
          <BaseButton :disabled="isProcessing" @click="openNewSocioForm({ daRicerca: true })">
            <AppIcon name="nuovo-socio" /> Registra come nuovo socio
          </BaseButton>
        </div>

        <!-- Nuovo socio -->
        <div v-if="showNewSocioForm" class="nuovo">
          <h2 class="nuovo__titolo">Nuovo socio</h2>
          <form novalidate @submit.prevent="saveNewSocio">
            <ModuloSocio
              ref="moduloNuovo"
              v-model:dati="newSocioData"
              id-prefisso="nuovo-socio-incassi"
              :manicchie="availableGroups"
              :soci="sociInArchivio"
              :anno-predefinito="sessionData.annoRiferimento"
              :mostra-errori="tentatoNuovo"
              :disabilitato="isProcessing"
              compatto
            />
            <div class="nuovo__azioni">
              <BaseButton variant="ghost" :disabled="isProcessing" @click="cancelNewSocio">
                Annulla
              </BaseButton>
              <BaseButton type="submit" :loading="isProcessing">
                <AppIcon name="salva" /> Salva e registra il {{ sessionData.annoRiferimento }}
              </BaseButton>
            </div>
          </form>
        </div>

        <div class="cerca__piede">
          <p id="scorciatoie" class="cerca__scorciatoie">
            <kbd>↑↓</kbd> scegli · <kbd>Invio</kbd> registra · <kbd>Ctrl+Invio</kbd> ricevuta
            successiva · <kbd>Esc</kbd> svuota
          </p>
          <BaseButton
            v-if="!showNewSocioForm"
            class="cerca__nuovo"
            :disabled="isProcessing"
            @click="openNewSocioForm()"
          >
            <AppIcon name="aggiungi" /> Nuovo socio
          </BaseButton>
        </div>
      </section>

      <div class="lavoro__lato">
        <!-- Ricevuta in corso -->
        <section class="gruppo ricevuta" aria-labelledby="ricevuta-titolo">
          <div class="ricevuta__testa">
            <h2 id="ricevuta-titolo" class="ricevuta__titolo">
              Ricevuta {{ currentReceipt.numero }}
            </h2>
            <span class="ricevuta__frecce">
              <button
                type="button"
                class="ricevuta__freccia"
                :disabled="isProcessing || currentReceipt.numero <= 1"
                aria-label="Ricevuta precedente"
                @click="decrementReceipt"
              >
                <AppIcon name="precedente" />
              </button>
              <button
                type="button"
                class="ricevuta__freccia"
                :disabled="isProcessing"
                aria-label="Ricevuta successiva"
                @click="incrementReceipt"
              >
                <AppIcon name="successivo" />
              </button>
            </span>
          </div>

          <!-- Esito dell'ultima azione: sempre nel DOM, cosi' il lettore di schermo lo legge -->
          <p class="esito" :class="esito && `esito--${esito.tono}`" role="status">
            <template v-if="esito">
              <AppIcon v-if="ICONA_TONO[esito.tono]" :name="ICONA_TONO[esito.tono]" />
              {{ esito.testo }}
            </template>
          </p>

          <p v-if="currentReceipt.soci.length === 0" class="ricevuta__vuota">
            Nessun socio su questa ricevuta. Cerca il socio e premi Invio.
          </p>
          <ul v-else class="ricevuta__righe">
            <li v-for="socio in currentReceipt.soci" :key="socio.id" class="riga">
              <span class="riga__chi">
                <span class="riga__nome">{{ socio.cognome }} {{ socio.nome }}</span>
                <button
                  v-for="anno in arretratiDaOffrire(socio)"
                  :key="anno"
                  type="button"
                  class="riga__arretrato"
                  :disabled="isProcessing"
                  @click="aggiungiArretrato(socio, anno)"
                >
                  <AppIcon name="aggiungi" /> Aggiungi l'arretrato {{ anno }}
                </button>
              </span>
              <span class="riga__anni">{{ socio.anniPagati.join(', ') }}</span>
              <span class="riga__importo">€ {{ euro(socio.importo) }}</span>
              <button
                type="button"
                class="riga__togli"
                :disabled="isProcessing"
                :aria-label="`Togli ${socio.cognome} ${socio.nome} dalla ricevuta`"
                @click="removeFromReceipt(socio)"
              >
                <AppIcon name="chiudi" />
              </button>
            </li>
          </ul>

          <p v-if="currentReceipt.soci.length > 0" class="ricevuta__totale">
            Totale <strong>€ {{ euro(totaleRicevuta) }}</strong>
          </p>

          <div class="ricevuta__azioni">
            <BaseButton
              variant="primary"
              class="ricevuta__successiva"
              :disabled="isProcessing"
              aria-keyshortcuts="Control+Enter"
              @click="incrementReceipt"
            >
              Ricevuta successiva <span class="ricevuta__tasti">(Ctrl+Invio)</span>
            </BaseButton>
          </div>
        </section>

        <RiquadroBlocchetto
          :numero="sessionData.numeroBlocchetto || 0"
          :riepilogo="riepilogoBlocco"
          :errore="erroreBlocco"
          :ricevuta-corrente="currentReceipt.numero"
          :disabilitato="isProcessing"
          @vai="vaiARicevuta"
          @successivo="blocchettoSuccessivo"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  searchSoci,
  addSocio,
  addTesseramento,
  getUniqueGroups,
  addCustomGroup,
  findExistingPaymentYear,
  deleteTesseramentiByReceipt,
  getSetting,
  getPagamentiBlocchetto,
  getNomiSoci,
  getAnniPagatiDiSoci,
  updateTesseramentoQuota,
  db,
} from '@/services/db'
import {
  QUOTA_NUOVI_PREDEFINITA,
  QUOTA_ORDINARIA_PREDEFINITA,
  quotaProposta,
  tipoQuota,
} from '@/utils/payment'
import {
  intervalloBlocchetto,
  pagamentiDelBlocchetto,
  ricevutaDaCuiRiprendere,
  riepilogoBlocchetto,
  sociDellaRicevuta,
} from '@/utils/blocchetto'
import { euro, propostaRegistrazione, quoteDopoArretrato } from '@/utils/registrazione'
import { askConfirm, dialogState } from '@/composables/useDialog'
import AppIcon from '@/components/base/AppIcon.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import SectionTabs from '@/components/base/SectionTabs.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import RiquadroBlocchetto from '@/components/RiquadroBlocchetto.vue'
import ModuloSocio from '@/components/ModuloSocio.vue'
import { datiDaSalvare } from '@/utils/socio'
import { SCHEDE_INCASSI } from '@/router/sezioni'

const searchInput = ref(null)
const resultsListRef = ref(null)

const ICONA_TONO = { ok: 'ok', attenzione: 'attenzione', errore: 'errore', neutro: 'info' }

// Dati di sessione: si ricordano tra una visita e l'altra (solo comodita', nel browser)
const CHIAVE_SESSIONE = 'incassi_sessione'
const sessioneSalvata = () => {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE_SESSIONE) || '{}')
    return {
      ...(Number.isInteger(s.annoRiferimento) ? { annoRiferimento: s.annoRiferimento } : {}),
      ...(Number.isInteger(s.numeroBlocchetto) && s.numeroBlocchetto > 0
        ? { numeroBlocchetto: s.numeroBlocchetto }
        : {}),
      ...(/^\d{4}-\d{2}-\d{2}$/.test(s.dataPagamento || '')
        ? { dataPagamento: s.dataPagamento }
        : {}),
    }
  } catch {
    return {}
  }
}
const sessionData = reactive({
  annoRiferimento: new Date().getFullYear(),
  numeroBlocchetto: 1,
  dataPagamento: new Date().toISOString().split('T')[0],
  ...sessioneSalvata(),
})
watch(sessionData, () => {
  try {
    localStorage.setItem(CHIAVE_SESSIONE, JSON.stringify(sessionData))
  } catch {
    // senza memoria del browser la pagina funziona lo stesso
  }
})
// Da Incassi › Blocchetti, "Registra" apre la pagina su quel blocchetto (?blocchetto=N)
const bloccoRichiesto = Number(useRoute().query.blocchetto)
if (Number.isInteger(bloccoRichiesto) && bloccoRichiesto > 0) {
  sessionData.numeroBlocchetto = bloccoRichiesto
}

const sessionErrors = reactive({
  annoRiferimento: '',
  numeroBlocchetto: '',
  dataPagamento: '',
})

// Ricevuta in corso
const currentReceipt = reactive({
  numero: 1,
  soci: [],
})

// Pagamenti gia' registrati sul blocchetto: da qui vengono il riquadro del blocchetto
// e i soci della ricevuta in corso (anche quelli inseriti in un'altra sessione)
const pagamentiBlocco = ref([])
const riepilogoBlocco = ref(null)
const erroreBlocco = ref('')
const nomiSoci = new Map()

// Ricerca
const searchQuery = ref('')
const risultati = ref([]) // [{ socio, anniPagati }]
const selezionato = ref(-1)
const cercato = ref(false) // la ricerca del testo attuale e' finita
const isProcessing = ref(false)

// Esito dell'ultima azione, mostrato nella ricevuta: { testo, tono: ok|attenzione|errore|neutro }
const esito = ref(null)

// Arretrati da proporre sulla riga della ricevuta per i soci registrati in questa sessione:
// id socio -> { socio, anni }
const arretratiOfferti = reactive(new Map())

// Nuovo socio
const showNewSocioForm = ref(false)
const newSocioData = reactive({
  cognome: '',
  nome: '',
  data_nascita: '',
  luogo_nascita: '',
  gruppo_appartenenza: '',
  data_prima_iscrizione: '',
  note: '',
})
const moduloNuovo = ref(null)
const tentatoNuovo = ref(false)
const sociInArchivio = ref([])
const cittaPredefinita = ref('Gubbio')
const availableGroups = ref([])

// Impostazioni
const config = ref({
  receiptsPerBlock: 10,
  defaultQuota: QUOTA_ORDINARIA_PREDEFINITA,
  newMemberQuota: QUOTA_NUOVI_PREDEFINITA,
})
const quote = computed(() => ({
  quotaOrdinaria: Number(config.value.defaultQuota),
  quotaNuovi: Number(config.value.newMemberQuota),
}))

// Suoni di conferma e di errore (Web Audio, nessun file)
const soundEnabled = ref(true)
const suona = ({ tipo, da, a, durata }) => {
  if (!soundEnabled.value) return
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    oscillator.type = tipo
    oscillator.frequency.setValueAtTime(da, audioCtx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(a, audioCtx.currentTime + durata)
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durata)
    oscillator.start()
    oscillator.stop(audioCtx.currentTime + durata + 0.05)
  } catch {
    // senza audio la pagina funziona lo stesso
  }
}
const playSuccessSound = () => suona({ tipo: 'sine', da: 523.25, a: 1046.5, durata: 0.1 })
const playErrorSound = () => suona({ tipo: 'sawtooth', da: 150, a: 100, durata: 0.2 })

const today = new Date().toISOString().split('T')[0]
const currentYear = new Date().getFullYear()

const intervallo = computed(() =>
  intervalloBlocchetto(sessionData.numeroBlocchetto, config.value.receiptsPerBlock),
)
const totaleRicevuta = computed(() =>
  currentReceipt.soci.reduce((somma, s) => somma + (Number(s.importo) || 0), 0),
)
const erroriSessione = computed(() =>
  [sessionErrors.annoRiferimento, sessionErrors.numeroBlocchetto, sessionErrors.dataPagamento]
    .filter(Boolean)
    .join(' · '),
)

/** Che cosa farebbe Invio su ciascun socio trovato (utils/registrazione.js). */
const proposte = computed(() =>
  risultati.value.map((r) =>
    propostaRegistrazione({
      socio: r.socio,
      anniPagati: r.anniPagati,
      anno: sessionData.annoRiferimento,
      quote: quote.value,
      sullaRicevuta: currentReceipt.soci.some((s) => s.id === r.socio.id),
    }),
  ),
)

const nomeDi = (socio) => `${socio.cognome} ${socio.nome}`.trim()

const dettaglioSocio = (socio) =>
  [socio.data_nascita ? `nascita ${formatDate(socio.data_nascita)}` : '', socio.gruppo_appartenenza]
    .filter(Boolean)
    .join(' · ')

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return Number.isNaN(date.getTime()) ? dateString : date.toLocaleDateString('it-IT')
}

/** Soci della ricevuta in corso, dai pagamenti del blocchetto. */
const aggiornaRicevuta = async () => {
  const soci = sociDellaRicevuta(pagamentiBlocco.value, currentReceipt.numero)
  const daCercare = soci.map((s) => s.id).filter((id) => !nomiSoci.has(id))
  if (daCercare.length > 0) {
    for (const [id, nome] of await getNomiSoci(daCercare)) nomiSoci.set(id, nome)
  }
  // In ordine di cognome e nome: i pagamenti non dicono in che ordine sono stati scritti
  currentReceipt.soci = soci
    .map((s) => ({
      ...s,
      cognome: nomiSoci.get(s.id)?.cognome || '(socio non trovato)',
      nome: nomiSoci.get(s.id)?.nome || '',
    }))
    .sort((a, b) => nomeDi(a).localeCompare(nomeDi(b), 'it'))
}

/**
 * Rilegge i pagamenti del blocchetto. Con `riprendi` porta la ricevuta in corso
 * alla prima ancora da inserire del blocchetto (impostazione "Ricevute per blocchetto").
 */
const caricaBlocchetto = async ({ riprendi = false } = {}) => {
  const numero = sessionData.numeroBlocchetto
  erroreBlocco.value = ''
  try {
    const pagamenti = pagamentiDelBlocchetto(await getPagamentiBlocchetto(numero), numero)
    if (numero !== sessionData.numeroBlocchetto) return // nel frattempo e' cambiato
    pagamentiBlocco.value = pagamenti
    riepilogoBlocco.value = riepilogoBlocchetto(
      pagamenti,
      intervalloBlocchetto(numero, config.value.receiptsPerBlock),
    )
  } catch (error) {
    console.error('Lettura del blocchetto non riuscita:', error)
    pagamentiBlocco.value = []
    riepilogoBlocco.value = null
    erroreBlocco.value = 'Non sono riuscito a leggere le ricevute di questo blocchetto.'
  }
  if (riprendi && numero > 0) {
    // La prima ricevuta ancora da inserire; se il blocchetto non si legge, la prima del blocchetto
    const daRiprendere = riepilogoBlocco.value && ricevutaDaCuiRiprendere(riepilogoBlocco.value)
    currentReceipt.numero = daRiprendere ?? (numero - 1) * config.value.receiptsPerBlock + 1
  }
  await aggiornaRicevuta()
}

const focusRicerca = () =>
  nextTick(() => {
    searchInput.value?.focus()
    searchInput.value?.select()
  })

const vaiARicevuta = async (numero) => {
  currentReceipt.numero = numero
  esito.value = null
  clearSearch()
  await aggiornaRicevuta()
  focusRicerca()
}

const blocchettoSuccessivo = () => {
  sessionData.numeroBlocchetto = (sessionData.numeroBlocchetto || 0) + 1
  focusRicerca()
}

const incrementReceipt = () => vaiARicevuta(currentReceipt.numero + 1)

const decrementReceipt = () => {
  if (currentReceipt.numero > 1) vaiARicevuta(currentReceipt.numero - 1)
}

const validateSessionData = () => {
  sessionErrors.annoRiferimento = !sessionData.annoRiferimento ? 'Anno obbligatorio' : ''
  sessionErrors.numeroBlocchetto =
    !sessionData.numeroBlocchetto || sessionData.numeroBlocchetto < 1
      ? 'Numero blocchetto valido obbligatorio'
      : ''
  sessionErrors.dataPagamento = !sessionData.dataPagamento ? 'Data pagamento obbligatoria' : ''
}

const loadGroups = async () => {
  try {
    availableGroups.value = (await getUniqueGroups()) || []
  } catch (error) {
    console.error('Errore caricamento gruppi:', error)
    availableGroups.value = []
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleGlobalKeydown)
  try {
    await db.open()
    config.value.receiptsPerBlock = await getSetting('receiptsPerBlock', 10)
    config.value.defaultQuota = await getSetting('defaultQuota', QUOTA_ORDINARIA_PREDEFINITA)
    config.value.newMemberQuota = await getSetting('newMemberQuota', QUOTA_NUOVI_PREDEFINITA)
    cittaPredefinita.value = await getSetting('defaultCity', 'Gubbio')
    newSocioData.luogo_nascita = cittaPredefinita.value

    await loadGroups()
    validateSessionData()
    await caricaBlocchetto({ riprendi: true })
    focusRicerca()
  } catch (error) {
    console.error('Errore inizializzazione database:', error)
    esito.value = { testo: 'Non sono riuscito ad aprire i dati di questo browser.', tono: 'errore' }
  }
})

watch(() => sessionData.annoRiferimento, validateSessionData)
watch(() => sessionData.numeroBlocchetto, validateSessionData)
watch(
  () => sessionData.numeroBlocchetto,
  () => {
    riepilogoBlocco.value = null
    caricaBlocchetto({ riprendi: true })
  },
)
watch(() => sessionData.dataPagamento, validateSessionData)

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  clearTimeout(searchTimeout)
})

const conCtrl = (e) => e.ctrlKey || e.metaKey

/**
 * Tasti di tutta la pagina: Ctrl+Invio passa alla ricevuta successiva; le frecce a
 * sinistra e a destra cambiano ricevuta quando non si sta scrivendo (o la ricerca e' vuota).
 */
const handleGlobalKeydown = (e) => {
  if (dialogState.open || showNewSocioForm.value) return
  const attivo = document.activeElement
  const inRicerca = searchInput.value && attivo === searchInput.value

  if (e.key === 'Enter' && conCtrl(e)) {
    if (inRicerca) return // ci pensa handleSearchKeydown
    e.preventDefault()
    incrementReceipt()
    return
  }

  const scrivendo = ['INPUT', 'TEXTAREA', 'SELECT'].includes(attivo?.tagName)
  if (scrivendo && !(inRicerca && !searchQuery.value)) return
  if (e.key === 'ArrowLeft') decrementReceipt()
  else if (e.key === 'ArrowRight') incrementReceipt()
}

const clearSearch = () => {
  clearTimeout(searchTimeout)
  searchQuery.value = ''
  risultati.value = []
  selezionato.value = -1
  cercato.value = false
  showNewSocioForm.value = false
  resetNewSocioForm()
}

const svuotaEFocus = () => {
  clearSearch()
  focusRicerca()
}

const resetNewSocioForm = () => {
  Object.assign(newSocioData, {
    cognome: '',
    nome: '',
    data_nascita: '',
    luogo_nascita: cittaPredefinita.value,
    gruppo_appartenenza: '',
    data_prima_iscrizione: '',
    note: '',
  })
  tentatoNuovo.value = false
  moduloNuovo.value?.azzera()
}

/**
 * Apre il modulo del nuovo socio. Da "Nessun socio trovato" porta con se' quello che
 * si era cercato: la prima parola come cognome, il resto come nome.
 */
const openNewSocioForm = async ({ daRicerca = false } = {}) => {
  const parole = daRicerca ? searchQuery.value.trim().split(/\s+/) : []
  if (!daRicerca) {
    searchQuery.value = ''
    risultati.value = []
  }
  showNewSocioForm.value = true
  resetNewSocioForm()
  newSocioData.cognome = parole[0] || ''
  newSocioData.nome = parole.slice(1).join(' ')
  nextTick(() => moduloNuovo.value?.primoCampo())
  try {
    sociInArchivio.value = await db.soci.toArray()
  } catch (error) {
    console.error('Soci per il controllo omonimi non letti:', error)
  }
}

let searchTimeout = null
let ricercaInCorso = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  cercato.value = false
  if (searchQuery.value.trim().length < 2) {
    risultati.value = []
    selezionato.value = -1
    showNewSocioForm.value = false
    return
  }
  searchTimeout = setTimeout(() => {
    searchTimeout = null
    performSearch()
  }, 150)
}

const performSearch = async () => {
  const testo = searchQuery.value.trim()
  if (testo.length < 2) return
  const corrente = (ricercaInCorso = Symbol())
  try {
    const soci = await searchSoci(testo)
    const anni = await getAnniPagatiDiSoci(soci.map((s) => s.id))
    if (corrente !== ricercaInCorso) return // nel frattempo si e' scritto altro
    risultati.value = soci.map((socio) => ({ socio, anniPagati: anni.get(Number(socio.id)) || [] }))
    selezionato.value = risultati.value.length > 0 ? 0 : -1
    showNewSocioForm.value = false
    cercato.value = true
  } catch (error) {
    console.error('Errore ricerca:', error)
    risultati.value = []
    esito.value = { testo: 'La ricerca non è riuscita: riprova.', tono: 'errore' }
  }
}

const scrollToSelected = () => {
  nextTick(() => {
    const el = resultsListRef.value?.children[selezionato.value]
    el?.scrollIntoView?.({ block: 'nearest' })
  })
}

const handleSearchKeydown = async (e) => {
  if (e.key === 'Escape') {
    if (searchQuery.value) {
      e.preventDefault()
      clearSearch()
    }
    return
  }
  if (e.key === 'Enter' && conCtrl(e)) {
    e.preventDefault()
    incrementReceipt()
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    if (searchTimeout) {
      // Invio prima che la ricerca sia partita: si cerca subito e si mostrano i risultati,
      // senza registrare un socio che non si e' ancora visto
      clearTimeout(searchTimeout)
      searchTimeout = null
      await performSearch()
      return
    }
    if (selezionato.value >= 0) await registraRisultato(selezionato.value)
    return
  }
  if (risultati.value.length === 0) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selezionato.value = Math.min(selezionato.value + 1, risultati.value.length - 1)
    scrollToSelected()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selezionato.value = Math.max(selezionato.value - 1, 0)
    scrollToSelected()
  }
}

/**
 * Registra un anno sulla ricevuta in corso, con data e blocchetto della sessione.
 * @returns {Promise<boolean>} true se il pagamento e' stato salvato
 */
const registraPagamento = async (socio, anno, quota) => {
  if (erroriSessione.value) {
    esito.value = { testo: `Controlla i dati in alto: ${erroriSessione.value}.`, tono: 'errore' }
    playErrorSound()
    return false
  }
  isProcessing.value = true
  try {
    if (await findExistingPaymentYear(socio.id, [anno])) {
      esito.value = {
        testo: `${nomeDi(socio)} ha già pagato la quota ${anno}.`,
        tono: 'attenzione',
      }
      playErrorSound()
      return false
    }
    await addTesseramento({
      id_socio: socio.id,
      anno,
      quota_pagata: quota,
      data_pagamento: sessionData.dataPagamento,
      numero_ricevuta: currentReceipt.numero,
      numero_blocchetto: sessionData.numeroBlocchetto,
    })
    nomiSoci.set(socio.id, { cognome: socio.cognome, nome: socio.nome })
    // La scheda del socio rilegge i pagamenti
    localStorage.removeItem(`socio_${socio.id}`)
    await caricaBlocchetto()
    esito.value = { testo: `Registrato ${nomeDi(socio)}, ${anno}, € ${euro(quota)}`, tono: 'ok' }
    playSuccessSound()
    return true
  } catch (error) {
    console.error('Registrazione non riuscita:', error)
    esito.value = {
      testo: `Non sono riuscito a registrare ${nomeDi(socio)}: ${error.message}`,
      tono: 'errore',
    }
    playErrorSound()
    return false
  } finally {
    isProcessing.value = false
  }
}

/** Invio o clic su un socio trovato: registra subito l'anno con la quota proposta. */
const registraRisultato = async (indice) => {
  const r = risultati.value[indice]
  const proposta = proposte.value[indice]
  if (!r || !proposta || isProcessing.value) return
  if (!proposta.registra) {
    esito.value = { testo: proposta.messaggio, tono: 'neutro' }
    playErrorSound()
    return
  }
  if (await registraPagamento(r.socio, proposta.anno, proposta.quota)) {
    if (proposta.arretrati.length > 0) {
      arretratiOfferti.set(r.socio.id, { socio: r.socio, anni: [...proposta.arretrati] })
    }
    clearSearch()
    focusRicerca()
  }
}

/** Arretrati proposti sulla riga della ricevuta, tolti quelli gia' su questa ricevuta. */
const arretratiDaOffrire = (riga) =>
  (arretratiOfferti.get(riga.id)?.anni || []).filter((a) => !riga.anniPagati.includes(a))

/** "Aggiungi l'arretrato": stesso socio, stessa ricevuta, quota proposta per quell'anno. */
const aggiungiArretrato = async (riga, anno) => {
  const offerta = arretratiOfferti.get(riga.id)
  if (!offerta || isProcessing.value) return
  let quota
  let anniPagati
  try {
    anniPagati = (await getAnniPagatiDiSoci([riga.id])).get(Number(riga.id)) || []
    quota = quotaProposta(tipoQuota(offerta.socio, anniPagati, anno), quote.value)
  } catch (error) {
    console.error('Anni pagati non letti:', error)
    esito.value = {
      testo: `Non sono riuscito a leggere i pagamenti di ${nomeDi(riga)}.`,
      tono: 'errore',
    }
    return
  }
  if (await registraPagamento(offerta.socio, anno, quota)) {
    offerta.anni = offerta.anni.filter((a) => a !== anno)
    if (offerta.anni.length === 0) arretratiOfferti.delete(riga.id)
    await correggiQuoteDopoArretrato(offerta.socio, anniPagati, anno, quota)
  }
  focusRicerca()
}

/**
 * Un rientro che salda gli arretrati paga la quota ordinaria (scelta di Cioti,
 * 1 novembre 2026): dopo l'arretrato le quote del socio su questa ricevuta si ricalcolano.
 */
const correggiQuoteDopoArretrato = async (socio, anniPrima, anno, quota) => {
  const pagamenti = pagamentiBlocco.value.filter(
    (t) =>
      Number(t.id_socio) === Number(socio.id) &&
      Number(t.numero_ricevuta) === Number(currentReceipt.numero),
  )
  const correzioni = quoteDopoArretrato({
    socio,
    pagamenti,
    anniPrima,
    anniDopo: [...anniPrima, anno],
    quote: quote.value,
  })
  if (correzioni.length === 0) return
  try {
    for (const c of correzioni) await updateTesseramentoQuota(c.id_tesseramento, c.a)
    await caricaBlocchetto()
    const cambi = correzioni.map((c) => `la quota ${c.anno} passa a € ${euro(c.a)}`).join(', ')
    esito.value = {
      testo: `Registrato ${nomeDi(socio)}, ${anno}, € ${euro(quota)}: con gli arretrati saldati ${cambi}.`,
      tono: 'ok',
    }
  } catch (error) {
    console.error('Quote non corrette:', error)
    esito.value = {
      testo: `Arretrato registrato, ma non sono riuscito a correggere la quota del rientro di ${nomeDi(socio)}: ${error.message}`,
      tono: 'errore',
    }
  }
}

const cancelNewSocio = () => {
  showNewSocioForm.value = false
  resetNewSocioForm()
  focusRicerca()
}

const saveNewSocio = async () => {
  if (isProcessing.value) return
  tentatoNuovo.value = true
  if (moduloNuovo.value?.vaiAlPrimoErrore()) return
  if (erroriSessione.value) {
    esito.value = { testo: `Controlla i dati in alto: ${erroriSessione.value}.`, tono: 'errore' }
    return
  }

  isProcessing.value = true
  try {
    const socioData = datiDaSalvare(newSocioData)
    // Senza anno di prima iscrizione vale l'anno che si sta incassando
    socioData.data_prima_iscrizione ??= sessionData.annoRiferimento
    const manicchia = socioData.gruppo_appartenenza
    if (manicchia && !availableGroups.value.includes(manicchia)) {
      await addCustomGroup(manicchia)
      await loadGroups()
    }

    const socioId = await addSocio(socioData)
    const quota = config.value.newMemberQuota
    await addTesseramento({
      id_socio: socioId,
      anno: sessionData.annoRiferimento,
      quota_pagata: quota,
      data_pagamento: sessionData.dataPagamento,
      numero_ricevuta: currentReceipt.numero,
      numero_blocchetto: sessionData.numeroBlocchetto,
    })

    nomiSoci.set(socioId, { cognome: socioData.cognome, nome: socioData.nome })
    await caricaBlocchetto()
    esito.value = {
      testo: `Nuovo socio ${nomeDi(socioData)}, registrato ${sessionData.annoRiferimento}, € ${euro(quota)}`,
      tono: 'ok',
    }
    playSuccessSound()
    clearSearch()
    focusRicerca()
  } catch (error) {
    console.error('Errore creazione socio:', error)
    esito.value = { testo: 'Non sono riuscito a salvare il nuovo socio.', tono: 'errore' }
    playErrorSound()
  } finally {
    isProcessing.value = false
  }
}

const removeFromReceipt = async (socio) => {
  const nome = nomeDi(socio)
  const anni = socio.anniPagati.join(', ')
  const cosa =
    socio.anniPagati.length > 1
      ? `Si cancellano i pagamenti ${anni} registrati`
      : `Si cancella il pagamento ${anni} registrato`
  const conferma = await askConfirm({
    title: `Togliere ${nome} dalla ricevuta ${currentReceipt.numero}?`,
    message: `${cosa} su questa ricevuta.`,
    confirmLabel: 'Togli dalla ricevuta',
    danger: true,
  })
  if (!conferma) {
    focusRicerca()
    return
  }

  isProcessing.value = true
  try {
    const tolti = await deleteTesseramentiByReceipt(
      socio.id,
      currentReceipt.numero,
      socio.anniPagati,
    )
    await caricaBlocchetto()
    localStorage.removeItem(`socio_${socio.id}`)
    arretratiOfferti.delete(socio.id)
    esito.value =
      tolti > 0
        ? { testo: `Tolto ${nome} dalla ricevuta ${currentReceipt.numero}.`, tono: 'ok' }
        : {
            testo: `Non ho trovato i pagamenti di ${nome} su questa ricevuta: niente è stato tolto.`,
            tono: 'attenzione',
          }
  } catch (error) {
    console.error('Error deleting payments:', error)
    esito.value = { testo: `Non sono riuscito a togliere ${nome} dalla ricevuta.`, tono: 'errore' }
  } finally {
    isProcessing.value = false
    if (searchQuery.value) performSearch()
    focusRicerca()
  }
}
</script>

<style scoped>
.registra {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-32);
}

/* Gruppi: superficie con bordo sottile, righe separate da un filo */
.gruppo {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--background-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-surface);
}

kbd {
  display: inline-block;
  padding: 0 var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-control);
  background: var(--background-surface);
  color: var(--text-secondary);
  font-family: var(--font-family-body);
  font-size: var(--font-size-caption);
  line-height: 1.4;
}

/* Dati della sessione: una riga sola */
.sessione {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-8) var(--space-24);
  margin-bottom: var(--space-16);
  padding: var(--space-8) var(--space-16);
  background: var(--background-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-surface);
}

.sessione__campo {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.sessione__campo label {
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--text-secondary);
}

.sessione__input {
  padding: var(--space-4) var(--space-8);
  box-shadow: none;
  font-size: var(--font-size-body);
  font-variant-numeric: tabular-nums;
}

.sessione__input--anno {
  width: 5.5rem;
}

.sessione__input--blocchetto {
  width: 4.5rem;
}

.sessione__input--data {
  width: 10.5rem;
}

.sessione__input[aria-invalid='true'] {
  border-color: var(--status-error);
}

.sessione__nota {
  font-size: var(--font-size-label);
  color: var(--text-secondary);
  white-space: nowrap;
}

.sessione__suoni {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin-left: auto;
  font-size: var(--font-size-label);
  color: var(--text-secondary);
  cursor: pointer;
}

.sessione__suoni input {
  width: auto;
  accent-color: var(--accent-default);
}

.sessione__errore {
  flex-basis: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-8);
  color: var(--status-error);
  font-size: var(--font-size-label);
}

/* Ricerca a sinistra, ricevuta e blocchetto a destra */
.lavoro {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: var(--space-16);
  align-items: start;
}

.lavoro__lato {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  min-width: 0;
  position: sticky;
  top: var(--space-16);
}

/* Ricerca */
.cerca__campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-12) var(--space-16) var(--space-8);
}

.cerca__etichetta {
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--text-secondary);
}

.cerca__input {
  position: relative;
}

.cerca__input input {
  padding: var(--space-8) var(--space-48) var(--space-8) var(--space-12);
  box-shadow: none;
}

.cerca__input input:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.cerca__svuota {
  position: absolute;
  top: 50%;
  right: var(--space-8);
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: var(--radius-control);
  background: none;
  box-shadow: none;
  color: var(--text-secondary);
}

.cerca__svuota:hover {
  background: var(--state-hover);
  color: var(--text-primary);
}

.risultati {
  list-style: none;
  max-height: min(24rem, 50vh);
  overflow-y: auto;
}

.risultato {
  line-height: 1.4;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4) var(--space-16);
  padding: var(--space-8) var(--space-16) var(--space-8) var(--space-12);
  border-top: 1px solid var(--border-subtle);
  border-left: 4px solid transparent;
  cursor: pointer;
}

.risultato--selezionato {
  background: var(--state-selected);
  border-left-color: var(--accent-default);
}

.risultato__chi {
  display: flex;
  flex-direction: column;
  flex: 1 1 12rem;
  min-width: 0;
}

.risultato__nome {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.risultato__dettaglio {
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
}

.risultato__stato {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--font-size-label);
  font-variant-numeric: tabular-nums;
}

.risultato__suggerimento {
  font-size: var(--font-size-label);
  color: var(--text-secondary);
  white-space: nowrap;
}

.tono--ok {
  color: var(--status-success);
}

.tono--attenzione {
  color: var(--status-warning);
}

.tono--neutro {
  color: var(--text-secondary);
}

.cerca__vuoto {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8) var(--space-16);
  padding: var(--space-12) var(--space-16);
  border-top: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.nuovo {
  padding: var(--space-12) var(--space-16) var(--space-16);
  border-top: 1px solid var(--border-subtle);
}

.nuovo__titolo {
  margin: 0 0 var(--space-12);
  font-size: var(--font-size-section-heading);
}

.nuovo__azioni {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-8);
  margin-top: var(--space-16);
}

.cerca__piede {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-8) var(--space-12);
  padding: var(--space-8) var(--space-16);
  border-top: 1px solid var(--border-subtle);
}

.cerca__scorciatoie {
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
}

.cerca__nuovo {
  margin-left: auto;
}

/* Ricevuta */
.ricevuta__testa {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-12) var(--space-16) var(--space-8);
}

.ricevuta__titolo {
  margin: 0;
  font-size: var(--font-size-section-heading);
  font-variant-numeric: tabular-nums;
}

.ricevuta__frecce {
  display: flex;
  gap: var(--space-4);
  margin-left: auto;
}

.ricevuta__freccia {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-control);
  background: var(--background-surface);
  box-shadow: none;
  color: var(--text-primary);
}

.ricevuta__freccia:hover:not(:disabled) {
  background: var(--state-hover);
}

.ricevuta__freccia:disabled {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
}

.esito {
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin: 0 var(--space-16) var(--space-8);
  padding: var(--space-4) var(--space-12);
  border-radius: var(--radius-control);
  font-size: var(--font-size-label);
}

.esito:empty {
  display: none;
}

.esito--ok {
  background: var(--status-success-subtle);
}

.esito--ok :deep(svg) {
  color: var(--status-success);
}

.esito--attenzione {
  border-left: 3px solid var(--status-warning);
  border-radius: 0;
  background: var(--state-hover);
}

.esito--errore {
  color: var(--status-error);
}

.esito--neutro {
  background: var(--state-hover);
}

.ricevuta__vuota {
  padding: var(--space-12) var(--space-16);
  border-top: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: var(--font-size-label);
}

.ricevuta__righe {
  list-style: none;
}

.riga {
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-4) var(--space-8) var(--space-4) var(--space-16);
  border-top: 1px solid var(--border-subtle);
}

.riga__chi {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}

.riga__nome {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.riga__arretrato {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  padding: 0;
  border: none;
  background: none;
  box-shadow: none;
  color: var(--accent-default);
  font-size: var(--font-size-caption);
  font-weight: 600;
}

.riga__arretrato:hover:not(:disabled) {
  text-decoration: underline;
}

.riga__anni {
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.riga__importo {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.riga__togli {
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: var(--radius-control);
  background: none;
  box-shadow: none;
  color: var(--text-secondary);
}

.riga__togli:hover:not(:disabled) {
  background: var(--state-hover);
  color: var(--status-error);
}

.ricevuta__totale {
  display: flex;
  justify-content: space-between;
  padding: var(--space-8) var(--space-16);
  border-top: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.ricevuta__totale strong {
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.ricevuta__azioni {
  padding: var(--space-8) var(--space-16) var(--space-16);
  border-top: 1px solid var(--border-subtle);
}

.ricevuta__successiva {
  width: 100%;
}

.ricevuta__tasti {
  font-weight: 400;
}

@media (max-width: 1100px) {
  .lavoro {
    grid-template-columns: minmax(0, 1fr);
  }

  .lavoro__lato {
    position: static;
  }
}

@media (max-width: 640px) {
  .registra {
    padding: var(--space-16);
  }

  .sessione__suoni {
    margin-left: 0;
  }

  .cerca__scorciatoie {
    display: none;
  }

  .riga {
    flex-wrap: wrap;
  }
}
</style>
