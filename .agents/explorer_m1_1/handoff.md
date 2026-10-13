# Handoff Report: CSS Tokens, Typography, WCAG 2.2 Contrasts, Tables & Settings Theme Selector (Milestone 1)

**Agent ID**: `explorer_m1_1`  
**Milestone**: M1 - Design System, Icons & Themes (R4, R5)  
**Target Git Branch**: `development`  
**Status**: COMPLETE (Hard Handoff)  
**Date**: 2026-09-10  

---

## 1. Observation

### 1.1 Remote Font Dependency and Typography Sizing
- **File**: `src/assets/main.css:2`
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Inter:wght@400;500;600;700&display=swap');
  ```
  This is the sole `@import` in the application stylesheet.
- **File**: `index.html:1-14`
  Confirmed zero remote font `<link>` tags in the HTML document.
- **File**: `src/assets/main.css:61-69`
  Currently, neither `html` nor `body` has an explicit `font-size` specified. Browsers default to 16px. Many views specify font sizes of `0.85rem` (~13.6px) or `0.9rem` (~14.4px), which causes readability strain for senior members and festival operators.
- **File**: `src/assets/main.css:23-24`
  Currently:
  ```css
  --font-family-heading: 'Merriweather', serif;
  --font-family-body: 'Inter', sans-serif;
  ```
  When disconnected from the internet, `'Inter'` and `'Merriweather'` are unavailable unless pre-installed on the host OS.

### 1.2 WCAG 2.2 Color Contrast Measurements
The relative luminance and contrast ratios were calculated using the official W3C WCAG 2.2 relative luminance formula:
$$L = 0.2126 \cdot R_{lin} + 0.7152 \cdot G_{lin} + 0.0722 \cdot B_{lin}$$
where $C_{lin} = \frac{C_{sRGB}}{12.92}$ if $C_{sRGB} \le 0.04045$, else $(\frac{C_{sRGB} + 0.055}{1.055})^{2.4}$.  
Contrast ratio: $\frac{L_1 + 0.05}{L_2 + 0.05}$.

Direct test results executed via Node.js:
- **Light Mode Surface**: `#ffffff` ($L = 1.0$)
  - Old `--color-warning: #ed6c02`: **3.11:1** $\rightarrow$ **FAILS WCAG 2.2 AA** (Minimum required: 4.5:1 for normal text).
  - Proposed `--color-warning: #c2410c`: **5.18:1** $\rightarrow$ **PASSES WCAG 2.2 AA** ($\ge 4.5:1$).
  - Old `--color-info: #0288d1`: **3.86:1** $\rightarrow$ **FAILS WCAG 2.2 AA** (Minimum required: 4.5:1).
  - Proposed `--color-info: #0369a1`: **5.93:1** $\rightarrow$ **PASSES WCAG 2.2 AA** ($\ge 4.5:1$).
  - `--color-primary: #1a1a1a`: **17.40:1** $\rightarrow$ **PASSES WCAG 2.2 AAA** ($\ge 7.0:1$).
  - `--color-text-secondary: #5c6266`: **6.19:1** $\rightarrow$ **PASSES WCAG 2.2 AA** ($\ge 4.5:1$).
  - `--color-accent: #b71c1c`: **6.57:1** $\rightarrow$ **PASSES WCAG 2.2 AA** ($\ge 4.5:1$).
  - `--color-success: #2e7d32`: **5.13:1** $\rightarrow$ **PASSES WCAG 2.2 AA** ($\ge 4.5:1$).
- **Dark Mode Surface**: `#1e1e1e` ($L = 0.0126$) and Background `#121212` ($L = 0.0069$)
  - `--color-text-primary: #e0e0e0`: **14.19:1** on `#121212`, **12.63:1** on `#1e1e1e` $\rightarrow$ **PASSES WCAG 2.2 AAA**.
  - `--color-text-secondary: #a0a0a0`: **7.16:1** on `#121212`, **6.37:1** on `#1e1e1e` $\rightarrow$ **PASSES WCAG 2.2 AA**.
  - Old `--color-accent: #e53935`: **4.43:1** on `#121212`, **3.94:1** on `#1e1e1e` $\rightarrow$ **Fails 4.5:1 on surface**.
  - Proposed `--color-accent: #ef5350`: **5.37:1** on `#121212`, **4.78:1** on `#1e1e1e` $\rightarrow$ **PASSES WCAG 2.2 AA** ($\ge 4.5:1$).
  - `--color-warning: #ffa726`: **9.64:1** on `#121212`, **8.58:1** on `#1e1e1e` $\rightarrow$ **PASSES WCAG 2.2 AAA**.
  - Proposed `--color-info: #38bdf8`: **8.74:1** on `#121212`, **7.78:1** on `#1e1e1e` $\rightarrow$ **PASSES WCAG 2.2 AAA**.
  - `--color-success: #66bb6a`: **7.92:1** on `#121212`, **7.05:1** on `#1e1e1e` $\rightarrow$ **PASSES WCAG 2.2 AAA**.

### 1.3 Tables and Accounting Number Alignment
- **File**: `src/assets/main.css`
  Zero global table rules exist.
- **Files**: `src/views/BlocchettiView.vue:275-308`, `src/views/ReportsBetaView.vue:270-301`, `src/views/ReportsView.vue:438-454, 520-552`
  Tables currently lack:
  1. Alternating zebra striping (`tbody tr:nth-child(even)`).
  2. Fixed ergonomic touch/click height of 48-52px per row.
  3. Consistent right-alignment for financial and numeric figures (`font-variant-numeric: tabular-nums`).
  4. Global responsive table container handling for smaller viewports.

### 1.4 Theme Selector Location and Nav Collision
- **File**: `src/App.vue:66-68`
  ```html
  <button @click="themeStore.toggleTheme" class="theme-toggle" title="Cambia Tema">
    {{ themeStore.currentTheme === 'dark' ? '🔥' : '🕯️' }}
  </button>
  ```
  The toggle button is inline with navigation items (`🏠 Ricerca`, `🔄 Registrazione Seriale`, `🧾 Blocchetti`, `📊 Report`, `⚙️ Impostazioni`). Touching navigation links frequently triggers accidental theme flips.
- **File**: `src/views/SettingsView.vue:42-115`
  The `generale` tab currently contains only app configuration fields (city, quota, years). It lacks any interface theme selector.

---

## 2. Logic Chain

1. **Offline Autonomy**:
   - Because `ceraiolo-digitale` is used on-site during festival operations and in historical headquarters where Wi-Fi or cellular networks can be disrupted, eliminating external CDN font fetches prevents render blocking and fallback FOIT/FOUT.
   - Adopting `system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` guarantees instantaneous rendering using native system font glyphs on Windows, macOS, Linux, and mobile devices.

2. **17px Typography Ergonomics**:
   - Senior operators (e.g. historical treasurers and referenti di manicchia) struggle with default 14-16px text on dense tables and forms.
   - Setting `html { font-size: 17px; }` elevates the entire rem scale proportionally across all views (e.g. `1rem` = 17px, `0.9rem` = 15.3px, `1.25rem` = 21.25px) without breaking responsive layout grids.

3. **WCAG 2.2 AA / AAA Color Token Alignment**:
   - Old warning `#ed6c02` (3.11:1) and info `#0288d1` (3.86:1) fail WCAG 2.2 AA on white surfaces.
   - Darkening `--color-warning` to `#c2410c` achieves **5.18:1**; darkening `--color-info` to `#0369a1` achieves **5.93:1**.
   - In Dark Mode, upgrading `--color-accent` from `#e53935` to `#ef5350` raises surface contrast from 3.94:1 to **4.78:1**, ensuring all colored accent text satisfies WCAG 2.2 AA.

4. **Accounting Legibility via Global CSS Table Rules**:
   - Providing global rules in `main.css` for `table`, `thead th`, `tbody td`, `.tabular-nums`, and `.text-right` ensures consistent 48-52px row height and zebra striping without requiring repetitive manual styling in every single Vue view.
   - `font-variant-numeric: tabular-nums` ensures numbers and monetary values align vertically along decimals and digit positions, preventing misreading of amounts in cash audits and receipts.

5. **Safe Relocation of Theme Switcher (Option 2)**:
   - Removing `.theme-toggle` from `App.vue` header removes accidental clicks from primary navigation.
   - Placing a visual radio-card switcher in `SettingsView.vue` (`generale` tab) preserves the dark theme while giving users explicit, non-accidental control with visual feedback.

---

## 3. Caveats

1. **App.vue Logo Dark Mode Filter**:
   `src/App.vue:54` uses `:class="{ 'logo-dark': themeStore.currentTheme === 'dark' }"`. When removing `.theme-toggle` from `App.vue`, `themeStore` must NOT be removed from `App.vue`'s `<script setup>` because `themeStore.currentTheme` is still needed for reactive logo color inversion.
2. **Horizontal Table Overflow on Small Tablets / Mobile**:
   Because `font-size: 17px` increases row and cell widths, tables with 6+ columns (such as `BlocchettiView` and `ReportsView`) must be enclosed inside `.table-responsive` or `.table-container` with `overflow-x: auto` to prevent viewport overflow.
3. **Badges with White Text vs Colored Background**:
   In light mode, `#c2410c` and `#0369a1` have contrast ratios of 5.18:1 and 5.93:1 against white `#ffffff`, which guarantees that badges with white text on warning/info backgrounds are also 100% WCAG 2.2 AA compliant.

---

## 4. Conclusion & Precise Code Specifications

### 4.1 Changes to `src/assets/main.css`

#### Replacement Chunk 1: Lines 1-52 (Imports & Theme Tokens)
```css
/* Global Styles for Ceraiolo Digitale */
/* Offline native system font stack: 0 external network requests */

/* Official Color Palette & Variables */
:root {
  /* Light Theme (Default) */
  --color-primary: #1a1a1a; /* Text Main - Contrast 17.4:1 */
  --color-primary-light: #333333; /* Text Light / Hover - Contrast 12.6:1 */
  --color-accent: #b71c1c; /* Red Brand Santantoniari - Contrast 6.57:1 */
  --color-accent-hover: #991b1b;
  --color-background: #f4f5f7; /* App Background */
  --color-surface: #ffffff; /* Card/Panel Background */
  --color-surface-hover: #f9fafb;
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #5c6266; /* Contrast 6.19:1 */
  --color-text-inverse: #ffffff;
  --color-border: #e1e4e8;
  --color-input-bg: #ffffff;
  --color-success: #2e7d32; /* Contrast 5.13:1 */
  --color-warning: #c2410c; /* WCAG 2.2 AA Compliant - Contrast 5.18:1 */
  --color-info: #0369a1;    /* WCAG 2.2 AA Compliant - Contrast 5.93:1 */

  /* Offline Robust Font Stacks */
  --font-family-sans: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
  --font-family-serif: Georgia, Cambria, 'Times New Roman', Times, serif;
  --font-family-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;

  --font-family-heading: var(--font-family-sans);
  --font-family-body: var(--font-family-sans);

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Dark Theme Overrides */
[data-theme='dark'] {
  --color-primary: #e0e0e0; /* Contrast 14.19:1 */
  --color-primary-light: #b0b0b0;
  --color-accent: #ef5350; /* WCAG 2.2 AA Compliant on #1e1e1e - Contrast 4.78:1 */
  --color-accent-hover: #f87171;
  --color-background: #121212;
  --color-surface: #1e1e1e;
  --color-surface-hover: #2c2c2c;
  --color-text-primary: #e0e0e0;
  --color-text-secondary: #a0a0a0; /* Contrast 6.37:1 */
  --color-text-inverse: #121212;
  --color-border: #333333;
  --color-input-bg: #2c2c2c;
  --color-success: #66bb6a; /* Contrast 7.05:1 */
  --color-warning: #ffa726; /* Contrast 8.58:1 */
  --color-info: #38bdf8;    /* Contrast 7.78:1 */

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5);
}
```

#### Replacement Chunk 2: Typography & Base (`html` & `body`)
```css
html {
  font-size: 17px; /* 17px Base Typography Scale */
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--font-family-body);
  font-size: 1rem; /* 17px */
  background-color: var(--color-background);
  color: var(--color-text-primary);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: var(--font-family-heading);
  color: var(--color-text-primary);
  font-weight: 700;
  line-height: 1.25;
  margin-bottom: 1rem;
}
```

#### Replacement Chunk 3: Global Tables & Tabular-Nums Rules (Appended to `main.css`)
```css
/* ==========================================================================
   Accessible Tables & Accounting Alignment (WCAG 2.2 & Senior Ergonomics)
   ========================================================================== */

table,
.data-table,
.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1rem; /* 17px */
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  text-align: left;
}

thead th,
.data-table th,
.preview-table th {
  padding: 0.85rem 1rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  background-color: var(--color-surface);
  border-bottom: 2px solid var(--color-border);
  white-space: nowrap;
}

tbody tr,
.data-table tbody tr,
.preview-table tbody tr {
  min-height: 48px;
  height: 50px; /* Ergonomic 48-52px range */
  transition: background-color 0.15s ease;
}

tbody td,
.data-table td,
.preview-table td {
  padding: 0.85rem 1rem;
  min-height: 48px;
  vertical-align: middle;
  border-bottom: 1px solid var(--color-border);
  line-height: 1.4;
}

/* Alternating zebra striping */
tbody tr:nth-child(even),
.data-table tbody tr:nth-child(even),
.preview-table tbody tr:nth-child(even) {
  background-color: var(--color-surface-hover);
}

/* High contrast row hover */
tbody tr:hover,
.data-table tbody tr:hover,
.preview-table tbody tr:hover {
  background-color: rgba(183, 28, 28, 0.04);
}

[data-theme='dark'] tbody tr:hover,
[data-theme='dark'] .data-table tbody tr:hover,
[data-theme='dark'] .preview-table tbody tr:hover {
  background-color: rgba(239, 83, 80, 0.08);
}

/* Tabular numbers and accounting alignment */
.tabular-nums,
.text-right,
.col-currency,
.col-number,
th.tabular-nums,
td.tabular-nums,
th.text-right,
td.text-right,
th.col-currency,
td.col-currency,
th.col-number,
td.col-number {
  text-align: right !important;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}

/* Responsive Table Wrapper */
.table-responsive,
.table-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
  margin-bottom: 1.5rem;
}
```

---

### 4.2 Changes to `src/views/SettingsView.vue`

#### Template: Inside `<section v-if="currentTab === 'generale'" class="settings-section">`
Insert directly above `<!-- Nuovi Parametri -->` (around line 46):
```html
          <!-- Selettore Tema Interfaccia (Opzione 2: Dark Mode Preservata) -->
          <div class="theme-setting-card">
            <div class="theme-setting-header">
              <div class="theme-title-group">
                <h3>Aspetto e Tema Visivo</h3>
                <p class="section-desc">Personalizza l'aspetto dell'applicazione. La preferenza viene memorizzata sul dispositivo.</p>
              </div>
              <span class="current-theme-badge">
                Attivo: <strong>{{ themeStore.currentTheme === 'dark' ? 'Scuro' : 'Chiaro' }}</strong>
              </span>
            </div>

            <div class="theme-options-grid" role="radiogroup" aria-label="Selezione tema interfaccia">
              <!-- Opzione Tema Chiaro -->
              <button
                type="button"
                role="radio"
                :aria-checked="themeStore.currentTheme === 'light'"
                @click="selectTheme('light')"
                class="theme-card"
                :class="{ 'active': themeStore.currentTheme === 'light' }"
              >
                <div class="theme-preview-box light-preview">
                  <div class="preview-header">
                    <span class="preview-dot dot-red"></span>
                    <span class="preview-bar"></span>
                  </div>
                  <div class="preview-body">
                    <div class="preview-row"></div>
                    <div class="preview-row short"></div>
                  </div>
                </div>
                <div class="theme-card-info">
                  <div class="theme-card-title">
                    <span class="theme-name">Tema Chiaro</span>
                    <span v-if="themeStore.currentTheme === 'light'" class="check-pill">✓ Selezionato</span>
                  </div>
                  <p class="theme-card-desc">Sfondo bianco ad alto contrasto. Ottimale per ambienti luminosi e consultazione diurna.</p>
                </div>
              </button>

              <!-- Opzione Tema Scuro -->
              <button
                type="button"
                role="radio"
                :aria-checked="themeStore.currentTheme === 'dark'"
                @click="selectTheme('dark')"
                class="theme-card"
                :class="{ 'active': themeStore.currentTheme === 'dark' }"
              >
                <div class="theme-preview-box dark-preview">
                  <div class="preview-header">
                    <span class="preview-dot dot-red"></span>
                    <span class="preview-bar"></span>
                  </div>
                  <div class="preview-body">
                    <div class="preview-row"></div>
                    <div class="preview-row short"></div>
                  </div>
                </div>
                <div class="theme-card-info">
                  <div class="theme-card-title">
                    <span class="theme-name">Tema Scuro</span>
                    <span v-if="themeStore.currentTheme === 'dark'" class="check-pill">✓ Selezionato</span>
                  </div>
                  <p class="theme-card-desc">Sfondo antracite ad alto contrasto. Ideale per ambienti con luce soffusa o lavoro prolungato.</p>
                </div>
              </button>
            </div>
          </div>
```

#### Script: Inside `<script setup>`
Import and bind `useThemeStore`:
```javascript
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const selectTheme = (theme) => {
  themeStore.applyTheme(theme)
  toast.success(theme === 'dark' ? 'Tema Scuro attivato' : 'Tema Chiaro attivato')
}
```

#### Styles: In `<style scoped>` of `SettingsView.vue`
```css
/* Theme Selector Styling */
.theme-setting-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-sm);
}

.theme-setting-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.theme-title-group h3 {
  margin: 0 0 0.35rem 0;
  font-size: 1.25rem;
  color: var(--color-text-primary);
}

.section-desc {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.current-theme-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.current-theme-badge strong {
  color: var(--color-accent);
}

.theme-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
}

.theme-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: 10px;
  padding: 1.25rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  position: relative;
  box-shadow: var(--shadow-sm);
  min-height: 140px;
}

.theme-card:hover {
  border-color: var(--color-accent-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.theme-card.active {
  border-color: var(--color-accent);
  background-color: rgba(183, 28, 28, 0.03);
  box-shadow: 0 0 0 2px rgba(183, 28, 28, 0.2), var(--shadow-sm);
}

[data-theme='dark'] .theme-card.active {
  background-color: rgba(239, 83, 80, 0.08);
  box-shadow: 0 0 0 2px rgba(239, 83, 80, 0.3), var(--shadow-sm);
}

.theme-preview-box {
  height: 75px;
  border-radius: 6px;
  padding: 0.6rem;
  margin-bottom: 1rem;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.theme-preview-box.light-preview {
  background-color: #f4f5f7;
  border-color: #e1e4e8;
}

.theme-preview-box.dark-preview {
  background-color: #121212;
  border-color: #333333;
}

.theme-preview-box .preview-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.theme-preview-box .preview-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #b71c1c;
}

.theme-preview-box.dark-preview .preview-dot {
  background-color: #ef5350;
}

.theme-preview-box .preview-bar {
  height: 6px;
  width: 50%;
  border-radius: 3px;
  background-color: #d1d5db;
}

.theme-preview-box.dark-preview .preview-bar {
  background-color: #4b5563;
}

.theme-preview-box .preview-body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.theme-preview-box .preview-row {
  height: 8px;
  width: 100%;
  border-radius: 3px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
}

.theme-preview-box.dark-preview .preview-row {
  background-color: #1e1e1e;
  border-color: #374151;
}

.theme-preview-box .preview-row.short {
  width: 60%;
}

.theme-card-info {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.theme-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.theme-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.check-pill {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  background-color: var(--color-accent);
  color: #ffffff;
}

.theme-card-desc {
  font-size: 0.88rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin: 0;
}
```

---

### 4.3 Changes to `src/App.vue`

1. Remove button from navigation (`lines 66-68`):
   ```html
   <!-- REMOVE THIS BLOCK FROM <nav>:
   <button @click="themeStore.toggleTheme" class="theme-toggle" title="Cambia Tema">
     {{ themeStore.currentTheme === 'dark' ? '🔥' : '🕯️' }}
   </button>
   -->
   ```
2. Remove `.theme-toggle` CSS block from `<style scoped>` (`lines 167-187` and `lines 211-213`).
3. Keep `themeStore` import and instance in `App.vue` for `<img :class="{ 'logo-dark': themeStore.currentTheme === 'dark' }">`.

---

## 5. Verification Method

To independently verify these specifications:

1. **Mathematical Contrast Verification**:
   Run the following command in root:
   ```bash
   node -e "
   function sRGBtoLin(c) { c = c / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
   function lum(hex) {
     const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
     return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
   }
   function contrast(c1, c2) {
     const l1 = lum(c1), l2 = lum(c2);
     return ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2);
   }
   console.log('Light Warning #c2410c vs #ffffff:', contrast('#c2410c', '#ffffff'), '>= 4.5');
   console.log('Light Info #0369a1 vs #ffffff:', contrast('#0369a1', '#ffffff'), '>= 4.5');
   console.log('Dark Accent #ef5350 vs #1e1e1e:', contrast('#ef5350', '#1e1e1e'), '>= 4.5');
   console.log('Dark Warning #ffa726 vs #1e1e1e:', contrast('#ffa726', '#1e1e1e'), '>= 7.0');
   console.log('Dark Info #38bdf8 vs #1e1e1e:', contrast('#38bdf8', '#1e1e1e'), '>= 7.0');
   "
   ```
   **Expected output**: All ratios satisfy WCAG 2.2 AA ($\ge 4.5:1$) or AAA ($\ge 7.0:1$).

2. **Build and Test Verification**:
   Ensure zero syntax or build regressions:
   ```bash
   npm run build
   npm run test -- --run
   ```

3. **Runtime & Offline Inspection**:
   - Verify zero requests are initiated to `fonts.googleapis.com` in Network tab.
   - Verify `getComputedStyle(document.documentElement).fontSize` equals `'17px'`.
   - Verify navigating to `SettingsView.vue` $\rightarrow$ `Generale` renders the two interactive theme cards. Clicking switches `data-theme` attribute between `light` and `dark` and persists across reload in `localStorage`.
   - Verify header in `App.vue` no longer contains the `🕯️`/`🔥` toggle button.
