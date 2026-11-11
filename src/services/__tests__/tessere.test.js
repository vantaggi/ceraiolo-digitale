import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PDFDocument, rgb } from 'pdf-lib'
import { getSetting } from '../db'
import { generateAllCardsPDF } from '../export'
import {
  formattaDataTessera,
  nomeTessera,
  righeTesto,
  creaPDFTessere,
  testoStampabile,
  LARGHEZZA_TESSERA_MM,
  ALTEZZA_TESSERA_MM,
} from '../tessere'
import exportSorgente from '../export.js?raw'
import anteprimaSorgente from '../../components/AnteprimaTessera.vue?raw'
import settingsSorgente from '../../views/SettingsView.vue?raw'
import reportsSorgente from '../../views/ReportsView.vue?raw'

vi.mock('../db', () => ({ getSetting: vi.fn(), db: {}, updateSetting: vi.fn() }))

const MM = 72 / 25.4

// Soci inventati
const soci = Array.from({ length: 40 }, (_, i) => ({
  cognome: `Cognome${String(i).padStart(2, '0')}`,
  nome: 'Nome',
  data_nascita: '1990-03-0' + ((i % 9) + 1),
}))

// Un modello PDF "pesante" come una foto vera: un riquadro con tanto contenuto
async function modelloPDF(larghezza = 200, altezza = 300) {
  const doc = await PDFDocument.create()
  const page = doc.addPage([larghezza, altezza])
  for (let i = 0; i < 30000; i++) {
    page.drawRectangle({
      x: i % 200,
      y: (i * 7) % 300,
      width: 1,
      height: 1,
      color: rgb(0.5, 0.2, 0.1),
    })
  }
  return doc.save()
}

// PNG 2x3 pixel, rosso
const PNG_PICCOLO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAE0lEQVR4nGM8wcDAwMDAxIBMAQAP9ADOEjHWXgAAAABJRU5ErkJggg=='

// Il Blob di jsdom non ha arrayBuffer()
const leggi = (blob) =>
  new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsArrayBuffer(blob)
  })

function impostazioni(valori) {
  getSetting.mockImplementation(async (chiave) => valori[chiave] ?? null)
}

describe('testo della tessera', () => {
  it('data in italiano, senza zeri davanti al giorno', () => {
    expect(formattaDataTessera('1980-05-15')).toBe('15 Maggio 1980')
    expect(formattaDataTessera('2001-08-06')).toBe('6 Agosto 2001')
    expect(formattaDataTessera('')).toBe('')
    expect(formattaDataTessera(null)).toBe('')
  })

  it('prima il cognome, poi il nome', () => {
    expect(nomeTessera({ cognome: 'Rossi', nome: 'Mario' })).toBe('Rossi Mario')
    expect(nomeTessera({ cognome: 'Rossi', nome: '' })).toBe('Rossi')
  })

  it('va a capo tra le parole, mai dentro una parola', () => {
    const misura = (t) => t.length
    expect(righeTesto('Del Pinto Santambrogio Marco', 22, misura)).toEqual([
      'Del Pinto Santambrogio',
      'Marco',
    ])
    expect(righeTesto('Lunghissimocognome', 5, misura)).toEqual(['Lunghissimocognome'])
    expect(righeTesto('', 10, misura)).toEqual([])
  })
})

describe('testoStampabile: lettere che il carattere della tessera non ha', () => {
  // Come Times-Italic: lettere latine semplici e accentate occidentali
  const siScrive = (c) => /^[ -~\u00a1-\u00ff]$/u.test(c)

  it('un nome italiano resta uguale e non risulta cambiato', () => {
    expect(testoStampabile("D'Angelo Niccolò", siScrive)).toEqual({
      testo: "D'Angelo Niccolò",
      cambiato: false,
    })
  })

  it('la lettera che manca diventa la lettera semplice', () => {
    expect(testoStampabile('Dvořák Łukasz', siScrive)).toEqual({
      testo: 'Dvorák Lukasz',
      cambiato: true,
    })
    expect(testoStampabile('Șerban Đorđe', siScrive).testo).toBe('Serban Dorde')
  })

  it('Tab, a capo e spazi doppi diventano uno spazio, senza contare come lettera cambiata', () => {
    expect(testoStampabile('Rossi\tMario\n ', siScrive)).toEqual({
      testo: 'Rossi Mario',
      cambiato: false,
    })
  })

  it('una lettera senza lettera semplice diventa un punto di domanda', () => {
    expect(testoStampabile('Rossi 山', siScrive)).toEqual({ testo: 'Rossi ?', cambiato: true })
  })

  it('un accento scritto come segno a parte (NFD) torna la lettera accentata, non cambiata', () => {
    expect(testoStampabile('Nicco\u0300 Jose\u0301', siScrive)).toEqual({
      testo: 'Niccò José',
      cambiato: false,
    })
    // spazio a larghezza zero: si toglie
    expect(testoStampabile('Ros\u200bsi', siScrive)).toEqual({ testo: 'Rossi', cambiato: false })
  })

  it('senza testo restituisce il vuoto', () => {
    expect(testoStampabile(null, siScrive)).toEqual({ testo: '', cambiato: false })
  })
})

describe('PDF delle tessere', () => {
  beforeEach(() => {
    getSetting.mockReset()
  })

  it('una lettera che il carattere non ha non ferma il PDF (errore di WinAnsi)', async () => {
    const bytes = await creaPDFTessere(
      [{ cognome: 'Dvořák', nome: 'Jiří', data_nascita: '1990-03-01' }, soci[0]],
      { tipo: 'pdf', dati: await modelloPDF(210, 330) },
    )
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(2)
  })

  it('un nome con lettere che il carattere non ha o con un Tab non ferma il PDF', async () => {
    impostazioni({ cardBackground: PNG_PICCOLO })
    // Inventati
    const strani = [
      { cognome: 'Dvořák', nome: 'Jiří', data_nascita: '1990-03-01' },
      { cognome: 'Rossi\tBianchi', nome: 'Mario', data_nascita: '1985-07-12' },
      { cognome: null, nome: 'Senzacognome', data_nascita: '' },
      soci[0],
    ]
    const [risultato] = await generateAllCardsPDF(strani, 2027)
    const pdf = await PDFDocument.load(await leggi(risultato.blob))
    expect(pdf.getPageCount()).toBe(4)
    expect(risultato.nomiCambiati).toEqual(['Dvořák Jiří'])
  })

  it('con un modello PDF la tessera ha le misure della pagina del modello', async () => {
    const bytes = await creaPDFTessere(soci.slice(0, 3), {
      tipo: 'pdf',
      dati: await modelloPDF(210, 330),
    })
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(3)
    expect(pdf.getPage(0).getSize()).toEqual({ width: 210, height: 330 })
  })

  it("con una foto come sfondo la tessera e' di 80,77 x 122,17 mm", async () => {
    impostazioni({ cardBackground: PNG_PICCOLO })
    const [risultato] = await generateAllCardsPDF(soci.slice(0, 2), 2027)
    const pdf = await PDFDocument.load(await leggi(risultato.blob))
    expect(pdf.getPageCount()).toBe(2)
    const { width, height } = pdf.getPage(0).getSize()
    expect(width).toBeCloseTo(LARGHEZZA_TESSERA_MM * MM, 3)
    expect(height).toBeCloseTo(ALTEZZA_TESSERA_MM * MM, 3)
  })

  it('il PDF salvato ha la precedenza sulla vecchia immagine segnaposto', async () => {
    impostazioni({
      cardTemplatePDF: Array.from(await modelloPDF(210, 330)),
      cardBackground: PNG_PICCOLO,
    })
    const [risultato] = await generateAllCardsPDF(soci.slice(0, 1), 2027)
    const pdf = await PDFDocument.load(await leggi(risultato.blob))
    expect(pdf.getPage(0).getSize()).toEqual({ width: 210, height: 330 })
  })

  it("lo sfondo e' incluso una volta sola: il file non cresce con il numero di soci", async () => {
    const modello = await modelloPDF()
    impostazioni({ cardTemplatePDF: Array.from(modello) })
    const [una] = await generateAllCardsPDF(soci.slice(0, 1), 2027)
    const [tutte] = await generateAllCardsPDF(soci, 2027)
    expect(tutte.count).toBe(soci.length)
    // Con lo sfondo copiato a ogni pagina 40 tessere peserebbero ~40 volte una
    expect(tutte.blob.size).toBeLessThan(una.blob.size * 2)
  })

  it("le tessere sono in ordine di cognome e l'elenco ricevuto non viene riordinato", async () => {
    impostazioni({ cardBackground: PNG_PICCOLO })
    const elenco = [soci[2], soci[0], soci[1]]
    const [risultato] = await generateAllCardsPDF(elenco, 2027)
    expect(risultato.count).toBe(3)
    expect(elenco.map((s) => s.cognome)).toEqual(['Cognome02', 'Cognome00', 'Cognome01'])
  })

  it('senza sfondo spiega dove caricarlo', async () => {
    impostazioni({})
    await expect(generateAllCardsPDF(soci.slice(0, 1), 2027)).rejects.toThrow(
      /Impostazioni > Tessera/,
    )
  })
})

// L'anteprima deve essere il file vero: una sola funzione impagina le tessere
describe('anteprima uguale al file generato', () => {
  it('anteprima, tessera singola e tutte le tessere usano creaPDFTessere', () => {
    expect(anteprimaSorgente).toMatch(/creaPDFTessere\(/)
    expect(exportSorgente.match(/creaPDFTessere\(/g)).toHaveLength(2)
  })

  it('nessun altro posto disegna testo sulle tessere', () => {
    expect(exportSorgente).not.toMatch(/drawText\(/)
    expect(exportSorgente).not.toMatch(/from 'pdf-lib'/)
  })

  it("l'anteprima e' AnteprimaTessera, in un posto solo (Impostazioni)", () => {
    expect(settingsSorgente).toMatch(/<AnteprimaTessera/)
    // Report PDF rimanda a Impostazioni invece di ripetere l'anteprima
    expect(reportsSorgente).not.toMatch(/AnteprimaTessera|TesseraTemplate/)
    expect(reportsSorgente).toMatch(/to="\/settings\/tessera"/)
  })
})
