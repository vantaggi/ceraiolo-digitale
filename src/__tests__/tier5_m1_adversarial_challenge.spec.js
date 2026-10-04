import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import BaseIcon from '../components/common/BaseIcon.vue'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// =============================================================================
// WCAG 2.2 MATHEMATICAL ORACLE (W3C REC FORMULAS)
// =============================================================================

function sRGBtoLinear(c) {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function hexToRgb(hex) {
  let cleaned = hex.replace('#', '').trim()
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((char) => char + char).join('')
  }
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  }
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const rLin = sRGBtoLinear(r)
  const gLin = sRGBtoLinear(g)
  const bLin = sRGBtoLinear(b)
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
}

function contrastRatio(hex1, hex2) {
  const lum1 = relativeLuminance(hex1)
  const lum2 = relativeLuminance(hex2)
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

// =============================================================================
// ADVERSARIAL TEST SUITE (TIER 5: EMPIRICAL CHALLENGER M1)
// =============================================================================

describe('Tier 5: Adversarial Challenge — Milestone 1 (R4, R5)', () => {

  // ---------------------------------------------------------------------------
  // 1. BASEICON EDGE CASES & ADVERSARIAL INPUTS
  // ---------------------------------------------------------------------------
  describe('1. BaseIcon Edge Cases & Adversarial Robustness', () => {
    it('1.1 gestisce nomi icona vuoti o composti da soli spazi senza interrompere il rendering', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Stringa vuota ""
      const wrapperEmpty = mount(BaseIcon, { props: { name: '' } })
      expect(wrapperEmpty.find('svg').exists()).toBe(true)
      expect(wrapperEmpty.classes()).toContain('base-icon--fallback')
      // Renders fallback question-mark geometry
      expect(wrapperEmpty.html()).toContain('M9.09 9a3 3 0 0 1 5.83 1')

      // Soli spazi "     "
      const wrapperSpaces = mount(BaseIcon, { props: { name: '     ' } })
      expect(wrapperSpaces.find('svg').exists()).toBe(true)
      // Canonical name becomes "" after trim, falling back to question-mark geometry
      expect(wrapperSpaces.html()).toContain('M9.09 9a3 3 0 0 1 5.83 1')
      expect(wrapperSpaces.classes()).toContain('base-icon')

      warnSpy.mockRestore()
    })

    it('1.2 gestisce case-insensitivity e spaziature prima/dopo nei nomi e negli alias', () => {
      // Nome standard con spazi e maiuscole
      const w1 = mount(BaseIcon, { props: { name: '   HoMe   ' } })
      expect(w1.classes()).toContain('base-icon--home')
      expect(w1.html()).toContain('M3 9.5L12 3l9 6.5V20')

      // Alias italiano con maiuscole e spazi
      const w2 = mount(BaseIcon, { props: { name: '  RICERCA  ' } })
      expect(w2.classes()).toContain('base-icon--home')

      const w3 = mount(BaseIcon, { props: { name: '  BLOCCHETTI  ' } })
      expect(w3.classes()).toContain('base-icon--receipt')

      const w4 = mount(BaseIcon, { props: { name: '  Impostazioni  ' } })
      expect(w4.classes()).toContain('base-icon--settings')
    })

    it('1.3 gestisce icone inesistenti con fallback visivo e avviso in console', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const wrapper = mount(BaseIcon, { props: { name: 'alien-spaceship-99' } })
      expect(wrapper.find('svg').exists()).toBe(true)
      expect(wrapper.classes()).toContain('base-icon--alien-spaceship-99')
      // Fallback dashed icon must be present
      expect(wrapper.html()).toContain('M9.09 9a3 3 0 0 1 5.83 1')
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('alien-spaceship-99')
      )

      warnSpy.mockRestore()
    })

    it('1.4 resiste a nomi corrispondenti a proprietà di Object.prototype (Prototype Pollution resilience)', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Test against prototype builtins
      const dangerousNames = ['toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', '__proto__', 'constructor']

      for (const dangerous of dangerousNames) {
        expect(() => {
          const wrapper = mount(BaseIcon, { props: { name: dangerous } })
          expect(wrapper.find('svg').exists()).toBe(true)
        }).not.toThrow()
      }

      warnSpy.mockRestore()
    })

    it('1.5 non esegue iniezioni XSS attraverso il prop title o name', () => {
      const xssPayload = '<script>window.__XSS_TRIGGERED__=true</script><img src=x onerror=alert(1)>'

      const wrapper = mount(BaseIcon, {
        props: {
          name: 'home',
          title: xssPayload,
        },
      })

      // In Vue, <title>{{ title }}</title> must interpolate as text, NOT as raw HTML
      const titleEl = wrapper.find('title')
      expect(titleEl.exists()).toBe(true)
      expect(titleEl.text()).toBe(xssPayload)
      // The raw rendered HTML should escape the < and > inside the title
      expect(wrapper.html()).toContain('&lt;script&gt;window.__XSS_TRIGGERED__=true&lt;/script&gt;')
      expect(wrapper.attributes('aria-label')).toBe(xssPayload)
    })

    it('1.6 normalizza robustamente valori eterogenei del prop size (0, numeri, px, rem, %)', () => {
      const testCases = [
        { input: 0, expected: '0px' },
        { input: '0', expected: '0px' },
        { input: 24, expected: '24px' },
        { input: '24', expected: '24px' },
        { input: '24px', expected: '24px' },
        { input: '1.75rem', expected: '1.75rem' },
        { input: '100%', expected: '100%' },
        { input: 'calc(100% - 8px)', expected: 'calc(100% - 8px)' },
        { input: null, expected: '20px' },
        { input: undefined, expected: '20px' },
        { input: '', expected: '20px' },
      ]

      for (const { input, expected } of testCases) {
        const wrapper = mount(BaseIcon, { props: { name: 'home', size: input } })
        expect(wrapper.attributes('width')).toBe(expected)
        expect(wrapper.attributes('height')).toBe(expected)
      }
    })

    it('1.7 supporta tutti i colori della palette istituzionale con insensibilità al maiuscolo/minuscolo', () => {
      const paletteExpectations = [
        { color: 'primary', expected: 'var(--color-primary, #1a1a1a)' },
        { color: 'PRIMARY', expected: 'var(--color-primary, #1a1a1a)' },
        { color: 'accent', expected: 'var(--color-accent, #b71c1c)' },
        { color: 'CERAIOLO', expected: 'var(--color-accent, #b71c1c)' },
        { color: 'gold', expected: 'var(--color-gold, #c59b27)' },
        { color: 'ORO', expected: 'var(--color-gold, #c59b27)' },
        { color: 'white', expected: '#ffffff' },
        { color: 'BIANCO', expected: '#ffffff' },
        { color: 'warning', expected: 'var(--color-warning, #c2410c)' },
        { color: 'arancione', expected: 'var(--color-warning, #c2410c)' },
        { color: 'info', expected: 'var(--color-info, #0369a1)' },
        { color: 'blue', expected: 'var(--color-info, #0369a1)' },
        { color: 'success', expected: 'var(--color-success, #2e7d32)' },
        { color: 'green', expected: 'var(--color-success, #2e7d32)' },
        { color: 'muted', expected: 'var(--color-text-secondary, #5c6266)' },
        { color: 'secondary', expected: 'var(--color-text-secondary, #5c6266)' },
        { color: 'current', expected: 'currentColor' },
        { color: '', expected: 'currentColor' },
        { color: null, expected: 'currentColor' },
        { color: '#e11d48', expected: '#e11d48' },
      ]

      for (const { color, expected } of paletteExpectations) {
        const wrapper = mount(BaseIcon, { props: { name: 'home', color } })
        expect(wrapper.attributes('stroke')).toBe(expected)
      }
    })

    it('1.8 gestisce strokeWidth custom e default', () => {
      const wDefault = mount(BaseIcon, { props: { name: 'home' } })
      expect(wDefault.attributes('stroke-width')).toBe('1.8')

      const wCustomNum = mount(BaseIcon, { props: { name: 'home', strokeWidth: 2.5 } })
      expect(wCustomNum.attributes('stroke-width')).toBe('2.5')

      const wCustomStr = mount(BaseIcon, { props: { name: 'home', strokeWidth: '3' } })
      expect(wCustomStr.attributes('stroke-width')).toBe('3')
    })

    it('1.9 aggiorna reattivamente gli attributi di accessibilità al cambio del prop title', async () => {
      const wrapper = mount(BaseIcon, { props: { name: 'printer' } })

      // Decorativo di default
      expect(wrapper.attributes('role')).toBe('presentation')
      expect(wrapper.attributes('aria-hidden')).toBe('true')
      expect(wrapper.attributes('aria-label')).toBeUndefined()
      expect(wrapper.find('title').exists()).toBe(false)

      // Aggiornamento reattivo con titolo
      await wrapper.setProps({ title: 'Stampa Resoconto' })
      expect(wrapper.attributes('role')).toBe('img')
      expect(wrapper.attributes('aria-hidden')).toBeUndefined()
      expect(wrapper.attributes('aria-label')).toBe('Stampa Resoconto')
      expect(wrapper.find('title').exists()).toBe(true)
      expect(wrapper.find('title').text()).toBe('Stampa Resoconto')

      // Rimozione reattiva del titolo
      await wrapper.setProps({ title: '' })
      expect(wrapper.attributes('role')).toBe('presentation')
      expect(wrapper.attributes('aria-hidden')).toBe('true')
      expect(wrapper.find('title').exists()).toBe(false)
    })

    it('1.10 aggiorna reattivamente la classe di rotazione spin', async () => {
      const wrapper = mount(BaseIcon, { props: { name: 'refresh-cw', spin: false } })
      expect(wrapper.classes()).not.toContain('base-icon--spin')

      await wrapper.setProps({ spin: true })
      expect(wrapper.classes()).toContain('base-icon--spin')

      await wrapper.setProps({ spin: false })
      expect(wrapper.classes()).not.toContain('base-icon--spin')
    })

    it('1.11 verifica che tutti i 60+ simboli geometrici registrino SVG validi e non vuoti', () => {
      // Catalogo di tutti i simboli dichiarati nel componente
      const allRegisteredIcons = [
        'home', 'refresh-cw', 'rotate-ccw', 'receipt', 'bar-chart', 'settings',
        'search', 'plus', 'check', 'check-circle', 'check-square', 'alert-triangle',
        'alert-circle', 'alert-octagon', 'trash-2', 'download', 'upload', 'edit',
        'x', 'x-circle', 'save', 'printer', 'database', 'chevron-left', 'chevron-right',
        'chevron-up', 'chevron-down', 'user', 'users', 'user-plus', 'user-check',
        'user-x', 'credit-card', 'coins', 'file-text', 'file-spreadsheet', 'ticket',
        'clipboard', 'sun', 'moon', 'flame', 'zap', 'calendar', 'clock', 'loader',
        'sliders', 'map-pin', 'folder', 'shield-check', 'eye', 'trending-up',
        'trending-down', 'scale', 'volume-2', 'volume-x', 'sparkles', 'package',
        'link', 'factory', 'hash', 'keyboard', 'bookmark', 'info', 'circle-slash',
        'inbox', 'fallback'
      ]

      for (const iconName of allRegisteredIcons) {
        const wrapper = mount(BaseIcon, { props: { name: iconName } })
        const innerG = wrapper.find('g')
        expect(innerG.exists()).toBe(true)
        const html = innerG.html()
        expect(html.length).toBeGreaterThan(10)
        // Deve contenere elementi geometrici SVG validi
        const hasGeometry = /<(path|line|polyline|circle|rect|polygon|ellipse)/i.test(html)
        expect(hasGeometry).toBe(true)
      }
    })

    it('1.12 verifica che nessun alias nel dizionario sia dangling (nessuno produce il fallback del punto interrogativo)', () => {
      // Lista di tutti gli alias censiti in BaseIcon.vue
      const testAliases = [
        'ricerca', 'registrazione', 'seriale', 'refresh', 'sync', 'reset',
        'blocchetti', 'ricevuta', 'report', 'chart', 'bar-chart-2', 'grafico',
        'impostazioni', 'cog', 'gear', 'cerca', 'add', 'nuovo', 'ok', 'spunta',
        'success', 'verified', 'warning', 'arretrati', 'alert', 'error', 'blocco',
        'danger', 'pericolo', 'delete', 'trash', 'rimuovi', 'elimina', 'export',
        'scarica', 'import', 'carica', 'modifica', 'pen', 'pencil', 'file-edit',
        'close', 'annulla', 'cancel', 'chiudi', 'salva', 'floppy', 'print',
        'stampa', 'db', 'sqlite', 'backup', 'left', 'arrow-left', 'back',
        'indietro', 'right', 'arrow-right', 'forward', 'avanti', 'up', 'arrow-up',
        'down', 'arrow-down', 'socio', 'anagrafica', 'gruppo', 'manicchia',
        'manicchie', 'people', 'nuovo-socio', 'add-user', 'card', 'tessera',
        'paga', 'pagamento', 'cash', 'quota', 'cassa', 'money', 'euro', 'doc',
        'pdf', 'document', 'excel', 'table', 'tabella', 'appunti', 'elenco',
        'light', 'sole', 'dark', 'luna', 'fuoco', 'cero', 'candela', 'bolt',
        'fulmine', 'turbo', 'lightning', 'data', 'anno', 'history', 'tempo',
        'ora', 'spinner', 'loading', 'caricamento', 'filter', 'filtri', 'tool',
        'builder', 'zona', 'luogo', 'map', 'cartella', 'audit', 'sicurezza',
        'shield', 'view', 'anteprima', 'crescita', 'churn', 'recupero', 'bilancia',
        'audit-quote', 'audio', 'suono', 'mute', 'silenzioso', 'box', 'archivio',
        'collegamento', 'fabbrica', 'numero', 'tastiera', 'shortcuts', 'preset',
        'informazioni', 'circle', 'disattivato', 'target', 'vuoto'
      ]

      for (const alias of testAliases) {
        const wrapper = mount(BaseIcon, { props: { name: alias } })
        expect(wrapper.html()).not.toContain('M9.09 9a3 3 0 0 1 5.83 1')
      }
    })

    it('1.13 supporta viewBox personalizzato e propagazione attributi $attrs (click, data-*)', async () => {
      const clickSpy = vi.fn()
      const wrapper = mount(BaseIcon, {
        props: {
          name: 'home',
          viewBox: '0 0 32 32',
        },
        attrs: {
          'data-testid': 'custom-home-icon',
          class: 'extra-custom-class',
          onClick: clickSpy,
        },
      })

      expect(wrapper.attributes('viewBox')).toBe('0 0 32 32')
      expect(wrapper.attributes('data-testid')).toBe('custom-home-icon')
      expect(wrapper.classes()).toContain('extra-custom-class')
      expect(wrapper.classes()).toContain('base-icon')
      expect(wrapper.classes()).toContain('base-icon--home')

      await wrapper.trigger('click')
      expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    it('1.14 stress test: monta 500 icone eterogenee con combinazioni casuali di props in tempo reale', () => {
      const iconNames = ['home', 'refresh-cw', 'receipt', 'bar-chart', 'settings', 'search', 'coins', 'flame']
      const colors = ['primary', 'accent', 'gold', 'warning', 'info', '#ff0055', 'currentColor']
      const sizes = [16, 20, 24, '1.5rem', '32px']

      const startTime = performance.now()
      for (let i = 0; i < 500; i++) {
        const name = iconNames[i % iconNames.length]
        const color = colors[i % colors.length]
        const size = sizes[i % sizes.length]
        const spin = i % 10 === 0
        const title = i % 5 === 0 ? `Icona ${i}` : ''

        const wrapper = mount(BaseIcon, {
          props: { name, color, size, spin, title },
        })

        expect(wrapper.find('svg').exists()).toBe(true)
      }
      const elapsedMs = performance.now() - startTime

      // 500 montaggi di componenti SVG non devono superare 2500ms in ambiente JSDOM
      expect(elapsedMs).toBeLessThan(2500)
    })
  })

  // ---------------------------------------------------------------------------
  // 2. MATHEMATICAL WCAG 2.2 CONTRAST ORACLE
  // ---------------------------------------------------------------------------
  describe('2. Mathematical WCAG 2.2 Contrast Conformance', () => {
    it('2.1 Light Mode: tutti i token primari, warning e info superano il ratio AA (>= 4.5:1) su bianco (#ffffff)', () => {
      const surfaceLight = '#ffffff'

      const textPrimary = '#1a1a1a'
      const textSecondary = '#5c6266'
      const accent = '#b71c1c'
      const warning = '#c2410c'
      const info = '#0369a1'
      const success = '#2e7d32'

      const ratioPrimary = contrastRatio(textPrimary, surfaceLight)
      const ratioSecondary = contrastRatio(textSecondary, surfaceLight)
      const ratioAccent = contrastRatio(accent, surfaceLight)
      const ratioWarning = contrastRatio(warning, surfaceLight)
      const ratioInfo = contrastRatio(info, surfaceLight)
      const ratioSuccess = contrastRatio(success, surfaceLight)

      // Test Primary Text: AAA compliant (>= 7.0:1)
      expect(ratioPrimary).toBeGreaterThanOrEqual(7.0)

      // Test Secondary Text: AA compliant (>= 4.5:1)
      expect(ratioSecondary).toBeGreaterThanOrEqual(4.5)

      // Test Accent Santantoniari: AA compliant (>= 4.5:1)
      expect(ratioAccent).toBeGreaterThanOrEqual(4.5)

      // Test WCAG 2.2 Requirement R5: Warning (#c2410c) must be >= 4.5:1
      expect(ratioWarning).toBeGreaterThanOrEqual(4.5)
      expect(ratioWarning).toBeCloseTo(5.18, 1)

      // Test WCAG 2.2 Requirement R5: Info (#0369a1) must be >= 4.5:1
      expect(ratioInfo).toBeGreaterThanOrEqual(4.5)
      expect(ratioInfo).toBeCloseTo(5.93, 1)

      // Test Success (#2e7d32): AA compliant (>= 4.5:1)
      expect(ratioSuccess).toBeGreaterThanOrEqual(4.5)
    })

    it('2.2 Light Mode: i token rimangono conformi anche sullo sfondo grigio chiaro dell\'app (#f4f5f7)', () => {
      const bgLight = '#f4f5f7'

      expect(contrastRatio('#1a1a1a', bgLight)).toBeGreaterThanOrEqual(7.0)
      expect(contrastRatio('#5c6266', bgLight)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio('#b71c1c', bgLight)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio('#c2410c', bgLight)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio('#0369a1', bgLight)).toBeGreaterThanOrEqual(4.5)
    })

    it('2.3 Dark Mode: tutti i token primari, warning e info superano il ratio AA (>= 4.5:1) su superficie scura (#1e1e1e)', () => {
      const surfaceDark = '#1e1e1e'

      const textPrimaryDark = '#e0e0e0'
      const textSecondaryDark = '#a0a0a0'
      const accentDark = '#ef5350'
      const warningDark = '#ffa726'
      const infoDark = '#38bdf8'
      const successDark = '#66bb6a'

      const ratioPrimary = contrastRatio(textPrimaryDark, surfaceDark)
      const ratioSecondary = contrastRatio(textSecondaryDark, surfaceDark)
      const ratioAccent = contrastRatio(accentDark, surfaceDark)
      const ratioWarning = contrastRatio(warningDark, surfaceDark)
      const ratioInfo = contrastRatio(infoDark, surfaceDark)
      const ratioSuccess = contrastRatio(successDark, surfaceDark)

      expect(ratioPrimary).toBeGreaterThanOrEqual(7.0)
      expect(ratioSecondary).toBeGreaterThanOrEqual(4.5)
      expect(ratioAccent).toBeGreaterThanOrEqual(4.5)
      expect(ratioWarning).toBeGreaterThanOrEqual(7.0) // Dark warning qualifies for AAA (8.58:1)
      expect(ratioInfo).toBeGreaterThanOrEqual(7.0)    // Dark info qualifies for AAA (7.78:1)
      expect(ratioSuccess).toBeGreaterThanOrEqual(4.5)
    })

    it('2.4 Contro-prova: i vecchi colori deprecati fallivano effettivamente WCAG 2.2 AA (< 4.5:1)', () => {
      const oldWarning = '#ed6c02'
      const oldInfo = '#0288d1'
      const surfaceLight = '#ffffff'

      const oldWarningRatio = contrastRatio(oldWarning, surfaceLight)
      const oldInfoRatio = contrastRatio(oldInfo, surfaceLight)

      // Fallivano lo standard minimo AA (4.5:1)
      expect(oldWarningRatio).toBeLessThan(4.5) // ~3.11:1
      expect(oldInfoRatio).toBeLessThan(4.5)    // ~3.86:1

      // Dimostra il miglioramento quantitativo
      const newWarningRatio = contrastRatio('#c2410c', surfaceLight)
      const newInfoRatio = contrastRatio('#0369a1', surfaceLight)

      expect(newWarningRatio - oldWarningRatio).toBeGreaterThan(1.5)
      expect(newInfoRatio - oldInfoRatio).toBeGreaterThan(1.5)
    })
  })

  // ---------------------------------------------------------------------------
  // 3. OFFLINE AUTONOMY & ZERO NETWORK DEPENDENCIES (R5)
  // ---------------------------------------------------------------------------
  describe('3. Offline Autonomy & Zero Remote Asset Dependencies', () => {
    it('3.1 main.css non contiene chiamate di rete remote a Google Fonts o CDN esterne', () => {
      const cssPath = resolve(__dirname, '../assets/main.css')
      const cssContent = readFileSync(cssPath, 'utf-8')

      // Zero import remoti
      expect(cssContent).not.toContain('fonts.googleapis.com')
      expect(cssContent).not.toContain('fonts.gstatic.com')
      expect(cssContent).not.toContain('@import url(')

      // Stack di sistema nativo offline presente
      expect(cssContent).toContain('--font-family-sans: system-ui')
      expect(cssContent).toContain('font-size: 17px')
    })

    it('3.2 index.html non include font o asset esterni remoti', () => {
      const htmlPath = resolve(__dirname, '../../index.html')
      const htmlContent = readFileSync(htmlPath, 'utf-8')

      expect(htmlContent).not.toContain('googleapis')
      expect(htmlContent).not.toContain('gstatic')
      expect(htmlContent).not.toContain('http://')
      expect(htmlContent).not.toContain('https://')
    })

    it('3.3 main.css definisce le regole ergonomiche delle tabelle (48-52px, tabular-nums, zebratura)', () => {
      const cssPath = resolve(__dirname, '../assets/main.css')
      const cssContent = readFileSync(cssPath, 'utf-8')

      // Altezza ergonomica riga 48-52px
      expect(cssContent).toContain('min-height: 48px')
      expect(cssContent).toContain('height: 50px')

      // Allineamento contabile
      expect(cssContent).toContain('tabular-nums')
      expect(cssContent).toContain("font-feature-settings: 'tnum' 1")
      expect(cssContent).toContain('text-align: right !important')

      // Zebratura alternata
      expect(cssContent).toContain('tbody tr:nth-child(even)')
    })
  })

  // ---------------------------------------------------------------------------
  // 4. HEADER NAVIGATION & THEME SELECTOR ISOLATION (R5)
  // ---------------------------------------------------------------------------
  describe('4. Header Navigation & Settings Theme Isolation', () => {
    it('4.1 App.vue non contiene bottoni toggle tema nell\'header principale', () => {
      const appPath = resolve(__dirname, '../App.vue')
      const appContent = readFileSync(appPath, 'utf-8')

      // Tasto fiamma / candela rimosso
      expect(appContent).not.toContain('theme-toggle')
      expect(appContent).not.toContain('🕯️')
      expect(appContent).not.toContain('🔥')

      // Header usa le icone BaseIcon per i 5 percorsi principali
      expect(appContent).toContain('<BaseIcon name="home"')
      expect(appContent).toContain('<BaseIcon name="refresh-cw"')
      expect(appContent).toContain('<BaseIcon name="receipt"')
      expect(appContent).toContain('<BaseIcon name="bar-chart"')
      expect(appContent).toContain('<BaseIcon name="settings"')
    })

    it('4.2 SettingsView.vue contiene il selettore del tema con card radio accessibili', () => {
      const settingsPath = resolve(__dirname, '../views/SettingsView.vue')
      const settingsContent = readFileSync(settingsPath, 'utf-8')

      // Card tematiche presenti
      expect(settingsContent).toContain("selectTheme('light')")
      expect(settingsContent).toContain("selectTheme('dark')")
      expect(settingsContent).toContain('Tema Chiaro')
      expect(settingsContent).toContain('Tema Scuro')
      expect(settingsContent).toContain('role="radio"')
    })
  })
})
