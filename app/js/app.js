// Точка входа: пароль на вход, роутер на hash, делегирование событий, общие действия.
import { gate } from './gate.js';
import { load, st, ui, save, roleHome, resetData, addParticipant, updateParticipant, sessionUser } from './store.js';
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
  const wasOpen = !!document.getElementById('role-modal');
  document.getElementById('app').innerHTML = m.r.v(...m.params);
  document.title = `${m.r.t} · ApexChamp`;
  document.body.classList.toggle('modal-open', !!ui.roleModal);
  if (ui.roleModal && !wasOpen) document.getElementById('role-modal')?.focus();
  if (path !== lastPath) { window.scrollTo(0, 0); lastPath = path; }
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
  'open-role-modal': () => { ui.roleModal = true; render(); },
  'close-modal': () => closeModal(),
  'login-persona': (el) => {
    const role = el.dataset.role;
    if (el.dataset.stage) st().championship.stage = el.dataset.stage;
    if (el.dataset.preset) st().ownerPreset = el.dataset.preset;
    st().session = { role, id: el.dataset.user || null };
    ui.roleModal = false;
    ui.expanded = {};
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
    updateParticipant(sessionUser().id, d);
    ui.editProfile = false;
    toast('Профиль сохранён');
    rerender();
  },
};

Object.assign(FORMS, participant.forms, owner.forms);
const ACTIONS = { ...common, ...design.actions, ...results.actions, ...org.actions, ...judge.actions, ...participant.actions, ...owner.actions };
const CHANGES = { ...org.changes, ...judge.changes };
const INPUTS = { ...results.inputs, ...judge.inputs, ...owner.inputs };

function start() {
  load();
  document.addEventListener('click', (e) => {
    if (e.target.classList?.contains('modal-backdrop')) { closeModal(); return; }
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
    if (e.key === 'Escape' && ui.roleModal) { closeModal(); return; }
    if (e.key === 'Enter' && e.target.matches('input[data-change]')) e.target.blur();
  });
  window.addEventListener('hashchange', render);
  window.addEventListener('app:render', render);
  render();
}

if (gate(start)) start();
