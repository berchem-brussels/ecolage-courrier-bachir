import type { HelpTopic } from '../types';

const topic: HelpTopic = {
  id: "inbox", path: "/a-enregistrer", group: "main", titleKey: "nav.inbox", roles: ["secretariat", "gestionnaire"],
  purpose: { fr: "Cet écran sert à enregistrer le courrier scanné. Vous déposez les fichiers du copieur, l'application les met en file, et vous transformez chaque fichier en courrier enregistré, l'un après l'autre.", nl: "Dit scherm dient om gescande post in te schrijven. U plaatst de bestanden van de kopieermachine, de toepassing zet ze in een wachtrij en u maakt van elk bestand een ingeschreven brief, een voor een." },
  layout: [
    { fr: "Le cadre {{piece.drop}} reçoit les fichiers : PDF, JPEG ou PNG, avec la taille maximale indiquée dans le cadre.", nl: "Het kader {{piece.drop}} ontvangt de bestanden: pdf, jpeg of png, met de maximale grootte die in het kader staat." },
    { fr: "Le fichier en cours s'affiche à gauche avec son nom, sa taille et la date de dépôt ; le formulaire {{inbox.form}} est à droite.", nl: "Het bestand in behandeling verschijnt links met zijn naam, zijn grootte en de datum van de plaatsing; het formulier {{inbox.form}} staat rechts." },
    { fr: "Les boutons {{inbox.previous}} et {{inbox.next}} parcourent la file ; {{inbox.list}} la montre en entier.", nl: "De knoppen {{inbox.previous}} en {{inbox.next}} doorlopen de wachtrij; {{inbox.list}} toont ze volledig." },
    { fr: "Le bouton {{piece.reject}} retire de la file un fichier qui n'est pas un courrier.", nl: "De knop {{piece.reject}} haalt een bestand dat geen brief is uit de wachtrij." },
  ],
  procedures: [
    {
      title: { fr: "Déposer des fichiers scannés", nl: "Gescande bestanden plaatsen" },
      when: { fr: "Quand le copieur a produit les scans d'un lot de courrier.", nl: "Wanneer de kopieermachine de scans van een reeks post heeft gemaakt." },
      steps: [
        { fr: "Ouvrez {{nav.inbox}} dans le menu.", nl: "Open {{nav.inbox}} in het menu." },
        { fr: "Glissez les fichiers dans le cadre {{piece.drop}}, ou cliquez dans le cadre pour les choisir sur votre poste.", nl: "Sleep de bestanden in het kader {{piece.drop}}, of klik in het kader om ze op uw werkplek te kiezen." },
      ],
      result: { fr: "Chaque fichier accepté entre dans la file avec le message {{piece.received}}. Un fichier refusé est listé dans {{piece.refused}} avec sa raison.", nl: "Elk aanvaard bestand komt in de wachtrij met het bericht {{piece.received}}. Een geweigerd bestand staat in {{piece.refused}} met zijn reden." },
      errors: [
        { problem: { fr: "Le fichier est refusé comme trop volumineux.", nl: "Het bestand wordt geweigerd omdat het te groot is." }, solution: { fr: "Scannez en noir et blanc ou à 200 points par pouce, ou découpez le scan en plusieurs fichiers et joignez-les au même courrier. L'administrateur règle la taille maximale dans {{nav.settings}}.", nl: "Scan in zwart-wit of met 200 punten per inch, of splits de scan in meerdere bestanden en voeg ze toe aan dezelfde brief. De beheerder stelt de maximale grootte in bij {{nav.settings}}." } },
        { problem: { fr: "Le copieur produit des fichiers TIFF et ils sont refusés.", nl: "De kopieermachine maakt tiff-bestanden en die worden geweigerd." }, solution: { fr: "Le navigateur ne sait pas afficher ce format. Réglez le copieur pour qu'il produise des PDF : le service informatique peut aider.", nl: "De browser kan dit formaat niet tonen. Stel de kopieermachine in om pdf's te maken: de informaticadienst kan helpen." } },
      ],
    },
    {
      title: { fr: "Enregistrer un fichier de la file", nl: "Een bestand uit de wachtrij inschrijven" },
      when: { fr: "Quand des fichiers attendent dans la file.", nl: "Wanneer bestanden in de wachtrij wachten." },
      steps: [
        { fr: "Lisez le fichier affiché à gauche : expéditeur, objet, date.", nl: "Lees het bestand dat links staat: afzender, onderwerp, datum." },
        { fr: "Remplissez le formulaire à droite comme pour un courrier papier : {{mail.received_date}}, {{mail.channel}}, {{mail.sender}}, {{mail.subject}} et {{mail.type}}.", nl: "Vul het formulier rechts in zoals voor een papieren brief: {{mail.received_date}}, {{mail.channel}}, {{mail.sender}}, {{mail.subject}} en {{mail.type}}." },
        { fr: "Cliquez sur {{inbox.save}}.", nl: "Klik op {{inbox.save}}." },
      ],
      result: { fr: "Le message {{inbox.registered}} annonce le numéro attribué. Le fichier est joint au courrier et le fichier suivant de la file s'affiche.", nl: "Het bericht {{inbox.registered}} meldt het toegekende nummer. Het bestand is aan de brief toegevoegd en het volgende bestand van de wachtrij verschijnt." },
      errors: [
        { problem: { fr: "Le bouton {{inbox.save}} ne fait rien.", nl: "De knop {{inbox.save}} doet niets." }, solution: { fr: "Un champ obligatoire est vide : il est signalé en rouge. Complétez-le.", nl: "Een verplicht veld is leeg: het wordt rood aangeduid. Vul het aan." } },
      ],
    },
    {
      title: { fr: "Rejeter un fichier qui n'est pas un courrier", nl: "Een bestand afwijzen dat geen brief is" },
      when: { fr: "Quand le fichier est une publicité, un doublon ou un dépôt par erreur.", nl: "Wanneer het bestand reclame, een dubbel of een vergissing is." },
      steps: [
        { fr: "Affichez le fichier concerné.", nl: "Toon het betrokken bestand." },
        { fr: "Cliquez sur {{piece.reject}}.", nl: "Klik op {{piece.reject}}." },
        { fr: "Écrivez le motif dans {{common.reason}} : publicité, doublon ou dépôt par erreur. Confirmez.", nl: "Schrijf de reden in {{common.reason}}: reclame, dubbel of vergissing. Bevestig." },
      ],
      result: { fr: "Le message {{piece.rejected}} s'affiche. Le fichier quitte la file et ne reçoit aucun numéro.", nl: "Het bericht {{piece.rejected}} verschijnt. Het bestand verlaat de wachtrij en krijgt geen nummer." },
      errors: [
        { problem: { fr: "Le fichier rejeté était un vrai courrier.", nl: "Het afgewezen bestand was een echte brief." }, solution: { fr: "Redéposez le fichier dans le cadre de dépôt, puis enregistrez-le.", nl: "Plaats het bestand opnieuw in het kader en schrijf het daarna in." } },
      ],
    },
  ],
  faq: [
    { q: { fr: "La file est vide. Que faire ?", nl: "De wachtrij is leeg. Wat moet ik doen?" }, a: { fr: "Déposez les fichiers scannés dans le cadre en haut de l'écran : chacun deviendra un courrier enregistré.", nl: "Plaats de gescande bestanden in het kader bovenaan het scherm: elk wordt een ingeschreven brief." } },
    { q: { fr: "Quelle différence avec {{nav.registration}} ?", nl: "Wat is het verschil met {{nav.registration}}?" }, a: { fr: "{{nav.registration}} sert à enregistrer un courrier papier sans fichier. {{nav.inbox}} sert à enregistrer le courrier scanné, avec son fichier.", nl: "{{nav.registration}} dient om een papieren brief zonder bestand in te schrijven. {{nav.inbox}} dient om gescande post met zijn bestand in te schrijven." } },
  ],
  seeAlso: ["registration", "register"],
  shots: [],
};
export default topic;
