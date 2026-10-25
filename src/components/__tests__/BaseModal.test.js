import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import BaseModal from '../base/BaseModal.vue'

const montaConBottone = () => {
  const trigger = document.createElement('button')
  trigger.textContent = 'Apri'
  document.body.appendChild(trigger)
  trigger.focus()
  const wrapper = mount(BaseModal, {
    props: { open: false, title: 'Eliminare il socio?' },
    slots: { default: '<p>Testo</p>', footer: '<button class="ok">Conferma</button>' },
    attachTo: document.body,
  })
  return { trigger, wrapper }
}

const dialogo = () => document.querySelector('[role="dialog"]')

afterEach(() => {
  document.body.innerHTML = ''
})

describe('BaseModal', () => {
  it("e' un dialogo modale con il titolo come nome accessibile", async () => {
    const { wrapper } = montaConBottone()
    await wrapper.setProps({ open: true })
    const d = dialogo()
    expect(d.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(d.getAttribute('aria-labelledby')).textContent).toBe(
      'Eliminare il socio?',
    )
  })

  it("all'apertura il fuoco entra nel contenuto, non sulla X di chiusura", async () => {
    const { wrapper } = montaConBottone()
    await wrapper.setProps({ open: true })
    await nextTick()
    expect(document.activeElement.classList.contains('ok')).toBe(true)
  })

  it('alla chiusura il fuoco torna a chi ha aperto la modale', async () => {
    const { trigger, wrapper } = montaConBottone()
    await wrapper.setProps({ open: true })
    await nextTick()
    await wrapper.setProps({ open: false })
    expect(document.activeElement).toBe(trigger)
  })

  it("Esc chiude, ma non durante un'operazione in corso", async () => {
    const { wrapper } = montaConBottone()
    await wrapper.setProps({ open: true })
    dialogo().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('close')).toHaveLength(1)

    await wrapper.setProps({ busy: true })
    dialogo().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it("Tab dall'ultimo elemento torna al primo", async () => {
    const { wrapper } = montaConBottone()
    await wrapper.setProps({ open: true })
    await nextTick()
    const ultimo = document.querySelector('.ok')
    ultimo.focus()
    dialogo().dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(document.activeElement.getAttribute('aria-label')).toBe('Chiudi')
  })
})
