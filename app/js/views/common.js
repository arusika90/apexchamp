// Общая шапка и каркас страниц.
import { st, ui, sessionUser, judgeById, partById } from '../store.js';
import { esc, I } from '../ui.js';
import { PERSONAS, currentState, phaseName } from '../personas.js';

export const ROLE_NAME = { org: 'Организатор', judge: 'Судья', part: 'Участник', guest: 'Гость', designer: 'Дизайнер', owner: 'Владелец платформы' };

const NAV = {
  org: [['org', 'Обзор'], ['org/settings', 'Чемпионат'], ['org/nominations', 'Номинации'], ['org/judges', 'Судьи'], ['org/participants', 'Участники'], ['org/places', 'Места и Гран-при'], ['results', 'Результаты']],
  judge: [['judge', 'Мои работы'], ['results', 'Результаты']],
  part: [['me', 'Мои работы'], ['results', 'Общая таблица']],
  guest: [['results', 'Результаты']],
  designer: [['design', 'Дизайн-система'], ['results', 'Результаты']],
  owner: [['owner', 'Платформа'], ['org', 'Демо-чемпионат'], ['design', 'Дизайн-система']],
};

export const logoMark = () => `<span class="logo-mark">${I.lash}</span>`;
export const wordmark = () => `<span class="wordmark">apex<span>champ</span></span>`;

export function header(active) {
  const s = st();
  const role = s.session?.role;
  const u = sessionUser();
  const nav = role ? NAV[role] : [];
  const navHtml = nav.map(([r, label]) => `<a href="#/${r}" class="${active === r ? 'active' : ''}">${label}</a>`).join('');
  const impersonated = !!s.session?.by;
  const userHtml = u
    ? `${impersonated ? `<button class="btn xs" style="background:var(--peach);color:var(--brand-ink)" data-action="back-to-org">${s.session.by === 'owner' ? 'Вернуться к платформе' : 'Вернуться к организатору'}</button>` : ''}
       <span class="avatar ${role === 'org' || role === 'designer' || role === 'owner' ? 'brand' : ''}" aria-hidden="true">${esc(u.initials)}</span>
       <span class="col" style="gap:0;line-height:1.2"><b class="small">${esc(u.name)}</b><span class="xs muted">${ROLE_NAME[role]}${currentState() ? ' · ' + esc(currentState()) : ''}</span></span>
       <button class="btn s" data-action="open-role-modal" title="Выйти или войти в другой роли" aria-haspopup="dialog">${I.logout}<span>Выйти</span></button>`
    : `<button class="btn s primary" data-action="open-role-modal" aria-haspopup="dialog">Войти</button>`;
  return `
  <header class="topbar">
    <div class="topbar-in">
      <a class="logo" href="#/roles">${logoMark()}${wordmark()}</a>
      <span class="champ-chip ${s.championship.logo ? '' : 'no-logo'}">${s.championship.logo ? `<img class="champ-logo" src="${s.championship.logo}" alt="">` : ''}${esc(s.championship.name)}</span>
      <nav class="nav" aria-label="Разделы">${navHtml}</nav>
      <div class="user">${userHtml}</div>
    </div>
  </header>`;
}

export function footer() {
  return `
  <footer class="footer">
    <div class="footer-in">
      <div class="col" style="gap:4px">
        <span class="wordmark" style="font-size:17px">apex<span>champ</span></span>
        <span class="xs muted">Платформа судейства бьюти-чемпионатов. Организатор настраивает номинации и критерии, судьи ставят баллы, система считает места.</span>
      </div>
      <nav class="row" style="gap:16px" aria-label="Подвал">
        <a href="#/roles">Роли и состояния</a>
        <a href="#/results">Результаты</a>
        <a href="#/design">Дизайн-система</a>
        <a href="#/register">Регистрация</a>
      </nav>
      <span class="xs muted">© 2026 ApexChamp · демо, данные живут в этом браузере</span>
    </div>
  </footer>`;
}

export function shell(active, body, actionbar = '') {
  return `${header(active)}<main class="page">${body}</main>${actionbar}${footer()}${ui.roleModal ? roleModal() : ''}`;
}

// Всплывающее окно «Выйти»: сразу предлагает, кем и в каком состоянии войти.
export function personaName(role, pr) {
  if (role === 'judge') return judgeById(pr.user)?.short || '';
  if (role === 'part') return partById(pr.user)?.name?.split(' ')[0] || '';
  return '';
}

export function personaButton(role, pr, compact = false) {
  const name = personaName(role, pr);
  return `<button type="button" class="persona ${compact ? 'compact' : ''}" data-action="login-persona" data-role="${role}" data-user="${pr.user || ''}" data-stage="${pr.stage || ''}" data-preset="${pr.preset || ''}">
    <span class="chip phase-${pr.phase}">${phaseName(pr.phase)}</span>
    <span class="col" style="gap:1px;min-width:0"><b class="small">${esc(pr.label)}${name ? ` <span class="muted" style="font-weight:600">· ${esc(name)}</span>` : ''}</b>${compact ? '' : `<span class="xs muted">${esc(pr.desc)}</span>`}</span>
  </button>`;
}

export function roleModal() {
  const s = st();
  const role = s.session?.role;
  const u = sessionUser();
  const sec = (r, icon, color, title) => `
    <div class="role-row ${role === r ? 'current' : ''}" style="flex-direction:column;align-items:stretch;gap:10px">
      <div class="row" style="gap:10px"><span class="icon" style="background:#fff;color:${color};width:36px;height:36px;border-radius:10px">${icon}</span><b>${title}</b>${role === r ? '<span class="chip peach">сейчас</span>' : ''}</div>
      <div class="persona-list">${PERSONAS[r].map((pr) => personaButton(r, pr, true)).join('')}</div>
    </div>`;
  return `
  <div class="modal-backdrop">
    <div class="modal" id="role-modal" role="dialog" aria-modal="true" aria-labelledby="role-modal-title" tabindex="-1">
      <div class="row-between" style="flex-wrap:nowrap">
        <h2 id="role-modal-title" style="font-size:22px">${u ? 'Выйти и войти в другой роли' : 'Войти'}</h2>
        <button class="btn icon ghost" data-action="close-modal" aria-label="Закрыть">${I.plus.replace('<svg', '<svg style="transform:rotate(45deg)"')}</button>
      </div>
      <p class="small muted">${u ? `Сейчас вы — ${u.name === ROLE_NAME[role] ? ROLE_NAME[role].toLowerCase() : `${esc(u.name)}, ${ROLE_NAME[role].toLowerCase()}`}${currentState() ? ', ' + esc(currentState()) : ''}.` : ''} Выберите роль и её состояние: этап чемпионата переключится сам.</p>
      ${sec('org', I.sliders, 'var(--brand)', 'Организатор')}
      ${sec('judge', I.gavel, 'var(--warn)', 'Судья')}
      ${sec('part', I.user, 'var(--ok)', 'Участник')}
      ${sec('guest', I.globe, 'var(--ink)', 'Гость')}
      ${sec('designer', I.palette, 'var(--brand)', 'Дизайнер')}
      ${sec('owner', I.star, 'var(--brand)', 'Владелец платформы')}
      <div class="row-between" style="border-top:1px solid var(--line);padding-top:14px">
        ${u ? `<button class="btn s ghost" data-action="logout">${I.logout}<span>Просто выйти</span></button>` : '<span></span>'}
        <div class="row" style="gap:8px"><a class="xs b" href="#/register" data-action="close-modal-link">Регистрация участника</a><button class="btn s" data-action="close-modal">Отмена</button></div>
      </div>
    </div>
  </div>`;
}

export function stageChip() {
  const c = st().championship;
  if (c.stage === 'published') return '<span class="chip ok"><span class="dot"></span>Итоги опубликованы</span>';
  if (c.stage === 'submission') return '<span class="chip info"><span class="dot"></span>Идёт приём работ</span>';
  return '<span class="chip warn"><span class="dot"></span>Идёт судейство</span>';
}
