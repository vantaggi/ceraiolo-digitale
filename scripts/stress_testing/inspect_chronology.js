import initSqlJs from 'sql.js';
import fs from 'node:fs';

const SQL = await initSqlJs();
const db = new SQL.Database(fs.readFileSync('tests/fixtures/synthetic_ceraiolo_audit.sqlite'));

const res2 = db.exec(`
  SELECT t.id_tesseramento, t.id_socio, s.cognome, s.nome, s.data_prima_iscrizione, t.anno, t.quota_pagata, t.numero_blocchetto, t.numero_ricevuta, t.data_pagamento
  FROM Tesseramenti t
  JOIN Soci s ON t.id_socio = s.id
  WHERE t.anno < s.data_prima_iscrizione;
`);

console.log('Righe con pagamento prima di data_prima_iscrizione:', res2[0]?.values?.length);
if (res2[0]) {
  for (const row of res2[0].values) {
    console.log(row);
  }
}
