import type { HelpTopic } from '../types';

const topic: HelpTopic = {
  id: "accessibility", path: "/accessibility", group: "help", titleKey: "nav.accessibility", roles: ["agent", "chef_service", "secretariat", "gestionnaire", "auditeur", "admin"],
  purpose: { fr: "Cet écran est la déclaration d'accessibilité de l'application : le niveau visé, la façon dont il est contrôlé et où lire les limites connues.", nl: "Dit scherm is de toegankelijkheidsverklaring van de toepassing: het beoogde niveau, de manier waarop het gecontroleerd wordt en waar u de bekende beperkingen leest." },
  layout: [
    { fr: "Le texte donne le niveau visé : AA des règles d'accessibilité WCAG 2.1, contrôlé à chaque version.", nl: "De tekst geeft het beoogde niveau: AA van de toegankelijkheidsregels WCAG 2.1, bij elke versie gecontroleerd." },
    { fr: "Au clavier, le lien {{layout.skip}} apparaît en premier : il mène directement au contenu.", nl: "Met het toetsenbord verschijnt de link {{layout.skip}} als eerste: hij leidt rechtstreeks naar de inhoud." },
  ],
  procedures: [
    {
      title: { fr: "Utiliser l'application au clavier", nl: "De toepassing met het toetsenbord gebruiken" },
      when: { fr: "Quand vous n'utilisez pas la souris.", nl: "Wanneer u de muis niet gebruikt." },
      steps: [
        { fr: "Appuyez sur la touche Tab : le lien {{layout.skip}} apparaît. Appuyez sur Entrée pour aller au contenu sans passer par le menu.", nl: "Druk op de toets Tab: de link {{layout.skip}} verschijnt. Druk op Enter om naar de inhoud te gaan zonder langs het menu te gaan." },
        { fr: "Continuez avec Tab pour passer d'un champ ou d'un bouton au suivant, et Maj + Tab pour revenir en arrière.", nl: "Ga verder met Tab om van het ene veld of de ene knop naar het volgende te gaan en met Shift + Tab om terug te gaan." },
        { fr: "Ouvrez ou fermez le menu avec le bouton {{layout.menu}}, puis validez un choix avec Entrée.", nl: "Open of sluit het menu met de knop {{layout.menu}} en bevestig een keuze met Enter." },
      ],
      result: { fr: "Chaque écran se parcourt entièrement au clavier, avec un repère visible sur l'élément actif.", nl: "Elk scherm kan volledig met het toetsenbord doorlopen worden, met een zichtbaar kader op het actieve element." },
    },
    {
      title: { fr: "Signaler un défaut d'accessibilité", nl: "Een toegankelijkheidsprobleem melden" },
      when: { fr: "Quand un écran est difficile à utiliser avec votre matériel ou votre logiciel d'assistance.", nl: "Wanneer een scherm moeilijk te gebruiken is met uw materiaal of hulpsoftware." },
      steps: [
        { fr: "Ouvrez l'écran concerné et cliquez sur {{tickets.report}}.", nl: "Open het betrokken scherm en klik op {{tickets.report}}." },
        { fr: "Choisissez le type {{tickets.type.bug}}, écrivez un titre qui commence par « Accessibilité », puis décrivez votre matériel ou votre logiciel et ce qui ne marche pas.", nl: "Kies het soort {{tickets.type.bug}}, schrijf een titel die met « Toegankelijkheid » begint en beschrijf uw materiaal of software en wat niet werkt." },
        { fr: "Cliquez sur {{tickets.send}}.", nl: "Klik op {{tickets.send}}." },
      ],
      result: { fr: "L'administrateur de l'application reçoit le ticket avec l'écran concerné et peut corriger le défaut dans une prochaine version.", nl: "De beheerder van de toepassing ontvangt het ticket met het betrokken scherm en kan het probleem in een volgende versie verhelpen." },
    },
  ],
  faq: [
    { q: { fr: "Où lire les limites connues ?", nl: "Waar kan ik de bekende beperkingen lezen?" }, a: { fr: "Dans la documentation de l'application, qui décrit les limites connues. Le support indiqué dans {{help.contact}} peut vous la fournir.", nl: "In de documentatie van de toepassing, die de bekende beperkingen beschrijft. De ondersteuning die onder {{help.contact}} staat, kan ze u bezorgen." } },
  ],
  seeAlso: ["help", "tickets"],
  shots: [],
};
export default topic;
