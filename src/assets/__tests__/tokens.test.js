import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Controllo statico (regola di CLAUDE.md): ogni var(--x) usato nei sorgenti deve essere
// definito in src/assets/main.css, in tutti e due i temi se e' un colore. Un token che
// manca non da' errori: il browser ignora la regola e il bottone resta senza colore,
// come succedeva con --color-danger.

const SRC = path.resolve(__dirname, '../..')
const MAIN_CSS = path.join(SRC, 'assets/main.css')

const stripComments = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(^|[^:'"])\/\/.*$/gm, '$1')

const definedIn = (css) => new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]))

const blockOf = (css, selector) => {
  const start = css.indexOf(selector)
  return start === -1 ? '' : css.slice(start, css.indexOf('}', start))
}

const sourceFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full)
    return /\.(vue|js|css)$/.test(entry.name) ? [full] : []
  })

describe('token CSS', () => {
  const mainCss = stripComments(fs.readFileSync(MAIN_CSS, 'utf8'))
  const globali = definedIn(mainCss)

  it("ogni var(--x) usato nei sorgenti e' definito in main.css o nello stesso file", () => {
    const mancanti = []
    for (const file of sourceFiles(SRC)) {
      const text = stripComments(fs.readFileSync(file, 'utf8'))
      const locali = definedIn(text)
      for (const [, nome] of text.matchAll(/var\(\s*(--[\w-]+)/g)) {
        if (!globali.has(nome) && !locali.has(nome)) {
          mancanti.push(`${path.relative(SRC, file)}: ${nome}`)
        }
      }
    }
    expect([...new Set(mancanti)]).toEqual([])
  })

  it('ogni colore del tema chiaro ha il suo valore nel tema scuro', () => {
    const colori = (block) => [...definedIn(block)].filter((nome) => nome.startsWith('--color-'))
    const chiaro = colori(blockOf(mainCss, ':root {'))
    const scuro = new Set(colori(blockOf(mainCss, "[data-theme='dark'] {")))
    expect(chiaro.filter((nome) => !scuro.has(nome))).toEqual([])
  })
})
