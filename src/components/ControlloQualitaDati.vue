<template>
  <div class="controllo">
    <p class="controllo__testo">
      Cerca i soci con dati mancanti o incoerenti: data o luogo di nascita, data di iscrizione,
      manicchia, iscrizioni nel futuro o successive al primo pagamento.
    </p>
    <BaseButton class="controllo__avvia" :loading="inCorso" @click="esegui">
      <AppIcon name="ricerca" /> {{ risultato ? 'Ripeti il controllo' : 'Esegui il controllo' }}
    </BaseButton>

    <p v-if="errore" class="controllo__esito controllo__esito--errore" role="alert">
      <AppIcon name="errore" /> {{ errore }}
    </p>

    <div v-else-if="risultato" class="controllo__risultato" aria-live="polite">
      <p v-if="totale === 0" class="controllo__esito controllo__esito--ok">
        <AppIcon name="ok" /> Nessuna anomalia: i dati sono completi.
      </p>
      <template v-else>
        <p class="controllo__esito controllo__esito--attenzione">
          <AppIcon name="attenzione" /> {{ totale }}
          {{ totale === 1 ? 'socio ha dati da sistemare' : 'soci hanno dati da sistemare' }}
        </p>
        <ul class="controllo__conteggi">
          <li v-for="v in voci" :key="v.chiave">
            {{ v.testo }}: <strong>{{ v.numero }}</strong>
          </li>
        </ul>
        <table class="controllo__tabella">
          <caption class="sr-only">
            Soci con anomalie
          </caption>
          <thead>
            <tr>
              <th scope="col">Socio</th>
              <th scope="col">Cosa manca o non torna</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in visibili" :key="item.id">
              <td>
                <RouterLink :to="`/socio/${item.id}`">{{ item.cognome }} {{ item.nome }}</RouterLink>
              </td>
              <td>{{ item.issues.join(', ') }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="altri > 0" class="controllo__altri">
          ...e altri {{ altri }}: sono tutti nel PDF.
        </p>
        <BaseButton :loading="scaricando" @click="scaricaPdf">
          <AppIcon name="documento" /> Scarica il PDF delle anomalie
        </BaseButton>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { getDataAuditStats } from '@/services/db'
import { generateAuditPDF } from '@/services/export'
import { scaricaBlob } from '@/utils/scarica'

// Controllo qualita' dei dati anagrafici (prima in Report PDF, ora in Impostazioni > Dati).
const MOSTRATI = 10
const VOCI = {
  missing_dob: 'Senza data di nascita',
  missing_pob: 'Senza luogo di nascita',
  missing_reg_date: 'Senza data di iscrizione',
  missing_group: 'Senza manicchia',
  future_reg: 'Iscrizione nel futuro',
  invalid_reg_date: 'Iscrizione dopo il primo pagamento',
}

const toast = useToast()
const risultato = ref(null)
const errore = ref('')
const inCorso = ref(false)
const scaricando = ref(false)

const totale = computed(() => risultato.value?.summary.total_issues ?? 0)
const voci = computed(() =>
  Object.entries(VOCI)
    .map(([chiave, testo]) => ({ chiave, testo, numero: risultato.value.summary[chiave] || 0 }))
    .filter((v) => v.numero > 0),
)
const visibili = computed(() => risultato.value.details.slice(0, MOSTRATI))
const altri = computed(() => Math.max(0, risultato.value.details.length - MOSTRATI))

const esegui = async () => {
  inCorso.value = true
  errore.value = ''
  try {
    risultato.value = await getDataAuditStats()
  } catch (e) {
    console.error('Controllo qualita dati fallito:', e)
    errore.value = 'Non sono riuscito a leggere i soci dal database.'
  } finally {
    inCorso.value = false
  }
}

const scaricaPdf = async () => {
  scaricando.value = true
  try {
    const esito = await generateAuditPDF(risultato.value)
    if (!esito.success) throw new Error(esito.error)
    scaricaBlob(esito.blob, esito.filename)
  } catch (e) {
    console.error('PDF anomalie non generato:', e)
    toast.error('Non sono riuscito a creare il PDF: ' + e.message)
  } finally {
    scaricando.value = false
  }
}
</script>

<style scoped>
.controllo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-12);
}

.controllo__testo {
  margin: 0;
  color: var(--color-text-secondary);
}

.controllo__risultato {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-12);
  width: 100%;
}

.controllo__esito {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin: 0;
  font-weight: 600;
}

.controllo__esito--ok {
  color: var(--color-success);
}

.controllo__esito--attenzione {
  color: var(--color-warning);
}

.controllo__esito--errore {
  color: var(--color-danger);
}

.controllo__conteggi {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
  margin: 0;
  padding: 0;
  list-style: none;
}

.controllo__conteggi li {
  padding: var(--space-4) var(--space-12);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-label);
}

.controllo__tabella {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-label);
}

.controllo__tabella th,
.controllo__tabella td {
  padding: var(--space-8);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.controllo__tabella th {
  color: var(--color-text-secondary);
  font-weight: 600;
}

.controllo__altri {
  margin: 0;
  font-size: var(--font-size-label);
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
</style>
