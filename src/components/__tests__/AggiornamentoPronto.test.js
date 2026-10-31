import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AggiornamentoPronto from '../AggiornamentoPronto.vue'
import { impostaAggiornamento, segnalaVersionePronta } from '@/composables/useAggiornamento'

describe('AggiornamentoPronto (nuova versione)', () => {
  it("la regione di stato c'e' sempre, il pulsante solo quando la versione nuova e' pronta; Ricarica attiva la versione", async () => {
    const aggiorna = vi.fn()
    impostaAggiornamento(aggiorna)
    const wrapper = mount(AggiornamentoPronto, { global: { stubs: { AppIcon: true } } })

    expect(wrapper.get('[role="status"]').exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(false)

    segnalaVersionePronta()
    await nextTick()
    const pulsante = wrapper.get('[role="status"] button')
    expect(pulsante.text()).toBe('Nuova versione pronta · Ricarica')
    expect(aggiorna).not.toHaveBeenCalled()

    await pulsante.trigger('click')
    expect(aggiorna).toHaveBeenCalledWith(true)
  })
})
