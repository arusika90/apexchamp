// Состояние приложения. Пока бэкенда нет, всё живёт в localStorage этого браузера.
import { seed, VERSION } from './data.js';

const KEY = 'predragovic.state';
let state = null;

// Временное состояние интерфейса (не сохраняется).
export const ui = {
  judgeFilter: 'todo',
  photo: 0,
  photoFor: null,
  resultsBlock: null,
  orgNomTab: 'works',
  expanded: {},
  prizeDraft: { code: '', judgeId: '' },
  roleModal: false,
  editProfile: false,
  newWork: false,
  modalRole: null,
};

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.version === VERSION) { state = s; return state; }
    }
  } catch (e) { /* хранилище недоступно — работаем в памяти */ }
  state = seed();
  save();
  return state;
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* приватный режим */ }
}

export function resetData() {
  const session = state ? state.session : null;
  state = seed();
  state.session = session;
  save();
}

export const st = () => state;

export const nomById = (id) => state.nominations.find((n) => n.id === id);
export const workByCode = (code) => state.works.find((w) => w.code === code);
export const judgeById = (id) => state.judges.find((j) => j.id === id);
export const partById = (id) => state.participants.find((p) => p.id === id);
export const nomOf = (w) => nomById(w.nom);
export const worksOfNom = (id) => state.works.filter((w) => w.nom === id);
export const blockName = (id) => state.blocks.find((b) => b.id === id)?.name || id;
export const sheetOf = (code, jid) => state.sheets[code]?.[jid] || null;

export function ensureSheet(code, jid) {
  state.sheets[code] = state.sheets[code] || {};
  if (!state.sheets[code][jid]) state.sheets[code][jid] = { v: {}, pen: 0, comment: '', status: 'draft', at: Date.now() };
  return state.sheets[code][jid];
}

const initialsOf = (name) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';

export function addParticipant(d) {
  const id = 'p' + Date.now().toString(36);
  const name = String(d.name || '').trim();
  state.participants.push({
    id, name,
    insta: String(d.insta || '').trim(),
    country: String(d.country || '').trim(),
    email: String(d.email || '').trim(),
    cat: d.cat || 'junior',
    free: false, gpWorks: [], initials: initialsOf(name), registered: Date.now(),
  });
  save();
  return id;
}

export function updateParticipant(id, d) {
  const p = partById(id);
  if (!p) return;
  if (d.name != null) { p.name = String(d.name).trim(); p.initials = initialsOf(p.name); }
  for (const k of ['insta', 'country', 'email', 'cat']) if (d[k] != null) p[k] = String(d[k]).trim();
  save();
}

// Следующий номер работы по шаблону номинации: «ВК-3xx» → ВК-304, «1xx» → 110, «LM-1xx» → LM-114.
export function nextCode(nom) {
  const m = nom.prefix.match(/x+$/i);
  const base = m ? nom.prefix.slice(0, m.index) : nom.prefix + '-';
  const digits = m ? m[0].length : 2;
  let max = 0;
  for (const w of state.works) {
    if (w.nom !== nom.id || !w.code.startsWith(base)) continue;
    const n = parseInt(w.code.slice(base.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return base + String(max + 1).padStart(digits, '0');
}

export function addWork({ nomId, pid, cat }) {
  const nom = nomById(nomId);
  if (!nom) return null;
  const code = nextCode(nom);
  state.works.push({ code, nom: nomId, pid, cat, override: null, status: 'draft', photos: {}, created: Date.now() });
  save();
  return code;
}

export function removeWork(code) {
  state.works = state.works.filter((w) => w.code !== code);
  delete state.sheets[code];
  for (const p of state.participants) p.gpWorks = (p.gpWorks || []).filter((c) => c !== code);
  save();
}

export const workStatus = (w) => w.status || 'submitted';

export const ORG_USER = { id: 'org', name: 'Организатор', initials: 'ОР' };
export const GUEST_USER = { id: 'guest', name: 'Гость', initials: 'Г' };
export const DESIGNER_USER = { id: 'designer', name: 'Дизайнер', initials: 'ДЗ' };
export const OWNER_USER = { id: 'owner', name: 'Владелец ApexChamp', initials: 'AC' };

export function sessionUser() {
  const s = state.session;
  if (!s) return null;
  if (s.role === 'org') return ORG_USER;
  if (s.role === 'judge') return judgeById(s.id) || null;
  if (s.role === 'part') return partById(s.id) || null;
  if (s.role === 'guest') return GUEST_USER;
  if (s.role === 'designer') return DESIGNER_USER;
  if (s.role === 'owner') return OWNER_USER;
  return null;
}

export function roleHome(role) {
  return { org: 'org', judge: 'judge', part: 'me', guest: 'results', designer: 'design', owner: 'owner' }[role] || 'roles';
}
