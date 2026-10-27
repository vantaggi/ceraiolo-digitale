import { describe, it, expect } from 'vitest'
import { SEZIONI, sezioneDi } from '../sezioni'
import router from '../index'

describe('menu a cinque sezioni', () => {
  it('ogni pagina accende la sua voce del menu', () => {
    expect(sezioneDi('/')).toBe('Soci')
    expect(sezioneDi('/socio/12')).toBe('Soci')
    expect(sezioneDi('/socio/nuovo')).toBe('Soci')
    expect(sezioneDi('/incassi/ricevute')).toBe('Incassi')
    expect(sezioneDi('/incassi/blocchetti')).toBe('Incassi')
    expect(sezioneDi('/report-pdf')).toBe('Report PDF')
    expect(sezioneDi('/report-pdf/su-misura')).toBe('Report PDF')
    expect(sezioneDi('/statistiche')).toBe('Statistiche')
    expect(sezioneDi('/settings')).toBe('Impostazioni')
  })

  it('un indirizzo che inizia solo come una sezione non la accende', () => {
    expect(sezioneDi('/sociologia')).toBeNull()
    expect(sezioneDi('/import')).toBeNull()
  })

  it('ogni voce del menu porta a una pagina che esiste', () => {
    for (const s of SEZIONI) {
      expect(router.resolve(s.to).name, s.to).not.toBe('not-found')
    }
  })

  it('i vecchi indirizzi portano alla pagina nuova', () => {
    const arrivo = (path) => {
      const r = router.resolve(path)
      return r.matched[0]?.redirect ?? r.path
    }
    expect(arrivo('/registrazione-seriale')).toBe('/incassi/ricevute')
    expect(arrivo('/blocchetti')).toBe('/incassi/blocchetti')
    expect(arrivo('/reports')).toBe('/report-pdf')
    expect(arrivo('/reports-beta')).toBe('/report-pdf/su-misura')
    expect(arrivo('/incassi')).toBe('/incassi/ricevute')
  })
})
