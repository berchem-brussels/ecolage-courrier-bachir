/**
 * Pièces, file « À enregistrer », journal des consultations et paramètres, version 0.2.0
 * (CDC CE-020, CE-025, CE-030 en partie, CE-124, CG-003, CG-005, CA-007 ; standard v3.2 sections 8.3, 9.1, 10.2).
 * Les fichiers de test sont fabriqués ici, octet par octet : aucun document réel.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { startServer, client } = require('./helpers');
const { getDb } = require('../src/database');
const { FILES_DIR } = require('../src/config');
const piecesSvc = require('../src/services/pieces');

let srv;
let admin;
let secAC;
let secCPAS;
let agentAC;
let audAC;
let contactId;
let typeAC;
const AC = 1;
const CPAS = 2;

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('IHDR fictif')]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('JFIF fictif')]);
const TIF = Buffer.concat([Buffer.from([0x49, 0x49, 0x2a, 0x00]), Buffer.from('TIFF fictif')]);
const EXE = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(64, 1)]);
const bigPdf = (bytes) => Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(bytes, 0x20)]);
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

async function userWith(email, entityRoles) {
  const r = await admin.post('/api/users', { email, first_name: 'Prénom', last_name: 'Nom', entity_roles: entityRoles });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const c = client(srv.base);
  assert.equal((await c.post('/api/auth/login', { email, password: r.body.data.generated_password })).status, 200);
  return c;
}

/** Envoi multipart avec le cookie et le jeton anti-CSRF du client. */
async function upload(c, fields, buffer, name = 'scan.pdf', { type = 'application/pdf', csrf = true, files = 1 } = {}) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, String(v));
  for (let i = 0; i < files; i += 1) if (buffer) fd.append('file', new Blob([buffer], { type }), name);
  const headers = {};
  if (c && c.cookie) headers.Cookie = c.cookie;
  if (c && csrf && c.csrf) headers['X-CSRF-Token'] = c.csrf;
  const res = await fetch(`${srv.base}/api/pieces`, { method: 'POST', headers, body: fd });
  return { status: res.status, body: await res.json() };
}

/** Lecture brute du contenu, par le seul cookie, comme un cadre ou un onglet du navigateur. */
async function raw(c, id, query = '') {
  const res = await fetch(`${srv.base}/api/pieces/${id}/contenu${query}`, { headers: c && c.cookie ? { Cookie: c.cookie } : {} });
  return { status: res.status, headers: res.headers, buf: Buffer.from(await res.arrayBuffer()) };
}

const mail = (extra = {}) => ({ entity_id: AC, channel: 'courrier', sender_contact_id: contactId, subject: 'Demande fictive', type_id: typeAC, ...extra });
const tmpFiles = () => (fs.existsSync(piecesSvc.TMP_DIR) ? fs.readdirSync(piecesSvc.TMP_DIR) : []);
const parse = (r) => JSON.parse(r.body.result.content[0].text);

before(async () => {
  srv = await startServer();
  admin = client(srv.base);
  await admin.post('/api/install', { email: 'admin@exemple.test', first_name: 'A', last_name: 'A', password: 'mot-de-passe-solide-1' });
  secAC = await userWith('sec.ac@exemple.test', [{ entity_id: AC, role: 'secretariat' }]);
  secCPAS = await userWith('sec.cpas@exemple.test', [{ entity_id: CPAS, role: 'secretariat' }]);
  agentAC = await userWith('agent.ac@exemple.test', [{ entity_id: AC, role: 'agent' }]);
  audAC = await userWith('aud.ac@exemple.test', [{ entity_id: AC, role: 'auditeur' }]);
  typeAC = (await admin.post('/api/mail-types', { entity_id: AC, label_fr: 'Demande' })).body.data.id;
  contactId = (await secAC.post('/api/contacts', { kind: 'personne', name: 'Exemple' })).body.data.id;
});
after(() => srv.stop());

test('dépôt d’un PDF dans la file : type vérifié, empreinte, nom généré hors racine web, aucun champ interne rendu', async () => {
  const r = await upload(secAC, { entity_id: AC }, PDF, 'Courrier du 20 octobre.pdf');
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const p = r.body.data;
  assert.equal(p.status, 'a_enregistrer');
  assert.equal(p.mime, 'application/pdf');
  assert.equal(p.size_bytes, PDF.length);
  assert.equal(p.sha256, sha(PDF));
  assert.equal(p.original_name, 'Courrier du 20 octobre.pdf');
  assert.equal(p.mail_id, null);
  assert.equal(p.storage_name, undefined, 'le nom de stockage ne sort pas');
  const row = getDb().prepare('SELECT storage_name FROM pieces WHERE id = ?').get(p.id);
  assert.match(row.storage_name, /^\d{4}\/\d{2}\/[0-9a-f]{32}\.pdf$/);
  assert.deepEqual(fs.readFileSync(path.join(FILES_DIR, row.storage_name)), PDF);
  assert.deepEqual(tmpFiles(), [], 'aucun fichier temporaire restant');
  const audit = getDb().prepare("SELECT channel FROM audit_log WHERE action = 'piece.deposit' AND entity_id = ?").get(p.id);
  assert.equal(audit.channel, 'api');
});

test('type réel sur les premiers octets : PNG et JPEG acceptés, type annoncé ignoré ; exécutable renommé et TIFF refusés', async () => {
  const png = await upload(secAC, { entity_id: AC }, PNG, 'photo.pdf', { type: 'application/pdf' });
  assert.equal(png.status, 201);
  assert.equal(png.body.data.mime, 'image/png', 'le type vient du contenu, pas du nom ni du navigateur');
  const jpg = await upload(secAC, { entity_id: AC }, JPG, 'photo.jpg', { type: 'image/jpeg' });
  assert.equal(jpg.body.data.mime, 'image/jpeg');
  const exe = await upload(secAC, { entity_id: AC }, EXE, 'facture.pdf');
  assert.equal(exe.status, 415);
  assert.equal(exe.body.code, 'FILE_TYPE');
  const tif = await upload(secAC, { entity_id: AC }, TIF, 'scan.tif', { type: 'image/tiff' });
  assert.equal(tif.status, 415);
  assert.equal(tif.body.code, 'FILE_TIFF');
  assert.match(tif.body.message, /PDF/);
  assert.deepEqual(tmpFiles(), []);
});

test('fichier vide, absent ou en double : refusés sans fichier temporaire restant', async () => {
  assert.equal((await upload(secAC, { entity_id: AC }, Buffer.alloc(0))).body.code, 'FILE_EMPTY');
  assert.equal((await upload(secAC, { entity_id: AC }, null)).body.code, 'FILE_MISSING');
  const two = await upload(secAC, { entity_id: AC }, PDF, 'a.pdf', { files: 2 });
  assert.equal(two.status, 400);
  assert.equal((await upload(secAC, {}, PDF)).status, 400, 'entité ou courrier obligatoire');
  assert.deepEqual(tmpFiles(), []);
});

test('taille plafonnée par le paramètre : 413 avec la taille maximale, fichier temporaire effacé', async () => {
  assert.equal((await admin.put('/api/settings', { pieces_max_mb: 1 })).status, 200);
  const r = await upload(secAC, { entity_id: AC }, bigPdf(1.5 * 1024 * 1024));
  assert.equal(r.status, 413);
  assert.equal(r.body.code, 'FILE_TOO_LARGE');
  assert.deepEqual(r.body.details, ['max_mb: 1']);
  assert.equal((await upload(secAC, { entity_id: AC }, bigPdf(900 * 1024))).status, 201, 'sous la limite');
  assert.deepEqual(tmpFiles(), []);
  assert.equal((await admin.put('/api/settings', { pieces_max_mb: 50 })).status, 200);
});

test('droits : sans session 401, sans jeton anti-CSRF 403, agent et autre entité 403', async () => {
  assert.equal((await upload(null, { entity_id: AC }, PDF)).status, 401);
  const noCsrf = await upload(secAC, { entity_id: AC }, PDF, 'x.pdf', { csrf: false });
  assert.equal(noCsrf.status, 403);
  assert.equal(noCsrf.body.code, 'CSRF');
  assert.equal((await upload(agentAC, { entity_id: AC }, PDF)).status, 403);
  assert.equal((await upload(secCPAS, { entity_id: AC }, PDF)).status, 403, 'le secrétariat du CPAS ne dépose pas dans la file de l’AC');
  assert.equal((await upload(admin, { entity_id: AC }, PDF)).status, 403, 'l’administrateur sans rôle de registre non plus');
  assert.deepEqual(tmpFiles(), []);
});

test('cloisonnement : le CPAS ne liste, ne lit ni n’ouvre une pièce de l’AC', async () => {
  const id = (await upload(secAC, { entity_id: AC }, PDF)).body.data.id;
  assert.equal((await secCPAS.get(`/api/pieces?entity_id=${AC}`)).status, 403);
  const own = await secCPAS.get('/api/pieces');
  assert.ok(own.body.data.every((p) => p.entity_id === CPAS));
  assert.equal((await secCPAS.get(`/api/pieces/${id}`)).status, 403);
  assert.equal((await raw(secCPAS, id)).status, 403);
  assert.equal((await raw(agentAC, id)).status, 403);
  assert.equal((await raw(null, id)).status, 401);
  assert.equal((await raw(admin, id)).status, 403);
});

test('contenu par le seul cookie : octets exacts, en-têtes d’affichage dans l’application, téléchargement, consultation journalisée', async () => {
  const p = (await upload(secAC, { entity_id: AC }, PDF, 'Pièce n°1 « test ».pdf')).body.data;
  assert.equal(p.original_name, 'Pièce n°1 « test ».pdf', 'nom accentué relu en UTF-8 (défaut de multer 1.x)');
  const before = getDb().prepare("SELECT COUNT(*) AS n FROM consultations WHERE piece_id = ? AND action = 'piece'").get(p.id).n;
  const r = await raw(secAC, p.id);
  assert.equal(r.status, 200);
  assert.deepEqual(r.buf, PDF);
  assert.equal(r.headers.get('content-type'), 'application/pdf');
  assert.match(r.headers.get('content-security-policy'), /frame-ancestors 'self'/);
  assert.doesNotMatch(r.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(r.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.match(r.headers.get('content-disposition'), /^inline; filename="Pi_ce n_1 _ test _.pdf"; filename\*=UTF-8''Pi%C3%A8ce/);
  assert.match(r.headers.get('cache-control'), /no-store/);
  assert.match((await raw(secAC, p.id, '?telecharger=1')).headers.get('content-disposition'), /^attachment;/);
  const after = getDb().prepare("SELECT COUNT(*) AS n FROM consultations WHERE piece_id = ? AND action = 'piece'").get(p.id).n;
  assert.equal(after, before + 2);
});

test('nom d’origine avec un chemin : nettoyé pour l’affichage, stockage toujours sous le dossier des fichiers', async () => {
  const p = (await upload(secAC, { entity_id: AC }, PDF, '../../etc/passwd.pdf')).body.data;
  assert.equal(p.original_name, 'passwd.pdf');
  const row = getDb().prepare('SELECT storage_name FROM pieces WHERE id = ?').get(p.id);
  assert.ok(path.resolve(FILES_DIR, row.storage_name).startsWith(path.resolve(FILES_DIR) + path.sep));
  assert.equal(piecesSvc.cleanName('C:\\Users\\x\\scan\u0007.pdf'), 'scan.pdf');
});

test('enregistrement depuis la file : la pièce est jointe au numéro et quitte la file', async () => {
  const p = (await upload(secAC, { entity_id: AC }, PDF)).body.data;
  const m = await secAC.post('/api/mails', mail({ piece_ids: [p.id] }));
  assert.equal(m.status, 201, JSON.stringify(m.body));
  assert.equal(m.body.data.pieces.length, 1);
  assert.equal(m.body.data.pieces[0].id, p.id);
  assert.equal(m.body.data.files_count, 1);
  const piece = (await secAC.get(`/api/pieces/${p.id}`)).body.data;
  assert.equal(piece.status, 'rattachee');
  assert.equal(piece.mail_number, m.body.data.number);
  const queue = (await secAC.get(`/api/pieces?entity_id=${AC}`)).body.data;
  assert.ok(!queue.some((x) => x.id === p.id));
  const audit = getDb().prepare("SELECT details_json FROM audit_log WHERE action = 'piece.attach' AND entity_id = ?").get(p.id);
  assert.match(audit.details_json, new RegExp(m.body.data.number));
});

test('pièce déjà prise ou d’une autre entité : 409, aucun numéro consommé', async () => {
  const p = (await upload(secAC, { entity_id: AC }, PDF)).body.data;
  const first = await secAC.post('/api/mails', mail({ piece_ids: [p.id] }));
  const seq = first.body.data.seq;
  const again = await secAC.post('/api/mails', mail({ piece_ids: [p.id] }));
  assert.equal(again.status, 409);
  assert.equal(again.body.code, 'PIECE_UNAVAILABLE');
  const cpasPiece = (await upload(secCPAS, { entity_id: CPAS }, PDF)).body.data;
  assert.equal((await secAC.post('/api/mails', mail({ piece_ids: [cpasPiece.id] }))).status, 409);
  const next = await secAC.post('/api/mails', mail());
  assert.equal(next.body.data.seq, seq + 1, 'le registre reste sans trou');
  assert.equal((await secCPAS.get(`/api/pieces/${cpasPiece.id}`)).body.data.status, 'a_enregistrer');
});

test('deux enregistrements simultanés avec la même pièce : un seul aboutit', async () => {
  const p = (await upload(secAC, { entity_id: AC }, PDF)).body.data;
  const res = await Promise.all([secAC.post('/api/mails', mail({ piece_ids: [p.id] })), secAC.post('/api/mails', mail({ piece_ids: [p.id] }))]);
  assert.deepEqual(res.map((r) => r.status).sort(), [201, 409]);
});

test('rejet avec motif : la pièce quitte la file, reste listée en rejetée ; pièce jointe non rejetable ; contenu fermé', async () => {
  const p = (await upload(secAC, { entity_id: AC }, PDF)).body.data;
  assert.equal((await secAC.del(`/api/pieces/${p.id}`, {})).status, 400, 'motif obligatoire');
  const r = await secAC.del(`/api/pieces/${p.id}`, { reason: 'Publicité' });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.status, 'rejetee');
  assert.equal(r.body.data.reject_reason, 'Publicité');
  assert.ok(!(await secAC.get(`/api/pieces?entity_id=${AC}`)).body.data.some((x) => x.id === p.id));
  assert.ok((await secAC.get(`/api/pieces?entity_id=${AC}&status=rejetee`)).body.data.some((x) => x.id === p.id));
  assert.equal((await secAC.del(`/api/pieces/${p.id}`, { reason: 'Encore' })).body.code, 'CANCELLED');
  assert.equal((await raw(secAC, p.id)).status, 409);
  const row = getDb().prepare('SELECT storage_name FROM pieces WHERE id = ?').get(p.id);
  assert.ok(fs.existsSync(path.join(FILES_DIR, row.storage_name)), 'le fichier reste jusqu’à la purge de l’étape 12');
  const q = (await upload(secAC, { entity_id: AC }, PDF)).body.data;
  await secAC.post('/api/mails', mail({ piece_ids: [q.id] }));
  const attached = await secAC.del(`/api/pieces/${q.id}`, { reason: 'Erreur' });
  assert.equal(attached.status, 409);
  assert.equal(attached.body.code, 'PIECE_ATTACHED');
  assert.equal((await agentAC.del(`/api/pieces/${q.id}`, { reason: 'x' })).status, 403);
});

test('ajout d’un fichier à un courrier enregistré : position suivante ; refusé sur un courrier annulé ou d’une autre entité', async () => {
  const p = (await upload(secAC, { entity_id: AC }, PDF)).body.data;
  const m = (await secAC.post('/api/mails', mail({ piece_ids: [p.id] }))).body.data;
  const add = await upload(secAC, { mail_id: m.id }, PNG, 'annexe.png', { type: 'image/png' });
  assert.equal(add.status, 201, JSON.stringify(add.body));
  assert.equal(add.body.data.status, 'rattachee');
  assert.equal(add.body.data.position, 2);
  const list = (await secAC.get(`/api/pieces?mail_id=${m.id}`)).body.data;
  assert.deepEqual(list.map((x) => x.position), [1, 2]);
  assert.equal((await upload(secCPAS, { mail_id: m.id }, PDF)).status, 403);
  assert.equal((await upload(secAC, { mail_id: m.id, entity_id: CPAS }, PDF)).status, 409);
  await secAC.del(`/api/mails/${m.id}`, { reason: 'Doublon' });
  assert.equal((await upload(secAC, { mail_id: m.id }, PDF)).body.code, 'CANCELLED');
  const audit = getDb().prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'piece.add' AND entity_id = ?").get(add.body.data.id).n;
  assert.equal(audit, 1);
});

test('fiche : rend ses pièces et s’inscrit au journal ; la correction d’un champ ne compte pas comme une consultation', async () => {
  const p = (await upload(secAC, { entity_id: AC }, PDF)).body.data;
  const m = (await secAC.post('/api/mails', mail({ piece_ids: [p.id] }))).body.data;
  const count = () => getDb().prepare("SELECT COUNT(*) AS n FROM consultations WHERE mail_id = ? AND action = 'fiche'").get(m.id).n;
  assert.equal(count(), 0, 'l’enregistrement n’est pas une consultation');
  const f = await secAC.get(`/api/mails/${m.id}`);
  assert.equal(f.body.data.pieces[0].id, p.id);
  assert.equal(count(), 1);
  await secAC.put(`/api/mails/${m.id}`, { notes: 'Note' });
  assert.equal(count(), 1);
  const listed = (await secAC.get(`/api/mails?entity_id=${AC}&q=${encodeURIComponent(m.number)}`)).body.data[0];
  assert.equal(listed.files_count, 1);
  assert.equal(listed.pieces, undefined, 'la liste ne charge pas les pièces');
});

test('journal des consultations : lu par l’auditeur sans contenu du courrier ; refusé aux autres rôles', async () => {
  const p = (await upload(secAC, { entity_id: AC }, PDF, 'Certificat médical fictif.pdf')).body.data;
  const m = (await secAC.post('/api/mails', mail({ piece_ids: [p.id], subject: 'Objet confidentiel fictif' }))).body.data;
  await secAC.get(`/api/mails/${m.id}`);
  await raw(secAC, p.id);
  const j = await audAC.get(`/api/consultations?mail_number=${m.number}`);
  assert.equal(j.status, 200, JSON.stringify(j.body));
  assert.deepEqual(j.body.data.map((x) => x.action).sort(), ['fiche', 'piece']);
  assert.ok(j.body.data.every((x) => x.mail_number === m.number && x.user_last_name === 'Nom' && x.channel === 'api'));
  assert.doesNotMatch(JSON.stringify(j.body), /Objet confidentiel|Certificat/, 'ni objet ni nom de fichier');
  assert.equal((await audAC.get(`/api/mails/${m.id}`)).status, 403, 'l’auditeur ne lit pas le courrier');
  assert.equal((await raw(audAC, p.id)).status, 403);
  assert.equal((await audAC.get(`/api/consultations?entity_id=${CPAS}`)).status, 403);
  assert.equal((await secAC.get('/api/consultations')).status, 403);
  assert.equal((await admin.get('/api/consultations')).status, 403);
  const today = new Date().toISOString().slice(0, 10);
  assert.ok((await audAC.get(`/api/consultations?from=2000-01-01&to=2999-12-31&mail_number=${m.number}`)).body.data.length === 2);
  assert.equal((await audAC.get(`/api/consultations?from=2001-01-01&to=2001-01-02&mail_number=${m.number}`)).body.data.length, 0);
  assert.equal((await audAC.get(`/api/consultations?from=${today}x`)).status, 400);
});

test('modification d’une pièce : nom affiché et ordre ; pièce rejetée figée', async () => {
  const p = (await upload(secAC, { entity_id: AC }, PDF)).body.data;
  const r = await secAC.put(`/api/pieces/${p.id}`, { original_name: 'Lettre recto.pdf' });
  assert.equal(r.body.data.original_name, 'Lettre recto.pdf');
  assert.equal((await secAC.put(`/api/pieces/${p.id}`, { storage_name: 'x' })).status, 400, 'champ interne refusé');
  await secAC.del(`/api/pieces/${p.id}`, { reason: 'Erreur de dépôt' });
  assert.equal((await secAC.put(`/api/pieces/${p.id}`, { original_name: 'Autre.pdf' })).body.code, 'CANCELLED');
});

test('paramètres : réservés à l’administrateur, bornés, journalisés, taille publiée pour l’écran', async () => {
  assert.equal((await secAC.get('/api/settings')).status, 403);
  assert.equal((await secAC.put('/api/settings', { pieces_max_mb: 10 })).status, 403);
  assert.equal((await admin.put('/api/settings', { pieces_max_mb: 51 })).status, 400, 'plafond technique de 50 Mo');
  assert.equal((await admin.put('/api/settings', { pieces_max_mb: 20, autre: 1 })).status, 400);
  const g = await admin.get('/api/settings');
  assert.equal(g.body.data.defaults.pieces_max_mb, 50);
  const u = await admin.put('/api/settings', { pieces_max_mb: 20 });
  assert.equal(u.body.data.pieces_max_mb, 20);
  assert.equal(Number((await client(srv.base).get('/api/settings/public')).body.data.pieces.max_mb), 20);
  const audit = getDb().prepare("SELECT details_json FROM audit_log WHERE action = 'settings.update' ORDER BY id DESC").get();
  assert.match(audit.details_json, /"from":50,"to":20/);
  await admin.put('/api/settings', { pieces_max_mb: 50 });
});

test('MCP : dépôt en base64, lecture journalisée en canal mcp, plafond de lecture, rejet en deux appels', async () => {
  const c = parse(await secAC.mcp('tools/call', { name: 'create_piece', arguments: { entity_id: AC, file_name: 'par-assistant.pdf', content_base64: PDF.toString('base64') } }));
  assert.equal(c.data.status, 'a_enregistrer');
  assert.equal(c.data.sha256, sha(PDF));
  const exe = await secAC.mcp('tools/call', { name: 'create_piece', arguments: { entity_id: AC, file_name: 'x.pdf', content_base64: EXE.toString('base64') } });
  assert.equal(JSON.parse(exe.body.result.content[0].text).code, 'FILE_TYPE');
  const r = parse(await secAC.mcp('tools/call', { name: 'read_piece_content', arguments: { id: c.data.id } }));
  assert.equal(Buffer.from(r.data.content_base64, 'base64').toString(), PDF.toString());
  const k = getDb().prepare("SELECT channel FROM consultations WHERE piece_id = ? ORDER BY id DESC").get(c.data.id);
  assert.equal(k.channel, 'mcp');
  const cpas = await secCPAS.mcp('tools/call', { name: 'read_piece_content', arguments: { id: c.data.id } });
  assert.equal(JSON.parse(cpas.body.result.content[0].text).code, 'FORBIDDEN');
  await admin.put('/api/settings', { pieces_mcp_read_max_mb: 1 });
  const big = (await upload(secAC, { entity_id: AC }, bigPdf(1.2 * 1024 * 1024))).body.data;
  const tooBig = await secAC.mcp('tools/call', { name: 'read_piece_content', arguments: { id: big.id } });
  assert.equal(JSON.parse(tooBig.body.result.content[0].text).code, 'PIECE_TOO_LARGE_MCP');
  await admin.put('/api/settings', { pieces_mcp_read_max_mb: 5 });
  const direct = await secAC.mcp('tools/call', { name: 'reject_piece', arguments: { id: c.data.id, reason: 'x' } });
  assert.equal(direct.body.result.isError, true);
  const prep = parse(await secAC.mcp('tools/call', { name: 'prepare_reject_piece', arguments: { id: c.data.id, reason: 'Doublon' } }));
  const done = parse(await secAC.mcp('tools/call', { name: 'confirm_reject_piece', arguments: { confirmation_token: prep.data.confirmation_token } }));
  assert.equal(done.data.status, 'rejetee');
  const m = (await secAC.post('/api/mails', mail())).body.data;
  await secAC.mcp('tools/call', { name: 'get_mail', arguments: { id: m.id } });
  assert.equal(getDb().prepare("SELECT channel FROM consultations WHERE mail_id = ? AND action = 'fiche'").get(m.id).channel, 'mcp');
  const j = parse(await audAC.mcp('tools/call', { name: 'list_consultations', arguments: { mail_number: m.number } }));
  assert.equal(j.data.rows.length, 1);
});

test('fichiers temporaires d’envois interrompus : effacés après une heure, les récents gardés', () => {
  fs.mkdirSync(piecesSvc.TMP_DIR, { recursive: true });
  const old = path.join(piecesSvc.TMP_DIR, 'up-ancien');
  const recent = path.join(piecesSvc.TMP_DIR, 'up-recent');
  fs.writeFileSync(old, 'x');
  fs.writeFileSync(recent, 'y');
  const t = (Date.now() - 2 * 60 * 60 * 1000) / 1000;
  fs.utimesSync(old, t, t);
  assert.equal(piecesSvc.cleanTmp(), 1);
  assert.ok(!fs.existsSync(old));
  assert.ok(fs.existsSync(recent));
  fs.rmSync(recent);
});

test('contrat OpenAPI : dépôt en multipart avec le champ file, contenu décrit hors enveloppe', async () => {
  const o = (await admin.get('/api/openapi.json')).body;
  const post = o.paths['/api/pieces'].post;
  assert.ok(post.requestBody.content['multipart/form-data'].schema.properties.file);
  assert.match(o.paths['/api/pieces/{id}/contenu'].get.responses[200].description, /hors enveloppe/);
  assert.ok(o.paths['/api/consultations'].get);
  assert.ok(o.paths['/api/settings'].put);
});
