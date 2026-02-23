import jsPDF from 'jspdf';
import logoUrl from '@/assets/logo_santantoniari.jpg';

const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = reject;
    img.src = url;
  });
};

// Since we cannot alter the original export.js, we duplicate the essential PDF utility functions here
// to avoid altering production code while creating the beta feature.

function createPDFDocument(orientation = 'landscape', format = 'a4') {
  return new jsPDF({ orientation, unit: 'mm', format });
}

function addPDFHeader(doc, title, subtitle = '', summary = '', logoData = null) {
  let currentY = 20;

  // Wait, doc.internal.pageSize.width / 2 is the center
  const centerX = doc.internal.pageSize.width / 2;

  // Aggiungi Logo se presente
  if (logoData) {
    try {
      doc.addImage(logoData, 'JPEG', 10, 10, 25, 25);
    } catch (e) {
      console.error('Errore aggiunta logo al PDF', e);
    }
  }

  // Main title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, centerX, currentY, { align: 'center' });
  currentY += 10;

  // Subtitle (Dynamic Filters Summary)
  if (subtitle) {
    const maxW = doc.internal.pageSize.width - 80; // Margine maggiore per evitare il logo a sinistra
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    const splitSubtitle = doc.splitTextToSize(subtitle, maxW);
    doc.text(splitSubtitle, centerX, currentY, { align: 'center' });
    currentY += (splitSubtitle.length * 5) + 5;
    doc.setTextColor(0, 0, 0);
  }

  // Generation date
  const dateStr = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  doc.setFontSize(12);
  doc.text(`Generated on: ${dateStr}`, centerX, currentY, { align: 'center' });
  currentY += 10;

  // Summary
  if (summary) {
    doc.text(summary, centerX, currentY, { align: 'center' });
    currentY += 10;
  }

  return currentY;
}

function createPDFTable(doc, headers, rows, startY, rowHeight = 7) {
  const startX = 15; // Ridotto margine
  let tableWidth = 0;
  headers.forEach(h => { tableWidth += h.width; });
  const colPositions = [startX];
  headers.forEach((header, index) => {
    colPositions.push(colPositions[index] + header.width);
  });
  let currentY = startY;

  // Calculate header row height dynamically for vertical text
  let headerRowHeight = rowHeight;
  doc.setFontSize(9);
  headers.forEach(h => {
    if (h.orientation === 'vertical') {
      const textW = (doc.getStringUnitWidth(h.text) * 9) / doc.internal.scaleFactor;
      if (textW + 4 > headerRowHeight) headerRowHeight = textW + 4;
    }
  });

  const drawHeader = () => {
    doc.setFillColor(183, 28, 28);
    doc.setTextColor(255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.rect(startX, currentY, tableWidth, headerRowHeight, 'F');
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    doc.rect(startX, currentY, tableWidth, headerRowHeight);

    headers.forEach((header, index) => {
      let align = header.align || (header.width <= 25 ? 'center' : 'left');
      let textX = colPositions[index] + (align === 'center' ? header.width / 2 : 2);

      if (header.orientation === 'vertical') {
        // Rotated 90 degrees CCW (reads bottom-to-top)
        doc.text(header.text, textX + 1, currentY + headerRowHeight - 2, { angle: 90 });
      } else {
        doc.text(header.text, textX, currentY + headerRowHeight / 2 + 1.2, { align });
      }
    });
    currentY += headerRowHeight;
  };

  drawHeader();

  // Data rows
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8); // Font dati più compatto
  rows.forEach((row, rowIndex) => {
    const isEven = rowIndex % 2 === 0;
    const fill = isEven ? [248, 248, 248] : [255, 255, 255];
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.rect(startX, currentY, tableWidth, rowHeight, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);

    // Draw columns borders
    colPositions.forEach(x => { doc.line(x, currentY, x, currentY + rowHeight); });
    doc.rect(startX, currentY, tableWidth, rowHeight);

    // Apply text to cells
    row.forEach((cellValue, cellIndex) => {
      let cellText = '';
      let cellColor = null;
      if (typeof cellValue === 'object' && cellValue !== null) {
        cellText = String(cellValue.text || '');
        if (cellValue.color) cellColor = cellValue.color;
      } else {
        cellText = String(cellValue || '');
      }

      // Apply text color if specified
      if (cellColor) doc.setTextColor(cellColor[0], cellColor[1], cellColor[2]);
      else doc.setTextColor(0, 0, 0);

      let align = headers[cellIndex].align || (headers[cellIndex].width <= 25 ? 'center' : 'left');
      let textX = colPositions[cellIndex] + (align === 'center' ? headers[cellIndex].width / 2 : 2);

      const maxW = headers[cellIndex].width - 4;
      if (cellText.length > 20 || (doc.getStringUnitWidth(cellText) * doc.internal.getFontSize()) / doc.internal.scaleFactor > maxW) {
        // Multi-line wrap (fallback to left if wrapping)
        const lines = doc.splitTextToSize(cellText, maxW);
        const blockH = lines.length * 3.5;
        doc.text(lines, colPositions[cellIndex] + 2, currentY + (rowHeight - blockH) / 2 + 2.5);
      } else {
        // Single line
        doc.text(cellText, textX, currentY + rowHeight / 2 + 1.2, { align });
      }
      doc.setTextColor(0, 0, 0);
    });

    currentY += rowHeight;

    // Add page logic if bottom is reached
    const pageMaxHeight = doc.internal.pageSize.height - 35;
    if (currentY > pageMaxHeight) {
      doc.addPage();
      currentY = 20;
      drawHeader();
      doc.setTextColor(0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }
  });

  return currentY;
}

function addPDFFooter(doc) {
  const pageHeight = doc.internal.pageSize.height;
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Pagina ${i} di ${pageCount}`, doc.internal.pageSize.width - 40, pageHeight - 20);
  }
}

function sanitizeFilename(filename) {
  return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').substring(0, 255);
}

function generatePDFFilename(baseName, params = {}) {
  const parts = [baseName];
  Object.values(params).forEach(p => {
    if (p && p !== 'tutti' && p !== 'Tutti') parts.push(String(p).toLowerCase().replace(/\s+/g, '_'));
  });
  parts.push(new Date().toISOString().split('T')[0]);
  return sanitizeFilename(`${parts.join('_')}.pdf`);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const [y, m, d] = dateStr.split('-');
    if (y && m && d && y.length === 4) {
      return `${d}-${m}-${y}`;
    }
  } catch (e) {
    console.warn('Date formatting error:', e);
  }
  return dateStr;
}

function getAgeLabel(dateStr) {
  if (!dateStr) return '-';
  try {
    const birthDate = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18 ? 'Maggiorenne' : 'Minorenne';
  } catch (e) {
    console.warn('Age calculation error:', e);
    return '-';
  }
}

export async function generateBetaDynamicPDF(data, reportConfig, filtersSummaryText = '') {
  console.log('[Beta PDF Export] Initiating dynamic PDF generation...');

  // Smart Width Calculation for Landscape/Portrait
  let reqWidth = 0;
  if (reportConfig.display.baseColumns.includes('cognomeNome')) reqWidth += 50;
  if (reportConfig.display.baseColumns.includes('gruppo')) reqWidth += 35;
  if (reportConfig.display.baseColumns.includes('dataNascita')) reqWidth += 22;
  if (reportConfig.display.baseColumns.includes('eta')) reqWidth += 25;
  if (reportConfig.display.baseColumns.includes('firma')) reqWidth += 40;
  reqWidth += reportConfig.display.yearColumns.length * 6;

  // A4 portrait max usable width with 15mm margins is ~180mm.
  const doc = createPDFDocument(reqWidth > 180 ? 'landscape' : 'portrait');

  let logoData = null;
  try {
    logoData = await loadImage(logoUrl);
  } catch (e) {
    console.warn('Impossibile caricare il logo per il PDF', e);
  }
  // Creazione Titolo e Filename dinamico basato sui gruppi
  const activeGroups = reportConfig.filters?.groups || [];
  let reportTitle = 'Report Soci Personalizzato';
  let fileBaseName = 'beta_report_custom';

  if (activeGroups.length > 0) {
    if (activeGroups.length === 1) {
      reportTitle = `Report Manicchia ${activeGroups[0]}`;
      fileBaseName = `report_${activeGroups[0].toLowerCase()}`;
    } else {
      reportTitle = `Report Manicchie Multiple`;
      fileBaseName = `report_mute_multiple`;
    }
  }

  const headerY = addPDFHeader(doc, reportTitle, filtersSummaryText, `Totale Risultati: ${data.length}`, logoData);

  // Dynamically assemble headers
  const headers = [];
  if (reportConfig.display.baseColumns.includes('cognomeNome')) headers.push({ text: 'Socio', width: 50 });
  if (reportConfig.display.baseColumns.includes('gruppo')) headers.push({ text: 'Manicchia', width: 35 });
  if (reportConfig.display.baseColumns.includes('dataNascita')) headers.push({ text: 'Nascita', width: 22 });
  if (reportConfig.display.baseColumns.includes('eta')) headers.push({ text: 'Età', width: 25 });

  const sortedYearColumns = [...reportConfig.display.yearColumns].sort((a, b) => a - b);
  sortedYearColumns.forEach(year => {
    headers.push({ text: String(year), width: 6, orientation: 'vertical', align: 'center' });
  });

  // Aggiungi la firma alla fine se selezionata
  if (reportConfig.display.baseColumns.includes('firma')) headers.push({ text: 'Firma', width: 40 });

  // Dynamically assemble rows
  const tableData = data.map(member => {
    const row = [];
    if (reportConfig.display.baseColumns.includes('cognomeNome')) row.push(`${member.cognome} ${member.nome}`);
    if (reportConfig.display.baseColumns.includes('gruppo')) row.push(member.gruppo_appartenenza || '-');
    if (reportConfig.display.baseColumns.includes('dataNascita')) row.push(formatDate(member.data_nascita));
    if (reportConfig.display.baseColumns.includes('eta')) row.push(getAgeLabel(member.data_nascita));

    // Inject V/X with specific colors to match requested UI aesthetic
    const paidYears = member.tesseramenti?.map(t => t.anno) || [];
    sortedYearColumns.forEach(year => {
      if (paidYears.includes(year)) {
        row.push({ text: 'V', color: [0, 150, 0] });
      } else {
        row.push({ text: 'X', color: [200, 50, 50] });
      }
    });

    // Aggiungi lo spazio vuoto per la firma alla fine se selezionata
    if (reportConfig.display.baseColumns.includes('firma')) row.push(''); // Spazio vuoto per la firma

    return row;
  });

  createPDFTable(doc, headers, tableData, headerY + 10);
  addPDFFooter(doc);

  const filename = generatePDFFilename(fileBaseName, { timestamp: Date.now() });
  doc.save(filename);
  console.log(`[Beta PDF Export] Document saved: ${filename}`);
}
