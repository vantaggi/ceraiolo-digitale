<template>
  <ModelloReport
    titolo="Controllo quote di nuovi e rientri"
    :descrizione="`Pagamenti del ${anno ?? '...'} sotto i 25 € di chi era al primo pagamento o tornava dopo un anno saltato.`"
  >
    <template #azioni>
      <BaseButton :loading="inCorso" :disabled="disabilitato" @click="esegui">
        <AppIcon name="ricerca" /> Controlla
      </BaseButton>
    </template>

    <p v-if="errore" class="esito esito--errore" role="alert">
      <AppIcon name="errore" /> {{ errore }}
    </p>
    <div v-else-if="risultati" class="risultati" aria-live="polite">
      <p v-if="risultati.length === 0" class="esito esito--ok">
        <AppIcon name="ok" /> Nessuna quota da controllare nel {{ annoControllato }}.
      </p>
      <template v-else>
        <p class="esito esito--attenzione">
          <AppIcon name="attenzione" /> {{ risultati.length }}
          {{ risultati.length === 1 ? 'quota da controllare' : 'quote da controllare' }} nel
          {{ annoControllato }}
        </p>
        <div class="tabella-scorre">
          <table class="tabella">
            <thead>
              <tr>
                <th scope="col">Socio</th>
                <th scope="col">Quota pagata</th>
                <th scope="col">Ricevuta / blocchetto</th>
                <th scope="col">Perché</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in risultati" :key="item.tesseramento.id">
                <td>
                  <RouterLink :to="`/socio/${item.socio.id}`">
                    {{ item.socio.cognome }} {{ item.socio.nome }}
                  </RouterLink>
                </td>
                <td class="importo">€ {{ euro(item.tesseramento.quota_pagata) }}</td>
                <td>
                  {{ item.tesseramento.numero_ricevuta || '-' }} /
                  {{ item.tesseramento.numero_blocchetto || '-' }}
                </td>
                <td class="motivo">{{ item.reason }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="azioni">
          <BaseButton :loading="scaricando" @click="scaricaPdf">
            <AppIcon name="documento" /> Scarica PDF
          </BaseButton>
          <BaseButton @click="scaricaExcel">
            <AppIcon name="foglio-calcolo" /> Scarica Excel
          </BaseButton>
        </div>
      </template>
    </div>
  </ModelloReport>
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import ModelloReport from '@/components/ModelloReport.vue'
import { getQuotaAuditList } from '@/services/db'
import { generateAuditQuotaPDF } from '@/services/export'
import { exportToExcel } from '@/services/excelExport'
import { scaricaBlob } from '@/utils/scarica'

const props = defineProps({
  anno: { type: Number, default: null },
  disabilitato: { type: Boolean, default: false },
})

const toast = useToast()
const risultati = ref(null)
const annoControllato = ref(null)
const errore = ref('')
const inCorso = ref(false)
const scaricando = ref(false)

const euro = (valore) => Number(valore || 0).toFixed(2)

const esegui = async () => {
  inCorso.value = true
  errore.value = ''
  try {
    risultati.value = await getQuotaAuditList(props.anno)
    annoControllato.value = props.anno
  } catch (e) {
    console.error('Controllo quote fallito:', e)
    errore.value = 'Non sono riuscito a leggere i pagamenti dal database.'
  } finally {
    inCorso.value = false
  }
}

const scaricaPdf = async () => {
  scaricando.value = true
  try {
    const esito = await generateAuditQuotaPDF(risultati.value, annoControllato.value)
    if (!esito.success) throw new Error(esito.error)
    scaricaBlob(esito.blob, esito.filename)
  } catch (e) {
    console.error('PDF controllo quote non generato:', e)
    toast.error('Non sono riuscito a creare il PDF: ' + e.message)
  } finally {
    scaricando.value = false
  }
}

const scaricaExcel = () => {
  try {
    const righe = risultati.value.map((item) => ({
      'Cognome e Nome': `${item.socio.cognome} ${item.socio.nome}`,
      'Anno Rientro': item.tesseramento.anno,
      'Quota Pagata': `€ ${euro(item.tesseramento.quota_pagata)}`,
      Ricevuta: item.tesseramento.numero_ricevuta || '-',
      Blocchetto: item.tesseramento.numero_blocchetto || '-',
      Motivazione: item.reason,
    }))
    exportToExcel(righe, `Audit_Quote_Rientri_${annoControllato.value}`)
  } catch (e) {
    console.error('Excel controllo quote non generato:', e)
    toast.error("Non sono riuscito a creare il file Excel.")
  }
}
</script>

<style scoped>
.risultati {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-12);
}

.esito {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin: 0;
  font-weight: 600;
}

.esito--ok {
  color: var(--color-success);
}

.esito--attenzione {
  color: var(--color-warning);
}

.esito--errore {
  color: var(--color-danger);
}

.tabella-scorre {
  width: 100%;
  overflow-x: auto;
}

.tabella {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-label);
}

.tabella th,
.tabella td {
  padding: var(--space-8);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.tabella th {
  color: var(--color-text-secondary);
  font-weight: 600;
}

.importo {
  color: var(--color-danger);
  font-weight: 600;
  white-space: nowrap;
}

.motivo {
  color: var(--color-text-secondary);
}

.azioni {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
}
</style>
