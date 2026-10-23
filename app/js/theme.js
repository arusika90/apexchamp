// Оформление чемпионата: готовые темы и свои цвета. Применяется через CSS-переменные.
export const THEMES = [
  { id: 'orange', name: 'Апельсин', brand: '#ED5C1E', cta: '#FFDB19', bg: '#F8F8F8' },
  { id: 'raspberry', name: 'Малина', brand: '#D6336C', cta: '#FFD166', bg: '#FBF5F7' },
  { id: 'lavender', name: 'Лаванда', brand: '#6D4AFF', cta: '#FFE066', bg: '#F6F5FB' },
  { id: 'mint', name: 'Мята', brand: '#0F9D8A', cta: '#FFE066', bg: '#F3F8F6' },
  { id: 'gold', name: 'Золото', brand: '#B8860B', cta: '#FFE39A', bg: '#FAF7F0' },
  { id: 'graphite', name: 'Графит', brand: '#1F1F1F', cta: '#FFDB19', bg: '#F4F4F4' },
];

export const BACKGROUNDS = [
  { id: 'light', name: 'Светлый', bg: '#F8F8F8' },
  { id: 'warm', name: 'Тёплый', bg: '#FBF6F1' },
  { id: 'cool', name: 'Холодный', bg: '#F3F5F8' },
  { id: 'theme', name: 'Как в теме', bg: null },
];

const hex2rgb = (h) => { const x = h.replace('#', ''); const n = parseInt(x.length === 3 ? x.split('').map((c) => c + c).join('') : x, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgb2hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const [r1, g1, b1] = hex2rgb(a); const [r2, g2, b2] = hex2rgb(b); return rgb2hex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t); };
const luma = (h) => { const [r, g, b] = hex2rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

export function themeVars(theme) {
  const t = theme || {};
  const preset = THEMES.find((x) => x.id === t.preset) || THEMES[0];
  const brand = t.brand || preset.brand;
  const cta = t.cta || preset.cta;
  const bgChoice = BACKGROUNDS.find((x) => x.id === t.bg);
  const bg = (bgChoice && bgChoice.bg) || preset.bg;
  return {
    '--brand': brand,
    '--brand-2': mix(brand, '#ffffff', 0.12),
    '--brand-ink': mix(brand, '#000000', 0.28),
    '--peach': mix(brand, '#ffffff', 0.9),
    '--peach-2': mix(brand, '#ffffff', 0.72),
    '--cloudberry': mix(cta, brand, 0.25),
    '--cta': cta,
    '--cta-hover': mix(cta, '#000000', 0.08),
    '--cta-ink': luma(cta) > 0.6 ? '#1F1F1F' : '#ffffff',
    '--place-1': cta,
    '--place-3': mix(cta, brand, 0.25),
    '--bg': bg,
  };
}

export function applyTheme(theme) {
  const root = document.documentElement.style;
  const vars = themeVars(theme);
  for (const k of Object.keys(vars)) root.setProperty(k, vars[k]);
}

export function resetTheme() {
  const root = document.documentElement.style;
  for (const k of Object.keys(themeVars({}))) root.removeProperty(k);
}
