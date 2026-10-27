/**
 * Couche d'accès aux données : sql.js derrière l'interface prepare().get/all/run de SAGA.
 * sql.js est admis pour le maquettage ; la production passe sur PostgreSQL 16 par le pont de PILOT
 * (pg-handle.js), avec la même interface (standard v3.2, sections 5 et 7.1).
 * Aucun ORM. Toute valeur passe par un paramètre ?.
 */
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { DB_PATH } = require('./config');

let rawDb = null;
let saveTimer = null;
let wrapped = null;

/** Écriture atomique : fichier temporaire puis renommage ; PRAGMA reposé après export() (piège SAGA 72-73). */
function saveNow() {
  if (!rawDb) return;
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, Buffer.from(rawDb.export()));
  fs.renameSync(tmp, DB_PATH);
  rawDb.run('PRAGMA foreign_keys = ON');
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 1000);
}

function createWrapper(raw) {
  const norm = (params) => params.map((p) => (p === undefined ? null : p));
  const rows = (sql, params, first) => {
    let stmt;
    try {
      stmt = raw.prepare(sql);
      if (params.length) stmt.bind(norm(params));
      const out = [];
      while (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        const row = {};
        cols.forEach((c, i) => { row[c] = vals[i]; });
        if (first) return row;
        out.push(row);
      }
      return first ? undefined : out;
    } finally {
      if (stmt) stmt.free();
    }
  };
  return {
    prepare(sql) {
      return {
        run(...params) {
          raw.run(sql, norm(params));
          scheduleSave();
          const r = raw.exec('SELECT last_insert_rowid() AS id, changes() AS c');
          return { lastInsertRowid: r.length ? r[0].values[0][0] : 0, changes: r.length ? r[0].values[0][1] : 0 };
        },
        get(...params) { return rows(sql, params, true); },
        all(...params) { return rows(sql, params, false); },
      };
    },
    exec(sql) { raw.run(sql); scheduleSave(); },
    transaction(fn) {
      return (...args) => {
        raw.run('BEGIN TRANSACTION');
        try {
          const r = fn(...args);
          raw.run('COMMIT');
          scheduleSave();
          return r;
        } catch (e) {
          raw.run('ROLLBACK');
          throw e;
        }
      };
    },
  };
}

async function initDb() {
  const SQL = await initSqlJs();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  rawDb = fs.existsSync(DB_PATH) ? new SQL.Database(fs.readFileSync(DB_PATH)) : new SQL.Database();
  rawDb.run('PRAGMA foreign_keys = ON');
  wrapped = createWrapper(rawDb);
  migrate();
  return wrapped;
}

function getDb() {
  if (!wrapped) throw new Error('Base non initialisée');
  return wrapped;
}

/**
 * Migrations numérotées, rejouables, jamais destructrices (standard v3.2, section 7.2).
 * Une évolution du schéma = une entrée ajoutée en fin de liste. Aucun CREATE TABLE ailleurs.
 */
const MIGRATIONS = [
  ['001_noyau', `
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      password_hash TEXT,
      user_role TEXT NOT NULL DEFAULT 'agent' CHECK (user_role IN ('agent', 'admin')),
      preferred_lang TEXT NOT NULL DEFAULT 'fr' CHECK (preferred_lang IN ('fr', 'nl')),
      ui_mode TEXT NOT NULL DEFAULT 'simple' CHECK (ui_mode IN ('simple', 'complet')),
      theme TEXT NOT NULL DEFAULT 'clair' CHECK (theme IN ('clair', 'sombre')),
      must_change_password INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      csrf_token TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );
    CREATE INDEX idx_sessions_user ON sessions(user_id);
    CREATE TABLE audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      channel TEXT NOT NULL DEFAULT 'api',
      details_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
    CREATE TABLE app_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `],
  // Entités (AC, CPAS...), registres et compteurs annuels, rôles par entité (CDC CE-001, CR-020, CR-021).
  ['002_entites_registres', `
    CREATE TABLE entities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE CHECK (length(code) BETWEEN 1 AND 20),
      name_fr TEXT NOT NULL CHECK (length(name_fr) BETWEEN 1 AND 200),
      name_nl TEXT NOT NULL CHECK (length(name_nl) BETWEEN 1 AND 200),
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE registers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id INTEGER NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
      direction TEXT NOT NULL CHECK (direction IN ('entree', 'depart')),
      prefix TEXT NOT NULL UNIQUE CHECK (length(prefix) BETWEEN 1 AND 20),
      digits INTEGER NOT NULL DEFAULT 6 CHECK (digits BETWEEN 3 AND 9),
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (entity_id, direction)
    );
    CREATE INDEX idx_registers_entity ON registers(entity_id);
    CREATE TABLE register_counters (
      register_id INTEGER NOT NULL REFERENCES registers(id) ON DELETE RESTRICT,
      year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2999),
      last_number INTEGER NOT NULL DEFAULT 0 CHECK (last_number >= 0),
      PRIMARY KEY (register_id, year)
    );
    CREATE TABLE user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entity_id INTEGER NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
      role TEXT NOT NULL CHECK (role IN ('agent', 'chef_service', 'secretariat', 'gestionnaire', 'auditeur')),
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (user_id, entity_id)
    );
    CREATE INDEX idx_user_roles_user ON user_roles(user_id);
    CREATE INDEX idx_user_roles_entity ON user_roles(entity_id);
  `],
  // Services destinataires (communs possibles à plusieurs entités), types de courrier par entité, contacts.
  ['003_referentiels', `
    CREATE TABLE org_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_fr TEXT NOT NULL CHECK (length(name_fr) BETWEEN 1 AND 200),
      name_nl TEXT CHECK (name_nl IS NULL OR length(name_nl) <= 200),
      nl_to_validate INTEGER NOT NULL DEFAULT 0 CHECK (nl_to_validate IN (0, 1)),
      parent_id INTEGER REFERENCES org_services(id) ON DELETE RESTRICT,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      cancel_reason TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX idx_org_services_parent ON org_services(parent_id);
    CREATE TABLE org_service_entities (
      service_id INTEGER NOT NULL REFERENCES org_services(id) ON DELETE CASCADE,
      entity_id INTEGER NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
      PRIMARY KEY (service_id, entity_id)
    );
    CREATE INDEX idx_org_service_entities_entity ON org_service_entities(entity_id);
    CREATE TABLE mail_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id INTEGER NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
      label_fr TEXT NOT NULL CHECK (length(label_fr) BETWEEN 1 AND 200),
      label_nl TEXT CHECK (label_nl IS NULL OR length(label_nl) <= 200),
      nl_to_validate INTEGER NOT NULL DEFAULT 0 CHECK (nl_to_validate IN (0, 1)),
      is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      cancel_reason TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX idx_mail_types_entity ON mail_types(entity_id);
    CREATE TABLE contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL CHECK (kind IN ('personne', 'organisation')),
      name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
      first_name TEXT,
      organisation TEXT,
      email TEXT,
      phone TEXT,
      street TEXT,
      postal_code TEXT,
      city TEXT,
      country TEXT,
      lang TEXT NOT NULL DEFAULT 'fr' CHECK (lang IN ('fr', 'nl', 'autre')),
      company_number TEXT,
      is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      cancel_reason TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX idx_contacts_name ON contacts(name);
  `],
  // Courrier entrant : numéro attribué par le serveur dans le registre de l'entité (CDC CE-040 à CE-044).
  ['004_courrier_entrant', `
    CREATE TABLE mails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      register_id INTEGER NOT NULL REFERENCES registers(id) ON DELETE RESTRICT,
      entity_id INTEGER NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
      year INTEGER NOT NULL,
      seq INTEGER NOT NULL CHECK (seq >= 1),
      number TEXT NOT NULL UNIQUE,
      received_date TEXT NOT NULL,
      registered_at TEXT NOT NULL DEFAULT (datetime('now')),
      channel TEXT NOT NULL CHECK (channel IN ('courrier', 'recommande', 'colis', 'guichet')),
      tracking_number TEXT,
      sender_contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
      addressee_name TEXT,
      subject TEXT NOT NULL CHECK (length(subject) BETWEEN 1 AND 500),
      type_id INTEGER NOT NULL REFERENCES mail_types(id) ON DELETE RESTRICT,
      lang TEXT NOT NULL DEFAULT 'fr' CHECK (lang IN ('fr', 'nl', 'autre')),
      urgency TEXT NOT NULL DEFAULT 'normale' CHECK (urgency IN ('normale', 'urgente')),
      sender_reference TEXT,
      document_date TEXT,
      pieces_count INTEGER CHECK (pieces_count IS NULL OR pieces_count BETWEEN 0 AND 9999),
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'enregistre' CHECK (status IN ('enregistre', 'annule')),
      cancel_reason TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (register_id, year, seq)
    );
    CREATE INDEX idx_mails_entity ON mails(entity_id);
    CREATE INDEX idx_mails_register ON mails(register_id);
    CREATE INDEX idx_mails_sender ON mails(sender_contact_id);
    CREATE INDEX idx_mails_type ON mails(type_id);
    CREATE INDEX idx_mails_received ON mails(received_date);
  `],
  // Pièces (fichiers déposés) et journal des consultations, version 0.2.0 (CDC CE-020, CE-025, CE-124, CG-003, CG-005).
  // Une pièce est d'abord dans la file « À enregistrer » de son entité (statut a_enregistrer, sans courrier),
  // puis rattachée à un courrier (rattachee) ou rejetée avec motif (rejetee). Le fichier vit hors de la base,
  // sous un nom généré par le serveur ; la base garde le nom d'origine, le type vérifié, la taille et l'empreinte.
  ['005_pieces_consultations', `
    CREATE TABLE pieces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id INTEGER NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
      mail_id INTEGER REFERENCES mails(id) ON DELETE RESTRICT,
      status TEXT NOT NULL DEFAULT 'a_enregistrer' CHECK (status IN ('a_enregistrer', 'rattachee', 'rejetee')),
      storage_name TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL CHECK (length(original_name) BETWEEN 1 AND 200),
      mime TEXT NOT NULL CHECK (mime IN ('application/pdf', 'image/jpeg', 'image/png')),
      size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
      sha256 TEXT NOT NULL CHECK (length(sha256) = 64),
      position INTEGER NOT NULL DEFAULT 1 CHECK (position >= 1),
      origin TEXT NOT NULL DEFAULT 'depot' CHECK (origin IN ('depot')),
      reject_reason TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      CHECK ((status = 'rattachee') = (mail_id IS NOT NULL)),
      CHECK ((status = 'rejetee') = (reject_reason IS NOT NULL))
    );
    CREATE INDEX idx_pieces_entity_status ON pieces(entity_id, status);
    CREATE INDEX idx_pieces_mail ON pieces(mail_id);
    CREATE INDEX idx_pieces_sha ON pieces(sha256);
    CREATE TABLE consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      entity_id INTEGER NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
      mail_id INTEGER REFERENCES mails(id) ON DELETE RESTRICT,
      piece_id INTEGER REFERENCES pieces(id) ON DELETE RESTRICT,
      action TEXT NOT NULL CHECK (action IN ('fiche', 'piece')),
      channel TEXT NOT NULL DEFAULT 'api' CHECK (channel IN ('api', 'mcp')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      CHECK (mail_id IS NOT NULL OR piece_id IS NOT NULL)
    );
    CREATE INDEX idx_consult_entity_date ON consultations(entity_id, created_at);
    CREATE INDEX idx_consult_mail ON consultations(mail_id);
    CREATE INDEX idx_consult_piece ON consultations(piece_id);
    CREATE INDEX idx_consult_user ON consultations(user_id);
  `],
];

function migrate() {
  const db = wrapped;
  db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, applied_at TEXT DEFAULT (datetime('now')))");
  const isApplied = (name) => !!db.prepare('SELECT 1 FROM schema_migrations WHERE name = ?').get(name);
  for (const [name, sql] of MIGRATIONS) {
    if (isApplied(name)) continue;
    db.transaction(() => {
      for (const stmt of sql.split(';').map((s) => s.trim()).filter(Boolean)) rawDb.run(stmt);
      db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(name);
    })();
    console.log(`[DB] Migration ${name} appliquée`);
  }
  seedReference(db);
  saveNow();
}

/**
 * Données de référence livrées dans config/registres.defaut.json : entités et registres, chargés une seule fois
 * dans une base vide. Ensuite, l'administration les modifie (standard v3.2, sections 7.2 et 11.4).
 */
function seedReference(db) {
  if (db.prepare('SELECT COUNT(*) AS n FROM entities').get().n > 0) return;
  const file = path.join(__dirname, '..', 'config', 'registres.defaut.json');
  const ref = JSON.parse(fs.readFileSync(file, 'utf8'));
  db.transaction(() => {
    for (const e of ref.entities) {
      const r = db.prepare('INSERT INTO entities (code, name_fr, name_nl) VALUES (?, ?, ?)').run(e.code, e.name_fr, e.name_nl);
      for (const g of e.registers) {
        db.prepare('INSERT INTO registers (entity_id, direction, prefix, digits) VALUES (?, ?, ?, ?)').run(r.lastInsertRowid, g.direction, g.prefix, g.digits);
      }
    }
  })();
  console.log('[DB] Entités et registres de référence chargés');
}

/**
 * Clause SET à partir d'un corps déjà validé par un schéma ajv à additionalProperties:false.
 * Le schéma est la liste blanche des colonnes ; cette fonction ne contrôle que la forme du nom.
 */
function safeBuildUpdate(body, excludeKeys = ['id']) {
  const SAFE_COL = /^[a-z_][a-z0-9_]{0,63}$/i;
  const sets = [];
  const params = [];
  for (const [k, v] of Object.entries(body)) {
    if (excludeKeys.includes(k) || !SAFE_COL.test(k)) continue;
    sets.push(`${k} = ?`);
    params.push(v);
  }
  return { sets, params };
}

module.exports = { initDb, getDb, saveNow, safeBuildUpdate };
