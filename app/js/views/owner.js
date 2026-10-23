// Консоль владельца платформы: чемпионаты, организаторы, доступы.
// Сейчас по-настоящему работает один чемпионат (демо-данные), остальные строки — пример того,
// как будет выглядеть список при нескольких арендаторах.
import { st, save } from '../store.js';
import { esc, I, toast, rerender, plural, href, pct, tableToolbar, dateTime } from '../ui.js';
import { shell } from './common.js';
import { progress } from '../scoring.js';

const PLANS = [
  { id: 'trial', name: 'Пробный', desc: 'до 30 работ, 1 чемпионат' },
  { id: 'start', name: 'Старт', desc: 'до 150 работ, 1 чемпионат' },
  { id: 'pro', name: 'Про', desc: 'без лимита работ, несколько чемпионатов, свой домен' },
];
export const planName = (id) => PLANS.find((p) => p.id === id)?.name || id;

const statusChip = (t) => ({
  active: '<span class="chip ok"><span class="dot"></span>Активен</span>',
  trial: '<span class="chip info"><span class="dot"></span>Пробный</span>',
  expired: '<span class="chip">Истёк</span>',
  paused: '<span class="chip warn">Приостановлен</span>',
  draft: '<span class="chip">Не оплачен</span>',
}[t.status] || '');

const inviteCell = (t) => !t.invite || t.invite.confirmed
  ? `<span class="chip ok">${I.check.replace('<svg', '<svg width="12" height="12"')}подтверждено</span>`
  : `<span class="row" style="gap:6px;flex-wrap:nowrap"><span class="chip warn" title="Письмо отправлено ${t.invite.sentAt ? dateTime(t.invite.sentAt) : ''}${t.invite.resent ? `, повторно ${t.invite.resent}` : ''}">ожидает</span><button class="btn xs" data-action="tenant-invite" data-id="${t.id}">Отправить снова</button></span>`;

export const slugify = (s) => String(s || '').toLowerCase()
  .replace(/[ё]/g, 'e').replace(/[а-я]/g, (ch) => ({ а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' }[ch] || ''))
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

export function console_() {
  const s = st();
  const preset = s.ownerPreset || 'all';
  const tenants = preset === 'empty' ? [] : (s.tenants || []).filter((t) => preset !== 'expired' || t.status === 'expired' || t.status === 'draft' || t.added);
  const active = tenants.filter((t) => t.status === 'active' || t.status === 'trial').length;
  const orgs = new Set(tenants.map((t) => t.orgEmail)).size;
  const rows = tenants.map((t) => `
    <tr class="row-link" data-href="${href('owner', 'tenant', t.id)}" data-search="${esc((t.name + ' ' + t.slug + ' ' + t.orgName + ' ' + t.orgEmail).toLowerCase())}" data-tags="${esc(t.status)} plan-${esc(t.plan)} ${t.invite && !t.invite.confirmed ? 'unconfirmed' : 'confirmed'}">
      <td><a class="b" style="color:var(--ink)" href="${href('owner', 'tenant', t.id)}">${esc(t.name)}</a><div class="xs muted">${t.real ? `${s.works.length} ${plural(s.works.length, 'работа', 'работы', 'работ')} · ${s.nominations.length} номинаций` : esc(t.note || '')}</div></td>
      <td class="small"><a href="https://${esc(t.slug)}.apexchamp.beauty" onclick="return false">${esc(t.slug)}.apexchamp.beauty</a></td>
      <td class="small">${esc(t.orgName)}<div class="xs muted">${esc(t.orgEmail)}</div></td>
      <td>${inviteCell(t)}</td>
      <td class="small">${planName(t.plan)}<div class="xs muted">до ${esc(t.until)}</div></td>
      <td>${statusChip(t)}</td>
      <td><a class="btn xs" href="${href('owner', 'tenant', t.id)}">Открыть ${I.right.replace('<svg', '<svg width="14" height="14"')}</a></td>
    </tr>`).join('');

  const body = `
    <div class="page-head">
      <div class="col" style="gap:8px"><h1>Платформа</h1><p class="muted">Чемпионаты, которые работают на ApexChamp, их организаторы и доступы. Организатор видит только свой чемпионат.</p></div>
    </div>
    <div class="grid-4">
      <section class="card kpi"><span class="label">Чемпионатов</span><span class="value">${tenants.length}</span><span class="small muted">${active} ${plural(active, 'активный', 'активных', 'активных')}</span></section>
      <section class="card kpi"><span class="label">Организаторов</span><span class="value">${orgs}</span></section>
      <section class="card kpi"><span class="label">Работ в системе</span><span class="value">${s.works.length}</span><span class="small muted">в реальном демо-чемпионате</span></section>
      <section class="card kpi"><span class="label">Ждут оплаты</span><span class="value">${tenants.filter((t) => t.status === 'draft' || t.status === 'expired').length}</span></section>
    </div>
    <div class="two-col">
      <div class="main stack">
        ${preset === 'empty' && !tenants.length ? `<section class="card peach stack" style="align-items:flex-start;padding:32px"><h2>Платформа пустая</h2><p>Добавьте первого организатора: впишите название чемпионата, адрес вида <b>название.apexchamp.beauty</b> подставится сам. Организатор получит ссылку и настроит номинации, критерии и судей.</p></section>` : ''}
        ${preset === 'expired' ? `<section class="card lemon pad-s small"><b>Доступы, которым нужно внимание.</b> Истёкшие чемпионаты уходят в архив: таблица результатов остаётся открытой, кабинеты закрыты. Активируйте после оплаты.</section>` : ''}
        <section class="card flat ${preset === 'empty' && !tenants.length ? 'hide' : ''}">
          <div class="section-title"><h3>Чемпионаты</h3><span class="small muted">адрес выдаётся автоматически из названия</span></div>
          ${tableToolbar('tenants', 'Название, адрес, организатор', [['', 'Все'], ['active', 'Активные'], ['trial', 'Пробные'], ['draft', 'Ждут оплаты'], ['expired', 'Истёкшие'], ['paused', 'Приостановлены'], ['unconfirmed', 'Не подтвердили']])}
          <div class="table-wrap"><table class="table">
            <thead><tr><th>Чемпионат</th><th>Адрес</th><th>Организатор</th><th>Приглашение</th><th>Тариф</th><th>Статус</th><th></th></tr></thead>
            <tbody data-rows="tenants">${rows}</tbody>
          </table></div>
          <div class="table-empty hide" data-empty="tenants">Ничего не найдено.</div>
        </section>
      </div>
      <aside class="side">
        <form class="card stack" data-form="tenant" style="gap:12px">
          <h3>Добавить организатора</h3>
          <p class="xs muted">Организатор получит письмо со ссылкой, войдёт и настроит свой чемпионат: номинации, критерии, судей.</p>
          <div class="field req"><label for="t-champ">Название чемпионата</label><input id="t-champ" name="name" class="input s" required placeholder="Мисс Мышь 2027" data-input="tenant-name"></div>
          <div class="field req"><label for="t-slug">Адрес</label><div class="row" style="gap:6px;flex-wrap:nowrap"><input id="t-slug" name="slug" class="input s" required placeholder="miss-mysh-2027" style="min-width:0"><span class="small muted" style="white-space:nowrap">.apexchamp.beauty</span></div></div>
          <div class="field req"><label for="t-org">Организатор</label><input id="t-org" name="orgName" class="input s" required placeholder="Имя и фамилия"></div>
          <div class="field req"><label for="t-email">Почта организатора</label><input id="t-email" name="orgEmail" class="input s" type="email" required placeholder="org@example.com"></div>
          <div class="field"><label for="t-plan">Тариф</label><select id="t-plan" name="plan" class="input s">${PLANS.map((p) => `<option value="${p.id}">${p.name} — ${p.desc}</option>`).join('')}</select></div>
          <div class="field"><label for="t-until">Доступ до <span class="opt">необязательно</span></label><input id="t-until" name="until" class="input s" placeholder="31 декабря 2027"></div>
          <button class="btn primary" type="submit">Создать доступ</button>
        </form>
        <section class="card stack" style="gap:8px">
          <h3>Тарифы</h3>
          ${PLANS.map((p) => `<div class="row-between small" style="padding:8px 0;border-top:1px solid var(--line)"><b>${p.name}</b><span class="muted">${p.desc}</span></div>`).join('')}
          <p class="xs muted">Цены и лимиты — черновик для обсуждения.</p>
        </section>
      </aside>
    </div>`;
  return shell('owner', body);
}

// Карточка чемпионата-арендатора
export function tenant(id) {
  const s = st();
  const t = (s.tenants || []).find((x) => x.id === id);
  if (!t) return shell('owner', '<div class="empty">Чемпионат не найден.</div>');
  const pr = t.real ? progress() : null;
  const stageName = { submission: 'приём работ', judging: 'судейство', published: 'итоги опубликованы' }[s.championship.stage];
  const stats = t.real
    ? `<div class="grid-4">
         <section class="card kpi"><span class="label">Работ</span><span class="value">${s.works.length}</span><span class="small muted">${s.nominations.length} номинаций</span></section>
         <section class="card kpi"><span class="label">Участников</span><span class="value">${s.participants.length}</span></section>
         <section class="card kpi"><span class="label">Судей</span><span class="value">${s.judges.length}</span></section>
         <section class="card kpi"><span class="label">Этап</span><span class="value" style="font-size:22px">${stageName}</span><span class="small muted">оценок отправлено ${Math.round(pr.frac * 100)} %</span></section>
       </div>`
    : `<section class="card peach pad-s small"><b>${esc(t.note || 'Чемпионат ещё не настроен')}.</b> Статистика появится, когда организатор заведёт номинации и работы.</section>`;
  const body = `
    <div class="crumbs"><a href="#/owner">Платформа</a><span>›</span><span>${esc(t.name)}</span></div>
    <div class="page-head">
      <div class="col" style="gap:8px"><h1>${esc(t.name)}</h1><div class="row"><a href="https://${esc(t.slug)}.apexchamp.beauty" onclick="return false">${esc(t.slug)}.apexchamp.beauty</a>${statusChip(t)}</div></div>
      <div class="row">
        ${t.real ? '<button class="btn" data-action="impersonate" data-role="org" data-id="">Войти как организатор</button><a class="btn" href="#/results">Публичная страница</a>' : ''}
        ${t.status === 'paused' ? `<button class="btn primary" data-action="tenant-status" data-id="${t.id}" data-status="active">Возобновить доступ</button>` : t.status === 'active' || t.status === 'trial' ? `<button class="btn" data-action="tenant-status" data-id="${t.id}" data-status="paused">Приостановить</button>` : `<button class="btn primary" data-action="tenant-status" data-id="${t.id}" data-status="active">Активировать после оплаты</button>`}
      </div>
    </div>
    ${stats}
    <div class="two-col">
      <div class="main stack">
        <section class="card stack">
          <h3>Организатор</h3>
          <div class="grid-2">
            <div class="field"><label for="tn-org">Имя</label><input id="tn-org" class="input" value="${esc(t.orgName)}" data-change="tenant-field" data-id="${t.id}" data-key="orgName"></div>
            <div class="field"><label for="tn-email">Почта</label><input id="tn-email" class="input" type="email" value="${esc(t.orgEmail)}" data-change="tenant-field" data-id="${t.id}" data-key="orgEmail"></div>
          </div>
          <div class="row-between"><span class="row" style="gap:8px"><span class="small muted">Приглашение:</span>${inviteCell(t)}</span>${!t.invite || t.invite.confirmed ? `<button class="btn s" data-action="tenant-invite" data-id="${t.id}">Отправить ссылку для входа ещё раз</button>` : ''}</div>
          <p class="xs muted">Приглашение подтверждается первым входом организатора по ссылке из письма. Пока оно не подтверждено, чемпионат не настраивается.${t.invite && !t.invite.confirmed ? ` <button class="btn xs ghost" data-action="tenant-confirm" data-id="${t.id}">Демо: организатор вошёл</button>` : ''}</p>
        </section>
        <section class="card stack">
          <h3>Чемпионат</h3>
          <div class="grid-2">
            <div class="field"><label for="tn-name">Название</label><input id="tn-name" class="input" value="${esc(t.name)}" data-change="tenant-field" data-id="${t.id}" data-key="name"></div>
            <div class="field"><label for="tn-slug">Адрес</label><div class="row" style="gap:6px;flex-wrap:nowrap"><input id="tn-slug" class="input" value="${esc(t.slug)}" data-change="tenant-field" data-id="${t.id}" data-key="slug" style="min-width:0"><span class="small muted" style="white-space:nowrap">.apexchamp.beauty</span></div></div>
          </div>
        </section>
      </div>
      <aside class="side">
        <section class="card stack">
          <h3>Доступ</h3>
          <div class="field"><label for="tn-plan">Тариф</label><select id="tn-plan" class="input" data-change="tenant-field" data-id="${t.id}" data-key="plan">${PLANS.map((p) => `<option value="${p.id}" ${p.id === t.plan ? 'selected' : ''}>${p.name} — ${p.desc}</option>`).join('')}</select></div>
          <div class="field"><label for="tn-until">Действует до</label><input id="tn-until" class="input" value="${esc(t.until)}" data-change="tenant-field" data-id="${t.id}" data-key="until"></div>
          <div class="row-between small"><span class="muted">Статус</span>${statusChip(t)}</div>
          <p class="xs muted">После окончания срока кабинеты закрываются, публичная таблица результатов остаётся открытой.</p>
        </section>
        <section class="card stack"><h3>Удалить</h3><p class="small muted">${t.real ? 'Демо-чемпионат удалить нельзя: на нём держится вся демонстрация.' : 'Убирает чемпионат и доступ организатора. В настоящей системе данные уйдут в архив на 90 дней, письмо организатору уйдёт автоматически.'}</p>${t.real ? '' : `<button class="btn s danger" data-action="tenant-delete" data-id="${t.id}">Удалить чемпионат</button>`}</section>
      </aside>
    </div>`;
  return shell('owner', body);
}

export const changes = {
  'tenant-field': (el) => {
    const t = (st().tenants || []).find((x) => x.id === el.dataset.id);
    if (!t) return;
    const v = el.dataset.key === 'slug' ? slugify(el.value) : el.value.trim();
    if (!v) { toast('Поле не может быть пустым'); rerender(); return; }
    t[el.dataset.key] = v;
    save();
    toast('Сохранено');
    rerender();
  },
};

export const actions = {
  'tenant-invite': (el) => {
    const t = (st().tenants || []).find((x) => x.id === el.dataset.id);
    if (!t) return;
    t.invite = { confirmed: !!t.invite?.confirmed, sentAt: Date.now(), resent: (t.invite?.resent || 0) + 1 };
    save();
    toast(`Письмо отправлено: ${t.orgEmail}`);
    rerender();
  },
  'tenant-confirm': (el) => {
    const t = (st().tenants || []).find((x) => x.id === el.dataset.id);
    if (!t) return;
    t.invite = { ...(t.invite || {}), confirmed: true, confirmedAt: Date.now() };
    save();
    toast('Приглашение подтверждено');
    rerender();
  },
  'tenant-delete': (el) => {
    const s = st();
    const t = (s.tenants || []).find((x) => x.id === el.dataset.id);
    if (!t || t.real) return;
    s.tenants = s.tenants.filter((x) => x.id !== t.id);
    save();
    toast(`${t.name} удалён`);
    location.hash = '#/owner';
  },
  'tenant-status': (el) => {
    const t = (st().tenants || []).find((x) => x.id === el.dataset.id);
    if (!t) return;
    t.status = el.dataset.status;
    save();
    toast(`${t.name}: ${el.dataset.status === 'paused' ? 'доступ приостановлен' : 'доступ активен'}`);
    rerender();
  },
};

export const inputs = {
  'tenant-name': (el) => {
    const slug = document.getElementById('t-slug');
    if (slug && !slug.dataset.touched) slug.value = slugify(el.value);
  },
};

export const forms = {
  tenant: (form) => {
    const d = Object.fromEntries(new FormData(form).entries());
    const slug = slugify(d.slug || d.name);
    if (!d.name?.trim() || !slug) { toast('Нужны название и адрес'); return; }
    if (!d.orgName?.trim() || !d.orgEmail?.trim()) { toast('Нужны имя и почта организатора'); return; }
    const s = st();
    s.tenants = s.tenants || [];
    if (s.tenants.some((t) => t.slug === slug)) { toast('Такой адрес уже занят'); return; }
    if (s.ownerPreset === 'empty') s.ownerPreset = 'all';
    s.tenants.unshift({ added: true, id: 't' + Date.now().toString(36), name: d.name.trim(), slug, orgName: (d.orgName || '').trim(), orgEmail: (d.orgEmail || '').trim(), plan: d.plan || 'trial', until: (d.until || '').trim() || 'не задано', status: d.plan === 'trial' ? 'trial' : 'draft', note: 'Приглашение отправлено, чемпионат ещё не настроен', invite: { confirmed: false, sentAt: Date.now(), resent: 0 } });
    save();
    const nt = s.tenants[0];
    ui.bridge = { icon: 'ok', title: `Доступ для «${nt.name}» создан`, lead: `Приглашение отправлено на ${nt.orgEmail}. Организатор войдёт по ссылке и пройдёт мастер создания чемпионата.`,
      details: [`Адрес: ${nt.slug}.apexchamp.beauty`, 'Пока приглашение не подтверждено, чемпионат не настраивается', nt.status === 'draft' ? 'Доступ активируется после оплаты тарифа' : 'Пробный период уже идёт'], detailsTitle: 'Что дальше',
      actions: [{ label: 'Добавить ещё', action: 'bridge-close' }, { label: 'Открыть карточку', href: href('owner', 'tenant', nt.id), primary: true }] };
    rerender();
  },
};
