/**
 * REPRO-BUG-04: Bug temporale nelle statistiche storiche (new Date() in db.js)
 * 
 * Posizione nel codice:
 * - src/services/db.js:1398-1405 (getNewMembersByYear)
 * - src/services/db.js:1534-1541 (getMembersByGroup)
 * 
 * Descrizione:
 * Nelle funzioni di estrazione statistica per anno storico (es. nuovi iscritti del 2018 per categoria di età),
 * il codice calcola l'età confrontando la data di nascita con la data odierna di sistema (`const today = new Date()`),
 * anziché con l'anno storico richiesto nel parametro della funzione (`year`).
 * Di conseguenza, un ceraiolo che nel 2018 aveva 14 anni (quindi minorenne al momento dell'iscrizione)
 * viene classificato con la sua età nel 2026 (22 anni, maggiorenne), falsando retroattivamente
 * tutti i report storici della Famiglia dei Santantoniari.
 */

import assert from 'node:assert/strict';

console.log('='.repeat(80));
console.log('REPRO-BUG-04: Bug temporale nelle statistiche storiche (db.js:1398-1405)');
console.log('='.repeat(80));

// Algoritmo originale estratto verbatim da db.js:1391-1406
function filterMemberByAgeCategory_Original(member, year, ageCategory) {
  if (ageCategory === 'all') return true;

  if (!member.data_nascita || isNaN(new Date(member.data_nascita))) {
    return false;
  }

  const birthDate = new Date(member.data_nascita);
  // ERRORE CRITICO: Usa new Date() (oggi nel 2026) invece del parametro year (es. 2018)!
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return ageCategory === 'maggiorenni' ? age >= 18 : age < 18;
}

// Algoritmo storicamente corretto (che calcola l'età nell'anno di riferimento)
function filterMemberByAgeCategory_Correct(member, year, ageCategory) {
  if (ageCategory === 'all') return true;
  if (!member.data_nascita || isNaN(new Date(member.data_nascita))) return false;

  const birthDate = new Date(member.data_nascita);
  const ageInTargetYear = year - birthDate.getFullYear();

  return ageCategory === 'maggiorenni' ? ageInTargetYear >= 18 : ageInTargetYear < 18;
}

// Scenario di test:
// Un ceraiolo nato il 15/06/2004 si iscrive alla Famiglia dei Santantoniari nel 2018.
// All'epoca dell'iscrizione (anno 2018), il ragazzo aveva 14 anni.
const historicalMember = {
  id: 101,
  cognome: 'Santantoniaro',
  nome: 'Francesco',
  data_nascita: '2004-06-15',
  data_prima_iscrizione: 2018,
};

const queryYear = 2018;

console.log('\n[DATI DEL SOCIO]');
console.log('Nominativo:', historicalMember.cognome, historicalMember.nome);
console.log('Data di nascita:', historicalMember.data_nascita);
console.log('Anno di iscrizione (storico):', historicalMember.data_prima_iscrizione);
console.log('Anno interrogato nel report:', queryYear);

// Età reale nel 2018
const birthYear = new Date(historicalMember.data_nascita).getFullYear();
const trueAgeIn2018 = queryYear - birthYear;
console.log(`Età effettiva nell'anno ${queryYear}: ${trueAgeIn2018} anni (MINORENNE)`);

// 1. Interrogazione: Nuovi iscritti MINORENNI del 2018
const includedAsMinor_Original = filterMemberByAgeCategory_Original(historicalMember, queryYear, 'minorenni');
const includedAsMinor_Correct = filterMemberByAgeCategory_Correct(historicalMember, queryYear, 'minorenni');

console.log('\n[REPORT 2018 - CATEGORIA MINORENNI]');
console.log('- Algoritmo Corretto include il socio nei MINORENNI 2018?:', includedAsMinor_Correct);
console.log('- Codice Esistente (db.js) include il socio nei MINORENNI 2018?:', includedAsMinor_Original);

// Il codice esistente ESCLUDE il socio dai minorenni del 2018!
assert.equal(includedAsMinor_Original, false, 'db.js esclude erroneamente il socio dai minorenni 2018');
assert.equal(includedAsMinor_Correct, true, 'L algoritmo corretto include il socio nei minorenni 2018');

// 2. Interrogazione: Nuovi iscritti MAGGIORENNI del 2018
const includedAsAdult_Original = filterMemberByAgeCategory_Original(historicalMember, queryYear, 'maggiorenni');
const includedAsAdult_Correct = filterMemberByAgeCategory_Correct(historicalMember, queryYear, 'maggiorenni');

console.log('\n[REPORT 2018 - CATEGORIA MAGGIORENNI]');
console.log('- Algoritmo Corretto include il socio nei MAGGIORENNI 2018?:', includedAsAdult_Correct);
console.log('- Codice Esistente (db.js) include il socio nei MAGGIORENNI 2018?:', includedAsAdult_Original);

// Il codice esistente CLASSIFICA un quattordicenne come maggiorenne nel 2018!
assert.equal(includedAsAdult_Original, true, 'db.js classifica erroneamente il socio come maggiorenne nel 2018');
assert.equal(includedAsAdult_Correct, false, 'L algoritmo corretto esclude il socio dai maggiorenni 2018');

console.log('\n' + '='.repeat(80));
console.log('[CONFERMATO] BUG-04 RIPRODOTTO CON SUCCESSO:');
console.log('- L uso di new Date() invece di year rende le statistiche storiche dipendenti dalla data odierna.');
console.log('- I nuovi iscritti minorenni di anni passati spariscono dai report storici minorenni non appena compiono 18 anni.');
console.log('- Un quattordicenne iscritto nel 2018 risulta retroattivamente maggiorenne nel report del 2018.');
console.log('='.repeat(80));
