# Handoff Report: PDF Services & Membership Cards Architecture (M3-2)

**Author**: `explorer_m3_2` (Teamwork Explorer)  
**Date**: 2026-09-11T07:32:00Z  
**Scope**: Milestone 3 (Unified Print Hub & Membership Cards - Requirements R2, R3)  
**Working Directory**: `c:\Users\cioti\Desktop\PROGETTI\ceraiolo-digitale\.agents\explorer_m3_2`  
**Target Files**: `src/services/export.js`, `src/services/exportBeta.js`, `src/components/TesseraTemplate.vue`

---

## 1. Observation

### 1.1 Emoji Audit Across Target Files
Direct scan using Node.js Unicode regex (`/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u` and surrogate pairs `[\uD800-\uDBFF][\uDC00-\uDFFF]`):
- **`src/components/TesseraTemplate.vue`**: Line 10:
  ```html
  <div v-if="hasPdfTemplate && !backgroundImage" class="pdf-template-message">
    <div class="pdf-icon">📄</div>
    <div class="pdf-text">PDF Template<br />Configurato</div>
  </div>
  ```
  Found raw emoji `📄` (U+1F4C4) in `.pdf-icon`.
- **`src/services/export.js`**: **Zero emojis found**. Status codes use pure ASCII text (`'V'`, `'X'`, `'O'`, `'-'`, `'[   ]'`).
- **`src/services/exportBeta.js`**: **Zero emojis found** in the service file. (Note: `src/views/ReportsBetaView.vue` contains multiple emojis in headings, buttons, and badges which will be handled when merged into `ReportsView.vue`).

### 1.2 Membership Card Preview (`src/components/TesseraTemplate.vue`)
- **Dimensions & Styling**:
  - Container `.tessera-vertical` (lines 82–87):
    ```css
    .tessera-vertical {
      width: 80.77mm;
      height: 122.17mm;
      perspective: 1000px;
      font-family: cursive;
    }
    ```
  - Text block `.member-info` (lines 103–111):
    ```css
    .member-info {
      display: flex;
      flex-direction: column;
      gap: 3mm;
      text-align: center;
      padding: 12mm 5% 12mm 5%;
      width: 100%;
      box-sizing: border-box;
    }
    ```
  - Member name `.name-value` (lines 124–128): `font-size: 5mm; min-height: 8mm; line-height: 1.2; font-weight: 600; color: #000000;`.
  - Date of birth `.birthdate-value` (lines 130–134): `font-size: 4.5mm; min-height: 6mm; line-height: 1.1; font-weight: 600; color: #000000;`.
- **Italian Date of Birth Formatting** (lines 53–73):
  ```javascript
  const mesi = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
  ]

  const dataNascitaFormattata = computed(() => {
    if (!props.dataNascita) return ''
    const [anno, mese, giorno] = props.dataNascita.split('-')
    const meseNome = mesi[parseInt(mese) - 1]
    return `${parseInt(giorno)} ${meseNome} ${anno}`
  })
  ```

### 1.3 Card Generation in `src/services/export.js`
- **Single Card Generation** (`generateSingleCardPDF`, lines 786–949):
  - Uses `pdf-lib` (`PDFDocument.load`, `PDFDocument.create`, `copyPages`).
  - Reads template from Dexie: `const pdfTemplateData = await getSetting('cardTemplatePDF')`.
  - Throws error if template is null:
    ```javascript
    if (!pdfTemplateData) {
      throw new Error('Nessun template PDF configurato. Carica un template PDF nelle impostazioni.')
    }
    ```
  - Embedded font: `const font = await pdfDoc.embedFont('Times-Italic')`.
  - Duplicated date formatting function `formattaData(dataNascita)` (lines 812–831).
  - Text wrapping and centering (lines 836–930):
    - `paddingTopBottom = 12 * 2.83465` (12mm in pt)
    - `nameFontSize = 5 * 2.83465` (5mm in pt)
    - `dateFontSize = 4.5 * 2.83465` (4.5mm in pt)
    - `lineSpacing = 3 * 2.83465` (3mm in pt)
    - Custom `wrapText(text, maxWidth, font, size)` splits text by space.
    - Horizontal centering: `x = textAreaCenterX - textWidth / 2`.
    - Vertical centering: `currentY = textAreaCenterY + totalContentHeight / 2 - nameMinLineHeight / 2`.
- **All Cards Generation** (`generateAllCardsPDF`, lines 958–1140):
  - Signature: `export async function generateAllCardsPDF(soci, renewalYear, onProgress = () => {})`.
  - Sorting: **Only global alphabetical sort by surname** (line 979):
    ```javascript
    const sociOrdinati = soci.sort((a, b) => a.cognome.localeCompare(b.cognome))
    ```
    *(Note: mutates `soci` array in-place; no Manicchia sorting option exists).*
  - Layout: **Only 1 card per page** (lines 987–990):
    ```javascript
    for (let i = 0; i < totaleSoci; i++) {
      const [templatePage] = await pdfDoc.copyPages(templateDoc, [0])
      pdfDoc.addPage(templatePage)
      ...
    ```
    *(Note: no 6-up / 6x layout option exists).*
  - Duplicated `formattaData(dataNascita)` function (lines 996–1015).

### 1.4 Booklet Cash Summary Report Status
- `generateBookletSummaryPDF` is **completely absent** from `src/services/export.js`.
- Grep for `generateBookletSummaryPDF` across the repository returned 0 matches outside `PROJECT.md`.
- Reference implementation of booklet aggregation exists in `src/__tests__/tier1_feature_coverage.spec.js` (lines 444–473) and `src/views/BlocchettiView.vue` (lines 41–110), where `blocchetti` table records are merged with `tesseramenti` payments to compute `totale_cassa`, `ricevute_utilizzate`, and assignee status.

### 1.5 Dynamic PDF Query Engine (`src/services/exportBeta.js`)
- Contains `generateBetaDynamicPDF(data, reportConfig, filtersSummaryText)` using `jsPDF`.
- Supports dynamic landscape/portrait switching (`reqWidth > 180 ? 'landscape' : 'portrait'`).
- Renders dynamic headers for base columns (`cognomeNome`, `gruppo`, `dataNascita`, `eta`, `dirittoVoto`, `motivoEsclusione`, `firma`) and year status columns (`V`, `X`, `O`, `-`).
- Fully functional and clean; ready to be invoked directly from the expanded "PDF Lab" in `ReportsView.vue`.

---

## 2. Logic Chain

### 2.1 Italian Date of Birth & Typography
1. **Observation**: `formattaData` is copy-pasted verbatim in `TesseraTemplate.vue` (lines 68–73), `export.js` (lines 812–831), and `export.js` (lines 996–1015).
2. **Observation**: `src/__tests__/tier1_feature_coverage.spec.js` (Feature 19, lines 508–534) enforces:
   - `'1980-05-15'` -> `'15 Maggio 1980'`
   - `'2005-01-01'` -> `'1 Gennaio 2005'`
   - `'1999-12-31'` -> `'31 Dicembre 1999'`
3. **Inference**: Creating a canonical, exported helper `formatItalianDOB(dateStr)` in `export.js` (or `src/utils/date.js`) removes code triplication, prevents `NaN undefined undefined` when strings have timestamps or alternate separators, and guarantees 100% compliance across on-screen preview and PDF export.
4. **Typography Alignment**:
   - `TesseraTemplate.vue` uses `5mm` for name and `4.5mm` for DOB.
   - `export.js` uses `5 * 2.83465 pt` (~14.17pt) and `4.5 * 2.83465 pt` (~12.75pt).
   - In `export.js`, `Times-Italic` is a standard 14 PostScript font embedded in `pdf-lib` that requires no external network download (100% offline).
   - In `TesseraTemplate.vue`, `.tessera-vertical { font-family: cursive; }` should be refined to `'Brush Script MT', 'Dancing Script', 'Segoe Script', cursive` for closer visual matching with `Times-Italic`.

### 2.2 Manicchia Sorting (with Inner Alphabetical Sort)
1. **Observation**: `PROJECT.md` Feature 18, `ORIGINAL_REQUEST.md` R3, `tier1_feature_coverage.spec.js` (lines 478–505), and `tier4_real_world_scenarios.spec.js` (lines 219–232) specify:
   - Primary sort: `gruppo_appartenenza` (Manicchia)
   - Secondary sort: `cognome` (Surname)
   - Tertiary sort: `nome` (First name)
2. **Observation**: Current `generateAllCardsPDF` only sorts by `a.cognome.localeCompare(b.cognome)` (line 979).
3. **Inference**: Update `generateAllCardsPDF` signature to accept an `options` parameter (`{ sortBy: 'manicchia' | 'alfabetico', layout: 'single' | '6x' }`):
   ```javascript
   const sortOption = options.sortBy || 'alfabetico'
   const sortedSoci = [...soci].sort((a, b) => {
     if (sortOption === 'manicchia') {
       const groupA = (a.gruppo_appartenenza || '').trim().toLowerCase()
       const groupB = (b.gruppo_appartenenza || '').trim().toLowerCase()
       const gCmp = groupA.localeCompare(groupB)
       if (gCmp !== 0) return gCmp
     }
     const cCmp = (a.cognome || '').localeCompare(b.cognome || '')
     if (cCmp !== 0) return cCmp
     return (a.nome || '').localeCompare(b.nome || '')
   })
   ```
4. **Inference**: To maintain 100% backward compatibility with existing callers like `generateAllCardsPDF(soci, year, progressCallback)`, implement argument sniffing:
   ```javascript
   export async function generateAllCardsPDF(soci, renewalYear, optionsOrProgress = {}, maybeProgress = null) {
     let options = {}
     let onProgress = () => {}
     if (typeof optionsOrProgress === 'function') {
       onProgress = optionsOrProgress
     } else if (typeof optionsOrProgress === 'object') {
       options = optionsOrProgress || {}
       if (typeof maybeProgress === 'function') {
         onProgress = maybeProgress
       }
     }
     ...
   ```

### 2.3 6-Up Membership Card Sheet Layout (A4 Grid)
1. **Observation**: `tier1_feature_coverage.spec.js` (lines 537–566) establishes the exact geometric coordinate contract for 6-up printing:
   - Sheet: A4 (`210mm x 297mm`, `595.28pt x 841.89pt`)
   - Card dimensions: `85mm x 54mm` (`240.95pt x 153.07pt`)
   - Grid: `cols = 2`, `rows = 3` (6 cards per sheet)
   - Horizontal margin: `(210 - 2 * 85) / 3 = 13.333mm` (`37.80pt`)
   - Vertical margin: `(297 - 3 * 54) / 4 = 33.750mm` (`95.67pt`)
2. **Observation**: In `pdf-lib`, page coordinate origin `(0, 0)` is at the bottom-left corner.
   - For card `k` on sheet (0 to 5):
     `col = k % 2`
     `row = Math.floor(k / 2)` (0 = top, 1 = middle, 2 = bottom)
     `xPt = (marginX + col * (cardWidth + marginX)) * 2.83465`
     `yPt = (a4Height - marginY - (row + 1) * cardHeight) * 2.83465`
3. **Inference**: When `layout === '6x'`:
   - If a custom card template PDF exists (`cardTemplatePDF`), use `pdfDoc.embedPage(templatePage)` once, and for each of the 6 cards execute `page.drawPage(embeddedTemplate, { x: xPt, y: yPt, width: 85 * 2.83465, height: 54 * 2.83465 })`.
   - If no custom template is uploaded, render a clean card border with Santantoniari `#b71c1c` accent, header text, member name in `Times-Italic`, and formatted DOB, avoiding unexpected hard failures.
   - Add light dashed cut lines around each card position to guide physical scissors/paper-cutter cutting.
   - For 85x54mm cards, scale typography proportionately: name font size ~3.5mm–4mm (10–11.5pt), DOB font size ~3mm (8.5pt).

### 2.4 Resoconto Cassa Blocchetti PDF (`generateBookletSummaryPDF`)
1. **Observation**: `PROJECT.md` line 84 contracts `generateBookletSummaryPDF(blocchetti, tesseramenti, year)`.
2. **Observation**: `BlocchettiView.vue` (lines 41–108) defines the business logic for reconciling physical booklets with digital receipt records:
   - Each booklet has 10 receipts (`ricevute_da` to `ricevute_a`).
   - Multiple members can be registered under the same receipt (`numero_ricevuta`).
   - `ricevute_utilizzate` is the count of distinct `numero_ricevuta` values used in that booklet.
   - `totale_cassa` is `sum(quota_pagata)` for all receipts in that booklet.
3. **Inference**: Implement `generateBookletSummaryPDF(blocchetti, tesseramenti, year)` in `export.js` using `jsPDF`, following the exact pattern of `generateRenewalListPDF` and `generateMembersByGroupPDF`:
   - Headers: `N. Blocchetto` (20mm), `Assegnato a` (55mm), `Range Ricevute` (25mm), `Ricevute Usate` (25mm), `Totale Cassa` (30mm, right-aligned), `Stato` (25mm).
   - Summary statistics banner: Total Booklets, Total Active/In Use, Total Receipts Used, Grand Total Cash (€).
   - Total row at the bottom of the table.
   - Filename: `resoconto_cassa_blocchetti_<year>_<date>.pdf`.
   - Returns `{ success: true, blob, filename, totalCash, totalBooklets }` and triggers `doc.save(filename)`.

### 2.5 Emoji Replacement
1. **Observation**: `TesseraTemplate.vue` line 10 contains `<div class="pdf-icon">📄</div>`.
2. **Inference**: Replace with `<BaseIcon name="receipt" :size="28" />` or `<BaseIcon name="chart" :size="28" />` and remove the `.pdf-icon` emoji styling, conforming to Requirement R4.

---

## 3. Caveats

1. **Custom Template Aspect Ratio**:
   - Single card template in current `SettingsView.vue` is vertical (~80.77mm x 122.17mm).
   - In 6-up sheet layout (A4), the CR80 card slot is 85mm x 54mm (landscape). If a user has uploaded a vertical template, drawing it into an 85x54mm box will change the aspect ratio unless fit/contain logic is used or the template is rotated 90 degrees. The implementation should handle either fitting with preserved aspect ratio or centered rendering.
2. **Dexie IndexedDB Asynchronous Access**:
   - `getSetting('cardTemplatePDF')` returns an `ArrayBuffer` or `Uint8Array`. Ensure proper conversion (`new Uint8Array(pdfTemplateData)`) before passing to `PDFDocument.load`.
3. **Double-Sided (Fronte/Retro) Templates**:
   - Requirement R3 mentions "template grafico fronte/retro". If the uploaded PDF template has 2 pages, single-card generation can generate page 1 (front) and page 2 (back) sequentially. For 6-up, the primary requirement is the 6-up front sheet.

---

## 4. Conclusion

The PDF export services and membership card components are structurally sound, well-tested (156 passing tests), and strictly offline. No major rewrites are needed. The required enhancements for Milestone 3 (R2, R3) can be implemented through targeted, surgical additions to `src/services/export.js` and `src/components/TesseraTemplate.vue`:

| Target File | Change Scope | Rationale |
|---|---|---|
| `src/components/TesseraTemplate.vue` | Replace `📄` with `<BaseIcon name="receipt" :size="28" />`; use canonical `formatItalianDOB` | Satisfies R4 emoji rule and prevents DOB formatting bugs |
| `src/services/export.js` | Export canonical `formatItalianDOB(dateStr)` | Eliminates code triplication; satisfies Feature 19 |
| `src/services/export.js` | Update `generateAllCardsPDF` to support `options.sortBy = 'manicchia' \| 'alfabetico'` | Satisfies R3 & Feature 18 (territorial mazzetti) |
| `src/services/export.js` | Add `options.layout = '6x'` in `generateAllCardsPDF` with A4 grid (2x3 cards of 85x54mm) | Satisfies R3 & Feature 20 (Fogli tessere 6x) |
| `src/services/export.js` | Add `generateBookletSummaryPDF(blocchetti, tesseramenti, year)` | Satisfies R2 & Feature 17 (Resoconto cassa blocchetti) |
| `src/services/exportBeta.js` | Keep `generateBetaDynamicPDF` unchanged; confirm 0 emojis | Ready for integration into the expanded PDF Lab in `ReportsView.vue` |

---

## 5. Verification Method

To independently verify these findings and subsequent implementation:

1. **Test Suite Execution**:
   ```bash
   npm test
   ```
   Must pass all existing 156 tests, specifically:
   - `src/__tests__/tier1_feature_coverage.spec.js` (Features 11, 17, 18, 19, 20)
   - `src/__tests__/tier3_cross_feature.spec.js` (Combination 3: Manicchia filter + card sort + 6-up pagination)
   - `src/__tests__/tier4_real_world_scenarios.spec.js` (Scenario 1, Step 7: Manicchia sort and Italian DOB)
   - `src/components/__tests__/TesseraTemplate.test.js` (All 6 component tests)

2. **Emoji Verification**:
   ```bash
   node -e "const fs = require('fs'); const files = ['src/components/TesseraTemplate.vue', 'src/services/export.js', 'src/services/exportBeta.js']; const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u; for (const f of files) { const lines = fs.readFileSync(f, 'utf8').split('\n'); lines.forEach((l, i) => { if (emojiRegex.test(l)) console.log(f + ':' + (i+1) + ': ' + l.trim()); }); }"
   ```
   Expected result: 0 emojis found across all three files.

3. **Build Integrity**:
   ```bash
   npm run build
   ```
   Must compile with 0 Vite bundle errors.
