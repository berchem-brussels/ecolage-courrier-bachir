/**
 * Schéma des fiches d'aide (standard v3.3, section 13.1) : une fiche par écran, FR et NL côte à côte.
 * Dans les textes : {{clé}} affiche le libellé réel de l'interface, [[n]] le repère n de la capture, **texte** le gras.
 * Les rôles sont ceux de l'application : le rôle global « admin » et les rôles par entité.
 */
export interface L { fr: string; nl: string }

export type Role = 'agent' | 'chef_service' | 'secretariat' | 'gestionnaire' | 'auditeur' | 'admin';
export const ROLES: Role[] = ['agent', 'chef_service', 'secretariat', 'gestionnaire', 'auditeur', 'admin'];
/** Clé de traduction du nom d'un rôle : « admin » est le rôle global, les autres sont des rôles par entité. */
export const roleKey = (r: Role) => (r === 'admin' ? 'users.role.admin' : `role.${r}`);

export interface ShotAction { click?: string; clickSel?: string; fill?: { sel: string; value: string }; wait?: number }

/** Capture produite par le script help-capture (version 0.2.8) : jamais à la main. */
export interface Shot {
  id: string;
  path: string;
  actions?: ShotAction[];
  clip?: 'page' | 'modal' | 'drawer';
  marks?: { sel: string }[];
  caption: L;
}

export interface Procedure {
  title: L;
  when: L;
  steps: L[];
  result: L;
  errors?: { problem: L; solution: L }[];
  roles?: Role[];
  shots?: string[];
}

export interface HelpTopic {
  id: string;
  path: string;
  group: 'main' | 'admin' | 'help';
  titleKey: string;
  roles: Role[];
  purpose: L;
  layout: L[];
  overviewShot?: string;
  procedures: Procedure[];
  faq: { q: L; a: L }[];
  seeAlso: string[];
  shots: Shot[];
}

/** Parcours de lecture proposés par le centre d'aide : les fiches utiles à chaque rôle, dans l'ordre où l'on s'en sert. */
export const PATHS: Record<Role, string[]> = {
  agent: ['home', 'tickets', 'help', 'accessibility'],
  chef_service: ['home', 'tickets', 'help', 'accessibility'],
  secretariat: ['registration', 'inbox', 'register', 'contacts', 'tickets', 'help', 'accessibility'],
  gestionnaire: ['registration', 'inbox', 'register', 'contacts', 'types', 'tickets', 'help', 'accessibility'],
  auditeur: ['home', 'consultations', 'tickets', 'help', 'accessibility'],
  admin: ['home', 'users', 'entities', 'services', 'types', 'settings', 'tickets', 'help', 'accessibility'],
};
