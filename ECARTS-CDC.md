# Écarts mesurés

Application courrier · version 0.2.4 · écarts au 27/10/2026

Écarts entre le code livré, le cahier des charges (CDC, version 0.10) et le standard v3.2. Numérotation continue d'une version à l'autre ; un écart clos reste dans la liste avec sa date.

## 1. Écarts ouverts

| # | Exigence | Écart | Suite prévue |
| --- | --- | --- | --- |
| E1 | CE-044 | La date de réception ne se corrige pas après l'enregistrement | Correction avec motif, étape 6 |
| E2 | CR-002, A12 | Visibilité limitée au secrétariat et au gestionnaire de l'entité : l'attribution n'existe pas encore | Étape 3 |
| E3 | CE-002 | Choix de l'entité par des boutons dans l'écran (gardé dans l'adresse), pas encore dans l'en-tête | Étape 5 |
| E5 | CI-001 | Comptes locaux seulement | Étape 7 |
| E6 | CN-001 | `sql.js` au lieu de PostgreSQL 16 | Étape 8, avant toute donnée réelle |
| E7 | Standard 7.4, CA-003 | MCP écrit à la main dans le processus de l'API, session ou jeton porteur, sans OAuth 2.1 ni SDK | Patron admis avec `sql.js` ; transport à revoir à l'étape 8, OAuth à l'étape 21 |
| E9 | CE-151 | Pas encore de raccourcis clavier | Étape 6 |
| E10 | CR-022, D-22 | Service qui enregistre le courrier du CPAS pas encore désigné | Avant l'étape 13 |
| E12 | CL-003 | Libellés NL des types de courrier fictifs marqués « à valider » | Types réels à définir avec l'utilisatrice clé de l'AC (I-04) |
| E13 | CN-007 | Documentation technique NL et EN limitée à `docs/nl/ARCHITECTURE.md` et `docs/en/ARCHITECTURE.md` ; la version NL est une traduction de Claude à faire relire | Complétée à chaque étape, entière avant la 1.0.0 |
| E16 | Standard 4.3 | `@typescript-eslint/parser` 7, nécessaire à eslint pour lire le TSX, n'est pas listé dans la section 4.3 ; il vient du gabarit | À inscrire au standard ou à remplacer, décision de Renaud |
| E18 | Standard 13.1, 17.8 | Pas de note de version affichée aux utilisateurs à la première connexion après une mise à jour | À construire dans une étape à fixer |
| E21 | CA-003 | Dépôt d'un fichier par un assistant IA limité à environ 190 ko, à cause de la limite de 256 ko du corps JSON du MCP | À revoir avec le transport MCP (étapes 8 et 21) |
| E22 | CE-030 | Un fichier refusé s'affiche avec sa raison à l'écran de dépôt, sans être gardé dans la file ; la file gardera les refus des boîtes partagées et des copieurs | Étape 12 |
| E23 | Standard 12, accessibilité | Chrome (outils de développement, onglet « Issues ») relève 20 remarques d'information, sans erreur ni avertissement : 10 « No label associated with a form field », conséquence de la correction de la 0.2.1 (titres des groupes de boutons restés en élément `<label>` sans champ associé, le nom accessible venant de `aria-label`) ; 8 « An element doesn't have an autocomplete attribute » ; 2 « A form field element should have an id or name attribute » (champ de fichier caché du cadre de dépôt, probablement) | Début de la 0.3.0, avec un test ; décision du conducteur du projet du 27/10/2026 |
| E24 | Standard 14.4 et 15.3 (règle 2), GITHUB.md section 6 | Dans l'archive, devenue publique, les documents et notes de livraison portent des valeurs d'exemple au lieu de l'adresse, des ports et des dossiers de NIXUS ; `STANDARD.md`, le cahier des charges et le fichier d'instance en sont retirés. Les commandes des notes ne sont donc plus exécutables telles quelles | Écart voulu par GITHUB.md : les vraies valeurs se donnent dans le message de livraison et les fichiers du projet |
| E25 | Standard 10.2 | CodeQL (GitHub) signale 10 alertes de gravité haute « Uncontrolled data used in path expression » dans `backend/src/services/pieces.js` et `routes/pieces.js`. Lecture du code le 27/10/2026 : les noms des fichiers temporaires et des fichiers rangés sont générés par le serveur, `absolutePath()` vérifie la racine, le nom d'origine ne sert pas de chemin ; faux positifs probables, non confirmés par une attaque rejouée | Alertes laissées ouvertes ; confirmation et décision de fermeture avec Renaud |
| E26 | Standard 4.4 | Le 27/10/2026, `npm audit fix --omit=dev` a été lancé sur le serveur pour préparer la 0.2.2, commande que le standard interdit ; deux dépendances indirectes ont monté sans l'accord de Renaud : `body-parser` 1.20.8 vers 1.20.9 et `fast-uri` 3.1.8 vers 3.1.9, même génération, `package.json` inchangé, écart du verrou relevé par comparaison | Signalé à Renaud par courriel ; confirmer le maintien ou retirer ces deux montées dans la version suivante ; règle : paquet par paquet par `npm update <paquet>` |
| E27 | Standard 4.2, 4.3, 4.4, 18 | `multer` ^2.5.0, `vite` ^8.3.5, `@vitejs/plugin-react` ^6.1.2 et `vitest` ^4.1.12 au lieu de `multer` ^1.4.5-lts.1, Vite 5 et `@vitejs/plugin-react` 4 du standard ; montée de majeure acceptée par Renaud le 27/10/2026 pour `multer` et `vite`, `@vitejs/plugin-react` 6 non nommé ; verrou de l'interface écrit par npm 11 | Standard à mettre à jour par Renaud (4.2, 4.3, 4.4, liste de la section 18) ; accord sur `@vitejs/plugin-react` 6 à confirmer |

## 2. Écarts clos

| # | Exigence | Écart | Clôture |
| --- | --- | --- | --- |
| E4 | CL-003 | Noms NL des services proposés par Claude et marqués « à valider » | 13/10/2026 : noms validés tels quels par le conducteur du projet ; mention retirée en 0.1.1 |
| E8 | Standard 4.3 et 10.2 | `npm audit` de l'interface : 3 vulnérabilités modérées dans `react-router-dom` 6 | 13/10/2026 : accord de Renaud ; `react-router-dom` 7.18.4 en 0.1.1, 0 vulnérabilité. Écart au stack consigné : la section 4.3 du standard cite `^6.28.0` |
| E11 | CE-020, CE-025, CE-124, CG-003, CG-005 | Aucune pièce, pas de file « À enregistrer », pas de journal des consultations | 20/10/2026 : livrés en 0.2.0 |
| E14 | Standard 14.5 | `APRES-DEPLOIEMENT.md` absent de `docs/` de l'archive | 20/10/2026 : `docs/APRES-DEPLOIEMENT.md` en 0.2.0 |
| E15 | Standard 5 et 10.2 | Serveur sous `node` (1000) au lieu d'`appuser` (10001) | 20/10/2026 : `appuser` en 0.2.0 ; `id -u` égal à `10001` relevé sur NIXUS le 20/10/2026 |
| E17 | Standard 4.4 | `vitest` 4 installait `vite` 8.1.5 pour lui-même à côté de `vite` 5.4.21 | 27/10/2026 : `vite` 8.3.5 partout dans la 0.2.3 (accord de Renaud) ; à confirmer à la recette |
| E19 | Standard 10.2 | Audit complet de l'interface : vulnérabilités dans les outils de développement ; `npm install` de `vitest` bloqué par l'erreur interne de npm 10 | 27/10/2026 : `vite` 8.3.5, `@vitejs/plugin-react` 6.1.2 et `vitest` 4.1.12 par npm 11, audit complet à 0 dans la 0.2.3 ; la panne de npm 10 subsiste, d'où le verrou écrit par npm 11 ; à confirmer à la recette |
| E20 | Standard 4.2 | `multer` 1.4.5-lts.2 : génération 1.x dépréciée, 10 alertes hautes de Dependabot que `npm audit` ne signalait pas | 27/10/2026 : `multer` 2.5.0 dans la 0.2.3 (accord de Renaud), 82 tests serveur sur 82 ; à confirmer à la recette |

## 3. Écarts du gabarit 1.1.0 corrigés

| # | Écart du gabarit | Correction | Version |
| --- | --- | --- | --- |
| G1 | `backup.sh` copiait la base seule (standard 15.6) | Archive du dossier `/app/data` entier | 0.1.0 |
| G2 | Procédure en `sh backup.sh` (standard 15.4 : `bash`) | Script POSIX appelé par `bash` | 0.1.0 |
| G3 | Table `users` sans auteur de création et de modification (standard 7.1) | Colonnes `created_by`, `updated_by` | 0.1.0 |
| G4 | Ni `docs/`, ni `ETAT.md`, ni `ECARTS-CDC.md` (standard 6.3) | Créés | 0.1.0 |
| G5 | Rôles globaux seulement | Table `user_roles`, un rôle par entité | 0.1.0 |
| G6 | En-tête trop large de 360 à 991 px ; liens en bleu d'Ant Design au lieu de la couleur de l'institution | Thème et nom dans le menu de l'utilisateur sous 992 px ; `colorLink` réglé | 0.1.0 |
| G7 | Onglet du navigateur intitulé « Application » ; nom de l'organisation coupé dans le menu ; bouton « Annuler » après création d'un compte | Titre de l'onglet suivant le nom de l'instance ; nom sur deux lignes ; seul « Fermer » | 0.1.1 |

## 4. Défauts relevés en recette et corrigés

| Version relevée | Défaut | Corrigé en |
| --- | --- | --- |
| 0.1.0 | Onglet « Application » au lieu de « Courrier » | 0.1.1 |
| 0.1.0 | Premier cadre de l'écran Entités et registres intitulé comme la page | 0.1.1 |
| 0.1.0 | Nom de l'administration coupé dans le menu | 0.1.1 |
| 0.1.0 | Menu non rafraîchi après modification de ses propres rôles | 0.1.1 |
| 0.1.0 | Bouton « Annuler » après la création d'un compte | 0.1.1 |
| 0.1.0 | « Register van inkomende post » coupé dans le menu NL | 0.1.1 (« Inkomende post ») |
| 0.1.1, relevé au contrôle de la 0.2.0 | Thème sombre : bouton choisi d'un groupe de boutons écrit dans la couleur de l'institution, contraste 2,3 | 0.2.0 (couleur de texte du thème sombre, contraste 7,02) |
| Contrôle de la 0.2.0 | Nom accentué d'un fichier déformé (« PiÃ¨ce ») par `multer` 1.x | 0.2.0 (nom relu en UTF-8, test) |
| Contrôle de la 0.2.0 | Navigation de la file sur trois lignes à 360 px | 0.2.0 |
| Contrôle de la 0.2.0 | « Journal des consultations » coupé dans le menu | 0.2.0 (« Consultations ») |
| Recette de la 0.2.0 sur NIXUS | Fichier TIFF glissé dans le cadre : écarté sans message par le filtre « accept » du composant de dépôt, avant tout envoi. Le contrôle visuel du bac à sable passait par le champ caché, qui contourne ce filtre | 0.2.1 (filtre retiré ; test d'écran par un vrai dépôt) |
| Recette de la 0.2.0 sur NIXUS | Huit signalements « Incorrect use of <label for> » dans Chrome : étiquettes des groupes de boutons visant un bloc `div` (présent depuis la 0.1.0) ; axe-core ne contrôle pas ce cas | 0.2.1 (12 étiquettes corrigées dans cinq formulaires ; test sur tous les écrans) |
| Recette de la 0.2.0 sur NIXUS | Trombone absent du registre après l'ajout d'un fichier depuis la fiche, jusqu'au rechargement | 0.2.1 |
| Recette de la 0.2.0 sur NIXUS | Mention « Valeur livrée » absente sous les champs des Paramètres sur une capture prise pendant la saisie, présente après F5 | Non reproduit, ni dans le bac à sable ni sur NIXUS le 27/10/2026 (enregistrement sans changement) ; clos |
| Recette de la 0.2.3 sur NIXUS | Sélecteur de date en anglais : « Select date », format mois/jour (`10/27/2026`), calendrier en anglais commençant le dimanche, en français comme en néerlandais. Cause : import de la langue d'Ant Design par un fichier CommonJS, mal lu sous `vite` 8. Les tests passaient : ils tournent sous Node | 0.2.4 (`antd/es/locale/`, test des imports, comparaison des pages avec la 0.2.2) |
