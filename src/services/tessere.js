/**
 * Tessere dei soci: un'unica funzione impagina le tessere, sia per il file da
 * stampare sia per l'anteprima, cosi' l'anteprima e' sempre il file vero.
 *
 * Lo sfondo (il "modello") puo' essere:
 * - un PDF di una pagina: la pagina da' anche le dimensioni della tessera;
 * - una foto JPG o PNG: riempie una tessera di 80,77 x 122,17 mm, tagliando i
 *   bordi in eccesso come fa "cover" nel CSS.
 */
import { PDFDocument, rgb } from 'pdf-lib'
import { getSetting } from './db'

const MM = 72 / 25.4 // punti PDF per millimetro

export const LARGHEZZA_TESSERA_MM = 80.77
export const ALTEZZA_TESSERA_MM = 122.17

const MESI = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
]

// Misure del testo, invariate rispetto alle tessere gia' stampate
const FONT_NOME = 5 * MM
const FONT_DATA = 4.5 * MM
const RIGA_NOME = 8 * MM
const RIGA_DATA = 6 * MM
const SPAZIO_NOME_DATA = 3 * MM
const LARGHEZZA_TESTO = 0.7 // 15% di margine a sinistra e a destra

/** "1980-05-15" -> "15 Maggio 1980" */
export function formattaDataTessera(dataNascita) {
  if (!dataNascita) return ''
  const [anno, mese, giorno] = dataNascita.split('-')
  const meseNome = MESI[parseInt(mese) - 1]
  if (!meseNome || !giorno) return ''
  return `${parseInt(giorno)} ${meseNome} ${anno}`
}

/** Nome come compare sulla tessera: prima il cognome */
export function nomeTessera(socio) {
  return [socio.cognome, socio.nome].filter(Boolean).join(' ')
}

// Lettere senza accento da togliere che il carattere della tessera non ha
const LETTERE_SEMPLICI = {
  Ł: 'L',
  ł: 'l',
  Đ: 'D',
  đ: 'd',
  ı: 'i',
  İ: 'I',
  Ħ: 'H',
  ħ: 'h',
  ĸ: 'k',
  Ŋ: 'N',
  ŋ: 'n',
  Ŧ: 'T',
  ŧ: 't',
  ſ: 's',
  ʼ: "'",
  ʻ: "'",
  '′': "'",
}

/**
 * Il testo come lo sa scrivere il carattere della tessera. Times-Italic ha solo le lettere
 * dell'Europa occidentale: una lettera che manca (ř, Ł, Ș) o un Tab fermavano tutto il PDF
 * con "WinAnsi cannot encode". Qui gli spazi strani diventano uno spazio e una lettera che
 * manca diventa la lettera semplice (ř -> r); se non esiste, un punto di domanda.
 * @param {string} testo
 * @param {(carattere: string) => boolean} siScrive - il carattere c'e' nel font
 * @returns {{ testo: string, cambiato: boolean }} cambiato: almeno una lettera sostituita
 */
export function testoStampabile(testo, siScrive) {
  let cambiato = false
  let risultato = ''
  for (const carattere of String(testo ?? '').replace(/[\s\p{Cc}]+/gu, ' ')) {
    if (siScrive(carattere)) {
      risultato += carattere
      continue
    }
    cambiato = true
    const semplice =
      LETTERE_SEMPLICI[carattere] ?? carattere.normalize('NFD').replace(/\p{M}/gu, '')
    risultato += [...semplice].every(siScrive) && semplice ? semplice : '?'
  }
  return { testo: risultato.trim(), cambiato }
}

/** Spezza il testo in righe larghe al massimo maxWidth, senza spezzare le parole */
export function righeTesto(testo, maxWidth, misura) {
  const righe = []
  let riga = ''
  for (const parola of testo.split(' ').filter(Boolean)) {
    const prova = riga ? `${riga} ${parola}` : parola
    if (riga && misura(prova) > maxWidth) {
      righe.push(riga)
      riga = parola
    } else {
      riga = prova
    }
  }
  if (riga) righe.push(riga)
  return righe
}

/**
 * Legge il modello salvato in Impostazioni.
 * Il PDF ha la precedenza: le installazioni che avevano un PDF salvavano in
 * 'cardBackground' solo un'immagine segnaposto, che va ignorata.
 * @returns {Promise<{tipo: 'pdf', dati: Uint8Array} | {tipo: 'immagine', dati: string} | null>}
 */
export async function caricaModelloTessera() {
  const pdf = await getSetting('cardTemplatePDF')
  if (pdf && pdf.length) return { tipo: 'pdf', dati: new Uint8Array(pdf) }
  const immagine = await getSetting('cardBackground')
  if (immagine) return { tipo: 'immagine', dati: immagine }
  return null
}

function bytesDaDataUrl(dataUrl) {
  const [testa, base64] = dataUrl.split(',')
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return { bytes, png: testa.includes('image/png') }
}

/** Prepara lo sfondo una sola volta: ogni tessera lo riusa, il file resta leggero */
async function preparaSfondo(pdfDoc, modello) {
  if (modello.tipo === 'pdf') {
    const sorgente = await PDFDocument.load(modello.dati)
    const pagina = await pdfDoc.embedPage(sorgente.getPage(0))
    return {
      larghezza: pagina.width,
      altezza: pagina.height,
      disegna: (page) => page.drawPage(pagina, { x: 0, y: 0 }),
    }
  }

  const { bytes, png } = bytesDaDataUrl(modello.dati)
  const immagine = png ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes)
  const larghezza = LARGHEZZA_TESSERA_MM * MM
  const altezza = ALTEZZA_TESSERA_MM * MM
  // "cover": riempie la tessera e taglia l'eccedenza, centrata
  const scala = Math.max(larghezza / immagine.width, altezza / immagine.height)
  const w = immagine.width * scala
  const h = immagine.height * scala
  return {
    larghezza,
    altezza,
    disegna: (page) =>
      page.drawImage(immagine, {
        x: (larghezza - w) / 2,
        y: (altezza - h) / 2,
        width: w,
        height: h,
      }),
  }
}

/** @returns {boolean} vero se nel nome qualche lettera e' stata sostituita */
function scriviDati(page, socio, font, siScrive, larghezza, altezza) {
  const maxWidth = larghezza * LARGHEZZA_TESTO
  const nome = testoStampabile(nomeTessera(socio), siScrive)
  const data = testoStampabile(formattaDataTessera(socio.data_nascita), siScrive)
  const righeNome = righeTesto(nome.testo, maxWidth, (t) => font.widthOfTextAtSize(t, FONT_NOME))
  const righeData = righeTesto(data.testo, maxWidth, (t) => font.widthOfTextAtSize(t, FONT_DATA))

  // Blocco nome + data centrato in verticale
  const altezzaBlocco =
    righeNome.length * RIGA_NOME + SPAZIO_NOME_DATA + righeData.length * RIGA_DATA
  let y = altezza / 2 + altezzaBlocco / 2 - RIGA_NOME / 2

  const scrivi = (riga, size) => {
    const x = larghezza / 2 - font.widthOfTextAtSize(riga, size) / 2
    page.drawText(riga, { x, y, size, font, color: rgb(0, 0, 0) })
  }
  for (const riga of righeNome) {
    scrivi(riga, FONT_NOME)
    y -= RIGA_NOME
  }
  y -= SPAZIO_NOME_DATA
  for (const riga of righeData) {
    scrivi(riga, FONT_DATA)
    y -= RIGA_DATA
  }
  return nome.cambiato
}

/**
 * Crea il PDF delle tessere, una pagina per socio, nell'ordine ricevuto.
 * @param {Array<{cognome: string, nome: string, data_nascita: string}>} soci
 * @param {object} modello - da caricaModelloTessera()
 * @param {Function} [onProgress] - riceve la percentuale completata
 * @param {Function} [onNomeCambiato] - riceve ogni socio il cui nome ha lettere che il
 *   carattere della tessera non ha: sulla tessera sono scritte con la lettera semplice
 * @returns {Promise<Uint8Array>}
 */
export async function creaPDFTessere(
  soci,
  modello,
  onProgress = () => {},
  onNomeCambiato = () => {},
) {
  if (!modello) {
    throw new Error('Nessuno sfondo per le tessere. Caricalo in Impostazioni > Tessera.')
  }
  const pdfDoc = await PDFDocument.create()
  const sfondo = await preparaSfondo(pdfDoc, modello)
  // Times-Italic: simile alla scrittura a penna, uguale alle tessere gia' stampate
  const font = await pdfDoc.embedFont('Times-Italic')
  const lettere = new Set(font.getCharacterSet())
  const siScrive = (carattere) => lettere.has(carattere.codePointAt(0))

  soci.forEach((socio, i) => {
    const page = pdfDoc.addPage([sfondo.larghezza, sfondo.altezza])
    sfondo.disegna(page)
    if (scriviDati(page, socio, font, siScrive, sfondo.larghezza, sfondo.altezza)) {
      onNomeCambiato(socio)
    }
    onProgress(((i + 1) / soci.length) * 100)
  })

  return pdfDoc.save()
}
