import type { HelpTopic } from '../types';

const topic: HelpTopic = {
  id: "tickets", path: "/tickets", group: "help", titleKey: "nav.tickets", roles: ["agent", "chef_service", "secretariat", "gestionnaire", "auditeur", "admin"],
  purpose: { fr: "Cet écran liste vos tickets : les questions et les problèmes que vous avez signalés. Une personne qui traite une file y voit aussi les tickets de sa file, avec des compteurs de suivi.", nl: "Dit scherm toont uw tickets: de vragen en problemen die u gemeld hebt. Een persoon die een wachtrij behandelt, ziet er ook de tickets van zijn wachtrij, met opvolgingstellers." },
  layout: [
    { fr: "Le bouton {{tickets.report}}, présent en haut de chaque écran, ouvre le formulaire de signalement.", nl: "De knop {{tickets.report}}, bovenaan elk scherm aanwezig, opent het meldformulier." },
    { fr: "Les compteurs {{tickets.stats.open}}, {{tickets.stats.overdue}}, {{tickets.stats.unassigned}} et {{tickets.stats.resolved}} ne s'affichent que pour une personne qui traite une file.", nl: "De tellers {{tickets.stats.open}}, {{tickets.stats.overdue}}, {{tickets.stats.unassigned}} en {{tickets.stats.resolved}} verschijnen enkel voor een persoon die een wachtrij behandelt." },
    { fr: "La liste donne la référence, le titre, le type, l'entité, la priorité et le statut. Un clic sur une ligne ouvre le ticket.", nl: "De lijst geeft de referentie, de titel, het soort, de entiteit, de prioriteit en de status. Een klik op een rij opent het ticket." },
  ],
  procedures: [
    {
      title: { fr: "Signaler un problème ou poser une question", nl: "Een probleem melden of een vraag stellen" },
      when: { fr: "Quand quelque chose ne marche pas, quand vous ne savez pas comment faire, ou quand vous voulez proposer une amélioration.", nl: "Wanneer iets niet werkt, wanneer u niet weet hoe het moet, of wanneer u een verbetering wilt voorstellen." },
      steps: [
        { fr: "Ouvrez l'écran où le problème se produit, puis cliquez sur {{tickets.report}} : l'écran est joint automatiquement.", nl: "Open het scherm waar het probleem zich voordoet en klik dan op {{tickets.report}}: het scherm wordt automatisch toegevoegd." },
        { fr: "Choisissez le type : {{tickets.type.incident}} si quelque chose ne marche pas, {{tickets.type.bug}} pour une erreur de l'application, {{tickets.type.question}} pour savoir comment faire, {{tickets.type.wish}} pour proposer une amélioration.", nl: "Kies het soort: {{tickets.type.incident}} als iets niet werkt, {{tickets.type.bug}} voor een fout van de toepassing, {{tickets.type.question}} om te weten hoe het moet, {{tickets.type.wish}} om een verbetering voor te stellen." },
        { fr: "Écrivez un titre court. Pour un incident ou un bug, dites ce que vous faisiez, ce que vous attendiez et ce qui s'est passé.", nl: "Schrijf een korte titel. Vermeld bij een incident of een bug wat u deed, wat u verwachtte en wat er gebeurde." },
        { fr: "Dites qui est touché et la gravité, puis cliquez sur {{tickets.send}}.", nl: "Zeg wie getroffen is en hoe ernstig het is en klik op {{tickets.send}}." },
      ],
      result: { fr: "Un message vert annonce la référence du ticket. Une question sur le courrier est traitée par les gestionnaires du registre de votre entité ; le reste, par l'administrateur de l'application.", nl: "Een groen bericht meldt de referentie van het ticket. Een vraag over de post wordt behandeld door de registerbeheerders van uw entiteit; de rest door de beheerder van de toepassing." },
      errors: [
        { problem: { fr: "Le champ de capture n'existe pas.", nl: "Het veld voor een schermafbeelding bestaat niet." }, solution: { fr: "Sur les écrans qui affichent du courrier, aucune capture n'est proposée, pour protéger les données personnelles : décrivez le problème par écrit.", nl: "Op schermen die post tonen wordt geen schermafbeelding aangeboden, om de persoonsgegevens te beschermen: beschrijf het probleem schriftelijk." } },
        { problem: { fr: "Une capture est refusée.", nl: "Een schermafbeelding wordt geweigerd." }, solution: { fr: "Elle doit être une image PNG ou JPEG de 2 mégaoctets au plus.", nl: "Ze moet een png- of jpeg-afbeelding van hoogstens 2 megabyte zijn." } },
      ],
    },
    {
      title: { fr: "Suivre un ticket et répondre", nl: "Een ticket opvolgen en antwoorden" },
      when: { fr: "Quand vous attendez une réponse ou qu'on vous demande une précision.", nl: "Wanneer u op een antwoord wacht of men u om verduidelijking vraagt." },
      steps: [
        { fr: "Ouvrez {{nav.tickets}} et cliquez sur la ligne du ticket.", nl: "Open {{nav.tickets}} en klik op de rij van het ticket." },
        { fr: "Lisez l'historique : le statut et les messages du traitant s'y trouvent.", nl: "Lees de geschiedenis: de status en de berichten van de behandelaar staan er." },
        { fr: "Écrivez votre réponse dans {{tickets.message}} et cliquez sur {{tickets.post}}.", nl: "Schrijf uw antwoord in {{tickets.message}} en klik op {{tickets.post}}." },
      ],
      result: { fr: "Votre message rejoint l'historique et, si le statut était {{tickets.status.waiting_requester}}, le ticket redevient {{tickets.status.in_progress}}.", nl: "Uw bericht komt in de geschiedenis en, als de status {{tickets.status.waiting_requester}} was, wordt het ticket opnieuw {{tickets.status.in_progress}}." },
    },
    {
      title: { fr: "Clore, rouvrir ou annuler un ticket", nl: "Een ticket afsluiten, heropenen of annuleren" },
      when: { fr: "Quand le problème est réglé, qu'il réapparaît, ou que la demande n'a plus lieu d'être.", nl: "Wanneer het probleem opgelost is, opnieuw opduikt of de aanvraag geen zin meer heeft." },
      steps: [
        { fr: "Ouvrez le ticket.", nl: "Open het ticket." },
        { fr: "Pour un ticket {{tickets.status.resolved}}, cliquez sur {{tickets.action.close}} s'il est réglé, ou sur {{tickets.action.reopen}} s'il ne l'est pas : le motif est obligatoire.", nl: "Klik voor een ticket {{tickets.status.resolved}} op {{tickets.action.close}} als het opgelost is, of op {{tickets.action.reopen}} als dat niet zo is: de reden is verplicht." },
        { fr: "Pour un ticket en cours que vous ne voulez plus, cliquez sur {{tickets.action.cancel}} et écrivez le motif.", nl: "Klik voor een lopend ticket dat u niet meer wilt op {{tickets.action.cancel}} en schrijf de reden." },
      ],
      result: { fr: "Le ticket change de statut. Un ticket clos ne se modifie plus ; la réouverture n'est possible que pendant le délai réglé dans {{nav.settings}}.", nl: "Het ticket verandert van status. Een afgesloten ticket kan niet meer gewijzigd worden; heropenen kan enkel binnen de termijn die in {{nav.settings}} is ingesteld." },
    },
    {
      title: { fr: "Traiter un ticket de votre file", nl: "Een ticket van uw wachtrij behandelen" },
      when: { fr: "Quand vous êtes gestionnaire du registre (file métier) ou administrateur (file IT) et qu'un ticket vous attend.", nl: "Wanneer u registerbeheerder (functionele wachtrij) of beheerder (IT-wachtrij) bent en een ticket op u wacht." },
      steps: [
        { fr: "Ouvrez le ticket et cliquez sur {{tickets.action.take}}.", nl: "Open het ticket en klik op {{tickets.action.take}}." },
        { fr: "S'il manque une information, cliquez sur {{tickets.action.wait}} et posez votre question dans le motif.", nl: "Als een gegeven ontbreekt, klikt u op {{tickets.action.wait}} en stelt u uw vraag in de reden." },
        { fr: "Quand c'est réglé, cliquez sur {{tickets.action.resolve}} et écrivez ce qui a été fait. Pour une demande qui ne sera pas suivie, cliquez sur {{tickets.action.reject}} en expliquant pourquoi.", nl: "Wanneer het opgelost is, klikt u op {{tickets.action.resolve}} en schrijft u wat er gedaan is. Voor een aanvraag die niet gevolgd wordt, klikt u op {{tickets.action.reject}} met uitleg waarom." },
        { fr: "Pour une question qui relève de l'autre file, cliquez sur {{tickets.action.transfer}} avec un motif. Une note cochée {{tickets.internal}} reste invisible pour le demandeur.", nl: "Voor een vraag die bij de andere wachtrij hoort, klikt u op {{tickets.action.transfer}} met een reden. Een nota met {{tickets.internal}} blijft onzichtbaar voor de aanvrager." },
      ],
      result: { fr: "Le demandeur voit l'avancement. Après un transfert, le ticket disparaît de votre liste si vous ne traitez pas l'autre file.", nl: "De aanvrager ziet de voortgang. Na een overdracht verdwijnt het ticket uit uw lijst als u de andere wachtrij niet behandelt." },
      errors: [
        { problem: { fr: "Un ticket ne peut pas passer à la file métier.", nl: "Een ticket kan niet naar de functionele wachtrij." }, solution: { fr: "Un ticket sans entité n'a pas de file métier : il reste à l'administrateur.", nl: "Een ticket zonder entiteit heeft geen functionele wachtrij: het blijft bij de beheerder." } },
      ],
      roles: ["gestionnaire", "admin"],
    },
  ],
  faq: [
    { q: { fr: "Qui traite mon ticket ?", nl: "Wie behandelt mijn ticket?" }, a: { fr: "Une question est traitée par les gestionnaires du registre de votre entité ; un incident, un bug ou un souhait, par l'administrateur de l'application. La colonne {{tickets.queue}} de la fiche du ticket l'indique.", nl: "Een vraag wordt behandeld door de registerbeheerders van uw entiteit; een incident, een bug of een wens door de beheerder van de toepassing. De kolom {{tickets.queue}} van de fiche van het ticket geeft het aan." } },
    { q: { fr: "Pourquoi ne puis-je pas joindre de capture ?", nl: "Waarom kan ik geen schermafbeelding toevoegen?" }, a: { fr: "Sur les écrans qui affichent du courrier (registre, à enregistrer, enregistrer, consultations), aucune capture n'est proposée : elle pourrait montrer des données personnelles. Décrivez le problème par écrit.", nl: "Op schermen die post tonen (register, te registreren, inschrijven, raadplegingen) wordt geen schermafbeelding aangeboden: ze zou persoonsgegevens kunnen tonen. Beschrijf het probleem schriftelijk." } },
  ],
  seeAlso: ["help", "settings"],
  shots: [],
};
export default topic;
