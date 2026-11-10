/**
 * Utility functions for payment calculations and status checks
 */

/**
 * Calculates the age of a member in a specific year
 * @param {string} birthDateString - Date of birth (YYYY-MM-DD)
 * @param {number} year - The year to calculate age for
 * @returns {number} Age in that year
 */
export function calculateAgeInYear(birthDateString, year) {
  if (!birthDateString) return 99 // Assume adult if no birthdate
  const birthDate = new Date(birthDateString)
  if (isNaN(birthDate.getTime())) return 99

  return year - birthDate.getFullYear()
}

/** Eta' dalla quale si e' maggiorenni (e si paga, e si vota). */
export const MAGGIORE_ETA = 18

/**
 * Minorenne in un anno: conta solo l'anno di nascita, non il compleanno
 * (regola del proprietario, 27 ottobre 2026). Senza data valida: maggiorenne.
 * @param {string} dataNascita - YYYY-MM-DD
 * @param {number} anno
 * @returns {boolean}
 */
export function isMinorenne(dataNascita, anno) {
  return calculateAgeInYear(dataNascita, anno) < MAGGIORE_ETA
}

/**
 * Checks if a member is exempt from payment for a specific year (e.g. minors)
 * @param {object} socio - The member object
 * @param {number} year - The year to check
 * @returns {boolean} True if exempt
 */
export function isExemptFromPayment(socio, year) {
  // Minors are exempt from payment/arrears after their first registration
  // "negli anni successivi risultano sempre iscritti fino al 18 anno"
  return isMinorenne(socio.data_nascita, year)
}

/** Quote predefinite, finche' l'impostazione non e' salvata (Impostazioni > Generale). */
export const QUOTA_ORDINARIA_PREDEFINITA = 10
export const QUOTA_NUOVI_PREDEFINITA = 25

/**
 * Che quota tocca a un socio per un anno.
 * - 'esente': minorenne nell'anno.
 * - 'nuovo': primo anno di iscrizione (nessun anno dichiarato ne' pagamento prima).
 * - 'rientro': non era iscritto l'anno prima (non ha pagato da maggiorenne).
 * - 'ordinaria': iscritto l'anno prima, anche da minorenne esente senza pagamenti
 *   (scelta del proprietario, 31 ottobre 2026).
 * Le definizioni sono quelle di iscrizione.js; qui si usa statoAnno per non importarlo
 * (iscrizione.js importa questo file).
 * Nuovi e rientri pagano la quota dei nuovi (impostazione newMemberQuota). Chi salda
 * gli arretrati nello stesso pagamento non e' un rientro: gli anni pagati contano.
 * @param {object} socio - con data_nascita
 * @param {Array<number>} anniPagati - anni con un tesseramento (anche dopo l'anno: si ignorano)
 * @param {number} anno
 * @returns {'esente'|'nuovo'|'rientro'|'ordinaria'}
 */
export function tipoQuota(socio, anniPagati, anno) {
  if (isExemptFromPayment(socio, anno)) return 'esente'
  const prima = anniPagati.map(Number).filter((a) => a < anno)
  const iscrizione = annoIscrizione(socio, prima)
  if (iscrizione === null || iscrizione >= anno) return 'nuovo'
  const statoPrima = statoAnno(socio, prima, anno - 1)
  return statoPrima === 'V' || statoPrima === 'O' ? 'ordinaria' : 'rientro'
}

/**
 * Quota da proporre quando si pagano piu' anni insieme: quella dell'ultimo anno scelto,
 * contando come pagati anche gli altri anni scelti. Un rientro che salda gli arretrati
 * non e' piu' un rientro e paga la quota ordinaria (scelta di Cioti, 1 novembre 2026).
 * @param {object} socio
 * @param {Array<number>} anniPagati - anni gia' pagati
 * @param {Array<number>} anniScelti - anni che si stanno pagando
 * @param {{ quotaOrdinaria: number, quotaNuovi: number }} quote
 * @returns {number|null} null se non e' scelto nessun anno, o per l'offerta di un minorenne
 */
export function quotaPropostaPerAnni(socio, anniPagati, anniScelti, quote) {
  const scelti = anniScelti.map(Number)
  if (scelti.length === 0) return null
  const anno = Math.max(...scelti)
  return quotaPerAnno(socio, [...anniPagati.map(Number), ...scelti], anno, quote)
}

/**
 * Quote per anno (Cioti, 9 e 10 novembre 2026). Una tabella di periodi, ognuno valido
 * dal suo anno in poi; per un anno vale il periodo con l'anno di partenza piu' vicino
 * prima di lui. Ogni periodo ha fasce d'eta' (dal solo anno di nascita), e per ogni
 * fascia la quota annuale (null = offerta, nessun importo proposto) e l'iscrizione,
 * cioe' il costo della nuova tessera.
 * L'iscrizione si paga la prima volta e quando ci si reiscrive dopo piu' di
 * MAX_ANNI_ARRETRATI anni scoperti; nei periodi con `iscrizioneChiSaltaUnAnno` anche
 * da chi torna dopo un solo anno senza saldare gli arretrati (la regola fino al 2026).
 * La tabella sta nell'impostazione `quotePerAnno`; finche' non e' salvata vale
 * quotePredefinite, fatta con gli importi di prima (quota ordinaria e quota dei nuovi).
 *
 * @typedef {{ daEta: number, quota: number|null, iscrizione: number }} FasciaQuota
 * @typedef {{ daAnno: number|null, iscrizioneChiSaltaUnAnno: boolean, fasce: FasciaQuota[] }} PeriodoQuote
 */

/** Primo anno delle quote nuove decise da Cioti il 9 novembre 2026. */
export const ANNO_QUOTE_2027 = 2027

/**
 * Tabella di partenza: il periodo di prima (importi delle impostazioni) e il 2027.
 * @param {{ quotaOrdinaria: number, quotaNuovi: number }} quote
 * @returns {PeriodoQuote[]}
 */
export function quotePredefinite({ quotaOrdinaria, quotaNuovi }) {
  const ordinaria = Number(quotaOrdinaria)
  const iscrizione = Math.max(0, Number(quotaNuovi) - ordinaria)
  return [
    {
      daAnno: null,
      iscrizioneChiSaltaUnAnno: true,
      fasce: [
        { daEta: 0, quota: ordinaria, iscrizione: 0 },
        { daEta: MAGGIORE_ETA, quota: ordinaria, iscrizione },
      ],
    },
    {
      daAnno: ANNO_QUOTE_2027,
      iscrizioneChiSaltaUnAnno: false,
      fasce: [
        { daEta: 0, quota: null, iscrizione: 0 },
        { daEta: MAGGIORE_ETA, quota: 15, iscrizione: 0 },
        { daEta: 24, quota: 15, iscrizione: 15 },
      ],
    },
  ]
}

/** Accetta la tabella o, come prima, gli importi { quotaOrdinaria, quotaNuovi }. */
const comeTabella = (quote) => (Array.isArray(quote) ? quote : quotePredefinite(quote))

/**
 * Periodo che vale per un anno.
 * @param {PeriodoQuote[]} tabella
 * @param {number} anno
 * @returns {PeriodoQuote}
 */
export function periodoPerAnno(tabella, anno) {
  const ordinati = [...tabella].sort((a, b) => (a.daAnno ?? -Infinity) - (b.daAnno ?? -Infinity))
  return ordinati.filter((p) => p.daAnno === null || p.daAnno <= anno).at(-1) ?? ordinati[0]
}

/**
 * Fascia d'eta' di un periodo: quella con il "da eta'" piu' alto non oltre l'eta'.
 * @param {PeriodoQuote} periodo
 * @param {number} eta
 * @returns {FasciaQuota}
 */
export function fasciaPerEta(periodo, eta) {
  const ordinate = [...periodo.fasce].sort((a, b) => a.daEta - b.daEta)
  return ordinate.filter((f) => f.daEta <= eta).at(-1) ?? ordinate[0]
}

/**
 * Controlla una tabella prima di salvarla. Restituisce il primo errore, a parole, o ''.
 * @param {PeriodoQuote[]} tabella
 * @returns {string}
 */
export function erroreTabellaQuote(tabella) {
  if (!Array.isArray(tabella) || tabella.length === 0) return 'Serve almeno un periodo.'
  if (tabella.some((p) => !p || typeof p !== 'object')) return 'Un periodo non è leggibile.'
  if (tabella.filter((p) => p.daAnno === null).length !== 1) {
    return 'Serve un solo periodo senza anno di partenza (il primo).'
  }
  const anni = tabella.filter((p) => p.daAnno !== null).map((p) => p.daAnno)
  if (anni.some((a) => !Number.isInteger(a) || a < 1950 || a > 2100)) {
    return "L'anno di partenza va scritto per intero, per esempio 2030."
  }
  if (new Set(anni).size !== anni.length) return 'Due periodi partono dallo stesso anno.'
  for (const p of tabella) {
    const nome = p.daAnno === null ? 'Il primo periodo' : `Il periodo dal ${p.daAnno}`
    if (!Array.isArray(p.fasce) || p.fasce.some((f) => !f || typeof f !== 'object')) {
      return `${nome}: le fasce d'età non sono leggibili.`
    }
    if (!p.fasce.length || !p.fasce.some((f) => f.daEta === 0)) {
      return `${nome} deve avere una fascia che parte da 0 anni.`
    }
    const eta = p.fasce.map((f) => f.daEta)
    if (eta.some((e) => !Number.isInteger(e) || e < 0 || e > 120)) {
      return `${nome}: l'età va scritta in anni interi.`
    }
    // L'esenzione dei minorenni (tipoQuota) e' fissa a MAGGIORE_ETA: una fascia che parte
    // tra 1 e 17 anni non cambierebbe la quota proposta, quindi non si accetta.
    if (eta.some((e) => e > 0 && e < MAGGIORE_ETA)) {
      return `${nome}: le fasce dei minorenni partono da 0; la fascia dopo parte da ${MAGGIORE_ETA} anni o più.`
    }
    if (new Set(eta).size !== eta.length) return `${nome}: due fasce partono dalla stessa età.`
    const importo = (v) => Number.isFinite(v) && v >= 0
    if (p.fasce.some((f) => (f.quota !== null && !importo(f.quota)) || !importo(f.iscrizione))) {
      return `${nome}: gli importi vanno da 0 in su.`
    }
  }
  return ''
}

/**
 * Quota da proporre per un anno, con le quote del suo periodo.
 * @param {object} socio - con data_nascita e data_prima_iscrizione
 * @param {Array<number>} anniPagati - anni con un tesseramento (quelli dopo si ignorano)
 * @param {number} anno
 * @param {PeriodoQuote[]|{ quotaOrdinaria: number, quotaNuovi: number }} quote
 * @returns {number|null} null: offerta, l'importo si scrive a mano
 */
export function quotaPerAnno(socio, anniPagati, anno, quote) {
  const anni = anniPagati.map(Number)
  const tipo = tipoQuota(socio, anni, anno)
  const periodo = periodoPerAnno(comeTabella(quote), anno)
  const fascia = fasciaPerEta(periodo, calculateAgeInYear(socio.data_nascita, anno))
  if (fascia.quota === null) return null
  if (tipo === 'esente' || tipo === 'ordinaria') return fascia.quota
  const prima = anni.filter((a) => a < anno)
  const iscrizione =
    tipo === 'nuovo' ||
    periodo.iscrizioneChiSaltaUnAnno ||
    calculatePaymentStatus(socio, prima, anno).daReiscrivere
  return iscrizione ? fascia.quota + fascia.iscrizione : fascia.quota
}

/**
 * Arretrati massimi: con piu' anni scoperti di fila il socio e' cancellato e deve
 * reiscriversi (regola del proprietario, 27 ottobre 2026; la stessa di voto.js).
 */
export const MAX_ANNI_ARRETRATI = 3

/**
 * Calcola lo stato delle quote e gli arretrati di un socio per un anno.
 * - Condono: se l'anno di riferimento e' pagato, il socio e' in regola.
 * - Pagare un anno condona quelli prima: gli arretrati sono solo gli anni
 *   dopo l'ultimo anno in regola (pagato o da minorenne esente).
 * - Piu' di MAX_ANNI_ARRETRATI anni scoperti: nessun arretrato, va reiscritto.
 *
 * @param {object} socio - The member object
 * @param {Array<number>} paidYears - Array of years the member has paid
 * @param {number} targetYear - The reference year (usually current year)
 * @returns {{ inRegola: boolean, arretrati: Array<number>, daReiscrivere: boolean }}
 */
export function calculatePaymentStatus(socio, paidYears, targetYear) {
  const paidSet = new Set(paidYears)
  const inRegola = { inRegola: true, arretrati: [], daReiscrivere: false }

  if (paidSet.has(targetYear)) return inRegola

  // Minorenne gia' iscritto: esente
  if (
    isExemptFromPayment(socio, targetYear) &&
    socio.data_prima_iscrizione &&
    socio.data_prima_iscrizione <= targetYear
  ) {
    return inRegola
  }

  const firstYear =
    socio.data_prima_iscrizione || (paidYears.length ? Math.min(...paidYears) : targetYear)

  // Ultimo anno in regola prima dell'anno di riferimento
  let ultimoInRegola = null
  for (let year = targetYear - 1; year >= firstYear; year--) {
    if (paidSet.has(year) || isExemptFromPayment(socio, year)) {
      ultimoInRegola = year
      break
    }
  }

  const arretrati = []
  for (let year = (ultimoInRegola ?? firstYear - 1) + 1; year <= targetYear; year++) {
    if (!isExemptFromPayment(socio, year)) arretrati.push(year)
  }

  if (arretrati.length > MAX_ANNI_ARRETRATI) {
    return { inRegola: false, arretrati: [], daReiscrivere: true }
  }
  return { inRegola: arretrati.length === 0, arretrati, daReiscrivere: false }
}

/**
 * Testo della colonna arretrati nei PDF
 * @param {{ arretrati: Array<number>, daReiscrivere: boolean }} stato
 * @returns {string}
 */
export function descriviArretrati(stato) {
  if (stato.daReiscrivere) return 'Da reiscrivere'
  return stato.arretrati.length > 0 ? stato.arretrati.join(', ') : '-'
}

/**
 * Anno di iscrizione: il primo tra l'anno dichiarato (data_prima_iscrizione)
 * e il primo pagamento registrato. Senza nessuno dei due, null.
 * @param {object} socio
 * @param {Array<number>} anniPagati
 * @returns {number|null}
 */
export function annoIscrizione(socio, anniPagati) {
  const candidati = [...anniPagati]
  const dichiarato = Number(socio.data_prima_iscrizione)
  if (Number.isInteger(dichiarato) && dichiarato > 1900) candidati.push(dichiarato)
  return candidati.length > 0 ? Math.min(...candidati) : null
}

/**
 * Stato di un anno nelle colonne dei report (V, X, O, -).
 * - "-": non ancora iscritto in quell'anno (o non ancora nato)
 * - "V": pagato
 * - "O": minorenne, esente
 * - "X": non pagato
 * @param {object} socio
 * @param {Array<number>} anniPagati
 * @param {number} anno
 * @returns {'V'|'X'|'O'|'-'}
 */
export function statoAnno(socio, anniPagati, anno) {
  const iscrizione = annoIscrizione(socio, anniPagati)
  if (iscrizione === null || anno < iscrizione) return '-'
  if (anniPagati.includes(anno)) return 'V'
  // Anno dichiarato prima della nascita (dato sbagliato): prima di nascere non si e' iscritti
  const nascita = socio.data_nascita ? new Date(socio.data_nascita).getFullYear() : NaN
  if (anno < nascita) return '-'
  if (isExemptFromPayment(socio, anno)) return 'O'
  return 'X'
}

/** Parole del glossario per lo stato di un anno (statoAnno), le stesse in ogni schermata. */
export const TESTI_STATO_ANNO = {
  V: 'Pagata',
  X: 'Da pagare',
  O: 'Esente',
  '-': 'Non iscritto',
}
