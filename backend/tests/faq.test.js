/**
 * FAQ locale (standard v3.3, section 13.1) : lecture par toute personne connectée ; écriture par l'administrateur et les gestionnaires
 * du registre ; désactivation logique ; auteur enregistré ; journal d'audit sans le texte (décision du 03/11/2026, écart E40).
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, client } = require('./helpers');
const { getDb } = require('../src/database');

let srv; let admin; let gest; let sec; let agent;
async function person(email, roles) {
  const r = await admin.post('/api/users', { email, first_name: 'P', last_name: email, ...(roles ? { entity_roles: roles } : {}) });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const c = client(srv.base);
  await c.post('/api/auth/login', { email, password: r.body.data.generated_password });
  return c;
}
before(async () => {
  srv = await startServer();
  admin = client(srv.base);
  await admin.post('/api/install', { email: 'admin@exemple.test', first_name: 'A', last_name: 'A', password: 'mot-de-passe-solide-1' });
  gest = await person('gest@exemple.test', [{ entity_id: 1, role: 'gestionnaire' }]);
  sec = await person('sec@exemple.test', [{ entity_id: 1, role: 'secretariat' }]);
  agent = await person('agent@exemple.test');
});
after(() => srv.stop());
const Q = (extra = {}) => ({ topic_id: 'register', question_fr: 'Où trouver un courrier ?', question_nl: 'Waar vind ik een brief?', answer_fr: 'Dans le registre.', answer_nl: 'In het register.', ...extra });
const ids = (r) => r.body.data.map((f) => f.id);

test('administrateur et gestionnaire du registre ajoutent ; secrétariat et agent sont refusés', async () => {
  assert.equal((await sec.post('/api/faq', Q())).status, 403);
  assert.equal((await agent.post('/api/faq', Q())).status, 403);
  const a = await admin.post('/api/faq', Q());
  assert.equal(a.status, 201, JSON.stringify(a.body));
  const g = await gest.post('/api/faq', Q({ question_fr: 'Autre question ?', question_nl: 'Andere vraag?' }));
  assert.equal(g.status, 201);
  assert.ok(a.body.data.created_by && g.body.data.created_by && a.body.data.created_by !== g.body.data.created_by, 'auteur enregistré');
  assert.equal(g.body.data.can_manage, true);
});

test('lecture par toute personne connectée, filtre par écran ; sans session : refus', async () => {
  const l = await agent.get('/api/faq');
  assert.equal(l.status, 200);
  assert.ok(l.body.data.length >= 2);
  assert.equal(l.body.data[0].can_manage, false);
  assert.ok((await agent.get('/api/faq?topic_id=register')).body.data.length >= 2);
  assert.equal((await agent.get('/api/faq?topic_id=autre')).body.data.length, 0);
  assert.equal((await client(srv.base).get('/api/faq')).status, 401);
});

test('modification : gestionnaire et administrateur ; refus au secrétariat ; auteur de la dernière modification', async () => {
  const id = (await admin.post('/api/faq', Q({ question_fr: 'À corriger ?', question_nl: 'Te corrigeren?' }))).body.data.id;
  assert.equal((await sec.put(`/api/faq/${id}`, { answer_fr: 'x' })).status, 403);
  const u = await gest.put(`/api/faq/${id}`, { answer_fr: 'Réponse corrigée.' });
  assert.equal(u.status, 200);
  assert.equal(u.body.data.answer_fr, 'Réponse corrigée.');
  assert.notEqual(u.body.data.updated_by, u.body.data.created_by);
});

test('retrait sans suppression : invisible des lecteurs, visible des gestionnaires, remise en service possible', async () => {
  const id = (await gest.post('/api/faq', Q({ question_fr: 'À retirer ?', question_nl: 'Te verwijderen?' }))).body.data.id;
  assert.equal((await sec.del(`/api/faq/${id}`)).status, 403);
  assert.equal((await gest.del(`/api/faq/${id}`)).status, 200);
  assert.ok(!ids(await agent.get('/api/faq')).includes(id));
  assert.equal((await agent.get(`/api/faq/${id}`)).status, 404);
  assert.ok((await gest.get('/api/faq')).body.data.some((f) => f.id === id && f.is_active === 0));
  assert.ok((await admin.get('/api/faq')).body.data.some((f) => f.id === id && f.is_active === 0));
  assert.equal((await gest.put(`/api/faq/${id}`, { is_active: 1 })).body.data.is_active, 1);
  assert.equal(getDb().prepare('SELECT COUNT(*) AS n FROM help_faq WHERE id = ?').get(id).n, 1);
});

test('validation : textes obligatoires FR et NL, bornes, identifiant d\'écran sans caractère douteux, aucun champ en trop', async () => {
  assert.equal((await gest.post('/api/faq', { question_fr: 'x' })).status, 400);
  assert.equal((await gest.post('/api/faq', Q({ question_nl: '' }))).status, 400);
  assert.equal((await gest.post('/api/faq', Q({ answer_fr: 'a'.repeat(4001) }))).status, 400);
  assert.equal((await gest.post('/api/faq', Q({ topic_id: "register'; DROP TABLE users;--" }))).status, 400);
  assert.equal((await gest.post('/api/faq', Q({ created_by: 1 }))).status, 400);
  assert.equal((await gest.get('/api/faq?topic_id=A%27B')).status, 400);
  assert.equal(getDb().prepare('SELECT COUNT(*) AS n FROM users').get().n >= 4, true);
});

test('journal d\'audit : qui, quoi, jamais le texte de la question ni de la réponse', async () => {
  await gest.post('/api/faq', Q({ question_fr: 'Question secrète unique ?', question_nl: 'Geheime vraag?', answer_fr: 'Réponse secrète unique.', answer_nl: 'Geheim antwoord.' }));
  const rows = getDb().prepare("SELECT details_json FROM audit_log WHERE action LIKE 'faq.%'").all().map((r) => r.details_json).join(' ');
  assert.ok(rows.length > 0);
  assert.doesNotMatch(rows, /secrète|Geheime|Geheim/);
  assert.ok(getDb().prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'faq.create'").get().n >= 4);
  assert.ok(getDb().prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'faq.deactivate'").get().n >= 1);
});

test('MCP : lecture pour tous, écriture pour les gestionnaires, retrait en deux appels', async () => {
  const call = async (c, name, args) => JSON.parse((await c.mcp('tools/call', { name, arguments: args })).body.result.content[0].text);
  assert.ok((await call(agent, 'list_faq', {})).data.rows.length >= 1);
  assert.equal((await call(agent, 'create_faq', Q())).code, 'FORBIDDEN');
  const c = await call(gest, 'create_faq', Q({ question_fr: 'Par MCP ?', question_nl: 'Via MCP?' }));
  assert.ok(c.data.id, JSON.stringify(c));
  const direct = await gest.mcp('tools/call', { name: 'deactivate_faq', arguments: { id: c.data.id } });
  assert.equal(direct.body.result.isError, true);
  const p = await call(gest, 'prepare_deactivate_faq', { id: c.data.id });
  assert.ok(p.data.confirmation_token);
  assert.equal((await call(gest, 'confirm_deactivate_faq', { confirmation_token: p.data.confirmation_token })).data.is_active, 0);
  assert.equal((await call(sec, 'update_faq', { id: c.data.id, answer_fr: 'x' })).code, 'FORBIDDEN');
});
