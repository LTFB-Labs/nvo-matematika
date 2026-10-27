/* Проверка на генераторите: node proverka.js [брой тестове]
   1) всяка задача е цяла: няма NaN/undefined, трите отговора са различни, верният е сред тях;
   2) където условието може да се прочете с код, верният отговор се смята наново, отделно от генератора. */
const fs = require('fs');
const vm = require('vm');
for (const f of ['osnova.js', 'generatori.js']) vm.runInThisContext(fs.readFileSync(`${__dirname}/${f}`, 'utf8'), { filename: f });

const N = Number(process.argv[2] || 2000);
const num = s => Number(String(s).replace(/<[^>]+>/g, '').replace(/(\d) (?=\d{3}\b)/g, '$1').match(/-?\d+/)[0]);
const nums = s => (String(s).replace(/<[^>]+>/g, '').replace(/(\d) (?=\d{3}\b)/g, '$1').match(/\d+/g) || []).map(Number);
const errors = [];
const fail = (t, seed, msg) => errors.push(`#${t.nomer} seed ${seed}: ${msg}\n   ${String(t.uslovie).replace(/<[^>]+>/g, '')}`);

/* Независимо пресмятане за шаблоните с ясно условие */
const CHECK = {
  4: (t) => { const [a, b] = nums(t.uslovie); return a - b; },
  5: (t) => { const [a, m] = nums(t.uslovie); return /пъти по-голямо/.test(t.uslovie) ? nums(t.uslovie)[0] * nums(t.uslovie)[1] : a * m; },
  6: (t) => { const [a, b] = nums(t.uslovie); return a * b; },
  7: (t) => { const [a, d] = nums(t.uslovie); return a / d; },
  8: (t) => { const [a, d] = nums(t.uslovie); return a / d; },
  18: (t) => {
    const n = nums(t.uslovie);
    if (/най-/.test(t.uslovie)) return null;
    const q = /половинк/.test(t.uslovie) ? 2 : /третинк/.test(t.uslovie) ? 3 : 4;
    return (/произведение/.test(t.uslovie) ? n[0] * n[1] : n[0] + n[1]) / q;
  },
  19: (t) => {
    const e = t.uslovie.replace(/<[^>]+>/g, '').split('?')[1].replace(/(\d) (?=\d{3}\b)/g, '$1').replace(/–/g, '-').replace(/:/g, '/');
    const [l, rr] = e.split('=');
    const right = Function(`return ${rr}`)();
    const left = Function('x', `return ${l.replace('□', 'x')}`);
    for (let x = 1; x < 200000; x++) if (left(x) === right) return x;
    return NaN;
  },
  20: (t) => {
    if (/часовника/.test(t.uslovie)) return null;
    const e = t.uslovie.replace(/<[^>]+>/g, '').split('?')[1].replace(/(\d) (?=\d{3}\b)/g, '$1').replace(/–/g, '-').replace(/·/g, '*');
    return Function(`return ${e}`)();
  },
};

const counts = {};
for (let seed = 1; seed <= N; seed++) {
  let test;
  try { test = makeTest(seed); } catch (e) { errors.push(`seed ${seed}: ${e.stack}`); continue; }
  for (const t of test) {
    const all = JSON.stringify(t);
    if (/NaN|undefined|null|Infinity|\[object/.test(all.replace(/"chertezh":""/, ''))) fail(t, seed, 'NaN/undefined/null в текста');
    if (t.vid === 'izbiraem') {
      const vals = Object.values(t.otgovori || {});
      if (vals.length !== 3 || new Set(vals).size !== 3) fail(t, seed, `отговорите не са 3 различни: ${vals.join(' | ')}`);
      if (!t.otgovori[t.veren]) fail(t, seed, `верният ${t.veren} го няма`);
    } else if (t.vid === 'podusloviya') {
      if (!t.podusloviya || t.podusloviya.length !== 3 || t.podusloviya.reduce((s, p) => s + p.tochki, 0) !== 16) fail(t, seed, 'подусловията не са 3 или точките не са 16');
      for (const p of t.podusloviya) if (!(num(p.veren) > 0)) fail(t, seed, `подусловие ${p.bukva}: ${p.veren}`);
    } else if (!(num(t.veren) > 0)) fail(t, seed, `отговор ${t.veren}`);
    const chk = CHECK[t.nomer];
    if (chk) {
      const exp = chk(t);
      if (exp !== null) {
        const got = t.vid === 'izbiraem' ? num(t.otgovori[t.veren]) : num(t.veren);
        if (got !== exp) fail(t, seed, `очаквах ${exp}, генераторът казва ${got}`);
        if (t.vid === 'izbiraem') for (const [k, v] of Object.entries(t.otgovori)) if (k !== t.veren && num(v) === exp) fail(t, seed, `грешният ${k} също е ${exp}`);
      }
    }
    counts[t.nomer] = (counts[t.nomer] || 0) + 1;
  }
}
const uniq = {};
for (let seed = 1; seed <= 200; seed++) for (const t of makeTest(seed)) (uniq[t.nomer] ||= new Set()).add(t.uslovie + JSON.stringify(t.otgovori || t.veren));
console.log(`${N} теста, ${Object.values(counts).reduce((a, b) => a + b, 0)} задачи`);
console.log('различни задачи от 200 теста по позиции:', Object.entries(uniq).map(([k, s]) => `${k}:${s.size}`).join(' '));
if (errors.length) { console.log(`\n${errors.length} грешки:`); console.log([...new Set(errors)].slice(0, 25).join('\n')); process.exit(1); }
console.log('Без грешки.');
