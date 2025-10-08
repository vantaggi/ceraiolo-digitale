<script setup>
import { RouterView } from 'vue-router'
// Using the new official colors
const primaryColor = '#1a1a1a' // Black
const accentColor = '#B71C1C' // Red
</script>

<template>
  <div id="app-layout">
    <header class="app-header">
      <div class="logo-container">
        <!-- SVG Stemma Sant'antoniari con nuovi colori -->
        <svg class="logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 0 L95 25 L95 75 L50 100 L5 75 L5 25 Z" :fill="primaryColor" />
          <path
            d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z"
            stroke-width="3"
            :stroke="accentColor"
          />
          <text
            x="50"
            y="58"
            :fill="accentColor"
            font-size="24"
            text-anchor="middle"
            font-weight="bold"
          >
            S
          </text>
        </svg>
        <h1 class="app-title">Ceraiolo Digitale</h1>
      </div>
      <nav>
        <!-- Navigation links can go here in the future -->
      </nav>
    </header>
    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
#app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: var(--color-surface);
  box-shadow: var(--shadow-md);
  border-bottom: 3px solid var(--color-accent); /* Red border for accent */
}
.logo-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.logo {
  width: 40px;
  height: 40px;
}
.app-title {
  font-size: 1.5rem;
  margin-bottom: 0;
  color: var(--color-primary);
}
.app-content {
  flex-grow: 1;
  padding: 2rem;
}
</style>
