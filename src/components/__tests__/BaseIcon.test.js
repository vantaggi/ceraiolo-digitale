import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseIcon from '../common/BaseIcon.vue'

describe('BaseIcon Component', () => {
  it('esegue il render dell\'SVG con le proprietà di default', () => {
    const wrapper = mount(BaseIcon, {
      props: { name: 'home' },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.classes()).toContain('base-icon')
    expect(wrapper.classes()).toContain('base-icon--home')
    expect(wrapper.attributes('width')).toBe('20px')
    expect(wrapper.attributes('height')).toBe('20px')
    expect(wrapper.attributes('stroke')).toBe('currentColor')
    expect(wrapper.attributes('fill')).toBe('none')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBe('presentation')
  })

  it('rispetta la dimensione custom numerica e stringa con unità', async () => {
    const wrapperNum = mount(BaseIcon, {
      props: { name: 'search', size: 24 },
    })
    expect(wrapperNum.attributes('width')).toBe('24px')
    expect(wrapperNum.attributes('height')).toBe('24px')

    const wrapperRem = mount(BaseIcon, {
      props: { name: 'search', size: '1.5rem' },
    })
    expect(wrapperRem.attributes('width')).toBe('1.5rem')
    expect(wrapperRem.attributes('height')).toBe('1.5rem')
  })

  it('risolve correttamente i token cromatici della palette Santantoniari', () => {
    // Ceraiolo / Accent
    const wrapperAccent = mount(BaseIcon, {
      props: { name: 'zap', color: 'accent' },
    })
    expect(wrapperAccent.attributes('stroke')).toBe('var(--color-accent, #b71c1c)')

    const wrapperCeraiolo = mount(BaseIcon, {
      props: { name: 'zap', color: 'ceraiolo' },
    })
    expect(wrapperCeraiolo.attributes('stroke')).toBe('var(--color-accent, #b71c1c)')

    // Oro caldo
    const wrapperGold = mount(BaseIcon, {
      props: { name: 'coins', color: 'gold' },
    })
    expect(wrapperGold.attributes('stroke')).toBe('var(--color-gold, #c59b27)')

    // Bianco
    const wrapperWhite = mount(BaseIcon, {
      props: { name: 'plus', color: 'white' },
    })
    expect(wrapperWhite.attributes('stroke')).toBe('#ffffff')

    // WCAG 2.2 Warning & Info
    const wrapperWarning = mount(BaseIcon, {
      props: { name: 'alert-triangle', color: 'warning' },
    })
    expect(wrapperWarning.attributes('stroke')).toBe('var(--color-warning, #c2410c)')

    const wrapperInfo = mount(BaseIcon, {
      props: { name: 'info', color: 'info' },
    })
    expect(wrapperInfo.attributes('stroke')).toBe('var(--color-info, #0369a1)')

    // Colore CSS personalizzato esplicito
    const wrapperCustom = mount(BaseIcon, {
      props: { name: 'check', color: '#16a34a' },
    })
    expect(wrapperCustom.attributes('stroke')).toBe('#16a34a')
  })

  it('risolve gli alias di navigazione e azioni (italiano e sinonimi)', () => {
    // Navigation aliases
    const w1 = mount(BaseIcon, { props: { name: 'ricerca' } })
    expect(w1.classes()).toContain('base-icon--home')

    const w2 = mount(BaseIcon, { props: { name: 'seriale' } })
    expect(w2.classes()).toContain('base-icon--refresh-cw')

    const w3 = mount(BaseIcon, { props: { name: 'blocchetti' } })
    expect(w3.classes()).toContain('base-icon--receipt')

    const w4 = mount(BaseIcon, { props: { name: 'chart' } })
    expect(w4.classes()).toContain('base-icon--bar-chart')

    const w5 = mount(BaseIcon, { props: { name: 'impostazioni' } })
    expect(w5.classes()).toContain('base-icon--settings')

    // Action aliases
    const w6 = mount(BaseIcon, { props: { name: 'elimina' } })
    expect(w6.classes()).toContain('base-icon--trash-2')

    const w7 = mount(BaseIcon, { props: { name: 'cassa' } })
    expect(w7.classes()).toContain('base-icon--coins')

    const w8 = mount(BaseIcon, { props: { name: 'tessera' } })
    expect(w8.classes()).toContain('base-icon--ticket')

    const w9 = mount(BaseIcon, { props: { name: 'indietro' } })
    expect(w9.classes()).toContain('base-icon--chevron-left')
  })

  it('gestisce l\'accessibilità WCAG 2.2 quando è fornito title', () => {
    const wrapperWithTitle = mount(BaseIcon, {
      props: { name: 'printer', title: 'Stampa ricevuta' },
    })

    expect(wrapperWithTitle.attributes('role')).toBe('img')
    expect(wrapperWithTitle.attributes('aria-label')).toBe('Stampa ricevuta')
    expect(wrapperWithTitle.attributes('aria-hidden')).toBeUndefined()
    expect(wrapperWithTitle.find('title').exists()).toBe(true)
    expect(wrapperWithTitle.find('title').text()).toBe('Stampa ricevuta')
  })

  it('attiva la classe di rotazione continua con prop spin', () => {
    const wrapperSpin = mount(BaseIcon, {
      props: { name: 'loader', spin: true },
    })

    expect(wrapperSpin.classes()).toContain('base-icon--spin')

    const wrapperNoSpin = mount(BaseIcon, {
      props: { name: 'loader', spin: false },
    })

    expect(wrapperNoSpin.classes()).not.toContain('base-icon--spin')
  })

  it('gestisce graziosamente un nome icona non presente nel registro', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const wrapper = mount(BaseIcon, {
      props: { name: 'icona-inesistente-xyz' },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  it('garantisce che tutti i 5 simboli principali di navigazione siano definiti', () => {
    const navIcons = ['home', 'refresh-cw', 'receipt', 'bar-chart', 'settings']
    for (const name of navIcons) {
      const wrapper = mount(BaseIcon, { props: { name } })
      expect(wrapper.html()).not.toContain('stroke-dasharray="2 2"') // Non deve essere il fallback
    }
  })
})
