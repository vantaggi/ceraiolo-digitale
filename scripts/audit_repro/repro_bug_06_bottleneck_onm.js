/**
 * REPRO-BUG-06: Collo di bottiglia O(N * M) in BlocchettiView (45M iterazioni)
 * 
 * Posizione nel codice:
 * - src/views/BlocchettiView.vue:75
 * 
 * Descrizione:
 * All'interno della funzione reattiva computed `blocchettiDinamici`, per ogni pagamento
 * dell'archivio (`allPayments.value.forEach`, con N pagamenti), viene eseguita una ricerca lineare
 * sull'array completo dei soci:
 * `const socio = allSoci.value.find(s => s.id === p.id_socio)`.
 * Su un archivio realistico con N = 15.000 pagamenti e M = 3.000 soci, la complessità computazionale è:
 * O(N * M) = 15.000 * 3.000 = 45.000.000 di confronti sul main thread di JavaScript,
 * provocando il blocco completo della UI (browser freeze) e il popup "Pagina non risponde".
 */

import assert from 'node:assert/strict';

console.log('='.repeat(80));
console.log('REPRO-BUG-06: Collo di bottiglia O(N * M) in BlocchettiView.vue:75');
console.log('='.repeat(80));

// Generazione di un dataset conforme ai parametri di audit (3.000 soci, 15.000 pagamenti)
const M = 3000;
const N = 15000;

console.log(`[GENERAZIONE DATASET BENCHMARK]`);
console.log(`- Numero Soci (M): ${M.toLocaleString()}`);
console.log(`- Numero Pagamenti (N): ${N.toLocaleString()}`);

const allSoci = [];
for (let i = 1; i <= M; i++) {
  allSoci.push({
    id: i,
    cognome: `Cognome_${i}`,
    nome: `Nome_${i}`,
  });
}

const allPayments = [];
for (let j = 1; j <= N; j++) {
  // Distribuzione uniforme dei pagamenti tra i soci
  const socioId = ((j * 37) % M) + 1;
  const bNum = (j % 500) + 1;
  const rNum = (j % 10) + 1;
  allPayments.push({
    id_tesseramento: `tess-${j}`,
    id_socio: socioId,
    anno: 2026,
    quota_pagata: 10,
    numero_blocchetto: bNum,
    numero_ricevuta: rNum,
  });
}

// 1. ESECUZIONE ALGORITMO ORIGINALE O(N * M) (BlocchettiView.vue:46-83)
console.log('\n[TEST 1: Algoritmo Esistente con Array.find() lineare]');
let findIterationCount = 0;

const startOriginal = performance.now();
const mapOriginal = new Map();

allPayments.forEach((p) => {
  const bNum = Number(p.numero_blocchetto) || 0;
  const rNum = Number(p.numero_ricevuta) || 0;
  if (bNum <= 0) return;

  if (!mapOriginal.has(bNum)) {
    mapOriginal.set(bNum, {
      numero_blocchetto: bNum,
      ricevuteMap: new Map(),
    });
  }

  const blocco = mapOriginal.get(bNum);
  if (rNum > 0) {
    if (!blocco.ricevuteMap.has(rNum)) blocco.ricevuteMap.set(rNum, []);

    // RIGA 75 VERBATIM:
    // const socio = allSoci.value.find(s => s.id === p.id_socio)
    let socio = null;
    for (let sIdx = 0; sIdx < allSoci.length; sIdx++) {
      findIterationCount++;
      if (allSoci[sIdx].id === p.id_socio) {
        socio = allSoci[sIdx];
        break;
      }
    }

    const nomeSocio = socio ? `${socio.cognome} ${socio.nome}` : 'Socio Eliminato';
    blocco.ricevuteMap.get(rNum).push({ ...p, socioNome: nomeSocio });
  }
});
const durationOriginal = performance.now() - startOriginal;

console.log(`- Tempo di calcolo: ${durationOriginal.toFixed(2)} ms`);
console.log(`- Iterazioni effettive eseguite nel ciclo interno: ${findIterationCount.toLocaleString()}`);

// 2. ESECUZIONE ALGORITMO OTTIMIZZATO O(N + M) CON MAPPA DI LOOKUP
console.log('\n[TEST 2: Algoritmo Ottimizzato con Map(id -> socio) O(1)]');
let mapIterationCount = 0;

const startOptimized = performance.now();
const sociMap = new Map();
allSoci.forEach((s) => {
  mapIterationCount++;
  sociMap.set(s.id, s);
});

const mapOptimized = new Map();
allPayments.forEach((p) => {
  mapIterationCount++;
  const bNum = Number(p.numero_blocchetto) || 0;
  const rNum = Number(p.numero_ricevuta) || 0;
  if (bNum <= 0) return;

  if (!mapOptimized.has(bNum)) {
    mapOptimized.set(bNum, {
      numero_blocchetto: bNum,
      ricevuteMap: new Map(),
    });
  }

  const blocco = mapOptimized.get(bNum);
  if (rNum > 0) {
    if (!blocco.ricevuteMap.has(rNum)) blocco.ricevuteMap.set(rNum, []);

    // LOOKUP IN O(1):
    const socio = sociMap.get(p.id_socio);
    const nomeSocio = socio ? `${socio.cognome} ${socio.nome}` : 'Socio Eliminato';
    blocco.ricevuteMap.get(rNum).push({ ...p, socioNome: nomeSocio });
  }
});
const durationOptimized = performance.now() - startOptimized;

console.log(`- Tempo di calcolo: ${durationOptimized.toFixed(2)} ms`);
console.log(`- Iterazioni totali (costruzione mappa + scansione): ${mapIterationCount.toLocaleString()}`);

// Calcolo fattore di accelerazione e conferme
const speedup = durationOriginal / durationOptimized;
console.log(`\n[CONFRONTO PRESTAZIONALE]`);
console.log(`- Riduzione operazioni: da ${findIterationCount.toLocaleString()} a ${mapIterationCount.toLocaleString()} (-${((1 - mapIterationCount / findIterationCount) * 100).toFixed(1)}%)`);
console.log(`- Fattore di accelerazione (Speedup): ${speedup.toFixed(1)}x più veloce`);

// Verifiche formali:
// Il numero di iterazioni con find lineare è dell'ordine di milioni
assert(findIterationCount > 10_000_000, 'Le iterazioni con find lineare superano 10 milioni su dataset reale');
assert(durationOriginal > durationOptimized, 'L algoritmo originale è nettamente più lento');

console.log('\n' + '='.repeat(80));
console.log('[CONFERMATO] BUG-06 RIPRODOTTO CON SUCCESSO:');
console.log(`- L uso di allSoci.find dentro il forEach dei pagamenti esegue ${findIterationCount.toLocaleString()} cicli.`);
console.log(`- Impiega ${durationOriginal.toFixed(0)}ms bloccando il main thread.`);
console.log(`- Con una Map indicizzata basterebbero ${mapIterationCount.toLocaleString()} operazioni in appena ${durationOptimized.toFixed(1)}ms.`);
console.log('='.repeat(80));
