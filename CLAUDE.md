# Ceraiolo Digitale: istruzioni per gli agenti

Gestionale offline del tesseramento dei Ceraioli: Vue 3 + Pinia + Dexie (IndexedDB), nessun backend, pubblicato come PWA su GitHub Pages. I dati veri dei soci vivono solo nel browser della segreteria: un errore nel codice dei dati non si corregge da un server.

Regole ricavate da ScoreboardEssential e padel-dashboard, adattate a un progetto piccolo, con un solo sviluppatore e senza produzione remota. Lo stato attuale (duplicati, codice morto, test, design system) e' nell'analisi del 25 ottobre 2026: <https://claude.ai/artifact/KX8XUbr9uyCNYkwRfUxdqT>.

## Dove stanno le regole

| Cosa | Dove |
| --- | --- |
| Regole di pagamento (eta', esenzione minorenni, condono, arretrati, quota 25 EUR) | `src/utils/payment.js`, unica fonte |
| Accesso ai dati e changelog | `src/services/db.js` |
| Token e regole di interfaccia | `src/assets/main.css` e `docs/DESIGN.md` |
| Verifica manuale per area | `TEST_CHECKLIST.md` |

## Dati

- Le viste non scrivono su `db.*` direttamente: passano da una funzione di `db.js` che registra la modifica con `logLocalChange` (oggi `SocioDetailView` non lo fa, e' un debito noto).
- Un cambio di schema Dexie (`db.version(n)`) richiede una funzione di upgrade, un test che parte da un database della versione precedente e la nota "fare un backup prima di aggiornare" nella PR.
- Mai dati veri di soci nel repo, nei test o nelle PR: solo dati inventati (`generate_mock_data.py` o fixture scritte a mano).

## Test

- Vitest per la logica, con jsdom. Le regole del dominio sono funzioni pure in `src/utils/` e si testano senza browser; `db.js` si testa con `fake-indexeddb`.
- Ordine di valore: 1) `utils/payment.js`, 2) le funzioni di `db.js` che calcolano report e audit, 3) export (contenuto, non pixel), 4) componenti.
- Ogni bug corretto porta un test che e' rosso senza la correzione. Nella PR si scrive come lo si e' visto rosso ("tolta la riga X, il test fallisce con ...").
- Niente `skip`, `only` o test commentati per avere il verde. Un test instabile si segnala, non si nasconde.
- Controlli statici come test (stile padel-dashboard), quando la regola esiste: nessun `confirm(`/`alert(` del browser, nessun `var(--...)` non definito in `main.css`, nessun colore esadecimale scritto a mano nelle viste. Ognuno ha una lista di eccezioni motivate.

## Verifica e PR

Una PR si unisce su `main` solo quando:

1. La CI e' verde sull'ultimo commit: `npm run lint` (senza `--fix`), `npm run test -- --run` e `npm run build`. Un test rosso blocca.
2. La PR dice com'e' stata verificata: cosa e' stato eseguito e dove, cosa no ("non provato nel browser", "non provato con un database reale"), e per ogni test nuovo che cosa lo rende rosso.
3. Per l'interfaccia: aperta nel browser in tema chiaro e scuro, e la sezione `TEST_CHECKLIST.md` dell'area toccata ripassata a mano.
4. Un fix tocca solo cio' che deve. Pulizie e refactor vanno in PR separate.
5. Nessun commento di revisione senza risposta.

La sessione che apre la PR non la unisce: la porta al verde e riferisce. Unisce il proprietario.

## Codice morto

`npx knip` e `npx jscpd src --max-lines 100000 --max-size 5mb` sono il punto di partenza, non la sentenza. Ogni candidato si conferma con grep. Si distingue il codice morto (si rimuove) dalla funzionalita' costruita e mai collegata (decide il proprietario: per esempio `updateSocio()` va collegato, non cancellato).

## Interfaccia

Il design system e' la UI Constitution del proprietario: <https://claude.ai/artifact/8DhrtZW85wiHTsfw1vmXSn> (sola lettura). Prima di toccare l'interfaccia leggere `docs/DESIGN.md`: identita' del prodotto, mappatura dei token, conflitti dichiarati. In breve:

- Solo token: niente colori, spaziature, raggi o ombre scritti a mano. Un token nuovo solo se nomina un ruolo riusabile.
- Riusare prima di creare: un componente nuovo solo se passa il test di creazione della Constitution (riusato, stabile, non componibile con cio' che c'e').
- Niente emoji come icone e niente `confirm()` del browser nel codice nuovo; quelli esistenti si tolgono a lotti.
- Ogni stato che vale: normale, hover, premuto, fuoco, disattivo, in corso, vuoto, errore, sola lettura.
- Chiudere con il rapporto della Constitution (Review): cosa cambia, token e componenti riusati, stati, accessibilita' verificata, temi provati, rischi.

## Commit

In italiano, con prefisso convenzionale (`feat:`, `fix:`, `test:`, `refactor:`, `ui:`, `docs:`, `chore:`).
