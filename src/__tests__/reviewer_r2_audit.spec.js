import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Reviewer R2 Adversarial Audit', () => {
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

  it('verifies that all BaseIcon names (static and dynamic) resolve properly', () => {
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

  it('verifies zero residual emojis or special character glyphs across non-test src/ files', () => {
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

  it('verifies senior ergonomics and touch target specifications across modals and settings', () => {
    const addPaymentContent = fs.readFileSync(path.resolve(srcDir, 'components/AddPaymentModal.vue'), 'utf8')
    const confirmDeleteContent = fs.readFileSync(path.resolve(srcDir, 'components/ConfirmDeleteModal.vue'), 'utf8')
    const errorModalContent = fs.readFileSync(path.resolve(srcDir, 'components/ErrorModal.vue'), 'utf8')
    const settingsContent = fs.readFileSync(path.resolve(srcDir, 'views/SettingsView.vue'), 'utf8')

    // AddPaymentModal
    expect(addPaymentContent).toContain('font-variant-numeric: tabular-nums')
    expect(addPaymentContent).toContain('min-height: 48px')
    expect(addPaymentContent).toContain('min-width: 44px')
    expect(addPaymentContent).toContain('role="dialog"')
    expect(addPaymentContent).not.toContain("import('@/services/db')")

    // ConfirmDeleteModal
    expect(confirmDeleteContent).toContain('min-height: 48px')
    expect(confirmDeleteContent).toContain('min-width: 44px')
    expect(confirmDeleteContent).toContain('role="dialog"')

    // ErrorModal
    expect(errorModalContent).toContain('min-height: 48px')
    expect(errorModalContent).toContain('min-width: 44px')
    expect(errorModalContent).toContain('role="dialog"')

    // SettingsView: Zone Management styles present
    expect(settingsContent).toContain('.zone-actions')
    expect(settingsContent).toContain('.add-zone-form')
    expect(settingsContent).toContain('.zones-list')
    expect(settingsContent).toContain('.zone-item')
    expect(settingsContent).toContain('.action-button.small.danger')
    expect(settingsContent).toContain('.action-button.small.success')
    expect(settingsContent).toContain('.action-button.btn-success')
    expect(settingsContent).toContain('.file-input-compact')
  })
})
