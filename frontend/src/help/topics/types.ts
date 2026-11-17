import type { HelpTopic } from '../types';

const topic: HelpTopic = {
  id: "types", path: "/admin/types", group: "admin", titleKey: "nav.types", roles: ["gestionnaire", "admin"],
  purpose: { fr: "Cet écran tient la liste des types de courrier d'une entité : demande d'un citoyen, plainte, candidature spontanée et autres. Le gestionnaire du registre et l'administrateur l'adaptent sans livraison de l'application.", nl: "Dit scherm houdt de lijst van de soorten brieven van een entiteit bij: aanvraag van een burger, klacht, spontane sollicitatie en andere. De registerbeheerder en de beheerder passen ze aan zonder nieuwe versie van de toepassing." },
  layout: [
    { fr: "[[1]] Le bouton {{type.new}}, en haut à droite, ouvre le formulaire de création.", nl: "[[1]] De knop {{type.new}} rechtsboven opent het aanmaakformulier." },
    { fr: "Si vous avez un rôle dans les deux entités, des boutons choisissent l'entité dont vous tenez les types.", nl: "Als u een rol in beide entiteiten hebt, kiezen knoppen van welke entiteit u de soorten beheert." },
    { fr: "[[2]] La liste donne le libellé en français et en néerlandais, le statut ({{common.active}} ou {{common.inactive}}) et les boutons {{common.edit}} et {{common.deactivate}}.", nl: "[[2]] De lijst geeft het label in het Frans en in het Nederlands, de status ({{common.active}} of {{common.inactive}}) en de knoppen {{common.edit}} en {{common.deactivate}}." },
  ],
  overviewShot: "types-overview",
  procedures: [
    {
      title: { fr: "Ajouter un type de courrier", nl: "Een soort brief toevoegen" },
      when: { fr: "Quand un courrier revient souvent et qu'aucun type existant ne le décrit.", nl: "Wanneer een soort brief vaak terugkomt en geen bestaand soort hem beschrijft." },
      steps: [
        { fr: "Cliquez sur {{type.new}}.", nl: "Klik op {{type.new}}." },
        { fr: "Encodez {{type.label_fr}} : un nom court, au singulier, que tout le secrétariat comprend.", nl: "Vul {{type.label_fr}} in: een korte naam in het enkelvoud die het hele secretariaat begrijpt." },
        { fr: "Encodez {{type.label_nl}}. Si vous n'êtes pas sûr de la traduction, cochez {{common.nl_to_validate}}.", nl: "Vul {{type.label_nl}} in. Als u niet zeker bent van de vertaling, vink {{common.nl_to_validate}} aan." },
        { fr: "Cliquez sur {{common.save}}.", nl: "Klik op {{common.save}}." },
      ],
      result: { fr: "Le type est proposé dans le formulaire d'enregistrement de cette entité.", nl: "Het soort wordt voorgesteld in het inschrijvingsformulier van deze entiteit." },
      errors: [
        { problem: { fr: "Le bouton {{common.save}} ne fait rien.", nl: "De knop {{common.save}} doet niets." }, solution: { fr: "Le libellé en français est obligatoire.", nl: "Het Franse label is verplicht." } },
      ],
    },
    {
      title: { fr: "Corriger ou désactiver un type", nl: "Een soort corrigeren of deactiveren" },
      when: { fr: "Quand un libellé est faux ou qu'un type ne doit plus être utilisé.", nl: "Wanneer een label fout is of een soort niet meer gebruikt mag worden." },
      steps: [
        { fr: "Pour corriger, cliquez sur {{common.edit}} sur la ligne du type, modifiez le libellé et cliquez sur {{common.save}}.", nl: "Om te corrigeren, klikt u op {{common.edit}} op de rij van het soort, wijzigt u het label en klikt u op {{common.save}}." },
        { fr: "Pour retirer le type des choix, cliquez sur {{common.deactivate}}, écrivez le motif dans {{common.reason}} et confirmez.", nl: "Om het soort uit de keuzes te halen, klikt u op {{common.deactivate}}, schrijft u de reden in {{common.reason}} en bevestigt u." },
      ],
      result: { fr: "Un type désactivé n'est plus proposé pour les nouveaux courriers, mais les courriers déjà enregistrés le gardent : rien n'est supprimé.", nl: "Een gedeactiveerd soort wordt niet meer voorgesteld voor nieuwe brieven, maar de reeds ingeschreven brieven behouden het: niets wordt gewist." },
    },
    {
      title: { fr: "Gérer les motifs de clôture", nl: "De redenen van afsluiting beheren" },
      when: { fr: "Quand vous voulez ajouter, corriger ou retirer un motif proposé aux agents qui closent un courrier de l'entité.", nl: "Wanneer u een reden die aan de bedienden wordt voorgesteld bij het afsluiten van een brief van de entiteit, wilt toevoegen, verbeteren of weghalen." },
      steps: [
        { fr: "Ouvrez {{nav.types}} dans le menu. Sous la liste des types, le cadre {{closereason.title}} montre les motifs de l'entité choisie.", nl: "Open {{nav.types}} in het menu. Onder de lijst van soorten toont het kader {{closereason.title}} de redenen van de gekozen entiteit." },
        { fr: "Pour en ajouter un, cliquez sur {{closereason.new}}, écrivez le {{closereason.label_fr}} et, si vous l'avez, le {{closereason.label_nl}}, puis cliquez sur {{common.save}}.", nl: "Om er een toe te voegen, klikt u op {{closereason.new}}, schrijft u het {{closereason.label_fr}} en, indien u het hebt, het {{closereason.label_nl}} en klikt u daarna op {{common.save}}." },
        { fr: "Pour en retirer un, cliquez sur {{common.deactivate}} sur sa ligne, écrivez le motif dans {{common.reason}} et confirmez.", nl: "Om er een weg te halen, klikt u op {{common.deactivate}} op zijn rij, schrijft u de reden in {{common.reason}} en bevestigt u." },
      ],
      result: { fr: "Le nouveau motif est proposé à la prochaine clôture. Un motif désactivé n'est plus proposé, mais les courriers déjà clos avec ce motif le gardent : rien n'est supprimé.", nl: "De nieuwe reden wordt bij de volgende afsluiting voorgesteld. Een gedeactiveerde reden wordt niet meer voorgesteld, maar reeds afgesloten brieven behouden ze: niets wordt gewist." },
    },
  ],
  faq: [
    { q: { fr: "Pourquoi ne puis-je pas enregistrer de courrier ?", nl: "Waarom kan ik geen brief inschrijven?" }, a: { fr: "Si aucun type n'est défini pour l'entité, le formulaire d'enregistrement l'indique. Créez au moins un type ici.", nl: "Als voor de entiteit geen soort gedefinieerd is, meldt het inschrijvingsformulier dat. Maak hier minstens een soort aan." } },
  ],
  seeAlso: ["registration", "settings"],
  shots: [
    { id: "types-overview", path: "/admin/types", marks: [{ sel: ".page-header button" }, { sel: ".ant-table" }], caption: { fr: "Types de courrier", nl: "Soorten brieven" } },
  ],
};
export default topic;
