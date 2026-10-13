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
        <RouterLink to="/" class="brand-link" title="Torna alla Ricerca - Ceraiolo Digitale">
          <img
            :src="logoSantantoniari"
            alt="Logo Santantoniari"
            class="logo app-logo"
            :class="{ 'logo-dark': themeStore.currentTheme === 'dark' }"
          />
          <div class="brand-text">
            <h1 class="app-title">Ceraiolo Digitale</h1>
            <span class="app-subtitle">Famiglia dei Santantoniari</span>
          </div>
        </RouterLink>
      </div>
      <nav class="app-nav" aria-label="Navigazione Principale">
        <RouterLink to="/" class="nav-link">
          <BaseIcon name="home" :size="18" class="nav-icon" />
          <span class="nav-text">Ricerca</span>
        </RouterLink>
        <RouterLink to="/registrazione-seriale" class="nav-link">
          <BaseIcon name="refresh-cw" :size="18" class="nav-icon" />
          <span class="nav-text">Registrazione Seriale</span>
        </RouterLink>
        <RouterLink to="/blocchetti" class="nav-link">
          <BaseIcon name="receipt" :size="18" class="nav-icon" />
          <span class="nav-text">Blocchetti</span>
        </RouterLink>
        <RouterLink to="/reports" class="nav-link">
          <BaseIcon name="bar-chart" :size="18" class="nav-icon" />
          <span class="nav-text">Report</span>
        </RouterLink>
        <RouterLink to="/settings" class="nav-link">
          <BaseIcon name="settings" :size="18" class="nav-icon" />
          <span class="nav-text">Impostazioni</span>
        </RouterLink>
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
  padding: 0.85rem 2rem;
  background-color: var(--color-surface);
  box-shadow: var(--shadow-md, 0 2px 8px rgba(0, 0, 0, 0.08));
  border-bottom: 3px solid var(--color-accent);
  transition:
    background-color 0.3s,
    border-color 0.3s;
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo-container {
  display: flex;
  align-items: center;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-decoration: none;
  color: inherit;
  border-radius: 8px;
  padding: 0.25rem 0.5rem;
  margin: -0.25rem -0.5rem;
  transition: opacity 0.2s, background-color 0.2s;
}

.brand-link:hover {
  background-color: var(--color-surface-hover);
}

.brand-link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
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

.brand-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.app-title {
  font-size: 1.45rem;
  margin-bottom: 0;
  color: var(--color-text-primary);
  font-weight: 700;
  line-height: 1.2;
}

.app-subtitle {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-top: 2px;
}

.app-content {
  flex-grow: 1;
  padding: 2rem;
}

nav,
.app-nav {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.15rem;
  background-color: transparent;
  color: var(--color-text-primary);
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  min-height: 44px;
  border: 1px solid transparent;
  transition: all 0.2s ease-in-out;
  line-height: 1.2;
  white-space: nowrap;
}

.nav-icon {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.nav-link:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-accent);
  border-color: var(--color-border);
  transform: translateY(-1px);
}

.nav-link:hover .nav-icon {
  transform: scale(1.08);
}

.nav-link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.nav-link.router-link-active {
  background-color: var(--color-accent);
  color: #ffffff;
  border-color: var(--color-accent);
  box-shadow: 0 2px 6px rgba(183, 28, 28, 0.25);
}

.nav-link.router-link-active:hover {
  background-color: var(--color-accent-hover, #c62828);
  color: #ffffff;
}

/* 📱 Responsive Mobile & Tablet */
@media (max-width: 960px) {
  .app-header {
    flex-direction: column;
    padding: 1rem;
    gap: 0.85rem;
  }

  .logo-container {
    width: 100%;
    justify-content: center;
  }

  .brand-link {
    justify-content: center;
  }

  .app-nav {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
  }

  .nav-link {
    flex: 1 1 calc(33.333% - 0.5rem);
    justify-content: center;
    padding: 0.55rem 0.85rem;
    font-size: 0.9rem;
    min-height: 42px;
  }
}

@media (max-width: 600px) {
  .logo {
    height: 42px;
  }

  .app-title {
    font-size: 1.25rem;
  }

  .app-subtitle {
    font-size: 0.7rem;
  }

  .nav-link {
    flex: 1 1 calc(50% - 0.5rem);
    font-size: 0.85rem;
    padding: 0.5rem 0.65rem;
  }

  .app-content {
    padding: 1rem;
  }
}
</style>
