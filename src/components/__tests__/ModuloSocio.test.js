import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ModuloSocio from '../ModuloSocio.vue'

const vuoto = () => ({
  cognome: '',
  nome: '',
  data_nascita: '',
  luogo_nascita: '',
  gruppo_appartenenza: '',
  data_prima_iscrizione: '',
  note: '',
})

const monta = (props = {}) =>
  mount(ModuloSocio, {
    props: { dati: vuoto(), idPrefisso: 'prova', ...props },
    global: { stubs: { RouterLink: true, AppIcon: true } },
  })

const errori = (wrapper) => wrapper.findAll('.modulo-socio__errore').map((e) => e.text())

describe('ModuloSocio', () => {
  it('uscire da un campo vuoto non mostra errori (il clic su Salva non deve saltare)', async () => {
    const wrapper = monta()
    await wrapper.get('#prova-cognome').trigger('blur')
    await wrapper.get('#prova-nome').trigger('blur')
    expect(errori(wrapper)).toEqual([])
  })

  it('un campo scritto e poi svuotato si segnala, con aria-invalid e descrizione', async () => {
    const wrapper = monta()
    const cognome = wrapper.get('#prova-cognome')
    await cognome.setValue('Rossi')
    await cognome.trigger('blur')
    await cognome.setValue('')
    expect(errori(wrapper)).toEqual(['Scrivi il cognome'])
    expect(cognome.attributes('aria-invalid')).toBe('true')
    expect(cognome.attributes('aria-describedby')).toBe('prova-cognome-errore')
  })

  it('una data nel futuro si segnala appena si esce dal campo', async () => {
    const wrapper = monta()
    const data = wrapper.get('#prova-data_nascita')
    await data.setValue('2999-01-01')
    await data.trigger('blur')
    expect(errori(wrapper)).toEqual(['La data di nascita non può essere nel futuro'])
  })

  it('dopo un tentativo di salvataggio mostra tutti gli obbligatori vuoti, manicchia esclusa', () => {
    const wrapper = monta({ mostraErrori: true })
    expect(errori(wrapper)).toEqual([
      'Scrivi il cognome',
      'Scrivi il nome',
      'Scrivi la data di nascita',
      'Scrivi il luogo di nascita',
    ])
  })
})
