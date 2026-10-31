<template>
  <div class="import-view">
    <PageHeader
      title="Benvenuto"
      subtitle="L'archivio di questo computer è vuoto. Importa il database dei soci per iniziare."
    />

    <section class="importa" aria-labelledby="importa-titolo">
      <h2 id="importa-titolo" class="importa__titolo">Importa il database</h2>

      <div class="importa__campo">
        <span id="file-etichetta" class="importa__etichetta">File del database (.sqlite)</span>
        <input
          ref="fileInput"
          type="file"
          class="sr-only"
          tabindex="-1"
          aria-labelledby="file-etichetta"
          accept=".sqlite, .sqlite3"
          @change="handleFileSelect"
        />
        <div class="importa__scelta">
          <BaseButton
            :disabled="isLoading"
            aria-describedby="file-scelto"
            @click="fileInput?.click()"
          >
            Scegli il file
          </BaseButton>
          <span id="file-scelto" class="importa__file">
            {{ selectedFile ? `${selectedFile.name} · ${dimensione(selectedFile.size)}` : 'Nessun file scelto' }}
          </span>
        </div>
      </div>

      <p class="importa__nota">
        I dati restano solo in questo browser. Dopo l'importazione attiva il backup automatico da
        Impostazioni › Dati e backup.
      </p>

      <div>
        <BaseButton
          variant="primary"
          :disabled="!selectedFile"
          :loading="isLoading"
          @click="importDatabase"
        >
          Importa
        </BaseButton>
      </div>

      <p
        v-if="importStatus"
        class="importa__stato"
        :class="{ 'importa__stato--errore': statoErrore }"
        :role="statoErrore ? 'alert' : 'status'"
      >
        {{ importStatus }}
      </p>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { caricaSqlJs } from '@/services/sqljs'
import { db, isDatabaseEmpty } from '@/services/db'
import PageHeader from '@/components/base/PageHeader.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const selectedFile = ref(null)
const isLoading = ref(false)
const importStatus = ref('')
const statoErrore = ref(false)
const fileInput = ref(null)
const router = useRouter()

const dimensione = (byte) =>
  byte >= 1024 * 1024 ? `${(byte / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(byte / 1024))} KB`

const errore = (testo) => {
  importStatus.value = testo
  statoErrore.value = true
}

// Store the selected file
const handleFileSelect = (event) => {
  selectedFile.value = event.target.files[0]
  importStatus.value = ''
  statoErrore.value = false
}

// Main import logic
const importDatabase = async () => {
  if (!selectedFile.value) {
    errore('Scegli prima il file del database.')
    return
  }

  // Validate file type
  const name = selectedFile.value.name.toLowerCase()
  if (!name.endsWith('.sqlite') && !name.endsWith('.sqlite3')) {
    errore('Il file deve essere un database SQLite (.sqlite o .sqlite3).')
    return
  }

  // Optional size limit (e.g., 50 MB)
  const maxSize = 50 * 1024 * 1024
  if (selectedFile.value.size > maxSize) {
    errore('Il file è troppo grande (massimo 50 MB).')
    return
  }

  // Check if DB is already populated
  const empty = await isDatabaseEmpty()
  if (!empty) {
    errore("L'archivio di questo computer contiene già dei soci: non si può importare di nuovo.")
    return
  }

  isLoading.value = true
  statoErrore.value = false
  importStatus.value = 'Caricamento del database...'

  try {
    const fileBuffer = await selectedFile.value.arrayBuffer()

    // Initialize sql.js
    const SQL = await caricaSqlJs()

    const dbFile = new SQL.Database(new Uint8Array(fileBuffer))

    // --- Import Soci Table ---
    importStatus.value = 'Importazione soci...'
    const sociStmt = dbFile.prepare('SELECT * FROM Soci')
    const soci = []
    while (sociStmt.step()) {
      soci.push(sociStmt.getAsObject())
    }
    sociStmt.free()

    // --- Import Tesseramenti Table ---
    importStatus.value = 'Importazione tesseramenti...'
    const tStmt = dbFile.prepare('SELECT * FROM Tesseramenti')
    const tesseramenti = []
    while (tStmt.step()) {
      tesseramenti.push(tStmt.getAsObject())
    }
    tStmt.free()

    // Use a transaction for atomicity
    await db.transaction('rw', db.soci, db.tesseramenti, async () => {
      await db.soci.bulkPut(soci)
      await db.tesseramenti.bulkPut(tesseramenti)
    })

    importStatus.value = `Importazione completata: ${soci.length} soci e ${tesseramenti.length} pagamenti.`

    // Redirect to the main dashboard after a short delay
    setTimeout(() => {
      router.replace('/')
    }, 2000)
  } catch (error) {
    console.error('Database import failed:', error)
    errore(`Importazione non riuscita: ${error.message}`)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.import-view {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-32);
}

.importa {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  max-width: var(--page-width-form);
  padding: var(--space-24);
  background: var(--background-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-surface);
}

.importa__titolo {
  margin: 0;
  font-size: var(--font-size-section-heading);
}

.importa__campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.importa__etichetta {
  font-size: var(--font-size-label);
  font-weight: 500;
}

.importa__scelta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-12);
}

.importa__file,
.importa__nota,
.importa__stato {
  color: var(--text-secondary);
}

.importa__nota,
.importa__stato {
  margin: 0;
  font-size: var(--font-size-caption);
}

.importa__stato--errore {
  color: var(--status-error);
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

@media (max-width: 640px) {
  .import-view {
    padding: var(--space-24) var(--space-16);
  }
}
</style>
