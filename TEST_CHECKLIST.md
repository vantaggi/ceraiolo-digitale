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
