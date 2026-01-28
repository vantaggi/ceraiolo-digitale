import { defineStore } from 'pinia'
import { ref } from 'vue'
import { get, set, del } from 'idb-keyval'

export const useBackupStore = defineStore('backup', () => {
  const isAuthorized = ref(false)
  const lastBackup = ref(localStorage.getItem('lastBackup') || null)
  const autoBackupEnabled = ref(localStorage.getItem('autoBackupEnabled') === 'true')
  const backupPath = ref(localStorage.getItem('backupPath') || 'Non selezionato')

  // We store the handle in IndexedDB because localStorage can't hold objects/handles
  const DB_HANDLE_KEY = 'backup_dir_handle'

  const setDirectoryHandle = async (handle) => {
    await set(DB_HANDLE_KEY, handle)
    isAuthorized.value = true
    backupPath.value = handle.name
    localStorage.setItem('backupPath', handle.name)
  }

  const getDirectoryHandle = async () => {
    return await get(DB_HANDLE_KEY)
  }

  const clearDirectoryHandle = async () => {
    await del(DB_HANDLE_KEY)
    isAuthorized.value = false
    backupPath.value = 'Non selezionato'
    localStorage.removeItem('backupPath')
    autoBackupEnabled.value = false
    localStorage.setItem('autoBackupEnabled', 'false')
  }

  const updateLastBackup = (timestamp) => {
    lastBackup.value = timestamp
    localStorage.setItem('lastBackup', timestamp)
  }

  const toggleAutoBackup = (enabled) => {
    autoBackupEnabled.value = enabled
    localStorage.setItem('autoBackupEnabled', enabled)
  }

  return {
    isAuthorized,
    lastBackup,
    autoBackupEnabled,
    backupPath,
    setDirectoryHandle,
    getDirectoryHandle,
    clearDirectoryHandle,
    updateLastBackup,
    toggleAutoBackup
  }
})
