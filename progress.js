/* Progress: not against other children, but a meter with the child's level over time.
   Level of a task type = success rate over its last 20 solved tasks (at least 3).
   Overall level = expected NVO points: the points of each position × the level of its type,
   only for the types the child has solved (so it also says how many types it covers). */

const RECENT = 20, MIN_FOR_LEVEL = 3;
const SERIES_COLORS = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)'];   /* up to 3 types selected for the chart; the colours come from the theme */

const dayOf = iso => iso.slice(0, 10);

function typeLevel(answers) {
  const r = answers.slice(-RECENT);
  return r.length >= MIN_FOR_LEVEL ? Math.round((100 * r.filter(x => x.correct).length) / r.length) : null;
}

/* Levels by type and expected points at the end of each day with solving */
function levelsOverTime(answers) {
  const sort = [...answers].sort((a, b) => a.at.localeCompare(b.at));
  const days = [...new Set(sort.map(r => dayOf(r.at)))];
  const byType = {};
  const rows = [];
  let k = 0;
  for (const day of days) {
    while (k < sort.length && dayOf(sort[k].at) <= day) { (byType[sort[k].number] ||= []).push(sort[k]); k++; }
    const levels = {};
    for (const s of TEMPLATES) levels[s.number] = byType[s.number] ? typeLevel(byType[s.number]) : null;
    const known = TEMPLATES.filter(s => levels[s.number] !== null);
    const max = known.reduce((a, s) => a + s.points, 0);
    const expected = max ? Math.round((100 * known.reduce((a, s) => a + (s.points * levels[s.number]) / 100, 0)) / max) : null;
    rows.push({ day, levels, expected, typeCount: known.length });
  }
  return rows;
}

/* Line chart with one 0–100 axis; hover shows the values for the day */
function chartSvg(rows, series) {
  const W = 680, H = 230, L = 36, R = 16, T = 14, B = 28;
  const t0 = new Date(rows[0].day).getTime(), t1 = new Date(rows[rows.length - 1].day).getTime();
  const x = day => (t1 === t0 ? L + (W - L - R) / 2 : L + ((new Date(day).getTime() - t0) / (t1 - t0)) * (W - L - R));
  const y = v => T + (1 - v / 100) * (H - T - B);
  let g = '';
  for (const v of [0, 25, 50, 75, 100]) g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="chart-grid"/><text x="${L - 6}" y="${y(v) + 4}" class="chart-axis" text-anchor="end">${v}</text>`;
  const fmtDay = d => new Date(d).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' });
  g += `<text x="${L}" y="${H - 8}" class="chart-axis">${fmtDay(rows[0].day)}</text>`;
  if (rows.length > 1) g += `<text x="${W - R}" y="${H - 8}" class="chart-axis" text-anchor="end">${fmtDay(rows[rows.length - 1].day)}</text>`;
  for (const s of series) {
    const pts = rows.filter(p => s.v(p) !== null).map(p => [x(p.day), y(s.v(p))]);
    if (pts.length > 1) g += `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" style="stroke:${s.color}" stroke-width="2" stroke-linejoin="round"/>`;
    g += pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" style="fill:${s.color};stroke:var(--surface)" stroke-width="2"/>`).join('');
  }
  g += `<line class="chart-cursor" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/>`;
  return `<div class="chart" data-l="${L}" data-r="${R}" data-w="${W}">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Нивото във времето">${g}<rect class="chart-hit" x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="transparent"/></svg>
    <div class="chart-tooltip" hidden></div></div>`;
}

function enableHover(el, rows, series) {
  const svgEl = el.querySelector('svg'), tip = el.querySelector('.chart-tooltip'), cursor = el.querySelector('.chart-cursor');
  const W = Number(el.dataset.w), L = Number(el.dataset.l), R = Number(el.dataset.r);
  const t0 = new Date(rows[0].day).getTime(), t1 = new Date(rows[rows.length - 1].day).getTime();
  const xOf = day => (t1 === t0 ? L + (W - L - R) / 2 : L + ((new Date(day).getTime() - t0) / (t1 - t0)) * (W - L - R));
  svgEl.addEventListener('mousemove', e => {
    const b = svgEl.getBoundingClientRect();
    const mx = ((e.clientX - b.left) / b.width) * W;
    const p = rows.reduce((best, q) => (Math.abs(xOf(q.day) - mx) < Math.abs(xOf(best.day) - mx) ? q : best));
    const px = xOf(p.day);
    cursor.setAttribute('x1', px); cursor.setAttribute('x2', px); cursor.setAttribute('visibility', 'visible');
    tip.hidden = false;
    tip.innerHTML = `<b>${new Date(p.day).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long' })}</b>${series.map(s => `<div><i style="background:${s.color}"></i>${s.name}: ${s.v(p) ?? '—'}${s.unit}</div>`).join('')}`;
    tip.style.left = `${(px / W) * 100}%`;
  });
  svgEl.addEventListener('mouseleave', () => { tip.hidden = true; cursor.setAttribute('visibility', 'hidden'); });
}

async function progressPage(view) {
  const answers = await data.answers.all();
  const attempts = (await data.attempts.all()).sort((a, b) => a.at.localeCompare(b.at));
  if (!answers.length) {
    view.innerHTML = '<section class="page"><h1>Напредък</h1><p class="lead">Още няма решени задачи. Започни с <a href="#/nvo4/test">пробен тест</a> или с <a href="#/nvo4/types">упражнение</a>.</p></section>';
    return;
  }
  const rows = levelsOverTime(answers);
  const latest = rows[rows.length - 1];
  const counts = {}; for (const r of answers) counts[r.number] = (counts[r.number] || 0) + 1;
  let selected = [];
  let area = 'all';

  const render = () => {
    const series = selected.length
      ? selected.map((n, i) => ({ name: `${n}. ${TEMPLATES[n - 1].name}`, color: SERIES_COLORS[i], v: p => p.levels[n], unit: ' %' }))
      : [{ name: 'Очаквани точки на НВО', color: SERIES_COLORS[0], v: p => p.expected, unit: ' т.' }];
    const types = TEMPLATES.filter(s => area === 'all' || SKILLS[s.number].area === area)
      .sort((a, b) => (latest.levels[a.number] ?? 101) - (latest.levels[b.number] ?? 101));
    view.innerHTML = `<section class="page progress">
      <h1>Напредък</h1>
      <div class="hero">
        <div class="hero-number"><b>${latest.expected ?? '—'}</b><span>очаквани точки на НВО<br>по ${latest.typeCount} от 25 типа задачи</span></div>
        <div class="meter-big"><span style="width:${latest.expected ?? 0}%"></span>${[30, 51.75, 62.5, 84].map(v => `<i style="left:${v}%" title="${mark(v)}"></i>`).join('')}</div>
        <div class="mark-scale"><span>2</span><span style="left:30%">3</span><span style="left:51.75%">4</span><span style="left:62.5%">5</span><span style="left:84%">6</span></div>
      </div>
      <h2>${selected.length ? 'Нивото на избраните типове във времето' : 'Очаквани точки във времето'}</h2>
      ${selected.length ? `<div class="legend">${selected.map((n, i) => `<span><i style="background:${SERIES_COLORS[i]}"></i>${n}. ${TEMPLATES[n - 1].name}</span>`).join('')}<button class="small" id="show-total">само общото ниво</button></div>` : '<p class="note">Избери до 3 типа отдолу, за да видиш как расте нивото им.</p>'}
      ${chartSvg(rows, series)}
      <h2>Нивото по тип задача</h2>
      <div class="filter">${[['all', 'Всички'], ...Object.entries(AREAS)].map(([k, v]) => `<button class="chip-btn ${area === k ? 'active' : ''}" data-area="${k}">${v}</button>`).join('')}</div>
      <p class="note">Нивото е процентът верни от последните ${RECENT} задачи от типа. Със „!“ са типовете, които според МОН затрудняват повечето деца. Отметни, за да видиш типа на графиката.</p>
      <div class="meters">${types.map(s => { const n = latest.levels[s.number]; const id = selected.indexOf(s.number); return `<label class="meter-row ${id >= 0 ? 'selected' : ''}">
        <input type="checkbox" data-n="${s.number}" ${id >= 0 ? 'checked' : ''} ${n === null ? 'disabled' : ''}>
        <span class="name">${s.number}. ${s.name}${SKILLS[s.number].hard ? ` <abbr title="${SKILLS[s.number].hard}">!</abbr>` : ''}</span>
        <span class="meter">${n !== null ? `<span style="width:${n}%;${id >= 0 ? `background:${SERIES_COLORS[id]}` : ''}"></span>` : ''}</span>
        <span class="pct">${n !== null ? `${n} %` : counts[s.number] ? `${counts[s.number]} задачи` : 'още няма'}</span>
        <a class="small-link" href="#/nvo4/practice/${s.number}">упражнявай</a></label>`; }).join('')}</div>
      <h2>История</h2>
      <ul class="history">${[...attempts].reverse().map(o => `<li>${new Date(o.at).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} · ${o.kind === 'test' ? 'Пробен тест' : `Упражнение: ${TEMPLATES[o.number - 1].name}`} · ${o.points} от ${o.max} т. · ${mmss(o.seconds)}</li>`).join('')}</ul>
      <button class="small" id="clear-history">Изтрий историята</button>
    </section>`;
    enableHover(view.querySelector('.chart'), rows, series);
    view.querySelectorAll('[data-area]').forEach(b => { b.onclick = () => { area = b.dataset.area; render(); }; });
    view.querySelectorAll('.meters input').forEach(c => {
      c.onchange = () => {
        const n = Number(c.dataset.n);
        selected = c.checked ? [...selected, n].slice(-3) : selected.filter(x => x !== n);
        render();
      };
    });
    const clearBtn = view.querySelector('#show-total'); if (clearBtn) clearBtn.onclick = () => { selected = []; render(); };
    view.querySelector('#clear-history').onclick = async () => { if (await confirmDialog('Да изтрия ли цялата история на това устройство?', 'Изтрий', 'Не')) { await clearHistory(); progressPage(view); } };
  };
  render();
}
