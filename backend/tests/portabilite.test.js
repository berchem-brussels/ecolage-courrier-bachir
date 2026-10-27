/**
 * Portabilité et version (standard v3.2, sections 11.4 et 14.3).
 * Aucune valeur propre à un pouvoir local dans le code ; la palette et l'identité vivent dans config/.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
// Les motifs sont assemblés par morceaux : ce fichier est public, il ne doit pas écrire lui-même l'adresse ni le dossier qu'il interdit.
const MOTIFS = [new RegExp(['10', '102', '20', '\\d+'].join('\\.')), /berchem/i, /sint-agatha/i, /\bBSA\b/, /#006265/i, /#005254/i, new RegExp(['bsa', 'rh'].join('-'), 'i')];
const EXCLUS = new Set(['node_modules', 'dist', 'data', 'config', 'tests', 'test', '.git']);

function files(dir) {
  return fs.readdirSync(dir).flatMap((f) => {
    if (EXCLUS.has(f)) return [];
    const p = path.join(dir, f);
    return fs.statSync(p).isDirectory() ? files(p) : [p];
  });
}

test('aucune valeur propre au pouvoir local de référence dans le code', () => {
  const code = [...files(path.join(ROOT, 'backend', 'src')), ...files(path.join(ROOT, 'frontend', 'src')),
    path.join(ROOT, 'docker-compose.yml'), path.join(ROOT, 'frontend', 'nginx.conf'), path.join(ROOT, 'frontend', 'docker-entrypoint.sh')]
    .filter((f) => fs.existsSync(f));
  assert.ok(code.length > 10);
  for (const f of code) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of MOTIFS) assert.doesNotMatch(src, m, `${path.relative(ROOT, f)} contient ${m}`);
  }
});

test('version identique dans les deux package.json', () => {
  const b = require(path.join(ROOT, 'backend', 'package.json')).version;
  const f = require(path.join(ROOT, 'frontend', 'package.json')).version;
  assert.match(b, /^\d+\.\d+\.\d+$/);
  assert.equal(f, b);
});
