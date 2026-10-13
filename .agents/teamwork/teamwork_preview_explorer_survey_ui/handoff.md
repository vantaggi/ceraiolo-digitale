# Rapporto di Ricognizione (Survey) UI, Ergonomia Senior, Accessibilità (WCAG 2.2 AA) e Interventi Recenti

**Progetto**: "Ceraiolo Digitale" (Famiglia dei Santantoniari di Gubbio)  
**Ruolo**: Explorer subagent (`teamwork_preview_explorer_survey_ui`)  
**Data**: 2026-10-04  
**Working Directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\teamwork\teamwork_preview_explorer_survey_ui`  
**Commit di riferimento**: `f0ec064` su branch `development`

---

## 1. Sommario Esecutivo

L'audit analitico e non distruttivo condotto sul codice dell'interfaccia utente ha confermato che i tre interventi recenti assegnati (Intervento 2, Intervento 4 e Intervento 6) sono stati implementati nel commit `f0ec064`.
L'infrastruttura di base è solida: la suite completa di **284 test su Vitest è verde al 100%**, la build Vite di produzione compila pulita in **5.75s**, l'applicazione è totalmente de-googlizzata (zero chiamate di rete esterne a Google Fonts), la dimensione base del font è impostata a 17px, e la bonifica delle emoji ha raggiunto il **100% di conformità** (0 emoji residue nell'interfaccia utente, sostituite con il componente istituzionale `<BaseIcon>`).

Tuttavia, l'indagine ha fatto emergere **criticità specifiche di accessibilità e contrasto WCAG 2.2 AA** e **limiti ergonomici sui touch target per utenti senior**, in particolare:
1. **Contrasto WCAG 2.2 AA del colore Oro Istituzionale (`#c59b27`) in Tema Chiaro**: fallisce gravemente il contrasto minimo sia per testo che per icone (rapporto **2.60:1** su bianco `#ffffff` e **2.38:1** su sfondo `#f4f5f7`, sotto la soglia non-text di 3.0:1 e text di 4.5:1).
2. **Contrasto del testo bianco su Rosso Dark Mode (`#ef5350`)**: rapporto **3.49:1**, che non rispetta il criterio 4.5:1 per testo standard nei pulsanti attivi della navbar e nelle call to action in Dark Mode.
3. **Grafico Canvas in Dark Mode (`DashboardCharts.vue`)**: i colori di titoli e assi del canvas Chart.js sono cablati a codice con colori chiari/fissi (`#b71c1c` con contrasto **1.53:1** e `#5c6266` con contrasto **2.65:1**), rendendo il grafico difficilmente leggibile a schermo scuro (sebbene la tabella dati speculare sottostante sia perfettamente visibile ad alto contrasto).
4. **Touch Target inferiori a 44px**: presenza di micro-pulsanti (es. modifica/annulla quota a **28x28px** ed elimina riga a **36x36px** in scheda socio, cancellazione filtri chip a **~12px**, pulizia ricerca seriale a **26x26px**).
5. **Codice orfano**: persistenza del file `src/views/ReportsBetaView.vue` (47 KB) non più referenziato dal router.

---

## 2. Esito Dettagliato Interventi Recenti (2, 4, 6)

### 2.1 Intervento 2: Scheda Socio in Tema Scuro
*Oggetto*: Pulsante "Modifica" bianco abbagliante, pulsanti quota/elimina senza stile (`src/views/SocioDetailView.vue` — nota: il file effettivo è `SocioDetailView.vue`, non `MemberDetailView.vue`).

* **Esito**: **FUNZIONA** (con riserva ergonomica sui touch target).
* **Evidenze e Righe di Codice**:
  1. **Pulsante Modifica** (`src/views/SocioDetailView.vue`, righe 995–1014):
     - *Prima*: aveva `background-color: var(--color-primary); color: white;`. In tema scuro `--color-primary` è `#e0e0e0`, causando un effetto bianco su bianco/abbagliante.
     - *Ora*:
       ```css
       .edit-button {
         padding: 0.75rem 1.25rem;
         background-color: var(--color-surface);
         color: var(--color-text-primary);
         border: 1px solid var(--color-border);
         border-radius: 8px;
         cursor: pointer;
         font-weight: 600;
         transition: all 0.2s;
       }
       .edit-button:hover {
         background-color: var(--color-surface-hover);
         border-color: var(--color-accent);
         color: var(--color-accent);
       }
       .edit-button.is-editing {
         background-color: var(--color-accent);
         color: #ffffff;
         border-color: var(--color-accent);
       }
       ```
     - Si adatta perfettamente a `--color-surface` in chiaro e in scuro.
  2. **Pulsanti Quota ed Elimina** (`src/views/SocioDetailView.vue`, righe 1309–1372):
     - *Prima*: i pulsanti `.save-quota-btn`, `.cancel-quota-btn` ed `.edit-btn-small` non avevano alcuna regola CSS definita ed esponevano caratteri grezzi (`✓`, `✗`, `✏️`).
     - *Ora*: sono stati implementati con stili dedicati, icone vettoriali `<BaseIcon name="edit" />`, `<BaseIcon name="check" />`, `<BaseIcon name="x" />` e `<BaseIcon name="trash" />`, con stati `:hover` ad alto contrasto e bordi di sicurezza.
  3. **Riserva Ergonomica**:
     - Righe 1315–1316: `.delete-btn` ha `width: 36px; height: 36px;`.
     - Righe 1334–1335: `.edit-btn-small`, `.save-quota-btn`, `.cancel-quota-btn` hanno `width: 28px; height: 28px;`.
     - Entrambe le dimensioni violano la raccomandazione ergonomica senior di **minimo 44px**.

---

### 2.2 Intervento 4: Errore Runtime `props is not defined` in `ConfirmDeleteModal.vue`
*Oggetto*: Errore runtime dovuto all'invocazione di `defineProps` senza assegnazione a costante.

* **Esito**: **FUNZIONA** (completamente risolto e verificato).
* **Evidenze e Righe di Codice**:
  1. `src/components/ConfirmDeleteModal.vue`, righe 57–74:
     ```javascript
     const props = defineProps({
       isVisible: {
         type: Boolean,
         default: false,
       },
       socioName: {
         type: String,
         default: '',
       },
       title: {
         type: String,
         default: '',
       },
       message: {
         type: String,
         default: '',
       },
     })
     ```
  2. Riga 81–89:
     ```javascript
     watch(
       () => props.isVisible,
       (visible) => {
         if (visible) {
           nextTick(() => {
             cancelBtn.value?.focus()
           })
         }
       },
     )
     ```
  3. *Riscontro*: Prima del commit `f0ec064`, `defineProps({...})` non era salvato in una variabile `const props`, provocando un `ReferenceError: props is not defined` in fase di esecuzione quando veniva valutato il watcher. Ora la costante è dichiarata e il watcher imposta anche l'autofocus accessibile su `cancelBtn`. Nessun errore rilevato in esecuzione o nei test.

---

### 2.3 Intervento 6: Hub Stampe, PDF Lab a Due Pilastri, Padding e 1400px
*Oggetto*: Riorganizzazione in due pilastri, barra chip filtri attivi, rimozione del doppio padding, Hub Stampe a 1400px (`src/views/ReportsView.vue`, `src/App.vue`, `src/assets/main.css`).

* **Esito**: **FUNZIONA**.
* **Evidenze e Righe di Codice**:
  1. **Struttura a Due Pilastri**:
     - *Pilastro 1: Criteri di Selezione Soci* (`src/views/ReportsView.vue`, righe 276–457): suddiviso in tre tab modulari con contatori attivi: Anagrafica & Territorio, Cassa & Storico, Elezioni & Voto.
     - *Pilastro 2: Impaginazione & Colonne* (`src/views/ReportsView.vue`, righe 460–550): selezione rapida colonne anagrafiche, componente di riordino orizzontale della sequenza colonne con frecce (`.col-move-btn`) e selezione colonne anni storici (V/X).
  2. **Barra Chip Filtri Attivi & Reset Rapido** (`src/views/ReportsView.vue`, righe 239–261):
     - Barra dedicata `.active-filters-bar` con contatore reattivo `.active-count-badge`, elenco chip dinamici con rimozione singola (`.chip-dismiss-btn`) e pulsante di ripristino immediato `.reset-all-btn`.
     - Card descrittiva in linguaggio naturale: `.filter-summary-card` con `activeFiltersSummary` (righe 264–270).
  3. **Hub Stampe a 1400px e Rimozione Doppio Padding**:
     - `src/views/ReportsView.vue`, righe 3810–3814:
       ```css
       .container {
         max-width: 1400px;
         margin: 0 auto;
         padding: 0 0 2rem 0; /* Rimosso padding laterale 2rem per evitare somma con App.vue */
       }
       ```
     - `src/App.vue`, righe 190–193: `.app-content` fornisce il padding perimetrale unico di `2rem`.
     - In `src/views/SocioDetailView.vue` (riga 840), la larghezza è stata allineata a `1200px` con `padding: 0 0 2rem 0;`.
  4. **Criticità Residue**:
     - I pulsanti di eliminazione del chip (`.chip-dismiss-btn`, riga 3309) e del preset (`.preset-delete-btn`, riga 3222) hanno dimensioni al tocco microscopiche (~12–14px).
     - La vista duplicata `src/views/ReportsBetaView.vue` è tuttora fisicamente presente nel repository anche se reindirizzata dal router.

---

## 3. Mappatura Cromatica e Calcoli Numerici di Contrasto WCAG 2.2 AA

I contrasti di luminanza relativa sono stati calcolati in conformità allo standard W3C WCAG 2.2 ($L = 0.2126R + 0.7152G + 0.0722B$ dopo linearizzazione sRGB).

### 3.1 Tabella Mappatura Contrasti Tema Chiaro

*Superficie Card (`--color-surface`)*: `#ffffff` | *Sfondo App (`--color-background`)*: `#f4f5f7`

| Elemento / Coppia di Colori | Colore FG | Colore BG | Rapporto Contrasto | Esito WCAG 2.2 AA (≥ 4.5:1) | Note & Valutazione |
|---|---|---|---|---|---|
| **Testo Principale** | `#1a1a1a` | `#ffffff` | **17.40:1** | **PASS** (AAA) | Contrasto eccellente per ipovedenti |
| **Testo Secondario** | `#5c6266` | `#ffffff` | **6.19:1** | **PASS** (AA) | Pienamente leggibile |
| **Rosso Santantoniari (Accent)** | `#b71c1c` | `#ffffff` | **6.57:1** | **PASS** (AA) | Ottimo per titoli e link |
| **Rosso Santantoniari (Hover)** | `#991b1b` | `#ffffff` | **8.62:1** | **PASS** (AAA) | Conforme |
| **Warning (Arancio Scuro)** | `#c2410c` | `#ffffff` | **5.18:1** | **PASS** (AA) | Scurito rispetto al precedente `#ed6c02` (3.0:1) |
| **Info (Blu Scuro)** | `#0369a1` | `#ffffff` | **5.93:1** | **PASS** (AA) | Scurito rispetto al precedente `#0288d1` (3.7:1) |
| **Success (Verde Istituzionale)** | `#2e7d32` | `#ffffff` | **5.13:1** | **PASS** (AA) | Conforme |
| **Oro Istituzionale su Bianco** | `#c59b27` | `#ffffff` | **2.60:1** | **CRITICO (FAIL)** | Fallisce sia 4.5:1 (testo) che 3.0:1 (icone/UI) |
| **Oro Istituzionale su Sfondo App** | `#c59b27` | `#f4f5f7` | **2.38:1** | **CRITICO (FAIL)** | Illeggibile per utenti senior |
| **Oro Istituzionale su Rosso Accent** | `#c59b27` | `#b71c1c` | **2.53:1** | **CRITICO (FAIL)** | Contrasto insufficiente |
| **Testo Bianco su Rosso Accent** | `#ffffff` | `#b71c1c` | **6.57:1** | **PASS** (AA) | Pulsanti primari ben contrastati |
| **Badge Ok (Verde su Tint 12%)** | `#2e7d32` | `#e5efe6` | **4.35:1** | **Borderline (FAIL)** | Di poco sotto il 4.5:1 per testo standard |
| **Badge Warn (Arancio su Tint 12%)** | `#c2410c` | `#f7e8e1` | **4.34:1** | **Borderline (FAIL)** | Di poco sotto il 4.5:1 per testo standard |

---

### 3.2 Tabella Mappatura Contrasti Tema Scuro

*Superficie Card (`--color-surface`)*: `#1e1e1e` | *Sfondo App (`--color-background`)*: `#121212`

| Elemento / Coppia di Colori | Colore FG | Colore BG | Rapporto Contrasto | Esito WCAG 2.2 AA (≥ 4.5:1) | Note & Valutazione |
|---|---|---|---|---|---|
| **Testo Principale** | `#e0e0e0` | `#1e1e1e` | **12.63:1** | **PASS** (AAA) | Contrasto confortevole senza abbagliamento |
| **Testo Secondario** | `#a0a0a0` | `#1e1e1e` | **6.38:1** | **PASS** (AA) | Conforme |
| **Rosso Dark Mode (Accent)** | `#ef5350` | `#1e1e1e` | **4.78:1** | **PASS** (AA) | Conforme come testo/icona su sfondo scuro |
| **Oro Caldo Dark Mode** | `#e5b338` | `#1e1e1e` | **8.60:1** | **PASS** (AAA) | Ottimo contrasto in tema scuro |
| **Warning Dark Mode** | `#ffa726` | `#1e1e1e` | **8.58:1** | **PASS** (AAA) | Conforme |
| **Info Dark Mode** | `#38bdf8` | `#1e1e1e` | **7.78:1** | **PASS** (AAA) | Conforme |
| **Success Dark Mode** | `#66bb6a` | `#1e1e1e` | **7.05:1** | **PASS** (AA) | Conforme |
| **Testo Bianco su Rosso Accent Dark** | `#ffffff` | `#ef5350` | **3.49:1** | **ALTA (FAIL)** | Fallisce 4.5:1 per testo < 18pt |
| **Testo Scuro su Rosso Accent Dark** | `#121212` | `#ef5350` | **5.37:1** | **PASS** (AA) | In Dark Mode su `#ef5350` serve testo scuro |
| **Chart Title Canvas in Dark Mode** | `#b71c1c` | `#1e1e1e` | **1.53:1** | **CRITICO (FAIL)** | Titolo grafico Chart.js illeggibile a schermo scuro |
| **Chart Ticks Canvas in Dark Mode** | `#5c6266` | `#1e1e1e` | **2.65:1** | **ALTA (FAIL)** | Etichette numeriche assi Chart.js scure su scuro |

---

## 4. Verifica Ergonomia Senior, Tipografia e Touch Targets

### 4.1 Tipografia Offline & Stack di Sistema
* **Google Fonts**: Completamente rimosso. Zero tag `<link>` in `index.html`, zero direttive `@import` remote in `src/assets/main.css`. Nessun dato utente inviato verso CDN terze e funzionamento 100% offline garantito.
* **Stack Font Nativo**: `system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`. Caricamento a latenza zero.
* **Scala Tipografica Base**: `html { font-size: 17px; }` e `body { font-size: 1rem; }`. Rispetta lo standard di leggibilità per l'utenza anziana della Famiglia.

### 4.2 Allineamento Contabile e Numeri Tabulari
* In `src/assets/main.css` (righe 310–326) sono definite le classi globali:
  ```css
  .tabular-nums, .text-right, .col-currency, .col-number, ... {
    text-align: right !important;
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum' 1;
  }
  ```
* Tutte le tabelle contabili (blocchetti, quote, resoconti e tabella speculare della dashboard) adottano numeri a spaziatura fissa che mantengono incolonnati centesimi e cifre.
* **Anomalia riscontrata**: in `src/views/SocioDetailView.vue` (riga 1070) è stata definita una classe con nome al singolare `.tabular-num` contenente solo `font-variant-numeric: tabular-nums` priva di allineamento a destra `text-align: right`.

### 4.3 Audit Touch Target (Soglia Senior ≥ 44px)
La scansione di tutti i selettori CSS dell'applicazione ha individuato elementi interattivi al di sotto dei 44px:

| File / Componente | Selettore / Elemento | Dimensione Attuale | Esito Ergonomico | Gravità |
|---|---|---|---|---|
| `src/views/SocioDetailView.vue` | `.edit-btn-small`, `.save-quota-btn`, `.cancel-quota-btn` | **28 x 28 px** | Gravemente sotto i 44px | **Alta** |
| `src/views/SocioDetailView.vue` | `.delete-btn` | **36 x 36 px** | Sotto i 44px | **Media** |
| `src/views/ReportsView.vue` | `.chip-dismiss-btn` (rimozione filtro) | **~12 x 12 px** (icona 12px, padding 0) | Estremamente difficile da toccare con touchscreen | **Alta** |
| `src/views/ReportsView.vue` | `.preset-delete-btn` (elimina vista salvata) | **~14 x 14 px** (icona 14px, padding 0) | Sotto i 44px | **Media** |
| `src/views/ReportsView.vue` | `.segment-btn` (fascia d'età, stato pagamento) | `min-height: 38px;` | Sotto i 44px | **Media** |
| `src/views/ReportsView.vue` | `.category-tab-btn` (anagrafica, cassa, elezioni) | `min-height: 40px;` | Sotto i 44px | **Bassa** |
| `src/views/ReportsView.vue` | `.reset-all-btn` (ripristina tutti i filtri) | `min-height: 36px;` | Sotto i 44px | **Media** |
| `src/views/BatchEntryView.vue` | `.clear-search-btn` (svuota ricerca) | **26 x 26 px** | Sotto i 44px | **Media** |
| `src/views/BlocchettiView.vue` | `.pagination-btn` (paginazione blocchetti) | `min-height: 38px;` | Sotto i 44px | **Media** |
| `src/App.vue` (mobile <960px) | `.nav-link` | `min-height: 42px;` | Sotto i 44px | **Bassa** |

---

### 4.4 Scansione Emoji Residue e Sistema Iconografico
* **Scansione Regex Unicode (`\p{Extended_Pictographic}`)**: Eseguita sull'intero albero `src/` (esclusi file di test). Risultato: **0 emoji trovate**.
* **Scansione Caratteri Speciali Grezzi (`✕`, `✓`, `✗`, `✏️`, `🗑️`, `⚠️`)**: Risultato: **0 caratteri grezzi**.
* **Adozione `<BaseIcon>`**: Tutte le viste utilizzano componenti vettoriali SVG standardizzati, integrati con `aria-hidden="true"` e titoli accessibili dove opportuno.

---

### 4.5 Data Visualization & Tabella Dati Speculare (`DashboardCharts.vue`)
* **Doppio asse Y**: Rimosso con successo. Il grafico espone una scala lineare singola a sinistra (`Totale Iscritti`).
* **Tabella Speculare Permanente**:
  - Posizionata direttamente sotto il grafico (`.specular-table-container`, righe 83–155).
  - Pienamente accessibile senza interazione del mouse (nessun hover obbligatorio per leggere i dati).
  - Altezza righe 50px (nel range 48–52px senior), zebratura alternata ad alto contrasto.
  - Dimensione font `1.0625rem` (esattamente 17px).
  - Cifre allineate a destra con numeri tabulari.
  - Riga riassuntiva di chiusura nel `<tfoot>` con media iscritti e variazione netta.
* **Criticità individuata**:
  - L'istanza `Chart.js` su Canvas HTML5 utilizza colori statici cablati a codice (`#5c6266` per i ticks, `#b71c1c` per il titolo, `rgba(0,0,0,0.06)` per la griglia).
  - Quando l'utente passa al tema scuro, il canvas mantiene i colori originari, rendendo il titolo quasi invisibile (**1.53:1**) e i numeri degli assi poco leggibili (**2.65:1**).

---

## 5. Elenco Bug e Criticità UX Identificate (Classificazione di Gravità)

| ID | Area / File | Gravità | Descrizione del Problema | Impatto Utente |
|---|---|---|---|---|
| **UI-01** | `src/assets/main.css:11`, `BaseIcon.vue` | **Critica** | **Contrasto WCAG 2.2 fallito per Oro Istituzionale (`#c59b27`) in Tema Chiaro.** Il rapporto su bianco è **2.60:1** (richiesto ≥ 3.0:1 per icone/componenti e ≥ 4.5:1 per testo). Utilizzato in titoli di sezione, badge e icone (es. *Cronologia Pagamenti*, *Attività Recente*, *Fogli Tessere 6x*). | Un utente anziano fatica a distinguere le icone e i titoli color oro sullo sfondo chiaro delle card. |
| **UI-02** | `src/components/DashboardCharts.vue:363,368` | **Alta** | **Canvas Chart.js in Tema Scuro con contrasto illeggibile.** Il titolo dell'asse Y usa `#b71c1c` statico (contrasto **1.53:1** su `#1e1e1e`) e i ticks usano `#5c6266` (contrasto **2.65:1**). Chart.js non ascolta reattivamente il cambio tema di Pinia. | In tema scuro il grafico della dashboard appare spento e con assi difficili da decifrare. |
| **UI-03** | `src/App.vue:242`, `ReportsView.vue:3399` | **Alta** | **Contrasto testo bianco `#ffffff` su Rosso Accent Scuro `#ef5350`.** Il contrasto è di soli **3.49:1**, violando il requisito WCAG 2.2 AA di 4.5:1 per testo normale. Presente sui link attivi della navbar in tema scuro e su pulsanti principali. | Testo dei pulsanti attivi in tema scuro meno nitido per occhi affaticati. |
| **UI-04** | `src/views/SocioDetailView.vue:1315,1334` | **Alta** | **Touch target microscopici per modifica quota ed eliminazione tesseramento.** I pulsanti `.save-quota-btn`, `.cancel-quota-btn` e `.edit-btn-small` misurano **28x28px**, `.delete-btn` misura **36x36px**. | Rischio elevato di mancato tocco o tocco errato su touch screen da parte di volontari anziani. |
| **UI-05** | `src/views/ReportsView.vue:3222,3309` | **Media** | **Touch target chip dismiss e delete preset (< 20px).** I pulsanti `chip-dismiss-btn` e `preset-delete-btn` hanno `padding: 0` e icone da 12–14px. | Difficile eliminare un singolo filtro attivo senza premere accidentalmente il chip circostante. |
| **UI-06** | `src/views/ReportsBetaView.vue` | **Media** | **Codice orfano e duplicato nel repository.** File da 47 KB rimasto in `src/views/` nonostante l'Hub Stampe sia stato unificato in `ReportsView.vue` e il router lo reindirizzi. | Confusione per i manutentori e overhead inutile nel repository. |
| **UI-07** | `src/views/SocioDetailView.vue:852,1070` | **Bassa** | **Disallineamento classe `.tabular-num` (singolare).** Usa `.tabular-num` invece dello standard globale `.tabular-nums`, mancando l'allineamento forzato a destra. | Piccola incoerenza stilistica nella colonna importi della scheda socio. |
| **UI-08** | `src/views/BlocchettiView.vue:178`, `ReportsView.vue:3159` | **Bassa** | **Pulsanti di paginazione e segmenti filtri con altezza 36–38px.** Inferiori ai 44px consigliati per ergonomia senior. | Ergonomia migliorabile per la selezione rapida delle pagine dei blocchetti. |

---

## 6. Proposte di Miglioramento (Design Sketch & Pseudo-Code)

### 6.1 Adeguamento Cromatico Oro & Rosso Dark Mode (`main.css`)
Per preservare l'identità istituzionale senza violare WCAG 2.2:
- In Tema Chiaro: scurire l'oro per testi e icone da `#c59b27` a `#947112` (contrasto **4.61:1** su `#ffffff`, conforme AA).
- In Tema Scuro: per i pulsanti attivi con sfondo `--color-accent` (`#ef5350`), impostare il colore del testo su `#121212` (contrasto **5.37:1**, conforme AA) oppure scurire leggermente lo sfondo del pulsante.

### 6.2 Integrazione Reattiva Tema in `DashboardCharts.vue`
Connettere le opzioni di Chart.js a uno stato computato reattivo legato a `themeStore.currentTheme`:
```javascript
const isDark = computed(() => themeStore.currentTheme === 'dark')
const chartOptions = computed(() => ({
  // ...
  scales: {
    y: {
      ticks: { color: isDark.value ? '#a0a0a0' : '#5c6266' },
      title: { color: isDark.value ? '#ef5350' : '#b71c1c' },
      grid: { color: isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
    },
    x: {
      ticks: { color: isDark.value ? '#a0a0a0' : '#5c6266' }
    }
  }
}))
```

### 6.3 Adeguamento Touch Target Senior
Applicare una dimensione minima di `44px` con padding e trasparenza invisibile per i pulsanti compatti:
```css
.edit-btn-small, .save-quota-btn, .cancel-quota-btn, .chip-dismiss-btn {
  min-width: 44px;
  min-height: 44px;
}
```

---

## 7. Logic Chain (Catena di Ragionamento)

1. **Osservazione**: `git log` e i diff su `f0ec064` mostrano le modifiche introdotte per `ConfirmDeleteModal.vue`, `SocioDetailView.vue`, `ReportsView.vue`, `App.vue` e `main.css`.
2. **Deduzione**: Gli interventi 2, 4 e 6 sono stati implementati dal punto di vista funzionale e architetturale, risolvendo i bug di crash e la struttura di base.
3. **Osservazione**: Il calcolo matematico della luminanza sRGB dei colori esposti nei CSS variables e nei componenti evidenzia rapporti di contrasto sotto soglia (2.60:1 per l'oro in chiaro, 3.49:1 per testo bianco su rosso scuro, 1.53:1 per il titolo del grafico su tela scura).
4. **Deduzione**: Sebbene l'app sembri graficamente coerente, utenti ipovedenti o anziani incontrano difficoltà obiettive su elementi specifici sia in chiaro che in scuro.
5. **Osservazione**: La scansione AST/CSS ha individuato regole fisse `width: 28px` e `height: 28px` sui pulsanti di azione della scheda socio.
6. **Deduzione**: Questa dimensione è significativamente inferiore ai 44px standard per touch target senior, rendendo difficile l'uso con dita tremolanti o su tablet.

---

## 8. Caveats (Aree Non Indagate e Assunzioni)

* **Assunzione sull'hardware di destinazione**: Si presume che il software sia utilizzato su postazioni desktop e portatili Windows/Linux con mouse, ma anche su tablet o touchscreen dei volontari durante la festa/raccolta quote.
* **Nessuna modifica al codice eseguita**: Rispettando il vincolo di pura indagine read-only, nessuna modifica è stata applicata a `src/`.
* **Codice orfano**: Non è stato eliminato `ReportsBetaView.vue` durante questo turno per rispettare rigorosamente il vincolo di non toccare `src/`.

---

## 9. Conclusioni

L'applicazione "Ceraiolo Digitale" si presenta a un livello di maturità molto elevato, priva di regressioni sui 284 test automatizzati, con una transizione totale verso le icone vettoriali istituzionali e una base tipografica moderna e offline.
I tre interventi recenti assegnati (2, 4 e 6) sono **verificati e operativi**.
Le criticità emerse sono circoscritte ad aspetti di rifinitura accessibile (contrasti di colore specifici, touch target minimi di alcuni pulsanti e sincronizzazione cromatica del canvas grafico al cambio tema), facilmente risolvibili in un successivo turno di implementazione guidato.

---

## 10. Metodo di Verifica Indipendente

Per replicare e verificare in modo autonomo le evidenze riportate:

1. **Verifica suite di test**:
   ```bash
   npm run test -- --run
   ```
   *Risultato atteso*: 20 file di test superati, 284 test verdi.

2. **Verifica compilazione produzione**:
   ```bash
   npm run build
   ```
   *Risultato atteso*: build completa in ~5-6s senza errori.

3. **Verifica calcolo contrasti WCAG**:
   Eseguire lo script in questa directory:
   ```bash
   node .agents/teamwork/teamwork_preview_explorer_survey_ui/check_contrast.js
   ```

4. **Verifica assenza emoji e caratteri grezzi**:
   ```bash
   node .agents/teamwork/teamwork_preview_explorer_survey_ui/scan_emojis.mjs
   node .agents/teamwork/teamwork_preview_explorer_survey_ui/scan_special_chars.mjs
   ```

5. **Ispezione visiva e delle righe di codice**:
   - `src/components/ConfirmDeleteModal.vue`: riga 57 (`const props = defineProps`).
   - `src/views/SocioDetailView.vue`: riga 995 (`.edit-button`) e riga 1334 (`width: 28px`).
   - `src/views/ReportsView.vue`: riga 276 (Pilastro 1), riga 460 (Pilastro 2), riga 3811 (`max-width: 1400px`).
   - `src/components/DashboardCharts.vue`: riga 83 (tabella speculare) e riga 368 (`color: '#b71c1c'`).
