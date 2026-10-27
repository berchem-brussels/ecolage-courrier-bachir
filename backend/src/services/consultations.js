/**
 * Journal des consultations (CDC CG-003, CA-007 ; patron STEGA beneficiary_viewed).
 * Chaque ouverture de la fiche d'un courrier et chaque lecture d'une pièce s'inscrit avec la personne, la date,
 * l'heure et le canal (écran ou API, MCP). Le journal se lit par l'auditeur de l'entité, sans contenu du courrier :
 * ni objet, ni expéditeur, ni nom de fichier. Il ne se modifie pas et ne se supprime pas par l'application.
 */
const { getDb } = require('../database');
const { AppError } = require('../envelope');
const { auditEntities } = require('../rights');
const { dayBoundsUtc } = require('../instance');

/** Inscrit une consultation. Une écriture du journal qui échoue n'empêche pas la lecture : l'erreur part au journal du serveur. */
function record(user, { entity_id, mail_id = null, piece_id = null, action }, channel = 'api') {
  try {
    getDb().prepare('INSERT INTO consultations (user_id, entity_id, mail_id, piece_id, action, channel) VALUES (?, ?, ?, ?, ?, ?)')
      .run(user.id, entity_id, mail_id, piece_id, action, channel === 'mcp' ? 'mcp' : 'api');
  } catch (e) {
    console.error('[CONSULTATION] Écriture impossible :', e.message);
  }
}

const COLUMNS = `k.id, k.created_at, k.action, k.channel, k.entity_id, e.code AS entity_code, k.mail_id, m.number AS mail_number,
  k.piece_id, k.user_id, u.first_name AS user_first_name, u.last_name AS user_last_name`;
const FROM = `FROM consultations k JOIN entities e ON e.id = k.entity_id LEFT JOIN mails m ON m.id = k.mail_id
  LEFT JOIN users u ON u.id = k.user_id`;

/** Liste du journal pour les entités dont la personne est auditeur ; filtres par numéro, personne, période. */
function list(user, { limit = 50, offset = 0, entity_id, mail_number, user_id, from, to } = {}) {
  const allowed = auditEntities(user);
  if (entity_id && !allowed.includes(Number(entity_id))) throw new AppError(403, 'FORBIDDEN');
  if (allowed.length === 0) throw new AppError(403, 'FORBIDDEN');
  const entities = entity_id ? [Number(entity_id)] : allowed;
  const where = [`k.entity_id IN (${entities.map(() => '?').join(', ')})`];
  const params = [...entities];
  if (mail_number) { where.push('m.number LIKE ?'); params.push(`%${mail_number}%`); }
  if (user_id) { where.push('k.user_id = ?'); params.push(user_id); }
  // Les dates des filtres sont des journées du fuseau de l'instance ; les horodatages sont stockés en UTC.
  if (from) { where.push('k.created_at >= ?'); params.push(dayBoundsUtc(from).from); }
  if (to) { where.push('k.created_at <= ?'); params.push(dayBoundsUtc(to).to); }
  const clause = `WHERE ${where.join(' AND ')}`;
  const db = getDb();
  const total = db.prepare(`SELECT COUNT(*) AS n ${FROM} ${clause}`).get(...params).n;
  const rows = db.prepare(`SELECT ${COLUMNS} ${FROM} ${clause} ORDER BY k.id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
  return { rows, pagination: { total, limit, offset } };
}

module.exports = { record, list };
