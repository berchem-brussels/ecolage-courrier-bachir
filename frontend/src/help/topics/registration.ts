import type { HelpTopic } from '../types';

const topic: HelpTopic = {
  id: "registration", path: "/enregistrer", group: "main", titleKey: "nav.registration", roles: ["secretariat", "gestionnaire"],
  purpose: { fr: "Cet écran sert à enregistrer un courrier reçu : l'application lui donne le numéro suivant du registre de l'entité. Le formulaire est prêt pour le courrier suivant dès que vous avez enregistré.", nl: "Dit scherm dient om een ontvangen brief in te schrijven: de toepassing geeft hem het volgende nummer van het register van de entiteit. Het formulier staat klaar voor de volgende brief zodra u ingeschreven hebt." },
  layout: [
    { fr: "Si vous avez un rôle dans les deux entités, des boutons en haut du formulaire choisissent l'entité dont le registre reçoit le courrier.", nl: "Als u een rol in beide entiteiten hebt, kiezen knoppen bovenaan het formulier in het register van welke entiteit de brief komt." },
    { fr: "[[1]] Les champs obligatoires sont {{mail.received_date}}, {{mail.channel}}, {{mail.sender}}, {{mail.subject}} et {{mail.type}}.", nl: "[[1]] De verplichte velden zijn {{mail.received_date}}, {{mail.channel}}, {{mail.sender}}, {{mail.subject}} en {{mail.type}}." },
    { fr: "Le bouton {{common.more}} affiche les champs facultatifs : langue, urgence, destinataire, référence de l'expéditeur, date du document, nombre de pièces et remarque.", nl: "De knop {{common.more}} toont de facultatieve velden: taal, urgentie, bestemmeling, referentie van de afzender, datum van het document, aantal stukken en opmerking." },
    { fr: "[[2]] Les blocs {{mail.session.count}} et {{mail.session.last}} comptent les courriers enregistrés depuis l'ouverture de l'écran et rappellent leurs numéros.", nl: "[[2]] De blokken {{mail.session.count}} en {{mail.session.last}} tellen de brieven die sinds het openen van het scherm zijn ingeschreven en herinneren aan hun nummers." },
  ],
  overviewShot: "registration-overview",
  procedures: [
    {
      title: { fr: "Enregistrer un courrier reçu", nl: "Een ontvangen brief inschrijven" },
      when: { fr: "Quand vous avez devant vous un courrier papier à enregistrer.", nl: "Wanneer u een papieren brief voor u hebt die ingeschreven moet worden." },
      steps: [
        { fr: "Ouvrez {{nav.registration}} dans le menu et, si deux entités sont proposées, choisissez celle du courrier.", nl: "Open {{nav.registration}} in het menu en kies, als twee entiteiten worden voorgesteld, die van de brief." },
        { fr: "Vérifiez {{mail.received_date}} (aujourd'hui par défaut) et {{mail.channel}}.", nl: "Controleer {{mail.received_date}} (standaard vandaag) en {{mail.channel}}." },
        { fr: "Cherchez l'expéditeur dans {{mail.sender}} en tapant quelques lettres, puis choisissez-le dans la liste.", nl: "Zoek de afzender in {{mail.sender}} door enkele letters te typen en kies hem in de lijst." },
        { fr: "Écrivez l'objet : une phrase qui dit de quoi parle le courrier. Choisissez ensuite le {{mail.type}}.", nl: "Schrijf het onderwerp: een zin die zegt waarover de brief gaat. Kies daarna het {{mail.type}}." },
        { fr: "Cliquez sur {{common.save}}.", nl: "Klik op {{common.save}}." },
      ],
      result: { fr: "Le message {{mail.saved}} s'affiche avec le numéro attribué. Le formulaire est prêt pour le courrier suivant : la date de réception et le mode d'arrivée sont repris.", nl: "Het bericht {{mail.saved}} verschijnt met het toegekende nummer. Het formulier staat klaar voor de volgende brief: de ontvangstdatum en de wijze van aankomst worden overgenomen." },
      errors: [
        { problem: { fr: "Le bouton {{common.save}} ne fait rien.", nl: "De knop {{common.save}} doet niets." }, solution: { fr: "Un champ obligatoire est vide : il est signalé en rouge. Complétez-le.", nl: "Een verplicht veld is leeg: het wordt rood aangeduid. Vul het aan." } },
        { problem: { fr: "Aucun type de courrier n'est proposé.", nl: "Er wordt geen soort brief voorgesteld." }, solution: { fr: "Aucun type n'est défini pour cette entité. Le gestionnaire du registre ou l'administrateur doit en créer un dans {{nav.types}}.", nl: "Voor deze entiteit is geen soort gedefinieerd. De registerbeheerder of de beheerder moet er een aanmaken in {{nav.types}}." } },
      ],
    },
    {
      title: { fr: "Enregistrer un recommandé", nl: "Een aangetekende brief inschrijven" },
      when: { fr: "Quand le courrier est arrivé en recommandé et que vous voulez garder son numéro de suivi.", nl: "Wanneer de brief aangetekend is aangekomen en u zijn volgnummer wilt bewaren." },
      steps: [
        { fr: "Dans {{mail.channel}}, choisissez {{mail.channel.recommande}} : le champ {{mail.tracking_number}} apparaît.", nl: "Kies in {{mail.channel}} {{mail.channel.recommande}}: het veld {{mail.tracking_number}} verschijnt." },
        { fr: "Recopiez le numéro imprimé sur l'avis de réception ou sur l'enveloppe, sans espace superflu.", nl: "Neem het nummer over dat op het ontvangstbewijs of op de enveloppe staat, zonder overbodige spaties." },
        { fr: "Complétez l'expéditeur, l'objet et le type, puis cliquez sur {{common.save}}.", nl: "Vul de afzender, het onderwerp en het soort aan en klik op {{common.save}}." },
      ],
      result: { fr: "Le courrier est enregistré avec son numéro de recommandé, que le registre affiche dans la fiche.", nl: "De brief is ingeschreven met zijn nummer van de aangetekende zending, dat het register in de fiche toont." },
    },
    {
      title: { fr: "Enregistrer un courrier restreint ou un pli confidentiel", nl: "Een beperkte brief of een vertrouwelijke omslag inschrijven" },
      when: { fr: "Quand le courrier ne doit être lu que par des personnes précises : un dossier du personnel, ou un pli personnel remis fermé à son destinataire.", nl: "Wanneer de brief enkel door bepaalde personen gelezen mag worden: een personeelsdossier, of een persoonlijke omslag die gesloten aan de bestemmeling wordt overhandigd." },
      steps: [
        { fr: "Remplissez le formulaire comme d'habitude, puis choisissez le niveau dans {{mail.confidentiality}} : {{mail.level.restreint}} ou {{mail.level.confidentiel}}.", nl: "Vul het formulier zoals gewoonlijk in en kies daarna het niveau in {{mail.confidentiality}}: {{mail.level.restreint}} of {{mail.level.confidentiel}}." },
        { fr: "Pour un courrier restreint, choisissez dans {{mail.designees}} les agents ou responsables qui doivent pouvoir le lire : eux seuls et le secrétariat le verront.", nl: "Kies voor een beperkte brief in {{mail.designees}} de bedienden of verantwoordelijken die hem moeten kunnen lezen: enkel zij en het secretariaat zien hem." },
        { fr: "Pour un pli confidentiel, choisissez dans {{mail.designee}} la personne dont le nom est sur l'enveloppe. L'objet n'est pas demandé et aucun fichier ne peut être joint : le pli reste fermé.", nl: "Kies voor een vertrouwelijke omslag in {{mail.designee}} de persoon van wie de naam op de envelop staat. Het onderwerp wordt niet gevraagd en er kan geen bestand worden toegevoegd: de omslag blijft gesloten." },
        { fr: "Cliquez sur {{common.save}}. Quand le pli est remis à son destinataire, ouvrez sa fiche et utilisez {{conf.handover}} : qui remet, qui reçoit, la date et l'heure sont gardés.", nl: "Klik op {{common.save}}. Wanneer de omslag aan de bestemmeling wordt overhandigd, opent u zijn dossier en gebruikt u {{conf.handover}}: wie overhandigt, wie ontvangt, datum en uur worden bewaard." },
      ],
      result: { fr: "Le courrier reçoit son numéro et porte un cadenas dans les listes. Les agents qui ne sont pas désignés, l'auditeur, l'administrateur et l'autre entité ne le voient pas, ni dans les listes, ni dans les compteurs, ni dans la recherche.", nl: "De brief krijgt zijn nummer en draagt een hangslot in de lijsten. Niet-aangeduide bedienden, de auditor, de beheerder en de andere entiteit zien hem niet, noch in de lijsten, noch in de tellers, noch in het zoeken." },
      errors: [
        { problem: { fr: "L'option {{mail.level.confidentiel}} est grisée.", nl: "De optie {{mail.level.confidentiel}} is grijs." }, solution: { fr: "Vous enregistrez un fichier de la file « À enregistrer » : un pli confidentiel s'enregistre sans scan. Choisissez {{mail.level.restreint}}, ou enregistrez le pli sans fichier.", nl: "U registreert een bestand uit de wachtrij: een vertrouwelijke omslag wordt zonder scan geregistreerd. Kies {{mail.level.restreint}} of registreer de omslag zonder bestand." } },
        { problem: { fr: "La liste des personnes à désigner est vide.", nl: "De lijst met aan te duiden personen is leeg." }, solution: { fr: "Seuls les agents et responsables de service actifs de l'entité peuvent être désignés : vérifiez leurs rôles dans l'administration des utilisateurs.", nl: "Enkel actieve bedienden en dienstverantwoordelijken van de entiteit kunnen worden aangeduid: controleer hun rollen in het gebruikersbeheer." } },
      ],
    },
    {
      title: { fr: "Créer l'expéditeur sans quitter le formulaire", nl: "De afzender aanmaken zonder het formulier te verlaten" },
      when: { fr: "Quand l'expéditeur n'existe pas encore dans la liste des contacts.", nl: "Wanneer de afzender nog niet in de lijst van contacten staat." },
      steps: [
        { fr: "Dans {{mail.sender}}, cliquez sur {{contact.new}}.", nl: "Klik in {{mail.sender}} op {{contact.new}}." },
        { fr: "Choisissez {{contact.kind}} : {{contact.kind.personne}} ou {{contact.kind.organisation}}.", nl: "Kies {{contact.kind}}: {{contact.kind.personne}} of {{contact.kind.organisation}}." },
        { fr: "Encodez le nom, et si vous les connaissez, l'adresse e-mail et l'adresse postale. Cliquez sur {{common.save}}.", nl: "Vul de naam in en, als u ze kent, het e-mailadres en het postadres. Klik op {{common.save}}." },
      ],
      result: { fr: "Le message {{contact.created}} s'affiche : le contact est créé et déjà choisi comme expéditeur.", nl: "Het bericht {{contact.created}} verschijnt: het contact is aangemaakt en al als afzender gekozen." },
      errors: [
        { problem: { fr: "Le contact existe peut-être déjà.", nl: "Het contact bestaat misschien al." }, solution: { fr: "Cherchez d'abord par le nom, l'adresse e-mail ou le numéro d'entreprise dans {{nav.contacts}} : un doublon complique la recherche.", nl: "Zoek eerst op naam, e-mailadres of ondernemingsnummer in {{nav.contacts}}: een dubbel bemoeilijkt het zoeken." } },
      ],
    },
  ],
  faq: [
    { q: { fr: "Pourquoi un collègue ne voit-il pas un courrier du service ?", nl: "Waarom ziet een collega een brief van de dienst niet?" }, a: { fr: "Le courrier est probablement {{mail.level.restreint}} ou {{mail.level.confidentiel}} : seules les personnes désignées le lisent, avec le secrétariat. Le niveau se vérifie et se change dans la fiche du courrier.", nl: "De brief is waarschijnlijk {{mail.level.restreint}} of {{mail.level.confidentiel}}: enkel de aangeduide personen lezen hem, samen met het secretariaat. Het niveau wordt in het dossier van de brief gecontroleerd en gewijzigd." } },
    { q: { fr: "Pourquoi la date de réception n'est-elle pas celle d'aujourd'hui ?", nl: "Waarom is de ontvangstdatum niet die van vandaag?" }, a: { fr: "Après un enregistrement, le formulaire reprend la date et le mode d'arrivée du courrier précédent pour accélérer la saisie d'un lot. Corrigez la date si ce courrier est arrivé un autre jour.", nl: "Na een inschrijving neemt het formulier de datum en de wijze van aankomst van de vorige brief over om een reeks sneller in te voeren. Corrigeer de datum als deze brief op een andere dag is aangekomen." } },
    { q: { fr: "Puis-je choisir le numéro ?", nl: "Kan ik het nummer kiezen?" }, a: { fr: "Non. L'application attribue toujours le numéro suivant, pour que le registre n'ait ni trou ni doublon.", nl: "Nee. De toepassing kent altijd het volgende nummer toe, zodat het register geen gaten of dubbels heeft." } },
  ],
  seeAlso: ["register", "inbox", "contacts"],
  shots: [
    { id: "registration-overview", path: "/enregistrer", marks: [{ sel: "form" }, { sel: ".ant-col-lg-8 .ant-card" }], caption: { fr: "Enregistrer un courrier", nl: "Een brief inschrijven" } },
  ],
};
export default topic;
