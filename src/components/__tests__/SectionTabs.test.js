import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SectionTabs from '../base/SectionTabs.vue'

const RouterLink = { props: ['to'], template: '<a :href="to"><slot /></a>' }

describe('SectionTabs', () => {
  it('mostra una scheda per voce, in una nav con nome', () => {
    const wrapper = mount(SectionTabs, {
      props: {
        label: 'Schede di Incassi',
        tabs: [
          { to: '/incassi/ricevute', label: 'Registra ricevute' },
          { to: '/incassi/blocchetti', label: 'Blocchetti' },
        ],
      },
      global: { stubs: { RouterLink, AppIcon: true } },
    })
    expect(wrapper.get('nav').attributes('aria-label')).toBe('Schede di Incassi')
    expect(wrapper.findAll('a').map((a) => [a.attributes('href'), a.text()])).toEqual([
      ['/incassi/ricevute', 'Registra ricevute'],
      ['/incassi/blocchetti', 'Blocchetti'],
    ])
  })
})
