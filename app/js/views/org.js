// Кабинет организатора: видит и правит всё.
import { st, ui, save, nomById, workByCode, judgeById, partById, nomOf, worksOfNom, blockName, sheetOf } from '../store.js';
import { result, placeOf, maxOf, sheetTotal, filledCount, groupsOf, judgeStats, progress, placeSummary, grandPrix } from '../scoring.js';
import { esc, pct, num, parseNum, I, href, toast, catName, bar, placeChip, plural, rerender, dateTime, CATEGORIES } from '../ui.js';
import { shell, stageChip } from './common.js';

const pubBtn = () => (st().championship.stage === 'published'
  ? '<button class="btn" data-action="set-stage" data-stage="judging">Снять итоги с публикации</button>'
  : '<button class="btn primary" data-action="set-stage" data-stage="published">Опубликовать итоги</button>');

// ---------- Обзор ----------
export function dashboard() {
  const s = st();
  const c = s.championship;
  const pub = c.stage === 'published';
  const pr = progress();
  const jst = s.judges.map((j) => ({ j, ...judgeStats(j.id) })).filter((x) => x.assigned > 0);
  const unfinished = jst.filter((x) => x.left > 0);
  const recusals = s.works.flatMap((w) => Object.entries(s.sheets[w.code] || {}).filter(([, sh]) => sh.status === 'recused').map(([jid]) => ({ w, j: judgeById(jid) })));
  const spread = s.works.map((w) => ({ w, r: result(w) })).filter((x) => x.r.sent >= 2 && x.r.spread > 0.25);
  const countries = new Set(s.participants.map((p) => p.country).filter(Boolean)).size;
  const step = (label, text, cls) => `<div class="step ${cls}"><div class="line"></div><div class="label">${label}</div><div class="small muted">${text}</div></div>`;

  const nomRows = s.nominations.map((n) => {
    const p = progress(n.id);
    const works = worksOfNom(n.id).length;
    const notStarted = n.judgeIds.filter((jid) => worksOfNom(n.id).every((w) => !sheetOf(w.code, jid))).length;
    const status = p.frac >= 1
      ? `<span class="chip ok">${I.check.replace('<svg', '<svg width="14" height="14"')}Готово</span>`
      : notStarted
        ? `<span class="chip warn">${notStarted} ${plural(notStarted, 'судья не начал', 'судьи не начали', 'судей не начали')}</span>`
        : `<span class="small muted">${Math.round(p.frac * 100)} %</span>`;
    return `<tr>
      <td><a class="b" style="color:var(--ink)" href="${href('org', 'nomination', n.id)}">${esc(n.name)}</a> <span class="muted small">· ${esc(n.prefix)}</span></td>
      <td class="num">${works}</td><td class="num">${n.judgeIds.length}</td>
      <td style="min-width:140px">${bar(p.frac, p.frac >= 1 ? 'ok' : 'warn')}</td><td>${status}</td></tr>`;
  }).join('');

  const body = `
    <div class="page-head">
      <div class="col" style="gap:10px">
        <h1>${esc(c.name)}</h1>
        <div class="row">${stageChip()}<span class="small muted">${pub ? `оглашение ${esc(c.announce)}` : `до ${esc(c.deadline)}`}</span></div>
      </div>
      <div class="row"><a class="btn" href="#/org/places">${I.trophy}<span>Места и Гран-при</span></a>${c.stage === 'submission' ? '<button class="btn primary" data-action="set-stage" data-stage="judging">Закрыть приём и открыть судейство</button>' : pubBtn()}</div>
    </div>

    <section class="card stage">
      ${step('Приём работ', c.stage === 'submission' ? `Идёт до ${esc(c.submitUntil)} · ${s.works.filter((w) => (w.status || 'submitted') === 'submitted').length} подано` : `Закрыт ${esc(c.acceptClosed)} · ${s.works.length} работ`, c.stage === 'submission' ? 'now' : 'done')}
      ${step('Судейство', pub ? 'Завершено' : c.stage === 'submission' ? 'После закрытия приёма' : `Идёт · отправлено ${Math.round(pr.frac * 100)} %`, pub ? 'done' : c.stage === 'judging' ? 'now' : '')}
      ${step('Проверка', 'Разброс оценок, места, Гран-при', pub ? 'done' : c.stage === 'judging' && pr.frac >= 1 ? 'now' : '')}
      ${step('Оглашение', pub ? 'Итоги опубликованы' : esc(c.announce), pub ? 'done' : '')}
    </section>

    <div class="grid-4">
      <section class="card kpi"><span class="label">Работ</span><span class="value">${s.works.length}</span><span class="small muted">в ${s.nominations.length} номинациях</span></section>
      <section class="card kpi"><span class="label">Оценки отправлены</span><span class="value">${Math.round(pr.frac * 100)} %</span><div class="mt-8">${bar(pr.frac, 'ok')}</div></section>
      <section class="card kpi"><span class="label">Судей</span><span class="value">${jst.length}</span><span class="small" style="color:${unfinished.length ? 'var(--brand-ink)' : 'var(--ok)'};font-weight:700">${unfinished.length ? `${unfinished.length} ещё не ${plural(unfinished.length, 'закончил', 'закончили', 'закончили')}` : 'все закончили'}</span></section>
      <section class="card kpi"><span class="label">Участников</span><span class="value">${s.participants.length}</span><span class="small muted">из ${countries} ${plural(countries, 'страны', 'стран', 'стран')}</span></section>
    </div>

    <div class="two-col">
      <section class="main card flat">
        <div class="section-title"><h3>Номинации</h3><a class="small b" href="#/org/nominations">Настроить критерии</a></div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Номинация</th><th>Работ</th><th>Судей</th><th>Оценено</th><th>Статус</th></tr></thead>
          <tbody>${nomRows}</tbody>
        </table></div>
      </section>
      <aside class="side">
        <section class="card stack" style="gap:12px">
          <h3>Требует внимания</h3>
          ${unfinished.length ? `<div class="attention">
            <b>${unfinished.length} ${plural(unfinished.length, 'судья не закончил', 'судьи не закончили', 'судей не закончили')}</b>
            <span class="small muted">${unfinished.map((x) => `${esc(x.j.short)} — ${x.left}`).join(', ')}</span>
            <button class="btn xs" style="align-self:flex-start;background:#fff" data-action="remind" data-who="all">Напомнить всем</button>
          </div>` : ''}
          ${spread.map(({ w, r }) => `<a class="attention" style="color:var(--ink)" href="${href('org', 'work', w.code)}">
            <b>Работа ${esc(w.code)}: большой разброс оценок</b>
            <span class="small muted">от ${num(Math.min(...r.totals))} до ${num(Math.max(...r.totals))} из ${r.max}. Посмотрите ведомости.</span>
          </a>`).join('')}
          ${recusals.map(({ w, j }) => `<a class="attention" style="color:var(--ink)" href="${href('org', 'work', w.code)}"><b>Отвод: ${esc(j?.short || '')}</b><span class="small muted">работа ${esc(w.code)} · нужен другой судья или оценка без него</span></a>`).join('')}
          ${!unfinished.length && !spread.length && !recusals.length ? '<p class="small muted">Всё в порядке.</p>' : ''}
        </section>
        <section class="card stack" style="gap:10px">
          <h3>Быстрые действия</h3>
          <a class="list-item" href="#/org/judges"><b>Судьи и прогресс</b><span class="muted">${I.right}</span></a>
          <a class="list-item" href="#/org/participants"><b>Участники с именами</b><span class="muted">${I.right}</span></a>
          <a class="list-item" href="#/results"><b>Предпросмотр результатов</b><span class="muted">${I.right}</span></a>
        </section>
      </aside>
    </div>`;
  return shell('org', body);
}

// ---------- Номинации ----------
export function nominations() {
  const s = st();
  const body = `
    <div class="page-head">
      <div class="col" style="gap:8px"><h1>Номинации</h1><p class="muted">Критерии, максимумы баллов, судьи и ракурсы фото — отдельно для каждой номинации.</p></div>
    </div>
    ${s.blocks.map((b) => `
      <section class="stack">
        <h3>${esc(b.name)}</h3>
        <div class="grid-4">
          ${s.nominations.filter((n) => n.block === b.id).map((n) => {
            const p = progress(n.id);
            return `<a class="card stack" style="gap:10px;color:var(--ink)" href="${href('org', 'nomination', n.id)}">
              <div class="row-between"><b style="font-size:17px">${esc(n.name)}</b><span class="chip">${esc(n.prefix)}</span></div>
              <span class="small muted">${worksOfNom(n.id).length} ${plural(worksOfNom(n.id).length, 'работа', 'работы', 'работ')} · ${n.judgeIds.length} ${plural(n.judgeIds.length, 'судья', 'судьи', 'судей')} · ${n.criteria.length} ${plural(n.criteria.length, 'критерий', 'критерия', 'критериев')} · макс ${maxOf(n)}</span>
              ${bar(p.frac, p.frac >= 1 ? 'ok' : 'warn')}
              ${n.confirmed ? '<span class="chip ok" style="align-self:flex-start">форма из прошлого чемпионата</span>' : '<span class="chip peach" style="align-self:flex-start">шаблон · ждём форму эксперта</span>'}
            </a>`;
          }).join('')}
        </div>
      </section>`).join('')}`;
  return shell('org/nominations', body);
}

export function nomination(id) {
  const s = st();
  const n = nomById(id);
  if (!n) return shell('org/nominations', '<div class="empty">Номинация не найдена.</div>');
  const tab = ui.orgNomTab;
  const works = worksOfNom(id);
  const max = maxOf(n);

  const worksTab = `
    <section class="card flat">
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Работа</th><th>Участник</th><th>Категория</th><th>Судьи</th><th>Средний балл</th><th>Место</th></tr></thead>
        <tbody>${works.map((w) => {
          const r = result(w);
          const pl = placeOf(w);
          const p = partById(w.pid);
          return `<tr>
            <td class="work"><a style="color:var(--ink)" href="${href('org', 'work', w.code)}">${esc(w.code)}</a></td>
            <td><b>${esc(p.name)}</b><div class="xs muted">${esc(p.insta)} · ${esc(p.country)}</div></td>
            <td><span class="chip">${catName(w.cat)}</span></td>
            <td class="num">${r.sent} из ${r.of}</td>
            <td class="pct num">${pct(r.pct)}</td>
            <td>${placeChip(pl.place, pl.manual)}</td></tr>`;
        }).join('')}</tbody>
      </table></div>
    </section>`;

  const groupsList = [...new Set(n.criteria.map((c) => c.group))];
  const critRows = n.criteria.map((c, i) => `
    <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr) minmax(0,2fr) 90px 40px;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;background:var(--fill)">
      <input class="input s" style="background:#fff" value="${esc(c.group)}" list="groups-${esc(id)}" data-change="crit-field" data-nom="${esc(id)}" data-i="${i}" data-field="group" aria-label="Группа">
      <input class="input s b" style="background:#fff" value="${esc(c.name)}" data-change="crit-field" data-nom="${esc(id)}" data-i="${i}" data-field="name" aria-label="Название критерия">
      <input class="input s" style="background:#fff" value="${esc(c.hint)}" data-change="crit-field" data-nom="${esc(id)}" data-i="${i}" data-field="hint" aria-label="Подсказка судье">
      <input class="input s num" style="background:#fff;width:100%" inputmode="decimal" value="${num(c.max)}" data-change="crit-field" data-nom="${esc(id)}" data-i="${i}" data-field="max" aria-label="Максимум баллов">
      <button class="btn icon ghost" data-action="del-crit" data-nom="${esc(id)}" data-i="${i}" aria-label="Удалить критерий">${I.trash}</button>
    </div>`).join('');

  const setupTab = `
    <div class="two-col">
      <div class="main stack">
        <section class="card stack">
          <div class="grid-3">
            <div class="field"><label for="n-name">Название</label><input id="n-name" class="input" value="${esc(n.name)}" data-change="nom-field" data-nom="${esc(id)}" data-field="name"></div>
            <div class="field"><label for="n-prefix">Номера работ</label><input id="n-prefix" class="input" value="${esc(n.prefix)}" data-change="nom-field" data-nom="${esc(id)}" data-field="prefix"></div>
            <div class="field"><label for="n-block">Блок</label><select id="n-block" class="input" data-change="nom-field" data-nom="${esc(id)}" data-field="block">${s.blocks.map((b) => `<option value="${b.id}" ${b.id === n.block ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></div>
          </div>
        </section>
        <section class="card stack">
          <div class="row-between"><h3>Критерии оценки</h3><span class="small muted">Группа · критерий · подсказка судье · максимум</span></div>
          <datalist id="groups-${esc(id)}">${groupsList.map((g) => `<option value="${esc(g)}">`).join('')}</datalist>
          ${critRows}
          <button class="btn s" style="align-self:flex-start;border:1px dashed var(--line-2);background:transparent" data-action="add-crit" data-nom="${esc(id)}">${I.plus}<span>Добавить критерий</span></button>
          <div style="display:grid;grid-template-columns:minmax(0,1fr) 90px;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;background:var(--danger-bg)">
            <div><b class="small">Штрафные баллы, до</b><div class="xs muted">${esc(n.penaltyHint)}</div></div>
            <input class="input s num" style="background:#fff;width:100%" value="${n.penaltyMax}" data-change="nom-field" data-nom="${esc(id)}" data-field="penaltyMax" aria-label="Максимальный штраф">
          </div>
          <div class="row-between" style="padding:16px 18px;border-radius:14px;background:${max === 100 ? 'var(--ok-bg)' : 'var(--info-bg)'}">
            <div class="col" style="gap:2px">
              <b style="color:${max === 100 ? 'var(--ok)' : 'var(--info)'}">Максимум на судью: ${num(max)} ${plural(max, 'балл', 'балла', 'баллов')}</b>
              <span class="small">Процент работы = сумма баллов всех судей ÷ (число судей × ${num(max)})</span>
            </div>
            ${max === 100 ? '' : '<span class="small">Можно и не 100 — процент всё равно считается верно</span>'}
          </div>
        </section>
      </div>
      <aside class="side">
        <section class="card stack" style="gap:12px">
          <h3>Судьи номинации</h3>
          <p class="small muted">Каждый отмеченный судья оценивает все работы номинации.</p>
          <div class="col" style="gap:8px">
            ${s.judges.map((j) => `<label class="check small"><input type="checkbox" ${n.judgeIds.includes(j.id) ? 'checked' : ''} data-change="nom-judge" data-nom="${esc(id)}" data-judge="${j.id}">${esc(j.name)}</label>`).join('')}
          </div>
        </section>
        <section class="card stack" style="gap:12px">
          <h3>Что сдаёт участник</h3>
          <div class="field"><label for="n-photos">Ракурсы фото через запятую</label><textarea id="n-photos" class="input" style="min-height:90px" data-change="nom-field" data-nom="${esc(id)}" data-field="photos">${esc(n.photos.join(', '))}</textarea></div>
          <p class="xs muted">Судья видит этот список как чек-лист. Нет ракурса — 0 по критерию.</p>
        </section>
      </aside>
    </div>`;

  const body = `
    <div class="crumbs"><a href="#/org/nominations">Номинации</a><span>›</span><span>${esc(blockName(n.block))}</span></div>
    <div class="page-head">
      <div class="col" style="gap:8px"><h1>${esc(n.name)}</h1><span class="small muted">${works.length} ${plural(works.length, 'работа', 'работы', 'работ')} · ${n.judgeIds.length} ${plural(n.judgeIds.length, 'судья', 'судьи', 'судей')} · максимум ${num(max)} на судью</span></div>
      ${n.confirmed ? '<span class="chip ok">форма из прошлого чемпионата</span>' : '<span class="chip peach">шаблон · ждём форму эксперта</span>'}
    </div>
    <div class="tabs">
      <button class="tab ${tab === 'works' ? 'active' : ''}" data-action="org-nom-tab" data-tab="works">Работы <span class="count">${works.length}</span></button>
      <button class="tab ${tab === 'setup' ? 'active' : ''}" data-action="org-nom-tab" data-tab="setup">Критерии и судьи</button>
    </div>
    ${tab === 'works' ? worksTab : setupTab}`;
  return shell('org/nominations', body);
}

// ---------- Судьи ----------
export function judges() {
  const s = st();
  const rows = s.judges.map((j) => {
    const x = judgeStats(j.id);
    const noms = s.nominations.filter((n) => n.judgeIds.includes(j.id));
    const total = x.assigned - x.recused;
    return `<tr>
      <td><div class="row" style="gap:10px"><span class="avatar" aria-hidden="true">${esc(j.initials)}</span><div><b>${esc(j.name)}</b><div class="xs muted">${esc(j.country)}</div></div></div></td>
      <td class="small">${noms.map((n) => esc(n.name)).join(', ') || '—'}</td>
      <td class="num">${x.sent} из ${total}${x.draft ? ` <span class="xs" style="color:var(--warn)">· ${x.draft} в черновике</span>` : ''}${x.recused ? ` <span class="xs muted">· ${x.recused} отвод</span>` : ''}</td>
      <td style="min-width:120px">${bar(total ? x.sent / total : 0, x.left ? 'warn' : 'ok')}</td>
      <td><div class="row" style="gap:6px;flex-wrap:nowrap">${x.left ? `<button class="btn xs" data-action="remind" data-who="${esc(j.short)}">Напомнить</button>` : '<span class="chip ok">готово</span>'}<button class="btn xs ghost" data-action="impersonate" data-role="judge" data-id="${j.id}">Войти как</button></div></td>
    </tr>`;
  }).join('');
  const body = `
    <div class="page-head">
      <div class="col" style="gap:8px"><h1>Судьи</h1><p class="muted">Кто сколько оценил. «Войти как» открывает кабинет судьи, вернуться можно кнопкой в шапке.</p></div>
      <button class="btn" data-action="remind" data-who="all">${I.bell}<span>Напомнить всем, кто не закончил</span></button>
    </div>
    <section class="card flat"><div class="table-wrap"><table class="table">
      <thead><tr><th>Судья</th><th>Номинации</th><th>Отправлено</th><th>Прогресс</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div></section>`;
  return shell('org/judges', body);
}

// ---------- Участники ----------
export function participants() {
  const s = st();
  const rows = s.participants.map((p) => {
    const works = s.works.filter((w) => w.pid === p.id);
    const cats = [...new Set(works.map((w) => w.cat))];
    return `<tr>
      <td><b>${esc(p.name)}</b><div class="xs muted">${esc(p.insta)}</div></td>
      <td class="small">${esc(p.country)}</td>
      <td class="small">${works.map((w) => `<a href="${href('org', 'work', w.code)}">${esc(w.code)}</a>${(w.status || 'submitted') === 'draft' ? ' <span class="xs muted">черновик</span>' : ''}`).join(', ') || '<span class="muted">—</span>'}</td>
      <td>${cats.map((c) => `<span class="chip">${catName(c)}</span>`).join(' ') || (p.cat ? `<span class="chip">${catName(p.cat)}</span>` : '')}</td>
      <td>${p.free ? '<span class="chip peach">бесплатно</span>' : p.paid ? '<span class="chip ok">оплачено</span>' : `<button class="btn xs" data-action="mark-paid" data-id="${p.id}">Отметить оплату</button>`}</td>
      <td class="small">${(p.gpWorks || []).length ? p.gpWorks.map(esc).join(' · ') : '<span class="muted">—</span>'}</td>
      <td><button class="btn xs ghost" data-action="impersonate" data-role="part" data-id="${p.id}">Войти как</button></td>
    </tr>`;
  }).join('');
  const body = `
    <div class="page-head">
      <div class="col" style="gap:8px"><h1>Участники</h1><p class="muted">Имена, инстаграм и страна видит только организатор. Судьи и публика видят номера работ.</p></div>
      <button class="btn" data-action="demo-only">${I.plus}<span>Импорт из Excel</span></button>
    </div>
    <section class="card flat"><div class="table-wrap"><table class="table">
      <thead><tr><th>Участник</th><th>Страна</th><th>Работы</th><th>Категория</th><th>Оплата</th><th>Гран-при</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div></section>`;
  return shell('org/participants', body);
}

// ---------- Работа: все ведомости, правка оценок ----------
export function work(code) {
  const s = st();
  const w = workByCode(code);
  if (!w) return shell('org', '<div class="empty">Работа не найдена.</div>');
  const n = nomOf(w);
  const p = partById(w.pid);
  const r = result(w);
  const pl = placeOf(w);
  const sheets = s.sheets[code] || {};
  const cols = n.judgeIds.map((jid) => ({ j: judgeById(jid), sh: sheets[jid] || null }));
  const audit = s.audit.filter((a) => a.code === code);
  const locked = s.championship.stage === 'published';

  const cell = (jid, sh, critId, val, max) => (sh && sh.status !== 'recused'
    ? `<input class="input s num" style="width:64px;height:36px;font-size:15px" inputmode="decimal" value="${val == null ? '' : num(val)}" data-change="org-score" data-code="${esc(code)}" data-judge="${jid}" data-crit="${esc(critId)}" aria-label="Оценка" ${locked ? 'disabled' : ''}>`
    : '<span class="muted">—</span>');

  const groupRows = groupsOf(n).map((g) => `
    <tr><td colspan="${cols.length + 2}" style="background:var(--bg);padding:8px 24px"><span class="group-title">${esc(g.name)}</span></td></tr>
    ${g.items.map((c) => `<tr><td><b class="small">${esc(c.name)}</b></td><td class="small muted num">${num(c.max)}</td>${cols.map(({ j, sh }) => `<td>${cell(j.id, sh, c.id, sh?.v[c.id], c.max)}</td>`).join('')}</tr>`).join('')}`).join('');

  const statusChip = (sh) => {
    if (!sh) return '<span class="chip">не начал</span>';
    if (sh.status === 'sent') return '<span class="chip ok">отправил</span>';
    if (sh.status === 'recused') return '<span class="chip">отвод</span>';
    return '<span class="chip warn">черновик</span>';
  };

  const body = `
    <div class="crumbs"><a href="#/org/nominations">Номинации</a><span>›</span><a href="${href('org', 'nomination', n.id)}">${esc(n.name)}</a><span>›</span><span>${esc(code)}</span></div>
    <div class="page-head">
      <div class="col" style="gap:8px">
        <h1>Работа ${esc(code)}</h1>
        <div class="row small"><span class="chip">${esc(n.name)}</span><span class="chip">${catName(w.cat)}</span><b>${esc(p.name)}</b><span class="muted">${esc(p.insta)} · ${esc(p.country)}</span></div>
      </div>
    </div>
    <div class="grid-4">
      <section class="card kpi"><span class="label">Средний балл</span><span class="value">${pct(r.pct)}</span><span class="small muted">${r.sent} из ${r.of} ${plural(r.of, 'судьи', 'судей', 'судей')} отправили</span></section>
      <section class="card kpi"><span class="label">Место</span><div class="mt-8">${placeChip(pl.place, pl.manual)}</div></section>
      <section class="card kpi"><span class="label">Разброс оценок</span><span class="value" style="color:${r.spread > 0.25 ? 'var(--danger)' : 'var(--ink)'}">${r.sent >= 2 ? `${num(Math.min(...r.totals))}–${num(Math.max(...r.totals))}` : '—'}</span><span class="small muted">из ${num(r.max)} баллов</span></section>
      <section class="card stack" style="gap:8px">
        <label class="label" for="override">Назначить место вручную</label>
        <select id="override" class="input s" data-change="override" data-code="${esc(code)}">
          <option value="" ${!pl.manual ? 'selected' : ''}>Автоматически по правилу</option>
          ${[1, 2, 3].map((x) => `<option value="${x}" ${pl.manual && pl.place === x ? 'selected' : ''}>${x} место</option>`).join('')}
          <option value="0" ${pl.manual && pl.place === 0 ? 'selected' : ''}>Без места</option>
        </select>
        <span class="xs muted">В таблице будет пометка «решение оргкомитета»</span>
      </section>
    </div>
    <section class="card flat">
      <div class="section-title"><h3>Ведомости судей</h3><span class="small muted">${locked ? 'Итоги опубликованы — правка закрыта' : 'Организатор может исправить любую оценку. Судья увидит отметку об изменении.'}</span></div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Критерий</th><th>Макс</th>${cols.map(({ j }) => `<th style="text-transform:none;letter-spacing:0">${esc(j.short)}</th>`).join('')}</tr></thead>
        <tbody>
          ${groupRows}
          <tr><td><b class="small" style="color:var(--danger)">Штраф</b></td><td class="small muted">−${n.penaltyMax}</td>${cols.map(({ j, sh }) => `<td>${cell(j.id, sh, 'pen', sh?.pen ?? 0)}</td>`).join('')}</tr>
          <tr><td><b>Итого</b></td><td class="small muted num">${num(r.max)}</td>${cols.map(({ sh }) => `<td class="b num">${sh && sh.status !== 'recused' ? num(sheetTotal(sh, n)) : '—'}</td>`).join('')}</tr>
          <tr><td class="small muted">Статус</td><td></td>${cols.map(({ sh }) => `<td>${statusChip(sh)}${sh && sh.status === 'draft' ? `<div class="xs muted">${filledCount(sh, n)} из ${n.criteria.length}</div>` : ''}</td>`).join('')}</tr>
        </tbody>
      </table></div>
    </section>
    <div class="grid-2">
      <section class="card stack" style="gap:10px">
        <h3>Комментарии судей</h3>
        ${cols.filter(({ sh }) => sh && (sh.comment || '').trim()).map(({ j, sh }) => `<div class="col" style="gap:4px;padding:12px 14px;border-radius:14px;background:var(--fill)"><span class="xs b muted">${esc(j.name)} · участник видит «Судья ${n.judgeIds.indexOf(j.id) + 1}»</span><span class="small">${esc(sh.comment)}</span></div>`).join('') || '<p class="small muted">Пока нет комментариев.</p>'}
      </section>
      <section class="card stack" style="gap:10px">
        <h3>История изменений</h3>
        ${audit.length ? audit.slice().reverse().map((a) => `<div class="small" style="padding:8px 0;border-top:1px solid var(--line)"><b>${esc(judgeById(a.judgeId)?.short || '')}</b> · ${esc(a.critName)}: ${num(a.from)} → ${num(a.to)} <span class="muted">· ${dateTime(a.at)}</span></div>`).join('') : '<p class="small muted">Организатор оценки не менял.</p>'}
      </section>
    </div>`;
  return shell('org/nominations', body);
}

// ---------- Места, Гран-при, спец-призы ----------
export function places() {
  const s = st();
  const set = s.settings;
  const sum = placeSummary();
  const gp = grandPrix();
  const rule = (id, title, text) => `
    <button class="card stack" style="gap:6px;text-align:left;cursor:pointer;border:2px solid ${set.placeRule === id ? 'var(--brand)' : 'transparent'}" data-action="set-rule" data-rule="${id}" aria-pressed="${set.placeRule === id}">
      <div class="row-between"><b style="font-size:17px">${title}</b>${set.placeRule === id ? `<span class="chip peach">${I.check.replace('<svg', '<svg width="14" height="14"')}выбрано</span>` : ''}</div>
      <span class="small muted">${text}</span>
    </button>`;

  const thTable = `
    <div style="display:grid;grid-template-columns:minmax(0,1.2fr) repeat(3,minmax(0,1fr));gap:10px;align-items:center">
      <span></span><span class="label">1 место от</span><span class="label">2 место от</span><span class="label">3 место от</span>
      ${CATEGORIES.map((c) => `<b>${c.name}</b>${[0, 1, 2].map((i) => `<input class="input s num" style="width:100%" inputmode="decimal" value="${num(set.thresholds[c.id][i])}" data-change="th" data-cat="${c.id}" data-i="${i}" aria-label="${c.name}, ${i + 1} место, процент">`).join('')}`).join('')}
    </div>`;

  const prizeOpts = s.works.map((w) => `<option value="${esc(w.code)}" ${ui.prizeDraft.code === w.code ? 'selected' : ''}>${esc(w.code)} · ${esc(nomOf(w).name)}</option>`).join('');
  const judgeOpts = s.judges.map((j) => `<option value="${j.id}" ${ui.prizeDraft.judgeId === j.id ? 'selected' : ''}>${esc(j.name)}</option>`).join('');

  const body = `
    <div class="page-head">
      <div class="col" style="gap:8px"><h1>Места и Гран-при</h1><p class="muted">Правило мест — настройка чемпионата. Всё пересчитывается сразу.</p></div>
      ${pubBtn()}
    </div>
    <div class="grid-3">
      ${rule('thresholds', 'Пороги по проценту', 'Место даётся, если средний балл не ниже порога своей категории. Место может остаться пустым. Так работают Perfection Champ и «Звёздный стиль».')}
      ${rule('ranking', 'Рейтинг в категории', 'Три лучших работы в каждой категории номинации получают 1, 2 и 3 место, если набрали минимальный процент.')}
      ${rule('manual', 'Вручную', 'Автоматически мест нет. Оргкомитет назначает их на странице каждой работы.')}
    </div>
    <div class="two-col">
      <div class="main stack">
        ${set.placeRule === 'thresholds' ? `<section class="card stack"><div class="row-between"><h3>Пороги по категориям, %</h3><span class="chip peach">предварительно · ждём эксперта</span></div>${thTable}</section>` : ''}
        ${set.placeRule === 'ranking' ? `<section class="card stack"><h3>Минимальный процент для места</h3><div class="row"><input class="input num" inputmode="decimal" value="${num(set.rankMin)}" data-change="setting" data-key="rankMin" aria-label="Минимальный процент"><span class="muted">%</span></div></section>` : ''}
        <section class="card stack">
          <h3>Что получится</h3>
          <div class="grid-4">
            <div class="kpi"><span class="label">1 мест</span><span class="value">${sum[1]}</span></div>
            <div class="kpi"><span class="label">2 мест</span><span class="value">${sum[2]}</span></div>
            <div class="kpi"><span class="label">3 мест</span><span class="value">${sum[3]}</span></div>
            <div class="kpi"><span class="label">без места</span><span class="value">${sum[0]}</span></div>
          </div>
          ${sum.none ? `<p class="small muted">${sum.none} ${plural(sum.none, 'работа ещё не оценена', 'работы ещё не оценены', 'работ ещё не оценены')} ни одним судьёй.</p>` : ''}
        </section>
        <section class="card stack">
          <div class="row-between"><h3>Спец-призы судей</h3><span class="small muted">${s.prizes.length}</span></div>
          ${s.prizes.map((pz) => `<div class="row-between small" style="padding:10px 0;border-top:1px solid var(--line)"><span><b>${esc(pz.code)}</b> · ${esc(partById(workByCode(pz.code)?.pid)?.name || '')}</span><span class="row" style="gap:8px"><span class="muted">от ${esc(judgeById(pz.judgeId)?.short || 'организатора')}</span><button class="btn icon ghost" style="width:32px;height:32px" data-action="del-prize" data-id="${pz.id}" aria-label="Удалить спец-приз">${I.trash}</button></span></div>`).join('')}
          <div class="row" style="padding-top:8px;border-top:1px solid var(--line)">
            <select class="input s" style="flex:1 1 200px" data-change="prize-draft" data-field="code" aria-label="Работа"><option value="">Работа…</option>${prizeOpts}</select>
            <select class="input s" style="flex:1 1 200px" data-change="prize-draft" data-field="judgeId" aria-label="Кто дарит"><option value="">Кто дарит…</option>${judgeOpts}</select>
            <button class="btn s primary" data-action="add-prize">Добавить</button>
          </div>
        </section>
      </div>
      <aside class="side">
        <section class="card stack">
          <h3>Гран-при</h3>
          <div class="grid-2">
            <div class="field"><label for="gp-count">Работ в заявке</label><input id="gp-count" class="input num" style="width:100%" value="${set.gpCount}" data-change="setting" data-key="gpCount"></div>
            <div class="field"><label for="gp-vice">Вице гран-при</label><input id="gp-vice" class="input num" style="width:100%" value="${set.gpVice}" data-change="setting" data-key="gpVice"></div>
          </div>
          <p class="xs muted">Сумма процентов заявленных работ. Больше всех — Гран-при, следующие — вице.</p>
          ${gp.map((r, i) => `<div class="row-between small" style="padding:8px 0;border-top:1px solid var(--line)"><span>${r.title === 'gp' ? '<span class="place gp" style="height:26px">Гран-при</span> ' : r.title === 'vice' ? '<span class="place p1" style="height:26px">вице</span> ' : `<span class="muted">${i + 1}.</span> `}${esc(r.p.name)}</span><b class="num">${num(r.sum)}</b></div>`).join('') || '<p class="small muted">Нет претендентов с полным набором оценённых работ.</p>'}
        </section>
      </aside>
    </div>`;
  return shell('org/places', body);
}

// ---------- Действия ----------
function critName(n, critId) {
  if (critId === 'pen') return 'Штраф';
  return n.criteria.find((c) => c.id === critId)?.name || critId;
}

export const actions = {
  'org-nom-tab': (el) => { ui.orgNomTab = el.dataset.tab; rerender(); },
  'mark-paid': (el) => { const p = partById(el.dataset.id); if (p) { p.paid = true; save(); toast(`Оплата отмечена: ${p.name}`); rerender(); } },
  remind: (el) => toast(el.dataset.who === 'all' ? 'Напоминание отправлено всем, кто не закончил' : `Напоминание отправлено: ${el.dataset.who}`),
  'demo-only': () => toast('Импорт появится вместе с сервером — сейчас это демо'),
  'add-crit': (el) => {
    const n = nomById(el.dataset.nom);
    const last = n.criteria[n.criteria.length - 1];
    n.criteria.push({ id: 'c' + Date.now().toString(36), group: last?.group || 'Критерии', name: 'Новый критерий', max: 5, hint: '' });
    save();
    rerender();
  },
  'del-crit': (el) => {
    const n = nomById(el.dataset.nom);
    const [c] = n.criteria.splice(Number(el.dataset.i), 1);
    save();
    toast(`Критерий «${c.name}» удалён, проценты пересчитаны`);
    rerender();
  },
  'set-rule': (el) => { st().settings.placeRule = el.dataset.rule; save(); rerender(); },
  'add-prize': () => {
    const { code, judgeId } = ui.prizeDraft;
    if (!code || !judgeId) { toast('Выберите работу и судью'); return; }
    st().prizes.push({ id: 'pr' + Date.now().toString(36), code, judgeId });
    ui.prizeDraft = { code: '', judgeId: '' };
    save();
    toast('Спец-приз добавлен');
    rerender();
  },
  'del-prize': (el) => {
    const s = st();
    s.prizes = s.prizes.filter((p) => p.id !== el.dataset.id);
    save();
    rerender();
  },
};

export const changes = {
  'nom-field': (el) => {
    const n = nomById(el.dataset.nom);
    const f = el.dataset.field;
    if (f === 'penaltyMax') { const v = parseNum(el.value); if (v == null || v < 0) { toast('Нужно число'); rerender(); return; } n.penaltyMax = Math.round(v); }
    else if (f === 'photos') n.photos = el.value.split(',').map((x) => x.trim()).filter(Boolean);
    else n[f] = el.value.trim();
    save();
    toast('Сохранено');
    rerender();
  },
  'crit-field': (el) => {
    const n = nomById(el.dataset.nom);
    const c = n.criteria[Number(el.dataset.i)];
    if (el.dataset.field === 'max') {
      const v = parseNum(el.value);
      if (v == null || v <= 0) { toast('Максимум — положительное число'); rerender(); return; }
      c.max = v;
    } else c[el.dataset.field] = el.value.trim();
    save();
    rerender();
  },
  'nom-judge': (el) => {
    const n = nomById(el.dataset.nom);
    const id = el.dataset.judge;
    n.judgeIds = el.checked ? [...new Set([...n.judgeIds, id])] : n.judgeIds.filter((x) => x !== id);
    save();
    rerender();
  },
  override: (el) => {
    const w = workByCode(el.dataset.code);
    w.override = el.value === '' ? null : Number(el.value);
    save();
    toast(w.override == null ? 'Место считается автоматически' : 'Место назначено вручную');
    rerender();
  },
  'org-score': (el) => {
    const s = st();
    const { code, judge, crit } = el.dataset;
    const n = nomOf(workByCode(code));
    const sh = s.sheets[code]?.[judge];
    if (!sh) return;
    const v = parseNum(el.value);
    const max = crit === 'pen' ? 0 : Number(n.criteria.find((c) => c.id === crit)?.max);
    const min = crit === 'pen' ? -n.penaltyMax : 0;
    if (v == null || v < min || v > max) { toast(`Допустимо от ${num(min)} до ${num(max)}`); rerender(); return; }
    const from = crit === 'pen' ? sh.pen : sh.v[crit];
    if (from === v) return;
    if (crit === 'pen') sh.pen = v; else sh.v[crit] = v;
    s.audit.push({ at: Date.now(), code, judgeId: judge, critName: critName(n, crit), from, to: v });
    save();
    toast('Оценка изменена, судья увидит отметку');
    rerender();
  },
  th: (el) => {
    const v = parseNum(el.value);
    if (v == null || v < 0 || v > 100) { toast('Порог — от 0 до 100'); rerender(); return; }
    st().settings.thresholds[el.dataset.cat][Number(el.dataset.i)] = v;
    save();
    rerender();
  },
  setting: (el) => {
    const v = parseNum(el.value);
    if (v == null || v < 0) { toast('Нужно число'); rerender(); return; }
    st().settings[el.dataset.key] = el.dataset.key === 'rankMin' ? v : Math.round(v);
    save();
    rerender();
  },
  'prize-draft': (el) => { ui.prizeDraft[el.dataset.field] = el.value; },
};
