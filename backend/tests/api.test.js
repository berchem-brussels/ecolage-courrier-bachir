/** Suite de l'API commune : session, comptes, refus, pagination, préférences, contrat. Le courrier a sa suite (courrier.test.js). */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, client } = require('./helpers');
const { getDb } = require('../src/database');

let srv;
let admin;
let agentA;
let agentB;

async function login(email, password) {
  const c = client(srv.base);
  const r = await c.post('/api/auth/login', { email, password });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return c;
}

async function createAgent(email) {
  const r = await admin.post('/api/users', { email, first_name: 'Prénom', last_name: 'Nom' });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.ok(r.body.data.generated_password, 'mot de passe généré rendu une fois');
  const c = await login(email, r.body.data.generated_password);
  const me = await c.get('/api/auth/me');
  assert.equal(me.body.data.must_change_password, 0, 'case décochée par défaut');
  assert.ok(me.body.data.csrf_token, 'jeton anti-CSRF rendu par /api/auth/me');
  return c;
}

before(async () => {
  srv = await startServer();
  admin = client(srv.base);
  const r = await admin.post('/api/install', { email: 'admin@exemple.test', first_name: 'Ada', last_name: 'Admin', password: 'mot-de-passe-solide-1' });
  assert.equal(r.status, 201);
  agentA = await createAgent('a@exemple.test');
  agentB = await createAgent('b@exemple.test');
});
after(() => srv.stop());

test('santé et version sans session, à l’enveloppe commune', async () => {
  const c = client(srv.base);
  for (const u of ['/api/health', '/api/version']) {
    const r = await c.get(u);
    assert.equal(r.status, 200);
    assert.ok(r.body.data.version);
    assert.equal(r.body.meta.envelope, 1);
    assert.equal(r.body.meta.version, r.body.data.version);
  }
});

test('installation fermée après le premier administrateur', async () => {
  const r = await client(srv.base).post('/api/install', { email: 'x@exemple.test', first_name: 'X', last_name: 'Y', password: 'mot-de-passe-solide-2' });
  assert.equal(r.status, 409);
  assert.equal(r.body.code, 'INSTALL_CLOSED');
});

test('connexion refusée avec un mauvais mot de passe, message codé et traduit', async () => {
  const r = await client(srv.base).post('/api/auth/login', { email: 'admin@exemple.test', password: 'faux' }, { headers: { 'Accept-Language': 'nl' } });
  assert.equal(r.status, 401);
  assert.equal(r.body.error, true);
  assert.equal(r.body.code, 'LOGIN_FAILED');
  assert.equal(r.body.message, 'Ongeldige aanmeldgegevens.');
});

test('champ inconnu ou numéro dans le corps refusé (mass assignment)', async () => {
  const r = await agentA.post('/api/mails', { entity_id: 1, channel: 'courrier', sender_contact_id: 1, subject: 'x', type_id: 1, number: 'AC-2026-999999' });
  assert.equal(r.status, 400);
  assert.equal(r.body.code, 'VALIDATION');
  const u = await agentA.put('/api/entities/1', { code: 'X', user_role: 'admin' });
  assert.equal(u.status, 400);
});

test('pagination bornée à 200', async () => {
  assert.equal((await agentA.get('/api/entities?limit=500')).status, 400);
  assert.equal((await agentA.get('/api/entities?limit=abc')).status, 400);
});

test('identifiant non numérique refusé', async () => {
  assert.equal((await agentA.get('/api/entities/abc')).status, 400);
});

test('comptes : un agent ne liste pas, ne crée pas, ne modifie pas', async () => {
  assert.equal((await agentA.get('/api/users')).status, 403);
  assert.equal((await agentA.post('/api/users', { email: 'z@exemple.test', first_name: 'Z', last_name: 'Z' })).status, 403);
  assert.equal((await agentA.put('/api/users/1', { user_role: 'agent' })).status, 403);
});

test('le dernier administrateur ne peut être ni rétrogradé ni désactivé', async () => {
  const me = (await admin.get('/api/auth/me')).body.data;
  const r1 = await admin.put(`/api/users/${me.id}`, { user_role: 'agent' });
  assert.equal(r1.status, 409);
  assert.equal(r1.body.code, 'LAST_ADMIN');
  assert.equal((await admin.del(`/api/users/${me.id}`)).status, 409);
});

test('désactiver un compte ferme ses sessions', async () => {
  const r = await admin.post('/api/users', { email: 'c@exemple.test', first_name: 'C', last_name: 'C' });
  const c = await login('c@exemple.test', r.body.data.generated_password);
  assert.equal((await c.get('/api/entities')).status, 200);
  assert.equal((await admin.del(`/api/users/${r.body.data.id}`)).status, 200);
  assert.equal((await c.get('/api/entities')).status, 401);
});

test('déconnexion : le jeton rejoué est refusé', async () => {
  const r = await admin.post('/api/users', { email: 'd@exemple.test', first_name: 'D', last_name: 'D' });
  const c = client(srv.base);
  const l = await c.post('/api/auth/login', { email: 'd@exemple.test', password: r.body.data.generated_password });
  assert.equal(l.body.meta.envelope, 1);
  const token = l.body.data.token;
  assert.equal((await c.post('/api/auth/logout', {})).status, 200);
  assert.equal((await client(srv.base).get('/api/entities', { bearer: token })).status, 401);
});

test('création sur le modèle Microsoft 365 : mot de passe encodé et changement imposé coché', async () => {
  const r = await admin.post('/api/users', { email: 'm@exemple.test', first_name: 'M', last_name: 'M', password_mode: 'manual', password: 'encode-par-le-gestionnaire', must_change_password: true });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.generated_password, undefined, 'aucun mot de passe rendu quand il est encodé');
  const c = await login('m@exemple.test', 'encode-par-le-gestionnaire');
  assert.equal((await c.get('/api/auth/me')).body.data.must_change_password, 1);
  const sans = await admin.post('/api/users', { email: 'n@exemple.test', first_name: 'N', last_name: 'N', password_mode: 'manual' });
  assert.equal(sans.status, 400, 'mot de passe exigé en mode encodé');
  const court = await admin.post('/api/users', { email: 'o@exemple.test', first_name: 'O', last_name: 'O', password_mode: 'manual', password: 'court' });
  assert.equal(court.status, 400, '8 caractères au moins');
  const audit = getDb().prepare("SELECT details_json FROM audit_log WHERE action = 'user.create'").all().map((x) => x.details_json).join(' ');
  assert.doesNotMatch(audit, /encode-par-le-gestionnaire|password/);
});

test('changement de mot de passe : ancien mot de passe exigé, drapeau levé', async () => {
  const r = await admin.post('/api/users', { email: 'e@exemple.test', first_name: 'E', last_name: 'E', must_change_password: true });
  const c = await login('e@exemple.test', r.body.data.generated_password);
  assert.equal((await c.get('/api/auth/me')).body.data.must_change_password, 1);
  assert.equal((await c.put('/api/auth/password', { current_password: 'faux', new_password: 'nouveau-mot-de-passe' })).status, 400);
  assert.equal((await c.put('/api/auth/password', { current_password: r.body.data.generated_password, new_password: 'nouveau-mot-de-passe' })).status, 200);
  assert.equal((await c.get('/api/auth/me')).body.data.must_change_password, 0);
});

test('préférences enregistrées en base', async () => {
  const r = await agentA.put('/api/auth/preferences', { preferred_lang: 'nl', ui_mode: 'complet', theme: 'sombre' });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.preferred_lang, 'nl');
  assert.equal((await agentA.put('/api/auth/preferences', { user_role: 'admin' })).status, 400);
});

test('paramètres publics : identité de l’instance et état d’installation', async () => {
  const r = await client(srv.base).get('/api/settings/public');
  assert.equal(r.status, 200);
  assert.equal(r.body.data.installed, true);
  assert.ok(r.body.data.theme.primary);
  assert.equal(r.body.data.environment, 'developpement');
});

test('rôles par entité : posés par l’administrateur, rendus par /api/auth/me, une seule fois par entité', async () => {
  const r = await admin.post('/api/users', { email: 'roles@exemple.test', first_name: 'R', last_name: 'R', entity_roles: [{ entity_id: 1, role: 'secretariat' }, { entity_id: 2, role: 'agent' }] });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.deepEqual(r.body.data.entity_roles.map((x) => `${x.entity_code}:${x.role}`), ['AC:secretariat', 'CPAS:agent']);
  const c = await login('roles@exemple.test', r.body.data.generated_password);
  assert.equal((await c.get('/api/auth/me')).body.data.entity_roles.length, 2);
  const double = await admin.put(`/api/users/${r.body.data.id}`, { entity_roles: [{ entity_id: 1, role: 'agent' }, { entity_id: 1, role: 'secretariat' }] });
  assert.equal(double.status, 400);
  const inconnue = await admin.put(`/api/users/${r.body.data.id}`, { entity_roles: [{ entity_id: 99, role: 'agent' }] });
  assert.equal(inconnue.status, 409);
  const role = await admin.put(`/api/users/${r.body.data.id}`, { entity_roles: [{ entity_id: 1, role: 'chef' }] });
  assert.equal(role.status, 400);
});

test('entités et registres de référence chargés depuis la configuration', async () => {
  const e = await agentA.get('/api/entities');
  assert.deepEqual(e.body.data.map((x) => x.code), ['AC', 'CPAS']);
  const r = await agentA.get('/api/registers');
  assert.deepEqual(r.body.data.map((x) => x.prefix).sort(), ['AC', 'CPAS', 'D-AC', 'D-CPAS']);
  assert.equal((await agentA.post('/api/entities', { code: 'X', name_fr: 'X', name_nl: 'X' })).status, 403);
  assert.equal((await agentA.put('/api/registers/1', { digits: 5 })).status, 403);
});

test('contrat OpenAPI : réservé aux personnes connectées, toutes les routes présentes', async () => {
  assert.equal((await client(srv.base).get('/api/openapi.json')).status, 401);
  const r = await agentA.get('/api/openapi.json');
  assert.equal(r.status, 200);
  assert.equal(r.body.openapi, '3.1.0');
  for (const p of ['/api/mails', '/api/mails/{id}', '/api/contacts', '/api/mail-types', '/api/services', '/api/entities', '/api/registers', '/api/users', '/api/users/{id}']) assert.ok(r.body.paths[p], p);
  assert.ok(r.body.paths['/api/mails'].post.requestBody);
});

test('route inconnue sous /api : 404 codé', async () => {
  const r = await agentA.get('/api/inexistant');
  assert.equal(r.status, 404);
  assert.equal(r.body.code, 'NOT_FOUND');
});
