/**
 * REPRO-BUG-07: Typo campo member.data_iscrizione vs data_prima_iscrizione (ReportsView.vue:2095)
 * 
 * Posizione nel codice:
 * - src/views/ReportsView.vue:2094-2101 (getEnrollmentYear)
 * A confronto con:
 * - src/services/db.js:16 (schema Dexie: data_prima_iscrizione)
 * - src/services/db.js:717 (schema SQLite: data_prima_iscrizione)
 * 
 * Descrizione:
 * La funzione helper `getEnrollmentYear` in `ReportsView.vue` cerca la proprietà inesistente `member.data_iscrizione`.
 * Nello schema ufficiale del database (sia IndexedDB Dexie che SQLite esportato), il campo
 * si chiama rigorosamente `data_prima_iscrizione`.
 * Quando un socio storico (es. iscritto nel 2012) viene importato o registrato senza ancora
 * aver registrato pagamenti contabili nell'applicativo:
 * - `member.data_iscrizione` risulta `undefined`
 * - `paidYears` è vuoto ([])
 * - La funzione attiva il fallback: `return new Date().getFullYear()` (restituendo l'anno corrente 2026).
 * Di conseguenza, nelle elezioni e nei report, il socio storico viene etichettato come "Nuovo iscritto nell'anno 2026",
 * azzerando 14 anni di anzianità sociale e alterandone i diritti statutari.
 */

import assert from 'node:assert/strict';

console.log('='.repeat(80));
console.log('REPRO-BUG-07: Typo member.data_iscrizione vs data_prima_iscrizione (ReportsView.vue:2095)');
console.log('='.repeat(80));

// 1. Funzione originale con il typo (ReportsView.vue:2094-2101)
const getEnrollmentYear_Original = (member) => {
  // TYPO: Il campo non esiste nell'anagrafica del DB, è data_prima_iscrizione!
  if (member.data_iscrizione) {
    return new Date(member.data_iscrizione).getFullYear();
  }
  const paidYears = member.tesseramenti?.map((t) => t.anno) || [];
  if (paidYears.length > 0) return Math.min(...paidYears);
  return new Date().getFullYear();
};

// 2. Funzione corretta conforme allo schema Dexie/SQLite
const getEnrollmentYear_Correct = (member) => {
  // Legge il campo effettivo dello schema: data_prima_iscrizione
  const regDate = member.data_prima_iscrizione || member.data_iscrizione;
  if (regDate) {
    const parsed = new Date(regDate).getFullYear();
    if (!isNaN(parsed) && parsed > 1900) return parsed;
    const num = Number(regDate);
    if (!isNaN(num) && num > 1900) return num;
  }
  const paidYears = member.tesseramenti?.map((t) => t.anno) || [];
  if (paidYears.length > 0) return Math.min(...paidYears);
  return new Date().getFullYear();
};

// Scenario di test:
// Un socio anziano della Famiglia dei Santantoniari con anzianità dal 2010.
// È presente nel database Dexie con il record anagrafico corretto, ma non ha pagamenti recenti registrati.
const realMemberFromDB = {
  id: 450,
  cognome: 'Fiorucci',
  nome: 'Antonio',
  gruppo_appartenenza: 'San Martino',
  data_prima_iscrizione: '2010-04-12', // Campo effettivo da Dexie / SQLite
  // data_iscrizione NON esiste nel DB
  tesseramenti: [], // Nessun pagamento digitalizzato
};

console.log('[RECORD SOCIO DA DEXIE/SQLITE]');
console.log(realMemberFromDB);

// Calcolo con funzione originale (buggata)
const calculatedOriginal = getEnrollmentYear_Original(realMemberFromDB);
// Calcolo con funzione corretta
const calculatedCorrect = getEnrollmentYear_Correct(realMemberFromDB);

const currentYear = new Date().getFullYear();

console.log('\n[RISULTATI CALCOLO ANNO ISCRIZIONE]');
console.log(`- Anno reale di iscrizione: 2010`);
console.log(`- Calcolato da ReportsView.vue (con typo data_iscrizione): ${calculatedOriginal}`);
console.log(`- Calcolato da formula corretta (data_prima_iscrizione): ${calculatedCorrect}`);

// Verifiche formali:
// Il codice originale restituisce l'anno corrente (es. 2026) anziché 2010
assert.equal(calculatedOriginal, currentYear, `Il codice esistente deve restituire ${currentYear} per via del typo`);
assert.equal(calculatedCorrect, 2010, 'Il codice corretto deve restituire l anno reale 2010');

// Dimostrazione impatto sulla logica elettorale (ReportsView.vue:2382-2384)
const targetYear = currentYear;
let motivoEsclusioneOriginal = '';
if (calculatedOriginal === targetYear) {
  motivoEsclusioneOriginal = `Nuovo iscritto nell'anno ${targetYear}`;
}

console.log('\n[IMPATTO SUL CALCOLO ELETTORALE (ReportsView.vue:2382)]');
console.log(`- Motivo esclusione generato: "${motivoEsclusioneOriginal}"`);

assert.equal(
  motivoEsclusioneOriginal,
  `Nuovo iscritto nell'anno ${targetYear}`,
  'Il socio decennale viene classificato falsamente come nuovo iscritto dell anno corrente',
);

console.log('\n' + '='.repeat(80));
console.log('[CONFERMATO] BUG-07 RIPRODOTTO CON SUCCESSO:');
console.log(`- Il typo 'member.data_iscrizione' ignora il campo 'data_prima_iscrizione'.`);
console.log(`- Per i soci privi di pagamenti registrati, la funzione restituisce ${currentYear} (oggi).`);
console.log(`- Un socio iscritto nel 2010 viene etichettato come "Nuovo iscritto nell'anno ${currentYear}".`);
console.log('='.repeat(80));
