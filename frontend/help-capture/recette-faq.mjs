/**
 * Recette de la FAQ locale : création d'une question d'essai, correction, retrait, vérification de l'affichage.
 * Reprend le contrôle de la FAQ de recette.mjs avec un titre unique à chaque lancement (le titre fixe de recette.mjs entre en
 * collision avec la question retirée d'un lancement précédent) et retire d'abord les questions d'essai restées actives.
 * Variables d'environnement : RECETTE_URL, RECETTE_USER, RECETTE_PASSWORD (jamais dans le fichier), RECETTE_HEADLESS (1 : sans affichage).
 * Modifie l'instance : crée une question de FAQ d'essai puis la retire (désactivation logique, rien n'est supprimé).
 */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = (process.env.RECETTE_URL || '').replace(/\/$/, '');
const USER = process.env.RECETTE_USER;
const PASSWORD = process.env.RECETTE_PASSWORD;
if (!BASE || !USER || !PASSWORD) { console.error('Définissez RECETTE_URL, RECETTE_USER et RECETTE_PASSWORD dans cette fenêtre PowerShell.'); process.exit(2); }

const lines = [];
let failed = 0;
const say = (s) => { console.log(s); lines.push(s); };
const ok = (name, cond, detail = '') => { if (!cond) failed += 1; say(`${cond ? 'OK   ' : 'ÉCHEC'} ${name}${detail ? ' : ' + detail : ''}`); };

const headless = process.env.RECETTE_HEADLESS === '1';
let browser;
try { browser = await chromium.launch({ channel: 'chrome', headless }); } catch { browser = await chromium.launch({ headless }); }
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 }, locale: 'fr-BE' });
const page = await ctx.newPage();
// Un appel d'API fait dans la page : repris si la page change de navigation en cours de route (juste après la connexion, par exemple).
const apiOnce = (method, url, body) => page.evaluate(async ({ method, url, body }) => {
  const me = await (await fetch('/api/auth/me')).json();
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.data.csrf_token }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}, { method, url, body });
const api = async (method, url, body) => {
  for (let i = 0; ; i += 1) {
    try { return await apiOnce(method, url, body); }
    catch (e) { if (i >= 4 || !/context was destroyed|navigation/i.test(String(e.message))) throw e; await page.waitForTimeout(900); }
  }
};
const pause = (ms) => page.waitForTimeout(ms);

await page.goto(`${BASE}/login`);
await page.fill('#email', USER);
await page.fill('#password', PASSWORD);
await page.click('button[type=submit]');
try { await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }); }
catch { say('ÉCHEC connexion : identifiants refusés ou instance inaccessible'); await browser.close(); process.exit(1); }
say(`Recette de la FAQ sur ${BASE}, ${new Date().toISOString()}`);
// Page stable avant tout appel : la connexion peut encore rediriger.
await page.goto(`${BASE}/registre`);
await page.waitForSelector('h1');
await page.waitForLoadState('networkidle');

try {
  // Nettoyage : questions d'essai restées actives d'un lancement interrompu
  const all = await api('GET', '/api/faq?limit=200');
  const left = ((all.body && all.body.data) || []).filter((f) => f.is_active === 1 && f.question_fr.startsWith('Question de recette automatique'));
  for (const f of left) await api('DELETE', `/api/faq/${f.id}`);
  say(`Nettoyage : ${left.length} question(s) d’essai restée(s) active(s) retirée(s)`);

  const title = `Question de recette automatique ${Date.now()}`;
  const created = await api('POST', '/api/faq', { topic_id: 'register', question_fr: title, question_nl: `Automatische testvraag ${Date.now()}`, answer_fr: 'Réponse initiale.', answer_nl: 'Eerste antwoord.' });
  ok('FAQ : question d’essai créée', created.status === 201, `HTTP ${created.status}`);
  const id = created.body.data.id;

  await page.goto(`${BASE}/help#help-register`); await page.waitForSelector('.help-topic'); await pause(1200);
  const header = page.locator(`.ant-collapse-header:has-text("${title}")`);
  await header.click();
  await page.locator('button:has-text("Modifier"):visible').first().click();
  await page.waitForSelector('.ant-modal:visible');
  await page.fill('#answer_fr', 'Réponse corrigée par la recette.');
  await page.locator('.ant-modal:visible .ant-modal-footer .ant-btn-primary').click();
  await page.waitForSelector('.ant-message-success');
  const after = await api('GET', `/api/faq/${id}`);
  ok('FAQ : la correction est enregistrée', /corrigée/.test(after.body.data.answer_fr));
  await pause(900);
  await header.click();
  await page.locator('button:has-text("Retirer"):visible').first().click();
  await page.waitForSelector('.ant-popover');
  await page.locator('.ant-popover .ant-btn-primary').click();
  await pause(1000);
  const gone = await api('GET', `/api/faq/${id}`);
  ok('FAQ : la question est retirée sans suppression (désactivée)', gone.body.data.is_active === 0);
  await header.click();
  ok('FAQ : la question retirée reste visible du gestionnaire avec la mention « Retirée »', (await page.locator(':text("Retirée")').count()) >= 1);
  await page.goto(`${BASE}/registre`); await page.waitForSelector('h1');
  await page.click('button[aria-label="Aide"]'); await page.waitForSelector('.ant-drawer .help-topic'); await pause(800);
  ok('FAQ : la question retirée a disparu du panneau d’aide du registre', (await page.locator(`.ant-drawer :text("${title}")`).count()) === 0);
} catch (e) {
  failed += 1; say(`ÉCHEC FAQ : ${String(e.message).split('\n')[0]}`);
}

say(failed === 0 ? '\nTous les contrôles de la FAQ sont conformes.' : `\n${failed} contrôle(s) en échec : envoyez ce rapport.`);
fs.writeFileSync('rapport-faq.txt', lines.join('\n') + '\n');
await browser.close();
process.exit(failed === 0 ? 0 : 1);
