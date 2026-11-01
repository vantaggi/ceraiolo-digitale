import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ElencoSoci from '../ElencoSoci.vue'

// Solo dati inventati
const SOCI = [
  {
    id: 1,
    cognome: 'Prova',
    nome: 'Pagata',
    data_nascita: '1980-01-01',
    data_prima_iscrizione: 2020,
  },
  {
    id: 2,
    cognome: 'Prova',
    nome: 'Scoperta',
    data_nascita: '1980-01-01',
    data_prima_iscrizione: 2020,
  },
  {
    id: 3,
    cognome: 'Prova',
    nome: 'Minorenne',
    data_nascita: '2015-01-01',
    data_prima_iscrizione: 2024,
  },
]
const ANNI = new Map([
  [1, [2025, 2026]],
  [2, [2025]],
  [3, []],
])

const monta = () =>
  mount(ElencoSoci, {
    props: { soci: SOCI, anniPagati: ANNI, anno: 2026, titolo: 'Soci trovati' },
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, AppIcon: true } },
  })

describe('ElencoSoci: quota con icona e parola', () => {
  it('lo stato si legge a parole, senza la lettera nel quadratino colorato', () => {
    const stati = monta()
      .findAll('tbody tr')
      .map((r) => r.get('.stato').text())
    expect(stati).toEqual(['Pagata', 'Da pagare', 'Esente'])
  })

  it('pagata e da pagare hanno tono e icona, esente resta neutro', () => {
    const righe = monta().findAll('tbody tr')
    expect(righe[0].get('.stato').classes()).toContain('stato--ok')
    expect(righe[1].get('.stato').classes()).toContain('stato--errore')
    const icona = (r) => r.element.querySelector('.stato app-icon-stub')?.getAttribute('name')
    expect(righe.map(icona)).toEqual(['ok', 'errore', undefined])
  })

  it('Paga compare solo per chi deve la quota', () => {
    const righe = monta().findAll('tbody tr')
    expect(righe.map((r) => r.find('.link-btn').exists())).toEqual([false, true, false])
  })
})
