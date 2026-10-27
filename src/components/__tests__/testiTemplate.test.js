import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Controllo statico: "${{ x }}" in un template Vue stampa un "$" in pagina
// (es. "negli ultimi 5 anni ($2022 - 2026)" in ReportsView): e' la sintassi
// delle stringhe JS finita per sbaglio nell'HTML.

const SRC = path.resolve(__dirname, '../..')

const vueFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : vueFiles(full)
    return entry.name.endsWith('.vue') ? [full] : []
  })

const template = (testo) => {
  const inizio = testo.indexOf('<template>')
  const fine = testo.lastIndexOf('</template>')
  return inizio === -1 ? '' : testo.slice(inizio, fine)
}

describe('testi dei template', () => {
  it('nessun "${{" nei template', () => {
    const trovati = []
    for (const file of vueFiles(SRC)) {
      template(fs.readFileSync(file, 'utf8'))
        .split('\n')
        .forEach((riga, i) => {
          if (riga.includes('${{')) trovati.push(`${path.relative(SRC, file)} (riga ${i + 1} del template): ${riga.trim()}`)
        })
    }
    expect(trovati).toEqual([])
  })
})
