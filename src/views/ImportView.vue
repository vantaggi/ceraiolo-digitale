<template>
  <div class="import-container">
    <h1>Benvenuto in Ceraiolo Digitale</h1>
    <p>Per iniziare, importa il database dei soci.</p>

    <div v-if="!isLoading">
      <input type="file" @change="handleFileSelect" accept=".sqlite, .sqlite3" />
      <button @click="importDatabase" :disabled="!selectedFile">Importa Database</button>
    </div>

    <div v-if="isLoading">
      <p>Importazione in corso... non chiudere la pagina.</p>
    </div>

    <div v-if="importStatus">
      <p>{{ importStatus }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import initSqlJs from 'sql.js'
import { db, isDatabaseEmpty } from '@/services/db'

const selectedFile = ref(null)
const isLoading = ref(false)
const importStatus = ref('')
const router = useRouter()

// Store the selected file
const handleFileSelect = (event) => {
  selectedFile.value = event.target.files[0]
  importStatus.value = ''
}

// Main import logic
const importDatabase = async () => {
  if (!selectedFile.value) {
    importStatus.value = 'Per favore, seleziona un file.'
    return
  }

  // Validate file type
  const name = selectedFile.value.name.toLowerCase()
  if (!name.endsWith('.sqlite') && !name.endsWith('.sqlite3')) {
    importStatus.value = 'Il file deve essere un database SQLite (.sqlite o .sqlite3).'
    return
  }

  // Optional size limit (e.g., 50 MB)
  const maxSize = 50 * 1024 * 1024
  if (selectedFile.value.size > maxSize) {
    importStatus.value = 'Il file è troppo grande (max 50 MB).'
    return
  }

  // Check if DB is already populated
  const empty = await isDatabaseEmpty()
  if (!empty) {
    importStatus.value = 'Il database locale è già popolato. Non è possibile importare nuovamente.'
    return
  }

  isLoading.value = true
  importStatus.value = 'Caricamento del database...'

  try {
    const fileBuffer = await selectedFile.value.arrayBuffer()

    // Initialize sql.js
    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    })

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

    importStatus.value = `Importazione completata con successo! ${soci.length} soci e ${tesseramenti.length} tesseramenti caricati.`

    // Redirect to the main dashboard after a short delay
    setTimeout(() => {
      router.replace('/')
    }, 2000)
  } catch (error) {
    console.error('Database import failed:', error)
    importStatus.value = `Errore durante l'importazione: ${error.message}`
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.import-container {
  max-width: 600px;
  margin: 50px auto;
  text-align: center;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
button {
  margin-left: 1rem;
  padding: 0.5rem 1rem;
}
</style>
