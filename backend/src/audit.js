/** Journal d'audit de toute écriture et de toute connexion (patron SAGA audit.js, canal ajouté). */
const { getDb } = require('./database');

function logAudit(userId, action, entityType, entityId, details, channel = 'api') {
  try {
    getDb().prepare(`INSERT INTO audit_log (user_id, action, entity_type, entity_id, channel, details_json)
      VALUES (?, ?, ?, ?, ?, ?)`).run(userId || null, action, entityType || null, entityId || null, channel, details ? JSON.stringify(details) : null);
  } catch (e) {
    console.error('[AUDIT] Écriture impossible :', e.message);
  }
}

module.exports = { logAudit };
