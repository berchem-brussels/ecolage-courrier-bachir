/**
 * Routes libres, sans session, en liste écrite et courte (standard v3.2, section 7.3) :
 * santé, version, paramètres publics de l'instance, assistant d'installation tant qu'aucun compte n'existe.
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database');
const { validate } = require('../validation');
const { ok, fail, handle } = require('../envelope');
const { openSession } = require('../auth');
const { logAudit } = require('../audit');
const { VERSION, ENVIRONMENT } = require('../config');
const { instanceSettings } = require('../instance');
const S = require('../schemas');

const router = express.Router();

const installed = () => getDb().prepare('SELECT COUNT(*) AS n FROM users').get().n > 0;

router.get('/health', (req, res) => ok(res, { status: 'ok', version: VERSION }, { version: VERSION }));
router.get('/version', (req, res) => ok(res, { version: VERSION }, { version: VERSION }));

router.get('/settings/public', handle((req, res) => {
  const s = instanceSettings();
  ok(res, { ...s, auth: { mode: 'local' }, installed: installed(), version: VERSION, environment: ENVIRONMENT }, { resource: 'settings' });
}));

/** Premier administrateur : possible une seule fois, tant que la base ne contient aucun compte. */
router.post('/install', validate(S.installation), handle((req, res) => {
  if (installed()) return fail(res, req, 409, 'INSTALL_CLOSED');
  const db = getDb();
  const r = db.prepare(`INSERT INTO users (email, first_name, last_name, user_role, password_hash) VALUES (?, ?, ?, 'admin', ?)`)
    .run(req.body.email.trim(), req.body.first_name, req.body.last_name, bcrypt.hashSync(req.body.password, 10));
  logAudit(r.lastInsertRowid, 'install.first_admin', 'user', r.lastInsertRowid, { email: req.body.email });
  const { csrf } = openSession(req, res, { id: r.lastInsertRowid });
  ok(res, { installed: true, csrf_token: csrf }, { resource: 'install' }, null, 201);
}));

router.PUBLIC_ROUTES = ['GET /api/health', 'GET /api/version', 'GET /api/settings/public', 'POST /api/install', 'POST /api/auth/login'];

module.exports = router;
