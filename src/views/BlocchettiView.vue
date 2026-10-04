<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import {
  db,
  getAllBlocchetti,
  addBlocchetto,
  returnBlocchetto,
  deleteBlocchetto,
  exportAllTesseramenti
} from '@/services/db'
import BaseIcon from '@/components/common/BaseIcon.vue'

// Stato DB
const blocchettiDB = ref([])
const allPayments = ref([])
const allSoci = ref([])

// Form Add
const showAddForm = ref(false)
const newBlocchetto = ref({
  numero_blocchetto: null,
  assegnato_a: '',
  data_assegnazione: new Date().toISOString().split('T')[0]
})

// Search
const searchQuery = ref('')
const expandedRowId = ref(null)

onMounted(async () => {
  await loadData()
})

async function loadData() {
  blocchettiDB.value = await getAllBlocchetti()
  allPayments.value = await exportAllTesseramenti()
  allSoci.value = await db.soci.toArray()
}

// ---- LOGICA DINAMICA BLOCCHETTI ----

const blocchettiDinamici = computed(() => {
   const map = new Map()

   allPayments.value.forEach(p => {
       // Leggiamo ESATTAMENTE quello che c'è nel Database, ora che abbiamo un Fixer.
       // numero_blocchetto = N° del Blocchetto fisico (il libretto)
       // numero_ricevuta  = N° della singola Ricevuta staccata in quel libretto
       const bNum = Number(p.numero_blocchetto) || 0
       const rNum = Number(p.numero_ricevuta) || 0

       if (bNum <= 0) return;

       if (!map.has(bNum)) {
           map.set(bNum, {
               numero_blocchetto: bNum,
               ricevuteMap: new Map(),
               countPagamenti: 0,
               totaleIncassato: 0,
               assegnato_a: 'Gestito dallo Storico',
               data_assegnazione: null,
               data_restituzione: null,
               isReal: false
           })
       }

       const blocco = map.get(bNum)
       blocco.countPagamenti++
       blocco.totaleIncassato += (Number(p.quota_pagata) || 0)

       if (rNum > 0) {
           if (!blocco.ricevuteMap.has(rNum)) {
               blocco.ricevuteMap.set(rNum, [])
           }
           const socio = allSoci.value.find(s => s.id === p.id_socio)
           const nomeSocio = socio ? `${socio.cognome} ${socio.nome}` : 'Socio Eliminato'

           blocco.ricevuteMap.get(rNum).push({
               ...p,
               socioNome: nomeSocio
           })
       }
   })

   // 2. Uniamo/Sovrascriviamo con i Blocchetti inseriti manualmente (se esistono)
   blocchettiDB.value.forEach(bDB => {
       const bNum = bDB.numero_blocchetto;
       if (!map.has(bNum)) {
           map.set(bNum, {
               numero_blocchetto: bNum,
               ricevuteMap: new Map(),
               countPagamenti: 0,
               totaleIncassato: 0,
               assegnato_a: bDB.assegnato_a,
               data_assegnazione: bDB.data_assegnazione,
               data_restituzione: bDB.data_restituzione,
               isReal: true,
               id: bDB.id
           })
       } else {
           const existing = map.get(bNum)
           existing.assegnato_a = bDB.assegnato_a
           existing.data_assegnazione = bDB.data_assegnazione
           existing.data_restituzione = bDB.data_restituzione
           existing.isReal = true
           existing.id = bDB.id
       }
   })

   // Trasformiamo e Ordiniamo
   const sorted = Array.from(map.values()).sort((a,b) => a.numero_blocchetto - b.numero_blocchetto)

   sorted.forEach(b => {
       const arr = []
       for (const [rNum, payments] of b.ricevuteMap.entries()) {
           arr.push({
               numero_ricevuta: rNum,
               payments: payments.sort((p1, p2) => p1.anno - p2.anno)
           })
       }
       b.ricevuteList = arr.sort((a,b) => a.numero_ricevuta - b.numero_ricevuta)
   })

   return sorted
})

// Filtro attivo e paginazione
const activeFilter = ref('tutti') // 'tutti' | 'attivi' | 'restituiti' | 'registrati'
const currentPage = ref(1)
const itemsPerPage = ref(50)

const filteredBlocchetti = computed(() => {
    // Mostra tutti i blocchetti dinamici (inclusi quelli dallo storico pagamenti)
    let baseList = blocchettiDinamici.value

    if (activeFilter.value === 'attivi') {
        baseList = baseList.filter(b => !b.data_restituzione)
    } else if (activeFilter.value === 'restituiti') {
        baseList = baseList.filter(b => !!b.data_restituzione)
    } else if (activeFilter.value === 'registrati') {
        baseList = baseList.filter(b => b.isReal)
    }

    if (!searchQuery.value) return baseList

    const q = searchQuery.value.toLowerCase().trim()
    return baseList.filter(b => {
        if (b.numero_blocchetto.toString() === q) return true;
        if (b.assegnato_a && b.assegnato_a.toLowerCase().includes(q)) return true;

        // Cerca anche all'interno delle ricevute incassate e soci
        const hasRicevuta = b.ricevuteList?.some(r =>
            r.numero_ricevuta.toString() === q ||
            r.payments?.some(p => p.socioNome && p.socioNome.toLowerCase().includes(q))
        )
        if (hasRicevuta) return true;

        return false;
    })
})

const totalBlocchetti = computed(() => blocchettiDinamici.value.length)
const totalAttivi = computed(() => blocchettiDinamici.value.filter(b => !b.data_restituzione).length)
const totalRestituiti = computed(() => blocchettiDinamici.value.filter(b => !!b.data_restituzione).length)
const totalRegistrati = computed(() => blocchettiDinamici.value.filter(b => b.isReal).length)

const totalPages = computed(() => Math.ceil(filteredBlocchetti.value.length / itemsPerPage.value) || 1)

const pagedBlocchetti = computed(() => {
    if (itemsPerPage.value === -1) return filteredBlocchetti.value
    const start = (currentPage.value - 1) * itemsPerPage.value
    return filteredBlocchetti.value.slice(start, start + itemsPerPage.value)
})

watch([searchQuery, activeFilter, itemsPerPage], () => {
    currentPage.value = 1
})


// ---- AZIONI MANUALI ----

async function handleAddBlocchetto() {
  if (!newBlocchetto.value.numero_blocchetto) {
    alert("Inserisci il numero del blocchetto")
    return
  }

  try {
    const dataToAdd = {
      numero_blocchetto: Number(newBlocchetto.value.numero_blocchetto),
      ricevute_da: 1, // Legacy non più vincolante
      ricevute_a: 50, // Legacy non più vincolante
      assegnato_a: newBlocchetto.value.assegnato_a.trim() || 'Pre-assegnato',
      data_assegnazione: newBlocchetto.value.data_assegnazione || null,
      data_restituzione: null
    }

    await addBlocchetto(dataToAdd)
    await loadData() // Ricarica tutto

    newBlocchetto.value = {
      numero_blocchetto: null,
      assegnato_a: '',
      data_assegnazione: new Date().toISOString().split('T')[0]
    }
    showAddForm.value = false
  } catch (error) {
    alert(error.message)
  }
}

async function handleReturn(id) {
  if (confirm('Vuoi segnare questo blocchetto come restituito oggi?')) {
    await returnBlocchetto(id)
    await loadData()
  }
}

async function handleDelete(id) {
  if (confirm('Sei sicuro di voler scollegare questo utente dal blocchetto? (I pagamenti NON verranno intaccati)')) {
    await deleteBlocchetto(id)
    await loadData()
  }
}

function toggleDetails(numero_blocchetto) {
  if (expandedRowId.value === numero_blocchetto) {
    expandedRowId.value = null
  } else {
    expandedRowId.value = numero_blocchetto
  }
}


// Formatting Helper
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('it-IT')
}

</script>

<template>
  <div class="view-container">
    <div class="header-section">
      <div class="header-titles">
        <h2>Esplora Blocchetti e Ricevute</h2>
        <p class="subtitle">Naviga i pagamenti raggruppati esattamente per Blocchetto e Ricevuta.</p>
      </div>
      <div class="header-actions">
        <button class="primary-button" @click="showAddForm = !showAddForm">
          <BaseIcon :name="showAddForm ? 'x' : 'plus'" :size="18" />
          <span>{{ showAddForm ? 'Annulla' : 'Registra Nuovo Blocchetto' }}</span>
        </button>
      </div>
    </div>

    <!-- FORM INSERIMENTO -->
    <div v-if="showAddForm" class="form-panel shadow-panel">
      <h3>Dati Nuovo Blocchetto</h3>
      <p class="help-text">Non occorre specificare il range "Da-A". Il sistema associerà automaticamente le ricevute inserite nei pagamenti.</p>
      <form @submit.prevent="handleAddBlocchetto" class="add-form">
        <div class="form-group grid-2">
          <div>
            <label>N° Seriale / N° Blocchetto</label>
            <input type="number" v-model="newBlocchetto.numero_blocchetto" required placeholder="Es. 1" />
          </div>
          <div>
             <label>Persona Incaricata / Assegnatario</label>
             <input type="text" v-model="newBlocchetto.assegnato_a" placeholder="Es. Ceraiolo, Mario Rossi..." />
          </div>
        </div>

        <div class="form-group">
          <label>Data di Consegna (Opzionale)</label>
          <input type="date" v-model="newBlocchetto.data_assegnazione" />
        </div>

        <div class="form-actions">
          <button type="button" class="secondary-button" @click="showAddForm = false">Annulla</button>
          <button type="submit" class="primary-button">Salva Anagrafica Blocchetto</button>
        </div>
      </form>
    </div>

    <!-- FILTRI RAPIDI -->
    <div class="filter-pills-container">
      <button
        class="filter-pill"
        :class="{ active: activeFilter === 'tutti' }"
        @click="activeFilter = 'tutti'"
      >
        Tutti i Blocchetti ({{ totalBlocchetti }})
      </button>
      <button
        class="filter-pill"
        :class="{ active: activeFilter === 'attivi' }"
        @click="activeFilter = 'attivi'"
      >
        In Circolazione ({{ totalAttivi }})
      </button>
      <button
        class="filter-pill"
        :class="{ active: activeFilter === 'restituiti' }"
        @click="activeFilter = 'restituiti'"
      >
        Restituiti ({{ totalRestituiti }})
      </button>
      <button
        v-if="totalRegistrati > 0"
        class="filter-pill"
        :class="{ active: activeFilter === 'registrati' }"
        @click="activeFilter = 'registrati'"
      >
        Con Anagrafica ({{ totalRegistrati }})
      </button>
    </div>

    <!-- STATISTICHE E RICERCA -->
    <div class="stats-bar shadow-panel">
       <div class="stats-left">
          <div class="search-box">
             <BaseIcon name="search" :size="18" class="search-icon" />
             <input type="text" v-model="searchQuery" placeholder="Cerca Blocchetto n°, Ricevuta n°, Socio..." class="search-input" />
          </div>
       </div>
       <div class="stats-right">
          <div class="stat-item">
             <span class="stat-label">Taccuini Visualizzati</span>
             <span class="stat-value tabular-num">{{ filteredBlocchetti.length }}</span>
          </div>
          <div class="stat-item">
             <span class="stat-label">In Circolazione</span>
             <span class="stat-value highlight-active tabular-num">{{ totalAttivi }}</span>
          </div>
       </div>
    </div>

    <!-- TABELLA DATI DINAMICA -->
    <div class="table-container shadow-panel">
      <table v-if="filteredBlocchetti.length > 0" class="data-table">
        <thead>
          <tr>
            <th>Blocchetto</th>
            <th>Assegnato A</th>
            <th>Consegna</th>
            <th>Stato Restituzione</th>
            <th>Volumi Trovati</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="b in pagedBlocchetti" :key="b.numero_blocchetto">
            <tr :class="{ 'row-returned': b.data_restituzione, 'is-dynamic': !b.isReal }">
              <td><strong class="tabular-num">N° {{ b.numero_blocchetto }}</strong></td>
              <td>{{ b.assegnato_a }}</td>
              <td class="tabular-num">{{ b.data_assegnazione ? formatDate(b.data_assegnazione) : '-' }}</td>
              <td>
                 <span v-if="b.data_restituzione" class="status-badge valid tabular-num">
                    {{ formatDate(b.data_restituzione) }}
                 </span>
                 <span v-else-if="!b.isReal" class="status-badge dynamic" title="Esiste dai pagamenti storici">Storico</span>
                 <span v-else class="status-badge pending">In Circolazione</span>
              </td>
              <td>
                 <span class="badge blue tabular-num">{{ b.countPagamenti }} Quote</span>
                 <span class="badge green tabular-num">€ {{ Number(b.totaleIncassato || 0).toFixed(2) }}</span>
              </td>
              <td class="action-cell">
                 <button v-if="b.isReal && !b.data_restituzione" @click="handleReturn(b.id)" class="action-btn ok-btn" title="Segna come Restituito">
                   <BaseIcon name="check" :size="18" color="success" />
                 </button>
                 <button @click="toggleDetails(b.numero_blocchetto)" class="action-btn info-btn" :title="expandedRowId === b.numero_blocchetto ? 'Chiudi dettagli' : 'Esplora Ricevute in questo blocchetto'">
                   <BaseIcon :name="expandedRowId === b.numero_blocchetto ? 'chevron-up' : 'eye'" :size="18" />
                 </button>
                 <button v-if="b.isReal" @click="handleDelete(b.id)" class="action-btn delete-btn" title="Elimina Assegnazione (Diventerà Storico)">
                   <BaseIcon name="trash" :size="18" color="accent" />
                 </button>
              </td>
            </tr>
            <!-- Dettaglio Espanso: Ricevute e Soci -->
            <tr v-if="expandedRowId === b.numero_blocchetto" class="expanded-row">
               <td colspan="6" class="expanded-cell">
                  <div class="receipts-header">
                     <h4>Ricevute compilate per il Blocchetto N° {{ b.numero_blocchetto }}</h4>
                  </div>
                  <div v-if="!b.ricevuteList || b.ricevuteList.length === 0" class="empty-msg">Nessuna ricevuta individuata per questo blocchetto finora.</div>

                  <div v-else class="receipts-grid">
                     <div v-for="ric in b.ricevuteList" :key="ric.numero_ricevuta" class="receipt-card">
                        <div class="receipt-title tabular-num">Ricevuta N° {{ ric.numero_ricevuta }}</div>
                        <ul class="persons-list">
                           <li v-for="pay in ric.payments" :key="pay.id_tesseramento">
                              <strong>{{ pay.socioNome }}</strong>
                              <span class="pay-year tabular-num">Anno {{ pay.anno }}</span>
                              <span class="pay-amount tabular-num">€ {{ Number(pay.quota_pagata || 0).toFixed(2) }}</span>
                           </li>
                        </ul>
                     </div>
                  </div>
               </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <p>Nessun Blocchetto corrisponde alla tua ricerca o non ci sono ancora pagamenti registrati.</p>
      </div>

      <!-- BARRA DI PAGINAZIONE -->
      <div v-if="filteredBlocchetti.length > 0" class="pagination-footer">
        <div class="pagination-summary">
          Visualizzati <strong>{{ pagedBlocchetti.length }}</strong> di <strong>{{ filteredBlocchetti.length }}</strong> blocchetti
        </div>
        <div class="pagination-buttons" v-if="totalPages > 1">
          <button
            class="pagination-btn"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            <BaseIcon name="chevron-left" :size="16" /> Precedente
          </button>
          <span class="pagination-current">Pagina {{ currentPage }} di {{ totalPages }}</span>
          <button
            class="pagination-btn"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            Successivo <BaseIcon name="chevron-right" :size="16" />
          </button>
        </div>
        <div class="page-size-selector">
          <label>Per pagina:</label>
          <select v-model.number="itemsPerPage" class="page-size-select">
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
            <option :value="-1">Tutti</option>
          </select>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.view-container {
  max-width: 1200px;
  margin: 0 auto;
}

.shadow-panel {
  background: var(--color-surface);
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-titles h2 {
  margin: 0 0 0.5rem 0;
  color: var(--color-text-primary);
}
.subtitle {
  color: var(--color-text-secondary);
  margin: 0;
}

/* STATS BAR */
.stats-bar {
   display: flex;
   justify-content: space-between;
   align-items: center;
   background: var(--color-surface-hover);
}
.stats-left {
   flex: 1;
}
.search-box {
   position: relative;
   display: flex;
   align-items: center;
   max-width: 420px;
}
.search-icon {
   position: absolute;
   left: 12px;
   color: var(--color-text-secondary);
   pointer-events: none;
}
.search-input {
   width: 100%;
   padding: 0.8rem 1rem 0.8rem 2.6rem;
   border: 1px solid var(--color-border);
   border-radius: 8px;
   background: var(--color-background);
   font-size: 1rem;
   color: var(--color-text-primary);
}
.stats-right {
   display: flex;
   gap: 2rem;
}
.stat-item {
   display: flex;
   flex-direction: column;
}
.stat-label {
   font-size: 0.85rem;
   text-transform: uppercase;
   letter-spacing: 0.05em;
   color: var(--color-text-secondary);
}
.stat-value {
   font-size: 1.5rem;
   font-weight: bold;
}
.highlight-active {
   color: #eab308;
}

/* FORM ADD */
.form-group {
   margin-bottom: 1.2rem;
}
.grid-2 {
   display: grid;
   grid-template-columns: 1fr 1fr;
   gap: 1rem;
}
label {
   display: block;
   margin-bottom: 0.5rem;
   font-weight: 500;
   color: var(--color-text-secondary);
}
input {
   width: 100%;
   padding: 0.75rem;
   border: 1px solid var(--color-border);
   border-radius: 6px;
   background-color: var(--color-background);
   color: var(--color-text-primary);
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}
.help-text {
   color: var(--color-text-secondary);
   font-size: 0.9rem;
   margin-bottom: 1rem;
}

/* TABLE */
.table-container {
  overflow-x: auto;
  padding: 0;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}
th {
  background-color: var(--color-surface-hover);
  font-weight: 600;
  color: var(--color-text-secondary);
}
.row-returned td {
  opacity: 0.8;
}
.is-dynamic td {
  color: var(--color-text-secondary);
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-weight: bold;
  font-size: 0.85em;
  margin-right: 0.5rem;
}
.badge.blue {
   background: #e0f2fe;
   color: #0369a1;
}
.badge.green {
   background: #dcfce7;
   color: #166534;
}

.status-badge {
   padding: 0.3rem 0.8rem;
   border-radius: 20px;
   font-size: 0.8rem;
   font-weight: 600;
}
.status-badge.valid { background: #dcfce7; color: #166534; }
.status-badge.pending { background: #fef3c7; color: #92400e; }
.status-badge.dynamic { background: var(--color-background); color: var(--color-text-secondary); border: 1px solid var(--color-border); }

/* Azioni in tabella */
.action-cell {
   display: flex;
   gap: 0.5rem;
   align-items: center;
}
.action-btn {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: transform 0.2s, background-color 0.2s, border-color 0.2s;
}
.action-btn:hover {
  transform: scale(1.05);
  background-color: var(--color-surface-hover);
  border-color: var(--color-accent);
}

/* Dettagli Espansi RICEVUTE */
.expanded-row {
   background-color: var(--color-background);
}
.expanded-cell {
   padding: 1.5rem !important;
   border-bottom: 2px solid var(--color-accent) !important;
}
.receipts-header h4 {
   margin-top: 0;
   margin-bottom: 1rem;
   color: var(--color-accent);
}
.receipts-grid {
   display: grid;
   grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
   gap: 1rem;
}
.receipt-card {
   background: var(--color-surface);
   border: 1px solid var(--color-border);
   border-radius: 8px;
   overflow: hidden;
}
.receipt-title {
   background: var(--color-surface-hover);
   padding: 0.8rem 1rem;
   font-weight: bold;
   border-bottom: 1px solid var(--color-border);
}
.persons-list {
   list-style: none;
   margin: 0;
   padding: 0;
}
.persons-list li {
   padding: 0.8rem 1rem;
   border-bottom: 1px solid var(--color-border);
   display: flex;
   align-items: center;
   justify-content: space-between;
   font-size: 0.95rem;
}
.persons-list li:last-child {
   border-bottom: none;
}
.pay-year {
   color: var(--color-text-secondary);
   font-size: 0.85rem;
}
.pay-amount {
   font-weight: bold;
   color: #16a34a;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-secondary);
}
.empty-msg {
   color: var(--color-text-secondary);
   font-style: italic;
}

/* BUTTONS */
.primary-button, .secondary-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.primary-button {
  background-color: var(--color-accent);
  color: white;
}
.primary-button:hover { background-color: var(--color-accent-hover); }
.secondary-button {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}
.secondary-button:hover { background-color: var(--color-surface-hover); }

.tabular-num {
  font-variant-numeric: tabular-nums;
}

/* FILTRI RAPIDI (PILLS) */
.filter-pills-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.filter-pill {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  border-radius: 9999px;
  padding: 0.5rem 1.1rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
}

.filter-pill:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  border-color: var(--color-accent);
}

.filter-pill.active {
  background: var(--color-accent);
  color: #ffffff;
  border-color: var(--color-accent);
  box-shadow: 0 2px 4px rgba(183, 28, 28, 0.25);
  font-weight: 600;
}

/* PAGINATION FOOTER */
.pagination-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-hover);
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.pagination-summary {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.pagination-summary strong {
  color: var(--color-text-primary);
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  font-size: 0.9rem;
  font-weight: 500;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 38px;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
  border-color: var(--color-accent);
}

.pagination-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination-current {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.page-size-select {
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 0.9rem;
  cursor: pointer;
}

</style>
