// Точка входа: пароль на вход, роутер на hash, делегирование событий, общие действия.
import { gate } from './gate.js';
import { applyTheme, resetTheme } from './theme.js';
import { load, st, ui, save, roleHome, resetData, addParticipant, updateParticipant, sessionUser, confirmInvite } from './store.js';
import { toast, rerender } from './ui.js';
import { ROLE_NAME } from './views/common.js';
import * as roles from './views/roles.js';
import * as design from './views/design.js';
import * as results from './views/results.js';
import * as org from './views/org.js';
import * as judge from './views/judge.js';
import * as participant from './views/participant.js';
import * as owner from './views/owner.js';

const ROUTES = [
  { p: 'roles', v: roles.render, t: 'Выбор роли' },
  { p: 'register', v: roles.register, t: 'Регистрация' },
  { p: 'design', v: design.render, t: 'Дизайн-система' },
  { p: 'results', v: results.render, t: 'Результаты' },
  { p: 'org', v: org.dashboard, role: 'org', t: 'Обзор' },
  { p: 'org/settings', v: org.settings, role: 'org', t: 'Чемпионат' },
  { p: 'org/nominations', v: org.nominations, role: 'org', t: 'Номинации' },
  { p: 'org/nomination/:id', v: org.nomination, role: 'org', t: 'Номинация' },
  { p: 'org/judges', v: org.judges, role: 'org', t: 'Судьи' },
  { p: 'org/participants', v: org.participants, role: 'org', t: 'Участники' },
  { p: 'org/work/:code', v: org.work, role: 'org', t: 'Работа' },
  { p: 'org/places', v: org.places, role: 'org', t: 'Места и Гран-при' },
  { p: 'judge', v: judge.list, role: 'judge', t: 'Мои работы' },
  { p: 'judge/work/:code', v: judge.sheet, role: 'judge', t: 'Ведомость' },
  { p: 'me', v: participant.home, role: 'part', t: 'Мои работы' },
  { p: 'owner', v: owner.console_, role: 'owner', t: 'Платформа' },
  { p: 'owner/tenant/:id', v: owner.tenant, role: 'owner', t: 'Чемпионат' },
];

function match(path) {
  let segs;
  try { segs = path.split('/').filter(Boolean).map(decodeURIComponent); } catch (e) { return null; }
  for (const r of ROUTES) {
    const ps = r.p.split('/');
    if (ps.length !== segs.length) continue;
    const params = [];
    let ok = true;
    ps.forEach((x, i) => { if (x.startsWith(':')) params.push(segs[i]); else if (x !== segs[i]) ok = false; });
    if (ok) return { r, params };
  }
  return null;
}

const home = () => '#/' + (st().session ? roleHome(st().session.role) : 'roles');
let lastPath = null;

function render() {
  const path = location.hash.replace(/^#\/?/, '');
  const m = path ? match(path) : null;
  if (!m) { location.replace(home()); return; }
  const s = st();
  if (m.r.role && s.session?.role !== m.r.role) { location.replace(home()); return; }
  if (m.r.role && !s.session) { location.replace('#/roles'); return; }
  if (path !== lastPath && ui.roleModal) ui.roleModal = false;
  if (path !== lastPath) ui.navOpen = false;
  const wasOpen = !!document.getElementById('role-modal');
  const platformPage = ['roles', 'design', 'owner', 'register'].includes(m.r.p);
  if (platformPage) resetTheme(); else applyTheme(s.championship.theme);
  document.getElementById('app').innerHTML = m.r.v(...m.params);
  document.title = `${m.r.t} · ApexChamp`;
  applyTableFilters();
  document.body.classList.toggle('modal-open', !!ui.roleModal || !!ui.navOpen);
  if (ui.roleModal && !wasOpen) document.getElementById('role-modal')?.focus();
  if (path !== lastPath) { window.scrollTo(0, 0); lastPath = path; }
}

// Применяет сохранённые поиск и чип к таблицам на странице.
function applyTableFilters() {
  document.querySelectorAll('[data-toolbar]').forEach((tb) => {
    const id = tb.dataset.toolbar;
    const f = ui.tf[id] || { q: '', tag: '' };
    const inp = tb.querySelector('[data-input="table-search"]');
    if (inp && inp.value !== f.q) inp.value = f.q;
    tb.querySelectorAll('[data-action="table-chip"]').forEach((b) => b.classList.toggle('active', (b.dataset.tag || '') === (f.tag || '')));
    const q = f.q.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll(`[data-rows="${id}"] tr[data-search]`).forEach((tr) => {
      const ok = (!q || tr.dataset.search.includes(q)) && (!f.tag || (' ' + (tr.dataset.tags || '') + ' ').includes(' ' + f.tag + ' '));
      tr.classList.toggle('hide', !ok);
      if (ok) shown++;
    });
    const empty = document.querySelector(`[data-empty="${id}"]`);
    if (empty) empty.classList.toggle('hide', shown > 0);
  });
}

function closeModal() {
  if (!ui.roleModal) return;
  ui.roleModal = false;
  render();
  document.querySelector('[data-action="open-role-modal"]')?.focus();
}

function go(hash) {
  if (location.hash === hash) render(); else location.hash = hash;
}

const common = {
  'open-role-modal': () => { ui.roleModal = true; ui.modalRole = null; render(); },
  'nav-open': () => { ui.navOpen = true; render(); document.getElementById('nav-drawer')?.focus(); },
  'nav-close': () => { ui.navOpen = false; render(); },
  'nav-go': (el) => { ui.navOpen = false; go(el.getAttribute('href')); },
  'nav-roles': () => { ui.navOpen = false; ui.roleModal = true; ui.modalRole = null; render(); },
  'modal-role': (el) => { ui.modalRole = el.dataset.role || null; render(); },
  'close-modal': () => closeModal(),
  'login-persona': (el) => {
    const role = el.dataset.role;
    if (el.dataset.stage) st().championship.stage = el.dataset.stage;
    if (el.dataset.preset) st().ownerPreset = el.dataset.preset;
    st().session = { role, id: el.dataset.user || null };
    ui.roleModal = false;
    ui.expanded = {};
    confirmInvite(role, el.dataset.user);
    ui.newWork = false;
    save();
    toast(`Вы вошли как ${ROLE_NAME[role].toLowerCase()}`);
    go('#/' + roleHome(role));
  },
  'close-modal-link': (el) => { ui.roleModal = false; go(el.getAttribute('href')); },
  login: (el) => {
    const role = el.dataset.role;
    let id = null;
    if (role === 'judge') id = document.getElementById('pick-judge')?.value;
    if (role === 'part') id = document.getElementById('pick-part')?.value;
    st().session = { role, id };
    ui.roleModal = false;
    confirmInvite(role, id);
    save();
    toast(`Вы вошли как ${ROLE_NAME[role].toLowerCase()}`);
    go('#/' + roleHome(role));
  },
  logout: () => {
    st().session = null;
    ui.roleModal = false;
    save();
    toast('Вы вышли из аккаунта');
    go('#/roles');
  },
  impersonate: (el) => {
    st().session = { role: el.dataset.role, id: el.dataset.id || null, by: st().session?.role === 'owner' ? 'owner' : 'org' };
    save();
    toast('Вы смотрите кабинет глазами пользователя');
    go('#/' + roleHome(el.dataset.role));
  },
  'back-to-org': () => {
    st().session = { role: st().session?.by === 'owner' ? 'owner' : 'org' };
    ui.roleModal = false;
    save();
    go('#/org');
  },
  'set-stage': (el) => {
    st().championship.stage = el.dataset.stage;
    save();
    toast(el.dataset.stage === 'published' ? 'Итоги опубликованы: участники видят проценты, места и комментарии' : 'Итоги скрыты, идёт судейство');
    rerender();
  },
  'reset-data': () => {
    resetData();
    toast('Демо-данные сброшены');
    rerender();
  },
  'profile-edit': () => { ui.editProfile = true; rerender(); },
  'table-chip': (el) => { const id = el.dataset.table; ui.tf[id] = { ...(ui.tf[id] || { q: '' }), tag: el.dataset.tag || '' }; applyTableFilters(); },
  'profile-cancel': () => { ui.editProfile = false; rerender(); },
};

const FORMS = {
  register: (form) => {
    const d = Object.fromEntries(new FormData(form).entries());
    if (!d.name?.trim()) { toast('Укажите имя и фамилию'); form.name.focus(); return; }
    const id = addParticipant(d);
    st().session = { role: 'part', id };
    ui.roleModal = false;
    save();
    toast('Аккаунт создан, вы вошли как участник');
    go('#/me');
  },
  profile: (form) => {
    const d = Object.fromEntries(new FormData(form).entries());
    if (!d.name?.trim()) { toast('Имя не может быть пустым'); return; }
    if (!d.country?.trim()) { toast('Укажите страну'); return; }
    if (!d.email?.trim()) { toast('Укажите почту'); return; }
    updateParticipant(sessionUser().id, d);
    ui.editProfile = false;
    toast('Профиль сохранён');
    rerender();
  },
};

Object.assign(FORMS, participant.forms, owner.forms, org.forms);
const ACTIONS = { ...common, ...design.actions, ...results.actions, ...org.actions, ...judge.actions, ...participant.actions, ...owner.actions };
const CHANGES = { ...org.changes, ...judge.changes, ...owner.changes, ...participant.changes };
const INPUTS = { ...results.inputs, ...judge.inputs, ...owner.inputs, 'table-search': (el) => { const id = el.dataset.table; ui.tf[id] = { ...(ui.tf[id] || { tag: '' }), q: el.value }; applyTableFilters(); } };

function start() {
  load();
  document.addEventListener('click', (e) => {
    if (e.target.classList?.contains('modal-backdrop')) { if (e.target.hasAttribute('data-nav-backdrop')) { ui.navOpen = false; render(); } else closeModal(); return; }
    const rowLink = e.target.closest('tr.row-link');
    if (rowLink && !e.target.closest('a, button, input, select')) { location.hash = rowLink.dataset.href; return; }
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const fn = ACTIONS[el.dataset.action];
    if (!fn) return;
    e.preventDefault();
    fn(el, e);
  });
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-form]');
    if (!form || !FORMS[form.dataset.form]) return;
    e.preventDefault();
    FORMS[form.dataset.form](form, e);
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (el && CHANGES[el.dataset.change]) CHANGES[el.dataset.change](el, e);
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-input]');
    if (el && INPUTS[el.dataset.input]) INPUTS[el.dataset.input](el, e);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ui.navOpen) { ui.navOpen = false; render(); return; }
    if (e.key === 'Escape' && ui.roleModal) { closeModal(); return; }
    if (e.key === 'Enter' && e.target.matches('input[data-change]')) e.target.blur();
  });
  window.addEventListener('hashchange', render);
  window.addEventListener('app:render', render);
  render();
}

if (gate(start)) start();
