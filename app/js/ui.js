// Мелкие помощники интерфейса: экранирование, форматирование, иконки, тост.

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Доля 0..1 → «71,38 %». Округление до сотых.
export function pct(p, d = 2) {
  if (p == null || Number.isNaN(p)) return '—';
  return (Math.round(p * 100 * 10 ** d) / 10 ** d).toFixed(d).replace('.', ',') + ' %';
}

export function num(x) {
  if (x == null || x === '' || Number.isNaN(Number(x))) return '—';
  const r = Math.round(Number(x) * 100) / 100;
  return String(r).replace('.', ',').replace('-', '−');
}

export function parseNum(s) {
  const v = Number(String(s ?? '').trim().replace(',', '.').replace('−', '-'));
  return Number.isFinite(v) ? v : null;
}

export function plural(n, f1, f2, f5) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return f5;
  if (b > 1 && b < 5) return f2;
  if (b === 1) return f1;
  return f5;
}

export function href(...parts) {
  return '#/' + parts.map((p) => encodeURIComponent(p)).join('/');
}

export function dateTime(ts) {
  return new Date(ts).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function rerender() {
  window.dispatchEvent(new CustomEvent('app:render'));
}

let toastTimer = null;
export function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2800);
}

export const CATEGORIES = [
  { id: 'junior', name: 'Юниор' },
  { id: 'master', name: 'Мастер' },
  { id: 'expert', name: 'Эксперт' },
];
export const catName = (id) => (CATEGORIES.find((c) => c.id === id)?.name || id).toLowerCase();

// Панель поиска и фильтров над таблицей. Строки таблицы несут data-search и data-tags.
export function tableToolbar(id, placeholder, chips = []) {
  return `<div class="toolbar" data-toolbar="${id}">
    <label class="search"><span class="hide">Поиск</span>${I.search}<input class="input s" type="search" placeholder="${esc(placeholder)}" data-input="table-search" data-table="${id}"></label>
    ${chips.length ? `<div class="tabs" style="gap:6px">${chips.map(([tag, label], i) => `<button type="button" class="tab s ${i === 0 ? 'active' : ''}" data-action="table-chip" data-table="${id}" data-tag="${esc(tag)}">${esc(label)}</button>`).join('')}</div>` : ''}
  </div>`;
}

// Статус приглашения: подтверждён, ожидает, отправить снова.
export function inviteChip(role, u) {
  if (!u.invite) return '<span class="chip ok" title="Аккаунт из демо-данных">подтверждено</span>';
  if (u.invite.confirmed) return `<span class="chip ok" title="Вошёл по ссылке">${I.check.replace('<svg', '<svg width="12" height="12"')}подтверждено</span>`;
  return `<span class="row" style="gap:6px;flex-wrap:nowrap"><span class="chip warn" title="Письмо отправлено ${dateTime(u.invite.sentAt)}${u.invite.resent ? `, повторно ${u.invite.resent}` : ''}">ожидает</span><button class="btn xs" data-action="invite-resend" data-role="${role}" data-id="${u.id}">Отправить снова</button></span>`;
}

export function bar(frac, cls = '') {
  const w = Math.max(0, Math.min(1, frac || 0));
  return `<div class="bar ${cls}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(w * 100)}"><i style="width:${(w * 100).toFixed(1)}%"></i></div>`;
}

export function placeChip(place, manual = false) {
  if (place == null) return '<span class="place p0">—</span>';
  if (place >= 1 && place <= 3) return `<span class="place p${place}">${place} место${manual ? ' · решение оргкомитета' : ''}</span>`;
  return `<span class="place p0">без места${manual ? ' · решение оргкомитета' : ''}</span>`;
}

const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const I = {
  lash: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M3 14c4-4.5 14-4.5 18 0"/><path d="M6.5 11 5 8"/><path d="M10.5 9.6 10 6.2"/><path d="m14.5 9.7.6-3.4"/><path d="m18 11.2 1.6-2.8"/></svg>',
  bell: svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>'),
  left: svg('<path d="m15 18-6-6 6-6"/>'),
  right: svg('<path d="m9 18 6-6-6-6"/>'),
  photo: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="m21 15-5-5L5 21"/>'),
  download: svg('<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>'),
  logout: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>'),
  swap: svg('<path d="m17 3 4 4-4 4"/><path d="M3 7h18"/><path d="m7 21-4-4 4-4"/><path d="M21 17H3"/>'),
  palette: svg('<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A5.6 5.6 0 0 0 22 9.8C22 5.5 17.5 2 12 2Z"/>'),
  plus: svg('<path d="M12 5v14"/><path d="M5 12h14"/>'),
  trash: svg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  lock: svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  trophy: svg('<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M17 5h3v2a3 3 0 0 1-3 3"/><path d="M7 5H4v2a3 3 0 0 0 3 3"/>'),
  users: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>'),
  gavel: svg('<path d="m14 13-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>'),
  globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18"/>'),
  alert: svg('<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>'),
  sliders: svg('<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/>'),
  star: svg('<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3l-5.5 2.9 1-6.2L3 9.6l6.2-.9Z"/>'),
  edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
};
