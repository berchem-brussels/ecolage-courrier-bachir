import type { HelpTopic } from '../types';

const topic: HelpTopic = {
  id: "register", path: "/registre", group: "main", titleKey: "nav.register", roles: ["secretariat", "gestionnaire"],
  purpose: { fr: "Cet écran liste les courriers enregistrés dans le registre d'une entité, du plus récent au plus ancien. Vous y retrouvez un courrier, ouvrez sa fiche pour la corriger, lisez ses fichiers ou annulez son enregistrement.", nl: "Dit scherm toont de ingeschreven brieven in het register van een entiteit, van de nieuwste naar de oudste. U vindt er een brief terug, opent zijn fiche om ze te corrigeren, leest zijn bestanden of annuleert zijn inschrijving." },
  layout: [
    { fr: "Le bouton {{mail.register}}, en haut à droite, ouvre le formulaire d'enregistrement.", nl: "De knop {{mail.register}} rechtsboven opent het inschrijvingsformulier." },
    { fr: "Si vous avez un rôle dans les deux entités, des boutons au-dessus de la liste choisissent l'entité dont vous voyez le registre.", nl: "Als u een rol in beide entiteiten hebt, kiezen knoppen boven de lijst van welke entiteit u het register ziet." },
    { fr: "La recherche {{common.search}} et les filtres de statut ({{common.all}}, {{mail.status.enregistre}}, {{mail.status.annule}}) et d'année ({{common.year.current}}, {{common.year.previous}}, {{common.year.all}}) limitent la liste.", nl: "De zoekfunctie {{common.search}} en de filters op status ({{common.all}}, {{mail.status.enregistre}}, {{mail.status.annule}}) en jaar ({{common.year.current}}, {{common.year.previous}}, {{common.year.all}}) beperken de lijst." },
    { fr: "La liste donne le numéro, la date de réception, l'expéditeur, l'objet, le type et le statut. Un clic sur une ligne ouvre la fiche du courrier.", nl: "De lijst geeft het nummer, de ontvangstdatum, de afzender, het onderwerp, het soort en de status. Een klik op een rij opent de fiche van de brief." },
  ],
  procedures: [
    {
      title: { fr: "Retrouver un courrier", nl: "Een brief terugvinden" },
      when: { fr: "Quand vous cherchez un courrier déjà enregistré.", nl: "Wanneer u een reeds ingeschreven brief zoekt." },
      steps: [
        { fr: "Ouvrez {{nav.register}} dans le menu.", nl: "Open {{nav.register}} in het menu." },
        { fr: "Si deux boutons d'entité sont affichés, choisissez l'entité du courrier.", nl: "Als twee entiteitsknoppen staan, kies de entiteit van de brief." },
        { fr: "Tapez dans {{common.search}} le numéro, un mot de l'objet, le nom de l'expéditeur ou sa référence.", nl: "Typ in {{common.search}} het nummer, een woord uit het onderwerp, de naam van de afzender of zijn referentie." },
        { fr: "Affinez avec les filtres de statut et d'année. Par défaut, seule l'année en cours est affichée : choisissez {{common.year.all}} pour chercher plus loin.", nl: "Verfijn met de filters op status en jaar. Standaard wordt enkel het lopende jaar getoond: kies {{common.year.all}} om verder te zoeken." },
      ],
      result: { fr: "La liste ne garde que les courriers qui correspondent.", nl: "De lijst behoudt enkel de overeenkomende brieven." },
      errors: [
        { problem: { fr: "Le courrier est introuvable.", nl: "De brief is niet te vinden." }, solution: { fr: "Il est peut-être d'une autre année ou de l'autre entité : choisissez {{common.year.all}} puis changez d'entité.", nl: "Hij is misschien van een ander jaar of van de andere entiteit: kies {{common.year.all}} en wissel van entiteit." } },
      ],
    },
    {
      title: { fr: "Corriger un courrier enregistré", nl: "Een ingeschreven brief corrigeren" },
      when: { fr: "Quand une information du courrier est fausse ou incomplète, par exemple une faute dans l'objet.", nl: "Wanneer een gegeven van de brief fout of onvolledig is, bijvoorbeeld een fout in het onderwerp." },
      steps: [
        { fr: "Cliquez sur la ligne du courrier : la fiche {{mail.detail}} s'ouvre à droite.", nl: "Klik op de rij van de brief: de fiche {{mail.detail}} opent rechts." },
        { fr: "Modifiez le champ à corriger.", nl: "Wijzig het te corrigeren veld." },
        { fr: "Cliquez sur {{common.save}}.", nl: "Klik op {{common.save}}." },
      ],
      result: { fr: "Le courrier est corrigé. Son numéro ne change jamais. La correction est inscrite au journal de l'application.", nl: "De brief is gecorrigeerd. Zijn nummer verandert nooit. De correctie wordt in het logboek van de toepassing genoteerd." },
      errors: [
        { problem: { fr: "Le bouton {{common.save}} ne fait rien.", nl: "De knop {{common.save}} doet niets." }, solution: { fr: "Un champ obligatoire est vide : l'expéditeur, l'objet ou le type. Complétez-le.", nl: "Een verplicht veld is leeg: de afzender, het onderwerp of het soort. Vul het aan." } },
      ],
    },
    {
      title: { fr: "Annuler un enregistrement", nl: "Een inschrijving annuleren" },
      when: { fr: "Quand un courrier a été enregistré par erreur ou en double. On n'efface jamais un courrier : on l'annule avec un motif.", nl: "Wanneer een brief per vergissing of dubbel ingeschreven is. Een brief wordt nooit gewist: hij wordt met een reden geannuleerd." },
      steps: [
        { fr: "Ouvrez la fiche du courrier.", nl: "Open de fiche van de brief." },
        { fr: "Écrivez le motif dans {{mail.cancel_reason}}.", nl: "Schrijf de reden in {{mail.cancel_reason}}." },
        { fr: "Cliquez sur {{mail.cancel}}, puis sur {{yes}} pour confirmer.", nl: "Klik op {{mail.cancel}} en daarna op {{yes}} om te bevestigen." },
      ],
      result: { fr: "Le courrier passe au statut {{mail.status.annule}} et son numéro apparaît barré. Le numéro reste au registre et n'est jamais réutilisé : le registre n'a aucun trou.", nl: "De brief krijgt de status {{mail.status.annule}} en zijn nummer verschijnt doorgestreept. Het nummer blijft in het register en wordt nooit hergebruikt: het register heeft geen enkel gat." },
      errors: [
        { problem: { fr: "Le bouton {{mail.cancel}} ne répond pas.", nl: "De knop {{mail.cancel}} reageert niet." }, solution: { fr: "Le motif est obligatoire : écrivez-le d'abord.", nl: "De reden is verplicht: schrijf ze eerst." } },
      ],
    },
    {
      title: { fr: "Lire ou ajouter un fichier d'un courrier", nl: "Een bestand van een brief lezen of toevoegen" },
      when: { fr: "Quand vous voulez relire le scan d'un courrier ou joindre un fichier oublié.", nl: "Wanneer u de scan van een brief wilt herlezen of een vergeten bestand wilt toevoegen." },
      steps: [
        { fr: "Ouvrez la fiche du courrier : ses fichiers s'affichent à côté des informations.", nl: "Open de fiche van de brief: zijn bestanden verschijnen naast de gegevens." },
        { fr: "S'il y a plusieurs fichiers, choisissez-en un au-dessus de {{piece.viewer}}.", nl: "Als er meerdere bestanden zijn, kies er een boven {{piece.viewer}}." },
        { fr: "Cliquez sur {{piece.open}} pour l'afficher en grand, ou sur {{piece.download}} pour l'enregistrer sur votre poste.", nl: "Klik op {{piece.open}} om het groot te tonen, of op {{piece.download}} om het op uw werkplek op te slaan." },
        { fr: "Pour joindre un fichier, glissez-le dans le cadre {{piece.add}}.", nl: "Om een bestand toe te voegen, sleept u het in het kader {{piece.add}}." },
      ],
      result: { fr: "Le fichier s'affiche ou se télécharge. Chaque lecture est inscrite au journal des consultations.", nl: "Het bestand wordt getoond of gedownload. Elke lezing wordt in het raadplegingslogboek genoteerd." },
      errors: [
        { problem: { fr: "Le fichier est refusé.", nl: "Het bestand wordt geweigerd." }, solution: { fr: "Seuls les PDF, JPEG et PNG sont acceptés, avec une taille maximale affichée dans le cadre de dépôt.", nl: "Enkel pdf, jpeg en png worden aanvaard, met een maximale grootte die in het kader staat." } },
      ],
    },
  ],
  faq: [
    { q: { fr: "Comment le numéro d'un courrier est-il choisi ?", nl: "Hoe wordt het nummer van een brief gekozen?" }, a: { fr: "L'application attribue le numéro suivant du registre de l'entité au moment de l'enregistrement. Il suit l'année de la date de réception : un courrier reçu le 31 décembre et enregistré le 2 janvier prend un numéro de l'année écoulée. Deux personnes qui enregistrent en même temps n'obtiennent jamais le même numéro.", nl: "De toepassing kent het volgende nummer van het register van de entiteit toe op het moment van de inschrijving. Het volgt het jaar van de ontvangstdatum: een brief ontvangen op 31 december en ingeschreven op 2 januari krijgt een nummer van het voorbije jaar. Twee personen die gelijktijdig inschrijven krijgen nooit hetzelfde nummer." } },
    { q: { fr: "J'ai enregistré un courrier par erreur. Puis-je le supprimer ?", nl: "Ik heb een brief per vergissing ingeschreven. Kan ik hem wissen?" }, a: { fr: "Non. Ouvrez sa fiche et annulez l'enregistrement avec un motif. Le numéro reste au registre avec la mention « annulé » et n'est jamais réutilisé.", nl: "Nee. Open zijn fiche en annuleer de inschrijving met een reden. Het nummer blijft in het register met de vermelding « geannuleerd » en wordt nooit hergebruikt." } },
    { q: { fr: "Je ne vois pas le courrier du CPAS (ou de la commune). Est-ce normal ?", nl: "Ik zie de post van het OCMW (of van de gemeente) niet. Is dat normaal?" }, a: { fr: "Oui. Chaque entité a son propre registre. Vous ne voyez que celui des entités où vous avez un rôle de secrétariat ou de gestionnaire du registre. L'administrateur règle ces rôles.", nl: "Ja. Elke entiteit heeft haar eigen register. U ziet enkel dat van de entiteiten waarin u de rol van secretariaat of registerbeheerder hebt. De beheerder regelt die rollen." } },
    { q: { fr: "Peut-on savoir qui a ouvert un courrier ?", nl: "Kan men weten wie een brief geopend heeft?" }, a: { fr: "Oui. Chaque ouverture de la fiche et chaque lecture d'un fichier sont inscrites au journal des consultations, avec la personne, la date et l'heure. L'auditeur de l'entité consulte ce journal.", nl: "Ja. Elke opening van de fiche en elke lezing van een bestand worden in het raadplegingslogboek genoteerd, met de persoon, de datum en het uur. De auditor van de entiteit raadpleegt dat logboek." } },
  ],
  seeAlso: ["registration", "inbox", "consultations"],
  shots: [],
};
export default topic;
