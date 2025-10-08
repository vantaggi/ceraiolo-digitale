<template>
  <div class="home">
    <h1>Home Page</h1>
    <p>Welcome to the Ceraiolo Digitale App!</p>
    <button @click="clearDatabase">Clear Database</button>
  </div>
</template>

<script setup>
import { db } from '@/services/db'

const clearDatabase = async () => {
  await db.delete()
  await db.open()
  console.log('Database cleared!')
  window.location.reload()
}
</script>
