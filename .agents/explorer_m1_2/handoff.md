# Rapporto di Progettazione Architetturale: BaseIcon.vue & Iconografia SVG Istituzionale

**Autore**: `explorer_m1_2`  
**Milestone**: M1 - Design System, Icons & Themes  
**Target File di Implementazione**: `src/components/common/BaseIcon.vue`  
**Target Test Unitario**: `src/components/__tests__/BaseIcon.test.js`  
**Target Git Branch**: `development`  
**Data**: 2026-09-10  

---

## 1. Observation (Osservazioni Dirette)

### 1.1 Direttive e Vincoli da Dispatch e Requisiti di Progetto
- **Da `ORIGINAL_REQUEST.md` (linee 35-37 - Requisito R4)**:
  > "R4. Sistema di Icone Vettoriali SVG & Stile Istituzionale Santantoniari: Sostituire tutte le emoji sparse nell'interfaccia (header, pulsanti, tabelle, badge) con icone vettoriali SVG pulite, scalabili, conformi allo stile minimalista di Jony Ive / Apple SF Symbols, con palette cromatica coordinata con la Famiglia dei Santantoniari (nero inchiostro, bianco, oro caldo e accenti ceraioli)."
- **Da `DISPATCH.md` (linee 11-22)**:
  > "1. Design Apple SF Symbols / Jony Ive style minimalist stroke-based vector icons (viewBox 0 0 24 24, stroke-width 1.75 - 2, stroke-linecap round, stroke-linejoin round, fill none / currentColor).  
  > 2. Institutional Santantoniari palette support:  
  >    - Primary: Ink black (`#1a1a1a`) / Dark theme light grey (`#e0e0e0`)  
  >    - Accent: Ceraiolo red (`#b71c1c` / `#e53935`)  
  >    - Gold: Warm gold (`#c59b27`)  
  >    - White: (`#ffffff`)  
  > 3. Complete icon dictionary needed to replace all 45+ emojis:  
  >    - Navigation: `home` (ricerca), `refresh-cw` (registrazione seriale), `receipt` (blocchetti), `bar-chart` (report), `settings` (impostazioni).  
  >    - Actions: `search`, `plus`, `check`, `alert-triangle`, `trash-2`, `download`, `upload`, `edit`, `x`, `chevron-left`, `chevron-right`, `chevron-up`, `chevron-down`, `printer`, `file-text`, `credit-card`, `users`, `user-plus`, `sun`, `moon`, `database`, `save`.  
  > 4. Provide the exact implementation code for `BaseIcon.vue` and test specs in `handoff.md`. Do NOT modify source code files."
- **Da `PROJECT.md` (linee 66-73 - Contratto d'Interfaccia BaseIcon)**:
  > "- Component: `src/components/common/BaseIcon.vue`  
  > - Props:  
  >   - `name: String` (required, e.g. `'home'`, `'refresh'`, `'receipt'`, `'chart'`, `'settings'`, `'search'`, `'plus'`, `'check'`, `'warning'`, `'delete'`, `'arrow-left'`, `'arrow-right'`, `'user'`, `'cash'`)  
  >   - `size: { type: [Number, String], default: 20 }`  
  >   - `color: { type: String, default: 'currentColor' }`  
  > - Behavior: Emits inline `<svg viewBox="0 0 24 24" ...>` styled with Santantoniari palette and stroke-based iconography."

### 1.2 Censimento Dettagliato delle Emoji da Sostituire
Dal censimento effettuato in `explorer_survey_3/handoff.md` (Sezione 1.5):
1. **`src/App.vue`**:
   - Linea 59: `🏠 Ricerca` -> `name="home"`
   - Linea 61: `🔄 Registrazione Seriale` -> `name="refresh-cw"`
   - Linea 63: `🧾 Blocchetti` -> `name="receipt"`
   - Linea 64: `📊 Report` -> `name="bar-chart"`
   - Linea 65: `⚙️ Impostazioni` -> `name="settings"`
   - Linea 67: `🔥` / `🕯️` -> `name="flame"`, `name="sun"`, `name="moon"`
2. **`src/views/HomeView.vue`**:
   - Linea 70: `⏳` (caricamento), `📄 Esporta PDF` -> `name="loader"`, `name="file-text"`
   - Linea 90: `🕒 Ultimi Soci Visitati` -> `name="clock"`
   - Linea 110, 114: `⚡ Attività Recente`, `✨` (create), `📝` (update), `🗑️` (delete) -> `name="zap"`, `name="sparkles"`, `name="edit"`, `name="trash-2"`
   - Linee 125-148: `🔗 Link Rapidi`, `🔄 Inserimento Rapido`, `📊 Report Annuali`, `📥 Backup DB`, `📊 Changelog`, `🔧 Fix DB Invertito`, `🗑️ Reset DB` -> `name="link"`, `name="refresh-cw"`, `name="bar-chart"`, `name="download"`, `name="database"`, `name="sliders"`, `name="trash-2"`
3. **`src/components/SocioCard.vue`**:
   - Linea 15: `⚡` (rinnovo rapido) -> `name="zap"`
   - Linea 20: `🎫 Genera Tessera` -> `name="ticket"`
4. **`src/components/FilterPanel.vue`**:
   - Linee 4, 12, 30: `🔍 Filtri`, `🎂 Età`, `👥 Gruppo` -> `name="search"`, `name="calendar"`, `name="users"`
5. **`src/components/AddPaymentModal.vue`**:
   - Linee 5, 12, 30, 45, 61, 78: `💳 Registra Pagamento`, `💰 Quota Pagata (€)`, `📅 Data Pagamento`, `📄 N. Blocchetto`, `🧾 N. Ricevuta`, `📅 Anni di Tesseramento` -> `name="credit-card"`, `name="coins"`, `name="calendar"`, `name="file-text"`, `name="receipt"`
6. **`src/components/ConfirmDeleteModal.vue` & `src/components/ErrorModal.vue`**:
   - `🗑️ Elimina Socio`, `⚠️`, `⏳ Eliminazione...`, `❌ Operazione Bloccata` -> `name="trash-2"`, `name="alert-triangle"`, `name="loader"`, `name="alert-circle"`
7. **`src/components/KeyboardShortcutsModal.vue` & `src/components/TesseraTemplate.vue`**:
   - `⌨️ Scorciatoie da Tastiera`, `📄 PDF Template Configurato` -> `name="keyboard"`, `name="file-text"`
8. **`src/views/BatchEntryView.vue`**:
   - `🔄 Registrazione Seriale Pagamenti`, `📋 Dati di Sessione`, `📅 Anno`, `📄 Numero Blocchetto`, `🗓️ Data Pagamento`, `🧾 Ricevuta Attuale`, `📊 Numero Ricevuta`, `⬅️` / `➡️`, `👥 Soci`, `🎯 Nessun socio`, `❌ Rimuovi`, `🔍 Area di Lavoro`, `➕ Nuovo Socio`, `⚡ Turbo Mode`, `🔊`/`🔇` (Audio), `🔎 Risultati`, `✅ In Ricevuta`, `⚠️ Arretrati`, `💰 Paga`, `👤 Socio non trovato`, `💾 Salva e Registra Pagamento` -> `refresh-cw`, `clipboard`, `calendar`, `file-text`, `receipt`, `chevron-left`, `chevron-right`, `users`, `inbox`, `x`, `search`, `user-plus`, `zap`, `volume-2`/`volume-x`, `check`, `alert-triangle`, `coins`, `user-x`, `save`.
9. **`src/views/BlocchettiView.vue`**:
   - `✅ Segna restituito`, `🔎 Esplora ricevute`, `🗑️ Elimina assegnazione` -> `check`, `search`, `trash-2`.
10. **`src/views/ReportsView.vue` & `src/views/ReportsBetaView.vue`**:
    - `📊 Report`, `📅 Rinnovi`, `📋 Elenchi`, `📦 Export Batch`, `📈 Statistiche`, `⚖️ Audit Quote`, `🛠️ Builder`, `📉 Recupero Crediti (Churn)`, `🎫 Tessere Annuali`, `👁️ Anteprima`, `💰 Andamento Economico`, `🆕 Nuovi Soci`, `🔢 Riepilogo`, `🗳️ Votazioni`, `🛡️ Audit Dati`, `💾 Preset`, `🔄 Ripristina`, `ℹ️ Info` -> `bar-chart`, `calendar`, `clipboard`, `package`, `trending-up`, `scale`, `sliders`, `trending-down`, `ticket`, `eye`, `coins`, `user-plus`, `hash`, `check-square`, `shield-check`, `bookmark`, `refresh-cw`, `info`.
11. **`src/views/SettingsView.vue`**:
    - `⚙️ Impostazioni`, `🔧 Generale`, `🎫 Template`, `💾 Dati & Backup`, `🏘️ Zone`, `📁 Cartella`, `✅`/`❌` Stato, `⚡ Auto-Salvataggio`, `📥 Esporta`, `♻️ Ripristina`, `⛔ Zona Pericolosa`, `🏭 Ripristino Fabbrica`, `🗑️ Cancella Tutto`, `➕ Aggiungi`, `✏️ Rinomina` -> `settings`, `sliders`, `ticket`, `database`, `map-pin`, `folder`, `check-circle`/`x-circle`, `zap`, `download`, `refresh-cw`, `alert-octagon`, `factory`, `trash-2`, `plus`, `edit`.
12. **`src/views/AddSocioView.vue` & `src/views/SocioDetailView.vue`**:
    - `👤 Nome`, `📝 Cognome/Note`, `🎂 Data`, `📍 Luogo`, `👥 Gruppo`, `✨ Nuovo Gruppo`, `💾 Salva`, `💳 Paga`, `📥 Export`, `✏️ Modifica`, `🗑️ Elimina`, `📋 Dati Anagrafici`, `💰 Quota` -> `user`, `edit`, `calendar`, `map-pin`, `users`, `sparkles`, `save`, `credit-card`, `download`, `edit`, `trash-2`, `clipboard`, `coins`.

### 1.3 Baseline di Test Esistente
Esecuzione di `npx vitest run`:
```
 RUN  v3.2.4 C:/Users/cioti/Desktop/PROGETTI/ceraiolo-digitale
 ✓ src/components/__tests__/TesseraTemplate.test.js (6 tests) 32ms
 Test Files  1 passed (1)
      Tests  6 passed (6)
```
La suite di test di base è verde e pienamente operativa.

---

## 2. Logic Chain (Catena di Ragionamento)

1. **Linguaggio Visivo Apple SF Symbols / Jony Ive**:
   - *Dall'osservazione 1.1*, il requisito R4 prescrive un'iconografia vettoriale pulita, coerente con lo stile minimalista di Apple SF Symbols.
   - *Deduzione geometrica*:
     - Griglia uniforme con `viewBox="0 0 24 24"`.
     - Tratto puro (`stroke-width="1.8"`, personalizzabile via prop `strokeWidth`).
     - Terminali e giunzioni arrotondate (`stroke-linecap="round"`, `stroke-linejoin="round"`).
     - Riempimento neutro (`fill="none"` predefinito), che conferisce leggerezza visiva ed evita l'effetto "macchia di colore" tipico delle emoji piene.
     - Spessore ottico di 1.8px ideale per la leggibilità senior: sufficientemente marcato per utenti anziani, ma mai pesante o sgranato.

2. **Risolutore della Palette Istituzionale Santantoniari**:
   - *Dall'osservazione 1.1*, i colori istituzionali della Famiglia dei Santantoniari sono:
     - Nero inchiostro / Dark theme light grey: `--color-primary` (`#1a1a1a` / `#e0e0e0`)
     - Rosso Ceraiolo: `--color-accent` (`#b71c1c` / `#e53935`)
     - Oro caldo: `--color-gold` (`#c59b27`)
     - Bianco: `#ffffff`
     - Colori di stato WCAG 2.2: successo (`#2e7d32`), avviso (`#c2410c`), info (`#0369a1`).
   - *Deduzione architetturale*:
     - La prop `color` deve accettare sia parole chiave semantiche (`'primary'`, `'accent'`, `'ceraiolo'`, `'gold'`, `'white'`, `'success'`, `'warning'`, `'info'`, `'muted'`), sia valori CSS diretti (`'currentColor'`, stringhe hex `#...`, rgb, hsl).
     - Il mapping dinamico a variabili CSS (`var(--color-primary, #1a1a1a)`) garantisce che le icone reagiscano istantaneamente ai cambi di tema chiaro/scuro senza dover ri-renderizzare i componenti.
     - Il default `'currentColor'` consente alle icone inserite in pulsanti o testi (es. `.renew-button`, `.nav-link`) di ereditare automaticamente il colore del testo genitore senza configurazioni manuali.

3. **Motore di Alias e Tolleranza agli Errori (Zero-Friction DX)**:
   - *Dall'osservazione 1.2*, gli oltre 10 file di interfaccia utilizzano emoji con significati affini (es. `bar-chart` per report o statistiche; `trash-2` per elimina, cancella o reset; `coins` per quota, cassa o paga; `chevron-left` per freccia sinistra o indietro).
   - *Deduzione*:
     - Implementare una tabella `ALIASES` bidirezionale (inclusi sinonimi in lingua italiana come `'ricerca'`, `'cassa'`, `'elimina'`, `'tessera'`, `'indietro'`, `'avanti'`) evita refusi ed errori di battitura tra i diversi sviluppatori/agenti durante la sostituzione delle emoji.
     - La risoluzione converte il nome in minuscolo e rimuove spazi bianchi (`name.toLowerCase().trim()`).

4. **Accessibilità WCAG 2.2 e Comportamento Semantico**:
   - *Dall'osservazione 1.1*, la componente deve rispettare le linee guida WCAG 2.2:
     - **Icona puramente decorativa (default)**: Quando `title` non è specificato (o l'icona affianca un testo esplicativo come "Ricerca"), l'SVG adotta `aria-hidden="true"` e `role="presentation"`. Gli screen reader ignorano l'elemento visivo senza generare rumore verbale.
     - **Icona informativa / pulsante solo icona**: Quando `title` è passato (es. `title="Rinnovo Rapido"`), l'SVG adotta `role="img"`, `:aria-label="title"` e include il tag figlio `<title>{{ title }}</title>`.

5. **Resilienza e Prevenzione Crash (Graceful Degradation)**:
   - Qualora venga passato un nome icona sconosciuto o errato, il componente non solleva eccezioni:
     - Emette un warning in console durante lo sviluppo (`console.warn('[BaseIcon] Icon "..." not found')`).
     - Renderizza un'icona di fallback geometrica (cerchio tratteggiato con punto interrogativo minimale), mantenendo l'integrità del layout.

6. **Animazione di Caricamento (Spin)**:
   - La prop booleana `spin: Boolean` (default `false`) attiva la classe `.base-icon--spin` che esegue una rotazione lineare a 360° fluida in 1 secondo, perfetta per `name="loader"` o `name="refresh-cw"` durante operazioni asincrone di backup o generazione PDF.

---

## 3. Caveats (Avvertenze e Limiti)

1. **Modalità di sola lettura dell'Agente Explorer**:
   - Nessun file sorgente in `src/` è stato modificato o creato da questo agente. L'intero codice implementativo del componente e della suite di test è integralmente riportato nella Sezione 4 del presente documento, pronto per l'applicazione da parte dell'agente implementatore designato.
2. **Supporto SVG in JSDOM / Vitest**:
   - `BaseIcon.vue` utilizza la direttiva `v-html` su un elemento `<g>` SVG interno per iniettare i tracciati vettoriali dei simboli memorizzati nel dizionario. I test unitari con `@vue/test-utils` e `jsdom` (v27) gestiscono correttamente questo rendering.
3. **Dipendenza da Token CSS in `main.css`**:
   - Le parole chiave del colore (es. `'accent'`, `'gold'`) fanno riferimento a variabili CSS come `var(--color-accent)`. In assenza di tali variabili o in test unitari isolati, il componente adotta i valori di fallback esadecimali dichiarati (es. `#b71c1c`, `#c59b27`).

---

## 4. Conclusion (Specifiche Tecniche & Codice Sorgente)

### 4.1 Codice Sorgente Completo: `src/components/common/BaseIcon.vue`

```vue
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="viewBox"
    :width="computedSize"
    :height="computedSize"
    :stroke="computedColor"
    :stroke-width="computedStrokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
    :class="[
      'base-icon',
      `base-icon--${canonicalName}`,
      { 'base-icon--spin': spin }
    ]"
    :role="title ? 'img' : 'presentation'"
    :aria-hidden="title ? undefined : 'true'"
    :aria-label="title || undefined"
    v-bind="$attrs"
  >
    <title v-if="title">{{ title }}</title>
    <g v-html="svgContent"></g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: [Number, String],
    default: 20,
  },
  color: {
    type: String,
    default: 'currentColor',
  },
  strokeWidth: {
    type: [Number, String],
    default: 1.8,
  },
  title: {
    type: String,
    default: '',
  },
  spin: {
    type: Boolean,
    default: false,
  },
  viewBox: {
    type: String,
    default: '0 0 24 24',
  },
})

// Palette istituzionale della Famiglia dei Santantoniari
const PALETTE_MAP = {
  primary: 'var(--color-primary, #1a1a1a)',
  'primary-light': 'var(--color-primary-light, #333333)',
  accent: 'var(--color-accent, #b71c1c)',
  ceraiolo: 'var(--color-accent, #b71c1c)',
  red: 'var(--color-accent, #b71c1c)',
  'accent-hover': 'var(--color-accent-hover, #c62828)',
  gold: 'var(--color-gold, #c59b27)',
  oro: 'var(--color-gold, #c59b27)',
  white: '#ffffff',
  bianco: '#ffffff',
  success: 'var(--color-success, #2e7d32)',
  green: 'var(--color-success, #2e7d32)',
  warning: 'var(--color-warning, #c2410c)',
  arancione: 'var(--color-warning, #c2410c)',
  info: 'var(--color-info, #0369a1)',
  blue: 'var(--color-info, #0369a1)',
  secondary: 'var(--color-text-secondary, #5c6266)',
  muted: 'var(--color-text-secondary, #5c6266)',
  current: 'currentColor',
  currentcolor: 'currentColor',
}

// Mappatura sinonimi ed alias per massima tolleranza e robustezza
const ALIASES = {
  // Navigation & Shell
  ricerca: 'home',
  registrazione: 'refresh-cw',
  seriale: 'refresh-cw',
  refresh: 'refresh-cw',
  sync: 'refresh-cw',
  reset: 'refresh-cw',
  blocchetti: 'receipt',
  ricevuta: 'receipt',
  report: 'bar-chart',
  chart: 'bar-chart',
  'bar-chart-2': 'bar-chart',
  grafico: 'bar-chart',
  impostazioni: 'settings',
  cog: 'settings',
  gear: 'settings',

  // Actions
  cerca: 'search',
  add: 'plus',
  nuovo: 'plus',
  ok: 'check',
  spunta: 'check',
  success: 'check-circle',
  verified: 'check-circle',
  warning: 'alert-triangle',
  arretrati: 'alert-triangle',
  alert: 'alert-triangle',
  error: 'alert-circle',
  blocco: 'alert-circle',
  danger: 'alert-octagon',
  pericolo: 'alert-octagon',
  delete: 'trash-2',
  trash: 'trash-2',
  rimuovi: 'trash-2',
  elimina: 'trash-2',
  export: 'download',
  scarica: 'download',
  import: 'upload',
  carica: 'upload',
  modifica: 'edit',
  pen: 'edit',
  pencil: 'edit',
  'file-edit': 'edit',
  close: 'x',
  annulla: 'x',
  cancel: 'x',
  chiudi: 'x',
  salva: 'save',
  floppy: 'save',
  print: 'printer',
  stampa: 'printer',
  db: 'database',
  sqlite: 'database',
  backup: 'database',

  // Chevrons & Arrows
  left: 'chevron-left',
  'arrow-left': 'chevron-left',
  back: 'chevron-left',
  indietro: 'chevron-left',
  right: 'chevron-right',
  'arrow-right': 'chevron-right',
  forward: 'chevron-right',
  avanti: 'chevron-right',
  up: 'chevron-up',
  'arrow-up': 'chevron-up',
  down: 'chevron-down',
  'arrow-down': 'chevron-down',

  // Users & Groups
  socio: 'user',
  anagrafica: 'user',
  gruppo: 'users',
  manicchia: 'users',
  manicchie: 'users',
  people: 'users',
  'nuovo-socio': 'user-plus',
  'add-user': 'user-plus',

  // Money & Docs
  card: 'credit-card',
  tessera: 'ticket',
  paga: 'credit-card',
  pagamento: 'credit-card',
  cash: 'coins',
  quota: 'coins',
  cassa: 'coins',
  money: 'coins',
  euro: 'coins',
  doc: 'file-text',
  pdf: 'file-text',
  document: 'file-text',
  excel: 'file-spreadsheet',
  table: 'file-spreadsheet',
  tabella: 'file-spreadsheet',
  appunti: 'clipboard',
  elenco: 'clipboard',

  // Utilities & Theme
  light: 'sun',
  sole: 'sun',
  dark: 'moon',
  luna: 'moon',
  fuoco: 'flame',
  cero: 'flame',
  candela: 'flame',
  bolt: 'zap',
  fulmine: 'zap',
  turbo: 'zap',
  data: 'calendar',
  anno: 'calendar',
  history: 'clock',
  tempo: 'clock',
  ora: 'clock',
  spinner: 'loader',
  loading: 'loader',
  caricamento: 'loader',
  filter: 'sliders',
  filtri: 'sliders',
  tool: 'sliders',
  builder: 'sliders',
  zona: 'map-pin',
  luogo: 'map-pin',
  map: 'map-pin',
  cartella: 'folder',
  audit: 'shield-check',
  sicurezza: 'shield-check',
  shield: 'shield-check',
  view: 'eye',
  anteprima: 'eye',
  crescita: 'trending-up',
  churn: 'trending-down',
  recupero: 'trending-down',
  bilancia: 'scale',
  'audit-quote': 'scale',
  audio: 'volume-2',
  suono: 'volume-2',
  mute: 'volume-x',
  silenzioso: 'volume-x',
  box: 'package',
  archivio: 'package',
  collegamento: 'link',
  fabbrica: 'factory',
  numero: 'hash',
  tastiera: 'keyboard',
  shortcuts: 'keyboard',
  preset: 'bookmark',
  informazioni: 'info',
  circle: 'circle-slash',
  disattivato: 'circle-slash',
  target: 'inbox',
  vuoto: 'inbox',
}

// Catalogo geometrico vettoriale stile Apple SF Symbols (viewBox 0 0 24 24)
const ICONS = {
  // Navigation & Shell
  'home': '<path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  'refresh-cw': '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  'rotate-ccw': '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
  'receipt': '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/>',
  'bar-chart': '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/><line x1="3" y1="20" x2="21" y2="20"/>',
  'settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',

  // Actions & Controls
  'search': '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  'plus': '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  'check': '<polyline points="20 6 9 17 4 12"/>',
  'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  'check-square': '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  'alert-triangle': '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>',
  'alert-circle': '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/>',
  'alert-octagon': '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/>',
  'trash-2': '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  'edit': '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  'x': '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  'x-circle': '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  'save': '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
  'printer': '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  'database': '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',

  // Chevrons & Directionals
  'chevron-left': '<polyline points="15 18 9 12 15 6"/>',
  'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
  'chevron-up': '<polyline points="18 15 12 9 6 15"/>',
  'chevron-down': '<polyline points="6 9 12 15 18 9"/>',

  // Users & Entities
  'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  'users': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
  'user-check': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
  'user-x': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="22" y2="12"/><line x1="22" y1="8" x2="18" y2="12"/>',

  // Finance & Documents
  'credit-card': '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  'coins': '<circle cx="9" cy="9" r="7"/><path d="M21 14.5a6.5 6.5 0 0 1-8.5 6.2"/><path d="M17 9a6.5 6.5 0 0 1 0 5.5"/><line x1="9" y1="6" x2="9" y2="12"/><line x1="7" y1="8" x2="11" y2="8"/><line x1="7" y1="10" x2="11" y2="10"/>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
  'file-spreadsheet': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="12" y1="13" x2="12" y2="17"/>',
  'ticket': '<path d="M2 9a3 3 0 0 1 0 6v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a3 3 0 0 1 0-6V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="12" y1="3" x2="12" y2="21" stroke-dasharray="2 2"/>',
  'clipboard': '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',

  // Utilities, Status & Theme
  'sun': '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  'moon': '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  'flame': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  'zap': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  'calendar': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'loader': '<line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>',
  'sliders': '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  'map-pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  'folder': '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  'shield-check': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
  'eye': '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  'trending-up': '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  'trending-down': '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
  'scale': '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/>',
  'volume-2': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>',
  'volume-x': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
  'sparkles': '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>',
  'package': '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  'factory': '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4H2v16z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>',
  'hash': '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',
  'keyboard': '<rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><line x1="6" y1="8" x2="6.01" y2="8"/><line x1="10" y1="8" x2="10.01" y2="8"/><line x1="14" y1="8" x2="14.01" y2="8"/><line x1="18" y1="8" x2="18.01" y2="8"/><line x1="6" y1="12" x2="6.01" y2="12"/><line x1="18" y1="12" x2="18.01" y2="12"/><line x1="10" y1="16" x2="14" y2="16"/>',
  'bookmark': '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  'info': '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><circle cx="12" cy="8" r="0.5" fill="currentColor"/>',
  'circle-slash': '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>',
  'inbox': '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  'fallback': '<circle cx="12" cy="12" r="10" stroke-dasharray="2 2"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>'
}

// Risoluzione nome canonico
const canonicalName = computed(() => {
  if (!props.name) return 'fallback'
  const clean = props.name.toLowerCase().trim()
  if (ICONS[clean]) return clean
  if (ALIASES[clean] && ICONS[ALIASES[clean]]) return ALIASES[clean]
  return clean
})

// Tracciati SVG risolti
const svgContent = computed(() => {
  const icon = ICONS[canonicalName.value]
  if (icon) return icon
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[BaseIcon] Icon "${props.name}" (risolta come: "${canonicalName.value}") non trovata nel registro.`)
  }
  return ICONS['fallback']
})

// Risoluzione cromatica con supporto palette Santantoniari
const computedColor = computed(() => {
  if (!props.color) return 'currentColor'
  const key = props.color.toLowerCase().trim()
  return PALETTE_MAP[key] || props.color
})

// Normalizzazione dimensione (numeri o unità CSS)
const computedSize = computed(() => {
  if (typeof props.size === 'number') return `${props.size}px`
  if (!props.size) return '20px'
  return /^[0-9]+$/.test(props.size) ? `${props.size}px` : props.size
})

// Normalizzazione spessore tratto
const computedStrokeWidth = computed(() => {
  return props.strokeWidth || 1.8
})
</script>

<style scoped>
.base-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: -0.125em;
  flex-shrink: 0;
  transition: stroke 0.2s ease, fill 0.2s ease, transform 0.2s ease;
}

.base-icon--spin {
  animation: base-icon-spin 1s linear infinite;
}

@keyframes base-icon-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
```

---

### 4.2 Codice Suite di Test Unitaria: `src/components/__tests__/BaseIcon.test.js`

```javascript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseIcon from '../common/BaseIcon.vue'

describe('BaseIcon Component', () => {
  it('esegue il render dell\'SVG con le proprietà di default', () => {
    const wrapper = mount(BaseIcon, {
      props: { name: 'home' },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.classes()).toContain('base-icon')
    expect(wrapper.classes()).toContain('base-icon--home')
    expect(wrapper.attributes('width')).toBe('20px')
    expect(wrapper.attributes('height')).toBe('20px')
    expect(wrapper.attributes('stroke')).toBe('currentColor')
    expect(wrapper.attributes('fill')).toBe('none')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBe('presentation')
  })

  it('rispetta la dimensione custom numerica e stringa con unità', async () => {
    const wrapperNum = mount(BaseIcon, {
      props: { name: 'search', size: 24 },
    })
    expect(wrapperNum.attributes('width')).toBe('24px')
    expect(wrapperNum.attributes('height')).toBe('24px')

    const wrapperRem = mount(BaseIcon, {
      props: { name: 'search', size: '1.5rem' },
    })
    expect(wrapperRem.attributes('width')).toBe('1.5rem')
    expect(wrapperRem.attributes('height')).toBe('1.5rem')
  })

  it('risolve correttamente i token cromatici della palette Santantoniari', () => {
    // Ceraiolo / Accent
    const wrapperAccent = mount(BaseIcon, {
      props: { name: 'zap', color: 'accent' },
    })
    expect(wrapperAccent.attributes('stroke')).toBe('var(--color-accent, #b71c1c)')

    const wrapperCeraiolo = mount(BaseIcon, {
      props: { name: 'zap', color: 'ceraiolo' },
    })
    expect(wrapperCeraiolo.attributes('stroke')).toBe('var(--color-accent, #b71c1c)')

    // Oro caldo
    const wrapperGold = mount(BaseIcon, {
      props: { name: 'coins', color: 'gold' },
    })
    expect(wrapperGold.attributes('stroke')).toBe('var(--color-gold, #c59b27)')

    // Bianco
    const wrapperWhite = mount(BaseIcon, {
      props: { name: 'plus', color: 'white' },
    })
    expect(wrapperWhite.attributes('stroke')).toBe('#ffffff')

    // WCAG 2.2 Warning & Info
    const wrapperWarning = mount(BaseIcon, {
      props: { name: 'alert-triangle', color: 'warning' },
    })
    expect(wrapperWarning.attributes('stroke')).toBe('var(--color-warning, #c2410c)')

    const wrapperInfo = mount(BaseIcon, {
      props: { name: 'info', color: 'info' },
    })
    expect(wrapperInfo.attributes('stroke')).toBe('var(--color-info, #0369a1)')

    // Colore CSS personalizzato esplicito
    const wrapperCustom = mount(BaseIcon, {
      props: { name: 'check', color: '#16a34a' },
    })
    expect(wrapperCustom.attributes('stroke')).toBe('#16a34a')
  })

  it('risolve gli alias di navigazione e azioni (italiano e sinonimi)', () => {
    // Navigation aliases
    const w1 = mount(BaseIcon, { props: { name: 'ricerca' } })
    expect(w1.classes()).toContain('base-icon--home')

    const w2 = mount(BaseIcon, { props: { name: 'seriale' } })
    expect(w2.classes()).toContain('base-icon--refresh-cw')

    const w3 = mount(BaseIcon, { props: { name: 'blocchetti' } })
    expect(w3.classes()).toContain('base-icon--receipt')

    const w4 = mount(BaseIcon, { props: { name: 'chart' } })
    expect(w4.classes()).toContain('base-icon--bar-chart')

    const w5 = mount(BaseIcon, { props: { name: 'impostazioni' } })
    expect(w5.classes()).toContain('base-icon--settings')

    // Action aliases
    const w6 = mount(BaseIcon, { props: { name: 'elimina' } })
    expect(w6.classes()).toContain('base-icon--trash-2')

    const w7 = mount(BaseIcon, { props: { name: 'cassa' } })
    expect(w7.classes()).toContain('base-icon--coins')

    const w8 = mount(BaseIcon, { props: { name: 'tessera' } })
    expect(w8.classes()).toContain('base-icon--ticket')

    const w9 = mount(BaseIcon, { props: { name: 'indietro' } })
    expect(w9.classes()).toContain('base-icon--chevron-left')
  })

  it('gestisce l\'accessibilità WCAG 2.2 quando è fornito title', () => {
    const wrapperWithTitle = mount(BaseIcon, {
      props: { name: 'printer', title: 'Stampa ricevuta' },
    })

    expect(wrapperWithTitle.attributes('role')).toBe('img')
    expect(wrapperWithTitle.attributes('aria-label')).toBe('Stampa ricevuta')
    expect(wrapperWithTitle.attributes('aria-hidden')).toBeUndefined()
    expect(wrapperWithTitle.find('title').exists()).toBe(true)
    expect(wrapperWithTitle.find('title').text()).toBe('Stampa ricevuta')
  })

  it('attiva la classe di rotazione continua con prop spin', () => {
    const wrapperSpin = mount(BaseIcon, {
      props: { name: 'loader', spin: true },
    })

    expect(wrapperSpin.classes()).toContain('base-icon--spin')

    const wrapperNoSpin = mount(BaseIcon, {
      props: { name: 'loader', spin: false },
    })

    expect(wrapperNoSpin.classes()).not.toContain('base-icon--spin')
  })

  it('gestisce graziosamente un nome icona non presente nel registro', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const wrapper = mount(BaseIcon, {
      props: { name: 'icona-inesistente-xyz' },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  it('garantisce che tutti i 5 simboli principali di navigazione siano definiti', () => {
    const navIcons = ['home', 'refresh-cw', 'receipt', 'bar-chart', 'settings']
    for (const name of navIcons) {
      const wrapper = mount(BaseIcon, { props: { name } })
      expect(wrapper.html()).not.toContain('stroke-dasharray="2 2"') // Non deve essere il fallback
    }
  })
})
```

---

### 4.3 Matrice di Sostituzione Emoji Completa (45+ Casi Censiti)

| Emoji Attuale | Componente/Vista | Contesto | Invocazione `BaseIcon` Consigliata |
|---|---|---|---|
| `🏠` | `src/App.vue:59` | Menu nav "Ricerca" | `<BaseIcon name="home" :size="18" /> Ricerca` |
| `🔄` | `src/App.vue:61` | Menu nav "Registrazione Seriale" | `<BaseIcon name="refresh-cw" :size="18" /> Registrazione Seriale` |
| `🧾` | `src/App.vue:63` | Menu nav "Blocchetti" | `<BaseIcon name="receipt" :size="18" /> Blocchetti` |
| `📊` | `src/App.vue:64` | Menu nav "Report" | `<BaseIcon name="bar-chart" :size="18" /> Report` |
| `⚙️` | `src/App.vue:65` | Menu nav "Impostazioni" | `<BaseIcon name="settings" :size="18" /> Impostazioni` |
| `🔥` / `🕯️` | `src/App.vue:67` / Settings | Selettore tema | `<BaseIcon name="sun" />` / `<BaseIcon name="moon" />` / `<BaseIcon name="flame" />` |
| `⚡` | `SocioCard.vue:15`, `BatchEntryView:141` | Rinnovo Rapido / Turbo | `<BaseIcon name="zap" color="warning" :size="18" />` |
| `🎫` | `SocioCard.vue:20`, `ReportsView:105` | Genera Tessera | `<BaseIcon name="ticket" :size="18" /> Genera Tessera` |
| `🔍` / `🔎` | `FilterPanel:4`, `BatchEntry:173` | Filtri / Ricerca | `<BaseIcon name="search" :size="18" />` |
| `👥` | `FilterPanel:30`, `BatchEntry:100` | Gruppo / Soci per ricevuta | `<BaseIcon name="users" :size="18" />` |
| `🎂` | `FilterPanel:12`, `AddSocio:50` | Data Nascita | `<BaseIcon name="calendar" :size="18" />` |
| `💳` | `AddPaymentModal:5`, `SocioDetail:51` | Paga / Registra Pagamento | `<BaseIcon name="credit-card" :size="18" />` |
| `💰` | `AddPaymentModal:12`, `BatchEntry:200` | Quota Pagata / Incasso | `<BaseIcon name="coins" color="gold" :size="18" />` |
| `📅` / `🗓️` | `AddPaymentModal:30`, `BatchEntry:51` | Data Pagamento | `<BaseIcon name="calendar" :size="18" />` |
| `🗑️` | `ConfirmDelete:6`, `Blocchetti:306` | Elimina / Rimuovi | `<BaseIcon name="trash-2" color="accent" :size="18" />` |
| `⚠️` | `ConfirmDelete:11`, `BatchEntry:197` | Alert / Arretrati | `<BaseIcon name="alert-triangle" color="warning" :size="20" />` |
| `⏳` | `HomeView:70`, `ConfirmDelete:33` | Caricamento / Attesa | `<BaseIcon name="loader" :spin="true" :size="18" />` |
| `❌` | `ErrorModal:4`, `BatchEntry:110` | Errore / Rimuovi | `<BaseIcon name="x" color="accent" :size="18" />` |
| `⌨️` | `KeyboardShortcutsModal:6` | Scorciatoie Tastiera | `<BaseIcon name="keyboard" :size="20" />` |
| `📄` | `HomeView:70`, `ReportsView:86` | Esporta PDF / Documento | `<BaseIcon name="file-text" :size="18" />` |
| `🕒` | `HomeView:90` | Ultimi Soci Visitati | `<BaseIcon name="clock" :size="18" />` |
| `✨` | `HomeView:114`, `AddSocio:102` | Nuovo / Create | `<BaseIcon name="sparkles" color="gold" :size="18" />` |
| `📝` | `HomeView:114`, `AddSocio:135` | Modifica / Note | `<BaseIcon name="edit" :size="18" />` |
| `🔗` | `HomeView:125` | Link Rapidi | `<BaseIcon name="link" :size="18" />` |
| `📥` | `HomeView:143`, `SettingsView:277` | Backup DB / Esporta | `<BaseIcon name="download" :size="18" />` |
| `🔧` / `🛠️` | `HomeView:147`, `ReportsView:49` | Fix DB / Builder | `<BaseIcon name="sliders" :size="18" />` |
| `⬅️` / `➡️` | `BatchEntryView:80, 92` | Ricevuta prec. / succ. | `<BaseIcon name="chevron-left" />` / `<BaseIcon name="chevron-right" />` |
| `➕` | `BatchEntry:127`, `Settings:366` | Nuovo Socio / Aggiungi | `<BaseIcon name="plus" :size="18" />` |
| `🔊` / `🔇` | `BatchEntryView:151` | Suoni attivi / mute | `<BaseIcon name="volume-2" />` / `<BaseIcon name="volume-x" />` |
| `✅` | `BatchEntry:190`, `Blocchetti:304` | In Regola / Restituito | `<BaseIcon name="check" color="success" :size="18" />` |
| `👤` | `BatchEntry:211`, `AddSocio:16` | Socio / Nome | `<BaseIcon name="user" :size="18" />` |
| `💾` | `BatchEntry:321`, `Settings:112` | Salva Pagamento / Config | `<BaseIcon name="save" :size="18" />` |
| `📦` | `ReportsView:27`, `Settings:273` | Export Batch / Archivio | `<BaseIcon name="package" :size="18" />` |
| `📈` | `ReportsView:34`, `Reports:162` | Statistiche / Trend | `<BaseIcon name="trending-up" :size="18" />` |
| `📉` | `ReportsView:92, 338` | Recupero Crediti (Churn) | `<BaseIcon name="trending-down" color="warning" :size="18" />` |
| `⚖️` | `ReportsView:41, 493` | Audit Quote Rientri | `<BaseIcon name="scale" :size="18" />` |
| `👁️` | `ReportsView:138` | Anteprima Tessera | `<BaseIcon name="eye" :size="18" />` |
| `🗳️` | `ReportsView:350`, `ReportsBeta:96`| Votazioni / Elezioni | `<BaseIcon name="check-square" :size="18" />` |
| `🛡️` | `ReportsView:400` | Audit Qualità Dati | `<BaseIcon name="shield-check" color="success" :size="18" />` |
| `📁` | `SettingsView:213, 229` | Cartella Backup | `<BaseIcon name="folder" :size="18" />` |
| `⛔` | `SettingsView:331` | Zona Pericolosa | `<BaseIcon name="alert-octagon" color="accent" :size="20" />` |
| `🏭` | `SettingsView:333` | Reset Fabbrica | `<BaseIcon name="factory" color="accent" :size="18" />` |
| `📍` | `AddSocioView:65` | Luogo Nascita | `<BaseIcon name="map-pin" :size="18" />` |
| `ℹ️` | `ReportsBetaView:144` | Informazioni | `<BaseIcon name="info" color="info" :size="18" />` |

---

## 5. Verification Method (Metodo di Verifica Indipendente)

Il seguente protocollo permette all'agente implementatore o all'orchestratore di validare completamente il componente `BaseIcon.vue`:

1. **Creazione del Componente e del File di Test**:
   - Salvare il codice della Sezione 4.1 in `src/components/common/BaseIcon.vue`.
   - Salvare il codice della Sezione 4.2 in `src/components/__tests__/BaseIcon.test.js`.

2. **Esecuzione dei Test Unitari con Vitest**:
   ```bash
   npx vitest run src/components/__tests__/BaseIcon.test.js
   ```
   *Criterio di successo*: 7/7 test passati senza warning o errori di parsing.

3. **Verifica della Build di Produzione con Vite**:
   ```bash
   npm run build
   ```
   *Criterio di successo*: Compilazione completata con codice di uscita 0 e generazione dei bundle in `dist/`.

4. **Verifica Criteri di Invalidazione**:
   - La suite fallisce se un'icona fondamentale (`home`, `refresh-cw`, `receipt`, `bar-chart`, `settings`) non produce markup SVG valido.
   - La suite fallisce se una dimensione numerica `size={24}` non viene convertita in stringa CSS `"24px"`.
   - La suite fallisce se la prop `title` non inietta i metadati di accessibilità ARIA (`role="img"`, `aria-label`, `<title>`).
