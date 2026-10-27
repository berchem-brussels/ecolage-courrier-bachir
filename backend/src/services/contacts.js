/**
 * Contacts (expéditeurs et destinataires), communs à l'application (CDC CE-130, CE-045).
 * Données personnelles : réservées aux personnes qui tiennent un registre ; l'administrateur n'y a pas accès
 * sans rôle métier (CDC section 4). Désactivation avec motif ; l'effacement relève de la conservation (lot L4).
 */
const { getDb, safeBuildUpdate } = require('../database');
const { AppError } = require('../envelope');
const { logAudit } = require('../audit');
const { assertContacts } = require('../rights');

const COLUMNS = 'id, kind, name, first_name, organisation, email, phone, street, postal_code, city, country, lang, company_number, is_demo, is_active, cancel_reason, created_at, updated_at';

function load(id) {
  const c = getDb().prepare(`SELECT ${COLUMNS} FROM contacts WHERE id = ?`).get(id);
  if (!c) throw new AppError(404, 'NOT_FOUND');
  return c;
}

function list(user, { limit = 50, offset = 0, q, is_active } = {}) {
  assertContacts(user);
  const where = [];
  const params = [];
  if (is_active !== undefined) { where.push('is_active = ?'); params.push(is_active); }
  if (q) {
    where.push('(name LIKE ? OR first_name LIKE ? OR organisation LIKE ? OR email LIKE ? OR company_number LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const db = getDb();
  const total = db.prepare(`SELECT COUNT(*) AS n FROM contacts ${clause}`).get(...params).n;
  const rows = db.prepare(`SELECT ${COLUMNS} FROM contacts ${clause} ORDER BY name, first_name LIMIT ? OFFSET ?`).all(...params, limit, offset);
  return { rows, pagination: { total, limit, offset } };
}

function get(user, id) {
  assertContacts(user);
  return load(id);
}

const FIELDS = ['kind', 'name', 'first_name', 'organisation', 'email', 'phone', 'street', 'postal_code', 'city', 'country', 'lang', 'company_number'];

function create(user, data, channel = 'api') {
  assertContacts(user);
  const vals = FIELDS.map((f) => (data[f] === undefined || data[f] === '' ? null : data[f]));
  vals[FIELDS.indexOf('lang')] = data.lang || 'fr';
  const r = getDb().prepare(`INSERT INTO contacts (${FIELDS.join(', ')}, created_by, updated_by) VALUES (${FIELDS.map(() => '?').join(', ')}, ?, ?)`)
    .run(...vals, user.id, user.id);
  // Le journal ne recopie pas les coordonnées : il garde la trace de l'opération.
  logAudit(user.id, 'contact.create', 'contact', r.lastInsertRowid, { kind: data.kind }, channel);
  return load(r.lastInsertRowid);
}

function update(user, id, data, channel = 'api') {
  assertContacts(user);
  const c = load(id);
  if (!c.is_active) throw new AppError(409, 'CANCELLED');
  const { sets, params } = safeBuildUpdate(data, ['id', 'is_demo', 'is_active', 'cancel_reason']);
  if (sets.length) {
    getDb().prepare(`UPDATE contacts SET ${sets.join(', ')}, updated_by = ?, updated_at = datetime('now') WHERE id = ?`).run(...params, user.id, id);
    logAudit(user.id, 'contact.update', 'contact', id, { fields: Object.keys(data) }, channel);
  }
  return load(id);
}

function cancel(user, id, reason, channel = 'api') {
  assertContacts(user);
  const c = load(id);
  if (!c.is_active) throw new AppError(409, 'CANCELLED');
  getDb().prepare("UPDATE contacts SET is_active = 0, cancel_reason = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?").run(reason, user.id, id);
  logAudit(user.id, 'contact.deactivate', 'contact', id, { reason }, channel);
  return load(id);
}

module.exports = { list, get, create, update, cancel };
