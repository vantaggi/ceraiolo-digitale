<template>
  <div class="home">
    <h1>Home Page</h1>
    <p>Welcome to the Ceraiolo Digitale App!</p>
    <button @click="clearDatabase">Clear Database</button>

    <main class="dashboard">
      <h1>Cerca Socio</h1>
      <div class="search-bar">
        <input
          v-model="searchTerm"
          @input="onSearch"
          type="text"
          placeholder="Scrivi un nome o cognome..."
        />
      </div>

      <div class="results-container">
        <p v-if="isSearching">Ricerca in corso...</p>
        <div v-else-if="searchResults.length > 0">
          <SocioCard v-for="socio in searchResults" :key="socio.id" :socio="socio" />
        </div>
        <p v-else-if="searchTerm && !isSearching">Nessun risultato trovato.</p>
        <p v-else>Inizia a scrivere per cercare un socio.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { db } from '@/services/db'
import { searchSoci } from '@/services/db'
import SocioCard from '@/components/SocioCard.vue'

const clearDatabase = async () => {
  await db.delete()
  await db.open()
  console.log('Database cleared!')
  window.location.reload()
}

const searchTerm = ref('')
const searchResults = ref([])
const isSearching = ref(false)

let searchTimeout = null

const onSearch = () => {
  isSearching.value = true
  clearTimeout(searchTimeout)

  // Debounce: wait 300ms after user stops typing before searching
  searchTimeout = setTimeout(async () => {
    searchResults.value = await searchSoci(searchTerm.value)
    isSearching.value = false
  }, 300)
}
</script>

<style scoped>
.dashboard {
  padding: 2rem;
}
.search-bar input {
  width: 100%;
  padding: 0.8rem;
  font-size: 1.2rem;
  border-radius: 8px;
  border: 1px solid #444;
  background-color: #1e1e1e;
  color: #e0e0e0;
}
.results-container {
  margin-top: 2rem;
}
</style>
