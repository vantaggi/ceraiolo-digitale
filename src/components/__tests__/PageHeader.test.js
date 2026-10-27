import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from '../base/PageHeader.vue'

const RouterLink = { props: ['to'], template: '<a :href="to"><slot /></a>' }
const monta = (options) => mount(PageHeader, { global: { stubs: { RouterLink } }, ...options })

describe('PageHeader', () => {
  it('mostra il titolo come unico h1, con il sottotitolo', () => {
    const wrapper = monta({ props: { title: 'Nuovo Socio', subtitle: 'Dati anagrafici' } })
    expect(wrapper.findAll('h1').map((h) => h.text())).toEqual(['Nuovo Socio'])
    expect(wrapper.text()).toContain('Dati anagrafici')
  })

  it('il link indietro compare solo se serve', () => {
    expect(monta({ props: { title: 'Soci' } }).find('a').exists()).toBe(false)
    const conIndietro = monta({ props: { title: 'Rossi Mario', backTo: '/', backLabel: 'Lista' } })
    expect(conIndietro.get('a').attributes('href')).toBe('/')
    expect(conIndietro.get('a').text()).toBe('Lista')
  })

  it("le azioni della pagina stanno nell'intestazione", () => {
    const wrapper = monta({
      props: { title: 'Blocchetti' },
      slots: { actions: '<button>Registra Nuovo Blocchetto</button>' },
    })
    expect(wrapper.get('.page-header__actions button').text()).toBe('Registra Nuovo Blocchetto')
  })
})
