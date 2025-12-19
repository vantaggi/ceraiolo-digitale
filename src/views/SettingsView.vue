<template>
  <div class="settings-view">
    <div class="container">
      <h1>⚙️ Impostazioni Applicazione</h1>
      <p>Configura l'aspetto e le preferenze dell'applicazione</p>

      <!-- Sezione Template Tessera -->
      <section class="settings-section">
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
                Carica un file PDF che contiene solo lo sfondo della tessera.<br />
                Il PDF deve avere una singola pagina con le dimensioni esatte della tessera.<br />
                Formato supportato: PDF. Dimensione massima: 5MB.
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

      <!-- Sezione Gestione Dati -->
      <section class="settings-section">
        <h2>💾 Gestione Dati</h2>
        <p>Esporta i dati dell'applicazione in diversi formati</p>

        <div class="data-section">
          <div class="export-options">
            <div class="export-option">
              <h3>📦 Database di Backup</h3>
              <p>Esporta tutto il database in formato SQLite per backup e ripristino</p>
              <button @click="exportDatabase" :disabled="isExporting" class="export-button">
                <span v-if="isExporting" class="loading-spinner">⏳</span>
                {{ isExporting ? 'Esportazione...' : '📥 Esporta Database' }}
              </button>
            </div>

            <div class="export-option">
              <h3>📊 Esporta in Excel</h3>
              <p>Esporta tutti i dati in formato Excel con fogli separati per categorie</p>
              <button @click="exportExcel" :disabled="isExporting" class="export-button">
                <span v-if="isExporting" class="loading-spinner">⏳</span>
                {{ isExporting ? 'Esportazione...' : '📊 Esporta Excel' }}
              </button>
            </div>
          </div>

          <div class="export-info">
            <h4>💡 Informazioni sui formati:</h4>
            <ul>
              <li><strong>SQLite:</strong> Database completo per backup e migrazione</li>
              <li>
                <strong>Excel:</strong> 4 fogli (Maggiorenni, Minorenni, Nuovi Maggiorenni, Nuovi
                Minorenni)
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Sezione Backup Automatico -->
      <section class="settings-section">
        <h2>🔄 Backup Automatico</h2>
        <p>Configura il salvataggio automatico del database per proteggere i tuoi dati</p>

        <div class="backup-section">
          <div class="backup-options">
            <div class="backup-option">
              <h3>⏰ Backup Periodico</h3>
              <p>Salva automaticamente il database ogni X minuti di inattività</p>
              <div class="backup-controls">
                <label for="auto-backup-interval">Intervallo (minuti):</label>
                <input
                  id="auto-backup-interval"
                  v-model.number="autoBackupSettings.intervalMinutes"
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  class="form-input"
                />
                <button
                  @click="toggleAutoBackup"
                  :disabled="isSavingBackup"
                  class="backup-toggle-button"
                  :class="{ active: autoBackupSettings.enabled }"
                >
                  {{ autoBackupSettings.enabled ? '✅ Attivo' : '⭕ Disattivo' }}
                </button>
              </div>
            </div>

            <div class="backup-option">
              <h3>🚪 Backup alla Chiusura</h3>
              <p>Salva automaticamente il database quando chiudi l'applicazione</p>
              <div class="backup-controls">
                <button
                  @click="toggleExitBackup"
                  :disabled="isSavingBackup"
                  class="backup-toggle-button"
                  :class="{ active: exitBackupSettings.enabled }"
                >
                  {{ exitBackupSettings.enabled ? '✅ Attivo' : '⭕ Disattivo' }}
                </button>
              </div>
            </div>
          </div>

          <div class="backup-info">
            <h4>💡 Informazioni sui Backup:</h4>
            <ul>
              <li><strong>Backup Periodico:</strong> Si attiva solo dopo minuti di inattività</li>
              <li>
                <strong>Backup alla Chiusura:</strong> Garantisce che i dati siano sempre salvati
              </li>
              <li><strong>Posizione:</strong> I backup vengono salvati nella cartella Downloads</li>
              <li><strong>Formato:</strong> File SQLite con timestamp nel nome</li>
            </ul>
          </div>

          <div class="backup-actions">
            <button
              @click="createManualBackup"
              :disabled="isSavingBackup"
              class="manual-backup-button"
            >
              <span v-if="isSavingBackup" class="loading-spinner">⏳</span>
              {{ isSavingBackup ? 'Creazione Backup...' : '💾 Backup Manuale' }}
            </button>
            <button @click="viewBackupHistory" class="history-button">📋 Cronologia Backup</button>
          </div>
        </div>
      </section>

      <!-- Sezione Configurazione Applicazione -->
      <section class="settings-section">
        <h2>🔧 Configurazione Applicazione</h2>
        <p>Parametri globali per il funzionamento dell'applicazione</p>

        <div class="config-grid">
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
            <small class="help-text">
              Numero di ricevute contenute in ogni blocchetto cartaceo (default: 10).
              Usato per calcolare automaticamente il numero di ricevuta.
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
            <small class="help-text">
              Importo standard per il rinnovo annuale (default: 10.00).
            </small>
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
            <small class="help-text">
              Importo per la prima iscrizione di un nuovo socio (default: 25.00).
            </small>
          </div>

          <div class="action-buttons">
             <button
                @click="saveAppConfig"
                :disabled="isSavingConfig"
                class="save-button"
              >
                <span v-if="isSavingConfig" class="loading-spinner">⏳</span>
                {{ isSavingConfig ? 'Salvataggio...' : '💾 Salva Configurazione' }}
              </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { getSetting, updateSetting, downloadDatabaseExport } from '@/services/db'
import { exportDataToExcel } from '@/services/export'
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

const appConfig = ref({
  receiptsPerBlock: 10,
  defaultQuota: 10.0,
  newMemberQuota: 25.0
})

// Auto-backup settings
const autoBackupSettings = ref({
  enabled: false,
  intervalMinutes: 60,
})

const exitBackupSettings = ref({
  enabled: true,
})

// Carica il template attuale al mount
onMounted(async () => {
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
  } catch (error) {
    console.error('Errore caricamento config:', error)
  }
})

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
 * Attiva/disattiva il backup automatico periodico
 */
const toggleAutoBackup = async () => {
  try {
    isSavingBackup.value = true
    const newEnabled = !autoBackupSettings.value.enabled

    await updateSetting('autoBackupEnabled', newEnabled)
    await updateSetting('autoBackupInterval', autoBackupSettings.value.intervalMinutes)

    autoBackupSettings.value.enabled = newEnabled

    toast.success(
      newEnabled
        ? `Backup automatico attivato (${autoBackupSettings.value.intervalMinutes} minuti)`
        : 'Backup automatico disattivato',
    )
  } catch (error) {
    console.error('Errore toggle backup automatico:', error)
    toast.error('Errore nel salvataggio delle impostazioni backup')
  } finally {
    isSavingBackup.value = false
  }
}

/**
 * Attiva/disattiva il backup alla chiusura dell'applicazione
 */
const toggleExitBackup = async () => {
  try {
    isSavingBackup.value = true
    const newEnabled = !exitBackupSettings.value.enabled

    await updateSetting('exitBackupEnabled', newEnabled)

    exitBackupSettings.value.enabled = newEnabled

    toast.success(newEnabled ? 'Backup alla chiusura attivato' : 'Backup alla chiusura disattivato')
  } catch (error) {
    console.error('Errore toggle backup chiusura:', error)
    toast.error('Errore nel salvataggio delle impostazioni backup')
  } finally {
    isSavingBackup.value = false
  }
}

/**
 * Crea un backup manuale
 */
const createManualBackup = async () => {
  try {
    isSavingBackup.value = true
    toast.info('Creazione backup manuale...')

    await downloadDatabaseExport()

    toast.success('Backup manuale creato con successo!')
  } catch (error) {
    console.error('Errore backup manuale:', error)
    toast.error('Errore nella creazione del backup manuale')
  } finally {
    isSavingBackup.value = false
  }
}

/**
 * Visualizza la cronologia dei backup (placeholder per future implementazioni)
 */
const viewBackupHistory = () => {
  toast.info('Funzionalità cronologia backup in sviluppo')
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
    toast.success('Configurazione salvata con successo!')
  } catch (error) {
    console.error('Errore salvataggio configurazione:', error)
    toast.error('Errore nel salvataggio della configurazione')
  } finally {
    isSavingConfig.value = false
  }
}
</script>

<style scoped>
.settings-view {
  min-height: 100vh;
  background-color: var(--color-background);
  padding: 2rem 0;
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
  background-color: #4caf50;
  color: white;
}

.save-button:hover:not(:disabled) {
  background-color: #388e3c;
}

.reset-button {
  background-color: #ff9800;
  color: white;
}

.reset-button:hover:not(:disabled) {
  background-color: #f57c00;
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
  background-color: #2196f3;
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
  background-color: #1976d2;
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
  background-color: #666;
  transform: scale(1.02);
}

.backup-toggle-button.active {
  background-color: #4caf50;
}

.backup-toggle-button.active:hover:not(:disabled) {
  background-color: #388e3c;
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
  background-color: #a22a2a;
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
</style>
