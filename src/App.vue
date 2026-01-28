<script setup>
import { computed } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import { useThemeStore } from './stores/theme'

const themeStore = useThemeStore()

// Colors for SVG that need to adapt to theme (computed to be reactive if needed,
// though for SVG simple binding might not catch CSS var changes instantly without a re-render or using CSS classes.
// Best approach for SVG icons in this setup is to use 'currentColor' or CSS classes, but let's stick to simple binding for now
// and assume the user refreshes or we rely on the store state).
// Actually, let's use the store state to toggle these.
const primaryColor = computed(() => themeStore.currentTheme === 'dark' ? '#e0e0e0' : '#1a1a1a')
const accentColor = computed(() => themeStore.currentTheme === 'dark' ? '#ef5350' : '#B71C1C')
</script>

<template>
  <div id="app-layout">
    <header class="app-header">
      <div class="logo-container">
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
        <RouterLink to="/registrazione-seriale" class="nav-link"
          >🔄 Registrazione Seriale</RouterLink
        >
        <RouterLink to="/reports" class="nav-link">📊 Report</RouterLink>
        <RouterLink to="/settings" class="nav-link">⚙️ Impostazioni</RouterLink>
        <button @click="themeStore.toggleTheme" class="theme-toggle" title="Cambia Tema">
          {{ themeStore.currentTheme === 'dark' ? '☀️' : '🌙' }}
        </button>
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
  background-color: var(--color-background);
  color: var(--color-text-primary);
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: var(--color-surface);
  box-shadow: var(--shadow-md);
  border-bottom: 3px solid var(--color-accent);
  transition: background-color 0.3s, border-color 0.3s;
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
  color: var(--color-text-primary);
  font-weight: 700;
}
.app-content {
  flex-grow: 1;
  padding: 2rem;
}

nav {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-link {
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  color: var(--color-text-primary);
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.nav-link:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-accent);
  border-color: var(--color-border);
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  background-color: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.theme-toggle {
  background: transparent;
  border: 1px solid var(--color-border);
  font-size: 1.2rem;
  padding: 0.5rem;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.5rem;
  box-shadow: none;
  color: var(--color-text-primary);
}

.theme-toggle:hover {
  background-color: var(--color-surface-hover);
  border-color: var(--color-accent);
  transform: rotate(15deg);
}
</style>
