import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Controllo statico (regola di CLAUDE.md, come test_dialoghi_nativi di padel-dashboard):
// niente confirm(), alert() o prompt() del browser. Si usano askConfirm/askText di
// src/composables/useDialog.js per le domande e i toast per gli avvisi.

const SRC = path.resolve(__dirname, '../..')

const sourceFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full)
    return /\.(vue|js)$/.test(entry.name) ? [full] : []
  })

const stripComments = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|\s)\/\/.*$/gm, '$1')

// Una chiamata nuda o via window, non un metodo di un altro oggetto (es. toast.confirm).
const NATIVO = /(?:^|[^\w.$])(?:confirm|alert|prompt)\s*\(|window\.(?:confirm|alert|prompt)\s*\(/

describe('dialoghi nativi', () => {
  it('nessun confirm(, alert( o prompt( del browser nei sorgenti', () => {
    const trovati = []
    for (const file of sourceFiles(SRC)) {
      stripComments(fs.readFileSync(file, 'utf8'))
        .split('\n')
        .forEach((riga, i) => {
          if (NATIVO.test(riga))
            trovati.push(`${path.relative(SRC, file)}:${i + 1}: ${riga.trim()}`)
        })
    }
    expect(trovati).toEqual([])
  })
})
