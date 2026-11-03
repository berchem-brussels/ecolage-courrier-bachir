import type { HelpTopic } from '../types';

const topic: HelpTopic = {
  id: "home", path: "/accueil", group: "main", titleKey: "nav.home", roles: ["agent", "chef_service", "auditeur", "admin"],
  purpose: { fr: "Cet écran vous accueille quand votre rôle ne donne pas accès au registre. Il liste vos rôles dans chaque entité. Le courrier attribué à votre service s'affichera ici quand cette fonction sera disponible.", nl: "Dit scherm onthaalt u wanneer uw rol geen toegang tot het register geeft. Het toont uw rollen in elke entiteit. De post die aan uw dienst is toegewezen, verschijnt hier zodra deze functie beschikbaar is." },
  layout: [
    { fr: "La liste {{home.roles}} indique, pour chaque entité, le rôle que l'administrateur de l'application vous a donné.", nl: "De lijst {{home.roles}} toont voor elke entiteit de rol die de beheerder van de toepassing u gegeven heeft." },
    { fr: "Si la liste est vide, un message vous le dit : vous n'avez encore aucun rôle dans une entité.", nl: "Als de lijst leeg is, meldt een bericht dat u nog geen enkele rol in een entiteit hebt." },
    { fr: "Le bouton {{tickets.report}}, en haut de l'écran, ouvre le formulaire pour poser une question ou signaler un problème.", nl: "De knop {{tickets.report}} bovenaan het scherm opent het formulier om een vraag te stellen of een probleem te melden." },
  ],
  procedures: [
    {
      title: { fr: "Vérifier vos rôles", nl: "Uw rollen controleren" },
      when: { fr: "Quand vous ne retrouvez pas un menu, ou avant de demander un accès supplémentaire.", nl: "Wanneer u een menu niet terugvindt, of voordat u extra toegang vraagt." },
      steps: [
        { fr: "Ouvrez {{nav.home}} dans le menu.", nl: "Open {{nav.home}} in het menu." },
        { fr: "Lisez la liste {{home.roles}} : chaque ligne donne une entité et votre rôle dans cette entité.", nl: "Lees de lijst {{home.roles}}: elke regel geeft een entiteit en uw rol in die entiteit." },
        { fr: "Comparez avec le menu : le registre n'apparaît que pour le secrétariat et le gestionnaire du registre.", nl: "Vergelijk met het menu: het register verschijnt alleen voor het secretariaat en de registerbeheerder." },
      ],
      result: { fr: "Vous savez quels écrans votre rôle ouvre.", nl: "U weet welke schermen uw rol opent." },
      errors: [
        { problem: { fr: "La liste est vide.", nl: "De lijst is leeg." }, solution: { fr: "Demandez un rôle à l'administrateur de l'application, comme dans la procédure suivante.", nl: "Vraag een rol aan de beheerder van de toepassing, zoals in de volgende procedure." } },
      ],
    },
    {
      title: { fr: "Demander un rôle manquant", nl: "Een ontbrekende rol aanvragen" },
      when: { fr: "Quand il vous manque un accès pour faire votre travail.", nl: "Wanneer u toegang mist om uw werk te doen." },
      steps: [
        { fr: "Notez l'entité et le rôle dont vous avez besoin.", nl: "Noteer de entiteit en de rol die u nodig hebt." },
        { fr: "Cliquez sur {{tickets.report}} en haut de l'écran.", nl: "Klik bovenaan het scherm op {{tickets.report}}." },
        { fr: "Choisissez le type {{tickets.type.wish}} : l'administrateur de l'application le traite, c'est lui qui donne les rôles.", nl: "Kies het soort {{tickets.type.wish}}: de beheerder van de toepassing behandelt het, want hij geeft de rollen." },
        { fr: "Écrivez le titre, indiquez l'entité et le rôle souhaités dans {{tickets.field.description}}, puis cliquez sur {{tickets.send}}.", nl: "Schrijf de titel, vermeld de gewenste entiteit en rol in {{tickets.field.description}} en klik op {{tickets.send}}." },
      ],
      result: { fr: "Un message vert annonce la référence du ticket. Vous suivez la réponse dans {{nav.tickets}}.", nl: "Een groen bericht meldt de referentie van het ticket. U volgt het antwoord in {{nav.tickets}}." },
    },
  ],
  faq: [
    { q: { fr: "Pourquoi n'ai-je pas accès au registre ?", nl: "Waarom heb ik geen toegang tot het register?" }, a: { fr: "Le registre est réservé au secrétariat et au gestionnaire du registre d'une entité. Un autre rôle n'ouvre pas le registre.", nl: "Het register is voorbehouden aan het secretariaat en de registerbeheerder van een entiteit. Een andere rol opent het register niet." } },
    { q: { fr: "Un rôle à l'administration communale me donne-t-il accès au CPAS ?", nl: "Geeft een rol bij het gemeentebestuur mij toegang tot het OCMW?" }, a: { fr: "Non. Un rôle ne vaut que pour l'entité où il est donné. Chaque entité a son propre registre.", nl: "Nee. Een rol geldt enkel voor de entiteit waarin hij gegeven is. Elke entiteit heeft haar eigen register." } },
  ],
  seeAlso: ["tickets", "help"],
  shots: [],
};
export default topic;
