<script setup>
import { RouterView, RouterLink } from 'vue-router'
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
        <RouterLink to="/" class="nav-link">🏠 Ricerca</RouterLink>
        <RouterLink to="/reports" class="nav-link">📊 Report</RouterLink>
        <RouterLink to="/settings" class="nav-link">⚙️ Impostazioni</RouterLink>
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

nav {
  display: flex;
  gap: 1rem;
}

.nav-link {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-link:hover {
  background-color: var(--color-accent);
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  background-color: var(--color-accent);
}
</style>
