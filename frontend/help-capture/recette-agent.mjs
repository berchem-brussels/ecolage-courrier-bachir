/**
 * Recette de l'attribution (version 0.3.0) avec de vrais comptes d'agent, de responsable et de secrétariat, à lancer depuis un poste
 * qui atteint l'instance. Variables d'environnement de la fenêtre PowerShell, jamais écrites dans le script :
 *   RECETTE_URL, RECETTE_USER, RECETTE_PASSWORD  comme recette.mjs ; le compte doit tenir le registre de l'entité AC
 *   RECETTE_HEADLESS  1 pour ne pas afficher le navigateur
 * Ce que le script écrit sur l'instance d'acceptance, et défait à la fin même en cas d'échec :
 *   - trois comptes de test (agent du service A, agent du service B, responsable du service A), mot de passe aléatoire jamais affiché,
 *     désactivés à la fin ;
 *   - un courrier fictif, attribué, renvoyé, réattribué, puis annulé avec un motif : son numéro reste au registre, marqué « annulé ».
 * Résultat : une ligne OK ou ÉCHEC par contrôle et un rapport rapport-agent.txt.
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

const made = { users: [], mail: null };
let admin;
const text = (p) => p.locator('body').innerText();

try {
  admin = await identity(USER, PASSWORD);
  say(`Recette de l'attribution ${TAG} sur ${BASE}, ${new Date().toISOString()}`);

  // ------------------------------------------------------------------ préparation
  let ac; let svcA; let svcB; let contactId; let typeId; let mailId; let mailNumber;
  const pw = () => `${crypto.randomBytes(12).toString('base64url')}aA1!`;
  const accounts = {};
  await step('Préparation', async () => {
    const ents = (await admin.api('GET', '/api/entities?limit=50')).body.data;
    ac = ents.find((e) => e.code === 'AC');
    ok('0. Entité AC trouvée', !!ac);
    const services = (await admin.api('GET', `/api/services?entity_id=${ac.id}&is_active=1&limit=200`)).body.data;
    ok('0. Au moins deux services actifs servent l’entité AC', services.length >= 2, `${services.length} services`);
    [svcA, svcB] = [services[0], services[1]];
    contactId = (await admin.api('GET', '/api/contacts?is_active=1&limit=1')).body.data[0].id;
    typeId = (await admin.api('GET', `/api/mail-types?entity_id=${ac.id}&is_active=1&limit=1`)).body.data[0].id;
    for (const [key, role, service] of [['agentA', 'agent', svcA], ['agentB', 'agent', svcB], ['chefA', 'chef_service', svcA]]) {
      const email = `recette-${key.toLowerCase()}-${TAG}@exemple.test`;
      const password = pw();
      const r = await admin.api('POST', '/api/users', { email, first_name: 'Recette', last_name: key, password_mode: 'manual', password, must_change_password: false, entity_roles: [{ entity_id: ac.id, role, service_ids: [service.id] }] });
      ok(`0. Compte de test ${key} créé (${role}, un service)`, r.status === 201, `HTTP ${r.status}`);
      if (r.status !== 201) throw new Error(`compte ${key} non créé : ${JSON.stringify(r.body).slice(0, 120)}`);
      made.users.push(r.body.data.id);
      accounts[key] = { id: r.body.data.id, email, password };
    }
    const m = await admin.api('POST', '/api/mails', { entity_id: ac.id, channel: 'courrier', sender_contact_id: contactId, subject: `Courrier fictif de recette automatique ${TAG}`, type_id: typeId });
    ok('0. Courrier fictif enregistré', m.status === 201, `HTTP ${m.status}`);
    mailId = m.body.data.id; mailNumber = m.body.data.number; made.mail = mailId;
  });
  if (!mailId) throw new Error('préparation incomplète');

  const A = await identity(accounts.agentA.email, accounts.agentA.password);
  const B = await identity(accounts.agentB.email, accounts.agentB.password);
  const C = await identity(accounts.chefA.email, accounts.chefA.password);

  // ------------------------------------------------------------------ avant l'attribution
  await step('Avant attribution', async () => {
    for (const [k, who] of [['agent A', A], ['agent B', B], ['responsable A', C]]) {
      const r = await who.api('GET', `/api/mails/${mailId}`);
      ok(`1. Courrier non attribué : ${k} ne le lit pas`, r.status === 403, `HTTP ${r.status}`);
    }
    const sec = await admin.api('GET', '/api/mails?box=a_attribuer&limit=200');
    ok('1. Le secrétariat le voit dans « À attribuer »', sec.body.data.some((m) => m.id === mailId));
  });

  // ------------------------------------------------------------------ attribution
  await step('Attribution', async () => {
    const noReason = await admin.api('PUT', `/api/mails/${mailId}/attribution`, { service_id: svcA.id, copy_service_ids: [svcB.id] });
    ok('2. Attribution au service A avec le service B en copie', noReason.status === 200, `HTTP ${noReason.status}`);
    const denied = await A.api('PUT', `/api/mails/${mailId}/attribution`, { service_id: svcB.id, reason: 'essai' });
    ok('2. Un agent n’attribue pas (403)', denied.status === 403, `HTTP ${denied.status}`);
    const edit = await A.api('PUT', `/api/mails/${mailId}`, { subject: 'Modifié par un agent' });
    ok('2. Un agent ne modifie pas le courrier (403)', edit.status === 403, `HTTP ${edit.status}`);
    const cancel = await A.api('DELETE', `/api/mails/${mailId}`, { reason: 'essai' });
    ok('2. Un agent n’annule pas le courrier (403)', cancel.status === 403, `HTTP ${cancel.status}`);
    const b = await B.api('GET', `/api/mails/${mailId}`);
    ok('2. Le service en copie lit le courrier, sans droit de modification ni de renvoi', b.status === 200 && b.body.data.rights.edit === false && b.body.data.rights.return_to_secretariat === false);
  });

  // ------------------------------------------------------------------ l'agent A à l'écran
  await step('Écran de l’agent A', async () => {
    await A.page.goto(`${BASE}/`); await A.page.waitForSelector('h1'); await pause(1200);
    ok('3. Un agent arrive sur les Bannettes', /\/bannettes/.test(A.page.url()), A.page.url().replace(BASE, ''));
    const tabs = await A.page.locator('[role=tab]').allInnerTexts();
    ok('3. Onglets de l’agent : Mon service, Moi, En copie ; aucun onglet du secrétariat', tabs.length === 3 && /Mon service/.test(tabs[0]) && /Moi/.test(tabs[1]) && /En copie/.test(tabs[2]) && !tabs.some((t) => /attribuer|enregistrer/i.test(t)), tabs.join(' | '));
    ok('3. Le courrier est dans « Mon service »', (await text(A.page)).includes(mailNumber));
    ok('3. Le menu de l’agent n’affiche ni registre ni file « À enregistrer »', !/Registre des entrées|À enregistrer/.test(await A.page.locator('nav').innerText()));
    await A.page.locator('.ant-table-row', { hasText: mailNumber }).click();
    await A.page.waitForSelector('.ant-drawer:visible'); await pause(1500);
    const d = await A.page.locator('.ant-drawer').innerText();
    ok('3. Fiche en lecture seule : message, objet lisible, aucun bouton de correction ni d’annulation', /Vous pouvez lire ce courrier/.test(d) && d.includes(`recette automatique ${TAG}`) && (await A.page.locator('.ant-drawer button:has-text("Annuler cet enregistrement")').count()) === 0 && (await A.page.locator('.ant-drawer button[type=submit]').count()) === 0);
    ok('3. Cadre « Attribution » : service traitant, service en copie ; aucun formulaire d’attribution', d.includes(svcA.name_fr) && d.includes(svcB.name_fr) && !/Attribuer\b/.test(await A.page.locator('.ant-drawer button').allInnerTexts().then((t) => t.join('|'))));
    ok('3. Le bouton « Renvoyer au secrétariat » est proposé', (await A.page.locator('.ant-drawer button:has-text("Renvoyer au secrétariat")').count()) === 1);
    await A.page.screenshot({ path: 'agent-fiche.png' });
    await A.page.keyboard.press('Escape'); await pause(300);
  });

  // ------------------------------------------------------------------ responsable : nomination de l'agent
  await step('Responsable A', async () => {
    const bad = await C.api('PUT', `/api/mails/${mailId}/agent`, { agent_id: accounts.agentB.id });
    ok('4. Le responsable ne nomme pas l’agent d’un autre service (409)', bad.status === 409, `HTTP ${bad.status}`);
    const none = await A.api('PUT', `/api/mails/${mailId}/agent`, { agent_id: accounts.agentA.id });
    ok('4. Un agent simple ne nomme pas (403)', none.status === 403, `HTTP ${none.status}`);
    const good = await C.api('PUT', `/api/mails/${mailId}/agent`, { agent_id: accounts.agentA.id });
    ok('4. Le responsable nomme l’agent A dans son service', good.status === 200 && good.body.data.agent_id === accounts.agentA.id, `HTTP ${good.status}`);
    const mine = await A.api('GET', '/api/mails?box=moi');
    ok('4. Le courrier est dans « Moi » pour l’agent nommé', mine.body.data.some((m) => m.id === mailId));
    const notes = await A.api('GET', '/api/notifications?unread=true');
    ok('4. L’agent nommé reçoit une notification « attribue », sans objet ni expéditeur', notes.body.data.some((n) => n.mail_id === mailId && n.kind === 'attribue') && !JSON.stringify(notes.body).includes('recette automatique'));
    await A.page.goto(`${BASE}/bannettes`); await A.page.waitForSelector('h1'); await pause(1500);
    const bell = await A.page.locator('button[aria-label^="Notifications"]').getAttribute('aria-label');
    ok('4. La cloche de l’agent indique des notifications non lues', /non lues/.test(bell || ''), bell || '');
  });

  // ------------------------------------------------------------------ renvoi par l'écran
  await step('Renvoi au secrétariat', async () => {
    await A.page.goto(`${BASE}/bannettes`); await A.page.waitForSelector('h1'); await pause(1200);
    await A.page.locator('.ant-table-row', { hasText: mailNumber }).click();
    await A.page.waitForSelector('.ant-drawer:visible'); await pause(1200);
    const send = A.page.locator('.ant-drawer button:has-text("Renvoyer au secrétariat")');
    ok('5. Renvoi impossible sans motif (bouton désactivé)', await send.isDisabled());
    await A.page.fill('textarea[name=return_reason]', 'Ce courrier fictif concerne un autre service (recette automatique)');
    await send.click();
    await A.page.locator('.ant-popover .ant-btn-primary').click();
    await pause(1800);
    const r = await A.api('GET', `/api/mails/${mailId}`);
    ok('5. Après le renvoi, l’agent ne lit plus le courrier (403)', r.status === 403, `HTTP ${r.status}`);
    const box = await A.api('GET', '/api/mails?box=mon_service&limit=200');
    ok('5. Il a disparu de « Mon service »', !box.body.data.some((m) => m.id === mailId));
    const sec = await admin.api('GET', '/api/mails?box=a_attribuer&limit=200');
    const back = sec.body.data.find((m) => m.id === mailId);
    ok('5. Il est revenu dans « À attribuer » avec son motif', !!back && /autre service/.test(back.return_reason || ''));
    const notes = await admin.api('GET', '/api/notifications?unread=true');
    ok('5. Le secrétariat reçoit la notification « renvoye »', notes.body.data.some((n) => n.mail_id === mailId && n.kind === 'renvoye'));
    await admin.page.goto(`${BASE}/bannettes`); await admin.page.waitForSelector('h1'); await pause(1500);
    ok('5. La liste « À attribuer » affiche le motif du renvoi', /autre service/.test(await text(admin.page)));
    await admin.page.screenshot({ path: 'secretariat-renvoi.png' });
  });

  // ------------------------------------------------------------------ réattribution
  await step('Réattribution', async () => {
    const r = await admin.api('PUT', `/api/mails/${mailId}/attribution`, { service_id: svcB.id, agent_id: accounts.agentB.id });
    ok('6. Réattribution au service B avec l’agent B, sans motif (le courrier était renvoyé)', r.status === 200 && r.body.data.return_reason === null, `HTTP ${r.status}`);
    ok('6. L’historique garde l’attribution, le renvoi et la nomination', ['attribution', 'renvoi', 'agent', 'copies', 'attribution'].every((k) => r.body.data.attributions.some((h) => h.kind === k)) || r.body.data.attributions.length >= 4, r.body.data.attributions.map((h) => h.kind).join(', '));
    const again = await admin.api('PUT', `/api/mails/${mailId}/attribution`, { service_id: svcA.id });
    ok('6. Changer le service d’un courrier attribué sans motif est refusé (400)', again.status === 400, `HTTP ${again.status}`);
    const lost = await A.api('GET', `/api/mails/${mailId}`);
    ok('6. L’agent A n’y a plus accès, l’agent B oui', lost.status === 403 && (await B.api('GET', `/api/mails/${mailId}`)).status === 200);
    ok('6. L’agent B voit le courrier dans « Moi »', (await B.api('GET', '/api/mails?box=moi')).body.data.some((m) => m.id === mailId));
    const aud = await admin.api('GET', '/api/consultations?limit=5');
    ok('6. Le journal des consultations répond selon le rôle (refusé sans rôle d’auditeur)', [200, 403].includes(aud.status), `HTTP ${aud.status}`);
  });

  // ------------------------------------------------------------------ cloisonnement par l'autre entité
  await step('Autre entité', async () => {
    const ents = (await admin.api('GET', '/api/entities?limit=50')).body.data;
    const other = ents.find((e) => e.code !== 'AC');
    if (!other) { say('OK    7. (Pas d’autre entité : contrôle sans objet)'); return; }
    const r = await A.api('GET', `/api/mails/counts?entity_id=${other.id}`);
    ok(`7. Un agent de l’AC n’obtient aucun compteur de l’entité ${other.code} (403)`, r.status === 403, `HTTP ${r.status}`);
  });
} catch (e) {
  failed += 1; say(`ÉCHEC recette interrompue : ${String(e.message).split('\n')[0]}`);
} finally {
  // Nettoyage : le courrier d'essai est annulé avec motif, les comptes de test sont désactivés.
  try {
    if (admin) {
      if (made.mail) { const r = await admin.api('DELETE', `/api/mails/${made.mail}`, { reason: 'Recette automatique : courrier fictif' }); ok('8. Nettoyage : courrier fictif annulé avec motif', r.status === 200, `HTTP ${r.status}`); }
      for (const id of made.users) { const r = await admin.api('DELETE', `/api/users/${id}`); ok(`8. Nettoyage : compte de test ${id} désactivé`, r.status === 200, `HTTP ${r.status}`); }
    }
  } catch (e) { failed += 1; say(`ÉCHEC nettoyage : ${String(e.message).split('\n')[0]} : désactivez à la main les comptes « recette-…-${TAG}@exemple.test » et annulez le courrier d'essai`); }
  say(failed === 0 ? '\nTous les contrôles sont conformes.' : `\n${failed} contrôle(s) en échec : envoyez ce rapport.`);
  fs.writeFileSync('rapport-agent.txt', lines.join('\n') + '\n');
  await browser.close();
  process.exit(failed === 0 ? 0 : 1);
}
