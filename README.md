# Guida all'Installazione e Configurazione per Collaboratori - Ceraiolo Digitale

Ciao! Benvenuto nel team di sviluppo del "Ceraiolo Digitale".

# Guida all'Installazione per Collaboratori - Ceraiolo Digitale

Ciao! Benvenuto nel team di sviluppo del "Ceraiolo Digitale".

Questa guida ti mostrerà come installare il progetto sul tuo computer e iniziare a lavorare.

## 1. Prerequisiti

Prima di iniziare, assicurati di avere installato sul tuo sistema:

- **Git**: Per scaricare e gestire il codice.
- **Node.js**: Versione **20** o superiore. Puoi scaricarlo da [nodejs.org](https://nodejs.org/).
- **Python**: Per generare il database di test. Puoi scaricarlo da [python.org](https://python.org/).
- **jsPDF** e **html2canvas**: Sono installati automaticamente tramite `npm install` e sono usati per la generazione di PDF.

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

### Passo 3: Configura le Variabili d'Ambiente

Per far comunicare l'app con i servizi esterni (come Firebase), devi configurare le chiavi API.

1. Nella cartella principale del progetto, crea un nuovo file chiamato `.env.local`.
2. Chiedi al proprietario del progetto (il tuo amico) di fornirti le chiavi di sviluppo di Firebase.
3. Incolla le chiavi nel file `.env.local` in questo formato:

```env
# Esempio per Vue.js
VUE_APP_FIREBASE_API_KEY="AIzaSy...CHIAVE_FORNITA"
VUE_APP_FIREBASE_PROJECT_ID="progetto-firebase"
# ...tutte le altre chiavi necessarie...
```

**Importante**: Questo file è ignorato da Git per motivi di sicurezza e non deve mai essere condiviso pubblicamente.

### Passo 4: Genera il Database di Test

L'applicazione ha bisogno di un database per funzionare. Eseguiremo uno script Python per crearne uno con dati finti.

1. Installa la libreria pandas per Python:

```bash
pip install pandas
```

2. Esegui lo script di generazione: Ti verrà fornito un file `generate_mock_data.py`. Mettilo nella cartella principale del progetto ed eseguilo.

```bash
python generate_mock_data.py
```

3. Questo comando creerà un file `santantoniari_test.sqlite` nella cartella. L'applicazione è configurata per importare questo file al primo avvio.

## 3. Nuove funzionalità

Il progetto è stato esteso con una nuova sezione **Reports** che consente di esportare in PDF:

- **Renewal List**: esporta la lista di rinnovi in un PDF in modalità landscape con righe alternate.
- **Membership Cards**: esporta le tessere di iscrizione in PDF utilizzando `html2canvas` per catturare l'immagine del componente `TesseraTemplate`.

Queste funzionalità sono accessibili tramite la nuova route `/reports` e sono integrate nella barra di navigazione.

Il file di servizio `src/services/export.js` contiene la logica di generazione PDF, sostituendo l'uso di `jspdf-autotable` con rendering manuale delle tabelle.

Per visualizzare un'anteprima della tessera, è possibile utilizzare il componente `TesseraTemplate` in modalità preview.

### 3.1. Aggiornamenti di dipendenze

- `jspdf-autotable` è stato rimosso dal progetto.
- `html2canvas` è stato aggiunto per la cattura di componenti Vue in PDF.
- Node.js 20 è ora la versione minima richiesta.

### 3.2. Test e CI

Sono stati aggiunti nuovi test unitari per `ReportsView.vue` e `TesseraTemplate.vue`. Per eseguirli, usa:

```bash
npm run test
```

Il file `DEVELOPMENT_GUIDELINES.md` è stato aggiornato con la sezione **PDF Generation Workflow**.

### Passo 5: Avvia l'Applicazione

Tutto è pronto! Esegui questo comando per avviare il server di sviluppo.

```bash
npm run dev
```

## Comandi Utili

```sh
# Installazione dipendenze
npm install

# Avvio sviluppo
npm run dev

# Esecuzione test
npm run test

# Linting e fix automatico
npm run lint

# Formattazione codice
npm run format

# Build produzione
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

- [Manuale per lo Sviluppatore](DEVELOPMENT_GUIDELINES.md): Linee guida dettagliate per lo sviluppo dell'applicazione.
