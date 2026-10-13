# Original User Request

## 2026-09-10T21:37:47Z

Piano di miglioramento ergonomico, accessibilità senior (WCAG 2.2) e rifinitura funzionale per "Ceraiolo Digitale", applicazione ufficiale della Famiglia dei Santantoniari di Gubbio. Il software esistente è pienamente operativo e NON deve essere riscritto da zero. Tutte le modifiche devono essere implementate rigorosamente sul branch git `development`.

Working directory: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale
Git branch: development
Integrity mode: development

Riferimento documento master di progetto: `piano_di_refactoring_santantoniari.md` (già presente e consultabile nel repository/artifact).

## Vincolo Fondamentale di Progetto
- **Miglioramento incrementale senza riscrittura (No Rewrite):** L'architettura esistente (Vue 3, Dexie.js, sql.js, pdf-lib, jsPDF, Pinia) deve essere preservata. Nessuna regressione sulle formule di calcolo contabile o sui modelli dati.

## Requirements

### R1. Check & Ottimizzazione Flusso Blocchetti (10 Foglietti / Multi-Socio)
- In `src/views/BatchEntryView.vue`:
  - Navigazione naturale del blocchetto fisico con barra visuale a 10 caselle numerate `[1] [2] ... [10]`.
  - Rafforzamento della gestione multi-socio per singolo foglietto (`currentReceipt.soci`) con calcolo e visualizzazione del totale cassa del libretto in tempo reale.
  - Ricerca socio rapida con modulo di creazione nuovo socio inline senza uscire dalla ricevuta.

### R2. Hub Stampe Unificato & "PDF Lab" con Anteprima Reattiva
- Fondere `src/views/ReportsView.vue` e `src/views/ReportsBetaView.vue` in un unico Hub di Stampa:
  - In primo piano 4 pulsanti rapidi (1 clic) per le stampe essenziali (Rinnovi con arretrati, Ceraioli da sollecitare, Fogli tessere 6x, Resoconto cassa blocchetti).
  - Sezione espandibile "PDF Lab" con tutti i filtri avanzati (Manicchie, elezioni aventi diritto, anni di pagamento con logica AND/OR, selezione e riordino colonne, colonna firma manuale, preset salvati).
  - Anteprima tabellare reattiva (Live Preview) che si aggiorna istantaneamente ad ogni spunta di filtro o colonna prima del download.

### R3. Generazione Tessere con Dati Impressi & Ordinamento per Manicchia
- In `src/services/export.js` / `src/components/TesseraTemplate.vue`:
  - Mantenimento della stampa tipografica di Nome, Cognome e Data di Nascita formattata in italiano su template grafico fronte/retro (sostituibile annualmente da Impostazioni).
  - Aggiunta dell'opzione di ordinamento per **MANICCHIA** (con ordinamento alfabetico interno) oltre all'ordine alfabetico generale (A-Z), per consentire la stampa di mazzetti già divisi per zona e pronti per la consegna ai referenti territoriali.

### R4. Sistema di Icone Vettoriali SVG & Stile Istituzionale Santantoniari
- Sostituire tutte le emoji sparse nell'interfaccia (header, pulsanti, tabelle, badge) con icone vettoriali SVG pulite, scalabili, conformi allo stile minimalista di Jony Ive / Apple SF Symbols, con palette cromatica coordinata con la Famiglia dei Santantoniari (nero inchiostro, bianco, oro caldo e accenti ceraioli).

### R5. Temi, Tipografia e Allineamenti (Opzione 2 Confermata)
- **Dark Mode Preservata (Opzione 2):** Mantenere sia il tema Chiaro che il tema Scuro; rimuovere il tasto `🕯️`/`🔥` dalla barra di navigazione principale e posizionare il selettore del tema dentro `src/views/SettingsView.vue`.
- **Contrasti WCAG 2.2:** Scurire i colori di warning (`#c2410c`) e info (`#0369a1`) per garantire rapporto di contrasto ≥4.5:1.
- **Tipografia Offline:** Rimuovere l'import remoto da Google Fonts in `main.css`, adottando uno stack di sistema sans-serif robusto (`system-ui, "Segoe UI", Roboto, sans-serif` o bundle locale) con font base a 17px.
- **Allineamento Contabile:** Importi, cassa e quote allineati a destra con `font-variant-numeric: tabular-nums` e righe di tabella con altezza minima 48-52px e zebratura alternata.

### R6. Data Visualization Senior-Friendly (WCAG 2.2)
- In `src/components/DashboardCharts.vue`:
  - Eliminare la confusione visiva del doppio asse Y sovrapposto e dei tooltip hover-only.
  - Inserire permanentemente sotto il grafico una **tabella dati speculare ad alto contrasto** con font grande (≥17px), leggibile a colpo d'occhio senza interazione del mouse.

## Acceptance Criteria

### Verifica Funzionale & Esperienziale
- [ ] Tutto il codice e i file modificati risiedono sul branch `development`.
- [ ] Il flusso del blocchetto consente di caricare con rapidità i 10 foglietti con uno o più soci per ricevuta senza ricaricare la pagina.
- [ ] L'Hub di Stampa è unificato e il PDF Lab aggiorna l'anteprima in tempo reale ad ogni spunta di colonna o filtro.
- [ ] Le tessere soci vengono generate con anagrafica impressa, selezionando l'ordinamento alfabetico o per Manicchia.
- [ ] Tutte le emoji dell'interfaccia principale sono state sostituite da icone SVG chiare ed esplicative.
- [ ] La Dark Mode è attiva, rifinita nei contrasti e selezionabile in Impostazioni senza pericoli di clic accidentali nell'header.
- [ ] I grafici presentano la tabella numerica speculare ad alto contrasto.
- [ ] L'applicazione compila, si avvia senza errori (`npm run build` / `npm run dev`) e mantiene la conformità al 100% con il file database SQLite.

## Follow-up — 2026-09-11T07:24:43Z

Riprendi l'esecuzione sul branch development. Le quote sono ripristinate. Procedi con la Milestone 3 (Unified Print Hub & Cards con Manicchia sort), Milestone 4 (Senior Data Visualization) e Milestone 5 (Final Verification).

## Follow-up — 2026-09-11T16:48:55Z

Riprendi l'esecuzione. Tutte le milestone M1, M2, M3 e M4 sono implementate, il build è pulito (built in 8.59s) e tutti i 276 test su Vitest sono verdi. Procedi con la Milestone 5 (Final Verification & Victory Audit) per formalizzare il completamento sul branch development.

## Follow-up — 2026-09-11T17:16:56Z

This is a single self-contained fix; keep it small and focused.

Rifinitura ed eliminazione completa di tutte le emoji residue nell'applicazione "Ceraiolo Digitale" (Famiglia dei Santantoniari, Gubbio), sostituendole con le icone vettoriali istituzionali di `BaseIcon.vue`, e completando l'analisi ergonomica di tutte le pagine e modali identificate (AddPaymentModal, ConfirmDeleteModal, ErrorModal, FilterPanel, SettingsView).

Working directory: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale
Git branch: development
Integrity mode: development

## Contesto e Rilevazione
La scansione automatica del codice ha rilevato le emoji residue concentrate nei componenti e pagine secondarie non ancora completamente bonificate:
- `src/components/AddPaymentModal.vue` (emoji nei campi quota, ricevuta, blocchetto, data, chiudi)
- `src/components/ConfirmDeleteModal.vue` (titolo e icona avviso, chiudi)
- `src/components/ErrorModal.vue` (icona blocco, chiudi)
- `src/components/FilterPanel.vue` (icona filtri, compleanno, manicchia)
- `src/views/SettingsView.vue` (sezioni Backup, Esportazione Excel/JSON, Ripristino, Gestione Zone/Gruppi, Factory Reset)

## Requirements

### R1. Bonifica Iconografica Integrale (No Emoji)
- Sostituire ogni singola emoji nei template Vue con il componente `<BaseIcon>` utilizzando i nomi standard della palette (`credit-card`, `coins`, `calendar`, `receipt`, `alert-triangle`, `alert-circle`, `search`, `users`, `save`, `download`, `upload`, `refresh-cw`, `settings`, `trash-2`, `shield-check`, ecc.).
- Rimuovere i caratteri speciali grezzi `✕`, `✓`, `✗` dai pulsanti di chiusura e azione, adottando icone vettoriali con accessibilità per screen reader e touch target minimi di 44px.

### R2. Rifinitura Accessibilità & Ergonomia Senior delle Viste Coinvolte
- **AddPaymentModal.vue:** rendere le etichette dei campi grandi (font >= 17px) e ad alto contrasto, con touch target confortevoli e numeri tabulari (`font-variant-numeric: tabular-nums`).
- **ConfirmDeleteModal.vue & ErrorModal.vue:** garantire pulsanti di conferma/chiusura chiari, con altezza minima 48px e icone vettoriali proporzionate.
- **FilterPanel.vue:** icone dei filtri pulite e coordinate con il tema (chiaro/scuro), pulsante di reset filtri ben visibile.
- **SettingsView.vue:** rifinire le card e i pulsanti delle sezioni Backup, Esportazione e Gestione Manicchie/Zone, eliminando le emoji nei testi dei pulsanti e nei badge di stato.

### R3. Preservazione Assoluta di Compatibilità e Integrità Logica
- Nessuna alterazione delle logiche di calcolo contabile, sincronizzazione Dexie o export database.
- Conservazione rigorosa della suite di test (tutti i 276 test devono restare verdi).

## Acceptance Criteria

### Verifica Automatizzata
- [ ] La scansione regex su `src/` rileva 0 emoji residue nei file di interfaccia utente.
- [ ] Tutti i 276+ test Vitest esistenti passano senza errori (`npm run test -- --run`).
- [ ] La build di produzione compila pulita (`npm run build`).

### Verifica Ergonomica & Visiva
- [ ] Le modali (`AddPaymentModal`, `ConfirmDeleteModal`, `ErrorModal`) presentano pulsanti con touch target >= 44px e icone SVG in stile Jony Ive / Santantoniari.
- [ ] `SettingsView` ha tutte le sezioni amministrative (Backup, Export, Zone) prive di emoji e con badge di stato SVG ad alto contrasto.





## Follow-up — 2026-10-04T13:59:53Z

Audit approfondito di "Ceraiolo Digitale", il gestionale offline (Vue 3, Dexie/IndexedDB, sql.js, jsPDF/pdf-lib) con cui la Famiglia dei Santantoniari di Gubbio gestisce soci, tesseramenti, blocchetti di ricevute e stampe. L'obiettivo è trovare bug, rischi per i dati e lacune di UX/accessibilità, e consegnare un rapporto con evidenze e un piano prioritizzato di bugfix e nuove funzionalità che il responsabile del progetto possa discutere con un altro sviluppatore prima di decidere cosa implementare. Questo è un lavoro di analisi: il codice dell'applicazione non va modificato.

Working directory: c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale
Git branch: development (punto di partenza: commit `f0ec064`)
Integrity mode: development

## Contesto — decisioni già prese dal responsabile (vincolanti per il piano)
- Nessuna riscrittura: solo miglioramenti incrementali dell'architettura esistente.
- Invarianza dei dati: gli schemi Dexie, la compatibilità con il file SQLite importato e le regole di calcolo contabile/statutario non devono cambiare senza una motivazione esplicita e un percorso di migrazione.
- Tema chiaro e tema scuro restano entrambi; il selettore del tema sta in Impostazioni, non nell'header.
- Nessuna emoji nell'interfaccia: solo icone vettoriali coerenti con l'identità Santantoniari (nero, oro caldo `#c59b27`, rosso ceraiolo `#b71c1c`).
- Utenti anziani: WCAG 2.2 AA come riferimento (contrasto ≥ 4.5:1, testi grandi, touch target ≥ 44px, importi allineati a destra con cifre tabulari).
- Funzionalità già richieste e da preservare: flusso blocchetti da 10 foglietti con più soci per ricevuta; Hub Stampe unificato con PDF Lab e anteprima live; tessere con dati impressi ordinabili per manicchia o A-Z; grafici della dashboard con tabella dati speculare.
- Interventi recenti da verificare esplicitamente (fatti nell'ultima sessione, non ancora validati sul campo):
  1. Tabella Blocchetti: prima nascondeva tutti i blocchetti derivati dai pagamenti importati (contatore 990, tabella vuota); ora mostra tutti i blocchetti con filtri rapidi e paginazione.
  2. Scheda socio in tema scuro: pulsante "Modifica" bianco abbagliante, pulsanti quota/elimina senza stile.
  3. Anteprima tessera in Report: aggiunto un fallback grafico istituzionale quando non c'è un template caricato. Il motto «In Fide et Honore» e il sottotitolo "GUBBIO" sono stati inseriti senza una fonte verificata: vanno segnalati come contenuto da confermare con la Famiglia.
  4. Errore runtime `props is not defined` in `ConfirmDeleteModal`.
  5. Errore di caricamento di `sql-wasm.wasm` durante l'import del database (osservato con il server di sviluppo fermo; verificare che l'import funzioni sia in sviluppo sia nella build di produzione con il base path `/ceraiolo-digitale/`).
  6. PDF Lab riorganizzato in due pilastri (criteri di selezione / impaginazione) con chip dei filtri attivi; rimozione del doppio padding nelle pagine e Hub Stampe a 1400px.

## Requirements

### R1. Audit completo con evidenze
Analizzare l'intero progetto (codice, comportamento in esecuzione, output PDF/Excel) in queste aree: (a) bug funzionali e integrità dei dati — import SQLite, pagamenti, blocchetti, backup/ripristino, esportazioni; (b) correttezza dei calcoli — quote, arretrati, minorenni/esenti, aventi diritto al voto, statistiche e totali di cassa; (c) stampe e PDF — tessere, liste, PDF Lab, resoconti cassa; (d) UX, accessibilità senior e coerenza visiva in entrambi i temi; (e) prestazioni con archivi grandi; (f) qualità del codice e dei test — codice morto o duplicato (es. `ReportsBetaView`), test fragili o mancanti; (g) proposte di nuove funzionalità utili alla Famiglia. Includere la verifica dei sei interventi recenti elencati nel Contesto. Per i test va usato un dataset sintetico realistico generato per l'occasione (nessun dato reale disponibile), importabile tramite il normale flusso di import dell'app.

### R2. Piano prioritizzato di bugfix e funzionalità
Trasformare i risultati in un piano d'azione che rispetti le decisioni vincolanti del Contesto: interventi raggruppati in fasi con priorità, ciascuno collegato ai risultati che lo motivano, con stima dello sforzo, rischio, aree di codice coinvolte e un criterio per verificare che sia stato fatto bene. Il piano deve contenere anche una sezione esplicita "Cosa è meglio non toccare" e le domande aperte da decidere insieme all'altro sviluppatore.

### R3. Consegna leggibile e condivisibile, codice invariato
Il rapporto e il piano devono essere in italiano, comprensibili a chi non ha seguito il lavoro, raggiungibili da un unico documento d'ingresso nel repository. Il codice esistente dell'applicazione non va modificato; il team può aggiungere test, script di riproduzione, dataset sintetici e documenti.

## Acceptance Criteria

### Copertura dell'audit
- [ ] Ognuna delle 7 aree (a)–(g) ha una sezione propria; se in un'area non emergono problemi, la sezione elenca concretamente cosa è stato controllato e come.
- [ ] Ognuno dei 6 interventi recenti ha un esito esplicito (funziona / funziona in parte / non funziona) con l'evidenza che lo dimostra.
- [ ] Ogni risultato riporta: identificativo, area, gravità (Critica / Alta / Media / Bassa), posizione nel codice (file e righe), impatto concreto per l'utente o per i dati, e passi o test per riprodurlo.

### Verifica indipendente (non autocertificata)
- [ ] Ogni risultato di gravità Critica o Alta ha una riproduzione eseguibile (test automatico che fallisce, script, oppure passi nel browser con screenshot) che un revisore diverso da chi l'ha trovato ha rieseguito e confermato.
- [ ] Il revisore indipendente ha ricontrollato anche almeno il 30% dei risultati di gravità Media scelti a campione; almeno il 90% dei risultati ricontrollati è confermato, e quelli non confermati sono rimossi o riclassificati nel rapporto.
- [ ] Le affermazioni sui calcoli (quote, arretrati, aventi diritto, totali di cassa) sono confrontate con risultati attesi calcolati indipendentemente su casi sintetici documentati, inclusi casi limite (compleanno a cavallo dei 18 anni, anni non consecutivi, soci senza pagamenti, ricevute con più soci).

### Misure, non stime
- [ ] Le prestazioni sono misurate su un archivio sintetico di almeno 3.000 soci, 15.000 pagamenti e 1.000 blocchetti: tempi di import, ricerca in Home, apertura scheda socio, pagina Blocchetti e generazione di almeno due PDF, con le cifre riportate nel rapporto.
- [ ] I contrasti di colore dei principali elementi di testo, pulsanti e badge sono calcolati con il rapporto numerico in entrambi i temi; ogni valore sotto 4.5:1 compare come risultato.

### Qualità del piano
- [ ] Ogni voce del piano rimanda ad almeno un risultato del rapporto (o, per le nuove funzionalità, a un bisogno osservato e motivato), e ha priorità, sforzo (S/M/L), rischio, aree coinvolte e criterio di verifica.
- [ ] Nessuna voce del piano viola le decisioni vincolanti del Contesto senza dichiararlo esplicitamente e motivarlo.
- [ ] Il piano contiene le sezioni "Cosa è meglio non toccare" e "Domande aperte per la revisione con l'altro sviluppatore".

### Integrità del repository
- [ ] `git diff f0ec064 -- src` non mostra modifiche a file già esistenti (solo file aggiunti).
- [ ] `npm run test -- --run` e `npm run build` passano come al commit `f0ec064` (eventuali nuovi test che documentano bug noti sono marcati in modo da non rompere la suite, e il rapporto li elenca).
