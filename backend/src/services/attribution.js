/**
 * Attribution du courrier entrant (CDC CE-060 à CE-062, CE-120, CE-140), version 0.3.0.
 * - Le secrétariat attribue à un service traitant (un seul à la fois), à des services en copie et, s'il le veut,
 *   à un agent nommé du service ; un changement de service traitant d'un courrier déjà attribué demande un motif.
 * - Le responsable de service (et le secrétariat) nomme ou change l'agent dans le service traitant.
 * - Tout membre du service traitant renvoie au secrétariat un courrier qui n'est pas le sien, avec un motif :
 *   le courrier n'a plus de service traitant et revient dans « À attribuer ».
 * - Chaque changement s'écrit dans l'historique (mail_attributions) et au journal d'audit, sans objet ni expéditeur.
 * - Les bannettes (À attribuer, Mon service, Moi, En copie) appliquent les mêmes droits que la fiche (CR-008).
 * Ce module ne dépend pas du service des courriers : il lui fournit les conditions de bannette et l'historique.
 */
const { getDb } = require('../database');
const { AppError } = require('../envelope');
const { logAudit } = require('../audit');
const { REGISTER_ROLES, AGENT_ROLES, assertRegister, registerEntities, rolesOf } = require('../rights');
const { serviceIdsOf, isRegister, isMemberOf, mailRights } = require('./access');
const { notify } = require('./notifications');

const BOXES = ['a_attribuer', 'mon_service', 'moi', 'en_copie'];

function loadMail(id) {
  const m = getDb().prepare('SELECT id, number, entity_id, status, service_id, agent_id, return_reason FROM mails WHERE id = ?').get(id);
  if (!m) throw new AppError(404, 'NOT_FOUND');
  return m;
}

/** Service actif qui sert l'entité du courrier. */
function checkService(serviceId, entityId) {
  const s = getDb().prepare(`SELECT s.id FROM org_services s JOIN org_service_entities x ON x.service_id = s.id
    WHERE s.id = ? AND x.entity_id = ? AND s.is_active = 1`).get(serviceId, entityId);
  if (!s) throw new AppError(409, 'SERVICE_INVALID');
}

/** Agent nommable : compte actif, rôle d'agent ou de responsable dans l'entité, rattaché au service traitant. */
function checkAgent(agentId, entityId, serviceId) {
  const row = getDb().prepare(`SELECT r.role FROM users u JOIN user_roles r ON r.user_id = u.id AND r.entity_id = ?
    JOIN user_services us ON us.user_id = u.id AND us.entity_id = r.entity_id AND us.service_id = ?
    WHERE u.id = ? AND u.is_active = 1`).get(entityId, serviceId, agentId);
  if (!row || !AGENT_ROLES.includes(row.role)) throw new AppError(409, 'AGENT_INVALID');
}

/** Personnes actives qui traitent le courrier d'un service dans une entité. */
function memberIds(serviceId, entityId) {
  return getDb().prepare(`SELECT u.id FROM users u JOIN user_roles r ON r.user_id = u.id AND r.entity_id = ?
    JOIN user_services us ON us.user_id = u.id AND us.entity_id = r.entity_id AND us.service_id = ?
    WHERE u.is_active = 1 AND r.role IN ('agent', 'chef_service')`).all(entityId, serviceId).map((r) => r.id);
}

/** Personnes qui tiennent le registre de l'entité (secrétariat et gestionnaire), pour les renvois. */
function registerMemberIds(entityId) {
  return getDb().prepare(`SELECT u.id FROM users u JOIN user_roles r ON r.user_id = u.id
    WHERE r.entity_id = ? AND r.role IN ('secretariat', 'gestionnaire') AND u.is_active = 1`).all(entityId).map((r) => r.id);
}

function copiesOf(mailId) {
  return getDb().prepare(`SELECT c.service_id, s.name_fr, s.name_nl FROM mail_copies c JOIN org_services s ON s.id = c.service_id
    WHERE c.mail_id = ? ORDER BY s.name_fr`).all(mailId);
}

/** Historique d'attribution d'un courrier, du plus récent au plus ancien, avec les noms (pas d'objet ni d'expéditeur). */
function history(mailId) {
  return getDb().prepare(`SELECT h.id, h.kind, h.service_id, s.name_fr AS service_name_fr, s.name_nl AS service_name_nl,
    h.from_service_id, f.name_fr AS from_service_name_fr, f.name_nl AS from_service_name_nl,
    h.agent_id, a.first_name AS agent_first_name, a.last_name AS agent_last_name,
    h.from_agent_id, fa.first_name AS from_agent_first_name, fa.last_name AS from_agent_last_name,
    h.copies, h.reason, h.author_id, u.first_name AS author_first_name, u.last_name AS author_last_name, h.created_at
    FROM mail_attributions h LEFT JOIN org_services s ON s.id = h.service_id LEFT JOIN org_services f ON f.id = h.from_service_id
    LEFT JOIN users a ON a.id = h.agent_id LEFT JOIN users fa ON fa.id = h.from_agent_id LEFT JOIN users u ON u.id = h.author_id
    WHERE h.mail_id = ? ORDER BY h.id DESC`).all(mailId).map((h) => ({ ...h, copies: h.copies ? JSON.parse(h.copies) : null }));
}

function writeEvent(db, mailId, user, e) {
  db.prepare(`INSERT INTO mail_attributions (mail_id, kind, service_id, from_service_id, agent_id, from_agent_id, copies, reason, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(mailId, e.kind, e.service_id ?? null, e.from_service_id ?? null, e.agent_id ?? null,
    e.from_agent_id ?? null, e.copies ? JSON.stringify(e.copies) : null, e.reason || null, user.id);
}

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

/**
 * Attribution par le secrétariat : service traitant, agent nommé (facultatif), services en copie (facultatif).
 * agent_id absent : inchangé si le service ne change pas, effacé sinon. copy_service_ids absent : inchangé.
 */
function attribute(user, mailId, data, channel = 'api') {
  const m = loadMail(mailId);
  assertRegister(user, m.entity_id);
  if (m.status === 'annule') throw new AppError(409, 'CANCELLED');
  checkService(data.service_id, m.entity_id);
  const db = getDb();
  const currentCopies = copiesOf(m.id).map((c) => c.service_id);
  // Un service n'est jamais traitant et en copie à la fois : sans liste de copies donnée, le nouveau service traitant
  // quitte la liste des copies (cas courant : un courrier renvoyé est réattribué au service qui l'avait en copie).
  // Une liste donnée qui contient le service traitant reste une erreur.
  const copies = data.copy_service_ids !== undefined ? [...new Set(data.copy_service_ids)] : currentCopies.filter((c) => c !== data.service_id);
  for (const c of copies) {
    if (c === data.service_id) throw new AppError(409, 'SERVICE_INVALID');
    checkService(c, m.entity_id);
  }
  const serviceChanged = m.service_id !== data.service_id;
  const reason = data.reason && data.reason.trim() ? data.reason.trim() : null;
  if (serviceChanged && m.service_id && !reason) throw new AppError(400, 'REASON_REQUIRED');
  const agentId = data.agent_id !== undefined ? data.agent_id : (serviceChanged ? null : m.agent_id);
  if (agentId) checkAgent(agentId, m.entity_id, data.service_id);
  const agentChanged = (agentId || null) !== (m.agent_id || null);
  const copiesChanged = !sameSet(copies, currentCopies);
  if (!serviceChanged && !agentChanged && !copiesChanged) return loadMail(m.id);

  const kind = serviceChanged ? (m.service_id ? 'reattribution' : 'attribution') : (agentChanged ? 'agent' : 'copies');
  const added = copies.filter((c) => !currentCopies.includes(c));
  db.transaction(() => {
    if (serviceChanged) {
      db.prepare(`UPDATE mails SET service_id = ?, agent_id = ?, attributed_at = datetime('now'), return_reason = NULL, returned_at = NULL,
        updated_by = ?, updated_at = datetime('now') WHERE id = ?`).run(data.service_id, agentId || null, user.id, m.id);
    } else if (agentChanged) {
      db.prepare("UPDATE mails SET agent_id = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?").run(agentId || null, user.id, m.id);
    }
    if (copiesChanged) {
      db.prepare('DELETE FROM mail_copies WHERE mail_id = ?').run(m.id);
      for (const c of copies) db.prepare('INSERT INTO mail_copies (mail_id, service_id, added_by) VALUES (?, ?, ?)').run(m.id, c, user.id);
    }
    writeEvent(db, m.id, user, { kind, service_id: data.service_id, from_service_id: m.service_id, agent_id: agentId, from_agent_id: m.agent_id, copies: copiesChanged ? copies : null, reason });
    // Notifications : l'agent nommé, sinon le service traitant ; les services mis en copie.
    if (serviceChanged || agentChanged) {
      if (agentId) notify([agentId], m.id, 'attribue', user.id);
      else if (serviceChanged) notify(memberIds(data.service_id, m.entity_id), m.id, 'service', user.id);
    }
    for (const c of added) notify(memberIds(c, m.entity_id), m.id, 'copie', user.id);
  })();
  logAudit(user.id, 'mail.attribute', 'mail', m.id, { number: m.number, kind, service_id: data.service_id, agent_id: agentId || null, copy_service_ids: copies, reason }, channel);
  return loadMail(m.id);
}

/** Nomination ou changement de l'agent dans le service traitant : responsable de ce service ou secrétariat. */
function setAgent(user, mailId, agentId, channel = 'api') {
  const m = loadMail(mailId);
  if (m.status === 'annule') throw new AppError(409, 'CANCELLED');
  if (!mailRights(user, m).set_agent) throw new AppError(403, 'FORBIDDEN');
  if (agentId) checkAgent(agentId, m.entity_id, m.service_id);
  if ((agentId || null) === (m.agent_id || null)) return m;
  const db = getDb();
  db.transaction(() => {
    db.prepare("UPDATE mails SET agent_id = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?").run(agentId || null, user.id, m.id);
    writeEvent(db, m.id, user, { kind: 'agent', service_id: m.service_id, from_service_id: m.service_id, agent_id: agentId, from_agent_id: m.agent_id });
    if (agentId) notify([agentId], m.id, 'attribue', user.id);
  })();
  logAudit(user.id, 'mail.agent', 'mail', m.id, { number: m.number, agent_id: agentId || null, from_agent_id: m.agent_id }, channel);
  return loadMail(m.id);
}

/** Renvoi au secrétariat (CE-062) : le courrier perd son service traitant et son agent, le motif reste visible. */
function returnToSecretariat(user, mailId, reason, channel = 'api') {
  const m = loadMail(mailId);
  if (m.status === 'annule') throw new AppError(409, 'CANCELLED');
  if (!mailRights(user, m).return_to_secretariat) throw new AppError(403, 'FORBIDDEN');
  const text = String(reason || '').trim();
  if (!text) throw new AppError(400, 'REASON_REQUIRED');
  const db = getDb();
  db.transaction(() => {
    db.prepare(`UPDATE mails SET service_id = NULL, agent_id = NULL, return_reason = ?, returned_at = datetime('now'),
      updated_by = ?, updated_at = datetime('now') WHERE id = ?`).run(text, user.id, m.id);
    writeEvent(db, m.id, user, { kind: 'renvoi', service_id: null, from_service_id: m.service_id, agent_id: null, from_agent_id: m.agent_id, reason: text });
    notify(registerMemberIds(m.entity_id), m.id, 'renvoye', user.id);
  })();
  logAudit(user.id, 'mail.return', 'mail', m.id, { number: m.number, from_service_id: m.service_id, reason: text }, channel);
  return loadMail(m.id);
}

/** Entités où la personne a un rôle qui ouvre cette bannette. */
function boxEntities(user, box) {
  if (box === 'a_attribuer') return registerEntities(user);
  return [...new Set(rolesOf(user).filter((r) => AGENT_ROLES.includes(r.role)).map((r) => r.entity_id))];
}

const marks = (list) => list.map(() => '?').join(', ');

/**
 * Condition SQL d'une bannette pour la personne : { sql, params }, à joindre aux autres conditions de la liste.
 * Les courriers annulés n'y figurent pas. Aucune entité applicable : condition toujours fausse.
 * entity_id absent : toutes les entités où la bannette a un sens pour la personne.
 */
function boxCondition(user, box, entityId) {
  const allowed = boxEntities(user, box);
  if (entityId && !allowed.includes(Number(entityId))) throw new AppError(403, 'FORBIDDEN');
  const ents = entityId ? [Number(entityId)] : allowed;
  if (ents.length === 0) return { sql: '0 = 1', params: [] };
  if (box === 'a_attribuer') {
    return { sql: `(m.entity_id IN (${marks(ents)}) AND m.service_id IS NULL AND m.status = 'enregistre')`, params: [...ents] };
  }
  if (box === 'moi') {
    return { sql: `(m.agent_id = ? AND m.entity_id IN (${marks(ents)}) AND m.status = 'enregistre')`, params: [user.id, ...ents] };
  }
  const groups = [];
  const params = [];
  for (const e of ents) {
    const services = serviceIdsOf(user.id, e);
    if (services.length === 0) continue;
    if (box === 'mon_service') groups.push(`(m.entity_id = ? AND m.service_id IN (${marks(services)}))`);
    else groups.push(`(m.entity_id = ? AND m.id IN (SELECT mail_id FROM mail_copies WHERE service_id IN (${marks(services)})))`);
    params.push(e, ...services);
  }
  if (groups.length === 0) return { sql: '0 = 1', params: [] };
  return { sql: `((${groups.join(' OR ')}) AND m.status = 'enregistre')`, params };
}

/** Compteurs des onglets de bannettes pour la personne (CE-120) : « À enregistrer » compte la file de dépôt. */
function counts(user, { entity_id: entityId } = {}) {
  const db = getDb();
  const hasRole = rolesOf(user).some((r) => (!entityId || r.entity_id === Number(entityId)) && [...REGISTER_ROLES, ...AGENT_ROLES].includes(r.role));
  if (entityId && !hasRole) throw new AppError(403, 'FORBIDDEN');
  const out = { a_enregistrer: 0, a_attribuer: 0, mon_service: 0, moi: 0, en_copie: 0 };
  const ents = registerEntities(user).filter((e) => !entityId || e === Number(entityId));
  if (ents.length > 0) {
    out.a_enregistrer = db.prepare(`SELECT COUNT(*) AS n FROM pieces WHERE status = 'a_enregistrer' AND entity_id IN (${ents.map(() => '?').join(', ')})`).get(...ents).n;
  }
  for (const box of BOXES) {
    const allowed = boxEntities(user, box);
    if (entityId && !allowed.includes(Number(entityId))) continue;
    const cond = boxCondition(user, box, entityId);
    out[box] = db.prepare(`SELECT COUNT(*) AS n FROM mails m WHERE ${cond.sql}`).get(...cond.params).n;
  }
  return out;
}

/**
 * Personnes d'un service qui traitent son courrier, pour nommer un agent. Lecture : administrateur, tenant du registre
 * d'une entité du service, ou membre du service. Ni courriel ni donnée de compte : prénom, nom et rôle.
 */
function members(user, serviceId, { entity_id: entityId } = {}) {
  const db = getDb();
  const service = db.prepare('SELECT id FROM org_services WHERE id = ?').get(serviceId);
  if (!service) throw new AppError(404, 'NOT_FOUND');
  const served = db.prepare('SELECT entity_id FROM org_service_entities WHERE service_id = ?').all(serviceId).map((r) => r.entity_id)
    .filter((e) => !entityId || e === Number(entityId));
  const allowed = served.filter((e) => user.role === 'admin' || isRegister(user, e) || isMemberOf(user, e, serviceId));
  if (allowed.length === 0) throw new AppError(403, 'FORBIDDEN');
  const rows = [];
  for (const e of allowed) {
    rows.push(...db.prepare(`SELECT u.id, u.first_name, u.last_name, r.role, r.entity_id FROM users u
      JOIN user_roles r ON r.user_id = u.id AND r.entity_id = ?
      JOIN user_services us ON us.user_id = u.id AND us.entity_id = r.entity_id AND us.service_id = ?
      WHERE u.is_active = 1 AND r.role IN ('agent', 'chef_service') ORDER BY u.last_name, u.first_name`).all(e, serviceId));
  }
  return rows;
}

module.exports = { BOXES, attribute, setAgent, returnToSecretariat, boxCondition, counts, members, copiesOf, history };
