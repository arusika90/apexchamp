// Консоль владельца платформы: чемпионаты, организаторы, доступы.
// Сейчас по-настоящему работает один чемпионат (демо-данные), остальные строки — пример того,
// как будет выглядеть список при нескольких арендаторах.
import { st, save } from '../store.js';
import { esc, I, toast, rerender, plural } from '../ui.js';
import { shell } from './common.js';

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
    <tr>
      <td><b>${esc(t.name)}</b><div class="xs muted">${t.real ? `${s.works.length} ${plural(s.works.length, 'работа', 'работы', 'работ')} · ${s.nominations.length} номинаций` : esc(t.note || '')}</div></td>
      <td class="small"><a href="https://${esc(t.slug)}.apexchamp.beauty" onclick="return false">${esc(t.slug)}.apexchamp.beauty</a></td>
      <td class="small">${esc(t.orgName)}<div class="xs muted">${esc(t.orgEmail)}</div></td>
      <td class="small">${planName(t.plan)}<div class="xs muted">до ${esc(t.until)}</div></td>
      <td>${statusChip(t)}</td>
      <td><div class="row" style="gap:6px;flex-wrap:nowrap">
        ${t.real ? '<button class="btn xs" data-action="impersonate" data-role="org" data-id="">Войти как организатор</button>' : ''}
        ${t.status === 'paused' ? `<button class="btn xs" data-action="tenant-status" data-id="${t.id}" data-status="active">Возобновить</button>` : t.status === 'active' || t.status === 'trial' ? `<button class="btn xs ghost" data-action="tenant-status" data-id="${t.id}" data-status="paused">Приостановить</button>` : `<button class="btn xs" data-action="tenant-status" data-id="${t.id}" data-status="active">Активировать</button>`}
      </div></td>
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
          <div class="table-wrap"><table class="table">
            <thead><tr><th>Чемпионат</th><th>Адрес</th><th>Организатор</th><th>Тариф</th><th>Статус</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table></div>
        </section>
      </div>
      <aside class="side">
        <form class="card stack" data-form="tenant" style="gap:12px">
          <h3>Добавить организатора</h3>
          <p class="xs muted">Организатор получит письмо со ссылкой, войдёт и настроит свой чемпионат: номинации, критерии, судей.</p>
          <div class="field"><label for="t-champ">Название чемпионата</label><input id="t-champ" name="name" class="input s" required placeholder="Мисс Мышь 2027" data-input="tenant-name"></div>
          <div class="field"><label for="t-slug">Адрес</label><div class="row" style="gap:6px;flex-wrap:nowrap"><input id="t-slug" name="slug" class="input s" required placeholder="miss-mysh-2027" style="min-width:0"><span class="small muted" style="white-space:nowrap">.apexchamp.beauty</span></div></div>
          <div class="field"><label for="t-org">Организатор</label><input id="t-org" name="orgName" class="input s" required placeholder="Имя и фамилия"></div>
          <div class="field"><label for="t-email">Почта организатора</label><input id="t-email" name="orgEmail" class="input s" type="email" required placeholder="org@example.com"></div>
          <div class="field"><label for="t-plan">Тариф</label><select id="t-plan" name="plan" class="input s">${PLANS.map((p) => `<option value="${p.id}">${p.name} — ${p.desc}</option>`).join('')}</select></div>
          <div class="field"><label for="t-until">Доступ до</label><input id="t-until" name="until" class="input s" placeholder="31 декабря 2027"></div>
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

export const actions = {
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
    const s = st();
    s.tenants = s.tenants || [];
    if (s.tenants.some((t) => t.slug === slug)) { toast('Такой адрес уже занят'); return; }
    if (s.ownerPreset === 'empty') s.ownerPreset = 'all';
    s.tenants.unshift({ added: true, id: 't' + Date.now().toString(36), name: d.name.trim(), slug, orgName: (d.orgName || '').trim(), orgEmail: (d.orgEmail || '').trim(), plan: d.plan || 'trial', until: (d.until || '').trim() || 'не задано', status: d.plan === 'trial' ? 'trial' : 'draft', note: 'Приглашение отправлено, чемпионат ещё не настроен' });
    save();
    toast(`Доступ создан: ${slug}.apexchamp.beauty`);
    rerender();
  },
};
