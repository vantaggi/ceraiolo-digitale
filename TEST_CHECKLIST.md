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
- [ ] Il filtro "Età" dovrebbe essere su "Tutti"
- [ ] NON dovrebbe mostrare risultati (nessuna ricerca attiva)

### Test 2.2: Filtro "Minorenni"

- [ ] Seleziona "Minorenni" dal menu Età
- [ ] Verifica che compaia il badge "2 filtri attivi" (o simile)
- [ ] Dovrebbero comparire: **Luca Bianchi** (2008) e **Paolo Neri** (2012)
- [ ] Verifica che abbiano il badge arancione "Minorenne"

### Test 2.3: Filtro "Maggiorenni"

- [ ] Seleziona "Maggiorenni"
- [ ] Dovrebbero comparire: **Mario Rossi**, **Giulia Verdi**, **Anna Gialli**
- [ ] Nessun badge "Minorenne" visibile

**Risultato atteso**: I filtri età funzionano correttamente.

---

## ✅ Test 3: Filtri - Gruppo

### Test 3.1: Verifica caricamento gruppi

- [ ] Apri DevTools Console
- [ ] Cerca il log "Gruppi caricati: [...]
- [ ] Dovrebbero esserci: INTERNA, PADULE, MADONNA DEL PONTE, BRANCA

### Test 3.2: Seleziona gruppo specifico

- [ ] Seleziona "INTERNA" dal menu Gruppo
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
- [ ] Dovrebbe comparire: "Nessun risultato trovato"

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

### Test 6.1: Click su "Vedi Dettagli"

- [ ] Dalla home, clicca "Vedi Dettagli" su Mario Rossi
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
- [ ] Il clic apre Impostazioni sulla scheda "Dati & Backup"
- [ ] Scegli una cartella e attiva l'auto-salvataggio: compare "Backup: adesso"
- [ ] Modifica un socio, aspetta 5 secondi: nella cartella c'e' `backup_AAAA-MM-GG/ceraiolo_backup.sqlite` aggiornato

### Test 8.2: Dopo la riapertura

- [ ] Chiudi il browser e riapri l'app senza passare da Impostazioni
- [ ] Se il browser ha tenuto il permesso, compare "Backup: ..." e una modifica aggiorna il file
- [ ] Se il browser chiede di nuovo il permesso, compare "Riattiva backup": il clic chiede il permesso e fa subito un backup

**Risultato atteso**: il backup funziona anche senza aprire Impostazioni, e quando e' fermo si vede

---

## ✅ Test 9: Menu a cinque sezioni

### Test 9.1: Voci e pagine

- [ ] Il menu mostra Soci, Incassi, Report PDF, Statistiche, Impostazioni
- [ ] Da un socio aperto resta accesa la voce Soci
- [ ] Incassi si apre su "Registra ricevute"; la scheda "Blocchetti" porta all'elenco dei blocchetti e la voce Incassi resta accesa
- [ ] Report PDF apre i report; il link "Report Builder Beta" apre il report su misura e la voce Report PDF resta accesa
- [ ] Statistiche mostra numeri e grafico dell'andamento
- [ ] Ctrl+K da qualsiasi pagina porta alla ricerca soci

### Test 9.2: Vecchi indirizzi e segnalibri

- [ ] `#/registrazione-seriale` porta a Incassi › Registra ricevute
- [ ] `#/blocchetti` porta a Incassi › Blocchetti
- [ ] `#/reports` e `#/reports-beta` portano a Report PDF

**Risultato atteso**: ogni pagina ha una sola voce di menu accesa, e i segnalibri di prima funzionano ancora

---

## ✅ Test 10: Pagina Soci e Impostazioni › Dati

### Test 10.1: Soci

- [ ] Aprendo l'app il cursore e' gia' nel campo di ricerca, in cima alla pagina
- [ ] Cerca un cognome, apri un socio, torna indietro: ricerca e filtri sono ancora li'
- [ ] I numeri sotto i filtri (Soci, Pagamenti anno, Pagamenti anno prossimo) filtrano l'elenco; "Statistiche" apre la pagina del grafico
- [ ] Con una ricerca attiva l'elenco usa tutta la larghezza; a ricerca vuota compare "Attivita' recente"

### Test 10.2: Manutenzione spostata

- [ ] In fondo alla Home non ci sono piu' Backup DB, Changelog, Fix DB e Reset DB
- [ ] Impostazioni › Dati: "Registro modifiche" scarica il file del registro
- [ ] Impostazioni › Dati › Zona pericolosa: "Correggi" chiede conferma e corregge i blocchetti invertiti

**Risultato atteso**: la Home serve solo a trovare i soci; tutto cio' che tocca il database sta in Impostazioni › Dati

---

## ✅ Test 11: Tessere

### Test 11.1: Sfondo e anteprima (Impostazioni › Template Tessera)

- [ ] Carica lo sfondo vero (foto JPG/PNG o PDF): l'anteprima lo mostra subito, con la scritta "non ancora salvato"
- [ ] Con una foto compare la risoluzione in dpi; sotto 250 dpi compare l'avviso "potrebbe sembrare sgranata"
- [ ] "Salva sfondo", poi ricarica la pagina: l'anteprima mostra ancora lo sfondo salvato
- [ ] In "Prova con un altro nome" scrivi un nome lungo (es. due cognomi e due nomi): l'anteprima va a capo come il PDF
- [ ] "Rimuovi sfondo" chiede conferma; dopo, l'anteprima dice "Nessuno sfondo caricato"

### Test 11.2: Il file e' uguale all'anteprima

- [ ] Home: cerca un socio, "Genera Tessera", apri il PDF: nome, data, a capo e posizione sono quelli dell'anteprima con lo stesso nome
- [ ] Report PDF › Rinnovi: "Genera Tessere" scarica un PDF con una pagina per socio, in ordine di cognome
- [ ] Il PDF di tutte le tessere pesa piu' o meno quanto lo sfondo (non lo sfondo moltiplicato per il numero di soci)
- [ ] Stampa una pagina di prova su carta: misure e margini vanno bene per la tipografia

**Risultato atteso**: quello che si vede nell'anteprima e' esattamente la pagina del PDF che va in stampa

---

## ✅ Test 14: Incassi › Registra ricevute

### Test 14.1: Pagina

- [ ] In alto una riga sola con anno, blocchetto e data delle ricevute; sotto, a sinistra "Cerca il socio" con il cursore gia' nel campo, a destra la ricevuta e il riquadro del blocchetto
- [ ] Ricaricando la pagina anno, blocchetto e data restano quelli di prima
- [ ] Blocchetto vuoto: errore in rosso nella riga dei dati

### Test 14.2: Riquadro del blocchetto

- [ ] Scelto un blocchetto gia' iniziato, la ricevuta riparte da quella dopo l'ultima inserita
- [ ] Il riquadro dice quante ricevute, quanti soci e quanto incassato; se manca una ricevuta in mezzo la elenca, e un clic porta li'
- [ ] Una ricevuta inserita in un altro giorno mostra i suoi soci (anche dopo aver ricaricato la pagina)
- [ ] Dopo ogni pagamento (anche in Turbo e con "Nuovo socio") ricevuta, totale e riquadro si aggiornano; togliendo un socio dalla ricevuta il buco ricompare
- [ ] "Passa al blocchetto N+1" cambia blocchetto e rimette il cursore nella ricerca

**Risultato atteso**: si ricopia un blocchetto di carta vedendo sempre a che punto si e' e cosa manca
