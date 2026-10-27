/* Платформата: страници по адреса след # (начало, тест, упражнения, умения, напредък).
   Задачите идват от generatori.js, описанията от umenia.js, данните през danni.js. */

const $ = s => document.querySelector(s);
const izgled = $('#izgled');
let pochisti = () => {};
const MON_SREDNO_2026 = 62.9;
const procent = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const imeNa = n => SABLONI[n - 1].ime;

async function imeNaDeteto() { return (await danni.profil.get('az'))?.ime || ''; }
async function zapaziIme(ime) { await danni.profil.put({ id: 'az', ime }); }

/* ---------- Начало ---------- */
async function nachalo() {
  const reshenia = await danni.reshenia.all();
  const opiti = await danni.opiti.all();
  const posleden = opiti.filter(o => o.vid === 'test').sort((a, b) => b.koga.localeCompare(a.koga))[0];
  const red = reshenia.length ? nivaVavVremeto(reshenia) : [];
  const sega = red[red.length - 1];
  const slabi = sega ? SABLONI.filter(s => sega.niva[s.nomer] !== null).sort((a, b) => sega.niva[a.nomer] - sega.niva[b.nomer]).slice(0, 3) : [];
  const ime = await imeNaDeteto();
  izgled.innerHTML = `<section class="nachalo">
    <div class="avatar" role="img" aria-label="Пухчето чете книга"></div>
    <h1>${ime ? `Здравей, ${ime}!` : 'Подготовка за НВО по математика'}</h1>
    <p class="vodach">Задачите са като на истинския изпит в края на 4. клас: същите 25 типа, всеки път с нови числа.</p>
    ${ime ? '' : `<form class="ime-karta" id="ime-forma"><label>Как се казваш? <input id="ime-nachalo" autocomplete="given-name" placeholder="Името ти" required></label><button class="glaven">Запази</button><span class="belezhka">Ще се изписва горе на всеки тест.</span></form>`}
    <div class="karti">
      <a class="karta-g" href="#/test"><b>Пробен тест</b><span>25 задачи · 60 минути · 100 точки</span></a>
      <a class="karta-g" href="#/tipove"><b>Упражнение по тип</b><span>10 задачи само от един тип</span></a>
      <a class="karta-g" href="#/napredak"><b>Напредък</b><span>нивото по типове задачи във времето</span></a>
      <a class="karta-g" href="#/umenia"><b>Умения</b><span>какво се иска за НВО, с примери</span></a>
    </div>
    ${sega?.ochakvani != null ? `<p class="posleden">Нивото сега: около <b>${sega.ochakvani} точки</b> на НВО (по ${sega.tipove} от 25 типа).</p>` : ''}
    ${posleden ? `<p class="posleden">Последен пробен тест: <b>${posleden.tochki} от 100</b> (${ocenka(posleden.tochki)}).</p>` : ''}
    ${slabi.length ? `<div class="slabi"><h2>Упражнявай тези</h2>${slabi.map(s => `<a class="red" href="#/uprazhnenie/${s.nomer}"><span class="ime">${s.ime}</span><span class="pr">${sega.niva[s.nomer]} %</span></a>`).join('')}</div>` : ''}
    <div class="izbor-tema">Вид: ${TEMI.map(t => `<button class="chip-b ${segashnaTema() === t.id ? 'aktiven' : ''}" data-tema="${t.id}">${t.ime}</button>`).join('')}</div>
  </section>`;
  izgled.querySelectorAll('[data-tema]').forEach(b => { b.onclick = () => { izberiTema(b.dataset.tema); nachalo(); }; });
  const forma = $('#ime-forma');
  if (forma) forma.onsubmit = async e => { e.preventDefault(); const v = $('#ime-nachalo').value.trim(); if (v) { await zapaziIme(v); nachalo(); } };
}

/* ---------- Пробен тест и упражнение ---------- */
function rezultatHtml(rez, opts) {
  const greshni = rez.zadachi.filter(z => !z.vyarno);
  const tipove = [...new Set(greshni.map(z => z.nomer))];
  const naj = [...rez.zadachi].map((z, i) => ({ ...z, i })).sort((a, b) => b.sekundi - a.sekundi).slice(0, 3);
  return `<div class="rezultat-k">
    <div class="golemi"><b>${rez.tochki}</b> от ${rez.max} точки${opts.test ? ` · ${ocenka(rez.tochki)}` : ` · ${procent(rez.tochki, rez.max)} %`}</div>
    <p>Време: ${mmss(rez.sekundi)} · верни ${rez.zadachi.length - greshni.length} от ${rez.zadachi.length} · най-дълго: ${naj.map(z => `№ ${z.i + 1} (${mmss(z.sekundi)})`).join(', ')}</p>
    ${opts.test ? `<p class="belezhka">Средният резултат на НВО 2026 е ${MON_SREDNO_2026} точки. При задачите с решение тук се проверява само отговорът; на изпита учителят дава точки и за решението.</p>` : ''}
    ${tipove.length ? `<h3>Упражнявай</h3><div class="chipove">${tipove.map(n => `<a class="chip" href="#/uprazhnenie/${n}">${imeNa(n)}</a>`).join('')}</div>` : '<p>Всичко е вярно. Браво!</p>'}
    <div class="butoni-red"><button class="glaven" id="otnovo">${opts.test ? 'Нов пробен тест' : 'Още 10 задачи'}</button><a class="buton" href="#/">Към началото</a></div>
  </div>`;
}

async function startList({ tasks, mode, title, podzaglavie, minutes, zapis }) {
  const ime = await imeNaDeteto();
  izgled.innerHTML = '<div id="rezultat"></div><div id="list-koren"></div>';
  pochisti = openList($('#list-koren'), {
    tasks, mode, title, podzaglavie, minutes, ime,
    onIme: zapaziIme,
    onDone: async rez => {
      const { zadachi, ...opit } = rez;
      await zapishiOpit({ ...zapis, koga: new Date().toISOString(), ...opit }, zadachi);
      $('#rezultat').innerHTML = rezultatHtml(rez, { test: mode === 'test' });
      $('#otnovo').onclick = () => route(true);
      setTimeout(() => scrollTo(0, 0), 60);
    },
  });
}

function test() {
  const seed = Math.floor(Math.random() * 1e6);
  return startList({ tasks: makeTest(seed), mode: 'test', title: 'Национално външно оценяване в края на IV клас<br>Тест по математика', podzaglavie: `Пробен тест по модела на НВО · вариант ${seed}`, minutes: 60, zapis: { vid: 'test', seed } });
}

function uprazhnenie(n) {
  const seed = Math.floor(Math.random() * 1e6);
  const tasks = Array.from({ length: 10 }, (_, i) => makeTask(n, seed + i * 7777));
  return startList({ tasks, mode: 'practice', title: `Упражнение по математика, IV клас<br>${imeNa(n)}`, podzaglavie: `${OBLASTI[UMENIA[n].oblast]} · 10 задачи`, zapis: { vid: 'uprazhnenie', nomer: n, seed } });
}

/* ---------- Списък с типовете задачи ---------- */
function poOblasti(render) {
  return Object.entries(OBLASTI).map(([k, ime]) => `<h2>${ime}</h2>${SABLONI.filter(s => UMENIA[s.nomer].oblast === k).map(render).join('')}`).join('');
}
async function tipove() {
  const reshenia = await danni.reshenia.all();
  const sega = reshenia.length ? nivaVavVremeto(reshenia).pop() : null;
  izgled.innerHTML = `<section class="stranica"><h1>Упражнение по тип задача</h1>
    <p class="vodach">Избери тип: 10 задачи само от него. След всяка задача виждаш дали е вярно и как се решава.</p>
    ${poOblasti(s => `<a class="red tip" href="#/uprazhnenie/${s.nomer}"><span class="n">${s.nomer}</span><span class="ime">${s.ime}</span>
      <span class="pr">${sega?.niva[s.nomer] != null ? `ниво ${sega.niva[s.nomer]} %` : ''}</span></a>`)}</section>`;
}

/* ---------- Умения: документация с примери ---------- */
function primerHtml(t) {
  const otg = t.otgovori ? `<ul class="otg-spisak">${Object.entries(t.otgovori).map(([k, v]) => `<li><b>${k})</b> ${v}</li>`).join('')}</ul>` : '';
  const pod = t.podusloviya ? `<ol class="otg-spisak" type="А">${t.podusloviya.map(p => `<li>${p.uslovie}</li>`).join('')}</ol>` : '';
  const reshenie = t.podusloviya ? t.podusloviya.map(p => `<b>${p.bukva})</b> ${p.reshenie} <b>${p.veren}</b>`).join('<br>') : `${t.reshenie} <b>Отговор: ${t.otgovori ? `${t.veren}) ${t.otgovori[t.veren]}` : t.veren}</b>`;
  return `<div class="primer"><p>${t.uslovie}</p>${t.chertezh ? `<div class="chertezh">${t.chertezh}</div>` : ''}${otg}${pod}
    <details><summary>Покажи отговора</summary><p>${reshenie}</p></details></div>`;
}
function umenia() {
  izgled.innerHTML = `<section class="stranica"><h1>Умения за НВО по математика</h1>
    <p class="vodach">Тестът има 25 задачи и всяка година на едно и също място стои един и същи тип задача. Тук е всеки тип: какво проверява, какво пише в учебната програма на МОН, от кой клас е и пример. Примерите са нови при всяко отваряне.</p>
    ${poOblasti(s => { const u = UMENIA[s.nomer]; return `<article class="umenie" id="u${s.nomer}">
      <h3><span class="n">${s.nomer}</span> ${s.ime}</h3>
      <p>${u.opisanie}</p>
      <dl><dt>Програма на МОН</dt><dd>${u.mon}</dd><dt>Учи се в</dt><dd>${u.klas} клас</dd><dt>В НВО</dt><dd>${u.chesto}; ${s.tochki} т.</dd></dl>
      ${u.trudno ? `<p class="trudno">${u.trudno}</p>` : ''}
      ${primerHtml(makeTask(s.nomer, Math.floor(Math.random() * 1e6)))}
      <a class="buton" href="#/uprazhnenie/${s.nomer}">Упражнявай</a></article>`; })}</section>`;
}

/* ---------- Адреси ---------- */
async function route(force) {
  pochisti(); pochisti = () => {};
  const [p, arg] = location.hash.replace(/^#\/?/, '').split('/');
  document.querySelectorAll('.glavno-menu a').forEach(a => a.classList.toggle('aktiven', a.getAttribute('href') === `#/${p}` || (p === 'uprazhnenie' && a.getAttribute('href') === '#/tipove')));
  document.body.classList.toggle('v-test', p === 'test' || p === 'uprazhnenie');
  if (!force) scrollTo(0, 0);
  if (p === 'test') await test();
  else if (p === 'uprazhnenie' && SABLONI[Number(arg) - 1]) await uprazhnenie(Number(arg));
  else if (p === 'tipove') await tipove();
  else if (p === 'umenia') umenia();
  else if (p === 'napredak') await napredakStranica(izgled);
  else await nachalo();
}
addEventListener('hashchange', () => route());
route();
