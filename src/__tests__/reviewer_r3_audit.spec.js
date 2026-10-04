import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Reviewer R3 Adversarial Audit', () => {
  const baseIconPath = path.resolve(__dirname, '../components/common/BaseIcon.vue')
  const baseIconContent = fs.readFileSync(baseIconPath, 'utf8')

  const iconsMatch = baseIconContent.match(/const ICONS = {([\s\S]*?)\n}/)
  const aliasesMatch = baseIconContent.match(/const ALIASES = {([\s\S]*?)\n}/)

  const iconKeys = new Set()
  const aliasKeys = new Set()

  if (iconsMatch) {
    for (const line of iconsMatch[1].split('\n')) {
      const m = line.match(/'([^']+)'\s*:/)
      if (m) iconKeys.add(m[1])
    }
  }

  if (aliasesMatch) {
    for (const line of aliasesMatch[1].split('\n')) {
      const m = line.match(/(?:'([^']+)'|([a-zA-Z0-9_-]+))\s*:/)
      if (m) aliasKeys.add(m[1] || m[2])
    }
  }

  function findFiles(dir, filterTests = false) {
    let results = []
    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file)
      if (fs.statSync(full).isDirectory()) {
        if (filterTests && file === '__tests__') continue
        results = results.concat(findFiles(full, filterTests))
      } else if (file.endsWith('.vue') || file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
        results.push(full)
      }
    }
    return results
  }

  const srcDir = path.resolve(__dirname, '..')
  const nonTestFiles = findFiles(srcDir, true)

  it('1. verifies that all BaseIcon names across non-test codebase resolve properly', () => {
    const invalidIcons = []
    for (const file of nonTestFiles) {
      if (file === baseIconPath) continue
      const content = fs.readFileSync(file, 'utf8')

      const baseIconTagRegex = /<BaseIcon\b([^>]*?)(?:\/?>|>[\s\S]*?<\/BaseIcon>)/g
      let tagMatch
      while ((tagMatch = baseIconTagRegex.exec(content)) !== null) {
        const attrs = tagMatch[1]

        const staticMatch = attrs.match(/(?<![:\w-])name=["']([^"']+)["']/)
        if (staticMatch) {
          const name = staticMatch[1].toLowerCase().trim()
          if (!iconKeys.has(name) && !aliasKeys.has(name)) {
            invalidIcons.push({ file: path.relative(srcDir, file), name, tag: tagMatch[0], type: 'static' })
          }
        }

        const dynamicMatch = attrs.match(/(?<![\w-]):name=["']([^"']+)["']/)
        if (dynamicMatch) {
          const expr = dynamicMatch[1]
          const literalRegex = /['"]([^'"]+)['"]/g
          let lm
          while ((lm = literalRegex.exec(expr)) !== null) {
            const name = lm[1].toLowerCase().trim()
            if (!iconKeys.has(name) && !aliasKeys.has(name)) {
              invalidIcons.push({ file: path.relative(srcDir, file), name, expr, tag: tagMatch[0], type: 'dynamic' })
            }
          }
        }
      }
    }
    expect(invalidIcons).toEqual([])
  })

  it('2. verifies zero residual emojis or raw special glyphs in non-test src/ files', () => {
    const emojiRegex = /[\p{Extended_Pictographic}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}✕✓✗✖✔]/u
    const matches = []

    for (const file of nonTestFiles) {
      const lines = fs.readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, idx) => {
        if (emojiRegex.test(line)) {
          matches.push({ file: path.relative(srcDir, file), line: idx + 1, content: line.trim() })
        }
      })
    }
    expect(matches).toEqual([])
  })

  it('3. verifies modal dialog accessibility, escape key handlers, and focus management', () => {
    const addPaymentContent = fs.readFileSync(path.resolve(srcDir, 'components/AddPaymentModal.vue'), 'utf8')
    const confirmDeleteContent = fs.readFileSync(path.resolve(srcDir, 'components/ConfirmDeleteModal.vue'), 'utf8')
    const errorModalContent = fs.readFileSync(path.resolve(srcDir, 'components/ErrorModal.vue'), 'utf8')
    const keyboardModalContent = fs.readFileSync(path.resolve(srcDir, 'components/KeyboardShortcutsModal.vue'), 'utf8')

    // AddPaymentModal: Escape key, tabindex, tabular numbers, role dialog, no dark-mode contrast bug
    expect(addPaymentContent).toContain('@keydown.esc="closeModal"')
    expect(addPaymentContent).toContain('tabindex="-1"')
    expect(addPaymentContent).toContain('role="dialog"')
    expect(addPaymentContent).toContain('aria-modal="true"')
    expect(addPaymentContent).toContain('font-variant-numeric: tabular-nums')
    expect(addPaymentContent).toContain('min-height: 48px')
    expect(addPaymentContent).toContain('min-width: 44px')
    expect(addPaymentContent).not.toMatch(/\.cancel-button\s*\{[^}]*background-color:\s*var\(--color-text-secondary\)/)

    // ConfirmDeleteModal: Escape key, tabindex, role dialog, safe cancel auto-focus
    expect(confirmDeleteContent).toContain('@keydown.esc="closeModal"')
    expect(confirmDeleteContent).toContain('tabindex="-1"')
    expect(confirmDeleteContent).toContain('role="dialog"')
    expect(confirmDeleteContent).toContain('ref="cancelBtn"')
    expect(confirmDeleteContent).toContain('cancelBtn.value?.focus()')
    expect(confirmDeleteContent).toContain('min-height: 48px')

    // ErrorModal: Escape key, tabindex, role dialog, confirm auto-focus
    expect(errorModalContent).toContain('@keydown.esc="$emit(\'close\')"')
    expect(errorModalContent).toContain('tabindex="-1"')
    expect(errorModalContent).toContain('role="dialog"')
    expect(errorModalContent).toContain('ref="confirmBtn"')
    expect(errorModalContent).toContain('confirmBtn.value?.focus()')
    expect(errorModalContent).toContain('min-height: 48px')

    // KeyboardShortcutsModal: Escape key, tabindex, role dialog, close auto-focus
    expect(keyboardModalContent).toContain('@keydown.esc="$emit(\'close\')"')
    expect(keyboardModalContent).toContain('tabindex="-1"')
    expect(keyboardModalContent).toContain('role="dialog"')
    expect(keyboardModalContent).toContain('ref="closeBtn"')
    expect(keyboardModalContent).toContain('closeBtn.value?.focus()')
  })

  it('4. verifies FilterPanel ergonomics, dark mode select option contrast, and singular/plural grammar', () => {
    const filterPanelContent = fs.readFileSync(path.resolve(srcDir, 'components/FilterPanel.vue'), 'utf8')

    expect(filterPanelContent).toContain('1 filtro attivo')
    expect(filterPanelContent).toContain('.filter-select option')
    expect(filterPanelContent).toContain('.reset-button')
    expect(filterPanelContent).toContain('min-height: 44px')
    expect(filterPanelContent).not.toMatch(/\.reset-button\s*\{[^}]*background-color:\s*var\(--color-text-secondary\)/)
  })

  it('5. verifies SettingsView senior touch targets, backup-toggle-button base styles, and zone management', () => {
    const settingsContent = fs.readFileSync(path.resolve(srcDir, 'views/SettingsView.vue'), 'utf8')

    // Base definition of backup-toggle-button exists with min-height: 48px and color: white on active
    expect(settingsContent).toMatch(/\.backup-toggle-button\s*\{[^}]*min-height:\s*48px/)
    expect(settingsContent).toMatch(/\.backup-toggle-button\.active\s*\{[^}]*color:\s*white/)

    // Danger small button uses accent red
    expect(settingsContent).toMatch(/\.action-button\.small\.danger\s*\{[^}]*background-color:\s*var\(--color-accent\)/)

    // Action button min-height: 48px
    expect(settingsContent).toMatch(/\.action-button\s*\{[^}]*min-height:\s*48px/)

    // Nav-item min-height: 44px and flex alignment
    expect(settingsContent).toMatch(/\.nav-item\s*\{[^}]*min-height:\s*44px/)
    expect(settingsContent).toMatch(/\.nav-item\s*\{[^}]*display:\s*flex/)

    // editInput ref declared and used with nextTick focus
    expect(settingsContent).toContain('const editInput = ref(null)')
    expect(settingsContent).toContain('input?.focus()')
  })
})
