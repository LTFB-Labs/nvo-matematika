/* Темите: всяка е папка в temi/ с tema.css (цветове, шрифтове, иконки, картинки).
   Изборът се пази в браузъра; ?tema=bezhova в адреса избира тема за момента.
   Зарежда се в <head>, преди страницата да се нарисува, за да няма премигване. */

const TEMI = [
  { id: 'sinya', ime: 'Синя' },
  { id: 'bezhova', ime: 'Бежова' },
];
const TEMA_KEY = 'nvo4.tema';

function izberiTema(id, zapazi = true) {
  if (!TEMI.some(t => t.id === id)) id = TEMI[0].id;
  document.getElementById('tema-css').href = `temi/${id}/tema.css`;
  document.documentElement.dataset.tema = id;
  if (zapazi) { try { localStorage.setItem(TEMA_KEY, id); } catch { /* частен режим: важи до затваряне */ } }
}

function segashnaTema() { return document.documentElement.dataset.tema || TEMI[0].id; }

(() => {
  const otAdresa = new URLSearchParams(location.search).get('tema');
  let zapazena = null;
  try { zapazena = localStorage.getItem(TEMA_KEY); } catch { /* нищо */ }
  izberiTema(otAdresa || zapazena || TEMI[0].id, false);
})();
