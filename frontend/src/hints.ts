/**
 * Explication de chaque champ à encoder, FR et NL (standard v3.3, section 13.1) : ce qu'il faut encoder et d'où vient la valeur.
 * Clé « Écran.champ ». Version 0.2.5 : champs de la connexion ; les autres formulaires suivent en 0.2.7 avec le contrôle bloquant.
 */
import type { Lang } from './i18n';

export const hints: Record<string, Record<Lang, string>> = {
  'login.email': { fr: "Adresse professionnelle avec laquelle votre compte a été créé dans l'application.", nl: 'Professioneel adres waarmee uw account in de toepassing werd aangemaakt.' },
  'login.password': { fr: "Mot de passe de votre compte local, reçu de l'administrateur ou choisi par vous.", nl: 'Wachtwoord van uw lokaal account, ontvangen van de beheerder of door u gekozen.' },
  'install.email': { fr: "Adresse professionnelle du premier administrateur de l'application.", nl: 'Professioneel adres van de eerste beheerder van de toepassing.' },
  'install.first_name': { fr: 'Prénom du premier administrateur, tel qu’il apparaîtra dans le journal.', nl: 'Voornaam van de eerste beheerder, zoals hij in het logboek verschijnt.' },
  'install.last_name': { fr: 'Nom de famille du premier administrateur.', nl: 'Familienaam van de eerste beheerder.' },
  'install.password': { fr: 'Mot de passe de secours, 12 caractères au moins, à garder en lieu sûr.', nl: 'Noodwachtwoord van minstens 12 tekens, veilig te bewaren.' },
  'settings.mode': { fr: 'Local : mot de passe seulement. Microsoft facultatif : les deux. Microsoft obligatoire : connexion par le compte Microsoft 365.', nl: 'Lokaal: enkel wachtwoord. Microsoft facultatief: beide. Microsoft verplicht: aanmelden met het Microsoft 365-account.' },
  'settings.tenant': { fr: "Identifiant de l'annuaire Entra ID (GUID ou domaine), visible dans la vue d'ensemble d'Entra ID.", nl: 'Id van de Entra ID-directory (GUID of domein), zichtbaar in het overzicht van Entra ID.' },
  'settings.client_id': { fr: "Identifiant de l'application (client), affiché dans l'inscription de l'application dans Entra ID.", nl: 'Toepassings-id (client), getoond in de toepassingsregistratie in Entra ID.' },
  'settings.client_secret': { fr: "Valeur du secret client créé dans l'inscription ; laissée vide, la valeur enregistrée est gardée.", nl: 'Waarde van het clientgeheim uit de registratie; leeg gelaten blijft de opgeslagen waarde behouden.' },
  'settings.public_url': { fr: "Adresse HTTPS par laquelle les agents ouvrent l'application, sans barre oblique finale.", nl: 'HTTPS-adres waarmee de medewerkers de toepassing openen, zonder schuine streep op het einde.' },
  'settings.domains': { fr: 'Domaines de messagerie acceptés à la connexion Microsoft, séparés par des virgules.', nl: 'Maildomeinen die aanvaard worden bij de Microsoft-aanmelding, gescheiden door komma’s.' },
  'users.admin_local': { fr: "Cochez pour un administrateur qui garde la connexion par mot de passe quand le mode « Microsoft obligatoire » est actif : c'est l'accès de secours si Microsoft est indisponible.", nl: 'Vink aan voor een beheerder die aanmelden met wachtwoord behoudt wanneer de modus « Microsoft verplicht » actief is: dat is de noodtoegang als Microsoft onbeschikbaar is.' },
};

export function hintText(key: string, lang: Lang): string {
  return hints[key]?.[lang] || hints[key]?.fr || '';
}
