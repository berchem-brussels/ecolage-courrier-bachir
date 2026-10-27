/**
 * Droits par entité (CDC CE-001) : un rôle vaut pour une seule entité ; un rôle à l'AC ne donne rien sur le CPAS.
 * Rôle global « admin » : administration de l'application, sans accès au contenu du courrier (CDC section 4).
 * Tout contrôle passe par ces fonctions, appelées par les services, pour que l'application Droits puisse les remplacer
 * (standard v3.2, section 6.2).
 */
const { AppError } = require('./envelope');

const REGISTER_ROLES = ['secretariat', 'gestionnaire'];

const isAdmin = (user) => !!user && user.role === 'admin';

function rolesOf(user) {
  return (user && Array.isArray(user.roles)) ? user.roles : [];
}

/** Vrai si la personne a l'un des rôles donnés dans l'entité. */
function hasEntityRole(user, entityId, roles) {
  return rolesOf(user).some((r) => r.entity_id === Number(entityId) && roles.includes(r.role));
}

/** Entités dont la personne tient le registre (secrétariat ou gestionnaire). */
function registerEntities(user) {
  return [...new Set(rolesOf(user).filter((r) => REGISTER_ROLES.includes(r.role)).map((r) => r.entity_id))];
}

function assertAdmin(user) {
  if (!isAdmin(user)) throw new AppError(403, 'FORBIDDEN');
}

function assertRegister(user, entityId) {
  if (!hasEntityRole(user, entityId, REGISTER_ROLES)) throw new AppError(403, 'FORBIDDEN');
}

/** Contacts : personnes qui tiennent un registre, quelle que soit l'entité (contacts communs, CDC CE-130). */
function assertContacts(user) {
  if (registerEntities(user).length === 0) throw new AppError(403, 'FORBIDDEN');
}

/** Entités dont la personne est auditeur : journal des consultations, sans accès au contenu du courrier (CDC section 4, CG-003). */
function auditEntities(user) {
  return [...new Set(rolesOf(user).filter((r) => r.role === 'auditeur').map((r) => r.entity_id))];
}

/** Types de courrier : administrateur ou gestionnaire de l'entité concernée. */
function assertTypeManager(user, entityId) {
  if (!isAdmin(user) && !hasEntityRole(user, entityId, ['gestionnaire'])) throw new AppError(403, 'FORBIDDEN');
}

module.exports = { REGISTER_ROLES, isAdmin, rolesOf, hasEntityRole, registerEntities, auditEntities, assertAdmin, assertRegister, assertContacts, assertTypeManager };
