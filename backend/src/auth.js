/**
 * Session et contrôle d'accès (standard v3.2, section 8.3, modèle SAGA 0.91.0).
 * - Session : jeton opaque de 32 octets aléatoires ; la base n'en garde que l'empreinte HMAC-SHA256 (clé JWT_SECRET).
 * - Cookie HttpOnly, SameSite=Strict, Secure en HTTPS, 8 heures.
 * - Jeton anti-CSRF propre à chaque session, rendu à la connexion et par /api/auth/me,
 *   exigé dans l'en-tête X-CSRF-Token de toute écriture par cookie, sinon 403 CSRF.
 * - Le même jeton de session est accepté en Authorization: Bearer pour les clients machine et le MCP (pas de CSRF).
 * - Déconnexion et désactivation suppriment la ligne de session : le jeton ne vaut plus rien.
 */
const crypto = require('crypto');
const { JWT_SECRET, SESSION_HOURS } = require('./config');
const { getDb } = require('./database');
const { fail } = require('./envelope');

const COOKIE = 'app_session';
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const fingerprint = (token) => crypto.createHmac('sha256', JWT_SECRET).update(String(token)).digest('hex');

function readCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

const isHttps = (req) => req.secure || req.headers['x-forwarded-proto'] === 'https';

function cookie(req, value, maxAge) {
  const parts = [`${COOKIE}=${value}`, 'Path=/', `Max-Age=${maxAge}`, 'SameSite=Strict', 'HttpOnly'];
  if (isHttps(req)) parts.push('Secure');
  return parts.join('; ');
}

/** Ouvre une session : ligne en base (empreintes seules), cookie posé. Renvoie le jeton et le jeton anti-CSRF. */
function openSession(req, res, user) {
  const token = crypto.randomBytes(32).toString('base64url');
  const csrf = crypto.randomBytes(24).toString('base64url');
  getDb().prepare(`INSERT INTO sessions (id, user_id, csrf_token, expires_at) VALUES (?, ?, ?, datetime('now', ?))`)
    .run(fingerprint(token), user.id, csrf, `+${SESSION_HOURS} hours`);
  res.setHeader('Set-Cookie', cookie(req, token, SESSION_HOURS * 3600));
  return { token, csrf };
}

function closeSession(req, res) {
  if (req.user && req.user.sid) getDb().prepare('DELETE FROM sessions WHERE id = ?').run(req.user.sid);
  res.setHeader('Set-Cookie', cookie(req, '', 0));
}

function csrfOf(sid) {
  const row = getDb().prepare('SELECT csrf_token FROM sessions WHERE id = ?').get(sid);
  return row ? row.csrf_token : null;
}

function sameSecret(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

function authMiddleware(req, res, next) {
  const hdr = req.headers.authorization || '';
  let token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  let byCookie = false;
  if (!token) {
    token = readCookies(req)[COOKIE] || null;
    byCookie = !!token;
  }
  if (!token) return fail(res, req, 401, 'NO_TOKEN');
  const sid = fingerprint(token);
  const row = getDb().prepare(`SELECT u.id, u.email, u.user_role, u.preferred_lang, s.csrf_token
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > datetime('now') AND u.is_active = 1`).get(sid);
  if (!row) return fail(res, req, 401, 'BAD_TOKEN');
  if (byCookie && WRITE_METHODS.has(req.method) && !sameSecret(req.headers['x-csrf-token'], row.csrf_token)) {
    return fail(res, req, 403, 'CSRF');
  }
  const roles = getDb().prepare('SELECT entity_id, role FROM user_roles WHERE user_id = ?').all(row.id);
  req.user = { id: row.id, email: row.email, role: row.user_role, lang: row.preferred_lang, sid, roles };
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return fail(res, req, 403, 'FORBIDDEN');
    next();
  };
}

module.exports = { COOKIE, readCookies, openSession, closeSession, csrfOf, authMiddleware, requireRole, fingerprint };
