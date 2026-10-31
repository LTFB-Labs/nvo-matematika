/* A test variant as a plain A4 document: no buttons, no background, like the paper MON test.
   The print button of the test sheet opens it in a new tab with the same variant (?v=seed),
   and the print dialog opens by itself. */

const seed = Number(new URLSearchParams(location.search).get('v')) || Math.floor(Math.random() * 1e6);
const tasks = makeTest(seed);
const choiceCount = tasks.filter(t => t.kind === 'choice').length;
const date = new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' });

function taskHtml(t, i) {
  let body = `<p class="task-text">${t.text}</p>${t.drawing ? `<div class="drawing">${t.drawing}</div>` : ''}`;
  if (t.options) {
    body += `<ul class="choices ${t.optionsAreDrawings ? 'has-drawings' : ''}">${Object.entries(t.options).map(([k, v]) =>
      `<li><span class="circle"></span><b>${k})</b> <span>${v}</span></li>`).join('')}</ul>`;
  } else if (t.parts) {
    body += t.parts.map(p => `<div class="part"><p><b>${p.letter})</b> ${p.text} <span class="pts">(${p.points} т.)</span></p>
      <div class="work"></div><p class="answer">Отговор: <span class="line"></span></p></div>`).join('');
  } else {
    body += `${t.kind === 'extended' ? '<div class="work"></div>' : ''}<p class="answer">Отговор: <span class="line"></span></p>`;
  }
  return `<article class="task"><div class="number">${i + 1}.</div><div class="task-body">${body}</div><div class="points">${t.points} т.</div></article>`;
}

document.getElementById('doc').innerHTML = `<header class="doc-header">
    <p class="variant">Пробен тест по модела на НВО · вариант ${seed}</p>
    <h1>Национално външно оценяване в края на IV клас<br>Тест по математика</h1>
    <p class="date">${date}</p>
    <div class="fields"><span>Име: <span class="line long"></span></span><span>Клас: <span class="line short"></span></span></div>
    <p class="instructions">Прочети внимателно задачите. На задачите от № 1 до № ${choiceCount} огради буквата на верния отговор. На останалите запиши отговора, а където е нужно, и решението. Имаш 60 минути.</p>
  </header>
  ${tasks.map(taskHtml).join('')}
  <p class="end">Край на теста</p>`;

addEventListener('load', () => setTimeout(() => print(), 300));
