/**
 * Pièces : fichiers déposés pour le courrier entrant (CDC CE-020, CE-025, CE-030 en partie, CE-124, CG-005, CA-007).
 * - Dépôt dans la file « À enregistrer » d'une entité, ou ajout à un courrier déjà enregistré (décision Q5 du 20/10/2026).
 * - Liste fermée de types vérifiés sur les premiers octets : PDF, JPEG, PNG (décision D-24 du 20/10/2026).
 *   Le TIFF est refusé avec sa raison propre. Le type annoncé par le navigateur et l'extension ne comptent pas.
 * - Taille plafonnée par le paramètre pieces.max_mb (défaut 50 Mo, décision D-23 du 20/10/2026).
 * - Nom de fichier généré par le serveur, stockage hors racine web sous FILES_DIR, empreinte SHA-256.
 * - Une pièce de la file se rejette avec motif ; le fichier reste sur le disque jusqu'à la purge de l'étape 12
 *   (décision Q4 du 20/10/2026). Une pièce rattachée ne se retire pas dans cette version (étape 6).
 * - Toute lecture du contenu s'inscrit au journal des consultations.
 * Aucune suppression réelle dans cette version : l'effacement suivra les durées de conservation (CG-010, étape 20).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getDb } = require('../database');
const { AppError } = require('../envelope');
const { logAudit } = require('../audit');
const { assertRegister, registerEntities } = require('../rights');
const { instanceSettings } = require('../instance');
const { FILES_DIR } = require('../config');
const consultations = require('./consultations');

const TMP_DIR = path.join(FILES_DIR, 'tmp');

/** Signatures des types acceptés (premiers octets). */
const SIGNATURES = [
  { mime: 'application/pdf', ext: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  { mime: 'image/jpeg', ext: 'jpg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
];
const TIFF = [[0x49, 0x49, 0x2a, 0x00], [0x4d, 0x4d, 0x00, 0x2a]];
const startsWith = (buf, bytes) => bytes.every((b, i) => buf[i] === b);

/** Type réel d'un fichier d'après ses premiers octets : { mime, ext }, 'tiff' ou null. */
function detectType(head) {
  const hit = SIGNATURES.find((s) => startsWith(head, s.bytes));
  if (hit) return { mime: hit.mime, ext: hit.ext };
  if (TIFF.some((t) => startsWith(head, t))) return 'tiff';
  return null;
}

/** Paramètres en vigueur : taille maximale d'un dépôt et d'une lecture par MCP, en octets. */
function limits() {
  const p = instanceSettings().pieces || {};
  return { maxBytes: Number(p.max_mb) * 1024 * 1024, mcpReadBytes: Number(p.mcp_read_max_mb) * 1024 * 1024, maxMb: Number(p.max_mb) };
}

/** Nom d'origine nettoyé : sans chemin, sans caractère de contrôle, 200 caractères au plus. Il ne sert qu'à l'affichage. */
function cleanName(name) {
  const base = String(name || '').split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return (base || 'fichier').slice(0, 200);
}

/** Chemin absolu d'une pièce, vérifié sous FILES_DIR (aucun chemin ne vient du client). */
function absolutePath(storageName) {
  const root = path.resolve(FILES_DIR);
  const p = path.resolve(root, storageName);
  if (!p.startsWith(root + path.sep)) throw new AppError(404, 'NOT_FOUND');
  return p;
}

function sha256File(file) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  try {
    const buf = Buffer.alloc(1024 * 1024);
    let n;
    while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) hash.update(buf.subarray(0, n));
  } finally { fs.closeSync(fd); }
  return hash.digest('hex');
}

function readHead(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const head = Buffer.alloc(16);
    fs.readSync(fd, head, 0, 16, 0);
    return head;
  } finally { fs.closeSync(fd); }
}

const COLUMNS = `p.id, p.entity_id, e.code AS entity_code, p.mail_id, m.number AS mail_number, p.status, p.original_name, p.mime,
  p.size_bytes, p.sha256, p.position, p.origin, p.reject_reason, p.created_by, u.first_name AS created_by_first_name,
  u.last_name AS created_by_last_name, p.created_at, p.updated_at`;
const FROM = `FROM pieces p JOIN entities e ON e.id = p.entity_id LEFT JOIN mails m ON m.id = p.mail_id
  LEFT JOIN users u ON u.id = p.created_by`;

function load(id) {
  const p = getDb().prepare(`SELECT ${COLUMNS} ${FROM} WHERE p.id = ?`).get(id);
  if (!p) throw new AppError(404, 'NOT_FOUND');
  return p;
}

/** Pièce lisible par la personne : rôle de registre dans l'entité de la pièce. */
function readable(user, id) {
  const p = load(id);
  assertRegister(user, p.entity_id);
  return p;
}

function mailOf(mailId) {
  const m = getDb().prepare('SELECT id, entity_id, status, number FROM mails WHERE id = ?').get(mailId);
  if (!m) throw new AppError(404, 'NOT_FOUND');
  return m;
}

/** File « À enregistrer » ou pièces d'un courrier, selon les filtres ; limitée aux entités dont la personne tient le registre. */
function list(user, { limit = 50, offset = 0, entity_id, status, mail_id } = {}) {
  const where = [];
  const params = [];
  if (mail_id) {
    const m = mailOf(mail_id);
    assertRegister(user, m.entity_id);
    where.push('p.mail_id = ?');
    params.push(mail_id);
  } else {
    const allowed = registerEntities(user);
    if (entity_id && !allowed.includes(Number(entity_id))) throw new AppError(403, 'FORBIDDEN');
    const entities = entity_id ? [Number(entity_id)] : allowed;
    if (entities.length === 0) return { rows: [], pagination: { total: 0, limit, offset } };
    where.push(`p.entity_id IN (${entities.map(() => '?').join(', ')})`);
    params.push(...entities);
    where.push('p.status = ?');
    params.push(status || 'a_enregistrer');
  }
  const clause = `WHERE ${where.join(' AND ')}`;
  const db = getDb();
  const total = db.prepare(`SELECT COUNT(*) AS n FROM pieces p ${clause}`).get(...params).n;
  const rows = mail_id
    ? db.prepare(`SELECT ${COLUMNS} ${FROM} ${clause} ORDER BY p.position, p.id LIMIT ? OFFSET ?`).all(...params, limit, offset)
    : db.prepare(`SELECT ${COLUMNS} ${FROM} ${clause} ORDER BY p.id LIMIT ? OFFSET ?`).all(...params, limit, offset);
  return { rows, pagination: { total, limit, offset } };
}

/** Pièces rattachées à un courrier, dans leur ordre (lecture interne, droits contrôlés par l'appelant). */
function listForMail(mailId) {
  return getDb().prepare(`SELECT ${COLUMNS} ${FROM} WHERE p.mail_id = ? AND p.status = 'rattachee' ORDER BY p.position, p.id`).all(mailId);
}

function get(user, id) {
  return readable(user, id);
}

/**
 * Enregistre un fichier reçu dans un fichier temporaire de TMP_DIR : contrôles, déplacement sous un nom généré, ligne en base.
 * Le fichier temporaire est toujours effacé, que le dépôt aboutisse ou non.
 */
function storeFromTemp(user, { entity_id, mail_id }, tmpPath, originalName, channel = 'api') {
  let finalPath = null;
  try {
    let entityId = entity_id;
    let mail = null;
    if (mail_id) {
      mail = mailOf(mail_id);
      assertRegister(user, mail.entity_id);
      if (mail.status === 'annule') throw new AppError(409, 'CANCELLED');
      if (entity_id && Number(entity_id) !== mail.entity_id) throw new AppError(409, 'REFERENCE_INVALID');
      entityId = mail.entity_id;
    } else {
      if (!entity_id) throw new AppError(400, 'VALIDATION', ['entity_id: requis sans mail_id']);
      assertRegister(user, entity_id);
      const e = getDb().prepare('SELECT is_active FROM entities WHERE id = ?').get(entity_id);
      if (!e || !e.is_active) throw new AppError(409, 'REFERENCE_INVALID');
    }
    if (!tmpPath || !fs.existsSync(tmpPath)) throw new AppError(400, 'FILE_MISSING');
    const size = fs.statSync(tmpPath).size;
    const { maxBytes, maxMb } = limits();
    if (size === 0) throw new AppError(400, 'FILE_EMPTY');
    if (size > maxBytes) throw new AppError(413, 'FILE_TOO_LARGE', [`max_mb: ${maxMb}`]);
    const type = detectType(readHead(tmpPath));
    if (type === 'tiff') throw new AppError(415, 'FILE_TIFF');
    if (!type) throw new AppError(415, 'FILE_TYPE');
    const sha = sha256File(tmpPath);
    const now = new Date();
    const sub = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const storageName = `${sub}/${crypto.randomBytes(16).toString('hex')}.${type.ext}`;
    finalPath = absolutePath(storageName);
    fs.mkdirSync(path.dirname(finalPath), { recursive: true });
    fs.renameSync(tmpPath, finalPath);
    const db = getDb();
    const id = db.transaction(() => {
      const position = mail ? (db.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS n FROM pieces WHERE mail_id = ?').get(mail.id).n) : 1;
      return db.prepare(`INSERT INTO pieces (entity_id, mail_id, status, storage_name, original_name, mime, size_bytes, sha256, position,
        created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(entityId, mail ? mail.id : null, mail ? 'rattachee' : 'a_enregistrer',
        storageName, cleanName(originalName), type.mime, size, sha, position, user.id, user.id).lastInsertRowid;
    })();
    const p = load(id);
    logAudit(user.id, mail ? 'piece.add' : 'piece.deposit', 'piece', id, { entity_id: entityId, mail_id: mail ? mail.id : null, mime: type.mime, size_bytes: size, sha256: sha }, channel);
    finalPath = null;
    return p;
  } finally {
    if (tmpPath && fs.existsSync(tmpPath)) fs.rmSync(tmpPath, { force: true });
    if (finalPath && fs.existsSync(finalPath)) fs.rmSync(finalPath, { force: true });
  }
}

/** Dépôt depuis un contenu en mémoire (outil MCP) : passe par un fichier temporaire et les mêmes contrôles. */
function storeFromBuffer(user, target, buffer, originalName, channel = 'mcp') {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const tmp = path.join(TMP_DIR, `mcp-${crypto.randomBytes(12).toString('hex')}`);
  fs.writeFileSync(tmp, buffer);
  return storeFromTemp(user, target, tmp, originalName, channel);
}

/**
 * multer 1.x lit le nom du fichier en latin-1 alors que les navigateurs l'envoient en UTF-8 : « Pièce » arrive en
 * « PiÃ¨ce ». Le nom est relu en UTF-8 quand cette lecture est valide ; sinon il est gardé tel quel.
 */
function multipartName(name) {
  const s = String(name || '');
  const utf8 = Buffer.from(s, 'latin1').toString('utf8');
  return utf8.includes('\uFFFD') || Buffer.from(utf8, 'utf8').toString('latin1') !== s ? s : utf8;
}

/** Création par l'API : le fichier arrive par multer dans TMP_DIR (route POST /api/pieces). */
function create(user, data, channel = 'api') {
  if (!data.file) throw new AppError(400, 'FILE_MISSING');
  return storeFromTemp(user, { entity_id: data.entity_id, mail_id: data.mail_id }, data.file.path, multipartName(data.file.originalname), channel);
}

/** Modification : nom affiché et ordre dans le courrier. Le fichier lui-même ne change jamais. */
function update(user, id, data, channel = 'api') {
  const p = readable(user, id);
  if (p.status === 'rejetee') throw new AppError(409, 'CANCELLED');
  const sets = [];
  const params = [];
  if (data.original_name !== undefined) { sets.push('original_name = ?'); params.push(cleanName(data.original_name)); }
  if (data.position !== undefined) { sets.push('position = ?'); params.push(data.position); }
  if (sets.length) {
    getDb().prepare(`UPDATE pieces SET ${sets.join(', ')}, updated_by = ?, updated_at = datetime('now') WHERE id = ?`).run(...params, user.id, id);
    logAudit(user.id, 'piece.update', 'piece', id, { fields: Object.keys(data) }, channel);
  }
  return load(id);
}

/** Rejet d'une pièce de la file avec motif. Une pièce rattachée à un courrier ne se rejette pas. */
function cancel(user, id, reason, channel = 'api') {
  const p = readable(user, id);
  if (p.status === 'rejetee') throw new AppError(409, 'CANCELLED');
  if (p.status === 'rattachee') throw new AppError(409, 'PIECE_ATTACHED');
  getDb().prepare("UPDATE pieces SET status = 'rejetee', reject_reason = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ? AND status = 'a_enregistrer'")
    .run(reason, user.id, id);
  logAudit(user.id, 'piece.reject', 'piece', id, { reason }, channel);
  return load(id);
}

/**
 * Lecture du contenu : droits, présence du fichier, inscription au journal des consultations.
 * Rend le chemin absolu et les informations d'en-tête ; la route ou l'outil MCP envoie le contenu.
 */
function content(user, id, channel = 'api') {
  const p = readable(user, id);
  if (p.status === 'rejetee') throw new AppError(409, 'CANCELLED');
  const row = getDb().prepare('SELECT storage_name FROM pieces WHERE id = ?').get(id);
  const file = absolutePath(row.storage_name);
  if (!fs.existsSync(file)) {
    console.error(`[PIECES] Fichier absent du disque pour la pièce ${id}`);
    throw new AppError(404, 'FILE_LOST');
  }
  consultations.record(user, { entity_id: p.entity_id, mail_id: p.mail_id, piece_id: p.id, action: 'piece' }, channel);
  return { file, mime: p.mime, original_name: p.original_name, size_bytes: p.size_bytes, piece: p };
}

/** Lecture par MCP : contenu en base64, plafonné par le paramètre pieces.mcp_read_max_mb. */
function contentBase64(user, id) {
  const p = readable(user, id);
  if (p.size_bytes > limits().mcpReadBytes) throw new AppError(413, 'PIECE_TOO_LARGE_MCP');
  const c = content(user, id, 'mcp');
  return { id: p.id, mail_number: p.mail_number, original_name: c.original_name, mime: c.mime, size_bytes: c.size_bytes, content_base64: fs.readFileSync(c.file).toString('base64') };
}

/**
 * Rattache des pièces de la file au courrier qui vient d'être enregistré, dans la transaction de l'enregistrement.
 * Une pièce déjà prise, rejetée ou d'une autre entité fait échouer tout l'enregistrement (aucun numéro consommé).
 */
function attachInTransaction(db, user, mailId, entityId, pieceIds) {
  const ids = [...new Set(pieceIds || [])];
  ids.forEach((pid, i) => {
    const r = db.prepare(`UPDATE pieces SET status = 'rattachee', mail_id = ?, position = ?, updated_by = ?, updated_at = datetime('now')
      WHERE id = ? AND entity_id = ? AND status = 'a_enregistrer'`).run(mailId, i + 1, user.id, pid, entityId);
    if (r.changes !== 1) throw new AppError(409, 'PIECE_UNAVAILABLE', [`piece_id: ${pid}`]);
  });
  return ids;
}

/** Efface les fichiers temporaires plus vieux qu'une heure (envois interrompus). Lancé au démarrage du serveur. */
function cleanTmp(maxAgeMs = 60 * 60 * 1000) {
  if (!fs.existsSync(TMP_DIR)) return 0;
  let n = 0;
  for (const f of fs.readdirSync(TMP_DIR)) {
    const p = path.join(TMP_DIR, f);
    try {
      if (Date.now() - fs.statSync(p).mtimeMs > maxAgeMs) { fs.rmSync(p, { force: true }); n += 1; }
    } catch (e) { /* fichier déjà retiré */ }
  }
  return n;
}

module.exports = {
  TMP_DIR, detectType, limits, cleanName, multipartName, list, listForMail, get, create, update, cancel, content, contentBase64,
  storeFromBuffer, attachInTransaction, cleanTmp,
};
