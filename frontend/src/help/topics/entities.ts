import type { HelpTopic } from '../types';

const topic: HelpTopic = {
  id: "entities", path: "/admin/registres", group: "admin", titleKey: "nav.entities", roles: ["admin"],
  purpose: { fr: "Cet écran, réservé à l'administrateur, tient les entités (l'administration communale et le CPAS) et leurs registres. Chaque registre a sa propre numérotation : un préfixe, un nombre de chiffres et un compteur par année.", nl: "Dit scherm, voorbehouden aan de beheerder, beheert de entiteiten (het gemeentebestuur en het OCMW) en hun registers. Elk register heeft zijn eigen nummering: een voorvoegsel, een aantal cijfers en een teller per jaar." },
  layout: [
    { fr: "Le tableau {{entity.list}} donne le code et le nom de chaque entité ; le bouton {{common.edit}} corrige les noms.", nl: "De tabel {{entity.list}} geeft de code en de naam van elke entiteit; de knop {{common.edit}} corrigeert de namen." },
    { fr: "Le tableau {{register.title}} donne, par entité, le {{register.direction}}, le {{register.prefix}}, le {{register.digits}} et un {{register.example}}.", nl: "De tabel {{register.title}} geeft per entiteit de {{register.direction}}, het {{register.prefix}}, het {{register.digits}} en een {{register.example}}." },
    { fr: "La colonne {{register.issued}} compte les numéros déjà donnés par le registre.", nl: "De kolom {{register.issued}} telt de nummers die het register al gegeven heeft." },
  ],
  procedures: [
    {
      title: { fr: "Corriger le nom d'une entité", nl: "De naam van een entiteit corrigeren" },
      when: { fr: "Quand le nom officiel change ou comporte une faute.", nl: "Wanneer de officiële naam verandert of een fout bevat." },
      steps: [
        { fr: "Cliquez sur {{common.edit}} sur la ligne de l'entité dans {{entity.list}}.", nl: "Klik op {{common.edit}} op de rij van de entiteit in {{entity.list}}." },
        { fr: "Corrigez {{common.name_fr}} et {{common.name_nl}} : les deux sont obligatoires.", nl: "Corrigeer {{common.name_fr}} en {{common.name_nl}}: beide zijn verplicht." },
        { fr: "Cliquez sur {{common.save}}.", nl: "Klik op {{common.save}}." },
      ],
      result: { fr: "Le nom s'affiche partout dans la langue de chaque personne. Le code de l'entité ne change pas.", nl: "De naam verschijnt overal in de taal van elke persoon. De code van de entiteit verandert niet." },
    },
    {
      title: { fr: "Régler le préfixe et le nombre de chiffres d'un registre", nl: "Het voorvoegsel en het aantal cijfers van een register instellen" },
      when: { fr: "Avant le premier courrier d'un registre : après cela, ces réglages ne changent plus.", nl: "Voor de eerste brief van een register: daarna kunnen deze instellingen niet meer veranderen." },
      steps: [
        { fr: "Cliquez sur {{common.edit}} sur la ligne du registre dans {{register.title}}.", nl: "Klik op {{common.edit}} op de rij van het register in {{register.title}}." },
        { fr: "Encodez le {{register.prefix}} en lettres capitales, chiffres ou tirets, par exemple AC pour l'administration communale.", nl: "Vul het {{register.prefix}} in met hoofdletters, cijfers of koppeltekens, bijvoorbeeld AC voor het gemeentebestuur." },
        { fr: "Choisissez le {{register.digits}} de 3 à 9. Lisez le {{register.example}} pour vérifier le résultat.", nl: "Kies het {{register.digits}} van 3 tot 9. Lees het {{register.example}} om het resultaat te controleren." },
        { fr: "Cliquez sur {{common.save}}.", nl: "Klik op {{common.save}}." },
      ],
      result: { fr: "Les prochains numéros suivent ce format, par exemple le préfixe, l'année, puis le compteur à six chiffres.", nl: "De volgende nummers volgen dit formaat, bijvoorbeeld het voorvoegsel, het jaar en daarna de teller met zes cijfers." },
      errors: [
        { problem: { fr: "Le préfixe et le nombre de chiffres sont grisés.", nl: "Het voorvoegsel en het aantal cijfers zijn grijs." }, solution: { fr: "{{register.locked}} Le registre a déjà donné des numéros : un changement casserait la suite.", nl: "{{register.locked}} Het register heeft al nummers gegeven: een wijziging zou de reeks breken." } },
      ],
    },
  ],
  faq: [
    { q: { fr: "Pourquoi les numéros repartent-ils de 1 chaque année ?", nl: "Waarom beginnen de nummers elk jaar opnieuw bij 1?" }, a: { fr: "Le compteur suit l'année de la date de réception : chaque année a sa suite, sans trou.", nl: "De teller volgt het jaar van de ontvangstdatum: elk jaar heeft zijn reeks, zonder gat." } },
  ],
  seeAlso: ["users", "services"],
  shots: [],
};
export default topic;
