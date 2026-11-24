/**
 * Traitement du courrier entrant (version 0.4.0, CDC CE-070, CE-071, CE-073, CE-079).
 * - Prise en charge en un clic : l'agent nommé du courrier la fait, ou un membre du service traitant si personne n'est nommé ; elle écrit son nom sur la fiche et dans les listes.
 * - Commentaires : visibles du service traitant ou de toute l'entité, au choix à chaque commentaire ; ils ne se modifient
 *   pas et ne se suppriment pas, ils se complètent.
 * - Clôture avec un motif de la liste de l'entité (service close-reasons) et une note facultative : l'agent nommé et le
 *   responsable du service closent. Réouverture avec motif : secrétariat et gestionnaire du registre.
 * - Chaque événement s'écrit dans `mail_events` ou `mail_comments`, au journal d'audit sans contenu (jamais le texte d'un
 *   commentaire), et l'historique de la fiche les réunit avec l'enregistrement, les attributions et les consultations.
 * Les transitions sont vérifiées ici, côté serveur : une transition interdite répond 409 (CE-010).
 * Ce module ne dépend pas du service des courriers : celui-ci lui demande l'historique et les commentaires.
 */
const { getDb } = require('../database');
const { AppError } = require('../envelope');
const { logAudit } = require('../audit');
const access = require('./access');
const attribution = require('./attribution');
const { notify } = require('./notifications');

function loadMail(id) {
  const m = getDb().prepare(`SELECT m.id, m.number, m.entity_id, ${access.STATUS_SQL} AS status, m.service_id, m.agent_id, m.processing,
    m.created_at, m.created_by FROM mails m WHERE m.id = ?`).get(id);
  if (!m) throw new AppError(404, 'NOT_FOUND');
  return m;
}

/** Courrier que la personne peut lire ; sinon 403 (même règle que la fiche). */
function readableMail(user, id) {
  const m = loadMail(id);
  if (!access.canSeeMail(user, m)) throw new AppError(403, 'FORBIDDEN');
  return m;
}

const clean = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Prise en charge en un clic (CE-070) : courrier attribué. Avec un agent nommé, lui seul ; sans agent nommé (CE-061, le courrier
 * est dans la bannette du service), tout agent ou responsable du service traitant, qui devient alors l'agent nommé (écart E55 levé en 0.4.1).
 */
function take(user, mailId, channel = 'api') {
  const m = readableMail(user, mailId);
  const eligible = !!m.service_id && access.isAgent(user, m.entity_id)
    && (m.agent_id ? m.agent_id === user.id : access.isMemberOf(user, m.entity_id, m.service_id));
  if (!eligible) throw new AppError(403, 'FORBIDDEN');
  if (m.status === 'annule') throw new AppError(409, 'CANCELLED');
  if (m.status !== 'enregistre' || !m.service_id) throw new AppError(409, 'TRANSITION');
  const db = getDb();
  db.transaction(() => {
    db.prepare(`UPDATE mails SET processing = 'en_traitement', agent_id = ?, taken_by = ?, taken_at = datetime('now'),
      updated_by = ?, updated_at = datetime('now') WHERE id = ?`).run(user.id, user.id, user.id, m.id);
    db.prepare("INSERT INTO mail_events (mail_id, kind, author_id) VALUES (?, 'prise_en_charge', ?)").run(m.id, user.id);
  })();
  logAudit(user.id, 'mail.take', 'mail', m.id, { number: m.number }, channel);
  return loadMail(m.id);
}

/** Motif de clôture actif de l'entité du courrier. */
function checkCloseReason(reasonId, entityId) {
  const r = getDb().prepare('SELECT entity_id, is_active FROM close_reasons WHERE id = ?').get(reasonId);
  if (!r || r.entity_id !== Number(entityId) || !r.is_active) throw new AppError(409, 'CLOSE_REASON_INVALID');
}

/** Clôture (CE-073) : l'agent nommé ou le responsable du service ; motif de la liste, note libre facultative. */
function close(user, mailId, data, channel = 'api') {
  const m = readableMail(user, mailId);
  // Droit évalué comme si le courrier était en traitement : une personne sans droit reçoit 403, quel que soit l'état.
  if (!access.mailRights(user, { ...m, status: 'en_traitement' }).close) throw new AppError(403, 'FORBIDDEN');
  if (m.status === 'annule') throw new AppError(409, 'CANCELLED');
  if (m.status !== 'en_traitement') throw new AppError(409, 'TRANSITION');
  checkCloseReason(data.close_reason_id, m.entity_id);
  const note = clean(data.note) || null;
  const db = getDb();
  db.transaction(() => {
    db.prepare(`UPDATE mails SET processing = 'clos', closed_by = ?, closed_at = datetime('now'), close_reason_id = ?, close_note = ?,
      updated_by = ?, updated_at = datetime('now') WHERE id = ?`).run(user.id, data.close_reason_id, note, user.id, m.id);
    db.prepare("INSERT INTO mail_events (mail_id, kind, close_reason_id, note, author_id) VALUES (?, 'cloture', ?, ?, ?)").run(m.id, data.close_reason_id, note, user.id);
    notify(attribution.registerMemberIds(m.entity_id), m.id, 'clos', user.id);
  })();
  logAudit(user.id, 'mail.close', 'mail', m.id, { number: m.number, close_reason_id: data.close_reason_id }, channel);
  return loadMail(m.id);
}

/** Réouverture : secrétariat et gestionnaire du registre, motif obligatoire ; le courrier revient « en traitement » (CDC 6.1). */
function reopen(user, mailId, reason, channel = 'api') {
  const m = readableMail(user, mailId);
  if (!access.isRegister(user, m.entity_id)) throw new AppError(403, 'FORBIDDEN');
  if (m.status === 'annule') throw new AppError(409, 'CANCELLED');
  if (m.status !== 'clos') throw new AppError(409, 'TRANSITION');
  const text = clean(reason);
  if (!text) throw new AppError(400, 'REASON_REQUIRED');
  const db = getDb();
  db.transaction(() => {
    db.prepare(`UPDATE mails SET processing = 'en_traitement', closed_by = NULL, closed_at = NULL, close_reason_id = NULL, close_note = NULL,
      updated_by = ?, updated_at = datetime('now') WHERE id = ?`).run(user.id, m.id);
    db.prepare("INSERT INTO mail_events (mail_id, kind, note, author_id) VALUES (?, 'reouverture', ?, ?)").run(m.id, text, user.id);
    if (m.agent_id) notify([m.agent_id], m.id, 'rouvert', user.id);
  })();
  logAudit(user.id, 'mail.reopen', 'mail', m.id, { number: m.number, reason: text }, channel);
  return loadMail(m.id);
}

const COLUMNS = `c.id, c.mail_id, c.scope, c.service_id, s.name_fr AS service_name_fr, s.name_nl AS service_name_nl, c.body,
  c.author_id, u.first_name AS author_first_name, u.last_name AS author_last_name, c.created_at`;
const FROM = 'FROM mail_comments c LEFT JOIN org_services s ON s.id = c.service_id LEFT JOIN users u ON u.id = c.author_id';

/** Commentaires du courrier que la personne a le droit de lire, du plus ancien au plus récent. */
function commentsOf(user, m) {
  return getDb().prepare(`SELECT ${COLUMNS} ${FROM} WHERE c.mail_id = ? ORDER BY c.id`).all(m.id)
    .filter((c) => access.canSeeComment(user, m, c));
}

function comments(user, mailId) {
  return commentsOf(user, readableMail(user, mailId));
}

/** Ajoute un commentaire (CE-071), visible du service traitant ou de toute l'entité. Ni modification ni suppression. */
function addComment(user, mailId, data, channel = 'api') {
  const m = readableMail(user, mailId);
  if (!access.mailRights(user, m).comment) throw new AppError(m.status === 'annule' && access.canSeeMail(user, m) ? 409 : 403, m.status === 'annule' && access.canSeeMail(user, m) ? 'CANCELLED' : 'FORBIDDEN');
  const body = clean(data.body);
  if (!body) throw new AppError(400, 'VALIDATION', ['body']);
  if (data.scope === 'service' && !m.service_id) throw new AppError(409, 'SERVICE_INVALID');
  const db = getDb();
  const serviceId = data.scope === 'service' ? m.service_id : null;
  const id = db.transaction(() => {
    const r = db.prepare('INSERT INTO mail_comments (mail_id, scope, service_id, body, author_id) VALUES (?, ?, ?, ?, ?)').run(m.id, data.scope, serviceId, body, user.id);
    if (m.agent_id) notify([m.agent_id], m.id, 'commente', user.id);
    return r.lastInsertRowid;
  })();
  // Le texte du commentaire n'entre jamais au journal d'audit : portée et numéro seulement.
  logAudit(user.id, 'mail.comment', 'mail', m.id, { number: m.number, scope: data.scope, comment_id: id }, channel);
  return db.prepare(`SELECT ${COLUMNS} ${FROM} WHERE c.id = ?`).get(id);
}

const ORDER = { enregistrement: 0, attribution: 1, prise_en_charge: 2, commentaire: 3, cloture: 4, reouverture: 5, consultation: 6 };

/**
 * Historique complet de la fiche (CE-079), du plus récent au plus ancien : enregistrement, attributions, prise en charge,
 * commentaires que la personne peut lire, clôtures, réouvertures et, pour le registre seulement, les consultations de la fiche.
 * m : ligne de mails.load (avec created_at et les noms de l'auteur de l'enregistrement).
 */
function timeline(user, m) {
  const db = getDb();
  const items = [];
  items.push({ type: 'enregistrement', id: m.id, at: m.created_at, author_id: m.created_by, author_first_name: m.created_by_first_name, author_last_name: m.created_by_last_name });
  for (const h of attribution.history(m.id)) {
    items.push({ type: 'attribution', id: h.id, at: h.created_at, kind: h.kind, author_id: h.author_id, author_first_name: h.author_first_name, author_last_name: h.author_last_name,
      service_name_fr: h.service_name_fr, service_name_nl: h.service_name_nl, from_service_name_fr: h.from_service_name_fr, from_service_name_nl: h.from_service_name_nl,
      agent_first_name: h.agent_first_name, agent_last_name: h.agent_last_name, from_agent_first_name: h.from_agent_first_name, from_agent_last_name: h.from_agent_last_name,
      reason: h.reason });
  }
  const events = db.prepare(`SELECT e.id, e.kind, e.note, e.created_at, e.author_id, u.first_name AS author_first_name, u.last_name AS author_last_name,
    r.label_fr AS close_reason_label_fr, r.label_nl AS close_reason_label_nl
    FROM mail_events e LEFT JOIN users u ON u.id = e.author_id LEFT JOIN close_reasons r ON r.id = e.close_reason_id WHERE e.mail_id = ?`).all(m.id);
  for (const e of events) items.push({ type: e.kind, id: e.id, at: e.created_at, author_id: e.author_id, author_first_name: e.author_first_name, author_last_name: e.author_last_name,
    close_reason_label_fr: e.close_reason_label_fr, close_reason_label_nl: e.close_reason_label_nl, note: e.note });
  for (const c of commentsOf(user, m)) {
    items.push({ type: 'commentaire', id: c.id, at: c.created_at, scope: c.scope, service_name_fr: c.service_name_fr, service_name_nl: c.service_name_nl, body: c.body,
      author_id: c.author_id, author_first_name: c.author_first_name, author_last_name: c.author_last_name });
  }
  if (access.isRegister(user, m.entity_id)) {
    const rows = db.prepare(`SELECT k.id, k.created_at, k.channel, k.user_id, u.first_name, u.last_name FROM consultations k LEFT JOIN users u ON u.id = k.user_id
      WHERE k.mail_id = ? AND k.action = 'fiche' ORDER BY k.id DESC LIMIT 50`).all(m.id);
    for (const k of rows) items.push({ type: 'consultation', id: k.id, at: k.created_at, channel: k.channel, author_id: k.user_id, author_first_name: k.first_name, author_last_name: k.last_name });
  }
  return items.sort((a, b) => (a.at === b.at ? (ORDER[b.type] - ORDER[a.type]) || (b.id - a.id) : (a.at < b.at ? 1 : -1)));
}

/** Historique d'un courrier pour la personne qui le lit (route et outil MCP). */
function history(user, mailId, channel = 'api') {
  const mails = require('./mails');
  const m = readableMail(user, mailId);
  void channel;
  return timeline(user, mails.loadRow(m.id));
}

module.exports = { take, close, reopen, comments, commentsOf, addComment, timeline, history };
