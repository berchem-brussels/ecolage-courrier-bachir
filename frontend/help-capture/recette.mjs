/**
 * Recette automatisée de l'aide et des formulaires (versions 0.2.8 et suivantes), à lancer depuis un poste qui atteint l'instance.
 * Compte et mot de passe : variables d'environnement de la fenêtre PowerShell, jamais écrits dans le script.
 *   RECETTE_URL       adresse de l'application, par exemple https://192.0.2.10:8450
 *   RECETTE_USER      adresse e-mail du compte administrateur d'acceptance
 *   RECETTE_PASSWORD  son mot de passe
 *   RECETTE_VERSION   version attendue au bas du menu (0.3.1 par défaut)
 *   RECETTE_HEADLESS  1 pour ne pas afficher le navigateur (poste sans écran)
 * Les contrôles des bannettes (0.3.0 et suivantes) sont en lecture seule : aucun courrier n'est attribué, renvoyé ni modifié.
 * Ce que le script modifie sur l'instance d'acceptance : il crée une question de FAQ d'essai, la corrige puis la retire
 * (désactivation logique, rien n'est supprimé) ; il passe un instant la langue du compte en néerlandais puis la remet en français.
 * Résultat : une ligne OK ou ÉCHEC par contrôle, un rapport rapport.txt et des captures dans le dossier captures.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = (process.env.RECETTE_URL || '').replace(/\/$/, '');
const USER = process.env.RECETTE_USER;
const PASSWORD = process.env.RECETTE_PASSWORD;
if (!BASE || !USER || !PASSWORD) { console.error('Définissez RECETTE_URL, RECETTE_USER et RECETTE_PASSWORD dans cette fenêtre PowerShell.'); process.exit(2); }

const VERSION = process.env.RECETTE_VERSION || '0.3.1';
const OUT = path.resolve('captures');
fs.mkdirSync(OUT, { recursive: true });
const lines = [];
let failed = 0;
const say = (s) => { console.log(s); lines.push(s); };
const ok = (name, cond, detail = '') => {
  if (!cond) failed += 1;
  say(`${cond ? 'OK   ' : 'ÉCHEC'} ${name}${detail ? ' : ' + detail : ''}`);
};
const step = async (name, fn) => {
  try { await fn(); } catch (e) { failed += 1; say(`ÉCHEC ${name} : ${String(e.message).split('\n')[0]}`); }
};

let browser;
const headless = process.env.RECETTE_HEADLESS === '1';
try { browser = await chromium.launch({ channel: 'chrome', headless }); }
catch { browser = await chromium.launch({ headless }); }
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 }, locale: 'fr-BE' });
const page = await ctx.newPage();
let shotN = 0;
const shot = async (name) => { shotN += 1; await page.screenshot({ path: path.join(OUT, `${String(shotN).padStart(2, '0')}-${name}.png`) }); };
const api = (method, url, body) => page.evaluate(async ({ method, url, body }) => {
  const me = await (await fetch('/api/auth/me')).json();
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.data.csrf_token }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}, { method, url, body });
const loaded = (sel) => page.waitForFunction((s) => { const i = document.querySelector(s); return !!i && i.complete && i.naturalWidth > 0; }, sel, { timeout: 15000 });
const pause = (ms) => page.waitForTimeout(ms);
// Titre d'essai propre à chaque passage : une question d'essai restée active ne provoque plus de collision.
const FAQ_TAG = `essai ${Date.now().toString(36)}`;
const FAQ_TITLE = `Question de recette automatique ${FAQ_TAG}`;

// Connexion locale
await page.goto(`${BASE}/login`);
await page.fill('#email', USER);
await page.fill('#password', PASSWORD);
await page.click('button[type=submit]');
try { await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }); }
catch { say('ÉCHEC connexion : identifiants refusés ou instance inaccessible'); await browser.close(); fs.writeFileSync('rapport.txt', lines.join('\n') + '\n'); process.exit(1); }
await page.waitForLoadState('networkidle');
say(`Recette ${VERSION} sur ${BASE}, ${new Date().toISOString()}`);

await step('Version', async () => {
  await page.goto(`${BASE}/registre`); await page.waitForSelector('h1'); await pause(500);
  ok(`1. Version affichée v${VERSION} au bas du menu`, (await page.locator('body').innerText()).includes(`v${VERSION}`));
});

await step('Bannettes', async () => {
  await page.goto(`${BASE}/bannettes`); await page.waitForSelector('h1'); await pause(900);
  const tabs = await page.locator('[role=tab]').allInnerTexts();
  ok('10. Bannettes : onglets avec compteurs pour le secrétariat (À enregistrer, À attribuer)', tabs.length >= 2 && tabs.some((t) => /^À enregistrer \(\d+\)$/.test(t.trim())) && tabs.some((t) => /^À attribuer \(\d+\)$/.test(t.trim())), tabs.join(' | '));
  ok('10. Bannettes : le menu propose « Bannettes » en premier', /Bannettes/.test((await page.locator('nav .ant-menu-item').first().innerText())));
  ok('10. Cloche de notifications présente dans l’en-tête', (await page.locator('button[aria-label^="Notifications"]').count()) === 1);
  await page.locator('button[aria-label^="Notifications"]').click(); await pause(600);
  ok('10. Cloche : la liste s’ouvre (notifications ou « Aucune notification. »)', (await page.locator('.ant-popover').innerText()).length > 0);
  await shot('bannettes-cloche');
  await page.keyboard.press('Escape'); await pause(300);
  const counts = await api('GET', '/api/mails/counts');
  ok('10. API des compteurs : cinq compteurs numériques', counts.status === 200 && ['a_enregistrer', 'a_attribuer', 'mon_service', 'moi', 'en_copie'].every((k) => typeof counts.body.data[k] === 'number'), JSON.stringify(counts.body && counts.body.data));
  await page.click('button[aria-label="Aide"]');
  await page.waitForSelector('.ant-drawer .help-topic');
  await loaded('.ant-drawer img.help-shot');
  const src = await page.locator('.ant-drawer img.help-shot').first().getAttribute('src');
  ok('10. Panneau d’aide des bannettes : capture annotée affichée', /\/help\/fr\/bannettes-overview\.jpg/.test(src), src);
  ok('10. Panneau d’aide des bannettes : deux repères numérotés', (await page.locator('.ant-drawer .help-mark').count()) === 2);
  await page.keyboard.press('Escape'); await pause(400);
});

await step('Attribution (lecture)', async () => {
  await page.goto(`${BASE}/registre`); await page.waitForSelector('h1'); await pause(800);
  await page.locator('.ant-table-row').first().click();
  await page.waitForSelector('.ant-drawer:visible'); await pause(1200);
  const drawer = await page.locator('.ant-drawer').innerText();
  ok('11. Fiche : cadre « Attribution » avec service traitant, agent nommé et services en copie', ['Attribution', 'Service traitant', 'Agent nommé', 'Services en copie'].every((t) => drawer.includes(t)));
  ok('11. Fiche : le secrétariat dispose du bouton « Attribuer »', (await page.locator('.ant-drawer button:has-text("Attribuer")').count()) === 1);
  await shot('fiche-attribution');
  await page.keyboard.press('Escape'); await pause(400);
});

await step('Panneau', async () => {
  await page.click('button[aria-label="Aide"]');
  await page.waitForSelector('.ant-drawer .help-topic');
  await loaded('.ant-drawer img.help-shot');
  const src = await page.locator('.ant-drawer img.help-shot').first().getAttribute('src');
  ok('2. Panneau du registre : capture annotée affichée', /\/help\/fr\/register-overview\.jpg/.test(src), src);
  ok('2. Trois repères numérotés dans le texte des zones', (await page.locator('.ant-drawer .help-mark').count()) === 3);
  ok('2. Marge à gauche des puces (22 pixels)', (await page.evaluate(() => getComputedStyle(document.querySelector('.ant-drawer .help-topic ul')).paddingLeft)) === '22px');
  await shot('panneau-registre');
  await page.keyboard.press('Escape'); await pause(400);
});

await step('nginx', async () => {
  const a = await page.request.get(`${BASE}/help`, { maxRedirects: 0 });
  ok('8. /help répond sans redirection vers /help/', a.status() === 200, `HTTP ${a.status()}`);
  const b = await page.request.get(`${BASE}/help/fr/register-overview.jpg`, { maxRedirects: 0 });
  ok('8. Les captures sont servies par nginx (image JPEG)', b.status() === 200 && /image\/jpeg/.test(b.headers()['content-type'] || ''), `HTTP ${b.status()} ${b.headers()['content-type'] || ''}`);
});

await step('Néerlandais', async () => {
  await api('PUT', '/api/auth/preferences', { preferred_lang: 'nl' });
  try {
    await page.goto(`${BASE}/registre`); await page.waitForSelector('h1'); await pause(600);
    await page.click('button[aria-label="Help"]');
    await page.waitForSelector('.ant-drawer .help-topic');
    await loaded('.ant-drawer img.help-shot');
    const src = await page.locator('.ant-drawer img.help-shot').first().getAttribute('src');
    ok('3. Néerlandais : capture annotée en néerlandais', /\/help\/nl\/register-overview\.jpg/.test(src), src);
    await shot('panneau-neerlandais');
  } finally {
    await api('PUT', '/api/auth/preferences', { preferred_lang: 'fr' });
  }
  await page.goto(`${BASE}/registre`); await page.waitForSelector('h1'); await pause(400);
});

await step('FAQ', async () => {
  const created = await api('POST', '/api/faq', { topic_id: 'register', question_fr: `${FAQ_TITLE} (ne pas garder)`, question_nl: 'Automatische testvraag (niet bewaren)', answer_fr: 'Réponse initiale.', answer_nl: 'Eerste antwoord.' });
  ok('7. FAQ : question d’essai créée', created.status === 201, `HTTP ${created.status}`);
  const id = created.body && created.body.data && created.body.data.id;
  await page.goto(`${BASE}/help#help-register`); await page.waitForSelector('.help-topic'); await pause(1200);
  const header = page.locator(`.ant-collapse-header:has-text("${FAQ_TITLE}")`);
  await header.click();
  await page.locator('button:has-text("Modifier"):visible').first().click();
  await page.waitForSelector('.ant-modal:visible');
  await page.fill('#answer_fr', 'Réponse corrigée par la recette.');
  await shot('faq-modification');
  await page.locator('.ant-modal:visible .ant-modal-footer .ant-btn-primary').click();
  await page.waitForSelector('.ant-message-success');
  const after = await api('GET', `/api/faq/${id}`);
  ok('7. FAQ : la correction est enregistrée', /corrigée/.test(after.body.data.answer_fr));
  await pause(900);
  await header.click();
  await page.locator('button:has-text("Retirer"):visible').first().click();
  await page.waitForSelector('.ant-popover');
  await page.locator('.ant-popover .ant-btn-primary').click();
  await pause(1000);
  const gone = await api('GET', `/api/faq/${id}`);
  ok('7. FAQ : la question est retirée sans suppression (désactivée)', gone.body.data.is_active === 0);
  await header.click();
  ok('7. FAQ : la question retirée reste visible du gestionnaire avec la mention « Retirée »', (await page.locator(':text("Retirée")').count()) >= 1);
  await shot('faq-retiree');
  await page.goto(`${BASE}/registre`); await page.waitForSelector('h1');
  await page.click('button[aria-label="Aide"]'); await page.waitForSelector('.ant-drawer .help-topic'); await pause(800);
  ok('7. FAQ : la question retirée a disparu du panneau d’aide du registre', (await page.locator(`.ant-drawer :text("${FAQ_TITLE}")`).count()) === 0);
  await page.keyboard.press('Escape'); await pause(300);
});

await step('Clés brutes', async () => {
  await page.goto(`${BASE}/help`); await page.waitForSelector('.help-topic'); await pause(500);
  await page.locator('.ant-select:has(#help-path)').click();
  await page.locator('.ant-select-item-option:has-text("Tout le mode")').click();
  await pause(800);
  const text = await page.locator('.help-topics').innerText();
  ok('5. Plus aucune clé brute entre accolades dans les fiches', !text.includes('{{'));
  ok('5. Quinze fiches en « Tout le mode d’emploi »', (await page.locator('.help-topic').count()) === 15);
});

await step('Parcours', async () => {
  await page.goto(`${BASE}/help#help-register`); await page.waitForSelector('.help-topic'); await pause(1000);
  const first = await page.locator('.help-topic').count();
  await page.locator('.ant-select:has(#help-path)').click();
  await page.locator('.ant-select-item-option:has-text("Administrateur")').click();
  await pause(800);
  const second = await page.locator('.help-topic').count();
  ok('6. Parcours avec # : le choix « Administrateur » est respecté', first === 15 && second === 9, `${first} fiches d’abord, puis ${second}`);
});

await step('Création de compte', async () => {
  await page.goto(`${BASE}/admin/utilisateurs`); await page.waitForSelector('h1'); await pause(600);
  await page.click('button[aria-label="Aide"]'); await page.waitForSelector('.ant-drawer .help-topic');
  await page.locator('.ant-drawer .ant-collapse-header:has-text("Créer un compte")').click();
  await pause(500);
  try {
    await loaded('.ant-drawer img[src*="users-create"]');
    ok('4. Aide des comptes : capture de la fenêtre de création affichée dans la procédure « Créer un compte »', true);
  } catch {
    const imgs = await page.evaluate(() => [...document.querySelectorAll('.ant-drawer img')].map((i) => `${i.getAttribute('src')} chargée=${i.complete && i.naturalWidth > 0}`));
    ok('4. Aide des comptes : capture de la fenêtre de création affichée dans la procédure « Créer un compte »', false, `images du panneau : ${imgs.join(' ; ') || 'aucune'}`);
  }
  await shot('aide-creation-compte');
  await page.keyboard.press('Escape'); await pause(300);
});

// Remarques de Chrome et étiquettes mal reliées, écran par écran (E23)
const cdp = await ctx.newCDPSession(page);
const issues = [];
cdp.on('Audits.issueAdded', ({ issue }) => issues.push(issue));
await cdp.send('DOM.enable');
await cdp.send('Audits.enable');
const labelProblems = () => page.evaluate(() => {
  const LABELABLE = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'METER', 'OUTPUT', 'PROGRESS'];
  return [...document.querySelectorAll('label')].map((l) => {
    const f = l.getAttribute('for');
    const t = (l.textContent || '').trim().slice(0, 28);
    if (!f) return l.querySelector('input,select,textarea,button') ? null : `étiquette orpheline « ${t} »`;
    const e = document.getElementById(f);
    if (!e) return `for="${f}" sans élément (« ${t} »)`;
    return LABELABLE.includes(e.tagName) ? null : `for="${f}" vise ${e.tagName} (« ${t} »)`;
  }).filter(Boolean).concat([...document.querySelectorAll('input, textarea, select')]
    .filter((e) => !['hidden', 'checkbox', 'radio'].includes(e.type) && !e.id && !e.name && e.getAttribute('aria-hidden') !== 'true')
    .map((e) => `champ sans id ni nom : ${e.outerHTML.slice(0, 80)}`));
});
const btn = (t) => async () => { await page.locator(`button:has-text("${t}")`).first().click(); await page.waitForSelector('.ant-modal:visible'); };
const screens = [
  ['Enregistrer un courrier', '/enregistrer'],
  ['Contacts › Nouveau contact', '/contacts', btn('Nouveau contact')],
  ['Utilisateurs › Créer', '/admin/utilisateurs', btn('Créer')],
  ['Paramètres', '/admin/parametres'],
  ['Services › Nouveau service', '/admin/services', btn('Nouveau service')],
  ['Types › Nouveau type', '/admin/types', btn('Nouveau type')],
  ['Entités et registres › clic sur une ligne', '/admin/registres', async () => { await page.locator('.ant-table-row').first().click(); await page.waitForSelector('.ant-modal:visible'); }],
  ['Entités et registres › clic sur un registre', '/admin/registres', async () => { await page.locator('.ant-table-row').last().click(); await page.waitForSelector('.ant-modal:visible'); }],
  ['Tickets › Signaler', '/tickets', btn('Signaler')],
  ['Aide › Ajouter une question', '/help', btn('Ajouter une question')],
  ['Bannettes', '/bannettes'],
  ['Utilisateurs › Modifier les rôles', '/admin/utilisateurs', async () => { await page.locator('button:has-text("Modifier les rôles")').first().click(); await page.waitForSelector('.ant-modal:visible'); }],
  ['Registre › fiche d’un courrier', '/registre', async () => { await page.locator('.ant-table-row').first().click(); await page.waitForSelector('.ant-drawer:visible'); }],
];
for (const [name, route, action] of screens) {
  await step(name, async () => {
    issues.length = 0;
    await page.goto(`${BASE}${route}`); await page.waitForSelector('h1'); await pause(700);
    if (action) await action();
    await pause(1200);
    const types = {};
    for (const i of issues) { const d = i.details || {}; const t = (d.genericIssueDetails && d.genericIssueDetails.errorType) || i.code; types[t] = (types[t] || 0) + 1; }
    const chrome = Object.keys(types).length ? Object.entries(types).map(([k, v]) => `${k} x${v}`).join(', ') : 'aucune remarque';
    // Élément visé par chaque remarque de Chrome (début de sa balise), pour retrouver le champ en cause.
    const nodes = [];
    if (issues.length) await cdp.send('DOM.getDocument', { depth: -1 }).catch(() => null);
    for (const i of issues.slice(0, 4)) {
      const nid = i.details && i.details.genericIssueDetails && i.details.genericIssueDetails.violatingNodeId;
      if (!nid) continue;
      try {
        const { object } = await cdp.send('DOM.resolveNode', { backendNodeId: nid });
        const r = await cdp.send('Runtime.callFunctionOn', { objectId: object.objectId, functionDeclaration: 'function () { return this.outerHTML.slice(0, 110); }', returnByValue: true });
        nodes.push(r.result.value);
      } catch { /* nœud disparu */ }
    }
    const dom = await labelProblems();
    ok(`9. ${name}`, Object.keys(types).length === 0 && dom.length === 0, `Chrome : ${chrome}${nodes.length ? ' [' + nodes.join(' | ') + ']' : ''} ; étiquettes : ${dom.length ? dom.join(' | ') : 'ok'}`);
    await page.keyboard.press('Escape'); await pause(300);
  });
}

say(failed === 0 ? '\nTous les contrôles sont conformes.' : `\n${failed} contrôle(s) en échec : envoyez ce rapport.`);
fs.writeFileSync('rapport.txt', lines.join('\n') + '\n');
await browser.close();
process.exit(failed === 0 ? 0 : 1);
