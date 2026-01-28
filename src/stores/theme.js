import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Initialize from localStorage or default to 'light'
  const currentTheme = ref(localStorage.getItem('theme') || 'light')

  // Apply theme to document
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    currentTheme.value = theme
  }

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
    applyTheme(newTheme)
  }

  // Watch for changes (redundant if we use applyTheme, but good for reactivity)
  watch(currentTheme, (newVal) => {
    applyTheme(newVal)
  })

  // Initial application
  applyTheme(currentTheme.value)

  return {
    currentTheme,
    toggleTheme,
    applyTheme
  }
})
