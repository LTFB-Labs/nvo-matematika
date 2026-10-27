/* Generator self-check: node check.js [number of tests]
   1) every task is whole: no NaN/undefined, the three options differ, the answer is among them;
   2) where the task text can be parsed by code, the answer is recomputed independently of the generator. */
const fs = require('fs');
const vm = require('vm');
for (const f of ['core.js', 'generators.js']) vm.runInThisContext(fs.readFileSync(`${__dirname}/${f}`, 'utf8'), { filename: f });

const N = Number(process.argv[2] || 2000);
const num = s => Number(String(s).replace(/<[^>]+>/g, '').replace(/(\d) (?=\d{3}\b)/g, '$1').match(/-?\d+/)[0]);
const nums = s => (String(s).replace(/<[^>]+>/g, '').replace(/(\d) (?=\d{3}\b)/g, '$1').match(/\d+/g) || []).map(Number);
const errors = [];
const fail = (t, seed, msg) => errors.push(`#${t.number} seed ${seed}: ${msg}\n   ${String(t.text).replace(/<[^>]+>/g, '')}`);

/* Independent computation for the templates with a parseable text */
const CHECK = {
  4: (t) => { const [a, b] = nums(t.text); return a - b; },
  5: (t) => { const [a, m] = nums(t.text); return /пъти по-голямо/.test(t.text) ? nums(t.text)[0] * nums(t.text)[1] : a * m; },
  6: (t) => { const [a, b] = nums(t.text); return a * b; },
  7: (t) => { const [a, d] = nums(t.text); return a / d; },
  8: (t) => { const [a, d] = nums(t.text); return a / d; },
  18: (t) => {
    const n = nums(t.text);
    if (/най-/.test(t.text)) return null;
    const q = /половинк/.test(t.text) ? 2 : /третинк/.test(t.text) ? 3 : 4;
    return (/произведение/.test(t.text) ? n[0] * n[1] : n[0] + n[1]) / q;
  },
  19: (t) => {
    const e = t.text.replace(/<[^>]+>/g, '').split('?')[1].replace(/(\d) (?=\d{3}\b)/g, '$1').replace(/–/g, '-').replace(/:/g, '/');
    const [l, rr] = e.split('=');
    const right = Function(`return ${rr}`)();
    const left = Function('x', `return ${l.replace('□', 'x')}`);
    for (let x = 1; x < 200000; x++) if (left(x) === right) return x;
    return NaN;
  },
  20: (t) => {
    if (/часовника/.test(t.text)) return null;
    const e = t.text.replace(/<[^>]+>/g, '').split('?')[1].replace(/(\d) (?=\d{3}\b)/g, '$1').replace(/–/g, '-').replace(/·/g, '*');
    return Function(`return ${e}`)();
  },
};

const counts = {};
for (let seed = 1; seed <= N; seed++) {
  let test;
  try { test = makeTest(seed); } catch (e) { errors.push(`seed ${seed}: ${e.stack}`); continue; }
  for (const t of test) {
    const all = JSON.stringify(t);
    if (/NaN|undefined|null|Infinity|\[object/.test(all.replace(/"drawing":""/, ''))) fail(t, seed, 'NaN/undefined/null in the text');
    if (t.kind === 'choice') {
      const vals = Object.values(t.options || {});
      if (vals.length !== 3 || new Set(vals).size !== 3) fail(t, seed, `options are not 3 distinct values: ${vals.join(' | ')}`);
      if (!t.options[t.answer]) fail(t, seed, `answer ${t.answer} is missing`);
    } else if (t.kind === 'multipart') {
      if (!t.parts || t.parts.length !== 3 || t.parts.reduce((s, p) => s + p.points, 0) !== 16) fail(t, seed, 'not 3 parts or points are not 16');
      for (const p of t.parts) if (!(num(p.answer) > 0)) fail(t, seed, `part ${p.letter}: ${p.answer}`);
    } else if (!(num(t.answer) > 0)) fail(t, seed, `answer ${t.answer}`);
    const chk = CHECK[t.number];
    if (chk) {
      const exp = chk(t);
      if (exp !== null) {
        const got = t.kind === 'choice' ? num(t.options[t.answer]) : num(t.answer);
        if (got !== exp) fail(t, seed, `expected ${exp}, the generator says ${got}`);
        if (t.kind === 'choice') for (const [k, v] of Object.entries(t.options)) if (k !== t.answer && num(v) === exp) fail(t, seed, `wrong option ${k} is also ${exp}`);
      }
    }
    counts[t.number] = (counts[t.number] || 0) + 1;
  }
}
const uniq = {};
for (let seed = 1; seed <= 200; seed++) for (const t of makeTest(seed)) (uniq[t.number] ||= new Set()).add(t.text + JSON.stringify(t.options || t.answer));
console.log(`${N} tests, ${Object.values(counts).reduce((a, b) => a + b, 0)} tasks`);
console.log('distinct tasks in 200 tests by position:', Object.entries(uniq).map(([k, s]) => `${k}:${s.size}`).join(' '));
if (errors.length) { console.log(`\n${errors.length} errors:`); console.log([...new Set(errors)].slice(0, 25).join('\n')); process.exit(1); }
console.log('No errors.');
