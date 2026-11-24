/**
 * Parcours complet du traitement avec de vrais comptes (secrétariat et agent), à lancer depuis un poste qui atteint l'instance.
 * Variables de la fenêtre PowerShell, jamais écrites dans le script (mots de passe masqués à la saisie) :
 *   RECETTE_URL
 *   RECETTE_SEC_USER, RECETTE_SEC_PASSWORD      compte du secrétariat de l'AC (par exemple le compte d'essai du secrétariat)
 *   RECETTE_AGENT_USER, RECETTE_AGENT_PASSWORD  compte d'un agent rattaché à un service de l'AC
 *   RECETTE_HEADLESS  1 pour ne pas afficher le navigateur
 * Le script enregistre un courrier fictif, l'attribue au service de l'agent sans nommer d'agent, fait prendre en charge, commenter,
 * clore et rouvrir, puis annule le courrier fictif (son numéro reste au registre, marqué annulé). Il n'écrit rien d'autre.
 * Résultat : OK ou ÉCHEC par contrôle, une capture par étape dans le dossier parcours-<date>, et un rapport rapport-parcours.txt.
 */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = (process.env.RECETTE_URL || '').replace(/\/$/, '');
const SEC = { user: process.env.RECETTE_SEC_USER, password: process.env.RECETTE_SEC_PASSWORD };
const AGT = { user: process.env.RECETTE_AGENT_USER, password: process.env.RECETTE_AGENT_PASSWORD };
if (!BASE || !SEC.user || !SEC.password || !AGT.user || !AGT.password) { console.error('Définissez RECETTE_URL, RECETTE_SEC_USER, RECETTE_SEC_PASSWORD, RECETTE_AGENT_USER et RECETTE_AGENT_PASSWORD dans cette fenêtre PowerShell.'); process.exit(2); }

const TAG = Date.now().toString(36);
const DIR = `parcours-${new Date().toISOString().slice(0, 10)}-${TAG}`;
fs.mkdirSync(DIR, { recursive: true });
const lines = [];
let failed = 0;
const say = (s) => { console.log(s); lines.push(s); };
const ok = (name, cond, detail = '') => { if (!cond) failed += 1; say(`${cond ? 'OK   ' : 'ÉCHEC'} ${name}${detail ? ' : ' + detail : ''}`); };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

let browser;
const headless = process.env.RECETTE_HEADLESS === '1';
try { browser = await chromium.launch({ channel: 'chrome', headless }); } catch { browser = await chromium.launch({ headless }); }

/** Connexion par l'écran, comme une personne ; renvoie la page et un client d'API qui passe par cette session. */
async function signIn(account) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 }, locale: 'fr-BE' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login?local=1`);
  await page.fill('#email', account.user);
  await page.fill('#password', account.password);
  await page.click('button[type=submit]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 });
  await pause(1200);
  const api = (method, url, body) => page.evaluate(async ({ method, url, body }) => {
    const me = await (await fetch('/api/auth/me')).json();
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.data.csrf_token }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json().catch(() => null) };
  }, { method, url, body });
  return { ctx, page, api };
}
const shot = async (who, name) => { await pause(600); await who.page.screenshot({ path: `${DIR}/${name}.png` }); };

let sec; let agt; let mail = null;
try {
  sec = await signIn(SEC);
  agt = await signIn(AGT);
  say(`Parcours du traitement ${TAG} sur ${BASE}, ${new Date().toISOString()} (captures dans ${DIR})`);
  const meSec = (await sec.api('GET', '/api/auth/me')).body.data;
  const meAgt = (await agt.api('GET', '/api/auth/me')).body.data;
  ok('0. Le compte du secrétariat est connecté', !!meSec, `${meSec.first_name} ${meSec.last_name}`);
  ok('0. Le compte de l’agent est connecté', !!meAgt, `${meAgt.first_name} ${meAgt.last_name}`);
  const ac = (await sec.api('GET', '/api/entities?limit=50')).body.data.find((e) => e.code === 'AC');
  const agentRoles = (meAgt.entity_roles || meAgt.roles || []);
  const services = (await sec.api('GET', `/api/services?entity_id=${ac.id}&is_active=1&limit=200`)).body.data;
  const mineIds = (await agt.api('GET', '/api/auth/me')).body.data.service_ids || null;
  // Le service de l'agent : celui dont il voit la bannette « Mon service » ; à défaut, le premier de ses rattachements.
  let svc = null;
  if (mineIds && mineIds.length) svc = services.find((s) => mineIds.includes(s.id));
  if (!svc) {
    const probe = await sec.api('POST', '/api/mails', { entity_id: ac.id, channel: 'courrier', sender_contact_id: (await sec.api('GET', '/api/contacts?is_active=1&limit=1')).body.data[0].id, subject: `Courrier fictif de recette (sonde) ${TAG}`, type_id: (await sec.api('GET', `/api/mail-types?entity_id=${ac.id}&is_active=1&limit=1`)).body.data[0].id });
    mail = probe.body.data;
    for (const s of services) {
      await sec.api('PUT', `/api/mails/${mail.id}/attribution`, { service_id: s.id, ...(mail.service_id ? { reason: 'sonde de recette' } : {}) });
      const r = await agt.api('GET', `/api/mails/${mail.id}`);
      mail.service_id = s.id;
      if (r.status === 200) { svc = s; break; }
    }
    if (!svc) throw new Error('aucun service de l’entité AC ne donne accès au compte de l’agent : rattachez-le à un service (Modifier les rôles)');
    ok('1. Le secrétariat enregistre un courrier fictif et l’attribue au service de l’agent, sans nommer d’agent', probe.status === 201, `HTTP ${probe.status}`);
  }
  ok('0. Service de l’agent trouvé', !!svc, svc.name_fr);

  // 1. Le secrétariat enregistre et attribue
  if (!mail) {
    const m = await sec.api('POST', '/api/mails', { entity_id: ac.id, channel: 'courrier', sender_contact_id: (await sec.api('GET', '/api/contacts?is_active=1&limit=1')).body.data[0].id, subject: `Courrier fictif de recette du parcours ${TAG}`, type_id: (await sec.api('GET', `/api/mail-types?entity_id=${ac.id}&is_active=1&limit=1`)).body.data[0].id });
    ok('1. Le secrétariat enregistre un courrier fictif', m.status === 201, `HTTP ${m.status}`);
    mail = m.body.data;
    const att = await sec.api('PUT', `/api/mails/${mail.id}/attribution`, { service_id: svc.id });
    ok('1. Il l’attribue au service de l’agent, sans nommer d’agent', att.status === 200, `HTTP ${att.status}`);
  }
  await sec.page.goto(`${BASE}/registre`); await sec.page.waitForSelector('h1'); await pause(1000);
  await sec.page.locator('.ant-table-row', { hasText: mail.number }).first().click();
  await sec.page.waitForSelector('.ant-drawer:visible'); await pause(1500);
  await shot(sec, '1-secretariat-fiche-attribuee');
  await sec.page.keyboard.press('Escape'); await pause(300);

  // 2. L'agent le trouve et le prend en charge à l'écran
  await agt.page.goto(`${BASE}/bannettes`); await agt.page.waitForSelector('h1'); await pause(1500);
  ok('2. L’agent voit le courrier dans sa bannette', (await agt.page.locator('body').innerText()).includes(mail.number));
  await shot(agt, '2-agent-bannette-mon-service');
  await agt.page.locator('.ant-table-row', { hasText: mail.number }).first().click();
  await agt.page.waitForSelector('.ant-drawer:visible'); await pause(1500);
  const btn = agt.page.locator('.ant-drawer button:has-text("Prendre en charge")');
  ok('2. À l’écran, l’agent voit le bouton « Prendre en charge »', (await btn.count()) === 1);
  await shot(agt, '3-agent-fiche-avant-prise-en-charge');
  await btn.click(); await pause(1800);
  const after = await agt.api('GET', `/api/mails/${mail.id}`);
  ok('2. Après le clic : « en traitement » et agent nommé', after.body.data.status === 'en_traitement' && after.body.data.agent_id === meAgt.id);
  ok('2. Le bouton de prise en charge a disparu', (await agt.page.locator('.ant-drawer button:has-text("Prendre en charge")').count()) === 0);
  await shot(agt, '4-agent-fiche-apres-prise-en-charge');

  // 3. Commentaires, clôture
  const c1 = await agt.api('POST', `/api/mails/${mail.id}/comments`, { scope: 'service', body: 'Commentaire de recette pour le service.' });
  const c2 = await agt.api('POST', `/api/mails/${mail.id}/comments`, { scope: 'entity', body: 'Commentaire de recette pour toute l’entité.' });
  ok('3. Deux commentaires (service, entité)', c1.status === 201 && c2.status === 201, `HTTP ${c1.status} et ${c2.status}`);
  await agt.page.keyboard.press('Escape'); await pause(300);
  await agt.page.goto(`${BASE}/bannettes`); await agt.page.waitForSelector('h1'); await pause(1000);
  await agt.page.locator('.ant-table-row', { hasText: mail.number }).first().click().catch(() => {});
  await pause(1500);
  await shot(agt, '5-agent-fiche-commentaires');
  await agt.page.keyboard.press('Escape'); await pause(300);
  const reasons = (await agt.api('GET', `/api/close-reasons?entity_id=${ac.id}&limit=50`)).body.data.filter((r) => r.is_active !== 0);
  const cl = await agt.api('POST', `/api/mails/${mail.id}/close`, { close_reason_id: reasons[0].id, note: 'Clôture de recette' });
  ok('3. L’agent clôt avec un motif de la liste', cl.status === 200, `HTTP ${cl.status}`);

  // 4. Le secrétariat voit l'historique et rouvre
  await sec.page.goto(`${BASE}/registre`); await sec.page.waitForSelector('h1'); await pause(1000);
  await sec.page.locator('.ant-table-row', { hasText: mail.number }).first().click();
  await sec.page.waitForSelector('.ant-drawer:visible'); await pause(1800);
  await shot(sec, '6-secretariat-fiche-close-et-historique');
  await sec.page.keyboard.press('Escape'); await pause(300);
  const ro = await sec.api('POST', `/api/mails/${mail.id}/reopen`, { reason: 'Réouverture de recette' });
  ok('4. Le secrétariat rouvre avec un motif', ro.status === 200, `HTTP ${ro.status}`);
  const hist = await sec.api('GET', `/api/mails/${mail.id}`);
  ok('4. Le courrier est de nouveau « en traitement »', hist.body.data.status === 'en_traitement');
} catch (e) {
  failed += 1; say(`ÉCHEC parcours interrompu : ${String(e.message).split('\n')[0]}`);
} finally {
  try {
    if (sec && mail) { const r = await sec.api('DELETE', `/api/mails/${mail.id}`, { reason: 'Recette automatique : courrier fictif' }); ok('5. Nettoyage : courrier fictif annulé avec motif', r.status === 200, `HTTP ${r.status}`); }
  } catch (e) { failed += 1; say(`ÉCHEC nettoyage : ${String(e.message).split('\n')[0]} : annulez à la main le courrier fictif du parcours`); }
  say(failed === 0 ? '\nTous les contrôles sont conformes.' : `\n${failed} contrôle(s) en échec : envoyez ce rapport.`);
  fs.writeFileSync('rapport-parcours.txt', lines.join('\n') + '\n');
  await browser.close();
  process.exit(failed === 0 ? 0 : 1);
}
