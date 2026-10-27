/** Serveur MCP : authentification, parité avec l'API, droits, confirmation en deux appels (standard v3.2, section 7.4). */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, client } = require('./helpers');
const { collectRoutes } = require('../src/openapi');
const { TOOLS } = require('../src/mcp');

let srv;
let admin;
let agent;
let sec;
let typeId;
let contactId;
const parse = (r) => JSON.parse(r.body.result.content[0].text);

before(async () => {
  srv = await startServer();
  admin = client(srv.base);
  await admin.post('/api/install', { email: 'admin@exemple.test', first_name: 'A', last_name: 'A', password: 'mot-de-passe-solide-1' });
  const u = await admin.post('/api/users', { email: 'a@exemple.test', first_name: 'A', last_name: 'Agent' });
  agent = client(srv.base);
  await agent.post('/api/auth/login', { email: 'a@exemple.test', password: u.body.data.generated_password });
  const s = await admin.post('/api/users', { email: 's@exemple.test', first_name: 'S', last_name: 'Sec', entity_roles: [{ entity_id: 1, role: 'secretariat' }] });
  sec = client(srv.base);
  await sec.post('/api/auth/login', { email: 's@exemple.test', password: s.body.data.generated_password });
  typeId = (await admin.post('/api/mail-types', { entity_id: 1, label_fr: 'Demande' })).body.data.id;
  contactId = (await sec.post('/api/contacts', { kind: 'personne', name: 'Exemple' })).body.data.id;
});

const mailArgs = (extra = {}) => ({ entity_id: 1, channel: 'courrier', sender_contact_id: contactId, subject: 'Par MCP', type_id: typeId, ...extra });
after(() => srv.stop());

test('sans session : 401', async () => {
  assert.equal((await client(srv.base).mcp('initialize', {})).status, 401);
});

test('initialize et liste des outils, descriptions FR et NL', async () => {
  const init = await agent.mcp('initialize', {});
  assert.equal(init.status, 200);
  assert.ok(init.body.result.instructions);
  const list = await agent.mcp('tools/list', {});
  for (const t of list.body.result.tools) assert.match(t.description, / \/ NL : /, t.name);
});

test('parité : chaque route de ressource a son outil ; chaque outil a sa route', () => {
  const routes = collectRoutes(srv.app).filter((r) => /^\/api\/(mails|contacts|mail-types|services|entities|registers|users|pieces|consultations|settings$)/.test(r.path)).map((r) => `${r.method} ${r.path}`);
  const covered = TOOLS.map((t) => t.route);
  for (const r of routes) assert.ok(covered.includes(r), `route sans outil MCP : ${r}`);
  for (const c of covered) assert.ok(routes.includes(c), `outil sans route : ${c}`);
});

test('enregistrement et lecture par MCP, sous l’identité de la personne ; numéro posé par le serveur', async () => {
  const c = parse(await sec.mcp('tools/call', { name: 'create_mail', arguments: mailArgs() }));
  assert.match(c.data.number, /^AC-\d{4}-000001$/);
  const g = parse(await sec.mcp('tools/call', { name: 'get_mail', arguments: { id: c.data.id } }));
  assert.equal(g.data.subject, 'Par MCP');
  const audit = require('../src/database').getDb().prepare("SELECT channel FROM audit_log WHERE action = 'mail.register' AND entity_id = ?").get(c.data.id);
  assert.equal(audit.channel, 'mcp');
});

test('mêmes droits que l’API : un agent ne liste pas les comptes et ne voit aucun courrier', async () => {
  const r = await agent.mcp('tools/call', { name: 'list_users', arguments: {} });
  assert.equal(r.body.result.isError, true);
  assert.equal(JSON.parse(r.body.result.content[0].text).code, 'FORBIDDEN');
  const m = await agent.mcp('tools/call', { name: 'create_mail', arguments: mailArgs() });
  assert.equal(JSON.parse(m.body.result.content[0].text).code, 'FORBIDDEN');
  assert.equal(parse(await agent.mcp('tools/call', { name: 'list_mails', arguments: {} })).data.rows.length, 0);
});

test('validation des arguments : numéro imposé refusé', async () => {
  const r = await sec.mcp('tools/call', { name: 'create_mail', arguments: mailArgs({ number: 'AC-2026-999999' }) });
  assert.equal(JSON.parse(r.body.result.content[0].text).code, 'VALIDATION');
});

test('annulation en deux appels ; appel direct refusé ; jeton à usage unique', async () => {
  const id = parse(await sec.mcp('tools/call', { name: 'create_mail', arguments: mailArgs() })).data.id;
  const direct = await sec.mcp('tools/call', { name: 'cancel_mail', arguments: { id, reason: 'test' } });
  assert.equal(direct.body.result.isError, true);
  const p = parse(await sec.mcp('tools/call', { name: 'prepare_cancel_mail', arguments: { id, reason: 'Doublon' } }));
  assert.ok(p.data.confirmation_token);
  assert.equal(p.data.mail.status, 'enregistre');
  const c = parse(await sec.mcp('tools/call', { name: 'confirm_cancel_mail', arguments: { confirmation_token: p.data.confirmation_token } }));
  assert.equal(c.data.status, 'annule');
  const again = await sec.mcp('tools/call', { name: 'confirm_cancel_mail', arguments: { confirmation_token: p.data.confirmation_token } });
  assert.equal(JSON.parse(again.body.result.content[0].text).code, 'CONFIRMATION');
});

test('le jeton de confirmation est lié à la personne qui l’a demandé', async () => {
  const id = parse(await admin.mcp('tools/call', { name: 'create_service', arguments: { name_fr: 'Service MCP', entity_ids: [1] } })).data.id;
  const p = parse(await admin.mcp('tools/call', { name: 'prepare_cancel_service', arguments: { id, reason: 'x' } }));
  const r = await sec.mcp('tools/call', { name: 'confirm_cancel_service', arguments: { confirmation_token: p.data.confirmation_token } });
  assert.equal(JSON.parse(r.body.result.content[0].text).code, 'CONFIRMATION');
});
