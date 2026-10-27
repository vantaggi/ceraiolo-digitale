/**
 * Lista recupero: chi ha pagato l'anno prima ma non ancora l'anno scelto.
 */

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
  const haPagato = (id, a) => (perSocio.get(id) || []).some((t) => Number(t.anno) === a)

  return soci
    .filter((s) => haPagato(s.id, anno - 1) && !haPagato(s.id, anno))
    .map((s) => ({ ...s, tesseramenti: perSocio.get(s.id) }))
    .sort(confrontaSoci)
}
