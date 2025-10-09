import { vi } from 'vitest'

class MockURL {
  constructor(url) {
    this.href = url
  }
  toString() {
    return this.href
  }
  get protocol() {
    return 'https:'
  }
  get hostname() {
    return 'localhost'
  }
}

vi.mock('whatwg-url', async () => {
  return {
    URL: MockURL,
  }
})
