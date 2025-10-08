import jsPDF from 'jspdf'
import 'jspdf-autotable'

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
    const tableColumns = [
      { header: 'ID', dataKey: 'id' },
      { header: 'Cognome', dataKey: 'cognome' },
      { header: 'Nome', dataKey: 'nome' },
      { header: 'Data Nascita', dataKey: 'data_nascita' },
      { header: 'Età', dataKey: 'eta' },
      { header: 'Gruppo', dataKey: 'gruppo_appartenenza' },
    ]

    const tableRows = sociList.map(socio => ({
      id: socio.id,
      cognome: socio.cognome || '',
      nome: socio.nome || '',
      data_nascita: formatDate(socio.data_nascita),
      eta: calculateAge(socio.data_nascita),
      gruppo_appartenenza: socio.gruppo_appartenenza || '',
    }))

    // Add table
    doc.autoTable({
      columns: tableColumns,
      body: tableRows,
      startY: 50,
      margin: { top: 50 },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [183, 28, 28], // accent color
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        id: { cellWidth: 15 },
        cognome: { cellWidth: 35 },
        nome: { cellWidth: 35 },
        data_nascita: { cellWidth: 30 },
        eta: { cellWidth: 15 },
        gruppo_appartenenza: { cellWidth: 40 },
      },
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
      totalSoci: totalSoci
    }

  } catch (error) {
    console.error('Errore nella generazione del PDF:', error)
    return {
      success: false,
      error: error.message
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