/**
 * REPRO-BUG-03: Tripla frattura logica su Aventi Diritto al Voto
 * 
 * Posizione nel codice:
 * - src/services/db.js:1681-1711 (getVotingEligibleMembers - usata dal Quick Button "Elezioni" r. 1661)
 * - src/views/ReportsView.vue:2330-2385 (processedData - usata dal PDF Lab avanzato)
 * - src/views/ReportsView.vue:454 (Testo statutario visibile all'utente)
 * 
 * Descrizione:
 * Esiste una divergenza critica tra tre definizioni concorrenti dello status di elettore:
 * 1. db.js (Quick Button): verifica UNICAMENTE che il socio abbia pagato l'anno precedente (T-1)
 *    e che l'anno solare di nascita sia <= T - 18. Ignora i 5 anni precedenti e il giorno esatto di nascita.
 * 2. ReportsView.vue (PDF Lab): valuta giorno e mese esatti alla data delle elezioni,
 *    analizza una finestra di 4 anni (T-3 .. T) e produce stati distinti ('Sì', 'Regolarizza', 'No').
 * 3. Etichetta UI r. 454: dichiara all'utente che lo statuto richiede "quote in regola negli ultimi 5 anni".
 * Di conseguenza, l'elenco elettorale stampato con il pulsante rapido diverge dall'elenco del PDF Lab!
 */

import assert from 'node:assert/strict';

console.log('='.repeat(80));
console.log('REPRO-BUG-03: Tripla frattura logica su Aventi Diritto al Voto');
console.log('='.repeat(80));

// --- ALGORITMO 1: getVotingEligibleMembers (db.js:1681-1711) ---
function runDbJsAlgorithm(targetYear, soci, payments) {
  const previousYear = targetYear - 1;
  const adultBirthLimit = targetYear - 18;

  const prevYearPayments = payments.filter((p) => p.anno === previousYear);
  const paidMemberIds = new Set(prevYearPayments.map((p) => p.id_socio));

  return soci.filter((socio) => {
    // 1. Must have paid previous year check
    if (!paidMemberIds.has(socio.id)) return false;

    // 2. Must be adult check (per differenza di anno solare)
    if (!socio.data_nascita) return false;
    const birthYear = new Date(socio.data_nascita).getFullYear();
    return birthYear <= adultBirthLimit;
  });
}

// --- ALGORITMO 2: processedData (ReportsView.vue:2330-2385) ---
function runReportsViewAlgorithm(targetDateStr, soci, payments) {
  const targetDateObj = new Date(targetDateStr);
  const targetYear = targetDateObj.getFullYear();

  function getEnrollmentYear(member) {
    if (member.data_iscrizione) {
      return new Date(member.data_iscrizione).getFullYear();
    }
    const paidYears = member.tesseramenti?.map((t) => t.anno) || [];
    if (paidYears.length > 0) return Math.min(...paidYears);
    return new Date().getFullYear();
  }

  function isMinorInYear(member, year) {
    if (!member.data_nascita) return false;
    const birthYear = new Date(member.data_nascita).getFullYear();
    return year - birthYear < 18;
  }

  const results = [];

  soci.forEach((member) => {
    let aventeDiritto = true;
    let electionStatus = '';
    let motivoEsclusione = '';

    if (!member.data_nascita) {
      aventeDiritto = false;
      motivoEsclusione = 'Data di nascita mancante';
    } else {
      const birthDateObj = new Date(member.data_nascita);
      let ageAtTarget = targetYear - birthDateObj.getFullYear();
      const m = targetDateObj.getMonth() - birthDateObj.getMonth();
      if (m < 0 || (m === 0 && targetDateObj.getDate() < birthDateObj.getDate())) {
        ageAtTarget--;
      }
      if (ageAtTarget < 18) {
        aventeDiritto = false;
        motivoEsclusione = 'Minorenne alla data elettorale';
      }
    }

    const memberPayments = payments.filter((p) => p.id_socio === member.id);
    const paidYears = memberPayments.map((t) => t.anno);
    const enrollmentYear = getEnrollmentYear({ ...member, tesseramenti: memberPayments });

    if (aventeDiritto) {
      const windowStart = Math.max(targetYear - 3, enrollmentYear);
      const windowEnd = targetYear;
      const recentWindow = [];
      for (let y = windowStart; y <= windowEnd; y++) recentWindow.push(y);

      let E = null;
      for (const y of recentWindow) {
        if (paidYears.includes(y) || isMinorInYear(member, y)) {
          E = y;
          break;
        }
      }

      if (E === null) {
        electionStatus = 'no';
        motivoEsclusione = `Nessun pagamento registrato o valido nel periodo ${windowStart} - ${windowEnd}`;
      } else if (E === targetYear && !isMinorInYear(member, targetYear - 1)) {
        electionStatus = 'no';
        motivoEsclusione = `Socio rientrato nell'anno ${targetYear}`;
      } else {
        // Verifica buchi nella catena
        const missingYears = [];
        for (let y = E; y <= windowEnd; y++) {
          if (!paidYears.includes(y) && !isMinorInYear(member, y)) {
            missingYears.push(y);
          }
        }
        if (missingYears.length === 0) {
          electionStatus = 'si';
        } else if (missingYears.length === 1 && missingYears[0] === targetYear) {
          electionStatus = 'regolarizza';
        } else {
          electionStatus = 'no';
          motivoEsclusione = `Quote insolute: ${missingYears.join(', ')}`;
        }
      }
    } else {
      electionStatus = 'no';
    }

    results.push({
      socioId: member.id,
      nome: `${member.cognome} ${member.nome}`,
      electionStatus,
      motivoEsclusione,
      isDirectVoter: electionStatus === 'si',
    });
  });

  return results;
}

// --- CASI DI TEST SIGNIFICATIVI PER L'ANNO ELETTORALE 2026 (15 Maggio 2026) ---
const electionDate = '2026-05-15';
const electionYear = 2026;

const testSoci = [
  {
    id: 1,
    cognome: 'Ubaldi',
    nome: 'Gabriele',
    data_nascita: '2008-11-20', // Ha 17 anni e 5 mesi il 15/05/2026!
    data_prima_iscrizione: 2020,
  },
  {
    id: 2,
    cognome: 'Bettelli',
    nome: 'Marco',
    data_nascita: '1985-04-10', // Adulto 41 anni
    data_prima_iscrizione: 2015,
  },
  {
    id: 3,
    cognome: 'Fioriti',
    nome: 'Luca',
    data_nascita: '1990-08-12', // Adulto 35 anni
    data_prima_iscrizione: 2018,
  },
];

const testPayments = [
  // Socio 1: Ha pagato il 2025 (T-1)
  { id_socio: 1, anno: 2025, quota_pagata: 10 },

  // Socio 2: Ha pagato il 2025 (T-1), ma non ha ancora pagato il 2026
  { id_socio: 2, anno: 2025, quota_pagata: 10 },

  // Socio 3: Ha pagato regolarmente 2023, 2024, 2026 ma ha dimenticato il 2025 (T-1)
  { id_socio: 3, anno: 2023, quota_pagata: 10 },
  { id_socio: 3, anno: 2024, quota_pagata: 10 },
  { id_socio: 3, anno: 2026, quota_pagata: 10 },
];

console.log('\n[CONFRONTO RISULTATI DEI DUE ALGORITMI SU ELEZIONE 15/05/2026]');

const quickButtonEligible = runDbJsAlgorithm(electionYear, testSoci, testPayments);
const pdfLabResults = runReportsViewAlgorithm(electionDate, testSoci, testPayments);

console.log('\n1. Esito Algoritmo Quick Button (db.js:1681 - Filtro T-1 e anno solare):');
quickButtonEligible.forEach((s) => console.log(`   - ID ${s.id}: ${s.cognome} ${s.nome} -> ELEGGIBILE (VOTA)`));

console.log('\n2. Esito Algoritmo PDF Lab (ReportsView.vue:2330 - Finestra 4 anni e data esatta):');
pdfLabResults.forEach((r) =>
  console.log(`   - ID ${r.socioId}: ${r.nome} -> Stato: ${r.electionStatus.toUpperCase()} (${r.motivoEsclusione || 'In regola'})`),
);

// --- DIMOSTRAZIONE DELLE FRATTURE ---

// Frattura A: Ubaldi Gabriele (minorenne nato a novembre 2008)
const ubaldiQuick = quickButtonEligible.some((s) => s.id === 1);
const ubaldiLab = pdfLabResults.find((r) => r.socioId === 1);
console.log('\nAnalisi Caso 1 (Ubaldi Gabriele, nato 20/11/2008, elezioni 15/05/2026):');
console.log(`- Quick Button (db.js): ${ubaldiQuick ? 'ELEGGIBILE' : 'ESCLUSO'}`);
console.log(`- PDF Lab (ReportsView): ${ubaldiLab.electionStatus} (${ubaldiLab.motivoEsclusione})`);
assert.equal(ubaldiQuick, true, 'db.js considera Ubaldi maggiorenne per differenza di anni solari 2026-2008 = 18');
assert.equal(ubaldiLab.electionStatus, 'no', 'ReportsView riconosce che il 15 maggio ha ancora 17 anni');

// Frattura B: Bettelli Marco (in db.js è elettore a pieno titolo, in ReportsView deve regolarizzare)
const bettelliQuick = quickButtonEligible.some((s) => s.id === 2);
const bettelliLab = pdfLabResults.find((r) => r.socioId === 2);
console.log('\nAnalisi Caso 2 (Bettelli Marco, ha pagato solo 2025, non 2026):');
console.log(`- Quick Button (db.js): ${bettelliQuick ? 'ELEGGIBILE' : 'ESCLUSO'}`);
console.log(`- PDF Lab (ReportsView): ${bettelliLab.electionStatus} (${bettelliLab.motivoEsclusione || 'necessita rinnovo 2026'})`);
assert.equal(bettelliQuick, true, 'db.js lo ammette direttamente come votante senza vincoli');
assert.equal(bettelliLab.electionStatus, 'regolarizza', 'ReportsView lo blocca in stato Regolarizza');

// Frattura C: Fioriti Luca (in regola nel 2023, 2024, 2026, ma manca il 2025)
const fioritiQuick = quickButtonEligible.some((s) => s.id === 3);
const fioritiLab = pdfLabResults.find((r) => r.socioId === 3);
console.log('\nAnalisi Caso 3 (Fioriti Luca, pagati 2023, 2024, 2026, manca 2025):');
console.log(`- Quick Button (db.js): ${fioritiQuick ? 'ELEGGIBILE' : 'ESCLUSO'}`);
console.log(`- PDF Lab (ReportsView): ${fioritiLab.electionStatus} (${fioritiLab.motivoEsclusione})`);
assert.equal(fioritiQuick, false, 'db.js lo esclude categoricamente per mancato pagamento T-1');
assert.equal(fioritiLab.electionStatus, 'no', 'ReportsView indica il mancato pagamento del 2025');

console.log('\n' + '='.repeat(80));
console.log('[CONFERMATO] BUG-03 RIPRODOTTO CON SUCCESSO:');
console.log('- db.js ammette minorenni che compiono 18 anni dopo la data elettorale (Ubaldi ammesso da db.js, respinto da ReportsView).');
console.log('- db.js considera Bettelli votante a pieno titolo, mentre ReportsView lo etichetta Regolarizza.');
console.log('- ReportsView applica regole a 4 anni incompatibili con db.js (1 anno T-1) e con l etichetta statutaria a 5 anni.');
console.log('='.repeat(80));
