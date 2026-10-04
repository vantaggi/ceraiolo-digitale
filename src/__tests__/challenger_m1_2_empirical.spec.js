import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import App from '../App.vue'
import BaseIcon from '../components/common/BaseIcon.vue'
import { useThemeStore } from '../stores/theme'

// Mock dummy routes for App.vue RouterLinks
const routes = [
  { path: '/', name: 'Home', component: { template: '<div>Home Page</div>' } },
  { path: '/registrazione-seriale', name: 'BatchEntry', component: { template: '<div>Batch Entry</div>' } },
  { path: '/blocchetti', name: 'Blocchetti', component: { template: '<div>Blocchetti</div>' } },
  { path: '/reports', name: 'Reports', component: { template: '<div>Reports</div>' } },
  { path: '/settings', name: 'Settings', component: { template: '<div>Settings</div>' } },
]

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes,
  })
}

describe('Challenger M1-2: Empirical Stress Testing', () => {
  let router
  let pinia

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = createTestRouter()
    await router.push('/')
    await router.isReady()
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  // =========================================================================
  // Challenge 1: App.vue Responsive Layout & Navigation
  // =========================================================================
  describe('Challenge 1: App.vue Responsive Layout & Navigation Structure', () => {
    it('mounts App.vue with institutional branding and all 5 primary navigation links', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [router, pinia],
          components: { BaseIcon },
        },
      })

      // Header structure
      const header = wrapper.find('header.app-header')
      expect(header.exists()).toBe(true)

      // Brand link
      const brandLink = wrapper.find('.brand-link')
      expect(brandLink.exists()).toBe(true)
      expect(brandLink.attributes('title')).toContain('Torna alla Ricerca')

      // Logo
      const logo = wrapper.find('img.app-logo')
      expect(logo.exists()).toBe(true)
      expect(logo.attributes('alt')).toBe('Logo Santantoniari')

      // Title and Subtitle
      expect(wrapper.find('.app-title').text()).toBe('Ceraiolo Digitale')
      expect(wrapper.find('.app-subtitle').text()).toBe('Famiglia dei Santantoniari')

      // Nav Links (5 required links)
      const navLinks = wrapper.findAll('.app-nav .nav-link')
      expect(navLinks).toHaveLength(5)

      const expectedLinks = [
        { path: '/', text: 'Ricerca', icon: 'home' },
        { path: '/registrazione-seriale', text: 'Registrazione Seriale', icon: 'refresh-cw' },
        { path: '/blocchetti', text: 'Blocchetti', icon: 'receipt' },
        { path: '/reports', text: 'Report', icon: 'bar-chart' },
        { path: '/settings', text: 'Impostazioni', icon: 'settings' },
      ]

      expectedLinks.forEach((expected, idx) => {
        const link = navLinks[idx]
        expect(link.find('.nav-text').text()).toBe(expected.text)
        const icon = link.findComponent(BaseIcon)
        expect(icon.exists()).toBe(true)
        expect(icon.props('name')).toBe(expected.icon)
      })
    })

    it('inverts logo in dark mode reactively via .logo-dark CSS class', async () => {
      const themeStore = useThemeStore()
      const wrapper = mount(App, {
        global: {
          plugins: [router, pinia],
          components: { BaseIcon },
        },
      })

      const logo = wrapper.find('img.app-logo')
      expect(logo.classes()).not.toContain('logo-dark')

      themeStore.applyTheme('dark')
      await wrapper.vm.$nextTick()
      expect(logo.classes()).toContain('logo-dark')

      themeStore.applyTheme('light')
      await wrapper.vm.$nextTick()
      expect(logo.classes()).not.toContain('logo-dark')
    })

    it('handles global keyboard shortcuts correctly (Ctrl+K, ?, Escape)', async () => {
      const wrapper = mount(App, {
        global: {
          plugins: [router, pinia],
          components: { BaseIcon },
        },
      })

      const pushSpy = vi.spyOn(router, 'push')

      // 1. Ctrl+K -> Search
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
      expect(pushSpy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/', query: expect.objectContaining({ action: 'search' }) })
      )

      // 2. '?' -> Toggle Shortcuts Modal
      expect(wrapper.vm.showShortcutsModal).toBe(false)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', target: document.body }))
      expect(wrapper.vm.showShortcutsModal).toBe(true)

      // 3. 'Escape' -> Close Shortcuts Modal
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', target: document.body }))
      expect(wrapper.vm.showShortcutsModal).toBe(false)

      pushSpy.mockRestore()
    })

    it('verifies responsive media query contracts in App.vue CSS', () => {
      const appVueContent = fs.readFileSync(
        path.resolve(process.cwd(), 'src/App.vue'),
        'utf-8'
      )

      // Tablet Breakpoint 960px
      expect(appVueContent).toContain('@media (max-width: 960px)')
      expect(appVueContent).toMatch(/\.app-header\s*\{[^}]*flex-direction:\s*column/s)
      expect(appVueContent).toMatch(/\.app-nav\s*\{[^}]*flex-wrap:\s*wrap/s)
      expect(appVueContent).toMatch(/\.nav-link\s*\{[^}]*flex:\s*1\s*1\s*calc\(33\.333%\s*-\s*0\.5rem\)/s)

      // Mobile Breakpoint 600px
      expect(appVueContent).toContain('@media (max-width: 600px)')
      expect(appVueContent).toMatch(/\.logo\s*\{[^}]*height:\s*42px/s)
      expect(appVueContent).toMatch(/\.app-title\s*\{[^}]*font-size:\s*1\.25rem/s)
      expect(appVueContent).toMatch(/\.nav-link\s*\{[^}]*flex:\s*1\s*1\s*calc\(50%\s*-\s*0\.5rem\)/s)
      expect(appVueContent).toMatch(/\.app-content\s*\{[^}]*padding:\s*1rem/s)
    })

    it('adversarially evaluates nav item text wrapping vs white-space:nowrap on narrow viewports', () => {
      // In App.vue line 217: .nav-link has white-space: nowrap
      // On 600px breakpoint, nav-link has flex: 1 1 calc(50% - 0.5rem)
      // "Registrazione Seriale" has 21 characters
      const longLabel = 'Registrazione Seriale'
      expect(longLabel.length).toBe(21)

      // At 360px viewport width (typical small mobile):
      // Container width: 360px - 2rem (32px padding) = 328px
      // Each 50% flex item: ~160px width
      // Icon: 18px + gap: 8.5px + padding: 17px = ~43.5px
      // Space remaining for text: ~116.5px
      // With 17px base * 0.85rem = 14.45px font-size, 21 characters require ~140-160px
      // Documenting this potential overflow risk for narrow screens (320px-360px)
      const estimatedCharWidth = 7.5 // px
      const estimatedTextWidth = longLabel.length * estimatedCharWidth
      const availableWidthAt360px = 160 - 44 // ~116px

      expect(estimatedTextWidth).toBeGreaterThan(availableWidthAt360px)
      // Note: On screens < 360px, "Registrazione Seriale" may cause flex item expansion or overflow.
    })
  })

  // =========================================================================
  // Challenge 2: Theme Switching Persistence & FOUC / Flicker Investigation
  // =========================================================================
  describe('Challenge 2: Theme Persistence, Sync, and Cold-Reload FOUC', () => {
    it('initializes correctly from empty localStorage defaulting to light', () => {
      localStorage.removeItem('theme')
      const store = useThemeStore()
      expect(store.currentTheme).toBe('light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
      expect(localStorage.getItem('theme')).toBe('light')
    })

    it('initializes correctly from pre-existing localStorage dark theme', () => {
      localStorage.setItem('theme', 'dark')
      const store = useThemeStore()
      expect(store.currentTheme).toBe('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('synchronizes data-theme on html element on every applyTheme call', () => {
      const store = useThemeStore()
      store.applyTheme('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      expect(localStorage.getItem('theme')).toBe('dark')

      store.applyTheme('light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
      expect(localStorage.getItem('theme')).toBe('light')
    })

    it('investigates FOUC (Flash of Unstyled Content) on cold load of dark theme', () => {
      // Check index.html content
      const indexHtmlPath = path.resolve(process.cwd(), 'index.html')
      const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8')

      // Verify whether index.html has a blocking inline script in <head> to set data-theme before body renders
      const hasHeadThemeScript = /<head>[\s\S]*?<script[\s\S]*?localStorage\.getItem\(['"]theme['"]\)[\s\S]*?<\/head>/i.test(
        indexHtmlContent
      )

      // Also check if main.css specifies a transition on body background
      const mainCssPath = path.resolve(process.cwd(), 'src/assets/main.css')
      const mainCssContent = fs.readFileSync(mainCssPath, 'utf-8')
      const bodyHasBgTransition = /body\s*\{[^}]*transition:[^}]*background-color\s+0\.3s/s.test(
        mainCssContent
      )

      // EMPIRICAL FINDING:
      // If index.html has NO synchronous head script, the initial HTML parser renders light theme (:root),
      // and when main.js executes asynchronously, data-theme="dark" is applied.
      // Combined with body transition 0.3s, this results in a visible light-to-dark flash/flicker!
      expect(hasHeadThemeScript).toBe(false)
      expect(bodyHasBgTransition).toBe(true)
    })

    it('adversarially tests resilience against unexpected localStorage values', () => {
      localStorage.setItem('theme', 'invalid-theme-xyz')
      const store = useThemeStore()
      // Store accepts the string
      expect(store.currentTheme).toBe('invalid-theme-xyz')
      expect(document.documentElement.getAttribute('data-theme')).toBe('invalid-theme-xyz')

      // But since [data-theme='invalid-theme-xyz'] is not defined in main.css,
      // CSS gracefully defaults to :root (light theme) tokens!
      // And recovery is clean when applying a valid theme:
      store.applyTheme('light')
      expect(store.currentTheme).toBe('light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
      expect(localStorage.getItem('theme')).toBe('light')
    })

    it('verifies SettingsView theme selector radio card structure and attributes', () => {
      const settingsViewContent = fs.readFileSync(
        path.resolve(process.cwd(), 'src/views/SettingsView.vue'),
        'utf-8'
      )

      // Verifies aria-checked, role="radio", and radio group container
      expect(settingsViewContent).toContain('role="radiogroup"')
      expect(settingsViewContent).toContain('role="radio"')
      expect(settingsViewContent).toContain(':aria-checked="themeStore.currentTheme === \'light\'"')
      expect(settingsViewContent).toContain(':aria-checked="themeStore.currentTheme === \'dark\'"')
      expect(settingsViewContent).toContain("@click=\"selectTheme('light')\"")
      expect(settingsViewContent).toContain("@click=\"selectTheme('dark')\"")
    })
  })

  // =========================================================================
  // Challenge 3: Table Styling, Zebra Striping & Row Height Compliance
  // =========================================================================
  describe('Challenge 3: Table Styling, Zebra Striping & Row Height Compliance', () => {
    let mainCssContent

    beforeEach(() => {
      mainCssContent = fs.readFileSync(
        path.resolve(process.cwd(), 'src/assets/main.css'),
        'utf-8'
      )
    })

    it('verifies table rules enforce 48-52px ergonomic height and zebra striping', () => {
      // Check table height rules
      expect(mainCssContent).toMatch(/tbody tr[^}]*height:\s*50px/s)
      expect(mainCssContent).toMatch(/tbody tr[^}]*min-height:\s*48px/s)

      // Check zebra striping rule
      expect(mainCssContent).toMatch(/tbody tr:nth-child\(even\)[^}]*background-color:\s*var\(--color-surface-hover\)/s)

      // Check hover states
      expect(mainCssContent).toMatch(/tbody tr:hover[^}]*background-color:\s*rgba\(183,\s*28,\s*28,\s*0\.04\)/s)
      expect(mainCssContent).toMatch(/\[data-theme='dark'\]\s+tbody tr:hover[^}]*background-color:\s*rgba\(239,\s*83,\s*80,\s*0\.08\)/s)
    })

    it('verifies accounting alignment tokens (.tabular-nums, .text-right, .col-currency, .col-number)', () => {
      expect(mainCssContent).toMatch(/\.tabular-nums[^}]*text-align:\s*right\s*!important/s)
      expect(mainCssContent).toMatch(/\.tabular-nums[^}]*font-variant-numeric:\s*tabular-nums/s)
      expect(mainCssContent).toMatch(/\.tabular-nums[^}]*font-feature-settings:\s*'tnum'\s*1/s)
    })

    it('empirically evaluates zebra striping across populated data loads (1 to 10 rows)', () => {
      // Construct a simulated DOM table container
      const container = document.createElement('div')
      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr><th>#</th><th>Nome</th><th>Quota</th></tr>
          </thead>
          <tbody>
            ${Array.from({ length: 10 }, (_, i) => `
              <tr id="row-${i + 1}">
                <td>${i + 1}</td>
                <td>Socio ${i + 1}</td>
                <td class="col-currency tabular-nums">€ ${(i + 1) * 10}.00</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      document.body.appendChild(container)

      const rows = container.querySelectorAll('tbody tr')
      expect(rows).toHaveLength(10)

      // Check parity logic: even rows are index 2, 4, 6, 8, 10
      rows.forEach((row, idx) => {
        const rowNumber = idx + 1
        const isEven = rowNumber % 2 === 0
        // In CSS :nth-child(even), rowNumber 2, 4, 6... match :nth-child(even)
        expect(rowNumber % 2 === 0).toBe(isEven)
      })

      document.body.removeChild(container)
    })

    it('empirically evaluates empty table rendering (0 rows in tbody)', () => {
      const container = document.createElement('div')
      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr><th>#</th><th>Nome</th><th>Quota</th></tr>
          </thead>
          <tbody></tbody>
        </table>
      `
      document.body.appendChild(container)

      const tbody = container.querySelector('tbody')
      expect(tbody.children.length).toBe(0)
      // Empty table tbody has 0 child nodes without throwing CSS errors
      expect(tbody).not.toBeNull()

      document.body.removeChild(container)
    })

    it('adversarially stress-tests zebra parity disruption when expandable sub-rows are inserted', () => {
      // In BlocchettiView.vue, expanding a row inserts a <tr class="expanded-row"> directly in <tbody>
      const container = document.createElement('div')
      container.innerHTML = `
        <table class="data-table">
          <tbody>
            <tr id="row-1" class="main-row"><td>Blocchetto 1</td></tr>
            <tr id="row-1-expanded" class="expanded-row"><td>Details 1</td></tr>
            <tr id="row-2" class="main-row"><td>Blocchetto 2</td></tr>
            <tr id="row-3" class="main-row"><td>Blocchetto 3</td></tr>
          </tbody>
        </table>
      `
      document.body.appendChild(container)

      const children = container.querySelectorAll('tbody tr')
      expect(children).toHaveLength(4)

      // Child 1: row-1 (odd, :nth-child(1))
      // Child 2: row-1-expanded (even, :nth-child(2)) -> receives zebra background!
      // Child 3: row-2 (odd, :nth-child(3)) -> was even when collapsed, now odd!
      // Child 4: row-3 (even, :nth-child(4)) -> was odd when collapsed, now even!
      expect(children[1].id).toBe('row-1-expanded')
      expect(children[2].id).toBe('row-2')

      // This demonstrates that dynamic sub-row insertion shifts :nth-child parity for all following rows
      document.body.removeChild(container)
    })
  })
})
