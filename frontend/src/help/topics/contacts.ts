import type { HelpTopic } from '../types';

const topic: HelpTopic = {
  id: "contacts", path: "/contacts", group: "main", titleKey: "nav.contacts", roles: ["secretariat", "gestionnaire"],
  purpose: { fr: "Cet écran tient la liste des expéditeurs : personnes et organisations. Vous créez un contact avant ou pendant l'enregistrement d'un courrier, vous le corrigez et vous le désactivez quand il ne sert plus.", nl: "Dit scherm houdt de lijst van afzenders bij: personen en organisaties. U maakt een contact aan voor of tijdens de inschrijving van een brief, corrigeert het en deactiveert het wanneer het niet meer dient." },
  layout: [
    { fr: "Le bouton {{contact.new}}, en haut à droite, ouvre le formulaire de création.", nl: "De knop {{contact.new}} rechtsboven opent het aanmaakformulier." },
    { fr: "La recherche {{common.search}} cherche dans le nom, l'organisation, l'adresse e-mail et le numéro d'entreprise ; les boutons {{common.active}}, {{common.inactive}} et {{common.all}} limitent la liste.", nl: "De zoekfunctie {{common.search}} zoekt in de naam, de organisatie, het e-mailadres en het ondernemingsnummer; de knoppen {{common.active}}, {{common.inactive}} en {{common.all}} beperken de lijst." },
    { fr: "Chaque ligne a les boutons {{common.edit}} et {{common.deactivate}}.", nl: "Elke rij heeft de knoppen {{common.edit}} en {{common.deactivate}}." },
  ],
  procedures: [
    {
      title: { fr: "Créer un contact", nl: "Een contact aanmaken" },
      when: { fr: "Quand un expéditeur n'est pas encore dans la liste.", nl: "Wanneer een afzender nog niet in de lijst staat." },
      steps: [
        { fr: "Cherchez d'abord le nom dans {{common.search}} pour éviter un doublon.", nl: "Zoek eerst de naam in {{common.search}} om een dubbel te vermijden." },
        { fr: "Cliquez sur {{contact.new}} et choisissez {{contact.kind}} : {{contact.kind.personne}} ou {{contact.kind.organisation}}.", nl: "Klik op {{contact.new}} en kies {{contact.kind}}: {{contact.kind.personne}} of {{contact.kind.organisation}}." },
        { fr: "Encodez le nom et la {{contact.lang}}. Ajoutez l'adresse e-mail, le téléphone et l'adresse postale si vous les connaissez.", nl: "Vul de naam en de {{contact.lang}} in. Voeg het e-mailadres, de telefoon en het postadres toe als u ze kent." },
        { fr: "Cliquez sur {{common.save}}.", nl: "Klik op {{common.save}}." },
      ],
      result: { fr: "Le contact apparaît dans la liste et peut être choisi comme expéditeur.", nl: "Het contact verschijnt in de lijst en kan als afzender gekozen worden." },
      errors: [
        { problem: { fr: "Le bouton {{common.save}} ne fait rien.", nl: "De knop {{common.save}} doet niets." }, solution: { fr: "Le nom est obligatoire, et l'adresse e-mail doit être valable, par exemple prenom.nom@exemple.be.", nl: "De naam is verplicht en het e-mailadres moet geldig zijn, bijvoorbeeld voornaam.naam@voorbeeld.be." } },
      ],
    },
    {
      title: { fr: "Corriger un contact", nl: "Een contact corrigeren" },
      when: { fr: "Quand une adresse ou un nom est faux ou a changé.", nl: "Wanneer een adres of een naam fout is of veranderd is." },
      steps: [
        { fr: "Retrouvez le contact avec {{common.search}}.", nl: "Zoek het contact met {{common.search}}." },
        { fr: "Cliquez sur {{common.edit}} sur sa ligne, corrigez le champ, puis cliquez sur {{common.save}}.", nl: "Klik op {{common.edit}} op zijn rij, corrigeer het veld en klik op {{common.save}}." },
      ],
      result: { fr: "Le contact est corrigé. Les courriers déjà enregistrés gardent le lien vers ce contact.", nl: "Het contact is gecorrigeerd. De reeds ingeschreven brieven behouden de koppeling naar dit contact." },
    },
    {
      title: { fr: "Désactiver un contact", nl: "Een contact deactiveren" },
      when: { fr: "Quand un contact ne doit plus être proposé, par exemple une organisation dissoute ou un doublon.", nl: "Wanneer een contact niet meer voorgesteld mag worden, bijvoorbeeld een ontbonden organisatie of een dubbel." },
      steps: [
        { fr: "Cliquez sur {{common.deactivate}} sur la ligne du contact.", nl: "Klik op {{common.deactivate}} op de rij van het contact." },
        { fr: "Écrivez le motif dans {{common.reason}} et confirmez.", nl: "Schrijf de reden in {{common.reason}} en bevestig." },
      ],
      result: { fr: "Le contact n'est plus proposé pour les nouveaux courriers. Rien n'est supprimé : les courriers déjà enregistrés le gardent, et le bouton {{common.inactive}} le montre.", nl: "Het contact wordt niet meer voorgesteld voor nieuwe brieven. Niets wordt gewist: de reeds ingeschreven brieven behouden het en de knop {{common.inactive}} toont het." },
    },
  ],
  faq: [
    { q: { fr: "Les contacts de démonstration portent la mention « Fictif ». Que faire ?", nl: "De demonstratiecontacten dragen de vermelding « Fictief ». Wat moet ik doen?" }, a: { fr: "Ce sont des données d'essai. Ne les utilisez pas pour du courrier réel.", nl: "Dit zijn proefgegevens. Gebruik ze niet voor echte post." } },
  ],
  seeAlso: ["registration", "register"],
  shots: [],
};
export default topic;
