/**
 * Écrans de l'application : identifiant stable, adresse et titre. L'identifiant est celui que le ticket enregistre (standard v3.3, 13.5)
 * et que la fiche d'aide de l'écran reprendra en 0.2.7. noCapture : l'écran affiche du courrier, aucune capture dans un ticket
 * (RGPD by design) ; la même liste est au serveur (NO_CAPTURE_SCREENS, services/tickets.js).
 */
export interface ScreenInfo { id: string; path: string; titleKey: string; noCapture?: boolean }

export const SCREENS: ScreenInfo[] = [
  { id: 'home', path: '/accueil', titleKey: 'nav.home' },
  { id: 'register', path: '/registre', titleKey: 'nav.register', noCapture: true },
  { id: 'registration', path: '/enregistrer', titleKey: 'nav.registration', noCapture: true },
  { id: 'inbox', path: '/a-enregistrer', titleKey: 'nav.inbox', noCapture: true },
  { id: 'consultations', path: '/consultations', titleKey: 'nav.consultations', noCapture: true },
  { id: 'contacts', path: '/contacts', titleKey: 'nav.contacts' },
  { id: 'users', path: '/admin/utilisateurs', titleKey: 'nav.users' },
  { id: 'entities', path: '/admin/registres', titleKey: 'nav.entities' },
  { id: 'services', path: '/admin/services', titleKey: 'nav.services' },
  { id: 'types', path: '/admin/types', titleKey: 'nav.types' },
  { id: 'settings', path: '/admin/parametres', titleKey: 'nav.settings' },
  { id: 'tickets', path: '/tickets', titleKey: 'nav.tickets' },
  { id: 'help', path: '/help', titleKey: 'nav.help' },
  { id: 'accessibility', path: '/accessibility', titleKey: 'nav.accessibility' },
];

export function screenForPath(path: string): ScreenInfo | undefined {
  const clean = path.replace(/\/+$/, '') || '/';
  return SCREENS.find((s) => s.path === clean);
}
