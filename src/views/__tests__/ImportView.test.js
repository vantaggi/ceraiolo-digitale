import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Solo dati finti: il file sqlite e' simulato, si guardano le sue tabelle
let tabelleDelFile = []
const ripristinati = []
const soloSoci = []
vi.mock('@/services/db', () => ({
  db: {
    transaction: async (_m, _a, _b, fn) => fn(),
    soci: { bulkPut: async (righe) => soloSoci.push(...righe) },
    tesseramenti: { bulkPut: async () => {} },
  },
  isDatabaseEmpty: vi.fn(async () => true),
  importDatabaseFromSqlite: async (file) => {
    ripristinati.push(file.name)
    return { success: true }
  },
  contaArchivio: async () => ({ soci: 180, pagamenti: 950 }),
}))
vi.mock('@/services/sqljs', () => ({
  caricaSqlJs: vi.fn(async () => ({
    Database: class {
      exec() {
        return [{ columns: ['name'], values: tabelleDelFile.map((t) => [t]) }]
      }
      prepare(sql) {
        const righe = sql.includes('Soci') ? [{ id: 1, cognome: 'Prova' }] : []
        let i = -1
        return { step: () => ++i < righe.length, getAsObject: () => righe[i], free: () => {} }
      }
      close() {}
    },
  })),
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ replace: vi.fn() }) }))

const { default: ImportView } = await import('../ImportView.vue')

const monta = () =>
  mount(ImportView, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, AppIcon: true } },
  })

describe('ImportView (archivio vuoto)', () => {
  it("ha l'intestazione di tutte le pagine: titolo Benvenuto e la descrizione", () => {
    const wrapper = monta()
    expect(wrapper.find('header.page-header').exists()).toBe(true)
    expect(wrapper.get('h1').text()).toBe('Benvenuto')
    expect(wrapper.text()).toContain('In questo browser, a questo indirizzo, non ci sono dati.')
  })

  it("prima dice a chi usa gia' l'app dove sono i dati, con l'indirizzo di questa pagina", () => {
    const wrapper = monta()
    const casi = wrapper.findAll('h2').map((h) => h.text())
    expect(casi).toEqual(["Usi già l'app?", 'È la prima volta?'])
    expect(wrapper.get('strong').text()).toBe(
      `${window.location.host}${window.location.pathname}`.replace(/\/$/, ''),
    )
    expect(wrapper.text()).toContain('ceraiolo_backup.sqlite')
    expect(wrapper.text()).toContain('torna tutto, soci, pagamenti, impostazioni e blocchetti')
  })

  it("Importa e' un'azione secondaria, non il pulsante rosso", () => {
    const wrapper = monta()
    const importa = wrapper.findAll('button').find((b) => b.text() === 'Importa')
    expect(importa.classes().some((c) => c.includes('primary'))).toBe(false)
  })

  it('Importa resta spento finche non si sceglie un file, poi mostra nome e peso', async () => {
    const wrapper = monta()
    const importa = wrapper.findAll('button').find((b) => b.text() === 'Importa')
    expect(importa.attributes('disabled')).toBeDefined()
    const input = wrapper.get('input[type="file"]')
    const file = new File(['x'.repeat(2048)], 'prova.sqlite')
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    expect(importa.attributes('disabled')).toBeUndefined()
    expect(wrapper.text()).toContain('prova.sqlite · 2 KB')
  })

  it('un file con estensione sbagliata da un errore annunciato', async () => {
    const wrapper = monta()
    const input = wrapper.get('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [new File(['x'], 'soci.csv')] })
    await input.trigger('change')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Importa')
      .trigger('click')
    expect(wrapper.get('[role="alert"]').text()).toContain('database SQLite')
  })

  const importa = async (wrapper, nome) => {
    const input = wrapper.get('input[type="file"]')
    const file = new File(['x'], nome)
    file.arrayBuffer = async () => new ArrayBuffer(1)
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Importa')
      .trigger('click')
    await flushPromises()
  }

  it("un backup dell'app si ripristina tutto, impostazioni e blocchetti compresi", async () => {
    tabelleDelFile = ['Soci', 'Tesseramenti', 'Blocchetti', 'Settings', 'LocalChanges', 'Metadata']
    const wrapper = monta()
    await importa(wrapper, 'ceraiolo_backup.sqlite')
    expect(ripristinati).toEqual(['ceraiolo_backup.sqlite'])
    expect(wrapper.get('[role="status"]').text()).toBe(
      'Backup ripristinato: 180 soci, 950 pagamenti, impostazioni e blocchetti.',
    )
  })

  it('il database iniziale dei soci si importa come prima, solo soci e pagamenti', async () => {
    ripristinati.length = 0
    tabelleDelFile = ['Soci', 'Tesseramenti']
    const wrapper = monta()
    await importa(wrapper, 'santantoniari.sqlite')
    expect(ripristinati).toEqual([])
    expect(soloSoci).toHaveLength(1)
    expect(wrapper.get('[role="status"]').text()).toContain('Importazione completata: 1 soci')
  })
})
