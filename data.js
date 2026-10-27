/* Data layer. The app talks only to `data`, and the provider decides where it is kept:
   IndexedDB in the browser now, later REST to a server (stage 4 in ../plan.md),
   with no changes to the rest of the code.

   Collections:
   - profile  — { id: 'me', name }
   - attempts — one practice test or practice session: { id, kind, number?, seed, at, points, max, seconds, childId? }
   - answers  — every solved task: { id, attemptId, at, number, kind, points, scored, correct, seconds, realTaskId?, childId? }
     `realTaskId` identifies a task from a real MON test (e.g. 'nvo2024-13'):
     it is used to count how often it was solved right or wrong and the average time.

   Provider = an object with async get(col, id), all(col), put(col, obj), remove(col, id), clear(col).

   `childId` is set when the app runs inside LevAcademy with a child (see connectLevAcademy below):
   then attempts and answers are shown only for that child; records without childId only when no child is connected. */

const COLLECTIONS = ['profile', 'attempts', 'answers'];

/* ---------- One-time migration from the first version ----------
   Until the rename the history lived in the IndexedDB database 'nvo4' with Bulgarian names.
   When the new database is created (first open), every old record is copied over with the
   new names. The old database is left untouched. */
const OLD_DB = 'nvo4';
const OLD_NAMES = {
  stores: { profil: 'profile', opiti: 'attempts', reshenia: 'answers' },
  fields: { ime: 'name', vid: 'kind', nomer: 'number', koga: 'at', tochki: 'points', sekundi: 'seconds',
    opitId: 'attemptId', poluchi: 'scored', vyarno: 'correct', istinska: 'realTaskId' },
  values: { id: { az: 'me' }, kind: { uprazhnenie: 'practice', izbiraem: 'choice', kratak: 'short', razshiren: 'extended', podusloviya: 'multipart' } },
};
const renameRecord = rec => Object.fromEntries(Object.entries(rec).map(([k, v]) => {
  const key = OLD_NAMES.fields[k] || k;
  return [key, OLD_NAMES.values[key]?.[v] ?? v];
}));

const request = req => new Promise((ok, fail) => { req.onsuccess = () => ok(req.result); req.onerror = () => fail(req.error); });

/* Opens the old database only if it exists: aborting the upgrade keeps the browser from creating it */
const openOldDb = () => new Promise(resolve => {
  const req = indexedDB.open(OLD_DB);
  req.onupgradeneeded = () => req.transaction.abort();
  req.onsuccess = () => resolve(req.result);
  req.onerror = e => { e.preventDefault(); resolve(null); };
});

async function migrateOldDb(db) {
  const old = await openOldDb();
  if (!old) return;
  try {
    for (const [from, to] of Object.entries(OLD_NAMES.stores)) {
      if (!old.objectStoreNames.contains(from)) continue;
      const records = await request(old.transaction(from).objectStore(from).getAll());
      const tx = db.transaction(to, 'readwrite');
      for (const r of records) tx.objectStore(to).put(renameRecord(r));
      await new Promise((ok, fail) => { tx.oncomplete = ok; tx.onerror = () => fail(tx.error); });
    }
  } finally { old.close(); }
}

/* ---------- Provider: IndexedDB ---------- */
function indexedDbProvider(name = 'nvo4-math', version = 1) {
  let dbP;
  const db = () => (dbP ||= new Promise((ok, fail) => {
    let created = false;
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = e => {
      created = e.oldVersion === 0;
      const d = req.result;
      for (const c of COLLECTIONS) if (!d.objectStoreNames.contains(c)) d.createObjectStore(c, { keyPath: 'id' });
      const a = req.transaction.objectStore('answers');
      if (!a.indexNames.contains('attemptId')) a.createIndex('attemptId', 'attemptId');
      if (!a.indexNames.contains('number')) a.createIndex('number', 'number');
    };
    req.onsuccess = async () => {
      if (created) { try { await migrateOldDb(req.result); } catch (e) { console.warn('Could not migrate the old history:', e); } }
      ok(req.result);
    };
    req.onerror = () => fail(req.error);
  }));
  const tx = async (col, mode, fn) => request(fn((await db()).transaction(col, mode).objectStore(col)));
  return {
    name: 'IndexedDB',
    get: (col, id) => tx(col, 'readonly', s => s.get(id)),
    all: (col) => tx(col, 'readonly', s => s.getAll()),
    put: (col, obj) => tx(col, 'readwrite', s => s.put(obj)),
    remove: (col, id) => tx(col, 'readwrite', s => s.delete(id)),
    clear: (col) => tx(col, 'readwrite', s => s.clear()),
  };
}

/* ---------- Provider: in memory (Node, private mode, checks) ---------- */
function memoryProvider() {
  const m = Object.fromEntries(COLLECTIONS.map(c => [c, new Map()]));
  const copy = o => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
  return {
    name: 'memory',
    get: async (col, id) => copy(m[col].get(id)),
    all: async (col) => [...m[col].values()].map(copy),
    put: async (col, obj) => { m[col].set(obj.id, copy(obj)); return obj.id; },
    remove: async (col, id) => { m[col].delete(id); },
    clear: async (col) => { m[col].clear(); },
  };
}

/* ---------- Provider: REST (stage 4) ----------
   GET /col, GET /col/:id, PUT /col/:id, DELETE /col/:id, DELETE /col.
   There is no server yet; it is kept to show what it has to do. */
function restProvider(baseUrl, headers = {}) {
  const call = async (method, path, body) => {
    const res = await fetch(`${baseUrl}/${path}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body && JSON.stringify(body) });
    if (!res.ok) throw new Error(`${method} ${path}: ${res.status}`);
    return res.status === 204 ? undefined : res.json();
  };
  return {
    name: 'REST',
    get: (col, id) => call('GET', `${col}/${encodeURIComponent(id)}`),
    all: (col) => call('GET', col),
    put: (col, obj) => call('PUT', `${col}/${encodeURIComponent(obj.id)}`, obj),
    remove: (col, id) => call('DELETE', `${col}/${encodeURIComponent(id)}`),
    clear: (col) => call('DELETE', col),
  };
}

/* ---------- The proxy ----------
   data.attempts.all(), data.answers.put({...}) and so on: every collection name
   becomes an object with the provider's methods. Switch the provider with data.use(p). */
function makeData(provider) {
  let p = provider;
  const collection = col => ({
    get: id => p.get(col, id),
    all: async () => (col === 'profile' ? p.all(col) : (await p.all(col)).filter(r => (r.childId ?? null) === (la?.child?.id ?? null))),
    put: obj => p.put(col, obj),
    add: obj => p.put(col, { id: newId(), ...obj }),
    remove: id => p.remove(col, id),
    clear: () => p.clear(col),
  });
  return new Proxy({}, {
    get(_, name) {
      if (name === 'use') return np => { p = np; };
      if (name === 'provider') return p;
      if (COLLECTIONS.includes(name)) return collection(name);
      return undefined;
    },
  });
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/* If the main provider fails (e.g. IndexedDB is blocked in private mode), switch to
   the fallback so the test does not break; the history is then not kept. */
function withFallback(primary, fallback) {
  let active = primary;
  const wrap = m => async (...args) => {
    try { return await active[m](...args); } catch (e) {
      if (active === fallback) throw e;
      console.warn(`${active.name} failed, saving to ${fallback.name}:`, e);
      active = fallback;
      return active[m](...args);
    }
  };
  return { get name() { return active.name; }, get: wrap('get'), all: wrap('all'), put: wrap('put'), remove: wrap('remove'), clear: wrap('clear') };
}

const data = makeData(typeof indexedDB !== 'undefined' ? withFallback(indexedDbProvider(), memoryProvider()) : memoryProvider());

/* ---------- LevAcademy ----------
   Inside the LevAcademy site (https://ltfb-labs.github.io/nvo-matematika/) the core's SDK is at ../core/levacademy.js.
   With a picked child, `la.child` gives the name, the local history is kept per child and every finished
   test or practice is also sent to LevAcademy. Opened alone (the app folder at the server root, e.g. for
   development) the file is not even requested: the app stays fully local. Any failure also means local. */
let la = null;

async function connectLevAcademy() {
  const insideSite = location.protocol.startsWith('http') && location.pathname.replace(/[^/]*$/, '') !== '/';
  if (!insideSite) return null;
  try {
    const timeout = new Promise((_, fail) => setTimeout(() => fail(new Error('timeout')), 5000));
    const { LevAcademy } = await Promise.race([import('../core/levacademy.js'), timeout]);
    la = await Promise.race([LevAcademy.connect({ app: 'nvo-matematika', contract: 1 }), timeout]);
    la.on('child-changed', () => location.reload());
    la.on('signed-out', () => location.reload());
  } catch (e) {
    console.warn('LevAcademy is not available, the app runs on its own:', e.message);
    la = null;
  }
  return la;
}

/* ---------- The operations the app uses ---------- */
/* Returns false if the attempt could not be sent to LevAcademy (it is kept locally anyway) */
async function saveAttempt(attempt, answers) {
  const id = newId();
  const childId = la?.child ? { childId: la.child.id } : {};
  await data.attempts.put({ id, ...attempt, ...childId });
  for (const a of answers) await data.answers.put({ id: newId(), attemptId: id, at: attempt.at, ...a, ...childId });
  if (!la?.child) return true;
  try {
    await la.saveActivity({
      kind: attempt.kind,
      topic: attempt.number ? `type-${attempt.number}` : 'all',
      startedAt: new Date(Date.parse(attempt.at) - attempt.seconds * 1000).toISOString(),
      finishedAt: attempt.at,
      points: attempt.points,
      maxPoints: attempt.max,
      seconds: attempt.seconds,
      details: { seed: attempt.seed, answers },
    });
    return true;
  } catch (e) {
    console.warn('Could not save to LevAcademy:', e);
    return false;
  }
}

/* Deletes the history that is shown: the connected child's, or the one without a child */
async function clearHistory() {
  for (const r of await data.attempts.all()) await data.attempts.remove(r.id);
  for (const r of await data.answers.all()) await data.answers.remove(r.id);
}

/* Stats per real MON task: how many times right, wrong, average time */
async function realTaskStats() {
  const st = {};
  for (const r of await data.answers.all()) {
    if (!r.realTaskId) continue;
    const s = (st[r.realTaskId] ||= { correct: 0, wrong: 0, seconds: 0 });
    s[r.correct ? 'correct' : 'wrong']++;
    s.seconds += r.seconds || 0;
  }
  for (const s of Object.values(st)) s.average = Math.round(s.seconds / (s.correct + s.wrong));
  return st;
}
