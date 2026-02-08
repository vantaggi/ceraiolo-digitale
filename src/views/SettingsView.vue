<template>
  <div class="settings-view">
    <div class="container settings-layout">
      <!-- Sidebar Navigation -->
      <aside class="settings-sidebar">
        <h1 class="sidebar-title">⚙️ Impostazioni</h1>
        <nav class="settings-nav">
          <button
            @click="currentTab = 'generale'"
            :class="{ active: currentTab === 'generale' }"
            class="nav-item"
          >
            🔧 Generale
          </button>
          <button
            @click="currentTab = 'template'"
            :class="{ active: currentTab === 'template' }"
            class="nav-item"
          >
            🎫 Template Tessera
          </button>
          <button
            @click="currentTab = 'dati'"
            :class="{ active: currentTab === 'dati' }"
            class="nav-item"
          >
            💾 Dati & Backup
          </button>
          <button
            @click="currentTab = 'zone'"
            :class="{ active: currentTab === 'zone' }"
            class="nav-item"
          >
            🏘️ Gestione Zone
          </button>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <main class="settings-content">
        <!-- Tab: Generale -->
        <section v-if="currentTab === 'generale'" class="settings-section">
          <h2>🔧 Configurazione Applicazione</h2>
          <p>Parametri globali per il funzionamento dell'applicazione</p>

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
              />
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
                <span v-if="isSavingConfig" class="loading-spinner">⏳</span>
                {{ isSavingConfig ? 'Salvataggio...' : '💾 Salva Configurazione' }}
              </button>
            </div>
          </div>
        </section>

        <!-- Tab: Template -->
        <section v-if="currentTab === 'template'" class="settings-section">
          <h2>🎫 Template Tessera</h2>
          <p>Personalizza l'aspetto delle tessere di iscrizione</p>

          <div class="template-section">
            <!-- Anteprima Tessera -->
            <div class="preview-section">
              <h3>Anteprima Tessera</h3>
              <div class="card-preview">
                <TesseraTemplate
                  nome-cognome="Mario Rossi"
                  data-nascita="1980-05-15"
                  :anno="currentYear + 1"
                  :background-image="previewBackground"
                  :has-pdf-template="hasPdfTemplate"
                />
              </div>
            </div>

            <!-- Controlli Template -->
            <div class="controls-section">
              <h3>Impostazioni Template</h3>

              <div class="control-group">
                <label for="background-upload">Template PDF Tessera:</label>
                <input
                  id="background-upload"
                  type="file"
                  accept=".pdf"
                  @change="handlePDFUpload"
                  :disabled="isSaving"
                />
                <small class="help-text">
                  Carica un file PDF (singola pagina, dimensioni tessera). Max 5MB.
                </small>
              </div>

              <div class="control-group" v-if="selectedPDF">
                <label>PDF selezionato:</label>
                <div class="pdf-info">
                  <span class="pdf-name">{{ selectedPDF.name }}</span>
                  <span class="pdf-size">({{ formatFileSize(selectedPDF.size) }})</span>
                </div>
              </div>

              <div class="action-buttons">
                <button
                  @click="saveTemplate"
                  :disabled="(!selectedPDF && !selectedImage) || isSaving"
                  class="save-button"
                >
                  <span v-if="isSaving" class="loading-spinner">⏳</span>
                  {{ isSaving ? 'Salvataggio...' : '💾 Salva Template' }}
                </button>

                <button @click="resetTemplate" :disabled="isSaving" class="reset-button">
                  🔄 Ripristina Default
                </button>
              </div>
            </div>
          </div>
        </section>

        <section v-if="currentTab === 'dati'" class="settings-section">
          <h2>💾 Gestione Dati & Backup</h2>

          <!-- Health Status -->
          <div class="data-health-banner" v-if="auditStats">
            <div
              class="health-indicator"
              :class="{
                good: auditStats.summary.total_issues === 0,
                warning: auditStats.summary.total_issues > 0,
              }"
            >
              <span class="health-icon">{{
                auditStats.summary.total_issues === 0 ? '✅' : '⚠️'
              }}</span>
              <div class="health-text">
                <h3>Stato Salute Dati</h3>
                <p v-if="auditStats.summary.total_issues === 0">Tutti i dati sono corretti.</p>
                <p v-else>
                  Rilevati <strong>{{ auditStats.summary.total_issues }}</strong> problemi
                  potenziali (dati mancanti).
                </p>
              </div>
            </div>
          </div>

          <!-- Sezione Backup Automatico -->
          <div class="subsection">
            <h3>🔄 Backup Automatico su PC</h3>
            <div class="backup-grid">
              <div class="backup-card">
                <h4>📁 Cartella di Backup</h4>
                <p class="path-text">{{ backupStore.backupPath }}</p>
                <button
                  @click="selectBackupFolder"
                  class="action-button small"
                  :class="{ 'btn-success': backupStore.isAuthorized }"
                  :disabled="!isFileSystemSupported"
                  :title="
                    !isFileSystemSupported ? 'Il tuo browser non supporta questa funzionalità' : ''
                  "
                >
                  {{
                    !isFileSystemSupported
                      ? '❌ Non Supportato'
                      : backupStore.isAuthorized
                        ? '✅ Cambia Cartella'
                        : '📁 Seleziona Cartella'
                  }}
                </button>
              </div>

              <div class="backup-card">
                <h4>⚡ Auto-Salvataggio</h4>
                <p>Salva automaticamente ad ogni modifica.</p>
                <button
                  @click="toggleAutoBackup"
                  :disabled="!backupStore.isAuthorized"
                  class="backup-toggle-button"
                  :class="{ active: backupStore.autoBackupEnabled }"
                >
                  {{ backupStore.autoBackupEnabled ? '✅ Attivo' : '⭕ Disattivato' }}
                </button>
              </div>

              <div class="backup-card highlight">
                <h4>💾 Backup Manuale</h4>
                <p>Crea subito una copia.</p>
                <button
                  @click="forceBackup"
                  :disabled="isSavingBackup"
                  class="manual-backup-button"
                  :class="{ 'btn-loading': isSavingBackup }"
                >
                  <span v-if="isSavingBackup" class="loading-spinner">⏳</span>
                  {{
                    isSavingBackup
                      ? 'In corso...'
                      : backupStore.isAuthorized
                        ? '💾 Esegui Backup Ora'
                        : '📥 Scarica Backup'
                  }}
                </button>
              </div>
            </div>
          </div>

          <hr class="divider" />

          <!-- Sezione Export/Import -->
          <div class="subsection">
            <h3>📦 Esportazione & Ripristino</h3>
            <div class="data-section">
              <div class="export-options">
                <div class="export-option">
                  <h4>📥 Esporta Database Completo</h4>
                  <p>File .sqlite per migrazione o backup manuale (include Impostazioni).</p>
                  <button @click="exportDatabase" :disabled="isExporting" class="export-button">
                    {{ isExporting ? 'Esportazione...' : 'Scarica SQLite' }}
                  </button>
                </div>

                <div class="export-option">
                  <h4>📊 Esporta Excel</h4>
                  <p>Tabelle per Maggiorenni e Minorenni.</p>
                  <button @click="exportExcel" :disabled="isExporting" class="export-button">
                    {{ isExporting ? 'Esportazione...' : 'Scarica Excel' }}
                  </button>
                </div>

                <div class="export-option">
                  <h4>⚙️ Configurazione JSON</h4>
                  <p>Export/Import solo impostazioni.</p>
                  <div class="button-group-small">
                    <button @click="exportSettings" :disabled="isExporting" class="action-button">
                      Esporta JSON
                    </button>
                    <label class="action-button secondary clickable">
                      Importa JSON
                      <input
                        type="file"
                        accept=".json"
                        @change="handleImportSettings"
                        style="display: none"
                        :disabled="isExporting"
                      />
                    </label>
                  </div>
                </div>

                <div class="export-option danger">
                  <h4>♻️ Ripristina Database</h4>
                  <p>Carica un backup .sqlite (Sovrascrive tutto!).</p>
                  <input
                    type="file"
                    accept=".sqlite,.db"
                    @change="handleRestoreDatabase"
                    :disabled="isExporting"
                    class="file-input-compact"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr class="divider" />

          <!-- DANGER ZONE -->
          <div class="subsection danger-zone">
            <h3>⛔ Zona Pericolosa</h3>
            <div class="danger-card">
              <h4>🏭 Ripristino Impostazioni di Fabbrica</h4>
              <p>
                Cancella TUTTI i dati (Soci, Pagamenti, Impostazioni) e riporta l'applicazione allo
                stato iniziale.
              </p>
              <button
                @click="confirmFactoryReset"
                :disabled="isExporting"
                class="danger-button-large"
              >
                🗑️ CANCELLA TUTTO E RIPRISTINA
              </button>
            </div>
          </div>
        </section>

        <!-- Tab: Zone (Gestione Gruppi) -->
        <section v-if="currentTab === 'zone'" class="settings-section">
          <h2>🏘️ Gestione Zone (Gruppi)</h2>
          <p>
            Gestisci le zone di appartenenza. Puoi rinominare zone esistenti (aggiornando tutti i soci)
            o aggiungerne di nuove per averle pronte nel menu a tendina.
          </p>

          <div class="zone-actions">
            <div class="add-zone-form">
              <input
                v-model="newZoneName"
                placeholder="Nome nuova zona..."
                class="form-input"
                @keyup.enter="addNewZone"
              />
              <button @click="addNewZone" :disabled="!newZoneName.trim()" class="save-button">
                ➕ Aggiungi
              </button>
            </div>
          </div>

          <div class="zones-list-container">
            <div v-if="isLoadingZones" class="loading-spinner-large">⏳ Caricamento...</div>
            <div v-else-if="zones.length === 0" class="empty-state">Nessuna zona definita.</div>
            <ul v-else class="zones-list">
              <li v-for="zone in zones" :key="zone" class="zone-item">
                <div class="zone-info">
                  <span v-if="editingZone !== zone" class="zone-name">{{ zone }}</span>
                  <input
                    v-else
                    v-model="editingZoneName"
                    class="form-input edit-input"
                    @keyup.enter="saveZoneRename(zone)"
                    @keyup.esc="cancelRename"
                    ref="editInput"
                  />
                </div>

                <div class="zone-buttons">
                  <template v-if="editingZone !== zone">
                    <button @click="startRename(zone)" class="action-button small secondary" title="Rinomina">
                      ✏️
                    </button>
                    <!-- Delete button just removes from defined list, doesn't delete users -->
                    <button @click="deleteZone(zone)" class="action-button small danger" title="Rimuovi dalla lista (non cancella i soci)">
                      🗑️
                    </button>
                  </template>
                  <template v-else>
                     <button @click="saveZoneRename(zone)" class="action-button small success" title="Salva">
                      💾
                    </button>
                    <button @click="cancelRename" class="action-button small secondary" title="Annulla">
                      ❌
                    </button>
                  </template>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import {
  getSetting,
  updateSetting,
  downloadDatabaseExport,
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
import TesseraTemplate from '@/components/TesseraTemplate.vue'

const toast = useToast()
const currentYear = new Date().getFullYear()

// Stato del componente
const selectedImage = ref(null)
const selectedPDF = ref(null)
const previewBackground = ref(null)
const hasPdfTemplate = ref(false)
const isSaving = ref(false)
const isExporting = ref(false)
const isSavingBackup = ref(false)

const isSavingConfig = ref(false)
const currentTab = ref('generale')
const isFileSystemSupported = ref(typeof window.showDirectoryPicker === 'function')

const appConfig = ref({
  receiptsPerBlock: 10,
  defaultQuota: 10.0,
  newMemberQuota: 25.0,
  defaultCity: '',
  minorsReferenceYear: new Date().getFullYear(),
})

const backupStore = useBackupStore()

// Carica il template attuale al mount
onMounted(async () => {
  // Init backup service (checks if we have permission from previous session)
  await backupService.initialize()

  try {
    const savedBackground = await getSetting('cardBackground')
    const savedPdfTemplate = await getSetting('cardTemplatePDF')

    if (savedPdfTemplate) {
      hasPdfTemplate.value = true
      // Mostra l'immagine di anteprima se disponibile
      previewBackground.value = savedBackground
    } else if (savedBackground) {
      previewBackground.value = savedBackground
      hasPdfTemplate.value = false
    } else {
      previewBackground.value = null
      hasPdfTemplate.value = false
    }
  } catch (error) {
    console.error('Errore caricamento template:', error)
    toast.error('Errore nel caricamento del template attuale')
  }

  // Carica configurazioni app
  try {
    appConfig.value.receiptsPerBlock = await getSetting('receiptsPerBlock', 10)
    appConfig.value.defaultQuota = await getSetting('defaultQuota', 10.0)
    appConfig.value.newMemberQuota = await getSetting('newMemberQuota', 25.0)
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

  if (
    !confirm(
      'ATTENZIONE: Questa operazione SOVRASCRIVERÀ tutti i dati attuali con quelli del backup. Continuare?',
    )
  ) {
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
 * Gestisce l'upload del PDF template
 */

/**
 * Gestisce l'upload del PDF template
 */
const handlePDFUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Controlla il tipo di file
  if (file.type !== 'application/pdf') {
    toast.error('Seleziona un file PDF valido')
    return
  }

  // Controlla la dimensione (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Il PDF è troppo grande. Dimensione massima: 5MB')
    return
  }

  selectedPDF.value = file
  selectedImage.value = null // Reset immagine se presente
  toast.success('PDF caricato con successo!')
}

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
 * Crea un'immagine di anteprima dal PDF
 */
const createPDFPreview = async (pdfFile) => {
  return new Promise((resolve, reject) => {
    try {
      // Crea un iframe nascosto per renderizzare il PDF
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.style.width = '80.77mm'
      iframe.style.height = '122.17mm'

      // Converti il file in URL blob
      const pdfUrl = URL.createObjectURL(pdfFile)

      iframe.onload = () => {
        // Aspetta un po' per il rendering
        setTimeout(() => {
          try {
            // Crea un canvas per catturare l'immagine
            const canvas = document.createElement('canvas')
            canvas.width = 227 // 80.77mm a 72 DPI
            canvas.height = 345 // 122.17mm a 72 DPI
            const ctx = canvas.getContext('2d')

            // Disegna uno sfondo bianco
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Aggiungi testo placeholder
            ctx.fillStyle = '#666'
            ctx.font = '16px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('PDF Template', canvas.width / 2, canvas.height / 2 - 20)
            ctx.fillText('Anteprima', canvas.width / 2, canvas.height / 2 + 20)

            // Converti in immagine
            const imageData = canvas.toDataURL('image/png')

            // Pulisci
            document.body.removeChild(iframe)
            URL.revokeObjectURL(pdfUrl)

            resolve(imageData)
          } catch (error) {
            reject(error)
          }
        }, 1000)
      }

      iframe.onerror = () => {
        document.body.removeChild(iframe)
        URL.revokeObjectURL(pdfUrl)
        reject(new Error('Errore caricamento PDF'))
      }

      iframe.src = pdfUrl
      document.body.appendChild(iframe)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Salva il template nel database
 */
const saveTemplate = async () => {
  if (!selectedPDF.value && !selectedImage.value) return

  try {
    isSaving.value = true
    toast.info('Salvataggio template in corso...')

    if (selectedPDF.value) {
      // Converti il PDF in ArrayBuffer per salvarlo
      const arrayBuffer = await selectedPDF.value.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Salva il PDF template
      await updateSetting('cardTemplatePDF', Array.from(uint8Array))

      // Crea anche un'immagine di anteprima dal PDF
      try {
        const previewImage = await createPDFPreview(selectedPDF.value)
        await updateSetting('cardBackground', previewImage)
        previewBackground.value = previewImage
      } catch (previewError) {
        console.warn('Errore creazione anteprima PDF:', previewError)
        // Se fallisce l'anteprima, almeno salva il PDF
        await updateSetting('cardBackground', null)
        previewBackground.value = null
      }
    } else if (selectedImage.value) {
      // Salva immagine come prima (per retrocompatibilità)
      await updateSetting('cardBackground', selectedImage.value)
      await updateSetting('cardTemplatePDF', null) // Rimuovi PDF se presente
      previewBackground.value = selectedImage.value
    }

    toast.success('Template salvato con successo!')
    selectedPDF.value = null
    selectedImage.value = null
  } catch (error) {
    console.error('Errore salvataggio template:', error)
    toast.error('Errore durante il salvataggio del template')
  } finally {
    isSaving.value = false
  }
}

/**
 * Ripristina il template di default
 */
const resetTemplate = async () => {
  try {
    isSaving.value = true
    toast.info('Ripristino template di default...')

    await updateSetting('cardBackground', null)
    await updateSetting('cardTemplatePDF', null)
    await updateSetting('cardWidth', null)
    await updateSetting('cardHeight', null)
    previewBackground.value = null
    selectedImage.value = null
    selectedPDF.value = null

    toast.success('Template ripristinato al default!')
  } catch (error) {
    console.error('Errore ripristino template:', error)
    toast.error('Errore durante il ripristino del template')
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
    auditStats.value = health

    if (health.summary.total_issues > 0) {
      if (
        !confirm(
          `ATTENZIONE: Sono stati rilevati ${health.summary.total_issues} problemi nei dati (es. date mancanti).\nConsigliamo di risolvere i problemi prima del backup, ma puoi procedere comunque.\n\nProcedere con l'export?`,
        )
      ) {
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

const auditStats = ref(null)

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
  if (
    !confirm(
      'ATTENZIONE: Stai per CANCELLARE TUTTI I DATI e ripristinare le impostazioni di fabbrica. Questa operazione è IRREVERSIBILE.\n\nIl sistema tenterà un backup automatico prima di procedere.\n\nSei sicuro di voler continuare?',
    )
  ) {
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
    toast.error("Errore caricamento zone")
  } finally {
    isLoadingZones.value = false
  }
}

import { watch } from 'vue'
watch(currentTab, (newTab) => {
  if (newTab === 'zone') {
    loadZones()
  }
})

const addNewZone = async () => {
  if (!newZoneName.value.trim()) return
  try {
    await addCustomGroup(newZoneName.value)
    newZoneName.value = ''
    toast.success("Zona aggiunta!")
    await loadZones()
  } catch (e) {
    toast.error(e.message)
  }
}

const deleteZone = async (zoneName) => {
  if(!confirm(`Vuoi rimuovere "${zoneName}" dalla lista delle zone definite?\nNota: I soci che appartengono a questa zona manterranno la loro assegnazione, ma la zona non apparirà più come suggerimento se non ci sono soci assegnati.`)) return

  try {
    await removeCustomGroup(zoneName)
    toast.success("Zona rimossa dalle definizioni.")
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

  if(!confirm(`Confermi di voler rinominare la zona "${oldName}" in "${newName}"?\nQuesta operazione aggiornerà tutti i soci appartenenti a questa zona.`)) return

  try {
    const count = await renameGroup(oldName, newName)
    toast.success(`Zona rinominata! Aggiornati ${count} soci.`)
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

.settings-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  min-height: calc(100vh - 100px);
}

.settings-sidebar {
  padding-right: 1.5rem;
  border-right: 1px solid var(--color-border);
}

.settings-sidebar .sidebar-title {
  font-size: 1.1rem;
  color: var(--color-primary);
  margin-bottom: 2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  text-align: left;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.nav-item:hover {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
}

.nav-item.active {
  background-color: var(--color-accent);
  color: white;
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

/* Responsive Sidebar */
@media (max-width: 768px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }

  .settings-sidebar {
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .settings-nav {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 5px;
  }

  .nav-item {
    white-space: nowrap;
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
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
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  justify-content: center;
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

.export-button {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: var(--color-info);
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

.export-button:hover:not(:disabled) {
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

.manual-backup-button {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.manual-backup-button:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
  transform: scale(1.05);
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

.export-button {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: var(--color-info);
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

.export-button:hover:not(:disabled) {
  filter: brightness(1.1);
}

.export-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.loading-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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

.manual-backup-button {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.manual-backup-button:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
  transform: scale(1.05);
}

.manual-backup-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
/* Health Banner */
.data-health-banner {
  margin-bottom: 2rem;
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
}

.health-indicator {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.health-indicator.good .health-icon {
  font-size: 2rem;
}

.health-indicator.warning {
  /* Using theme variables for consistency */
  border: 1px solid var(--color-warning);
  color: var(--color-warning);
  /* Slight background tint if possible, otherwise transparent to be safe across themes */
  background-color: transparent;
  padding: 1rem;
  border-radius: 6px;
}

/* Optional: Add a light tint locally if we really want it, handling themes */
.health-indicator.warning {
  background-color: rgba(237, 108, 2, 0.05); /* Very subtle orange tint */
}
[data-theme='dark'] .health-indicator.warning {
  background-color: rgba(255, 167, 38, 0.05);
}

.health-text h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
}

.health-text p {
  margin: 0;
  font-size: 0.9rem;
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

.danger-button-large {
  background-color: var(--color-accent); /* Was hardcoded #c53030 */
  color: var(--color-text-inverse); /* Was white */
  border: none;
  padding: 1rem;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  text-transform: uppercase;
  margin-top: 1rem;
}

.danger-button-large:hover {
  background-color: var(--color-accent-hover); /* Was hardcoded #9b2c2c */
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
