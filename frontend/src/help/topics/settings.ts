import type { HelpTopic } from '../types';

const topic: HelpTopic = {
  id: "settings", path: "/admin/parametres", group: "admin", titleKey: "nav.settings", roles: ["admin"],
  purpose: { fr: "Cet écran, réservé à l'administrateur, règle l'application sans livraison : la taille des fichiers déposés, les files et les délais des tickets, et la connexion. Chaque changement s'inscrit au journal de l'application.", nl: "Dit scherm, voorbehouden aan de beheerder, stelt de toepassing in zonder nieuwe versie: de grootte van de geplaatste bestanden, de wachtrijen en termijnen van de tickets en de aanmelding. Elke wijziging wordt in het logboek van de toepassing genoteerd." },
  layout: [
    { fr: "La carte {{settings.pieces}} règle la taille maximale d'un fichier déposé et celle d'un fichier lu par un assistant.", nl: "De kaart {{settings.pieces}} stelt de maximale grootte van een geplaatst bestand en van een door een assistent gelezen bestand in." },
    { fr: "La carte {{settings.tickets}} règle les rôles de chaque file, les délais par priorité et le délai de réouverture.", nl: "De kaart {{settings.tickets}} stelt de rollen van elke wachtrij, de termijnen per prioriteit en de heropeningstermijn in." },
    { fr: "La carte {{settings.auth}} règle le mode de connexion et l'inscription de l'application chez Microsoft.", nl: "De kaart {{settings.auth}} stelt de aanmeldmodus en de registratie van de toepassing bij Microsoft in." },
  ],
  procedures: [
    {
      title: { fr: "Régler la taille des fichiers", nl: "De grootte van de bestanden instellen" },
      when: { fr: "Quand des scans sont refusés parce qu'ils sont trop volumineux.", nl: "Wanneer scans geweigerd worden omdat ze te groot zijn." },
      steps: [
        { fr: "Dans la carte {{settings.pieces}}, modifiez {{settings.max_mb}} : de 1 à 50 mégaoctets.", nl: "Wijzig in de kaart {{settings.pieces}} {{settings.max_mb}}: van 1 tot 50 megabyte." },
        { fr: "Cliquez sur {{common.save}}.", nl: "Klik op {{common.save}}." },
      ],
      result: { fr: "Le nouveau plafond s'applique tout de suite, sans nouvelle version. Le cadre de dépôt l'affiche.", nl: "De nieuwe limiet geldt meteen, zonder nieuwe versie. Het plaatsingskader toont hem." },
      errors: [
        { problem: { fr: "La valeur est refusée.", nl: "De waarde wordt geweigerd." }, solution: { fr: "50 mégaoctets est le plafond technique du serveur web : choisissez une valeur entre 1 et 50.", nl: "50 megabyte is het technische maximum van de webserver: kies een waarde tussen 1 en 50." } },
      ],
    },
    {
      title: { fr: "Régler les files et les délais des tickets", nl: "De wachtrijen en termijnen van de tickets instellen" },
      when: { fr: "Quand l'équipe qui traite les questions change, ou que les délais de prise en charge doivent évoluer.", nl: "Wanneer het team dat de vragen behandelt verandert, of de termijnen voor de behandeling moeten evolueren." },
      steps: [
        { fr: "Dans la carte {{settings.tickets}}, cochez les rôles de {{settings.tickets.business_roles}} : par défaut le gestionnaire du registre, qui traite dans son entité.", nl: "Vink in de kaart {{settings.tickets}} de rollen van {{settings.tickets.business_roles}} aan: standaard de registerbeheerder, die in zijn entiteit behandelt." },
        { fr: "Cochez les rôles de {{settings.tickets.it_roles}} : par défaut l'administrateur.", nl: "Vink de rollen van {{settings.tickets.it_roles}} aan: standaard de beheerder." },
        { fr: "Encodez les heures de prise en charge et de résolution de chaque priorité, puis le délai de réouverture.", nl: "Vul de uren voor de behandeling en de oplossing van elke prioriteit in en daarna de heropeningstermijn." },
        { fr: "Cliquez sur {{common.save}} sous la carte.", nl: "Klik op {{common.save}} onder de kaart." },
      ],
      result: { fr: "Les nouveaux rôles et délais valent pour les tickets existants et nouveaux. L'ancienne et la nouvelle valeur sont inscrites au journal.", nl: "De nieuwe rollen en termijnen gelden voor bestaande en nieuwe tickets. De oude en de nieuwe waarde worden in het logboek genoteerd." },
      errors: [
        { problem: { fr: "Aucun rôle n'est coché pour une file.", nl: "Voor een wachtrij is geen enkele rol aangevinkt." }, solution: { fr: "Chaque file doit garder au moins un rôle, sinon personne ne traiterait ses tickets : cochez-en un.", nl: "Elke wachtrij moet minstens een rol behouden, anders zou niemand haar tickets behandelen: vink er een aan." } },
      ],
    },
    {
      title: { fr: "Préparer la connexion Microsoft", nl: "De Microsoft-aanmelding voorbereiden" },
      when: { fr: "Quand le service informatique a créé l'inscription de l'application chez Microsoft et vous a donné l'annuaire, l'identifiant et le secret.", nl: "Wanneer de informaticadienst de registratie van de toepassing bij Microsoft heeft aangemaakt en u de directory, de id en het geheim heeft gegeven." },
      steps: [
        { fr: "Dans la carte {{settings.auth}}, encodez {{settings.tenant}}, {{settings.client_id}} et {{settings.client_secret}}.", nl: "Vul in de kaart {{settings.auth}} {{settings.tenant}}, {{settings.client_id}} en {{settings.client_secret}} in." },
        { fr: "Encodez {{settings.public_url}} : l'adresse que les agents tapent, en https. Copiez l'adresse de retour affichée sous les champs dans l'inscription chez Microsoft.", nl: "Vul {{settings.public_url}} in: het adres dat de medewerkers typen, in https. Kopieer het terugkeeradres dat onder de velden staat in de registratie bij Microsoft." },
        { fr: "Indiquez les {{settings.domains}} des adresses e-mail acceptées. Cliquez sur {{common.save}} puis sur {{settings.test}}.", nl: "Geef de {{settings.domains}} van de aanvaarde e-mailadressen op. Klik op {{common.save}} en daarna op {{settings.test}}." },
        { fr: "Choisissez {{settings.mode.sso_optional}} d'abord : agents et administrateurs gardent aussi le mot de passe. Passez à {{settings.mode.sso}} seulement après une connexion Microsoft réussie.", nl: "Kies eerst {{settings.mode.sso_optional}}: medewerkers en beheerders behouden ook het wachtwoord. Ga pas naar {{settings.mode.sso}} na een geslaagde Microsoft-aanmelding." },
      ],
      result: { fr: "Le message de test confirme que l'annuaire répond chez Microsoft. Il ne vérifie ni l'identifiant ni le secret : la première connexion les vérifie.", nl: "Het testbericht bevestigt dat de directory bij Microsoft antwoordt. Het controleert noch de id noch het geheim: de eerste aanmelding controleert ze." },
      errors: [
        { problem: { fr: "Le mode {{settings.mode.sso}} est refusé.", nl: "De modus {{settings.mode.sso}} wordt geweigerd." }, solution: { fr: "Aucun administrateur actif ne pourrait plus se connecter. Activez l'accès de secours d'au moins un administrateur dans {{nav.users}}.", nl: "Geen enkele actieve beheerder zou zich nog kunnen aanmelden. Schakel de noodtoegang van minstens een beheerder in bij {{nav.users}}." } },
        { problem: { fr: "Le secret n'apparaît plus après l'enregistrement.", nl: "Het geheim verschijnt niet meer na het opslaan." }, solution: { fr: "C'est voulu : le secret est chiffré et jamais réaffiché. Laissez le champ vide pour le garder, ou encodez-en un nouveau pour le remplacer.", nl: "Dat is de bedoeling: het geheim is versleuteld en wordt nooit opnieuw getoond. Laat het veld leeg om het te behouden of vul een nieuw in om het te vervangen." } },
      ],
    },
  ],
  faq: [
    { q: { fr: "Où donner le secret de l'inscription ?", nl: "Waar geef ik het geheim van de registratie op?" }, a: { fr: "Uniquement dans cet écran. Ne l'écrivez jamais dans un message, un ticket ou un fichier.", nl: "Enkel in dit scherm. Schrijf het nooit in een bericht, een ticket of een bestand." } },
  ],
  seeAlso: ["users", "tickets"],
  shots: [],
};
export default topic;
