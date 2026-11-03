/**
 * Tickets de l'application (standard v3.3, section 13.5) : signalement par tout utilisateur, traitement ITIL par les files.
 * Adaptation à courrier (décision du 03/11/2026) : le ticket porte l'entité du demandeur.
 * - File IT (incident, bug, souhait) : rôles réglés dans tickets.it_roles, par défaut l'administrateur.
 * - File métier (question avec entité) : rôles réglés dans tickets.business_roles, par défaut le gestionnaire du registre,
 *   dans l'entité du ticket seulement (un rôle vaut pour une entité). Une question sans entité va à la file IT.
 * - Le code « admin » désigne le rôle global ; les autres codes sont des rôles par entité, valables dans l'entité du ticket.
 * - Aucune capture sur les écrans qui affichent du courrier (RGPD by design) ; le contexte joint ne contient jamais de donnée de courrier.
 * Priorité impact × urgence, délais par priorité en paramètre, transitions contrôlées, rien n'est supprimé.
 */
const { getDb } = require('../database');
const { AppError } = require('../envelope');
const { logAudit } = require('../audit');
const { getSetting, setSetting, listSetting, DEFAULTS } = require('../settings');
const { rolesOf } = require('../rights');

const IMPACT = { person: 3, service: 2, organisation: 1 };
const URGENCY = { blocking: 1, annoying: 2, comfort: 3 };
const OPEN = ['new', 'in_progress', 'waiting_requester'];
const TRANSITIONS = {
  in_progress: { from: ['new', 'waiting_requester'], who: 'handler', reason: false },
  waiting_requester: { from: ['new', 'in_progress'], who: 'handler', reason: true },
  resolved: { from: OPEN, who: 'handler', reason: true },
  rejected: { from: OPEN, who: 'handler', reason: true },
  cancelled: { from: OPEN, who: 'both', reason: true },
  closed: { from: ['resolved'], who: 'both', reason: false },
  reopen: { from: ['resolved'], who: 'requester', reason: true },
};
const LIST_COLUMNS = `t.id, t.reference, t.type, t.title, t.queue, t.priority, t.status, t.wish_status, t.fixed_version, t.screen,
  t.requester_id, t.assignee_id, t.entity_id, t.due_resolution_at, t.created_at, t.updated_at, (t.screenshot IS NOT NULL) AS has_screenshot,
  (t.status IN ('new', 'in_progress', 'waiting_requester') AND t.due_resolution_at < datetime('now')) AS overdue,
  r.first_name || ' ' || r.last_name AS requester_name, a.first_name || ' ' || a.last_name AS assignee_name, e.code AS entity_code`;

const ROLE_CODES = ['admin', 'agent', 'chef_service', 'secretariat', 'gestionnaire', 'auditeur'];
/** Écrans qui affichent du courrier : aucune capture (identifiants de src/screens.ts de l'interface). */
const NO_CAPTURE_SCREENS = new Set(['register', 'inbox', 'registration', 'consultations']);
const QUEUE_KEY = { business: 'tickets.business_roles', it: 'tickets.it_roles' };

const priorityOf = (impact, urgency) => ({ 2: 'P1', 3: 'P2', 4: 'P3' })[impact + urgency] || 'P4';
const queueRoles = (q) => listSetting(QUEUE_KEY[q]);

/** Vrai si la personne tient, pour cette file et cette entité, l'un des rôles réglés. */
function holdsQueue(user, q, entityId) {
  const codes = queueRoles(q);
  if (codes.includes('admin') && user.role === 'admin') return true;
  if (entityId === null || entityId === undefined) return false;
  return rolesOf(user).some((r) => r.entity_id === entityId && codes.includes(r.role));
}
const canHandle = (user, t) => holdsQueue(user, t.queue, t.entity_id);
const canSee = (user, t) => t.requester_id === user.id || canHandle(user, t);

/** Condition SQL des tickets que la personne peut traiter (null si aucune file). */
function handlerCondition(user, a = 't') {
  const parts = [];
  const params = [];
  for (const q of ['business', 'it']) {
    const codes = queueRoles(q);
    if (codes.includes('admin') && user.role === 'admin') { parts.push(`${a}.queue = ?`); params.push(q); continue; }
    const ents = [...new Set(rolesOf(user).filter((r) => codes.includes(r.role)).map((r) => r.entity_id))];
    if (ents.length) { parts.push(`(${a}.queue = ? AND ${a}.entity_id IN (${ents.map(() => '?').join(', ')}))`); params.push(q, ...ents); }
  }
  return parts.length ? { sql: `(${parts.join(' OR ')})`, params } : null;
}
const userEntities = (user) => [...new Set(rolesOf(user).map((r) => r.entity_id))];

function dues(priority, from = "datetime('now')") {
  let sla;
  try { sla = JSON.parse(getSetting('tickets.sla_json')); } catch (e) { sla = {}; }
  const [resp, resol] = sla[priority] || [24, 240];
  return { resp: `+${Number(resp)} hours`, resol: `+${Number(resol)} hours`, from };
}

/** Image PNG ou JPEG en data URL, contrôlée sur ses premiers octets, 2 Mo au plus. */
function checkScreenshot(dataUrl) {
  if (!dataUrl) return null;
  const m = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw new AppError(400, 'VALIDATION', ['screenshot: format']);
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 2 * 1024 * 1024) throw new AppError(413, 'PAYLOAD_TOO_LARGE');
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const jpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (!(m[1] === 'png' ? png : jpg)) throw new AppError(400, 'VALIDATION', ['screenshot: contenu']);
  return dataUrl;
}

function load(id) {
  const t = getDb().prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!t) throw new AppError(404, 'NOT_FOUND');
  return t;
}

function event(ticketId, userId, code) {
  getDb().prepare("INSERT INTO ticket_messages (ticket_id, author_id, kind, body, is_internal) VALUES (?, ?, 'event', ?, 0)").run(ticketId, userId, code);
}

function list(user, { limit = 50, offset = 0, q, status, type, queue, open_only, mine } = {}) {
  const where = [];
  const params = [];
  const cond = handlerCondition(user);
  if (cond) { where.push(`(t.requester_id = ? OR ${cond.sql})`); params.push(user.id, ...cond.params); } else { where.push('t.requester_id = ?'); params.push(user.id); }
  if (status) { where.push('t.status = ?'); params.push(status); }
  if (type) { where.push('t.type = ?'); params.push(type); }
  if (queue) { where.push('t.queue = ?'); params.push(queue); }
  if (open_only) where.push("t.status IN ('new', 'in_progress', 'waiting_requester')");
  if (mine) { where.push('(t.assignee_id = ? OR t.requester_id = ?)'); params.push(user.id, user.id); }
  if (q) { where.push('(t.title LIKE ? OR t.reference LIKE ? OR t.description LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const clause = `WHERE ${where.join(' AND ')}`;
  const db = getDb();
  const total = db.prepare(`SELECT COUNT(*) AS n FROM tickets t ${clause}`).get(...params).n;
  const rows = db.prepare(`SELECT ${LIST_COLUMNS} FROM tickets t JOIN users r ON r.id = t.requester_id LEFT JOIN users a ON a.id = t.assignee_id LEFT JOIN entities e ON e.id = t.entity_id ${clause}
    ORDER BY CASE t.status WHEN 'new' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'waiting_requester' THEN 2 ELSE 3 END, t.priority, t.created_at DESC
    LIMIT ? OFFSET ?`).all(...params, limit, offset);
  return { rows, pagination: { total, limit, offset } };
}

function get(user, id) {
  const t = load(id);
  if (!canSee(user, t)) throw new AppError(403, 'FORBIDDEN');
  const handler = canHandle(user, t);
  const internalClause = handler ? '' : 'AND m.is_internal = 0';
  const messages = getDb().prepare(`SELECT m.id, m.kind, m.body, m.is_internal, m.created_at, m.author_id, u.first_name || ' ' || u.last_name AS author_name
    FROM ticket_messages m LEFT JOIN users u ON u.id = m.author_id WHERE m.ticket_id = ? ${internalClause} ORDER BY m.id`).all(id);
  const { screenshot, ...rest } = t;
  let context = null;
  try { context = t.context_json ? JSON.parse(t.context_json) : null; } catch (e) { context = null; }
  const reopenDays = Number(getSetting('tickets.reopen_days')) || 14;
  const canReopen = t.requester_id === user.id && t.status === 'resolved'
    && !!getDb().prepare("SELECT 1 FROM tickets WHERE id = ? AND resolved_at > datetime('now', ?)").get(id, `-${reopenDays} days`);
  const entity = t.entity_id ? getDb().prepare('SELECT code FROM entities WHERE id = ?').get(t.entity_id) : null;
  return { ...rest, entity_code: entity ? entity.code : null, context, has_screenshot: !!screenshot, messages, can_handle: handler, can_reopen: canReopen };
}

function create(user, data, channel = 'api') {
  const db = getDb();
  const mine = userEntities(user);
  let entityId = data.entity_id === undefined ? null : data.entity_id;
  if (entityId !== null && !mine.includes(entityId)) throw new AppError(403, 'FORBIDDEN');
  if (entityId === null && mine.length === 1) [entityId] = mine;
  if (data.type === 'question' && entityId === null && mine.length > 1) throw new AppError(400, 'VALIDATION', ['entity_id: obligatoire pour une question métier']);
  // Une question va à la file métier de l'entité ; sans entité (administrateur seul), à la file IT.
  const queue = data.type === 'question' && entityId !== null ? 'business' : 'it';
  if (data.screenshot && NO_CAPTURE_SCREENS.has(data.screen)) throw new AppError(400, 'SCREENSHOT_NOT_ALLOWED');
  const impact = IMPACT[data.impact || 'person'];
  const urgency = URGENCY[data.urgency || 'annoying'];
  const priority = priorityOf(impact, urgency);
  const screenshot = checkScreenshot(data.screenshot);
  const context = data.context ? JSON.stringify(data.context).slice(0, 4000) : null;
  const d = dues(priority);
  const id = db.transaction(() => {
    const year = new Date().getUTCFullYear();
    const n = db.prepare('SELECT COUNT(*) AS n FROM tickets WHERE reference LIKE ?').get(`TCK-${year}-%`).n + 1;
    const reference = `TCK-${year}-${String(n).padStart(5, '0')}`;
    const r = db.prepare(`INSERT INTO tickets (reference, type, title, description, expected, actual, queue, entity_id, impact, urgency, priority,
      requester_id, screen, context_json, screenshot, due_response_at, due_resolution_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))`)
      .run(reference, data.type, data.title, data.description || null, data.expected || null, data.actual || null, queue, entityId,
        impact, urgency, priority, user.id, data.screen || null, context, screenshot, d.resp, d.resol);
    event(r.lastInsertRowid, user.id, 'created');
    return r.lastInsertRowid;
  })();
  logAudit(user.id, 'ticket.create', 'ticket', id, { type: data.type, priority, queue, entity_id: entityId }, channel);
  return get(user, id);
}

function update(user, id, data, channel = 'api') {
  const t = load(id);
  if (!canSee(user, t)) throw new AppError(403, 'FORBIDDEN');
  if (!OPEN.includes(t.status)) throw new AppError(409, 'TICKET_CLOSED');
  const handler = canHandle(user, t);
  const requesterFields = ['title', 'description', 'expected', 'actual'];
  const handlerFields = ['assignee_id', 'impact', 'urgency', 'priority', 'wish_status', 'fixed_version', 'queue'];
  const sets = [];
  const params = [];
  for (const [k, v] of Object.entries(data)) {
    if (k === 'reason') continue;
    const allowed = (handlerFields.includes(k) && handler) || (requesterFields.includes(k) && t.requester_id === user.id && t.status === 'new');
    if (!allowed) throw new AppError(403, 'FORBIDDEN');
    if (k === 'impact') { sets.push('impact = ?'); params.push(IMPACT[v]); continue; }
    if (k === 'urgency') { sets.push('urgency = ?'); params.push(URGENCY[v]); continue; }
    sets.push(`${k} = ?`);
    params.push(v);
  }
  if (data.queue === 'business' && t.entity_id === null) throw new AppError(409, 'TICKET_NO_ENTITY');
  if ((data.priority || data.queue || (data.wish_status === 'refused')) && !data.reason) throw new AppError(400, 'REASON_REQUIRED');
  if (!sets.length) return get(user, id);
  const db = getDb();
  db.transaction(() => {
    db.prepare(`UPDATE tickets SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...params, id);
    const after = load(id);
    if ((data.impact || data.urgency) && !data.priority) db.prepare('UPDATE tickets SET priority = ? WHERE id = ?').run(priorityOf(after.impact, after.urgency), id);
    if (data.impact || data.urgency || data.priority) {
      const d = dues(load(id).priority);
      db.prepare('UPDATE tickets SET due_response_at = datetime(created_at, ?), due_resolution_at = datetime(created_at, ?) WHERE id = ?').run(d.resp, d.resol, id);
    }
    if (data.queue && data.queue !== t.queue) db.prepare('UPDATE tickets SET assignee_id = NULL WHERE id = ?').run(id);
    event(id, user.id, data.queue && data.queue !== t.queue ? `queue:${data.queue}` : 'updated');
    if (data.reason) db.prepare("INSERT INTO ticket_messages (ticket_id, author_id, kind, body, is_internal) VALUES (?, ?, 'message', ?, 1)").run(id, user.id, data.reason);
  })();
  logAudit(user.id, 'ticket.update', 'ticket', id, { fields: Object.keys(data) }, channel);
  // Un transfert peut retirer à son auteur l'accès au ticket : la réponse se limite alors à l'état du transfert.
  const after = load(id);
  if (!canSee(user, after)) return { id, reference: after.reference, queue: after.queue, transferred: true };
  return get(user, id);
}

function changeStatus(user, id, { to, reason }, channel = 'api') {
  const t = load(id);
  if (!canSee(user, t)) throw new AppError(403, 'FORBIDDEN');
  const rule = TRANSITIONS[to];
  if (!rule || !rule.from.includes(t.status)) throw new AppError(409, 'TRANSITION');
  const handler = canHandle(user, t);
  const requester = t.requester_id === user.id;
  const permitted = rule.who === 'handler' ? handler : rule.who === 'requester' ? requester : (handler || requester);
  if (!permitted) throw new AppError(403, 'FORBIDDEN');
  if (rule.reason && !reason) throw new AppError(400, 'REASON_REQUIRED');
  if (to === 'reopen' && !get(user, id).can_reopen) throw new AppError(409, 'TRANSITION');
  const db = getDb();
  const target = to === 'reopen' ? 'in_progress' : to;
  db.transaction(() => {
    const extra = [];
    if (target === 'in_progress') extra.push('assignee_id = COALESCE(assignee_id, ?)', "first_response_at = COALESCE(first_response_at, datetime('now'))");
    if (target === 'resolved') extra.push("resolved_at = datetime('now')", 'resolution = ?');
    if (['closed', 'rejected', 'cancelled'].includes(target)) extra.push("closed_at = datetime('now')");
    const params = [];
    if (target === 'in_progress') params.push(handler ? user.id : null);
    if (target === 'resolved') params.push(reason);
    db.prepare(`UPDATE tickets SET status = ?, status_reason = ?${extra.length ? ', ' + extra.join(', ') : ''}, updated_at = datetime('now') WHERE id = ?`)
      .run(target, reason || null, ...params, id);
    event(id, user.id, `status:${to}`);
    if (reason) db.prepare("INSERT INTO ticket_messages (ticket_id, author_id, kind, body, is_internal) VALUES (?, ?, 'message', ?, 0)").run(id, user.id, reason);
  })();
  logAudit(user.id, `ticket.${to}`, 'ticket', id, { reason }, channel);
  return get(user, id);
}

function addMessage(user, id, { body, is_internal = false }, channel = 'api') {
  const t = load(id);
  if (!canSee(user, t)) throw new AppError(403, 'FORBIDDEN');
  if (!OPEN.includes(t.status)) throw new AppError(409, 'TICKET_CLOSED');
  const handler = canHandle(user, t);
  if (is_internal && !handler) throw new AppError(403, 'FORBIDDEN');
  const db = getDb();
  db.transaction(() => {
    db.prepare("INSERT INTO ticket_messages (ticket_id, author_id, kind, body, is_internal) VALUES (?, ?, 'message', ?, ?)").run(id, user.id, body, is_internal ? 1 : 0);
    if (t.requester_id === user.id && t.status === 'waiting_requester') {
      db.prepare("UPDATE tickets SET status = 'in_progress', updated_at = datetime('now') WHERE id = ?").run(id);
      event(id, user.id, 'status:in_progress');
    }
    if (handler && !is_internal) db.prepare("UPDATE tickets SET first_response_at = COALESCE(first_response_at, datetime('now')) WHERE id = ?").run(id);
  })();
  logAudit(user.id, 'ticket.message', 'ticket', id, { internal: !!is_internal }, channel);
  return get(user, id);
}

function screenshot(user, id) {
  const t = load(id);
  if (!canSee(user, t)) throw new AppError(403, 'FORBIDDEN');
  if (!t.screenshot) throw new AppError(404, 'NOT_FOUND');
  return t.screenshot;
}

function stats(user) {
  const cond = handlerCondition(user);
  if (!cond) throw new AppError(403, 'FORBIDDEN');
  const db = getDb();
  const one = (sql) => db.prepare(`SELECT COUNT(*) AS n FROM tickets t WHERE ${cond.sql} AND ${sql}`).get(...cond.params).n;
  const group = (col) => db.prepare(`SELECT ${col} AS k, COUNT(*) AS n FROM tickets t WHERE ${cond.sql} GROUP BY ${col} ORDER BY n DESC LIMIT 10`).all(...cond.params);
  return {
    open: one("t.status IN ('new', 'in_progress', 'waiting_requester')"),
    overdue: one("t.status IN ('new', 'in_progress', 'waiting_requester') AND t.due_resolution_at < datetime('now')"),
    unassigned: one("t.status IN ('new', 'in_progress', 'waiting_requester') AND t.assignee_id IS NULL"),
    resolved_30d: one("t.resolved_at > datetime('now', '-30 days')"),
    by_priority: group('t.priority'), by_type: group('t.type'), by_screen: group('t.screen'),
  };
}

/** Tickets ouverts que la personne peut traiter, avec leur contexte : base de l'outil MCP pour Claude. */
function toHandle(user) {
  const cond = handlerCondition(user);
  if (!cond) return [];
  return getDb().prepare(`SELECT t.id, t.reference, t.type, t.title, t.description, t.expected, t.actual, t.priority, t.status, t.screen, t.entity_id, t.context_json, t.created_at, t.due_resolution_at
    FROM tickets t WHERE ${cond.sql} AND t.status IN ('new', 'in_progress') ORDER BY t.priority, t.created_at LIMIT 100`).all(...cond.params);
}

// ---- Réglages (Administration › Paramètres › Tickets) : délais ITIL, délai de réouverture, rôles de chaque file.
const adminOnly = (user) => { if (!user || user.role !== 'admin') throw new AppError(403, 'FORBIDDEN'); };
function settingsView() {
  let sla;
  try { sla = JSON.parse(getSetting('tickets.sla_json')); } catch (e) { sla = JSON.parse(DEFAULTS['tickets.sla_json']); }
  return {
    sla, reopen_days: Number(getSetting('tickets.reopen_days')) || 14,
    business_roles: queueRoles('business'), it_roles: queueRoles('it'),
    defaults: { sla: JSON.parse(DEFAULTS['tickets.sla_json']), reopen_days: Number(DEFAULTS['tickets.reopen_days']), business_roles: DEFAULTS['tickets.business_roles'].split(','), it_roles: DEFAULTS['tickets.it_roles'].split(',') },
    role_codes: ROLE_CODES,
  };
}
function getSettings(user) { adminOnly(user); return settingsView(); }
function updateSettings(user, data, channel = 'api') {
  adminOnly(user);
  if (data.sla) for (const p of ['P1', 'P2', 'P3', 'P4']) if (data.sla[p][0] > data.sla[p][1]) throw new AppError(400, 'VALIDATION', [`sla.${p}: la prise en charge ne peut pas dépasser la résolution`]);
  const before = settingsView();
  getDb().transaction(() => {
    if (data.sla) setSetting('tickets.sla_json', JSON.stringify(data.sla));
    if (data.reopen_days !== undefined) setSetting('tickets.reopen_days', String(data.reopen_days));
    if (data.business_roles) setSetting('tickets.business_roles', data.business_roles.join(','));
    if (data.it_roles) setSetting('tickets.it_roles', data.it_roles.join(','));
  })();
  const after = settingsView();
  logAudit(user.id, 'settings.tickets', 'settings', null, { from: { sla: before.sla, reopen_days: before.reopen_days, business_roles: before.business_roles, it_roles: before.it_roles }, to: { sla: after.sla, reopen_days: after.reopen_days, business_roles: after.business_roles, it_roles: after.it_roles } }, channel);
  return after;
}

module.exports = { list, get, create, update, changeStatus, addMessage, screenshot, stats, toHandle, getSettings, updateSettings, priorityOf, TRANSITIONS, ROLE_CODES, NO_CAPTURE_SCREENS };
