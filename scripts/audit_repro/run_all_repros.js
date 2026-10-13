/**
 * MASTER RUNNER: Riproduzioni Eseguibili & Test Casi Limite (Milestone M2)
 * Progetto: "Ceraiolo Digitale" (Famiglia dei Santantoniari di Gubbio)
 * 
 * Questo script esegue l'intera suite di riproduzione dei bug (Critici, Alti, Medi)
 * e la verifica indipendente dei calcoli con casi limite, generando un rapporto riassuntivo.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPRODUCTIONS = [
  {
    id: 'BUG-01',
    severity: 'Critica',
    title: 'Fix DB Invertito distruttivo',
    location: 'HomeView.vue:160, db.js:2492-2558',
    file: 'repro_bug_01_fix_db_invertito.js',
  },
  {
    id: 'BUG-02',
    severity: 'Critica/Alta',
    title: 'Mancato caricamento sql-wasm.wasm con base path',
    location: 'db.js:1042, 2302 vs vite.config.js:10',
    file: 'repro_bug_02_wasm_base_path.js',
  },
  {
    id: 'BUG-03',
    severity: 'Critica/Alta',
    title: 'Tripla frattura logica su Aventi Diritto al Voto',
    location: 'db.js:1681 vs ReportsView.vue:2358 vs UI:454',
    file: 'repro_bug_03_voting_fracture.js',
  },
  {
    id: 'BUG-04',
    severity: 'Alta',
    title: 'Bug temporale nelle statistiche storiche (new Date())',
    location: 'db.js:1398-1405, 1534-1541',
    file: 'repro_bug_04_temporal_stats.js',
  },
  {
    id: 'BUG-05',
    severity: 'Alta',
    title: 'Tabella Blocchetti: filtro "In Circolazione" include 990 storici',
    location: 'BlocchettiView.vue:136, 163',
    file: 'repro_bug_05_blocchetti_circolazione.js',
  },
  {
    id: 'BUG-06',
    severity: 'Alta',
    title: 'Collo di bottiglia O(N * M) in BlocchettiView (45M iterazioni)',
    location: 'BlocchettiView.vue:75',
    file: 'repro_bug_06_bottleneck_onm.js',
  },
  {
    id: 'BUG-07',
    severity: 'Alta',
    title: 'Typo campo member.data_iscrizione vs data_prima_iscrizione',
    location: 'ReportsView.vue:2095',
    file: 'repro_bug_07_typo_iscrizione.js',
  },
  {
    id: 'BUG-08',
    severity: 'Alta',
    title: 'Calcolo cassa blocchetto multi-anno privo di filtro anno',
    location: 'BatchEntryView.vue:867, BlocchettiView.vue:49',
    file: 'repro_bug_08_cassa_multi_anno.js',
  },
  {
    id: 'BUG-09',
    severity: 'Media',
    title: 'Mancanza di transazioni atomiche in salvataggio multi-anno',
    location: 'BatchEntryView.vue:1250-1262',
    file: 'repro_bug_09_atomic_transactions.js',
  },
  {
    id: 'BUG-10',
    severity: 'Media',
    title: 'Mancata pulizia tabella db.blocchetti nel Factory Reset',
    location: 'db.js:2449-2461, 2328-2340',
    file: 'repro_bug_10_wipe_blocchetti.js',
  },
  {
    id: 'BUG-11',
    severity: 'Media',
    title: 'Discrepanza calcolo età (anno solare vs data esatta)',
    location: 'utils/payment.js:11 vs export.js:1887',
    file: 'repro_bug_11_age_discrepancy.js',
  },
  {
    id: 'CALC-CASES',
    severity: 'Qualità/Logica',
    title: 'Verifica indipendente calcoli con 4 casi limite documentati',
    location: 'Statuto / Regole contabili Santantoniari',
    file: 'repro_calc_edge_cases.js',
  },
];

console.log('='.repeat(90));
console.log('CERAIOLO DIGITALE - SUITE ESECUTIVA DI RIPRODUZIONE BUG & TEST CASI LIMITE (M2)');
console.log('='.repeat(90));
console.log(`Numero di verifiche in esecuzione: ${REPRODUCTIONS.length}\n`);

const results = [];
let passedCount = 0;
let failedCount = 0;

for (const item of REPRODUCTIONS) {
  const scriptPath = path.join(__dirname, item.file);
  process.stdout.write(`[RUNNING] ${item.id.padEnd(12)} - ${item.title}... `);

  const start = performance.now();
  const proc = spawnSync('node', [scriptPath], {
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '../..'),
  });
  const duration = (performance.now() - start).toFixed(0);

  const isSuccess = proc.status === 0;
  if (isSuccess) {
    passedCount++;
    console.log(`CONFIRMED (${duration}ms)`);
    results.push({ ...item, status: 'CONFIRMED', duration, output: proc.stdout });
  } else {
    failedCount++;
    console.log(`FAILED (${duration}ms)`);
    results.push({ ...item, status: 'FAILED', duration, error: proc.stderr || proc.stdout });
  }
}

console.log('\n' + '='.repeat(90));
console.log('TABELLA RIEPILOGATIVA RIPRODUZIONI (MILESTONE M2)');
console.log('='.repeat(90));
console.log(
  '| ID'.padEnd(12) +
  '| Gravità'.padEnd(16) +
  '| File Script'.padEnd(38) +
  '| Esito'.padEnd(14) +
  '| Tempo |'
);
console.log('|' + '-'.repeat(11) + '|' + '-'.repeat(15) + '|' + '-'.repeat(37) + '|' + '-'.repeat(13) + '|' + '-'.repeat(7) + '|');

for (const r of results) {
  console.log(
    `| ${r.id.padEnd(10)}` +
    `| ${r.severity.padEnd(14)}` +
    `| ${r.file.padEnd(36)}` +
    `| ${r.status.padEnd(12)}` +
    `| ${r.duration.padStart(4)}ms |`
  );
}

console.log('='.repeat(90));
console.log(`Totale esecuzioni: ${REPRODUCTIONS.length} | Convalidate: ${passedCount} | Fallite: ${failedCount}`);

if (failedCount > 0) {
  console.error('\nATTENZIONE: Alcune riproduzioni non hanno confermato il bug!');
  process.exit(1);
} else {
  console.log('\nTUTTE LE RIPRODUZIONI SONO STATE CONFERMATE ED ESEGUITE CON SUCCESSO AL 100%.');
  process.exit(0);
}
