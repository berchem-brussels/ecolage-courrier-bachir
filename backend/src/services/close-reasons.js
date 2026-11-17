/**
 * Motifs de clôture, propres à chaque entité (CDC CE-073) : répondu, traité sans réponse, transmis à l'extérieur,
 * classé sans suite à l'installation, puis modifiables. Un motif désactivé reste lisible sur les courriers déjà clos.
 * Lecture : toute personne connectée. Écriture : administrateur ou gestionnaire de l'entité.
 */
const { getDb, safeBuildUpdate } = require('../database');
const { AppError } = require('../envelope');
const { logAudit } = require('../audit');
const { assertTypeManager } = require('../rights');

const COLUMNS = 'r.id, r.entity_id, e.code AS entity_code, r.label_fr, r.label_nl, r.sort_order, r.is_active, r.cancel_reason, r.created_at, r.updated_at';

function load(id) {
  const r = getDb().prepare(`SELECT ${COLUMNS} FROM close_reasons r JOIN entities e ON e.id = r.entity_id WHERE r.id = ?`).get(id);
  if (!r) throw new AppError(404, 'NOT_FOUND');
  return r;
}

function list(user, { limit = 50, offset = 0, q, entity_id, is_active } = {}) {
  const where = [];
  const params = [];
  if (entity_id) { where.push('r.entity_id = ?'); params.push(entity_id); }
  if (is_active !== undefined) { where.push('r.is_active = ?'); params.push(is_active); }
  if (q) { where.push('(r.label_fr LIKE ? OR r.label_nl LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const db = getDb();
  const total = db.prepare(`SELECT COUNT(*) AS n FROM close_reasons r ${clause}`).get(...params).n;
  const rows = db.prepare(`SELECT ${COLUMNS} FROM close_reasons r JOIN entities e ON e.id = r.entity_id ${clause}
    ORDER BY r.entity_id, r.sort_order, r.label_fr LIMIT ? OFFSET ?`).all(...params, limit, offset);
  return { rows, pagination: { total, limit, offset } };
}

const get = (user, id) => load(id);

function create(user, data, channel = 'api') {
  assertTypeManager(user, data.entity_id);
  if (!getDb().prepare('SELECT 1 FROM entities WHERE id = ?').get(data.entity_id)) throw new AppError(409, 'REFERENCE_INVALID');
  const next = getDb().prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM close_reasons WHERE entity_id = ?').get(data.entity_id).n;
  const r = getDb().prepare(`INSERT INTO close_reasons (entity_id, label_fr, label_nl, sort_order, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?)`).run(data.entity_id, data.label_fr, data.label_nl || null, data.sort_order ?? next, user.id, user.id);
  logAudit(user.id, 'close_reason.create', 'close_reason', r.lastInsertRowid, data, channel);
  return load(r.lastInsertRowid);
}

function update(user, id, data, channel = 'api') {
  const r = load(id);
  assertTypeManager(user, r.entity_id);
  const { sets, params } = safeBuildUpdate(data, ['id', 'entity_id', 'cancel_reason']);
  if (sets.length) {
    getDb().prepare(`UPDATE close_reasons SET ${sets.join(', ')}, updated_by = ?, updated_at = datetime('now') WHERE id = ?`).run(...params, user.id, id);
    logAudit(user.id, 'close_reason.update', 'close_reason', id, data, channel);
  }
  return load(id);
}

/** Désactivation avec motif ; rien n'est supprimé, les courriers déjà clos gardent leur motif. */
function cancel(user, id, reason, channel = 'api') {
  const r = load(id);
  assertTypeManager(user, r.entity_id);
  if (!r.is_active) throw new AppError(409, 'CANCELLED');
  getDb().prepare("UPDATE close_reasons SET is_active = 0, cancel_reason = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?").run(reason, user.id, id);
  logAudit(user.id, 'close_reason.deactivate', 'close_reason', id, { reason }, channel);
  return load(id);
}

module.exports = { list, get, create, update, cancel };
