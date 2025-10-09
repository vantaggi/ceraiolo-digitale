import { vi } from 'vitest'

vi.mock('whatwg-url', () => {
  return {
    URL: vi.fn(),
  }
})
