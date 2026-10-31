# Design: adattamento alla UI Constitution

Le regole dell'interfaccia sono quelle della UI Constitution (<https://claude.ai/artifact/8DhrtZW85wiHTsfw1vmXSn>); come leggerla e l'identita' del progetto sono in `AGENTS.md`, le parole in `docs/GLOSSARIO.md`. Qui c'e' solo cio' che e' specifico di Ceraiolo Digitale: compiti delle schermate, corrispondenza tra token e ruoli, contrasti verificati, conflitti dichiarati e tabella delle icone. Aggiornato al 31 ottobre 2026.

## Compito di ogni schermata

| Schermata                                     | Compito                                                          | Valore piu' importante                    |
| --------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------- |
| Soci (`HomeView`)                             | trovare un socio                                                 | il socio cercato e se e' in regola        |
| Dettaglio socio (`SocioDetailView`)           | capire la situazione e registrare un pagamento                   | anni pagati e arretrati                   |
| Registra ricevute (`BatchEntryView`)          | registrare molte ricevute di fila dopo il rientro dei blocchetti | il socio corrente, la ricevuta e la quota |
| Report PDF (`ReportsView`, `ReportsBetaView`) | stampare un elenco                                               | l'anteprima, uguale al PDF                |
| Blocchetti (`BlocchettiView`)                 | sapere chi ha quale blocchetto                                   | blocchetti non restituiti                 |
| Impostazioni (`SettingsView`)                 | configurare e fare il backup                                     | lo stato del backup                       |

## Token e ruoli

Un solo file di valori: `src/assets/main.css`. I vecchi nomi con prefisso `--color-` (circa 600 usi) restano; dal 31 ottobre 2026 ogni ruolo che ha gia' un valore e' definito anche con il nome del ruolo, come alias dello stesso valore (`--accent-default: var(--color-accent)`). Il codice nuovo usa i nomi dei ruoli; i vecchi spariscono pagina per pagina. I valori sono quelli del progetto, non i predefiniti del sistema. I ruoli segnati "manca" si definiscono nella PR che li usa per prima, con le bozze A/B/C: i predefiniti del sistema per stati, avvisi e grafici sono costruiti su un accento blu e non vanno bene col rosso.

Gli alias definiti sono quelli delle righe con un token in "Token oggi", piu' `--shadow-floating` (= `--shadow-md`), `--shadow-overlay` (= `--shadow-lg`), `--z-overlay` (= `--z-modal`), `--content-max` (= `--page-width`) e `--opacity-disabled` (0,6, il valore gia' usato dai controlli disattivi).

Colori:

| Ruolo                                 | Token oggi                                           | Chiaro    | Scuro     | Note                                                                                    |
| ------------------------------------- | ---------------------------------------------------- | --------- | --------- | --------------------------------------------------------------------------------------- |
| `background-canvas`                   | `--color-background`                                 | `#f4f5f7` | `#121212` |                                                                                         |
| `background-surface`                  | `--color-surface`                                    | `#ffffff` | `#1e1e1e` |                                                                                         |
| `background-elevated`                 | `--color-surface-elevated`                           | `#ffffff` | `#262626` | dialoghi e pannelli                                                                     |
| `text-primary`                        | `--color-text-primary`                               | `#1a1a1a` | `#e0e0e0` | `--color-primary` e' lo stesso valore usato come testo: confluisce qui                  |
| `text-secondary`                      | `--color-text-secondary`                             | `#5c6266` | `#a0a0a0` | `--color-primary-light` (`#333333` / `#b0b0b0`) va ricondotto a uno dei due             |
| `text-disabled`                       | manca                                                |           |           | oggi `opacity: 0.6` sul controllo                                                       |
| `border-subtle`                       | `--color-border`                                     | `#e1e4e8` | `#333333` |                                                                                         |
| `border-group`                        | manca                                                |           |           | oggi i gruppi usano `--color-border`                                                    |
| `border-strong`                       | `--color-border-strong`                              | `#6b7178` | `#8a8a8a` | bordi dei campi, 3:1 sul fondo                                                          |
| `accent-default`                      | `--color-accent`                                     | `#b71c1c` | `#ef5350` | rosso di Sant'Antonio                                                                   |
| `accent-hover`                        | `--color-accent-hover`                               | `#c62828` | `#ff7961` |                                                                                         |
| `accent-pressed`                      | manca                                                |           |           | oggi `transform: scale(0.98)` sul bottone                                               |
| `on-accent`                           | `--color-text-inverse`                               | `#ffffff` | `#121212` |                                                                                         |
| `status-success`                      | `--color-success` (+ `-hover`)                       | `#2e7d32` | `#66bb6a` |                                                                                         |
| `status-warning`                      | `--color-warning`                                    | `#b45309` | `#ffa726` |                                                                                         |
| `status-error`                        | `--color-danger` (+ `-hover`)                        | `#c62828` | `#ef5350` |                                                                                         |
| `status-info`                         | `--color-info`                                       | `#026aa7` | `#29b6f6` |                                                                                         |
| `status-*-subtle`                     | mancano                                              |           |           | fondi degli avvisi                                                                      |
| `focus-ring`                          | `--focus-ring`                                       | `#b71c1c` | `#ef5350` | 2px, distanza 2px                                                                       |
| `state-hover`                         | `--color-surface-hover`                              | `#f9fafb` | `#2c2c2c` | oggi e' un fondo pieno, non una sovrapposizione                                         |
| `state-pressed`, `state-selected`     | mancano                                              |           |           |                                                                                         |
| `scrim`                               | `--color-scrim`                                      | nero 50%  | nero 70%  |                                                                                         |
| `chart-1` ... `chart-5`, `chart-grid` | mancano                                              |           |           | il grafico Andamento oggi usa i colori di stato                                         |
| `user-1` ... `user-8`                 | non servono                                          |           |           | nessun colore scelto dall'utente                                                        |
| fuori dai ruoli                       | `--color-secondary` (+ `-hover`), `--color-input-bg` |           |           | bottoni secondari pieni e fondo dei campi: da ricondurre ai ruoli nelle PR delle pagine |

Altre famiglie:

| Ruolo                                                                  | Token oggi                                    | Valore                          | Note                                                                                                         |
| ---------------------------------------------------------------------- | --------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `space-4` ... `space-64`                                               | `--space-4` ... `--space-64`                  | 4, 8, 12, 16, 24, 32, 48, 64 px |                                                                                                              |
| `radius-control`, `radius-surface`, `radius-overlay`, `radius-full`    | `--radius-*`                                  | 6, 8, 12, 999 px                | piu' squadrati del sistema (10, 16, 22): geometria precisa. Il `button` globale usa ancora 8px               |
| `shadow-floating`, `shadow-overlay`                                    | `--shadow-sm`, `--shadow-md`, `--shadow-lg`   |                                 | i nomi non dicono il ruolo; `--shadow-sm` e' anche sui campi e sui bottoni, che il sistema vuole senza ombra |
| `display`, `page-title`, `section-heading`, `body`, `label`, `caption` | `--font-size-*`                               | 36, 28, 20, 16, 14, 13 px       | `body-strong` e `numeric` mancano                                                                            |
| famiglie di caratteri                                                  | `--font-family-heading`, `--font-family-body` | Merriweather, Inter             | inclusi nell'app; vedi i conflitti                                                                           |
| `content-max`                                                          | `--page-width` (+ `-form`, `-wide`)           | 1200, 800, 1440 px              |                                                                                                              |
| `z-base` ... `z-toast`                                                 | `--z-modal`                                   | 1000                            | gli altri livelli mancano                                                                                    |
| `duration-*`, `ease-*`                                                 | mancano                                       |                                 | oggi 0,15-0,5 s scritti a mano                                                                               |
| `icon-*`, `control-*`, `measure`                                       | mancano                                       |                                 |                                                                                                              |
| `bp-compact`, `bp-medium`, `bp-expanded`                               | mancano                                       |                                 | oggi 9 larghezze diverse nelle `@media` (480-1100 px)                                                        |
| `page-gutter`, `pane-side`, `rail`                                     | mancano                                       |                                 |                                                                                                              |

## Contrasti

Verificati in G-1 (WCAG, prima -> dopo):

| Coppia                                         | Prima       | Dopo                         |
| ---------------------------------------------- | ----------- | ---------------------------- |
| accento scuro come testo su surface scura      | 3,94        | 4,78 (`#ef5350`)             |
| `on-accent` scuro (`#121212`) su accento scuro | 4,43        | 5,37                         |
| `status-warning` chiaro su bianco              | 3,11        | 5,02 (`#b45309`)             |
| `status-info` chiaro su canvas                 | 3,86        | 5,31 (`#026aa7`)             |
| bordo dei campi su bianco / su `#2c2c2c`       | 1,28 / 1,32 | 4,9 / 4,05 (`border-strong`) |

Da ricontrollare nelle PR delle pagine: testo `white` scritto a mano su fondo accento nel tema scuro (3,49 con `#ef5350`: va usato `on-accent`).

## Conflitti dichiarati

- **Caratteri.** Il sistema usa il font di sistema; il progetto usa Merriweather (titoli) e Inter (testo), inclusi nell'app perche' funzioni offline. Si tengono: scelta 3A delle bozze della PR 4 (<https://claude.ai/artifact/VgUjAJZCoV5qrHwzRTmGs7>, 31 ottobre 2026), per non cambiare l'aspetto prima della stampa delle tessere. Le alternative provate erano Merriweather con il font di sistema e il solo font di sistema.
- **Tema ad alto contrasto.** Non previsto: poche persone, sempre allo stesso computer (decisione del 31 ottobre 2026).
- **Densita'.** Compatta ovunque, anche nei moduli e nella scheda socio (decisione del 31 ottobre 2026).
- **Lettere V, X, O, -.** I badge dello stato della quota usano le stesse lettere delle colonne dei PDF, sempre accanto alla parola (Pagata, Da pagare, Esente, Non iscritto): lo stato non dipende dal colore.
- **Raggi.** 6 / 8 / 12 px invece di 10 / 16 / 22: l'interfaccia e' uno strumento da banco, geometria precisa.

## Icone

Le regole sulle icone sono quelle del sistema (Iconography). Qui la tabella concetto -> icona del progetto: la fonte e' `src/components/base/icons.js`, si usa tramite `AppIcon`.

| Concetto                           | Icona                                  | Concetto                    | Icona                    |
| ---------------------------------- | -------------------------------------- | --------------------------- | ------------------------ |
| ricerca                            | Search                                 | pagamento                   | CreditCard               |
| registrazione-seriale              | ListPlus                               | quota                       | Euro                     |
| blocchetto                         | NotebookText                           | data                        | Calendar                 |
| ricevuta                           | ReceiptText                            | documento                   | FileText                 |
| report                             | ChartColumn                            | rapido (rinnovo, turbo)     | Zap                      |
| impostazioni                       | Settings                               | tessera                     | IdCard                   |
| socio / nuovo-socio                | User / UserPlus                        | anagrafica                  | UserRound                |
| gruppo                             | Users                                  | eta                         | Cake                     |
| luogo                              | MapPin                                 | nota                        | StickyNote               |
| aggiungi / modifica                | Plus / Pencil                          | salva / conferma            | Save / Check             |
| chiudi                             | X                                      | elimina                     | Trash2                   |
| esporta                            | Download                               | restituisci                 | Undo2                    |
| dettagli                           | Eye                                    | filtri                      | Funnel                   |
| indietro / precedente / successivo | ArrowLeft / ChevronLeft / ChevronRight | link                        | Link                     |
| espandi (sezione richiudibile)     | ChevronDown                            |                             |                          |
| errore                             | CircleAlert                            | caricamento                 | LoaderCircle (gira)      |
| recenti / attivita / changelog     | History / Activity / ScrollText        | ripara                      | Wrench                   |
| in-aumento / in-calo / stabile     | TrendingUp / TrendingDown / Minus      | tema-chiaro / tema-scuro    | Sun / Moon               |
| ripristina                         | RotateCcw                              |                             |                          |
| automatico                         | RefreshCw                              | cartella                    | Folder                   |
| archivio                           | Archive                                | foglio-calcolo              | FileSpreadsheet          |
| configurazione                     | FileBraces                             | audio-attivo / audio-spento | Volume2 / VolumeX        |
| ok / attenzione                    | CircleCheck / TriangleAlert            | pericolo / disattivo        | OctagonAlert / CircleOff |
| statistiche / elenco               | ChartLine / List                       | audit                       | Scale                    |
| personalizza                       | SlidersHorizontal                      | numeri / votazioni          | Hash / Vote              |
| info                               | Info                                   | qualita-dati                | ShieldCheck              |

## Adozione

Piano a 13 PR, approvato il 31 ottobre 2026: <https://claude.ai/artifact/Rfv3uVd1praZN1NKX5YZG8>. Passi gia' fatti prima del piano:

- G-1: token mancanti di allora (`status-error`, `space-*`, `radius-*`, ruoli tipografici, `focus-ring`, `surface-elevated`, `border-strong`) e correzione dei contrasti; `src/assets/__tests__/tokens.test.js` rifiuta `var(--x)` non definiti e colori senza valore scuro.
- G-2: `BaseModal`, `BaseButton`, `useDialog`; `dialoghiNativi.test.js` rifiuta `confirm()`, `alert()`, `prompt()`.
- G-3: icone Lucide al posto delle emoji; `icone.test.js` impedisce che tornino.
