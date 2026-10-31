import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Le tendine aperte (<select>), il calendario delle date e le spunte li disegna il
// browser: senza color-scheme restano chiari anche nel tema scuro, e le voci della
// tendina diventavano testo chiaro su fondo bianco (segnalato da Cioti il 31/10/2026).

const css = fs
  .readFileSync(path.resolve(__dirname, '../main.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')

const blocco = (selettore) => {
  const inizio = css.indexOf(`${selettore} {`)
  return inizio === -1 ? '' : css.slice(inizio, css.indexOf('}', inizio))
}

describe('controlli del browser e tema', () => {
  it('il tema chiaro dichiara color-scheme light', () => {
    expect(blocco(':root')).toMatch(/color-scheme:\s*light/)
  })

  it('il tema scuro dichiara color-scheme dark', () => {
    expect(blocco("[data-theme='dark']")).toMatch(/color-scheme:\s*dark/)
  })

  it('le voci della tendina hanno fondo e testo del campo', () => {
    const voci = blocco('optgroup')
    expect(voci).toMatch(/background-color:\s*var\(--color-input-bg\)/)
    expect(voci).toMatch(/color:\s*var\(--color-text-primary\)/)
  })
})
