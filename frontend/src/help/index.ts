/** Liste des fiches d'aide, dans l'ordre du menu, et recherche de la fiche d'un écran. */
import type { HelpTopic } from './types';
import home from './topics/home';
import register from './topics/register';
import inbox from './topics/inbox';
import registration from './topics/registration';
import contacts from './topics/contacts';
import consultations from './topics/consultations';
import users from './topics/users';
import entities from './topics/entities';
import services from './topics/services';
import types from './topics/types';
import settings from './topics/settings';
import tickets from './topics/tickets';
import help from './topics/help';
import accessibility from './topics/accessibility';

export const TOPICS: HelpTopic[] = [home, register, inbox, registration, contacts, consultations, users, entities, services, types, settings, tickets, help, accessibility];

export function topicForPath(path: string): HelpTopic | undefined {
  const clean = path.replace(/\/+$/, '') || '/';
  return TOPICS.find((t) => t.path === clean);
}
