import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Solo dati inventati. Oggi e' il 31 ottobre 2026.
let socio
let pagamenti = []
const salvati = []
const eliminati = []
vi.mock('@/services/db', () => ({
  getSocioById: vi.fn(async () => socio),
  getTesseramentiBySocioId: vi.fn(async () => pagamenti),
  addTesseramento: vi.fn(),
  deleteSocio: vi.fn(),
  deleteTesseramento: async (id) => {
    eliminati.push(id)
  },
  updateSocio: async (id, dati) => {
    salvati.push([id, dati])
  },
  updateTesseramentoQuota: vi.fn(),
  getUniqueGroups: async () => ['INTERNA', 'PADULE'],
  addCustomGroup: async () => {},
}))
vi.mock('@/services/export', () => ({ generateSingleCardPDF: vi.fn(), formatDate: (d) => d }))
vi.mock('@/composables/useDialog', () => ({ askConfirm: async () => true }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '1' } }),
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' },
}))
vi.mock('vue-toastification', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))

const { default: SocioDetailView } = await import('../SocioDetailView.vue')

const monta = async () => {
  const wrapper = mount(SocioDetailView, {
    attachTo: document.body,
    global: {
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
        AppIcon: true,
        AddPaymentModal: true,
        ConfirmDeleteModal: true,
      },
    },
  })
  await flushPromises()
  return wrapper
}

/** Il valore di una riga dell'anagrafica, dal suo nome. */
const valore = (wrapper, nome) =>
  wrapper
    .findAll('.list-rows__row')
    .find((r) => r.get('.list-rows__label').text() === nome)
    .get('.list-rows__value')
    .text()

const bottone = (wrapper, testo) => wrapper.findAll('button').find((b) => b.text().includes(testo))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-31T10:00:00'))
  salvati.length = 0
  eliminati.length = 0
})

afterEach(() => {
  vi.useRealTimers()
  pagamenti = []
  document.body.innerHTML = ''
})

describe('SocioDetailView: minorenne dal solo anno di nascita', () => {
  it('chi e nato a dicembre 2008 non e segnato minorenne nel 2026', async () => {
    socio = { id: 1, cognome: 'Alfa', nome: 'Dicembre', data_nascita: '2008-12-15' }
    const wrapper = await monta()
    expect(valore(wrapper, 'Nascita')).not.toContain('minorenne')
  })

  it('chi e nato nel 2009 e segnato minorenne nel 2026', async () => {
    socio = { id: 1, cognome: 'Beta', nome: 'Gennaio', data_nascita: '2009-01-01' }
    const wrapper = await monta()
    expect(valore(wrapper, 'Nascita')).toContain('minorenne nel 2026')
  })
})

describe('SocioDetailView: anno di iscrizione', () => {
  it("e' il primo tra l'anno dichiarato e il primo pagamento", async () => {
    // Dato incoerente: dichiarato 2021, ma ha pagato dal 2019
    socio = {
      id: 1,
      cognome: 'Gamma',
      nome: 'Adulto',
      data_nascita: '1980-01-01',
      data_prima_iscrizione: 2021,
    }
    pagamenti = [{ id_tesseramento: 'a', id_socio: 1, anno: 2019, quota_pagata: 10 }]
    expect(valore(await monta(), 'Anno di iscrizione')).toBe('2019')
  })
})

describe("SocioDetailView: righe nome-valore e numeri all'italiana (bozza 1B)", () => {
  beforeEach(() => {
    socio = {
      id: 1,
      cognome: 'Gialli',
      nome: 'Anna',
      data_nascita: '1975-09-01',
      luogo_nascita: 'Gubbio',
      gruppo_appartenenza: '',
      data_prima_iscrizione: 2022,
    }
    pagamenti = [
      {
        id_tesseramento: 'p1',
        id_socio: 1,
        anno: 2024,
        quota_pagata: 10,
        data_pagamento: '2024-01-18',
        numero_ricevuta: 381,
        numero_blocchetto: 304,
      },
    ]
  })

  it('anagrafica in righe, senza manicchia si legge "Senza manicchia"', async () => {
    const wrapper = await monta()
    expect(valore(wrapper, 'Nascita')).toBe('01/09/1975, Gubbio · 51 anni')
    expect(valore(wrapper, 'Manicchia')).toBe('Senza manicchia')
    expect(valore(wrapper, 'Note')).toBe('Nessuna')
  })

  it('il pagamento mostra data, importo e ricevuta come si scrivono in italiano', async () => {
    const wrapper = await monta()
    const riga = wrapper.findAll('tbody tr').find((r) => r.get('th').text() === '2024')
    expect(riga.text()).toContain('18/01/2024')
    expect(riga.text()).toContain('€ 10,00')
    expect(riga.text()).toContain('381, blocchetto 304')
  })

  it('il riepilogo e la tabella dicono le stesse parole per la quota', async () => {
    const wrapper = await monta()
    expect(wrapper.get('.riepilogo').text()).toContain('Quota 2026')
    expect(wrapper.get('.riepilogo').text()).toContain('Da pagare')
    expect(wrapper.get('.riepilogo').text()).toContain('2025, 2026')
  })

  it('eliminare un pagamento passa da deleteTesseramento, che lo registra', async () => {
    const wrapper = await monta()
    await wrapper.get('[aria-label="Elimina il pagamento del 2024"]').trigger('click')
    await flushPromises()
    expect(eliminati).toEqual(['p1'])
  })
})

describe('SocioDetailView: Modifica apre il modulo del Nuovo socio (bozza 3A)', () => {
  beforeEach(() => {
    socio = {
      id: 7,
      cognome: 'Verdi',
      nome: 'Giulia',
      data_nascita: '1992-03-04',
      luogo_nascita: 'Gubbio',
      gruppo_appartenenza: 'PADULE',
      data_prima_iscrizione: 2020,
      note: '',
    }
  })

  it('salva con updateSocio, che registra la modifica, e torna alle righe', async () => {
    const wrapper = await monta()
    await bottone(wrapper, 'Modifica').trigger('click')
    await flushPromises()
    await wrapper.get('#scheda-cognome').setValue('Verdini')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(salvati).toHaveLength(1)
    const [id, dati] = salvati[0]
    expect(id).toBe(7)
    expect(dati).toMatchObject({
      cognome: 'Verdini',
      nome: 'Giulia',
      data_nascita: '1992-03-04',
      luogo_nascita: 'Gubbio',
      gruppo_appartenenza: 'PADULE',
      data_prima_iscrizione: 2020,
    })
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.get('h1').text()).toBe('Verdini Giulia')
  })

  it("salva anche senza luogo di nascita, che in modifica e' facoltativo", async () => {
    const wrapper = await monta()
    await bottone(wrapper, 'Modifica').trigger('click')
    await flushPromises()
    expect(wrapper.get('label[for="scheda-luogo_nascita"]').text()).toContain('facoltativo')
    await wrapper.get('#scheda-luogo_nascita').setValue('')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(salvati).toHaveLength(1)
    expect(salvati[0][1].luogo_nascita).toBe('')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('con un campo obbligatorio vuoto non salva e dice cosa manca', async () => {
    const wrapper = await monta()
    await bottone(wrapper, 'Modifica').trigger('click')
    await flushPromises()
    await wrapper.get('#scheda-nome').setValue('')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(salvati).toEqual([])
    expect(wrapper.text()).toContain('Scrivi il nome')
  })

  it("Annulla rimette tutto com'era senza salvare", async () => {
    const wrapper = await monta()
    await bottone(wrapper, 'Modifica').trigger('click')
    await flushPromises()
    await wrapper.get('#scheda-cognome').setValue('Sbagliato')
    await bottone(wrapper, 'Annulla').trigger('click')
    await flushPromises()

    expect(salvati).toEqual([])
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.get('h1').text()).toBe('Verdi Giulia')
    // il fuoco torna su Modifica, non si perde in fondo alla pagina
    expect(document.activeElement.textContent.trim()).toBe('Modifica')
  })

  it('un anno di prima iscrizione cancellato si cancella anche in archivio', async () => {
    const wrapper = await monta()
    await bottone(wrapper, 'Modifica').trigger('click')
    await flushPromises()
    await wrapper.get('#scheda-data_prima_iscrizione').setValue('')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(salvati[0][1].data_prima_iscrizione).toBeNull()
  })
})

describe('SocioDetailView: Anni precedenti', () => {
  const pagamento = (id, anno) => ({ id_tesseramento: id, anno, quota_pagata: 10 })

  it("chiude gli anni prima dell'ultimo pagamento in una riga che si apre, senza rosso", async () => {
    socio = {
      id: 1,
      cognome: 'Gialli',
      nome: 'Prova',
      data_nascita: '1970-01-01',
      data_prima_iscrizione: 2010,
    }
    pagamenti = [pagamento(1, 2015), pagamento(2, 2024)]
    const wrapper = await monta()
    const anni = () => wrapper.findAll('.pagamenti tbody th').map((th) => th.text())
    expect(anni()).toEqual(['2026', '2025', '2024', '2010–2023'])
    const gruppo = wrapper.get('.pagamenti__gruppo')
    expect(gruppo.text()).toContain(
      'Anni precedenti: 13 anni senza pagamento, 1 pagato: non sono arretrati',
    )
    // Rossi solo gli arretrati veri
    expect(wrapper.findAll('.pagamenti .tono--errore')).toHaveLength(2)

    const mostra = gruppo.get('button')
    expect(mostra.attributes('aria-expanded')).toBe('false')
    await mostra.trigger('click')
    expect(mostra.attributes('aria-expanded')).toBe('true')
    expect(anni()).toHaveLength(4 + 14)
    expect(wrapper.findAll('.pagamenti .tono--errore')).toHaveLength(2)
    const riga2016 = wrapper
      .findAll('.pagamenti tbody tr')
      .find((tr) => tr.find('th').text() === '2016')
    expect(riga2016.text()).toContain('Non pagata')
    expect(riga2016.text()).toContain('Registra 2016')
  })

  it('chi ha sempre pagato vede tutti gli anni, senza gruppo', async () => {
    socio = {
      id: 1,
      cognome: 'Verdi',
      nome: 'Prova',
      data_nascita: '1970-01-01',
      data_prima_iscrizione: 2023,
    }
    pagamenti = [pagamento(1, 2023), pagamento(2, 2024), pagamento(3, 2025)]
    const wrapper = await monta()
    expect(wrapper.find('.pagamenti__gruppo').exists()).toBe(false)
    expect(wrapper.findAll('.pagamenti tbody th').map((th) => th.text())).toEqual([
      '2026',
      '2025',
      '2024',
      '2023',
    ])
  })
})
