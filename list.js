/* Тестът като лист хартия. Горе: име, дата, името на теста.
   Фокус: листът е увеличен, по средата една задача; предишната и следващата са
   бледи и размазани, но номерът им се вижда. Бутонът горе вдясно показва целия лист
   в нормален размер; изборът на задача връща във фокус. Над бутона — таймер.
   Засича се времето за всяка задача (докато е на фокус).
   В пробния тест отговорите се проверяват накрая, в упражнението — след всяка задача. */

const VID_TEXT = { izbiraem: 'избери отговор', kratak: 'запиши отговора', razshiren: 'реши и запиши отговора', podusloviya: 'реши трите подусловия' };
/* Скала на МОН за НВО в 4. клас (2023–2024) */
const SKALA = [[84, 'Отличен 6'], [62.5, 'Много добър 5'], [51.75, 'Добър 4'], [30, 'Среден 3'], [0, 'Слаб 2']];
const ocenka = t => SKALA.find(([min]) => t >= min)[1];

/* Числото от отговора: „1 018“, „1018 кв. см“ и „1018“ са едно и също */
const numOf = s => { const m = String(s ?? '').replace(/(\d)\s(?=\d{3}\b)/g, '$1').match(/\d+/); return m ? Number(m[0]) : null; };
const sameNum = (a, b) => numOf(a) !== null && numOf(a) === numOf(b);
const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const dnes = () => new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' });

/* Колко точки носи отговорът; за подусловията отговорът е { А, Б, В } */
function tochkiZa(t, otg) {
  if (t.otgovori) return otg === t.veren ? t.tochki : 0;
  if (t.podusloviya) return t.podusloviya.reduce((s, p) => s + (sameNum(otg?.[p.bukva], p.veren) ? p.tochki : 0), 0);
  return sameNum(otg, t.veren) ? t.tochki : 0;
}

function zadachaHtml(t, i) {
  let body = `<p class="uslovie">${t.uslovie}</p>${t.chertezh ? `<div class="chertezh">${t.chertezh}</div>` : ''}`;
  if (t.otgovori) {
    body += `<div class="izbor ${t.otgovoriSaChertezhi ? 'sa-chertezhi' : ''}">${Object.entries(t.otgovori).map(([k, v]) =>
      `<label class="opcia" data-bukva="${k}"><input type="radio" name="o${i}" value="${k}"><b>${k})</b> <span>${v}</span></label>`).join('')}</div>`;
  } else if (t.podusloviya) {
    body += t.podusloviya.map(p => `<div class="podusl"><p><b>${p.bukva})</b> ${p.uslovie} <span class="t">${p.tochki} т.</span></p>
      <label class="svoboden">Отговор: <input type="text" inputmode="numeric" autocomplete="off" data-i="${i}" data-b="${p.bukva}"></label>
      <p class="reshenie">${p.reshenie} <b>Отговор: ${p.veren}</b></p></div>`).join('');
  } else {
    body += `<label class="svoboden">Отговор: <input type="text" inputmode="numeric" autocomplete="off" data-i="${i}"></label>`;
  }
  if (!t.podusloviya) body += `<p class="reshenie">${t.reshenie} <b>Отговор: ${t.veren}</b></p>`;
  return `<article class="zadacha" data-i="${i}">
    <div class="nomer-z"><span class="nomer">${i + 1}.</span><span class="meta">${VID_TEXT[t.vid]} · ${t.tochki} т.</span><span class="vreme-z"></span></div>
    <div class="tyalo">${body}</div>
    <div class="tipkovnica-myasto"></div>
    <div class="dvizhenie"></div>
  </article>`;
}

/* Отваря листа в root. Връща функция за почистване (спира таймера, клавиатурата, слушателите).
   Фокус: сцена без скролиране. Елементът на фокус (заглавието или задача) е по средата, с
   по-едър текст, и заема почти целия лист; предишният надниква в горните 10 %, следващият в долните 10 %,
   и двата под мъгла; стрелките стоят до тях. „Целият лист“ е обикновен документ, по-малък. */
function openList(root, { tasks, mode, title, podzaglavie, minutes, ime, onIme, onDone }) {
  /* fokus = -1: горната част на листа (име, дата); 0…n-1: задачите */
  const st = { fokus: -1, pregled: false, otg: tasks.map(() => undefined), provereni: new Set(), vreme: tasks.map(() => 0), start: null, fokusOt: Date.now(), krai: false, zapochnat: false };
  root.innerHTML = `<div class="masa ${mode} fokus-mod bez-animacia">
    <div class="kontroli">
      <div class="chas" id="chas" title="${mode === 'test' ? 'Оставащо време' : 'Време'}">${mode === 'test' ? mmss(minutes * 60) : '0:00'}</div>
      <button class="ikona" id="tsyal" title="Целият лист" aria-label="Покажи целия лист"><span class="ik ik-list"></span></button>
      <nav class="lenta" aria-label="Задачите">${tasks.map((_, i) => `<button class="lenta-t" data-lenta="${i}" title="Задача ${i + 1}" aria-label="Задача ${i + 1}"><span class="lt-tochka"></span></button>`).join('')}</nav>
    </div>
    <a class="izhod" href="#/" title="Изход" aria-label="Изход"><span class="ik ik-izhod"></span></a>
    <div class="hartiya">
      <header class="zaglavka">
        <div class="pechat-rez" id="pechat-rez"></div>
        <p class="z-gore">${podzaglavie}</p>
        <h1>${title}</h1>
        <p class="z-data">${dnes()}</p>
        <div class="poleta">
          <label>Име: <input id="ime-ucenik" value="${ime || ''}" autocomplete="off"></label>
          <span>Клас: <u>IV</u></span>
        </div>
        ${mode === 'test'
    ? `<p class="ukazanie">Прочети внимателно задачите. На задачите от № 1 до № ${tasks.filter(x => x.vid === 'izbiraem').length} избери буквата на верния отговор. На останалите запиши отговора. Имаш ${minutes} минути.</p>`
    : `<p class="ukazanie">Прочети внимателно задачите. След всяка ще видиш дали е вярно и как се решава.</p>`}
        <div class="start-myasto"><button class="glaven start-b" id="start">Старт</button></div>
      </header>
      <section class="zadachi">${tasks.map(zadachaHtml).join('')}</section>
      <footer class="dolu-list"><p class="krai-tekst">Край на ${mode === 'test' ? 'теста' : 'упражнението'}</p>${mode === 'test' ? '<button class="glaven" id="predai" disabled>Предай теста</button>' : ''}</footer>
    </div>
    <div class="etap etap-gore"></div>
    <div class="etap etap-dolu"></div>
    <button class="predai-b blad" id="gotov" disabled>${mode === 'test' ? 'Предай теста' : 'Виж резултата'}</button>
  </div>`;
  const masa = root.querySelector('.masa');
  const hartiya = root.querySelector('.hartiya');
  const zaglavka = root.querySelector('.zaglavka');
  const arts = [...root.querySelectorAll('.zadacha')];
  const kraiList = root.querySelector('.dolu-list');
  /* индекс = fokus + 1; краят на листа е последен: само надниква под последната задача */
  const elementi = [zaglavka, ...arts, kraiList];
  const etapGore = root.querySelector('.etap-gore'), etapDolu = root.querySelector('.etap-dolu');

  /* На телефон и таблет: голяма клавиатура с цифри под задачата вместо системната */
  const MOBILNO = matchMedia('(pointer: coarse)').matches || matchMedia('(max-width: 760px)').matches;
  if (MOBILNO) root.querySelectorAll('.zadachi input[type=text]').forEach(inp => inp.setAttribute('inputmode', 'none'));
  const KLAVISHI = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '↵'];
  const tipkovnicaHtml = () => `<div class="tipkovnica" role="group" aria-label="Клавиатура">${KLAVISHI.map(k =>
    `<button type="button" data-k="${k}" class="${k === '↵' ? 'k-enter' : k === '⌫' ? 'k-triene' : ''}" aria-label="${k === '⌫' ? 'Изтрий' : k === '↵' ? 'Готово' : k}">${k === '↵' ? 'готово' : k}</button>`).join('')}</div>`;
  const izberiPole = inp => {
    root.querySelectorAll('.aktivno-pole').forEach(x => x.classList.remove('aktivno-pole'));
    st.pole = inp || null;
    if (st.pole) st.pole.classList.add('aktivno-pole');
  };

  const answered = i => { const a = st.otg[i]; return a !== undefined && (typeof a === 'object' ? Object.values(a).some(v => String(v).trim()) : String(a).trim() !== ''); };
  /* „Предай теста“ е извън листа, долу вдясно: много блед, докато има задачи без отговор
     (в упражнението — непроверени), ярък, когато всички са готови */
  const obnoviGotov = () => {
    const vsichki = mode === 'test' ? tasks.every((_, i) => answered(i)) : st.provereni.size === tasks.length;
    const b = root.querySelector('#gotov');
    b.hidden = st.krai;
    b.classList.toggle('blad', !vsichki);
    b.disabled = !vsichki;                       /* активен само когато всички задачи имат отговор */
    const p = root.querySelector('#predai'); if (p) p.disabled = !vsichki;
  };
  /* лентата под бутона за режима: точка за всяка задача — празна без отговор, пълна с отговор,
     сегашната е по-голяма; след предаване — вярно/грешно */
  const lentaT = [...root.querySelectorAll('.lenta-t')];
  const obnoviLenta = () => lentaT.forEach((t, i) => {
    t.classList.toggle('sega', i === st.fokus);
    t.classList.toggle('otg', answered(i));
    t.title = `Задача ${i + 1}${answered(i) ? ' · има отговор' : ' · без отговор'}`;
    t.classList.toggle('vyarno', st.krai && tochkiZa(tasks[i], st.otg[i]) === tasks[i].tochki);
    t.classList.toggle('greshno', st.krai && tochkiZa(tasks[i], st.otg[i]) !== tasks[i].tochki);
  });
  const otchetiVreme = () => { if (!st.pregled && !st.krai && st.fokus >= 0) st.vreme[st.fokus] += Date.now() - st.fokusOt; st.fokusOt = Date.now(); };

  /* Изборът на отговор не мести нищо: детето само натиска стрелката. В упражнението
     „Провери“ (в задачата) показва решението. */
  const STRELKA_DOLU = (label = 'Следваща задача') => `<button class="strelka-b napred" aria-label="${label}"><span class="ik ik-dolu"></span></button>`;
  const vZadachata = i => (mode === 'practice' && !st.provereni.has(i) && !st.krai ? '<button class="proveri-z">Провери</button>' : '');
  function etapi() {
    const i = st.fokus, last = i === tasks.length - 1;
    etapGore.innerHTML = !st.pregled && !st.krai && i >= 0 ? `<button class="strelka-b nazad" aria-label="${i === 0 ? 'Към началото на листа' : 'Предишна задача'}"><span class="ik ik-gore"></span></button>` : '';
    let dolu = '';
    if (!st.pregled && !st.krai) {
      if (!last && st.zapochnat) dolu = STRELKA_DOLU(i < 0 ? 'Към първата задача' : 'Следваща задача');
    }
    etapDolu.innerHTML = dolu;
  }

  /* Разполага сцената: фокус по средата, съседите в горните и долните 15 %, другите извън екрана */
  function razpolozhi() {
    if (st.pregled) { elementi.forEach(el => { el.style.removeProperty('--y'); el.style.removeProperty('max-height'); }); return; }
    /* сцената е листът (вижда се горният и долният му край); съседите са в 10 % от краищата му */
    const r = hartiya.getBoundingClientRect(), H = r.height, PEEK = Math.round(H * 0.10);
    const gH = etapGore.offsetHeight || 0, dH = etapDolu.offsetHeight || 0;
    const gore = PEEK + gH + 6, dolu = H - PEEK - dH - 6;
    const f = st.fokus + 1;
    elementi.forEach((el, k) => {
      if (k === f) {
        el.style.maxHeight = `${Math.max(120, dolu - gore)}px`;
        const h = el.offsetHeight;
        el.style.setProperty('--y', `${gore + Math.max(0, (dolu - gore - h) / 2)}px`);
      } else if (k === f - 1) {
        /* предишният показва горната си част (номера) в горните 15 % */
        el.style.maxHeight = `${PEEK - 8}px`;
        el.style.setProperty('--y', `${Math.max(0, PEEK - 8 - el.offsetHeight)}px`);
      } else {
        el.style.removeProperty('max-height');
        const h = el.offsetHeight;
        el.style.setProperty('--y', `${k === f + 1 ? H - PEEK : k < f ? -h - 60 : H + 60}px`);
      }
    });
    etapGore.style.top = `${r.top + PEEK}px`;
    etapDolu.style.bottom = `${innerHeight - r.bottom + PEEK}px`;
  }

  function pokazhi() {
    const f = st.fokus + 1;
    elementi.forEach((el, k) => {
      const naFokus = !st.pregled && k === f;
      el.classList.toggle('fokus', naFokus);
      el.classList.toggle('sasedno', !st.pregled && Math.abs(k - f) === 1);
      el.classList.toggle('daleche', !st.pregled && Math.abs(k - f) > 1);
    });
    arts.forEach((a, k) => {
      const naFokus = !st.pregled && k === st.fokus;
      a.classList.toggle('otgovorena', answered(k));
      a.querySelector('.dvizhenie').innerHTML = naFokus ? vZadachata(k) : '';
      a.querySelectorAll('input').forEach(inp => { inp.tabIndex = naFokus || st.pregled ? 0 : -1; });
      const imaPole = a.querySelector('input[type=text]:not([disabled])');
      a.querySelector('.tipkovnica-myasto').innerHTML = MOBILNO && naFokus && imaPole && !st.krai ? tipkovnicaHtml() : '';
    });
    masa.classList.toggle('fokus-mod', !st.pregled);
    masa.classList.toggle('tsyal-mod', st.pregled);
    document.body.classList.toggle('scena', !st.pregled);
    root.querySelector('#tsyal').innerHTML = `<span class="ik ${st.pregled ? 'ik-fokus' : 'ik-list'}"></span>`;
    root.querySelector('#tsyal').title = st.pregled ? 'Към задачата' : 'Целият лист';
    etapi();
    razpolozhi();
    obnoviLenta();
  }

  const bezAnimacia = () => { masa.classList.add('bez-animacia'); requestAnimationFrame(() => requestAnimationFrame(() => masa.classList.remove('bez-animacia'))); };

  function focus(i) {
    if (!st.zapochnat && i >= 0) return;          /* преди „Старт“ задачите не се отварят */
    otchetiVreme();
    if (st.pregled) bezAnimacia();   /* от „целия лист“ към фокус: без плъзгане от старите места */
    st.pregled = false;
    st.fokus = Math.max(-1, Math.min(tasks.length - 1, i));
    scrollTo(0, 0);
    pokazhi();
    if (st.fokus < 0) return;
    const el = arts[st.fokus];
    el.scrollTop = 0;
    const first = el.querySelector('input[type=text]:not([disabled])');
    izberiPole(first);
    if (first && !st.krai && !MOBILNO) setTimeout(() => first.focus({ preventScroll: true }), 450);
  }

  function tsyalList() {
    otchetiVreme();
    st.pregled = true;
    pokazhi();
    requestAnimationFrame(() => (arts[st.fokus] || hartiya).scrollIntoView({ block: st.fokus >= 0 ? 'center' : 'start' }));
  }

  function proveriZadacha(i) {
    st.provereni.add(i);
    const a = arts[i], t = tasks[i];
    const ok = tochkiZa(t, st.otg[i]) === t.tochki;
    a.classList.add('provereno', ok ? 'vyarno' : 'greshno');
    a.querySelectorAll('.opcia').forEach(o => o.classList.toggle('pravilna', o.dataset.bukva === t.veren));
    a.querySelectorAll('input').forEach(inp => { inp.disabled = true; });
  }

  function finish() {
    if (st.krai) return;
    otchetiVreme();
    st.krai = true;
    clearInterval(timer);
    tasks.forEach((_, i) => { if (!st.provereni.has(i)) proveriZadacha(i); });
    const zadachi = tasks.map((t, i) => {
      const poluchi = tochkiZa(t, st.otg[i]);
      return { nomer: t.nomer, vid: t.vid, tochki: t.tochki, poluchi, vyarno: poluchi === t.tochki, sekundi: Math.round(st.vreme[i] / 1000), ...(t.istinska ? { istinska: t.istinska } : {}) };
    });
    zadachi.forEach((z, i) => { arts[i].querySelector('.vreme-z').textContent = `⏱ ${mmss(z.sekundi)}`; });
    const rez = { tochki: zadachi.reduce((s, z) => s + z.poluchi, 0), max: zadachi.reduce((s, z) => s + z.tochki, 0), sekundi: Math.round((Date.now() - st.start) / 1000), zadachi };
    root.querySelector('#pechat-rez').innerHTML = mode === 'test' ? `${rez.tochki} т.<small>${ocenka(rez.tochki)}</small>` : `${rez.tochki}/${rez.max}<small>${Math.round((100 * rez.tochki) / rez.max)} %</small>`;
    st.pregled = true;
    masa.classList.add('krai');
    obnoviGotov();
    pokazhi();
    onDone(rez);
  }

  /* отговорите */
  root.querySelector('.zadachi').addEventListener('change', e => {
    const art = e.target.closest('.zadacha'); if (!art) return;
    if (e.target.type === 'radio') st.otg[Number(art.dataset.i)] = e.target.value;
    art.classList.toggle('otgovorena', answered(Number(art.dataset.i)));
    obnoviGotov();
    obnoviLenta();
  });
  root.querySelector('.zadachi').addEventListener('input', e => {
    const i = Number(e.target.dataset.i);
    if (Number.isNaN(i)) return;
    if (e.target.dataset.b) st.otg[i] = { ...(st.otg[i] || {}), [e.target.dataset.b]: e.target.value };
    else st.otg[i] = e.target.value;
    arts[i].classList.toggle('otgovorena', answered(i));
    obnoviGotov();
    obnoviLenta();
  });
  root.querySelector('#ime-ucenik').addEventListener('change', e => onIme && onIme(e.target.value.trim()));
  /* клавиатурата: натискането не взима фокуса от полето; пише в избраното поле */
  root.querySelector('.zadachi').addEventListener('focusin', e => { if (e.target.matches('input[type=text]')) izberiPole(e.target); });
  root.addEventListener('pointerdown', e => { if (e.target.closest('[data-k]')) e.preventDefault(); });
  const sledvashtButon = () => root.querySelector('.zadacha.fokus .proveri-z') || etapDolu.querySelector('.napred');
  const natisni = k => {
    if (k === '↵') { const nb = sledvashtButon(); if (nb) nb.click(); return; }
    const pole = st.pole && !st.pole.disabled ? st.pole : arts[st.fokus]?.querySelector('input[type=text]:not([disabled])');
    if (!pole) return;
    pole.value = k === '⌫' ? pole.value.slice(0, -1) : (pole.value + k).slice(0, 9);
    pole.dispatchEvent(new Event('input', { bubbles: true }));
    if (navigator.vibrate) { try { navigator.vibrate(8); } catch { /* няма */ } }
  };

  /* движение */
  root.addEventListener('click', e => {
    const b = e.target;
    const kl = b.closest('[data-k]'); if (kl) return natisni(kl.dataset.k);
    const lt = b.closest('[data-lenta]');
    if (lt) {
      const i = Number(lt.dataset.lenta);
      if (st.pregled) { st.fokus = i; obnoviLenta(); return arts[i].scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return focus(i);
    }
    if (b.closest('.napred')) return focus(st.fokus + 1);
    if (b.closest('.nazad')) return focus(st.fokus - 1);
    if (b.closest('.proveri-z')) { proveriZadacha(st.fokus); obnoviGotov(); return pokazhi(); }
    if (b.closest('#gotov') || b.closest('#predai')) return finish();   /* бутонът е активен само когато всичко е готово */
    if (b.closest('#start')) return zapochni();
    if (b.closest('#tsyal')) { if (st.krai || !st.zapochnat) return; return st.pregled ? focus(Math.max(0, st.fokus)) : tsyalList(); }
    if (st.krai) return;
    const el = b.closest('.zadacha, .zaglavka');
    if (!el) return;
    const idx = elementi.indexOf(el) - 1;
    if (st.pregled) return focus(idx);
    if (!el.classList.contains('fokus') && !b.closest('input, label')) { e.preventDefault(); focus(idx); }
  });
  const onKey = e => {
    if (st.krai || st.pregled) return;
    const typing = e.target.tagName === 'INPUT' && e.target.type === 'text';
    if (e.key === 'Enter' && e.target.id === 'ime-ucenik') { e.preventDefault(); e.target.blur(); return st.zapochnat ? focus(st.fokus + 1) : zapochni(); }
    if (e.key === 'Enter' && typing) { e.preventDefault(); const nb = sledvashtButon(); if (nb) nb.click(); return; }
    if (typing) return;
    /* надолу и надясно — напред; нагоре и наляво — назад */
    if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) { e.preventDefault(); focus(st.fokus + 1); }
    if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); focus(st.fokus - 1); }
  };
  document.addEventListener('keydown', onKey);
  const onResize = () => razpolozhi();
  addEventListener('resize', onResize);

  /* „Старт“: таймерът тръгва и листът минава на първата задача */
  const chas = root.querySelector('#chas');
  let timer;
  function zapochni() {
    if (st.zapochnat) return;
    st.zapochnat = true;
    st.start = Date.now();
    st.fokusOt = Date.now();
    root.querySelector('.start-myasto').remove();
    root.querySelector('#tsyal').disabled = false;
    timer = setInterval(() => {
      const s = Math.round((Date.now() - st.start) / 1000);
      if (mode === 'test') {
        const left = minutes * 60 - s;
        chas.textContent = mmss(Math.max(0, left));
        chas.classList.toggle('malko', left <= 300);
        if (left <= 0) finish();
      } else chas.textContent = mmss(s);
    }, 1000);
    focus(0);
  }

  /* Влачене на листа с мишката само в „целия лист“: курсорът е ръка, която хваща листа,
     влаченето скролира документа. Във фокус листът не се влачи. */
  let vl = null;
  const NE_VLACHI = 'input, label, button, a, select, textarea, .opcia';
  hartiya.addEventListener('pointerdown', e => {
    if (!st.pregled || e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest(NE_VLACHI) || st.krai) return;
    vl = { y: e.clientY, scroll: scrollY, mrdna: false };
    hartiya.setPointerCapture(e.pointerId);
  });
  hartiya.addEventListener('pointermove', e => {
    if (!vl) return;
    const dy = e.clientY - vl.y;
    if (!vl.mrdna && Math.abs(dy) < 5) return;
    if (!vl.mrdna) { vl.mrdna = true; masa.classList.add('vlachene'); }
    scrollTo(0, vl.scroll - dy);
  });
  const pusni = e => {
    if (!vl) return;
    const { mrdna } = vl;
    vl = null;
    masa.classList.remove('vlachene');
    if (hartiya.hasPointerCapture?.(e.pointerId)) hartiya.releasePointerCapture(e.pointerId);
    if (!mrdna) return;
    hartiya.addEventListener('click', ev => ev.stopPropagation(), { capture: true, once: true });   /* кликът след влачене не избира задача */
  };
  hartiya.addEventListener('pointerup', pusni);
  hartiya.addEventListener('pointercancel', pusni);

  /* Колелце на мишката и плъзгане с пръст във фокус: следващ/предишен елемент.
     Ако задачата на фокус е по-висока от екрана, първо се скролира тя. */
  const mozheDaSkrolira = (el, posoka) => el && el.scrollHeight > el.clientHeight + 2 && (posoka > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 2 : el.scrollTop > 2);
  let zaklyuchen = 0, natrupano = 0;
  const onWheel = e => {
    if (st.pregled || st.krai) return;
    const fEl = elementi[st.fokus + 1];
    if (fEl.contains(e.target) && mozheDaSkrolira(fEl, e.deltaY)) return;
    e.preventDefault();
    if (performance.now() < zaklyuchen) return;
    natrupano += e.deltaY;
    if (Math.abs(natrupano) > 60) { focus(st.fokus + Math.sign(natrupano)); natrupano = 0; zaklyuchen = performance.now() + 550; }
  };
  document.addEventListener('wheel', onWheel, { passive: false });
  let dok = null;
  masa.addEventListener('touchstart', e => { if (!st.pregled && !st.krai && e.touches.length === 1) dok = { y: e.touches[0].clientY, vatre: elementi[st.fokus + 1].contains(e.target) }; }, { passive: true });
  masa.addEventListener('touchend', e => {
    if (!dok) return;
    const dy = e.changedTouches[0].clientY - dok.y, fEl = elementi[st.fokus + 1];
    const vatre = dok.vatre; dok = null;
    if (Math.abs(dy) < 50 || (vatre && mozheDaSkrolira(fEl, -dy))) return;
    focus(st.fokus + (dy < 0 ? 1 : -1));
  });

  root.querySelector('#tsyal').disabled = true;
  focus(-1);
  bezAnimacia();
  return () => { clearInterval(timer); document.removeEventListener('keydown', onKey); removeEventListener('resize', onResize); document.body.classList.remove('scena'); document.removeEventListener('wheel', onWheel); };
}

/* Потвърждение в самата страница (в артифакт confirm() винаги връща „не“) */
function potvardi(tekst, da = 'Да', ne = 'Не') {
  return new Promise(ok => {
    const el = document.createElement('div');
    el.className = 'potvarzhdenie';
    el.innerHTML = `<div class="potv-karta" role="alertdialog" aria-modal="true"><p>${tekst}</p><div class="potv-butoni"><button class="ne">${ne}</button><button class="glaven da">${da}</button></div></div>`;
    const zatvori = otg => { el.remove(); ok(otg); };
    el.addEventListener('click', e => { if (e.target.closest('.da')) zatvori(true); else if (e.target.closest('.ne') || e.target === el) zatvori(false); });
    document.body.append(el);
    el.querySelector('.da').focus();
  });
}
