# Historique des versions

Application courrier · version 0.2.4 · historique au 27/10/2026

## 0.2.4 du 27/10/2026

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
