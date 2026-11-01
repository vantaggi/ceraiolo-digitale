<template>
  <ListRows class="dati-computer" title="I dati di questo computer" :rows="righe" />
</template>

<script setup>
// "Dove sono i dati" in cima a Impostazioni › Dati (scelta 2A delle bozze della PR 7):
// i dati vivono solo in questo browser, quindi la pagina dice dove, quanti, se il browser
// li protegge e com'e' il backup. Le righe le scrive utils/datiComputer.js.
import { computed, onMounted, ref } from 'vue'
import ListRows from '@/components/base/ListRows.vue'
import { contaArchivio } from '@/services/db'
import { useBackupStore } from '@/stores/backupStore'
import { righeDatiComputer } from '@/utils/datiComputer'

const backupStore = useBackupStore()
const conteggi = ref(null)
const protetti = ref(null)

const righe = computed(() =>
  righeDatiComputer({
    indirizzo: `${window.location.host}${window.location.pathname}`.replace(/\/$/, ''),
    conteggi: conteggi.value,
    protetti: protetti.value,
    backup: {
      supportato: typeof window.showDirectoryPicker === 'function',
      cartella: backupStore.hasDirectory,
      attivo: backupStore.autoBackupEnabled,
      autorizzato: backupStore.isAuthorized,
      percorso: backupStore.backupPath,
      ultimo: backupStore.lastBackup,
    },
    versione: __BUILD_TIME__,
  }),
)

onMounted(async () => {
  try {
    conteggi.value = await contaArchivio()
  } catch (error) {
    console.error('Conteggio di soci e pagamenti non riuscito:', error)
  }
  try {
    const risposta = await navigator.storage?.persisted?.()
    protetti.value = typeof risposta === 'boolean' ? risposta : null
  } catch {
    protetti.value = null
  }
})
</script>
