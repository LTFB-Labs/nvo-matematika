/* Страницата с пробния тест: показва 25-те задачи, детето отговаря,
   „Провери“ брои точките и дава оценка по скалата на МОН. Вариантът е в
   адреса (?v=123), за да може същият тест да се отвори пак или да се отпечата. */

const $ = s => document.querySelector(s);
const VID = { izbiraem: 'избираем отговор', kratak: 'кратък отговор', razshiren: 'запиши решението', podusloviya: 'запиши решенията' };
/* Скала на МОН за НВО в 4. клас (2023–2024) */
const SKALA = [[84, 'Отличен 6'], [62.5, 'Много добър 5'], [51.75, 'Добър 4'], [30, 'Среден 3'], [0, 'Слаб 2']];

let seed = Number(new URLSearchParams(location.search).get('v')) || Math.floor(Math.random() * 1e6);
let tasks = [];
const salt = {};

/* Числото от отговора: „1 018“, „1018 кв. см“ и „1018“ са едно и също */
const numOf = s => { const m = String(s).replace(/(\d)\s(?=\d{3}\b)/g, '$1').match(/\d+/); return m ? Number(m[0]) : null; };

function taskHtml(t) {
  let body = `<p class="uslovie">${t.uslovie}</p>${t.chertezh ? `<div class="chertezh">${t.chertezh}</div>` : ''}`;
  if (t.otgovori) {
    body += `<div class="izbor ${t.otgovoriSaChertezhi ? 'sa-chertezhi' : ''}">${Object.entries(t.otgovori).map(([k, v]) =>
      `<label class="opcia" data-bukva="${k}"><input type="radio" name="z${t.nomer}" value="${k}"><b>${k})</b> <span>${v}</span></label>`).join('')}</div>`;
  } else if (t.podusloviya) {
    body += t.podusloviya.map(p => `<div class="podusl"><p><b>${p.bukva})</b> ${p.uslovie} <span class="t">${p.tochki} т.</span></p>
      <label class="svoboden">Отговор: <input type="text" inputmode="numeric" data-z="${t.nomer}${p.bukva}"></label>
      <p class="reshenie">${p.reshenie} <b>Отговор: ${p.veren}</b></p></div>`).join('');
  } else {
    body += `<label class="svoboden">Отговор: <input type="text" inputmode="numeric" data-z="${t.nomer}"></label>`;
  }
  if (!t.podusloviya) body += `<p class="reshenie">${t.reshenie}${t.otgovori ? ` <b>Отговор: ${t.veren}</b>` : ` <b>Отговор: ${t.veren}</b>`}</p>`;
  return `<article class="zadacha" id="z${t.nomer}">
    <div class="nomer">${t.nomer}.</div>
    <div class="sadarzhanie">
      <div class="meta"><span class="sablon">${t.ime}</span> · ${VID[t.vid]} · ${t.tochki} т.
        <button class="drug" data-nomer="${t.nomer}" title="Друга задача от същия тип">↻ друга</button></div>
      ${body}
    </div>
  </article>`;
}

function render() {
  tasks = SABLONI.map(s => makeTask(s.nomer, seed + (salt[s.nomer] || 0) * 7777));
  $('#test').innerHTML = tasks.map(taskHtml).join('');
  $('#variant').textContent = `вариант ${seed}`;
  $('#rezultat').textContent = '';
  history.replaceState(null, '', `?v=${seed}`);
}

function score() {
  let total = 0;
  for (const t of tasks) {
    const el = $(`#z${t.nomer}`);
    el.classList.remove('vyarno', 'greshno');
    if (t.otgovori) {
      const ch = el.querySelector('input:checked');
      el.querySelectorAll('.opcia').forEach(o => o.classList.toggle('pravilna', o.dataset.bukva === t.veren));
      const ok = ch && ch.value === t.veren;
      if (ok) total += t.tochki;
      el.classList.add(ok ? 'vyarno' : 'greshno');
    } else if (t.podusloviya) {
      let got = 0;
      for (const p of t.podusloviya) { const v = el.querySelector(`[data-z="${t.nomer}${p.bukva}"]`).value; if (numOf(v) !== null && numOf(v) === numOf(p.veren)) got += p.tochki; }
      total += got;
      el.classList.add(got === t.tochki ? 'vyarno' : 'greshno');
    } else {
      const v = el.querySelector(`[data-z="${t.nomer}"]`).value;
      const ok = numOf(v) !== null && numOf(v) === numOf(t.veren);
      if (ok) total += t.tochki;
      el.classList.add(ok ? 'vyarno' : 'greshno');
    }
  }
  const ocenka = SKALA.find(([min]) => total >= min)[1];
  $('#rezultat').innerHTML = `<b>${total} от 100 точки</b> · ${ocenka}. <span class="belezhka">При задачите с решение тук се проверява само отговорът; на изпита учителят дава точки и за решението.</span>`;
  document.body.classList.add('provereno');
}

$('#nov').onclick = () => { seed = Math.floor(Math.random() * 1e6); for (const k in salt) delete salt[k]; document.body.classList.remove('provereno', 'pokazhi'); $('#otgovori').setAttribute('aria-pressed', 'false'); render(); scrollTo(0, 0); };
$('#otgovori').onclick = e => { const on = document.body.classList.toggle('pokazhi'); e.target.setAttribute('aria-pressed', String(on)); e.target.textContent = on ? 'Скрий отговорите' : 'Покажи отговорите'; };
$('#pechat').onclick = () => print();
$('#proveri').onclick = score;
$('#test').addEventListener('click', e => {
  const b = e.target.closest('.drug');
  if (!b) return;
  const n = Number(b.dataset.nomer);
  salt[n] = (salt[n] || 0) + 1;
  const t = makeTask(n, seed + salt[n] * 7777);
  tasks[n - 1] = t;
  $(`#z${n}`).outerHTML = taskHtml(t);
});

render();
