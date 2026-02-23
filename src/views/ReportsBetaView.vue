<template>
  <div class="reports-view">
    <div class="container reports-layout">
      <!-- Sidebar Nav for consistency -->
      <aside class="reports-sidebar">
        <h1 class="sidebar-title">📊 Report</h1>
        <nav class="reports-nav">
          <!-- Link to normal reports page -->
          <router-link to="/reports" class="nav-item" style="text-decoration: none; color: inherit; display: block; margin-bottom: 15px;">
            ⬅️ Torna a Reports Standard
          </router-link>
          <button class="nav-item active" style="width: 100%;">
             🛠️ Report Beta
          </button>
        </nav>
      </aside>

      <main class="reports-content" style="flex: 1;">
        <!-- UI Notification per Business Rules -->
        <div class="report-section" style="background-color: #fff3cd; border-color: #ffeeba; margin-bottom: 2rem;">
          <h4 style="color: #856404; margin-bottom: 5px;">⚠️ BETA VERSION</h4>
          <p style="color: #856404; font-size: 0.95rem;">Use for testing layout and data structure. For official documents, use the standard Reports tab.</p>
        </div>

        <section class="report-section header-section">
          <div class="header-row">
            <h2>🛠️ Report Builder Personalizzato</h2>
          </div>
        </section>

        <!-- Summary Badge / Natural Language Display -->
        <section class="report-section" style="background: var(--color-background); border-left: 4px solid var(--color-primary); padding: 15px; margin-bottom: 2rem;">
          <h4 style="margin-top: 0; color: var(--color-text-primary);">Riassunto Filtri Attivi:</h4>
          <p style="margin-bottom: 0; font-style: italic; color: var(--color-text-secondary); line-height: 1.5;">
            {{ activeFiltersSummary }}
          </p>
        </section>

        <!-- Presets section -->
        <section class="report-section" style="margin-bottom: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0;">💾 Preset di Ricerca Salvati</h3>
            <button @click="savePreset" class="action-button" style="width: auto; padding: 0.5rem 1rem; font-size: 0.9rem; background-color: var(--color-success);">
              + Salva Nuova Vista
            </button>
          </div>
          <div v-if="savedPresets.length > 0" style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
             <div v-for="(preset, index) in savedPresets" :key="index" style="background: var(--color-background); border: 1px solid var(--color-border); padding: 8px 12px; border-radius: 6px; display: flex; align-items: center; gap: 10px;box-shadow: var(--shadow-sm);">
                <span style="font-weight: 500; cursor: pointer; color: var(--color-primary);" @click="loadPreset(preset)" title="Clicca per applicare questo preset">{{ preset.name }}</span>
                <div style="border-left: 1px solid var(--color-border); height: 15px; margin: 0 5px;"></div>
                <button @click="deletePreset(index)" style="background: none; border: none; color: var(--color-error); cursor: pointer; font-size: 1rem; padding: 0;" title="Elimina Preset">🗑️</button>
             </div>
          </div>
          <div v-else style="margin-top: 15px; color: var(--color-text-secondary); font-size: 0.9rem;">
            Nessun preset salvato. Configura i filtri e clicca il tasto qui sopra per memorizzare la vista e riutilizzarla in futuro!
          </div>
        </section>

        <!-- Filters section -->
        <section class="report-section">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0;">Filtri Generali</h3>
            <button @click="resetFilters" class="action-button" style="width: auto; padding: 0.5rem 1rem; font-size: 0.9rem; background-color: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text-primary);">
              🔄 Ripristina Filtri
            </button>
          </div>
          <div class="filters-inline">
            <label class="checkbox-label">
              <input type="checkbox" v-model="reportState.filters.onlyActiveMembers" />
              <span class="checkmark"></span>
              Solo Soci Attivi (almeno 1 pagamento negli ultimi 5 anni)
            </label>
          </div>

          <div class="filters-inline" style="margin-top: 15px;">
            <div class="f-group" style="margin-right: 20px;">
              <label>Filtro Fascia d'Età:</label>
              <select v-model="reportState.filters.ageGroup" class="small-input" style="width: auto;">
                <option value="all">Tutti</option>
                <option value="maggiorenni">Solo Maggiorenni (18+)</option>
                <option value="minorenni">Solo Minorenni (&lt; 18)</option>
              </select>
            </div>
            <div class="f-group">
              <label>Stato Pagamento (Anno in corso):</label>
              <select v-model="reportState.filters.paymentStatus" class="small-input" style="width: auto;">
                <option value="all">Tutti i Soci</option>
                <option value="in_regola">In Regola (Ha pagato il {{ currentYear }})</option>
                <option value="morosi">Morosi (NON ha pagato il {{ currentYear }})</option>
              </select>
            </div>
          </div>

          <hr style="border: 0; border-top: 1px solid var(--color-border); margin: 15px 0;" />

          <h4>Filtri per Manicchia</h4>
          <div class="filters-inline">
            <label v-for="group in availableGroups" :key="'filter-group-'+group" class="checkbox-label">
              <input type="checkbox" :value="group" v-model="reportState.filters.groups" />
              <span class="checkmark"></span>
              {{ group }}
            </label>
          </div>
          <div v-if="reportState.filters.groups.length === 0" style="color: var(--color-text-secondary); font-size: 0.9rem; margin-top: -10px; margin-bottom: 15px;">
            Nessuna manicchia selezionata = Mostra Tutti
          </div>

          <hr style="border: 0; border-top: 1px solid var(--color-border); margin: 15px 0;" />

          <h4>Filtri per Anni di Pagamento</h4>
          <div class="filters-inline">
            <label v-for="year in availableYears" :key="'filter-'+year" class="checkbox-label">
              <input type="checkbox" :value="year" v-model="reportState.filters.paymentYears.list" />
              <span class="checkmark"></span>
              {{ year }}
            </label>
          </div>

          <div v-if="reportState.filters.paymentYears.list.length > 0" class="filters-inline" style="margin-top: 15px; background: var(--color-background); padding: 10px; border-radius: 6px; border: 1px solid var(--color-border);">
              <label class="radio-label" style="margin-right: 20px;" title="Scegliendo AND, mostri SOLO i soci che hanno pagato in ENTRAMBI gli anni selezionati">
                <input type="radio" value="AND" v-model="reportState.filters.paymentYears.logic" />
                <span class="radiomark"></span>
                And (ha pagato <strong>tutti</strong> gli anni selezionati)
                <span style="font-size: 0.8rem; color: var(--color-primary); margin-left: 5px; cursor: help;" title="Scegliendo AND, mostri SOLO i soci che hanno pagato tutti gli anni spuntati">ℹ️</span>
              </label>
              <label class="radio-label" title="Scegliendo OR, mostri QUALSIASI socio che ha pagato ANCHE IN UNO SOLO degli anni scelti">
                <input type="radio" value="OR" v-model="reportState.filters.paymentYears.logic" />
                <span class="radiomark"></span>
                Or (ha pagato <strong>almeno uno</strong> degli anni)
                <span style="font-size: 0.8rem; color: var(--color-primary); margin-left: 5px; cursor: help;" title="Scegliendo OR, mostri i soci che hanno pagato in almeno uno degli anni spuntati">ℹ️</span>
              </label>
            </div>
        </section>

        <!-- Columns section -->
        <section class="report-section">
          <h3>Colonne da Mostrare nel PDF</h3>
          <p style="font-size: 0.9rem; color: var(--color-text-secondary); margin-bottom: 20px;">
            Componi liberamente la tabella che verrà esportata nel documento PDF selezionando i campi qui sotto.
          </p>

          <div style="margin-bottom: 25px;">
            <h4>Dati Base:</h4>
            <div class="filters-inline">
              <label class="checkbox-label">
                <input type="checkbox" value="cognomeNome" v-model="reportState.display.baseColumns" />
                <span class="checkmark"></span>
                Socio
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="gruppo" v-model="reportState.display.baseColumns" />
                <span class="checkmark"></span>
                Manicchia
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="dataNascita" v-model="reportState.display.baseColumns" />
                <span class="checkmark"></span>
                Data Nascita
              </label>
              <label class="checkbox-label" title="Mostra se il socio è Maggiorenne o Minorenne">
                <input type="checkbox" value="eta" v-model="reportState.display.baseColumns" />
                <span class="checkmark"></span>
                Età (Mag/Min)
              </label>
              <label class="checkbox-label" title="Aggiunge una colonna vuota in cui gli utenti possono apporre una firma manuale">
                <input type="checkbox" value="firma" v-model="reportState.display.baseColumns" />
                <span class="checkmark"></span>
                Firma (Spazio Vuoto)
              </label>
            </div>

            <div v-if="reportState.display.baseColumns.length > 1" style="margin-top: 15px; padding: 10px; background: var(--color-background); border-radius: 6px; border: 1px dashed var(--color-border);">
              <h5 style="margin-top: 0; margin-bottom: 10px; color: var(--color-text-secondary); font-size: 0.85rem;">Ordina Colonne Base (come appariranno da sinistra a destra):</h5>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <div v-for="(col, index) in reportState.display.baseColumns" :key="col" style="background: white; border: 1px solid var(--color-border); padding: 4px 8px; border-radius: 4px; display: flex; align-items: center; gap: 5px; font-size: 0.9rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                  <button @click="moveColumn(index, -1)" :disabled="index === 0" style="background: none; border: none; cursor: pointer; padding: 0 4px; color: var(--color-primary);" :style="{ opacity: index === 0 ? '0.3' : '1' }" title="Sposta a sinistra">◀</button>
                  <span style="font-weight: 500;">{{ colName(col) }}</span>
                  <button @click="moveColumn(index, 1)" :disabled="index === reportState.display.baseColumns.length - 1" style="background: none; border: none; cursor: pointer; padding: 0 4px; color: var(--color-primary);" :style="{ opacity: index === reportState.display.baseColumns.length - 1 ? '0.3' : '1' }" title="Sposta a destra">▶</button>
                </div>
              </div>
            </div>

          </div>

          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <h4 style="margin: 0;">Colonne Anni di Pagamento (V/X):</h4>
              <div style="display: flex; gap: 10px;">
                <button @click="selectAllYearColumns" style="background: none; border: none; color: var(--color-primary); cursor: pointer; font-size: 0.85rem; font-weight: bold;">[ Seleziona Tutti ]</button>
                <button @click="deselectAllYearColumns" style="background: none; border: none; color: var(--color-text-secondary); cursor: pointer; font-size: 0.85rem;">[ Deseleziona ]</button>
              </div>
            </div>

            <div class="filters-inline">
              <label v-for="year in availableYears" :key="'col-'+year" class="checkbox-label">
                <input type="checkbox" :value="year" v-model="reportState.display.yearColumns" />
                <span class="checkmark"></span>
                {{ year }}
              </label>
            </div>
          </div>
        </section>

        <!-- Sorting section -->
        <section class="report-section">
          <h3>Ordinamento Risultati</h3>
          <div class="filters-inline">
            <label style="font-weight: 600; color: var(--color-text-secondary);">Ordina per:</label>
            <select v-model="reportState.sort.by" class="small-input" style="width: auto;">
              <option value="cognome">Cognome</option>
              <option value="gruppo">Manicchia</option>
              <option value="anno_nascita">Anno di Nascita</option>
            </select>
            <label class="checkbox-label">
              <input type="checkbox" v-model="reportState.sort.descending" />
              <span class="checkmark"></span>
              Ordine Decrescente
            </label>
          </div>
        </section>

        <!-- Action & Data Preview -->
        <section class="report-section">
          <button @click="handleExport" class="action-button wide" style="margin-bottom: 2rem; font-size: 1.1rem; padding: 1rem;" :disabled="loading">
            {{ loading ? '⏳ Generazione PDF in corso...' : '📄 Genera PDF Dinamico' }}
          </button>

          <div v-if="processedData.length > 0">
            <h4>Anteprima Dati Filtrati (Totale: {{ processedData.length }})</h4>
            <div class="audit-preview" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: 8px;">
              <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 0.9rem;">
                <thead style="position: sticky; top: 0; background: var(--color-surface); z-index: 1;">
                  <tr>
                    <th v-if="reportState.display.baseColumns.includes('cognomeNome')" style="padding: 12px; border-bottom: 2px solid var(--color-border); color: var(--color-text-secondary);">Socio</th>
                    <th v-if="reportState.display.baseColumns.includes('gruppo')" style="padding: 12px; border-bottom: 2px solid var(--color-border); color: var(--color-text-secondary);">Manicchia</th>
                    <th v-if="reportState.display.baseColumns.includes('dataNascita')" style="padding: 12px; border-bottom: 2px solid var(--color-border); color: var(--color-text-secondary);">Nascita</th>
                    <th v-for="year in sortedYearColumns" :key="'th-'+year" style="padding: 12px; text-align: center; border-bottom: 2px solid var(--color-border); color: var(--color-text-secondary);">{{ year }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(member, index) in processedData.slice(0, 30)" :key="member.id" :style="{ backgroundColor: index % 2 === 0 ? 'var(--color-surface-variant, #f8f9fa)' : 'transparent' }">
                    <td v-if="reportState.display.baseColumns.includes('cognomeNome')" style="padding: 12px; border-bottom: 1px solid var(--color-border);">{{ member.cognome }} {{ member.nome }}</td>
                    <td v-if="reportState.display.baseColumns.includes('gruppo')" style="padding: 12px; border-bottom: 1px solid var(--color-border);">{{ member.gruppo_appartenenza || '-' }}</td>
                    <td v-if="reportState.display.baseColumns.includes('dataNascita')" style="padding: 12px; border-bottom: 1px solid var(--color-border);">{{ formatDate(member.data_nascita) }}</td>
                    <td v-for="year in sortedYearColumns" :key="'td-'+year" style="padding: 12px; text-align: center; font-weight: bold; border-bottom: 1px solid var(--color-border);" :style="{ color: hasPaidYear(member, year) ? 'var(--color-success)' : 'var(--color-error)' }">
                      {{ hasPaidYear(member, year) ? 'V' : 'X' }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="processedData.length > 30" style="padding: 15px; color: var(--color-text-secondary); text-align: center; background: var(--color-background); font-weight: 500;">
                ... e altri {{ processedData.length - 30 }} membri ...
              </div>
            </div>
          </div>
          <div v-else style="padding: 2rem; background: var(--color-background); border-radius: 8px; border: 1px dashed var(--color-border); text-align: center; color: var(--color-text-secondary);">
            Nessun membro corrisponde ai criteri selezionati.
          </div>
        </section>
      </main>

      <!-- Loading Overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p>Generazione PDF in corso...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { getAllSociWithTesseramenti, getUniqueGroups } from '@/services/db';
import { generateBetaDynamicPDF } from '@/services/exportBeta';

const toast = useToast();
const loading = ref(false);
const allMembers = ref([]);
const availableGroups = ref([]);
const savedPresets = ref([]);

const currentYear = new Date().getFullYear();
const statutoryMinYear = currentYear - 5;

// Generate available years for UI constraints
const availableYears = computed(() => {
  const years = [];
  for (let y = currentYear; y >= statutoryMinYear; y--) {
    years.push(y);
  }
  return years;
});

const reportState = ref({
  filters: {
    onlyActiveMembers: false,
    groups: [],
    ageGroup: 'all',
    paymentStatus: 'all',
    paymentYears: {
      list: [],
      logic: 'AND'
    }
  },
  display: {
    baseColumns: ['cognomeNome', 'gruppo', 'dataNascita'],
    yearColumns: [],
  },
  sort: {
    by: 'cognome',
    descending: false
  }
});

const hasPaidYear = (member, year) => {
  const paidYears = member.tesseramenti?.map(t => t.anno) || [];
  return paidYears.includes(year);
};

const resetFilters = () => {
  reportState.value.filters = {
    onlyActiveMembers: false,
    groups: [],
    ageGroup: 'all',
    paymentStatus: 'all',
    paymentYears: {
      list: [],
      logic: 'AND'
    }
  };
};

const selectAllYearColumns = () => {
  reportState.value.display.yearColumns = [...availableYears.value];
};

const deselectAllYearColumns = () => {
  reportState.value.display.yearColumns = [];
};

const moveColumn = (index, direction) => {
  const newIndex = index + direction;
  if (newIndex >= 0 && newIndex < reportState.value.display.baseColumns.length) {
    const arr = [...reportState.value.display.baseColumns];
    const temp = arr[index];
    arr[index] = arr[newIndex];
    arr[newIndex] = temp;
    reportState.value.display.baseColumns = arr;
  }
};

const colName = (val) => {
  if (val === 'cognomeNome') return 'Socio';
  if (val === 'gruppo') return 'Manicchia';
  if (val === 'dataNascita') return 'Data Nascita';
  return val;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  } catch {
    return dateString;
  }
};

// Preset Management
const savePreset = () => {
    const name = prompt('Scegli un nome per salvare l\'attuale configurazione (es: "Lista votanti 2024"):');
    if (name && name.trim()) {
        savedPresets.value.push({ name: name.trim(), state: JSON.parse(JSON.stringify(reportState.value)) });
        localStorage.setItem('reports_beta_presets', JSON.stringify(savedPresets.value));
        toast.success(`Preset "${name}" salvato!`);
    }
};

const loadPreset = (preset) => {
    reportState.value = JSON.parse(JSON.stringify(preset.state));
    toast.success(`Preset "${preset.name}" caricato con successo!`);
};

const deletePreset = (index) => {
    if(confirm('Vuoi davvero cancellare definitivamente questo preset?')) {
        savedPresets.value.splice(index, 1);
        localStorage.setItem('reports_beta_presets', JSON.stringify(savedPresets.value));
    }
};

onMounted(async () => {
  try {
    const stored = localStorage.getItem('reports_beta_presets');
    if (stored) savedPresets.value = JSON.parse(stored);

    loading.value = true;
    allMembers.value = await getAllSociWithTesseramenti();
    availableGroups.value = await getUniqueGroups();
  } catch (error) {
    console.error('Failed to fetch members or groups:', error);
    toast.error('Errore nel caricamento dei dati.');
  } finally {
    loading.value = false;
  }
});

const activeFiltersSummary = computed(() => {
  let summary = 'Stai visualizzando ';

  // Age
  if (reportState.value.filters.ageGroup === 'maggiorenni') summary += 'i soci maggiorenni ';
  else if (reportState.value.filters.ageGroup === 'minorenni') summary += 'i soci minorenni ';
  else summary += 'i soci ';

  // Active
  if (reportState.value.filters.onlyActiveMembers) summary += "attivi (con almeno 1 pagamento begli ultimi 5 anni) ";

  // Payment Status
  if (reportState.value.filters.paymentStatus === 'in_regola') summary += `in regola con il ${currentYear} `;
  else if (reportState.value.filters.paymentStatus === 'morosi') summary += `morosi per il ${currentYear} `;

  // Groups
  if (reportState.value.filters.groups.length > 0) {
    summary += `appartenenti alle manicchie: [${reportState.value.filters.groups.join(', ')}] `;
  } else {
    summary += `di tutte le manicchie `;
  }

  // Payment Years
  if (reportState.value.filters.paymentYears.list.length > 0) {
    const years = [...reportState.value.filters.paymentYears.list].sort((a,b)=>b-a).join(', ');
    const logicStr = reportState.value.filters.paymentYears.logic === 'AND' ? 'in tutti gli anni elencati' : 'in almeno uno di questi anni';
    summary += `che hanno registrato pagamenti ${logicStr}: (${years}) `;
  }

  // Sort
  const sortMap = { 'cognome': 'Cognome', 'gruppo': 'Manicchia', 'anno_nascita': 'Anno di Nascita' };
  const sortDir = reportState.value.sort.descending ? 'decrescente' : 'crescente';
  summary += `- Ordinati per ${sortMap[reportState.value.sort.by]} (${sortDir}).`;

  return summary.charAt(0).toUpperCase() + summary.slice(1);
});

const sortedYearColumns = computed(() => {
  return [...reportState.value.display.yearColumns].sort((a, b) => a - b);
});

const processedData = computed(() => {
  let result = [...allMembers.value];

  // Active Members Filter
  if (reportState.value.filters.onlyActiveMembers) {
    result = result.filter(member => {
      const paidYears = member.tesseramenti?.map(t => t.anno) || [];
      return paidYears.some(year => year >= statutoryMinYear);
    });
  }

  // Age Filter
  if (reportState.value.filters.ageGroup !== 'all') {
    const today = new Date();
    result = result.filter(member => {
      if (!member.data_nascita) return false;
      const birthDate = new Date(member.data_nascita);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (reportState.value.filters.ageGroup === 'maggiorenni') return age >= 18;
      if (reportState.value.filters.ageGroup === 'minorenni') return age < 18;
      return true;
    });
  }

  // Global Payment Status Filter
  if (reportState.value.filters.paymentStatus !== 'all') {
    result = result.filter(member => {
      const paidYears = member.tesseramenti?.map(t => t.anno) || [];
      const hasCurrentYear = paidYears.includes(currentYear);
      if (reportState.value.filters.paymentStatus === 'in_regola') return hasCurrentYear;
      if (reportState.value.filters.paymentStatus === 'morosi') return !hasCurrentYear;
      return true;
    });
  }

  // Groups Filter (If empty array, show all groups)
  if (reportState.value.filters.groups.length > 0) {
    result = result.filter(member => {
      // Handles unassigned members or specific group matches
      return reportState.value.filters.groups.includes(member.gruppo_appartenenza || 'Nessuna Manicchia');
    });
  }

  // Specific Years Filter (AND/OR)
  if (reportState.value.filters.paymentYears.list.length > 0) {
    const { list, logic } = reportState.value.filters.paymentYears;
    result = result.filter(member => {
      const paidYears = member.tesseramenti?.map(t => t.anno) || [];
      if (logic === 'AND') {
        return list.every(reqYear => paidYears.includes(reqYear));
      } else {
        return list.some(reqYear => paidYears.includes(reqYear));
      }
    });
  }

  // Sorting Logic
  result.sort((a, b) => {
    let comparison = 0;
    if (reportState.value.sort.by === 'cognome') {
      comparison = (a.cognome || '').localeCompare(b.cognome || '');
    } else if (reportState.value.sort.by === 'gruppo') {
      comparison = (a.gruppo_appartenenza || '').localeCompare(b.gruppo_appartenenza || '');
      if (comparison === 0) comparison = (a.cognome || '').localeCompare(b.cognome || '');
    } else if (reportState.value.sort.by === 'anno_nascita') {
      const yearA = a.data_nascita ? parseInt(a.data_nascita.split('-')[0]) : 9999;
      const yearB = b.data_nascita ? parseInt(b.data_nascita.split('-')[0]) : 9999;
      comparison = yearA - yearB;
      if (comparison === 0) comparison = (a.cognome || '').localeCompare(b.cognome || '');
    }
    return reportState.value.sort.descending ? -comparison : comparison;
  });

  return result;
});

const handleExport = async () => {
  if (processedData.value.length === 0) {
    toast.warning('Nessun dato da esportare.');
    return;
  }
  if (reportState.value.display.baseColumns.length === 0 && reportState.value.display.yearColumns.length === 0) {
    toast.warning('Seleziona almeno una colonna da mostrare nel PDF.');
    return;
  }

  try {
    loading.value = true;
    await generateBetaDynamicPDF(processedData.value, reportState.value, activeFiltersSummary.value);
    toast.success('PDF generato con successo!');
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Errore nella generazione del PDF: ' + error.message);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.reports-view {
  min-height: 100vh;
  background-color: var(--color-background);
  padding: 2rem 0;
}

.reports-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  min-height: calc(100vh - 100px);
}

.reports-sidebar {
  padding-right: 1.5rem;
  border-right: 1px solid var(--color-border);
}

.reports-sidebar .sidebar-title {
  font-size: 1.1rem;
  color: var(--color-primary);
  margin-bottom: 2rem;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reports-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  text-align: left;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.nav-item:hover {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
}

.nav-item.active {
  background-color: var(--color-accent);
  color: white;
}

.reports-content {
  padding-bottom: 3rem;
}

/* Sections */
.report-section {
  background-color: var(--color-surface);
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.header-section {
  background: var(--color-surface);
  margin-bottom: 2rem;
  border-left: 5px solid var(--color-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-row h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-primary);
}

.report-section h3, .report-section h4 {
  margin-top: 0;
  color: var(--color-primary);
}

/* Grid for Cards */
.reports-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.report-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.report-card h3 {
  margin-top: 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.report-card p {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  min-height: 40px;
}

/* Inputs & Buttons */
.year-selector-inline {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.year-input {
  padding: 0.5rem;
  width: 100px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-weight: bold;
}

.action-button {
  background-color: var(--color-accent);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
}

.action-button:hover:not(:disabled) {
  background-color: #a22a2a;
  transform: translateY(-1px);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-button.wide {
  width: auto;
  min-width: 200px;
}

.primary-button {
  background-color: var(--color-accent);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: block;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}

.primary-button:hover {
  background-color: #a22a2a;
  transform: translateY(-1px);
}

/* Preview Area */
.preview-wrapper {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.preview-container {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  justify-content: center;
  border: 1px solid var(--color-border);
}

.preview-inputs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.small-input {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  width: 100%;
}

/* Filters */
.filters-inline {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filters-grid-compact {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.f-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.f-group label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 600;
}

/* Progress Bar Mini */
.progress-bar-mini {
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  margin: 1rem 0;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: var(--color-success);
  transition: width 0.3s;
}

/* Batch Box */
.batch-box {
  background: var(--color-background);
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
}

.batch-box ul {
  list-style: none;
  padding: 0;
  margin-bottom: 2rem;
  text-align: center;
}

.batch-box li {
  display: inline-block;
  background: var(--color-surface);
  padding: 0.3rem 0.8rem;
  margin: 0.3rem;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  font-size: 0.9rem;
}

.primary-button.large {
  font-size: 1.1rem;
  padding: 1rem 3rem;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: white;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s infinite linear;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}
.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  background: var(--color-background);
  display: inline-block;
  border-radius: 3px;
}
input[type="checkbox"] {
  display: none;
}
input:checked + .checkmark {
  background: var(--color-success);
  border-color: var(--color-success);
  position: relative;
}
input:checked + .checkmark::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Radio Button styling for consistency */
.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}
.radiomark {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  background: var(--color-background);
  display: inline-block;
  border-radius: 50%;
}
input[type="radio"] {
  display: none;
}
input[type="radio"]:checked + .radiomark {
  background: var(--color-success);
  border-color: var(--color-success);
  position: relative;
}
input[type="radio"]:checked + .radiomark::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
}

/* Responsive */
@media (max-width: 900px) {
  .reports-layout {
    grid-template-columns: 1fr;
  }

  .reports-sidebar {
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 1rem;
  }
  .reports-nav {
    flex-direction: row;
    overflow-x: auto;
  }
  .reports-grid,
  .filters-grid-compact {
    grid-template-columns: 1fr;
  }
  .preview-wrapper {
    flex-direction: column;
  }
  .preview-container {
    transform: scale(1);
    width: 100%;
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}
</style>
