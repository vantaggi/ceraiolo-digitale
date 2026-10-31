/**
 * Motore del Report su misura: dato lo stato della pagina (filtri, colonne, ordine)
 * restituisce le righe, le colonne e le parole che li descrivono. La pagina mostra
 * l'anteprima e il PDF la stampa partendo dallo stesso risultato, quindi le due cose
 * hanno le stesse colonne nello stesso ordine.
 *
 * Un solo anno di riferimento vale per tutto il report: eta' (dal solo anno di nascita),
 * pagato o no, arretrati e diritto di voto si calcolano per quell'anno.
 */
import { calculatePaymentStatus, descriviArretrati, isMinorenne, statoAnno } from './payment'
import { valutaDirittoVoto } from './voto'
import { SENZA_MANICCHIA } from './aventiDiritto'

export { SENZA_MANICCHIA }

/** Anni indietro rispetto al riferimento per "solo soci attivi". */
export const ANNI_ATTIVITA = 5

/** Colonne disponibili, nell'ordine in cui si propongono. */
export const COLONNE = {
  cognomeNome: { label: 'Socio', pdf: 50 },
  gruppo: { label: 'Manicchia', pdf: 35 },
  dataNascita: { label: 'Nascita', pdf: 22 },
  eta: { label: 'Età', pdf: 25 },
  dirittoVoto: { label: 'Diritto di voto', pdf: 30, align: 'center' },
  motivoEsclusione: { label: 'Motivo', pdf: 45 },
  arretrati: { label: 'Arretrati', pdf: 30 },
  firma: { label: 'Firma', pdf: 40 },
}

export const ETICHETTE_VOTO = { si: 'Sì', regolarizza: 'Regolarizza', no: 'No' }

const FILTRO_VOTO = {
  all: null,
  aventi_diritto: ['si', 'regolarizza'],
  solo_si: ['si'],
  solo_regolarizza: ['regolarizza'],
  esclusi: ['no'],
}

export const TESTI_VOTO = {
  aventi_diritto: 'aventi diritto al voto (Sì e Regolarizza)',
  solo_si: 'con pieno diritto al voto (Sì)',
  solo_regolarizza: 'da regolarizzare per votare',
  esclusi: 'senza diritto al voto (No)',
}

/**
 * Stato iniziale della pagina.
 * @param {number} anno anno di riferimento
 */
export function statoIniziale(anno) {
  return {
    versione: 2,
    anno,
    titolo: '',
    filters: {
      onlyActiveMembers: false,
      groups: [],
      ageGroup: 'all',
      paymentStatus: 'all',
      electionEligibility: 'all',
      paymentYears: { list: [], logic: 'AND' },
    },
    display: {
      baseColumns: ['cognomeNome', 'gruppo', 'dataNascita'],
      yearColumns: [],
    },
    sort: { by: 'cognome', descending: false },
  }
}

/**
 * Porta uno stato salvato (anche dalla prima versione, che non aveva l'anno ma la data
 * delle elezioni) alla forma attuale, scartando valori sconosciuti.
 * @param {object} salvato
 * @param {number} annoPredefinito
 */
export function normalizzaStato(salvato, annoPredefinito) {
  const base = statoIniziale(annoPredefinito)
  if (!salvato || typeof salvato !== 'object') return base
  const f = salvato.filters || {}
  const d = salvato.display || {}
  const s = salvato.sort || {}

  const annoData = f.electionDate ? new Date(f.electionDate).getFullYear() : NaN
  const anno = Number.isInteger(salvato.anno)
    ? salvato.anno
    : Number.isInteger(annoData)
      ? annoData
      : annoPredefinito

  const scelta = (valore, ammessi, predefinito) => (ammessi.includes(valore) ? valore : predefinito)
  const anni = (lista) => (Array.isArray(lista) ? lista.filter(Number.isInteger) : [])

  return {
    versione: 2,
    anno,
    titolo: typeof salvato.titolo === 'string' ? salvato.titolo : '',
    filters: {
      onlyActiveMembers: Boolean(f.onlyActiveMembers),
      groups: Array.isArray(f.groups)
        ? f.groups.map((g) => (g === 'Nessuna Manicchia' ? SENZA_MANICCHIA : g))
        : [],
      ageGroup: scelta(f.ageGroup, ['all', 'maggiorenni', 'minorenni'], 'all'),
      paymentStatus: scelta(f.paymentStatus, ['all', 'in_regola', 'morosi'], 'all'),
      electionEligibility: scelta(f.electionEligibility, Object.keys(FILTRO_VOTO), 'all'),
      paymentYears: {
        list: anni(f.paymentYears?.list),
        logic: scelta(f.paymentYears?.logic, ['AND', 'OR'], 'AND'),
      },
    },
    display: {
      baseColumns: Array.isArray(d.baseColumns)
        ? d.baseColumns.filter((c) => c in COLONNE)
        : base.display.baseColumns,
      yearColumns: anni(d.yearColumns),
    },
    sort: {
      by: scelta(s.by, ['cognome', 'gruppo', 'anno_nascita'], 'cognome'),
      descending: Boolean(s.descending),
    },
  }
}

const manicchia = (socio) => socio.gruppo_appartenenza || SENZA_MANICCHIA

/**
 * Prepara un socio per il report: anni pagati, eta', voto e arretrati nell'anno.
 */
function scheda(socio, anno) {
  const anniPagati = (socio.tesseramenti || []).map((t) => Number(t.anno))
  const voto = valutaDirittoVoto(socio, anniPagati, anno)
  return {
    socio,
    anniPagati,
    maggiorenne: !isMinorenne(socio.data_nascita, anno),
    voto,
    pagamento: calculatePaymentStatus(socio, anniPagati, anno),
  }
}

const confronta = (a, b) => (a || '').localeCompare(b || '', 'it')

/**
 * Applica filtri e ordine.
 * @param {Array<object>} soci con `tesseramenti`
 * @param {object} stato vedi statoIniziale
 * @returns {Array<object>} schede dei soci scelti, in ordine
 */
export function filtraSoci(soci, stato) {
  const { anno, filters: f, sort } = stato
  const voti = FILTRO_VOTO[f.electionEligibility]
  const gruppi = new Set(f.groups)
  const anniRichiesti = f.paymentYears.list

  const righe = soci
    .map((socio) => scheda(socio, anno))
    .filter((r) => {
      if (f.onlyActiveMembers && !r.anniPagati.some((a) => a > anno - ANNI_ATTIVITA && a <= anno))
        return false
      if (f.ageGroup === 'maggiorenni' && !r.maggiorenne) return false
      if (f.ageGroup === 'minorenni' && r.maggiorenne) return false
      if (f.paymentStatus === 'in_regola' && !r.anniPagati.includes(anno)) return false
      if (f.paymentStatus === 'morosi' && r.anniPagati.includes(anno)) return false
      if (gruppi.size > 0 && !gruppi.has(manicchia(r.socio))) return false
      if (voti && !voti.includes(r.voto.stato)) return false
      if (anniRichiesti.length > 0) {
        const pagato = (a) => r.anniPagati.includes(a)
        const ok =
          f.paymentYears.logic === 'AND' ? anniRichiesti.every(pagato) : anniRichiesti.some(pagato)
        if (!ok) return false
      }
      return true
    })

  const annoNascita = (r) =>
    r.socio.data_nascita ? Number(String(r.socio.data_nascita).slice(0, 4)) : 9999
  righe.sort((a, b) => {
    let c = 0
    if (sort.by === 'gruppo') c = confronta(manicchia(a.socio), manicchia(b.socio))
    else if (sort.by === 'anno_nascita') c = annoNascita(a) - annoNascita(b)
    if (c === 0)
      c = confronta(a.socio.cognome, b.socio.cognome) || confronta(a.socio.nome, b.socio.nome)
    return sort.descending ? -c : c
  })
  return righe
}

/**
 * Colonne del report nell'ordine di stampa: le colonne scelte nell'ordine scelto,
 * poi gli anni dal piu' vecchio, e la firma sempre per ultima.
 * @returns {Array<{chiave: string, label: string, pdf: number, align?: string, anno?: number}>}
 */
export function colonneReport(stato) {
  const base = stato.display.baseColumns.filter((c) => c in COLONNE)
  const colonne = base.filter((c) => c !== 'firma').map((c) => ({ chiave: c, ...COLONNE[c] }))
  for (const anno of [...stato.display.yearColumns].sort((a, b) => a - b)) {
    colonne.push({ chiave: `anno-${anno}`, label: String(anno), pdf: 6, align: 'center', anno })
  }
  if (base.includes('firma')) colonne.push({ chiave: 'firma', ...COLONNE.firma })
  return colonne
}

const formatoData = (data) => {
  if (!data) return '-'
  const [a, m, g] = String(data).slice(0, 10).split('-')
  return g ? `${g}-${m}-${a}` : String(data)
}

/**
 * Valore di una cella. Per il voto e gli anni restituisce anche lo stato,
 * che anteprima e PDF colorano a modo loro.
 * @returns {{ testo: string, stato?: string }}
 */
export function valoreCella(riga, colonna) {
  const { socio } = riga
  if (colonna.anno) {
    const s = statoAnno(socio, riga.anniPagati, colonna.anno)
    return { testo: s, stato: s }
  }
  switch (colonna.chiave) {
    case 'cognomeNome':
      return { testo: `${socio.cognome || ''} ${socio.nome || ''}`.trim() }
    case 'gruppo':
      return { testo: manicchia(socio) }
    case 'dataNascita':
      return { testo: formatoData(socio.data_nascita) }
    case 'eta':
      return { testo: socio.data_nascita ? (riga.maggiorenne ? 'Maggiorenne' : 'Minorenne') : '-' }
    case 'dirittoVoto':
      return { testo: ETICHETTE_VOTO[riga.voto.stato], stato: riga.voto.stato }
    case 'motivoEsclusione':
      return { testo: riga.voto.motivo || '-' }
    case 'arretrati':
      return { testo: descriviArretrati(riga.pagamento) }
    case 'firma':
      return { testo: '' }
    default:
      return { testo: '' }
  }
}

/**
 * Filtri attivi come etichette, ognuna con cosa togliere per annullarla.
 * @returns {Array<{id: string, testo: string}>}
 */
export function filtriAttivi(stato) {
  const f = stato.filters
  const etichette = []
  if (f.groups.length > 0) {
    etichette.push({ id: 'groups', testo: `Manicchia: ${f.groups.join(', ')}` })
  }
  if (f.ageGroup !== 'all') {
    etichette.push({
      id: 'ageGroup',
      testo: f.ageGroup === 'maggiorenni' ? 'Maggiorenni' : 'Minorenni',
    })
  }
  if (f.onlyActiveMembers) {
    etichette.push({ id: 'onlyActiveMembers', testo: `Attivi negli ultimi ${ANNI_ATTIVITA} anni` })
  }
  if (f.paymentStatus !== 'all') {
    etichette.push({
      id: 'paymentStatus',
      testo: f.paymentStatus === 'in_regola' ? `Pagato ${stato.anno}` : `Non pagato ${stato.anno}`,
    })
  }
  if (f.paymentYears.list.length > 0) {
    const anni = [...f.paymentYears.list].sort((a, b) => a - b).join(', ')
    etichette.push({
      id: 'paymentYears',
      testo: `${f.paymentYears.logic === 'AND' ? 'Pagato in tutti' : 'Pagato in almeno uno'}: ${anni}`,
    })
  }
  if (f.electionEligibility !== 'all') {
    etichette.push({
      id: 'electionEligibility',
      testo: `Voto: ${TESTI_VOTO[f.electionEligibility]}`,
    })
  }
  return etichette
}

/**
 * Toglie un filtro (l'id di filtriAttivi). Restituisce un nuovo stato.
 */
export function togliFiltro(stato, id) {
  const vuoto = statoIniziale(stato.anno).filters
  return { ...stato, filters: { ...stato.filters, [id]: vuoto[id] } }
}

/**
 * Riassunto a parole, stampato sotto il titolo del PDF.
 */
export function riassunto(stato) {
  const etichette = filtriAttivi(stato).map((e) => e.testo)
  const ordini = { cognome: 'cognome', gruppo: 'manicchia', anno_nascita: 'anno di nascita' }
  const ordine = `ordinati per ${ordini[stato.sort.by]}${stato.sort.descending ? ' (decrescente)' : ''}`
  const filtri = etichette.length > 0 ? etichette.join(' · ') : 'Tutti i soci'
  return `Riferimento ${stato.anno} · ${filtri} · ${ordine}`
}

/**
 * Titolo del documento: quello scritto da chi stampa, oppure uno ricavato dai filtri.
 */
export function titoloReport(stato) {
  if (stato.titolo && stato.titolo.trim()) return stato.titolo.trim()
  const f = stato.filters
  const tipo =
    f.electionEligibility === 'aventi_diritto'
      ? 'Aventi diritto al voto'
      : f.ageGroup === 'minorenni'
        ? 'Minorenni'
        : f.onlyActiveMembers
          ? 'Soci attivi'
          : null
  if (f.groups.length === 1) {
    return tipo
      ? `${tipo} - ${f.groups[0]} - ${stato.anno}`
      : `Soci della manicchia ${f.groups[0]} - ${stato.anno}`
  }
  return `${tipo || 'Elenco soci'} - ${stato.anno}`
}

/** Modelli pronti di Report PDF che si possono aprire nel Report su misura. */
export const MODELLI = ['aventi-diritto', 'manicchia', 'minorenni', 'attivi']

/**
 * Stato di partenza del Report su misura per un modello pronto ("Personalizza"):
 * gli stessi soci del modello, con colonne adatte, da cambiare poi a piacere.
 * @param {string} id uno di MODELLI
 * @param {number} anno anno di riferimento
 * @param {{ manicchia?: string, eta?: string, pagamento?: string }} [opzioni]
 *   le scelte fatte sul modello (eta' e pagamento con i valori del Report su misura)
 * @returns {object|null} null se il modello non esiste
 */
export function statoDaModello(id, anno, opzioni = {}) {
  const s = statoIniziale(anno)
  const f = s.filters
  const unaManicchia = opzioni.manicchia ? [opzioni.manicchia] : []
  switch (id) {
    case 'aventi-diritto':
      f.electionEligibility = 'aventi_diritto'
      f.groups = unaManicchia
      s.display.baseColumns = ['cognomeNome', 'gruppo', 'dirittoVoto', 'arretrati', 'firma']
      s.sort.by = 'gruppo'
      break
    case 'manicchia':
      f.groups = unaManicchia
      f.ageGroup = opzioni.eta
      f.paymentStatus = opzioni.pagamento
      s.display.yearColumns = [anno - 2, anno - 1, anno]
      s.sort.by = 'gruppo'
      break
    case 'minorenni':
      f.ageGroup = 'minorenni'
      break
    case 'attivi':
      f.onlyActiveMembers = true
      s.display.yearColumns = Array.from({ length: ANNI_ATTIVITA }, (_, i) => anno - i)
      break
    default:
      return null
  }
  // valori sconosciuti (per esempio da un indirizzo scritto a mano) tornano a "tutti"
  return normalizzaStato(s, anno)
}

/**
 * Manicchie da proporre nei filtri: quelle note piu' "Senza manicchia" se serve.
 */
export function manicchieDisponibili(gruppiNoti, soci) {
  const elenco = [...gruppiNoti]
  if (soci.some((s) => !s.gruppo_appartenenza)) elenco.push(SENZA_MANICCHIA)
  return elenco
}
