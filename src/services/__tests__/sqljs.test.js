import { describe, it, expect } from 'vitest'
import { indirizzoWasm } from '../sqljs.js'

const sorgenti = import.meta.glob(['/src/**/*.{js,vue}', '!/src/**/__tests__/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('caricamento di sql.js', () => {
  it('trova il wasm nella cartella dell\'app, non nella radice del sito', () => {
    expect(
      indirizzoWasm(
        'sql-wasm.wasm',
        '/ceraiolo-digitale/',
        'https://vantaggi.github.io/ceraiolo-digitale/#/impostazioni',
      ),
    ).toBe('https://vantaggi.github.io/ceraiolo-digitale/sql-wasm.wasm')
  })

  // sql.js tiene il primo caricamento per tutta la sessione: un solo percorso sbagliato
  // (il ripristino usava `/${file}`) blocca anche i backup. Quindi un unico punto.
  it('solo services/sqljs.js carica sql.js', () => {
    const altri = Object.entries(sorgenti)
      .filter(([percorso]) => percorso !== '/src/services/sqljs.js')
      .filter(([, testo]) => /from 'sql\.js'|initSqlJs\(|locateFile/.test(testo))
      .map(([percorso]) => percorso)
    expect(altri).toEqual([])
  })
})
