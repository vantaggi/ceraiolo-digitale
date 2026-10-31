import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { icons } from '../base/icons'

// Controlli statici della UI Constitution sulle icone: niente emoji o simboli usati
// come icone, solo AppIcon (Lucide) con un nome presente in base/icons.js.

const SRC = path.resolve(__dirname, '../..')

const sourceFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full)
    return /\.(vue|js)$/.test(entry.name) ? [full] : []
  })

const rel = (file) => path.relative(SRC, file).split(path.sep).join('/')

// Emoji e simboli che fanno da icona (frecce, spunte, croci). (C) (R) e TM restano testo.
// U+FFFD e' il resto di un'emoji rotta (es. "\uFFFD\uFE0F Audit Qualita' Dati" in ReportsView).
const ICONA_TESTUALE = /(?![©®™])\p{Extended_Pictographic}|[←-↓✓✕✗\uFFFD]/u

// Eccezioni motivate; il test fallisce se un'eccezione non serve piu'.
const ECCEZIONI = {
  'components/KeyboardShortcutsModal.vue': 'le frecce sono i tasti da premere, non icone',
  'views/BatchEntryView.vue': 'le frecce nella riga delle scorciatoie sono i tasti da premere',
}

// Componenti che passano ad AppIcon un nome ricevuto come prop: [file, prop, tag]
const PROP_ICONA = [['components/base/FilterSection.vue', 'icona', 'FilterSection']]

const righeConIcone = (file) =>
  fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .map((riga, i) => [riga, i + 1])
    .filter(([riga]) => ICONA_TESTUALE.test(riga))

describe('icone', () => {
  it('nessuna emoji o simbolo usato come icona nei sorgenti', () => {
    const trovati = []
    for (const file of sourceFiles(SRC)) {
      if (rel(file) in ECCEZIONI) continue
      for (const [riga, n] of righeConIcone(file)) trovati.push(`${rel(file)}:${n}: ${riga.trim()}`)
    }
    expect(trovati).toEqual([])
  })

  it('ogni eccezione serve ancora', () => {
    const inutili = Object.keys(ECCEZIONI).filter(
      (f) => righeConIcone(path.join(SRC, f)).length === 0,
    )
    expect(inutili).toEqual([])
  })

  it('ogni AppIcon usa un nome definito in base/icons.js', () => {
    const sconosciuti = []
    for (const file of sourceFiles(SRC)) {
      const testo = fs.readFileSync(file, 'utf8')
      for (const [, attr] of testo.matchAll(/<AppIcon\b[^>]*?\s:?name="([^"]+)"/g)) {
        // name="x" oppure :name="cond ? 'x' : 'y'": si controllano i risultati del ternario.
        // :name="icona" dentro un componente che lo riceve come prop si controlla sotto,
        // dove il componente viene usato.
        if (PROP_ICONA.some(([f, p]) => rel(file) === f && attr === p)) continue
        const nomi = /^[\w-]+$/.test(attr)
          ? [attr]
          : [...attr.matchAll(/[?:]\s*'([^']+)'/g)].map((m) => m[1])
        for (const nome of nomi) if (!(nome in icons)) sconosciuti.push(`${rel(file)}: ${nome}`)
      }
    }
    expect(sconosciuti).toEqual([])
  })

  it('i componenti che ricevono il nome di un\'icona lo ricevono valido', () => {
    const sconosciuti = []
    for (const file of sourceFiles(SRC)) {
      const testo = fs.readFileSync(file, 'utf8')
      for (const [, prop, tag] of PROP_ICONA) {
        const re = new RegExp(`<${tag}\\b[^>]*?\\s${prop}="([^"]+)"`, 'g')
        for (const [, nome] of testo.matchAll(re)) {
          if (!(nome in icons)) sconosciuti.push(`${rel(file)}: ${nome}`)
        }
      }
    }
    expect(sconosciuti).toEqual([])
  })
})
