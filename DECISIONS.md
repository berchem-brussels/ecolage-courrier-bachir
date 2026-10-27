# Décisions et actions

Application courrier · version 0.2.2 · journal au 27/10/2026

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
| 27/10/2026 | Verrou du serveur | `body-parser` 1.20.9 et `fast-uri` 3.1.9 par `npm audit fix`, `package.json` inchangé : l'étape `npm audit` de la CI échouait sur deux avis parus depuis le 20/10/2026 | Claude, mesure du 27/10/2026 |
| 27/10/2026 | Dossier des sauvegardes | `backup.sh` le déduit du dossier de l'application (`backups/<APP_NAME>` deux niveaux au-dessus) ; même emplacement sur NIXUS, à contrôler après la mise à jour | Claude, à vérifier sur NIXUS |

## 2. Règles de travail convenues

Elles s'ajoutent aux règles du standard (section 2).

1. Déploiement pas à pas : une seule commande à la fois, avec son résultat attendu, et la suivante seulement après le résultat de la précédente. Ne jamais donner toute la procédure d'un bloc.
2. Chaque commande ou action dit explicitement où l'exécuter : PC (PowerShell, navigateur, File Station) ou NIXUS (session SSH).
3. Les notes de livraison gardent la procédure complète ; la conversation la donne étape par étape.
4. Aucun mot de passe ni secret dans une capture : masquer avant d'envoyer, ou décrire au lieu de capturer.
5. Un attendu annoncé qui s'avère faux est corrigé ouvertement (exemple : l'étiquette d'acceptance n'apparaît pas sur l'écran de connexion).
6. Avant une capture de contrôle d'affichage, remettre le zoom du navigateur à 100 % (Ctrl + 0).
7. Pour l'enregistrement du courrier, l'administrateur doit aussi avoir un rôle de secrétariat ou de gestionnaire dans l'entité.

## 3. Actions à faire

| # | Action | Pour qui | Échéance |
| --- | --- | --- | --- |
| 1 | Fournir les captures d'iCourrier et la journée type du secrétariat de l'AC (I-01, I-02), confirmer le circuit par défaut (D-16) | Conducteur du projet, l'utilisatrice clé de l'AC | Avant l'étape 3 |
| 2 | Régler les copieurs pour qu'ils produisent des PDF (D-24) | IT | Avant l'étape 12 |
| 3 | Créer le compte de l'utilisatrice clé de l'AC sur NIXUS avec le rôle AC · Secrétariat et organiser l'atelier | Conducteur du projet | Dès que possible |
| 4 | Captures des écrans d'iCourrier et journée type du secrétariat de l'AC (I-01, I-02) | l'utilisatrice clé de l'AC | Avant l'étape 3 |
| 5 | Types de courrier réels et délais (I-04) | l'utilisatrice clé de l'AC | Avant l'étape 9 |
| 6 | Désigner l'utilisatrice clé du CPAS (D-17) et le service qui enregistre le courrier du CPAS (D-22) | Conducteur du projet | Avant l'étape 13 |
| 7 | Demander l'inscription d'application Entra ID pour la connexion Microsoft 365 | Administrateur du locataire Microsoft 365 | Avant l'étape 7 |
| 8 | Fournir l'archive de PILOT (pont PostgreSQL, `oidc.js`, `oauth.js`) | Conducteur du projet | Avant l'étape 7 |
| 9 | Réparer la notification par courriel de NIXUS (Panneau de configuration › Notification › Courriel) | IT | Avant toute production |
| 10 | Obtenir de l'éditeur de l'ancien outil le format d'export et la clause de restitution (I-06) | Renaud | Avant l'étape 22 |
| 11 | Volumes de courrier, copieurs, boîtes partagées, modèles en usage (I-03, I-05, I-07, I-08) | Métier, IT | Selon les étapes 2, 11, 12 |
| 12 | Premier envoi de la 0.2.2 sur GitHub (GITHUB.md, section 4.2), vérifier le passage vert des tests (onglet Actions), activer la protection de `main` | Conducteur du projet | Après la recette de la 0.2.2 sur NIXUS |
