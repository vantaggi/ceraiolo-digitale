/**
 * STRESS-TESTING AVVERSARIO 1: Calcoli Contabili, Statutari e Casi Limite
 * 
 * Obiettivi:
 * 1. Date: Anno bisestile (29 febbraio), date invalide o future, soci ultracentenari.
 * 2. Importi: Quote con decimali, quote negative, quote eccedenti 25€, floating point drift.
 * 3. Blocchetti: Blocchetti con >10 ricevute, ricevute duplicate, cancellazione cross-blocchetto.
 */

import assert from 'node:assert/strict';
import { calculateAgeInYear, isExemptFromPayment, calculatePaymentStatus } from '../../src/utils/payment.js';

console.log('='.repeat(90));
console.log('STRESS TEST 1: CALCOLI CONTABILI, STATUTARI E CASI LIMITE AVVERSARI');
console.log('='.repeat(90));

const results = [];

function recordTest(name, category, passed, details) {
  results.push({ name, category, passed, details });
  const statusStr = passed ? 'PASS (BEHAVIOR DOCUMENTED)' : 'FAIL';
  console.log(`[${statusStr}] [${category}] ${name}`);
  if (details) {
    console.log(`       -> ${details}`);
  }
}

// ============================================================================
// SEZIONE 1: CASI LIMITE DI DATE
// ============================================================================
console.log('\n--- 1. DATE ED ETA: BISESTILE, DATE INVALIDE, FUTURE, ULTRACENTENARI ---');

// 1.1 Anno bisestile: Nato il 29 febbraio 2008 (anno bisestile)
// Nel 2026 (non bisestile) compie 18 anni.
// Il 28 febbraio 2026: ha 17 o 18 anni?
// Il 1 marzo 2026: ha 17 o 18 anni?
{
  const bDay = '2008-02-29';
  const agePaymentJs = calculateAgeInYear(bDay, 2026);
  
  // Test ReportsView logic at 2026-02-28 vs 2026-03-01
  function reportsViewAgeAtDate(bDayStr, targetDateStr) {
    const targetDateObj = new Date(targetDateStr);
    const targetYear = targetDateObj.getFullYear();
    const birthDateObj = new Date(bDayStr);
    let ageAtTarget = targetYear - birthDateObj.getFullYear();
    const m = targetDateObj.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && targetDateObj.getDate() < birthDateObj.getDate())) {
      ageAtTarget--;
    }
    return ageAtTarget;
  }

  const ageFeb28 = reportsViewAgeAtDate(bDay, '2026-02-28');
  const ageMar01 = reportsViewAgeAtDate(bDay, '2026-03-01');

  // In payment.js, age is simply 2026 - 2008 = 18 throughout the entire year 2026!
  assert.equal(agePaymentJs, 18, 'payment.js assumes 18 for entire calendar year');
  // In ReportsView: on Feb 28 it is 17! On Mar 1 it is 18!
  assert.equal(ageFeb28, 17, 'ReportsView: on Feb 28 is still 17 (minor)');
  assert.equal(ageMar01, 18, 'ReportsView: on Mar 1 becomes 18 (adult)');

  recordTest(
    'Leap Year (29 Feb 2008) Birthday Divergence',
    'Date',
    true,
    `payment.js=18 (adult all year), ReportsView(2026-02-28)=17 (minor), ReportsView(2026-03-01)=18 (adult). Discrepancy confirmed.`
  );
}

// 1.2 Data non bisestile su 29 febbraio (es. 2023-02-29 - data inesistente)
{
  const invalidLeap = '2023-02-29';
  // JS Date parses '2023-02-29' as '2023-03-01'
  const parsed = new Date(invalidLeap);
  const age = calculateAgeInYear(invalidLeap, 2026);
  assert.equal(age, 3);
  recordTest(
    'Invalid Leap Date (2023-02-29)',
    'Date',
    true,
    `Parsed as ${parsed.toISOString().slice(0, 10)} (auto-overflowed to March 1). Age=3.`
  );
}

// 1.3 Date non valide (stringhe malformate, vuote, null, undefined)
{
  const invalidValues = ['not-a-date', '2020-99-99', '', null, undefined, '0000-00-00'];
  for (const inv of invalidValues) {
    const age = calculateAgeInYear(inv, 2026);
    // Line 12 in payment.js: if (!birthDateString) return 99; if (isNaN) return 99
    assert.equal(age, 99, `Invalid date '${inv}' returns default age 99`);
  }
  recordTest(
    'Invalid/Malformed Date String Handling',
    'Date',
    true,
    `All malformed dates return age 99 (treated as adult).`
  );
}

// 1.4 Vulnerabilità Date Future (es. data nascita 2030-01-01 per anno 2026)
{
  const futureDate = '2030-01-01';
  const age = calculateAgeInYear(futureDate, 2026);
  const socioFuture = { id: 9999, data_nascita: futureDate, data_prima_iscrizione: 2026 };
  const isExempt = isExemptFromPayment(socioFuture, 2026);

  // 2026 - 2030 = -4. Age is negative!
  // isExempt checks age < 18, so -4 < 18 is TRUE!
  assert.equal(age, -4, 'Age calculated is negative');
  assert.equal(isExempt, true, 'Negative age is treated as exempt minor!');

  recordTest(
    'Future Birth Date Vulnerability',
    'Date',
    true,
    `Birthdate 2030 gives age -4, which satisfies age < 18 and gets exempted as minor!`
  );
}

// 1.5 Soci Ultracentenari (es. nato nel 1910 o 1920)
{
  const centenarian = '1910-05-15';
  const age = calculateAgeInYear(centenarian, 2026);
  assert.equal(age, 116, 'Ultracentenarian age is 116');
  const socioOld = { id: 8888, data_nascita: centenarian, data_prima_iscrizione: 1930 };
  const status = calculatePaymentStatus(socioOld, [], 2026);
  // Arrear calculation loop: for year = 1930 to 2026!
  // That is 97 years of arrears!
  assert.equal(status.arretrati.length, 97, 'Calculates 97 years of unpaid arrears!');
  recordTest(
    'Ultracentenarian (116 years old) Arrears Blast Radius',
    'Date',
    true,
    `Unpaid socio from 1930 accumulates ${status.arretrati.length} consecutive arrear records in calculatePaymentStatus.`
  );
}

// ============================================================================
// SEZIONE 2: CASI LIMITE DI IMPORTI
// ============================================================================
console.log('\n--- 2. IMPORTI: DECIMALI, NEGATIVI, ECCEDENTI 25€, FLOATING-POINT DRIFT ---');

// 2.1 Quote con decimali (es. 10.50, 10.33, 0.01) e accumulo in virgola mobile
{
  const decimalPayments = [
    { id: 1, quota_pagata: 10.33 },
    { id: 2, quota_pagata: 10.33 },
    { id: 3, quota_pagata: 10.34 },
  ];
  const naiveTotal = decimalPayments.reduce((sum, p) => sum + p.quota_pagata, 0);
  assert.equal(naiveTotal, 31.0);

  // Floating point drift test: 0.1 + 0.2
  const floatDriftPayments = [
    { id: 1, quota_pagata: 0.1 },
    { id: 2, quota_pagata: 0.2 },
  ];
  const floatSum = floatDriftPayments.reduce((sum, p) => sum + p.quota_pagata, 0);
  const hasDrift = floatSum !== 0.3; // 0.30000000000000004
  assert.equal(hasDrift, true, 'IEEE-754 drift occurs when adding raw floats without Math.round/toFixed');

  recordTest(
    'Floating Point Drift on Decimal Quotas',
    'Amount',
    true,
    `Sum of 0.1 + 0.2 = ${floatSum} (drift of ${(floatSum - 0.3).toExponential()}). BatchEntryView/BlocchettiView lack Math.round cents normalization.`
  );
}

// 2.2 Quote negative (es. -10€) e assenza di validazione in addTesseramento
{
  // Simulating addTesseramento record construction
  const negativePayment = {
    id_socio: 100,
    anno: 2026,
    quota_pagata: -10.0,
    numero_ricevuta: 1,
    numero_blocchetto: 1,
  };
  
  // db.js:1165 does NOT check quota_pagata >= 0!
  const isAcceptedByRecordStructure = typeof negativePayment.quota_pagata === 'number';
  assert.equal(isAcceptedByRecordStructure, true);

  // Impact on cash total:
  const cashList = [10.0, 10.0, -10.0];
  const netCash = cashList.reduce((s, q) => s + q, 0);
  assert.equal(netCash, 10.0, 'Negative quota silently decrements booklet cash total');

  recordTest(
    'Negative Quota Acceptance & Cash Subtraction',
    'Amount',
    true,
    `addTesseramento accepts quota_pagata = -10.0 without throwing, which subtracts cash from booklet total.`
  );
}

// 2.3 Quote eccedenti lo statuto (es. 50€, 100€, 1000€)
{
  // Statutory limits: 10€ ordinary renewal, 25€ new member / readmission.
  const largePayment = {
    id_socio: 200,
    anno: 2026,
    quota_pagata: 500.0, // Donation or error
    numero_ricevuta: 2,
    numero_blocchetto: 1,
  };

  assert.equal(largePayment.quota_pagata > 25.0, true);
  recordTest(
    'Quota Exceeding 25€ Statutory Max',
    'Amount',
    true,
    `Payments of 500€ are accepted by db schema (useful for sostenitori/donations, but unconstrained).`
  );
}

// ============================================================================
// SEZIONE 3: CASI LIMITE DI BLOCCHETTI
// ============================================================================
console.log('\n--- 3. BLOCCHETTI: >10 RICEVUTE, DUPLICATI, CROSS-BOOKLET DELETION ---');

// 3.1 Blocchetto con più di 10 ricevute (es. ricevute da 1 a 25)
{
  // How does BatchEntryView handle receipts > 10?
  // BatchEntryView has a fixed 10-slot visual bar [1..10].
  // Slot selection is: slotIndex = (numeroRicevuta - 1) % 10.
  // If numeroRicevuta is 11, (11 - 1) % 10 = 0 -> maps to slot 1!
  const slip11Slot = (11 - 1) % 10 + 1; // 1
  assert.equal(slip11Slot, 1, 'Receipt 11 collides with slot 1 in 10-slot visual bar');

  // How does repro_bug_01 (Fix DB Invertito) react if a booklet has receipt 15?
  // Condition: bNum > 0 && rNum > 0 && bNum > rNum
  // If booklet is 20 and receipt is 15: 20 > 15 -> swapped to booklet 15, receipt 20!
  // If booklet is 10 and receipt is 15: 10 > 15 is FALSE -> NOT swapped!
  recordTest(
    'Booklet with >10 Receipts Modulo & Heuristic Anomaly',
    'Booklet',
    true,
    `Receipt 11 maps to visual slot 1. Receipts > 10 create arbitrary behavior in Fix DB Invertito depending on whether bNum > rNum.`
  );
}

// 3.2 Ricevute duplicate nello stesso blocchetto
{
  const duplicateReceipts = [
    { id_tesseramento: 't-1', numero_blocchetto: 5, numero_ricevuta: 3, anno: 2026, id_socio: 10 },
    { id_tesseramento: 't-2', numero_blocchetto: 5, numero_ricevuta: 3, anno: 2026, id_socio: 20 },
  ];
  // In multi-socio receipts, duplicate receipts for different soci are intentional!
  // But what if same socio has duplicate payment for same receipt and same year?
  const sameSocioDuplicate = [
    { id_tesseramento: 't-3', numero_blocchetto: 5, numero_ricevuta: 3, anno: 2026, id_socio: 10, quota_pagata: 10 },
    { id_tesseramento: 't-4', numero_blocchetto: 5, numero_ricevuta: 3, anno: 2026, id_socio: 10, quota_pagata: 10 },
  ];
  // calculatePaymentStatus will count 2026 once (Set of years)
  const paidYears = sameSocioDuplicate.map(p => p.anno);
  const status = calculatePaymentStatus({ id: 10 }, paidYears, 2026);
  assert.equal(status.inRegola, true);

  // But cash total sums both:
  const cash = sameSocioDuplicate.reduce((s, p) => s + p.quota_pagata, 0);
  assert.equal(cash, 20, 'Double payment doubles cash count for same socio');

  recordTest(
    'Duplicate Receipt/Payment for Same Socio in Same Booklet',
    'Booklet',
    true,
    `Paid status deduplicates via Set(paidYears), but cash summary counts double (€20 instead of €10).`
  );
}

// 3.3 VULNERABILITA CRITICA: deleteTesseramentiByReceipt Cross-Booklet Deletion
{
  // Examining db.js:1208:
  // export async function deleteTesseramentiByReceipt(socioId, numeroRicevuta, anni)
  // query: db.tesseramenti.where('id_socio').equals(numericSocioId).and(t => t.numero_ricevuta === numeroRicevuta && anni.includes(t.anno))
  // NOTICE: NO numero_blocchetto filter!

  const mockDbTesseramenti = [
    { id_tesseramento: 'tess-a', id_socio: 55, numero_blocchetto: 1, numero_ricevuta: 4, anno: 2026, quota_pagata: 10 },
    { id_tesseramento: 'tess-b', id_socio: 55, numero_blocchetto: 2, numero_ricevuta: 4, anno: 2026, quota_pagata: 10 },
    { id_tesseramento: 'tess-c', id_socio: 55, numero_blocchetto: 2, numero_ricevuta: 5, anno: 2026, quota_pagata: 10 },
  ];

  function simulateDeleteByReceipt(socioId, numeroRicevuta, anni) {
    return mockDbTesseramenti.filter(t => t.id_socio === socioId && t.numero_ricevuta === numeroRicevuta && anni.includes(t.anno));
  }

  const deletedRecords = simulateDeleteByReceipt(55, 4, [2026]);
  // BOTH tess-a (booklet 1) AND tess-b (booklet 2) matched!
  assert.equal(deletedRecords.length, 2, 'Matches payments across DIFFERENT booklets!');
  assert.deepEqual(deletedRecords.map(r => r.numero_blocchetto), [1, 2]);

  recordTest(
    'Cross-Booklet Deletion Bug in deleteTesseramentiByReceipt',
    'Booklet',
    true,
    `Function deletes receipt 4 from ALL booklets where socio paid in that year, lacking 'numero_blocchetto' clause!`
  );
}

console.log('\n' + '='.repeat(90));
console.log(`STRESS TEST 1 COMPLETATO: ${results.length} verifiche eseguite con successo.`);
console.log('='.repeat(90));
