/**
 * Entités (AC, CPAS...) et leurs registres d'entrée et de départ (CDC CR-020, CR-021).
 * Lecture : toute personne connectée (listes de l'interface). Écriture : administrateur.
 * Le préfixe et le nombre de chiffres d'un registre ne changent plus dès qu'un numéro a été attribué (registre sans trou).
 */
const { getDb, safeBuildUpdate } = require('../database');
const { AppError } = require('../envelope');
const { logAudit } = require('../audit');
const { assertAdmin } = require('../rights');

const E_COLUMNS = 'id, code, name_fr, name_nl, is_active, created_at, updated_at';
const R_COLUMNS = 'r.id, r.entity_id, e.code AS entity_code, r.direction, r.prefix, r.digits, r.is_active, r.created_at, r.updated_at';

function loadEntity(id) {
  const e = getDb().prepare(`SELECT ${E_COLUMNS} FROM entities WHERE id = ?`).get(id);
  if (!e) throw new AppError(404, 'NOT_FOUND');
  return e;
}

function listEntities(user, { limit = 50, offset = 0, is_active } = {}) {
  const where = [];
  const params = [];
  if (is_active !== undefined) { where.push('is_active = ?'); params.push(is_active); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const db = getDb();
  const total = db.prepare(`SELECT COUNT(*) AS n FROM entities ${clause}`).get(...params).n;
  const rows = db.prepare(`SELECT ${E_COLUMNS} FROM entities ${clause} ORDER BY id LIMIT ? OFFSET ?`).all(...params, limit, offset);
  return { rows, pagination: { total, limit, offset } };
}

const getEntity = (user, id) => loadEntity(id);

function createEntity(user, data, channel = 'api') {
  assertAdmin(user);
  const db = getDb();
  if (db.prepare('SELECT 1 FROM entities WHERE code = ?').get(data.code)) throw new AppError(409, 'CODE_USED');
  const r = db.prepare('INSERT INTO entities (code, name_fr, name_nl, created_by, updated_by) VALUES (?, ?, ?, ?, ?)')
    .run(data.code, data.name_fr, data.name_nl, user.id, user.id);
  logAudit(user.id, 'entity.create', 'entity', r.lastInsertRowid, data, channel);
  return loadEntity(r.lastInsertRowid);
}

function updateEntity(user, id, data, channel = 'api') {
  assertAdmin(user);
  loadEntity(id);
  const { sets, params } = safeBuildUpdate(data, ['id', 'code']);
  if (sets.length) {
    getDb().prepare(`UPDATE entities SET ${sets.join(', ')}, updated_by = ?, updated_at = datetime('now') WHERE id = ?`).run(...params, user.id, id);
    logAudit(user.id, 'entity.update', 'entity', id, data, channel);
  }
  return loadEntity(id);
}

function deactivateEntity(user, id, channel = 'api') {
  return updateEntity(user, id, { is_active: 0 }, channel);
}

function loadRegister(id) {
  const r = getDb().prepare(`SELECT ${R_COLUMNS} FROM registers r JOIN entities e ON e.id = r.entity_id WHERE r.id = ?`).get(id);
  if (!r) throw new AppError(404, 'NOT_FOUND');
  r.numbers_issued = getDb().prepare('SELECT COALESCE(SUM(last_number), 0) AS n FROM register_counters WHERE register_id = ?').get(id).n;
  return r;
}

function listRegisters(user, { limit = 50, offset = 0, entity_id, direction } = {}) {
  const where = [];
  const params = [];
  if (entity_id) { where.push('r.entity_id = ?'); params.push(entity_id); }
  if (direction) { where.push('r.direction = ?'); params.push(direction); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const db = getDb();
  const total = db.prepare(`SELECT COUNT(*) AS n FROM registers r ${clause}`).get(...params).n;
  const rows = db.prepare(`SELECT ${R_COLUMNS} FROM registers r JOIN entities e ON e.id = r.entity_id ${clause}
    ORDER BY r.entity_id, r.direction DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
  return { rows, pagination: { total, limit, offset } };
}

const getRegister = (user, id) => loadRegister(id);

function createRegister(user, data, channel = 'api') {
  assertAdmin(user);
  loadEntity(data.entity_id);
  const db = getDb();
  if (db.prepare('SELECT 1 FROM registers WHERE entity_id = ? AND direction = ?').get(data.entity_id, data.direction)) throw new AppError(409, 'REGISTER_EXISTS');
  if (db.prepare('SELECT 1 FROM registers WHERE prefix = ?').get(data.prefix)) throw new AppError(409, 'CODE_USED');
  const r = db.prepare('INSERT INTO registers (entity_id, direction, prefix, digits, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)')
    .run(data.entity_id, data.direction, data.prefix, data.digits || 6, user.id, user.id);
  logAudit(user.id, 'register.create', 'register', r.lastInsertRowid, data, channel);
  return loadRegister(r.lastInsertRowid);
}

function updateRegister(user, id, data, channel = 'api') {
  assertAdmin(user);
  const reg = loadRegister(id);
  const changesNumbering = (data.prefix !== undefined && data.prefix !== reg.prefix) || (data.digits !== undefined && data.digits !== reg.digits);
  if (changesNumbering && reg.numbers_issued > 0) throw new AppError(409, 'REGISTER_IN_USE');
  if (data.prefix !== undefined && data.prefix !== reg.prefix && getDb().prepare('SELECT 1 FROM registers WHERE prefix = ?').get(data.prefix)) throw new AppError(409, 'CODE_USED');
  const { sets, params } = safeBuildUpdate(data, ['id', 'entity_id', 'direction']);
  if (sets.length) {
    getDb().prepare(`UPDATE registers SET ${sets.join(', ')}, updated_by = ?, updated_at = datetime('now') WHERE id = ?`).run(...params, user.id, id);
    logAudit(user.id, 'register.update', 'register', id, data, channel);
  }
  return loadRegister(id);
}

function deactivateRegister(user, id, channel = 'api') {
  return updateRegister(user, id, { is_active: 0 }, channel);
}

module.exports = {
  listEntities, getEntity, createEntity, updateEntity, deactivateEntity,
  listRegisters, getRegister, createRegister, updateRegister, deactivateRegister,
};
