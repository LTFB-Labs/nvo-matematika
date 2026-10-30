// @ts-check
// НВО по математика inside LevAcademy: the shell loads this module in its sandboxed frame and calls mount().
// The app itself stays the same: its markup, styles and classic scripts are put into the frame; its data goes
// to the shell (core.appData) instead of this browser, and its medals go to the child's profile (grantUserBadge).
// Opened alone (index.html) the app does not use this file.
import { defineApp } from '../core/academy-core/app.js';

const base = new URL('.', import.meta.url);
const SCRIPTS = ['theme.js', 'core.js', 'generators.js', 'skills.js', 'grades.js', 'data.js', 'progress.js', 'sheet.js', 'practice.js', 'app.js'];
const STYLES = ['drawings.css', 'platform.css'];

/** @param {string} href @param {string} [id] */
function addStyle(href, id) {
  const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: new URL(href, base).href });
  if (id) link.id = id;
  document.head.append(link);
}

/** Classic scripts, one after another, as index.html loads them. @param {string} src */
function addScript(src) {
  return new Promise((resolve, reject) => {
    const script = Object.assign(document.createElement('script'), { src: new URL(src, base).href, async: false });
    script.onload = resolve;
    script.onerror = () => reject(new Error(`${src} не се зареди`));
    document.head.append(script);
  });
}

export default defineApp({
  id: 'nvo-matematika',
  name: 'Математика',
  description: 'Уменията по програмата на МОН за 1.–7. клас и подготовка за НВО в 4. клас.',
  icon: 'themes/blue/img/avatar.png',
  route: 'nvo',
  grades: [1, 2, 3, 4, 5, 6, 7],
  contract: 2,
  permissions: ['user', 'storage', 'badges'],

  async mount(el, core) {
    document.documentElement.lang = 'bg';
    document.title = 'Математика · 1.–7. клас и НВО';
    addStyle('themes/blue/theme.css', 'theme-css');
    STYLES.forEach((href) => addStyle(href));
    el.innerHTML = `<header class="topbar">
      <a class="logo" href="#/">Математика</a>
      <nav class="main-nav">
        <a href="#/">Класове</a>
        <a href="#/nvo4">НВО 4. клас</a>
        <a href="#/nvo7">НВО 7. клас</a>
      </nav>
    </header>
    <nav class="sub-nav" aria-label="НВО в 4. клас">
      <a href="#/nvo4">Начало</a>
      <a href="#/nvo4/test">Пробен тест</a>
      <a href="#/nvo4/types">Упражнения</a>
      <a href="#/nvo4/progress">Напредък</a>
      <a href="#/nvo4/skills">Умения за НВО</a>
    </nav>
    <main id="view"></main>`;

    /** @type {any} */ (window).NVO_EMBEDDED = true;
    for (const src of SCRIPTS) await addScript(src);

    const w = /** @type {any} */ (window);
    w.useAcademyCore(core, await core.getUser());
    // The address inside the app follows the shell's: /app/#/nvo/nvo4/test opens the test.
    if (core.route) location.hash = `#/${core.route}`;
    addEventListener('hashchange', () => core.navigate(location.hash.replace(/^#\/?/, '')));
    await w.route();
  },
});
