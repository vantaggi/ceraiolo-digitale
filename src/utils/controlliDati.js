/**
 * Controlli dati (Impostazioni > Dati): soci con dati mancanti, incoerenti o ambigui.
 * Solo avvisi: nessun dato viene cambiato. I sei controlli dopo i primi li ha chiesti
 * Cioti il 10 novembre 2026 (data scritta male, doppioni, due pagamenti nello stesso
 * anno, pagamento prima della nascita, pagamento da 0 euro da maggiorenne, manicchia
 * scritta in modi diversi).
 */
import { isMinorenne } from './payment'

/** Chiavi del riepilogo, nell'ordine in cui si mostrano. */
export const VOCI_CONTROLLO = {
  missing_dob: 'Senza data di nascita',
  invalid_dob: 'Data di nascita scritta male',
  missing_pob: 'Senza luogo di nascita',
  missing_reg_date: 'Senza data di iscrizione',
  future_reg: 'Iscrizione nel futuro',
  invalid_reg_date: 'Iscrizione dopo il primo pagamento',
  missing_group: 'Senza manicchia',
  group_spelling: 'Manicchia scritta in modo diverso',
  duplicate: 'Possibili doppioni',
  double_payment: 'Due pagamenti nello stesso anno',
  payment_before_birth: 'Pagamento prima della nascita',
  zero_payment: 'Pagamento da 0 € da maggiorenne',
}

const testo = (v) => (v === null || v === undefined ? '' : String(v))

/**
 * Data nel formato dell'archivio, AAAA-MM-GG, e vera (niente 1990-02-30 o 1990-00-00).
 * @param {string} data
 * @returns {boolean}
 */
export function dataNascitaValida(data) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(testo(data))
  if (!m) return false
  const [anno, mese, giorno] = m.slice(1).map(Number)
  const d = new Date(Date.UTC(anno, mese - 1, giorno))
  return d.getUTCFullYear() === anno && d.getUTCMonth() === mese - 1 && d.getUTCDate() === giorno
}

/** Nome o manicchia confrontabile: minuscolo, senza accenti e senza spazi in piu'. */
const normalizza = (v) =>
  testo(v).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')

/**
 * Manicchie scritte in piu' modi. Si segnala chi non usa la scrittura piu' usata; a pari
 * numero non c'e' una scrittura giusta e si segnalano tutti.
 * @param {Array<object>} soci
 * @returns {Map<string, string[]>} scrittura da controllare -> le altre scritture
 */
function scrittureDiverse(soci) {
  const perChiave = new Map()
  for (const s of soci) {
    const nome = testo(s.gruppo_appartenenza)
    if (!nome.trim()) continue
    const chiave = normalizza(nome)
    if (!perChiave.has(chiave)) perChiave.set(chiave, new Map())
    const conta = perChiave.get(chiave)
    conta.set(nome, (conta.get(nome) || 0) + 1)
  }
  const diverse = new Map()
  for (const conta of perChiave.values()) {
    if (conta.size < 2) continue
    const massimo = Math.max(...conta.values())
    const piuUsate = [...conta.keys()].filter((n) => conta.get(n) === massimo)
    const giusta = piuUsate.length === 1 ? piuUsate[0] : null
    for (const nome of conta.keys()) {
      if (nome === giusta) continue
      diverse.set(
        nome,
        [...conta.keys()].filter((n) => n !== nome),
      )
    }
  }
  return diverse
}

/**
 * @param {Array<object>} soci
 * @param {Array<{ id_socio: number, anno: number|string, quota_pagata?: number|string|null }>} tesseramenti
 * @param {number} annoOggi - per "iscrizione nel futuro"
 * @returns {{ summary: Record<string, number>, details: Array<{ id: number, nome: string, cognome: string, issues: string[] }> }}
 */
export function controllaDati(soci, tesseramenti, annoOggi) {
  const summary = Object.fromEntries(Object.keys(VOCI_CONTROLLO).map((k) => [k, 0]))
  const pagamenti = new Map()
  for (const t of tesseramenti) {
    if (!pagamenti.has(t.id_socio)) pagamenti.set(t.id_socio, [])
    pagamenti.get(t.id_socio).push(t)
  }

  // Doppioni: stesso cognome, nome e data di nascita
  const perPersona = new Map()
  for (const s of soci) {
    if (!normalizza(s.cognome) || !normalizza(s.nome) || !testo(s.data_nascita)) continue
    const chiave = `${normalizza(s.cognome)}|${normalizza(s.nome)}|${testo(s.data_nascita)}`
    if (!perPersona.has(chiave)) perPersona.set(chiave, [])
    perPersona.get(chiave).push(s)
  }
  const manicchie = scrittureDiverse(soci)

  const details = []
  for (const socio of soci) {
    const issues = []
    const segna = (chiave, messaggio) => {
      issues.push(messaggio)
      summary[chiave]++
    }
    const suoi = pagamenti.get(socio.id) || []
    const anni = suoi.map((t) => Number(t.anno)).filter(Number.isFinite)
    const dataValida = dataNascitaValida(socio.data_nascita)

    if (!testo(socio.data_nascita).trim()) segna('missing_dob', 'Data Nascita mancante')
    else if (!dataValida) {
      segna('invalid_dob', `Data di nascita scritta male (${testo(socio.data_nascita)})`)
    }

    if (!testo(socio.luogo_nascita).trim()) segna('missing_pob', 'Luogo Nascita mancante')

    // Senza anno di iscrizione basta un pagamento: il primo vale come iscrizione
    if (!socio.data_prima_iscrizione) {
      if (suoi.length === 0) {
        segna('missing_reg_date', 'Data Iscrizione mancante (e nessun pagamento)')
      }
    } else {
      const regYear = parseInt(socio.data_prima_iscrizione)
      if (regYear > annoOggi) segna('future_reg', `Iscrizione nel futuro (${regYear})`)
      else if (anni.length > 0 && regYear > Math.min(...anni)) {
        segna(
          'invalid_reg_date',
          `Iscrizione illogica: Registrato nel ${regYear}, ma ha pagato nel ${Math.min(...anni)}`,
        )
      }
    }

    if (!testo(socio.gruppo_appartenenza).trim()) segna('missing_group', 'Gruppo non assegnato')
    else if (manicchie.has(socio.gruppo_appartenenza)) {
      const altre = manicchie.get(socio.gruppo_appartenenza).map((n) => `"${n}"`)
      segna(
        'group_spelling',
        `Manicchia "${socio.gruppo_appartenenza}" scritta anche come ${altre.join(', ')}`,
      )
    }

    const stessi = perPersona.get(
      `${normalizza(socio.cognome)}|${normalizza(socio.nome)}|${testo(socio.data_nascita)}`,
    )
    if (stessi && stessi.length > 1) {
      const altri = stessi.filter((s) => s !== socio).map((s) => `n. ${s.id}`)
      segna('duplicate', `Possibile doppione (stessi nome e data di nascita: ${altri.join(', ')})`)
    }

    const doppi = [...new Set(anni.filter((a, i) => anni.indexOf(a) !== i))].sort()
    if (doppi.length > 0) {
      segna('double_payment', `Due pagamenti nello stesso anno (${doppi.join(', ')})`)
    }

    if (dataValida) {
      const nascita = Number(testo(socio.data_nascita).slice(0, 4))
      const prima = [...new Set(anni.filter((a) => a < nascita))].sort()
      if (prima.length > 0) {
        segna(
          'payment_before_birth',
          `Pagamento prima della nascita (${prima.join(', ')}, nato nel ${nascita})`,
        )
      }
    }

    // Da maggiorenne, o senza data valida (conta come maggiorenne): l'offerta da 0 di un
    // minorenne va bene
    const aZero = suoi
      .filter((t) => !(Number(t.quota_pagata) > 0))
      .map((t) => Number(t.anno))
      .filter((a) => Number.isFinite(a) && !isMinorenne(socio.data_nascita, a))
    if (aZero.length > 0) {
      segna(
        'zero_payment',
        `Pagamento da 0 € da maggiorenne (${[...new Set(aZero)].sort().join(', ')})`,
      )
    }

    if (issues.length > 0) {
      details.push({ id: socio.id, nome: socio.nome, cognome: socio.cognome, issues })
    }
  }

  summary.total_issues = details.length
  details.sort((a, b) => testo(a.cognome).localeCompare(testo(b.cognome)))
  return { summary, details }
}
