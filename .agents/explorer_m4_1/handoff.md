# Handoff Report: Milestone 4 Senior Data Visualization (Requirement R6)
**Agent**: `explorer_m4_1`  
**Date**: 2026-09-11T10:05:00+02:00  
**Target Files**: 
- `src/components/DashboardCharts.vue`
- `src/views/HomeView.vue`
- `src/components/common/BaseIcon.vue` (reference)
- `src/__tests__/tier1_feature_coverage.spec.js` (reference)

---

## 1. Observation

### 1.1 Dual Y-Axis & Visualization Configuration in `DashboardCharts.vue`
In `src/components/DashboardCharts.vue`:
1. **Chart.js Registration & Component Import** (lines 60–89):
   ```javascript
   import {
     Chart as ChartJS,
     CategoryScale,
     LinearScale,
     PointElement,
     LineElement,
     LineController,
     BarElement,
     Title,
     Tooltip,
     Legend
   } from 'chart.js'
   import { Bar } from 'vue-chartjs'
   ```
2. **Conflicting Dual Y-Axis Datasets** (lines 195–225):
   ```javascript
   const chartData = computed(() => {
     return {
       labels: displayedData.value.map(d => d.year),
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
     }
   })
   ```
3. **Dual Scale Definitions in Options** (lines 251–276):
   ```javascript
   scales: {
     y: {
       type: 'linear',
       display: true,
       position: 'left',
       beginAtZero: true,
       title: {
         display: true,
         text: 'Totale Iscritti',
         color: '#b71c1c'
       }
     },
     y1: {
       type: 'linear',
       display: true,
       position: 'right',
       beginAtZero: true,
       grid: {
         drawOnChartArea: false,
       },
       title: {
         display: true,
         text: 'Variazioni',
         color: '#666'
       }
     },
     x: {
       grid: { display: false }
     }
   }
   ```
4. **Ad-hoc Scaling Hack in Data Processing** (lines 183–186):
   ```javascript
   // Fix: If the first year in the displayed result corresponds to the absolute start of data,
   // suppress the "New Members" bar if it's overwhelming (i.e. if newMembers ~= total).
   if (fullHistoryData.value.length > 0 && firstItem.year === fullHistoryData.value[0].year) {
        firstItem.newMembers = 0 // Suppress for display
   }
   ```

### 1.2 Mouse Hover-Only Tooltips & Absence of Permanent Data Display
1. In `src/components/DashboardCharts.vue` (lines 237–240):
   ```javascript
   interaction: {
     mode: 'index',
     intersect: false,
   }
   ```
   Values are completely invisible until a mouse hover trigger occurs over a bar or point. There are no static labels rendered on the chart canvas, and no companion tabular representation exists.
2. In `src/components/DashboardCharts.vue` template (lines 38–56):
   The component contains only summary cards and `<Bar :data="chartData" :options="chartOptions" />`. There is **no specular high-contrast data table** rendered below the chart canvas, despite Requirement R6 and Feature 22 specification.

### 1.3 Baseline Test Suite Expectations
In `src/__tests__/tier1_feature_coverage.spec.js` (lines 570–629):
1. Feature 21 tests that the chart series configuration is single-scale without secondary Y-axis dependency:
   ```javascript
   const chartConfig = {
     labels: yearlyStats.map((s) => s.year.toString()),
     datasets: [
       {
         label: 'Iscritti Totali',
         data: yearlyStats.map((s) => s.total),
         backgroundColor: '#b71c1c',
       },
     ],
     singleYAxis: true,
   }
   ```
2. Feature 22 tests that specular table rows match the selected time range (`5y`, `10y`, `all`):
   ```javascript
   const tableRows = filterByRange(rawData, '5y').map((r) => ({
     anno: r.year,
     iscritti: r.total,
     nuovi: `+${r.newMembers}`,
     cessati: `-${r.lostMembers}`,
     saldo: `+${r.newMembers - r.lostMembers}`,
   }))
   ```
   Baseline test execution command: `npx vitest run` yields **216 passed tests** across 14 test files.

### 1.4 Unicode Emojis in `HomeView.vue` and `DashboardCharts.vue`
1. In `src/views/HomeView.vue`:
   - Line 69: `⏳` (`<span v-if="isExporting" class="loading-spinner">⏳</span>`)
   - Line 70: `📄` (`{{ isExporting ? 'Esporta PDF' : '📄 Esporta PDF' }}`)
   - Line 90: `🕒` (`<h3>🕒 Ultimi Soci Visitati</h3>`)
   - Line 110: `⚡` (`<h3>⚡ Attività Recente</h3>`)
   - Line 114: `✨`, `📝`, `🗑️` (`{{ log.type === 'create' ? '✨' : log.type === 'update' ? '📝' : '🗑️' }}`)
   - Line 125: `🔗` (`<h4>🔗 Link Rapidi</h4>`)
   - Line 127: `🔄` (`>🔄 Inserimento Rapido</router-link>`)
   - Line 129: `📊` (`>📊 Report Annuali</router-link>`)
   - Line 143: `📥` (`<button ...>📥 Backup DB</button>`)
   - Line 145: `📊` (`📊 Changelog`)
   - Line 147: `🔧` (`<button ...>🔧 Fix DB Invertito</button>`)
   - Line 148: `🗑️` (`<button ...>🗑️ Reset DB</button>`)
2. In `src/components/DashboardCharts.vue`:
   - Line 19: Plain text arrow `{{ getTrendSymbol(statsTrend.total) }}` where `getTrendSymbol` returns `'↑'`, `'↓'`, `'='`
   - Line 27: Plain text arrow `{{ getTrendSymbol(statsTrend.new) }}`
3. Direct dependencies / child components in `HomeView.vue`:
   - `src/components/SocioCard.vue`: Line 15 (`⚡`), Line 20 (`🎫 Genera Tessera`)
   - `src/components/FilterPanel.vue`: Line 4 (`🔍 Filtri`), Line 12 (`🎂`), Line 30 (`👥`)

---

## 2. Logic Chain

### 2.1 Why the Dual Y-Axis Must Be Eliminated
1. **Observation 1.1.2 & 1.1.3**: The line chart for `Totale Iscritti` (order of magnitude ~400–600) is plotted on axis `y` (left), while the bars for `Nuovi Iscritti` and `Non Rinnovati` (order of magnitude ~10–50) are plotted on axis `y1` (right).
2. **Cognitive Distortion**: Because both scales share the same physical canvas height, a bar with value 45 reaches 75% of the chart height, while a point on the line with value 450 might reach only 70% of the chart height. For senior volunteers (often aged 65+) evaluating membership health, this creates the optical illusion that annual churn or new signups exceeded the total membership.
3. **Artifact Hack**: The author was forced to introduce `firstItem.newMembers = 0` (Observation 1.1.4) precisely to avoid blowing up the `y1` scale.
4. **Resolution**: Removing `y1` entirely and configuring a single primary Y-axis (`scales.y`) eliminates visual confusion. The primary chart displays **Totale Iscritti** with single scale clarity. The annual flow dynamics (`Nuovi Iscritti`, `Non Rinnovati`, and `Saldo Netto`) are elevated into a dedicated, un-ambiguous, permanent specular data table.

### 2.2 Why Hover-Only Tooltips Violate Senior Ergonomics (WCAG 2.2)
1. **Observation 1.2.1**: Hover tooltips require fine motor precision with a mouse pointer. Senior citizens with tremors, reduced dexterity, or using touch-screen tablets cannot reliably hover over thin 2px lines or narrow bars.
2. **Resolution Part A (Direct Canvas Data Labels)**: By implementing a lightweight Chart.js inline plugin (`afterDatasetsDraw`), each data point or bar renders its numeric value directly on top in bold 13–14px high-contrast typography (`#1a1a1a` in light mode, `#e0e0e0` in dark mode).
3. **Resolution Part B (Permanent Specular Data Table)**: By inserting a permanent HTML table immediately below the chart, every figure across all years in the active range is continuously visible. Utilizing `.data-table` and `tabular-nums` from `src/assets/main.css` ensures:
   - Font size ≥ 17px (`1rem` on base `17px` scale).
   - Ergonomic row height of 48–52px.
   - Alternating zebra row striping.
   - Contrast ratio ≥ 4.5:1.

### 2.3 Vector Iconography Standardization via `BaseIcon.vue`
1. **Observation 1.4.1 & 1.4.2**: Over 12 emojis remain in `HomeView.vue`, and unicode text arrows are used in `DashboardCharts.vue`.
2. **BaseIcon Capability**: `src/components/common/BaseIcon.vue` already contains:
   - `loader` (with animated `spin` prop) for `⏳`
   - `file-text` / `doc` / `pdf` for `📄`
   - `clock` / `tempo` for `🕒`
   - `zap` / `fulmine` for `⚡`
   - `sparkles` for `✨`
   - `edit` / `pencil` for `📝`
   - `trash-2` / `elimina` for `🗑️`
   - `link` for `🔗`
   - `refresh-cw` for `🔄`
   - `bar-chart` for `📊`
   - `download` for `📥`
   - `settings` for `🔧`
   - `trending-up` and `trending-down` for `↑` and `↓`
3. **System Cohesion**: Replacing emojis with `<BaseIcon>` unifies the visual language of the Santantoniari portal into the Apple SF Symbols style, fully responsive to dark mode color switching.

---

## 3. Caveats

1. **No Backend or Database Schema Changes**: The changes are strictly confined to presentation components (`DashboardCharts.vue`, `HomeView.vue`). Database services (`db.js`, `getYearlyStats`) remain unmodified and fully preserved.
2. **First Year Data Anomaly**: When viewing "Tutto" (`all`), the first year in history (e.g. year 2000 or year of initial database population) typically has `newMembers === total`. The specular table should accurately reflect the raw data without misleading arithmetic.
3. **Responsive Mobile Wrapping**: On narrow mobile viewports (<600px), a table with 5 columns requires horizontal scrolling (`overflow-x: auto`) or adaptive padding to maintain the 17px font legibility without clipping.
4. **Subcomponents `SocioCard.vue` and `FilterPanel.vue`**: While outside the explicit task scope of `DashboardCharts.vue` and `HomeView.vue`, they contain 5 emojis that can be cleaned up in tandem or in Milestone 5 hardening.

---

## 4. Conclusion & Concrete Architectural Plan

### 4.1 Architecture of `src/components/DashboardCharts.vue`

#### A. Chart Configuration (`vue-chartjs` / `chart.js`)
- **Single Scale**: Remove `y1` completely. Only `scales.y` and `scales.x` remain.
- **Dataset**: Primary single-scale series for `Totale Iscritti` (or `Iscritti Totali`), styled with institutional crimson `#b71c1c` (light theme) / `#ef5350` (dark theme).
- **Inline Labels Plugin**: Add `seniorDataLabelsPlugin` to render values on top of data points:
  ```javascript
  const seniorDataLabelsPlugin = {
    id: 'seniorDataLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart
      ctx.save()
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i)
        if (!meta.hidden) {
          meta.data.forEach((element, index) => {
            const val = dataset.data[index]
            if (val !== undefined && val !== null) {
              const { x, y } = element.tooltipPosition()
              ctx.font = 'bold 13px system-ui, sans-serif'
              ctx.fillStyle = dataset.borderColor || '#1a1a1a'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'bottom'
              ctx.fillText(String(val), x, y - 6)
            }
          })
        }
      })
      ctx.restore()
    }
  }
  ```
- **Scale Options**:
  ```javascript
  scales: {
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      beginAtZero: true,
      ticks: {
        precision: 0,
        font: { family: 'system-ui, sans-serif', size: 14, weight: '600' },
        color: 'var(--color-text-secondary, #5c6266)'
      },
      title: {
        display: true,
        text: 'Totale Soci Iscritti',
        font: { family: 'system-ui, sans-serif', size: 14, weight: 'bold' },
        color: '#b71c1c'
      }
    },
    x: {
      ticks: {
        font: { family: 'system-ui, sans-serif', size: 14, weight: '600' },
        color: 'var(--color-text-secondary, #5c6266)'
      },
      grid: { display: false }
    }
  }
  ```

#### B. Permanent Specular Data Table
- Add a reactive computed property `tableRows` reflecting `displayedData`:
  ```javascript
  const tableRows = computed(() => {
    return displayedData.value.map(r => {
      const saldo = r.newMembers - r.lostMembers
      return {
        anno: r.year,
        iscritti: r.total,
        nuovi: `+${r.newMembers}`,
        cessati: `-${r.lostMembers}`,
        saldo: saldo >= 0 ? `+${saldo}` : `${saldo}`,
        saldoRaw: saldo
      }
    })
  })
  ```
- Template markup below `<div class="chart-wrapper">`:
  ```html
  <!-- Permanent Specular High-Contrast Data Table (WCAG 2.2 Senior Ergonomics) -->
  <div class="specular-table-container">
    <div class="specular-table-header">
      <h4>
        <BaseIcon name="file-spreadsheet" :size="20" color="accent" />
        Dati Dettagliati per Anno
      </h4>
      <span class="table-subtitle">Valori effettivi leggibili senza interazione</span>
    </div>

    <div class="table-responsive">
      <table class="data-table tabular-nums specular-table" aria-label="Tabella dettagliata andamento soci">
        <thead>
          <tr>
            <th scope="col" style="text-align: left;">Anno</th>
            <th scope="col" class="text-right">Totale Iscritti</th>
            <th scope="col" class="text-right">Nuovi Iscritti</th>
            <th scope="col" class="text-right">Non Rinnovati</th>
            <th scope="col" class="text-right">Saldo Netto</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableRows" :key="row.anno">
            <td class="year-cell">
              <strong>{{ row.anno }}</strong>
            </td>
            <td class="text-right total-cell font-bold">
              {{ row.iscritti }}
            </td>
            <td class="text-right new-cell text-success font-semibold">
              {{ row.nuovi }}
            </td>
            <td class="text-right lost-cell text-muted font-semibold">
              {{ row.cessati }}
            </td>
            <td 
              class="text-right saldo-cell font-bold"
              :class="row.saldoRaw >= 0 ? 'text-success' : 'text-danger'"
            >
              {{ row.saldo }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  ```
- Styles in `DashboardCharts.vue`:
  ```css
  .specular-table-container {
    margin-top: 2.5rem;
    border-top: 2px solid var(--color-border);
    padding-top: 1.5rem;
  }
  .specular-table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  .specular-table-header h4 {
    margin: 0;
    font-size: 1.15rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-primary);
  }
  .table-subtitle {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }
  .table-responsive {
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }
  .specular-table {
    font-size: 1.05rem; /* >= 17px */
    width: 100%;
  }
  .specular-table tbody tr {
    min-height: 50px;
    height: 52px;
  }
  .text-success { color: var(--color-success, #2e7d32); }
  .text-danger { color: var(--color-accent, #b71c1c); }
  .text-muted { color: var(--color-text-secondary, #5c6266); }
  ```

### 4.2 Migration Plan for Emojis in `HomeView.vue`
Import `BaseIcon`:
```javascript
import BaseIcon from '@/components/common/BaseIcon.vue'
```
Substitutions:
1. **Line 69**:
   ```html
   <BaseIcon v-if="isExporting" name="loader" spin :size="18" class="loading-spinner" />
   ```
2. **Line 70**:
   ```html
   <button @click="exportSociToPdf" :disabled="isExporting" class="pdf-export-button">
     <BaseIcon v-if="isExporting" name="loader" spin :size="18" />
     <BaseIcon v-else name="file-text" :size="18" />
     <span>{{ isExporting ? 'Esporta PDF' : 'Esporta PDF' }}</span>
   </button>
   ```
3. **Line 90**:
   ```html
   <h3><BaseIcon name="clock" :size="20" /> Ultimi Soci Visitati</h3>
   ```
4. **Line 110**:
   ```html
   <h3><BaseIcon name="zap" :size="20" color="gold" /> Attività Recente</h3>
   ```
5. **Line 114**:
   ```html
   <div class="activity-icon" :class="log.type">
     <BaseIcon v-if="log.type === 'create'" name="sparkles" :size="18" color="success" />
     <BaseIcon v-else-if="log.type === 'update'" name="edit" :size="18" color="info" />
     <BaseIcon v-else name="trash-2" :size="18" color="accent" />
   </div>
   ```
6. **Line 125**:
   ```html
   <h4><BaseIcon name="link" :size="18" /> Link Rapidi</h4>
   ```
7. **Line 127**:
   ```html
   <router-link to="/registrazione-seriale" class="q-link">
     <BaseIcon name="refresh-cw" :size="16" /> Inserimento Rapido
   </router-link>
   ```
8. **Line 129**:
   ```html
   <router-link to="/reports" class="q-link">
     <BaseIcon name="bar-chart" :size="16" /> Report Annuali
   </router-link>
   ```
9. **Lines 143–148**:
   ```html
   <footer class="dashboard-footer">
     <div class="footer-actions">
       <button @click="exportDatabase" class="utility-button secondary">
         <BaseIcon name="download" :size="16" /> Backup DB
       </button>
       <button @click="exportChangeLogData" class="utility-button secondary">
         <BaseIcon name="bar-chart" :size="16" /> Changelog
       </button>
       <button @click="runNormalization" class="utility-button warning" title="Sistema i blocchetti storici invertiti">
         <BaseIcon name="settings" :size="16" /> Fix DB Invertito
       </button>
       <button @click="clearDatabase" class="utility-button danger">
         <BaseIcon name="trash-2" :size="16" color="accent" /> Reset DB
       </button>
     </div>
     <p class="footer-note">Sistema Gestionale Ceraiolo Digitale - v1.0</p>
   </footer>
   ```

---

## 5. Verification Method

### 5.1 Automated Unit & Integration Tests
Execute the Vitest suite:
```powershell
npx vitest run
```
Target assertions:
1. `src/__tests__/tier1_feature_coverage.spec.js` lines 572–598 (Feature 21: Single-scale dashboard chart series) passes without error.
2. `src/__tests__/tier1_feature_coverage.spec.js` lines 600–629 (Feature 22: High-contrast specular data table) passes without error.
3. All existing 216 test assertions pass without regression.

### 5.2 Dedicated M4 Test Suite (`senior_data_visualization_m4.spec.js`)
Recommend creating a dedicated test suite verifying:
1. `DashboardCharts.vue` mounts with zero `y1` axis definition in `chartOptions.scales`.
2. `chartData.datasets` contains exactly the single-scale `Totale Iscritti` series.
3. The component renders `.specular-table` with rows equal to the selected time range count (`5` for `'5y'`, `10` for `'10y'`).
4. Every table row renders `anno`, `iscritti`, `nuovi` (with `+`), `cessati` (with `-`), and `saldo` (with signed prefix).
5. No unicode emojis exist in rendered `HomeView.vue` or `DashboardCharts.vue` HTML output.

### 5.3 Invalidation Conditions
- Any occurrence of `y1` or secondary linear scales in `chartOptions`.
- Any requirement for user hover interaction to reveal fundamental counts.
- Table font-size dropping below 17px or table row height below 48px.
- Inability of `tableRows` to update reactively when range buttons (`5 Anni`, `10 Anni`, `Tutto`) are clicked.
