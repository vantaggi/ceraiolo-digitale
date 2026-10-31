#!/usr/bin/env node
/**
 * Controlli della UI Constitution (sezione Checks) che non sono ancora test.
 *
 * Conta in src/ i valori scritti a mano al posto dei token e le regole di business
 * ricopiate fuori dal loro modulo. Durante l'adozione e' solo un avviso: in CI stampa
 * i conteggi e non blocca. Quando un conteggio arriva a zero, il suo controllo diventa
 * un test che blocca (passo "e" del piano di adozione, vedi docs/DESIGN.md).
 *
 * Gia' bloccati da test, quindi non contati qui: token non definiti
 * (src/assets/__tests__/tokens.test.js), emoji (icone.test.js), confirm/alert/prompt del
 * browser (dialoghiNativi.test.js).
 *
 * Uso: node scripts/controlli-ui.mjs [--ci]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** File esclusi, con il motivo. */
export const ECCEZIONI = {
  'src/assets/main.css': 'e il file dei token: i valori stanno qui',
  'src/services/tessere.js': 'colore del testo stampato sulla tessera (pdf-lib), non CSS',
}

export const stripComments = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(^|[^:'"\\])\/\/.*$/gm, '$1')

/** Dichiarazioni CSS `proprieta: valore` (anche dentro style="..."). */
const dichiarazioni = (text, proprieta) => {
  const re = new RegExp(`(?:^|[\\s;{"'])(${proprieta})\\s*:\\s*([^;}"'\\n]+)`, 'g')
  return [...text.matchAll(re)].map((m) => ({ proprieta: m[1], valore: m[2].trim() }))
}

const senzaVar = (valore) => valore.replace(/var\([^()]*(\([^()]*\))?[^()]*\)/g, '')

const NOMI_COLORE = /\b(white|black|red|green|blue|gray|grey|orange|purple|yellow|pink)\b/i

/**
 * Ogni controllo conta le occorrenze in un testo gia' senza commenti.
 * @type {Array<{ id: string, nome: string, conta: (testo: string, file: string) => number }>}
 */
export const CONTROLLI = [
  {
    id: 'colori',
    nome: 'Colori scritti a mano (esadecimali, rgb(), hsl(), nomi)',
    conta: (testo) => {
      // In un template '#' introduce anche ancore e slot (#default): un esadecimale conta
      // solo dopo ':' o ',' o '(' o uno spazio dentro un valore, mai dopo '<template ' o '='.
      const esadecimali = [...testo.matchAll(/#[0-9a-fA-F]{3,8}\b(?![-\w])/g)].filter((m) => {
        const prima = testo.slice(Math.max(0, m.index - 40), m.index)
        return /[:,(]\s*$|[:,(][^;{}<>"']*\s$/.test(prima) && !/(href|to)=["'][^"']*$/.test(prima)
      }).length
      const funzioni = (testo.match(/\b(rgba?|hsla?)\(/g) || []).length
      const nomi = dichiarazioni(
        testo,
        'color|background|background-color|border|border-[a-z-]+|outline|outline-color|fill|stroke',
      ).filter((d) => NOMI_COLORE.test(senzaVar(d.valore))).length
      return esadecimali + funzioni + nomi
    },
  },
  {
    id: 'raggi',
    nome: 'Raggi scritti a mano',
    conta: (testo) =>
      dichiarazioni(testo, 'border(?:-[a-z]+)*-radius').filter((d) => /\d/.test(senzaVar(d.valore)))
        .length,
  },
  {
    id: 'testo',
    nome: 'Dimensioni del testo scritte a mano',
    conta: (testo) =>
      dichiarazioni(testo, 'font-size').filter((d) => /\d/.test(senzaVar(d.valore))).length,
  },
  {
    id: 'pesi',
    nome: 'Pesi del testo fuori da 400, 500, 600',
    conta: (testo) =>
      dichiarazioni(testo, 'font-weight').filter((d) =>
        /^(100|200|300|700|800|900|bold|bolder)$/.test(d.valore),
      ).length,
  },
  {
    id: 'ombre',
    nome: 'Ombre scritte a mano',
    conta: (testo) =>
      dichiarazioni(testo, 'box-shadow').filter((d) => /\d/.test(senzaVar(d.valore))).length,
  },
  {
    id: 'durate',
    nome: 'Durate di transizioni e animazioni scritte a mano',
    conta: (testo) =>
      dichiarazioni(testo, 'transition|transition-duration|animation|animation-duration').filter(
        (d) => /\d*\.?\d+m?s\b/.test(senzaVar(d.valore)),
      ).length,
  },
  {
    id: 'spaziature',
    nome: 'Spaziature scritte a mano (padding, margin, gap)',
    conta: (testo) =>
      dichiarazioni(testo, '(?:padding|margin)(?:-[a-z]+)?|gap|row-gap|column-gap').filter((d) =>
        /(^|[\s(,-])(?!0(px|rem|em)\b)\d*\.?\d+(px|rem|em)\b/.test(senzaVar(d.valore)),
      ).length,
  },
  {
    id: 'modali',
    nome: 'Modali con stile proprio invece di BaseModal',
    conta: (testo, file) =>
      file.endsWith('.vue') &&
      !file.includes('components/base/') &&
      /class="[^"]*\bmodal-(overlay|content)\b/.test(testo)
        ? 1
        : 0,
  },
  {
    id: 'minorenne',
    nome: 'Soglia dei 18 anni fuori da utils/payment.js',
    conta: (testo, file) =>
      file === 'src/utils/payment.js' ? 0 : (testo.match(/(<|>=|<=|>)\s*18\b/g) || []).length,
  },
]

const fileSorgente = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : fileSorgente(full)
    return /\.(vue|js|css)$/.test(entry.name) ? [full] : []
  })

/**
 * @param {string} radice - cartella del progetto
 * @returns {Array<{ id: string, nome: string, totale: number, perFile: Array<[string, number]> }>}
 */
export function misura(radice) {
  const files = fileSorgente(path.join(radice, 'src'))
    .map((full) => path.relative(radice, full).split(path.sep).join('/'))
    .filter((file) => !ECCEZIONI[file])
    .map((file) => ({
      file,
      testo: stripComments(fs.readFileSync(path.join(radice, file), 'utf8')),
    }))

  return CONTROLLI.map(({ id, nome, conta }) => {
    const perFile = files
      .map(({ file, testo }) => [file, conta(testo, file)])
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
    return { id, nome, totale: perFile.reduce((s, [, n]) => s + n, 0), perFile }
  })
}

function tabella(risultati) {
  const righe = ['| Controllo | Totale | File principali |', '| --- | --- | --- |']
  for (const r of risultati) {
    const principali = r.perFile
      .slice(0, 4)
      .map(([f, n]) => `${f.replace(/^src\//, '')} ${n}`)
      .join(', ')
    righe.push(`| ${r.nome} | ${r.totale} | ${principali} |`)
  }
  return righe.join('\n')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const risultati = misura(radice)
  const testo = tabella(risultati)
  console.log(testo)

  if (process.argv.includes('--ci')) {
    for (const r of risultati.filter((r) => r.totale > 0)) {
      console.log(`::warning title=Controlli UI::${r.nome}: ${r.totale}`)
    }
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `## Controlli della UI Constitution (avvisi)\n\n${testo}\n`,
      )
    }
  }
}
