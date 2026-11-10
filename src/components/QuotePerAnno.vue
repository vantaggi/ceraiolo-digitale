<template>
  <div class="quote-per-anno">
    <ListRows
      title="Quote per anno"
      :rows="righe"
      note="Premi un periodo per cambiare gli importi. Ogni periodo vale dal suo anno fino al periodo dopo. I pagamenti già registrati non cambiano."
      @select="apri"
    />
    <div>
      <BaseButton :disabled="!tabella" @click="aggiungi">
        <AppIcon name="aggiungi" /> Aggiungi quote da un anno
      </BaseButton>
    </div>

    <BaseModal
      :open="!!modifica"
      :title="modifica?.titolo ?? ''"
      size="md"
      :busy="inCorso"
      @close="chiudi"
    >
      <form v-if="modifica" id="modulo-quote" class="modulo" novalidate @submit.prevent="salva">
        <div v-if="modifica.daAnno !== null" class="campo-anno">
          <label for="quote-da-anno" class="modulo__label">Valido dal</label>
          <input
            id="quote-da-anno"
            v-model="modifica.daAnno"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            class="numero"
            data-autofocus
          />
        </div>

        <table class="fasce" aria-label="Fasce d'età con quota annuale e iscrizione">
          <thead>
            <tr>
              <th scope="col">Da età</th>
              <th scope="col">Quota annuale (€)</th>
              <th scope="col">Iscrizione (€)</th>
              <th scope="col"><span class="sr-only">Togli</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(fascia, i) in modifica.fasce" :key="fascia.chiave">
              <td>
                <span v-if="i === 0" class="fisso">0</span>
                <input
                  v-else
                  v-model="fascia.daEta"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  class="numero numero--eta"
                  :aria-label="`Fascia ${i + 1}: da età`"
                />
              </td>
              <td>
                <input
                  v-model="fascia.quota"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  class="numero"
                  placeholder="offerta"
                  :aria-label="`Fascia ${i + 1}: quota annuale`"
                  :aria-describedby="modifica.errore ? 'quote-errore quote-aiuto' : 'quote-aiuto'"
                />
              </td>
              <td>
                <input
                  v-model="fascia.iscrizione"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  class="numero"
                  :aria-label="`Fascia ${i + 1}: iscrizione`"
                />
              </td>
              <td>
                <BaseButton
                  v-if="i > 0"
                  variant="ghost"
                  :aria-label="`Togli la fascia ${i + 1}`"
                  @click="modifica.fasce.splice(i, 1)"
                >
                  <AppIcon name="elimina" />
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
        <div>
          <BaseButton variant="ghost" @click="aggiungiFascia">
            <AppIcon name="aggiungi" /> Aggiungi una fascia d'età
          </BaseButton>
        </div>

        <label class="scelta">
          <input v-model="modifica.iscrizioneChiSaltaUnAnno" type="checkbox" />
          Iscrizione anche a chi torna dopo 1-{{ MAX_ANNI_ARRETRATI }} anni senza saldare gli
          arretrati
        </label>

        <p v-if="modifica.errore" id="quote-errore" class="modulo__errore" role="alert">
          {{ modifica.errore }}
        </p>
        <p id="quote-aiuto" class="modulo__aiuto">
          Quota vuota: offerta libera, l'app non propone un importo. L'iscrizione è il costo della
          nuova tessera: la paga chi si iscrive e chi si reiscrive dopo più di
          {{ MAX_ANNI_ARRETRATI }} anni fuori.
        </p>
      </form>
      <template #footer>
        <BaseButton
          v-if="modifica && modifica.indice !== null && modifica.daAnno !== null"
          variant="ghost"
          :disabled="inCorso"
          class="footer__togli"
          @click="togliPeriodo"
        >
          <AppIcon name="elimina" /> Togli il periodo
        </BaseButton>
        <BaseButton :disabled="inCorso" @click="chiudi">Annulla</BaseButton>
        <BaseButton variant="primary" type="submit" form="modulo-quote" :loading="inCorso">
          Salva
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
// Impostazioni › Quote (scelta 1A delle bozze del 10 novembre 2026): una riga per periodo,
// la modifica in una finestra. La regola che usa la tabella sta in utils/payment.js.
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ListRows from '@/components/base/ListRows.vue'
import { askConfirm } from '@/composables/useDialog'
import { getQuotePerAnno, saveQuotePerAnno } from '@/services/db'
import { erroreTabellaQuote, MAX_ANNI_ARRETRATI } from '@/utils/payment'

const toast = useToast()
const tabella = ref(null)
const modifica = ref(null)
const inCorso = ref(false)
let chiavi = 0

onMounted(async () => {
  try {
    tabella.value = await getQuotePerAnno()
  } catch (error) {
    console.error('Quote non lette:', error)
    toast.error('Non sono riuscito a leggere le quote.')
  }
})

const ordinata = computed(() =>
  [...(tabella.value ?? [])].sort((a, b) => (a.daAnno ?? -Infinity) - (b.daAnno ?? -Infinity)),
)

const euro = (v) => `${Number(v).toLocaleString('it-IT', { maximumFractionDigits: 2 })} €`

/** "0-17 offerta · 18-23 15 € · da 24 15 € + 15 € iscrizione" */
function riassunto(periodo) {
  const fasce = [...periodo.fasce].sort((a, b) => a.daEta - b.daEta)
  return fasce
    .map((f, i) => {
      const dopo = fasce[i + 1]
      const eta = dopo ? `${f.daEta}-${dopo.daEta - 1}` : `da ${f.daEta}`
      const quota = f.quota === null ? 'offerta' : euro(f.quota)
      return f.iscrizione > 0
        ? `${eta} ${quota} + ${euro(f.iscrizione)} iscrizione`
        : `${eta} ${quota}`
    })
    .join(' · ')
}

function nomePeriodo(periodo) {
  if (periodo.daAnno !== null) return `Dal ${periodo.daAnno}`
  const dopo = ordinata.value.find((p) => p.daAnno !== null)
  return dopo ? `Fino al ${dopo.daAnno - 1}` : 'Tutti gli anni'
}

// Il periodo piu' recente in alto: e' quello che si usa adesso
const righe = computed(() =>
  [...ordinata.value].reverse().map((p) => ({
    id: String(p.daAnno ?? 'primo'),
    label: nomePeriodo(p),
    value: riassunto(p),
  })),
)

const testo = (v) => (v === null || v === undefined ? '' : String(v).replace('.', ','))

function apriConPeriodo(periodo, indice, titolo) {
  modifica.value = {
    indice,
    titolo,
    daAnno: periodo.daAnno === null ? null : String(periodo.daAnno),
    iscrizioneChiSaltaUnAnno: !!periodo.iscrizioneChiSaltaUnAnno,
    fasce: [...periodo.fasce]
      .sort((a, b) => a.daEta - b.daEta)
      .map((f) => ({
        chiave: chiavi++,
        daEta: String(f.daEta),
        quota: testo(f.quota),
        iscrizione: testo(f.iscrizione),
      })),
    errore: '',
  }
}

function apri(riga) {
  const indice = tabella.value.findIndex((p) => String(p.daAnno ?? 'primo') === riga.id)
  const periodo = tabella.value[indice]
  apriConPeriodo(periodo, indice, `Quote: ${nomePeriodo(periodo).toLowerCase()}`)
}

function aggiungi() {
  const ultimo = ordinata.value.at(-1)
  const anno = Math.max(new Date().getFullYear() + 1, (ultimo.daAnno ?? 0) + 1)
  apriConPeriodo({ ...ultimo, daAnno: anno }, null, 'Nuove quote da un anno')
}

function aggiungiFascia() {
  const ultima = modifica.value.fasce.at(-1)
  const eta = Number(ultima.daEta)
  modifica.value.fasce.push({
    chiave: chiavi++,
    daEta: Number.isInteger(eta) ? String(eta + 1) : '',
    quota: ultima.quota,
    iscrizione: ultima.iscrizione,
  })
}

const numero = (t) => (String(t).trim() === '' ? NaN : Number(String(t).replace(',', '.')))

/** Il periodo scritto nella finestra, nella forma della tabella. */
function periodoScritto() {
  const m = modifica.value
  return {
    daAnno: m.daAnno === null ? null : numero(m.daAnno),
    iscrizioneChiSaltaUnAnno: m.iscrizioneChiSaltaUnAnno,
    fasce: m.fasce.map((f, i) => ({
      daEta: i === 0 ? 0 : numero(f.daEta),
      quota: String(f.quota).trim() === '' ? null : numero(f.quota),
      iscrizione: String(f.iscrizione).trim() === '' ? 0 : numero(f.iscrizione),
    })),
  }
}

async function scrivi(tabellaNuova, messaggio) {
  // Copia semplice, senza i proxy di Vue: IndexedDB non salva oggetti reattivi
  const nuova = JSON.parse(JSON.stringify(tabellaNuova))
  inCorso.value = true
  try {
    await saveQuotePerAnno(nuova)
    tabella.value = nuova
    modifica.value = null
    toast.success(messaggio)
  } catch (error) {
    console.error('Quote non salvate:', error)
    if (modifica.value) modifica.value.errore = `Quote non salvate: ${error.message}`
  } finally {
    inCorso.value = false
  }
}

async function salva() {
  const periodo = periodoScritto()
  const nuova = [...tabella.value]
  if (modifica.value.indice === null) nuova.push(periodo)
  else nuova[modifica.value.indice] = periodo
  const errore = erroreTabellaQuote(nuova)
  if (errore) {
    modifica.value.errore = errore
    return
  }
  await scrivi(nuova, `Quote salvate: ${nomePeriodo(periodo).toLowerCase()}`)
}

async function togliPeriodo() {
  const periodo = tabella.value[modifica.value.indice]
  const ok = await askConfirm({
    title: `Togliere le quote dal ${periodo.daAnno}?`,
    message: `Dal ${periodo.daAnno} varranno le quote del periodo prima. I pagamenti già registrati non cambiano.`,
    confirmLabel: 'Togli il periodo',
    danger: true,
  })
  if (!ok) return
  const nuova = tabella.value.filter((_, i) => i !== modifica.value.indice)
  await scrivi(nuova, `Quote dal ${periodo.daAnno} tolte`)
}

function chiudi() {
  if (!inCorso.value) modifica.value = null
}
</script>

<style scoped>
.quote-per-anno {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.modulo {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.campo-anno {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.modulo__label {
  font-size: var(--font-size-label);
  font-weight: 500;
}

.fasce {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

.fasce th {
  text-align: left;
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--text-secondary);
  padding: var(--space-4) var(--space-8) var(--space-4) 0;
}

.fasce td {
  padding: var(--space-4) var(--space-8) var(--space-4) 0;
  border-top: 1px solid var(--border-subtle);
}

.numero {
  width: 7rem;
  max-width: 100%;
  padding: var(--space-4) var(--space-8);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.numero--eta {
  width: 4.5rem;
}

.fisso {
  display: inline-block;
  width: 4.5rem;
  text-align: right;
  padding-right: var(--space-8);
}

.scelta {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-size: var(--font-size-label);
  cursor: pointer;
}

.scelta input {
  accent-color: var(--color-accent);
}

.modulo__aiuto,
.modulo__errore {
  margin: 0;
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
}

.modulo__errore {
  color: var(--status-error);
}

.footer__togli {
  margin-right: auto;
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
