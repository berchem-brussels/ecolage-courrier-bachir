/**
 * Types de courrier, propres à chaque entité (CDC CR-021). Les délais, l'accusé de réception et la conservation
 * par type arrivent aux étapes suivantes (lot L2).
 * Lecture : toute personne connectée. Écriture : administrateur ou gestionnaire de l'entité.
 */
const { getDb, safeBuildUpdate } = require('../database');
const { AppError } = require('../envelope');
const { logAudit } = require('../audit');
const { assertTypeManager } = require('../rights');

const COLUMNS = 't.id, t.entity_id, e.code AS entity_code, t.label_fr, t.label_nl, t.nl_to_validate, t.is_demo, t.is_active, t.cancel_reason, t.created_at, t.updated_at';

function load(id) {
  const t = getDb().prepare(`SELECT ${COLUMNS} FROM mail_types t JOIN entities e ON e.id = t.entity_id WHERE t.id = ?`).get(id);
  if (!t) throw new AppError(404, 'NOT_FOUND');
  return t;
}

function list(user, { limit = 50, offset = 0, q, entity_id, is_active } = {}) {
  const where = [];
  const params = [];
  if (entity_id) { where.push('t.entity_id = ?'); params.push(entity_id); }
  if (is_active !== undefined) { where.push('t.is_active = ?'); params.push(is_active); }
  if (q) { where.push('(t.label_fr LIKE ? OR t.label_nl LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const db = getDb();
  const total = db.prepare(`SELECT COUNT(*) AS n FROM mail_types t ${clause}`).get(...params).n;
  const rows = db.prepare(`SELECT ${COLUMNS} FROM mail_types t JOIN entities e ON e.id = t.entity_id ${clause}
    ORDER BY t.entity_id, t.label_fr LIMIT ? OFFSET ?`).all(...params, limit, offset);
  return { rows, pagination: { total, limit, offset } };
}

const get = (user, id) => load(id);

function create(user, data, channel = 'api') {
  assertTypeManager(user, data.entity_id);
  if (!getDb().prepare('SELECT 1 FROM entities WHERE id = ?').get(data.entity_id)) throw new AppError(409, 'REFERENCE_INVALID');
  const r = getDb().prepare(`INSERT INTO mail_types (entity_id, label_fr, label_nl, nl_to_validate, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?)`).run(data.entity_id, data.label_fr, data.label_nl || null, data.nl_to_validate ? 1 : 0, user.id, user.id);
  logAudit(user.id, 'mail_type.create', 'mail_type', r.lastInsertRowid, data, channel);
  return load(r.lastInsertRowid);
}

function update(user, id, data, channel = 'api') {
  const t = load(id);
  assertTypeManager(user, t.entity_id);
  const cols = { ...data };
  if (cols.nl_to_validate !== undefined) cols.nl_to_validate = cols.nl_to_validate ? 1 : 0;
  const { sets, params } = safeBuildUpdate(cols, ['id', 'entity_id', 'is_demo', 'cancel_reason']);
  if (sets.length) {
    getDb().prepare(`UPDATE mail_types SET ${sets.join(', ')}, updated_by = ?, updated_at = datetime('now') WHERE id = ?`).run(...params, user.id, id);
    logAudit(user.id, 'mail_type.update', 'mail_type', id, data, channel);
  }
  return load(id);
}

function cancel(user, id, reason, channel = 'api') {
  const t = load(id);
  assertTypeManager(user, t.entity_id);
  if (!t.is_active) throw new AppError(409, 'CANCELLED');
  getDb().prepare("UPDATE mail_types SET is_active = 0, cancel_reason = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?").run(reason, user.id, id);
  logAudit(user.id, 'mail_type.deactivate', 'mail_type', id, { reason }, channel);
  return load(id);
}

module.exports = { list, get, create, update, cancel };
