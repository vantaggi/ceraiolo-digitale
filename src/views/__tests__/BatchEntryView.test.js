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
  // minorenne nel 2027, mai iscritto: dal 2027 paga un'offerta
  {
    id: 5,
    cognome: 'Piccini',
    nome: 'Elena',
    data_nascita: '2013-04-01',
    data_prima_iscrizione: null,
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
  // id del pagamento = posizione in salvati + 1
  updateTesseramentoQuota: async (id, quota) => {
    salvati[id - 1].quota_pagata = quota
  },
  getPagamentiBlocchetto: async () => salvati.map((p, i) => ({ id_tesseramento: i + 1, ...p })),
  getNomiSoci: async (ids) => new Map(SOCI.filter((s) => ids.includes(s.id)).map((s) => [s.id, s])),
  getSetting: async (_chiave, predefinito) => predefinito,
  getQuotePerAnno: async () =>
    (await import('@/utils/payment')).quotePredefinite({ quotaOrdinaria: 10, quotaNuovi: 25 }),
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
    // il 2025 viene dopo il 2024 pagato: quota ordinaria, stessa ricevuta. Con l'arretrato
    // saldato il 2026 non e' piu' un rientro: scende alla quota ordinaria (Cioti, 1/11/2026)
    expect(salvati.map((p) => [p.anno, p.quota_pagata, p.numero_ricevuta])).toEqual([
      [2026, 10, 1],
      [2025, 10, 1],
    ])
    expect(wrapper.find('.riga__arretrato').exists()).toBe(false)
    expect(wrapper.get('.ricevuta__totale').text()).toBe('Totale € 20,00')
    expect(esito(wrapper)).toContain('la quota 2026 passa a € 10,00')
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

describe('Registra ricevute: nuovo socio dal modulo', () => {
  const registraNuovo = async (wrapper, dataNascita) => {
    await wrapper.get('.cerca__nuovo').trigger('click')
    await flushPromises()
    await wrapper.get('#nuovo-socio-incassi-cognome').setValue('Piccoli')
    await wrapper.get('#nuovo-socio-incassi-nome').setValue('Luca')
    await wrapper.get('#nuovo-socio-incassi-data_nascita').setValue(dataNascita)
    await wrapper.get('#nuovo-socio-incassi-luogo_nascita').setValue('Gubbio')
    await wrapper.get('.nuovo form').trigger('submit')
    await flushPromises()
  }

  it('un minorenne nuovo paga la quota ordinaria, non quella dei nuovi', async () => {
    const wrapper = await monta()
    await registraNuovo(wrapper, '2012-03-04')
    expect(salvati.map((p) => [p.id_socio, p.anno, p.quota_pagata])).toEqual([[99, 2026, 10]])
  })

  it("nel 2027 un minorenne nuovo non si salva senza l'offerta, poi registra l'importo", async () => {
    const wrapper = await monta()
    await wrapper.get('#anno-riferimento').setValue(2027)
    await flushPromises()
    await registraNuovo(wrapper, '2012-03-04')
    expect(salvati).toEqual([])
    expect(esito(wrapper)).toContain("Scrivi l'importo dell'offerta")
    const offerta = wrapper.get('#nuovo-socio-incassi-offerta')
    expect(document.activeElement).toBe(offerta.element)
    await offerta.setValue('3')
    await wrapper.get('.nuovo form').trigger('submit')
    await flushPromises()
    expect(salvati.map((p) => [p.id_socio, p.anno, p.quota_pagata])).toEqual([[99, 2027, 3]])
  })

  it('nel 2027 un maggiorenne nuovo non vede il campo offerta', async () => {
    const wrapper = await monta()
    await wrapper.get('#anno-riferimento').setValue(2027)
    await flushPromises()
    await wrapper.get('.cerca__nuovo').trigger('click')
    await flushPromises()
    await wrapper.get('#nuovo-socio-incassi-data_nascita').setValue('1990-03-04')
    expect(wrapper.find('#nuovo-socio-incassi-offerta').exists()).toBe(false)
    await wrapper.get('#nuovo-socio-incassi-data_nascita').setValue('2012-03-04')
    expect(wrapper.find('#nuovo-socio-incassi-offerta').exists()).toBe(true)
  })

  it('un maggiorenne nuovo paga la quota dei nuovi', async () => {
    const wrapper = await monta()
    await registraNuovo(wrapper, '1990-03-04')
    expect(salvati.map((p) => [p.id_socio, p.anno, p.quota_pagata])).toEqual([[99, 2026, 25]])
  })
})

describe('Registra ricevute: offerta dei minorenni dal 2027 (bozza A)', () => {
  const anno2027 = async (wrapper) => {
    await wrapper.get('#anno-riferimento').setValue(2027)
    await flushPromises()
  }
  const campoOfferta = (wrapper) => wrapper.find('#offerta-5')

  it('Invio sul minorenne apre il campo vuoto, non registra niente', async () => {
    const wrapper = await monta()
    await anno2027(wrapper)
    const campo = wrapper.get('#cerca-socio')
    await campo.setValue('piccini')
    await campo.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.get('.risultato__suggerimento').text()).toContain("scrivi l'offerta")
    await campo.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(campoOfferta(wrapper).exists()).toBe(true)
    expect(campoOfferta(wrapper).element.value).toBe('')
    expect(document.activeElement).toBe(campoOfferta(wrapper).element)
    expect(salvati).toEqual([])
  })

  it("l'importo e Invio registrano l'offerta e tornano alla ricerca", async () => {
    const wrapper = await monta()
    await anno2027(wrapper)
    await cercaERegistra(wrapper, 'piccini')
    await campoOfferta(wrapper).setValue('5,50')
    await campoOfferta(wrapper).trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(salvati.map((p) => [p.id_socio, p.anno, p.quota_pagata])).toEqual([[5, 2027, 5.5]])
    expect(esito(wrapper)).toContain('Registrato Piccini Elena, 2027, € 5,50')
    expect(campoOfferta(wrapper).exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('#cerca-socio').element)
  })

  it('Invio senza importo, o con 0, non registra e dice che cosa fare', async () => {
    const wrapper = await monta()
    await anno2027(wrapper)
    await cercaERegistra(wrapper, 'piccini')
    for (const valore of ['', '0']) {
      await campoOfferta(wrapper).setValue(valore)
      await campoOfferta(wrapper).trigger('keydown', { key: 'Enter' })
      await flushPromises()
      expect(esito(wrapper)).toContain("Scrivi l'importo dell'offerta")
    }
    expect(salvati).toEqual([])
    expect(campoOfferta(wrapper).exists()).toBe(true)
  })

  it('Esc chiude il campo e torna alla ricerca senza registrare', async () => {
    const wrapper = await monta()
    await anno2027(wrapper)
    await cercaERegistra(wrapper, 'piccini')
    await campoOfferta(wrapper).setValue('5')
    await campoOfferta(wrapper).trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(campoOfferta(wrapper).exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('#cerca-socio').element)
    expect(wrapper.get('#cerca-socio').element.value).toBe('piccini')
    expect(salvati).toEqual([])
  })

  it('il clic sul minorenne apre il campo, e il mouse nel campo non registra', async () => {
    const wrapper = await monta()
    await anno2027(wrapper)
    const campo = wrapper.get('#cerca-socio')
    await campo.setValue('piccini')
    await campo.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    await wrapper.get('[role="option"]').trigger('click')
    await flushPromises()
    const offerta = campoOfferta(wrapper)
    expect(offerta.exists()).toBe(true)
    // il mousedown non deve arrivare alla riga, che lo blocca: il cursore entra nel campo
    const giu = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    offerta.element.dispatchEvent(giu)
    expect(giu.defaultPrevented).toBe(false)
    await offerta.trigger('click')
    await flushPromises()
    expect(salvati).toEqual([])
    expect(campoOfferta(wrapper).exists()).toBe(true)
  })

  it('cambiando anno o ricerca il campo si chiude', async () => {
    const wrapper = await monta()
    await anno2027(wrapper)
    await cercaERegistra(wrapper, 'piccini')
    expect(campoOfferta(wrapper).exists()).toBe(true)
    await wrapper.get('#anno-riferimento').setValue(2026)
    await flushPromises()
    expect(campoOfferta(wrapper).exists()).toBe(false)
    await anno2027(wrapper)
    await cercaERegistra(wrapper, 'piccini')
    await wrapper.get('#cerca-socio').setValue('piccin')
    await flushPromises()
    expect(campoOfferta(wrapper).exists()).toBe(false)
    expect(salvati).toEqual([])
  })

  it("frecce e Ctrl+Invio nel campo non cambiano ricevuta e non perdono l'importo", async () => {
    const wrapper = await monta()
    await anno2027(wrapper)
    await cercaERegistra(wrapper, 'piccini')
    await campoOfferta(wrapper).setValue('5')
    for (const key of ['ArrowLeft', 'ArrowRight']) {
      await campoOfferta(wrapper).trigger('keydown', { key })
    }
    await campoOfferta(wrapper).trigger('keydown', { key: 'Enter', ctrlKey: true })
    await flushPromises()
    expect(wrapper.get('#ricevuta-titolo').text()).toBe('Ricevuta 1')
    expect(campoOfferta(wrapper).element.value).toBe('5')
    expect(esito(wrapper)).toContain("Prima registra l'offerta")
    expect(salvati).toEqual([])
  })

  it('nel 2026 lo stesso minorenne paga la quota, senza campo', async () => {
    const wrapper = await monta()
    await cercaERegistra(wrapper, 'piccini')
    expect(campoOfferta(wrapper).exists()).toBe(false)
    expect(salvati.map((p) => [p.id_socio, p.anno, p.quota_pagata])).toEqual([[5, 2026, 10]])
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
