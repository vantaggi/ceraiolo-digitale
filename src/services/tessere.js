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

function scriviDati(page, socio, font, larghezza, altezza) {
  const maxWidth = larghezza * LARGHEZZA_TESTO
  const righeNome = righeTesto(nomeTessera(socio), maxWidth, (t) =>
    font.widthOfTextAtSize(t, FONT_NOME),
  )
  const righeData = righeTesto(formattaDataTessera(socio.data_nascita), maxWidth, (t) =>
    font.widthOfTextAtSize(t, FONT_DATA),
  )

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
}

/**
 * Crea il PDF delle tessere, una pagina per socio, nell'ordine ricevuto.
 * @param {Array<{cognome: string, nome: string, data_nascita: string}>} soci
 * @param {object} modello - da caricaModelloTessera()
 * @param {Function} [onProgress] - riceve la percentuale completata
 * @returns {Promise<Uint8Array>}
 */
export async function creaPDFTessere(soci, modello, onProgress = () => {}) {
  if (!modello) {
    throw new Error('Nessuno sfondo per le tessere. Caricalo in Impostazioni > Tessera.')
  }
  const pdfDoc = await PDFDocument.create()
  const sfondo = await preparaSfondo(pdfDoc, modello)
  // Times-Italic: simile alla scrittura a penna, uguale alle tessere gia' stampate
  const font = await pdfDoc.embedFont('Times-Italic')

  soci.forEach((socio, i) => {
    const page = pdfDoc.addPage([sfondo.larghezza, sfondo.altezza])
    sfondo.disegna(page)
    scriviDati(page, socio, font, sfondo.larghezza, sfondo.altezza)
    onProgress(((i + 1) / soci.length) * 100)
  })

  return pdfDoc.save()
}
