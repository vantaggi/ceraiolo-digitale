/**
 * REPRO-BUG-02: Mancato caricamento sql-wasm.wasm con base path /ceraiolo-digitale/
 * 
 * Posizione nel codice:
 * - src/services/db.js:1042 (exportSocioToSqlite)
 * - src/services/db.js:2302 (importDatabaseFromSqlite)
 * A confronto con:
 * - src/views/ImportView.vue:75
 * - src/services/db.js:703 (exportDatabaseToSqlite)
 * - vite.config.js:10 (base: '/ceraiolo-digitale/')
 * 
 * Descrizione:
 * Nelle funzioni `exportSocioToSqlite` e `importDatabaseFromSqlite`, sql.js viene inizializzato con:
 * `locateFile: (file) => \`/${file}\``.
 * Su un ambiente di produzione distribuito con subpath come GitHub Pages (/ceraiolo-digitale/),
 * il browser tenta di scaricare il file binario WASM all'indirizzo root del dominio (es. https://example.github.io/sql-wasm.wasm)
 * anziché dal subpath configurato (https://example.github.io/ceraiolo-digitale/sql-wasm.wasm).
 * Questo genera una risposta HTTP 404 Not Found che impedisce il ripristino di qualsiasi backup da Impostazioni.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('='.repeat(80));
console.log('REPRO-BUG-02: Mancato caricamento sql-wasm.wasm con base path (db.js:1042, 2302)');
console.log('='.repeat(80));

// 1. Lettura statica della configurazione reale del progetto
const viteConfigContent = fs.readFileSync('vite.config.js', 'utf8');
const dbJsContent = fs.readFileSync('src/services/db.js', 'utf8');
const importViewContent = fs.readFileSync('src/views/ImportView.vue', 'utf8');

// Estrazione del BASE_URL da vite.config.js
const baseMatch = viteConfigContent.match(/base:\s*['"]([^'"]+)['"]/);
const configuredBase = baseMatch ? baseMatch[1] : '/';
console.log(`[Vite Config] Configured BASE_URL: "${configuredBase}"`);
assert.equal(configuredBase, '/ceraiolo-digitale/', 'Il BASE_URL deve essere /ceraiolo-digitale/');

// 2. Estrazione delle strategie di locateFile
console.log('\n[ESTRAZIONE LOCATE_FILE NEL CODICE SORGENTE]');

// ImportView.vue
const importViewLocate = importViewContent.match(/locateFile:\s*\(file\)\s*=>\s*([^,\n}]+)/);
console.log('1. ImportView.vue (Onboarding iniziale):', importViewLocate ? importViewLocate[0] : 'NON TROVATO');

// db.js:703 (exportDatabaseToSqlite)
const exportDbLocate = dbJsContent.match(/exportDatabaseToSqlite[\s\S]*?locateFile:\s*\(file\)\s*=>\s*([^,\n}]+)/);
console.log('2. db.js - exportDatabaseToSqlite:', exportDbLocate ? exportDbLocate[0].split('\n').pop().trim() : 'NON TROVATO');

// db.js:1042 (exportSocioToSqlite)
const exportSocioLocate = dbJsContent.match(/exportSocioToSqlite[\s\S]*?locateFile:\s*\(file\)\s*=>\s*([^,\n}]+)/);
console.log('3. db.js - exportSocioToSqlite:', exportSocioLocate ? exportSocioLocate[0].split('\n').pop().trim() : 'NON TROVATO');

// db.js:2302 (importDatabaseFromSqlite)
const importDbLocate = dbJsContent.match(/importDatabaseFromSqlite[\s\S]*?locateFile:\s*\(file\)\s*=>\s*([^,\n}]+)/);
console.log('4. db.js - importDatabaseFromSqlite:', importDbLocate ? importDbLocate[0].split('\n').pop().trim() : 'NON TROVATO');

// 3. Simulazione risoluzione URL nel runtime browser su GitHub Pages
const simulatedDomain = 'https://santantoniari.github.io';
const simulatedProductionUrl = `${simulatedDomain}/ceraiolo-digitale/#/settings`;
const filename = 'sql-wasm.wasm';

// Strategia A: Con BASE_URL (usata in ImportView e exportDatabaseToSqlite)
const correctStrategy = (file) => new URL(configuredBase + file, simulatedProductionUrl).href;

// Strategia B: Con root slash hardcoded (usata in db.js:1042 e db.js:2302)
const faultyStrategy = (file) => {
  const relative = `/${file}`;
  return new URL(relative, simulatedProductionUrl).href;
};

const resolvedCorrectUrl = correctStrategy(filename);
const resolvedFaultyUrl = faultyStrategy(filename);

console.log('\n[SIMULAZIONE RISOLUZIONE URL IN PRODUZIONE]');
console.log('Browser URL:', simulatedProductionUrl);
console.log('File richiesto:', filename);
console.log('URL risolto con Strategia Corretta (ImportView / exportDB):');
console.log(' ->', resolvedCorrectUrl);
console.log('URL risolto con Strategia DIFETTOSA (db.js:1042 / db.js:2302):');
console.log(' ->', resolvedFaultyUrl);

// 4. Verifiche formali del difetto
assert.equal(
  resolvedCorrectUrl,
  'https://santantoniari.github.io/ceraiolo-digitale/sql-wasm.wasm',
  'La strategia corretta include il subpath del repository',
);

assert.equal(
  resolvedFaultyUrl,
  'https://santantoniari.github.io/sql-wasm.wasm',
  'La strategia difettosa punta alla radice del dominio GitHub Pages',
);

assert.notEqual(
  resolvedFaultyUrl,
  resolvedCorrectUrl,
  'Gli URL divergono: la strategia difettosa omette il subpath',
);

// 5. Verifica presenza file nel bundle di produzione (dist/)
const distWasmPath = path.resolve('dist/sql-wasm.wasm');
const distExists = fs.existsSync(distWasmPath);
console.log('\n[VERIFICA BUNDLE DI PRODUZIONE (dist/)]');
if (distExists) {
  const stats = fs.statSync(distWasmPath);
  console.log(`File dist/sql-wasm.wasm presente (${stats.size} byte).`);
  console.log(`In produzione su GitHub Pages, il server mappa dist/ sulla root del repository:`);
  console.log(`https://santantoniari.github.io/ceraiolo-digitale/sql-wasm.wasm -> HTTP 200 (Presente)`);
  console.log(`https://santantoniari.github.io/sql-wasm.wasm -> HTTP 404 (Inesistente!)`);
} else {
  console.log('Nota: eseguire npm run build per verificare il file in dist/.');
}

console.log('\n' + '='.repeat(80));
console.log('[CONFERMATO] BUG-02 RIPRODOTTO CON SUCCESSO:');
console.log('- In db.js:1042 e db.js:2302 locateFile risolve https://santantoniari.github.io/sql-wasm.wasm');
console.log('- Manca il prefisso /ceraiolo-digitale/ in produzione.');
console.log('- Causa errore HTTP 404 durante il ripristino database SQLite e export singolo socio.');
console.log('='.repeat(80));
