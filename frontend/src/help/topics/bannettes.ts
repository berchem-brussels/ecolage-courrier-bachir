import type { HelpTopic } from '../types';

const topic: HelpTopic = {
  id: "bannettes", path: "/bannettes", group: "main", titleKey: "nav.bannettes", roles: ["agent", "chef_service", "secretariat", "gestionnaire"],
  purpose: { fr: "Cet écran regroupe le courrier à traiter, par bannette. Le secrétariat y attribue les courriers aux services. Les agents et les responsables de service y retrouvent le courrier de leur service, celui qui leur est confié et celui qu'ils reçoivent en copie.", nl: "Dit scherm groepeert de te behandelen post per bakje. Het secretariaat wijst er de brieven toe aan de diensten. De bedienden en diensthoofden vinden er de post van hun dienst terug, die aan hen toevertrouwd is en die ze in kopie ontvangen." },
  layout: [
    { fr: "[[1]] Les onglets sont les bannettes. Le nombre entre parenthèses est le nombre de courriers qu'elle contient. Le secrétariat voit {{box.a_enregistrer}} et {{box.a_attribuer}}. Les agents et les responsables voient {{box.mon_service}}, {{box.moi}} et {{box.en_copie}}.", nl: "[[1]] De tabbladen zijn de bakjes. Het aantal tussen haakjes is het aantal brieven erin. Het secretariaat ziet {{box.a_enregistrer}} en {{box.a_attribuer}}. De bedienden en diensthoofden zien {{box.mon_service}}, {{box.moi}} en {{box.en_copie}}." },
    { fr: "[[2]] La liste montre le courrier de la bannette choisie. Un clic sur une ligne ouvre la fiche du courrier, avec son attribution.", nl: "[[2]] De lijst toont de post van het gekozen bakje. Een klik op een rij opent de fiche van de brief, met zijn toewijzing." },
    { fr: "Si vous avez un rôle dans les deux entités, des boutons au-dessus de la liste choisissent l'entité dont vous voyez les bannettes.", nl: "Als u een rol in beide entiteiten hebt, kiezen knoppen boven de lijst van welke entiteit u de bakjes ziet." },
    { fr: "Un clic sur {{box.a_enregistrer}} ouvre la file des fichiers déposés, à enregistrer.", nl: "Een klik op {{box.a_enregistrer}} opent de wachtrij van de neergelegde bestanden, die geregistreerd moeten worden." },
  ],
  overviewShot: "bannettes-overview",
  procedures: [
    {
      title: { fr: "Attribuer un courrier", nl: "Een brief toewijzen" },
      when: { fr: "Quand un courrier vient d'être enregistré et doit être confié à un service. Cette action revient au secrétariat et au gestionnaire du registre.", nl: "Wanneer een brief net geregistreerd is en aan een dienst moet worden toevertrouwd. Deze actie komt toe aan het secretariaat en aan de registerbeheerder." },
      steps: [
        { fr: "Ouvrez {{nav.bannettes}} dans le menu, puis l'onglet {{box.a_attribuer}}.", nl: "Open {{nav.bannettes}} in het menu en daarna het tabblad {{box.a_attribuer}}." },
        { fr: "Cliquez sur la ligne du courrier : la fiche s'ouvre à droite.", nl: "Klik op de rij van de brief: de fiche opent rechts." },
        { fr: "Dans le cadre {{attr.title}}, choisissez le {{attr.service}}. Un seul service traite un courrier à la fois.", nl: "Kies in het kader {{attr.title}} de {{attr.service}}. Telkens behandelt maar één dienst een brief." },
        { fr: "Si vous le souhaitez, choisissez un {{attr.agent}} du service, et des {{attr.copies}} qui recevront le courrier pour information.", nl: "Kies desgewenst een {{attr.agent}} van de dienst en {{attr.copies}} die de brief ter informatie ontvangen." },
        { fr: "Cliquez sur {{attr.submit}}.", nl: "Klik op {{attr.submit}}." },
      ],
      result: { fr: "Le courrier quitte {{box.a_attribuer}}. Il apparaît dans la bannette du service, ou dans celle de l'agent nommé, et les personnes concernées reçoivent une notification. Le changement est inscrit à l'historique de l'attribution.", nl: "De brief verlaat {{box.a_attribuer}}. Hij verschijnt in het bakje van de dienst, of in dat van de aangeduide bediende, en de betrokken personen ontvangen een melding. De wijziging wordt in de geschiedenis van de toewijzing genoteerd." },
      errors: [
        { problem: { fr: "Je change le service d'un courrier déjà attribué et l'enregistrement est refusé.", nl: "Ik wijzig de dienst van een reeds toegewezen brief en de opslag wordt geweigerd." }, solution: { fr: "Un motif est obligatoire dans ce cas : écrivez-le dans {{attr.reason}}.", nl: "In dat geval is een reden verplicht: schrijf ze in {{attr.reason}}." } },
        { problem: { fr: "Le service que je cherche n'est pas dans la liste.", nl: "De dienst die ik zoek staat niet in de lijst." }, solution: { fr: "La liste ne propose que les services de l'entité du courrier. Demandez à l'administrateur de rattacher le service à cette entité.", nl: "De lijst stelt enkel de diensten van de entiteit van de brief voor. Vraag de beheerder de dienst aan die entiteit te koppelen." } },
      ],
      shots: ["bannettes-attribution"],
    },
    {
      title: { fr: "Retrouver le courrier de son service", nl: "De post van zijn dienst terugvinden" },
      when: { fr: "Quand vous traitez le courrier d'un service, comme agent ou comme responsable.", nl: "Wanneer u de post van een dienst behandelt, als bediende of als diensthoofd." },
      steps: [
        { fr: "Ouvrez {{nav.bannettes}} dans le menu.", nl: "Open {{nav.bannettes}} in het menu." },
        { fr: "Choisissez {{box.mon_service}} pour le courrier confié à votre service, {{box.moi}} pour celui qui vous est confié personnellement, ou {{box.en_copie}} pour celui que vous recevez pour information.", nl: "Kies {{box.mon_service}} voor de post die aan uw dienst is toevertrouwd, {{box.moi}} voor de post die persoonlijk aan u is toevertrouwd, of {{box.en_copie}} voor de post die u ter informatie ontvangt." },
        { fr: "Cliquez sur une ligne pour ouvrir la fiche et lire le courrier et ses fichiers.", nl: "Klik op een rij om de fiche te openen en de brief en zijn bestanden te lezen." },
      ],
      result: { fr: "Vous lisez le courrier. Vous ne le modifiez pas : seul le secrétariat corrige, attribue ou annule un courrier. Chaque ouverture est inscrite au journal des consultations.", nl: "U leest de brief. U wijzigt hem niet: enkel het secretariaat corrigeert, wijst toe of annuleert een brief. Elke opening wordt in het raadplegingslogboek genoteerd." },
      errors: [
        { problem: { fr: "Mes bannettes restent vides alors que mon service reçoit du courrier.", nl: "Mijn bakjes blijven leeg terwijl mijn dienst post ontvangt." }, solution: { fr: "Vous n'êtes peut-être rattaché à aucun service : l'écran l'indique en haut de la page. Demandez à l'administrateur de vous rattacher à votre service.", nl: "U bent misschien aan geen enkele dienst gekoppeld: het scherm meldt dat bovenaan de pagina. Vraag de beheerder u aan uw dienst te koppelen." } },
      ],
    },
    {
      title: { fr: "Nommer ou changer l'agent d'un courrier", nl: "De bediende van een brief aanduiden of wijzigen" },
      when: { fr: "Quand le courrier d'un service doit être confié à une personne précise. Le responsable du service le fait sans passer par le secrétariat.", nl: "Wanneer de post van een dienst aan een bepaalde persoon moet worden toevertrouwd. Het diensthoofd doet dit zonder via het secretariaat te gaan." },
      steps: [
        { fr: "Ouvrez la fiche du courrier depuis {{box.mon_service}}.", nl: "Open de fiche van de brief vanuit {{box.mon_service}}." },
        { fr: "Dans le cadre {{attr.title}}, choisissez la personne dans {{attr.agent}}. Seules les personnes du service sont proposées.", nl: "Kies in het kader {{attr.title}} de persoon in {{attr.agent}}. Enkel de personen van de dienst worden voorgesteld." },
        { fr: "Cliquez sur {{attr.agent.set}}.", nl: "Klik op {{attr.agent.set}}." },
      ],
      result: { fr: "Le courrier entre dans la bannette {{box.moi}} de la personne nommée, qui reçoit une notification. Pour retirer la nomination, videz le champ et enregistrez : le courrier reste dans la bannette du service.", nl: "De brief komt in het bakje {{box.moi}} van de aangeduide persoon, die een melding ontvangt. Om de aanduiding in te trekken, maakt u het veld leeg en slaat u op: de brief blijft in het bakje van de dienst." },
    },
    {
      title: { fr: "Renvoyer un courrier au secrétariat", nl: "Een brief terugsturen naar het secretariaat" },
      when: { fr: "Quand un courrier attribué à votre service n'est pas le sien.", nl: "Wanneer een aan uw dienst toegewezen brief niet voor die dienst is." },
      steps: [
        { fr: "Ouvrez la fiche du courrier depuis {{box.mon_service}}.", nl: "Open de fiche van de brief vanuit {{box.mon_service}}." },
        { fr: "Écrivez le motif dans {{attr.return.reason}}, par exemple le service qui devrait le traiter.", nl: "Schrijf de reden in {{attr.return.reason}}, bijvoorbeeld de dienst die hem zou moeten behandelen." },
        { fr: "Cliquez sur {{attr.return}}, puis sur {{yes}} pour confirmer.", nl: "Klik op {{attr.return}} en daarna op {{yes}} om te bevestigen." },
      ],
      result: { fr: "Le courrier quitte votre bannette et revient dans {{box.a_attribuer}}, où le secrétariat lit votre motif et le réattribue. Vous ne le voyez plus.", nl: "De brief verlaat uw bakje en keert terug naar {{box.a_attribuer}}, waar het secretariaat uw reden leest en hem opnieuw toewijst. U ziet hem niet meer." },
      errors: [
        { problem: { fr: "Le bouton {{attr.return}} ne répond pas.", nl: "De knop {{attr.return}} reageert niet." }, solution: { fr: "Le motif est obligatoire : écrivez-le d'abord. Un service qui reçoit seulement le courrier en copie ne peut pas le renvoyer.", nl: "De reden is verplicht: schrijf ze eerst. Een dienst die de brief enkel in kopie ontvangt, kan hem niet terugsturen." } },
      ],
    },
    {
      title: { fr: "Suivre ses notifications", nl: "Zijn meldingen opvolgen" },
      when: { fr: "Quand vous voulez savoir quel courrier vous a été confié ou renvoyé.", nl: "Wanneer u wilt weten welke brief aan u is toevertrouwd of teruggestuurd." },
      steps: [
        { fr: "Cliquez sur la cloche {{notif.title}}, en haut de l'écran. Le chiffre indique les notifications non lues.", nl: "Klik op de bel {{notif.title}} bovenaan het scherm. Het cijfer geeft de ongelezen meldingen aan." },
        { fr: "Cliquez sur une notification : la fiche du courrier s'ouvre.", nl: "Klik op een melding: de fiche van de brief opent." },
        { fr: "Cliquez sur {{notif.mark_all}} pour vider le compteur sans ouvrir chaque courrier.", nl: "Klik op {{notif.mark_all}} om de teller te legen zonder elke brief te openen." },
      ],
      result: { fr: "Une notification donne seulement la nature de l'événement et le numéro du courrier, jamais son objet. Une notification d'un courrier que vous ne pouvez plus lire disparaît.", nl: "Een melding geeft enkel de aard van de gebeurtenis en het nummer van de brief, nooit het onderwerp. Een melding van een brief die u niet meer kunt lezen verdwijnt." },
    },
  ],
  faq: [
    { q: { fr: "Qui voit un courrier ?", nl: "Wie ziet een brief?" }, a: { fr: "Le secrétariat et le gestionnaire du registre voient tout le registre de leur entité. Un agent ou un responsable voit les courriers attribués à son service, ceux où son service est en copie et ceux où il est nommé. Les autres personnes, l'administrateur compris, ne voient rien.", nl: "Het secretariaat en de registerbeheerder zien het hele register van hun entiteit. Een bediende of diensthoofd ziet de brieven die aan zijn dienst zijn toegewezen, die waar zijn dienst in kopie staat en die waarvoor hij is aangeduid. De andere personen, de beheerder inbegrepen, zien niets." } },
    { q: { fr: "Un courrier de l'autre entité peut-il m'être attribué ?", nl: "Kan een brief van de andere entiteit aan mij worden toegewezen?" }, a: { fr: "Non. Un rôle vaut pour une seule entité : un agent de l'administration communale ne voit jamais le courrier du CPAS, même si son service est commun aux deux entités.", nl: "Nee. Een rol geldt voor één enkele entiteit: een bediende van het gemeentebestuur ziet nooit de post van het OCMW, ook al is zijn dienst gemeenschappelijk voor beide entiteiten." } },
    { q: { fr: "Quelle est la différence entre {{box.mon_service}} et {{box.moi}} ?", nl: "Wat is het verschil tussen {{box.mon_service}} en {{box.moi}}?" }, a: { fr: "{{box.mon_service}} montre tout le courrier confié à votre service, y compris celui d'un collègue. {{box.moi}} montre seulement celui dont vous êtes l'agent nommé.", nl: "{{box.mon_service}} toont alle post die aan uw dienst is toevertrouwd, ook die van een collega. {{box.moi}} toont enkel de post waarvoor u de aangeduide bediende bent." } },
    { q: { fr: "Un courrier renvoyé au secrétariat est-il perdu ?", nl: "Is een naar het secretariaat teruggestuurde brief verloren?" }, a: { fr: "Non. Il revient dans {{box.a_attribuer}} avec le motif du renvoi, et l'historique de la fiche garde toutes les étapes. Le secrétariat le réattribue au bon service.", nl: "Nee. Hij keert terug naar {{box.a_attribuer}} met de reden van de terugsturing, en de geschiedenis van de fiche bewaart alle stappen. Het secretariaat wijst hem opnieuw toe aan de juiste dienst." } },
  ],
  seeAlso: ["register", "inbox", "users"],
  shots: [
    { id: "bannettes-overview", path: "/bannettes", marks: [{ sel: ".ant-tabs-nav" }, { sel: ".ant-table" }], caption: { fr: "Bannettes du courrier", nl: "Postbakken" } },
    { id: "bannettes-attribution", path: "/bannettes", actions: [{ "clickSel": ".ant-table-row" }, { "wait": 600 }, { "scroll": ".ant-drawer form >> nth=0" }, { "wait": 300 }], clip: "drawer", marks: [{ sel: ".ant-drawer .ant-card", text: "attr.title" }, { sel: ".ant-drawer button.ant-btn-primary", text: "attr.submit" }], caption: { fr: "Attribution d'un courrier", nl: "Toewijzing van een brief" } },
  ],
};
export default topic;
