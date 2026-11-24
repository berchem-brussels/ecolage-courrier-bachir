/**
 * Qui voit un courrier, qui peut l'attribuer (CDC CE-060 à CE-062, CR-002, CR-007, CR-008).
 * - Secrétariat et gestionnaire de l'entité : tout le registre de leur entité.
 * - Agent et responsable de service : les courriers dont leur service est traitant ou en copie, et ceux où ils sont
 *   nommés ; un rôle à l'AC ne donne rien au CPAS et inversement (un rôle vaut pour une entité).
 * - Administrateur, auditeur : aucun accès au contenu sans rôle de registre ou de service.
 * Ce module ne dépend ni des courriers ni des pièces : les deux l'appellent, sans cycle.
 * La confidentialité à trois niveaux (restreint, confidentiel) viendra à l'étape 5 et se greffera ici.
 */
const { getDb } = require('../database');
const { REGISTER_ROLES, AGENT_ROLES, hasEntityRole } = require('../rights');

/**
 * Statut effectif d'un courrier (version 0.4.0) : le statut stocké reste « enregistre » ou « annule », l'avancement du
 * traitement est dans `processing` (none, en_traitement, clos). Expression SQL à placer dans un SELECT (alias « status »).
 */
const STATUS_SQL = `CASE WHEN m.status = 'annule' THEN 'annule' WHEN m.processing = 'clos' THEN 'clos'
  WHEN m.processing = 'en_traitement' THEN 'en_traitement' ELSE 'enregistre' END`;

/** Même calcul en JavaScript, pour une ligne lue sans l'expression (colonnes status et processing). */
const effectiveStatus = (m) => (m.status === 'annule' ? 'annule' : (m.processing === 'clos' ? 'clos' : (m.processing === 'en_traitement' ? 'en_traitement' : 'enregistre')));

/** Services auxquels la personne est rattachée dans une entité (Administration › Utilisateurs). */
function serviceIdsOf(userId, entityId) {
  return getDb().prepare('SELECT service_id FROM user_services WHERE user_id = ? AND entity_id = ?').all(userId, entityId).map((r) => r.service_id);
}

const isRegister = (user, entityId) => hasEntityRole(user, entityId, REGISTER_ROLES);
const isAgent = (user, entityId) => hasEntityRole(user, entityId, AGENT_ROLES);

function isMemberOf(user, entityId, serviceId) {
  return !!serviceId && isAgent(user, entityId) && serviceIdsOf(user.id, entityId).includes(serviceId);
}

/** Vrai si la personne peut lire la fiche et les pièces de ce courrier (m : id, entity_id, service_id, agent_id). */
function canSeeMail(user, m) {
  if (isRegister(user, m.entity_id)) return true;
  if (!isAgent(user, m.entity_id)) return false;
  if (m.agent_id === user.id) return true;
  const mine = serviceIdsOf(user.id, m.entity_id);
  if (mine.length === 0) return false;
  if (m.service_id && mine.includes(m.service_id)) return true;
  return getDb().prepare('SELECT service_id FROM mail_copies WHERE mail_id = ?').all(m.id).some((c) => mine.includes(c.service_id));
}

/** Courrier (colonnes utiles aux droits) par identifiant ; undefined s'il n'existe pas. */
function mailForAccess(mailId) {
  return getDb().prepare(`SELECT m.id, m.entity_id, ${STATUS_SQL} AS status, m.service_id, m.agent_id FROM mails m WHERE m.id = ?`).get(mailId);
}

/**
 * Actions permises à la personne sur ce courrier : l'interface n'affiche que ce que le serveur accepte.
 * m : id, entity_id, service_id, agent_id et status effectif (enregistre, en_traitement, clos, annule).
 * Traitement : l'agent nommé prend en charge, ou tout membre du service traitant quand aucun agent n'est nommé (0.4.1) ; l'agent nommé et le responsable du service closent ;
 * le secrétariat et le gestionnaire rouvrent et commentent ; les membres du service traitant commentent.
 */
function mailRights(user, m) {
  const open = m.status !== 'annule';
  const closed = m.status === 'clos';
  const register = isRegister(user, m.entity_id);
  const member = isMemberOf(user, m.entity_id, m.service_id);
  const manager = member && hasEntityRole(user, m.entity_id, ['chef_service']);
  const named = isAgent(user, m.entity_id) && !!m.agent_id && m.agent_id === user.id;
  return {
    edit: register && open,
    cancel: register && open,
    attribute: register && open && !closed,
    set_agent: open && !closed && !!m.service_id && (register || manager),
    return_to_secretariat: open && !closed && !!m.service_id && member,
    take: !!m.service_id && m.status === 'enregistre' && (m.agent_id ? named : member),
    close: m.status === 'en_traitement' && (named || manager),
    reopen: closed && register,
    comment: open && (register || member || named),
  };
}

/** Commentaire lisible : portée « entité » pour qui voit le courrier ; portée « service » pour le registre de l'entité et les membres de ce service. */
function canSeeComment(user, m, c) {
  if (c.author_id === user.id) return true;
  if (c.scope === 'entity') return canSeeMail(user, m);
  return isRegister(user, m.entity_id) || isMemberOf(user, m.entity_id, c.service_id);
}

module.exports = { STATUS_SQL, effectiveStatus, serviceIdsOf, isRegister, isAgent, isMemberOf, canSeeMail, mailForAccess, mailRights, canSeeComment };
