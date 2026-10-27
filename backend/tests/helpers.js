/**
 * Banc d'essai : base de test dans un dossier temporaire, jamais sur le chemin de production (standard v3.2, section 14.2).
 * Démarre l'application réelle sur un port libre et fournit un client qui garde le cookie de session.
 */
const os = require('os');
const path = require('path');
const fs = require('fs');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gabarit-test-'));
process.env.DB_PATH = path.join(dir, 'test.db');
process.env.NODE_ENV = 'test';
process.env.APP_TEST_MODE = '1';

const { initDb } = require('../src/database');
const { buildApp } = require('../src/app');

async function startServer() {
  // Garde-fou : si un module a chargé la configuration avant ce fichier, la base de test pointerait sur la vraie base.
  const { DB_PATH } = require('../src/config');
  if (DB_PATH !== process.env.DB_PATH || !DB_PATH.startsWith(os.tmpdir())) {
    throw new Error(`Base de test hors du dossier temporaire (${DB_PATH}) : require('./helpers') doit précéder tout require de src/`);
  }
  await initDb();
  const app = buildApp();
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  return { app, server, base, stop: () => new Promise((r) => server.close(r)) };
}

function client(base) {
  let cookie = null;
  let csrfToken = null;
  const call = async (method, url, body, { csrf = true, bearer = null, headers = {} } = {}) => {
    const h = { ...headers };
    if (body !== undefined) h['Content-Type'] = 'application/json';
    if (cookie) h.Cookie = cookie;
    if (bearer) h.Authorization = `Bearer ${bearer}`;
    if (csrf && csrfToken && method !== 'GET') h['X-CSRF-Token'] = csrfToken;
    const res = await fetch(base + url, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0].endsWith('=') ? null : set.split(';')[0];
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) { json = text; }
    if (json && json.data && json.data.csrf_token) csrfToken = json.data.csrf_token;
    return { status: res.status, body: json, headers: res.headers };
  };
  return {
    get: (u, o) => call('GET', u, undefined, o),
    post: (u, b, o) => call('POST', u, b, o),
    put: (u, b, o) => call('PUT', u, b, o),
    del: (u, b, o) => call('DELETE', u, b, o),
    mcp: (method, params, o) => call('POST', '/api/mcp', { jsonrpc: '2.0', id: 1, method, params }, o),
    get cookie() { return cookie; },
    get csrf() { return csrfToken; },
  };
}

module.exports = { startServer, client };
