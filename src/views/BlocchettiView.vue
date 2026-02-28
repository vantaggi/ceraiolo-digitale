<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  db,
  getAllBlocchetti,
  addBlocchetto,
  returnBlocchetto,
  deleteBlocchetto,
  exportAllTesseramenti
} from '@/services/db'

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

const filteredBlocchetti = computed(() => {
    // 1. Mostra SOLO i blocchetti realmente esistenti nel database (isReal === true)
    let baseList = blocchettiDinamici.value.filter(b => b.isReal)

    if (!searchQuery.value) return baseList

    const q = searchQuery.value.toLowerCase()
    return baseList.filter(b => {
        if (b.numero_blocchetto.toString() === q) return true;
        if (b.assegnato_a && b.assegnato_a.toLowerCase().includes(q)) return true;

        // Cerca anche all'interno delle ricevute incassate
        const hasRicevuta = b.ricevuteList?.some(r => r.numero_ricevuta.toString() === q)
        if (hasRicevuta) return true;

        return false;
    })
})

const totalBlocchetti = computed(() => blocchettiDinamici.value.length)
const totalAttivi = computed(() => blocchettiDinamici.value.filter(b => !b.data_restituzione).length)


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
          {{ showAddForm ? 'Annulla' : '+ Registra Nuovo Blocchetto' }}
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

    <!-- STATISTICHE E RICERCA -->
    <div class="stats-bar shadow-panel">
       <div class="stats-left">
          <div class="search-box">
             <input type="text" v-model="searchQuery" placeholder="Cerca Blocchetto n° o Ricevuta n°..." class="search-input" />
          </div>
       </div>
       <div class="stats-right">
          <div class="stat-item">
             <span class="stat-label">Totale Taccuini Lavorati</span>
             <span class="stat-value">{{ totalBlocchetti }}</span>
          </div>
          <div class="stat-item">
             <span class="stat-label">Non Restituiti</span>
             <span class="stat-value highlight-active">{{ totalAttivi }}</span>
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
          <template v-for="b in filteredBlocchetti" :key="b.numero_blocchetto">
            <tr :class="{ 'row-returned': b.data_restituzione, 'is-dynamic': !b.isReal }">
              <td><strong>N° {{ b.numero_blocchetto }}</strong></td>
              <td>{{ b.assegnato_a }}</td>
              <td>{{ b.data_assegnazione ? formatDate(b.data_assegnazione) : '-' }}</td>
              <td>
                 <span v-if="b.data_restituzione" class="status-badge valid">
                    {{ formatDate(b.data_restituzione) }}
                 </span>
                 <span v-else-if="!b.isReal" class="status-badge dynamic" title="Esiste dai pagamenti ma non ha un'anagrafica">Sconosciuto</span>
                 <span v-else class="status-badge pending">In Circolazione</span>
              </td>
              <td>
                 <span class="badge blue">{{ b.countPagamenti }} Quote</span>
                 <span class="badge green">€ {{ b.totaleIncassato }}</span>
              </td>
              <td class="action-cell">
                 <button v-if="b.isReal && !b.data_restituzione" @click="handleReturn(b.id)" class="action-btn ok-btn" title="Segna come Restituito">✅</button>
                 <button @click="toggleDetails(b.numero_blocchetto)" class="action-btn info-btn" title="Esplora Ricevute in questo blocchetto">🔎</button>
                 <button v-if="b.isReal" @click="handleDelete(b.id)" class="action-btn delete-btn" title="Elimina Assegnazione (Diventerà Storico)">🗑️</button>
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
                        <div class="receipt-title">Ricevuta N° {{ ric.numero_ricevuta }}</div>
                        <ul class="persons-list">
                           <li v-for="pay in ric.payments" :key="pay.id_tesseramento">
                              <strong>{{ pay.socioNome }}</strong>
                              <span class="pay-year">Anno {{ pay.anno }}</span>
                              <span class="pay-amount">€ {{ pay.quota_pagata }}</span>
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
.search-input {
   width: 100%;
   max-width: 400px;
   padding: 0.8rem 1rem;
   border: 1px solid var(--color-border);
   border-radius: 8px;
   background: var(--color-background);
   font-size: 1rem;
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
}
.action-btn {
  border: none;
  background: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 4px;
  transition: transform 0.2s, background-color 0.2s;
}
.action-btn:hover {
  transform: scale(1.1);
  background-color: var(--color-border);
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
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
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

</style>
