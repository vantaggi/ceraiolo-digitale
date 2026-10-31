import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
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

  // jsdom non calcola il layout: si controlla lo stile. Con overflow-x auto il browser
  // rende auto anche overflow-y, e il margine negativo delle schede sporgeva di 1px:
  // su Windows compariva una barra di scorrimento verticale accanto alle schede.
  it('le schede non possono scorrere in verticale', () => {
    const sorgente = readFileSync(path.resolve(__dirname, '../base/SectionTabs.vue'), 'utf8')
    const regola = (selettore) =>
      sorgente.match(new RegExp(`\\${selettore} \\{([^}]*)\\}`))?.[1] ?? ''
    expect(regola('.section-tabs')).toMatch(/overflow-y:\s*hidden/)
    expect(regola('.section-tabs__tab')).not.toMatch(/margin-bottom:\s*-/)
  })
})
