/**
 * REPRO-BUG-11: Discrepanza calcolo età (anno solare in payment.js vs data esatta in export.js)
 * 
 * Posizione nel codice:
 * - src/utils/payment.js:11-17 (calculateAgeInYear)
 * A confronto con:
 * - src/services/export.js:1887-1901 (calculateAge in exportToExcel)
 * 
 * Descrizione:
 * Nel gestionale convivono due formule matematiche discordanti per determinare la maggiore età:
 * 1. In `payment.js` (usato da flussi di cassa, quote e tesseramento):
 *    l'età è calcolata come mera differenza di anno solare (`year - birthDate.getFullYear()`).
 *    Chiunque sia nato nel 2008 è considerato diciottenne a partire dal 1° gennaio 2026.
 * 2. In `export.js` (usato per l'esportazione contabile in fogli di calcolo Excel):
 *    l'età è calcolata confrontando giorno e mese esatti con la data odierna (`today`).
 * Di conseguenza, un ceraiolo nato il 15 novembre 2008, durante la campagna tesseramento di maggio 2026:
 * - Nell'interfaccia utente (BatchEntry / AddPaymentModal) risulta MAGGIORENNE (età 18, quota intera, non esente);
 * - Nell'esportazione Excel (exportToExcel) viene inserito nel foglio "MINORENNI" con età 17!
 */

import assert from 'node:assert/strict';

console.log('='.repeat(80));
console.log('REPRO-BUG-11: Discrepanza calcolo età (payment.js:11 vs export.js:1887)');
console.log('='.repeat(80));

// 1. Formula estratta da src/utils/payment.js:11-17
function calculateAgeInYear_PaymentJs(birthDateString, year) {
  if (!birthDateString) return 99;
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return 99;
  return year - birthDate.getFullYear();
}

function isExemptFromPayment_PaymentJs(socio, year) {
  const age = calculateAgeInYear_PaymentJs(socio.data_nascita, year);
  return age < 18;
}

// 2. Formula estratta da src/services/export.js:1887-1901
function calculateAge_ExportJs(birthDateString, referenceDate = new Date()) {
  if (!birthDateString) return null;
  try {
    const birthDate = new Date(birthDateString);
    const today = referenceDate;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

// Scenario di test:
// Un giovane ceraiolo nato il 15 novembre 2008.
// La campagna di tesseramento e la Festa dei Ceri si svolgono il 15 maggio 2026.
const birthDateStr = '2008-11-15';
const campaignYear = 2026;
const festadeiCeriDate = new Date('2026-05-15T12:00:00Z');

console.log('[PROFILO SOCIO]');
console.log(`- Data di nascita: ${birthDateStr}`);
console.log(`- Anno di tesseramento: ${campaignYear}`);
console.log(`- Data operativa (Festa dei Ceri): 15 Maggio 2026`);

// Calcolo con payment.js
const ageInPaymentJs = calculateAgeInYear_PaymentJs(birthDateStr, campaignYear);
const isExempt = isExemptFromPayment_PaymentJs({ data_nascita: birthDateStr }, campaignYear);

// Calcolo con export.js al 15 maggio 2026
const ageInExportJs = calculateAge_ExportJs(birthDateStr, festadeiCeriDate);

console.log('\n[CONFRONTO RISULTATI DEI DUE MODULI]');
console.log(`1. src/utils/payment.js (UI / Calcolo quote e cassa):`);
console.log(`   - Età calcolata: ${ageInPaymentJs} anni`);
console.log(`   - Classificazione: ${ageInPaymentJs >= 18 ? 'MAGGIORENNE' : 'MINORENNE'}`);
console.log(`   - Esente da pagamento: ${isExempt}`);

console.log(`2. src/services/export.js (Esportazione Excel societario):`);
console.log(`   - Età calcolata: ${ageInExportJs} anni`);
console.log(`   - Foglio Excel di destinazione: ${ageInExportJs >= 18 ? 'Maggiorenni' : 'Minorenni'}`);

// Verifiche formali:
// In payment.js è 18 anni (maggiorenne)
assert.equal(ageInPaymentJs, 18, 'payment.js calcola 18 anni');
assert.equal(isExempt, false, 'payment.js lo considera non esente (adulto)');

// In export.js è 17 anni (minorenne)
assert.equal(ageInExportJs, 17, 'export.js calcola 17 anni');

// Discrepanza insanabile nello stesso archivio
assert.notEqual(ageInPaymentJs, ageInExportJs, 'Le due formule producono età contrastanti');

console.log('\n' + '='.repeat(80));
console.log('[CONFERMATO] BUG-11 RIPRODOTTO CON SUCCESSO:');
console.log('- Il socio nato a novembre 2008 ha 18 anni per payment.js ma 17 anni per export.js a maggio 2026.');
console.log('- In inserimento quote viene trattato da adulto non esente (10€/25€).');
console.log('- Nell esportazione Excel ufficiale finisce nel foglio "Minorenni" con età 17.');
console.log('='.repeat(80));
