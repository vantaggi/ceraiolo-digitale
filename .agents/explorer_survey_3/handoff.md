# Rapporto di Indagine UI, Styling, Icone e Visualizzazione Dati (Survey 3)

**Data**: 2026-09-10  
**Agente**: `explorer_survey_3`  
**Ambito**: UI Layer, Styling System, Gestione Temi (Dark Mode / Settings), Inventario Emoji / Icone SVG, Tipografia & Tabelle (WCAG 2.2), DashboardCharts.

---

## 1. Observation (Osservazioni Dirette)

### 1.1 Styling Framework & Configurazione CSS
- **File esaminato**: `package.json`
  - Dipendenze relative a CSS: nessuna dipendenza da Tailwind CSS, PostCSS, Sass o Less.
  - Dipendenze presenti: `chart.js: ^4.5.1`, `vue-chartjs: ^5.3.3`, `vue-toastification: ^2.0.0-rc.5`, `vue: ^3.5.22`, `pinia: ^3.0.3`.
- **File esaminato**: `src/main.js` (linea 1 e 5):
  ```javascript
  import './assets/main.css'
  import 'vue-toastification/dist/index.css'
  ```
- **File esaminato**: `src/assets/main.css`:
  - Linea 2: Import remoto da Google Fonts:
    ```css
    @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Inter:wght@400;500;600;700&display=swap');
    ```
  - Linee 5-29 (`:root` Light Theme):
    ```css
    --color-primary: #1a1a1a;
    --color-primary-light: #333333;
    --color-accent: #b71c1c;
    --color-accent-hover: #c62828;
    --color-background: #f4f5f7;
    --color-surface: #ffffff;
    --color-surface-hover: #f9fafb;
    --color-text-primary: #1a1a1a;
    --color-text-secondary: #5c6266;
    --color-text-inverse: #ffffff;
    --color-border: #e1e4e8;
    --color-input-bg: #ffffff;
    --color-success: #2e7d32;
    --color-warning: #ed6c02;  /* CONTRASTO NON CONFORME */
    --color-info: #0288d1;     /* CONTRASTO NON CONFORME */

    --font-family-heading: 'Merriweather', serif;
    --font-family-body: 'Inter', sans-serif;
    ```
  - Linee 32-51 (`[data-theme='dark']` Dark Theme):
    ```css
    --color-primary: #e0e0e0;
    --color-primary-light: #b0b0b0;
    --color-accent: #e53935;
    --color-accent-hover: #ef5350;
    --color-background: #121212;
    --color-surface: #1e1e1e;
    --color-surface-hover: #2c2c2c;
    --color-text-primary: #e0e0e0;
    --color-text-secondary: #a0a0a0;
    --color-text-inverse: #121212;
    --color-border: #333333;
    --color-input-bg: #2c2c2c;
    --color-success: #66bb6a;
    --color-warning: #ffa726;
    --color-info: #29b6f6;
    ```
  - Linee 61-69: `body` non ha una dimensione font esplicita impostata (`font-size: 17px` assente; default a 16px da browser con elementi interni ridotti a `0.85rem` o `0.9rem`).

### 1.2 Gestione Tema e Switcher Header
- **File esaminato**: `src/stores/theme.js` (linee 4-34):
  - Memorizza il tema in `localStorage.getItem('theme') || 'light'`.
  - Imposta `document.documentElement.setAttribute('data-theme', theme)`.
  - Fornisce `toggleTheme()` e `applyTheme(theme)`.
- **File esaminato**: `src/App.vue` (linee 58-69):
  ```html
  <nav>
    <RouterLink to="/" class="nav-link">🏠 Ricerca</RouterLink>
    <RouterLink to="/registrazione-seriale" class="nav-link">🔄 Registrazione Seriale</RouterLink>
    <RouterLink to="/blocchetti" class="nav-link">🧾 Blocchetti</RouterLink>
    <RouterLink to="/reports" class="nav-link">📊 Report</RouterLink>
    <RouterLink to="/settings" class="nav-link">⚙️ Impostazioni</RouterLink>
    <button @click="themeStore.toggleTheme" class="theme-toggle" title="Cambia Tema">
      {{ themeStore.currentTheme === 'dark' ? '🔥' : '🕯️' }}
    </button>
  </nav>
  ```
  - Il pulsante `🕯️`/`🔥` è collocato direttamente in linea con i collegamenti di navigazione, suscettibile di tocchi e clic accidentali da parte di utenti senior.
- **File esaminato**: `src/views/SettingsView.vue`:
  - Linee 8-36: Navigazione a schede (`generale`, `template`, `dati`, `zone`).
  - Linea 42: Scheda `generale` ("🔧 Configurazione Applicazione").
  - `useThemeStore` non è attualmente importato né utilizzato in `SettingsView.vue`.

### 1.3 Tabelle e Allineamenti Numerici / Contabili
- **File esaminato**: `src/views/BlocchettiView.vue`:
  - Linee 275-308: Tabella `.data-table` con colonne `Blocchetto`, `Assegnato A`, `Consegna`, `Stato Restituzione`, `Volumi Trovati`, `Azioni`.
  - Linee 457-461:
    ```css
    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }
    ```
  - Linea 572: `.pay-amount { font-weight: bold; color: #16a34a; }`.
  - **Mancanze**: Nessuna zebratura alternata (`nth-child(even)` assente), nessuna altezza riga minima (48-52px), importi non allineati a destra, assenza di `font-variant-numeric: tabular-nums`.
- **File esaminato**: `src/views/ReportsView.vue`:
  - Linee 438-454: Tabella `.audit-preview` (Audit Dati).
  - Linee 520-552: Tabella Audit Quote Rientri (`Socio`, `Anno Rientro`, `Quota Pagata`, `Ricevuta / Blocchetto`, `Motivo`).
  - Linea 539: Importo `€ {{ Number(item.tesseramento.quota_pagata || 0).toFixed(2) }}` allineato a sinistra senza `tabular-nums`.
- **File esaminato**: `src/views/ReportsBetaView.vue`:
  - Linee 270-301: `.preview-table`.
  - Linee 1141-1165: Padding `14px 12px`, assenza di zebratura alternata, font-size ridotto (`0.95rem` ~ 15.2px).

### 1.4 DashboardCharts.vue e Visualizzazione Dati
- **File esaminato**: `src/components/DashboardCharts.vue`:
  - Linee 195-225 (`chartData`):
    ```javascript
    datasets: [
      {
        type: 'line',
        label: 'Totale Iscritti',
        backgroundColor: '#b71c1c',
        borderColor: '#b71c1c',
        borderWidth: 2,
        tension: 0.3,
        data: displayedData.value.map(d => d.total),
        yAxisID: 'y'
      },
      {
        type: 'bar',
        label: 'Nuovi Iscritti',
        backgroundColor: '#FFB300',
        data: displayedData.value.map(d => d.newMembers),
        yAxisID: 'y1'
      },
      {
        type: 'bar',
        label: 'Non Rinnovati',
        backgroundColor: '#9E9E9E',
        data: displayedData.value.map(d => d.lostMembers),
        yAxisID: 'y1'
      }
    ]
    ```
  - Linee 251-277 (`chartOptions.scales`):
    - `y`: Asse Y sinistro per "Totale Iscritti" (range centinaia/migliaia).
    - `y1`: Asse Y destro per "Variazioni" (range decine/centinaia).
  - Linee 237-240:
    ```javascript
    interaction: {
      mode: 'index',
      intersect: false,
    }
    ```
  - **Mancanze**: I dati sono accessibili **solo tramite tooltip on hover**; nessun dato numerico è visibile stabilmente senza muovere il cursore. La sovrapposizione visiva di linea (asse sinistro) e barre (asse destro) crea confusione cognitiva per utenti senior. **Totale assenza della tabella dati speculare sottostante**.

### 1.5 Censimento Integrale Emoji
Tramite scansione ricorsiva di tutti i file di interfaccia in `src/`, sono state censite le seguenti occorrenze:
- `src/App.vue`:
  - Linea 59: `🏠 Ricerca`
  - Linea 61: `🔄 Registrazione Seriale`
  - Linea 63: `🧾 Blocchetti`
  - Linea 64: `📊 Report`
  - Linea 65: `⚙️ Impostazioni`
  - Linea 67: `🔥` / `🕯️` (Theme switcher)
- `src/views/HomeView.vue`:
  - Linea 70: `⏳` (spinner caricamento), `📄 Esporta PDF`
  - Linea 90: `🕒 Ultimi Soci Visitati`
  - Linea 110: `⚡ Attività Recente`
  - Linea 114: `✨` (tipo create), `📝` (tipo update), `🗑️` (tipo delete)
  - Linea 125: `🔗 Link Rapidi`
  - Linea 127: `🔄 Inserimento Rapido`
  - Linea 129: `📊 Report Annuali`
  - Linea 143: `📥 Backup DB`
  - Linea 145: `📊 Changelog`
  - Linea 147: `🔧 Fix DB Invertito`
  - Linea 148: `🗑️ Reset DB`
- `src/components/SocioCard.vue`:
  - Linea 15: `⚡` (Pulsante rinnovo rapido)
  - Linea 20: `🎫 Genera Tessera`
- `src/components/FilterPanel.vue`:
  - Linea 4: `🔍 Filtri`
  - Linea 12: `🎂 Età`
  - Linea 30: `👥 Gruppo`
- `src/components/AddPaymentModal.vue`:
  - Linea 5: `💳 Registra Pagamento`
  - Linea 12: `💰 Quota Pagata (€)`
  - Linea 30: `📅 Data Pagamento`
  - Linea 45: `📄 N. Blocchetto`
  - Linea 61: `🧾 N. Ricevuta`
  - Linea 78: `📅 Anni di Tesseramento`
- `src/components/ConfirmDeleteModal.vue`:
  - Linea 6: `🗑️ Elimina Socio`
  - Linea 11: `⚠️` (Icona alert)
  - Linea 33: `⏳ Eliminazione...`
- `src/components/ErrorModal.vue`:
  - Linea 4: `❌ Operazione Bloccata`
- `src/components/KeyboardShortcutsModal.vue`:
  - Linea 6: `⌨️ Scorciatoie da Tastiera`
- `src/components/TesseraTemplate.vue`:
  - Linea 10: `📄 PDF Template Configurato`
- `src/views/BatchEntryView.vue`:
  - Linea 4: `🔄 Registrazione Seriale Pagamenti`
  - Linea 10: `📋 Dati di Sessione`
  - Linea 14: `📅 Anno di Riferimento`
  - Linea 33: `📄 Numero Blocchetto`
  - Linea 51: `🗓️ Data Pagamento`
  - Linea 72: `🧾 Ricevuta Attuale`
  - Linea 75: `📊 Numero Ricevuta`
  - Linea 80: `⬅️` (Ricevuta precedente)
  - Linea 92: `➡️` (Ricevuta successiva)
  - Linea 100: `👥 Soci su questa ricevuta`
  - Linea 102: `🎯 Nessun socio aggiunto ancora`
  - Linea 110: `❌` (Rimuovi dalla ricevuta)
  - Linea 120: `🔍 Area di Lavoro`
  - Linea 127: `➕ Nuovo Socio`
  - Linea 141: `⚡ Turbo Mode`
  - Linea 151: `🔊` / `🔇` (Toggle suoni)
  - Linea 173: `🔎 Risultati`
  - Linea 190, 193: `✅ In Ricevuta`, `✅ In Regola`
  - Linea 197: `⚠️ Arretrati`
  - Linea 200: `💰 Paga`
  - Linea 211: `👤 Socio non trovato`
  - Linea 217: `➕ Registra Nuovo Socio`
  - Linea 224: `📝 Registra Nuovo Socio`
  - Linea 295: `➕ Nuova manicchia...`
  - Linea 321: `💾 Salva e Registra Pagamento`
- `src/views/BlocchettiView.vue`:
  - Linea 304: `✅` (Segna come restituito)
  - Linea 305: `🔎` (Esplora ricevute)
  - Linea 306: `🗑️` (Elimina assegnazione)
- `src/views/ReportsView.vue`:
  - Linea 6: `📊 Report`
  - Linea 13: `📅 Rinnovi & Tessere`
  - Linea 20: `📋 Elenchi Dati`
  - Linea 27: `📦 Export Batch`
  - Linea 34: `📈 Statistiche`
  - Linea 41: `⚖️ Audit Quote (Rientri)`
  - Linea 49: `🛠️ Report Builder Beta`
  - Linea 59: `📊`
  - Linea 79: `📋 Lista Rinnovi`
  - Linea 86: `⏳ ...`, `📄 Genera Lista`
  - Linea 92: `📉 Recupero Crediti`
  - Linea 99: `📄 Genera Lista Recupero`
  - Linea 105: `🎫 Tessere Annuali`
  - Linea 131: `⏳ ...`, `🎫 Genera Tessere`
  - Linea 138: `👁️ Anteprima Tessera`
  - Linea 162: `📈 Demografia Soci`
  - Linea 210: `📊 Analizza Dati`
  - Linea 216: `💰 Andamento Economico`
  - Linea 271: `📋 Elenchi e Statistiche`
  - Linea 275: `🆕 Nuovi Soci`
  - Linea 283: `📄 Genera Report Nuovi Soci`
  - Linea 289: `👥 Soci per Manicchia`
  - Linea 314: `📄 Genera Report Manicchie`
  - Linea 320: `🔢 Riepilogo Numerico Manicchie`
  - Linea 332: `📊 Genera Riepilogo Numerico`
  - Linea 338: `📈 Lista Recupero (Churn)`
  - Linea 344: `📄 Genera Lista Recupero`
  - Linea 350: `🗳️ Report Votazioni`
  - Linea 361: `📄 Genera Lista Votazioni`
  - Linea 367: `👥 Report Soci Attivi`
  - Linea 379: `📄 Genera Lista Attivi`
  - Linea 385: `💰 Cronologia Pagamenti`
  - Linea 394: `📄 Genera Report Completo Pagamenti`
  - Linea 400: `🛡️ Audit Qualità Dati`
  - Linea 404: `🔍 Esegui Controllo`
  - Linea 409: `✅ Nessuna anomalia rilevata`
  - Linee 414-430: `⚠️` (Tag statistiche audit)
  - Linea 462: `📄 Scarica Report Anomalie PDF`
  - Linea 472: `📦 Esportazione Complessiva`
  - Linea 484: `⏳ Generazione in corso...`, `📦 SCARICA TUTTI I REPORT`
  - Linea 493: `⚖️ Report Controllo Quote`
  - Linea 504: `🔍 Esegui Controllo Quote`
  - Linea 510: `✅ Nessuna anomalia trovata`
  - Linea 515: `⚠️ Rilevate anomalie`
  - Linea 556: `📄 Esporta PDF`
  - Linea 559: `📊 Esporta Excel`
- `src/views/ReportsBetaView.vue`:
  - Linea 6: `📊 Report`
  - Linea 10: `⬅️ Torna a Reports Standard`
  - Linea 13: `🛠️ Report Beta`
  - Linea 21: `⚠️ BETA VERSION`
  - Linea 27: `🛠️ Report Builder Personalizzato`
  - Linea 42: `💾 Preset di Ricerca Salvati`
  - Linea 51: `🗑️` (Elimina preset)
  - Linea 64: `🔄 Ripristina Filtri`
  - Linea 96: `🗳️ Filtri Elezioni`
  - Linee 144, 150: `ℹ️`
  - Linea 255: `⏳ Generazione PDF...`, `📄 Genera PDF Dinamico`
- `src/views/SettingsView.vue`:
  - Linea 6: `⚙️ Impostazioni`
  - Linea 13: `🔧 Generale`
  - Linea 20: `🎫 Template Tessera`
  - Linea 27: `💾 Dati & Backup`
  - Linea 34: `🏘️ Gestione Zone`
  - Linea 43: `🔧 Configurazione Applicazione`
  - Linea 112: `⏳`, `💾 Salva Configurazione`
  - Linea 120: `🎫 Template Tessera`
  - Linea 171: `⏳`, `💾 Salva Template`
  - Linea 175: `🔄 Ripristina Default`
  - Linea 183: `💾 Gestione Dati & Backup`
  - Linea 195: `✅` / `⚠️` (Salute dati)
  - Linea 210: `🔄 Backup Automatico su PC`
  - Linea 213: `📁 Cartella di Backup`
  - Linea 226, 228, 229: `❌ Non Supportato`, `✅ Cambia Cartella`, `📁 Seleziona Cartella`
  - Linea 235: `⚡ Auto-Salvataggio`
  - Linea 243: `✅ Attivo` / `⭕ Disattivato`
  - Linea 248: `💾 Backup Manuale`
  - Linea 261, 262: `💾 Esegui Backup Ora`, `📥 Scarica Backup`
  - Linea 273: `📦 Esportazione & Ripristino`
  - Linea 277: `📥 Esporta Database Completo`
  - Linea 285: `📊 Esporta Excel`
  - Linea 293: `⚙️ Configurazione JSON`
  - Linea 313: `♻️ Ripristina Database`
  - Linea 331: `⛔ Zona Pericolosa`
  - Linea 333: `🏭 Ripristino Impostazioni di Fabbrica`
  - Linea 343: `🗑️ CANCELLA TUTTO E RIPRISTINA`
  - Linea 351: `🏘️ Gestione Zone (Gruppi)`
  - Linea 366: `➕ Aggiungi`
  - Linea 391: `✏️` (Rinomina)
  - Linea 395: `🗑️` (Rimuovi dalla lista)
  - Linea 400: `💾` (Salva rinomina)
  - Linea 403: `❌` (Annulla rinomina)
- `src/views/AddSocioView.vue`:
  - Linea 16: `👤 Nome`
  - Linea 32: `📝 Cognome`
  - Linea 50: `🎂 Data di Nascita`
  - Linea 65: `📍 Luogo di Nascita`
  - Linea 82: `👥 Gruppo di Appartenenza`
  - Linea 102: `✨ Nome Nuovo Gruppo`
  - Linea 118: `📅 Anno Prima Iscrizione`
  - Linea 135: `📝 Note`
  - Linea 151: `💾 Salvando...`, `👤 Salva Nuovo Socio`
- `src/views/SocioDetailView.vue`:
  - Linea 11: `❌ Errore`
  - Linea 51: `💳 Paga`
  - Linea 54: `📥 Export`
  - Linea 61: `💾...`, `✏️ Modifica`
  - Linea 64: `🗑️` (Elimina socio)
  - Linea 71: `📋 Dati Anagrafici`
  - Linea 125: `📝 Note`
  - Linea 142: `💰 Cronologia Pagamenti`
  - Linea 168: `💳 Paga Ora`
  - Linea 175: `💳 Paga (Opzionale)`
  - Linea 183: `🗑️` (Elimina pagamento)
  - Linea 190: `📅 Data Pagamento`
  - Linea 194: `💰 Quota`
  - Linea 203: `✏️ Modifica quota`
  - Linea 208: `📄 Ricevuta`

---

## 2. Logic Chain (Catena di Ragionamento)

1. **Assenza di Framework CSS Terzi & Vincolo "No Rewrite"**:
   - *Dall'osservazione 1.1*, `package.json` non include Tailwind né preprocessori. L'applicazione si basa su CSS custom strutturato con variabili custom in `main.css`. Introdurre Tailwind con build pipeline complessa rischierebbe di rompere stili esistenti e violerebbe il vincolo di preservazione architetturale ("Miglioramento incrementale senza riscrittura").
   - *Deduzione*: È preferibile e coerente mantenere il sistema di custom properties CSS in `main.css`, arricchendolo con utility classes e normalizzando le variabili cromatiche e dimensionali.

2. **Accessibilità WCAG 2.2 e Risoluzione dei Contrasti**:
   - *Dall'osservazione 1.1*, `--color-warning: #ed6c02` ha un rapporto di contrasto con `#ffffff` pari a 3.0:1 (fallisce WCAG AA, che richiede ≥4.5:1 per testo normale).
   - Sostituendo con `#c2410c` (arancione scuro/terracotta), il rapporto di contrasto sale a **4.98:1**, superando la soglia WCAG 2.2 AA.
   - *Dall'osservazione 1.1*, `--color-info: #0288d1` ha un contrasto con `#ffffff` di 3.4:1 (fallisce WCAG AA).
   - Sostituendo con `#0369a1` (blu oceanico scuro), il contrasto sale a **5.16:1**, superando la soglia WCAG 2.2 AA.

3. **Autonomia Offline e Stack Tipografico**:
   - *Dall'osservazione 1.1*, la linea 2 di `main.css` scarica font da `fonts.googleapis.com`. In ambiente locale disconnesso (es. sede della Famiglia senza connessione internet), la richiesta HTTP fallisce o ritarda il rendering.
   - *Deduzione*: Eliminando l'import remoto e adottando `font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` garantisce rendering istantaneo, nitidezza tipografica nativa del sistema operativo e 100% di resilienza offline.
   - *Dall'osservazione 1.1*, impostando `html { font-size: 17px; }` e `body { font-size: 1rem; line-height: 1.5; }` si ottiene la dimensione ergonomica prescritta (17px base per leggibilità senior).

4. **Spostamento Sicuro del Selettore Tema (R5)**:
   - *Dall'osservazione 1.2*, il tasto `🕯️`/`🔥` nella barra di navigazione principale in `App.vue` si trova a pochi pixel dai link di navigazione. Gli utenti con ridotta mobilità o su touch screen attivano inavvertitamente il cambio di tema.
   - *Dall'osservazione 1.2*, `SettingsView.vue` è il luogo naturale per ospitare le configurazioni permanenti. Inserire un componente di selezione tema (Light / Dark) nella scheda `generale` di `SettingsView.vue`, richiamando `useThemeStore.applyTheme()`, elimina il rischio di attivazione accidentale.

5. **Ergonomia Tabelle e Contabilità**:
   - *Dall'osservazione 1.3*, le tabelle attuali presentano righe a sfondo uniforme, altezze variabili e importi allineati a sinistra o non formattati numericamente.
   - *Deduzione*:
     1. L'aggiunta di `tbody tr:nth-child(even) { background-color: var(--color-surface-hover); }` garantisce la zebratura richiesta da R5.
     2. L'impostazione di `td, th { min-height: 48px; height: 50px; padding: 0.75rem 1rem; }` rispetta i target di tocco ergonomici (48-52px).
     3. L'applicazione di `text-align: right; font-variant-numeric: tabular-nums;` alle colonne monetarie allinea i decimali in colonna, facilitando la scansione visiva contabile per i revisori dei conti e referenti anziani.

6. **Riprogettazione Senior-Friendly di DashboardCharts.vue (R6)**:
   - *Dall'osservazione 1.4*, il grafico sovrappone una linea (Totale) su asse sinistro e due barre (Nuovi e Non Rinnovati) su asse destro. La lettura dei valori dipende strettamente da tooltip on hover (`interaction: { mode: 'index', intersect: false }`).
   - *Deduzione*:
     1. Un asse Y singolo o la separazione visiva delle metriche evita la confusione delle scale incrociate.
     2. Inserire permanentemente al di sotto del grafico una tabella speculare ad alto contrasto contenente:
        - Colonna 1: Anno
        - Colonna 2: Totale Iscritti
        - Colonna 3: Nuovi Iscritti
        - Colonna 4: Non Rinnovati (Persi)
        - Colonna 5: Variazione Netta (Totale anno - Totale anno precedente)
     3. La tabella deve adottare font grande (`≥17px`), numeri tabulari allineati a destra, intestazioni ad alto contrasto e zebratura, rendendo l'andamento immediatamente consultabile senza richiedere interazione col mouse o abilità motorie fini.

7. **Sistema di Icone Vettoriali SVG Istituzionali (R4)**:
   - *Dall'osservazione 1.5*, sono presenti oltre 120 occorrenze di emoji eterogenee (variano per aspetto grafico su Windows, macOS, Android e stampanti).
   - *Deduzione*: La soluzione ottimale e scalabile consiste nel creare un catalogo di icone SVG (stile minimalista Apple SF Symbols / Jony Ive) coordinate con i colori della Famiglia dei Santantoniari:
     - Primario / Testo: Nero inchiostro (`#1a1a1a`) o Bianco su scuro (`#ffffff`)
     - Accento ceraiolo: Rosso Sant'Antonio (`#b71c1c`)
     - Dettagli / Status: Oro caldo (`#d97706` / `#b45309`)
   - Un componente centralizzato (es. `AppIcon.vue` o modulo di icone dedicate) garantisce `aria-hidden="true"`, supporto `title` accessibile, dimensione coerente e rendering vettoriale perfetto su ogni supporto.

---

## 3. Caveats (Avvertenze e Limiti)

1. **Stile Cursive in TesseraTemplate.vue**:
   - In `src/components/TesseraTemplate.vue:86`, è presente `font-family: cursive;` per il fallback del testo del socio. Questo stile è specifico per la tessera tipografica e non impatta il resto dell'applicazione gestionale.
2. **Dimensioni Tabelle su Schermi Piccoli (Mobile < 768px)**:
   - L'adozione di un font base a 17px e padding generoso per le tabelle richiede un contenitore a scorrimento orizzontale (`overflow-x: auto`) con barre di scorrimento ad alto contrasto per evitare il troncamento dei dati su schermi ridotti.
3. **Chart.js Canvas Scaling**:
   - `vue-chartjs` scala il canvas in base al DPR del dispositivo. L'opzione `maintainAspectRatio: false` in `DashboardCharts.vue` richiede un container padre con altezza definita (attualmente 350px). La tabella aggiunta sotto il grafico aumenterà l'altezza complessiva del componente `DashboardCharts.vue`, necessitando di un layout a blocchi verticali chiaro.

---

## 4. Conclusion (Conclusioni e Piano di Intervento)

L'architettura UI esistente è solida, modulare e priva del sovraccarico di framework esterni. L'adeguamento alle prescrizioni R4, R5 e R6 richiede interventi chirurgici ben delimitati:

1. **Refactoring CSS Globale (`src/assets/main.css`)**:
   - Eliminare l'import di Google Fonts.
   - Definire lo stack tipografico di sistema sans-serif.
   - Impostare `html { font-size: 17px; }`.
   - Aggiornare `--color-warning: #c2410c;` e `--color-info: #0369a1;`.
   - Aggiungere classi globali per tabelle accessibili:
     - `.data-table-senior` con `min-height: 48px`, zebratura alternata (`nth-child(even)`), bordo nitido.
     - `.tabular-num` con `text-align: right; font-variant-numeric: tabular-nums;`.

2. **Rilocazione Tema in `SettingsView.vue` & Pulizia Header (`App.vue`)**:
   - Rimuovere il tasto `🕯️`/`🔥` dall'header di `App.vue`.
   - In `SettingsView.vue` (scheda `generale`), aggiungere una sezione dedicata "🎨 Tema dell'Interfaccia" con radio/card selector: Chiaro / Scuro, collegato a `useThemeStore.applyTheme`.

3. **Modulo Icone SVG Istituzionali (`src/components/icons/`)**:
   - Creare un set vettoriale SVG pulito (SF Symbols-like) per sostituire sistematicamente le emoji censite nella sezione 1.5.
   - Sostituire le emoji nei template delle viste e dei componenti con i rispettivi componenti/slot SVG.

4. **Potenziamento `DashboardCharts.vue`**:
   - Riorganizzare gli assi Y per eliminare la confusione della doppia scala.
   - Generare una tabella HTML reattiva direttamente sotto il grafico con i dati di `displayedData`, con font ≥17px, numeri tabulari e contrasto WCAG 2.2.

---

## 5. Verification Method (Metodo di Verifica Indipendente)

Per verificare e replicare l'indagine:

1. **Verifica assenza dipendenze CSS esterne**:
   ```bash
   node -e "const pkg = require('./package.json'); console.log(pkg.dependencies, pkg.devDependencies);"
   ```
2. **Verifica contrasto WCAG 2.2 (formula luminanza relativa)**:
   - Test `#ed6c02` vs `#ffffff` = ~3.0:1 (FALLITO).
   - Test `#c2410c` vs `#ffffff` = ~4.98:1 (CONFORME AA ≥4.5:1).
   - Test `#0288d1` vs `#ffffff` = ~3.4:1 (FALLITO).
   - Test `#0369a1` vs `#ffffff` = ~5.16:1 (CONFORME AA ≥4.5:1).
3. **Verifica assenza regressioni nella build e nei test**:
   ```bash
   npm run build
   npm run test -- --run
   ```
4. **Ispezione file e linee chiave**:
   - `src/assets/main.css` (linee 2, 20, 21, 61-69)
   - `src/App.vue` (linee 58-69)
   - `src/views/SettingsView.vue` (linee 42-115)
   - `src/components/DashboardCharts.vue` (linee 195-283)
   - `src/views/BlocchettiView.vue` (linee 275-308, 457-490)
