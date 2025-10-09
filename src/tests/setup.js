import { vi } from 'vitest'

vi.mock('whatwg-url', async () => {
  return {
    URL: class MockURL {
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
    },
  }
})

vi.mock('jsdom', async () => {
  const jsdom = await vi.importActual('jsdom')

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

  return {
    default: {
      JSDOM: class {
        constructor(html, options) {
          const dom = new jsdom.JSDOM(html, options)
          this.window = dom.window
          this.window.URL = MockURL
          this.window.document = dom.window.document
          return this
        }
      },
    },
  }
})
