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
              />
            </div>
          </div>

          <!-- Controlli Template -->
          <div class="controls-section">
            <h3>Impostazioni Template</h3>

            <div class="control-group">
              <label for="background-upload">Immagine di Sfondo:</label>
              <input
                id="background-upload"
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                :disabled="isSaving"
              />
              <small class="help-text">
                Carica un'immagine per personalizzare lo sfondo delle tessere.<br />
                Formati supportati: JPG, PNG, GIF. Dimensione massima: 2MB.
              </small>
            </div>

            <div class="control-group" v-if="selectedImage">
              <label>Anteprima selezionata:</label>
              <div class="image-preview">
                <img :src="selectedImage" alt="Anteprima immagine" />
              </div>
            </div>

            <div class="action-buttons">
              <button
                @click="saveTemplate"
                :disabled="!selectedImage || isSaving"
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

      <!-- Sezione Altre Impostazioni (placeholder per future espansioni) -->
      <section class="settings-section">
        <h2>🔧 Altre Impostazioni</h2>
        <p>Ulteriori configurazioni saranno disponibili nelle prossime versioni</p>
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
const previewBackground = ref(null)
const isSaving = ref(false)
const isExporting = ref(false)

// Carica il template attuale al mount
onMounted(async () => {
  try {
    const savedBackground = await getSetting('cardBackground')
    if (savedBackground) {
      previewBackground.value = savedBackground
    }
  } catch (error) {
    console.error('Errore caricamento template:', error)
    toast.error('Errore nel caricamento del template attuale')
  }
})

/**
 * Gestisce l'upload dell'immagine
 */
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Controlla il tipo di file
  if (!file.type.startsWith('image/')) {
    toast.error('Seleziona un file immagine valido')
    return
  }

  // Controlla la dimensione (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    toast.error("L'immagine è troppo grande. Dimensione massima: 2MB")
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    selectedImage.value = e.target.result
    previewBackground.value = e.target.result
    toast.success('Immagine caricata con successo!')
  }
  reader.onerror = () => {
    toast.error('Errore nella lettura del file')
  }
  reader.readAsDataURL(file)
}

/**
 * Salva il template nel database
 */
const saveTemplate = async () => {
  if (!selectedImage.value) return

  try {
    isSaving.value = true
    toast.info('Salvataggio template in corso...')

    await updateSetting('cardBackground', selectedImage.value)

    toast.success('Template salvato con successo!')
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
    previewBackground.value = null
    selectedImage.value = null

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
}
</style>
