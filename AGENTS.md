# Interfaccia: istruzioni per gli agenti

Il lavoro sull'interfaccia di questo progetto segue il design system UI Constitution.

Design system: <https://claude.ai/artifact/8DhrtZW85wiHTsfw1vmXSn> (sola lettura). E' un artifact di tipo "Design System": i testi stanno nei suoi file `project/README.md` (brand book), `project/01-adapting.md`, `project/02-integration.md`, `project/03-layout.md`, `project/05-motion.md`, `project/06-states.md`, `project/07-output.md`, `project/09-checks.md`, `project/10-review.md` e `project/components/<Nome>/README.md`.
Se non riesci ad aprire il design system o i file del progetto qui sotto, fermati e chiedili. Non progettare a memoria.

File di questo progetto:

- Token: `src/assets/main.css`, unico file dei valori. La corrispondenza con i ruoli del sistema e' in `docs/DESIGN.md`.
- Adattamento (identita', mappatura, conflitti dichiarati, icone): `docs/DESIGN.md`.
- Glossario, da leggere prima di scrivere testi: `docs/GLOSSARIO.md`.
- Componenti base: `src/components/base/` (`BaseButton`, `BaseModal`, `PageHeader`, `SectionTabs`, `FilterSection`, `AppIcon` con la tabella concetto -> icona in `icons.js`) e `useDialog` per le conferme.
- Verifica manuale per area: `TEST_CHECKLIST.md`.

Prima di ogni modifica all'interfaccia:

1. Leggi il brand book del sistema e le sezioni Adapting, Layout, Motion e Review; per stati dell'app, PDF e controlli anche States, Output e Checks.
2. Leggi i token e i componenti di questo progetto. Riusali.
3. Scrivi il piano: gerarchia, layout, componenti riusati, stati, movimento, accessibilita', comportamento su schermi stretti, conflitti.
4. Per ogni scelta grafica proponi bozze A/B/C alle proporzioni vere, con la raccomandazione e la regola che ciascuna rispetta o rompe. Il proprietario sceglie con una lettera.

Sempre:

- Solo token. Niente colori, spaziature, raggi, ombre, durate o curve scritti a mano.
- Icone dalla tabella dei concetti (`icons.js`). Una sola famiglia, Lucide. Niente emoji.
- Un token nuovo solo se nomina un ruolo riusabile; un componente nuovo solo se passa il test di creazione di Adapting.
- Niente `confirm()`, `alert()` o `prompt()` del browser: le conferme passano da `useDialog` e nominano l'oggetto e la conseguenza.
- Ogni stato che vale, entrambi i temi (chiaro e scuro), tastiera e movimento ridotto.
- Ogni animazione collega due stati e usa i token condivisi.
- Cambi di pagina, indietro, menu, tastiera e ridimensionamento seguono Transitions.
- Testi in italiano, con le parole del glossario.

Identita' del progetto:

```text
Product character: app web Vue per la segreteria del tesseramento dei Ceraioli, usata al computer per inserire molte ricevute di fila
Density: compact, ovunque (tabelle, moduli, scheda socio, registrazione seriale)
Geometry: precise
Accent behavior: restrained (il rosso solo per l'azione primaria, la selezione e il fuoco)
Motion character: calm
Primary domain pattern: cerca socio -> scheda con anni pagati e arretrati -> registra la ricevuta; dopo il rientro dei blocchetti, ricevute registrate di fila da tastiera
Distinctive visual behavior: rosso di Sant'Antonio su fondo chiaro, titoli in Merriweather, anni come griglia tabulare pagata / esente / da pagare
Language: italiano
```

Toni e accento (chiaro / scuro): background-canvas = `#f4f5f7` / `#121212`, background-surface = `#ffffff` / `#1e1e1e`, accent-default = `#b71c1c` / `#ef5350`, on-accent = `#ffffff` / `#121212`.

Chiudi con il rapporto e il controllo dei pattern vietati di Review, e con le celle della matrice di Checks provate.
