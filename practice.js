/* Practice by task type: a friendly page, not the test sheet. One task at a time, big answer field
   and a "Провери" button; on the right: tasks answered, time and a score out of 100.
   Right: the score goes up, a short praise and the next task. Wrong: the correct answer and how it is solved,
   then "Разбрах". At 100 the type is mastered. Every answer is saved at once (savePracticeAnswer).
   Above the task: "Научи с пример" (a solved task of the same type); below: "Не си готов?" with links. */

const PRAISE = ['Браво!', 'Вярно!', 'Супер!', 'Точно така!', 'Отлично!'];

/* The score: fast at the start, slow near 100; a mistake costs more the higher it is */
function nextScore(score, ok) {
  const zone = score < 50 ? 0 : score < 70 ? 1 : score < 90 ? 2 : 3;
  return ok ? Math.min(100, score + [10, 7, 5, 3][zone]) : Math.max(0, score - [3, 5, 7, 9][zone]);
}

function questionHtml(t) {
  let html = `<p class="q-text">${t.text}</p>${t.drawing ? `<div class="drawing">${t.drawing}</div>` : ''}`;
  if (t.options) {
    html += `<div class="q-options ${t.optionsAreDrawings ? 'has-drawings' : ''}">${Object.entries(t.options).map(([k, v]) =>
      `<button type="button" class="q-option" data-letter="${k}"><b>${k})</b> <span>${v}</span></button>`).join('')}</div>`;
  } else if (t.parts) {
    html += t.parts.map(p => `<div class="q-part"><p><b>${p.letter})</b> ${p.text}</p>
      <input class="q-input" type="text" inputmode="numeric" autocomplete="off" data-part="${p.letter}" aria-label="Отговор на ${p.letter})"></div>`).join('');
  } else {
    html += '<input class="q-input" type="text" inputmode="numeric" autocomplete="off" aria-label="Отговор">';
  }
  return html;
}

const answerText = t => (t.parts ? t.parts.map(p => `${p.letter}) ${p.answer}`).join('; ') : t.options ? `${t.answer}) ${t.options[t.answer]}` : t.answer);
const solutionText = t => (t.parts ? t.parts.map(p => `<b>${p.letter})</b> ${p.solution}`).join('<br>') : t.solution);

/* Opens the practice of type `number` in root (a fresh element: the listeners stay on it). Returns a cleanup function. */
function openPractice(root, { number }) {
  const type = TEMPLATES[number - 1], skill = SKILLS[number];
  const related = TEMPLATES.filter(s => s.number !== number && SKILLS[s.number].area === skill.area).slice(0, 2);
  const st = { seed: Math.floor(Math.random() * 1e6), i: 0, task: null, answer: undefined, shownAt: 0, start: Date.now(), score: 0, locked: false };
  const attempt = { id: newId(), kind: 'practice', number, seed: st.seed, at: new Date().toISOString(), points: 0, max: 0, seconds: 0, answered: 0, score: 0 };

  root.innerHTML = `<div class="practice">
    <div class="practice-head">
      <a class="back-link" href="#/nvo4/types">← Всички упражнения</a>
      <h1><span class="n">${number}</span> ${type.name}</h1>
      <p class="note">${AREAS[skill.area]} · ${skill.grade} клас</p>
    </div>
    <div class="practice-card">
      <div class="practice-main">
        <div class="help-links"><button type="button" class="link-btn" id="example"><span class="bulb" aria-hidden="true"></span>Научи с пример</button></div>
        <div class="example-panel" id="example-panel" hidden></div>
        <div class="question" id="question" aria-live="polite"></div>
        <div class="practice-actions"><button type="button" class="go-btn" id="check" disabled>Провери</button></div>
        <div class="feedback" id="feedback" hidden></div>
      </div>
      <aside class="stats" aria-label="Как върви">
        <div class="stat stat-count"><b>Отговорени задачи</b><span id="count">0</span></div>
        <div class="stat stat-time"><b>Време</b><span id="clock">0:00</span></div>
        <div class="stat stat-score"><b>Резултат</b><small>от 100</small><span id="score">0</span></div>
      </aside>
    </div>
    <section class="helpers">
      <h2>Не си готов?</h2>
      <p>Това може да помогне:</p>
      <div class="helper-grid">
        <a class="helper" href="#/nvo4/skills"><span class="gem" aria-hidden="true"></span>Какво проверява „${type.name}“</a>
        ${related.map(s => `<a class="helper" href="#/nvo4/practice/${s.number}"><span class="gem" aria-hidden="true"></span>${s.name}</a>`).join('')}
      </div>
    </section>
  </div>`;

  const $q = root.querySelector('#question'), $check = root.querySelector('#check'), $fb = root.querySelector('#feedback');
  const $actions = root.querySelector('.practice-actions');
  const $count = root.querySelector('#count'), $score = root.querySelector('#score'), $clock = root.querySelector('#clock');

  const hasAnswer = () => {
    const a = st.answer;
    return a !== undefined && (typeof a === 'object' ? st.task.parts.every(p => String(a[p.letter] ?? '').trim()) : String(a).trim() !== '');
  };

  function showTask() {
    st.task = makeTask(number, st.seed + st.i * 7777);
    st.answer = undefined;
    st.locked = false;
    st.shownAt = Date.now();
    $q.innerHTML = questionHtml(st.task);
    $fb.hidden = true;
    $actions.hidden = false;
    $check.disabled = true;
    const first = $q.querySelector('.q-input');
    if (first) first.focus({ preventScroll: true });
  }

  async function check() {
    if (st.locked || !hasAnswer()) return;
    st.locked = true;
    const t = st.task, scored = pointsFor(t, st.answer), ok = scored === t.points;
    const seconds = Math.round((Date.now() - st.shownAt) / 1000);
    st.score = nextScore(st.score, ok);
    Object.assign(attempt, { answered: attempt.answered + 1, points: attempt.points + scored, max: attempt.max + t.points, seconds: Math.round((Date.now() - st.start) / 1000), score: st.score });
    $count.textContent = attempt.answered;
    $score.textContent = st.score;
    root.querySelector('.stat-score').classList.toggle('up', ok);
    $q.querySelectorAll('input').forEach(inp => { inp.disabled = true; });
    $q.querySelectorAll('.q-option').forEach(o => { o.disabled = true; o.classList.toggle('correct-option', o.dataset.letter === t.answer); });
    $actions.hidden = true;
    $fb.hidden = false;
    if (st.score === 100) {
      $fb.className = 'feedback mastered';
      $fb.innerHTML = `<p class="fb-title">Усвоено! 100 от 100</p><p>Решаваш „${type.name}“ уверено. Можеш да продължиш или да избереш друг тип.</p>
        <div class="button-row"><button type="button" class="go-btn" id="next">Още задачи</button><a class="btn" href="#/nvo4/types">Друг тип</a></div>`;
    } else if (ok) {
      $fb.className = 'feedback right';
      $fb.innerHTML = `<p class="fb-title">${PRAISE[attempt.answered % PRAISE.length]}</p><div class="button-row"><button type="button" class="go-btn" id="next">Напред</button></div>`;
    } else {
      $fb.className = 'feedback wrong';
      $fb.innerHTML = `<p class="fb-title">Не е вярно, но нищо.</p><p>Верният отговор е <b>${answerText(t)}</b>.</p><p class="fb-solution">${solutionText(t)}</p>
        <div class="button-row"><button type="button" class="go-btn" id="next">Разбрах</button></div>`;
    }
    $fb.querySelector('#next').focus({ preventScroll: true });
    const saved = await savePracticeAnswer(attempt, { number, kind: t.kind, points: t.points, scored, correct: ok, seconds });
    if (!saved) $fb.insertAdjacentHTML('beforeend', '<p class="note">Не успяхме да запишем отговора. Провери интернета.</p>');
  }

  root.addEventListener('click', e => {
    const opt = e.target.closest('.q-option');
    if (opt && !st.locked) {
      st.answer = opt.dataset.letter;
      $q.querySelectorAll('.q-option').forEach(o => o.classList.toggle('selected', o === opt));
      $check.disabled = false;
      return;
    }
    if (e.target.closest('#check')) return check();
    if (e.target.closest('#next')) { st.i++; return showTask(); }
    if (e.target.closest('#example')) {
      const panel = root.querySelector('#example-panel');
      panel.hidden = !panel.hidden;
      if (!panel.hidden) panel.innerHTML = `<p class="note">Пример: задача от същия тип, с решението.</p>${exampleHtml(makeTask(number, Math.floor(Math.random() * 1e6)))}`;
    }
  });
  root.addEventListener('input', e => {
    if (!e.target.matches('.q-input')) return;
    st.answer = e.target.dataset.part ? { ...(st.answer || {}), [e.target.dataset.part]: e.target.value } : e.target.value;
    $check.disabled = !hasAnswer();
  });
  root.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (st.locked) { const next = root.querySelector('#next'); if (next && e.target !== next) { e.preventDefault(); next.click(); } return; }
    if (e.target.matches('.q-input')) {
      e.preventDefault();
      const inputs = [...$q.querySelectorAll('.q-input')], k = inputs.indexOf(e.target);
      if (k < inputs.length - 1 && !hasAnswer()) inputs[k + 1].focus();
      else check();
    }
  });

  const timer = setInterval(() => { $clock.textContent = mmss(Math.round((Date.now() - st.start) / 1000)); }, 1000);
  showTask();
  return () => clearInterval(timer);
}
