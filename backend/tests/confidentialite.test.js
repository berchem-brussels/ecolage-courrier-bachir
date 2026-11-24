/**
 * Confidentialité du courrier entrant, version 0.5.0 (CDC CR-001 à CR-005, CR-007, CR-008, CA-005) et garde-fou E75.
 * Trois niveaux (normal, restreint, confidentiel), personnes désignées, pli remis fermé sans scan ni objet, changement de niveau avec motif,
 * cloisonnement sur chaque route et chaque outil MCP, bannettes, compteurs, notifications, historique, protection de l'assistant,
 * migration 011. Données fictives fabriquées ici.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, client } = require('./helpers');
const { getDb } = require('../src/database');

const AC = 1;
const CPAS = 2;
const SECRET = 'Objet secret fictif';
const GENERIC = 'Pli confidentiel remis fermé';
let srv;
let admin; let secAC; let secCPAS; let gestAC; let agentA1; let agentA2; let chefA; let agentB; let agentCPAS; let aud;
let svcA; let svcB; let svcCPAS; let contactId; let typeAC; let typeCPAS;
const parse = (r) => JSON.parse(r.body.result.content[0].text);
const PDF = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n');

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
/** Enregistre un courrier de l'AC au niveau donné ; renvoie sa ligne. */
async function reg(level = 'normal', designees = [], extra = {}) {
  const r = await secAC.post('/api/mails', { entity_id: AC, channel: 'courrier', sender_contact_id: contactId, subject: SECRET, type_id: typeAC,
    confidentiality: level, designee_ids: designees, ...extra });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body.data;
}
const get = (c, id) => c.get(`/api/mails/${id}`);
const ids = (r) => (r.body.data.rows || r.body.data).map((x) => x.id);

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
  agentA1 = await create([{ entity_id: AC, role: 'agent', service_ids: [svcA] }], 'agenta1');
  agentA2 = await create([{ entity_id: AC, role: 'agent', service_ids: [svcA] }], 'agenta2');
  chefA = await create([{ entity_id: AC, role: 'chef_service', service_ids: [svcA] }], 'chefa');
  agentB = await create([{ entity_id: AC, role: 'agent', service_ids: [svcB] }], 'agentb');
  agentCPAS = await create([{ entity_id: CPAS, role: 'agent', service_ids: [svcCPAS] }], 'agentcpas');
  aud = await create([{ entity_id: AC, role: 'auditeur' }], 'aud');
  typeAC = (await admin.post('/api/mail-types', { entity_id: AC, label_fr: 'Demande' })).body.data.id;
  typeCPAS = (await admin.post('/api/mail-types', { entity_id: CPAS, label_fr: 'Demande CPAS' })).body.data.id;
  contactId = (await secAC.post('/api/contacts', { kind: 'personne', name: 'Exemple' })).body.data.id;
});
after(() => srv.stop());

// ---------------------------------------------------------------- niveaux à l'enregistrement

test('par défaut un courrier est « normal », sans personne désignée, comme avant la 0.5.0', async () => {
  const m = await reg();
  assert.equal(m.confidentiality, 'normal');
  const g = (await get(secAC, m.id)).body.data;
  assert.deepEqual(g.designees, []);
  assert.equal((await secAC.post('/api/mails', { entity_id: AC, channel: 'courrier', sender_contact_id: contactId, subject: 'Sans niveau', type_id: typeAC })).body.data.confidentiality, 'normal');
  const bad = await secAC.post('/api/mails', { entity_id: AC, channel: 'courrier', sender_contact_id: contactId, subject: 'x', type_id: typeAC, confidentiality: 'normal', designee_ids: [agentA1.userId] });
  assert.equal(bad.status, 400, 'aucune personne désignée pour un courrier normal');
});

test('désignation : restreint exige au moins une personne, confidentiel exactement une ; agents et responsables actifs de l’entité seulement', async () => {
  const body = (level, designee_ids) => ({ entity_id: AC, channel: 'courrier', sender_contact_id: contactId, subject: 'x', type_id: typeAC, confidentiality: level, designee_ids });
  for (const [level, list] of [['restreint', []], ['confidentiel', []], ['confidentiel', [agentA1.userId, agentA2.userId]]]) {
    const r = await secAC.post('/api/mails', body(level, list));
    assert.equal(r.status, 409, `${level} ${list.length}`);
    assert.equal(r.body.code, 'DESIGNEE_REQUIRED');
  }
  for (const who of [agentCPAS.userId, secAC.userId, aud.userId, 999999]) {
    const r = await secAC.post('/api/mails', body('restreint', [who]));
    assert.equal(r.status, 409, `personne ${who}`);
    assert.equal(r.body.code, 'DESIGNEE_INVALID');
  }
  const gone = await create([{ entity_id: AC, role: 'agent', service_ids: [svcA] }], 'parti');
  await admin.del(`/api/users/${gone.userId}`);
  assert.equal((await secAC.post('/api/mails', body('restreint', [gone.userId]))).body.code, 'DESIGNEE_INVALID', 'compte désactivé');
  const n = getDb().prepare('SELECT COUNT(*) AS n FROM mails WHERE subject = ?').get('x').n;
  assert.equal(n, 0, 'aucun courrier créé par un refus');
});

test('les personnes qu’on peut désigner : agents et responsables de l’entité, par le registre seulement', async () => {
  const r = await secAC.get(`/api/mails/designable-users?entity_id=${AC}`);
  assert.equal(r.status, 200);
  const who = r.body.data.map((u) => u.id);
  assert.ok(who.includes(agentA1.userId) && who.includes(chefA.userId));
  assert.ok(!who.includes(agentCPAS.userId) && !who.includes(secAC.userId) && !who.includes(aud.userId));
  assert.ok(r.body.data.every((u) => !('email' in u)), 'ni courriel ni donnée de compte');
  for (const c of [agentA1, aud, admin, secCPAS, agentCPAS]) assert.equal((await c.get(`/api/mails/designable-users?entity_id=${AC}`)).status, 403);
});

// ---------------------------------------------------------------- restreint (CR-003)

test('restreint : lu du registre et des personnes désignées seulement ; ni le service traitant, ni un collègue, ni l’auditeur, ni l’administrateur, ni l’autre entité', async () => {
  const m = await reg('restreint', [agentA1.userId]);
  assert.equal((await secAC.put(`/api/mails/${m.id}/attribution`, { service_id: svcA })).status, 200);
  for (const c of [secAC, gestAC, agentA1]) assert.equal((await get(c, m.id)).status, 200);
  for (const c of [agentA2, chefA, agentB, aud, admin, secCPAS, agentCPAS]) assert.equal((await get(c, m.id)).status, 403);
  const g = (await get(agentA1, m.id)).body.data;
  assert.equal(g.designated, true);
  assert.deepEqual(g.designees, [], 'la personne désignée ne voit pas la liste des autres');
  assert.equal((await get(secAC, m.id)).body.data.designees.length, 1);
  assert.equal((await agentA2.get(`/api/mails/${m.id}/history`)).status, 403);
  assert.equal((await agentA2.get(`/api/mails/${m.id}/comments`)).status, 403);
});

test('restreint : la personne désignée du service traitant traite ; son collègue non désigné ne le voit ni ne le prend', async () => {
  const m = await reg('restreint', [agentA1.userId]);
  await secAC.put(`/api/mails/${m.id}/attribution`, { service_id: svcA });
  assert.equal((await get(agentA1, m.id)).body.data.rights.take, true);
  assert.equal((await agentA2.post(`/api/mails/${m.id}/take`, {})).status, 403);
  assert.equal((await agentA1.post(`/api/mails/${m.id}/take`, {})).status, 200);
  assert.equal((await agentA1.post(`/api/mails/${m.id}/comments`, { scope: 'service', body: 'Note de service' })).status, 201);
  assert.equal((await agentA2.get(`/api/mails/${m.id}/comments`)).status, 403);
});

test('restreint : une personne désignée d’un autre service lit le courrier sans pouvoir le traiter', async () => {
  const m = await reg('restreint', [agentB.userId]);
  await secAC.put(`/api/mails/${m.id}/attribution`, { service_id: svcA });
  const g = await get(agentB, m.id);
  assert.equal(g.status, 200);
  assert.equal(g.body.data.rights.take, false);
  assert.equal(g.body.data.rights.comment, false);
  assert.equal((await agentB.post(`/api/mails/${m.id}/take`, {})).status, 403);
  assert.ok(ids(await agentB.get('/api/mails?box=moi&limit=200')).includes(m.id), 'il la retrouve dans « Moi »');
  assert.ok(!ids(await agentB.get('/api/mails?box=mon_service&limit=200')).includes(m.id));
});

// ---------------------------------------------------------------- confidentiel (CR-004, CR-005)

test('confidentiel : sans objet, sans scan, lu du destinataire nommé et du registre seulement', async () => {
  const m = await reg('confidentiel', [agentA1.userId], { notes: 'Note secrète' });
  assert.equal(m.confidentiality, 'confidentiel');
  assert.equal(m.subject, GENERIC, 'l’objet écrit est ignoré : le pli n’est pas ouvert');
  const stored = getDb().prepare('SELECT subject FROM mails WHERE id = ?').get(m.id).subject;
  assert.equal(stored, GENERIC, 'l’objet secret n’est même pas en base');
  for (const c of [secAC, gestAC, agentA1]) assert.equal((await get(c, m.id)).status, 200);
  for (const c of [agentA2, chefA, agentB, aud, admin, secCPAS, agentCPAS]) assert.equal((await get(c, m.id)).status, 403);
  assert.equal((await get(agentA1, m.id)).body.data.rights.take, false);
  assert.equal((await get(agentA1, m.id)).body.data.rights.comment, false);
  assert.equal((await agentA1.post(`/api/mails/${m.id}/comments`, { scope: 'entity', body: 'Non' })).status, 403);
});

test('confidentiel : aucun fichier ne s’y joint (dépôt, rattachement, outil MCP), et il ne s’attribue pas', async () => {
  const m = await reg('confidentiel', [agentA1.userId]);
  const mcp = parse(await secAC.mcp('tools/call', { name: 'create_piece', arguments: { mail_id: m.id, file_name: 'scan.pdf', content_base64: PDF.toString('base64') } }));
  assert.equal(mcp.code, 'CONFIDENTIAL_NO_SCAN');
  const queued = parse(await secAC.mcp('tools/call', { name: 'create_piece', arguments: { entity_id: AC, file_name: 'file.pdf', content_base64: PDF.toString('base64') } }));
  assert.ok(queued.data && queued.data.id, 'dépôt dans la file : permis');
  const r = await secAC.post('/api/mails', { entity_id: AC, channel: 'courrier', sender_contact_id: contactId, subject: 'x', type_id: typeAC, confidentiality: 'confidentiel', designee_ids: [agentA1.userId], piece_ids: [queued.data.id] });
  assert.equal(r.status, 409);
  assert.equal(r.body.code, 'CONFIDENTIAL_NO_SCAN');
  assert.equal(getDb().prepare("SELECT status FROM pieces WHERE id = ?").get(queued.data.id).status, 'a_enregistrer', 'la pièce reste dans la file');
  const att = await secAC.put(`/api/mails/${m.id}/attribution`, { service_id: svcA });
  assert.equal(att.status, 409);
  assert.equal(att.body.code, 'CONFIDENTIAL_ATTRIBUTED');
});

test('confidentiel : la remise du pli fermé s’enregistre une fois (qui remet, qui reçoit, quand)', async () => {
  const m = await reg('confidentiel', [agentA1.userId]);
  assert.equal((await get(secAC, m.id)).body.data.rights.handover, true);
  for (const c of [agentA1, agentA2, aud, admin, secCPAS]) assert.equal((await c.post(`/api/mails/${m.id}/handover`, {})).status, 403);
  const h = await secAC.post(`/api/mails/${m.id}/handover`, {});
  assert.equal(h.status, 200, JSON.stringify(h.body));
  assert.equal(h.body.data.handed_by, secAC.userId);
  assert.equal(h.body.data.handed_to, agentA1.userId);
  assert.ok(h.body.data.handed_at);
  const again = await secAC.post(`/api/mails/${m.id}/handover`, {});
  assert.equal(again.status, 409);
  assert.equal(again.body.code, 'REMISE_DONE');
  const t = (await get(agentA1, m.id)).body.data.timeline.find((x) => x.type === 'remise');
  assert.ok(t, 'le destinataire lit la remise');
  const normal = await reg();
  assert.equal((await get(secAC, normal.id)).body.data.rights.handover, false, 'le droit de remise n’est annoncé que pour un pli confidentiel');
  const nc = await secAC.post(`/api/mails/${normal.id}/handover`, {});
  assert.equal(nc.status, 409);
  assert.equal(nc.body.code, 'NOT_CONFIDENTIAL');
});

test('confidentiel : un courrier déjà enregistré ne le devient pas', async () => {
  const m = await reg();
  const r = await secAC.put(`/api/mails/${m.id}/confidentiality`, { level: 'confidentiel', designee_ids: [agentA1.userId], reason: 'Essai' });
  assert.equal(r.status, 409);
  assert.equal(r.body.code, 'CONFIDENTIAL_AT_REGISTRATION');
  assert.equal((await get(secAC, m.id)).body.data.confidentiality, 'normal');
});

test('défense en profondeur : un pli confidentiel forcé en base dans un état que l’API refuse (service, fichier) ne se traite pas et ne se lit pas par un assistant', async () => {
  const m = await reg('confidentiel', [agentA1.userId]);
  getDb().prepare('UPDATE mails SET service_id = ? WHERE id = ?').run(svcA, m.id);
  const g = (await get(agentA1, m.id)).body.data;
  assert.equal(g.rights.take, false, 'membre du service et destinataire, mais le pli reste en lecture seule');
  assert.equal(g.rights.comment, false);
  assert.equal(g.rights.close, false);
  assert.equal((await agentA1.post(`/api/mails/${m.id}/take`, {})).status, 403);
  assert.equal((await agentA1.post(`/api/mails/${m.id}/comments`, { scope: 'service', body: 'Non' })).status, 403);
  getDb().prepare("INSERT INTO pieces (entity_id, mail_id, status, storage_name, original_name, mime, size_bytes, sha256) VALUES (?, ?, 'rattachee', 'garde-fou-test', 'f.pdf', 'application/pdf', 10, ?)").run(AC, m.id, 'a'.repeat(64));
  const pid = getDb().prepare('SELECT id FROM pieces WHERE storage_name = ?').get('garde-fou-test').id;
  assert.equal(parse(await secAC.mcp('tools/call', { name: 'read_piece_content', arguments: { id: pid } })).code, 'FORBIDDEN', 'CA-005 : jamais de pièce d’un pli confidentiel à un assistant');
});

// ---------------------------------------------------------------- changement de niveau (CR-001)

test('changement de niveau : registre seulement, avec motif, au journal et à l’historique du registre', async () => {
  const m = await reg();
  await secAC.put(`/api/mails/${m.id}/attribution`, { service_id: svcA });
  assert.equal((await get(agentA2, m.id)).status, 200, 'normal : le service traitant le lit');
  const noReason = await secAC.put(`/api/mails/${m.id}/confidentiality`, { level: 'restreint', designee_ids: [agentA1.userId] });
  assert.equal(noReason.status, 400);
  for (const c of [agentA1, aud, admin, secCPAS, agentCPAS]) {
    assert.equal((await c.put(`/api/mails/${m.id}/confidentiality`, { level: 'restreint', designee_ids: [agentA1.userId], reason: 'Non' })).status, 403);
  }
  const up = await secAC.put(`/api/mails/${m.id}/confidentiality`, { level: 'restreint', designee_ids: [agentA1.userId], reason: 'Dossier du personnel' });
  assert.equal(up.status, 200, JSON.stringify(up.body));
  assert.equal(up.body.data.confidentiality, 'restreint');
  assert.equal((await get(agentA2, m.id)).status, 403, 'devenu restreint : le collègue ne le lit plus');
  assert.equal((await get(agentA1, m.id)).status, 200);
  const same = await secAC.put(`/api/mails/${m.id}/confidentiality`, { level: 'restreint', designee_ids: [agentA1.userId], reason: 'Encore' });
  assert.equal(same.status, 409);
  assert.equal(same.body.code, 'LEVEL_UNCHANGED');
  const down = await gestAC.put(`/api/mails/${m.id}/confidentiality`, { level: 'normal', designee_ids: [], reason: 'Levée du caractère restreint' });
  assert.equal(down.status, 200);
  assert.equal((await get(agentA2, m.id)).status, 200, 'redevenu normal : le service traitant le lit');
  const tl = (await get(secAC, m.id)).body.data.timeline.filter((x) => x.type === 'confidentialite');
  assert.equal(tl.length, 2);
  assert.deepEqual(tl.map((x) => x.to_level), ['normal', 'restreint']);
  assert.ok((await get(agentA2, m.id)).body.data.timeline.every((x) => x.type !== 'confidentialite'), 'les motifs ne se lisent qu’au registre');
  const logs = getDb().prepare("SELECT details_json AS details FROM audit_log WHERE action = 'mail.confidentiality' AND entity_type = 'mail' AND entity_id = ?").all(m.id);
  assert.equal(logs.length, 2);
  assert.ok(logs.every((l) => !l.details.includes(SECRET)), 'ni objet ni nom dans le journal d’audit');
});

test('changement de niveau : un courrier annulé ne change plus ; le niveau CPAS reste propre au CPAS', async () => {
  const m = await reg();
  await secAC.del(`/api/mails/${m.id}`, { reason: 'Erreur' });
  const r = await secAC.put(`/api/mails/${m.id}/confidentiality`, { level: 'restreint', designee_ids: [agentA1.userId], reason: 'Trop tard' });
  assert.equal(r.status, 409);
  assert.equal(r.body.code, 'CANCELLED');
  const cp = await secCPAS.post('/api/mails', { entity_id: CPAS, channel: 'courrier', sender_contact_id: contactId, subject: SECRET, type_id: typeCPAS, confidentiality: 'restreint', designee_ids: [agentA1.userId] });
  assert.equal(cp.status, 409, 'un agent de l’AC ne se désigne pas dans une affaire du CPAS');
  assert.equal(cp.body.code, 'DESIGNEE_INVALID');
});

// ---------------------------------------------------------------- listes, bannettes, compteurs, notifications (CR-008)

test('bannettes et compteurs : un courrier restreint n’apparaît qu’aux personnes désignées et au registre', async () => {
  const gap = async () => (await agentA1.get('/api/mails/counts')).body.data.mon_service - (await agentA2.get('/api/mails/counts')).body.data.mon_service;
  const gapBefore = await gap();
  const m = await reg('restreint', [agentA1.userId]);
  await secAC.put(`/api/mails/${m.id}/attribution`, { service_id: svcA, copy_service_ids: [svcB] });
  const normal = await reg();
  await secAC.put(`/api/mails/${normal.id}/attribution`, { service_id: svcA });
  const a1 = ids(await agentA1.get('/api/mails?box=mon_service&limit=200'));
  const a2 = ids(await agentA2.get('/api/mails?box=mon_service&limit=200'));
  assert.ok(a1.includes(m.id) && a1.includes(normal.id));
  assert.ok(!a2.includes(m.id) && a2.includes(normal.id));
  assert.ok(!ids(await agentB.get('/api/mails?box=en_copie&limit=200')).includes(m.id), 'le service en copie ne le voit pas');
  assert.equal(await gap() - gapBefore, 1, 'le compteur suit la même règle que la liste : un courrier restreint de plus pour la personne désignée seulement');
  assert.ok(ids(await secAC.get(`/api/mails?entity_id=${AC}&limit=200`)).includes(m.id), 'le registre voit tout');
  const search = await agentA2.get('/api/mails?box=mon_service&q=secret&limit=200');
  assert.ok(!ids(search).includes(m.id), 'la recherche ne révèle pas un courrier invisible');
  assert.deepEqual(ids(await agentA2.get('/api/mails?limit=200')), [], 'pas de registre sans rôle de registre : liste vide');
});

test('notifications : un courrier restreint ne notifie que les personnes autorisées, par son numéro seulement', async () => {
  const m = await reg('restreint', [agentA1.userId]);
  await secAC.put(`/api/mails/${m.id}/attribution`, { service_id: svcA });
  const n1 = (await agentA1.get('/api/notifications')).body.data;
  const n2 = (await agentA2.get('/api/notifications')).body.data;
  assert.ok(n1.some((n) => n.mail_id === m.id));
  assert.ok(!n2.some((n) => n.mail_id === m.id));
  assert.ok(n1.every((n) => !JSON.stringify(n).includes(SECRET)));
  const before2 = (await agentA2.get('/api/notifications?unread=true')).body.meta.unread;
  await secAC.put(`/api/mails/${m.id}/confidentiality`, { level: 'normal', designee_ids: [], reason: 'Levée' });
  const after2 = (await agentA2.get('/api/notifications?unread=true')).body.meta.unread;
  assert.equal(after2 - before2, 1, 'redevenu normal, la notification d’attribution devient lisible');
});

// ---------------------------------------------------------------- cloisonnement sur chaque route et chaque outil MCP (CR-007)

test('cloisonnement : l’autre entité, l’auditeur, l’administrateur et un collègue non désigné reçoivent 403 sur chaque route d’un courrier restreint ou confidentiel', async () => {
  const restricted = await reg('restreint', [agentA1.userId]);
  const sealed = await reg('confidentiel', [agentA1.userId]);
  const routes = (id) => [
    ['get', `/api/mails/${id}`], ['get', `/api/mails/${id}/history`], ['get', `/api/mails/${id}/comments`], ['get', `/api/pieces?mail_id=${id}`],
    ['put', `/api/mails/${id}`, { subject: 'Modifié' }], ['put', `/api/mails/${id}/attribution`, { service_id: svcA }], ['put', `/api/mails/${id}/agent`, { agent_id: agentA1.userId }],
    ['post', `/api/mails/${id}/return`, { reason: 'Non' }], ['post', `/api/mails/${id}/take`, {}], ['post', `/api/mails/${id}/close`, { close_reason_id: 1 }],
    ['post', `/api/mails/${id}/reopen`, { reason: 'Non' }], ['post', `/api/mails/${id}/comments`, { scope: 'entity', body: 'Non' }],
    ['put', `/api/mails/${id}/confidentiality`, { level: 'normal', designee_ids: [], reason: 'Non' }], ['post', `/api/mails/${id}/handover`, {}], ['del', `/api/mails/${id}`, { reason: 'Non' }],
  ];
  const outsiders = { agentA2, chefA, agentB, aud, admin, secCPAS, agentCPAS };
  for (const m of [restricted, sealed]) {
    for (const [name, c] of Object.entries(outsiders)) {
      for (const [verb, url, body] of routes(m.id)) {
        const r = await c[verb](url, body);
        assert.equal(r.status, 403, `${m.confidentiality} ${name} ${verb.toUpperCase()} ${url} → ${r.status}`);
      }
    }
  }
  const sec = await secAC.get(`/api/mails/${sealed.id}`);
  assert.equal(sec.body.data.subject, GENERIC);
});

test('cloisonnement MCP : chaque outil de lecture ou d’écriture d’un courrier refuse les mêmes personnes', async () => {
  const restricted = await reg('restreint', [agentA1.userId]);
  const sealed = await reg('confidentiel', [agentA1.userId]);
  const tools = (id) => [
    ['get_mail', { id }], ['get_mail_history', { id }], ['list_mail_comments', { id }], ['update_mail', { id, subject: 'Modifié' }],
    ['attribute_mail', { id, service_id: svcA }], ['set_mail_agent', { id, agent_id: agentA1.userId }], ['return_mail', { id, reason: 'Non' }], ['take_mail', { id }],
    ['close_mail', { id, close_reason_id: 1 }], ['reopen_mail', { id, reason: 'Non' }], ['add_mail_comment', { id, scope: 'entity', body: 'Non' }],
    ['set_mail_confidentiality', { id, level: 'normal', reason: 'Non' }], ['handover_mail', { id }], ['prepare_cancel_mail', { id, reason: 'Non' }],
  ];
  const outsiders = { agentA2, chefA, agentB, aud, admin, secCPAS, agentCPAS };
  for (const m of [restricted, sealed]) {
    for (const [name, c] of Object.entries(outsiders)) {
      for (const [tool, args] of tools(m.id)) {
        const r = parse(await c.mcp('tools/call', { name: tool, arguments: args }));
        assert.equal(r.code, 'FORBIDDEN', `${m.confidentiality} ${name} ${tool} → ${JSON.stringify(r).slice(0, 80)}`);
      }
    }
  }
  assert.equal(parse(await agentA2.mcp('tools/call', { name: 'list_designable_users', arguments: { entity_id: AC } })).code, 'FORBIDDEN');
  assert.ok(parse(await secAC.mcp('tools/call', { name: 'list_designable_users', arguments: { entity_id: AC } })).data.length >= 3);
  const listed = parse(await agentA2.mcp('tools/call', { name: 'list_mails', arguments: { box: 'mon_service' } }));
  assert.ok(!(listed.data.rows || []).some((x) => x.id === restricted.id));
});

// ---------------------------------------------------------------- protection de l'assistant (CA-005)

test('assistant : un pli confidentiel ne livre ni objet, ni note, ni destinataire écrit, ni commentaire, ni pièce, même au registre', async () => {
  const sealed = await reg('confidentiel', [agentA1.userId], { notes: 'Note secrète', addressee_name: 'Nom écrit sur le pli', sender_reference: 'REF-SECRETE' });
  const api = (await get(secAC, sealed.id)).body.data;
  assert.equal(api.notes, 'Note secrète', 'à l’écran, le registre garde ses notes');
  const viaTool = parse(await secAC.mcp('tools/call', { name: 'get_mail', arguments: { id: sealed.id } })).data;
  assert.equal(viaTool.subject, GENERIC);
  assert.equal(viaTool.notes, null);
  assert.equal(viaTool.addressee_name, null);
  assert.equal(viaTool.sender_reference, null);
  assert.deepEqual(viaTool.comments, []);
  assert.deepEqual(viaTool.pieces, []);
  const hist = parse(await secAC.mcp('tools/call', { name: 'get_mail_history', arguments: { id: sealed.id } })).data;
  assert.ok(Array.isArray(hist));
  const rows = parse(await secAC.mcp('tools/call', { name: 'list_mails', arguments: { entity_id: AC } })).data.rows;
  const row = rows.find((x) => x.id === sealed.id);
  assert.ok(row && row.notes === null && row.addressee_name === null);
  const text = JSON.stringify(parse(await agentA1.mcp('tools/call', { name: 'get_mail', arguments: { id: sealed.id } })));
  assert.ok(!text.includes('Note secrète') && !text.includes('Nom écrit') && !text.includes('REF-SECRETE'));
  const other = await reg('restreint', [agentA1.userId], { notes: 'Note restreinte' });
  assert.equal(parse(await agentA1.mcp('tools/call', { name: 'get_mail', arguments: { id: other.id } })).data.notes, 'Note restreinte', 'le restreint reste lisible par une personne désignée');
});

test('consultations : la lecture de la fiche d’un courrier restreint s’inscrit au journal, et seul le registre la lit dans l’historique', async () => {
  const m = await reg('restreint', [agentA1.userId]);
  await get(agentA1, m.id);
  const n = getDb().prepare("SELECT COUNT(*) AS n FROM consultations WHERE mail_id = ? AND user_id = ?").get(m.id, agentA1.userId).n;
  assert.equal(n, 1);
  assert.ok((await get(secAC, m.id)).body.data.timeline.some((x) => x.type === 'consultation'));
  assert.ok((await get(agentA1, m.id)).body.data.timeline.every((x) => x.type !== 'consultation'));
  assert.equal(getDb().prepare('SELECT COUNT(*) AS n FROM consultations WHERE mail_id = ? AND user_id = ?').get(m.id, agentA2.userId).n, 0, 'un refus n’est pas une lecture');
});

// ---------------------------------------------------------------- migration 011 sur une base existante

test('migration 011 : appliquée à une base de la 0.4.1, tout courrier existant reste « normal » et visible comme avant', async () => {
  const initSqlJs = require('sql.js');
  const { MIGRATIONS } = require('../src/database');
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  const run = (sql) => { for (const stmt of sql.split(';').map((s) => s.trim()).filter(Boolean)) db.run(stmt); };
  const upTo010 = MIGRATIONS.filter(([name]) => name < '011');
  assert.equal(upTo010.length, 10);
  for (const [, sql] of upTo010) run(sql);
  db.run("INSERT INTO entities (code, name_fr, name_nl) VALUES ('AC', 'Administration', 'Bestuur')");
  db.run("INSERT INTO registers (entity_id, direction, prefix) VALUES (1, 'entree', 'AC')");
  db.run("INSERT INTO users (email, first_name, last_name) VALUES ('u@exemple.test', 'U', 'U')");
  db.run("INSERT INTO contacts (kind, name) VALUES ('personne', 'Exemple')");
  db.run("INSERT INTO mail_types (entity_id, label_fr) VALUES (1, 'Demande')");
  db.run("INSERT INTO mails (register_id, entity_id, year, seq, number, received_date, channel, sender_contact_id, subject, type_id) VALUES (1, 1, 2026, 1, 'AC-2026-000001', '2026-11-10', 'courrier', 1, 'Ancien courrier', 1)");
  run(MIGRATIONS.find(([name]) => name === '011_confidentialite')[1]);
  assert.deepEqual(db.exec('SELECT number, subject, confidentiality, handed_at FROM mails')[0].values[0], ['AC-2026-000001', 'Ancien courrier', 'normal', null]);
  assert.throws(() => db.run("UPDATE mails SET confidentiality = 'secret' WHERE id = 1"));
  db.run('INSERT INTO mail_designees (mail_id, user_id) VALUES (1, 1)');
  assert.throws(() => db.run('INSERT INTO mail_designees (mail_id, user_id) VALUES (1, 1)'), 'une personne désignée une seule fois');
  assert.throws(() => db.run('DELETE FROM mails WHERE id = 1'), 'un courrier désigné ne se supprime pas');
  db.close();
});
