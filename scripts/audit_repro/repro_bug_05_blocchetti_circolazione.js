/**
 * REPRO-BUG-05: Tabella Blocchetti: filtro "In Circolazione" include tutti i blocchetti storici
 * 
 * Posizione nel codice:
 * - src/views/BlocchettiView.vue:60-63 (aggregazione dinamica blocchetti dallo storico)
 * - src/views/BlocchettiView.vue:136-137 (filtro 'attivi')
 * - src/views/BlocchettiView.vue:163 (conteggio computed totalAttivi)
 * 
 * Descrizione:
 * L'Intervento 1 ha introdotto la generazione dinamica dei blocchetti dai pagamenti (`blocchettiDinamici`),
 * impostando per tutti i blocchetti storici importati `data_restituzione: null` e `isReal: false`.
 * Quando l'utente seleziona il filtro "In Circolazione" (`activeFilter === 'attivi'`),
 * la vista esegue:
 * `baseList = baseList.filter(b => !b.data_restituzione)`
 * e calcola il badge:
 * `totalAttivi = blocchettiDinamici.value.filter(b => !b.data_restituzione).length`.
 * Poiché `!null === true`, tutti i 990 blocchetti storici degli ultimi decenni vengono classificati
 * come "In Circolazione", mostrando un contatore "In Circolazione (990)" completamente falso e inutilizzabile.
 */

import assert from 'node:assert/strict';

console.log('='.repeat(80));
console.log('REPRO-BUG-05: Filtro "In Circolazione" su Blocchetti Storici (BlocchettiView.vue:136, 163)');
console.log('='.repeat(80));

// 1. Simulazione dell aggregazione da allPayments (BlocchettiView.vue:46-83)
function computeBlocchettiDinamici(allPayments, blocchettiDB = []) {
  const map = new Map();

  allPayments.forEach((p) => {
    const bNum = Number(p.numero_blocchetto) || 0;
    if (bNum <= 0) return;

    if (!map.has(bNum)) {
      map.set(bNum, {
        numero_blocchetto: bNum,
        countPagamenti: 0,
        totaleIncassato: 0,
        assegnato_a: 'Gestito dallo Storico',
        data_assegnazione: null,
        data_restituzione: null, // <--- DEFAULT NULL PER LO STORICO!
        isReal: false,           // <--- MARCATORE DI BLOCCHETTO STORICO
      });
    }

    const blocco = map.get(bNum);
    blocco.countPagamenti++;
    blocco.totaleIncassato += Number(p.quota_pagata) || 0;
  });

  // Integrazione con blocchetti inseriti manualmente nel DB
  blocchettiDB.forEach((bDB) => {
    const bNum = bDB.numero_blocchetto;
    if (!map.has(bNum)) {
      map.set(bNum, {
        numero_blocchetto: bNum,
        countPagamenti: 0,
        totaleIncassato: 0,
        assegnato_a: bDB.assegnato_a,
        data_assegnazione: bDB.data_assegnazione,
        data_restituzione: bDB.data_restituzione,
        isReal: true,
      });
    } else {
      const b = map.get(bNum);
      b.assegnato_a = bDB.assegnato_a;
      b.data_assegnazione = bDB.data_assegnazione;
      b.data_restituzione = bDB.data_restituzione;
      b.isReal = true;
    }
  });

  return Array.from(map.values());
}

// 2. Simulazione del filtraggio in BlocchettiView.vue:132-165
function applyFilterAndCounters(blocchettiDinamici, activeFilter) {
  let baseList = blocchettiDinamici;

  if (activeFilter === 'attivi') {
    // CODICE ESISTENTE DIFETTOSO:
    baseList = baseList.filter((b) => !b.data_restituzione);
  } else if (activeFilter === 'restituiti') {
    baseList = baseList.filter((b) => !!b.data_restituzione);
  } else if (activeFilter === 'registrati') {
    baseList = baseList.filter((b) => b.isReal);
  }

  const totalBlocchetti = blocchettiDinamici.length;
  // CODICE ESISTENTE DIFETTOSO PER IL CONTEGGIO:
  const totalAttivi = blocchettiDinamici.filter((b) => !b.data_restituzione).length;
  const totalRestituiti = blocchettiDinamici.filter((b) => !!b.data_restituzione).length;
  const totalRegistrati = blocchettiDinamici.filter((b) => b.isReal).length;

  return {
    filteredList: baseList,
    counters: {
      totalBlocchetti,
      totalAttivi,
      totalRestituiti,
      totalRegistrati,
    },
  };
}

// Scenario di test:
// Un archivio importato da SQLite contiene 990 blocchetti storici (anni 2010..2025).
// Per l'anno in corso 2026, l'amministratore ha registrato anagraficamente 5 nuovi blocchetti
// fisicamente affidati ai ceraioli per la raccolta fondi.
const historicalPayments = [];
for (let b = 1; b <= 990; b++) {
  historicalPayments.push({
    id_tesseramento: `hist-${b}`,
    id_socio: b,
    anno: 2020,
    quota_pagata: 10,
    numero_blocchetto: b,
    numero_ricevuta: 1,
  });
}

const currentYearRegisteredBooklets = [
  { numero_blocchetto: 1001, assegnato_a: 'Capodieci San Martino', data_assegnazione: '2026-05-01', data_restituzione: null },
  { numero_blocchetto: 1002, assegnato_a: 'Capodieci San Pietro', data_assegnazione: '2026-05-01', data_restituzione: null },
  { numero_blocchetto: 1003, assegnato_a: 'Capodieci Sant Agostino', data_assegnazione: '2026-05-01', data_restituzione: null },
  { numero_blocchetto: 1004, assegnato_a: 'Ceraiolo Padule', data_assegnazione: '2026-05-01', data_restituzione: null },
  { numero_blocchetto: 1005, assegnato_a: 'Ceraiolo Madonna del Prato', data_assegnazione: '2026-05-01', data_restituzione: null },
];

console.log(`[DATASET SINTETICO REALISTICO]`);
console.log(`- Blocchetti storici dai pagamenti: 990`);
console.log(`- Blocchetti fisici reali affidati nel 2026: ${currentYearRegisteredBooklets.length}`);

const dinamici = computeBlocchettiDinamici(historicalPayments, currentYearRegisteredBooklets);
const result = applyFilterAndCounters(dinamici, 'attivi');

console.log('\n[RISULTATI CONTEGGI E FILTRO IN CIRCOLAZIONE]');
console.log(`Totale Blocchetti aggregati: ${result.counters.totalBlocchetti}`);
console.log(`Totale Registrati (isReal: true): ${result.counters.totalRegistrati}`);
console.log(`Totale "In Circolazione" calcolato dall'app: ${result.counters.totalAttivi}`);
console.log(`Numero blocchetti mostrati cliccando sulla pill "In Circolazione": ${result.filteredList.length}`);

// Verifiche formali:
// Il contatore attivi include TUTTI i 990 blocchetti storici + i 5 reali = 995!
assert.equal(result.counters.totalAttivi, 995, 'totalAttivi deve essere 995 per via di !b.data_restituzione');
assert.equal(result.filteredList.length, 995, 'La lista filtrata mostra 995 blocchetti');

// I blocchetti storici hanno isReal === false
const historicalInActive = result.filteredList.filter((b) => !b.isReal);
assert.equal(historicalInActive.length, 990, 'Sono presenti 990 blocchetti storici nell elenco dei blocchetti in circolazione');

console.log('\n' + '='.repeat(80));
console.log('[CONFERMATO] BUG-05 RIPRODOTTO CON SUCCESSO:');
console.log('- Il filtro "In Circolazione" include 990 blocchetti storici vecchi di anni.');
console.log('- Il contatore visualizza "In Circolazione (995)" anziché i soli 5 blocchetti realmente in mano ai ceraioli.');
console.log('- Rende impossibile per la segreteria monitorare i libretti materialmente non ancora riconsegnati.');
console.log('='.repeat(80));
