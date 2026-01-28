import jsPDF from 'jspdf'
import { PDFDocument, rgb } from 'pdf-lib'
import * as XLSX from 'xlsx'
import { getSetting, exportAllSoci, exportAllTesseramenti, isExemptFromPayment } from './db'

/**
 * Crea un documento PDF con configurazione base
 * @param {string} orientation - 'portrait' o 'landscape'
 * @param {string} format - Formato pagina ('a4', ecc.)
 * @returns {jsPDF} Istanza jsPDF configurata
 */
function createPDFDocument(orientation = 'landscape', format = 'a4') {
  return new jsPDF({
    orientation,
    unit: 'mm',
    format,
  })
}

/**
 * Aggiunge header standard al PDF
 * @param {jsPDF} doc - Documento PDF
 * @param {string} title - Titolo principale
 * @param {string} subtitle - Sottotitolo (opzionale)
 * @param {string} summary - Testo riassuntivo (opzionale)
 * @returns {number} Posizione Y dopo l'header
 */
function addPDFHeader(doc, title, subtitle = '', summary = '') {
  let currentY = 20

  // Titolo principale
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 148, currentY, { align: 'center' })
  currentY += 10

  // Sottotitolo
  if (subtitle) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, 148, currentY, { align: 'center' })
    currentY += 10
  }

  // Data generazione
  const generationDate = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generato il: ${generationDate}`, 148, currentY, { align: 'center' })
  currentY += 10

  // Testo riassuntivo
  if (summary) {
    doc.text(summary, 148, currentY, { align: 'center' })
    currentY += 10
  }

  return currentY
}

/**
 * Crea una tabella PDF con intestazione e righe
 * @param {jsPDF} doc - Documento PDF
 * @param {Array} headers - Array di oggetti header {text, width}
 * @param {Array} rows - Array di righe (ogni riga è un array di valori)
 * @param {number} startY - Posizione Y iniziale
 * @param {number} rowHeight - Altezza delle righe
 * @returns {number} Posizione Y dopo la tabella
 */
function createPDFTable(doc, headers, rows, startY, rowHeight = 10) {
  const tableWidth = 240
  const startX = 20

  // Calcola posizioni colonne
  const colPositions = [startX]
  headers.forEach((header, index) => {
    const prevPos = colPositions[index]
    colPositions.push(prevPos + header.width)
  })

  let currentY = startY

  // Intestazione
  doc.setFillColor(183, 28, 28) // Rosso scuro
  doc.setTextColor(255) // Bianco
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')

  // Sfondo intestazione
  doc.rect(startX, currentY, tableWidth, rowHeight, 'F')

  // Bordi intestazione
  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.5)
  doc.rect(startX, currentY, tableWidth, rowHeight)

    // Testo intestazione
    headers.forEach((header, index) => {
      // Centratura verticale approssimativa: altezza riga / 2 + 1/3 font size
      doc.text(header.text, colPositions[index] + 2, currentY + rowHeight / 2 + 1.5)
    })

    currentY += rowHeight

  // Righe dati
  doc.setTextColor(0) // Nero
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  rows.forEach((row, rowIndex) => {
    // Alternanza colori
    const isEvenRow = rowIndex % 2 === 0
    const fillColor = isEvenRow ? [248, 248, 248] : [255, 255, 255]
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2])
    doc.rect(startX, currentY, tableWidth, rowHeight, 'F')

    // Bordi celle
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)

    // Linee verticali
    colPositions.forEach((x) => {
      doc.line(x, currentY, x, currentY + rowHeight)
    })
    doc.line(
      colPositions[colPositions.length - 1],
      currentY,
      colPositions[colPositions.length - 1],
      currentY + rowHeight,
    )

    // Bordo orizzontale
    doc.rect(startX, currentY, tableWidth, rowHeight)

    // Testo celle
    row.forEach((cellValue, cellIndex) => {
      const cellText = String(cellValue || '')
      const maxWidth = headers[cellIndex].width - 4
      const textY = currentY + rowHeight / 2 + 1.5 // Centratura dinamica

      // Logica migliorata: usa SEMPRE il wrapping per testi lunghi, evitando troncamenti
      if (cellText.length > 20 || doc.getStringUnitWidth(cellText) * doc.internal.getFontSize() / doc.internal.scaleFactor > maxWidth) {
         // Testo multi-riga (wrapping automatico)
         const lines = doc.splitTextToSize(cellText, maxWidth)
         // Centratura verticale approssimativa per multiriga:
         // Se sono troppe righe, potrebbe uscire dalla cella, ma meglio che tagliare.
         // Un calcolo più fine richiederebbe di sapere l'altezza del font
         const lineHeight = 3.5 // approx per fontSize 9
         const blockHeight = lines.length * lineHeight
         const startY = currentY + (rowHeight - blockHeight) / 2 + 2.5

         doc.text(lines, colPositions[cellIndex] + 2, startY)
      } else {
        // Testo normale (una riga)
        doc.text(cellText, colPositions[cellIndex] + 2, textY)
      }

    })

    currentY += rowHeight

    // Controllo paginazione (se vicino al fondo)
    if (currentY > 170) {
      // 180 - 10 per margine
      doc.addPage()
      currentY = 20

      // Ripeti intestazione su nuova pagina
      doc.setFillColor(183, 28, 28)
      doc.setTextColor(255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.rect(startX, currentY, tableWidth, rowHeight, 'F')
      doc.setDrawColor(100, 100, 100)
      doc.setLineWidth(0.5)
      doc.rect(startX, currentY, tableWidth, rowHeight)

      headers.forEach((header, index) => {
        doc.text(header.text, colPositions[index] + 2, currentY + 7)
      })

      currentY += rowHeight
      doc.setTextColor(0)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
    }
  })

  return currentY
}

/**
 * Aggiunge footer standard al PDF con numeri di pagina
 * @param {jsPDF} doc - Documento PDF
 */
function addPDFFooter(doc) {
  const pageHeight = doc.internal.pageSize.height
  const pageCount = doc.internal.getNumberOfPages()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text('Sistema di gestione soci - Ceraiolo Digitale', 20, pageHeight - 20)

    doc.setFont('helvetica', 'normal')
    doc.text(`Pagina ${i} di ${pageCount}`, doc.internal.pageSize.width - 40, pageHeight - 20)
  }
}

/**
 * Genera un nome file PDF standardizzato
 * @param {string} baseName - Nome base del file
 * @param {Object} params - Parametri aggiuntivi per il nome file
 * @returns {string} Nome file sanitizzato
 */
function generatePDFFilename(baseName, params = {}) {
  const parts = [baseName]

  // Aggiungi parametri se presenti
  Object.values(params).forEach((param) => {
    if (param && param !== 'tutti' && param !== 'Tutti') {
      parts.push(String(param).toLowerCase().replace(/\s+/g, '_'))
    }
  })

  // Aggiungi data
  parts.push(new Date().toISOString().split('T')[0])

  return sanitizeFilename(`${parts.join('_')}.pdf`)
}

/**
 * Sanitizes a filename by removing or replacing invalid characters
 * @param {string} filename - The filename to sanitize
 * @returns {string} The sanitized filename
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 255) // Limit length
}

/**
 * Generates a PDF with a table of members from the provided search results
 * @param {Array} sociList - Array of member objects from search results
 * @param {number} renewalYear - The year for renewal
 * @returns {Object} Result object with success status and blob or error
 */
export async function generateSociPDF(sociList, renewalYear) {
  try {
    if (!sociList || sociList.length === 0) {
      throw new Error('Nessun dato da esportare')
    }

    // Crea documento PDF
    const doc = createPDFDocument()

    // Header
    const gruppoNome = sociList[0]?.gruppo_appartenenza || 'Tutti'
    const headerY = addPDFHeader(
      doc,
      `Elenco ${gruppoNome}`,
      `Anno ${renewalYear}`,
      `Totale soci: ${sociList.length}`,
    )

    // Prepara i dati per la tabella
    const tableData = sociList
      .sort((a, b) => a.cognome.localeCompare(b.cognome))
      .map((socio) => {
        // Calcola gli arretrati
        const anniPagati = socio.tesseramenti ? socio.tesseramenti.map((t) => t.anno) : []
        const anniArretrati = []

        let annoPrimaIscrizione = socio.data_prima_iscrizione
        if (!annoPrimaIscrizione && anniPagati.length > 0) {
          annoPrimaIscrizione = Math.min(...anniPagati)
        }

        if (annoPrimaIscrizione) {
          for (let anno = annoPrimaIscrizione; anno < renewalYear; anno++) {
            if (!anniPagati.includes(anno)) {
              // Check if exempt (minor)
              if (!isExemptFromPayment(socio, anno)) {
                anniArretrati.push(anno)
              }
            }
          }
        }

        return [
          `${socio.cognome} ${socio.nome}`,
          socio.gruppo_appartenenza || '-',
          anniArretrati.length > 0 ? anniArretrati.join(', ') : '-',
          '', // Colonna vuota per scrivere a mano
        ]
      })

    // Configurazione tabella
    const headers = [
      { text: 'Cognome e Nome', width: 80 },
      { text: 'Gruppo', width: 40 },
      { text: 'Arretrati', width: 70 },
      { text: `Pagato ${renewalYear}`, width: 50 },
    ]

    // Crea tabella
    createPDFTable(doc, headers, tableData, headerY + 10)

    // Footer
    addPDFFooter(doc)

    // Genera filename e output
    const filename = generatePDFFilename('elenco', { gruppoNome, renewalYear })

    return {
      success: true,
      blob: doc.output('blob'),
      filename,
      totalSoci: sociList.length,
    }
  } catch (error) {
    console.error('Errore nella generazione del PDF:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Triggers download of the generated PDF blob
 * @param {Object} result - Result from generateSociPDF
 * @returns {boolean} Success status
 */
export function downloadSociPDF(result) {
  if (result.success && result.blob) {
    const url = URL.createObjectURL(result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  }
  return false
}

/**
 * Generates and downloads PDF in one call
 * @param {Array} sociList - Array of member objects
 * @returns {Promise<boolean>} Success status
 */
export async function generateAndDownloadSociPDF(sociList) {
  const renewalYear = new Date().getFullYear()
  const result = await generateSociPDF(sociList, renewalYear)

  if (result.success) {
    return downloadSociPDF(result)
  }

  throw new Error(result.error || 'Errore nella generazione del PDF')
}

/**
 * Generates a PDF with the renewal list table
 * @param {Array} soci - Array of member objects with tesseramenti
 * @param {number} renewalYear - The year for renewal
 * @returns {Promise<void>}
 */
export async function generateRenewalListPDF(soci, renewalYear) {
  // Crea documento PDF
  const doc = createPDFDocument()

  // Header
  const headerY = addPDFHeader(doc, 'Lista Rinnovi Annuali', `Anno ${renewalYear}`)

  // Prepara i dati per la tabella
  const tableData = soci
    .sort((a, b) => a.cognome.localeCompare(b.cognome))
    .map((socio) => {
      // Calcola gli arretrati
      const anniPagati = socio.tesseramenti.map((t) => t.anno)
      const anniArretrati = []

      let annoPrimaIscrizione = socio.data_prima_iscrizione
      if (!annoPrimaIscrizione && anniPagati.length > 0) {
        annoPrimaIscrizione = Math.min(...anniPagati)
      }

      if (annoPrimaIscrizione) {
        for (let anno = annoPrimaIscrizione; anno < renewalYear; anno++) {
          if (!anniPagati.includes(anno)) {
            // Check if exempt (minor)
            if (!isExemptFromPayment(socio, anno)) {
              anniArretrati.push(anno)
            }
          }
        }
      }

      return [
        `${socio.cognome} ${socio.nome}`,
        socio.gruppo_appartenenza || '-',
        anniArretrati.length > 0 ? anniArretrati.join(', ') : '-',
        '', // Colonna vuota per scrivere a mano
      ]
    })

  // Configurazione tabella
  const headers = [
    { text: 'Cognome e Nome', width: 80 },
    { text: 'Gruppo', width: 40 },
    { text: 'Arretrati', width: 70 },
    { text: `Pagato ${renewalYear}`, width: 50 },
  ]

  // Crea tabella
  createPDFTable(doc, headers, tableData, headerY + 10)

  // Footer
  addPDFFooter(doc)

  // Salva il PDF
  const filename = generatePDFFilename('lista_rinnovi', { renewalYear })
  doc.save(filename)
}

/**
 * Generates a PDF with a single member card using PDF template
 * @param {Object} socio - Member object
 * @param {number} renewalYear - The year for the card
 * @returns {Promise<void>}
 */
export async function generateSingleCardPDF(socio, renewalYear) {
  try {
    // Carica il PDF template dal database
    const pdfTemplateData = await getSetting('cardTemplatePDF')
    if (!pdfTemplateData) {
      throw new Error('Nessun template PDF configurato. Carica un template PDF nelle impostazioni.')
    }

    // Converti i dati del template in Uint8Array
    const templateBytes = new Uint8Array(pdfTemplateData)

    // Carica il PDF template
    const templateDoc = await PDFDocument.load(templateBytes)

    // Crea un nuovo documento basato sul template
    const pdfDoc = await PDFDocument.create()

    // Copia la prima pagina del template
    const [templatePage] = await pdfDoc.copyPages(templateDoc, [0])
    pdfDoc.addPage(templatePage)

    // Ottieni la pagina per aggiungere il testo
    const page = pdfDoc.getPages()[0]
    const { width, height } = page.getSize()

    // Formatta la data come nel componente Vue
    const formattaData = (dataNascita) => {
      if (!dataNascita) return ''
      const [anno, mese, giorno] = dataNascita.split('-')
      const mesi = [
        'Gennaio',
        'Febbraio',
        'Marzo',
        'Aprile',
        'Maggio',
        'Giugno',
        'Luglio',
        'Agosto',
        'Settembre',
        'Ottobre',
        'Novembre',
        'Dicembre',
      ]
      const meseNome = mesi[parseInt(mese) - 1]
      return `${parseInt(giorno)} ${meseNome} ${anno}`
    }

    const nomeCognome = `${socio.cognome} ${socio.nome}`
    const dataNascitaFormattata = formattaData(socio.data_nascita)

    // Calcola le dimensioni dell'area di testo (stesso calcolo di TesseraTemplate.vue)
    // Padding: 12mm sopra/sotto, 15% sinistra/destra per forzare wrapping
    const paddingTopBottom = 12 * 2.83465 // 12mm in punti
    const paddingLeftRightPercent = 0.15 // 15% per area di testo più stretta
    const availableWidth = width * (1 - 2 * paddingLeftRightPercent) // 70% della larghezza

    // Centro dell'area di testo
    const textAreaCenterX = width / 2
    const textAreaTop = paddingTopBottom
    const textAreaBottom = height - paddingTopBottom
    const textAreaCenterY = (textAreaTop + textAreaBottom) / 2

    const nameFontSize = 5 * 2.83465 // 5mm font size for names
    const dateFontSize = 4.5 * 2.83465 // 4.5mm font size for dates
    const lineSpacing = 3 * 2.83465 // 3mm gap tra righe
    const nameMinLineHeight = 8 * 2.83465 // 8mm min-height per name line
    const dateMinLineHeight = 6 * 2.83465 // 6mm min-height per date line

    // Font - usa Times-Italic per imitare scrittura a penna
    const font = await pdfDoc.embedFont('Times-Italic')

    // Funzione per wrapping del testo
    const wrapText = (text, maxWidth, font, size) => {
      const words = text.split(' ')
      const lines = []
      let currentLine = ''

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const textWidth = font.widthOfTextAtSize(testLine, size)

        if (textWidth <= maxWidth && currentLine) {
          currentLine = testLine
        } else if (textWidth <= maxWidth) {
          currentLine = word
        } else {
          if (currentLine) {
            lines.push(currentLine)
          }
          currentLine = word
        }
      }

      if (currentLine) {
        lines.push(currentLine)
      }

      return lines
    }

    // Gestisci il nome e cognome con wrapping se necessario
    const nomeLines = wrapText(nomeCognome, availableWidth, font, nameFontSize)
    const dataLines = wrapText(dataNascitaFormattata, availableWidth, font, dateFontSize)

    // Calcola l'altezza totale del contenuto (nome + gap + data)
    const nomeHeight = nomeLines.length * nameMinLineHeight
    const dataHeight = dataLines.length * dateMinLineHeight
    const gapHeight = lineSpacing
    const totalContentHeight = nomeHeight + gapHeight + dataHeight

    // Posizione Y iniziale (centrata verticalmente nell'area di testo)
    let currentY = textAreaCenterY + totalContentHeight / 2 - nameMinLineHeight / 2

    // Disegna le righe del nome (dall'alto verso il basso)
    for (let i = 0; i < nomeLines.length; i++) {
      const textWidth = font.widthOfTextAtSize(nomeLines[i], nameFontSize)
      const x = textAreaCenterX - textWidth / 2 // Centra manualmente

      page.drawText(nomeLines[i], {
        x: x,
        y: currentY,
        size: nameFontSize,
        font: font,
        color: rgb(0, 0, 0),
      })
      currentY -= nameMinLineHeight
    }

    // Aggiungi il gap tra nome e data
    currentY -= lineSpacing

    // Disegna le righe della data
    for (let i = 0; i < dataLines.length; i++) {
      const textWidth = font.widthOfTextAtSize(dataLines[i], dateFontSize)
      const x = textAreaCenterX - textWidth / 2 // Centra manualmente

      page.drawText(dataLines[i], {
        x: x,
        y: currentY,
        size: dateFontSize,
        font: font,
        color: rgb(0, 0, 0),
      })
      currentY -= dateMinLineHeight
    }

    // Salva il PDF
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })

    // Scarica il PDF
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = sanitizeFilename(`tessera_${socio.cognome}_${socio.nome}_${renewalYear}.pdf`)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Errore nella generazione del PDF della tessera:', error)
    throw error
  }
}

/**
 * Generates a SINGLE PDF with all member cards alphabetically using PDF template
 * @param {Array} soci - Array of member objects
 * @param {number} renewalYear - The year for the cards
 * @param {Function} onProgress - Callback function for progress updates
 * @returns {Promise<Array>} Array with single PDF result containing filename and blob
 */
export async function generateAllCardsPDF(soci, renewalYear, onProgress = () => {}) {
  try {
    // Carica il PDF template dal database
    const pdfTemplateData = await getSetting('cardTemplatePDF')
    if (!pdfTemplateData) {
      throw new Error('Nessun template PDF configurato. Carica un template PDF nelle impostazioni.')
    }

    // Converti i dati del template in Uint8Array
    const templateBytes = new Uint8Array(pdfTemplateData)

    // Carica il PDF template
    const templateDoc = await PDFDocument.load(templateBytes)

    // Crea un UNICO nuovo documento per tutte le tessere
    const pdfDoc = await PDFDocument.create()

    // Font - usa Times-Italic (caricato una volta sola per tutto il documento)
    const font = await pdfDoc.embedFont('Times-Italic')

    // Ordina i soci per cognome
    const sociOrdinati = soci.sort((a, b) => a.cognome.localeCompare(b.cognome))

    const totaleSoci = sociOrdinati.length

    // Ciclo unico su tutti i soci ordinati
    for (let i = 0; i < totaleSoci; i++) {
      const socio = sociOrdinati[i]

      // Copia la prima pagina del template per ogni tessera
      const [templatePage] = await pdfDoc.copyPages(templateDoc, [0])
      pdfDoc.addPage(templatePage)

      // Ottieni la pagina corrente (l'ultima aggiunta) per aggiungere il testo
      const page = pdfDoc.getPages()[i]
      const { width, height } = page.getSize()

      // Formatta la data come nel componente Vue
      const formattaData = (dataNascita) => {
        if (!dataNascita) return ''
        const [anno, mese, giorno] = dataNascita.split('-')
        const mesi = [
          'Gennaio',
          'Febbraio',
          'Marzo',
          'Aprile',
          'Maggio',
          'Giugno',
          'Luglio',
          'Agosto',
          'Settembre',
          'Ottobre',
          'Novembre',
          'Dicembre',
        ]
        const meseNome = mesi[parseInt(mese) - 1]
        return `${parseInt(giorno)} ${meseNome} ${anno}`
      }

      const nomeCognome = `${socio.cognome} ${socio.nome}`
      const dataNascitaFormattata = formattaData(socio.data_nascita)

      // Calcola le dimensioni dell'area di testo (stesso calcolo di TesseraTemplate.vue)
      // Padding: 12mm sopra/sotto, 15% sinistra/destra per forzare wrapping
      const paddingTopBottom = 12 * 2.83465 // 12mm in punti
      const paddingLeftRightPercent = 0.15 // 15% per area di testo più stretta
      const availableWidth = width * (1 - 2 * paddingLeftRightPercent) // 70% della larghezza

      // Centro dell'area di testo
      const textAreaCenterX = width / 2
      const textAreaTop = paddingTopBottom
      const textAreaBottom = height - paddingTopBottom
      const textAreaCenterY = (textAreaTop + textAreaBottom) / 2

      const nameFontSize = 5 * 2.83465 // 5mm font size for names
      const dateFontSize = 4.5 * 2.83465 // 4.5mm font size for dates
      const lineSpacing = 3 * 2.83465 // 3mm gap tra righe
      const nameMinLineHeight = 8 * 2.83465 // 8mm min-height per name line
      const dateMinLineHeight = 6 * 2.83465 // 6mm min-height per date line

      // Funzione per wrapping del testo
      const wrapText = (text, maxWidth, font, size) => {
        const words = text.split(' ')
        const lines = []
        let currentLine = ''

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word
          const textWidth = font.widthOfTextAtSize(testLine, size)

          if (textWidth <= maxWidth && currentLine) {
            currentLine = testLine
          } else if (textWidth <= maxWidth) {
            currentLine = word
          } else {
            if (currentLine) {
              lines.push(currentLine)
            }
            currentLine = word
          }
        }

        if (currentLine) {
          lines.push(currentLine)
        }

        return lines
      }

      // Gestisci il nome e cognome con wrapping se necessario
      const nomeLines = wrapText(nomeCognome, availableWidth, font, nameFontSize)
      const dataLines = wrapText(dataNascitaFormattata, availableWidth, font, dateFontSize)

      // Calcola l'altezza totale del contenuto (nome + gap + data)
      const nomeHeight = nomeLines.length * nameMinLineHeight
      const dataHeight = dataLines.length * dateMinLineHeight
      const gapHeight = lineSpacing
      const totalContentHeight = nomeHeight + gapHeight + dataHeight

      // Posizione Y iniziale (centrata verticalmente nell'area di testo)
      let currentY = textAreaCenterY + totalContentHeight / 2 - nameMinLineHeight / 2

      // Disegna le righe del nome (dall'alto verso il basso)
      for (let j = 0; j < nomeLines.length; j++) {
        const textWidth = font.widthOfTextAtSize(nomeLines[j], nameFontSize)
        const x = textAreaCenterX - textWidth / 2 // Centra manualmente

        page.drawText(nomeLines[j], {
          x: x,
          y: currentY,
          size: nameFontSize,
          font: font,
          color: rgb(0, 0, 0),
        })
        currentY -= nameMinLineHeight
      }

      // Aggiungi il gap tra nome e data
      currentY -= lineSpacing

      // Disegna le righe della data
      for (let k = 0; k < dataLines.length; k++) {
        const textWidth = font.widthOfTextAtSize(dataLines[k], dateFontSize)
        const x = textAreaCenterX - textWidth / 2 // Centra manualmente

        page.drawText(dataLines[k], {
          x: x,
          y: currentY,
          size: dateFontSize,
          font: font,
          color: rgb(0, 0, 0),
        })
        currentY -= dateMinLineHeight
      }

      // Aggiorna progresso
      const progress = ((i + 1) / totaleSoci) * 100
      onProgress(progress)
    }

    // Salva il PDF unico completo
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })

    // Genera il nome file unico
    const fileName = sanitizeFilename(
      `tessere_complete_${renewalYear}_${new Date().toISOString().split('T')[0]}.pdf`,
    )

    // Ritorna un array con un solo elemento (per compatibilità)
    return [{
      letter: 'ALL', // Identificativo generico
      filename: fileName,
      blob: blob,
      count: totaleSoci,
    }]

  } catch (error) {
    console.error('Errore nella generazione del PDF delle tessere:', error)
    throw error
  }
}

/**
 * Generates a PDF with new members list for a specific year
 * @param {Array} newMembers - Array of new members
 * @param {number} year - The year for the report
 * @param {string} ageCategory - The age category filter applied
 * @returns {Promise<Object>} Result object with success status and blob or error
 */
export async function generateNewMembersPDF(newMembers, year, ageCategory = 'tutti') {
  try {
    if (!newMembers || newMembers.length === 0) {
      throw new Error('No new members to export')
    }

    // Crea documento PDF
    const doc = createPDFDocument()

    // Header
    const ageCategoryText =
      {
        tutti: 'Tutti',
        maggiorenni: 'Maggiorenni',
        minorenni: 'Minorenni',
      }[ageCategory] || 'Tutti'

    const headerY = addPDFHeader(
      doc,
      `Nuovi Soci ${year} - ${ageCategoryText}`,
      `Elenco dei nuovi iscritti per l'anno ${year}`,
      `Totale nuovi soci: ${newMembers.length}`,
    )

    // Prepara i dati per la tabella
    const tableData = newMembers
      .sort((a, b) => a.cognome.localeCompare(b.cognome))
      .map((member) => [
        `${member.cognome} ${member.nome}`,
        member.data_nascita || '-',
        member.gruppo_appartenenza || '-',
        member.primo_anno,
      ])

    // Configurazione tabella
    const headers = [
      { text: 'Cognome e Nome', width: 70 },
      { text: 'Data Nascita', width: 40 },
      { text: 'Gruppo', width: 40 },
      { text: 'Anno', width: 30 },
    ]

    // Crea tabella
    createPDFTable(doc, headers, tableData, headerY + 10)

    // Footer
    addPDFFooter(doc)

    // Genera filename e output
    const filename = generatePDFFilename('nuovi_soci', { year, ageCategory })

    doc.save(filename)

    return {
      success: true,
      blob: doc.output('blob'),
      filename,
      totalMembers: newMembers.length,
    }
  } catch (error) {
    console.error('Error generating new members PDF:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Generates a PDF with complete payment list
 * @param {Array} payments - Array of payments with member info
 * @param {string} ageCategory - The age category filter applied
 * @returns {Promise<Object>} Result object with success status and blob or error
 */
export async function generateCompletePaymentListPDF(payments, ageCategory = 'tutti') {
  try {
    if (!payments || payments.length === 0) {
      throw new Error('Nessun pagamento da esportare')
    }

    // Crea documento PDF
    const doc = createPDFDocument()

    // Header
    const ageCategoryText =
      {
        tutti: 'Tutti',
        maggiorenni: 'Maggiorenni',
        minorenni: 'Minorenni',
      }[ageCategory] || 'Tutti'

    const headerY = addPDFHeader(
      doc,
      `Lista Completa Pagamenti - ${ageCategoryText}`,
      'Tutti i pagamenti registrati',
      `Totale pagamenti: ${payments.length}`,
    )

    // Prepara i dati per la tabella
    const tableData = payments.map((payment) => [
      `${payment.socio.cognome} ${payment.socio.nome}`,
      payment.anno.toString(),
      payment.data_pagamento || '-',
      payment.quota_pagata ? `€ ${payment.quota_pagata.toFixed(2)}` : '-',
      payment.numero_ricevuta?.toString() || '-',
      payment.numero_blocchetto?.toString() || '-',
    ])

    // Configurazione tabella
    const headers = [
      { text: 'Socio', width: 70 },
      { text: 'Anno', width: 20 },
      { text: 'Data', width: 30 }, // Shortened label
      { text: 'Quota', width: 25 },
      { text: 'Ric.', width: 20 }, // Shortened
      { text: 'Bloc.', width: 20 }, // Shortened
    ]

    // Crea tabella
    createPDFTable(doc, headers, tableData, headerY + 10, 8)

    // Footer
    addPDFFooter(doc)

    // Genera filename e output
    const filename = generatePDFFilename('lista_completa_pagamenti', { ageCategory })

    doc.save(filename)

    return {
      success: true,
      blob: doc.output('blob'),
      filename,
      totalPayments: payments.length,
    }
  } catch (error) {
    console.error('Errore nella generazione del PDF lista completa pagamenti:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Generates a PDF with members by group
 * @param {Array} members - Array of members by group
 * @param {string} gruppo - The group filter applied
 * @param {string} ageCategory - The age category filter applied
 * @param {string} paymentStatus - The payment status filter applied
 * @returns {Promise<Object>} Result object with success status and blob or error
 */
export async function generateMembersByGroupPDF(members, gruppo, ageCategory, paymentStatus) {
  try {
    if (!members || members.length === 0) {
      throw new Error('Nessun socio da esportare')
    }

    // Crea documento PDF
    const doc = createPDFDocument()

    // Header
    const groupText = gruppo && gruppo !== 'Tutti' ? gruppo : 'Tutti i Gruppi'
    const ageText =
      {
        tutti: 'Tutti',
        maggiorenni: 'Maggiorenni',
        minorenni: 'Minorenni',
      }[ageCategory] || 'Tutti'
    const statusText =
      {
        tutti: 'Tutti',
        in_regola: 'In Regola',
        non_in_regola: 'Non in Regola',
      }[paymentStatus] || 'Tutti'

    const headerY = addPDFHeader(
      doc,
      `Soci per Gruppo: ${groupText}`,
      `${ageText} - Stato Pagamento: ${statusText}`,
      `Totale soci: ${members.length}`,
    )

    // Prepara i dati per la tabella
    const tableData = members.map((member) => [
      `${member.cognome} ${member.nome}`,
      member.gruppo_appartenenza || '-',
      member.data_nascita || '-',
      // Show only last 5 years to save space
      member.anni_pagati?.slice(-5).join(', ') || '-',
      member.in_regola ? 'In Regola' : 'Da Regolarizzare',
    ])

    // Configurazione tabella
    const headers = [
      { text: 'Socio', width: 70 }, // Increased from 50
      { text: 'Gruppo', width: 30 },
      { text: 'Data Nascita', width: 30 }, // Reduced slightly
      { text: 'Ultimi Pagamenti', width: 50 }, // Renamed and content limited
      { text: 'Stato (Corrente)', width: 35 }, // Renamed for clarity
    ]

    // Crea tabella
    createPDFTable(doc, headers, tableData, headerY + 10, 8)

    // Footer
    addPDFFooter(doc)

    // Genera filename e output
    const filename = generatePDFFilename('soci_per_gruppo', {
      gruppo: gruppo || 'tutti',
      ageCategory,
      paymentStatus,
    })

    // === MODIFICA: AGGIUNTO IL COMANDO DI SALVATAGGIO ===
    // Questo forza il browser a scaricare il file
    doc.save(filename)
    // ====================================================

    return {
      success: true,
      blob: doc.output('blob'),
      filename,
      totalMembers: members.length,
    }
  } catch (error) {
    console.error('Errore nella generazione del PDF soci per gruppo:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Generates a PDF with the count of members by group for a specific year
 * @param {Array} countsData - Array of { group, count } objects
 * @param {number} year - The year for the report
 * @returns {Promise<Object>} Result object with success status and blob or error
 */
export async function generateGroupCountsPDF(countsData, year) {
  try {
    if (!countsData || countsData.length === 0) {
      throw new Error('Nessun dato da esportare')
    }

    // Crea documento PDF
    const doc = createPDFDocument('landscape')

    // Calcola totale
    const totalMembers = countsData.reduce((sum, item) => sum + item.count, 0)

    // Header
    const headerY = addPDFHeader(
      doc,
      `Riepilogo Iscritti per Gruppo`,
      `Anno ${year}`,
      `Totale complessivo: ${totalMembers}`,
    )

    // Configurazione tabella multi-colonna per risparmiare spazio verticale
    // Dividiamo i dati in 3 colonne
    const itemsPerColumn = Math.ceil(countsData.length / 3)
    const col1Data = countsData.slice(0, itemsPerColumn)
    const col2Data = countsData.slice(itemsPerColumn, itemsPerColumn * 2)
    const col3Data = countsData.slice(itemsPerColumn * 2)

    // Normalizziamo le righe per avere la stessa lunghezza
    const rows = []
    for (let i = 0; i < itemsPerColumn; i++) {
        const row = []

        // Colonna 1
        if (col1Data[i]) {
            row.push(col1Data[i].group)
            row.push(col1Data[i].count.toString())
        } else {
            row.push('')
            row.push('')
        }

        // Colonna 2
        if (col2Data[i]) {
            row.push(col2Data[i].group)
            row.push(col2Data[i].count.toString())
        } else {
            row.push('')
            row.push('')
        }

        // Colonna 3
        if (col3Data[i]) {
            row.push(col3Data[i].group)
            row.push(col3Data[i].count.toString())
        } else {
            row.push('')
            row.push('')
        }

        rows.push(row)
    }

    const headers = [
      { text: 'Gruppo', width: 65 },
      { text: 'N.', width: 15 },
      { text: 'Gruppo', width: 65 },
      { text: 'N.', width: 15 },
      { text: 'Gruppo', width: 65 },
      { text: 'N.', width: 15 },
    ]

    // Crea tabella compatta
    createPDFTable(doc, headers, rows, headerY + 10, 7) // 7mm row height for compactness

    // Footer
    addPDFFooter(doc)

    // Genera filename e output
    const filename = generatePDFFilename('riepilogo_gruppi', { year })

    doc.save(filename)

    return {
      success: true,
      blob: doc.output('blob'),
      filename,
      totalGroups: countsData.length,
    }
  } catch (error) {
    console.error('Errore nella generazione del PDF riepilogo gruppi:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}


/**
 * Export all data to Excel format with multiple worksheets
 * @returns {Promise<void>}
 */
export async function exportDataToExcel() {
  try {
    // Recupera tutti i dati
    const [soci, tesseramenti] = await Promise.all([exportAllSoci(), exportAllTesseramenti()])

    const currentYear = new Date().getFullYear()

    // Crea mappe per lookup efficiente
    const tesseramentiBySocio = tesseramenti.reduce((acc, tess) => {
      if (!acc[tess.id_socio]) acc[tess.id_socio] = []
      acc[tess.id_socio].push(tess)
      return acc
    }, {})

    // Calcola l'età per ogni socio
    const calculateAge = (birthDateString) => {
      if (!birthDateString) return null
      try {
        const birthDate = new Date(birthDateString)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        return age
      } catch {
        return null
      }
    }

    // Prepara i dati per ogni foglio
    const sheetsData = {
      Maggiorenni: [],
      Minorenni: [],
      'Nuovi Maggiorenni': [],
      'Nuovi Minorenni': [],
    }

    soci.forEach((socio) => {
      const tessSocio = tesseramentiBySocio[socio.id] || []
      const eta = calculateAge(socio.data_nascita)
      const primoAnno = tessSocio.length > 0 ? Math.min(...tessSocio.map((t) => t.anno)) : null
      const isNuovo = primoAnno === currentYear

      const socioData = {
        Cognome: socio.cognome || '',
        Nome: socio.nome || '',
        'Data Nascita': socio.data_nascita || '',
        'Luogo Nascita': socio.luogo_nascita || '',
        Età: eta,
        Gruppo: socio.gruppo_appartenenza || '',
        'Primo Anno': primoAnno,
        'Anni Tesseramento': tessSocio
          .map((t) => t.anno)
          .sort()
          .join(', '),
        'Totale Pagamenti': tessSocio.length,
      }

      if (eta >= 18) {
        if (isNuovo) {
          sheetsData['Nuovi Maggiorenni'].push(socioData)
        } else {
          sheetsData['Maggiorenni'].push(socioData)
        }
      } else {
        if (isNuovo) {
          sheetsData['Nuovi Minorenni'].push(socioData)
        } else {
          sheetsData['Minorenni'].push(socioData)
        }
      }
    })

    // Crea il workbook
    const workbook = XLSX.utils.book_new()

    // Aggiungi ogni foglio
    Object.entries(sheetsData).forEach(([sheetName, data]) => {
      if (data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(data)
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      }
    })

    // Genera il file e avvia il download
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `ceraiolo_dati_${timestamp}.xlsx`
    XLSX.writeFile(workbook, filename)
  } catch (error) {
    console.error('Errore esportazione Excel:', error)
    throw new Error(`Errore durante l'esportazione Excel: ${error.message}`)
  }
}
