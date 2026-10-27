/**
 * Disegna la prima pagina di un PDF su un canvas, con pdf.js.
 * Serve all'anteprima della tessera: mostra il file vero, non una sua imitazione.
 * pdf.js si carica solo quando serve, per non appesantire l'avvio dell'app.
 */
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

let pdfjsPromise = null

function caricaPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
      return pdfjs
    })
  }
  return pdfjsPromise
}

const PX_PER_PUNTO = 96 / 72 // un punto PDF in pixel CSS
const MM_PER_PUNTO = 25.4 / 72

/**
 * @param {Uint8Array} pdfBytes
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<{larghezzaMm: number, altezzaMm: number}>} misure reali della pagina
 */
export async function disegnaPrimaPagina(pdfBytes, canvas) {
  const pdfjs = await caricaPdfjs()
  const caricamento = pdfjs.getDocument({
    // pdf.js si tiene il buffer: gli si passa una copia
    data: pdfBytes.slice(),
    // Caratteri standard (Times-Italic delle tessere) uguali a quelli di stampa
    standardFontDataUrl: `${import.meta.env.BASE_URL}pdfjs/standard_fonts/`,
  })
  try {
    const documento = await caricamento.promise
    const pagina = await documento.getPage(1)
    const base = pagina.getViewport({ scale: 1 })
    // Nitida anche sugli schermi ad alta densita'
    const scala = PX_PER_PUNTO * Math.max(2, window.devicePixelRatio || 1)
    const viewport = pagina.getViewport({ scale: scala })
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    await pagina.render({ canvas, viewport }).promise
    return { larghezzaMm: base.width * MM_PER_PUNTO, altezzaMm: base.height * MM_PER_PUNTO }
  } finally {
    caricamento.destroy()
  }
}
