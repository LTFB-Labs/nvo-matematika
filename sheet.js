/* The test as a sheet of paper. Top: name, date, test title.
   Focus: the sheet is enlarged with one task in the middle; the previous and next ones
   are faded and blurred, but their number shows. The top-right button shows the whole sheet
   at normal size; choosing a task returns to focus. Above the button: a timer.
   Time is tracked per task (while it is in focus).
   In the practice test answers are checked at the end, in practice after each task. */

const KIND_TEXT = { choice: 'избери отговор', short: 'запиши отговора', extended: 'реши и запиши отговора', multipart: 'реши трите подусловия' };
/* MON grading scale for the 4th grade NVO (2023–2024) */
const MARK_SCALE = [[84, 'Отличен 6'], [62.5, 'Много добър 5'], [51.75, 'Добър 4'], [30, 'Среден 3'], [0, 'Слаб 2']];
const mark = t => MARK_SCALE.find(([min]) => t >= min)[1];

/* The number in an answer: „1 018“, „1018 кв. см“ and „1018“ are the same */
const numOf = s => { const m = String(s ?? '').replace(/(\d)\s(?=\d{3}\b)/g, '$1').match(/\d+/); return m ? Number(m[0]) : null; };
const sameNum = (a, b) => numOf(a) !== null && numOf(a) === numOf(b);
const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const today = () => new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' });

/* How many points the answer earns; for multipart tasks the answer is { А, Б, В } */
function pointsFor(t, answer) {
  if (t.options) return answer === t.answer ? t.points : 0;
  if (t.parts) return t.parts.reduce((s, p) => s + (sameNum(answer?.[p.letter], p.answer) ? p.points : 0), 0);
  return sameNum(answer, t.answer) ? t.points : 0;
}

function taskHtml(t, i) {
  let body = `<p class="task-text">${t.text}</p>${t.drawing ? `<div class="drawing">${t.drawing}</div>` : ''}`;
  if (t.options) {
    body += `<div class="choices ${t.optionsAreDrawings ? 'has-drawings' : ''}">${Object.entries(t.options).map(([k, v]) =>
      `<label class="option" data-letter="${k}"><input type="radio" name="o${i}" value="${k}"><b>${k})</b> <span>${v}</span></label>`).join('')}</div>`;
  } else if (t.parts) {
    body += t.parts.map(p => `<div class="part"><p><b>${p.letter})</b> ${p.text} <span class="pts">${p.points} т.</span></p>
      <label class="free-answer">Отговор: <input type="text" inputmode="numeric" autocomplete="off" data-i="${i}" data-part="${p.letter}"></label>
      <p class="solution">${p.solution} <b>Отговор: ${p.answer}</b></p></div>`).join('');
  } else {
    body += `<label class="free-answer">Отговор: <input type="text" inputmode="numeric" autocomplete="off" data-i="${i}"></label>`;
  }
  if (!t.parts) body += `<p class="solution">${t.solution} <b>Отговор: ${t.answer}</b></p>`;
  return `<article class="task" data-i="${i}">
    <div class="task-head"><span class="number">${i + 1}.</span><span class="meta">${KIND_TEXT[t.kind]} · ${t.points} т.</span><span class="task-time"></span></div>
    <div class="task-body">${body}</div>
    <div class="keypad-slot"></div>
    <div class="task-actions"></div>
  </article>`;
}

/* Opens the sheet in root. Returns a cleanup function (stops the timer, the keypad, the listeners).
   Focus: a stage without scrolling. The item in focus (the header or a task) is in the middle, with
   larger text, and takes almost the whole sheet; the previous one peeks into the top 10 %, the next into the bottom 10 %,
   both under a veil; the arrows sit next to them. "The whole sheet" is a normal, smaller document. */
function openSheet(root, { tasks, mode, title, subtitle, minutes, name, onName, onDone }) {
  /* focus = -1: the top of the sheet (name, date); 0…n-1: the tasks */
  const st = { focus: -1, overview: false, answers: tasks.map(() => undefined), checked: new Set(), spent: tasks.map(() => 0), start: null, focusSince: Date.now(), finished: false, started: false };
  root.innerHTML = `<div class="desk ${mode} focus-mode no-anim">
    <div class="controls">
      <div class="clock" id="clock" title="${mode === 'test' ? 'Оставащо време' : 'Време'}">${mode === 'test' ? mmss(minutes * 60) : '0:00'}</div>
      <button class="icon-btn" id="whole" title="Целият лист" aria-label="Покажи целия лист"><span class="icon icon-sheet"></span></button>
      <nav class="strip" aria-label="Задачите">${tasks.map((_, i) => `<button class="strip-item" data-strip="${i}" title="Задача ${i + 1}" aria-label="Задача ${i + 1}"><span class="strip-dot"></span></button>`).join('')}</nav>
    </div>
    <a class="exit" href="#/" title="Изход" aria-label="Изход"><span class="icon icon-exit"></span></a>
    <div class="paper">
      <header class="sheet-header">
        <div class="stamp" id="stamp"></div>
        <p class="header-top">${subtitle}</p>
        <h1>${title}</h1>
        <p class="header-date">${today()}</p>
        <div class="fields">
          <label>Име: <input id="student-name" value="${name || ''}" autocomplete="off"></label>
          <span>Клас: <u>IV</u></span>
        </div>
        ${mode === 'test'
    ? `<p class="instructions">Прочети внимателно задачите. На задачите от № 1 до № ${tasks.filter(x => x.kind === 'choice').length} избери буквата на верния отговор. На останалите запиши отговора. Имаш ${minutes} минути.</p>`
    : `<p class="instructions">Прочети внимателно задачите. След всяка ще видиш дали е вярно и как се решава.</p>`}
        <div class="start-slot"><button class="primary start-btn" id="start">Старт</button></div>
      </header>
      <section class="tasks">${tasks.map(taskHtml).join('')}</section>
      <footer class="sheet-end"><p class="end-text">Край на ${mode === 'test' ? 'теста' : 'упражнението'}</p>${mode === 'test' ? '<button class="primary" id="submit" disabled>Предай теста</button>' : ''}</footer>
    </div>
    <div class="edge edge-top"></div>
    <div class="edge edge-bottom"></div>
    <button class="submit-btn faint" id="done" disabled>${mode === 'test' ? 'Предай теста' : 'Виж резултата'}</button>
  </div>`;
  const desk = root.querySelector('.desk');
  const paper = root.querySelector('.paper');
  const header = root.querySelector('.sheet-header');
  const arts = [...root.querySelectorAll('.task')];
  const sheetEnd = root.querySelector('.sheet-end');
  /* index = focus + 1; the end of the sheet is last: it only peeks below the last task */
  const items = [header, ...arts, sheetEnd];
  const edgeTop = root.querySelector('.edge-top'), edgeBottom = root.querySelector('.edge-bottom');

  /* On phones and tablets: a large number keypad under the task instead of the system one */
  const MOBILE = matchMedia('(pointer: coarse)').matches || matchMedia('(max-width: 760px)').matches;
  if (MOBILE) root.querySelectorAll('.tasks input[type=text]').forEach(inp => inp.setAttribute('inputmode', 'none'));
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '↵'];
  const keypadHtml = () => `<div class="keypad" role="group" aria-label="Клавиатура">${KEYS.map(k =>
    `<button type="button" data-k="${k}" class="${k === '↵' ? 'k-enter' : k === '⌫' ? 'k-delete' : ''}" aria-label="${k === '⌫' ? 'Изтрий' : k === '↵' ? 'Готово' : k}">${k === '↵' ? 'готово' : k}</button>`).join('')}</div>`;
  const selectField = inp => {
    root.querySelectorAll('.active-field').forEach(x => x.classList.remove('active-field'));
    st.field = inp || null;
    if (st.field) st.field.classList.add('active-field');
  };

  const answered = i => { const a = st.answers[i]; return a !== undefined && (typeof a === 'object' ? Object.values(a).some(v => String(v).trim()) : String(a).trim() !== ''); };
  /* "Submit the test" sits outside the sheet, bottom right: very faint while some tasks have no answer
     (in practice: are unchecked), bright when all are done */
  const updateDone = () => {
    const allDone = mode === 'test' ? tasks.every((_, i) => answered(i)) : st.checked.size === tasks.length;
    const b = root.querySelector('#done');
    b.hidden = st.finished;
    b.classList.toggle('faint', !allDone);
    b.disabled = !allDone;                       /* enabled only when every task has an answer */
    const p = root.querySelector('#submit'); if (p) p.disabled = !allDone;
  };
  /* the strip under the mode button: a dot per task — empty without an answer, filled with one,
     the current one is larger; after submitting — correct/wrong */
  const stripItems = [...root.querySelectorAll('.strip-item')];
  const updateStrip = () => stripItems.forEach((t, i) => {
    t.classList.toggle('current', i === st.focus);
    t.classList.toggle('has-answer', answered(i));
    t.title = `Задача ${i + 1}${answered(i) ? ' · има отговор' : ' · без отговор'}`;
    t.classList.toggle('correct', st.finished && pointsFor(tasks[i], st.answers[i]) === tasks[i].points);
    t.classList.toggle('wrong', st.finished && pointsFor(tasks[i], st.answers[i]) !== tasks[i].points);
  });
  const recordTime = () => { if (!st.overview && !st.finished && st.focus >= 0) st.spent[st.focus] += Date.now() - st.focusSince; st.focusSince = Date.now(); };

  /* Choosing an answer moves nothing: the child presses the arrow. In practice
     "Check" (inside the task) shows the solution. */
  const ARROW_DOWN = (label = 'Следваща задача') => `<button class="arrow-btn next" aria-label="${label}"><span class="icon icon-down"></span></button>`;
  const checkButton = i => (mode === 'practice' && !st.checked.has(i) && !st.finished ? '<button class="check-btn">Провери</button>' : '');
  function renderEdges() {
    const i = st.focus, last = i === tasks.length - 1;
    edgeTop.innerHTML = !st.overview && !st.finished && i >= 0 ? `<button class="arrow-btn prev" aria-label="${i === 0 ? 'Към началото на листа' : 'Предишна задача'}"><span class="icon icon-up"></span></button>` : '';
    let downHtml = '';
    if (!st.overview && !st.finished) {
      if (!last && st.started) downHtml = ARROW_DOWN(i < 0 ? 'Към първата задача' : 'Следваща задача');
    }
    edgeBottom.innerHTML = downHtml;
  }

  /* Lays out the stage: focus in the middle, neighbours in the top and bottom 15 %, the rest off screen */
  function layout() {
    if (st.overview) { items.forEach(el => { el.style.removeProperty('--y'); el.style.removeProperty('max-height'); }); return; }
    /* the stage is the sheet (its top and bottom edges show); the neighbours are within 10 % of its edges */
    const r = paper.getBoundingClientRect(), H = r.height, PEEK = Math.round(H * 0.10);
    const upH = edgeTop.offsetHeight || 0, downH = edgeBottom.offsetHeight || 0;
    const upper = PEEK + upH + 6, lower = H - PEEK - downH - 6;
    const f = st.focus + 1;
    items.forEach((el, k) => {
      if (k === f) {
        el.style.maxHeight = `${Math.max(120, lower - upper)}px`;
        const h = el.offsetHeight;
        el.style.setProperty('--y', `${upper + Math.max(0, (lower - upper - h) / 2)}px`);
      } else if (k === f - 1) {
        /* the previous one shows its top part (the number) in the top 15 % */
        el.style.maxHeight = `${PEEK - 8}px`;
        el.style.setProperty('--y', `${Math.max(0, PEEK - 8 - el.offsetHeight)}px`);
      } else {
        el.style.removeProperty('max-height');
        const h = el.offsetHeight;
        el.style.setProperty('--y', `${k === f + 1 ? H - PEEK : k < f ? -h - 60 : H + 60}px`);
      }
    });
    edgeTop.style.top = `${r.top + PEEK}px`;
    edgeBottom.style.bottom = `${innerHeight - r.bottom + PEEK}px`;
  }

  function render() {
    const f = st.focus + 1;
    items.forEach((el, k) => {
      const isFocus = !st.overview && k === f;
      el.classList.toggle('focus', isFocus);
      el.classList.toggle('adjacent', !st.overview && Math.abs(k - f) === 1);
      el.classList.toggle('far', !st.overview && Math.abs(k - f) > 1);
    });
    arts.forEach((a, k) => {
      const isFocus = !st.overview && k === st.focus;
      a.classList.toggle('answered', answered(k));
      a.querySelector('.task-actions').innerHTML = isFocus ? checkButton(k) : '';
      a.querySelectorAll('input').forEach(inp => { inp.tabIndex = isFocus || st.overview ? 0 : -1; });
      const hasField = a.querySelector('input[type=text]:not([disabled])');
      a.querySelector('.keypad-slot').innerHTML = MOBILE && isFocus && hasField && !st.finished ? keypadHtml() : '';
    });
    desk.classList.toggle('focus-mode', !st.overview);
    desk.classList.toggle('whole-mode', st.overview);
    document.body.classList.toggle('stage', !st.overview);
    root.querySelector('#whole').innerHTML = `<span class="icon ${st.overview ? 'icon-focus' : 'icon-sheet'}"></span>`;
    root.querySelector('#whole').title = st.overview ? 'Към задачата' : 'Целият лист';
    renderEdges();
    layout();
    updateStrip();
  }

  const skipAnimation = () => { desk.classList.add('no-anim'); requestAnimationFrame(() => requestAnimationFrame(() => desk.classList.remove('no-anim'))); };

  function focus(i) {
    if (!st.started && i >= 0) return;          /* before "Start" the tasks do not open */
    recordTime();
    if (st.overview) skipAnimation();   /* from "the whole sheet" to focus: no sliding from the old positions */
    st.overview = false;
    st.focus = Math.max(-1, Math.min(tasks.length - 1, i));
    scrollTo(0, 0);
    render();
    if (st.focus < 0) return;
    const el = arts[st.focus];
    el.scrollTop = 0;
    const first = el.querySelector('input[type=text]:not([disabled])');
    selectField(first);
    if (first && !st.finished && !MOBILE) setTimeout(() => first.focus({ preventScroll: true }), 450);
  }

  function showWhole() {
    recordTime();
    st.overview = true;
    render();
    requestAnimationFrame(() => (arts[st.focus] || paper).scrollIntoView({ block: st.focus >= 0 ? 'center' : 'start' }));
  }

  function checkTask(i) {
    st.checked.add(i);
    const a = arts[i], t = tasks[i];
    const ok = pointsFor(t, st.answers[i]) === t.points;
    a.classList.add('checked', ok ? 'correct' : 'wrong');
    a.querySelectorAll('.option').forEach(o => o.classList.toggle('correct-option', o.dataset.letter === t.answer));
    a.querySelectorAll('input').forEach(inp => { inp.disabled = true; });
  }

  function finish() {
    if (st.finished) return;
    recordTime();
    st.finished = true;
    clearInterval(timer);
    tasks.forEach((_, i) => { if (!st.checked.has(i)) checkTask(i); });
    const answers = tasks.map((t, i) => {
      const scored = pointsFor(t, st.answers[i]);
      return { number: t.number, kind: t.kind, points: t.points, scored, correct: scored === t.points, seconds: Math.round(st.spent[i] / 1000), ...(t.realTaskId ? { realTaskId: t.realTaskId } : {}) };
    });
    answers.forEach((z, i) => { arts[i].querySelector('.task-time').textContent = `⏱ ${mmss(z.seconds)}`; });
    const result = { points: answers.reduce((s, z) => s + z.scored, 0), max: answers.reduce((s, z) => s + z.points, 0), seconds: Math.round((Date.now() - st.start) / 1000), answers };
    root.querySelector('#stamp').innerHTML = mode === 'test' ? `${result.points} т.<small>${mark(result.points)}</small>` : `${result.points}/${result.max}<small>${Math.round((100 * result.points) / result.max)} %</small>`;
    st.overview = true;
    desk.classList.add('finished');
    updateDone();
    render();
    onDone(result);
  }

  /* the answers */
  root.querySelector('.tasks').addEventListener('change', e => {
    const art = e.target.closest('.task'); if (!art) return;
    if (e.target.type === 'radio') st.answers[Number(art.dataset.i)] = e.target.value;
    art.classList.toggle('answered', answered(Number(art.dataset.i)));
    updateDone();
    updateStrip();
  });
  root.querySelector('.tasks').addEventListener('input', e => {
    const i = Number(e.target.dataset.i);
    if (Number.isNaN(i)) return;
    if (e.target.dataset.part) st.answers[i] = { ...(st.answers[i] || {}), [e.target.dataset.part]: e.target.value };
    else st.answers[i] = e.target.value;
    arts[i].classList.toggle('answered', answered(i));
    updateDone();
    updateStrip();
  });
  root.querySelector('#student-name').addEventListener('change', e => onName && onName(e.target.value.trim()));
  /* the keypad: pressing does not take focus from the field; it types into the selected field */
  root.querySelector('.tasks').addEventListener('focusin', e => { if (e.target.matches('input[type=text]')) selectField(e.target); });
  root.addEventListener('pointerdown', e => { if (e.target.closest('[data-k]')) e.preventDefault(); });
  const nextButton = () => root.querySelector('.task.focus .check-btn') || edgeBottom.querySelector('.next');
  const press = k => {
    if (k === '↵') { const nb = nextButton(); if (nb) nb.click(); return; }
    const field = st.field && !st.field.disabled ? st.field : arts[st.focus]?.querySelector('input[type=text]:not([disabled])');
    if (!field) return;
    field.value = k === '⌫' ? field.value.slice(0, -1) : (field.value + k).slice(0, 9);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    if (navigator.vibrate) { try { navigator.vibrate(8); } catch { /* none */ } }
  };

  /* navigation */
  root.addEventListener('click', e => {
    const b = e.target;
    const keyBtn = b.closest('[data-k]'); if (keyBtn) return press(keyBtn.dataset.k);
    const stripBtn = b.closest('[data-strip]');
    if (stripBtn) {
      const i = Number(stripBtn.dataset.strip);
      if (st.overview) { st.focus = i; updateStrip(); return arts[i].scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return focus(i);
    }
    if (b.closest('.next')) return focus(st.focus + 1);
    if (b.closest('.prev')) return focus(st.focus - 1);
    if (b.closest('.check-btn')) { checkTask(st.focus); updateDone(); return render(); }
    if (b.closest('#done') || b.closest('#submit')) return finish();   /* the button is enabled only when everything is done */
    if (b.closest('#start')) return begin();
    if (b.closest('#whole')) { if (st.finished || !st.started) return; return st.overview ? focus(Math.max(0, st.focus)) : showWhole(); }
    if (st.finished) return;
    const el = b.closest('.task, .sheet-header');
    if (!el) return;
    const idx = items.indexOf(el) - 1;
    if (st.overview) return focus(idx);
    if (!el.classList.contains('focus') && !b.closest('input, label')) { e.preventDefault(); focus(idx); }
  });
  const onKey = e => {
    if (st.finished || st.overview) return;
    const typing = e.target.tagName === 'INPUT' && e.target.type === 'text';
    if (e.key === 'Enter' && e.target.id === 'student-name') { e.preventDefault(); e.target.blur(); return st.started ? focus(st.focus + 1) : begin(); }
    if (e.key === 'Enter' && typing) { e.preventDefault(); const nb = nextButton(); if (nb) nb.click(); return; }
    if (typing) return;
    /* down and right — forward; up and left — back */
    if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) { e.preventDefault(); focus(st.focus + 1); }
    if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); focus(st.focus - 1); }
  };
  document.addEventListener('keydown', onKey);
  const onResize = () => layout();
  addEventListener('resize', onResize);

  /* "Start": the timer starts and the sheet moves to the first task */
  const clock = root.querySelector('#clock');
  let timer;
  function begin() {
    if (st.started) return;
    st.started = true;
    st.start = Date.now();
    st.focusSince = Date.now();
    root.querySelector('.start-slot').remove();
    root.querySelector('#whole').disabled = false;
    timer = setInterval(() => {
      const s = Math.round((Date.now() - st.start) / 1000);
      if (mode === 'test') {
        const left = minutes * 60 - s;
        clock.textContent = mmss(Math.max(0, left));
        clock.classList.toggle('low', left <= 300);
        if (left <= 0) finish();
      } else clock.textContent = mmss(s);
    }, 1000);
    focus(0);
  }

  /* Dragging the sheet with the mouse only in "the whole sheet": the cursor is a hand that grabs the sheet,
     dragging scrolls the document. In focus the sheet is not dragged. */
  let drag = null;
  const NO_DRAG = 'input, label, button, a, select, textarea, .option';
  paper.addEventListener('pointerdown', e => {
    if (!st.overview || e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest(NO_DRAG) || st.finished) return;
    drag = { y: e.clientY, scroll: scrollY, moved: false };
    paper.setPointerCapture(e.pointerId);
  });
  paper.addEventListener('pointermove', e => {
    if (!drag) return;
    const dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dy) < 5) return;
    if (!drag.moved) { drag.moved = true; desk.classList.add('dragging'); }
    scrollTo(0, drag.scroll - dy);
  });
  const release = e => {
    if (!drag) return;
    const { moved } = drag;
    drag = null;
    desk.classList.remove('dragging');
    if (paper.hasPointerCapture?.(e.pointerId)) paper.releasePointerCapture(e.pointerId);
    if (!moved) return;
    paper.addEventListener('click', ev => ev.stopPropagation(), { capture: true, once: true });   /* the click after a drag does not select a task */
  };
  paper.addEventListener('pointerup', release);
  paper.addEventListener('pointercancel', release);

  /* Mouse wheel and finger swipe in focus: next/previous item.
     If the task in focus is taller than the screen, it scrolls first. */
  const canScroll = (el, dir) => el && el.scrollHeight > el.clientHeight + 2 && (dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 2 : el.scrollTop > 2);
  let lockedUntil = 0, accumulated = 0;
  const onWheel = e => {
    if (st.overview || st.finished) return;
    const fEl = items[st.focus + 1];
    if (fEl.contains(e.target) && canScroll(fEl, e.deltaY)) return;
    e.preventDefault();
    if (performance.now() < lockedUntil) return;
    accumulated += e.deltaY;
    if (Math.abs(accumulated) > 60) { focus(st.focus + Math.sign(accumulated)); accumulated = 0; lockedUntil = performance.now() + 550; }
  };
  document.addEventListener('wheel', onWheel, { passive: false });
  let touch = null;
  desk.addEventListener('touchstart', e => { if (!st.overview && !st.finished && e.touches.length === 1) touch = { y: e.touches[0].clientY, inside: items[st.focus + 1].contains(e.target) }; }, { passive: true });
  desk.addEventListener('touchend', e => {
    if (!touch) return;
    const dy = e.changedTouches[0].clientY - touch.y, fEl = items[st.focus + 1];
    const inside = touch.inside; touch = null;
    if (Math.abs(dy) < 50 || (inside && canScroll(fEl, -dy))) return;
    focus(st.focus + (dy < 0 ? 1 : -1));
  });

  root.querySelector('#whole').disabled = true;
  focus(-1);
  skipAnimation();
  return () => { clearInterval(timer); document.removeEventListener('keydown', onKey); removeEventListener('resize', onResize); document.body.classList.remove('stage'); document.removeEventListener('wheel', onWheel); };
}

/* Confirmation inside the page (in an artifact confirm() always returns "no") */
function confirmDialog(message, yes = 'Да', no = 'Не') {
  return new Promise(ok => {
    const el = document.createElement('div');
    el.className = 'confirm-overlay';
    el.innerHTML = `<div class="confirm-card" role="alertdialog" aria-modal="true"><p>${message}</p><div class="confirm-buttons"><button class="no">${no}</button><button class="primary yes">${yes}</button></div></div>`;
    const close = answer => { el.remove(); ok(answer); };
    el.addEventListener('click', e => { if (e.target.closest('.yes')) close(true); else if (e.target.closest('.no') || e.target === el) close(false); });
    document.body.append(el);
    el.querySelector('.yes').focus();
  });
}
