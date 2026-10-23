// Подсчёт баллов, процентов, мест и Гран-при. Вся «математика чемпионата» — здесь.
import { st, nomOf, worksOfNom, workByCode, partById } from './store.js';

export const maxOf = (nom) => nom.criteria.reduce((a, c) => a + (Number(c.max) || 0), 0);

export function sheetTotal(sh, nom) {
  if (!sh) return null;
  let t = 0;
  for (const c of nom.criteria) {
    const v = sh.v[c.id];
    if (v != null && v !== '') t += Number(v);
  }
  return t + (Number(sh.pen) || 0);
}

export const filledCount = (sh, nom) => (sh ? nom.criteria.filter((c) => sh.v[c.id] != null).length : 0);
export const isComplete = (sh, nom) => !!sh && filledCount(sh, nom) === nom.criteria.length && (sh.comment || '').trim().length > 0;

export function groupsOf(nom) {
  const out = [];
  for (const c of nom.criteria) {
    const g = c.group || 'Критерии';
    let grp = out.find((x) => x.name === g);
    if (!grp) { grp = { name: g, items: [], max: 0 }; out.push(grp); }
    grp.items.push(c);
    grp.max += Number(c.max) || 0;
  }
  return out;
}

export function activeJudges(work) {
  const nom = nomOf(work);
  const sh = st().sheets[work.code] || {};
  return nom.judgeIds.filter((j) => sh[j]?.status !== 'recused');
}

// Процент работы = сумма баллов всех отправивших судей / (число отправивших × максимум номинации).
export function result(work) {
  const nom = nomOf(work);
  const max = maxOf(nom);
  const sheets = st().sheets[work.code] || {};
  const active = activeJudges(work);
  const sentIds = active.filter((j) => sheets[j]?.status === 'sent');
  if (!sentIds.length || !max) return { pct: null, sent: 0, of: active.length, totals: [], max, spread: 0, sentIds: [] };
  const totals = sentIds.map((j) => sheetTotal(sheets[j], nom));
  const sum = totals.reduce((a, b) => a + b, 0);
  return {
    pct: sum / (sentIds.length * max),
    sent: sentIds.length,
    of: active.length,
    totals, max, sentIds,
    spread: (Math.max(...totals) - Math.min(...totals)) / max,
  };
}

const p100 = (frac) => Math.round(frac * 10000) / 100;

export function autoPlace(work, res = result(work)) {
  const s = st();
  if (res.pct == null) return null;
  const p = p100(res.pct);
  const rule = s.settings.placeRule;
  if (rule === 'manual') return 0;
  if (rule === 'thresholds') {
    const th = s.settings.thresholds[work.cat] || [];
    for (let i = 0; i < th.length; i++) if (p >= Number(th[i])) return i + 1;
    return 0;
  }
  // Рейтинг внутри номинации и категории, равные проценты делят место.
  const better = worksOfNom(work.nom)
    .filter((w) => w.cat === work.cat && w.code !== work.code)
    .map((w) => result(w).pct)
    .filter((x) => x != null && p100(x) > p).length;
  const rank = better + 1;
  return rank <= 3 && p >= Number(s.settings.rankMin) ? rank : 0;
}

export function placeOf(work) {
  const manual = work.override !== null && work.override !== undefined;
  return { place: manual ? work.override : autoPlace(work), manual };
}

// Сколько не хватило до следующего места (только для правила порогов).
export function gapToNext(work) {
  const s = st();
  if (s.settings.placeRule !== 'thresholds') return null;
  const r = result(work);
  if (r.pct == null) return null;
  const { place } = placeOf(work);
  const th = s.settings.thresholds[work.cat] || [];
  const target = place === 0 ? th.length : place - 1;
  if (!target || target > th.length) return null;
  const need = Number(th[target - 1]) - p100(r.pct);
  return need > 0 ? { place: target, need } : null;
}

export function groupBreakdown(work) {
  const nom = nomOf(work);
  const r = result(work);
  const sheets = st().sheets[work.code] || {};
  const groups = groupsOf(nom).map((g) => {
    const sums = r.sentIds.map((j) => g.items.reduce((a, c) => a + (Number(sheets[j].v[c.id]) || 0), 0));
    return { name: g.name, max: g.max, avg: sums.length ? sums.reduce((a, b) => a + b, 0) / sums.length : null };
  });
  const pens = r.sentIds.map((j) => Number(sheets[j].pen) || 0);
  const pen = pens.length ? pens.reduce((a, b) => a + b, 0) / pens.length : 0;
  return { groups, pen };
}

export function grandPrix() {
  const s = st();
  const N = Number(s.settings.gpCount) || 3;
  const rows = s.participants
    .filter((p) => (p.gpWorks || []).length === N)
    .map((p) => {
      const pcts = p.gpWorks.map((code) => { const w = workByCode(code); return w ? result(w).pct : null; });
      const ok = pcts.every((x) => x != null);
      return { p, works: p.gpWorks, pcts, sum: ok ? pcts.reduce((a, b) => a + p100(b), 0) : null };
    })
    .filter((r) => r.sum != null)
    .sort((a, b) => b.sum - a.sum);
  const vice = Number(s.settings.gpVice) || 0;
  rows.forEach((r, i) => { r.title = i === 0 ? 'gp' : i <= vice ? 'vice' : null; });
  return rows;
}

export function placeSummary() {
  const out = { 1: 0, 2: 0, 3: 0, 0: 0, none: 0 };
  for (const w of st().works) {
    const { place } = placeOf(w);
    if (place == null) out.none++; else out[place]++;
  }
  return out;
}

export function judgeStats(jid) {
  const s = st();
  const out = { assigned: 0, sent: 0, draft: 0, recused: 0, none: 0 };
  for (const w of s.works) {
    if (!nomOf(w).judgeIds.includes(jid)) continue;
    out.assigned++;
    const stt = s.sheets[w.code]?.[jid]?.status || 'none';
    out[stt]++;
  }
  out.left = out.assigned - out.sent - out.recused;
  return out;
}

export function progress(nomId = null) {
  const s = st();
  let expected = 0;
  let sent = 0;
  for (const w of s.works) {
    if (nomId && w.nom !== nomId) continue;
    const act = activeJudges(w);
    expected += act.length;
    sent += act.filter((j) => s.sheets[w.code]?.[j]?.status === 'sent').length;
  }
  return { expected, sent, frac: expected ? sent / expected : 0 };
}

export const ownerOf = (work) => partById(work.pid);
