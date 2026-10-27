/* 25-те шаблона на НВО по математика в 4. клас, по един за всяка позиция
   в теста (виж ../research/tipove-zadachi.md). Всеки шаблон е функция
   rng → задача: { uslovie, chertezh, otgovori, veren, reshenie } за
   избираемите и { uslovie, chertezh, veren, reshenie } за свободните.
   Грешните отговори са типични грешки, не случайни числа.
   Парите са в евро: от 2026 г. България е в еврозоната. */

const PLACES = ['единици', 'десетици', 'стотици', 'хиляди', 'десетохиляди', 'стохиляди', 'милиони', 'десетомилиони'];
/* след число: „1 стохиляда“, „3 стохиляди“, „3 милиона“ */
const PLACE_ONE = ['единица', 'десетица', 'стотица', 'хиляда', 'десетохиляда', 'стохиляда', 'милион', 'десетомилион'];
const PLACE_MANY = ['единици', 'десетици', 'стотици', 'хиляди', 'десетохиляди', 'стохиляди', 'милиона', 'десетомилиона'];
const placeOf = (d, k) => `${d} ${(d === 1 ? PLACE_ONE : PLACE_MANY)[k]}`;
const MASC = ['', 'един', 'два', 'три', 'четири', 'пет', 'шест'];
const FEM = ['', 'една', 'две', 'три', 'четири', 'пет', 'шест'];
const PART = { 2: ['половинка', 'половинката', 'половината'], 3: ['третинка', 'третинката', 'третинката'], 4: ['четвъртинка', 'четвъртинката', 'четвъртинката'] };
const OP = { '+': 'събиране', '–': 'изваждане', '·': 'умножение', ':': 'деление' };
const minutesText = t => { const h = Math.floor(t / 60), m = t % 60; return h && m ? `${h} ч. и ${m} мин.` : h ? `${h} ч.` : `${m} мин.`; };
const ident = x => x;

/* ---------- 1. Запис и четене на многоцифрено число ---------- */
function t01_zapis(r) {
  const v = r.pick(['dumi', 'cifra', 'sadarzha']);
  if (v === 'dumi') {
    /* число с нули на места, където децата бъркат */
    const mil = r.pick([r.R(1, 9), r.R(10, 99)]);
    const th = r.pick([r.R(1, 9) * 10, r.R(1, 9) * 100 + r.R(1, 9) * 10, r.R(10, 99), r.R(1, 9)]);
    const un = r.pick([r.R(1, 9), r.R(1, 9) * 10, r.R(1, 9) * 100 + r.R(1, 9)]);
    const n = mil * 1e6 + th * 1000 + un;
    const s = String(n).split('');
    /* грешни: разменяме нула със съседна цифра, т.е. „нулата е на друго място“ */
    const swaps = [];
    for (let i = 0; i < s.length - 1; i++) if ((s[i] === '0') !== (s[i + 1] === '0')) { const b = s.slice(); [b[i], b[i + 1]] = [b[i + 1], b[i]]; if (b[0] !== '0') swaps.push(Number(b.join(''))); }
    const c = choices(r, n, r.shuffle(swaps));
    return { uslovie: `Кое от числата е ${numberWords(n)}?`, ...c, reshenie: `Милиони: ${mil}, хиляди: ${String(th).padStart(3, '0')}, единици: ${String(un).padStart(3, '0')} → ${fmt(n)}.` };
  }
  if (v === 'cifra') {
    /* цифрата d се среща само веднъж; питаме какво показва */
    const len = r.R(6, 8);
    const pos = r.R(3, len - 1);
    const d = r.R(1, 9);
    const ds = []; for (let k = 0; k < len; k++) { let x; do { x = r.R(k === len - 1 ? 1 : 0, 9); } while (x === d); ds.push(x); }
    ds[pos] = d;
    const n = Number(ds.slice().reverse().join(''));
    const c = choices(r, placeOf(d, pos), [placeOf(d, pos - 1), pos + 1 < len ? placeOf(d, pos + 1) : placeOf(d, pos - 2), placeOf(d, pos - 2)], ident);
    return { uslovie: `Какво показва цифрата ${d} в записа на числото ${fmt(n)}?`, ...c, reshenie: `Броим отдясно: единици, десетици, стотици, хиляди… Цифрата ${d} е на мястото на ${PLACES[pos]}.` };
  }
  /* „съдържа 7 милиона и 6 десетохиляди“ */
  const a = r.R(1, 9), b = r.R(1, 9);
  let x, y; do { x = r.R(0, 9); } while (x === b); do { y = r.R(0, 9); } while (y === b);
  const tail = [r.R(0, 9), r.R(0, 9), r.R(0, 9)];
  const mk = arr => Number(arr.join(''));
  const right = [a, x, b, y, ...tail];
  const w1 = [a, b, x, y, ...tail];
  const w2 = [a, x, y, b, ...tail];
  const c = choices(r, mk(right), [mk(w1), mk(w2)]);
  return { uslovie: `Кое от числата съдържа в записа си ${a} милиона и ${b} десетохиляди?`, ...c, reshenie: `Милионите са 7-ата цифра отдясно, десетохилядите — 5-ата. Само в ${fmt(mk(right))} там стоят ${a} и ${b}.` };
}

/* ---------- 2. Сравняване, подреждане, редица ---------- */
function t02_sravnyavane(r) {
  const v = r.pick(['redica', 'naj', 'mezhdu']);
  if (v === 'redica') {
    const k = r.pick([100, 1000, 10000]);
    const down = r.R(0, 1) === 1;
    const step = down ? -k : k;
    /* редицата минава през „кръгло“ число, където децата бъркат реда */
    const a = down ? r.R(2, 6) * k * 10 + 3 * k + r.R(1, k - 1) : r.R(1, 5) * k * 10 + 7 * k + r.R(1, k - 1);
    const seq = [0, 1, 2, 3, 4].map(i => a + i * step);
    const shown = seq.map((x, i) => (i === 3 ? '_____' : fmt(x))).slice(0, down ? 5 : 4);
    const ans = seq[3];
    const c = choices(r, ans, [ans + k / 10, ans - k / 10, ans + step, ans + 10 * step].filter(Number.isInteger));
    return { uslovie: down ? `Кое е пропуснатото число в редицата? ${shown.join(', ')}` : `Кое е следващото число в редицата ${shown.join(', ')}?`, ...c, reshenie: `Всяко следващо число е с ${fmt(k)} ${down ? 'по-малко' : 'повече'}: ${fmt(seq[2])} ${down ? '–' : '+'} ${fmt(k)} = ${fmt(ans)}.` };
  }
  if (v === 'naj') {
    const big = r.R(0, 1) === 1;
    const d = [r.R(1, 9), 0, r.R(1, 9), 0, r.R(1, 9)];
    const nums = new Set();
    while (nums.size < 3) { const p = r.shuffle(d); if (p[0] !== 0) nums.add(Number(p.join(''))); }
    const arr = [...nums];
    const ans = big ? Math.max(...arr) : Math.min(...arr);
    const c = choices(r, ans, arr.filter(x => x !== ans));
    return { uslovie: `Кое от числата е най-${big ? 'голямо' : 'малко'}?`, ...c, reshenie: `Сравняваме отляво надясно, цифра по цифра. Най-${big ? 'голямо' : 'малко'} е ${fmt(ans)}.` };
  }
  const base = r.R(10, 99) * 1000 + r.R(1, 9) * 100;
  const c = choices(r, base + 1, [base, base + 10, base + 11]);
  return { uslovie: `Кое е най-малкото естествено число между числата ${fmt(base)} и ${fmt(base + 90)}?`, ...c, reshenie: `„Между“ значи без самите ${fmt(base)} и ${fmt(base + 90)}. Първото след ${fmt(base)} е ${fmt(base + 1)}.` };
}

/* ---------- 3. Липсваща цифра в събиране / сбор ---------- */
function columnHtml(rows, sign, result, hide) {
  const w = Math.max(...rows.map(x => String(x).length), String(result).length);
  const cells = (n, rowIdx) => String(n).padStart(w, ' ').split('').map((ch, i) => {
    const isHidden = hide && hide.row === rowIdx && hide.col === i - (w - String(n).length);
    return `<td>${isHidden ? '<span class="kv">□</span>' : ch === ' ' ? '' : ch}</td>`;
  }).join('');
  return `<table class="stalb"><tr><td></td>${cells(rows[0], 0)}</tr><tr><td>${sign}</td>${cells(rows[1], 1)}</tr><tr class="cherta"><td></td>${cells(result, 2)}</tr></table>`;
}
function t03_cifra(r) {
  if (r.R(0, 2) === 0) {
    const a = r.R(10000, 89999), b = r.R(1000, 19999);
    const noCarry = Number(digitsOf(a + 0).map((d, k) => (d + (digitsOf(b)[k] || 0)) % 10).reverse().join(''));
    const c = choices(r, a + b, [noCarry, a + b + 1000, a + b - 100, a + b + 10]);
    return { uslovie: `Колко е сборът на числата ${fmt(a)} и ${fmt(b)}?`, ...c, reshenie: `Събираме по разреди отдясно наляво и не забравяме числата наум: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.` };
  }
  /* скрита цифра във второто събираемо, с пренасяне около нея */
  let a, b, col;
  for (;;) {
    a = r.R(1000, 9999) * (r.R(0, 1) ? 10 : 1) + r.R(0, 9);
    b = r.R(1000, 9999);
    const bs = String(b);
    col = r.R(1, bs.length - 1);
    const k = bs.length - 1 - col;
    const lowA = a % 10 ** k, lowB = b % 10 ** k;
    if (k > 0 && lowA + lowB >= 10 ** k) break;
  }
  const bs = String(b), d = Number(bs[col]);
  const c = choices(r, String(d), [String((d + 1) % 10), String((d + 9) % 10), String((d + 2) % 10)], ident);
  return {
    uslovie: 'Коя цифра трябва да се постави в оцветеното квадратче, за да е верен сборът?',
    chertezh: columnHtml([a, b], '+', a + b, { row: 1, col }),
    ...c,
    reshenie: `Разредът със скритата цифра получава 1 наум от разреда вдясно. Затова цифрата е ${d}: ${a} + ${b} = ${a + b}.`,
  };
}

/* ---------- 4. Разлика на многоцифрени числа ---------- */
function t04_razlika(r) {
  let a, b;
  do { a = r.R(3000, 899999); b = r.R(100, Math.min(a - 100, 99999)); } while (!digitsOf(a).some((d, k) => d < (digitsOf(b)[k] || 0)));
  const da = digitsOf(a), db = digitsOf(b);
  /* типична грешка: от по-голямата цифра вади по-малката, без да заема */
  const noBorrow = Number(da.map((d, k) => Math.abs(d - (db[k] || 0))).reverse().join(''));
  const k = r.R(1, 3);
  const c = choices(r, a - b, [noBorrow, nudgeDigit(a - b, k, 1), nudgeDigit(a - b, k, -1)]);
  const q = r.pick([`Колко е разликата на числата ${fmt(a)} и ${fmt(b)}?`, `Умаляемото е ${fmt(a)}, а умалителят е ${fmt(b)}. Колко е разликата?`, `Колко ще получим, ако от ${fmt(a)} извадим ${fmt(b)}?`]);
  return { uslovie: q, ...c, reshenie: `${fmt(a)} – ${fmt(b)} = ${fmt(a - b)}. Където горната цифра е по-малка, заемаме 1 от съседния разред.` };
}

/* ---------- 5. Умножение с едноцифрено число ---------- */
function mulNoCarry(a, m) { const ds = digitsOf(a); return Number(ds.map((d, k) => (k === ds.length - 1 ? String(d * m) : String((d * m) % 10))).reverse().join('')); }
function t05_umn1(r) {
  let a, m;
  do { a = r.R(1000, 9999); if (r.R(0, 1)) a = a - (a % 100) + r.R(1, 9); m = r.R(3, 9); } while (mulNoCarry(a, m) === a * m);
  const c = choices(r, a * m, [mulNoCarry(a, m), nudgeDigit(a * m, 1, 1), nudgeDigit(a * m, 2, -1), a * m + m]);
  const q = r.pick([`Колко е произведението на числата ${fmt(a)} и ${m}?`, `Кое число е ${m} пъти по-голямо от ${fmt(a)}?`]);
  return { uslovie: q, ...c, reshenie: `${fmt(a)} · ${m} = ${fmt(a * m)}. Умножаваме всяка цифра и добавяме числото наум.` };
}

/* ---------- 6. Умножение с двуцифрено число ---------- */
function t06_umn2(r) {
  const a = r.pick([r.R(102, 989), r.R(1002, 4090)]);
  const b = r.R(12, 49);
  const b1 = Math.floor(b / 10), b0 = b % 10;
  /* грешки: забравено отместване на втория ред или отместване с два разреда */
  const noShift = a * b0 + a * b1;
  const shift2 = a * b0 + a * b1 * 100;
  const c = choices(r, a * b, [noShift, shift2, a * b + a]);
  const q = r.pick([`Колко е произведението на числата ${fmt(a)} и ${b}?`, `Множителите са ${fmt(a)} и ${b}. Колко е произведението?`]);
  return { uslovie: q, ...c, reshenie: `${fmt(a)} · ${b0} = ${fmt(a * b0)}; ${fmt(a)} · ${b1} десетици = ${fmt(a * b1 * 10)}; сбор ${fmt(a * b)}.` };
}

/* ---------- 7. Деление с едноцифрено число ---------- */
const dropInnerZero = q => { const s = String(q); const i = s.slice(1).indexOf('0'); return i >= 0 && i + 1 < s.length - 1 ? Number(s.slice(0, i + 1) + s.slice(i + 2)) : null; };
function t07_del1(r) {
  const d = r.R(3, 9);
  let q;
  do { q = r.R(1000, 9999); if (r.R(0, 1)) { const s = String(q).split(''); s[r.R(1, 2)] = '0'; q = Number(s.join('')); } } while (q * d > 99999);
  const a = q * d;
  const c = choices(r, q, [dropInnerZero(q), q * 10, nudgeDigit(q, 1, 1), nudgeDigit(q, 2, 1)]);
  const u = r.pick([`Колко е частното на числата ${fmt(a)} и ${d}?`, `Ако числото ${fmt(a)} се намали ${d} пъти, кое число ще се получи?`]);
  return { uslovie: u, ...c, reshenie: `${fmt(a)} : ${d} = ${fmt(q)}. Проверка: ${fmt(q)} · ${d} = ${fmt(a)}.` };
}

/* ---------- 8. Деление с двуцифрено число ---------- */
function t08_del2(r) {
  const d = r.R(12, 59);
  /* понякога с нула в средата на частното: там децата я изпускат */
  const q = r.R(0, 2) === 0 ? r.R(1, 9) * 100 + r.R(1, 9) : r.R(101, 999);
  const a = q * d;
  const c = choices(r, q, [dropInnerZero(q), q * 10, q + 10, q - 1, q + 1]);
  return { uslovie: `Колко е частното на числата ${fmt(a)} и ${d}?`, ...c, reshenie: `${fmt(a)} : ${d} = ${fmt(q)}. Проверка: ${fmt(q)} · ${d} = ${fmt(a)}.` };
}

/* ---------- 9. Неизвестно число ---------- */
function t09_neizvestno(r) {
  const kind = r.pick(['umal', 'umaljaemo', 'delimo', 'delitel', 'sabiraemo']);
  let eq, x, wrong, how, howWrong;
  if (kind === 'umal') { const a = r.R(2000, 9999), x0 = r.R(100, a - 100); x = x0; eq = `${fmt(a)} – □ = ${fmt(a - x)}`; wrong = [a + (a - x), a - x]; how = `${fmt(a)} – ${fmt(a - x)}`; howWrong = [`${fmt(a)} + ${fmt(a - x)}`, `${fmt(a - x)} – ${fmt(a)}`]; }
  else if (kind === 'umaljaemo') { const b = r.R(100, 999), c0 = r.R(1000, 8999); x = b + c0; eq = `□ – ${b} = ${fmt(c0)}`; wrong = [c0 - b, c0 + b + 10]; how = `${fmt(c0)} + ${b}`; howWrong = [`${fmt(c0)} – ${b}`, `${b} – ${fmt(c0)}`]; }
  else if (kind === 'delimo') { const b = r.R(3, 9), c0 = r.R(1000, 9999); x = b * c0; eq = `□ : ${b} = ${fmt(c0)}`; wrong = [c0 % b === 0 ? c0 / b : c0 + b, x + c0]; how = `${fmt(c0)} · ${b}`; howWrong = [`${fmt(c0)} : ${b}`, `${fmt(c0)} + ${b}`]; }
  else if (kind === 'delitel') { const c0 = r.R(3, 9), x0 = r.R(101, 999); x = x0; eq = `${fmt(c0 * x0)} : □ = ${c0}`; wrong = [c0 * x0 * c0, x0 * 10]; how = `${fmt(c0 * x0)} : ${c0}`; howWrong = [`${fmt(c0 * x0)} · ${c0}`, `${fmt(c0 * x0)} – ${c0}`]; }
  else { const a = r.R(100, 999), x0 = r.R(100, 999); x = x0; eq = `${a + x0} = ${a} + □`; wrong = [2 * a + x0, x0 + 10]; how = `${a + x0} – ${a}`; howWrong = [`${a + x0} + ${a}`, `${a} – ${a + x0}`]; }
  if (r.R(0, 2) === 0) {
    const c = choices(r, how, howWrong, ident);
    return { uslovie: `Как се намира неизвестното число? <span class="izraz">${eq}</span>`, ...c, reshenie: `□ = ${how} = ${fmt(x)}.` };
  }
  const c = choices(r, x, [...wrong, nudgeDigit(x, 1, 1)]);
  return { uslovie: `Кое е неизвестното число? <span class="izraz">${eq}</span>`, ...c, reshenie: `□ = ${how} = ${fmt(x)}.` };
}

/* ---------- 10. Ред на действията ---------- */
/* Стойност на израз с + – · : и скоби, само ако всяко деление е точно и всяка разлика е > 0 */
function exactValue(src) {
  const tok = src.match(/\d+|[-+–·:()]/g); let i = 0;
  const atom = () => { if (tok[i] === '(') { i++; const v = sum(); i++; return v; } return Number(tok[i++]); };
  const prod = () => { let v = atom(); while (tok[i] === '·' || tok[i] === ':') { const o = tok[i++], w = atom(); if (v === null || w === null) return null; if (o === ':' && (w === 0 || v % w)) return null; v = o === '·' ? v * w : v / w; } return v; };
  const sum = () => { let v = prod(); while (tok[i] === '+' || tok[i] === '–') { const o = tok[i++], w = prod(); if (v === null || w === null) return null; v = o === '+' ? v + w : v - w; if (v <= 0) return null; } return v; };
  const v = sum();
  return v === null || v <= 0 ? null : v;
}
const EXPR = [
  ['a + b · c', '·', '+·'], ['(a + b) · c', '+', '+·'], ['a · b + c', '·', '+·'],
  ['a – b · c', '·', '–·'], ['(a – b) · c', '–', '–·'], ['a · (b – c)', '–', '–·'],
  ['a – b : c', ':', '–:'], ['(a – b) : c', '–', '–:'], ['a : b – c', ':', '–:'],
  ['a + b : c', ':', '+:'], ['(a + b) : c', '+', '+:'], ['a : (b + c)', '+', '+:'],
  ['a – (b + c)', '+', '–+'], ['a – b + c', '–', '–+'], ['a + b – c', '+', '–+'],
  ['a · b : c', '·', '·:'], ['a : b · c', ':', '·:'], ['a · (b : c)', ':', '·:'],
];
function t10_red(r) {
  const op = r.pick(['+', '–', '·', ':']);
  /* числата се подбират така, че всяко деление е точно и няма отрицателни или нула */
  const fill = t => {
    for (let i = 0; i < 400; i++) {
      const s = t.replace('a', r.R(12, 96)).replace('b', r.R(2, 48)).replace('c', r.R(2, 9));
      if (exactValue(s) !== null) return s;
    }
    throw new Error('няма подходящи числа');
  };
  const has = EXPR.filter(e => e[2].includes(op));
  const yes = r.pick(has.filter(e => e[1] === op));
  const no = r.shuffle(has.filter(e => e[1] !== op)).slice(0, 2);
  const c = choices(r, fill(yes[0]), no.map(e => fill(e[0])), ident);
  return { uslovie: `В кой от числовите изрази първо трябва да се извърши действие ${OP[op]}?`, ...c, reshenie: 'Първо скобите; после умножение и деление; накрая събиране и изваждане. При равни действия — отляво надясно.' };
}

/* ---------- 11. Удобно пресмятане (общ множител) ---------- */
function t11_udobno(r) {
  const k = r.R(3, 49), tot = r.pick([100, 1000]), a = r.R(tot === 100 ? 11 : 101, tot === 100 ? 89 : 899), b = tot - a;
  if (r.R(0, 1)) {
    const c = choices(r, `(${a} + ${b}) · ${k}`, [`${a} · ${b} + ${k}`, `(${a} + ${k}) · ${b}`, `${a} + ${b} · ${k}`], ident);
    return { uslovie: `С кой от изразите може да се пресметне вярно ${a} · ${k} + ${b} · ${k}?`, ...c, reshenie: `Общият множител ${k} се изважда пред скоби: (${a} + ${b}) · ${k} = ${tot} · ${k} = ${fmt(tot * k)}.` };
  }
  const c = choices(r, tot * k, [a * k + b, (a + b + k), a * k + b * k + k]);
  return { uslovie: `Колко е стойността на израза <span class="izraz">${a} · ${k} + ${b} · ${k}</span>?`, ...c, reshenie: `(${a} + ${b}) · ${k} = ${tot} · ${k} = ${fmt(tot * k)}.` };
}

/* ---------- 12. Част от фигура ---------- */
function partFigure(cols, rows, shaded, rr) {
  const cells = rr.shuffle([...Array(cols * rows).keys()]).slice(0, shaded);
  return gridSvg(cols, rows, new Set(cells.map(i => `${i % cols},${Math.floor(i / cols)}`)), 18);
}
function t12_chasti(r) {
  const q = r.pick([2, 3, 4]);
  const shapes = [[2, 2], [4, 1], [3, 2], [4, 2], [3, 3], [6, 1], [4, 3]].filter(([c, ro]) => (c * ro) % q === 0);
  const [cc, cr] = r.pick(shapes);
  const right = partFigure(cc, cr, (cc * cr) / q, r);
  const wrongs = [];
  for (const [c, ro] of r.shuffle([[2, 2], [3, 1], [4, 1], [3, 2], [4, 2], [3, 3], [5, 1]])) {
    const n = c * ro;
    const opts = [1, 2, 3, 4, 5].filter(s => s < n && s * q !== n);
    if (opts.length) wrongs.push(partFigure(c, ro, r.pick(opts), r));
  }
  const c = choices(r, right, wrongs, ident);
  return { uslovie: `В коя от фигурите оцветената част е ${PART[q][0]} от нея?`, ...c, otgovoriSaChertezhi: true, reshenie: `${PART[q][0][0].toUpperCase() + PART[q][0].slice(1)} значи 1 от ${q} равни части: оцветените квадратчета са ${q} пъти по-малко от всички.` };
}

/* ---------- 13. Броене на фигури ---------- */
function t13_broene(r) {
  const v = r.pick(['tri', 'pravo', 'kvad']);
  if (v === 'tri') {
    const m = r.R(2, 4), T = (m * (m + 1)) / 2;
    let body = poly([[90, 10], [10, 110], [170, 110]], 'class="fig"');
    for (let i = 1; i < m; i++) body += line(90, 10, 10 + (160 * i) / m, 110, 'class="fig"');
    const c = choices(r, T, [m, m + 1, T + 1, T - 1].filter(x => x !== T));
    return { uslovie: 'Колко на брой са всички триъгълници на чертежа?', chertezh: svg(180, 120, body), ...c, reshenie: `Малките са ${m}, но се броят и съставените от съседни малки: ${[...Array(m).keys()].map(i => m - i).join(' + ')} = ${T}.` };
  }
  if (v === 'pravo') {
    const n = r.R(3, 5), T = (n * (n + 1)) / 2;
    let body = `<rect x="2" y="2" width="${n * 34}" height="34" class="fig"/>`;
    for (let i = 1; i < n; i++) body += line(2 + i * 34, 2, 2 + i * 34, 36, 'class="fig"');
    const c = choices(r, T, [n, n + 1, T - 1, T + 1].filter(x => x !== T));
    return { uslovie: 'Колко са правоъгълниците на чертежа?', chertezh: svg(n * 34 + 4, 40, body), ...c, reshenie: `От 1 част: ${n}, от 2 части: ${n - 1}, … от ${n} части: 1. Общо ${T}.` };
  }
  const n = r.R(2, 3), T = n === 2 ? 5 : 14;
  const g = gridSvg(n, n, new Set(), 30);
  const c = choices(r, T, n === 2 ? [4, 6, 3] : [9, 10, 13]);
  return { uslovie: 'Колко са квадратите на чертежа?', chertezh: g, ...c, reshenie: n === 2 ? 'Четири малки и един голям: 5.' : 'Малки 9, от 2×2 квадратчета 4, един голям: 14.' };
}

/* ---------- 14. Видове ъгли и триъгълници ---------- */
function triSvg(kind) {
  const P = { ostar: [[10, 80], [80, 80], [40, 14]], prav: [[14, 80], [84, 80], [14, 20]], tap: [[6, 80], [56, 80], [104, 36]] }[kind];
  let body = poly(P, 'class="fig"');
  if (kind === 'prav') body += '<polyline points="14,70 24,70 24,80" class="fig"/>';
  return svg(110, 86, body);
}
function t14_agli(r) {
  if (r.R(0, 1)) {
    const kind = r.pick(['ostar', 'prav', 'tap']);
    const name = { ostar: 'остроъгълен', prav: 'правоъгълен', tap: 'тъпоъгълен' }[kind];
    const others = ['ostar', 'prav', 'tap'].filter(k => k !== kind);
    const c = choices(r, triSvg(kind), others.map(triSvg), ident);
    return { uslovie: `Кой от триъгълниците е ${name}?`, ...c, otgovoriSaChertezhi: true, reshenie: 'Остроъгълен: всички ъгли са остри. Правоъгълен: има прав ъгъл. Тъпоъгълен: има тъп ъгъл.' };
  }
  /* часовници в точен час: ъгълът е 30° по броя на часовете до 12 */
  const kind = r.pick(['остър', 'прав', 'тъп']);
  const H = { 'остър': [1, 2, 10, 11], 'прав': [3, 9], 'тъп': [4, 5, 7, 8] };
  const right = clockSvg(r.pick(H[kind]), 0, 90);
  const wr = Object.keys(H).filter(k => k !== kind).map(k => clockSvg(r.pick(H[k]), 0, 90));
  const c = choices(r, right, wr, ident);
  return { uslovie: `Стрелките на кой от часовниците образуват ${kind} ъгъл?`, ...c, otgovoriSaChertezhi: true, reshenie: '3 ч. и 9 ч. са прав ъгъл. По-малко от 3 часа между стрелките е остър, повече (без 6 ч.) е тъп.' };
}

/* ---------- 15. Окръжност и геометрични тела ---------- */
function solidSvg(kind) {
  const d = 'class="fig"', h = 'class="fig skrita"';
  const S = {
    kub: `<rect x="10" y="30" width="45" height="45" ${d}/>${line(10, 30, 30, 15, d)}${line(55, 30, 75, 15, d)}${line(55, 75, 75, 60, d)}${line(30, 15, 75, 15, d)}${line(75, 15, 75, 60, d)}${line(30, 15, 30, 60, h)}${line(30, 60, 75, 60, h)}${line(10, 75, 30, 60, h)}`,
    kvadar: `<rect x="6" y="42" width="62" height="34" ${d}/>${line(6, 42, 24, 28, d)}${line(68, 42, 86, 28, d)}${line(68, 76, 86, 62, d)}${line(24, 28, 86, 28, d)}${line(86, 28, 86, 62, d)}${line(24, 28, 24, 62, h)}${line(24, 62, 86, 62, h)}${line(6, 76, 24, 62, h)}`,
    piramida: `${poly([[10, 78], [60, 78], [80, 62]], d)}${line(10, 78, 30, 62, h)}${line(30, 62, 80, 62, h)}${line(45, 8, 10, 78, d)}${line(45, 8, 60, 78, d)}${line(45, 8, 80, 62, d)}${line(45, 8, 30, 62, h)}`,
    cilindar: `<ellipse cx="45" cy="18" rx="28" ry="8" ${d}/>${line(17, 18, 17, 72, d)}${line(73, 18, 73, 72, d)}<path d="M17 72 A28 8 0 0 0 73 72" ${d}/><path d="M17 72 A28 8 0 0 1 73 72" ${h}/>`,
    konus: `${line(45, 8, 17, 72, d)}${line(45, 8, 73, 72, d)}<path d="M17 72 A28 8 0 0 0 73 72" ${d}/><path d="M17 72 A28 8 0 0 1 73 72" ${h}/>`,
    kalbo: `<circle cx="45" cy="44" r="32" ${d}/><path d="M13 44 A32 9 0 0 0 77 44" ${d}/><path d="M13 44 A32 9 0 0 1 77 44" ${h}/>`,
  };
  return svg(90, 84, S[kind]);
}
const SOLID = { kub: 'куб', kvadar: 'правоъгълен паралелепипед', piramida: 'пирамида', cilindar: 'цилиндър', konus: 'конус', kalbo: 'кълбо' };
function t15_okr_tela(r) {
  const v = r.pick(['tela', 'radius', 'broi']);
  if (v === 'tela') {
    const ks = r.shuffle(Object.keys(SOLID)).slice(0, 3);
    const c = choices(r, solidSvg(ks[0]), ks.slice(1).map(solidSvg), ident);
    return { uslovie: `Кое от геометричните тела е ${SOLID[ks[0]]}?`, ...c, otgovoriSaChertezhi: true, reshenie: `${SOLID[ks[0]][0].toUpperCase() + SOLID[ks[0]].slice(1)}: виж формата му на чертежа.` };
  }
  const O = [70, 62], R0 = 50;
  const at = (deg, rad = R0) => [Math.round(O[0] + rad * Math.cos(deg * Math.PI / 180)), Math.round(O[1] - rad * Math.sin(deg * Math.PI / 180))];
  const lab = (p, s, dx = 0, dy = 0) => text(p[0] + dx, p[1] + dy, s, 'class="etiket" text-anchor="middle"');
  let body = `<circle cx="${O[0]}" cy="${O[1]}" r="${R0}" class="fig"/><circle cx="${O[0]}" cy="${O[1]}" r="2.5" class="tochka"/>${lab(O, 'O', -10, 4)}`;
  if (v === 'radius') {
    const [A, B, C, D] = r.shuffle(['A', 'B', 'C', 'D', 'M', 'K']).slice(0, 4);
    const pA = at(r.R(20, 70)), pB = at(r.R(150, 170)), pC = at(r.R(220, 250)), pD = at(r.R(290, 330), 28);
    body += line(...O, ...pA, 'class="fig"') + line(...pB, ...pC, 'class="fig"') + line(...O, ...pD, 'class="fig"');
    body += lab(pA, A, 8, -4) + lab(pB, B, -9, 0) + lab(pC, C, -8, 12) + lab(pD, D, 8, 10) + `<circle cx="${pD[0]}" cy="${pD[1]}" r="2.5" class="tochka"/>`;
    const c = choices(r, `O${A}`, [`${B}${C}`, `O${D}`], ident);
    return { uslovie: 'Коя от отсечките е радиус на окръжността?', chertezh: svg(140, 124, body), ...c, reshenie: `Радиусът свързва центъра O с точка от окръжността: O${A}. Точката ${D} е вътре, а ${B}${C} не минава през центъра.` };
  }
  const k = r.R(1, 3);
  body += line(...at(180), ...at(0), 'class="fig"') + lab(at(180), 'M', -9, 4) + lab(at(0), 'P', 9, 4);
  ['A', 'B', 'C'].slice(0, k).forEach((L, i) => { const p = at(60 + i * 55); body += line(...O, ...p, 'class="fig"') + lab(p, L, 0, -6); });
  const ch1 = at(230), ch2 = at(310); body += line(...ch1, ...ch2, 'class="fig"');
  const c = choices(r, k + 2, [k, k + 1, k + 3]);
  return { uslovie: 'Колко радиуса са начертани в окръжността?', chertezh: svg(140, 124, body), ...c, reshenie: `Диаметърът MP е два радиуса (OM и OP) и още ${k} от центъра: ${k + 2}. Отсечката долу не е радиус.` };
}

/* ---------- 16. Мерни единици и време ---------- */
function t16_merki(r) {
  const v = r.pick(['kg', 'km', 'm', 't', 'kmOnly', 'vreme']);
  if (v === 'vreme') {
    const h = r.R(8, 15), m = r.R(0, 11) * 5, dur = r.pick([25, 35, 40, 45, 50, 55, 65, 70, 75, 80, 85, 95, 105]);
    const e = h * 60 + m + dur;
    const chert = `<div class="dvoika"><figure>${clockSvg(h % 12, m)}<figcaption>Начало</figcaption></figure><figure>${clockSvg(Math.floor(e / 60) % 12, e % 60)}<figcaption>Край</figcaption></figure></div>`;
    const c = choices(r, minutesText(dur), [minutesText(dur + 60), minutesText(dur + 5), minutesText(dur > 60 ? dur - 60 : dur + 10)], ident);
    const [what, end] = r.pick([['тренировка', 'а'], ['урок по пиано', ''], ['филм', '']]);
    return { uslovie: `Двата часовника показват началото и края на ${what}. Колко време е продължил${end}?`, chertezh: chert, ...c, reshenie: `От ${h}:${String(m).padStart(2, '0')} до ${Math.floor(e / 60)}:${String(e % 60).padStart(2, '0')} са ${minutesText(dur)}.` };
  }
  const U = {
    kg: () => { const a = r.R(2, 9), b = r.pick([r.R(1, 9) * 10, r.R(1, 9), r.R(101, 999)]); return [`Колко грама са ${a} кг ${b} г?`, a * 1000 + b, [a * 100 + b, Number(`${a}${b}`) === a * 1000 + b ? a * 10000 + b : Number(`${a}${b}`), a * 1000 + b * 10], `1 кг = 1000 г, затова ${a} кг ${b} г = ${a * 1000} + ${b} = ${a * 1000 + b} г.`]; },
    km: () => { const a = r.R(2, 30), b = r.pick([r.R(1, 9) * 10, r.R(1, 9) * 100 + r.R(1, 9) * 10]); return [`На колко метра са равни ${a} км ${b} м?`, a * 1000 + b, [Number(`${a}${b}`), a * 1000 + b * 10, a * 100 + b], `1 км = 1000 м, затова ${a} км ${b} м = ${fmt(a * 1000 + b)} м.`]; },
    m: () => { const a = r.R(2, 15), b = r.R(1, 9); return [`Колко сантиметра са ${a} м ${b} см?`, a * 100 + b, [Number(`${a}${b}`), a * 100 + b * 10, a * 1000 + b], `1 м = 100 см, затова ${a} м ${b} см = ${a * 100 + b} см.`]; },
    t: () => { const a = r.R(2, 9), b = r.R(11, 99); return [`На колко килограма са равни ${a} т ${b} кг?`, a * 1000 + b, [Number(`${a}${b}`), a * 1000 + b * 10, a * 100 + b], `1 т = 1000 кг, затова ${a} т ${b} кг = ${a * 1000 + b} кг.`]; },
    kmOnly: () => { const a = r.R(11, 250); return [`Колко километра са ${fmt(a * 1000)} м?`, a, [a * 10, a * 100], `1000 м = 1 км, затова ${fmt(a * 1000)} м = ${a} км.`]; },
  };
  const [q, ans, wr, sol] = U[v]();
  const c = choices(r, ans, wr);
  return { uslovie: q, ...c, reshenie: sol };
}

/* ---------- 17. Лице или обиколка в квадратна мрежа (кратък отговор) ---------- */
function t17_mreza(r) {
  const s = r.R(2, 5), unit = r.pick(['см', 'дм', 'м']);
  const cols = 8, rows = 5;
  const w = r.R(2, 5), h = r.R(2, 3), x0 = r.R(0, cols - w), y0 = r.R(0, rows - h);
  const cells = new Set();
  for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) cells.add(`${x},${y}`);
  const isL = r.R(0, 1) === 1 && w > 2;
  if (isL) cells.delete(`${x0 + w - 1},${y0}`);
  const area = cells.size * s * s;
  if (!isL && r.R(0, 1)) {
    const P = 2 * (w + h) * s;
    return { uslovie: `Страната на всяко квадратче от мрежата е ${s} ${unit}. Колко ${unit === 'м' ? 'метра' : unit === 'дм' ? 'дециметра' : 'сантиметра'} е обиколката на оцветения правоъгълник?`, chertezh: gridSvg(cols, rows, cells, 22), veren: `${P} ${unit}`, reshenie: `Страните са ${w} · ${s} = ${w * s} ${unit} и ${h} · ${s} = ${h * s} ${unit}. Обиколка: 2 · (${w * s} + ${h * s}) = ${P} ${unit}.` };
  }
  return { uslovie: `Страната на всяко квадратче от мрежата е ${s} ${unit}. Колко квадратни ${unit === 'м' ? 'метра' : unit === 'дм' ? 'дециметра' : 'сантиметра'} е лицето на оцветената фигура?`, chertezh: gridSvg(cols, rows, cells, 22), veren: `${area} кв. ${unit}`, reshenie: `Едно квадратче е ${s} · ${s} = ${s * s} кв. ${unit}. Оцветените са ${cells.size}: ${cells.size} · ${s * s} = ${area} кв. ${unit}.` };
}

/* ---------- 18. Част от сбор/произведение, особени числа ---------- */
const SPECIAL = [
  ['най-малкото четирицифрено число', 1000], ['най-голямото трицифрено число', 999], ['най-голямото трицифрено четно число', 998],
  ['най-малкото трицифрено число', 100], ['най-малкото петцифрено число', 10000], ['най-голямото четирицифрено число', 9999],
];
function t18_chast(r) {
  const v = r.pick(['proizv', 'sbor', 'osobeno']);
  if (v === 'osobeno') {
    const [name, val] = r.pick(SPECIAL);
    const a = r.R(1001, 4999), b = r.R(101, 999);
    const kind = r.R(0, 1);
    const ans = kind ? a + b - val : a + b + val;
    if (ans <= 0) return t18_chast(r);
    return { uslovie: kind ? `Колко се получава, ако от сбора на числата ${fmt(a)} и ${b} се извади ${name}?` : `Колко се получава, ако към сбора на числата ${fmt(a)} и ${b} се прибави ${name}?`, veren: fmt(ans), reshenie: `${name[0].toUpperCase() + name.slice(1)} е ${fmt(val)}. ${fmt(a)} + ${b} = ${fmt(a + b)}; ${fmt(a + b)} ${kind ? '–' : '+'} ${fmt(val)} = ${fmt(ans)}.` };
  }
  const q = r.pick([2, 3, 4]);
  let a, b, val, word;
  do {
    if (v === 'proizv') { a = r.R(101, 999); do { b = r.R(2, 9); } while (b === q); val = a * b; word = 'произведението'; }
    else { a = r.R(100, 2999); b = r.R(100, 999); val = a + b; word = 'сбора'; }
  } while (val % q);
  return { uslovie: `Колко е ${PART[q][1]} от ${word} на числата ${fmt(a)} и ${b}?`, veren: fmt(val / q), reshenie: `${v === 'proizv' ? `${fmt(a)} · ${b}` : `${fmt(a)} + ${b}`} = ${fmt(val)}; ${fmt(val)} : ${q} = ${fmt(val / q)}.` };
}

/* ---------- 19. Неизвестно число с израз вдясно ---------- */
function t19_neizv_izraz(r) {
  const kind = r.pick(['delimo', 'delitel', 'umal', 'umaljaemo']);
  if (kind === 'delimo') { const d = r.R(3, 9), p = r.R(200, 800), q = r.R(10, 99); const x = d * (p + q); return { uslovie: `Кое е неизвестното число? <span class="izraz">□ : ${d} = ${p} + ${q}</span>`, veren: fmt(x), reshenie: `Първо дясната страна: ${p} + ${q} = ${p + q}. Неизвестното делимо: ${p + q} · ${d} = ${fmt(x)}.` }; }
  if (kind === 'delitel') { const c = r.R(3, 9), x = r.R(21, 199), p = r.R(c + 10, 300); return { uslovie: `Кое е неизвестното число? <span class="izraz">${c * x} : □ = ${p} – ${p - c}</span>`, veren: fmt(x), reshenie: `${p} – ${p - c} = ${c}. Неизвестният делител: ${c * x} : ${c} = ${x}.` }; }
  if (kind === 'umal') { const a = r.R(1200, 4999), p = r.R(2, 9) * 100, q = r.R(1, 9) * 10; const x = a - (p + q); return { uslovie: `Колко е неизвестното число? <span class="izraz">${fmt(a)} – □ = ${p} + ${q}</span>`, veren: fmt(x), reshenie: `${p} + ${q} = ${p + q}. Неизвестният умалител: ${fmt(a)} – ${p + q} = ${fmt(x)}.` }; }
  const b = r.R(101, 499), p = r.R(2, 6) * 1000, q = r.R(101, 899); const x = p + q + b;
  return { uslovie: `Кое е неизвестното число? <span class="izraz">□ – ${b} = ${fmt(p)} + ${q}</span>`, veren: fmt(x), reshenie: `${fmt(p)} + ${q} = ${fmt(p + q)}. Неизвестното умаляемо: ${fmt(p + q)} + ${b} = ${fmt(x)}.` };
}

/* ---------- 20. Израз с няколко действия или време ---------- */
function t20_izraz(r) {
  const v = r.pick(['skobi', 'mnozhitel', 'mnozhitel2', 'vreme']);
  if (v === 'skobi') { const a = r.R(2, 9) * 100, b = r.R(2, 9) * 100, k = r.R(2, 3); const big = (a + b) * k + r.R(1, 40) * 100; return { uslovie: `Колко е резултатът от пресмятането на числовия израз? <span class="izraz">${fmt(big)} – (${a} + ${b}) · ${k}</span>`, veren: fmt(big - (a + b) * k), reshenie: `Скобите: ${a + b}; умножение: ${(a + b) * k}; изваждане: ${fmt(big)} – ${(a + b) * k} = ${fmt(big - (a + b) * k)}.` }; }
  if (v === 'mnozhitel') { const k = r.R(2, 12), n = r.pick([100, 200, 300, 500, 900, 111, 125, 250]); return { uslovie: `Колко е резултатът от пресмятането на числовия израз? <span class="izraz">${k + 1} · ${n} – ${n}</span>`, veren: fmt(k * n), reshenie: `${k + 1} пъти ${n} без едно ${n} са ${k} пъти ${n}: ${k} · ${n} = ${fmt(k * n)}.` }; }
  if (v === 'mnozhitel2') { const a = r.R(5, 9), b = r.R(1, a - 1), n = r.pick([111, 125, 250, 101, 1001]); return { uslovie: `Колко е резултатът от пресмятането на числовия израз? <span class="izraz">${a} · ${n} – ${n} · ${b}</span>`, veren: fmt((a - b) * n), reshenie: `(${a} – ${b}) · ${n} = ${a - b} · ${n} = ${fmt((a - b) * n)}.` }; }
  const H = r.R(9, 17), m = r.R(6, 11) * 5, e = r.R(1, 6) * 5; const dur = 60 - m + e;
  return { uslovie: `Урокът по пиано на Ема започва в посоченото на часовника време и свършва ${e} минути след ${H}:00 ч. Колко минути е продължителността на урока?`, chertezh: clockSvg((H - 1) % 12, m), veren: `${dur} минути`, reshenie: `Часовникът показва ${H - 1}:${m}. До ${H}:00 са ${60 - m} мин., после още ${e}: ${dur} минути.` };
}

/* ---------- 21. Лице и обиколка (разширен отговор) ---------- */
function t21_geo(r) {
  const v = r.pick(['polovina', 'sasta_obikolka', 'ot_lice', 'ot_kvadrati']);
  if (v === 'polovina') { const s = r.R(3, 15) * 2; const P = 4 * s; return { uslovie: `Квадрат с обиколка ${P} метра е разделен наполовина на два еднакви правоъгълника. Колко метра е обиколката на единия правоъгълник?`, veren: `${3 * s} м`, reshenie: `Страната на квадрата: ${P} : 4 = ${s} м. Правоъгълникът е ${s} м и ${s / 2} м. Обиколка: 2 · (${s} + ${s / 2}) = ${3 * s} м.` }; }
  if (v === 'sasta_obikolka') { const a = r.R(6, 25), b = r.R(Math.ceil(a / 2), 2 * a - 1); if (b === a) return t21_geo(r); return { uslovie: `Квадрат има страна ${a} см. Правоъгълник има същата обиколка като квадрата, а едната му страна е ${b} см. Колко сантиметра е другата страна на правоъгълника?`, veren: `${2 * a - b} см`, reshenie: `Обиколка на квадрата: 4 · ${a} = ${4 * a} см. Половината е ${2 * a} см = сбор от двете страни на правоъгълника. Другата страна: ${2 * a} – ${b} = ${2 * a - b} см.` }; }
  if (v === 'ot_lice') { const a = r.R(4, 20), b = r.R(3, 15) * (r.R(0, 1) ? 1 : 2); const S = a * b; return { uslovie: `Лицето на правоъгълна градина е ${S} кв. м, а едната ѝ страна е ${a} м. Колко метра ограда е нужна, за да се огради градината?`, veren: `${2 * (a + b)} м`, reshenie: `Другата страна: ${S} : ${a} = ${b} м. Обиколка: 2 · (${a} + ${b}) = ${2 * (a + b)} м.` }; }
  const s = r.R(2, 9), P = 4 * s, k = r.R(3, 6);
  const shapes = { 3: ['0,0', '1,0', '1,1'], 4: ['0,0', '1,0', '2,0', '2,1'], 5: ['0,1', '1,1', '1,0', '2,1', '3,1'], 6: ['0,0', '1,0', '2,0', '0,1', '1,1', '2,1'] };
  return { uslovie: `Фигурата е съставена от ${k} еднакви квадрата. Обиколката на всеки квадрат е ${P} дм. Колко квадратни дециметра е лицето на цялата фигура?`, chertezh: gridSvg(4, 2, new Set(shapes[k]), 28), veren: `${k * s * s} кв. дм`, reshenie: `Страната на квадрат: ${P} : 4 = ${s} дм. Лице на един: ${s} · ${s} = ${s * s} кв. дм. Всички ${k}: ${k} · ${s * s} = ${k * s * s} кв. дм.` };
}

/* ---------- 22. Пари и маса в две стъпки ---------- */
function t22_pari(r) {
  const v = r.pick(['dve', 'kutiya', 'chuvali', 'butilki', 'vnoski']);
  if (v === 'dve') {
    /* [един, много (след число), една/един от второто, много от второто] */
    const [aEd, aMn, bEd, bMn, bNum] = r.pick([['хладилник', 'хладилника', 'една печка', 'печки', FEM], ['велосипед', 'велосипеда', 'една тротинетка', 'тротинетки', FEM], ['телевизор', 'телевизора', 'един таблет', 'таблета', MASC]]);
    const pa = r.R(8, 60) * 10, pb = r.R(4, 40) * 10, n1 = r.R(2, 4), n2 = r.R(1, n1), n3 = r.R(2, 5);
    const two = n2 === 1 ? `един ${aEd}` : `${MASC[n2]} ${aMn}`;
    const first = MASC[n1][0].toUpperCase() + MASC[n1].slice(1);
    return { uslovie: `${first} ${aMn} струват ${n1 * pa} евро, а ${two} и ${bNum[n3]} ${bMn} – ${fmt(n2 * pa + n3 * pb)} евро. Колко евро струва ${bEd}?`, veren: `${pb} евро`, reshenie: `Един ${aEd}: ${n1 * pa} : ${n1} = ${pa} евро. ${n2 === 1 ? 'Той' : `${n2} ${aMn}`} — ${n2 * pa} евро. ${n3} ${bMn}: ${fmt(n2 * pa + n3 * pb)} – ${n2 * pa} = ${n3 * pb} евро. ${bEd[0].toUpperCase() + bEd.slice(1)}: ${n3 * pb} : ${n3} = ${pb} евро.` };
  }
  if (v === 'kutiya') { const n = r.pick([10, 12, 15, 20, 24]), g = r.R(8, 25), e = r.R(2, 9) * 10; return { uslovie: `Кутия с бонбони тежи ${n * g + e} г и съдържа ${n} еднакви бонбона. Празната кутия тежи ${e} г. Колко грама тежи един бонбон?`, veren: `${g} г`, reshenie: `Бонбоните: ${n * g + e} – ${e} = ${n * g} г. Един: ${n * g} : ${n} = ${g} г.` }; }
  if (v === 'chuvali') { const t = r.R(2, 9), k = r.pick([20, 25, 40, 50]); return { uslovie: `Камион превозва ${t} тона жито в чували по ${k} килограма. Колко са чувалите?`, veren: `${(t * 1000) / k} чувала`, reshenie: `${t} т = ${t * 1000} кг. ${t * 1000} : ${k} = ${(t * 1000) / k} чувала.` }; }
  if (v === 'butilki') { const a = r.R(25, 45) * 10, b = r.R(11, 30), n = r.R(12, 40); return { uslovie: `Стъклена бутилка тежи ${a} грама, а пластмасова – ${b} грама. С колко грама ${n} стъклени бутилки са по-тежки от ${n} пластмасови?`, veren: `${fmt(n * (a - b))} г`, reshenie: `${n} · ${a} = ${fmt(n * a)} г; ${n} · ${b} = ${n * b} г; разлика ${fmt(n * (a - b))} г. (Или: (${a} – ${b}) · ${n}.)` }; }
  const vn = r.pick([6, 10, 12]), x = r.R(30, 90) * 10, over = r.R(3, 15) * 10; const per = (x + over) / vn;
  if (!Number.isInteger(per)) return t22_pari(r);
  return { uslovie: `Пералня струва ${x} евро при плащане наведнъж или ${vn} вноски по ${per} евро. С колко евро се оскъпява пералнята при плащане на вноски?`, veren: `${over} евро`, reshenie: `${vn} · ${per} = ${x + over} евро; ${x + over} – ${x} = ${over} евро.` };
}

/* ---------- 23. „Общо…, от тях…, пъти повече / с повече“ ---------- */
function t23_pati(r) {
  const v = r.pick(['ostatak', 'festival', 'pati_po_malko', 'tretinka']);
  if (v === 'ostatak') { const a = r.R(10, 60) * 10, k = r.R(2, 4), c = r.R(20, 120) * 10; const N = a + k * a + c; return { uslovie: `В градски парк засадили общо ${fmt(N)} дръвчета, храсти и цветя. Дръвчетата били ${a}, а храстите – ${k} пъти повече от дръвчетата. Колко цветя са засадили?`, veren: `${fmt(c)} цветя`, reshenie: `Храсти: ${a} · ${k} = ${k * a}. Дръвчета и храсти: ${a} + ${k * a} = ${a + k * a}. Цветя: ${fmt(N)} – ${a + k * a} = ${fmt(c)}.` }; }
  if (v === 'festival') { const p = r.R(300, 900), d = r.R(100, p - 100), k = r.R(2, 3); const T = p + (p - d) + k * p; return { uslovie: `Във фестивал участват ${p} певци, които са с ${d} повече от инструменталистите, и танцьори – ${k} пъти повече от певците. Колко общо са участниците?`, veren: `${fmt(T)} участници`, reshenie: `Инструменталисти: ${p} – ${d} = ${p - d}. Танцьори: ${p} · ${k} = ${k * p}. Общо: ${p} + ${p - d} + ${k * p} = ${fmt(T)}.` }; }
  if (v === 'pati_po_malko') { const k = r.R(2, 5), u = r.R(20, 90), t = k * u, s = r.R(50, 400); const N = t + u + s; return { uslovie: `В книжарница има общо ${N} тетрадки, учебници и сборници. Тетрадките са ${t} и са ${k} пъти повече от учебниците. Колко са сборниците?`, veren: `${s} сборника`, reshenie: `Учебници: ${t} : ${k} = ${u}. Сборници: ${N} – ${t} – ${u} = ${s}.` }; }
  const N = r.R(400, 1500), b = r.R(100, N - 300); if ((N - b) % 3) return t23_pati(r);
  return { uslovie: `В Деня на Земята доброволци засадили ${fmt(N)} дръвчета. От тях ${b} са борчета. Третинката от останалите дървета са ели. Колко са елите?`, veren: `${(N - b) / 3} ели`, reshenie: `Останалите: ${fmt(N)} – ${b} = ${N - b}. Третинката: ${N - b} : 3 = ${(N - b) / 3}.` };
}

/* ---------- 24. Данни от диаграма или таблица ---------- */
function barSvg(labels, vals, unit, per) {
  const H = 150, base = 130, step = 14, w = 60 * labels.length + 40;
  let body = '';
  for (let i = 0; i <= Math.max(...vals) / per + 1; i++) body += line(30, base - i * step, w - 6, base - i * step, 'class="mrezha"');
  labels.forEach((L, i) => { const h = (vals[i] / per) * step; body += `<rect x="${44 + i * 60}" y="${base - h}" width="34" height="${h}" class="stalbche"/>` + text(61 + i * 60, base + 14, L, 'class="etiket" text-anchor="middle"'); });
  body += text(30, 12, `1 деление = ${per} ${unit}`, 'class="etiket"');
  return svg(w, H, body);
}
function t24_danni(r) {
  if (r.R(0, 1)) {
    const per = r.pick([50, 100, 200]), unit = 'кг';
    const labels = r.pick([['домати', 'краставици', 'чушки'], ['ябълки', 'круши', 'сливи'], ['картофи', 'моркови', 'тикви']]);
    const vals = labels.map(() => r.R(2, 8) * per);
    if (new Set(vals).size < 3) return t24_danni(r);
    if (r.R(0, 1)) return { uslovie: `Диаграмата показва колко килограма ${labels.join(', ').replace(/, ([^,]*)$/, ' и $1')} са продадени на борсата. Колко килограма общо са продадени?`, chertezh: barSvg(labels, vals, unit, per), veren: `${fmt(vals.reduce((a, b) => a + b))} кг`, reshenie: `Всяко деление е ${per} кг: ${vals.map((x, i) => `${labels[i]} ${x}`).join(', ')}. Общо ${fmt(vals.reduce((a, b) => a + b))} кг.` };
    const [i, j] = vals[0] > vals[1] ? [0, 1] : [1, 0];
    return { uslovie: `Диаграмата показва продажбите на борсата. С колко килограма ${labels[i]}те са повече от ${labels[j]}те?`, chertezh: barSvg(labels, vals, unit, per), veren: `${vals[i] - vals[j]} кг`, reshenie: `${labels[i]}: ${vals[i]} кг, ${labels[j]}: ${vals[j]} кг. Разлика ${vals[i] - vals[j]} кг.` };
  }
  /* таблица с покупки: от първия ред цената на тортата, после на сладоледа */
  const t = r.R(3, 9), s = r.R(2, 8), a = r.R(2, 4), g1 = r.R(1, 3), g2 = r.R(1, 3);
  const table = `<table class="tablica"><tr><th>Дете</th><th>Покупка</th><th>Сума</th></tr><tr><td>Ася</td><td>${a} парчета торта</td><td>${a * t} евро</td></tr><tr><td>Галя</td><td>${g1} ${g1 === 1 ? 'парче' : 'парчета'} торта и ${g2} ${g2 === 1 ? 'сладолед' : 'сладоледа'}</td><td>${g1 * t + g2 * s} евро</td></tr></table>`;
  return { uslovie: 'Таблицата показва покупките на две деца в сладкарница. Колко евро струва един сладолед?', chertezh: table, veren: `${s} евро`, reshenie: `Едно парче торта: ${a * t} : ${a} = ${t} евро. Тортата на Галя: ${g1} · ${t} = ${g1 * t} евро. Сладоледите: ${g1 * t + g2 * s} – ${g1 * t} = ${g2 * s}; един: ${s} евро.` };
}

/* ---------- 25. Практическа задача с три подусловия ---------- */
function t25_teren(r) {
  const v = r.pick(['leha', 'ploshtadka', 'parking']);
  if (v === 'leha') {
    const a = r.R(4, 10) * 2, b = r.R(3, a / 2 + 1), c = r.pick([5, 6, 8, 10, 12, 15]), n = r.R(2, 4), p = r.R(2, 5);
    if ((a * b) % 2) return t25_teren(r);
    const half = (a * b) / 2;
    return {
      uslovie: `Цветна леха има форма на правоъгълник с размери ${a} м и ${b} м. Половината от лехата е засадена с рози, а другата половина – с хризантеми.`,
      chertezh: svg(236, 98, `<rect x="10" y="20" width="180" height="70" class="fig"/>${line(100, 20, 100, 90, 'class="fig"')}${text(55, 60, 'рози', 'class="etiket" text-anchor="middle"')}${text(145, 60, 'хризантеми', 'class="etiket" text-anchor="middle"')}${text(100, 14, `${a} м`, 'class="etiket" text-anchor="middle"')}${text(198, 59, `${b} м`, 'class="etiket"')}`),
      podusloviya: [
        { bukva: 'А', uslovie: 'Колко квадратни метра са засадени с хризантеми?', veren: `${half} кв. м`, tochki: 5, reshenie: `${a} · ${b} = ${a * b} кв. м; половината: ${half} кв. м.` },
        { bukva: 'Б', uslovie: `Около лехата поставили ограда. Един метър ограда струва ${c} евро. Колко евро струва оградата?`, veren: `${2 * (a + b) * c} евро`, tochki: 5, reshenie: `Обиколка: 2 · (${a} + ${b}) = ${2 * (a + b)} м; ${2 * (a + b)} · ${c} = ${2 * (a + b) * c} евро.` },
        { bukva: 'В', uslovie: `На всеки квадратен метър засадили по ${n} хризантеми, а една хризантема струва ${p} евро. Колко евро струват всички хризантеми?`, veren: `${half * n * p} евро`, tochki: 6, reshenie: `${half} · ${n} = ${half * n} хризантеми; ${half * n} · ${p} = ${half * n * p} евро.` },
      ],
    };
  }
  if (v === 'ploshtadka') {
    const a = r.R(5, 12) * 3, b = r.R(4, 12), p = r.R(4, 15), w = r.R(2, 4);
    const S = a * b, fit = S / 3;
    return {
      uslovie: `Спортна площадка има форма на правоъгълник с размери ${a} м и ${b} м. Третинката от нея е предназначена за фитнес.`,
      podusloviya: [
        { bukva: 'А', uslovie: 'Колко квадратни метра е частта за фитнес?', veren: `${fit} кв. м`, tochki: 5, reshenie: `${a} · ${b} = ${S} кв. м; ${S} : 3 = ${fit} кв. м.` },
        { bukva: 'Б', uslovie: `Останалата част покрили с изкуствена трева. Един квадратен метър трева струва ${p} евро. Колко евро струва тревата?`, veren: `${fmt((S - fit) * p)} евро`, tochki: 5, reshenie: `${S} – ${fit} = ${S - fit} кв. м; ${S - fit} · ${p} = ${fmt((S - fit) * p)} евро.` },
        { bukva: 'В', uslovie: `Около площадката има ограда с вход, широк ${w} м. Колко метра е оградата?`, veren: `${2 * (a + b) - w} м`, tochki: 6, reshenie: `Обиколка: 2 · (${a} + ${b}) = ${2 * (a + b)} м; без входа: ${2 * (a + b)} – ${w} = ${2 * (a + b) - w} м.` },
      ],
    };
  }
  const q = r.pick([10, 12, 15, 20]), places = r.R(30, 150), a = r.pick([40, 48, 60, 72, 80]);
  const S = places * q * 2; if (S % a) return t25_teren(r);
  const b = S / a, w = r.R(3, 6);
  return {
    uslovie: `Паркинг има форма на правоъгълник с лице ${fmt(S)} квадратни метра. Едната му страна е ${a} м.`,
    podusloviya: [
      { bukva: 'А', uslovie: 'Колко метра е другата страна на паркинга?', veren: `${b} м`, tochki: 5, reshenie: `${fmt(S)} : ${a} = ${b} м.` },
      { bukva: 'Б', uslovie: `Половината от паркинга е за паркоместа, а едно паркомясто заема ${q} кв. м. Колко са паркоместата?`, veren: `${places} паркоместа`, tochki: 5, reshenie: `${fmt(S)} : 2 = ${fmt(S / 2)} кв. м; ${fmt(S / 2)} : ${q} = ${places}.` },
      { bukva: 'В', uslovie: `Паркингът е ограден с мрежа, като за входа и за изхода са оставени по ${w} м. Колко метра мрежа са използвани?`, veren: `${2 * (a + b) - 2 * w} м`, tochki: 6, reshenie: `Обиколка: 2 · (${a} + ${b}) = ${2 * (a + b)} м; без вход и изход: ${2 * (a + b)} – ${2 * w} = ${2 * (a + b) - 2 * w} м.` },
    ],
  };
}

/* ---------- Позициите в теста ---------- */
const SABLONI = [
  { nomer: 1, vid: 'izbiraem', tochki: 3, ime: 'Запис и четене на многоцифрено число', gen: t01_zapis },
  { nomer: 2, vid: 'izbiraem', tochki: 3, ime: 'Сравняване, подреждане, редица', gen: t02_sravnyavane },
  { nomer: 3, vid: 'izbiraem', tochki: 3, ime: 'Липсваща цифра в събиране, сбор', gen: t03_cifra },
  { nomer: 4, vid: 'izbiraem', tochki: 3, ime: 'Разлика на многоцифрени числа', gen: t04_razlika },
  { nomer: 5, vid: 'izbiraem', tochki: 3, ime: 'Умножение с едноцифрено число', gen: t05_umn1 },
  { nomer: 6, vid: 'izbiraem', tochki: 3, ime: 'Умножение с двуцифрено число', gen: t06_umn2 },
  { nomer: 7, vid: 'izbiraem', tochki: 3, ime: 'Деление с едноцифрено число', gen: t07_del1 },
  { nomer: 8, vid: 'izbiraem', tochki: 3, ime: 'Деление с двуцифрено число', gen: t08_del2 },
  { nomer: 9, vid: 'izbiraem', tochki: 3, ime: 'Неизвестно число', gen: t09_neizvestno },
  { nomer: 10, vid: 'izbiraem', tochki: 3, ime: 'Ред на действията', gen: t10_red },
  { nomer: 11, vid: 'izbiraem', tochki: 3, ime: 'Удобно пресмятане (общ множител)', gen: t11_udobno },
  { nomer: 12, vid: 'izbiraem', tochki: 3, ime: 'Част от фигура', gen: t12_chasti },
  { nomer: 13, vid: 'izbiraem', tochki: 3, ime: 'Броене на фигури', gen: t13_broene },
  { nomer: 14, vid: 'izbiraem', tochki: 3, ime: 'Видове ъгли и триъгълници', gen: t14_agli },
  { nomer: 15, vid: 'izbiraem', tochki: 3, ime: 'Окръжност и геометрични тела', gen: t15_okr_tela },
  { nomer: 16, vid: 'izbiraem', tochki: 3, ime: 'Мерни единици и време', gen: t16_merki },
  { nomer: 17, vid: 'kratak', tochki: 4, ime: 'Лице или обиколка в квадратна мрежа', gen: t17_mreza },
  { nomer: 18, vid: 'kratak', tochki: 4, ime: 'Част от сбор или произведение', gen: t18_chast },
  { nomer: 19, vid: 'kratak', tochki: 4, ime: 'Неизвестно число с израз', gen: t19_neizv_izraz },
  { nomer: 20, vid: 'kratak', tochki: 4, ime: 'Израз с няколко действия, време', gen: t20_izraz },
  { nomer: 21, vid: 'razshiren', tochki: 5, ime: 'Лице и обиколка', gen: t21_geo },
  { nomer: 22, vid: 'razshiren', tochki: 5, ime: 'Пари и маса в две стъпки', gen: t22_pari },
  { nomer: 23, vid: 'razshiren', tochki: 5, ime: '„Пъти повече“ и „с повече“', gen: t23_pati },
  { nomer: 24, vid: 'razshiren', tochki: 5, ime: 'Данни от диаграма или таблица', gen: t24_danni },
  { nomer: 25, vid: 'podusloviya', tochki: 16, ime: 'Практическа задача с три подусловия', gen: t25_teren },
];

/* Една задача. Ако генераторът не успее да намери 3 различни отговора, опитва пак. */
function makeTask(nomer, seed) {
  const s = SABLONI[nomer - 1];
  for (let i = 0; i < 50; i++) {
    const r = makeRng(seed * 1000 + nomer * 31 + i * 7919);
    try { return { ...s, gen: undefined, chertezh: '', ...s.gen(r) }; } catch (e) { if (i === 49) throw e; }
  }
}

/* Пробен тест: 25 задачи от едно число (seed) */
const makeTest = seed => SABLONI.map(s => makeTask(s.nomer, seed));
