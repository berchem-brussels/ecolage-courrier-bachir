/**
 * Instance de démonstration éphémère pour les captures de l'aide (jamais en production, jamais de donnée réelle).
 * Données : le jeu fictif backend/instance/atelier.exemple.json (services, types, contacts fictifs), un compte de démonstration
 * administrateur avec un rôle de gestionnaire à l'administration communale et d'auditeur au CPAS, quelques courriers et tickets fictifs.
 * Usage : `npm run build`, puis `npm run help:demo` dans un terminal et `npm run help:capture` dans un autre.
 * Variables : HELP_DEMO_PORT (8461 par défaut).
 */
const os = require('os');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawnSync } = require('child_process');

const BACK = path.resolve(__dirname, '..', '..', 'backend');
const DIST = path.resolve(__dirname, '..', 'dist');
const PORT = Number(process.env.HELP_DEMO_PORT || 8461);
const USER = 'demo@exemple.test';
const PASSWORD = 'demo-mot-de-passe-1';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'courrier-demo-'));
process.env.DB_PATH = path.join(dir, 'demo.db');
process.env.NODE_ENV = 'test';
process.env.APP_TEST_MODE = '1';
process.env.APP_ENVIRONMENT = 'acceptance';
if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('Interface non construite : lancez npm run build.'); process.exit(1); }

const seed = spawnSync(process.execPath, ['scripts/donnees-atelier.js', 'instance/atelier.exemple.json'], { cwd: BACK, env: process.env, encoding: 'utf8' });
if (seed.status !== 0) { console.error(seed.stderr || seed.stdout); process.exit(1); }


// Image fictive (une feuille blanche à lignes grises) : aucun contenu réel, déposée dans la file « À enregistrer ».
const zlib = require('zlib');
const CRC = []; for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; }
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, c]); };
function fakeScan(w = 520, h = 700) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y += 1) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x += 1) {
      const sheet = x > 40 && x < w - 40 && y > 30 && y < h - 30;
      const line = sheet && y > 110 && y % 26 < 4 && x > 80 && x < w - 80 - ((y * 7) % 90);
      const v = line ? 150 : sheet ? 252 : 214;
      const o = y * (w * 3 + 1) + 1 + x * 3;
      raw[o] = v; raw[o + 1] = v; raw[o + 2] = line ? 156 : v === 214 ? 218 : v;
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

function client(base) {
  let cookie = null; let csrf = null;
  const call = async (method, url, body) => {
    const h = {};
    if (body !== undefined) h['Content-Type'] = 'application/json';
    if (cookie) h.Cookie = cookie;
    if (csrf && method !== 'GET') h['X-CSRF-Token'] = csrf;
    const res = await fetch(base + url, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0].endsWith('=') ? null : set.split(';')[0];
    const json = await res.json().catch(() => null);
    if (json && json.data && json.data.csrf_token) csrf = json.data.csrf_token;
    return { status: res.status, body: json };
  };
  const upload = async (url, fields, file, name) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, String(v));
    fd.append('file', new Blob([file], { type: 'image/png' }), name);
    const res = await fetch(base + url, { method: 'POST', headers: { Cookie: cookie, 'X-CSRF-Token': csrf }, body: fd });
    return { status: res.status, body: await res.json().catch(() => null) };
  };
  return { get: (u) => call('GET', u), post: (u, b) => call('POST', u, b), put: (u, b) => call('PUT', u, b), upload };
}

(async () => {
  const BACK_SRC = path.join(BACK, 'src');
  const { initDb } = require(path.join(BACK_SRC, 'database'));
  const { buildApp } = require(path.join(BACK_SRC, 'app'));
  await initDb();
  const api = await new Promise((r) => { const s = buildApp().listen(0, '127.0.0.1', () => r(s)); });
  const apiBase = `http://127.0.0.1:${api.address().port}`;
  const web = http.createServer((req, res) => {
    if (req.url.startsWith('/api/')) {
      const p = http.request({ host: '127.0.0.1', port: api.address().port, path: req.url, method: req.method, headers: req.headers }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
      return req.pipe(p);
    }
    // Le fichier servi reste dans le dossier de l'interface construite : chemin normalisé puis contrôlé (aucune sortie par « .. »).
    const root = path.resolve(DIST);
    let wanted = '/';
    try { wanted = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400); return res.end(); }
    let f = path.resolve(root, `.${path.posix.normalize(`/${wanted}`)}`);
    if (!f.startsWith(root + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'index.html');
    const types = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.html': 'text/html', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
    res.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream');
    return fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => web.listen(PORT, '127.0.0.1', r));

  // Compte de démonstration et données fictives
  const c = client(apiBase);
  await c.post('/api/install', { email: USER, first_name: 'Démo', last_name: 'Démonstration', password: PASSWORD });
  await c.post('/api/auth/login', { email: USER, password: PASSWORD });
  const entities = (await c.get('/api/entities')).body.data;
  const id = (code) => entities.find((e) => e.code === code).id;
  await c.put('/api/users/1', { entity_roles: [{ entity_id: id('AC'), role: 'gestionnaire' }, { entity_id: id('CPAS'), role: 'auditeur' }] });
  const contacts = (await c.get('/api/contacts?limit=50')).body.data;
  const types = (await c.get(`/api/mail-types?entity_id=${id('AC')}&limit=50`)).body.data;
  const mail = (subject, channel, extra = {}) => c.post('/api/mails', { entity_id: id('AC'), channel, sender_contact_id: contacts[extra.contact || 0].id, subject, type_id: types[extra.type || 0].id, ...extra.fields });
  const m1 = await mail('Demande de renseignements sur une prime communale (exemple)', 'courrier');
  await mail('Contestation d\'une taxe, lettre recommandée (exemple)', 'recommande', { contact: 1, type: 1, fields: { tracking_number: 'RR123456789BE', urgency: 'urgente' } });
  await mail('Candidature spontanée pour un emploi administratif (exemple)', 'guichet', { contact: 1 });
  await c.get(`/api/mails/${m1.body.data.id}`);
  const dep = await c.upload('/api/pieces', { entity_id: id('AC') }, fakeScan(), 'Scan fictif (exemple).png');
  if (dep.status !== 201) console.error('Dépôt du fichier fictif refusé :', dep.status, JSON.stringify(dep.body));
  await c.post('/api/tickets', { type: 'question', title: 'Comment annuler un courrier enregistré deux fois ? (exemple)', impact: 'service', urgency: 'annoying', screen: 'register' });
  await c.post('/api/tickets', { type: 'wish', title: 'Pouvoir exporter le registre en tableur (exemple)', impact: 'service', urgency: 'comfort', screen: 'register' });
  console.log(`Instance de démonstration prête : http://127.0.0.1:${PORT}`);
  console.log(`  HELP_BASE_URL=http://127.0.0.1:${PORT} HELP_USER=${USER} HELP_PASSWORD=${PASSWORD}`);
  console.log('Ctrl + C pour arrêter.');
})().catch((e) => { console.error(e); process.exit(1); });
