# Manuale per lo Sviluppatore - Ceraiolo Digitale

Questo documento contiene tutte le informazioni necessarie per sviluppare e mantenere l'applicazione Ceraiolo Digitale.

## 1. Panoramica del Progetto

Ceraiolo Digitale è un'applicazione web per la gestione dei soci e dei pagamenti annuali. L'app funziona completamente offline utilizzando IndexedDB come database locale, con possibilità di importare/esportare dati tramite file SQLite per la sincronizzazione manuale tra dispositivi.

## 2. Architettura Tecnologica

### Stack Principale

- **Frontend**: Vue.js 3 con Composition API
- **Build Tool**: Vite
- **Database**: IndexedDB gestito tramite Dexie.js
- **Styling**: CSS personalizzato
- **Testing**: Vitest
- **Linting**: ESLint con configurazione Vue

### Dipendenze Principali

- `dexie`: Wrapper per IndexedDB
- `sql.js`: Per import/export SQLite
- `jspdf` + `pdf-lib`: Generazione PDF
- `vue-router`: Routing
- `pinia`: State management
- `vee-validate`: Form validation

## 3. Struttura del Database

L'applicazione utilizza IndexedDB con il seguente schema:

### Tabella `soci`

```javascript
{
  id: number,              // Chiave primaria (auto-increment)
  cognome: string,
  nome: string,
  data_nascita: string,    // YYYY-MM-DD
  luogo_nascita: string,
  gruppo_appartenenza: string,
  data_prima_iscrizione: number, // Anno
  note: string
}
```

### Tabella `tesseramenti`

```javascript
{
  id_tesseramento: string, // UUID
  id_socio: number,
  anno: number,
  data_pagamento: string,  // YYYY-MM-DD
  quota_pagata: number,
  numero_ricevuta: number,
  numero_blocchetto: number
}
```

### Tabella `settings`

```javascript
{
  key: string,
  value: any,
  updated_at: string
}
```

### Tabella `local_changes` (per tracking modifiche)

```javascript
{
  id: number,
  table_name: string,
  record_id: any,
  change_type: string,
  timestamp: number,
  old_data: object,
  new_data: object
}
```

## 4. Workflow di Sviluppo

### Setup Ambiente di Sviluppo

1. **Clona il repository**:

   ```bash
   git clone https://github.com/vantaggi/ceraiolo-digitale.git
   cd ceraiolo-digitale
   ```

2. **Installa dipendenze**:

   ```bash
   npm install
   ```

3. **Genera database di test**:

   ```bash
   pip install pandas
   python generate_mock_data.py
   ```

4. **Avvia server di sviluppo**:

   ```bash
   npm run dev
   ```

### Comandi Disponibili

```bash
npm run dev      # Avvia server di sviluppo
npm run build    # Build per produzione
npm run preview  # Preview build locale
npm run test     # Esegui test
npm run lint     # Linting e fix
npm run format   # Formattazione codice
```

## 5. Struttura del Codice

```
src/
├── components/          # Componenti Vue riutilizzabili
├── views/              # Pagine/Viste principali
├── services/           # Servizi (db, export)
├── stores/             # Pinia stores (se utilizzati)
├── router/             # Configurazione routing
├── assets/             # Risorse statiche
└── main.js             # Entry point
```

### Componenti Principali

- **FilterPanel.vue**: Filtri per ricerca soci
- **SocioCard.vue**: Card per visualizzare socio
- **TesseraTemplate.vue**: Template tessera socio
- **ReportsView.vue**: Pagina report e PDF

### Servizi

- **db.js**: Gestione database IndexedDB
- **export.js**: Generazione PDF e export dati

## 6. Generazione PDF

Il sistema utilizza due approcci per la generazione PDF:

### Tabelle (jsPDF)

- Utilizzato per liste rinnovi e report tabellari
- Rendering manuale delle tabelle con styling personalizzato
- Supporto per paginazione automatica

### Tessere Soci (pdf-lib)

- Utilizza template PDF caricati dall'utente
- Modifica il PDF esistente aggiungendo testo formattato
- Mantiene layout e grafica del template

## 7. Import/Export Database

### Import

- Supporto file SQLite (.sqlite, .sqlite3)
- Utilizzo sql.js per lettura file binari
- Conversione automatica a IndexedDB
- Validazione integrità dati

### Export

- Esportazione completa database come SQLite
- Utilizzo sql.js per creazione file binari
- Download automatico nel browser
- Naming automatico con timestamp

## 8. Migrazione Dati da CSV

### Script di Migrazione Completa

L'applicazione include uno script Python `migrazione_completa.py` per migrare dati legacy da file CSV al formato SQLite utilizzato dall'applicazione.

#### File CSV Supportati

Lo script elabora i seguenti file CSV contenenti dati dei soci:

- `maggiorenni.csv` - Soci maggiorenni esistenti
- `minorenni.csv` - Soci minorenni esistenti
- `maggiorenni_nuovi.csv` - Nuovi soci maggiorenni
- `minorenni_nuovi.csv` - Nuovi soci minorenni

#### Funzionalità dello Script

- **Pulizia Database**: Ricrea completamente il database prima della migrazione
- **Elaborazione CSV**: Legge e valida i dati da ciascun file CSV
- **Gestione Duplicati**: Identifica e gestisce soci duplicati basandosi su nome, cognome e data di nascita
- **Normalizzazione Nomi**: Uniforma lo stile dei nomi (iniziale maiuscola, resto minuscolo)
- **Analisi Dettagliata**: Fornisce report completi sui duplicati e statistiche finali

#### Utilizzo dello Script

1. **Prerequisiti**:

   ```bash
   pip install pandas
   ```

2. **Posizionare i file CSV** nella directory principale del progetto insieme allo script

3. **Eseguire la migrazione**:

   ```bash
   python migrazione_completa.py
   ```

4. **Output**: Lo script genera un file `santantoniari.sqlite` pronto per l'import nell'applicazione

#### Struttura Dati CSV Attesa

I file CSV devono contenere le seguenti colonne principali:

- `n°` - ID originale del socio
- `SOCIO` - Cognome e nome (formato "COGNOME Nome")
- `DATA` - Data di nascita
- `LUOGO` - Luogo di nascita
- `REFER.` - Gruppo di appartenenza
- `NOTE` - Note aggiuntive
- Colonne anno (es. `2023`, `2024`) - Contengono dati pagamenti per ciascun anno

#### Report Generati

Lo script produce analisi dettagliate sui:

- Duplicati per ID originale
- Duplicati per nome completo
- Stili di capitalizzazione dei nomi
- Statistiche generali del database

## 9. Best Practices

### Codice

- Utilizzare Composition API Vue 3
- Mantenere componenti piccoli e focalizzati
- Utilizzare async/await per operazioni database
- Gestire errori appropriatamente

### Database

- Utilizzare transazioni per operazioni multiple
- Validare dati prima dell'inserimento
- Loggare modifiche per debugging
- Mantenere integrità referenziale

### Performance

- Utilizzare indici appropriati in Dexie
- Evitare query pesanti nel main thread
- Implementare lazy loading se necessario
- Ottimizzare operazioni PDF

## 10. Testing

### Setup Test

```bash
npm run test
```

### Struttura Test

- Test unitari per componenti Vue
- Mock per servizi database
- Test per funzioni di utilità
- Coverage reporting

## 11. Deployment

### Build Produzione

```bash
npm run build
```

### Server Produzione

Per servire l'app in produzione su Windows:

```bash
start-server.bat
```

Questo script:

- Installa automaticamente `serve` se necessario
- Avvia server sulla porta 3000
- Apre automaticamente il browser

## 12. Troubleshooting

### Problemi Comuni

**Database non si importa**:

- Verificare che il file SQLite sia valido
- Controllare console per errori sql.js
- Assicurarsi che il database non sia già popolato

**PDF non si genera**:

- Verificare che il browser supporti PDF generation
- Controllare console per errori jsPDF/pdf-lib
- Assicurarsi che ci siano dati da esportare

**Performance lente**:

- Verificare numero di record nel database
- Controllare query IndexedDB nella DevTools
- Considerare ottimizzazioni per dataset grandi

### Debug

- Utilizzare Vue DevTools per componenti
- Application → IndexedDB per database
- Console per errori JavaScript
- Network tab per richieste (se presenti)
