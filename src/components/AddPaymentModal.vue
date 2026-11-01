<template>
  <BaseModal
    :open="show"
    title="Registra pagamento"
    size="sm"
    :busy="isSubmitting"
    @close="closeModal"
  >
    <form id="modulo-pagamento" class="modulo-pagamento" @submit.prevent="handleSubmit">
      <div class="campo">
        <label for="quota-pagata">Quota pagata (€)</label>
        <input
          id="quota-pagata"
          ref="quotaInput"
          v-model.number="paymentDetails.quota_pagata"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="Es: 10.00"
          :aria-describedby="notaQuota ? 'nota-quota' : undefined"
          @input="quotaToccata = true"
        />
        <p v-if="notaQuota" id="nota-quota" class="campo__nota">{{ notaQuota }}</p>
      </div>

      <div class="campo">
        <label for="data-pagamento">Data pagamento</label>
        <input
          id="data-pagamento"
          v-model="paymentDetails.data_pagamento"
          type="date"
          required
          :max="new Date().toISOString().split('T')[0]"
        />
      </div>

      <div class="campo">
        <label for="numero-blocchetto">Blocchetto</label>
        <input
          id="numero-blocchetto"
          v-model.number="paymentDetails.numero_blocchetto"
          type="number"
          min="1"
          required
          placeholder="Es: 123"
        />
      </div>

      <div class="campo">
        <label for="numero-ricevuta">Ricevuta</label>
        <input
          id="numero-ricevuta"
          v-model.number="paymentDetails.numero_ricevuta"
          type="number"
          min="1"
          required
          placeholder="Es: 456"
        />
      </div>

      <fieldset class="anni">
        <legend>Anni di tesseramento</legend>
        <div v-for="year in availableYears" :key="year" class="anni__riga">
          <input
            :id="'year-' + year"
            v-model="selectedYears"
            type="checkbox"
            :value="year"
            :disabled="isSubmitting"
          />
          <label :for="'year-' + year">
            {{ year }}
            <span v-if="year === props.annoRiferimento" class="anni__nota"
              >anno di riferimento</span
            >
          </label>
        </div>
      </fieldset>
    </form>

    <template #footer>
      <BaseButton :disabled="isSubmitting" @click="closeModal">Annulla</BaseButton>
      <BaseButton
        type="submit"
        form="modulo-pagamento"
        variant="primary"
        data-autofocus
        :loading="isSubmitting"
      >
        Salva pagamenti ({{ selectedYears.length }} anni)
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { getTesseramentiBySocioId, getSetting } from '@/services/db'
import {
  isMinorenne,
  QUOTA_NUOVI_PREDEFINITA,
  QUOTA_ORDINARIA_PREDEFINITA,
  quotaProposta,
  quotaPropostaPerAnni,
  tipoQuota,
} from '@/utils/payment'
import { annoIscrizione } from '@/utils/iscrizione'

const emit = defineEmits(['close', 'payments-saved'])

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  socioId: {
    type: String,
    required: true,
  },
  yearsToPay: {
    type: Array,
    required: true,
  },
  numeroBlocchetto: {
    type: Number,
    default: null,
  },
  numeroRicevuta: {
    type: Number,
    default: null,
  },
  annoRiferimento: {
    type: Number,
    default: () => new Date().getFullYear(),
  },
})

const isSubmitting = ref(false)
const quotaInput = ref(null)

const paymentDetails = reactive({
  quota_pagata: 10.0, // Will be updated from settings
  data_pagamento: new Date().toISOString().split('T')[0],
  numero_ricevuta: null,
  numero_blocchetto: null,
})

// Years selection
const selectedYears = ref([...props.yearsToPay])

// Quota proposta per gli anni scelti: un rientro che salda gli arretrati paga la quota
// ordinaria (scelta di Cioti, 1 novembre 2026). Un importo scritto a mano non si tocca.
const socioPagamento = ref(null)
const quoteImpostate = ref(null)
const quotaToccata = ref(false)
const proponiQuota = () => {
  if (quotaToccata.value || !socioPagamento.value || !quoteImpostate.value) return
  const quota = quotaPropostaPerAnni(
    socioPagamento.value,
    Array.from(paidYears.value),
    selectedYears.value,
    quoteImpostate.value,
  )
  if (quota !== null) paymentDetails.quota_pagata = quota
}
watch(selectedYears, proponiQuota)

/** Dice perche' la quota non e' quella dei nuovi quando si saldano gli arretrati. */
const notaQuota = computed(() => {
  const socio = socioPagamento.value
  if (!socio || selectedYears.value.length < 2) return ''
  const ultimo = Math.max(...selectedYears.value.map(Number))
  const daSolo = tipoQuota(socio, Array.from(paidYears.value), ultimo)
  const conGliAltri = tipoQuota(
    socio,
    [...Array.from(paidYears.value), ...selectedYears.value.map(Number)],
    ultimo,
  )
  return daSolo === 'rientro' && conGliAltri === 'ordinaria'
    ? `Con gli arretrati saldati il ${ultimo} non è un rientro: quota ordinaria.`
    : ''
})
const availableYears = ref([])
const paidYears = ref(new Set())

// Load available years when modal opens
const loadAvailableYears = async () => {
  try {
    console.log('Loading available years for socioId:', props.socioId)

    // Get socio info and paid years
    const [socio, tesseramenti] = await Promise.all([
      import('@/services/db').then((m) => m.getSocioById(props.socioId)),
      getTesseramentiBySocioId(props.socioId),
    ])

    console.log('Socio info:', socio)
    console.log('Tesseramenti:', tesseramenti)

    paidYears.value = new Set(tesseramenti.map((t) => t.anno))
    console.log('Paid years set:', Array.from(paidYears.value))

    // Get socio's first registration year
    // If data_prima_iscrizione is null but socio has payments, use the earliest payment year
    // Il primo tra l'anno dichiarato e il primo pagamento (glossario, utils/iscrizione.js)
    const firstRegistrationYear =
      annoIscrizione(socio || {}, Array.from(paidYears.value)) ?? new Date().getFullYear()
    console.log('First registration year:', firstRegistrationYear)

    // Get last 5 years, but not earlier than first registration
    const currentYear = new Date().getFullYear()

    // Check if socio is minor
    const isMinor = isMinorenne(socio.data_nascita, currentYear)

    // If minor, don't show "arrears" (past years), so start from current year
    let startYear
    if (isMinor) {
      startYear = currentYear
    } else {
      startYear = Math.max(currentYear - 4, firstRegistrationYear)
    }

    console.log('Start year calculation:', {
      currentYear,
      firstRegistrationYear,
      startYear,
      isMinor,
    })

    const availableYearsRange = []
    for (let year = startYear; year <= currentYear; year++) {
      availableYearsRange.push(year)
    }
    console.log('Available years range:', availableYearsRange)

    // Available years: years from first registration to current, excluding paid years
    const years = []
    for (const year of availableYearsRange) {
      if (!paidYears.value.has(year)) {
        years.push(year)
      }
    }
    console.log('Years after filtering paid:', years)

    // Always include reference year if not paid and not already included
    if (!paidYears.value.has(props.annoRiferimento) && !years.includes(props.annoRiferimento)) {
      years.push(props.annoRiferimento)
      console.log('Added reference year:', props.annoRiferimento)
    }

    // Sort years ascending
    years.sort((a, b) => a - b)
    console.log('Final available years:', years)

    availableYears.value = years
  } catch (error) {
    console.error('Error loading available years:', error)
    // Fallback: show reference year only
    availableYears.value = [props.annoRiferimento]
  }
}

// Reset form when modal opens (il fuoco va su Salva: BaseModal cerca data-autofocus)
watch(
  () => props.show,
  (show) => {
    if (show) resetForm()
  },
)

const resetForm = async () => {
  // Quote dalle impostazioni
  const quote = {
    quotaOrdinaria: await getSetting('defaultQuota', QUOTA_ORDINARIA_PREDEFINITA),
    quotaNuovi: await getSetting('newMemberQuota', QUOTA_NUOVI_PREDEFINITA),
  }
  let defaultQuota = quote.quotaOrdinaria

  paymentDetails.data_pagamento = new Date().toISOString().split('T')[0]
  paymentDetails.numero_blocchetto = props.numeroBlocchetto
  paymentDetails.numero_ricevuta = props.numeroRicevuta

  // Load available years and set default selection
  // This also populates paidYears and availableYears
  await loadAvailableYears()

  // Nuovi e rientri pagano la quota dei nuovi: la regola sta in utils/payment.js (tipoQuota)
  quotaToccata.value = false
  socioPagamento.value = null
  quoteImpostate.value = quote
  try {
    const socio = await import('@/services/db').then((m) => m.getSocioById(props.socioId))
    const tipo = tipoQuota(socio, Array.from(paidYears.value), props.annoRiferimento)
    defaultQuota = quotaProposta(tipo, quote)
    socioPagamento.value = socio
  } catch (e) {
    console.warn('Could not calculate automatic quota', e)
  }

  paymentDetails.quota_pagata = defaultQuota

  // Pre-select reference year if available, otherwise select first available year
  if (availableYears.value.includes(props.annoRiferimento)) {
    selectedYears.value = [props.annoRiferimento]
  } else if (availableYears.value.length > 0) {
    selectedYears.value = [availableYears.value[0]]
  } else {
    selectedYears.value = []
  }

  isSubmitting.value = false
}

const closeModal = () => {
  if (!isSubmitting.value) {
    emit('close')
  }
}

const handleSubmit = () => {
  // Pass all details to the parent to handle the save logic
  emit('payments-saved', {
    details: { ...paymentDetails },
    years: selectedYears.value,
    socioId: props.socioId,
  })
  // The parent component will be responsible for closing the modal on success
}
</script>

<style scoped>
.modulo-pagamento {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.campo__nota {
  margin: 0;
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
}

.campo label,
.anni legend {
  font-size: var(--font-size-label);
  font-weight: 600;
  color: var(--text-primary);
}

.anni {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  border: none;
}

.anni legend {
  margin-bottom: var(--space-4);
}

.anni__riga {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-4) var(--space-8);
  border-radius: var(--radius-control);
}

.anni__riga:hover {
  background-color: var(--state-hover);
}

.anni__riga input[type='checkbox'] {
  width: auto;
  accent-color: var(--accent-default);
  box-shadow: none;
}

.anni__riga label {
  display: flex;
  flex: 1;
  align-items: baseline;
  gap: var(--space-8);
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}

.anni__nota {
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
}
</style>
