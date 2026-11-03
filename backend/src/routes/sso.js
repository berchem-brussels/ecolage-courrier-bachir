/**
 * Connexion Microsoft compatible avec Portal (standard, section 8.6) et réglages de connexion (administrateur).
 * GET /api/auth/config, GET /api/auth/sso/start, GET /api/auth/callback : routes libres.
 * GET et PUT /api/settings/auth : administrateur ; le secret est chiffré et jamais renvoyé.
 */
const express = require('express');
const { getDb } = require('../database');
const { ok, fail, handle } = require('../envelope');
const { openSession, readCookies, isHttps, appendCookie, authMiddleware, requireRole } = require('../auth');
const { validate } = require('../validation');
const { logAudit } = require('../audit');
const { getSetting, setSetting, isSet, listSetting } = require('../settings');
const oidc = require('../oidc');
const S = require('../schemas');

const router = express.Router();
const STATE_COOKIE = 'app_oidc';
const PENDING_MINUTES = 15;

function config() {
  return {
    mode: getSetting('auth.mode'),
    tenant: getSetting('auth.tenant'),
    clientId: getSetting('auth.client_id'),
    clientSecret: getSetting('auth.client_secret'),
    publicUrl: getSetting('auth.public_url').replace(/\/$/, ''),
  };
}
const microsoftReady = (c) => !!(c.tenant && c.clientId && c.clientSecret && c.publicUrl);
const redirectUri = (c) => `${c.publicUrl}/api/auth/callback`;

function stateCookie(req, value, maxAge) {
  const parts = [`${STATE_COOKIE}=${value}`, 'Path=/api/auth', `Max-Age=${maxAge}`, 'SameSite=Lax', 'HttpOnly'];
  if (isHttps(req)) parts.push('Secure');
  return parts.join('; ');
}

router.get('/auth/config', (req, res) => {
  const c = config();
  const installed = getDb().prepare('SELECT COUNT(*) AS n FROM users').get().n > 0;
  ok(res, { mode: c.mode, microsoft: c.mode !== 'local' && microsoftReady(c), installed }, { resource: 'auth' });
});

router.get('/auth/sso/start', (req, res) => {
  const c = config();
  if (c.mode === 'local' || !microsoftReady(c)) return res.redirect(302, '/login?erreur=SSO_NOT_CONFIGURED');
  const p = oidc.newPending();
  const db = getDb();
  db.prepare("DELETE FROM auth_pending WHERE created_at < datetime('now', ?)").run(`-${PENDING_MINUTES} minutes`);
  db.prepare('INSERT INTO auth_pending (state, nonce, verifier, next_path) VALUES (?, ?, ?, ?)')
    .run(p.state, p.nonce, p.verifier, oidc.safeNext(req.query.next));
  appendCookie(res, stateCookie(req, p.state, 600));
  res.redirect(302, oidc.authorizeUrl({ tenant: c.tenant, clientId: c.clientId, redirectUri: redirectUri(c), ...p }));
});

router.get('/auth/callback', handle(async (req, res) => {
  const fail302 = (code) => { appendCookie(res, stateCookie(req, '', 0)); return res.redirect(302, `/login?erreur=${code}`); };
  const c = config();
  if (!microsoftReady(c)) return fail302('SSO_NOT_CONFIGURED');
  const state = String(req.query.state || '');
  const db = getDb();
  const pending = db.prepare(`SELECT * FROM auth_pending WHERE state = ? AND created_at > datetime('now', ?)`).get(state, `-${PENDING_MINUTES} minutes`);
  db.prepare('DELETE FROM auth_pending WHERE state = ?').run(state);
  if (!pending || readCookies(req)[STATE_COOKIE] !== state) return fail302('SSO_STATE');
  if (req.query.error || !req.query.code) return fail302('SSO_MICROSOFT');
  let claims;
  try {
    const idToken = await oidc.exchangeCode({ tenant: c.tenant, clientId: c.clientId, clientSecret: c.clientSecret, redirectUri: redirectUri(c), code: String(req.query.code), verifier: pending.verifier });
    claims = await oidc.verifyIdToken(idToken, { tenant: c.tenant, clientId: c.clientId, nonce: pending.nonce });
  } catch (e) {
    logAudit(null, 'sso.refused', 'user', null, { reason: e.message });
    return fail302('SSO_TOKEN');
  }
  const email = String(claims.email || claims.preferred_username || '').toLowerCase();
  const domains = listSetting('auth.domains').map((d) => d.toLowerCase());
  if (domains.length && !domains.some((d) => email.endsWith(`@${d}`))) {
    logAudit(null, 'sso.refused', 'user', null, { reason: 'domain' });
    return fail302('SSO_DOMAIN');
  }
  const user = (claims.oid && db.prepare('SELECT id, is_active FROM users WHERE oid = ?').get(claims.oid))
    || db.prepare('SELECT id, is_active FROM users WHERE email = ? AND (oid IS NULL OR oid = ?)').get(email, claims.oid || '');
  if (!user || !user.is_active) {
    logAudit(user ? user.id : null, 'sso.unknown_account', 'user', user ? user.id : null, null);
    return fail302('SSO_UNKNOWN_ACCOUNT');
  }
  if (claims.oid) db.prepare('UPDATE users SET oid = ? WHERE id = ? AND oid IS NULL').run(claims.oid, user.id);
  appendCookie(res, stateCookie(req, '', 0));
  openSession(req, res, user);
  logAudit(user.id, 'login.success', 'user', user.id, { method: 'sso' });
  res.redirect(302, oidc.safeNext(pending.next_path));
}));

router.get('/settings/auth', authMiddleware, requireRole('admin'), (req, res) => {
  const c = config();
  ok(res, {
    mode: c.mode, tenant: c.tenant, client_id: c.clientId, public_url: c.publicUrl, domains: getSetting('auth.domains'),
    secret_set: isSet('auth.client_secret'), redirect_uri: c.publicUrl ? redirectUri(c) : null,
  }, { resource: 'settings' });
});

router.put('/settings/auth', authMiddleware, requireRole('admin'), validate(S.authSettings), handle((req, res) => {
  const b = req.body;
  if (b.mode === 'sso') {
    const n = getDb().prepare("SELECT COUNT(*) AS n FROM users WHERE user_role = 'admin' AND is_active = 1 AND (is_admin_local = 1 OR oid IS NOT NULL)").get().n;
    if (!n) return fail(res, req, 409, 'SSO_NO_ADMIN');
  }
  const map = { mode: 'auth.mode', tenant: 'auth.tenant', client_id: 'auth.client_id', client_secret: 'auth.client_secret', public_url: 'auth.public_url', domains: 'auth.domains' };
  for (const [k, v] of Object.entries(b)) if (v !== undefined) setSetting(map[k], v);
  logAudit(req.user.id, 'settings.auth', 'settings', null, { ...b, client_secret: b.client_secret ? '***' : undefined });
  const c = config();
  ok(res, { mode: c.mode, tenant: c.tenant, client_id: c.clientId, public_url: c.publicUrl, domains: getSetting('auth.domains'), secret_set: isSet('auth.client_secret'), redirect_uri: c.publicUrl ? redirectUri(c) : null }, { resource: 'settings' });
}));

/** Bouton « Tester » (standard 8.2) : vérifie que l'annuaire saisi répond chez Microsoft. Le secret n'est jamais lu ni renvoyé. */
router.post('/settings/auth/test', authMiddleware, requireRole('admin'), validate(S.authTest), handle(async (req, res) => {
  const tenant = (req.body.tenant || getSetting('auth.tenant')).trim();
  if (!tenant) return fail(res, req, 400, 'SSO_TENANT_REQUIRED');
  try {
    const keys = await oidc.checkTenant(tenant);
    logAudit(req.user.id, 'settings.auth.test', 'settings', null, { ok: true });
    ok(res, { reachable: true, keys }, { resource: 'settings' });
  } catch (e) {
    logAudit(req.user.id, 'settings.auth.test', 'settings', null, { ok: false });
    fail(res, req, 502, 'SSO_TEST_FAILED');
  }
}));

router.PUBLIC_ROUTES = ['GET /api/auth/config', 'GET /api/auth/sso/start', 'GET /api/auth/callback'];
module.exports = router;
