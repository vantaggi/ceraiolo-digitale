<template>
  <div class="report-pdf">
    <PageHeader
      title="Report PDF"
      subtitle="Elenchi pronti da stampare. Per un elenco diverso, Personalizza apre il modello nel Report su misura."
    >
      <template #actions>
        <div class="anno">
          <label for="anno-report" class="anno__label">Anno di riferimento</label>
          <input
            id="anno-report"
            v-model.number="anno"
            type="number"
            min="1950"
            :max="annoCorrente + 5"
            class="campo campo--anno"
            :aria-invalid="!annoValido"
            aria-describedby="anno-report-aiuto"
          />
        </div>
        <RouterLink to="/report-pdf/su-misura" class="link-azione link-azione--primario">
          <AppIcon name="personalizza" /> Report su misura
        </RouterLink>
      </template>
    </PageHeader>
    <p id="anno-report-aiuto" class="aiuto" :class="{ 'aiuto--errore': !annoValido }">
      <template v-if="annoValido">
        Tutti i modelli usano il {{ anno }}: età, pagato o no, arretrati e diritto di voto.
      </template>
      <template v-else>Scrivi un anno tra il 1950 e il {{ annoCorrente + 5 }}.</template>
    </p>

    <!-- Votazioni -->
    <section class="gruppo" aria-labelledby="gruppo-votazioni">
      <h2 id="gruppo-votazioni" class="gruppo__titolo">
        <AppIcon name="votazioni" /> Votazioni
      </h2>
      <ul class="gruppo__modelli">
        <ModelloReport
          titolo="Aventi diritto al voto e arretrati"
          :descrizione="`Chi vota alle elezioni del ${anno}, chi può votare dopo aver pagato gli arretrati e quali anni deve pagare.`"
        >
          <template #opzioni>
            <label class="sr-only" for="voto-manicchia">Manicchie</label>
            <select id="voto-manicchia" v-model="voto.manicchia" class="campo">
              <option value="__sezioni">Una sezione per manicchia</option>
              <option value="">Tutti in un elenco</option>
              <option v-for="g in manicchie" :key="g" :value="g">{{ g }}</option>
            </select>
            <label class="scelta">
              <input v-model="voto.includiNonAventi" type="checkbox" />
              Anche chi non ha diritto
            </label>
          </template>
          <template #azioni>
            <RouterLink :to="personalizzaVoto" class="link-azione">
              <AppIcon name="personalizza" /> Personalizza
            </RouterLink>
            <BaseButton
              variant="primary"
              :loading="inCorso === 'aventi'"
              :disabled="bloccato"
              @click="generaAventiDiritto"
            >
              <AppIcon name="documento" /> Genera PDF
            </BaseButton>
          </template>
        </ModelloReport>

        <ModelloReport
          titolo="Report votazioni"
          etichetta="Vecchia regola"
          :descrizione="`Maggiorenni in regola con il ${anno - 1}. Non conta i primi anni né gli arretrati: per le elezioni usa il modello qui sopra. Resta fino alla prova con la segreteria.`"
        >
          <template #azioni>
            <BaseButton
              :loading="inCorso === 'votazioni'"
              :disabled="bloccato"
              @click="generaVotazioniVecchio"
            >
              <AppIcon name="documento" /> Genera PDF
            </BaseButton>
          </template>
        </ModelloReport>
      </ul>
    </section>

    <!-- Soci -->
    <section class="gruppo" aria-labelledby="gruppo-soci">
      <h2 id="gruppo-soci" class="gruppo__titolo"><AppIcon name="gruppo" /> Soci</h2>
      <ul class="gruppo__modelli">
        <ModelloReport
          titolo="Soci per manicchia"
          :descrizione="`Elenco dei soci divisi per manicchia, con chi ha pagato il ${anno}.`"
        >
          <template #opzioni>
            <label class="sr-only" for="manicchia-gruppo">Manicchia</label>
            <select id="manicchia-gruppo" v-model="perManicchia.gruppo" class="campo">
              <option value="">Tutte le manicchie</option>
              <option v-for="g in manicchie" :key="g" :value="g">{{ g }}</option>
            </select>
            <label class="sr-only" for="manicchia-eta">Età</label>
            <select id="manicchia-eta" v-model="perManicchia.eta" class="campo">
              <option v-for="o in OPZIONI_ETA" :key="o.v" :value="o.v">{{ o.t }}</option>
            </select>
            <label class="sr-only" for="manicchia-pagato">Pagato nell'anno</label>
            <select id="manicchia-pagato" v-model="perManicchia.pagamento" class="campo">
              <option value="tutti">Pagato o no</option>
              <option value="in_regola">In regola</option>
              <option value="non_in_regola">Non in regola</option>
            </select>
          </template>
          <template #azioni>
            <RouterLink :to="personalizzaManicchia" class="link-azione">
              <AppIcon name="personalizza" /> Personalizza
            </RouterLink>
            <BaseButton
              :loading="inCorso === 'manicchia'"
              :disabled="bloccato"
              @click="generaPerManicchia"
            >
              <AppIcon name="documento" /> Genera PDF
            </BaseButton>
          </template>
        </ModelloReport>

        <ModelloReport
          titolo="Conteggio per manicchia"
          :descrizione="`Un foglio con quanti iscritti ha ogni manicchia nel ${anno}.`"
        >
          <template #azioni>
            <BaseButton
              :loading="inCorso === 'conteggio'"
              :disabled="bloccato"
              @click="generaConteggio"
            >
              <AppIcon name="documento" /> Genera PDF
            </BaseButton>
          </template>
        </ModelloReport>

        <ModelloReport
          titolo="Nuovi iscritti"
          :descrizione="`Soci iscritti per la prima volta nel ${anno}.`"
        >
          <template #opzioni>
            <label class="sr-only" for="nuovi-eta">Età</label>
            <select id="nuovi-eta" v-model="nuovi.eta" class="campo">
              <option v-for="o in OPZIONI_ETA" :key="o.v" :value="o.v">{{ o.t }}</option>
            </select>
          </template>
          <template #azioni>
            <BaseButton :loading="inCorso === 'nuovi'" :disabled="bloccato" @click="generaNuovi">
              <AppIcon name="documento" /> Genera PDF
            </BaseButton>
          </template>
        </ModelloReport>

        <ModelloReport
          titolo="Minorenni"
          :descrizione="`Soci che nel ${anno} non hanno ancora 18 anni (conta solo l'anno di nascita).`"
        >
          <template #azioni>
            <RouterLink :to="suMisura('minorenni')" class="link-azione">
              <AppIcon name="personalizza" /> Personalizza
            </RouterLink>
            <BaseButton
              :loading="inCorso === 'minorenni'"
              :disabled="bloccato"
              @click="generaMinorenni"
            >
              <AppIcon name="documento" /> Genera PDF
            </BaseButton>
          </template>
        </ModelloReport>

        <ModelloReport
          titolo="Soci attivi"
          :descrizione="`Soci con almeno un pagamento dal ${anno - 4} al ${anno}.`"
        >
          <template #azioni>
            <RouterLink :to="suMisura('attivi')" class="link-azione">
              <AppIcon name="personalizza" /> Personalizza
            </RouterLink>
            <BaseButton :loading="inCorso === 'attivi'" :disabled="bloccato" @click="generaAttivi">
              <AppIcon name="documento" /> Genera PDF
            </BaseButton>
          </template>
        </ModelloReport>
      </ul>
    </section>

    <!-- Rinnovi e quote -->
    <section class="gruppo" aria-labelledby="gruppo-rinnovi">
      <h2 id="gruppo-rinnovi" class="gruppo__titolo"><AppIcon name="quota" /> Rinnovi e quote</h2>
      <ul class="gruppo__modelli">
        <ModelloReport
          titolo="Lista rinnovi"
          :descrizione="`Tutti i soci con gli anni pagati e gli arretrati, da usare il giorno dei rinnovi ${anno}.`"
        >
          <template #azioni>
            <BaseButton
              variant="primary"
              :loading="inCorso === 'rinnovi'"
              :disabled="bloccato"
              @click="generaRinnovi"
            >
              <AppIcon name="documento" /> Genera PDF
            </BaseButton>
          </template>
        </ModelloReport>

        <ModelloReport
          titolo="Lista recupero"
          :descrizione="`Soci che hanno pagato il ${anno - 1} ma non ancora il ${anno}.`"
        >
          <template #azioni>
            <BaseButton
              :loading="inCorso === 'recupero'"
              :disabled="bloccato"
              @click="generaRecupero"
            >
              <AppIcon name="documento" /> Genera PDF
            </BaseButton>
          </template>
        </ModelloReport>

        <ModelloReport
          titolo="Cronologia pagamenti"
          descrizione="Tutti i pagamenti registrati, di ogni anno, con ricevuta e blocchetto."
        >
          <template #opzioni>
            <label class="sr-only" for="pagamenti-eta">Età</label>
            <select id="pagamenti-eta" v-model="pagamenti.eta" class="campo">
              <option v-for="o in OPZIONI_ETA" :key="o.v" :value="o.v">{{ o.t }}</option>
            </select>
          </template>
          <template #azioni>
            <BaseButton
              :loading="inCorso === 'pagamenti'"
              :disabled="bloccato"
              @click="generaPagamenti"
            >
              <AppIcon name="documento" /> Genera PDF
            </BaseButton>
          </template>
        </ModelloReport>

        <ControlloQuote :anno="annoValido ? anno : null" :disabilitato="bloccato" />

        <ModelloReport
          titolo="Tutti i documenti dei rinnovi"
          descrizione="In un colpo: lista rinnovi, nuovi iscritti, cronologia pagamenti, soci per manicchia e conteggio, con le scelte fatte qui sopra."
        >
          <template #azioni>
            <BaseButton :loading="inCorso === 'tutti'" :disabled="bloccato" @click="generaTutti">
              <AppIcon name="archivio" /> Scarica 5 PDF
            </BaseButton>
          </template>
        </ModelloReport>
      </ul>
    </section>

    <!-- Tessere -->
    <section class="gruppo" aria-labelledby="gruppo-tessere">
      <h2 id="gruppo-tessere" class="gruppo__titolo"><AppIcon name="tessera" /> Tessere</h2>
      <ul class="gruppo__modelli">
        <ModelloReport titolo="Tessere di tutti i soci">
          <template #descrizione>
            Un PDF con una tessera per pagina, in ordine di cognome. Lo sfondo e l'anteprima sono
            in <RouterLink to="/settings/tessera">Impostazioni › Tessera</RouterLink>.
          </template>
          <template #opzioni>
            <label class="scelta">
              <input v-model="tessere.escludiInattivi" type="checkbox" :disabled="occupato" />
              Escludi chi non paga da più di 5 anni
              <span v-if="tessere.escludiInattivi" class="scelta__nota">
                ({{ conteggioSoci.attivi }} su {{ conteggioSoci.totale }})
              </span>
            </label>
          </template>
          <template #azioni>
            <BaseButton
              variant="primary"
              :loading="inCorso === 'tessere'"
              :disabled="bloccato"
              @click="generaTessere"
            >
              <AppIcon name="tessera" /> Genera tessere
            </BaseButton>
          </template>
          <div
            v-if="inCorso === 'tessere'"
            class="avanzamento"
            role="progressbar"
            aria-label="Tessere generate"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="Math.round(tessere.avanzamento)"
          >
            <div class="avanzamento__barra" :style="{ width: tessere.avanzamento + '%' }"></div>
          </div>
        </ModelloReport>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import ModelloReport from '@/components/ModelloReport.vue'
import ControlloQuote from '@/components/ControlloQuote.vue'
import {
  generateRenewalListPDF,
  generateAllCardsPDF,
  generateNewMembersPDF,
  generateCompletePaymentListPDF,
  generateMembersByGroupPDF,
  generateGroupCountsPDF,
  generateChurnPDF,
  generateVotingListPDF,
  generateAventiDirittoPDF,
  generateActiveMembersPDF,
} from '@/services/export'
import { generateBetaDynamicPDF } from '@/services/exportBeta'
import {
  getAllSociWithTesseramenti,
  getNewMembersByYear,
  getCompletePaymentList,
  getMembersByGroup,
  getUniqueGroups,
  getGroupCountsForYear,
  getChurnList,
  getVotingEligibleMembers,
  getActiveMembersLast5Years,
} from '@/services/db'
import { elencoAventiDiritto } from '@/utils/aventiDiritto'
import {
  colonneReport,
  filtraSoci,
  riassunto,
  statoDaModello,
  titoloReport,
} from '@/utils/reportSuMisura'
import { scaricaBlob } from '@/utils/scarica'

const OPZIONI_ETA = [
  { v: 'tutti', t: 'Tutte le età' },
  { v: 'maggiorenni', t: 'Maggiorenni' },
  { v: 'minorenni', t: 'Minorenni' },
]
// Valori di eta' e pagamento del Report su misura, per "Personalizza"
const ETA_SU_MISURA = { tutti: 'all', maggiorenni: 'maggiorenni', minorenni: 'minorenni' }
const PAGAMENTO_SU_MISURA = { tutti: 'all', in_regola: 'in_regola', non_in_regola: 'morosi' }

const toast = useToast()
const annoCorrente = new Date().getFullYear()
const anno = ref(annoCorrente)
const annoValido = computed(
  () => Number.isInteger(anno.value) && anno.value >= 1950 && anno.value <= annoCorrente + 5,
)
// Il modello che sta generando: uno alla volta, gli altri pulsanti aspettano
const inCorso = ref('')
const occupato = computed(() => inCorso.value !== '')
const bloccato = computed(() => occupato.value || !annoValido.value)

const manicchie = ref([])
const voto = reactive({ manicchia: '__sezioni', includiNonAventi: false })
const perManicchia = reactive({ gruppo: '', eta: 'tutti', pagamento: 'tutti' })
const nuovi = reactive({ eta: 'tutti' })
const pagamenti = reactive({ eta: 'tutti' })
const tessere = reactive({ escludiInattivi: false, avanzamento: 0 })
const conteggioSoci = reactive({ totale: 0, attivi: 0 })

/**
 * Socio attivo per le tessere: un pagamento negli ultimi 5 anni di calendario.
 */
const isSocioActive = (socio) => {
  if (!socio.tesseramenti || socio.tesseramenti.length === 0) return false
  const ultimo = Math.max(...socio.tesseramenti.map((t) => t.anno))
  return ultimo >= new Date().getFullYear() - 5
}

onMounted(async () => {
  try {
    const [gruppi, soci] = await Promise.all([getUniqueGroups(), getAllSociWithTesseramenti()])
    manicchie.value = gruppi
    conteggioSoci.totale = soci.length
    conteggioSoci.attivi = soci.filter(isSocioActive).length
  } catch (error) {
    console.error('Errore caricamento dati:', error)
    toast.error('Non sono riuscito a leggere i soci dal database.')
  }
})

// Indirizzo del Report su misura che parte da un modello
const suMisura = (modello, opzioni = {}) => ({
  path: '/report-pdf/su-misura',
  query: { modello, anno: annoValido.value ? anno.value : annoCorrente, ...opzioni },
})
const personalizzaVoto = computed(() =>
  suMisura(
    'aventi-diritto',
    voto.manicchia && voto.manicchia !== '__sezioni' ? { manicchia: voto.manicchia } : {},
  ),
)
const personalizzaManicchia = computed(() =>
  suMisura('manicchia', {
    ...(perManicchia.gruppo ? { manicchia: perManicchia.gruppo } : {}),
    eta: ETA_SU_MISURA[perManicchia.eta],
    pagamento: PAGAMENTO_SU_MISURA[perManicchia.pagamento],
  }),
)

const avviso = (testo) => {
  toast.warning(testo)
  return null
}

/**
 * Esegue un modello: un solo modello alla volta, errori mostrati a parole.
 * @param {string} id
 * @param {() => Promise<string|null>} lavoro restituisce il messaggio di riuscita
 */
const genera = async (id, lavoro) => {
  if (bloccato.value) return
  inCorso.value = id
  try {
    const messaggio = await lavoro()
    if (messaggio) toast.success(messaggio)
  } catch (error) {
    console.error(`Report "${id}" non generato:`, error)
    toast.error('Non sono riuscito a creare il PDF: ' + error.message)
  } finally {
    inCorso.value = ''
  }
}

const verifica = (esito) => {
  if (!esito.success) throw new Error(esito.error)
  return esito
}

const generaAventiDiritto = () =>
  genera('aventi', async () => {
    const sezioni = voto.manicchia === '__sezioni'
    const elenco = elencoAventiDiritto(await getAllSociWithTesseramenti(), anno.value, {
      includiNonAventi: voto.includiNonAventi,
      manicchia: sezioni ? null : voto.manicchia || null,
    })
    if (elenco.gruppi.length === 0) {
      return avviso(`Nessun socio da elencare per le elezioni del ${anno.value}`)
    }
    await generateAventiDirittoPDF(elenco, anno.value, { perManicchia: sezioni })
    const { si, regolarizza } = elenco.totali
    return `PDF generato: ${si} con diritto, ${regolarizza} da regolarizzare`
  })

const generaVotazioniVecchio = () =>
  genera('votazioni', async () => {
    const elenco = await getVotingEligibleMembers(anno.value)
    if (elenco.length === 0) return avviso(`Nessun avente diritto trovato per il ${anno.value}`)
    await generateVotingListPDF(elenco, anno.value)
    return `PDF generato: ${elenco.length} soci`
  })

const generaPerManicchia = () =>
  genera('manicchia', async () => {
    const { gruppo, eta, pagamento } = perManicchia
    const soci = await getMembersByGroup(gruppo || null, eta, pagamento, anno.value)
    if (soci.length === 0) return avviso('Nessun socio con queste scelte')
    const esito = verifica(
      await generateMembersByGroupPDF(soci, gruppo, eta, pagamento, anno.value),
    )
    return `PDF generato: ${esito.totalMembers} soci`
  })

const generaConteggio = () =>
  genera('conteggio', async () => {
    const conteggi = await getGroupCountsForYear(anno.value)
    if (conteggi.length === 0) return avviso(`Nessun iscritto trovato nel ${anno.value}`)
    const esito = verifica(await generateGroupCountsPDF(conteggi, anno.value))
    return `PDF generato: ${esito.totalGroups} manicchie`
  })

const generaNuovi = () =>
  genera('nuovi', async () => {
    const soci = await getNewMembersByYear(anno.value, nuovi.eta)
    if (soci.length === 0) return avviso(`Nessun nuovo iscritto nel ${anno.value}`)
    const esito = verifica(await generateNewMembersPDF(soci, anno.value, nuovi.eta))
    return `PDF generato: ${esito.totalMembers} nuovi iscritti`
  })

const generaMinorenni = () =>
  genera('minorenni', async () => {
    const stato = statoDaModello('minorenni', anno.value)
    const righe = filtraSoci(await getAllSociWithTesseramenti(), stato)
    if (righe.length === 0) return avviso(`Nessun minorenne nel ${anno.value}`)
    await generateBetaDynamicPDF({
      righe,
      colonne: colonneReport(stato),
      titolo: titoloReport(stato),
      riassunto: riassunto(stato),
    })
    return `PDF generato: ${righe.length} minorenni`
  })

const generaAttivi = () =>
  genera('attivi', async () => {
    const soci = await getActiveMembersLast5Years(anno.value)
    if (soci.length === 0) return avviso(`Nessun socio attivo dal ${anno.value - 4}`)
    await generateActiveMembersPDF(soci, anno.value)
    return `PDF generato: ${soci.length} soci attivi`
  })

const generaRinnovi = () =>
  genera('rinnovi', async () => {
    await generateRenewalListPDF(await getAllSociWithTesseramenti(), anno.value)
    return 'PDF della lista rinnovi generato'
  })

const generaRecupero = () =>
  genera('recupero', async () => {
    const soci = await getChurnList(anno.value)
    if (soci.length === 0) {
      return `Nessuno da recuperare: chi ha pagato il ${anno.value - 1} ha pagato anche il ${anno.value}`
    }
    const esito = verifica(await generateChurnPDF(soci, anno.value))
    return `PDF generato: ${esito.count} soci da contattare`
  })

const generaPagamenti = () =>
  genera('pagamenti', async () => {
    const elenco = await getCompletePaymentList(pagamenti.eta)
    if (elenco.length === 0) return avviso('Nessun pagamento registrato')
    const esito = verifica(await generateCompletePaymentListPDF(elenco, pagamenti.eta))
    return `PDF generato: ${esito.totalPayments} pagamenti`
  })

const generaTutti = () =>
  genera('tutti', async () => {
    const fatti = []
    await generateRenewalListPDF(await getAllSociWithTesseramenti(), anno.value)
    fatti.push('lista rinnovi')

    const nuoviSoci = await getNewMembersByYear(anno.value, nuovi.eta)
    if (nuoviSoci.length > 0) {
      verifica(await generateNewMembersPDF(nuoviSoci, anno.value, nuovi.eta))
      fatti.push('nuovi iscritti')
    }

    const elenco = await getCompletePaymentList(pagamenti.eta)
    if (elenco.length > 0) {
      verifica(await generateCompletePaymentListPDF(elenco, pagamenti.eta))
      fatti.push('cronologia pagamenti')
    }

    const { gruppo, eta, pagamento } = perManicchia
    const soci = await getMembersByGroup(gruppo || null, eta, pagamento, anno.value)
    if (soci.length > 0) {
      verifica(await generateMembersByGroupPDF(soci, gruppo, eta, pagamento, anno.value))
      fatti.push('soci per manicchia')
    }

    const conteggi = await getGroupCountsForYear(anno.value)
    if (conteggi.length > 0) {
      verifica(await generateGroupCountsPDF(conteggi, anno.value))
      fatti.push('conteggio')
    }
    return `Generati ${fatti.length} PDF: ${fatti.join(', ')}`
  })

const generaTessere = () =>
  genera('tessere', async () => {
    tessere.avanzamento = 0
    let soci = await getAllSociWithTesseramenti()
    if (tessere.escludiInattivi) soci = soci.filter(isSocioActive)
    const risultati = await generateAllCardsPDF(soci, anno.value, (p) => {
      tessere.avanzamento = p
    })
    let totale = 0
    for (const r of risultati) {
      scaricaBlob(r.blob, r.filename)
      totale += r.count
    }
    return `Tessere generate: ${totale} soci`
  })
</script>

<style scoped>
.report-pdf {
  max-width: var(--page-width);
  margin: 0 auto;
  padding: var(--space-32);
}

.report-pdf :deep(.page-header) {
  margin-bottom: var(--space-8);
}

.anno {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.anno__label {
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.campo {
  width: auto;
  min-height: 2.5rem;
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-input-bg);
  box-shadow: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-label);
}

.campo--anno {
  width: 7rem;
}

.campo[aria-invalid='true'] {
  border-color: var(--color-danger);
}

.aiuto {
  margin: 0 0 var(--space-24);
  font-size: var(--font-size-label);
  color: var(--color-text-secondary);
}

.aiuto--errore {
  color: var(--color-danger);
}

.gruppo {
  margin-bottom: var(--space-32);
  padding: var(--space-8) var(--space-24);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-surface);
}

.gruppo__titolo {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin: var(--space-16) 0 0;
  font-size: var(--font-size-section-heading);
}

.gruppo__modelli {
  margin: 0;
  padding: 0;
  list-style: none;
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

.scelta__nota {
  color: var(--color-text-secondary);
}

/* Link con l'aspetto di un pulsante: portano a un'altra pagina */
.link-azione {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  min-height: 2.5rem;
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-control);
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}

.link-azione:hover {
  background: var(--color-surface-hover);
}

.link-azione--primario {
  border: 1px solid var(--color-accent);
}

.avanzamento {
  height: var(--space-8);
  background: var(--color-surface-hover);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.avanzamento__barra {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.2s ease;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 700px) {
  .report-pdf {
    padding: var(--space-16);
  }

  .gruppo {
    padding: var(--space-8) var(--space-16);
  }
}

@media (prefers-reduced-motion: reduce) {
  .avanzamento__barra {
    transition: none;
  }
}
</style>
