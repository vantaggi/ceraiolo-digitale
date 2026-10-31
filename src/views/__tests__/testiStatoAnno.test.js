import { describe, it, expect } from 'vitest'

// Controllo statico: le parole dello stato di un anno (Pagata, Da pagare, Esente, Non iscritto)
// stanno solo in utils/payment.js (TESTI_STATO_ANNO), non ricopiate nelle viste.
const sorgenti = import.meta.glob(['../../views/*.vue', '../../components/**/*.vue'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('testi dello stato di un anno', () => {
  it('nessuna vista o componente ha una sua tabella V/X/O', () => {
    const copie = Object.entries(sorgenti)
      .filter(([, testo]) => /\bO:\s*['"]Esente/.test(testo))
      .map(([file]) => file)
    expect(copie).toEqual([])
  })
})
