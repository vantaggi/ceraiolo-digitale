import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Solo valori inventati: le impostazioni salvate stanno in una mappa finta.
const salvate = new Map()
vi.mock('@/services/db', () => ({
  getSetting: vi.fn(async (k, d) => (salvate.has(k) ? salvate.get(k) : d)),
  updateSetting: vi.fn(async (k, v) => salvate.set(k, v)),
  downloadDatabaseExport: vi.fn(),
  exportChangeLog: vi.fn(),
  normalizeDatabaseData: vi.fn(),
  importDatabaseFromSqlite: vi.fn(),
  wipeDatabase: vi.fn(),
  getDataAuditStats: vi.fn(),
  getUniqueGroups: vi.fn(async () => ['BRANCA', 'PADULE']),
  addCustomGroup: vi.fn(),
  removeCustomGroup: vi.fn(),
  renameGroup: vi.fn(),
}))
vi.mock('@/services/export', () => ({
  exportDataToExcel: vi.fn(),
  exportSettingsToJson: vi.fn(),
  importSettingsFromJson: vi.fn(),
}))
vi.mock('@/services/tessere', () => ({
  caricaModelloTessera: vi.fn(async () => null),
  LARGHEZZA_TESSERA_MM: 85,
  ALTEZZA_TESSERA_MM: 54,
}))
vi.mock('@/services/backupService', () => ({
  backupService: { initialize: vi.fn(async () => {}) },
}))
vi.mock('@/stores/backupStore', () => ({ useBackupStore: () => ({}) }))
const toast = { success: vi.fn(), error: vi.fn() }
vi.mock('vue-toastification', () => ({ useToast: () => toast }))

const { default: SettingsView } = await import('../SettingsView.vue')

const monta = async (scheda) => {
  const wrapper = mount(SettingsView, {
    props: { scheda },
    global: {
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
        AppIcon: true,
        AnteprimaTessera: true,
        ControlloQualitaDati: true,
        DatiComputer: true,
        SectionTabs: true,
      },
    },
  })
  await flushPromises()
  return wrapper
}

const titoli = (wrapper) => wrapper.findAll('.gruppo__titolo').map((t) => t.text())

describe('Impostazioni > Dati: gruppi di righe, la zona pericolosa in fondo', () => {
  it("i gruppi seguono l'ordine d'uso e la zona pericolosa e' l'ultimo", async () => {
    const wrapper = await monta('dati')
    expect(titoli(wrapper)).toEqual([
      'Backup',
      'Esporta',
      'Ripristina',
      'Controllo dei dati',
      'Zona pericolosa',
    ])
  })

  it('ogni riga dice che cosa fa, e nessun campo file del browser resta a vista', async () => {
    const wrapper = await monta('dati')
    const righe = wrapper.findAll('.azione')
    expect(righe.length).toBe(10)
    for (const riga of righe) {
      expect(riga.find('.azione__nome').text()).not.toBe('')
      expect(riga.find('.azione__aiuto').text()).not.toBe('')
    }
    const campiFile = wrapper.findAll('input[type="file"]')
    expect(campiFile.length).toBe(2)
    for (const campo of campiFile) {
      expect(campo.element.closest('label.file-button')).not.toBeNull()
    }
  })

  it("Cancella tutto e' l'unico bottone distruttivo ed e' l'ultima riga", async () => {
    const wrapper = await monta('dati')
    const distruttivi = wrapper.findAll('.base-button--danger')
    expect(distruttivi.map((b) => b.text())).toEqual(['Cancella tutto'])
    const ultima = wrapper.findAll('.azione').at(-1)
    expect(ultima.find('.base-button--danger').exists()).toBe(true)
  })
})

describe('Impostazioni > Manicchie', () => {
  it('le manicchie stanno in un gruppo di righe con il numero nel titolo', async () => {
    const wrapper = await monta('manicchie')
    expect(titoli(wrapper)).toEqual(['2 manicchie'])
    expect(wrapper.findAll('.gruppo .zone-name').map((z) => z.text())).toEqual(['BRANCA', 'PADULE'])
  })
})
