import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import BlocchettiView from '../BlocchettiView.vue'

// Dati inventati: pagamenti nei blocchetti 1, 2 e 3 (storico), e due blocchetti
// registrati a mano: il 2 ancora fuori, il 4 gia' restituito.
vi.mock('@/services/db', () => ({
  db: { soci: { toArray: async () => [] } },
  getAllBlocchetti: async () => [
    { id: 10, numero_blocchetto: 2, assegnato_a: 'Zona A', data_assegnazione: '2026-01-10', data_restituzione: null },
    { id: 11, numero_blocchetto: 4, assegnato_a: 'Zona B', data_assegnazione: '2026-01-10', data_restituzione: '2026-03-01' },
  ],
  exportAllTesseramenti: async () => [
    { id_socio: 1, anno: 2026, numero_blocchetto: 1, numero_ricevuta: 1, quota_pagata: 10 },
    { id_socio: 2, anno: 2026, numero_blocchetto: 2, numero_ricevuta: 1, quota_pagata: 10 },
    { id_socio: 3, anno: 2026, numero_blocchetto: 3, numero_ricevuta: 1, quota_pagata: 10 },
  ],
  addBlocchetto: async () => {},
  returnBlocchetto: async () => {},
  deleteBlocchetto: async () => {},
}))

vi.mock('vue-toastification', () => ({
  useToast: () => ({ success() {}, error() {}, info() {}, warning() {} }),
}))

describe('BlocchettiView', () => {
  it('mostra anche i blocchetti dello storico, ma non li conta tra i non restituiti', async () => {
    const wrapper = mount(BlocchettiView)
    await flushPromises()

    const righe = wrapper.findAll('tbody > tr')
    const [totale, nonRestituiti] = wrapper.findAll('.stat-value').map((el) => el.text())

    expect(righe).toHaveLength(4)
    expect(totale).toBe('4')
    expect(nonRestituiti).toBe('1')
  })
})
