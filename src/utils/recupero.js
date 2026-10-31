/**
 * Lista recupero: i non rinnovati dell'anno scelto, cioe' gli iscritti dell'anno prima
 * che non sono iscritti in questo (definizione del glossario, in iscrizione.js). Ci sono
 * anche i minorenni esenti diventati maggiorenni che non hanno ancora pagato.
 */
import { movimentoAnno } from './iscrizione'

const confrontaSoci = (a, b) =>
  `${a.cognome} ${a.nome}`.localeCompare(`${b.cognome} ${b.nome}`, 'it', { sensitivity: 'base' })

/**
 * @param {Array<object>} soci
 * @param {Array<{id_socio: number, anno: number}>} tesseramenti - di tutti gli anni
 * @param {number} anno
 * @returns {Array<object>} soci in ordine alfabetico, ognuno con i suoi tesseramenti
 */
export function elencoRecupero(soci, tesseramenti, anno) {
  const perSocio = new Map()
  for (const t of tesseramenti) {
    if (!perSocio.has(t.id_socio)) perSocio.set(t.id_socio, [])
    perSocio.get(t.id_socio).push(t)
  }
  const anniDi = (id) => (perSocio.get(id) || []).map((t) => Number(t.anno))

  return soci
    .filter((s) => movimentoAnno(s, anniDi(s.id), anno) === 'non-rinnovato')
    .map((s) => ({ ...s, tesseramenti: perSocio.get(s.id) || [] }))
    .sort(confrontaSoci)
}
