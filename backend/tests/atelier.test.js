/** Données d'atelier : chargement, marquage fictif, rejeu sans doublon, refus en production (standard v3.2, section 7.2). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const run = (env) => spawnSync(process.execPath, ['scripts/donnees-atelier.js', 'instance/atelier.exemple.json'], { cwd: ROOT, env: { ...process.env, ...env }, encoding: 'utf8' });

test('chargement de l’exemple, rejouable sans doublon, types et contacts marqués fictifs', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atelier-'));
  const env = { DB_PATH: path.join(dir, 'a.db'), NODE_ENV: 'test', APP_ENVIRONMENT: 'acceptance' };
  const a = run(env);
  assert.equal(a.status, 0, a.stderr);
  assert.match(a.stdout, /3 services, 3 types, 2 contacts ajoutés ; 0 services mis à jour/);
  const b = run(env);
  assert.equal(b.status, 0, b.stderr);
  assert.match(b.stdout, /0 services, 0 types, 0 contacts ajoutés ; 0 services mis à jour/);
  const check = spawnSync(process.execPath, ['-e', `
    const { initDb, getDb } = require('./src/database');
    initDb().then(() => {
      const db = getDb();
      console.log(JSON.stringify({
        demoTypes: db.prepare('SELECT COUNT(*) AS n FROM mail_types WHERE is_demo = 1').get().n,
        demoContacts: db.prepare('SELECT COUNT(*) AS n FROM contacts WHERE is_demo = 1').get().n,
        commun: db.prepare('SELECT COUNT(*) AS n FROM org_service_entities WHERE service_id = (SELECT id FROM org_services WHERE name_fr = ?)').get('Ressources humaines').n,
      }));
    });`], { cwd: ROOT, env: { ...process.env, ...env }, encoding: 'utf8' });
  assert.deepEqual(JSON.parse(check.stdout.trim().split('\n').pop()), { demoTypes: 3, demoContacts: 2, commun: 2 });
});

test('un service existant est mis à jour par son ancien nom, une seule fois', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atelier-'));
  const env = { DB_PATH: path.join(dir, 'u.db'), NODE_ENV: 'test', APP_ENVIRONMENT: 'acceptance' };
  assert.equal(run(env).status, 0);
  const ex = JSON.parse(fs.readFileSync(path.join(ROOT, 'instance', 'atelier.exemple.json'), 'utf8'));
  ex.services[0] = { match: 'Secrétariat', name_fr: 'Secrétariat général', name_nl: 'Algemeen secretariaat', nl_to_validate: false, entities: ['AC', 'CPAS'] };
  const file = path.join(dir, 'maj.json');
  fs.writeFileSync(file, JSON.stringify(ex));
  const runFile = () => spawnSync(process.execPath, ['scripts/donnees-atelier.js', file], { cwd: ROOT, env: { ...process.env, ...env }, encoding: 'utf8' });
  const a = runFile();
  assert.equal(a.status, 0, a.stderr);
  assert.match(a.stdout, /0 services, 0 types, 0 contacts ajoutés ; 1 services mis à jour/);
  assert.match(runFile().stdout, /; 0 services mis à jour/);
  const check = spawnSync(process.execPath, ['-e', `
    const { initDb, getDb } = require('./src/database');
    initDb().then(() => {
      const db = getDb();
      const s = db.prepare('SELECT id, name_nl FROM org_services WHERE name_fr = ?').get('Secrétariat général');
      console.log(JSON.stringify({ nl: s.name_nl, entites: db.prepare('SELECT COUNT(*) AS n FROM org_service_entities WHERE service_id = ?').get(s.id).n,
        ancien: db.prepare('SELECT COUNT(*) AS n FROM org_services WHERE name_fr = ?').get('Secrétariat').n }));
    });`], { cwd: ROOT, env: { ...process.env, ...env }, encoding: 'utf8' });
  assert.deepEqual(JSON.parse(check.stdout.trim().split('\n').pop()), { nl: 'Algemeen secretariaat', entites: 2, ancien: 0 });
});

test('refusé quand l’instance est en production', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'atelier-'));
  const r = run({ DB_PATH: path.join(dir, 'p.db'), NODE_ENV: 'production', APP_TEST_MODE: '', APP_ENVIRONMENT: 'production', JWT_SECRET: 'a'.repeat(64), CONFIG_ENC_KEY: 'b'.repeat(64) });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Refusé : APP_ENVIRONMENT=production/);
  assert.equal(fs.existsSync(path.join(dir, 'p.db')), false, 'aucune base créée');
});

test('le fichier de l’instance réelle est exclu du dépôt', () => {
  const gi = fs.readFileSync(path.join(ROOT, '..', '.gitignore'), 'utf8');
  assert.match(gi, /^backend\/instance\/\*$/m);
  assert.match(gi, /^!backend\/instance\/atelier\.exemple\.json$/m);
});
