<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="viewBox"
    :width="computedSize"
    :height="computedSize"
    :stroke="computedColor"
    :stroke-width="computedStrokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
    :style="{ color: computedColor }"
    :class="[
      'base-icon',
      `base-icon--${canonicalName}`,
      { 'base-icon--spin': spin }
    ]"
    :role="title ? 'img' : 'presentation'"
    :aria-hidden="title ? undefined : 'true'"
    :aria-label="title || undefined"
    v-bind="$attrs"
  >
    <title v-if="title">{{ title }}</title>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <g v-html="svgContent"></g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: [Number, String],
    default: 20,
  },
  color: {
    type: String,
    default: 'currentColor',
  },
  strokeWidth: {
    type: [Number, String],
    default: 1.8,
  },
  title: {
    type: String,
    default: '',
  },
  spin: {
    type: Boolean,
    default: false,
  },
  viewBox: {
    type: String,
    default: '0 0 24 24',
  },
})

// Palette istituzionale della Famiglia dei Santantoniari
const PALETTE_MAP = {
  primary: 'var(--color-primary, #1a1a1a)',
  'primary-light': 'var(--color-primary-light, #333333)',
  accent: 'var(--color-accent, #b71c1c)',
  ceraiolo: 'var(--color-accent, #b71c1c)',
  red: 'var(--color-accent, #b71c1c)',
  'accent-hover': 'var(--color-accent-hover, #c62828)',
  gold: 'var(--color-gold, #c59b27)',
  oro: 'var(--color-gold, #c59b27)',
  white: '#ffffff',
  bianco: '#ffffff',
  success: 'var(--color-success, #2e7d32)',
  green: 'var(--color-success, #2e7d32)',
  warning: 'var(--color-warning, #c2410c)',
  arancione: 'var(--color-warning, #c2410c)',
  info: 'var(--color-info, #0369a1)',
  blue: 'var(--color-info, #0369a1)',
  secondary: 'var(--color-text-secondary, #5c6266)',
  muted: 'var(--color-text-secondary, #5c6266)',
  current: 'currentColor',
  currentcolor: 'currentColor',
}

// Mappatura sinonimi ed alias per massima tolleranza e robustezza
const ALIASES = {
  // Navigation & Shell
  ricerca: 'home',
  registrazione: 'refresh-cw',
  seriale: 'refresh-cw',
  refresh: 'refresh-cw',
  sync: 'refresh-cw',
  reset: 'refresh-cw',
  blocchetti: 'receipt',
  ricevuta: 'receipt',
  report: 'bar-chart',
  chart: 'bar-chart',
  'bar-chart-2': 'bar-chart',
  grafico: 'bar-chart',
  impostazioni: 'settings',
  cog: 'settings',
  gear: 'settings',

  // Actions
  cerca: 'search',
  add: 'plus',
  nuovo: 'plus',
  ok: 'check',
  spunta: 'check',
  success: 'check-circle',
  verified: 'check-circle',
  warning: 'alert-triangle',
  arretrati: 'alert-triangle',
  alert: 'alert-triangle',
  error: 'alert-circle',
  blocco: 'alert-circle',
  danger: 'alert-octagon',
  pericolo: 'alert-octagon',
  delete: 'trash-2',
  trash: 'trash-2',
  rimuovi: 'trash-2',
  elimina: 'trash-2',
  export: 'download',
  scarica: 'download',
  import: 'upload',
  carica: 'upload',
  modifica: 'edit',
  pen: 'edit',
  pencil: 'edit',
  'file-edit': 'edit',
  close: 'x',
  annulla: 'x',
  cancel: 'x',
  chiudi: 'x',
  salva: 'save',
  floppy: 'save',
  print: 'printer',
  stampa: 'printer',
  db: 'database',
  sqlite: 'database',
  backup: 'database',

  // Chevrons & Arrows
  left: 'chevron-left',
  'arrow-left': 'chevron-left',
  back: 'chevron-left',
  indietro: 'chevron-left',
  right: 'chevron-right',
  'arrow-right': 'chevron-right',
  forward: 'chevron-right',
  avanti: 'chevron-right',
  up: 'chevron-up',
  'arrow-up': 'chevron-up',
  down: 'chevron-down',
  'arrow-down': 'chevron-down',

  // Users & Groups
  socio: 'user',
  anagrafica: 'user',
  gruppo: 'users',
  manicchia: 'users',
  manicchie: 'users',
  people: 'users',
  'nuovo-socio': 'user-plus',
  'add-user': 'user-plus',

  // Money & Docs
  card: 'credit-card',
  tessera: 'ticket',
  paga: 'credit-card',
  pagamento: 'credit-card',
  cash: 'coins',
  quota: 'coins',
  cassa: 'coins',
  money: 'coins',
  euro: 'coins',
  doc: 'file-text',
  pdf: 'file-text',
  document: 'file-text',
  excel: 'file-spreadsheet',
  table: 'file-spreadsheet',
  tabella: 'file-spreadsheet',
  appunti: 'clipboard',
  elenco: 'clipboard',

  // Utilities & Theme
  light: 'sun',
  sole: 'sun',
  dark: 'moon',
  luna: 'moon',
  fuoco: 'flame',
  cero: 'flame',
  candela: 'flame',
  bolt: 'zap',
  fulmine: 'zap',
  turbo: 'zap',
  lightning: 'zap',
  data: 'calendar',
  anno: 'calendar',
  history: 'clock',
  tempo: 'clock',
  ora: 'clock',
  spinner: 'loader',
  loading: 'loader',
  caricamento: 'loader',
  filter: 'sliders',
  filtri: 'sliders',
  tool: 'sliders',
  builder: 'sliders',
  zona: 'map-pin',
  luogo: 'map-pin',
  map: 'map-pin',
  cartella: 'folder',
  audit: 'shield-check',
  sicurezza: 'shield-check',
  shield: 'shield-check',
  view: 'eye',
  anteprima: 'eye',
  crescita: 'trending-up',
  churn: 'trending-down',
  recupero: 'trending-down',
  bilancia: 'scale',
  'audit-quote': 'scale',
  audio: 'volume-2',
  suono: 'volume-2',
  mute: 'volume-x',
  silenzioso: 'volume-x',
  box: 'package',
  archivio: 'package',
  collegamento: 'link',
  fabbrica: 'factory',
  numero: 'hash',
  tastiera: 'keyboard',
  shortcuts: 'keyboard',
  preset: 'bookmark',
  informazioni: 'info',
  circle: 'circle-slash',
  disattivato: 'circle-slash',
  target: 'inbox',
  vuoto: 'inbox',
}

// Catalogo geometrico vettoriale stile Apple SF Symbols (viewBox 0 0 24 24)
const ICONS = {
  // Navigation & Shell
  'home': '<path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  'refresh-cw': '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  'rotate-ccw': '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
  'receipt': '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/>',
  'bar-chart': '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/><line x1="3" y1="20" x2="21" y2="20"/>',
  'settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',

  // Actions & Controls
  'search': '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  'plus': '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  'check': '<polyline points="20 6 9 17 4 12"/>',
  'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  'check-square': '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  'alert-triangle': '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>',
  'alert-circle': '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/>',
  'alert-octagon': '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/>',
  'trash-2': '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  'edit': '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  'x': '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  'x-circle': '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  'save': '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
  'printer': '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  'database': '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',

  // Chevrons & Directionals
  'chevron-left': '<polyline points="15 18 9 12 15 6"/>',
  'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
  'chevron-up': '<polyline points="18 15 12 9 6 15"/>',
  'chevron-down': '<polyline points="6 9 12 15 18 9"/>',

  // Users & Entities
  'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  'users': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
  'user-check': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
  'user-x': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="22" y2="12"/><line x1="22" y1="8" x2="18" y2="12"/>',

  // Finance & Documents
  'credit-card': '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  'coins': '<circle cx="9" cy="9" r="7"/><path d="M21 14.5a6.5 6.5 0 0 1-8.5 6.2"/><path d="M17 9a6.5 6.5 0 0 1 0 5.5"/><line x1="9" y1="6" x2="9" y2="12"/><line x1="7" y1="8" x2="11" y2="8"/><line x1="7" y1="10" x2="11" y2="10"/>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
  'file-spreadsheet': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="12" y1="13" x2="12" y2="17"/>',
  'ticket': '<path d="M2 9a3 3 0 0 1 0 6v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a3 3 0 0 1 0-6V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="12" y1="3" x2="12" y2="21" stroke-dasharray="2 2"/>',
  'clipboard': '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',

  // Utilities, Status & Theme
  'sun': '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  'moon': '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  'flame': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  'zap': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  'calendar': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'loader': '<line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>',
  'sliders': '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  'map-pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  'folder': '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  'shield-check': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
  'eye': '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  'trending-up': '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  'trending-down': '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
  'scale': '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/>',
  'volume-2': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>',
  'volume-x': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
  'sparkles': '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>',
  'package': '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  'factory': '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4H2v16z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>',
  'hash': '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',
  'keyboard': '<rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><line x1="6" y1="8" x2="6.01" y2="8"/><line x1="10" y1="8" x2="10.01" y2="8"/><line x1="14" y1="8" x2="14.01" y2="8"/><line x1="18" y1="8" x2="18.01" y2="8"/><line x1="6" y1="12" x2="6.01" y2="12"/><line x1="18" y1="12" x2="18.01" y2="12"/><line x1="10" y1="16" x2="14" y2="16"/>',
  'bookmark': '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  'info': '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><circle cx="12" cy="8" r="0.5" fill="currentColor"/>',
  'circle-slash': '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>',
  'inbox': '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  'fallback': '<circle cx="12" cy="12" r="10" stroke-dasharray="2 2"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>',
}

// Risoluzione nome canonico
const canonicalName = computed(() => {
  if (!props.name) return 'fallback'
  const clean = props.name.toLowerCase().trim()
  if (ICONS[clean]) return clean
  if (ALIASES[clean] && ICONS[ALIASES[clean]]) return ALIASES[clean]
  return clean
})

// Tracciati SVG risolti
const svgContent = computed(() => {
  const icon = ICONS[canonicalName.value]
  if (icon) return icon
  if ((typeof globalThis !== 'undefined' && globalThis.process?.env?.NODE_ENV !== 'production') || import.meta.env?.DEV) {
    console.warn(`[BaseIcon] Icon "${props.name}" (risolta come: "${canonicalName.value}") non trovata nel registro.`)
  }
  return ICONS['fallback']
})

// Risoluzione cromatica con supporto palette Santantoniari
const computedColor = computed(() => {
  if (!props.color) return 'currentColor'
  const key = props.color.toLowerCase().trim()
  return PALETTE_MAP[key] || props.color
})

// Normalizzazione dimensione (numeri o unità CSS)
const computedSize = computed(() => {
  if (typeof props.size === 'number') return `${props.size}px`
  if (!props.size) return '20px'
  return /^[0-9]+$/.test(props.size) ? `${props.size}px` : props.size
})

// Normalizzazione spessore tratto
const computedStrokeWidth = computed(() => {
  return props.strokeWidth || 1.8
})
</script>

<style scoped>
.base-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: -0.125em;
  flex-shrink: 0;
  transition: stroke 0.2s ease, fill 0.2s ease, transform 0.2s ease;
}

.base-icon--spin {
  animation: base-icon-spin 1s linear infinite;
}

@keyframes base-icon-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
