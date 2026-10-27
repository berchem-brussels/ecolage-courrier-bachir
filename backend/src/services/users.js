/**
 * Fonctions de service des comptes. À terme remplacées par l'application Droits (standard v3.2, section 8.5).
 * Création sur le modèle Microsoft 365 (section 8.1) : mot de passe généré (rendu une seule fois, jamais stocké en clair
 * ni journalisé) ou encodé par le gestionnaire ; changement à la première connexion seulement si la case est cochée.
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getDb, safeBuildUpdate } = require('../database');
const { AppError } = require('../envelope');
const { logAudit } = require('../audit');

const COLUMNS = 'id, email, first_name, last_name, user_role, preferred_lang, is_active, must_change_password, created_at, updated_at';

const rolesStmt = () => getDb().prepare(`SELECT r.entity_id, e.code AS entity_code, r.role FROM user_roles r
  JOIN entities e ON e.id = r.entity_id WHERE r.user_id = ? ORDER BY r.entity_id`);

function load(id) {
  const u = getDb().prepare(`SELECT ${COLUMNS} FROM users WHERE id = ?`).get(id);
  if (!u) throw new AppError(404, 'NOT_FOUND');
  return { ...u, entity_roles: rolesStmt().all(id) };
}

/** Remplace les rôles par entité d'un compte : un rôle au plus par entité ; entités vérifiées. */
function setEntityRoles(actorId, userId, roles) {
  const db = getDb();
  const seen = new Set();
  for (const r of roles) {
    if (seen.has(r.entity_id)) throw new AppError(400, 'VALIDATION', ['entity_roles: une entité en double']);
    seen.add(r.entity_id);
    if (!db.prepare('SELECT 1 FROM entities WHERE id = ?').get(r.entity_id)) throw new AppError(409, 'REFERENCE_INVALID');
  }
  db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(userId);
  for (const r of roles) db.prepare('INSERT INTO user_roles (user_id, entity_id, role, created_by) VALUES (?, ?, ?, ?)').run(userId, r.entity_id, r.role, actorId);
}

function list(user, { limit = 50, offset = 0, q, is_active } = {}) {
  const where = [];
  const params = [];
  if (q) { where.push('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (is_active !== undefined) { where.push('is_active = ?'); params.push(is_active); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const db = getDb();
  const total = db.prepare(`SELECT COUNT(*) AS n FROM users ${clause}`).get(...params).n;
  const rows = db.prepare(`SELECT ${COLUMNS} FROM users ${clause} ORDER BY last_name, first_name LIMIT ? OFFSET ?`).all(...params, limit, offset);
  const stmt = rolesStmt();
  return { rows: rows.map((u) => ({ ...u, entity_roles: stmt.all(u.id) })), pagination: { total, limit, offset } };
}

function get(user, id) {
  if (user.role !== 'admin' && user.id !== id) throw new AppError(403, 'FORBIDDEN');
  return load(id);
}

function create(user, data, channel = 'api') {
  const db = getDb();
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(data.email)) throw new AppError(409, 'DUPLICATE');
  const generated = (data.password_mode || 'generated') === 'generated';
  const password = generated ? crypto.randomBytes(12).toString('base64url') : data.password;
  const id = db.transaction(() => {
    const r = db.prepare(`INSERT INTO users (email, first_name, last_name, user_role, preferred_lang, password_hash, must_change_password, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(data.email, data.first_name, data.last_name, data.user_role || 'agent',
      data.preferred_lang || 'fr', bcrypt.hashSync(password, 10), data.must_change_password ? 1 : 0, user.id, user.id);
    if (data.entity_roles) setEntityRoles(user.id, r.lastInsertRowid, data.entity_roles);
    return r.lastInsertRowid;
  })();
  // Ni le mot de passe ni son mode ne vont au journal ; le mot de passe généré n'est rendu qu'une fois.
  logAudit(user.id, 'user.create', 'user', id, { email: data.email, role: data.user_role || 'agent', entity_roles: data.entity_roles || [] }, channel);
  const out = load(id);
  return generated ? { ...out, generated_password: password } : out;
}

function activeAdminCount() {
  return getDb().prepare("SELECT COUNT(*) AS n FROM users WHERE user_role = 'admin' AND is_active = 1").get().n;
}

function update(user, id, data, channel = 'api') {
  const target = load(id);
  const losesAdmin = target.user_role === 'admin' && target.is_active === 1
    && ((data.user_role && data.user_role !== 'admin') || data.is_active === 0);
  if (losesAdmin && activeAdminCount() <= 1) throw new AppError(409, 'LAST_ADMIN');
  const { entity_roles: entityRoles, ...cols } = data;
  const { sets, params } = safeBuildUpdate(cols, ['id', 'email', 'password_hash']);
  const db = getDb();
  db.transaction(() => {
    if (sets.length) db.prepare(`UPDATE users SET ${sets.join(', ')}, updated_by = ?, updated_at = datetime('now') WHERE id = ?`).run(...params, user.id, id);
    if (entityRoles !== undefined) setEntityRoles(user.id, id, entityRoles);
    if (data.is_active === 0) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
  })();
  if (sets.length || entityRoles !== undefined) logAudit(user.id, 'user.update', 'user', id, data, channel);
  return load(id);
}

/** Désactivation : le compte reste en base, ses sessions sont fermées. */
function deactivate(user, id, channel = 'api') {
  return update(user, id, { is_active: 0 }, channel);
}

module.exports = { list, get, create, update, deactivate, activeAdminCount };
