import type { HelpTopic } from '../types';

const topic: HelpTopic = {
  id: "services", path: "/admin/services", group: "admin", titleKey: "nav.services", roles: ["admin"],
  purpose: { fr: "Cet écran, réservé à l'administrateur, tient la liste des services de l'administration communale et du CPAS. Un service peut appartenir à une entité ou être commun aux deux ; il peut dépendre d'un département.", nl: "Dit scherm, voorbehouden aan de beheerder, houdt de lijst van de diensten van het gemeentebestuur en het OCMW bij. Een dienst kan tot een entiteit behoren of gemeenschappelijk zijn voor beide; hij kan van een departement afhangen." },
  layout: [
    { fr: "Le bouton {{service.new}}, en haut à droite, ouvre le formulaire de création.", nl: "De knop {{service.new}} rechtsboven opent het aanmaakformulier." },
    { fr: "Les boutons de {{common.entity}} limitent la liste à une entité ; {{common.all}} montre tout.", nl: "De knoppen van {{common.entity}} beperken de lijst tot een entiteit; {{common.all}} toont alles." },
    { fr: "Les mentions {{common.nl.validate}} et {{common.nl.missing}} signalent un nom néerlandais à contrôler ou absent.", nl: "De vermeldingen {{common.nl.validate}} en {{common.nl.missing}} wijzen op een Nederlandse naam die gecontroleerd moet worden of ontbreekt." },
  ],
  procedures: [
    {
      title: { fr: "Ajouter un service", nl: "Een dienst toevoegen" },
      when: { fr: "Quand un service est créé dans l'organigramme et doit pouvoir recevoir du courrier.", nl: "Wanneer een dienst in het organigram wordt gecreëerd en post moet kunnen ontvangen." },
      steps: [
        { fr: "Cliquez sur {{service.new}}.", nl: "Klik op {{service.new}}." },
        { fr: "Encodez {{common.name_fr}} comme dans l'organigramme officiel, puis {{common.name_nl}}.", nl: "Vul {{common.name_fr}} in zoals in het officiële organigram en daarna {{common.name_nl}}." },
        { fr: "Dans {{service.entities}}, cochez l'entité du service, ou les deux pour un service commun.", nl: "Vink in {{service.entities}} de entiteit van de dienst aan, of beide voor een gemeenschappelijke dienst." },
        { fr: "Choisissez au besoin le {{service.parent}}, puis cliquez sur {{common.save}}.", nl: "Kies zo nodig het {{service.parent}} en klik op {{common.save}}." },
      ],
      result: { fr: "Le service apparaît dans la liste. Le courrier reste toujours dans le registre d'une seule entité, même pour un service commun.", nl: "De dienst verschijnt in de lijst. De post blijft altijd in het register van een enkele entiteit, ook voor een gemeenschappelijke dienst." },
      errors: [
        { problem: { fr: "Le bouton {{common.save}} ne fait rien.", nl: "De knop {{common.save}} doet niets." }, solution: { fr: "Le nom en français est obligatoire et au moins une entité doit être cochée.", nl: "De Franse naam is verplicht en minstens een entiteit moet aangevinkt zijn." } },
      ],
    },
    {
      title: { fr: "Faire valider un nom néerlandais", nl: "Een Nederlandse naam laten valideren" },
      when: { fr: "Quand le nom néerlandais est une proposition qu'un traducteur doit encore confirmer.", nl: "Wanneer de Nederlandse naam een voorstel is dat een vertaler nog moet bevestigen." },
      steps: [
        { fr: "Cliquez sur {{common.edit}} sur la ligne du service.", nl: "Klik op {{common.edit}} op de rij van de dienst." },
        { fr: "Cochez {{common.nl_to_validate}} tant que le nom n'est pas confirmé ; décochez-le après confirmation.", nl: "Vink {{common.nl_to_validate}} aan zolang de naam niet bevestigd is; vink hem uit na bevestiging." },
        { fr: "Cliquez sur {{common.save}}.", nl: "Klik op {{common.save}}." },
      ],
      result: { fr: "La mention {{common.nl.validate}} reste affichée tant que la case est cochée : elle sert de pense-bête.", nl: "De vermelding {{common.nl.validate}} blijft staan zolang het vakje aangevinkt is: ze dient als geheugensteun." },
    },
    {
      title: { fr: "Désactiver un service", nl: "Een dienst deactiveren" },
      when: { fr: "Quand un service est supprimé de l'organigramme.", nl: "Wanneer een dienst uit het organigram verdwijnt." },
      steps: [
        { fr: "Cliquez sur {{common.deactivate}} sur la ligne du service.", nl: "Klik op {{common.deactivate}} op de rij van de dienst." },
        { fr: "Écrivez le motif dans {{common.reason}} et confirmez.", nl: "Schrijf de reden in {{common.reason}} en bevestig." },
      ],
      result: { fr: "Le service n'est plus proposé et la ligne porte la mention {{common.inactive}}. Rien n'est supprimé.", nl: "De dienst wordt niet meer voorgesteld en de rij draagt de vermelding {{common.inactive}}. Niets wordt gewist." },
    },
  ],
  faq: [
    { q: { fr: "D'où vient la liste des services ?", nl: "Waar komt de lijst van de diensten vandaan?" }, a: { fr: "L'organigramme de Microsoft 365 fait foi, pas l'annuaire des comptes. En cas de doute, demandez-le au support en paramètre de l'application.", nl: "Het organigram van Microsoft 365 is bepalend, niet de accountmap. Bij twijfel vraagt u het aan de ondersteuning die in de parameters van de toepassing staat." } },
  ],
  seeAlso: ["entities", "users"],
  shots: [],
};
export default topic;
