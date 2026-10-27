/**
 * Courrier entrant, étape 1 (version 0.1.0) : numérotation, enregistrement simultané, annulation, droits par entité,
 * cloisonnement AC et CPAS, référentiels (types, services, contacts), registres.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, client } = require('./helpers');
const { getDb } = require('../src/database');
const { todayInInstance } = require('../src/instance');

let srv;
let admin;
let secAC;
let gesAC;
let secCPAS;
let agentAC;
let contactId;
let typeAC;
let typeCPAS;
const AC = 1;
const CPAS = 2;
let year;

async function userWith(email, entityRoles) {
  const r = await admin.post('/api/users', { email, first_name: 'Prénom', last_name: 'Nom', entity_roles: entityRoles });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const c = client(srv.base);
  assert.equal((await c.post('/api/auth/login', { email, password: r.body.data.generated_password })).status, 200);
  return c;
}

const mail = (extra = {}) => ({ entity_id: AC, channel: 'courrier', sender_contact_id: contactId, subject: 'Demande de renseignements', type_id: typeAC, ...extra });

before(async () => {
  srv = await startServer();
  year = Number(todayInInstance().slice(0, 4));
  admin = client(srv.base);
  await admin.post('/api/install', { email: 'admin@exemple.test', first_name: 'A', last_name: 'A', password: 'mot-de-passe-solide-1' });
  secAC = await userWith('sec.ac@exemple.test', [{ entity_id: AC, role: 'secretariat' }]);
  gesAC = await userWith('ges.ac@exemple.test', [{ entity_id: AC, role: 'gestionnaire' }]);
  secCPAS = await userWith('sec.cpas@exemple.test', [{ entity_id: CPAS, role: 'secretariat' }]);
  agentAC = await userWith('agent.ac@exemple.test', [{ entity_id: AC, role: 'agent' }]);
  typeAC = (await admin.post('/api/mail-types', { entity_id: AC, label_fr: 'Demande', label_nl: 'Aanvraag' })).body.data.id;
  typeCPAS = (await admin.post('/api/mail-types', { entity_id: CPAS, label_fr: 'Demande d’aide', label_nl: 'Hulpaanvraag' })).body.data.id;
  const c = await secAC.post('/api/contacts', { kind: 'personne', name: 'Exemple', first_name: 'Marie', lang: 'fr' });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  contactId = c.body.data.id;
});
after(() => srv.stop());

test('un gestionnaire ne crée pas de type dans une autre entité ; il en crée dans la sienne', async () => {
  assert.equal((await gesAC.post('/api/mail-types', { entity_id: CPAS, label_fr: 'X' })).status, 403);
  const r = await gesAC.post('/api/mail-types', { entity_id: AC, label_fr: 'Plainte' });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.nl_to_validate, 0);
  assert.equal((await secAC.post('/api/mail-types', { entity_id: AC, label_fr: 'Refusé' })).status, 403);
});

test('enregistrement : numéro AC-<année>-000001 posé par le serveur, au format du registre', async () => {
  const r = await secAC.post('/api/mails', mail());
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.data.number, `AC-${year}-000001`);
  assert.equal(r.body.data.status, 'enregistre');
  assert.equal(r.body.data.received_date, todayInInstance());
  assert.equal(r.body.data.sender_name, 'Exemple');
  const r2 = await secAC.post('/api/mails', mail({ channel: 'recommande', tracking_number: 'RR123456789BE' }));
  assert.equal(r2.body.data.number, `AC-${year}-000002`);
});

test('vingt enregistrements simultanés : vingt numéros distincts et consécutifs, sans trou', async () => {
  const before = getDb().prepare('SELECT last_number FROM register_counters WHERE register_id = 1 AND year = ?').get(year).last_number;
  const res = await Promise.all(Array.from({ length: 20 }, () => secAC.post('/api/mails', mail())));
  for (const r of res) assert.equal(r.status, 201);
  const seqs = res.map((r) => r.body.data.seq).sort((a, b) => a - b);
  assert.equal(new Set(seqs).size, 20);
  assert.deepEqual(seqs, Array.from({ length: 20 }, (_, i) => before + 1 + i));
});

test('le numéro suit l’année de la date de réception (décision D-20) ; date future refusée', async () => {
  const r = await secAC.post('/api/mails', mail({ received_date: `${year - 1}-12-31` }));
  assert.equal(r.status, 201);
  assert.equal(r.body.data.number, `AC-${year - 1}-000001`);
  const futur = await secAC.post('/api/mails', mail({ received_date: `${year + 1}-01-02` }));
  assert.equal(futur.status, 400);
  assert.equal(futur.body.code, 'DATE_FUTURE');
  assert.equal((await secAC.post('/api/mails', mail({ received_date: '31/12/2025' }))).status, 400);
});

test('le CPAS a son propre registre et son propre compteur', async () => {
  const r = await secCPAS.post('/api/mails', mail({ entity_id: CPAS, type_id: typeCPAS }));
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.data.number, `CPAS-${year}-000001`);
});

test('type d’une autre entité ou inactif, contact inconnu : refusés', async () => {
  const t = await secAC.post('/api/mails', mail({ type_id: typeCPAS }));
  assert.equal(t.status, 409);
  assert.equal(t.body.code, 'TYPE_INVALID');
  const c = await secAC.post('/api/mails', mail({ sender_contact_id: 9999 }));
  assert.equal(c.body.code, 'CONTACT_INVALID');
  const tmp = (await admin.post('/api/mail-types', { entity_id: AC, label_fr: 'Ancien type' })).body.data.id;
  assert.equal((await admin.del(`/api/mail-types/${tmp}`, { reason: 'Plus utilisé' })).status, 200);
  assert.equal((await secAC.post('/api/mails', mail({ type_id: tmp }))).body.code, 'TYPE_INVALID');
});

test('cloisonnement : le secrétariat de l’AC ne voit ni ne touche le courrier du CPAS, et inversement', async () => {
  const cpasId = (await secCPAS.post('/api/mails', mail({ entity_id: CPAS, type_id: typeCPAS }))).body.data.id;
  const acId = (await secAC.post('/api/mails', mail())).body.data.id;
  assert.equal((await secAC.get(`/api/mails/${cpasId}`)).status, 403);
  assert.equal((await secAC.put(`/api/mails/${cpasId}`, { subject: 'x' })).status, 403);
  assert.equal((await secAC.del(`/api/mails/${cpasId}`, { reason: 'x' })).status, 403);
  assert.equal((await secCPAS.get(`/api/mails/${acId}`)).status, 403);
  assert.equal((await secAC.post('/api/mails', mail({ entity_id: CPAS, type_id: typeCPAS }))).status, 403);
  assert.equal((await secAC.get(`/api/mails?entity_id=${CPAS}`)).status, 403);
  const liste = (await secAC.get('/api/mails?limit=200')).body.data;
  assert.ok(liste.length > 0 && liste.every((m) => m.entity_code === 'AC'));
});

test('ni l’agent ni l’administrateur sans rôle de registre ne voient le courrier', async () => {
  const id = (await secAC.post('/api/mails', mail())).body.data.id;
  for (const c of [agentAC, admin]) {
    assert.equal((await c.get(`/api/mails/${id}`)).status, 403);
    assert.equal((await c.get('/api/mails')).body.data.length, 0);
    assert.equal((await c.post('/api/mails', mail())).status, 403);
    assert.equal((await c.get('/api/contacts')).status, 403);
  }
});

test('modification : champs permis seulement ; numéro, entité et date de réception intouchables', async () => {
  const id = (await secAC.post('/api/mails', mail())).body.data.id;
  const r = await gesAC.put(`/api/mails/${id}`, { subject: 'Objet corrigé', urgency: 'urgente', pieces_count: 3 });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.subject, 'Objet corrigé');
  for (const champ of [{ number: 'AC-2000-000001' }, { entity_id: CPAS }, { received_date: '2020-01-01' }, { status: 'annule' }]) {
    assert.equal((await secAC.put(`/api/mails/${id}`, champ)).status, 400, JSON.stringify(champ));
  }
});

test('annulation avec motif : le numéro reste au registre, plus de modification, pas de deuxième annulation', async () => {
  const m = (await secAC.post('/api/mails', mail())).body.data;
  assert.equal((await secAC.del(`/api/mails/${m.id}`, {})).status, 400);
  const r = await secAC.del(`/api/mails/${m.id}`, { reason: 'Enregistré deux fois' });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.status, 'annule');
  assert.equal(r.body.data.number, m.number);
  assert.equal(getDb().prepare('SELECT COUNT(*) AS n FROM mails WHERE id = ?').get(m.id).n, 1);
  assert.equal((await secAC.put(`/api/mails/${m.id}`, { subject: 'x' })).status, 409);
  assert.equal((await secAC.del(`/api/mails/${m.id}`, { reason: 'x' })).status, 409);
  const suivant = (await secAC.post('/api/mails', mail())).body.data;
  assert.equal(suivant.seq, m.seq + 1, 'un numéro annulé n’est jamais réutilisé');
  const annules = (await secAC.get('/api/mails?status=annule')).body.data;
  assert.ok(annules.some((x) => x.id === m.id));
});

test('recherche et filtres de la liste : numéro, objet, expéditeur, année', async () => {
  const m = (await secAC.post('/api/mails', mail({ subject: 'Permis de stationnement', sender_reference: 'REF-77' }))).body.data;
  for (const q of [m.number, 'stationnement', 'REF-77', 'Exemple']) {
    const r = await secAC.get(`/api/mails?q=${encodeURIComponent(q)}`);
    assert.ok(r.body.data.some((x) => x.id === m.id), q);
  }
  const y = (await secAC.get(`/api/mails?year=${year - 1}`)).body.data;
  assert.ok(y.length === 1 && y[0].year === year - 1);
});

test('registre : préfixe modifiable tant qu’aucun numéro n’est attribué, figé ensuite', async () => {
  const dep = (await admin.get('/api/registers?direction=depart&entity_id=1')).body.data[0];
  const ok = await admin.put(`/api/registers/${dep.id}`, { prefix: 'DEP-AC' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.prefix, 'DEP-AC');
  const pris = await admin.put('/api/registers/1', { prefix: 'ACX' });
  assert.equal(pris.status, 409);
  assert.equal(pris.body.code, 'REGISTER_IN_USE');
  assert.equal((await admin.put(`/api/registers/${dep.id}`, { prefix: 'CPAS' })).body.code, 'CODE_USED');
});

test('services : communs à deux entités, nom NL facultatif ou à valider, filtre par entité, désactivation avec motif', async () => {
  const r = await admin.post('/api/services', { name_fr: 'Ressources humaines', name_nl: 'Personeelszaken', nl_to_validate: true, entity_ids: [AC, CPAS] });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.deepEqual(r.body.data.entity_ids, [AC, CPAS]);
  assert.equal(r.body.data.nl_to_validate, 1);
  const sansNl = await admin.post('/api/services', { name_fr: 'Accueil', entity_ids: [AC] });
  assert.equal(sansNl.body.data.name_nl, null);
  assert.equal((await admin.post('/api/services', { name_fr: 'Orphelin', entity_ids: [] })).status, 400);
  const cpas = (await secAC.get(`/api/services?entity_id=${CPAS}`)).body.data.map((s) => s.name_fr);
  assert.ok(cpas.includes('Ressources humaines') && !cpas.includes('Accueil'));
  assert.equal((await admin.put(`/api/services/${r.body.data.id}`, { parent_id: r.body.data.id })).body.code, 'PARENT_INVALID');
  assert.equal((await secAC.post('/api/services', { name_fr: 'x', entity_ids: [AC] })).status, 403);
  const d = await admin.del(`/api/services/${sansNl.body.data.id}`, { reason: 'Fusionné' });
  assert.equal(d.body.data.is_active, 0);
});

test('contacts : recherche pendant la frappe, création, désactivation avec motif ; coordonnées hors du journal', async () => {
  const c = await secAC.post('/api/contacts', { kind: 'organisation', name: 'Société Fictive SA', email: 'info@fictive.exemple.test', lang: 'nl' });
  assert.equal(c.status, 201);
  assert.ok((await secCPAS.get('/api/contacts?q=fictive')).body.data.some((x) => x.id === c.body.data.id), 'contacts communs aux entités');
  assert.equal((await secAC.post('/api/contacts', { kind: 'personne', name: 'X', email: 'pas-un-courriel' })).status, 400);
  assert.equal((await secAC.del(`/api/contacts/${c.body.data.id}`, { reason: 'Doublon' })).body.data.is_active, 0);
  assert.equal((await secAC.post('/api/mails', mail({ sender_contact_id: c.body.data.id }))).body.code, 'CONTACT_INVALID');
  const audit = getDb().prepare("SELECT details_json FROM audit_log WHERE entity_type = 'contact'").all().map((x) => x.details_json).join(' ');
  assert.doesNotMatch(audit, /fictive\.exemple\.test|Marie/);
});

test('chaque enregistrement et chaque annulation figurent au journal d’audit', async () => {
  const n = (a) => getDb().prepare('SELECT COUNT(*) AS n FROM audit_log WHERE action = ?').get(a).n;
  const total = getDb().prepare('SELECT COUNT(*) AS n FROM mails').get().n;
  assert.equal(n('mail.register'), total);
  assert.equal(n('mail.cancel'), getDb().prepare("SELECT COUNT(*) AS n FROM mails WHERE status = 'annule'").get().n);
});
