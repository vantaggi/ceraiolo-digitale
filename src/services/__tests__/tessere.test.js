import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PDFDocument, rgb } from 'pdf-lib'
import { getSetting } from '../db'
import { generateAllCardsPDF } from '../export'
import {
  formattaDataTessera,
  nomeTessera,
  righeTesto,
  creaPDFTessere,
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

describe('PDF delle tessere', () => {
  beforeEach(() => {
    getSetting.mockReset()
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
