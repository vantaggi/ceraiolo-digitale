<template>
  <div class="settings-view">
    <div class="container">
      <PageHeader title="Impostazioni" />
      <SectionTabs :tabs="SCHEDE_IMPOSTAZIONI" label="Schede delle impostazioni" />

      <div class="settings-content">
        <!-- Tab: Generale -->
        <div v-if="scheda === 'generale'" class="generale">
          <ListRows
            title="Valori proposti"
            :rows="righeGenerale"
            note="Premi una riga per cambiare il valore. I pagamenti e i soci già registrati non cambiano."
            @select="apriModifica"
          />
        </div>

        <BaseModal
          :open="!!modifica"
          :title="modifica?.label ?? ''"
          size="sm"
          :busy="salvataggioInCorso"
          @close="chiudiModifica"
        >
          <form
            v-if="modifica"
            id="modulo-impostazione"
            class="modifica"
            novalidate
            @submit.prevent="salvaModifica"
          >
            <label for="valore-impostazione" class="modifica__label">{{ modifica.campo }}</label>
            <input
              id="valore-impostazione"
              v-model="modifica.valore"
              type="text"
              :inputmode="modifica.inputmode"
              autocomplete="off"
              class="modifica__campo"
              :class="{ 'modifica__campo--numero': modifica.inputmode }"
              :aria-invalid="!!modifica.errore || undefined"
              :aria-describedby="modifica.errore ? 'valore-errore' : 'valore-aiuto'"
              data-autofocus
            />
            <p v-if="modifica.errore" id="valore-errore" class="modifica__errore" role="alert">
              {{ modifica.errore }}
            </p>
            <p v-else id="valore-aiuto" class="modifica__aiuto">{{ modifica.aiuto }}</p>
          </form>
          <template #footer>
            <BaseButton :disabled="salvataggioInCorso" @click="chiudiModifica">Annulla</BaseButton>
            <BaseButton
              variant="primary"
              type="submit"
              form="modulo-impostazione"
              :loading="salvataggioInCorso"
            >
              Salva
            </BaseButton>
          </template>
        </BaseModal>

        <!-- Tab: Template -->
        <section v-if="scheda === 'tessera'" class="settings-section">
          <h2><AppIcon name="tessera" /> Sfondo della tessera</h2>
          <p>
            Lo sfondo su cui vengono scritti nome e data di nascita. L'anteprima e' la pagina del
            PDF vero, generata come quella che va in stampa.
          </p>

          <div class="template-section">
            <!-- Anteprima Tessera -->
            <div class="preview-section">
              <h3>
                {{
                  modelloScelto ? 'Anteprima del file scelto (non ancora salvato)' : 'Anteprima tessera'
                }}
              </h3>
              <div class="card-preview">
                <AnteprimaTessera :socio="socioProva" :modello="modelloScelto || modelloSalvato" />
              </div>
              <div class="prova-nome">
                <label for="prova-cognome">Prova con un altro nome:</label>
                <div class="prova-campi">
                  <input
                    id="prova-cognome"
                    v-model="socioProva.cognome"
                    placeholder="Cognome"
                    aria-label="Cognome di prova"
                  />
                  <input v-model="socioProva.nome" placeholder="Nome" aria-label="Nome di prova" />
                  <input
                    v-model="socioProva.data_nascita"
                    type="date"
                    aria-label="Data di nascita di prova"
                  />
                </div>
              </div>
            </div>

            <!-- Controlli Template -->
            <div class="controls-section">
              <h3>Sfondo della tessera</h3>

              <div class="control-group">
                <label for="background-upload">Carica lo sfondo (foto o PDF):</label>
                <input
                  id="background-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  @change="handleTemplateUpload"
                  :disabled="isSaving"
                />
                <small class="help-text">
                  Foto JPG o PNG: riempie la tessera di 80,77 x 122,17 mm, i bordi in eccesso
                  vengono tagliati. PDF di una pagina: la tessera prende le misure della pagina.
                  Max 10MB.
                </small>
              </div>

              <div class="control-group" v-if="fileScelto">
                <label>File scelto:</label>
                <div class="pdf-info">
                  <span class="pdf-name">{{ fileScelto.name }}</span>
                  <span class="pdf-size">({{ formatFileSize(fileScelto.size) }})</span>
                  <span
                    v-if="infoScelto"
                    class="pdf-size"
                    :class="{ 'avviso-stampa': infoScelto.bassa }"
                  >
                    {{ infoScelto.testo }}
                  </span>
                </div>
              </div>

              <div class="action-buttons">
                <button @click="saveTemplate" :disabled="!modelloScelto || isSaving" class="save-button">
                  <AppIcon :name="isSaving ? 'caricamento' : 'salva'" :spin="isSaving" />
                  {{ isSaving ? 'Salvataggio...' : 'Salva sfondo' }}
                </button>

                <button
                  @click="resetTemplate"
                  :disabled="isSaving || (!modelloSalvato && !modelloScelto)"
                  class="reset-button"
                >
                  <AppIcon name="elimina" /> Rimuovi sfondo
                </button>
              </div>
            </div>
          </div>
        </section>

        <div v-if="scheda === 'dati'" class="dati">
          <DatiComputer />

          <section class="gruppo" aria-labelledby="gruppo-backup">
            <h2 id="gruppo-backup" class="gruppo__titolo">Backup</h2>
            <ul class="gruppo__righe">
              <li class="azione">
                <span class="azione__testo">
                  <span class="azione__nome">Cartella del backup</span>
                  <span class="azione__aiuto">
                    {{
                      !isFileSystemSupported
                        ? 'Questo browser non salva in una cartella: usa Scarica una copia.'
                        : backupStore.hasDirectory
                          ? backupStore.backupPath
                          : 'Nessuna cartella scelta.'
                    }}
                  </span>
                </span>
                <BaseButton :disabled="!isFileSystemSupported" @click="selectBackupFolder">
                  <AppIcon name="cartella" />
                  {{ backupStore.hasDirectory ? 'Cambia cartella' : 'Scegli la cartella' }}
                </BaseButton>
              </li>
              <li class="azione">
                <span class="azione__testo">
                  <span class="azione__nome">Backup automatico</span>
                  <span class="azione__aiuto">
                    {{
                      backupStore.isAuthorized
                        ? 'Salva una copia nella cartella a ogni modifica.'
                        : 'Prima scegli la cartella.'
                    }}
                  </span>
                </span>
                <BaseButton :disabled="!backupStore.isAuthorized" @click="toggleAutoBackup">
                  <AppIcon :name="backupStore.autoBackupEnabled ? 'disattivo' : 'automatico'" />
                  {{ backupStore.autoBackupEnabled ? 'Spegni' : 'Attiva' }}
                </BaseButton>
              </li>
              <li class="azione">
                <span class="azione__testo">
                  <span class="azione__nome">Copia adesso</span>
                  <span class="azione__aiuto">
                    {{
                      backupStore.isAuthorized
                        ? 'Salva subito una copia nella cartella.'
                        : 'Scarica subito una copia di tutti i dati.'
                    }}
                  </span>
                </span>
                <BaseButton variant="primary" :loading="isSavingBackup" @click="forceBackup">
                  <AppIcon :name="backupStore.isAuthorized ? 'salva' : 'esporta'" />
                  {{ backupStore.isAuthorized ? 'Salva adesso' : 'Scarica una copia' }}
                </BaseButton>
              </li>
            </ul>
          </section>

          <section class="gruppo" aria-labelledby="gruppo-esporta">
            <h2 id="gruppo-esporta" class="gruppo__titolo">Esporta</h2>
            <ul class="gruppo__righe">
              <li class="azione">
                <span class="azione__testo">
                  <span class="azione__nome">Archivio completo</span>
                  <span class="azione__aiuto">
                    File .sqlite con soci, pagamenti e impostazioni, per spostare i dati.
                  </span>
                </span>
                <BaseButton :disabled="isExporting" @click="exportDatabase">
                  <AppIcon name="esporta" /> Scarica
                </BaseButton>
              </li>
              <li class="azione">
                <span class="azione__testo">
                  <span class="azione__nome">Excel</span>
                  <span class="azione__aiuto">Elenchi dei maggiorenni e dei minorenni.</span>
                </span>
                <BaseButton :disabled="isExporting" @click="exportExcel">
                  <AppIcon name="foglio-calcolo" /> Scarica
                </BaseButton>
              </li>
              <li class="azione">
                <span class="azione__testo">
                  <span class="azione__nome">Registro modifiche</span>
                  <span class="azione__aiuto">
                    Le modifiche fatte da questo browser, da allegare quando si passano i dati.
                  </span>
                </span>
                <BaseButton :disabled="isExporting" @click="exportChangeLogData">
                  <AppIcon name="changelog" /> Scarica
                </BaseButton>
              </li>
              <li class="azione">
                <span class="azione__testo">
                  <span class="azione__nome">Impostazioni</span>
                  <span class="azione__aiuto">Solo le impostazioni, in un file .json.</span>
                </span>
                <span class="azione__bottoni">
                  <BaseButton :disabled="isExporting" @click="exportSettings">
                    <AppIcon name="esporta" /> Esporta
                  </BaseButton>
                  <label class="file-button" :class="{ 'file-button--disattivo': isExporting }">
                    Importa
                    <input
                      type="file"
                      accept=".json"
                      class="file-button__input"
                      :disabled="isExporting"
                      @change="handleImportSettings"
                    />
                  </label>
                </span>
              </li>
            </ul>
          </section>

          <section class="gruppo" aria-labelledby="gruppo-ripristina">
            <h2 id="gruppo-ripristina" class="gruppo__titolo">Ripristina</h2>
            <ul class="gruppo__righe">
              <li class="azione">
                <span class="azione__testo">
                  <span class="azione__nome">Ripristina da un backup</span>
                  <span class="azione__aiuto">
                    Sostituisce tutti i dati di questo browser con quelli del file .sqlite. Prima
                    chiede conferma.
                  </span>
                </span>
                <label class="file-button" :class="{ 'file-button--disattivo': isExporting }">
                  <AppIcon name="ripristina" /> Scegli il file
                  <input
                    id="restore-file"
                    type="file"
                    accept=".sqlite,.db"
                    class="file-button__input"
                    :disabled="isExporting"
                    @change="handleRestoreDatabase"
                  />
                </label>
              </li>
            </ul>
          </section>

          <section class="gruppo" aria-labelledby="gruppo-controllo">
            <h2 id="gruppo-controllo" class="gruppo__titolo">Controllo dei dati</h2>
            <div class="gruppo__corpo">
              <ControlloQualitaDati />
            </div>
          </section>

          <section class="gruppo gruppo--pericolo" aria-labelledby="gruppo-pericolo">
            <h2 id="gruppo-pericolo" class="gruppo__titolo">
              <AppIcon name="pericolo" /> Zona pericolosa
            </h2>
            <p class="gruppo__nota">
              Cambiano o cancellano i dati di tutti i soci. Fai prima una copia.
            </p>
            <ul class="gruppo__righe">
              <li class="azione">
                <span class="azione__testo">
                  <span class="azione__nome">Correggi blocchetti e ricevute invertiti</span>
                  <span class="azione__aiuto">
                    Scambia di nuovo blocchetto e ricevuta nei pagamenti storici importati al
                    contrario.
                  </span>
                </span>
                <BaseButton :disabled="isExporting" @click="runNormalization">
                  <AppIcon name="ripara" /> Correggi
                </BaseButton>
              </li>
              <li class="azione">
                <span class="azione__testo">
                  <span class="azione__nome">Cancella tutti i dati</span>
                  <span class="azione__aiuto">
                    Soci, pagamenti e impostazioni: l'app torna come appena installata.
                  </span>
                </span>
                <BaseButton variant="danger" :disabled="isExporting" @click="confirmFactoryReset">
                  <AppIcon name="elimina" /> Cancella tutto
                </BaseButton>
              </li>
            </ul>
          </section>
        </div>

        <div v-if="scheda === 'manicchie'" class="manicchie">
          <p class="manicchie__intro">
            Rinominandone una si aggiornano tutti i suoi soci. Quelle aggiunte qui compaiono subito
            nei menu, anche prima di avere soci.
          </p>

          <form class="add-zone-form" @submit.prevent="addNewZone">
            <label for="nuova-manicchia" class="sr-only">Nome della nuova manicchia</label>
            <input
              id="nuova-manicchia"
              v-model="newZoneName"
              type="text"
              placeholder="Nome della nuova manicchia"
              class="campo"
            />
            <BaseButton type="submit" variant="primary" :disabled="!newZoneName.trim()">
              <AppIcon name="aggiungi" /> Aggiungi
            </BaseButton>
          </form>

          <p v-if="isLoadingZones" class="empty-state">
            <AppIcon name="caricamento" spin /> Caricamento...
          </p>
          <p v-else-if="zones.length === 0" class="empty-state">Nessuna manicchia definita.</p>
          <section v-else class="gruppo" aria-labelledby="gruppo-manicchie">
            <h2 id="gruppo-manicchie" class="gruppo__titolo">
              {{ zones.length }} {{ zones.length === 1 ? 'manicchia' : 'manicchie' }}
            </h2>
            <ul class="gruppo__righe">
              <li v-for="zone in zones" :key="zone" class="azione zone-item">
                <span v-if="editingZone !== zone" class="zone-name">{{ zone }}</span>
                <template v-else>
                  <label :for="`rinomina-${zone}`" class="sr-only">Nuovo nome di {{ zone }}</label>
                  <input
                    :id="`rinomina-${zone}`"
                    ref="editInput"
                    v-model="editingZoneName"
                    type="text"
                    class="campo edit-input"
                    @keyup.enter="saveZoneRename(zone)"
                    @keyup.esc="cancelRename"
                  />
                </template>

                <span class="azione__bottoni">
                  <template v-if="editingZone !== zone">
                    <button
                      type="button"
                      class="icona-btn"
                      title="Rinomina"
                      :aria-label="`Rinomina ${zone}`"
                      @click="startRename(zone)"
                    >
                      <AppIcon name="modifica" />
                    </button>
                    <!-- Toglie solo dalla lista delle manicchie definite: i soci restano -->
                    <button
                      type="button"
                      class="icona-btn icona-btn--pericolo"
                      title="Rimuovi dalla lista (i soci restano)"
                      :aria-label="`Rimuovi ${zone} dalla lista`"
                      @click="deleteZone(zone)"
                    >
                      <AppIcon name="elimina" />
                    </button>
                  </template>
                  <template v-else>
                    <BaseButton variant="primary" @click="saveZoneRename(zone)">
                      <AppIcon name="salva" /> Salva
                    </BaseButton>
                    <BaseButton variant="ghost" @click="cancelRename">Annulla</BaseButton>
                  </template>
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { QUOTA_NUOVI_PREDEFINITA, QUOTA_ORDINARIA_PREDEFINITA } from '@/utils/payment'
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { askConfirm } from '@/composables/useDialog'
import {
  getSetting,
  updateSetting,
  downloadDatabaseExport,
  exportChangeLog,
  normalizeDatabaseData,
  importDatabaseFromSqlite,
  wipeDatabase,
  getDataAuditStats,
  getUniqueGroups,
  addCustomGroup,
  removeCustomGroup,
  renameGroup,
} from '@/services/db'
import { exportDataToExcel, exportSettingsToJson, importSettingsFromJson } from '@/services/export'
import { useBackupStore } from '@/stores/backupStore'
import { backupService } from '@/services/backupService'
import { PDFDocument } from 'pdf-lib'
import AnteprimaTessera from '@/components/AnteprimaTessera.vue'
import {
  caricaModelloTessera,
  LARGHEZZA_TESSERA_MM,
  ALTEZZA_TESSERA_MM,
} from '@/services/tessere'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ListRows from '@/components/base/ListRows.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import SectionTabs from '@/components/base/SectionTabs.vue'
import { SCHEDE_IMPOSTAZIONI } from '@/router/sezioni'
import ControlloQualitaDati from '@/components/ControlloQualitaDati.vue'
import DatiComputer from '@/components/DatiComputer.vue'

const toast = useToast()
// Citta' proposta se l'impostazione non e' mai stata salvata (come Nuovo socio e Registra ricevute)
const CITTA_PREDEFINITA = 'Gubbio'

// Stato del componente
// Sfondo della tessera: quello salvato e quello scelto ma non ancora salvato
const modelloSalvato = ref(null)
const modelloScelto = ref(null)
const fileScelto = ref(null)
const infoScelto = ref(null)
const socioProva = ref({ cognome: 'Rossi', nome: 'Mario', data_nascita: '1980-05-15' })
const isSaving = ref(false)
const isExporting = ref(false)
const isSavingBackup = ref(false)

// La scheda arriva dall'indirizzo (/settings, /settings/tessera, /settings/dati, ...)
const props = defineProps({
  scheda: { type: String, default: 'generale' },
})
const isFileSystemSupported = ref(typeof window.showDirectoryPicker === 'function')

const appConfig = ref({
  receiptsPerBlock: 10,
  defaultQuota: QUOTA_ORDINARIA_PREDEFINITA,
  newMemberQuota: QUOTA_NUOVI_PREDEFINITA,
  defaultCity: CITTA_PREDEFINITA,
})

const backupStore = useBackupStore()

// Carica il template attuale al mount
onMounted(async () => {
  // Init backup service (checks if we have permission from previous session)
  await backupService.initialize()

  try {
    modelloSalvato.value = await caricaModelloTessera()
  } catch (error) {
    console.error('Errore caricamento template:', error)
    toast.error('Errore nel caricamento del template attuale')
  }

  // Carica configurazioni app
  try {
    appConfig.value.receiptsPerBlock = await getSetting('receiptsPerBlock', 10)
    appConfig.value.defaultQuota = await getSetting('defaultQuota', QUOTA_ORDINARIA_PREDEFINITA)
    appConfig.value.newMemberQuota = await getSetting('newMemberQuota', QUOTA_NUOVI_PREDEFINITA)
    appConfig.value.defaultCity = await getSetting('defaultCity', CITTA_PREDEFINITA)
  } catch (error) {
    console.error('Errore caricamento config:', error)
  }
})

/**
 * Gestisce selezione cartella backup
 */
const selectBackupFolder = async () => {
  const success = await backupService.selectBackupDirectory()
  if (success) {
    toast.success('Cartella di backup configurata!')
  }
}

/**
 * Toggle auto backup
 */
const toggleAutoBackup = () => {
  if (!backupStore.isAuthorized) {
    toast.error('Devi prima selezionare una cartella!')
    return
  }
  const newState = !backupStore.autoBackupEnabled
  backupStore.toggleAutoBackup(newState)
  if (newState) {
    // Try a backup immediately to confirm it works
    backupService.performBackup(false)
  }
}

/**
 * Force manual backup to local folder
 */
const forceBackup = async () => {
  try {
    isSavingBackup.value = true
    // If authorized, try FS API. If fails or not auth, it returns false (or we handle it).
    // Actually performBackup(true) in backupService handles FS API.
    // We want to force download if FS API is not available/authorized.
    if (backupStore.isAuthorized) {
      await backupService.performBackup(true)
    } else {
      // Fallback to standard download
      await downloadDatabaseExport()
      toast.success('Backup scaricato con successo (Download)')
    }
  } catch (e) {
    console.error(e)
    toast.error('Errore backup: ' + e.message)
  } finally {
    isSavingBackup.value = false
  }
}

/**
 * Handle Restore Database
 */
const handleRestoreDatabase = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const conferma = await askConfirm({
    title: 'Ripristinare il backup?',
    message: `I dati attuali vengono sostituiti da quelli di "${file.name}". L'operazione non si annulla.`,
    confirmLabel: 'Ripristina backup',
    danger: true,
  })
  if (!conferma) {
    event.target.value = '' // Reset input
    return
  }

  try {
    isExporting.value = true // reusing export spinner path
    toast.info('Ripristino in corso...')

    const result = await importDatabaseFromSqlite(file)
    if (result.success) {
      toast.success('Database ripristinato con successo! Ricarica della pagina...')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } else {
      toast.error('Errore ripristino: ' + result.error)
    }
  } catch (error) {
    console.error('Restore failed:', error)
    toast.error('Errore durante il ripristino')
  } finally {
    isExporting.value = false
    event.target.value = ''
  }
}

/**
 * Legge il file scelto per lo sfondo, senza salvarlo: l'anteprima lo mostra subito
 */
const handleTemplateUpload = async (event) => {
  const file = event.target.files[0]
  event.target.value = ''
  if (!file) return

  if (file.size > 10 * 1024 * 1024) {
    toast.error('Il file è troppo grande. Dimensione massima: 10MB')
    return
  }

  try {
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      const dati = new Uint8Array(await file.arrayBuffer())
      // Un PDF illeggibile si scarta subito, non al momento di stampare
      const pdf = await PDFDocument.load(dati)
      fileScelto.value = file
      modelloScelto.value = { tipo: 'pdf', dati }
      infoScelto.value =
        pdf.getPageCount() > 1
          ? { testo: `Il PDF ha ${pdf.getPageCount()} pagine: si usa solo la prima.`, bassa: true }
          : null
    } else if (['image/jpeg', 'image/png'].includes(file.type)) {
      const dati = await leggiComeDataUrl(file)
      const { width, height } = await misuraImmagine(dati)
      // Risoluzione che avra' la foto stampata sulla tessera
      const dpi = Math.round(
        Math.min(width / LARGHEZZA_TESSERA_MM, height / ALTEZZA_TESSERA_MM) * 25.4,
      )
      fileScelto.value = file
      modelloScelto.value = { tipo: 'immagine', dati }
      infoScelto.value = {
        testo:
          `${width} x ${height} pixel, circa ${dpi} dpi sulla tessera` +
          (dpi < 250 ? ': in stampa potrebbe sembrare sgranata.' : '.'),
        bassa: dpi < 250,
      }
    } else {
      toast.error('Scegli una foto JPG o PNG oppure un PDF')
    }
  } catch (error) {
    console.error('File sfondo non leggibile:', error)
    toast.error('Il file non si riesce a leggere. Prova a esportarlo di nuovo.')
  }
}

const leggiComeDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const misuraImmagine = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Immagine non leggibile'))
    img.src = src
  })

/**
 * Formatta la dimensione del file in formato leggibile
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Salva lo sfondo scelto: o un PDF o una foto, mai tutti e due
 */
const saveTemplate = async () => {
  if (!modelloScelto.value) return

  try {
    isSaving.value = true
    const { tipo, dati } = modelloScelto.value
    if (tipo === 'pdf') {
      await updateSetting('cardTemplatePDF', Array.from(dati))
      await updateSetting('cardBackground', null)
    } else {
      await updateSetting('cardBackground', dati)
      await updateSetting('cardTemplatePDF', null)
    }
    modelloSalvato.value = await caricaModelloTessera()
    modelloScelto.value = null
    fileScelto.value = null
    infoScelto.value = null
    toast.success('Sfondo della tessera salvato')
  } catch (error) {
    console.error('Errore salvataggio template:', error)
    toast.error('Errore durante il salvataggio dello sfondo')
  } finally {
    isSaving.value = false
  }
}

/**
 * Rimuove lo sfondo: senza, le tessere non si possono generare
 */
const resetTemplate = async () => {
  if (modelloScelto.value) {
    // Il file scelto non e' ancora salvato: basta scartarlo
    modelloScelto.value = null
    fileScelto.value = null
    infoScelto.value = null
    return
  }
  const conferma = await askConfirm({
    title: 'Rimuovere lo sfondo della tessera?',
    message: 'Senza sfondo le tessere non si possono generare finché non ne carichi un altro.',
    confirmLabel: 'Rimuovi sfondo',
    danger: true,
  })
  if (!conferma) return

  try {
    isSaving.value = true
    await updateSetting('cardBackground', null)
    await updateSetting('cardTemplatePDF', null)
    await updateSetting('cardWidth', null)
    await updateSetting('cardHeight', null)
    modelloSalvato.value = null
    toast.success('Sfondo rimosso')
  } catch (error) {
    console.error('Errore ripristino template:', error)
    toast.error('Errore durante la rimozione dello sfondo')
  } finally {
    isSaving.value = false
  }
}

/**
 * Esporta il database in formato SQLite
 */
const exportDatabase = async () => {
  try {
    // 1. Health Check
    const health = await getDataAuditStats()

    if (health.summary.total_issues > 0) {
      const conferma = await askConfirm({
        title: 'Esportare con dati incompleti?',
        message: `Ci sono ${health.summary.total_issues} problemi nei dati (per esempio date mancanti). Conviene risolverli prima del backup, ma puoi esportare comunque.`,
        confirmLabel: 'Esporta comunque',
      })
      if (!conferma) {
        return
      }
    }

    isExporting.value = true
    toast.info('Preparazione export database...')

    await downloadDatabaseExport()

    toast.success('Database esportato con successo!')
  } catch (error) {
    console.error('Errore esportazione database:', error)
    toast.error("Errore durante l'esportazione del database")
  } finally {
    isExporting.value = false
  }
}

/**
 * Esporta i dati in formato Excel
 */
const exportExcel = async () => {
  try {
    isExporting.value = true
    toast.info('Preparazione export Excel...')

    await exportDataToExcel()

    toast.success('Dati esportati in Excel con successo!')
  } catch (error) {
    console.error('Errore esportazione Excel:', error)
    toast.error("Errore durante l'esportazione Excel")
  } finally {
    isExporting.value = false
  }
}

// Impostazioni > Generale: una riga per valore, la modifica in una finestra (bozza 1A).
const IMPOSTAZIONI_GENERALI = {
  defaultCity: {
    label: 'Città proposta per i nuovi soci',
    campo: 'Città',
    aiuto: 'Si propone come luogo di nascita in Nuovo socio e in Registra ricevute.',
    mostra: (v) => v || 'Nessuna',
    leggi: (testo) => {
      const citta = testo.trim()
      return citta ? { valore: citta } : { errore: 'Scrivi il nome di una città.' }
    },
  },
  receiptsPerBlock: {
    label: 'Ricevute per blocchetto',
    campo: 'Numero di ricevute',
    inputmode: 'numeric',
    aiuto: 'Le ricevute sono numerate di seguito: con 10, il blocchetto 2 va da 11 a 20.',
    mostra: (v) => String(v),
    leggi: (testo) => {
      const n = Number(testo)
      return Number.isInteger(n) && n >= 1 && n <= 100
        ? { valore: n }
        : { errore: 'Scrivi un numero intero da 1 a 100.' }
    },
  },
  defaultQuota: {
    label: 'Quota ordinaria',
    campo: 'Importo (€)',
    inputmode: 'decimal',
    aiuto: 'Proposta nel pagamento di chi rinnova.',
    mostra: (v) => formatoEuro(v),
    leggi: leggiImporto,
  },
  newMemberQuota: {
    label: 'Quota dei nuovi soci',
    campo: 'Importo (€)',
    inputmode: 'decimal',
    aiuto: 'Proposta nel pagamento di chi è al primo anno o rientra dopo almeno un anno fuori.',
    mostra: (v) => formatoEuro(v),
    leggi: leggiImporto,
  },
}

function formatoNumero(v) {
  return Number(v).toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  })
}

function formatoEuro(v) {
  return `€ ${formatoNumero(v)}`
}

function leggiImporto(testo) {
  const n = Number(String(testo).replace(',', '.'))
  return String(testo).trim() !== '' && Number.isFinite(n) && n >= 0
    ? { valore: n }
    : { errore: 'Scrivi un importo uguale o maggiore di zero.' }
}

const righeGenerale = computed(() =>
  Object.entries(IMPOSTAZIONI_GENERALI).map(([id, def]) => ({
    id,
    label: def.label,
    value: def.mostra(appConfig.value[id]),
  })),
)

const modifica = ref(null)
const salvataggioInCorso = ref(false)

const apriModifica = (riga) => {
  const def = IMPOSTAZIONI_GENERALI[riga.id]
  modifica.value = {
    id: riga.id,
    label: def.label,
    campo: def.campo,
    inputmode: def.inputmode,
    aiuto: def.aiuto,
    valore:
      def.inputmode === 'decimal'
        ? formatoNumero(appConfig.value[riga.id])
        : String(appConfig.value[riga.id] ?? ''),
    errore: '',
  }
}

const chiudiModifica = () => {
  if (!salvataggioInCorso.value) modifica.value = null
}

const salvaModifica = async () => {
  const { id, valore } = modifica.value
  const letto = IMPOSTAZIONI_GENERALI[id].leggi(String(valore ?? ''))
  if (letto.errore) {
    modifica.value.errore = letto.errore
    return
  }
  try {
    salvataggioInCorso.value = true
    await updateSetting(id, letto.valore)
    appConfig.value[id] = letto.valore
    toast.success(
      `${IMPOSTAZIONI_GENERALI[id].label}: ${IMPOSTAZIONI_GENERALI[id].mostra(letto.valore)}`,
    )
    salvataggioInCorso.value = false
    modifica.value = null
  } catch (error) {
    console.error('Errore salvataggio impostazione:', error)
    modifica.value.errore = 'Non sono riuscito a salvare. Riprova.'
    salvataggioInCorso.value = false
  }
}

// --- NEW FEATURES ---

/**
 * Esporta Configurazione JSON
 */
const exportSettings = async () => {
  try {
    isExporting.value = true
    await exportSettingsToJson()
    toast.success('Configurazione esportata!')
  } catch (e) {
    toast.error(e.message)
  } finally {
    isExporting.value = false
  }
}

/**
 * Importa Configurazione JSON
 */
const handleImportSettings = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    isExporting.value = true // Reuse spinner
    const result = await importSettingsFromJson(file)
    if (result.success) {
      toast.success(`Configurazione importata! (${result.count} impostazioni)`)
      // Reload to apply settings
      setTimeout(() => window.location.reload(), 1000)
    }
  } catch (e) {
    toast.error('Errore importazione config: ' + e.message)
  } finally {
    isExporting.value = false
    event.target.value = ''
  }
}

/**
 * Factory Reset
 */
const confirmFactoryReset = async () => {
  const conferma = await askConfirm({
    title: 'Cancellare tutti i dati?',
    message:
      "Soci, pagamenti e impostazioni vengono cancellati e l'app torna come appena installata. Prima viene tentato un backup automatico. L'operazione non si annulla.",
    confirmLabel: 'Cancella tutti i dati',
    danger: true,
  })
  if (!conferma) {
    return
  }

  try {
    isExporting.value = true
    toast.info('Esecuzione backup di sicurezza...')
    await backupService.performBackup(true) // Force backup

    toast.info('Cancellazione dati in corso...')
    await wipeDatabase()

    toast.success('Reset completato. Riavvio applicazione...')
    setTimeout(() => window.location.reload(), 2000)
  } catch (e) {
    toast.error('Reset fallito: ' + e.message)
    isExporting.value = false
  }
}

// Registro modifiche e riparazione (prima stavano in fondo alla Home)
const exportChangeLogData = async () => {
  try {
    const result = await exportChangeLog()
    if (result.success) {
      const url = URL.createObjectURL(result.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Changelog esportato!')
    }
  } catch (error) {
    console.error('Export changelog failed:', error)
    toast.error('Errore export changelog')
  }
}

const runNormalization = async () => {
  const conferma = await askConfirm({
    title: 'Correggere blocchetti e ricevute?',
    message:
      'Il database viene controllato e i numeri di blocchetto e ricevuta scambiati (vecchio errore) vengono corretti automaticamente.',
    confirmLabel: 'Correggi',
  })
  if (!conferma) return
  try {
    const fixedCount = await normalizeDatabaseData()
    if (fixedCount > 0) {
      toast.success(`Normalizzazione completata! Sistemati ${fixedCount} record.`)
      // Ricarica per pulire cache locali
      window.location.reload()
    } else {
      toast.info('Tutti i record sono già corretti! Non c\'era nulla da sistemare.')
    }
  } catch (error) {
    console.error('Normalization error:', error)
    toast.error('Errore durante la normalizzazione: ' + error.message)
  }
}

// --- Zone Management Logic ---
const zones = ref([])
const newZoneName = ref('')
const isLoadingZones = ref(false)
const editingZone = ref(null)
const editingZoneName = ref('')

const loadZones = async () => {
  isLoadingZones.value = true
  try {
    zones.value = await getUniqueGroups()
  } catch (e) {
    console.error(e)
    toast.error('Errore nel caricamento delle manicchie')
  } finally {
    isLoadingZones.value = false
  }
}

watch(
  () => props.scheda,
  (scheda) => {
    if (scheda === 'manicchie') loadZones()
  },
  { immediate: true },
)

const addNewZone = async () => {
  if (!newZoneName.value.trim()) return
  try {
    await addCustomGroup(newZoneName.value)
    newZoneName.value = ''
    toast.success('Manicchia aggiunta')
    await loadZones()
  } catch (e) {
    toast.error(e.message)
  }
}

const deleteZone = async (zoneName) => {
  const conferma = await askConfirm({
    title: `Rimuovere la manicchia "${zoneName}"?`,
    message:
      'I soci di questa manicchia la mantengono, ma non viene più proposta nei menu se non ha soci.',
    confirmLabel: 'Rimuovi manicchia',
    danger: true,
  })
  if (!conferma) return

  try {
    await removeCustomGroup(zoneName)
    toast.success('Manicchia rimossa dalla lista')
    await loadZones()
  } catch (e) {
    toast.error(e.message)
  }
}

const startRename = (zoneName) => {
  editingZone.value = zoneName
  editingZoneName.value = zoneName
}

const cancelRename = () => {
  editingZone.value = null
  editingZoneName.value = ''
}

const saveZoneRename = async (oldName) => {
  if (!editingZoneName.value.trim() || editingZoneName.value === oldName) {
    cancelRename()
    return
  }

  const newName = editingZoneName.value.trim()

  const conferma = await askConfirm({
    title: 'Rinominare la manicchia?',
    message: `"${oldName}" diventa "${newName}" per tutti i soci di questa manicchia.`,
    confirmLabel: 'Rinomina manicchia',
  })
  if (!conferma) return

  try {
    const count = await renameGroup(oldName, newName)
    toast.success(`Manicchia rinominata: aggiornati ${count} soci`)
    cancelRename()
    await loadZones()
  } catch (e) {
    toast.error("Errore rinomina: " + e.message)
  }
}
</script>

<style scoped>
.settings-view {
  min-height: 100vh;
  background-color: var(--color-background);
  padding: 2rem 0;
}

.settings-content {
  padding-bottom: 3rem;
}

/* Generale: righe nome-valore e finestra di modifica */
.modifica {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.modifica__label {
  font-size: var(--font-size-label);
  font-weight: 500;
}

.modifica__campo {
  padding: var(--space-8) var(--space-12);
}

.modifica__campo--numero {
  max-width: 10rem;
  font-variant-numeric: tabular-nums;
}

.modifica__aiuto,
.modifica__errore {
  margin: 0;
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
}

.modifica__errore {
  color: var(--status-error);
}

.container {
  max-width: var(--page-width);
  margin: 0 auto;
  padding: 0 var(--space-32);
}

.file-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  min-height: 2.5rem;
  padding: var(--space-8) var(--space-16);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-weight: 600;
  cursor: pointer;
}

.file-button:hover {
  background: var(--color-surface-hover);
}

.file-button__input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.file-button:focus-within {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* Dati e Manicchie: gruppi come le righe di Generale (ListRows), ma ogni riga e' un'azione:
   nome e spiegazione a sinistra, il bottone a destra. La riga non si preme, il bottone si'. */
.dati,
.manicchie {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
  max-width: var(--page-width-form);
}

.gruppo {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.gruppo__titolo {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin: 0;
  font-family: var(--font-family-body);
  font-size: var(--font-size-label);
  font-weight: 600;
  color: var(--text-secondary);
}

.gruppo__nota,
.manicchie__intro {
  margin: 0;
  font-size: var(--font-size-label);
  color: var(--text-secondary);
}

.gruppo__righe {
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--background-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-surface);
}

.gruppo__corpo {
  padding: var(--space-12) var(--space-16);
  background: var(--background-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-surface);
}

.gruppo--pericolo .gruppo__titolo {
  color: var(--status-error);
}

.gruppo--pericolo .gruppo__righe {
  border-color: var(--status-error);
}

.azione {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8) var(--space-16);
  padding: var(--space-8) var(--space-16);
}

.azione + .azione {
  border-top: 1px solid var(--border-subtle);
}

.azione__testo {
  display: flex;
  flex: 1 1 16rem;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}

.azione__aiuto {
  overflow-wrap: anywhere;
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
}

.azione__bottoni {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
}

.file-button--disattivo {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
}

.campo {
  padding: var(--space-8) var(--space-12);
}

.edit-input {
  flex: 1 1 12rem;
  max-width: 24rem;
}

.add-zone-form {
  display: flex;
  gap: var(--space-8);
  max-width: 32rem;
}

.zone-name {
  font-weight: 500;
}

.icona-btn {
  min-height: 2.25rem;
  padding: var(--space-4) var(--space-8);
  border: none;
  border-radius: var(--radius-control);
  background: none;
  box-shadow: none;
  color: var(--color-text-secondary);
}

.icona-btn:hover {
  background: var(--color-surface);
  color: var(--color-text-primary);
}

.icona-btn--pericolo:hover {
  color: var(--color-danger);
}

.empty-state {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  color: var(--color-text-secondary);
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

.settings-view h1 {
  color: var(--color-primary);
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
}

.settings-view > .container > p {
  color: var(--color-text-secondary);
  margin-bottom: 3rem;
  font-size: 1.1rem;
}

.settings-section {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-md);
}

.settings-section h2 {
  color: var(--color-primary);
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.settings-section > p {
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
}

.template-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: start;
}

.preview-section h3,
.controls-section h3 {
  color: var(--color-primary);
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.card-preview {
  background: var(--color-surface);
  border-radius: var(--radius-surface);
  padding: var(--space-32);
  box-shadow: var(--shadow-sm);
  display: flex;
  justify-content: center;
}

.prova-nome {
  margin-top: var(--space-16);
}

.prova-nome label {
  display: block;
  font-weight: 600;
  margin-bottom: var(--space-8);
}

.prova-campi {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: var(--space-8);
}

.prova-campi input {
  min-width: 0;
  padding: var(--space-8);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-input-bg);
  color: var(--color-text-primary);
  font: inherit;
}

.avviso-stampa {
  color: var(--color-warning);
  font-weight: 600;
}

.control-group {
  margin-bottom: 2rem;
}

.control-group label {
  display: block;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.control-group input[type='file'] {
  width: 100%;
  padding: 0.75rem;
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  cursor: pointer;
  transition: all 0.2s;
}

.control-group input[type='file']:hover {
  border-color: var(--color-accent);
  background: rgba(183, 28, 28, 0.05);
}

.help-text {
  display: block;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-top: 0.5rem;
  line-height: 1.4;
}

.pdf-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.pdf-name {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.pdf-size {
  color: var(--color-text-secondary);
  font-size: 0.8rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.save-button,
.reset-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.save-button {
  background-color: var(--color-success);
  color: white;
}

.save-button:hover:not(:disabled) {
  filter: brightness(1.1);
}

.reset-button {
  background-color: var(--color-warning);
  color: white;
}

.reset-button:hover:not(:disabled) {
  filter: brightness(1.1);
}

.save-button:disabled,
.reset-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }

  .template-section {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .save-button,
  .reset-button {
    width: 100%;
    justify-content: center;
  }

}

</style>
