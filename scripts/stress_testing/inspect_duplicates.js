import initSqlJs from 'sql.js';
import fs from 'node:fs';

const SQL = await initSqlJs();
const db = new SQL.Database(fs.readFileSync('tests/fixtures/synthetic_ceraiolo_audit.sqlite'));
const res = db.exec(`
  SELECT t.id_socio, s.cognome, s.nome, t.anno, COUNT(*) as cnt,
         GROUP_CONCAT(t.id_tesseramento) as ids,
         GROUP_CONCAT(t.quota_pagata) as quote,
         GROUP_CONCAT(t.numero_ricevuta) as receipts,
         GROUP_CONCAT(t.numero_blocchetto) as booklets,
         GROUP_CONCAT(t.data_pagamento) as dates
  FROM Tesseramenti t
  JOIN Soci s ON t.id_socio = s.id
  GROUP BY t.id_socio, t.anno
  HAVING cnt > 1;
`);

console.log('Totale coppie (id_socio, anno) con duplicati:', res[0]?.values?.length);
if (res[0]) {
  console.log('Prime 10 righe duplicate:');
  for (let i = 0; i < Math.min(10, res[0].values.length); i++) {
    console.log(res[0].values[i]);
  }
}
