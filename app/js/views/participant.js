// Кабинет участника. На этапе приёма — подача работ, на судействе — ожидание, после оглашения — результаты.
import { st, ui, save, nomOf, nomById, sessionUser, addWork, removeWork, workStatus } from '../store.js';
import { result, placeOf, gapToNext, groupBreakdown, grandPrix } from '../scoring.js';
import { esc, pct, num, I, catName, bar, placeChip, plural, toast, rerender, CATEGORIES } from '../ui.js';
import { shell, stageChip } from './common.js';
import { PHOTO_HINTS } from '../data.js';

function comments(w) {
  const nom = nomOf(w);
  const r = result(w);
  const sheets = st().sheets[w.code] || {};
  return r.sentIds
    .map((jid) => ({ n: nom.judgeIds.indexOf(jid) + 1, text: (sheets[jid].comment || '').trim() }))
    .filter((x) => x.text)
    .sort((a, b) => a.n - b.n);
}

function profileCard(me, works) {
  const cat = me.cat || works[0]?.cat || 'junior';
  if (ui.editProfile) {
    return `
      <form class="card stack" data-form="profile" style="gap:12px">
        <h3>Профиль</h3>
        <div class="field"><label for="pf-name">Имя и фамилия</label><input id="pf-name" name="name" class="input s" value="${esc(me.name)}" required></div>
        <div class="field"><label for="pf-insta">Инстаграм</label><input id="pf-insta" name="insta" class="input s" value="${esc(me.insta || '')}"></div>
        <div class="field"><label for="pf-country">Страна</label><input id="pf-country" name="country" class="input s" value="${esc(me.country || '')}"></div>
        <div class="field"><label for="pf-email">Почта</label><input id="pf-email" name="email" class="input s" type="email" value="${esc(me.email || '')}"></div>
        <div class="field"><label for="pf-cat">Категория</label><select id="pf-cat" name="cat" class="input s">${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === cat ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
          ${works.length ? '<span class="xs muted">Категория уже поданных работ не меняется, уточните её у организатора.</span>' : ''}</div>
        <div class="row"><button class="btn s primary" type="submit">Сохранить</button><button class="btn s" type="button" data-action="profile-cancel">Отмена</button></div>
      </form>`;
  }
  return `
    <section class="card stack" style="gap:12px">
      <div class="row-between"><h3>Профиль</h3><button class="btn xs" data-action="profile-edit">${I.edit}<span>Изменить</span></button></div>
      <div class="small" style="line-height:1.7">${esc(me.name)}<br>${esc(me.insta || '—')} · ${esc(me.country || '—')}${me.email ? `<br>${esc(me.email)}` : ''}<br><span class="chip">${catName(cat)}</span></div>
      <p class="xs muted">Имя и инстаграм видит только организатор. В общей таблице вы — номер работы.</p>
    </section>`;
}

// ---------- Этап приёма работ ----------

function workForm(me) {
  const s = st();
  const cat = me.cat || 'junior';
  const groups = s.blocks.map((b) => `<optgroup label="${esc(b.name)}">${s.nominations.filter((n) => n.block === b.id).map((n) => `<option value="${n.id}">${esc(n.name)} · ${esc(n.prefix)}</option>`).join('')}</optgroup>`).join('');
  return `
    <form class="card stack" data-form="work" style="border:2px solid var(--brand)">
      <div class="row-between"><h3>Новая работа</h3><button class="btn xs ghost" type="button" data-action="work-cancel">Отмена</button></div>
      <div class="grid-2">
        <div class="field"><label for="wf-nom">Номинация</label><select id="wf-nom" name="nom" class="input" required><option value="">Выберите…</option>${groups}</select></div>
        <div class="field"><label for="wf-cat">Категория</label><select id="wf-cat" name="cat" class="input">${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === cat ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>
      </div>
      <p class="small muted">Номер работы присвоится автоматически. Фото загрузите на следующем шаге: список ракурсов зависит от номинации.</p>
      <div class="row"><button class="btn primary" type="submit">Создать работу</button></div>
    </form>`;
}

function workSubmissionCard(w) {
  const nom = nomOf(w);
  const status = workStatus(w);
  const photos = nom.photos;
  const have = photos.filter((p) => w.photos?.[p]).length;
  const all = have === photos.length;
  const tiles = photos.map((p) => {
    const v = w.photos?.[p];
    const hint = PHOTO_HINTS[p] || 'Фото по регламенту номинации.';
    const info = `<span class="tip" data-tip="${esc(hint)}" tabindex="0" aria-label="${esc(hint)}">i</span>`;
    if (v && typeof v === 'string' && v.startsWith('data:')) {
      return `<div class="photo-tile has">
        <img src="${v}" alt="${esc(p)}">
        <div class="photo-tile-bar"><span class="small b">${esc(p)}</span>${info}</div>
        <div class="photo-tile-actions"><label class="btn xs file-btn">Заменить<input type="file" accept="image/*" data-change="photo-file" data-code="${esc(w.code)}" data-angle="${esc(p)}"></label><button type="button" class="btn xs ghost" data-action="photo-remove" data-code="${esc(w.code)}" data-angle="${esc(p)}">Убрать</button></div>
      </div>`;
    }
    return `<label class="photo-tile empty">
      <input type="file" accept="image/*" data-change="photo-file" data-code="${esc(w.code)}" data-angle="${esc(p)}">
      <span class="photo-plus">${I.plus}</span>
      <div class="photo-tile-bar"><span class="small b">${esc(p)}</span>${info}</div>
      <span class="xs muted" style="padding:0 10px 10px">нажмите, чтобы загрузить</span>
    </label>`;
  }).join('');
  const statusChip = status === 'submitted'
    ? `<span class="chip ok">${I.check.replace('<svg', '<svg width="14" height="14"')}Подана</span>`
    : all ? '<span class="chip warn">Готова к подаче</span>' : `<span class="chip">Черновик · фото ${have} из ${photos.length}</span>`;
  return `
    <section class="card stack" style="gap:16px">
      <div class="row-between">
        <div class="row" style="gap:14px">
          <div class="photo" style="width:64px;height:64px;border-radius:12px">${I.photo}</div>
          <div class="col" style="gap:4px"><span style="font-size:22px;font-weight:800;letter-spacing:-.3px">${esc(w.code)}</span><span class="small muted">${esc(nom.name)} · ${catName(w.cat)}</span></div>
        </div>
        ${statusChip}
      </div>
      <div class="col" style="gap:8px">
        <span class="label">Фото по регламенту · ${have} из ${photos.length}</span>
        <div class="photo-grid">${tiles}</div>
        <div class="row-between"><span class="xs muted">${status === 'submitted' ? 'Фото можно заменить до закрытия приёма.' : 'Наведите на (i), чтобы узнать, как снимать ракурс. Фото уменьшаются до 1200 px.'}</span>${status !== 'submitted' && !all ? `<button type="button" class="btn xs ghost" data-action="photo-demo" data-code="${esc(w.code)}">Демо: подставить образцы</button>` : ''}</div>
      </div>
      <div class="row" style="border-top:1px solid var(--line);padding-top:14px">
        ${status === 'submitted'
          ? `<button class="btn s" data-action="work-unsend" data-code="${esc(w.code)}">Вернуть в черновик</button>`
          : `<button class="btn s primary" data-action="work-send" data-code="${esc(w.code)}" ${all ? '' : 'disabled'}>Подать на судейство</button><button class="btn s ghost" data-action="work-delete" data-code="${esc(w.code)}">${I.trash}<span>Удалить</span></button>`}
        ${!all && status !== 'submitted' ? `<span class="small muted">Не хватает ${photos.length - have} ${plural(photos.length - have, 'ракурса', 'ракурсов', 'ракурсов')}</span>` : ''}
      </div>
    </section>`;
}

function paymentCard(me, works) {
  const submitted = works.filter((w) => workStatus(w) === 'submitted').length;
  const chip = me.free ? '<span class="chip peach">бесплатное участие</span>' : me.paid ? '<span class="chip ok">оплачено</span>' : '<span class="chip warn">ожидает оплаты</span>';
  return `
    <section class="card stack" style="gap:10px">
      <div class="row-between"><h3>Оплата</h3>${chip}</div>
      <p class="small muted">${submitted} ${plural(submitted, 'работа подана', 'работы поданы', 'работ подано')}. Реквизиты присылает организатор, он же отмечает оплату. Неоплаченные работы не попадут в судейство.</p>
    </section>`;
}

function gpCardSubmission(me, works) {
  const s = st();
  const N = Number(s.settings.gpCount) || 3;
  const submitted = works.filter((w) => workStatus(w) === 'submitted');
  const applied = (me.gpWorks || []).length === N;
  return `
    <section class="card stack" style="gap:10px">
      <h3>Гран-при</h3>
      ${applied
        ? `<p class="small">Заявка подана: ${me.gpWorks.map(esc).join(' · ')}. Считается сумма процентов этих работ.</p><button class="btn s" data-action="gp-withdraw">Отозвать заявку</button>`
        : submitted.length >= N
          ? `<p class="small muted">У вас ${submitted.length} ${plural(submitted.length, 'поданная работа', 'поданные работы', 'поданных работ')}. В зачёт пойдут ${N}: ${submitted.slice(0, N).map((w) => esc(w.code)).join(' · ')}.</p><button class="btn s primary" data-action="gp-apply">Заявиться на Гран-при</button>`
          : `<p class="small muted">Нужно подать ${N} ${plural(N, 'работу', 'работы', 'работ')}, у вас ${submitted.length}.</p>`}
    </section>`;
}

function submissionHome(me, works) {
  const s = st();
  const body = `
    <div class="page-head">
      <div class="col" style="gap:10px">
        <h1>Привет, ${esc(me.name.split(' ')[0])}</h1>
        <div class="row">${stageChip()}<span class="small muted">до ${esc(s.championship.submitUntil)} · ${works.length} ${plural(works.length, 'работа', 'работы', 'работ')}</span></div>
      </div>
      ${ui.newWork ? '' : `<button class="btn primary" data-action="work-new">${I.plus}<span>Подать работу</span></button>`}
    </div>
    <div class="two-col">
      <div class="main stack">
        ${ui.newWork ? workForm(me) : ''}
        ${works.slice().reverse().map(workSubmissionCard).join('') || (ui.newWork ? '' : `<div class="empty">Работ пока нет. Нажмите «Подать работу»: выберите номинацию, получите номер и загрузите фото по ракурсам.</div>`)}
      </div>
      <aside class="side">
        ${paymentCard(me, works)}
        ${gpCardSubmission(me, works)}
        ${profileCard(me, works)}
      </aside>
    </div>`;
  return shell('me', body);
}

// ---------- Судейство и результаты ----------

function workPublished(w, open) {
  const nom = nomOf(w);
  const r = result(w);
  const { place, manual } = placeOf(w);
  const gap = gapToNext(w);
  const head = `
    <div class="row-between" style="align-items:flex-start">
      <div class="row" style="gap:16px">
        <div class="photo" style="width:${open ? 88 : 64}px;height:${open ? 88 : 64}px;border-radius:14px">${I.photo}</div>
        <div class="col" style="gap:4px">
          <span style="font-size:22px;font-weight:800;letter-spacing:-.3px">${esc(w.code)}</span>
          <span class="small muted">${esc(nom.name)} · ${catName(w.cat)} · ${r.sent} ${plural(r.sent, 'судья', 'судьи', 'судей')}</span>
        </div>
      </div>
      <div class="row" style="gap:16px">
        <div class="col" style="gap:2px;align-items:flex-end">
          <span class="small muted">Средний балл</span>
          <span style="font-size:${open ? 40 : 28}px;font-weight:800;letter-spacing:-1px;line-height:1">${pct(r.pct)}</span>
        </div>
        ${placeChip(place, manual)}
      </div>
    </div>`;
  if (!open) {
    return `<button class="card" style="border:0;text-align:left;cursor:pointer;width:100%" data-action="toggle-work" data-code="${esc(w.code)}">${head}<div class="small muted mt-8">${gap ? `До ${gap.place} места не хватило ${num(gap.need)} % · ` : ''}Показать оценки и комментарии</div></button>`;
  }
  const br = groupBreakdown(w);
  const cm = comments(w);
  return `
    <section class="card stack" style="gap:20px">
      ${head}
      <div class="grid-2" style="gap:28px">
        <div class="stack" style="gap:12px">
          <h3 style="font-size:16px">Оценки по группам критериев</h3>
          ${br.groups.map((g) => `<div class="col" style="gap:4px"><div class="row-between small"><span>${esc(g.name)}</span><span class="muted">${num(g.avg)} из ${num(g.max)}</span></div>${bar(g.max ? g.avg / g.max : 0)}</div>`).join('')}
          <div class="row-between small"><span>Штрафные баллы</span><span style="color:var(--danger);font-weight:700">${num(br.pen)}</span></div>
          <p class="xs muted">Среднее по ${r.sent} ${plural(r.sent, 'судье', 'судьям', 'судьям')}. Кто из судей что поставил, не показывается.</p>
        </div>
        <div class="stack" style="gap:10px">
          <h3 style="font-size:16px">Комментарии судей · ${cm.length}</h3>
          ${cm.map((c) => `<div class="col" style="gap:4px;padding:12px 14px;border-radius:14px;background:var(--fill)"><span class="xs b muted">Судья ${c.n}</span><span class="small">${esc(c.text)}</span></div>`).join('') || '<span class="small muted">Комментариев нет.</span>'}
        </div>
      </div>
      <div class="row" style="border-top:1px solid var(--line);padding-top:16px">
        ${place >= 1 ? `<button class="btn s" data-action="diploma">${I.download}<span>Диплом за ${place} место, PDF</span></button>` : `<button class="btn s" data-action="diploma">${I.download}<span>Сертификат участника, PDF</span></button>`}
        <button class="btn s ghost" data-action="toggle-work" data-code="${esc(w.code)}">Свернуть</button>
        ${gap ? `<span class="small muted">До ${gap.place} места не хватило ${num(gap.need)} %</span>` : ''}
      </div>
    </section>`;
}

function workPending(w) {
  const nom = nomOf(w);
  const draft = workStatus(w) === 'draft';
  return `
    <section class="card row-between">
      <div class="row" style="gap:16px">
        <div class="photo" style="width:64px;height:64px;border-radius:12px">${I.photo}</div>
        <div class="col" style="gap:4px"><span style="font-size:20px;font-weight:800">${esc(w.code)}</span><span class="small muted">${esc(nom.name)} · ${catName(w.cat)}</span></div>
      </div>
      ${draft ? '<span class="chip">Черновик · не подана</span>' : '<span class="chip warn"><span class="dot"></span>На оценке</span>'}
    </section>`;
}

export function home() {
  const s = st();
  const me = sessionUser();
  const works = s.works.filter((w) => w.pid === me.id);
  if (s.championship.stage === 'submission') return submissionHome(me, works);
  const pub = s.championship.stage === 'published';
  if (pub && !Object.keys(ui.expanded).length && works[0]) ui.expanded[works[0].code] = true;
  const gp = grandPrix();
  const myGp = gp.find((r) => r.p.id === me.id);
  const gpPos = myGp ? gp.indexOf(myGp) + 1 : null;

  const gpCard = `
    <section class="card stack" style="gap:10px">
      <h3>Гран-при</h3>
      ${myGp && pub
        ? `<div class="col" style="gap:6px;padding:14px;border-radius:14px;background:${myGp.title === 'gp' ? 'var(--brand)' : 'var(--peach)'};color:${myGp.title === 'gp' ? '#fff' : 'var(--ink)'}">
             <b>${myGp.title === 'gp' ? 'Гран-при чемпионата' : myGp.title === 'vice' ? 'Вице гран-при' : `${gpPos} место в зачёте Гран-при`}</b>
             <span class="small">${myGp.works.map(esc).join(' · ')} → ${num(myGp.sum)}</span>
           </div>`
        : (me.gpWorks || []).length
          ? `<p class="small muted">Ваша заявка: ${me.gpWorks.map(esc).join(' · ')}. Итог появится после оглашения.</p>`
          : `<p class="small muted">Претендуют участники, заявившие ${s.settings.gpCount} работы. У вас заявки нет.</p>`}
      ${pub ? '<a class="small b" href="#/results">Кто получил Гран-при</a>' : ''}
    </section>`;

  const body = `
    <div class="page-head">
      <div class="col" style="gap:10px">
        <h1>Привет, ${esc(me.name.split(' ')[0])}</h1>
        <div class="row">${stageChip()}<span class="small muted">${works.length} ${plural(works.length, 'работа', 'работы', 'работ')} · ${esc(me.country || '')}</span></div>
      </div>
      ${pub ? '<a class="btn" href="#/results">Общая таблица</a>' : ''}
    </div>
    ${pub ? '' : `<section class="card lemon row" style="gap:14px">${I.bell.replace('<svg', '<svg width="22" height="22"')}<div class="col" style="gap:2px"><b>Судейство идёт до ${esc(s.championship.deadline)}</b><span class="small">Проценты, места и комментарии судей появятся здесь ${esc(s.championship.announce)}, после оглашения.</span></div></section>`}
    <div class="two-col">
      <div class="main stack">
        ${works.map((w) => (pub ? workPublished(w, !!ui.expanded[w.code]) : workPending(w))).join('') || '<div class="empty">У вас пока нет работ.</div>'}
      </div>
      <aside class="side">
        ${gpCard}
        ${profileCard(me, works)}
      </aside>
    </div>`;
  return shell('me', body);
}

function myWork(code) {
  const w = st().works.find((x) => x.code === code);
  return w && w.pid === sessionUser().id ? w : null;
}

export const actions = {
  'toggle-work': (el) => { const c = el.dataset.code; ui.expanded[c] = !ui.expanded[c]; rerender(); },
  diploma: () => toast('PDF-дипломы появятся вместе с сервером — сейчас это демо'),
  'work-new': () => { ui.newWork = true; rerender(); },
  'work-cancel': () => { ui.newWork = false; rerender(); },
  'photo-remove': (el) => {
    const w = myWork(el.dataset.code);
    if (!w) return;
    delete w.photos[el.dataset.angle];
    save();
    rerender();
  },
  'photo-demo': (el) => {
    const w = myWork(el.dataset.code);
    if (!w) return;
    const nom = nomOf(w);
    w.photos = w.photos || {};
    nom.photos.forEach((p, i) => { if (!w.photos[p]) w.photos[p] = samplePhoto(p, i); });
    save();
    toast('Образцы подставлены, замените их настоящими фото');
    rerender();
  },
  'work-send': (el) => {
    const w = myWork(el.dataset.code);
    if (!w) return;
    const nom = nomOf(w);
    if (!nom.photos.every((p) => w.photos?.[p])) { toast('Загрузите все ракурсы'); return; }
    w.status = 'submitted';
    save();
    toast(`Работа ${w.code} подана на судейство`);
    rerender();
  },
  'work-unsend': (el) => {
    const w = myWork(el.dataset.code);
    if (!w) return;
    w.status = 'draft';
    const me = sessionUser();
    me.gpWorks = (me.gpWorks || []).filter((c) => c !== w.code);
    save();
    rerender();
  },
  'work-delete': (el) => {
    const w = myWork(el.dataset.code);
    if (!w || workStatus(w) !== 'draft') return;
    removeWork(w.code);
    toast(`Черновик ${w.code} удалён`);
    rerender();
  },
  'gp-apply': () => {
    const me = sessionUser();
    const N = Number(st().settings.gpCount) || 3;
    const codes = st().works.filter((w) => w.pid === me.id && workStatus(w) === 'submitted').slice(0, N).map((w) => w.code);
    if (codes.length < N) { toast(`Нужно ${N} поданных работ`); return; }
    me.gpWorks = codes;
    save();
    toast('Заявка на Гран-при подана');
    rerender();
  },
  'gp-withdraw': () => { const me = sessionUser(); me.gpWorks = []; save(); toast('Заявка отозвана'); rerender(); },
};

// Уменьшает картинку до 1200 px по длинной стороне и отдаёт data URL.
function fitPhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1200 / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Это не картинка')); };
    img.src = url;
  });
}

// Образец для демо: мягкий цветной прямоугольник с подписью ракурса.
function samplePhoto(label, i) {
  const cv = document.createElement('canvas');
  cv.width = 600; cv.height = 450;
  const x = cv.getContext('2d');
  const hues = ['#FACFBC', '#FCC379', '#FDEEE7', '#F1E3D3', '#FFE2E9', '#E9E9E9'];
  x.fillStyle = hues[i % hues.length]; x.fillRect(0, 0, 600, 450);
  x.fillStyle = 'rgba(0,0,0,.45)'; x.font = 'bold 36px Manrope, sans-serif'; x.textAlign = 'center';
  x.fillText(label, 300, 235);
  x.font = '20px Manrope, sans-serif'; x.fillText('образец', 300, 270);
  return cv.toDataURL('image/jpeg', 0.7);
}

export const changes = {
  'photo-file': async (el) => {
    const w = myWork(el.dataset.code);
    const file = el.files && el.files[0];
    if (!w || !file) return;
    try {
      w.photos = w.photos || {};
      w.photos[el.dataset.angle] = await fitPhoto(file);
      save();
      toast(`Фото «${el.dataset.angle}» загружено`);
      rerender();
    } catch (e) { toast(e.message || 'Не удалось загрузить фото'); }
  },
};

export const forms = {
  work: (form) => {
    const d = Object.fromEntries(new FormData(form).entries());
    if (!d.nom || !nomById(d.nom)) { toast('Выберите номинацию'); return; }
    const me = sessionUser();
    const code = addWork({ nomId: d.nom, pid: me.id, cat: d.cat || me.cat || 'junior' });
    ui.newWork = false;
    toast(`Работа ${code} создана. Загрузите фото по ракурсам`);
    rerender();
  },
};
