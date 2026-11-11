/**
 * Chiede al browser di non cancellare da solo i dati dell'app quando manca spazio
 * (navigator.storage.persist). I dati dei soci vivono solo nel browser: senza questa
 * richiesta restano "Non protetti" e il browser puo' toglierli. Se sono gia' protetti non
 * chiede di nuovo. Non lancia mai: un browser che non lo sa fare risponde null.
 * @param {StorageManager|undefined} [storage]
 * @returns {Promise<boolean|null>} true protetti, false non concesso, null non si sa
 */
export async function chiediProtezioneDati(storage = globalThis.navigator?.storage) {
  try {
    if (typeof storage?.persisted === 'function' && (await storage.persisted()) === true) {
      return true
    }
    if (typeof storage?.persist !== 'function') {
      const risposta = await storage?.persisted?.()
      return typeof risposta === 'boolean' ? risposta : null
    }
    const concesso = await storage.persist()
    return typeof concesso === 'boolean' ? concesso : null
  } catch {
    return null
  }
}
