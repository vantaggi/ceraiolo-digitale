# AUDIT TECNICO E PIANO DI SVILUPPO: "CERAIOLO DIGITALE"
**Documento d'Ingresso Unificato — Famiglia dei Santantoniari di Gubbio**

- **Data di Rilascio:** 4 Ottobre 2026
- **Ambiente & Riferimento Git:** Branch `development`, commit base `f0ec064`
- **Oggetto:** Revisione tecnica, analisi di integrità dati, conformità statutaria, accessibilità WCAG 2.2 AA e benchmark prestazionali per il software di gestione soci e tesseramento della Famiglia dei Santantoniari.
- **Stato del Repository:** Codice applicativo `src/` invariato al 100% (`git diff f0ec064 -- src` vuoto). Test esistenti: 284/284 verdi (100%).

---

## 1. RIEPILOGO ESECUTIVO DI ALTO LIVELLO

Il progetto **"Ceraiolo Digitale"** è l'applicazione ufficiale offline-first utilizzata dalla Famiglia dei Santantoniari di Gubbio per la gestione anagrafica dei ceraioli, la riscossione delle quote di tesseramento durante la Festa dei Ceri (15 maggio) e la festa patronale di Sant'Antonio Abate (17 gennaio), la distribuzione e rendicontazione dei blocchetti di ricevute e la stampa tipografica delle tessere socio e degli elenchi ufficiali.

L'audit approfondito condotto sul commit `f0ec064` del branch `development` ha confermato la solidità dell'impianto di base (nessuna dipendenza da server esterni, architettura Vue 3 moderna, suite di 284 test unitari verde al 100%, rimozione integrale delle emoji a favore di icone SVG dedicate).
Tuttavia, l'indagine ha identificato **criticità sostanziali che richiedono interventi mirati prima del prossimo ciclo di tesseramento**:

1. **Rischio Critico di Corruzione Dati (`BUG-01`):** La funzione *"Fix DB Invertito"* esposta in `HomeView.vue` inverte erroneamente numero di blocchetto e numero di ricevuta per tutti i blocchetti con numero $> 10$ ed elimina blocchetti dal database.
2. **Blocco in Produzione su GitHub Pages (`BUG-02`):** La configurazione di WebAssembly (`sql.js`) impedisce il ripristino dei backup SQLite quando l'app è distribuita su percorsi non radice (`/ceraiolo-digitale/`), restituendo errori HTTP 404 per `sql-wasm.wasm`.
3. **Frattura sulle Liste Elettorali Statutarie (`BUG-03`):** Coesistono tre definizioni discordanti degli aventi diritto al voto (Quick Button a 1 anno vs PDF Lab a 4 anni vs Statuto a 5 anni), producendo elenchi elettorali incompatibili per le assemblee generali della Famiglia.
4. **Accessibilità Senior e Contrasti WCAG 2.2 (`UI-01`, `UI-04`):** L'oro istituzionale in tema chiaro (`#c59b27`) fallisce il contrasto minimo su bianco (**2.60:1** vs $\ge 4.5:1$), e sono presenti pulsanti di azione con touch target microscopici (**28x28px** contro i 44px raccomandati).
5. **Collo di Bottiglia Computazionale (`BUG-06`):** La scansione lineare non indicizzata in `BlocchettiView.vue` genera 22,5 milioni di iterazioni sul main thread, causando blocchi percettibili su computer e tablet datati (risolvibile con indicizzazione $O(1)$ con Map, accelerando di 7,5x).

---

## 2. MAPPA DELLA DOCUMENTAZIONE E DEGLI ARTEFATTI

L'audit è interamente documentato nei seguenti file di vertice inclusi nel repository:

### Documenti Magistrali
- **[`AUDIT_REPORT_CERAIOLO_DIGITALE.md`](./AUDIT_REPORT_CERAIOLO_DIGITALE.md):**  
  *Rapporto Tecnico ed Esecutivo Completo.* Contiene l'analisi dettagliata di tutte le 7 aree (a-g), la verifica formale dei 6 interventi recenti con esito esplicito, le formule matematiche di contrasto WCAG, i benchmark numerici reali e le 7 proposte di nuove funzionalità per la Famiglia.
- **[`PIANO_DI_AZIONE_E_SVILUPPO.md`](./PIANO_DI_AZIONE_E_SVILUPPO.md):**  
  *Roadmap Esecutiva e Piano di Intervento.* Organizzato in 5 Fasi progressive (Bloccanti, Statuto/Contabilità, Performance/A11y, Pulizia/Test, Nuove Funzionalità), con schede dettagliate per intervento (Priorità, Sforzo, Rischio, Aree codice, Criteri di verifica), la sezione vincolante *"Cosa è meglio non toccare"* e le 4 domande aperte per la discussione con l'altro sviluppatore.

### Script di Riproduzione, Benchmark e Dataset Sintetico
- **Master Runner di Riproduzione Bug:**  
  `scripts/audit_repro/run_all_repros.js` (esegue e verifica tutti i 12 difetti documentati).
- **Cartella Script di Riproduzione Singoli:**  
  `scripts/audit_repro/` (script da `repro_bug_01_fix_db_invertito.js` a `repro_bug_11_age_discrepancy.js` e `repro_calc_edge_cases.js`).
- **Benchmark Prestazionali:**  
  `scripts/benchmark_performance.js` (misura parsing SQLite, ricerca Home, query scheda, collo di bottiglia $O(N \cdot M)$ e generazione PDF).
- **Risultati Numerici Benchmark:**  
  `scripts/benchmark_results.json` (metriche grezze esportate in JSON).
- **Generatore Dataset Sintetico Realistico:**  
  `scripts/generate_synthetic_db.js` (generatore deterministico basato su PRNG Mulberry32).
- **Validatore Vincoli Dataset:**  
  `scripts/verify_synthetic_db.js` (valida i 3.500 soci, 17.500 pagamenti, 1.000 blocchetti e i 5 corner case).
- **Database SQLite Sintetico di Prova:**  
  `tests/fixtures/synthetic_ceraiolo_audit.sqlite` (file database relazionale da 2,25 MB conforme agli standard di riservatezza).

---

## 3. GUIDA RAPIDA AI COMANDI E VERIFICA INDIPENDENTE

Tutti gli artefatti prodotti sono immediatamente verificabili ed eseguibili da terminale (PowerShell, Bash o CMD) all'interno della cartella principale del progetto:

### 3.1 Esecuzione della Suite Completa di Riproduzione Bug (Milestone M2)
Per verificare che tutti i bug identificati siano reali, deterministici e confermati:
```powershell
node scripts/audit_repro/run_all_repros.js
```
*Esito atteso:* Tabella riassuntiva con 12 verifiche su 12 contrassegnate come `CONFIRMED`.

### 3.2 Esecuzione dei Benchmark Prestazionali (Milestone M1)
Per rieseguire le misurazioni ad alta precisione sui flussi critici dell'archivio sintetico:
```powershell
npx vite-node scripts/benchmark_performance.js
```
*Esito atteso:* Calcolo e stampa a video di tempi (ms), percentili (P50, P95), memoria heap e rigenerazione di `scripts/benchmark_results.json`.

### 3.3 Verifica del Dataset Sintetico
Per verificare che l'archivio SQLite rispetti tutte le distribuzioni e i corner case:
```powershell
node scripts/verify_synthetic_db.js
```
*Esito atteso:* Validazione di 3.500 soci, 17.500 tesseramenti, 1.000 blocchetti e tutti i controlli marcati `PASS`.

### 3.4 Verifica Integrità Suite Vitest e Compilazione Produzione
Per attestare che il lavoro di audit non ha alterato in alcun modo la suite di test esistente né il build di produzione:
```powershell
# Suite di test automatizzati esistenti (284 test)
npm run test -- --run

# Compilazione del bundle di produzione
npm run build

# Verifica che nessun file in src/ sia stato modificato
git diff f0ec064 -- src
```
*Esiti attesi:*
- Vitest: `20 passed (20)`, `284 passed (284)` (100% verdi).
- Build: bundle compilato con successo in `dist/` in ~5,3 secondi.
- Git diff: nessun output (0 file modificati in `src/`).

---

## 4. SCHEMA DI SINTESI DEI RISULTATI E DELLE PRIORITÀ

| ID Finding | Area | Gravità | Titolo Sintetico | Azione Pianificata nel Piano |
| :--- | :---: | :---: | :--- | :--- |
| **BUG-01** | Dati | **CRITICA** | Fix DB Invertito distruttivo | Rimozione pulsante e funzione euristica (Fase 1, P0) |
| **BUG-02** | Dati | **CRITICA** | Mancato caricamento `sql-wasm.wasm` | Allineamento `locateFile` con `BASE_URL` (Fase 1, P0) |
| **BUG-03** | Calcoli | **CRITICA** | Tripla frattura aventi diritto al voto | Unificazione calcolo elettorale statutario (Fase 2, P1) |
| **BUG-04** | Calcoli | **ALTA** | Bug temporale statistiche (`new Date()`) | Calcolo età riferito al 31/12 storico (Fase 2, P1) |
| **BUG-05** | Dati | **ALTA** | Filtro "In Circolazione" include 990 storici | Distinzione blocchetti attivi vs storici (Fase 2, P1) |
| **BUG-06** | Perf | **ALTA** | Collo di bottiglia $O(N \cdot M)$ BlocchettiView | Ottimizzazione con Hash Map $O(1)$ (Fase 3, P2) |
| **BUG-07** | Calcoli | **ALTA** | Typo `member.data_iscrizione` in Report | Allineamento a `data_prima_iscrizione` (Fase 2, P1) |
| **BUG-08** | Calcoli | **ALTA** | Cassa blocchetto somma anni multipli | Aggiunta filtro `anno` nel conteggio (Fase 2, P1) |
| **BUG-09** | Dati | **MEDIA** | Assenza transazioni atomiche multi-anno | Raggruppamento in `db.transaction` (Fase 1, P0) |
| **BUG-10** | Dati | **MEDIA** | Mancata pulizia `db.blocchetti` nel Reset | Inclusione tabella in `wipeDatabase` (Fase 1, P1) |
| **BUG-11** | Calcoli | **MEDIA** | Discrepanza calcolo età (anno vs giorno) | Standardizzazione calcolo anagrafico (Fase 2, P1) |
| **UI-01** | UX/A11y | **CRITICA** | Contrasto Oro `#c59b27` su bianco (2.60:1) | Adozione oro scuro `#947112` per testi/icone (Fase 3, P2) |
| **UI-02** | UX/A11y | **ALTA** | Canvas Chart.js illeggibile in Dark Mode | Connessione reattiva al tema Pinia (Fase 3, P2) |
| **UI-03** | UX/A11y | **ALTA** | Testo bianco su Rosso Dark `#ef5350` (3.49:1)| Testo scuro `#121212` su pulsanti attivi (Fase 3, P2) |
| **UI-04** | UX/A11y | **ALTA** | Touch target microscopici (28x28px) | Espansione bounding box a $\ge 44\text{ px}$ (Fase 3, P2) |
| **DEAD-01** | Qualità | **MEDIA** | File orfano `ReportsBetaView.vue` (48 KB) | Rimozione fisica dal repository (Fase 4, P2) |
| **TEST-01** | Test | **ALTA** | Assenza test su IndexedDB reale | Integrazione `fake-indexeddb` e suite viste (Fase 4, P2) |

---

*Per qualsiasi chiarimento o approfondimento di dettaglio, fare riferimento ai documenti integrali [`AUDIT_REPORT_CERAIOLO_DIGITALE.md`](./AUDIT_REPORT_CERAIOLO_DIGITALE.md) e [`PIANO_DI_AZIONE_E_SVILUPPO.md`](./PIANO_DI_AZIONE_E_SVILUPPO.md).*
