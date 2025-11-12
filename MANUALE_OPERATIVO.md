# 📋 Manuale Operativo - Ceraiolo Digitale

## 🎯 Scopo del Documento

Questo manuale fornisce le istruzioni operative per l'utilizzo sicuro e corretto dell'applicazione **Ceraiolo Digitale** in un contesto multi-PC senza sincronizzazione automatica.

## 🏗️ Architettura del Sistema

### Database Locale

- **Tecnologia**: IndexedDB (browser-based)
- **Posizione**: Archiviato localmente nel browser di ogni dispositivo
- **Sincronizzazione**: **MANUALE** - Nessuna sincronizzazione automatica tra dispositivi

### Regola del "Master PC"

Per garantire l'integrità dei dati in un ambiente multi-PC:

1. **Designare un "Master PC"** come dispositivo principale
2. **Tutti gli aggiornamenti** (aggiunta/modifica soci, pagamenti) devono essere effettuati **SOLO** sul Master PC
3. **Gli altri PC** possono essere utilizzati **SOLO** per:
   - Consultazione dati
   - Generazione report e PDF
   - Lettura informazioni

## 📋 Procedure Operative

### 🚀 Avvio e Configurazione Iniziale

#### Primo Avvio (Master PC)

1. Aprire l'applicazione nel browser
2. Se il database è vuoto, verrà automaticamente reindirizzati alla pagina di import
3. Importare il database iniziale (file `.sqlite` fornito dall'amministratore)
4. Verificare che tutti i dati siano stati importati correttamente

#### Configurazione PC Secondari

1. Aprire l'applicazione nel browser
2. Importare il database dal Master PC (vedi sezione "Sincronizzazione Database")
3. **IMPORTANTE**: Non effettuare modifiche sui PC secondari

### 🔄 Sincronizzazione Database

#### Esportazione dal Master PC

1. Navigare su **⚙️ Impostazioni**
2. Nella sezione **💾 Gestione Dati**, cliccare **📦 Database di Backup**
3. Salvare il file `.sqlite` generato in una posizione sicura

#### Importazione sui PC Secondari

1. Su ogni PC secondario, utilizzare la pagina **Importa Database**
2. Selezionare il file `.sqlite` esportato dal Master PC
3. Attendere il completamento dell'importazione
4. Verificare che tutti i dati siano stati importati correttamente

#### Frequenza della Sincronizzazione

- **Consigliata**: Almeno una volta alla settimana
- **Obbligatoria**: Dopo ogni sessione di rinnovi annuali
- **Immediata**: Dopo modifiche significative ai dati

### 👥 Gestione Soci

#### Aggiunta Nuovo Socio (Solo su Master PC)

1. Navigare su **🏠 Ricerca**
2. Cliccare **+ Aggiungi Nuovo Socio**
3. Compilare tutti i campi obbligatori:
   - Nome e Cognome
   - Data e luogo di nascita
   - Gruppo di appartenenza
   - Anno prima iscrizione
4. Aggiungere eventuali note
5. Cliccare **💾 Salva Socio**

#### Modifica Socio (Solo su Master PC)

1. Dalla pagina di dettaglio del socio, cliccare **✏️ Modifica Rapida**
2. Modificare i campi necessari nella stessa pagina
3. Cliccare **✓ Salva** per confermare le modifiche

#### Eliminazione Socio (Solo su Master PC)

1. Dalla pagina di dettaglio del socio, cliccare **🗑️ Elimina Socio**
2. Confermare l'eliminazione nella finestra di dialogo
3. **ATTENZIONE**: Questa operazione è irreversibile

### 💰 Gestione Pagamenti

#### Aggiunta Pagamento (Solo su Master PC)

1. Nella pagina di dettaglio del socio, cliccare **+ Aggiungi Pagamento**
2. Selezionare l'anno di riferimento
3. Inserire i dati del pagamento:
   - Quota pagata
   - Data pagamento
   - Numero ricevuta
   - Numero blocchetto
4. Cliccare **💾 Salva Pagamento**

#### Eliminazione Pagamento (Solo su Master PC)

1. Nella cronologia pagamenti, cliccare l'icona **🗑️** del pagamento da eliminare
2. Confermare l'eliminazione

### 📊 Generazione Report

#### Lista Rinnovi Annuali

1. Navigare su **📊 Report**
2. Selezionare l'anno desiderato
3. Cliccare **📄 Genera PDF Lista Rinnovi**
4. Il PDF includerà automaticamente gli arretrati per ogni socio

#### Tessere Soci

1. Navigare su **📊 Report**
2. Selezionare l'anno desiderato
3. Cliccare **🎫 Genera PDF Tessere**
4. Verrà generato un PDF con tutte le tessere (6 per pagina)

#### Tessera Singola

1. Dalla **🏠 Ricerca**, cliccare su una scheda socio
2. Cliccare **🎫 Genera Tessera** per creare una tessera individuale

### 🎨 Personalizzazione Template

#### Modifica Sfondo Tessere (Solo su Master PC)

1. Navigare su **⚙️ Impostazioni**
2. Nella sezione **🎫 Template Tessera**:
   - Caricare un'immagine di sfondo (max 2MB, JPG/PNG/GIF)
   - Visualizzare l'anteprima in tempo reale
   - Cliccare **💾 Salva Template**
3. Il nuovo sfondo verrà applicato automaticamente a tutte le tessere future

### 💾 Backup e Sicurezza

#### Backup Regolare

- **Frequenza**: Settimanale o dopo modifiche significative
- **Posizione**: Salvare i file di backup in posizioni sicure e multiple
- **Naming**: Utilizzare il formato automatico `ceraiolo_backup_[data].sqlite`

#### Backup Excel

- **Utilizzo**: Per analisi esterne o archiviazione leggibile
- **Contenuto**: 4 fogli separati per categorie di soci
- **Frequenza**: Mensile o su richiesta

## ⚠️ Regole di Sicurezza e Best Practices

### 🔐 Sicurezza Dati

- **Mai condividere** i file di database tra dispositivi non autorizzati
- **Proteggere** i file di backup con password se necessario
- **Verificare** l'integrità dei dati dopo ogni importazione

### 🚫 Azioni Proibite

- **NON** modificare dati sui PC secondari
- **NON** utilizzare più Master PC contemporaneamente
- **NON** saltare le procedure di backup regolare

### ✅ Best Practices

- **Eseguire backup** prima di modifiche massive
- **Verificare** i dati dopo ogni sincronizzazione
- **Documentare** eventuali problemi o anomalie
- **Aggiornare** regolarmente tutti i PC con l'ultima versione del database

## 🆘 Troubleshooting

### Database Non Si Sincronizza

1. Verificare che il file esportato sia integro
2. Controllare che il browser supporti IndexedDB
3. Provare a svuotare la cache del browser

### Dati Mancanti Dopo Import

1. Verificare che l'importazione sia completata al 100%
2. Confrontare il numero di record con il Master PC
3. Rieseguire l'importazione se necessario

### PDF Non Si Genera

1. Verificare che il browser supporti la generazione PDF
2. Controllare che ci siano dati da esportare
3. Provare con un numero ridotto di record

## 📞 Supporto

Per problemi tecnici o chiarimenti:

1. Consultare prima questo manuale
2. Verificare la sezione troubleshooting
3. Contattare l'amministratore di sistema

---

**📅 Ultimo Aggiornamento**: Novembre 2025
**📋 Versione**: 1.0
**👥 Ambiente**: Multi-PC senza sincronizzazione automatica</content>
</xai:function_call">Aggiunto il manuale operativo completo per l'uso multi-PC sicuro.
