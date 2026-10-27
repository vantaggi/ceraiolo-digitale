import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import BlocchettiView from '../BlocchettiView.vue'

// Dati inventati: pagamenti nei blocchetti 1, 2 e 3 (storico), e due blocchetti
// registrati a mano: il 2 ancora fuori, il 4 gia' restituito. Blocchetti da 10.
const aggiunti = []
vi.mock('@/services/db', () => ({
  db: { soci: { toArray: async () => [{ id: 1, cognome: 'Prova', nome: 'Uno' }] } },
  getAllBlocchetti: async () => [
    {
      id: 10,
      numero_blocchetto: 2,
      assegnato_a: 'Zona A',
      data_assegnazione: '2026-01-10',
      data_restituzione: null,
    },
    {
      id: 11,
      numero_blocchetto: 4,
      assegnato_a: 'Zona B',
      data_assegnazione: '2026-01-10',
      data_restituzione: '2026-03-01',
    },
  ],
  exportAllTesseramenti: async () => [
    { id_socio: 1, anno: 2026, numero_blocchetto: 1, numero_ricevuta: 1, quota_pagata: 10 },
    { id_socio: 2, anno: 2026, numero_blocchetto: 2, numero_ricevuta: 11, quota_pagata: 10 },
    { id_socio: 2, anno: 2026, numero_blocchetto: 2, numero_ricevuta: 13, quota_pagata: 10 },
    { id_socio: 3, anno: 2026, numero_blocchetto: 3, numero_ricevuta: 21, quota_pagata: 10 },
  ],
  getSetting: async (_chiave, predefinito) => predefinito,
  addBlocchetto: async (dati) => aggiunti.push(dati),
  returnBlocchetto: async () => {},
  deleteBlocchetto: async () => {},
}))

vi.mock('vue-toastification', () => ({
  useToast: () => ({ success() {}, error() {}, info() {}, warning() {} }),
}))

const RouterLink = {
  props: ['to'],
  template: '<a :href="JSON.stringify(to)"><slot /></a>',
}

const monta = async () => {
  const wrapper = mount(BlocchettiView, {
    global: { stubs: { RouterLink, AppIcon: true, SectionTabs: true } },
  })
  await flushPromises()
  return wrapper
}

const contatore = (wrapper, nome) => wrapper.get(`[data-contatore="${nome}"]`).text()

describe('BlocchettiView', () => {
  it('contatori e tabella contano gli stessi blocchetti; lo storico non e\' "in giro"', async () => {
    const wrapper = await monta()
    const righe = wrapper.findAll('tbody > tr')

    expect(righe.map((r) => r.get('th').text().split(/\s/)[0])).toEqual(['1', '2', '3', '4'])
    expect(contatore(wrapper, 'totale')).toBe(String(righe.length))
    expect(contatore(wrapper, 'in-giro')).toBe('1')
    expect(contatore(wrapper, 'saltate')).toBe('1')
  })

  it('per ogni blocchetto dice ricevute, saltate e da dove riprendere a registrare', async () => {
    const wrapper = await monta()
    const riga2 = wrapper.findAll('tbody > tr')[1]

    expect(riga2.text()).toContain('2 su 10')
    expect(riga2.text()).toContain('Saltate: 12')
    expect(riga2.text()).toContain('Non registrate: 14–20')
    expect(JSON.parse(riga2.get('a').attributes('href'))).toEqual({
      name: 'batch-entry',
      query: { blocchetto: 2 },
    })
  })

  it('aperto, un blocchetto mostra le ricevute con il link al socio e quelle saltate', async () => {
    const wrapper = await monta()
    await wrapper.findAll('tbody > tr')[0].get('[aria-expanded]').trigger('click')
    const dettaglio = wrapper.get('#ricevute-blocchetto-1')
    expect(dettaglio.text()).toContain('Prova Uno')

    await wrapper.findAll('tbody > tr')[2].get('[aria-expanded]').trigger('click')
    expect(
      wrapper
        .get('#ricevute-blocchetto-2')
        .findAll('.ricevuta--saltata')
        .map((r) => r.text().replace(/\s+/g, ' ')),
    ).toEqual(['Ricevuta 12 Saltata'])
  })

  it('non assegna due volte lo stesso blocchetto e propone il numero successivo', async () => {
    const wrapper = await monta()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Assegna un blocchetto')
      .trigger('click')
    const numero = wrapper.get('#nuovo-blocchetto-numero')
    expect(numero.element.value).toBe('5')

    await numero.setValue(2)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('#nuovo-blocchetto-errore').text()).toBe(
      'Il blocchetto 2 è già assegnato a Zona A',
    )
    expect(aggiunti).toEqual([])

    await numero.setValue(5)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(aggiunti).toEqual([
      expect.objectContaining({ numero_blocchetto: 5, ricevute_da: 41, ricevute_a: 50 }),
    ])
  })
})
