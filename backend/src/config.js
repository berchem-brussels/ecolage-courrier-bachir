/**
 * Configuration d'amorçage lue dans l'environnement (fichier .env sur le serveur).
 * En production, un secret absent, trop court ou laissé à une valeur d'exemple arrête le démarrage.
 * Le mode test ne s'active que par APP_TEST_MODE=1 et jamais avec NODE_ENV=production (standard v3.2, section 14.2).
 */
const crypto = require('crypto');
const path = require('path');

const PROD = process.env.NODE_ENV === 'production';
const TEST_MODE = process.env.APP_TEST_MODE === '1';

if (TEST_MODE && PROD) {
  console.error('[CONFIG] APP_TEST_MODE=1 avec NODE_ENV=production : démarrage refusé.');
  process.exit(1);
}

function secret(name) {
  const v = process.env[name] || '';
  const valide = v.length >= 32 && !/change|exemple|example|secret/i.test(v);
  if (valide) return v;
  if (PROD) {
    console.error(`[CONFIG] ${name} absent, trop court ou valeur d'exemple : démarrage refusé.`);
    process.exit(1);
  }
  console.warn(`[CONFIG] ${name} absent : secret éphémère, réservé au développement et aux tests.`);
  return crypto.randomBytes(32).toString('hex');
}

/** Environnement de l'instance : acceptance (données fictives permises) ou production (refusées). Obligatoire en production Docker. */
function environment() {
  const v = process.env.APP_ENVIRONMENT || '';
  if (['acceptance', 'production'].includes(v)) return v;
  if (PROD) {
    console.error('[CONFIG] APP_ENVIRONMENT doit valoir acceptance ou production : démarrage refusé.');
    process.exit(1);
  }
  return 'developpement';
}

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'app.db');

module.exports = {
  PROD,
  ENVIRONMENT: environment(),
  TEST_MODE,
  PORT: Number(process.env.PORT || 3001),
  DB_PATH,
  // Fichiers déposés : dans le même volume que la base, hors de toute racine web (standard v3.2, section 10.2).
  FILES_DIR: path.join(path.dirname(DB_PATH), 'pieces'),
  JWT_SECRET: secret('JWT_SECRET'),
  CONFIG_ENC_KEY: secret('CONFIG_ENC_KEY'),
  VERSION: require('../package.json').version,
  SESSION_HOURS: 8,
};
