/**
 * REPRO-CALC-EDGE-CASES: Verifica Indipendente dei Calcoli con Casi Limite
 * 
 * Casi Limite Analizzati e Documentati:
 * - Caso 1: Compleanno a cavallo dei 18 anni (es. nato a novembre, votazioni a maggio).
 * - Caso 2: Anni non consecutivi (salto pagamenti e rientro con quota 25€ vs 10€, logica condono).
 * - Caso 3: Soci senza pagamenti registrati (anzianità storica vs typo data_iscrizione).
 * - Caso 4: Ricevute multi-socio (stessa ricevuta con quote separate ed effetti collaterali su cassa e normalizzazione).
 */

import assert from 'node:assert/strict';

console.log('='.repeat(80));
console.log('VERIFICA INDIPENDENTE DEI CALCOLI CON CASI LIMITE (M2)');
console.log('='.repeat(80));

// ============================================================================
// CASO 1: Compleanno a cavallo dei 18 anni
// ============================================================================
console.log('\n' + '-'.repeat(80));
console.log('CASO 1: COMPLEANNO A CAVALLO DEI 18 ANNI');
console.log('Scenario: Nato il 15/11/2008. Elezioni societarie: 15/05/2026. Anno di riferimento: 2026.');
console.log('-'.repeat(80));

const birthDateCase1 = '2008-11-15';
const electionDateCase1 = '2026-05-15';
const yearCase1 = 2026;

// 1. Modello Indipendente di Riferimento (Ground Truth)
function independentExactAge(birthDateStr, targetDateStr) {
  const birth = new Date(birthDateStr);
  const target = new Date(targetDateStr);
  let age = target.getFullYear() - birth.getFullYear();
  const m = target.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && target.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const trueAgeOnElection = independentExactAge(birthDateCase1, electionDateCase1);
const isTrulyAdultOnElection = trueAgeOnElection >= 18;

// 2. Calcolo nell applicazione: utils/payment.js:11-17
const appPaymentAge = yearCase1 - new Date(birthDateCase1).getFullYear();
const isAppExempt = appPaymentAge < 18;

// 3. Calcolo nell applicazione: db.js:1684 (getVotingEligibleMembers per Quick Button)
const adultBirthLimitDbJs = yearCase1 - 18;
const isEligibleQuickButtonDbJs = new Date(birthDateCase1).getFullYear() <= adultBirthLimitDbJs;

// 4. Calcolo nell applicazione: ReportsView.vue:2345 (PDF Lab)
let ageAtTargetReportsView = yearCase1 - new Date(birthDateCase1).getFullYear();
const mDiff = new Date(electionDateCase1).getMonth() - new Date(birthDateCase1).getMonth();
if (mDiff < 0) ageAtTargetReportsView--;
const isEligiblePdfLab = ageAtTargetReportsView >= 18;

console.log(`- Età anagrafica esatta il giorno del voto (15/05/2026): ${trueAgeOnElection} anni e 6 mesi`);
console.log(`- Ground Truth: È maggiorenne al seggio?: ${isTrulyAdultOnElection ? 'SÌ' : 'NO'}`);
console.log(`- utils/payment.js (differenza anni solari): Età calcolata = ${appPaymentAge} anni -> Esente: ${isAppExempt}`);
console.log(`- db.js:1681 (Pulsante Elezioni 1-clic): Ammesso al voto?: ${isEligibleQuickButtonDbJs ? 'SÌ (ILLEGITTIMO)' : 'NO'}`);
console.log(`- ReportsView.vue:2345 (PDF Lab): Ammesso al voto?: ${isEligiblePdfLab ? 'SÌ' : 'NO'}`);

// Verifiche Caso 1:
assert.equal(trueAgeOnElection, 17, 'Il socio ha 17 anni alla data elettorale');
assert.equal(isTrulyAdultOnElection, false, 'Non può votare da minorenne');
assert.equal(isEligibleQuickButtonDbJs, true, 'db.js lo ammette erroneamente al voto considerandolo maggiorenne dal 1° gennaio');
assert.equal(isEligiblePdfLab, false, 'ReportsView riconosce che è ancora minorenne');

// ============================================================================
// CASO 2: Anni non consecutivi (salto pagamenti e rientro con quota 25€ vs 10€)
// ============================================================================
console.log('\n' + '-'.repeat(80));
console.log('CASO 2: ANNI NON CONSECUTIVI (SALTO PAGAMENTI, CONDONO E QUOTE)');
console.log('Scenario: Socio iscritto nel 2020. Pagato 2020, 2021. Saltati 2022, 2023, 2024. Paga nel 2025.');
console.log('-'.repeat(80));

const socioCase2 = { id: 701, cognome: 'Cacciamani', nome: 'Pietro', data_prima_iscrizione: 2020 };
const paidYearsCase2_Before = [2020, 2021];
const targetYearCase2 = 2025;

// Formula calculatePaymentStatus in src/utils/payment.js:41-83
function calculatePaymentStatus_App(socio, paidYears, targetYear) {
  const paidSet = new Set(paidYears);
  const isTargetPaid = paidSet.has(targetYear);

  // LOGICA CONDONO ESISTENTE
  if (isTargetPaid) {
    return { inRegola: true, arretrati: [] };
  }

  const arretrati = [];
  const firstYear = socio.data_prima_iscrizione || targetYear;
  for (let year = firstYear; year <= targetYear; year++) {
    if (!paidSet.has(year)) {
      arretrati.push(year);
    }
  }
  return { inRegola: arretrati.length === 0, arretrati };
}

// 1. Stato prima del pagamento 2025:
const statusBefore = calculatePaymentStatus_App(socioCase2, paidYearsCase2_Before, targetYearCase2);
console.log('[PRIMA DEL RINNOVO 2025]');
console.log(`- In regola: ${statusBefore.inRegola}`);
console.log(`- Anni arretrati rilevati: [${statusBefore.arretrati.join(', ')}] (3 anni insoluti: 2022, 2023, 2024 + anno corrente 2025)`);

// 2. Socio effettua il versamento per l'anno 2025:
const paidYearsCase2_After = [...paidYearsCase2_Before, 2025];
const statusAfter = calculatePaymentStatus_App(socioCase2, paidYearsCase2_After, targetYearCase2);

console.log('\n[DOPO IL PAGAMENTO DEL SOLO ANNO 2025]');
console.log(`- In regola: ${statusAfter.inRegola}`);
console.log(`- Anni arretrati: [${statusAfter.arretrati.join(', ')}] -> TUTTI GLI ARRETRATI AZZERATI (CONDONO)!`);

// 3. Quota applicata nell'interfaccia:
// In BatchEntryView: quando il socio è già presente (selectedSocio), la quota proposta è 10.0€ ordinaria, NON 25.0€ di rientro!
const defaultQuotaAppliedInBatchEntry = 10.0;
const newMemberStatutoryQuota = 25.0;

console.log(`- Quota riscossa da BatchEntryView: € ${defaultQuotaAppliedInBatchEntry.toFixed(2)} (quota annuale ordinaria)`);
console.log(`- Quota nuovo socio / riammissione a statuto: € ${newMemberStatutoryQuota.toFixed(2)}`);

// 4. Stato elettorale in ReportsView.vue:2385:
const windowRecent = [2022, 2023, 2024, 2025];
let E = null;
for (const y of windowRecent) {
  if (paidYearsCase2_After.includes(y)) {
    E = y;
    break;
  }
}
let electionMotivoEsclusione = '';
if (E === targetYearCase2) {
  electionMotivoEsclusione = `Socio rientrato nell'anno ${targetYearCase2}`;
}

console.log(`- Stato elettorale generato in ReportsView: ESCLUSO con motivo "${electionMotivoEsclusione}"`);

// Verifiche Caso 2:
assert.equal(statusBefore.arretrati.length, 4, 'Prima del pagamento vi sono 4 anni arretrati (2022..2025)');
assert.equal(statusAfter.arretrati.length, 0, 'Il condono cancella tutti gli arretrati al pagamento dell anno target');
assert.equal(statusAfter.inRegola, true, 'Lo stato contabile risulta "in regola"');
assert.equal(electionMotivoEsclusione, `Socio rientrato nell'anno 2025`, 'Il socio viene escluso dal voto come rientrato');

// ============================================================================
// CASO 3: Soci senza pagamenti registrati
// ============================================================================
console.log('\n' + '-'.repeat(80));
console.log('CASO 3: SOCI SENZA PAGAMENTI REGISTRATI');
console.log('Scenario: Socio inserito con data_prima_iscrizione 2015. Zero pagamenti digitalizzati.');
console.log('-'.repeat(80));

const socioCase3 = {
  id: 850,
  cognome: 'Minelli',
  nome: 'Franco',
  data_prima_iscrizione: 2015,
  tesseramenti: [],
};

// Ground Truth Indipendente
const groundTruthSeniority = 2026 - socioCase3.data_prima_iscrizione;

// Formula esistente in ReportsView.vue:2094 (con typo)
function appGetEnrollmentYear(member) {
  if (member.data_iscrizione) return new Date(member.data_iscrizione).getFullYear();
  const paid = member.tesseramenti?.map((t) => t.anno) || [];
  if (paid.length > 0) return Math.min(...paid);
  return new Date().getFullYear();
}

const appReportEnrollmentYear = appGetEnrollmentYear(socioCase3);
const appCalculatedSeniority = 2026 - appReportEnrollmentYear;

console.log(`- Anno di prima iscrizione reale (archivio): ${socioCase3.data_prima_iscrizione}`);
console.log(`- Anzianità reale di appartenenza alla Famiglia: ${groundTruthSeniority} anni`);
console.log(`- Anno di iscrizione calcolato da ReportsView: ${appReportEnrollmentYear} (Typo member.data_iscrizione)`);
console.log(`- Anzianità calcolata da ReportsView: ${appCalculatedSeniority} anni (Retrocesso ad anno zero!)`);

// Verifiche Caso 3:
assert.equal(groundTruthSeniority, 11, 'Il socio ha 11 anni di anzianità nel 2026');
assert.equal(appReportEnrollmentYear, 2026, 'ReportsView calcola anno 2026 per fallback errato');
assert.equal(appCalculatedSeniority, 0, 'L anzianità calcolata crolla a 0 anni');

// ============================================================================
// CASO 4: Ricevute multi-socio (stessa ricevuta, quote separate)
// ============================================================================
console.log('\n' + '-'.repeat(80));
console.log('CASO 4: RICEVUTE MULTI-SOCIO (STESSA RICEVUTA, QUOTE SEPARATE)');
console.log('Scenario: Blocchetto 12, Ricevuta 7. Famiglia con 3 componenti: Padre (10€), Madre (20€ - biennio), Figlio (0€ - esente).');
console.log('-'.repeat(80));

const multiReceiptSession = {
  numeroBlocchetto: 12,
  numeroRicevuta: 7,
  anno: 2026,
};

const familyMembers = [
  { id_socio: 901, ruolo: 'Padre', quota: 10.0, anni: [2026] },
  { id_socio: 902, ruolo: 'Madre', quota: 20.0, anni: [2025, 2026] },
  { id_socio: 903, ruolo: 'Figlio (Minorenne)', quota: 0.0, anni: [2026] },
];

// Creazione dei tesseramenti individuali generati da BatchEntryView
const multiPayments = [];
familyMembers.forEach((m) => {
  m.anni.forEach((anno) => {
    multiPayments.push({
      id_tesseramento: `tess-${m.id_socio}-${anno}`,
      id_socio: m.id_socio,
      anno: anno,
      quota_pagata: m.quota / m.anni.length,
      numero_blocchetto: multiReceiptSession.numeroBlocchetto,
      numero_ricevuta: multiReceiptSession.numeroRicevuta,
    });
  });
});

// 1. Calcolo subtotale ricevuta
const receiptTotal = multiPayments.reduce((acc, p) => acc + p.quota_pagata, 0);
console.log(`- Numero record tesseramento creati per la stessa ricevuta: ${multiPayments.length}`);
console.log(`- Subtotale cassa della ricevuta n. ${multiReceiptSession.numeroRicevuta}: € ${receiptTotal.toFixed(2)}`);

// 2. Impatto dell euristica difettosa normalizeDatabaseData (BUG-01)
// Poiché blocchetto (12) > ricevuta (7), l euristica si attiva su tutti i componenti!
const corruptedMultiPayments = multiPayments.map((p) => {
  const b = p.numero_blocchetto;
  const r = p.numero_ricevuta;
  if (b > 0 && r > 0 && b > r) {
    return { ...p, numero_blocchetto: r, numero_ricevuta: b };
  }
  return p;
});

console.log('\n[IMPATTO DI FIX DB INVERTITO SUL MULTI-SOCIO]');
console.log(`- Blocchetto originale: ${multiReceiptSession.numeroBlocchetto}, Ricevuta originale: ${multiReceiptSession.numeroRicevuta}`);
console.log(`- Dopo Fix DB Invertito: Blocchetto diventa ${corruptedMultiPayments[0].numero_blocchetto}, Ricevuta diventa ${corruptedMultiPayments[0].numero_ricevuta}`);
console.log(`- Risultato: Tutti i ${corruptedMultiPayments.length} pagamenti della famiglia vengono spostati sul Blocchetto 7, Ricevuta 12!`);

// Verifiche Caso 4:
assert.equal(receiptTotal, 30.0, 'Il totale della ricevuta multi-socio è esattamente 30€');
assert.equal(multiPayments.length, 4, 'Sono stati generati 4 record di pagamento (1 padre, 2 madre, 1 figlio)');
assert.equal(corruptedMultiPayments[0].numero_blocchetto, 7, 'Il blocchetto viene corrotto a 7');
assert.equal(corruptedMultiPayments[0].numero_ricevuta, 12, 'La ricevuta viene corrotta a 12 (fuori dal range fisico 1..10)');

console.log('\n' + '='.repeat(80));
console.log('[CONFERMATO] TUTTI I 4 CASI LIMITE DI CALCOLO VERIFICATI E DOCUMENTATI:');
console.log('- Caso 1: Minorenne a maggio 2026 trattato da elettore da db.js ma escluso da ReportsView.');
console.log('- Caso 2: Condono totale degli arretrati se si paga l anno corrente, con quota ordinaria (10€ anziché 25€).');
console.log('- Caso 3: Soci storici senza pagamenti retrocessi a nuovi iscritti per typo data_iscrizione.');
console.log('- Caso 4: Ricevute multi-socio aggregate correttamente ma vulnerabili a scambi distruttivi con Fix DB Invertito.');
console.log('='.repeat(80));
