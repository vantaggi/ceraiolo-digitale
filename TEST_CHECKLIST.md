# 🧪 Checklist di Test per Filtri e Navigazione

Segui questa checklist per verificare che tutte le funzionalità siano operative.

## ✅ Test 1: Importazione Database

- [ ] Avvia l'app con `npm run dev`
- [ ] Verifica che si apra automaticamente la pagina `/import`
- [ ] Esegui `python generate_mock_data.py` per creare il database
- [ ] Importa il file `santantoniari_test.sqlite`
- [ ] Verifica che dopo l'import vieni reindirizzato alla home
- [ ] Apri DevTools → Application → IndexedDB → CeraioloDigitaleDB
- [ ] Verifica che ci siano 5 soci e diversi tesseramenti

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

### Test 7.3: Storico pagamenti

- [ ] Verifica la tabella pagamenti di Mario Rossi
- [ ] Dovrebbero esserci pagamenti per: 2022, 2023, 2025
- [ ] Verifica che il 2024 compaia negli "Anni Non Pagati"

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
- [ ] "Report votazioni" ha l'etichetta "Vecchia regola" e scarica il vecchio elenco
- [ ] Minorenni (nuovo): il PDF elenca i soci che nell'anno non hanno 18 anni, con il riassunto sotto il titolo
- [ ] "Scarica 5 PDF" scarica i cinque documenti dei rinnovi con le scelte fatte nelle righe sopra
- [ ] Controllo quote: "Controlla" mostra l'elenco sotto la riga (o il messaggio verde se va tutto bene); PDF ed Excel si scaricano

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

- [ ] In alto una riga sola con anno, blocchetto e data delle ricevute; sotto, a sinistra "Cerca il socio" con il cursore gia' nel campo, a destra la ricevuta e il riquadro del blocchetto
- [ ] Ricaricando la pagina anno, blocchetto e data restano quelli di prima
- [ ] Blocchetto vuoto: errore in rosso nella riga dei dati

### Test 14.2: Riquadro del blocchetto

- [ ] Con 10 ricevute per blocchetto (Impostazioni › Generale) il riquadro del blocchetto 2 dice "ricevute 11–20"
- [ ] Scelto un blocchetto vuoto la ricevuta parte dalla prima del blocchetto (blocchetto 2: 11); gia' iniziato, dalla prima ancora da inserire
- [ ] Il riquadro dice quante ricevute su 10, quanti soci e quanto incassato; se manca una ricevuta (anche la prima del blocchetto) la elenca, e un clic porta li'
- [ ] "Da inserire" dice quali ricevute restano fino alla fine del blocchetto; finito il blocchetto dice che e' arrivato all'ultima
- [ ] Andando con la freccia oltre l'ultima ricevuta compare l'avviso "La ricevuta N non e' del blocchetto"
- [ ] Sui blocchetti gia' registrati: se compare "ricevute registrate con un numero fuori dal blocchetto", la regola delle 10 ricevute non vale per quel blocchetto (segnarlo nel foglio esiti)
- [ ] Una ricevuta inserita in un altro giorno mostra i suoi soci (anche dopo aver ricaricato la pagina)
- [ ] Dopo ogni pagamento (anche in Turbo e con "Nuovo socio") ricevuta, totale e riquadro si aggiornano; togliendo un socio dalla ricevuta il buco ricompare
- [ ] "Passa al blocchetto N+1" cambia blocchetto e rimette il cursore nella ricerca

**Risultato atteso**: si ricopia un blocchetto di carta vedendo sempre a che punto si e' e cosa manca

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

### Test 17.2: Dati e backup

- [ ] Dall'alto: Backup, Esporta, Ripristina da un file, Controllo qualita' dei dati, Zona pericolosa
- [ ] Non c'e' piu' il riquadro "Stato salute dati" in cima (lo dice il Controllo qualita')
- [ ] "Importa JSON" si raggiunge anche con Tab e si apre con Invio
- [ ] Ripristina da un file chiede conferma prima di sostituire i dati

### Test 17.3: Manicchie

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

