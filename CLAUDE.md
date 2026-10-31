# Ceraiolo Digitale: istruzioni per gli agenti

Gestionale offline del tesseramento dei Ceraioli: Vue 3 + Pinia + Dexie (IndexedDB), nessun backend, pubblicato come PWA su GitHub Pages. I dati veri dei soci vivono solo nel browser della segreteria: un errore nel codice dei dati non si corregge da un server.

Regole ricavate da ScoreboardEssential e padel-dashboard, adattate a un progetto piccolo, con un solo sviluppatore e senza produzione remota. Lo stato attuale (duplicati, codice morto, test, design system) e' nell'analisi del 25 ottobre 2026: <https://claude.ai/artifact/KX8XUbr9uyCNYkwRfUxdqT>.

## Dove stanno le regole

| Cosa                                                                              | Dove                                                               |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Regole di pagamento (eta', esenzione minorenni, condono, arretrati, quota 25 EUR) | `src/utils/payment.js`, unica fonte                                |
| Iscritto, nuovo, rientro, non rinnovato; diritto di voto                          | `src/utils/iscrizione.js`, `src/utils/voto.js`                     |
| Accesso ai dati e changelog                                                       | `src/services/db.js`                                               |
| Regole di interfaccia                                                             | `AGENTS.md`, poi `docs/DESIGN.md`; valori in `src/assets/main.css` |
| Parole dell'interfaccia                                                           | `docs/GLOSSARIO.md`                                                |
| Verifica manuale per area                                                         | `TEST_CHECKLIST.md`                                                |

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

La sessione che apre la PR la porta al verde e riferisce. Dal 27 ottobre 2026 il proprietario autorizza a unire con merge commit le PR di cui si e' sicuri al 100%: CI verde, verifica scritta, nessun commento aperto, nessuna decisione di prodotto in sospeso. Cambi di schema Dexie, cancellazioni di codice o dati e tutto cio' che lascia un dubbio li unisce il proprietario.

## Codice morto

`npx knip` e `npx jscpd src --max-lines 100000 --max-size 5mb` sono il punto di partenza, non la sentenza. Ogni candidato si conferma con grep. Si distingue il codice morto (si rimuove) dalla funzionalita' costruita e mai collegata (decide il proprietario: per esempio `updateSocio()` va collegato, non cancellato).

## Interfaccia

Le regole dell'interfaccia stanno in `AGENTS.md` (importato qui sotto): design system UI Constitution, identita' del progetto, file dei token, glossario. Leggerlo prima di toccare l'interfaccia.

@AGENTS.md

## Commit

In italiano, con prefisso convenzionale (`feat:`, `fix:`, `test:`, `refactor:`, `ui:`, `docs:`, `chore:`).
