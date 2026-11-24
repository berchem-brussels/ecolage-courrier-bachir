/**
 * Traitement du courrier entrant, version 0.4.0 (CDC CE-010, CE-070, CE-071, CE-073, CE-079, CR-008).
 * Prise en charge par l'agent nommé seulement, commentaires par portée, clôture avec motif, réouverture par le registre,
 * historique complet, motifs de clôture par entité, retour à « attribué » quand l'agent ou le service change, MCP,
 * cloisonnement AC et CPAS, migration 010. Données fictives fabriquées ici.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, client } = require('./helpers');
const { getDb } = require('../src/database');

const AC = 1;
const CPAS = 2;
let srv;
let admin;
let secAC;
let secCPAS;
let gestAC;
let gestCPAS;
let agentA1;
let agentA2;
let chefA;
let agentB;
let agentCPAS;
let aud;
let svcA;
let svcB;
let svcCPAS;
let contactId;
let typeAC;
let typeCPAS;
let reasons;
const parse = (r) => JSON.parse(r.body.result.content[0].text);

async function create(entityRoles, name) {
  const email = `${name}@exemple.test`;
  const r = await admin.post('/api/users', { email, first_name: name, last_name: 'Fictif', entity_roles: entityRoles });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const c = client(srv.base);
  assert.equal((await c.post('/api/auth/login', { email, password: r.body.data.generated_password })).status, 200);
  c.userId = r.body.data.id;
  return c;
}

async function service(name, entityIds) {
  const r = await admin.post('/api/services', { name_fr: name, entity_ids: entityIds });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body.data.id;
}

const newMail = async (entity = AC, extra = {}) => {
  const r = await (entity === AC ? secAC : secCPAS).post('/api/mails', { entity_id: entity, channel: 'courrier', sender_contact_id: contactId,
    subject: 'Objet confidentiel fictif', type_id: entity === AC ? typeAC : typeCPAS, ...extra });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body.data.id;
};

/** Courrier attribué au service A avec agentA1 nommé. */
async function assigned(extra = {}) {
  const id = await newMail();
  const r = await secAC.put(`/api/mails/${id}/attribution`, { service_id: svcA, agent_id: agentA1.userId, ...extra });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return id;
}

/** Courrier pris en charge par agentA1. */
async function taken() {
  const id = await assigned();
  assert.equal((await agentA1.post(`/api/mails/${id}/take`, {})).status, 200);
  return id;
}

const status = async (c, id) => (await c.get(`/api/mails/${id}`)).body.data.status;
const reasonAC = () => reasons.find((r) => r.entity_id === AC && r.label_fr === 'Répondu').id;

before(async () => {
  srv = await startServer();
  admin = client(srv.base);
  await admin.post('/api/install', { email: 'admin@exemple.test', first_name: 'A', last_name: 'A', password: 'mot-de-passe-solide-1' });
  svcA = await service('Service A fictif', [AC]);
  svcB = await service('Service B fictif', [AC]);
  svcCPAS = await service('Service CPAS fictif', [CPAS]);
  secAC = await create([{ entity_id: AC, role: 'secretariat' }], 'secac');
  secCPAS = await create([{ entity_id: CPAS, role: 'secretariat' }], 'seccpas');
  gestAC = await create([{ entity_id: AC, role: 'gestionnaire' }], 'gestac');
  gestCPAS = await create([{ entity_id: CPAS, role: 'gestionnaire' }], 'gestcpas');
  agentA1 = await create([{ entity_id: AC, role: 'agent', service_ids: [svcA] }], 'agenta1');
  agentA2 = await create([{ entity_id: AC, role: 'agent', service_ids: [svcA] }], 'agenta2');
  chefA = await create([{ entity_id: AC, role: 'chef_service', service_ids: [svcA] }], 'chefa');
  agentB = await create([{ entity_id: AC, role: 'agent', service_ids: [svcB] }], 'agentb');
  agentCPAS = await create([{ entity_id: CPAS, role: 'agent', service_ids: [svcCPAS] }], 'agentcpas');
  aud = await create([{ entity_id: AC, role: 'auditeur' }], 'aud');
  typeAC = (await admin.post('/api/mail-types', { entity_id: AC, label_fr: 'Demande' })).body.data.id;
  typeCPAS = (await admin.post('/api/mail-types', { entity_id: CPAS, label_fr: 'Demande CPAS' })).body.data.id;
  contactId = (await secAC.post('/api/contacts', { kind: 'personne', name: 'Exemple' })).body.data.id;
  reasons = (await secAC.get('/api/close-reasons?limit=200')).body.data;
});
after(() => srv.stop());

// ---------------------------------------------------------------- motifs de clôture

test('motifs de clôture : quatre motifs par défaut dans chaque entité, lisibles de toute personne connectée', async () => {
  for (const e of [AC, CPAS]) {
    const labels = reasons.filter((r) => r.entity_id === e).map((r) => r.label_fr);
    assert.deepEqual(labels, ['Répondu', 'Traité sans réponse', 'Transmis à l\'extérieur', 'Classé sans suite']);
  }
  assert.equal((await agentA1.get('/api/close-reasons')).status, 200);
});

test('motifs de clôture : le gestionnaire de l’entité gère les siens ; ni le secrétariat, ni un gestionnaire d’une autre entité', async () => {
  const ok = await gestAC.post('/api/close-reasons', { entity_id: AC, label_fr: 'Motif d’essai', label_nl: 'Proefreden' });
  assert.equal(ok.status, 201, JSON.stringify(ok.body));
  assert.equal(ok.body.data.is_active, 1);
  assert.equal((await secAC.post('/api/close-reasons', { entity_id: AC, label_fr: 'Non' })).status, 403);
  assert.equal((await gestCPAS.post('/api/close-reasons', { entity_id: AC, label_fr: 'Non' })).status, 403);
  assert.equal((await gestCPAS.put(`/api/close-reasons/${ok.body.data.id}`, { label_fr: 'Non' })).status, 403);
  assert.equal((await agentA1.del(`/api/close-reasons/${ok.body.data.id}`, { reason: 'x' })).status, 403);
  const upd = await gestAC.put(`/api/close-reasons/${ok.body.data.id}`, { label_fr: 'Motif d’essai modifié' });
  assert.equal(upd.body.data.label_fr, 'Motif d’essai modifié');
  const off = await gestAC.del(`/api/close-reasons/${ok.body.data.id}`, { reason: 'Plus utilisé' });
  assert.equal(off.status, 200);
  assert.equal(off.body.data.is_active, 0);
  assert.equal((await gestAC.del(`/api/close-reasons/${ok.body.data.id}`, { reason: 'Encore' })).status, 409);
  assert.equal(getDb().prepare('SELECT COUNT(*) AS n FROM close_reasons WHERE id = ?').get(ok.body.data.id).n, 1, 'rien n’est supprimé');
});

test('motifs de clôture : une entité créée après coup reçoit les quatre motifs par défaut', async () => {
  const r = await admin.post('/api/entities', { code: 'TEST', name_fr: 'Entité d’essai', name_nl: 'Proefentiteit' });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const n = getDb().prepare('SELECT COUNT(*) AS n FROM close_reasons WHERE entity_id = ?').get(r.body.data.id).n;
  assert.equal(n, 4);
});

// ---------------------------------------------------------------- prise en charge

test('prise en charge : l’agent nommé seulement ; ni un collègue du service, ni le responsable, ni le secrétariat, ni l’auditeur, ni l’administrateur', async () => {
  const id = await assigned();
  for (const c of [agentA2, chefA, secAC, gestAC, aud, admin, agentB, agentCPAS]) {
    assert.equal((await c.post(`/api/mails/${id}/take`, {})).status, 403, 'refusé');
  }
  assert.equal(await status(secAC, id), 'enregistre');
  const r = await agentA1.post(`/api/mails/${id}/take`, {});
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.data.status, 'en_traitement');
  assert.equal(r.body.data.taken_by, agentA1.userId);
  assert.equal(r.body.data.taken_by_first_name, 'agenta1');
  assert.ok(r.body.data.taken_at);
  assert.equal(r.body.data.rights.take, false);
  assert.equal(r.body.data.rights.close, true);
});

test('prise en charge : un courrier sans agent nommé se prend en charge par un membre du service, qui devient l’agent nommé (E55 levé) ; une seconde prise en charge répond 409', async () => {
  const id = await newMail();
  await secAC.put(`/api/mails/${id}/attribution`, { service_id: svcA });
  for (const c of [secAC, gestAC, aud, admin, agentB, agentCPAS]) assert.equal((await c.post(`/api/mails/${id}/take`, {})).status, 403, 'hors du service');
  const seen = await agentA2.get(`/api/mails/${id}`);
  assert.equal(seen.body.data.rights.take, true, 'le droit est annoncé à tout membre du service');
  const r = await agentA2.post(`/api/mails/${id}/take`, {});
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.data.status, 'en_traitement');
  assert.equal(r.body.data.agent_id, agentA2.userId, 'le preneur devient l’agent nommé');
  assert.equal(r.body.data.taken_by, agentA2.userId);
  assert.equal(r.body.data.rights.close, true, 'il peut clore');
  assert.equal((await agentA1.post(`/api/mails/${id}/take`, {})).status, 403, 'un collègue n’est plus l’agent nommé');
  const again = await agentA2.post(`/api/mails/${id}/take`, {});
  assert.equal(again.status, 409);
  assert.equal(again.body.code, 'TRANSITION');
  assert.match(again.body.message, /statut/);
});

test('prise en charge : le responsable du service prend aussi en charge un courrier sans agent nommé, puis clôt', async () => {
  const id = await newMail();
  await secAC.put(`/api/mails/${id}/attribution`, { service_id: svcA });
  assert.equal((await chefA.post(`/api/mails/${id}/take`, {})).status, 200);
  assert.equal((await chefA.post(`/api/mails/${id}/close`, { close_reason_id: reasonAC() })).status, 200);
});

test('prise en charge : un courrier non attribué, annulé ou d’une autre entité est refusé', async () => {
  const free = await newMail();
  assert.equal((await agentA1.post(`/api/mails/${free}/take`, {})).status, 403);
  const id = await assigned();
  await secAC.del(`/api/mails/${id}`, { reason: 'Erreur d’enregistrement' });
  assert.equal((await agentA1.post(`/api/mails/${id}/take`, {})).status, 409);
  const cp = await newMail(CPAS);
  assert.equal((await agentA1.post(`/api/mails/${cp}/take`, {})).status, 403);
});

test('prise en charge : le courrier reste dans « Mon service » et « Moi », avec le nom de l’agent dans les listes', async () => {
  const id = await taken();
  for (const box of ['mon_service', 'moi']) {
    const rows = (await agentA1.get(`/api/mails?box=${box}`)).body.data;
    const row = rows.find((m) => m.id === id);
    assert.ok(row, box);
    assert.equal(row.status, 'en_traitement');
    assert.equal(row.taken_by_last_name, 'Fictif');
  }
  const reg = (await secAC.get('/api/mails?status=en_traitement&limit=200')).body.data;
  assert.ok(reg.some((m) => m.id === id));
});

// ---------------------------------------------------------------- clôture

test('clôture : l’agent nommé et le responsable closent ; un collègue non nommé, le secrétariat et l’auditeur non', async () => {
  const a = await taken();
  const b = await taken();
  for (const c of [agentA2, secAC, gestAC, aud, admin, agentB]) {
    assert.equal((await c.post(`/api/mails/${a}/close`, { close_reason_id: reasonAC() })).status, 403);
  }
  const byAgent = await agentA1.post(`/api/mails/${a}/close`, { close_reason_id: reasonAC(), note: 'Réponse envoyée par courrier' });
  assert.equal(byAgent.status, 200, JSON.stringify(byAgent.body));
  assert.equal(byAgent.body.data.status, 'clos');
  assert.equal(byAgent.body.data.close_reason_label_fr, 'Répondu');
  assert.equal(byAgent.body.data.close_note, 'Réponse envoyée par courrier');
  assert.equal(byAgent.body.data.closed_by, agentA1.userId);
  const byChef = await chefA.post(`/api/mails/${b}/close`, { close_reason_id: reasonAC() });
  assert.equal(byChef.status, 200, JSON.stringify(byChef.body));
  assert.equal(byChef.body.data.closed_by, chefA.userId);
});

test('clôture : seulement depuis « en traitement » ; motif obligatoire, actif et de l’entité du courrier', async () => {
  const id = await assigned();
  const early = await agentA1.post(`/api/mails/${id}/close`, { close_reason_id: reasonAC() });
  assert.equal(early.status, 409);
  assert.equal(early.body.code, 'TRANSITION');
  assert.equal((await agentA1.post(`/api/mails/${id}/take`, {})).status, 200);
  assert.equal((await agentA1.post(`/api/mails/${id}/close`, {})).status, 400);
  const other = reasons.find((r) => r.entity_id === CPAS).id;
  const wrong = await agentA1.post(`/api/mails/${id}/close`, { close_reason_id: other });
  assert.equal(wrong.status, 409);
  assert.equal(wrong.body.code, 'CLOSE_REASON_INVALID');
  assert.equal((await agentA1.post(`/api/mails/${id}/close`, { close_reason_id: 999999 })).body.code, 'CLOSE_REASON_INVALID');
  const tmp = (await gestAC.post('/api/close-reasons', { entity_id: AC, label_fr: 'Éphémère' })).body.data.id;
  await gestAC.del(`/api/close-reasons/${tmp}`, { reason: 'Retiré' });
  assert.equal((await agentA1.post(`/api/mails/${id}/close`, { close_reason_id: tmp })).body.code, 'CLOSE_REASON_INVALID');
  assert.equal(await status(secAC, id), 'en_traitement', 'aucune clôture partielle');
  assert.equal((await agentA1.post(`/api/mails/${id}/close`, { close_reason_id: reasonAC() })).status, 200);
  assert.equal((await agentA1.post(`/api/mails/${id}/close`, { close_reason_id: reasonAC() })).status, 409);
});

test('clôture : le courrier quitte les bannettes actives, entre dans « Clos », les compteurs suivent ; le secrétariat est prévenu', async () => {
  const id = await taken();
  const before = (await agentA1.get('/api/mails/counts')).body.data;
  await agentA1.post(`/api/mails/${id}/close`, { close_reason_id: reasonAC() });
  const after = (await agentA1.get('/api/mails/counts')).body.data;
  assert.equal(after.mon_service, before.mon_service - 1);
  assert.equal(after.moi, before.moi - 1);
  assert.equal(after.clos, before.clos + 1);
  for (const box of ['mon_service', 'moi', 'en_copie']) assert.ok(!(await agentA1.get(`/api/mails?box=${box}&limit=200`)).body.data.some((m) => m.id === id), box);
  assert.ok((await agentA1.get('/api/mails?box=clos&limit=200')).body.data.some((m) => m.id === id));
  assert.ok((await chefA.get('/api/mails?box=clos&limit=200')).body.data.some((m) => m.id === id), 'le collègue du service voit les courriers clos du service');
  assert.ok(!(await agentB.get('/api/mails?box=clos&limit=200')).body.data.some((m) => m.id === id));
  assert.ok((await secAC.get('/api/mails?status=clos&limit=200')).body.data.some((m) => m.id === id));
  const notes = getDb().prepare("SELECT user_id FROM notifications WHERE mail_id = ? AND kind = 'clos'").all(id).map((n) => n.user_id);
  assert.ok(notes.includes(secAC.userId) && notes.includes(gestAC.userId));
  assert.ok(!notes.includes(agentA1.userId), 'jamais l’auteur');
});

// ---------------------------------------------------------------- réouverture

test('réouverture : secrétariat et gestionnaire avec un motif ; ni l’agent, ni le responsable, ni l’autre entité', async () => {
  const id = await taken();
  await agentA1.post(`/api/mails/${id}/close`, { close_reason_id: reasonAC() });
  for (const c of [agentA1, agentA2, chefA, aud, admin, secCPAS, gestCPAS]) {
    assert.equal((await c.post(`/api/mails/${id}/reopen`, { reason: 'Test' })).status, 403);
  }
  const noReason = await secAC.post(`/api/mails/${id}/reopen`, {});
  assert.equal(noReason.status, 400);
  const blank = await secAC.post(`/api/mails/${id}/reopen`, { reason: '   ' });
  assert.equal(blank.status, 400);
  assert.equal(blank.body.code, 'REASON_REQUIRED');
  const r = await secAC.post(`/api/mails/${id}/reopen`, { reason: 'Réponse incomplète' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.data.status, 'en_traitement');
  assert.equal(r.body.data.close_reason_id, null);
  assert.equal(r.body.data.taken_by, agentA1.userId, 'la personne qui avait pris le courrier le retrouve');
  const again = await gestAC.post(`/api/mails/${id}/reopen`, { reason: 'Encore' });
  assert.equal(again.status, 409, 'un courrier qui n’est pas clos ne se rouvre pas');
  const note = getDb().prepare("SELECT user_id FROM notifications WHERE mail_id = ? AND kind = 'rouvert'").all(id).map((n) => n.user_id);
  assert.deepEqual(note, [agentA1.userId]);
  assert.equal((await agentA1.post(`/api/mails/${id}/close`, { close_reason_id: reasonAC() })).status, 200, 'se reclôt');
});

// ---------------------------------------------------------------- attribution et traitement

test('courrier clos : ni attribution, ni changement d’agent, ni renvoi tant qu’il n’est pas rouvert', async () => {
  const id = await taken();
  await agentA1.post(`/api/mails/${id}/close`, { close_reason_id: reasonAC() });
  const a = await secAC.put(`/api/mails/${id}/attribution`, { service_id: svcB, reason: 'Autre service' });
  assert.equal(a.status, 409);
  assert.equal(a.body.code, 'CLOSED');
  assert.equal((await chefA.put(`/api/mails/${id}/agent`, { agent_id: agentA2.userId })).body.code, 'CLOSED');
  assert.equal((await agentA2.post(`/api/mails/${id}/return`, { reason: 'Pas pour nous' })).body.code, 'CLOSED');
  const g = (await secAC.get(`/api/mails/${id}`)).body.data;
  assert.equal(g.rights.attribute, false);
  assert.equal(g.rights.reopen, true);
});

test('courrier en traitement : un changement d’agent le remet « attribué » ; la nouvelle personne le prend en charge à son tour', async () => {
  const id = await taken();
  const r = await chefA.put(`/api/mails/${id}/agent`, { agent_id: agentA2.userId });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.data.status, 'enregistre');
  assert.equal(r.body.data.taken_by, null);
  assert.equal((await agentA1.post(`/api/mails/${id}/take`, {})).status, 403, 'l’ancien agent n’est plus nommé');
  assert.equal((await agentA2.post(`/api/mails/${id}/take`, {})).status, 200);
});

test('courrier en traitement : un renvoi au secrétariat ou un autre service traitant le remet « enregistré » sans service', async () => {
  const a = await taken();
  const ret = await agentA2.post(`/api/mails/${a}/return`, { reason: 'Pas pour notre service' });
  assert.equal(ret.status, 200, JSON.stringify(ret.body));
  const seen = (await secAC.get(`/api/mails/${a}`)).body.data;
  assert.equal(seen.status, 'enregistre');
  assert.equal(seen.service_id, null);
  assert.equal(seen.agent_id, null);
  assert.equal(seen.taken_by, null);
  const b = await taken();
  const re = await secAC.put(`/api/mails/${b}/attribution`, { service_id: svcB, reason: 'Mal orienté' });
  assert.equal(re.status, 200, JSON.stringify(re.body));
  assert.equal(re.body.data.status, 'enregistre');
  assert.equal(re.body.data.taken_by, null);
});

// ---------------------------------------------------------------- commentaires

test('commentaires : visibles du service ou de l’entité au choix ; un service en copie ne voit que ceux de l’entité', async () => {
  const id = await assigned({ copy_service_ids: [svcB] });
  const s = await agentA2.post(`/api/mails/${id}/comments`, { scope: 'service', body: 'Note réservée au service A' });
  assert.equal(s.status, 201, JSON.stringify(s.body));
  assert.equal(s.body.data.scope, 'service');
  assert.equal(s.body.data.author_first_name, 'agenta2');
  const e = await chefA.post(`/api/mails/${id}/comments`, { scope: 'entity', body: 'Note pour toute l’entité' });
  assert.equal(e.status, 201);
  assert.equal(e.body.data.service_id, null);
  const bodiesFor = async (c) => (await c.get(`/api/mails/${id}/comments`)).body.data.map((x) => x.body);
  assert.deepEqual(await bodiesFor(agentA1), ['Note réservée au service A', 'Note pour toute l’entité']);
  assert.deepEqual(await bodiesFor(secAC), ['Note réservée au service A', 'Note pour toute l’entité']);
  assert.deepEqual(await bodiesFor(agentB), ['Note pour toute l’entité']);
  const tl = (await agentB.get(`/api/mails/${id}`)).body.data;
  assert.deepEqual(tl.comments.map((x) => x.body), ['Note pour toute l’entité']);
  assert.ok(!JSON.stringify(tl.timeline).includes('Note réservée'), 'le commentaire de service ne sort pas dans l’historique d’un autre service');
  assert.equal((await agentB.post(`/api/mails/${id}/comments`, { scope: 'entity', body: 'Je suis en copie' })).status, 403, 'la copie lit, sans écrire');
});

test('commentaires : ni modification, ni suppression ; corps vide refusé ; portée de service impossible sans service traitant', async () => {
  const id = await assigned();
  const c = await agentA1.post(`/api/mails/${id}/comments`, { scope: 'service', body: 'Premier' });
  assert.equal((await agentA1.put(`/api/mails/${id}/comments/${c.body.data.id}`, { body: 'Modifié' })).status, 404);
  assert.equal((await agentA1.del(`/api/mails/${id}/comments/${c.body.data.id}`)).status, 404);
  assert.equal((await agentA1.post(`/api/mails/${id}/comments`, { scope: 'service', body: '   ' })).status, 400);
  assert.equal((await agentA1.post(`/api/mails/${id}/comments`, { scope: 'tous', body: 'x' })).status, 400);
  assert.equal((await agentA1.post(`/api/mails/${id}/comments`, { scope: 'service', body: 'x'.repeat(2001) })).status, 400);
  const free = await newMail();
  const noService = await secAC.post(`/api/mails/${free}/comments`, { scope: 'service', body: 'Sans service' });
  assert.equal(noService.status, 409);
  assert.equal(noService.body.code, 'SERVICE_INVALID');
  assert.equal((await secAC.post(`/api/mails/${free}/comments`, { scope: 'entity', body: 'Pour l’entité' })).status, 201);
});

test('commentaires : personne d’autre ne lit ni n’écrit ; un courrier annulé n’en reçoit plus', async () => {
  const id = await assigned();
  for (const c of [aud, admin, agentCPAS, agentB, secCPAS, gestCPAS]) {
    assert.equal((await c.get(`/api/mails/${id}/comments`)).status, 403);
    assert.equal((await c.post(`/api/mails/${id}/comments`, { scope: 'entity', body: 'Intrus' })).status, 403);
  }
  await secAC.del(`/api/mails/${id}`, { reason: 'Erreur' });
  assert.equal((await agentA1.post(`/api/mails/${id}/comments`, { scope: 'service', body: 'Trop tard' })).status, 409);
});

test('commentaires : l’agent nommé est notifié du commentaire d’un tiers, jamais de son propre ; le texte n’entre pas au journal d’audit', async () => {
  const id = await assigned();
  await agentA2.post(`/api/mails/${id}/comments`, { scope: 'service', body: 'Texte secret du commentaire' });
  await agentA1.post(`/api/mails/${id}/comments`, { scope: 'service', body: 'Mon propre commentaire' });
  const n = getDb().prepare("SELECT user_id FROM notifications WHERE mail_id = ? AND kind = 'commente'").all(id);
  assert.deepEqual(n.map((x) => x.user_id), [agentA1.userId]);
  const audit = getDb().prepare("SELECT details_json FROM audit_log WHERE action = 'mail.comment' AND entity_id = ?").all(id);
  assert.equal(audit.length, 2);
  assert.ok(!audit.some((a) => /secret|propre/.test(a.details_json)));
  const bell = (await agentA1.get('/api/notifications')).body.data.find((x) => x.mail_id === id && x.kind === 'commente');
  assert.ok(bell);
  assert.ok(!JSON.stringify(bell).includes('Texte secret'));
});

// ---------------------------------------------------------------- historique

test('historique : enregistrement, attribution, prise en charge, commentaire, clôture et réouverture, du plus récent au plus ancien', async () => {
  const id = await taken();
  await agentA1.post(`/api/mails/${id}/comments`, { scope: 'entity', body: 'Commentaire de suivi' });
  await agentA1.post(`/api/mails/${id}/close`, { close_reason_id: reasonAC(), note: 'Fini' });
  await secAC.post(`/api/mails/${id}/reopen`, { reason: 'À compléter' });
  const h = (await secAC.get(`/api/mails/${id}/history`)).body.data;
  const types = h.filter((x) => x.type !== 'consultation').map((x) => x.type);
  assert.deepEqual(types, ['reouverture', 'cloture', 'commentaire', 'prise_en_charge', 'attribution', 'enregistrement']);
  const close = h.find((x) => x.type === 'cloture');
  assert.equal(close.close_reason_label_fr, 'Répondu');
  assert.equal(close.note, 'Fini');
  assert.equal(h.find((x) => x.type === 'reouverture').note, 'À compléter');
  assert.equal(h.find((x) => x.type === 'attribution').agent_first_name, 'agenta1');
  const fiche = (await secAC.get(`/api/mails/${id}`)).body.data;
  assert.ok(fiche.timeline.length >= types.length);
});

test('historique : les consultations de la fiche ne se voient que du registre ; ni objet ni expéditeur dans les événements', async () => {
  const id = await taken();
  await agentA2.get(`/api/mails/${id}`);
  const forAgent = (await agentA1.get(`/api/mails/${id}/history`)).body.data;
  assert.ok(!forAgent.some((x) => x.type === 'consultation'));
  const forReg = (await secAC.get(`/api/mails/${id}/history`)).body.data;
  assert.ok(forReg.some((x) => x.type === 'consultation'));
  const text = JSON.stringify(forReg);
  assert.ok(!text.includes('Objet confidentiel fictif') && !text.includes('Exemple'));
  const audit = getDb().prepare("SELECT details_json FROM audit_log WHERE action IN ('mail.take', 'mail.close', 'mail.reopen') AND entity_id = ?").all(id);
  assert.ok(audit.length >= 1);
  assert.ok(!audit.some((a) => /Objet confidentiel|Exemple/.test(a.details_json)));
  for (const c of [aud, admin, agentB, agentCPAS]) assert.equal((await c.get(`/api/mails/${id}/history`)).status, 403);
});

// ---------------------------------------------------------------- registre

test('registre : le filtre de statut connaît « en traitement » et « clos » ; un statut inconnu est refusé', async () => {
  const id = await taken();
  const c = await taken();
  await agentA1.post(`/api/mails/${c}/close`, { close_reason_id: reasonAC() });
  const en = (await secAC.get('/api/mails?status=en_traitement&limit=200')).body.data.map((m) => m.id);
  const clos = (await secAC.get('/api/mails?status=clos&limit=200')).body.data.map((m) => m.id);
  assert.ok(en.includes(id) && !en.includes(c));
  assert.ok(clos.includes(c) && !clos.includes(id));
  assert.equal((await secAC.get('/api/mails?status=termine')).status, 400);
  const enregistre = (await secAC.get('/api/mails?status=enregistre&limit=200')).body.data.map((m) => m.id);
  assert.ok(!enregistre.includes(id) && !enregistre.includes(c));
});

// ---------------------------------------------------------------- cloisonnement

test('cloisonnement : un rôle à l’AC ne donne rien sur le CPAS ; les motifs et le traitement du CPAS restent au CPAS', async () => {
  const cp = await newMail(CPAS);
  await secCPAS.put(`/api/mails/${cp}/attribution`, { service_id: svcCPAS, agent_id: agentCPAS.userId });
  for (const c of [agentA1, chefA, secAC, gestAC]) {
    assert.equal((await c.post(`/api/mails/${cp}/take`, {})).status, 403);
    assert.equal((await c.post(`/api/mails/${cp}/comments`, { scope: 'entity', body: 'x' })).status, 403);
    assert.equal((await c.get(`/api/mails/${cp}/history`)).status, 403);
  }
  assert.equal((await agentCPAS.post(`/api/mails/${cp}/take`, {})).status, 200);
  const acReason = reasonAC();
  const wrong = await agentCPAS.post(`/api/mails/${cp}/close`, { close_reason_id: acReason });
  assert.equal(wrong.body.code, 'CLOSE_REASON_INVALID');
  const own = reasons.find((r) => r.entity_id === CPAS).id;
  assert.equal((await agentCPAS.post(`/api/mails/${cp}/close`, { close_reason_id: own })).status, 200);
  assert.equal((await gestAC.post(`/api/mails/${cp}/reopen`, { reason: 'Hors entité' })).status, 403);
  assert.equal((await secCPAS.post(`/api/mails/${cp}/reopen`, { reason: 'Dans l’entité' })).status, 200);
});

test('sans connexion : aucune route de traitement ne répond', async () => {
  const anon = client(srv.base);
  const id = await assigned();
  for (const [m, p] of [['post', 'take'], ['post', 'close'], ['post', 'reopen'], ['get', 'comments'], ['post', 'comments'], ['get', 'history']]) {
    assert.equal((await anon[m](`/api/mails/${id}/${p}`, m === 'post' ? {} : undefined)).status, 401, `${m} ${p}`);
  }
});

// ---------------------------------------------------------------- MCP

test('MCP : prendre en charge, commenter, clore, rouvrir et lire l’historique sous l’identité de la personne, canal mcp', async () => {
  const id = await assigned();
  const t = parse(await agentA1.mcp('tools/call', { name: 'take_mail', arguments: { id } }));
  assert.equal(t.data.status, 'en_traitement');
  const c = parse(await agentA1.mcp('tools/call', { name: 'add_mail_comment', arguments: { id, scope: 'service', body: 'Par MCP' } }));
  assert.equal(c.data.body, 'Par MCP');
  const list = parse(await agentA1.mcp('tools/call', { name: 'list_mail_comments', arguments: { id } }));
  assert.equal(list.data.length, 1);
  const cl = parse(await agentA1.mcp('tools/call', { name: 'close_mail', arguments: { id, close_reason_id: reasonAC() } }));
  assert.equal(cl.data.status, 'clos');
  assert.equal(parse(await agentA1.mcp('tools/call', { name: 'reopen_mail', arguments: { id, reason: 'Non autorisé' } })).code, 'FORBIDDEN');
  const ro = parse(await secAC.mcp('tools/call', { name: 'reopen_mail', arguments: { id, reason: 'Par MCP' } }));
  assert.equal(ro.data.status, 'en_traitement');
  const h = parse(await secAC.mcp('tools/call', { name: 'get_mail_history', arguments: { id } }));
  assert.ok(h.data.some((x) => x.type === 'reouverture'));
  const channels = getDb().prepare("SELECT action, channel FROM audit_log WHERE entity_id = ? AND action IN ('mail.take', 'mail.close', 'mail.reopen', 'mail.comment')").all(id);
  assert.equal(channels.length, 4);
  assert.ok(channels.every((x) => x.channel === 'mcp'));
  const rs = parse(await secAC.mcp('tools/call', { name: 'list_close_reasons', arguments: { entity_id: AC } }));
  assert.equal(rs.data.rows.length >= 4, true);
});

// ---------------------------------------------------------------- migration 010 sur une base existante

test('migration 010 : appliquée à une base de la 0.3.1 avec courriers et notifications, rien n’est perdu', async () => {
  const initSqlJs = require('sql.js');
  const { MIGRATIONS } = require('../src/database');
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  const run = (sql) => { for (const stmt of sql.split(';').map((s) => s.trim()).filter(Boolean)) db.run(stmt); };
  const upTo009 = MIGRATIONS.filter(([name]) => name < '010');
  assert.equal(upTo009.length, 9);
  for (const [, sql] of upTo009) run(sql);
  db.run("INSERT INTO entities (code, name_fr, name_nl) VALUES ('AC', 'Administration', 'Bestuur')");
  db.run("INSERT INTO entities (code, name_fr, name_nl) VALUES ('CPAS', 'Centre', 'Centrum')");
  db.run("INSERT INTO registers (entity_id, direction, prefix) VALUES (1, 'entree', 'AC')");
  db.run("INSERT INTO users (email, first_name, last_name) VALUES ('u@exemple.test', 'U', 'U')");
  db.run("INSERT INTO contacts (kind, name) VALUES ('personne', 'Exemple')");
  db.run("INSERT INTO mail_types (entity_id, label_fr) VALUES (1, 'Demande')");
  db.run("INSERT INTO mails (register_id, entity_id, year, seq, number, received_date, channel, sender_contact_id, subject, type_id) VALUES (1, 1, 2026, 1, 'AC-2026-000001', '2026-11-10', 'courrier', 1, 'Ancien courrier', 1)");
  db.run("INSERT INTO mails (register_id, entity_id, year, seq, number, received_date, channel, sender_contact_id, subject, type_id, status, cancel_reason) VALUES (1, 1, 2026, 2, 'AC-2026-000002', '2026-11-10', 'courrier', 1, 'Annulé', 1, 'annule', 'Erreur')");
  db.run("INSERT INTO notifications (user_id, mail_id, kind) VALUES (1, 1, 'attribue')");
  run(MIGRATIONS.find(([name]) => name === '010_traitement')[1]);
  const rows = db.exec('SELECT number, subject, status, processing, taken_by, closed_at, close_reason_id FROM mails ORDER BY id')[0].values;
  assert.deepEqual(rows[0], ['AC-2026-000001', 'Ancien courrier', 'enregistre', 'none', null, null, null]);
  assert.deepEqual(rows[1].slice(0, 4), ['AC-2026-000002', 'Annulé', 'annule', 'none']);
  assert.equal(db.exec('SELECT kind FROM notifications')[0].values[0][0], 'attribue', 'notification conservée');
  assert.equal(db.exec('SELECT COUNT(*) FROM close_reasons WHERE entity_id = 1')[0].values[0][0], 4);
  assert.equal(db.exec('SELECT COUNT(*) FROM close_reasons WHERE entity_id = 2')[0].values[0][0], 4);
  db.run("INSERT INTO notifications (user_id, mail_id, kind) VALUES (1, 1, 'commente')");
  db.run("INSERT INTO notifications (user_id, mail_id, kind) VALUES (1, 1, 'clos')");
  db.run("INSERT INTO notifications (user_id, mail_id, kind) VALUES (1, 1, 'rouvert')");
  assert.throws(() => db.run("INSERT INTO notifications (user_id, mail_id, kind) VALUES (1, 1, 'inconnu')"));
  assert.throws(() => db.run("UPDATE mails SET processing = 'termine' WHERE id = 1"));
  assert.throws(() => db.run("INSERT INTO mail_events (mail_id, kind) VALUES (1, 'inconnu')"));
  assert.throws(() => db.run("INSERT INTO mail_comments (mail_id, scope, body) VALUES (1, 'service', 'sans service')"));
  assert.throws(() => db.run("INSERT INTO mail_comments (mail_id, scope, service_id, body) VALUES (1, 'entity', 1, 'avec service')"));
  db.close();
});
