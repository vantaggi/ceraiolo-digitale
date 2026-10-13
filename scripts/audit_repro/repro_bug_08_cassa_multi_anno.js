/**
 * REPRO-BUG-08: Calcolo cassa blocchetto multi-anno (BatchEntryView.vue:867, BlocchettiView.vue:49)
 * 
 * Posizione nel codice:
 * - src/views/BatchEntryView.vue:867-875 (aggiornamento cassa blocchetto bookletCashTotal)
 * - src/views/BlocchettiView.vue:46-70 (totaleIncassato in blocchettiDinamici)
 * 
 * Descrizione:
 * Entrambe le viste aggregano i pagamenti contabili filtrando unicamente per `numero_blocchetto`,
 * omettendo completamente il filtro sull'anno di tesseramento (`anno`).
 * Poiché i blocchetti cartacei vengono riemessi ogni anno ripartendo dalla numerazione 1
 * (es. Blocchetto 1 del 2024, Blocchetto 1 del 2025, Blocchetto 1 del 2026),
 * quando il cassiere inserisce il Blocchetto 1 durante la campagna 2026,
 * il sistema recupera anche tutti i versamenti degli anni passati con lo stesso numero di blocchetto,
 * sommando incassi storici e mostrando un totale di cassa falsato di centinaia di euro.
 */

import assert from 'node:assert/strict';

console.log('='.repeat(80));
console.log('REPRO-BUG-08: Calcolo cassa blocchetto multi-anno (BatchEntryView.vue:867)');
console.log('='.repeat(80));

// 1. Algoritmo originale estratto da BatchEntryView.vue:867-875
function calculateBookletCashTotal_Original(paymentsStore, bNum) {
  // Query simulata: db.tesseramenti.where('numero_blocchetto').equals(bNum).toArray()
  // NESSUN FILTRO SU ANNO!
  const payments = paymentsStore.filter((p) => p.numero_blocchetto === bNum);

  const bookletCashTotal = payments.reduce(
    (sum, p) => sum + (Number(p.quota_pagata) || 0),
    0,
  );

  return {
    bookletCashTotal,
    paymentsCount: payments.length,
    payments,
  };
}

// 2. Algoritmo corretto contabile (filtrato sull'anno della sessione attiva)
function calculateBookletCashTotal_Correct(paymentsStore, bNum, currentSessionYear) {
  // Filtro sia su numero_blocchetto che su anno della sessione attiva
  const payments = paymentsStore.filter(
    (p) => p.numero_blocchetto === bNum && Number(p.anno) === Number(currentSessionYear),
  );

  const bookletCashTotal = payments.reduce(
    (sum, p) => sum + (Number(p.quota_pagata) || 0),
    0,
  );

  return {
    bookletCashTotal,
    paymentsCount: payments.length,
    payments,
  };
}

// Scenario di test reale:
// Anno 2024: Blocchetto 1 completo (10 ricevute da 10€) = 100€
// Anno 2025: Blocchetto 1 completo (10 ricevute da 10€) = 100€
// Anno 2026: Blocchetto 1 appena iniziato (2 ricevute da 10€ compilate finora) = 20€
const databasePayments = [];

// 10 pagamenti nel 2024 per il blocchetto 1
for (let r = 1; r <= 10; r++) {
  databasePayments.push({
    id_tesseramento: `tess-2024-${r}`,
    id_socio: 100 + r,
    anno: 2024,
    quota_pagata: 10,
    numero_blocchetto: 1,
    numero_ricevuta: r,
  });
}

// 10 pagamenti nel 2025 per il blocchetto 1
for (let r = 1; r <= 10; r++) {
  databasePayments.push({
    id_tesseramento: `tess-2025-${r}`,
    id_socio: 200 + r,
    anno: 2025,
    quota_pagata: 10,
    numero_blocchetto: 1,
    numero_ricevuta: r,
  });
}

// 2 pagamenti correnti nel 2026 per il blocchetto 1
databasePayments.push({
  id_tesseramento: 'tess-2026-1',
  id_socio: 301,
  anno: 2026,
  quota_pagata: 10,
  numero_blocchetto: 1,
  numero_ricevuta: 1,
});
databasePayments.push({
  id_tesseramento: 'tess-2026-2',
  id_socio: 302,
  anno: 2026,
  quota_pagata: 10,
  numero_blocchetto: 1,
  numero_ricevuta: 2,
});

const activeBookletNumber = 1;
const activeSessionYear = 2026;

console.log(`[SESSIONE CONTABILE BATCH ENTRY]`);
console.log(`- Blocchetto aperto: #${activeBookletNumber}`);
console.log(`- Anno di riferimento sessione: ${activeSessionYear}`);
console.log(`- Ricevute fisicamente staccate nel 2026: 2 (da 10€ cad. = 20.00€ attesi)`);

const resultOriginal = calculateBookletCashTotal_Original(databasePayments, activeBookletNumber);
const resultCorrect = calculateBookletCashTotal_Correct(databasePayments, activeBookletNumber, activeSessionYear);

console.log('\n[RISULTATI CALCOLO CASSA]');
console.log(`- Cassa reale dell'anno 2026: € ${resultCorrect.bookletCashTotal.toFixed(2)} (${resultCorrect.paymentsCount} ricevute)`);
console.log(`- Cassa mostrata a video da BatchEntryView (senza filtro anno): € ${resultOriginal.bookletCashTotal.toFixed(2)} (${resultOriginal.paymentsCount} ricevute)`);
console.log(`- Discrepanza contabile: € ${(resultOriginal.bookletCashTotal - resultCorrect.bookletCashTotal).toFixed(2)} sovrastimati!`);

// Verifiche formali:
// Il codice originale somma 2024 (100) + 2025 (100) + 2026 (20) = 220€!
assert.equal(resultOriginal.bookletCashTotal, 220, 'BatchEntryView somma erroneamente gli incassi di tutti gli anni');
assert.equal(resultCorrect.bookletCashTotal, 20, 'La cassa corretta per il 2026 deve essere 20€');

assert.equal(resultOriginal.paymentsCount, 22, 'Vengono contate 22 ricevute invece delle 2 dell anno in corso');
assert.equal(resultCorrect.paymentsCount, 2, 'Devono essere contate solo le 2 ricevute del 2026');

console.log('\n' + '='.repeat(80));
console.log('[CONFERMATO] BUG-08 RIPRODOTTO CON SUCCESSO:');
console.log('- Il totale cassa blocchetto somma indiscriminatamente tutti gli anni storici con lo stesso numero di blocchetto.');
console.log('- Mostra 220,00€ anziché i 20,00€ effettivamente presenti nella busta del blocchetto 2026.');
console.log('- Provoca ammanchi o falsi avvisi di quadratura di cassa per il cassiere.');
console.log('='.repeat(80));
