import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/services/db', () => ({ db: {}, isDatabaseEmpty: vi.fn(async () => true) }))
vi.mock('@/services/sqljs', () => ({ caricaSqlJs: vi.fn() }))
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
})
