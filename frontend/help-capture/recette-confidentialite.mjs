/**
 * Recette de la confidentialité (0.5.0, CDC CR-001 à CR-005, CR-007, CR-008), à lancer depuis un poste qui atteint l'instance.
 * Variables d'environnement de la fenêtre PowerShell, jamais écrites dans le script :
 *   RECETTE_URL, RECETTE_USER, RECETTE_PASSWORD  comme recette.mjs ; le compte doit tenir le registre de l'entité AC
 *   RECETTE_HEADLESS  1 pour ne pas afficher le navigateur
 * Ce que le script écrit sur l'instance, et défait à la fin même en cas d'échec :
 *   - trois comptes de test (deux agents du service A, un agent du service B), mot de passe aléatoire jamais affiché, désactivés à la fin ;
 *   - quatre courriers fictifs (normal, restreint, confidentiel), annulés avec motif à la fin : leurs numéros restent au registre, marqués annulés.
 * Résultat : une ligne OK ou ÉCHEC par contrôle et un rapport rapport-confidentialite.txt.
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
const SECRET = 'Objet secret de recette';

try {
  admin = await identity(USER, PASSWORD);
  say(`Recette de la confidentialité ${TAG} sur ${BASE}, ${new Date().toISOString()}`);

  let ac; let svcA; let svcB; let contactId; let typeId;
  const pw = () => `${crypto.randomBytes(12).toString('base64url')}aA1!`;
  const accounts = {};
  const newMail = async (label, level, designees, extra = {}) => {
    const m = await admin.api('POST', '/api/mails', { entity_id: ac.id, channel: 'courrier', sender_contact_id: contactId, subject: `${SECRET} ${label} ${TAG}`, type_id: typeId, confidentiality: level, designee_ids: designees, ...extra });
    ok(`0. Courrier fictif ${label} enregistré (${level})`, m.status === 201, `HTTP ${m.status}`);
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
    for (const [key, service] of [['agentA', svcA], ['agentA2', svcA], ['agentB', svcB]]) {
      const email = `recette-${key.toLowerCase()}-${TAG}@exemple.test`;
      const password = pw();
      const r = await admin.api('POST', '/api/users', { email, first_name: 'Recette', last_name: key, password_mode: 'manual', password, must_change_password: false, entity_roles: [{ entity_id: ac.id, role: 'agent', service_ids: [service.id] }] });
      ok(`0. Compte de test ${key} créé (agent)`, r.status === 201, `HTTP ${r.status}`);
      if (r.status !== 201) throw new Error(`compte ${key} non créé`);
      made.users.push(r.body.data.id);
      accounts[key] = { id: r.body.data.id, email, password };
    }
  });
  if (made.users.length < 3) throw new Error('préparation incomplète');
  const A = await identity(accounts.agentA.email, accounts.agentA.password);
  const A2 = await identity(accounts.agentA2.email, accounts.agentA2.password);
  const B = await identity(accounts.agentB.email, accounts.agentB.password);
  const idsOf = (r) => (r.body.data.rows || r.body.data).map((x) => x.id);

  // ------------------------------------------------------------------ restreint
  await step('Restreint', async () => {
    const m = await newMail('restreint', 'restreint', [accounts.agentA.id]);
    const att = await admin.api('PUT', `/api/mails/${m.id}/attribution`, { service_id: svcA.id });
    ok('1. Attribution du courrier restreint au service A', att.status === 200, `HTTP ${att.status}`);
    ok('1. La personne désignée lit la fiche', (await A.api('GET', `/api/mails/${m.id}`)).status === 200);
    ok('1. Son collègue du même service, non désigné, ne la lit pas (403)', (await A2.api('GET', `/api/mails/${m.id}`)).status === 403);
    ok('1. L’agent d’un autre service ne la lit pas (403)', (await B.api('GET', `/api/mails/${m.id}`)).status === 403);
    ok('1. Ni l’historique ni les commentaires du collègue non désigné (403)', (await A2.api('GET', `/api/mails/${m.id}/history`)).status === 403 && (await A2.api('GET', `/api/mails/${m.id}/comments`)).status === 403);
    ok('1. « Mon service » du collègue ne le contient pas ; celui de la personne désignée, si', !idsOf(await A2.api('GET', '/api/mails?box=mon_service&limit=200')).includes(m.id) && idsOf(await A.api('GET', '/api/mails?box=mon_service&limit=200')).includes(m.id));
    ok('1. Le registre le voit', idsOf(await admin.api('GET', `/api/mails?entity_id=${ac.id}&limit=200`)).includes(m.id));
    // à l'écran : la personne désignée voit le cadenas, le collègue ne voit rien
    await A.page.goto(`${BASE}/bannettes`); await A.page.waitForSelector('h1'); await pause(1500);
    const rowA = A.page.locator('.ant-table-row', { hasText: m.number });
    ok('1. À l’écran, la personne désignée voit le courrier avec la pastille « Restreint »', (await rowA.count()) === 1 && (await rowA.innerText()).includes('Restreint'));
    await A2.page.goto(`${BASE}/bannettes`); await A2.page.waitForSelector('h1'); await pause(1500);
    ok('1. À l’écran, le collègue ne voit pas ce courrier', !(await A2.page.locator('body').innerText()).includes(m.number));
    const lvl = await admin.api('PUT', `/api/mails/${m.id}/confidentiality`, { level: 'normal', designee_ids: [], reason: 'Recette : levée du caractère restreint' });
    ok('1. Le registre rend le courrier normal avec un motif', lvl.status === 200, `HTTP ${lvl.status}`);
    ok('1. Le collègue le lit alors comme avant', (await A2.api('GET', `/api/mails/${m.id}`)).status === 200);
    ok('1. Un agent ne change pas le niveau (403)', (await A.api('PUT', `/api/mails/${m.id}/confidentiality`, { level: 'restreint', designee_ids: [accounts.agentA.id], reason: 'Non' })).status === 403);
  });

  // ------------------------------------------------------------------ confidentiel
  await step('Confidentiel', async () => {
    const m = await newMail('confidentiel', 'confidentiel', [accounts.agentA.id]);
    ok('2. L’objet du pli confidentiel est le texte fixe, pas l’objet écrit', m.subject === 'Pli confidentiel remis fermé' && !JSON.stringify(m).includes(SECRET));
    ok('2. Le destinataire nommé lit la fiche', (await A.api('GET', `/api/mails/${m.id}`)).status === 200);
    ok('2. Son collègue ne la lit pas (403)', (await A2.api('GET', `/api/mails/${m.id}`)).status === 403);
    const att = await admin.api('PUT', `/api/mails/${m.id}/attribution`, { service_id: svcA.id });
    ok('2. Un pli confidentiel ne s’attribue pas à un service (409)', att.status === 409, `HTTP ${att.status}`);
    const up = await admin.api('PUT', `/api/mails/${m.id}/confidentiality`, { level: 'confidentiel', designee_ids: [accounts.agentA2.id], reason: 'Recette : changer le destinataire' });
    ok('2. Le destinataire nommé se change avec un motif', up.status === 200, `HTTP ${up.status}`);
    ok('2. L’ancien destinataire ne lit plus ; le nouveau lit', (await A.api('GET', `/api/mails/${m.id}`)).status === 403 && (await A2.api('GET', `/api/mails/${m.id}`)).status === 200);
    const h = await admin.api('POST', `/api/mails/${m.id}/handover`, {});
    ok('2. La remise du pli est enregistrée (qui remet, qui reçoit, quand)', h.status === 200 && !!h.body.data.handed_at && h.body.data.handed_to === accounts.agentA2.id, `HTTP ${h.status}`);
    ok('2. Une seconde remise est refusée (409)', (await admin.api('POST', `/api/mails/${m.id}/handover`, {})).status === 409);
    // à l'écran
    await A2.page.goto(`${BASE}/bannettes`); await A2.page.waitForSelector('h1'); await pause(1500);
    // Le pli n'a pas de service : il est dans l'onglet « Moi » de son destinataire nommé, pas dans « Mon service ».
    await A2.page.getByRole('tab', { name: /^Moi/ }).click(); await pause(1200);
    const row = A2.page.locator('.ant-table-row', { hasText: m.number });
    const shown = (await row.count()) === 1 ? (await row.innerText()).replace(/\s+/g, ' ') : `ligne absente ; onglets : ${(await A2.page.locator('[role=tab]').allInnerTexts()).join(' | ')}`;
    ok('2. À l’écran, le destinataire nommé voit le pli confidentiel dans « Moi », sans objet secret', (await row.count()) === 1 && shown.includes('Confidentiel') && !shown.includes(SECRET), shown.slice(0, 160));
    const mcp = await admin.api('GET', `/api/mails/${m.id}`);
    ok('2. Le registre garde la fiche et son historique de remise', mcp.status === 200 && mcp.body.data.timeline.some((x) => x.type === 'remise'));
  });

  // ------------------------------------------------------------------ cloisonnement
  await step('Cloisonnement', async () => {
    const m = await newMail('cloisonnement', 'restreint', [accounts.agentA.id]);
    const routes = [['GET', `/api/mails/${m.id}`], ['PUT', `/api/mails/${m.id}/attribution`, { service_id: svcA.id }], ['POST', `/api/mails/${m.id}/take`, {}], ['POST', `/api/mails/${m.id}/comments`, { scope: 'entity', body: 'Non' }], ['POST', `/api/mails/${m.id}/handover`, {}], ['PUT', `/api/mails/${m.id}/confidentiality`, { level: 'normal', designee_ids: [], reason: 'Non' }]];
    let all403 = true;
    for (const who of [A2, B]) for (const [verb, url, body] of routes) { const r = await who.api(verb, url, body); if (r.status !== 403) { all403 = false; say(`      ${verb} ${url} → ${r.status}`); } }
    ok('3. Un collègue non désigné et un agent d’un autre service reçoivent 403 sur chaque route du courrier restreint', all403);
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
  fs.writeFileSync('rapport-confidentialite.txt', lines.join('\n') + '\n');
  await browser.close();
  process.exit(failed === 0 ? 0 : 1);
}
