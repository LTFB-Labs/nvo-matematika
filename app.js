/* The platform: pages by the address after # (home, test, practice, skills, progress).
   Tasks come from generators.js, descriptions from skills.js, data through data.js. */

const $ = s => document.querySelector(s);
const view = $('#view');
let cleanup = () => {};
const MON_AVERAGE_2026 = 62.9;
const percent = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const nameOf = n => TEMPLATES[n - 1].name;

/* Inside LevAcademy the name comes from the child's profile there */
async function childName() { return la?.child?.name || (await data.profile.get('me'))?.name || ''; }
async function saveName(name) { if (!la?.child) await data.profile.put({ id: 'me', name }); }

/* ---------- Home ---------- */
async function home() {
  const answers = await data.answers.all();
  const attempts = await data.attempts.all();
  const lastTest = attempts.filter(o => o.kind === 'test').sort((a, b) => b.at.localeCompare(a.at))[0];
  const rows = answers.length ? levelsOverTime(answers) : [];
  const latest = rows[rows.length - 1];
  const weakest = latest ? TEMPLATES.filter(s => latest.levels[s.number] !== null).sort((a, b) => latest.levels[a.number] - latest.levels[b.number]).slice(0, 3) : [];
  const name = await childName();
  view.innerHTML = `<section class="home">
    <div class="avatar" role="img" aria-label="Пухчето чете книга"></div>
    <h1>${name ? `Здравей, ${name}!` : 'Подготовка за НВО по математика'}</h1>
    <p class="lead">Задачите са като на истинския изпит в края на 4. клас: същите 25 типа, всеки път с нови числа.</p>
    ${name ? '' : `<form class="name-card" id="name-form"><label>Как се казваш? <input id="name-input" autocomplete="given-name" placeholder="Името ти" required></label><button class="primary">Запази</button><span class="note">Ще се изписва горе на всеки тест.</span></form>`}
    <div class="cards">
      <a class="card-link" href="#/test"><b>Пробен тест</b><span>25 задачи · 60 минути · 100 точки</span></a>
      <a class="card-link" href="#/types"><b>Упражнение по тип</b><span>10 задачи само от един тип</span></a>
      <a class="card-link" href="#/progress"><b>Напредък</b><span>нивото по типове задачи във времето</span></a>
      <a class="card-link" href="#/skills"><b>Умения</b><span>какво се иска за НВО, с примери</span></a>
    </div>
    ${latest?.expected != null ? `<p class="last-result">Нивото сега: около <b>${latest.expected} точки</b> на НВО (по ${latest.typeCount} от 25 типа).</p>` : ''}
    ${lastTest ? `<p class="last-result">Последен пробен тест: <b>${lastTest.points} от 100</b> (${mark(lastTest.points)}).</p>` : ''}
    ${weakest.length ? `<div class="weak"><h2>Упражнявай тези</h2>${weakest.map(s => `<a class="row" href="#/practice/${s.number}"><span class="name">${s.name}</span><span class="pct">${latest.levels[s.number]} %</span></a>`).join('')}</div>` : ''}
    <div class="theme-picker">Вид: ${THEMES.map(t => `<button class="chip-btn ${currentTheme() === t.id ? 'active' : ''}" data-theme="${t.id}">${t.name}</button>`).join('')}</div>
  </section>`;
  view.querySelectorAll('[data-theme]').forEach(b => { b.onclick = () => { setTheme(b.dataset.theme); home(); }; });
  const form = $('#name-form');
  if (form) form.onsubmit = async e => { e.preventDefault(); const v = $('#name-input').value.trim(); if (v) { await saveName(v); home(); } };
}

/* ---------- Practice test and practice ---------- */
function resultHtml(result, opts) {
  const wrong = result.answers.filter(z => !z.correct);
  const types = [...new Set(wrong.map(z => z.number))];
  const slowest = [...result.answers].map((z, i) => ({ ...z, i })).sort((a, b) => b.seconds - a.seconds).slice(0, 3);
  return `<div class="result-card">
    <div class="big-score"><b>${result.points}</b> от ${result.max} точки${opts.test ? ` · ${mark(result.points)}` : ` · ${percent(result.points, result.max)} %`}</div>
    <p>Време: ${mmss(result.seconds)} · верни ${result.answers.length - wrong.length} от ${result.answers.length} · най-дълго: ${slowest.map(z => `№ ${z.i + 1} (${mmss(z.seconds)})`).join(', ')}</p>
    ${opts.test ? `<p class="note">Средният резултат на НВО 2026 е ${MON_AVERAGE_2026} точки. При задачите с решение тук се проверява само отговорът; на изпита учителят дава точки и за решението.</p>` : ''}
    ${types.length ? `<h3>Упражнявай</h3><div class="chips">${types.map(n => `<a class="chip" href="#/practice/${n}">${nameOf(n)}</a>`).join('')}</div>` : '<p>Всичко е вярно. Браво!</p>'}
    <div class="button-row"><button class="primary" id="again">${opts.test ? 'Нов пробен тест' : 'Още 10 задачи'}</button><a class="btn" href="#/">Към началото</a></div>
  </div>`;
}

async function startSheet({ tasks, mode, title, subtitle, minutes, record }) {
  const name = await childName();
  view.innerHTML = '<div id="result"></div><div id="sheet-root"></div>';
  cleanup = openSheet($('#sheet-root'), {
    tasks, mode, title, subtitle, minutes, name,
    onName: saveName,
    onDone: async result => {
      const { answers, ...attempt } = result;
      const sent = await saveAttempt({ ...record, at: new Date().toISOString(), ...attempt }, answers);
      $('#result').innerHTML = resultHtml(result, { test: mode === 'test' }) + (sent ? '' : '<p class="note">Не успяхме да запишем резултата. Провери интернета.</p>');
      $('#again').onclick = () => route(true);
      setTimeout(() => scrollTo(0, 0), 60);
    },
  });
}

function test() {
  const seed = Math.floor(Math.random() * 1e6);
  return startSheet({ tasks: makeTest(seed), mode: 'test', title: 'Национално външно оценяване в края на IV клас<br>Тест по математика', subtitle: `Пробен тест по модела на НВО · вариант ${seed}`, minutes: 60, record: { kind: 'test', seed } });
}

function practice(n) {
  const seed = Math.floor(Math.random() * 1e6);
  const tasks = Array.from({ length: 10 }, (_, i) => makeTask(n, seed + i * 7777));
  return startSheet({ tasks, mode: 'practice', title: `Упражнение по математика, IV клас<br>${nameOf(n)}`, subtitle: `${AREAS[SKILLS[n].area]} · 10 задачи`, record: { kind: 'practice', number: n, seed } });
}

/* ---------- List of task types ---------- */
function byArea(render) {
  return Object.entries(AREAS).map(([k, name]) => `<h2>${name}</h2>${TEMPLATES.filter(s => SKILLS[s.number].area === k).map(render).join('')}`).join('');
}
async function typesPage() {
  const answers = await data.answers.all();
  const latest = answers.length ? levelsOverTime(answers).pop() : null;
  view.innerHTML = `<section class="page"><h1>Упражнение по тип задача</h1>
    <p class="lead">Избери тип: 10 задачи само от него. След всяка задача виждаш дали е вярно и как се решава.</p>
    ${byArea(s => `<a class="row type-row" href="#/practice/${s.number}"><span class="n">${s.number}</span><span class="name">${s.name}</span>
      <span class="pct">${latest?.levels[s.number] != null ? `ниво ${latest.levels[s.number]} %` : ''}</span></a>`)}</section>`;
}

/* ---------- Skills: documentation with examples ---------- */
function exampleHtml(t) {
  const optionsHtml = t.options ? `<ul class="option-list">${Object.entries(t.options).map(([k, v]) => `<li><b>${k})</b> ${v}</li>`).join('')}</ul>` : '';
  const partsHtml = t.parts ? `<ol class="option-list" type="А">${t.parts.map(p => `<li>${p.text}</li>`).join('')}</ol>` : '';
  const solution = t.parts ? t.parts.map(p => `<b>${p.letter})</b> ${p.solution} <b>${p.answer}</b>`).join('<br>') : `${t.solution} <b>Отговор: ${t.options ? `${t.answer}) ${t.options[t.answer]}` : t.answer}</b>`;
  return `<div class="example"><p>${t.text}</p>${t.drawing ? `<div class="drawing">${t.drawing}</div>` : ''}${optionsHtml}${partsHtml}
    <details><summary>Покажи отговора</summary><p>${solution}</p></details></div>`;
}
function skillsPage() {
  view.innerHTML = `<section class="page"><h1>Умения за НВО по математика</h1>
    <p class="lead">Тестът има 25 задачи и всяка година на едно и също място стои един и същи тип задача. Тук е всеки тип: какво проверява, какво пише в учебната програма на МОН, от кой клас е и пример. Примерите са нови при всяко отваряне.</p>
    ${byArea(s => { const u = SKILLS[s.number]; return `<article class="skill" id="skill-${s.number}">
      <h3><span class="n">${s.number}</span> ${s.name}</h3>
      <p>${u.description}</p>
      <dl><dt>Програма на МОН</dt><dd>${u.curriculum}</dd><dt>Учи се в</dt><dd>${u.grade} клас</dd><dt>В НВО</dt><dd>${u.frequency}; ${s.points} т.</dd></dl>
      ${u.hard ? `<p class="hard">${u.hard}</p>` : ''}
      ${exampleHtml(makeTask(s.number, Math.floor(Math.random() * 1e6)))}
      <a class="btn" href="#/practice/${s.number}">Упражнявай</a></article>`; })}</section>`;
}

/* ---------- Routes ---------- */
async function route(force) {
  cleanup(); cleanup = () => {};
  const [p, arg] = location.hash.replace(/^#\/?/, '').split('/');
  document.querySelectorAll('.main-nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#/${p}` || (p === 'practice' && a.getAttribute('href') === '#/types')));
  document.body.classList.toggle('in-test', p === 'test' || p === 'practice');
  if (!force) scrollTo(0, 0);
  if (p === 'test') await test();
  else if (p === 'practice' && TEMPLATES[Number(arg) - 1]) await practice(Number(arg));
  else if (p === 'types') await typesPage();
  else if (p === 'skills') skillsPage();
  else if (p === 'progress') await progressPage(view);
  else await home();
}
addEventListener('hashchange', () => route());
/* Opened alone the app starts now; inside LevAcademy academy-app.js starts it after it connects. */
if (!window.NVO_EMBEDDED) route();
