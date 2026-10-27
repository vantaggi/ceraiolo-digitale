import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useBackupStore } from '@/stores/backupStore'
import { backupService } from '@/services/backupService'
import BackupStatus from '../BackupStatus.vue'

vi.mock('@/services/backupService', () => ({
  backupService: { initialize: vi.fn(), resume: vi.fn() },
}))
vi.mock('vue-toastification', () => ({
  useToast: () => ({ success() {}, error() {} }),
}))

const monta = () =>
  mount(BackupStatus, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } })

describe('BackupStatus', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.showDirectoryPicker = () => {}
  })

  it("inizializza il backup all'avvio, non solo in Impostazioni", async () => {
    monta()
    await flushPromises()
    expect(backupService.initialize).toHaveBeenCalledTimes(1)
  })

  it('senza cartella avvisa che il backup automatico e\' spento', async () => {
    const wrapper = monta()
    await flushPromises()
    expect(wrapper.text()).toContain('Backup automatico spento')
  })

  it('con il permesso ritirato offre di riattivarlo con un clic', async () => {
    const store = useBackupStore()
    store.hasDirectory = true
    store.autoBackupEnabled = true
    store.isAuthorized = false
    backupService.resume.mockResolvedValue(true)

    const wrapper = monta()
    await flushPromises()
    await wrapper.get('button').trigger('click')

    expect(backupService.resume).toHaveBeenCalledTimes(1)
  })

  it("quando e' attivo mostra da quanto tempo e' stato fatto l'ultimo backup", async () => {
    const store = useBackupStore()
    store.hasDirectory = true
    store.autoBackupEnabled = true
    store.isAuthorized = true
    store.lastBackup = new Date(Date.now() - 3 * 60000).toISOString()

    const wrapper = monta()
    await flushPromises()
    expect(wrapper.text()).toContain('Backup: 3 min fa')
  })
})
