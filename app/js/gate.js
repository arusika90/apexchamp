// Простой пароль на вход. Защита от случайных глаз, не от взлома: проверка идёт в браузере.
// Чтобы сменить пароль, положите сюда SHA-256 нового пароля (в терминале: printf 'пароль' | shasum -a 256).
import { esc, I } from './ui.js';

export const GATE = {
  enabled: true,
  sha256: 'f4e25a08a258dfb7a56739bc2448439bedd8fe13d534cfe8f6d3e1b3439d78d3',
  storageKey: 'predragovic.gate',
};

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function isUnlocked() {
  if (!GATE.enabled) return true;
  try { return localStorage.getItem(GATE.storageKey) === GATE.sha256; } catch (e) { return false; }
}

export function renderGate(error = '') {
  return `
  <div class="gate">
    <form class="gate-card" data-form="gate" autocomplete="off">
      <span class="logo-mark" style="width:44px;height:44px;border-radius:14px">${I.lash.replace('<svg', '<svg width="26" height="26"')}</span>
      <div class="col" style="gap:6px">
        <h1 style="font-size:28px" class="wordmark">apex<span>champ</span></h1>
        <p class="muted">Закрытая демо-версия. Введите пароль, который вам дали.</p>
      </div>
      <div class="field">
        <label for="gate-pass">Пароль</label>
        <input id="gate-pass" class="input" type="password" name="password" required autofocus aria-describedby="gate-err">
        <span id="gate-err" class="small" style="color:var(--danger);min-height:18px">${esc(error)}</span>
      </div>
      <button class="btn primary" type="submit">Войти</button>
    </form>
  </div>`;
}

// Возвращает true, когда можно запускать приложение.
export function gate(onUnlock) {
  if (isUnlocked()) return true;
  const app = document.getElementById('app');
  app.innerHTML = renderGate();
  app.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-form="gate"]');
    if (!form) return;
    e.preventDefault();
    const pass = form.password.value;
    const hash = await sha256(pass);
    if (hash === GATE.sha256) {
      try { localStorage.setItem(GATE.storageKey, hash); } catch (err) { /* приватный режим: пустим на этот раз */ }
      onUnlock();
    } else {
      app.innerHTML = renderGate('Пароль не подошёл');
      document.getElementById('gate-pass')?.focus();
    }
  });
  return false;
}
