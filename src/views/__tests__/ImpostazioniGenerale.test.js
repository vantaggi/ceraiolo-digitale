import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  getUniqueGroups: vi.fn(async () => []),
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
const { updateSetting } = await import('@/services/db')

const monta = async () => {
  const wrapper = mount(SettingsView, {
    props: { scheda: 'generale' },
    attachTo: document.body,
    global: {
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
        AppIcon: true,
        AnteprimaTessera: true,
        ControlloQualitaDati: true,
        SectionTabs: true,
      },
    },
  })
  await flushPromises()
  return wrapper
}

const righe = (wrapper) => wrapper.findAll('.list-rows__row').map((r) => r.text())
const finestra = () => document.querySelector('[role="dialog"]')

beforeEach(() => {
  salvate.clear()
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

describe('Impostazioni > Generale', () => {
  it('una riga per valore, con il valore attuale; niente anno di riferimento dei minorenni', async () => {
    salvate.set('newMemberQuota', 30)
    const wrapper = await monta()
    expect(righe(wrapper)).toEqual([
      'Città proposta per i nuovi sociGubbio',
      'Ricevute per blocchetto10',
      'Quota ordinaria€ 10,00',
      'Quota dei nuovi soci€ 30,00',
    ])
    expect(wrapper.text()).not.toMatch(/Minorenni/i)
    wrapper.unmount()
  })

  it('premere una riga apre la finestra; Salva scrive solo quel valore e lo mostra nella riga', async () => {
    const wrapper = await monta()
    await wrapper.findAll('.list-rows__row')[3].trigger('click')
    await flushPromises()
    expect(finestra().querySelector('h2').textContent).toBe('Quota dei nuovi soci')
    const campo = finestra().querySelector('input')
    campo.value = '27,5'
    campo.dispatchEvent(new Event('input'))
    finestra().querySelector('form').dispatchEvent(new Event('submit'))
    await flushPromises()
    expect(updateSetting).toHaveBeenCalledTimes(1)
    expect(updateSetting).toHaveBeenCalledWith('newMemberQuota', 27.5)
    expect(finestra()).toBeNull()
    expect(righe(wrapper)[3]).toBe('Quota dei nuovi soci€ 27,50')
    wrapper.unmount()
  })

  it('un valore non valido non si salva e la finestra dice perche', async () => {
    const wrapper = await monta()
    await wrapper.findAll('.list-rows__row')[1].trigger('click')
    await flushPromises()
    const campo = finestra().querySelector('input')
    campo.value = '0'
    campo.dispatchEvent(new Event('input'))
    finestra().querySelector('form').dispatchEvent(new Event('submit'))
    await flushPromises()
    expect(updateSetting).not.toHaveBeenCalled()
    expect(finestra().querySelector('[role="alert"]').textContent).toContain('da 1 a 100')
    wrapper.unmount()
  })
})
