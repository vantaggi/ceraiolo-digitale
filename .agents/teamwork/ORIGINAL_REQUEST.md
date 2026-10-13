# Original User Request

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
