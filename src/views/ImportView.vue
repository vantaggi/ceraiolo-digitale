<template>
  <div class="import-view">
    <PageHeader
      title="Benvenuto"
      subtitle="In questo browser, a questo indirizzo, non ci sono dati."
    />

    <!-- Scelta 3A delle bozze della PR 7: chi apre la pagina per sbaglio (altro browser,
         altro indirizzo) legge prima dove sono i suoi dati; importare e' la seconda strada,
         con un pulsante secondario. -->
    <div class="casi">
      <section class="caso" aria-labelledby="caso-gia">
        <h2 id="caso-gia" class="caso__titolo">Usi già l'app?</h2>
        <p class="caso__testo">
          I dati stanno solo nel browser dove li hai inseriti. Aprila dal solito computer, con il
          solito browser e dal solito indirizzo (questo è <strong>{{ indirizzo }}</strong
          >).
        </p>
        <p class="caso__testo">
          Se l'archivio è davvero sparito, importa l'ultimo backup
          (<code>ceraiolo_backup.sqlite</code>) come per la prima volta: tornano soci e pagamenti,
          le impostazioni e i blocchetti vanno rimessi a mano.
        </p>
      </section>

      <section class="caso" aria-labelledby="caso-primo">
        <h2 id="caso-primo" class="caso__titolo">È la prima volta?</h2>
        <p class="caso__testo">
          Importa il database dei soci (.sqlite). Se l'app è già usata su un altro computer,
          importare qui crea una seconda copia separata.
        </p>

        <div class="caso__campo">
          <span id="file-etichetta" class="caso__etichetta">File del database (.sqlite)</span>
          <input
            ref="fileInput"
            type="file"
            class="sr-only"
            tabindex="-1"
            aria-labelledby="file-etichetta"
            accept=".sqlite, .sqlite3"
            @change="handleFileSelect"
          />
          <div class="caso__scelta">
            <BaseButton
              :disabled="isLoading"
              aria-describedby="file-scelto"
              @click="fileInput?.click()"
            >
              Scegli il file
            </BaseButton>
            <span id="file-scelto" class="caso__file">
              {{
                selectedFile
                  ? `${selectedFile.name} · ${dimensione(selectedFile.size)}`
                  : 'Nessun file scelto'
              }}
            </span>
          </div>
        </div>

        <div>
          <BaseButton :disabled="!selectedFile" :loading="isLoading" @click="importDatabase">
            Importa
          </BaseButton>
        </div>

        <p class="caso__nota">
          Dopo l'importazione attiva il backup automatico da Impostazioni › Dati e backup.
        </p>

        <p
          v-if="importStatus"
          class="caso__stato"
          :class="{ 'caso__stato--errore': statoErrore }"
          :role="statoErrore ? 'alert' : 'status'"
        >
          {{ importStatus }}
        </p>
      </section>
    </div>
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

// Indirizzo da cui e' aperta l'app: i dati di un altro indirizzo qui non si vedono.
const indirizzo = `${window.location.host}${window.location.pathname}`.replace(/\/$/, '')

const dimensione = (byte) =>
  byte >= 1024 * 1024
    ? `${(byte / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(byte / 1024))} KB`

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

.casi {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-16);
  align-items: start;
}

.caso {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  padding: var(--space-24);
  background: var(--background-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-surface);
}

.caso__titolo {
  margin: 0;
  font-size: var(--font-size-section-heading);
}

.caso__testo {
  margin: 0;
  overflow-wrap: anywhere;
}

.caso__campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.caso__etichetta {
  font-size: var(--font-size-label);
  font-weight: 500;
}

.caso__scelta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-12);
}

.caso__file,
.caso__nota,
.caso__stato {
  color: var(--text-secondary);
}

.caso__nota,
.caso__stato {
  margin: 0;
  font-size: var(--font-size-caption);
}

.caso__stato--errore {
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

  .casi {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
