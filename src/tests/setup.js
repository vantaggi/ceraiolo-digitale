import { vi } from 'vitest'

class MockURL {
  constructor(url) {
    this.href = url
  }
  toString() {
    return this.href
  }
}

vi.stubGlobal('URL', MockURL)
