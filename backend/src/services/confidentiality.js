/**
 * Confidentialité du courrier entrant (version 0.5.0, CDC CR-001 à CR-005, CR-007, CR-008, CA-005).
 * - Trois niveaux : « normal » (règles d'attribution), « restreint » (registre de l'entité et personnes nommément désignées),
 *   « confidentiel » (pli remis fermé : registre et destinataire nommé seulement, sans scan, sans objet).
 * - Le niveau se choisit à l'enregistrement ; il se modifie ensuite avec motif, au journal d'audit et à l'historique. Un courrier déjà
 *   enregistré ne devient pas « confidentiel » : le pli confidentiel ne porte jamais d'objet, qu'on ne peut pas effacer après coup.
 * - Les règles de lecture sont dans services/access.js (canSeeMail, visibilitySql, mailRights) : un seul endroit, relu en base.
 * - Le journal d'audit ne garde ni objet, ni nom de personne désignée : des numéros seulement.
 */
const { getDb } = require('../database');
const { AppError } = require('../envelope');
const { logAudit } = require('../audit');
const { assertRegister } = require('../rights');
const access = require('./access');

/** Objet porté par tout pli confidentiel (CR-004) : le pli n'est pas ouvert, son objet n'est pas connu. */
const GENERIC_SUBJECT = 'Pli confidentiel remis fermé';
const LEVELS = ['normal', 'restreint', 'confidentiel'];

/** Personnes que le registre peut désigner dans une entité : agents et responsables de service actifs (prénom, nom, rôle). */
function designableUsers(user, entityId) {
  assertRegister(user, entityId);
  return getDb().prepare(`SELECT u.id, u.first_name, u.last_name, r.role FROM users u
    JOIN user_roles r ON r.user_id = u.id AND r.entity_id = ? AND r.role IN ('agent', 'chef_service')
    WHERE u.is_active = 1 ORDER BY u.last_name, u.first_name`).all(entityId);
}

/** Vérifie la liste des personnes désignées pour un niveau ; renvoie la liste sans doublon. */
function checkDesignees(level, entityId, ids) {
  const list = [...new Set(ids || [])];
  if (level === 'normal') {
    if (list.length > 0) throw new AppError(400, 'VALIDATION', ['designee_ids: aucune personne désignée pour un courrier normal']);
    return [];
  }
  if (list.length === 0 || (level === 'confidentiel' && list.length !== 1)) throw new AppError(409, 'DESIGNEE_REQUIRED');
  const stmt = getDb().prepare(`SELECT u.id FROM users u JOIN user_roles r ON r.user_id = u.id AND r.entity_id = ? AND r.role IN ('agent', 'chef_service')
    WHERE u.is_active = 1 AND u.id = ?`);
  if (list.some((id) => !stmt.get(entityId, id))) throw new AppError(409, 'DESIGNEE_INVALID');
  return list;
}

/** Personnes désignées d'un courrier (prénom, nom, rôle dans l'entité du courrier). */
function designeesOf(mailId) {
  return getDb().prepare(`SELECT u.id, u.first_name, u.last_name FROM mail_designees d JOIN users u ON u.id = d.user_id WHERE d.mail_id = ? ORDER BY u.last_name, u.first_name`).all(mailId);
}

/** Pose les personnes désignées d'un courrier dans la transaction en cours. */
function writeDesignees(db, mailId, userIds, actorId) {
  db.prepare('DELETE FROM mail_designees WHERE mail_id = ?').run(mailId);
  for (const id of userIds) db.prepare('INSERT INTO mail_designees (mail_id, user_id, added_by) VALUES (?, ?, ?)').run(mailId, id, actorId);
}

/** Changement de niveau d'un courrier enregistré (CR-001) : registre de l'entité, motif obligatoire. */
function setLevel(user, mailId, data, channel = 'api') {
  const mails = require('./mails');
  const m = mails.loadRow(mailId);
  assertRegister(user, m.entity_id);
  if (m.status === 'annule') throw new AppError(409, 'CANCELLED');
  const level = data.level;
  if (level === 'confidentiel' && m.confidentiality !== 'confidentiel') throw new AppError(409, 'CONFIDENTIAL_AT_REGISTRATION');
  const designees = checkDesignees(level, m.entity_id, data.designee_ids);
  const before = designeesOf(m.id).map((d) => d.id).sort((a, b) => a - b).join(',');
  const after = [...designees].sort((a, b) => a - b).join(',');
  if (level === m.confidentiality && before === after) throw new AppError(409, 'LEVEL_UNCHANGED');
  const db = getDb();
  db.transaction(() => {
    db.prepare("UPDATE mails SET confidentiality = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?").run(level, user.id, m.id);
    writeDesignees(db, m.id, designees, user.id);
    db.prepare('INSERT INTO mail_confidentiality_changes (mail_id, from_level, to_level, reason, author_id) VALUES (?, ?, ?, ?, ?)').run(m.id, m.confidentiality, level, data.reason.trim(), user.id);
  })();
  logAudit(user.id, 'mail.confidentiality', 'mail', m.id, { number: m.number, from: m.confidentiality, to: level, designees: designees.length, reason: data.reason.trim() }, channel);
  return mails.view(user, m.id);
}

/** Remise du pli fermé (CR-005) : qui remet (le registre), qui reçoit (le destinataire nommé), quand (posé par le serveur). */
function handover(user, mailId, channel = 'api') {
  const mails = require('./mails');
  const m = mails.loadRow(mailId);
  assertRegister(user, m.entity_id);
  if (m.status === 'annule') throw new AppError(409, 'CANCELLED');
  if (m.confidentiality !== 'confidentiel') throw new AppError(409, 'NOT_CONFIDENTIAL');
  if (m.handed_at) throw new AppError(409, 'REMISE_DONE');
  const to = designeesOf(m.id)[0];
  getDb().prepare("UPDATE mails SET handed_by = ?, handed_to = ?, handed_at = datetime('now'), updated_by = ?, updated_at = datetime('now') WHERE id = ?").run(user.id, to ? to.id : null, user.id, m.id);
  logAudit(user.id, 'mail.handover', 'mail', m.id, { number: m.number }, channel);
  return mails.view(user, m.id);
}

/** Historique des changements de niveau (registre seulement, le motif pouvant en dire long). */
function changesOf(mailId) {
  return getDb().prepare(`SELECT c.id, c.from_level, c.to_level, c.reason, c.created_at, c.author_id, u.first_name AS author_first_name, u.last_name AS author_last_name
    FROM mail_confidentiality_changes c LEFT JOIN users u ON u.id = c.author_id WHERE c.mail_id = ? ORDER BY c.id DESC`).all(mailId);
}

module.exports = { GENERIC_SUBJECT, LEVELS, designableUsers, checkDesignees, designeesOf, writeDesignees, setLevel, handover, changesOf, levelOf: access.levelOf };
