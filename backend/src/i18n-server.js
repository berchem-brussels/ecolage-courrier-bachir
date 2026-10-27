/** Dictionnaire des textes produits par le serveur (patron STEGA utils/i18n-server.js). FR et NL obligatoires. */
const MESSAGES = {
  NO_TOKEN: { fr: 'Connexion requise.', nl: 'Aanmelding vereist.' },
  BAD_TOKEN: { fr: 'Session invalide ou expirée.', nl: 'Ongeldige of verlopen sessie.' },
  CSRF: { fr: 'Requête refusée : en-tête de sécurité absent.', nl: 'Aanvraag geweigerd: beveiligingsheader ontbreekt.' },
  FORBIDDEN: { fr: 'Droits insuffisants.', nl: 'Onvoldoende rechten.' },
  NOT_FOUND: { fr: 'Élément introuvable.', nl: 'Element niet gevonden.' },
  VALIDATION: { fr: 'Données invalides.', nl: 'Ongeldige gegevens.' },
  LOGIN_FAILED: { fr: 'Identifiants incorrects.', nl: 'Ongeldige aanmeldgegevens.' },
  TOO_MANY: { fr: 'Trop de tentatives. Réessayez plus tard.', nl: 'Te veel pogingen. Probeer later opnieuw.' },
  BAD_PASSWORD: { fr: 'Mot de passe actuel incorrect.', nl: 'Huidig wachtwoord onjuist.' },
  INSTALL_CLOSED: { fr: "L'installation est déjà faite.", nl: 'De installatie is al uitgevoerd.' },
  TRANSITION: { fr: "Ce changement de statut n'est pas permis.", nl: 'Deze statuswijziging is niet toegestaan.' },
  CANCELLED: { fr: 'Élément annulé : plus de modification possible.', nl: 'Geannuleerd element: geen wijziging meer mogelijk.' },
  DUPLICATE: { fr: 'Cette adresse est déjà utilisée.', nl: 'Dit adres wordt al gebruikt.' },
  LAST_ADMIN: { fr: 'Le dernier administrateur actif ne peut être ni désactivé ni rétrogradé.', nl: 'De laatste actieve beheerder kan niet worden gedeactiveerd of gedegradeerd.' },
  CONFIRMATION: { fr: 'Jeton de confirmation absent, expiré ou déjà utilisé.', nl: 'Bevestigingstoken ontbreekt, is verlopen of al gebruikt.' },
  CODE_USED: { fr: 'Ce code ou ce préfixe est déjà utilisé.', nl: 'Deze code of dit prefix wordt al gebruikt.' },
  REGISTER_EXISTS: { fr: 'Cette entité a déjà un registre dans ce sens.', nl: 'Deze entiteit heeft al een register in die richting.' },
  REGISTER_IN_USE: { fr: 'Des numéros ont déjà été attribués dans ce registre : préfixe et nombre de chiffres ne changent plus.', nl: 'Er werden al nummers toegekend in dit register: prefix en aantal cijfers kunnen niet meer wijzigen.' },
  REGISTER_MISSING: { fr: "Aucun registre d'entrée actif pour cette entité.", nl: 'Geen actief ingangsregister voor deze entiteit.' },
  TYPE_INVALID: { fr: "Ce type de courrier n'existe pas, n'est plus actif ou appartient à une autre entité.", nl: 'Dit brieftype bestaat niet, is niet meer actief of hoort bij een andere entiteit.' },
  CONTACT_INVALID: { fr: "Ce contact n'existe pas ou n'est plus actif.", nl: 'Dit contact bestaat niet of is niet meer actief.' },
  DATE_FUTURE: { fr: 'La date ne peut pas être dans le futur.', nl: 'De datum mag niet in de toekomst liggen.' },
  DATE_INVALID: { fr: 'Date invalide.', nl: 'Ongeldige datum.' },
  SERVICE_ENTITY_REQUIRED: { fr: 'Un service appartient à une entité au moins.', nl: 'Een dienst hoort bij minstens één entiteit.' },
  PARENT_INVALID: { fr: 'Ce service parent créerait une boucle.', nl: 'Deze bovenliggende dienst zou een lus vormen.' },
  FILE_MISSING: { fr: 'Aucun fichier reçu.', nl: 'Geen bestand ontvangen.' },
  FILE_EMPTY: { fr: 'Le fichier est vide.', nl: 'Het bestand is leeg.' },
  FILE_TOO_LARGE: { fr: 'Fichier trop volumineux. La taille maximale est indiquée dans le détail.', nl: 'Bestand te groot. De maximale grootte staat in de details.' },
  FILE_TYPE: { fr: 'Type de fichier refusé. Seuls les PDF, JPEG et PNG sont acceptés.', nl: 'Bestandstype geweigerd. Enkel PDF, JPEG en PNG worden aanvaard.' },
  FILE_TIFF: { fr: 'Fichier TIFF refusé : réglez le copieur pour produire des PDF.', nl: 'TIFF-bestand geweigerd: stel het kopieertoestel in om PDF te maken.' },
  FILE_LOST: { fr: 'Le fichier de cette pièce est introuvable sur le serveur. Prévenez le support.', nl: 'Het bestand van dit stuk is niet te vinden op de server. Verwittig de support.' },
  PIECE_UNAVAILABLE: { fr: "Ce fichier n'est plus dans la file : il a été enregistré ou rejeté entre-temps.", nl: 'Dit bestand staat niet meer in de wachtrij: het werd intussen geregistreerd of geweigerd.' },
  PIECE_ATTACHED: { fr: 'Ce fichier est joint à un courrier : il ne se rejette pas.', nl: 'Dit bestand is bij een brief gevoegd: het kan niet geweigerd worden.' },
  PIECE_TOO_LARGE_MCP: { fr: 'Fichier trop volumineux pour une lecture par un assistant. Ouvrez-le dans l’application.', nl: 'Bestand te groot om door een assistent te laten lezen. Open het in de toepassing.' },
  INTERNAL: { fr: 'Erreur interne. Elle a été enregistrée.', nl: 'Interne fout. Ze werd geregistreerd.' },
  BAD_JSON: { fr: 'Contenu illisible : JSON invalide.', nl: 'Onleesbare inhoud: ongeldige JSON.' },
  PAYLOAD_TOO_LARGE: { fr: 'Contenu trop volumineux.', nl: 'Inhoud te groot.' },
  REFERENCE_INVALID: { fr: "Référence vers un élément inexistant ou encore utilisé.", nl: 'Verwijzing naar een onbestaand of nog gebruikt element.' },
};

function langOf(req) {
  if (req && req.user && req.user.lang) return req.user.lang;
  const h = (req && req.headers && req.headers['accept-language']) || '';
  return /^nl/i.test(h) ? 'nl' : 'fr';
}

function L(lang, code) {
  const m = MESSAGES[code];
  if (!m) return code;
  return m[lang] || m.fr;
}

module.exports = { MESSAGES, L, langOf };
