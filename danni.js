/* Слой за данните. Приложението говори само с `danni`, а провайдърът решава
   къде се пази: сега IndexedDB в браузъра, после REST към сървър (етап 4 в
   ../plan.md), без промени в останалия код.

   Колекции:
   - profil   — { id: 'az', ime }
   - opiti    — един пробен тест или упражнение: { id, vid, nomer?, seed, koga, tochki, max, sekundi }
   - reshenia — всяка решена задача: { id, opitId, koga, nomer, vid, tochki, poluchi, vyarno, sekundi, istinska? }
     `istinska` е идентификатор на задача от истински тест на МОН (напр. 'nvo2024-13'):
     по него се смята колко пъти е решена вярно, грешно и за колко време средно.

   Провайдър = обект с async get(kol, id), all(kol), put(kol, obj), remove(kol, id), clear(kol). */

const KOLEKCII = ['profil', 'opiti', 'reshenia'];

/* ---------- Провайдър: IndexedDB ---------- */
function indexedDbProvider(ime = 'nvo4', versia = 1) {
  let dbP;
  const db = () => (dbP ||= new Promise((ok, ne) => {
    const req = indexedDB.open(ime, versia);
    req.onupgradeneeded = () => {
      const d = req.result;
      for (const k of KOLEKCII) if (!d.objectStoreNames.contains(k)) d.createObjectStore(k, { keyPath: 'id' });
      const r = req.transaction.objectStore('reshenia');
      if (!r.indexNames.contains('opitId')) r.createIndex('opitId', 'opitId');
      if (!r.indexNames.contains('nomer')) r.createIndex('nomer', 'nomer');
    };
    req.onsuccess = () => ok(req.result);
    req.onerror = () => ne(req.error);
  }));
  const tx = async (kol, mode, fn) => {
    const store = (await db()).transaction(kol, mode).objectStore(kol);
    return new Promise((ok, ne) => { const req = fn(store); req.onsuccess = () => ok(req.result); req.onerror = () => ne(req.error); });
  };
  return {
    ime: 'IndexedDB',
    get: (kol, id) => tx(kol, 'readonly', s => s.get(id)),
    all: (kol) => tx(kol, 'readonly', s => s.getAll()),
    put: (kol, obj) => tx(kol, 'readwrite', s => s.put(obj)),
    remove: (kol, id) => tx(kol, 'readwrite', s => s.delete(id)),
    clear: (kol) => tx(kol, 'readwrite', s => s.clear()),
  };
}

/* ---------- Провайдър: в паметта (Node, частен режим, проверки) ---------- */
function pametProvider() {
  const m = Object.fromEntries(KOLEKCII.map(k => [k, new Map()]));
  const copy = o => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
  return {
    ime: 'памет',
    get: async (kol, id) => copy(m[kol].get(id)),
    all: async (kol) => [...m[kol].values()].map(copy),
    put: async (kol, obj) => { m[kol].set(obj.id, copy(obj)); return obj.id; },
    remove: async (kol, id) => { m[kol].delete(id); },
    clear: async (kol) => { m[kol].clear(); },
  };
}

/* ---------- Провайдър: REST (етап 4) ----------
   GET /kol, GET /kol/:id, PUT /kol/:id, DELETE /kol/:id, DELETE /kol.
   Още няма сървър; оставен е, за да е ясно какво трябва да прави. */
function restProvider(baseUrl, headers = {}) {
  const call = async (method, path, body) => {
    const res = await fetch(`${baseUrl}/${path}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body && JSON.stringify(body) });
    if (!res.ok) throw new Error(`${method} ${path}: ${res.status}`);
    return res.status === 204 ? undefined : res.json();
  };
  return {
    ime: 'REST',
    get: (kol, id) => call('GET', `${kol}/${encodeURIComponent(id)}`),
    all: (kol) => call('GET', kol),
    put: (kol, obj) => call('PUT', `${kol}/${encodeURIComponent(obj.id)}`, obj),
    remove: (kol, id) => call('DELETE', `${kol}/${encodeURIComponent(id)}`),
    clear: (kol) => call('DELETE', kol),
  };
}

/* ---------- Проксито ----------
   danni.opiti.all(), danni.reshenia.put({...}) и т.н.: всяко име на колекция
   става обект с методите на провайдъра. Провайдърът се сменя с danni.izpolzvai(p). */
function makeDanni(provider) {
  let p = provider;
  const kolekcia = kol => ({
    get: id => p.get(kol, id),
    all: () => p.all(kol),
    put: obj => p.put(kol, obj),
    add: obj => p.put(kol, { id: novId(), ...obj }),
    remove: id => p.remove(kol, id),
    clear: () => p.clear(kol),
  });
  return new Proxy({}, {
    get(_, name) {
      if (name === 'izpolzvai') return np => { p = np; };
      if (name === 'provider') return p;
      if (KOLEKCII.includes(name)) return kolekcia(name);
      return undefined;
    },
  });
}

const novId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/* Ако основният провайдър не работи (напр. IndexedDB е забранена в частен режим),
   минава на резервния, за да не се чупи тестът; тогава историята не остава. */
function sasRezerva(osnoven, rezerven) {
  let akt = osnoven;
  const wrap = m => async (...args) => {
    try { return await akt[m](...args); } catch (e) {
      if (akt === rezerven) throw e;
      console.warn(`${akt.ime} не работи, пазя в ${rezerven.ime}:`, e);
      akt = rezerven;
      return akt[m](...args);
    }
  };
  return { get ime() { return akt.ime; }, get: wrap('get'), all: wrap('all'), put: wrap('put'), remove: wrap('remove'), clear: wrap('clear') };
}

const danni = makeDanni(typeof indexedDB !== 'undefined' ? sasRezerva(indexedDbProvider(), pametProvider()) : pametProvider());

/* ---------- Операциите, които приложението ползва ---------- */
async function zapishiOpit(opit, zadachi) {
  const id = novId();
  await danni.opiti.put({ id, ...opit });
  for (const z of zadachi) await danni.reshenia.put({ id: novId(), opitId: id, koga: opit.koga, ...z });
  return id;
}

async function iztriiIstoria() {
  await danni.opiti.clear();
  await danni.reshenia.clear();
}

/* Статистика по истинска задача на МОН: колко пъти вярно, грешно, средно време */
async function statistikaIstinski() {
  const st = {};
  for (const r of await danni.reshenia.all()) {
    if (!r.istinska) continue;
    const s = (st[r.istinska] ||= { vyarno: 0, greshno: 0, sekundi: 0 });
    s[r.vyarno ? 'vyarno' : 'greshno']++;
    s.sekundi += r.sekundi || 0;
  }
  for (const s of Object.values(st)) s.sredno = Math.round(s.sekundi / (s.vyarno + s.greshno));
  return st;
}
