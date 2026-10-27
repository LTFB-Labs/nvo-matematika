/* Общото за всички генератори: случайни числа със seed (един и същ вариант
   се получава отново от същото число), запис на числата, числа с думи,
   избираеми отговори и малки SVG чертежи. Без AI: всичко се смята с код. */

/* mulberry32: бърз генератор със seed */
function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const R = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  const pick = arr => arr[Math.floor(next() * arr.length)];
  const shuffle = arr => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = R(0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  return { next, R, pick, shuffle };
}

/* 3405, но 34 050: както в тестовете на МОН, групираме по три от 10 000 нагоре */
const fmt = n => { const s = String(n); return n >= 10000 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s; };
const digitsOf = n => String(n).split('').reverse().map(Number);

/* ---------- Числа с думи ----------
   Правилата от тестовете: „петдесет милиона двадесет и седем хиляди и три“,
   „четири милиона двеста и три хиляди и тридесет“. В група от три цифри „и“
   стои пред последната дума; пред последната група — ако тя е една дума. */
const W_UNIT = { m: ['', 'един', 'два', 'три', 'четири', 'пет', 'шест', 'седем', 'осем', 'девет'],
                 f: ['', 'една', 'две', 'три', 'четири', 'пет', 'шест', 'седем', 'осем', 'девет'],
                 n: ['', 'едно', 'две', 'три', 'четири', 'пет', 'шест', 'седем', 'осем', 'девет'] };
const W_TEEN = ['десет', 'единадесет', 'дванадесет', 'тринадесет', 'четиринадесет', 'петнадесет', 'шестнадесет', 'седемнадесет', 'осемнадесет', 'деветнадесет'];
const W_TENS = ['', '', 'двадесет', 'тридесет', 'четиридесет', 'петдесет', 'шестдесет', 'седемдесет', 'осемдесет', 'деветдесет'];
const W_HUND = ['', 'сто', 'двеста', 'триста', 'четиристотин', 'петстотин', 'шестстотин', 'седемстотин', 'осемстотин', 'деветстотин'];

function groupWords(n, g) {
  const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, u = n % 10;
  const w = [];
  if (h) w.push(W_HUND[h]);
  if (t === 1) w.push(W_TEEN[u]);
  else { if (t) w.push(W_TENS[t]); if (u) w.push(W_UNIT[g][u]); }
  if (w.length > 1) w.splice(w.length - 1, 0, 'и');
  return w;
}

function numberWords(n) {
  if (n === 0) return 'нула';
  const mil = Math.floor(n / 1e6), th = Math.floor(n / 1000) % 1000, un = n % 1000;
  const groups = [];
  if (mil) groups.push(mil === 1 ? ['един', 'милион'] : [...groupWords(mil, 'm'), 'милиона']);
  if (th) groups.push(th === 1 ? ['хиляда'] : [...groupWords(th, 'f'), 'хиляди']);
  if (un) groups.push(groupWords(un, 'n'));
  const last = groups[groups.length - 1];
  const lastIsOneWord = un ? last.length === 1 : (th === 1 || groupWords(th, 'f').length === 1);
  if (groups.length > 1 && lastIsOneWord) last.unshift('и');
  return groups.map(g => g.join(' ')).join(' ');
}

/* ---------- Избираем отговор ----------
   Верният отговор + грешни, които са типични грешки. Връща буквите А, Б, В
   в разбъркан ред и коя е вярната. */
function choices(rng, correct, wrongs, show = fmt) {
  const seen = new Set([String(correct)]);
  const ws = [];
  for (const w of wrongs) {
    if (w === undefined || w === null || Number.isNaN(w) || w < 0) continue;
    const k = String(w);
    if (seen.has(k)) continue;
    seen.add(k); ws.push(w);
    if (ws.length === 2) break;
  }
  if (ws.length < 2) throw new Error('няма достатъчно грешни отговори');
  const all = rng.shuffle([correct, ...ws]);
  const letters = ['А', 'Б', 'В'];
  const otgovori = {};
  all.forEach((v, i) => { otgovori[letters[i]] = typeof v === 'string' && show === fmt ? v : show(v); });
  return { otgovori, veren: letters[all.indexOf(correct)] };
}

/* Грешка в една цифра: тип „сбърка една позиция“ */
const nudgeDigit = (n, k, d) => n + d * 10 ** k;

/* ---------- SVG ---------- */
const svg = (w, h, body, cls = '') => `<svg class="cherteg ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">${body}</svg>`;
const line = (x1, y1, x2, y2, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const text = (x, y, s, extra = '') => `<text x="${x}" y="${y}" ${extra}>${s}</text>`;
const poly = (pts, extra = '') => `<polygon points="${pts.map(p => p.join(',')).join(' ')}" ${extra}/>`;

/* Часовник със стрелки. h: 0–11, m: 0–59 */
function clockSvg(h, m, size = 110) {
  const c = size / 2, r = size / 2 - 6;
  let body = `<circle cx="${c}" cy="${c}" r="${r}" class="ram"/>`;
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * 2 * Math.PI;
    body += text(c + Math.sin(a) * (r - 12), c - Math.cos(a) * (r - 12) + 4, i, 'class="cif" text-anchor="middle"');
  }
  const ah = ((h % 12) + m / 60) / 12 * 2 * Math.PI, am = m / 60 * 2 * Math.PI;
  body += line(c, c, c + Math.sin(ah) * r * 0.5, c - Math.cos(ah) * r * 0.5, 'class="strelka debela"');
  body += line(c, c, c + Math.sin(am) * r * 0.78, c - Math.cos(am) * r * 0.78, 'class="strelka"');
  body += `<circle cx="${c}" cy="${c}" r="3" class="tochka"/>`;
  return svg(size, size, body);
}

/* Квадратна мрежа: cols × rows клетки, оцветени клетки като Set от "x,y" */
function gridSvg(cols, rows, filled, cell = 22, label = '') {
  const w = cols * cell + 2, h = rows * cell + 2 + (label ? 18 : 0);
  let body = '';
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    body += `<rect x="${1 + x * cell}" y="${1 + y * cell}" width="${cell}" height="${cell}" class="${filled.has(`${x},${y}`) ? 'kletka platna' : 'kletka'}"/>`;
  }
  if (label) body += text(1 + cell / 2, rows * cell + 16, label, 'class="etiket" text-anchor="middle"');
  return svg(w, h, body);
}
