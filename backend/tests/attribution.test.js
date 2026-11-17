/**
 * Attribution du courrier entrant, version 0.3.0 (CDC CE-060 à CE-062, CE-120, CE-140, CR-002, CR-007, CR-008).
 * Service traitant, agent nommé, services en copie, renvoi au secrétariat, bannettes et compteurs, notifications,
 * visibilité des pièces, cloisonnement AC et CPAS, MCP. Données fictives fabriquées ici.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, client } = require('./helpers');
const { getDb } = require('../src/database');

const AC = 1;
const CPAS = 2;
const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
let srv;
let admin;
let secAC;
let secCPAS;
let agentA1;
let agentA2;
let chefA;
let agentB;
let agentCPAS;
let aud;
let svcA;
let svcB;
let svcCommun;
let svcCPAS;
let contactId;
let typeAC;
let typeCPAS;
const ids = {};
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

/** Envoi multipart d'une pièce vers un courrier. */
async function upload(c, mailId) {
  const fd = new FormData();
  fd.append('mail_id', String(mailId));
  fd.append('file', new Blob([PDF], { type: 'application/pdf' }), 'scan.pdf');
  const res = await fetch(`${srv.base}/api/pieces`, { method: 'POST', headers: { Cookie: c.cookie, 'X-CSRF-Token': c.csrf }, body: fd });
  return { status: res.status, body: await res.json() };
}

before(async () => {
  srv = await startServer();
  admin = client(srv.base);
  await admin.post('/api/install', { email: 'admin@exemple.test', first_name: 'A', last_name: 'A', password: 'mot-de-passe-solide-1' });
  svcA = await service('Service A fictif', [AC]);
  svcB = await service('Service B fictif', [AC]);
  svcCommun = await service('Service commun fictif', [AC, CPAS]);
  svcCPAS = await service('Service CPAS fictif', [CPAS]);
  secAC = await create([{ entity_id: AC, role: 'secretariat' }], 'secac');
  secCPAS = await create([{ entity_id: CPAS, role: 'secretariat' }], 'seccpas');
  agentA1 = await create([{ entity_id: AC, role: 'agent', service_ids: [svcA] }], 'agenta1');
  agentA2 = await create([{ entity_id: AC, role: 'agent', service_ids: [svcA] }], 'agenta2');
  chefA = await create([{ entity_id: AC, role: 'chef_service', service_ids: [svcA] }], 'chefa');
  agentB = await create([{ entity_id: AC, role: 'agent', service_ids: [svcB, svcCommun] }], 'agentb');
  agentCPAS = await create([{ entity_id: CPAS, role: 'agent', service_ids: [svcCPAS, svcCommun] }], 'agentcpas');
  aud = await create([{ entity_id: AC, role: 'auditeur' }], 'aud');
  typeAC = (await admin.post('/api/mail-types', { entity_id: AC, label_fr: 'Demande' })).body.data.id;
  typeCPAS = (await admin.post('/api/mail-types', { entity_id: CPAS, label_fr: 'Demande CPAS' })).body.data.id;
  contactId = (await secAC.post('/api/contacts', { kind: 'personne', name: 'Exemple' })).body.data.id;
});
after(() => srv.stop());

// ---------------------------------------------------------------- rattachement des personnes aux services

test('rattachement : services d’un agent par entité, rendus par l’API des comptes et par /me', async () => {
  const u = (await admin.get(`/api/users/${agentB.userId}`)).body.data;
  assert.deepEqual(u.entity_roles[0].service_ids.sort(), [svcB, svcCommun].sort());
  const me = (await agentB.get('/api/auth/me')).body.data;
  assert.deepEqual(me.entity_roles[0].service_ids.sort(), [svcB, svcCommun].sort());
});

test('rattachement : un service qui ne sert pas l’entité est refusé ; des services avec le rôle de secrétariat aussi', async () => {
  const a = await admin.post('/api/users', { email: 'x1@exemple.test', first_name: 'X', last_name: 'X', entity_roles: [{ entity_id: AC, role: 'agent', service_ids: [svcCPAS] }] });
  assert.equal(a.status, 409);
  assert.equal(a.body.code, 'SERVICE_INVALID');
  const b = await admin.post('/api/users', { email: 'x2@exemple.test', first_name: 'X', last_name: 'X', entity_roles: [{ entity_id: AC, role: 'secretariat', service_ids: [svcA] }] });
  assert.equal(b.status, 400);
  assert.equal(getDb().prepare('SELECT COUNT(*) AS n FROM users WHERE email IN (?, ?)').get('x1@exemple.test', 'x2@exemple.test').n, 0, 'aucun compte créé à moitié');
});

test('rattachement : une mise à jour des rôles sans service_ids garde les services ; un autre rôle les retire', async () => {
  const before = (await admin.get(`/api/users/${agentA2.userId}`)).body.data.entity_roles[0].service_ids;
  assert.deepEqual(before, [svcA]);
  const same = await admin.put(`/api/users/${agentA2.userId}`, { entity_roles: [{ entity_id: AC, role: 'agent' }] });
  assert.deepEqual(same.body.data.entity_roles[0].service_ids, [svcA]);
  const tmp = await create([{ entity_id: AC, role: 'agent', service_ids: [svcA] }], 'tmp');
  const out = await admin.put(`/api/users/${tmp.userId}`, { entity_roles: [{ entity_id: AC, role: 'secretariat' }] });
  assert.deepEqual(out.body.data.entity_roles[0].service_ids, []);
  assert.equal(getDb().prepare('SELECT COUNT(*) AS n FROM user_services WHERE user_id = ?').get(tmp.userId).n, 0);
});

// ---------------------------------------------------------------- visibilité avant attribution

test('un courrier non attribué n’est vu ni des agents, ni de l’auditeur, ni de l’administrateur ; le secrétariat le voit', async () => {
  ids.m1 = await newMail();
  for (const c of [agentA1, chefA, agentB, agentCPAS, aud, admin]) {
    assert.equal((await c.get(`/api/mails/${ids.m1}`)).status, 403);
    assert.equal((await c.get(`/api/mails/${ids.m1}/`)).status, 403);
  }
  const got = (await secAC.get(`/api/mails/${ids.m1}`)).body.data;
  assert.equal(got.service_id, null);
  assert.equal(got.rights.attribute, true);
  assert.deepEqual(got.copies, []);
});

test('bannette « À attribuer » : le secrétariat de l’entité seulement, avec son compteur', async () => {
  const sec = (await secAC.get('/api/mails?box=a_attribuer&entity_id=1')).body.data;
  assert.ok(sec.some((m) => m.id === ids.m1));
  assert.equal((await agentA1.get('/api/mails?box=a_attribuer')).body.data.length, 0);
  assert.equal((await agentA1.get(`/api/mails?box=a_attribuer&entity_id=${AC}`)).status, 403);
  assert.equal((await secAC.get(`/api/mails?box=a_attribuer&entity_id=${CPAS}`)).status, 403);
  const counts = (await secAC.get('/api/mails/counts')).body.data;
  assert.ok(counts.a_attribuer >= 1);
  assert.equal(counts.mon_service, 0);
  assert.equal((await secAC.get(`/api/mails/counts?entity_id=${CPAS}`)).status, 403);
});

// ---------------------------------------------------------------- attribution

test('attribution : seul le secrétariat ou le gestionnaire de l’entité attribue', async () => {
  const body = { service_id: svcA };
  for (const c of [agentA1, chefA, agentB, secCPAS, aud, admin]) {
    assert.equal((await c.put(`/api/mails/${ids.m1}/attribution`, body)).status, 403);
  }
  assert.equal(getDb().prepare('SELECT service_id FROM mails WHERE id = ?').get(ids.m1).service_id, null);
});

test('attribution : service d’une autre entité, inactif ou inconnu refusé ; copie identique au traitant refusée', async () => {
  for (const sid of [svcCPAS, 99999]) {
    const r = await secAC.put(`/api/mails/${ids.m1}/attribution`, { service_id: sid });
    assert.equal(r.status, 409);
    assert.equal(r.body.code, 'SERVICE_INVALID');
  }
  const tmp = await service('Service inactif fictif', [AC]);
  await admin.del(`/api/services/${tmp}`, { reason: 'Essai' });
  assert.equal((await secAC.put(`/api/mails/${ids.m1}/attribution`, { service_id: tmp })).body.code, 'SERVICE_INVALID');
  assert.equal((await secAC.put(`/api/mails/${ids.m1}/attribution`, { service_id: svcA, copy_service_ids: [svcA] })).body.code, 'SERVICE_INVALID');
  assert.equal((await secAC.put(`/api/mails/${ids.m1}/attribution`, { service_id: svcA, copy_service_ids: [svcCPAS] })).body.code, 'SERVICE_INVALID');
  assert.equal(getDb().prepare('SELECT service_id FROM mails WHERE id = ?').get(ids.m1).service_id, null, 'rien n’est écrit sur un refus');
});

test('attribution au service A : visible de ses membres seulement, en lecture seule', async () => {
  const r = await secAC.put(`/api/mails/${ids.m1}/attribution`, { service_id: svcA });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.data.service_id, svcA);
  assert.equal(r.body.data.attributions[0].kind, 'attribution');
  for (const c of [agentA1, agentA2, chefA]) {
    const g = await c.get(`/api/mails/${ids.m1}`);
    assert.equal(g.status, 200);
    assert.equal(g.body.data.subject, 'Objet confidentiel fictif');
    assert.equal(g.body.data.rights.edit, false);
    assert.equal(g.body.data.rights.attribute, false);
  }
  for (const c of [agentB, agentCPAS, aud, admin]) assert.equal((await c.get(`/api/mails/${ids.m1}`)).status, 403);
});

test('un agent ne modifie, n’annule ni n’attribue : 403 sur chaque écriture ; rien ne change', async () => {
  for (const c of [agentA1, chefA]) {
    assert.equal((await c.put(`/api/mails/${ids.m1}`, { subject: 'Autre' })).status, 403);
    assert.equal((await c.del(`/api/mails/${ids.m1}`, { reason: 'x' })).status, 403);
    assert.equal((await c.post('/api/mails', { entity_id: AC, channel: 'courrier', sender_contact_id: contactId, subject: 'x', type_id: typeAC })).status, 403);
    assert.equal((await upload(c, ids.m1)).status, 403);
  }
  const row = getDb().prepare('SELECT subject, status FROM mails WHERE id = ?').get(ids.m1);
  assert.deepEqual(row, { subject: 'Objet confidentiel fictif', status: 'enregistre' });
});

test('bannettes : « Mon service » pour les membres de A, « Moi » vide, compteurs exacts', async () => {
  const mon = (await agentA1.get('/api/mails?box=mon_service')).body.data;
  assert.ok(mon.some((m) => m.id === ids.m1));
  assert.equal(mon.every((m) => m.entity_code === 'AC'), true);
  assert.equal((await agentA1.get('/api/mails?box=moi')).body.data.length, 0);
  assert.equal((await agentB.get('/api/mails?box=mon_service')).body.data.some((m) => m.id === ids.m1), false);
  const c = (await agentA1.get('/api/mails/counts')).body.data;
  assert.equal(c.mon_service, 1);
  assert.equal(c.moi, 0);
  assert.equal(c.a_attribuer, 0);
  assert.equal(c.a_enregistrer, 0);
  assert.equal((await secAC.get('/api/mails?box=a_attribuer')).body.data.some((m) => m.id === ids.m1), false, 'plus à attribuer');
});

test('pièces : lisibles des membres du service traitant et du secrétariat, fermées aux autres ; la file reste au registre', async () => {
  const up = await upload(secAC, ids.m1);
  assert.equal(up.status, 201, JSON.stringify(up.body));
  const pid = up.body.data.id;
  const raw = (c) => fetch(`${srv.base}/api/pieces/${pid}/contenu`, { headers: { Cookie: c.cookie } });
  for (const c of [agentA1, chefA, secAC]) assert.equal((await raw(c)).status, 200);
  for (const c of [agentB, agentCPAS, aud, admin]) assert.equal((await raw(c)).status, 403);
  assert.equal((await agentA1.get(`/api/pieces?mail_id=${ids.m1}`)).body.data.length, 1);
  assert.equal((await agentB.get(`/api/pieces?mail_id=${ids.m1}`)).status, 403);
  assert.equal((await agentA1.get(`/api/pieces/${pid}`)).status, 200);
  assert.equal((await agentA1.put(`/api/pieces/${pid}`, { position: 2 })).status, 403);
  assert.equal((await agentA1.get('/api/pieces')).body.data.length, 0);
  // La lecture par l'agent s'inscrit au journal des consultations, lisible de l'auditeur de l'entité.
  const j = (await aud.get('/api/consultations?limit=200')).body.data;
  assert.ok(j.some((k) => k.action === 'piece' && k.user_id === agentA1.userId));
  assert.ok(j.some((k) => k.action === 'fiche' && k.user_id === agentA1.userId));
  ids.piece = pid;
});

test('un agent ne lit pas une pièce de la file « À enregistrer »', async () => {
  const up = await (async () => {
    const fd = new FormData();
    fd.append('entity_id', String(AC));
    fd.append('file', new Blob([PDF], { type: 'application/pdf' }), 'file.pdf');
    const res = await fetch(`${srv.base}/api/pieces`, { method: 'POST', headers: { Cookie: secAC.cookie, 'X-CSRF-Token': secAC.csrf }, body: fd });
    return res.json();
  })();
  const pid = up.data.id;
  assert.equal((await agentA1.get(`/api/pieces/${pid}`)).status, 403);
  assert.equal((await fetch(`${srv.base}/api/pieces/${pid}/contenu`, { headers: { Cookie: agentA1.cookie } })).status, 403);
  assert.equal((await secAC.get('/api/mails/counts')).body.data.a_enregistrer >= 1, true);
  await secAC.del(`/api/pieces/${pid}`, { reason: 'Essai' });
});

// ---------------------------------------------------------------- agent nommé

test('agent nommé : seulement un agent ou responsable actif du service traitant', async () => {
  const base = { service_id: svcA };
  for (const bad of [agentB.userId, agentCPAS.userId, secAC.userId, aud.userId, 99999]) {
    const r = await secAC.put(`/api/mails/${ids.m1}/attribution`, { ...base, agent_id: bad });
    assert.equal(r.status, 409, `agent ${bad}`);
    assert.equal(r.body.code, 'AGENT_INVALID');
  }
  const inactive = await create([{ entity_id: AC, role: 'agent', service_ids: [svcA] }], 'inactif');
  await admin.del(`/api/users/${inactive.userId}`);
  assert.equal((await secAC.put(`/api/mails/${ids.m1}/attribution`, { ...base, agent_id: inactive.userId })).body.code, 'AGENT_INVALID');
  assert.equal(getDb().prepare('SELECT agent_id FROM mails WHERE id = ?').get(ids.m1).agent_id, null);
});

test('agent nommé : « Moi » pour lui, « Mon service » pour tous ; notification pour lui seul', async () => {
  const r = await secAC.put(`/api/mails/${ids.m1}/attribution`, { service_id: svcA, agent_id: agentA1.userId });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.agent_id, agentA1.userId);
  assert.equal(r.body.data.attributions[0].kind, 'agent');
  assert.equal((await agentA1.get('/api/mails?box=moi')).body.data.length, 1);
  assert.equal((await agentA2.get('/api/mails?box=moi')).body.data.length, 0);
  assert.equal((await agentA2.get('/api/mails?box=mon_service')).body.data.some((m) => m.id === ids.m1), true);
  // Le premier envoi au service (sans agent) a déjà prévenu tous ses membres ; la nomination ne prévient que la personne nommée.
  const n1 = (await agentA1.get('/api/notifications?unread=true')).body;
  assert.deepEqual(n1.data.map((n) => n.kind).sort(), ['attribue', 'service']);
  assert.equal(n1.data.find((n) => n.kind === 'attribue').mail_number, r.body.data.number);
  assert.equal(n1.meta.unread, 2);
  assert.doesNotMatch(JSON.stringify(n1), /Objet confidentiel|Exemple/, 'la cloche ne porte ni objet ni expéditeur');
  assert.deepEqual((await agentA2.get('/api/notifications')).body.data.filter((n) => n.mail_id === ids.m1).map((n) => n.kind), ['service']);
  assert.equal((await secAC.get('/api/notifications')).body.data.length, 0, 'pas de notification pour l’auteur');
});

test('responsable de service : change l’agent dans son service ; l’agent simple et le responsable d’un autre service ne le peuvent pas', async () => {
  assert.equal((await agentA2.put(`/api/mails/${ids.m1}/agent`, { agent_id: agentA2.userId })).status, 403);
  assert.equal((await agentB.put(`/api/mails/${ids.m1}/agent`, { agent_id: agentA2.userId })).status, 403);
  assert.equal((await aud.put(`/api/mails/${ids.m1}/agent`, { agent_id: agentA2.userId })).status, 403);
  const bad = await chefA.put(`/api/mails/${ids.m1}/agent`, { agent_id: agentB.userId });
  assert.equal(bad.body.code, 'AGENT_INVALID');
  const r = await chefA.put(`/api/mails/${ids.m1}/agent`, { agent_id: agentA2.userId });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.data.agent_id, agentA2.userId);
  assert.equal(r.body.data.attributions[0].from_agent_id, agentA1.userId);
  assert.equal((await agentA1.get('/api/mails?box=moi')).body.data.length, 0);
  assert.equal((await agentA2.get('/api/mails?box=moi')).body.data.length, 1);
  assert.equal((await agentA2.get('/api/notifications?unread=true')).body.data.filter((n) => n.kind === 'attribue').length, 1);
  // Le secrétariat peut aussi retirer la nomination.
  const off = await secAC.put(`/api/mails/${ids.m1}/agent`, { agent_id: null });
  assert.equal(off.body.data.agent_id, null);
  await chefA.put(`/api/mails/${ids.m1}/agent`, { agent_id: agentA1.userId });
});

// ---------------------------------------------------------------- réattribution et renvoi

test('réattribution à un autre service : motif obligatoire, agent effacé, accès déplacé, historique complet', async () => {
  const noReason = await secAC.put(`/api/mails/${ids.m1}/attribution`, { service_id: svcB });
  assert.equal(noReason.status, 400);
  assert.equal(noReason.body.code, 'REASON_REQUIRED');
  assert.equal(getDb().prepare('SELECT service_id FROM mails WHERE id = ?').get(ids.m1).service_id, svcA);
  const r = await secAC.put(`/api/mails/${ids.m1}/attribution`, { service_id: svcB, reason: 'Compétence du service B' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.data.service_id, svcB);
  assert.equal(r.body.data.agent_id, null);
  assert.equal(r.body.data.attributions[0].kind, 'reattribution');
  assert.equal(r.body.data.attributions[0].from_service_id, svcA);
  assert.equal(r.body.data.attributions[0].reason, 'Compétence du service B');
  assert.equal((await agentA1.get(`/api/mails/${ids.m1}`)).status, 403);
  assert.equal((await agentB.get(`/api/mails/${ids.m1}`)).status, 200);
  assert.equal((await agentA1.get('/api/mails?box=mon_service')).body.data.length, 0);
  // Les membres de B reçoivent une notification de service ; l'ancien agent n'a plus accès à la pièce.
  assert.equal((await agentB.get('/api/notifications')).body.data.some((n) => n.kind === 'service' && n.mail_id === ids.m1), true);
  assert.equal((await fetch(`${srv.base}/api/pieces/${ids.piece}/contenu`, { headers: { Cookie: agentA1.cookie } })).status, 403);
  assert.equal((await agentB.get(`/api/pieces?mail_id=${ids.m1}`)).body.data.length, 1);
  // Historique : l'attribution, quatre changements d'agent (nommé, changé par le responsable, retiré, renommé), la réattribution.
  assert.deepEqual(r.body.data.attributions.map((h) => h.kind), ['reattribution', 'agent', 'agent', 'agent', 'agent', 'attribution']);
});

test('renvoi au secrétariat : motif obligatoire, membre du service traitant seulement ; le courrier revient dans « À attribuer »', async () => {
  for (const c of [agentA1, chefA, agentCPAS, aud, admin, secCPAS]) assert.equal((await c.post(`/api/mails/${ids.m1}/return`, { reason: 'Pas pour nous' })).status, 403);
  assert.equal((await agentB.post(`/api/mails/${ids.m1}/return`, {})).status, 400);
  assert.equal((await agentB.post(`/api/mails/${ids.m1}/return`, { reason: '   ' })).status, 400);
  assert.equal(getDb().prepare('SELECT service_id FROM mails WHERE id = ?').get(ids.m1).service_id, svcB);
  const r = await agentB.post(`/api/mails/${ids.m1}/return`, { reason: 'Ce courrier concerne les finances' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual(r.body.data, { id: ids.m1, number: r.body.data.number, returned: true }, 'la personne qui renvoie ne lit plus le courrier');
  const row = getDb().prepare('SELECT service_id, agent_id, return_reason, returned_at FROM mails WHERE id = ?').get(ids.m1);
  assert.equal(row.service_id, null);
  assert.equal(row.agent_id, null);
  assert.equal(row.return_reason, 'Ce courrier concerne les finances');
  assert.ok(row.returned_at);
  assert.equal((await agentB.get(`/api/mails/${ids.m1}`)).status, 403);
  assert.equal((await agentB.get('/api/mails?box=mon_service')).body.data.length, 0);
  const a = (await secAC.get('/api/mails?box=a_attribuer')).body.data.find((m) => m.id === ids.m1);
  assert.equal(a.return_reason, 'Ce courrier concerne les finances');
  const notes = (await secAC.get('/api/notifications?unread=true')).body.data;
  assert.equal(notes.some((n) => n.kind === 'renvoye' && n.mail_id === ids.m1), true);
  assert.equal((await agentB.post(`/api/mails/${ids.m1}/return`, { reason: 'Encore' })).status, 403, 'plus de service traitant : plus de renvoi');
});

test('nouvelle attribution après un renvoi : sans motif, le renvoi est effacé de la fiche et reste à l’historique', async () => {
  const r = await secAC.put(`/api/mails/${ids.m1}/attribution`, { service_id: svcA, agent_id: agentA2.userId });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.data.return_reason, null);
  const kinds = r.body.data.attributions.map((h) => h.kind);
  assert.deepEqual(kinds.slice(0, 2), ['attribution', 'renvoi']);
  const renvoi = r.body.data.attributions.find((h) => h.kind === 'renvoi');
  assert.equal(renvoi.reason, 'Ce courrier concerne les finances');
  assert.equal(renvoi.from_service_id, svcB);
});

// ---------------------------------------------------------------- services en copie

test('services en copie : lecture seule pour leurs membres, retirés = accès retiré ; « En copie » et notifications', async () => {
  const r = await secAC.put(`/api/mails/${ids.m1}/attribution`, { service_id: svcA, copy_service_ids: [svcB] });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual(r.body.data.copies.map((c) => c.service_id), [svcB]);
  assert.equal(r.body.data.attributions[0].kind, 'copies');
  assert.equal(r.body.data.agent_id, agentA2.userId, 'agent conservé quand seul le service en copie change');
  const g = await agentB.get(`/api/mails/${ids.m1}`);
  assert.equal(g.status, 200);
  assert.equal(g.body.data.rights.edit, false);
  assert.equal(g.body.data.rights.return_to_secretariat, false, 'une copie ne se renvoie pas');
  assert.equal((await agentB.post(`/api/mails/${ids.m1}/return`, { reason: 'x' })).status, 403);
  assert.equal((await agentB.get('/api/mails?box=en_copie')).body.data.length, 1);
  assert.equal((await agentB.get('/api/mails?box=mon_service')).body.data.some((m) => m.id === ids.m1), false);
  assert.equal((await agentB.get('/api/notifications')).body.data.some((n) => n.kind === 'copie' && n.mail_id === ids.m1), true);
  assert.equal((await agentB.get('/api/mails/counts')).body.data.en_copie, 1);
  const off = await secAC.put(`/api/mails/${ids.m1}/attribution`, { service_id: svcA, copy_service_ids: [] });
  assert.deepEqual(off.body.data.copies, []);
  assert.equal((await agentB.get(`/api/mails/${ids.m1}`)).status, 403);
  assert.equal((await agentB.get('/api/mails?box=en_copie')).body.data.length, 0);
});

test('réattribuer au service qui était en copie : il quitte les copies ; une liste de copies qui le contient reste refusée', async () => {
  const id = await newMail();
  await secAC.put(`/api/mails/${id}/attribution`, { service_id: svcA, copy_service_ids: [svcB] });
  const explicit = await secAC.put(`/api/mails/${id}/attribution`, { service_id: svcB, reason: 'Essai', copy_service_ids: [svcB] });
  assert.equal(explicit.status, 409);
  assert.equal(explicit.body.code, 'SERVICE_INVALID');
  assert.equal(getDb().prepare('SELECT service_id FROM mails WHERE id = ?').get(id).service_id, svcA, 'rien n’est écrit sur un refus');
  const r = await secAC.put(`/api/mails/${id}/attribution`, { service_id: svcB, reason: 'Le service B est compétent' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.data.service_id, svcB);
  assert.deepEqual(r.body.data.copies, []);
  assert.equal((await agentB.get('/api/mails?box=en_copie')).body.data.some((m) => m.id === id), false);
  assert.equal((await agentB.get('/api/mails?box=mon_service')).body.data.some((m) => m.id === id), true);
  // Après un renvoi, la réattribution au service qui l'avait en copie se fait sans motif.
  await agentB.post(`/api/mails/${id}/return`, { reason: 'Pas pour nous' });
  await secAC.put(`/api/mails/${id}/attribution`, { service_id: svcA, copy_service_ids: [svcB] });
  await agentA1.post(`/api/mails/${id}/return`, { reason: 'Finalement pour B' });
  const back = await secAC.put(`/api/mails/${id}/attribution`, { service_id: svcB });
  assert.equal(back.status, 200, JSON.stringify(back.body));
  assert.deepEqual(back.body.data.copies, []);
});

test('attribution identique : rien ne change, aucun événement ajouté', async () => {
  const before = getDb().prepare('SELECT COUNT(*) AS n FROM mail_attributions WHERE mail_id = ?').get(ids.m1).n;
  const r = await secAC.put(`/api/mails/${ids.m1}/attribution`, { service_id: svcA });
  assert.equal(r.status, 200);
  assert.equal(getDb().prepare('SELECT COUNT(*) AS n FROM mail_attributions WHERE mail_id = ?').get(ids.m1).n, before);
});

// ---------------------------------------------------------------- cloisonnement AC et CPAS

test('service commun : attribuable des deux entités ; un agent de l’AC ne voit jamais le courrier du CPAS', async () => {
  const cp = await newMail(CPAS);
  assert.equal((await secAC.put(`/api/mails/${cp}/attribution`, { service_id: svcCommun })).status, 403);
  assert.equal((await secCPAS.put(`/api/mails/${cp}/attribution`, { service_id: svcA })).body.code, 'SERVICE_INVALID');
  const ok = await secCPAS.put(`/api/mails/${cp}/attribution`, { service_id: svcCommun });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  // agentB est rattaché au service commun à l'AC : son rôle ne vaut que pour l'AC.
  assert.equal((await agentB.get(`/api/mails/${cp}`)).status, 403);
  assert.equal((await agentB.get('/api/mails?box=mon_service')).body.data.some((m) => m.id === cp), false);
  assert.equal((await agentCPAS.get(`/api/mails/${cp}`)).status, 200);
  assert.equal((await agentCPAS.get(`/api/mails/${ids.m1}`)).status, 403);
  const ac = await newMail(AC);
  await secAC.put(`/api/mails/${ac}/attribution`, { service_id: svcCommun });
  assert.equal((await agentB.get(`/api/mails/${ac}`)).status, 200);
  assert.equal((await agentCPAS.get(`/api/mails/${ac}`)).status, 403);
  assert.equal((await agentCPAS.put(`/api/mails/${ac}/agent`, { agent_id: agentCPAS.userId })).status, 403);
  assert.equal((await agentCPAS.post(`/api/mails/${ac}/return`, { reason: 'x' })).status, 403);
  assert.equal((await agentCPAS.get(`/api/mails/counts?entity_id=${AC}`)).status, 403);
});

test('membres d’un service : administrateur, registre d’une entité du service ou membre ; pas les autres', async () => {
  const m = await secAC.get(`/api/services/${svcA}/members?entity_id=${AC}`);
  assert.equal(m.status, 200);
  assert.deepEqual(m.body.data.map((x) => x.id).sort(), [agentA1.userId, agentA2.userId, chefA.userId].sort());
  assert.ok(m.body.data.every((x) => !('email' in x)));
  assert.equal((await admin.get(`/api/services/${svcA}/members`)).status, 200);
  assert.equal((await agentA1.get(`/api/services/${svcA}/members`)).status, 200);
  assert.equal((await agentB.get(`/api/services/${svcA}/members`)).status, 403);
  assert.equal((await secCPAS.get(`/api/services/${svcA}/members`)).status, 403);
  assert.equal((await secCPAS.get(`/api/services/${svcCommun}/members`)).status, 200);
  assert.equal((await secAC.get('/api/services/99999/members')).status, 404);
});

// ---------------------------------------------------------------- courrier annulé

test('un courrier annulé ne s’attribue plus, ne se renvoie plus et sort des bannettes', async () => {
  const id = await newMail();
  await secAC.put(`/api/mails/${id}/attribution`, { service_id: svcA });
  assert.equal((await agentA1.get('/api/mails?box=mon_service')).body.data.some((m) => m.id === id), true);
  assert.equal((await secAC.del(`/api/mails/${id}`, { reason: 'Doublon fictif' })).status, 200);
  assert.equal((await secAC.put(`/api/mails/${id}/attribution`, { service_id: svcB })).status, 409);
  assert.equal((await agentA1.post(`/api/mails/${id}/return`, { reason: 'x' })).status, 409);
  assert.equal((await chefA.put(`/api/mails/${id}/agent`, { agent_id: agentA1.userId })).status, 409);
  assert.equal((await agentA1.get('/api/mails?box=mon_service')).body.data.some((m) => m.id === id), false);
  const g = (await agentA1.get(`/api/mails/${id}`)).body.data;
  assert.equal(g.status, 'annule');
  assert.equal(g.rights.return_to_secretariat, false);
});

test('un courrier annulé sort aussi de « Moi », « En copie » et « À attribuer »', async () => {
  const id = await newMail();
  await secAC.put(`/api/mails/${id}/attribution`, { service_id: svcA, agent_id: agentA1.userId, copy_service_ids: [svcB] });
  assert.equal((await agentA1.get('/api/mails?box=moi')).body.data.some((m) => m.id === id), true);
  assert.equal((await agentB.get('/api/mails?box=en_copie')).body.data.some((m) => m.id === id), true);
  const loose = await newMail();
  assert.equal((await secAC.get('/api/mails?box=a_attribuer')).body.data.some((m) => m.id === loose), true);
  await secAC.del(`/api/mails/${id}`, { reason: 'Doublon fictif' });
  await secAC.del(`/api/mails/${loose}`, { reason: 'Doublon fictif' });
  assert.equal((await agentA1.get('/api/mails?box=moi')).body.data.some((m) => m.id === id), false);
  assert.equal((await agentB.get('/api/mails?box=en_copie')).body.data.some((m) => m.id === id), false);
  assert.equal((await secAC.get('/api/mails?box=a_attribuer')).body.data.some((m) => m.id === loose), false);
  const c = (await agentA1.get('/api/mails/counts')).body.data;
  assert.equal((await agentA1.get('/api/mails?box=moi&limit=200')).body.data.length, c.moi, 'le compteur suit la liste');
});

test('un rôle qui n’est plus celui d’un agent retire l’accès, même nommé ou même avec un rattachement resté en base', async () => {
  const id = await newMail();
  const person = await create([{ entity_id: AC, role: 'agent', service_ids: [svcA] }], 'ancienagent');
  await secAC.put(`/api/mails/${id}/attribution`, { service_id: svcA, agent_id: person.userId });
  assert.equal((await person.get(`/api/mails/${id}`)).status, 200);
  // L'administrateur le passe auditeur : il perd le service, et la nomination ne lui garde pas la lecture.
  await admin.put(`/api/users/${person.userId}`, { entity_roles: [{ entity_id: AC, role: 'auditeur' }] });
  assert.equal((await person.get(`/api/mails/${id}`)).status, 403);
  assert.equal((await person.get('/api/mails?box=moi')).body.data.length, 0);
  assert.equal((await fetch(`${srv.base}/api/pieces?mail_id=${id}`, { headers: { Cookie: person.cookie } })).status, 403);
  // Un rattachement resté en base (reste d'une ancienne donnée) ne donne rien sans le rôle d'agent.
  getDb().prepare('INSERT INTO user_services (user_id, entity_id, service_id) VALUES (?, ?, ?)').run(aud.userId, AC, svcA);
  assert.equal((await aud.get(`/api/mails/${id}`)).status, 403);
  assert.equal((await aud.get('/api/mails?box=mon_service')).body.data.length, 0);
  getDb().prepare('DELETE FROM user_services WHERE user_id = ?').run(aud.userId);
});

// ---------------------------------------------------------------- notifications

test('notifications : lecture, marquage des siennes seulement, courrier devenu invisible écarté', async () => {
  const mine = (await agentA1.get('/api/notifications')).body;
  assert.ok(mine.meta.unread >= 1);
  const other = (await agentA2.get('/api/notifications')).body.data[0];
  const r = await agentA1.post('/api/notifications/read', { ids: [other.id] });
  assert.equal(r.body.data.updated, 0, 'une notification d’autrui ne se marque pas');
  const all = await agentA1.post('/api/notifications/read', {});
  assert.ok(all.body.data.updated >= 1);
  assert.equal((await agentA1.get('/api/notifications?unread=true')).body.meta.unread, 0);
  // agentA1 a reçu une notification pour m1 quand il était nommé ; m1 est maintenant au service A avec agentA2 : il le voit encore.
  const before = (await agentA1.get('/api/notifications')).body.data.length;
  await secAC.put(`/api/mails/${ids.m1}/attribution`, { service_id: svcB, reason: 'Essai de visibilité' });
  const after = (await agentA1.get('/api/notifications')).body.data.length;
  assert.ok(after < before, 'la notification d’un courrier devenu invisible disparaît');
  await secAC.put(`/api/mails/${ids.m1}/attribution`, { service_id: svcA, reason: 'Retour' });
  assert.equal((await client(srv.base).get('/api/notifications')).status, 401);
});

// ---------------------------------------------------------------- journal d'audit

test('audit : chaque attribution, nomination et renvoi est journalisé sans objet ni expéditeur', async () => {
  const rows = getDb().prepare("SELECT action, details_json FROM audit_log WHERE action IN ('mail.attribute', 'mail.agent', 'mail.return')").all();
  const actions = new Set(rows.map((r) => r.action));
  assert.deepEqual([...actions].sort(), ['mail.agent', 'mail.attribute', 'mail.return']);
  for (const r of rows) assert.doesNotMatch(r.details_json, /Objet confidentiel|Exemple/);
});

// ---------------------------------------------------------------- MCP

test('MCP : mêmes droits que l’API pour attribuer, nommer, renvoyer, compter et notifier', async () => {
  const id = await newMail();
  const attr = parse(await secAC.mcp('tools/call', { name: 'attribute_mail', arguments: { id, service_id: svcA, copy_service_ids: [svcB] } }));
  assert.equal(attr.data.service_id, svcA);
  assert.equal(getDb().prepare("SELECT channel FROM audit_log WHERE action = 'mail.attribute' AND entity_id = ?").get(id).channel, 'mcp');
  const forbidden = parse(await agentA1.mcp('tools/call', { name: 'attribute_mail', arguments: { id, service_id: svcB } }));
  assert.equal(forbidden.code, 'FORBIDDEN');
  const members = parse(await chefA.mcp('tools/call', { name: 'list_service_members', arguments: { id: svcA } }));
  assert.equal(members.data.length, 3);
  const named = parse(await chefA.mcp('tools/call', { name: 'set_mail_agent', arguments: { id, agent_id: agentA2.userId } }));
  assert.equal(named.data.agent_id, agentA2.userId);
  const counts = parse(await agentA2.mcp('tools/call', { name: 'get_mail_counts', arguments: {} }));
  assert.ok(counts.data.moi >= 1);
  const list = parse(await agentA2.mcp('tools/call', { name: 'list_mails', arguments: { box: 'moi' } }));
  assert.ok(list.data.rows.some((m) => m.id === id));
  const got = parse(await agentB.mcp('tools/call', { name: 'get_mail', arguments: { id } }));
  assert.equal(got.data.rights.edit, false);
  assert.equal(parse(await agentCPAS.mcp('tools/call', { name: 'get_mail', arguments: { id } })).code, 'FORBIDDEN');
  const bad = parse(await agentA2.mcp('tools/call', { name: 'return_mail', arguments: { id } }));
  assert.equal(bad.code, 'VALIDATION');
  const back = parse(await agentA2.mcp('tools/call', { name: 'return_mail', arguments: { id, reason: 'Pas pour le service A' } }));
  assert.equal(back.data.returned, true);
  const notes = parse(await secAC.mcp('tools/call', { name: 'list_notifications', arguments: { unread: true } }));
  assert.ok(notes.data.rows.some((n) => n.mail_id === id && n.kind === 'renvoye'));
  const read = parse(await secAC.mcp('tools/call', { name: 'mark_notifications_read', arguments: {} }));
  assert.ok(read.data.updated >= 1);
});

test('un compte sans aucun rôle ne voit ni bannette ni courrier, par l’API comme par MCP', async () => {
  const nobody = await create([], 'personne');
  for (const box of ['a_attribuer', 'mon_service', 'moi', 'en_copie']) {
    const r = await nobody.get(`/api/mails?box=${box}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.data.length, 0);
  }
  assert.deepEqual((await nobody.get('/api/mails/counts')).body.data, { a_enregistrer: 0, a_attribuer: 0, mon_service: 0, moi: 0, en_copie: 0 });
  assert.equal(parse(await nobody.mcp('tools/call', { name: 'get_mail', arguments: { id: ids.m1 } })).code, 'FORBIDDEN');
});

// ---------------------------------------------------------------- migration 009 sur une base existante

test('migration 009 : appliquée à une base de la 0.2.9 avec des courriers, rien n’est perdu', async () => {
  const initSqlJs = require('sql.js');
  const { MIGRATIONS } = require('../src/database');
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  const run = (sql) => { for (const stmt of sql.split(';').map((s) => s.trim()).filter(Boolean)) db.run(stmt); };
  const upTo008 = MIGRATIONS.filter(([name]) => name < '009');
  assert.equal(upTo008.length, 8);
  for (const [, sql] of upTo008) run(sql);
  db.run("INSERT INTO entities (code, name_fr, name_nl) VALUES ('AC', 'Administration', 'Bestuur')");
  db.run("INSERT INTO registers (entity_id, direction, prefix) VALUES (1, 'entree', 'AC')");
  db.run("INSERT INTO contacts (kind, name) VALUES ('personne', 'Exemple')");
  db.run("INSERT INTO mail_types (entity_id, label_fr) VALUES (1, 'Demande')");
  db.run("INSERT INTO mails (register_id, entity_id, year, seq, number, received_date, channel, sender_contact_id, subject, type_id) VALUES (1, 1, 2026, 1, 'AC-2026-000001', '2026-11-10', 'courrier', 1, 'Ancien courrier', 1)");
  run(MIGRATIONS.find(([name]) => name === '009_attribution')[1]);
  const row = db.exec('SELECT number, subject, service_id, agent_id, attributed_at, return_reason FROM mails')[0].values[0];
  assert.deepEqual(row, ['AC-2026-000001', 'Ancien courrier', null, null, null, null]);
  for (const t of ['mail_copies', 'mail_attributions', 'user_services', 'notifications']) assert.equal(db.exec(`SELECT COUNT(*) FROM ${t}`)[0].values[0][0], 0);
  assert.throws(() => db.run("INSERT INTO mail_attributions (mail_id, kind) VALUES (1, 'inconnu')"));
  assert.throws(() => db.run("INSERT INTO notifications (user_id, mail_id, kind) VALUES (1, 1, 'inconnu')"));
  db.close();
});
