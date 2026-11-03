/** Connexion Microsoft compatible avec Portal (standard v3.3, section 8.6), jouée contre un faux Microsoft qui signe ses jetons. */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const crypto = require('crypto');
const { startServer, client } = require('./helpers');
const { getDb } = require('../src/database');
const { safeNext } = require('../src/oidc');

const TENANT = 'tenant-test';
const CLIENT = 'client-test';
const good = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const bad = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
let ms;
let authority;
let nextClaims = {};
let srv;
let admin;

function sign(claims, key = good.privateKey) {
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'k1', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${h}.${p}.${crypto.sign('RSA-SHA256', Buffer.from(`${h}.${p}`), key).toString('base64url')}`;
}

before(async () => {
  ms = http.createServer((req, res) => {
    if (req.url.endsWith('/discovery/v2.0/keys')) {
      const jwk = good.publicKey.export({ format: 'jwk' });
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ keys: [{ ...jwk, kid: 'k1', alg: 'RS256', use: 'sig' }] }));
    }
    if (req.url.endsWith('/oauth2/v2.0/token')) {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ id_token: nextClaims.token }));
    }
    res.statusCode = 404; res.end();
  });
  await new Promise((r) => ms.listen(0, '127.0.0.1', r));
  authority = `http://127.0.0.1:${ms.address().port}`;
  process.env.APP_OIDC_AUTHORITY = authority;
  srv = await startServer();
  admin = client(srv.base);
  await admin.post('/api/install', { email: 'admin@exemple.test', first_name: 'A', last_name: 'A', password: 'mot-de-passe-solide-1' });
  const r = await admin.put('/api/settings/auth', { mode: 'sso_optional', tenant: TENANT, client_id: CLIENT, client_secret: 'secret-de-test', public_url: 'https://app.exemple.test' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
});
after(async () => { await srv.stop(); ms.close(); });

async function start(next = '/registre') {
  const res = await fetch(`${srv.base}/api/auth/sso/start?next=${encodeURIComponent(next)}`, { redirect: 'manual' });
  const loc = new URL(res.headers.get('location'));
  return { res, loc, state: loc.searchParams.get('state'), nonce: loc.searchParams.get('nonce') };
}
async function callback(state, cookieState, claims, key) {
  nextClaims.token = sign(claims, key);
  return fetch(`${srv.base}/api/auth/callback?code=code-test&state=${state}`, { redirect: 'manual', headers: { Cookie: `app_oidc=${cookieState}` } });
}
const claimsFor = (nonce, extra = {}) => ({
  iss: `${authority}/${TENANT}/v2.0`, aud: CLIENT, nonce, oid: 'oid-admin', email: 'admin@exemple.test',
  exp: Math.floor(Date.now() / 1000) + 600, ...extra,
});

test('adresse d’autorisation : PKCE S256, state, nonce, aucun prompt ni max_age ; cookie d’état Lax sur /api/auth', async () => {
  const { res, loc } = await start();
  assert.equal(res.status, 302);
  assert.equal(loc.pathname, `/${TENANT}/oauth2/v2.0/authorize`);
  assert.equal(loc.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(loc.searchParams.get('state') && loc.searchParams.get('nonce') && loc.searchParams.get('code_challenge'));
  assert.equal(loc.searchParams.get('prompt'), null);
  assert.equal(loc.searchParams.get('max_age'), null);
  assert.equal(loc.searchParams.get('redirect_uri'), 'https://app.exemple.test/api/auth/callback');
  const c = res.headers.get('set-cookie');
  assert.match(c, /app_oidc=/); assert.match(c, /SameSite=Lax/); assert.match(c, /Path=\/api\/auth/); assert.match(c, /HttpOnly/);
});

test('retour valide : session Strict ouverte, retour à l’écran demandé, oid enregistré', async () => {
  const { state, nonce } = await start('/registre');
  const res = await callback(state, state, claimsFor(nonce));
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/registre');
  const cookies = res.headers.getSetCookie().join(' | ');
  assert.match(cookies, /app_session=[^;]+; .*SameSite=Strict/);
  assert.equal(getDb().prepare("SELECT oid FROM users WHERE email = 'admin@exemple.test'").get().oid, 'oid-admin');
});

test('jetons refusés : signature fausse, autre locataire, expiré, nonce différent', async () => {
  const cases = [
    (n) => [claimsFor(n), bad.privateKey],
    (n) => [claimsFor(n, { iss: `${authority}/autre-locataire/v2.0` })],
    (n) => [claimsFor(n, { exp: Math.floor(Date.now() / 1000) - 3600 })],
    () => [claimsFor('nonce-different')],
  ];
  for (const make of cases) {
    const { state, nonce } = await start();
    const [claims, key] = make(nonce);
    const res = await callback(state, state, claims, key);
    assert.equal(res.headers.get('location'), '/login?erreur=SSO_TOKEN');
    assert.doesNotMatch(res.headers.getSetCookie().join(' '), /app_session=[^;]{10,}/);
  }
});

test('jeton destiné à une autre application (audience différente) refusé, sans session ouverte', async () => {
  const { state, nonce } = await start();
  const res = await callback(state, state, claimsFor(nonce, { aud: 'autre-application' }));
  assert.equal(res.headers.get('location'), '/login?erreur=SSO_TOKEN');
  assert.doesNotMatch(res.headers.getSetCookie().join(' '), /app_session=[^;]{10,}/);
});

test('état volé ou inconnu refusé ; compte inconnu refusé', async () => {
  const { state, nonce } = await start();
  assert.equal((await callback(state, 'autre-etat', claimsFor(nonce))).headers.get('location'), '/login?erreur=SSO_STATE');
  const s2 = await start();
  const r = await callback(s2.state, s2.state, claimsFor(s2.nonce, { oid: 'oid-inconnu', email: 'inconnu@exemple.test' }));
  assert.equal(r.headers.get('location'), '/login?erreur=SSO_UNKNOWN_ACCOUNT');
});

test('chemin de retour douteux ramené à /', async () => {
  for (const next of ['https://exemple.com', '//exemple.com', '/\\exemple.com', '/registre?x=<script>']) assert.equal(safeNext(next), '/', next);
  assert.equal(safeNext('/registre/12'), '/registre/12');
  const { state, nonce } = await start('https://exemple.com');
  assert.equal((await callback(state, state, claimsFor(nonce))).headers.get('location'), '/');
});

test('réglages : secret jamais renvoyé ; mode sso refusé sans administrateur joignable ; mot de passe refusé en mode sso hors secours', async () => {
  const g = await admin.get('/api/settings/auth');
  assert.equal(g.body.data.secret_set, true);
  assert.doesNotMatch(JSON.stringify(g.body), /secret-de-test/);
  const db = getDb();
  db.prepare("UPDATE users SET is_admin_local = 0, oid = NULL WHERE email = 'admin@exemple.test'").run();
  assert.equal((await admin.put('/api/settings/auth', { mode: 'sso' })).body.code, 'SSO_NO_ADMIN');
  db.prepare("UPDATE users SET is_admin_local = 1 WHERE email = 'admin@exemple.test'").run();
  const u = await admin.post('/api/users', { email: 'agent@exemple.test', first_name: 'B', last_name: 'B' });
  assert.equal((await admin.put('/api/settings/auth', { mode: 'sso' })).status, 200);
  const r = await client(srv.base).post('/api/auth/login', { email: 'agent@exemple.test', password: u.body.data.generated_password });
  assert.equal(r.status, 403);
  assert.equal(r.body.code, 'LOCAL_LOGIN_DISABLED');
  assert.equal((await client(srv.base).post('/api/auth/login', { email: 'admin@exemple.test', password: 'mot-de-passe-solide-1' })).status, 200);
  const cfg = await client(srv.base).get('/api/auth/config');
  assert.equal(cfg.body.data.mode, 'sso');
  assert.equal(cfg.body.data.microsoft, true);
});

// ---- Propres à l'application courrier (rôles par entité, secours des administrateurs, pas de fuite du secret) ----

test('compte désactivé : sa session ouverte par Microsoft est coupée aussitôt et la reconnexion est refusée', async () => {
  const { state, nonce } = await start('/registre');
  const cb = await callback(state, state, claimsFor(nonce));
  const cookie = cb.headers.getSetCookie().map((c) => c.split(';')[0]).find((c) => c.startsWith('app_session='));
  const me = await fetch(`${srv.base}/api/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(me.status, 200);
  const u = await admin.post('/api/users', { email: 'ms@exemple.test', first_name: 'M', last_name: 'S' });
  getDb().prepare("UPDATE users SET oid = 'oid-ms' WHERE id = ?").run(u.body.data.id);
  const s2 = await start();
  const ok1 = await callback(s2.state, s2.state, claimsFor(s2.nonce, { oid: 'oid-ms', email: 'ms@exemple.test' }));
  const ck2 = ok1.headers.getSetCookie().map((c) => c.split(';')[0]).find((c) => c.startsWith('app_session='));
  assert.equal((await fetch(`${srv.base}/api/auth/me`, { headers: { Cookie: ck2 } })).status, 200);
  assert.equal((await admin.del(`/api/users/${u.body.data.id}`)).status, 200);
  assert.equal((await fetch(`${srv.base}/api/auth/me`, { headers: { Cookie: ck2 } })).status, 401);
  const s3 = await start();
  const again = await callback(s3.state, s3.state, claimsFor(s3.nonce, { oid: 'oid-ms', email: 'ms@exemple.test' }));
  assert.equal(again.headers.get('location'), '/login?erreur=SSO_UNKNOWN_ACCOUNT');
});

test('mode sso : aucun changement de compte ne peut laisser l\'application sans administrateur joignable', async () => {
  const mode = await admin.get('/api/settings/auth');
  assert.equal(mode.body.data.mode, 'sso');
  const me = await admin.get('/api/auth/me');
  const id = me.body.data.id;
  // Seul administrateur joignable : retirer son accès de secours échoue et ne change rien.
  getDb().prepare('UPDATE users SET oid = NULL WHERE id = ?').run(id);
  const r = await admin.put(`/api/users/${id}`, { is_admin_local: 0 });
  assert.equal(r.status, 409);
  assert.equal(r.body.code, 'SSO_NO_ADMIN');
  assert.equal(getDb().prepare('SELECT is_admin_local FROM users WHERE id = ?').get(id).is_admin_local, 1);
  // Un second administrateur marqué rend le retrait possible.
  const second = await admin.post('/api/users', { email: 'second@exemple.test', first_name: 'S', last_name: 'S', user_role: 'admin', is_admin_local: true });
  assert.equal(second.status, 201, JSON.stringify(second.body));
  assert.equal((await admin.put(`/api/users/${id}`, { is_admin_local: 0 })).status, 200);
  assert.equal((await admin.put(`/api/users/${id}`, { is_admin_local: 1 })).status, 200);
});

test('accès de secours : réservé à un administrateur ; l\'agent ne peut pas être marqué', async () => {
  const a = await admin.post('/api/users', { email: 'agent2@exemple.test', first_name: 'A', last_name: 'G' });
  assert.equal(a.body.data.is_admin_local, 0);
  const r = await admin.put(`/api/users/${a.body.data.id}`, { is_admin_local: 1 });
  assert.equal(r.status, 400);
  const c = await admin.post('/api/users', { email: 'agent3@exemple.test', first_name: 'A', last_name: 'H', is_admin_local: true });
  assert.equal(c.body.data.is_admin_local, 0);
});

test('secret et réglages Microsoft : absents des paramètres publics, de l\'audit et des réponses du test ; le test passe par l\'administrateur seul', async () => {
  const pub = await client(srv.base).get('/api/settings/public');
  assert.doesNotMatch(JSON.stringify(pub.body), /secret-de-test|tenant-test|client-test/);
  assert.equal(pub.body.data.auth.mode, 'sso');
  const rows = getDb().prepare("SELECT details_json FROM audit_log WHERE action = 'settings.auth'").all().map((x) => x.details_json).join(' ');
  assert.doesNotMatch(rows, /secret-de-test/);
  const t = await admin.post('/api/settings/auth/test', {});
  assert.equal(t.status, 200, JSON.stringify(t.body));
  assert.equal(t.body.data.reachable, true);
  assert.doesNotMatch(JSON.stringify(t.body), /secret-de-test/);
  assert.equal((await client(srv.base).post('/api/settings/auth/test', {})).status, 401);
  const bad = await admin.post('/api/settings/auth/test', { tenant: 'inconnu-chez-microsoft' });
  assert.equal(bad.status, 200); // le faux Microsoft répond pour tout locataire : le cas d'échec est joué plus bas
});

test('test du locataire sans annuaire saisi : message précis', async () => {
  getDb().prepare("UPDATE app_settings SET value = '' WHERE key = 'auth.tenant'").run();
  const t = await admin.post('/api/settings/auth/test', {});
  assert.equal(t.status, 400);
  assert.equal(t.body.code, 'SSO_TENANT_REQUIRED');
  getDb().prepare("UPDATE app_settings SET value = ? WHERE key = 'auth.tenant'").run(TENANT);
});

test('test du locataire : échec propre quand Microsoft ne répond pas comme attendu', async () => {
  const keep = process.env.APP_OIDC_AUTHORITY;
  process.env.APP_OIDC_AUTHORITY = 'http://127.0.0.1:1';
  try {
    const t = await admin.post('/api/settings/auth/test', {});
    assert.equal(t.status, 502);
    assert.equal(t.body.code, 'SSO_TEST_FAILED');
  } finally { process.env.APP_OIDC_AUTHORITY = keep; }
});

test('installation : le premier administrateur porte l\'accès de secours ; cookie de session Strict sans fusion avec le cookie d\'état', async () => {
  assert.equal(getDb().prepare("SELECT is_admin_local FROM users WHERE email = 'admin@exemple.test'").get().is_admin_local, 1);
  const { state, nonce } = await start('/registre');
  const res = await callback(state, state, claimsFor(nonce));
  const set = res.headers.getSetCookie();
  assert.ok(set.length >= 2, 'deux cookies distincts : effacement de l\'état et session');
  assert.ok(set.some((c) => /^app_oidc=;/.test(c) && /Max-Age=0/.test(c) && /SameSite=Lax/.test(c) && /Path=\/api\/auth/.test(c)));
  assert.ok(set.some((c) => /^app_session=[^;]{20,}/.test(c) && /SameSite=Strict/.test(c) && /HttpOnly/.test(c) && /Path=\//.test(c)));
});
