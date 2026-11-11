import { describe, it, expect, vi } from 'vitest'
import { chiediProtezioneDati } from '../proteggiDati'

describe('protezione dei dati nel browser (navigator.storage.persist)', () => {
  it('se non sono protetti lo chiede al browser e riferisce la risposta', async () => {
    const storage = { persisted: vi.fn(async () => false), persist: vi.fn(async () => true) }
    expect(await chiediProtezioneDati(storage)).toBe(true)
    expect(storage.persist).toHaveBeenCalledTimes(1)
  })

  it("se sono gia' protetti non chiede di nuovo", async () => {
    const storage = { persisted: vi.fn(async () => true), persist: vi.fn() }
    expect(await chiediProtezioneDati(storage)).toBe(true)
    expect(storage.persist).not.toHaveBeenCalled()
  })

  it('se il browser dice di no risponde false', async () => {
    const storage = { persisted: async () => false, persist: async () => false }
    expect(await chiediProtezioneDati(storage)).toBe(false)
  })

  it('un browser che non sa chiedere dice solo come stanno', async () => {
    expect(await chiediProtezioneDati({ persisted: async () => false })).toBe(false)
    expect(await chiediProtezioneDati({})).toBeNull()
    expect(await chiediProtezioneDati(undefined)).toBeNull()
  })

  it("un errore del browser non ferma l'app", async () => {
    const storage = {
      persisted: async () => false,
      persist: async () => {
        throw new Error('no')
      },
    }
    expect(await chiediProtezioneDati(storage)).toBeNull()
  })
})
