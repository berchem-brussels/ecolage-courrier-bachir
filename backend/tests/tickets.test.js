/**
 * Tickets (standard v3.3, section 13.5) adaptés aux rôles par entité : file IT pour l'administrateur, file métier pour le gestionnaire
 * du registre de l'entité du ticket, aucune capture sur les écrans qui affichent du courrier, réglages de l'administrateur.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { startServer, client } = require('./helpers');

let srv; let admin; let agentAc; let secAc; let gestAc; let gestCpas; let both;
const PNG = 'data:image/png;base64,' + Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]).toString('base64');
const AC = 1; const CPAS = 2;

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
  agentAc = await person('agent-ac@exemple.test', [{ entity_id: AC, role: 'agent' }]);
  secAc = await person('sec-ac@exemple.test', [{ entity_id: AC, role: 'secretariat' }]);
  gestAc = await person('gest-ac@exemple.test', [{ entity_id: AC, role: 'gestionnaire' }]);
  gestCpas = await person('gest-cpas@exemple.test', [{ entity_id: CPAS, role: 'gestionnaire' }]);
  both = await person('both@exemple.test', [{ entity_id: AC, role: 'secretariat' }, { entity_id: CPAS, role: 'secretariat' }]);
});
after(() => srv.stop());
const ids = (r) => r.body.data.map((t) => t.id);

test('signalement : référence annuelle, file IT, priorité ITIL, contexte et capture contrôlée', async () => {
  const r = await secAc.post('/api/tickets', { type: 'incident', title: 'Écran figé', impact: 'person', urgency: 'blocking', screen: 'tickets', context: { path: '/tickets', version: '0.2.6', lastApiError: null }, screenshot: PNG });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.match(r.body.data.reference, /^TCK-\d{4}-00001$/);
  assert.equal(r.body.data.queue, 'it');
  assert.equal(r.body.data.priority, 'P3');
  assert.equal(r.body.data.entity_code, 'AC');
  assert.equal(r.body.data.has_screenshot, true);
  assert.equal(r.body.data.screenshot, undefined);
  const faux = await secAc.post('/api/tickets', { type: 'bug', title: 'x', screenshot: 'data:image/png;base64,' + Buffer.from('pas une image').toString('base64') });
  assert.equal(faux.status, 400);
});

test('question métier : file métier de l\'entité du demandeur, jamais celle d\'une autre entité', async () => {
  const q = await secAc.post('/api/tickets', { type: 'question', title: 'Comment annuler ?', impact: 'organisation', urgency: 'blocking' });
  assert.equal(q.body.data.queue, 'business');
  assert.equal(q.body.data.priority, 'P1');
  assert.equal(q.body.data.entity_code, 'AC');
  const id = q.body.data.id;
  assert.equal((await gestAc.get(`/api/tickets/${id}`)).status, 200);
  assert.equal((await gestAc.get(`/api/tickets/${id}`)).body.data.can_handle, true);
  assert.equal((await gestCpas.get(`/api/tickets/${id}`)).status, 403);
  assert.ok(!ids(await gestCpas.get('/api/tickets')).includes(id));
  assert.ok(ids(await gestAc.get('/api/tickets')).includes(id));
  // L'administrateur (file IT) ne lit pas les questions métier.
  assert.equal((await admin.get(`/api/tickets/${id}`)).status, 403);
  assert.ok(!ids(await admin.get('/api/tickets')).includes(id));
  // Le gestionnaire de l'AC ne voit pas les tickets IT.
  const it = await secAc.post('/api/tickets', { type: 'bug', title: 'Bug IT' });
  assert.equal((await gestAc.get(`/api/tickets/${it.body.data.id}`)).status, 403);
  assert.ok(ids(await admin.get('/api/tickets')).includes(it.body.data.id));
});

test('entité : choix obligatoire avec deux entités, refusé hors de ses entités, file IT sans entité', async () => {
  const sans = await both.post('/api/tickets', { type: 'question', title: 'Laquelle ?' });
  assert.equal(sans.status, 400);
  const cpas = await both.post('/api/tickets', { type: 'question', title: 'Question CPAS', entity_id: CPAS });
  assert.equal(cpas.status, 201, JSON.stringify(cpas.body));
  assert.equal(cpas.body.data.entity_code, 'CPAS');
  assert.equal((await gestCpas.get(`/api/tickets/${cpas.body.data.id}`)).status, 200);
  assert.equal((await gestAc.get(`/api/tickets/${cpas.body.data.id}`)).status, 403);
  assert.equal((await gestAc.post('/api/tickets', { type: 'question', title: 'Autre entité', entity_id: CPAS })).status, 403);
  const adm = await admin.post('/api/tickets', { type: 'question', title: 'Question d\'administration' });
  assert.equal(adm.body.data.queue, 'it');
  assert.equal(adm.body.data.entity_code, null);
});

test('un demandeur ne voit ni ne lit le ticket d\'un autre ; la capture non plus', async () => {
  const id = (await agentAc.post('/api/tickets', { type: 'bug', title: 'Privé', screen: 'tickets', screenshot: PNG })).body.data.id;
  assert.equal((await secAc.get(`/api/tickets/${id}`)).status, 403);
  assert.equal((await secAc.get(`/api/tickets/${id}/screenshot`)).status, 403);
  assert.ok(!ids(await secAc.get('/api/tickets')).includes(id));
  assert.equal((await gestAc.get(`/api/tickets/${id}/screenshot`)).status, 403);
  const res = await fetch(`${srv.base}/api/tickets/${id}/screenshot`, { headers: { Cookie: agentAc.cookie } });
  assert.equal(res.headers.get('content-type'), 'image/png');
});

test('aucune capture sur les écrans qui affichent du courrier ; permise ailleurs', async () => {
  for (const screen of ['register', 'inbox', 'registration', 'consultations']) {
    const r = await secAc.post('/api/tickets', { type: 'bug', title: 'Avec capture', screen, screenshot: PNG });
    assert.equal(r.status, 400, screen);
    assert.equal(r.body.code, 'SCREENSHOT_NOT_ALLOWED');
  }
  assert.equal((await secAc.post('/api/tickets', { type: 'bug', title: 'Sans capture', screen: 'register' })).status, 201);
  assert.equal((await secAc.post('/api/tickets', { type: 'bug', title: 'Ailleurs', screen: 'tickets', screenshot: PNG })).status, 201);
});

test('cycle de vie : prise en charge, attente motivée, réponse, note interne, résolution, clôture', async () => {
  const id = (await secAc.post('/api/tickets', { type: 'incident', title: 'Cycle' })).body.data.id;
  assert.equal((await secAc.post(`/api/tickets/${id}/status`, { to: 'in_progress' })).status, 403);
  assert.equal((await gestAc.post(`/api/tickets/${id}/status`, { to: 'in_progress' })).status, 403);
  const p = await admin.post(`/api/tickets/${id}/status`, { to: 'in_progress' });
  assert.equal(p.body.data.status, 'in_progress');
  assert.ok(p.body.data.assignee_id);
  assert.equal((await admin.post(`/api/tickets/${id}/status`, { to: 'waiting_requester' })).body.code, 'REASON_REQUIRED');
  assert.equal((await admin.post(`/api/tickets/${id}/status`, { to: 'waiting_requester', reason: 'Quel écran ?' })).body.data.status, 'waiting_requester');
  assert.equal((await secAc.post(`/api/tickets/${id}/messages`, { body: 'La liste des courriers' })).body.data.status, 'in_progress');
  await admin.post(`/api/tickets/${id}/messages`, { body: 'Note pour l\'équipe', is_internal: true });
  assert.equal((await secAc.post(`/api/tickets/${id}/messages`, { body: 'x', is_internal: true })).status, 403);
  assert.ok(!(await secAc.get(`/api/tickets/${id}`)).body.data.messages.some((m) => m.body === 'Note pour l\'équipe'), 'note interne invisible du demandeur');
  assert.ok((await admin.get(`/api/tickets/${id}`)).body.data.messages.some((m) => m.is_internal === 1));
  assert.equal((await admin.post(`/api/tickets/${id}/status`, { to: 'resolved', reason: 'Corrigé' })).body.data.status, 'resolved');
  assert.equal((await secAc.post(`/api/tickets/${id}/status`, { to: 'closed' })).body.data.status, 'closed');
  assert.equal((await secAc.post(`/api/tickets/${id}/messages`, { body: 'encore' })).status, 409);
  assert.equal((await admin.post(`/api/tickets/${id}/status`, { to: 'in_progress' })).status, 409);
});

test('file métier : le gestionnaire de l\'entité traite, réouverture et annulation motivées', async () => {
  const id = (await secAc.post('/api/tickets', { type: 'question', title: 'Rouvrir' })).body.data.id;
  assert.equal((await gestAc.post(`/api/tickets/${id}/status`, { to: 'resolved', reason: 'Voir le mode d\'emploi' })).body.data.status, 'resolved');
  assert.equal((await secAc.post(`/api/tickets/${id}/status`, { to: 'reopen' })).body.code, 'REASON_REQUIRED');
  assert.equal((await secAc.post(`/api/tickets/${id}/status`, { to: 'reopen', reason: 'Toujours bloqué' })).body.data.status, 'in_progress');
  assert.equal((await secAc.post(`/api/tickets/${id}/status`, { to: 'cancelled', reason: 'Doublon' })).body.data.status, 'cancelled');
});

test('transfert motivé entre files ; vers la file métier seulement avec une entité', async () => {
  const id = (await secAc.post('/api/tickets', { type: 'wish', title: 'Export Excel' })).body.data.id;
  assert.equal((await secAc.put(`/api/tickets/${id}`, { priority: 'P1' })).status, 403);
  assert.equal((await secAc.put(`/api/tickets/${id}`, { title: 'Export Excel du registre' })).status, 200);
  assert.equal((await admin.put(`/api/tickets/${id}`, { priority: 'P1' })).body.code, 'REASON_REQUIRED');
  assert.equal((await admin.put(`/api/tickets/${id}`, { priority: 'P1', reason: 'Demande de la direction' })).body.data.priority, 'P1');
  assert.equal((await admin.put(`/api/tickets/${id}`, { queue: 'business' })).body.code, 'REASON_REQUIRED');
  const t = await admin.put(`/api/tickets/${id}`, { queue: 'business', reason: 'Question de fonctionnement' });
  assert.equal(t.body.data.queue, 'business');
  assert.equal(t.body.data.transferred, true, 'l\'administrateur perd l\'accès après le transfert');
  assert.equal((await admin.get(`/api/tickets/${id}`)).status, 403);
  assert.equal((await gestAc.get(`/api/tickets/${id}`)).status, 200);
  assert.equal((await gestCpas.get(`/api/tickets/${id}`)).status, 403);
  const sansEntite = (await admin.post('/api/tickets', { type: 'bug', title: 'Sans entité' })).body.data.id;
  const r = await admin.put(`/api/tickets/${sansEntite}`, { queue: 'business', reason: 'Essai' });
  assert.equal(r.status, 409);
  assert.equal(r.body.code, 'TICKET_NO_ENTITY');
});

test('pilotage et tickets à traiter limités aux files de la personne ; MCP pour Claude', async () => {
  assert.equal((await secAc.get('/api/tickets/stats')).status, 403);
  assert.deepEqual((await secAc.get('/api/tickets/to-handle')).body.data, []);
  const s = await gestAc.get('/api/tickets/stats');
  assert.equal(s.status, 200);
  assert.ok(s.body.data.open >= 1);
  const own = (await gestAc.get('/api/tickets/to-handle')).body.data;
  assert.ok(own.length >= 1 && own.every((t) => t.entity_id === AC));
  const mcp = JSON.parse((await gestCpas.mcp('tools/call', { name: 'list_tickets_to_handle', arguments: {} })).body.result.content[0].text).data;
  assert.ok(mcp.every((t) => t.entity_id === CPAS) && mcp.length >= 1);
  assert.ok('context_json' in mcp[0]);
  const adm = (await admin.get('/api/tickets/to-handle')).body.data;
  assert.ok(adm.length >= 1);
  assert.equal(adm.every((t) => t.type !== 'question' || t.entity_id === null), true);
});

test('réglages : administrateur seul, rôles de file, délais, validation et journal', async () => {
  assert.equal((await secAc.get('/api/settings/tickets')).status, 403);
  assert.equal((await gestAc.put('/api/settings/tickets', { reopen_days: 7 })).status, 403);
  const g = await admin.get('/api/settings/tickets');
  assert.deepEqual(g.body.data.business_roles, ['gestionnaire']);
  assert.deepEqual(g.body.data.it_roles, ['admin']);
  assert.deepEqual(g.body.data.sla.P1, [1, 8]);
  assert.equal((await admin.put('/api/settings/tickets', { business_roles: [] })).status, 400);
  assert.equal((await admin.put('/api/settings/tickets', { it_roles: ['directeur'] })).status, 400);
  assert.equal((await admin.put('/api/settings/tickets', { sla: { P1: [9, 8], P2: [4, 24], P3: [8, 72], P4: [24, 240] } })).status, 400);
  assert.equal((await admin.put('/api/settings/tickets', { sla: { P1: [2, 12], P2: [4, 24], P3: [8, 72], P4: [24, 240] }, reopen_days: 7 })).status, 200);
  const delai = (await secAc.post('/api/tickets', { type: 'bug', title: 'P1', impact: 'organisation', urgency: 'blocking' })).body.data.id;
  const row = require('../src/database').getDb().prepare("SELECT (julianday(due_resolution_at) - julianday(created_at)) * 24 AS h FROM tickets WHERE id = ?").get(delai);
  assert.ok(Math.abs(row.h - 12) < 0.1, `délai de résolution P1 : ${row.h} h`);
  // Le secrétariat devient la file métier : il traite alors les questions de son entité, plus le gestionnaire.
  assert.equal((await admin.put('/api/settings/tickets', { business_roles: ['secretariat'] })).status, 200);
  const q = (await agentAc.post('/api/tickets', { type: 'question', title: 'Qui traite ?' })).body.data.id;
  assert.equal((await secAc.get(`/api/tickets/${q}`)).body.data.can_handle, true);
  assert.equal((await gestAc.get(`/api/tickets/${q}`)).status, 403);
  assert.equal((await both.get(`/api/tickets/${q}`)).body.data.can_handle, true);
  // L'administrateur peut aussi être mis en file métier.
  assert.equal((await admin.put('/api/settings/tickets', { business_roles: ['secretariat', 'admin'] })).status, 200);
  assert.equal((await admin.get(`/api/tickets/${q}`)).status, 200);
  assert.equal((await admin.put('/api/settings/tickets', { business_roles: ['gestionnaire'], it_roles: ['admin'], reopen_days: 14, sla: { P1: [1, 8], P2: [4, 24], P3: [8, 72], P4: [24, 240] } })).status, 200);
  const audit = require('../src/database').getDb().prepare("SELECT details_json FROM audit_log WHERE action = 'settings.tickets' ORDER BY id").all();
  assert.ok(audit.length >= 4);
  assert.match(audit[0].details_json, /"from"/);
});

test('réglages par MCP ; les réglages des tickets ne sortent pas dans les paramètres publics', async () => {
  const r = JSON.parse((await admin.mcp('tools/call', { name: 'get_ticket_settings', arguments: {} })).body.result.content[0].text);
  assert.deepEqual(r.data.it_roles, ['admin']);
  const denied = JSON.parse((await gestAc.mcp('tools/call', { name: 'get_ticket_settings', arguments: {} })).body.result.content[0].text);
  assert.equal(denied.code, 'FORBIDDEN');
  const pub = JSON.stringify((await client(srv.base).get('/api/settings/public')).body);
  assert.doesNotMatch(pub, /business_roles|it_roles|sla_json|reopen_days/);
});

test('un ticket ne lit pas le courrier : le contexte joint ne contient que l\'écran, la version et la dernière erreur', async () => {
  const big = { path: '/registre', version: '0.2.6', lang: 'fr', userAgent: 'x', at: new Date().toISOString(), lastApiError: { status: 403, route: 'GET /api/mails', code: 'FORBIDDEN', message: 'Droits insuffisants.' } };
  const r = await secAc.post('/api/tickets', { type: 'bug', title: 'Contexte', screen: 'register', context: big });
  assert.equal(r.status, 201);
  assert.doesNotMatch(JSON.stringify(r.body.data.context), /subject|sender|AC-\d{4}-/);
  const long = await secAc.post('/api/tickets', { type: 'bug', title: 'Long', context: { x: 'a'.repeat(9000) } });
  assert.equal(long.status, 201);
});

test('nginx : bloc dédié de 4 Mo pour le signalement, limite générale de 1 Mo conservée', () => {
  const conf = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'nginx.conf'), 'utf8');
  assert.match(conf, /location = \/api\/tickets \{[^}]*client_max_body_size 4m;/);
  assert.match(conf, /location \/api\/ \{[^}]*client_max_body_size 1m;/);
});

test('capture de 2 Mo acceptée par le serveur, au-delà refusée', async () => {
  const body = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(2 * 1024 * 1024 - 8)]);
  const ok = await secAc.post('/api/tickets', { type: 'bug', title: 'Grande capture', screen: 'tickets', screenshot: `data:image/png;base64,${body.toString('base64')}` });
  assert.equal(ok.status, 201, JSON.stringify(ok.body).slice(0, 200));
  const trop = Buffer.concat([body, Buffer.alloc(1024)]);
  const ko = await secAc.post('/api/tickets', { type: 'bug', title: 'Trop grande', screen: 'tickets', screenshot: `data:image/png;base64,${trop.toString('base64')}` });
  assert.equal(ko.status, 413);
});
