# Manuale per lo Sviluppatore: App Famiglia Sant'antoniari

Questo documento contiene tutte le informazioni necessarie per sviluppare l'applicazione gestionale per la Famiglia Sant'antoniari. È la fonte di verità per l'architettura, le funzionalità e le procedure da seguire.

## 1. Visione d'Insieme e Obiettivi

L'obiettivo è creare una Progressive Web App (PWA) per modernizzare la gestione dei soci e dei tesseramenti. L'app dovrà funzionare perfettamente offline su più dispositivi (PC e tablet), permettendo a diversi operatori di lavorare in contemporanea e di sincronizzare i dati in un secondo momento. L'interfaccia utente deve essere semplice, intuitiva e responsive.

## 2. Architettura e Stack Tecnologico

Il sistema è basato su un'architettura disaccoppiata che garantisce performance e funzionamento offline.

- Applicazione (Frontend): Una PWA costruita con Vue.js (o React) e stilizzata con Tailwind CSS.
- Database Locale: IndexedDB gestito tramite la libreria Dexie.js. Questo è il cuore dell'app e garantisce l'operatività offline.
- Database Centrale & Sync: Firebase Firestore agisce come database "master" nel cloud per la sincronizzazione.
- Generazione PDF: Una libreria lato client come jsPDF.

## 3. Setup dell'Ambiente di Sviluppo (Azione Richiesta)

Per ragioni di privacy e sicurezza, non avrai accesso al database reale con i dati sensibili. Lavorerai con un database di test che ha la stessa identica struttura ma è riempito con dati finti.

### 3.1. Creazione del Database di Test

- Esegui lo script Python: Ti verrà fornito uno script `generate_mock_data.py`. Eseguilo con Python (`python generate_mock_data.py`).
- Ottieni il database: Questo comando creerà un file `santantoniari_test.sqlite` nella stessa cartella. Questo è il tuo database di sviluppo. Contiene dati finti ma strutturalmente identici a quelli reali. L'app che svilupperai dovrà importare questo file al primo avvio.

### 3.2. Struttura del Database (Schema) - AGGIORNATO

Questa è la mappa del database con cui lavorerai. **NOTA**: Le chiavi primarie sono state cambiate da INTEGER a TEXT per supportare gli UUID, fondamentali per la sincronizzazione.

**Tabella Soci**

| Nome Colonna                | Tipo Dati     | Descrizione                                      |
| :-------------------------- | :------------ | :----------------------------------------------- |
| id                          | TEXT          | Chiave primaria (UUID)                           |
| cognome, nome               | TEXT          | Dati anagrafici                                  |
| luogo_nascita, data_nascita | TEXT          | Formato YYYY-MM-DD per la data                   |
| gruppo_appartenenza         | TEXT          | Gruppo di riferimento                            |
| data_prima_iscrizione       | INTEGER       | Anno della prima iscrizione                      |
| note                        | TEXT          | Annotazioni                                      |
| timestamp_modifica          | INTEGER       | Data e ora dell'ultima modifica (Unix timestamp) |
| originale_id, file_origine  | INTEGER, TEXT | Dati storici dalla migrazione (non usati dopo)   |

**Tabella Tesseramenti**

| Nome Colonna                       | Tipo Dati | Descrizione                                      |
| :--------------------------------- | :-------- | :----------------------------------------------- |
| id_tesseramento                    | TEXT      | Chiave primaria (UUID)                           |
| id_socio                           | TEXT      | Chiave esterna che si collega a Soci.id (UUID)   |
| anno                               | INTEGER   | Anno del tesseramento                            |
| data_pagamento                     | TEXT      | Formato YYYY-MM-DD                               |
| quota_pagata                       | REAL      | Importo                                          |
| numero_ricevuta, numero_blocchetto | INTEGER   | Dettagli ricevuta                                |
| timestamp_modifica                 | INTEGER   | Data e ora dell'ultima modifica (Unix timestamp) |

### 3.3. Gestione della Sicurezza (Obbligatorio)

Le credenziali e i dati non devono mai finire su Git/GitHub.

- Crea un file `.gitignore`: Nella root del progetto, crea questo file per dire a Git cosa ignorare.

```
# Database
*.sqlite
# Credenziali e variabili d'ambiente
.env.local
# Dipendenze e file di build
node_modules/
dist/
```

- Crea un file `.env.local`: Qui inserirai le chiavi API di Firebase. Questo file non andrà su Git.

```
# Esempio per Vue.js
VUE_APP_FIREBASE_API_KEY="AIzaSy...YOUR_KEY"
VUE_APP_FIREBASE_PROJECT_ID="your-project-id"
# ...altre chiavi...
```

- Imposta le Regole di Sicurezza su Firebase: La vera protezione è sul backend. Imposta le regole di Firestore affinché solo gli utenti autenticati possano leggere e scrivere.

## 4. Flusso dei Dati: Il "Viaggio" dei Dati

L'interazione con i dati segue un percorso a 3 livelli:

- Importazione (Una Tantum): L'app usa sql.js per leggere il file `.sqlite` e copiare tutti i dati dentro IndexedDB (gestito da Dexie.js).
- Operatività Locale (99% del tempo): L'app lavora esclusivamente su IndexedDB. Ogni lettura e scrittura è locale, veloce e offline-first.
- Sincronizzazione (On-demand): Quando l'utente clicca [Sincronizza], l'app invia le modifiche locali a Firestore e scarica quelle remote.

## 5. Specifiche Funzionali (Minimum Viable Product)

**Schermata 1: Dashboard e Ricerca**

- Funzione: Schermata principale con una grande barra di ricerca "live" per cognome o nome.
- Componenti: `SearchBar`, `ResultsList`.
- Azioni: Cliccando un risultato si va alla "Scheda Socio". Un pulsante [+ Aggiungi Nuovo Socio] apre il form di creazione.

**Schermata 2: Scheda Socio**

- Funzione: Vista di dettaglio di un socio.
- Componenti:
  - `SocioInfo`: Mostra i dati anagrafici. Pulsante [Modifica Dati].
  - `PaymentsTable`: Componente chiave. Mostra lo storico dei pagamenti e calcola gli arretrati. Per ogni anno non pagato, mostra un pulsante [Paga Ora].
- Azioni: Registrazione di un nuovo pagamento (anche per anni passati) e modifica dei dati del socio.

**Componente Globale: SyncStatus**

- Funzione: Un'icona sempre visibile che mostra lo stato della sincronizzazione (sincronizzato, modifiche locali, offline).
- Azioni: Permette di avviare la sincronizzazione manuale.

## 6. Funzionalità Future (Post-MVP)

Una volta che il nucleo è stabile, implementeremo una sezione "Report e Stampe" per generare i seguenti PDF:

- Elenco Nuovi Soci dell'anno.
- Elenco Soci Minorenni.
- PDF multi-pagina delle Tessere per un dato anno.
- PDF multi-pagina dei Foglietti Famiglia.

## 7. Strategia di Sincronizzazione Dettagliata

Questa sezione descrive il meccanismo per unire in modo sicuro le modifiche da più dispositivi offline.

### 7.1. Modifica Strutturale: L'uso degli UUID

- Problema: ID numerici auto-incrementanti (1, 2, 3...) non funzionano in un sistema distribuito. Due utenti offline potrebbero creare un "socio #501", creando un conflitto irrisolvibile.
- Soluzione: Ogni nuovo record (sia Socio che Tesseramento) deve essere generato con un UUID (Universally Unique Identifier), una stringa di testo quasi garantita per essere unica (es: f47ac10b-58cc-4372-a567-0e02b2c3d479). La chiave primaria delle tabelle diventa di tipo TEXT.

### 7.2. Il Log delle Modifiche (Outbox)

- Concetto: L'app non invia l'intero database. Traccia ogni singola operazione di scrittura (CREATE, UPDATE, DELETE) in una tabella locale separata su IndexedDB, chiamata `pending_changes`.
- Struttura del Log: Ogni riga nel log conterrà:
  - `id_operazione` (UUID)
  - `tabella` (es: 'Soci' o 'Tesseramenti')
  - `id_record` (l'UUID del socio o tesseramento modificato)
  - `tipo_operazione` ('CREATE', 'UPDATE')
  - `dati` (un oggetto JSON con i dati nuovi o modificati)
  - `timestamp` (quando è stata fatta la modifica)

### 7.3. Il Processo di Sincronizzazione

- L'Utente Clicca [Sincronizza]:
  - **PUSH (Invio Modifiche)**:
    - L'app raccoglie tutte le operazioni dal log `pending_changes`.
    - Le invia a una Cloud Function di Firebase.
    - Se l'invio ha successo, l'app cancella le operazioni inviate dal log locale.
  - **PULL (Ricezione Modifiche)**:
    - L'app chiede a Firebase tutti i record che sono stati modificati dopo l'ultimo timestamp di sincronizzazione salvato localmente.
    - Riceve l'elenco delle modifiche fatte da altri.
    - Le applica al suo database IndexedDB locale (inserendo nuovi record o aggiornando quelli esistenti).
    - Salva il nuovo timestamp come "ultima sincronizzazione effettuata".

### 7.4. Gestione dei Conflitti: "Last Write Wins" (L'Ultimo Vince)

- Scenario: Due utenti modificano lo stesso socio mentre sono offline.
- Soluzione: Si adotta la strategia "Last Write Wins". Quando la Cloud Function elabora le modifiche, confronta il `timestamp_modifica` del dato in arrivo con quello già presente nel database. La modifica con il timestamp più recente vince e sovrascrive l'altra. Questo approccio è semplice, prevedibile e sufficiente per le necessità di questo progetto.
