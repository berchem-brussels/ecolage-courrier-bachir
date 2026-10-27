/**
 * Paramètres de l'instance : défauts livrés dans config/instance.defaut.json, surchargés par la table app_settings
 * (standard v3.2, section 11.4). Aucune valeur propre au pouvoir local dans le code.
 */
const fs = require('fs');
const path = require('path');
const { getDb } = require('./database');

const DEFAULTS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'instance.defaut.json'), 'utf8'));

function instanceSettings() {
  const out = JSON.parse(JSON.stringify(DEFAULTS));
  for (const row of getDb().prepare('SELECT key, value FROM app_settings').all()) {
    const [group, name] = row.key.split('.');
    if (out[group] && name in out[group] && !String(row.key).includes('secret')) out[group][name] = row.value;
  }
  return out;
}

/** Date du jour (AAAA-MM-JJ) dans le fuseau de l'instance ; le stockage des horodatages reste en UTC. */
function todayInInstance() {
  const tz = instanceSettings().app.timezone || 'UTC';
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

/** Décalage en minutes entre le fuseau de l'instance et UTC, à un instant donné (heure d'été comprise). */
function offsetMinutes(date, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(date).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return Math.round((asUtc - date.getTime()) / 60000);
}

/**
 * Bornes UTC (AAAA-MM-JJ HH:MM:SS, format des horodatages en base) d'une journée du fuseau de l'instance :
 * début de la journée et dernière seconde. Sert aux filtres de période sur des horodatages stockés en UTC.
 */
function dayBoundsUtc(day) {
  const tz = instanceSettings().app.timezone || 'UTC';
  const start = (d) => { const g = new Date(`${d}T00:00:00Z`); return new Date(g.getTime() - offsetMinutes(g, tz) * 60000); };
  const next = new Date(`${day}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const fmt = (x) => x.toISOString().slice(0, 19).replace('T', ' ');
  return { from: fmt(start(day)), to: fmt(new Date(start(next.toISOString().slice(0, 10)).getTime() - 1000)) };
}

module.exports = { DEFAULTS, instanceSettings, todayInInstance, dayBoundsUtc };
