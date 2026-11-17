/**
 * Cloche de notifications (CDC CE-140, partie livrée en 0.3.0) : courrier attribué à la personne, attribué à son service,
 * mis en copie à son service, renvoyé au secrétariat. Une notification porte le numéro du courrier et sa nature,
 * jamais l'objet ni l'expéditeur. Elle ne se montre que si la personne voit encore le courrier (CR-008).
 */
const { getDb } = require('../database');
const { canSeeMail } = require('./access');

/** Crée une notification par personne, sauf pour l'auteur de l'action ; une personne n'en reçoit qu'une par action. */
function notify(userIds, mailId, kind, authorId) {
  const db = getDb();
  for (const uid of [...new Set(userIds)]) {
    if (uid === authorId) continue;
    db.prepare('INSERT INTO notifications (user_id, mail_id, kind, author_id) VALUES (?, ?, ?, ?)').run(uid, mailId, kind, authorId || null);
  }
}

const COLUMNS = `n.id, n.kind, n.mail_id, m.number AS mail_number, m.entity_id, e.code AS entity_code, m.service_id, m.agent_id,
  n.created_at, n.read_at`;
const FROM = 'FROM notifications n JOIN mails m ON m.id = n.mail_id JOIN entities e ON e.id = m.entity_id';

/** Notifications de la personne, les plus récentes d'abord ; celles d'un courrier devenu invisible sont écartées. */
function list(user, { limit = 50, offset = 0, unread } = {}) {
  const db = getDb();
  const where = ['n.user_id = ?'];
  const params = [user.id];
  if (unread) where.push('n.read_at IS NULL');
  const clause = `WHERE ${where.join(' AND ')}`;
  const visible = db.prepare(`SELECT ${COLUMNS} ${FROM} ${clause} ORDER BY n.id DESC LIMIT 500`).all(...params)
    .filter((n) => canSeeMail(user, { id: n.mail_id, entity_id: n.entity_id, service_id: n.service_id, agent_id: n.agent_id }));
  const unreadCount = visible.filter((n) => !n.read_at).length;
  const rows = visible.slice(offset, offset + limit).map(({ service_id: s, agent_id: a, ...n }) => n);
  return { rows, unread: unreadCount, pagination: { total: visible.length, limit, offset } };
}

/** Marque comme lues les notifications données (les siennes seulement), ou toutes si aucune n'est donnée. */
function markRead(user, ids) {
  const db = getDb();
  if (Array.isArray(ids) && ids.length > 0) {
    let n = 0;
    for (const id of ids) n += db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND user_id = ? AND read_at IS NULL").run(id, user.id).changes;
    return { updated: n };
  }
  return { updated: db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL").run(user.id).changes };
}

module.exports = { notify, list, markRead };
