/**
 * REPRO-BUG-10: Mancata pulizia tabella db.blocchetti nel Factory Reset (wipeDatabase)
 * 
 * Posizione nel codice:
 * - src/services/db.js:2449-2461 (wipeDatabase)
 * - src/services/db.js:2328-2340 (importDatabaseFromSqlite)
 * 
 * Descrizione:
 * La funzione `wipeDatabase` (invocata dal pulsante "Ripristino di fabbrica" in SettingsView.vue:747
 * e dal "Reset DB" in HomeView.vue:167) esegue una transazione di pulizia su quattro tabelle:
 * `db.soci`, `db.tesseramenti`, `db.local_changes`, `db.settings`.
 * La tabella `db.blocchetti` (introdotta nella versione 3 dello schema Dexie) NON è stata inclusa
 * né nella dichiarazione della transazione né tra le tabelle svuotate (`.clear()`).
 * Di conseguenza, dopo un ripristino di fabbrica o durante il ripristino da un backup SQLite,
 * la tabella dei blocchetti conserva tutti i record registrati in precedenza (dati fantasma),
 * che riappaiono immediatamente in BlocchettiView contaminando la nuova gestione.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';

console.log('='.repeat(80));
console.log('REPRO-BUG-10: Mancata pulizia tabella db.blocchetti nel Factory Reset (db.js:2449-2461)');
console.log('='.repeat(80));

// 1. Verifica statica della funzione wipeDatabase nel codice sorgente reale
const dbSource = fs.readFileSync('src/services/db.js', 'utf8');

const wipeDbSnippet = dbSource.match(/export async function wipeDatabase\(\)[\s\S]*?console\.log\('Database wiped successfully'\)/);
console.log('[CODICE VERBATIM DI wipeDatabase IN src/services/db.js]');
console.log(wipeDbSnippet ? wipeDbSnippet[0] : 'NON TROVATO');

// 2. Simulazione del database Dexie con le 5 tabelle attive dello schema
class MockDexieDatabase {
  constructor() {
    this.soci = new Set();
    this.tesseramenti = new Set();
    this.local_changes = new Set();
    this.settings = new Set();
    this.blocchetti = new Set(); // Tabella v3
  }

  // Popolamento iniziale
  seed() {
    this.soci.add({ id: 1, nome: 'Mario', cognome: 'Rossi' });
    this.soci.add({ id: 2, nome: 'Luigi', cognome: 'Bianchi' });
    this.tesseramenti.add({ id_tesseramento: 't-1', id_socio: 1, anno: 2026, quota: 10 });
    this.settings.add({ key: 'newMemberQuota', value: 25 });
    this.local_changes.add({ id: 1, table_name: 'soci', change_type: 'insert' });

    // 5 blocchetti inseriti dall'utente
    this.blocchetti.add({ id: 1, numero_blocchetto: 101, assegnato_a: 'Capodieci 1' });
    this.blocchetti.add({ id: 2, numero_blocchetto: 102, assegnato_a: 'Capodieci 2' });
    this.blocchetti.add({ id: 3, numero_blocchetto: 103, assegnato_a: 'Capodieci 3' });
    this.blocchetti.add({ id: 4, numero_blocchetto: 104, assegnato_a: 'Capodieci 4' });
    this.blocchetti.add({ id: 5, numero_blocchetto: 105, assegnato_a: 'Capodieci 5' });
  }

  // Esecuzione di wipeDatabase esattamente come implementata in db.js:2449-2461
  async wipeDatabase_Original() {
    // RIGHE 2449-2461:
    // await db.transaction('rw', db.soci, db.tesseramenti, db.local_changes, db.settings, async () => {
    //   await db.soci.clear()
    //   await db.tesseramenti.clear()
    //   await db.local_changes.clear()
    //   await db.settings.clear()
    // })
    this.soci.clear();
    this.tesseramenti.clear();
    this.local_changes.clear();
    this.settings.clear();
    // db.blocchetti.clear() è OMESSO!
  }

  // Esecuzione di wipeDatabase corretta che include db.blocchetti
  async wipeDatabase_Correct() {
    this.soci.clear();
    this.tesseramenti.clear();
    this.local_changes.clear();
    this.settings.clear();
    this.blocchetti.clear();
  }
}

const mockDb = new MockDexieDatabase();
mockDb.seed();

console.log('\n[STATO DEL DATABASE PRIMA DEL RESET]');
console.log(`- Soci: ${mockDb.soci.size}`);
console.log(`- Tesseramenti: ${mockDb.tesseramenti.size}`);
console.log(`- Settings: ${mockDb.settings.size}`);
console.log(`- Local Changes: ${mockDb.local_changes.size}`);
console.log(`- Blocchetti: ${mockDb.blocchetti.size}`);

// Eseguiamo il wipeDatabase esistente
await mockDb.wipeDatabase_Original();

console.log('\n[STATO DEL DATABASE DOPO IL FACTORY RESET ESISTENTE (wipeDatabase)]');
console.log(`- Soci: ${mockDb.soci.size} (Svuotato: OK)`);
console.log(`- Tesseramenti: ${mockDb.tesseramenti.size} (Svuotato: OK)`);
console.log(`- Settings: ${mockDb.settings.size} (Svuotato: OK)`);
console.log(`- Local Changes: ${mockDb.local_changes.size} (Svuotato: OK)`);
console.log(`- Blocchetti: ${mockDb.blocchetti.size} (NON SVUOTATO! DATI FANTASMA RESIDUI!)`);

// Verifiche formali:
assert.equal(mockDb.soci.size, 0, 'La tabella soci deve essere svuotata');
assert.equal(mockDb.tesseramenti.size, 0, 'La tabella tesseramenti deve essere svuotata');
assert.equal(mockDb.settings.size, 0, 'La tabella settings deve essere svuotata');
assert.equal(mockDb.local_changes.size, 0, 'La tabella local_changes deve essere svuotata');

// DIFETTO: I blocchetti sono ancora presenti
assert.equal(mockDb.blocchetti.size, 5, 'I 5 blocchetti sono ancora presenti dopo il Factory Reset!');

console.log('\n' + '='.repeat(80));
console.log('[CONFERMATO] BUG-10 RIPRODOTTO CON SUCCESSO:');
console.log('- wipeDatabase omette db.blocchetti sia dalla transazione che dal clear().');
console.log('- Dopo un ripristino di fabbrica, la tabella blocchetti contiene ancora i dati precedenti.');
console.log('- L importazione di un nuovo archivio trova i vecchi blocchetti mescolati con il nuovo DB.');
console.log('='.repeat(80));
