// Публичная страница результатов: без имён участников, кроме претендентов на Гран-при.
import { st, ui, nomOf, judgeById } from '../store.js';
import { result, placeOf, grandPrix } from '../scoring.js';
import { esc, pct, num, I, catName, placeChip, plural, CATEGORIES, rerender } from '../ui.js';
import { shell } from './common.js';

const catOrder = (c) => CATEGORIES.findIndex((x) => x.id === c);

function nomSection(nom, hidden) {
  const works = st().works
    .filter((w) => w.nom === nom.id)
    .map((w) => ({ w, r: result(w), pl: placeOf(w) }))
    .sort((a, b) => catOrder(a.w.cat) - catOrder(b.w.cat) || (b.r.pct ?? -1) - (a.r.pct ?? -1));
  const prizes = st().prizes.filter((p) => works.some((x) => x.w.code === p.code));
  return `
    <section class="card flat ${hidden ? 'hide' : ''}" data-block="${esc(nom.block)}" data-section>
      <div class="section-title">
        <h3>${esc(nom.name)} <span class="muted" style="font-weight:500">· ${works.length} ${plural(works.length, 'работа', 'работы', 'работ')}</span></h3>
        ${prizes.length ? `<span class="row small muted" style="gap:6px">${I.star.replace('<svg', '<svg width="16" height="16" style="color:var(--brand)"')}Спец-приз: ${prizes.map((p) => esc(p.code)).join(', ')}</span>` : '<span class="small muted">Места считаются внутри категории</span>'}
      </div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Работа</th><th>Категория</th><th>Средний балл</th><th>Место</th></tr></thead>
        <tbody>
          ${works.map(({ w, r, pl }) => `<tr data-code="${esc(w.code.toLowerCase())}"><td class="work">${esc(w.code)}</td><td><span class="chip">${catName(w.cat)}</span></td><td class="pct num">${pct(r.pct)}</td><td>${placeChip(pl.place, pl.manual)}</td></tr>`).join('')}
        </tbody>
      </table></div>
    </section>`;
}

function gpCard() {
  const rows = grandPrix();
  if (!rows.length) return '';
  const [first, ...rest] = rows;
  return `
    <section class="card dark stack">
      <div class="row-between"><h3 style="color:#fff">Гран-при</h3><span class="small muted">сумма ${st().settings.gpCount} работ</span></div>
      <div class="col" style="gap:6px;padding:16px;border-radius:14px;background:var(--brand)">
        <span class="xs" style="font-weight:800;letter-spacing:.6px;text-transform:uppercase">Гран-при</span>
        <span style="font-size:20px;font-weight:800">${esc(first.p.name)}</span>
        <span class="small">${first.works.map(esc).join(' · ')} → <b>${num(first.sum)}</b></span>
      </div>
      ${rest.map((r) => `<div class="row-between small"><span>${r.title === 'vice' ? '<b>Вице гран-при</b> · ' : ''}${esc(r.p.name)}</span><span class="muted">${num(r.sum)}</span></div>`).join('')}
    </section>`;
}

function prizesCard() {
  const s = st();
  if (!s.prizes.length) return '';
  return `
    <section class="card stack" style="gap:4px">
      <h3 class="mb-8">Спец-призы судей</h3>
      ${s.prizes.map((p) => {
        const w = s.works.find((x) => x.code === p.code);
        const j = judgeById(p.judgeId);
        return `<div class="row-between small" style="padding:10px 0;border-top:1px solid var(--line)"><span><b>${esc(p.code)}</b>${w ? ' · ' + esc(nomOf(w).name) : ''}</span><span class="muted">${j ? 'от ' + esc(j.short) : 'от организатора'}</span></div>`;
      }).join('')}
    </section>`;
}

function legend() {
  const s = st();
  const rule = s.settings.placeRule;
  const th = s.settings.thresholds;
  const text = rule === 'thresholds'
    ? 'Место даётся, если средний балл не ниже порога категории. Место может остаться пустым.'
    : rule === 'ranking'
      ? `Три лучших работы в каждой категории номинации получают места, если набрали не меньше ${num(s.settings.rankMin)} %.`
      : 'Места назначает оргкомитет.';
  return `
    <section class="card stack" style="gap:12px">
      <h3>Как считаются места</h3>
      <p class="small muted">Средний балл — сумма баллов всех судей, делённая на максимум. ${text}</p>
      ${rule === 'thresholds' ? `<div style="display:grid;grid-template-columns:1.3fr repeat(3,1fr);gap:6px" class="small">
        <span></span><b class="muted">1</b><b class="muted">2</b><b class="muted">3</b>
        ${CATEGORIES.map((c) => `<b>${c.name}</b>${(th[c.id] || []).map((x) => `<span>${num(x)} %</span>`).join('')}`).join('')}
      </div>` : ''}
    </section>`;
}

export function render() {
  const s = st();
  const role = s.session?.role;
  const pub = s.championship.stage === 'published';
  const champHead = `
    <section class="card row-between" style="padding:20px 24px">
      <div class="row" style="gap:16px">
        <span style="width:56px;height:56px;border-radius:16px;background:var(--brand);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:18px">${esc(s.championship.short)}</span>
        <div class="col" style="gap:2px"><h2>${esc(s.championship.name)}</h2><span class="small muted">${pub ? `Результаты объявлены ${esc(s.championship.announce)}` : `Оглашение ${esc(s.championship.announce)}`}</span></div>
      </div>
      ${pub || role === 'org' ? `<label class="row" style="gap:0;position:relative"><span class="hide">Поиск по номеру работы</span><input class="input" style="width:300px;max-width:100%;padding-left:42px" type="search" placeholder="Номер работы, например ВК-303" data-input="results-search" aria-label="Поиск по номеру работы"><span style="position:absolute;left:14px;top:15px;color:var(--muted)">${I.search}</span></label>` : ''}
    </section>`;

  if (!pub && role !== 'org') {
    return shell('results', `${champHead}
      <section class="card peach stack" style="align-items:flex-start;padding:40px">
        ${I.trophy.replace('<svg', '<svg width="40" height="40" style="color:var(--brand)"')}
        <h2>Итоги пока не опубликованы</h2>
        <p class="muted">Судьи оценивают работы до ${esc(s.championship.deadline)}. Таблица с процентами и местами появится ${esc(s.championship.announce)}.</p>
      </section>`);
  }

  const blocks = [...s.blocks, { id: 'gp', name: 'Гран-при и спец-призы' }];
  if (!ui.resultsBlock) ui.resultsBlock = s.blocks[0].id;
  const active = ui.resultsBlock;
  const sections = s.nominations.map((n) => nomSection(n, n.block !== active)).join('');
  const gpRows = grandPrix();
  const gpTable = active === 'gp' ? `
    <section class="card flat">
      <div class="section-title"><h3>Зачёт Гран-при</h3><span class="small muted">претенденты заявляют ${s.settings.gpCount} работы</span></div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Место</th><th>Участник</th><th>Работы</th><th>Итого</th></tr></thead>
        <tbody>${gpRows.map((r, i) => `<tr><td>${r.title === 'gp' ? '<span class="place gp">Гран-при</span>' : r.title === 'vice' ? '<span class="place p1">Вице гран-при</span>' : `<span class="place p0">${i + 1}</span>`}</td><td class="b">${esc(r.p.name)}</td><td class="small">${r.works.map((c, k) => `${esc(c)} <span class="muted">${pct(r.pcts[k])}</span>`).join('<br>')}</td><td class="pct num">${num(r.sum)}</td></tr>`).join('')}</tbody>
      </table></div>
    </section>
    ${prizesCard()}` : '';

  const body = `
    ${!pub ? `<section class="card lemon row-between"><span class="row" style="gap:10px">${I.eye.replace('<svg', '<svg width="20" height="20"')}<b>Предпросмотр.</b> Участники и гости пока не видят эту таблицу.</span><button class="btn s primary" data-action="set-stage" data-stage="published">Опубликовать итоги</button></section>` : ''}
    ${champHead}
    <div class="tabs">${blocks.map((b) => `<button class="tab ${active === b.id ? 'active' : ''}" data-action="results-block" data-block="${b.id}">${esc(b.name)}</button>`).join('')}</div>
    <div class="two-col">
      <div class="main stack" id="results-main">
        ${active === 'gp' ? gpTable : ''}
        ${sections}
        <div class="empty hide" id="results-empty">Работа с таким номером не найдена.</div>
      </div>
      <aside class="side">
        ${active !== 'gp' ? gpCard() : ''}
        ${active !== 'gp' ? prizesCard() : ''}
        ${legend()}
      </aside>
    </div>
    <footer class="row-between small muted">
      <span>Имена участников в таблицах не публикуются. Свои оценки и комментарии судей смотрите в кабинете.</span>
      <span>Работает на платформе <b class="wordmark" style="font-size:15px">apex<span>champ</span></b></span>
    </footer>`;
  return shell('results', body);
}

export const actions = {
  'results-block': (el) => { ui.resultsBlock = el.dataset.block; rerender(); },
};

export const inputs = {
  'results-search': (el) => {
    const q = el.value.trim().toLowerCase();
    let any = false;
    document.querySelectorAll('[data-section]').forEach((sec) => {
      let visible = 0;
      sec.querySelectorAll('tr[data-code]').forEach((tr) => {
        const ok = !q || tr.dataset.code.includes(q);
        tr.classList.toggle('hide', !ok);
        if (ok) visible++;
      });
      const inBlock = sec.dataset.block === ui.resultsBlock;
      const show = q ? visible > 0 : inBlock;
      sec.classList.toggle('hide', !show);
      if (show) any = true;
    });
    const empty = document.getElementById('results-empty');
    if (empty) empty.classList.toggle('hide', any || !q);
  },
};
