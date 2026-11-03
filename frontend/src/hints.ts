/**
 * Explication de chaque champ à encoder, FR et NL (standard v3.3, section 13.1) : ce qu'il faut encoder et d'où vient la valeur.
 * Clé « Écran.champ ». Versions 0.2.5 et 0.2.6 : champs de la connexion et des tickets ; les autres formulaires suivent en 0.2.7 avec le contrôle bloquant.
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
  'tickets.type': { fr: "Incident : quelque chose ne marche pas. Bug : erreur de l'application. Question : comment faire. Souhait : une amélioration.", nl: 'Incident: iets werkt niet. Bug: fout in de toepassing. Vraag: hoe iets moet. Wens: een verbetering.' },
  'tickets.title': { fr: 'Résumé en une ligne de ce qui se passe ou de ce que vous demandez.', nl: 'Samenvatting in één regel van wat er gebeurt of wat u vraagt.' },
  'tickets.description': { fr: 'Ce que vous faisiez au moment du problème ou le contexte de votre question.', nl: 'Wat u aan het doen was op het moment van het probleem of de context van uw vraag.' },
  'tickets.expected': { fr: 'Ce que l’application aurait dû faire selon vous.', nl: 'Wat de toepassing volgens u had moeten doen.' },
  'tickets.actual': { fr: 'Ce que l’application a fait réellement, message d’erreur compris.', nl: 'Wat de toepassing werkelijk deed, foutmelding inbegrepen.' },
  'tickets.impact': { fr: 'Combien de personnes sont gênées : vous seul, votre service ou toute l’institution.', nl: 'Hoeveel mensen hinder ondervinden: alleen u, uw dienst of de hele instelling.' },
  'tickets.urgency': { fr: 'Bloquant : impossible de travailler. Gênant : on contourne. Confort : amélioration sans urgence.', nl: 'Blokkerend: werken is onmogelijk. Hinderlijk: er is een omweg. Comfort: verbetering zonder haast.' },
  'tickets.message': { fr: 'Votre réponse ou votre précision, visible par le demandeur sauf note interne.', nl: 'Uw antwoord of verduidelijking, zichtbaar voor de aanvrager behalve bij een interne nota.' },
  'tickets.internal': { fr: 'Cochez pour une note réservée aux traitants, invisible du demandeur.', nl: 'Vink aan voor een nota enkel voor de behandelaars, onzichtbaar voor de aanvrager.' },
  'tickets.reason': { fr: 'Motif de l’action, gardé dans le fil du ticket.', nl: 'Reden van de actie, bewaard in de berichten van het ticket.' },
  'tickets.screenshot': { fr: "Capture d'écran PNG ou JPEG de 2 Mo au plus, sans courrier ni donnée personnelle ; elle n'est pas proposée sur les écrans qui affichent du courrier.", nl: 'Schermafbeelding PNG of JPEG van maximaal 2 MB, zonder post of persoonsgegevens; ze wordt niet aangeboden op schermen die post tonen.' },
  'tickets.entity': { fr: "Entité dans laquelle vous travaillez : ses gestionnaires du registre traitent votre question. Vous ne la choisissez que si vous avez des rôles dans les deux entités.", nl: 'Entiteit waarin u werkt: haar registerbeheerders behandelen uw vraag. U kiest enkel als u rollen in beide entiteiten hebt.' },
  'settings.tickets.sla': { fr: "Heures écoulées depuis le signalement avant la prise en charge, puis avant la résolution ; au-delà, le ticket est signalé en retard.", nl: 'Uren sinds de melding vóór de behandeling en vóór de oplossing; daarna wordt het ticket als te laat aangeduid.' },
  'settings.tickets.reopen': { fr: "Nombre de jours pendant lesquels le demandeur peut rouvrir un ticket résolu, avec un motif.", nl: 'Aantal dagen waarin de aanvrager een opgelost ticket met een reden kan heropenen.' },
  'settings.tickets.business_roles': { fr: "Rôles qui traitent les questions métier, dans l'entité du ticket. Par défaut : gestionnaire du registre.", nl: 'Rollen die de functionele vragen behandelen, in de entiteit van het ticket. Standaard: registerbeheerder.' },
  'settings.tickets.it_roles': { fr: "Rôles qui traitent les incidents, bugs et souhaits. Par défaut : administrateur de l'application.", nl: 'Rollen die incidenten, bugs en wensen behandelen. Standaard: beheerder van de toepassing.' },
};

export function hintText(key: string, lang: Lang): string {
  return hints[key]?.[lang] || hints[key]?.fr || '';
}
