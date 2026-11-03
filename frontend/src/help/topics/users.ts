import type { HelpTopic } from '../types';

const topic: HelpTopic = {
  id: "users", path: "/admin/utilisateurs", group: "admin", titleKey: "nav.users", roles: ["admin"],
  purpose: { fr: "Cet écran, réservé à l'administrateur, tient les comptes de l'application. Vous créez un compte, vous donnez un rôle par entité, vous désactivez un compte et vous désignez les administrateurs qui gardent un accès de secours par mot de passe.", nl: "Dit scherm, voorbehouden aan de beheerder, beheert de accounts van de toepassing. U maakt een account aan, geeft een rol per entiteit, deactiveert een account en wijst de beheerders aan die een noodtoegang met wachtwoord behouden." },
  layout: [
    { fr: "Le bouton {{common.create}}, en haut à droite, ouvre le formulaire {{users.new}}.", nl: "De knop {{common.create}} rechtsboven opent het formulier {{users.new}}." },
    { fr: "La colonne {{users.entity_roles}} donne les rôles de chaque personne ; le lien {{users.edit_roles}} les modifie.", nl: "De kolom {{users.entity_roles}} geeft de rollen van elke persoon; de link {{users.edit_roles}} wijzigt ze." },
    { fr: "La colonne {{users.admin_local}} montre, pour les administrateurs, l'interrupteur de l'accès de secours ; {{users.microsoft_linked}} apparaît après la première connexion Microsoft du compte.", nl: "De kolom {{users.admin_local}} toont voor de beheerders de schakelaar van de noodtoegang; {{users.microsoft_linked}} verschijnt na de eerste Microsoft-aanmelding van het account." },
    { fr: "L'administrateur n'accède pas au contenu du courrier : il lui faut pour cela un rôle de registre dans l'entité.", nl: "De beheerder heeft geen toegang tot de inhoud van de post: daarvoor heeft hij een registerrol in de entiteit nodig." },
  ],
  procedures: [
    {
      title: { fr: "Créer un compte", nl: "Een account aanmaken" },
      when: { fr: "Quand une personne arrive ou change de fonction et doit utiliser l'application.", nl: "Wanneer een persoon aankomt of van functie verandert en de toepassing moet gebruiken." },
      steps: [
        { fr: "Cliquez sur {{common.create}}.", nl: "Klik op {{common.create}}." },
        { fr: "Encodez {{users.field.email}}, {{users.field.first_name}} et {{users.field.last_name}} : l'adresse e-mail professionnelle de la personne.", nl: "Vul {{users.field.email}}, {{users.field.first_name}} en {{users.field.last_name}} in: het professionele e-mailadres van de persoon." },
        { fr: "Dans {{users.entity_roles}}, ajoutez un rôle pour chaque entité où la personne travaille : un rôle au plus par entité, et un rôle ne vaut que dans son entité.", nl: "Voeg in {{users.entity_roles}} een rol toe voor elke entiteit waarin de persoon werkt: hoogstens een rol per entiteit, en een rol geldt enkel in zijn entiteit." },
        { fr: "Laissez {{users.app_role}} sur {{users.role.agent}}, sauf pour un administrateur de l'application.", nl: "Laat {{users.app_role}} op {{users.role.agent}}, behalve voor een beheerder van de toepassing." },
        { fr: "Choisissez {{users.password.generated}} pour que l'application crée le mot de passe, puis cliquez sur {{common.save}}.", nl: "Kies {{users.password.generated}} opdat de toepassing het wachtwoord aanmaakt en klik op {{common.save}}." },
      ],
      result: { fr: "Le compte existe. Si le mot de passe est généré, il s'affiche une seule fois : transmettez-le à la personne par un moyen sûr avant de fermer la fenêtre.", nl: "Het account bestaat. Als het wachtwoord gegenereerd is, verschijnt het slechts een keer: bezorg het via een veilig middel aan de persoon voordat u het venster sluit." },
          },
    {
      title: { fr: "Modifier les rôles d'un compte", nl: "De rollen van een account wijzigen" },
      when: { fr: "Quand une personne change de service ou doit travailler pour l'autre entité.", nl: "Wanneer een persoon van dienst verandert of voor de andere entiteit moet werken." },
      steps: [
        { fr: "Cliquez sur {{users.edit_roles}} sur la ligne de la personne.", nl: "Klik op {{users.edit_roles}} op de rij van de persoon." },
        { fr: "Choisissez, pour chaque entité, le rôle voulu ou {{role.none}}.", nl: "Kies voor elke entiteit de gewenste rol of {{role.none}}." },
        { fr: "Cliquez sur {{common.save}}.", nl: "Klik op {{common.save}}." },
      ],
      result: { fr: "Les nouveaux rôles s'appliquent au prochain écran ouvert par la personne.", nl: "De nieuwe rollen gelden vanaf het volgende scherm dat de persoon opent." },
      errors: [
        { problem: { fr: "Un rôle à l'administration communale ne donne pas accès au CPAS.", nl: "Een rol bij het gemeentebestuur geeft geen toegang tot het OCMW." }, solution: { fr: "C'est voulu : donnez un rôle distinct dans chaque entité.", nl: "Dat is de bedoeling: geef een afzonderlijke rol in elke entiteit." } },
      ],
    },
    {
      title: { fr: "Désactiver un compte", nl: "Een account deactiveren" },
      when: { fr: "Quand une personne quitte l'institution ou ne doit plus accéder à l'application.", nl: "Wanneer een persoon de instelling verlaat of geen toegang meer tot de toepassing mag hebben." },
      steps: [
        { fr: "Cliquez sur {{users.deactivate}} sur la ligne du compte.", nl: "Klik op {{users.deactivate}} op de rij van het account." },
        { fr: "Lisez {{users.deactivate.confirm}} et confirmez.", nl: "Lees {{users.deactivate.confirm}} en bevestig." },
      ],
      result: { fr: "Le compte est désactivé et ses sessions sont fermées aussitôt. Rien n'est supprimé : le nom reste sur les courriers enregistrés.", nl: "Het account is gedeactiveerd en zijn sessies worden meteen gesloten. Niets wordt gewist: de naam blijft op de ingeschreven brieven." },
      errors: [
        { problem: { fr: "La désactivation est refusée.", nl: "De deactivering wordt geweigerd." }, solution: { fr: "Le dernier administrateur actif ne peut pas être désactivé, et en mode « Microsoft obligatoire » il doit rester un administrateur joignable.", nl: "De laatste actieve beheerder kan niet gedeactiveerd worden, en in de modus « Microsoft verplicht » moet een bereikbare beheerder overblijven." } },
      ],
    },
    {
      title: { fr: "Désigner un accès de secours", nl: "Een noodtoegang aanwijzen" },
      when: { fr: "Avant de passer la connexion en mode « Microsoft obligatoire », pour garder un moyen d'entrer si Microsoft est indisponible.", nl: "Voordat u de aanmelding op de modus « Microsoft verplicht » zet, om een manier te behouden om binnen te geraken als Microsoft onbeschikbaar is." },
      steps: [
        { fr: "Repérez, dans la colonne {{users.admin_local}}, l'interrupteur des administrateurs.", nl: "Zoek in de kolom {{users.admin_local}} de schakelaar van de beheerders." },
        { fr: "Activez-le pour au moins deux administrateurs.", nl: "Schakel hem in voor minstens twee beheerders." },
      ],
      result: { fr: "Ces administrateurs gardent la connexion par mot de passe quand le mode est « Microsoft obligatoire ». Ils l'utilisent à l'adresse de connexion suivie de ?local=1.", nl: "Deze beheerders behouden de aanmelding met wachtwoord wanneer de modus « Microsoft verplicht » is. Ze gebruiken ze op het aanmeldadres gevolgd door ?local=1." },
    },
  ],
  faq: [
    { q: { fr: "Le mot de passe généré a été perdu. Que faire ?", nl: "Het gegenereerde wachtwoord is verloren. Wat moet ik doen?" }, a: { fr: "Il ne peut pas être affiché une seconde fois et aucun écran ne permet encore de le réinitialiser. Contactez le support indiqué dans {{help.contact}}.", nl: "Het kan niet een tweede keer getoond worden en geen enkel scherm laat nog toe het opnieuw in te stellen. Neem contact op met de ondersteuning die onder {{help.contact}} staat." } },
    { q: { fr: "Pourquoi le dernier administrateur ne peut-il pas être désactivé ?", nl: "Waarom kan de laatste beheerder niet gedeactiveerd worden?" }, a: { fr: "L'application doit toujours avoir au moins un administrateur actif, sinon plus personne ne pourrait la régler.", nl: "De toepassing moet altijd minstens een actieve beheerder hebben, anders kan niemand ze nog instellen." } },
  ],
  seeAlso: ["settings", "entities"],
  shots: [],
};
export default topic;
