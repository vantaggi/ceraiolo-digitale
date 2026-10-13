import fs from 'fs'
import path from 'path'

const projectRoot = path.resolve('c:/Users/cioti/Desktop/PROGETTI/ceraiolo-digitale')
const srcDir = path.resolve(projectRoot, 'src')

console.log('--- 1. SCANNING FOR RESIDUAL EMOJIS & RAW GLYPHS IN src/ ---')

const emojiRegex = /[\p{Extended_Pictographic}\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}]/u
const rawGlyphRegex = /[✕✓✗◀▶📱✖✔]/u

let scannedFilesCount = 0
let emojiViolations = []
let rawGlyphViolations = []

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue
      walkDir(fullPath)
    } else if (entry.isFile()) {
      if (!/\.(vue|js|css|html)$/.test(entry.name)) continue
      if (entry.name.endsWith('.test.js') || entry.name.endsWith('.spec.js')) continue

      scannedFilesCount++
      const content = fs.readFileSync(fullPath, 'utf8')
      const lines = content.split('\n')

      lines.forEach((line, index) => {
        if (emojiRegex.test(line)) {
          emojiViolations.push({ file: path.relative(projectRoot, fullPath), line: index + 1, text: line.trim() })
        }
        if (rawGlyphRegex.test(line)) {
          rawGlyphViolations.push({ file: path.relative(projectRoot, fullPath), line: index + 1, text: line.trim() })
        }
      })
    }
  }
}

walkDir(srcDir)

console.log(`Scanned ${scannedFilesCount} source files in src/`)
console.log(`Emoji violations found: ${emojiViolations.length}`)
if (emojiViolations.length > 0) {
  console.log('Emoji violations:', JSON.stringify(emojiViolations, null, 2))
}
console.log(`Raw glyph violations found: ${rawGlyphViolations.length}`)
if (rawGlyphViolations.length > 0) {
  console.log('Raw glyph violations:', JSON.stringify(rawGlyphViolations, null, 2))
}

console.log('\n--- 2. VERIFYING BASEICON ICONS & ALIASES RESOLUTION ---')
const baseIconContent = fs.readFileSync(path.resolve(srcDir, 'components/common/BaseIcon.vue'), 'utf8')

const iconsMatch = baseIconContent.match(/const ICONS = \{([\s\S]*?)\n\}/)
const aliasesMatch = baseIconContent.match(/const ALIASES = \{([\s\S]*?)\n\}/)

const registeredIcons = new Set()
if (iconsMatch) {
  const iconKeys = [...iconsMatch[1].matchAll(/(?:'([^']+)'|([a-zA-Z0-9_-]+))\s*:/g)].map(m => m[1] || m[2])
  iconKeys.forEach(k => registeredIcons.add(k.toLowerCase().trim()))
}
if (aliasesMatch) {
  const aliasKeys = [...aliasesMatch[1].matchAll(/(?:'([^']+)'|([a-zA-Z0-9_-]+))\s*:/g)].map(m => m[1] || m[2])
  aliasKeys.forEach(k => registeredIcons.add(k.toLowerCase().trim()))
}

console.log(`Total registered BaseIcon names/aliases: ${registeredIcons.size}`)

// Find all icon usages across .vue files
const iconUsages = []
const missingIcons = []

function scanIcons(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue
      scanIcons(fullPath)
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      const content = fs.readFileSync(fullPath, 'utf8')
      const baseIconTags = [...content.matchAll(/<BaseIcon\b([^>]*)\/?>/g)].map(m => m[1])
      
      for (const attrs of baseIconTags) {
        // Static name="..." (ensure not preceded by :)
        const staticMatch = attrs.match(/(?<!:)\bname=["']([^"']+)["']/)
        if (staticMatch) {
          const name = staticMatch[1].trim()
          iconUsages.push({ name, file: path.relative(projectRoot, fullPath) })
          if (!registeredIcons.has(name.toLowerCase())) {
            missingIcons.push({ name, file: path.relative(projectRoot, fullPath) })
          }
        }

        // Dynamic :name="..."
        const dynamicMatch = attrs.match(/:name=["']([^"']+)["']/)
        if (dynamicMatch) {
          const expr = dynamicMatch[1]
          const stringLiterals = [...expr.matchAll(/'([^']+)'/g)].map(m => m[1])
          for (const name of stringLiterals) {
            iconUsages.push({ name, file: path.relative(projectRoot, fullPath) })
            if (!registeredIcons.has(name.toLowerCase())) {
              missingIcons.push({ name, expr, file: path.relative(projectRoot, fullPath) })
            }
          }
        }
      }
    }
  }
}

scanIcons(srcDir)
console.log(`Scanned ${iconUsages.length} BaseIcon usages across Vue templates`)
console.log(`Missing icon definitions: ${missingIcons.length}`)
if (missingIcons.length > 0) {
  console.log('Missing icons:', JSON.stringify(missingIcons, null, 2))
}

console.log('\n--- 3. VERIFYING ERGONOMICS & ACCESSIBILITY ATTRIBUTES ---')
const addPaymentContent = fs.readFileSync(path.resolve(srcDir, 'components/AddPaymentModal.vue'), 'utf8')
const confirmDeleteContent = fs.readFileSync(path.resolve(srcDir, 'components/ConfirmDeleteModal.vue'), 'utf8')
const errorModalContent = fs.readFileSync(path.resolve(srcDir, 'components/ErrorModal.vue'), 'utf8')
const filterPanelContent = fs.readFileSync(path.resolve(srcDir, 'components/FilterPanel.vue'), 'utf8')
const settingsViewContent = fs.readFileSync(path.resolve(srcDir, 'views/SettingsView.vue'), 'utf8')

const checks = [
  {
    name: 'AddPaymentModal: WAI-ARIA dialog semantics',
    pass: addPaymentContent.includes('role="dialog"') &&
          addPaymentContent.includes('aria-modal="true"') &&
          addPaymentContent.includes('aria-labelledby="modal-payment-title"') &&
          addPaymentContent.includes('@keydown.esc="closeModal"')
  },
  {
    name: 'AddPaymentModal: Senior labels >= 17px & tabular-nums',
    pass: addPaymentContent.includes('font-size: 1.1rem') &&
          addPaymentContent.includes('font-variant-numeric: tabular-nums')
  },
  {
    name: 'AddPaymentModal: Sticky actions & touch targets >= 44px',
    pass: addPaymentContent.includes('position: sticky') &&
          addPaymentContent.includes('min-height: 48px') &&
          addPaymentContent.includes('min-width: 44px')
  },
  {
    name: 'ConfirmDeleteModal: Dialog semantics & ESC dismissal',
    pass: confirmDeleteContent.includes('role="dialog"') &&
          confirmDeleteContent.includes('aria-modal="true"') &&
          confirmDeleteContent.includes('@keydown.esc="closeModal"')
  },
  {
    name: 'ConfirmDeleteModal: Safe Cancel auto-focus & 48px buttons',
    pass: confirmDeleteContent.includes('cancelBtn.value?.focus()') &&
          confirmDeleteContent.includes('min-height: 48px') &&
          confirmDeleteContent.includes('min-width: 44px')
  },
  {
    name: 'ErrorModal: Dialog semantics & ESC dismissal & auto-focus',
    pass: errorModalContent.includes('role="dialog"') &&
          errorModalContent.includes('aria-modal="true"') &&
          errorModalContent.includes('@keydown.esc="$emit(\'close\')"') &&
          errorModalContent.includes('confirmBtn.value?.focus()')
  },
  {
    name: 'ErrorModal: Buttons min-height 48px & close button 44px',
    pass: errorModalContent.includes('min-height: 48px') &&
          errorModalContent.includes('min-width: 44px')
  },
  {
    name: 'FilterPanel: Reset button & active filters badge & grammar',
    pass: filterPanelContent.includes('class="reset-button"') &&
          filterPanelContent.includes('1 filtro attivo') &&
          filterPanelContent.includes('min-height: 44px')
  },
  {
    name: 'SettingsView: 48px buttons & 44px nav items',
    pass: settingsViewContent.includes('min-height: 48px') &&
          settingsViewContent.includes('min-height: 44px')
  },
  {
    name: 'SettingsView: Zone management styling & Santantoniari crimson danger button',
    pass: settingsViewContent.includes('.zones-list-container') &&
          settingsViewContent.includes('.zone-item') &&
          settingsViewContent.includes('.action-button.small.danger {\n  background-color: var(--color-accent);')
  }
]

checks.forEach(c => {
  console.log(`[${c.pass ? 'PASS' : 'FAIL'}] ${c.name}`)
})

const allErgonomicsPass = checks.every(c => c.pass)
console.log(`\nErgonomics checks overall result: ${allErgonomicsPass ? 'ALL PASSED' : 'SOME FAILED'}`)
