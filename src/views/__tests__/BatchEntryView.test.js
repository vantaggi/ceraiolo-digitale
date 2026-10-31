import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Solo dati inventati. Oggi e' il 31 ottobre 2026, quote 10 e 25 (predefinite).
const SOCI = [
  // nuovo: nessun pagamento, iscritto quest'anno
  {
    id: 1,
    cognome: 'Nuovi',
    nome: 'Carlo',
    data_nascita: '1990-05-01',
    data_prima_iscrizione: 2026,
  },
  // in regola fino al 2025: quota ordinaria
  {
    id: 2,
    cognome: 'Rossi',
    nome: 'Mario',
    data_nascita: '1980-01-01',
    data_prima_iscrizione: 2020,
  },
  // pagato fino al 2024: 2025 arretrato, il 2026 e' un rientro
  {
    id: 3,
    cognome: 'Verdi',
    nome: 'Giulia',
    data_nascita: '1992-01-01',
    data_prima_iscrizione: 2020,
  },
  // ha gia' pagato il 2026
  {
    id: 4,
    cognome: 'Gialli',
    nome: 'Anna',
    data_nascita: '1975-01-01',
    data_prima_iscrizione: 2020,
  },
]
const PAGATI_PRIMA = { 2: [2023, 2024, 2025], 3: [2023, 2024], 4: [2025, 2026] }
let salvati = []

const anniDi = (id) => [
  ...(PAGATI_PRIMA[id] || []),
  ...salvati.filter((p) => p.id_socio === id).map((p) => p.anno),
]

vi.mock('@/services/db', () => ({
  db: { open: async () => {}, soci: { toArray: async () => SOCI } },
  searchSoci: async (testo) =>
    SOCI.filter((s) => `${s.cognome} ${s.nome}`.toLowerCase().includes(testo.toLowerCase())),
  getAnniPagatiDiSoci: async (ids) => new Map(ids.map((id) => [Number(id), anniDi(Number(id))])),
  findExistingPaymentYear: async (id, anni) => anni.find((a) => anniDi(id).includes(a)) ?? null,
  addTesseramento: async (dati) => {
    salvati.push(dati)
  },
  getPagamentiBlocchetto: async () => salvati,
  getNomiSoci: async (ids) => new Map(SOCI.filter((s) => ids.includes(s.id)).map((s) => [s.id, s])),
  getSetting: async (_chiave, predefinito) => predefinito,
  getUniqueGroups: async () => [],
  addSocio: async () => 99,
  addCustomGroup: async () => {},
  deleteTesseramentiByReceipt: async () => 0,
}))
vi.mock('vue-router', () => ({ useRoute: () => ({ query: {} }) }))

const { default: BatchEntryView } = await import('../BatchEntryView.vue')

const monta = async () => {
  const wrapper = mount(BatchEntryView, {
    attachTo: document.body,
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, AppIcon: true } },
  })
  await flushPromises()
  return wrapper
}

/** Scrive nella ricerca e preme Invio: il primo Invio cerca subito, il secondo registra. */
const cercaERegistra = async (wrapper, testo) => {
  const campo = wrapper.get('#cerca-socio')
  await campo.setValue(testo)
  await campo.trigger('keydown', { key: 'Enter' })
  await flushPromises()
  await campo.trigger('keydown', { key: 'Enter' })
  await flushPromises()
}

const esito = (wrapper) => wrapper.get('.esito').text()

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-31T10:00:00'))
  localStorage.clear()
  salvati = []
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('Registra ricevute: Invio registra subito (bozza 2A)', () => {
  it('un socio nuovo paga la quota dei nuovi, non la ordinaria', async () => {
    const wrapper = await monta()
    await cercaERegistra(wrapper, 'nuovi')
    expect(salvati).toEqual([
      {
        id_socio: 1,
        anno: 2026,
        quota_pagata: 25,
        data_pagamento: '2026-10-31',
        numero_ricevuta: 1,
        numero_blocchetto: 1,
      },
    ])
    expect(esito(wrapper)).toBe('Registrato Nuovi Carlo, 2026, € 25,00')
    // la ricerca si svuota per il socio dopo
    expect(wrapper.get('#cerca-socio').element.value).toBe('')
  })

  it('un socio in regola paga la quota ordinaria, e la ricevuta mostra importo e totale', async () => {
    const wrapper = await monta()
    await cercaERegistra(wrapper, 'rossi')
    expect(salvati.map((p) => [p.id_socio, p.anno, p.quota_pagata])).toEqual([[2, 2026, 10]])
    expect(wrapper.get('.riga').text()).toContain('Rossi Mario')
    expect(wrapper.get('.riga').text()).toContain('€ 10,00')
    expect(wrapper.get('.ricevuta__totale').text()).toBe('Totale € 10,00')
  })

  it("chi ha gia' pagato l'anno non si registra di nuovo, e il motivo si legge", async () => {
    const wrapper = await monta()
    await cercaERegistra(wrapper, 'gialli')
    expect(salvati).toEqual([])
    expect(esito(wrapper)).toBe('Gialli Anna ha già pagato la quota 2026.')
  })

  it("con un arretrato registra l'anno e propone l'arretrato sulla riga della ricevuta", async () => {
    const wrapper = await monta()
    await cercaERegistra(wrapper, 'verdi')
    // 2025 scoperto: il 2026 e' un rientro, quota dei nuovi
    expect(salvati.map((p) => [p.anno, p.quota_pagata])).toEqual([[2026, 25]])
    const arretrato = wrapper.get('.riga__arretrato')
    expect(arretrato.text()).toBe("Aggiungi l'arretrato 2025")
    await arretrato.trigger('click')
    await flushPromises()
    // il 2025 viene dopo il 2024 pagato: quota ordinaria, stessa ricevuta
    expect(salvati.map((p) => [p.anno, p.quota_pagata, p.numero_ricevuta])).toEqual([
      [2026, 25, 1],
      [2025, 10, 1],
    ])
    expect(wrapper.find('.riga__arretrato').exists()).toBe(false)
    expect(wrapper.get('.ricevuta__totale').text()).toBe('Totale € 35,00')
  })

  it('il socio scelto con le frecce e il clic su un socio registrano quello giusto', async () => {
    const wrapper = await monta()
    const campo = wrapper.get('#cerca-socio')
    await campo.setValue('i') // troppo corto: nessuna ricerca
    await campo.setValue('ar')
    await campo.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    const nomi = wrapper.findAll('[role="option"]').map((o) => o.find('.risultato__nome').text())
    expect(nomi).toEqual(['Nuovi Carlo', 'Rossi Mario'])
    expect(campo.attributes('aria-activedescendant')).toBe('risultato-0')
    await campo.trigger('keydown', { key: 'ArrowDown' })
    expect(campo.attributes('aria-activedescendant')).toBe('risultato-1')
    await campo.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(salvati.map((p) => p.id_socio)).toEqual([2])

    await campo.setValue('verdi')
    await campo.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    await wrapper.get('[role="option"]').trigger('click')
    await flushPromises()
    expect(salvati.map((p) => p.id_socio)).toEqual([2, 3])
  })
})

describe('Registra ricevute: tastiera', () => {
  it('Ctrl+Invio passa alla ricevuta successiva, anche dalla ricerca', async () => {
    const wrapper = await monta()
    expect(wrapper.get('#ricevuta-titolo').text()).toBe('Ricevuta 1')
    await wrapper.get('#cerca-socio').trigger('keydown', { key: 'Enter', ctrlKey: true })
    await flushPromises()
    expect(wrapper.get('#ricevuta-titolo').text()).toBe('Ricevuta 2')
    expect(salvati).toEqual([])
  })

  it('Esc svuota la ricerca', async () => {
    const wrapper = await monta()
    const campo = wrapper.get('#cerca-socio')
    await campo.setValue('rossi')
    await campo.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.findAll('[role="option"]')).toHaveLength(1)
    await campo.trigger('keydown', { key: 'Escape' })
    expect(campo.element.value).toBe('')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(0)
  })

  it('niente Turbo e niente finestra del pagamento in questa pagina', async () => {
    const wrapper = await monta()
    expect(wrapper.text()).not.toContain('Turbo')
    expect(wrapper.findComponent({ name: 'AddPaymentModal' }).exists()).toBe(false)
  })
})
