/**
 * Paramètres de l'instance modifiables dans Administration › Paramètres (standard v3.2, sections 11.4 et 17.3).
 * Version 0.2.0 : taille maximale d'un fichier déposé (décision D-23 du 20/10/2026) et taille maximale d'une lecture
 * de pièce par un assistant (MCP). Les défauts viennent de config/instance.defaut.json ; la table app_settings porte
 * les valeurs de l'instance, qui priment. Tout changement s'inscrit au journal d'audit avec son auteur.
 * Plafond technique du dépôt : 50 Mo, fixé par client_max_body_size de nginx.conf (51 Mo, marge de l'envoi comprise).
 */
const { getDb } = require('../database');
const { logAudit } = require('../audit');
const { assertAdmin } = require('../rights');
const { DEFAULTS, instanceSettings } = require('../instance');

/** Paramètre exposé → clé en base. Seuls ces paramètres se modifient par l'API. */
const KEYS = {
  pieces_max_mb: 'pieces.max_mb',
  pieces_mcp_read_max_mb: 'pieces.mcp_read_max_mb',
};

function view() {
  const s = instanceSettings();
  return {
    pieces_max_mb: Number(s.pieces.max_mb),
    pieces_mcp_read_max_mb: Number(s.pieces.mcp_read_max_mb),
    defaults: { pieces_max_mb: Number(DEFAULTS.pieces.max_mb), pieces_mcp_read_max_mb: Number(DEFAULTS.pieces.mcp_read_max_mb) },
  };
}

function get(user) {
  assertAdmin(user);
  return view();
}

function update(user, data, channel = 'api') {
  assertAdmin(user);
  const db = getDb();
  const before = view();
  const changed = {};
  db.transaction(() => {
    for (const [field, key] of Object.entries(KEYS)) {
      if (data[field] === undefined) continue;
      db.prepare("INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
        .run(key, String(data[field]));
      changed[field] = { from: before[field], to: data[field] };
    }
  })();
  if (Object.keys(changed).length) logAudit(user.id, 'settings.update', 'settings', null, changed, channel);
  return view();
}

module.exports = { KEYS, get, update };
