import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

vi.mock('@/services/db', () => ({
  getSocioById: vi.fn(async () => ({
    id: 's1',
    data_nascita: '1980-05-01',
    data_prima_iscrizione: 2010,
  })),
  getTesseramentiBySocioId: vi.fn(async () => [{ anno: 2024 }, { anno: 2025 }]),
  getSetting: vi.fn(async (_chiave, predefinito) => predefinito),
  calculateAgeInYear: (nascita, anno) => anno - new Date(nascita).getFullYear(),
  isExemptFromPayment: () => false,
}))

import AddPaymentModal from '../AddPaymentModal.vue'

const dialogo = () => document.querySelector('[role="dialog"]')

const apri = async () => {
  const wrapper = mount(AddPaymentModal, {
    props: {
      show: false,
      socioId: 's1',
      yearsToPay: [],
      annoRiferimento: 2026,
      numeroBlocchetto: 3,
      numeroRicevuta: 27,
    },
    attachTo: document.body,
  })
  await wrapper.setProps({ show: true })
  await flushPromises()
  await nextTick()
  return wrapper
}

afterEach(() => {
  document.body.innerHTML = ''
})

// La modale del pagamento usa BaseModal (UI Constitution, Overlays): dialogo con nome,
// fuoco su Salva, Esc chiude, Salva manda i dati al genitore.
describe('AddPaymentModal', () => {
  it("e' un dialogo modale chiamato Registra pagamento", async () => {
    await apri()
    const d = dialogo()
    expect(d).not.toBeNull()
    expect(d.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(d.getAttribute('aria-labelledby')).textContent).toBe(
      'Registra pagamento',
    )
  })

  it("all'apertura il fuoco e' su Salva, per confermare con Invio", async () => {
    await apri()
    expect(document.activeElement.textContent).toContain('Salva pagamenti (1 anni)')
  })

  it('Esc chiude', async () => {
    const wrapper = await apri()
    dialogo().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('Salva manda blocchetto, ricevuta e anni scelti', async () => {
    const wrapper = await apri()
    document
      .querySelector('#modulo-pagamento')
      .dispatchEvent(new Event('submit', { cancelable: true }))
    const [[dati]] = wrapper.emitted('payments-saved')
    expect(dati.years).toEqual([2026])
    expect(dati.details.numero_blocchetto).toBe(3)
    expect(dati.details.numero_ricevuta).toBe(27)
  })
})
