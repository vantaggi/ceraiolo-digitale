/**
 * REPRO-BUG-01: Fix DB Invertito Distruttivo
 * 
 * Posizione nel codice:
 * - src/views/HomeView.vue:160-166 (@click="runNormalization")
 * - src/services/db.js:2492-2558 (normalizeDatabaseData)
 * 
 * Descrizione:
 * La funzione esegue una presunta "normalizzazione" scambiando numero_blocchetto
 * e numero_ricevuta ogniqualvolta `numero_blocchetto > numero_ricevuta`.
 * Poiché i blocchetti cartacei della Famiglia dei Santantoniari contengono 10 ricevute (1..10)
 * e i blocchetti sono numerati da 1 a 100+, qualsiasi blocchetto con numero > 10
 * (es. blocchetto 25, ricevuta 4) soddisfa la condizione `25 > 4`.
 * Di conseguenza, la funzione inverte i due campi impostando blocchetto 4 e ricevuta 25
 * (numero di ricevuta inesistente su libretti da 10 foglietti) e distrugge la tabella
 * fisica db.blocchetti eliminando il blocchetto 25!
 */

import assert from 'node:assert/strict';

console.log('='.repeat(80));
console.log('REPRO-BUG-01: Fix DB Invertito Distruttivo (HomeView.vue:160, db.js:2492-2558)');
console.log('='.repeat(80));

// 1. Logica originale estratta verbatim da db.js:2498-2510
function runNormalizationAlgorithm(allTesseramenti, allBlocchettiDB) {
  const recordsToFix = [];

  for (const tess of allTesseramenti) {
    const bNum = Number(tess.numero_blocchetto) || 0;
    const rNum = Number(tess.numero_ricevuta) || 0;

    // Se entrambi sono validi e il blocchetto è maggiore della ricevuta,
    // significa che nel DB storico i campi sono stati inseriti al contrario. (EURISTICA DIFETTOSA)
    if (bNum > 0 && rNum > 0 && bNum > rNum) {
      recordsToFix.push({
        ...tess,
        numero_blocchetto: rNum, // Il più piccolo
        numero_ricevuta: bNum, // Il più grande
      });
    }
  }

  // Costruzione delle chiavi considerate "valide" (db.js:2523-2530)
  const validBlocchettiKeys = new Set();
  const updatedTesseramenti = allTesseramenti.map(t => {
    const fixed = recordsToFix.find(r => r.id_tesseramento === t.id_tesseramento);
    return fixed || t;
  });

  for (const t of updatedTesseramenti) {
    validBlocchettiKeys.add(Number(t.numero_blocchetto));
  }

  // Eliminazione blocchetti considerati "falsi storici" (db.js:2536-2544)
  const deletedBlocchetti = [];
  const remainingBlocchetti = [];
  for (const b of allBlocchettiDB) {
    const bNum = Number(b.numero_blocchetto);
    if (!validBlocchettiKeys.has(bNum)) {
      deletedBlocchetti.push(b);
    } else {
      remainingBlocchetti.push(b);
    }
  }

  return {
    recordsToFix,
    updatedTesseramenti,
    deletedBlocchetti,
    remainingBlocchetti,
  };
}

// 2. Scenario di test reale
// Il comitato ha distribuito il blocchetto fisico #25.
// Il ceraiolo stacca la ricevuta #4 del blocchetto #25 per la quota 2026 di un socio.
const initialPayment = {
  id_tesseramento: 'tess-uuid-001',
  id_socio: 42,
  anno: 2026,
  quota_pagata: 10,
  numero_blocchetto: 25, // Blocchetto fisico valido #25
  numero_ricevuta: 4,    // Ricevuta valida #4 (su 10 ricevute del blocchetto)
};

const initialBooklet = {
  id: 25,
  numero_blocchetto: 25,
  assegnato_a: 'Capodieci / Ceraiolo Zona San Martino',
  ricevute_da: 1,
  ricevute_a: 10,
};

console.log('\n[STATO INIZIALE CORRETTO]');
console.log('Pagamento:', initialPayment);
console.log('Blocchetto in archivio:', initialBooklet);

// 3. Esecuzione dell algoritmo di "normalizzazione"
const result = runNormalizationAlgorithm([initialPayment], [initialBooklet]);

console.log('\n[RISULTATO NORMALIZZAZIONE]');
console.log('Record marcati per "correzione":', result.recordsToFix);
console.log('Pagamenti dopo aggiornamento:', result.updatedTesseramenti);
console.log('Blocchetti cancellati fisicamente:', result.deletedBlocchetti);

const corruptedPayment = result.updatedTesseramenti[0];

// 4. Verifiche formali della corruzione
// Il blocchetto è diventato 4, la ricevuta è diventata 25
assert.equal(corruptedPayment.numero_blocchetto, 4, 'Il blocchetto deve essere stato scambiato con 4');
assert.equal(corruptedPayment.numero_ricevuta, 25, 'La ricevuta deve essere stata scambiata con 25');

// In un blocchetto da 10 foglietti, la ricevuta 25 è un'incongruenza fisica impossibile!
assert(corruptedPayment.numero_ricevuta > 10, 'La ricevuta scambiata supera la capienza fisica del blocchetto (10)');

// Il vero blocchetto 25 è stato eliminato dalla tabella blocchetti!
assert.equal(result.deletedBlocchetti.length, 1, 'Il blocchetto fisico 25 è stato cancellato');
assert.equal(result.deletedBlocchetti[0].numero_blocchetto, 25);

console.log('\n' + '='.repeat(80));
console.log('[CONFERMATO] BUG-01 RIPRODOTTO CON SUCCESSO:');
console.log('- Il pagamento è stato invertito in modo distruttivo: blocchetto 25 -> 4, ricevuta 4 -> 25.');
console.log('- Il blocchetto fisico reale 25 è stato eliminato dalla tabella db.blocchetti.');
console.log('- L operazione è irreversibile e corrompe tutti i blocchetti con numero > 10.');
console.log('='.repeat(80));
