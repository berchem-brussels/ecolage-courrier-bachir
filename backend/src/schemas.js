/** Un schéma par corps ou requête (patron SAGA schemas.js). Sert aussi au contrat OpenAPI. */
const { T, obj } = require('./validation');

const listQuery = (extra = {}) => obj({
  limit: { ...T.int(1, 200), default: 50 },
  offset: { ...T.int(0), default: 0 },
  q: T.str(100),
  ...extra,
});

/** Rôles par entité : au plus un rôle par entité (CDC CE-001). */
const ENTITY_ROLES = {
  type: 'array', maxItems: 20,
  items: obj({ entity_id: T.int(1), role: T.en('agent', 'chef_service', 'secretariat', 'gestionnaire', 'auditeur') }, ['entity_id', 'role']),
};

module.exports = {
  login: obj({ email: T.reqStr(200), password: T.reqStr(200) }, ['email', 'password']),
  installation: obj({
    email: T.email(), first_name: T.reqStr(100), last_name: T.reqStr(100),
    password: { type: 'string', minLength: 12, maxLength: 200 },
  }, ['email', 'first_name', 'last_name', 'password']),
  changePassword: obj({ current_password: T.reqStr(200), new_password: { type: 'string', minLength: 12, maxLength: 200 } }, ['current_password', 'new_password']),
  preferences: obj({ preferred_lang: T.en('fr', 'nl'), ui_mode: T.en('simple', 'complet'), theme: T.en('clair', 'sombre') }),

  // Connexion Microsoft (standard v3.3, section 8.6) : le secret n'est jamais renvoyé, l'adresse publique est en HTTPS.
  authSettings: obj({
    mode: T.en('local', 'sso', 'sso_optional'),
    tenant: T.str(100), client_id: T.str(100), client_secret: { type: 'string', maxLength: 500 },
    public_url: { type: 'string', maxLength: 300, pattern: '^(https://[^\\s/]+(/[^\\s]*)?)?$' },
    domains: T.str(500),
  }),
  authTest: obj({ tenant: T.str(100) }),

  ticketList: listQuery({
    status: T.en('new', 'in_progress', 'waiting_requester', 'resolved', 'rejected', 'cancelled', 'closed'),
    type: T.en('incident', 'bug', 'question', 'wish'), queue: T.en('business', 'it'),
    open_only: { type: 'boolean' }, mine: { type: 'boolean' },
  }),
  ticketCreate: obj({
    type: T.en('incident', 'bug', 'question', 'wish'), title: T.reqStr(200),
    description: T.text(8000), expected: T.text(4000), actual: T.text(4000),
    impact: T.en('person', 'service', 'organisation'), urgency: T.en('blocking', 'annoying', 'comfort'),
    entity_id: T.int(1), screen: T.str(200), context: { type: 'object' }, screenshot: { type: 'string', maxLength: 2900000 },
  }, ['type', 'title']),
  ticketUpdate: obj({
    title: T.reqStr(200), description: T.text(8000), expected: T.text(4000), actual: T.text(4000),
    assignee_id: { type: ['integer', 'null'], minimum: 1 }, impact: T.en('person', 'service', 'organisation'),
    urgency: T.en('blocking', 'annoying', 'comfort'), priority: T.en('P1', 'P2', 'P3', 'P4'),
    wish_status: T.en('study', 'planned', 'delivered', 'refused'), fixed_version: T.str(30),
    queue: T.en('business', 'it'), reason: T.str(2000),
  }),
  ticketStatus: obj({ to: T.en('in_progress', 'waiting_requester', 'resolved', 'rejected', 'cancelled', 'closed', 'reopen'), reason: T.str(4000) }, ['to']),
  ticketMessage: obj({ body: T.reqStr(8000), is_internal: { type: 'boolean' } }, ['body']),
  // Réglages des tickets : délais en heures [prise en charge, résolution] par priorité, rôles de chaque file (codes de rôle, au moins un).
  ticketSettings: (() => {
    const hours = { type: 'array', minItems: 2, maxItems: 2, items: T.int(1, 8760) };
    const roles = { type: 'array', minItems: 1, maxItems: 6, uniqueItems: true, items: T.en('admin', 'agent', 'chef_service', 'secretariat', 'gestionnaire', 'auditeur') };
    return obj({ sla: obj({ P1: hours, P2: hours, P3: hours, P4: hours }, ['P1', 'P2', 'P3', 'P4']), reopen_days: T.int(1, 90), business_roles: roles, it_roles: roles });
  })(),

  entityList: listQuery({ is_active: { type: 'integer', enum: [0, 1] } }),
  entityCreate: obj({ code: { type: 'string', pattern: '^[A-Z0-9-]{1,20}$' }, name_fr: T.reqStr(200), name_nl: T.reqStr(200) }, ['code', 'name_fr', 'name_nl']),
  entityUpdate: obj({ name_fr: T.reqStr(200), name_nl: T.reqStr(200), is_active: { type: 'integer', enum: [0, 1] } }),

  registerList: listQuery({ entity_id: T.int(1), direction: T.en('entree', 'depart') }),
  registerCreate: obj({ entity_id: T.int(1), direction: T.en('entree', 'depart'), prefix: { type: 'string', pattern: '^[A-Z0-9-]{1,20}$' }, digits: T.int(3, 9) }, ['entity_id', 'direction', 'prefix']),
  registerUpdate: obj({ prefix: { type: 'string', pattern: '^[A-Z0-9-]{1,20}$' }, digits: T.int(3, 9), is_active: { type: 'integer', enum: [0, 1] } }),

  serviceList: listQuery({ entity_id: T.int(1), is_active: { type: 'integer', enum: [0, 1] } }),
  serviceCreate: obj({
    name_fr: T.reqStr(200), name_nl: T.str(200), nl_to_validate: T.bool(), parent_id: { type: ['integer', 'null'], minimum: 1 },
    entity_ids: { type: 'array', items: T.int(1), minItems: 1, maxItems: 20 },
  }, ['name_fr', 'entity_ids']),
  serviceUpdate: obj({
    name_fr: T.reqStr(200), name_nl: T.str(200), nl_to_validate: T.bool(), parent_id: { type: ['integer', 'null'], minimum: 1 },
    entity_ids: { type: 'array', items: T.int(1), minItems: 1, maxItems: 20 },
  }),

  typeList: listQuery({ entity_id: T.int(1), is_active: { type: 'integer', enum: [0, 1] } }),
  typeCreate: obj({ entity_id: T.int(1), label_fr: T.reqStr(200), label_nl: T.str(200), nl_to_validate: T.bool() }, ['entity_id', 'label_fr']),
  typeUpdate: obj({ label_fr: T.reqStr(200), label_nl: T.str(200), nl_to_validate: T.bool() }),

  contactList: listQuery({ is_active: { type: 'integer', enum: [0, 1] } }),
  contactCreate: obj({
    kind: T.en('personne', 'organisation'), name: T.reqStr(200), first_name: T.str(100), organisation: T.str(200),
    email: { type: ['string', 'null'], maxLength: 200, anyOf: [{ format: 'email' }, { maxLength: 0 }, { type: 'null' }] },
    phone: T.str(50), street: T.str(200), postal_code: T.str(20), city: T.str(100), country: T.str(100),
    lang: T.en('fr', 'nl', 'autre'), company_number: T.str(20),
  }, ['kind', 'name']),
  contactUpdate: obj({
    kind: T.en('personne', 'organisation'), name: T.reqStr(200), first_name: T.str(100), organisation: T.str(200),
    email: { type: ['string', 'null'], maxLength: 200, anyOf: [{ format: 'email' }, { maxLength: 0 }, { type: 'null' }] },
    phone: T.str(50), street: T.str(200), postal_code: T.str(20), city: T.str(100), country: T.str(100),
    lang: T.en('fr', 'nl', 'autre'), company_number: T.str(20),
  }),

  mailList: listQuery({ entity_id: T.int(1), status: T.en('enregistre', 'annule'), year: T.int(2000, 2999), channel: T.en('courrier', 'recommande', 'colis', 'guichet') }),
  mailCreate: obj({
    entity_id: T.int(1), received_date: T.date(), channel: T.en('courrier', 'recommande', 'colis', 'guichet'),
    tracking_number: T.str(50), sender_contact_id: T.int(1), addressee_name: T.str(200), subject: T.reqStr(500), type_id: T.int(1),
    lang: T.en('fr', 'nl', 'autre'), urgency: T.en('normale', 'urgente'), sender_reference: T.str(100), document_date: T.nullDate(),
    pieces_count: { type: ['integer', 'null'], minimum: 0, maximum: 9999 }, notes: T.text(5000),
    piece_ids: { type: 'array', items: T.int(1), maxItems: 20, uniqueItems: true },
  }, ['entity_id', 'channel', 'sender_contact_id', 'subject', 'type_id']),
  mailUpdate: obj({
    channel: T.en('courrier', 'recommande', 'colis', 'guichet'), tracking_number: T.str(50), sender_contact_id: T.int(1),
    addressee_name: T.str(200), subject: T.reqStr(500), type_id: T.int(1), lang: T.en('fr', 'nl', 'autre'), urgency: T.en('normale', 'urgente'),
    sender_reference: T.str(100), document_date: T.nullDate(), pieces_count: { type: ['integer', 'null'], minimum: 0, maximum: 9999 }, notes: T.text(5000),
  }),

  cancelReason: obj({ reason: T.reqStr(500) }, ['reason']),

  // Pièces (version 0.2.0). Le dépôt arrive en multipart/form-data : champ « file » et ces champs texte.
  pieceList: listQuery({ entity_id: T.int(1), status: T.en('a_enregistrer', 'rejetee'), mail_id: T.int(1) }),
  pieceCreate: obj({ entity_id: T.int(1), mail_id: T.int(1) }),
  pieceUpdate: obj({ original_name: T.reqStr(200), position: T.int(1, 9999) }),
  // Dépôt par un assistant (MCP) : contenu en base64, borné par la limite de 256 ko du corps JSON.
  pieceCreateMcp: obj({ entity_id: T.int(1), mail_id: T.int(1), file_name: T.reqStr(200), content_base64: { type: 'string', minLength: 4, maxLength: 340000, pattern: '^[A-Za-z0-9+/]+={0,2}$' } }, ['file_name', 'content_base64']),

  consultationList: listQuery({ entity_id: T.int(1), mail_number: T.str(50), user_id: T.int(1), from: T.date(), to: T.date() }),

  // Paramètres de l'instance (administrateur). 50 Mo : plafond technique de nginx.conf.
  settingsUpdate: obj({ pieces_max_mb: T.int(1, 50), pieces_mcp_read_max_mb: T.int(1, 10) }),

  userList: listQuery({ is_active: { type: 'integer', enum: [0, 1] } }),
  // Modèle Microsoft 365 (standard v3.2, section 8.1) : mot de passe généré ou encodé, changement imposé en option.
  userCreate: {
    ...obj({
      email: T.email(), first_name: T.reqStr(100), last_name: T.reqStr(100),
      user_role: T.en('agent', 'admin'), preferred_lang: T.en('fr', 'nl'),
      password_mode: { enum: ['generated', 'manual'], default: 'generated' },
      password: { type: 'string', minLength: 8, maxLength: 200 },
      must_change_password: { type: 'boolean', default: false },
      is_admin_local: { type: 'boolean', default: false },
      entity_roles: ENTITY_ROLES,
    }, ['email', 'first_name', 'last_name']),
    if: { properties: { password_mode: { const: 'manual' } }, required: ['password_mode'] },
    then: { required: ['password'] },
  },
  userUpdate: obj({
    first_name: T.reqStr(100), last_name: T.reqStr(100),
    user_role: T.en('agent', 'admin'), preferred_lang: T.en('fr', 'nl'), is_active: { type: 'integer', enum: [0, 1] }, is_admin_local: { type: 'integer', enum: [0, 1] },
    entity_roles: ENTITY_ROLES,
  }),
};
