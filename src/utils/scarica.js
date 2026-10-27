/**
 * Fa scaricare al browser un file gia' pronto in memoria.
 * @param {Blob} blob contenuto del file
 * @param {string} nomeFile nome proposto per il salvataggio
 */
export function scaricaBlob(blob, nomeFile) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeFile
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
