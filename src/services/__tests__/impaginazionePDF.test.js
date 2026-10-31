import { describe, it, expect, vi } from 'vitest'
import jsPDF from 'jspdf'
import { addPDFFooter, addPDFHeader, adattaColonne, createPDFTable } from '../export'

// Registra dove il PDF scrive testo e disegna rettangoli
const nuovoDoc = (orientation = 'portrait') => {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  const testi = []
  const rettangoli = []
  const text = doc.text.bind(doc)
  const rect = doc.rect.bind(doc)
  vi.spyOn(doc, 'text').mockImplementation((t, x, y, opt) => {
    testi.push({ t, x, y, pagina: doc.internal.getCurrentPageInfo().pageNumber })
    return text(t, x, y, opt)
  })
  vi.spyOn(doc, 'rect').mockImplementation((x, y, w, h, stile) => {
    rettangoli.push({ x, y, w, h, stile })
    return rect(x, y, w, h, stile)
  })
  return { doc, testi, rettangoli }
}

describe('addPDFHeader', () => {
  it('centra il titolo sulla pagina, anche in verticale', () => {
    for (const [orientamento, centro] of [
      ['portrait', 105],
      ['landscape', 148.5],
    ]) {
      const { doc, testi } = nuovoDoc(orientamento)
      addPDFHeader(doc, 'Lista Completa Pagamenti - Tutti', 'Sottotitolo')
      const titolo = testi.find((t) => String(t.t).includes('Lista Completa'))
      expect(titolo.x).toBeCloseTo(centro, 1)
    }
  })

  it('manda a capo un titolo troppo lungo invece di farlo uscire dal foglio', () => {
    const { doc, testi } = nuovoDoc('portrait')
    addPDFHeader(
      doc,
      'Report Soci Personalizzato con un titolo molto lungo per una pagina verticale',
    )
    const titolo = testi[0]
    expect(Array.isArray(titolo.t) && titolo.t.length).toBeGreaterThan(1)
  })
})

describe('createPDFTable', () => {
  const colonne = [
    { text: 'Socio', width: 60 },
    { text: '2024', width: 6 },
    { text: '2025', width: 6 },
    { text: '2026', width: 6 },
  ]

  it('occupa tutta la larghezza utile della pagina', () => {
    expect(adattaColonne([{ width: 30 }, { width: 60 }], 186)).toEqual([62, 124])
    const { doc, rettangoli } = nuovoDoc('portrait')
    createPDFTable(doc, colonne, [['Rossi Mario', 'V', 'O', 'X']], 40)
    const intestazione = rettangoli[0]
    expect(intestazione.x).toBe(12)
    expect(intestazione.x + intestazione.w).toBeCloseTo(198, 1)
  })

  it('scrive le lettere degli anni sulla stessa riga di base', () => {
    const { doc, testi } = nuovoDoc('portrait')
    // Molte colonne strette, come nei report con dieci anni
    const strette = [
      { text: 'Socio', width: 40 },
      ...Array.from({ length: 30 }, (_, i) => ({ text: String(2000 + i), width: 6 })),
    ]
    createPDFTable(
      doc,
      strette,
      [['Rossi Mario', ...Array.from({ length: 30 }, (_, i) => ['V', 'O', 'X'][i % 3])]],
      40,
    )
    const lettere = testi.filter((t) => ['V', 'O', 'X'].includes(String(t.t)))
    expect(lettere).toHaveLength(30)
    expect(new Set(lettere.map((t) => t.y.toFixed(2))).size).toBe(1)
  })

  it('allarga la riga quando un testo va a capo', () => {
    const { doc, rettangoli } = nuovoDoc('portrait')
    const lungo = 'Belardi Capannelli Giovanni Battista '.repeat(4)
    createPDFTable(
      doc,
      colonne,
      [
        ['Breve', 'V', 'V', 'V'],
        [lungo, 'V', 'V', 'V'],
      ],
      40,
    )
    const righe = rettangoli.filter((r) => r.stile === 'F').slice(1)
    expect(righe[1].h).toBeGreaterThan(righe[0].h)
  })

  it('va a pagina nuova prima di uscire dal foglio e ripete l intestazione', () => {
    const { doc, rettangoli, testi } = nuovoDoc('portrait')
    const righe = Array.from({ length: 80 }, (_, i) => [`Socio ${i}`, 'V', 'V', 'V'])
    createPDFTable(doc, colonne, righe, 40)
    expect(doc.internal.getNumberOfPages()).toBeGreaterThan(1)
    for (const r of rettangoli) expect(r.y + r.h).toBeLessThanOrEqual(297 - 14 + 0.001)
    const intestazioni = testi.filter((t) => t.t === 'Socio')
    expect(intestazioni).toHaveLength(doc.internal.getNumberOfPages())
  })
})

describe('addPDFFooter', () => {
  const colonne = [
    { text: 'Socio', width: 60 },
    { text: '2026', width: 10 },
  ]
  const piediDi = (testi, doc) =>
    Array.from({ length: doc.internal.getNumberOfPages() }, (_, i) =>
      testi.filter((t) => t.pagina === i + 1 && t.y > 280).map((t) => String(t.t)),
    )

  it('ogni pagina porta titolo, data di generazione e "Pagina n di N" (07-output)', () => {
    const { doc, testi } = nuovoDoc('portrait')
    const y = addPDFHeader(doc, 'Aventi diritto al voto 2026', 'Tutte le manicchie')
    createPDFTable(
      doc,
      colonne,
      Array.from({ length: 80 }, (_, i) => [`Socio ${i}`, 'V']),
      y,
    )
    addPDFFooter(doc)
    const pagine = piediDi(testi, doc)
    expect(pagine.length).toBeGreaterThan(1)
    pagine.forEach((piede, i) => {
      expect(piede).toContain(`Pagina ${i + 1} di ${pagine.length}`)
      expect(
        piede.some((t) => /^Aventi diritto al voto 2026 · Generato il \d{2}\/\d{2}\/\d{4}/.test(t)),
      ).toBe(true)
    })
  })

  it('un titolo lunghissimo si accorcia e non tocca il numero di pagina', () => {
    const { doc, testi } = nuovoDoc('portrait')
    addPDFHeader(doc, 'Report su misura '.repeat(12))
    addPDFFooter(doc)
    const sinistra = testi.find((t) => t.y > 280 && String(t.t).includes('Generato il'))
    expect(String(sinistra.t)).toContain('...')
    doc.setFontSize(8)
    const fine = sinistra.x + doc.getTextWidth(String(sinistra.t))
    expect(fine).toBeLessThan(210 - 12 - doc.getTextWidth('Pagina 1 di 1'))
  })
})

describe('report su misura', () => {
  it("usa l'impaginazione comune, non una copia sua", async () => {
    const sorgente = (await import('../exportBeta.js?raw')).default
    for (const funzione of ['addPDFHeader', 'createPDFTable', 'addPDFFooter']) {
      expect(sorgente).not.toMatch(new RegExp(`function ${funzione}\\(`))
    }
    expect(sorgente).not.toContain('Generated on')
  })
})

describe('report su misura: contenuto del PDF', () => {
  it("ha le colonne dell'anteprima, nello stesso ordine, con i colori degli stati", async () => {
    const { tabellaReport } = await import('../exportBeta.js')
    const { statoIniziale, filtraSoci, colonneReport } = await import('@/utils/reportSuMisura')
    const stato = statoIniziale(2026)
    stato.display.baseColumns = ['dirittoVoto', 'cognomeNome', 'firma']
    stato.display.yearColumns = [2026]
    const soci = [
      {
        id: 1,
        cognome: 'Prova',
        nome: 'Uno',
        data_nascita: '1980-01-01',
        tesseramenti: [{ anno: 2025 }, { anno: 2026 }],
      },
    ]
    const colonne = colonneReport(stato)
    const { headers, rows } = tabellaReport(filtraSoci(soci, stato), colonne)
    expect(headers.map((h) => h.text)).toEqual(colonne.map((c) => c.label))
    expect(headers.map((h) => h.text)).toEqual(['Diritto di voto', 'Socio', '2026', 'Firma'])
    expect(headers[2].orientation).toBe('vertical')
    expect(rows).toEqual([
      [
        { text: 'Sì', color: [0, 150, 0] },
        'Prova Uno',
        { text: 'V', color: expect.any(Array) },
        '',
      ],
    ])
  })
})
