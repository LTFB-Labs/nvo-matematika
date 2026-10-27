/* Themes: each one is a folder in themes/ with theme.css (colours, fonts, icons, images).
   The choice is kept in the browser; ?theme=beige in the address picks a theme for now.
   Loaded in <head>, before the page is painted, so there is no flash. */

const THEMES = [
  { id: 'blue', name: 'Синя' },
  { id: 'beige', name: 'Бежова' },
];
const THEME_KEY = 'nvo4-math.theme';
/* The first version kept the theme under another key with Bulgarian ids; the old key is left as it is. */
const OLD_THEME_KEY = 'nvo4.tema';
const OLD_THEME_IDS = { sinya: 'blue', bezhova: 'beige' };

function setTheme(id, save = true) {
  if (!THEMES.some(t => t.id === id)) id = THEMES[0].id;
  document.getElementById('theme-css').href = `themes/${id}/theme.css`;
  document.documentElement.dataset.theme = id;
  if (save) { try { localStorage.setItem(THEME_KEY, id); } catch { /* private mode: lasts until the tab closes */ } }
}

function currentTheme() { return document.documentElement.dataset.theme || THEMES[0].id; }

(() => {
  const fromUrl = new URLSearchParams(location.search).get('theme');
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
    const old = OLD_THEME_IDS[localStorage.getItem(OLD_THEME_KEY)];
    if (saved === null && old) { saved = old; localStorage.setItem(THEME_KEY, old); }
  } catch { /* nothing */ }
  setTheme(fromUrl || saved || THEMES[0].id, false);
})();
