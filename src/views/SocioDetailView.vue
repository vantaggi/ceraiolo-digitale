<template>
  <div class="socio-detail">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Caricamento dati socio...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <h2><AppIcon name="errore" /> Errore</h2>
      <p>{{ error }}</p>
      <router-link to="/" class="back-button">
        <AppIcon name="indietro" /> Torna alla ricerca
      </router-link>
    </div>

    <!-- Main Content -->
    <div v-else-if="socio" class="detail-content">
      <!-- Header con nome e azioni -->
      <PageHeader :title="`${socio.cognome} ${socio.nome}`" back-to="/" back-label="Lista">
        <template #nav>
          <div class="nav-buttons" v-if="prevSocioId || nextSocioId">
            <router-link
              v-if="prevSocioId"
              :to="'/socio/' + prevSocioId"
              class="nav-btn"
              title="Precedente"
              >
              <AppIcon name="precedente" /> Prec</router-link
            >
            <router-link
              v-if="nextSocioId"
              :to="'/socio/' + nextSocioId"
              class="nav-btn"
              title="Successivo"
              >
              Succ <AppIcon name="successivo" /></router-link
            >
          </div>
        </template>
        <template #actions>
          <div class="header-actions">
            <BaseButton :loading="stampaTessera" :disabled="editMode" @click="generaTessera">
              <AppIcon name="tessera" /> Tessera {{ annoCorrente }}
            </BaseButton>
            <BaseButton :loading="isSaving" @click="toggleEditMode">
              <AppIcon :name="editMode ? 'conferma' : 'modifica'" />
              {{ editMode ? 'Salva' : 'Modifica' }}
            </BaseButton>
            <BaseButton
              v-if="annoProposto"
              variant="primary"
              :disabled="editMode"
              @click="payYear(annoProposto)"
            >
              <AppIcon name="pagamento" /> Paga {{ annoProposto }}
            </BaseButton>
          </div>
        </template>
      </PageHeader>

      <!-- Riepilogo: le tre domande che si fanno su un socio -->
      <dl class="riepilogo" aria-label="Riepilogo del socio">
        <div class="riepilogo__voce" :class="`riepilogo__voce--${CLASSI_QUOTA[riepilogo.quota]}`">
          <dt>Quota {{ riepilogo.anno }}</dt>
          <dd>{{ TESTI_QUOTA[riepilogo.quota] }}</dd>
        </div>
        <div
          class="riepilogo__voce"
          :class="`riepilogo__voce--${riepilogo.pagamento.inRegola ? 'ok' : riepilogo.pagamento.daReiscrivere ? 'errore' : 'attenzione'}`"
        >
          <dt>Arretrati</dt>
          <dd>
            <template v-if="riepilogo.pagamento.daReiscrivere">
              Da reiscrivere: fermo da più di 3 anni
            </template>
            <template v-else-if="riepilogo.pagamento.arretrati.length > 0">
              {{ riepilogo.pagamento.arretrati.join(', ') }}
            </template>
            <template v-else>Nessuno</template>
          </dd>
        </div>
        <div class="riepilogo__voce" :class="`riepilogo__voce--${CLASSI_VOTO[riepilogo.voto.stato]}`">
          <dt>Voto alle elezioni {{ riepilogo.anno }}</dt>
          <dd>
            {{ TESTI_VOTO[riepilogo.voto.stato] }}
            <span v-if="riepilogo.voto.motivo" class="riepilogo__motivo">
              {{ riepilogo.voto.motivo }}
            </span>
          </dd>
        </div>
      </dl>

      <!-- Sezione Dati Anagrafici -->
      <section class="info-section">
        <h2><AppIcon name="anagrafica" /> Dati Anagrafici</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Cognome</span>
            <input v-if="editMode" v-model="socio.cognome" type="text" class="edit-input" />
            <span v-else class="value">{{ socio.cognome }}</span>
          </div>

          <div class="info-item">
            <span class="label">Nome</span>
            <input v-if="editMode" v-model="socio.nome" type="text" class="edit-input" />
            <span v-else class="value">{{ socio.nome }}</span>
          </div>

          <div class="info-item">
            <span class="label">Data di Nascita</span>
            <input v-if="editMode" v-model="socio.data_nascita" type="date" class="edit-input" />
            <span v-else class="value">
              {{ formatDate(socio.data_nascita) }}
              <span class="age-badge" :class="{ minor: isMinor }"> {{ calculateAge }} anni </span>
            </span>
          </div>

          <div class="info-item">
            <span class="label">Luogo di Nascita</span>
            <input v-if="editMode" v-model="socio.luogo_nascita" type="text" class="edit-input" />
            <span v-else class="value">{{ socio.luogo_nascita }}</span>
          </div>

          <div class="info-item">
            <span class="label">Manicchia di Appartenenza</span>
            <input
              v-if="editMode"
              v-model="socio.gruppo_appartenenza"
              type="text"
              class="edit-input"
            />
            <span v-else class="value">{{ socio.gruppo_appartenenza }}</span>
          </div>

          <div class="info-item">
            <span class="label">Prima Iscrizione</span>
            <input
              v-if="editMode"
              v-model.number="socio.data_prima_iscrizione"
              type="number"
              class="edit-input"
            />
            <span v-else class="value">{{ primaIscrizioneDisplay }}</span>
          </div>
        </div>

        <!-- Note -->
        <div class="notes-section">
          <span class="label"><AppIcon name="nota" /> Note</span>
          <textarea
            v-if="editMode"
            v-model="socio.note"
            class="edit-textarea"
            rows="3"
            placeholder="Aggiungi note..."
          ></textarea>
          <p v-else class="notes-text">
            {{ socio.note || 'Nessuna nota disponibile' }}
          </p>
        </div>
      </section>

      <!-- Pagamenti: una riga per anno -->
      <section class="payments-section" aria-labelledby="titolo-pagamenti">
        <h2 id="titolo-pagamenti"><AppIcon name="quota" /> Pagamenti</h2>
        <div class="tabella-scorre">
          <table class="pagamenti">
            <thead>
              <tr>
                <th scope="col">Anno</th>
                <th scope="col">Stato</th>
                <th scope="col">Data</th>
                <th scope="col" class="pagamenti__numero">Quota</th>
                <th scope="col">Ricevuta / blocchetto</th>
                <th scope="col"><span class="sr-only">Azioni</span></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="riga in cronologia"
                :key="riga.chiave"
                :class="{ 'pagamenti__riga--futura': riga.anno > annoCorrente }"
              >
                <th scope="row">{{ riga.anno }}</th>
                <td>
                  <span class="stato" :class="`stato--${CLASSI_QUOTA[riga.stato]}`">
                    <span aria-hidden="true">{{ riga.stato }}</span> {{ TESTI_QUOTA[riga.stato] }}
                  </span>
                </td>
                <template v-if="riga.pagamento">
                  <td>{{ formatDate(riga.pagamento.data_pagamento) }}</td>
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
                  <td>
                    {{ riga.pagamento.numero_ricevuta || '-' }} /
                    {{ riga.pagamento.numero_blocchetto || '-' }}
                  </td>
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
                      @click="deleteTesseramento(riga.pagamento.id_tesseramento)"
                    >
                      <AppIcon name="elimina" />
                    </button>
                  </td>
                </template>
                <template v-else>
                  <td colspan="3" class="pagamenti__vuoto">-</td>
                  <td class="pagamenti__azioni">
                    <button
                      v-if="riga.stato !== '-' && riga.anno !== annoProposto"
                      type="button"
                      class="link-btn"
                      @click="payYear(riga.anno)"
                    >
                      Paga {{ riga.anno }}
                    </button>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Azioni rare, in fondo -->
      <section class="altre-azioni" aria-labelledby="titolo-altre-azioni">
        <h2 id="titolo-altre-azioni">Altre azioni</h2>
        <div class="altre-azioni__elenco">
          <BaseButton variant="ghost" @click="exportSocio">
            <AppIcon name="esporta" /> Esporta i dati del socio (JSON)
          </BaseButton>
          <BaseButton variant="danger" :disabled="isDeleting || editMode" @click="showDeleteModal">
            <AppIcon name="elimina" /> Elimina socio
          </BaseButton>
        </div>
      </section>

      <!-- Modal Aggiungi Pagamento -->
      <AddPaymentModal
        :show="showAddPaymentModal"
        :socio-id="socio?.id?.toString()"
        :years-to-pay="paymentYearToAdd ? [paymentYearToAdd] : []"
        :anno-riferimento="paymentYearToAdd || new Date().getFullYear()"
        @payments-saved="handlePaymentSaved"
        @close="closeAddPaymentModal"
      />

      <!-- Modal Conferma Eliminazione -->
      <ConfirmDeleteModal
        :is-visible="showDeleteConfirmModal"
        :socio-name="socio ? `${socio.cognome} ${socio.nome}` : ''"
        @close="closeDeleteModal"
        @confirm="confirmDeleteSocio"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { askConfirm } from '@/composables/useDialog'
import {
  db,
  getSocioById,
  getTesseramentiBySocioId,
  addTesseramento,
  deleteSocio,
  updateTesseramentoQuota,
} from '@/services/db'
import { generateSingleCardPDF } from '@/services/export'
import { annoDaPagare, cronologiaSocio, riepilogoSocio } from '@/utils/schedaSocio'
import BaseButton from '@/components/base/BaseButton.vue'
import AddPaymentModal from '@/components/AddPaymentModal.vue'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import PageHeader from '@/components/base/PageHeader.vue'

const route = useRoute()

// Stato del componente
const socio = ref(null)
const tesseramenti = ref([])
const loading = ref(true)
const error = ref(null)
const editMode = ref(false)
const isSaving = ref(false)
const showAddPaymentModal = ref(false)
const paymentYearToAdd = ref(new Date().getFullYear())
const showDeleteConfirmModal = ref(false)
const isDeleting = ref(false)

// Dirty check for unsaved changes
const originalMemberData = ref(null)
const hasUnsavedChanges = ref(false)

// Edit Quota State
const editingQuotaId = ref(null)
const editQuotaValue = ref(0)
const saveQuotaLoading = ref(false)

// Toast notifications
const toast = useToast()
const router = useRouter()

// Navigation State
const prevSocioId = ref(null)
const nextSocioId = ref(null)

// Testi e colori degli stati, come nei report (V, X, O, -)
const TESTI_QUOTA = { V: 'Pagata', X: 'Da pagare', O: 'Esente (minorenne)', '-': 'Non iscritto' }
const CLASSI_QUOTA = { V: 'ok', X: 'errore', O: 'attenzione', '-': 'neutro' }
const TESTI_VOTO = { si: 'Sì', regolarizza: 'Dopo gli arretrati', no: 'No' }
const CLASSI_VOTO = { si: 'ok', regolarizza: 'attenzione', no: 'neutro' }

const annoCorrente = new Date().getFullYear()
const annoProposto = computed(() => annoDaPagare(tesseramenti.value, annoCorrente))
const riepilogo = computed(() => riepilogoSocio(socio.value, tesseramenti.value, annoCorrente))
const cronologia = computed(() => cronologiaSocio(socio.value, tesseramenti.value, annoCorrente))
const euro = (valore) => Number(valore || 0).toFixed(2)

// Tessera dell'anno in corso, come dalla scheda nella Home
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

/**
 * Calcola ID precedente/successivo basandosi sulla lista in localStorage
 */
const calculateNavigation = () => {
  try {
    const stored = localStorage.getItem('search_context_ids')
    if (stored) {
      const ids = JSON.parse(stored)
      const currentId = parseInt(route.params.id)
      const idx = ids.indexOf(currentId)

      if (idx !== -1) {
        prevSocioId.value = idx > 0 ? ids[idx - 1] : null
        nextSocioId.value = idx < ids.length - 1 ? ids[idx + 1] : null
      } else {
        prevSocioId.value = null
        nextSocioId.value = null
      }
    }
  } catch (e) {
    console.error('Nav calc error', e)
  }
}

// ---- Modifica Quota Logic ----
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
    const newQuota = Number(editQuotaValue.value)

    // Fallback import: updateTesseramentoQuota is now exported from db.js
    await updateTesseramentoQuota(id_tesseramento, newQuota)

    toast.success('Quota aggiornata con successo!')
    await loadSocioData() // Ricarica tutto
  } catch (error) {
    console.error('Errore aggiornamento quota:', error)
    toast.error('Errore durante l\'aggiornamento della quota: ' + error.message)
  } finally {
    saveQuotaLoading.value = false
    cancelEditQuota()
  }
}

// Watch per ricaricare i dati se cambia l'URL (navigazione next/prev)
watch(
  () => route.params.id,
  (newId) => {
    if (newId) loadSocioData()
  },
)

/**
 * Calcola l'età del socio
 */
const calculateAge = computed(() => {
  if (!socio.value?.data_nascita) return '?'

  const birthDate = new Date(socio.value.data_nascita)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
})

/**
 * Verifica se è minorenne
 */
const isMinor = computed(() => calculateAge.value < 18)

/**
 * Calcola e mostra l'anno di prima iscrizione
 */
const primaIscrizioneDisplay = computed(() => {
  if (!socio.value) return '-'

  // Prima controlla se è impostato esplicitamente
  if (socio.value.data_prima_iscrizione && socio.value.data_prima_iscrizione > 0) {
    return socio.value.data_prima_iscrizione
  }

  // Altrimenti calcola dal primo pagamento
  if (tesseramenti.value && tesseramenti.value.length > 0) {
    const anniPagati = tesseramenti.value.map((t) => t.anno).sort((a, b) => a - b)
    return anniPagati[0]
  }

  // Se non ci sono pagamenti, mostra l'anno corrente come default
  return new Date().getFullYear()
})

/**
 * Formatta una data
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/D'

  try {
    const date = new Date(dateString)
    return date
      .toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .replace(/\//g, '-')
  } catch {
    return dateString
  }
}

/**
 * Carica i dati del socio e i suoi tesseramenti
 */
const loadSocioData = async () => {
  loading.value = true
  error.value = null

  try {
    const socioId = parseInt(route.params.id)

    // Carica dati socio
    socio.value = await getSocioById(socioId)

    if (!socio.value) {
      error.value = 'Socio non trovato'
      return
    }

    // Carica tesseramenti
    tesseramenti.value = await getTesseramentiBySocioId(socioId)

    calculateNavigation()

  } catch (err) {
    console.error('Errore nel caricamento:', err)
    error.value = 'Errore nel caricamento dei dati: ' + err.message
  } finally {
    loading.value = false
  }
}

/**
 * Attiva/disattiva la modalità modifica o salva i dati
 */
const toggleEditMode = async () => {
  if (editMode.value) {
    // Salva modifiche
    await saveSocioChanges()
  } else {
    // Entra in modalità modifica
    editMode.value = true
  }
}

/**
 * Salva le modifiche ai dati anagrafici del socio
 */
const saveSocioChanges = async () => {
  //const oldData = { ...socio.value }
  if (!socio.value) return

  try {
    isSaving.value = true
    const newData = {
      cognome: socio.value.cognome,
      nome: socio.value.nome,
      data_nascita: socio.value.data_nascita,
      luogo_nascita: socio.value.luogo_nascita,
      gruppo_appartenenza: socio.value.gruppo_appartenenza,
      data_prima_iscrizione: socio.value.data_prima_iscrizione,
      note: socio.value.note,
      timestamp_modifica: Date.now(),
    }

    await db.soci.update(socio.value.id, newData)

    // Logga la modifica per il tracking
    // await logLocalChange('soci', socio.value.id, 'update', oldData, newData)

    editMode.value = false
    toast.success('Modifiche salvate con successo!')
  } catch (err) {
    console.error('Errore nel salvataggio socio:', err)
    toast.error('Errore nel salvataggio: ' + err.message)
  } finally {
    isSaving.value = false
  }
}

/**
 * Esporta i dati del socio corrente in formato JSON
 */
const exportSocio = async () => {
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

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
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
    toast.error("Errore nell'esportazione: " + err.message)
  }
}

/**
/**
 * Gestisce il salvataggio di un nuovo pagamento dal modal
 */
const handlePaymentSaved = async ({ details, years, socioId }) => {
  try {
    isSaving.value = true

    // Save payments for all selected years
    for (const year of years) {
      const tesseramentoData = {
        id_socio: socioId,
        anno: year,
        quota_pagata: details.quota_pagata,
        data_pagamento: details.data_pagamento,
        numero_ricevuta: details.numero_ricevuta,
        numero_blocchetto: details.numero_blocchetto,
      }

      await addTesseramento(tesseramentoData)
    }

    await loadSocioData() // Ricarica i dati del socio
    closeAddPaymentModal()
    toast.success('Pagamenti registrati con successo!')
  } catch (err) {
    console.error('Errore salvataggio pagamento:', err)
    toast.error('Errore nel salvataggio: ' + err.message)
  } finally {
    isSaving.value = false
  }
}

/**
 * Apre il modal per pagare un anno specifico
 */
const payYear = (anno) => {
  paymentYearToAdd.value = anno
  showAddPaymentModal.value = true
}

/**
 * Chiude il modal di aggiunta pagamento
 */
const closeAddPaymentModal = () => {
  showAddPaymentModal.value = false
  paymentYearToAdd.value = null
}

/**
 * Elimina un tesseramento
 */
const deleteTesseramento = async (id) => {
  const conferma = await askConfirm({
    title: 'Eliminare il pagamento?',
    message: "Il pagamento viene tolto dalla cronologia del socio. L'operazione non si annulla.",
    confirmLabel: 'Elimina pagamento',
    danger: true,
  })
  if (!conferma) return

  try {
    await db.tesseramenti.delete(id)
    await loadSocioData()
    toast.success('Pagamento eliminato')
  } catch (err) {
    toast.error('Errore: ' + err.message)
  }
}

/**
 * Mostra il modale di conferma eliminazione socio
 */
const showDeleteModal = () => {
  showDeleteConfirmModal.value = true
}

/**
 * Chiudi il modale di conferma eliminazione
 */
const closeDeleteModal = () => {
  showDeleteConfirmModal.value = false
}

/**
 * Conferma ed esegui l'eliminazione del socio
 */
const confirmDeleteSocio = async () => {
  if (!socio.value) return

  try {
    isDeleting.value = true
    await deleteSocio(socio.value.id)
    toast.success('Socio eliminato con successo!')
    router.push('/')
  } catch (error) {
    console.error('Errore eliminazione socio:', error)
    toast.error("Errore durante l'eliminazione: " + error.message)
    showDeleteConfirmModal.value = false
  } finally {
    isDeleting.value = false
  }
}

// Carica i dati al mount
onMounted(() => {
  loadSocioData()
})

// Watch for changes in edit mode to store original data
watch(editMode, (newEditMode) => {
  if (newEditMode && socio.value) {
    // Store original data when entering edit mode
    originalMemberData.value = {
      cognome: socio.value.cognome,
      nome: socio.value.nome,
      data_nascita: socio.value.data_nascita,
      luogo_nascita: socio.value.luogo_nascita,
      gruppo_appartenenza: socio.value.gruppo_appartenenza,
      data_prima_iscrizione: socio.value.data_prima_iscrizione,
      note: socio.value.note,
    }
    hasUnsavedChanges.value = false
  }
})

// Watch for changes in socio data during edit mode
watch(
  () => socio.value,
  (newSocio) => {
    if (editMode.value && originalMemberData.value && newSocio) {
      hasUnsavedChanges.value =
        newSocio.cognome !== originalMemberData.value.cognome ||
        newSocio.nome !== originalMemberData.value.nome ||
        newSocio.data_nascita !== originalMemberData.value.data_nascita ||
        newSocio.luogo_nascita !== originalMemberData.value.luogo_nascita ||
        newSocio.gruppo_appartenenza !== originalMemberData.value.gruppo_appartenenza ||
        newSocio.data_prima_iscrizione !== originalMemberData.value.data_prima_iscrizione ||
        newSocio.note !== originalMemberData.value.note
    }
  },
  { deep: true },
)

// Prevent navigation with unsaved changes
const handleBeforeUnload = (event) => {
  if (hasUnsavedChanges.value) {
    event.preventDefault()
    event.returnValue = 'Hai modifiche non salvate. Vuoi davvero lasciare la pagina?'
    return event.returnValue
  }
}

// Keyboard Navigation
// Keyboard Navigation
const handleKeydown = (e) => {
  // Shortcuts working everywhere (Global context of this view)
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    if (editMode.value) toggleEditMode() // Saves changes
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault()
    if (!editMode.value)
      toggleEditMode() // Enters edit mode
    // If already in edit mode, Ctrl+E could cancel? Or just do nothing. Let's toggle.
    else toggleEditMode()
    return
  }

  // Ignore navigation keys if typing in input/textarea
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  // Ignore if modals are open
  if (showAddPaymentModal.value || showDeleteConfirmModal.value) return

  if (e.key === 'j' || e.key === 'ArrowRight') {
    if (nextSocioId.value) router.push('/socio/' + nextSocioId.value)
  }
  if (e.key === 'k' || e.key === 'ArrowLeft') {
    if (prevSocioId.value) router.push('/socio/' + prevSocioId.value)
  }
}

// Add beforeunload listener
onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.socio-detail {
  max-width: var(--page-width);
  margin: 0 auto;
  padding: 2rem;
}

/* Loading & Error States */
.loading-container,
.error-container {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-container h2 {
  color: var(--color-accent);
}

.back-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  margin-top: 1rem;
}

.nav-buttons {
  display: flex;
  gap: 4px;
}

.nav-btn {
  text-decoration: none;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  transition: all 0.2s;
  border: 1px solid var(--color-border);
  font-weight: 600;
}

.nav-btn:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

/* Info Section */
.info-section {
  background-color: var(--color-surface);
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-md);
}

.info-section h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--color-primary);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-size: 1.1rem;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.age-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: var(--color-success);
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.age-badge.minor {
  background-color: var(--color-warning);
}

.edit-input,
.edit-textarea {
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  font-family: var(--font-family-body);
  transition: border-color 0.2s;
}

.edit-input:focus,
.edit-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
}

.notes-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.notes-text {
  margin: 0.5rem 0 0 0;
  color: var(--color-text-secondary);
  font-style: italic;
}

/* Riepilogo: quota, arretrati, voto */
.riepilogo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--space-12);
  margin: 0 0 var(--space-24);
}

.riepilogo__voce {
  padding: var(--space-12) var(--space-16);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-border-strong);
  border-radius: var(--radius-surface);
}

.riepilogo__voce dt {
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.riepilogo__voce dd {
  margin: var(--space-4) 0 0;
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text-primary);
}

.riepilogo__motivo {
  display: block;
  font-size: var(--font-size-label);
  font-weight: 400;
  color: var(--color-text-secondary);
}

.riepilogo__voce--ok {
  border-left-color: var(--color-success);
}

.riepilogo__voce--attenzione {
  border-left-color: var(--color-warning);
}

.riepilogo__voce--errore {
  border-left-color: var(--color-danger);
}

/* Pagamenti */
.payments-section {
  background-color: var(--color-surface);
  padding: var(--space-24);
  border-radius: var(--radius-surface);
  box-shadow: var(--shadow-md);
}

.payments-section h2 {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin: 0 0 var(--space-16);
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
  padding: var(--space-8) var(--space-12);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  white-space: nowrap;
}

.pagamenti thead th {
  color: var(--color-text-secondary);
  font-size: var(--font-size-caption);
  font-weight: 600;
}

.pagamenti tbody th {
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text-primary);
}

.pagamenti tbody tr:hover {
  background: var(--color-surface-hover);
}

.pagamenti__riga--futura {
  color: var(--color-text-secondary);
}

.pagamenti__numero {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.pagamenti th.pagamenti__numero {
  text-align: right;
}

.pagamenti__vuoto {
  color: var(--color-text-secondary);
}

.pagamenti__azioni {
  width: 1%;
  text-align: right;
}

.stato {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  font-weight: 600;
}

.stato > span {
  display: inline-grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--radius-control);
  color: var(--color-text-inverse);
  background: var(--color-text-secondary);
  font-size: var(--font-size-caption);
}

.stato--ok > span {
  background: var(--color-success);
}

.stato--attenzione > span {
  background: var(--color-warning);
}

.stato--errore > span {
  background: var(--color-danger);
}

.stato--errore {
  color: var(--color-danger);
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

.icona-btn {
  min-height: 2rem;
  padding: var(--space-4) var(--space-8);
  border: none;
  border-radius: var(--radius-control);
  background: none;
  box-shadow: none;
  color: var(--color-text-secondary);
}

.icona-btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.icona-btn--pericolo:hover:not(:disabled) {
  color: var(--color-danger);
}

.link-btn {
  min-height: 2rem;
  padding: var(--space-4) var(--space-8);
  border: none;
  border-radius: var(--radius-control);
  background: none;
  box-shadow: none;
  color: var(--color-accent);
  font-size: var(--font-size-label);
}

.link-btn:hover {
  background: var(--color-surface-hover);
}

/* Azioni rare */
.altre-azioni {
  margin-top: var(--space-32);
  padding-top: var(--space-16);
  border-top: 1px solid var(--color-border);
}

.altre-azioni h2 {
  margin: 0 0 var(--space-12);
  font-size: var(--font-size-label);
  color: var(--color-text-secondary);
}

.altre-azioni__elenco {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-12);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 768px) {
  .socio-detail {
    padding: 1rem;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
  }

  .header-actions button,
  .header-actions a {
    width: 100%;
    text-align: center;
    justify-content: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .table-header {
    display: none;
  }

  .table-row {
    padding: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .table-row > span::before {
    content: attr(data-label);
    font-weight: 600;
    display: block;
    margin-bottom: 0.25rem;
    color: var(--color-text-secondary);
  }
}
</style>
