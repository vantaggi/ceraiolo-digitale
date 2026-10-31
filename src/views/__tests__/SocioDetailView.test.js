import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Solo dati inventati. Oggi e' il 31 ottobre 2026.
let socio
let pagamenti = []
vi.mock('@/services/db', () => ({
  db: {},
  getSocioById: vi.fn(async () => socio),
  getTesseramentiBySocioId: vi.fn(async () => pagamenti),
  addTesseramento: vi.fn(),
  deleteSocio: vi.fn(),
  updateTesseramentoQuota: vi.fn(),
}))
vi.mock('@/services/export', () => ({ generateSingleCardPDF: vi.fn() }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '1' } }),
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('vue-toastification', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))

const { default: SocioDetailView } = await import('../SocioDetailView.vue')

const monta = async () => {
  const wrapper = mount(SocioDetailView, {
    global: {
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
        AppIcon: true,
        AddPaymentModal: true,
        ConfirmDeleteModal: true,
      },
    },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-31T10:00:00'))
})

afterEach(() => {
  vi.useRealTimers()
  pagamenti = []
})

describe('SocioDetailView: minorenne dal solo anno di nascita', () => {
  it('chi e nato a dicembre 2008 non e segnato minorenne nel 2026', async () => {
    socio = { id: 1, cognome: 'Alfa', nome: 'Dicembre', data_nascita: '2008-12-15' }
    const wrapper = await monta()
    expect(wrapper.get('.age-badge').classes()).not.toContain('minor')
  })

  it('chi e nato nel 2009 e segnato minorenne nel 2026', async () => {
    socio = { id: 1, cognome: 'Beta', nome: 'Gennaio', data_nascita: '2009-01-01' }
    const wrapper = await monta()
    expect(wrapper.get('.age-badge').classes()).toContain('minor')
  })
})

describe('SocioDetailView: anno di iscrizione', () => {
  const primaIscrizione = (wrapper) =>
    wrapper
      .findAll('.info-item')
      .find((el) => el.text().startsWith('Prima Iscrizione'))
      .get('.value')
      .text()

  it("e' il primo tra l'anno dichiarato e il primo pagamento", async () => {
    // Dato incoerente: dichiarato 2021, ma ha pagato dal 2019
    socio = {
      id: 1,
      cognome: 'Gamma',
      nome: 'Adulto',
      data_nascita: '1980-01-01',
      data_prima_iscrizione: 2021,
    }
    pagamenti = [{ id_tesseramento: 'a', id_socio: 1, anno: 2019, quota_pagata: 10 }]
    expect(primaIscrizione(await monta())).toBe('2019')
  })
})
