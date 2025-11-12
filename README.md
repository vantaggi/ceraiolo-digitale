# Guida all'Installazione e Configurazione - Ceraiolo Digitale

Ciao! Questa guida ti mostrerà come installare e configurare Ceraiolo Digitale sul tuo computer.

## 1. Prerequisiti

Prima di iniziare, assicurati di avere installato sul tuo sistema:

- **Git**: Per scaricare e gestire il codice.
- **Node.js**: Versione **20.19.0** o superiore. Puoi scaricarlo da [nodejs.org](https://nodejs.org/).
- **Python**: Per generare il database di test. Puoi scaricarlo da [python.org](https://python.org/).
- **SQLite**: Per il database (viene gestito automaticamente dall'applicazione).

## 2. Setup del Progetto: Passo-Passo

Apri il tuo terminale preferito e segui questi comandi.

### Passo 1: Clona il Repository

Crea una cartella dove tenere i tuoi progetti (es. Desktop/Progetti) e al suo interno esegui questo comando per scaricare il codice da GitHub.

```bash
git clone https://github.com/vantaggi/ceraiolo-digitale.git
```

### Passo 2: Entra nella Cartella e Installa le Dipendenze

Una volta scaricato, entra nella nuova cartella e installa tutti i pacchetti necessari.

```bash
# Entra nella cartella del progetto
cd ceraiolo-digitale

# Installa tutte le dipendenze di Node.js
npm install
```

### Passo 3: Genera il Database di Test

L'applicazione ha bisogno di un database per funzionare. Eseguiremo uno script Python per crearne uno con dati finti.

1. Installa la libreria pandas per Python:

```bash
pip install pandas
```

2. Esegui lo script di generazione: Ti verrà fornito un file `generate_mock_data.py`. Mettilo nella cartella principale del progetto ed eseguilo.

```bash
python generate_mock_data.py
```

3. Questo comando creerà un file `santantoniari_test.sqlite` nella cartella. L'applicazione importerà automaticamente questo file al primo avvio.

### Passo 4: Avvia l'Applicazione

Tutto è pronto! Esegui questo comando per avviare il server di sviluppo.

```bash
npm run dev
```

L'applicazione si aprirà automaticamente nel browser all'indirizzo `http://localhost:5173`. Al primo avvio, verrai reindirizzato alla pagina di importazione del database. Seleziona il file `santantoniari_test.sqlite` generato nel passo precedente.

## 4. Funzionalità Principali

L'applicazione include le seguenti funzionalità:

- **Gestione Soci**: Ricerca, aggiunta, modifica ed eliminazione dei soci
- **Gestione Pagamenti**: Registrazione e tracking dei pagamenti annuali
- **Report e PDF**: Esportazione di liste rinnovi e tessere soci in formato PDF
- **Impostazioni**: Configurazione del template delle tessere e gestione dati

### 4.1. Generazione PDF

Il sistema di generazione PDF utilizza:

- **jsPDF**: Per la creazione di documenti PDF
- **pdf-lib**: Per la modifica di template PDF esistenti (tessere soci)
- **Tabelle manuali**: Rendering personalizzato delle tabelle senza dipendenze esterne

### 4.2. Database

- **Tecnologia**: IndexedDB (browser-based) gestito tramite Dexie.js
- **Import/Export**: Supporto per file SQLite per backup e condivisione tra dispositivi
- **Sincronizzazione**: Manuale tramite esportazione/importazione di file SQLite

### 4.3. Test

Sono disponibili test unitari per i componenti principali. Per eseguirli:

```bash
npm run test
```

## Comandi Utili

```sh
# Installazione dipendenze
npm install

# Avvio server di sviluppo
npm run dev

# Esecuzione test
npm run test

# Linting e fix automatico
npm run lint

# Formattazione codice
npm run format

# Build per produzione
npm run build

# Avvio server produzione locale (Windows)
start-server.bat
```

## Configurazione IDE Consigliata

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (e disabilita Vetur).

## Browser Consigliati

- **Browser basati su Chromium** (Chrome, Edge, Brave, ecc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Attiva Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- **Firefox**:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Attiva Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Altre Risorse

- [Manuale Operativo](MANUALE_OPERATIVO.md): Istruzioni per l'uso operativo dell'applicazione
- [Manuale per lo Sviluppatore](DEVELOPMENT_GUIDELINES.md): Linee guida dettagliate per lo sviluppo dell'applicazione
- [Checklist di Test](TEST_CHECKLIST.md): Guida per verificare le funzionalità dell'applicazione
