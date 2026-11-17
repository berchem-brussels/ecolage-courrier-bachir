/**
 * FAQ locale (standard v3.3, section 13.1) : questions et réponses ajoutées sans livraison, FR et NL, rattachées à un écran ou générales.
 * Lecture par toute personne connectée. Écriture par l'administrateur et par les gestionnaires du registre (décision du 03/11/2026,
 * écart E40) : l'administrateur ne lit pas les questions métier, il ne pourrait pas en tirer une entrée de FAQ.
 * Désactivation logique, auteur enregistré, journal d'audit sans le texte des questions.
 */
const { getDb, safeBuildUpdate } = require('../database');
const { AppError } = require('../envelope');
const { logAudit } = require('../audit');
const { rolesOf } = require('../rights');

const COLUMNS = 'id, topic_id, question_fr, question_nl, answer_fr, answer_nl, is_active, created_by, updated_by, created_at, updated_at';
/** Peut ajouter, corriger et retirer : administrateur, ou gestionnaire du registre d'une entité. */
const canManage = (user) => user.role === 'admin' || rolesOf(user).some((r) => r.role === 'gestionnaire');
const manager = (user) => { if (!canManage(user)) throw new AppError(403, 'FORBIDDEN'); };

function load(id) {
  const f = getDb().prepare(`SELECT ${COLUMNS} FROM help_faq WHERE id = ?`).get(id);
  if (!f) throw new AppError(404, 'NOT_FOUND');
  return f;
}

function list(user, { limit = 200, offset = 0, topic_id } = {}) {
  const where = [canManage(user) ? '1 = 1' : 'is_active = 1'];
  const params = [];
  if (topic_id) { where.push('topic_id = ?'); params.push(topic_id); }
  const clause = `WHERE ${where.join(' AND ')}`;
  const db = getDb();
  const total = db.prepare(`SELECT COUNT(*) AS n FROM help_faq ${clause}`).get(...params).n;
  const rows = db.prepare(`SELECT ${COLUMNS} FROM help_faq ${clause} ORDER BY topic_id, id LIMIT ? OFFSET ?`).all(...params, limit, offset);
  return { rows: rows.map((r) => ({ ...r, can_manage: canManage(user) })), pagination: { total, limit, offset } };
}
function get(user, id) {
  const f = load(id);
  if (!f.is_active && !canManage(user)) throw new AppError(404, 'NOT_FOUND');
  return { ...f, can_manage: canManage(user) };
}
function create(user, data, channel = 'api') {
  manager(user);
  const r = getDb().prepare('INSERT INTO help_faq (topic_id, question_fr, question_nl, answer_fr, answer_nl, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(data.topic_id || null, data.question_fr, data.question_nl, data.answer_fr, data.answer_nl, user.id, user.id);
  logAudit(user.id, 'faq.create', 'faq', r.lastInsertRowid, { topic_id: data.topic_id || null }, channel);
  return get(user, r.lastInsertRowid);
}
function update(user, id, data, channel = 'api') {
  manager(user);
  load(id);
  const { sets, params } = safeBuildUpdate(data, ['id', 'created_by', 'updated_by']);
  if (sets.length) {
    getDb().prepare(`UPDATE help_faq SET ${sets.join(', ')}, updated_by = ?, updated_at = datetime('now') WHERE id = ?`).run(...params, user.id, id);
    logAudit(user.id, data.is_active === 0 ? 'faq.deactivate' : 'faq.update', 'faq', id, { fields: Object.keys(data) }, channel);
  }
  return get(user, id);
}
function deactivate(user, id, channel = 'api') { return update(user, id, { is_active: 0 }, channel); }

module.exports = { list, get, create, update, deactivate, canManage };
