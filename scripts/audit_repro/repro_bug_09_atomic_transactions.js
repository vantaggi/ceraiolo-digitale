/**
 * REPRO-BUG-09: Mancanza di transazioni atomiche in salvataggio multi-anno
 * 
 * Posizione nel codice:
 * - src/views/BatchEntryView.vue:1250-1262 (handleSavePayments)
 * - src/services/db.js:546-550 (deleteSocio)
 * 
 * Descrizione:
 * Nella registrazione rapida di un socio che rinnova più anni contemporaneamente
 * (es. arretrati 2024, 2025 e quota 2026), `BatchEntryView` itera su ciascun anno ed esegue:
 * `for (const year of years) { await addTesseramento(tesseramentoData) }`
 * Questa serie di inserimenti NON è racchiusa in una transazione Dexie atomica (`db.transaction('rw', ...)`).
 * In caso di errore (quota disco IndexedDB saturata, violazione di vincolo, crash del browser,
 * chiusura improvvisa della scheda o eccezione su uno degli anni successivi), i primi anni rimangono
 * scritti irreversibilmente nel database, mentre l'oggetto ricevuta in memoria (`currentReceipt`) non viene completato.
 * Il database rimane in uno stato incoerente, con tesseramenti orfani registrati a metà e assenza di rollback.
 */

import assert from 'node:assert/strict';

console.log('='.repeat(80));
console.log('REPRO-BUG-09: Mancanza di transazioni atomiche in salvataggio multi-anno (BatchEntryView.vue:1250)');
console.log('='.repeat(80));

// Simulatore di storage IndexedDB / Dexie per testare l'atomicità
class MockIndexedDBStore {
  constructor() {
    this.tesseramenti = [];
  }

  // Simula addTesseramento non transazionale
  async addTesseramento(record) {
    if (record.anno === 2026 && record.shouldFail) {
      throw new Error('Simulated QuotaExceededError / Network / Storage Failure during save of year 2026');
    }
    this.tesseramenti.push({ ...record });
    return record.id_tesseramento;
  }

  // Simula un inserimento atomico con rollback
  async addTesseramentiAtomico(records) {
    const backup = [...this.tesseramenti];
    try {
      for (const record of records) {
        if (record.anno === 2026 && record.shouldFail) {
          throw new Error('Simulated failure during atomic transaction');
        }
        this.tesseramenti.push({ ...record });
      }
    } catch (err) {
      // Rollback transazionale
      this.tesseramenti = backup;
      throw err;
    }
  }
}

// 1. ESECUZIONE ALGORITMO ORIGINALE NON ATOMICO (BatchEntryView.vue:1250-1262)
async function executeBatchSave_Original(store, years, socioId, details, simulateFailureOnYear = null) {
  const currentReceipt = { numero: 5, soci: [] };
  let caughtError = null;

  try {
    // RIGHE 1251-1261 VERBATIM:
    for (const year of years) {
      const tesseramentoData = {
        id_tesseramento: `tess-${socioId}-${year}`,
        id_socio: socioId,
        anno: year,
        quota_pagata: details.quota_pagata,
        data_pagamento: details.data_pagamento,
        numero_ricevuta: currentReceipt.numero,
        numero_blocchetto: 12,
        shouldFail: year === simulateFailureOnYear,
      };
      await store.addTesseramento(tesseramentoData);
    }

    // Aggiunta alla ricevuta in memoria (r. 1264)
    currentReceipt.soci.push({
      id: socioId,
      anniPagati: [...years],
      totale_versato: details.quota_pagata * years.length,
    });
  } catch (error) {
    caughtError = error;
  }

  return { currentReceipt, caughtError };
}

// 2. ESECUZIONE ALGORITMO CORRETTO CON TRANSAZIONE ATOMICA
async function executeBatchSave_Atomic(store, years, socioId, details, simulateFailureOnYear = null) {
  const currentReceipt = { numero: 5, soci: [] };
  let caughtError = null;

  try {
    const records = years.map((year) => ({
      id_tesseramento: `tess-${socioId}-${year}`,
      id_socio: socioId,
      anno: year,
      quota_pagata: details.quota_pagata,
      data_pagamento: details.data_pagamento,
      numero_ricevuta: currentReceipt.numero,
      numero_blocchetto: 12,
      shouldFail: year === simulateFailureOnYear,
    }));

    await store.addTesseramentiAtomico(records);

    currentReceipt.soci.push({
      id: socioId,
      anniPagati: [...years],
      totale_versato: details.quota_pagata * years.length,
    });
  } catch (error) {
    caughtError = error;
  }

  return { currentReceipt, caughtError };
}

// Scenario di test:
// Il socio paga per 3 anni: 2024, 2025, 2026.
// Durante l'inserimento del terzo anno (2026), si verifica un errore.
const testYears = [2024, 2025, 2026];
const details = { quota_pagata: 10, data_pagamento: '2026-05-15' };

console.log('\n[TEST 1: Esecuzione con il codice esistente NON transazionale]');
const storeNonAtomic = new MockIndexedDBStore();
const resultNonAtomic = await executeBatchSave_Original(storeNonAtomic, testYears, 77, details, 2026);

console.log(`- Errore intercettato durante il salvataggio del 2026: "${resultNonAtomic.caughtError?.message}"`);
console.log(`- Ricevuta in memoria completata: ${resultNonAtomic.currentReceipt.soci.length > 0 ? 'SÌ' : 'NO (Ricevuta vuota/abortita)'}`);
console.log(`- Record persistiti nel DB: ${storeNonAtomic.tesseramenti.length}`);
storeNonAtomic.tesseramenti.forEach((t) => console.log(`   * Pagamento orfano scritto: anno ${t.anno}, ricevuta ${t.numero_ricevuta}`));

// Verifiche formali:
// Nel codice originale, gli anni 2024 e 2025 rimangono scritti nel DB nonostante l'errore!
assert.equal(storeNonAtomic.tesseramenti.length, 2, '2 anni sono stati persistiti nel DB');
assert.equal(resultNonAtomic.currentReceipt.soci.length, 0, 'La ricevuta in memoria è vuota per via dell eccezione');
assert(resultNonAtomic.caughtError !== null, 'L eccezione è stata sollevata');

console.log('\n[TEST 2: Esecuzione con salvataggio atomico e rollback]');
const storeAtomic = new MockIndexedDBStore();
const resultAtomic = await executeBatchSave_Atomic(storeAtomic, testYears, 77, details, 2026);

console.log(`- Errore intercettato: "${resultAtomic.caughtError?.message}"`);
console.log(`- Record persistiti nel DB dopo rollback: ${storeAtomic.tesseramenti.length}`);

// Con la transazione atomica, il database non contiene record orfani
assert.equal(storeAtomic.tesseramenti.length, 0, 'Il rollback ha riportato il DB allo stato pulito iniziale');

console.log('\n' + '='.repeat(80));
console.log('[CONFERMATO] BUG-09 RIPRODOTTO CON SUCCESSO:');
console.log('- Il ciclo for senza transazione Dexie causa salvataggi parziali non atomici.');
console.log('- In caso di errore su uno degli anni, i pagamenti precedenti restano salvati come orfani.');
console.log('- Manca il rollback transazionale per garantire l integrità contabile della ricevuta.');
console.log('='.repeat(80));
