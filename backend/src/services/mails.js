/**
 * Courrier entrant : enregistrement et numérotation (CDC CE-040 à CE-044, CR-020 à CR-024).
 * - Le numéro est attribué par le serveur dans une transaction : compteur du registre d'entrée de l'entité pour
 *   l'année de la date de réception (décision D-20 du 13/10/2026), jamais réutilisé, sans trou.
 * - Format : <préfixe>-<année>-<numéro sur N chiffres>, préfixe et N réglés sur le registre.
 * - L'enregistrement et la date d'enregistrement sont posés par le serveur ; la date de réception ne se modifie pas
 *   dans cette version (correction avec motif à une étape suivante).
 * - Aucune suppression : l'annulation garde le numéro au registre avec son motif (standard v3.2, section 7.1).
 * Visibilité : secrétariat et gestionnaire de l'entité (0.1.0) ; depuis la 0.3.0, l'agent et le responsable d'un service
 * voient aussi les courriers attribués à leur service, mis en copie ou qui les nomment (services/access.js) ; ils ne
 * modifient ni n'annulent rien. La confidentialité (étape 5) restreindra cette règle.
 * Version 0.2.0 : l'enregistrement peut rattacher des pièces de la file « À enregistrer » (piece_ids) dans la même
 * transaction ; la lecture d'une fiche (get) rend ses pièces et s'inscrit au journal des consultations (CDC CG-003).
 */
const { getDb, safeBuildUpdate } = require('../database');
const { AppError } = require('../envelope');
const { logAudit } = require('../audit');
const { assertRegister, registerEntities } = require('../rights');
const access = require('./access');
const attribution = require('./attribution');
const { todayInInstance } = require('../instance');
const pieces = require('./pieces');
const consultations = require('./consultations');
const processing = require('./processing');

const COLUMNS = `m.id, m.number, m.entity_id, e.code AS entity_code, m.register_id, m.year, m.seq, m.received_date, m.registered_at,
  m.channel, m.tracking_number, m.sender_contact_id, c.kind AS sender_kind, c.name AS sender_name, c.first_name AS sender_first_name,
  c.organisation AS sender_organisation, c.is_demo AS sender_is_demo, m.addressee_name, m.subject, m.type_id,
  t.label_fr AS type_label_fr, t.label_nl AS type_label_nl, m.lang, m.urgency, m.sender_reference, m.document_date, m.pieces_count,
  m.notes, ${access.STATUS_SQL} AS status, m.cancel_reason, m.service_id, sv.name_fr AS service_name_fr, sv.name_nl AS service_name_nl,
  m.agent_id, ag.first_name AS agent_first_name, ag.last_name AS agent_last_name, m.attributed_at, m.return_reason, m.returned_at,
  (SELECT COUNT(*) FROM pieces p WHERE p.mail_id = m.id AND p.status = 'rattachee') AS files_count, m.created_by, u.first_name AS created_by_first_name, u.last_name AS created_by_last_name,
  m.processing, m.taken_by, tk.first_name AS taken_by_first_name, tk.last_name AS taken_by_last_name, m.taken_at,
  m.closed_by, cb.first_name AS closed_by_first_name, cb.last_name AS closed_by_last_name, m.closed_at, m.close_reason_id,
  cr.label_fr AS close_reason_label_fr, cr.label_nl AS close_reason_label_nl, m.close_note,
  m.created_at, m.updated_at`;
const FROM = `FROM mails m JOIN entities e ON e.id = m.entity_id JOIN contacts c ON c.id = m.sender_contact_id
  JOIN mail_types t ON t.id = m.type_id LEFT JOIN users u ON u.id = m.created_by
  LEFT JOIN org_services sv ON sv.id = m.service_id LEFT JOIN users ag ON ag.id = m.agent_id
  LEFT JOIN users tk ON tk.id = m.taken_by LEFT JOIN users cb ON cb.id = m.closed_by LEFT JOIN close_reasons cr ON cr.id = m.close_reason_id`;

function load(id) {
  const m = getDb().prepare(`SELECT ${COLUMNS} ${FROM} WHERE m.id = ?`).get(id);
  if (!m) throw new AppError(404, 'NOT_FOUND');
  return m;
}

function list(user, { limit = 50, offset = 0, q, entity_id, status, year, channel, box } = {}) {
  const where = [];
  const params = [];
  if (box) {
    // Bannette (CE-120) : mêmes droits que la fiche, courriers annulés exclus.
    const cond = attribution.boxCondition(user, box, entity_id);
    where.push(cond.sql);
    params.push(...cond.params);
  } else {
    const allowed = registerEntities(user);
    if (entity_id && !allowed.includes(Number(entity_id))) throw new AppError(403, 'FORBIDDEN');
    const entities = entity_id ? [Number(entity_id)] : allowed;
    if (entities.length === 0) return { rows: [], pagination: { total: 0, limit, offset } };
    where.push(`m.entity_id IN (${entities.map(() => '?').join(', ')})`);
    params.push(...entities);
  }
  if (status) { where.push(`${access.STATUS_SQL} = ?`); params.push(status); }
  if (year) { where.push('m.year = ?'); params.push(year); }
  if (channel) { where.push('m.channel = ?'); params.push(channel); }
  if (q) {
    where.push('(m.number LIKE ? OR m.subject LIKE ? OR m.sender_reference LIKE ? OR c.name LIKE ? OR c.organisation LIKE ? OR c.first_name LIKE ?)');
    params.push(...Array(6).fill(`%${q}%`));
  }
  const clause = `WHERE ${where.join(' AND ')}`;
  const db = getDb();
  const total = db.prepare(`SELECT COUNT(*) AS n FROM mails m JOIN contacts c ON c.id = m.sender_contact_id ${clause}`).get(...params).n;
  const rows = db.prepare(`SELECT ${COLUMNS} ${FROM} ${clause} ORDER BY m.year DESC, m.seq DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
  return { rows, pagination: { total, limit, offset } };
}

/** Courrier modifiable par la personne : rôle de registre dans l'entité (contrôle interne, sans journal). */
function writable(user, id) {
  const m = load(id);
  assertRegister(user, m.entity_id);
  return m;
}

/** Courrier lisible par la personne : registre de l'entité, ou service traitant, en copie, agent nommé (sans journal). */
function readable(user, id) {
  const m = load(id);
  if (!access.canSeeMail(user, m)) throw new AppError(403, 'FORBIDDEN');
  return m;
}

/** Courrier avec ses services en copie, son historique d'attribution et les actions permises à la personne. */
function withAttribution(user, m) {
  return { ...m, copies: attribution.copiesOf(m.id), attributions: attribution.history(m.id), rights: access.mailRights(user, m),
    comments: processing.commentsOf(user, m), timeline: processing.timeline(user, m) };
}

/** Vue de la fiche sans inscription au journal : sert après une écriture (attribution, renvoi). */
function view(user, id) {
  const m = readable(user, id);
  return { ...withAttribution(user, m), pieces: pieces.listForMail(m.id) };
}

/** Ouverture de la fiche : courrier, pièces rattachées, attribution ; la consultation s'inscrit au journal. */
function get(user, id, channel = 'api') {
  const m = readable(user, id);
  consultations.record(user, { entity_id: m.entity_id, mail_id: m.id, action: 'fiche' }, channel);
  return { ...withAttribution(user, m), pieces: pieces.listForMail(m.id) };
}

function checkType(typeId, entityId) {
  const t = getDb().prepare('SELECT entity_id, is_active FROM mail_types WHERE id = ?').get(typeId);
  if (!t || t.entity_id !== Number(entityId) || !t.is_active) throw new AppError(409, 'TYPE_INVALID');
}

function checkContact(contactId) {
  const c = getDb().prepare('SELECT is_active FROM contacts WHERE id = ?').get(contactId);
  if (!c || !c.is_active) throw new AppError(409, 'CONTACT_INVALID');
}

function checkDate(d, field) {
  if (d === undefined || d === null) return;
  if (d > todayInInstance()) throw new AppError(400, 'DATE_FUTURE', [field]);
  if (d < '2000-01-01') throw new AppError(400, 'DATE_INVALID', [field]);
}

const pad = (n, digits) => String(n).padStart(digits, '0');

/** Enregistre un courrier et lui attribue le numéro suivant, dans une seule transaction. */
function create(user, data, channel = 'api') {
  assertRegister(user, data.entity_id);
  const db = getDb();
  const entity = db.prepare('SELECT is_active FROM entities WHERE id = ?').get(data.entity_id);
  if (!entity || !entity.is_active) throw new AppError(409, 'REFERENCE_INVALID');
  const reg = db.prepare("SELECT id, prefix, digits FROM registers WHERE entity_id = ? AND direction = 'entree' AND is_active = 1").get(data.entity_id);
  if (!reg) throw new AppError(409, 'REGISTER_MISSING');
  const received = data.received_date || todayInInstance();
  checkDate(received, 'received_date');
  checkDate(data.document_date, 'document_date');
  checkType(data.type_id, data.entity_id);
  checkContact(data.sender_contact_id);
  const year = Number(received.slice(0, 4));

  const done = db.transaction(() => {
    db.prepare('INSERT OR IGNORE INTO register_counters (register_id, year, last_number) VALUES (?, ?, 0)').run(reg.id, year);
    db.prepare('UPDATE register_counters SET last_number = last_number + 1 WHERE register_id = ? AND year = ?').run(reg.id, year);
    const seq = db.prepare('SELECT last_number FROM register_counters WHERE register_id = ? AND year = ?').get(reg.id, year).last_number;
    const number = `${reg.prefix}-${year}-${pad(seq, reg.digits)}`;
    const r = db.prepare(`INSERT INTO mails (register_id, entity_id, year, seq, number, received_date, channel, tracking_number,
      sender_contact_id, addressee_name, subject, type_id, lang, urgency, sender_reference, document_date, pieces_count, notes,
      created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      reg.id, data.entity_id, year, seq, number, received, data.channel, data.tracking_number || null,
      data.sender_contact_id, data.addressee_name || null, data.subject, data.type_id, data.lang || 'fr', data.urgency || 'normale',
      data.sender_reference || null, data.document_date || null, data.pieces_count ?? null, data.notes || null, user.id, user.id,
    );
    const attached = pieces.attachInTransaction(db, user, r.lastInsertRowid, data.entity_id, data.piece_ids);
    return { mailId: r.lastInsertRowid, attached };
  })();
  const m = load(done.mailId);
  logAudit(user.id, 'mail.register', 'mail', m.id, { number: m.number, entity_id: m.entity_id, piece_ids: done.attached }, channel);
  for (const pid of done.attached) logAudit(user.id, 'piece.attach', 'piece', pid, { mail_id: m.id, number: m.number }, channel);
  return { ...m, pieces: pieces.listForMail(m.id) };
}

function update(user, id, data, channel = 'api') {
  const m = writable(user, id);
  if (m.status === 'annule') throw new AppError(409, 'CANCELLED');
  if (data.type_id !== undefined) checkType(data.type_id, m.entity_id);
  if (data.sender_contact_id !== undefined) checkContact(data.sender_contact_id);
  checkDate(data.document_date, 'document_date');
  const { sets, params } = safeBuildUpdate(data, ['id', 'number', 'entity_id', 'register_id', 'year', 'seq', 'received_date', 'registered_at', 'status', 'cancel_reason']);
  if (sets.length) {
    getDb().prepare(`UPDATE mails SET ${sets.join(', ')}, updated_by = ?, updated_at = datetime('now') WHERE id = ?`).run(...params, user.id, id);
    logAudit(user.id, 'mail.update', 'mail', id, { number: m.number, fields: Object.keys(data) }, channel);
  }
  return withAttribution(user, load(id));
}

/** Annulation : le numéro reste au registre avec la mention « annulé » et son motif (CDC CE-043). */
function cancel(user, id, reason, channel = 'api') {
  const m = writable(user, id);
  if (m.status === 'annule') throw new AppError(409, 'CANCELLED');
  getDb().prepare("UPDATE mails SET status = 'annule', cancel_reason = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?").run(reason, user.id, id);
  logAudit(user.id, 'mail.cancel', 'mail', id, { number: m.number, reason }, channel);
  return withAttribution(user, load(id));
}

module.exports = { list, get, view, create, update, cancel, loadRow: load };
