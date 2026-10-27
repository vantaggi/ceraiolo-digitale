import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import PagamentiView from '../PagamentiView.vue'

// Pagamenti inventati: 250 quote dell'anno in corso (oltre la prima pagina) e una dell'anno prima
const anno = new Date().getFullYear()
const pagamenti = [
  ...Array.from({ length: 250 }, (_, i) => ({
    id_tesseramento: `t${i}`,
    id_socio: i + 1,
    anno,
    data_pagamento: `${anno}-04-10`,
    numero_blocchetto: Math.floor(i / 10) + 1,
    numero_ricevuta: i + 1,
    quota_pagata: 10,
  })),
  {
    id_tesseramento: 'v',
    id_socio: 1,
    anno: anno - 1,
    data_pagamento: `${anno - 1}-04-11`,
    numero_blocchetto: 1,
    numero_ricevuta: 1,
    quota_pagata: 10,
  },
]
vi.mock('@/services/db', () => ({
  db: { soci: { toArray: async () => [{ id: 1, cognome: 'Prova', nome: 'Uno' }] } },
  exportAllTesseramenti: async () => pagamenti,
}))

const monta = async () => {
  const wrapper = mount(PagamentiView, {
    global: {
      stubs: { RouterLink: { template: '<a><slot /></a>' }, AppIcon: true, SectionTabs: true },
    },
  })
  await flushPromises()
  return wrapper
}
const totale = (wrapper, nome) => wrapper.get(`[data-totale="${nome}"]`).text()

describe('PagamentiView', () => {
  it("parte dall'anno in corso, con i totali di tutto l'anno e 200 righe per volta", async () => {
    const wrapper = await monta()
    expect(wrapper.get('#pagamenti-anno').element.value).toBe(String(anno))
    expect(totale(wrapper, 'pagamenti')).toBe('250')
    expect(totale(wrapper, 'incassato')).toBe('€ 2500.00')
    expect(wrapper.findAll('tbody tr')).toHaveLength(200)

    await wrapper
      .findAll('button')
      .find((b) => b.text().startsWith('Mostra altri'))
      .trigger('click')
    expect(wrapper.findAll('tbody tr')).toHaveLength(250)
  })

  it("cambiando anno o filtro i totali seguono l'elenco", async () => {
    const wrapper = await monta()
    await wrapper.get('#pagamenti-anno').setValue(String(anno - 1))
    expect(totale(wrapper, 'pagamenti')).toBe('1')
    expect(wrapper.get('tbody').text()).toContain('Prova Uno')

    await wrapper.get('#pagamenti-anno').setValue('')
    await wrapper.get('#pagamenti-blocchetto').setValue('1')
    expect(totale(wrapper, 'pagamenti')).toBe('11')
    expect(totale(wrapper, 'soci')).toBe('10')
  })
})
