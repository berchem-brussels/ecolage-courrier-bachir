import type { HelpTopic } from '../types';

const topic: HelpTopic = {
  id: "help", path: "/help", group: "help", titleKey: "nav.help", roles: ["agent", "chef_service", "secretariat", "gestionnaire", "auditeur", "admin"],
  purpose: { fr: "Ce centre d'aide rassemble le mode d'emploi de tous les écrans. Choisissez le parcours de votre rôle pour lire seulement les fiches utiles, cherchez un mot dans toutes les fiches, ou imprimez le mode d'emploi complet.", nl: "Dit helpcentrum verzamelt de handleiding van alle schermen. Kies het traject van uw rol om enkel de nuttige fiches te lezen, zoek een woord in alle fiches of druk de volledige handleiding af." },
  layout: [
    { fr: "Le choix {{help.path}} propose un parcours par rôle ; {{help.path.all}} montre toutes les fiches.", nl: "De keuze {{help.path}} biedt een traject per rol; {{help.path.all}} toont alle fiches." },
    { fr: "La recherche {{common.search}} garde les fiches qui contiennent le mot cherché.", nl: "De zoekfunctie {{common.search}} behoudt de fiches die het gezochte woord bevatten." },
    { fr: "Le bouton {{help.print}} ouvre le mode d'emploi complet dans un nouvel onglet, prêt à imprimer.", nl: "De knop {{help.print}} opent de volledige handleiding in een nieuw tabblad, klaar om af te drukken." },
    { fr: "En bas, {{help.contact}} donne la personne ou le service à joindre.", nl: "Onderaan geeft {{help.contact}} de persoon of dienst die u kunt bereiken." },
  ],
  procedures: [
    {
      title: { fr: "Lire le parcours de votre rôle", nl: "Het traject van uw rol lezen" },
      when: { fr: "Quand vous découvrez l'application ou un nouveau rôle.", nl: "Wanneer u de toepassing of een nieuwe rol ontdekt." },
      steps: [
        { fr: "Ouvrez {{nav.help}} dans le menu.", nl: "Open {{nav.help}} in het menu." },
        { fr: "Dans {{help.path}}, choisissez votre rôle : les fiches utiles s'affichent dans l'ordre où vous vous en servez.", nl: "Kies in {{help.path}} uw rol: de nuttige fiches verschijnen in de volgorde waarin u ze gebruikt." },
        { fr: "Cliquez sur le titre d'une procédure pour la déplier.", nl: "Klik op de titel van een procedure om ze uit te klappen." },
      ],
      result: { fr: "Vous lisez les procédures de votre rôle, étape par étape.", nl: "U leest de procedures van uw rol, stap voor stap." },
    },
    {
      title: { fr: "Chercher dans le mode d'emploi", nl: "In de handleiding zoeken" },
      when: { fr: "Quand vous cherchez comment faire une action précise.", nl: "Wanneer u zoekt hoe u een bepaalde handeling uitvoert." },
      steps: [
        { fr: "Choisissez {{help.path.all}} dans {{help.path}}.", nl: "Kies {{help.path.all}} in {{help.path}}." },
        { fr: "Tapez un mot dans {{common.search}}, par exemple le nom d'un bouton.", nl: "Typ een woord in {{common.search}}, bijvoorbeeld de naam van een knop." },
      ],
      result: { fr: "Seules les fiches qui contiennent ce mot restent affichées.", nl: "Enkel de fiches die dit woord bevatten blijven getoond." },
      errors: [
        { problem: { fr: "Rien ne s'affiche.", nl: "Er verschijnt niets." }, solution: { fr: "Essayez un mot plus court ou un autre mot. Vous pouvez aussi poser la question avec {{tickets.report}}.", nl: "Probeer een korter woord of een ander woord. U kunt de vraag ook stellen met {{tickets.report}}." } },
      ],
    },
    {
      title: { fr: "Imprimer le mode d'emploi", nl: "De handleiding afdrukken" },
      when: { fr: "Quand vous voulez un exemplaire papier, par exemple pour une formation.", nl: "Wanneer u een papieren exemplaar wilt, bijvoorbeeld voor een opleiding." },
      steps: [
        { fr: "Cliquez sur {{help.print}}.", nl: "Klik op {{help.print}}." },
        { fr: "Dans le nouvel onglet, la fenêtre d'impression de votre navigateur s'ouvre : choisissez l'imprimante ou l'enregistrement en PDF.", nl: "In het nieuwe tabblad opent het afdrukvenster van uw browser: kies de printer of opslaan als pdf." },
      ],
      result: { fr: "Toutes les fiches, procédures dépliées, sortent dans la langue de l'interface.", nl: "Alle fiches, met uitgeklapte procedures, worden afgedrukt in de taal van de interface." },
    },
  ],
  faq: [
    { q: { fr: "Une procédure ne correspond pas à ce que je vois. Que faire ?", nl: "Een procedure komt niet overeen met wat ik zie. Wat moet ik doen?" }, a: { fr: "Signalez-le avec {{tickets.report}} en indiquant la fiche concernée : le mode d'emploi doit toujours décrire l'écran réel.", nl: "Meld het met {{tickets.report}} en vermeld de betrokken fiche: de handleiding moet altijd het echte scherm beschrijven." } },
  ],
  seeAlso: ["tickets", "accessibility"],
  shots: [],
};
export default topic;
