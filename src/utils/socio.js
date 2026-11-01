// Regole del modulo "Nuovo socio": le usano sia la pagina Nuovo socio sia il
// modulo dentro Incassi › Registra ricevute, cosi' le regole sono una sola.

/** Campi senza i quali un socio non si salva. La manicchia e' facoltativa. */
export const CAMPI_OBBLIGATORI = ['cognome', 'nome', 'data_nascita', 'luogo_nascita']

const MESSAGGI_OBBLIGATORI = {
  cognome: 'Scrivi il cognome',
  nome: 'Scrivi il nome',
  data_nascita: 'Scrivi la data di nascita',
  luogo_nascita: 'Scrivi il luogo di nascita',
}

const testo = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim())

/**
 * Campi che diventano facoltativi quando si modifica un socio gia' in archivio:
 * il luogo di nascita manca a molti soci importati (scelta di Cioti, 1 novembre 2026).
 * Per un socio nuovo resta obbligatorio.
 */
export const FACOLTATIVI_IN_MODIFICA = ['luogo_nascita']

/**
 * Controlla i dati del modulo.
 * @param {object} dati - cognome, nome, data_nascita (AAAA-MM-GG), luogo_nascita,
 *   gruppo_appartenenza, data_prima_iscrizione (anno), note
 * @param {Date} [oggi]
 * @param {{ facoltativi?: string[] }} [opzioni] - campi obbligatori da non chiedere
 * @returns {Record<string, string>} campo -> messaggio; vuoto se e' tutto a posto
 */
export function validaSocio(dati, oggi = new Date(), { facoltativi = [] } = {}) {
  const errori = {}
  for (const campo of CAMPI_OBBLIGATORI) {
    if (facoltativi.includes(campo)) continue
    if (!testo(dati[campo])) errori[campo] = MESSAGGI_OBBLIGATORI[campo]
  }

  const nascita = testo(dati.data_nascita)
  let annoNascita = null
  if (nascita) {
    const data = new Date(`${nascita}T00:00:00`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nascita) || isNaN(data)) {
      errori.data_nascita = 'Data non valida'
    } else if (data > oggi) {
      errori.data_nascita = 'La data di nascita non può essere nel futuro'
    } else if (data.getFullYear() < 1900) {
      errori.data_nascita = "Controlla l'anno: è prima del 1900"
    } else {
      annoNascita = data.getFullYear()
    }
  }

  const prima = testo(dati.data_prima_iscrizione)
  if (prima) {
    const anno = Number(prima)
    if (!Number.isInteger(anno)) {
      errori.data_prima_iscrizione = "Scrivi solo l'anno, per esempio 2020"
    } else if (anno > oggi.getFullYear() + 1) {
      errori.data_prima_iscrizione = "L'anno è nel futuro"
    } else if (annoNascita !== null && anno < annoNascita) {
      errori.data_prima_iscrizione = "È prima dell'anno di nascita"
    } else if (anno < 1900) {
      errori.data_prima_iscrizione = "Controlla l'anno: è prima del 1900"
    }
  }

  return errori
}

/**
 * I dati come vanno salvati: testi senza spazi in piu', manicchia vuota se non scelta
 * ("Senza manicchia" nei report), anno di prima iscrizione come numero o assente.
 * @param {object} dati
 * @returns {object}
 */
export function datiDaSalvare(dati) {
  const salvati = {
    cognome: testo(dati.cognome),
    nome: testo(dati.nome),
    data_nascita: testo(dati.data_nascita),
    luogo_nascita: testo(dati.luogo_nascita),
    gruppo_appartenenza: testo(dati.gruppo_appartenenza),
    note: testo(dati.note),
  }
  const prima = Number(testo(dati.data_prima_iscrizione))
  if (testo(dati.data_prima_iscrizione) && Number.isInteger(prima))
    salvati.data_prima_iscrizione = prima
  return salvati
}

/** Nome confrontabile: minuscolo, senza accenti e senza spazi doppi. */
const normalizza = (v) =>
  testo(v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')

/**
 * Soci gia' in archivio con lo stesso cognome e nome: prima chi ha anche la stessa
 * data di nascita (quasi certamente la stessa persona).
 * @param {object} dati - cognome, nome, data_nascita
 * @param {Array<object>} soci
 * @returns {Array<{ socio: object, stessaData: boolean }>}
 */
export function trovaOmonimi(dati, soci) {
  const cognome = normalizza(dati.cognome)
  const nome = normalizza(dati.nome)
  if (!cognome || !nome) return []
  return soci
    .filter((s) => normalizza(s.cognome) === cognome && normalizza(s.nome) === nome)
    .map((socio) => ({
      socio,
      stessaData: !!dati.data_nascita && socio.data_nascita === dati.data_nascita,
    }))
    .sort((a, b) => Number(b.stessaData) - Number(a.stessaData))
}
