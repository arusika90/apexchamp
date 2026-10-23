// Состояния ролей для входа: кем войти и на каком этапе чемпионата это состояние возникает.
// Выбор состояния переключает этап и пользователя. Описание состояния показывается в шапке.
import { st, sessionUser, workStatus } from './store.js';
import { placeOf, grandPrix, judgeStats } from './scoring.js';

export const PHASES = [
  { id: 'before', name: 'До' },
  { id: 'during', name: 'Во время' },
  { id: 'after', name: 'После' },
];

export const PERSONAS = {
  part: [
    { phase: 'before', label: 'До подачи', stage: 'submission', user: 'p20', desc: 'Зарегистрировалась, работ ещё нет' },
    { phase: 'during', label: 'В ожидании', stage: 'judging', user: 'p19', desc: 'Работа подана, идёт судейство' },
    { phase: 'after', label: 'Узнала результаты', stage: 'published', user: 'p8', desc: 'Итоги опубликованы, мест нет' },
    { phase: 'after', label: 'Победа', stage: 'published', user: 'p16', desc: 'Гран-при и первые места' },
  ],
  judge: [
    { phase: 'before', label: 'До судейства', stage: 'submission', user: 'j1', desc: 'Идёт приём работ' },
    { phase: 'during', label: 'Не начала', stage: 'judging', user: 'j9', desc: 'Все работы ждут оценки' },
    { phase: 'during', label: 'В процессе', stage: 'judging', user: 'j1', desc: 'Часть отправлена, есть черновик' },
    { phase: 'during', label: 'Всё отправлено', stage: 'judging', user: 'j5', desc: 'Ждёт итогов' },
    { phase: 'after', label: 'Итоги опубликованы', stage: 'published', user: 'j1', desc: 'Оценки закрыты' },
  ],
  org: [
    { phase: 'before', label: 'Приём работ', stage: 'submission', desc: 'Участники подают работы' },
    { phase: 'during', label: 'Судейство', stage: 'judging', desc: 'Судьи оценивают, кто-то не закончил' },
    { phase: 'after', label: 'Итоги опубликованы', stage: 'published', desc: 'Таблица открыта всем' },
  ],
  guest: [
    { phase: 'before', label: 'До оглашения', stage: 'judging', desc: 'Результатов ещё нет' },
    { phase: 'after', label: 'После оглашения', stage: 'published', desc: 'Таблица, Гран-при, спец-призы' },
  ],
  designer: [
    { phase: 'during', label: 'Библиотека', stage: null, desc: 'Цвета, шрифты, компоненты' },
  ],
};

export const phaseName = (id) => PHASES.find((x) => x.id === id)?.name || '';

// Текущее состояние вошедшего пользователя — для подписи в шапке.
export function currentState() {
  const s = st();
  const u = sessionUser();
  const role = s.session?.role;
  const stage = s.championship.stage;
  if (!u) return '';
  if (role === 'part') {
    const works = s.works.filter((w) => w.pid === u.id);
    if (stage === 'submission') return works.some((w) => workStatus(w) === 'submitted') ? 'работы поданы' : 'до подачи';
    if (stage === 'judging') return works.length ? 'в ожидании' : 'без работ';
    const won = works.some((w) => placeOf(w).place >= 1) || grandPrix().some((r) => r.p.id === u.id && r.title);
    return won ? 'победа' : 'результаты получены';
  }
  if (role === 'judge') {
    if (stage === 'submission') return 'до судейства';
    if (stage === 'published') return 'итоги опубликованы';
    const x = judgeStats(u.id);
    if (!x.sent && !x.draft) return 'не начала';
    return x.left ? 'в процессе' : 'всё отправлено';
  }
  if (role === 'org') return { submission: 'приём работ', judging: 'судейство', published: 'итоги опубликованы' }[stage] || '';
  if (role === 'guest') return stage === 'published' ? 'после оглашения' : 'до оглашения';
  return '';
}
