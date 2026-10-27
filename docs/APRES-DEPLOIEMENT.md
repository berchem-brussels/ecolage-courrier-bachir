# Après déploiement

Application courrier · version 0.2.4 · journal des déploiements au 27/10/2026

Ce fichier reprend en tête les procédures sur NIXUS, puis un bloc par version déployée, la plus récente d'abord. Les commandes se donnent une à une dans la conversation, avec leur résultat attendu, et la suivante n'arrive qu'après le résultat de la précédente. Chaque commande dit sur quelle machine elle s'exécute.

## 1. Procédures

### 1.1 Règles

1. File Station sert seulement à créer le dossier et à téléverser l'archive.
2. Tout le reste se fait en SSH, depuis PowerShell sur le PC : `ssh utilisateur@192.0.2.10`. Le message `Could not chdir to home directory` est sans conséquence.
3. Aucun fichier ne s'édite à la main sur le NAS. Le `.env` ne se recrée jamais.
4. Une sauvegarde précède toute mise à jour.
5. L'ancien code (`backend`, `frontend`, `docs`) est retiré avant l'extraction.
6. Le script d'atelier écrit dans la base : le conteneur `courrier-api` doit être arrêté pendant qu'il tourne.
7. En cas de problème, les journaux d'abord : `sudo docker logs courrier-api --tail 30`.
8. Aucun mot de passe ni secret dans une capture envoyée à Claude.

### 1.2 Mise à jour (modèle, à adapter au numéro livré)

Sur le PC, dans File Station : téléverser `courrier-vX_Y_Z.tar.gz` dans `docker/courrier`, à côté des archives précédentes.

Sur NIXUS, en SSH, une commande à la fois :

| # | Commande | Résultat attendu |
| --- | --- | --- |
| 1 | `cd /srv/docker/courrier` | L'invite affiche le dossier |
| 2 | `ls -l courrier-vX_Y_Z.tar.gz` | Le fichier, à la taille annoncée dans les notes de livraison |
| 3 | `sudo bash backup.sh` | `sauvegarde terminée, N sauvegardes conservées` ; N proche du nombre de jours depuis le 13/10/2026 |
| 4 | `sudo rm -rf backend frontend docs` | Aucun message |
| 5 | `sudo tar xzf courrier-vX_Y_Z.tar.gz --strip-components=1` | Aucun message |
| 6 | `ls backend frontend` | Le contenu des deux dossiers |
| 7 | `sudo sh -c 'date; docker compose build; date'`, avec `build --no-cache` quand les notes l'annoncent (Dockerfile ou dépendance modifiés) | Aucune ligne `ERROR` ; `naming to docker.io/library/courrier-backend` et `courrier-frontend` |
| 8 | Seulement si les notes le demandent : `sudo docker compose stop backend`, puis la commande ponctuelle des notes (script d'atelier, changement de propriétaire du volume) | `Container courrier-api Stopped`, puis la sortie annoncée |
| 9 | `sudo docker compose up -d` | `courrier-api Healthy`, `courrier-web Started` |
| 10 | `sudo docker compose ps` | Les deux conteneurs `Up (healthy)` |
| 11 | `curl -sk https://localhost:8450/api/version` | `{"data":{"version":"X.Y.Z"},"meta":{"envelope":1,"version":"X.Y.Z"}}` |

Puis, dans le navigateur du PC : `https://192.0.2.10:8450`, recharger avec Ctrl + F5, et suivre la liste de contrôle des notes de livraison.

Retour arrière : rejouer les étapes 3 à 11 avec l'archive précédente, restée dans le dossier, sans le script d'atelier. La base ne se restaure (depuis `/srv/backups/courrier`) que si la version retirée a appliqué une migration.

### 1.3 Première installation

Faite le 13/10/2026 (bloc 0.1.0). La procédure complète est dans `NOTES_LIVRAISON_v0.1.0.md` de l'archive. Elle ne se rejoue pas : le dossier, le `.env`, les volumes et la tâche de sauvegarde existent.

## 2. Version 0.2.4, préparée le 27/10/2026

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_2_4.tar.gz` : à relever |
| Sauvegarde avant mise à jour | À relever |
| Construction | `docker compose build` (sans `--no-cache`, dépendances inchangées) : à relever |
| Démarrage | À relever |
| Version et compte | À relever |
| Liste de contrôle à l'écran | À relever |
| Dépôt GitHub | Branche `version/v0.2.4`, demande de fusion, travail « tests », étiquette `v0.2.4`, publication : à relever |

## 3. Version 0.2.3, déployée le 27/10/2026, défaut relevé à la recette, remplacée par la 0.2.4

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_2_3.tar.gz`, 1 261 418 octets, identique au fichier livré ; même taille sur NIXUS |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 22 sauvegardes conservées.` à 15:44:46 |
| Construction | `docker compose build --no-cache` : 30 étapes sur 30, sans erreur ; 15:45:58 à 15:49:12, soit 3 min 14 s (194,0 s) ; `npm ci` de l'interface sous npm 10 a relu le verrou écrit par npm 11 ; `npm run build` en 43,5 s |
| Démarrage | `courrier-api Healthy` en 92,7 s, `courrier-web Started` en 83,5 s ; les deux conteneurs `(healthy)` après environ 1 min 30 |
| Version et compte | `{"data":{"version":"0.2.3"},"meta":{"envelope":1,"version":"0.2.3"}}` ; `id -u` = `10001` |
| Liste de contrôle à l'écran | `v0.2.3` au bas du menu ; `AC-2026-000001` à `AC-2026-000005` conservés avec leurs trombones ; fiche de `AC-2026-000004` avec ses deux fichiers lisibles ; TIFF refusé avec sa raison ; dépôt de `Pièce fictive.pdf` : aperçu et formulaire affichés. Non conforme : sélecteur de date de « Enregistrer ce fichier » en anglais et au format `10/27/2026`. Contrôle interrompu, corrigé en 0.2.4 |
| Dépôt GitHub | Non publiée : le défaut a été relevé avant l'envoi |
| Fichier laissé dans la file | `Pièce fictive.pdf` déposé pendant la recette, non enregistré : il reste dans la file « À enregistrer » de l'entité AC |

## 4. Version 0.2.2, déployée et recettée le 27/10/2026

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_2_2.tar.gz`, 1 271 020 octets, identique au fichier livré ; même taille sur NIXUS |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 20 sauvegardes conservées.` à 14:05:09 (ancien script) |
| Construction | `docker compose build` : 30 étapes sur 30, sans erreur ; 14:06:06 à 14:08:11, soit 2 min 5 s (124,3 s) ; `npm ci` rejoué, création d'`appuser` et `openssl` réutilisés |
| Démarrage | `courrier-api Healthy` en 47,6 s, `courrier-web Started` en 42,6 s ; `courrier-web` `(healthy)` après environ 1 min 30 (les contrôles lancés avant ce délai affichaient `health: starting`) |
| Version | `{"data":{"version":"0.2.2"},"meta":{"envelope":1,"version":"0.2.2"}}` |
| Dossier des sauvegardes | Seconde sauvegarde avec le nouveau `backup.sh` à 14:11:02 : `21 sauvegardes conservées` ; `sudo ls -t /srv/backups/courrier` : `courrier-20261027-1411`, `-1405`, `-0200`. Même dossier qu'avant. Sans `sudo`, `ls` répond `Permission denied` (dossier de root) : la commande des notes de la 0.2.2 est à corriger dans la 0.2.3 |
| Liste de contrôle à l'écran | 3 points sur 3 conformes : `v0.2.2` au bas du menu ; `AC-2026-000001` (annulé) à `AC-2026-000005` présents avec leurs trombones (1, 2, 1, 1) ; fiche de `AC-2026-000004` avec ses deux fichiers lisibles ; écran « À enregistrer » affiché, file vide. Registre du CPAS et `id -u` non contrôlés |
| Dépôt GitHub | Dépôt créé à la main le 27/10/2026 dans l'organisation (public, description « Exercice de formation, non destiné à la production ») ; l'option « Add README » avait été activée à la création, d'où un premier commit `fddd7e0` écrasé par `git push -u origin main --force` (commit `fa27fa9`, 139 fichiers) ; étiquette `v0.2.2` poussée ; travail « tests » #1 vert en 1 min 47 s ; publication `v0.2.2` immuable (« Latest ») avec `courrier-v0_2_2.tar.gz`, empreinte `sha256:b9597d1e822c…` |
| Constats | Dependabot a ouvert deux demandes de fusion (#1 `@vitest/mocker` et `vitest`, #2 `vite`) et CodeQL s'est configuré tout seul ; l'onglet « Security and quality » affiche 38 signalements : 0 secret, 28 Dependabot (10 hautes sur `multer`, 15 sur `vite`, `launch-editor`, `vitest`, `esbuild`), 10 CodeQL sur `pieces.js` ; rien n'est fermé |
| Protection de `main` | Règle `protection-main` créée et active : demande de fusion, travail « tests » obligatoire, suppression et `--force` interdits, liste de contournement vide, cible `main` |

## 5. Version 0.2.1, déployée le 20/10/2026, recettée le 27/10/2026

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_2_1.tar.gz`, 1 439 023 octets, identique au fichier livré |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 12 sauvegardes conservées.` à 19:24:52 |
| Construction | `docker compose build` : 30 étapes sur 30, sans erreur ; 19:27:09 à 19:32:30, soit 5 min 21 s (315,2 s). Les `npm ci` sont rejoués parce que le numéro de version change `package.json` ; création d'`appuser` et `openssl` réutilisés |
| Démarrage | `courrier-api Healthy` en 63,0 s, `courrier-web Started` en 54,9 s |
| Version et compte | `{"data":{"version":"0.2.1"},"meta":{"envelope":1,"version":"0.2.1"}}` ; `id -u` = `10001` |
| Liste de contrôle à l'écran (27/10/2026) | 6 points sur 6 conformes : version et données conservées ; TIFF glissé refusé avec « Fichier TIFF refusé : réglez le copieur pour produire des PDF. » ; enregistrement depuis la file (`AC-2026-000004`, puis `AC-2026-000005`) et grande barre verte effacée au dépôt suivant ; trombone de `AC-2026-000004` passé à « 2 » sans rechargement ; onglet « Issues » de Chrome à 0 erreur et 0 avertissement (20 remarques d'information, écart E23) ; mention « Valeur livrée » présente après enregistrement |

## 6. Version 0.2.0, déployée le 20/10/2026

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_2_0.tar.gz`, 1 432 687 octets, identique au fichier livré |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 10 sauvegardes conservées.` à 15:34:59 |
| Construction | `docker compose build --no-cache` : 30 étapes sur 30, sans erreur ; 15:36:44 à 15:48:03, soit 11 min 19 s (673,5 s) ; étape `addgroup ... appuser` passée ; interface construite en 107,1 s |
| Arrêt du serveur | `Container courrier-api Stopped` |
| Propriétaire du volume | `chown -R 10001:10001 /app/data` sans message ; `ls -ln` : `app.db` (184 320 octets) en `10001 10001` |
| Démarrage | `courrier-api Healthy` en 90,9 s, `courrier-web Started` en 92,6 s ; deux conteneurs `Up (healthy)` ; ports 8450 et 8090 inchangés |
| Version et compte | `{"data":{"version":"0.2.0"},"meta":{"envelope":1,"version":"0.2.0"}}` ; `id -u` = `10001` |
| Journal du serveur | `[DB] Migration 005_pieces_consultations appliquée`, `[APP] API 0.2.0 sur le port 3001`, aucune erreur |
| Fichiers dans la sauvegarde | `sauvegarde terminée, 11 sauvegardes conservées.` à 16:01:11 ; `data/pieces/2026/10/b801c9216d262cec1c316f9a098d930b.pdf` présent dans l'archive |
| Liste de contrôle à l'écran | 12 points conformes sur 13 : version et menus, données conservées, aperçu PDF lisible dans Chrome, enregistrement depuis la file (`AC-2026-000003`), rejet avec motif, registre et fiche (téléchargement de 668 octets, identique), ajout d'un fichier à `AC-2026-000002`, journal de l'auditeur, taille maximale réglable (refus à 1 Mo), néerlandais, thème sombre, affichage étroit (501 px). Non conforme : point 5 (TIFF écarté sans message). Relevé en marge du point 8 : trombone du registre non mis à jour sans F5. Console : huit signalements d'étiquettes. Corrigés en 0.2.1 |
| Comptes | « Test Auditeur » (AC · Auditeur) créé pour le point 9, puis désactivé ; son mot de passe est passé dans la conversation |

## 7. Version 0.1.1, déployée le 20/10/2026

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_1_1.tar.gz`, 1 045 070 octets, identique au fichier livré |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 9 sauvegardes conservées` à 11:25:37 : la tâche quotidienne tourne depuis le 14/10/2026 |
| Construction | 28 étapes sur 28, sans erreur ; 11:27:30 à 11:39:51, soit 12 min 21 s (739,8 s) ; interface construite en 133 s |
| Script d'atelier | `2 paramètres, 0 services, 0 types, 0 contacts ajoutés ; 21 services mis à jour` |
| Démarrage | `courrier-api Healthy` en 136,4 s, `courrier-web Started` |
| État | Deux conteneurs `Up (healthy)`, recréés |
| Version | `{"data":{"version":"0.1.1"},"meta":{"envelope":1,"version":"0.1.1"}}` |
| Liste de contrôle à l'écran | 8 points sur 8 conformes : onglet « Courrier » et « Briefwisseling », nom de l'administration sur deux lignes, v0.1.1, cadre « Entités », services sans « NL à valider » avec RD et SCAD renommés, seul « Fermer » après création d'un compte, menu mis à jour sans F5, « Inkomende post » entier, données conservées |
| Comptes | « Version Essai » créé pour le test, puis désactivé |

## 8. Version 0.1.0, installée le 13/10/2026

| Étape | Résultat relevé |
| --- | --- |
| Ports | 8450 et 8090 libres côté Docker et côté hôte (contrôle manuel puis `verifier-ports.sh`) |
| `.env` | Sept variables créées par commande, droits 600 |
| Construction | 28 étapes sur 28 ; 16:25:31 à 16:34:11, soit 8 min 40 s (514,6 s) |
| Script d'atelier | Réseau et volumes créés ; migrations 001 à 004 ; entités et registres de référence ; `2 paramètres, 24 services, 15 types, 6 contacts ajoutés` |
| Démarrage | `courrier-api Healthy` en 35,9 s, `courrier-web Started` |
| Version et compte du serveur | `0.1.0` ; `id -u` = 1000 |
| Premier administrateur | Créé par l'écran d'installation ; rôle AC · Secrétariat ajouté ensuite |
| Liste de contrôle à l'écran | Enregistrement `AC-2026-000001`, recherche, fiche, annulation avec motif, `AC-2026-000002` avec nouveau contact, cloisonnement (compte CPAS sans accès à l'AC), néerlandais et `CPAS-2026-000001`, affichage mobile : tout conforme |
| Sauvegarde | Tâche DSM « Sauvegarde courrier » créée, quotidienne à 02:00, utilisateur root ; premier lancement manuel « Normal (0) », fichier `courrier-20261013-1715.tar.gz` de 9 423 octets |
| Défauts relevés | Six défauts d'affichage, corrigés en 0.1.1 |
| Comptes | « CPAS Test » créé pour le cloisonnement, désactivé ensuite |
| Constats hors application | Notification par courriel de DSM en panne ; tâches de PILOT désactivées dans le Planificateur, laissées telles quelles |
