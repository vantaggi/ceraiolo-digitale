# Design: adattamento alla UI Constitution

Il design system e' la UI Constitution del proprietario (<https://claude.ai/artifact/8DhrtZW85wiHTsfw1vmXSn>). La Constitution fissa ruoli e regole; i valori sono quelli di questo progetto. Qui c'e' la mappatura, le lacune e i conflitti dichiarati. Aggiornato al 25 ottobre 2026, dopo G-1.

## Identita'

```text
Product character: gestionale da segreteria per il tesseramento, usato al banco durante i rinnovi con la fila davanti
Density: balanced nei moduli e nella scheda socio; compact nelle tabelle, nei report e nella registrazione seriale
Geometry: precise
Accent behavior: restrained (il rosso solo per l'azione primaria, la selezione e il fuoco)
Motion character: calm
Primary domain pattern: cerca socio -> scheda con gli anni pagati e gli arretrati -> registra il pagamento
Distinctive visual behavior: rosso di Sant'Antonio su fondo chiaro, titoli in Merriweather, anni come griglia tabulare pagato / esente / arretrato
```

Compito principale di ogni schermata:

| Schermata | Compito | Valore piu' importante |
| --- | --- | --- |
| Ricerca (`HomeView`) | trovare un socio | il socio cercato e se e' in regola |
| Scheda socio (`SocioDetailView`) | capire la situazione e registrare un pagamento | anni pagati e arretrati |
| Registrazione seriale (`BatchEntryView`) | registrare molti rinnovi di fila | il socio corrente e la quota |
| Report (`ReportsView`) | stampare un elenco | l'elenco scelto e il bottone di stampa |
| Blocchetti | sapere chi ha quale blocchetto | blocchetti non restituiti |
| Impostazioni | configurare e fare backup | lo stato del backup |

## Mappatura dei token

I valori restano quelli di `src/assets/main.css`. Il passo successivo rinomina o aggiunge alias con i nomi dei ruoli.

| Ruolo Constitution | Oggi | Chiaro | Scuro |
| --- | --- | --- | --- |
| `background-canvas` | `--color-background` | `#f4f5f7` | `#121212` |
| `background-surface` | `--color-surface` | `#ffffff` | `#1e1e1e` |
| `background-elevated` | `--color-surface-elevated` | `#ffffff` | `#262626` |
| `text-primary` | `--color-text-primary` | `#1a1a1a` | `#e0e0e0` |
| `text-secondary` | `--color-text-secondary` | `#5c6266` | `#a0a0a0` |
| `accent-default` | `--color-accent` | `#b71c1c` | `#ef5350` |
| `accent-hover` | `--color-accent-hover` | `#c62828` | `#ff7961` |
| `on-accent` | `--color-text-inverse` | `#ffffff` | `#121212` |
| `border-subtle` | `--color-border` | `#e1e4e8` | `#333333` |
| `border-strong` (bordi dei controlli) | `--color-border-strong` | `#6b7178` | `#8a8a8a` |
| `status-success` | `--color-success` | `#2e7d32` | `#66bb6a` |
| `status-warning` | `--color-warning` | `#b45309` | `#ffa726` |
| `status-info` | `--color-info` | `#026aa7` | `#29b6f6` |
| `status-error` | `--color-danger` (+ `-hover`) | `#c62828` | `#ef5350` |
| `focus-ring` | `--focus-ring` | `#b71c1c` | `#ef5350` |
| `shadow-*` | `--shadow-sm/md/lg` | definiti | definiti |
| `space-4` ... `space-64` | `--space-4` ... `--space-64` | 4, 8, 12, 16, 24, 32, 48, 64 px | |
| `radius-control/surface/overlay/full` | `--radius-*` | 6, 8, 12, 999 px | |
| ruoli tipografici | `--font-size-caption/label/body/section-heading/page-title/display` | 13, 14, 16, 20, 28, 36 px | |

I nomi restano quelli con prefisso `--color-` gia' usati in ~600 punti: la tabella e' la corrispondenza con i ruoli. Spaziature, raggi e ruoli tipografici sono definiti da G-1 ma le viste li adotteranno in G-4.

`--color-primary` e `--color-primary-light` sono testo, non un accento: confluiscono in `text-primary`.

## Contrasti

Corretti in G-1 (WCAG, prima -> dopo):

| Coppia | Prima | Dopo |
| --- | --- | --- |
| accento scuro come testo su surface scura | 3,94 | 4,78 (`#ef5350`) |
| `on-accent` scuro (`#121212`) su accento scuro | 4,43 | 5,37 |
| `status-warning` chiaro su bianco | 3,11 | 5,02 (`#b45309`) |
| `status-info` chiaro su canvas | 3,86 | 5,31 (`#026aa7`) |
| bordo dei campi su bianco / su `#2c2c2c` | 1,28 / 1,32 | 4,9 / 4,05 (`border-strong`) |

Restano da correggere in G-4, perche' dipendono da colori scritti a mano nelle viste: il testo `white` sui bottoni con fondo accento nel tema scuro (3,49 con `#ef5350`, era 4,23 con `#e53935`: va usato `--color-text-inverse`), e i bottoni con fondo `--color-primary` e testo bianco, illeggibili nel tema scuro (per esempio "Modifica" nella scheda socio).

## Conflitti dichiarati

- **Font.** La Constitution usa il font di sistema; il progetto usa Merriweather (titoli) e Inter (testo) da Google Fonts. Si tengono: sono l'identita' del progetto. Da valutare l'hosting locale dei font, perche' l'app lavora offline.
- **Icone.** La Constitution vuole Lucide in SVG; il 25 ottobre c'erano 210 emoji e simboli usati come icone in 16 file. Si passa a Lucide a lotti, per schermata (vedi "Icone" sotto).
- **Conferme.** 10 `confirm()` del browser; la Constitution chiede che la conferma distruttiva nomini l'oggetto e la conseguenza. Si sostituiscono con un componente di dialogo unico, partendo da `ConfirmDeleteModal`.
- **Tema ad alto contrasto.** Non previsto per ora: app desktop usata da poche persone. Si rivaluta se serve.

## Icone

Solo Lucide, tramite `AppIcon` (`src/components/base/AppIcon.vue`). Un concetto ha una sola icona: la tabella vive in `src/components/base/icons.js`, qui il riassunto. L'icona e' decorativa quando c'e' un testo accanto; un bottone con la sola icona ha `aria-label` (o `label` su `AppIcon`).

| Concetto | Icona | Concetto | Icona |
| --- | --- | --- | --- |
| ricerca | Search | pagamento | CreditCard |
| registrazione-seriale | ListPlus | quota | Euro |
| blocchetto | NotebookText | data | Calendar |
| ricevuta | ReceiptText | documento | FileText |
| report | ChartColumn | rapido (rinnovo, turbo) | Zap |
| impostazioni | Settings | tessera | IdCard |
| socio / nuovo-socio | User / UserPlus | anagrafica | UserRound |
| gruppo | Users | eta | Cake |
| luogo | MapPin | nota | StickyNote |
| aggiungi / modifica | Plus / Pencil | salva / conferma | Save / Check |
| chiudi | X | elimina | Trash2 |
| esporta | Download | restituisci | Undo2 |
| dettagli | Eye | filtri | Funnel |
| indietro / precedente / successivo | ArrowLeft / ChevronLeft / ChevronRight | link | Link |
| errore | CircleAlert | caricamento | LoaderCircle (gira) |
| recenti / attivita / changelog | History / Activity / ScrollText | ripara | Wrench |
| in-aumento / in-calo / stabile | TrendingUp / TrendingDown / Minus | tema-chiaro / tema-scuro | Sun / Moon |
| ripristina | RotateCcw | | |
| automatico | RefreshCw | cartella | Folder |
| archivio | Archive | foglio-calcolo | FileSpreadsheet |
| configurazione | FileBraces | audio-attivo / audio-spento | Volume2 / VolumeX |
| ok / attenzione | CircleCheck / TriangleAlert | pericolo / disattivo | OctagonAlert / CircleOff |
| statistiche / elenco | ChartLine / List | audit | Scale |
| personalizza | SlidersHorizontal | numeri / votazioni | Hash / Vote |
| info | Info | | |

Le lettere V, X, O e - dei badge di stato dei pagamenti restano: sono la stessa notazione delle colonne "Anni di pagamento (V/X)" dei PDF, e stanno accanto all'etichetta scritta.

## Debiti

- 5 modali con stili propri (`.modal-content` definito 8 volte): un `BaseModal` passa il test di creazione dei componenti.
- ~120 colori scritti a mano nelle viste, soprattutto `BatchEntryView`, `ReportsBetaView`, `SettingsView`, `DashboardCharts`.
- ~810 righe di CSS copiate fra `ReportsView` e `ReportsBetaView`.

## Ordine dei passi

1. G-1 (fatto): token mancanti (`status-error`, `space-*`, `radius-*`, ruoli tipografici, `focus-ring`, `surface-elevated`, `border-strong`) e correzione dei contrasti; `src/assets/__tests__/tokens.test.js` rifiuta `var(--x)` non definiti e colori senza valore scuro.
2. G-2: `BaseModal` e `BaseButton`, poi via i `confirm()` nativi.
3. G-3: tabella concetto -> icona Lucide, poi via le emoji schermata per schermata. Fatto in tre lotti (PR #7, #8 e il lotto dei Report): nessuna emoji resta nei sorgenti, e `src/components/__tests__/icone.test.js` impedisce che tornino.
4. G-4: colori scritti a mano sostituiti dai token, vista per vista.
