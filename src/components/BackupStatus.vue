<template>
  <button
    v-if="stato === 'in-pausa'"
    type="button"
    class="backup-status backup-status--attenzione"
    :disabled="riattivazioneInCorso"
    title="Il browser chiede di nuovo il permesso sulla cartella di backup"
    @click="riattiva"
  >
    <AppIcon :name="riattivazioneInCorso ? 'caricamento' : 'attenzione'" :spin="riattivazioneInCorso" />
    Riattiva backup
  </button>
  <RouterLink
    v-else-if="stato === 'spento'"
    :to="{ path: '/settings', query: { tab: 'dati' } }"
    class="backup-status backup-status--attenzione"
    title="Scegli una cartella in Impostazioni > Dati e attiva l'auto-salvataggio"
  >
    <AppIcon name="attenzione" /> Backup automatico spento
  </RouterLink>
  <span
    v-else-if="stato === 'attivo'"
    class="backup-status backup-status--ok"
    :title="`Cartella: ${backupStore.backupPath}`"
  >
    <AppIcon name="ok" /> Backup: {{ ultimoBackup }}
  </span>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useBackupStore } from '@/stores/backupStore'
import { backupService } from '@/services/backupService'
import { descriviUltimoBackup } from '@/utils/backup'
import AppIcon from '@/components/base/AppIcon.vue'

// Stato del backup automatico, sempre visibile nell'intestazione. Il servizio si
// inizializza qui, all'avvio dell'app: prima partiva solo aprendo Impostazioni, e
// dopo una riapertura il backup restava spento senza avvisare.

const backupStore = useBackupStore()
const toast = useToast()
const supportato = typeof window.showDirectoryPicker === 'function'
const adesso = ref(new Date())
const riattivazioneInCorso = ref(false)
let timer = null

const stato = computed(() => {
  if (!supportato) return 'non-supportato'
  if (!backupStore.hasDirectory || !backupStore.autoBackupEnabled) return 'spento'
  if (!backupStore.isAuthorized) return 'in-pausa'
  return 'attivo'
})

const ultimoBackup = computed(() => descriviUltimoBackup(backupStore.lastBackup, adesso.value))

const riattiva = async () => {
  riattivazioneInCorso.value = true
  try {
    if (await backupService.resume()) toast.success('Backup automatico riattivato')
    else toast.error('Permesso sulla cartella di backup non concesso')
  } finally {
    riattivazioneInCorso.value = false
  }
}

onMounted(async () => {
  timer = setInterval(() => (adesso.value = new Date()), 60000)
  try {
    // Chiede al browser di non cancellare da solo i dati dell'app quando manca spazio
    await navigator.storage?.persist?.()
  } catch (error) {
    console.warn('Archiviazione persistente non concessa:', error)
  }
  await backupService.initialize()
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.backup-status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background-color: transparent;
  font-size: var(--font-size-caption);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: none;
}

.backup-status--ok {
  color: var(--color-text-secondary);
}
.backup-status--ok .app-icon {
  color: var(--color-success);
}

.backup-status--attenzione {
  color: var(--color-warning);
  border-color: var(--color-warning);
  cursor: pointer;
}
.backup-status--attenzione:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
}
.backup-status--attenzione:disabled {
  cursor: progress;
}
</style>
