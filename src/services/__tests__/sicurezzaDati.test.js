// @vitest-environment node
import 'fake-indexeddb/auto'
import { createRequire } from 'node:module'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// In Node sql.js legge il wasm dal disco, non dal sito
vi.mock('../sqljs.js', async () => {
  const { default: initSqlJs } = await import('sql.js')
  const require = createRequire(import.meta.url)
  return {
    caricaSqlJs: () => initSqlJs({ locateFile: (f) => require.resolve(`sql.js/dist/${f}`) }),
  }
})
vi.mock('../backupService', () => ({ backupService: { notifyChange: () => {} } }))

const {
  db,
  exportDatabaseToSqlite,
  importDatabaseFromSqlite,
  normalizeDatabaseData,
  updateTesseramentoQuota,
  deleteTesseramentiByReceipt,
  deleteSocio,
  deleteTesseramento,
  getRecentActivity,
} = await import('../db.js')
const { caricaSqlJs } = await import('../sqljs.js')

const comeFile = (blob) => ({ name: 'backup.sqlite', arrayBuffer: () => blob.arrayBuffer() })
const fileSqlite = async (sql) => {
  const SQL = await caricaSqlJs()
  const d = new SQL.Database()
  d.run(sql)
  return comeFile(new Blob([d.export()]))
}

// Solo dati inventati
beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
  await db.soci.add({ id: 1, cognome: 'Prova', nome: 'Mario', data_nascita: '1980-01-01' })
  await db.tesseramenti.bulkAdd([
    {
      id_tesseramento: 'p1',
      id_socio: 1,
      anno: 2025,
      quota_pagata: 10,
      numero_ricevuta: 12,
      numero_blocchetto: 2,
    },
    {
      id_tesseramento: 'p2',
      id_socio: 1,
      anno: 2026,
      quota_pagata: 0,
      numero_ricevuta: 13,
      numero_blocchetto: 2,
    },
  ])
  await db.settings.put({ key: 'quotaOrdinaria', value: 12 })
})

describe("ripristino da un file: non lascia l'archivio peggio di prima", () => {
  it('un file con la tabella Soci vuota viene rifiutato e i dati restano', async () => {
    const vuoto = await fileSqlite(`
      CREATE TABLE Soci (id INTEGER PRIMARY KEY, cognome TEXT, nome TEXT);
      CREATE TABLE Tesseramenti (id_tesseramento TEXT PRIMARY KEY, id_socio INTEGER, anno INTEGER);
    `)
    const esito = await importDatabaseFromSqlite(vuoto)
    expect(esito.success).toBe(false)
    expect(esito.error).toContain('non contiene soci')
    expect(await db.soci.count()).toBe(1)
    expect(await db.tesseramenti.count()).toBe(2)
  })

  it('un file senza la tabella Settings non cancella le impostazioni', async () => {
    const senzaImpostazioni = await fileSqlite(`
      CREATE TABLE Soci (id INTEGER PRIMARY KEY, cognome TEXT, nome TEXT);
      CREATE TABLE Tesseramenti (id_tesseramento TEXT PRIMARY KEY, id_socio INTEGER, anno INTEGER);
      INSERT INTO Soci VALUES (2, 'Esempio', 'Anna');
    `)
    expect(await importDatabaseFromSqlite(senzaImpostazioni)).toEqual({ success: true })
    expect((await db.settings.get('quotaOrdinaria'))?.value).toBe(12)
    expect((await db.soci.toArray()).map((s) => s.nome)).toEqual(['Anna'])
  })

  it('un file senza la tabella Tesseramenti non cancella niente', async () => {
    const soloSoci = await fileSqlite(`
      CREATE TABLE Soci (id INTEGER PRIMARY KEY, cognome TEXT, nome TEXT);
      INSERT INTO Soci VALUES (2, 'Esempio', 'Anna');
    `)
    expect((await importDatabaseFromSqlite(soloSoci)).success).toBe(false)
    expect((await db.soci.toArray()).map((s) => s.nome)).toEqual(['Mario'])
    expect(await db.tesseramenti.count()).toBe(2)
  })

  it('un backup con le sue impostazioni le rimette al posto di quelle di adesso', async () => {
    const { blob } = await exportDatabaseToSqlite()
    await db.settings.put({ key: 'quotaOrdinaria', value: 99 })
    await db.settings.put({ key: 'aggiuntaDopo', value: true })
    expect(await importDatabaseFromSqlite(comeFile(blob))).toEqual({ success: true })
    expect((await db.settings.get('quotaOrdinaria')).value).toBe(12)
    expect(await db.settings.get('aggiuntaDopo')).toBeUndefined()
  })
})

describe('backup e ripristino: il giro completo non perde dati', () => {
  it('un pagamento da 0 euro resta 0, non diventa senza importo', async () => {
    const { blob } = await exportDatabaseToSqlite()
    await importDatabaseFromSqlite(comeFile(blob))
    expect((await db.tesseramenti.get('p2')).quota_pagata).toBe(0)
    expect((await db.tesseramenti.get('p1')).quota_pagata).toBe(10)
  })

  it('il registro tiene i dati di prima (pagamento eliminato) anche dopo il ripristino', async () => {
    await deleteTesseramento('p1')
    const { blob } = await exportDatabaseToSqlite()
    await importDatabaseFromSqlite(comeFile(blob))
    const [voce] = await db.local_changes.toArray()
    expect(voce.old_data).toMatchObject({ id_tesseramento: 'p1', anno: 2025, quota_pagata: 10 })
    const [ultima] = await getRecentActivity(1)
    expect(ultima.description).toBe('Cancellato pagamento 2025')
  })

  it('un backup vecchio senza la colonna old_data si ripristina lo stesso', async () => {
    const vecchio = await fileSqlite(`
      CREATE TABLE Soci (id INTEGER PRIMARY KEY, cognome TEXT, nome TEXT);
      CREATE TABLE Tesseramenti (id_tesseramento TEXT PRIMARY KEY, id_socio INTEGER, anno INTEGER);
      CREATE TABLE LocalChanges (id INTEGER PRIMARY KEY, table_name TEXT, change_type TEXT,
        record_id TEXT, timestamp TEXT, new_data TEXT);
      INSERT INTO Soci VALUES (2, 'Esempio', 'Anna');
      INSERT INTO LocalChanges VALUES (1, 'soci', 'create', '2', '1', '{"cognome":"Esempio"}');
    `)
    expect(await importDatabaseFromSqlite(vecchio)).toEqual({ success: true })
    expect((await db.local_changes.toArray())[0].new_data).toEqual({ cognome: 'Esempio' })
  })
})

describe('"Correggi" (blocchetti e ricevute scambiati)', () => {
  it('non cancella un blocchetto assegnato a mano e ancora senza pagamenti', async () => {
    await db.blocchetti.bulkAdd([
      { numero_blocchetto: 2, assegnato_a: 'Auto-Importato da Storico' },
      { numero_blocchetto: 40, assegnato_a: 'Anna Esempio', data_assegnazione: '2026-11-01' },
      { numero_blocchetto: 777, assegnato_a: 'Auto-Importato da Storico' },
    ])
    await normalizeDatabaseData()
    const rimasti = (await db.blocchetti.toArray()).map((b) => b.numero_blocchetto).sort()
    // il 777 (falso, creato dallo storico) va via; il 40 appena consegnato resta
    expect(rimasti).toEqual([2, 40])
  })
})

describe('registro delle modifiche', () => {
  it('la correzione di una quota si registra con il valore di prima e quello nuovo', async () => {
    await updateTesseramentoQuota('p1', 25)
    expect((await db.tesseramenti.get('p1')).quota_pagata).toBe(25)
    const [voce] = await db.local_changes.toArray()
    expect(voce).toMatchObject({
      table_name: 'tesseramenti',
      record_id: 'p1',
      change_type: 'update',
    })
    expect(voce.old_data.quota_pagata).toBe(10)
    expect(voce.new_data.quota_pagata).toBe(25)
    const [ultima] = await getRecentActivity(1)
    expect(ultima.description).toBe('Modificata quota 2025')
  })

  it('una quota riscritta uguale non riempie il registro', async () => {
    await updateTesseramentoQuota('p1', 10)
    expect(await db.local_changes.count()).toBe(0)
  })

  it("la quota si corregge anche se l'id di sole cifre e' salvato come testo", async () => {
    await db.tesseramenti.add({ id_tesseramento: '501', id_socio: 1, anno: 2024, quota_pagata: 10 })
    await updateTesseramentoQuota('501', 15)
    expect((await db.tesseramenti.get('501')).quota_pagata).toBe(15)
  })

  it("un pagamento che non esiste da' errore", async () => {
    await expect(updateTesseramentoQuota('non-esiste', 15)).rejects.toThrow('non trovato')
  })

  it("l'eliminazione di un socio registra anche i suoi pagamenti", async () => {
    await deleteSocio(1)
    expect(await db.soci.count()).toBe(0)
    expect(await db.tesseramenti.count()).toBe(0)
    const [voce] = await db.local_changes.toArray()
    expect(voce.old_data.cognome).toBe('Prova')
    expect(voce.old_data.tesseramenti.map((t) => t.anno).sort()).toEqual([2025, 2026])
    const [ultima] = await getRecentActivity(1)
    expect(ultima.description).toBe('Eliminato socio: Prova Mario')
  })
})

describe('annulla una ricevuta (Registra ricevute)', () => {
  it("trova la ricevuta anche se il numero e' salvato come testo", async () => {
    await db.tesseramenti.add({
      id_tesseramento: 'p3',
      id_socio: 1,
      anno: 2027,
      quota_pagata: 15,
      numero_ricevuta: '31',
    })
    expect(await deleteTesseramentiByReceipt(1, 31, [2027])).toBe(1)
    expect(await db.tesseramenti.get('p3')).toBeUndefined()
  })

  it('non tocca i pagamenti senza numero di ricevuta', async () => {
    await db.tesseramenti.add({
      id_tesseramento: 'p4',
      id_socio: 1,
      anno: 2027,
      numero_ricevuta: null,
    })
    expect(await deleteTesseramentiByReceipt(1, 0, [2027])).toBe(0)
    // ricevuta 0 dello storico: una chiamata senza numero non la tocca
    await db.tesseramenti.add({ id_tesseramento: 'p5', id_socio: 1, anno: 2027, numero_ricevuta: 0 })
    expect(await deleteTesseramentiByReceipt(1, null, [2027])).toBe(0)
    expect(await deleteTesseramentiByReceipt(1, '', [2027])).toBe(0)
    expect(await db.tesseramenti.get('p5')).toBeDefined()
    expect(await db.tesseramenti.get('p4')).toBeDefined()
  })
})
