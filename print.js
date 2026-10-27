/* The practice test page: shows the 25 tasks, the child answers,
   "Check" counts the points and gives a mark on the MON scale. The variant is in
   the address (?v=123), so the same test can be opened again or printed. */

const $ = s => document.querySelector(s);
const KIND_LABEL = { choice: 'избираем отговор', short: 'кратък отговор', extended: 'запиши решението', parts: 'запиши решенията' };
/* MON grading scale for the 4th grade NVO (2023–2024) */
const MARK_SCALE = [[84, 'Отличен 6'], [62.5, 'Много добър 5'], [51.75, 'Добър 4'], [30, 'Среден 3'], [0, 'Слаб 2']];

let seed = Number(new URLSearchParams(location.search).get('v')) || Math.floor(Math.random() * 1e6);
let tasks = [];
const salt = {};

/* The number in an answer: „1 018“, „1018 кв. см“ and „1018“ are the same */
const numOf = s => { const m = String(s).replace(/(\d)\s(?=\d{3}\b)/g, '$1').match(/\d+/); return m ? Number(m[0]) : null; };

function taskHtml(t) {
  let body = `<p class="task-text">${t.text}</p>${t.drawing ? `<div class="drawing">${t.drawing}</div>` : ''}`;
  if (t.options) {
    body += `<div class="choices ${t.optionsAreDrawings ? 'has-drawings' : ''}">${Object.entries(t.options).map(([k, v]) =>
      `<label class="option" data-letter="${k}"><input type="radio" name="task${t.number}" value="${k}"><b>${k})</b> <span>${v}</span></label>`).join('')}</div>`;
  } else if (t.parts) {
    body += t.parts.map(p => `<div class="part"><p><b>${p.letter})</b> ${p.text} <span class="pts">${p.points} т.</span></p>
      <label class="free-answer">Отговор: <input type="text" inputmode="numeric" data-task="${t.number}${p.letter}"></label>
      <p class="solution">${p.solution} <b>Отговор: ${p.answer}</b></p></div>`).join('');
  } else {
    body += `<label class="free-answer">Отговор: <input type="text" inputmode="numeric" data-task="${t.number}"></label>`;
  }
  if (!t.parts) body += `<p class="solution">${t.solution}${t.options ? ` <b>Отговор: ${t.answer}</b>` : ` <b>Отговор: ${t.answer}</b>`}</p>`;
  return `<article class="task" id="task${t.number}">
    <div class="number">${t.number}.</div>
    <div class="task-content">
      <div class="meta"><span class="template-name">${t.name}</span> · ${KIND_LABEL[t.kind]} · ${t.points} т.
        <button class="another" data-number="${t.number}" title="Друга задача от същия тип">↻ друга</button></div>
      ${body}
    </div>
  </article>`;
}

function render() {
  tasks = TEMPLATES.map(s => makeTask(s.number, seed + (salt[s.number] || 0) * 7777));
  $('#test').innerHTML = tasks.map(taskHtml).join('');
  $('#variant').textContent = `вариант ${seed}`;
  $('#result').textContent = '';
  history.replaceState(null, '', `?v=${seed}`);
}

function score() {
  let total = 0;
  for (const t of tasks) {
    const el = $(`#task${t.number}`);
    el.classList.remove('correct', 'wrong');
    if (t.options) {
      const ch = el.querySelector('input:checked');
      el.querySelectorAll('.option').forEach(o => o.classList.toggle('correct-option', o.dataset.letter === t.answer));
      const ok = ch && ch.value === t.answer;
      if (ok) total += t.points;
      el.classList.add(ok ? 'correct' : 'wrong');
    } else if (t.parts) {
      let got = 0;
      for (const p of t.parts) { const v = el.querySelector(`[data-task="${t.number}${p.letter}"]`).value; if (numOf(v) !== null && numOf(v) === numOf(p.answer)) got += p.points; }
      total += got;
      el.classList.add(got === t.points ? 'correct' : 'wrong');
    } else {
      const v = el.querySelector(`[data-task="${t.number}"]`).value;
      const ok = numOf(v) !== null && numOf(v) === numOf(t.answer);
      if (ok) total += t.points;
      el.classList.add(ok ? 'correct' : 'wrong');
    }
  }
  const mark = MARK_SCALE.find(([min]) => total >= min)[1];
  $('#result').innerHTML = `<b>${total} от 100 точки</b> · ${mark}. <span class="note">При задачите с решение тук се проверява само отговорът; на изпита учителят дава точки и за решението.</span>`;
  document.body.classList.add('checked');
}

$('#new-variant').onclick = () => { seed = Math.floor(Math.random() * 1e6); for (const k in salt) delete salt[k]; document.body.classList.remove('checked', 'answers-shown'); $('#show-answers').setAttribute('aria-pressed', 'false'); render(); scrollTo(0, 0); };
$('#show-answers').onclick = e => { const on = document.body.classList.toggle('answers-shown'); e.target.setAttribute('aria-pressed', String(on)); e.target.textContent = on ? 'Скрий отговорите' : 'Покажи отговорите'; };
$('#print-btn').onclick = () => print();
$('#check').onclick = score;
$('#test').addEventListener('click', e => {
  const b = e.target.closest('.another');
  if (!b) return;
  const n = Number(b.dataset.number);
  salt[n] = (salt[n] || 0) + 1;
  const t = makeTask(n, seed + salt[n] * 7777);
  tasks[n - 1] = t;
  $(`#task${n}`).outerHTML = taskHtml(t);
});

render();
