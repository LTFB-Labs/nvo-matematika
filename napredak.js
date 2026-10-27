/* Напредък: не срещу други деца, а летва с нивото на детето във времето.
   Ниво на тип задача = успеваемост на последните 20 решени задачи от него (поне 3).
   Общо ниво = очаквани точки на НВО: точките на всяка позиция × нивото на типа,
   само за типовете, които детето е решавало (затова пише и по колко типа е). */

const POSLEDNI = 20, MIN_ZA_NIVO = 3;
const SERII = ['var(--seria-1)', 'var(--seria-2)', 'var(--seria-3)'];   /* до 3 избрани типа на графиката; цветовете са от темата */

const denOt = iso => iso.slice(0, 10);

function nivoNaTip(reshenia) {
  const r = reshenia.slice(-POSLEDNI);
  return r.length >= MIN_ZA_NIVO ? Math.round((100 * r.filter(x => x.vyarno).length) / r.length) : null;
}

/* Нивата по тип и очакваните точки в края на всеки ден с решаване */
function nivaVavVremeto(reshenia) {
  const sort = [...reshenia].sort((a, b) => a.koga.localeCompare(b.koga));
  const dni = [...new Set(sort.map(r => denOt(r.koga)))];
  const poTip = {};
  const red = [];
  let k = 0;
  for (const den of dni) {
    while (k < sort.length && denOt(sort[k].koga) <= den) { (poTip[sort[k].nomer] ||= []).push(sort[k]); k++; }
    const niva = {};
    for (const s of SABLONI) niva[s.nomer] = poTip[s.nomer] ? nivoNaTip(poTip[s.nomer]) : null;
    const izv = SABLONI.filter(s => niva[s.nomer] !== null);
    const max = izv.reduce((a, s) => a + s.tochki, 0);
    const ochakvani = max ? Math.round((100 * izv.reduce((a, s) => a + (s.tochki * niva[s.nomer]) / 100, 0)) / max) : null;
    red.push({ den, niva, ochakvani, tipove: izv.length });
  }
  return red;
}

/* Линейна графика с една ос 0–100; hover показва стойностите за деня */
function grafikaSvg(red, serii) {
  const W = 680, H = 230, L = 36, R = 16, T = 14, B = 28;
  const t0 = new Date(red[0].den).getTime(), t1 = new Date(red[red.length - 1].den).getTime();
  const x = den => (t1 === t0 ? L + (W - L - R) / 2 : L + ((new Date(den).getTime() - t0) / (t1 - t0)) * (W - L - R));
  const y = v => T + (1 - v / 100) * (H - T - B);
  let g = '';
  for (const v of [0, 25, 50, 75, 100]) g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="g-mrezha"/><text x="${L - 6}" y="${y(v) + 4}" class="g-os" text-anchor="end">${v}</text>`;
  const fmtDen = d => new Date(d).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' });
  g += `<text x="${L}" y="${H - 8}" class="g-os">${fmtDen(red[0].den)}</text>`;
  if (red.length > 1) g += `<text x="${W - R}" y="${H - 8}" class="g-os" text-anchor="end">${fmtDen(red[red.length - 1].den)}</text>`;
  for (const s of serii) {
    const pts = red.filter(p => s.v(p) !== null).map(p => [x(p.den), y(s.v(p))]);
    if (pts.length > 1) g += `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" style="stroke:${s.cvyat}" stroke-width="2" stroke-linejoin="round"/>`;
    g += pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" style="fill:${s.cvyat};stroke:var(--povarhnost)" stroke-width="2"/>`).join('');
  }
  g += `<line class="g-kursor" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/>`;
  return `<div class="grafika" data-l="${L}" data-r="${R}" data-w="${W}">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Нивото във времето">${g}<rect class="g-hit" x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="transparent"/></svg>
    <div class="g-tooltip" hidden></div></div>`;
}

function vkluchiHover(el, red, serii) {
  const svgEl = el.querySelector('svg'), tip = el.querySelector('.g-tooltip'), kur = el.querySelector('.g-kursor');
  const W = Number(el.dataset.w), L = Number(el.dataset.l), R = Number(el.dataset.r);
  const t0 = new Date(red[0].den).getTime(), t1 = new Date(red[red.length - 1].den).getTime();
  const xOf = den => (t1 === t0 ? L + (W - L - R) / 2 : L + ((new Date(den).getTime() - t0) / (t1 - t0)) * (W - L - R));
  svgEl.addEventListener('mousemove', e => {
    const b = svgEl.getBoundingClientRect();
    const mx = ((e.clientX - b.left) / b.width) * W;
    const p = red.reduce((best, q) => (Math.abs(xOf(q.den) - mx) < Math.abs(xOf(best.den) - mx) ? q : best));
    const px = xOf(p.den);
    kur.setAttribute('x1', px); kur.setAttribute('x2', px); kur.setAttribute('visibility', 'visible');
    tip.hidden = false;
    tip.innerHTML = `<b>${new Date(p.den).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long' })}</b>${serii.map(s => `<div><i style="background:${s.cvyat}"></i>${s.ime}: ${s.v(p) ?? '—'}${s.edinica}</div>`).join('')}`;
    tip.style.left = `${(px / W) * 100}%`;
  });
  svgEl.addEventListener('mouseleave', () => { tip.hidden = true; kur.setAttribute('visibility', 'hidden'); });
}

async function napredakStranica(izgled) {
  const reshenia = await danni.reshenia.all();
  const opiti = (await danni.opiti.all()).sort((a, b) => a.koga.localeCompare(b.koga));
  if (!reshenia.length) {
    izgled.innerHTML = '<section class="stranica"><h1>Напредък</h1><p class="vodach">Още няма решени задачи. Започни с <a href="#/test">пробен тест</a> или с <a href="#/tipove">упражнение</a>.</p></section>';
    return;
  }
  const red = nivaVavVremeto(reshenia);
  const sega = red[red.length - 1];
  const broi = {}; for (const r of reshenia) broi[r.nomer] = (broi[r.nomer] || 0) + 1;
  let izbrani = [];
  let oblast = 'vsichki';

  const render = () => {
    const serii = izbrani.length
      ? izbrani.map((n, i) => ({ ime: `${n}. ${SABLONI[n - 1].ime}`, cvyat: SERII[i], v: p => p.niva[n], edinica: ' %' }))
      : [{ ime: 'Очаквани точки на НВО', cvyat: SERII[0], v: p => p.ochakvani, edinica: ' т.' }];
    const tipove = SABLONI.filter(s => oblast === 'vsichki' || UMENIA[s.nomer].oblast === oblast)
      .sort((a, b) => (sega.niva[a.nomer] ?? 101) - (sega.niva[b.nomer] ?? 101));
    izgled.innerHTML = `<section class="stranica napredak">
      <h1>Напредък</h1>
      <div class="geroi">
        <div class="geroi-chislo"><b>${sega.ochakvani ?? '—'}</b><span>очаквани точки на НВО<br>по ${sega.tipove} от 25 типа задачи</span></div>
        <div class="letva-golyama"><span style="width:${sega.ochakvani ?? 0}%"></span>${[30, 51.75, 62.5, 84].map(v => `<i style="left:${v}%" title="${ocenka(v)}"></i>`).join('')}</div>
        <div class="skala-ocenki"><span>2</span><span style="left:30%">3</span><span style="left:51.75%">4</span><span style="left:62.5%">5</span><span style="left:84%">6</span></div>
      </div>
      <h2>${izbrani.length ? 'Нивото на избраните типове във времето' : 'Очаквани точки във времето'}</h2>
      ${izbrani.length ? `<div class="legenda">${izbrani.map((n, i) => `<span><i style="background:${SERII[i]}"></i>${n}. ${SABLONI[n - 1].ime}</span>`).join('')}<button class="malak" id="izchisti">само общото ниво</button></div>` : '<p class="belezhka">Избери до 3 типа отдолу, за да видиш как расте нивото им.</p>'}
      ${grafikaSvg(red, serii)}
      <h2>Нивото по тип задача</h2>
      <div class="filtar">${[['vsichki', 'Всички'], ...Object.entries(OBLASTI)].map(([k, v]) => `<button class="chip-b ${oblast === k ? 'aktiven' : ''}" data-oblast="${k}">${v}</button>`).join('')}</div>
      <p class="belezhka">Нивото е процентът верни от последните ${POSLEDNI} задачи от типа. Със „!“ са типовете, които според МОН затрудняват повечето деца. Отметни, за да видиш типа на графиката.</p>
      <div class="letvi">${tipove.map(s => { const n = sega.niva[s.nomer]; const id = izbrani.indexOf(s.nomer); return `<label class="letva-red ${id >= 0 ? 'izbran' : ''}">
        <input type="checkbox" data-n="${s.nomer}" ${id >= 0 ? 'checked' : ''} ${n === null ? 'disabled' : ''}>
        <span class="ime">${s.nomer}. ${s.ime}${UMENIA[s.nomer].trudno ? ` <abbr title="${UMENIA[s.nomer].trudno}">!</abbr>` : ''}</span>
        <span class="letva">${n !== null ? `<span style="width:${n}%;${id >= 0 ? `background:${SERII[id]}` : ''}"></span>` : ''}</span>
        <span class="pr">${n !== null ? `${n} %` : broi[s.nomer] ? `${broi[s.nomer]} задачи` : 'още няма'}</span>
        <a class="malak-l" href="#/uprazhnenie/${s.nomer}">упражнявай</a></label>`; }).join('')}</div>
      <h2>История</h2>
      <ul class="istoria">${[...opiti].reverse().map(o => `<li>${new Date(o.koga).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} · ${o.vid === 'test' ? 'Пробен тест' : `Упражнение: ${SABLONI[o.nomer - 1].ime}`} · ${o.tochki} от ${o.max} т. · ${mmss(o.sekundi)}</li>`).join('')}</ul>
      <button class="malak" id="iztrij">Изтрий историята</button>
    </section>`;
    vkluchiHover(izgled.querySelector('.grafika'), red, serii);
    izgled.querySelectorAll('[data-oblast]').forEach(b => { b.onclick = () => { oblast = b.dataset.oblast; render(); }; });
    izgled.querySelectorAll('.letvi input').forEach(c => {
      c.onchange = () => {
        const n = Number(c.dataset.n);
        izbrani = c.checked ? [...izbrani, n].slice(-3) : izbrani.filter(x => x !== n);
        render();
      };
    });
    const iz = izgled.querySelector('#izchisti'); if (iz) iz.onclick = () => { izbrani = []; render(); };
    izgled.querySelector('#iztrij').onclick = async () => { if (await potvardi('Да изтрия ли цялата история на това устройство?', 'Изтрий', 'Не')) { await iztriiIstoria(); napredakStranica(izgled); } };
  };
  render();
}
