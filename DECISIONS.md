# Décisions et actions

Application courrier · version 0.2.7 · journal au 03/11/2026

Ce fichier réunit les décisions prises pendant le développement, les règles de travail convenues avec le conducteur du projet et les actions à faire. Les décisions de périmètre du 13/10/2026 (A1 à A12) sont dans le cahier des charges, section 2.

## 1. Décisions

| Date | Sujet | Décision | Qui |
| --- | --- | --- | --- |
| 13/10/2026 | Nom de code, dossier, ports | « courrier », `/srv/docker/courrier`, ports 8450 (HTTPS) et 8090 (HTTP redirigé) | Conducteur du projet |
| 13/10/2026 | Numérotation au changement d'année (D-20) | Année de la date de réception | Conducteur du projet |
| 13/10/2026 | Données d'atelier | Services réels (noms seuls), types et contacts fictifs marqués « Fictif » ; chargés par `scripts/donnees-atelier.js`, refusé en production | Conducteur du projet |
| 13/10/2026 | Source des services | L'organigramme Microsoft 365 fait foi ; les OU de l'AD ne sont pas à jour ; « Synergie » = services communs AC et CPAS | Conducteur du projet |
| 13/10/2026 | Liste des services | 24 services (cahier des charges, section 8.1) | Conducteur du projet |
| 13/10/2026 | Noms NL des services | Validés tels quels, sans relecture supplémentaire | Conducteur du projet |
| 13/10/2026 | RD et SCAD | RD = Recherche et développement (Onderzoek en Ontwikkeling), CPAS ; SCAD = Service achat (Aankoopdienst), commun ; modifiables à l'écran | Conducteur du projet |
| 13/10/2026 | `react-router-dom` 7 | Accord pour la montée de version majeure (7.18.4) | Renaud |
| 13/10/2026 | Tâches de PILOT désactivées sur NIXUS | Ne rien toucher | Conducteur du projet |
| 13/10/2026 | Panne de la notification par courriel de NIXUS | Notée comme point ouvert hors application, bloquant avant une production | Conducteur du projet |
| 13/10/2026 | Construction de l'interface | Sur le NAS (méthode SAGA), la durée mesurée le permet | Claude, mesures du 13 et du 20/10/2026 |
| 20/10/2026 | Suite du développement | Nouvelle conversation dans le même projet, à partir de la 0.1.1 | Conducteur du projet |
| 20/10/2026 | Taille maximale d'un fichier (D-23) | 50 Mo par fichier, paramètre réglable de 1 à 50 Mo dans Administration › Paramètres ; 50 Mo est le plafond technique de nginx | Conducteur du projet |
| 20/10/2026 | Format des scans (D-24) | Copieurs réglés en PDF ; PDF, JPEG et PNG acceptés, TIFF refusé avec sa raison | Conducteur du projet |
| 20/10/2026 | Version de `multer` | 1.4.5-lts.2, dans la génération du standard ; dépréciation annoncée par l'éditeur notée en point de vigilance (écart E20) | Conducteur du projet |
| 20/10/2026 | Fichier déposé par erreur dans la file | Rejet avec motif ; le fichier reste jusqu'à la purge de l'étape 12 | Conducteur du projet |
| 20/10/2026 | Fichiers d'un courrier enregistré | Ajout permis au secrétariat et au gestionnaire, au journal d'audit ; retrait à l'étape 6 | Conducteur du projet |
| 20/10/2026 | Écarts relevés au début de l'étape 2 | Serveur passé en `appuser` (10001) ; `settings.ts` par `api.ts` ; parseur eslint, Vite 8 de Vitest et note de version consignés ; neuf outils de développement à mettre à jour dans leur génération | Conducteur du projet |
| 20/10/2026 | `vitest` 4.1.11 | Montée abandonnée après une erreur interne de npm 10 ; verrou restauré, écart E19 | Claude, mesure du 20/10/2026 |
| 20/10/2026 | Recette de la 0.2.0 sur NIXUS | 12 points conformes sur 13 dans la liste de contrôle, et les deux contrôles réservés à NIXUS (`id -u` égal à 10001, fichiers dans la sauvegarde) ; défauts corrigés en 0.2.1 | Conducteur du projet |
| 20/10/2026 | Annonce du dernier enregistrement dans la file | Effacée au dépôt suivant et au rejet d'un fichier. Proposition de Claude retenue par défaut, le « go » de la 0.2.1 ayant été donné sans autre réponse ; réversible à la recette | Conducteur du projet |
| 27/10/2026 | Recette de la 0.2.1 sur NIXUS | Tous les points conformes : TIFF refusé avec sa raison, annonce effacée au dépôt suivant, registre mis à jour sans rechargement, aucune erreur d'étiquette dans Chrome, mention « Valeur livrée » présente | Conducteur du projet |
| 27/10/2026 | 20 remarques d'information de Chrome (E23) | Traitées au début de la 0.3.0, pas de 0.2.2 | Conducteur du projet |
| 20/10/2026 | Menu de l'auditeur | Libellé « Consultations » dans le menu, titre complet dans la page, comme « Inkomende post » en 0.1.1 | Claude, contrôle visuel du 20/10/2026 |
| 27/10/2026 | Version 0.2.2 | Version sans changement fonctionnel qui prépare le dépôt public (`ci.yml`, `.gitignore`, valeurs d'exemple) ; la correction E23 reste au début de la 0.3.0 | Conducteur du projet (« Continuer » du 27/10/2026) |
| 27/10/2026 | Contenu de l'archive publique | Retirés : `STANDARD.md` (constats de sécurité des autres applications), cahier des charges, `backend/instance/atelier.json` (services réels), capture des services ; noms complets remplacés par des rôles, prénom de Renaud conservé ; détail de la panne de notification de NIXUS retiré. Proposition de Claude retenue par défaut | Conducteur du projet (« Continuer » du 27/10/2026) |
| 27/10/2026 | Valeurs d'exemple dans le dépôt | `192.0.2.10`, `/srv/docker/courrier`, `/srv/backups/courrier`, ports 8450 et 8090 ; noms de conteneurs et nom « NIXUS » conservés ; vraies valeurs dans les messages de livraison et les fichiers du projet | Conducteur du projet (« Continuer » du 27/10/2026) |
| 27/10/2026 | Verrou du serveur | `body-parser` 1.20.9 et `fast-uri` 3.1.9 par `npm audit fix`, `package.json` inchangé : l'étape `npm audit` de la CI échouait sur deux avis parus depuis le 20/10/2026 | Claude, mesure du 27/10/2026 ; commande interdite par le standard 4.4, signalée à Renaud (E26) |
| 27/10/2026 | Dossier des sauvegardes | `backup.sh` le déduit du dossier de l'application (`backups/<APP_NAME>` deux niveaux au-dessus) ; même emplacement sur NIXUS, à contrôler après la mise à jour | Claude, à vérifier sur NIXUS |
| 27/10/2026 | Recette de la 0.2.2 sur NIXUS | Version, données, fiche et fichiers, écran de dépôt, dossier des sauvegardes : conformes | Conducteur du projet |
| 27/10/2026 | Premier envoi sur GitHub | Le dépôt n'existait pas et a été créé à la main ; son premier commit automatique (README) a été écrasé par `git push --force`, sans autre contenu perdu ; publication `v0.2.2` avec l'archive | Conducteur du projet, option A proposée par Claude |
| 27/10/2026 | Dependabot | Demandes de fusion #1 et #2 laissées ouvertes : `vite` et `vitest` hors de leur génération demandent l'accord de Renaud (E17, E19) | Claude, proposition ; à confirmer |
| 27/10/2026 | Protection de `main` | Règle `protection-main` active : demande de fusion obligatoire (0 approbation), travail « tests » au vert obligatoire, suppression et `--force` interdits, liste de contournement vide | Conducteur du projet |
| 27/10/2026 | Signalements de sécurité GitHub | 38 alertes : 0 secret, 28 Dependabot (10 hautes sur `multer`, 15 sur les outils de développement), 10 CodeQL ; rien n'est fermé ni fusionné ; décisions à prendre avec Renaud (E17, E19, E20, E25) | Claude, constat ; Conducteur du projet |
| 27/10/2026 | Réponse de Renaud sur les alertes de sécurité | 1. `multer` 2.x accepté, avec un courriel donnant les raisons précises et l'impact sur le standard ; la généralisation aux autres applications se décidera « pour du vrai ». 2. « Idem » pour `vite` et `vitest`, lu par le conducteur du projet comme un oui. 3. Alertes CodeQL à revérifier après la mise en production | Renaud |
| 27/10/2026 | Version 0.2.3 | Mise à jour de dépendances sans changement fonctionnel : `multer` ^2.5.0, `vite` ^8.3.5, `@vitejs/plugin-react` ^6.1.2, `vitest` ^4.1.12 ; numéro 0.2.3, la 0.3.0 reste l'étape 3 ; construction avec `--no-cache` | Conducteur du projet (« go » du 27/10/2026) |
| 27/10/2026 | Verrou de l'interface | Écrit par npm 11, car npm 10 s'arrête sur l'erreur interne à l'installation ; `npm ci` sous npm 10 relit ce verrou et reconstruit (mesuré) ; les images gardent npm 10 | Claude, mesure du 27/10/2026 |
| 27/10/2026 | `@vitejs/plugin-react` 6 | Imposé par `vite` 8 (la 4.7.0 refuse `vite` 8) ; non nommé dans le courriel à Renaud ; accord à confirmer | Claude, mesure ; à confirmer par Renaud |
| 27/10/2026 | Défaut du sélecteur de date de la 0.2.3 | Corrigé dans la 0.2.4 ; la 0.2.3 reste installée sur NIXUS en attendant et n'est pas publiée sur GitHub | Conducteur du projet (accord du 27/10/2026) |
| 27/10/2026 | Test du dépôt | Ne signale plus `tsconfig.tsbuildinfo`, déjà exclu par `.gitignore` | Claude |
| 27/10/2026 | Recette de la 0.2.4 sur NIXUS | 5 points sur 5 conformes : version, date en français et en néerlandais, calendrier dans la langue, enregistrement depuis la file, nom accentué intact | Conducteur du projet |
| 27/10/2026 | Publication de la 0.2.4 | Branche, demande de fusion #3, travail « tests » vert, fusion, étiquette `v0.2.4`, publication immuable avec l'archive ; empreinte vérifiée sur le PC | Conducteur du projet |
| 27/10/2026 | Alerte CodeQL sur `ci.yml` | « Workflow does not contain permissions » : à régler par `permissions: contents: read`, qui s'écarte du contenu type de la section 7 de GITHUB.md ; rien n'est modifié avant décision | À décider (conducteur du projet, puis Renaud pour GITHUB.md) |
| 03/11/2026 | Lot « connexion Microsoft, tickets, aide par écran » | Quatre versions : 0.2.5 (connexion), 0.2.6 (tickets), 0.2.7 (aide 1/2), 0.2.8 (aide 2/2) ; l'étape 3 garde le numéro 0.3.0 ; le « go » vaut accord sur les propositions par défaut de Claude | Conducteur du projet (« go » du 03/11/2026) |
| 03/11/2026 | Files de tickets | Le ticket porte l'entité du demandeur ; file IT (incident, bug, souhait) traitée par l'administrateur ; file métier (question) traitée par le gestionnaire du registre de l'entité du ticket ; question sans entité vers la file IT ; rôles de chaque file réglables dans Paramètres | Conducteur du projet (proposition de Claude par défaut) |
| 03/11/2026 | Captures dans les tickets | Champ capture absent des écrans qui affichent du courrier (registre, à enregistrer, enregistrer, consultations), avertissement ailleurs ; écart voulu au standard 13.5 (« capture facultative »), à consigner | Conducteur du projet (proposition de Claude par défaut) |
| 03/11/2026 | Connexion Microsoft | 0.2.5 livrée en mode `local` ; recette sur NIXUS en deux temps (non-régression et Paramètres maintenant, 7 points avec Portal après l'inscription Entra ID) ; bouton « Tester » minimal ajouté | Conducteur du projet (proposition de Claude par défaut) |
| 03/11/2026 | E23 | Traitée dans la 0.2.7 avec l'explication des champs, au lieu du début de la 0.3.0 | Conducteur du projet (proposition de Claude par défaut) |
| 03/11/2026 | Captures de l'aide | Produites par le script Playwright dans l'environnement de Claude, sur `atelier.exemple.json` (services fictifs) : aucun nom de service réel dans le dépôt public ; version de Playwright du standard (`^1.61.1`) si son navigateur s'installe, sinon information avant la 0.2.8 | Conducteur du projet (proposition de Claude par défaut) |
| 03/11/2026 | `qs` et `ci.yml` | `npm update qs` seul (6.16.2) et `permissions: contents: read` dans `ci.yml`, dans la 0.2.5 ; Renaud à informer, GITHUB.md à mettre à jour | Conducteur du projet (proposition de Claude par défaut) |
| 03/11/2026 | Redirection ouverte du gabarit | Corrigée dans l'interface (`safeNextPath`) ; à signaler à Renaud pour le gabarit 1.3.0 | Claude, constat du 03/11/2026 |
| 03/11/2026 | Recette de la 0.2.5 sur NIXUS | 6 contrôles sur 6 conformes (version et courriers, connexion locale et déconnexion avec message, Paramètres › Connexion, test sans annuaire, accès de secours des deux administrateurs, néerlandais) ; le mode « Microsoft obligatoire » n'a pas été touché | Conducteur du projet |
| 03/11/2026 | Publication de la 0.2.5 | Branche `version/v0.2.5`, demande de fusion n° 4, travail « tests » vert, fusion `2d7bb87`, étiquette `v0.2.5`, publication immuable avec l'archive ; empreinte SHA-256 identique sur le PC, sur GitHub et dans l'archive de Claude ; alerte CodeQL de `ci.yml` fermée | Conducteur du projet |
| 03/11/2026 | Délais ITIL des tickets | Ceux du gabarit : P1 1 h et 8 h, P2 4 h et 24 h, P3 8 h et 72 h, P4 24 h et 240 h (prise en charge, résolution), réglables dans Paramètres | Conducteur du projet (« go » du 03/11/2026) |
| 03/11/2026 | Version 0.2.6 | Tickets avec les décisions du 03/11/2026 sur les files par entité et les captures ; bloc nginx de 4 Mo ; pas de `--no-cache` (aucune dépendance changée) | Conducteur du projet (« go » du 03/11/2026) |
| 03/11/2026 | Recette de la 0.2.6 sur NIXUS | 8 contrôles sur 8 conformes (version, bouton « Signaler » et menu « Tickets », fenêtre sans capture sur le registre, `TCK-2026-00001`, incident sur Contacts avec champ de capture, `TCK-2026-00002`, liste et tiroir, contexte technique, réglages, néerlandais) ; la file métier avec un gestionnaire n'a pas été jouée sur NIXUS, aucun compte n'ayant ce rôle | Conducteur du projet |
| 03/11/2026 | Publication de la 0.2.6 | Branche `version/v0.2.6`, demande de fusion n° 5, travail « tests » vert, fusion `4871a46`, étiquette `v0.2.6`, publication immuable avec l'archive ; empreinte SHA-256 identique sur le PC, sur GitHub et dans l'archive de Claude | Conducteur du projet |
| 03/11/2026 | Parcours du centre d'aide | Un parcours par rôle (agent, responsable de service, secrétariat, gestionnaire du registre, auditeur, administrateur), choisi par défaut d'après les rôles de la personne, plus « tout le mode d'emploi » ; fiches classées dans l'ordre où le rôle s'en sert | Conducteur du projet (« go » du 03/11/2026) |
| 03/11/2026 | Version 0.2.7 | Aide par écran 1/2 : 14 fiches FR et NL, panneau latéral, centre d'aide, explication de chaque champ, contrôles bloquants ; repères numérotés et captures en 0.2.8 ; E23 corrigée en partie, relevé de Chrome à la recette | Conducteur du projet (« go » du 03/11/2026) |

## 2. Règles de travail convenues

Elles s'ajoutent aux règles du standard (section 2).

1. Déploiement pas à pas : une seule commande à la fois, avec son résultat attendu, et la suivante seulement après le résultat de la précédente. Ne jamais donner toute la procédure d'un bloc.
2. Chaque commande ou action dit explicitement où l'exécuter : PC (PowerShell, navigateur, File Station) ou NIXUS (session SSH).
3. Les notes de livraison gardent la procédure complète ; la conversation la donne étape par étape.
4. Aucun mot de passe ni secret dans une capture : masquer avant d'envoyer, ou décrire au lieu de capturer.
5. Un attendu annoncé qui s'avère faux est corrigé ouvertement (exemple : l'étiquette d'acceptance n'apparaît pas sur l'écran de connexion).
6. Avant une capture de contrôle d'affichage, remettre le zoom du navigateur à 100 % (Ctrl + 0).
7. Pour l'enregistrement du courrier, l'administrateur doit aussi avoir un rôle de secrétariat ou de gestionnaire dans l'entité.
8. Avant de livrer un changement d'outil de construction ou de dépendance de l'interface : comparer, en français et en néerlandais, les textes et les captures de toutes les pages avec la version précédente, avec un compte qui a les rôles de secrétariat. Les tests tournent sous Node et ne voient pas les défauts du moteur de construction.
9. Le navigateur peut ranger les téléchargements dans un dossier OneDrive : GITHUB.md attend `Téléchargements`. Chercher l'archive (`Get-ChildItem -Path $HOME -Recurse -Filter <archive>`), puis la copier dans `Téléchargements` avant la section 5.
10. Les commandes de NIXUS (session SSH) et celles de GitHub (PowerShell du PC) se tapent dans deux fenêtres distinctes : `exit` ferme la session SSH avant les commandes GitHub.

## 3. Actions à faire

| # | Action | Pour qui | Échéance |
| --- | --- | --- | --- |
| 1 | Fournir les captures d'iCourrier et la journée type du secrétariat de l'AC (I-01, I-02), confirmer le circuit par défaut (D-16) | Conducteur du projet, l'utilisatrice clé de l'AC | Avant l'étape 3 |
| 2 | Régler les copieurs pour qu'ils produisent des PDF (D-24) | IT | Avant l'étape 12 |
| 3 | Créer le compte de l'utilisatrice clé de l'AC sur NIXUS avec le rôle AC · Secrétariat et organiser l'atelier | Conducteur du projet | Dès que possible |
| 4 | Captures des écrans d'iCourrier et journée type du secrétariat de l'AC (I-01, I-02) | l'utilisatrice clé de l'AC | Avant l'étape 3 |
| 5 | Types de courrier réels et délais (I-04) | l'utilisatrice clé de l'AC | Avant l'étape 9 |
| 6 | Désigner l'utilisatrice clé du CPAS (D-17) et le service qui enregistre le courrier du CPAS (D-22) | Conducteur du projet | Avant l'étape 13 |
| 7 | Demander l'inscription d'application Entra ID (une inscription pour courrier, adresse de retour `https://<adresse>/api/auth/callback` exacte, consentement administrateur pour `openid profile email`, comptes du locataire seulement). Vérifier à la création si le portail accepte une adresse IP ; sinon prévoir un nom DNS | Administrateur du locataire Microsoft 365 | Avant la recette réelle de la 0.2.5 |
| 8 | Fournir l'archive de PILOT (pont PostgreSQL, `oidc.js`, `oauth.js`) | Conducteur du projet | Avant l'étape 7 |
| 9 | Réparer la notification par courriel de NIXUS (Panneau de configuration › Notification › Courriel) | IT | Avant toute production |
| 10 | Obtenir d'l'éditeur de l'ancien outil le format d'export et la clause de restitution (I-06) | Renaud | Avant l'étape 22 |
| 11 | Volumes de courrier, copieurs, boîtes partagées, modèles en usage (I-03, I-05, I-07, I-08) | Métier, IT | Selon les étapes 2, 11, 12 |
| 12 | Envoyer à Renaud le courriel (raisons et impact sur le standard, `@vitejs/plugin-react` 6, `npm audit fix` de la 0.2.2) ; revérifier les alertes CodeQL après la mise en production | Conducteur du projet | Courriel : maintenant |
| 13 | Ajouter à `docs/SECURITE.md` que `npm audit` ne signale pas `multer` : fait en 0.2.3. Corriger `sudo` devant `ls -t` : fait dans le dépôt en 0.2.3 | Claude | Fait |
| 14 | Mettre à jour le contenu type de `ci.yml` dans GITHUB.md avec `permissions: contents: read` (E28 : appliqué en 0.2.5) ; informer Renaud de `qs` (E31), du bouton « Tester » (E32) et des deux défauts du gabarit 1.3.0 (E29 nginx 1 Mo, E30 redirection ouverte) | Conducteur du projet, Renaud | Avec la 0.2.5 |
| 15 | Informer Renaud de la restriction des captures de tickets sur les écrans de courrier (E35), du garde-fou sur l'écran déclaré (E36) et de la limite nginx de 1 Mo du gabarit, corrigée par un bloc dédié (E29) | Conducteur du projet | Avec la 0.2.6 |
| 16 | Relever les remarques de Chrome (F12, onglet Issues) sur Enregistrer un courrier, Utilisateurs (création), Paramètres, Tickets (signalement) et le centre d'aide, puis les transmettre à Claude (E23) | Conducteur du projet | À la recette de la 0.2.7 |
| 17 | Examiner l'alerte Dependabot n° 29 sur GitHub (Security › Dependabot) et dire s'il s'agit de la chaîne `eslint` (E34, E38) | Conducteur du projet | Avant la 0.2.8 |
