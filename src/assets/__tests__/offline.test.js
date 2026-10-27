import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const leggi = (percorso) => fs.readFileSync(path.resolve(__dirname, percorso), 'utf8')
const css = leggi('../main.css')
const html = leggi('../../../index.html')

// L'app si usa soprattutto senza connessione: niente deve arrivare da internet
// (prima i caratteri venivano da Google Fonts e offline sparivano)
describe('nessuna risorsa da internet', () => {
  it('main.css non importa niente da fuori', () => {
    expect(css).not.toMatch(/@import\s+url\(\s*['"]?https?:/i)
  })

  it('index.html non carica script, stili o caratteri da fuori', () => {
    expect(html).not.toMatch(/(src|href)=["']https?:/i)
  })
})
