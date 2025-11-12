import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'
import { getSetting, exportAllSoci, exportAllTesseramenti } from './db'

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
    doc.text(header.text, colPositions[index] + 2, currentY + 7)
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

      if (cellText.length > 15 && maxWidth < 50) {
        // Testo lungo, tronca
        doc.text(cellText.substring(0, 12) + '...', colPositions[cellIndex] + 2, currentY + 7)
      } else if (cellText.includes('\n') || cellText.length > 20) {
        // Testo multi-riga
        const lines = doc.splitTextToSize(cellText, maxWidth)
        doc.text(lines, colPositions[cellIndex] + 2, currentY + 5)
      } else {
        // Testo normale
        doc.text(cellText, colPositions[cellIndex] + 2, currentY + 7)
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
 * Creates a DOM element with the TesseraTemplate styles applied
 * @param {Object} socio - Member object
 * @param {string} backgroundImage - Background image URL
 * @returns {Promise<HTMLElement>} DOM element with the card content
 */
async function createCardElement(socio, backgroundImage = null) {
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

  // Crea il container con gli stili esatti del componente TesseraTemplate
  const container = document.createElement('div')
  container.innerHTML = `
    <div style="
      width: 80.77mm;
      height: 122.17mm;
      perspective: 1000px;
      font-family: cursive;
    ">
      <div style="
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        justify-content: center;
        align-items: center;
        ${backgroundImage ? `background-image: url(${backgroundImage});` : ''}
      ">
        <div style="
          display: flex;
          flex-direction: column;
          gap: 3mm;
          text-align: center;
          padding: 5mm 5% 5mm 5%;
          width: 100%;
          box-sizing: border-box;
        ">
          <div class="info-value name" style="
            font-size: 6mm;
            color: #000000;
            font-weight: 600;
            min-height: 8mm;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${nomeCognome}
          </div>
          <div class="info-value birthdate" style="
            font-size: 6mm;
            color: #000000;
            font-weight: 600;
            min-height: 8mm;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${dataNascitaFormattata}
          </div>
        </div>
      </div>
    </div>
  `

  // Ritorna l'elemento della tessera
  return container.firstElementChild
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
              anniArretrati.push(anno)
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
      { text: 'Cognome e Nome', width: 60 },
      { text: 'Gruppo', width: 40 },
      { text: 'Arretrati', width: 80 },
      { text: `Pagato ${renewalYear}`, width: 60 },
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
  const renewalYear = new Date().getFullYear() + 1
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
            anniArretrati.push(anno)
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
    { text: 'Cognome e Nome', width: 60 },
    { text: 'Gruppo', width: 40 },
    { text: 'Arretrati', width: 80 },
    { text: `Pagato ${renewalYear}`, width: 60 },
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
 * Generates a PDF with a single member card using direct canvas drawing
 * @param {Object} socio - Member object
 * @param {number} renewalYear - The year for the card
 * @returns {Promise<void>}
 */
export async function generateSingleCardPDF(socio, renewalYear) {
  const cardBackground = await getSetting('cardBackground')

  // Dimensioni originali di TesseraTemplate.vue (80.77mm x 122.17mm)
  const cardWidthMm = 80.77
  const cardHeightMm = 122.17

  // Converti mm in pixel per il canvas (1mm ≈ 3.78px a 96 DPI)
  const cardWidthPx = Math.round(cardWidthMm * 3.78)
  const cardHeightPx = Math.round(cardHeightMm * 3.78)

  // Crea PDF con formato personalizzato - dimensioni esatte della tessera
  const doc = new jsPDF({
    orientation: cardWidthMm > cardHeightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [cardWidthMm, cardHeightMm], // Dimensioni esatte senza margini
  })

  try {
    // Crea un canvas per disegnare la tessera
    const canvas = document.createElement('canvas')
    canvas.width = cardWidthPx
    canvas.height = cardHeightPx
    const ctx = canvas.getContext('2d')

    // Sfondo bianco
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, cardWidthPx, cardHeightPx)

    // Disegna l'immagine di sfondo se presente
    if (cardBackground) {
      await new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          // Calcola le dimensioni per mantenere le proporzioni e coprire tutto
          const imgAspect = img.width / img.height
          const canvasAspect = cardWidthPx / cardHeightPx

          let drawWidth, drawHeight, drawX, drawY

          if (imgAspect > canvasAspect) {
            // Immagine più larga del canvas
            drawHeight = cardHeightPx
            drawWidth = drawHeight * imgAspect
            drawX = (cardWidthPx - drawWidth) / 2
            drawY = 0
          } else {
            // Immagine più alta del canvas
            drawWidth = cardWidthPx
            drawHeight = drawWidth / imgAspect
            drawX = 0
            drawY = (cardHeightPx - drawHeight) / 2
          }

          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
          resolve()
        }
        img.onerror = reject
        img.src = cardBackground
      })
    }

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

    // Imposta il font e lo stile del testo
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 24px cursive' // 6mm ≈ 24px
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const nomeCognome = `${socio.cognome} ${socio.nome}`
    const dataNascitaFormattata = formattaData(socio.data_nascita)

    // Calcola le posizioni Y per centrare il testo
    const centerY = cardHeightPx / 2
    const textSpacing = 12 // Spazio tra le righe (3mm ≈ 12px)

    // Disegna il nome e cognome
    ctx.fillText(nomeCognome, cardWidthPx / 2, centerY - textSpacing)

    // Disegna la data di nascita
    ctx.fillText(dataNascitaFormattata, cardWidthPx / 2, centerY + textSpacing)

    // Converti il canvas in immagine e aggiungila al PDF
    const imgData = canvas.toDataURL('image/png')
    doc.addImage(imgData, 'PNG', 0, 0, cardWidthMm, cardHeightMm)

    // Salva il PDF
    const fileName = sanitizeFilename(`tessera_${socio.cognome}_${socio.nome}_${renewalYear}.pdf`)
    doc.save(fileName)
  } catch (error) {
    console.error('Errore nella generazione del PDF della tessera:', error)
    throw error
  }
}

/**
 * Generates a PDF with all member cards - one card per page
 * @param {Array} soci - Array of member objects
 * @param {number} renewalYear - The year for the cards
 * @param {Function} onProgress - Callback function for progress updates
 * @returns {Promise<void>}
 */
export async function generateAllCardsPDF(soci, renewalYear, onProgress = () => {}) {
  const cardBackground = await getSetting('cardBackground')

  // Dimensioni fisse originali del TesseraTemplate (80.77mm x 122.17mm)
  const cardWidthMm = 80.77
  const cardHeightMm = 122.17

  // Crea PDF con formato personalizzato - dimensioni esatte della tessera
  const doc = new jsPDF({
    orientation: cardWidthMm > cardHeightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [cardWidthMm, cardHeightMm], // Dimensioni esatte senza margini
  })

  let cardIndex = 0

  // Crea un elemento DOM temporaneo per renderizzare le tessere
  const tempContainer = document.createElement('div')
  tempContainer.style.position = 'absolute'
  tempContainer.style.left = '-9999px'
  tempContainer.style.top = '-9999px'
  document.body.appendChild(tempContainer)

  try {
    for (const socio of soci) {
      // Crea la tessera usando il componente Vue TesseraTemplate
      const tesseraElement = await createCardElement(socio, cardBackground)
      tempContainer.appendChild(tesseraElement)

      // Converti in immagine ad alta qualità
      const canvas = await html2canvas(tesseraElement, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: 'transparent',
        scale: 4, // Aumentato da 2 a 4 per migliore qualità dell'immagine
        imageTimeout: 0,
        logging: false,
        foreignObjectRendering: true, // Migliora il rendering delle immagini
      })

      // Ogni tessera è su una pagina separata
      if (cardIndex > 0) {
        doc.addPage()
      }

      // Posiziona l'immagine esattamente agli angoli del PDF (nessun margine)
      const x = 0
      const y = 0

      // Aggiungi l'immagine al PDF con le dimensioni esatte
      const imgData = canvas.toDataURL('image/png')
      doc.addImage(imgData, 'PNG', x, y, cardWidthMm, cardHeightMm)

      // Rimuovi l'elemento temporaneo
      tempContainer.removeChild(tesseraElement)

      cardIndex++

      // Aggiorna il progresso
      const progress = (cardIndex / soci.length) * 100
      onProgress(progress)
    }

    // Salva il PDF
    const fileName = sanitizeFilename(
      `tessere_${renewalYear}_${new Date().toISOString().split('T')[0]}.pdf`,
    )
    doc.save(fileName)
  } finally {
    // Pulisci il container temporaneo
    document.body.removeChild(tempContainer)
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
      `${payment.socio.cognome} ${payment.socio.nome}`.substring(0, 25),
      payment.anno.toString(),
      payment.data_pagamento || '-',
      payment.quota_pagata ? `€ ${payment.quota_pagata.toFixed(2)}` : '-',
      payment.numero_ricevuta?.toString() || '-',
      payment.numero_blocchetto?.toString() || '-',
    ])

    // Configurazione tabella
    const headers = [
      { text: 'Socio', width: 50 },
      { text: 'Anno', width: 20 },
      { text: 'Data Pagamento', width: 35 },
      { text: 'Quota', width: 30 },
      { text: 'Ricevuta', width: 25 },
      { text: 'Blocchetto', width: 25 },
    ]

    // Crea tabella
    createPDFTable(doc, headers, tableData, headerY + 10, 8)

    // Footer
    addPDFFooter(doc)

    // Genera filename e output
    const filename = generatePDFFilename('lista_completa_pagamenti', { ageCategory })

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
      `${member.cognome} ${member.nome}`.substring(0, 25),
      member.gruppo_appartenenza || '-',
      member.data_nascita || '-',
      member.anni_pagati?.join(', ') || '-',
      member.in_regola ? 'In Regola' : 'Da Regolarizzare',
    ])

    // Configurazione tabella
    const headers = [
      { text: 'Socio', width: 50 },
      { text: 'Gruppo', width: 30 },
      { text: 'Data Nascita', width: 35 },
      { text: 'Anni Pagati', width: 60 },
      { text: 'Stato', width: 30 },
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
