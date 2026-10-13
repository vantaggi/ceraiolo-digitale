function lum(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const a = [r, g, b].map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function cr(hex1, hex2) {
  const l1 = lum(hex1);
  const l2 = lum(hex2);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

const tests = [
  // LIGHT THEME (bg: #ffffff surface or #f4f5f7 app bg)
  { label: 'Light - text-primary on surface', fg: '#1a1a1a', bg: '#ffffff' },
  { label: 'Light - text-primary on background', fg: '#1a1a1a', bg: '#f4f5f7' },
  { label: 'Light - text-secondary on surface', fg: '#5c6266', bg: '#ffffff' },
  { label: 'Light - text-secondary on background', fg: '#5c6266', bg: '#f4f5f7' },
  { label: 'Light - accent (#b71c1c) on surface', fg: '#b71c1c', bg: '#ffffff' },
  { label: 'Light - accent (#b71c1c) on background', fg: '#b71c1c', bg: '#f4f5f7' },
  { label: 'Light - gold (#c59b27) on surface', fg: '#c59b27', bg: '#ffffff' },
  { label: 'Light - gold (#c59b27) on background', fg: '#c59b27', bg: '#f4f5f7' },
  { label: 'Light - gold (#c59b27) on accent (#b71c1c)', fg: '#c59b27', bg: '#b71c1c' },
  { label: 'Light - white on accent (#b71c1c)', fg: '#ffffff', bg: '#b71c1c' },
  { label: 'Light - warning (#c2410c) on surface', fg: '#c2410c', bg: '#ffffff' },
  { label: 'Light - warning (#c2410c) on background', fg: '#c2410c', bg: '#f4f5f7' },
  { label: 'Light - info (#0369a1) on surface', fg: '#0369a1', bg: '#ffffff' },
  { label: 'Light - info (#0369a1) on background', fg: '#0369a1', bg: '#f4f5f7' },
  { label: 'Light - success (#2e7d32) on surface', fg: '#2e7d32', bg: '#ffffff' },
  { label: 'Light - success (#2e7d32) on background', fg: '#2e7d32', bg: '#f4f5f7' },

  // DARK THEME (bg: #1e1e1e surface or #121212 app bg)
  { label: 'Dark - text-primary on surface', fg: '#e0e0e0', bg: '#1e1e1e' },
  { label: 'Dark - text-primary on background', fg: '#e0e0e0', bg: '#121212' },
  { label: 'Dark - text-secondary on surface', fg: '#a0a0a0', bg: '#1e1e1e' },
  { label: 'Dark - text-secondary on background', fg: '#a0a0a0', bg: '#121212' },
  { label: 'Dark - accent (#ef5350) on surface', fg: '#ef5350', bg: '#1e1e1e' },
  { label: 'Dark - accent (#ef5350) on background', fg: '#ef5350', bg: '#121212' },
  { label: 'Dark - gold (#e5b338) on surface', fg: '#e5b338', bg: '#1e1e1e' },
  { label: 'Dark - gold (#e5b338) on background', fg: '#e5b338', bg: '#121212' },
  { label: 'Dark - warning (#ffa726) on surface', fg: '#ffa726', bg: '#1e1e1e' },
  { label: 'Dark - warning (#ffa726) on background', fg: '#ffa726', bg: '#121212' },
  { label: 'Dark - info (#38bdf8) on surface', fg: '#38bdf8', bg: '#1e1e1e' },
  { label: 'Dark - info (#38bdf8) on background', fg: '#38bdf8', bg: '#121212' },
  { label: 'Dark - success (#66bb6a) on surface', fg: '#66bb6a', bg: '#1e1e1e' },
  { label: 'Dark - success (#66bb6a) on background', fg: '#66bb6a', bg: '#121212' },
  { label: 'Dark - white on accent (#ef5350)', fg: '#ffffff', bg: '#ef5350' },
  { label: 'Dark - black (#121212) on accent (#ef5350)', fg: '#121212', bg: '#ef5350' },

  // BADGES & BUTTONS IN VIEWS (e.g., active nav link: white on accent)
  { label: 'Active nav button: white on Light accent (#b71c1c)', fg: '#ffffff', bg: '#b71c1c' },
  { label: 'Active nav button: white on Dark accent (#ef5350)', fg: '#ffffff', bg: '#ef5350' },
  { label: 'Badge status ok: #2e7d32 on rgba(46,125,50,0.12) over #ffffff', fg: '#2e7d32', bg: '#e5efe6' },
  { label: 'Badge status warn: #c2410c on rgba(194,65,12,0.12) over #ffffff', fg: '#c2410c', bg: '#f7e8e1' },
];

console.log('| Element / Contrast Pair | FG | BG | Ratio | WCAG 2.2 AA (>= 4.5:1) |');
console.log('|---|---|---|---|---|');
tests.forEach(t => {
  const ratio = cr(t.fg, t.bg);
  const pass = ratio >= 4.5 ? 'PASS (>=4.5:1)' : (ratio >= 3.0 ? 'FAIL Normal (PASS Large >=3.0:1)' : 'FAIL (<3.0:1)');
  console.log(`| ${t.label} | \`${t.fg}\` | \`${t.bg}\` | **${ratio.toFixed(2)}:1** | ${pass} |`);
});
