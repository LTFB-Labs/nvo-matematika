/* The 25 templates of the 4th grade NVO maths test, one per position
   in the test (see ../research/task-types.md). Each template is a function
   rng → task: { text, drawing, options, answer, solution } for
   multiple choice and { text, drawing, answer, solution } for free answers.
   Wrong options are typical mistakes, not random numbers.
   Money is in euro: Bulgaria has been in the eurozone since 2026. */

const PLACES = ['единици', 'десетици', 'стотици', 'хиляди', 'десетохиляди', 'стохиляди', 'милиони', 'десетомилиони'];
/* after a number: „1 стохиляда“, „3 стохиляди“, „3 милиона“ */
const PLACE_ONE = ['единица', 'десетица', 'стотица', 'хиляда', 'десетохиляда', 'стохиляда', 'милион', 'десетомилион'];
const PLACE_MANY = ['единици', 'десетици', 'стотици', 'хиляди', 'десетохиляди', 'стохиляди', 'милиона', 'десетомилиона'];
const placeOf = (d, k) => `${d} ${(d === 1 ? PLACE_ONE : PLACE_MANY)[k]}`;
const MASC = ['', 'един', 'два', 'три', 'четири', 'пет', 'шест'];
const FEM = ['', 'една', 'две', 'три', 'четири', 'пет', 'шест'];
const PART = { 2: ['половинка', 'половинката', 'половината'], 3: ['третинка', 'третинката', 'третинката'], 4: ['четвъртинка', 'четвъртинката', 'четвъртинката'] };
const OP = { '+': 'събиране', '–': 'изваждане', '·': 'умножение', ':': 'деление' };
const minutesText = t => { const h = Math.floor(t / 60), m = t % 60; return h && m ? `${h} ч. и ${m} мин.` : h ? `${h} ч.` : `${m} мин.`; };
const ident = x => x;

/* ---------- 1. Writing and reading a multi-digit number ---------- */
function t01_writeNumber(r) {
  const v = r.pick(['words', 'digit', 'contains']);
  if (v === 'words') {
    /* a number with zeros where children make mistakes */
    const mil = r.pick([r.R(1, 9), r.R(10, 99)]);
    const th = r.pick([r.R(1, 9) * 10, r.R(1, 9) * 100 + r.R(1, 9) * 10, r.R(10, 99), r.R(1, 9)]);
    const un = r.pick([r.R(1, 9), r.R(1, 9) * 10, r.R(1, 9) * 100 + r.R(1, 9)]);
    const n = mil * 1e6 + th * 1000 + un;
    const s = String(n).split('');
    /* wrong options: swap a zero with a neighbouring digit, i.e. "the zero is in another place" */
    const swaps = [];
    for (let i = 0; i < s.length - 1; i++) if ((s[i] === '0') !== (s[i + 1] === '0')) { const b = s.slice(); [b[i], b[i + 1]] = [b[i + 1], b[i]]; if (b[0] !== '0') swaps.push(Number(b.join(''))); }
    const c = choices(r, n, r.shuffle(swaps));
    return { text: `Кое от числата е ${numberWords(n)}?`, ...c, solution: `Милиони: ${mil}, хиляди: ${String(th).padStart(3, '0')}, единици: ${String(un).padStart(3, '0')} → ${fmt(n)}.` };
  }
  if (v === 'digit') {
    /* digit d occurs only once; we ask what it stands for */
    const len = r.R(6, 8);
    const pos = r.R(3, len - 1);
    const d = r.R(1, 9);
    const ds = []; for (let k = 0; k < len; k++) { let x; do { x = r.R(k === len - 1 ? 1 : 0, 9); } while (x === d); ds.push(x); }
    ds[pos] = d;
    const n = Number(ds.slice().reverse().join(''));
    const c = choices(r, placeOf(d, pos), [placeOf(d, pos - 1), pos + 1 < len ? placeOf(d, pos + 1) : placeOf(d, pos - 2), placeOf(d, pos - 2)], ident);
    return { text: `Какво показва цифрата ${d} в записа на числото ${fmt(n)}?`, ...c, solution: `Броим отдясно: единици, десетици, стотици, хиляди… Цифрата ${d} е на мястото на ${PLACES[pos]}.` };
  }
  /* "contains 7 millions and 6 ten-thousands" */
  const a = r.R(1, 9), b = r.R(1, 9);
  let x, y; do { x = r.R(0, 9); } while (x === b); do { y = r.R(0, 9); } while (y === b);
  const tail = [r.R(0, 9), r.R(0, 9), r.R(0, 9)];
  const mk = arr => Number(arr.join(''));
  const right = [a, x, b, y, ...tail];
  const w1 = [a, b, x, y, ...tail];
  const w2 = [a, x, y, b, ...tail];
  const c = choices(r, mk(right), [mk(w1), mk(w2)]);
  return { text: `Кое от числата съдържа в записа си ${a} милиона и ${b} десетохиляди?`, ...c, solution: `Милионите са 7-ата цифра отдясно, десетохилядите — 5-ата. Само в ${fmt(mk(right))} там стоят ${a} и ${b}.` };
}

/* ---------- 2. Comparing, ordering, sequences ---------- */
function t02_compare(r) {
  const v = r.pick(['sequence', 'extreme', 'between']);
  if (v === 'sequence') {
    const k = r.pick([100, 1000, 10000]);
    const down = r.R(0, 1) === 1;
    const step = down ? -k : k;
    /* the sequence passes a "round" number, where children get the order wrong */
    const a = down ? r.R(2, 6) * k * 10 + 3 * k + r.R(1, k - 1) : r.R(1, 5) * k * 10 + 7 * k + r.R(1, k - 1);
    const seq = [0, 1, 2, 3, 4].map(i => a + i * step);
    const shown = seq.map((x, i) => (i === 3 ? '_____' : fmt(x))).slice(0, down ? 5 : 4);
    const ans = seq[3];
    const c = choices(r, ans, [ans + k / 10, ans - k / 10, ans + step, ans + 10 * step].filter(Number.isInteger));
    return { text: down ? `Кое е пропуснатото число в редицата? ${shown.join(', ')}` : `Кое е следващото число в редицата ${shown.join(', ')}?`, ...c, solution: `Всяко следващо число е с ${fmt(k)} ${down ? 'по-малко' : 'повече'}: ${fmt(seq[2])} ${down ? '–' : '+'} ${fmt(k)} = ${fmt(ans)}.` };
  }
  if (v === 'extreme') {
    const big = r.R(0, 1) === 1;
    const d = [r.R(1, 9), 0, r.R(1, 9), 0, r.R(1, 9)];
    const nums = new Set();
    while (nums.size < 3) { const p = r.shuffle(d); if (p[0] !== 0) nums.add(Number(p.join(''))); }
    const arr = [...nums];
    const ans = big ? Math.max(...arr) : Math.min(...arr);
    const c = choices(r, ans, arr.filter(x => x !== ans));
    return { text: `Кое от числата е най-${big ? 'голямо' : 'малко'}?`, ...c, solution: `Сравняваме отляво надясно, цифра по цифра. Най-${big ? 'голямо' : 'малко'} е ${fmt(ans)}.` };
  }
  const base = r.R(10, 99) * 1000 + r.R(1, 9) * 100;
  const c = choices(r, base + 1, [base, base + 10, base + 11]);
  return { text: `Кое е най-малкото естествено число между числата ${fmt(base)} и ${fmt(base + 90)}?`, ...c, solution: `„Между“ значи без самите ${fmt(base)} и ${fmt(base + 90)}. Първото след ${fmt(base)} е ${fmt(base + 1)}.` };
}

/* ---------- 3. Missing digit in an addition / sum ---------- */
function columnHtml(rows, sign, result, hide) {
  const w = Math.max(...rows.map(x => String(x).length), String(result).length);
  const cells = (n, rowIdx) => String(n).padStart(w, ' ').split('').map((ch, i) => {
    const isHidden = hide && hide.row === rowIdx && hide.col === i - (w - String(n).length);
    return `<td>${isHidden ? '<span class="hidden-digit">□</span>' : ch === ' ' ? '' : ch}</td>`;
  }).join('');
  return `<table class="column-sum"><tr><td></td>${cells(rows[0], 0)}</tr><tr><td>${sign}</td>${cells(rows[1], 1)}</tr><tr class="sum-line"><td></td>${cells(result, 2)}</tr></table>`;
}
function t03_missingDigit(r) {
  if (r.R(0, 2) === 0) {
    const a = r.R(10000, 89999), b = r.R(1000, 19999);
    const noCarry = Number(digitsOf(a + 0).map((d, k) => (d + (digitsOf(b)[k] || 0)) % 10).reverse().join(''));
    const c = choices(r, a + b, [noCarry, a + b + 1000, a + b - 100, a + b + 10]);
    return { text: `Колко е сборът на числата ${fmt(a)} и ${fmt(b)}?`, ...c, solution: `Събираме по разреди отдясно наляво и не забравяме числата наум: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.` };
  }
  /* hidden digit in the second addend, with a carry next to it */
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
    text: 'Коя цифра трябва да се постави в оцветеното квадратче, за да е верен сборът?',
    drawing: columnHtml([a, b], '+', a + b, { row: 1, col }),
    ...c,
    solution: `Разредът със скритата цифра получава 1 наум от разреда вдясно. Затова цифрата е ${d}: ${a} + ${b} = ${a + b}.`,
  };
}

/* ---------- 4. Difference of multi-digit numbers ---------- */
function t04_difference(r) {
  let a, b;
  do { a = r.R(3000, 899999); b = r.R(100, Math.min(a - 100, 99999)); } while (!digitsOf(a).some((d, k) => d < (digitsOf(b)[k] || 0)));
  const da = digitsOf(a), db = digitsOf(b);
  /* typical mistake: subtract the smaller digit from the larger one instead of borrowing */
  const noBorrow = Number(da.map((d, k) => Math.abs(d - (db[k] || 0))).reverse().join(''));
  const k = r.R(1, 3);
  const c = choices(r, a - b, [noBorrow, nudgeDigit(a - b, k, 1), nudgeDigit(a - b, k, -1)]);
  const q = r.pick([`Колко е разликата на числата ${fmt(a)} и ${fmt(b)}?`, `Умаляемото е ${fmt(a)}, а умалителят е ${fmt(b)}. Колко е разликата?`, `Колко ще получим, ако от ${fmt(a)} извадим ${fmt(b)}?`]);
  return { text: q, ...c, solution: `${fmt(a)} – ${fmt(b)} = ${fmt(a - b)}. Където горната цифра е по-малка, заемаме 1 от съседния разред.` };
}

/* ---------- 5. Multiplying by a one-digit number ---------- */
function mulNoCarry(a, m) { const ds = digitsOf(a); return Number(ds.map((d, k) => (k === ds.length - 1 ? String(d * m) : String((d * m) % 10))).reverse().join('')); }
function t05_multiply1(r) {
  let a, m;
  do { a = r.R(1000, 9999); if (r.R(0, 1)) a = a - (a % 100) + r.R(1, 9); m = r.R(3, 9); } while (mulNoCarry(a, m) === a * m);
  const c = choices(r, a * m, [mulNoCarry(a, m), nudgeDigit(a * m, 1, 1), nudgeDigit(a * m, 2, -1), a * m + m]);
  const q = r.pick([`Колко е произведението на числата ${fmt(a)} и ${m}?`, `Кое число е ${m} пъти по-голямо от ${fmt(a)}?`]);
  return { text: q, ...c, solution: `${fmt(a)} · ${m} = ${fmt(a * m)}. Умножаваме всяка цифра и добавяме числото наум.` };
}

/* ---------- 6. Multiplying by a two-digit number ---------- */
function t06_multiply2(r) {
  const a = r.pick([r.R(102, 989), r.R(1002, 4090)]);
  const b = r.R(12, 49);
  const b1 = Math.floor(b / 10), b0 = b % 10;
  /* mistakes: forgetting to shift the second row, or shifting it by two places */
  const noShift = a * b0 + a * b1;
  const shift2 = a * b0 + a * b1 * 100;
  const c = choices(r, a * b, [noShift, shift2, a * b + a]);
  const q = r.pick([`Колко е произведението на числата ${fmt(a)} и ${b}?`, `Множителите са ${fmt(a)} и ${b}. Колко е произведението?`]);
  return { text: q, ...c, solution: `${fmt(a)} · ${b0} = ${fmt(a * b0)}; ${fmt(a)} · ${b1} десетици = ${fmt(a * b1 * 10)}; сбор ${fmt(a * b)}.` };
}

/* ---------- 7. Dividing by a one-digit number ---------- */
const dropInnerZero = q => { const s = String(q); const i = s.slice(1).indexOf('0'); return i >= 0 && i + 1 < s.length - 1 ? Number(s.slice(0, i + 1) + s.slice(i + 2)) : null; };
function t07_divide1(r) {
  const d = r.R(3, 9);
  let q;
  do { q = r.R(1000, 9999); if (r.R(0, 1)) { const s = String(q).split(''); s[r.R(1, 2)] = '0'; q = Number(s.join('')); } } while (q * d > 99999);
  const a = q * d;
  const c = choices(r, q, [dropInnerZero(q), q * 10, nudgeDigit(q, 1, 1), nudgeDigit(q, 2, 1)]);
  const u = r.pick([`Колко е частното на числата ${fmt(a)} и ${d}?`, `Ако числото ${fmt(a)} се намали ${d} пъти, кое число ще се получи?`]);
  return { text: u, ...c, solution: `${fmt(a)} : ${d} = ${fmt(q)}. Проверка: ${fmt(q)} · ${d} = ${fmt(a)}.` };
}

/* ---------- 8. Dividing by a two-digit number ---------- */
function t08_divide2(r) {
  const d = r.R(12, 59);
  /* sometimes with a zero in the middle of the quotient: children drop it */
  const q = r.R(0, 2) === 0 ? r.R(1, 9) * 100 + r.R(1, 9) : r.R(101, 999);
  const a = q * d;
  const c = choices(r, q, [dropInnerZero(q), q * 10, q + 10, q - 1, q + 1]);
  return { text: `Колко е частното на числата ${fmt(a)} и ${d}?`, ...c, solution: `${fmt(a)} : ${d} = ${fmt(q)}. Проверка: ${fmt(q)} · ${d} = ${fmt(a)}.` };
}

/* ---------- 9. Unknown number ---------- */
function t09_unknown(r) {
  const kind = r.pick(['subtrahend', 'minuend', 'dividend', 'divisor', 'addend']);
  let eq, x, wrong, how, howWrong;
  if (kind === 'subtrahend') { const a = r.R(2000, 9999), x0 = r.R(100, a - 100); x = x0; eq = `${fmt(a)} – □ = ${fmt(a - x)}`; wrong = [a + (a - x), a - x]; how = `${fmt(a)} – ${fmt(a - x)}`; howWrong = [`${fmt(a)} + ${fmt(a - x)}`, `${fmt(a - x)} – ${fmt(a)}`]; }
  else if (kind === 'minuend') { const b = r.R(100, 999), c0 = r.R(1000, 8999); x = b + c0; eq = `□ – ${b} = ${fmt(c0)}`; wrong = [c0 - b, c0 + b + 10]; how = `${fmt(c0)} + ${b}`; howWrong = [`${fmt(c0)} – ${b}`, `${b} – ${fmt(c0)}`]; }
  else if (kind === 'dividend') { const b = r.R(3, 9), c0 = r.R(1000, 9999); x = b * c0; eq = `□ : ${b} = ${fmt(c0)}`; wrong = [c0 % b === 0 ? c0 / b : c0 + b, x + c0]; how = `${fmt(c0)} · ${b}`; howWrong = [`${fmt(c0)} : ${b}`, `${fmt(c0)} + ${b}`]; }
  else if (kind === 'divisor') { const c0 = r.R(3, 9), x0 = r.R(101, 999); x = x0; eq = `${fmt(c0 * x0)} : □ = ${c0}`; wrong = [c0 * x0 * c0, x0 * 10]; how = `${fmt(c0 * x0)} : ${c0}`; howWrong = [`${fmt(c0 * x0)} · ${c0}`, `${fmt(c0 * x0)} – ${c0}`]; }
  else { const a = r.R(100, 999), x0 = r.R(100, 999); x = x0; eq = `${a + x0} = ${a} + □`; wrong = [2 * a + x0, x0 + 10]; how = `${a + x0} – ${a}`; howWrong = [`${a + x0} + ${a}`, `${a} – ${a + x0}`]; }
  if (r.R(0, 2) === 0) {
    const c = choices(r, how, howWrong, ident);
    return { text: `Как се намира неизвестното число? <span class="expr">${eq}</span>`, ...c, solution: `□ = ${how} = ${fmt(x)}.` };
  }
  const c = choices(r, x, [...wrong, nudgeDigit(x, 1, 1)]);
  return { text: `Кое е неизвестното число? <span class="expr">${eq}</span>`, ...c, solution: `□ = ${how} = ${fmt(x)}.` };
}

/* ---------- 10. Order of operations ---------- */
/* Value of an expression with + – · : and brackets, only if every division is exact and every difference is > 0 */
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
function t10_order(r) {
  const op = r.pick(['+', '–', '·', ':']);
  /* numbers are picked so that every division is exact and nothing is negative or zero */
  const fill = t => {
    for (let i = 0; i < 400; i++) {
      const s = t.replace('a', r.R(12, 96)).replace('b', r.R(2, 48)).replace('c', r.R(2, 9));
      if (exactValue(s) !== null) return s;
    }
    throw new Error('no suitable numbers');
  };
  const has = EXPR.filter(e => e[2].includes(op));
  const yes = r.pick(has.filter(e => e[1] === op));
  const no = r.shuffle(has.filter(e => e[1] !== op)).slice(0, 2);
  const c = choices(r, fill(yes[0]), no.map(e => fill(e[0])), ident);
  return { text: `В кой от числовите изрази първо трябва да се извърши действие ${OP[op]}?`, ...c, solution: 'Първо скобите; после умножение и деление; накрая събиране и изваждане. При равни действия — отляво надясно.' };
}

/* ---------- 11. Convenient calculation (common factor) ---------- */
function t11_convenient(r) {
  const k = r.R(3, 49), tot = r.pick([100, 1000]), a = r.R(tot === 100 ? 11 : 101, tot === 100 ? 89 : 899), b = tot - a;
  if (r.R(0, 1)) {
    const c = choices(r, `(${a} + ${b}) · ${k}`, [`${a} · ${b} + ${k}`, `(${a} + ${k}) · ${b}`, `${a} + ${b} · ${k}`], ident);
    return { text: `С кой от изразите може да се пресметне вярно ${a} · ${k} + ${b} · ${k}?`, ...c, solution: `Общият множител ${k} се изважда пред скоби: (${a} + ${b}) · ${k} = ${tot} · ${k} = ${fmt(tot * k)}.` };
  }
  const c = choices(r, tot * k, [a * k + b, (a + b + k), a * k + b * k + k]);
  return { text: `Колко е стойността на израза <span class="expr">${a} · ${k} + ${b} · ${k}</span>?`, ...c, solution: `(${a} + ${b}) · ${k} = ${tot} · ${k} = ${fmt(tot * k)}.` };
}

/* ---------- 12. Part of a figure ---------- */
function partFigure(cols, rows, shaded, rr) {
  const cells = rr.shuffle([...Array(cols * rows).keys()]).slice(0, shaded);
  return gridSvg(cols, rows, new Set(cells.map(i => `${i % cols},${Math.floor(i / cols)}`)), 18);
}
function t12_fraction(r) {
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
  return { text: `В коя от фигурите оцветената част е ${PART[q][0]} от нея?`, ...c, optionsAreDrawings: true, solution: `${PART[q][0][0].toUpperCase() + PART[q][0].slice(1)} значи 1 от ${q} равни части: оцветените квадратчета са ${q} пъти по-малко от всички.` };
}

/* ---------- 13. Counting figures ---------- */
function t13_counting(r) {
  const v = r.pick(['triangles', 'rectangles', 'squares']);
  if (v === 'triangles') {
    const m = r.R(2, 4), T = (m * (m + 1)) / 2;
    let body = poly([[90, 10], [10, 110], [170, 110]], 'class="fig"');
    for (let i = 1; i < m; i++) body += line(90, 10, 10 + (160 * i) / m, 110, 'class="fig"');
    const c = choices(r, T, [m, m + 1, T + 1, T - 1].filter(x => x !== T));
    return { text: 'Колко на брой са всички триъгълници на чертежа?', drawing: svg(180, 120, body), ...c, solution: `Малките са ${m}, но се броят и съставените от съседни малки: ${[...Array(m).keys()].map(i => m - i).join(' + ')} = ${T}.` };
  }
  if (v === 'rectangles') {
    const n = r.R(3, 5), T = (n * (n + 1)) / 2;
    let body = `<rect x="2" y="2" width="${n * 34}" height="34" class="fig"/>`;
    for (let i = 1; i < n; i++) body += line(2 + i * 34, 2, 2 + i * 34, 36, 'class="fig"');
    const c = choices(r, T, [n, n + 1, T - 1, T + 1].filter(x => x !== T));
    return { text: 'Колко са правоъгълниците на чертежа?', drawing: svg(n * 34 + 4, 40, body), ...c, solution: `От 1 част: ${n}, от 2 части: ${n - 1}, … от ${n} части: 1. Общо ${T}.` };
  }
  const n = r.R(2, 3), T = n === 2 ? 5 : 14;
  const g = gridSvg(n, n, new Set(), 30);
  const c = choices(r, T, n === 2 ? [4, 6, 3] : [9, 10, 13]);
  return { text: 'Колко са квадратите на чертежа?', drawing: g, ...c, solution: n === 2 ? 'Четири малки и един голям: 5.' : 'Малки 9, от 2×2 квадратчета 4, един голям: 14.' };
}

/* ---------- 14. Kinds of angles and triangles ---------- */
function triSvg(kind) {
  const P = { acute: [[10, 80], [80, 80], [40, 14]], right: [[14, 80], [84, 80], [14, 20]], obtuse: [[6, 80], [56, 80], [104, 36]] }[kind];
  let body = poly(P, 'class="fig"');
  if (kind === 'right') body += '<polyline points="14,70 24,70 24,80" class="fig"/>';
  return svg(110, 86, body);
}
function t14_angles(r) {
  if (r.R(0, 1)) {
    const kind = r.pick(['acute', 'right', 'obtuse']);
    const name = { acute: 'остроъгълен', right: 'правоъгълен', obtuse: 'тъпоъгълен' }[kind];
    const others = ['acute', 'right', 'obtuse'].filter(k => k !== kind);
    const c = choices(r, triSvg(kind), others.map(triSvg), ident);
    return { text: `Кой от триъгълниците е ${name}?`, ...c, optionsAreDrawings: true, solution: 'Остроъгълен: всички ъгли са остри. Правоъгълен: има прав ъгъл. Тъпоъгълен: има тъп ъгъл.' };
  }
  /* clocks on the hour: the angle is 30° times the number of hours to 12 */
  const kind = r.pick(['остър', 'прав', 'тъп']);
  const H = { 'остър': [1, 2, 10, 11], 'прав': [3, 9], 'тъп': [4, 5, 7, 8] };
  const right = clockSvg(r.pick(H[kind]), 0, 90);
  const wr = Object.keys(H).filter(k => k !== kind).map(k => clockSvg(r.pick(H[k]), 0, 90));
  const c = choices(r, right, wr, ident);
  return { text: `Стрелките на кой от часовниците образуват ${kind} ъгъл?`, ...c, optionsAreDrawings: true, solution: '3 ч. и 9 ч. са прав ъгъл. По-малко от 3 часа между стрелките е остър, повече (без 6 ч.) е тъп.' };
}

/* ---------- 15. Circle and solids ---------- */
function solidSvg(kind) {
  const d = 'class="fig"', h = 'class="fig hidden-edge"';
  const S = {
    cube: `<rect x="10" y="30" width="45" height="45" ${d}/>${line(10, 30, 30, 15, d)}${line(55, 30, 75, 15, d)}${line(55, 75, 75, 60, d)}${line(30, 15, 75, 15, d)}${line(75, 15, 75, 60, d)}${line(30, 15, 30, 60, h)}${line(30, 60, 75, 60, h)}${line(10, 75, 30, 60, h)}`,
    cuboid: `<rect x="6" y="42" width="62" height="34" ${d}/>${line(6, 42, 24, 28, d)}${line(68, 42, 86, 28, d)}${line(68, 76, 86, 62, d)}${line(24, 28, 86, 28, d)}${line(86, 28, 86, 62, d)}${line(24, 28, 24, 62, h)}${line(24, 62, 86, 62, h)}${line(6, 76, 24, 62, h)}`,
    pyramid: `${poly([[10, 78], [60, 78], [80, 62]], d)}${line(10, 78, 30, 62, h)}${line(30, 62, 80, 62, h)}${line(45, 8, 10, 78, d)}${line(45, 8, 60, 78, d)}${line(45, 8, 80, 62, d)}${line(45, 8, 30, 62, h)}`,
    cylinder: `<ellipse cx="45" cy="18" rx="28" ry="8" ${d}/>${line(17, 18, 17, 72, d)}${line(73, 18, 73, 72, d)}<path d="M17 72 A28 8 0 0 0 73 72" ${d}/><path d="M17 72 A28 8 0 0 1 73 72" ${h}/>`,
    cone: `${line(45, 8, 17, 72, d)}${line(45, 8, 73, 72, d)}<path d="M17 72 A28 8 0 0 0 73 72" ${d}/><path d="M17 72 A28 8 0 0 1 73 72" ${h}/>`,
    sphere: `<circle cx="45" cy="44" r="32" ${d}/><path d="M13 44 A32 9 0 0 0 77 44" ${d}/><path d="M13 44 A32 9 0 0 1 77 44" ${h}/>`,
  };
  return svg(90, 84, S[kind]);
}
const SOLID = { cube: 'куб', cuboid: 'правоъгълен паралелепипед', pyramid: 'пирамида', cylinder: 'цилиндър', cone: 'конус', sphere: 'кълбо' };
function t15_circleSolids(r) {
  const v = r.pick(['solids', 'radius', 'count']);
  if (v === 'solids') {
    const ks = r.shuffle(Object.keys(SOLID)).slice(0, 3);
    const c = choices(r, solidSvg(ks[0]), ks.slice(1).map(solidSvg), ident);
    return { text: `Кое от геометричните тела е ${SOLID[ks[0]]}?`, ...c, optionsAreDrawings: true, solution: `${SOLID[ks[0]][0].toUpperCase() + SOLID[ks[0]].slice(1)}: виж формата му на чертежа.` };
  }
  const O = [70, 62], R0 = 50;
  const at = (deg, rad = R0) => [Math.round(O[0] + rad * Math.cos(deg * Math.PI / 180)), Math.round(O[1] - rad * Math.sin(deg * Math.PI / 180))];
  const lab = (p, s, dx = 0, dy = 0) => text(p[0] + dx, p[1] + dy, s, 'class="label" text-anchor="middle"');
  let body = `<circle cx="${O[0]}" cy="${O[1]}" r="${R0}" class="fig"/><circle cx="${O[0]}" cy="${O[1]}" r="2.5" class="dot"/>${lab(O, 'O', -10, 4)}`;
  if (v === 'radius') {
    const [A, B, C, D] = r.shuffle(['A', 'B', 'C', 'D', 'M', 'K']).slice(0, 4);
    const pA = at(r.R(20, 70)), pB = at(r.R(150, 170)), pC = at(r.R(220, 250)), pD = at(r.R(290, 330), 28);
    body += line(...O, ...pA, 'class="fig"') + line(...pB, ...pC, 'class="fig"') + line(...O, ...pD, 'class="fig"');
    body += lab(pA, A, 8, -4) + lab(pB, B, -9, 0) + lab(pC, C, -8, 12) + lab(pD, D, 8, 10) + `<circle cx="${pD[0]}" cy="${pD[1]}" r="2.5" class="dot"/>`;
    const c = choices(r, `O${A}`, [`${B}${C}`, `O${D}`], ident);
    return { text: 'Коя от отсечките е радиус на окръжността?', drawing: svg(140, 124, body), ...c, solution: `Радиусът свързва центъра O с точка от окръжността: O${A}. Точката ${D} е вътре, а ${B}${C} не минава през центъра.` };
  }
  const k = r.R(1, 3);
  body += line(...at(180), ...at(0), 'class="fig"') + lab(at(180), 'M', -9, 4) + lab(at(0), 'P', 9, 4);
  ['A', 'B', 'C'].slice(0, k).forEach((L, i) => { const p = at(60 + i * 55); body += line(...O, ...p, 'class="fig"') + lab(p, L, 0, -6); });
  const ch1 = at(230), ch2 = at(310); body += line(...ch1, ...ch2, 'class="fig"');
  const c = choices(r, k + 2, [k, k + 1, k + 3]);
  return { text: 'Колко радиуса са начертани в окръжността?', drawing: svg(140, 124, body), ...c, solution: `Диаметърът MP е два радиуса (OM и OP) и още ${k} от центъра: ${k + 2}. Отсечката долу не е радиус.` };
}

/* ---------- 16. Units of measurement and time ---------- */
function t16_units(r) {
  const v = r.pick(['kg', 'km', 'm', 't', 'kmOnly', 'time']);
  if (v === 'time') {
    const h = r.R(8, 15), m = r.R(0, 11) * 5, dur = r.pick([25, 35, 40, 45, 50, 55, 65, 70, 75, 80, 85, 95, 105]);
    const e = h * 60 + m + dur;
    const clocks = `<div class="clock-pair"><figure>${clockSvg(h % 12, m)}<figcaption>Начало</figcaption></figure><figure>${clockSvg(Math.floor(e / 60) % 12, e % 60)}<figcaption>Край</figcaption></figure></div>`;
    const c = choices(r, minutesText(dur), [minutesText(dur + 60), minutesText(dur + 5), minutesText(dur > 60 ? dur - 60 : dur + 10)], ident);
    const [what, end] = r.pick([['тренировка', 'а'], ['урок по пиано', ''], ['филм', '']]);
    return { text: `Двата часовника показват началото и края на ${what}. Колко време е продължил${end}?`, drawing: clocks, ...c, solution: `От ${h}:${String(m).padStart(2, '0')} до ${Math.floor(e / 60)}:${String(e % 60).padStart(2, '0')} са ${minutesText(dur)}.` };
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
  return { text: q, ...c, solution: sol };
}

/* ---------- 17. Area or perimeter on a square grid (short answer) ---------- */
function t17_grid(r) {
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
    return { text: `Страната на всяко квадратче от мрежата е ${s} ${unit}. Колко ${unit === 'м' ? 'метра' : unit === 'дм' ? 'дециметра' : 'сантиметра'} е обиколката на оцветения правоъгълник?`, drawing: gridSvg(cols, rows, cells, 22), answer: `${P} ${unit}`, solution: `Страните са ${w} · ${s} = ${w * s} ${unit} и ${h} · ${s} = ${h * s} ${unit}. Обиколка: 2 · (${w * s} + ${h * s}) = ${P} ${unit}.` };
  }
  return { text: `Страната на всяко квадратче от мрежата е ${s} ${unit}. Колко квадратни ${unit === 'м' ? 'метра' : unit === 'дм' ? 'дециметра' : 'сантиметра'} е лицето на оцветената фигура?`, drawing: gridSvg(cols, rows, cells, 22), answer: `${area} кв. ${unit}`, solution: `Едно квадратче е ${s} · ${s} = ${s * s} кв. ${unit}. Оцветените са ${cells.size}: ${cells.size} · ${s * s} = ${area} кв. ${unit}.` };
}

/* ---------- 18. Part of a sum/product, special numbers ---------- */
const SPECIAL = [
  ['най-малкото четирицифрено число', 1000], ['най-голямото трицифрено число', 999], ['най-голямото трицифрено четно число', 998],
  ['най-малкото трицифрено число', 100], ['най-малкото петцифрено число', 10000], ['най-голямото четирицифрено число', 9999],
];
function t18_partOf(r) {
  const v = r.pick(['product', 'sum', 'special']);
  if (v === 'special') {
    const [name, val] = r.pick(SPECIAL);
    const a = r.R(1001, 4999), b = r.R(101, 999);
    const kind = r.R(0, 1);
    const ans = kind ? a + b - val : a + b + val;
    if (ans <= 0) return t18_partOf(r);
    return { text: kind ? `Колко се получава, ако от сбора на числата ${fmt(a)} и ${b} се извади ${name}?` : `Колко се получава, ако към сбора на числата ${fmt(a)} и ${b} се прибави ${name}?`, answer: fmt(ans), solution: `${name[0].toUpperCase() + name.slice(1)} е ${fmt(val)}. ${fmt(a)} + ${b} = ${fmt(a + b)}; ${fmt(a + b)} ${kind ? '–' : '+'} ${fmt(val)} = ${fmt(ans)}.` };
  }
  const q = r.pick([2, 3, 4]);
  let a, b, val, word;
  do {
    if (v === 'product') { a = r.R(101, 999); do { b = r.R(2, 9); } while (b === q); val = a * b; word = 'произведението'; }
    else { a = r.R(100, 2999); b = r.R(100, 999); val = a + b; word = 'сбора'; }
  } while (val % q);
  return { text: `Колко е ${PART[q][1]} от ${word} на числата ${fmt(a)} и ${b}?`, answer: fmt(val / q), solution: `${v === 'product' ? `${fmt(a)} · ${b}` : `${fmt(a)} + ${b}`} = ${fmt(val)}; ${fmt(val)} : ${q} = ${fmt(val / q)}.` };
}

/* ---------- 19. Unknown number with an expression on the right ---------- */
function t19_unknownExpr(r) {
  const kind = r.pick(['dividend', 'divisor', 'subtrahend', 'minuend']);
  if (kind === 'dividend') { const d = r.R(3, 9), p = r.R(200, 800), q = r.R(10, 99); const x = d * (p + q); return { text: `Кое е неизвестното число? <span class="expr">□ : ${d} = ${p} + ${q}</span>`, answer: fmt(x), solution: `Първо дясната страна: ${p} + ${q} = ${p + q}. Неизвестното делимо: ${p + q} · ${d} = ${fmt(x)}.` }; }
  if (kind === 'divisor') { const c = r.R(3, 9), x = r.R(21, 199), p = r.R(c + 10, 300); return { text: `Кое е неизвестното число? <span class="expr">${c * x} : □ = ${p} – ${p - c}</span>`, answer: fmt(x), solution: `${p} – ${p - c} = ${c}. Неизвестният делител: ${c * x} : ${c} = ${x}.` }; }
  if (kind === 'subtrahend') { const a = r.R(1200, 4999), p = r.R(2, 9) * 100, q = r.R(1, 9) * 10; const x = a - (p + q); return { text: `Колко е неизвестното число? <span class="expr">${fmt(a)} – □ = ${p} + ${q}</span>`, answer: fmt(x), solution: `${p} + ${q} = ${p + q}. Неизвестният умалител: ${fmt(a)} – ${p + q} = ${fmt(x)}.` }; }
  const b = r.R(101, 499), p = r.R(2, 6) * 1000, q = r.R(101, 899); const x = p + q + b;
  return { text: `Кое е неизвестното число? <span class="expr">□ – ${b} = ${fmt(p)} + ${q}</span>`, answer: fmt(x), solution: `${fmt(p)} + ${q} = ${fmt(p + q)}. Неизвестното умаляемо: ${fmt(p + q)} + ${b} = ${fmt(x)}.` };
}

/* ---------- 20. Expression with several operations, or time ---------- */
function t20_expression(r) {
  const v = r.pick(['brackets', 'factor', 'factor2', 'time']);
  if (v === 'brackets') { const a = r.R(2, 9) * 100, b = r.R(2, 9) * 100, k = r.R(2, 3); const big = (a + b) * k + r.R(1, 40) * 100; return { text: `Колко е резултатът от пресмятането на числовия израз? <span class="expr">${fmt(big)} – (${a} + ${b}) · ${k}</span>`, answer: fmt(big - (a + b) * k), solution: `Скобите: ${a + b}; умножение: ${(a + b) * k}; изваждане: ${fmt(big)} – ${(a + b) * k} = ${fmt(big - (a + b) * k)}.` }; }
  if (v === 'factor') { const k = r.R(2, 12), n = r.pick([100, 200, 300, 500, 900, 111, 125, 250]); return { text: `Колко е резултатът от пресмятането на числовия израз? <span class="expr">${k + 1} · ${n} – ${n}</span>`, answer: fmt(k * n), solution: `${k + 1} пъти ${n} без едно ${n} са ${k} пъти ${n}: ${k} · ${n} = ${fmt(k * n)}.` }; }
  if (v === 'factor2') { const a = r.R(5, 9), b = r.R(1, a - 1), n = r.pick([111, 125, 250, 101, 1001]); return { text: `Колко е резултатът от пресмятането на числовия израз? <span class="expr">${a} · ${n} – ${n} · ${b}</span>`, answer: fmt((a - b) * n), solution: `(${a} – ${b}) · ${n} = ${a - b} · ${n} = ${fmt((a - b) * n)}.` }; }
  const H = r.R(9, 17), m = r.R(6, 11) * 5, e = r.R(1, 6) * 5; const dur = 60 - m + e;
  return { text: `Урокът по пиано на Ема започва в посоченото на часовника време и свършва ${e} минути след ${H}:00 ч. Колко минути е продължителността на урока?`, drawing: clockSvg((H - 1) % 12, m), answer: `${dur} минути`, solution: `Часовникът показва ${H - 1}:${m}. До ${H}:00 са ${60 - m} мин., после още ${e}: ${dur} минути.` };
}

/* ---------- 21. Area and perimeter (extended answer) ---------- */
function t21_geo(r) {
  const v = r.pick(['half', 'samePerimeter', 'fromArea', 'fromSquares']);
  if (v === 'half') { const s = r.R(3, 15) * 2; const P = 4 * s; return { text: `Квадрат с обиколка ${P} метра е разделен наполовина на два еднакви правоъгълника. Колко метра е обиколката на единия правоъгълник?`, answer: `${3 * s} м`, solution: `Страната на квадрата: ${P} : 4 = ${s} м. Правоъгълникът е ${s} м и ${s / 2} м. Обиколка: 2 · (${s} + ${s / 2}) = ${3 * s} м.` }; }
  if (v === 'samePerimeter') { const a = r.R(6, 25), b = r.R(Math.ceil(a / 2), 2 * a - 1); if (b === a) return t21_geo(r); return { text: `Квадрат има страна ${a} см. Правоъгълник има същата обиколка като квадрата, а едната му страна е ${b} см. Колко сантиметра е другата страна на правоъгълника?`, answer: `${2 * a - b} см`, solution: `Обиколка на квадрата: 4 · ${a} = ${4 * a} см. Половината е ${2 * a} см = сбор от двете страни на правоъгълника. Другата страна: ${2 * a} – ${b} = ${2 * a - b} см.` }; }
  if (v === 'fromArea') { const a = r.R(4, 20), b = r.R(3, 15) * (r.R(0, 1) ? 1 : 2); const S = a * b; return { text: `Лицето на правоъгълна градина е ${S} кв. м, а едната ѝ страна е ${a} м. Колко метра ограда е нужна, за да се огради градината?`, answer: `${2 * (a + b)} м`, solution: `Другата страна: ${S} : ${a} = ${b} м. Обиколка: 2 · (${a} + ${b}) = ${2 * (a + b)} м.` }; }
  const s = r.R(2, 9), P = 4 * s, k = r.R(3, 6);
  const shapes = { 3: ['0,0', '1,0', '1,1'], 4: ['0,0', '1,0', '2,0', '2,1'], 5: ['0,1', '1,1', '1,0', '2,1', '3,1'], 6: ['0,0', '1,0', '2,0', '0,1', '1,1', '2,1'] };
  return { text: `Фигурата е съставена от ${k} еднакви квадрата. Обиколката на всеки квадрат е ${P} дм. Колко квадратни дециметра е лицето на цялата фигура?`, drawing: gridSvg(4, 2, new Set(shapes[k]), 28), answer: `${k * s * s} кв. дм`, solution: `Страната на квадрат: ${P} : 4 = ${s} дм. Лице на един: ${s} · ${s} = ${s * s} кв. дм. Всички ${k}: ${k} · ${s * s} = ${k * s * s} кв. дм.` };
}

/* ---------- 22. Money and mass in two steps ---------- */
function t22_money(r) {
  const v = r.pick(['twoItems', 'box', 'sacks', 'bottles', 'instalments']);
  if (v === 'twoItems') {
    /* [one, many (after a number), one of the second item, many of the second item] */
    const [aOne, aMany, bOne, bMany, bNum] = r.pick([['хладилник', 'хладилника', 'една печка', 'печки', FEM], ['велосипед', 'велосипеда', 'една тротинетка', 'тротинетки', FEM], ['телевизор', 'телевизора', 'един таблет', 'таблета', MASC]]);
    const pa = r.R(8, 60) * 10, pb = r.R(4, 40) * 10, n1 = r.R(2, 4), n2 = r.R(1, n1), n3 = r.R(2, 5);
    const two = n2 === 1 ? `един ${aOne}` : `${MASC[n2]} ${aMany}`;
    const first = MASC[n1][0].toUpperCase() + MASC[n1].slice(1);
    return { text: `${first} ${aMany} струват ${n1 * pa} евро, а ${two} и ${bNum[n3]} ${bMany} – ${fmt(n2 * pa + n3 * pb)} евро. Колко евро струва ${bOne}?`, answer: `${pb} евро`, solution: `Един ${aOne}: ${n1 * pa} : ${n1} = ${pa} евро. ${n2 === 1 ? 'Той' : `${n2} ${aMany}`} — ${n2 * pa} евро. ${n3} ${bMany}: ${fmt(n2 * pa + n3 * pb)} – ${n2 * pa} = ${n3 * pb} евро. ${bOne[0].toUpperCase() + bOne.slice(1)}: ${n3 * pb} : ${n3} = ${pb} евро.` };
  }
  if (v === 'box') { const n = r.pick([10, 12, 15, 20, 24]), g = r.R(8, 25), e = r.R(2, 9) * 10; return { text: `Кутия с бонбони тежи ${n * g + e} г и съдържа ${n} еднакви бонбона. Празната кутия тежи ${e} г. Колко грама тежи един бонбон?`, answer: `${g} г`, solution: `Бонбоните: ${n * g + e} – ${e} = ${n * g} г. Един: ${n * g} : ${n} = ${g} г.` }; }
  if (v === 'sacks') { const t = r.R(2, 9), k = r.pick([20, 25, 40, 50]); return { text: `Камион превозва ${t} тона жито в чували по ${k} килограма. Колко са чувалите?`, answer: `${(t * 1000) / k} чувала`, solution: `${t} т = ${t * 1000} кг. ${t * 1000} : ${k} = ${(t * 1000) / k} чувала.` }; }
  if (v === 'bottles') { const a = r.R(25, 45) * 10, b = r.R(11, 30), n = r.R(12, 40); return { text: `Стъклена бутилка тежи ${a} грама, а пластмасова – ${b} грама. С колко грама ${n} стъклени бутилки са по-тежки от ${n} пластмасови?`, answer: `${fmt(n * (a - b))} г`, solution: `${n} · ${a} = ${fmt(n * a)} г; ${n} · ${b} = ${n * b} г; разлика ${fmt(n * (a - b))} г. (Или: (${a} – ${b}) · ${n}.)` }; }
  const instalments = r.pick([6, 10, 12]), x = r.R(30, 90) * 10, over = r.R(3, 15) * 10; const per = (x + over) / instalments;
  if (!Number.isInteger(per)) return t22_money(r);
  return { text: `Пералня струва ${x} евро при плащане наведнъж или ${instalments} вноски по ${per} евро. С колко евро се оскъпява пералнята при плащане на вноски?`, answer: `${over} евро`, solution: `${instalments} · ${per} = ${x + over} евро; ${x + over} – ${x} = ${over} евро.` };
}

/* ---------- 23. "In total…, of them…, times more / more by" ---------- */
function t23_times(r) {
  const v = r.pick(['remainder', 'festival', 'timesFewer', 'third']);
  if (v === 'remainder') { const a = r.R(10, 60) * 10, k = r.R(2, 4), c = r.R(20, 120) * 10; const N = a + k * a + c; return { text: `В градски парк засадили общо ${fmt(N)} дръвчета, храсти и цветя. Дръвчетата били ${a}, а храстите – ${k} пъти повече от дръвчетата. Колко цветя са засадили?`, answer: `${fmt(c)} цветя`, solution: `Храсти: ${a} · ${k} = ${k * a}. Дръвчета и храсти: ${a} + ${k * a} = ${a + k * a}. Цветя: ${fmt(N)} – ${a + k * a} = ${fmt(c)}.` }; }
  if (v === 'festival') { const p = r.R(300, 900), d = r.R(100, p - 100), k = r.R(2, 3); const T = p + (p - d) + k * p; return { text: `Във фестивал участват ${p} певци, които са с ${d} повече от инструменталистите, и танцьори – ${k} пъти повече от певците. Колко общо са участниците?`, answer: `${fmt(T)} участници`, solution: `Инструменталисти: ${p} – ${d} = ${p - d}. Танцьори: ${p} · ${k} = ${k * p}. Общо: ${p} + ${p - d} + ${k * p} = ${fmt(T)}.` }; }
  if (v === 'timesFewer') { const k = r.R(2, 5), u = r.R(20, 90), t = k * u, s = r.R(50, 400); const N = t + u + s; return { text: `В книжарница има общо ${N} тетрадки, учебници и сборници. Тетрадките са ${t} и са ${k} пъти повече от учебниците. Колко са сборниците?`, answer: `${s} сборника`, solution: `Учебници: ${t} : ${k} = ${u}. Сборници: ${N} – ${t} – ${u} = ${s}.` }; }
  const N = r.R(400, 1500), b = r.R(100, N - 300); if ((N - b) % 3) return t23_times(r);
  return { text: `В Деня на Земята доброволци засадили ${fmt(N)} дръвчета. От тях ${b} са борчета. Третинката от останалите дървета са ели. Колко са елите?`, answer: `${(N - b) / 3} ели`, solution: `Останалите: ${fmt(N)} – ${b} = ${N - b}. Третинката: ${N - b} : 3 = ${(N - b) / 3}.` };
}

/* ---------- 24. Data from a chart or a table ---------- */
function barSvg(labels, vals, unit, per) {
  const H = 150, base = 130, step = 14, w = 60 * labels.length + 40;
  let body = '';
  for (let i = 0; i <= Math.max(...vals) / per + 1; i++) body += line(30, base - i * step, w - 6, base - i * step, 'class="grid-line"');
  labels.forEach((L, i) => { const h = (vals[i] / per) * step; body += `<rect x="${44 + i * 60}" y="${base - h}" width="34" height="${h}" class="bar"/>` + text(61 + i * 60, base + 14, L, 'class="label" text-anchor="middle"'); });
  body += text(30, 12, `1 деление = ${per} ${unit}`, 'class="label"');
  return svg(w, H, body);
}
function t24_data(r) {
  if (r.R(0, 1)) {
    const per = r.pick([50, 100, 200]), unit = 'кг';
    const labels = r.pick([['домати', 'краставици', 'чушки'], ['ябълки', 'круши', 'сливи'], ['картофи', 'моркови', 'тикви']]);
    const vals = labels.map(() => r.R(2, 8) * per);
    if (new Set(vals).size < 3) return t24_data(r);
    if (r.R(0, 1)) return { text: `Диаграмата показва колко килограма ${labels.join(', ').replace(/, ([^,]*)$/, ' и $1')} са продадени на борсата. Колко килограма общо са продадени?`, drawing: barSvg(labels, vals, unit, per), answer: `${fmt(vals.reduce((a, b) => a + b))} кг`, solution: `Всяко деление е ${per} кг: ${vals.map((x, i) => `${labels[i]} ${x}`).join(', ')}. Общо ${fmt(vals.reduce((a, b) => a + b))} кг.` };
    const [i, j] = vals[0] > vals[1] ? [0, 1] : [1, 0];
    return { text: `Диаграмата показва продажбите на борсата. С колко килограма ${labels[i]}те са повече от ${labels[j]}те?`, drawing: barSvg(labels, vals, unit, per), answer: `${vals[i] - vals[j]} кг`, solution: `${labels[i]}: ${vals[i]} кг, ${labels[j]}: ${vals[j]} кг. Разлика ${vals[i] - vals[j]} кг.` };
  }
  /* table of purchases: the first row gives the cake price, then the ice cream */
  const t = r.R(3, 9), s = r.R(2, 8), a = r.R(2, 4), g1 = r.R(1, 3), g2 = r.R(1, 3);
  const table = `<table class="data-table"><tr><th>Дете</th><th>Покупка</th><th>Сума</th></tr><tr><td>Ася</td><td>${a} парчета торта</td><td>${a * t} евро</td></tr><tr><td>Галя</td><td>${g1} ${g1 === 1 ? 'парче' : 'парчета'} торта и ${g2} ${g2 === 1 ? 'сладолед' : 'сладоледа'}</td><td>${g1 * t + g2 * s} евро</td></tr></table>`;
  return { text: 'Таблицата показва покупките на две деца в сладкарница. Колко евро струва един сладолед?', drawing: table, answer: `${s} евро`, solution: `Едно парче торта: ${a * t} : ${a} = ${t} евро. Тортата на Галя: ${g1} · ${t} = ${g1 * t} евро. Сладоледите: ${g1 * t + g2 * s} – ${g1 * t} = ${g2 * s}; един: ${s} евро.` };
}

/* ---------- 25. Practical task with three parts ---------- */
function t25_plot(r) {
  const v = r.pick(['flowerBed', 'playground', 'parking']);
  if (v === 'flowerBed') {
    const a = r.R(4, 10) * 2, b = r.R(3, a / 2 + 1), c = r.pick([5, 6, 8, 10, 12, 15]), n = r.R(2, 4), p = r.R(2, 5);
    if ((a * b) % 2) return t25_plot(r);
    const half = (a * b) / 2;
    return {
      text: `Цветна леха има форма на правоъгълник с размери ${a} м и ${b} м. Половината от лехата е засадена с рози, а другата половина – с хризантеми.`,
      drawing: svg(236, 98, `<rect x="10" y="20" width="180" height="70" class="fig"/>${line(100, 20, 100, 90, 'class="fig"')}${text(55, 60, 'рози', 'class="label" text-anchor="middle"')}${text(145, 60, 'хризантеми', 'class="label" text-anchor="middle"')}${text(100, 14, `${a} м`, 'class="label" text-anchor="middle"')}${text(198, 59, `${b} м`, 'class="label"')}`),
      parts: [
        { letter: 'А', text: 'Колко квадратни метра са засадени с хризантеми?', answer: `${half} кв. м`, points: 5, solution: `${a} · ${b} = ${a * b} кв. м; половината: ${half} кв. м.` },
        { letter: 'Б', text: `Около лехата поставили ограда. Един метър ограда струва ${c} евро. Колко евро струва оградата?`, answer: `${2 * (a + b) * c} евро`, points: 5, solution: `Обиколка: 2 · (${a} + ${b}) = ${2 * (a + b)} м; ${2 * (a + b)} · ${c} = ${2 * (a + b) * c} евро.` },
        { letter: 'В', text: `На всеки квадратен метър засадили по ${n} хризантеми, а една хризантема струва ${p} евро. Колко евро струват всички хризантеми?`, answer: `${half * n * p} евро`, points: 6, solution: `${half} · ${n} = ${half * n} хризантеми; ${half * n} · ${p} = ${half * n * p} евро.` },
      ],
    };
  }
  if (v === 'playground') {
    const a = r.R(5, 12) * 3, b = r.R(4, 12), p = r.R(4, 15), w = r.R(2, 4);
    const S = a * b, fit = S / 3;
    return {
      text: `Спортна площадка има форма на правоъгълник с размери ${a} м и ${b} м. Третинката от нея е предназначена за фитнес.`,
      parts: [
        { letter: 'А', text: 'Колко квадратни метра е частта за фитнес?', answer: `${fit} кв. м`, points: 5, solution: `${a} · ${b} = ${S} кв. м; ${S} : 3 = ${fit} кв. м.` },
        { letter: 'Б', text: `Останалата част покрили с изкуствена трева. Един квадратен метър трева струва ${p} евро. Колко евро струва тревата?`, answer: `${fmt((S - fit) * p)} евро`, points: 5, solution: `${S} – ${fit} = ${S - fit} кв. м; ${S - fit} · ${p} = ${fmt((S - fit) * p)} евро.` },
        { letter: 'В', text: `Около площадката има ограда с вход, широк ${w} м. Колко метра е оградата?`, answer: `${2 * (a + b) - w} м`, points: 6, solution: `Обиколка: 2 · (${a} + ${b}) = ${2 * (a + b)} м; без входа: ${2 * (a + b)} – ${w} = ${2 * (a + b) - w} м.` },
      ],
    };
  }
  const q = r.pick([10, 12, 15, 20]), places = r.R(30, 150), a = r.pick([40, 48, 60, 72, 80]);
  const S = places * q * 2; if (S % a) return t25_plot(r);
  const b = S / a, w = r.R(3, 6);
  return {
    text: `Паркинг има форма на правоъгълник с лице ${fmt(S)} квадратни метра. Едната му страна е ${a} м.`,
    parts: [
      { letter: 'А', text: 'Колко метра е другата страна на паркинга?', answer: `${b} м`, points: 5, solution: `${fmt(S)} : ${a} = ${b} м.` },
      { letter: 'Б', text: `Половината от паркинга е за паркоместа, а едно паркомясто заема ${q} кв. м. Колко са паркоместата?`, answer: `${places} паркоместа`, points: 5, solution: `${fmt(S)} : 2 = ${fmt(S / 2)} кв. м; ${fmt(S / 2)} : ${q} = ${places}.` },
      { letter: 'В', text: `Паркингът е ограден с мрежа, като за входа и за изхода са оставени по ${w} м. Колко метра мрежа са използвани?`, answer: `${2 * (a + b) - 2 * w} м`, points: 6, solution: `Обиколка: 2 · (${a} + ${b}) = ${2 * (a + b)} м; без вход и изход: ${2 * (a + b)} – ${2 * w} = ${2 * (a + b) - 2 * w} м.` },
    ],
  };
}

/* ---------- The positions in the test ---------- */
const TEMPLATES = [
  { number: 1, kind: 'choice', points: 3, name: 'Запис и четене на многоцифрено число', gen: t01_writeNumber },
  { number: 2, kind: 'choice', points: 3, name: 'Сравняване, подреждане, редица', gen: t02_compare },
  { number: 3, kind: 'choice', points: 3, name: 'Липсваща цифра в събиране, сбор', gen: t03_missingDigit },
  { number: 4, kind: 'choice', points: 3, name: 'Разлика на многоцифрени числа', gen: t04_difference },
  { number: 5, kind: 'choice', points: 3, name: 'Умножение с едноцифрено число', gen: t05_multiply1 },
  { number: 6, kind: 'choice', points: 3, name: 'Умножение с двуцифрено число', gen: t06_multiply2 },
  { number: 7, kind: 'choice', points: 3, name: 'Деление с едноцифрено число', gen: t07_divide1 },
  { number: 8, kind: 'choice', points: 3, name: 'Деление с двуцифрено число', gen: t08_divide2 },
  { number: 9, kind: 'choice', points: 3, name: 'Неизвестно число', gen: t09_unknown },
  { number: 10, kind: 'choice', points: 3, name: 'Ред на действията', gen: t10_order },
  { number: 11, kind: 'choice', points: 3, name: 'Удобно пресмятане (общ множител)', gen: t11_convenient },
  { number: 12, kind: 'choice', points: 3, name: 'Част от фигура', gen: t12_fraction },
  { number: 13, kind: 'choice', points: 3, name: 'Броене на фигури', gen: t13_counting },
  { number: 14, kind: 'choice', points: 3, name: 'Видове ъгли и триъгълници', gen: t14_angles },
  { number: 15, kind: 'choice', points: 3, name: 'Окръжност и геометрични тела', gen: t15_circleSolids },
  { number: 16, kind: 'choice', points: 3, name: 'Мерни единици и време', gen: t16_units },
  { number: 17, kind: 'short', points: 4, name: 'Лице или обиколка в квадратна мрежа', gen: t17_grid },
  { number: 18, kind: 'short', points: 4, name: 'Част от сбор или произведение', gen: t18_partOf },
  { number: 19, kind: 'short', points: 4, name: 'Неизвестно число с израз', gen: t19_unknownExpr },
  { number: 20, kind: 'short', points: 4, name: 'Израз с няколко действия, време', gen: t20_expression },
  { number: 21, kind: 'extended', points: 5, name: 'Лице и обиколка', gen: t21_geo },
  { number: 22, kind: 'extended', points: 5, name: 'Пари и маса в две стъпки', gen: t22_money },
  { number: 23, kind: 'extended', points: 5, name: '„Пъти повече“ и „с повече“', gen: t23_times },
  { number: 24, kind: 'extended', points: 5, name: 'Данни от диаграма или таблица', gen: t24_data },
  { number: 25, kind: 'multipart', points: 16, name: 'Практическа задача с три подусловия', gen: t25_plot },
];

/* One task. If the generator cannot find 3 distinct options, it tries again. */
function makeTask(number, seed) {
  const s = TEMPLATES[number - 1];
  for (let i = 0; i < 50; i++) {
    const r = makeRng(seed * 1000 + number * 31 + i * 7919);
    try { return { ...s, gen: undefined, drawing: '', ...s.gen(r) }; } catch (e) { if (i === 49) throw e; }
  }
}

/* Practice test: 25 tasks from one number (seed) */
const makeTest = seed => TEMPLATES.map(s => makeTask(s.number, seed));
