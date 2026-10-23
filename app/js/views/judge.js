// Кабинет судьи: список работ и судейская ведомость.
import { st, ui, save, nomById, workByCode, sheetOf, ensureSheet, nomOf, sessionUser } from '../store.js';
import { maxOf, sheetTotal, filledCount, isComplete, groupsOf, judgeStats } from '../scoring.js';
import { esc, num, I, href, toast, catName, bar, plural, rerender, dateTime } from '../ui.js';
import { shell } from './common.js';

const statusOf = (code, jid) => sheetOf(code, jid)?.status || 'none';

function myGroups(jid) {
  const s = st();
  return s.nominations
    .filter((n) => n.judgeIds.includes(jid))
    .map((n) => ({ nom: n, works: s.works.filter((w) => w.nom === n.id && (w.status || 'submitted') === 'submitted') }));
}

function workCard(w, jid) {
  const nom = nomOf(w);
  const sh = sheetOf(w.code, jid);
  const stt = sh?.status || 'none';
  const n = nom.criteria.length;
  const f = filledCount(sh, nom);
  let line;
  let cta;
  if (stt === 'sent') {
    line = `<span class="row small" style="gap:6px;color:var(--ok);font-weight:700">${I.check.replace('<svg', '<svg width="16" height="16"')}Отправлена · ${num(sheetTotal(sh, nom))} из ${maxOf(nom)}</span>`;
    cta = '<span class="btn s" style="width:100%">Открыть</span>';
  } else if (stt === 'draft') {
    const ready = isComplete(sh, nom);
    line = `<span class="small" style="color:var(--warn);font-weight:700">${ready ? 'Готово к отправке' : `Черновик · заполнено ${f} из ${n}`}</span>`;
    cta = `<span class="btn s primary" style="width:100%">${ready ? 'Отправить' : 'Продолжить'}</span>`;
  } else if (stt === 'recused') {
    line = '<span class="small muted">Вы взяли отвод</span>';
    cta = `<button class="btn s" style="width:100%" data-action="unrecuse" data-code="${esc(w.code)}">Вернуть работу</button>`;
  } else {
    line = '<span class="small muted">Не оценена</span>';
    cta = '<span class="btn s primary" style="width:100%">Оценить</span>';
  }
  const inner = `
    <div class="photo card-top">${I.photo}<span>${nom.photos.length} ${plural(nom.photos.length, 'ракурс', 'ракурса', 'ракурсов')}</span></div>
    <div class="col" style="padding:16px 18px 18px;gap:10px">
      <div class="row-between"><span style="font-size:20px;font-weight:800;letter-spacing:-.3px">${esc(w.code)}</span><span class="chip">${catName(w.cat)}</span></div>
      ${line}
      ${cta}
    </div>`;
  return stt === 'recused'
    ? `<div class="work-card" style="opacity:.75">${inner}</div>`
    : `<a class="work-card" href="${href('judge', 'work', w.code)}">${inner}</a>`;
}

export function list() {
  const s = st();
  const j = sessionUser();
  if (s.championship.stage === 'submission') {
    return shell('judge', `<section class="card row-between" style="padding:24px 28px"><div class="col" style="gap:8px"><h1>Здравствуйте, ${esc(j.name.split(' ')[0])}</h1><p class="muted">Идёт приём работ до ${esc(s.championship.submitUntil)}. Судейство откроется, когда организатор закроет приём.</p></div><span class="chip info"><span class="dot"></span>Приём работ</span></section>
      <section class="card stack"><h3>Ваши номинации</h3>${myGroups(j.id).map(({ nom, works }) => `<div class="row-between small" style="padding:10px 0;border-top:1px solid var(--line)"><b>${esc(nom.name)}</b><span class="muted">${works.filter((w) => (w.status || 'submitted') === 'submitted').length} ${plural(works.filter((w) => (w.status || 'submitted') === 'submitted').length, 'работа подана', 'работы поданы', 'работ подано')}</span></div>`).join('')}</section>`);
  }
  const groups = myGroups(j.id);
  const stats = judgeStats(j.id);
  const total = stats.assigned - stats.recused;
  const f = ui.judgeFilter;
  const match = (w) => {
    const x = statusOf(w.code, j.id);
    return f === 'all' || (f === 'todo' && x === 'none') || (f === 'draft' && x === 'draft') || (f === 'sent' && x === 'sent');
  };
  const pub = s.championship.stage === 'published';
  const tab = (id, label, n) => `<button class="tab ${f === id ? 'active' : ''}" data-action="judge-filter" data-f="${id}">${label} <span class="count">${n}</span></button>`;

  const sections = groups.map(({ nom, works }) => {
    const shown = works.filter(match);
    if (!shown.length) return '';
    return `
      <section class="stack">
        <div class="row-between"><h3>${esc(nom.name)} <span class="muted" style="font-weight:500">· ${shown.length} ${plural(shown.length, 'работа', 'работы', 'работ')}</span></h3><span class="small muted">максимум ${maxOf(nom)} баллов · ${nom.criteria.length} ${plural(nom.criteria.length, 'критерий', 'критерия', 'критериев')}</span></div>
        <div class="grid-3">${shown.map((w) => workCard(w, j.id)).join('')}</div>
      </section>`;
  }).join('');

  const body = `
    <section class="card row-between" style="padding:24px 28px">
      <div class="col" style="gap:8px;min-width:0">
        <h1>Здравствуйте, ${esc(j.name.split(' ')[0])}</h1>
        <p class="muted">${pub ? 'Итоги опубликованы, оценки закрыты для изменений.' : `Судейство открыто до <b style="color:var(--ink)">${esc(s.championship.deadline)}</b>.`} Вы видите только номера работ, имена участников скрыты.</p>
      </div>
      <div class="row" style="gap:20px">
        <div class="kpi" style="align-items:flex-end"><span class="label">Отправлено</span><span class="value">${stats.sent} <span style="font-size:18px;color:var(--muted);font-weight:700">из ${total}</span></span></div>
        <div style="width:160px">${bar(total ? stats.sent / total : 0, 'ok')}</div>
      </div>
    </section>
    <div class="tabs">
      ${tab('todo', 'Не начаты', stats.none)}${tab('draft', 'Черновики', stats.draft)}${tab('sent', 'Отправлены', stats.sent)}${tab('all', 'Все', stats.assigned)}
    </div>
    ${sections || `<div class="empty">${f === 'todo' ? 'Все работы начаты. Загляните в черновики.' : 'Здесь пока пусто.'}</div>`}
    <div class="empty small" style="text-align:left">Если участник — ваша ученица или коллега, откройте работу и нажмите «Не могу судить». Работа уйдёт из вашего списка, организатор увидит отвод.</div>`;
  return shell('judge', body);
}

function critBlock(c, val, code, locked) {
  const max = Number(c.max) || 0;
  const control = max <= 20
    ? `<div class="pills" role="group" aria-label="${esc(c.name)}">${Array.from({ length: Math.floor(max) + 1 }, (_, i) => `<button type="button" class="pill${val === i ? ' on' : ''}" data-action="score" data-code="${esc(code)}" data-crit="${esc(c.id)}" data-val="${i}" aria-pressed="${val === i}" ${locked ? 'disabled' : ''}>${i}</button>`).join('')}</div>`
    : `<input class="input num" type="text" inputmode="decimal" value="${val ?? ''}" data-change="score-input" data-code="${esc(code)}" data-crit="${esc(c.id)}" aria-label="${esc(c.name)}" ${locked ? 'disabled' : ''}>`;
  return `
    <div class="crit">
      <div class="crit-head">
        <div><div class="crit-name">${esc(c.name)}</div>${c.hint ? `<div class="crit-hint">${esc(c.hint)}</div>` : ''}</div>
        <div class="crit-val">${num(val)} <span>из ${num(max)}</span></div>
      </div>
      ${control}
    </div>`;
}

function fillNote(sh, nom) {
  const n = nom.criteria.length;
  const f = filledCount(sh, nom);
  if (isComplete(sh, nom)) return `<span class="row small" style="gap:6px;color:var(--ok);font-weight:700">${I.check.replace('<svg', '<svg width="16" height="16"')}Все ${n} ${plural(n, 'критерий', 'критерия', 'критериев')} и комментарий заполнены</span>`;
  const noComment = !(sh?.comment || '').trim();
  return `<span class="small muted">Заполнено ${f} из ${n}${noComment ? ' · нужен комментарий' : ''}</span>`;
}

export function sheet(code) {
  const s = st();
  const j = sessionUser();
  const w = workByCode(code);
  if (!w || !nomById(w.nom).judgeIds.includes(j.id)) return shell('judge', '<div class="empty">Эта работа вам не назначена.</div>');
  const nom = nomOf(w);
  const sh = sheetOf(code, j.id);
  const max = maxOf(nom);
  const pub = s.championship.stage === 'published';
  const recused = sh?.status === 'recused';
  const locked = pub || recused;
  if (ui.photoFor !== code) { ui.photoFor = code; ui.photo = 0; }
  const total = sh ? sheetTotal(sh, nom) : 0;
  const siblings = s.works.filter((x) => x.nom === w.nom);
  const idx = siblings.findIndex((x) => x.code === code);
  const prev = siblings[idx - 1];
  const next = siblings[idx + 1];
  const audit = s.audit.filter((a) => a.code === code && a.judgeId === j.id);

  const groups = groupsOf(nom);
  const groupsHtml = groups.map((g) => {
    const got = g.items.reduce((a, c) => a + (Number(sh?.v[c.id]) || 0), 0);
    return `
      <div class="group-head"><span class="group-title">${esc(g.name)}</span><b>${num(got)} <span class="muted" style="font-weight:500">из ${num(g.max)}</span></b></div>
      ${g.items.map((c) => critBlock(c, sh?.v[c.id] ?? null, code, locked)).join('')}`;
  }).join('');

  const pen = Number(sh?.pen) || 0;
  const penPills = Array.from({ length: nom.penaltyMax + 1 }, (_, i) => -i)
    .map((v) => `<button type="button" class="pill neg${pen === v ? ' on' : ''}" data-action="pen" data-code="${esc(code)}" data-val="${v}" aria-pressed="${pen === v}" ${locked ? 'disabled' : ''}>${v === 0 ? '0' : '−' + Math.abs(v)}</button>`).join('');

  const summary = groups.map((g) => {
    const got = g.items.reduce((a, c) => a + (Number(sh?.v[c.id]) || 0), 0);
    return `<div class="col" style="gap:4px"><div class="row-between small"><span>${esc(g.name)}</span><span class="muted">${num(got)} из ${num(g.max)}</span></div>${bar(g.max ? got / g.max : 0, 'thin')}</div>`;
  }).join('');

  const photos = nom.photos;
  const cur = Math.min(ui.photo, photos.length - 1);

  const body = `
    <div class="page-head">
      <div class="col" style="gap:10px">
        <a href="#/judge" class="row small b" style="gap:6px">${I.left.replace('<svg', '<svg width="16" height="16"')}Мои работы</a>
        <h1>Работа ${esc(code)}</h1>
        <div class="row small muted"><span class="chip">${esc(nom.name)}</span><span class="chip">${catName(w.cat)}</span><span>Работа ${idx + 1} из ${siblings.length} в номинации</span></div>
      </div>
      <div class="row">
        ${sh && !locked ? `<span class="row small muted" style="gap:6px">${I.check.replace('<svg', '<svg width="16" height="16" style="color:var(--ok)"')}Сохраняется автоматически</span>` : ''}
        ${!pub && !recused ? `<button class="btn s" data-action="recuse" data-code="${esc(code)}">Не могу судить эту работу</button>` : ''}
      </div>
    </div>
    ${audit.length ? `<div class="card lemon pad-s small"><b>Организатор изменил вашу оценку:</b> ${audit.map((a) => `${esc(a.critName)} ${num(a.from)} → ${num(a.to)} (${dateTime(a.at)})`).join('; ')}</div>` : ''}
    ${recused ? '<div class="card lemon pad-s small">Вы взяли отвод от этой работы. Она не учитывается в вашем списке. <button class="btn xs" data-action="unrecuse" data-code="' + esc(code) + '">Вернуть работу</button></div>' : ''}
    <div class="two-col">
      <aside class="side" style="flex:1 1 380px">
        <section class="card stack" style="padding:16px">
          <div class="photo big">${I.photo}<b style="color:var(--ink)">${esc(photos[cur] || 'Фото')}</b><span>Нажмите, чтобы открыть крупно</span></div>
          <div class="thumbs" style="grid-template-columns:repeat(${Math.min(photos.length, 6)},minmax(0,1fr))">
            ${photos.map((p, i) => `<button type="button" class="thumb ${i === cur ? 'on' : ''}" data-action="photo" data-i="${i}">${esc(p)}</button>`).join('')}
          </div>
          <div class="row-between small muted"><span>Ракурсы по регламенту: ${photos.length} из ${photos.length}</span></div>
        </section>
        <section class="card lemon pad-s col">
          <b class="small">Нет нужного ракурса?</b>
          <span class="small">Ставьте 0 по этому критерию и напишите об этом в комментарии. Так участник поймёт, что снизило балл.</span>
        </section>
        <section class="card stack hide-mobile">
          <div class="row-between"><span class="muted small">Ваша оценка</span><span class="kpi"><span class="value">${num(total)} <span style="font-size:16px;color:var(--muted);font-weight:700">из ${max}</span></span></span></div>
          ${summary}
          <div class="row-between small"><span>Штраф</span><span style="color:var(--danger);font-weight:700">${num(pen)}</span></div>
          <p class="xs muted">Оценки других судей вы не видите. Средний процент посчитается после закрытия судейства.</p>
        </section>
      </aside>

      <section class="main card" style="padding-top:4px">
        ${groupsHtml}
        <div class="group-head"><span class="group-title">Штрафные баллы</span><b style="color:var(--danger)">${num(pen)}</b></div>
        <div class="crit">
          <div class="crit-head"><div><div class="crit-name">Нарушения</div><div class="crit-hint">${esc(nom.penaltyHint)}</div></div><div class="crit-val">до <span>−${nom.penaltyMax}</span></div></div>
          <div class="pills" role="group" aria-label="Штрафные баллы">${penPills}</div>
        </div>
        <div class="crit" style="gap:8px">
          <label for="comment" class="crit-name">Комментарий участнику</label>
          <div class="crit-hint" style="margin:0">Обязательно. Участник увидит его после оглашения, подпись — «Судья ${nom.judgeIds.indexOf(j.id) + 1}», без имени.</div>
          <textarea id="comment" class="input" rows="5" data-input="comment" data-code="${esc(code)}" placeholder="Что получилось, что снизило балл, над чем поработать" ${locked ? 'disabled' : ''}>${esc(sh?.comment || '')}</textarea>
          <div class="row-between xs muted"><span>Пишите по делу: участник платит за обратную связь</span><span id="comment-count">${(sh?.comment || '').length} знаков</span></div>
        </div>
      </section>
    </div>`;

  let action;
  if (pub) action = '<span class="chip">' + I.lock.replace('<svg', '<svg width="14" height="14"') + 'Итоги опубликованы — оценка закрыта</span>';
  else if (recused) action = '<span class="chip">Отвод</span>';
  else if (sh?.status === 'sent') action = `<span class="chip ok">${I.check.replace('<svg', '<svg width="14" height="14"')}Отправлено · правки сохраняются сразу</span>`;
  else action = `<button id="send-btn" class="btn primary" data-action="send" data-code="${esc(code)}" ${isComplete(sh, nom) ? '' : 'disabled'}>Отправить оценку</button>`;

  const nav = `
    ${prev ? `<a class="btn s ghost" href="${href('judge', 'work', prev.code)}">${I.left}<span>${esc(prev.code)}</span></a>` : ''}
    ${next ? `<a class="btn s ghost" href="${href('judge', 'work', next.code)}"><span>${esc(next.code)}</span>${I.right}</a>` : ''}`;

  const actionbar = `
    <div class="actionbar"><div class="actionbar-in">
      <div class="row" style="gap:16px">
        <span style="font-size:24px;font-weight:800;letter-spacing:-.4px">${num(total)} <span class="small muted" style="font-weight:700">из ${max}</span></span>
        <span id="fill-note">${fillNote(sh, nom)}</span>
      </div>
      <div class="row">${nav}${action}</div>
    </div></div>`;
  return shell('judge', body, actionbar);
}

function goNextTodo(code) {
  const j = sessionUser();
  const all = myGroups(j.id).flatMap((g) => g.works);
  const nextTodo = all.find((w) => w.code !== code && statusOf(w.code, j.id) !== 'sent' && statusOf(w.code, j.id) !== 'recused');
  location.hash = nextTodo ? href('judge', 'work', nextTodo.code) : '#/judge';
}

export const actions = {
  'judge-filter': (el) => { ui.judgeFilter = el.dataset.f; rerender(); },
  score: (el) => {
    const sh = ensureSheet(el.dataset.code, sessionUser().id);
    if (sh.status === 'recused') return;
    sh.v[el.dataset.crit] = Number(el.dataset.val);
    sh.at = Date.now();
    save();
    rerender();
  },
  pen: (el) => {
    const sh = ensureSheet(el.dataset.code, sessionUser().id);
    sh.pen = Number(el.dataset.val);
    sh.at = Date.now();
    save();
    rerender();
  },
  photo: (el) => { ui.photo = Number(el.dataset.i); rerender(); },
  send: (el) => {
    const code = el.dataset.code;
    const w = workByCode(code);
    const sh = sheetOf(code, sessionUser().id);
    if (!isComplete(sh, nomOf(w))) { toast('Заполните все критерии и комментарий'); return; }
    sh.status = 'sent';
    sh.at = Date.now();
    save();
    toast(`Оценка ${code} отправлена`);
    goNextTodo(code);
  },
  recuse: (el) => {
    const code = el.dataset.code;
    const sh = ensureSheet(code, sessionUser().id);
    sh.status = 'recused';
    sh.at = Date.now();
    save();
    toast('Отвод оформлен, организатор увидит его на обзоре');
    location.hash = '#/judge';
  },
  unrecuse: (el) => {
    const sh = ensureSheet(el.dataset.code, sessionUser().id);
    sh.status = 'draft';
    save();
    toast('Работа вернулась в ваш список');
    rerender();
  },
};

export const changes = {
  'score-input': (el) => {
    const v = Number(String(el.value).replace(',', '.'));
    if (!Number.isFinite(v)) return;
    const sh = ensureSheet(el.dataset.code, sessionUser().id);
    sh.v[el.dataset.crit] = v;
    save();
    rerender();
  },
};

export const inputs = {
  comment: (el) => {
    const code = el.dataset.code;
    const sh = ensureSheet(code, sessionUser().id);
    sh.comment = el.value;
    sh.at = Date.now();
    save();
    const nom = nomOf(workByCode(code));
    const note = document.getElementById('fill-note');
    if (note) note.innerHTML = fillNote(sh, nom);
    const btn = document.getElementById('send-btn');
    if (btn) btn.disabled = !isComplete(sh, nom);
    const cnt = document.getElementById('comment-count');
    if (cnt) cnt.textContent = `${el.value.length} знаков`;
  },
};
