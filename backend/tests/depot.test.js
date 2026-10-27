/**
 * Dépôt public (GITHUB.md, sections 6 et 7).
 * Le dépôt est public : aucune valeur propre au serveur d'acceptance, aucun secret, aucun document interne.
 * Les motifs sont assemblés par morceaux : ce fichier est public, il ne doit pas écrire lui-même ce qu'il interdit.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const EXCLUS = new Set(['node_modules', 'dist', 'data', '.git']);
const TEXTE = /(\.(md|js|ts|tsx|json|yml|yaml|sh|conf|html|css|svg|txt|example)|Dockerfile|LICENCE|\.gitignore|\.gitattributes|\.dockerignore)$/;
const VERROUS = new Set(['package-lock.json']);

function fichiers(dir) {
  return fs.readdirSync(dir).flatMap((f) => {
    if (EXCLUS.has(f)) return [];
    const p = path.join(dir, f);
    return fs.statSync(p).isDirectory() ? fichiers(p) : [p];
  });
}
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');
const tous = () => fichiers(ROOT);
const lisibles = () => tous().filter((f) => TEXTE.test(path.basename(f)) && !VERROUS.has(path.basename(f)));

// Adresse du serveur d'acceptance, dossiers de l'hôte et de l'autre application, ports déjà pris par les applications communales.
const INTERDITS = [
  ['adresse du serveur d\'acceptance', new RegExp(['10', '102', '20', '\\d+'].join('\\.'))],
  ['dossier de l\'hôte', new RegExp('/' + ['volume', '1'].join(''))],
  ['dossier d\'une autre application', new RegExp(['bsa', 'rh'].join('-'), 'i')],
  ['dossier d\'une autre application', new RegExp(['berchem', 'data'].join('-'), 'i')],
  ['port publié par une application communale', new RegExp('\\b(' + [['84', '43'], ['84', '44'], ['84', '46'], ['90', '80'], ['90', '81'], ['90', '82'], ['30', '04']].map((m) => m.join('')).join('|') + ')\\b')],
  ['clé privée', new RegExp('-----BEGIN [A-Z ]*' + 'PRIVATE KEY-----')],
  ['jeton GitHub', new RegExp('\\bgh[pousr]_[A-Za-z0-9]{20,}')],
  ['secret de session écrit en clair', /JWT_SECRET=[0-9a-f]{32,}/],
  ['clé de chiffrement écrite en clair', /CONFIG_ENC_KEY=[0-9a-f]{32,}/],
];

test('aucune valeur interdite par GITHUB.md section 6 dans les fichiers du dépôt', () => {
  const lus = lisibles();
  assert.ok(lus.length > 50, `trop peu de fichiers lus : ${lus.length}`);
  const trouvés = [];
  for (const f of lus) {
    const src = fs.readFileSync(f, 'utf8');
    for (const [nom, motif] of INTERDITS) if (motif.test(src)) trouvés.push(`${rel(f)} : ${nom}`);
  }
  assert.deepEqual(trouvés, []);
});

test('aucun fichier de secret, de base, de sauvegarde ni de dépendances dans l\'arborescence livrée', () => {
  const tout = fichiers(ROOT).map(rel);
  const pos = [];
  for (const f of tout) {
    const nom = path.basename(f);
    if (nom === '.env' || /^\.env\./.test(nom) && nom !== '.env.example') pos.push(f);
    if (/\.(db|sqlite|pem|key|tar\.gz|tsbuildinfo)$/.test(nom)) pos.push(f);
    if (/^backend\/instance\//.test(f) && f !== 'backend/instance/atelier.exemple.json') pos.push(f);
  }
  assert.deepEqual(pos, []);
});

test('documents internes absents du dépôt : standard et cahier des charges', () => {
  const tout = tous().map(rel);
  assert.deepEqual(tout.filter((f) => /(^|\/)STANDARD\.md$/.test(f) || /(^|\/)CAHIER-DES-CHARGES[^/]*\.md$/.test(f)), []);
});

test('.gitignore exclut ce que la section 6 interdit', () => {
  const lignes = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8').split('\n').map((l) => l.trim());
  for (const attendu of ['.env', '.env.*', '!.env.example', 'data/', '*.db', 'node_modules/', 'dist/', '*.tar.gz', 'ssl-certs/',
    'backend/instance/*', '!backend/instance/atelier.exemple.json', 'STANDARD.md', 'CAHIER-DES-CHARGES*.md']) {
    assert.ok(lignes.includes(attendu), `.gitignore ne contient pas « ${attendu} »`);
  }
});

test('GitHub Actions : ci.yml joue toutes les suites de la section 7 sous le nom de travail « tests »', () => {
  const f = path.join(ROOT, '.github', 'workflows', 'ci.yml');
  assert.ok(fs.existsSync(f), '.github/workflows/ci.yml manque');
  const y = fs.readFileSync(f, 'utf8');
  assert.match(y, /^name: tests$/m);
  assert.match(y, /^ {2}tests:$/m, 'le nom du travail doit être « tests » : la protection de main l\'exige au vert');
  assert.match(y, /pull_request:/);
  assert.match(y, /branches: \[main\]/);
  assert.match(y, /node-version: 20/);
  for (const cmd of ['npm ci', 'npm test', 'npm audit --omit=dev --audit-level=high', 'npm run build', 'npm run a11y']) {
    assert.ok(y.includes(cmd), `ci.yml ne lance pas « ${cmd} »`);
  }
  assert.match(y, /working-directory: backend/);
  assert.match(y, /working-directory: frontend/);
});
