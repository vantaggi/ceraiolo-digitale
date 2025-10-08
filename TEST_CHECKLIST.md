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
