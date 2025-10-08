import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SocioCard from '../SocioCard.vue'

describe('SocioCard', () => {
  it('renders socio information correctly', () => {
    const socio = {
      id: 1,
      cognome: 'Rossi',
      nome: 'Mario',
      data_nascita: '1980-05-15',
      luogo_nascita: 'Gubbio',
      gruppo_appartenenza: 'INTERNA',
    }

    const wrapper = mount(SocioCard, {
      props: { socio },
    })

    expect(wrapper.text()).toContain('Rossi Mario')
    expect(wrapper.text()).toContain('Nato/a il: 1980-05-15 a Gubbio')
    expect(wrapper.text()).toContain('Gruppo: INTERNA')
  })

  it('has a details button', () => {
    const socio = {
      id: 1,
      cognome: 'Rossi',
      nome: 'Mario',
    }

    const wrapper = mount(SocioCard, {
      props: { socio },
    })

    const button = wrapper.find('a')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Vedi Dettagli')
  })
})
