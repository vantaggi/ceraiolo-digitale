import { describe, it, expect } from 'vitest'
import { righeDatiComputer } from '../datiComputer'

const adesso = new Date('2026-10-31T12:00:00')
const backupAttivo = {
  supportato: true,
  cartella: true,
  attivo: true,
  autorizzato: true,
  percorso: 'Documenti/Backup',
  ultimo: '2026-10-31T11:50:00',
}
const base = {
  indirizzo: 'vantaggi.github.io/ceraiolo-digitale',
  conteggi: { soci: 1234, pagamenti: 15678 },
  protetti: true,
  backup: backupAttivo,
  versione: '2026-10-30T09:00:00Z',
  adesso,
}
const riga = (righe, id) => righe.find((r) => r.id === id)

describe('righeDatiComputer (Impostazioni › Dati)', () => {
  it("tutte le righe sono di sola lettura, nell'ordine dove, contenuto, conservazione, backup, versione", () => {
    const righe = righeDatiComputer(base)
    expect(righe.map((r) => r.id)).toEqual([
      'dove',
      'contenuto',
      'conservazione',
      'backup',
      'versione',
    ])
    expect(righe.every((r) => r.readonly)).toBe(true)
  })

  it("dice l'indirizzo e i numeri all'italiana (il punto dalle cinque cifre)", () => {
    const righe = righeDatiComputer(base)
    expect(riga(righe, 'dove').value).toBe('vantaggi.github.io/ceraiolo-digitale')
    expect(riga(righe, 'contenuto').value).toBe('1234 soci, 15.678 pagamenti')
  })

  it('finche i conteggi non sono letti mostra i puntini', () => {
    expect(riga(righeDatiComputer({ ...base, conteggi: null }), 'contenuto').value).toBe('…')
  })

  it.each([
    [true, 'Protetti', 'ok'],
    [false, 'Non protetti', 'attenzione'],
    [null, 'Non si sa', 'attenzione'],
  ])('conservazione con persisted() = %s: %s', (protetti, valore, tono) => {
    const r = riga(righeDatiComputer({ ...base, protetti }), 'conservazione')
    expect(r.value).toBe(valore)
    expect(r.tone).toBe(tono)
  })

  it.each([
    [{ supportato: false }, 'Non disponibile', 'attenzione'],
    [{ cartella: false }, 'Spento', 'attenzione'],
    [{ attivo: false }, 'Spento', 'attenzione'],
    [{ autorizzato: false }, 'In pausa', 'attenzione'],
    [{}, 'Attivo · ultimo 10 min fa', undefined],
    [{ ultimo: null }, 'Attivo · ultimo mai', undefined],
  ])('backup %o: %s', (cambio, valore, tono) => {
    const r = riga(righeDatiComputer({ ...base, backup: { ...backupAttivo, ...cambio } }), 'backup')
    expect(r.value).toBe(valore)
    expect(r.tone).toBe(tono)
  })

  it('il backup attivo dice la cartella', () => {
    expect(riga(righeDatiComputer(base), 'backup').help).toBe('Cartella: Documenti/Backup')
  })

  it("la versione e' la data della build in italiano, '-' se manca", () => {
    expect(riga(righeDatiComputer(base), 'versione').value).toBe('30 ottobre 2026')
    expect(riga(righeDatiComputer({ ...base, versione: '' }), 'versione').value).toBe('-')
  })
})
