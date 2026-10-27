import logoUrl from '@/assets/logo_santantoniari.jpg';
import {
  addPDFFooter,
  addPDFHeader,
  addStatusLegend,
  cellaStatoAnno,
  createPDFDocument,
  createPDFTable,
  generatePDFFilename,
  loadImage,
} from './export';
import { valoreCella } from '@/utils/reportSuMisura';

// Colori del diritto di voto nel PDF (stessi dell'elenco aventi diritto)
const COLORI_VOTO = { si: [0, 150, 0], regolarizza: [217, 119, 6], no: [200, 50, 50] };

// Larghezza utile di un A4 verticale con i margini: oltre si gira il foglio
const LARGHEZZA_VERTICALE = 180;

/**
 * Intestazioni e righe del PDF, nello stesso ordine di colonne dell'anteprima.
 * @param {Array<object>} righe schede di filtraSoci
 * @param {Array<object>} colonne di colonneReport
 */
export function tabellaReport(righe, colonne) {
  const headers = colonne.map((c) => ({
    text: c.label,
    width: c.pdf,
    ...(c.align ? { align: c.align } : {}),
    ...(c.anno ? { orientation: 'vertical' } : {}),
  }));
  const rows = righe.map((riga) =>
    colonne.map((c) => {
      if (c.anno) return cellaStatoAnno(riga.socio, riga.anniPagati, c.anno);
      const { testo, stato } = valoreCella(riga, c);
      if (c.chiave === 'dirittoVoto') return { text: testo, color: COLORI_VOTO[stato] };
      return testo;
    }),
  );
  return { headers, rows };
}

/**
 * Genera e scarica il PDF del report su misura.
 * @param {{ righe: Array<object>, colonne: Array<object>, titolo: string, riassunto: string }} report
 */
export async function generateBetaDynamicPDF({ righe, colonne, titolo, riassunto }) {
  const larghezza = colonne.reduce((somma, c) => somma + c.pdf, 0);
  const doc = createPDFDocument(larghezza > LARGHEZZA_VERTICALE ? 'landscape' : 'portrait');

  let logoData = null;
  try {
    logoData = await loadImage(logoUrl);
  } catch (e) {
    console.warn('Impossibile caricare il logo per il PDF', e);
  }

  let startY = addPDFHeader(doc, titolo, riassunto, `Soci nell'elenco: ${righe.length}`, logoData) + 6;
  startY = colonne.some((c) => c.anno) ? addStatusLegend(doc, startY) : startY + 4;

  const { headers, rows } = tabellaReport(righe, colonne);
  createPDFTable(doc, headers, rows, startY);
  addPDFFooter(doc);

  const nomeFile = titolo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  doc.save(generatePDFFilename(nomeFile || 'report_su_misura', { timestamp: Date.now() }));
}
