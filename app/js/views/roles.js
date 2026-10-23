// Вход по ролям: можно посмотреть систему глазами любой роли, выйти и войти в другую.
import { st, sessionUser, roleHome } from '../store.js';
import { esc, I } from '../ui.js';
import { ROLE_NAME, logoMark, wordmark, shell, personaButton } from './common.js';
import { PERSONAS, currentState } from '../personas.js';
import { CATEGORIES } from '../ui.js';

// Регистрация нового участника. Без пароля: вход пока по выбору роли, настоящая авторизация придёт с сервером.
export function register() {
  const s = st();
  const body = `
    <div class="page-head"><div class="col" style="gap:8px"><h1>Регистрация участника</h1><p class="muted">Чемпионат ${esc(s.championship.name)}. Имя и инстаграм увидит только организатор, в таблицах вы будете номером работы.</p></div></div>
    <div class="two-col">
      <form class="main card stack" data-form="register" autocomplete="on" style="max-width:640px">
        <div class="grid-2">
          <div class="field"><label for="r-name">Имя и фамилия</label><input id="r-name" name="name" class="input" required placeholder="Как в дипломе"></div>
          <div class="field"><label for="r-insta">Инстаграм</label><input id="r-insta" name="insta" class="input" placeholder="@ваш_ник"></div>
          <div class="field"><label for="r-country">Страна</label><input id="r-country" name="country" class="input" placeholder="Беларусь"></div>
          <div class="field"><label for="r-email">Почта</label><input id="r-email" name="email" class="input" type="email" placeholder="для дипломов и уведомлений"></div>
        </div>
        <div class="field">
          <label for="r-cat">Категория</label>
          <select id="r-cat" name="cat" class="input">${CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}</select>
          <span class="xs muted">Юниор — до 1,5 лет в профессии, мастер — до 3 лет, эксперт — от 3 лет или преподаёт. Организатор может уточнить категорию.</span>
        </div>
        <label class="check small"><input type="checkbox" required>Согласна на обработку данных и публикацию фото работ после оглашения</label>
        <div class="row"><button class="btn primary" type="submit">Создать аккаунт</button><a class="btn" href="#/roles">Отмена</a></div>
      </form>
      <aside class="side">
        <section class="card peach stack" style="gap:8px">
          <h3>Что дальше</h3>
          <p class="small">После регистрации вы попадёте в кабинет. Пока идёт приём работ, там можно подать работу в номинацию и получить её номер. После оглашения — увидеть проценты, место и комментарии судей.</p>
        </section>
      </aside>
    </div>`;
  return shell('', body);
}

export function render() {
  const s = st();
  const u = sessionUser();
  const role = s.session?.role;
  const card = (r, iconBg, iconColor, icon, title, text, extra = '') => `
    <div class="role ${role === r ? 'active' : ''}">
      <span class="icon" style="background:${iconBg};color:${iconColor}">${icon}</span>
      <h3>${title}</h3>
      <p class="small muted">${text}</p>
      <div class="persona-list">${PERSONAS[r].map((pr) => personaButton(r, pr)).join('')}</div>
      ${extra}
    </div>`;

  return `
  <div class="login">
    <div class="login-in">
      <div class="row-between">
        <a class="logo" href="#/roles">${logoMark()}${wordmark()}</a>
        ${u ? `<div class="row"><span class="chip">${esc(u.name)} · ${ROLE_NAME[role]}${currentState() ? ' · ' + esc(currentState()) : ''}</span><a class="btn s primary" href="#/${roleHome(role)}">Продолжить</a><button class="btn s" data-action="logout">${I.logout}<span>Выйти</span></button></div>` : ''}
      </div>

      <section class="hero stack">
        <span class="chip" style="background:rgba(255,255,255,.2);color:#fff;align-self:flex-start">Демо · ${esc(s.championship.name)}</span>
        <h1>Судейство бьюти-чемпионатов<br>без таблиц и ручного подсчёта</h1>
        <p class="muted" style="max-width:680px;font-size:17px">Выберите роль и её состояние: до, во время или после чемпионата. Этап переключится сам, а в шапке будет подписано, в каком состоянии вы смотрите систему. Данные живут только в этом браузере.</p>
      </section>

      <div class="role-grid">
        ${card('org', 'var(--peach)', 'var(--brand)', I.sliders, 'Организатор', 'Видит всё, правит оценки, публикует итоги.')}
        ${card('judge', 'var(--lemon)', 'var(--warn)', I.gavel, 'Судья', 'Видит только номера работ, ставит баллы и пишет комментарий.')}
        ${card('part', 'var(--ok-bg)', 'var(--ok)', I.user, 'Участник', 'Подаёт работы, потом видит проценты, место и комментарии.', '<a class="small b" href="#/register">Нет аккаунта? Зарегистрироваться</a>')}
        ${card('guest', 'var(--fill)', 'var(--ink)', I.globe, 'Гость', 'Публичная таблица без имён участников.')}
        ${card('designer', 'var(--peach)', 'var(--brand)', I.palette, 'Дизайнер', 'Библиотека дизайн-системы.')}
      </div>

      <div class="grid-2">
        <section class="card stack">
          <h3>Служебное</h3>
          <p class="small muted">Текущий этап: <b style="color:var(--ink)">${{ submission: 'приём работ', judging: 'судейство', published: 'итоги опубликованы' }[s.championship.stage]}</b>. Вернуть все оценки, работы и настройки к исходным:</p>
          <button class="btn s" style="align-self:flex-start" data-action="reset-data">Сбросить демо-данные</button>
        </section>
        <section class="card peach stack">
          <h3>Что попробовать</h3>
          <ol class="small" style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px">
            <li><b>Участник · до подачи</b>: подайте работу, отметьте фото по ракурсам, заявитесь на Гран-при.</li>
            <li><b>Судья · в процессе</b>: оцените ВК-301, отправьте, посмотрите, как растёт прогресс.</li>
            <li><b>Организатор · судейство</b>: на обзоре видно, кто не закончил. Откройте работу 209 с большим разбросом и поправьте оценку.</li>
            <li><b>Организатор → Места и Гран-при</b>: переключите правило с порогов на рейтинг.</li>
            <li><b>Участник · победа</b>: Гран-при, первые места, комментарии судей.</li>
          </ol>
        </section>
      </div>
    </div>
  </div>`;
}

