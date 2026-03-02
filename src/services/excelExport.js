import * as XLSX from 'xlsx'

/**
 * Esporta un array di oggetti in un file Excel (.xlsx)
 * @param {Array<Object>} data L'array di dati da esportare
 * @param {string} filename Il nome del file (senza estensione)
 * @param {string} sheetName Il nome del foglio di lavoro
 */
export function exportToExcel(data, filename = 'export', sheetName = 'Dati') {
  if (!data || data.length === 0) {
    console.warn('Nessun dato da esportare in Excel.')
    return
  }

  // Crea un nuovo workbook e un nuovo worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)

  // Aggiungi il worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Genera il file e forzane il download
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
