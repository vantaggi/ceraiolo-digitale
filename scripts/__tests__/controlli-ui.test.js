import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { CONTROLLI, stripComments, misura } from '../controlli-ui.mjs'

const conta = (id, testo, file = 'src/views/Prova.vue') =>
  CONTROLLI.find((c) => c.id === id).conta(stripComments(testo), file)

// I conteggi sono la base della migrazione: se un'espressione regolare smette di
// riconoscere un caso, il numero scende senza che il codice sia migliorato.
describe('controlli della UI Constitution', () => {
  it('conta i colori scritti a mano e ignora token, commenti e ancore', () => {
    const css = `
      .a { color: #b71c1c; background: rgba(0, 0, 0, 0.5); border: 1px solid white; }
      .b { color: var(--accent-default); background: transparent; }
      /* era #fff5f5 */
    `
    expect(conta('colori', css)).toBe(3)
    expect(
      conta('colori', '<a href="#abc">x</a><template #add></template><template #default>'),
    ).toBe(0)
  })

  it('conta raggi, testo, ombre, durate e spaziature solo fuori dai token', () => {
    const css = `
      .a { border-radius: 8px; font-size: 0.9rem; box-shadow: 0 2px 8px rgba(0,0,0,.1);
           transition: all 0.2s; padding: 1rem 2rem; margin: 0; gap: var(--space-8); }
      .b { border-radius: var(--radius-control); font-size: var(--font-size-label);
           box-shadow: var(--shadow-overlay); box-shadow: none; padding: var(--space-16); }
    `
    expect(conta('raggi', css)).toBe(1)
    expect(conta('testo', css)).toBe(1)
    expect(conta('ombre', css)).toBe(1)
    expect(conta('durate', css)).toBe(1)
    expect(conta('spaziature', css)).toBe(1)
  })

  it('conta i pesi fuori da 400, 500, 600', () => {
    expect(
      conta('pesi', '.a { font-weight: 700; } .b { font-weight: 600; } .c { font-weight: bold; }'),
    ).toBe(2)
  })

  it('riconosce una modale con stile proprio, non BaseModal', () => {
    expect(
      conta('modali', '<div class="modal-overlay"><div class="modal-content"></div></div>'),
    ).toBe(1)
    expect(
      conta('modali', '<div class="modal-overlay"></div>', 'src/components/base/BaseModal.vue'),
    ).toBe(0)
  })

  it('conta la soglia dei 18 anni fuori da utils/payment.js', () => {
    expect(conta('minorenne', 'return eta < 18 || x >= 18', 'src/views/Prova.vue')).toBe(2)
    expect(conta('minorenne', 'return age < 18', 'src/utils/payment.js')).toBe(0)
  })

  it('misura il progetto vero senza errori e salta le eccezioni', () => {
    const risultati = misura(path.resolve(__dirname, '../..'))
    expect(risultati.map((r) => r.id)).toEqual(CONTROLLI.map((c) => c.id))
    const file = risultati.flatMap((r) => r.perFile.map(([f]) => f))
    expect(file).not.toContain('src/assets/main.css')
    expect(file).not.toContain('src/services/tessere.js')
  })
})
