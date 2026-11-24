/**
 * Recette de la prise en charge sans agent nommé (0.4.1, écart E55 levé), à lancer depuis un poste qui atteint l'instance.
 * Variables d'environnement de la fenêtre PowerShell, jamais écrites dans le script :
 *   RECETTE_URL, RECETTE_USER, RECETTE_PASSWORD  comme recette.mjs ; le compte doit tenir le registre de l'entité AC
 *   RECETTE_HEADLESS  1 pour ne pas afficher le navigateur
 * Ce que le script écrit sur l'instance, et défait à la fin même en cas d'échec :
 *   - quatre comptes de test (deux agents du service A, un responsable du service A, un agent du service B), mot de passe aléatoire
 *     jamais affiché, désactivés à la fin ;
 *   - trois courriers fictifs, annulés avec motif à la fin : leurs numéros restent au registre, marqués annulés.
 * Résultat : une ligne OK ou ÉCHEC par contrôle et un rapport rapport-e55.txt.
 */
import { chromium } from 'playwright';
import crypto from 'crypto';
import fs from 'fs';

const BASE = (process.env.RECETTE_URL || '').replace(/\/$/, '');
const USER = process.env.RECETTE_USER;
const PASSWORD = process.env.RECETTE_PASSWORD;
if (!BASE || !USER || !PASSWORD) { console.error('Définissez RECETTE_URL, RECETTE_USER et RECETTE_PASSWORD dans cette fenêtre PowerShell.'); process.exit(2); }

const TAG = Date.now().toString(36);
const lines = [];
let failed = 0;
const say = (s) => { console.log(s); lines.push(s); };
const ok = (name, cond, detail = '') => { if (!cond) failed += 1; say(`${cond ? 'OK   ' : 'ÉCHEC'} ${name}${detail ? ' : ' + detail : ''}`); };
const step = async (name, fn) => { try { await fn(); } catch (e) { failed += 1; say(`ÉCHEC ${name} : ${String(e.message).split('\n')[0]}`); } };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

let browser;
const headless = process.env.RECETTE_HEADLESS === '1';
try { browser = await chromium.launch({ channel: 'chrome', headless }); } catch { browser = await chromium.launch({ headless }); }

/** Une identité = un contexte de navigateur (cookies propres) et une page. */
async function identity(email, password) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 }, locale: 'fr-BE' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  const login = await page.evaluate(async ({ email, password }) => {
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    return r.status;
  }, { email, password });
  if (login !== 200) throw new Error(`connexion refusée (${login}) pour ${email.replace(/@.*/, '@…')}`);
  const api = (method, url, body) => page.evaluate(async ({ method, url, body }) => {
    const me = await (await fetch('/api/auth/me')).json();
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.data.csrf_token }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json().catch(() => null) };
  }, { method, url, body });
  return { ctx, page, api };
}

const made = { users: [], mails: [] };
let admin;

try {
  admin = await identity(USER, PASSWORD);
  say(`Recette de la prise en charge sans agent nommé ${TAG} sur ${BASE}, ${new Date().toISOString()}`);

  let ac; let svcA; let svcB; let contactId; let typeId; let reasonId;
  const pw = () => `${crypto.randomBytes(12).toString('base64url')}aA1!`;
  const accounts = {};
  const newMail = async (label) => {
    const m = await admin.api('POST', '/api/mails', { entity_id: ac.id, channel: 'courrier', sender_contact_id: contactId, subject: `Courrier fictif de recette automatique ${label} ${TAG}`, type_id: typeId });
    ok(`0. Courrier fictif ${label} enregistré`, m.status === 201, `HTTP ${m.status}`);
    if (m.status !== 201) throw new Error('courrier non enregistré');
    made.mails.push(m.body.data.id);
    return m.body.data;
  };
  await step('Préparation', async () => {
    const ents = (await admin.api('GET', '/api/entities?limit=50')).body.data;
    ac = ents.find((e) => e.code === 'AC');
    ok('0. Entité AC trouvée', !!ac);
    const services = (await admin.api('GET', `/api/services?entity_id=${ac.id}&is_active=1&limit=200`)).body.data;
    ok('0. Au moins deux services actifs servent l’entité AC', services.length >= 2, `${services.length} services`);
    [svcA, svcB] = [services[0], services[1]];
    contactId = (await admin.api('GET', '/api/contacts?is_active=1&limit=1')).body.data[0].id;
    typeId = (await admin.api('GET', `/api/mail-types?entity_id=${ac.id}&is_active=1&limit=1`)).body.data[0].id;
    reasonId = (await admin.api('GET', `/api/close-reasons?entity_id=${ac.id}&limit=50`)).body.data.find((r) => r.is_active !== 0 && r.entity_id === ac.id).id;
    for (const [key, role, service] of [['agentA', 'agent', svcA], ['agentA2', 'agent', svcA], ['chefA', 'chef_service', svcA], ['agentB', 'agent', svcB]]) {
      const email = `recette-${key.toLowerCase()}-${TAG}@exemple.test`;
      const password = pw();
      const r = await admin.api('POST', '/api/users', { email, first_name: 'Recette', last_name: key, password_mode: 'manual', password, must_change_password: false, entity_roles: [{ entity_id: ac.id, role, service_ids: [service.id] }] });
      ok(`0. Compte de test ${key} créé (${role})`, r.status === 201, `HTTP ${r.status}`);
      if (r.status !== 201) throw new Error(`compte ${key} non créé`);
      made.users.push(r.body.data.id);
      accounts[key] = { id: r.body.data.id, email, password };
    }
  });
  if (made.users.length < 4) throw new Error('préparation incomplète');

  const A = await identity(accounts.agentA.email, accounts.agentA.password);
  const A2 = await identity(accounts.agentA2.email, accounts.agentA2.password);
  const C = await identity(accounts.chefA.email, accounts.chefA.password);
  const B = await identity(accounts.agentB.email, accounts.agentB.password);

  // ------------------------------------------------------------------ cas 1 : service sans agent nommé
  await step('Sans agent nommé', async () => {
    const m = await newMail('sans agent');
    const att = await admin.api('PUT', `/api/mails/${m.id}/attribution`, { service_id: svcA.id });
    ok('1. Attribution au service A, aucun agent nommé', att.status === 200, `HTTP ${att.status}`);
    const rt = async (who) => (await who.api('GET', `/api/mails/${m.id}`)).body?.data?.rights?.take;
    ok('1. Le droit « prendre en charge » est annoncé à l’agent A et à son collègue A2', (await rt(A)) === true && (await rt(A2)) === true);
    ok('1. L’agent B (autre service) ne lit pas le courrier (403)', (await B.api('GET', `/api/mails/${m.id}`)).status === 403);
    ok('1. L’agent B (autre service) ne prend pas en charge (403)', (await B.api('POST', `/api/mails/${m.id}/take`, {})).status === 403);
    ok('1. Le secrétariat ne prend pas en charge à la place du service (403)', (await admin.api('POST', `/api/mails/${m.id}/take`, {})).status === 403);
    ok('1. Clôture avant la prise en charge refusée (403 : l’agent n’est pas encore nommé)', (await A.api('POST', `/api/mails/${m.id}/close`, { close_reason_id: reasonId })).status === 403);
    // à l'écran, comme un agent
    await A.page.goto(`${BASE}/`); await A.page.waitForSelector('h1'); await pause(1200);
    await A.page.locator('.ant-table-row', { hasText: m.number }).click();
    await A.page.waitForSelector('.ant-drawer:visible'); await pause(1500);
    ok('1. À l’écran, l’agent A voit le bouton « Prendre en charge »', (await A.page.locator('.ant-drawer button:has-text("Prendre en charge")').count()) === 1);
    await A.page.locator('.ant-drawer button:has-text("Prendre en charge")').click(); await pause(1500);
    const after = await A.api('GET', `/api/mails/${m.id}`);
    ok('1. Après le clic : « en traitement », agent A nommé et preneur', after.body.data.status === 'en_traitement' && after.body.data.agent_id === accounts.agentA.id && after.body.data.taken_by === accounts.agentA.id);
    ok('1. Le bouton de prise en charge a disparu de la fiche', (await A.page.locator('.ant-drawer button:has-text("Prendre en charge")').count()) === 0);
    await A.page.keyboard.press('Escape'); await pause(300);
    const moi = await A.api('GET', '/api/mails?box=moi&limit=200');
    ok('1. Le courrier est maintenant dans « Moi » de l’agent A', moi.body.data.some((x) => x.id === m.id));
    ok('1. Le collègue A2 ne peut ni reprendre (403) ni clore (403)', (await A2.api('POST', `/api/mails/${m.id}/take`, {})).status === 403 && (await A2.api('POST', `/api/mails/${m.id}/close`, { close_reason_id: reasonId })).status === 403);
    ok('1. L’agent A clôt avec un motif de la liste : HTTP 200', (await A.api('POST', `/api/mails/${m.id}/close`, { close_reason_id: reasonId })).status === 200);
  });

  // ------------------------------------------------------------------ cas 2 : agent nommé, lui seul
  await step('Avec agent nommé', async () => {
    const m = await newMail('avec agent');
    await admin.api('PUT', `/api/mails/${m.id}/attribution`, { service_id: svcA.id });
    const named = await admin.api('PUT', `/api/mails/${m.id}/agent`, { agent_id: accounts.agentA.id });
    ok('2. Attribution au service A avec l’agent A nommé', named.status === 200, `HTTP ${named.status}`);
    const a2 = await A2.api('GET', `/api/mails/${m.id}`);
    ok('2. Le collègue A2 lit le courrier mais n’a pas le droit de le prendre en charge', a2.status === 200 && a2.body.data.rights.take === false);
    ok('2. Le collègue A2 reçoit 403 en essayant de le prendre en charge', (await A2.api('POST', `/api/mails/${m.id}/take`, {})).status === 403);
    ok('2. Le responsable A, non nommé, reçoit 403 aussi', (await C.api('POST', `/api/mails/${m.id}/take`, {})).status === 403);
    ok('2. L’agent nommé A prend en charge : HTTP 200', (await A.api('POST', `/api/mails/${m.id}/take`, {})).status === 200);
  });

  // ------------------------------------------------------------------ cas 3 : le responsable
  await step('Responsable', async () => {
    const m = await newMail('responsable');
    await admin.api('PUT', `/api/mails/${m.id}/attribution`, { service_id: svcA.id });
    const t = await C.api('POST', `/api/mails/${m.id}/take`, {});
    ok('3. Sans agent nommé, le responsable du service prend en charge', t.status === 200, `HTTP ${t.status}`);
    ok('3. Il devient l’agent nommé', t.body?.data?.agent_id === accounts.chefA.id);
    ok('3. Il clôt avec un motif de la liste : HTTP 200', (await C.api('POST', `/api/mails/${m.id}/close`, { close_reason_id: reasonId })).status === 200);
  });
} finally {
  // Nettoyage : les courriers d'essai sont annulés avec motif, les comptes de test sont désactivés.
  try {
    if (admin) {
      for (const id of made.mails) { const r = await admin.api('DELETE', `/api/mails/${id}`, { reason: 'Recette automatique : courrier fictif' }); ok(`4. Nettoyage : courrier fictif ${id} annulé avec motif`, r.status === 200, `HTTP ${r.status}`); }
      for (const id of made.users) { const r = await admin.api('DELETE', `/api/users/${id}`); ok(`4. Nettoyage : compte de test ${id} désactivé`, r.status === 200, `HTTP ${r.status}`); }
    }
  } catch (e) { failed += 1; say(`ÉCHEC nettoyage : ${String(e.message).split('\n')[0]} : désactivez à la main les comptes « recette-…-${TAG}@exemple.test » et annulez les courriers d'essai`); }
  say(failed === 0 ? '\nTous les contrôles sont conformes.' : `\n${failed} contrôle(s) en échec : envoyez ce rapport.`);
  fs.writeFileSync('rapport-e55.txt', lines.join('\n') + '\n');
  await browser.close();
  process.exit(failed === 0 ? 0 : 1);
}
