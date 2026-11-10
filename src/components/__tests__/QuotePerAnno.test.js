import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { quotePredefinite } from '@/utils/payment'

// Solo valori inventati: la tabella salvata sta in una variabile finta.
let salvata = null
vi.mock('@/services/db', () => ({
  getQuotePerAnno: vi.fn(async () =>
    structuredClone(salvata ?? quotePredefinite({ quotaOrdinaria: 10, quotaNuovi: 25 })),
  ),
  saveQuotePerAnno: vi.fn(async (t) => {
    salvata = structuredClone(t)
  }),
}))
const toast = { success: vi.fn(), error: vi.fn() }
vi.mock('vue-toastification', () => ({ useToast: () => toast }))
const conferma = vi.fn(async () => true)
vi.mock('@/composables/useDialog', () => ({ askConfirm: (o) => conferma(o) }))

const { default: QuotePerAnno } = await import('../QuotePerAnno.vue')
const { saveQuotePerAnno } = await import('@/services/db')

const monta = async () => {
  const wrapper = mount(QuotePerAnno, {
    attachTo: document.body,
    global: { stubs: { AppIcon: true } },
  })
  await flushPromises()
  return wrapper
}
const righe = (w) => w.findAll('.list-rows__row').map((r) => r.text())
const finestra = () => document.querySelector('[role="dialog"]')
const scrivi = (el, valore) => {
  el.value = valore
  el.dispatchEvent(new Event('input'))
}
const invia = async () => {
  finestra().querySelector('form').dispatchEvent(new Event('submit'))
  await flushPromises()
}
const bottone = (testo) =>
  [...document.querySelectorAll('button')].find((b) => b.textContent.includes(testo))

beforeEach(() => {
  salvata = null
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

describe('Impostazioni › Quote', () => {
  it('una riga per periodo, il piu recente in alto, con le fasce riassunte', async () => {
    const w = await monta()
    expect(righe(w)).toEqual([
      'Dal 20270-17 offerta · 18-23 15 € · da 24 15 € + 15 € iscrizione',
      'Fino al 20260-17 10 € · da 18 10 € + 15 € iscrizione',
    ])
    w.unmount()
  })

  it('cambiare un importo salva la tabella e la riga mostra il valore nuovo', async () => {
    const w = await monta()
    await w.findAll('.list-rows__row')[0].trigger('click')
    expect(finestra().querySelector('h2').textContent).toBe('Quote: dal 2027')
    const campi = finestra().querySelectorAll('tbody input')
    // prima fascia: quota, iscrizione; fascia 18: da eta', quota, iscrizione
    scrivi(campi[3], '17,5')
    await invia()
    expect(saveQuotePerAnno).toHaveBeenCalledTimes(1)
    expect(salvata[1].fasce[1]).toEqual({ daEta: 18, quota: 17.5, iscrizione: 0 })
    expect(finestra()).toBeNull()
    expect(righe(w)[0]).toContain('18-23 17,5 €')
    w.unmount()
  })

  it('aggiungere un periodo copia le fasce del piu recente da un anno nuovo', async () => {
    const w = await monta()
    await bottone('Aggiungi quote da un anno').click()
    await flushPromises()
    const anno = finestra().querySelector('#quote-da-anno')
    scrivi(anno, '2030')
    await invia()
    expect(salvata.map((p) => p.daAnno)).toEqual([null, 2027, 2030])
    expect(salvata[2].fasce).toEqual(salvata[1].fasce)
    expect(righe(w)[0].startsWith('Dal 2030')).toBe(true)
    expect(righe(w)[1].startsWith('Dal 2027')).toBe(true)
    w.unmount()
  })

  it('un errore non salva e la finestra dice perche', async () => {
    const w = await monta()
    await bottone('Aggiungi quote da un anno').click()
    await flushPromises()
    scrivi(finestra().querySelector('#quote-da-anno'), '2027')
    await invia()
    expect(saveQuotePerAnno).not.toHaveBeenCalled()
    expect(finestra().querySelector('[role="alert"]').textContent).toBe(
      'Due periodi partono dallo stesso anno.',
    )
    w.unmount()
  })

  it('togliere un periodo chiede conferma nominando anno e conseguenza', async () => {
    const w = await monta()
    await w.findAll('.list-rows__row')[0].trigger('click')
    await bottone('Togli il periodo').click()
    await flushPromises()
    expect(conferma.mock.calls[0][0].title).toBe('Togliere le quote dal 2027?')
    expect(salvata.map((p) => p.daAnno)).toEqual([null])
    expect(righe(w)).toEqual(['Tutti gli anni0-17 10 € · da 18 10 € + 15 € iscrizione'])
    w.unmount()
  })

  it('il primo periodo non ha anno di partenza e non si toglie', async () => {
    const w = await monta()
    await w.findAll('.list-rows__row')[1].trigger('click')
    expect(finestra().querySelector('#quote-da-anno')).toBeNull()
    expect(bottone('Togli il periodo')).toBeUndefined()
    w.unmount()
  })
})
