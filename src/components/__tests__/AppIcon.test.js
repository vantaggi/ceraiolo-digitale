import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppIcon from '../base/AppIcon.vue'

describe('AppIcon', () => {
  it('senza label e decorativa: nascosta ai lettori di schermo', () => {
    const svg = mount(AppIcon, { props: { name: 'elimina' } }).find('svg')
    expect(svg.classes()).toContain('lucide-trash-2')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('role')).toBeUndefined()
  })

  it('con label e un\'immagine con nome accessibile', () => {
    const svg = mount(AppIcon, { props: { name: 'elimina', label: 'Elimina socio' } }).find('svg')
    expect(svg.attributes('aria-hidden')).toBeUndefined()
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('Elimina socio')
  })
})
