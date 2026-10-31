<template>
  <div class="settings-view">
    <div class="container">
      <PageHeader title="Impostazioni" />
      <SectionTabs :tabs="SCHEDE_IMPOSTAZIONI" label="Schede delle impostazioni" />

      <div class="settings-content">
        <!-- Tab: Generale -->
        <section v-if="scheda === 'generale'" class="settings-section">
          <h2><AppIcon name="configurazione" /> Generale</h2>
          <p>Valori proposti quando si inseriscono soci e pagamenti.</p>

          <div class="config-grid">
            <!-- Nuovi Parametri -->
            <div class="control-group">
              <label for="default-city">Città di Default (Nuovi Soci):</label>
              <input
                id="default-city"
                v-model="appConfig.defaultCity"
                type="text"
                class="form-input"
                placeholder="Es. Gubbio"
              />
              <small class="help-text">Città precompilata quando aggiungi un nuovo socio.</small>
            </div>

            <div class="control-group">
              <label for="minors-year">Anno Riferimento Minorenni:</label>
              <input
                id="minors-year"
                v-model.number="appConfig.minorsReferenceYear"
                type="number"
                class="form-input"
              />
              <small class="help-text"
                >Anno usato per calcolare se un socio è minorenne nei report.</small
              >
            </div>

            <div class="control-group">
              <label for="receipts-per-block">Ricevute per Blocchetto:</label>
              <input
                id="receipts-per-block"
                v-model.number="appConfig.receiptsPerBlock"
                type="number"
                min="1"
                max="100"
                class="form-input"
                aria-describedby="receipts-per-block-aiuto"
              />
              <small id="receipts-per-block-aiuto" class="help-text">
                I numeri delle ricevute sono progressivi: con 10, il blocchetto 1 va da 1 a 10 e il 2
                da 11 a 20. Lo usa Incassi › Registra ricevute.
              </small>
            </div>

            <div class="control-group">
              <label for="default-quota">Quota Rinnovo Default (€):</label>
              <input
                id="default-quota"
                v-model.number="appConfig.defaultQuota"
                type="number"
                min="0"
                step="0.5"
                class="form-input"
              />
            </div>

            <div class="control-group">
              <label for="new-member-quota">Quota Nuovi Soci Default (€):</label>
              <input
                id="new-member-quota"
                v-model.number="appConfig.newMemberQuota"
                type="number"
                min="0"
                step="0.5"
                class="form-input"
              />
            </div>

            <div class="action-buttons">
              <button @click="saveAppConfig" :disabled="isSavingConfig" class="save-button">
                <AppIcon :name="isSavingConfig ? 'caricamento' : 'salva'" :spin="isSavingConfig" />
                {{ isSavingConfig ? 'Salvataggio...' : 'Salva Configurazione' }}
              </button>
            </div>
          </div>
        </section>

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

        <section v-if="scheda === 'dati'" class="settings-section">
          <h2><AppIcon name="salva" /> Dati e backup</h2>
          <p>Dall'alto in basso: copie di sicurezza, esportazioni, ripristino, controllo dei dati. Le operazioni che cancellano dati stanno in fondo.</p>

          <!-- Sezione Backup Automatico -->
          <div class="subsection">
            <h3><AppIcon name="automatico" /> Backup</h3>
            <div class="backup-grid">
              <div class="backup-card">
                <h4><AppIcon name="cartella" /> Cartella di Backup</h4>
                <p class="path-text">{{ backupStore.backupPath }}</p>
                <BaseButton
                  :disabled="!isFileSystemSupported"
                  :title="
                    !isFileSystemSupported ? 'Il tuo browser non supporta questa funzionalità' : ''
                  "
                  @click="selectBackupFolder"
                >
                  <AppIcon
                    :name="
                      !isFileSystemSupported ? 'disattivo' : backupStore.isAuthorized ? 'ok' : 'cartella'
                    "
                  />
                  {{
                    !isFileSystemSupported
                      ? 'Non Supportato'
                      : backupStore.isAuthorized
                        ? 'Cambia Cartella'
                        : 'Seleziona Cartella'
                  }}
                </BaseButton>
              </div>

              <div class="backup-card">
                <h4><AppIcon name="automatico" /> Auto-Salvataggio</h4>
                <p>Salva automaticamente ad ogni modifica.</p>
                <button
                  @click="toggleAutoBackup"
                  :disabled="!backupStore.isAuthorized"
                  class="backup-toggle-button"
                  :class="{ active: backupStore.autoBackupEnabled }"
                >
                  <AppIcon :name="backupStore.autoBackupEnabled ? 'ok' : 'disattivo'" />
                  {{ backupStore.autoBackupEnabled ? 'Attivo' : 'Disattivato' }}
                </button>
              </div>

              <div class="backup-card highlight">
                <h4><AppIcon name="salva" /> Backup Manuale</h4>
                <p>Crea subito una copia.</p>
                <BaseButton variant="primary" :loading="isSavingBackup" @click="forceBackup">
                  <AppIcon :name="backupStore.isAuthorized ? 'salva' : 'esporta'" />
                  {{ backupStore.isAuthorized ? 'Esegui Backup Ora' : 'Scarica Backup' }}
                </BaseButton>
              </div>
            </div>
          </div>

          <hr class="divider" />

          <!-- Sezione Export/Import -->
          <div class="subsection">
            <h3><AppIcon name="archivio" /> Esporta</h3>
            <div class="data-section">
              <div class="export-options">
                <div class="export-option">
                  <h4><AppIcon name="esporta" /> Esporta Database Completo</h4>
                  <p>File .sqlite per migrazione o backup manuale (include Impostazioni).</p>
                  <BaseButton :disabled="isExporting" @click="exportDatabase">
                    <AppIcon name="esporta" /> Scarica SQLite
                  </BaseButton>
                </div>

                <div class="export-option">
                  <h4><AppIcon name="foglio-calcolo" /> Esporta Excel</h4>
                  <p>Tabelle per Maggiorenni e Minorenni.</p>
                  <BaseButton :disabled="isExporting" @click="exportExcel">
                    <AppIcon name="esporta" /> Scarica Excel
                  </BaseButton>
                </div>

                <div class="export-option">
                  <h4><AppIcon name="changelog" /> Registro modifiche</h4>
                  <p>Le modifiche fatte da questo browser, da allegare quando si passano i dati.</p>
                  <BaseButton :disabled="isExporting" @click="exportChangeLogData">
                    <AppIcon name="esporta" /> Scarica registro
                  </BaseButton>
                </div>

                <div class="export-option">
                  <h4><AppIcon name="configurazione" /> Configurazione JSON</h4>
                  <p>Export/Import solo impostazioni.</p>
                  <div class="button-group-small">
                    <BaseButton :disabled="isExporting" @click="exportSettings">
                      <AppIcon name="esporta" /> Esporta JSON
                    </BaseButton>
                    <label class="file-button">
                      Importa JSON
                      <input
                        type="file"
                        accept=".json"
                        @change="handleImportSettings"
                        class="file-button__input"
                        :disabled="isExporting"
                      />
                    </label>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <hr class="divider" />

          <div class="subsection">
            <h3><AppIcon name="ripristina" /> Ripristina da un file</h3>
            <div class="restore-card">
              <p>
                Carica un backup <code>.sqlite</code>: <strong>sostituisce tutti i dati</strong> di
                questo browser con quelli del file. Prima chiede conferma.
              </p>
              <label for="restore-file" class="restore-label">Scegli il file di backup</label>
              <input
                id="restore-file"
                type="file"
                accept=".sqlite,.db"
                @change="handleRestoreDatabase"
                :disabled="isExporting"
                class="file-input-compact"
              />
            </div>
          </div>

          <hr class="divider" />

          <div class="subsection">
            <h3><AppIcon name="qualita-dati" /> Controllo qualità dei dati</h3>
            <ControlloQualitaDati />
          </div>

          <hr class="divider" />

          <!-- DANGER ZONE -->
          <div class="subsection danger-zone">
            <h3><AppIcon name="pericolo" /> Zona pericolosa</h3>
            <p class="danger-intro">Operazioni che modificano o cancellano i dati di tutti i soci. Fai prima un backup.</p>
            <div class="danger-card">
              <h4><AppIcon name="ripara" /> Correggi blocchetti e ricevute invertiti</h4>
              <p>
                Corregge i numeri di blocchetto e ricevuta scambiati nei dati storici (vecchio
                errore di importazione).
              </p>
              <BaseButton :disabled="isExporting" @click="runNormalization">
                <AppIcon name="ripara" /> Correggi
              </BaseButton>
            </div>
            <div class="danger-card">
              <h4><AppIcon name="ripristina" /> Ripristino Impostazioni di Fabbrica</h4>
              <p>
                Cancella TUTTI i dati (Soci, Pagamenti, Impostazioni) e riporta l'applicazione allo
                stato iniziale.
              </p>
              <BaseButton variant="danger" :disabled="isExporting" @click="confirmFactoryReset">
                <AppIcon name="elimina" /> Cancella tutto e ripristina
              </BaseButton>
            </div>
          </div>
        </section>

        <!-- Tab: Manicchie -->
        <section v-if="scheda === 'manicchie'" class="settings-section">
          <h2><AppIcon name="gruppo" /> Manicchie</h2>
          <p>
            Le manicchie dei soci. Rinominandone una si aggiornano tutti i suoi soci; quelle aggiunte
            qui compaiono subito nei menu, anche prima di avere soci.
          </p>

          <form class="add-zone-form" @submit.prevent="addNewZone">
            <label for="nuova-manicchia" class="sr-only">Nome della nuova manicchia</label>
            <input
              id="nuova-manicchia"
              v-model="newZoneName"
              type="text"
              placeholder="Nome della nuova manicchia"
              class="form-input"
            />
            <BaseButton type="submit" variant="primary" :disabled="!newZoneName.trim()">
              <AppIcon name="aggiungi" /> Aggiungi
            </BaseButton>
          </form>

          <p v-if="isLoadingZones" class="empty-state">
            <AppIcon name="caricamento" spin /> Caricamento...
          </p>
          <p v-else-if="zones.length === 0" class="empty-state">Nessuna manicchia definita.</p>
          <ul v-else class="zones-list">
            <li v-for="zone in zones" :key="zone" class="zone-item">
              <span v-if="editingZone !== zone" class="zone-name">{{ zone }}</span>
              <template v-else>
                <label :for="`rinomina-${zone}`" class="sr-only">Nuovo nome di {{ zone }}</label>
                <input
                  :id="`rinomina-${zone}`"
                  v-model="editingZoneName"
                  type="text"
                  class="form-input edit-input"
                  @keyup.enter="saveZoneRename(zone)"
                  @keyup.esc="cancelRename"
                  ref="editInput"
                />
              </template>

              <div class="zone-buttons">
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
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { QUOTA_NUOVI_PREDEFINITA, QUOTA_ORDINARIA_PREDEFINITA } from '@/utils/payment'
import { ref, onMounted, watch } from 'vue'
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
import PageHeader from '@/components/base/PageHeader.vue'
import SectionTabs from '@/components/base/SectionTabs.vue'
import { SCHEDE_IMPOSTAZIONI } from '@/router/sezioni'
import ControlloQualitaDati from '@/components/ControlloQualitaDati.vue'

const toast = useToast()
const currentYear = new Date().getFullYear()

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

const isSavingConfig = ref(false)
// La scheda arriva dall'indirizzo (/settings, /settings/tessera, /settings/dati, ...)
const props = defineProps({
  scheda: { type: String, default: 'generale' },
})
const isFileSystemSupported = ref(typeof window.showDirectoryPicker === 'function')

const appConfig = ref({
  receiptsPerBlock: 10,
  defaultQuota: QUOTA_ORDINARIA_PREDEFINITA,
  newMemberQuota: QUOTA_NUOVI_PREDEFINITA,
  defaultCity: '',
  minorsReferenceYear: new Date().getFullYear(),
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
    appConfig.value.defaultCity = await getSetting('defaultCity', '')
    appConfig.value.minorsReferenceYear = await getSetting('minorsReferenceYear', currentYear)
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

/**
 * Salva la configurazione dell'applicazione
 */
const saveAppConfig = async () => {
  try {
    isSavingConfig.value = true
    await updateSetting('receiptsPerBlock', appConfig.value.receiptsPerBlock)
    await updateSetting('defaultQuota', appConfig.value.defaultQuota)
    await updateSetting('newMemberQuota', appConfig.value.newMemberQuota)
    await updateSetting('defaultCity', appConfig.value.defaultCity)
    await updateSetting('minorsReferenceYear', appConfig.value.minorsReferenceYear)
    toast.success('Configurazione salvata con successo!')
  } catch (error) {
    console.error('Errore salvataggio configurazione:', error)
    toast.error('Errore nel salvataggio della configurazione')
  } finally {
    isSavingConfig.value = false
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

/* Card Styles */
.backup-grid,
.config-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.backup-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.backup-card h4 {
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.path-text {
  font-family: monospace;
  background: var(--color-background);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.divider {
  border: 0;
  border-top: 1px solid var(--color-border);
  margin: 3rem 0;
}

.action-button.small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.container {
  max-width: var(--page-width);
  margin: 0 auto;
  padding: 0 var(--space-32);
}

.restore-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-16) var(--space-24);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-warning);
  border-radius: var(--radius-surface);
  background: var(--color-surface);
}

.restore-card p {
  margin: 0;
}

.file-button {
  position: relative;
  display: inline-flex;
  align-items: center;
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

.add-zone-form {
  display: flex;
  gap: var(--space-8);
  max-width: 32rem;
  margin-bottom: var(--space-24);
}

.zones-list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-border);
}

.zone-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
  min-height: 3rem;
  padding: var(--space-4) var(--space-8);
  border-bottom: 1px solid var(--color-border);
}

.zone-item:hover {
  background: var(--color-surface-hover);
}

.zone-name {
  font-weight: 600;
}

.zone-item .edit-input {
  max-width: 24rem;
}

.zone-buttons {
  display: flex;
  gap: var(--space-4);
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

.restore-label {
  font-weight: 600;
  font-size: var(--font-size-label);
}

.danger-intro {
  margin: 0 0 var(--space-16);
  color: var(--color-text-secondary);
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

.image-preview {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  max-width: 200px;
}

.image-preview img {
  width: 100%;
  height: auto;
  display: block;
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

.backup-toggle-button:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
  transform: scale(1.02);
}

.backup-toggle-button.active {
  background-color: var(--color-success);
}

.backup-toggle-button.active:hover:not(:disabled) {
  filter: brightness(1.1);
}

.history-button {
  padding: 0.75rem 1.5rem;
  background-color: #9c27b0; /* Keep purple or define new var? Let's leave for now or map to info */
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.save-button:disabled,
.reset-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Data Management Section */
.data-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.export-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.export-option {
  background: var(--color-background);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.export-option h3 {
  margin: 0 0 0.5rem 0;
  color: var(--color-primary);
  font-size: 1.1rem;
}

.export-option p {
  margin: 0 0 1rem 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
}

.export-info {
  background: var(--color-background);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.export-info h4 {
  margin: 0 0 1rem 0;
  color: var(--color-primary);
  font-size: 1rem;
}

.export-info ul {
  margin: 0;
  padding-left: 1.5rem;
}

.export-info li {
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.export-info strong {
  color: var(--color-text-primary);
}

/* Backup Section */
.backup-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.backup-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.backup-option {
  background: var(--color-background);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.backup-option h3 {
  margin: 0 0 0.5rem 0;
  color: var(--color-primary);
  font-size: 1.1rem;
}

.backup-option p {
  margin: 0 0 1rem 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
}

.backup-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.backup-controls label {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.backup-toggle-button {
  padding: 0.75rem 1rem;
  background-color: var(--color-text-secondary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.backup-toggle-button:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
  transform: scale(1.02);
}

.backup-toggle-button.active {
  background-color: var(--color-success);
}

.backup-toggle-button.active:hover:not(:disabled) {
  filter: brightness(1.1);
}

.backup-toggle-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.backup-info {
  background: var(--color-background);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.backup-info h4 {
  margin: 0 0 1rem 0;
  color: var(--color-primary);
  font-size: 1rem;
}

.backup-info ul {
  margin: 0;
  padding-left: 1.5rem;
}

.backup-info li {
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.backup-info strong {
  color: var(--color-text-primary);
}

.backup-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.history-button {
  padding: 0.75rem 1.5rem;
  background-color: #9c27b0;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.history-button:hover {
  background-color: #7b1fa2;
  transform: scale(1.05);
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

  .export-options {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .data-section {
    gap: 1.5rem;
  }

  .backup-options {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .backup-actions {
    flex-direction: column;
  }

  .manual-backup-button,
  .history-button {
    width: 100%;
    text-align: center;
  }
}

/* Optional: Add a light tint locally if we really want it, handling themes */
.health-indicator.warning {
  background-color: rgba(237, 108, 2, 0.05); /* Very subtle orange tint */
}

/* Danger Zone */
.danger-zone {
  margin-top: 3rem;
  padding: 2rem;
  background-color: transparent; /* Was hardcoded #fff5f5 */
  border: 1px solid var(--color-accent); /* Was hardcoded #fc8181 */
  border-radius: 8px;
  /* Add subtle red tint */
  background-color: rgba(183, 28, 28, 0.02);
}

[data-theme='dark'] .danger-zone {
  background-color: rgba(229, 57, 53, 0.05);
}

.danger-zone h3 {
  color: var(--color-accent); /* Was hardcoded #c53030 */
  margin-top: 0;
}

.danger-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.danger-card + .danger-card {
  margin-top: var(--space-24);
  padding-top: var(--space-24);
  border-top: 1px solid var(--color-border);
}

.button-group-small {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-family: var(--font-family-body);
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: var(--color-accent);
  color: white;
  box-shadow: var(--shadow-sm);
  text-decoration: none;
}

.action-button:hover {
  background-color: var(--color-accent-hover);
  transform: translateY(-1px);
}

.action-button.secondary {
  background-color: transparent;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  box-shadow: none;
}

.action-button.secondary:hover {
  background-color: rgba(183, 28, 28, 0.05);
}

.clickable {
  cursor: pointer;
}
</style>
