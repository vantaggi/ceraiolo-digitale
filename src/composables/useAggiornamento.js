// Versione nuova dell'app pronta (stati dell'app, 06-states del design system).
// Il service worker la scarica in silenzio; l'app lo dice nella riga di stato e si
// ricarica solo quando la persona preme Ricarica. Senza la scelta, la versione nuova
// parte alla prossima apertura.
import { ref } from 'vue'

const pronta = ref(false)
let aggiorna = null

/** Da main.js: la funzione del service worker che attiva la versione nuova e ricarica. */
export function impostaAggiornamento(funzione) {
  aggiorna = funzione
}

/** Da main.js, quando il service worker ha una versione nuova in attesa. */
export function segnalaVersionePronta() {
  pronta.value = true
}

export function useAggiornamento() {
  return {
    pronta,
    ricarica: () => aggiorna?.(true),
  }
}
