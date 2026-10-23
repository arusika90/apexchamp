// Общая шапка и каркас страниц.
import { st, ui, sessionUser, judgeById, partById, roleHome } from '../store.js';
import { esc, I } from '../ui.js';
import { PERSONAS, currentState, phaseName, ROLE_DESC, TIPS } from '../personas.js';

// Страница чемпионата (белый лейбл) или страница платформы.
const inChamp = (role, active) => !['roles', 'design', 'owner'].includes(active) && role !== 'owner' && role !== 'designer';

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
// Бренд чемпионата: его логотип (или код в цвете темы) и название.
export const champBrand = () => {
  const c = st().championship;
  const name = String(c.name || '');
  const m = name.match(/^(.*?)(\s+\d{4})$/) || name.match(/^(.*?)(\s+\S+)$/);
  const label = m ? `${esc(m[1])}<span class="accent">${esc(m[2])}</span>` : esc(name);
  return c.logo
    ? `<img class="champ-mark" src="${c.logo}" alt=""><span class="champ-name">${label}</span>`
    : `<span class="champ-name solo">${label}</span>`;
};

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
    : `<button type="button" class="avatar-btn" data-action="open-role-modal" title="Роль не выбрана. Нажмите, чтобы войти" aria-label="Выбрать роль" aria-haspopup="dialog"><span class="avatar" style="background:var(--fill-2);color:var(--ink)">?</span></button>`;
  return `
  <header class="topbar">
    <div class="topbar-in">
      ${inChamp(role, active) ? `<a class="logo" href="#/${role ? roleHome(role) : 'results'}">${champBrand()}</a>` : `<a class="logo" href="#/roles">${logoMark()}${wordmark()}</a>`}
      <nav class="nav" aria-label="Разделы">${navHtml}</nav>
      <div class="user">${userHtml}${nav.length ? `<button type="button" class="btn icon burger" data-action="nav-open" aria-label="Меню" aria-expanded="${ui.navOpen ? 'true' : 'false'}">${I.menu}</button>` : ''}</div>
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
        ${inChamp(role, active) ? `<span class="logo">${champBrand()}</span>` : `<a class="logo" href="#/roles">${logoMark()}${wordmark()}</a>`}
        <button class="btn icon ghost" data-action="nav-close" aria-label="Закрыть">${I.plus.replace('<svg', '<svg style="transform:rotate(45deg)"')}</button>
      </div>
      ${u ? `<div class="row" style="gap:10px;padding:4px 0"><span class="avatar ${role === 'org' || role === 'designer' || role === 'owner' ? 'brand' : ''}">${esc(u.initials)}</span><span class="col" style="gap:0;line-height:1.2"><b class="small">${esc(u.name)}</b><span class="xs muted">${ROLE_NAME[role]}${currentState() ? ' · ' + esc(currentState()) : ''}</span></span></div>` : ''}
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

export function personaButton(role, pr, compact = false, index = null) {
  const name = personaName(role, pr);
  return `<button type="button" class="persona ${compact ? 'compact' : ''}" data-action="login-persona" data-role="${role}" data-user="${pr.user || ''}" data-stage="${pr.stage || ''}" data-preset="${pr.preset || ''}">
    <span class="persona-top">
      ${index != null ? `<span class="num-badge">${index}</span>` : ''}
      <span class="chip phase-${pr.phase}">${phaseName(pr.phase)}</span>
      ${compact ? '' : `<span class="persona-go">Войти ${I.right.replace('<svg', '<svg width="16" height="16"')}</span>`}
    </span>
    <b class="persona-title">${esc(pr.label)}${name ? ` <span class="muted" style="font-weight:600">· ${esc(name)}</span>` : ''}</b>
    ${compact ? '' : `<span class="xs muted">${esc(pr.desc)}</span>`}
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
  } else if (ui.modalState != null && PERSONAS[cur][ui.modalState]) {
    const pr = PERSONAS[cur][ui.modalState];
    const [, name, icon] = ROLES.find((x) => x[0] === cur) || [cur, ROLE_NAME[cur], ''];
    const pn = personaName(cur, pr);
    const rd = ROLE_DESC[cur] || {};
    body = `
      <button type="button" class="btn s ghost" style="align-self:flex-start;margin-left:-10px" data-action="modal-state" data-i="">${I.left}<span>${name}</span></button>
      <div class="row" style="gap:10px"><span class="num-badge">${ui.modalState + 1}</span><span class="chip phase-${pr.phase}">${phaseName(pr.phase)}</span></div>
      <div class="col" style="gap:4px"><h3>${esc(pr.label)}${pn ? ` <span class="muted" style="font-weight:600">· ${esc(pn)}</span>` : ''}</h3><span class="small muted">${esc(pr.desc)}</span></div>
      <div class="col" style="gap:4px;padding:14px;border-radius:14px;background:var(--fill)"><b class="small">Кто такой ${name.toLowerCase()}</b><span class="small">${esc(rd.what || '')}</span><span class="small muted">${esc(rd.differs || '')}</span></div>
      <div class="col" style="gap:4px;padding:14px;border-radius:14px;background:var(--peach)"><b class="small" style="color:var(--brand-ink)">Что посмотреть</b><span class="small">${esc(pr.look || TIPS[cur] || '')}</span></div>
      <button type="button" class="btn primary" data-action="login-persona" data-role="${cur}" data-user="${pr.user || ''}" data-stage="${pr.stage || ''}" data-preset="${pr.preset || ''}">Войти ${pn ? 'как ' + esc(pn) : ''}</button>`;
  } else {
    const [, name] = ROLES.find((x) => x[0] === cur) || [cur, ROLE_NAME[cur]];
    body = `
      <button type="button" class="btn s ghost" style="align-self:flex-start;margin-left:-10px" data-action="modal-role" data-role="">${I.left}<span>Роли</span></button>
      <div class="col" style="gap:2px"><h3>${name}</h3><span class="small muted">Выберите состояние: до, во время или после чемпионата. Внутри — описание и что посмотреть.</span></div>
      <div class="persona-rows">${PERSONAS[cur].map((pr, i) => {
        const pn = personaName(cur, pr);
        return `<button type="button" class="persona-row" data-action="modal-state" data-i="${i}">
          <span class="num-badge">${i + 1}</span>
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
  if (c.stage === 'setup') return '<span class="chip"><span class="dot"></span>Настройка</span>';
  if (c.stage === 'submission') return '<span class="chip info"><span class="dot"></span>Идёт приём работ</span>';
  return '<span class="chip warn"><span class="dot"></span>Идёт судейство</span>';
}
