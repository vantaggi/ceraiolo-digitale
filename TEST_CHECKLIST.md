# 🧪 Checklist di Test per Filtri e Navigazione

Segui questa checklist per verificare che tutte le funzionalità siano operative.

## ✅ Test 1: Importazione Database

- [ ] Avvia l'app con `npm run dev`
- [ ] Verifica che si apra automaticamente la pagina `/import`: intestazione "Benvenuto" nella stessa posizione delle altre pagine, sotto "In questo browser, a questo indirizzo, non ci sono dati."
- [ ] Due riquadri affiancati (uno sotto l'altro sul telefono): "Usi già l'app?" con l'indirizzo di questa pagina in grassetto e il nome del file di backup, ed "È la prima volta?" con l'importazione
- [ ] Nessun pulsante rosso nella pagina: anche "Importa" e' un pulsante normale
- [ ] "Importa" e' spento finche' non scegli il file; "Scegli il file" si apre anche con Tab e Invio, e accanto compaiono nome e peso del file
- [ ] Un file che non finisce in .sqlite da' un errore in rosso sotto il bottone
- [ ] Esegui `python generate_mock_data.py` per creare il database
- [ ] Importa il file `santantoniari_test.sqlite`
- [ ] Verifica che dopo l'import vieni reindirizzato alla home
- [ ] Apri DevTools → Application → IndexedDB → CeraioloDigitaleDB
- [ ] Verifica che ci siano 5 soci e diversi tesseramenti
- [ ] Ripristino dal benvenuto: da Impostazioni › Dati scarica un backup (`ceraiolo_backup.sqlite`), poi in Impostazioni › Dati "Cancella tutto e ripristina". Nel benvenuto importa il backup: il messaggio dice "Backup ripristinato: N soci, N pagamenti, impostazioni e blocchetti.", la pagina si ricarica sulla home e tornano anche quote, ricevute per blocchetto e blocchetti assegnati

**Risultato atteso**: Database importato con successo, redirect automatico alla home.

---

## ✅ Test 2: Filtri - Età

### Test 2.1: Filtro "Tutti" (Default)

- [ ] Apri la home `/`
- [ ] L'etichetta "Età" dovrebbe dire "tutte"
- [ ] NON dovrebbe mostrare risultati (nessuna ricerca attiva)

### Test 2.2: Filtro "Minorenni"

- [ ] Scegli "minorenni" nell'etichetta Età: l'etichetta diventa rossa e compare "Azzera"
- [ ] Compaiono solo i nati da 18 anni fa in poi (conta l'anno di nascita, come per la quota)
- [ ] Nella colonna Quota hanno tutti "O Esente"

### Test 2.3: Filtro "Maggiorenni"

- [ ] Scegli "maggiorenni"
- [ ] Nessuno ha "O Esente" nella colonna Quota

**Risultato atteso**: I filtri età funzionano correttamente.

---

## ✅ Test 3: Filtri - Gruppo

### Test 3.1: Verifica caricamento gruppi

- [ ] Apri l'etichetta Manicchia: ci sono tutte le manicchie dei soci e quelle definite in Impostazioni

### Test 3.2: Seleziona gruppo specifico

- [ ] Scegli "INTERNA" nell'etichetta Manicchia
- [ ] Dovrebbero comparire: **Mario Rossi** e **Anna Gialli**
- [ ] Seleziona "BRANCA"
- [ ] Dovrebbe comparire solo: **Paolo Neri**

**Risultato atteso**: Il filtro gruppi funziona.

---

## ✅ Test 4: Ricerca Testuale

### Test 4.1: Ricerca per cognome

- [ ] Reset filtri (se presenti)
- [ ] Digita "ross" nella barra di ricerca
- [ ] Dovrebbe comparire **Mario Rossi**
- [ ] La ricerca dovrebbe essere case-insensitive

### Test 4.2: Ricerca per nome

- [ ] Digita "giulia"
- [ ] Dovrebbe comparire **Giulia Verdi**

### Test 4.3: Ricerca senza risultati

- [ ] Digita "xyz123nonEsiste"
- [ ] Dovrebbe comparire: "Nessun socio trovato" con il link "azzera i filtri"

**Risultato atteso**: La ricerca funziona con debouncing di 300ms.

---

## ✅ Test 5: Combinazione Filtri + Ricerca

### Test 5.1: Gruppo + Ricerca

- [ ] Seleziona gruppo "INTERNA"
- [ ] Digita "mario" nella ricerca
- [ ] Dovrebbe comparire solo **Mario Rossi**

### Test 5.2: Età + Gruppo

- [ ] Reset ricerca
- [ ] Seleziona "Minorenni" + gruppo "BRANCA"
- [ ] Dovrebbe comparire solo **Paolo Neri**

**Risultato atteso**: I filtri si combinano correttamente (AND logic).

---

## ✅ Test 6: Navigazione al Dettaglio

### Test 6.1: Clic sul nome

- [ ] Dalla pagina Soci, clicca il nome di un socio nell'elenco
- [ ] Verifica che l'URL cambi a `/socio/1` (o simile)
- [ ] Verifica che compaia la pagina di dettaglio

### Test 6.2: Link "Torna alla ricerca"

- [ ] Nella pagina dettaglio, clicca "← Torna alla ricerca"
- [ ] Verifica di tornare alla home `/`

### Test 6.3: Navigazione diretta

- [ ] Digita manualmente nell'URL: `http://localhost:5173/socio/2`
- [ ] Verifica che si apra il dettaglio di Giulia Verdi

**Risultato atteso**: La navigazione funziona in entrambe le direzioni.

---

## ✅ Test 7: Pagina Dettaglio Socio

### Test 7.1: Visualizzazione dati

- [ ] Apri il dettaglio di Mario Rossi
- [ ] Verifica che siano visibili:
  - Nome e Cognome
  - Data e luogo di nascita
  - Età calcolata
  - Gruppo di appartenenza
  - Prima iscrizione

### Test 7.2: Badge età

- [ ] Apri dettaglio di Luca Bianchi (minorenne)
- [ ] Verifica che il badge età sia **arancione**
- [ ] Apri dettaglio di Mario Rossi (maggiorenne)
- [ ] Verifica che il badge età sia **verde**
- [ ] Un socio nato a dicembre di 18 anni fa (per esempio nel 2008, se l'anno e' il 2026) ha il badge **verde** anche prima del compleanno: conta solo l'anno di nascita

### Test 7.3: Storico pagamenti

- [ ] Verifica la tabella pagamenti di Mario Rossi
- [ ] Dovrebbero esserci pagamenti per: 2022, 2023, 2025
- [ ] Verifica che il 2024 compaia come riga "X Da pagare" con il link "Paga 2024"

### Test 7.4: Arretrati

- [ ] Apri Giulia Verdi
- [ ] Dovrebbe avere il 2024 come arretrato
- [ ] Apri Paolo Neri
- [ ] Dovrebbe avere 2024 e 2025 come arretrati

**Risultato atteso**: Tutti i dati vengono visualizzati

---

## ✅ Test 8: Backup automatico (Chrome o Edge sul PC)

### Test 8.1: Stato nell'intestazione

- [ ] Senza cartella scelta, sotto il titolo compare "Backup automatico spento"
- [ ] Il clic apre Impostazioni sulla scheda "Dati e backup"
- [ ] Scegli una cartella e attiva l'auto-salvataggio: compare "Backup: adesso"
- [ ] Modifica un socio, aspetta 5 secondi: nella cartella c'e' `backup_AAAA-MM-GG/ceraiolo_backup.sqlite` aggiornato

### Test 8.2: Dopo la riapertura

- [ ] Chiudi il browser e riapri l'app senza passare da Impostazioni
- [ ] Se il browser ha tenuto il permesso, compare "Backup: ..." e una modifica aggiorna il file
- [ ] Se il browser chiede di nuovo il permesso, compare "Riattiva backup": il clic chiede il permesso e fa subito un backup

**Risultato atteso**: il backup funziona anche senza aprire Impostazioni, e quando e' fermo si vede

---

## ✅ Test 9: Menu a quattro sezioni

### Test 9.1: Voci e pagine

- [ ] Il menu mostra Soci, Incassi, Report PDF, Impostazioni
- [ ] Da un socio aperto resta accesa la voce Soci
- [ ] Incassi si apre su "Registra ricevute"; la scheda "Blocchetti" porta all'elenco dei blocchetti e la voce Incassi resta accesa
- [ ] Report PDF apre i report; il link "Report su misura" apre il report su misura e la voce Report PDF resta accesa
- [ ] Ctrl+K da qualsiasi pagina porta alla ricerca soci

### Test 9.2: Vecchi indirizzi e segnalibri

- [ ] `#/registrazione-seriale` porta a Incassi › Registra ricevute
- [ ] `#/blocchetti` porta a Incassi › Blocchetti
- [ ] `#/reports` e `#/reports-beta` portano a Report PDF
- [ ] `#/statistiche` porta alla Home (Soci)

**Risultato atteso**: ogni pagina ha una sola voce di menu accesa, e i segnalibri di prima funzionano ancora

---

## ✅ Test 10: Pagina Soci e Impostazioni › Dati

### Test 10.1: Soci

- [ ] Aprendo l'app il cursore e' gia' nel campo di ricerca, in cima alla pagina
- [ ] Cerca un cognome, apri un socio, torna indietro: ricerca e filtri sono ancora li'
- [ ] Le etichette Pagamenti anno e Pagamenti anno prossimo filtrano l'elenco; "Azzera" toglie tutti i filtri
- [ ] A ricerca vuota compare "Andamento del tesseramento": iscritti dell'ultimo anno con la differenza sull'anno prima, nuovi, rientri, non rinnovati e il grafico
- [ ] I bottoni 5 anni / 10 anni / Tutto cambiano gli anni del grafico; la scelta resta dopo aver ricaricato la pagina
- [ ] Il riquadro si chiude e si riapre dal titolo (anche con Tab e Invio) e resta chiuso dopo aver ricaricato la pagina
- [ ] Con una ricerca attiva il riquadro sparisce e l'elenco dei soci parte subito sotto i filtri
- [ ] Nel tema scuro colori del grafico, assi e legenda si leggono; cambiando tema il grafico cambia colori senza ricaricare
- [ ] Nel tema scuro le tendine aperte (Età, Manicchia, e quelle di Impostazioni e Report) sono scure con le voci leggibili; nel tema chiaro restano chiare. Vale anche per il calendario delle date
- [ ] Con una ricerca attiva l'elenco usa tutta la larghezza; a ricerca vuota compare "Ultime modifiche"

### Test 10.2: Manutenzione spostata

- [ ] In fondo alla Home non ci sono piu' Backup DB, Changelog, Fix DB e Reset DB
- [ ] Impostazioni › Dati: "Registro modifiche" scarica il file del registro
- [ ] Impostazioni › Dati › Zona pericolosa: "Correggi" chiede conferma e corregge i blocchetti invertiti

**Risultato atteso**: la Home serve solo a trovare i soci; tutto cio' che tocca il database sta in Impostazioni › Dati

---

## ✅ Test 11: Tessere

### Test 11.1: Sfondo e anteprima (Impostazioni › Tessera)

- [ ] Carica lo sfondo vero (foto JPG/PNG o PDF): l'anteprima lo mostra subito, con la scritta "non ancora salvato"
- [ ] Con una foto compare la risoluzione in dpi; sotto 250 dpi compare l'avviso "potrebbe sembrare sgranata"
- [ ] "Salva sfondo", poi ricarica la pagina: l'anteprima mostra ancora lo sfondo salvato
- [ ] In "Prova con un altro nome" scrivi un nome lungo (es. due cognomi e due nomi): l'anteprima va a capo come il PDF
- [ ] "Rimuovi sfondo" chiede conferma; dopo, l'anteprima dice "Nessuno sfondo caricato"

### Test 11.2: Il file e' uguale all'anteprima

- [ ] Home: cerca un socio, "Genera Tessera", apri il PDF: nome, data, a capo e posizione sono quelli dell'anteprima con lo stesso nome
- [ ] Report PDF › Tessere: "Genera tessere" scarica un PDF con una pagina per socio, in ordine di cognome
- [ ] Il PDF di tutte le tessere pesa piu' o meno quanto lo sfondo (non lo sfondo moltiplicato per il numero di soci)
- [ ] Stampa una pagina di prova su carta: misure e margini vanno bene per la tipografia

**Risultato atteso**: quello che si vede nell'anteprima e' esattamente la pagina del PDF che va in stampa

## ✅ Test 12: Report PDF › Report su misura

### Test 12.1: Pannello e anteprima

- [ ] A sinistra il pannello con Anno di riferimento, Soci, Pagamenti, Elezioni e, sotto "Impaginazione", Colonne e Titolo e ordine; a destra l'anteprima con il numero di soci
- [ ] Ogni sezione si apre e si chiude dal titolo (anche con Tab e Invio); chiusa, mostra quanti filtri ha attivi
- [ ] Ogni filtro attivo compare come etichetta sopra l'anteprima; la X lo toglie, "Azzera filtri" li toglie tutti senza toccare anno e colonne
- [ ] Cambiando l'anno di riferimento cambiano età, "Quota anno", diritto di voto e arretrati (un ragazzo nato 18 anni prima e' maggiorenne per tutto l'anno)
- [ ] Con filtri che non trovano nessuno compare il messaggio vuoto e "Genera PDF" e' spento

### Test 12.2: PDF uguale all'anteprima

- [ ] Riordinate le colonne con le frecce, il PDF ha le stesse colonne nello stesso ordine dell'anteprima; gli anni dopo le colonne del socio, la firma in fondo
- [ ] Titolo scritto a mano: e' il titolo del PDF; vuoto, il PDF usa il titolo proposto
- [ ] Sotto il titolo del PDF c'e' il riassunto: anno, filtri, ordine

### Test 12.3: Configurazioni salvate

- [ ] Una configurazione salvata prima di questo cambio si carica ancora (l'anno viene dalla vecchia data delle elezioni)
- [ ] Salva, ricarica la pagina, scegli la configurazione: filtri e colonne tornano; il cestino chiede conferma e la toglie

**Risultato atteso**: si costruisce un elenco senza scorrere la pagina, e il PDF stampa quello che si vede

---

## ✅ Test 13: Report PDF a modelli pronti

### Test 13.1: Pagina

- [ ] Report PDF mostra un anno di riferimento in alto e quattro gruppi: Votazioni, Soci, Rinnovi e quote, Tessere; niente barra laterale, niente schede
- [ ] Cambiando l'anno cambiano le descrizioni ("Soci che hanno pagato il 2025 ma non ancora il 2026"); con un anno impossibile (es. 19) compare l'avviso in rosso e i pulsanti si spengono
- [ ] Mentre un PDF si genera il suo pulsante gira e gli altri aspettano

### Test 13.2: I PDF di sempre

- [ ] Aventi diritto (una sezione per manicchia, tutti in un elenco, una manicchia), Lista rinnovi, Lista recupero, Soci per manicchia, Conteggio, Nuovi iscritti, Soci attivi, Cronologia pagamenti: ognuno scarica lo stesso PDF di prima
- [ ] Filtro Maggiorenni / Minorenni di Soci per manicchia, Nuovi iscritti e Cronologia pagamenti: l'eta' e' quella nell'anno di riferimento, dal solo anno di nascita (con l'anno 2020 chi e' nato nel 2005 sta tra i minorenni)
- [ ] "Report votazioni" ha l'etichetta "Vecchia regola" e scarica il vecchio elenco
- [ ] Minorenni (nuovo): il PDF elenca i soci che nell'anno non hanno 18 anni, con il riassunto sotto il titolo
- [ ] "Scarica 5 PDF" scarica i cinque documenti dei rinnovi con le scelte fatte nelle righe sopra
- [ ] Controllo quote: la descrizione parla di "quota dei nuovi soci" (quella di Impostazioni), non di 25 €; "Controlla" mostra l'elenco sotto la riga (o il messaggio verde se va tutto bene); PDF ed Excel si scaricano

### Test 13.3: Personalizza

- [ ] Su Soci per manicchia scegli manicchia e "Non in regola", poi Personalizza: il Report su misura si apre con lo stesso anno, le stesse scelte come etichette e gli ultimi tre anni come colonne
- [ ] Personalizza di Aventi diritto apre il Report su misura con Diritto di voto, Arretrati e Firma, ordinato per manicchia
- [ ] Personalizza di Minorenni e Soci attivi apre il Report su misura con lo stesso elenco del PDF

### Test 13.4: Cose spostate

- [ ] L'anteprima della tessera non c'e' piu' in Report PDF: il link porta a Impostazioni › Tessera
- [ ] Impostazioni › Dati › Controllo qualita' dei dati: "Esegui il controllo" mostra quanti soci hanno dati da sistemare, i primi dieci (con link al socio) e il PDF delle anomalie
- [ ] Le vecchie statistiche di Report (demografia, entrate per manicchia) non ci sono piu'

**Risultato atteso**: ogni elenco che chiedono alla segreteria si trova per nome, con l'anno scelto una volta sola

---

## ✅ Test 14: Incassi › Registra ricevute

### Test 14.1: Pagina

- [ ] In alto una riga sola con anno, blocchetto (con "ricevute 1–10" accanto), data delle ricevute e "Suoni"; sotto, a sinistra "Cerca il socio" con il cursore gia' nel campo, a destra la ricevuta e sotto il riquadro del blocchetto
- [ ] Al computer (1366×768) con 3 soci sulla ricevuta si vedono ricerca, ricevuta, totale e "Ricevuta successiva" senza scorrere
- [ ] Ricaricando la pagina anno, blocchetto e data restano quelli di prima
- [ ] Blocchetto vuoto: errore in rosso nella riga dei dati, e Invio non registra
- [ ] Niente "Turbo Mode" e niente finestra del pagamento in questa pagina
- [ ] Tema chiaro e scuro leggibili; da telefono (320 px) tutto in colonna, niente scorrimento di lato

### Test 14.3: Registrare con la tastiera

- [ ] Scrivi un cognome: il primo socio trovato e' gia' scelto (filo rosso a sinistra) e dice "Invio registra € 10,00"; le frecce su e giu' cambiano il socio scelto
- [ ] Invio registra subito l'anno di riferimento: nella ricevuta compare "Registrato Cognome Nome, 2026, € 10,00", la ricerca si svuota e il cursore resta nel campo
- [ ] Socio nuovo o fuori da almeno un anno (rientro): Invio registra la quota dei nuovi (25), non la ordinaria
- [ ] Socio con arretrati: dopo Invio la sua riga nella ricevuta dice "Aggiungi l'arretrato 2025"; il clic lo registra sulla stessa ricevuta e il totale sale
- [ ] Socio che ha gia' pagato, gia' sulla ricevuta o minorenne esente: Invio non registra e la ricevuta dice perche'
- [ ] Un clic su un socio trovato fa come Invio
- [ ] Ctrl+Invio passa alla ricevuta successiva (anche dalla ricerca); Esc svuota la ricerca; con la ricerca vuota le frecce a sinistra e a destra cambiano ricevuta
- [ ] La X su una riga chiede "Togliere Cognome Nome dalla ricevuta N?" e, confermato, cancella il pagamento
- [ ] Nessun socio trovato: "Registra come nuovo socio" apre il modulo con cognome e nome gia' scritti; "Salva e registra il 2026" lo mette sulla ricevuta
- [ ] Importi sempre all'italiana: "€ 10,00", mai "10.00"

### Test 14.2: Riquadro del blocchetto

- [ ] Con 10 ricevute per blocchetto (Impostazioni › Generale) il riquadro del blocchetto 2 dice "ricevute 11–20"
- [ ] Scelto un blocchetto vuoto la ricevuta parte dalla prima del blocchetto (blocchetto 2: 11); gia' iniziato, dalla prima ancora da inserire
- [ ] Il riquadro dice in una riga quante ricevute su 10, quanti soci e quanto incassato; se manca una ricevuta (anche la prima del blocchetto) la elenca, e un clic porta li'
- [ ] "Da inserire" dice quali ricevute restano fino alla fine del blocchetto; finito il blocchetto dice che e' arrivato all'ultima
- [ ] Andando con la freccia oltre l'ultima ricevuta compare l'avviso "La ricevuta N non e' del blocchetto"
- [ ] Sui blocchetti gia' registrati: se compare "ricevute registrate con un numero fuori dal blocchetto", la regola delle 10 ricevute non vale per quel blocchetto (segnarlo nel foglio esiti)
- [ ] Una ricevuta inserita in un altro giorno mostra i suoi soci (anche dopo aver ricaricato la pagina)
- [ ] Dopo ogni pagamento (anche con "Nuovo socio" e "Aggiungi l'arretrato") ricevuta, totale e riquadro si aggiornano; togliendo un socio dalla ricevuta il buco ricompare
- [ ] "Passa al blocchetto N+1" cambia blocchetto e rimette il cursore nella ricerca

**Risultato atteso**: si ricopia un blocchetto di carta vedendo sempre a che punto si e' e cosa manca

---

## ✅ Test 15: Dettaglio socio

### Test 15.1: Riepilogo in alto

- [ ] Apri un socio in regola: Quota "Pagata", Arretrati "Nessuno", Voto "Sì"
- [ ] Apri un socio con uno o due anni scoperti: Arretrati elenca gli anni, Voto "Dopo gli arretrati" con il motivo sotto
- [ ] Apri un socio fermo da piu' di 3 anni: Arretrati "Da reiscrivere", Voto "No"
- [ ] Apri un minorenne: Quota "Esente", Voto "No" con il motivo dell'eta'

### Test 15.2: Pagamenti a tabella

- [ ] La tabella parte dall'anno di iscrizione (o dal primo pagamento, se e' prima) e arriva all'anno corrente, dal piu' recente
- [ ] Gli anni non pagati hanno la riga "X Da pagare" e un link "Paga ANNO"; il pulsante in alto "Paga ANNO" propone l'anno corrente (o il successivo se e' gia' pagato)
- [ ] Matita su una quota: cambia l'importo, Invio salva, Esc annulla
- [ ] Cestino su un pagamento: chiede conferma, poi la riga torna "Da pagare"

### Test 15.3: Azioni

- [ ] "Tessera ANNO" scarica la tessera del socio (serve lo sfondo in Impostazioni › Template Tessera)
- [ ] "Modifica" apre i campi, "Salva" li salva; ricaricando la pagina i dati restano
- [ ] In fondo, "Altre azioni": "Esporta JSON" scarica il file, "Elimina socio" chiede conferma
- [ ] Da telefono (o finestra stretta) la tabella scorre di lato senza spostare la pagina
- [ ] Tema chiaro e scuro leggibili

**Risultato atteso**: in un colpo d'occhio si vede se il socio e' in regola, se puo' votare e cosa gli manca

---

## ✅ Test 16: Soci a righe compatte

### Test 16.1: Elenco

- [ ] Cerca un cognome: ogni socio e' una riga con nome, data di nascita, manicchia e quota dell'anno (V Pagata, X Da pagare, O Esente, - Non iscritto)
- [ ] L'elenco e' in ordine di cognome e nome
- [ ] Con un solo socio trovato, Invio nel campo di ricerca apre il socio
- [ ] "Esporta PDF" scarica esattamente i soci in elenco (prova con manicchia + una parola cercata)

### Test 16.2: Azioni rapide

- [ ] Su un socio "Da pagare", "Paga ANNO" apre il modulo di pagamento; dopo il salvataggio la riga diventa "Pagata" e il numero "Pagamenti ANNO" sale di uno
- [ ] Sui soci gia' pagati o esenti "Paga" non c'e'
- [ ] L'icona tessera scarica la tessera del socio (serve lo sfondo in Impostazioni › Template Tessera)

### Test 16.3: Ultimi soci aperti

- [ ] Apri tre soci e torna a Soci con la ricerca vuota: "Ultimi soci aperti" li mostra dal piu' recente, al massimo cinque
- [ ] Riaprendo un socio gia' in lista, torna in cima senza doppioni

### Test 16.4: Schermi e temi

- [ ] Da telefono (o finestra stretta) restano nome, quota e azioni; la pagina non scorre di lato
- [ ] Tema chiaro e scuro leggibili; il fuoco con Tab si vede sulle etichette dei filtri

**Risultato atteso**: si trova un socio e si vede subito se ha pagato, senza aprire la scheda

---

## ✅ Test 17: Impostazioni a schede

### Test 17.1: Schede

- [ ] Sotto il titolo ci sono le schede Generale, Tessera, Manicchie, Dati e backup; il contenuto usa tutta la larghezza
- [ ] Ogni scheda ha il suo indirizzo (es. `#/settings/dati`): ricaricando la pagina si resta sulla stessa scheda, e il tasto Indietro del browser torna alla scheda di prima
- [ ] I vecchi indirizzi `#/settings?tab=dati` e `#/settings?tab=template` portano alla scheda giusta
- [ ] "Backup automatico spento" in alto apre Dati e backup; il link di Report PDF › Tessere apre Tessera

### Test 17.2: Generale

- [ ] Quattro righe sotto "Valori proposti": Citta' proposta per i nuovi soci, Ricevute per blocchetto, Quota ordinaria, Quota dei nuovi soci, ognuna con il valore attuale a destra. Non c'e' piu' "Anno Riferimento Minorenni"
- [ ] Premendo una riga (anche con Tab e Invio) si apre una finestra con il campo gia' selezionato; Invio salva, Esc annulla e il fuoco torna sulla riga
- [ ] Le quote accettano la virgola ("27,5" diventa "€ 27,50"); 0 o 101 ricevute per blocchetto danno un errore in rosso e non salvano
- [ ] Dopo il salvataggio la riga mostra il valore nuovo; la quota dei nuovi soci cambiata si vede in "Paga" su un socio nuovo

### Test 17.3: Dati e backup

- [ ] In cima, "I dati di questo computer": Dove sono (l'indirizzo, es. vantaggi.github.io/ceraiolo-digitale), Contenuto (soci e pagamenti come in Andamento), Conservazione, Backup automatico, Versione dell'app. Le righe non si premono
- [ ] Conservazione "Protetti" in verde con l'app installata; "Non protetti" o "Non si sa" in arancione negli altri casi
- [ ] Backup automatico: "Spento" senza cartella, "In pausa" dopo la riapertura finche' non premi Riattiva, "Attivo · ultimo …" con la cartella sotto
- [ ] Poi, dall'alto: Backup, Esporta, Ripristina da un file, Controllo qualita' dei dati, Zona pericolosa
- [ ] Non c'e' piu' il riquadro "Stato salute dati" in cima (lo dice il Controllo qualita')
- [ ] "Importa JSON" si raggiunge anche con Tab e si apre con Invio
- [ ] Ripristina da un file chiede conferma prima di sostituire i dati

### Test 17.4: Manicchie

- [ ] Aggiungi una manicchia (anche con Invio): compare nell'elenco e nel filtro Manicchia della pagina Soci
- [ ] Matita: il nome diventa modificabile, Invio chiede conferma e rinomina per tutti i soci, Esc annulla
- [ ] Cestino: chiede conferma e la toglie dalla lista; i soci restano con la loro manicchia

**Risultato atteso**: ogni impostazione ha un posto solo, e cio' che cancella dati sta in fondo a Dati e backup

---

## ✅ Test 18: Nuovo socio (pagina Soci e Incassi)

Lo stesso modulo e le stesse regole nei due punti: Soci › Nuovo socio e Incassi › Registra ricevute › "Nuovo Socio".

- [ ] Obbligatori: cognome, nome, data e luogo di nascita (il luogo arriva gia' scritto con la citta' di Impostazioni › Generale). Manicchia, anno di prima iscrizione e note sono facoltativi
- [ ] Uscire da un campo vuoto non mostra errori; premendo Salva con campi vuoti l'errore compare sotto ogni campo e il cursore va sul primo
- [ ] Una data di nascita nel futuro o prima del 1900 si segnala appena si esce dal campo
- [ ] Scrivendo cognome e nome di un socio gia' in archivio compare l'avviso con il link alla sua scheda (prima quello con la stessa data di nascita); si puo' comunque salvare
- [ ] Manicchia: lasciata su "Senza manicchia" il socio finisce sotto "Senza manicchia" nei report; "Nuova manicchia…" chiede il nome e la manicchia nuova compare poi in Impostazioni › Manicchie
- [ ] Pagina Nuovo socio: Ctrl+S salva, e dopo il salvataggio si apre la scheda del socio
- [ ] Incassi: da "Socio non trovato" il modulo arriva con cognome (prima parola cercata) e nome (il resto) gia' scritti
- [ ] Incassi: senza anno di prima iscrizione vale l'anno di riferimento delle ricevute; il pagamento va sulla ricevuta in corso con la quota nuovo socio (Impostazioni › Generale)
- [ ] Annulla chiude il modulo senza salvare
- [ ] Tema chiaro e scuro, e sul telefono i campi vanno uno sotto l'altro

**Risultato atteso**: un nuovo socio si inserisce allo stesso modo da Soci e da Incassi, e non si salva senza i dati che servono alle tessere e ai report

---

## ✅ Test 19: Incassi › Blocchetti

- [ ] I numeri in alto (in elenco, in giro, con ricevute saltate) corrispondono alle righe della tabella
- [ ] Ogni riga dice le ricevute del blocchetto (blocchetto 2: 11–20), quante sono registrate su 10, le saltate, quelle non ancora registrate, l'incassato e lo stato (in giro, restituito il…, dallo storico)
- [ ] I blocchetti trovati solo nei pagamenti risultano "Dallo storico" e non contano tra quelli in giro
- [ ] L'occhio apre le ricevute del blocchetto: le saltate sono segnate, quelle con un numero fuori dal blocchetto dicono "fuori dal blocchetto", il nome apre la scheda del socio
- [ ] "Registra" apre Registra ricevute con quel blocchetto e la prima ricevuta ancora da inserire
- [ ] "Assegna un blocchetto" propone il numero successivo all'ultimo e mostra le sue ricevute; un numero gia' assegnato da' l'errore sotto il campo e non salva
- [ ] Segna restituito e Scollega chiedono conferma con la finestra dell'app
- [ ] Cerca per numero di blocchetto, numero di ricevuta o nome di chi lo ha in consegna
- [ ] Tema chiaro e scuro; sul telefono la tabella resta leggibile (scorre di lato dentro il riquadro)

**Risultato atteso**: da questa pagina si vede quali blocchetti sono fuori, quali ricevute mancano e si riprende a registrare con un clic

---

## ✅ Test 20: Incassi › Pagamenti

- [ ] La terza scheda di Incassi, "Pagamenti", si apre sull'anno in corso (o sull'ultimo con pagamenti)
- [ ] L'anno e' quello della quota: un arretrato 2025 pagato nel 2026 sta sotto il 2025, con la data in cui e' stato pagato
- [ ] I numeri in alto (pagamenti, soci, incassato) cambiano con i filtri e corrispondono all'elenco
- [ ] Filtro per blocchetto; ricerca per nome del socio (anche senza accenti) o per numero di ricevuta; "Azzera" toglie blocchetto e ricerca
- [ ] Con "Tutti gli anni" o con molti soci si vedono 200 righe per volta e "Mostra altri 200"
- [ ] Il nome apre la scheda del socio
- [ ] Tema chiaro e scuro; sul telefono le tre schede di Incassi stanno in una riga e la tabella resta leggibile

**Risultato atteso**: si ritrova a schermo chi ha pagato un certo anno, senza stampare il PDF della cronologia

---

## ✅ Test 21: Senza connessione (app installata, Chrome o Edge sul PC)

### Test 21.1: Installazione

- [ ] Con internet, apri https://vantaggi.github.io/ceraiolo-digitale/ e aspetta che la pagina sia caricata
- [ ] Nella barra dell'indirizzo compare l'icona "Installa app" (o menu ⋮ › "Installa Ceraiolo Digitale"): installala
- [ ] Sul desktop c'e' l'icona con il logo; l'app si apre in una finestra sua, con titolo "Ceraiolo Digitale"

### Test 21.2: Offline

- [ ] Stacca internet (Wi-Fi spento), chiudi e riapri l'app dall'icona: si apre normalmente
- [ ] Cerca un socio, registra un pagamento, genera un PDF aventi diritto e una tessera: funziona tutto
- [ ] I caratteri sono gli stessi di quando c'e' internet (titoli con grazie, testo Inter)
- [ ] Impostazioni › Dati: backup manuale e ripristino di un backup funzionano

### Test 21.3: Spostare i dati nell'app installata (una volta sola)

- [ ] Dalla copia usata finora: Impostazioni › Dati › backup manuale, salva il file
- [ ] Nell'app installata: Impostazioni › Dati › Ripristina database con quel file
- [ ] Controlla a campione 3 soci (pagamenti compresi) e i blocchetti
- [ ] Scegli di nuovo la cartella del backup automatico nell'app installata

### Test 21.4: Aggiornamenti

- [ ] Dopo un aggiornamento pubblicato, apri l'app con internet e lavora: la pagina non si ricarica da sola
- [ ] Accanto allo stato del backup compare "Nuova versione pronta · Ricarica" (blu, con la freccia circolare); finche' non lo premi resta li' e non succede nulla
- [ ] Premendolo l'app si ricarica con la versione nuova e i dati sono quelli di prima; Impostazioni › Dati › Versione dell'app mostra la data nuova
- [ ] Senza premerlo: chiudi e riapri l'app, la versione nuova e' attiva

**Risultato atteso**: dopo la prima apertura online l'app si apre e lavora senza internet, con gli stessi dati
