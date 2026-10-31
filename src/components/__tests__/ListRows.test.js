import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ListRows from '../base/ListRows.vue'

const RouterLink = { props: ['to'], template: '<a :href="to"><slot /></a>' }

const monta = (rows, extra = {}) =>
  mount(ListRows, {
    props: { title: 'Valori proposti', rows, ...extra },
    global: { stubs: { RouterLink, AppIcon: true } },
  })

describe('ListRows', () => {
  it('mostra nome e valore attuale di ogni riga, sotto un titolo di gruppo', () => {
    const wrapper = monta([
      { id: 'a', label: 'Quota ordinaria', value: '€ 10,00' },
      { id: 'b', label: 'Ricevute per blocchetto', value: '10' },
    ])
    expect(wrapper.get('h2').text()).toBe('Valori proposti')
    const righe = wrapper.findAll('button')
    expect(righe.map((r) => r.text())).toEqual([
      'Quota ordinaria€ 10,00',
      'Ricevute per blocchetto10',
    ])
    expect(wrapper.get('section').attributes('aria-labelledby')).toBe(
      wrapper.get('h2').attributes('id'),
    )
  })

  it('premendo una riga nome-valore emette select con la riga', async () => {
    const riga = { id: 'q', label: 'Quota dei nuovi soci', value: '€ 25,00' }
    const wrapper = monta([riga])
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('select')).toEqual([[riga]])
  })

  it('una riga con destinazione e un link, non un bottone', () => {
    const wrapper = monta([{ id: 'm', label: 'Manicchie', to: '/settings/manicchie' }])
    expect(wrapper.findAll('button')).toHaveLength(0)
    expect(wrapper.get('a').attributes('href')).toBe('/settings/manicchie')
  })

  it('una riga disattivata dice perche', () => {
    const wrapper = monta([
      {
        id: 'x',
        label: 'Cartella',
        value: '-',
        disabled: true,
        reason: 'Il browser non lo permette',
      },
    ])
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Il browser non lo permette')
  })

  it("una riga di sola lettura non e' ne' un bottone ne' un link, e porta il tono del valore", () => {
    const wrapper = monta([
      {
        id: 'c',
        label: 'Conservazione',
        value: 'Non protetti',
        help: 'Il browser può cancellarli',
        tone: 'attenzione',
        readonly: true,
      },
    ])
    expect(wrapper.findAll('button')).toHaveLength(0)
    expect(wrapper.findAll('a')).toHaveLength(0)
    expect(wrapper.text()).toContain('ConservazioneIl browser può cancellarliNon protetti')
    expect(wrapper.get('.list-rows__value').classes()).toContain('list-rows__value--attenzione')
  })
})
