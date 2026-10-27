/**
 * Chargement des données d'atelier (standard v3.2, section 7.2) : services destinataires, types de courrier et contacts.
 * - Refusé quand APP_ENVIRONMENT vaut production : les données fictives n'entrent jamais dans une instance de production.
 * - Types et contacts sont marqués is_demo = 1 et affichés comme fictifs ; les services sont ceux de l'instance.
 * - Rejouable sans doublon : un type ou un contact déjà présent (même nom) est laissé tel quel.
 * - Un service déjà présent est retrouvé par « match » (ancien nom FR) ou par son nom FR, puis mis à jour
 *   (noms FR et NL, mention « à valider », entités) seulement si le fichier le décrit autrement.
 *   Ensuite, un service se modifie dans Administration > Services, sans nouvelle version.
 * - À lancer API arrêtée, car un seul processus écrit dans le fichier sql.js (standard v3.2, section 6.2) :
 *     docker compose run --rm --no-deps backend node scripts/donnees-atelier.js [fichier]
 * Fichier par défaut : instance/atelier.json, sinon instance/atelier.exemple.json.
 */
const fs = require('fs');
const path = require('path');
const { ENVIRONMENT } = require('../src/config');
const { initDb, getDb, saveNow } = require('../src/database');
const { logAudit } = require('../src/audit');

async function main() {
  if (ENVIRONMENT === 'production') {
    console.error('[ATELIER] Refusé : APP_ENVIRONMENT=production. Les données fictives sont réservées à l’acceptance.');
    process.exit(1);
  }
  const dir = path.join(__dirname, '..', 'instance');
  const file = process.argv[2] || (fs.existsSync(path.join(dir, 'atelier.json')) ? path.join(dir, 'atelier.json') : path.join(dir, 'atelier.exemple.json'));
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  await initDb();
  const db = getDb();
  const entityId = (code) => {
    const e = db.prepare('SELECT id FROM entities WHERE code = ?').get(code);
    if (!e) throw new Error(`Entité inconnue : ${code}`);
    return e.id;
  };
  const n = { settings: 0, services: 0, updated: 0, types: 0, contacts: 0 };
  db.transaction(() => {
    for (const [key, value] of Object.entries(data.settings || {})) {
      db.prepare("INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')").run(key, value);
      n.settings += 1;
    }
    for (const s of data.services || []) {
      const found = db.prepare('SELECT id, name_fr, name_nl, nl_to_validate FROM org_services WHERE name_fr = ?').get(s.match || s.name_fr)
        || db.prepare('SELECT id, name_fr, name_nl, nl_to_validate FROM org_services WHERE name_fr = ?').get(s.name_fr);
      if (found) {
        const ids = s.entities.map(entityId).sort((a, b) => a - b);
        const cur = db.prepare('SELECT entity_id FROM org_service_entities WHERE service_id = ? ORDER BY entity_id').all(found.id).map((x) => x.entity_id);
        const same = found.name_fr === s.name_fr && (found.name_nl || null) === (s.name_nl || null)
          && found.nl_to_validate === (s.nl_to_validate ? 1 : 0) && JSON.stringify(cur) === JSON.stringify(ids);
        if (same) continue;
        db.prepare("UPDATE org_services SET name_fr = ?, name_nl = ?, nl_to_validate = ?, updated_at = datetime('now') WHERE id = ?")
          .run(s.name_fr, s.name_nl || null, s.nl_to_validate ? 1 : 0, found.id);
        db.prepare('DELETE FROM org_service_entities WHERE service_id = ?').run(found.id);
        for (const e of ids) db.prepare('INSERT INTO org_service_entities (service_id, entity_id) VALUES (?, ?)').run(found.id, e);
        n.updated += 1;
        continue;
      }
      const r = db.prepare('INSERT INTO org_services (name_fr, name_nl, nl_to_validate) VALUES (?, ?, ?)').run(s.name_fr, s.name_nl || null, s.nl_to_validate ? 1 : 0);
      for (const code of s.entities) db.prepare('INSERT INTO org_service_entities (service_id, entity_id) VALUES (?, ?)').run(r.lastInsertRowid, entityId(code));
      n.services += 1;
    }
    for (const [code, list] of Object.entries(data.types || {})) {
      const eid = entityId(code);
      for (const t of list) {
        if (db.prepare('SELECT 1 FROM mail_types WHERE entity_id = ? AND label_fr = ?').get(eid, t.fr)) continue;
        db.prepare('INSERT INTO mail_types (entity_id, label_fr, label_nl, nl_to_validate, is_demo) VALUES (?, ?, ?, 1, 1)').run(eid, t.fr, t.nl);
        n.types += 1;
      }
    }
    for (const c of data.contacts || []) {
      if (db.prepare('SELECT 1 FROM contacts WHERE name = ? AND COALESCE(first_name, \'\') = ?').get(c.name, c.first_name || '')) continue;
      db.prepare(`INSERT INTO contacts (kind, name, first_name, organisation, email, street, postal_code, city, country, lang, is_demo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`).run(c.kind, c.name, c.first_name || null, c.organisation || null, c.email || null,
        c.street || null, c.postal_code || null, c.city || null, c.country || null, c.lang || 'fr');
      n.contacts += 1;
    }
  })();
  logAudit(null, 'atelier.load', 'instance', null, { file: path.basename(file), ...n }, 'script');
  saveNow();
  console.log(`[ATELIER] ${path.basename(file)} : ${n.settings} paramètres, ${n.services} services, ${n.types} types, ${n.contacts} contacts ajoutés ; ${n.updated} services mis à jour.`);
}

main().catch((e) => { console.error('[ATELIER] Échec :', e.message); process.exit(1); });
