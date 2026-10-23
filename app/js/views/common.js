// Общая шапка и каркас страниц.
import { st, ui, sessionUser, judgeById, partById } from '../store.js';
import { esc, I } from '../ui.js';
import { PERSONAS, currentState, phaseName } from '../personas.js';

export const ROLE_NAME = { org: 'Организатор', judge: 'Судья', part: 'Участник', guest: 'Гость', designer: 'Дизайн-система', owner: 'Владелец платформы' };

const NAV = {
  org: [['org', 'Обзор'], ['org/settings', 'Чемпионат'], ['org/nominations', 'Номинации'], ['org/judges', 'Судьи'], ['org/participants', 'Участники'], ['org/places', 'Места и Гран-при'], ['results', 'Результаты']],
  judge: [['judge', 'Мои работы'], ['results', 'Результаты']],
  part: [['me', 'Мои работы'], ['results', 'Общая таблица']],
  guest: [['results', 'Результаты']],
  designer: [['design', 'Дизайн-система'], ['results', 'Результаты']],
  owner: [['owner', 'Платформа'], ['org', 'Демо-чемпионат']],
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
       <button type="button" class="avatar-btn" data-action="open-role-modal" title="${esc(u.name)} · ${ROLE_NAME[role]}${currentState() ? ' · ' + esc(currentState()) : ''}. Нажмите, чтобы сменить роль или выйти" aria-label="${esc(u.name)}, ${ROLE_NAME[role]}. Сменить роль или выйти" aria-haspopup="dialog"><span class="avatar ${role === 'org' || role === 'designer' || role === 'owner' ? 'brand' : ''}">${esc(u.initials)}</span></button>`
    : `<button class="btn s primary" data-action="open-role-modal" aria-haspopup="dialog">Войти</button>`;
  return `
  <header class="topbar">
    <div class="topbar-in">
      <a class="logo" href="#/roles">${logoMark()}${wordmark()}</a>
      ${role === 'owner' || role === 'designer' ? '' : `<span class="champ-chip ${s.championship.logo ? '' : 'no-logo'}">${s.championship.logo ? `<img class="champ-logo" src="${s.championship.logo}" alt="">` : ''}${esc(s.championship.name)}</span>`}
      <nav class="nav" aria-label="Разделы">${navHtml}</nav>
      <div class="user">${nav.length ? `<button type="button" class="btn icon burger" data-action="nav-open" aria-label="Меню" aria-expanded="${ui.navOpen ? 'true' : 'false'}">${I.menu}</button>` : ''}${userHtml}</div>
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
      </nav>
      <span class="xs muted">© 2026 ApexChamp · демо, данные живут в этом браузере</span>
    </div>
  </footer>`;
}

export function navDrawer(active) {
  const s = st();
  const role = s.session?.role;
  const u = sessionUser();
  const nav = role ? NAV[role] : [];
  return `
  <div class="modal-backdrop left" data-nav-backdrop>
    <div class="modal nav-drawer" id="nav-drawer" role="dialog" aria-modal="true" aria-label="Меню" tabindex="-1">
      <div class="row-between" style="flex-wrap:nowrap">
        <a class="logo" href="#/roles">${logoMark()}${wordmark()}</a>
        <button class="btn icon ghost" data-action="nav-close" aria-label="Закрыть">${I.plus.replace('<svg', '<svg style="transform:rotate(45deg)"')}</button>
      </div>
      ${u ? `<div class="row" style="gap:10px;padding:4px 0"><span class="avatar ${role === 'org' || role === 'designer' || role === 'owner' ? 'brand' : ''}">${esc(u.initials)}</span><span class="col" style="gap:0;line-height:1.2"><b class="small">${esc(u.name)}</b><span class="xs muted">${ROLE_NAME[role]}${currentState() ? ' · ' + esc(currentState()) : ''}</span></span></div>` : ''}
      ${role !== 'owner' && role !== 'designer' ? `<span class="champ-chip ${s.championship.logo ? '' : 'no-logo'}" style="align-self:flex-start">${s.championship.logo ? `<img class="champ-logo" src="${s.championship.logo}" alt="">` : ''}${esc(s.championship.name)}</span>` : ''}
      <nav class="nav-list" aria-label="Разделы">${nav.map(([r, label]) => `<a href="#/${r}" class="${active === r ? 'active' : ''}" data-action="nav-go">${label}</a>`).join('')}</nav>
      <div class="row-between" style="border-top:1px solid var(--line);padding-top:14px;margin-top:auto">
        <button class="btn s" data-action="nav-roles">${I.swap}<span>Сменить роль</span></button>
        <button class="btn s ghost" data-action="logout">${I.logout}<span>Выйти</span></button>
      </div>
    </div>
  </div>`;
}

export function shell(active, body, actionbar = '') {
  return `${header(active)}<main class="page">${body}</main>${actionbar}${footer()}${ui.navOpen ? navDrawer(active) : ''}${ui.roleModal ? roleModal() : ''}`;
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
    <span class="col grow" style="gap:1px;min-width:0"><b class="small">${esc(pr.label)}${name ? ` <span class="muted" style="font-weight:600">· ${esc(name)}</span>` : ''}</b>${compact ? '' : `<span class="xs muted">${esc(pr.desc)}</span>`}</span>
    ${compact ? '' : `<span class="persona-go">Войти ${I.right.replace('<svg', '<svg width="16" height="16"')}</span>`}
  </button>`;
}

export function roleModal() {
  const s = st();
  const role = s.session?.role;
  const u = sessionUser();
  const ROLES = [
    ['org', 'Организатор', I.sliders, 'Видит всё, правит оценки, публикует итоги'],
    ['judge', 'Судья', I.gavel, 'Только номера работ, баллы и комментарий'],
    ['part', 'Участник', I.user, 'Подаёт работы, видит свои оценки'],
    ['guest', 'Гость', I.globe, 'Публичная таблица без имён'],
    ['owner', 'Владелец платформы', I.star, 'Чемпионаты, организаторы, доступы'],
    ['designer', 'Дизайн-система', I.palette, 'Цвета, шрифты, компоненты'],
  ];
  const cur = ui.modalRole;
  let body;
  if (!cur) {
    body = `
      <p class="small muted">${u ? `Сейчас: ${esc(u.name)}, ${ROLE_NAME[role].toLowerCase()}${currentState() ? ', ' + esc(currentState()) : ''}.` : ''} Выберите роль, затем её состояние.</p>
      <div class="persona-rows">${ROLES.map(([r, name, icon, desc]) => `
        <button type="button" class="persona-row" data-action="modal-role" data-role="${r}">
          <span class="icon-sq">${icon.replace('<svg', '<svg width="20" height="20"')}</span>
          <span class="col grow" style="gap:1px"><b class="small">${name}${role === r ? ' <span class="chip peach" style="height:22px;font-size:11px">сейчас</span>' : ''}</b><span class="xs muted">${desc}</span></span>
          <span class="muted">${I.right}</span>
        </button>`).join('')}</div>`;
  } else {
    const [, name] = ROLES.find((x) => x[0] === cur) || [cur, ROLE_NAME[cur]];
    body = `
      <button type="button" class="btn s ghost" style="align-self:flex-start;margin-left:-10px" data-action="modal-role" data-role="">${I.left}<span>Роли</span></button>
      <div class="col" style="gap:2px"><h3>${name}</h3><span class="small muted">Выберите состояние: до, во время или после чемпионата.</span></div>
      <div class="persona-rows">${PERSONAS[cur].map((pr) => {
        const pn = personaName(cur, pr);
        return `<button type="button" class="persona-row" data-action="login-persona" data-role="${cur}" data-user="${pr.user || ''}" data-stage="${pr.stage || ''}" data-preset="${pr.preset || ''}">
          <span class="chip phase-${pr.phase}">${phaseName(pr.phase)}</span>
          <span class="col grow" style="gap:1px"><b class="small">${esc(pr.label)}${pn ? ` <span class="muted" style="font-weight:600">· ${esc(pn)}</span>` : ''}</b><span class="xs muted">${esc(pr.desc)}</span></span>
          <span class="muted">${I.right}</span>
        </button>`; }).join('')}</div>`;
  }
  return `
  <div class="modal-backdrop">
    <div class="modal" id="role-modal" role="dialog" aria-modal="true" aria-labelledby="role-modal-title" tabindex="-1">
      <div class="row-between" style="flex-wrap:nowrap">
        <h2 id="role-modal-title" style="font-size:22px">${u ? 'Сменить роль' : 'Войти'}</h2>
        <button class="btn icon ghost" data-action="close-modal" aria-label="Закрыть">${I.plus.replace('<svg', '<svg style="transform:rotate(45deg)"')}</button>
      </div>
      ${body}
      <div class="row-between" style="border-top:1px solid var(--line);padding-top:14px">
        ${u ? `<button class="btn s ghost" data-action="logout">${I.logout}<span>Выйти</span></button>` : '<span></span>'}
        <button class="btn s" data-action="close-modal">Отмена</button>
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
