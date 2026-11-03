import type { HelpTopic } from '../types';

const topic: HelpTopic = {
  id: "consultations", path: "/consultations", group: "main", titleKey: "nav.consultations", roles: ["auditeur"],
  purpose: { fr: "Cet écran est le journal des consultations, réservé à l'auditeur d'une entité. Il montre qui a ouvert la fiche d'un courrier ou lu un fichier, avec la date et l'heure. Il ne montre jamais le contenu des courriers.", nl: "Dit scherm is het raadplegingslogboek, voorbehouden aan de auditor van een entiteit. Het toont wie de fiche van een brief geopend of een bestand gelezen heeft, met datum en uur. Het toont nooit de inhoud van de brieven." },
  layout: [
    { fr: "Les filtres {{consult.number}} et {{consult.period}} limitent le journal.", nl: "De filters {{consult.number}} en {{consult.period}} beperken het logboek." },
    { fr: "Le tableau donne {{consult.when}}, {{consult.who}}, {{consult.what}}, le numéro du courrier et le {{consult.channel}} utilisé.", nl: "De tabel geeft {{consult.when}}, {{consult.who}}, {{consult.what}}, het nummer van de brief en het gebruikte {{consult.channel}}." },
  ],
  procedures: [
    {
      title: { fr: "Retrouver qui a ouvert un courrier", nl: "Nagaan wie een brief geopend heeft" },
      when: { fr: "Quand vous devez vérifier les consultations d'un courrier précis.", nl: "Wanneer u de raadplegingen van een bepaalde brief moet nagaan." },
      steps: [
        { fr: "Ouvrez {{nav.consultations}} dans le menu.", nl: "Open {{nav.consultations}} in het menu." },
        { fr: "Tapez le numéro du courrier dans {{consult.number}}.", nl: "Typ het nummer van de brief in {{consult.number}}." },
        { fr: "Lisez les lignes : chaque ligne donne la personne, l'action, la date et l'heure.", nl: "Lees de rijen: elke rij geeft de persoon, de handeling, de datum en het uur." },
      ],
      result: { fr: "Le journal ne montre que les consultations de ce courrier.", nl: "Het logboek toont enkel de raadplegingen van deze brief." },
      errors: [
        { problem: { fr: "Aucune ligne ne s'affiche.", nl: "Er verschijnt geen enkele rij." }, solution: { fr: "Vérifiez le numéro, ou élargissez la {{consult.period}} : le courrier n'a peut-être pas été consulté.", nl: "Controleer het nummer of verruim de {{consult.period}}: de brief is misschien niet geraadpleegd." } },
      ],
    },
    {
      title: { fr: "Relire les consultations d'une période", nl: "De raadplegingen van een periode herlezen" },
      when: { fr: "Quand vous contrôlez l'activité du registre sur une période, par exemple un mois.", nl: "Wanneer u de activiteit van het register over een periode nagaat, bijvoorbeeld een maand." },
      steps: [
        { fr: "Choisissez les dates de début et de fin dans {{consult.period}}.", nl: "Kies de begin- en einddatum in {{consult.period}}." },
        { fr: "Parcourez la liste, de la plus récente à la plus ancienne, et changez de page si nécessaire.", nl: "Overloop de lijst, van de nieuwste naar de oudste, en wissel indien nodig van pagina." },
      ],
      result: { fr: "Vous voyez toutes les ouvertures de fiche et lectures de fichier de la période, pour les registres où vous avez le rôle d'auditeur.", nl: "U ziet alle openingen van fiches en lezingen van bestanden van de periode, voor de registers waarin u de rol van auditor hebt." },
    },
  ],
  faq: [
    { q: { fr: "Le journal montre-t-il le contenu des courriers ?", nl: "Toont het logboek de inhoud van de brieven?" }, a: { fr: "Non. Il montre seulement qui a consulté quoi, quand et par quel canal. L'auditeur ne lit pas les courriers.", nl: "Nee. Het toont enkel wie wat wanneer en via welk kanaal geraadpleegd heeft. De auditor leest de brieven niet." } },
  ],
  seeAlso: ["register"],
  shots: [],
};
export default topic;
