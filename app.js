/* The platform: pages by the address after # — home (grades + НВО), grade/N, nvo4 (home, test, types,
   practice, progress, skills) and nvo7. Tasks come from generators.js, НВО descriptions from skills.js,
   MON skills per grade from grades.js, data through data.js. */

const $ = s => document.querySelector(s);
const view = $('#view');
let cleanup = () => {};
const MON_AVERAGE_2026 = 62.9;
const percent = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const nameOf = n => TEMPLATES[n - 1].name;

/* Inside LevAcademy the name comes from the child's profile there */
async function childName() { return la?.child?.name || (await data.profile.get('me'))?.name || ''; }
async function saveName(name) { if (!la?.child) await data.profile.put({ id: 'me', name }); }

/* ---------- Home: grades and НВО ---------- */
async function home() {
  const name = await childName();
  view.innerHTML = `<section class="home">
    <div class="avatar" role="img" aria-label="Пухчето чете книга"></div>
    <h1>${name ? `Здравей, ${name}!` : 'Математика'}</h1>
    <p class="lead">По учебната програма на МОН: какво трябва да може детето във всеки клас и подготовка за НВО.</p>
    <h2>Класове</h2>
    <div class="cards grade-cards">${GRADES.map(g => `<a class="card-link" href="#/grade/${g.grade}"><b>${g.grade}. клас</b><span>${g.range}</span></a>`).join('')}</div>
    <h2>Национално външно оценяване</h2>
    <div class="cards">
      <a class="card-link" href="#/nvo4"><b>НВО в 4. клас</b><span>пробни тестове, упражнения и напредък</span></a>
      <a class="card-link" href="#/nvo7"><b>НВО в 7. клас</b><span>скоро</span></a>
    </div>
    <div class="theme-picker">Вид: ${THEMES.map(t => `<button class="chip-btn ${currentTheme() === t.id ? 'active' : ''}" data-theme="${t.id}">${t.name}</button>`).join('')}</div>
  </section>`;
  view.querySelectorAll('[data-theme]').forEach(b => { b.onclick = () => { setTheme(b.dataset.theme); home(); }; });
}

/* ---------- A grade: MON skills ---------- */
function gradePage(n) {
  const g = GRADES.find(x => x.grade === n);
  view.innerHTML = `<section class="page">
    <nav class="grade-strip" aria-label="Класове">${GRADES.map(x => `<a class="chip ${x.grade === n ? 'active' : ''}" href="#/grade/${x.grade}">${x.grade}. клас</a>`).join('')}</nav>
    <h1>Математика · ${n}. клас</h1>
    <p class="lead">${g.intro}</p>
    ${g.nvo ? `<a class="card-link nvo-link" href="#/${g.nvo}"><b>НВО в ${n}. клас</b><span>${g.nvo === 'nvo4' ? 'пробни тестове, упражнения и напредък' : 'скоро'}</span></a>` : ''}
    <h2>Умения по МОН</h2>
    <p>Какво трябва да може детето в края на ${n}. клас според учебната програма.</p>
    ${g.results.map(a => `<article class="skill"><h3>${a.area}</h3><ul>${a.items.map(i => `<li>${i}</li>`).join('')}</ul></article>`).join('')}
    <h2>По теми</h2>
    <p class="note">Темите се учат в този ред.</p>
    ${g.topics.map((t, i) => `<details class="topic"><summary><span class="n">${i + 1}</span> ${t.name}</summary>
      <ul>${t.items.map(x => `<li>${x}</li>`).join('')}</ul>${t.terms ? `<p class="terms"><b>Нови понятия:</b> ${t.terms}</p>` : ''}</details>`).join('')}
    <p class="note source">Източник: <a href="${g.source}" target="_blank" rel="noopener">Учебна програма по математика за ${g.roman} клас</a> (<a href="${MON_PROGRAMS}" target="_blank" rel="noopener">всички програми на МОН</a>).</p>
  </section>`;
}

/* ---------- НВО in 7th grade: not started ---------- */
function nvo7Page() {
  view.innerHTML = `<section class="page">
    <h1>НВО по математика в 7. клас</h1>
    <p class="lead">TODO: тук ще бъде подготовката за изпита в края на 7. клас — пробни тестове по модела на МОН, упражнения по тип задача и напредък. Засега работим по НВО в 4. клас.</p>
    <a class="btn" href="#/grade/7">Умения по МОН за 7. клас</a>
  </section>`;
}

/* ---------- НВО in 4th grade: home ---------- */
async function nvo4Home() {
  const answers = await data.answers.all();
  const attempts = await data.attempts.all();
  const lastTest = attempts.filter(o => o.kind === 'test').sort((a, b) => b.at.localeCompare(a.at))[0];
  const rows = answers.length ? levelsOverTime(answers) : [];
  const latest = rows[rows.length - 1];
  const weakest = latest ? TEMPLATES.filter(s => latest.levels[s.number] !== null).sort((a, b) => latest.levels[a.number] - latest.levels[b.number]).slice(0, 3) : [];
  const name = await childName();
  view.innerHTML = `<section class="home">
    <div class="avatar" role="img" aria-label="Пухчето чете книга"></div>
    <h1>${name ? `Здравей, ${name}!` : 'НВО по математика в 4. клас'}</h1>
    <p class="lead">Задачите са като на истинския изпит в края на 4. клас: същите 25 типа, всеки път с нови числа.</p>
    ${name ? '' : `<form class="name-card" id="name-form"><label>Как се казваш? <input id="name-input" autocomplete="given-name" placeholder="Името ти" required></label><button class="primary">Запази</button><span class="note">Ще се изписва горе на всеки тест.</span></form>`}
    <div class="cards">
      <a class="card-link" href="#/nvo4/test"><b>Пробен тест</b><span>25 задачи · 60 минути · 100 точки</span></a>
      <a class="card-link" href="#/nvo4/types"><b>Упражнения по тип</b><span>задача след задача, докато стигнеш 100</span></a>
      <a class="card-link" href="#/nvo4/progress"><b>Напредък</b><span>нивото по типове задачи във времето</span></a>
      <a class="card-link" href="#/nvo4/skills"><b>Умения за НВО</b><span>какво се иска за НВО, с примери</span></a>
    </div>
    ${latest?.expected != null ? `<p class="last-result">Нивото сега: около <b>${latest.expected} точки</b> на НВО (по ${latest.typeCount} от 25 типа).</p>` : ''}
    ${lastTest ? `<p class="last-result">Последен пробен тест: <b>${lastTest.points} от 100</b> (${mark(lastTest.points)}).</p>` : ''}
    ${weakest.length ? `<div class="weak"><h2>Упражнявай тези</h2>${weakest.map(s => `<a class="row" href="#/nvo4/practice/${s.number}"><span class="name">${s.name}</span><span class="pct">${latest.levels[s.number]} %</span></a>`).join('')}</div>` : ''}
  </section>`;
  const form = $('#name-form');
  if (form) form.onsubmit = async e => { e.preventDefault(); const v = $('#name-input').value.trim(); if (v) { await saveName(v); nvo4Home(); } };
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
    ${types.length ? `<h3>Упражнявай</h3><div class="chips">${types.map(n => `<a class="chip" href="#/nvo4/practice/${n}">${nameOf(n)}</a>`).join('')}</div>` : '<p>Всичко е вярно. Браво!</p>'}
    <div class="button-row"><button class="primary" id="again">Нов пробен тест</button><a class="btn" href="#/nvo4">Към НВО</a></div>
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
  const root = document.createElement('div');
  view.replaceChildren(root);
  cleanup = openPractice(root, { number: n });
}

/* ---------- List of task types ---------- */
function byArea(render) {
  return Object.entries(AREAS).map(([k, name]) => `<h2>${name}</h2>${TEMPLATES.filter(s => SKILLS[s.number].area === k).map(render).join('')}`).join('');
}
async function typesPage() {
  const answers = await data.answers.all();
  const latest = answers.length ? levelsOverTime(answers).pop() : null;
  view.innerHTML = `<section class="page"><h1>Упражнение по тип задача</h1>
    <p class="lead">Избери тип и решавай задачи само от него. След всяка задача виждаш дали е вярно и как се решава. Резултатът стига до 100, когато типът е усвоен.</p>
    ${byArea(s => `<a class="row type-row" href="#/nvo4/practice/${s.number}"><span class="n">${s.number}</span><span class="name">${s.name}</span>
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
      <a class="btn" href="#/nvo4/practice/${s.number}">Упражнявай</a></article>`; })}</section>`;
}

/* ---------- Routes ----------
   #/ · #/grade/N · #/nvo7 · #/nvo4 and #/nvo4/test | types | practice/N | progress | skills */
const NVO4_PAGES = { test, types: typesPage, skills: skillsPage, progress: () => progressPage(view) };

async function route(force) {
  cleanup(); cleanup = () => {};
  const [p, sub, arg] = location.hash.replace(/^#\/?/, '').split('/');
  const nvo4Page = p === 'nvo4' ? (sub === 'practice' ? 'types' : sub || '') : null;
  document.querySelectorAll('.main-nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#/${p === 'grade' ? '' : p}`));
  document.querySelectorAll('.sub-nav a').forEach(a => a.classList.toggle('active', nvo4Page !== null && a.getAttribute('href') === `#/nvo4${nvo4Page ? `/${nvo4Page}` : ''}`));
  document.body.classList.toggle('in-nvo4', p === 'nvo4');
  document.body.classList.toggle('in-test', p === 'nvo4' && sub === 'test');
  if (!force) scrollTo(0, 0);
  if (p === 'grade' && GRADES.some(g => g.grade === Number(sub))) gradePage(Number(sub));
  else if (p === 'nvo7') nvo7Page();
  else if (p === 'nvo4' && sub === 'practice' && TEMPLATES[Number(arg) - 1]) practice(Number(arg));
  else if (p === 'nvo4' && NVO4_PAGES[sub]) await NVO4_PAGES[sub]();
  else if (p === 'nvo4') await nvo4Home();
  else await home();
}
addEventListener('hashchange', () => route());
/* Opened alone the app starts now; inside LevAcademy academy-app.js starts it after it connects. */
if (!window.NVO_EMBEDDED) route();
