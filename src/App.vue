<script setup>
import { useThemeStore } from './stores/theme'
import logoSantantoniari from '@/assets/logo_santantoniari.jpg'
import { useRouter } from 'vue-router'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import KeyboardShortcutsModal from '@/components/KeyboardShortcutsModal.vue'

const themeStore = useThemeStore()
const router = useRouter()
const showShortcutsModal = ref(false)

const handleGlobalKeydown = (e) => {
  // Ignore if typing in input/textarea (unless it involves modifiers checking context?)
  // But ? is printable, so checks are needed.
  const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA'

  // Ctrl+K -> Global Search (Go to Home)
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    router.push({ path: '/', query: { action: 'search', t: Date.now() } })
    return
  }

  // ? -> Toggle Help (Shift + /)
  if (e.key === '?' && !isTyping) {
    e.preventDefault()
    showShortcutsModal.value = !showShortcutsModal.value
    return
  }

  // Esc -> Close Modal if open
  if (e.key === 'Escape' && showShortcutsModal.value) {
    showShortcutsModal.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div id="app-layout">
    <header class="app-header">
      <div class="logo-container">
        <img
          :src="logoSantantoniari"
          alt="Logo Santantoniari"
          class="logo app-logo"
          :class="{ 'logo-dark': themeStore.currentTheme === 'dark' }"
        />
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
          {{ themeStore.currentTheme === 'dark' ? '🔥' : '🕯️' }}
        </button>
      </nav>
    </header>
    <main class="app-content">
      <RouterView />
    </main>
    <KeyboardShortcutsModal :isVisible="showShortcutsModal" @close="showShortcutsModal = false" />
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
  transition:
    background-color 0.3s,
    border-color 0.3s;
}
.logo-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.logo {
  height: 50px;
  width: auto;
  /* Blend mode to make white background transparent */
  mix-blend-mode: multiply;
  border-radius: 4px;
}

.app-logo {
  mix-blend-mode: multiply;
  transition: all 0.3s ease;
}

/*
  In Dark Mode:
  1. Invert colors: Black logo -> White logo, White BG -> Black BG
  2. Switch blend mode to SCREEN: Black BG becomes transparent, White logo remains visible
*/
.logo-dark {
  filter: invert(1) grayscale(100%);
  mix-blend-mode: screen;
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
