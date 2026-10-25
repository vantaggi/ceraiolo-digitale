# Design: adattamento alla UI Constitution

Il design system e' la UI Constitution del proprietario (<https://claude.ai/artifact/8DhrtZW85wiHTsfw1vmXSn>). La Constitution fissa ruoli e regole; i valori sono quelli di questo progetto. Qui c'e' la mappatura, le lacune e i conflitti dichiarati. Stato al 25 ottobre 2026, nessun codice ancora cambiato.

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
| `background-elevated` | manca | default: `#ffffff` + `shadow-overlay` | da definire |
| `text-primary` | `--color-text-primary` | `#1a1a1a` | `#e0e0e0` |
| `text-secondary` | `--color-text-secondary` | `#5c6266` | `#a0a0a0` |
| `accent-default` | `--color-accent` | `#b71c1c` | `#e53935` |
| `accent-hover` | `--color-accent-hover` | `#c62828` | `#ef5350` |
| `on-accent` | `--color-text-inverse` | `#ffffff` | `#121212` |
| `border-subtle` | `--color-border` | `#e1e4e8` | `#333333` |
| `status-success` | `--color-success` | `#2e7d32` | `#66bb6a` |
| `status-warning` | `--color-warning` | `#ed6c02` | `#ffa726` |
| `status-info` | `--color-info` | `#0288d1` | `#29b6f6` |
| `status-error` | manca (`--color-danger` e' usato 15 volte ma non definito) | da definire | da definire |
| `shadow-*` | `--shadow-sm/md/lg` | definiti | definiti |
| `space-*`, `radius-*`, ruoli tipografici, `focus-ring`, `z-*` | mancano | 8 raggi e 23 dimensioni di font diversi scritti a mano | |

`--color-primary` e `--color-primary-light` sono testo, non un accento: confluiscono in `text-primary`.

## Contrasti da correggere (WCAG, misurati sui valori attuali)

| Coppia | Rapporto | Soglia |
| --- | --- | --- |
| `on-accent` scuro (`#121212`) su accento scuro (`#e53935`) | 4,43 | 4,5 |
| accento scuro come testo su surface scura | 3,94 | 4,5 |
| `status-warning` chiaro come testo su bianco | 3,11 | 4,5 |
| `status-info` chiaro come testo su bianco | 3,86 | 4,5 |
| bordi (chiaro 1,28, scuro 1,32) | | 3 per i bordi dei controlli |

## Conflitti dichiarati

- **Font.** La Constitution usa il font di sistema; il progetto usa Merriweather (titoli) e Inter (testo) da Google Fonts. Si tengono: sono l'identita' del progetto. Da valutare l'hosting locale dei font, perche' l'app lavora offline.
- **Icone.** La Constitution vuole Lucide in SVG; oggi ci sono 194 emoji usate come icone in 16 file (navigazione inclusa). Si passa a Lucide a lotti, per schermata.
- **Conferme.** 10 `confirm()` del browser; la Constitution chiede che la conferma distruttiva nomini l'oggetto e la conseguenza. Si sostituiscono con un componente di dialogo unico, partendo da `ConfirmDeleteModal`.
- **Tema ad alto contrasto.** Non previsto per ora: app desktop usata da poche persone. Si rivaluta se serve.

## Debiti

- 5 modali con stili propri (`.modal-content` definito 8 volte): un `BaseModal` passa il test di creazione dei componenti.
- ~120 colori scritti a mano nelle viste, soprattutto `BatchEntryView`, `ReportsBetaView`, `SettingsView`, `DashboardCharts`.
- ~810 righe di CSS copiate fra `ReportsView` e `ReportsBetaView`.

## Ordine dei passi

1. G-1: token mancanti (`status-error`, `space-*`, `radius-*`, ruoli tipografici, `focus-ring`) e correzione dei contrasti, con un test statico che rifiuta `var(--x)` non definiti.
2. G-2: `BaseModal` e `BaseButton`, poi via i `confirm()` nativi.
3. G-3: tabella concetto -> icona Lucide, poi via le emoji schermata per schermata.
4. G-4: colori scritti a mano sostituiti dai token, vista per vista.
