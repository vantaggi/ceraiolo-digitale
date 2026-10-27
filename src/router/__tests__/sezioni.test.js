import { describe, it, expect } from 'vitest'
import { SCHEDE_IMPOSTAZIONI, SEZIONI, sezioneDi } from '../sezioni'
import router from '../index'

describe('menu a sezioni', () => {
  it('ogni pagina accende la sua voce del menu', () => {
    expect(sezioneDi('/')).toBe('Soci')
    expect(sezioneDi('/socio/12')).toBe('Soci')
    expect(sezioneDi('/socio/nuovo')).toBe('Soci')
    expect(sezioneDi('/incassi/ricevute')).toBe('Incassi')
    expect(sezioneDi('/incassi/blocchetti')).toBe('Incassi')
    expect(sezioneDi('/report-pdf')).toBe('Report PDF')
    expect(sezioneDi('/report-pdf/su-misura')).toBe('Report PDF')
    expect(sezioneDi('/settings')).toBe('Impostazioni')
  })

  it('il menu ha quattro voci: il grafico sta nella Home', () => {
    expect(SEZIONI.map((s) => s.nome)).toEqual(['Soci', 'Incassi', 'Report PDF', 'Impostazioni'])
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
    expect(arrivo('/statistiche')).toBe('/')
    // e' un rinvio voluto, non la pagina "non trovata" che porta anche lei alla Home
    expect(router.resolve('/statistiche').matched[0].name).not.toBe('not-found')
  })

  it('ogni scheda delle Impostazioni ha il suo indirizzo e accende Impostazioni', () => {
    const schede = SCHEDE_IMPOSTAZIONI.map((t) => {
      const r = router.resolve(t.to)
      expect(sezioneDi(r.path), t.to).toBe('Impostazioni')
      return r.matched[0].props.default.scheda
    })
    expect(schede).toEqual(['generale', 'tessera', 'manicchie', 'dati'])
  })

  it('i vecchi link /settings?tab=... portano alla scheda nuova', () => {
    const impostazioni = router.getRoutes().find((r) => r.path === '/settings')
    const vai = (tab) => impostazioni.beforeEnter({ query: tab ? { tab } : {} })
    expect(vai('dati')).toEqual({ path: '/settings/dati' })
    expect(vai('template')).toEqual({ path: '/settings/tessera' })
    expect(vai('zone')).toEqual({ path: '/settings/manicchie' })
    expect(vai(undefined)).toBe(true)
    expect(vai('inventata')).toBe(true)
  })
})
