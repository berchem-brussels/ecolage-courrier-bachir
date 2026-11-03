# Historique des versions

Application courrier · version 0.2.7 · historique au 03/11/2026

## 0.2.7 du 03/11/2026, préparée, à installer et à recetter sur NIXUS

Aide par écran, première moitié (standard v3.3, section 13.1), reprise du gabarit 1.3.0 et adaptée aux rôles par entité. Troisième version du lot « connexion, tickets, aide ». Sans migration, aucune dépendance changée. Les repères numérotés et les captures annotées arrivent en 0.2.8 (E39).

- 14 fiches d'aide, une par écran du menu, FR et NL côte à côte : accueil, registre, à enregistrer, enregistrer, contacts, consultations, comptes, entités et registres, services, types de courrier, paramètres, tickets, centre d'aide, accessibilité. 40 procédures (cas d'usage, étapes, résultat, erreurs et solutions), 22 questions propres aux écrans, renvois entre fiches. Un bouton ou un menu se cite par sa clé de traduction : l'aide affiche le libellé réel, dans la langue de la personne.
- Bouton « Aide » dans l'en-tête commun de chaque écran : la fiche s'ouvre dans un panneau latéral, sans quitter l'écran, avec un lien vers le mode d'emploi complet.
- Centre d'aide `/help` : parcours par rôle (agent, responsable de service, secrétariat, gestionnaire du registre, auditeur, administrateur), choisi par défaut d'après les rôles de la personne ; « tout le mode d'emploi » ; recherche plein texte ; impression complète du mode d'emploi (procédures dépliées) ; contact du support en paramètre. Remplace l'ancienne page d'aide écrite en dur (guide et 7 questions, reprises dans les fiches).
- Explication de chaque champ, FR et NL, derrière l'icône « ? » : 79 explications pour les 91 champs à encoder de tous les formulaires (comptes, entités, services, types, contacts, enregistrement, fiche du courrier, mot de passe, paramètres, connexion, tickets). Elles disent quoi encoder et d'où vient la valeur.
- E23 (remarques d'information de Chrome) : `autoComplete` posé sur tous les champs de saisie, champ de fichier du cadre de dépôt nommé (`id` et `name`), contrôlé par un test statique. Les 10 remarques sur les titres de groupes de boutons restent (E23).
- Contrôles bloquants à chaque version : chaque route du menu a sa fiche ; fiches et écrans alignés ; au moins deux procédures de deux étapes ; aucune clé inconnue ; FR et NL différents ; aucune abréviation ni personne nommée ; parcours cohérents avec les rôles des fiches ; aucun champ sans explication ni explication de moins de 12 caractères ; aucune explication inutilisée ; aucun champ de saisie sans autocomplétion ; aucun HTML interprété.
- Correction d'un défaut de présentation constaté pendant les essais : le contenu d'un panneau d'aide fermé restait dans la page (identifiants en double avec le centre d'aide) ; il est maintenant retiré à la fermeture.
- Valeurs locales : aucune dans le code (le contrôle de portabilité a refusé un exemple de code postal local, remplacé).

Suites : serveur 110 tests, écrans 101 tests (un test de captures ignoré hors contrôle strict), 0 échec ; parcours réel dans Chromium (7 contrôles) ; 10 contrôles retirés un à un, tous détectés ; `npm audit --omit=dev` à 0 dans les deux parties.

## 0.2.6 du 03/11/2026, installée sur NIXUS et publiée sur GitHub le 03/11/2026

Tickets de l'application (standard v3.3, section 13.5), repris du gabarit 1.3.0 et adaptés aux rôles par entité. Deuxième version du lot « connexion, tickets, aide ». Migration 007. Aucune dépendance changée.

- Bouton « Signaler » dans l'en-tête de chaque écran : type (incident, bug, question métier, souhait), titre, ce que je faisais, ce que j'attendais et ce qui s'est passé (incident et bug), qui est touché, gravité, capture facultative contrôlée sur son contenu (PNG ou JPEG, 2 Mo). Contexte joint sans saisie : écran (par son identifiant), version, langue, navigateur, date, dernière erreur de l'API (code et libellé seulement).
- Référence `TCK-AAAA-NNNNN` par année ; priorité ITIL impact × urgence (P1 à P4) ; délais de prise en charge et de résolution par priorité (1 h et 8 h, 4 h et 24 h, 8 h et 72 h, 24 h et 240 h) ; échéance dépassée signalée ; cycle de vie contrôlé (nouveau, pris en charge, en attente du demandeur, résolu, rejeté, annulé, clos) avec motif obligatoire pour l'attente, la résolution, le rejet, l'annulation et la réouverture ; notes internes invisibles du demandeur ; rien n'est supprimé.
- Files par entité (décision du 03/11/2026) : le ticket porte l'entité du demandeur ; la file IT (incident, bug, souhait) est traitée par l'administrateur ; la file métier (question) est traitée par le gestionnaire du registre de l'entité du ticket, jamais d'une autre entité ; une question sans entité (administrateur seul) va à la file IT ; un demandeur qui a des rôles dans deux entités choisit l'entité pour une question. Transfert motivé d'une file à l'autre ; vers la file métier seulement avec une entité.
- Rôles de chaque file, délais et délai de réouverture réglables dans Administration › Paramètres › Tickets ; chaque changement s'inscrit au journal d'audit avec l'ancienne et la nouvelle valeur. Rôles possibles : administrateur (toute l'application) ou rôle par entité (dans l'entité du ticket).
- RGPD by design : aucune capture sur les écrans qui affichent du courrier (registre, à enregistrer, enregistrer, consultations), refusée aussi par le serveur ; avertissement ailleurs ; le chemin joint ne porte aucun paramètre ni numéro de courrier. Écart voulu au standard 13.5 (E35).
- Pilotage : compteurs (en cours, délai dépassé, sans responsable, résolus en 30 jours), volumes par type, priorité et écran, limités aux files de la personne.
- API et MCP : 8 routes de tickets et 2 de réglages ; 11 outils MCP dont `list_tickets_to_handle` (tickets à traiter avec leur contexte, limités aux files de la personne). 72 routes au total, 64 outils MCP exposés.
- nginx : bloc `/api/tickets` à 4 Mo ; le gabarit limite tout `/api/` à 1 Mo, ce qui refuserait une capture de plus de 0,7 Mo (E29, clos). Test du contenu de `nginx.conf` et capture de 2 Mo acceptée par le serveur.
- Interface : écran Tickets (menu Aide), tiroir de ticket avec fil d'échanges et actions selon le rôle et le statut, table `screens.ts` des écrans (identifiants repris par l'aide en 0.2.7), explication de chaque champ des tickets (FR et NL), groupes de boutons sans étiquette orpheline, champs nommés.
- Test statique SQL : liste des interpolations permises complétée par des constantes du code (colonnes de regroupement, clause des files).

Suites : serveur 110 tests, écrans 78 tests, 0 échec ; parcours réel dans Chromium (10 contrôles : demandeur, gestionnaire, administrateur) ; 11 contrôles de sécurité retirés un à un, tous détectés ; `npm audit --omit=dev` à 0 dans les deux parties.

## 0.2.5 du 03/11/2026, installée sur NIXUS et publiée sur GitHub le 03/11/2026

Connexion Microsoft compatible avec Portal (standard v3.3, section 8.6), reprise du gabarit 1.3.0. Première version du lot « connexion, tickets, aide » ; elle avance la partie code de l'étape 7 du planning. Migration 006. Le mode de connexion reste `local` tant que l'inscription d'application Entra ID n'est pas saisie : aucun changement pour les agents.

- Serveur : `oidc.js` (OpenID Connect sans bibliothèque : code d'autorisation avec PKCE S256, aucun paramètre `prompt` ni `max_age`, jeton d'identité vérifié en RS256 avec la clé publiée par Microsoft, émetteur, audience, expiration, `nonce`), `routes/sso.js` (configuration, départ, retour, réglages, test), `settings.js` (clés `auth.*`, secret client chiffré et jamais renvoyé).
- Départ automatique vers Microsoft en mode `sso`, retour à l'écran demandé (`next` gardé côté serveur, accepté seulement s'il commence par un seul `/` et ne contient que lettres, chiffres et `-._~/`), trois exceptions sans redirection : `/login?deconnecte=1`, `/login?erreur=<code>`, `/login?local=1`.
- Rattachement du compte par `oid` d'abord, par adresse ensuite ; compte inconnu ou désactivé refusé avec un message qui dit qui contacter ; un compte désactivé perd sa session aussitôt.
- Accès de secours : colonne `is_admin_local`, posée par l'installation et, par la migration 006, sur les administrateurs existants ; en mode `sso`, seuls ces comptes gardent le mot de passe. Passage en mode `sso` refusé tant qu'aucun administrateur actif ne peut se connecter ; même garde à chaque modification de compte (ajout au gabarit, test dédié).
- Interface : page de connexion (bouton Microsoft, messages d'erreur traduits), déconnexion vers `/login?deconnecte=1`, Administration › Paramètres › carte « Connexion » avec explication de chaque champ, bouton « Tester l'annuaire » (le standard 8.2 le prévoit, le gabarit non), colonne « Accès de secours » et rattachement Microsoft dans Utilisateurs.
- Défaut du gabarit corrigé (E30) : le retour après connexion locale acceptait `//site` (contrôle `startsWith('/')`), ce qui permettait une redirection vers un autre site ; contrôle identique à celui du serveur, avec test.
- Cookies : le cookie de session et le cookie d'état ne s'écrasent plus (`appendCookie`).
- `qs` 6.16.0 vers 6.16.2 par `npm update qs` seul (alerte d'audit parue après le 27/10/2026, E31). `permissions: contents: read` dans `ci.yml` (alerte CodeQL, E28).
- Nouveaux fichiers : voir `MANIFESTE.md`. Documentation : `docs/fr|nl|en/SSO.md`, `docs/fonctionnel/connexion.md`.

Suites : serveur 96 tests, écrans 67 tests, 0 échec ; parcours réel dans Chromium contre un faux Microsoft (11 contrôles) ; `npm audit --omit=dev` à 0 dans les deux parties ; audit complet de l'interface : 12 alertes modérées dans la chaîne `eslint` (outils de développement, E34).

## 0.2.4 du 27/10/2026, installée sur NIXUS et publiée sur GitHub le 27/10/2026

Correction d'un défaut de la 0.2.3 relevé à sa recette sur NIXUS. Aucune fonction nouvelle, aucune migration, aucune dépendance changée par rapport à la 0.2.3.

- Sélecteur de date : en 0.2.3 il s'affichait en anglais (« Select date »), au format mois/jour (`10/27/2026`), avec un calendrier en anglais dont la semaine commençait le dimanche. Corrigé : `27/10/2026` en français, `27-10-2026` en néerlandais, calendrier dans la langue de l'utilisateur, semaine commençant le lundi.
- Cause racine : `antd/locale/fr_FR.js` est un fichier CommonJS qui renvoie vers `lib/`. Avec `vite` 8, `ConfigProvider` n'a pas reçu la langue et est resté en anglais, alors que `vite` 5 lisait ce fichier correctement. Le mécanisme exact (lecture de l'import par défaut) n'est pas vérifié dans le code du moteur ; le correctif est établi par essai : `antd/es/locale/fr_FR` et `nl_NL`. Une première piste, l'import ESM de la langue de `dayjs`, n'avait aucun effet. Les tests passaient parce que vitest lit ces fichiers par Node : ils ne voient pas les défauts du moteur de construction.
- Nouveau test `imports.test.ts` (2 tests) : interdit les imports `antd/locale` et `antd/lib`. Il contrôle la cause et non le résultat ; il est en échec avec l'import de la 0.2.3.
- Test du dépôt : ne signale plus `tsconfig.tsbuildinfo`, déjà exclu par `.gitignore`, qui le faisait échouer après un `npm run build`.
- Contrôle avant livraison : textes de 11 pages et 22 captures comparés à la 0.2.2, en français et en néerlandais, avec le rôle de secrétariat : aucune différence.

Suites : serveur 82 tests, écrans 60 tests, 0 échec ; `npm audit` à 0 vulnérabilité dans les deux parties, production et complet.

## 0.2.3 du 27/10/2026, installée sur NIXUS le 27/10/2026, non publiée sur GitHub, remplacée par la 0.2.4

Mise à jour de dépendances, avec l'accord de Renaud du 27/10/2026 pour `multer` et `vite`. Aucune fonction nouvelle, aucune migration de base, aucun changement dans `src/`.

- `multer` 1.4.5-lts.2 vers 2.5.0 : Dependabot relevait 10 alertes de gravité haute (dénis de service) sur la génération 1.x, que `npm audit` ne signalait pas. 15 paquets de moins.
- `vite` 5.4.21 vers 8.3.5, `@vitejs/plugin-react` 4.7.0 vers 6.1.2 (imposé par `vite` 8) et `vitest` 4.1.10 vers 4.1.12. Les 15 alertes Dependabot de l'interface et les 4 de `npm audit` disparaissent : audit complet à 0.
- Cinq dépendances indirectes de l'interface suivent ces montées : `chai`, `tinyrainbow`, `picomatch`, `@types/estree`, `@jridgewell/sourcemap-codec`.
- Le verrou de l'interface est écrit par npm 11, car npm 10 s'arrête sur son erreur interne à l'installation (E19). `npm ci` sous npm 10 relit ce verrou et reconstruit.
- Notes de livraison de la 0.2.2 : la commande `ls` du dossier des sauvegardes prend `sudo`.
- `docs/SECURITE.md` : limite de `npm audit` sur `multer` ; `docs/*/ARCHITECTURE.md` : version de `multer`.

Suites : serveur 82 tests, écrans 58 tests, 0 échec ; `npm audit` à 0 vulnérabilité dans les deux parties, production et complet. Contrôle visuel sur l'interface construite derrière le `nginx.conf` livré : connexion et huit pages d'un administrateur sans erreur ni violation de politique de sécurité ; registre et file « À enregistrer » à contrôler à la recette.

## 0.2.2 du 27/10/2026, installée sur NIXUS le 27/10/2026

Préparation du dépôt public GitHub. Aucune fonction nouvelle, aucune migration de base, aucune dépendance ajoutée.

- Fichier `.github/workflows/ci.yml` conforme à la section 7 de GITHUB.md : à chaque demande de fusion et à chaque poussée sur `main`, GitHub Actions joue les suites du serveur (avec `npm audit --omit=dev --audit-level=high`) et de l'interface (tests, construction, accessibilité).
- `.gitignore` renforcé (`.env.*`, bases, sauvegardes, `*.tsbuildinfo`, documents internes) ; `.gitattributes` fixe les fins de ligne en LF.
- Documents de l'archive : l'adresse, les ports et les dossiers du serveur d'acceptance sont remplacés par des valeurs d'exemple ; les noms complets de personnes et un détail d'exploitation de l'hôte sont remplacés par des rôles ou retirés.
- `backup.sh` n'écrit plus le dossier de l'hôte : le dossier des sauvegardes est la variable `BACKUP_DIR` ou, par défaut, `backups/<APP_NAME>` deux niveaux au-dessus du dossier de l'application. Même emplacement qu'avant sur le serveur d'acceptance.
- Retirés de l'archive : `STANDARD.md`, le cahier des charges, `backend/instance/atelier.json` (services réels, gardé dans les fichiers du projet) et la capture `docs/captures/05-services.png` (noms de services réels).
- Verrou du serveur : `body-parser` 1.20.8 vers 1.20.9 (gravité haute) et `fast-uri` 3.1.8 vers 3.1.9 (modérée), avis parus après le 20/10/2026 ; `package.json` inchangé. Sans cela l'étape `npm audit` de la CI échouait.
- Test `portabilite.test.js` : l'adresse et le dossier qu'il interdit ne sont plus écrits en clair. Nouveau test `depot.test.js` (5 tests) : valeurs interdites, secrets, fichiers de base et d'instance, documents internes, `.gitignore`, `ci.yml`.

Suites : serveur 82 tests, écrans 58 tests, 0 échec ; `npm audit --omit=dev` à 0 vulnérabilité dans les deux parties.

## 0.2.1 du 20/10/2026

Corrections relevées à la recette de la 0.2.0 sur NIXUS le 20/10/2026. Aucune fonction nouvelle, aucune migration de base.

- Un fichier d'un type refusé, glissé dans le cadre de dépôt ou choisi par clic, est maintenant envoyé au serveur et s'affiche avec la raison du refus, par exemple « Fichier TIFF refusé : réglez le copieur pour produire des PDF. ». Avant, il était écarté sans message.
- Les étiquettes des groupes de boutons (mode d'arrivée, type de courrier, langue, urgence, type de contact, rôles et mot de passe d'un compte) ne visent plus un élément qui n'est pas un champ ; chaque groupe porte son nom pour les lecteurs d'écran. Défaut présent depuis la 0.1.0.
- Le registre affiche le trombone et le nombre de fichiers dès qu'un fichier est ajouté depuis la fiche, sans rechargement de la page.
- File « À enregistrer » : l'annonce « Courrier enregistré avec son fichier » s'efface au dépôt suivant et au rejet d'un fichier.

Suites : serveur 77 tests, écrans 58 tests, 0 échec ; `npm audit --omit=dev` à 0 vulnérabilité.

## 0.2.0 du 20/10/2026, installée sur NIXUS le 20/10/2026

Étape 2 du planning : fichiers du courrier entrant et journal des consultations.

- File « À enregistrer » par entité : dépôt de fichiers PDF, JPEG et PNG par glisser-déposer ou par sélection, aperçu à côté du formulaire d'enregistrement, passage au fichier suivant sans revenir à la liste.
- Type de fichier vérifié sur son contenu ; un TIFF est refusé avec un message qui renvoie au réglage PDF des copieurs (D-24). Taille maximale de 50 Mo par fichier, réglable dans Administration › Paramètres (D-23). Un fichier refusé reste affiché avec sa raison.
- L'enregistrement joint le fichier au numéro attribué, dans la même opération ; un fichier déposé par erreur se rejette avec un motif.
- Fiche du courrier : fichiers dans un lecteur à côté des informations, ouverture dans un onglet, téléchargement, ajout d'un fichier à un courrier déjà enregistré. Trombone et nombre de fichiers dans le registre.
- Journal des consultations : chaque ouverture de fiche et chaque lecture de fichier, par l'écran ou par un assistant IA ; lisible par l'auditeur de l'entité, sans contenu du courrier.
- Nouvel écran Administration › Paramètres.
- API et outils MCP des fichiers, du journal et des paramètres ; contrat OpenAPI à jour.
- Serveur sous l'utilisateur `appuser` (10001) au lieu de `node` (1000) ; le volume de données change de propriétaire une seule fois au déploiement.
- `frontend/src/settings.ts` passe par `api.ts`, seul point d'accès à l'API.
- Corrigé : en thème sombre, le bouton choisi d'un groupe de boutons (mode d'arrivée, type, langue) était peu lisible ; défaut présent depuis la 0.1.0.
- Nouvelle dépendance du serveur : `multer` 1.4.5-lts.2, prévue par la section 4.2 du standard. Outils de développement mis à jour dans leur génération : `@babel/core`, `nanoid`, `postcss`, `undici`.
- Migration `005_pieces_consultations`.

Suites : serveur 77 tests, écrans 40 tests, 0 échec ; `npm audit --omit=dev` à 0 vulnérabilité.

## 0.1.1 du 13/10/2026, installée sur NIXUS le 20/10/2026

Corrections relevées à l'écran lors de la recette de la 0.1.0 sur NIXUS, et décisions du 13/10/2026.

- Onglet du navigateur au nom de l'application de l'instance (« Courrier », « Briefwisseling ») au lieu de « Application ».
- Écran Entités et registres : premier cadre intitulé « Entités ».
- Nom de l'administration sur deux lignes dans le menu, sans coupure.
- Le menu se met à jour dès qu'un administrateur modifie ses propres rôles, sans recharger la page.
- Création d'un compte : seul le bouton « Fermer » reste une fois le mot de passe affiché.
- Néerlandais : entrée de menu « Inkomende post » ; le titre complet reste dans la page.
- `react-router-dom` monté de 6.30 à 7.18.4, avec l'accord de Renaud : les trois vulnérabilités modérées disparaissent.
- Services : noms NL validés tels quels ; RD devient « Recherche et développement (RD) », SCAD « Service achat (SCAD) ».
- Script d'atelier : un service existant se met à jour par son ancien nom (champ `match`), sans doublon ; un test l'établit.
- Aucune migration de base.

Suites : serveur 57 tests, écrans 30 tests, 0 échec ; `npm audit --omit=dev` à 0 vulnérabilité.

## 0.1.0 du 13/10/2026, installée sur NIXUS le 13/10/2026

Première version de l'application, étape 1 du planning, construite sur le gabarit v3 1.1.0.

- Entités AC et CPAS, quatre registres (entrées et départs) chargés depuis la configuration, modifiables dans l'administration ; préfixe figé dès le premier numéro attribué.
- Rôles par entité : agent, responsable de service, secrétariat, gestionnaire du registre, auditeur. Un rôle à l'AC ne donne aucun droit au CPAS. L'administrateur n'accède pas au contenu du courrier sans rôle de registre.
- Services destinataires, communs possibles aux deux entités, avec service parent et nom NL facultatif ou marqué « à valider ».
- Types de courrier propres à chaque entité.
- Contacts communs, avec recherche pendant la frappe et création depuis le formulaire d'enregistrement.
- Enregistrement du courrier entrant sans pièce : numéro attribué par le serveur dans une transaction, selon l'année de la date de réception (D-20) ; enregistrement en série avec compteur de séance.
- Registre des entrées avec recherche et filtres gardés dans l'adresse, fiche du courrier, correction des champs permis, annulation avec motif.
- API REST et outils MCP pour les six ressources ; annulation en deux appels MCP.
- Données d'atelier chargées par une commande (`scripts/donnees-atelier.js`), refusée quand `APP_ENVIRONMENT=production`.
- Nouvelle variable `APP_ENVIRONMENT` dans `.env` ; étiquette « Acceptance : données fictives » dans l'en-tête.
- Écarts du gabarit corrigés : sauvegarde du dossier de données entier, colonnes d'auteur sur les comptes, dossier `docs/` et fichiers de suivi, rôles par entité, procédure en `bash backup.sh`, en-tête en 360 à 991 px, couleur des liens.

Suites : serveur 56 tests, écrans 30 tests, 0 échec ; audit serveur 0 vulnérabilité, interface 3 modérées (closes en 0.1.1).
