import { useBackupStore } from '@/stores/backupStore'
import { exportDatabaseToSqlite } from '@/services/db'
import { useToast } from 'vue-toastification'

let backupDebounceTimer = null
const DEBOUNCE_MS = 5000 // Wait 5 seconds after last change before backing up

export const backupService = {
  async initialize() {
    const store = useBackupStore()
    const handle = await store.getDirectoryHandle()

    if (handle) {
      // We have a stored handle. We need to verify permission.
      // Note: Browsers might require user gesture to re-verify queryPermission
      // so 'isAuthorized' might remain false until a user interaction occurs,
      // or we check queryPermission eagerly.
      const perm = await handle.queryPermission({ mode: 'readwrite' })
      if (perm === 'granted') {
        store.isAuthorized = true
      } else {
        store.isAuthorized = false
      }
    }
  },

  async selectBackupDirectory() {
    const store = useBackupStore()
    const toast = useToast()

    if (typeof window.showDirectoryPicker !== 'function') {
      toast.error(
        'Il tuo browser non supporta la selezione cartelle (Richiede Chrome/Edge Desktop).',
      )
      return false
    }

    try {
      const handle = await window.showDirectoryPicker()
      if (handle) {
        await store.setDirectoryHandle(handle)
        return true
      }
    } catch (error) {
      console.error('Error selecting directory:', error)
      if (error.name !== 'AbortError') {
        throw error
      }
    }
    return false
  },

  async performBackup(manual = false) {
    const store = useBackupStore()
    const toast = useToast()

    if (!store.isAuthorized) {
      // Try to recover handle and check permission again
      const handle = await store.getDirectoryHandle()
      if (handle) {
        const perm = await handle.requestPermission({ mode: 'readwrite' })
        if (perm === 'granted') {
          store.isAuthorized = true
        } else {
          if (manual) toast.error('Permesso di scrittura negato.')
          return false
        }
      } else {
        if (manual) toast.error('Nessuna cartella di backup configurata.')
        return false
      }
    }

    try {
      const rootHandle = await store.getDirectoryHandle()

      // 1. Get/Create Daily Folder (YYYY-MM-DD for better sorting)
      const now = new Date()
      // Use YYYY-MM-DD for easier sorting
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const folderName = `backup_${year}-${month}-${day}`

      try {
        const dayFolder = await rootHandle.getDirectoryHandle(folderName, { create: true })

        // 2. Generate Export Blob
        // We use the existing export logic which returns a blob
        const exportResult = await exportDatabaseToSqlite()
        if (!exportResult.success) throw new Error(exportResult.error)

        // 3. Write File (database.sqlite) - Overwrite
        const fileHandle = await dayFolder.getFileHandle('ceraiolo_backup.sqlite', { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(exportResult.blob)
        await writable.close()

        // 4. Update Metadata
        const timestamp = new Date().toLocaleString()
        store.updateLastBackup(timestamp)

        if (manual) {
          toast.success(`Backup completato in: ${folderName}/ceraiolo_backup.sqlite`)
        } else {
          console.log('Auto-backup completed successfully to', folderName)
        }
      } catch (err) {
        throw new Error(`Impossibile scrivere nella cartella di backup: ${err.message}`)
      }

      // 5. RETENTION POLICY: Keep last 3 folders
      try {
        const dirIterator = rootHandle.values()
        const backupDirs = []
        for await (const entry of dirIterator) {
          if (entry.kind === 'directory' && entry.name.startsWith('backup_')) {
            backupDirs.push(entry.name)
          }
        }

        // Sort naturally (YYYY-MM-DD helps)
        backupDirs.sort()

        // If more than 3, delete the oldest
        if (backupDirs.length > 3) {
          const dirsToDelete = backupDirs.slice(0, backupDirs.length - 3)
          for (const dirName of dirsToDelete) {
            try {
              await rootHandle.removeEntry(dirName, { recursive: true })
              console.log('Cleaned up old backup:', dirName)
            } catch (cleanupErr) {
              console.warn('Failed to cleanup old backup:', dirName, cleanupErr)
            }
          }
        }
      } catch (retentionErr) {
        console.warn('Retention policy execution failed:', retentionErr)
        // Don't fail the main backup operation just because cleanup failed
      }

      return true
    } catch (error) {
      console.error('Backup failed:', error)
      if (manual) toast.error(`Backup fallito: ${error.message}`)

      // If permission is gone, reset auth state
      if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
        store.isAuthorized = false
      }
      return false
    }
  },

  // Called by DB hooks
  notifyChange() {
    const store = useBackupStore()
    if (!store.autoBackupEnabled || !store.isAuthorized) return

    if (backupDebounceTimer) clearTimeout(backupDebounceTimer)

    backupDebounceTimer = setTimeout(() => {
      this.performBackup(false)
    }, DEBOUNCE_MS)
  },
}
