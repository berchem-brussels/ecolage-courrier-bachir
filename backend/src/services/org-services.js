/**
 * Services destinataires du courrier. Un service appartient à une ou plusieurs entités (service commun AC et CPAS,
 * CDC CR-022) et peut avoir un service parent (département). Le nom NL peut manquer ou rester « à valider » :
 * le standard interdit la traduction automatique d'un nom officiel (section 11.1).
 * Lecture : toute personne connectée. Écriture : administrateur.
 */
const { getDb, safeBuildUpdate } = require('../database');
const { AppError } = require('../envelope');
const { logAudit } = require('../audit');
const { assertAdmin } = require('../rights');

const COLUMNS = 's.id, s.name_fr, s.name_nl, s.nl_to_validate, s.parent_id, p.name_fr AS parent_name_fr, p.name_nl AS parent_name_nl, s.is_active, s.cancel_reason, s.created_at, s.updated_at';

function withEntities(rows) {
  const stmt = getDb().prepare('SELECT entity_id FROM org_service_entities WHERE service_id = ? ORDER BY entity_id');
  return rows.map((r) => ({ ...r, entity_ids: stmt.all(r.id).map((x) => x.entity_id) }));
}

function load(id) {
  const s = getDb().prepare(`SELECT ${COLUMNS} FROM org_services s LEFT JOIN org_services p ON p.id = s.parent_id WHERE s.id = ?`).get(id);
  if (!s) throw new AppError(404, 'NOT_FOUND');
  return withEntities([s])[0];
}

function list(user, { limit = 50, offset = 0, q, entity_id, is_active } = {}) {
  const where = [];
  const params = [];
  if (is_active !== undefined) { where.push('s.is_active = ?'); params.push(is_active); }
  if (entity_id) { where.push('s.id IN (SELECT service_id FROM org_service_entities WHERE entity_id = ?)'); params.push(entity_id); }
  if (q) { where.push('(s.name_fr LIKE ? OR s.name_nl LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const db = getDb();
  const total = db.prepare(`SELECT COUNT(*) AS n FROM org_services s ${clause}`).get(...params).n;
  const rows = db.prepare(`SELECT ${COLUMNS} FROM org_services s LEFT JOIN org_services p ON p.id = s.parent_id ${clause}
    ORDER BY s.name_fr LIMIT ? OFFSET ?`).all(...params, limit, offset);
  return { rows: withEntities(rows), pagination: { total, limit, offset } };
}

const get = (user, id) => load(id);

function checkEntities(ids) {
  if (!Array.isArray(ids) || ids.length === 0) throw new AppError(400, 'SERVICE_ENTITY_REQUIRED');
  for (const e of ids) if (!getDb().prepare('SELECT 1 FROM entities WHERE id = ?').get(e)) throw new AppError(409, 'REFERENCE_INVALID');
}

function checkParent(id, parentId) {
  if (parentId === null || parentId === undefined) return;
  if (parentId === id) throw new AppError(409, 'PARENT_INVALID');
  let cur = parentId;
  for (let i = 0; i < 20 && cur; i += 1) {
    const row = getDb().prepare('SELECT parent_id FROM org_services WHERE id = ?').get(cur);
    if (!row) throw new AppError(409, 'REFERENCE_INVALID');
    if (row.parent_id === id) throw new AppError(409, 'PARENT_INVALID');
    cur = row.parent_id;
  }
}

function setEntities(id, ids) {
  const db = getDb();
  db.prepare('DELETE FROM org_service_entities WHERE service_id = ?').run(id);
  for (const e of [...new Set(ids)]) db.prepare('INSERT INTO org_service_entities (service_id, entity_id) VALUES (?, ?)').run(id, e);
}

function create(user, data, channel = 'api') {
  assertAdmin(user);
  checkEntities(data.entity_ids);
  checkParent(null, data.parent_id);
  const db = getDb();
  const id = db.transaction(() => {
    const r = db.prepare(`INSERT INTO org_services (name_fr, name_nl, nl_to_validate, parent_id, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?)`).run(data.name_fr, data.name_nl || null, data.nl_to_validate ? 1 : 0, data.parent_id || null, user.id, user.id);
    setEntities(r.lastInsertRowid, data.entity_ids);
    return r.lastInsertRowid;
  })();
  logAudit(user.id, 'service.create', 'service', id, data, channel);
  return load(id);
}

function update(user, id, data, channel = 'api') {
  assertAdmin(user);
  load(id);
  if (data.entity_ids !== undefined) checkEntities(data.entity_ids);
  if (data.parent_id !== undefined) checkParent(id, data.parent_id);
  const { entity_ids: entityIds, ...cols } = data;
  if (cols.nl_to_validate !== undefined) cols.nl_to_validate = cols.nl_to_validate ? 1 : 0;
  const { sets, params } = safeBuildUpdate(cols, ['id', 'cancel_reason']);
  const db = getDb();
  db.transaction(() => {
    if (sets.length) db.prepare(`UPDATE org_services SET ${sets.join(', ')}, updated_by = ?, updated_at = datetime('now') WHERE id = ?`).run(...params, user.id, id);
    if (entityIds !== undefined) setEntities(id, entityIds);
  })();
  logAudit(user.id, 'service.update', 'service', id, data, channel);
  return load(id);
}

/** Désactivation avec motif : le service reste en base pour l'historique. */
function cancel(user, id, reason, channel = 'api') {
  assertAdmin(user);
  const s = load(id);
  if (!s.is_active) throw new AppError(409, 'CANCELLED');
  getDb().prepare("UPDATE org_services SET is_active = 0, cancel_reason = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?").run(reason, user.id, id);
  logAudit(user.id, 'service.deactivate', 'service', id, { reason }, channel);
  return load(id);
}

module.exports = { list, get, create, update, cancel };
