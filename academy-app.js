// @ts-check
// НВО по математика inside LevAcademy: the shell loads this module in its sandboxed frame and calls mount().
// The app itself stays the same: its markup, styles and classic scripts are put into the frame; its data goes
// to the shell (core.appData) instead of this browser, and its medals go to the child's profile (grantUserBadge).
// Opened alone (index.html) the app does not use this file.
import { defineApp } from '../core/academy-core/app.js';

const base = new URL('.', import.meta.url);
const SCRIPTS = ['theme.js', 'core.js', 'generators.js', 'skills.js', 'data.js', 'progress.js', 'sheet.js', 'app.js'];
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
  name: 'НВО по математика',
  description: 'Пробни тестове и упражнения за изпита в края на 4. клас.',
  icon: 'themes/blue/img/avatar.png',
  route: 'nvo',
  grades: [4],
  contract: 2,
  permissions: ['user', 'storage', 'badges'],

  async mount(el, core) {
    document.documentElement.lang = 'bg';
    document.title = 'НВО по математика · 4. клас';
    addStyle('themes/blue/theme.css', 'theme-css');
    STYLES.forEach((href) => addStyle(href));
    el.innerHTML = `<header class="topbar">
      <a class="logo" href="#/">НВО · математика</a>
      <nav class="main-nav">
        <a href="#/test">Пробен тест</a>
        <a href="#/types">Упражнения</a>
        <a href="#/progress">Напредък</a>
        <a href="#/skills">Умения</a>
      </nav>
    </header>
    <main id="view"></main>`;

    /** @type {any} */ (window).NVO_EMBEDDED = true;
    for (const src of SCRIPTS) await addScript(src);

    const w = /** @type {any} */ (window);
    w.useAcademyCore(core, await core.getUser());
    // The address inside the app follows the shell's: /app/#/nvo/test opens the test.
    if (core.route) location.hash = `#/${core.route}`;
    addEventListener('hashchange', () => core.navigate(location.hash.replace(/^#\/?/, '')));
    await w.route();
  },
});
