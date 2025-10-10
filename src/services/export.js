import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Formats a date for display
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
  if (!dateString) return 'N/D'

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

/**
 * Calculates age from birth date
 * @param {string} birthDateString - Birth date string
 * @returns {number|string} Age in years or empty string
 */
function calculateAge(birthDateString) {
  if (!birthDateString) return ''

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
    return ''
  }
}

/**
 * Generates a PDF with a table of members from the provided search results
 * @param {Array} sociList - Array of member objects from search results
 * @returns {Object} Result object with success status and blob or error
 */
export async function generateSociPDF(sociList) {
  try {
    if (!sociList || sociList.length === 0) {
      throw new Error('Nessun dato da esportare')
    }

    // Create new PDF document
    const doc = new jsPDF()

    // Add header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Elenco Soci - Ceraiolo Digitale', 20, 20)

    // Add generation date
    const generationDate = new Date().toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generato il: ${generationDate}`, 20, 30)

    // Summary info
    const totalSoci = sociList.length
    doc.text(`Totale soci esportati: ${totalSoci}`, 20, 40)

    // Prepare table data
    const tableData = sociList.map((socio) => [
      socio.id,
      socio.cognome || '',
      socio.nome || '',
      formatDate(socio.data_nascita),
      calculateAge(socio.data_nascita),
      socio.gruppo_appartenenza || '',
    ])

    // Genera tabella manuale
    const startY = 50
    const rowHeight = 8
    const colWidths = [15, 35, 35, 30, 15, 40] // Larghezze colonne
    const colPositions = [20, 35, 70, 105, 135, 150]

    // Intestazione
    doc.setFillColor(183, 28, 28) // Rosso
    doc.setTextColor(255) // Bianco
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')

    doc.rect(20, startY, 170, rowHeight, 'F') // Sfondo rosso
    doc.text('ID', colPositions[0] + 1, startY + 6)
    doc.text('Cognome', colPositions[1] + 1, startY + 6)
    doc.text('Nome', colPositions[2] + 1, startY + 6)
    doc.text('Data Nascita', colPositions[3] + 1, startY + 6)
    doc.text('Età', colPositions[4] + 1, startY + 6)
    doc.text('Gruppo', colPositions[5] + 1, startY + 6)

    // Righe dati con alternanza colori
    doc.setTextColor(0) // Nero
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)

    let currentY = startY + rowHeight
    tableData.forEach((row, index) => {
      // Alternanza righe: pari grigio chiaro, dispari bianco
      const isEvenRow = index % 2 === 0
      const fillColor = isEvenRow ? [248, 248, 248] : [255, 255, 255]
      doc.setFillColor(fillColor[0], fillColor[1], fillColor[2])
      doc.rect(20, currentY, 170, rowHeight, 'F')

      // Bordi sottili
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.3)
      doc.rect(20, currentY, 170, rowHeight)

      // Linee verticali delle colonne
      for (let i = 0; i < colPositions.length; i++) {
        const x = colPositions[i]
        doc.line(x, currentY, x, currentY + rowHeight)
      }
      // Linea verticale finale
      doc.line(
        colPositions[colPositions.length - 1] + colWidths[colWidths.length - 1],
        currentY,
        colPositions[colPositions.length - 1] + colWidths[colWidths.length - 1],
        currentY + rowHeight,
      )

      // Testo delle celle
      doc.text(String(row[0]), colPositions[0] + 1, currentY + 6)
      doc.text(row[1], colPositions[1] + 1, currentY + 6)
      doc.text(row[2], colPositions[2] + 1, currentY + 6)
      doc.text(row[3], colPositions[3] + 1, currentY + 6)
      doc.text(String(row[4]), colPositions[4] + 1, currentY + 6)
      doc.text(row[5], colPositions[5] + 1, currentY + 6)

      currentY += rowHeight

      // Se la pagina è piena, aggiungi una nuova pagina
      if (currentY > 270) {
        doc.addPage()
        currentY = 50

        // Ripeti intestazione su nuova pagina
        doc.setFillColor(183, 28, 28)
        doc.setTextColor(255)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.rect(20, currentY, 170, rowHeight, 'F')
        doc.text('ID', colPositions[0] + 1, currentY + 6)
        doc.text('Cognome', colPositions[1] + 1, currentY + 6)
        doc.text('Nome', colPositions[2] + 1, currentY + 6)
        doc.text('Data Nascita', colPositions[3] + 1, currentY + 6)
        doc.text('Età', colPositions[4] + 1, currentY + 6)
        doc.text('Gruppo', colPositions[5] + 1, currentY + 6)

        currentY += rowHeight
        doc.setTextColor(0)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
      }
    })

    // Add footer
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text('Sistema di gestione soci - Ceraiolo Digitale', 20, pageHeight - 20)

    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.text(`Pagina ${i} di ${pageCount}`, doc.internal.pageSize.width - 40, pageHeight - 20)
    }

    // Get PDF as blob
    const pdfOutput = doc.output('blob')

    return {
      success: true,
      blob: pdfOutput,
      filename: `elenco_soci_${new Date().toISOString().split('T')[0]}.pdf`,
      totalSoci: totalSoci,
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
  const result = await generateSociPDF(sociList)

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
  // Crea PDF in orizzontale (landscape) per più spazio
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  // Titolo
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Lista Rinnovi Annuali', 148, 20, { align: 'center' })
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(`Anno ${renewalYear}`, 148, 30, { align: 'center' })

  // Prepara i dati per la tabella
  const tableData = soci
    .sort((a, b) => a.cognome.localeCompare(b.cognome)) // Ordina alfabeticamente per cognome
    .map((socio) => {
      // Calcola gli arretrati (anni precedenti al rinnovo non pagati)
      const anniPagati = socio.tesseramenti.map((t) => t.anno)
      const anniArretrati = []

      // Trova l'anno di prima iscrizione
      let annoPrimaIscrizione = socio.data_prima_iscrizione
      if (!annoPrimaIscrizione && anniPagati.length > 0) {
        annoPrimaIscrizione = Math.min(...anniPagati)
      }

      // Calcola gli anni non pagati precedenti al rinnovo
      if (annoPrimaIscrizione) {
        for (let anno = annoPrimaIscrizione; anno < renewalYear; anno++) {
          if (!anniPagati.includes(anno)) {
            anniArretrati.push(anno)
          }
        }
      }

      return {
        nomeCompleto: `${socio.cognome} ${socio.nome}`,
        gruppo: socio.gruppo_appartenenza || '-',
        arretrati: anniArretrati.length > 0 ? anniArretrati.join(', ') : '-',
        pagato: '', // Colonna vuota per scrivere a mano
      }
    })

  // Configurazione tabella per landscape
  const startY = 40
  const rowHeight = 10 // Righe più alte per ospitare testo multi-riga
  const colWidths = [60, 40, 80, 60] // Larghezze colonne in landscape
  const colPositions = [20, 80, 120, 200]

  // Intestazione con colori accattivanti
  doc.setFillColor(183, 28, 28) // Rosso scuro
  doc.setTextColor(255) // Bianco
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')

  // Sfondo intestazione
  doc.rect(20, startY, 240, rowHeight, 'F')

  // Bordi intestazione
  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.5)
  doc.rect(20, startY, 240, rowHeight)

  // Testo intestazione
  doc.text('Cognome e Nome', colPositions[0] + 2, startY + 7)
  doc.text('Gruppo', colPositions[1] + 2, startY + 7)
  doc.text('Arretrati', colPositions[2] + 2, startY + 7)

  // Colonna "Pagato" con evidenziazione speciale
  doc.setFillColor(46, 125, 50) // Verde scuro per la colonna pagamento
  doc.rect(colPositions[3], startY, colWidths[3], rowHeight, 'F')
  doc.text(`Pagato ${renewalYear}`, colPositions[3] + 2, startY + 7)

  // Righe dati con alternanza colori
  doc.setTextColor(0) // Nero
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  let currentY = startY + rowHeight

  tableData.forEach((row, index) => {
    // Alternanza righe: pari grigio chiaro, dispari bianco
    const isEvenRow = index % 2 === 0
    const fillColor = isEvenRow ? [248, 248, 248] : [255, 255, 255] // Grigio chiarissimo per righe pari
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2])
    doc.rect(20, currentY, 240, rowHeight, 'F')

    // Bordi sottili per ogni cella
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)

    // Disegna le linee verticali delle colonne
    for (let i = 0; i < colPositions.length; i++) {
      const x = colPositions[i]
      doc.line(x, currentY, x, currentY + rowHeight)
    }
    // Linea verticale finale
    doc.line(
      colPositions[colPositions.length - 1] + colWidths[colWidths.length - 1],
      currentY,
      colPositions[colPositions.length - 1] + colWidths[colWidths.length - 1],
      currentY + rowHeight,
    )

    // Bordo orizzontale
    doc.rect(20, currentY, 240, rowHeight)

    // Testo delle celle con gestione word wrap per arretrati
    doc.text(row.nomeCompleto, colPositions[0] + 2, currentY + 7)

    doc.text(row.gruppo, colPositions[1] + 2, currentY + 7)

    // Arretrati con word wrap se necessario
    const arretratiText = row.arretrati
    if (arretratiText.length > 20) {
      // Se il testo è lungo, vai a capo
      const lines = doc.splitTextToSize(arretratiText, colWidths[2] - 4)
      doc.text(lines, colPositions[2] + 2, currentY + 5)
    } else {
      doc.text(arretratiText, colPositions[2] + 2, currentY + 7)
    }

    // Colonna pagamento con bordo più spesso per evidenziare
    doc.setDrawColor(46, 125, 50) // Verde scuro
    doc.setLineWidth(1)
    doc.rect(colPositions[3], currentY, colWidths[3], rowHeight)

    currentY += rowHeight

    // Se la pagina è piena (considerando il margine inferiore), aggiungi una nuova pagina
    if (currentY > 180) {
      // 180mm invece di 270 per landscape
      doc.addPage()
      currentY = 20

      // Ripeti intestazione su nuova pagina
      doc.setFillColor(183, 28, 28)
      doc.setTextColor(255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.rect(20, currentY, 240, rowHeight, 'F')
      doc.rect(20, currentY, 240, rowHeight)
      doc.text('Cognome e Nome', colPositions[0] + 2, currentY + 7)
      doc.text('Gruppo', colPositions[1] + 2, currentY + 7)
      doc.text('Arretrati', colPositions[2] + 2, currentY + 7)
      doc.setFillColor(46, 125, 50)
      doc.rect(colPositions[3], currentY, colWidths[3], rowHeight, 'F')
      doc.text(`Pagato ${renewalYear}`, colPositions[3] + 2, currentY + 7)

      currentY += rowHeight
      doc.setTextColor(0)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
    }
  })

  // Footer con data generazione
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128)
    doc.text(
      `Generato il ${new Date().toLocaleDateString('it-IT')} - Pagina ${i} di ${pageCount}`,
      148,
      200,
      { align: 'center' },
    )
  }

  // Salva il PDF
  const fileName = `lista_rinnovi_${renewalYear}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

/**
 * Generates a PDF with all member cards
 * @param {Array} soci - Array of member objects
 * @param {number} renewalYear - The year for the cards
 * @param {Function} onProgress - Callback function for progress updates
 * @returns {Promise<void>}
 */
export async function generateAllCardsPDF(soci, renewalYear, onProgress = () => {}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const cardsPerPage = 6 // 2 righe x 3 colonne
  let cardIndex = 0

  // Crea un elemento DOM temporaneo per renderizzare le tessere
  const tempContainer = document.createElement('div')
  tempContainer.style.position = 'absolute'
  tempContainer.style.left = '-9999px'
  tempContainer.style.top = '-9999px'
  document.body.appendChild(tempContainer)

  try {
    for (const socio of soci) {
      // Crea la tessera per questo socio
      const cardElement = document.createElement('div')
      cardElement.innerHTML = `
        <div style="
          width: 400px;
          height: 250px;
          background-color: white;
          border: 3px solid #333;
          border-radius: 15px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          font-family: Arial, sans-serif;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        ">
          <div style="display: flex; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #B71C1C; padding-bottom: 10px;">
            <div style="margin-right: 15px;">
              <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 0 L95 25 L95 75 L50 100 L5 75 L5 25 Z" fill="#1a1a1a" />
                <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" stroke-width="3" stroke="#B71C1C" />
                <text x="50" y="58" fill="#B71C1C" font-size="24" text-anchor="middle" font-weight="bold">S</text>
              </svg>
            </div>
            <div>
              <h1 style="font-size: 18px; margin: 0 0 5px 0; color: #1a1a1a; font-weight: bold;">Famiglia Sant'antoniari</h1>
              <h2 style="font-size: 14px; margin: 0; color: #B71C1C;">Tessera Annuale</h2>
            </div>
          </div>
          <div style="flex-grow: 1; display: flex; align-items: center;">
            <div style="width: 100%;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 5px 0;">
                <span style="font-weight: bold; color: #1a1a1a; font-size: 14px; min-width: 80px;">Socio:</span>
                <span style="color: #333; font-size: 14px; text-align: right; flex-grow: 1; border-bottom: 1px dotted #ccc; padding-bottom: 2px;">${socio.cognome} ${socio.nome}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 5px 0;">
                <span style="font-weight: bold; color: #1a1a1a; font-size: 14px; min-width: 80px;">Gruppo:</span>
                <span style="color: #333; font-size: 14px; text-align: right; flex-grow: 1; border-bottom: 1px dotted #ccc; padding-bottom: 2px;">${socio.gruppo_appartenenza || '-'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 5px 0;">
                <span style="font-weight: bold; color: #1a1a1a; font-size: 14px; min-width: 80px;">Anno:</span>
                <span style="color: #333; font-size: 14px; text-align: right; flex-grow: 1; border-bottom: 1px dotted #ccc; padding-bottom: 2px;">${renewalYear}</span>
              </div>
            </div>
          </div>
          <div style="border-top: 2px solid #B71C1C; padding-top: 10px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 3px 0;">Valida per l'anno ${renewalYear}</p>
            <p style="margin: 3px 0;">Firma del Responsabile ____________________</p>
          </div>
        </div>
      `
      tempContainer.appendChild(cardElement)

      // Converti in immagine
      const canvas = await html2canvas(cardElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      })

      // Calcola la posizione sulla pagina
      const pageIndex = Math.floor(cardIndex / cardsPerPage)
      if (cardIndex % cardsPerPage === 0) {
        if (pageIndex > 0) {
          doc.addPage()
        }
      }

      const cardsPerRow = 3
      const rowIndex = Math.floor((cardIndex % cardsPerPage) / cardsPerRow)
      const colIndex = (cardIndex % cardsPerPage) % cardsPerRow

      const margin = 10
      const cardWidth = 90 // mm
      const cardHeight = 60 // mm
      const x = margin + colIndex * (cardWidth + margin)
      const y = margin + rowIndex * (cardHeight + margin)

      // Aggiungi l'immagine al PDF
      const imgData = canvas.toDataURL('image/png')
      doc.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight)

      // Rimuovi l'elemento temporaneo
      tempContainer.removeChild(cardElement)

      cardIndex++

      // Aggiorna il progresso
      const progress = (cardIndex / soci.length) * 100
      onProgress(progress)
    }

    // Salva il PDF
    const fileName = `tessere_${renewalYear}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  } finally {
    // Pulisci il container temporaneo
    document.body.removeChild(tempContainer)
  }
}
