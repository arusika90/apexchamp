// Библиотека дизайн-системы: токены читаются прямо из css/tokens.css, компоненты — живые.
import { st } from '../store.js';
import { esc, I, bar, placeChip } from '../ui.js';
import { shell } from './common.js';

const COLOR_GROUPS = [
  ['Бренд и действие', [['--brand', 'Бренд', 'логотип, hero, активные состояния'], ['--brand-2', 'Бренд ярче', 'иконки, наведение'], ['--brand-ink', 'Бренд, текст', 'текст на персиковом'], ['--cta', 'Главная кнопка', 'одна на экран'], ['--cta-hover', 'Кнопка, наведение', '']]],
  ['Тёплые подложки', [['--peach', 'Персик', 'подсветка, «требует внимания»'], ['--peach-2', 'Персик 2', 'обводки'], ['--cloudberry', 'Морошка', '3 место'], ['--lemon', 'Лимон', 'подсказки, предупреждения']]],
  ['Текст', [['--ink', 'Основной', 'заголовки и текст'], ['--ink-2', 'Вторичный', ''], ['--muted', 'Приглушённый', 'подписи'], ['--hint', 'Подсказка', 'плейсхолдеры, неактивное']]],
  ['Поверхности', [['--bg', 'Фон страницы', ''], ['--card', 'Карточка', ''], ['--fill', 'Заливка', 'поля, второстепенные кнопки'], ['--fill-2', 'Заливка 2', 'наведение, фото-заглушки'], ['--line', 'Линия', 'разделители'], ['--dark', 'Тёмный', 'активные вкладки, Гран-при']]],
  ['Статусы', [['--ok', 'Успех', ''], ['--ok-bg', 'Успех, фон', ''], ['--warn', 'Внимание', ''], ['--warn-bg', 'Внимание, фон', ''], ['--danger', 'Ошибка, штраф', ''], ['--danger-bg', 'Ошибка, фон', ''], ['--info', 'Инфо', ''], ['--info-bg', 'Инфо, фон', '']]],
  ['Призовые места', [['--place-1', '1 место', ''], ['--place-2', '2 место', ''], ['--place-3', '3 место', '']]],
];

const SECTIONS = [
  ['ds-principles', 'Принципы'], ['ds-colors', 'Цвета'], ['ds-type', 'Типографика'], ['ds-buttons', 'Кнопки'],
  ['ds-chips', 'Чипы и места'], ['ds-forms', 'Поля ввода'], ['ds-scores', 'Баллы'], ['ds-progress', 'Прогресс'],
  ['ds-cards', 'Карточки'], ['ds-modal', 'Всплывающее окно'], ['ds-table', 'Таблица'], ['ds-nav', 'Навигация'], ['ds-shape', 'Форма и отступы'],
];

const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function sec(id, title, sub, content) {
  return `<section id="${id}" class="card stack" style="scroll-margin-top:90px;gap:18px"><div class="col" style="gap:4px"><h2>${title}</h2>${sub ? `<p class="muted small">${sub}</p>` : ''}</div>${content}</section>`;
}

export function render() {
  const s = st();
  const colors = COLOR_GROUPS.map(([g, list]) => `
    <div class="stack" style="gap:10px">
      <b class="small">${g}</b>
      <div class="swatches">${list.map(([v, name, use]) => `
        <div class="swatch"><div class="color" style="background:var(${v})"></div>
          <div class="meta"><b>${name}</b><code class="tok">${v}</code><span class="muted">${esc(token(v).toUpperCase())}${use ? ' · ' + use : ''}</span></div>
        </div>`).join('')}</div>
    </div>`).join('');

  const typeRows = [
    ['Заголовок страницы', '32 / 800 / −0.6', '<span style="font-size:32px;font-weight:800;letter-spacing:-.6px">Lash &amp; Brow Cup</span>'],
    ['Заголовок раздела', '24 / 800', '<span style="font-size:24px;font-weight:800">Ведомость работы</span>'],
    ['Заголовок карточки', '20 / 700', '<span style="font-size:20px;font-weight:700">Требует внимания</span>'],
    ['Большое число', '36 / 800 / −0.8', '<span style="font-size:36px;font-weight:800;letter-spacing:-.8px">71,38 %</span>'],
    ['Основной текст', '15 / 500', '<span>Ставьте 0 по критерию, если нет ракурса.</span>'],
    ['Подпись', '13 / 500, приглушённый', '<span class="small muted">Сохраняется автоматически</span>'],
    ['Метка группы', '12 / 800 / капс', '<span class="group-title">Сложность модели</span>'],
  ].map(([n, spec, demo]) => `<div class="type-row"><div class="spec"><b style="color:var(--ink)">${n}</b><br>${spec}</div><div>${demo}</div></div>`).join('');

  const body = `
    <div class="page-head">
      <div class="col" style="gap:8px">
        <h1>Дизайн-система</h1>
        <p class="muted">Ритм и структура — как у Т-Банка: белые карточки, чёрная активная вкладка, одна жёлтая кнопка на экран. Цвет — живой, от elementaree: оранжевый бренд, персиковые подложки. Шрифт Manrope — свободная замена Gilroy.</p>
      </div>
      <span class="chip peach">токены: app/css/tokens.css</span>
    </div>
    <div class="two-col">
      <nav class="side ds-nav" style="flex:0 0 200px" aria-label="Разделы дизайн-системы">
        ${SECTIONS.map(([id, t]) => `<a href="#/design" data-action="scroll" data-target="${id}">${t}</a>`).join('')}
      </nav>
      <div class="main stack" style="gap:20px">
        ${sec('ds-principles', 'Принципы', '', `
          <div class="grid-2">
            ${[
              ['Одна задача на экран', 'Судья оценивает, участник смотрит, организатор следит. Всё лишнее — на другом экране.'],
              ['Главное число крупно', 'Процент, балл, место — 36–40 px. Остальное мелко и серым.'],
              ['Один жёлтый акцент', 'Жёлтая кнопка — главное действие экрана. Второй такой нет.'],
              ['Ничего не теряется', 'Оценки сохраняются при каждом нажатии. Отправка — отдельный осознанный шаг.'],
              ['Ошибки предотвращаем', 'Кнопка «Отправить» неактивна, пока не заполнено всё. Баллы выбираются, а не вводятся.'],
              ['Приватность по умолчанию', 'Судья видит номер работы, участник — «Судья 1». Имена видит только организатор.'],
            ].map(([t, d]) => `<div class="col" style="gap:4px;padding:16px;border-radius:14px;background:var(--fill)"><b>${t}</b><span class="small muted">${d}</span></div>`).join('')}
          </div>`)}
        ${sec('ds-colors', 'Цвета', 'Значения читаются из CSS-переменных на лету: поменяйте tokens.css — изменится и эта страница, и всё приложение.', colors)}
        ${sec('ds-type', 'Типографика', 'Manrope 400–800. Цифры в таблицах — моноширинные (tabular-nums).', typeRows)}
        ${sec('ds-buttons', 'Кнопки', 'Высота 48 / 40 / 32, скругление 14 / 12 / 10. На экране не больше одной жёлтой.', `
          <div class="demo"><button class="btn primary">Отправить оценку</button><button class="btn brand">Брендовая</button><button class="btn dark">Тёмная</button><button class="btn">Второстепенная</button><button class="btn ghost">Прозрачная</button><button class="btn danger">Удалить</button><button class="btn" disabled>Неактивна</button></div>
          <div class="demo"><button class="btn s primary">Средняя</button><button class="btn s">${I.swap}<span>С иконкой</span></button><button class="btn xs">Маленькая</button><button class="btn icon" aria-label="Уведомления">${I.bell}</button><button class="btn primary pill">Пилюля</button></div>`)}
        ${sec('ds-chips', 'Чипы и места', 'Чип — статус или свойство. Место — отдельный компонент, цвет по месту.', `
          <div class="demo"><span class="chip">юниор</span><span class="chip ok"><span class="dot"></span>Итоги опубликованы</span><span class="chip warn"><span class="dot"></span>Идёт судейство</span><span class="chip danger">штраф</span><span class="chip info">инфо</span><span class="chip peach">шаблон</span><span class="chip dark">тёмный</span></div>
          <div class="demo">${placeChip(1)}${placeChip(2)}${placeChip(3)}${placeChip(0)}${placeChip(2, true)}<span class="place gp">Гран-при</span></div>`)}
        ${sec('ds-forms', 'Поля ввода', 'Высота 48, серая заливка, при фокусе — белая с оранжевой рамкой. Подпись над полем; обязательные помечены звёздочкой, необязательные — словом.', `
          <div class="grid-3">
            <div class="field req"><label for="ds-i1">Название</label><input id="ds-i1" class="input" value="Брови краска"></div>
            <div class="field"><label for="ds-i2">Блок</label><select id="ds-i2" class="input"><option>Брови</option><option>Ламинирование</option></select></div>
            <div class="field"><label for="ds-i3">Подсказка <span class="opt">необязательно</span></label><input id="ds-i3" class="input" placeholder="как у остальных"></div>
          </div>
          <div class="field"><label for="ds-i4">Комментарий участнику</label><textarea id="ds-i4" class="input" placeholder="Что получилось, что снизило балл, над чем поработать"></textarea></div>
          <div class="demo"><label class="check"><input type="checkbox" checked>Отмечено</label><label class="check"><input type="checkbox">Не отмечено</label></div>`)}
        ${sec('ds-scores', 'Баллы', 'Судья выбирает балл кнопкой, а не печатает. Кнопка 44 × 44 — удобно пальцем. Штраф — красный.', `
          <div class="crit" style="border-top:0;padding-top:0">
            <div class="crit-head"><div><div class="crit-name">Густота волосков</div><div class="crit-hint">Чем гуще, тем выше балл</div></div><div class="crit-val">3 <span>из 5</span></div></div>
            <div class="pills">${[0, 1, 2, 3, 4, 5].map((i) => `<button class="pill ${i === 3 ? 'on' : ''}">${i}</button>`).join('')}</div>
          </div>
          <div class="pills">${[0, -1, -2, -3].map((i) => `<button class="pill neg ${i === -2 ? 'on' : ''}">${i === 0 ? '0' : '−' + Math.abs(i)}</button>`).join('')}</div>`)}
        ${sec('ds-progress', 'Прогресс', 'Полоса 8 px. Зелёная — готово, жёлтая — в процессе, оранжевая — бренд.', `
          <div class="grid-3"><div class="col"><span class="small">Готово</span>${bar(1, 'ok')}</div><div class="col"><span class="small">В процессе</span>${bar(0.6, 'warn')}</div><div class="col"><span class="small">Бренд</span>${bar(0.4, 'brand')}</div></div>
          <div class="stage"><div class="step done"><div class="line"></div><div class="label">Приём работ</div></div><div class="step now"><div class="line"></div><div class="label">Судейство</div></div><div class="step"><div class="line"></div><div class="label">Проверка</div></div><div class="step"><div class="line"></div><div class="label">Оглашение</div></div></div>`)}
        ${sec('ds-cards', 'Карточки', 'Белая на сером фоне, скругление 20, без тени. Цветные — только для смысла.', `
          <div class="grid-3" style="background:var(--bg);padding:16px;border-radius:20px">
            <div class="card kpi"><span class="label">Работ</span><span class="value">${s.works.length}</span><span class="small muted">белая — основная</span></div>
            <div class="card peach stack" style="gap:6px"><b>Требует внимания</b><span class="small muted">персиковая — внимание</span></div>
            <div class="card lemon stack" style="gap:6px"><b>Подсказка</b><span class="small">лимонная — совет, предупреждение</span></div>
            <div class="card dark stack" style="gap:6px"><b>Гран-при</b><span class="small muted">тёмная — главный итог</span></div>
            <div class="hero" style="padding:24px;border-radius:20px"><b style="font-size:20px">Hero</b><p class="small muted">оранжевая — первый экран</p></div>
            <div class="attention"><b>Работа 209</b><span class="small muted">большой разброс оценок</span></div>
          </div>`)}
        ${sec('ds-modal', 'Всплывающее окно', 'Открывается по кнопке «Выйти» в шапке: сразу предлагает войти в другой роли. Закрывается крестиком, «Отменой», кликом мимо и клавишей Esc. На телефоне выезжает снизу.', `
          <div class="demo"><button class="btn primary" data-action="open-role-modal">Открыть окно «Выйти»</button></div>`)}
        ${sec('ds-table', 'Таблица', 'Строка 52 px, заголовки капсом 12 px, номер работы крупно.', `
          <div class="card flat" style="border:1px solid var(--line)"><table class="table"><thead><tr><th>Работа</th><th>Категория</th><th>Средний балл</th><th>Место</th></tr></thead><tbody>
            <tr><td class="work">ВК-303</td><td><span class="chip">юниор</span></td><td class="pct">71,38 %</td><td>${placeChip(1)}</td></tr>
            <tr><td class="work">ВК-302</td><td><span class="chip">мастер</span></td><td class="pct">74,25 %</td><td>${placeChip(2)}</td></tr>
          </tbody></table></div>`)}
        ${sec('ds-nav', 'Навигация', 'Вкладки: активная — чёрная. Фильтры внутри раздела — с обводкой.', `
          <div class="tabs"><button class="tab active">Не начаты <span class="count">2</span></button><button class="tab">Черновики <span class="count">1</span></button><button class="tab">Отправлены <span class="count">6</span></button></div>
          <div class="tabs"><button class="tab s active">Классика</button><button class="tab s">2-5 D</button><button class="tab s">Мокрый эффект</button></div>`)}
        ${sec('ds-shape', 'Форма и отступы', 'Скругления 10 / 14 / 20 / 28. Отступы кратны 4, между карточками 16–24.', `
          <div class="demo">${[['--r-s', 'S'], ['--r-m', 'M'], ['--r-l', 'L'], ['--r-xl', 'XL']].map(([v, n]) => `<div class="col" style="align-items:center"><div style="width:72px;height:72px;background:var(--peach);border-radius:var(${v})"></div><span class="xs muted">${n} · ${esc(token(v))}</span></div>`).join('')}</div>`)}
      </div>
    </div>`;
  return shell('design', body);
}

export const actions = {
  scroll: (el) => { document.getElementById(el.dataset.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
};
