// Мастер создания чемпионата: организатор впервые заходит на площадку и заводит мероприятие.
import { st, ui, save, worksOfNom, addNomination } from '../store.js';
import { esc, I, toast, rerender, num, parseNum, CATEGORIES } from '../ui.js';
import { shell } from './common.js';
import { THEMES, themeVars } from '../theme.js';
import { TEMPLATE_NAMES } from '../data.js';

const STEPS = ['Основное', 'Сроки', 'Оформление', 'Номинации', 'Места', 'Готово'];

function stepper(cur) {
  return `<ol class="stepper">${STEPS.map((s, i) => `<li class="${i < cur ? 'done' : i === cur ? 'now' : ''}"><button type="button" data-action="setup-go" data-step="${i}" ${i > cur ? 'disabled' : ''}><span class="n">${i < cur ? '✓' : i + 1}</span><span>${s}</span></button></li>`).join('')}</ol>`;
}

function field(id, label, key, { req = false, hint = '', type = 'text', area = false } = {}) {
  const c = st().championship;
  const v = esc(c[key] || '');
  const ctl = area
    ? `<textarea id="${id}" class="input" data-change="setup-field" data-key="${key}">${v}</textarea>`
    : `<input id="${id}" class="input" type="${type}" value="${v}" data-change="setup-field" data-key="${key}" ${req ? 'required' : ''}>`;
  return `<div class="field ${req ? 'req' : ''}"><label for="${id}">${label}${req ? '' : ' <span class="opt">необязательно</span>'}</label>${ctl}${hint ? `<span class="xs muted">${hint}</span>` : ''}</div>`;
}

function stepBody(step) {
  const s = st();
  const c = s.championship;
  if (step === 0) return `
    <h2>Как называется чемпионат</h2>
    <p class="muted">Название увидят участники, судьи и гости. Адрес страницы уже выдан владельцем платформы.</p>
    <div class="grid-2">${field('s-name', 'Название', 'name', { req: true })}${field('s-short', 'Короткий код', 'short', { hint: 'До трёх букв, пока нет логотипа' })}</div>
    ${field('s-about', 'Описание для гостей', 'about', { area: true, hint: 'Пара предложений: формат, для кого, что получат участники' })}
    ${field('s-contact', 'Контакт для участников', 'contact', { hint: 'Инстаграм, телеграм или почта' })}`;
  if (step === 1) return `
    <h2>Сроки</h2>
    <p class="muted">Три даты задают этапы: приём работ, судейство, оглашение.</p>
    <div class="grid-3">${field('s-submit', 'Приём работ до', 'submitUntil', { req: true })}${field('s-deadline', 'Судейство до', 'deadline', { req: true })}${field('s-announce', 'Оглашение', 'announce', { req: true })}</div>`;
  if (step === 2) return `
    <h2>Оформление</h2>
    <p class="muted">Тема красит кабинеты и публичную страницу чемпионата. Логотип можно загрузить сейчас или позже.</p>
    <div class="theme-grid">${THEMES.map((th) => { const v = themeVars({ preset: th.id }); const on = (c.theme?.preset || 'orange') === th.id && !c.theme?.brand; return `<button type="button" class="theme-card ${on ? 'on' : ''}" data-action="theme-preset" data-id="${th.id}" aria-pressed="${on}"><span class="theme-preview" style="background:${v['--bg']}"><span style="background:${th.brand}"></span><span style="background:${th.cta}"></span><span style="background:${v['--peach']}"></span></span><b class="small">${th.name}</b></button>`; }).join('')}</div>
    <div class="row" style="gap:16px">
      ${c.logo ? `<img class="logo-preview" src="${c.logo}" alt="Логотип">` : `<span class="logo-fallback">${esc(c.short || '?')}</span>`}
      <label class="btn s file-btn">${I.plus}<span>${c.logo ? 'Заменить логотип' : 'Загрузить логотип'}</span><input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" data-change="champ-logo"></label>
    </div>`;
  if (step === 3) {
    const rows = s.blocks.map((b) => `
      <div class="col" style="gap:8px">
        <b class="small muted" style="text-transform:uppercase;letter-spacing:.4px">${esc(b.name)}</b>
        ${s.nominations.filter((n) => n.block === b.id).map((n) => { const w = worksOfNom(n.id).length; return `
          <div class="row-between" style="padding:10px 12px;border-radius:12px;background:var(--fill)">
            <span class="col" style="gap:0"><b class="small">${esc(n.name)} <span class="muted" style="font-weight:500">· ${esc(n.prefix)}</span></b><span class="xs muted">${n.criteria.length} критериев · ${TEMPLATE_NAMES[n.template] || 'свои критерии'}${w ? ` · ${w} работ` : ''}</span></span>
            ${w ? '<span class="xs muted">есть работы</span>' : `<button type="button" class="btn xs ghost" data-action="setup-nom-remove" data-id="${n.id}">${I.trash}<span>Убрать</span></button>`}
          </div>`; }).join('') || '<span class="small muted">Нет номинаций</span>'}
      </div>`).join('');
    return `
      <h2>Номинации</h2>
      <p class="muted">Начали с шаблона «Ресницы и брови». Уберите лишнее и добавьте свои. Критерии каждой номинации настраиваются потом в разделе «Номинации».</p>
      <div class="stack" style="gap:16px">${rows}</div>
      ${ui.setupNomForm ? nomForm() : `<button type="button" class="btn s" style="align-self:flex-start;border:1px dashed var(--line-2);background:transparent" data-action="setup-nom-new">${I.plus}<span>Добавить номинацию</span></button>`}`;
  }
  if (step === 4) {
    const set = s.settings;
    return `
      <h2>Категории и призовые места</h2>
      <p class="muted">Место даётся, если средний процент работы не ниже порога своей категории. Правило можно поменять позже в «Местах и Гран-при».</p>
      <div style="display:grid;grid-template-columns:minmax(0,1.2fr) repeat(3,minmax(0,1fr));gap:10px;align-items:center;max-width:560px">
        <span></span><span class="label">1 место от</span><span class="label">2 место от</span><span class="label">3 место от</span>
        ${CATEGORIES.map((cat) => `<b>${cat.name}</b>${[0, 1, 2].map((i) => `<input class="input s num" style="width:100%" inputmode="decimal" value="${num(set.thresholds[cat.id][i])}" data-change="th" data-cat="${cat.id}" data-i="${i}" aria-label="${cat.name}, ${i + 1} место">`).join('')}`).join('')}
      </div>
      <div class="grid-2" style="max-width:560px">
        <div class="field"><label for="s-gp">Работ в заявке на Гран-при</label><input id="s-gp" class="input num" style="width:100%" value="${set.gpCount}" data-change="setting" data-key="gpCount"></div>
        <div class="field"><label for="s-vice">Вице гран-при</label><input id="s-vice" class="input num" style="width:100%" value="${set.gpVice}" data-change="setting" data-key="gpVice"></div>
      </div>`;
  }
  return `
    <h2>Всё готово к приёму работ</h2>
    <p class="muted">Проверьте и откройте приём. После этого участники смогут подавать работы, а вы — приглашать судей и участников.</p>
    <div class="grid-2">
      <div class="col" style="gap:6px;padding:16px;border-radius:14px;background:var(--fill)"><span class="label">Чемпионат</span><b>${esc(c.name)}</b><span class="small muted">${esc(c.about || 'Без описания')}</span></div>
      <div class="col" style="gap:6px;padding:16px;border-radius:14px;background:var(--fill)"><span class="label">Сроки</span><span class="small">Приём до <b>${esc(c.submitUntil)}</b></span><span class="small">Судейство до <b>${esc(c.deadline)}</b></span><span class="small">Оглашение <b>${esc(c.announce)}</b></span></div>
      <div class="col" style="gap:6px;padding:16px;border-radius:14px;background:var(--fill)"><span class="label">Номинации</span><b>${s.nominations.length}</b><span class="small muted">${s.blocks.map((b) => `${esc(b.name)}: ${s.nominations.filter((n) => n.block === b.id).length}`).join(' · ')}</span></div>
      <div class="col" style="gap:6px;padding:16px;border-radius:14px;background:var(--fill)"><span class="label">Места</span><span class="small">${CATEGORIES.map((cat) => `${cat.name}: ${s.settings.thresholds[cat.id].map((x) => num(x)).join(' / ')} %`).join('<br>')}</span></div>
    </div>
    <div class="row"><button class="btn primary" data-action="stage-ask" data-stage="submission">Открыть приём работ</button><span class="small muted">Дальше: пригласить судей и участников</span></div>`;
}

function nomForm() {
  const s = st();
  return `
    <form class="card stack" data-form="setup-nom" style="border:2px solid var(--brand);padding:18px">
      <div class="row-between"><h3>Новая номинация</h3><button type="button" class="btn xs ghost" data-action="setup-nom-cancel">Отмена</button></div>
      <div class="grid-3">
        <div class="field req"><label for="sn-name">Название</label><input id="sn-name" name="name" class="input" required placeholder="Брови пудровое"></div>
        <div class="field req"><label for="sn-block">Блок</label><select id="sn-block" name="block" class="input">${s.blocks.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select></div>
        <div class="field req"><label for="sn-prefix">Номера работ</label><input id="sn-prefix" name="prefix" class="input" required placeholder="БП-1xx"><span class="xs muted">«xx» заменятся порядковым номером</span></div>
      </div>
      <div class="field req"><label for="sn-tpl">Критерии</label><select id="sn-tpl" name="template" class="input">${Object.entries(TEMPLATE_NAMES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><span class="xs muted">Скопируются как стартовые, дальше их можно править.</span></div>
      <div class="row"><button class="btn primary" type="submit">Добавить</button></div>
    </form>`;
}

export function render() {
  const step = Math.min(ui.setupStep || 0, STEPS.length - 1);
  const body = `
    <div class="page-head"><div class="col" style="gap:8px"><span class="chip info" style="align-self:flex-start"><span class="dot"></span>Создание чемпионата</span><h1>Новый чемпионат</h1></div></div>
    ${stepper(step)}
    <section class="card stack" style="gap:18px">${stepBody(step)}</section>`;
  const bar = step < STEPS.length - 1 ? `
    <div class="actionbar"><div class="actionbar-in">
      <span class="small muted">Шаг ${step + 1} из ${STEPS.length} · всё сохраняется сразу</span>
      <div class="row">${step > 0 ? `<button class="btn s ghost" data-action="setup-go" data-step="${step - 1}">${I.left}<span>Назад</span></button>` : ''}<button class="btn primary" data-action="setup-next">Дальше</button></div>
    </div></div>` : '';
  return shell('org', body, bar);
}

export const actions = {
  'setup-go': (el) => { ui.setupStep = Number(el.dataset.step); ui.setupNomForm = false; rerender(); window.scrollTo(0, 0); },
  'setup-next': () => {
    const c = st().championship;
    const step = ui.setupStep || 0;
    if (step === 0 && !c.name?.trim()) { toast('Укажите название'); return; }
    if (step === 1 && (!c.submitUntil || !c.deadline || !c.announce)) { toast('Заполните три даты'); return; }
    if (step === 3 && !st().nominations.length) { toast('Нужна хотя бы одна номинация'); return; }
    ui.setupStep = step + 1;
    ui.setupNomForm = false;
    rerender();
    window.scrollTo(0, 0);
  },
  'setup-nom-new': () => { ui.setupNomForm = true; rerender(); },
  'setup-nom-cancel': () => { ui.setupNomForm = false; rerender(); },
  'setup-nom-remove': (el) => {
    const s = st();
    if (worksOfNom(el.dataset.id).length) return;
    const n = s.nominations.find((x) => x.id === el.dataset.id);
    s.nominations = s.nominations.filter((x) => x.id !== el.dataset.id);
    save();
    toast(`Номинация «${n?.name}» убрана`);
    rerender();
  },
  'setup-finish': () => {
    st().championship.stage = 'submission';
    save();
    ui.setupStep = 0;
    toast('Приём работ открыт');
    location.hash = '#/org';
  },
};

export const changes = {
  'setup-field': (el) => {
    const key = el.dataset.key;
    const v = el.value.trim();
    st().championship[key] = key === 'short' ? v.slice(0, 3).toUpperCase() : v;
    save();
  },
};

export const forms = {
  'setup-nom': (form) => {
    const d = Object.fromEntries(new FormData(form).entries());
    if (!d.name?.trim() || !d.prefix?.trim()) { toast('Нужны название и номера работ'); return; }
    addNomination(d);
    ui.setupNomForm = false;
    toast(`Номинация «${d.name.trim()}» добавлена`);
    rerender();
  },
};

export { parseNum };
