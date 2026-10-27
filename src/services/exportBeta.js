import logoUrl from '@/assets/logo_santantoniari.jpg';
import {
  addPDFFooter,
  addPDFHeader,
  addStatusLegend,
  cellaStatoAnno,
  createPDFDocument,
  createPDFTable,
  formatDate,
  generatePDFFilename,
  loadImage,
} from './export';

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
  if (reportConfig.display.baseColumns.includes('dirittoVoto')) reqWidth += 30;
  if (reportConfig.display.baseColumns.includes('motivoEsclusione')) reqWidth += 45;
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

  let startY = addPDFHeader(doc, reportTitle, filtersSummaryText, `Totale Risultati: ${data.length}`, logoData) + 6;

  if (reportConfig.display.yearColumns.length > 0) {
    startY = addStatusLegend(doc, startY);
  } else {
    startY += 4;
  }

  // Dynamically assemble headers
  const headers = [];
  if (reportConfig.display.baseColumns.includes('cognomeNome')) headers.push({ text: 'Socio', width: 50 });
  if (reportConfig.display.baseColumns.includes('gruppo')) headers.push({ text: 'Manicchia', width: 35 });
  if (reportConfig.display.baseColumns.includes('dataNascita')) headers.push({ text: 'Nascita', width: 22 });
  if (reportConfig.display.baseColumns.includes('eta')) headers.push({ text: 'Età', width: 25 });
  if (reportConfig.display.baseColumns.includes('dirittoVoto')) headers.push({ text: 'Diritto Voto', width: 30, align: 'center' });
  if (reportConfig.display.baseColumns.includes('motivoEsclusione')) headers.push({ text: 'Motivo Esclusione', width: 45 });

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
    if (reportConfig.display.baseColumns.includes('dirittoVoto')) {
      let vColor = [200, 50, 50]; // default 'no' red
      if (member.aventeDiritto === 'si') vColor = [0, 150, 0];
      else if (member.aventeDiritto === 'regolarizza') vColor = [217, 119, 6]; // orange #d97706
      row.push({ text: member.dirittoLabel || (member.aventeDiritto ? 'Sì' : 'No'), color: vColor });
    }
    if (reportConfig.display.baseColumns.includes('motivoEsclusione')) row.push(member.motivoEsclusione || '-');

    // Stato di ogni anno (V/X/O/-): regola in utils/payment.js
    const paidYears = member.tesseramenti?.map(t => t.anno) || [];
    sortedYearColumns.forEach(year => row.push(cellaStatoAnno(member, paidYears, year)));

    // Aggiungi lo spazio vuoto per la firma alla fine se selezionata
    if (reportConfig.display.baseColumns.includes('firma')) row.push(''); // Spazio vuoto per la firma

    return row;
  });
  createPDFTable(doc, headers, tableData, startY);
  addPDFFooter(doc);

  const filename = generatePDFFilename(fileBaseName, { timestamp: Date.now() });
  doc.save(filename);
  console.log(`[Beta PDF Export] Document saved: ${filename}`);
}
